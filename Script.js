import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
alert("Script Loaded");

// ==========================================
// SECURITY: HTML ESCAPE UTILITY
// ==========================================
function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const recordsRef = collection(window.db, "records");
let editingDocId = null;
let _sessionStartTime = Date.now();
// ==========================================
// MAIN WEBSITE - OWNER SETTINGS CONTROLLER
// ==========================================

async function loadMainWebsiteSettings() {

  try {

    const settingsSnap = await getDoc(
      doc(window.db, "settings", "global")
    );

    if (!settingsSnap.exists()) {
      console.log("⚠️ Owner Settings नहीं मिलीं");
      return;
    }

    const s = settingsSnap.data();

    window.MAIN_SETTINGS = s;

    console.log("✅ Owner Settings Loaded:", s);


    // ==========================================
    // SITE NAME
    // ==========================================

    const siteName =
      s.siteName ||
      s.businessName ||
      "Chhapola Agriculture";

    document.title = siteName;


    // Logo
    if (s.logoUrl) {

      document.querySelectorAll(
        "img.site-logo, #siteLogo, .site-logo"
      ).forEach(img => {
        img.src = s.logoUrl;
      });

    }


    // Favicon
    if (s.faviconUrl) {

      let favicon =
        document.querySelector(
          'link[rel="icon"]'
        );

      if (!favicon) {

        favicon =
          document.createElement("link");

        favicon.rel = "icon";

        document.head.appendChild(
          favicon
        );

      }

      favicon.href =
        s.faviconUrl;

    }


    // ==========================================
    // PRIMARY COLOR
    // ==========================================

    if (s.primaryColor) {

      document.documentElement.style.setProperty(
        "--primary-color",
        s.primaryColor
      );

      document.documentElement.style.setProperty(
        "--primary",
        s.primaryColor
      );

    }


    // ==========================================
    // THEME
    // ==========================================

    if (s.theme) {

      if (s.theme === "dark") {

        document.documentElement.classList.add(
          "dark"
        );

        document.body.classList.add(
          "dark"
        );

      }

      else if (s.theme === "light") {

        document.documentElement.classList.remove(
          "dark"
        );

        document.body.classList.remove(
          "dark"
        );

      }

      else {

        const dark =
          window.matchMedia &&
          window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches;

        document.documentElement.classList.toggle(
          "dark",
          dark
        );

        document.body.classList.toggle(
          "dark",
          dark
        );

      }

    }


    // ==========================================
    // TAGLINE
    // ==========================================

    if (s.tagline) {

      document
        .querySelectorAll(
          "#tagline, .tagline, .site-tagline"
        )
        .forEach(el => {

          el.textContent =
            s.tagline;

        });

    }


    // ==========================================
    // FOOTER
    // ==========================================

    if (s.footerText) {

      document
        .querySelectorAll(
          "footer, #footerText"
        )
        .forEach(el => {

          el.textContent =
            s.footerText;

        });

    }


    // ==========================================
    // MAINTENANCE MODE
    // ==========================================

    if (s.maintenanceMode === true) {

      const user =
        window.auth?.currentUser;

      if (user) {

        document.body.innerHTML = `

          <div style="
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
            text-align:center;
            font-family:sans-serif;
          ">

            <div>

              <h1>
                🛠️ Website Maintenance
              </h1>

              <p>
                ${
                  s.maintenanceMessage ||
                  "Website maintenance में है। कृपया बाद में प्रयास करें।"
                }
              </p>

            </div>

          </div>

        `;

        return;

      }

    }


    // ==========================================
    // AI MUNSHI
    // ==========================================

    const aiBox =
      document.getElementById(
        "ai-assistant-container"
      );

    if (aiBox) {

      aiBox.style.display =
        s.aiEnabled === false
          ? "none"
          : "";

    }


    // AI language
    window.AI_LANGUAGE =
      s.aiLanguage ||
      "hi";


    // AI analysis
    window.AI_ANALYSIS_ENABLED =
      s.aiAnalysis !== false;


    // AI daily limit
    window.AI_DAILY_LIMIT =
      Number(
        s.aiDailyLimit || 0
      );


    // ==========================================
    // VOICE
    // ==========================================

    const voiceBtn =
      document.getElementById(
        "voiceBtn"
      );

    if (voiceBtn) {

      voiceBtn.style.display =
        s.voiceEnabled === false
          ? "none"
          : "";

    }


    window.VOICE_ENABLED =
      s.voiceEnabled !== false;


    // ==========================================
    // SCANNER
    // ==========================================

    window.SCANNER_ENABLED =
      s.scannerEnabled !== false;

    window.OCR_AUTO_FILL =
      s.ocrAutoFill !== false;


    if (s.scannerEnabled === false) {

      [
        "register-image",
        "scan-btn",
        "scannerPreview"
      ].forEach(id => {

        const element =
          document.getElementById(id);

        if (element) {

          element.style.display =
            "none";

        }

      });

      const scanInput =
        document.getElementById(
          "register-image"
        );

      if (scanInput) {

        const box =
          scanInput.closest(
            "div[style]"
          );

        if (box) {

          box.style.display =
            "none";

        }

      }

    }


    // ==========================================
    // ANNOUNCEMENT
    // ==========================================

    const oldAnnouncement =
      document.getElementById(
        "ownerAnnouncement"
      );

    if (oldAnnouncement) {

      oldAnnouncement.remove();

    }


    if (
      s.announcementEnabled === true &&
      s.announcementMessage
    ) {

      const announcement =
        document.createElement("div");

      announcement.id =
        "ownerAnnouncement";

      announcement.style.cssText = `

        background:#fff3cd;
        color:#664d03;
        padding:12px;
        margin:10px;
        border-radius:10px;
        text-align:center;
        font-weight:bold;

      `;

      announcement.innerHTML = `

        📢 ${
          s.announcementTitle ||
          "Announcement"
        }

        <br>

        <span style="
          font-weight:normal;
        ">

          ${s.announcementMessage}

        </span>

      `;

      const mainApp =
        document.getElementById(
          "mainApp"
        );

      if (mainApp) {

        mainApp.prepend(
          announcement
        );

      }

    }


    // ==========================================
    // SIGNUP
    // ==========================================

    window.ALLOW_SIGNUP =
      s.allowSignup !== false;


    const signupButton =
      document.getElementById(
        "signupButton"
      ) ||
      document.querySelector(
        ".signup-button"
      );


    if (signupButton) {

      signupButton.style.display =
        s.allowSignup === false
          ? "none"
          : "";

    }


    // ==========================================
    // SUPPORT
    // ==========================================

    window.SUPPORT_MOBILE =
      s.supportMobile ||
      "";

    window.WHATSAPP_NUMBER =
      s.whatsappNumber ||
      "";

    window.SUPPORT_EMAIL =
      s.supportEmail ||
      "";

    window.SUPPORT_MESSAGE =
      s.supportMessage ||
      "";


    // Support mobile
    document
      .querySelectorAll(
        "[data-support-mobile]"
      )
      .forEach(el => {

        el.textContent =
          s.supportMobile || "";

      });


    // ==========================================
    // PDF SETTINGS
    // ==========================================

    window.PDF_SETTINGS = {

      businessName:
        s.pdfBusinessName ||
        s.businessName ||
        "Chhapola Agriculture",

      footer:
        s.pdfFooter ||
        "",

      logo:
        s.pdfLogo !== false,

      contact:
        s.pdfContact !== false

    };


    // ==========================================
    // BUSINESS SETTINGS
    // ==========================================

    window.BUSINESS_SETTINGS = {

      businessName:
        s.businessName ||
        "Chhapola Agriculture",

      ownerName:
        s.ownerName ||
        "",

      tractorModel:
        s.tractorModel ||
        "",

      defaultRate:
        Number(
          s.defaultRate || 0
        ),

      defaultUnit:
        s.defaultUnit ||
        "Bigha"

    };


    // ==========================================
    // REGIONAL SETTINGS
    // ==========================================

    window.REGIONAL_SETTINGS = {

      dateFormat:
        s.dateFormat ||
        "YYYY-MM-DD",

      timezone:
        s.timezone ||
        "Asia/Kolkata",

      numberFormat:
        s.numberFormat ||
        "en-IN",

      currency:
        s.currency ||
        "₹"

    };


    // ==========================================
    // USER SETTINGS
    // ==========================================

    window.USER_SETTINGS = {

      allowSignup:
        s.allowSignup !== false,

      allowProfileEdit:
        s.allowProfileEdit !== false,

      maxUsers:
        Number(
          s.maxUsers || 0
        ),

      blockedMessage:
        s.blockedMessage ||
        "🚫 आपका Account Block है। Owner से संपर्क करें।",

      minPasswordLength:
        Number(
          s.minPasswordLength || 6
        ),

      sessionTimeout:
        Number(
          s.sessionTimeout || 60
        ),

      enforceBlocked:
        s.enforceBlocked !== false

    };


    // ==========================================
    // PLAN SETTINGS
    // ==========================================

    window.PLAN_SETTINGS = {

      freePrice:
        Number(s.freePrice || 0),

      basicPrice:
        Number(s.basicPrice || 0),

      proPrice:
        Number(s.proPrice || 0),

      premiumPrice:
        Number(s.premiumPrice || 0),

      basicDays:
        Number(s.basicDays || 30),

      proDays:
        Number(s.proDays || 30),

      premiumDays:
        Number(s.premiumDays || 30),

      expiryWarningDays:
        Number(
          s.expiryWarningDays || 7
        )

    };


    // ==========================================
    // NOTIFICATIONS
    // ==========================================

    window.NOTIFICATION_SETTINGS = {

      expiryNotifications:
        s.expiryNotifications !== false,

      newUserNotification:
        s.newUserNotification !== false,

      featureNotification:
        s.featureNotification !== false

    };


    // ==========================================
    // STATUS
    // ==========================================

    window.SITE_STATUS =
      s.siteStatus ||
      "live";


    console.log(
      "✅ सभी Owner Settings Main Website पर लागू हो गईं।"
    );

  }

  catch (error) {

    console.error(
      "❌ Main Settings Load Error:",
      error
    );

  }

}

