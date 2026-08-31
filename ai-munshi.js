// ==========================================
// AI MUNSHI MAIN CONTROLLER v6
// All-Rounder Agriculture & Account Assistant
// ==========================================
window.RAJ_AI = window.RAJ_AI || {};
window.RAJ_AI.munshi = window.RAJ_AI.munshi || {};

window.RAJ_AI.munshi.context = {
    farmer: null,
    lastQuestion: "",
    lastReply: "",
    lastRecords: [],
    lastIntent: null,
    lastDate: null,
    lastFarmerName: null,
    lastWork: null,
    lastCrop: null,
    conversationHistory: []
};

// ==========================================
// CONTEXT MEMORY
// ==========================================

function updateMunshiContext(question, records = []) {
    window.RAJ_AI.munshi.context.lastQuestion = question;
    window.RAJ_AI.munshi.context.lastRecords = records;

    if (records && records.length) {
        const r = records[0];
        const name = r.name || r.farmer || null;
        if (name) {
            window.RAJ_AI.munshi.context.farmer = name;
            window.RAJ_AI.munshi.context.lastFarmerName = name;
        }
        if (r.work) window.RAJ_AI.munshi.context.lastWork = r.work;
        if (r.crop) window.RAJ_AI.munshi.context.lastCrop = r.crop;
        if (r.date) window.RAJ_AI.munshi.context.lastDate = r.date;
    }

    // Keep conversation history (last 10 exchanges)
    window.RAJ_AI.munshi.context.conversationHistory.push({
        question: question,
        time: Date.now(),
        recordsFound: records.length
    });
    if (window.RAJ_AI.munshi.context.conversationHistory.length > 10) {
        window.RAJ_AI.munshi.context.conversationHistory.shift();
    }
}

function getCurrentFarmer() {
    return window.RAJ_AI.munshi.context.farmer || window.RAJ_AI.munshi.context.lastFarmerName;
}

// ==========================================
// PART 14
// SMART FARMER FINDER
// ==========================================

// ==========================================
// ENGLISH → HINDI PHONETIC TRANSLITERATION
// ==========================================
const HI = {
    "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "n",
    "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
    "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
    "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
    "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
    "य": "y", "र": "r", "ल": "l", "व": "v",
    "श": "sh", "ष": "sh", "स": "s", "ह": "h",
    "ा": "a", "ि": "i", "ी": "ee", "ु": "u", "ू": "oo",
    "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ं": "n", "ः": "h"
};

function transliterateHindi(name) {
    let result = "";
    for (const ch of name) {
        if (HI[ch]) { result += HI[ch]; }
        else if (/[a-z]/i.test(ch)) { result += ch; }
        else if (/\s/.test(ch)) { result += " "; }
        else { result += ch; }
    }
    return result.toLowerCase().replace(/\s+/g, " ").trim();
}

function phoneticMatch(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    // Direct substring
    if (a.includes(b) || b.includes(a)) return true;
    // Transliterate Hindi name and compare
    const aEng = transliterateHindi(a);
    const bEng = transliterateHindi(b);
    if (aEng === bEng) return true;
    if (aEng.includes(bEng) || bEng.includes(aEng)) return true;
    // Word overlap
    const aWords = aEng.split(" ").filter(w => w.length >= 2);
    const bWords = bEng.split(" ").filter(w => w.length >= 2);
    let matchCount = 0;
    aWords.forEach(aw => {
        bWords.forEach(bw => {
            if (aw === bw || aw.includes(bw) || bw.includes(aw)) matchCount++;
        });
    });
    return matchCount >= Math.min(aWords.length, bWords.length);
}

// Hindi honorifics and suffixes to strip before matching
const HONORIFICS = /(?:\s*(?:जी|ji|saab|sahab|भाई|bhai|बाबू|babu|सर|sir|मियाँ|miyan|वाले|वाला|वाली|वालों|किसान|farmer|ने|का|के|की|को|से|पर|में|को|और|तथा|व|या|का\s+हिसाब|के\s+हिसाब|की\s+हिसाब|का\s+पूरा|के\s+पूरा|की\s+पूरा|का\s+record|के\s+record|की\s+record))*$/i;

function normalizeName(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^\u0900-\u097Fa-z0-9 ]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function stripHonorifics(text) {
    let clean = String(text || "").trim();
    // Strip trailing honorifics
    clean = clean.replace(/\s*(जी|ji|साहब|sahab|sab|भाई|bhai|बाबू|babu|सर|sir|मियाँ|miyan)\s*$/i, "");
    // Strip trailing suffixes that indicate grammar, not name
    clean = clean.replace(/\s*(वाले|वाला|वाली|वालों)\s*$/i, "");
    // Strip trailing postpositions
    clean = clean.replace(/\s*(ने|का|के|की|को|से|पर|में)\s*$/i, "");
    // Strip "का हिसाब", "का पूरा हिसाब", etc.
    clean = clean.replace(/\s*(का|के|की)\s*(पूरा|पूरे?|हिसाब|ledger|record|history|काम|data|info|detail|report|summary)\s*$/i, "");
    clean = clean.replace(/\s*(पूरा|पूरे?|हिसाब|ledger|record|history|काम|data|info|detail|report|summary)\s*$/i, "");
    return clean.trim();
}

function findFarmer(question) {
    if (!window.records || !window.records.length) return null;

    // First try: strip honorifics and normalize
    const qClean = stripHonorifics(question);
    const q = normalizeName(qClean);

    // Also get the language-processed version if available
    let qLang = q;
    if (typeof understandLanguage === "function") {
        try {
            const processed = understandLanguage(qClean);
            if (processed) qLang = normalizeName(processed);
        } catch(e) {}
    }

    // Build unique farmer name list
    const farmers = [...new Set(window.records.map(r => r.name).filter(Boolean))];
    if (!farmers.length) return null;

    let best = null;
    let score = 0;

    // Score each farmer
    farmers.forEach(name => {
        const n = normalizeName(name);
        if (!n) return;
        let s = 0;

        // Exact match (highest priority)
        if (q === n || qLang === n) { s += 100; }

        // q contains full farmer name
        else if (q.includes(n) || qLang.includes(n)) { s += 30; }

        // Farmer name contains q
        else if (n.includes(q) || n.includes(qLang)) { s += 20; }

        // Word-by-word matching
        else {
            const nameWords = n.split(" ");
            const qWords = q.split(" ");
            const qLangWords = qLang.split(" ");

            nameWords.forEach(nw => {
                if (nw.length < 2) return;
                qWords.forEach(qw => {
                    if (qw === nw) s += 5;
                    else if (nw.includes(qw) || qw.includes(nw)) s += 3;
                });
                qLangWords.forEach(qw => {
                    if (qw === nw) s += 5;
                    else if (nw.includes(qw) || qw.includes(nw)) s += 3;
                });
            });
        }

        // Bonus: name that starts with the query
        if (n.startsWith(q) || q.startsWith(n)) s += 10;

        if (s > score) {
            score = s;
            best = name;
        }
    });

    // Only return if score is meaningful (at least some word overlap)
    if (score >= 3) return best;

    // PHONETIC FALLBACK: try English→Hindi transliteration matching
    const qLower = normalizeName(qClean).toLowerCase();
    let phoneticBest = null;
    let phoneticScore = 0;

    farmers.forEach(name => {
        if (phoneticMatch(qLower, normalizeName(name))) {
            // Score based on how many words match
            const nameWords = normalizeName(name).split(" ").filter(w => w.length >= 2);
            const qWords = qLower.split(" ").filter(w => w.length >= 2);
            let matches = 0;
            nameWords.forEach(nw => {
                qWords.forEach(qw => {
                    if (nw === qw || nw.includes(qw) || qw.includes(nw)) matches++;
                });
            });
            if (matches >= 2 && matches > phoneticScore) {
                phoneticScore = matches;
                phoneticBest = name;
            }
        }
    });

    return phoneticBest || null;
}

window.findFarmer = findFarmer;

// ==========================================
// QUESTION PARSER
// Extract intent, farmer, date, work from natural language
// ==========================================

