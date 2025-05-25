const bcrypt = require('bcrypt');

const runTest = async () => {
  const plainPassword = '1234';

  // هش کردن رمز
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  console.log('✅ Hashed Password:', hashedPassword);

  // مقایسه رمز با هش
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  console.log('🔍 Do they match?', isMatch ? 'Yes ✅' : 'No ❌');
};

runTest();
