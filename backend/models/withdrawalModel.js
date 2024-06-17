const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: { type: String, required: true }, // e.g., 'bank_transfer', 'paypal'
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // When the request was approved/rejected
}, { _id: true });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
