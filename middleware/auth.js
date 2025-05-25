const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer token"

  if (!token) {
    return res.status(401).json({ message: 'دسترسی غیرمجاز، توکن وجود ندارد' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded; // ذخیره اطلاعات کاربر در request
    next();
  } catch (err) {
    return res.status(403).json({ message: 'توکن نامعتبر است' });
  }
};

module.exports = auth;
