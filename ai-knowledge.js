// ==========================================
// AI MUNSHI — LOCAL INTELLIGENCE LAYER v2
// Website Knowledge + Phase 2/3 Data + Semantic Understanding
// ==========================================

// ==========================================
// WEBSITE KNOWLEDGE BASE
// Answers "how to" and "what can you do" questions locally
// ==========================================

const WEBSITE_KNOWLEDGE = {
    features: {
        records: {
            keywords: ["entry", "एंट्री", "record", "रिकॉर्ड", "जोड़ना", "add", "नई entry", "काम डालना", "हिसाब डालना", "नया रिकॉर्ड"],
            answer: "📝 **Entry कैसे डालें:**\n\n1. मुख्य पेज पर ऊपर 'Add Work' section दिखेगा\n2. किसान का नाम भरें\n3. काम का प्रकार चुनें (Hero, Calti, Thresher, Morplau, Display, Spray Machine)\n4. तारीख, मात्रा (बीघा/घंटे), रेट भरें\n5. जमा राशि भरें (अगर कोई पैसा दिया हो)\n6. 💾 Save बटन दबाएं\n\nAI Munshi से भी बोलकर entry डाल सकते हैं: 'रामलाल का 2 बीघा Hero ₹250 में डाल दो'"
        },
        ledger: {
            keywords: ["हिसाब", "ledger", "खाता", "passbook", "किसान का हिसाब", "पूरा हिसाब", "सारा हिसाब", "account", "खाते"],
            answer: "📒 **हिसाब / Ledger:**\n\nDashboard पर सभी entries table में दिखती हैं। हर entry में:\n- 📅 तारीख\n- 👨‍🌾 किसान का नाम\n- 🚜 काम का प्रकार\n- 💰 कुल राशि\n- ✅ जमा राशि\n- ❌ बाकी राशि\n\nSearch बॉक्स में किसान का नाम डालकर उसका हिसाब देख सकते हैं।"
        },
        pdf: {
            keywords: ["pdf", "पीडीएफ", "बिल", "पर्ची", "print", "डाउनलोड", "रिसिप्ट", "receipt"],
            answer: "📄 **PDF कैसे बनाएं:**\n\n1. Dashboard पर किसान का हिसाब देखें\n2. Table में उसकी entries दिखेंगी\n3. PDF बनाने के लिए AI Munshi से कहें: 'रामलाल का PDF बना दो'\n4. या Settings > PDF Settings में जाकर अपना नाम, मोबाइल, पता save करें\n5. PDF में CHHAPOLA AGRICULTURE header, किसान का नाम, हिसाब विवरण सब आएगा"
        },
        rates: {
            keywords: ["rate", "रेट", "दाम", "कीमत", "प्राइस", "कितना लगता है", "charges", "भाड़ा", "का रेट", "rate change"],
            answer: "💰 **Work Rates / रेट:**\n\nSettings > Work Rates में जाकर हर काम का रेट set कर सकते हैं:\n\n- 🚜 Hero: Bigha × Rate\n- 🚜 Calti: Bigha × Rate\n- 🚜 Mej (Pata): Bigha × Rate\n- 🚜 Morplau: Bigha × Rate\n- 🚜 Display: Bigha × Rate\n- 🚜 Thresher: (Hours + Min/60) × Rate\n- 🚜 Spray Machine: Unit × Rate\n\nरेट change करने पर पुरानी entries पर कोई effect नहीं होता।"
        },
        settings: {
            keywords: ["settings", "सेटिंग्स", "प्रोफाइल", "profile", "नाम बदलना", "पासवर्ड", "password", "अकाउंट", "change password", "edit profile"],
            answer: "⚙️ **Settings / सेटिंग्स:**\n\nSettings में ये सब change कर सकते हैं:\n\n1. **Profile** — नाम, मोबाइल नंबर update करें\n2. **Work Rates** — हर काम का रेट set करें\n3. **PDF Settings** — PDF में दिखने वाली अपनी details\n4. **Security** — पासवर्ड बदलें\n5. **Feedback** — सुझाव या शिकायत भेजें\n\nSide menu (≡) पर click करके Settings खोलें।"
        },
        dashboard: {
            keywords: ["dashboard", "डैशबोर्ड", "मुख्य पेज", "home", "मेन पेज", "शुरू कहाँ से करें", "main page"],
            answer: "🏠 **Dashboard / मुख्य पेज:**\n\nDashboard पर ये दिखता है:\n\n📊 **Dashboard Cards:**\n- कुल किसान (Farmers)\n- कुल कमाई (Total Income)\n- कुल बाकी (Total Pending)\n- आज की कमाई (Today's Income)\n\n🔍 **Search & Filter:**\n- किसान के नाम से search करें\n- तारीख range filter लगाएं\n\n📝 **Table:**\n- सभी entries sorted by date\n- Edit (✏️) और Delete (🗑️) buttons\n\nAI Munshi (🤖) पर click करके सवाल पूछ सकते हैं।"
        },
        maintenance: {
            keywords: ["maintenance", "सर्विस", "service", "repair", "मरम्मत", "diesel", "डीजल", "tractor", "ट्रैक्टर", "reminder", "रिमाइंडर", "engine", "इंजन"],
            answer: "🔧 **Tractor Maintenance (Phase 2):**\n\nMain Menu से '🔧 Tractor Maintenance' पर click करें।\n\n**क्या-क्या कर सकते हैं:**\n\n1. **🚜 Tractor Details** — ट्रैक्टर कंपनी, मॉडल, रजिस्ट्रेशन, इंजन आवर्स\n2. **🛠️ Service History** — हर सर्विस का रिकॉर्ड\n3. **⛽ Diesel Entry** — डीजल भरने का रिकॉर्ड\n4. **🔔 Reminders** — अगली सर्विस, बीमा की याद\n5. **📊 Analysis** — कमाई बनाम खर्च\n6. **📋 History** — सारा पुराना रिकॉर्ड"
        },
        spare_parts: {
            keywords: ["spare parts", "पार्ट्स", "parts", "oil filter", "फिल्टर", "price", "कीमत", "compare", "तुलना", "सस्ता", "महंगा", "bearing", "clutch", "brake", "belt", "tyre", "tire", "engine part"],
            answer: "🛠️ **Spare Parts Finder (Phase 3):**\n\nMain Menu से '🛠️ Spare Parts & Price Analysis' पर click करें।\n\n1. **🔍 Search** — ट्रैक्टर कंपनी + मॉडल + पार्ट नाम search करें\n2. **💰 Real Prices** — Google Shopping से असली कीमतें\n3. **🏪 Seller Info** — Amazon, Flipkart, IndiaMART आदि से availability\n4. **📊 Comparison** — अलग-अलग sellers की कीमत compare करें\n5. **💾 Save Parts** — पसंदीदा पार्ट्स save करें\n6. **📜 Search History** — पहले की searches देखें"
        },
        ai_munshi: {
            keywords: ["ai munshi", "ai", "मुंशी", "robot", "बोट", "bot", "assistant", "सहायक", "help", "मदद", "क्या कर सकते हो", "what can you do", "tum kya karte ho"],
            answer: "🤖 **AI Munshi क्या कर सकता है:**\n\n📊 हिसाब, ✍️ Entry, 📄 PDF, 🔧 Tractor, 🛠️ Spare Parts — सब AI Munshi से पूछ सकते हैं।\n\nबस natural Hindi में बोलें या लिखें!"
        },
        voice: {
            keywords: ["voice", "वॉइस", "बोलकर", "mic", "माइक", "speak", "बोलना", "voice entry"],
            answer: "🎤 **Voice Entry:** AI Munshi में 🎙️ माइक बटन दबाएं और बोलें।"
        },
        search: {
            keywords: ["search", "खोज", "खोजना", "find", "ढूंढ", "filter", "फिल्टर", "filter lagana", "date filter"],
            answer: "🔍 **Search / खोज:**\n\nDashboard पर search bar में किसान का नाम या तारीख डालकर search करें।"
        },
        logout: {
            keywords: ["logout", "लॉगआउट", "sign out", "log out", "बाहर जाना", "exit"],
            answer: "🚪 **Logout:** Side menu (≡) खोलें > नीचे Logout बटन दबाएं।"
        },
        csv: {
            keywords: ["csv", "excel", "export", "डाउनलोड", "download data", "spreadsheet"],
            answer: "📊 **CSV Export:** Dashboard पर Download CSV बटन दबाकर सभी entries Excel में download कर सकते हैं।"
        }
    },

    general: {
        greeting: ["नमस्ते", "hello", "hi", "hey", "राम राम", "good morning", "शुभ प्रभात", "कैसे हो", "how are you", "what's up", "सत श्री अकाल", "जय श्री कृष्ण", "प्रणाम", "namaste", "kaise ho"],
        greetingAnswer: "🙏 राम-राम जी!\n\nMain Chhapola Agriculture का AI Munshi हूँ।\n\nआप मुझसे पूछ सकते हैं:\n- 📊 किसानों का हिसाब\n- ✍️ नई entry डालना\n- 📄 PDF बनाना\n- 🔧 Tractor maintenance\n- 🛠️ Spare parts search\n\nबस natural Hindi में बोलें या लिखें! 🎤"
    }
};

