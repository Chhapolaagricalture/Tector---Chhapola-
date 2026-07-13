let records = JSON.parse(localStorage.getItem("records")) || [];

function save() {

  let name = document.getElementById("name").value.trim();
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

  let r = records[i];

  doc.setFontSize(18);
  doc.text("Chhapola Agriculture", 20, 20);

  doc.setFontSize(12);
  doc.text("Farmer : " + r.name, 20, 40);
  doc.text("Work   : " + r.work, 20, 50);
  doc.text("Bigha  : " + r.bigha, 20, 60);
  doc.text("Rate   : Rs. " + r.rate, 20, 70);
  doc.text("Total  : Rs. " + r.total, 20, 80);
  doc.text("Paid   : Rs. " + r.paid, 20, 90);
  doc.text("Balance: Rs. " + r.baki, 20, 100);

  doc.text("Mobile : 9079096875", 20, 120);

  doc.save(r.name + ".pdf");
}
show();
