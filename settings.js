import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// ==========================================
// FIREBASE
// ==========================================

const firebaseConfig = {

    apiKey: "AIzaSyDJiW2pdtRFOtz__jAhZl7tYd4rQmmlUwA",

    authDomain:
        "chhapola-agriculture-e7313.firebaseapp.com",

    projectId:
        "chhapola-agriculture-e7313",

    storageBucket:
        "chhapola-agriculture-e7313.firebasestorage.app",

    messagingSenderId:
        "717143487417",

    appId:
        "1:717143487417:web:cabdec68e69ac794197c68",

    measurementId:
        "G-YZPYMQEDMC"
};


const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


// ==========================================
// ADMIN
// ==========================================

const ADMIN_EMAIL =
    "jaichhapola@gmail.com";


// ==========================================
// SETTINGS DOCUMENT
// ==========================================

const settingsRef =
    doc(
        db,
        "settings",
        "global"
    );


// ==========================================
// DEFAULT SETTINGS
// ==========================================

const defaults = {

    siteName:
        "Chhapola Agriculture",

    tagline:
        "Tractor Account System",

    siteStatus:
        "live",

    language:
        "hi",

    currency:
        "₹",


    // Branding

    logoUrl:
        "",

    faviconUrl:
        "",

    theme:
        "system",

    primaryColor:
        "#176b35",

    footerText:
        "Chhapola Agriculture",


    // Users

    allowSignup:
        true,

    allowProfileEdit:
        true,

    maxUsers:
        0,

    blockedMessage:
        "🚫 आपका Account Block है। Owner से संपर्क करें।",


    // Security

    sessionTimeout:
        60,

    minPasswordLength:
        6,

    enforceBlocked:
        true,

    adminOnlySettings:
        true,


    // Plans

    freePrice:
        0,

    basicPrice:
        0,

    proPrice:
        0,

    premiumPrice:
        0,

    basicDays:
        30,

    proDays:
        30,

    premiumDays:
        30,

    expiryWarningDays:
        7,


    // Business

    businessName:
        "Chhapola Agriculture",

    ownerName:
        "",

    tractorModel:
        "Swaraj 744 XT 5 Star",

    defaultRate:
        0,

    defaultUnit:
        "Bigha",


    // AI

    aiEnabled:
        true,

    aiLanguage:
        "hi",

    aiDailyLimit:
        0,

    aiAnalysis:
        true,


    // Voice

    voiceEnabled:
        true,

    scannerEnabled:
        true,

    ocrAutoFill:
        true,


    // Notifications

    expiryNotifications:
        true,

    newUserNotification:
        true,

    featureNotification:
        true,


    // Announcement

    announcementEnabled:
        false,

    announcementTitle:
        "",

    announcementMessage:
        "",


    // Support

    supportMobile:
        "",

    whatsappNumber:
        "",

    supportEmail:
        "",

    supportMessage:
        "",


    // PDF

    pdfBusinessName:
        "Chhapola Agriculture",

    pdfFooter:
        "",

    pdfLogo:
        true,

    pdfContact:
        true,


    // Maintenance

    maintenanceMode:
        false,

    maintenanceMessage:
        "Website maintenance में है। कृपया बाद में प्रयास करें।",

    maintenanceStart:
        "",

    maintenanceEnd:
        "",


    // Regional

    dateFormat:
        "YYYY-MM-DD",

    timezone:
        "Asia/Kolkata",

    numberFormat:
        "en-IN"

};


let settings =
    {
        ...defaults
    };


// ==========================================
// ELEMENT
// ==========================================

function el(id){

    return document.getElementById(id);

}


// ==========================================
// MESSAGE
// ==========================================

function showMessage(
    text,
    error = false
){

    const box =
        el("message");

    if(!box){
        return;
    }

    box.textContent =
        text;

    box.style.display =
        "block";

    box.style.background =
        error
        ? "#ffe5e5"
        : "#e6f5ea";

    box.style.color =
        error
        ? "#a00018"
        : "#145b2c";


    setTimeout(
        () => {

            box.style.display =
                "none";

        },
        3000
    );

}


// ==========================================
// FORM FIELDS
// ==========================================

const fieldNames =
    Object.keys(defaults);


// ==========================================
// FILL FORM
// ==========================================

function fillForm(){

    fieldNames.forEach(
        key => {

            const input =
                el(key);

            if(!input){
                return;
            }


            if(
                input.type ===
                "checkbox"
            ){

                input.checked =
                    Boolean(
                        settings[key]
                    );

            }

            else{

                input.value =
                    settings[key]
                    ?? "";

            }

        }
    );


    if(
        settings.updatedAt
    ){

        el(
            "lastSaved"
        ).textContent =
            new Date(
                settings.updatedAt
            )
            .toLocaleString(
                "en-IN"
            );

    }

}