// ==========================================
// SYNONYM MAPS — Understand same-meaning different words
// ==========================================

const INTENT_SYNONYMS = {
    // BALANCE / pending money
    balance: ["बाकी", "balance", "baki", "bakaya", "उधार", "pending", "शेष", "रह गए", "बचा", "लेनी है", "owed", "unpaid", "बकाया", "कितना बचा", "कितना रहा", "कितना बाकी", "कितना उधार", "बकाया राशि", "pending amount", "pending payment", "outstanding", "due", "dues", "kitna baki", "kitna bacha", "abhi kitna", "aur kitna", "uska kitna", "baki paise", "paise bache", "kitna nahi diya", "nahi diya", "paise kab"],

    // PAID / deposited
    paid: ["जमा", "paid", "diya", "दिया", "भुगतान", "payment", "pay", "deposit", "दे दिया", "जमा किया", "paise diye", "paisa diya", "payment kiya", "kitna diya", "kitna jama", "kab jama", "kab diya", "jama rashi", "deposit amount", "paise kab diye", "kab diye"],

    // INCOME / total
    income: ["कुल", "income", "कमाई", "total", "rashi", "राशि", "earn", "kamaya", "कमाया", "आय", "kitna bana", "kitna kamaya", "total income", "gross", "revenue", "sara hisab", "poora hisab total", "kul mila", "kul kitna", "hamari", "mere", "aaya", "आए", "रुपय", "रुपये"],

    // WORK type
    work: ["काम", "work", "hero", "हीरो", "calti", "कल्टी", "cultivator", "thresher", "थ्रेसर", "morplau", "मोरप्लाउ", "display", "spray", "दवाई", "rotavator", "पता", "mej", "kya kiya", "kya kara", "kya hua", "kab kya", "konsa kaam"],

    // CROP
    crop: ["फसल", "crop", "bajra", "बाजरा", "gehun", "गेहूं", "wheat", "chana", "चना", "guar", "ग्वार", "konsi fasal", "kaisi fasal"],

    // DELETE
    delete: ["हटा", "delete", "मिटा", "रद्द", "remove", "hatana", "delete karo", "mita do", "radd karo"],

    // UPDATE
    update: ["बदल", "edit", "update", "सुधार", "sudhar", "change", "badlo", "edit karo", "update karo"],

    // PDF
    pdf: ["pdf", "पीडीएफ", "बिल", "पर्ची", "receipt", "bill", "print", "download"],

    // WHATSAPP
    whatsapp: ["whatsapp", "व्हाट्सएप", "message", "संदेश", "भेज", "send", "whatsapp bhejo", "message bhejo"],

    // COUNT / number of
    count: ["कितने", "count", "संख्या", "kitne kisan", "kitne record", "total kitne", "kitne log", "kitni entry", "number of", "एंट्री", "entries", "kitni"],

    // COMPARISON
    compare: ["तुलना", "compare", "vs", "बनाम", "mukable", "mila do", "compare karo", "kiska zyada", "kiska kam"],

    // HIGHEST / LOWEST
    extreme: ["सबसे", "highest", "maximum", "most", "lowest", "minimum", "least", "zyada", "sabse zyada", "sabse kam", "sabse badi", "sabse chhoti", "sabse zyada wala", "sabse kam wala", "top", "best", "worst", "pehla", "aakhri"],

    // RECENT / last
    recent: ["पिछला", "last", "previous", "prev", "abhi haal", "recent", "taaza", "sabse pichla", "last wala", "pichli baar"],

    // TODAY / daily
    today: ["आज", "today", "aaj", "aj", "aaj ka", "today's", "is din", "yahi din", "daily", "दैनिक"],

    // MONTHLY
    monthly: ["महीने", "month", "maah", "mahina", "monthly", "मासिक", "is mahine", "pichle mahine", "last month", "this month"],

    // YEARLY
    yearly: ["साल", "year", "saal", "sal", "yearly", "वार्षिक", "is saal", "pichle saal", "last year", "this year"],

    // SUMMARY
    summary: ["summary", "सारांश", "brief", "संक्षिप्त", "short", "sankshipt", "chota", "poora summary", "ek me batao"],

    // HOW TO / help
    help: ["कैसे", "how", "kaise", "help", "मदद", "madad", "kahan hai", "kahan milega", "kahan se kare", "kahan se shuru kare", "kaise kare", "kaise karein", "settings", "setting", "कहाँ", "where"],

    // EXPENSE / kharch
    expense: ["खर्च", "expense", "kharch", "cost", "spending", "kharach", "kitna laga", "kitna gaya", "kitna kharch hua", "petrol", "diesel kharch"],

    // MAINTENANCE / tractor
    maintenance: ["tractor", "ट्रैक्टर", "service", "सर्विस", "diesel", "डीजल", "oil", "तेल", "repair", "मरम्मत", "reminder", "रिमाइंडर", "maintenance", "marammat", "next service", "agla service"],

    // CALCULATE
    calculate: ["कितना बनेगा", "कितना होगा", "calculate", "estimate", "अनुमान", "हिसाब लगाओ", "जोड़कर बताओ", "multiply", "गुणा", "kitna banega", "kitna ho jayega", "multiply karo", "guna karo", "jod ke batao"],

    // WHO / farmer list
    who: ["कौन", "किसका", "किसके", "किन", "kaun", "kiska", "kin ka", "kaun kisan", "konsa kisan", "farmer list"],

    // DATE / kab
    when: ["कब", "kab", "kab hua", "kab kiya", "kab mila", "kab diya", "kab jama", "date", "tarikh"]
};

