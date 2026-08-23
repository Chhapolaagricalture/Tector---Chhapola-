// =========================================
// RAJ AI BRAIN v1.0
// Part 1 - Foundation
// =========================================

"use strict";

window.RAJ_AI = window.RAJ_AI || {};

window.RAJ_AI.brain = {

    version: "1.0",

    initialized: false,

    thinking: false,

    memoryReady: false,

    searchReady: false,

    languageReady: false,

    learningReady: false,

    analysisReady: false,

    cache: new Map(),

    statistics: {

        totalQuestions: 0,

        totalAnswers: 0,

        totalThinking: 0,

        lastQuestion: ""

    }

};

// =========================================
// CONFIG
// =========================================

window.RAJ_AI.brainConfig = {

    debug: false,

    autoInit: true,

    cacheEnabled: true

};

// =========================================
// LOG
// =========================================

function brainLog(...msg){

    if(window.RAJ_AI.brainConfig.debug){

        console.log("[RAJ BRAIN]", ...msg);

    }

}

// =========================================
// INIT
// =========================================

function initBrain(){

    if(window.RAJ_AI.brain.initialized){

        return;

    }

    window.RAJ_AI.brain.memoryReady =
        typeof syncRajMemory === "function";

    window.RAJ_AI.brain.searchReady =
    typeof searchAI === "function";

    window.RAJ_AI.brain.languageReady =
        typeof processLanguage === "function";

    window.RAJ_AI.brain.learningReady =
        typeof autoLearn === "function";

    window.RAJ_AI.brain.analysisReady =
        typeof buildDashboardAnalysis === "function";

    window.RAJ_AI.brain.initialized = true;

    brainLog("Brain Ready");

}

// =========================================
// RESET
// =========================================

function resetBrain(){

    window.RAJ_AI.brain.cache.clear();

    window.RAJ_AI.brain.statistics = {

        totalQuestions:0,

        totalAnswers:0,

        totalThinking:0,

        lastQuestion:""

    };

}

// =========================================
// PUBLIC API
// =========================================

window.initBrain = initBrain;

window.resetBrain = resetBrain;
// =========================================
// PART 2
// THINKING + MEMORY + SEARCH
// =========================================

// ---------- Think ----------
async function think(question){

    if(!question){

        return {
            question: "",
            records: [],
            analysis: null,
            reply: ""
        };

    }

    window.RAJ_AI.brain.thinking = true;

    window.RAJ_AI.brain.statistics.totalThinking++;

    window.RAJ_AI.brain.statistics.lastQuestion = question;

    // =========================================
    // CENTRAL MEMORY → BRAIN
    // =========================================
let processed = String(question).trim();

let records = [];
let analysis = null;

// ---- Search for farmer records ----
// Extract farmer name from question and search
let farmerName = null;
if(typeof findFarmer === "function"){
    farmerName = findFarmer(processed);
}

if(farmerName && typeof window.records === "object" && window.records && window.records.length){
    // Filter records by farmer name (case-insensitive)
    const fn = farmerName.trim().toLowerCase();
    records = window.records.filter(r => {
        const name = (r.name || r.farmer || "").trim().toLowerCase();
        return name === fn;
    });
}

// If no farmer found via findFarmer, try searchFarmerRecords
if(!records.length && typeof searchFarmerRecords === "function"){
    try {
        records = searchFarmerRecords(processed) || [];
    } catch(e){}
}

// ---- Analysis ----
if(typeof analyzeQuestion === "function"){

    try{

        analysis =
            await analyzeQuestion(
                processed
            );

    }catch(e){

        console.error(
            "❌ Brain Analysis Error:",
            e
        );

    }

}

// ---- Generate local reply using smartReply ----
let reply = "";
if(records.length > 0 && typeof smartReply === "function"){
    try {
        reply = smartReply(processed, { records: records, analysis: analysis }) || "";
    } catch(e){
        console.error("smartReply error:", e);
    }
}

    window.RAJ_AI.brain.thinking = false;

    return {

        question: processed,

        records: records,

        analysis: analysis,

        reply: reply

    };

        }

// ---------- Answer ----------
function createAnswer(result){

    if(!result){

        return "उत्तर उपलब्ध नहीं।";

    }

    window.RAJ_AI.brain.statistics.totalAnswers++;

    if(result.records && result.records.length>0){

        return result.records;

    }

    return "राम-राम जी, इस प्रश्न का रिकॉर्ड नहीं मिला।";

}

