const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("./catchAsyncError");
const jwt = require("jsonwebtoken");


exports.isAuthenticated = catchAsyncError(async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return next(new ErrorHandler("please login to access this resource", 401))
    }
    const decodeData = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decodeData.id);

    if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
    }

    next();
});


exports.authoriseRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorHandler(
                    `Role : ${req.user.role} is not allow to access`, 403));
        }
        next();
    }
}