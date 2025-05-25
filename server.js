const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const connectDB = require('./db');
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth'); 
const paymentRoutes = require('./routes/payment');
const path = require('path');

dotenv.config();
connectDB();


const app = express();
app.use(cors());
app.use(express.json());
// اضافه کردن auth route
app.use('/api/auth', authRoutes);

app.use('/api/products', productRoutes);

app.use('/api/payment', paymentRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
