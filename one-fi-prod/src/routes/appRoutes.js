const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const TransactionController = require('../controllers/transactionController');
const { verifyJwtToken } = require('../utils/jwtUtil');

// Route for user sign-up
router.post('/signup/send-otp', UserController.signUp);

// Route for login via otp using firebase
router.post('/login/send-otp', UserController.logIn);

// Route for OTP verification
router.post('/signup/verify-otp', UserController.verifyOtp);

// Route for otp verification via firebase
router.post('/login/verify-otp', UserController.verifyOtp);

router.get("/transactions/get-bse-password", TransactionController.getBsePassword);

router.post("/transactions/place-bse-lumpsum-order",verifyJwtToken, TransactionController.placeBseLumpsumOrder);

module.exports = router;