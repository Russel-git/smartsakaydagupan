const axios = require("axios");

const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const OLLAMA_MODEL = "smartsakay_ai";

const chatWithOllama = async (messages, systemPrompt) => {
  const formattedMessages = [
    {
      role: "system",
      content: systemPrompt,
    },

    ...messages
      .filter(
        (msg) =>
          (msg.role === "user" || msg.role === "assistant") &&
          typeof msg.content === "string" &&
          msg.content.trim().length > 0,
      )
      .map((msg) => ({
        role: msg.role,
        content: msg.content.trim(),
      })),
  ];

  console.log("[SmartSakayAI] Preparing Ollama request...");
  console.log(`[SmartSakayAI] Model: ${OLLAMA_MODEL}`);
  console.log(`[SmartSakayAI] Prompt: ${systemPrompt.length} characters`);

  const startTime = Date.now();

  try {
    const response = await axios.post(
      OLLAMA_URL,
      {
        model: OLLAMA_MODEL,
        messages: formattedMessages,
        stream: false,
        keep_alive: "30m",
        options: {
          temperature: 0.2,
          top_p: 0.9,
          num_ctx: 4096,
        },
      },
      {
        timeout: 300000,
      },
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[SmartSakayAI] Response received in ${elapsed}s`);

    const content = response.data?.message?.content;

    if (!content) {
      throw new Error("Ollama returned an empty response.");
    }

    console.log(`[SmartSakayAI] Response length: ${content.length} characters`);

    return content;
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.error(`[SmartSakayAI] Ollama failed after ${elapsed}s`);

    console.error("[SmartSakayAI] Error code:", error.code);
    console.error("[SmartSakayAI] Error message:", error.message);

    throw error;
  }
};

module.exports = {
  chatWithOllama,
};