function parseQuestion(text) {
    const rawText = String(text || "").trim();
    const q = rawText.toLowerCase();
    const result = {
        intent: "GENERAL",
        farmer: null,
        date: null,
        dateRange: null,
        work: null,
        crop: null,
        raw: rawText,
        questionType: null,
        filters: {}
    };

    // ---- Language preprocessing (Hinglish → Hindi) ----
    let processedText = rawText;
    if (typeof understandLanguage === "function") {
        try { processedText = understandLanguage(rawText) || rawText; } catch(e) {}
    }

    // ---- Extract farmer name ----
    if (typeof findFarmer === "function") {
        result.farmer = findFarmer(rawText);
    }

    // ---- Context resolution for follow-up questions ----
    const ctx = window.RAJ_AI.munshi.context;
    const isFollowUp = /उसका|उसने|उसके|उसकी|वो|वह|उसमें|उससे|उसी|ऐसा|वैसा|उस किसान|इस किसान|और|aur|भी|bhi/.test(q)
        && !/क्या क्या|kya kya|कैसे|kaise|कहाँ|kahan|क्या कर सकते|kya kar sakte|eske.*kam|uske.*kam/.test(q);

    if (isFollowUp && !result.farmer && ctx.farmer) {
        result.farmer = ctx.farmer;
    }
    // Use last work if question is about same work
    if (isFollowUp && !result.work && ctx.lastWork) {
        if (/उसी|वही|same|वैसा|ऐसा/.test(q)) {
            result.work = ctx.lastWork;
        }
    }
    // Use last date if question is about date
    if (isFollowUp && !result.date && !result.dateRange && ctx.lastDate) {
        if (/तारीख|date|दिन|दिनांक|उसी दिन/.test(q)) {
            result.date = ctx.lastDate;
        }
    }

    // ---- Detect ACTION intent (priority: actions before queries) ----

    // ADD RECORD
    if (/डाल\s*(दो|दे|डाल)|entry\s*(बना|डाल|add|kro|karo|banana|banana hai)|record\s*(बना|add|kro|karo)|रिकॉर्ड\s*(बना|add|डाल|kro)|नई?\s*entry\s*(kro|karo|बना|डाल)|new\s*entry\s*(kro|karo|add)|add\s*(kro|karo|entry|record)|banado|bana\s*(do|de)|bana\s*do|(?:^|\s)dal(?:\s)*(?:do|de|d0)|(?:^|\s)daldo|(?:^|\s)daal(?:\s)*(?:do|de)|(?:^|\s)daal do/.test(q)) {
        result.intent = "ACTION_ADD_RECORD";
    }
    // ADD PAYMENT
    else if (/जमा\s*(कर|करो|करे|दो|दे)|payment\s*(add|कर)|पैसा\s*(जमा|add)|₹.*\s*जमा|\d+\s*जमा|jama\s*(kar|karo|kare|do|de)|jama\s*kiya|जमा.*किया/.test(q)) {
        result.intent = "ACTION_ADD_PAYMENT";
    }
    // UPDATE RECORD
    else if (/बदल\s*(दो|दे|बदल)|badal\s*(do|de)|edit\s*(कर|करो)|update\s*(कर)|सुधार\s*(दो|दे)/.test(q)) {
        result.intent = "ACTION_UPDATE_RECORD";
    }
    // DELETE RECORD
    else if (/हटा\s*(दो|दे|हटा)|hata\s*(do|de)|delete\s*(कर|करो|do|kar)|मिटा\s*(दो|दे)|रद्द\s*(कर|करो)|delete.*\bdo\b/.test(q)) {
        result.intent = "ACTION_DELETE_RECORD";
    }
    // WHATSAPP
    else if (/whatsapp|व्हाट्सएप|व्हाट्सएप्प|message\s*(भेज|send)|संदेश\s*भेज/.test(q)) {
        result.intent = "ACTION_WHATSAPP";
    }
    // PDF
    else if (/pdf|पीडीएफ|बिल\s*बना|पर्ची\s*बना/.test(q)) {
        result.intent = "ACTION_PDF";
    }

    // ---- Detect QUERY intent (only if not an action) ----
    if (result.intent === "GENERAL" || !result.intent.startsWith("ACTION_")) {

    // SEMANTIC INTENT DETECTION (enhanced — covers more natural phrasings)
    // Only apply if no action intent was already set
    if (!result.intent.startsWith("ACTION_")) {
        const semanticIntent = typeof detectSemanticIntent === 'function' ? detectSemanticIntent(q) : null;
        if (semanticIntent && !semanticIntent.startsWith("ACTION_")) {
            result.intent = semanticIntent;
        }
    }

    // Full ledger / history
    if (result.intent === "GENERAL" && (/पूरा\s*(हिसाब|record|history|ledger|data)|full.*(ledger|history|record)|हिसाब.*(बता|दे|निकाल)|ledger|history|पूरे?\s*(का|की|के)|passbook|account.*(detail|details|खाता)|खाते?\s*की\s*जानकारी|record.*(दिखा|batao|nikalo)|history.*batao/.test(q))) {
        result.intent = "LEDGER";
    }
    // Comparison
    else if (/तुलना|compare|vs|बनाम|मुकाबले|मिलाओ|मिला/.test(q)) {
        result.intent = "COMPARISON";
    }
    // Highest/lowest
    else if (/सबसे|highest|maximum|most|lowest|minimum|least|ज्यादा|कम|sabse|top|best|worst|kisne.*kiya|kisne.*kara|kiska.*hai/.test(q)) {
        result.intent = "HIGHEST_LOWEST";
    }
    // Count
    else if (/कितने|count|संख्या|कितना|kitne|kitni|number.*(of|hai)/.test(q) && /किसान|record|entry|entries|एंट्री|एंट्रियां|काम|दिन|total/.test(q)) {
        result.intent = "COUNT";
    }
    // Balance / baki — ENHANCED
    else if (/बाकी|balance|baki|bakaya|उधार|pending|शेष|रह गए|बचा|लेनी है|owed|unpaid|बकाया|bacha|outstanding|due|dues|nahi.*diya|nahin.*diya/.test(q)) {
        result.intent = "BALANCE";
    }
    // Paid / paid — ENHANCED
    else if (/जमा|paid|diya|दिया|भुगतान|payment|pay|deposit/.test(q)) {
        result.intent = "PAID";
    }
    // Income / total — ENHANCED
    else if (/कुल|income|कमाई|total|rashi|राशि|earn|kamaya|कमाया|आय|कितना.*आय|कितना.*बना|रुपय|hamari|मेरी.*कमाई|mere.*total|kitna.*kamaya|aane.*hai|aaya.*hai/.test(q)) {
        result.intent = "INCOME";
    }
    // Crop
    else if (/फसल|crop|bajra|बाजरा|gehun|गेहूं|wheat|chana|चना|guar|ग्वार/.test(q)) {
        result.intent = "CROP";
    }
    // Work type — ENHANCED
    else if (/काम|work|hero|हीरो|calti|कल्टी|cultivator|thresher|थ्रेसर|morplau|मोरप्लाउ|display|spray|दवाई|rotavator/.test(q)) {
        result.intent = "WORK";
    }
    // Summary
    else if (/summary|सारांश|brief|संक्षिप्त|short|समरी/.test(q)) {
        result.intent = "SUMMARY";
    }
    // Payment history / pending — ENHANCED
    else if (/पेमेंट|payment.*history|कितना.*दिया|कितना.*जमा|पैसा|payment/.test(q)) {
        result.intent = "PAID";
    }
    // Farmer list — ENHANCED
    else if (/कौन|किसका|किसके|किन|किसान.*list|farmer.*list|कौन.*किसान/.test(q) && !result.farmer) {
        result.intent = "COUNT";
    }
    // "हिसाब बताओ" type — map to LEDGER
    else if (/हिसाब|hisab/.test(q) && (result.farmer || isFollowUp)) {
        result.intent = "LEDGER";
    }
    // "कितने रिकॉर्ड/एंट्री" without farmer — COUNT
    else if (/कितने?|count|संख्या/.test(q) && /रिकॉर्ड|एंट्री|entries|records/.test(q)) {
        result.intent = "COUNT";
    }
    // "तुलना" without explicit comparison keywords
    else if (/तुलना|compare|vs|बनाम|मुकाबले|मिलाओ|मिला/.test(q) && result.farmer) {
        result.intent = "COMPARISON";
    }
    // Specific question types: "क्या किया", "क्या करवाया", "कब", "पिछला काम"
    else if (/क्या.*(किया|करवाया|हुआ|था|करा|करवा)|कब|क्या है|बताओ|बता|निकाल/.test(q) && result.farmer && !/हिसाब|hisab|kitna|kitne|baki|balance/.test(q)) {
        // "पिछला काम" → sort by date DESC, show most recent
        if (/पिछला|पिछले|last|previous|prev/.test(q)) {
            result.intent = "DATE";
            result.questionType = "last";
        } else {
            result.intent = "WORK";
        }
    }
    // "उसका/उसके पिछला काम" type
    else if (isFollowUp && result.farmer) {
        if (/पिछला|पिछले|last|previous/.test(q)) {
            result.intent = "DATE";
            result.questionType = "last";
        } else if (/काम|work/.test(q)) result.intent = "WORK";
        else if (/कब|date|तारीख|दिन/.test(q)) result.intent = "DATE";
        else result.intent = "LEDGER";
    }
    // Greeting
    else if (/^(नमस्ते|hello|hi|hey|राम राम|good morning|शुभ प्रभात|प्रणाम|जय श्री|sat sri|namaste|pranam)/.test(q) && q.length < 40) {
        result.intent = "GREETING";
    }
    // Capabilities
    else if (/क्या कर सकते|what can you|capabilities|तुम क्या करते|help me|मेरी मदद|क्या हो|kya kya kam|eske kya kya|uske kya kya|kya kya kar sakte|kya kya karte|website.*kya|site.*kya|app.*kya|is site|is website|ye website|ye app/.test(q) && !/किसान|farmer|बाकी|balance/.test(q)) {
        result.intent = "CAPABILITIES";
    }
    // Calculate
    else if (/\d+\s*[x×\*\+]\s*\d+|calculate|गुणा|multiply|जोड़|kitna banega|कितना बनेगा/.test(q) && !/डाल|जमा/.test(q)) {
        result.intent = "CALCULATE";
    }
    // How-to
    else if (/कैसे|कैसा|how to|kaise|कहाँ है|where|kahan hai|kahan se|कैसे कर/.test(q) && !/किसान|farmer|बाकी|balance|kro|karo|daldo|do|de|bana|add/.test(q)) {
        result.intent = "HOW_TO";
    }
    // "रुपय/paise kab diye" → PAID
    if (result.intent === "GENERAL" && /paise.*kab.*diye|kab.*diye.*paise|rupee.*kab/.test(q)) {
        result.intent = "PAID";
    }
    // "last entry" / "sabse taza entry"
    if (result.intent === "GENERAL" && /last.*entry|sabse.*taza.*entry|aakhri.*entry|sabse.*nayi.*entry/.test(q)) {
        result.intent = "SUMMARY";
    }
    // "वसूली दर" / "collection rate"
    if (result.intent === "GENERAL" && /वसूली|collection|recovery|dar|दर/.test(q)) {
        result.intent = "INCOME";
    }
    // Generic "कितना" question with farmer — BALANCE (most common question type)
    else if (/कितना|kitna|how much/.test(q) && result.farmer) {
        result.intent = "BALANCE";
    }

    // ---- Extract date ----
    } // end query intent block

    // ---- INTENT GUARD: clear farmer for non-agricultural GENERAL questions ----
    if (result.intent === "GENERAL" && result.farmer) {
        const nonAgriWords = /\b(mosam|mausam|weather|temperature|samachar|news|cricket|football|match|song|gaana|movie|film|recipe|pakwan|nuske|ghar|gharelu|sehat|health|beauty|sundarta|fashion|tech|phone|laptop|game|khel|dosti|pyar|mohabbat|horoscope|rashi|kundli|mantra|puja|vrat|astrology|janam kundli)\b/;
        const qCheck = q + " " + qLang;
        if (nonAgriWords.test(qCheck)) {
            result.farmer = null;
        }
    }

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
    } else if (/इस\s*साल|this\s*year|is\s*saal/.test(q)) {
        const yearStart = new Date(today.getFullYear(), 0, 1);
        result.dateRange = {
            from: yearStart.toISOString().split("T")[0],
            to: today.toISOString().split("T")[0]
        };
    } else if (/पिछले?\s*साल|last\s*year|pichle?\s*saal/.test(q)) {
        const lastYear = today.getFullYear() - 1;
        const lyStart = new Date(lastYear, 0, 1);
        const lyEnd = new Date(lastYear, 11, 31);
        result.dateRange = {
            from: lyStart.toISOString().split("T")[0],
            to: lyEnd.toISOString().split("T")[0]
        };
    } else if (/इस\s*(हफ्ते?|week)|is\s*(hafta|week)/.test(q)) {
        const dayOfWeek = today.getDay();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - dayOfWeek);
        result.dateRange = {
            from: weekStart.toISOString().split("T")[0],
            to: today.toISOString().split("T")[0]
        };
    } else {
        // Try "पिछले N दिन"
        const daysMatch = q.match(/पिछले?\s*(\d+)\s*(दिन|days?)/);
        if (daysMatch) {
            const n = parseInt(daysMatch[1]);
            const from = new Date(today);
            from.setDate(today.getDate() - n);
            result.dateRange = {
                from: from.toISOString().split("T")[0],
                to: today.toISOString().split("T")[0]
            };
        }
    }
    if (!result.date && !result.dateRange) {
        // Try numeric date: "24/08/2026", "24-08", "24/08"
        const dateMatch = q.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
        if (dateMatch) {
            const month = dateMatch[2].padStart(2, "0");
            const year = dateMatch[3] || String(today.getFullYear());
            result.date = year + "-" + month + "-" + dateMatch[1].padStart(2, "0");
        } else {
            // Try Hindi month names: "24 अगस्त", "15 जून 2026"
            const hindiMonths = {
                "जनवरी": "01", "फरवरी": "02", "मार्च": "03", "अप्रैल": "04",
                "मई": "05", "जून": "06", "जुलाई": "07", "अगस्त": "08",
                "सितंबर": "09", "सितम्बर": "09", "अक्टूबर": "10",
                "नवंबर": "11", "नवम्बर": "11", "दिसंबर": "12", "दिसम्बर": "12"
            };
            // Also English month names
            const engMonths = {
                "january": "01", "february": "02", "march": "03", "april": "04",
                "may": "05", "june": "06", "july": "07", "august": "08",
                "september": "09", "october": "10", "november": "11", "december": "12",
                "jan": "01", "feb": "02", "mar": "03", "apr": "04",
                "jun": "06", "jul": "07", "aug": "08", "sep": "09",
                "oct": "10", "nov": "11", "dec": "12"
            };
            const allMonths = { ...hindiMonths, ...engMonths };

            const monthPattern = Object.keys(allMonths).join("|");
            // Try "24 अगस्त" (day + month)
            const hindiDateMatch = q.match(
                new RegExp("(\\d{1,2})\\s*(" + monthPattern + ")(?:\\s*(\\d{4}))?")
            );
            if (hindiDateMatch) {
                const day = hindiDateMatch[1].padStart(2, "0");
                const monthNum = allMonths[hindiDateMatch[2].toLowerCase()];
                const year = hindiDateMatch[3] || String(today.getFullYear());
                result.date = year + "-" + monthNum + "-" + day;
            } else {
                // Try month-only: "अगस्त में", "जून में", "in august"
                const monthOnlyMatch = q.match(
                    new RegExp("(" + monthPattern + ")(?:\\s*में|\\s*ko|\\s*ke|\\s*ki|\\s*in)?")
                );
                if (monthOnlyMatch) {
                    const monthNum = allMonths[monthOnlyMatch[1].toLowerCase()];
                    if (monthNum) {
                        const year = String(today.getFullYear());
                        const monthStart = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                        const monthEnd = new Date(parseInt(year), parseInt(monthNum), 0);
                        result.dateRange = {
                            from: monthStart.toISOString().split("T")[0],
                            to: monthEnd.toISOString().split("T")[0]
                        };
                    }
                }
            }
        }
    }

    // ---- Extract work type ----
    const workMap = {
        "hero": "Hero", "हीरो": "Hero",
        "calti": "Calti", "कल्टी": "Calti", "cultivator": "Calti",
        "thresher": "Thresher", "थ्रेसर": "Thresher", "थ्रेसर": "Thresher",
        "morplau": "Morplau", "मोरप्लाउ": "Morplau",
        "display": "Display",
        "spray": "Spray Machine", "दवाई": "Spray Machine", "spray machine": "Spray Machine",
        "rotavator": "Rotavator", "रोटावेटर": "Rotavator",
        "mej": "Mej (Pata)", "पता": "Mej (Pata)", "pata": "Mej (Pata)"
    };
    for (const [key, value] of Object.entries(workMap)) {
        if (q.includes(key)) { result.work = value; break; }
    }

    // ---- Extract crop ----
    const cropMap = {
        "bajra": "Bajra", "बाजरा": "Bajra",
        "gehun": "Gehun", "गेहूं": "Gehun", "wheat": "Gehun",
        "chana": "Chana", "चना": "Chana",
        "guar": "Guar", "ग्वार": "Guar"
    };
    for (const [key, value] of Object.entries(cropMap)) {
        if (q.includes(key)) { result.crop = value; break; }
    }

    // ---- Extract numeric filters (for actions) ----
    // Bigha / quantity: "2 बीघा", "3 bigha", "1.5"
    const bighaMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(?:बीघा|bigha|बीघे)/i);
    if (bighaMatch) result.filters.bigha = parseFloat(bighaMatch[1]);

    // Rate: "₹250", "250 रुपये", "250 rate", "250 में"
    const rateMatch = rawText.match(/(?:₹|rs\.?|rupees?|rate|में|per)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|rupees?|रुपये|रुपया|rate|प्रति)/i);
    if (rateMatch) result.filters.rate = parseFloat(rateMatch[1] || rateMatch[2]);

    // Hours: "2 घंटा", "3 hours", "1.5 hr"
    const hoursMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(?:घंटा|घंटे|hours?|hrs?)/i);
    if (hoursMatch) result.filters.hours = parseFloat(hoursMatch[1]);

    // Minutes: "30 मिनट", "15 minutes"
    const minMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(?:मिनट|minutes?|mins?)/i);
    if (minMatch) result.filters.minutes = parseFloat(minMatch[1]);

    // Unit (for spray): "10 लीटर", "5 units"
    const unitMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(?:लीटर|litre|liter|units?|unit|बोतल|bottle)/i);
    if (unitMatch) result.filters.unit = parseFloat(unitMatch[1]);

    // Paid: "₹500 जमा", "500 paid", "500 जमा"
    const paidMatch = rawText.match(/(?:₹|rs\.?|rupees?)?\s*(\d+(?:\.\d+)?)\s*(?:जमा|paid|deposit|दिया|diya)/i) ||
                      rawText.match(/(?:जमा|paid|deposit)\s*(\d+(?:\.\d+)?)/i);
    if (paidMatch) result.filters.paid = parseFloat(paidMatch[1]);

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
        // "पिछला काम" type — show most recent first
        if (parsed.questionType === "last") {
            const sorted = [...records].sort((a,b) => (b.date || "").localeCompare(a.date || ""));
            const recent = sorted[0];
            if (recent) {
                return (farmerList || "") + " का सबसे पिछला काम:\n"
                    + "📅 तारीख: " + (recent.date || "-") + "\n"
                    + "🚜 काम: " + (recent.work || "-") + "\n"
                    + (recent.crop ? "🌾 फसल: " + recent.crop + "\n" : "")
                    + "📏 मात्रा: " + (recent.bigha || recent.unit || "-") + "\n"
                    + "💰 कुल: ₹" + (recent.total || 0) + "\n"
                    + "💵 जमा: ₹" + (recent.paid || 0) + "\n"
                    + "❌ बाकी: ₹" + (recent.baki || recent.balance || (Number(recent.total||0) - Number(recent.paid||0)));
            }
            return "कोई रिकॉर्ड नहीं मिला।";
        }

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

    // DAILY SUMMARY
    if (parsed.intent === "DAILY_SUMMARY") {
        const todayStr = new Date().toISOString().split("T")[0];
        const todayRecords = records.filter(r => (r.date || "") === todayStr);
        if (!todayRecords.length) return "आज कोई entry नहीं है।";
        let tTotal = 0, tPaid = 0;
        todayRecords.forEach(r => { tTotal += Number(r.total||0); tPaid += Number(r.paid||0); });
        return "📊 आज का सारांश:\n📝 एंट्री: " + todayRecords.length + "\n💰 कुल: ₹" + tTotal + "\n💵 जमा: ₹" + tPaid + "\n❌ बाकी: ₹" + (tTotal - tPaid);
    }

    // MONTHLY SUMMARY
    if (parsed.intent === "MONTHLY_SUMMARY") {
        const now = new Date();
        const monthRecords = records.filter(r => {
            if (!r.date) return false;
            const d = new Date(r.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        if (!monthRecords.length) return "इस महीने कोई entry नहीं है।";
        let mTotal = 0, mPaid = 0;
        monthRecords.forEach(r => { mTotal += Number(r.total||0); mPaid += Number(r.paid||0); });
        const farmerCount = new Set(monthRecords.map(r => r.name || "")).size;
        return "📊 इस महीने का सारांश:\n📝 एंट्री: " + monthRecords.length + "\n👨‍🌾 किसान: " + farmerCount + "\n💰 कुल: ₹" + mTotal + "\n💵 जमा: ₹" + mPaid + "\n❌ बाकी: ₹" + (mTotal - mPaid);
    }

    // YEARLY SUMMARY
    if (parsed.intent === "YEARLY_SUMMARY") {
        const now = new Date();
        const yearRecords = records.filter(r => {
            if (!r.date) return false;
            return new Date(r.date).getFullYear() === now.getFullYear();
        });
        if (!yearRecords.length) return "इस साल कोई entry नहीं है।";
        let yTotal = 0, yPaid = 0;
        yearRecords.forEach(r => { yTotal += Number(r.total||0); yPaid += Number(r.paid||0); });
        const months = new Set(yearRecords.map(r => r.date ? r.date.substring(0,7) : "")).size;
        return "📊 इस साल का सारांश:\n📝 एंट्री: " + yearRecords.length + "\n📅 महीने: " + months + "\n💰 कुल: ₹" + yTotal + "\n💵 जमा: ₹" + yPaid + "\n❌ बाकी: ₹" + (yTotal - yPaid);
    }

    // EXPENSE intent
    if (parsed.intent === "EXPENSE" && parsed.farmer) {
        let exp = 0;
        records.forEach(r => { exp += Number(r.total || 0); });
        return farmerList + " का कुल खर्च/देनदारी ₹" + exp + " है।";
    }

    // COMPARE_INCOME_EXPENSE
    if (parsed.intent === "COMPARE_INCOME_EXPENSE") {
        let totalIncome = 0, totalPaid = 0;
        records.forEach(r => { totalIncome += Number(r.total||0); totalPaid += Number(r.paid||0); });
        const balance = totalIncome - totalPaid;
        return "📊 कमाई vs भुगतान तुलना:\n💰 कुल कमाई: ₹" + totalIncome + "\n✅ जमा: ₹" + totalPaid + "\n❌ बाकी: ₹" + balance + "\n📈 वसूली दर: " + (totalIncome > 0 ? Math.round((totalPaid/totalIncome)*100) : 0) + "%";
    }

    // HIGHEST_EARNER
    if (parsed.intent === "HIGHEST_EARNER") {
        const farmers = {};
        records.forEach(r => {
            const n = r.name || "अज्ञात";
            if (!farmers[n]) farmers[n] = 0;
            farmers[n] += Number(r.total || 0);
        });
        const sorted = Object.entries(farmers).sort((a,b) => b[1] - a[1]);
        if (sorted.length) {
            return sorted.map(([n,t], i) => (i+1) + ". " + n + ": ₹" + t.toLocaleString('en-IN')).join("\n");
        }
        return "कोई data नहीं मिला।";
    }

    // FARMER_COUNT
    if (parsed.intent === "FARMER_COUNT") {
        const uniqueFarmers = new Set(records.map(r => r.name || "").filter(Boolean));
        return "📊 कुल " + uniqueFarmers.size + " अलग-अलग किसान हैं।\n\nनाम: " + [...uniqueFarmers].join(", ");
    }

    // WEEKLY SUMMARY
    if (parsed.intent === "WEEKLY_SUMMARY") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekStr = weekAgo.toISOString().split("T")[0];
        const weekRecords = records.filter(r => (r.date || "") >= weekStr);
        if (!weekRecords.length) return "पिछले हफ्ते कोई entry नहीं है।";
        let wTotal = 0, wPaid = 0;
        weekRecords.forEach(r => { wTotal += Number(r.total||0); wPaid += Number(r.paid||0); });
        const wFarmers = new Set(weekRecords.map(r => r.name || "")).size;
        return "📊 पिछले हफ्ते का सारांश:\n📝 एंट्री: " + weekRecords.length + "\n👨‍🌾 किसान: " + wFarmers + "\n💰 कुल: ₹" + wTotal + "\n💵 जमा: ₹" + wPaid + "\n❌ बाकी: ₹" + (wTotal - wPaid);
    }

    // CALCULATE — local math
    if (parsed.intent === "CALCULATE") {
        const numMatch = (parsed.raw || "").match(/(\d+(?:\.\d+)?)\s*(?:बीघा|bigha|घंटे?|hours?|लीटर|litre|units?)?\s*(?:x|×|\*|गुणा|multiply)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)/i);
        if (numMatch) {
            const a = parseFloat(numMatch[1]);
            const b = parseFloat(numMatch[2]);
            return "💰 " + a + " × " + b + " = ₹" + (a * b).toLocaleString('en-IN');
        }
        const simpleMatch = (parsed.raw || "").match(/(\d+(?:\.\d+)?)\s*([+×x\-]\s*\d+(?:\.\d+)?)/i);
        if (simpleMatch) {
            try {
                const expr = simpleMatch[0].replace(/×/g,'*').replace(/x/gi,'*');
                const result_val = Function('return ' + expr)();
                return "💰 " + simpleMatch[0] + " = " + result_val.toLocaleString('en-IN');
            } catch(e) {}
        }
    }

    // HOW_TO — website help from knowledge base
    if (parsed.intent === "HOW_TO") {
        if (typeof WEBSITE_KNOWLEDGE !== 'undefined') {
            const qLower = (parsed.raw || "").toLowerCase();
            for (const [key, info] of Object.entries(WEBSITE_KNOWLEDGE.features)) {
                if (info.keywords.some(kw => qLower.includes(kw))) {
                    return info.answer;
                }
            }
        }
    }

    // CAPABILITIES
    if (parsed.intent === "CAPABILITIES") {
        if (typeof WEBSITE_KNOWLEDGE !== 'undefined') {
            return WEBSITE_KNOWLEDGE.general.greetingAnswer;
        }
    }

    // GREETING
    if (parsed.intent === "GREETING") {
        if (typeof WEBSITE_KNOWLEDGE !== 'undefined') {
            return WEBSITE_KNOWLEDGE.general.greetingAnswer;
        }
    }

    // EXPENSE intent
    if (parsed.intent === "EXPENSE" && parsed.farmer) {
        let exp = 0;
        records.forEach(r => { exp += Number(r.total || 0); });
        return farmerList + " का कुल खर्च/देनदारी ₹" + exp.toLocaleString('en-IN') + " है।";
    }

    // COMPARE_INCOME_EXPENSE
    if (parsed.intent === "COMPARE_INCOME_EXPENSE") {
        let totalIncome = 0, totalPaid = 0;
        records.forEach(r => { totalIncome += Number(r.total||0); totalPaid += Number(r.paid||0); });
        const balance = totalIncome - totalPaid;
        return "📊 कमाई vs भुगतान तुलना:\n💰 कुल कमाई: ₹" + totalIncome.toLocaleString('en-IN') + "\n✅ जमा: ₹" + totalPaid.toLocaleString('en-IN') + "\n❌ बाकी: ₹" + balance.toLocaleString('en-IN') + "\n📈 वसूली दर: " + (totalIncome > 0 ? Math.round((totalPaid/totalIncome)*100) : 0) + "%";
    }

    // AVERAGE per entry
    if (/average|औसत|ausat|per entry|prati entry/.test(parsed.raw || "")) {
        if (records.length > 0) {
            const avg = Math.round(total / records.length);
            return "📊 प्रति एंट्री औसत: ₹" + avg.toLocaleString('en-IN') + "\n📝 कुल एंट्री: " + records.length + "\n💰 कुल राशि: ₹" + total.toLocaleString('en-IN');
        }
    }

    // RECENT / LAST entry
    if (/recent|taza|taaza|aakhri|sabse nayi|abki|latest|last entry|pichli entry/.test(parsed.raw || "")) {
        if (records.length > 0) {
            const sorted = [...records].sort((a,b) => (b.date || "").localeCompare(a.date || ""));
            const latest = sorted[0];
            return "📅 सबसे ताज़ा entry:\n👨‍🌾 " + (latest.name || latest.farmer || "?") + "\n📅 " + (latest.date || "?") + "\n🚜 " + (latest.work || "?") + "\n💰 ₹" + (latest.total || 0) + (latest.paid ? "\n✅ जमा: ₹" + latest.paid : "");
        }
    }

    // HIGHEST_LOWEST
    if (parsed.intent === "HIGHEST_LOWEST") {
        if (/बाकी|balance|baki|udhar|pending|शेष/.test(parsed.raw)) {
            const sorted = [...records].sort((a,b) => {
                const ba = Number(a.baki || a.balance || (Number(a.total||0) - Number(a.paid||0)));
                const bb = Number(b.baki || b.balance || (Number(b.total||0) - Number(b.paid||0)));
                return bb - ba;
            });
            const top = sorted[0];
            const topBaki = Number(top.baki || top.balance || (Number(top.total||0) - Number(top.paid||0)));
            return "सबसे ज्यादा बाकी: " + (top.name || top.farmer || "अज्ञात") + " — ₹" + topBaki + " (कुल: ₹" + (top.total || 0) + ", जमा: ₹" + (top.paid || 0) + ")";
        }
        if (/कमाई|income|total|rashi|कुल|राशि/.test(parsed.raw)) {
            const sorted = [...records].sort((a,b) => Number(b.total||0) - Number(a.total||0));
            const top = sorted[0];
            return "सबसे ज्यादा कमाई: " + (top.name || top.farmer || "अज्ञात") + " — ₹" + (top.total || 0);
        }
        if (/जमा|paid|भुगतान|diya|दिया/.test(parsed.raw)) {
            const sorted = [...records].sort((a,b) => Number(b.paid||0) - Number(a.paid||0));
            const top = sorted[0];
            return "सबसे ज्यादा जमा: " + (top.name || top.farmer || "अज्ञात") + " — ₹" + (top.paid || 0);
        }
        // Generic highest
        const sorted = [...records].sort((a,b) => Number(b.total||0) - Number(a.total||0));
        const top = sorted[0];
        return "सबसे ज्यादा: " + (top.name || top.farmer || "अज्ञात") + " — ₹" + (top.total || 0) + " (" + (top.work || "") + ", " + (top.date || "") + ")";
    }

    // COMPARISON — compare two farmers
    if (parsed.intent === "COMPARISON") {
        const farmers = {};
        records.forEach(r => {
            const name = r.name || "अज्ञात";
            if (!farmers[name]) farmers[name] = { count: 0, total: 0, paid: 0, baki: 0 };
            farmers[name].count++;
            farmers[name].total += Number(r.total || 0);
            farmers[name].paid += Number(r.paid || 0);
            farmers[name].baki += Number(r.baki || r.balance || (Number(r.total||0) - Number(r.paid||0)));
        });
        const names = Object.keys(farmers);
        if (names.length < 2) {
            return names.length ? names[0] + " के " + records.length + " रिकॉर्ड मिले।" : "तुलना के लिए कम से कम दो किसान चाहिए।";
        }
        let reply = "तुलना:\n\n";
        names.forEach(n => {
            const f = farmers[n];
            reply += "👨‍🌾 " + n + ": " + f.count + " एंट्री | कुल: ₹" + f.total + " | जमा: ₹" + f.paid + " | बाकी: ₹" + f.baki + "\n";
        });
        return reply.trim();
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
// ACTION REQUEST PROCESSOR
// Detects if parsed intent is an action, builds confirmation
// ==========================================

function processActionRequest(parsed, filteredRecords) {
    const intent = parsed.intent;
    if (!intent || !intent.startsWith("ACTION_")) return null;

    const farmer = parsed.farmer || (window.RAJ_AI.munshi.context.farmer);
    const ctx = window.RAJ_AI.munshi.context;

    switch (intent) {
        case "ACTION_ADD_RECORD": {
            if (!farmer) return { message: "किस किसान के लिए entry बनानी है? किसान का नाम बताएं।" };
            const data = {
                action: "ADD_RECORD",
                farmer: farmer,
                date: parsed.date || new Date().toISOString().split("T")[0],
                work: parsed.work || "",
                crop: parsed.crop || "",
                bigha: parsed.filters.bigha || 0,
                rate: parsed.filters.rate || 0,
                paid: parsed.filters.paid || 0,
                hours: parsed.filters.hours || 0,
                minutes: parsed.filters.minutes || 0,
            };
            // Calculate total locally using existing rules
            let total = 0;
            if (data.work === "Thresher" && data.crop === "Bajra") {
                total = data.bigha * data.rate;
            } else if (data.work === "Thresher") {
                total = (data.hours + (data.minutes || 0) / 60) * data.rate;
            } else if (data.work === "Spray Machine") {
                total = (parsed.filters.unit || 0) * data.rate;
            } else if (data.work === "Pending Balance") {
                total = data.rate;
            } else {
                total = data.bigha * data.rate;
            }
            data.total = total;
            data.balance = total - data.paid;

            return {
                action: true,
                type: "ADD_RECORD",
                confirmation: true,
                message: `नई entry बनाने वाला हूँ:\n\n👨‍🌾 किसान: ${data.farmer}\n📅 तारीख: ${data.date}\n🚜 काम: ${data.work || "(नहीं बताया)"}` + (data.crop ? `\n🌾 फसल: ${data.crop}` : "") + `\n📏 मात्रा: ${data.bigha}\n💰 Rate: ₹${data.rate}\n💵 कुल: ₹${data.total}` + (data.paid ? `\n✅ जमा: ₹${data.paid}` : "") + (data.balance > 0 ? `\n❌ बाकी: ₹${data.balance}` : "") + `\n\nक्या इसे save कर दूँ?`,
                data: data
            };
        }

        case "ACTION_ADD_PAYMENT": {
            if (!farmer) return { message: "किस किसान का payment जमा करना है? किसान का नाम बताएं।" };
            // Extract amount from question
            const amtMatch = (parsed.raw || "").match(/(\d+)/);
            const amount = amtMatch ? Number(amtMatch[1]) : 0;
            if (amount <= 0) return { message: "कितने रुपये जमा करने हैं? राशि बताएं।" };

            // Find most recent record for this farmer
            const farmerRecords = filteredRecords.length ? filteredRecords : (window.records || []).filter(r => {
                const fn = (farmer || "").trim().toLowerCase();
                return (r.name || r.farmer || "").trim().toLowerCase() === fn;
            });
            const targetRecord = farmerRecords.length ? farmerRecords[farmerRecords.length - 1] : null;

            return {
                action: true,
                type: "ADD_PAYMENT",
                confirmation: true,
                message: `${farmer} को ₹${amount} जमा कर रहा हूँ।` + (targetRecord ? `\n📋 Record: ${targetRecord.date || ""} ${targetRecord.work || ""} (कुल ₹${targetRecord.total || 0})` : "") + `\n\nक्या इसे save कर दूँ?`,
                data: { action: "ADD_PAYMENT", farmer: farmer, amount: amount, recordId: targetRecord ? targetRecord.id : null }
            };
        }

        case "ACTION_DELETE_RECORD": {
            if (!farmer) return { message: "किस किसान की entry हटानी है? किसान का नाम बताएं।" };
            return {
                action: true,
                type: "DELETE_RECORD",
                confirmation: true,
                message: `⚠️ ${farmer} की entry हटाने वाला हूँ।\n\nयह action undo नहीं हो सकता।\n\nक्या आप सुनिश्चित हैं?`,
                data: { action: "DELETE_RECORD", farmer: farmer }
            };
        }

        case "ACTION_UPDATE_RECORD": {
            if (!farmer) return { message: "किस किसान की entry बदलनी है? किसान का नाम बताएं।" };
            return {
                action: true,
                type: "UPDATE_RECORD",
                confirmation: true,
                message: `${farmer} की entry बदलनी है।\nकौन सी जानकारी बदलनी है? (तारीख, काम, रेट, जमा आदि)`,
                data: { action: "UPDATE_RECORD", farmer: farmer, updates: {} }
            };
        }

        case "ACTION_WHATSAPP": {
            if (!farmer) return { message: "किस किसान को WhatsApp भेजना है?" };
            const farmerRecords = filteredRecords.length ? filteredRecords : (window.records || []).filter(r => {
                const fn = (farmer || "").trim().toLowerCase();
                return (r.name || r.farmer || "").trim().toLowerCase() === fn;
            });
            let total = 0, paid = 0;
            farmerRecords.forEach(r => { total += Number(r.total || 0); paid += Number(r.paid || 0); });
            const balance = total - paid;
            const mobile = farmerRecords.length ? (farmerRecords[0].mobile || "") : "";

            const msg = `राम-राम जी 🙏\n\nछपोला एग्रीकल्चर — हिसाब विवरण\n\n👨‍🌾 किसान: ${farmer}\n💰 कुल राशि: ₹${total}\n✅ जमा: ₹${paid}\n❌ बाकी: ₹${balance}\n\nधन्यवाद!\n— Chhapola Agriculture`;

            return {
                action: true,
                type: "WHATSAPP",
                confirmation: true,
                message: `${farmer} को यह संदेश WhatsApp पर भेजना है:\n\n${msg}\n\n${mobile ? "📱 मोबाइल: " + mobile : "⚠️ मोबाइल नंबर उपलब्ध नहीं है।"}\n\nभेजें?`,
                data: { action: "WHATSAPP", farmer: farmer, mobile: mobile, message: msg, total: total, paid: paid, balance: balance }
            };
        }

        case "ACTION_PDF": {
            if (!farmer) return { message: "किस किसान का PDF बनाना है?" };
            return {
                action: true,
                type: "PDF",
                confirmation: true,
                message: `${farmer} का PDF बना रहा हूँ।\n\nक्या PDF download कर दूँ?`,
                data: { action: "PDF", farmer: farmer }
            };
        }

        default:
            return null;
    }
}

window.processActionRequest = processActionRequest;

// ==========================================
// CONFIRM ACTION EXECUTOR
// Executes confirmed actions using existing action module
// ==========================================

async function confirmAction(actionData) {
    if (!actionData || !actionData.action) return "अमान्य action।";

    const user = window.auth ? window.auth.currentUser : null;
    if (!user) return "❌ Login required है।";

    try {
        switch (actionData.action) {
            case "ADD_RECORD": {
                // Use existing saveEntry from Script.js
                if (typeof saveEntry === "function") {
                    await saveEntry({
                        name: actionData.farmer,
                        date: actionData.date,
                        work: actionData.work,
                        crop: actionData.crop,
                        bigha: actionData.bigha,
                        rate: actionData.rate,
                        paid: actionData.paid,
                        total: actionData.total,
                        baki: actionData.balance,
                        time: actionData.hours ? actionData.hours + " घंटा" + (actionData.minutes ? " " + actionData.minutes + " मिनट" : "") : "",
                        unit: actionData.unit || 0
                    });
                    // Refresh records
                    if (typeof show === "function") await show();
                    if (typeof refreshRajMemory === "function") await refreshRajMemory();
                    return `✅ ${actionData.farmer} की entry save हो गई!\n💰 कुल: ₹${actionData.total}` + (actionData.balance > 0 ? `\n❌ बाकी: ₹${actionData.balance}` : " (चुकता)");
                }
                return "⚠️ saveEntry function उपलब्ध नहीं है।";
            }

            case "ADD_PAYMENT": {
                if (actionData.recordId && typeof updateEntry === "function") {
                    const existingRecord = (window.records || []).find(r => r.id === actionData.recordId);
                    if (existingRecord) {
                        const newPaid = Number(existingRecord.paid || 0) + actionData.amount;
                        const newBalance = Number(existingRecord.total || 0) - newPaid;
                        await updateEntry(actionData.recordId, { paid: newPaid, baki: newBalance });
                        if (typeof show === "function") await show();
                        if (typeof refreshRajMemory === "function") await refreshRajMemory();
                        return `✅ ${actionData.farmer} को ₹${actionData.amount} जमा हो गया!\n💵 नया जमा: ₹${newPaid}\n❌ बाकी: ₹${newBalance}`;
                    }
                }
                // If no specific record, find latest and update
                const farmerRecords = (window.records || []).filter(r => {
                    const fn = (actionData.farmer || "").trim().toLowerCase();
                    return (r.name || r.farmer || "").trim().toLowerCase() === fn;
                });
                if (farmerRecords.length && typeof updateEntry === "function") {
                    const last = farmerRecords[farmerRecords.length - 1];
                    const newPaid = Number(last.paid || 0) + actionData.amount;
                    const newBalance = Number(last.total || 0) - newPaid;
                    await updateEntry(last.id, { paid: newPaid, baki: newBalance });
                    if (typeof show === "function") await show();
                    if (typeof refreshRajMemory === "function") await refreshRajMemory();
                    return `✅ ${actionData.farmer} को ₹${actionData.amount} जमा हो गया!\n📋 Record: ${last.date} ${last.work}\n❌ बाकी: ₹${newBalance}`;
                }
                return "⚠️ कोई matching record नहीं मिला।";
            }

            case "DELETE_RECORD": {
                // Soft delete latest record for this farmer
                const farmerRecords = (window.records || []).filter(r => {
                    const fn = (actionData.farmer || "").trim().toLowerCase();
                    return (r.name || r.farmer || "").trim().toLowerCase() === fn;
                });
                if (farmerRecords.length && typeof deleteEntry === "function") {
                    const last = farmerRecords[farmerRecords.length - 1];
                    await deleteEntry(last.id);
                    if (typeof show === "function") await show();
                    if (typeof refreshRajMemory === "function") await refreshRajMemory();
                    return `✅ ${actionData.farmer} की entry (${last.date} ${last.work}) हटा दी गई।`;
                }
                return "⚠️ हटाने के लिए कोई record नहीं मिला।";
            }

            case "UPDATE_RECORD": {
                return `📝 ${actionData.farmer} की entry update करने के लिए:\n📋 Table में जाकर ✏️ Edit बटन दबाएं।\nया बताएं क्या बदलना है (तारीख, काम, रेट, जमा)।`;
            }

            case "WHATSAPP": {
                if (actionData.mobile) {
                    const cleanMobile = actionData.mobile.replace(/[^0-9]/g, "");
                    const encodedMsg = encodeURIComponent(actionData.message);
                    window.open(`https://wa.me/91${cleanMobile}?text=${encodedMsg}`, "_blank");
                    return `✅ WhatsApp खुल रहा है!\n📱 ${actionData.farmer} (${actionData.mobile})`;
                }
                // Fallback: copy to clipboard
                try {
                    await navigator.clipboard.writeText(actionData.message);
                    return `⚠️ मोबाइल नंबर उपलब्ध नहीं है।\n📝 संदेश clipboard पर copy हो गया।\n手动 WhatsApp में paste करें।`;
                } catch(e) {
                    return `⚠️ मोबाइल नंबर उपलब्ध नहीं है।\n\n${actionData.message}`;
                }
            }

            case "PDF": {
                // Trigger existing PDF generation
                if (typeof createPDF === "function") {
                    const farmerRecords = (window.records || []).filter(r => {
                        const fn = (actionData.farmer || "").trim().toLowerCase();
                        return (r.name || r.farmer || "").trim().toLowerCase() === fn;
                    });
                    if (farmerRecords.length) {
                        await createPDF(farmerRecords);
                        return `✅ ${actionData.farmer} का PDF बन रहा है!`;
                    }
                    return `⚠️ ${actionData.farmer} का कोई record नहीं मिला।`;
                }
                return "⚠️ PDF function उपलब्ध नहीं है।";
            }

            default:
                return "⚠️ अज्ञात action।";
        }
    } catch(e) {
        console.error("Action execution error:", e);
        return `❌ Action में समस्या हुई: ${e.message}`;
    }
}

window.confirmAction = confirmAction;

// ==========================================
// PART 15
// SMART RECORD SEARCH
// ==========================================

function normalizeText(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^\u0900-\u097fa-z0-9]/g, "");
}
window.normalizeText = normalizeText;

