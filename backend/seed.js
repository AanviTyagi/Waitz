const mongoose = require('mongoose');
const Queue = require('./models/Queue');
const Token = require('./models/Token');
const User = require('./models/User');
require('dotenv').config();

const queues = [
  // Standard Facilities
  { 
    name: 'Library', 
    prefix: 'L', 
    category: 'standard',
    operatingHours: { start: '09:00', end: '17:00' }
  },
  { 
    name: 'Lab', 
    prefix: 'LB', 
    category: 'standard',
    operatingHours: { start: '09:00', end: '17:00' }
  },
  
  // Service Shops
  { 
    name: 'Campus Canteen', 
    prefix: 'CC', 
    category: 'standard',
    operatingHours: { start: '08:00', end: '19:00', is24Hours: false },
    menu: [
      { name: 'Samosa', category: 'Breakfast', price: 15, stock: 50 },
      { name: 'Bread Omelette', category: 'Breakfast', price: 40, stock: 30 },
      { name: 'Sandwiches', category: 'Breakfast', price: 35, stock: 40 },
      { name: 'Poha', category: 'Breakfast', price: 30, stock: 40 },
      { name: 'Maggi', category: 'Breakfast', price: 25, stock: 100 },
      { name: 'Tea/Coffee', category: 'Breakfast', price: 10, stock: 200 },
      
      { name: 'Fries', category: 'Snacks', price: 50, stock: 50 },
      { name: 'Pizza Slice', category: 'Snacks', price: 60, stock: 20 },
      { name: 'Burger', category: 'Snacks', price: 45, stock: 50 },
      { name: 'Spring Rolls', category: 'Snacks', price: 40, stock: 40 },
      { name: 'Momos', category: 'Snacks', price: 50, stock: 50 },
      { name: 'Patties', category: 'Snacks', price: 20, stock: 60 },
      { name: 'Chhole Bhature', category: 'Snacks', price: 60, stock: 30 },
      
      { name: 'Cold Drinks', category: 'Drinks', price: 20, stock: 50 },
      { name: 'Lemon Soda', category: 'Drinks', price: 30, stock: 40 },
      { name: 'Lassi', category: 'Drinks', price: 30, stock: 40 },
      { name: 'Juice', category: 'Drinks', price: 40, stock: 40 },
      
      { name: 'Veg Thali', category: 'Daily Meals', price: 80, stock: 50 },
      { name: 'Special Thali', category: 'Daily Meals', price: 120, stock: 20 },
      { name: 'Rice + Rajma', category: 'Daily Meals', price: 60, stock: 60 },
      { name: 'Rice + Kadhi', category: 'Daily Meals', price: 60, stock: 60 },
      { name: 'Roti + Sabji', category: 'Daily Meals', price: 50, stock: 60 }
    ]
  },
  { 
    name: 'Hostel Canteen', 
    prefix: 'HC', 
    category: 'standard',
    operatingHours: { is24Hours: true },
    menu: [
        { name: 'Maggi', category: 'Late Night', price: 25, stock: 100 },
        { name: 'Tea/Coffee', category: 'Late Night', price: 10, stock: 200 },
        { name: 'Paratha', category: 'Late Night', price: 30, stock: 50 },
        { name: 'Sandwiches', category: 'Late Night', price: 35, stock: 50 }
    ]
  },
  { 
    name: 'Stationary Shop', 
    prefix: 'ST', 
    category: 'standard',
    operatingHours: { start: '09:00', end: '19:00' },
    menu: [
      { name: 'Notebook (Small)', category: 'Stationary', price: 20, stock: 100 },
      { name: 'Notebook (Long)', category: 'Stationary', price: 40, stock: 100 },
      { name: 'Register', category: 'Stationary', price: 60, stock: 50 },
      { name: 'Files', category: 'Stationary', price: 15, stock: 200 },
      { name: 'Pen', category: 'Stationary', price: 10, stock: 500 },
      { name: 'Pencil', category: 'Stationary', price: 5, stock: 200 },
      { name: 'Eraser', category: 'Stationary', price: 5, stock: 100 },
      { name: 'Sharpener', category: 'Stationary', price: 5, stock: 100 },
      { name: 'Highlighters', category: 'Stationary', price: 20, stock: 50 },
      { name: 'Sticky Notes', category: 'Stationary', price: 30, stock: 50 },
      { name: 'Geometry Box', category: 'Stationary', price: 100, stock: 20 },
      
      { name: 'ID Card Holder', category: 'College Essentials', price: 20, stock: 100 },
      { name: 'Lab Coat', category: 'College Essentials', price: 350, stock: 20 },
      { name: 'Drawing Sheets', category: 'College Essentials', price: 10, stock: 100 },
      { name: 'Graph Sheets', category: 'College Essentials', price: 2, stock: 200 },
      
      { name: 'Photocopy (Per Page)', category: 'Printing', price: 2, stock: 9999 },
      { name: 'Spiral Binding', category: 'Printing', price: 40, stock: 200 },
      { name: 'Print (B/W)', category: 'Printing', price: 5, stock: 9999 },
      { name: 'Print (Color)', category: 'Printing', price: 20, stock: 9999 }
    ]
  },
  
  // Event Venues
  { 
    name: 'Auditorium', 
    prefix: 'AUD', 
    category: 'event', 
    hasActiveEvent: false,
    operatingHours: { start: '08:00', end: '20:00' },
    eventConfig: {
        totalSeats: 200,
        layout: { rows: 10, cols: 20 }, // 10 Rows (A-J), 20 seats each
        bookedSeats: []
    }
  },
  { 
    name: 'Seminar Hall', 
    prefix: 'SEM', 
    category: 'event', 
    hasActiveEvent: false,
    operatingHours: { start: '08:00', end: '18:00' },
    eventConfig: {
        totalSeats: 50,
        layout: { rows: 5, cols: 10 },
        bookedSeats: []
    }
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    await Queue.deleteMany({});
    await User.deleteMany({}); // Clear previous admin data
    await Token.deleteMany({}); // Clear tokens to prevent orphaned references 
    
    await Queue.insertMany(queues);
    console.log('Queues Reseeded with Waitz locations!');

    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
};

seedDB();
