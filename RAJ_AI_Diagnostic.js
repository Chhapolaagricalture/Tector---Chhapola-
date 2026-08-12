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

function getRAIAIDiagnosticReport() {

    const report =
        runRAIAIDiagnostic();

    const names = {

        memory: "🧠 Memory",

        search: "🔎 Search",

        language: "🌐 Language",

        learning: "📚 Learning",

        analysis: "📊 Analysis",

        brain: "🧠 Brain",

        scanner: "📷 Scanner",

        voice: "🎤 Voice",

        tools: "🛠️ Tools",

        actions: "⚡ Actions"

    };

    let lines = [];

    lines.push("🔍 RAJ AI SYSTEM DIAGNOSTIC");

    lines.push("");

    let ok = 0;
    let total = 0;

    Object.keys(names).forEach(key => {

        total++;

        const connected =
    report.modules[key];

const functionGroup =
    report.functions[key] || {};

const working =
    Object.values(functionGroup).some(Boolean);

if (connected && working) {

            lines.push(
                `${names[key]} — ✅ Working`
            );

            ok++;

        } else if (connected) {

            lines.push(
                `${names[key]} — ⚠️ Connected`
            );

        } else {

            lines.push(
                `${names[key]} — ❌ Not Connected`
            );

        }

    });

    lines.push("");

    lines.push(
        `📊 Modules OK: ${ok}/${total}`
    );

    lines.push("");

    lines.push(
        `🔥 Firebase/Memory Records: ${report.memory.records}`
    );

    lines.push(
        `🔗 Core Initialized: ${
            report.core.initialized ? "✅" : "❌"
        }`
    );

    lines.push(
        `🚀 Core Ready: ${
            report.core.ready ? "✅" : "❌"
        }`
    );

    lines.push("");

    lines.push(
        `🕒 Check: ${report.time}`
    );

    return lines.join("\n");

}


// ==========================================
// PUBLIC API
// ==========================================

window.runRAIAIDiagnostic =
    runRAIAIDiagnostic;

window.getRAIAIDiagnosticReport =
    getRAIAIDiagnosticReport;
