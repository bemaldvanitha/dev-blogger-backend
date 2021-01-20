const express = require('express');

const auth = require('../../middleware/auth');
const User = require('../../models/User');

const router = express.Router();

// @route GET api/auth
// @desc test route
// @access Private

router.get('/', auth , async (req,res) => {

    try{

        const user = await User.findById(req.user.id).select('-password');
        return res.json(user);

    }catch (err){

        console.error(err.message);
        return res.status(500).send('Server error');

    }

});

module.exports = router;