// ==========================================
// AI MUNSHI MAIN CONTROLLER v5
// ==========================================
window.RAJ_AI = window.RAJ_AI || {};
window.RAJ_AI.munshi = window.RAJ_AI.munshi || {};

window.RAJ_AI.munshi.context = {
    farmer: null,
    lastQuestion: "",
    lastReply: "",
    lastRecords: [],
    lastIntent: null,
    lastDate: null
};


function updateMunshiContext(question, records = []) {

    window.RAJ_AI.munshi.context.lastQuestion = question;

    window.RAJ_AI.munshi.context.lastRecords = records;

    if (records && records.length) {

        const r = records[0];

        window.RAJ_AI.munshi.context.farmer =
            r.name || r.farmer || null;

    }

}

function getCurrentFarmer() {

    return window.RAJ_AI.munshi.context.farmer;

}
// ==========================================
// PART 14
// SMART FARMER FINDER
// ==========================================

function normalizeName(text){

    return String(text || "")
        .toLowerCase()
        .replace(/[^\u0900-\u097Fa-z0-9 ]/g,"")
        .replace(/\s+/g," ")
        .trim();

}

function findFarmer(question){

    if(!window.records || !window.records.length){
        return null;
    }

    const q = normalizeName(question);

    let best = null;
    let score = 0;

    const farmers = [...new Set(
        window.records.map(r => r.name)
    )];

    farmers.forEach(name=>{

        const n = normalizeName(name);

        let s = 0;

        const words = n.split(" ");

        words.forEach(w=>{

            if(q.includes(w)) s += 2;

            if(w.includes(q) || q.includes(w)) s++;

        });

        if(s > score){

            score = s;
            best = name;

        }

    });

    return best;

}

window.findFarmer = findFarmer;

// ==========================================
// QUESTION PARSER
// Extract intent, farmer, date, work from natural language
// ==========================================

