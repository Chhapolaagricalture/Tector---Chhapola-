// ==========================================
// RAJ AI SCANNER v1.0
// Part 1 - Foundation
// ==========================================

"use strict";
alert("AI Scanner Loaded");
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

function buildScannerPrompt() {

return `
You are an expert OCR for Chhapola Agriculture tractor register.

Read COMPLETE page.

Extract ALL farmer entries.

Rules:

Date is written on right side.

Every farmer below belongs to same date until next date.

Short Codes:

BH = Hero
BK = Calti
BMP = Morplau
BDP = Displau
B = Bigha
Spray Machine = दवाई टंकी

If Bajra written with KIV:
unit=KIV
work_type=Bajra

If only hours written:
work_type=Thresher
unit=Hour

Half Examples:

1½=1.5
2½=2.5
3½=3.5
4½=4.5
5½=5.5
6½=6.5
7½=7.5
8½=8.5

If line starts with "
repeat previous farmer name.

Never guess.

Return ONLY JSON.

[
{
"farmer_name":"",
"work_date":"",
"mobile_number":"",
"work_type":"",
"crop":"",
"unit":"",
"quantity":"",
"paid_amount":"0"
}
]
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

// ==========================================
// PART 7
// GEMINI RESPONSE PARSER
// ==========================================

function parseScannerResponse(response){

    try{

        let raw = "";

        if(response.candidates){

            raw =
            response.candidates[0]
            .content.parts[0]
            .text;

        }else{

            raw = String(response);

        }

        raw = raw
            .replace(/```json/gi,"")
            .replace(/```/g,"")
            .trim();

        const json =
            raw.match(/\[[\s\S]*\]|\{[\s\S]*\}/);

        if(!json){

            return [];

        }

        let records = JSON.parse(json[0]);

        if(!Array.isArray(records)){

            records = [records];

        }

        return records;

    }catch(e){

        console.error(e);

        return [];

    }

    }
function validateScanRecords(records){

    if(!Array.isArray(records)){
        return [];
    }

    return records.filter(r =>
        r &&
        (r.farmer_name || r.farmer || r.name)
    );

}

window.validateScanRecords = validateScanRecords;
// ==========================================
// PART 8
// AUTO FORM FILL
// ==========================================

async function fillScannerForm(farmer){

    if(document.getElementById("name"))
        document.getElementById("name").value =
            farmer.farmer_name || "";

    if(document.getElementById("date"))
        document.getElementById("date").value =
            farmer.work_date || "";

    if(document.getElementById("mobile"))
        document.getElementById("mobile").value =
            farmer.mobile_number || "";

    const workBox =
        document.getElementById("work");

    if(workBox && farmer.work_type){

        workBox.value = farmer.work_type;

        workBox.dispatchEvent(
            new Event("change")
        );

        await new Promise(r=>setTimeout(r,200));

    }

    if(document.getElementById("crop"))
        document.getElementById("crop").value =
            farmer.crop || "";

    const qty =
        Number(farmer.quantity || 0);

    if(
        ["Hero","Calti","Morplau","Display"]
        .includes(farmer.work_type)
    ){

        document.getElementById("bigha").value =
            qty;

    }

    else if(
        farmer.work_type==="Spray Machine"
    ){

        document.getElementById("unitValue").value =
            qty;

    }

    else if(
        farmer.work_type==="Bajra"
    ){

        document.getElementById("crop").value =
            "Bajra";

        document.getElementById("unitValue").value =
            qty;

    }

    else if(
        farmer.work_type==="Thresher"
    ){

        const h=Math.floor(qty);

        const m=Math.round((qty-h)*60);

        document.getElementById("hours").value=h;

        document.getElementById("minutes").value=m;

    }

    if(document.getElementById("paid"))
        document.getElementById("paid").value =
            farmer.paid_amount || 0;

}

window.fillScannerForm = fillScannerForm;
// ==========================================
// PART 9
// AUTO RATE
// ==========================================

function applyScannerRate(farmer){

    let rate = 0;

    switch(farmer.work_type){

        case "Hero":
            rate = 250;
            break;

        case "Calti":
            rate = 250;
            break;

        case "Morplau":
            rate = 500;
            break;

        case "Display":
        case "Displau":
            rate = 500;
            break;

        case "Spray Machine":
            rate = 800;
            break;

        case "Bajra":
            rate = 150;
            break;

        case "Thresher":

            if(
                farmer.crop &&
                farmer.crop.toLowerCase() === "bajra"
            ){

                rate = 150;

            }else{

                rate = 1200;

            }

            break;

    }

    const rateBox =
        document.getElementById("rate");

    if(rateBox){

        rateBox.value = rate;

    }

    return rate;

}

window.applyScannerRate = applyScannerRate;
// ==========================================
// PART 10
// AUTO SAVE + COMPLETE SCAN
// ==========================================

async function processScannedRecords(records){

    if(!records || !records.length){

        alert("कोई रिकॉर्ड नहीं मिला।");

        return;

    }

    for(const farmer of records){

        await fillScannerForm(farmer);

        applyScannerRate(farmer);

        if(typeof calculateTotal==="function"){

            calculateTotal();

        }

        if(typeof save==="function"){

            await save();

        }

        await new Promise(r=>setTimeout(r,500));

    }

    alert("✅ " + records.length + " रिकॉर्ड सफलतापूर्वक सेव हो गए।");

}

window.processScannedRecords = processScannedRecords;
// ==========================================
// PART 11
// SCAN SUMMARY + MEMORY REFRESH
// ==========================================

async function finishScanner(records){

    const success =
        records ? records.length : 0;

    window.RAJ_AI.scanner.lastResult = records;

    window.RAJ_AI.scanner.lastScan = new Date();

    window.RAJ_AI.scanner.successScans += success;

    window.RAJ_AI.scanner.scanning = false;

    if(typeof refreshRajMemory==="function"){

        await refreshRajMemory();

    }

    if(typeof buildRajIndexes==="function"){

        buildRajIndexes();

    }

    alert(
        "✅ Scan Complete\n\n" +
        "Records : " + success +
        "\nMemory Updated Successfully."
    );

    return true;

}

window.finishScanner = finishScanner;

// ---------- Validate ----------


// ---------- Public ----------
window.buildScannerPrompt=
buildScannerPrompt;

window.sendScannerToGemini=
sendScannerToGemini;

window.parseScannerResponse=
parseScannerResponse;

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

        await processScannedRecords(records);

await finishScanner(records);

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
// PART 5
// SCAN BUTTON + OCR START
// ==========================================

const scanBtn = document.getElementById("scan-btn");

if (scanBtn) {

    scanBtn.addEventListener("click", async () => {

        const fileInput =
            document.getElementById("register-image");

        if (!fileInput || !fileInput.files.length) {

            alert("कृपया पहले फोटो चुनें।");

            return;

        }

        try {

            const file = fileInput.files[0];

            alert("AI रजिस्टर पढ़ रहा है...");

            const records =
                await startScanner(file);

            if (!records || !records.length) {

                alert("कोई रिकॉर्ड नहीं मिला।");

                return;

            }

            alert("कुल रिकॉर्ड : " + records.length);

        } catch (e) {

            console.error(e);

            alert("Scanner Error : " + e.message);

        }

    });

            }

// ==========================================
// END OF RAJ AI SCANNER
// ==========================================

