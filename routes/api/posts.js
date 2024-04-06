const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();

const Post = require('../../models/Post');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const auth = require('../../middleware/auth');

// @route POST api/posts
// @desc create new post
// @access Private
router.post('/',[
    auth,
    [
        check('text', 'Text is required').not().isEmpty()
    ]
],async (req,res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
    }

    try{
        const { text, title, cover, description } = req.body;

        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Post({
            title: title,
            text: text,
            cover: cover,
            description: description,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });

        const post = await newPost.save();
        res.json(post);

    }catch (err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route GET api/posts
// @desc get all post
// @access Private
router.get('/', auth ,async (req,res) => {
    try{
        const posts = await Post.find().select('name title description cover avatar').sort({ date: -1 });
        res.json(posts);

    }catch (err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route GET api/posts/:id
// @desc get post by id
// @access Private
router.get('/:id', auth ,async (req,res) => {
    try{
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({ msg: 'No Post Found' })
        }

        res.json(post);

    }catch (err){
        console.error(err.message);

        if(err.kind === 'ObjectId'){
            return res.status(404).json({ msg: 'No Post Found' })
        }
        res.status(500).send('Server error');
    }
});

// @route DELETE api/posts/:id
// @desc delete a post
// @access Private
router.delete('/:id', auth ,async (req,res) => {
    try{
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({ msg: 'No Post Found' })
        }

        if(post.user.toString() !== req.user.id){
            return res.status(401).json({ msg: 'User not auth' })
        }

        await post.remove();
        return res.json({ msg: 'Post removed' });

    }catch (err){
        console.error(err.message);

        if(err.kind === 'ObjectId'){
            return res.status(404).json({ msg: 'No Post Found' })
        }
        res.status(500).send('Server error');
    }
});

// @route PUT api/posts/like/:id
// @desc like a post
// @access Private
router.put('/like/:id', auth ,async (req,res) => {
    try{
        const post = await Post.findById(req.params.id);

        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0){
            return  res.status(400).json({ msg: 'post already like' })
        }

        post.likes.unshift({ user: req.user.id });
        await post.save();

        res.json(post.likes);

    }catch (err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route PUT api/posts/unlike/:id
// @desc unlike a post
// @access Private
router.put('/unlike/:id', auth ,async (req,res) => {
    try{
        const post = await Post.findById(req.params.id);

        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0){
            return  res.status(400).json({ msg: 'post has not liked' });
        }

        const removeIndex = post.likes.findIndex(like => like.user.toString() === req.user.id);
        post.likes.splice(removeIndex,1);

        await post.save();

        res.json(post.likes);

    }catch (err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route POST api/posts/comment/:id
// @desc comment on post
// @access Private
router.post('/comment/:id',[
    auth,
    [
        check('text', 'Text is required').not().isEmpty()
    ]
],async (req,res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
    }

    try{

        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);

        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        };

        post.comments.unshift(newComment);
        await post.save();

        res.json(post);

    }catch (err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// DELETE api/posts/comment/:id/:comment_id
// delete comment on a post
// private
router.delete('/comment/:id/:comment_id',auth, async (req,res) => {
    try{
        const post = await Post.findById(req.params.id);

        // pull out comments
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        // make sure comment exist
        if(!comment){
            return res.status(404).json({msg: 'Comment does not exist'})
        }

        // check user make comment
        if(comment.user.toString() !== req.user.id){
            return res.status(401).json({msg: 'User not Authorized'})
        }

        const commentIndex = post.comments.findIndex(comment => comment.user.toString() === req.user.id);
        post.comments.splice(commentIndex,1);
        await post.save();

        return res.json(post.comments);
    }catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});

module.exports = router;