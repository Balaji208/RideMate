const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const riderController = require('../../controllers/rider/rider.controller');
const authMiddleWare = require('../../middlewares/auth.middleware');

router.post('/register', [
    body('email').isEmail().withMessage('Invalid Email Address'),
    body('fullName.firstName').isLength({ min: 3 }).withMessage(
        'First name must be at least 3 characters long.'
    ),
    body('phone').isLength({ min: 1}).withMessage(
        'Psss must be at least 6 characters long.'
    ),
    body('password').isLength({ min: 6}).withMessage(
        'Password must be at least 6 characters long.'
    )
],
    riderController.registerUser);

router.post('/login',[
    body('email').isEmail().withMessage('Invalid Email Address'),
    body('password').isLength({ min: 6}).withMessage(
        'Password must be at least 6 characters long.'
    )
],
    riderController.loginUser);

router.get('/profile',authMiddleWare.authRider,riderController.getUserProfile)
module.exports = router;    