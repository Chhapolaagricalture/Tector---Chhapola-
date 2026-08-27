// ==========================================
// AI MUNSHI — LOCAL INTELLIGENCE LAYER
// Website Knowledge + Phase 2/3 Data + Semantic Understanding
// ==========================================

// ==========================================
// WEBSITE KNOWLEDGE BASE
// Answers "how to" and "what can you do" questions locally
// ==========================================

const WEBSITE_KNOWLEDGE = {
    features: {
        records: {
            keywords: ["entry", "एंट्री", "record", "रिकॉर्ड", "जोड़ना", "add", "नई entry", "काम डालना", "हिसाब डालना"],
            answer: "📝 **Entry कैसे डालें:**\n\n1. मुख्य पेज पर ऊपर 'Add Work' section दिखेगा\n2. किसान का नाम भरें\n3. काम का प्रकार चुनें (Hero, Calti, Thresher, Morplau, Display, Spray Machine)\n4. तारीख, मात्रा (बीघा/घंटे), रेट भरें\n5. जमा राशि भरें (अगर कोई पैसा दिया हो)\n6. 💾 Save बटन दबाएं\n\nAI Munshi से भी बोलकर entry डाल सकते हैं: 'रामलाल का 2 बीघा Hero ₹250 में डाल दो'"
        },
        ledger: {
            keywords: ["हिसाब", "ledger", "खाता", "passbook", "किसान का हिसाब", "पूरा हिसाब", "सारा हिसाब"],
            answer: "📒 **हिसाब / Ledger:**\n\nDashboard पर सभी entries table में दिखती हैं। हर entry में:\n- 📅 तारीख\n- 👨‍🌾 किसान का नाम\n- 🚜 काम का प्रकार\n- 💰 कुल राशि\n- ✅ जमा राशि\n- ❌ बाकी राशि\n\nSearch बॉक्स में किसान का नाम डालकर उसका हिसाब देख सकते हैं।"
        },
        pdf: {
            keywords: ["pdf", "पीडीएफ", "बिल", "पर्ची", "print", "डाउनलोड"],
            answer: "📄 **PDF कैसे बनाएं:**\n\n1. Dashboard पर किसान का हिसाब देखें\n2. Table में उसकी entries दिखेंगी\n3. PDF बनाने के लिए AI Munshi से कहें: 'रामलाल का PDF बना दो'\n4. या Settings > PDF Settings में जाकर अपना नाम, मोबाइल, पता save करें\n5. PDF में CHHAPOLA AGRICULTURE header, किसान का नाम, हिसाब विवरण सब आएगा\n\nPDF Settings में अपनी details save करने से PDF में logo वाली जगह आपकी details दिखेंगी।"
        },
        rates: {
            keywords: ["rate", "रेट", "दाम", "कीमत", "प्राइस", "कितना लगता है", "charges", "भाड़ा"],
            answer: "💰 **Work Rates / रेट:**\n\nSettings > Work Rates में जाकर हर काम का रेट set कर सकते हैं:\n\n- 🚜 Hero: Bigha × Rate\n- 🚜 Calti: Bigha × Rate\n- 🚜 Mej (Pata): Bigha × Rate\n- 🚜 Morplau: Bigha × Rate\n- 🚜 Display: Bigha × Rate\n- 🚜 Thresher: (Hours + Min/60) × Rate\n- 🚜 Spray Machine: Unit × Rate\n- 💰 Pending Balance: रेट = राशि\n- 🔄 Discount: Bigha × Rate (usually 0)\n\nरेट change करने पर पुरानी entries पर कोई effect नहीं होता। नई entries पर नया रेट लगेगा।"
        },
        settings: {
            keywords: ["settings", "सेटिंग्स", "प्रोफाइल", "profile", "नाम बदलना", "पासवर्ड", "password", "अकाउंट"],
            answer: "⚙️ **Settings / सेटिंग्स:**\n\nSettings में ये सब change कर सकते हैं:\n\n1. **Profile** — नाम, मोबाइल नंबर update करें\n2. **Work Rates** — हर काम का रेट set करें\n3. **PDF Settings** — PDF में दिखने वाली अपनी details\n4. **Security** — पासवर्ड बदलें\n5. **Feedback** — सुझाव या शिकायत भेजें\n6. **Privacy Policy** — डेटा सुरक्षा की जानकारी\n\nSide menu (≡) पर click करके Settings खोलें।"
        },
        dashboard: {
            keywords: ["dashboard", "डैशबोर्ड", "मुख्य पेज", "home", "मेन पेज", "शुरू कहाँ से करें"],
            answer: "🏠 **Dashboard / मुख्य पेज:**\n\nDashboard पर ये दिखता है:\n\n📊 **Dashboard Cards:**\n- कुल किसान (Farmers)\n- कुल कमाई (Total Income)\n- कुल बाकी (Total Pending)\n- आज की कमाई (Today's Income)\n\n🔍 **Search & Filter:**\n- किसान के नाम से search करें\n- तारीख range filter लगाएं\n\n📝 **Table:**\n- सभी entries sorted by date\n- Edit (✏️) और Delete (🗑️) buttons\n\nAI Munshi (🤖) पर click करके सवाल पूछ सकते हैं।"
        },
        maintenance: {
            keywords: ["maintenance", "सर्विस", "service", "repair", "मरम्मत", "diesel", "डीजल", "tractor", "ट्रैक्टर", "reminder", "रिमाइंडर"],
            answer: "🔧 **Tractor Maintenance (Phase 2):**\n\nMain Menu से '🔧 Tractor Maintenance' पर click करें।\n\n**क्या-क्या कर सकते हैं:**\n\n1. **🚜 Tractor Details** — ट्रैक्टर कंपनी, मॉडल, रजिस्ट्रेशन, इंजन आवर्स\n2. **🛠️ Service History** — हर सर्विस का रिकॉर्ड (तारीख, समस्या, खर्च)\n3. **⛽ Diesel Entry** — डीजल भरने का रिकॉर्ड (मात्रा, रेट, रनिंग आवर्स)\n4. **🔔 Reminders** — अगली सर्विस, बीमा, आदि की याद दिलाना\n5. **📊 Analysis** — कमाई बनाम खर्च, डीजल खर्च, नेट प्रॉफिट\n6. **📋 History** — सारा पुराना रिकॉर्ड\n\n**Dashboard** पर सारा summary एक जगह दिखता है: कुल आय, कुल खर्च, नेट प्रॉफिट, डीजल खर्च।"
        },
        spare_parts: {
            keywords: ["spare parts", "पार्ट्स", "parts", "oil filter", "फिल्टर", "price", "कीमत", "compare", "तुलना", "सस्ता", "महंगा"],
            answer: "🛠️ **Spare Parts Finder (Phase 3):**\n\nMain Menu से '🛠️ Spare Parts & Price Analysis' पर click करें।\n\n**क्या कर सकते हैं:**\n\n1. **🔍 Search** — ट्रैक्टर कंपनी + मॉडल + पार्ट नाम search करें\n2. **💰 Real Prices** — Google Shopping से असली कीमतें\n3. **🏪 Seller Info** — Amazon, Flipkart, IndiaMART आदि से availability\n4. **📊 Comparison** — अलग-अलग sellers की कीमत compare करें\n5. **💾 Save Parts** — पसंदीदा पार्ट्स save करें\n6. **📜 Search History** — पहले की searches देखें\n\n**Example:** 'Swaraj 744 XT oil filter' search करें — असली कीमत, seller, link सब दिखेगा।"
        },
        ai_munshi: {
            keywords: ["ai munshi", "ai", "मुंशी", "robot", "बोट", "bot", "assistant", "सहायक", "help", "मदद", "क्या कर सकते हो", "what can you do"],
            answer: "🤖 **AI Munshi क्या कर सकता है:**\n\n**📊 हिसाब / Ledger:**\n- 'रामलाल का बाकी कितना है?'\n- 'आज की कमाई कितनी है?'\n- 'किसने सबसे ज्यादा काम कराया?'\n- 'पिछले महीने का हिसाब बताओ'\n\n**✍️ Entry करना:**\n- 'रामलाल का 2 बीघा Hero ₹250 में डाल दो'\n- 'रामलाल को ₹500 जमा कर दो'\n\n**📄 PDF / WhatsApp:**\n- 'रामलाल का PDF बना दो'\n- 'रामलाल को WhatsApp भेज दो'\n\n**🔧 Tractor / Spare Parts:**\n- 'मेरे tractor की अगली service कब है?'\n- 'Swaraj 744 XT oil filter ढूंढो'\n\n**🎤 Voice:** 🎙️ बटन दबाकर बोलें\n\nबस natural Hindi में बोलें या लिखें!"
        },
        voice: {
            keywords: ["voice", "वॉइस", "बोलकर", "mic", "माइक", "speak", "बोलना"],
            answer: "🎤 **Voice Entry / बोलकर Entry:**\n\n**AI Munshi Voice:**\n- AI Munshi में 🎙️ माइक बटन दबाएं\n- बोलें: 'रामलाल का 2 बीघा Hero ₹250 में'\n- AI automatically entry बना देगा\n\n**Voice Entry (Form):**\n- मुख्य पेज पर 🎤 Voice Entry बटन दबाएं\n- बोलें: 'Hero 2 बीघा ₹250 रामलाल'\n- Form automatically भर जाएगा\n- बस Save बटन दबाएं\n\nहिंदी, Hinglish या English में बोल सकते हैं।"
        },
        search: {
            keywords: ["search", "खोज", "खोजना", "find", "ढूंढ", "filter", "फिल्टर"],
            answer: "🔍 **Search / खोज:**\n\nDashboard पर search bar में:\n\n1. **किसान का नाम** लिखें — उसकी सभी entries दिखेंगी\n2. **तारीख filter** — तारीख range select करें\n3. **दोनों साथ** — नाम + तारीख से exact results\n\nAI Munshi से भी search कर सकते हैं:\n- 'रामलाल का हिसाब दिखाओ'\n- 'पिछले महीने Hero का काम किसने कराया?'\n- 'सबसे ज्यादा बाकी किसका है?'"
        }
    },

    general: {
        greeting: ["नमस्ते", "hello", "hi", "hey", "राम राम", "good morning", "शुभ प्रभात", "कैसे हो", "how are you", "what's up"],
        greetingAnswer: "🙏 राम-राम जी!\n\nMain Chhapola Agriculture का AI Munshi हूँ।\n\nआप मुझसे पूछ सकते हैं:\n- 📊 किसानों का हिसाब\n- ✍️ नई entry डालना\n- 📄 PDF बनाना\n- 🔧 Tractor maintenance\n- 🛠️ Spare parts search\n\nबस natural Hindi में बोलें या लिखें! 🎤"
    }
};

