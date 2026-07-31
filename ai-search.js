// ==========================================
// RAJ AI SEARCH ENGINE v1.0
// Part 1 - Foundation
// ==========================================

"use strict";

window.RAJ_AI = window.RAJ_AI || {};

window.RAJ_AI.search = {

    version: "1.0",

    initialized: false,

    searching: false,

    cache: new Map(),

    history: [],

    index: new Map(),

    aliases: new Map(),

    lastQuery: "",

    lastResult: []

};

// ==========================================
// SEARCH CONFIG
// ==========================================

window.RAJ_AI.searchConfig = {

    maxHistory: 50,

    cacheSize: 500,

    fuzzySearch: true,

    voiceSearch: true,

    autoSuggest: true,

    ignoreCase: true,

    debug: false

};

// ==========================================
// LOG
// ==========================================

function searchLog(...msg){

    if(window.RAJ_AI.searchConfig.debug){

        console.log("[RAJ SEARCH]",...msg);

    }

}

// ==========================================
// NORMALIZE
// ==========================================

function normalizeSearchText(text=""){

    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g," ")
        .normalize("NFC");

}

// ==========================================
// SAVE HISTORY
// ==========================================

function saveSearchHistory(query){

    if(!query) return;

    const history=window.RAJ_AI.search.history;

    history.unshift(query);

    if(history.length>

window.RAJ_AI.searchConfig.maxHistory){

        history.pop();

    }

}

// ==========================================
// CACHE
// ==========================================

function setSearchCache(key,data){

    window.RAJ_AI.search.cache.set(key,data);

}

function getSearchCache(key){

    return window.RAJ_AI.search.cache.get(key);

}

// ==========================================
// PUBLIC
// ==========================================

window.normalizeSearchText=normalizeSearchText;

window.saveSearchHistory=saveSearchHistory;

window.setSearchCache=setSearchCache;

window.getSearchCache=getSearchCache;
// ==========================================
// PART 2
// INDEX + SMART SEARCH
// ==========================================

// Build Search Index
function buildSearchIndex() {

    window.RAJ_AI.search.index.clear();

    if (!window.RAJ_AI.memory || !window.RAJ_AI.memory.records) return;

    window.RAJ_AI.memory.records.forEach(record => {

        const text = JSON.stringify(record).toLowerCase();

        const words = text
            .replace(/[^a-z0-9\u0900-\u097f ]/gi, " ")
            .split(/\s+/);

        words.forEach(word => {

            if (!word || word.length < 2) return;

            if (!window.RAJ_AI.search.index.has(word)) {

                window.RAJ_AI.search.index.set(word, []);

            }

            window.RAJ_AI.search.index.get(word).push(record);

        });

    });

    searchLog("Index Ready");

}

// ==========================================
// SMART SEARCH
// ==========================================

function smartSearch(query) {

    if (!query) return [];

    query = normalizeSearchText(query);

    const cache = getSearchCache(query);

    if (cache) return cache;

    saveSearchHistory(query);

    const result = [];

    if (window.RAJ_AI.search.index.has(query)) {

        result.push(...window.RAJ_AI.search.index.get(query));

    }

    window.RAJ_AI.memory.records.forEach(record => {

        const text = JSON.stringify(record).toLowerCase();

        if (text.includes(query)) {

            result.push(record);

        }

    });

    const unique = [];

    const seen = new Set();

    result.forEach(r => {

        const key = JSON.stringify(r);

        if (!seen.has(key)) {

            seen.add(key);

            unique.push(r);

        }

    });

    setSearchCache(query, unique);

    window.RAJ_AI.search.lastQuery = query;

    window.RAJ_AI.search.lastResult = unique;

    return unique;

}

// ==========================================
// SEARCH HELPERS
// ==========================================

function searchFarmer(name){

    return smartSearch(name);

}

function searchMobile(number){

    return smartSearch(number);

}

function searchCrop(crop){

    return smartSearch(crop);

}

function searchWork(work){

    return smartSearch(work);

}

function searchDate(date){

    return smartSearch(date);

}

// ==========================================
// PUBLIC API
// ==========================================

window.buildSearchIndex = buildSearchIndex;

window.smartSearch = smartSearch;

window.searchFarmer = searchFarmer;

