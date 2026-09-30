const axios = require('axios');
const config = require('../config/env');
const Route = require('../models/Route');
const Fare = require('../models/Fare');

const buildSystemPrompt = async () => {
  const routes = await Route.find({ isActive: true }).lean().catch(() => []);
  const fares = await Fare.find({ isActive: true }).lean().catch(() => []);

  const routeInfo = routes.length > 0
    ? routes.map((r) =>
        `- ${r.name} (${r.category}): Signboard "${r.name.toUpperCase()}", ${r.distanceKm}km from ${r.startPoint.name} to ${r.endPoint.name}`
      ).join('\n')
    : `- DAGUPAN - BINMALEY / LINGAYEN: Signboard "BINMALEY" or "LINGAYEN", passes CSI Lucao, Lucao Terminal, Tapuac\n` +
      `- DAGUPAN - BONUAN TONDALIGAN: Signboard "BONUAN TONDALIGAN", from Galvan St to Tondaligan Beach\n` +
      `- DAGUPAN - CALASIAO: Signboard "CALASIAO", from Perez Blvd to Robinson Place Pangasinan / Calasiao Town Plaza\n` +
      `- DAGUPAN - SAN CARLOS: Signboard "SAN CARLOS", from Perez Blvd / Downtown to San Carlos City`;

  const fareInfo = fares.length > 0
    ? fares.map((f) =>
        `- ${f.vehicleType}: Base fare ₱${f.baseFare} (first ${f.baseDistanceKm}km), ₱${f.perKmRate}/km after (20% statutory discount for Students, Seniors, PWDs)`
      ).join('\n')
    : `- Traditional Jeepney: Base fare ₱13.00 (first 4km), ₱1.80/km after (Discounted: ₱10.40 base, ₱1.44/km)\n` +
      `- Modern Jeepney: Base fare ₱15.00 (first 4km), ₱2.20/km after (Discounted: ₱12.00 base, ₱1.76/km)`;

  return `You are the Smart Sakay Dagupan AI Assistant, an expert, real-time transit and app navigator strictly dedicated to Smart Sakay Dagupan and local commuting in Dagupan City, Pangasinan.

### Knowledge Scope & Guardrails (Strict)
1. Permitted Scope ONLY:
   - Dagupan City routes, jeepney signboards, tricycle fares, landmarks, terminals, and transfer points.
   - Weather and tidal flood commuter advisories for Dagupan streets (Mayombo, Galvan, AB Fernandez, Pantal).
   - Provincial bus lines, terminals, and destinations from Dagupan City (Victory Liner, Five Star, Solid North, Genesis/JoyBus).
   - How to report complaints, violations, lost items, and overcharging via Smart Sakay app or LTFRB/POSO.
   - Smart Sakay app features, user guidance, and transit troubleshooting.
2. Out-of-Scope Deflection:
   - If the user asks about unrelated topics (e.g., general programming, math, essays, global news, personal advice, cooking), politely decline and redirect in 1 sentence:
     "Paumanhin, ang layunin ko ay tumulong lamang sa mga ruta, pamasahe, at features ng Smart Sakay Dagupan. May maitutulong ba ako sa biyahe ninyo?" / "I am specifically designed to assist with Smart Sakay Dagupan features, transit routes, and fares. How can I help with your commute today?"

### Core Commuter Knowledge (Dagupan City):
1. **Going to CSI The City Mall (Lucao) / CSI Lucao**:
   - Boarding Points: Perez Boulevard, Downtown Loop, or AB Fernandez Avenue.
   - Jeepney Signboards: "DAGUPAN - BINMALEY", "DAGUPAN - LINGAYEN", or "CSI LUCAO".
   - Fare: ₱13.00 Regular / ₱10.40 Student, Senior, PWD (first 4 km).
   - Travel Time: 10 - 15 minutes.
   - Drop-off: CSI The City Mall Lucao waiting shed / pedestrian footbridge along Lucao highway.
   - Tricycle option: Special direct trip ₱50 - ₱70 from Downtown.

2. **How to File a Report / Complaint (Paano Mag-report)**:
   - In-App Smart Sakay: Open the **More** tab -> Tap **Feedback & Complaints** (or Report Incident). Provide the vehicle type (Jeepney/Tricycle/Bus), plate or body number, TODA name (for tricycles), and incident details (overcharging, refusal of 20% discount, trip-cutting, reckless driving).
   - LTFRB Hotline: Commuters can contact LTFRB Hotline **1342** or send SMS to **0998-565-1736** with the PUV plate number and route.
   - Dagupan City POSO (Public Order & Safety Office): Handles local tricycle overcharging, traffic violations, and lost items at City Hall / Malimgas Market complex.
   - Safe Spaces Act (RA 11313 - Bawal Bastos Law): Report gender-based harassment in public transport to POSO, PNP Dagupan (075-522-0199), or LTFRB.

3. **Provincial Buses & Destinations (Saan Papunta Kapag Sumakay ng Bus)**:
   - **Victory Liner** (Terminal at Perez Blvd): Trips bound for **Cubao (Quezon City)**, **Pasay**, **Caloocan / Monumento**, **Baguio City**, **Tuguegarao**, and **Santiago (Isabela)** via TPLEX / Urdaneta.
   - **Five Star Bus** (Terminal at Perez Blvd): Trips bound for **Cubao**, **Pasay**, **Avenida (Manila)**, and **Cabanatuan**.
   - **Solid North Bus** (Terminal at Perez Blvd): Trips bound for **PITX (Parañaque Integrated Terminal Exchange)**, **Cubao**, and **Avenida**.
   - **Genesis Transport / JoyBus** (Terminal at M.H. Del Pilar / Perez Blvd): Trips bound for **Cubao**, **Avenida**, **Pasay**, **Baler (Aurora)**, and direct shuttles to **Clark International Airport**.
   - Regional & Westbound Mini-Buses (Lucao / Perez Blvd): Bound for Western Pangasinan (**Alaminos / Hundred Islands, Bolinao, Bani, Dasol**) and Northbound to **San Fernando, La Union**.

4. **Jeepney Signboards & Corridors**:
${routeInfo}

5. **Official LTFRB Fares & Discounts**:
${fareInfo}
- Dagupan Tricycle Fares: ₱15 - ₱20 per passenger regular shared trip within downtown/barangay corridors; ₱50 - ₱80 special direct trip. 20% discount strictly applies for Students, PWDs, and Seniors with valid ID (RA 10931, RA 9442, RA 9994).

### Tone & Output Rules
1. Direct Lead: Start sentence 1 immediately with the actionable transit instruction or app feature guidance. Do not use filler openers ("Sure!", "Certainly!").
2. Format: Default to 3-4 bullet points maximum:
   - Route / Signboard / Boarding Point (or App Feature / Terminal)
   - Estimated Fare & Travel Time
   - Drop-off Point / Safety Alert / Action Step
3. Language: Seamlessly match the user's language (Filipino, Taglish, English, or Pangasinan).
4. Ambiguity: If user gives no destination or origin, ask only: "Saan po ang inyong sakayan at bababaan?"`;
};

