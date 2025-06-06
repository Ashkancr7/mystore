const express = require('express');
const axios = require('axios');
const router = express.Router();

const Order = require('../models/Order');
const Product = require('../models/Product');

// مشخصات زرین‌پال
const MERCHANT_ID = 'e150f93f-7a3b-432f-b7e2-4b72f8e198b1'; // کد تستی زرین‌پال

const FRONT_URL = 'https://my-front-hecm.vercel.app'; // آدرس فرانت
const BACKEND_URL = 'https://mystore-backend.onrender.com'; // آدرس بک‌اند برای callback

const CALLBACK_URL = `${BACKEND_URL}/api/payment/verify`;

// ------------------------
// 📌 1. ایجاد سفارش و پرداخت
// ------------------------
router.post('/pay', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'محصولات ارسال نشده‌اند' });

    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    const orderItems = products.map((product) => {
      const item = items.find((i) => i.productId == product._id.toString());
      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      };
    });

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (totalAmount < 1000)
      return res.status(400).json({ error: 'مبلغ کل باید بیشتر از ۱۰۰۰ تومان باشد' });

    const newOrder = await Order.create({
      userId: req.user?.id || null,
      items: orderItems,
      totalAmount,
      status: 'pending'
    });

    const zarinRes = await axios.post(
      'https://sandbox.zarinpal.com/pg/v4/payment/request.json',
      {
        merchant_id: MERCHANT_ID,
        amount: totalAmount,
        callback_url: `${CALLBACK_URL}?order_id=${newOrder._id}`,
        description: 'پرداخت سفارش فروشگاه'
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const { data } = zarinRes.data;

    if (data.code === 100) {
      newOrder.authority = data.authority;
      await newOrder.save();

      return res.json({
        url: `https://sandbox.zarinpal.com/pg/StartPay/${data.authority}`
      });
    } else {
      return res.status(400).json({ error: 'خطا در ایجاد پرداخت', detail: data });
    }
  } catch (err) {
    console.error('خطا در ایجاد پرداخت:', err.message);
    res.status(500).json({ error: 'خطای سرور', detail: err.message });
  }
});

// ------------------------
// 📌 2. تأیید پرداخت
// ------------------------
router.get('/verify', async (req, res) => {
  const { Authority, Status, order_id } = req.query;

  try {
    if (!Authority || !order_id)
      return res.status(400).send('اطلاعات ناقص است');

    const order = await Order.findById(order_id);
    if (!order) return res.status(404).send('سفارش پیدا نشد');

    if (order.status === 'success') {
      return res.redirect(`${FRONT_URL}/VerifyPage?status=already_paid`);
    }

    if (Status !== 'OK') {
      order.status = 'failed';
      await order.save();
      return res.redirect(`${FRONT_URL}/VerifyPage?status=failed`);
    }

    const verifyRes = await axios.post(
      'https://sandbox.zarinpal.com/pg/v4/payment/verify.json',
      {
        merchant_id: MERCHANT_ID,
        amount: order.totalAmount,
        authority: Authority
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const result = verifyRes.data.data;

    if (result.code === 100) {
      order.status = 'success';
      order.ref_id = result.ref_id;
      order.paidAt = new Date();
      await order.save();

      return res.redirect(`${FRONT_URL}/VerifyPage?status=success&ref_id=${result.ref_id}`);
    } else {
      order.status = 'failed';
      await order.save();
      return res.redirect(`${FRONT_URL}/VerifyPage?status=failed`);
    }
  } catch (err) {
    console.error('خطا در تأیید پرداخت:', err.message);
    res.status(500).send('خطای سرور در تأیید پرداخت');
  }
});

module.exports = router;
