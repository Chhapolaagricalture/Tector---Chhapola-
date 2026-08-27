// ==========================================
// RAJ AI SCANNER v1.0
// Part 1 - Foundation
// ==========================================

"use strict";
// alert removed — was debug only
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
You are the official AI OCR Scanner for Chhapola Agriculture.

You are reading a handwritten Indian agriculture/tractor service register.

Your job is NOT just to read letters.

You must understand the meaning of the handwriting according to the rules below and convert every valid register entry into correct structured data.

==================================================
1. IMPORTANT — READ THE COMPLETE PAGE
==================================================

Read the entire register page from top to bottom.

Do not skip any farmer.

Do not skip any work entry.

Do not create an entry if there is no real work or amount written.

Do not add 0/0/0 records just because a blank line exists.

Do not guess unclear information.

If something is unclear, keep it empty instead of inventing data.

==================================================
2. FARMER NAME — MOST IMPORTANT
==================================================

The farmer name must ALWAYS be returned in ENGLISH.

Example:

"फूलाराम कांतिवाल"
→ "Fula Ram Kantiwal"

"ओमप्रकाश खरवा"
→ "Omprakash Kharva"

"रोहिताश मीणा"
→ "Rohitash Meena"

Hindi, English, Marwadi-style spelling and pronunciation may look different.

They can still represent the SAME farmer.

For example:

Rohitash Meena
Rohitas Meena
रोहिताश मीणा
रोहितास मीना

should normally be treated as the same farmer.

DO NOT create a new farmer just because spelling is slightly different.

Use phonetic understanding.

If the same farmer appears again later on the page, keep the same English name.

==================================================
3. REPEATED FARMER NAME
==================================================

If a new line starts with quotation marks, ditto marks, "..." or the farmer name is omitted,

use the previous farmer name.

Example:

Ramesh
Hero 8 B

"
Calti 5 B

means both entries belong to:

Ramesh

Do NOT create another farmer.

==================================================
4. DATE RULE
==================================================

The date written on the right/top side applies to all entries below it until another date appears.

Every entry must receive the correct date.

Never copy a date from an unrelated page.

==================================================
5. WORK NAME RULES
==================================================

The following handwritten abbreviations mean:

BH = Hero
BK = Calti
BDP = Displau
BMP = Morplau
मेज / मेज (पाटा) = Mej (Pata)

Keep these work names in English in the output.

==================================================
6. BIGHA WORK
==================================================

These works use BIGHA calculation:

Hero
Calti
Morplau
Displau
Mej (Pata)

For these:

bigha = written quantity

unit = empty

hours = empty

minutes = empty

crop = empty unless explicitly written

Do NOT put previous Thresher time into these entries.

==================================================
7. SPRAY MACHINE
==================================================

"स्प्रे मशीन"
"स्प्रे"
"दवाई टंकी"
or handwriting referring to spray machine

means:

work_type = Spray Machine

Spray Machine uses:

unit = Quantity

quantity = written quantity

bigha = empty

hours = empty

minutes = empty

Never convert Spray Machine into Thresher.

==================================================
8. THRESHER RULE
==================================================

If the register shows a crop being threshed/kadhai and time is written,

work_type = Thresher

Examples:

गेहूं कढ़ाई 50 mi
मोठ कढ़ाई 30 mi
चना कढ़ाई 1 hr
सरसों कढ़ाई 2 hr 30 min

means:

work_type = Thresher

crop = corresponding crop

time = corresponding hours/minutes

==================================================
9. THRESHER CROPS
==================================================

Common Thresher crops include:

Gehu
Chana
Sarso
Masur
Jau
Gawar
Moth
Moong
Makka
and other crops when the register clearly indicates threshing.

Recognize Hindi handwriting and spelling variations.

Examples:

गेहूं / गेहू / गेहु
→ Gehu

चना
→ Chana

सरसों / सरसो
→ Sarso

मसूर
→ Masur

जौ
→ Jau

ग्वार / गवार
→ Gawar

मोठ
→ Moth

मूंग / मुंग
→ Moong

मक्का
→ Makka

==================================================
10. BAJRA SPECIAL RULE — VERY IMPORTANT
==================================================