function parseQuestion(text) {
    const q = String(text || "").toLowerCase().trim();
    const result = {
        intent: "GENERAL",
        farmer: null,
        date: null,
        dateRange: null,
        work: null,
        crop: null,
        raw: text
    };

    // ---- Extract farmer name ----
    if (typeof findFarmer === "function") {
        result.farmer = findFarmer(text);
    }

    // ---- Detect intent ----
    // Full ledger / history
    if (/पूरा\s*(हिसाब|record|history)|पूरे?\s*(का|की|के)|full.*(ledger|history|record)|हिसाब.*(बता|दे|निकाल)|ledger|history/.test(q)) {
        result.intent = "LEDGER";
    }
    // Balance / baki
    else if (/बाकी|balance|baki|bakaya|उधार|pending/.test(q)) {
        result.intent = "BALANCE";
    }
    // Paid / paid
    else if (/जमा|paid|diya|दिया|भुगतान|payment/.test(q)) {
        result.intent = "PAID";
    }
    // Income / total
    else if (/कुल|income|कमाई|total|rashi|राशि|earn|kamaya|कमाया/.test(q)) {
        result.intent = "INCOME";
    }
    // Count
    else if (/कितने|count|संख्या|कितना/.test(q) && /किसान|record|entry|एंट्री|काम/.test(q)) {
        result.intent = "COUNT";
    }
    // Highest/lowest
    else if (/सबसे|highest|maximum|most|lowest|minimum|least/.test(q)) {
        result.intent = "HIGHEST_LOWEST";
    }
    // Comparison
    else if (/तुलना|compare|vs|बनाम|मुकाबले/.test(q)) {
        result.intent = "COMPARISON";
    }
    // Crop
    else if (/फसल|crop|bajra|बाजरा|gehun|गेहूं|chana|चना|guar|ग्वार/.test(q)) {
        result.intent = "CROP";
    }
    // Work type
    else if (/काम|work|hero|हीरो|calti|कल्टी|thresher|थ्रेसर|morplau|मोरप्लाउ|display|spray|दवाई/.test(q)) {
        result.intent = "WORK";
    }
    // Date-specific
    else if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{1,2}\s*(तारीख|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|जन|फर|मार्च|अप्र|मई|जून|जुलाई|अग|सित|अक्टू|नव|दिस)/.test(q)) {
        result.intent = "DATE";
    }
    // Today/yesterday
    else if (/कल|आज|परसों|today|yesterday|tomorrow/.test(q)) {
        result.intent = "DATE";
    }
    // Summary
    else if (/summary|सारांश|brief|संक्षिप्त|short/.test(q)) {
        result.intent = "SUMMARY";
    }

    // ---- Extract date ----
    const today = new Date();
    if (/आज|today/.test(q)) {
        result.date = today.toISOString().split("T")[0];
    } else if (/कल|yesterday/.test(q)) {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        result.date = y.toISOString().split("T")[0];
    } else if (/परसों|tomorrow/.test(q)) {
        const p = new Date(today);
        p.setDate(p.getDate() + 1);
        result.date = p.toISOString().split("T")[0];
    } else if (/पिछले?\s*(महीने?|month)/.test(q)) {
        const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lmEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        result.dateRange = {
            from: lm.toISOString().split("T")[0],
            to: lmEnd.toISOString().split("T")[0]
        };
    } else if (/इस\s*महीने?|this\s*month/.test(q)) {
        const cmStart = new Date(today.getFullYear(), today.getMonth(), 1);
        result.dateRange = {
            from: cmStart.toISOString().split("T")[0],
            to: today.toISOString().split("T")[0]
        };
    } else if (/पिछले?\s*(सप्ताह|week)/.test(q)) {
        const lw = new Date(today);
        lw.setDate(lw.getDate() - 7);
        result.dateRange = {
            from: lw.toISOString().split("T")[0],
            to: today.toISOString().split("T")[0]
        };
    } else {
        // Try to extract explicit date like "24 अगस्त", "24/08/2026", "24-08"
        const dateMatch = q.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
        if (dateMatch) {
            const month = dateMatch[2].padStart(2, "0");
            const year = dateMatch[3] || today.getFullYear();
            result.date = year + "-" + month + "-" + dateMatch[1].padStart(2, "0");
        }
    }

    // ---- Extract work type ----
    if (/hero|हीरो/.test(q)) result.work = "Hero";
    else if (/calti|कल्टी|cultivator/.test(q)) result.work = "Calti";
    else if (/thresher|थ्रेसर/.test(q)) result.work = "Thresher";
    else if (/morplau|मोरप्लाउ/.test(q)) result.work = "Morplau";
    else if (/display/.test(q)) result.work = "Display";
    else if (/spray|दवाई/.test(q)) result.work = "Spray Machine";

    // ---- Extract crop ----
    if (/bajra|बाजरा/.test(q)) result.crop = "Bajra";
    else if (/gehun|गेहूं|wheat/.test(q)) result.crop = "Gehun";
    else if (/chana|चना/.test(q)) result.crop = "Chana";
    else if (/guar|ग्वार/.test(q)) result.crop = "Guar";

    return result;
}

window.parseQuestion = parseQuestion;

// ==========================================
// LOCAL ANSWER BUILDER
// Build answer from window.records without Gemini
// ==========================================

