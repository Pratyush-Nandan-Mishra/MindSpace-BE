import Feedback from "../models/Feedback.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";

export const createFeedback = AsyncHandler(async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const newFeedback = new Feedback({
      name,
      email,
      message,
    });

    const savedFeedback = await newFeedback.save();
    res.status(201).json({
      success: true,
      message: "Thanks For Your Feedback",
    });
  } catch (error) {
    console.error("Error recieving feedback:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({}, {
      password: 0,
      __v: 0
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      feedbacks
    });
  }
  catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
