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
        typeof searchMemory === "function";

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

        return "कोई प्रश्न नहीं मिला।";

    }

    window.RAJ_AI.brain.thinking = true;

    window.RAJ_AI.brain.statistics.totalThinking++;

    window.RAJ_AI.brain.statistics.lastQuestion = question;

    

    // Analysis
    let analysis = null;

    if(typeof buildDashboardAnalysis === "function"){

        analysis = buildDashboardAnalysis(records);

    }

    window.RAJ_AI.brain.thinking = false;

    return {

        question: processed,

        records,

        analysis

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

            return
            "जमा राशि का रिकॉर्ड तैयार है।";

        case "INCOME":

            return
            "कुल आय का विवरण तैयार है।";

        case "WORK":

            return
            "काम का रिकॉर्ड मिल गया है।";

        case "FARMER":

            return
            "किसान का पूरा हिसाब मिल गया है।";

        case "CROP":

            return
            "फसल का विवरण तैयार है।";

        default:

            return
            "रिकॉर्ड सफलतापूर्वक प्राप्त हुआ।";

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


    if(typeof refreshLearningEngine==="function")
        refreshLearningEngine();

    if(typeof refreshAnalysis==="function")
        refreshAnalysis();

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
// ==========================================
// PART 5
// FARMER CONTEXT + NAME EXTRACTOR
// ==========================================

// Last Farmer Memory
window.RAJ_AI.brain.lastFarmer = "";

// Extract Farmer Name
function extractFarmerName(question){

    question = String(question || "").trim();

    if(typeof searchFarmerRecords === "function"){

        const words = question.split(/\s+/);

        for(const word of words){

            const result = searchFarmerRecords(word);

            if(result && result.length){

                window.RAJ_AI.brain.lastFarmer = word;

                return word;

            }

        }

    }

    if(
        question.includes("उसका") ||
        question.includes("उसकी") ||
        question.includes("वो") ||
        question.includes("same")
    ){

        return window.RAJ_AI.brain.lastFarmer;

    }

    return "";

}

// Smart Farmer Search
function getFarmerRecords(question){

    const farmer = extractFarmerName(question);

    if(!farmer) return [];

    if(typeof searchFarmerRecords === "function"){

        return searchFarmerRecords(farmer);

    }

    return [];

}

// Public API
window.extractFarmerName = extractFarmerName;
window.getFarmerRecords = getFarmerRecords;
// ==========================================
// PART 6
// SMART BRAIN ROUTER
// ==========================================

// Old Think Backup
const oldThink = think;

// Override Think
think = async function(question){

    const farmerRecords = getFarmerRecords(question);

    if(farmerRecords.length){

        return {

            question,

            farmer: window.RAJ_AI.brain.lastFarmer,

            records: farmerRecords,

            analysis:
                typeof buildDashboardAnalysis==="function"
                ? buildDashboardAnalysis(farmerRecords)
                : {}

        };

    }

    return await oldThink(question);

};

// Update Public
window.think = think;
// ==========================================
// PART 7
// SMART ANSWER ENGINE
// ==========================================

function buildFarmerReply(question, records){

    if(!records || !records.length){

        return "रिकॉर्ड नहीं मिला।";

    }

    const q = String(question).toLowerCase();

    let total = 0;
    let paid = 0;
    let pending = 0;

    records.forEach(r=>{

        total += Number(r.total || 0);
        paid += Number(r.paid || 0);
        pending += Number(r.balance || r.pending || 0);

    });

    if(q.includes("बाकी") || q.includes("balance")){

        return `कुल बाकी ₹${pending}`;

    }

    if(q.includes("जमा") || q.includes("paid")){

        return `कुल जमा ₹${paid}`;

    }

    if(
        q.includes("कुल") ||
        q.includes("हिसाब") ||
        q.includes("income")
    ){

        return `कुल ₹${total} | जमा ₹${paid} | बाकी ₹${pending}`;

    }

    return `${records.length} रिकॉर्ड मिले।`;

}

// Override Reply
const oldSmartReply = smartReply;

smartReply = function(question, result){

    if(result.records && result.records.length){

        return buildFarmerReply(question, result.records);

    }

    return oldSmartReply(question, result);

};

window.smartReply = smartReply;
// ==========================================
// PART 8
// NATURAL LANGUAGE COMMAND ENGINE
// ==========================================

function detectIntent(question){

    const q = String(question || "").toLowerCase();

    if(q.includes("आज"))
        return "TODAY";

    if(q.includes("कल"))
        return "YESTERDAY";

    if(q.includes("महीना") || q.includes("month"))
        return "MONTH";

    if(q.includes("गेहूं") || q.includes("gehu"))
        return "GEHU";

    if(q.includes("चना") || q.includes("chana"))
        return "CHANA";

    if(q.includes("बाजरा") || q.includes("bajra"))
        return "BAJRA";

    if(q.includes("थ्रेसर") || q.includes("thresher"))
        return "THRESHER";

    if(q.includes("स्प्रे") || q.includes("spray"))
        return "SPRAY";

    if(q.includes("हीरो") || q.includes("hero"))
        return "HERO";

    if(q.includes("कल्टी") || q.includes("calti"))
        return "CALTI";

    return "GENERAL";

}

// Backup
const oldBuildReply = buildFarmerReply;

// Override
buildFarmerReply = function(question, records){

    const intent = detectIntent(question);

    if(intent==="THRESHER"){

        records = records.filter(r=>r.work==="Thresher");

    }

    if(intent==="SPRAY"){

        records = records.filter(r=>r.work==="Spray Machine");

    }

    if(intent==="HERO"){

        records = records.filter(r=>r.work==="Hero");

    }

    if(intent==="CALTI"){

        records = records.filter(r=>r.work==="Calti");

    }

    return oldBuildReply(question, records);

};

window.detectIntent = detectIntent;
window.buildFarmerReply = buildFarmerReply;
// ==========================================
// PART 9
// AI MASTER DECISION ENGINE
// ==========================================

function decideTask(question){

    const q = String(question || "").toLowerCase();

    if(
        q.includes("बाकी") ||
        q.includes("जमा") ||
        q.includes("हिसाब") ||
        q.includes("किसान")
    ){
        return "FARMER_SEARCH";
    }

    if(
        q.includes("थ्रेसर") ||
        q.includes("spray") ||
        q.includes("hero") ||
        q.includes("calti")
    ){
        return "WORK_SEARCH";
    }

    if(
        q.includes("आज") ||
        q.includes("कल") ||
        q.includes("महीना")
    ){
        return "DATE_SEARCH";
    }

    return "GENERAL";
}

const oldAskRajAI = askRajAI;

askRajAI = async function(question){

    const task = decideTask(question);

    const result = await think(question);

    return {

        success: true,

        task: task,

        reply: smartReply(question, result),

        records: result.records || [],

        analysis: result.analysis || {},

        context: buildBrainContext(question, result)

    };

};

window.askRajAI = askRajAI;
window.decideTask = decideTask;


// ==========================================
// END OF BRAIN v1.1
// ==========================================
// ==========================================
// END OF RAJ AI BRAIN
// ==========================================
