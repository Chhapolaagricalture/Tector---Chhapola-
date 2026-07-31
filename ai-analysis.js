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
