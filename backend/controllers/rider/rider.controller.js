const riderModel = require('../../models/rider/rider.model');
const userService = require('../../services/rider/rider.service');
const { validationResult } = require('express-validator');

module.exports.registerUser = async (req, res , next) => {
    // console.log(req.body);
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    // console.log(req.body);
    const {fullName,  email, password,phone} = req.body;
    const hashedPassword = await riderModel.hashPassword(password);
    const {firstName, lastName} = fullName;
    const user = await userService.createUser({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone : phone
    });

    const token = await user.generateAuthToken();

    res.status(201).json({user, token});
    
};

module.exports.loginUser = async(req,res,next)=>{
    
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

   
    const {email, password} = req.body;
    const user = await riderModel.findOne({email}).select('+password');
    if(!user){
        return res.status(401).json({message: 'Invalid email or password'});
    }
    const isMatch = await user.comparePassword(password);
    if(!isMatch){
        return res.status(401).json({message: 'Invalid email or password'});
    }
    const token = await user.generateAuthToken();
    res.status(200).json({user, token});
}

module.exports.getUserProfile = async(req,res,next)=>{
    const errors = validationResult(req);
    
    return res.status(200).json({user: req.user});
    
}