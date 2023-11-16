const express = require('express');
const authController = require('../controllers/authController.js');

const router = express.Router();

router.post('/signup', authController.userSignup);
router.post('/login', authController.userLogin);
router.post('/token', authController.refreshToken);
router.delete('/logout', authController.logout);

module.exports = router;