window.searchMobile = searchMobile;

window.searchCrop = searchCrop;

window.searchWork = searchWork;

window.searchDate = searchDate;
// ==========================================
// PART 3
// FUZZY SEARCH + SMART MATCHING
// ==========================================

// ---------- Levenshtein Distance ----------
function levenshtein(a = "", b = "") {

    a = normalizeSearchText(a);
    b = normalizeSearchText(b);

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {

        for (let j = 1; j <= a.length; j++) {

            if (b.charAt(i - 1) === a.charAt(j - 1)) {

                matrix[i][j] = matrix[i - 1][j - 1];

            } else {

                matrix[i][j] = Math.min(

                    matrix[i - 1][j - 1] + 1,

                    matrix[i][j - 1] + 1,

                    matrix[i - 1][j] + 1

                );

            }

        }

    }

    return matrix[b.length][a.length];

}

// ---------- Similar ----------
function isSimilar(a, b) {

    if (!a || !b) return false;

    if (a === b) return true;

    if (a.includes(b) || b.includes(a)) return true;

    return levenshtein(a, b) <= 2;

}

// ---------- Fuzzy Search ----------
function fuzzySearch(query) {

    query = normalizeSearchText(query);

    const results = [];

    window.RAJ_AI.memory.records.forEach(record => {

        const text = JSON.stringify(record).toLowerCase();

        const words = text.split(/\s+/);

        for (const word of words) {

            if (isSimilar(query, word)) {

                results.push(record);

                break;

            }

        }

    });

    return results;

}

// ---------- AI Ranking ----------
function rankSearch(records, query) {

    query = normalizeSearchText(query);

    return records.sort((a, b) => {

        const ta = JSON.stringify(a).toLowerCase();

        const tb = JSON.stringify(b).toLowerCase();

        let sa = 0;
        let sb = 0;

        if (ta.includes(query)) sa += 20;
        if (tb.includes(query)) sb += 20;

        if (ta.startsWith(query)) sa += 10;
        if (tb.startsWith(query)) sb += 10;

        return sb - sa;

    });

}

// ---------- Auto Suggest ----------
function getSuggestions(query) {

    query = normalizeSearchText(query);

    const suggestions = [];

    window.RAJ_AI.search.index.forEach((v, k) => {

        if (k.startsWith(query)) {

            suggestions.push(k);

        }

    });

    return suggestions.slice(0, 10);

}

// ---------- Universal Search ----------
function universalSearch(query) {

    let result = smartSearch(query);

    if (result.length === 0) {

        result = fuzzySearch(query);

    }

    result = rankSearch(result, query);

    return result;

}

// ---------- Public ----------
window.fuzzySearch = fuzzySearch;

window.universalSearch = universalSearch;

window.getSuggestions = getSuggestions;

window.rankSearch = rankSearch;
// ==========================================
// PART 4
// FINAL SEARCH ENGINE
// ==========================================

// Search Statistics
window.RAJ_AI.search.statistics = {

    totalSearch: 0,

    cacheHit: 0,

    fuzzyHit: 0

};

// Search Wrapper
function searchAI(query){

    if(!query) return [];

    window.RAJ_AI.search.statistics.totalSearch++;

    const cache=getSearchCache(query);

    if(cache){

        window.RAJ_AI.search.statistics.cacheHit++;

        return cache;

    }

    let result=universalSearch(query);

    if(result.length){

        window.RAJ_AI.search.statistics.fuzzyHit++;

    }

    setSearchCache(query,result);

    return result;

}

// Voice Search
function voiceSearch(text){

    return searchAI(text);

}

// OCR Search
function ocrSearch(text){

    return searchAI(text);

}

// Auto Refresh Index
function refreshSearchEngine(){

    buildSearchIndex();

    searchLog("Search Engine Updated");

}

// Init
window.addEventListener("load",()=>{

    setTimeout(()=>{

        if(window.buildSearchIndex){

            buildSearchIndex();

        }

    },2000);

});

// Public API
window.searchAI=searchAI;

window.voiceSearch=voiceSearch;

window.ocrSearch=ocrSearch;

window.refreshSearchEngine=refreshSearchEngine;

// ==========================================
// END OF SEARCH ENGINE
// ==========================================
