// ==========================================
// RAJ AI ANALYSIS ENGINE v1.0
// Part 1 - Foundation
// ==========================================

"use strict";

window.RAJ_AI = window.RAJ_AI || {};

window.RAJ_AI.analysis = {

    version: "1.0",

    initialized: false,

    reports: [],

    summary: {},

    cache: new Map(),

    statistics: {

        totalAnalysis: 0,

        totalReports: 0,

        lastAnalysis: null

    }

};

// ==========================================
// CONFIG
// ==========================================

window.RAJ_AI.analysisConfig = {

    autoRefresh: true,

    cacheEnabled: true,

    debug: false

};

// ==========================================
// LOG
// ==========================================

function analysisLog(...msg){

    if(window.RAJ_AI.analysisConfig.debug){

        console.log("[RAJ ANALYSIS]", ...msg);

    }

}

// ==========================================
// INIT
// ==========================================

function initAnalysisEngine(){

    if(window.RAJ_AI.analysis.initialized){

        return;

    }

    window.RAJ_AI.analysis.initialized = true;

    analysisLog("Analysis Engine Ready");

}

// ==========================================
// RESET
// ==========================================

function clearAnalysis(){

    window.RAJ_AI.analysis.reports = [];

    window.RAJ_AI.analysis.summary = {};

    window.RAJ_AI.analysis.cache.clear();

}

// ==========================================
// PUBLIC API
// ==========================================

window.initAnalysisEngine = initAnalysisEngine;

window.clearAnalysis = clearAnalysis;
// ==========================================
// PART 2
// FARMER + WORK + INCOME ANALYSIS
// ==========================================

// ---------- Farmer Summary ----------
function analyzeFarmer(records = []) {

    let summary = {

        total: 0,
        paid: 0,
        balance: 0,
        works: {}

    };

    records.forEach(r => {

        summary.total += Number(r.total || 0);

        summary.paid += Number(r.paid || 0);

        const work = r.work || "Unknown";

        summary.works[work] =
            (summary.works[work] || 0) + 1;

    });

    summary.balance =
        summary.total - summary.paid;

    return summary;

}

// ---------- Work Analysis ----------
function analyzeWork(records = []) {

    const result = {};

    records.forEach(r => {

        const work = r.work || "Unknown";

        if (!result[work]) {

            result[work] = {

                count: 0,
                total: 0

            };

        }

        result[work].count++;

        result[work].total +=
            Number(r.total || 0);

    });

    return result;

}

// ---------- Crop Analysis ----------
function analyzeCrop(records = []) {

    const crops = {};

    records.forEach(r => {

        const crop = r.crop || "Unknown";

        crops[crop] =
            (crops[crop] || 0) + 1;

    });

    return crops;

}

// ---------- Income ----------
function calculateIncome(records = []) {

    let income = 0;

    records.forEach(r => {

        income += Number(r.total || 0);

    });

    return income;

}

// ---------- Paid ----------
function calculatePaid(records = []) {

    let paid = 0;

    records.forEach(r => {

        paid += Number(r.paid || 0);

    });

    return paid;

}

// ---------- Balance ----------
function calculateBalance(records = []) {

    return calculateIncome(records)
        - calculatePaid(records);

}

// ---------- Public ----------
window.analyzeFarmer = analyzeFarmer;

window.analyzeWork = analyzeWork;

window.analyzeCrop = analyzeCrop;

window.calculateIncome = calculateIncome;

window.calculatePaid = calculatePaid;

window.calculateBalance = calculateBalance;
// ==========================================
// PART 3
// REPORTS + TOP FARMERS + PENDING ANALYSIS
// ==========================================

// ---------- Daily Report ----------
function generateDailyReport(records = [], date = "") {

    return records.filter(r => (r.date || "") === date);

}
// ==========================================
// SMART QUESTION INTENT
// TOP / MAX / MIN / COUNT
// ==========================================

