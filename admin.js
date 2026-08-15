// ==========================================
// CHHAPOLA AGRICULTURE
// OWNER / ADMIN PANEL - FINAL admin.js
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
// ADMIN EMAIL
// ==========================================

const ADMIN_EMAIL = "jaichhapola@gmail.com";


// ==========================================
// HTML ELEMENTS
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

const refreshUsersBtn =
    document.getElementById("refreshUsersBtn");

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

const userManagementBody =
    document.getElementById("userManagementBody");

const userSearch =
    document.getElementById("userSearch");

const userStatusFilter =
    document.getElementById("userStatusFilter");

const selectedUserBox =
    document.getElementById("selectedUserBox");


// ==========================================
// GLOBAL DATA
// ==========================================

let adminUsers = [];
let allRecords = [];


// ==========================================
// SECURITY / HTML ESCAPE
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
// DASHBOARD
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
                }

                else if (
                    error.code ===
                    "auth/user-not-found"
                ) {
                    message =
                        "❌ यह Admin account Firebase में नहीं है।";
                }

                else if (
                    error.code ===
                    "auth/wrong-password"
                ) {
                    message =
                        "❌ Password गलत है।";
                }

                else if (
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
// ENTER KEY LOGIN
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
                    "LOGOUT ERROR:",
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
            "RESET PASSWORD ERROR:",
            error
        );

        if (loginMessage) {
            loginMessage.textContent =
                "❌ Password reset email नहीं भेजी गई।";
        }
    }
};


// ==========================================
// LOAD ALL RECORDS
// ==========================================

async function loadRecords() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "records")
            );

        allRecords =
            snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        return allRecords;

    } catch (error) {

        console.error(
            "RECORD LOAD ERROR:",
            error
        );

        allRecords = [];

        throw error;
    }
}


// ==========================================
// CREATE OWNER USAGE SUMMARY
// ==========================================

function buildOwnerUsageSummary(records) {

    const owners = new Map();

    records.forEach(record => {

        const uid =
            record.ownerUid;

        if (!uid) {
            return;
        }

        if (!owners.has(uid)) {

            owners.set(uid, {

                uid: uid,

                records: 0,

                farmers: new Set(),

                dates: new Set(),

                works: new Set(),

                lastDate: "",

                firstDate: ""

            });

        }

        const owner =
            owners.get(uid);

        // Total records
        owner.records++;


        // Farmer count
        if (record.name) {

            const farmerName =
                String(record.name)
                    .trim()
                    .toLowerCase();

            if (farmerName) {
                owner.farmers.add(
                    farmerName
                );
            }
        }


        // Date
        if (record.date) {

            const date =
                String(record.date)
                    .trim();

            if (date) {

                owner.dates.add(date);

                if (
                    !owner.lastDate ||
                    date > owner.lastDate
                ) {
                    owner.lastDate = date;
                }

                if (
                    !owner.firstDate ||
                    date < owner.firstDate
                ) {
                    owner.firstDate = date;
                }
            }
        }


        // Work type
        if (record.workType) {

            owner.works.add(
                String(record.workType)
                    .trim()
            );

        } else if (record.work) {

            owner.works.add(
                String(record.work)
                    .trim()
            );
        }

    });

    return owners;
}


// ==========================================
// LOAD ADMIN DATA
// ==========================================

