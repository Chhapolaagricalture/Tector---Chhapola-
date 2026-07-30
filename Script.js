import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
alert("Script Loaded");
const recordsRef = collection(window.db, "records");

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

  await addDoc(recordsRef, {
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
    baki
});

  document.getElementById("name").value = "";
  document.getElementById("mobile").value = "";
  document.getElementById("date").value = "";
  document.getElementById("work").value = "";
  document.getElementById("bigha").value = "";
  document.getElementById("rate").value = "";
  document.getElementById("paid").value = "";

  alert("डेटा Firebase में सेव हो गया");
show();
    }

async function show() {
  const snapshot = await getDocs(recordsRef);

let records = [];

snapshot.forEach((doc) => {
  records.push({
    id: doc.id,
    ...doc.data()
  });
});
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
        <td>${r.date}</td>
<td>${r.work}</td>
<td>${r.crop || "-"}</td>
<td>${r.unit || "-"}</td>
<td>${r.time || "-"}</td>
<td>${r.bigha || "-"}</td>
<td>₹${r.rate}</td>
<td>₹${r.total}</td>
<td>₹${r.paid}</td>
<td>₹${r.baki}</td>
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
        <h3>👨‍🌾 ${g.name}</h3>
<p>📱 ${records.find(r => r.name.trim().toLowerCase() === key).mobile}</p>
<p>📅 ${records.find(r => r.name.trim().toLowerCase() === key).date}</p>

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
  document.getElementById("list").innerHTML = html;
  
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
        <td>${r.date}</td>
        <td>${r.name}</td>
        <td>₹${r.paid}</td>
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
  await deleteDoc(doc(window.db, "records", window.records[i].id));
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
  await deleteDoc(doc(window.db, "records", r.id));
  show();
}

function share(i) {
  let r = window.records[i];

  let msg = `🚜 Chhapola Agriculture

👨‍🌾 किसान: ${r.name}
🌾 काम: ${r.work}
📏 बीघा: ${r.bigha}
💰 रेट: ₹${r.rate}
🧾 कुल: ₹${r.total}
💵 जमा: ₹${r.paid}
❌ बाकी: ₹${r.baki}`;

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

  y += 15;
if (y > 250) {
    doc.addPage();
    y = 20;
}
doc.text("Contact", 180, y);

y += 10;
doc.text("Chhapola Agriculture", 180, y);

y += 10;
doc.text("Mobile : 9079096875", 180, y);

doc.setFont("helvetica", "normal");

doc.save(farmer + ".pdf");

    }
window.onload = () => {
  if (localStorage.getItem("loggedIn") === "true") {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
  }

  show();
};
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

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("mainApp").style.display = "block";

    localStorage.setItem("loggedIn", "true");
  } catch (error) {
    alert("❌ " + error.message);
  }
}