BAJRA IS NOT NORMAL THRESHER.

If Bajra is written with KIV/KIV, then:

work_type = Bajra

unit = KIV

quantity = written number

Example:

20 KIV
→
work_type = Bajra
unit = KIV
quantity = 20

25 KIV
→
work_type = Bajra
unit = KIV
quantity = 25

NEVER convert:

20 KIV

into:

20 Hours

NEVER convert Bajra KIV into Thresher hours.

If Bajra is clearly written with KIV, KIV has priority.

==================================================
11. TIME RULE
==================================================

If Thresher time is written:

50 mi
30 mi
45 min
1 hr
2 hr
1 hr 30 min
2:30

interpret it as Thresher time.

Examples:

Gehu kadhai 50 mi

→ work_type = Thresher
→ crop = Gehu
→ minutes = 50

Moth kadhai 30 mi

→ work_type = Thresher
→ crop = Moth
→ minutes = 30

==================================================
12. CRITICAL — NEVER COPY TIME TO NEXT ENTRY
==================================================

EVERY REGISTER LINE IS AN INDEPENDENT ENTRY.

If:

Ramesh
Thresher
Gehu
50 minutes

then next line:

Hero 8 B

must be:

work_type = Hero
bigha = 8
hours = empty
minutes = empty

DO NOT copy 50 minutes to Hero.

Likewise:

Thresher → 2 hours 30 minutes

next:

Calti → 5 B

must NOT contain 2 hours 30 minutes.

Reset unrelated fields for EVERY new entry.

==================================================
13. KIV RULE
==================================================

KIV means the quantity/unit used for Bajra work.

If KIV is written with Bajra:

unit = KIV

quantity = number

Do not interpret KIV as hours.

Do not interpret KIV as bigha.

==================================================
14. PENDING BALANCE
==================================================

If the register clearly says:

बाकी
पिछला बाकी
पुराना बाकी
कुल बाकी
Pending Balance

then:

work_type = Pending Balance

rate = written amount if applicable

paid_amount = 0 unless another payment is explicitly written.

Do not treat Pending Balance as a tractor work.

==================================================
15. PAID AMOUNT
==================================================

If the register says:

जमा
paid
cash जमा
amount जमा
or clearly shows an amount paid,

put that amount into:

paid_amount

If no payment is written:

paid_amount = 0

Never invent payment.

==================================================
16. BLANK ENTRY RULE
==================================================

Do NOT create records like:

work_type = ""
quantity = 0
paid = 0

just because a blank row exists.

Only create an entry when the register contains meaningful information such as:

farmer name + work

or

work + quantity

or

payment

or

pending balance.

==================================================
17. WORK CALCULATION MEANING
==================================================

Hero:
quantity = Bigha

Calti:
quantity = Bigha

Morplau:
quantity = Bigha

Displau:
quantity = Bigha

Mej (Pata):
quantity = Bigha

Spray Machine:
quantity = Quantity

Thresher:
quantity = Time
hours/minutes = time

Bajra:
quantity = KIV quantity
unit = KIV

==================================================
18. RATE MAPPING
==================================================

Do not confuse work types.

Known rates:

Hero = 250 per Bigha

Calti = 250 per Bigha

Morplau = 500 per Bigha

Displau = 500 per Bigha

Thresher = 1200 per Hour

Bajra = 150 per KIV

Spray Machine = 800 per Quantity

Mej (Pata) = use the rate from the register/application if explicitly available.

Do not invent a rate if it is not known.

==================================================
19. HANDWRITING INTERPRETATION
==================================================

The handwriting may contain:

Hindi
English
Marwadi-style writing
abbreviations
short forms
phonetic spellings
numbers mixed with words.

Understand the meaning, not just the exact spelling.

Examples:

हीरो → Hero

कल्टी / कल्टीवेटर → Calti

मोर / मोरप्लाउ → Morplau

डिस्प्लाउ / डिस्प्ले → Displau

मेज / पाटा / मेज पाटा → Mej (Pata)

स्प्रे / दवाई टंकी → Spray Machine

गेहूं कढ़ाई → Thresher + Gehu

मोठ कढ़ाई → Thresher + Moth

