import express from "express";
import { ChatController, getConversations, getConversation, deleteConversation, clearAllConversations, createConversation } from "../controllers/chat.controller.js";
import { authenticateJWT } from '../middleware/jwt.middleware.js';

const router = express.Router();

router.post('/chat', authenticateJWT, ChatController);
router.post('/conversation/new', authenticateJWT, createConversation);
router.get('/conversations', authenticateJWT, getConversations);
router.get('/conversation/:conversationId', authenticateJWT, getConversation);
router.delete('/conversation/:conversationId', authenticateJWT, deleteConversation);
router.delete('/conversations/clear', authenticateJWT, clearAllConversations);

export default router;