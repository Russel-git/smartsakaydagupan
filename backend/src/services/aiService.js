const fs = require("fs");
const path = require("path");

const Route = require("../models/Route");
const Fare = require("../models/Fare");

const { chatWithOllama } = require("../ai_model/models/SmartSakayAIModel");
const { chatWithGroq } = require("../ai_model/models/GroqAIModel");

const PROMPT_CONFIG = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../ai_model/prompt/smartsakay_prompt.json"),
    "utf8",
  ),
);

const n = (x) => String(x);
const bullets = (items) => items.map((i) => `- ${i}`).join("\n");
const joinAnd = (items) =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;

const renderRoutes = (routes) => {
  if (!routes.length) {
    return "NO ACTIVE ROUTE DATA IS AVAILABLE.";
  }

  return routes
    .map((r) => {
      const waypointNames =
        r.waypoints?.length > 0
          ? [...r.waypoints]
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((w) => w.name)
              .join(" → ")
          : "No waypoint information available";

      return [
        `Route Name: ${r.name || "Unnamed route"}`,
        `Route Code: ${r.code || "No code"}`,
        `Category: ${r.category || "Unknown"}`,
        `Distance: ${r.distanceKm ?? "Unknown"} km`,
        `Start Point: ${r.startPoint?.name || "Unknown"}`,
        `End Point: ${r.endPoint?.name || "Unknown"}`,
        `Terminal: ${r.terminalLocation?.name || "Unknown"}`,
        `Terminal Address: ${r.terminalLocation?.address || "Unknown"}`,
        `Operating Hours: ${r.operatingHours?.start || "Unknown"} - ${r.operatingHours?.end || "Unknown"}`,
        `Loop Route: ${r.isLoop ? "Yes" : "No"}`,
        `Waypoints: ${waypointNames}`,
      ].join("\n");
    })
    .join("\n\n");
};

const renderFares = (fares) => {
  if (!fares.length) {
    return "NO ACTIVE FARE DATA IS AVAILABLE.";
  }

  const pct = (v) => ((v || 0) * 100).toFixed(0);

  return fares
    .map((f) =>
      [
        `Vehicle Type: ${f.vehicleType}`,
        `Base Fare: ₱${n(f.baseFare)}`,
        `Base Distance: ${n(f.baseDistanceKm)} km`,
        `Additional Fare: ₱${n(f.perKmRate)} per succeeding kilometer`,
        `Student Discount: ${pct(f.discounts?.student)}%`,
        `Senior Citizen Discount: ${pct(f.discounts?.seniorCitizen)}%`,
        `PWD Discount: ${pct(f.discounts?.pwd)}%`,
        `Source: SmartSakay database`,
      ].join("\n"),
    )
    .join("\n\n");
};

const composePrompt = (routes, fares) => {
  const c = PROMPT_CONFIG;
  const rights = c.commuter_rights;
  const sr = c.special_tricycle_ride;

  const sections = [
    `${c.identity.description} You help with ${joinAnd(c.identity.purpose)}.`,

    `## HOW TO USE THE DATA\n${bullets([
      c.data_usage.source,
      c.data_usage.provided_data_rule,
      c.data_usage.missing_data_rule,
      c.data_usage.fare_rule,
      c.data_usage.discount_rule,
      c.data_usage.limitations_rule,
    ])}`,

    `## TRICYCLE SPECIAL RIDE (not in the database)\n${bullets([
      `${sr.first_fare} for the first ${sr.first_distance}, then ${sr.additional_fare} for each succeeding km.`,
      sr.rule,
    ])}`,

    `## BUS TERMINALS\n${bullets(c.bus_terminals)}\n${c.bus_schedule_note}`,

    `## COMMUTER RIGHTS\n${bullets([
      `Senior citizens: ${rights.senior_citizens.discount} fare discount (${rights.senior_citizens.law}).`,
      `Persons with disability: ${rights.persons_with_disability.discount} fare discount and ${rights.persons_with_disability.additional_right} (${rights.persons_with_disability.law}).`,
      `Students: ${rights.students.discount} fare discount with a ${rights.students.requirement} (${rights.students.law}).`,
      `Safe Spaces Act (${rights.safe_spaces_act.law}) covers ${rights.safe_spaces_act.coverage}.`,
      `LTFRB rules cover ${joinAnd(rights.ltfrb.coverage)}. ${rights.ltfrb.fare_rule}`,
    ])}\n${rights.possible_violation_response}`,

    `## STYLE\n${bullets([
      ...c.style.rules,
      `If the question is not about SmartSakay or commuting, reply exactly: "${c.off_topic.response}"`,
    ])}`,

    `## ROUTE DATA\n${renderRoutes(routes)}`,
    `## FARE DATA\n${renderFares(fares)}`,
  ];

  return sections.join("\n\n").trim();
};

