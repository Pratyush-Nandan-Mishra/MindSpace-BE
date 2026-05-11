import MessageRateLimit from '../models/MessageRateLimit.js';

const DAILY_LIMIT = 10;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const rateLimitChat = async (req, res, next) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  const userId = req.user._id;

   if (req.user.role === 'admin') {
    return next();
  }

  const now = new Date();

  try {
    let limitDoc = await MessageRateLimit.findOne({ userId });

    //no record or last reset 24 hour ago then reset counter
    if (!limitDoc) {
      limitDoc = await MessageRateLimit.create({
        userId,
        count: 1,
        lastReset: now
      });
      return next(); // Allow request
    }

    const timeSinceLastReset = now - limitDoc.lastReset;

    if (timeSinceLastReset > DAY_IN_MS) {
      // More than 24h passed → reset
      limitDoc.count = 1;
      limitDoc.lastReset = now;
      await limitDoc.save();
      return next();
    }

    // Still within 24h window
    if (limitDoc.count >= DAILY_LIMIT) {
      return res.status(429).json({
        success: false,
        message: 'Daily message limit reached. Try again tomorrow.',
        botResponse: "Daily conversation limit reached. Subscribe now to continue your friendly gossip."
      });
    }

    // Increment count
    limitDoc.count += 1;
    await limitDoc.save();

    next();
  } catch(error){
    console.error('Rate limiting error:', error);
    next();
  }
};

export default rateLimitChat;