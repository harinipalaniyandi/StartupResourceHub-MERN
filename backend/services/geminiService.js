const axios = require('axios');

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-3.8-flash'
];

/**
 * Call Gemini API with automatic model failover and robust error handling
 */
async function callGemini(prompt, isJson = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    throw new Error('Gemini API key not configured in .env');
  }

  const modelsToTry = Array.from(new Set([PRIMARY_MODEL, ...FALLBACK_MODELS]));
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          ...(isJson ? { responseMimeType: 'application/json' } : {})
        }
      };

      const response = await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000
      });

      const candidates = response.data?.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content?.parts?.length > 0) {
        return candidates[0].content.parts[0].text;
      }
    } catch (err) {
      lastError = err;
      // Fail silently to next model in list
    }
  }

  throw lastError || new Error('All Gemini model endpoints failed');
}

/**
 * Helper to safely parse JSON returned by Gemini
 */
function cleanAndParseJSON(rawText, fallbackObj) {
  if (!rawText) return fallbackObj;
  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', err.message, 'Raw:', rawText);
    return fallbackObj;
  }
}

/**
 * Detect language from text (Tamil script, Tanglish, or English)
 */
function detectLanguage(text) {
  if (!text) return 'en';
  // Check for Tamil Unicode range
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return 'ta';
  }
  // Check for common Tanglish words & patterns
  const tanglishMarkers = /\b(venum|irukku|irukka|irukinga|irukeenga|pannanum|panradhu|enna|epdi|eppadi|solli|solren|sollu|sollunga|solunga|tha|kudunga|kudu|romba|panren|vachi|illa|illai|aana|kooda|engalukku|en|enakku|ennaku|eppodhu|mudiyum|theriyum|panna|pannalam|kuduthu|paatha|nalla|oru|idhu|adhu|yaar|edhu|yen|thanglish|tamil|bro|paaru|pannu|podu|kelvi|padhi|pathi|mattum|theva|kekkaran|kekkuran|pesu|pesanum|keta|kettalum|reply|panni|edhavadhu|eppudi|la|nu|da|machan|thala|anna|solla)\b/i;
  if (tanglishMarkers.test(text)) {
    return 'tanglish';
  }
  return 'en';
}

/**
 * Auto-generate concise chat title
 */