// ==========================================
// GOAL DETECTION — What does user WANT?
// ==========================================

const GOAL_PATTERNS = {
    // User wants to SEE data
    view: {
        patterns: ["दिखा", "show", "display", "batao", "bata", "nikalo", "nikal", "dikhao", "dikha", "check", "check karo", "dekh", "dekho", "check kar", "khol", "kholo", "open", "open karo", "jankari", "detail", "vivar"],
        weight: 1
    },
    // User wants to ADD data
    add: {
        patterns: ["डाल", "add", "jodo", "jod", "insert", "daal", "dale", "banao", "bana", "create", "save", "save karo", "likh", "likh do", "darj"],
        weight: 2
    },
    // User wants to COMPARE
    compare: {
        patterns: ["तुलना", "compare", "vs", "banam", "mukable", "mila", "match", "kon zyada", "kon kam"],
        weight: 1.5
    },
    // User wants SUMMARY
    summarize: {
        patterns: ["summary", "sankshipt", "chota", "ek me", "poora", "sara", "brief"],
        weight: 1
    }
};

// ==========================================
// PHASE 2 DATA ACCESSOR
// ==========================================

async function loadPhase2Data() {
    const result = { tractor: null, services: [], diesel: [], reminders: [] };
    try {
        const user = window.auth ? window.auth.currentUser : null;
        if (!user || typeof db === "undefined" || !db) return result;
        const uid = user.uid;

        try {
            const tractorSnap = await db.collection("tractor_details").doc(uid).get();
            if (tractorSnap.exists()) result.tractor = tractorSnap.data();
        } catch(e) {}

        try {
            const svcSnap = await db.collection("tractor_services")
                .where("ownerUid", "==", uid).get();
            svcSnap.forEach(d => result.services.push({ id: d.id, ...d.data() }));
            result.services.sort((a,b) => (b.date||"").localeCompare(a.date||""));
        } catch(e) {}

        try {
            const dieselSnap = await db.collection("tractor_diesel")
                .where("ownerUid", "==", uid).get();
            dieselSnap.forEach(d => result.diesel.push({ id: d.id, ...d.data() }));
            result.diesel.sort((a,b) => (b.date||"").localeCompare(a.date||""));
        } catch(e) {}

        try {
            const remSnap = await db.collection("tractor_reminders")
                .where("ownerUid", "==", uid).get();
            remSnap.forEach(d => result.reminders.push({ id: d.id, ...d.data() }));
        } catch(e) {}

    } catch(e) { console.error("Phase2 data load error:", e); }
    return result;
}