बाजरा KIV → Bajra + KIV

==================================================
20. NAME DUPLICATE PROTECTION
==================================================

Before creating a new farmer name, compare it with previous names.

If spelling differs only slightly, treat it as the same farmer.

Do NOT create:

Rohitash Meena
and
Rohitas Meena

as two separate farmers.

Use the most reliable English spelling from the page.

==================================================
21. NEVER MIX TWO ENTRIES
==================================================

Each physical register line is one independent record unless the handwriting clearly shows continuation.

Do not carry:

previous crop
previous unit
previous bigha
previous hours
previous minutes
previous rate
previous payment

into the next unrelated entry.

ONLY farmer name and date may be inherited according to the rules above.

==================================================
22. EXAMPLES
==================================================

Example 1:

हीरो 8 बी

Output:

work_type = Hero
bigha = 8
hours = ""
minutes = ""

Example 2:

कल्टी 5 बी

Output:

work_type = Calti
bigha = 5

Example 3:

गेहूं कढ़ाई 50 मी

Output:

work_type = Thresher
crop = Gehu
minutes = 50

Example 4:

मोठ कढ़ाई 30 मी

Output:

work_type = Thresher
crop = Moth
minutes = 30

Example 5:

बाजरा 20 KIV

Output:

work_type = Bajra
unit = KIV
quantity = 20
hours = ""
minutes = ""

Example 6:

Thresher Gehu 2 hr 30 min
then next line:
Hero 8 B

The Hero record MUST have:

work_type = Hero
bigha = 8
hours = ""
minutes = ""

Never copy 2 hr 30 min.

Example 7:

Fula ram Kantiwal
Hero 12 B
Calti 12 B

All belong to:

Fula Ram Kantiwal

Example 8:

Rohitash Meena
Hero 8 B

"
Calti 5 B

Both records belong to:

Rohitash Meena

Half Examples:

1½=1.5
2½=2.5
3½=3.5
4½=4.5
5½=5.5
6½=6.5
7½=7.5
8½=8.5
==================================================
23. OUTPUT LANGUAGE
==================================================

Farmer name = ALWAYS ENGLISH.

Work type = ENGLISH.

Crop = ENGLISH.

Unit = ENGLISH.

Do not return Hindi names.

==================================================
24. FINAL OUTPUT
==================================================

Return ONLY valid JSON.

No explanation.

No markdown.

No comments.

Use exactly this structure:

[
  {
    "farmer_name": "",
    "work_date": "",
    "mobile_number": "",
    "work_type": "",
    "crop": "",
    "unit": "",
    "quantity": "",
    "hours": "",
    "minutes": "",
    "bigha": "",
    "paid_amount": "0"
  }
]

IMPORTANT:

Accuracy is more important than guessing.

If handwriting is unclear:
leave that particular field empty.

Never invent a farmer.

Never invent a work.

Never invent a quantity.

Never invent a time.

Never convert Bajra KIV into Thresher Hours.

Never copy Thresher time into the next work entry.

Never create blank 0/0/0 records.

