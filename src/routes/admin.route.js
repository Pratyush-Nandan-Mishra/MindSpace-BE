import express from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware.js';
import { adminDashboardHandler } from '../controllers/admin.controller.js';
import adminStatsRoutes from "./stats.route.js"

const router = express.Router();

router.get('/dashboard', isAuthenticated, isAdmin, adminDashboardHandler);
router.use (adminStatsRoutes)

export default router;
