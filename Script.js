let records = JSON.parse(localStorage.getItem("records")) || [];

function save() {

  let name = document.getElementById("name").value.trim();
let mobile = document.getElementById("mobile").value.trim();
let date = document.getElementById("date").value;
let work = document.getElementById("work").value;
  let bigha = Number(document.getElementById("bigha").value);
  let rate = Number(document.getElementById("rate").value);
  let paid = Number(document.getElementById("paid").value);

  if (!name || !bigha || !rate) {
    alert("सभी जानकारी भरें");
    return;
  }

  let total = bigha * rate;
  let baki = total - paid;

  records.push({
  name,
  mobile,
  date,
  work,
  bigha,
  rate,
  paid,
  total,
  baki
});
  
    localStorage.setItem("records", JSON.stringify(records));

  document.getElementById("name").value = "";
  document.getElementById("work").value = "";
  document.getElementById("bigha").value = "";
  document.getElementById("rate").value = "";
  document.getElementById("paid").value = "";

  show();
}

function show() {
  let search = document.getElementById("search").value.toLowerCase();
  let html = "";
  let groups = {};

  records.forEach((r, i) => {

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
        <td>${r.work}</td>
        <td>${r.bigha}</td>
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

      <div style="overflow-x:auto;">
<table style="min-width:700px; border-collapse:collapse;">
          <tr>
            <th>काम</th>
            <th>बीघा</th>
            <th>रेट</th>
            <th>कुल</th>
            <th>जमा</th>
            <th>बाकी</th>
            <th>Action</th>
          </tr>

          ${g.rows}

          <tr style="font-weight:bold;background:#e8f5e9;">
            <td colspan="3">कुल हिसाब</td>
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

  document.getElementById("list").innerHTML = html;
}
function del(i) {
  records.splice(i, 1);
  localStorage.setItem("records", JSON.stringify(records));
  show();
}

function edit(i) {
  let r = records[i];

  document.getElementById("name").value = r.name;
  document.getElementById("mobile").value = "";
  document.getElementById("date").value = "";
  document.getElementById("work").value = r.work;
  document.getElementById("bigha").value = r.bigha;
  document.getElementById("rate").value = r.rate;
  document.getElementById("paid").value = r.paid;

  records.splice(i, 1);
  localStorage.setItem("records", JSON.stringify(records));
  show();
}

function share(i) {
  let r = records[i];

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

  const { jsPDF } = window.jspdf;
  let doc = new jsPDF();

  let farmer = records[i].name;

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

  doc.setFontSize(11);

  doc.text("Work", 10, y);
  doc.text("Bigha", 50, y);
  doc.text("Rate", 75, y);
  doc.text("Total", 100, y);
  doc.text("Paid", 130, y);
  doc.text("Balance", 160, y);

  y += 8;
    records.forEach(r => {

    if (r.name.trim().toLowerCase() === farmer.trim().toLowerCase()) {

      doc.text(r.work, 10, y);
      doc.text(String(r.bigha), 50, y);
      doc.text(String(r.rate), 75, y);
      doc.text(String(r.total), 100, y);
      doc.text(String(r.paid), 130, y);
      doc.text(String(r.baki), 160, y);

      total += r.total;
      paid += r.paid;
      baki += r.baki;

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
  doc.text("Total Amount : " + total, 10, y);

  y += 8;
  doc.text("Paid Amount : " + paid, 10, y);

  y += 8;
  doc.text("Balance : " + baki, 10, y);

  y += 15;
  doc.text("Mobile : 9079096875", 10, y);

  doc.save(farmer + ".pdf");
    }
show();