function detectSmartQuestionIntent(text = "") {

    text = String(text)
        .toLowerCase()
        .replace(/[?!.,]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    // ---------- HIGHEST BALANCE ----------
    if (
        /सबसे\s*ज्यादा\s*(बाकी|बकाया|उधार|बकाया\s*राशि)/.test(text) ||
        /किस\s*किसान.*(बाकी|बकाया|उधार).*ज्यादा/.test(text) ||
        /(किस|किसके|किसका).*सबसे\s*ज्यादा.*(बाकी|बकाया|उधार)/.test(text) ||
        /(highest|maximum|max).*balance/.test(text) ||
        /(highest|maximum|max).*pending/.test(text) ||
        /सबसे\s*ज्यादा.*पैसा.*(लेना|बाकी)/.test(text) ||
        /सबसे\s*ज्यादा.*रकम.*बाकी/.test(text)
    ) {
        return "highest_balance";
    }

    // ---------- HIGHEST WORK COUNT ----------
    if (
        /सबसे\s*ज्यादा\s*(काम|कार्य)/.test(text) ||
        /(किस|किसके|किसने).*सबसे\s*ज्यादा\s*(काम|कार्य)/.test(text) ||
        /सबसे\s*अधिक\s*(काम|कार्य)/.test(text) ||
        /(highest|maximum|max).*work/.test(text) ||
        /most\s*work/.test(text) ||
        /सबसे\s*ज्यादा.*बार.*काम/.test(text) ||
        /सबसे\s*ज्यादा.*entry/.test(text) ||
        /सबसे\s*ज्यादा.*entries/.test(text)
    ) {
        return "highest_work";
    }

    // ---------- HIGHEST TOTAL ----------
    if (
        /सबसे\s*ज्यादा\s*(कुल|total|राशि|कमाई|कमाया)/.test(text) ||
        /(किस|किसका|किसने).*सबसे\s*ज्यादा.*(कुल|total|कमाया|कमाई)/.test(text) ||
        /(highest|maximum|max).*total/.test(text) ||
        /सबसे\s*बड़ी.*राशि/.test(text)
    ) {
        return "highest_total";
    }

    // ---------- HIGHEST PAID ----------
    if (
        /सबसे\s*ज्यादा\s*(जमा|paid|भुगतान)/.test(text) ||
        /(किस|किसने|किसका).*सबसे\s*ज्यादा.*(जमा|paid|भुगतान)/.test(text) ||
        /(highest|maximum|max).*paid/.test(text)
    ) {
        return "highest_paid";
    }

    // ---------- TOTAL FARMERS ----------
    if (
        /कुल\s*(कितने|कितना)?\s*(किसान|farmer)/.test(text) ||
        /कितने\s*(किसान|farmer).*हैं/.test(text) ||
        /(total|how many).*farmer/.test(text) ||
        /कुल\s*किसान/.test(text)
    ) {
        return "total_farmers";
    }

    return "";
}


// ==========================================
// SMART QUESTION ANSWER
// ==========================================

function answerSmartQuestion(text, records = []) {

    const intent = detectSmartQuestionIntent(text);

    if (!intent) {
        return null;
    }

    if (!Array.isArray(records) || !records.length) {
        return "राम-राम जी, अभी कोई रिकॉर्ड उपलब्ध नहीं है।";
    }


    // ======================================
    // सबसे ज्यादा बाकी
    // ======================================

    if (intent === "highest_balance") {

        const farmers = {};

        records.forEach(r => {

            const name =
                String(r.name || "अज्ञात").trim();

            const total =
                Number(r.total || 0);

            const paid =
                Number(r.paid || 0);

            // balance field हो तो भी calculation सही रखेंगे
            const balance =
                total - paid;

            if (!farmers[name]) {
                farmers[name] = {
                    total: 0,
                    paid: 0,
                    balance: 0
                };
            }

            farmers[name].total += total;
            farmers[name].paid += paid;
            farmers[name].balance += balance;

        });

        const result =
            Object.entries(farmers)
                .sort((a,b) =>
                    b[1].balance - a[1].balance
                )[0];

        if (!result) {
            return "राम-राम जी, कोई किसान रिकॉर्ड नहीं मिला।";
        }

        return `👨‍🌾 ${result[0]} पर सबसे ज्यादा बाकी है: ₹${result[1].balance}`;
    }


    // ======================================
    // सबसे ज्यादा काम
    // ======================================

    if (intent === "highest_work") {

        const farmers = {};

        records.forEach(r => {

            const name =
                String(r.name || "अज्ञात").trim();

            if (!farmers[name]) {
                farmers[name] = {
                    count: 0,
                    total: 0
                };
            }

            farmers[name].count++;

            farmers[name].total +=
                Number(r.total || 0);

        });

        const result =
            Object.entries(farmers)
                .sort((a,b) =>
                    b[1].count - a[1].count
                )[0];

        if (!result) {
            return "राम-राम जी, कोई किसान रिकॉर्ड नहीं मिला।";
        }

        return `👨‍🌾 ${result[0]} ने सबसे ज्यादा काम कराया: ${result[1].count} बार`;
    }


    // ======================================
    // सबसे ज्यादा कुल
    // ======================================

    if (intent === "highest_total") {

        const farmers = {};

        records.forEach(r => {

            const name =
                String(r.name || "अज्ञात").trim();

            farmers[name] =
                (farmers[name] || 0) +
                Number(r.total || 0);

        });

        const result =
            Object.entries(farmers)
                .sort((a,b) => b[1] - a[1])[0];

        if (!result) {
            return "राम-राम जी, कोई रिकॉर्ड नहीं मिला।";
        }

        return `👨‍🌾 ${result[0]} का कुल हिसाब सबसे ज्यादा है: ₹${result[1]}`;
    }


    // ======================================
    // सबसे ज्यादा जमा
    // ======================================

    if (intent === "highest_paid") {

        const farmers = {};

        records.forEach(r => {

            const name =
                String(r.name || "अज्ञात").trim();

            farmers[name] =
                (farmers[name] || 0) +
                Number(r.paid || 0);

        });

        const result =
            Object.entries(farmers)
                .sort((a,b) => b[1] - a[1])[0];

        if (!result) {
            return "राम-राम जी, कोई जमा रिकॉर्ड नहीं मिला।";
        }

        return `👨‍🌾 ${result[0]} ने सबसे ज्यादा जमा किया है: ₹${result[1]}`;
    }


    // ======================================
    // कुल किसान
    // ======================================

    if (intent === "total_farmers") {

        const names = new Set();

        records.forEach(r => {

            const name =
                String(r.name || "").trim();

            if (name) {
                names.add(name);
            }

        });

        return `राम-राम जी, हमारे रिकॉर्ड में कुल ${names.size} किसान हैं।`;
    }


    return null;
        }
// ==========================================
// QUESTION ANALYZER
// ==========================================

function normalizeQuestionDate(value = "") {

    value = String(value).trim();

    let m;

    // DD/MM/YYYY
    m = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);

    if (m) {
        return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
    }

    // YYYY/MM/DD or YYYY-MM-DD
    m = value.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);

    if (m) {
        return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
    }

    return value;
}


