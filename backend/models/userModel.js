const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// Define user schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  bankAccountDetails: {
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountHolderName: { type: String, default: '' },
  },
  account_balance: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  betting_history: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BettingHistory' }],
  withdrawals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Withdrawal' }],
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Generate JWT token
userSchema.methods.getJWTToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
