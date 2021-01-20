const express = require('express');
const { check,validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt = require('jsonwebtoken');

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

// @route POST api/auth
// @desc Authenticate User and get token
// @access Public

router.post('/',[

    check('email','email is required').isEmail(),
    check('password','password is required').exists(),

], async (req,res) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const { email, password } = req.body;

    try{

        let user = await User.findOne({
            email: email
        });

        if(!user){
            return res.status(400).json({
                errors: [
                    { msg: 'invalid credentials' }
                ]
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({
                errors: [
                    { msg: 'invalid credentials' }
                ]
            });
        }

        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            {
                expiresIn: 3600000
            },
            (err,token) => {
                if(err){
                    throw err;
                }

                return res.json({
                    token: token
                });
            }
        );

    }catch (err){
        console.error(err.message);
        return res.status(500).send('server error');
    }

});

module.exports = router;