// ---------- Public ----------
window.think = think;

window.createAnswer = createAnswer;
// =========================================
// PART 3
// AI DECISION + CONTEXT + SMART REPLY
// =========================================

// ---------- Context ----------
function detectContext(question){

    const q = String(question || "").toLowerCase();

    if(q.includes("बाकी") || q.includes("balance") || q.includes("baki") || q.includes("bakaya") || q.includes("उधार"))
        return "BALANCE";

    if(q.includes("जमा") || q.includes("paid") || q.includes("diya") || q.includes("दिया") || q.includes("भुगतान"))
        return "PAID";

    if(q.includes("कुल") || q.includes("income") || q.includes("कमाई") || q.includes("total") || q.includes("राशि"))
        return "INCOME";

    if(q.includes("किसान") || q.includes("farmer"))
        return "FARMER";

    if(q.includes("काम") || q.includes("work") || q.includes("hero") || q.includes("calti") || q.includes("thresher") || q.includes("morplau") || q.includes("display") || q.includes("spray"))
        return "WORK";

    if(q.includes("फसल") || q.includes("crop") || q.includes("bajra") || q.includes("gehun") || q.includes("गेहूं") || q.includes("बाजरा") || q.includes("चना"))
        return "CROP";

    if(q.includes("तारीख") || q.includes("date") || q.includes("दिन") || q.includes("कल") || q.includes("आज"))
        return "DATE";

    if(q.includes("हिसाब") || q.includes("ledger") || q.includes("record") || q.includes("history"))
        return "LEDGER";

    return "GENERAL";

}

// ---------- Decision ----------
function decideResponse(result){

    if(!result){

        return {

            type:"ERROR",

            message:"उत्तर उपलब्ध नहीं।"

        };

    }

    const count = result.records
        ? result.records.length
        : 0;

    if(count===0){

        return {

            type:"NOT_FOUND",

            message:
            "राम-राम जी, रिकॉर्ड नहीं मिला।"

        };

    }

    return {

        type:"SUCCESS",

        message:"रिकॉर्ड मिल गया।",

        data:result.records

    };

}

