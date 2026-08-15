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
// ==========================================
// PROPER USER MANAGEMENT
// ==========================================

let adminUsers = [];


async function loadUserManagement() {

    const body = document.getElementById(
        "userManagementBody"
    );

    if (!body) return;

    body.innerHTML = `
        <tr>
            <td colspan="8">
                ⏳ Users Loading...
            </td>
        </tr>
    `;

    try {

        const snapshot = await getDocs(
            collection(db, "records")
        );

        const usersMap = new Map();

        snapshot.forEach((docSnap) => {

            const r = docSnap.data();

            const uid =
                r.ownerUid ||
                "OLD / NO OWNER UID";

            if (!usersMap.has(uid)) {

                usersMap.set(uid, {
                    uid: uid,
                    email:
                        r.email ||
                        "Firebase User",
                    status: "active",
                    records: 0,
                    total: 0,
                    paid: 0,
                    balance: 0
                });

            }

            const user = usersMap.get(uid);

            user.records++;

            user.total += Number(
                r.total || 0
            );

            user.paid += Number(
                r.paid || 0
            );

            user.balance += Number(
                r.baki ||
                (
                    Number(r.total || 0) -
                    Number(r.paid || 0)
                )
            );

        });


        adminUsers =
            Array.from(usersMap.values());


        renderAdminUsers();


    } catch (error) {

        console.error(
            "USER MANAGEMENT ERROR:",
            error
        );

        body.innerHTML = `
            <tr>
                <td colspan="8" style="color:red;">
                    ❌ Users load नहीं हुए
                    <br>
                    <small>
                        ${escapeHTML(
                            error?.message ||
                            "Unknown error"
                        )}
                    </small>
                </td>
            </tr>
        `;

    }

}

// ==========================================
// RENDER USERS
// ==========================================

function renderAdminUsers() {

    const body =
        document.getElementById(
            "userManagementBody"
        );

    if (!body) return;

    const search =
        (
            document.getElementById(
                "userSearch"
            )?.value || ""
        )
        .toLowerCase()
        .trim();

    const filter =
        document.getElementById(
            "userStatusFilter"
        )?.value || "all";


    let list =
        adminUsers.filter(user => {

            const text =
                (
                    user.uid +
                    " " +
                    user.email
                ).toLowerCase();

            if (
                search &&
                !text.includes(search)
            ) {
                return false;
            }

            if (
                filter !== "all" &&
                user.status !== filter
            ) {
                return false;
            }

            return true;

        });


    if (!list.length) {

        body.innerHTML = `
            <tr>
                <td colspan="8">
                    कोई User नहीं मिला।
                </td>
            </tr>
        `;

        return;
    }


    body.innerHTML =
        list.map((user, index) => {

            const status =
                user.status === "blocked"
                    ? "🔴 Blocked"
                    : "🟢 Active";


            return `

            <tr>

                <td>
                    <b>${escapeHTML(user.uid)}</b>
                </td>

                <td>
                    ${escapeHTML(user.email)}
                </td>

                <td>
                    ${status}
                </td>

                <td>
                    ${user.records}
                </td>

                <td>
                    ₹${user.total.toLocaleString("en-IN")}
                </td>

                <td>
                    ₹${user.paid.toLocaleString("en-IN")}
                </td>

                <td>
                    ₹${user.balance.toLocaleString("en-IN")}
                </td>

                <td>

                    <button
                        onclick="viewAdminUser(${index})">
                        👁️
                    </button>

                </td>

            </tr>

            `;

        })
        .join("");

}


// ==========================================
// VIEW USER
// ==========================================

window.viewAdminUser =
function(index) {

    const user =
        adminUsers[index];

    if (!user) return;

    const box =
        document.getElementById(
            "selectedUserBox"
        );

    if (!box) return;

    box.innerHTML = `

        <div class="card">

            <h3>
                👤 User Details
            </h3>

            <p>
                <b>UID:</b>
                ${escapeHTML(user.uid)}
            </p>

            <p>
                <b>Email:</b>
                ${escapeHTML(user.email)}
            </p>

            <p>
                <b>Status:</b>
                ${user.status}
            </p>

            <p>
                <b>Total Records:</b>
                ${user.records}
            </p>

            <p>
                <b>Total:</b>
                ₹${user.total.toLocaleString("en-IN")}
            </p>

            <p>
                <b>Paid:</b>
                ₹${user.paid.toLocaleString("en-IN")}
            </p>

            <p>
                <b>Balance:</b>
                ₹${user.balance.toLocaleString("en-IN")}
            </p>

            <hr>

            <button
                onclick="alert('Block / Unblock के लिए Cloud Function जोड़ना होगा।')">
                🚫 Block / Unblock
            </button>

            <button
                onclick="alert('User Delete के लिए Cloud Function जोड़ना होगा।')">
                🗑️ Delete User
            </button>

        </div>

    `;
};


// ==========================================
// SEARCH
// ==========================================

const userSearch =
    document.getElementById(
        "userSearch"
    );

if (userSearch) {

    userSearch.addEventListener(
        "input",
        renderAdminUsers
    );

}


const userStatusFilter =
    document.getElementById(
        "userStatusFilter"
    );

if (userStatusFilter) {

    userStatusFilter.addEventListener(
        "change",
        renderAdminUsers
    );

}


// ==========================================
// REFRESH USERS
// ==========================================

const refreshUsersBtn =
    document.getElementById(
        "refreshUsersBtn"
    );

if (refreshUsersBtn) {

    refreshUsersBtn.addEventListener(
        "click",
        loadUserManagement
    );

}


