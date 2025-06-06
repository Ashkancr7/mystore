const express = require('express');
const axios = require('axios');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Payment = require('../models/Payment');

const router = express.Router();

// مشخصات زرین‌پال
const MERCHANT_ID = 'e150f93f-7a3b-432f-b7e2-4b72f8e198b1';
const FRONT_URL = 'https://my-front-hecm.vercel.app';
const CALLBACK_URL = 'https://mystore-pbfe.onrender.com/api/payment/verify'; // مسیر API بک‌اند

// -------------------------
//  1. ایجاد سفارش و پرداخت
// -------------------------
router.post('/pay', async (req, res) => {
  try {
    const {
      items,
      address,
      shippingCost,
      discountAmount,
      couponCode,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'محصولات ارسال نشده‌اند' });

    // دریافت محصولات از دیتابیس
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    const orderItems = products.map((product) => {
      const item = items.find((i) => i.productId == product._id.toString());
      return {
        productId: product._id,
        quantity: item.quantity,
      };
    });

    const totalAmount = products.reduce((sum, product) => {
      const item = items.find((i) => i.productId == product._id.toString());
      const discountedPrice = Math.round(product.price * (1 - product.discountPercentage / 100));
      return sum + discountedPrice * item.quantity;
    }, 0);

    const finalAmount = totalAmount - (discountAmount || 0) + (shippingCost || 0);

    if (finalAmount < 1000)
      return res.status(400).json({ error: 'مبلغ کل کمتر از حد مجاز است' });

    // ذخیره سفارش در حالت اولیه
    const newOrder = await Order.create({
      userId: req.user.id,
      items: orderItems,
      address,
      totalAmount,
      shippingCost,
      discountAmount,
      finalAmount,
      couponCode,
      paymentStatus: 'unpaid',
      orderStatus: 'pending',
      
    });

    // ارسال درخواست به زرین‌پال
    const zarinRes = await axios.post(
      'https://sandbox.zarinpal.com/pg/v4/payment/request.json',
      {
        merchant_id: MERCHANT_ID,
        amount: finalAmount,
        callback_url: `${CALLBACK_URL}?order_id=${newOrder._id}`,
        description: 'پرداخت سفارش در فروشگاه',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const { data } = zarinRes.data;

    if (data.code === 100) {
      // ذخیره authority در سفارش
      newOrder.authority = data.authority;
      await newOrder.save();

      return res.json({
        url: `https://sandbox.zarinpal.com/pg/StartPay/${data.authority}`,
      });
    } else {
      return res.status(400).json({ error: 'درخواست پرداخت ناموفق', detail: data });
    }
  } catch (err) {
    console.error('خطا در پرداخت:', err.message);
    return res.status(500).json({ error: 'خطای سرور', detail: err.message });
  }
});

// -------------------------
// 🟢 2. تأیید پرداخت
// -------------------------

router.get('/verify', async (req, res) => {
  const { Authority, Status, order_id } = req.query;

  try {
    if (!Authority || !order_id) {
      return res.status(400).send('اطلاعات ناقص است');
    }

    const order = await Order.findById(order_id);
    if (!order) return res.status(404).send('سفارش پیدا نشد');

    if (Status !== 'OK') {
      order.paymentStatus = 'failed';
      await order.save();
      return res.redirect(`${FRONT_URL}/VerifyPage?status=failed`);
    }

    // تأیید پرداخت با زرین‌پال
    const verifyRes = await axios.post(
      'https://sandbox.zarinpal.com/pg/v4/payment/verify.json',
      {
        merchant_id: MERCHANT_ID,
        amount: order.finalAmount,
        authority: Authority,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const result = verifyRes.data.data;

    if (result.code === 100) {
      order.paymentStatus = 'paid';
      order.refId = result.ref_id;
      await order.save();

      // 🔵 ذخیره پرداخت موفق در مجموعه Payment
      await Payment.create({
        amount: order.finalAmount,
        authority: Authority,
        refId: result.ref_id,
        isPaid: true,
        orderId: order._id,
        receiverName:order.receiverName
      });

      return res.redirect(
        `${FRONT_URL}/VerifyPage?status=success&ref_id=${result.ref_id}`
      );
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      return res.redirect(`${FRONT_URL}/VerifyPage?status=failed`);
    }
  } catch (err) {
    console.error('خطا در تأیید پرداخت:', err.message);
    return res.status(500).send('خطای سرور در تأیید پرداخت');
  }
});

router.get("/all", async (req, res) => {
  try {
    const payments = await Payment.find()
    .sort({ createdAt: -1 })
    .populate({
      path: 'orderId',
      populate: { path: 'userId', select: 'name email' }
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "خطا در دریافت پرداخت‌ها" });
  }
});

module.exports = router;
