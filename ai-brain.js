// ==========================================
// RAJ AI BRAIN v1.0
// Part 1 - Foundation
// ==========================================

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

// ==========================================
// CONFIG
// ==========================================

window.RAJ_AI.brainConfig = {

    debug: false,

    autoInit: true,

    cacheEnabled: true

};

// ==========================================
// LOG
// ==========================================

function brainLog(...msg){

    if(window.RAJ_AI.brainConfig.debug){

        console.log("[RAJ BRAIN]", ...msg);

    }

}

// ==========================================
// INIT
// ==========================================

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

// ==========================================
// RESET
// ==========================================

function resetBrain(){

    window.RAJ_AI.brain.cache.clear();

    window.RAJ_AI.brain.statistics = {

        totalQuestions:0,

        totalAnswers:0,

        totalThinking:0,

        lastQuestion:""

    };

}

// ==========================================
// PUBLIC API
// ==========================================

window.initBrain = initBrain;

window.resetBrain = resetBrain;
// ==========================================
// PART 2
// THINKING + MEMORY + SEARCH
// ==========================================

// ---------- Think ----------
async function think(question){

    if(!question){

        return {
            question: "",
            records: [],
            analysis: null
        };

    }

    window.RAJ_AI.brain.thinking = true;

    window.RAJ_AI.brain.statistics.totalThinking++;

    window.RAJ_AI.brain.statistics.lastQuestion = question;

    // ==========================================
    // CENTRAL MEMORY → BRAIN
    // ==========================================

    let processed = String(question).trim();

    let records = [];

    if(
        window.RAJ_AI &&
        window.RAJ_AI.memory &&
        Array.isArray(window.RAJ_AI.memory.records)
    ){

        records = window.RAJ_AI.memory.records;

    }

    // ==========================================
    // ANALYSIS
    // ==========================================

    let analysis = null;

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

    window.RAJ_AI.brain.thinking = false;

    return {

        question: processed,

        records: records,

        analysis: analysis

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
// ==========================================
// PART 3
// AI DECISION + CONTEXT + SMART REPLY
// ==========================================

// ---------- Context ----------
function detectContext(question){

    const q = String(question || "").toLowerCase();

    if(q.includes("बाकी") || q.includes("balance"))
        return "BALANCE";

    if(q.includes("जमा") || q.includes("paid"))
        return "PAID";

    if(q.includes("कुल") || q.includes("income"))
        return "INCOME";

    if(q.includes("किसान"))
        return "FARMER";

    if(q.includes("काम"))
        return "WORK";

    if(q.includes("फसल"))
        return "CROP";

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

    switch(context){

        case "BALANCE":

            return
            "बाकी राशि का रिकॉर्ड मिल गया है।";

        case "PAID":
return "बाकी राशि का रिकॉर्ड मिल गया है.";
            
        case "INCOME":

return "बाकी राशि का रिकॉर्ड मिल गया है.";
        case "WORK":

            return "बाकी राशि का रिकॉर्ड मिल गया है.";

        case "FARMER":
return "बाकी राशि का रिकॉर्ड मिल गया है.";

        case "CROP":

            return "बाकी राशि का रिकॉर्ड मिल गया है.";

        default:

            return "बाकी राशि का रिकॉर्ड मिल गया है.";

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
// ==========================================
// PART 4
// FINAL MASTER CONTROLLER
// ==========================================

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
// ==========================================
// ==========================================
// END OF RAJ AI BRAIN
// ==========================================
