// ==========================================
// RAJ AI DIAGNOSTIC v1.0
// Mobile System Health Checker
// ==========================================

"use strict";

window.RAJ_AI = window.RAJ_AI || {};

window.RAJ_AI.diagnostic = {
    version: "1.0",
    lastCheck: null
};


// ==========================================
// MODULE CONNECTION CHECK
// ==========================================

function diagnosticCheckModules() {

    const modules = {};

    modules.memory =
        typeof initRajMemory === "function";

    modules.search =
        typeof initSearch === "function";

    modules.language =
        typeof initLanguageEngine === "function";

    modules.learning =
        typeof initLearningEngine === "function";

    modules.analysis =
        typeof initAnalysis === "function" ||
        typeof initAnalysisEngine === "function";

    modules.brain =
        typeof initBrain === "function";

    modules.scanner =
        typeof initScanner === "function";

    modules.voice =
        typeof initVoiceEngine === "function";

    modules.tools =
        typeof initTools === "function";

    modules.actions =
        typeof initActions === "function";

    return modules;
}


// ==========================================
// REAL FUNCTION CHECK
// ==========================================
function diagnosticCheckFunctions() {

    const result = {};

    // ==============================
    // MEMORY
    // ==============================
    result.memory = {
        searchMemory:
            typeof searchMemory === "function",

        refreshRajMemory:
            typeof refreshRajMemory === "function"
    };


    // ==============================
    // SEARCH
    // ==============================
    result.search = {
        searchFarmerRecords:
            typeof searchFarmerRecords === "function",

        universalSearch:
            typeof universalSearch === "function"
    };


    // ==============================
    // LANGUAGE
    // ==============================
    result.language = {
        processLanguage:
            typeof processLanguage === "function",

        detectLanguage:
            typeof detectLanguage === "function",

        normalizeLanguageText:
            typeof normalizeLanguageText === "function",

        smartNameMatch:
            typeof smartNameMatch === "function",

        correctSpelling:
            typeof correctSpelling === "function"
    };


    // ==============================
    // LEARNING
    // ==============================
    result.learning = {
        init:
            typeof initLearningEngine === "function",

        learnQuestion:
            typeof learnQuestion === "function",

        learnFarmer:
            typeof learnFarmer === "function",

        getLearningStatistics:
            typeof getLearningStatistics === "function"
    };


    // ==============================
    // ANALYSIS
    // ==============================
    result.analysis = {
        init:
            typeof initAnalysisEngine === "function" ||
            typeof initAnalysis === "function",

        analyzeQuestion:
            typeof analyzeQuestion === "function"
    };


    // ==============================
    // BRAIN
    // ==============================
    result.brain = {
        init:
            typeof initBrain === "function",

        think:
            typeof think === "function"
    };


    // ==============================
    // SCANNER
    // ==============================
    result.scanner = {
        init:
            typeof initScanner === "function",

        startScanner:
            typeof startScanner === "function"
    };


    // ==============================
    // VOICE
    // ==============================
    result.voice = {
        init:
            typeof initVoiceEngine === "function",

        startListening:
            typeof startListening === "function",

        speakText:
            typeof speakText === "function"
    };


    // ==============================
    // TOOLS
    // ==============================
    result.tools = {
        init:
            typeof initTools === "function",

        calculateIncome:
            typeof calculateIncome === "function",

        calculateBalance:
            typeof calculateBalance === "function"
    };


    // ==============================
    // ACTIONS
    // ==============================
    result.actions = {
        init:
            typeof initActions === "function"
    };


    // ==============================
    // MUNSHI CONNECTION
    // ==============================
    result.munshi = {
        askMunshi:
            typeof askMunshi === "function",

        processRajRequest:
            typeof processRajRequest === "function",

        callGeminiAPI:
            typeof callGeminiAPI === "function"
    };


    return result;
        }

// ==========================================
// DATA CHECK
// ==========================================

function diagnosticCheckMemoryData() {

    let count = 0;

    if (
        window.RAJ_AI &&
        window.RAJ_AI.memory &&
        Array.isArray(window.RAJ_AI.memory.records)
    ) {

        count =
            window.RAJ_AI.memory.records.length;

    }

    return {

        available: count > 0,

        records: count

    };

}


// ==========================================
// CORE CHECK
// ==========================================

function diagnosticCheckCore() {

    if (
        !window.RAJ_AI ||
        !window.RAJ_AI.core
    ) {

        return {

            available: false,

            ready: false

        };

    }

    return {

        available: true,

        initialized:
            !!window.RAJ_AI.core.initialized,

        ready:
            !!window.RAJ_AI.core.ready

    };

}


