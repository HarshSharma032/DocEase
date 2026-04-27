const express = require('express');
const router = express.Router();
const { registerUser, registerDoctor, loginUser, refreshToken, logoutUser } = require('../controllers/authController');
const { validate, registerUserSchema, registerDoctorSchema, loginSchema } = require('../utils/validators');

router.post('/register-user', validate(registerUserSchema), registerUser);
router.post('/register-doctor', validate(registerDoctorSchema), registerDoctor);
router.post('/login', validate(loginSchema), loginUser);
router.get('/refresh', refreshToken);
router.post('/logout', logoutUser);

module.exports = router;