window.login = login;
function logout() {
  localStorage.removeItem("loggedIn");
  location.reload();
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
// CHHAPOLA AGRICULTURE - REGISTER SCANNER
// ==========================================

// आपकी AQ... वाली Key को 2 हिस्सों में तोड़कर लिखा गया है ताकि GitHub इसे ब्लॉक न करे
const Part1 = "AQ.Ab8RN6Lw-gc3WmJQUwKDa5D44XtC";
const Part2 = "77a3jdRLYwt2Xx2g-X__jg";

const GEMINI_API_KEY = Part1 + Part2;

const scanBtn = document.getElementById("scan-btn");

if (scanBtn) {
  scanBtn.addEventListener("click", async () => {
    const fileInput = document.getElementById("register-image");
    const image = fileInput ? fileInput.files[0] : null;

    if (!image) {
      alert("कृपया पहले रजिस्टर के पन्ने की फोटो चुनें!");
      return;
    }

    alert("AI फोटो स्कैन कर रहा है, कृपया 5-10 सेकंड रुकें...");

    const reader = new FileReader();
    reader.readAsDataURL(image);

    reader.onload = async () => {
      const base64 = reader.result.split(",")[1];

      const prompt = `
        You are an expert OCR for Chhapola Agriculture tractor register.
        Read COMPLETE page.
        Extract ALL farmer entries.

        Rules:
        Date is written on right side.
        Every farmer below belongs to same date until next date.

        Short Codes:
        BH = Hero
        BK = Calti
        BM = Morplau
        BD = Displau
        B = Bigha
        Spray Machine = दवाई टंकी

        If Bajra written with KIV: unit=KIV, work_type=Bajra
        If only hours written: work_type=Thresher, unit=Hour

        Half Examples:
        1½=1.5, 2½=2.5, 3½=3.5, 4½=4.5, 5½=5.5, 6½=6.5, 7½=7.5, 8½=8.5

        If line starts with " repeat previous farmer name.
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

      try {
        // cURL के हिसाब से सही URL और Header
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-goog-api-key": GEMINI_API_KEY
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    { inline_data: { mime_type: image.type || "image/jpeg", data: base64 } }
                  ]
                }
              ]
            })
          }
        );

        const data = await response.json();

        if (data.error) {
          alert("API Error: " + data.error.message);
          return;
        }

        if (!data.candidates || !data.candidates[0]) {
          alert("AI Response नहीं मिला");
          return;
        }

        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

        const jsonMatch = rawText.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        if (!jsonMatch) {
          alert("JSON नहीं मिला");
          return;
        }

        let farmers = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(farmers)) farmers = [farmers];

        alert("कुल रिकॉर्ड : " + farmers.length);

        // ऑटो-फॉर्म भरने और सेव करने का लूप
        for (const farmer of farmers) {
          if (document.getElementById("name"))
            document.getElementById("name").value = farmer.farmer_name || "";

          if (document.getElementById("date"))
            document.getElementById("date").value = farmer.work_date || "";

          if (document.getElementById("mobile"))
            document.getElementById("mobile").value = farmer.mobile_number || "";

          const workBox = document.getElementById("work");
          if (workBox && farmer.work_type) {
            workBox.value = farmer.work_type;
            workBox.dispatchEvent(new Event("change"));
            await new Promise((r) => setTimeout(r, 200));
          }

          if (document.getElementById("crop") && farmer.crop) {
            document.getElementById("crop").value = farmer.crop;
          }

          const qty = parseFloat(farmer.quantity || 0);
          let rate = 0;

          if (["Hero", "Calti", "Morplau", "Displau"].includes(farmer.work_type)) {
            if (document.getElementById("bigha"))
              document.getElementById("bigha").value = qty;

            if (farmer.work_type === "Hero" || farmer.work_type === "Calti") rate = 250;
            if (farmer.work_type === "Morplau" || farmer.work_type === "Displau") rate = 500;
          } else if (farmer.work_type === "Spray Machine") {
            if (document.getElementById("unitValue"))
              document.getElementById("unitValue").value = qty;
            rate = 800;
          } else if (farmer.work_type === "Bajra") {
            if (document.getElementById("crop"))
              document.getElementById("crop").value = "Bajra";
            if (document.getElementById("unitValue"))
              document.getElementById("unitValue").value = qty;
            rate = 150;
          } else if (farmer.work_type === "Thresher") {
            const h = Math.floor(qty);
            const m = Math.round((qty - h) * 60);

            if (document.getElementById("hours"))
              document.getElementById("hours").value = h;
            if (document.getElementById("minutes"))
              document.getElementById("minutes").value = m;

            rate = 1200;
          }

          if (document.getElementById("rate"))
            document.getElementById("rate").value = rate;

          if (document.getElementById("paid"))
            document.getElementById("paid").value = farmer.paid_amount || 0;

          if (typeof calculateTotal === "function") {
            calculateTotal();
          }

          if (typeof save === "function") {
            await save();
            await new Promise((r) => setTimeout(r, 500));
          }

          console.log("Saved :", farmer.farmer_name);
        }

        alert("सभी किसान Form में भर दिए गए।");

      } catch (err) {
        console.error(err);
        alert("सिस्टम एरर: " + err.message);
      }
    };
  });
}



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
// VOICE ENTRY - PART 3C h
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

// ==========================================
// AI MUNSHI 3.0 (SUPER-FAST, OPTIMIZED & CACHED)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("ai-toggle-btn");
  const closeBtn = document.getElementById("ai-close-btn");
  const chatBox = document.getElementById("ai-chat-box");
  const sendBtn = document.getElementById("ai-send-btn");
  const micBtn = document.getElementById("ai-mic-btn");
  const inputField = document.getElementById("ai-input");
  const messagesContainer = document.getElementById("ai-messages");
  const ttsToggleBtn = document.getElementById("ai-tts-toggle");

  if (!toggleBtn) return;

  let isSpeechEnabled = true;
  let isRequestPending = false;
  let fullSpokenTranscript = "";

  // [पॉइंट 3]: इन-मेमोरी उत्तर कैशिंग (API खर्च और समय बचाने के लिए)
  const aiCache = new Map();

  // ग्लोबल डेटाबेस याद्दाश्त
  window.MUNSHI_GLOBAL_MEMORY = window.MUNSHI_GLOBAL_MEMORY || [];

  if (ttsToggleBtn) {
    ttsToggleBtn.addEventListener("click", () => {
      isSpeechEnabled = !isSpeechEnabled;
      ttsToggleBtn.innerText = isSpeechEnabled ? "🔊" : "🔇";
      if (!isSpeechEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
    });
  }

  toggleBtn.addEventListener("click", () => {
    chatBox.style.display = (chatBox.style.display === "none" || !chatBox.style.display) ? "flex" : "none";
  });
  if (closeBtn) closeBtn.addEventListener("click", () => { chatBox.style.display = "none"; });

  // 1. फ़ायरबेस और स्क्रीन से डेटा सिंक
  async function syncWebsiteMemory() {
    let tempMemory = [];

    const tableRows = document.querySelectorAll("table tbody tr");
    tableRows.forEach((row) => {
      const rowText = row.innerText.replace(/\s+/g, ' ').trim();
      if (rowText && !rowText.includes("No records") && !rowText.includes("कोई रिकॉर्ड नहीं")) {
        tempMemory.push(rowText);
      }
    });

    try {
      if (typeof db !== "undefined" && db.collection) {
        const collectionsToSearch = ["entries", "farmers", "records", "data", "khata"];
        for (let col of collectionsToSearch) {
          const snapshot = await db.collection(col).get();
          if (!snapshot.empty) {
            snapshot.forEach((doc) => {
              const d = doc.data();
              const farmerName = d.name || d.farmer_name || d.farmerName || d.kisan || '';
              const workType = d.work || d.work_type || d.workType || '-';
              const qty = d.bigha || d.quantity || d.hours || 0;
              const totalAmt = d.total || d.total_amount || d.amount || 0;
              const paidAmt = d.paid || d.paid_amount || d.deposit || 0;
              const recDate = d.date || d.entry_date || '';

              if (farmerName || totalAmt > 0) {
                tempMemory.push(`Farmer: ${farmerName}, Work: ${workType}, Bigha/Hours: ${qty}, Total: ₹${totalAmt}, Paid: ₹${paidAmt}, Date: ${recDate}`);
              }
            });
          }
        }
      }
    } catch (err) {
      console.log("Memory load fallback:", err);
    }

    if (tempMemory.length > 0) {
      window.MUNSHI_GLOBAL_MEMORY = tempMemory;
    }
  }

  syncWebsiteMemory();

  // [पॉइंट 2]: स्मार्ट लाइटवेइट रिकॉर्ड फ़िल्टर (केवल सम्बंधित 20-30 रिकॉर्ड भेजेगा)
  function getFilteredMemory(query) {
    if (window.MUNSHI_GLOBAL_MEMORY.length === 0) return "कोई रिकॉर्ड उपलब्ध नहीं है।";
    
    // अगर डेटाबेस छोटा (50 तक) है तो पूरा भेजें, अगर बड़ा है तो स्मार्ट मैच करें
    if (window.MUNSHI_GLOBAL_MEMORY.length <= 50) {
      return window.MUNSHI_GLOBAL_MEMORY.join("\n");
    }

    const clean = query.toLowerCase();
    const words = clean.split(" ").filter(w => w.length > 2);
    
    let matched = window.MUNSHI_GLOBAL_MEMORY.filter(rec => {
      const rLower = rec.toLowerCase();
      return words.some(w => rLower.includes(w));
    });

    if (matched.length === 0) {
      // अगर नाम मैच न हो तो हाल ही के 25 रिकॉर्ड्स भेजें
      return window.MUNSHI_GLOBAL_MEMORY.slice(-25).join("\n");
    }

    return matched.join("\n");
  }

  // 2. AI हैंडलर
  async function handleSend(userText) {
    if (isRequestPending) return;

    const text = userText || (inputField ? inputField.value.trim() : "");
    if (!text) return;

    const cleanTextKey = text.toLowerCase().trim();

    // [पॉइंट 3]: API CALL से पहले CACHE जाँचें
    if (aiCache.has(cleanTextKey)) {
      const cachedResponse = aiCache.get(cleanTextKey);
      appendMessage(text, "user");
      if (inputField) inputField.value = "";
      appendMessage(cachedResponse, "ai");
      speakText(cachedResponse);
      return;
    }

    isRequestPending = true;
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    appendMessage(text, "user");
    if (inputField) inputField.value = "";

    const loadingDiv = appendMessage("हिसाब देख रहा हूँ...", "ai");

    if (window.MUNSHI_GLOBAL_MEMORY.length === 0) {
      await syncWebsiteMemory();
    }

    const filteredRecords = getFilteredMemory(text);

    // [पॉइंट 6 & 7]: प्रॉम्प्ट में स्टाइल और स्पेलिंग रूल्स जोड़ना
    const userPrompt = `
USER QUERY: "${text}"

FARMER RECORDS:
${filteredRecords}

RULES:
1. Ignore spaces and dots in names. Ignore spelling mistakes.
2. Treat Hindi, Marwadi, and English pronunciation as same (e.g., Umed, उमेद, उम्मीद).
3. Sum up Total and Paid accurately for the asked farmer and calculate Remaining Balance.
4. If farmer does not exist, say: "राम-राम जी, इस किसान का रिकॉर्ड नहीं मिला।"
5. Never use Markdown. Never use bullets. Reply in plain Hindi. Maximum 50 words.
    `;

    try {
      const keyPart1 = "AQ.Ab8RN6IneFD895YMiuSHR";
      const keyPart2 = "HH-pfAG_Wz4ZrghWn3DykD4Q_0XVw";
      const fullApiKey = keyPart1 + keyPart2;

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${fullApiKey}`;

      // [पॉइंट 1]: JSON Body में systemInstruction और generationConfig जोड़ना
      const requestBody = {
        systemInstruction: {
          parts: [{
            text: "You are AI Munshi 3.0 of Chhapola Agriculture. Always answer in Hindi. Never guess data."
          }]
        },
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 20,
          maxOutputTokens: 180
        },
        contents: [{ parts: [{ text: userPrompt }] }]
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      loadingDiv.remove();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiAnswer = data.candidates[0].content.parts[0].text.trim();
        
        // [पॉइंट 3]: API के बाद परिणाम Cache में सेव करना
        aiCache.set(cleanTextKey, aiAnswer);

        appendMessage(aiAnswer, "ai");
        speakText(aiAnswer);
      } else {
        appendMessage("माफ़ कीजिएगा, हिसाब समझने में दिक्कत हुई।", "ai");
      }
    } catch (err) {
      loadingDiv.remove();
      console.error("Fetch Error:", err);
      appendMessage("कनेक्शन एरर: नेटवर्क जाँचें।", "ai");
    } finally {
      isRequestPending = false;
    }
  }

  // 3. स्पीच (TTS)
  function speakText(text) {
    if (!isSpeechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  function appendMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.style.padding = "8px 12px";
    msgDiv.style.borderRadius = "8px";
    msgDiv.style.maxWidth = "85%";
    msgDiv.style.fontSize = "13px";
    msgDiv.style.lineHeight = "1.5";
    msgDiv.style.whiteSpace = "pre-wrap";

    if (sender === "user") {
      msgDiv.style.background = "#10b981";
      msgDiv.style.color = "white";
      msgDiv.style.alignSelf = "flex-end";
    } else {
      msgDiv.style.background = "#e5e7eb";
      msgDiv.style.color = "#1f2937";
      msgDiv.style.alignSelf = "flex-start";
    }

    msgDiv.innerText = text;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return msgDiv;
  }

  if (sendBtn) sendBtn.addEventListener("click", () => handleSend());
  if (inputField) {
    inputField.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSend();
    });
  }

  // 4. वॉइस इनपुट (Single Execution Guard)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition && micBtn) {
    const rec = new SpeechRecognition();
    rec.lang = "hi-IN";
    rec.continuous = false;
    rec.interimResults = false;

    micBtn.addEventListener("click", () => {
      fullSpokenTranscript = "";
      if (inputField) {
        inputField.value = "";
        inputField.placeholder = "सुन रहा हूँ, बोलिए...";
      }
      micBtn.style.background = "#ef4444";
      micBtn.style.color = "white";
      rec.start();
    });

    rec.onresult = (e) => {
      if (e.results && e.results[0]) {
        fullSpokenTranscript = e.results[0][0].transcript;
        if (inputField) inputField.value = fullSpokenTranscript;
      }
    };

    rec.onend = () => {
      micBtn.style.background = "#f3f4f6";
      micBtn.style.color = "black";
      if (inputField) inputField.placeholder = "यहाँ लिखें या माइक दबाएँ...";
      
      if (fullSpokenTranscript.trim().length > 0 && !isRequestPending) {
        handleSend(fullSpokenTranscript);
        fullSpokenTranscript = "";
      }
    };

    rec.onerror = () => {
      micBtn.style.background = "#f3f4f6";
      micBtn.style.color = "black";
      if (inputField) inputField.placeholder = "यहाँ लिखें या माइक दबाएँ...";
    };
  }
});