window.loadMainWebsiteSettings =
  loadMainWebsiteSettings;

async function save() {

  let name = document.getElementById("name").value.trim();
  let mobile = document.getElementById("mobile").value.trim();
  let date = document.getElementById("date").value;
  let work = document.getElementById("work").value;
  let crop = document.getElementById("crop").value;
  let bigha = Number(document.getElementById("bigha").value);
  let rate = Number(document.getElementById("rate").value);
  let paid = Number(document.getElementById("paid").value);
let unit = Number(document.getElementById("unitValue").value);
let hours = document.getElementById("hours").value;
let minutes = document.getElementById("minutes").value;
let note = document.getElementById("note").value.trim();
  
let time = (hours || minutes)
    ? `${hours || 0} घंटा ${minutes || 0} मिनट`
    : "-";
if (work === "Thresher" || work === "Spray Machine")
    bigha = unit;
  if (!name) {
    alert("किसान का नाम भरें");
    return;
  }

 let total = 0;

if (work === "Thresher") {
    if (crop === "Bajra") {
        total = bigha * rate; // Quantal
    } else {
        let time = Number(hours || 0) + Number(minutes || 0) / 60;
        total = time * rate;
    }
} else if (work === "Spray Machine") {
    total = unit * rate;
} else if (work === "Pending Balance") {
    total = rate;
} else {
    total = bigha * rate;
}

let baki = total - paid;

// Security: Validate financial fields
if (bigha < 0 || rate < 0 || paid < 0 || hours < 0 || minutes < 0) {
  alert("❌ Negative values are not allowed.");
  return;
}
if (total > 10000000) {
  alert("❌ Total amount is too large.");
  return;
}

const recordData = {
    ownerUid: window.auth.currentUser.uid,
    name,
    mobile,
    date,
    work,
    crop,
    unit,
    time,
    bigha,
    rate,
    paid,
    total,
    baki,
    note
};

if (editingDocId) {
    await updateDoc(doc(window.db, "records", editingDocId), recordData);
    editingDocId = null;
} else {
    await addDoc(recordsRef, recordData);
}

  document.getElementById("name").value = "";
  document.getElementById("mobile").value = "";
  document.getElementById("date").value = "";
  document.getElementById("work").value = "";
  document.getElementById("bigha").value = "";
  document.getElementById("rate").value = "";
  document.getElementById("paid").value = "";
document.getElementById("crop").value = "";
document.getElementById("unitValue").value = "";
document.getElementById("hours").value = "";
document.getElementById("minutes").value = "";
document.getElementById("work").dispatchEvent(new Event("change"));
  document.getElementById("note").value = "";
  alert("डेटा Firebase में सेव हो गया");
show();
    }

