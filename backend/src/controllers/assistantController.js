const ChatHistory = require("../models/ChatHistory");
const aiService = require("../services/aiService");
const apiResponse = require("../utils/apiResponse");
const crypto = require("crypto");

const chat = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !message.trim())
      return apiResponse.error(res, "Message is required", 400);

    const currentSessionId = sessionId || crypto.randomUUID();
    let chatHistory = await ChatHistory.findOne({
      userId: req.user._id,
      sessionId: currentSessionId,
    });
    if (!chatHistory) {
      chatHistory = await ChatHistory.create({
        userId: req.user._id,
        sessionId: currentSessionId,
        messages: [],
      });
    }

    chatHistory.messages.push({
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    });
    const recentMessages = chatHistory.messages.slice(-4);
    const aiResponse = await aiService.chat(recentMessages);
    chatHistory.messages.push({
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
    });
    await chatHistory.save();

    return apiResponse.success(
      res,
      { sessionId: currentSessionId, response: aiResponse },
      "Response generated",
    );
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const history = await ChatHistory.findOne({
      userId: req.user._id,
      sessionId: id,
    }).lean();

    if (!history) {
      return apiResponse.error(res, "Chat history not found", 404);
    }

    return apiResponse.success(
      res,
      {
        sessionId: history.sessionId,
        messages: history.messages,
        createdAt: history.createdAt,
        updatedAt: history.updatedAt,
      },
      "Chat history retrieved",
    );
  } catch (error) {
    next(error);
  }
};

const getHistoryList = async (req, res, next) => {
  try {
    const history = await ChatHistory.find({
      userId: req.user._id,
    })
      .sort({ updatedAt: -1 })
      .lean();

    const formattedHistory = history.map((chat) => {
      const firstUserMessage = chat.messages?.find(
        (message) => message.role === "user",
      );

      const lastMessage =
        chat.messages?.[chat.messages.length - 1]?.content || "";

      return {
        _id: chat._id,
        sessionId: chat.sessionId,

        title: firstUserMessage
          ? firstUserMessage.content.substring(0, 40) +
            (firstUserMessage.content.length > 40 ? "..." : "")
          : "New Chat",

        lastMessage:
          lastMessage.substring(0, 60) + (lastMessage.length > 60 ? "..." : ""),

        updatedAt: chat.updatedAt,
      };
    });

    return apiResponse.success(res, formattedHistory, "Chat history retrieved");
  } catch (error) {
    next(error);
  }
};

const clearHistory = async (req, res, next) => {
  try {
    await ChatHistory.deleteMany({ userId: req.user._id });
    return apiResponse.success(res, null, "Chat history cleared");
  } catch (error) {
    next(error);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const status = await aiService.checkAiStatus();
    return apiResponse.success(res, status, "AI status retrieved");
  } catch (error) {
    next(error);
  }
};

module.exports = { chat, getHistory, getHistoryList, clearHistory, getStatus };
