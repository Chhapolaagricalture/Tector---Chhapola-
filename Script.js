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
  let html = "";
  let totalAmount = 0;
let totalPaid = 0;
let totalBaki = 0;
let farmers = new Set();
  let groups = {};

  records.forEach((r, i) => {
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
   window.records.forEach(r => {

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

      // नया पेज अगर जगह खत्म हो जाए
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }

  });

  y += 10;

  doc.setFontSize(13);
y += 12;
doc.setFontSize(12);

doc.text("Total Amount : ₹" + total, 10, y);

y += 8;
doc.text("Paid Amount : ₹" + paid, 10, y);

y += 8;
doc.text("Balance : ₹" + baki, 10, y);

  y += 15;
doc.text("Contact", 20, y);

y += 10;
doc.text("Chhapola Agriculture", 20, y);

y += 10;
doc.text("Mobile : 9079096875", 20, y);

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

  if (crop === "Bajra") {
    unitLabel.innerHTML = "Quintal";
  } else {
    unitLabel.innerHTML = "Hours";
  }

});
