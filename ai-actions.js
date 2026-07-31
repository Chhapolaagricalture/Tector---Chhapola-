// ==========================================
// RAJ AI ACTIONS v1.0
// Part 1 - Foundation
// ==========================================

"use strict";

window.RAJ_AI = window.RAJ_AI || {};

window.RAJ_AI.actions = {

    version: "1.0",

    initialized: false,

    running: false,

    lastAction: null,

    totalActions: 0,

    successActions: 0,

    failedActions: 0,

    history: [],

    cache: new Map()

};

// ==========================================
// CONFIG
// ==========================================

window.RAJ_AI.actionsConfig = {

    debug: false,

    saveHistory: true,

    maxHistory: 100

};

// ==========================================
// LOG
// ==========================================

function actionLog(...msg){

    if(window.RAJ_AI.actionsConfig.debug){

        console.log("[RAJ ACTION]",...msg);

    }

}

// ==========================================
// INIT
// ==========================================

function initActions(){

    if(window.RAJ_AI.actions.initialized){

        return;

    }

    window.RAJ_AI.actions.initialized = true;

    actionLog("Actions Ready");

}

// ==========================================
// RESET
// ==========================================

function resetActions(){

    window.RAJ_AI.actions.running = false;

    window.RAJ_AI.actions.lastAction = null;

    window.RAJ_AI.actions.cache.clear();

    window.RAJ_AI.actions.history = [];

}

// ==========================================
// HISTORY
// ==========================================

function addActionHistory(name){

    if(!window.RAJ_AI.actionsConfig.saveHistory){

        return;

    }

    window.RAJ_AI.actions.history.unshift({

        action:name,

        time:new Date()

    });

    if(

        window.RAJ_AI.actions.history.length >

        window.RAJ_AI.actionsConfig.maxHistory

    ){

        window.RAJ_AI.actions.history.pop();

    }

}

// ==========================================
// PUBLIC API
// ==========================================

window.initActions = initActions;

window.resetActions = resetActions;

window.addActionHistory = addActionHistory;
// ==========================================
// PART 2
// RECORD ACTIONS
// ==========================================

// ---------- Add ----------
async function addRecordAction(record){

    try{

        if(typeof saveEntry==="function"){

            await saveEntry(record);

        }

        window.RAJ_AI.actions.totalActions++;

        window.RAJ_AI.actions.successActions++;

        window.RAJ_AI.actions.lastAction="ADD";

        addActionHistory("ADD");

        return true;

    }catch(e){

        console.error(e);

        window.RAJ_AI.actions.failedActions++;

        return false;

    }

}

// ---------- Update ----------
async function updateRecordAction(id,data){

    try{

        if(typeof updateEntry==="function"){

            await updateEntry(id,data);

        }

        window.RAJ_AI.actions.totalActions++;

        window.RAJ_AI.actions.successActions++;

        window.RAJ_AI.actions.lastAction="UPDATE";

        addActionHistory("UPDATE");

        return true;

    }catch(e){

        console.error(e);

        window.RAJ_AI.actions.failedActions++;

        return false;

    }

}

// ---------- Delete ----------
async function deleteRecordAction(id){

    try{

        if(typeof deleteEntry==="function"){

            await deleteEntry(id);

        }

        window.RAJ_AI.actions.totalActions++;

        window.RAJ_AI.actions.successActions++;

        window.RAJ_AI.actions.lastAction="DELETE";

        addActionHistory("DELETE");

        return true;

    }catch(e){

        console.error(e);

        window.RAJ_AI.actions.failedActions++;

        return false;

    }

}

// ---------- Search ----------
function searchRecordAction(keyword){

    if(typeof searchMemory==="function"){

        return searchMemory(keyword);

    }

    return [];

}

// ---------- Farmer ----------
function openFarmerRecord(name){

    if(typeof getFarmerRecords==="function"){

        return getFarmerRecords(name);

    }

    return [];

}

// ---------- Public ----------
window.addRecordAction = addRecordAction;

window.updateRecordAction = updateRecordAction;

window.deleteRecordAction = deleteRecordAction;

window.searchRecordAction = searchRecordAction;

window.openFarmerRecord = openFarmerRecord;
// ==========================================
// PART 3
// PDF + SHARE + REFRESH + ACTION EXECUTOR
// ==========================================

// ---------- PDF ----------
async function exportRecordPDF(record){

    try{

        if(typeof createPDF==="function"){

            await createPDF(record);

        }

        addActionHistory("PDF");

        return true;

    }catch(e){

        console.error(e);

        return false;

    }

}

// ---------- WhatsApp ----------
function shareRecordWhatsApp(record){

    try{

        const text = JSON.stringify(record,null,2);

        if(typeof shareWhatsApp==="function"){

            shareWhatsApp(text);

        }

        addActionHistory("WHATSAPP");

        return true;

    }catch(e){

        console.error(e);

        return false;

    }

}

// ---------- Refresh ----------
async function refreshActionData(){

    try{

        if(typeof refreshRajMemory==="function"){

            await refreshRajMemory();

        }

        if(typeof refreshAnalysis==="function"){

            await refreshAnalysis();

        }

        addActionHistory("REFRESH");

        return true;

    }catch(e){

        console.error(e);

        return false;

    }

}

// ---------- Executor ----------
async function executeAction(action,payload){

    switch(String(action).toUpperCase()){

        case "ADD":

            return await addRecordAction(payload);

        case "UPDATE":

            return await updateRecordAction(

                payload.id,

                payload.data

            );

        case "DELETE":

            return await deleteRecordAction(

                payload.id

            );

        case "SEARCH":

            return searchRecordAction(payload);

        case "FARMER":

            return openFarmerRecord(payload);

        case "PDF":

            return await exportRecordPDF(payload);

        case "WHATSAPP":

            return shareRecordWhatsApp(payload);

        case "REFRESH":

            return await refreshActionData();

        default:

            return false;

    }

}

// ---------- Public ----------
window.exportRecordPDF = exportRecordPDF;

window.shareRecordWhatsApp = shareRecordWhatsApp;

window.refreshActionData = refreshActionData;

window.executeAction = executeAction;
// ==========================================
// PART 4
// HEALTH + AUTO INIT + FINAL API
// ==========================================

// ---------- Statistics ----------
function getActionsStatistics(){

    return {

        initialized:
            window.RAJ_AI.actions.initialized,

        running:
            window.RAJ_AI.actions.running,

        totalActions:
            window.RAJ_AI.actions.totalActions,

        successActions:
            window.RAJ_AI.actions.successActions,

        failedActions:
            window.RAJ_AI.actions.failedActions,

        lastAction:
            window.RAJ_AI.actions.lastAction,

        history:
            window.RAJ_AI.actions.history.length

    };

}

// ---------- Health ----------
function checkActionsHealth(){

    return {

        status:"OK",

        add:
            typeof addRecordAction==="function",

        update:
            typeof updateRecordAction==="function",

        delete:
            typeof deleteRecordAction==="function",

        search:
            typeof searchRecordAction==="function",

        execute:
            typeof executeAction==="function"

    };

}

// ---------- Refresh ----------
function refreshActions(){

    actionLog("Actions Refreshed");

}

// ---------- Auto Init ----------
window.addEventListener("load",()=>{

    initActions();

    refreshActions();

});

// ---------- Public ----------
window.getActionsStatistics = getActionsStatistics;

window.checkActionsHealth = checkActionsHealth;

window.refreshActions = refreshActions;

// ==========================================
// END OF RAJ AI ACTIONS
// ==========================================

