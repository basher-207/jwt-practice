const express = require('express');
const postsController = require('../controllers/postsController.js');

const router = express.Router();

router.use(postsController.authCkeck);
router.get('/', postsController.getAllPosts);
router.get('/my', postsController.getUserPosts);
router.patch('/:id', postsController.patchPostById);

module.exports = router;