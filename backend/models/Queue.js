const mongoose = require('mongoose');

const QueueSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'Canteen', 'Admin'
  prefix: { type: String, required: true }, // e.g., 'C', 'A'
  category: { type: String, enum: ['standard', 'event'], default: 'standard' },
  hasActiveEvent: { type: Boolean, default: false },
  lastEventDate: { type: Date, default: null },
  currentNumber: { type: Number, default: 0 }, // The number currently being served
  lastGeneratedNumber: { type: Number, default: 0 }, // The last number given to a user
  isActive: { type: Boolean, default: true },
  operatingHours: {
    start: { type: String, default: "09:00" }, // 24-hour format HH:mm
    end: { type: String, default: "17:00" },
    is24Hours: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  
  // For Canteen & Stationary
  menu: [{
    name: String,
    category: String, // Breakfast, Snacks, Stationery, etc.
    price: Number,
    isAvailable: { type: Boolean, default: true },
    stock: { type: Number, default: 100 },
    prepTime: { type: Number, default: 5 } // Estimated preparation time in minutes
  }],

  // For Events (Auditorium/Seminar)
  eventConfig: {
    totalSeats: { type: Number },
    layout: { type: mongoose.Schema.Types.Mixed }, // e.g. { rows: 20, cols: 10 } or custom map
    bookedSeats: [{ type: String }] // Array of Seat Numbers like 'A1', 'B5'
  }
});

module.exports = mongoose.model('Queue', QueueSchema);
