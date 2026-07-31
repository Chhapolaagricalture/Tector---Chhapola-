// ==========================================
// RAJ AI SCANNER v1.0
// Part 1 - Foundation
// ==========================================

"use strict";

window.RAJ_AI = window.RAJ_AI || {};

window.RAJ_AI.scanner = {

    version: "1.0",

    initialized: false,

    scanning: false,

    lastScan: null,

    totalScans: 0,

    successScans: 0,

    failedScans: 0,

    currentImage: null,

    lastResult: null,

    cache: new Map()

};

// ==========================================
// CONFIG
// ==========================================

window.RAJ_AI.scannerConfig = {

    debug: false,

    imageQuality: 0.9,

    maxImageSize: 10 * 1024 * 1024,

    allowedTypes: [

        "image/jpeg",

        "image/png",

        "image/webp"

    ]

};

// ==========================================
// LOG
// ==========================================

function scannerLog(...msg){

    if(window.RAJ_AI.scannerConfig.debug){

        console.log("[RAJ SCANNER]",...msg);

    }

}

// ==========================================
// INIT
// ==========================================

function initScanner(){

    if(window.RAJ_AI.scanner.initialized){

        return;

    }

    window.RAJ_AI.scanner.initialized = true;

    scannerLog("Scanner Ready");

}

// ==========================================
// RESET
// ==========================================

function resetScanner(){

    window.RAJ_AI.scanner.scanning = false;

    window.RAJ_AI.scanner.currentImage = null;

    window.RAJ_AI.scanner.lastResult = null;

    window.RAJ_AI.scanner.cache.clear();

}

// ==========================================
// PUBLIC API
// ==========================================

window.initScanner = initScanner;

window.resetScanner = resetScanner;
// ==========================================
// PART 2
// IMAGE LOADER + VALIDATION + BASE64
// ==========================================

// ---------- Validate ----------
function validateScannerImage(file){

    if(!file){

        throw new Error("Image not selected.");

    }

    if(
        !window.RAJ_AI.scannerConfig.allowedTypes.includes(file.type)
    ){

        throw new Error("Unsupported image format.");

    }

    if(
        file.size >
        window.RAJ_AI.scannerConfig.maxImageSize
    ){

        throw new Error("Image size is too large.");

    }

    return true;

}

// ---------- Base64 ----------
function imageToBase64(file){

    return new Promise((resolve,reject)=>{

        try{

            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);

            reader.onerror = reject;

            reader.readAsDataURL(file);

        }catch(e){

            reject(e);

        }

    });

}

// ---------- Load ----------
async function loadScannerImage(file){

    validateScannerImage(file);

    const base64 = await imageToBase64(file);

    window.RAJ_AI.scanner.currentImage = {

        name:file.name,

        size:file.size,

        type:file.type,

        base64:base64,

        loaded:new Date()

    };

    return window.RAJ_AI.scanner.currentImage;

}

// ---------- Preview ----------
function getScannerPreview(){

    if(
        !window.RAJ_AI.scanner.currentImage
    ){

        return null;

    }

    return window.RAJ_AI.scanner.currentImage.base64;

}

// ---------- Compress ----------
async function compressScannerImage(file){

    // Future Image Compression

    return await loadScannerImage(file);

}

// ---------- Public ----------
window.validateScannerImage =
validateScannerImage;

window.imageToBase64 =
imageToBase64;

window.loadScannerImage =
loadScannerImage;

window.getScannerPreview =
getScannerPreview;

window.compressScannerImage =
compressScannerImage;
// ==========================================
// PART 3
// OCR + GEMINI + PARSER
// ==========================================

// ---------- Build Prompt ----------
function buildScannerPrompt(imageBase64){

    return `
You are Raj AI Scanner.

Extract ALL tractor ledger records from this image.

Return ONLY JSON.

Fields:

date
farmer
mobile
work
crop
quantity
unit
rate
total
paid
balance
remarks

Rules:

1. Never skip any row.
2. Fix OCR mistakes.
3. Hindi + English + Hinglish supported.
4. Understand local tractor words.
5. Convert half values correctly.
6. Keep farmer names exactly.
7. Detect Hero, Cultivator, Rotavator,
Thresher, Spray Machine automatically.
`;

}

// ---------- Gemini ----------
async function sendScannerToGemini(base64){

    if(typeof callGeminiAPI!=="function"){

        throw new Error("Gemini API Missing");

    }

    return await callGeminiAPI(

        buildScannerPrompt(base64),

        base64

    );

}

// ---------- Parse ----------
function parseScannerResponse(response){

    try{

        if(typeof response==="string"){

            return JSON.parse(response);

        }

        return response;

    }catch(e){

        console.error(e);

        return [];

    }

}

// ---------- Validate ----------
function validateScanRecords(records){

    if(!Array.isArray(records)){

        return [];

    }

    return records.filter(r=>

        r &&
        (r.farmer || r.name)

    );

}

// ---------- Public ----------
window.buildScannerPrompt=
buildScannerPrompt;

window.sendScannerToGemini=
sendScannerToGemini;

window.parseScannerResponse=
parseScannerResponse;

window.validateScanRecords=
validateScanRecords;
// ==========================================
// PART 4
// AUTO SAVE + MEMORY + FINAL API
// ==========================================

// ---------- Save ----------
async function saveScannedRecords(records){

    if(!Array.isArray(records) || records.length===0){

        return false;

    }

    try{

        if(typeof saveEntry==="function"){

            for(const record of records){

                await saveEntry(record);

            }

        }

        window.RAJ_AI.scanner.successScans++;

        return true;

    }catch(e){

        console.error(e);

        window.RAJ_AI.scanner.failedScans++;

        return false;

    }

}

// ---------- Merge Memory ----------
async function mergeScannerMemory(records){

    if(typeof syncRajMemory==="function"){

        await syncRajMemory();

    }

    if(typeof buildRajIndexes==="function"){

        buildRajIndexes();

    }

    return true;

}

// ---------- Full Scan ----------
async function startScanner(file){

    try{

        window.RAJ_AI.scanner.scanning = true;

        window.RAJ_AI.scanner.totalScans++;

        const image = await loadScannerImage(file);

        const response = await sendScannerToGemini(

            image.base64

        );

        const parsed = parseScannerResponse(response);

        const records = validateScanRecords(parsed);

        await saveScannedRecords(records);

        await mergeScannerMemory(records);

        window.RAJ_AI.scanner.lastResult = records;

        window.RAJ_AI.scanner.lastScan = new Date();

        return records;

    }finally{

        window.RAJ_AI.scanner.scanning = false;

    }

}

// ---------- Statistics ----------
function getScannerStatistics(){

    return{

        totalScans:
            window.RAJ_AI.scanner.totalScans,

        successScans:
            window.RAJ_AI.scanner.successScans,

        failedScans:
            window.RAJ_AI.scanner.failedScans,

        lastScan:
            window.RAJ_AI.scanner.lastScan

    };

}

// ---------- Public ----------
window.startScanner = startScanner;

window.saveScannedRecords = saveScannedRecords;

window.mergeScannerMemory = mergeScannerMemory;

window.getScannerStatistics = getScannerStatistics;

// ==========================================
// END OF RAJ AI SCANNER
// ==========================================