// ==========================================
// FULL DIAGNOSTIC
// ==========================================

function runRAIAIDiagnostic() {

    const modules =
        diagnosticCheckModules();

    const functions =
        diagnosticCheckFunctions();

    const memory =
        diagnosticCheckMemoryData();

    const core =
        diagnosticCheckCore();

    const report = {

        modules: modules,

        functions: functions,

        memory: memory,

        core: core,

        time: new Date().toLocaleString("hi-IN")

    };

    window.RAJ_AI.diagnostic.lastCheck =
        report;

    return report;

}


// ==========================================
// MOBILE FRIENDLY REPORT
// ==========================================
// ==========================================

function getRAIAIDiagnosticReport() {

    const report = [];

    const add = (icon, text) => {
        report.push(`${icon} ${text}`);
    };

    add("🔧", "RAJ AI DIAGNOSTIC - READ ONLY");

    // ==============================
    // 1. MODULE CHECK
    // ==============================

    const modules = diagnosticCheckModules();

    Object.keys(modules).forEach(name => {

        add(
            modules[name] ? "🟢" : "🔴",
            `Module ${name}: ${modules[name] ? "CONNECTED" : "MISSING"}`
        );

    });


    // ==============================
    // 2. FUNCTION CHECK
    // ==============================

    const functions = diagnosticCheckFunctions();

    Object.keys(functions).forEach(group => {

        const groupData = functions[group];

        Object.keys(groupData).forEach(fn => {

            add(
                groupData[fn] ? "🟢" : "🔴",
                `${group}.${fn}: ${groupData[fn] ? "AVAILABLE" : "MISSING"}`
            );

        });

    });


    // ==============================
    // 3. MEMORY CHECK
    // ==============================

    const memory = diagnosticCheckMemoryData();

    add(
        memory.available ? "🟢" : "🟠",
        `Memory Records: ${memory.records}`
    );


    // ==============================
    // 4. WEBSITE RECORDS
    // ==============================

    if (Array.isArray(window.records)) {

        add(
            "🟢",
            `window.records: ${window.records.length} records`
        );

    } else {

        add(
            "🔴",
            "window.records: NOT AVAILABLE"
        );

    }


    // ==============================
    // 5. CORE
    // ==============================

    const core = diagnosticCheckCore();

    add(
        core.available ? "🟢" : "🔴",
        `RAJ AI Core: ${
            core.available
                ? (core.ready ? "READY" : "CONNECTED BUT NOT READY")
                : "NOT CONNECTED"
        }`
    );


    // ==============================
    // 6. IMPORTANT FLOW CHECK
    // ==============================

    add("🔍", "FINAL FLOW CHECK");

    if (typeof askMunshi === "function") {
        add("🟢", "askMunshi() available");
    } else {
        add("🔴", "askMunshi() missing");
    }

    if (typeof processLocalQuestion === "function") {
        add("🟢", "processLocalQuestion() available");
    } else {
        add("🟠", "processLocalQuestion() missing");
    }

    if (typeof searchFarmerRecords === "function") {
        add("🟢", "searchFarmerRecords() available");
    } else {
        add("🔴", "searchFarmerRecords() missing");
    }

    if (typeof universalSearch === "function") {
        add("🟢", "universalSearch() available");
    } else {
        add("🔴", "universalSearch() missing");
    }

    if (typeof analyzeQuestion === "function") {
        add("🟢", "analyzeQuestion() available");
    } else {
        add("🔴", "analyzeQuestion() missing");
    }

    if (typeof callGeminiAPI === "function") {
        add("🟢", "callGeminiAPI() available");
    } else {
        add("🔴", "callGeminiAPI() missing");
    }


    // ==============================
    // 7. SAFETY
    // ==============================

    add("🛡️", "Diagnostic ने कोई AI/search function execute नहीं किया");
    add("🛡️", "Diagnostic ने कोई record modify/delete नहीं किया");
    add("🛡️", "Diagnostic ने कोई search result generate नहीं किया");


    // ==============================
    // 8. FINAL
    // ==============================

    add("✅", "Diagnostic check complete");

    return report.join("\n");
}
// ==========================================
// PUBLIC API
// ==========================================

window.runRAIAIDiagnostic =
    runRAIAIDiagnostic;

window.getRAIAIDiagnosticReport =
    getRAIAIDiagnosticReport;
