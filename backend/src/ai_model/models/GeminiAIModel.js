const axios = require("axios");

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const PRIMARY_MODEL = "models/gemini-3.5-flash";
const FALLBACK_MODEL = "models/gemini-3.5-flash-lite";

const chatWithGemini = async (messages, systemPrompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key") {
    throw new Error("GEMINI_API_KEY is missing or invalid.");
  }

  // Format messages for Google Generative AI
  // Gemini expects roles 'user' and 'model'
  const contents = messages
    .filter(
      (msg) =>
        (msg.role === "user" || msg.role === "assistant" || msg.role === "model") &&
        typeof msg.content === "string" &&
        msg.content.trim().length > 0
    )
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : msg.role,
      parts: [{ text: msg.content.trim() }],
    }));

  if (contents.length === 0) {
    throw new Error("No valid messages to send to Gemini.");
  }

  const payload = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
    },
  };

  const tryModel = async (modelName) => {
    console.log(`[GeminiAI] Attempting ${modelName}...`);
    const endpoint = `${GEMINI_API_URL}/${modelName}:generateContent?key=${apiKey}`;
    const response = await axios.post(endpoint, payload, { timeout: 15000 });
    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      throw new Error(`Empty response from ${modelName}`);
    }
    return reply;
  };

  try {
    return await tryModel(PRIMARY_MODEL);
  } catch (primaryErr) {
    console.warn(`[GeminiAI] Primary model failed: ${primaryErr.message}. Trying fallback ${FALLBACK_MODEL}...`);
    return await tryModel(FALLBACK_MODEL);
  }
};

module.exports = {
  chatWithGemini,
};