function buildLocalAnswer(parsed, records) {
    if (!records || !records.length) return null;

    const farmerNames = [...new Set(records.map(r => r.name || r.farmer || ""))].filter(Boolean);
    const farmerList = farmerNames.join(", ");

    // Calculate aggregates
    let total = 0, paid = 0, baki = 0;
    records.forEach(r => {
        total += Number(r.total || 0);
        paid += Number(r.paid || 0);
        baki += Number(r.baki || r.balance || (Number(r.total||0) - Number(r.paid||0)));
    });

    // LEDGER — full farmer history
    if (parsed.intent === "LEDGER") {
        let reply = (farmerList ? farmerList + " का पूरा हिसाब (" + records.length + " एंट्री):\n\n" : "पूरा हिसाब:\n\n");
        records.forEach((r, i) => {
            reply += (i+1) + ". " + (r.date || "-") + " | " + (r.work || "-")
                + (r.crop ? " | " + r.crop : "")
                + " | ₹" + (r.total || 0)
                + " (जमा: ₹" + (r.paid || 0)
                + ", बाकी: ₹" + (r.baki || r.balance || 0) + ")\n";
        });
        reply += "\n📊 कुल: ₹" + total + " | जमा: ₹" + paid + " | बाकी: ₹" + baki;
        return reply;
    }

    // BALANCE
    if (parsed.intent === "BALANCE") {
        if (baki > 0) {
            return farmerList + " का बाकी ₹" + baki + " है। (कुल: ₹" + total + ", जमा: ₹" + paid + ")";
        }
        return "कोई बाकी राशि नहीं है। सभी हिसाब चुकता है।";
    }

    // PAID
    if (parsed.intent === "PAID") {
        return farmerList + " ने कुल ₹" + paid + " जमा किया है। (कुल राशि: ₹" + total + ", बाकी: ₹" + baki + ")";
    }

    // INCOME
    if (parsed.intent === "INCOME") {
        return "कुल आय ₹" + total + " है। जमा: ₹" + paid + ", बाकी: ₹" + baki + (farmerList ? " (किसान: " + farmerList + ")" : "");
    }

    // COUNT
    if (parsed.intent === "COUNT") {
        const farmerCount = new Set(records.map(r => r.name || r.farmer || "")).size;
        return "कुल " + records.length + " रिकॉर्ड मिले, " + farmerCount + " अलग-अलग किसान।";
    }

    // WORK — group by work type
    if (parsed.intent === "WORK") {
        const works = {};
        records.forEach(r => {
            const w = r.work || "अज्ञात";
            if (!works[w]) works[w] = { count: 0, total: 0, paid: 0 };
            works[w].count++;
            works[w].total += Number(r.total || 0);
            works[w].paid += Number(r.paid || 0);
        });
        const workList = Object.keys(works).map(w => {
            const wb = works[w].total - works[w].paid;
            return w + " (" + works[w].count + " बार): ₹" + works[w].total + (wb > 0 ? ", बाकी ₹" + wb : "");
        });
        return (farmerList ? farmerList + " के काम:\n" : "कार्य विवरण:\n") + workList.join("\n");
    }

    // CROP — group by crop
    if (parsed.intent === "CROP") {
        const crops = {};
        records.forEach(r => {
            const c = r.crop || "बिना फसल";
            if (!crops[c]) crops[c] = { count: 0, total: 0 };
            crops[c].count++;
            crops[c].total += Number(r.total || 0);
        });
        const cropList = Object.keys(crops).map(c => c + " (" + crops[c].count + " बार): ₹" + crops[c].total);
        return "फसल विवरण:\n" + cropList.join("\n");
    }

    // DATE — group by date
    if (parsed.intent === "DATE") {
        const dates = {};
        records.forEach(r => {
            const d = r.date || "अज्ञात तारीख";
            if (!dates[d]) dates[d] = [];
            dates[d].push(r);
        });
        let reply = (farmerList ? farmerList + " का तारीख-वार विवरण:\n" : "तारीख-वार विवरण:\n");
        Object.keys(dates).sort().forEach(d => {
            const dr = dates[d];
            const dTotal = dr.reduce((s,r) => s + Number(r.total || 0), 0);
            const dPaid = dr.reduce((s,r) => s + Number(r.paid || 0), 0);
            const workNames = [...new Set(dr.map(r => r.work || ""))].filter(Boolean).join(", ");
            reply += d + ": " + dr.length + " एंट्री" + (workNames ? " (" + workNames + ")" : "") + ", ₹" + dTotal + (dPaid > 0 ? " (जमा ₹" + dPaid + ")" : "") + "\n";
        });
        return reply.trim();
    }

    // SUMMARY
    if (parsed.intent === "SUMMARY") {
        const works = [...new Set(records.map(r => r.work || ""))].filter(Boolean);
        const farmers = [...new Set(records.map(r => r.name || r.farmer || ""))].filter(Boolean);
        const crops = [...new Set(records.map(r => r.crop || ""))].filter(Boolean);
        return (farmerList ? farmerList + " का सारांश:\n" : "सारांश:\n")
            + "📝 एंट्री: " + records.length + "\n"
            + "👨‍🌾 किसान: " + farmers.length + "\n"
            + "🚜 काम: " + works.join(", ") + "\n"
            + (crops.length ? "🌾 फसल: " + crops.join(", ") + "\n" : "")
            + "💰 कुल: ₹" + total + "\n"
            + "💵 जमा: ₹" + paid + "\n"
            + "❌ बाकी: ₹" + baki;
    }

    // HIGHEST_LOWEST
    if (parsed.intent === "HIGHEST_LOWEST") {
        if (/बाकी|balance|baki|udhar|pending/.test(parsed.raw)) {
            const sorted = [...records].sort((a,b) => {
                const ba = Number(a.baki || a.balance || (Number(a.total||0) - Number(a.paid||0)));
                const bb = Number(b.baki || b.balance || (Number(b.total||0) - Number(b.paid||0)));
                return bb - ba;
            });
            const top = sorted[0];
            const topBaki = Number(top.baki || top.balance || (Number(top.total||0) - Number(top.paid||0)));
            return "सबसे ज्यादा बाकी: " + (top.name || top.farmer || "अज्ञात") + " — ₹" + topBaki + " (कुल: ₹" + (top.total || 0) + ", जमा: ₹" + (top.paid || 0) + ")";
        }
        if (/कमाई|income|total|rashi/.test(parsed.raw)) {
            const sorted = [...records].sort((a,b) => Number(b.total||0) - Number(a.total||0));
            const top = sorted[0];
            return "सबसे ज्यादा कमाई: " + (top.name || top.farmer || "अज्ञात") + " — ₹" + (top.total || 0);
        }
        // Generic highest
        const sorted = [...records].sort((a,b) => Number(b.total||0) - Number(a.total||0));
        const top = sorted[0];
        return "सबसे ज्यादा: " + (top.name || top.farmer || "अज्ञात") + " — ₹" + (top.total || 0) + " (" + (top.work || "") + ", " + (top.date || "") + ")";
    }

    // DEFAULT — single or multiple records
    if (records.length === 1) {
        const r = records[0];
        return (r.name || r.farmer || "किसान") + " का हिसाब:\n"
            + "📅 तारीख: " + (r.date || "-") + "\n"
            + "🚜 काम: " + (r.work || "-") + "\n"
            + (r.crop ? "🌾 फसल: " + r.crop + "\n" : "")
            + "📏 मात्रा: " + (r.bigha || r.unit || "-") + "\n"
            + "💰 कुल: ₹" + (r.total || 0) + "\n"
            + "💵 जमा: ₹" + (r.paid || 0) + "\n"
            + "❌ बाकी: ₹" + (r.baki || r.balance || (Number(r.total||0) - Number(r.paid||0)));
    }

    // Multiple records — give summary
    return farmerList + " के " + records.length + " रिकॉर्ड मिले। कुल: ₹" + total + ", जमा: ₹" + paid + ", बाकी: ₹" + baki;
}