function resolveQuestionContext(question) {
    const farmer = getCurrentFarmer();
    if (!farmer) return question;
    let q = question;
    q = q.replace(/\b(उसका|उसके|उसने|वो|वह|इस किसान|उस किसान|उसमें|उससे|उसकी|उसी)\b/gi, farmer);
    return q;
}

async function askMunshi(question) {
    question = resolveQuestionContext(question);

    // ==========================================
    // RAJ AI DIAGNOSTIC COMMAND
    // ==========================================
    if (!/system.*check|diagnostic|diagnose|सिस्टम.*चेक|सिस्टम.*जांच|मॉड्यूल.*चेक|module.*check/i.test(String(question))) {
        window.RAJ_AI.munshi.context.lastQuestion = question;
    }
    const diagnosticText = String(question || "").toLowerCase().trim();

    if (/system.*check|diagnostic|diagnose|सिस्टम.*चेक|सिस्टम.*जांच|सिस्टम.*जाँच|मॉड्यूल.*चेक|module.*check/.test(diagnosticText)) {
        if (typeof getRAIAIDiagnosticReport === "function") {
            return { success: true, source: "diagnostic", reply: getRAIAIDiagnosticReport(), records: [] };
        }
    }

    const result = { success: false, source: null, reply: "", records: [] };

    // Save Context
    window.RAJ_AI = window.RAJ_AI || {};
    window.RAJ_AI.munshi = window.RAJ_AI.munshi || {};
    window.RAJ_AI.munshi.lastQuestion = question;

    // ==========================================
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
            updateMunshiContext(question, result.records || []);
            return result;
        }
    }

    // 2. Analysis
    if (typeof analyzeQuestion === "function") {
        try {
            const r = await analyzeQuestion(question);
            if (r) {
                result.success = true;
                result.source = "analysis";
                result.reply = r;
                return result;
            }
        } catch(e) {}
    }

    // 3. Brain — now returns reply via smartReply
    if (typeof think === "function") {
        try {
            const r = await think(question);
            if (r && (r.reply || (r.records && r.records.length))) {
                result.success = true;
                result.source = "brain";
                if (r.reply) result.reply = r.reply;
                if (r.records && r.records.length) result.records = r.records;
                updateMunshiContext(question, result.records || []);
                return result;
            }
        } catch(e) {}
    }

    // 4. Core
    if (typeof processRajRequest === "function") {
        try {
            const coreResult = await processRajRequest(question);
            if (coreResult && coreResult.success) {
                result.success = true;
                result.source = "core";
                if (coreResult.reply) result.reply = coreResult.reply;
                if (coreResult.records) result.records = coreResult.records;
                return result;
            }
        } catch(e) {
            console.error(e);
        }
    }

    // 5. Website Knowledge Base (how-to, capabilities)
    const wikiIntent = parseQuestion ? parseQuestion(question) : {};
    if (wikiIntent.intent === "HOW_TO" || wikiIntent.intent === "CAPABILITIES") {
        if (typeof WEBSITE_KNOWLEDGE !== 'undefined') {
            const qLower = question.toLowerCase();
            let found = false;
            for (const [key, info] of Object.entries(WEBSITE_KNOWLEDGE.features)) {
                if (info.keywords.some(kw => qLower.includes(kw))) {
                    result.success = true;
                    result.source = "knowledge";
                    result.reply = info.answer;
                    return result;
                }
            }
            // General capabilities
            if (qLower.match(/क्या कर सकते|what can you|capabilities|क्या क्या करो/)) {
                result.success = true;
                result.source = "knowledge";
                result.reply = WEBSITE_KNOWLEDGE.general.greetingAnswer;
                return result;
            }
        }
    }

    // 5b. Greeting detection
    if (typeof WEBSITE_KNOWLEDGE !== 'undefined') {
        const qLower = question.toLowerCase();
        if (WEBSITE_KNOWLEDGE.general.greeting.some(g => qLower.includes(g))) {
            result.success = true;
            result.source = "knowledge";
            result.reply = WEBSITE_KNOWLEDGE.general.greetingAnswer;
            return result;
        }
    }

    // 5c. CALCULATE intent — do local math
    if (wikiIntent.intent === "CALCULATE") {
        const numMatch = question.match(/(\d+(?:\.\d+)?)\s*(?:बीघा|bigha|घंटे?|hours?|लीटर|litre|units?)?\s*(?:x|×|\*)\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d+)?)/i);
        if (numMatch) {
            const a = parseFloat(numMatch[1]);
            const b = parseFloat(numMatch[2]);
            const product = a * b;
            result.success = true;
            result.source = "local";
            result.reply = `💰 ${numMatch[0]} = ₹${product.toLocaleString('en-IN')}`;
            return result;
        }
        // Simple calculation: 2 + 3, 100 x 250, etc.
        const simpleMatch = question.match(/(\d+(?:\.\d+)?)\s*([+×x\-]\s*\d+(?:\.\d+)?)/i);
        if (simpleMatch) {
            try {
                const expr = simpleMatch[0].replace(/×/g,'*').replace(/x/gi,'*');
                const result_val = Function('return ' + expr)();
                result.success = true;
                result.source = "local";
                result.reply = `💰 ${simpleMatch[0]} = ${result_val.toLocaleString('en-IN')}`;
                return result;
            } catch(e) {}
        }
    }

    // 6. Gemini fallback
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