// ==========================================
// PHASE 2 DATA ACCESSOR
// Loads tractor, services, diesel, reminders from Firebase
// ==========================================

async function loadPhase2Data() {
    const result = { tractor: null, services: [], diesel: [], reminders: [] };
    try {
        const user = window.auth ? window.auth.currentUser : null;
        if (!user || typeof db === "undefined" || !db) return result;
        const uid = user.uid;

        // Tractor details
        try {
            const tractorSnap = await db.collection("tractor_details").doc(uid).get();
            if (tractorSnap.exists()) result.tractor = tractorSnap.data();
        } catch(e) {}

        // Services
        try {
            const svcSnap = await db.collection("tractor_services")
                .where("ownerUid", "==", uid).get();
            svcSnap.forEach(d => result.services.push({ id: d.id, ...d.data() }));
            result.services.sort((a,b) => (b.date||"").localeCompare(a.date||""));
        } catch(e) {}

        // Diesel
        try {
            const dieselSnap = await db.collection("tractor_diesel")
                .where("ownerUid", "==", uid).get();
            dieselSnap.forEach(d => result.diesel.push({ id: d.id, ...d.data() }));
            result.diesel.sort((a,b) => (b.date||"").localeCompare(a.date||""));
        } catch(e) {}

        // Reminders
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
// Loads saved parts and search history
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
// SEMANTIC INTENT DETECTOR
// Beyond regex — understands question meaning
// ==========================================

function detectSemanticIntent(text) {
    const q = String(text || "").toLowerCase().trim();

    // "calculate" / "estimate" questions — only when there's no farmer/action context
    if (/\b(कितना बनेगा|कितना होगा|calculate|estimate|अनुमान|हिसाब लगाओ|जोड़कर बताओ|multiply|गुणा|plus|जोड़)\b/.test(q)) {
        // Don't trigger if action patterns are present
        if (!/\b(डाल|जमा|बना|हटा|भेज)\b/.test(q)) {
            return "CALCULATE";
        }
    }

    // "how to" / help questions
    if (/\b(कैसे|कैसा|how to|how do|kaise|कहाँ है|where|कौन सा|which|what is|what are|बताओ कि|explain|कहाँ मिल|कहाँ देख|कैसे कर|कैसे खोल)\b/.test(q)) {
        // Only if NOT about a farmer's data
        if (!/\b(किसान|farmer|बाकी|balance|paid|income|total|record)\b/.test(q)) {
            return "HOW_TO";
        }
    }
    // "क्या कर सकते" / capabilities
    if (/\b(क्या कर सकते|what can you|capabilities|feature|क्या क्या करो|तुम क्या करते|help me|मेरी मदद|क्या हो)\b/.test(q)) {
        return "HOW_TO";
    }
    // "nahi samjha" / clarification questions
    if (/\b(samjh|समझ|explain|समझाओ|कैसे होता है)\b/.test(q)) {
        return "HOW_TO";
    }

    // Expense / kharch questions
    if (/\b(खर्च|expense|kharch|cost|दाम|price|कितना गया|कितना लगा|spending)\b/.test(q)) {
        return "EXPENSE";
    }

    // Maintenance / tractor questions
    if (/\b(tractor|ट्रैक्टर|service|सर्विस|diesel|डीजल|oil|तेल|repair|मरम्मत|reminder|रिमाइंडर|maintenance)\b/.test(q)) {
        return "MAINTENANCE";
    }

    // Spare part questions
    if (/\b(spare|part|पार्ट|filter|फिल्टर|bearing|bearing|clutch|brake|belt|tyre|टायर)\b/.test(q)) {
        return "SPARE_PART";
    }

    // Compare income vs expense
    if (/\b(कमाई.*खर्च|income.*expense|खर्च.*कमाई|expense.*income|तुलना|compare|profit|नफा|loss|नुकसान|net profit)\b/.test(q)) {
        return "COMPARE_INCOME_EXPENSE";
    }

    // Daily summary
    if (/\b(आज का|today's|आज|today|दैनिक|daily)\b/.test(q) && /\b(hisab|हिसाब|summary|कमाई|income|summary|report)\b/.test(q)) {
        return "DAILY_SUMMARY";
    }

    // Monthly summary
    if (/\b(महीने?|month|मासिक|monthly)\b/.test(q) && /\b(hisab|हिसाब|summary|कमाई|income|report)\b/.test(q)) {
        return "MONTHLY_SUMMARY";
    }

    // Yearly summary
    if (/\b(साल|year|सालभर|yearly|वार्षिक)\b/.test(q) && /\b(hisab|हिसाब|summary|कमाई|income|report)\b/.test(q)) {
        return "YEARLY_SUMMARY";
    }

    // "What can you do" / capabilities
    if (/\b(क्या कर सकते|what can you|capabilities|feature|क्या क्या करो|तुम क्या करते|help me|मेरी मदद)\b/.test(q)) {
        return "CAPABILITIES";
    }

    // How many farmers / count
    if (/\b(कितने किसान|how many farmer|कुल किसान|total farmer|कितने लोग)\b/.test(q)) {
        return "FARMER_COUNT";
    }

    // Highest/lowest income by farmer
    if (/\b(सबसे ज्यादा कमाई|highest income|most earning|सबसे कम|lowest|least)\b/.test(q)) {
        return "HIGHEST_EARNER";
    }

    return null;
}

// ==========================================
// ENHANCED DATE PARSER
// More natural date expressions
// ==========================================

function enhancedDateParse(text) {
    const q = String(text || "").toLowerCase();
    const today = new Date();
    const result = { date: null, dateRange: null };

    // This year
    if (/\b(इस\s*साल|this\s*year|is\s*saal|उन्नीस\s*सौ|20\d{2})\b/.test(q)) {
        const yearStart = new Date(today.getFullYear(), 0, 1);
        result.dateRange = {
            from: yearStart.toISOString().split("T")[0],
            to: today.toISOString().split("T")[0]
        };
    }
    // Last year
    else if (/\b(पिछले?\s*साल|last\s*year|pichle\s*saal|गत\s*साल)\b/.test(q)) {
        const lastYear = today.getFullYear() - 1;
        const lyStart = new Date(lastYear, 0, 1);
        const lyEnd = new Date(lastYear, 11, 31);
        result.dateRange = {
            from: lyStart.toISOString().split("T")[0],
            to: lyEnd.toISOString().split("T")[0]
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
// Splits "A aur B" type questions
// ==========================================

function splitCompositeQuestion(text) {
    const q = String(text || "").trim();
    // Split on "और", "and", "तथा", "+"
    const parts = q.split(/\s+(?:और|aur|and|तथा|\+)\s+/i);
    if (parts.length > 1 && parts.length <= 3) {
        return parts;
    }
    return [q];
}

// ==========================================
// PUBLIC API
// ==========================================

window.WEBSITE_KNOWLEDGE = WEBSITE_KNOWLEDGE;
window.loadPhase2Data = loadPhase2Data;
window.loadPhase3Data = loadPhase3Data;
window.detectSemanticIntent = detectSemanticIntent;
window.enhancedDateParse = enhancedDateParse;
window.splitCompositeQuestion = splitCompositeQuestion;