async function loadAdminData() {

    if (usersBody) {

        usersBody.innerHTML =
            `<tr>
                <td colspan="5">
                    ⏳ Loading...
                </td>
            </tr>`;
    }

    try {

        const records =
            await loadRecords();

        const owners =
            buildOwnerUsageSummary(records);


        // ==================================
        // DASHBOARD SUMMARY
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

        /*
         * Admin को किसान का पैसा नहीं दिखाना है।
         * इसलिए incomeTotal को business usage summary
         * में रखा गया है, farmer income के रूप में नहीं।
         */

        if (incomeTotal) {
            incomeTotal.textContent =
                "—";
        }


        // ==================================
        // BASIC USER TABLE
        // ==================================

        if (usersBody) {

            if (owners.size === 0) {

                usersBody.innerHTML =
                    `<tr>
                        <td colspan="5">
                            अभी कोई Tractor Owner record नहीं मिला।
                        </td>
                    </tr>`;

            } else {

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
                                    ${escapeHTML(owner.uid)}
                                </td>

                                <td>
                                    Firebase User
                                </td>

                                <td>
                                    🟢 Active
                                </td>

                                <td>
                                    ${escapeHTML(
                                        owner.lastDate || "-"
                                    )}
                                </td>

                                <td>
                                    ${owner.records}
                                </td>

                            </tr>
                            `;

                        })
                        .join("");
            }
        }


        // ==================================
        // USER MANAGEMENT
        // ==================================

        await loadUserProfiles(owners);

    } catch (error) {

        console.error(
            "ADMIN FIRESTORE ERROR:",
            error
        );

        if (usersBody) {

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
                            : escapeHTML(
                                error.message ||
                                "Unknown error"
                            )
                        }

                    </td>
                </tr>`;
        }
    }
}


// ==========================================
// LOAD USER PROFILES
// ==========================================

async function loadUserProfiles(
    ownersMap
) {

    let profiles = [];

    try {

        const snapshot =
            await getDocs(
                collection(db, "users")
            );

        snapshot.forEach(docSnap => {

            profiles.push({

                uid: docSnap.id,

                ...docSnap.data()

            });

        });

    } catch (error) {

        console.warn(
            "users collection unavailable:",
            error
        );
    }


    // ======================================
    // MERGE PROFILE + USAGE
    // ======================================

    const merged = new Map();


    // पहले profiles
    profiles.forEach(profile => {

        merged.set(
            profile.uid,
            {

                ...profile,

                uid: profile.uid,

                usage:
                    ownersMap.get(
                        profile.uid
                    ) || {

                        records: 0,

                        farmers: new Set(),

                        dates: new Set(),

                        works: new Set(),

                        lastDate: "",

                        firstDate: ""

                    }

            }
        );

    });


    // फिर records वाले owners
    ownersMap.forEach(
        (usage, uid) => {

            if (!merged.has(uid)) {

                merged.set(
                    uid,
                    {

                        uid: uid,

                        email:
                            "Firebase User",

                        status:
                            "Active",

                        plan:
                            "Free",

                        usage: usage

                    }
                );

            } else {

                merged.get(uid).usage =
                    usage;
            }

        }
    );


    adminUsers =
        [...merged.values()];

    renderAdminUsers();

    showSubscriptionSummary(
        adminUsers
    );

    showExpiringPlans(
        adminUsers
    );
}


// ==========================================
// RENDER ADMIN USERS
// ==========================================

function renderAdminUsers() {

    if (!userManagementBody) {
        return;
    }

    const search =
        (
            userSearch?.value ||
            ""
        )
        .toLowerCase()
        .trim();


    const filter =
        userStatusFilter?.value ||
        "all";


    let list =
        adminUsers.filter(user => {

            const text =
                (
                    user.name || ""
                ) +
                " " +
                (
                    user.email || ""
                ) +
                " " +
                (
                    user.mobile || ""
                ) +
                " " +
                (
                    user.uid || ""
                );


            if (
                search &&
                !text
                    .toLowerCase()
                    .includes(search)
            ) {
                return false;
            }


            const status =
                String(
                    user.status ||
                    "active"
                ).toLowerCase();


            if (
                filter !== "all" &&
                status !== filter
            ) {
                return false;
            }


            return true;

        });


    if (!list.length) {

        userManagementBody.innerHTML =
            `<tr>
                <td colspan="8">
                    कोई Tractor Owner नहीं मिला।
                </td>
            </tr>`;

        return;
    }


    userManagementBody.innerHTML =
        list.map(user => {

            const usage =
                user.usage || {};


            const status =
                String(
                    user.status ||
                    "active"
                ).toLowerCase();


            const statusText =
                status === "blocked"
                    ? "🔴 Blocked"
                    : "🟢 Active";


            const works =
                [...(
                    usage.works ||
                    new Set()
                )]
                .join(", ") || "-";


            const farmers =
                (
                    usage.farmers?.size ||
                    0
                );


            const days =
                (
                    usage.dates?.size ||
                    0
                );


            const records =
                usage.records ||
                0;


            return `

            <tr>

                <td>
                    <b>
                        ${escapeHTML(
                            user.name ||
                            user.uid
                        )}
                    </b>

                    <br>

                    <small>
                        ${escapeHTML(
                            user.uid
                        )}
                    </small>
                </td>


                <td>
                    ${escapeHTML(
                        user.email ||
                        "-"
                    )}
                </td>


                <td>
                    ${statusText}
                </td>


                <td>
                    ${records}
                </td>


                <td>
                    ${escapeHTML(
                        user.plan ||
                        "Free"
                    )}
                </td>


                <td>
                    ${escapeHTML(
                        user.expiryDate ||
                        "-"
                    )}
                </td>


                <td>
                    ${days} दिन
                </td>


                <td>

                    <button
                        type="button"
                        onclick="viewAdminUserByUid('${escapeHTML(
                            user.uid
                        )}')">

                        👁️ Usage

                    </button>

                </td>

            </tr>

            `;

        })
        .join("");
}


// ==========================================
// VIEW OWNER USAGE
// ==========================================

// ==========================================
// VIEW OWNER FULL PROFILE + USAGE SUMMARY
// ==========================================

window.viewAdminUserByUid = function(uid) {

    const user = adminUsers.find(
        u => u.uid === uid
    );

    if (!user || !selectedUserBox) {
        return;
    }

    const usage = user.usage || {};

    const farmers =
        usage.farmers?.size || 0;

    const records =
        usage.records || 0;

    const days =
        usage.dates?.size || 0;

    const works = [
        ...(usage.works || new Set())
    ];

    // ======================================
    // OWNER KE RECORDS
    // ======================================

    const ownerRecords =
        allRecords.filter(
            r => r.ownerUid === uid
        );

    let totalAmount = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    ownerRecords.forEach(r => {

        totalAmount +=
            Number(r.total || 0);

        totalPaid +=
            Number(r.paid || 0);

        totalBalance +=
            Number(
                r.baki ??
                (
                    Number(r.total || 0) -
                    Number(r.paid || 0)
                )
            );

    });


    // ======================================
    // PROFILE
    // ======================================

    selectedUserBox.innerHTML = `

    <div class="card"
         style="
            width:100%;
            text-align:left;
            box-shadow:none;
            padding:0;
         ">

        <h3>
            🚜 Tractor Owner Profile
        </h3>

        <hr>

        <p>
            👤 <b>Name:</b>
            ${escapeHTML(
                user.name ||
                "Not Available"
            )}
        </p>

        <p>
            📧 <b>Email:</b>
            ${escapeHTML(
                user.email ||
                "Not Available"
            )}
        </p>

        <p>
            📱 <b>Mobile:</b>
            ${escapeHTML(
                user.mobile ||
                "Not Available"
            )}
        </p>

        <p>
            🆔 <b>UID:</b>
            <small>
                ${escapeHTML(
                    user.uid
                )}
            </small>
        </p>

        <p>
            👤 <b>Role:</b>
            ${escapeHTML(
                user.role ||
                "tractorOwner"
            )}
        </p>

        <p>
            🟢 <b>Status:</b>
            ${escapeHTML(
                user.status ||
                "Active"
            )}
        </p>


        <hr>

        <h3>
            📊 Website Usage Summary
        </h3>

        <p>
            👨‍🌾 <b>Total Farmers:</b>
            ${farmers}
        </p>

        <p>
            📋 <b>Total Records:</b>
            ${records}
        </p>

        <p>
            📅 <b>Used Days:</b>
            ${days}
        </p>

        <p>
            📅 <b>First Activity:</b>
            ${escapeHTML(
                usage.firstDate ||
                "-"
            )}
        </p>

        <p>
            🕐 <b>Last Activity:</b>
            ${escapeHTML(
                usage.lastDate ||
                "-"
            )}
        </p>


        <p>
            🚜 <b>Works Used:</b>
            ${
                works.length
                ?
                works.map(
                    work => `
                    <span
                        style="
                            display:inline-block;
                            padding:5px 9px;
                            margin:3px;
                            border-radius:8px;
                            background:#eef5ef;
                        "
                    >
                        ${escapeHTML(work)}
                    </span>
                    `
                ).join("")
                :
                "-"
            }
        </p>


        <hr>

        <h3>
            💰 Farmer Records Summary
        </h3>

        <p>
            📋 <b>Total Entries:</b>
            ${ownerRecords.length}
        </p>

        <p>
            💰 <b>Total Amount:</b>
            ${money(totalAmount)}
        </p>

        <p>
            💵 <b>Total Paid:</b>
            ${money(totalPaid)}
        </p>

        <p>
            ❌ <b>Total Balance:</b>
            ${money(totalBalance)}
        </p>


        <hr>

        <h3>
            💳 Subscription
        </h3>

        <p>
            <b>Plan:</b>
            ${escapeHTML(
                user.plan ||
                "Free"
            )}
        </p>

        <p>
            <b>Plan Start:</b>
            ${escapeHTML(
                user.planStartDate ||
                "-"
            )}
        </p>

        <p>
            <b>Plan Expiry:</b>
            ${escapeHTML(
                user.expiryDate ||
                "-"
            )}
        </p>

        <p>
            <b>Payment Status:</b>
            ${escapeHTML(
                user.paymentStatus ||
                "Free"
            )}
        </p>


        <hr>

        <h3>
            🕐 Account Information
        </h3>

        <p>
            <b>Created:</b>
            ${escapeHTML(
                user.createdAt ||
                "-"
            )}
        </p>

        <p>
            <b>Last Login:</b>
            ${escapeHTML(
                user.lastLogin ||
                "-"
            )}
        </p>

    </div>

    `;
};




// ==========================================
// SEARCH
// ==========================================

if (userSearch) {

    userSearch.addEventListener(
        "input",
        renderAdminUsers
    );
}


if (userStatusFilter) {

    userStatusFilter.addEventListener(
        "change",
        renderAdminUsers
    );
}


// ==========================================
// REFRESH USERS
// ==========================================

if (refreshUsersBtn) {

    refreshUsersBtn.addEventListener(
        "click",
        loadAdminData
    );
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
                user.plan ||
                "Free"
            )
            .toLowerCase();


        if (plan === "free") {
            free++;
        }

        else if (plan === "basic") {
            basic++;
        }

        else if (plan === "pro") {
            pro++;
        }

        else if (plan === "premium") {
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
        freeBox.textContent =
            free;

    if (basicBox)
        basicBox.textContent =
            basic;

    if (proBox)
        proBox.textContent =
            pro;

    if (premiumBox)
        premiumBox.textContent =
            premium;
}


// ==========================================
// EXPIRING PLANS
// ==========================================

function showExpiringPlans(users) {

    const box =
        document.getElementById(
            "expiringPlansList"
        );

    if (!box) {
        return;
    }


    const today =
        new Date();


    const list =
        users.filter(user => {

            if (!user.expiryDate) {
                return false;
            }


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


            return (
                days >= 0 &&
                days <= 30
            );

        });


    if (!list.length) {

        box.innerHTML =
            "<p>✅ अगले 30 दिनों में कोई Plan समाप्त नहीं हो रहा।</p>";

        return;
    }


    box.innerHTML =
        list.map(user => {

            return `

            <div class="card"
                 style="width:100%;text-align:left">

                <b>
                    ${escapeHTML(
                        user.name ||
                        "Tractor Owner"
                    )}
                </b>

                <p>
                    💳 Plan:
                    ${escapeHTML(
                        user.plan ||
                        "Free"
                    )}
                </p>

                <p>
                    📅 Expiry:
                    ${escapeHTML(
                        user.expiryDate
                    )}
                </p>

            </div>

            `;

        }).join("");
}


// ==========================================
// ADMIN SECTIONS
// ==========================================

window.openAdminSection =
function(section) {

    if (section === "users") {

        loadAdminData();

        return;
    }


    if (section === "records") {

        alert(
            "📋 Individual किसान records Admin Panel में नहीं दिखाए जाएंगे।"
        );

        return;
    }


    if (section === "reports") {

        alert(
            "📊 Owner Usage Reports अगला module है।"
        );

        return;
    }


    if (section === "settings") {

        alert(
            "⚙️ Website Settings अगला module है."
        );

        return;
    }

};


// ==========================================
// AUTH STATE
// ==========================================

onAuthStateChanged(
    auth,
    async function(user) {

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

    loadAdminData:
        loadAdminData,

    loadRecords:
        loadRecords,

    loadUserProfiles:
        loadUserProfiles,

    showDashboard:
        showDashboard,

    showLogin:
        showLogin,

    getAdminUsers:
        () => adminUsers

};


console.log(
    "✅ Chhapola Agriculture FINAL Admin Panel Loaded"
);
