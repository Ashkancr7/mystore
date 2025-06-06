const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    amount: Number,
    authority: String,
    refId: String,
    isPaid: Boolean,
    orderId: String,
    receiverName:String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
