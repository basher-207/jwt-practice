const express = require('express');
const authRouter = require('./routes/authRouter.js');
const postsRouter = require('./routes/postsRouter.js');

const app = express();
app.use(express.json());

app.use('/auth', authRouter);
app.use('/posts', postsRouter);

module.exports = app;
