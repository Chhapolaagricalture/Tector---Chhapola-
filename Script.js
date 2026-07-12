let records = JSON.parse(localStorage.getItem("records")) || [];

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
  let html = "";

  records.forEach((r, i) => {
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
  });

  document.getElementById("list").innerHTML = html;
}

function del(i) {
  records.splice(i, 1);
  localStorage.setItem("records", JSON.stringify(records));
  show();
}

show();
