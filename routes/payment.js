// routes/payment.js
const express = require('express');
const axios = require('axios');

const router = express.Router();

// مرچنت آی‌دی رو از داشبورد زرین‌پال بگیر و جایگزین کن
const MERCHANT_ID = 'e150f93f-7a3b-432f-b7e2-4b72f8e198b1'; // ← مقدار تستی خودت رو بذار اینجا

// آدرس بازگشت بعد از پرداخت
const CALLBACK_URL = 'http://localhost:3001/VerifyPage'; // آدرس فرانت خودت برای تأیید

// 🔵 ارسال درخواست پرداخت
router.post('/pay', async (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || amount < 1000) {
    return res.status(400).json({ error: 'مقدار مبلغ نامعتبر است' });
  }

  try {
    const response = await axios.post(
      'https://sandbox.zarinpal.com/pg/v4/payment/request.json',
      {
        merchant_id: MERCHANT_ID,
        amount: amount, // استفاده از مقدار دریافتی
        callback_url: CALLBACK_URL,
        description: 'پرداخت با مبلغ دلخواه',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const { data } = response.data;

    if (data.code === 100) {
      res.json({ url: `https://sandbox.zarinpal.com/pg/StartPay/${data.authority}` });
    } else {
      res.status(400).json({ error: 'پرداخت ناموفق بود', detail: data });
    }
  } catch (err) {
    res.status(500).json({
      error: 'خطا در ارتباط با زرین‌پال',
      detail: err.response?.data || err.message,
    });
  }
});


module.exports = router;
