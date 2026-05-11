import express from 'express';
import {
  createFAQ,
  getAllFAQs,
  getFAQById,
  updateFAQ,
  deleteFAQ,
  searchFAQs
} from '../controllers/faq.controller.js';
import { isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/search', searchFAQs); 
router.get('/', getAllFAQs);
router.get('/:id', getFAQById);
router.post('/', createFAQ);

// Admin-only (testing)
router.post('/', isAdmin, createFAQ);
router.put('/:id', isAdmin, updateFAQ);
router.delete('/:id', isAdmin, deleteFAQ);

export default router;