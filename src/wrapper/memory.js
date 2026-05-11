import ChatMemory from "../models/ChatMemory.js";

export const loadLongTermMemory = async (userId) => {
  let memory = await ChatMemory.findOne({ userId });
  if (!memory) {
    memory = await ChatMemory.create({ userId });
  }
  return memory.longTerm || [];
};

export const appendSummaryToLongTerm = async (userId, summary) => {
  let memory = await ChatMemory.findOne({ userId });
  if (!memory) {
    memory = await ChatMemory.create({ userId });
  }
  memory.longTerm.push(summary);
  memory.updatedAt = new Date();
  await memory.save();
};