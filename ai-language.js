// ==========================================
// RAJ AI LANGUAGE ENGINE v1.0
// Part 1 - Foundation
// ==========================================

"use strict";

window.RAJ_AI = window.RAJ_AI || {};

window.RAJ_AI.language = {

    version: "1.0",

    initialized: false,

    currentLanguage: "hi",

    lastLanguage: "hi",

    cache: new Map(),

    dictionary: new Map(),

    aliases: new Map(),

    history: []

};

// ==========================================
// CONFIG
// ==========================================

window.RAJ_AI.languageConfig = {

    defaultLanguage: "hi",

    autoDetect: true,

    maxHistory: 100,

    debug: false

};

// ==========================================
// LOG
// ==========================================

function languageLog(...msg){

    if(window.RAJ_AI.languageConfig.debug){

        console.log("[RAJ LANGUAGE]",...msg);

    }

}

// ==========================================
// NORMALIZE
// ==========================================

function normalizeLanguageText(text=""){

    return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g," ")
        .normalize("NFC");

}

// ==========================================
// LANGUAGE DETECT
// ==========================================

function detectLanguage(text=""){

    text=normalizeLanguageText(text);

    if(/[ऀ-ॿ]/.test(text)){

        return "hi";

    }

    if(/[a-z]/.test(text)){

        return "en";

    }

    return "unknown";

}

// ==========================================
// HISTORY
// ==========================================

function addLanguageHistory(text){

    const h=window.RAJ_AI.language.history;

    h.unshift(text);

    if(h.length>

window.RAJ_AI.languageConfig.maxHistory){

        h.pop();

    }

}

// ==========================================
// INIT
// ==========================================

function initLanguageEngine(){

    if(window.RAJ_AI.language.initialized){

        return;

    }

    window.RAJ_AI.language.initialized=true;

    languageLog("Language Engine Ready");

}

// ==========================================
// PUBLIC API
// ==========================================

window.detectLanguage=detectLanguage;

window.normalizeLanguageText=normalizeLanguageText;

window.initLanguageEngine=initLanguageEngine;

window.addLanguageHistory=addLanguageHistory;
// ==========================================
// PART 2
// DICTIONARY + ALIAS + LOCAL WORDS
// ==========================================

// ---------- Dictionary ----------
function loadLanguageDictionary() {

    const dict = window.RAJ_AI.language.dictionary;

    dict.set("hero", "Hero");
    dict.set("हीरो", "Hero");

    dict.set("cultivator", "Cultivator");
    dict.set("कल्टी", "Cultivator");

    dict.set("rotavator", "Rotavator");
    dict.set("रोटावेटर", "Rotavator");

    dict.set("thresher", "Thresher");
    dict.set("थ्रेसर", "Thresher");

    dict.set("spray", "Spray Machine");
    dict.set("दवाई", "Spray Machine");
    dict.set("टंकी", "Spray Machine");

}

// ---------- Farmer Alias ----------
function loadFarmerAliases() {

    const alias = window.RAJ_AI.language.aliases;

    alias.set("umed", "उमेद");
    alias.set("umeed", "उमेद");
    alias.set("उम्मेद", "उमेद");

    alias.set("jai", "जय");
    alias.set("jai singh", "जय सिंह");
    alias.set("jai singh chhapola", "जय सिंह छपोला");

}

// ---------- Normalize Word ----------
function normalizeWord(word = "") {

    word = normalizeLanguageText(word);

    if (window.RAJ_AI.language.aliases.has(word)) {

        return window.RAJ_AI.language.aliases.get(word);

    }

    if (window.RAJ_AI.language.dictionary.has(word)) {

        return window.RAJ_AI.language.dictionary.get(word);

    }

    return word;

}

// ---------- Normalize Sentence ----------
function normalizeSentence(text = "") {

    return text
        .split(" ")
        .map(normalizeWord)
        .join(" ");

}

// ---------- Language Switch ----------
function updateCurrentLanguage(text) {

    const lang = detectLanguage(text);

    if (lang !== "unknown") {

        window.RAJ_AI.language.lastLanguage =
            window.RAJ_AI.language.currentLanguage;

        window.RAJ_AI.language.currentLanguage = lang;

    }

}

// ---------- Public ----------
window.loadLanguageDictionary = loadLanguageDictionary;

window.loadFarmerAliases = loadFarmerAliases;

window.normalizeWord = normalizeWord;

window.normalizeSentence = normalizeSentence;

window.updateCurrentLanguage = updateCurrentLanguage;
// ==========================================
// PART 3
// SMART MATCHING + OCR + VOICE
// ==========================================

// ---------- Smart Name Match ----------
function smartNameMatch(input, target) {

    input = normalizeLanguageText(input);
    target = normalizeLanguageText(target);

    if (input === target) return true;

    input = normalizeWord(input);
    target = normalizeWord(target);

    if (input === target) return true;

    if (typeof isSimilar === "function") {
        return isSimilar(input, target);
    }

    return false;
}

// ---------- OCR Correction ----------
function correctOCRText(text = "") {

    let result = normalizeSentence(text);

    result = result.replace(/हीरों/gi, "Hero");
    result = result.replace(/कलटी/gi, "Cultivator");
    result = result.replace(/थेसर/gi, "Thresher");
    result = result.replace(/स्प्रे/gi, "Spray Machine");
    result = result.replace(/रोटावेटर/gi, "Rotavator");

    return result;
}

// ---------- Voice Processing ----------
function processVoiceText(text = "") {

    text = correctOCRText(text);

    updateCurrentLanguage(text);

    addLanguageHistory(text);

    return text;
}

// ---------- Reply Language ----------
function getReplyLanguage() {

    return window.RAJ_AI.language.currentLanguage || "hi";

}

// ---------- Translate Placeholder ----------
function translateText(text, targetLang = "hi") {

    return {

        language: targetLang,

        text: text

    };

}

// ---------- Public ----------
window.smartNameMatch = smartNameMatch;

window.correctOCRText = correctOCRText;

window.processVoiceText = processVoiceText;

window.getReplyLanguage = getReplyLanguage;

window.translateText = translateText;
// ==========================================
// PART 4
// FINAL LANGUAGE ENGINE
// ==========================================

// ---------- Statistics ----------
window.RAJ_AI.language.statistics = {

    detected: 0,

    translated: 0,

    voiceProcessed: 0,

    ocrProcessed: 0

};

// ---------- Format Reply ----------
function formatReply(text) {

    const lang = getReplyLanguage();

    return {

        language: lang,

        message: text

    };

}

// ---------- Refresh ----------
function refreshLanguageEngine() {

    loadLanguageDictionary();

    loadFarmerAliases();

    languageLog("Language Engine Updated");

}

// ---------- Process ----------
function processLanguage(text) {

    window.RAJ_AI.language.statistics.detected++;

    text = processVoiceText(text);

    return formatReply(text);

}

// ---------- OCR ----------
function processOCR(text) {

    window.RAJ_AI.language.statistics.ocrProcessed++;

    return correctOCRText(text);

}

// ---------- Voice ----------
function processVoice(text) {

    window.RAJ_AI.language.statistics.voiceProcessed++;

    return processVoiceText(text);

}

// ---------- Init ----------
window.addEventListener("load", () => {

    initLanguageEngine();

    refreshLanguageEngine();

});

// ---------- Public API ----------
window.processLanguage = processLanguage;

window.processOCR = processOCR;

window.processVoice = processVoice;

window.refreshLanguageEngine = refreshLanguageEngine;

window.formatReply = formatReply;

// ==========================================
// END OF LANGUAGE ENGINE
// ==========================================