const callGeminiModel = async (modelName, contents, systemPrompt, apiKey) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const payload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 350,
    },
  };
  const response = await axios.post(url, payload, { timeout: 8000 });
  return response.data.candidates?.[0]?.content?.parts?.[0]?.text;
};

const chatWithGemini = async (messages, systemPrompt) => {
  const apiKey = config.gemini.apiKey;
  const candidateModels = [
    config.gemini.model || 'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.6-flash',
  ];

  // Build clean alternating roles for Gemini multi-turn format
  const sanitizedContents = [];
  for (const msg of messages) {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    const text = (msg.content || '').trim();
    if (!text) continue;
    if (sanitizedContents.length > 0 && sanitizedContents[sanitizedContents.length - 1].role === role) {
      sanitizedContents[sanitizedContents.length - 1].parts[0].text += `\n${text}`;
    } else {
      sanitizedContents.push({ role, parts: [{ text }] });
    }
  }
  if (sanitizedContents.length > 0 && sanitizedContents[0].role === 'model') {
    sanitizedContents.shift();
  }
  if (sanitizedContents.length === 0) {
    return 'Kumusta! How can I assist your commute in Dagupan City today?';
  }

  let lastError = null;
  for (const model of candidateModels) {
    try {
      const result = await callGeminiModel(model, sanitizedContents, systemPrompt, apiKey);
      if (result) return result;
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message;
      console.warn(`[Gemini AI] Model ${model} failed (${errMsg}), trying next candidate...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed');
};

const chatWithGroq = async (messages, systemPrompt) => {
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
  ];

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.1-70b-versatile',
      messages: formattedMessages,
      max_tokens: 1024,
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${config.groq.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  return response.data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
};

const generateLocalAssistantResponse = (messages) => {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content?.trim() || '';
  const textLower = lastUserMsg.toLowerCase();

  // 1. Out-of-Scope Deflection (Strict)
  const outOfScopeKeywords = [
    'code', 'programming', 'javascript', 'python', 'html', 'css', 'java', 'c++',
    'essay', 'recipe', 'cooking', 'cook', 'bake', 'cake', 'food', 'dish', 'ulam',
    'math', 'algebra', 'calculus',
    'poem', 'story', 'song', 'joke', 'movie', 'game', 'crypto', 'bitcoin',
    'girlfriend', 'boyfriend', 'love advice', 'dating', 'president', 'election',
    'ukraine', 'israel', 'usa', 'china'
  ];
  const isOutOfScope = outOfScopeKeywords.some(keyword => textLower.includes(keyword));

  if (isOutOfScope) {
    return 'Paumanhin, ang layunin ko ay tumulong lamang sa mga ruta, pamasahe, at features ng Smart Sakay Dagupan. May maitutulong ba ako sa biyahe ninyo?';
  }

  // 2. Ambiguity check: User asks how to commute but provided no origin or destination
  if (['paano pumunta', 'how to go', 'saan sasakay', 'anong jeep', 'commute', 'biyahe'].some(p => textLower === p || textLower === `${p}?`)) {
    return 'Saan po ang inyong sakayan at bababaan?';
  }

  // 3. CSI Lucao / CSI Mall
  if (textLower.includes('csi') || textLower.includes('lucao')) {
    return `• Sakayan & Signboard: Sumakay sa Perez Boulevard o Downtown Loop ng jeep na may signboard na **"DAGUPAN - BINMALEY"**, **"DAGUPAN - LINGAYEN"**, o **"CSI LUCAO"**.\n` +
      `• Pamasahe & Bilis: ₱13.00 Regular / ₱10.40 Student, Senior, PWD (first 4 km) • Tinatayang 10-15 minuto ang biyahe.\n` +
      `• Bababaan: CSI The City Mall Lucao waiting shed / pedestrian footbridge. Maaari ring mag-special tricycle mula downtown (₱50 - ₱70).`;
  }

  // 4. Filing Complaints / Reporting (Paano mag-report / reklamo)
  if (
    textLower.includes('report') || textLower.includes('reklamo') || textLower.includes('complaint') ||
    textLower.includes('sumbong') || textLower.includes('ireport') || textLower.includes('magreport') ||
    textLower.includes('magrereport') || textLower.includes('overcharge') || textLower.includes('singil')
  ) {
    return `• In-App Report: Buksan ang **More** tab sa Smart Sakay app at piliin ang **Feedback & Complaints** o **Report Incident**. Ilagay ang plate/body number, TODA, ruta, at detalye ng reklamo.\n` +
      `• LTFRB Hotline: Tumawag sa hotline **1342** o mag-text sa **0998-565-1736** para sa overcharging o hindi pagbibigay ng 20% discount sa jeep/bus.\n` +
      `• Dagupan POSO: Para sa mga tricycle at lokal na traffic violation, dumulog sa Public Order and Safety Office sa Dagupan City Hall complex o tumawag sa PNP Dagupan (075-522-0199).`;
  }

  // 5. Provincial Buses & Destinations (Saan papunta ang bus / Victory / Five Star / etc.)
  if (
    textLower.includes('bus') || textLower.includes('victory') || textLower.includes('five star') ||
    textLower.includes('solid north') || textLower.includes('genesis') || textLower.includes('joybus')
  ) {
    return `• Victory Liner (Perez Blvd): Bumabyahe papuntang **Cubao, Pasay, Caloocan, Baguio City, Tuguegarao, at Santiago (Isabela)**.\n` +
      `• Five Star & Solid North (Perez Blvd): Five Star ay papuntang **Cubao, Pasay, Avenida (Manila)**; Solid North ay deretso sa **PITX** at Cubao via TPLEX.\n` +
      `• Genesis / JoyBus (M.H. Del Pilar): Papuntang **Cubao, Pasay, Avenida, Baler**, at express direct shuttles papuntang **Clark Airport**.\n` +
      `• Westbound Mini-Buses (Lucao / Perez): Papuntang **Alaminos (Hundred Islands), Bolinao, Labrador, at Sual**.`;
  }

  // 6. Flood & Weather Advisories
  if (textLower.includes('flood') || textLower.includes('baha') || textLower.includes('ulan') || textLower.includes('rain') || textLower.includes('weather') || textLower.includes('tide') || textLower.includes('tubig')) {
    return `• Alert: Live Weather & Flood Watch active for Dagupan City corridors.\n` +
      `• High-Risk Flood Corridors: Mayombo, Galvan St, AB Fernandez Ave, and Pantal bridge approaches during high tide or heavy rainfall.\n` +
      `• Action: Monitor real-time rain probability in the in-app **Weather** tab and allow 15-20 minutes extra travel time.`;
  }

  // 7. Tricycle Fares
  if (textLower.includes('tricycle') || textLower.includes('trike') || textLower.includes('toda') || textLower.includes('special')) {
    return `• Opisyal na Pamasahe: ₱15.00 regular base fare (unang 1.0 km) + ₱3.00 bawat susunod na kilometro ayon sa Dagupan TFRB at LTFRB guidelines.\n` +
      `• Diskwento (20% Off): ₱12.00 base fare para sa mga Estudyante (RA 10931), Senior Citizens (RA 9994), at PWDs (RA 9442).\n` +
      `• Special / Direct Trip: ₱50.00 – ₱80.00 karaniwang bayad kapag solo o chartered na biyahe (hal. Downtown papuntang CSI Lucao o Tondaligan Beach).\n` +
      `• Reklamo sa Overcharging: Maaaring magsumbong sa Smart Sakay app (More > Feedback) o sa Dagupan POSO / LTFRB Hotline 1342.`;
  }

  // 8. Bonuan / Beach Commute
  if (textLower.includes('bonuan') || textLower.includes('tondaligan') || textLower.includes('beach')) {
    return `• Route & Signboard: "DAGUPAN - BONUAN TONDALIGAN" or "BONUAN BINLOC" Jeepney (Board at Galvan St or Perez Blvd)\n` +
      `• Estimated Fare & Time: ₱13.00 Regular / ₱10.40 Discounted (first 4 km), +₱1.80/km • 15-20 mins\n` +
      `• Drop-off: Tondaligan Beach Park entrance / Bonuan Blue Beach • Watch for tidal water on Dawel-Pantal bridge during monsoon months.`;
  }

  // 9. General Jeepney Fares
  if (textLower.includes('fare') || textLower.includes('pamasahe') || textLower.includes('magkano') || textLower.includes('discount') || textLower.includes('rate')) {
    return `• Traditional Jeepney: ₱13.00 base (first 4 km) + ₱1.80/km • Discounted: ₱10.40 base + ₱1.44/km\n` +
      `• Modern Jeepney: ₱15.00 base (first 4 km) + ₱2.20/km • Discounted: ₱12.00 base + ₱1.76/km\n` +
      `• Statutory Rights: 20% discount is legally mandated 365 days a year for Students (RA 10931), Seniors (RA 9994), and PWDs (RA 9442).`;
  }

  // 10. Default Direct Prompt
  return `• Service: Smart Sakay Dagupan Commuter Assistant\n` +
    `• Navigation & Fares: Recommending jeepneys by signboard, LTFRB tariff calculation, and tricycle estimates.\n` +
    `• Safety & Weather: Live rainfall alerts for flooded corridors (Mayombo, Galvan, AB Fernandez).\n` +
    `Saan po ang inyong sakayan at bababaan?`;
};

const checkAiStatus = async () => {
  const isKeyConfigured = Boolean(
    config.gemini.apiKey &&
    config.gemini.apiKey !== 'your-gemini-api-key' &&
    config.gemini.apiKey.length > 10
  );

  let geminiLive = false;
  let activeModel = config.gemini.model || 'gemini-3.5-flash-lite';
  let errorDetail = null;

  if (isKeyConfigured) {
    const candidateModels = [
      activeModel,
      'gemini-flash-lite-latest',
      'gemini-3.6-flash',
    ];

    for (const m of candidateModels) {
      try {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${config.gemini.apiKey}`;
        const res = await axios.post(
          testUrl,
          { contents: [{ role: 'user', parts: [{ text: 'Ping: SmartSakay test' }] }] },
          { timeout: 8000 }
        );
        if (res.data?.candidates?.[0]?.content) {
          geminiLive = true;
          activeModel = m;
          errorDetail = null;
          break;
        }
      } catch (e) {
        errorDetail = e.response?.data?.error?.message || e.message;
      }
    }
  }

  return {
    gemini: {
      configured: isKeyConfigured,
      keyMasked: isKeyConfigured ? `${config.gemini.apiKey.slice(0, 6)}...${config.gemini.apiKey.slice(-4)}` : 'Not Set',
      model: activeModel,
      live: geminiLive,
      error: errorDetail,
    },
    localFallback: {
      active: true,
      ready: true,
      knowledge: [
        'Republic Act 11311 (Clean Terminal Restrooms)',
        'Republic Act 9994 (Senior Citizen 20% Discount)',
        'Republic Act 10931 (Student 365-day 20% Discount)',
        'Republic Act 11313 (Safe Spaces Act)',
        'CSI Lucao & Binmaley/Lingayen Jeepney Corridors',
        'In-App Reporting & LTFRB 1342 / POSO Complaints Process',
        'Provincial Bus Depots (Victory Liner, Five Star, Solid North, JoyBus)',
        'LTFRB Official Tariff Matrix & Dagupan Tricycle Fares'
      ],
    },
  };
};

