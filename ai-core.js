// ==========================================
// RAJ AI CORE v1.0
// Part 1 - Foundation
// ==========================================

"use strict";

window.RAJ_AI = window.RAJ_AI || {};

window.RAJ_AI.core = {

    version: "1.0",

    initialized: false,

    ready: false,

    loading: false,

    modules: {

        memory:false,

        search:false,

        language:false,

        learning:false,

        analysis:false,

        brain:false,

        scanner:false,

        voice:false,

        tools:false,

        actions:false

    },

    statistics:{

        totalRequests:0,

        totalResponses:0,

        totalErrors:0

    }

};

// ==========================================
// CONFIG
// ==========================================

window.RAJ_AI.coreConfig={

    debug:false,

    autoInitialize:true,

    autoRefresh:true,

    refreshTime:30000

};

// ==========================================
// LOG
// ==========================================

function coreLog(...msg){

    if(window.RAJ_AI.coreConfig.debug){

        console.log("[RAJ CORE]",...msg);

    }

}

// ==========================================
// INIT
// ==========================================

function initCore(){

    if(window.RAJ_AI.core.initialized){

        return;

    }

    window.RAJ_AI.core.loading=true;

    window.RAJ_AI.core.initialized=true;

    window.RAJ_AI.core.loading=false;

    coreLog("Core Ready");

}

// ==========================================
// RESET
// ==========================================

function resetCore(){

    window.RAJ_AI.core.ready=false;

    window.RAJ_AI.core.statistics.totalRequests=0;

    window.RAJ_AI.core.statistics.totalResponses=0;

    window.RAJ_AI.core.statistics.totalErrors=0;

}

// ==========================================
// PUBLIC API
// ==========================================

window.initCore=initCore;

window.resetCore=resetCore;
// ==========================================
// PART 2
// MODULE LOADER + READY CHECK
// ==========================================

// ---------- Module Check ----------
function checkModules(){

    window.RAJ_AI.core.modules.memory =
        typeof initRajMemory === "function";

    window.RAJ_AI.core.modules.search =
        typeof initSearch === "function";

    window.RAJ_AI.core.modules.language =
        typeof initLanguage === "function";

    window.RAJ_AI.core.modules.learning =
        typeof initLearning === "function";

    window.RAJ_AI.core.modules.analysis =
        typeof initAnalysis === "function";

    window.RAJ_AI.core.modules.brain =
        typeof initBrain === "function";

    window.RAJ_AI.core.modules.scanner =
        typeof initScanner === "function";

    window.RAJ_AI.core.modules.voice =
        typeof initVoiceEngine === "function";

    window.RAJ_AI.core.modules.tools =
        typeof initTools === "function";

    window.RAJ_AI.core.modules.actions =
        typeof initActions === "function";

}

// ---------- Initialize ----------
async function initializeModules(){

    try{

        if(typeof initRajMemory==="function")
            await initRajMemory();

        if(typeof initSearch==="function")
            initSearch();

        if(typeof initLanguage==="function")
            initLanguage();

        if(typeof initLearning==="function")
            initLearning();

        if(typeof initAnalysis==="function")
            initAnalysis();

        if(typeof initBrain==="function")
            initBrain();

        if(typeof initScanner==="function")
            initScanner();

        if(typeof initVoiceEngine==="function")
            initVoiceEngine();

        if(typeof initTools==="function")
            initTools();

        if(typeof initActions==="function")
            initActions();

        checkModules();

        window.RAJ_AI.core.ready = true;

        coreLog("All Modules Loaded");

    }catch(e){

        console.error(e);

        window.RAJ_AI.core.statistics.totalErrors++;

    }

}

// ---------- Ready ----------
function isRajAIReady(){

    return window.RAJ_AI.core.ready;

}

// ---------- Public ----------
window.checkModules = checkModules;

window.initializeModules = initializeModules;

window.isRajAIReady = isRajAIReady;
// ==========================================
// PART 3
// REQUEST ROUTER + TASK DISPATCHER
// ==========================================

// ---------- Request ----------
async function processRajRequest(request){

    try{

        window.RAJ_AI.core.statistics.totalRequests++;

        if(!window.RAJ_AI.core.ready){

            throw new Error("Raj AI Not Ready");

        }

        const response = await dispatchRajTask(request);

        window.RAJ_AI.core.statistics.totalResponses++;

        return response;

    }catch(e){

        console.error(e);

        window.RAJ_AI.core.statistics.totalErrors++;

        return {

            success:false,

            message:e.message

        };

    }

}