window.buildLocalAnswer = buildLocalAnswer;

// ==========================================
// PART 15
// SMART RECORD SEARCH
// ==========================================

function normalizeText(text){

    return String(text || "")
        .toLowerCase()
        .replace(/[^\u0900-\u097fa-z0-9]/g,"");

}
window.normalizeText = normalizeText;
function resolveQuestionContext(question){

    const farmer = getCurrentFarmer();

    if(!farmer) return question;

    let q = question;

    q = q.replace(/\b(उसका|उसके|उसने|वो|वह|इस किसान|उस किसान|उसमें|उससे|उसकी)\b/gi, farmer);

    return q;

}
async function askMunshi(question){
question = resolveQuestionContext(question);
    
    // ==========================================
// RAJ AI DIAGNOSTIC COMMAND
// ==========================================
if (!/system.*check|diagnostic|diagnose|सिस्टम.*चेक|सिस्टम.*जांच|मॉड्यूल.*चेक|module.*check/i.test(String(question))) {
    window.RAJ_AI.munshi.context.lastQuestion = question;
}
const diagnosticText = String(question || "")
    .toLowerCase()
    .trim();

if (
    /system.*check|diagnostic|diagnose|सिस्टम.*चेक|सिस्टम.*जांच|सिस्टम.*जाँच|मॉड्यूल.*चेक|module.*check/.test(diagnosticText)
) {

    if (typeof getRAIAIDiagnosticReport === "function") {

        return {
            success: true,
            source: "diagnostic",
            reply: getRAIAIDiagnosticReport(),
            records: []
        };

    }

}
    const result = {

        success:false,

        source:null,

        reply:"",

        records:[]

    };

    // Save Context
    window.RAJ_AI = window.RAJ_AI || {};

    window.RAJ_AI.munshi =
        window.RAJ_AI.munshi || {};

    window.RAJ_AI.munshi.lastQuestion =
        question;
// ==========================================
// PART 13
// LOCAL AI FIRST
// ==========================================

// 1. Local AI (सबसे पहले)
if (typeof processLocalQuestion === "function") {

    const localReply = processLocalQuestion(question);

    if (localReply) {

        result.success = true;
        result.source = "local";

        if (Array.isArray(localReply)) {

            result.records = localReply;

        } else {

            result.reply = localReply;

        }

        updateMunshiContext(
            question,
            result.records || []
        );

        return result;

    }

}


// 2. Analysis
if(typeof analyzeQuestion==="function"){

    try{

        const r = await analyzeQuestion(question);

        if(r){

            result.success = true;

            result.source = "analysis";

            result.reply = r;

            return result;

        }

    }catch(e){}

}


// 3. Brain — now returns reply via smartReply
if(typeof think==="function"){

    try{

        const r = await think(question);

        if(r && (r.reply || (r.records && r.records.length))){

            result.success = true;

            result.source = "brain";

            if(r.reply) result.reply = r.reply;

            if(r.records && r.records.length) result.records = r.records;

            updateMunshiContext(question, result.records || []);

            return result;

        }

    }catch(e){}

}


// 4. Core
if (typeof processRajRequest === "function") {

    try {

        const coreResult = await processRajRequest(question);

        if (coreResult && coreResult.success) {

            result.success = true;

            result.source = "core";

            if (coreResult.reply)

                result.reply = coreResult.reply;

            if (coreResult.records)

                result.records = coreResult.records;

            return result;

        }

    } catch (e) {

        console.error(e);

    }

}


// 5. Gemini
result.source = "gemini";

return result;

}

