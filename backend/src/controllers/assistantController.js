const ChatHistory = require('../models/ChatHistory');
const aiService = require('../services/aiService');
const apiResponse = require('../utils/apiResponse');
const crypto = require('crypto');

const chat = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !message.trim()) return apiResponse.error(res, 'Message is required', 400);

    const currentSessionId = sessionId || crypto.randomUUID();
    let chatHistory = await ChatHistory.findOne({ userId: req.user._id, sessionId: currentSessionId });
    if (!chatHistory) {
      chatHistory = await ChatHistory.create({ userId: req.user._id, sessionId: currentSessionId, messages: [] });
    }

    chatHistory.messages.push({ role: 'user', content: message.trim(), timestamp: new Date() });
    const recentMessages = chatHistory.messages.slice(-4);
    const aiResponse = await aiService.chat(recentMessages);
    chatHistory.messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });
    await chatHistory.save();

    return apiResponse.success(res, { sessionId: currentSessionId, response: aiResponse }, 'Response generated');
  } catch (error) { next(error); }
};

const getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    const filter = { userId: req.user._id };
    if (sessionId) filter.sessionId = sessionId;
    const history = await ChatHistory.find(filter).sort({ updatedAt: -1 });
    return apiResponse.success(res, history);
  } catch (error) { next(error); }
};

const clearHistory = async (req, res, next) => {
  try {
    await ChatHistory.deleteMany({ userId: req.user._id });
    return apiResponse.success(res, null, 'Chat history cleared');
  } catch (error) { next(error); }
};

const getStatus = async (req, res, next) => {
  try {
    const status = await aiService.checkAiStatus();
    return apiResponse.success(res, status, 'AI status retrieved');
  } catch (error) { next(error); }
};

module.exports = { chat, getHistory, clearHistory, getStatus };
