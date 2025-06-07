const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  amount: Number,
  authority: String,
  refId: String,
  isPaid: { type: Boolean, default: false },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  receiverName: String
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
