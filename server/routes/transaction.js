const express = require('express');
const { verifyToken } = require('../middleware/auth');
const router = express.Router()
const db = require('../config/db')
const { ref, set, serverTimestamp, update } = require('firebase/database')
const { realtTimeDb } = require('../config/firebase')

//protect all transaction routes
router.use(verifyToken)

//get all transactions for current user
router.get('/', async (req, res) => {
    try {
        const { uid } = req.user;

        const userResult = await db.query(
            'SELECT id FROM users WHERE firebase_uid = $1',
            [uid]
        )

        if(userResult.rowCount == 0){
            return res.status(404).json({
                message: "user not found"
            })
        }

        const userId = userResult.rows[0].id;

        const transactions = await db.query(
            `SELECT t.*, c.name as category_name, c.icon as category_icon
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = $1
            ORDER BY t.date DESC`,
            [userId]
        )

        return res.status(200).json({
            transactions: transactions.rows
        });

    } catch (error) {
        console.error("error getting transactions", error)
        return res.status(500).json({
            message: "failed to retrieve transactions",
            error: error.message
        })
    }
})


//post new transactions
router.post('/', async(req, res) => {
    try {
        const { amount, category_id, description, date, currency } = req.body;
        const { uid } = req.user;

        const userResult = await db.query(
            'SELECT id FROM users WHERE firebase_uid = $1',
            [uid]
        )

        if(userResult.rowCount === 0){
            return res.status(404).json({
                message: 'user not found'
            })
        }

        const userId = userResult.rows[0].id

        const result = await db.query(
            `INSERT INTO transactions
            (user_id, amount, category_id, description, date, currency)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [userId, amount, category_id, description, date, currency || 'USD']
        )

        const newTransaction = result.rows[0];

        //update firebase realtime db for instant ui updates
        const transactionRef = ref(
            realtTimeDb,
            `users/${uid}/latest_transactions/${newTransaction.id}`
        )

        await set(transactionRef, {
            id: transactionRef.id,
            amount: transactionRef.amount,
            category_id: transactionRef.category_id,
            description: transactionRef.description,
            date: transactionRef.date,
            created_at: serverTimestamp()
        })

        //update budget status in firebase
        if (category_id){
            //get budget for this category
            const budgetResult = await db.query(
                `SELECT * FROM budgets
                WHERE user_id = $1 AND category_id = $2
                AND $3 BETWEEN start_date AND COALESCE(end_date, CURRENT_DATE + 365)`,
                [userId, category_id, date]
            )

            if (budgetResult.rowCount > 0){
                const budget = budgetResult.rows[0]
                //get total for this budget period
                const spentResult = await db.query(
                    `SELECT SUM(amount) as total_spent
                    FROM transactions
                    WHERE user_id = $1 AND category_id = $2
                    AND date BETWEEN $3 AND COALESCE(end_date, CURRENT_DATE + 365)`,
                    [userId, category_id, budget.start_date, budget.end_date]
                )

                const total_spent = spentResult.rows[0].total_spent || 0

                //update budget status
                const budgetStatusRef = ref(
                    realtTimeDb,
                    `users/${uid}/budget_status/${budget.id}`
                )

                await set(budgetStatusRef, {
                    budget_id: budget.id,
                    category_id: budget.category_id,
                    budget_amount: budget.amount,
                    spent_amount: total_spent,
                    percentage: (total_spent/amount)*100,
                    updated_at: serverTimestamp()
                })
            }
        }

        return res.status(201).json(newTransaction)

    } catch (error) {
        console.error('error creating transaction:', error);
        return res.status(500).json({
            message: 'failed to create transaction', 
            error: error.message 
        });
    }
})


//UPDATE , DELETE, ETC LATER

module.exports = router;