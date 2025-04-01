const express = require("express");
const { registerCaptain } = require("../../controllers/captain/captain.controller");
const { registerValidation } = require("../../middlewares/captain/validations/validations.registerValidation")
const router = express.Router();

router.post('/register',registerValidation,registerCaptain);





module.exports = router;