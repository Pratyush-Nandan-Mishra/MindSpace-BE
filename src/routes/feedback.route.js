import express from 'express';
import {createFeedback, getAllFeedbacks } from '../controllers/feedback.controller.js';

const router = express.Router();

// POST /api/contact - Submit contact/feedback form
router.post('/', createFeedback);
router.get('/all', getAllFeedbacks); // GET: Fetch all feedbacks (admin only)
export default router;