`;
}

// ---------- Gemini ----------
async function sendScannerToGemini(base64){

    if(typeof callGeminiAPI!=="function"){

        throw new Error("Gemini API Missing — AI service connected nahi hai.");

    }

    // Single request — NO retry on rate limit (each retry wastes quota)
    const response = await callGeminiAPI(
        buildScannerPrompt(),
        base64
    );

    if(!response){
        throw new Error("Empty response from Gemini API.");
    }

    if(response.error){
        throw new Error(response.error.message || "Gemini API error.");
    }

    return response;

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
// ==========================================
// SCANNER → FORM FILL
// ==========================================

async function fillScannerForm(farmer) {

    // -----------------------------
    // 1. पहले पुराने सभी values साफ
    // -----------------------------

    const nameBox = document.getElementById("name");
    const dateBox = document.getElementById("date");
    const mobileBox = document.getElementById("mobile");
    const workBox = document.getElementById("work");
    const cropBox = document.getElementById("crop");
    const bighaBox = document.getElementById("bigha");
    const rateBox = document.getElementById("rate");
    const paidBox = document.getElementById("paid");
    const unitValueBox = document.getElementById("unitValue");
    const hoursBox = document.getElementById("hours");
    const minutesBox = document.getElementById("minutes");

    // बहुत जरूरी:
    // हर नई entry के लिए पुराने values हटाएं

    if (nameBox) nameBox.value = "";
    if (dateBox) dateBox.value = "";
    if (mobileBox) mobileBox.value = "";
    if (bighaBox) bighaBox.value = "";
    if (rateBox) rateBox.value = "";
    if (paidBox) paidBox.value = "0";
    if (unitValueBox) unitValueBox.value = "";
    if (hoursBox) hoursBox.value = "";
    if (minutesBox) minutesBox.value = "";

    if (cropBox) {
        cropBox.value = "";
    }

    // -----------------------------
    // 2. Farmer basic information
    // -----------------------------

    if (nameBox) {
        nameBox.value =
            farmer.farmer_name ||
            farmer.farmer ||
            farmer.name ||
            "";
    }

    if (dateBox) {
        dateBox.value =
            farmer.work_date || "";
    }

    if (mobileBox) {
        mobileBox.value =
            farmer.mobile_number || "";
    }

    // -----------------------------
    // 3. Work select
    // -----------------------------

    const work = farmer.work_type || "";

    if (workBox) {

        workBox.value = work;

        // website का change event चलाएं
        workBox.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        // UI update होने दें
        await new Promise(resolve =>
            setTimeout(resolve, 200)
        );
    }

    // -----------------------------
    // 4. Crop
    // -----------------------------

    if (cropBox && farmer.crop) {

        cropBox.value = farmer.crop;

        cropBox.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        await new Promise(resolve =>
            setTimeout(resolve, 100)
        );
    }

    // -----------------------------
    // 5. WORK TYPE के हिसाब से DATA
    // -----------------------------

    // =================================
    // BIGHA WORK
    // =================================

    const bighaWorks = [
        "Hero",
        "Calti",
        "Morplau",
        "Displau",
        "Mej (Pata)"
    ];

    if (bighaWorks.includes(work)) {

        const bigha =
            farmer.bigha ||
            farmer.quantity ||
            "";

        if (bighaBox) {
            bighaBox.value = bigha;
        }

        // इन कामों में TIME बिल्कुल खाली
        if (hoursBox) hoursBox.value = "";
        if (minutesBox) minutesBox.value = "";

        if (unitValueBox) unitValueBox.value = "";
    }

    // =================================
    // SPRAY MACHINE
    // =================================

    else if (work === "Spray Machine") {

        const quantity =
            farmer.quantity || "";

        if (unitValueBox) {
            unitValueBox.value = quantity;
        }

        if (bighaBox) bighaBox.value = "";

        if (hoursBox) hoursBox.value = "";
        if (minutesBox) minutesBox.value = "";
    }

    // =================================
    // BAJRA
    // =================================

    else if (work === "Bajra") {

        const quantity =
            farmer.quantity || "";

        if (cropBox) {
            cropBox.value = "Bajra";
        }

        if (unitValueBox) {
            unitValueBox.value = quantity;
        }

        if (bighaBox) bighaBox.value = "";

        if (hoursBox) hoursBox.value = "";
        if (minutesBox) minutesBox.value = "";
    }

    // =================================
    // THRESHER
    // =================================

    else if (work === "Thresher") {

        // Thresher में quantity से time नहीं बनाना।
        // Gemini से मिले hours/minutes ही इस्तेमाल होंगे।

        if (hoursBox) {
            hoursBox.value =
                farmer.hours !== undefined
                    ? farmer.hours
                    : "";
        }

        if (minutesBox) {
            minutesBox.value =
                farmer.minutes !== undefined
                    ? farmer.minutes
                    : "";
        }

        if (bighaBox) bighaBox.value = "";
        if (unitValueBox) unitValueBox.value = "";
    }

    // =================================
    // PENDING BALANCE
    // =================================

    else if (work === "Pending Balance") {

        if (bighaBox) bighaBox.value = "";

        if (unitValueBox) unitValueBox.value = "";

        if (hoursBox) hoursBox.value = "";
        if (minutesBox) minutesBox.value = "";

        if (rateBox) {
            rateBox.value =
                farmer.rate ||
                farmer.quantity ||
                "";
        }
    }

    // =================================
    // UNKNOWN / OTHER WORK
    // =================================

    else {

        if (bighaBox) bighaBox.value = "";
        if (unitValueBox) unitValueBox.value = "";
        if (hoursBox) hoursBox.value = "";
        if (minutesBox) minutesBox.value = "";
    }

    // -----------------------------
    // 6. Paid Amount
    // -----------------------------

    if (paidBox) {

        paidBox.value =
            farmer.paid_amount !== undefined
                ? farmer.paid_amount
                : "0";
    }

    // -----------------------------
    // 7. Rate
    // -----------------------------

    if (typeof applyScannerRate === "function") {

        applyScannerRate(farmer);

    }

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

    // अभी रिकॉर्ड सेव नहीं होंगे
    // पहले सभी स्कैन की गई एंट्री दिखेंगी
    window.scannedPendingRecords = records;

showScannedPreview(records);

return records;

}

window.processScannedRecords = processScannedRecords;

// ==========================================
// SCANNER PREVIEW + CONFIRM SAVE
// ==========================================

function showScannedPreview(records) {

    const box = document.getElementById("scannerPreview");

    if (!box) {
        alert("Scanner Preview Box नहीं मिला।");
        return;
    }

    let html = `
        <h3>📋 Scan की गई Entries</h3>
        <p>कुल Entries: <b>${records.length}</b></p>
    `;

    records.forEach((r, i) => {

        html += `
        <div class="scanner-entry"
             style="border:1px solid #ccc;
                    padding:10px;
                    margin:10px 0;
                    border-radius:8px;">

            <b>Entry ${i + 1}</b>

            <br>

            किसान:
            <input id="scan_name_${i}"
                   value="${r.farmer_name || ""}">

            <br>

            तारीख:
            <input type="date"
                   id="scan_date_${i}"
                   value="${r.work_date || ""}">

            <br>

            काम:
            <input id="scan_work_${i}"
                   value="${r.work_type || ""}">

            <br>

            फसल:
            <input id="scan_crop_${i}"
                   value="${r.crop || ""}">

            <br>

            मात्रा:
            <input id="scan_quantity_${i}"
                   value="${r.quantity || ""}">

            <br>

            बीघा:
            <input id="scan_bigha_${i}"
                   value="${r.bigha || ""}">

            <br>

            घंटे:
            <input id="scan_hours_${i}"
                   value="${r.hours || ""}">

            <br>

            मिनट:
            <input id="scan_minutes_${i}"
                   value="${r.minutes || ""}">

            <br>

            जमा:
            <input id="scan_paid_${i}"
                   value="${r.paid_amount || 0}">

        </div>
        `;
    });

    html += `
        <button onclick="confirmScannerSave()"
                style="background:#2e7d32;
                       color:white;
                       padding:12px 20px;
                       border:0;
                       border-radius:8px;
                       font-size:16px;">
            ✅ Confirm & Save
        </button>

        <button onclick="cancelScannerPreview()"
                style="background:#c62828;
                       color:white;
                       padding:12px 20px;
                       border:0;
                       border-radius:8px;
                       font-size:16px;">
            ❌ Cancel
        </button>
    `;

    box.innerHTML = html;
    box.style.display = "block";
}


// ==========================================
// CONFIRM AND SAVE
// ==========================================

async function confirmScannerSave() {

    const records = window.scannedPendingRecords;

    if (!records || !records.length) {

        alert("कोई Pending Scan Entry नहीं है।");
        return;

    }

    if (!confirm(
        "क्या सभी Entries सही हैं?\n\n" +
        "Confirm करने पर सभी Firebase में सेव हो जाएँगी।"
    )) {
        return;
    }

    try {

        for (let i = 0; i < records.length; i++) {

            const r = records[i];

            const farmer = {
                farmer_name:
                    document.getElementById(`scan_name_${i}`).value.trim(),

                work_date:
                    document.getElementById(`scan_date_${i}`).value,

                work_type:
                    document.getElementById(`scan_work_${i}`).value.trim(),

                crop:
                    document.getElementById(`scan_crop_${i}`).value.trim(),

                quantity:
                    document.getElementById(`scan_quantity_${i}`).value,

                bigha:
                    document.getElementById(`scan_bigha_${i}`).value,

                hours:
                    document.getElementById(`scan_hours_${i}`).value,

                minutes:
                    document.getElementById(`scan_minutes_${i}`).value,

                paid_amount:
                    document.getElementById(`scan_paid_${i}`).value || 0
            };

            await fillScannerForm(farmer);

            applyScannerRate(farmer);

            if (typeof calculateTotal === "function") {
                calculateTotal();
            }

            if (typeof save === "function") {
                await save();
            }

        }

        window.scannedPendingRecords = [];

        document.getElementById("scannerPreview").style.display = "none";

        alert(
            "✅ सभी " +
            records.length +
            " Entries सफलतापूर्वक Firebase में सेव हो गईं।"
        );

        show();

    } catch (error) {

        console.error(error);

        alert(
            "❌ Entry Save करने में समस्या आई:\n" +
            error.message
        );
    }
}


// ==========================================
// CANCEL
// ==========================================

function cancelScannerPreview() {

    window.scannedPendingRecords = [];

    const box =
        document.getElementById("scannerPreview");

    if (box) {

        box.innerHTML = "";

        box.style.display = "none";

    }

    alert("❌ Scan Entries रद्द कर दी गईं।");
}


window.showScannedPreview = showScannedPreview;
window.confirmScannerSave = confirmScannerSave;
window.cancelScannerPreview = cancelScannerPreview;
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

        scannerLog("Loading image...");

        const image = await loadScannerImage(file);

        scannerLog("Image loaded, sending to Gemini Vision...");

        const response = await sendScannerToGemini(

            image.base64

        );

        scannerLog("Gemini response received, parsing...");

        const parsed = parseScannerResponse(response);

        const records = validateScanRecords(parsed);

        scannerLog("Parsed records:", records.length);

        await processScannedRecords(records);

        await finishScanner(records);

        window.RAJ_AI.scanner.lastResult = records;

        window.RAJ_AI.scanner.lastScan = new Date();

        return records;

    }catch(e){

        window.RAJ_AI.scanner.failedScans++;

        window.RAJ_AI.scanner.scanning = false;

        let msg = "Scanner Error: ";

        if(e.message && e.message.includes("API Missing")){

            msg += "AI Service connected nahi hai. Baad mein try karein.";

        }else if(e.message && e.message.includes("timeout")){

            msg += "AI Service timeout. Image bada hai ya network slow hai.";

        }else if(e.message && e.message.includes("403")){

            msg += "API Key invalid hai. Admin se contact karein.";

        }else if(e.message && e.message.includes("429")){

            msg += "AI Service busy hai. Kuch der baad try karein.";

        }else{

            msg += (e.message || "Unknown error");

        }

        console.error("Scanner Error:", e);

        throw new Error(msg);

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
document.addEventListener("DOMContentLoaded", function () {

    const scanBtn = document.getElementById("scan-btn");

    if (!scanBtn) {
        console.error("Scanner Button #scan-btn नहीं मिला");
        return;
    }

    scanBtn.addEventListener("click", async function () {

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

        } catch (e) {        console.error("Scanner Error:", e);
        let userMsg = e.message || "Unknown error";
        if(userMsg.includes("RATE_LIMITED") || userMsg.includes("rate") || userMsg.includes("quota") || userMsg.includes("limit") || userMsg.includes("429")){
            userMsg = "AI Service का daily limit पूरा हो गया है।\n\n⏳ 1 minute बाद फिर try करें।\n\nTIP: Scan करने से पहले AI Munshi में ज्यादा सवाल न पूछें।";
        } else if(userMsg.includes("timeout") || userMsg.includes("overloaded") || userMsg.includes("503") || userMsg.includes("502")){
            userMsg = "AI Service overloaded है। 2-3 minute बाद try करें।";
        }
        alert("Scanner Error : " + userMsg);

        }

    });

});

// ==========================================
// END OF RAJ AI SCANNER
// ==========================================