async function analyzeQuestion(question = "") {

    const text = String(question).trim().toLowerCase();

    const records =
        window.RAJ_AI &&
        window.RAJ_AI.memory &&
        Array.isArray(window.RAJ_AI.memory.records)
            ? window.RAJ_AI.memory.records
            : [];
const smartReply = answerSmartQuestion(text, records);

if (smartReply) {
    return smartReply;
}
    // ---------- DATE ----------
    const monthNames = {
    january: "01", jan: "01", जनवरी: "01",
    february: "02", feb: "02", फरवरी: "02",
    march: "03", mar: "03", मार्च: "03",
    april: "04", apr: "04", अप्रैल: "04",
    may: "05", मई: "05",
    june: "06", jun: "06", जून: "06",
    july: "07", jul: "07", जुलाई: "07",
    august: "08", aug: "08", अगस्त: "08",
    september: "09", sep: "09", सितंबर: "09", सितम्बर: "09",
    october: "10", oct: "10", अक्टूबर: "10",
    november: "11", nov: "11", नवंबर: "11", नवम्बर: "11",
    december: "12", dec: "12", दिसंबर: "12", दिसम्बर: "12"
};

let date = "";

// 24/06/2026 या 24-06-2026
let numericDate = text.match(
    /(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/
);

if (numericDate) {

    date =
        `${numericDate[3]}-${numericDate[2].padStart(2,"0")}-${numericDate[1].padStart(2,"0")}`;

} else {

    // 24 June 2026 / 24 जून 2026
    let monthDate = text.match(
        /(\d{1,2})\s*(january|jan|जनवरी|february|feb|फरवरी|march|mar|मार्च|april|apr|अप्रैल|may|मई|june|jun|जून|july|jul|जुलाई|august|aug|अगस्त|september|sep|सितंबर|सितम्बर|october|oct|अक्टूबर|november|nov|नवंबर|नवम्बर|december|dec|दिसंबर|दिसम्बर)\s*(\d{4})/i
    );

    if (monthDate) {

        const day = monthDate[1].padStart(2,"0");
        const month = monthNames[monthDate[2].toLowerCase()];
        const year = monthDate[3];

        date = `${year}-${month}-${day}`;
    }
}
if (date) {

    const dailyRecords =
        records.filter(r => {

            return normalizeQuestionDate(r.date || "") === date;

        });

    if (!dailyRecords.length) {

        return `माफ कीजिए, ${question} का कोई रिकॉर्ड नहीं मिला।`;

    }
// Work question
if (
    /काम|work|कार्य|क्या किया|क्या हुआ|कौन सा काम|kam|किसान|किस किस/.test(text)
) {

    const lines = dailyRecords.map(r =>
        `👨‍🌾 ${r.name || "अज्ञात"} — 🚜 ${r.work || "-"} — ₹${r.total || 0}`
    );

    return `📅 ${question} को:\n${lines.join("\n")}`;

}

    // General date question
    return dailyRecords.map(r =>
        `👨‍🌾 ${r.name || "अज्ञात"} — 🚜 ${r.work || "-"} — ₹${r.total || 0}`
    ).join("\n");

}
}
window.analyzeQuestion = analyzeQuestion;
// ---------- Monthly Report ----------
function generateMonthlyReport(records = [], month = "") {

    return records.filter(r =>
        (r.date || "").startsWith(month)
    );

}

// ---------- Yearly Report ----------
function generateYearlyReport(records = [], year = "") {

    return records.filter(r =>
        (r.date || "").startsWith(year)
    );

}

// ---------- Pending ----------
function getPendingRecords(records = []) {

    return records.filter(r =>
        Number(r.balance || 0) > 0
    );

}

// ---------- Top Farmers ----------
function getTopFarmers(records = []) {

    const farmers = {};

    records.forEach(r => {

        const name = r.name || "Unknown";

        if (!farmers[name]) {

            farmers[name] = 0;

        }

        farmers[name] += Number(r.total || 0);

    });

    return Object.entries(farmers)

        .sort((a,b)=>b[1]-a[1])

        .slice(0,10);

}

// ---------- Top Works ----------
function getTopWorks(records = []) {

    const works = {};

    records.forEach(r=>{

        const work = r.work || "Unknown";

        works[work] = (works[work]||0)+1;

    });

    return Object.entries(works)

        .sort((a,b)=>b[1]-a[1]);

}

// ---------- Business Summary ----------
function generateBusinessSummary(records = []) {

    return {

        income: calculateIncome(records),

        paid: calculatePaid(records),

        balance: calculateBalance(records),

        pending: getPendingRecords(records).length,

        farmers: getTopFarmers(records),

        works: getTopWorks(records)

    };

}

// ---------- Public ----------
window.generateDailyReport = generateDailyReport;

window.generateMonthlyReport = generateMonthlyReport;

window.generateYearlyReport = generateYearlyReport;

window.getPendingRecords = getPendingRecords;

window.getTopFarmers = getTopFarmers;

window.getTopWorks = getTopWorks;

window.generateBusinessSummary = generateBusinessSummary;
// ==========================================
// PART 4
// AI SUGGESTION + TREND + FINAL
// ==========================================

// ---------- AI Suggestion ----------
function getBusinessSuggestions(records = []) {

    const balance = calculateBalance(records);

    const pending = getPendingRecords(records).length;

    const suggestions = [];

    if (pending > 0) {
        suggestions.push(
            "जिन किसानों की बाकी राशि है उनसे भुगतान लेने की याद दिलाएं।"
        );
    }

    if (balance > 100000) {
        suggestions.push(
            "व्यवसाय अच्छा चल रहा है, नई मशीन जोड़ने पर विचार करें।"
        );
    }

    if (records.length === 0) {
        suggestions.push(
            "रिकॉर्ड जोड़ना शुरू करें ताकि AI विश्लेषण कर सके।"
        );
    }

    return suggestions;

}

// ---------- Trend ----------
function analyzeTrend(records = []) {

    return {

        totalRecords: records.length,

        income: calculateIncome(records),

        paid: calculatePaid(records),

        balance: calculateBalance(records)

    };

}

// ---------- Dashboard ----------
function buildDashboardAnalysis(records = []) {

    const dashboard = {

        summary: generateBusinessSummary(records),

        trend: analyzeTrend(records),

        suggestions: getBusinessSuggestions(records)

    };

    window.RAJ_AI.analysis.summary = dashboard;

    window.RAJ_AI.analysis.statistics.totalAnalysis++;

    window.RAJ_AI.analysis.statistics.lastAnalysis = new Date();

    return dashboard;

}

// ---------- Refresh ----------
function refreshAnalysis() {

    if (typeof getRajStatistics === "function") {

        window.RAJ_AI.analysis.statistics.memory =
            getRajStatistics();

    }

}

// ---------- Auto Init ----------
window.addEventListener("load", () => {

    initAnalysisEngine();

    refreshAnalysis();

});

// ---------- Public ----------
window.buildDashboardAnalysis = buildDashboardAnalysis;

window.getBusinessSuggestions = getBusinessSuggestions;

window.analyzeTrend = analyzeTrend;

window.refreshAnalysis = refreshAnalysis;

// ==========================================
// END OF ANALYSIS ENGINE
// ==========================================
