import mongoose from 'mongoose';

const messageRateLimitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  count: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  lastReset: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('MessageRateLimit', messageRateLimitSchema);