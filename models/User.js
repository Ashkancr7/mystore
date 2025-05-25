const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nam:{type:String , required:true},
  lname:{type:String , required:true},
  address:{type:String , required:true}
  
});

// اگر می‌خواهی هش نکنه فعلاً، این قسمت رو کامنت بذار
// UserSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

module.exports = mongoose.model('User', UserSchema);