// ---------- Smart Reply ----------
function smartReply(question,result){

    const context = detectContext(question);

    const decision = decideResponse(result);

    if(decision.type!=="SUCCESS"){

        return decision.message;

    }

    const records = decision.data || [];
    let total = 0, paid = 0, baki = 0;
    let totalBigha = 0;
    records.forEach(r => {
        total += Number(r.total || 0);
        paid += Number(r.paid || 0);
        baki += Number(r.baki || r.balance || (Number(r.total || 0) - Number(r.paid || 0)));
        totalBigha += Number(r.bigha || r.unit || 0);
    });
    const farmerNames = [...new Set(records.map(r => r.name || r.farmer || ""))].filter(Boolean);
    const farmerList = farmerNames.join(", ");

    switch(context){

        case "BALANCE":
            if (baki > 0) {
                return farmerList
                    ? farmerList + " का बाकी ₹" + baki + " है। (कुल: ₹" + total + ", जमा: ₹" + paid + ")"
                    : "बाकी राशि ₹" + baki + " है। (कुल: ₹" + total + ", जमा: ₹" + paid + ")";
            }
            return "कोई बाकी राशि नहीं है। सभी हिसाब चुकता है।";

        case "PAID":
            return farmerList
                ? farmerList + " ने कुल ₹" + paid + " जमा किया है। (कुल राशि: ₹" + total + ", बाकी: ₹" + baki + ")"
                : "कुल जमा राशि ₹" + paid + " है। (कुल: ₹" + total + ", बाकी: ₹" + baki + ")";

        case "INCOME":
            return "कुल आय ₹" + total + " है। जमा: ₹" + paid + ", बाकी: ₹" + baki + (farmerList ? " (किसान: " + farmerList + ")" : "");

        case "WORK": {
            const works = {};
            records.forEach(r => {
                const w = r.work || "अज्ञात";
                if(!works[w]) works[w] = { count: 0, total: 0, paid: 0 };
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

        case "FARMER":
            return farmerList
                ? farmerList + " के " + records.length + " रिकॉर्ड मिले। कुल: ₹" + total + ", जमा: ₹" + paid + ", बाकी: ₹" + baki
                : "इस किसान का कोई रिकॉर्ड नहीं मिला।";

        case "CROP": {
            const crops = {};
            records.forEach(r => {
                const c = r.crop || "बिना फसल";
                if(!crops[c]) crops[c] = { count: 0, total: 0 };
                crops[c].count++;
                crops[c].total += Number(r.total || 0);
            });
            const cropList = Object.keys(crops).map(c => c + " (" + crops[c].count + " बार): ₹" + crops[c].total);
            return "फसल विवरण:\n" + cropList.join("\n");
        }

        case "DATE": {
            const dates = {};
            records.forEach(r => {
                const d = r.date || "अज्ञात तारीख";
                if(!dates[d]) dates[d] = [];
                dates[d].push(r);
            });
            let dateReply = (farmerList ? farmerList + " का तारीख-वार विवरण:\n" : "तारीख-वार विवरण:\n");
            Object.keys(dates).sort().forEach(d => {
                const dr = dates[d];
                const dTotal = dr.reduce((s,r) => s + Number(r.total || 0), 0);
                const dPaid = dr.reduce((s,r) => s + Number(r.paid || 0), 0);
                dateReply += d + ": " + dr.length + " एंट्री, ₹" + dTotal + (dPaid > 0 ? " (जमा ₹" + dPaid + ")" : "") + "\n";
            });
            return dateReply.trim();
        }

        case "LEDGER": {
            // Full farmer ledger — detailed list
            let ledger = (farmerList ? farmerList + " का पूरा हिसाब (" + records.length + " एंट्री):\n\n" : "पूरा हिसाब:\n\n");
            records.forEach((r, i) => {
                ledger += (i+1) + ". " + (r.date || "-") + " | " + (r.work || "-") + (r.crop ? " | " + r.crop : "") + " | ₹" + (r.total || 0) + " (जमा: ₹" + (r.paid || 0) + ", बाकी: ₹" + (r.baki || r.balance || 0) + ")\n";
            });
            ledger += "\n📊 कुल: ₹" + total + " | जमा: ₹" + paid + " | बाकी: ₹" + baki;
            return ledger;
        }

        default:
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
            return farmerList
                ? farmerList + " के " + records.length + " रिकॉर्ड मिले। कुल: ₹" + total + ", जमा: ₹" + paid + ", बाकी: ₹" + baki
                : "कुल " + records.length + " रिकॉर्ड मिले। कुल: ₹" + total + ", जमा: ₹" + paid + ", बाकी: ₹" + baki;

    }

}

// ---------- Intelligence ----------
function buildBrainContext(question,result){

    return {

        question,

        context:detectContext(question),

        records:

            result.records
            ? result.records.length
            : 0,

        analysis:

            result.analysis || {}

    };

}

// ---------- Public ----------
window.detectContext = detectContext;

window.decideResponse = decideResponse;

window.smartReply = smartReply;

window.buildBrainContext = buildBrainContext;
// =========================================
// PART 4
// FINAL MASTER CONTROLLER
// =========================================

// ---------- Ask AI ----------
async function askRajAI(question){

    if(!question){

        return "कोई प्रश्न नहीं मिला।";

    }

    window.RAJ_AI.brain.statistics.totalQuestions++;

    const result = await think(question);

    const reply = smartReply(question,result);

    const context = buildBrainContext(question,result);

    return {

        success:true,

        reply:reply,

        context:context,

        records:result.records||[],

        analysis:result.analysis||{}

    };

}

// ---------- Refresh ----------
function refreshBrain(){


    brainLog("Brain Refreshed");

}

// ---------- Health ----------
function getBrainHealth(){

    return {

        initialized:
            window.RAJ_AI.brain.initialized,

        memory:
            window.RAJ_AI.brain.memoryReady,

        search:
            window.RAJ_AI.brain.searchReady,

        language:
            window.RAJ_AI.brain.languageReady,

        learning:
            window.RAJ_AI.brain.learningReady,

        analysis:
            window.RAJ_AI.brain.analysisReady,

        statistics:
            window.RAJ_AI.brain.statistics

    };

}

// ---------- Auto Init ----------
window.addEventListener("load",()=>{

    initBrain();

    refreshBrain();

});

// ---------- Public ----------
window.askRajAI = askRajAI;

window.refreshBrain = refreshBrain;

window.getBrainHealth = getBrainHealth;

// END OF BRAIN v1.1
// =========================================
// =========================================
// END OF RAJ AI BRAIN
// =========================================
