const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Profile Details
  phone: { type: String },
  department: { type: String },
  year: { type: String },
  section: { type: String },
  
  // Virtual Wallet
  walletBalance: { type: Number, default: 500 }, // Mock balance
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', StudentSchema);
