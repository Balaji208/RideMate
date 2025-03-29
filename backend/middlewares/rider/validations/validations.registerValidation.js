const { body } = require("express-validator");

const registerValidation = [
    // Phone number validation (Required if no OAuth)
    body("phone")
        .if(body("oAuthId").not().exists())  // Only validate if no OAuth
        .isLength({ min: 10, max: 15 })
        .withMessage("Phone number must be between 10 to 15 digits."),

    // OAuth validation (Required if no phone)
    body("oAuthId")
        .if(body("phone").not().exists())  // Only validate if no phone
        .notEmpty()
        .withMessage("OAuth ID is required when not using phone number.")
];

module.exports = { registerValidation };