// ==========================================
// READ FORM
// ==========================================

function readForm(){

    fieldNames.forEach(
        key => {

            const input =
                el(key);

            if(!input){
                return;
            }


            if(
                input.type ===
                "checkbox"
            ){

                settings[key] =
                    input.checked;

            }

            else if(
                input.type ===
                "number"
            ){

                settings[key] =
                    Number(
                        input.value ||
                        0
                    );

            }

            else{

                settings[key] =
                    input.value;

            }

        }
    );

}


// ==========================================
// LOAD SETTINGS
// ==========================================

async function loadSettings(){

    const snapshot =
        await getDoc(
            settingsRef
        );


    if(
        snapshot.exists()
    ){

        settings =
            {
                ...defaults,
                ...snapshot.data()
            };

    }

    else{

        settings =
            {
                ...defaults
            };

        await setDoc(
            settingsRef,
            {
                ...settings,

                updatedAt:
                    new Date()
                    .toISOString(),

                updatedBy:
                    auth.currentUser
                    ?.email || ""

            },
            {
                merge:true
            }
        );

    }


    fillForm();


    if(
        el("firebaseStatus")
    ){

        el(
            "firebaseStatus"
        ).textContent =
            "🟢 Connected";

    }

}


// ==========================================
// SAVE SETTINGS
// ==========================================

async function saveSettings(){

    try{

        readForm();


        settings.updatedAt =
            new Date()
            .toISOString();


        settings.updatedBy =
            auth.currentUser
            ?.email || "";


        await setDoc(

            settingsRef,

            settings,

            {
                merge:true
            }

        );


        fillForm();


        showMessage(
            "✅ Settings Firebase में Save हो गईं।"
        );


    }

    catch(error){

        console.error(
            "SETTINGS SAVE ERROR:",
            error
        );


        showMessage(
            "❌ Settings Save नहीं हुई: " +
            error.message,

            true
        );

    }

}


// ==========================================
// RESET
// ==========================================

function resetSettings(){

    const ok =
        confirm(
            "क्या सभी Settings को Default पर वापस करना है?"
        );


    if(!ok){
        return;
    }


    settings =
        {
            ...defaults
        };


    fillForm();


    showMessage(
        "↩️ Default Settings तैयार हैं। Save दबाएँ।"
    );

}


// ==========================================
// NAVIGATION
// ==========================================

document
    .querySelectorAll(
        ".nav"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".nav"
                        )
                        .forEach(
                            x =>
                                x.classList
                                .remove(
                                    "active"
                                )
                        );


                    document
                        .querySelectorAll(
                            ".panel"
                        )
                        .forEach(
                            x =>
                                x.classList
                                .remove(
                                    "active"
                                )
                        );


                    button.classList
                        .add(
                            "active"
                        );


                    const target =
                        el(
                            button
                            .dataset
                            .target
                        );


                    if(target){

                        target.classList
                            .add(
                                "active"
                            );

                    }

                }
            );

        }
    );


// ==========================================
// BUTTONS
// ==========================================

el(
    "saveBtn"
)?.addEventListener(
    "click",
    saveSettings
);


el(
    "saveTop"
)?.addEventListener(
    "click",
    saveSettings
);


el(
    "resetAll"
)?.addEventListener(
    "click",
    resetSettings
);


el(
    "resetSettings"
)?.addEventListener(
    "click",
    resetSettings
);


// ==========================================
// AUTH CHECK
// ==========================================

onAuthStateChanged(

    auth,

    async user => {

        if(!user){

            location.href =
                "admin.html";

            return;

        }


        const email =
            (
                user.email ||
                ""
            )
            .toLowerCase()
            .trim();


        if(
            email !==
            ADMIN_EMAIL
            .toLowerCase()
        ){

            await signOut(
                auth
            );


            alert(
                "❌ केवल Owner/Admin Settings खोल सकता है।"
            );


            location.href =
                "admin.html";


            return;

        }


        if(
            el(
                "adminStatus"
            )
        ){

            el(
                "adminStatus"
            ).textContent =
                "🟢 " +
                user.email;

        }


        try{

            await loadSettings();

        }

        catch(error){

            console.error(
                "SETTINGS LOAD ERROR:",
                error
            );


            if(
                el(
                    "firebaseStatus"
                )
            ){

                el(
                    "firebaseStatus"
                ).textContent =
                    "🔴 Error";

            }


            showMessage(
                "❌ Settings load नहीं हुई: " +
                error.message,

                true
            );

        }

    }

);


console.log(
    "✅ Chhapola Agriculture Settings Center Loaded"
);