// Duplicate request protection
let _geminiInFlight = null;

async function callGeminiAPI(prompt, imageBase64 = null) {
    const BACKEND_URL = "https://tector-chhapola.onrender.com/api/chat";
    const body = { prompt: prompt || "" };

    if (imageBase64) {
        let raw = imageBase64;
        let mimeType = "image/jpeg";
        if (typeof raw === "string" && raw.startsWith("data:")) {
            const match = raw.match(/^data:([^;]+);/);
            if (match) mimeType = match[1];
        }
        body.image = raw;
        body.mime_type = mimeType;
    }

    // Prevent duplicate in-flight requests with same prompt
    const dedupKey = (body.prompt || "").substring(0, 100);
    if (_geminiInFlight === dedupKey) {
        console.log("[AI] Duplicate Gemini request blocked");
        throw new Error("DUPLICATE_REQUEST");
    }
    _geminiInFlight = dedupKey;

    const headers = { "Content-Type": "application/json" };
    try {
        if (window.auth && window.auth.currentUser) {
            const idToken = await window.auth.currentUser.getIdToken();
            if (idToken) headers["Authorization"] = "Bearer " + idToken;
        }
    } catch (e) {}

    try {
        const controller = new AbortController();
        // Adaptive timeout: 180s for images (scanner), 60s for text (chat)
        const _timeoutMs = imageBase64 ? 180000 : 60000;
        const timeoutId = setTimeout(() => controller.abort(), _timeoutMs);

        const response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.detail || `Backend error: ${response.status}`;
            if (response.status === 429 || response.status === 502) {
                throw new Error("RATE_LIMITED: " + errMsg);
            }
            throw new Error(errMsg);
        }

        return await response.json();
    } finally {
        _geminiInFlight = null;
    }
}

