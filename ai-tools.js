// ==========================================
// RAJ AI TOOLS v1.0
// Part 1 - Foundation
// ==========================================

"use strict";

window.RAJ_AI = window.RAJ_AI || {};

window.RAJ_AI.tools = {

    version: "1.0",

    initialized: false,

    lastUsed: null,

    usageCount: 0,

    cache: new Map(),

    statistics: {

        calculator: 0,

        formatter: 0,

        converter: 0,

        helper: 0

    }

};

// ==========================================
// CONFIG
// ==========================================

window.RAJ_AI.toolsConfig = {

    debug: false,

    currency: "INR",

    locale: "hi-IN",

    decimal: 2

};

// ==========================================
// LOG
// ==========================================

function toolsLog(...msg){

    if(window.RAJ_AI.toolsConfig.debug){

        console.log("[RAJ TOOLS]", ...msg);

    }

}

// ==========================================
// INIT
// ==========================================

function initTools(){

    if(window.RAJ_AI.tools.initialized){

        return;

    }

    window.RAJ_AI.tools.initialized = true;

    toolsLog("Tools Ready");

}

// ==========================================
// RESET
// ==========================================

function resetTools(){

    window.RAJ_AI.tools.cache.clear();

    window.RAJ_AI.tools.lastUsed = null;

    window.RAJ_AI.tools.usageCount = 0;

}

// ==========================================
// PUBLIC API
// ==========================================

window.initTools = initTools;

window.resetTools = resetTools;
// ==========================================
// PART 2
// CALCULATOR + FORMATTER
// ==========================================

// ---------- Calculator ----------
function calculate(a, operator, b){

    a = Number(a);
    b = Number(b);

    switch(operator){

        case "+":
            return a + b;

        case "-":
            return a - b;

        case "*":
            return a * b;

        case "/":
            return b === 0 ? 0 : a / b;

        case "%":
            return a % b;

        default:
            return 0;

    }

}

// ---------- Currency ----------
function formatCurrency(value){

    window.RAJ_AI.tools.statistics.formatter++;

    return Number(value || 0).toLocaleString(

        window.RAJ_AI.toolsConfig.locale,

        {

            style:"currency",

            currency:
                window.RAJ_AI.toolsConfig.currency,

            maximumFractionDigits:
                window.RAJ_AI.toolsConfig.decimal

        }

    );

}

// ---------- Number ----------
function formatNumber(value){

    return Number(value || 0).toLocaleString(

        window.RAJ_AI.toolsConfig.locale,

        {

            maximumFractionDigits:
                window.RAJ_AI.toolsConfig.decimal

        }

    );

}

// ---------- Date ----------
function formatDate(date){

    if(!date){

        date = new Date();

    }

    return new Date(date).toLocaleDateString(

        window.RAJ_AI.toolsConfig.locale

    );

}

// ---------- Time ----------
function formatTime(date){

    if(!date){

        date = new Date();

    }

    return new Date(date).toLocaleTimeString(

        window.RAJ_AI.toolsConfig.locale

    );

}

// ---------- Public ----------
window.calculate = calculate;

window.formatCurrency = formatCurrency;

window.formatNumber = formatNumber;

window.formatDate = formatDate;

window.formatTime = formatTime;
// ==========================================
// PART 3
// UNIT + SHARE + COPY + PDF HELPERS
// ==========================================

// ---------- Unit ----------
function convertUnit(value, from, to){

    value = Number(value || 0);

    if(from === to){

        return value;

    }

    const map = {

        bigha: 1,

        hour: 1,

        kiv: 1,

        quantity: 1

    };

    return value * (map[from] || 1);

}

// ---------- WhatsApp ----------
function shareWhatsApp(text){

    if(!text){

        return;

    }

    window.open(

        "https://wa.me/?text=" +

        encodeURIComponent(text),

        "_blank"

    );

}

// ---------- Copy ----------
async function copyText(text){

    if(!navigator.clipboard){

        return false;

    }

    await navigator.clipboard.writeText(text);

    return true;

}

// ---------- Download JSON ----------
function downloadJSON(data,fileName="raj-ai-data.json"){

    const blob = new Blob(

        [

            JSON.stringify(data,null,2)

        ],

        {

            type:"application/json"

        }

    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = fileName;

    a.click();

    URL.revokeObjectURL(url);

}

// ---------- PDF Helper ----------
function createPDFData(title,data){

    return {

        title,

        created:new Date(),

        records:data

    };

}

// ---------- Public ----------
window.convertUnit = convertUnit;

window.shareWhatsApp = shareWhatsApp;

window.copyText = copyText;

window.downloadJSON = downloadJSON;

window.createPDFData = createPDFData;
// ==========================================
// PART 4
// HEALTH + AUTO INIT + FINAL API
// ==========================================

// ---------- Statistics ----------
function getToolsStatistics(){

    return {

        initialized:
            window.RAJ_AI.tools.initialized,

        lastUsed:
            window.RAJ_AI.tools.lastUsed,

        usageCount:
            window.RAJ_AI.tools.usageCount,

        statistics:
            window.RAJ_AI.tools.statistics

    };

}

// ---------- Health ----------
function checkToolsHealth(){

    return {

        status:"OK",

        calculator:
            typeof calculate==="function",

        formatter:
            typeof formatCurrency==="function",

        converter:
            typeof convertUnit==="function",

        share:
            typeof shareWhatsApp==="function",

        copy:
            typeof copyText==="function"

    };

}

// ---------- Usage ----------
function registerToolUsage(toolName){

    window.RAJ_AI.tools.usageCount++;

    window.RAJ_AI.tools.lastUsed = new Date();

    if(

        window.RAJ_AI.tools.statistics.hasOwnProperty(toolName)

    ){

        window.RAJ_AI.tools.statistics[toolName]++;

    }

}

// ---------- Refresh ----------
function refreshTools(){

    toolsLog("Tools Refreshed");

}

// ---------- Auto Init ----------
window.addEventListener("load",()=>{

    initTools();

    refreshTools();

});

// ---------- Public ----------
window.getToolsStatistics = getToolsStatistics;

window.checkToolsHealth = checkToolsHealth;

window.registerToolUsage = registerToolUsage;

window.refreshTools = refreshTools;

// ==========================================
// END OF RAJ AI TOOLS
// ==========================================

