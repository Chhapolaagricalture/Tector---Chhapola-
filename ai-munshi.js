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
            if (matches > phoneticScore) {
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
    const isFollowUp = /उसका|उसने|उसके|उसकी|वो|वह|उसमें|उससे|उसी|ऐसा|वैसा|उस किसान|इस किसान/.test(q);

    if (isFollowUp && !result.farmer && ctx.farmer) {
        result.farmer = ctx.farmer;
    }
    if (isFollowUp && !result.date && ctx.lastDate) {
        // Only use last date if question is truly about date
        if (/तारीख|date|दिन|तारीख|दिनांक/.test(q)) {
            result.date = ctx.lastDate;
        }
    }

    // ---- Detect intent (priority order matters) ----

    // Full ledger / history
    if (/पूरा\s*(हिसाब|record|history|ledger|data)|full.*(ledger|history|record)|हिसाब.*(बता|दे|निकाल)|ledger|history|पूरे?\s*(का|की|के)/.test(q)) {
        result.intent = "LEDGER";
    }
    // Comparison
    else if (/तुलना|compare|vs|बनाम|मुकाबले|मिलाओ|मिला/.test(q)) {
        result.intent = "COMPARISON";
    }
    // Highest/lowest
    else if (/सबसे|highest|maximum|most|lowest|minimum|least|ज्यादा|कम/.test(q)) {
        result.intent = "HIGHEST_LOWEST";
    }
    // Count
    else if (/कितने|count|संख्या|कितना/.test(q) && /किसान|record|entry|एंट्री|काम|दिन/.test(q)) {
        result.intent = "COUNT";
    }
    // Balance / baki
    else if (/बाकी|balance|baki|bakaya|उधार|pending|शेष/.test(q)) {
        result.intent = "BALANCE";
    }
    // Paid / paid
    else if (/जमा|paid|diya|दिया|भुगतान|payment|pay/.test(q)) {
        result.intent = "PAID";
    }
    // Income / total
    else if (/कुल|income|कमाई|total|rashi|राशि|earn|kamaya|कमाया|आय/.test(q)) {
        result.intent = "INCOME";
    }
    // Crop
    else if (/फसल|crop|bajra|बाजरा|gehun|गेहूं|wheat|chana|चना|guar|ग्वार/.test(q)) {
        result.intent = "CROP";
    }
    // Work type
    else if (/काम|work|hero|हीरो|calti|कल्टी|cultivator|thresher|थ्रेसर|morplau|मोरप्लाउ|display|spray|दवाई|rotavator/.test(q)) {
        result.intent = "WORK";
    }
    // Summary
    else if (/summary|सारांश|brief|संक्षिप्त|short|समरी/.test(q)) {
        result.intent = "SUMMARY";
    }
    // Payment history / pending
    else if (/पेमेंट|payment.*history|कितना.*दिया|कितना.*जमा|पैसा|payment/.test(q)) {
        result.intent = "PAID";
    }
    // Farmer list
    else if (/कौन|किसका|किसके|किन|किसान.*list|farmer.*list|कौन.*किसान/.test(q) && !result.farmer) {
        result.intent = "COUNT";
    }
    // Specific question types: "क्या किया", "क्या करवाया", "कब", "पिछला काम"
    else if (/क्या.*(किया|करवाया|हुआ|था|करा|करवा)|कब|क्या है|बताओ|बता|निकाल/.test(q) && result.farmer) {
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

    // 5. Gemini fallback
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

    const headers = { "Content-Type": "application/json" };
    try {
        if (window.auth && window.auth.currentUser) {
            const idToken = await window.auth.currentUser.getIdToken();
            if (idToken) headers["Authorization"] = "Bearer " + idToken;
        }
    } catch (e) {}

    const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Backend error: ${response.status}`);
    }

    return await response.json();
}

window.callGeminiAPI = callGeminiAPI;

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
// STEP 6: GEMINI FALLBACK
// ==========================================
// Build a smarter, shorter prompt for Gemini
const geminiContext = filteredRecords.length > 0
    ? JSON.stringify(filteredRecords.slice(0, 30), null, 2)  // Limit to 30 records
    : "No verified records found locally.";

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
