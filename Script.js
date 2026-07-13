let records = JSON.parse(localStorage.getItem("records")) || [];
let editIndex = -1;
function save() {
  let name = document.getElementById("name").value;
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

 if (editIndex == -1) {
    records.push({});} else {
    records[editIndex] = {
        name,
        work,
        bigha,
        rate,
        paid,
        total,
        baki
    };
    editIndex = -1;
 }
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
  let html = "";
let search = document.getElementById("search").value.toLowerCase();

let total = 0;
let paid = 0;
let baki = 0;
  records.forEach((r, i) => {if (!r.name.toLowerCase().includes(search)) return;
<button onclick="edit(${i})">✏️ Edit</button>
<button onclick="share(${i})">📱 WhatsApp</button>
total += r.total;
paid += r.paid;
baki += r.baki;
    html += `
      <div class="card">
        <h3>${r.name}</h3>
        <p>काम: ${r.work}</p>
        <p>बीघा: ${r.bigha}</p>
        <p>रेट: ₹${r.rate}</p>
        <p class="total">कुल: ₹${r.total}</p>
        <p>जमा: ₹${r.paid}</p>
        <p class="balance">बाकी: ₹${r.baki}</p>
        <button onclick="del(${i})">Delete</button>
      </div>
    `;
  });document.getElementById("summary").innerHTML = `
<h3>💰 कुल हिसाब</h3>
<p>कुल राशि: ₹${total}</p>
<p>जमा राशि: ₹${paid}</p>
<p>बाकी राशि: ₹${baki}</p>
`;

  document.getElementById("list").innerHTML = html;
}

function del(i) {
  records.splice(i, 1);
  localStorage.setItem("records", JSON.stringify(records));
  show();
}

show();
function edit(i){
  let r = records[i];

  document.getElementById("name").value = r.name;
  document.getElementById("work").value = r.work;
  document.getElementById("bigha").value = r.bigha;
  document.getElementById("rate").value = r.rate;
  document.getElementById("paid").value = r.paid;

  records.splice(i,1);
  localStorage.setItem("records", JSON.stringify(records));
  show();
}

function share(i){
  let r = records[i];
let msg = (`)🚜 Chhapola Agriculture

👨‍🌾 किसान: ${r.name}
🌾 काम: ${r.work}
📏 बीघा: ${r.bigha}
💰 रेट: ₹${r.rate}
🧾 कुल: ₹${r.total}
💵 जमा: ₹${r.paid}
📌 बाकी: ₹${r.baki}(`);

window.open("https://wa.me/?text=" + encodeURIComponent(msg));
  ;
      }
