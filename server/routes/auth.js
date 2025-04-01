const express = require('express')
const router = express.Router()

const { admin } = require('../config/firebase')
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth')

//register user after OAuth sign-in
router.post('/register', verifyToken, async(req, res) => {
    try {
        const { uid, email, name, picture } = req.user;

        const userExists = await db.query(
            'SELECT * FROM users WHERE firebase_uid = $1',
            [uid]
        );

        if(userExists.rowCount === 0){
            //create new user since it doesnt exist
            const newUser = await db.query(
                'INSERT INTO users (firebase_uid, email, name, profile_picture) VALUES ($1, $2, $3, $4) RETURNING *',
                [uid, email, name || '', picture || '']
            )
            
            return res.status(201).json({
                message: 'new user created successfully!',
                user: newUser.rows[0]
            })
        }

        //user already exists
        return res.status(200).json({
            message: 'user already exists',
            user: userExists.rows[0]
        })

    } catch (error) {
        console.error('registration error: ', error)
        return res.status(500).json({
            message: 'registration failed',
            error: error.message
        })
    }
})


//get user profile
router.get('/me', verifyToken, async(req, res) => {
    try {
        const { uid } = req.user

        const userResults = await db.query(
            'SELECT id, email, name, profile_picture, default_currency, created_at FROM users WHERE firebase_uid = $1',
            [uid]
        )

        if (userResult.rowCount === 0) {
            return res.status(404).json({
                message: 'user not found'
            });
        }
        
        return res.status(200).json({
            user: userResult.rows[0]
        });

    } catch (error) {
        console.error('error getting user:', error);
        return res.status(500).json({
            message: 'failed to retrieve user data',
            error: error.message
        });
    }
})

module.exports = router;