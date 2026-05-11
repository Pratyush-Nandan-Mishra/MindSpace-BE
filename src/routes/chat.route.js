import express from "express";
import { ChatController, getConversations, getConversation, deleteConversation, clearAllConversations, createConversation } from "../controllers/chat.controller.js";
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

// Chat endpoints
router.post('/chat', ChatController);
//router.post('/', isAuthenticated, ChatController);
router.post('/conversation/new', isAuthenticated, createConversation);

// Conversation management
router.get('/conversations', isAuthenticated, getConversations);
router.get('/conversation/:conversationId', isAuthenticated, getConversation);
router.delete('/conversation/:conversationId', isAuthenticated, deleteConversation);
router.delete('/conversations/clear', isAuthenticated, clearAllConversations);

export default router;