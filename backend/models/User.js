const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // Must contain @ikgptu.ac.in
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['staff', 'committee'], 
    default: 'staff' 
  },
  department: { type: String, required: true }, // 'Lab', 'Library', 'Canteen', 'Auditorium' etc
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', UserSchema);
