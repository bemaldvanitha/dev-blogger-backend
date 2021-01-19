const express = require('express');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// @route POST api/users
// @desc Register User
// @access Public

router.post('/',[

    check('name','Name is required').not().isEmpty(),
    check('email','include valid email').isEmail(),
    check('password','please enter with 6 char').isLength({min: 6}),

],(req,res) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    console.log(req.body);
    return res.send('User route');

});

module.exports = router;