// ---------- Dispatcher ----------
async function dispatchRajTask(request){

    const intent = detectIntent(request);
    const priority = getModulePriority(intent);

    for(const module of priority){

        try{

            switch(module){

                case "memory":

                    if(typeof searchMemory==="function"){

                        const records = searchMemory(request);

                        if(records && records.length){

                            return{
                                success:true,
                                source:"memory",
                                records:records
                            };

                        }

                    }

                    break;

                case "search":

                    if(typeof searchFarmerRecords==="function"){

                        const records =
                            await searchFarmerRecords(request);

                        if(records && records.length){

                            return{
                                success:true,
                                source:"search",
                                records:records
                            };

                        }

                    }

                    break;
case "analysis":

    if(typeof analyzeQuestion==="function"){

        const reply =
            await analyzeQuestion(request);

        if(reply){

            return{
                success:true,
                source:"analysis",
                reply:reply
            };

        }

    }

    break;


                case "brain":

                    if(typeof think==="function"){

                        const result =
                            await think(request);

                        if(result && result.success){

                            return result;

                        }

                    }

                    break;

                case "scanner":

                    if(typeof startScanner==="function"){

                        return{
                            success:true,
                            source:"scanner"
                        };

                    }

                    break;

                case "voice":

                    if(typeof startVoiceRecognition==="function"){

                        return{
                            success:true,
                            source:"voice"
                        };

                    }

                    break;

                case "learning":

                    if(typeof learnRajAI==="function"){

                        return{
                            success:true,
                            source:"learning"
                        };

                    }

                    break;

            }

        }catch(e){

            console.error(e);

        }

    }

    

    return {
        success: false,
        source: "gemini"
    };

                    }


// ---------- Refresh ----------
async function refreshCoreModules(){

    try{

        if(typeof refreshRajMemory==="function"){

            await refreshRajMemory();

        }

        if(typeof refreshAnalysis==="function"){

            await refreshAnalysis();

        }

        if(typeof refreshVoiceEngine==="function"){

            refreshVoiceEngine();

        }

        if(typeof refreshTools==="function"){

            refreshTools();

        }

        if(typeof refreshActions==="function"){

            refreshActions();

        }

        coreLog("Core Refreshed");

    }catch(e){

        console.error(e);

    }

}

// ---------- Statistics ----------
function getCoreStatistics(){

    return window.RAJ_AI.core.statistics;

}

// ---------- Public ----------
window.processRajRequest = processRajRequest;

window.dispatchRajTask = dispatchRajTask;

window.refreshCoreModules = refreshCoreModules;

window.getCoreStatistics = getCoreStatistics;
// ==========================================
// PART 4
// HEALTH + AUTO INIT + FINAL API
// ==========================================

// ---------- Health ----------
function checkCoreHealth(){

    return {

        status:
            window.RAJ_AI.core.ready ? "READY" : "NOT_READY",

        initialized:
            window.RAJ_AI.core.initialized,

        modules:
            window.RAJ_AI.core.modules,

        statistics:
            window.RAJ_AI.core.statistics

    };

}

// ---------- Refresh Loop ----------
function startCoreAutoRefresh(){

    if(!window.RAJ_AI.coreConfig.autoRefresh){

        return;

    }

    setInterval(async()=>{

        await refreshCoreModules();

    },window.RAJ_AI.coreConfig.refreshTime);

}

// ---------- Refresh ----------
function refreshCore(){

    checkModules();

    coreLog("Core Refreshed");

}

// ---------- Auto Init ----------
window.addEventListener("load",async()=>{

    if(window.RAJ_AI.coreConfig.autoInitialize){

        initCore();

        await initializeModules();

        refreshCore();

        startCoreAutoRefresh();

    }

});

// ---------- Public API ----------
window.checkCoreHealth =
    checkCoreHealth;

window.startCoreAutoRefresh =
    startCoreAutoRefresh;

window.refreshCore =
    refreshCore;
// ==========================================
// PART 5
// INTENT DETECTOR + PRIORITY ENGINE
// ==========================================

function detectIntent(text){

    text = (text || "").toLowerCase();

    if(/scan|scanner|फोटो|स्कैन/.test(text))
        return "scanner";

    if(/voice|mic|बोल|आवाज/.test(text))
        return "voice";

    if(/सीख|learn|remember|याद/.test(text))
        return "learning";

    if(/बाकी|balance|total|कुल|हिसाब|payment|paid/.test(text))
        return "analysis";

    if(/किसान|farmer|name|नाम/.test(text))
        return "search";

    return "brain";
}

function getModulePriority(intent){

    switch(intent){

        case "search":
            return ["memory","search","brain","gemini"];

        case "analysis":
    return ["analysis","memory","brain","gemini"];

        case "scanner":
            return ["scanner","brain","gemini"];

        case "voice":
            return ["voice","brain","gemini"];

        case "learning":
            return ["learning","brain","gemini"];

        default:
            return ["brain","gemini"];

    }

}

window.detectIntent = detectIntent;
window.getModulePriority = getModulePriority;

// ==========================================
// END OF RAJ AI CORE
// ==========================================
