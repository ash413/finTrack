const express = require('express')


const app = express()


app.get('/', (req,res) => {
    res.status(200).json('Backend working!')
})

app.listen(3000)