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
// PART 5
// SMART SPELLING ENGINE
// ==========================================

// Clean Text
function cleanText(text=""){

    return String(text)
        .normalize("NFC")
        .replace(/[^\u0900-\u097Fa-zA-Z0-9\s]/g," ")
        .replace(/\s+/g," ")
        .trim();

}

// Similar Score
function similarity(a,b){

    if(typeof levenshtein==="function"){

        const d = levenshtein(a,b);

        const max = Math.max(a.length,b.length);

        return 1-(d/max);

    }

    return 0;

}

// Smart Spelling
function correctSpelling(text=""){

    text = cleanText(text);

    const words = text.split(" ");

    const result=[];

    words.forEach(word=>{

        let best = word;

        let score = 0;

        window.RAJ_AI.language.dictionary.forEach((value,key)=>{

            const s = similarity(word.toLowerCase(),key.toLowerCase());

            if(s>score){

                score=s;

                best=value;

            }

        });

        if(score>0.75){

            result.push(best);

        }else{

            result.push(word);

        }

    });

    return result.join(" ");

}

// Public
window.cleanText = cleanText;
window.correctSpelling = correctSpelling;
// ==========================================
// PART 6
// AUTO DICTIONARY BUILDER
// ==========================================

function buildDynamicDictionary(){

    const dict = window.RAJ_AI.language.dictionary;

    dict.clear();

    if(!window.RAJ_AI.memory || !window.RAJ_AI.memory.records){

        return;

    }

    window.RAJ_AI.memory.records.forEach(record=>{

        Object.values(record).forEach(value=>{

            if(!value) return;

            value = String(value).trim();

            if(value.length<2) return;

            dict.set(
                value.toLowerCase(),
                value
            );

        });

    });

}

function refreshLanguageDictionary(){

    buildDynamicDictionary();

}

window.buildDynamicDictionary = buildDynamicDictionary;
window.refreshLanguageDictionary = refreshLanguageDictionary;
// ==========================================
// PART 7
// AI SMART SPELLING ENGINE
// ==========================================

// Find Best Match
function findBestWord(word=""){

    word = normalizeLanguageText(word);

    const dict = window.RAJ_AI.language.dictionary;

    let bestWord = word;
    let bestScore = 999;

    dict.forEach((value,key)=>{

        if(typeof levenshtein !== "function") return;

        const score = levenshtein(word,key);

        if(score < bestScore){

            bestScore = score;
            bestWord = value;

        }

    });

    if(bestScore <= 2){

        return bestWord;

    }

    return word;

}

// AI Spell Correction
function aiCorrectSentence(text=""){

    text = cleanText(text);

    const words = text.split(/\s+/);

    const result = words.map(word=>{

        return findBestWord(word);

    });

    return result.join(" ");

}

// Update Process
const oldProcessVoice = processVoiceText;

processVoiceText = function(text){

    text = oldProcessVoice(text);

    text = aiCorrectSentence(text);

    return text;

};

// OCR Update
const oldOCR = correctOCRText;

correctOCRText = function(text){

    text = oldOCR(text);

    text = aiCorrectSentence(text);

    return text;

};

// Public API
window.findBestWord = findBestWord;
window.aiCorrectSentence = aiCorrectSentence;
window.processVoiceText = processVoiceText;
window.correctOCRText = correctOCRText;
// ==========================================
// PART 8
// MULTI LANGUAGE UNDERSTANDING
// ==========================================

// Detect Mixed Language
function detectLanguageType(text=""){

    text = normalizeLanguageText(text);

    const hasHindi = /[\u0900-\u097F]/.test(text);
    const hasEnglish = /[a-z]/i.test(text);

    if(hasHindi && hasEnglish) return "mixed";

    if(hasHindi) return "hindi";

    if(hasEnglish) return "english";

    return "unknown";

}

// Hinglish -> Hindi
function convertHinglish(text=""){

    const words = text.split(/\s+/);

    return words.map(word=>{

        word = findBestWord(word);

        word = normalizeWord(word);

        return word;

    }).join(" ");

}

// Marwadi Cleaner
function normalizeLocalLanguage(text=""){

    return text
        .replace(/mharo/gi,"म्हारो")
        .replace(/mhari/gi,"म्हारी")
        .replace(/thane/gi,"थाने")
        .replace(/mane/gi,"मने")
        .replace(/kitno/gi,"कितना")
        .replace(/ketro/gi,"कितना")
        .replace(/koni/gi,"नहीं");

}

// Final Language Cleaner
function understandLanguage(text=""){

    text = cleanText(text);

    text = normalizeLocalLanguage(text);

    text = convertHinglish(text);

    return text;

}

// Override Process Language
const oldLanguageProcess = processLanguage;

processLanguage = function(text){

    text = understandLanguage(text);

    const result = oldLanguageProcess(text);

    result.languageType = detectLanguageType(text);

    result.cleanedText = text;

    return result;

};

// Public API
window.detectLanguageType = detectLanguageType;
window.convertHinglish = convertHinglish;
window.normalizeLocalLanguage = normalizeLocalLanguage;
window.understandLanguage = understandLanguage;
window.processLanguage = processLanguage;
// ==========================================
// PART 9
// SELF LEARNING LANGUAGE
// ==========================================

// Learn New Word
function learnLanguageWord(input, correct){

    input = normalizeLanguageText(input);
    correct = normalizeLanguageText(correct);

    if(!input || !correct) return;

    window.RAJ_AI.language.dictionary.set(input, correct);

    try{

        localStorage.setItem(

            "raj_ai_language_dictionary",

            JSON.stringify(

                [...window.RAJ_AI.language.dictionary.entries()]

            )

        );

    }catch(e){}

}

// Load Learned Words
function loadLearnedLanguage(){

    try{

        const data = localStorage.getItem(

            "raj_ai_language_dictionary"

        );

        if(!data) return;

        JSON.parse(data).forEach(([k,v])=>{

            window.RAJ_AI.language.dictionary.set(k,v);

        });

    }catch(e){}

}

// Auto Learn Sentence
function autoLearnSentence(text=""){

    text = cleanText(text);

    text.split(/\s+/).forEach(word=>{

        word = normalizeLanguageText(word);

        if(word.length<2) return;

        if(!window.RAJ_AI.language.dictionary.has(word)){

            window.RAJ_AI.language.dictionary.set(word, word);

        }

    });

}

// Update Process
const oldLanguageProcessor = processLanguage;

processLanguage = function(text){

    autoLearnSentence(text);

    return oldLanguageProcessor(text);

};

// Load Learned Data
loadLearnedLanguage();

// Public API
window.learnLanguageWord = learnLanguageWord;
window.loadLearnedLanguage = loadLearnedLanguage;
window.autoLearnSentence = autoLearnSentence;
window.processLanguage = processLanguage;
// ==========================================
// END OF LANGUAGE ENGINE
// ==========================================
