const express = require('express');

const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const app = express();

// connect database
connectDB();

app.get('/',(req,res) => {
    return res.send('api running');
})

app.listen(PORT,() => {
    console.log(`server started on port ${PORT}`);
})