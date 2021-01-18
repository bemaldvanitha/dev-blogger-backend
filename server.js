const express = require('express');

const PORT = process.env.PORT || 5000;

const app = express();

app.get('/',(req,res) => {
    return res.send('api running');
})

app.listen(PORT,() => {
    console.log(`server started on port ${PORT}`);
})