async function show() {

const user = window.auth.currentUser;

if (!user) {
  return;
}

const userRecordsQuery = query(
  recordsRef,
  where("ownerUid", "==", user.uid)
);

const snapshot = await getDocs(userRecordsQuery);
  
let records = [];

snapshot.forEach((doc) => {
  const d = doc.data();
  // Task 20: Skip soft-deleted records in frontend too
  if (d._deleted) return;
  records.push({
    id: doc.id,
    ...d
  });
});
// Task 16: Pagination — track total for display
const _totalRecords = records.length;
const _PAGE_SIZE = 50;
let _showAll = window._showAllRecords || false;
  let search = document.getElementById("search").value.toLowerCase();
  let fromDate = document.getElementById("fromDate").value;
let toDate = document.getElementById("toDate").value;
  let html = "";
  let totalAmount = 0;
let totalPaid = 0;
let totalBaki = 0;
let farmers = new Set();
  let groups = {};
records.sort((a, b) => new Date(a.date) - new Date(b.date));
  records.forEach((r, i) => {
    if (fromDate && r.date < fromDate) return;
if (toDate && r.date > toDate) return;
farmers.add(r.name.trim().toLowerCase());
totalAmount += r.total;
totalPaid += r.paid;
totalBaki += r.baki;
    let key = r.name.trim().toLowerCase();

    if (!key.includes(search)) return;

    if (!groups[key]) {
      groups[key] = {
        name: r.name,
        total: 0,
        paid: 0,
        baki: 0,
        rows: ""
      };
    }

    groups[key].total += r.total;
    groups[key].paid += r.paid;
    groups[key].baki += r.baki;

    groups[key].rows += `
      <tr>
        <td>${escapeHTML(r.date)}</td>
<td>${escapeHTML(r.work)}</td>
<td>${escapeHTML(r.crop) || "-"}</td>
<td>${escapeHTML(String(r.unit ?? "-"))}</td>
<td>${escapeHTML(r.time) || "-"}</td>
<td>${escapeHTML(String(r.bigha ?? "-"))}</td>
<td>₹${Number(r.rate)}</td>
<td>₹${Number(r.total)}</td>
<td>₹${Number(r.paid)}</td>
<td>₹${Number(r.baki)}</td>
        <td>
  <div class="action">
  <button onclick="edit(${i})">✏️</button>
  <button onclick="share(${i})">📲</button>
  <button onclick="pdf(${i})">📄</button>
  <button onclick="del(${i})">🗑️</button>
</div>
  </td>
      </tr>
    `;
  });

  for (let key in groups) {

    let g = groups[key];

    html += `
      <div class="card">
        <h3>👨‍🌾 ${escapeHTML(g.name)}</h3>
<p>📱 ${escapeHTML(records.find(r => r.name.trim().toLowerCase() === key).mobile)}</p>
<p>📅 ${escapeHTML(records.find(r => r.name.trim().toLowerCase() === key).date)}</p>

      <div style="overflow-x:auto;">
<table style="min-width:700px; border-collapse:collapse;">
          <tr>
            <th>तारीख</th>
<th>काम</th>
<th>फसल</th>
<th>यूनिट</th>
<th>समय</th>
<th>बीघा</th>
<th>रेट</th>
<th>कुल</th>
<th>जमा</th>
<th>बाकी</th>
<th>Action</th>
          </tr>

          ${g.rows}

          <tr style="font-weight:bold;background:#e8f5e9;">
            <td colspan="7">कुल हिसाब</td>
            <td>₹${g.total}</td>
            <td>₹${g.paid}</td>
            <td>₹${g.baki}</td>
            <td></td>
          </tr>
        </table>
        </div>
       
      </div><br>
    `;
  }
document.getElementById("dashboard").innerHTML = `
<div class="card">
  <h3>📊 Dashboard</h3>
  <p>👨‍🌾 Total Farmers: ${farmers.size}</p>
  <p>💰 Total Amount: ₹${totalAmount}</p>
  <p>💵 Total Paid: ₹${totalPaid}</p>
  <p>❌ Total Balance: ₹${totalBaki}</p>
</div>
`;
  document.getElementById("totalFarmers").innerText = farmers.size;
document.getElementById("totalIncome").innerText = "₹" + totalAmount;
document.getElementById("totalPending").innerText = "₹" + totalBaki;

const today = new Date().toISOString().split("T")[0];
let todayIncome = 0;

records.forEach(r => {
  if (r.date === today) {
    todayIncome += Number(r.total || 0);
  }
});

document.getElementById("todayIncome").innerText = "₹" + todayIncome;
  window.records = records;
  // Task 16: Pagination UI — show count + "Show All" button
  const totalCount = _totalRecords || records.length;
  let paginationHtml = `<div class="card" style="text-align:center;padding:8px;">
    <span style="font-size:0.9em;color:#666;">📊 कुल ${totalCount} records</span>`;
  if (totalCount > _PAGE_SIZE && !_showAll) {
    paginationHtml += ` <button onclick="window._showAllRecords=true;show();" style="margin-left:8px;padding:4px 12px;border:1px solid #176b35;background:#e8f5e9;border-radius:6px;cursor:pointer;">सभी दिखाएं (${totalCount})</button>`;
  } else if (totalCount > _PAGE_SIZE && _showAll) {
    paginationHtml += ` <button onclick="window._showAllRecords=false;show();" style="margin-left:8px;padding:4px 12px;border:1px solid #176b35;background:#e8f5e9;border-radius:6px;cursor:pointer;">पहले ${_PAGE_SIZE} दिखाएं</button>`;
  }
  paginationHtml += `</div>`;
  // Task 18: If not showAll, limit groups rendering
  if (!_showAll && totalCount > _PAGE_SIZE) {
    // Only render first PAGE_SIZE records into groups
    const limited = records.slice(0, _PAGE_SIZE);
    const limitedGroups = {};
    limited.forEach((r) => {
      let key = r.name.trim().toLowerCase();
      if (!limitedGroups[key]) limitedGroups[key] = { name: r.name, total: 0, paid: 0, baki: 0, rows: "" };
      limitedGroups[key].total += r.total; limitedGroups[key].paid += r.paid; limitedGroups[key].baki += r.baki;
      limitedGroups[key].rows += `
      <tr>
        <td>${escapeHTML(r.date)}</td>
<td>${escapeHTML(r.work)}</td>
<td>${escapeHTML(r.crop) || "-"}</td>
<td>${escapeHTML(String(r.unit ?? "-"))}</td>
<td>${escapeHTML(r.time) || "-"}</td>
<td>${escapeHTML(String(r.bigha ?? "-"))}</td>
<td>\u20B9${Number(r.rate)}</td>
<td>\u20B9${Number(r.total)}</td>
<td>\u20B9${Number(r.paid)}</td>
<td>\u20B9${Number(r.baki)}</td>
        <td>
  <div class="action">
  <button onclick="edit(${records.indexOf(r)})">✏️</button>
  <button onclick="share(${records.indexOf(r)})">📲</button>
  <button onclick="pdf(${records.indexOf(r)})">📄</button>
  <button onclick="del(${records.indexOf(r)})">🗑️</button>
</div>
  </td>
      </tr>
    `;
    });
    let limitedHtml = "";
    for (let key in limitedGroups) {
      let g = limitedGroups[key];
      limitedHtml += `
      <div class="card">
        <h3>\uD83D\uDC68\u200D\uD83C\uDF3E ${escapeHTML(g.name)}</h3>
      <div style="overflow-x:auto;">
<table style="min-width:700px; border-collapse:collapse;">
          <tr><th>तारीख</th><th>काम</th><th>फसल</th><th>यूनिट</th><th>समय</th><th>बीघा</th><th>रेट</th><th>कुल</th><th>जमा</th><th>बाकी</th><th>Action</th></tr>
          ${g.rows}
          <tr style="font-weight:bold;background:#e8f5e9;">
            <td colspan="7">कुल हिसाब</td><td>\u20B9${g.total}</td><td>\u20B9${g.paid}</td><td>\u20B9${g.baki}</td><td></td>
          </tr>
        </table>
        </div>
      </div><br>
    `;
    }
    document.getElementById("list").innerHTML = paginationHtml + limitedHtml;
  } else {
    document.getElementById("list").innerHTML = paginationHtml + html;
  }
}
function clearDateFilter() {
    document.getElementById("fromDate").value = "";
    document.getElementById("toDate").value = "";
  document.getElementById("paidReportBox").style.display = "none";
document.getElementById("summary").style.display = "block";
show();
}
function showPaidReport() {
  document.getElementById("paidReportBox").style.display = "block";
document.getElementById("summary").style.display = "none";
  let from = document.getElementById("fromDate").value;
  let to = document.getElementById("toDate").value;

  let html = `
  <h3>💰 Payment Report</h3>
  <table border="1" style="width:100%;border-collapse:collapse">
    <tr>
      <th>Date</th>
      <th>Farmer</th>
      <th>Paid</th>
    </tr>
  `;

  let totalPaid = 0;

  window.records
    .filter(r => {
      if (r.paid <= 0) return false;
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      return true;
    })
    .sort((a,b)=>new Date(a.date)-new Date(b.date))
    .forEach(r=>{
      totalPaid += Number(r.paid);

      html += `
      <tr>
        <td>${escapeHTML(r.date)}</td>
        <td>${escapeHTML(r.name)}</td>
        <td>₹${Number(r.paid)}</td>
      </tr>
      `;
    });

  html += `
      <tr style="font-weight:bold;background:#eee">
        <td colspan="2">Total Paid</td>
        <td>₹${totalPaid}</td>
      </tr>
    </table>
  `;

document.getElementById("paidReportBox").innerHTML = html;
document.getElementById("paidReportBox").style.display = "block";
  window.paidReportHtml = html;
}
function hidePaidReport() {
    document.getElementById("paidReportBox").style.display = "none";
    document.getElementById("summary").style.display = "block";
}
function downloadPaidReportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let from = document.getElementById("fromDate").value || "Start";
  let to = document.getElementById("toDate").value || "End";

  doc.setFontSize(16);
  doc.text("Payment Report", 10, 15);

  doc.setFontSize(11);
  doc.text("From: " + from + "   To: " + to, 10, 25);

  let y = 40;

  window.records
    .filter(r => {
      if (r.paid <= 0) return false;
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      return true;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach(r => {
      doc.text(`${r.date}   ${r.name}   ₹${r.paid}`, 10, y);
      y += 8;

      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

  doc.save("Payment_Report.pdf");
  }
async function del(i) {
  const r = window.records[i];
  const confirmMsg = `क्या ${r.name} का यह record delete करना है?\n\n⚠️ Undo के लिए Admin Panel से restore किया जा सकेगा।`;
  if (!confirm(confirmMsg)) return;
  // Task 20: Soft delete — mark record as deleted
  await updateDoc(doc(window.db, "records", r.id), {
    _deleted: true,
    _deletedAt: new Date().toISOString(),
    _deletedBy: window.auth.currentUser.uid
  });
  show();
}
async function edit(i) {
  let r = window.records[i];

  document.getElementById("name").value = r.name;
  document.getElementById("mobile").value = r.mobile;
  document.getElementById("date").value = r.date;
  document.getElementById("work").value = r.work;
  document.getElementById("bigha").value = r.bigha;
  document.getElementById("rate").value = r.rate;
  document.getElementById("paid").value = r.paid;
document.getElementById("crop").value = r.crop || "";
document.getElementById("unitValue").value = r.unit || "";
document.getElementById("hours").value = "";
document.getElementById("minutes").value = "";

document.getElementById("work").dispatchEvent(new Event("change"));
document.getElementById("crop").dispatchEvent(new Event("change"));
  document.getElementById("note").value = r.note || "";
  editingDocId = r.id;
  alert("✏️ Record edit हो रहा है। Form में बदलाव करें और Save दबाएँ।");
}

function share(i) {
  let r = window.records[i];

  let msg = `🚜 Chhapola Agriculture

👨‍🌾 किसान: ${escapeHTML(r.name)}
🌾 काम: ${escapeHTML(r.work)}
📏 बीघा: ${Number(r.bigha)}
💰 रेट: ₹${Number(r.rate)}
🧾 कुल: ₹${Number(r.total)}
💵 जमा: ₹${Number(r.paid)}
❌ बाकी: ₹${Number(r.baki)}`;

  window.open("https://wa.me/?text=" + encodeURIComponent(msg));
}
function pdf(i) {
let r = window.records[i];
  const { jsPDF } = window.jspdf;
  let doc = new jsPDF("l", "mm", "a4");

  let farmer = records[i].name;
  let mobile = records[i].mobile;
  let date = records[i].date;
  let total = 0;
  let paid = 0;
  let baki = 0;

  let y = 20;

  doc.setFontSize(18);
  doc.text("Chhapola Agriculture", 20, y);

  y += 10;
  doc.setFontSize(14);
  doc.text("Farmer : " + farmer, 20, y);
y += 10;
doc.text("Mobile : " + mobile, 20, y);

y += 10;
doc.text("Date : " + date, 20, y);

y += 10;
  y += 10;

doc.setFontSize(11);

doc.text("Date", 10, y);
doc.text("Work", 35, y);
doc.text("Crop", 60, y);
doc.text("Unit", 85, y);
doc.text("Time", 105, y);
doc.text("Bigha", 132, y);
doc.text("Rate", 148, y);
doc.text("Total", 166, y);
doc.text("Paid", 184, y);
doc.text("Balance", 205, y);

y += 8;
   window.records
.sort((a, b) =>
  a.work === "Pending Balance"
    ? -1
    : b.work === "Pending Balance"
    ? 1
    : 0
)
.forEach(r => {

    if (r.name.trim().toLowerCase() === farmer.trim().toLowerCase()) {

doc.text(r.date || "-", 10, y);
doc.text(r.work || "-", 35, y);
doc.text(r.crop || "-", 60, y);
doc.text(String(r.unit ?? "-"), 85, y);

let pdfTime = (r.time || "-")
  .replace("घंटा", "h")
  .replace("घंटे", "h")
  .replace("मिनट", "m");

doc.text(pdfTime, 105, y);
doc.text(String(r.bigha ?? "-"), 132, y);
doc.text(String(r.rate ?? 0), 148, y);
doc.text(String(r.total ?? 0), 166, y);
doc.text(String(r.paid ?? 0), 184, y);
doc.text(String(r.baki ?? 0), 205, y);
     total += Number(r.total || 0);
      paid += Number(r.paid || 0);
      baki += Number(r.baki || 0);
y += 8;

// अगर पेज भरने वाला है
if (y > 260) {
    doc.addPage();
    y = 20;

    // हर नए पेज पर हेडिंग दोबारा प्रिंट करें
    doc.setFontSize(11);
    doc.text("Date", 10, y);
    doc.text("Work", 35, y);
    doc.text("Crop", 60, y);
    doc.text("Unit", 85, y);
    doc.text("Time", 105, y);
    doc.text("Bigha", 132, y);
    doc.text("Rate", 148, y);
    doc.text("Total", 166, y);
    doc.text("Paid", 184, y);
    doc.text("Balance", 205, y);

    y += 8;
}

    }

  });

// Summary + Contact के लिए पहले से जगह बचाओ
if (y > 180) {
    doc.addPage();
    y = 20;
}

y += 20;

doc.setFontSize(13);
y += 12;
doc.setFontSize(12);
doc.text("Total Amount : rs." + total, 10, y);

y += 8;
doc.text("Paid Amount : rs." + paid, 10, y);

y += 8;
doc.text("Balance : rs." + baki, 10, y);
// ===============================
// FARMER NOTES
// ===============================

const farmerNotes = window.records
  .filter(x =>
    x.name.trim().toLowerCase() === farmer.trim().toLowerCase() &&
    x.note &&
    x.note.trim()
  )
  .map(x => `${x.date} : ${x.note.trim()}`);

if (farmerNotes.length > 0) {

    // Note heading के लिए जगह
    if (y > 235) {
        doc.addPage();
        y = 25;
    } else {
        y += 15;
    }

    doc.setFontSize(13);
    doc.text("Farmer Notes / Kisan Note", 10, y);

    y += 8;
    doc.setFontSize(11);

    const noteText = farmerNotes.join("\n");
    const noteLines = doc.splitTextToSize(noteText, 250);

    // Note को लाइन-दर-लाइन लिखेंगे
    noteLines.forEach(line => {

        // नीचे जगह खत्म होने पर नया page
        if (y > 275) {
            doc.addPage();
            y = 25;

            doc.setFontSize(11);
            doc.text("Farmer Notes / Kisan Note (continued)", 10, y);

            y += 8;
        }

        doc.text(line, 10, y);
        y += 6;
    });
}

// ===============================
// CONTACT / LOGO
// ===============================

if (y > 245) {
    doc.addPage();
    y = 30;
} else {
    y += 10;
}

// Logo image
const logo = new Image();

logo.src = "chhapola-logo.png";

logo.onload = function () {

    // छोटा logo
    const logoW = 32;
    const logoH = 32;

    // बीच में
    const logoX = (297 - logoW) / 2+ 20;

    doc.addImage(
        logo,
        "PNG",
        logoX,
        y - 30,
        logoW,
        logoH
    );

    doc.save(farmer + ".pdf");
};

logo.onerror = function () {
    // Logo load failed, still save PDF without logo
    doc.save(farmer + ".pdf");
};

    }
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// Use Firebase Auth state (not localStorage) for secure auth decisions
onAuthStateChanged(window.auth, async (user) => {
  if (user) {
    // Task 10: Check blocked status on session refresh
    try {
      const userDoc = await getDocs(
        query(collection(window.db, "users"), where("__name__", "==", user.uid))
      );
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();

        // Task 10: Enforce blocked status
        if (userData.status === "blocked") {
          await signOut(window.auth);
          alert(window.USER_SETTINGS?.blockedMessage || "🚫 आपका Account Block है। Owner से संपर्क करें।");
          return;
        }

        // Task 11: Enforce plan expiry
        if (userData.expiryDate && userData.plan && userData.plan !== "Free") {
          const expiry = new Date(userData.expiryDate);
          const now = new Date();
          if (now > expiry) {
            alert(`⚠️ आपका ${userData.plan} plan समाप्त हो गया है (${userData.expiryDate})।\nOwner से संपर्क करें।`);
          }
        }

        // Task 8: Enforce maxUsers (if set)
        const maxU = window.USER_SETTINGS?.maxUsers || window.MAIN_SETTINGS?.maxUsers || 0;
        if (maxU > 0) {
          const allUsers = await getDocs(collection(window.db, "users"));
          if (allUsers.size >= maxU && userData.status !== "admin") {
            await signOut(window.auth);
            alert("⚠️ Maximum user limit reached. Contact admin.");
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Session security check skipped:", e.message);
    }

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
  } else {
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("mainApp").style.display = "none";
    localStorage.removeItem("loggedIn");
  }

  _sessionStartTime = Date.now();
  await loadMainWebsiteSettings();
  show();
});
window.save = save;
window.show = show;
window.del = del;
window.edit = edit;
window.share = share;
window.pdf = pdf;
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(window.auth, email, password);
const user = window.auth.currentUser;

const userDoc = await getDocs(
  query(
    collection(window.db, "users"),
    where("__name__", "==", user.uid)
  )
);

if (!userDoc.empty) {
  const userData = userDoc.docs[0].data();

  if (userData.status === "blocked") {
    await signOut(window.auth);
    alert("🚫 आपका Account Block है। Owner से संपर्क करें।");
    return;
  }
}
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("mainApp").style.display = "block";

    localStorage.setItem("loggedIn", "true");
  } catch (error) {
    alert("❌ " + error.message);
  }
}

window.login = login;
async function logout() {
  try {
    await signOut(window.auth);

    localStorage.removeItem("loggedIn");

    location.reload();

  } catch (error) {
    alert("❌ Logout नहीं हुआ: " + error.message);
  }
}

window.logout = logout;
async function forgotPassword() {
  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert("पहले अपना Email डालें");
    return;
  }

  try {
    await sendPasswordResetEmail(window.auth, email);
    alert("✅ Password Reset Email भेज दी गई है");
  } catch (e) {
    alert("❌ " + e.message);
  }
}

window.forgotPassword = forgotPassword;
async function changePassword() {
  const user = window.auth.currentUser;

  if (!user) {
    alert("❌ पहले Login करें");
    return;
  }

  const newPassword = prompt("नया Password डालें");

  if (!newPassword || newPassword.length < 6) {
    alert("❌ Password कम से कम 6 अक्षर का होना चाहिए");
    return;
  }

  try {
    await updatePassword(user, newPassword);
    alert("✅ Password बदल दिया गया");
  } catch (e) {
    alert("❌ " + e.message);
  }
}

window.changePassword = changePassword;
function showSignup() {
  document.getElementById("signupBox").style.display = "block";
}

function hideSignup() {
  document.getElementById("signupBox").style.display = "none";
}

async function signup() {

  const name =
    document.getElementById("signupName").value.trim();

  const mobile =
    document.getElementById("signupMobile").value.trim();

  const email =
    document.getElementById("signupEmail").value.trim();

  const password =
    document.getElementById("signupPassword").value;

  const confirmPassword =
    document.getElementById("signupConfirmPassword").value;

  // Task 9: Enforce allowSignup setting
  if (window.ALLOW_SIGNUP === false) {
    alert("❌ Signup is currently disabled by the admin.");
    return;
  }

  // Task 8: Enforce minPasswordLength from settings
  const minLen = window.USER_SETTINGS?.minPasswordLength || window.MAIN_SETTINGS?.minPasswordLength || 6;

  if (!name || !mobile || !email || !password) {
    alert("सभी जानकारी भरें");
    return;
  }

  if (password !== confirmPassword) {
    alert("Password और Confirm Password समान नहीं हैं");
    return;
  }

  if (password.length < minLen) {
    alert(`Password कम से कम ${minLen} अक्षर का होना चाहिए`);
    return;
  }

  try {

    await window.createUserWithEmailAndPassword(
      window.auth,
      email,
      password
    );
const credential =
  window.auth.currentUser;

await setDoc(
  doc(window.db, "users", credential.uid),
  {
    uid: credential.uid,
    name: name,
    mobile: mobile,
    email: email,

    role: "tractorOwner",
    status: "active",

    plan: "Free",
    planStartDate: "",
    expiryDate: "",
    paymentStatus: "Free",

    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  },
  { merge: true }
);
    alert("✅ Tractor Account सफलतापूर्वक बन गया।");

    document.getElementById("signupBox").style.display = "none";

    document.getElementById("email").value = email;

    document.getElementById("signupName").value = "";
    document.getElementById("signupMobile").value = "";
    document.getElementById("signupEmail").value = "";
    document.getElementById("signupPassword").value = "";
    document.getElementById("signupConfirmPassword").value = "";

  } catch (error) {

    console.error(error);

    alert("❌ Account नहीं बना: " + error.message);

  }
}

window.showSignup = showSignup;
window.hideSignup = hideSignup;
window.signup = signup;

document.getElementById("work").addEventListener("change", function () {

  const work = this.value;
  const rateInput = document.getElementById("rate");

// Auto Rate
if (work === "Hero") {
    rateInput.value = 250;
} else if (work === "Calti") {
    rateInput.value = 250;
} else if (work === "Mej (Pata)") {
    rateInput.value = 150;
} else if (work === "Morplau") {
    rateInput.value = 500;
} else if (work === "Display") {
    rateInput.value = 500;
} else if (work === "Spray Machine") {
    rateInput.value = 800;
} else if (work === "Thresher") {
    rateInput.value = "";
}else if (work === "Pending Balance") {
    rateInput.value = "";
}
  const cropBox = document.getElementById("cropBox");
const unitBox = document.getElementById("unitBox");
const unitLabel = document.getElementById("unitLabel");
 const bighaBox = document.getElementById("bigha");
  if (work === "Thresher") {
document.getElementById("timeBox").style.display = "block";
    cropBox.style.display = "block";
    unitBox.style.display = "block";
    unitLabel.innerHTML = "Hours";
    bighaBox.style.display = "none";
    } else if (work === "Pending Balance") {

    cropBox.style.display = "none";
    unitBox.style.display = "none";
    bighaBox.style.display = "none";
    document.getElementById("timeBox").style.display = "none";
} else if (work === "Spray Machine") {

    cropBox.style.display = "none";
    unitBox.style.display = "block";
    unitLabel.innerHTML = "Quantity";
    bighaBox.style.display = "none";
} else {

    cropBox.style.display = "none";
    unitBox.style.display = "none";
    bighaBox.style.display = "block";
    document.getElementById("timeBox").style.display = "none";
  }

});
document.getElementById("crop").addEventListener("change", function () {

  const crop = this.value;
  const unitLabel = document.getElementById("unitLabel");
const work = document.getElementById("work").value;
const rateInput = document.getElementById("rate");

if (work === "Thresher") {
    if (crop === "Bajra") {
        rateInput.value = 150;
    } else {
        rateInput.value = 1200;
    }
}
  if (crop === "Bajra") {
    unitLabel.innerHTML = "Quintal";
  } else {
    unitLabel.innerHTML = "Hours";
  }

});
window.showPaidReport = showPaidReport;
window.downloadPaidReportPDF = downloadPaidReportPDF;

// ==========================================
// TASK 21: CSV / EXCEL EXPORT
// ==========================================
function downloadCSV() {
  const user = window.auth.currentUser;
  if (!user) return;
  const records = (window.records || []);
  if (!records.length) { alert("Export करने के लिए records नहीं हैं।"); return; }

  // CSV header
  const header = ["Name","Mobile","Date","Work","Crop","Unit","Time","Bigha","Rate","Total","Paid","Balance","Note"];
  const rows = records.map(r => [
    r.name || "",
    r.mobile || "",
    r.date || "",
    r.work || "",
    r.crop || "",
    r.unit ?? "",
    r.time || "",
    r.bigha ?? "",
    r.rate ?? "",
    r.total ?? "",
    r.paid ?? "",
    r.baki ?? "",
    (r.note || "").replace(/\n/g, " ")
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

  const csv = "\uFEFF" + header.join(",") + "\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Chhapola_Agriculture_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
window.downloadCSV = downloadCSV;


// =========================
// VOICE ENTRY - PART 2
// =========================

const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;

if (!SpeechRecognition) {

    alert("इस Browser में Voice Entry सपोर्ट नहीं है");

} else {

    const recognition = new SpeechRecognition();

    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    const voiceBtn = document.getElementById("voiceBtn");
    const voiceStatus = document.getElementById("voiceStatus");

    voiceBtn.addEventListener("click", () => {

        voiceStatus.innerHTML = "🎤 बोलना शुरू करें...";

        recognition.start();

    });

    recognition.onresult = (event) => {

        const text =
        event.results[0][0].transcript;

        console.log(text);

        voiceStatus.innerHTML =
        "✅ आपने कहा : " + text;

        // अगले Part में
        // इसी text को पढ़कर
        // Form Auto Fill करेंगे

        // =========================
// VOICE ENTRY - PART 3A
// =========================

let voice = text.toLowerCase();

// Hero
if (voice.includes("hero")) {
    document.getElementById("work").value = "Hero";
}

// Calti
else if (voice.includes("calti")) {
    document.getElementById("work").value = "Calti";
}

// Morplau
else if (voice.includes("morplau")) {
    document.getElementById("work").value = "Morplau";
}

// Display
else if (voice.includes("display")) {
    document.getElementById("work").value = "Display";
}

// Spray Machine
else if (
    voice.includes("spray") ||
    voice.includes("दवाई")
) {
    document.getElementById("work").value = "Spray Machine";
}

// Thresher
else if (
    voice.includes("thresher") ||
    voice.includes("थ्रेसर")
) {
    document.getElementById("work").value = "Thresher";
}

// Change Event
document.getElementById("work")
.dispatchEvent(new Event("change"));
      // =========================
// VOICE ENTRY - PART 3B
// =========================

// संख्या निकालो
const numberMatch = voice.match(/\d+(\.\d+)?/);

if (numberMatch) {

    const qty = parseFloat(numberMatch[0]);

    const work = document.getElementById("work").value;

    if (["Hero","Calti","Morplau","Display"].includes(work)) {

        document.getElementById("bigha").value = qty;

    }

    else if (work === "Spray Machine") {

        document.getElementById("unitValue").value = qty;

    }

    else if (work === "Thresher") {

        document.getElementById("hours").value = Math.floor(qty);

        document.getElementById("minutes").value = 0;

    }

}

// जमा राशि
const paidMatch = voice.match(/(\d+)\s*(रुपये|रुपया|rs|rupees|जमा)/i);

if (paidMatch) {

    document.getElementById("paid").value = paidMatch[1];

      }
      // =========================
// VOICE ENTRY - PART 3C a
// =========================

// किसान का नाम निकालो
let farmerName = voice;

// काम के शब्द हटाओ
farmerName = farmerName
.replace(/hero/gi, "")
.replace(/calti/gi, "")
.replace(/morplau/gi, "")
.replace(/display/gi, "")
.replace(/spray machine/gi, "")
.replace(/spray/gi, "")
.replace(/दवाई/gi, "")
.replace(/thresher/gi, "")
.replace(/थ्रेसर/gi, "");

// संख्या हटाओ
farmerName = farmerName.replace(/\d+(\.\d+)?/g, "");

// रुपये/जमा हटाओ
farmerName = farmerName
.replace(/रुपये|रुपया|जमा|rs|rupees/gi, "")
.trim();

// नाम भरो
if (farmerName.length > 0) {
    document.getElementById("name").value = farmerName;
}

// आज की तारीख अपने-आप भरो
const today = new Date().toISOString().split("T")[0];
document.getElementById("date").value = today;

alert("✅ Voice Entry सफल रही। अब Save बटन दबाएँ।");

    };

    recognition.onerror = (event) => {

        voiceStatus.innerHTML =
        "❌ Error : " + event.error;

    };

      }




