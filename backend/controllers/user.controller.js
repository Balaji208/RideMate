const userModel = require('../models/user.model');
const userService = require('../services/user.service');
const { validationResult } = require('express-validator');

module.exports.registerUser = async (req, res , next) => {
    console.log(req.body);
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    console.log(req.body);
    const {fullName,  email, password} = req.body;
    const hashedPassword = await userModel.hashPassword(password);
    const {firstName, lastName} = fullName;
    const user = await userService.createUser({
        firstName,
        lastName,
        email,
        password: hashedPassword
    });

    const token = await user.generateAuthToken();

    res.status(201).json({user, token});
    
};