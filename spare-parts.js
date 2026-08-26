// ===== SPARE PARTS & PRICE ANALYSIS MODULE =====
// Chhapola Agriculture — Phase 3 (Dynamic Search Engine)
// Calls backend /api/spare-parts/search for real product data

(function() {
  'use strict';

  // Backend API base URL
  const API_BASE = 'https://tector-chhapola.onrender.com';

  // Hindi-to-English transliteration map
  const HINDI_MAP = {
    'ऑयल': 'oil', 'फिल्टर': 'filter', 'एयर': 'air', 'फ्यूल': 'fuel',
    'हाइड्रोलिक': 'hydraulic', 'बेल्ट': 'belt', 'फैन': 'fan',
    'क्लच': 'clutch', 'प्लेट': 'plate', 'बियरिंग': 'bearing',
    'ब्रेक': 'brake', 'पंप': 'pump', 'वाटर': 'water', 'पानी': 'water',
    'बैटरी': 'battery', 'टायर': 'tyre', 'सेल्फ': 'self', 'मोटर': 'motor',
    'स्टार्टर': 'starter', 'प्रेशर': 'pressure',
    'होज़': 'hose', 'पाइप': 'pipe', 'सिलेंडर': 'cylinder',
    'रेडिएटर': 'radiator', 'थर्मोस्टेट': 'thermostat', 'वाल्व': 'valve',
    'ग्लो': 'glow', 'प्लग': 'plug', 'अल्टरनेटर': 'alternator',
    'इंजेक्टर': 'injector', 'गास्केट': 'gasket',
    'पिस्टन': 'piston', 'रिंग': 'ring',
    'इनलेट': 'inlet', 'आउटलेट': 'outlet', 'हेडलाइट': 'headlight',
    'इंडिकेटर': 'indicator', 'सीट': 'seat', 'फेंडर': 'fender',
    'मडगार्ड': 'mudguard', 'स्टीयरिंग': 'steering', 'बॉक्स': 'box',
    'लाइनिंग': 'lining', 'ड्रम': 'drum',
    'ब्रेथर': 'breather', 'ओईल': 'oil', 'फ़िल्टर': 'filter',
    'फ़्यूल': 'fuel', 'हाईड्रोलिक': 'hydraulic',
    'पम्प': 'pump', 'ट्यूब': 'tube', 'फ्रंट': 'front', 'रियर': 'rear',
    'फुल': 'full', 'सेट': 'set', 'लाइट': 'light',
    'रिलीज': 'release', 'नकल': 'knuckle'
  };

  // Tractor companies
  const COMPANIES = [
    'Swaraj', 'Mahindra', 'Sonalika', 'John Deere', 'New Holland',
    'Farmtrac', 'Massey Ferguson', 'Eicher', 'Powertrac', 'Kubota'
  ];

  // ===== STATE =====
  let _user = null;
  let _tractor = null;
  let _selectedCompany = '';
  let _selectedModel = '';
  let _searchText = '';
  let _currentTab = 'search';
  let _searchHistory = [];
  let _compareList = [];
  let _lastResults = [];
  let F = null;
  let _searching = false;

  // ===== HELPERS =====
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'sp-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function hindiToEnglish(text) {
    let result = text;
    for (const [hindi, english] of Object.entries(HINDI_MAP)) {
      result = result.split(hindi).join(english);
    }
    return result;
  }

  // ===== DYNAMIC SEARCH via Backend API =====
  async function searchParts(query, company, model) {
    if (_searching) return [];
    _searching = true;

    try {
      const params = new URLSearchParams();
      params.set('q', hindiToEnglish(query));
      if (company) params.set('company', company);
      if (model) params.set('model', model);

      const response = await fetch(`${API_BASE}/api/spare-parts/search?${params.toString()}`);

      if (!response.ok) {
        console.error('Search API error:', response.status);
        return [];
      }

      const data = await response.json();
      return data.results || [];
    } catch (e) {
      console.error('Search error:', e);
      return [];
    } finally {
      _searching = false;
    }
  }

  // ===== TAB SYSTEM =====
  function setupTabs() {
    document.querySelectorAll('.sp-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.sp-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        _currentTab = tab.dataset.tab;
        renderTab(_currentTab);
      });
    });
  }

  function renderTab(name) {
    const c = $('spContent');
    if (!c) return;
    switch (name) {
      case 'search': renderSearch(c); break;
      case 'compare': renderCompare(c); break;
      case 'analysis': renderAnalysis(c); break;
      case 'history': renderHistory(c); break;
      default: renderSearch(c);
    }
  }

  // ===== MODAL =====
  function openModal(html, title) {
    $('spModalTitle').textContent = title || 'Details';
    $('spModalBody').innerHTML = html;
    $('spModal').classList.add('active');
  }
  function closeModal() { $('spModal').classList.remove('active'); }
  window._spCloseModal = closeModal;

  document.addEventListener('DOMContentLoaded', () => {
    const overlay = $('spModal');
    if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  });

  // ===== SEARCH TAB =====
  function renderSearch(el) {
    const tractorPrefill = _tractor ? `
      <div class="sp-prefill-banner">
        <div class="sp-prefill-icon">🚜</div>
        <div class="sp-prefill-info">
          <div class="sp-prefill-title">Your Tractor: ${esc(_tractor.company || '')} ${esc(_tractor.model || '')}</div>
          <div class="sp-prefill-sub">Auto-finding compatible parts</div>
        </div>
        <button class="sp-prefill-btn" onclick="window._spUseTractor()">Use</button>
      </div>
    ` : '';

    el.innerHTML = `
      ${tractorPrefill}

      <div class="sp-tractor-select" id="spTractorSelect">
        <div class="sp-tractor-badge">🚜 Tractor Selection</div>
        <div class="sp-company-grid" id="spCompanyGrid">
          ${COMPANIES.map(c => `
            <button class="sp-company-btn ${_selectedCompany === c ? 'selected' : ''}"
              onclick="window._spSelectCompany('${esc(c)}')">${esc(c)}</button>
          `).join('')}
        </div>
        ${_selectedCompany ? `
          <div class="sp-field">
            <label>Model (optional)</label>
            <input id="spModelInput" placeholder="e.g. 744 XT, 575 DI" value="${esc(_selectedModel)}">
          </div>
          <button class="sp-btn sp-btn-secondary sp-btn-sm" onclick="window._spClearTractor()" style="margin-top:8px;">✕ Clear Selection</button>
        ` : ''}
      </div>

      <div class="sp-search-box">
        <span class="sp-search-icon">🔍</span>
        <input class="sp-search-input" id="spSearchInput" placeholder="Search any spare part... (oil filter, clutch plate, ऑयल फिल्टर)"
          value="${esc(_searchText)}" oninput="window._spDoSearch()" onkeypress="if(event.key==='Enter')window._spDoSearch()">
        <button class="sp-search-btn" id="spSearchBtn" onclick="window._spDoSearch()" style="display:none;">🔍</button>
      </div>

      <div id="spResults">
        <div class="sp-empty">
          <div class="sp-empty-icon">📦</div>
          <div class="sp-empty-text">Search for spare parts</div>
          <div class="sp-empty-sub">Type any part name in English or Hindi to find real products with prices</div>
        </div>
      </div>
    `;

    if (_selectedCompany) {
      setTimeout(() => {
        const mi = $('spModelInput');
        if (mi) mi.addEventListener('input', (e) => { _selectedModel = e.target.value.trim(); });
      }, 50);
    }
  }

  window._spSelectCompany = function(company) {
    _selectedCompany = _selectedCompany === company ? '' : company;
    _selectedModel = '';
    renderSearch($('spContent'));
  };

  window._spUseTractor = function() {
    if (!_tractor) return;
    _selectedCompany = _tractor.company || '';
    _selectedModel = _tractor.model || '';
    renderSearch($('spContent'));
  };

  window._spClearTractor = function() {
    _selectedCompany = '';
    _selectedModel = '';
    renderSearch($('spContent'));
  };

  window._spDoSearch = function() {
    _searchText = ($('spSearchInput') || {}).value || '';
    _selectedModel = ($('spModelInput') || {}).value || _selectedModel;
    doSearch();
  };

  async function doSearch() {
    const container = $('spResults');
    if (!container) return;

    if (!_searchText.trim() && !_selectedCompany) {
      container.innerHTML = `
        <div class="sp-empty">
          <div class="sp-empty-icon">📦</div>
          <div class="sp-empty-text">Search for spare parts</div>
          <div class="sp-empty-sub">Type any part name in English or Hindi to find real products with prices</div>
        </div>
      `;
      return;
    }

    // Show loading
    container.innerHTML = `
      <div class="sp-loading">
        <div class="sp-loading-spinner"></div>
        <div class="sp-loading-text">🔍 Searching across multiple sources...</div>
        <div class="sp-loading-sub">Checking Google Shopping, Amazon India, Flipkart, IndiaMART & more</div>
      </div>
    `;

    // Call backend API
    const results = await searchParts(_searchText, _selectedCompany, _selectedModel);
    _lastResults = results;

    if (results.length === 0) {
      container.innerHTML = `
        <div class="sp-empty">
          <div class="sp-empty-icon">🔍</div>
          <div class="sp-empty-text">No verified results found</div>
          <div class="sp-empty-sub">Try different keywords or change tractor selection. Results come from real external sources — no fake data.</div>
        </div>
      `;
      return;
    }

    // Group by source
    const sourceGroups = {};
    results.forEach(r => {
      const src = r.sourceName || 'Unknown';
      if (!sourceGroups[src]) sourceGroups[src] = [];
      sourceGroups[src].push(r);
    });

    // Find best price
    const priced = results.filter(r => r.price !== null && r.price > 0);
    const bestPrice = priced.length > 0 ? priced.reduce((min, r) => (r.totalPrice || r.price) < (min.totalPrice || min.price) ? r : min) : null;

    container.innerHTML = `
      <!-- Summary -->
      <div class="sp-search-summary">
        <div class="sp-search-summary-row">
          <span class="sp-search-count">${results.length} results</span>
          <span class="sp-search-sources">${Object.keys(sourceGroups).length} source(s)</span>
          ${bestPrice ? `<span class="sp-best-price">🏆 Best: ₹${bestPrice.totalPrice || bestPrice.price}</span>` : ''}
        </div>
      </div>

      <!-- Results -->
      ${results.map((r, i) => `
        <div class="sp-part-card" onclick="window._spViewResult(${i})">
          <div class="sp-part-header">
            <div class="sp-part-name">${esc(r.productName)}</div>
            <div class="sp-part-source">${esc(r.sourceName)}</div>
          </div>
          <div class="sp-part-meta-row">
            ${r.brand ? `<span class="sp-badge sp-badge-blue">${esc(r.brand)}</span>` : ''}
            ${r.price !== null ? `<span class="sp-price">₹${r.price}</span>` : '<span class="sp-price-na">Price not available</span>'}
            ${r.totalPrice !== null && r.totalPrice !== r.price ? `<span class="sp-total-price">Total: ₹${r.totalPrice}</span>` : ''}
          </div>
          <div class="sp-part-meta-row">
            <span class="sp-availability ${r.availability === 'in_stock' ? 'sp-avail-green' : 'sp-avail-gray'}">${r.availability === 'in_stock' ? '✅ In Stock' : r.availability === 'out_of_stock' ? '❌ Out of Stock' : '⚠️ Check Source'}</span>
            ${r.rating ? `<span class="sp-rating">⭐ ${r.rating}${r.reviewCount ? ' (' + r.reviewCount + ')' : ''}</span>` : ''}
          </div>
          ${r.productUrl ? `<a href="${esc(r.productUrl)}" target="_blank" class="sp-source-link" onclick="event.stopPropagation();">🔗 View on ${esc(r.sourceName)} →</a>` : ''}
        </div>
      `).join('')}
    `;

    // Save search history
    if (_searchText && _user) saveSearchHistory(_searchText);
  }

  // ===== VIEW RESULT DETAIL =====
  window._spViewResult = function(index) {
    const r = _lastResults[index];
    if (!r) return;

    openModal(`
      <div style="margin-bottom:12px;">
        <div style="font-size:12px;color:var(--sp-text-light);">Source: ${esc(r.sourceName)} (${esc(r.sourceType)})</div>
      </div>

      <div style="margin-bottom:16px;">
        <div style="font-size:18px;font-weight:700;margin-bottom:4px;">${esc(r.productName)}</div>
        ${r.brand ? `<div style="font-size:14px;color:var(--sp-text-light);">Brand: ${esc(r.brand)}</div>` : ''}
        ${r.partNumber ? `<div style="font-size:12px;color:var(--sp-text-light);">Part #: ${esc(r.partNumber)}</div>` : ''}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        <div style="background:#f0fdf4;border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:12px;color:#166534;">Price</div>
          <div style="font-size:22px;font-weight:700;color:#15803d;">${r.price !== null ? '₹' + r.price : 'N/A'}</div>
        </div>
        <div style="background:#eff6ff;border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:12px;color:#1e40af;">Total</div>
          <div style="font-size:22px;font-weight:700;color:#2563eb;">${r.totalPrice !== null ? '₹' + r.totalPrice : 'N/A'}</div>
        </div>
      </div>

      ${r.deliveryCharge !== null ? `<div style="font-size:13px;margin-bottom:8px;">📦 Delivery: ₹${r.deliveryCharge}</div>` : ''}

      <div style="font-size:13px;margin-bottom:8px;">📍 Seller: ${esc(r.sellerName || 'Not specified')}</div>
      <div style="font-size:13px;margin-bottom:8px;">📦 Availability: ${r.availability === 'in_stock' ? '✅ In Stock' : r.availability === 'out_of_stock' ? '❌ Out of Stock' : '⚠️ Check Source'}</div>

      ${r.rating ? `<div style="font-size:13px;margin-bottom:8px;">⭐ Rating: ${r.rating}${r.reviewCount ? ' (' + r.reviewCount + ' reviews)' : ''}</div>` : ''}

      ${r.tractorCompatibility ? `<div style="font-size:13px;margin-bottom:8px;">🚜 Compatibility: ${esc(r.tractorCompatibility)}</div>` : ''}

      ${r.lastUpdated ? `<div style="font-size:11px;color:var(--sp-text-light);margin-top:8px;">Last updated: ${esc(r.lastUpdated)}</div>` : ''}

      ${r.productUrl ? `
        <a href="${esc(r.productUrl)}" target="_blank" class="sp-btn sp-btn-primary" style="display:block;text-align:center;margin-top:16px;text-decoration:none;">
          🔗 Visit Source →
        </a>
      ` : ''}

      ${!r.productUrl && r.price === null ? `
        <div style="background:#fef3c7;border-radius:10px;padding:14px;text-align:center;margin-top:16px;">
          <div style="font-size:14px;font-weight:600;color:#92400e;">ℹ️ Verified price अभी उपलब्ध नहीं है</div>
          <div style="font-size:12px;color:#a16207;margin-top:4px;">कृपया manufacturer website या local dealer से price check करें।</div>
        </div>
      ` : ''}
    `, r.productName);
  };

  // ===== COMPARE TAB =====
  function renderCompare(el) {
    if (_compareList.length === 0) {
      el.innerHTML = `
        <div class="sp-card">
          <div class="sp-card-title"><span class="sp-card-title-icon">⚖️</span> Price Comparison</div>
          <div class="sp-empty">
            <div class="sp-empty-icon">⚖️</div>
            <div class="sp-empty-text">No parts for comparison</div>
            <div class="sp-empty-sub">Search parts and use the compare feature to compare prices across sources</div>
          </div>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="sp-card">
        <div class="sp-card-title"><span class="sp-card-title-icon">⚖️</span> Price Comparison (${_compareList.length} parts)</div>
        <button class="sp-btn sp-btn-danger sp-btn-sm" onclick="window._spClearCompare()" style="margin-bottom:14px;width:auto;">✕ Clear All</button>

        ${_compareList.map(item => `
          <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--sp-border);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <div>
                <div style="font-size:16px;font-weight:700;">${esc(item.productName || item.query)}</div>
                <div style="font-size:12px;color:var(--sp-text-light);">${esc(item.source || '')}</div>
              </div>
              <button class="sp-btn sp-btn-danger sp-btn-sm" onclick="window._spRemoveCompare(${_compareList.indexOf(item)})" style="width:auto;min-height:32px;padding:6px 10px;font-size:12px;">✕</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              ${item.price !== null ? `
                <div style="background:#f0fdf4;border-radius:10px;padding:10px;text-align:center;">
                  <div style="font-size:11px;color:#166534;">Price</div>
                  <div style="font-size:18px;font-weight:700;color:#15803d;">₹${item.price}</div>
                </div>
                <div style="background:#eff6ff;border-radius:10px;padding:10px;text-align:center;">
                  <div style="font-size:11px;color:#1e40af;">Total</div>
                  <div style="font-size:18px;font-weight:700;color:#2563eb;">₹${item.totalPrice || item.price}</div>
                </div>
              ` : `
                <div style="background:#fef3c7;border-radius:10px;padding:10px;text-align:center;grid-column:span 2;">
                  <div style="font-size:13px;color:#92400e;">⚠️ Price not available</div>
                </div>
              `}
            </div>
            ${item.productUrl ? `<a href="${esc(item.productUrl)}" target="_blank" class="sp-source-link" style="margin-top:8px;display:inline-block;">🔗 Visit Source →</a>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  window._spAddCompare = function(resultIndex) {
    const r = _lastResults[resultIndex];
    if (!r) return;
    if (_compareList.some(c => c.productName === r.productName && c.sourceName === r.sourceName)) {
      toast('Already added for comparison');
      return;
    }
    _compareList.push({
      productName: r.productName,
      price: r.price,
      totalPrice: r.totalPrice,
      sourceName: r.sourceName,
      productUrl: r.productUrl,
      availability: r.availability
    });
    toast('✅ Added to compare');
  };

  window._spRemoveCompare = function(index) {
    _compareList.splice(index, 1);
    renderTab(_currentTab);
  };

  window._spClearCompare = function() {
    _compareList = [];
    renderTab(_currentTab);
  };

  // ===== ANALYSIS TAB =====
  function renderAnalysis(el) {
    const priced = _lastResults.filter(r => r.price !== null && r.price > 0);
    const sources = [...new Set(_lastResults.map(r => r.sourceName))];

    el.innerHTML = `
      <div class="sp-card">
        <div class="sp-card-title"><span class="sp-card-title-icon">📊</span> Search Analysis</div>

        <div class="sp-summary-grid" style="grid-template-columns:repeat(3,1fr);">
          <div class="sp-summary-card blue">
            <div class="sp-summary-icon">📦</div>
            <div class="sp-summary-label">Total Results</div>
            <div class="sp-summary-value">${_lastResults.length}</div>
          </div>
          <div class="sp-summary-card green">
            <div class="sp-summary-icon">💰</div>
            <div class="sp-summary-label">With Price</div>
            <div class="sp-summary-value">${priced.length}</div>
          </div>
          <div class="sp-summary-card yellow">
            <div class="sp-summary-icon">🌐</div>
            <div class="sp-summary-label">Sources</div>
            <div class="sp-summary-value">${sources.length}</div>
          </div>
        </div>
      </div>

      ${priced.length > 0 ? `
        <div class="sp-card">
          <div class="sp-card-title"><span class="sp-card-title-icon">💰</span> Price Analysis</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div style="background:#f0fdf4;border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:12px;color:#166534;">Lowest Price</div>
              <div style="font-size:22px;font-weight:700;color:#15803d;">₹${Math.min(...priced.map(r => r.totalPrice || r.price))}</div>
            </div>
            <div style="background:#fef2f2;border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:12px;color:#991b1b;">Highest Price</div>
              <div style="font-size:22px;font-weight:700;color:#dc2626;">₹${Math.max(...priced.map(r => r.totalPrice || r.price))}</div>
            </div>
            <div style="background:#eff6ff;border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:12px;color:#1e40af;">Average Price</div>
              <div style="font-size:22px;font-weight:700;color:#2563eb;">₹${Math.round(priced.reduce((sum, r) => sum + (r.totalPrice || r.price), 0) / priced.length)}</div>
            </div>
            <div style="background:#fef3c7;border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:12px;color:#92400e;">Price Difference</div>
              <div style="font-size:22px;font-weight:700;color:#d97706;">₹${Math.max(...priced.map(r => r.totalPrice || r.price)) - Math.min(...priced.map(r => r.totalPrice || r.price))}</div>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="sp-card">
        <div class="sp-card-title"><span class="sp-card-title-icon">🌐</span> Connected Sources</div>
        ${sources.length > 0 ? sources.map(s => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--sp-border);">
            <span style="font-weight:600;">${esc(s)}</span>
            <span class="sp-badge sp-badge-green">Active</span>
          </div>
        `).join('') : `
          <div style="background:#fef3c7;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-weight:600;color:#92400e;">No sources connected</div>
            <div style="font-size:13px;color:#a16207;margin-top:4px;">Add SERPAPI_KEY to backend environment to enable Google Shopping search</div>
          </div>
        `}
      </div>
    `;
  }

  // ===== HISTORY TAB =====
  function renderHistory(el) {
    const sorted = [..._searchHistory].sort((a, b) => (b.searchedAt || '').localeCompare(a.searchedAt || ''));

    el.innerHTML = `
      <div class="sp-card">
        <div class="sp-card-title"><span class="sp-card-title-icon">📋</span> Search History</div>
        <p style="font-size:13px;color:var(--sp-text-light);margin-bottom:14px;">
          ${sorted.length} recent searches (user-specific)
        </p>

        ${sorted.length === 0 ? `
          <div class="sp-empty">
            <div class="sp-empty-icon">📋</div>
            <div class="sp-empty-text">No search history</div>
            <div class="sp-empty-sub">Search for parts to build your history</div>
          </div>
        ` : sorted.map(h => `
          <div class="sp-history-item">
            <div class="sp-history-icon">🔍</div>
            <div class="sp-history-info">
              <div class="sp-history-title">${esc(h.searchText)}</div>
              <div class="sp-history-sub">
                ${h.tractorCompany ? esc(h.tractorCompany) + ' ' + esc(h.tractorModel || '') + ' • ' : ''}
                ${h.searchedAt ? new Date(h.searchedAt).toLocaleDateString('hi-IN') : ''}
              </div>
            </div>
            <button class="sp-btn sp-btn-secondary sp-btn-sm" onclick="window._spRepeatSearch('${esc(h.searchText)}','${esc(h.tractorCompany||'')}','${esc(h.tractorModel||'')}')" style="width:auto;min-height:32px;padding:6px 10px;font-size:12px;">Search →</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  window._spRepeatSearch = function(text, company, model) {
    _searchText = text;
    _selectedCompany = company;
    _selectedModel = model;
    document.querySelectorAll('.sp-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="search"]').classList.add('active');
    _currentTab = 'search';
    renderTab('search');
  };

  // ===== FIRESTORE OPERATIONS =====
  async function saveSearchHistory(text) {
    if (!_user || !F) return;
    try {
      await F.addDoc(F.collection(window.spDb, 'part_search_history'), {
        ownerUid: _user.uid,
        searchText: text,
        tractorCompany: _selectedCompany || '',
        tractorModel: _selectedModel || '',
        searchedAt: new Date().toISOString()
      });
      _searchHistory.unshift({
        searchText: text,
        tractorCompany: _selectedCompany || '',
        tractorModel: _selectedModel || '',
        searchedAt: new Date().toISOString()
      });
      if (_searchHistory.length > 50) _searchHistory = _searchHistory.slice(0, 50);
    } catch (e) {
      console.error('Search history save error:', e);
    }
  }

  async function loadAllData() {
    if (!_user || !F) return;
    const uid = _user.uid;

    try {
      const tractorDoc = await F.getDoc(F.doc(window.spDb, 'tractor_details', uid));
      _tractor = tractorDoc.exists() ? tractorDoc.data() : null;

      const histSnap = await F.getDocs(F.query(
        F.collection(window.spDb, 'part_search_history'),
        F.where('ownerUid', '==', uid)
      ));
      _searchHistory = histSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      _searchHistory.sort((a, b) => (b.searchedAt || '').localeCompare(a.searchedAt || ''));

      if (_tractor && _tractor.company) {
        _selectedCompany = _tractor.company;
        _selectedModel = _tractor.model || '';
      }
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  // ===== INIT =====
  window.initSpareParts = async function(user) {
    F = window.spModules;
    _user = user;
    await loadAllData();
    setupTabs();
    renderTab('search');
  };

})();
