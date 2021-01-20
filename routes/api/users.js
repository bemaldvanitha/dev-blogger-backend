const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

const router = express.Router();

// @route POST api/users
// @desc Register User
// @access Public

router.post('/',[

    check('name','Name is required').not().isEmpty(),
    check('email','include valid email').isEmail(),
    check('password','please enter with 6 char').isLength({min: 6}),

], async (req,res) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const { name, email, password } = req.body;

    try{

        let user = await User.findOne({
            email: email
        });

        if(user){
            return res.status(400).json({
                errors: [
                    { msg: 'User already exists' }
                ]
            });
        }

        const avatar = gravatar.url(email,{
            s: '200',
            r: 'pg',
            d: 'mm',
        });

        user = new User({
            name: name,
            email: email,
            password: password,
            avatar: avatar,
        });

        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password,salt);

        await user.save();

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