// ==========================================
// PHASE 3 DATA ACCESSOR
// ==========================================

async function loadPhase3Data() {
    const result = { savedParts: [], searchHistory: [] };
    try {
        const user = window.auth ? window.auth.currentUser : null;
        if (!user || typeof db === "undefined" || !db) return result;
        const uid = user.uid;

        try {
            const snap = await db.collection("spare_part_lists")
                .where("ownerUid", "==", uid).get();
            snap.forEach(d => result.savedParts.push({ id: d.id, ...d.data() }));
        } catch(e) {}

        try {
            const snap = await db.collection("part_search_history")
                .where("ownerUid", "==", uid)
                .orderBy("createdAt", "desc").limit(20).get();
            snap.forEach(d => result.searchHistory.push({ id: d.id, ...d.data() }));
        } catch(e) {}

    } catch(e) { console.error("Phase3 data load error:", e); }
    return result;
}

// ==========================================
// SEMANTIC INTENT DETECTOR v2
// Understands meaning, not just keywords
// ==========================================

function detectSemanticIntent(text) {
    const q = String(text || "").toLowerCase().trim();

    // HOW_TO / help questions — check FIRST (website help should not go to data queries)
    if (/\b(कैसे|कैसा|how to|how do|kaise|कहाँ है|where|कहाँ मिल|कहाँ देख|कैसे कर|कैसे खोल|how can|kahan hai|kahan se|kaise shuru)\b/.test(q)) {
        if (!/\b(किसान|farmer|बाकी|balance|paid|income|total|record|entry|hisab)\b/.test(q)) {
            return "HOW_TO";
        }
    }
    if (/\b(क्या कर सकते|what can you|capabilities|feature|क्या क्या करो|तुम क्या करते|help me|मेरी मदद|क्या हो|samjh)\b/.test(q)) {
        return "HOW_TO";
    }

    // GREETING — check very early
    if (/\b(नमस्ते|hello|hi |hey |राम राम|good morning|शुभ प्रभात|kaise ho|how are you|namaste|pranam|jay shree|sat sri|kya haal)\b/.test(q) && q.length < 50) {
        return "GREETING";
    }

    // CALCULATE intent
    if (/\b(कितना बनेगा|कितना होगा|calculate|estimate|अनुमान|हिसाब लगाओ|जोड़कर बताओ|multiply|गुणा|plus|जोड़|kitna banega|kitna ho|multiply|guna|jod)\b/.test(q)) {
        if (!/\b(डाल|जमा|बना|हटा|भेज)\b/.test(q)) {
            return "CALCULATE";
        }
    }

    // EXPENSE / kharch questions
    if (/\b(खर्च|expense|kharch|cost|spending|kharach|kitna laga|kitna gaya|kitna kharch|petrol|diesel kharch|kharcha)\b/.test(q)) {
        return "EXPENSE";
    }

    // MAINTENANCE / tractor questions
    if (/\b(tractor|ट्रैक्टर|service|सर्विस|diesel|डीजल|oil|तेल|repair|मरम्मत|reminder|रिमाइंडर|maintenance|next service|agla service|engine|marammat|service history)\b/.test(q)) {
        return "MAINTENANCE";
    }

    // SPARE PART questions
    if (/\b(spare|part|पार्ट|filter|फिल्टर|bearing|clutch|brake|belt|tyre|टायर|spare part|tire)\b/.test(q)) {
        return "SPARE_PART";
    }

    // COMPARE INCOME vs EXPENSE
    if (/\b(कमाई.*खर्च|income.*expense|खर्च.*कमाई|expense.*income|तुलना|compare|profit|नफा|loss|नुकसान|net profit|kamai.*kharch|kharch.*kamai)\b/.test(q)) {
        return "COMPARE_INCOME_EXPENSE";
    }

    // DAILY summary
    if (/\b(आज|today|aaj|aj|daily|दैनिक)\b/.test(q) && /\\b(hisab|हिसाब|summary|कमाई|income|report|kitna|kya|kab)\b/.test(q)) {
        return "DAILY_SUMMARY";
    }

    // Monthly summary
    if (/\b(महीने?|month|mahina|maah|monthly|मासिक)\b/.test(q) && /\\b(hisab|हिसाब|summary|कमाई|income|report|kitna|kya)\b/.test(q)) {
        return "MONTHLY_SUMMARY";
    }

    // Yearly summary
    if (/\b(साल|year|saal|yearly|वार्षिक)\b/.test(q) && /\\b(hisab|हिसाब|summary|कमाई|income|report|kitna)\b/.test(q)) {
        return "YEARLY_SUMMARY";
    }

    // CAPABILITIES
    if (/\b(क्या कर सकते|what can you|capabilities|क्या क्या करो|तुम क्या करते|help me|मेरी मदद)\b/.test(q)) {
        return "CAPABILITIES";
    }

    // FARMER_COUNT
    if (/\b(कितने किसान|how many farmer|कुल किसान|total farmer|कितने लोग|kitne kisan|total kitne)\b/.test(q)) {
        return "FARMER_COUNT";
    }

    // HIGHEST_EARNER
    if (/\b(सबसे ज्यादा कमाई|highest income|most earning|sabse zyada kamai|sabse badi kamai)\b/.test(q)) {
        return "HIGHEST_EARNER";
    }

    // WEEKLY summary
    if (/\b(हफ्ते?|week|hafta|weekly|साप्ताहिक)\b/.test(q) && /\b(hisab|हिसाब|summary|कमाई|income|report|kitna)\b/.test(q)) {
        return "WEEKLY_SUMMARY";
    }

    return null;
}

