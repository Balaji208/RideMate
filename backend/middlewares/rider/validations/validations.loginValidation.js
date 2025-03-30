const { body } = require("express-validator");

const loginValidation = [
    
    body("email").isEmail().withMessage("Invalid Email Address"),
    body("password").if(body("oAuthId").not().exists()).isLength({ min: 6 }).withMessage(
        "Password must be at least 6 characters long."
    ) // Only validate password if no oAuthId
]

module.exports = { loginValidation };