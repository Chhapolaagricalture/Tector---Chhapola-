// ==========================================
// CHHAPOLA AGRICULTURE
// OWNER / ADMIN PANEL - admin.js
// ==========================================

"use strict";

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

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
// ADMIN EMAIL
// ==========================================

const ADMIN_EMAIL = "jaichhapola@gmail.com";

// ==========================================
// CURRENT admin.html ELEMENTS
// ==========================================

const adminLogin =
    document.getElementById("adminLogin");

const adminApp =
    document.getElementById("adminApp");

const adminEmail =
    document.getElementById("adminEmail");

const adminPassword =
    document.getElementById("adminPassword");

const adminLoginBtn =
    document.getElementById("adminLoginBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const refreshBtn =
    document.getElementById("refreshBtn");

const loginMessage =
    document.getElementById("loginMessage");

const adminUser =
    document.getElementById("adminUser");

const userCount =
    document.getElementById("userCount");

const tractorOwnerCount =
    document.getElementById("tractorOwnerCount");

const recordCount =
    document.getElementById("recordCount");

const incomeTotal =
    document.getElementById("incomeTotal");

const usersBody =
    document.getElementById("usersBody");

// ==========================================
// LOGIN SCREEN
// ==========================================

function showLogin(message = "") {

    if (adminLogin) {
        adminLogin.classList.remove("hidden");
    }

    if (adminApp) {
        adminApp.classList.add("hidden");
    }

    if (loginMessage) {
        loginMessage.textContent = message;
    }
}

// ==========================================
// ADMIN PANEL
// ==========================================

function showDashboard(user) {

    if (adminLogin) {
        adminLogin.classList.add("hidden");
    }

    if (adminApp) {
        adminApp.classList.remove("hidden");
    }

    if (adminUser) {
        adminUser.textContent =
            user?.email || "";
    }

    loadAdminData();
}

// ==========================================
// ADMIN CHECK
// ==========================================

function isAdmin(user) {

    if (!user || !user.email) {
        return false;
    }

    return (
        user.email.toLowerCase().trim() ===
        ADMIN_EMAIL.toLowerCase().trim()
    );
}

// ==========================================
// MONEY
// ==========================================

function money(value) {

    return "₹" +
        Number(value || 0)
        .toLocaleString("en-IN");
}

// ==========================================
// LOGIN
// ==========================================

if (adminLoginBtn) {

    adminLoginBtn.addEventListener(
        "click",
        async function () {

            const email =
                adminEmail
                ? adminEmail.value.trim()
                : "";

            const password =
                adminPassword
                ? adminPassword.value
                : "";

            if (!email || !password) {

                if (loginMessage) {
                    loginMessage.textContent =
                        "Email और Password भरें।";
                }

                return;
            }

            if (
                email.toLowerCase() !==
                ADMIN_EMAIL.toLowerCase()
            ) {

                if (loginMessage) {
                    loginMessage.textContent =
                        "यह Owner/Admin email नहीं है।";
                }

                return;
            }

            adminLoginBtn.disabled = true;
            adminLoginBtn.textContent = "LOGIN...";

            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                if (loginMessage) {
                    loginMessage.textContent = "";
                }

            } catch (error) {

                console.error(
                    "ADMIN LOGIN ERROR:",
                    error
                );

                let message =
                    "❌ Login नहीं हुआ।";

                if (
                    error.code ===
                    "auth/invalid-credential"
                ) {

                    message =
                        "❌ Email या Password गलत है।";

                } else if (
                    error.code ===
                    "auth/user-not-found"
                ) {

                    message =
                        "❌ यह Admin account Firebase में नहीं है।";

                } else if (
                    error.code ===
                    "auth/wrong-password"
                ) {

                    message =
                        "❌ Password गलत है।";

                } else if (
                    error.code ===
                    "auth/invalid-email"
                ) {

                    message =
                        "❌ Email गलत है।";
                }

                if (loginMessage) {
                    loginMessage.textContent =
                        message;
                }

            } finally {

                adminLoginBtn.disabled = false;
                adminLoginBtn.textContent = "LOGIN";

            }
        }
    );
}

// ==========================================
// ENTER KEY
// ==========================================

