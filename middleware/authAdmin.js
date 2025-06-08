const jwt = require('jsonwebtoken');

const authAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'توکن موجود نیست' });

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: 'توکن نامعتبر است' });
  }
};

module.exports = authAdmin;