const chat = async (messages) => {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content?.trim() || '';
  const textLower = lastUserMsg.toLowerCase();

  // Strict Out-of-Scope Deflection
  const outOfScopeKeywords = [
    'code', 'programming', 'javascript', 'python', 'html', 'css', 'java', 'c++',
    'essay', 'recipe', 'cooking', 'cook', 'bake', 'cake', 'food', 'dish', 'ulam',
    'math', 'algebra', 'calculus', 'homework',
    'poem', 'story', 'song', 'joke', 'movie', 'game', 'crypto', 'bitcoin',
    'girlfriend', 'boyfriend', 'love advice', 'dating', 'president', 'election',
    'ukraine', 'israel', 'usa', 'china'
  ];
  if (outOfScopeKeywords.some(keyword => textLower.includes(keyword))) {
    return 'Paumanhin, ang layunin ko ay tumulong lamang sa mga ruta, pamasahe, at features ng Smart Sakay Dagupan. May maitutulong ba ako sa biyahe ninyo?';
  }

  let systemPrompt = '';
  try {
    systemPrompt = await buildSystemPrompt();
  } catch (e) {
    // Continue with basic prompt
  }

  if (config.gemini.apiKey && config.gemini.apiKey !== 'your-gemini-api-key') {
    try {
      return await chatWithGemini(messages, systemPrompt);
    } catch (error) {
      console.warn('[Gemini AI] Gemini service unavailable, falling back to next provider...');
    }
  }

  if (config.groq.apiKey && config.groq.apiKey !== 'your-groq-api-key') {
    try {
      return await chatWithGroq(messages, systemPrompt);
    } catch (error) {
      console.warn('[Groq AI] Groq unavailable, falling back...');
    }
  }

  // Graceful local commuter knowledge response
  return generateLocalAssistantResponse(messages);
};

module.exports = { chat, checkAiStatus };
