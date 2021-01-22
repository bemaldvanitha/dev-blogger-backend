const express = require('express');
const { check, validationResult } = require('express-validator');
const normalize = require('normalize-url');

const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

const router = express.Router();

// @route GET api/profile/me
// @desc Get current user profile
// @access Private

router.get('/me',auth, async (req,res) => {
    try{
        const profile = await Profile.findOne({ user: req.user.id })
            .populate('user',['name','avatar']);

        if(!profile){
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }

        return res.json(profile);

    }catch (err){
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

// @route POST api/profile
// @desc Create or update user profile
// @access Private

router.post('/', [
    auth,
    [
        check('status','status is required').not().isEmpty(),
        check('skills','skills is required').not().isEmpty(),
    ]
], async (req,res) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const { company, location, website, bio, skills, status, githubusername,
        youtube, twitter, instagram, linkedin, facebook } = req.body;

    // build profile object

    const profileFields = {
        user: req.user.id,
        company,
        location,
        website: website && website !== '' ? normalize(website, { forceHttps: true }) : '',
        bio,
        skills: Array.isArray(skills)
            ? skills
            : skills.split(',').map((skill) => ' ' + skill.trim()),
        status,
        githubusername
    };

    // Build social object and add to profileFields
    const socialfields = { youtube, twitter, instagram, linkedin, facebook };

    for (const [key, value] of Object.entries(socialfields)) {
        if (value && value.length > 0)
            socialfields[key] = normalize(value, { forceHttps: true });
    }
    profileFields.social = socialfields;

    try {

        // Using upsert option (creates new doc if no match is found):
        let profile = await Profile.findOneAndUpdate(
            { user: req.user.id },
            { $set: profileFields },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

module.exports = router;