// ==========================================
// AI MUNSHI 3.0 - FIXED & SEPARATED FILE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("ai-toggle-btn");
  const closeBtn = document.getElementById("ai-close-btn");
  const chatBox = document.getElementById("ai-chat-box");
  const sendBtn = document.getElementById("ai-send-btn");
  const micBtn = document.getElementById("ai-mic-btn");
  const inputField = document.getElementById("ai-input");
  const messagesContainer = document.getElementById("ai-messages");
  const ttsToggleBtn = document.getElementById("ai-tts-toggle");

  if (!toggleBtn) return;

  let isSpeechEnabled = true;
  let isRequestPending = false;
  let fullSpokenTranscript = "";

  const aiCache = new Map();
  window.MUNSHI_GLOBAL_MEMORY = window.MUNSHI_GLOBAL_MEMORY || [];

  if (ttsToggleBtn) {
    ttsToggleBtn.addEventListener("click", () => {
      isSpeechEnabled = !isSpeechEnabled;
      ttsToggleBtn.innerText = isSpeechEnabled ? "🔊" : "🔇";
      if (!isSpeechEnabled && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    });
  }

  toggleBtn.addEventListener("click", () => {
    chatBox.style.display = (chatBox.style.display === "none" || !chatBox.style.display) ? "flex" : "none";
  });
  if (closeBtn) closeBtn.addEventListener("click", () => { chatBox.style.display = "none"; });

  // 1. स्क्रीन और फायरबेस से डेटा लोड करना
  async function syncWebsiteMemory() {
    let tempMemory = [];

    const tableRows = document.querySelectorAll("table tbody tr");
    tableRows.forEach((row) => {
      const rowText = row.innerText.replace(/\s+/g, ' ').trim();
      if (rowText && !rowText.includes("No records") && !rowText.includes("कोई रिकॉर्ड नहीं")) {
        tempMemory.push(rowText);
      }
    });

    try {
      if (typeof db !== "undefined" && db.collection) {
        const collectionsToSearch = ["entries", "farmers", "records", "data", "khata"];
        for (let col of collectionsToSearch) {
          const snapshot = await db.collection(col).get();
          if (!snapshot.empty) {
            snapshot.forEach((doc) => {
              const d = doc.data();
              const farmerName = d.name || d.farmer_name || d.farmerName || d.kisan || d.farmer || '';
              const workType = d.work || d.work_type || d.workType || d.detail || '-';
              const qty = d.bigha || d.quantity || d.hours || d.qty || 0;
              const totalAmt = d.total || d.total_amount || d.amount || 0;
              const paidAmt = d.paid || d.paid_amount || d.deposit || 0;
              const recDate = d.date || d.entry_date || '';

              if (farmerName || totalAmt > 0) {
                tempMemory.push(`Farmer: ${farmerName}, Work: ${workType}, Quantity: ${qty}, Total: ₹${totalAmt}, Paid: ₹${paidAmt}, Date: ${recDate}`);
              }
            });
          }
        }
      }
    } catch (err) {
      console.log("Memory load fallback:", err);
    }

    if (tempMemory.length > 0) {
      window.MUNSHI_GLOBAL_MEMORY = tempMemory;
    }
  }

  syncWebsiteMemory();

  // 2. स्मार्ट फ़िल्टर
  function getFilteredMemory(query) {
    if (window.MUNSHI_GLOBAL_MEMORY.length === 0) return "कोई रिकॉर्ड उपलब्ध नहीं है।";
    if (window.MUNSHI_GLOBAL_MEMORY.length <= 50) {
      return window.MUNSHI_GLOBAL_MEMORY.join("\n");
    }

    const clean = query.toLowerCase();
    const words = clean.split(" ").filter(w => w.length > 2);
    let matched = window.MUNSHI_GLOBAL_MEMORY.filter(rec => {
      const rLower = rec.toLowerCase();
      return words.some(w => rLower.includes(w));
    });

    return matched.length > 0 ? matched.join("\n") : window.MUNSHI_GLOBAL_MEMORY.slice(-25).join("\n");
  }
// ==========================================
// COMMON GEMINI API
// ==========================================

async function callGeminiAPI(prompt, imageBase64 = null) {

    // Backend proxy — API key is hidden on the server side
    const BACKEND_URL = "https://tector-chhapola.onrender.com/api/chat";

    const body = { prompt: prompt || "" };

    // If image data is provided, send it to backend for Gemini Vision
    if (imageBase64) {
        let raw = imageBase64;
        let mimeType = "image/jpeg";

        // Extract mime type from data-URL prefix
        if (typeof raw === "string" && raw.startsWith("data:")) {
            const match = raw.match(/^data:([^;]+);/);
            if (match) mimeType = match[1];
        }

        body.image = raw;
        body.mime_type = mimeType;
    }

    // Build headers with Firebase ID token if available
    const headers = {
        "Content-Type": "application/json"
    };

    try {
        if (window.auth && window.auth.currentUser) {
            const idToken = await window.auth.currentUser.getIdToken();
            if (idToken) {
                headers["Authorization"] = "Bearer " + idToken;
            }
        }
    } catch (e) {
        // Token fetch failed — request will proceed without auth
    }

    const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
            errData.detail || `Backend error: ${response.status}`
        );
    }

    // Returns Gemini-compatible format: { candidates: [...] }
    return await response.json();

}