window.callGeminiAPI = callGeminiAPI;

// ==========================================
// GROQ API (PRIMARY AI - llama-3.1-8b-instant)
// ==========================================
let _groqInFlight = null;

async function callGroqAPI(prompt) {
    const GROQ_BACKEND_URL = "https://tector-chhapola.onrender.com/api/groq-chat";
    const body = { prompt: prompt || "" };

    const dedupKey = (body.prompt || "").substring(0, 100);
    if (_groqInFlight === dedupKey) {
        console.log("[AI] Duplicate Groq request blocked");
        throw new Error("DUPLICATE_REQUEST");
    }
    _groqInFlight = dedupKey;

    const headers = { "Content-Type": "application/json" };
    try {
        if (window.auth && window.auth.currentUser) {
            const idToken = await window.auth.currentUser.getIdToken();
            if (idToken) headers["Authorization"] = "Bearer " + idToken;
        }
    } catch (e) {}

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(GROQ_BACKEND_URL, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.detail || `Groq backend error: ${response.status}`;
            if (response.status === 429 || response.status === 502) {
                throw new Error("RATE_LIMITED: " + errMsg);
            }
            throw new Error(errMsg);
        }

        return await response.json();
    } finally {
        _groqInFlight = null;
    }
}

window.callGroqAPI = callGroqAPI;