// ==========================================
// ADMIN SECTIONS
// ==========================================

window.openAdminSection =
function(section) {

    if (section === "users") {

        loadUserManagement();

        return;
    }

    if (section === "records") {

        alert(
            "📋 All Records module अगला चरण है।"
        );

        return;
    }

    if (section === "reports") {

        alert(
            "📊 Reports module अगला चरण है।"
        );

        return;
    }

    if (section === "settings") {

        alert(
            "⚙️ Website Settings module अगला चरण है।"
        );

    }

};


// ==========================================
// LOAD USER MANAGEMENT AFTER LOGIN
// ==========================================

const oldShowAdminPanel =
    showAdminPanel;

showAdminPanel =
function(user) {

    oldShowAdminPanel(user);

    setTimeout(
        loadUserManagement,
        300
    );

};
// ==========================================
// USER PROFILE + SUBSCRIPTION
// ==========================================

async function loadUserProfiles() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "users")
            );

        let users = [];

        snapshot.forEach(docSnap => {

            users.push({
                uid: docSnap.id,
                ...docSnap.data()
            });

        });

        window.adminUsers = users;

        showSubscriptionSummary(users);

        showExpiringPlans(users);

    } catch (error) {

        console.error(
            "User Profile Error:",
            error
        );

    }

}


// ==========================================
// SUBSCRIPTION SUMMARY
// ==========================================

function showSubscriptionSummary(users) {

    let free = 0;
    let basic = 0;
    let pro = 0;
    let premium = 0;

    users.forEach(user => {

        const plan =
            String(
                user.plan || "Free"
            ).toLowerCase();

        if (plan === "free") {

            free++;

        } else if (plan === "basic") {

            basic++;

        } else if (plan === "pro") {

            pro++;

        } else if (plan === "premium") {

            premium++;

        }

    });


    const freeBox =
        document.getElementById(
            "freeUserCount"
        );

    const basicBox =
        document.getElementById(
            "basicUserCount"
        );

    const proBox =
        document.getElementById(
            "proUserCount"
        );

    const premiumBox =
        document.getElementById(
            "premiumUserCount"
        );


    if (freeBox)
        freeBox.textContent = free;

    if (basicBox)
        basicBox.textContent = basic;

    if (proBox)
        proBox.textContent = pro;

    if (premiumBox)
        premiumBox.textContent = premium;

}


// ==========================================
// EXPIRING PLANS
// ==========================================

function showExpiringPlans(users) {

    const box =
        document.getElementById(
            "expiringPlansList"
        );

    if (!box) return;


    const today =
        new Date();


    const list =
        users.filter(user => {

            if (!user.expiryDate)
                return false;

            const expiry =
                new Date(
                    user.expiryDate
                );

            const days =
                Math.ceil(
                    (
                        expiry - today
                    ) /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )
                );

            return days >= 0 && days <= 30;

        });


    if (!list.length) {

        box.innerHTML =
            "<p>✅ अगले 30 दिनों में कोई Plan समाप्त नहीं हो रहा।</p>";

        return;

    }


    box.innerHTML =
        list.map(user => {

            const expiry =
                new Date(
                    user.expiryDate
                );

            const days =
                Math.ceil(
                    (
                        expiry - today
                    ) /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )
                );


            return `

            <div class="card">

                <b>
                    ${user.name || "User"}
                </b>

                <p>
                    💳 Plan:
                    ${user.plan || "Free"}
                </p>

                <p>
                    📅 Expiry:
                    ${user.expiryDate}
                </p>

                <p>
                    ⏳ बाकी:
                    ${days} दिन
                </p>

            </div>

            `;

        }).join("");

}


// ==========================================
// USER PROFILE SHOW
// ==========================================

window.showUserProfile =
function(uid) {

    const user =
        (window.adminUsers || [])
        .find(
            u => u.uid === uid
        );

    if (!user) return;


    const box =
        document.getElementById(
            "selectedUserProfile"
        );

    if (!box) return;


    box.innerHTML = `

        <div class="card">

            <h3>
                👤 ${user.name || "नाम उपलब्ध नहीं"}
            </h3>

            <p>
                📱 Mobile:
                ${user.mobile || "-"}
            </p>

            <p>
                📧 Email:
                ${user.email || "-"}
            </p>

            <p>
                🆔 UID:
                ${user.uid}
            </p>

            <p>
                📅 Account Created:
                ${user.createdAt || "-"}
            </p>

            <p>
                🕐 Last Login:
                ${user.lastLogin || "-"}
            </p>

            <hr>

            <h3>
                💳 Subscription
            </h3>

            <p>
                Plan:
                <b>
                    ${user.plan || "Free"}
                </b>
            </p>

            <p>
                📅 Start:
                ${user.planStartDate || "-"}
            </p>

            <p>
                📅 Expiry:
                ${user.expiryDate || "-"}
            </p>

            <p>
                💰 Payment:
                ${user.paymentStatus || "Free"}
            </p>

            <p>
                🔴 Status:
                ${user.status || "Active"}
            </p>

        </div>

    `;

};


// ==========================================
// LOAD AFTER ADMIN LOGIN
// ==========================================

const oldLoadAdminStats =
    window.RAJ_ADMIN?.loadAdminStats;


if (typeof oldLoadAdminStats === "function") {

    const original =
        oldLoadAdminStats;

    window.RAJ_ADMIN.loadAdminStats =
    async function() {

        await original();

        await loadUserProfiles();

    };

}