// ==========================================
// ENHANCED DATE PARSER
// ==========================================

function enhancedDateParse(text) {
    const q = String(text || "").toLowerCase();
    const today = new Date();
    const result = { date: null, dateRange: null };

    // This year
    if (/\b(इस\s*साल|this\s*year|is\s*saal|20\d{2})\b/.test(q)) {
        const yearStart = new Date(today.getFullYear(), 0, 1);
        result.dateRange = {
            from: yearStart.toISOString().split("T")[0],
            to: today.toISOString().split("T")[0]
        };
    }
    // Last year
    else if (/\b(पिछले?\s*साल|last\s*year|pichle\s*saal|गत\s*साल)\b/.test(q)) {
        const lastYear = today.getFullYear() - 1;
        result.dateRange = {
            from: new Date(lastYear, 0, 1).toISOString().split("T")[0],
            to: new Date(lastYear, 11, 31).toISOString().split("T")[0]
        };
    }
    // This week
    else if (/\b(इस\s*(हफ्ते?|week)|is\s*(hafta|week)|यह\s*हफ्ता)\b/.test(q)) {
        const dayOfWeek = today.getDay();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - dayOfWeek);
        result.dateRange = {
            from: weekStart.toISOString().split("T")[0],
            to: today.toISOString().split("T")[0]
        };
    }
    // Last week
    else if (/\b(पिछले?\s*(हफ्ते?|week)|pichle?\s*(hafta|week))\b/.test(q)) {
        const dayOfWeek = today.getDay();
        const lwStart = new Date(today);
        lwStart.setDate(today.getDate() - dayOfWeek - 7);
        const lwEnd = new Date(today);
        lwEnd.setDate(today.getDate() - dayOfWeek - 1);
        result.dateRange = {
            from: lwStart.toISOString().split("T")[0],
            to: lwEnd.toISOString().split("T")[0]
        };
    }
    // "last N days"
    else {
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
    return result;
}

// ==========================================
// COMPOSITE QUESTION SPLITTER
// ==========================================

function splitCompositeQuestion(text) {
    const q = String(text || "").trim();
    const parts = q.split(/\s+(?:और|aur|and|तथा|\+)\s+/i);
    if (parts.length > 1 && parts.length <= 3) {
        return parts;
    }
    return [q];
}

// ==========================================
// SMART QUESTION UNDERSTANDING
// Extract entities, goals, and context from natural language
// ==========================================

