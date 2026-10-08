const fs = require("fs");
const path = require("path");

const Route = require("../models/Route");
const Fare = require("../models/Fare");

const { chatWithGemini } = require("../ai_model/models/GeminiAIModel");
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
// LOCAL KNOWLEDGE BASE FALLBACK ENGINE
// ======================================================

const generateLocalKnowledgeResponse = (messages, routes = [], fares = []) => {
  const lastUserMsg =
    [...messages]
      .reverse()
      .find((m) => m.role === "user")
      ?.content?.toLowerCase() || "";

  // 1. Greetings
  if (
    /^(hi|hello|hey|kamusta|musta|good\s*(morning|afternoon|evening)|magandang\s*(araw|umaga|hapon|gabi))\b/i.test(
      lastUserMsg.trim(),
    )
  ) {
    return (
      "Hello! I am your **SmartSakay Assistant**, your commuter guide for Dagupan City and Pangasinan.\n\n" +
      "I can help you with:\n" +
      "- **Jeepney Routes & Operating Hours**\n" +
      "- **LTFRB Fare Rates & Discounts** (Students, Seniors, PWDs)\n" +
      "- **Bus Terminals along Perez Boulevard**\n" +
      "- **Commuter Rights & Reporting Violations**\n\n" +
      "How can I help you today?"
    );
  }

  // 2. Fares & Discounts
  if (
    /(fare|magkano|pamasahe|rate|discount|presyo|student|senior|pwd|bayad)/i.test(
      lastUserMsg,
    )
  ) {
    return (
      "Here are the official **LTFRB Fare Rates** for Dagupan City:\n\n" +
      "- **Traditional Jeepney**:\n" +
      "  - Base Fare: **₱14.00** (First 4 km)\n" +
      "  - Succeeding: **₱2.00** per succeeding km\n" +
      "- **Modern Jeepney**:\n" +
      "  - Base Fare: **₱17.00** (First 4 km)\n" +
      "  - Succeeding: **₱2.40** per succeeding km\n" +
      "- **Tricycle (Regular)**:\n" +
      "  - Base Fare: **₱15.00** (First 1 km)\n" +
      "  - Succeeding: **₱3.00** per succeeding km\n" +
      "- **Tricycle (Special Trip)**:\n" +
      "  - **₱60.00** for the first 2 km, then **₱10.00** per succeeding km.\n\n" +
      "**Mandatory 20% Discount** applies for:\n" +
      "- **Students** (RA 11314) — with valid school ID\n" +
      "- **Senior Citizens** (RA 9994)\n" +
      "- **Persons with Disability** (RA 7277 / RA 9442)\n\n" +
      "*PUV drivers are strictly prohibited from denying discounts or charging above the matrix.*"
    );
  }

  // 3. Terminals & Buses
  if (
    /(terminal|victory\s*liner|five\s*star|solid\s*north|joybus|genesis|dagupan\s*bus|bus)/i.test(
      lastUserMsg,
    )
  ) {
    return (
      "Here are the primary **Transport Terminals** in Dagupan City:\n\n" +
      "1. **Victory Liner Terminal** — Perez Boulevard (24/7 trips to Manila, Baguio, Tuguegarao)\n" +
      "2. **Five Star Bus Terminal** — Perez Boulevard (Trips to Cubao, Pasay, Avenida, Cabanatuan)\n" +
      "3. **Solid North Transit** — Perez Boulevard (Direct P2P express to PITX & Cubao via TPLEX)\n" +
      "4. **Genesis Transport / JoyBus** — M.H. Del Pilar St. cor. Perez Blvd (Executive service to Baguio & Clark)\n" +
      "5. **Dagupan Bus Co.** — Perez Boulevard (Trips to Manila & Northern Luzon)\n" +
      "6. **Downtown Jeepney Staging Hub** — Perez Blvd & A.B. Fernandez Ave\n" +
      "7. **CSI Mall Lucao Terminal** — Lucao District (Western multimodal transport hub)\n\n" +
      "*For intercity jeepneys to Binmaley/Lingayen, you can board at Perez Blvd or CSI Market Square.*"
    );
  }

  // 4. Commuter Rights & Violations
  if (
    /(right|rights|karapatan|safe\s*space|harass|overcharge|reklamo|sumbong|report|ltfrb)/i.test(
      lastUserMsg,
    )
  ) {
    return (
      "### Commuter Rights & Passenger Protection\n\n" +
      "- **Fair Fare Protection**: Drivers cannot charge more than the official LTFRB tariff matrix.\n" +
      "- **Safe Spaces Act (RA 11313)**: Gender-based sexual harassment in public vehicles and terminals is strictly illegal.\n" +
      "- **Right to Conveyance**: Drivers cannot refuse passengers without valid cause.\n\n" +
      "**How to report a violation in SmartSakay:**\n" +
      "1. Take note of the **Plate Number**, **Body/Side Number**, **Route**, date, and time.\n" +
      "2. Go to the **File Report** section in the SmartSakay app to submit your complaint with photos.\n" +
      "3. The report is recorded directly for Dagupan City POSO and LTFRB review."
    );
  }

  // 5. Specific Routes Match
  const matchedRoutes = routes.filter((r) => {
    const text =
      `${r.name} ${r.code} ${r.corridor} ${r.category}`.toLowerCase();
    const words = lastUserMsg.split(/[\s,]+/);
    return words.some((w) => w.length >= 4 && text.includes(w));
  });

  if (matchedRoutes.length > 0) {
    const r = matchedRoutes[0];
    const waypoints = (r.waypoints || [])
      .map((w) => w.name)
      .slice(0, 6)
      .join(" → ");
    return (
      `### Route: **${r.name}** (${r.code})\n\n` +
      `- **Category**: ${r.category.toUpperCase()}\n` +
      `- **Distance**: **${r.distanceKm} km**\n` +
      `- **Operating Hours**: ${r.operatingHours?.start || "05:00"} - ${r.operatingHours?.end || "21:00"}\n` +
      `- **Terminal**: ${r.terminalLocation?.name || "Downtown Dagupan"}\n` +
      `- **Corridor**: ${r.corridor || "Dagupan transit corridor"}\n` +
      (waypoints ? `- **Key Stops**: ${waypoints}\n\n` : "\n") +
      `*You can view this route on the interactive map in the Routes tab!*`
    );
  }

  // 6. General fallback
  return (
    "I am **SmartSakay Assistant**, your commuter guide for Dagupan City.\n\n" +
    "You can ask me about:\n" +
    "- Current jeepney fares for traditional, modern, and tricycle rides\n" +
    "- Active routes (CSI Lucao, Downtown, Calasiao, Bonuan, Lingayen-Binmaley, San Fabian, Bolosan)\n" +
    "- Bus terminal locations and contact details\n" +
    "- Commuter rights and discount entitlements (20% for Students, Seniors, PWDs)\n\n" +
    "How can I assist your trip in Dagupan today?"
  );
};

