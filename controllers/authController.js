const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { users, refreshTokens } = require('../utils.js');


exports.userSignup = async (req, res) => {
    try {
        const { username, password } = req.body;
        if( !(username && password) ){
            throw new Error('All inputs are required');
        }
        if(users.findIndex(u => u.name === username) !== -1){
            throw new Error('This user already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ name: username, password: hashedPassword });
        res.status(200).json({ result: "Signup is successful" });
    } catch (error) {
        res.status(422).json({
            "errors": [
                {
                  "msg": error.message
                }
              ]
        });
    }
};

exports.userLogin = async (req, res) => {
    try{
        const { username, password } = req.body;
        if(!(username && password)){
            throw new Error('All inputs are required');
        }
        const user = users.find(u => u.name === username);
        if(!user || !( await bcrypt.compare(password, user.password) )){
            throw new Error('Invalid Credentials');
        }

        const accessToken = jwt.sign(
            { name: username },
            process.env.ACCESS_TOKEN_SECRET
        );
        const refreshToken = jwt.sign(
            { name: username },
            process.env.REFRESH_TOKEN_SECRET
        );
        
        refreshTokens.push(refreshToken);
        res.status(200).json({
            accessToken: accessToken,
            refreshToken: refreshToken
        });
    }catch(error){
        res.status(404).json({
            "errors": [
                {
                  "msg": error.message
                }
              ]
        });
    }
};

exports.refreshToken = (req, res) => {
    const { token } = req.body;
    if(!token){
        res.status(401).json({ message: 'Token are required' });
        return;
    }
    if(!refreshTokens.includes(token)){
        res.status(403).json({ message: 'Token not found' });
        return;
    }
    jwt.verify(token,  process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        if(err){
            res.status(403).json({ message: 'Invalid token' });
            return;
        }
        const newAccessToken = jwt.sign(
            { name: decoded.name },
            process.env.REFRESH_TOKEN_SECRET
        );
        res.status(200).json({ accessToken: newAccessToken });
    });
};

exports.logout = (req, res) => {
    const { token } = req.body;
    if(!token){
        res.status(401).json({ message: 'Token are required' });
        return;
    }
    if(!refreshTokens.includes(token)){
        res.status(403).json({ message: 'Token not found' });
        return;
    }
    refreshTokens.splice(refreshTokens.indexOf(token), 1);
    res.status(204).json();
};