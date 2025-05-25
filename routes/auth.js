const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ثبت‌نام

router.post('/register', async (req, res) => {
  const {phone, password,nam,lname,address } = req.body;
  try {
    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ message: 'این شماره تلفن قبلاً ثبت شده است' });

    const user = new User({ phone, password,nam,lname,address });
    await user.save();
    res.status(201).json({ message: 'ثبت‌نام با موفقیت انجام شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در ثبت‌نام' });
    console.log(err)
  }
});

  

// ورود
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: 'کاربری با این شماره یافت نشد' });

    if (user.password !== password) {
      return res.status(400).json({ message: 'رمز عبور اشتباه است' });
    }

    // ساخت توکن با اطلاعات بیشتر
    const token = jwt.sign(
      {
        userId: user._id,
        nam: user.nam,
        lname: user.lname,
        phone: user.phone,
        address: user.address,
      },
      'your_jwt_secret', // سعی کن این کلید رو از env بگیری
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err) {
    console.error('خطا در لاگین:', err);
    res.status(500).json({ message: 'خطا در ورود' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // exclude password field
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'خطا در دریافت کاربران' });
  }
});


// ویرایش اطلاعات کاربر
router.put('/users/:id', async (req, res) => {
  const { nam, lname, phone, address } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { nam, lname, phone, address },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    res.json({ message: 'کاربر با موفقیت ویرایش شد', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطا در ویرایش کاربر' });
  }
});

// حذف کاربر
router.delete('/users/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }
    res.json({ message: 'کاربر با موفقیت حذف شد' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطا در حذف کاربر' });
  }
});




module.exports = router;
