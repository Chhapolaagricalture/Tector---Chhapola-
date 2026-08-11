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

    return {

        memory:
            typeof searchMemory === "function",

        search:
            typeof searchFarmerRecords === "function" ||
            typeof universalSearch === "function",

        language:
            typeof initLanguageEngine === "function" &&
            typeof processLanguage === "function",

        learning:
            typeof initLearningEngine === "function" &&
            typeof learnQuestion === "function" &&
            typeof autoLearnRecord === "function",

        analysis:
            typeof analyzeQuestion === "function",

        brain:
            typeof think === "function",

        scanner:
            typeof startScanner === "function",

        voice:
            typeof startVoiceRecognition === "function",

        tools:
            typeof calculateIncome === "function" ||
            typeof calculateBalance === "function",

        actions:
            typeof initActions === "function"

    };

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

        const working =
            report.functions[key];

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
