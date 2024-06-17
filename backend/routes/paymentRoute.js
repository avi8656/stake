const express = require('express');
const { processPayment, sendStripeApiKey, processWithdrawal, updateBankDetails } = require('../controllers/paymentController');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.route('/payment/process').post(isAuthenticated, processPayment);
router.route('/stripeapikey').get( sendStripeApiKey);
router.put('/update-bank-details',isAuthenticated, updateBankDetails);

module.exports = router;
