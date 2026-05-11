import express from 'express';
import authRoutes from './auth.route.js';
import feedbackRoutes from './feedback.route.js';
import adminRoutes from './admin.route.js';
import chatRoutes from "./chat.route.js"
import adminstatRoutes from "./stats.route.js"
import faqRoutes from './faq.route.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Shakte Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

router.use('/auth', authRoutes);
router.use('/feedback', feedbackRoutes);
router.use ("/admin", adminRoutes);
router.use("/chat", chatRoutes);
router.use('/faq', faqRoutes); 

router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

export default router; 