// ==========================================
// HANDLE SEND — SINGLE UNIFIED PIPELINE
// ==========================================
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
    // STEP 1: LANGUAGE PREPROCESSING
    // ==========================================
    let processedText = text;
    if (typeof understandLanguage === "function") {
        try { processedText = understandLanguage(text) || text; } catch(e) {}
    }

    // ==========================================
    // STEP 2: PARSE QUESTION
    // ==========================================
    let parsed = { intent: "GENERAL", farmer: null, date: null, dateRange: null, work: null, crop: null, raw: text, questionType: null, filters: {} };
    try {
        if (typeof parseQuestion === "function") {
            parsed = parseQuestion(text);
        }
    } catch(e) { console.log("parseQuestion error:", e); }

    // ==========================================
    // STEP 2.5: ACTION INTENT HANDLING
    // ==========================================
    if (parsed.intent && parsed.intent.startsWith("ACTION_")) {
        // Do farmer search first so processActionRequest has records
        let actionFarmerRecords = [];
        try {
            if (parsed.farmer && typeof window.records === "object" && window.records && window.records.length) {
                const fn = parsed.farmer.trim().toLowerCase();
                actionFarmerRecords = window.records.filter(r => {
                    const name = (r.name || r.farmer || "").trim().toLowerCase();
                    return name === fn;
                });
            }
            if (!actionFarmerRecords.length && typeof searchFarmerRecords === "function") {
                actionFarmerRecords = searchFarmerRecords(parsed.farmer || text) || [];
            }
        } catch(e) {}

        const actionResult = typeof processActionRequest === "function"
            ? processActionRequest(parsed, actionFarmerRecords) : null;

        if (actionResult) {
            loadingDiv.remove();

            // If action needs more info (no farmer found, no amount, etc.)
            if (actionResult.message && !actionResult.confirmation) {
                appendMessage(actionResult.message, "ai");
                isRequestPending = false;
                return;
            }

            // Show confirmation with buttons
            if (actionResult.confirmation && actionResult.data) {
                window._pendingActionData = actionResult.data;
                const msgDiv = appendMessage(actionResult.message, "ai");

                // Create confirmation buttons
                const btnRow = document.createElement("div");
                btnRow.style.cssText = "display:flex;gap:8px;margin:8px 0;flex-wrap:wrap;";

                const saveBtn = document.createElement("button");
                saveBtn.textContent = "✅ Save";
                saveBtn.style.cssText = "flex:1;min-width:100px;padding:10px 16px;border:none;border-radius:8px;background:#16a34a;color:white;font-size:14px;font-weight:600;cursor:pointer;";
                saveBtn.onclick = async function() {
                    saveBtn.disabled = true;
                    cancelBtn.disabled = true;
                    saveBtn.textContent = "⏳ Saving...";
                    try {
                        if (typeof confirmAction === "function") {
                            const result = await confirmAction(window._pendingActionData);
                            appendMessage(result || "✅ Done!", "ai");
                        }
                    } catch(e) {
                        appendMessage("❌ Error: " + e.message, "ai");
                    }
                    window._pendingActionData = null;
                    btnRow.remove();
                };

                const cancelBtn = document.createElement("button");
                cancelBtn.textContent = "❌ Cancel";
                cancelBtn.style.cssText = "flex:1;min-width:100px;padding:10px 16px;border:none;border-radius:8px;background:#dc2626;color:white;font-size:14px;font-weight:600;cursor:pointer;";
                cancelBtn.onclick = function() {
                    window._pendingActionData = null;
                    btnRow.remove();
                    appendMessage("❌ Cancel कर दिया गया।", "ai");
                };

                btnRow.appendChild(saveBtn);
                btnRow.appendChild(cancelBtn);
                if (msgDiv && msgDiv.parentNode) {
                    msgDiv.parentNode.insertBefore(btnRow, msgDiv.nextSibling);
                } else {
                    messagesContainer.appendChild(btnRow);
                }

                isRequestPending = false;
                return;
            }

            // Action with direct result (no confirmation needed)
            if (actionResult.message) {
                appendMessage(actionResult.message, "ai");
            }
            isRequestPending = false;
            return;
        }
    }

    // ==========================================
    // STEP 3: SMART FARMER SEARCH
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
    // STEP 4: TRY LOCAL AI (askMunshi)
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
        // Use brain's records if they exist
        filteredRecords = munshiResult.records;
        foundInLocal = false; // Let buildLocalAnswer handle it
    }

    // ==========================================
    // STEP 5: TRY LOCAL ANSWER BUILDER
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
// STEP 5.5: CATCH-ALL LOCAL HANDLER
// Try to answer from data before Gemini
// ==========================================
try {
    if (typeof catchAllLocalAnswer === "function") {
        const catchAllReply = catchAllLocalAnswer(text);
        if (catchAllReply) {
            loadingDiv.remove();
            aiCache.set(cleanTextKey, catchAllReply);
            appendMessage(catchAllReply, "ai");
            speakText(catchAllReply);
            isRequestPending = false;
            return;
        }
    }
} catch(e) { console.log("catchAll error:", e); }

