const jwt = require('jsonwebtoken');
const { posts } = require('../utils.js');

exports.authCkeck = (req, res, next) => {
    const authorizationStr = req.headers.authorization;
    if(!authorizationStr){
        res.status(401).json('Token is required');
        return;
    }
    const [_, token] = authorizationStr.split(' ');
    if(!token){
        res.status(401).json('Token is required');
        return;
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err){
            res.status(403).json('Invalid token');
            return;
        }
        res.locals.username = decoded.name;
        next();
    });
};

exports.getAllPosts = (req, res) => {
    res.status(200).json(posts);
};

exports.getUserPosts = (req, res) => {
    const userPosts = posts.filter(p => p.author === res.locals.username);
    res.status(200).json(userPosts);
};

exports.patchPostById = (req, res) => {
    const postIndex = posts.findIndex(p => p.id === +req.params.id);
    if(postIndex === -1){
        res.status(404).json({ message: 'Post not found' });
        return;
    }
    if(posts[postIndex].author !== res.locals.username){
        res.status(403).json({ message: 'Access denied' });
        return;
    }
    posts[postIndex] = {
        ...req.body
    };
    res.status(200).json(posts[postIndex]);
};

