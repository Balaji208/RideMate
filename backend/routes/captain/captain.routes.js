const express = require("express");
const { registerCaptain } = require("../../controllers/captain/captain.controller");
const { registerValidation } = require("../../middlewares/captain/validations/validations.registerValidation")
const { getCaptain } = require("../../controllers/captain/captain.controller")
const router = express.Router();

router.post('/register',registerValidation,registerCaptain);

router.get('/:driverId', getCaptain);



module.exports = router;