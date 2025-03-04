const userModel = require('../models/rider/rider.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');    

module.exports.authRider = async ( req,res,next) =>{
    const token = req.cookies.token || req.headers.authorization.split(' ')[ 1 ];
    if(!token){
        return res.status(401).json({message: 'Unauthorized'});
    }
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        console.log(JSON.stringify(decoded));
        const user = await userModel.findById(decoded._id);
        req.user = user;

        return next();
    }   
    catch(err){
        console.log(err);
        return res.status(401).json({message: 'Unauthorized access denied'});
    }

}