function understandQuestion(text) {
    const q = String(text || "").toLowerCase().trim();
    const raw = String(text || "").trim();
    const result = {
        entities: {
            farmer: null,
            work: null,
            crop: null,
            amount: null,
            dateRef: null,
            tractorPart: null,
            comparisonTarget: null
        },
        goals: [],
        questionType: null, // "view", "add", "compare", "summarize", "help"
        confidence: 0
    };

    // Extract numbers
    const numbers = [];
    const numMatches = q.matchAll(/\b(\d+(?:\.\d+)?)\b/g);
    for (const m of numMatches) numbers.push(parseFloat(m[1]));

    // Amount detection (₹, rs, rupees, rupaye)
    const amtMatch = q.match(/(?:₹|rs\.?|rupees?|rupaye|rupya)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|rupees?|rupaye|rupya|mein|me|men)/i);
    if (amtMatch) result.entities.amount = parseFloat(amtMatch[1] || amtMatch[2]);

    // Work type detection
    const workTerms = {
        "hero": "Hero", "हीरो": "Hero",
        "calti": "Calti", "कल्टी": "Calti", "cultivator": "Calti",
        "thresher": "Thresher", "थ्रेसर": "Thresher",
        "morplau": "Morplau", "मोरप्लाउ": "Morplau",
        "display": "Display",
        "spray": "Spray Machine", "दवाई": "Spray Machine", "spray machine": "Spray Machine",
        "rotavator": "Rotavator", "रोटावेटर": "Rotavator",
        "mej": "Mej (Pata)", "पता": "Mej (Pata)", "pata": "Mej (Pata)"
    };
    for (const [key, value] of Object.entries(workTerms)) {
        if (q.includes(key)) { result.entities.work = value; break; }
    }

    // Crop detection
    const cropTerms = {
        "bajra": "Bajra", "बाजरा": "Bajra",
        "gehun": "Gehun", "गेहूं": "Gehun", "wheat": "Gehun",
        "chana": "Chana", "चना": "Chana",
        "guar": "Guar", "ग्वार": "Guar"
    };
    for (const [key, value] of Object.entries(cropTerms)) {
        if (q.includes(key)) { result.entities.crop = value; break; }
    }

    // Goal detection
    for (const [goalName, goalInfo] of Object.entries(GOAL_PATTERNS)) {
        if (goalInfo.patterns.some(p => q.includes(p))) {
            result.goals.push(goalName);
        }
    }
    if (result.goals.length === 0) result.goals.push("view"); // default goal

    // Determine primary question type
    if (result.goals.includes("add")) result.questionType = "add";
    else if (result.goals.includes("compare")) result.questionType = "compare";
    else if (result.goals.includes("summarize")) result.questionType = "summarize";
    else result.questionType = "view";

    // Confidence based on extracted information
    let conf = 0;
    if (result.entities.farmer) conf += 30;
    if (result.entities.work) conf += 15;
    if (result.entities.crop) conf += 10;
    if (result.entities.amount) conf += 10;
    if (result.goals.length > 0) conf += 20;
    if (numbers.length > 0) conf += 10;
    result.confidence = Math.min(conf, 100);

    return result;
}

// ==========================================
// WEBSITE QUESTION ROUTER
// Can this question be answered from website data?
// ==========================================

function isWebsiteQuestion(text) {
    const q = String(text || "").toLowerCase();

    // Questions about website features/help → always website
    if (/\b(कैसे|how|kaise|कहाँ|where|kahan|help|मदद|setting|सेटिंग|login|logout|password|profile|pdf|csv|voice|menu|menu me|kahan milega)\b/.test(q)) {
        return true;
    }

    // Questions about data that exists in website
    if (/\b(kisan|farmer|record|entry|hisab|ledger|balance|paid|income|total|work|crop|rate|bigha|date|tarikh)\b/.test(q)) {
        return true;
    }

    // Questions about Phase 2/3
    if (/\b(tractor|service|diesel|oil|maintenance|reminder|spare|part|filter|bearing)\b/.test(q)) {
        return true;
    }

    // Questions with numbers and money
    if (/\b\d+\s*(बीघा|bigha|₹|rs|rupaye)\b/.test(q)) {
        return true;
    }

    // Simple calculation queries
    if (/\b(कितना|kitna|how much|how many|kitne)\b/.test(q)) {
        return true;
    }

    return false;
}

// ==========================================
// CATCH-ALL QUESTION HANDLER
// Tries to answer from data before sending to Gemini
// ==========================================

