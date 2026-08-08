// ==========================================
// RAJ AI MEMORY ENGINE v1.0
// Part 1 - Foundation
// ==========================================

"use strict";

window.RAJ_AI = window.RAJ_AI || {};

window.RAJ_AI.memory = {

    version: "1.0",

    initialized: false,

    loading: false,

    syncing: false,

    lastSync: null,

    totalRecords: 0,

    totalFarmers: 0,

    records: [],

    tableRecords: [],

    firebaseRecords: [],

    farmers: new Map(),

    aliases: new Map(),

    cache: new Map(),

    statistics: {

        totalAmount: 0,

        totalPaid: 0,

        totalBalance: 0

    }

};

// ==========================================
// CONFIG
// ==========================================

window.RAJ_AI.config = {

    autoSync: true,

    autoSyncTime: 30000,

    offlineCache: true,

    duplicateCleaner: true,

    debug: false

};

// ==========================================
// LOG
// ==========================================

function rajLog(...msg){

    if(window.RAJ_AI.config.debug){

        console.log("[RAJ AI]",...msg);

    }

}

// ==========================================
// SAVE CACHE
// ==========================================

function saveMemoryCache(){

    if(!window.RAJ_AI.config.offlineCache) return;

    try{

        localStorage.setItem(

            "RAJ_AI_MEMORY",

            JSON.stringify({

                records:window.RAJ_AI.memory.records,

                statistics:window.RAJ_AI.memory.statistics,

                lastSync:Date.now()

            })

        );

    }catch(e){

        rajLog(e);

    }

}

// ==========================================
// LOAD CACHE
// ==========================================

function loadMemoryCache(){

    try{

        const cache=localStorage.getItem("RAJ_AI_MEMORY");

        if(!cache) return;

        const data=JSON.parse(cache);

        window.RAJ_AI.memory.records=data.records||[];

        window.RAJ_AI.memory.statistics=data.statistics||{};

    }catch(e){

        rajLog(e);

    }

}

// ==========================================
// CLEAR MEMORY
// ==========================================

function clearRajMemory(){

    window.RAJ_AI.memory.records=[];

    window.RAJ_AI.memory.tableRecords=[];

    window.RAJ_AI.memory.firebaseRecords=[];

    window.RAJ_AI.memory.farmers.clear();

    window.RAJ_AI.memory.aliases.clear();

    window.RAJ_AI.memory.cache.clear();

}

// ==========================================
// INIT
// ==========================================

async function initRajMemory(){

    if(window.RAJ_AI.memory.initialized) return;

    window.RAJ_AI.memory.loading=true;

    loadMemoryCache();

    window.RAJ_AI.memory.initialized=true;

    window.RAJ_AI.memory.loading=false;

    rajLog("Memory Ready");

}

// ==========================================
// PUBLIC API
// ==========================================

window.initRajMemory=initRajMemory;

window.clearRajMemory=clearRajMemory;

window.saveMemoryCache=saveMemoryCache;

window.loadMemoryCache=loadMemoryCache;
// ==========================================
// PART 2
// TABLE + FIREBASE MEMORY
// ==========================================
async function scanTableMemory() {

    const records = [];

    try {

        const rows = document.querySelectorAll("table tbody tr");

        rows.forEach(row => {

            const text = row.innerText.replace(/\s+/g," ").trim();

            if (
                text &&
                !text.includes("No records") &&
                !text.includes("कोई रिकॉर्ड नहीं")
            ) {

                records.push({
                    source:"table",
                    text:text
                });

            }

        });

    } catch(e){

        rajLog("Table Scan Error",e);

    }

    window.RAJ_AI.memory.tableRecords = records;

    return records;

}

// ---------- FIREBASE MEMORY ----------
async function scanFirebaseMemory(){

    try{

        // script.js पहले से Firebase से records
        // लेकर window.records में रखता है
        if (!Array.isArray(window.records)) {

            if (typeof show === "function") {
                await show();
            }

        }

        const records = Array.isArray(window.records)
            ? window.records
            : [];

        window.RAJ_AI.memory.firebaseRecords =
            records.map(r => ({

                source: "firebase",

                id: r.id || "",

                name: r.name || "",

                mobile: r.mobile || "",

                date: r.date || "",

                work: r.work || "",

                crop: r.crop || "",

                unit: r.unit || "",

                time: r.time || "",

                bigha: Number(r.bigha || 0),

                quantity: Number(
                    r.unit || r.bigha || 0
                ),

                rate: Number(r.rate || 0),

                total: Number(r.total || 0),

                paid: Number(r.paid || 0),

                balance: Number(
                    r.baki ??
                    r.balance ??
                    (
                        Number(r.total || 0) -
                        Number(r.paid || 0)
                    )
                )

            }));

        return window.RAJ_AI.memory.firebaseRecords;

    }catch(e){

        console.error(
            "❌ AI Firebase Memory Error:",
            e
        );

        window.RAJ_AI.memory.firebaseRecords = [];

        return [];

    }

}

// ---------- MERGE ----------
function mergeRajMemory(){

    const all = [
        ...window.RAJ_AI.memory.firebaseRecords
    ];

    window.RAJ_AI.memory.records = all;

    window.RAJ_AI.memory.totalRecords = all.length;

    saveMemoryCache();

    return all;

}