const MAX_ROUTES = 4;
const MAX_PROMPT_TOKENS = 1800;
const estimateTokens = (text) => Math.ceil(String(text).length / 3);
const GENERIC = new Set([
  "dagupan",
  "terminal",
  "public",
  "market",
  "town",
  "proper",
  "city",
  "route",
  "jeepney",
]);

const rankRoutes = (routes, messages) => {
  const text = messages
    .filter((m) => m.role === "user")
    .map((m) => String(m.content).toLowerCase())
    .join(" ");

  return routes
    .map((r, i) => {
      const names = [
        r.name,
        r.code,
        r.startPoint?.name,
        r.endPoint?.name,
        r.terminalLocation?.name,
        ...(r.waypoints || []).map((w) => w.name),
      ];
      let score = 0;
      for (const name of names) {
        for (const word of String(name || "")
          .toLowerCase()
          .split(/[^a-z0-9ñ]+/)) {
          if (word.length >= 4 && !GENERIC.has(word) && text.includes(word))
            score++;
        }
      }
      return { r, score, i };
    })
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.r);
};

const composeFittingPrompt = (routes, fares, messages) => {
  const ranked = rankRoutes(routes, messages);
  const historyTokens = messages.reduce(
    (sum, m) => sum + estimateTokens(m.content || "") + 8,
    0,
  );

  let count = Math.min(ranked.length, MAX_ROUTES);
  let prompt = composePrompt(ranked.slice(0, count), fares);

  while (
    count > 1 &&
    estimateTokens(prompt) + historyTokens > MAX_PROMPT_TOKENS
  ) {
    count--;
    prompt = composePrompt(ranked.slice(0, count), fares);
  }

  console.log(
    `[AI] Using ${count}/${routes.length} routes, ~${estimateTokens(prompt) + historyTokens} tokens`,
  );
  return prompt;
};

const buildSystemPrompt = async (messages = []) => {
  console.log("[AI] Building SmartSakay system prompt...");

  const routes = await Route.find({ isActive: true }).lean();
  console.log(`[AI] Loaded ${routes.length} active routes.`);

  const fares = await Fare.find({ isActive: true }).lean();
  console.log(`[AI] Loaded ${fares.length} active fares.`);

  return composeFittingPrompt(routes, fares, messages);
};

// ======================================================
// MAIN CHAT FUNCTION
// ======================================================

const chat = async (messages) => {
  let systemPrompt;

  // ----------------------------------------------------
  // BUILD SYSTEM PROMPT
  // ----------------------------------------------------

  try {
    systemPrompt = await buildSystemPrompt(messages);
  } catch (error) {
    console.error("[AI] Failed to build SmartSakay system prompt:", error);
    systemPrompt = composePrompt([], []);
  }

  // ----------------------------------------------------
  // PRIMARY MODEL: OLLAMA
  // ----------------------------------------------------

  try {
    console.log("[AI] ========================================");
    console.log("[AI] Trying primary AI: SmartSakayAI / Ollama");

    const response = await chatWithOllama(messages, systemPrompt);

    console.log("[AI] Primary AI succeeded.");

    return response;
  } catch (ollamaError) {
    console.error("[AI] ========================================");
    console.error("[AI] SmartSakayAI / Ollama failed.");
    console.error("[AI] Error:", ollamaError?.message || ollamaError);

    // --------------------------------------------------
    // FALLBACK MODEL: GROQ
    // --------------------------------------------------

    try {
      console.log("[AI] Trying fallback AI: Groq");

      const response = await chatWithGroq(messages, systemPrompt);

      console.log("[AI] Groq fallback succeeded.");

      return response;
    } catch (groqError) {
      console.error("[AI] ========================================");
      console.error("[AI] Groq fallback also failed.");
      console.error("[AI] Error:", groqError?.message || groqError);

      throw new Error("AI service is currently unavailable.");
    }
  }
};

module.exports = {
  chat,
  composePrompt,
};
