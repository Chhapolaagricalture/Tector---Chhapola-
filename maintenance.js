// ===== TRACTOR MAINTENANCE MODULE =====
// Chhapola Agriculture — Phase 2

(function() {
  'use strict';

  // Cached data
  let _user = null;
  let _tractor = null;
  let _services = [];
  let _diesel = [];
  let _reminders = [];
  let _records = []; // from Phase 1
  let _currentTab = 'dashboard';

  // Firebase references (set after auth)
  let F = null; // firebaseModules

  // ===== HELPERS =====
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fmt(n) { return Number(n||0).toLocaleString('en-IN'); }
  function today() { return new Date().toISOString().split('T')[0]; }
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'm-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // ===== TAB SYSTEM =====
  function setupTabs() {
    const tabs = document.querySelectorAll('.m-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        _currentTab = tab.dataset.tab;
        renderTab(_currentTab);
      });
    });
  }

  function renderTab(name) {
    const c = $('mContent');
    if (!c) return;
    switch(name) {
      case 'dashboard': renderDashboard(c); break;
      case 'tractor': renderTractor(c); break;
      case 'service': renderService(c); break;
      case 'diesel': renderDiesel(c); break;
      case 'reminders': renderReminders(c); break;
      case 'analysis': renderAnalysis(c); break;
      case 'history': renderHistory(c); break;
      default: renderDashboard(c);
    }
  }

  // ===== MODAL =====
  function openModal(html) {
    $('mModalContent').innerHTML = `
      <div class="m-modal-header">
        <h3 id="mModalTitle"></h3>
        <button class="m-modal-close" onclick="window._mCloseModal()">✕</button>
      </div>
      <div id="mModalBody">${html}</div>
    `;
    $('mModal').classList.add('active');
  }
  function closeModal() { $('mModal').classList.remove('active'); }
  window._mCloseModal = closeModal;

  // Close modal on overlay click
  document.addEventListener('DOMContentLoaded', () => {
    const overlay = $('mModal');
    if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  });

  // ===== DATA LOADING =====
  async function loadAllData() {
    if (!_user || !F) return;
    const uid = _user.uid;

    try {
      // Load tractor details
      const tractorDoc = await F.getDoc(F.doc(window.db, 'tractor_details', uid));
      _tractor = tractorDoc.exists() ? tractorDoc.data() : null;

      // Load services
      const svcSnap = await F.getDocs(F.query(
        F.collection(window.db, 'tractor_services'),
        F.where('ownerUid', '==', uid)
      ));
      _services = svcSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      _services.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      // Load diesel
      const dieselSnap = await F.getDocs(F.query(
        F.collection(window.db, 'tractor_diesel'),
        F.where('ownerUid', '==', uid)
      ));
      _diesel = dieselSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      _diesel.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      // Load reminders
      const remSnap = await F.getDocs(F.query(
        F.collection(window.db, 'tractor_reminders'),
        F.where('ownerUid', '==', uid)
      ));
      _reminders = remSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Load Phase 1 records (read-only for income analysis)
      const recSnap = await F.getDocs(F.query(
        F.collection(window.db, 'records'),
        F.where('ownerUid', '==', uid)
      ));
      _records = recSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    } catch (e) {
      console.error('Load error:', e);
      toast('⚠️ Data load error: ' + e.message);
    }
  }

  // ===== CALCULATIONS =====
  function calcExpenses() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const todayStr = today();

    let totalExpense = 0, monthExpense = 0, yearExpense = 0, todayExpense = 0;
    let totalDiesel = 0, monthDiesel = 0;
    let totalRunningHours = 0;

    // Services
    _services.forEach(s => {
      const cost = Number(s.totalCost) || 0;
      const d = s.date || '';
      totalExpense += cost;
      if (d >= todayStr) todayExpense += cost;
      if (d && new Date(d).getMonth() === month && new Date(d).getFullYear() === year) monthExpense += cost;
      if (d && new Date(d).getFullYear() === year) yearExpense += cost;
    });

    // Diesel
    _diesel.forEach(d => {
      const cost = Number(d.totalCost) || 0;
      const qty = Number(d.quantity) || 0;
      const rate = Number(d.rate) || 0;
      const actualCost = cost || (qty * rate);
      const dt = d.date || '';
      totalDiesel += actualCost;
      totalExpense += actualCost;
      if (dt >= todayStr) todayExpense += actualCost;
      if (dt && new Date(dt).getMonth() === month && new Date(dt).getFullYear() === year) {
        monthExpense += actualCost;
        monthDiesel += actualCost;
      }
      if (dt && new Date(dt).getFullYear() === year) yearExpense += actualCost;
      totalRunningHours += Number(d.runningHours) || 0;
    });

    return { totalExpense, monthExpense, yearExpense, todayExpense, totalDiesel, monthDiesel, totalRunningHours };
  }

  function calcIncome() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const todayStr = today();

    let totalIncome = 0, monthIncome = 0, yearIncome = 0, todayIncome = 0;

    _records.forEach(r => {
      const total = Number(r.total) || 0;
      const d = r.date || '';
      totalIncome += total;
      if (d >= todayStr) todayIncome += total;
      if (d && new Date(d).getMonth() === month && new Date(d).getFullYear() === year) monthIncome += total;
      if (d && new Date(d).getFullYear() === year) yearIncome += total;
    });

    return { totalIncome, monthIncome, yearIncome, todayIncome };
  }

  // ===== REMINDER STATUS =====
  function getReminderStatus(reminder) {
    if (reminder.status === 'completed') return 'completed';
    const now = new Date();
    const due = reminder.nextDate ? new Date(reminder.nextDate) : null;
    if (!due) return 'upcoming';
    const diffDays = Math.ceil((due - now) / (1000*60*60*24));
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 7) return 'due-soon';
    return 'upcoming';
  }

  function reminderBadge(status) {
    const map = {
      'upcoming': '<span class="m-badge m-badge-green">🟢 Upcoming</span>',
      'due-soon': '<span class="m-badge m-badge-yellow">🟡 Due Soon</span>',
      'overdue': '<span class="m-badge m-badge-red">🔴 Overdue</span>',
      'completed': '<span class="m-badge m-badge-gray">✅ Completed</span>'
    };
    return map[status] || '';
  }

  // ===== DASHBOARD =====
  function renderDashboard(el) {
    const exp = calcExpenses();
    const inc = calcIncome();
    const netProfit = inc.totalIncome - exp.totalExpense;
    const upcomingReminders = _reminders.filter(r => getReminderStatus(r) !== 'completed').length;

    el.innerHTML = `
      <!-- Tractor Info -->
      ${_tractor ? `
      <div class="m-tractor-card">
        <h3>🚜 ${esc(_tractor.company || 'Tractor')} ${esc(_tractor.model || '')}</h3>
        <div class="m-tractor-detail"><span>Registration</span><span>${esc(_tractor.registration || 'N/A')}</span></div>
        <div class="m-tractor-detail"><span>Purchase Year</span><span>${esc(_tractor.purchaseYear || 'N/A')}</span></div>
        <div class="m-tractor-detail"><span>Engine Hours</span><span>${esc(_tractor.engineHours || '0')} hrs</span></div>
        <div class="m-tractor-detail"><span>Status</span><span>${esc(_tractor.status || 'Active')}</span></div>
      </div>
      ` : `
      <div class="m-card" style="text-align:center;">
        <div style="font-size:40px;margin-bottom:10px;">🚜</div>
        <p style="color:var(--m-text-light);margin-bottom:12px;">अभी तक Tractor details add नहीं की गईं।</p>
        <button class="m-btn m-btn-primary" onclick="document.querySelector('[data-tab=tractor]').click()">🚜 Add Tractor</button>
      </div>
      `}

      <!-- Summary Cards -->
      <div class="m-summary-grid">
        <div class="m-summary-card green">
          <div class="m-summary-icon">💰</div>
          <div class="m-summary-label">Total Income</div>
          <div class="m-summary-value">₹${fmt(inc.totalIncome)}</div>
        </div>
        <div class="m-summary-card red">
          <div class="m-summary-icon">🔧</div>
          <div class="m-summary-label">Total Expense</div>
          <div class="m-summary-value">₹${fmt(exp.totalExpense)}</div>
        </div>
        <div class="m-summary-card ${netProfit >= 0 ? 'green' : 'red'}">
          <div class="m-summary-icon">📈</div>
          <div class="m-summary-label">Net Profit</div>
          <div class="m-summary-value">₹${fmt(netProfit)}</div>
        </div>
        <div class="m-summary-card yellow">
          <div class="m-summary-icon">⛽</div>
          <div class="m-summary-label">Diesel Expense</div>
          <div class="m-summary-value">₹${fmt(exp.totalDiesel)}</div>
        </div>
        <div class="m-summary-card blue">
          <div class="m-summary-icon">📅</div>
          <div class="m-summary-label">Today's Expense</div>
          <div class="m-summary-value">₹${fmt(exp.todayExpense)}</div>
        </div>
        <div class="m-summary-card blue">
          <div class="m-summary-icon">📊</div>
          <div class="m-summary-label">Monthly Expense</div>
          <div class="m-summary-value">₹${fmt(exp.monthExpense)}</div>
        </div>
        <div class="m-summary-card blue">
          <div class="m-summary-icon">⏱️</div>
          <div class="m-summary-label">Running Hours</div>
          <div class="m-summary-value">${fmt(exp.totalRunningHours)}h</div>
        </div>
        <div class="m-summary-card ${upcomingReminders > 0 ? 'yellow' : 'green'}">
          <div class="m-summary-icon">🔔</div>
          <div class="m-summary-label">Reminders</div>
          <div class="m-summary-value">${upcomingReminders}</div>
        </div>
      </div>

      <!-- Recent Services -->
      <div class="m-card">
        <div class="m-card-title"><span class="m-card-title-icon">🛠️</span> Recent Services</div>
        ${_services.length === 0 ? '<div class="m-empty"><div class="m-empty-icon">🛠️</div><div class="m-empty-text">No services yet</div></div>' :
          _services.slice(0, 5).map(s => `
            <div class="m-list-item">
              <div class="m-list-info">
                <div class="m-list-title">${esc(s.type || 'Service')}</div>
                <div class="m-list-sub">${esc(s.date || '')} • ${esc(s.problem || '')}</div>
              </div>
              <div class="m-list-amount">₹${fmt(s.totalCost)}</div>
            </div>
          `).join('')}
      </div>

      <!-- Recent Diesel -->
      <div class="m-card">
        <div class="m-card-title"><span class="m-card-title-icon">⛽</span> Recent Diesel Entries</div>
        ${_diesel.length === 0 ? '<div class="m-empty"><div class="m-empty-icon">⛽</div><div class="m-empty-text">No diesel entries yet</div></div>' :
          _diesel.slice(0, 5).map(d => `
            <div class="m-list-item">
              <div class="m-list-info">
                <div class="m-list-title">${fmt(d.quantity)}L × ₹${fmt(d.rate)}</div>
                <div class="m-list-sub">${esc(d.date || '')} • ${fmt(d.runningHours || 0)} hrs run</div>
              </div>
              <div class="m-list-amount">₹${fmt(d.totalCost || (Number(d.quantity)*Number(d.rate)))}</div>
            </div>
          `).join('')}
      </div>
    `;
  }

  // ===== TRACTOR DETAILS =====
  function renderTractor(el) {
    el.innerHTML = `
      <div class="m-card">
        <div class="m-card-title"><span class="m-card-title-icon">🚜</span> Tractor Details</div>
        ${_tractor ? `
          <div class="m-tractor-card" style="margin-bottom:16px;">
            <h3>${esc(_tractor.company || '')} ${esc(_tractor.model || '')}</h3>
            <div class="m-tractor-detail"><span>Registration</span><span>${esc(_tractor.registration || 'N/A')}</span></div>
            <div class="m-tractor-detail"><span>Purchase Year</span><span>${esc(_tractor.purchaseYear || 'N/A')}</span></div>
            <div class="m-tractor-detail"><span>Engine Hours</span><span>${esc(_tractor.engineHours || '0')} hrs</span></div>
            <div class="m-tractor-detail"><span>Status</span><span>${esc(_tractor.status || 'Active')}</span></div>
            ${_tractor.note ? `<div class="m-tractor-detail"><span>Note</span><span>${esc(_tractor.note)}</span></div>` : ''}
          </div>
          <button class="m-btn m-btn-secondary" onclick="window._mEditTractor()">✏️ Edit Tractor</button>
        ` : `
          <div class="m-empty">
            <div class="m-empty-icon">🚜</div>
            <div class="m-empty-text">Tractor details add करें</div>
            <div class="m-empty-sub">अपने Tractor की जानकारी भरें</div>
          </div>
          <button class="m-btn m-btn-primary" onclick="window._mAddTractor()" style="margin-top:12px;">🚜 Add Tractor</button>
        `}
      </div>
    `;
  }

  window._mAddTractor = function() {
    openModal(`
      <div class="m-field"><label>Tractor Company</label><input id="tCompany" placeholder="e.g. Mahindra, Swaraj, Sonalika"></div>
      <div class="m-field"><label>Model</label><input id="tModel" placeholder="e.g. 575 DI, 744 XT"></div>
      <div class="m-row">
        <div class="m-field"><label>Registration Number</label><input id="tReg" placeholder="RJ-XX-XX-XXXX"></div>
        <div class="m-field"><label>Purchase Year</label><input id="tYear" type="number" placeholder="2024"></div>
      </div>
      <div class="m-row">
        <div class="m-field"><label>Current Engine Hours</label><input id="tHours" type="number" placeholder="0"></div>
        <div class="m-field"><label>Status</label>
          <select id="tStatus"><option>Active</option><option>In Repair</option><option>Inactive</option></select>
        </div>
      </div>
      <div class="m-field"><label>Note</label><textarea id="tNote" placeholder="Any notes about your tractor..."></textarea></div>
      <button class="m-btn m-btn-primary" onclick="window._mSaveTractor()">💾 Save Tractor</button>
    `);
    $('mModalTitle').textContent = '🚜 Add Tractor Details';
  };

  window._mEditTractor = function() {
    if (!_tractor) return window._mAddTractor();
    openModal(`
      <div class="m-field"><label>Tractor Company</label><input id="tCompany" value="${esc(_tractor.company || '')}"></div>
      <div class="m-field"><label>Model</label><input id="tModel" value="${esc(_tractor.model || '')}"></div>
      <div class="m-row">
        <div class="m-field"><label>Registration Number</label><input id="tReg" value="${esc(_tractor.registration || '')}"></div>
        <div class="m-field"><label>Purchase Year</label><input id="tYear" type="number" value="${esc(_tractor.purchaseYear || '')}"></div>
      </div>
      <div class="m-row">
        <div class="m-field"><label>Current Engine Hours</label><input id="tHours" type="number" value="${esc(_tractor.engineHours || '0')}"></div>
        <div class="m-field"><label>Status</label>
          <select id="tStatus">
            <option ${_tractor.status==='Active'?'selected':''}>Active</option>
            <option ${_tractor.status==='In Repair'?'selected':''}>In Repair</option>
            <option ${_tractor.status==='Inactive'?'selected':''}>Inactive</option>
          </select>
        </div>
      </div>
      <div class="m-field"><label>Note</label><textarea id="tNote">${esc(_tractor.note || '')}</textarea></div>
      <button class="m-btn m-btn-primary" onclick="window._mSaveTractor()">💾 Update Tractor</button>
    `);
    $('mModalTitle').textContent = '✏️ Edit Tractor Details';
  };

  window._mSaveTractor = async function() {
    if (!_user) return;
    const data = {
      company: $('tCompany').value.trim(),
      model: $('tModel').value.trim(),
      registration: $('tReg').value.trim(),
      purchaseYear: $('tYear').value.trim(),
      engineHours: $('tHours').value.trim(),
      status: $('tStatus').value,
      note: $('tNote').value.trim(),
      ownerUid: _user.uid,
      updatedAt: new Date().toISOString()
    };
    try {
      await F.setDoc(F.doc(window.db, 'tractor_details', _user.uid), data, { merge: true });
      _tractor = { ..._tractor, ...data };
      closeModal();
      toast('✅ Tractor saved!');
      renderTab(_currentTab);
    } catch(e) { toast('❌ Error: ' + e.message); }
  };

  // ===== SERVICE / REPAIR =====
  function renderService(el) {
    el.innerHTML = `
      <div class="m-card">
        <div class="m-card-title"><span class="m-card-title-icon">🛠️</span> Service & Repair History</div>
        <button class="m-btn m-btn-primary" onclick="window._mAddService()" style="margin-bottom:16px;">➕ Add Service/Repair</button>
        ${_services.length === 0 ? `
          <div class="m-empty"><div class="m-empty-icon">🛠️</div><div class="m-empty-text">No services yet</div><div class="m-empty-sub">Add your first service/repair entry</div></div>
        ` : `
          <div class="m-table-wrap">
            <table class="m-table">
              <thead><tr>
                <th>Date</th><th>Type</th><th>Problem</th><th>Cost</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                ${_services.map(s => `<tr>
                  <td>${esc(s.date||'')}</td>
                  <td>${esc(s.type||'')}</td>
                  <td>${esc((s.problem||'').substring(0,30))}${(s.problem||'').length>30?'...':''}</td>
                  <td style="font-weight:700;">₹${fmt(s.totalCost)}</td>
                  <td><span class="m-badge ${s.paymentStatus==='Paid'?'m-badge-green':'m-badge-yellow'}">${esc(s.paymentStatus||'Pending')}</span></td>
                  <td>
                    <button class="m-btn m-btn-secondary m-btn-icon" onclick="window._mEditService('${s.id}')" title="Edit">✏️</button>
                    <button class="m-btn m-btn-danger m-btn-icon" onclick="window._mDeleteService('${s.id}')" title="Delete">🗑️</button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  }

  function serviceFormHTML(data) {
    const d = data || {};
    return `
      <div class="m-row">
        <div class="m-field"><label>Date</label><input id="sDate" type="date" value="${esc(d.date || today())}"></div>
        <div class="m-field"><label>Engine Hours</label><input id="sHours" type="number" value="${esc(d.engineHours || (_tractor ? _tractor.engineHours : ''))}" placeholder="Engine hours at service"></div>
      </div>
      <div class="m-row">
        <div class="m-field"><label>Service/Repair Type</label>
          <select id="sType">
            <option ${d.type==='Service'?'selected':''}>Service</option>
            <option ${d.type==='Repair'?'selected':''}>Repair</option>
            <option ${d.type==='Oil Change'?'selected':''}>Oil Change</option>
            <option ${d.type==='Filter Change'?'selected':''}>Filter Change</option>
            <option ${d.type==='Engine Work'?'selected':''}>Engine Work</option>
            <option ${d.type==='Hydraulic Repair'?'selected':''}>Hydraulic Repair</option>
            <option ${d.type==='Tyre Change'?'selected':''}>Tyre Change</option>
            <option ${d.type==='Battery'?'selected':''}>Battery</option>
            <option ${d.type==='Other'?'selected':''}>Other</option>
          </select>
        </div>
        <div class="m-field"><label>Payment Status</label>
          <select id="sPayStatus">
            <option ${d.paymentStatus==='Paid'?'selected':''}>Paid</option>
            <option ${d.paymentStatus==='Pending'?'selected':''}>Pending</option>
            <option ${d.paymentStatus==='Partial'?'selected':''}>Partial</option>
          </select>
        </div>
      </div>
      <div class="m-field"><label>Problem</label><input id="sProblem" value="${esc(d.problem||'')}" placeholder="What was the problem?"></div>
      <div class="m-field"><label>Work Done</label><input id="sWork" value="${esc(d.work||'')}" placeholder="What work was done?"></div>
      <div class="m-field"><label>Mechanic / Workshop</label><input id="sMechanic" value="${esc(d.mechanic||'')}" placeholder="Mechanic or workshop name"></div>
      <div class="m-row">
        <div class="m-field"><label>Parts Cost (₹)</label><input id="sParts" type="number" value="${esc(d.partsCost||'')}" placeholder="0"></div>
        <div class="m-field"><label>Labour Cost (₹)</label><input id="sLabour" type="number" value="${esc(d.labourCost||'')}" placeholder="0"></div>
      </div>
      <div class="m-field"><label>Total Cost (₹)</label><input id="sTotal" type="number" value="${esc(d.totalCost||'')}" placeholder="Auto-calculated or manual"></div>
      <div class="m-field"><label>Note</label><textarea id="sNote" placeholder="Additional notes...">${esc(d.note||'')}</textarea></div>
      <button class="m-btn m-btn-primary" onclick="window._mSaveService('${d.id||''}')">💾 Save</button>
    `;
  }

  window._mAddService = function() {
    openModal(serviceFormHTML());
    $('mModalTitle').textContent = '➕ Add Service / Repair';
    // Auto-calc total
    setTimeout(() => {
      ['sParts','sLabour'].forEach(id => {
        const el = $(id);
        if (el) el.addEventListener('input', () => {
          const p = Number($('sParts').value)||0;
          const l = Number($('sLabour').value)||0;
          $('sTotal').value = p + l;
        });
      });
    }, 100);
  };

  window._mEditService = function(id) {
    const s = _services.find(x => x.id === id);
    if (!s) return;
    openModal(serviceFormHTML(s));
    $('mModalTitle').textContent = '✏️ Edit Service / Repair';
  };

  window._mSaveService = async function(id) {
    if (!_user) return;
    const parts = Number($('sParts').value)||0;
    const labour = Number($('sLabour').value)||0;
    const data = {
      ownerUid: _user.uid,
      date: $('sDate').value,
      engineHours: $('sHours').value.trim(),
      type: $('sType').value,
      paymentStatus: $('sPayStatus').value,
      problem: $('sProblem').value.trim(),
      work: $('sWork').value.trim(),
      mechanic: $('sMechanic').value.trim(),
      partsCost: parts,
      labourCost: labour,
      totalCost: Number($('sTotal').value) || (parts + labour),
      note: $('sNote').value.trim(),
      updatedAt: new Date().toISOString()
    };
    try {
      if (id) {
        await F.updateDoc(F.doc(window.db, 'tractor_services', id), data);
      } else {
        data.createdAt = new Date().toISOString();
        await F.addDoc(F.collection(window.db, 'tractor_services'), data);
      }
      closeModal();
      toast(id ? '✅ Service updated!' : '✅ Service added!');
      await loadAllData();
      renderTab(_currentTab);
    } catch(e) { toast('❌ Error: ' + e.message); }
  };

  window._mDeleteService = async function(id) {
    if (!confirm('Delete this service record?')) return;
    try {
      await F.deleteDoc(F.doc(window.db, 'tractor_services', id));
      toast('🗑️ Deleted!');
      await loadAllData();
      renderTab(_currentTab);
    } catch(e) { toast('❌ Error: ' + e.message); }
  };

  // ===== DIESEL =====
  function renderDiesel(el) {
    const totalDieselQty = _diesel.reduce((s, d) => s + (Number(d.quantity)||0), 0);
    const totalDieselCost = _diesel.reduce((s, d) => s + (Number(d.totalCost)||Number(d.quantity)*Number(d.rate)||0), 0);
    const avgRate = totalDieselQty > 0 ? Math.round(totalDieselCost / totalDieselQty) : 0;

    el.innerHTML = `
      <div class="m-card">
        <div class="m-card-title"><span class="m-card-title-icon">⛽</span> Diesel / Running Expense</div>

        <!-- Diesel Summary -->
        <div class="m-analysis-row" style="margin-bottom:16px;">
          <div class="m-analysis-item"><div class="m-analysis-label">Total Diesel</div><div class="m-analysis-value">${fmt(totalDieselQty)}L</div></div>
          <div class="m-analysis-item"><div class="m-analysis-label">Total Cost</div><div class="m-analysis-value">₹${fmt(totalDieselCost)}</div></div>
          <div class="m-analysis-item"><div class="m-analysis-label">Avg Rate</div><div class="m-analysis-value">₹${fmt(avgRate)}/L</div></div>
          <div class="m-analysis-item"><div class="m-analysis-label">Running Hours</div><div class="m-analysis-value">${fmt(_diesel.reduce((s,d)=>s+(Number(d.runningHours)||0),0))}h</div></div>
        </div>

        <button class="m-btn m-btn-primary" onclick="window._mAddDiesel()" style="margin-bottom:16px;">➕ Add Diesel Entry</button>

        ${_diesel.length === 0 ? `
          <div class="m-empty"><div class="m-empty-icon">⛽</div><div class="m-empty-text">No diesel entries yet</div></div>
        ` : `
          <div class="m-table-wrap">
            <table class="m-table">
              <thead><tr><th>Date</th><th>Qty (L)</th><th>Rate</th><th>Cost</th><th>Hours</th><th>Actions</th></tr></thead>
              <tbody>
                ${_diesel.map(d => {
                  const cost = Number(d.totalCost) || (Number(d.quantity)*Number(d.rate)) || 0;
                  return `<tr>
                    <td>${esc(d.date||'')}</td>
                    <td>${fmt(d.quantity)}</td>
                    <td>₹${fmt(d.rate)}</td>
                    <td style="font-weight:700;">₹${fmt(cost)}</td>
                    <td>${fmt(d.runningHours||0)}h</td>
                    <td>
                      <button class="m-btn m-btn-secondary m-btn-icon" onclick="window._mEditDiesel('${d.id}')" title="Edit">✏️</button>
                      <button class="m-btn m-btn-danger m-btn-icon" onclick="window._mDeleteDiesel('${d.id}')" title="Delete">🗑️</button>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  }

  function dieselFormHTML(data) {
    const d = data || {};
    return `
      <div class="m-row">
        <div class="m-field"><label>Date</label><input id="dDate" type="date" value="${esc(d.date || today())}"></div>
        <div class="m-field"><label>Engine Hours</label><input id="dHours" type="number" value="${esc(d.engineHours || (_tractor ? _tractor.engineHours : ''))}" placeholder="Engine hours"></div>
      </div>
      <div class="m-row">
        <div class="m-field"><label>Diesel Quantity (L)</label><input id="dQty" type="number" value="${esc(d.quantity||'')}" placeholder="Liters"></div>
        <div class="m-field"><label>Rate (₹/L)</label><input id="dRate" type="number" value="${esc(d.rate||'')}" placeholder="Rate per liter"></div>
      </div>
      <div class="m-field"><label>Total Cost (₹)</label><input id="dTotal" type="number" value="${esc(d.totalCost||'')}" placeholder="Auto-calculated"></div>
      <div class="m-row">
        <div class="m-field"><label>Running Hours</label><input id="dRunHrs" type="number" value="${esc(d.runningHours||'')}" placeholder="Hours run"></div>
        <div class="m-field"><label>Kilometer (optional)</label><input id="dKm" type="number" value="${esc(d.km||'')}" placeholder="Km driven"></div>
      </div>
      <div class="m-field"><label>Note</label><textarea id="dNote" placeholder="Any notes...">${esc(d.note||'')}</textarea></div>
      <button class="m-btn m-btn-primary" onclick="window._mSaveDiesel('${d.id||''}')">💾 Save</button>
    `;
  }

  window._mAddDiesel = function() {
    openModal(dieselFormHTML());
    $('mModalTitle').textContent = '⛽ Add Diesel Entry';
    setTimeout(() => {
      const calcTotal = () => {
        const q = Number($('dQty').value)||0;
        const r = Number($('dRate').value)||0;
        $('dTotal').value = q * r || '';
      };
      $('dQty').addEventListener('input', calcTotal);
      $('dRate').addEventListener('input', calcTotal);
    }, 100);
  };

  window._mEditDiesel = function(id) {
    const d = _diesel.find(x => x.id === id);
    if (!d) return;
    openModal(dieselFormHTML(d));
    $('mModalTitle').textContent = '✏️ Edit Diesel Entry';
  };

  window._mSaveDiesel = async function(id) {
    if (!_user) return;
    const qty = Number($('dQty').value)||0;
    const rate = Number($('dRate').value)||0;
    const data = {
      ownerUid: _user.uid,
      date: $('dDate').value,
      engineHours: $('dHours').value.trim(),
      quantity: qty,
      rate: rate,
      totalCost: Number($('dTotal').value) || (qty * rate),
      runningHours: Number($('dRunHrs').value)||0,
      km: Number($('dKm').value)||0,
      note: $('dNote').value.trim(),
      updatedAt: new Date().toISOString()
    };
    try {
      if (id) {
        await F.updateDoc(F.doc(window.db, 'tractor_diesel', id), data);
      } else {
        data.createdAt = new Date().toISOString();
        await F.addDoc(F.collection(window.db, 'tractor_diesel'), data);
      }
      closeModal();
      toast(id ? '✅ Diesel updated!' : '✅ Diesel added!');
      await loadAllData();
      renderTab(_currentTab);
    } catch(e) { toast('❌ Error: ' + e.message); }
  };

  window._mDeleteDiesel = async function(id) {
    if (!confirm('Delete this diesel entry?')) return;
    try {
      await F.deleteDoc(F.doc(window.db, 'tractor_diesel', id));
      toast('🗑️ Deleted!');
      await loadAllData();
      renderTab(_currentTab);
    } catch(e) { toast('❌ Error: ' + e.message); }
  };

  // ===== REMINDERS =====
  function renderReminders(el) {
    const upcoming = _reminders.filter(r => getReminderStatus(r) === 'upcoming');
    const dueSoon = _reminders.filter(r => getReminderStatus(r) === 'due-soon');
    const overdue = _reminders.filter(r => getReminderStatus(r) === 'overdue');
    const completed = _reminders.filter(r => getReminderStatus(r) === 'completed');

    el.innerHTML = `
      <div class="m-card">
        <div class="m-card-title"><span class="m-card-title-icon">📅</span> Maintenance Reminders</div>
        <button class="m-btn m-btn-primary" onclick="window._mAddReminder()" style="margin-bottom:16px;">➕ Add Reminder</button>

        ${overdue.length > 0 ? `<div style="margin-bottom:12px;"><div style="font-size:13px;font-weight:700;color:var(--m-danger);margin-bottom:8px;">🔴 Overdue (${overdue.length})</div>${overdue.map(r => reminderCard(r)).join('')}</div>` : ''}
        ${dueSoon.length > 0 ? `<div style="margin-bottom:12px;"><div style="font-size:13px;font-weight:700;color:var(--m-warning);margin-bottom:8px;">🟡 Due Soon (${dueSoon.length})</div>${dueSoon.map(r => reminderCard(r)).join('')}</div>` : ''}
        ${upcoming.length > 0 ? `<div style="margin-bottom:12px;"><div style="font-size:13px;font-weight:700;color:var(--m-success);margin-bottom:8px;">🟢 Upcoming (${upcoming.length})</div>${upcoming.map(r => reminderCard(r)).join('')}</div>` : ''}
        ${completed.length > 0 ? `<div style="margin-bottom:12px;"><div style="font-size:13px;font-weight:700;color:var(--m-text-light);margin-bottom:8px;">✅ Completed (${completed.length})</div>${completed.map(r => reminderCard(r)).join('')}</div>` : ''}

        ${_reminders.length === 0 ? '<div class="m-empty"><div class="m-empty-icon">📅</div><div class="m-empty-text">No reminders yet</div><div class="m-empty-sub">Add service/maintenance reminders</div></div>' : ''}
      </div>
    `;
  }

  function reminderCard(r) {
    const status = getReminderStatus(r);
    const cls = status === 'overdue' ? 'overdue' : status === 'due-soon' ? 'due-soon' : status === 'completed' ? 'completed' : 'upcoming';
    return `
      <div class="m-reminder-card ${cls}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div class="m-reminder-title">${esc(r.title || 'Reminder')}</div>
            <div class="m-reminder-detail">${r.nextDate ? '📅 ' + esc(r.nextDate) : ''} ${r.nextHours ? '• ⏱️ ' + esc(r.nextHours) + ' hrs' : ''}</div>
            ${r.note ? `<div class="m-reminder-detail">${esc(r.note)}</div>` : ''}
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0;flex-direction:column;align-items:flex-end;">
            ${reminderBadge(status)}
            <div style="display:flex;gap:4px;margin-top:6px;">
              <button class="m-btn m-btn-secondary m-btn-icon" onclick="window._mEditReminder('${r.id}')" title="Edit">✏️</button>
              ${status !== 'completed' ? `<button class="m-btn m-btn-primary m-btn-icon" onclick="window._mCompleteReminder('${r.id}')" title="Mark Complete">✅</button>` : ''}
              <button class="m-btn m-btn-danger m-btn-icon" onclick="window._mDeleteReminder('${r.id}')" title="Delete">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function reminderFormHTML(data) {
    const d = data || {};
    return `
      <div class="m-field"><label>Reminder Title</label><input id="rTitle" value="${esc(d.title||'')}" placeholder="e.g. Oil Change, Filter Change, Next Service"></div>
      <div class="m-row">
        <div class="m-field"><label>Next Due Date</label><input id="rDate" type="date" value="${esc(d.nextDate||'')}"></div>
        <div class="m-field"><label>Next Engine Hours</label><input id="rHours" type="number" value="${esc(d.nextHours||'')}" placeholder="Engine hours due"></div>
      </div>
      <div class="m-field"><label>Note</label><textarea id="rNote" placeholder="Additional details...">${esc(d.note||'')}</textarea></div>
      <button class="m-btn m-btn-primary" onclick="window._mSaveReminder('${d.id||''}')">💾 Save Reminder</button>
    `;
  }

  window._mAddReminder = function() {
    openModal(reminderFormHTML());
    $('mModalTitle').textContent = '📅 Add Reminder';
  };

  window._mEditReminder = function(id) {
    const r = _reminders.find(x => x.id === id);
    if (!r) return;
    openModal(reminderFormHTML(r));
    $('mModalTitle').textContent = '✏️ Edit Reminder';
  };

  window._mSaveReminder = async function(id) {
    if (!_user) return;
    const data = {
      ownerUid: _user.uid,
      title: $('rTitle').value.trim(),
      nextDate: $('rDate').value,
      nextHours: $('rHours').value.trim(),
      note: $('rNote').value.trim(),
      status: 'active',
      updatedAt: new Date().toISOString()
    };
    if (!data.title) { toast('⚠️ Enter reminder title'); return; }
    try {
      if (id) {
        await F.updateDoc(F.doc(window.db, 'tractor_reminders', id), data);
      } else {
        data.createdAt = new Date().toISOString();
        await F.addDoc(F.collection(window.db, 'tractor_reminders'), data);
      }
      closeModal();
      toast(id ? '✅ Reminder updated!' : '✅ Reminder added!');
      await loadAllData();
      renderTab(_currentTab);
    } catch(e) { toast('❌ Error: ' + e.message); }
  };

  window._mCompleteReminder = async function(id) {
    try {
      await F.updateDoc(F.doc(window.db, 'tractor_reminders', id), { status: 'completed', completedAt: new Date().toISOString() });
      toast('✅ Marked complete!');
      await loadAllData();
      renderTab(_currentTab);
    } catch(e) { toast('❌ Error: ' + e.message); }
  };

  window._mDeleteReminder = async function(id) {
    if (!confirm('Delete this reminder?')) return;
    try {
      await F.deleteDoc(F.doc(window.db, 'tractor_reminders', id));
      toast('🗑️ Deleted!');
      await loadAllData();
      renderTab(_currentTab);
    } catch(e) { toast('❌ Error: ' + e.message); }
  };

  // ===== ANALYSIS =====
  function renderAnalysis(el) {
    const inc = calcIncome();
    const exp = calcExpenses();
    const netToday = inc.todayIncome - exp.todayExpense;
    const netMonth = inc.monthIncome - exp.monthExpense;
    const netYear = inc.yearIncome - exp.yearExpense;
    const netTotal = inc.totalIncome - exp.totalExpense;

    // Expense breakdown
    const serviceTotal = _services.reduce((s, r) => s + (Number(r.totalCost)||0), 0);

    el.innerHTML = `
      <div class="m-card">
        <div class="m-card-title"><span class="m-card-title-icon">📈</span> Income vs Expense Analysis</div>

        <!-- Today -->
        <div style="margin-bottom:20px;">
          <div style="font-size:13px;font-weight:700;color:var(--m-text-light);margin-bottom:10px;">📅 Today</div>
          <div class="m-analysis-row">
            <div class="m-analysis-item green"><div class="m-analysis-label">Income</div><div class="m-analysis-value">₹${fmt(inc.todayIncome)}</div></div>
            <div class="m-analysis-item red"><div class="m-analysis-label">Expense</div><div class="m-analysis-value">₹${fmt(exp.todayExpense)}</div></div>
          </div>
          <div class="m-analysis-item ${netToday >= 0 ? 'green' : 'red'}" style="text-align:center;padding:10px;border-radius:10px;">
            <div class="m-analysis-label">Net Profit Today</div>
            <div class="m-analysis-value">₹${fmt(netToday)}</div>
          </div>
        </div>

        <!-- This Month -->
        <div style="margin-bottom:20px;">
          <div style="font-size:13px;font-weight:700;color:var(--m-text-light);margin-bottom:10px;">📊 This Month</div>
          <div class="m-analysis-row">
            <div class="m-analysis-item green"><div class="m-analysis-label">Income</div><div class="m-analysis-value">₹${fmt(inc.monthIncome)}</div></div>
            <div class="m-analysis-item red"><div class="m-analysis-label">Expense</div><div class="m-analysis-value">₹${fmt(exp.monthExpense)}</div></div>
          </div>
          <div class="m-analysis-item ${netMonth >= 0 ? 'green' : 'red'}" style="text-align:center;padding:10px;border-radius:10px;">
            <div class="m-analysis-label">Net Profit This Month</div>
            <div class="m-analysis-value">₹${fmt(netMonth)}</div>
          </div>
        </div>

        <!-- This Year -->
        <div style="margin-bottom:20px;">
          <div style="font-size:13px;font-weight:700;color:var(--m-text-light);margin-bottom:10px;">📆 This Year</div>
          <div class="m-analysis-row">
            <div class="m-analysis-item green"><div class="m-analysis-label">Income</div><div class="m-analysis-value">₹${fmt(inc.yearIncome)}</div></div>
            <div class="m-analysis-item red"><div class="m-analysis-label">Expense</div><div class="m-analysis-value">₹${fmt(exp.yearExpense)}</div></div>
          </div>
          <div class="m-analysis-item ${netYear >= 0 ? 'green' : 'red'}" style="text-align:center;padding:10px;border-radius:10px;">
            <div class="m-analysis-label">Net Profit This Year</div>
            <div class="m-analysis-value">₹${fmt(netYear)}</div>
          </div>
        </div>

        <!-- Total -->
        <div style="margin-bottom:16px;">
          <div style="font-size:13px;font-weight:700;color:var(--m-text-light);margin-bottom:10px;">💰 All Time</div>
          <div class="m-analysis-row">
            <div class="m-analysis-item green"><div class="m-analysis-label">Total Income</div><div class="m-analysis-value">₹${fmt(inc.totalIncome)}</div></div>
            <div class="m-analysis-item red"><div class="m-analysis-label">Total Expense</div><div class="m-analysis-value">₹${fmt(exp.totalExpense)}</div></div>
          </div>
          <div class="m-analysis-item ${netTotal >= 0 ? 'green' : 'red'}" style="text-align:center;padding:14px;border-radius:10px;">
            <div class="m-analysis-label">Net Profit (All Time)</div>
            <div class="m-analysis-value" style="font-size:24px;">₹${fmt(netTotal)}</div>
          </div>
        </div>

        <!-- Expense Breakdown -->
        <div style="margin-top:16px;">
          <div style="font-size:13px;font-weight:700;color:var(--m-text-light);margin-bottom:10px;">🔍 Expense Breakdown</div>
          <div class="m-analysis-row">
            <div class="m-analysis-item"><div class="m-analysis-label">Service/Repair</div><div class="m-analysis-value">₹${fmt(serviceTotal)}</div></div>
            <div class="m-analysis-item"><div class="m-analysis-label">Diesel</div><div class="m-analysis-value">₹${fmt(exp.totalDiesel)}</div></div>
          </div>
        </div>
      </div>
    `;
  }

  // ===== HISTORY =====
  function renderHistory(el) {
    // Combine all events into timeline
    let events = [];

    _services.forEach(s => {
      events.push({
        date: s.date || '',
        type: 'service',
        icon: '🛠️',
        title: s.type || 'Service',
        detail: s.problem || s.work || '',
        cost: Number(s.totalCost) || 0,
        raw: s
      });
    });

    _diesel.forEach(d => {
      events.push({
        date: d.date || '',
        type: 'diesel',
        icon: '⛽',
        title: 'Diesel',
        detail: `${d.quantity}L × ₹${d.rate}`,
        cost: Number(d.totalCost) || (Number(d.quantity)*Number(d.rate)) || 0,
        raw: d
      });
    });

    _reminders.forEach(r => {
      const status = getReminderStatus(r);
      events.push({
        date: r.nextDate || '',
        type: 'reminder',
        icon: status === 'completed' ? '✅' : status === 'overdue' ? '🔴' : '📅',
        title: r.title || 'Reminder',
        detail: r.note || '',
        cost: 0,
        raw: r
      });
    });

    // Sort by date descending
    events.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    el.innerHTML = `
      <div class="m-card">
        <div class="m-card-title"><span class="m-card-title-icon">📋</span> Complete Service History</div>

        <!-- Filters -->
        <div class="m-filter-row">
          <button class="m-filter-btn active" onclick="window._mFilterHistory('all', this)">All</button>
          <button class="m-filter-btn" onclick="window._mFilterHistory('service', this)">🛠️ Service</button>
          <button class="m-filter-btn" onclick="window._mFilterHistory('diesel', this)">⛽ Diesel</button>
          <button class="m-filter-btn" onclick="window._mFilterHistory('reminder', this)">📅 Reminders</button>
        </div>

        <div id="historyList">
          ${events.length === 0 ? `
            <div class="m-empty"><div class="m-empty-icon">📋</div><div class="m-empty-text">No history yet</div><div class="m-empty-sub">Service and diesel entries will appear here</div></div>
          ` : events.map(ev => `
            <div class="m-list-item" data-type="${ev.type}">
              <div style="font-size:24px;flex-shrink:0;">${ev.icon}</div>
              <div class="m-list-info">
                <div class="m-list-title">${esc(ev.title)}</div>
                <div class="m-list-sub">${esc(ev.date)}${ev.detail ? ' • ' + esc(ev.detail) : ''}</div>
              </div>
              ${ev.cost > 0 ? `<div class="m-list-amount">₹${fmt(ev.cost)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  window._mFilterHistory = function(type, btn) {
    // Update filter buttons
    document.querySelectorAll('.m-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Filter items
    document.querySelectorAll('#historyList .m-list-item').forEach(item => {
      if (type === 'all' || item.dataset.type === type) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  };

  // ===== INIT =====
  window.initMaintenance = async function(user) {
    F = window.firebaseModules;
    _user = user;
    setupTabs();
    await loadAllData();
    renderTab('dashboard');
  };

})();
