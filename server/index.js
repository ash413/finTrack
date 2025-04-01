const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transaction')

const app = express()

app.use(express.json())
app.use(cors())

//routes
app.get('/', (req,res) => {
    res.status(200).json('Backend working!')
})
app.use('/auth', authRoutes)
app.use('transaction', transactionRoutes)

//error handlers
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "somethign went wrong",
        error: err.message
    })
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});