if (adminPassword) {

    adminPassword.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                adminLoginBtn
            ) {

                adminLoginBtn.click();

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
        async function () {

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

window.adminForgotPassword =
async function () {

    const email =
        adminEmail
        ? adminEmail.value.trim()
        : ADMIN_EMAIL;

    try {

        await sendPasswordResetEmail(
            auth,
            email || ADMIN_EMAIL
        );

        alert(
            "✅ Password reset link email पर भेज दिया गया।"
        );

    } catch (error) {

        console.error(
            "Reset Password Error:",
            error
        );

        if (loginMessage) {

            loginMessage.textContent =
                "❌ Password reset email नहीं भेजी गई।";
        }
    }
};

// ==========================================
// LOAD ADMIN DATA
// ==========================================

async function loadAdminData() {

    if (!usersBody) {
        return;
    }

    usersBody.innerHTML =
        `<tr>
            <td colspan="5">
                Loading...
            </td>
        </tr>`;

    try {

        const snapshot =
            await getDocs(
                collection(db, "records")
            );

        const records =
            snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        let totalIncome = 0;

        const owners = new Map();

        // ==================================
        // RECORD ANALYSIS
        // ==================================

        records.forEach(record => {

            totalIncome +=
                Number(record.total || 0);

            const ownerUid =
                record.ownerUid ||
                "OLD / NO OWNER UID";

            if (!owners.has(ownerUid)) {

                owners.set(ownerUid, {

                    uid: ownerUid,

                    records: 0,

                    farmers: new Set(),

                    lastDate: ""

                });
            }

            const owner =
                owners.get(ownerUid);

            owner.records++;

            if (record.name) {

                owner.farmers.add(
                    record.name
                    .trim()
                    .toLowerCase()
                );
            }

            if (
                record.date &&
                (
                    !owner.lastDate ||
                    record.date > owner.lastDate
                )
            ) {

                owner.lastDate =
                    record.date;
            }
        });

        // ==================================
        // DASHBOARD
        // ==================================

        if (userCount) {

            userCount.textContent =
                owners.size;
        }

        if (tractorOwnerCount) {

            tractorOwnerCount.textContent =
                owners.size;
        }

        if (recordCount) {

            recordCount.textContent =
                records.length;
        }

        if (incomeTotal) {

            incomeTotal.textContent =
                money(totalIncome);
        }

        // ==================================
        // USERS TABLE
        // ==================================

        if (owners.size === 0) {

            usersBody.innerHTML =
                `<tr>
                    <td colspan="5">
                        अभी कोई User/Owner record नहीं मिला।
                    </td>
                </tr>`;

            return;
        }

        usersBody.innerHTML =
            [...owners.values()]
            .sort(
                (a, b) =>
                    String(b.lastDate)
                    .localeCompare(
                        String(a.lastDate)
                    )
            )
            .map(owner => {

                return `
                <tr>

                    <td>
                        ${owner.uid}
                    </td>

                    <td>
                        ${
                            owner.uid ===
                            "OLD / NO OWNER UID"
                            ? "पुराना Record"
                            : "Firebase User"
                        }
                    </td>

                    <td>
                        Active
                    </td>

                    <td>
                        ${owner.lastDate || "-"}
                    </td>

                    <td>
                        ${owner.records}
                    </td>

                </tr>
                `;

            })
            .join("");

    } catch (error) {

        console.error(
            "ADMIN FIRESTORE ERROR:",
            error
        );

        usersBody.innerHTML =
            `<tr>
                <td colspan="5"
                    style="color:red">

                    ❌ Firebase data load नहीं हुआ।

                    <br><br>

                    ${
                        error.code ===
                        "permission-denied"
                        ? "Firestore Rules Admin को records पढ़ने की permission नहीं दे रहे हैं।"
                        : error.message
                    }

                </td>
            </tr>`;
    }
}

// ==========================================
// REFRESH
// ==========================================

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        loadAdminData
    );
}

// ==========================================
// AUTH STATE
// ==========================================

onAuthStateChanged(
    auth,
    async function (user) {

        if (!user) {

            showLogin();

            return;
        }

        if (!isAdmin(user)) {

            await signOut(auth);

            showLogin(
                "❌ यह account Owner/Admin account नहीं है।"
            );

            return;
        }

        showDashboard(user);
    }
);

// ==========================================
// GLOBAL ADMIN OBJECT
// ==========================================

window.RAJ_ADMIN = {

    auth: auth,

    db: db,

    isAdmin: isAdmin,

    loadAdminData: loadAdminData,

    showDashboard: showDashboard,

    showLogin: showLogin

};

console.log(
    "✅ Chhapola Admin Panel Loaded"
);
