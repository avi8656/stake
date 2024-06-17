const catchAsyncError = require('../middleware/catchAsyncError');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/userModel');


// process payment
exports.processPayment = catchAsyncError(async (req, res, next) => {
    const { amount, userId } = req.body;

    if (!amount || !userId) {
        return res.status(400).json({ success: false, message: 'Amount and UserId are required' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Create or retrieve Stripe customer
        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
            });
            stripeCustomerId = customer.id;
            user.stripeCustomerId = stripeCustomerId;
        }

        // Create the payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert amount to paise (or cents)
            currency: 'inr',
            customer: stripeCustomerId,
            payment_method_types: ['card'], // Specify payment method type
            metadata: {
                userId: user.userId.toString(),
                email: user.email,
            },
        });

        // Update user's account balance
        user.account_balance += parseInt(amount); // Assuming amount is already parsed as an integer
        await user.save();

        res.status(200).json({
            success: true,
            client_secret: paymentIntent.client_secret,
            account_balance: user.account_balance,
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

// send stripe api key
exports.sendStripeApiKey = catchAsyncError(async (req, res, next) => {
    res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
});


// Update Bank Account Details
exports.updateBankDetails = catchAsyncError(async (req, res, next) => {
 const userId = req.user._id;  // Get user ID from the authenticated user
    const { accountNumber, ifscCode, bankName, accountHolderName } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.bankAccountDetails = {
        accountNumber: accountNumber || user.bankAccountDetails.accountNumber,
        ifscCode: ifscCode || user.bankAccountDetails.ifscCode,
        bankName: bankName || user.bankAccountDetails.bankName,
        accountHolderName: accountHolderName || user.bankAccountDetails.accountHolderName,
    };

    await user.save();
    res.status(200).json({
        success: true,
        bankAccountDetails: user.bankAccountDetails,
    });
});

// Process Withdrawal
exports.processWithdrawal = catchAsyncError(async (req, res, next) => {
    const { amount, userId } = req.body;

    if (!amount || !userId) {
        return res.status(400).json({ success: false, message: 'Amount and User ID are required' });
    }

    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.account_balance < amount) {
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    user.account_balance -= amount;
    await user.save();

    res.status(200).json({ success: true, message: 'Withdrawal successful', account_balance: user.account_balance });
});