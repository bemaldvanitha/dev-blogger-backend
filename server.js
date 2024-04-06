const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());

// connect database
connectDB();

// init middleware
app.use(
    express.json({
        extended: false,
    })
);

app.get('/',(req,res) => {
    return res.send('api running');
});

// define routes
app.use('/api/users',require('./routes/api/users'));
app.use('/api/auth',require('./routes/api/auth'));
app.use('/api/profile',require('./routes/api/profile'));
app.use('/api/posts',require('./routes/api/posts'));

app.listen(PORT,() => {
    console.log(`server started on port ${PORT}`);
})