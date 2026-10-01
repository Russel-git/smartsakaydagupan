const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = "openai/gpt-oss-120b";

const chatWithGroq = async (messages, systemPrompt) => {
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

  console.log("[GroqAI] Sending request...");
  console.log(`[GroqAI] Model: ${GROQ_MODEL}`);

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: formattedMessages,
      temperature: 0.5,
      max_completion_tokens: 1024,
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Groq returned an empty response.");
    }

    console.log(`[GroqAI] Response length: ${content.length} characters`);

    return content;
  } catch (error) {
    console.error("[GroqAI] Request failed.");

    if (error?.status) {
      console.error("[GroqAI] Status:", error.status);
    }

    if (error?.message) {
      console.error("[GroqAI] Message:", error.message);
    }

    throw error;
  }
};

module.exports = {
  chatWithGroq,
};