// ==========================================
// STEP 5.6: KNOWLEDGE-BASE ANSWER (non-HOW_TO questions)
// Try to match question to website knowledge even if intent wasn't HOW_TO
// ==========================================
try {
    if (typeof WEBSITE_KNOWLEDGE !== 'undefined') {
        const qLower = text.toLowerCase();
        for (const [key, info] of Object.entries(WEBSITE_KNOWLEDGE.features)) {
            if (info.keywords.some(kw => qLower.includes(kw))) {
                if (!filteredRecords.length || /kya kya|\u0915\u094d\u092f\u093e \u0915\u094d\u092f\u093e|kaise|\u0915\u0948\u0938\u0947|kahan|\u0915\u0939\u093e\u0901|eske.*kam|uske.*kam/.test(qLower)) {
                    loadingDiv.remove();
                    aiCache.set(cleanTextKey, info.answer);
                    appendMessage(info.answer, "ai");
                    speakText(info.answer);
                    isRequestPending = false;
                    return;
                }
            }
        }
    }
} catch(e) {}

// ==========================================
// STEP 6: GEMINI FALLBACK
// ==========================================
// Build a smarter, shorter prompt for Gemini
// Add Phase 2/3 data to Gemini context
(async () => {
    try {
        if (typeof loadPhase2Data === 'function') {
            const p2 = await loadPhase2Data();
            if (p2.tractor || p2.services.length || p2.diesel.length) {
                let p2Info = "\n\nTRACTOR DATA:\n";
                if (p2.tractor) p2Info += "Tractor: " + (p2.tractor.company||"") + " " + (p2.tractor.model||"") + "\n";
                if (p2.services.length) p2Info += "Services: " + p2.services.slice(0,3).map(s=>s.type+" "+s.date+" ₹"+s.totalCost).join(", ") + "\n";
                if (p2.diesel.length) p2Info += "Diesel: " + p2.diesel.slice(0,3).map(d=>d.quantity+"L on "+d.date+" ₹"+(d.totalCost||d.quantity*d.rate)).join(", ") + "\n";
                window._phase2Context = p2Info;
            }
        }
    } catch(e) {};
})();

