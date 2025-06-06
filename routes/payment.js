const express = require('express');
const axios = require('axios');
const router = express.Router();

const Order = require('../models/Order');
const Product = require('../models/Product');

// مشخصات زرین‌پال
const MERCHANT_ID = 'e150f93f-7a3b-432f-b7e2-4b72f8e198b1'; // تستی
const FRONT_URL = 'http://localhost:3001';
const CALLBACK_URL = `${FRONT_URL}/api/payment/verify`; // به جای مسیر مستقیم فرانت، این مسیر بک‌اند رو استفاده کن

// ------------------------
// 📌 1. ایجاد سفارش و پرداخت
// ------------------------
router.post('/pay', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'محصولات ارسال نشده‌اند' });

    // گرفتن محصولات از دیتابیس برای محاسبه دقیق قیمت
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    // ساختن ساختار سفارش
    const orderItems = products.map((product) => {
      const item = items.find((i) => i.productId == product._id.toString());
      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (totalAmount < 1000) {
      return res.status(400).json({ error: 'مبلغ کل باید بیشتر از ۱۰۰۰ تومان باشد' });
    }

    // ذخیره سفارش اولیه
    const newOrder = await Order.create({
      userId: req.user?.id || null, // اگه auth نداری، null
      items: orderItems,
      totalAmount,
      status: 'pending'
    });

    // درخواست به زرین‌پال
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
      res.json({ url: `https://sandbox.zarinpal.com/pg/StartPay/${data.authority}` });
    } else {
      res.status(400).json({ error: 'خطا در ایجاد پرداخت', detail: data });
    }
  } catch (err) {
    res.status(500).json({ error: 'خطای سرور', detail: err.message });
  }
});

// ------------------------
// 📌 2. تأیید پرداخت پس از بازگشت از زرین‌پال
// ------------------------
router.get('/verify', async (req, res) => {
  const { Authority, Status, order_id } = req.query;

  try {
    if (!Authority || !order_id) {
      return res.status(400).send('اطلاعات ناقص است');
    }

    const order = await Order.findById(order_id);
    if (!order) return res.status(404).send('سفارش پیدا نشد');

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
      await order.save();
      return res.redirect(`${FRONT_URL}/VerifyPage?status=success&ref_id=${result.ref_id}`);
    } else {
      order.status = 'failed';
      await order.save();
      return res.redirect(`${FRONT_URL}/VerifyPage?status=failed`);
    }
  } catch (err) {
    console.error('Payment verification error:', err.message);
    res.status(500).send('خطا در تأیید پرداخت');
  }
});

module.exports = router;
