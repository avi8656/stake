const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require('../middleware/catchAsyncError');
const User = require("../models/userModel");
const Withdrawal = require('../models/withdrawalModel');
const sendToken = require("../utils/jwtToken");
const crypto = require("crypto");


// register user
exports.registerUser = catchAsyncError(async (req, res) => {
    try {
        const { name, userId, email, phoneNumber, password } = req.body;
        const user = await User.create({ name, userId, email, phoneNumber, password });
        //   res.status(201).json({ success: true, user });
        sendToken(user, 201, res);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// login user
exports.loginUser = catchAsyncError(async (req, res, next) => {
    const { userId, password } = req.body;

    if (!userId || !password) {
        return next(new ErrorHandler("please enter valid userId ", 400))
    }

    const user = await User.findOne({ userId }).select("+password");

    if (!user) {
        return next(new ErrorHandler("Invalid userId or password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    sendToken(user, 200, res);
});

// logOut user
exports.logOut = catchAsyncError(async (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: "logout successfully"
    })
})

// get user details
exports.getUserDetails = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        user
    })
})


// update userprofile
exports.updateUserProfile = catchAsyncError(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        userId: req.body.userId,
        phoneNumber: req.body.phoneNumber,
        email: req.body.email
    };

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user,
    });
});


// request for withdrawal
exports.withdrawalRequest = catchAsyncError(async (req, res, next) => {
    const userId = req.user.id;
    const { amount, method } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (!user.bankAccountDetails || !user.bankAccountDetails.accountNumber) {
            return res.status(400).json({ error: 'Bank details are missing. Please update your bank details before making a withdrawal request.' });
        }

        if (user.account_balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const newWithdrawal = new Withdrawal({
            amount,
            method,
            status: 'pending',
            createdAt: new Date(),
            user: user._id,
        });

        await newWithdrawal.save();

        user.withdrawals.push(newWithdrawal);
        user.account_balance -= parseInt(amount);

        await user.save();

        res.status(201).json({ 
            success: true,
            message: 'Withdrawal request submitted successfully',
            account_balance: user.account_balance,
            withdrawal: {
                id: newWithdrawal._id,
                amount: newWithdrawal.amount,
                method: newWithdrawal.method,
                status: newWithdrawal.status,
                createdAt: newWithdrawal.createdAt,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
            }
        });
    } catch (error) {
        next(error);
    }
});




// get all withdrawals by admin
exports.allWithdrawal = catchAsyncError(async(req,res,next)=>{
    try {
        const pendingWithdrawals = await Withdrawal.find({ status: 'pending' }).populate('user', 'name email');
        res.status(200).json({ pendingWithdrawals });
      } catch (error) {
        next(error);
      }
})

//get single withdrawal request by admin
exports.getSingleWithdrawal = catchAsyncError(async (req, res, next) => {
    const { id: withdrawalId } = req.params; // Destructure and rename to withdrawalId

    try {
        if (!withdrawalId) {
            return res.status(400).json({ error: 'Withdrawal ID is required' });
        }

        const withdrawal = await Withdrawal.findById(withdrawalId).populate('user', 'name email');
       
         console.log(withdrawalId);
        if (!withdrawal) {
            return res.status(404).json({ error: 'Withdrawal request not found' });
        }

        res.status(200).json({ withdrawal });
    } catch (error) {
        next(error);
    }
});


// get withdrawal request success
exports.approveWithdrawal = catchAsyncError(async(req,res,next)=>{
    const {id: withdrawalId } = req.params;

    try {
      const withdrawal = await Withdrawal.findById(withdrawalId).populate('user');
  
      if (!withdrawal) {
        return res.status(404).json({ error: 'Withdrawal request not found' });
      }
  
      const user = await User.findById(withdrawal.user);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // payment process will update here
   
  
      withdrawal.status = 'approved';
      withdrawal.processedAt = new Date();
      await withdrawal.save();
      res.status(200).json({ message: 'Withdrawal request approved and payment processed successfully', withdrawal });
    } catch (error) {
      next(error);
    }
})

// get withdrawal request reject
exports.rejectWithdrawal = catchAsyncError(async(req,res,next)=>{
    const {id: withdrawalId } = req.params;

    try {
      const withdrawal = await Withdrawal.findById(withdrawalId).populate('user');
  
      if (!withdrawal) {
        return res.status(404).json({ error: 'Withdrawal request not found' });
      }
  
      const user = await User.findById(withdrawal.user);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      withdrawal.status = 'rejected';
      withdrawal.processedAt = new Date();
      await withdrawal.save();
  
      user.account_balance += withdrawal.amount; // Refund the amount to user's balance
      await user.save();
  
      res.status(200).json({ message: 'Withdrawal request rejected successfully', withdrawal });
    } catch (error) {
      next(error);
    }
})



// get all users by admin
exports.getAllUsers = catchAsyncError(async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({
            success: true,
            users
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });   
    }
  
});

// get single user by admin
exports.getsingleUsers = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if(!user){
        return next(new ErrorHandler(`user does not exixt with id: ${req.body.params}`))
    }

    res.status(200).json({
        success: true,
        user
    })
})

// update user role by admin
exports.updateUserRole = catchAsyncError(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role : req.body.role
    }
    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        reValidators: true,
        userFindAndModify: false,
    })

    res.status(200).json({
        success: true,
        message: "successfully user role update",
        user,
    })
});


// delete user by admin
exports.deleteUser = catchAsyncError(async (req, res, next) => {
    
    const user =await User.findById(req.params.id);
    // will remove cloudnary

   if(!user){
    return next(new ErrorHandler("user does not exist with id: ${req.params.id}"))
   }

   await user.deleteOne();
    
    res.status(200).json({
        success: true,
        message: "user deleted",
       
    })
});




