import express from "express";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { statsController } from "../controllers/stats.controller.js";
const router = express.Router();

router.get("/stats", isAuthenticated, isAdmin, statsController);

export default router;