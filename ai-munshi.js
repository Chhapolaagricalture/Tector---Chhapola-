// ==========================================
// AI MUNSHI MAIN CONTROLLER v4
// ==========================================
window.RAJ_AI = window.RAJ_AI || {};
window.RAJ_AI.munshi = window.RAJ_AI.munshi || {};

window.RAJ_AI.munshi.context = {
    farmer: null,
    lastQuestion: "",
    lastReply: "",
    lastRecords: []
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

    q = q.replace(/\b(उसका|उसके|उसने|वो|वह|इस किसान|उस किसान)\b/gi, farmer);

    return q;

}
async function askMunshi(question){
question = resolveQuestionContext(question);
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
// CORE FIRST ROUTING
// ==========================================
// ==========================================
// CORE = MAIN CONTROLLER
// ==========================================

if (typeof processRajRequest === "function") {

    try {

        const coreResult =
            await processRajRequest(question);

        if (coreResult && coreResult.success) {

            result.success = true;
            result.source = coreResult.source || "core";

            if (coreResult.reply) {
                result.reply = coreResult.reply;
            }

            if (
                Array.isArray(coreResult.records) &&
                coreResult.records.length
            ) {
                result.records = coreResult.records;
            }

            updateMunshiContext(
                question,
                result.records || []
            );

            return result;
        }

    } catch (e) {

        console.error(
            "Core Controller Error:",
            e
        );

    }


// ==========================================
// FALLBACK
// ==========================================

// Core ने जवाब नहीं दिया तो यहाँ से
// पुराना Gemini fallback चलेगा।

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

    const part1 = "AQ.Ab8RN6IneFD895YMiuSHRHH-p";
    const part2 = "fAG_Wz4ZrghWn3DykD4Q_0XVw";
    const apiKey = part1 + part2;

    const apiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

    const parts = [];

    if (prompt) {
        parts.push({ text: prompt });
    }

    if (imageBase64) {

        parts.push({

            inline_data: {

                mime_type: "image/jpeg",

                data: imageBase64.split(",")[1]

            }

        });

    }

    const response = await fetch(apiUrl, {

        method: "POST",

        headers: {

            "Content-Type": "application/json",

            "X-goog-api-key": apiKey

        },

        body: JSON.stringify({

            contents: [

                {

                    parts: parts

                }

            ]

        })

    });

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
// MUNSHI → RAJ AI SEARCH ENGINE
// ==========================================

let filteredRecords = [];

try {

    // पहले किसान-विशेष Search
    if (typeof searchFarmerRecords === "function") {

        filteredRecords = searchFarmerRecords(text) || [];

    }

    // अगर किसान Search से कुछ नहीं मिला
    if (
        !filteredRecords.length &&
        typeof universalSearch === "function"
    ) {

        filteredRecords = universalSearch(text) || [];

    }

} catch (e) {

    console.error("Munshi Search Error:", e);

    filteredRecords = [];

}

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
            return `👨‍🌾 किसान: ${r.name || r.farmer || "अज्ञात"}
📅 दिनांक: ${r.date || "-"}
🚜 कार्य: ${r.work || "-"}
🌾 फसल: ${r.crop || "-"}
📏 मात्रा: ${r.bigha || r.unit || 0}
💰 कुल: ₹${r.total || 0}
💵 जमा: ₹${r.paid || 0}
❌ बाकी: ₹${r.balance || (r.total - r.paid) || 0}`;
        }).join("\n\n");
        foundInLocal = true;
    }

    if (foundInLocal && reply) {
        loadingDiv.remove();
        aiCache.set(cleanTextKey, reply);
        appendMessage(reply, "ai");
        speakText(reply);
        isRequestPending = false;
        return;
    }

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
      appendMessage("कनेक्शन पर नेटवर्क जाँचें।", "ai");
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

