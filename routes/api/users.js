const express = require('express');
const router = express.Router();

// @route GET api/users
// @desc test route
// @access Public

router.get('/',(req,res) => {
    return res.send('User route');
});

module.exports = router;