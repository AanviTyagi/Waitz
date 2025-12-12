const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  queueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Queue', required: true },
  tokenNumber: { type: Number, required: true },
  displayToken: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  userName: { type: String, required: true }, 
  rollNo: { type: String, required: true },
  requirements: { type: mongoose.Schema.Types.Mixed }, // Flexible: { needPc: bool } OR { category: 'Food', notes: 'Sandwich' }
  assignedResource: { type: String }, // Seat No, Locker No, or 'Order Ready' status
  
  // New Fields for Enhanced Features
  type: { type: String, enum: ['queue', 'preorder', 'booking'], default: 'queue' },
  
  // For Canteen/Stationary Orders
  orderItems: [{
    name: String,
    qty: Number,
    price: Number
  }],
  billAmount: { type: Number, default: 0 },
  estimatedWaitTime: { type: Number, default: 0 }, // In minutes
  
  // For Events
  seatNo: { type: String }, // Specific seat booking (e.g. A5)
  
  // For Printing
  pdfFile: { type: String }, // URL or Path to uploaded file (mock)
  
  // Security
  qrCode: { type: String, unique: true, sparse: true }, // Unique Hash for entry
  
  status: { 
    type: String, 
    enum: ['waiting', 'serving', 'ready', 'picked_up', 'completed', 'cancelled', 'expired'], 
    default: 'waiting' 
  },
  generatedAt: { type: Date, default: Date.now },
  servedAt: { type: Date },
  completedAt: { type: Date }
});

module.exports = mongoose.model('Token', TokenSchema);
