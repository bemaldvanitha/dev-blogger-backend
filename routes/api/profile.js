const express = require('express');
const { check, validationResult } = require('express-validator');
const normalize = require('normalize-url');
const request = require('request');
const config = require('config');

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
        return res.status(500).send('Server Error');
    }

});

// @route GET api/profile
// @desc Get all profiles
// @access Public

router.get('/',async (req,res) => {

    try {
        const profiles = await Profile.find()
            .populate('user',['name','avatar']);

        return res.json(profiles);

    }catch (err){
        console.log(err.message);
        return res.status(500).send('Server error');
    }
});

// @route GET api/profile/user/:user_id
// @desc Get all profiles
// @access Public

router.get('/user/:user_id',async (req,res) => {

    try {
        const profile = await Profile.findOne({ user: req.params.user_id })
            .populate('user',['name','avatar']);

        if(!profile){
            return res.status(400).json({ msg: 'profile not found' });
        }

        return res.json(profile);

    }catch (err){
        console.log(err.message);

        if(err.kind === 'ObjectId'){
            return res.status(400).json({ msg: 'profile not found' });
        }

        return res.status(500).send('Server error');
    }
});

// @route DELETE api/profile
// @desc Delete profile , user and post
// @access Private

router.delete('/',auth,async (req,res) => {

    try {
        // remove profile
        await Profile.findOneAndRemove({ user: req.user.id });
        await User.findOneAndRemove({ _id: req.user.id });

        return res.json({ msg: 'User removed' });

    }catch (err){
        console.log(err.message);
        return res.status(500).send('Server error');
    }
});

// @route PUT api/profile/experience
// @desc Add profile experience
// @access Private

router.put('/experience',[
    auth,
    [
        check('title','title is required').not().isEmpty(),
        check('company','company is required').not().isEmpty(),
        check('from','from date is required').not().isEmpty(),
    ]
],async (req,res) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, company, from, location, to, current, description } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    };

    try{

        const profile = await Profile.findOne({ user: req.user.id });

        profile.experience.unshift(newExp);
        await profile.save();

        return res.json(profile);

    }catch (err) {

        console.error(err.message);
        return res.status(500).send('server error');

    }
});

// @route DELETE api/profile/experience/:exp_id
// @desc Delete experience from profile
// @access Private

router.delete('/experience/:exp_id',auth,async (req,res) => {
    try{
        const profile = await Profile.findOne({ user: req.user.id });

        // get remove index
        const removeIndex = profile.experience.findIndex(exp => exp.id === req.params.exp_id);
        profile.experience.splice(removeIndex,1);

        await profile.save();

        return res.json(profile);

    }catch (err){

        console.error(err.message);
        return res.status(500).send('server error');

    }
});

// PUT api/profile/education
// add profile education
// private

router.put('/education',[auth,[
    check('school','school is required').not().isEmpty(),
    check('degree','degree is required').not().isEmpty(),
    check('from','from date is required').not().isEmpty(),
    check('fieldofstudy','Field of study is required').not().isEmpty(),
]],async (req,res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {school,degree,fieldofstudy,from,to,current,description} = req.body;

    const newEdu = {
        school: school,
        degree: degree,
        fieldofstudy: fieldofstudy,
        from: from,
        to: to,
        current: current,
        description: description
    };

    try{
        const profile = await Profile.findOne({user: req.user.id});
        profile.education.unshift(newEdu);
        await profile.save();

        return res.json(profile);
    }catch (err) {
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

// DELETE api/profile/education/:edu_id
// delete profile education
// private
router.delete('/education/:edu_id',auth, async (req,res) => {
    try{
        const profile = await Profile.findOne({user: req.user.id});

        //get the remove index

        const removeIndex =  profile.education.findIndex(edu => edu.id === req.params.edu_id);
        profile.education.splice(removeIndex,1);

        await profile.save();

        return res.json(profile);

    }catch (err) {
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

// GET api/profile/github/:username
// get user repos from github
// Public
router.get('/github/:username', async (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' }
        };

        request(options, (error, response, body) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Server error');
            }
            if (response.statusCode !== 200) {
                return res.status(404).json({ msg: 'No GitHub profile found' });
            }
            res.json(JSON.parse(body)); // Send the success response
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;