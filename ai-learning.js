// ==========================================
// RAJ AI LEARNING ENGINE v1.0
// Part 1 - Foundation
// ==========================================

"use strict";

window.RAJ_AI = window.RAJ_AI || {};

window.RAJ_AI.learning = {

    version: "1.0",

    initialized: false,

    learning: false,

    cache: new Map(),

    farmers: new Map(),

    questions: new Map(),

    suggestions: new Map(),

    history: [],

    statistics: {

        totalQuestions: 0,

        totalLearning: 0,

        totalSuggestions: 0

    }

};

// ==========================================
// CONFIG
// ==========================================

window.RAJ_AI.learningConfig = {

    autoLearn: true,

    offlineCache: true,

    maxHistory: 500,

    debug: false

};

// ==========================================
// LOG
// ==========================================

function learningLog(...msg){

    if(window.RAJ_AI.learningConfig.debug){

        console.log("[RAJ LEARNING]",...msg);

    }

}

// ==========================================
// SAVE CACHE
// ==========================================

function saveLearningCache(){

    if(!window.RAJ_AI.learningConfig.offlineCache) return;

    try{

        localStorage.setItem(

            "RAJ_AI_LEARNING",

            JSON.stringify({

                history:window.RAJ_AI.learning.history,

                statistics:window.RAJ_AI.learning.statistics

            })

        );

    }catch(e){

        learningLog(e);

    }

}

// ==========================================
// LOAD CACHE
// ==========================================

function loadLearningCache(){

    try{

        const cache=localStorage.getItem("RAJ_AI_LEARNING");

        if(!cache) return;

        const data=JSON.parse(cache);

        window.RAJ_AI.learning.history=data.history||[];

        window.RAJ_AI.learning.statistics=data.statistics||{

            totalQuestions:0,

            totalLearning:0,

            totalSuggestions:0

        };

    }catch(e){

        learningLog(e);

    }

}

// ==========================================
// INIT
// ==========================================

function initLearningEngine(){

    if(window.RAJ_AI.learning.initialized){

        return;

    }

    loadLearningCache();

    window.RAJ_AI.learning.initialized=true;

    learningLog("Learning Engine Ready");

}

// ==========================================
// PUBLIC API
// ==========================================

window.initLearningEngine=initLearningEngine;

window.saveLearningCache=saveLearningCache;

window.loadLearningCache=loadLearningCache;
// ==========================================
// PART 2
// LEARNING + PATTERN + SUGGESTIONS
// ==========================================

// ---------- Learn Question ----------
function learnQuestion(question) {

    if (!question) return;

    question = normalizeLanguageText(question);

    const map = window.RAJ_AI.learning.questions;

    map.set(question, (map.get(question) || 0) + 1);

    window.RAJ_AI.learning.statistics.totalQuestions++;

}

// ---------- Learn Farmer ----------
function learnFarmer(name, record = {}) {

    if (!name) return;

    name = normalizeFarmerName(name);

    if (!window.RAJ_AI.learning.farmers.has(name)) {

        window.RAJ_AI.learning.farmers.set(name, []);

    }

    window.RAJ_AI.learning.farmers
        .get(name)
        .push(record);

    window.RAJ_AI.learning.statistics.totalLearning++;

}

// ---------- History ----------
function addLearningHistory(item) {

    if (!item) return;

    const history = window.RAJ_AI.learning.history;

    history.unshift({

        text: item,

        time: Date.now()

    });

    if (history.length >

        window.RAJ_AI.learningConfig.maxHistory) {

        history.pop();

    }

}

// ---------- Suggestions ----------
function addSuggestion(key, value) {

    if (!key || !value) return;

    window.RAJ_AI.learning.suggestions.set(key, value);

    window.RAJ_AI.learning.statistics.totalSuggestions++;

}

// ---------- Get Suggestions ----------
function getSuggestion(key) {

    return window.RAJ_AI.learning.suggestions.get(key) || null;

}

// ---------- Auto Learn ----------
function autoLearn(text) {

    learnQuestion(text);

    addLearningHistory(text);

    saveLearningCache();

}

