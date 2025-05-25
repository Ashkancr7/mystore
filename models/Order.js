// models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
});

const addressSchema = new mongoose.Schema({
  receiverName: { type: String, required: true },
  receiverPhone: { type: String, required: true },
  provinceId: String,
  provinceName: String,
  cityId: String,
  cityName: String,
  address: String,
  postCode: String,
});

const orderSchema = new mongoose.Schema({
  items: [orderItemSchema],

  address: addressSchema,

  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'failed'],
    default: 'unpaid',
  },

  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'canceled'],
    default: 'pending',
  },

  totalAmount: Number,        // مجموع بدون هزینه ارسال و تخفیف
  shippingCost: Number,       // هزینه ارسال
  discountAmount: Number,     // مقدار تخفیف
  finalAmount: Number,        // مبلغ نهایی = totalAmount - discountAmount + shippingCost

  couponCode: { type: String, default: null },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