async function generateChatTitle(firstMessage) {
  if (!firstMessage || !firstMessage.trim()) return 'New Chat';
  const prompt = `Generate a 3-5 word concise, clear topic title for this user message: "${firstMessage}". 
Do not put quotes. Reply with ONLY the title.`;
  try {
    const title = await callGemini(prompt);
    return title.replace(/["'\n\r]/g, '').trim() || firstMessage.slice(0, 30);
  } catch (err) {
    return firstMessage.slice(0, 30);
  }
}

/**
 * 1. AI Resource Classification
 */
async function classifyResource(title, description, extraInfo = '') {
  const prompt = `Analyze this startup resource and extract structured metadata for admin approval.
Title: ${title}
Description: ${description}
Extra Context: ${extraInfo}

Output a VALID JSON object matching this exact schema:
{
  "category": "Funding" | "Government Scheme" | "Mentor" | "Tool/Software" | "Co-working Space" | "Legal/Compliance" | "Incubator/Accelerator",
  "tags": "comma,separated,tags",
  "industryFocus": "fintech" | "agritech" | "healthtech" | "edtech" | "saas" | "ecommerce" | "cleantech" | "all",
  "stageFocus": "idea,mvp,early_revenue,scaling" or subset (comma-separated) or "all",
  "location": "e.g. India, Global, Tamil Nadu, Karnataka, etc.",
  "fundingType": "Grant" | "Equity" | "Debt" | "Credits" | "Mentorship" | "Workspace" | "Software" | "N/A",
  "deadlineType": "fixed" | "rolling" | "closed",
  "eligibilityCriteria": "Concise summary of who can apply",
  "requiredDocuments": ["Document 1", "Document 2"],
  "targetUsers": "e.g. Early-stage founders, Tech startups"
}`;

  try {
    const raw = await callGemini(prompt, true);
    return cleanAndParseJSON(raw, {
      category: 'Funding',
      tags: 'startup,growth',
      industryFocus: 'all',
      stageFocus: 'all',
      location: 'India',
      fundingType: 'Grant',
      deadlineType: 'rolling',
      eligibilityCriteria: 'Open to registered startups',
      requiredDocuments: ['Pitch Deck', 'Business Plan'],
      targetUsers: 'Founders'
    });
  } catch (err) {
    return {
      category: 'Funding',
      tags: 'startup,funding',
      industryFocus: 'all',
      stageFocus: 'all',
      location: 'India',
      fundingType: 'Grant',
      deadlineType: 'rolling',
      eligibilityCriteria: 'All eligible startups',
      requiredDocuments: ['Pitch Deck'],
      targetUsers: 'Founders'
    };
  }
}

/**
 * 2. AI Startup Readiness Analyzer
 */
async function analyzeStartupReadiness(founderProfile) {
  const prompt = `You are a top venture analyst and startup incubator evaluation expert.
Analyze this founder's startup profile across 8 key startup dimensions:
- Startup Name: ${founderProfile.startupName || 'Not specified'}
- Domain / Industry: ${founderProfile.businessDomain || founderProfile.industry || 'General'}
- Stage: ${founderProfile.startupStage || 'idea'}
- Problem: ${founderProfile.problem || 'Not specified'}
- Product / Service: ${founderProfile.productService || 'Not specified'}
- MVP Status: ${founderProfile.mvpStatus || 'not_started'}
- Team Size: ${founderProfile.teamSize || '1'}
- Target Customers: ${founderProfile.targetCustomers || 'B2B'}
- Market Validation: ${founderProfile.marketValidation || 'none'}
- Revenue Status: ${founderProfile.revenueStatus || 'pre_revenue'}
- Business Registration: ${founderProfile.businessRegistration || 'unregistered'}
- Funding Requirement: ${founderProfile.fundingRequirement || 'none'}
- Funding Stage: ${founderProfile.fundingStage || 'bootstrapped'}
- Current Challenges: ${founderProfile.currentChallenges || 'Not specified'}
- Startup Goals: ${founderProfile.startupGoals || 'Not specified'}

Generate a thorough, realistic evaluation in VALID JSON format with this exact structure:
{
  "overallScore": number (0-100),
  "readinessLevel": "Idea Validation" | "MVP Development" | "Market Traction" | "Investment Ready" | "Scaling Phase",
  "dimensions": {
    "productReadiness": {
      "score": number (0-100),
      "status": "Strong" | "Moderate" | "Needs Attention" | "Critical Gap",
      "missingInfo": ["string"],
      "gaps": ["string"],
      "recommendedActions": ["string"],
      "category": "Tool/Software"
    },
    "marketReadiness": {
      "score": number (0-100),
      "status": "Strong" | "Moderate" | "Needs Attention" | "Critical Gap",
      "missingInfo": ["string"],
      "gaps": ["string"],
      "recommendedActions": ["string"],
      "category": "Mentor"
    },
    "businessModelReadiness": {
      "score": number (0-100),
      "status": "Strong" | "Moderate" | "Needs Attention" | "Critical Gap",
      "missingInfo": ["string"],
      "gaps": ["string"],
      "recommendedActions": ["string"],
      "category": "Mentor"
    },
    "teamReadiness": {
      "score": number (0-100),
      "status": "Strong" | "Moderate" | "Needs Attention" | "Critical Gap",
      "missingInfo": ["string"],
      "gaps": ["string"],
      "recommendedActions": ["string"],
      "category": "Mentor"
    },
    "legalReadiness": {
      "score": number (0-100),
      "status": "Strong" | "Moderate" | "Needs Attention" | "Critical Gap",
      "missingInfo": ["string"],
      "gaps": ["string"],
      "recommendedActions": ["string"],
      "category": "Legal/Compliance"
    },
    "financialReadiness": {
      "score": number (0-100),
      "status": "Strong" | "Moderate" | "Needs Attention" | "Critical Gap",
      "missingInfo": ["string"],
      "gaps": ["string"],
      "recommendedActions": ["string"],
      "category": "Funding"
    },
    "fundingReadiness": {
      "score": number (0-100),
      "status": "Strong" | "Moderate" | "Needs Attention" | "Critical Gap",
      "missingInfo": ["string"],
      "gaps": ["string"],
      "recommendedActions": ["string"],
      "category": "Government Scheme"
    },
    "technologyReadiness": {
      "score": number (0-100),
      "status": "Strong" | "Moderate" | "Needs Attention" | "Critical Gap",
      "missingInfo": ["string"],
      "gaps": ["string"],
      "recommendedActions": ["string"],
      "category": "Tool/Software"
    }
  },
  "aiInsights": ["Insight 1", "Insight 2", "Insight 3"]
}`;

  try {
    const raw = await callGemini(prompt, true);
    return cleanAndParseJSON(raw, getFallbackReadiness(founderProfile));
  } catch (err) {
    return getFallbackReadiness(founderProfile);
  }
}

function getFallbackReadiness(p) {
  return {
    overallScore: 62,
    readinessLevel: 'MVP Development',
    dimensions: {
      productReadiness: { score: 70, status: 'Moderate', missingInfo: [], gaps: ['User feedback loop not established'], recommendedActions: ['Conduct 10 user interviews'], category: 'Tool/Software' },
      marketReadiness: { score: 55, status: 'Needs Attention', missingInfo: [], gaps: ['TAM/SAM calculation missing'], recommendedActions: ['Quantify market size'], category: 'Mentor' },
      businessModelReadiness: { score: 60, status: 'Moderate', missingInfo: [], gaps: ['Pricing tier testing needed'], recommendedActions: ['Test 2 pricing models'], category: 'Mentor' },
      teamReadiness: { score: 65, status: 'Moderate', missingInfo: [], gaps: ['Technical co-founder alignment'], recommendedActions: ['Define role agreements'], category: 'Mentor' },
      legalReadiness: { score: 50, status: 'Needs Attention', missingInfo: [], gaps: ['DPIIT registration pending'], recommendedActions: ['Apply on Startup India portal'], category: 'Legal/Compliance' },
      financialReadiness: { score: 58, status: 'Moderate', missingInfo: [], gaps: ['12-month runway projection needed'], recommendedActions: ['Prepare financial model'], category: 'Funding' },
      fundingReadiness: { score: 68, status: 'Moderate', missingInfo: [], gaps: ['Pitch deck needs traction slide'], recommendedActions: ['Complete SISFS grant application'], category: 'Government Scheme' },
      technologyReadiness: { score: 70, status: 'Moderate', missingInfo: [], gaps: ['Cloud architecture scaling'], recommendedActions: ['Apply for AWS/GCP credits'], category: 'Tool/Software' }
    },
    aiInsights: [
      `Your startup in ${p.businessDomain || 'your domain'} needs clear market validation before seed fundraising.`,
      `Apply for government grants like TANSEED or SISFS to build your initial runway.`,
      `Connect with domain mentors to refine your go-to-market strategy.`
    ]
  };
}

/**
 * 3. Grounded AI Assistant (Dual-Mode: Startup Advisor / Idea Evaluator + RAG Resource Grounding)
 */
async function chatWithContext(
  userMessage,
  founderContext,
  dbResources = [],
  applications = [],
  roadmap = null,
  mentors = [],
  preferredLanguage = 'auto',
  history = []
) {
  // Determine response language
  let targetLang = preferredLanguage;
  if (targetLang === 'auto') {
    targetLang = detectLanguage(userMessage);
  }

  let langInstruction = '';
  if (targetLang === 'ta') {
    langInstruction = `LANGUAGE INSTRUCTION: 
- You MUST reply in pure, natural, and fluent TAMIL (தமிழ் எழுத்துகளில்). 
- Write your entire response in clear, grammatically correct Tamil script.
- If technical or startup terms appear (e.g., React, API, Database, MVP, Seed Fund), you may mention them in English/transliteration alongside Tamil explanation.
- Use clean formatting with Tamil headings, bullet points, and bold text for easy reading.`;
  } else if (targetLang === 'tanglish') {
    langInstruction = `LANGUAGE INSTRUCTION: 
- You MUST reply in natural, engaging, and friendly TANGLISH (Tamil words written in English alphabet, e.g., "Kandippa bro!", "Unoda question-ku answer idho...", "Idha epdi pannanum-na...", "Romba simple bro...").
- Keep it conversational, helpful, energetic, and super easy to understand.
- Use structured points, clean emojis, and bold highlights.`;
  } else {
    langInstruction = `LANGUAGE INSTRUCTION: 
- You MUST reply in professional, intelligent, fluent, and structured ENGLISH.
- Format with clear headings, bullet points, and bold highlights.`;
  }

  const resourceContext = dbResources.slice(0, 6).map((r, i) =>
    `[Resource #${i + 1}] "${r.title}" | Category: ${r.category} | Domain: ${r.industryFocus} | Stage: ${r.stageFocus} | Location: ${r.location} | Details: ${r.description} | Link: ${r.externalLink || 'SRH Portal'}`
  ).join('\n');

  const mentorContext = mentors.slice(0, 4).map((m, i) =>
    `[Mentor #${i + 1}] ${m.name} (${m.mentorDomain || m.industry || 'Domain Expert'}) | Expertise: ${m.expertise} | Exp: ${m.experienceYears} yrs | Bio: ${m.bio}`
  ).join('\n');

  const appCount = applications.length;
  const roadmapProgress = roadmap?.overallProgress || 0;

  // Build last turns of history
  const recentHistory = history.slice(-6).map(h => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');

  const prompt = `You are an intelligent, versatile, and friendly AI Assistant and Virtual Co-Founder for the Startup Resource Hub Platform.

${langInstruction}

FOUNDER CONTEXT:
- Founder Name: ${founderContext.name || 'User / Founder'}
- Startup Venture: ${founderContext.startupName || 'Early Stage Venture'}
- Domain / Industry: ${founderContext.businessDomain || founderContext.industry || 'General'}
- Stage: ${founderContext.startupStage || 'idea'}
- Tracked Applications: ${appCount}
- Roadmap Progress: ${roadmapProgress}% completed

DATABASE RESOURCES (Use ONLY when relevant to user's question):
${resourceContext || 'None available.'}

DATABASE MENTORS (Use ONLY when relevant to user's question):
${mentorContext || 'None available.'}

RECENT CONVERSATION HISTORY:
${recentHistory || 'No previous messages.'}

CURRENT USER MESSAGE: "${userMessage}"

CORE BEHAVIOR & RULES:
1. 🌟 UNIVERSAL ASSISTANT:
   - You can answer ANY question the user asks! Whether it is general knowledge, greetings, casual talk, programming/coding, career, business, startup advice, mathematics, writing, or everyday doubts.
   - Never refuse or give broken responses. Answer naturally, helpfully, and accurately.

2. 🎯 STRICT SPECIFICITY & USER CONSTRAINTS:
   - If the user asks for something specific (e.g., "specific-ah sollu", "give only 2 points", "code only", "short answer", "no extra details", "mentor only", "funding only", "explain in 1 sentence"), FOLLOW THAT EXACT CONSTRAINT strictly without adding unnecessary boilerplate.

3. 🗣️ MULTILINGUAL FLUENCY:
   - Always respond in the target language (${targetLang}):
     • Tamil (ta) -> Write in Tamil script (தமிழ்)
     • Tanglish (tanglish) -> Write in Tamil words using English letters (Tanglish)
     • English (en) -> Write in standard English
   - Match the user's conversational vibe (warm, respectful, intelligent).

4. 🚀 STARTUP, BUSINESS & ROADMAP QUERIES:
   - When the user asks for business ideas, feedback, pricing, customer segments, or marketing, give insightful, structured startup advice.
   - When asked for a roadmap or execution plan, provide a clear 6-Phase Execution Roadmap tailored to their domain with phases, milestones, timelines, and next action steps.
   - If the user explicitly asks for funding, grants, legal, or mentors, ground your response in the verified database items provided above. If they did NOT ask for resources or mentors, do NOT force them into the answer.`;

  return callGemini(prompt);
}

const { generateSmartFallbackReply, isRoadmapQuery, extractDomain } = require('./smartFallbackEngine');

/**
 * 4. Semantic Search Intent Extraction (with robust fallback if Gemini is overloaded)
 */
async function extractSemanticIntent(query) {
  if (!query || !query.trim()) {
    return {
      category: 'all',
      domain: 'all',
      stage: 'all',
      location: 'all',
      fundingType: 'all',
      summary: 'all startup resources'
    };
  }

  // Local heuristic fallback parser in case Gemini is overloaded
  const parseLocalIntent = (text) => {
    const lower = text.toLowerCase();
    let category = 'all';
    if (/\b(grant|grants|seed fund|funding|subsidy|capital|equity|investor|vc|angel|loan)\b/i.test(lower)) category = 'Funding';
    else if (/\b(scheme|schemes|tanseed|sisfs|mudra|government|standup|startup india)\b/i.test(lower)) category = 'Government Scheme';
    else if (/\b(mentor|mentors|advisor|guidance|coaching)\b/i.test(lower)) category = 'Mentor';
    else if (/\b(tool|tools|software|cloud|credits|aws|gcp)\b/i.test(lower)) category = 'Tool/Software';
    else if (/\b(incubator|accelerator|co-working|coworking|workspace)\b/i.test(lower)) category = 'Incubator/Accelerator';
    else if (/\b(legal|dpiit|registration|trademark|patent|compliance|pvt ltd)\b/i.test(lower)) category = 'Legal/Compliance';

    let domain = 'all';
    if (/\b(agri|agriculture|agritech|farming|farm)\b/i.test(lower)) domain = 'agritech';
    else if (/\b(fintech|finance|banking|payments|crypto)\b/i.test(lower)) domain = 'fintech';
    else if (/\b(health|healthcare|healthtech|biotech|medtech)\b/i.test(lower)) domain = 'healthtech';
    else if (/\b(edtech|education|learning)\b/i.test(lower)) domain = 'edtech';
    else if (/\b(saas|software|b2b|devtool)\b/i.test(lower)) domain = 'saas';
    else if (/\b(ecommerce|e-commerce|d2c|retail|handmade|craft|shopping)\b/i.test(lower)) domain = 'ecommerce';
    else if (/\b(cleantech|climate|ev|solar|green)\b/i.test(lower)) domain = 'cleantech';
    else if (/\b(deeptech|ai|ml|iot|robotics)\b/i.test(lower)) domain = 'deeptech';

    let stage = 'all';
    if (/\b(idea|concept|ideation)\b/i.test(lower)) stage = 'idea';
    else if (/\b(mvp|prototype|beta|poc)\b/i.test(lower)) stage = 'mvp';
    else if (/\b(early revenue|traction|first customer|sales)\b/i.test(lower)) stage = 'early_revenue';
    else if (/\b(scale|scaling|growth|series a)\b/i.test(lower)) stage = 'scaling';

    let location = 'all';
    if (/\b(tamil nadu|tn|chennai|coimbatore|madurai)\b/i.test(lower)) location = 'Tamil Nadu';
    else if (/\b(karnataka|bangalore|bengaluru)\b/i.test(lower)) location = 'Karnataka';
    else if (/\b(india|national|central)\b/i.test(lower)) location = 'India';

    return {
      category,
      domain,
      stage,
      location,
      fundingType: 'all',
      summary: `${category !== 'all' ? category : 'Resources'} in ${domain !== 'all' ? domain : 'startup sector'}`
    };
  };

  const prompt = `Extract structured search filters from this startup query for matching against a startup resources database.
Query: "${query}"

Return a VALID JSON object matching:
{
  "category": "Funding" | "Government Scheme" | "Mentor" | "Tool/Software" | "Legal/Compliance" | "Incubator/Accelerator" | "all",
  "domain": "agritech" | "fintech" | "healthtech" | "edtech" | "saas" | "ecommerce" | "cleantech" | "deeptech" | "all",
  "stage": "idea" | "mvp" | "early_revenue" | "scaling" | "all",
  "location": "India" | "Tamil Nadu" | "Karnataka" | "Global" | "all",
  "fundingType": "Grant" | "Equity" | "Debt" | "Credits" | "all",
  "summary": "1-sentence summary of what the founder is searching for"
}`;

  try {
    const raw = await callGemini(prompt, true);
    return cleanAndParseJSON(raw, parseLocalIntent(query));
  } catch (err) {
    return parseLocalIntent(query);
  }
}

/**
 * 5. Suggest Tags
 */
async function suggestTags(title, description) {
  const prompt = `Extract 5-8 concise, lowercase, comma-separated keyword tags for this startup resource.
Title: ${title}
Description: ${description}
Only output the comma-separated tags.`;

  try {
    const result = await callGemini(prompt);
    return result.replace(/`/g, '').trim();
  } catch (err) {
    return 'startup,opportunity,growth,funding';
  }
}

module.exports = {
  callGemini,
  detectLanguage,
  generateChatTitle,
  classifyResource,
  analyzeStartupReadiness,
  chatWithContext,
  extractSemanticIntent,
  suggestTags,
  generateSmartFallbackReply,
  isRoadmapQuery,
  extractDomain
};