function catchAllLocalAnswer(text) {
    const q = String(text || "").toLowerCase().trim();
    const records = window.records || [];

    if (!records.length) return null;

    // Calculate global stats
    let totalIncome = 0, totalPaid = 0, totalBalance = 0;
    const farmerMap = {};
    const workMap = {};
    const dateMap = {};

    records.forEach(r => {
        const t = Number(r.total || 0);
        const p = Number(r.paid || 0);
        const b = Number(r.baki || r.balance || (t - p));
        totalIncome += t;
        totalPaid += p;
        totalBalance += b;

        const name = r.name || r.farmer || "Unknown";
        if (!farmerMap[name]) farmerMap[name] = { total: 0, paid: 0, baki: 0, count: 0, works: [] };
        farmerMap[name].total += t;
        farmerMap[name].paid += p;
        farmerMap[name].baki += b;
        farmerMap[name].count++;
        farmerMap[name].works.push(r.work || "");

        const work = r.work || "Other";
        if (!workMap[work]) workMap[work] = { count: 0, total: 0 };
        workMap[work].count++;
        workMap[work].total += t;

        if (r.date) {
            const month = r.date.substring(0, 7);
            if (!dateMap[month]) dateMap[month] = { count: 0, total: 0 };
            dateMap[month].count++;
            dateMap[month].total += t;
        }
    });

    const farmerNames = Object.keys(farmerMap);
    const sortedByIncome = farmerNames.sort((a, b) => farmerMap[b].total - farmerMap[a].total);
    const sortedByBalance = farmerNames.sort((a, b) => farmerMap[b].baki - farmerMap[a].baki);
    const sortedByCount = farmerNames.sort((a, b) => farmerMap[b].count - farmerMap[a].count);
    const sortedWorks = Object.keys(workMap).sort((a, b) => workMap[b].total - workMap[a].total);

    // "सबसे ज्यादा काम किसने कराया" / "most work by whom"
    if (/sabse|सबसे|most|highest|zyada|ज्यादा|sabse zyada/.test(q) && /kaam|work|kamaya|kara|kiya|kisne/.test(q)) {
        if (sortedByCount[0]) {
            const top = sortedByCount[0];
            return `👨‍🌾 ${top} ने सबसे ज्यादा काम कराया: ${farmerMap[top].count} बार\n💰 कुल: ₹${farmerMap[top].total}\n❌ बाकी: ₹${farmerMap[top].baki}`;
        }
    }

    // "सबसे ज्यादा कमाई किसकी" / "highest earning"
    if (/sabse|सबसे|most|highest|zyada|बड़ी|sabse badi/.test(q) && /kamai|income|total|kisiki|rashi|rupee|paisa|rupaye|कमाई|आय/.test(q)) {
        if (sortedByIncome[0]) {
            const top = sortedByIncome[0];
            return `👨‍🌾 ${top} की सबसे ज्यादा कमाई: ₹${farmerMap[top].total.toLocaleString('en-IN')}\n✅ जमा: ₹${farmerMap[top].paid}\n❌ बाकी: ₹${farmerMap[top].baki}\n📝 एंट्री: ${farmerMap[top].count}`;
        }
    }

    // "सबसे ज्यादा बाकी किसका" / "most pending"
    if (/sabse|सबसे|most|highest|zyada|सबसे बड़ा/.test(q) && /baki|balance|pending|udhar|bakaya|उधार|बकाया|owed/.test(q)) {
        if (sortedByBalance[0]) {
            const top = sortedByBalance[0];
            return `👨‍🌾 ${top} पर सबसे ज्यादा बाकी है: ₹${farmerMap[top].baki}\n💰 कुल: ₹${farmerMap[top].total}\n✅ जमा: ₹${farmerMap[top].paid}`;
        }
    }

    // "सबसे कम काम किसने कराया"
    if (/sabse kam|सबसे कम|least|lowest|min/.test(q) && /kaam|work|kamai|count/.test(q)) {
        if (sortedByCount[sortedByCount.length - 1]) {
            const bottom = sortedByCount[sortedByCount.length - 1];
            return `👨‍🌾 ${bottom} ने सबसे कम काम कराया: ${farmerMap[bottom].count} बार\n💰 कुल: ₹${farmerMap[bottom].total}`;
        }
    }

    // "कौन-कौन से काम होते हैं" / "what work types"
    if (/kya kya|क्या क्या|konsa|कौन सा|kaun sa|what|which|kaun kaun sa/.test(q) && /kaam|work|karte|type|prakar/.test(q)) {
        const workList = Object.entries(workMap)
            .sort((a,b) => b[1].count - a[1].count)
            .map(([w, d]) => `• ${w} (${d.count} बार, ₹${d.total})`)
            .join("\n");
        return `📊 उपलब्ध काम:\n${workList}`;
    }

    // "कौन-कौन सी फसल है" / "what crops"
    if (/fasal|crop|कौन.*फसल|konsi.*fasal|what crop/.test(q)) {
        const cropMap = {};
        records.forEach(r => {
            const c = r.crop || "बिना फसल";
            if (!cropMap[c]) cropMap[c] = 0;
            cropMap[c]++;
        });
        const cropList = Object.entries(cropMap)
            .sort((a,b) => b[1] - a[1])
            .map(([c, n]) => `• ${c} (${n} बार)`)
            .join("\n");
        return `🌾 फसलें:\n${cropList}`;
    }

    // "मेरी कमाई कितनी है" / "meri kamai" / "hamari kamai"
    if (/meri|hamari|मेरी|हमारी|my|our|mere|hamare/.test(q) && /kamai|income|total|hisab|rashi/.test(q)) {
        return `📊 आपकी कुल कमाई: ₹${totalIncome.toLocaleString('en-IN')}\n✅ जमा: ₹${totalPaid.toLocaleString('en-IN')}\n❌ बाकी: ₹${totalBalance.toLocaleString('en-IN')}\n📝 कुल एंट्री: ${records.length}\n👨‍🌾 किसान: ${farmerNames.length}`;
    }

    // "kitne kisan hai" / "कितने किसान हैं"
    if (/kitne\s*kisan|कितने\s*किसान|kitne\s*log|कितने\s*लोग|kitna\s*kitna/.test(q)) {
        return `👨‍🌾 कुल ${farmerNames.length} किसान हैं:\n${farmerNames.join(", ")}`;
    }

    // "kitne record/entry hai"
    if (/kitne\s*(record|entry|एंट्री|रिकॉर्ड)/.test(q)) {
        return `📝 कुल ${records.length} रिकॉर्ड हैं।\n💰 कुल राशि: ₹${totalIncome.toLocaleString('en-IN')}`;
    }

    // "kab se kaam shuru hua" / "kab se start" / "pehli entry kab"
    if (/kab\s*se|kab.*shuru|kab.*start|pehli\s*entry|sabse\s*purani|oldest|first/.test(q)) {
        const sorted = [...records].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        const first = sorted[0];
        if (first) {
            return `📅 सबसे पुरानी entry:\n👨‍🌾 ${first.name || first.farmer || "?"}\n📅 ${first.date || "?"}\n🚜 ${first.work || "?"}\n💰 ₹${first.total || 0}`;
        }
    }

    // "aakhri / sabse taza entry" / "last entry"
    if (/aakhri|sabse\s*taza|latest|last\s*entry|sabse\s*nayi|sabse\s*haal|abki/.test(q)) {
        const sorted = [...records].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        const recent = sorted[0];
        if (recent) {
            return `📅 सबसे ताज़ा entry:\n👨‍🌾 ${recent.name || recent.farmer || "?"}\n📅 ${recent.date || "?"}\n🚜 ${recent.work || "?"}\n💰 ₹${recent.total || 0}\n${recent.paid ? "✅ जमा: ₹" + recent.paid : ""}`;
        }
    }

    // "kis month me zyada kamai hui"
    if (/kis\s*month|किस\s*महीने|kon\s*sa\s*month|kaun\s*sa\s*mahina|sabse\s*accha|sabse\s*zyada.*month/.test(q)) {
        const monthNames = { "01": "जनवरी", "02": "फरवरी", "03": "मार्च", "04": "अप्रैल", "05": "मई", "06": "जून", "07": "जुलाई", "08": "अगस्त", "09": "सितंबर", "10": "अक्टूबर", "11": "नवंबर", "12": "दिसंबर" };
        const sortedMonths = Object.entries(dateMap).sort((a, b) => b[1].total - a[1].total);
        if (sortedMonths.length) {
            const [bestMonth, data] = sortedMonths[0];
            const mNum = bestMonth.substring(5, 7);
            const mName = monthNames[mNum] || mNum;
            return `📅 ${mName} (${bestMonth}) में सबसे ज्यादा कमाई हुई:\n💰 ₹${data.total.toLocaleString('en-IN')}\n📝 ${data.count} एंट्री`;
        }
    }

    // "vazulai dar" / "recovery rate" / "collection rate"
    if (/vazulai|वसूली|recovery|collection|recovery\s*rate|dar|दर/.test(q)) {
        const rate = totalIncome > 0 ? Math.round((totalPaid / totalIncome) * 100) : 0;
        return `📊 वसूली दर: ${rate}%\n💰 कुल कमाई: ₹${totalIncome.toLocaleString('en-IN')}\n✅ जमा: ₹${totalPaid.toLocaleString('en-IN')}\n❌ बाकी: ₹${totalBalance.toLocaleString('en-IN')}`;
    }

    // Average per record
    if (/average|औसत|ausat|per\s*entry|prati\s*entry/.test(q)) {
        const avg = records.length > 0 ? Math.round(totalIncome / records.length) : 0;
        return `📊 प्रति एंट्री औसत: ₹${avg}\n📝 कुल एंट्री: ${records.length}\n💰 कुल राशि: ₹${totalIncome.toLocaleString('en-IN')}`;
    }

    // Today's work
    if (/\b(आज|today|aaj)\b/.test(q) && /kaam|work|kya|hua|kiya|entry/.test(q)) {
        const todayStr = new Date().toISOString().split("T")[0];
        const todayRecords = records.filter(r => (r.date || "") === todayStr);
        if (todayRecords.length === 0) return "आज कोई entry नहीं है।";
        let tTotal = 0;
        todayRecords.forEach(r => tTotal += Number(r.total || 0));
        const farmers = [...new Set(todayRecords.map(r => r.name || r.farmer || ""))].filter(Boolean);
        return `📅 आज (${todayStr}):\n📝 ${todayRecords.length} एंट्री\n👨‍🌾 किसान: ${farmers.join(", ")}\n💰 कुल: ₹${tTotal}`;
    }

    // If it seems like a website question but we couldn't answer, return null
    return null;
}

// ==========================================
// PUBLIC API
// ==========================================

window.WEBSITE_KNOWLEDGE = WEBSITE_KNOWLEDGE;
window.INTENT_SYNONYMS = INTENT_SYNONYMS;
window.GOAL_PATTERNS = GOAL_PATTERNS;
window.loadPhase2Data = loadPhase2Data;
window.loadPhase3Data = loadPhase3Data;
window.detectSemanticIntent = detectSemanticIntent;
window.enhancedDateParse = enhancedDateParse;
window.splitCompositeQuestion = splitCompositeQuestion;
window.understandQuestion = understandQuestion;
window.isWebsiteQuestion = isWebsiteQuestion;
window.catchAllLocalAnswer = catchAllLocalAnswer;
