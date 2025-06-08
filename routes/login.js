const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');

router.post('/admin-login', async (req, res) => {
    const { phone, password } = req.body;

  try {
    const user = await User.findOne({ phone });

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'دسترسی غیرمجاز' });
    }
    if (user.password !== password) {
        return res.status(401).json({ message: 'رمز عبور اشتباه است' });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      'your_jwt_secret',
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'خطا در ورود' });
  }
});

module.exports = router;
