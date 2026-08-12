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
// RAJ AI REAL FUNCTION DIAGNOSTIC v2
// यह module सिर्फ जांच करता है, records को बदलता नहीं
// ==========================================
// ==========================================
// RAJ AI REAL FUNCTION DIAGNOSTIC v2
// INPUT → OUTPUT → RECORD COUNT → FINAL FLOW
// ==========================================
async function getRAIAIDiagnosticReport(testQuestion){
    const report = [];

    const add = (icon, text) => {
        report.push(`${icon} ${text}`);
    };

    add("🔧", "RAJ AI REAL FUNCTION DIAGNOSTIC v2");
    add("❓", `Test Question: ${testQuestion}`);
    add("📦", `Website Records: ${
        Array.isArray(window.records) ? window.records.length : 0
    }`);

    // --------------------------------------
    // FUNCTION TEST HELPER
    // --------------------------------------

    function inspect(name, output) {

        if (output === undefined || output === null) {

            add("🔴", `${name}() → NO OUTPUT`);
            return {
                ok: false,
                records: [],
                output: null
            };

        }

        if (Array.isArray(output)) {

            add(
                output.length
                    ? "🟡"
                    : "🟢",
                `${name}() → ARRAY | Records: ${output.length}`
            );

            // सबसे जरूरी detection
            if (output.length > 0) {

                const first = output[0];

                if (
                    typeof first === "object" &&
                    first !== null
                ) {

                    add(
                        "⚠️",
                        `${name}() ने सीधे RECORD ARRAY लौटाया`
                    );

                    add(
                        "🚨",
                        `POSSIBLE FLOW BUG: ${name}() का output final answer की तरह इस्तेमाल हो सकता है`
                    );
                }
            }

            return {
                ok: true,
                records: output,
                output
            };
        }

        if (typeof output === "object") {

            add(
                "🟢",
                `${name}() → OBJECT`
            );

            if (output.reply) {

                add(
                    "✅",
                    `${name}() ने FINAL REPLY दिया`
                );
            }

            if (
                Array.isArray(output.records)
            ) {

                add(
                    "📊",
                    `${name}() → Records: ${output.records.length}`
                );
            }

            return {
                ok: true,
                records: Array.isArray(output.records)
                    ? output.records
                    : [],
                output
            };
        }

        if (typeof output === "string") {

            add(
                output.trim()
                    ? "🟢"
                    : "🟡",
                `${name}() → TEXT`
            );

            if (output.trim()) {

                add(
                    "💬",
                    `${name}() ने text answer दिया`
                );
            }

            return {
                ok: true,
                records: [],
                output
            };
        }

        add(
            "🟡",
            `${name}() → ${typeof output}`
        );

        return {
            ok: true,
            records: [],
            output
        };
    }


    // --------------------------------------
    // 1. SEARCH FARMER
    // --------------------------------------

    let farmerSearch = null;

    try {

        if (
            typeof searchFarmerRecords === "function"
        ) {

            farmerSearch =
                searchFarmerRecords(testQuestion);

            inspect(
                "searchFarmerRecords",
                farmerSearch
            );

        } else {

            add(
                "🔴",
                "searchFarmerRecords() → FUNCTION NOT FOUND"
            );
        }

    } catch (e) {

        add(
            "🔴",
            `searchFarmerRecords() ERROR → ${e.message}`
        );
    }


    // --------------------------------------
    // 2. UNIVERSAL SEARCH
    // --------------------------------------

    let universal = null;

    try {

        if (
            typeof universalSearch === "function"
        ) {

            universal =
                universalSearch(testQuestion);

            inspect(
                "universalSearch",
                universal
            );

        } else {

            add(
                "🔴",
                "universalSearch() → FUNCTION NOT FOUND"
            );
        }

    } catch (e) {

        add(
            "🔴",
            `universalSearch() ERROR → ${e.message}`
        );
    }


    // --------------------------------------
    // 3. LOCAL AI
    // --------------------------------------

    let local = null;

    try {

        if (
            typeof processLocalQuestion === "function"
        ) {

            local =
                processLocalQuestion(testQuestion);

            const info =
                inspect(
                    "processLocalQuestion",
                    local
                );

            // CRITICAL BUG DETECTION
            if (
                Array.isArray(local) &&
                local.length > 0
            ) {

                add(
                    "🚨",
                    "CRITICAL: processLocalQuestion() ने RECORD ARRAY लौटाया"
                );

                add(
                    "❌",
                    "askMunshi() इसे final answer मान सकता है"
                );

                add(
                    "👉",
                    "यही पूरा record दिखने की सबसे बड़ी suspect जगह है"
                );
            }

        } else {

            add(
                "⚪",
                "processLocalQuestion() → NOT FOUND"
            );
        }

    } catch (e) {

        add(
            "🔴",
            `processLocalQuestion() ERROR → ${e.message}`
        );
    }


    // --------------------------------------
    // 4. SMART ANSWER
    // --------------------------------------

    let smart = null;

    try {

        if (
            typeof answerSmartQuestion === "function"
        ) {

            const sourceRecords =
                Array.isArray(farmerSearch) &&
                farmerSearch.length
                    ? farmerSearch
                    : (
                        Array.isArray(window.records)
                            ? window.records
                            : []
                    );

            smart =
                answerSmartQuestion(
                    testQuestion,
                    sourceRecords
                );

            inspect(
                "answerSmartQuestion",
                smart
            );

        } else {

            add(
                "🔴",
                "answerSmartQuestion() → FUNCTION NOT FOUND"
            );
        }

    } catch (e) {

        add(
            "🔴",
            `answerSmartQuestion() ERROR → ${e.message}`
        );
    }


    // --------------------------------------
    // 5. QUESTION ANALYZER
    // --------------------------------------

    let analysis = null;

    try {

        if (
            typeof analyzeQuestion === "function"
        ) {

            analysis =
                await analyzeQuestion(
                    testQuestion
                );

            inspect(
                "analyzeQuestion",
                analysis
            );

        } else {

            add(
                "🔴",
                "analyzeQuestion() → FUNCTION NOT FOUND"
            );
        }

    } catch (e) {

        add(
            "🔴",
            `analyzeQuestion() ERROR → ${e.message}`
        );
    }


    // --------------------------------------
    // 6. CORE
    // --------------------------------------

    let core = null;

    try {

        if (
            typeof processRajRequest === "function"
        ) {

            core =
                await processRajRequest(
                    testQuestion
                );

            inspect(
                "processRajRequest",
                core
            );

        } else {

            add(
                "⚪",
                "processRajRequest() → NOT FOUND"
            );
        }

    } catch (e) {

        add(
            "🔴",
            `processRajRequest() ERROR → ${e.message}`
        );
    }


    // --------------------------------------
    // FINAL FLOW ANALYSIS
    // --------------------------------------

    add("🚨", "FINAL DIAGNOSIS");
    add("━━━━━━━━━━━━━━━━━━━━", "");

    let bugs = 0;


    // Local array = dangerous
    if (
        Array.isArray(local) &&
        local.length > 0 &&
        typeof local[0] === "object"
    ) {

        bugs++;

        add(
            "🔴",
            "LOCAL AI RECORD ARRAY RETURN कर रहा है"
        );

        add(
            "👉",
            "askMunshi() में यही array final answer बनने की संभावना है"
        );
    }


    // Search records but no answer
    if (
        Array.isArray(farmerSearch) &&
        farmerSearch.length > 0 &&
        !smart &&
        !analysis &&
        !core
    ) {

        bugs++;

        add(
            "🟠",
            "Search records मिल रहे हैं लेकिन कोई final answer नहीं बना"
        );
    }


    // Analysis text
    if (
        typeof analysis === "string" &&
        analysis.trim()
    ) {

        add(
            "🟢",
            "analyzeQuestion() ने वास्तविक answer दिया"
        );
    }


    // Smart answer
    if (
        typeof smart === "string" &&
        smart.trim()
    ) {

        add(
            "🟢",
            "answerSmartQuestion() ने वास्तविक answer दिया"
        );
    }


    // --------------------------------------
    // FINAL RESULT
    // --------------------------------------

    if (bugs > 0) {

        add(
            "🔴",
            `कुल suspect flow problems: ${bugs}`
        );

    } else {

        add(
            "🟢",
            "इन functions में direct flow bug नहीं मिला"
        );

        add(
            "🔍",
            "अब अगला suspect: Gemini/API response या handleSend() final response flow"
        );
    }


    add(
        "🛡️",
        "Diagnostic ने कोई record modify/delete नहीं किया"
    );

    return report.join("\n");
}



// ==========================================
// PUBLIC API
// ==========================================

window.runRAIAIDiagnostic =
    runRAIAIDiagnostic;

window.getRAIAIDiagnosticReport =
    getRAIAIDiagnosticReport;