const geminiContext = filteredRecords.length > 0
    ? JSON.stringify(filteredRecords.slice(0, 15), null, 2) + (window._phase2Context || "")
    : "No verified records found locally.\nFor general questions, answer based on your knowledge of Indian agriculture and tractor operations.";

const fullPrompt = `You are AI Munshi 3.0 of Chhapola Agriculture.

Always answer in natural, clear Hindi.
Use only the verified farmer records provided below.
Never invent or guess any data.

USER QUERY:
"${text}"

INTENT: ${parsed.intent}
${parsed.farmer ? "FARMER: " + parsed.farmer : ""}
${parsed.date ? "DATE: " + parsed.date : ""}
${parsed.dateRange ? "DATE RANGE: " + parsed.dateRange.from + " to " + parsed.dateRange.to : ""}
${parsed.work ? "WORK TYPE: " + parsed.work : ""}
${parsed.crop ? "CROP: " + parsed.crop : ""}

VERIFIED FARMER RECORDS:
${geminiContext}

RULES:
1. Understand what the user is actually asking.
2. Answer only the question asked.
3. Hindi, Marwadi and English farmer names should be treated as equivalent.
4. Ignore small spelling and pronunciation differences.
5. For हिसाब questions, calculate Total, Paid and Balance accurately.
6. Balance = Total - Paid.
7. Do not use records belonging to another farmer.
8. If no matching record exists, say: "राम-राम जी, इस किसान का रिकॉर्ड नहीं मिला।"
9. Keep the answer natural and concise.
`;
    try {
        // ============ STEP 6a: TRY GROQ FIRST (primary AI) ============
        let groqSuccess = false;
        try {
            const groqData = await callGroqAPI(fullPrompt);
            if (groqData && groqData.candidates && groqData.candidates[0] && groqData.candidates[0].content && groqData.candidates[0].content.parts) {
                const aiAnswer = groqData.candidates[0].content.parts[0].text.trim();
                if (aiAnswer) {
                    loadingDiv.remove();
                    aiCache.set(cleanTextKey, aiAnswer);
                    appendMessage(aiAnswer, "ai");
                    speakText(aiAnswer);
                    groqSuccess = true;
                }
            }
        } catch (groqErr) {
            console.log("[AI] Groq failed, falling back to Gemini:", groqErr.message || groqErr);
        }

        // ============ STEP 6b: GEMINI FALLBACK (if Groq failed) ============
        if (!groqSuccess) {
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
        }
    } catch (err) {
        loadingDiv.remove();
        console.error("Fetch Error:", err);
        const errMsg = err.message || "";
        if (errMsg.includes("502") || errMsg.includes("high demand") || errMsg.includes("overloaded")) {
            // If we have filtered records, give local answer instead of failing
            if (filteredRecords.length > 0 && typeof buildLocalAnswer === "function") {
                try {
                    const fallbackReply = buildLocalAnswer(parsed, filteredRecords);
                    if (fallbackReply) {
                        appendMessage(fallbackReply, "ai");
                        speakText(fallbackReply);
                        isRequestPending = false;
                        return;
                    }
                } catch(e2) {}
            }
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
