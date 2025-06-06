const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    authority: String,
    refId: String,
    isPaid: Boolean,
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    receiverName:String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