window.callGeminiAPI = callGeminiAPI;
  // 3. AI रिक्वेस्ट हैंडलर (एकदम सही Single Fetch)
  async function handleSend(userText) {
    if (isRequestPending) return;

    const text = userText || (inputField ? inputField.value.trim() : "");
    if (!text) return;

    const cleanTextKey = text.toLowerCase().trim();

    // Cache Check
    if (aiCache.has(cleanTextKey)) {
      const cachedResponse = aiCache.get(cleanTextKey);
      appendMessage(text, "user");
      if (inputField) inputField.value = "";
      appendMessage(cachedResponse, "ai");
      speakText(cachedResponse);
      return;
    }

    isRequestPending = true;
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    appendMessage(text, "user");
    if (inputField) inputField.value = "";

    const loadingDiv = appendMessage("हिसाब देख रहा हूँ...", "ai");

    if (window.MUNSHI_GLOBAL_MEMORY.length === 0) {
      await syncWebsiteMemory();
    }

    // ==========================================
    // STEP 1: PARSE QUESTION
    // ==========================================
    let parsed = { intent: "GENERAL", farmer: null, date: null, dateRange: null, work: null, crop: null, raw: text };
    try {
        if (typeof parseQuestion === "function") {
            parsed = parseQuestion(text);
        }
    } catch(e) { console.log("parseQuestion error:", e); }

    // ==========================================
    // STEP 2: SMART FARMER SEARCH
    // ==========================================
    let filteredRecords = [];

    try {
        // Use parsed farmer name for better search
        if (parsed.farmer && typeof window.records === "object" && window.records && window.records.length) {
            const fn = parsed.farmer.trim().toLowerCase();
            filteredRecords = window.records.filter(r => {
                const name = (r.name || r.farmer || "").trim().toLowerCase();
                return name === fn;
            });
        }

        // If no records found from parsed farmer, try searchFarmerRecords
        if (!filteredRecords.length && typeof searchFarmerRecords === "function") {
            // Pass farmer name (not full question) for better matching
            const searchTerm = parsed.farmer || text;
            filteredRecords = searchFarmerRecords(searchTerm) || [];
        }

        // Fallback: universal search with full question
        if (!filteredRecords.length && typeof universalSearch === "function") {
            filteredRecords = universalSearch(text) || [];
        }

        // Apply date filter if parsed
        if (filteredRecords.length && parsed.dateRange) {
            filteredRecords = filteredRecords.filter(r => {
                const d = r.date || "";
                return d >= parsed.dateRange.from && d <= parsed.dateRange.to;
            });
        } else if (filteredRecords.length && parsed.date) {
            filteredRecords = filteredRecords.filter(r => (r.date || "") === parsed.date);
        }

        // Apply work filter if parsed
        if (filteredRecords.length && parsed.work) {
            filteredRecords = filteredRecords.filter(r => {
                const w = (r.work || "").toLowerCase();
                return w === parsed.work.toLowerCase();
            });
        }

        // Apply crop filter if parsed
        if (filteredRecords.length && parsed.crop) {
            filteredRecords = filteredRecords.filter(r => {
                const c = (r.crop || "").toLowerCase();
                return c === parsed.crop.toLowerCase();
            });
        }

    } catch (e) {
        console.error("Munshi Search Error:", e);
        filteredRecords = [];
    }

    // Update context with found records
    if (filteredRecords.length) {
        updateMunshiContext(text, filteredRecords);
    }

    // ==========================================
    // STEP 3: TRY LOCAL AI (askMunshi)
    // ==========================================
    let munshiResult = null;
    try {
        if (typeof askMunshi === "function") {
            munshiResult = await askMunshi(text);
        }
    } catch(e) { console.log(e); }

    let reply = "";
    let foundInLocal = false;

    if (munshiResult && munshiResult.reply) {
        reply = munshiResult.reply;
        foundInLocal = true;
    } else if (munshiResult && munshiResult.records && munshiResult.records.length) {
        const records = munshiResult.records;
        reply = records.map(r => {
            return `👨‍🌾 किसान: ${r.name || r.farmer || "अज्ञात"}\n📅 दिनांक: ${r.date || "-"}\n🚜 कार्य: ${r.work || "-"}\n🌾 फसल: ${r.crop || "-"}\n📏 मात्रा: ${r.bigha || r.unit || 0}\n💰 कुल: ₹${r.total || 0}\n💵 जमा: ₹${r.paid || 0}\n❌ बाकी: ₹${r.balance || r.baki || (r.total - r.paid) || 0}`;
        }).join("\n\n");
        foundInLocal = true;
    }

    // ==========================================
    // STEP 4: TRY LOCAL ANSWER BUILDER
    // ==========================================
    if (!foundInLocal && filteredRecords.length && typeof buildLocalAnswer === "function") {
        try {
            const localAnswer = buildLocalAnswer(parsed, filteredRecords);
            if (localAnswer) {
                reply = localAnswer;
                foundInLocal = true;
            }
        } catch(e) { console.log("buildLocalAnswer error:", e); }
    }

    if (foundInLocal && reply) {
        loadingDiv.remove();
        aiCache.set(cleanTextKey, reply);
        appendMessage(reply, "ai");
        speakText(reply);
        isRequestPending = false;
        return;
    }

// ==========================================
// STEP 5: GEMINI FALLBACK
// ==========================================
const fullPrompt = `You are AI Munshi 3.0 of Chhapola Agriculture.

Always answer in natural, clear Hindi.
Use only the verified farmer records provided below.
Never invent or guess any data.

USER QUERY:
"${text}"

VERIFIED FARMER RECORDS:
${JSON.stringify(filteredRecords, null, 2)}

RULES:
1. Understand what the user is actually asking.
2. Answer only the question asked.
3. Hindi, Marwadi and English farmer names should be treated as equivalent when they refer to the same person.
4. Ignore small spelling and pronunciation differences.
5. For हिसाब questions, calculate Total, Paid and Balance accurately.
6. Balance = Total - Paid.
7. If the user asks for one record, give that record.
8. If the user asks for total हिसाब, add all matching records.
9. If the user asks for date, work, crop, quantity, payment or balance, give that specific information.
10. Do not use records belonging to another farmer.
11. If no matching record exists, say:
"राम-राम जी, इस किसान का रिकॉर्ड नहीं मिला।"
12. Do not force a fixed number of lines or sentences.
13. Keep the answer natural and concise, but give enough information to answer the question completely.
`;
    try {
      // 🔑 Key 2 हिस्सों में
const data = await callGeminiAPI(fullPrompt);
      loadingDiv.remove();

      if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const aiAnswer = data.candidates[0].content.parts[0].text.trim();
        aiCache.set(cleanTextKey, aiAnswer);
        appendMessage(aiAnswer, "ai");
        speakText(aiAnswer);
      } else {
        console.error("API Error Response:", data);
        appendMessage("राम-राम जी, रिकॉर्ड समझने में दिक्कत हुई। एक बार फिर पूछें।", "ai");
      }
    } catch (err) {
      loadingDiv.remove();
      console.error("Fetch Error:", err);
      // Show actual error message from backend if available
      const errMsg = err.message || "";
      if (errMsg.includes("502") || errMsg.includes("high demand") || errMsg.includes("overloaded")) {
        appendMessage("AI सर्वर अभी व्यस्त है। कुछ देर बाद फिर पूछें। 🙏", "ai");
      } else if (errMsg.includes("429")) {
        appendMessage("बहुत ज्यादा सवाल हो गए। थोड़ी देर रुकें। ⏳", "ai");
      } else if (errMsg.includes("503")) {
        appendMessage("AI सेवा अभी उपलब्ध नहीं है। बाद में प्रयास करें।", "ai");
      } else {
        appendMessage("कनेक्शन में समस्या हुई। नेटवर्क जाँचें और फिर पूछें।", "ai");
      }
    } finally {
      isRequestPending = false;
    }
  }

  // 4. स्पीच और वॉइस आउटपुट
  function speakText(text) {
    if (!isSpeechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  function appendMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.style.padding = "8px 12px";
    msgDiv.style.borderRadius = "8px";
    msgDiv.style.maxWidth = "85%";
    msgDiv.style.fontSize = "13px";
    msgDiv.style.lineHeight = "1.5";
    msgDiv.style.whiteSpace = "pre-wrap";

    if (sender === "user") {
      msgDiv.style.background = "#10b981";
      msgDiv.style.color = "white";
      msgDiv.style.alignSelf = "flex-end";
    } else {
      msgDiv.style.background = "#e5e7eb";
      msgDiv.style.color = "#1f2937";
      msgDiv.style.alignSelf = "flex-start";
    }

    msgDiv.innerText = text;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return msgDiv;
  }

  if (sendBtn) sendBtn.addEventListener("click", () => handleSend());
  if (inputField) {
    inputField.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSend();
    });
  }

  // 5. वॉइस इनपुट (माइक)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition && micBtn) {
    const rec = new SpeechRecognition();
    rec.lang = "hi-IN";
    rec.continuous = false;
    rec.interimResults = false;

    micBtn.addEventListener("click", () => {
      fullSpokenTranscript = "";
      if (inputField) inputField.placeholder = "सुन रहा हूँ, बोलिए...";
      micBtn.style.background = "#ef4444";
      micBtn.style.color = "white";
      rec.start();
    });

    rec.onresult = (e) => {
      if (e.results && e.results[0]) {
        fullSpokenTranscript = e.results[0][0].transcript;
        if (inputField) inputField.value = fullSpokenTranscript;
      }
    };

    rec.onend = () => {
      micBtn.style.background = "#f3f4f6";
      micBtn.style.color = "black";
      if (inputField) inputField.placeholder = "यहाँ लिखें या माइक दबाएँ...";
      if (fullSpokenTranscript.trim().length > 0 && !isRequestPending) {
        handleSend(fullSpokenTranscript);
        fullSpokenTranscript = "";
      }
    };

    rec.onerror = () => {
      micBtn.style.background = "#f3f4f6";
      micBtn.style.color = "black";
      if (inputField) inputField.placeholder = "यहाँ लिखें या माइक दबाएँ...";
    };
  }
});
