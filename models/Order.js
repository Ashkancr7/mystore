const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
    },
  ],
  address: {
    receiverName: String,
    receiverPhone: String,
    provinceId: String,
    provinceName: String,
    cityName: String,
    address: String,
    postCode: String,
  },
  paymentStatus: { type: String, default: 'unpaid' },
  orderStatus: { type: String, default: 'pending' },
  totalAmount: Number,
  shippingCost: Number,
  discountAmount: Number,
  finalAmount: Number,
  couponCode: String,
  authority: String,
  refId: String,
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
