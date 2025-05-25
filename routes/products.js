const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const upload = require('../upload'); 
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
// GET products by category
router.get('/category/:category', async (req, res) => {
  const { category } = req.params;
  try {
    const products = await Product.find({ category });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST new product
router.post('/', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ error: 'خطا در ثبت محصول', details: err.message });
  }
});

// PUT edit product by id
router.put('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,      // محصول به‌روزشده رو برمی‌گردونه
      runValidators: true, // اعتبارسنجی طبق اسکیما
    });

    if (!updatedProduct) {
      return res.status(404).json({ message: 'محصول پیدا نشد' });
    }

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطا در ویرایش محصول', details: err.message });
  }
});

// DELETE product by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'محصول پیدا نشد' });
    }
    res.json({ message: 'محصول با موفقیت حذف شد' });
  } catch (error) {
    res.status(500).json({ error: 'خطا در حذف محصول' });
  }
});

// ✅ آپلود تصویر محصول

router.put('/:id/image', upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'محصول پیدا نشد' });

    // مسیر فایل آپلود شده
    const inputPath = req.file.path;

    // مسیر جدید برای تصویر تغییر اندازه داده شده
    const outputFilename = 'resized-' + req.file.filename;
    const outputPath = path.join('uploads', outputFilename);

    // تغییر اندازه تصویر به عرض 500 و ارتفاع 500 (مثلا)
    await sharp(inputPath)
      .resize(300, 300, {
        fit: 'inside', // حفظ نسبت ابعاد و حداکثر اندازه
        withoutEnlargement: true, // اگر تصویر کوچکتر بود بزرگ نکن
      })
      .toFile(outputPath);

    // حذف فایل اصلی آپلود شده (اختیاری)
    // fs.unlinkSync(inputPath);

    // آدرس جدید تصویر را در محصول ذخیره کن
    product.image = `http://localhost:5000/uploads/${outputFilename}`;
    await product.save();

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطا در آپلود تصویر' });
  }
});

module.exports = router;
