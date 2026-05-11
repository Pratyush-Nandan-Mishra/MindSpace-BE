import mongoose from 'mongoose';

// Individual message schema
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Conversation schema
const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    default: 'New Chat'
  },
  messages: [messageSchema],
  lastMessage: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'conversations'
});

// Index for better performance
conversationSchema.index({ userId: 1, updatedAt: -1 });
conversationSchema.index({ userId: 1, isActive: 1 });

// Method to add a message to conversation
conversationSchema.methods.addMessage = function(role, content) {
  this.messages.push({ role, content });
  this.lastMessage = new Date();
  
  // Auto-generate title from first user message if it's still "New Chat"
  if (this.title === 'New Chat' && role === 'user' && this.messages.length <= 2) {
    this.title = content.length > 50 ? content.substring(0, 50) + '...' : content;
  }
  
  return this.save();
};

// Method to get conversation summary for sidebar
conversationSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    lastMessage: this.lastMessage,
    messageCount: this.messages.length
  };
};

// Static method to get user's conversations
conversationSchema.statics.getUserConversations = async function(userId, limit = 50) {
  return this.find({ 
    userId, 
    isActive: true 
  })
  .sort({ lastMessage: -1 })
  .limit(limit)
  .select('title lastMessage messages')
  .lean();
};

// Static method to create new conversation
conversationSchema.statics.createNew = async function(userId, initialMessage) {
  const conversation = new this({
    userId,
    title: 'New Chat',
    messages: []
  });

  if (initialMessage) {
    await conversation.addMessage('user', initialMessage);
  }

  return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;