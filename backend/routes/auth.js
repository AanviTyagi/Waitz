const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Admin
const Student = require('../models/Student');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// --- STUDENT AUTH ---
router.post('/student/signup', async (req, res) => {
  const { name, rollNo, email, password } = req.body;
  try {
    // Check if rollNo already exists
    const existingStudent = await Student.findOne({ rollNo });
    if (existingStudent) {
        return res.status(400).json({ message: 'Student with this Roll No already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const student = await Student.create({ name, rollNo, email, password: hashed });
    const token = jwt.sign({ id: student._id, role: 'student' }, JWT_SECRET);
    res.json({ token, student: { name, rollNo, email, id: student._id } });
  } catch (err) {
    res.status(400).json({ message: 'Error creating student account' });
  }
});

router.post('/student/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const student = await Student.findOne({ email });
    if (!student || !await bcrypt.compare(password, student.password)) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: student._id, role: 'student' }, JWT_SECRET);
    res.json({ token, student: { name: student.name, rollNo: student.rollNo, email, id: student._id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN AUTH ---
router.post('/admin/signup', async (req, res) => {
  const { name, email, password, department, role } = req.body;
  
  // Validation
  if (!email.endsWith('@ikgptu.ac.in')) {
    return res.status(400).json({ message: 'Email must end with @ikgptu.ac.in' });
  }

  // Dept/Role validation logic if needed
  // e.g. committee role only for event venues

  try {
    const admin = await User.create({ name, email, password, department, role });
    const token = jwt.sign({ id: admin._id, role: 'admin', department }, JWT_SECRET);
    res.json({ token, admin: { name, email, department, role } });
  } catch (err) {
    res.status(400).json({ message: 'Error creating admin. Email might be in use.' });
  }
});

router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await User.findOne({ email });
    if (!admin || !await bcrypt.compare(password, admin.password)) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin._id, role: 'admin', department: admin.department }, JWT_SECRET);
    res.json({ token, admin: { name: admin.name, role: admin.role, department: admin.department } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