// ---------- Public ----------
window.learnQuestion = learnQuestion;

window.learnFarmer = learnFarmer;

window.addLearningHistory = addLearningHistory;

window.addSuggestion = addSuggestion;

window.getSuggestion = getSuggestion;

window.autoLearn = autoLearn;
// ==========================================
// PART 3
// PATTERN + AI PREDICTION + RECOMMENDATION
// ==========================================

// ---------- Favorite Work ----------
function detectFavoriteWork(farmerName){

    const records = learnFarmerRecords(farmerName);

    const counter = {};

    records.forEach(r=>{

        const work = r.work || r.work_type || "Unknown";

        counter[work] = (counter[work]||0)+1;

    });

    let best = null;
    let max = 0;

    Object.keys(counter).forEach(k=>{

        if(counter[k] > max){

            max = counter[k];

            best = k;

        }

    });

    return best;

}

// ---------- Farmer Records ----------
function learnFarmerRecords(name){

    name = normalizeFarmerName(name);

    return window.RAJ_AI.learning.farmers.get(name) || [];

}

// ---------- Prediction ----------
function predictNextWork(farmerName){

    return detectFavoriteWork(farmerName);

}

// ---------- Recommendation ----------
function getRecommendation(farmerName){

    const work = predictNextWork(farmerName);

    if(!work){

        return "कोई सुझाव उपलब्ध नहीं";

    }

    return "इस किसान के लिए अगला संभावित कार्य: " + work;

}

// ---------- Pattern ----------
function buildLearningPattern(){

    const result = [];

    window.RAJ_AI.learning.farmers.forEach((records,name)=>{

        result.push({

            farmer:name,

            total:records.length,

            favorite:detectFavoriteWork(name)

        });

    });

    return result;

}

// ---------- Statistics ----------
function getLearningStatistics(){

    return {

        ...window.RAJ_AI.learning.statistics,

        farmers:

            window.RAJ_AI.learning.farmers.size,

        questions:

            window.RAJ_AI.learning.questions.size

    };

}

// ---------- Public ----------
window.learnFarmerRecords = learnFarmerRecords;

window.detectFavoriteWork = detectFavoriteWork;

window.predictNextWork = predictNextWork;

window.getRecommendation = getRecommendation;

window.buildLearningPattern = buildLearningPattern;

window.getLearningStatistics = getLearningStatistics;
// ==========================================
// PART 4
// AUTO LEARNING + FINAL ENGINE
// ==========================================

// ---------- Refresh ----------
function refreshLearningEngine() {

    saveLearningCache();

    learningLog("Learning Engine Updated");

}

// ---------- Auto Learn Record ----------
function autoLearnRecord(record) {

    if (!record) return;

    const farmer =
        record.name ||
        record.farmer ||
        "";

    if (farmer) {

        learnFarmer(farmer, record);

    }

    if (record.work) {

        learnQuestion(record.work);

    }

    addLearningHistory(record);

}

// ---------- AI Score ----------
function getLearningScore() {

    const stats = getLearningStatistics();

    return {

        score:
            (
                stats.totalLearning * 5 +
                stats.totalQuestions * 2 +
                stats.totalSuggestions * 3
            ),

        statistics: stats

    };

}

// ---------- Reset ----------
function resetLearningEngine() {

    window.RAJ_AI.learning.cache.clear();

    window.RAJ_AI.learning.farmers.clear();

    window.RAJ_AI.learning.questions.clear();

    window.RAJ_AI.learning.suggestions.clear();

    window.RAJ_AI.learning.history = [];

    saveLearningCache();

}

// ---------- Auto Init ----------
window.addEventListener("load", () => {

    initLearningEngine();

    refreshLearningEngine();

});

// ---------- Public ----------
window.refreshLearningEngine = refreshLearningEngine;

window.autoLearnRecord = autoLearnRecord;

window.getLearningScore = getLearningScore;

window.resetLearningEngine = resetLearningEngine;

// ==========================================
// END OF LEARNING ENGINE
// ==========================================

