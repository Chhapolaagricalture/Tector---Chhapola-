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

    if (!r.name.toLowerCase().includes(search)) return;
    groups[r.name] = {
    name: r.name,
    total: 0,
    paid: 0,
    baki: 0,
    items: ""
};
    }

    groups[r.name].total += r.total;
    groups[r.name].paid += r.paid;
    groups[r.name].baki += r.baki;

    groups[r.name].items += `
      <hr>
      <p>काम: ${r.work}</p>
      <p>बीघा: ${r.bigha}</p>
      <p>रेट: ₹${r.rate}</p>
      <p>कुल: ₹${r.total}</p>
      <p>जमा: ₹${r.paid}</p>
      <p>बाकी: ₹${r.baki}</p>

      <button onclick="edit(${i})">✏️ Edit</button>
      <button onclick="share(${i})">📲 WhatsApp</button>
      <button onclick="del(${i})">🗑 Delete</button>
    `;
  });
    for (let name in groups) {

    let g = groups[name];

    html += `
      <div class="card">
        <h3>👨‍🌾 ${g.name}</h3>

        ${g.items}

        <hr>
        <h4>📒 कुल हिसाब</h4>
        <p><b>कुल राशि:</b> ₹${g.total}</p>
        <p><b>जमा राशि:</b> ₹${g.paid}</p>
        <p><b>बाकी राशि:</b> ₹${g.baki}</p>
      </div>
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

  let msg =
`🚜 Chhapola Agriculture

👨‍🌾 किसान: ${r.name}
🌾 काम: ${r.work}
📏 बीघा: ${r.bigha}
💰 रेट: ₹${r.rate}
🧾 कुल: ₹${r.total}
💵 जमा: ₹${r.paid}
❌ बाकी: ₹${r.baki}`;

  window.open("https://wa.me/?text=" + encodeURIComponent(msg));
}

show();