// ======================================================
// MAIN CHAT FUNCTION
// ======================================================

const chat = async (messages) => {
  let systemPrompt;
  let activeRoutes = [];
  let activeFares = [];

  // ----------------------------------------------------
  // BUILD SYSTEM PROMPT & FETCH KNOWLEDGE CONTEXT
  // ----------------------------------------------------

  try {
    activeRoutes = await Route.find({ isActive: true }).lean();
    activeFares = await Fare.find({ isActive: true }).lean();
    systemPrompt = composeFittingPrompt(activeRoutes, activeFares, messages);
  } catch (error) {
    console.error("[AI] Failed to build SmartSakay system prompt:", error);
    systemPrompt = composePrompt([], []);
  }

  // ----------------------------------------------------
  // TIER 1: GOOGLE GEMINI (Fast Cloud LLM with Active Key)
  // ----------------------------------------------------
  if (
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "your-gemini-api-key"
  ) {
    try {
      console.log("[AI] Trying Primary AI: Google Gemini...");
      const response = await chatWithGemini(messages, systemPrompt);
      console.log("[AI] Google Gemini response succeeded.");
      return response;
    } catch (geminiError) {
      console.warn(
        "[AI] Google Gemini failed:",
        geminiError?.message || geminiError,
      );
    }
  }

  // ----------------------------------------------------
  // TIER 2: LOCAL OLLAMA (If Running On Localhost)
  // ----------------------------------------------------
  try {
    console.log("[AI] Trying Local Ollama model...");
    const response = await chatWithOllama(messages, systemPrompt);
    console.log("[AI] Local Ollama succeeded.");
    return response;
  } catch (ollamaError) {
    console.warn(
      "[AI] Local Ollama not available:",
      ollamaError?.message || ollamaError,
    );
  }

  // ----------------------------------------------------
  // TIER 3: GROQ CLOUD (If Configured)
  // ----------------------------------------------------
  if (
    process.env.GROQ_API_KEY &&
    process.env.GROQ_API_KEY !== "your-groq-api-key"
  ) {
    try {
      console.log("[AI] Trying Groq Cloud AI...");
      const response = await chatWithGroq(messages, systemPrompt);
      console.log("[AI] Groq fallback succeeded.");
      return response;
    } catch (groqError) {
      console.warn(
        "[AI] Groq fallback failed:",
        groqError?.message || groqError,
      );
    }
  }

  // ----------------------------------------------------
  // TIER 4: GUARANTEED LOCAL KNOWLEDGE ENGINE (Zero-Crash Fallback)
  // ----------------------------------------------------
  console.log(
    "[AI] Serving response via SmartSakay Local Knowledge Engine...",
  );
  return generateLocalKnowledgeResponse(
    messages,
    activeRoutes,
    activeFares,
  );
};

const checkAiStatus = async () => {
  return {
    online: true,
    gemini: Boolean(
      process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== "your-gemini-api-key",
    ),
    groq: Boolean(
      process.env.GROQ_API_KEY &&
        process.env.GROQ_API_KEY !== "your-groq-api-key",
    ),
    knowledgeBase: true,
    provider: "Google Gemini 3.5 Flash (with Local Knowledge Fallback)",
  };
};

module.exports = {
  chat,
  composePrompt,
  generateLocalKnowledgeResponse,
  checkAiStatus,
};
