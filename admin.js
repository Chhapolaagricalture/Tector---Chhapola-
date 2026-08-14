// ==========================================
// CHHAPOLA AGRICULTURE
// OWNER / ADMIN PANEL - admin.js
// ==========================================

"use strict";

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// ==========================================
// FIREBASE CONFIG
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyDJiW2pdtRFOtz__jAhZl7tYd4rQmmlUwA",
    authDomain: "chhapola-agriculture-e7313.firebaseapp.com",
    projectId: "chhapola-agriculture-e7313",
    storageBucket: "chhapola-agriculture-e7313.firebasestorage.app",
    messagingSenderId: "717143487417",
    appId: "1:717143487417:web:cabdec68e69ac794197c68",
    measurementId: "G-YZPYMQEDMC"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ==========================================
// अपना ADMIN EMAIL यहां डालें
// ==========================================

const ADMIN_EMAIL = "YOUR_ADMIN_EMAIL_HERE";


// ==========================================
// ADMIN ELEMENTS
// ==========================================

const loginBox =
    document.getElementById("admin-login");

const dashboard =
    document.getElementById("admin-dashboard");

const loginForm =
    document.getElementById("admin-login-form");

const emailInput =
    document.getElementById("admin-email");

const passwordInput =
    document.getElementById("admin-password");

const errorBox =
    document.getElementById("admin-error");

const logoutBtn =
    document.getElementById("admin-logout");


// ==========================================
// SHOW LOGIN
// ==========================================

function showLogin() {

    if (loginBox) {

        loginBox.style.display = "block";

    }

    if (dashboard) {

        dashboard.style.display = "none";

    }

}


// ==========================================
// SHOW DASHBOARD
// ==========================================

function showDashboard() {

    if (loginBox) {

        loginBox.style.display = "none";

    }

    if (dashboard) {

        dashboard.style.display = "block";

    }

    loadAdminStats();

}


// ==========================================
// ERROR
// ==========================================

function showError(message) {

    if (errorBox) {

        errorBox.textContent = message;

        errorBox.style.display = "block";

    } else {

        alert(message);

    }

}


// ==========================================
// ADMIN CHECK
// ==========================================

function isAdmin(user) {

    if (!user || !user.email) {

        return false;

    }

    return (
        user.email.toLowerCase() ===
        ADMIN_EMAIL.toLowerCase()
    );

}


// ==========================================
// LOGIN STATE
// ==========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        showLogin();

        return;

    }


    if (!isAdmin(user)) {

        await signOut(auth);

        showError(
            "यह account Owner/Admin account नहीं है।"
        );

        showLogin();

        return;

    }


    showDashboard();

});


// ==========================================
// ADMIN LOGIN
// ==========================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                emailInput
                ? emailInput.value.trim()
                : "";


            const password =
                passwordInput
                ? passwordInput.value
                : "";


            if (!email || !password) {

                showError(
                    "Email और Password भरें।"
                );

                return;

            }


            if (
                email.toLowerCase() !==
                ADMIN_EMAIL.toLowerCase()
            ) {

                showError(
                    "यह Owner/Admin email नहीं है।"
                );

                return;

            }


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            } catch (error) {

                console.error(
                    "Admin Login Error:",
                    error
                );

                showError(
                    "Login असफल हुआ। Email या Password जाँचें।"
                );

            }

        }
    );

}


// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                showLogin();

            } catch (error) {

                console.error(
                    "Logout Error:",
                    error
                );

            }

        }
    );

}


// ==========================================
// FORGOT PASSWORD
// ==========================================

window.adminForgotPassword = async function () {

    const email =
        emailInput
        ? emailInput.value.trim()
        : ADMIN_EMAIL;


    if (!email) {

        showError(
            "पहले Admin email डालें।"
        );

        return;

    }


    try {

        await sendPasswordResetEmail(
            auth,
            email
        );


        alert(
            "Password reset link आपके email पर भेज दिया गया है।"
        );


    } catch (error) {

        console.error(
            "Password Reset Error:",
            error
        );


        showError(
            "Password reset email भेजने में समस्या हुई।"
        );

    }

};


// ==========================================
// ADMIN STATISTICS
// ==========================================

async function loadAdminStats() {

    try {

        let totalRecords = 0;


        const collectionsToCheck = [

            "entries",

            "records",

            "farmers",

            "data",

            "khata"

        ];


        for (
            const collectionName
            of collectionsToCheck
        ) {

            try {

                const snapshot =
                    await getDocs(
                        collection(
                            db,
                            collectionName
                        )
                    );


                totalRecords +=
                    snapshot.size;


            } catch (error) {

                console.log(
                    "Collection not found:",
                    collectionName
                );

            }

        }


        const recordElement =
            document.getElementById(
                "admin-total-records"
            );


        if (recordElement) {

            recordElement.textContent =
                totalRecords;

        }


    } catch (error) {

        console.error(
            "Admin Statistics Error:",
            error
        );

    }

}


// ==========================================
// GLOBAL ADMIN OBJECT
// ==========================================

window.RAJ_ADMIN = {

    auth: auth,

    db: db,

    isAdmin: isAdmin,

    loadAdminStats: loadAdminStats,

    showDashboard: showDashboard,

    showLogin: showLogin

};
