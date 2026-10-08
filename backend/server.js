require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const intelligenceRoutes = require('./routes/intelligenceRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');

const app = express();

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/roadmap', roadmapRoutes);

app.get('/', (req, res) => res.json({ status: '🚀 Startup Resource Hub API Running smoothly' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Startup Resource Hub Backend running on http://localhost:${PORT}`));