// ---------- FULL SYNC ----------
async function syncRajMemory(){

    if(window.RAJ_AI.memory.syncing){

        return;

    }

    window.RAJ_AI.memory.syncing=true;

    await scanTableMemory();

    await scanFirebaseMemory();

    mergeRajMemory();

    window.RAJ_AI.memory.lastSync=new Date();

    window.RAJ_AI.memory.syncing=false;

    rajLog("Memory Synced");

}

window.scanTableMemory=scanTableMemory;

window.scanFirebaseMemory=scanFirebaseMemory;

window.syncRajMemory=syncRajMemory;
    // ==========================================
// PART 3
// FARMER INDEX + ALIAS + DUPLICATE CLEANER
// ==========================================

// Duplicate Cleaner
function removeDuplicateRecords() {

    const unique = new Map();

    window.RAJ_AI.memory.records.forEach(record => {

        const key = JSON.stringify(record);

        if (!unique.has(key)) {

            unique.set(key, record);

        }

    });

    window.RAJ_AI.memory.records = [...unique.values()];

    window.RAJ_AI.memory.totalRecords =
        window.RAJ_AI.memory.records.length;

}

// Normalize Name
function normalizeFarmerName(name = "") {

    return name
        .toLowerCase()
        .replace(/[^\u0900-\u097Fa-z0-9]/g, "")
        .replace(/\s+/g, "");

}

// Alias Register
function registerAlias(original, aliasList = []) {

    const base = normalizeFarmerName(original);

    aliasList.forEach(alias => {

        window.RAJ_AI.memory.aliases.set(

            normalizeFarmerName(alias),

            base

        );

    });

}

// Farmer Index
function buildFarmerIndex() {

    window.RAJ_AI.memory.farmers.clear();

    window.RAJ_AI.memory.records.forEach(record => {

        const rawName =
            record.name ||
            record.farmer ||
            record.farmerName ||
            record.text ||
            "";

        const name = normalizeFarmerName(rawName);

        if (!window.RAJ_AI.memory.farmers.has(name)) {

            window.RAJ_AI.memory.farmers.set(name, []);

        }

        window.RAJ_AI.memory.farmers
            .get(name)
            .push(record);

    });

    window.RAJ_AI.memory.totalFarmers =
        window.RAJ_AI.memory.farmers.size;

}

// Default Alias
function loadDefaultAliases() {

    registerAlias("उमेद",[
        "umed",
        "umed",
        "उम्मीद",
        "umedji"
    ]);

    registerAlias("योगी",[
        "yogi",
        "योगीजी"
    ]);

    registerAlias("राम",[
        "ram",
        "raam"
    ]);

}

// Statistics
function calculateStatistics() {

    let total = 0;

    let paid = 0;

    window.RAJ_AI.memory.records.forEach(r => {

        total += Number(r.total || 0);

        paid += Number(r.paid || 0);

    });

    window.RAJ_AI.memory.statistics = {

        totalAmount: total,

        totalPaid: paid,

        totalBalance: total - paid

    };

}

// Build All
function buildRajIndexes() {

    removeDuplicateRecords();

    loadDefaultAliases();

    buildFarmerIndex();

    calculateStatistics();

    saveMemoryCache();

    rajLog("Indexes Ready");

}

// Public API
window.buildRajIndexes = buildRajIndexes;

window.normalizeFarmerName = normalizeFarmerName;
    // ==========================================
// PART 4
// AUTO SYNC + MEMORY API
// ==========================================

// Refresh Memory
async function refreshRajMemory() {

    try {

        await syncRajMemory();

        buildRajIndexes();

        saveMemoryCache();

        rajLog("Memory Refreshed");

    } catch (e) {

        rajLog(e);

    }

}

// Find Farmer
function getFarmerRecords(name) {

    if (!name) return [];

    let key = normalizeFarmerName(name);

    if (window.RAJ_AI.memory.aliases.has(key)) {

        key = window.RAJ_AI.memory.aliases.get(key);

    }

    return window.RAJ_AI.memory.farmers.get(key) || [];

}

// Search
function searchMemory(keyword) {

    if (!keyword) return [];

    const key = keyword.toLowerCase();

    return window.RAJ_AI.memory.records.filter(r =>

        JSON.stringify(r)

        .toLowerCase()

        .includes(key)

    );

}

// Get Statistics
function getRajStatistics() {

    return window.RAJ_AI.memory.statistics;

}

// Auto Sync
function startRajAutoSync() {

    if (!window.RAJ_AI.config.autoSync) return;

    setInterval(async () => {

        await refreshRajMemory();

    }, window.RAJ_AI.config.autoSyncTime);

}

// Init
window.addEventListener("load", async () => {

    await initRajMemory();

    await refreshRajMemory();

    startRajAutoSync();

});

// Public API
window.refreshRajMemory = refreshRajMemory;

window.getFarmerRecords = getFarmerRecords;

window.searchMemory = searchMemory;

window.getRajStatistics = getRajStatistics;

window.startRajAutoSync = startRajAutoSync;

// ==========================================
// END OF AI MEMORY ENGINE
// ==========================================

