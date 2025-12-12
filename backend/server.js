require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const Queue = require('./models/Queue');
const Token = require('./models/Token');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

// Socket.io Setup
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// --- API Routes ---

// 1. Get All Queues
app.get('/api/queues', async (req, res) => {
  try {
    // We want to return wait times.
    const queues = await Queue.find({ isActive: true });
    
    // Enrich with wait times
    // This could be slow if many queues/tokens. Optimization: Aggregation.
    // For now, let's just do a quick lookup.
    const enrichedQueues = await Promise.all(queues.map(async (q) => {
        // Calculate pending prep time
        const activeTokens = await Token.find({ queueId: q._id, status: { $in: ['waiting', 'serving'] } });
        let totalPendingTime = 0;
        
        activeTokens.forEach(t => {
            if(t.orderItems && t.orderItems.length > 0) {
                 t.orderItems.forEach(item => {
                     const mItem = q.menu?.find(m => m.name === item.name);
                     if(mItem) totalPendingTime += (mItem.prepTime || 0) * (item.qty || 1);
                 });
            } else {
                 if (q.name.includes('Lab') || q.name.includes('Library')) totalPendingTime += 5; 
            }
        });
        
        return { ...q.toObject(), estimatedWaitTime: totalPendingTime }; // in minutes
    }));
    
    res.json(enrichedQueues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Generate Token
app.post('/api/token/generate', async (req, res) => {
  const { queueId, studentId, requirements, orderItems } = req.body; 
  // requirements: legacy support
  // orderItems: [{ name, qty, price, prepTime }] (Frontend sends this)
  
  if (!studentId) return res.status(401).json({ message: 'Authentication required' });

  try {
    const queue = await Queue.findById(queueId);
    if (!queue) return res.status(404).json({ message: 'Facility not found' });
    
    const Student = require('./models/Student');
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // --- Validation Logic (Hours, Event etc) ---
    if (queue.category === 'standard') {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeVal = currentHours * 60 + currentMinutes;

      if (queue.operatingHours) {
        if (!queue.operatingHours.is24Hours) {
             const [startH, startM] = queue.operatingHours.start.split(':').map(Number);
             const [endH, endM] = queue.operatingHours.end.split(':').map(Number);
             
             const startTimeVal = startH * 60 + startM;
             const endTimeVal = endH * 60 + endM;
             
             if (currentTimeVal < startTimeVal || currentTimeVal >= endTimeVal) {
                 // Check if it's across midnight case (not handled here simplified)
                 return res.status(400).json({ 
                     message: `Facility is closed. Open from ${queue.operatingHours.start} to ${queue.operatingHours.end}.` 
                 });
             }
        }
      } else {
          // Fallback
          if (currentHours < 9 || currentHours >= 17) {
            return res.status(400).json({ message: 'Facility is closed. Open from 09:00 to 17:00.' });
          }
      }

    } else if (queue.category === 'event') {
      if (!queue.hasActiveEvent) {
         return res.status(400).json({ message: 'No active event scheduled.' });
      }
    }

    // Prevent duplicates only for non-order queues
    // (Canteen/Stationary allowed multiple)
    if (!queue.name.toLowerCase().includes('canteen') && !queue.name.toLowerCase().includes('stationary')) {
        const existing = await Token.findOne({ studentId, status: 'waiting', queueId });
        if (existing) return res.status(400).json({ message: 'You already have a waiting token for this queue.' });
    }

    queue.lastGeneratedNumber += 1;
    await queue.save();

    const tokenNumber = queue.lastGeneratedNumber;
    const displayToken = `${queue.prefix}-${tokenNumber}`;

    // --- WAIT TIME CALCULATION ---
    let estimatedWaitTime = 0;
    let myPrepTime = 0;

    // 1. Calculate My Prep Time
    if (orderItems && orderItems.length > 0) {
        // orderItems from frontend might just be { name, qty }. We need to lookup prepTime from DB Queue menu for security/accuracy
        // But for simplicity, assuming frontend sends valid data or we re-map:
         orderItems.forEach(item => {
             const menuItem = queue.menu.find(m => m.name === item.name);
             if(menuItem) {
                 myPrepTime += (menuItem.prepTime || 0) * (item.qty || 1);
             }
         });
    }

    // 2. Calculate Queue Wait Time (Sum of wait times of all waiting tokens)
    // Actually, queue wait time is (Sum of prepTime of all people ahead).
    // Let's query all 'waiting' and 'serving' tokens for this queue.
    const activeTokens = await Token.find({ 
        queueId, 
        status: { $in: ['waiting', 'serving'] } 
    });

    let queuePrepTime = 0;
    activeTokens.forEach(t => {
        // If we saved estimatedWaitTime on them, we can't just sum it (that's their wait).
        // We need their *own* prep time. 
        // We didn't explicitly save "myTokenPrepTime" separately, but we can re-calculate or
        // simpler: estimatedWaitTime field in Token usually meant "Time until served".
        // Let's rely on re-calculating from their orderItems.
        if(t.orderItems && t.orderItems.length > 0) {
             t.orderItems.forEach(item => {
                 // We don't have prepTime in orderItems schema, only name/qty/price.
                 // We need to look it up again or store it.
                 // Ideally, store it. But for now, lookup from queue.menu
                 const menuI = queue.menu.find(m => m.name === item.name);
                 if(menuI) queuePrepTime += (menuI.prepTime || 0) * (item.qty || 1);
             });
        } else {
             // Standard queue (Lab/Library) - assume fixed slot time e.g. 5 min per person?
             queuePrepTime += 5; 
        }
    });

    estimatedWaitTime = queuePrepTime + myPrepTime;

    const newToken = await Token.create({
      queueId,
      tokenNumber,
      displayToken,
      studentId,
      userName: student.name,
      rollNo: student.rollNo,
      requirements: requirements || {},
      orderItems: orderItems || [],
      estimatedWaitTime // Store total estimated time
    });
    
    io.emit('queue_updated', { queueId }); 

    res.status(201).json(newToken);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Student History
app.get('/api/student/history/:studentId', async (req, res) => {
  try {
    const tokens = await Token.find({ studentId: req.params.studentId }).populate('queueId').sort({ generatedAt: -1 });
    res.json(tokens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Cancel Token
app.post('/api/token/cancel', async (req, res) => {
  const { tokenId } = req.body;
  try {
    const token = await Token.findById(tokenId).populate('queueId');
    if (!token) return res.status(404).json({ message: 'Token not found' });
    
    // Cancellation Rules for Canteen & Stationary (15 min limit)
    if (token.queueId.name.includes('Canteen') || token.queueId.name === 'Stationary Shop') {
        const diffMs = Date.now() - new Date(token.generatedAt).getTime();
        const diffMins = diffMs / 60000;
        if (diffMins > 15) {
            return res.status(400).json({ message: 'Cancellation only allowed within 15 minutes of booking.' });
        }
    }

    token.status = 'cancelled';
    token.completedAt = new Date();
    await token.save();

    io.emit('queue_updated', { queueId: token.queueId._id });
    res.json({ message: 'Token cancelled' });
  } catch (err) {
     res.status(500).json({ error: err.message });
  }
});

// 5. Get Token Status (Single)
app.get('/api/token/:id', async (req, res) => {
  try {
    const token = await Token.findById(req.params.id).populate('queueId');
    if (!token) return res.status(404).json({ message: 'Token not found' });
    
    const position = await Token.countDocuments({
      queueId: token.queueId._id,
      status: 'waiting',
      tokenNumber: { $lt: token.tokenNumber }
    });

    res.json({ token, position });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Admin: Call Next
app.post('/api/admin/call-next', async (req, res) => {
  const { queueId, assignedResource } = req.body;
  try {
    const queue = await Queue.findById(queueId);
    if (!queue) return res.status(404).json({ message: 'Queue not found' });
    
    const nextToken = await Token.findOne({ queueId, status: 'waiting' }).sort({ tokenNumber: 1 });
    
    if (!nextToken) {
      return res.status(400).json({ message: 'No waiting tokens' });
    }

    nextToken.status = 'serving';
    nextToken.servedAt = new Date();
    if (assignedResource) nextToken.assignedResource = assignedResource;
    await nextToken.save();

    queue.currentNumber = nextToken.tokenNumber;
    await queue.save();

    io.emit('token_called', { 
      tokenId: nextToken._id, 
      displayToken: nextToken.displayToken,
      queueName: queue.name,
      assignedResource
    });

    io.emit('queue_updated', { queueId });

    res.json({ message: 'Next token called', token: nextToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Admin: Mark Complete
app.post('/api/admin/complete', async (req, res) => {
  const { tokenId } = req.body;
  try {
    const token = await Token.findById(tokenId);
    if (!token) return res.status(404).json({ message: 'Token not found' });

    token.status = 'completed';
    token.completedAt = new Date();
    await token.save();
    
    io.emit('queue_updated', { queueId: token.queueId });

    res.json({ message: 'Token completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Admin: Get History
app.get('/api/admin/history/:queueId', async (req, res) => {
    try {
        const history = await Token.find({ 
            queueId: req.params.queueId, 
            status: { $in: ['completed', 'cancelled'] }
        })
        .sort({ completedAt: -1 })
        .limit(50);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. Canteen: Toggle Menu Availability
app.post('/api/queue/menu/toggle', async (req, res) => {
    const { queueId, itemName, isAvailable } = req.body;
    try {
        const queue = await Queue.findById(queueId);
        if (!queue) return res.status(404).json({ message: 'Queue not found' });

        const item = queue.menu.find(i => i.name === itemName);
        if (item) {
            item.isAvailable = isAvailable;
            await queue.save();
            io.emit('queue_updated', { queueId }); // Notify clients to refresh menu
            res.json({ message: 'Menu updated', queue });
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. Admin: Update Specific Token Status (Accept, Ready, etc.)
app.post('/api/token/update-status', async (req, res) => {
    const { tokenId, status } = req.body; // status: 'serving', 'ready', 'completed'
    try {
        const token = await Token.findById(tokenId).populate('queueId');
        if (!token) return res.status(404).json({ message: 'Token not found' });

        token.status = status;
        if (status === 'serving') token.servedAt = new Date();
        if (status === 'completed') token.completedAt = new Date();
        
        await token.save();
        
        io.emit('queue_updated', { queueId: token.queueId._id });
        io.emit('token_status_changed', { tokenId, status, queueId: token.queueId._id });

        res.json({ message: `Token marked as ${status}`, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11. Admin: Get Active Canteen Orders
app.get('/api/queue/:queueId/active-orders', async (req, res) => {
    try {
        const tokens = await Token.find({ 
            queueId: req.params.queueId, 
            status: { $in: ['waiting', 'serving', 'ready'] } 
        }).sort({ generatedAt: 1 });
        res.json(tokens);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Periodic Task: Expire tokens older than 1 hour (if waiting)
const checkExpiredTokens = async () => {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        await Token.updateMany(
            { status: 'waiting', generatedAt: { $lt: oneHourAgo } },
            { $set: { status: 'expired', completedAt: new Date() } }
        );
    } catch (e) {
        console.error("Expiry task error", e);
    }
};
setInterval(checkExpiredTokens, 60 * 1000); 

// Socket Connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on('disconnect', () => console.log('User disconnected'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
