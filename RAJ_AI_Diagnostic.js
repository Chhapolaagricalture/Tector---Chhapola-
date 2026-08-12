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

window.getRAIAIDiagnosticReport = function () {

    const out = [];

    const ctx =
        window.RAJ_AI &&
        window.RAJ_AI.munshi &&
        window.RAJ_AI.munshi.context
            ? window.RAJ_AI.munshi.context
            : {};

    // आखिरी असली user question
    const question =
        ctx.lastQuestion ||
        (window.RAJ_AI &&
         window.RAJ_AI.munshi &&
         window.RAJ_AI.munshi.lastQuestion) ||
        "";

    out.push("🔧 RAJ AI REAL FUNCTION DIAGNOSTIC");
    out.push("━━━━━━━━━━━━━━━━━━━━");

    if (!question) {
        out.push("⚠️ अभी कोई पिछला सवाल नहीं मिला।");
        out.push("पहले कोई सामान्य सवाल पूछें, फिर:");
        out.push("system check");
        return out.join("\n");
    }

    out.push(`❓ Test Question: ${question}`);
    out.push("");

    // ------------------------------------------
    // ORIGINAL RECORD COUNT
    // ------------------------------------------

    const originalRecords =
        Array.isArray(window.records)
            ? window.records
            : [];

    out.push(
        `📦 Website Records: ${originalRecords.length}`
    );

    // ------------------------------------------
    // TEST RESULT HELPER
    // ------------------------------------------

    function testFunction(name, fn) {

        try {

            const result = fn();

            let count = null;

            if (Array.isArray(result)) {
                count = result.length;
            }

            if (result && Array.isArray(result.records)) {
                count = result.records.length;
            }

            if (result === null || result === undefined) {

                out.push(`⚠️ ${name} → NULL / NO RESULT`);
                return {
                    name,
                    ok: false,
                    result,
                    count
                };

            }

            out.push(
                `🟢 ${name} → OK` +
                (count !== null
                    ? ` | Records: ${count}`
                    : "")
            );

            return {
                name,
                ok: true,
                result,
                count
            };

        } catch (e) {

            out.push(`🔴 ${name} → ERROR`);
            out.push(`   ${e.message}`);

            return {
                name,
                ok: false,
                error: e
            };
        }
    }

    // ==========================================
    // 1. SEARCH FARMER RECORDS
    // ==========================================

    let farmerSearch = null;

    if (typeof searchFarmerRecords === "function") {

        farmerSearch = testFunction(
            "searchFarmerRecords()",
            () => searchFarmerRecords(question)
        );

    } else {

        out.push("⚪ searchFarmerRecords() → NOT FOUND");

    }

    // ==========================================
    // 2. UNIVERSAL SEARCH
    // ==========================================

    let universal = null;

    if (typeof universalSearch === "function") {

        universal = testFunction(
            "universalSearch()",
            () => universalSearch(question)
        );

    } else {

        out.push("⚪ universalSearch() → NOT FOUND");

    }

    // ==========================================
    // 3. LOCAL AI
    // ==========================================

    let local = null;

    if (typeof processLocalQuestion === "function") {

        local = testFunction(
            "processLocalQuestion()",
            () => processLocalQuestion(question)
        );

    } else {

        out.push("⚪ processLocalQuestion() → NOT FOUND");

    }

    // ==========================================
    // 4. ANALYSIS
    // ==========================================

    let analysis = null;

    if (typeof analyzeQuestion === "function") {

        analysis = testFunction(
            "analyzeQuestion()",
            () => analyzeQuestion(question)
        );

    } else {

        out.push("⚪ analyzeQuestion() → NOT FOUND");

    }

    // ==========================================
    // RECORD COUNT COMPARISON
    // ==========================================

    out.push("");
    out.push("📊 RESULT CHECK");
    out.push("━━━━━━━━━━━━━━━━━━━━");

    const originalCount = originalRecords.length;

    function showCount(label, test) {

        if (!test) return;

        if (typeof test.count !== "number") return;

        if (test.count === originalCount && originalCount > 1) {

            out.push(
                `🔴 ${label} ने पूरे ${originalCount} records लौटाए।`
            );

        } else {

            out.push(
                `🟢 ${label} → ${test.count} record(s)`
            );

        }
    }

    showCount("searchFarmerRecords()", farmerSearch);
    showCount("universalSearch()", universal);
    showCount("processLocalQuestion()", local);

    // ==========================================
    // DATE QUESTION TEST
    // ==========================================

    const dateQuestion =
        /date|दिनांक|तारीख|तारिख|को|काम किया|क्या किया|work|काम/i
            .test(question);

    if (dateQuestion && analysis) {

        if (
            analysis.result &&
            typeof analysis.result === "string" &&
            analysis.result.includes("कोई रिकॉर्ड नहीं")
        ) {

            out.push("");
            out.push(
                "🔴 DATE ANALYSIS → रिकॉर्ड नहीं मिला"
            );

        } else {

            out.push("");
            out.push(
                "🟢 DATE ANALYSIS → response मिला"
            );

        }

    }

    // ==========================================
    // FINAL BUG DETECTION
    // ==========================================

    out.push("");
    out.push("🚨 FINAL DIAGNOSIS");
    out.push("━━━━━━━━━━━━━━━━━━━━");

    let bugFound = false;

    if (
        local &&
        typeof local.count === "number" &&
        local.count === originalCount &&
        originalCount > 1
    ) {

        bugFound = true;

        out.push(
            "🔴 BUG: processLocalQuestion()"
        );

        out.push(
            `यह ${originalCount} records लौटा रहा है।`
        );

        out.push(
            "यहीं सबसे पहले सुधार करना चाहिए।"
        );
    }

    if (
        farmerSearch &&
        typeof farmerSearch.count === "number" &&
        farmerSearch.count === originalCount &&
        originalCount > 1 &&
        (!local || local.count !== originalCount)
    ) {

        bugFound = true;

        out.push(
            "🔴 BUG: searchFarmerRecords()"
        );

        out.push(
            `इसने पूरे ${originalCount} records लौटाए।`
        );
    }

    if (
        universal &&
        typeof universal.count === "number" &&
        universal.count === originalCount &&
        originalCount > 1 &&
        (!local || local.count !== originalCount) &&
        (!farmerSearch || farmerSearch.count !== originalCount)
    ) {

        bugFound = true;

        out.push(
            "🔴 BUG: universalSearch()"
        );

        out.push(
            `इसने पूरे ${originalCount} records लौटाए।`
        );
    }

    if (!bugFound) {

        out.push(
            "🟢 इन tested functions में स्पष्ट bug नहीं मिला।"
        );

        out.push(
            "अगला suspect AI request / Gemini response flow है।"
        );

    }

    out.push("");
    out.push(
        "ℹ️ Diagnostic ने records में कोई बदलाव नहीं किया।"
    );

    return out.join("\n");
};

// ==========================================
// PUBLIC API
// ==========================================

window.runRAIAIDiagnostic =
    runRAIAIDiagnostic;

window.getRAIAIDiagnosticReport =
    getRAIAIDiagnosticReport;
