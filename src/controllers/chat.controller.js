import chat from '../helpers/chat.helper.js';
import Conversation from '../models/Conversation.js';

export const ChatController = async (req, res) => {
    const { message, conversationId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({
            error: "Unauthorised!"
        });
    }

    try {
        let conversation;

        // Find existing conversation or create new one
        if (conversationId) {
            conversation = await Conversation.findOne({ 
                _id: conversationId, 
                userId: userId,
                isActive: true 
            });
            
            if (!conversation) {
                return res.status(404).json({
                    error: "Conversation not found"
                });
            }
        } else {
            // Create new conversation
            conversation = await Conversation.createNew(userId);
        }

        // Add user message to conversation
        await conversation.addMessage('user', message);

        // Get AI response
        const chatReply = await chat(userId, message);

        // Add AI response to conversation
        await conversation.addMessage('assistant', chatReply);

        // Return response with conversation info
        res.json({ 
            reply: chatReply,
            conversationId: conversation._id,
            title: conversation.title
        });

    } catch (error) {
        console.error("Chat route error:", error);
        res.status(500).json({
            error: error.message
        });
    }
};

// Get user's conversations for sidebar
export const getConversations = async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({
            error: "Unauthorised!"
        });
    }

    try {
        const conversations = await Conversation.getUserConversations(userId);
        
        const formattedConversations = conversations.map(conv => ({
            id: conv._id,
            title: conv.title,
            lastMessage: conv.lastMessage,
            messageCount: conv.messages.length
        }));

        res.json({ 
            success: true,
            conversations: formattedConversations 
        });
    } catch (error) {
        console.error("Get conversations error:", error);
        res.status(500).json({
            error: "Failed to fetch conversations"
        });
    }
};

// Get specific conversation with messages
export const getConversation = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({
            error: "Unauthorised!"
        });
    }

    try {
        const conversation = await Conversation.findOne({
            _id: conversationId,
            userId: userId,
            isActive: true
        });

        if (!conversation) {
            return res.status(404).json({
                error: "Conversation not found"
            });
        }

        res.json({
            success: true,
            conversation: {
                id: conversation._id,
                title: conversation.title,
                messages: conversation.messages,
                lastMessage: conversation.lastMessage
            }
        });
    } catch (error) {
        console.error("Get conversation error:", error);
        res.status(500).json({
            error: "Failed to fetch conversation"
        });
    }
};

// Delete conversation
export const deleteConversation = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({
            error: "Unauthorised!"
        });
    }

    try {
        const conversation = await Conversation.findOneAndUpdate(
            { _id: conversationId, userId: userId },
            { isActive: false },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({
                error: "Conversation not found"
            });
        }

        res.json({
            success: true,
            message: "Conversation deleted successfully"
        });
    } catch (error) {
        console.error("Delete conversation error:", error);
        res.status(500).json({
            error: "Failed to delete conversation"
        });
    }
};

// Clear all conversations (soft delete)
export const clearAllConversations = async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({
            error: "Unauthorised!"
        });
    }

    try {
        await Conversation.updateMany(
            { userId: userId, isActive: true },
            { isActive: false }
        );

        res.json({
            success: true,
            message: "All conversations cleared successfully"
        });
    } catch (error) {
        console.error("Clear conversations error:", error);
        res.status(500).json({
            error: "Failed to clear conversations"
        });
    }
};

// Create new conversation
export const createConversation = async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({
            error: "Unauthorised!"
        });
    }

    try {
        const conversation = await Conversation.createNew(userId);

        res.json({
            success: true,
            conversation: {
                id: conversation._id,
                title: conversation.title,
                messages: conversation.messages,
                lastMessage: conversation.lastMessage
            }
        });
    } catch (error) {
        console.error("Create conversation error:", error);
        res.status(500).json({
            error: "Failed to create conversation"
        });
    }
};