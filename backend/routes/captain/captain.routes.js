const express = require("express");
const { registerCaptain, predictFare } = require("../../controllers/captain/captain.controller");
const { registerValidation } = require("../../middlewares/captain/validations/validations.registerValidation")
const { getCaptains } = require("../../controllers/captain/captain.controller")
const router = express.Router();

router.post('/register',registerValidation,registerCaptain);

router.get('/available', getCaptains);
router.get('/predict-fare', predictFare);


module.exports = router;