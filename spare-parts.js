// ===== SPARE PARTS & PRICE ANALYSIS MODULE =====
// Chhapola Agriculture — Phase 3

(function() {
  'use strict';

  // ===== PARTS CATALOG =====
  // Comprehensive list of common tractor spare parts with compatibility
  const PARTS_CATALOG = [
    // === FILTERS ===
    { id: 'oil-filter-001', name: 'Oil Filter', normalizedName: 'oil filter', category: 'Filters', compatible: [
      { company: 'Swaraj', models: ['744 XT', '735 XT', '855 FE', '963 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI', '475 DI', 'Arjun 605'] },
      { company: 'Sonalika', models: ['Sikander 750', 'DI 750', 'DI 745'] },
      { company: 'John Deere', models: ['5310', '5050 D', '5075 E', '5105'] },
      { company: 'New Holland', models: ['3630', '4710', '5620'] },
      { company: 'Massey Ferguson', models: ['241 DI', '9500', '1035 DI'] },
      { company: 'Eicher', models: ['380', '485', '548'] },
      { company: 'Farmtrac', models: ['60', '45', '39'] }
    ]},
    { id: 'air-filter-001', name: 'Air Filter', normalizedName: 'air filter', category: 'Filters', compatible: [
      { company: 'Swaraj', models: ['744 XT', '735 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI', '475 DI'] },
      { company: 'Sonalika', models: ['Sikander 750', 'DI 750'] },
      { company: 'John Deere', models: ['5310', '5050 D', '5075 E'] },
      { company: 'New Holland', models: ['3630', '4710'] },
      { company: 'Massey Ferguson', models: ['241 DI', '9500'] },
      { company: 'Eicher', models: ['380', '485'] },
      { company: 'Farmtrac', models: ['60', '45'] }
    ]},
    { id: 'fuel-filter-001', name: 'Fuel Filter', normalizedName: 'fuel filter', category: 'Filters', compatible: [
      { company: 'Swaraj', models: ['744 XT', '735 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI', '475 DI'] },
      { company: 'Sonalika', models: ['Sikander 750', 'DI 750'] },
      { company: 'John Deere', models: ['5310', '5050 D', '5075 E'] },
      { company: 'New Holland', models: ['3630', '4710'] },
      { company: 'Massey Ferguson', models: ['241 DI', '9500'] },
      { company: 'Eicher', models: ['380', '485'] }
    ]},
    { id: 'hydraulic-filter-001', name: 'Hydraulic Filter', normalizedName: 'hydraulic filter', category: 'Filters', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE', '963 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI', 'Arjun 605'] },
      { company: 'Sonalika', models: ['Sikander 750', 'DI 750'] },
      { company: 'John Deere', models: ['5310', '5075 E'] },
      { company: 'New Holland', models: ['3630', '5620'] },
      { company: 'Massey Ferguson', models: ['241 DI', '9500'] }
    ]},
    { id: 'breather-filter-001', name: 'Breather Filter', normalizedName: 'breather filter', category: 'Filters', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'Sonalika', models: ['Sikander 750'] },
      { company: 'John Deere', models: ['5310', '5075 E'] }
    ]},

    // === BELTS ===
    { id: 'fan-belt-001', name: 'Fan Belt', normalizedName: 'fan belt', category: 'Belts', compatible: [
      { company: 'Swaraj', models: ['744 XT', '735 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI', '475 DI'] },
      { company: 'Sonalika', models: ['Sikander 750', 'DI 750'] },
      { company: 'John Deere', models: ['5310', '5050 D', '5075 E'] },
      { company: 'New Holland', models: ['3630', '4710'] },
      { company: 'Massey Ferguson', models: ['241 DI', '9500'] },
      { company: 'Eicher', models: ['380', '485'] }
    ]},
    { id: 'alternator-belt-001', name: 'Alternator Belt', normalizedName: 'alternator belt', category: 'Belts', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310', '5075 E'] },
      { company: 'Sonalika', models: ['Sikander 750'] }
    ]},
    { id: 'steering-belt-001', name: 'Steering Belt', normalizedName: 'steering belt', category: 'Belts', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', 'Arjun 605'] },
      { company: 'John Deere', models: ['5075 E'] }
    ]},

    // === CLUTCH ===
    { id: 'clutch-plate-001', name: 'Clutch Plate', normalizedName: 'clutch plate', category: 'Clutch', compatible: [
      { company: 'Swaraj', models: ['744 XT', '735 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI', '475 DI'] },
      { company: 'Sonalika', models: ['Sikander 750', 'DI 750'] },
      { company: 'John Deere', models: ['5310', '5050 D'] },
      { company: 'New Holland', models: ['3630', '4710'] },
      { company: 'Massey Ferguson', models: ['241 DI'] }
    ]},
    { id: 'clutch-bearing-001', name: 'Clutch Bearing', normalizedName: 'clutch bearing', category: 'Clutch', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'Sonalika', models: ['Sikander 750'] },
      { company: 'John Deere', models: ['5310', '5075 E'] }
    ]},
    { id: 'pressure-plate-001', name: 'Pressure Plate', normalizedName: 'pressure plate', category: 'Clutch', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310', '5075 E'] }
    ]},
    { id: 'release-bearing-001', name: 'Release Bearing', normalizedName: 'release bearing', category: 'Clutch', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310'] }
    ]},

    // === BRAKE ===
    { id: 'brake-plate-001', name: 'Brake Plate', normalizedName: 'brake plate', category: 'Brake', compatible: [
      { company: 'Swaraj', models: ['744 XT', '735 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI', '475 DI'] },
      { company: 'Sonalika', models: ['Sikander 750', 'DI 750'] },
      { company: 'John Deere', models: ['5310', '5050 D'] },
      { company: 'New Holland', models: ['3630'] }
    ]},
    { id: 'brake-lining-001', name: 'Brake Lining', normalizedName: 'brake lining', category: 'Brake', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310', '5075 E'] }
    ]},
    { id: 'brake-drum-001', name: 'Brake Drum', normalizedName: 'brake drum', category: 'Brake', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI'] }
    ]},

    // === HYDRAULICS ===
    { id: 'hydraulic-pump-001', name: 'Hydraulic Pump', normalizedName: 'hydraulic pump', category: 'Hydraulics', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE', '963 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI', 'Arjun 605'] },
      { company: 'Sonalika', models: ['Sikander 750', 'DI 750'] },
      { company: 'John Deere', models: ['5310', '5075 E'] },
      { company: 'New Holland', models: ['3630', '5620'] }
    ]},
    { id: 'hydraulic-cylinder-001', name: 'Hydraulic Cylinder', normalizedName: 'hydraulic cylinder', category: 'Hydraulics', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310'] }
    ]},
    { id: 'hydraulic-hose-001', name: 'Hydraulic Hose Pipe', normalizedName: 'hydraulic hose pipe', category: 'Hydraulics', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE', '963 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'Sonalika', models: ['Sikander 750'] },
      { company: 'John Deere', models: ['5310', '5075 E'] },
      { company: 'New Holland', models: ['3630'] }
    ]},

    // === WATER / COOLING ===
    { id: 'water-pump-001', name: 'Water Pump', normalizedName: 'water pump', category: 'Cooling', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'Sonalika', models: ['Sikander 750'] },
      { company: 'John Deere', models: ['5310', '5075 E'] },
      { company: 'New Holland', models: ['3630'] }
    ]},
    { id: 'radiator-001', name: 'Radiator', normalizedName: 'radiator', category: 'Cooling', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310', '5075 E'] }
    ]},
    { id: 'thermostat-001', name: 'Thermostat Valve', normalizedName: 'thermostat valve', category: 'Cooling', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI'] },
      { company: 'John Deere', models: ['5310'] }
    ]},

    // === ELECTRICAL ===
    { id: 'battery-001', name: 'Battery', normalizedName: 'battery', category: 'Electrical', compatible: [
      { company: 'Swaraj', models: ['744 XT', '735 XT', '855 FE', '963 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI', '475 DI', 'Arjun 605'] },
      { company: 'Sonalika', models: ['Sikander 750', 'DI 750', 'DI 745'] },
      { company: 'John Deere', models: ['5310', '5050 D', '5075 E', '5105'] },
      { company: 'New Holland', models: ['3630', '4710', '5620'] },
      { company: 'Massey Ferguson', models: ['241 DI', '9500', '1035 DI'] },
      { company: 'Eicher', models: ['380', '485', '548'] },
      { company: 'Farmtrac', models: ['60', '45', '39'] }
    ]},
    { id: 'self-motor-001', name: 'Self Motor / Starter', normalizedName: 'self motor starter', category: 'Electrical', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310', '5075 E'] }
    ]},
    { id: 'alternator-001', name: 'Alternator', normalizedName: 'alternator', category: 'Electrical', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310', '5075 E'] }
    ]},
    { id: 'glow-plug-001', name: 'Glow Plug', normalizedName: 'glow plug', category: 'Electrical', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310'] }
    ]},

    // === TYRE ===
    { id: 'front-tyre-001', name: 'Front Tyre', normalizedName: 'front tyre', category: 'Tyre', compatible: [
      { company: 'Swaraj', models: ['744 XT', '735 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI', '475 DI'] },
      { company: 'Sonalika', models: ['Sikander 750', 'DI 750'] },
      { company: 'John Deere', models: ['5310', '5050 D', '5075 E'] },
      { company: 'New Holland', models: ['3630', '4710'] },
      { company: 'Massey Ferguson', models: ['241 DI', '9500'] }
    ]},
    { id: 'rear-tyre-001', name: 'Rear Tyre', normalizedName: 'rear tyre', category: 'Tyre', compatible: [
      { company: 'Swaraj', models: ['744 XT', '735 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI', '475 DI'] },
      { company: 'Sonalika', models: ['Sikander 750', 'DI 750'] },
      { company: 'John Deere', models: ['5310', '5050 D', '5075 E'] },
      { company: 'New Holland', models: ['3630', '4710'] },
      { company: 'Massey Ferguson', models: ['241 DI', '9500'] }
    ]},
    { id: 'tyre-tube-001', name: 'Tyre Tube', normalizedName: 'tyre tube', category: 'Tyre', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310'] },
      { company: 'Eicher', models: ['380', '485'] }
    ]},

    // === ENGINE ===
    { id: 'piston-ring-001', name: 'Piston Ring Set', normalizedName: 'piston ring set', category: 'Engine', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310', '5075 E'] }
    ]},
    { id: 'gasket-set-001', name: 'Full Gasket Set', normalizedName: 'full gasket set', category: 'Engine', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310', '5075 E'] }
    ]},
    { id: 'valve-set-001', name: 'Valve Set (Inlet + Outlet)', normalizedName: 'valve set inlet outlet', category: 'Engine', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI'] },
      { company: 'John Deere', models: ['5310'] }
    ]},
    { id: 'injector-001', name: 'Fuel Injector', normalizedName: 'fuel injector', category: 'Engine', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310', '5075 E'] }
    ]},

    // === STEERING ===
    { id: 'steering-box-001', name: 'Steering Box', normalizedName: 'steering box', category: 'Steering', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310'] }
    ]},
    { id: 'steering-knuckle-001', name: 'Steering Knuckle', normalizedName: 'steering knuckle', category: 'Steering', compatible: [
      { company: 'Swaraj', models: ['744 XT'] },
      { company: 'Mahindra', models: ['575 DI'] }
    ]},

    // === MISC ===
    { id: 'headlight-001', name: 'Headlight Assembly', normalizedName: 'headlight assembly', category: 'Lights', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310', '5075 E'] },
      { company: 'Sonalika', models: ['Sikander 750'] }
    ]},
    { id: 'indicator-001', name: 'Indicator Light', normalizedName: 'indicator light', category: 'Lights', compatible: [
      { company: 'Swaraj', models: ['744 XT'] },
      { company: 'Mahindra', models: ['575 DI'] },
      { company: 'John Deere', models: ['5310'] }
    ]},
    { id: 'seat-001', name: 'Tractor Seat', normalizedName: 'tractor seat', category: 'Body', compatible: [
      { company: 'Swaraj', models: ['744 XT', '855 FE'] },
      { company: 'Mahindra', models: ['575 DI', '585 DI'] },
      { company: 'John Deere', models: ['5310', '5075 E'] }
    ]},
    { id: 'mudguard-001', name: 'Mudguard / Fender', normalizedName: 'mudguard fender', category: 'Body', compatible: [
      { company: 'Swaraj', models: ['744 XT'] },
      { company: 'Mahindra', models: ['575 DI'] },
      { company: 'John Deere', models: ['5310'] }
    ]}
  ];

  // Hindi-to-English transliteration map
  const HINDI_MAP = {
    'ऑयल': 'oil', 'फिल्टर': 'filter', 'एयर': 'air', 'फ्यूल': 'fuel',
    'हाइड्रोलिक': 'hydraulic', 'बेल्ट': 'belt', 'फैन': 'fan',
    'क्लच': 'clutch', 'प्लेट': 'plate', 'बियरिंग': 'bearing',
    'ब्रेक': 'brake', 'पंप': 'pump', 'वाटर': 'water', 'पानी': 'water',
    'बैटरी': 'battery', 'टायर': 'tyre', 'सेल्फ': 'self', 'मोटर': 'motor',
    'स्टार्टर': 'starter', 'प्रेशर': 'pressure', 'प्लेट': 'plate',
    'होज़': 'hose', 'पाइप': 'pipe', 'सिलेंडर': 'cylinder',
    'रेडिएटर': 'radiator', 'थर्मोस्टेट': 'thermostat', 'वाल्व': 'valve',
    'ग्लो': 'glow', 'प्लग': 'plug', 'अल्टरनेटर': 'alternator',
    'इंजेक्टर': 'injector', 'फ्यूल': 'fuel', 'गास्केट': 'gasket',
    'पिस्टन': 'piston', 'रिंग': 'ring', 'वाल्व': 'valve',
    'इनलेट': 'inlet', 'आउटलेट': 'outlet', 'हेडलाइट': 'headlight',
    'इंडिकेटर': 'indicator', 'सीट': 'seat', 'फेंडर': 'fender',
    'मडगार्ड': 'mudguard', 'स्टीयरिंग': 'steering', 'बॉक्स': 'box',
    'नकल': 'knuckle', 'लाइनिंग': 'lining', 'ड्रम': 'drum',
    'ब्रेथर': 'breather', 'ओईल': 'oil', 'फ़िल्टर': 'filter',
    'एयर': 'air', 'फ़्यूल': 'fuel', 'हाईड्रोलिक': 'hydraulic',
    'पम्प': 'pump', 'बैटरी': 'battery', 'टायर': 'tyre',
    'ट्यूब': 'tube', 'फ्रंट': 'front', 'रियर': 'rear',
    'फुल': 'full', 'सेट': 'set', 'इनलेट': 'inlet', 'आउटलेट': 'outlet',
    'इंडिकेटर': 'indicator', 'लाइट': 'light',
    'स्टीयरिंग': 'steering', 'रिलीज': 'release', 'प्रेशर': 'pressure',
    'ऑयल': 'oil', 'एयर': 'air', 'फ्यूल': 'fuel', 'हाइड्रोलिक': 'hydraulic',
    'फैन': 'fan', 'अल्टरनेटर': 'alternator', 'स्टीयरिंग': 'steering',
    'होज़': 'hose', 'पाइप': 'pipe', 'सिलेंडर': 'cylinder'
  };

  // Tractor companies
  const COMPANIES = [
    'Swaraj', 'Mahindra', 'Sonalika', 'John Deere', 'New Holland',
    'Farmtrac', 'Massey Ferguson', 'Eicher', 'Powertrac', 'Kubota'
  ];

  // Categories
  const CATEGORIES = ['Filters', 'Belts', 'Clutch', 'Brake', 'Hydraulics', 'Cooling', 'Electrical', 'Tyre', 'Engine', 'Steering', 'Lights', 'Body'];

  // Source definitions — architecture for future integration
  const SOURCES = [
    { id: 'chhapola', name: 'Chhapola Agriculture', type: 'platform', note: 'Future seller integration' },
    { id: 'manufacturer', name: 'Manufacturer Portal', type: 'official', note: 'Check manufacturer website directly' }
  ];

  // ===== STATE =====
  let _user = null;
  let _tractor = null; // from Phase 2 tractor_details
  let _selectedCompany = '';
  let _selectedModel = '';
  let _searchText = '';
  let _currentTab = 'search';
  let _searchHistory = [];
  let _compareList = []; // parts added for comparison
  let F = null;

  // ===== HELPERS =====
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'sp-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // ===== SEARCH ENGINE =====
  function normalizeText(text) {
    return (text || '').toLowerCase().trim()
      .replace(/[()[\]{}]/g, '')
      .replace(/[\/\\]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  function hindiToEnglish(text) {
    let result = text;
    for (const [hindi, english] of Object.entries(HINDI_MAP)) {
      result = result.split(hindi).join(english);
    }
    return result;
  }

  function searchParts(query, company, model) {
    const q = normalizeText(hindiToEnglish(query));
    const words = q.split(/\s+/).filter(w => w.length > 1);
    if (words.length === 0 && !company) return [];

    let results = PARTS_CATALOG;

    // Filter by company/model compatibility if selected
    if (company) {
      results = results.filter(p => {
        const compat = p.compatible || [];
        const companyMatch = compat.some(c => c.company === company);
        if (!companyMatch) return false;
        if (model) {
          return compat.some(c => c.company === company && c.models.includes(model));
        }
        return true;
      });
    }

    // Fuzzy search
    if (words.length > 0) {
      results = results.map(part => {
        const pNorm = normalizeText(hindiToEnglish(part.name + ' ' + part.normalizedName + ' ' + part.category));
        let score = 0;
        for (const w of words) {
          if (pNorm.includes(w)) score += 10;
          if (part.normalizedName.includes(w)) score += 15;
          if (part.name.toLowerCase().includes(w)) score += 20;
          if (part.category.toLowerCase().includes(w)) score += 5;
          // Partial match
          for (const pn of pNorm.split(' ')) {
            if (pn.startsWith(w) || w.startsWith(pn)) score += 3;
          }
        }
        return { ...part, score };
      }).filter(p => p.score > 0)
        .sort((a, b) => b.score - a.score);
    }

    return results;
  }

  // ===== SOURCE PRICE DATA =====
  // Since we don't have live API access, we show "Price not available" honestly
  function getSourcePrices(part, company, model) {
    // Future: query external APIs here
    // For now, return source metadata with no fake prices
    return SOURCES.map(source => ({
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.type,
      price: null,
      deliveryCharge: null,
      availability: 'unknown',
      productUrl: null,
      note: source.note,
      lastUpdated: null,
      verified: false
    }));
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
      case 'catalog': renderCatalog(c); break;
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
    // Pre-fill from Phase 2 tractor
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

      <!-- Tractor Selection -->
      <div class="sp-tractor-select" id="spTractorSelect">
        <div class="sp-tractor-badge">🚜 Tractor Selection</div>
        <div class="sp-company-grid" id="spCompanyGrid">
          ${COMPANIES.map(c => `
            <button class="sp-company-btn ${_selectedCompany === c ? 'selected' : ''}"
              onclick="window._spSelectCompany('${c}')">${esc(c)}</button>
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

      <!-- Search Box -->
      <div class="sp-search-box">
        <span class="sp-search-icon">🔍</span>
        <input class="sp-search-input" id="spSearchInput" placeholder="Search spare part... (oil filter, clutch plate, ऑयल फिल्टर)"
          value="${esc(_searchText)}" oninput="window._spDoSearch()" onkeypress="if(event.key==='Enter')window._spDoSearch()">
      </div>

      <!-- Quick Search Chips -->
      <div class="sp-chips">
        ${['Oil Filter', 'Air Filter', 'Fan Belt', 'Clutch Plate', 'Brake Plate', 'Hydraulic Pump', 'Battery', 'Tyre'].map(p => `
          <button class="sp-chip" onclick="window._spQuickSearch('${p}')">${esc(p)}</button>
        `).join('')}
      </div>

      <!-- Results -->
      <div id="spResults"></div>
    `;

    // Restore model input listener
    if (_selectedCompany) {
      setTimeout(() => {
        const mi = $('spModelInput');
        if (mi) mi.addEventListener('input', (e) => { _selectedModel = e.target.value.trim(); });
      }, 50);
    }

    // Auto-search if we have text
    if (_searchText || _selectedCompany) {
      doSearch();
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

  window._spQuickSearch = function(term) {
    _searchText = term;
    const si = $('spSearchInput');
    if (si) si.value = term;
    doSearch();
  };

  window._spDoSearch = function() {
    _searchText = ($('spSearchInput') || {}).value || '';
    _selectedModel = ($('spModelInput') || {}).value || _selectedModel;
    doSearch();
  };

  function doSearch() {
    const results = searchParts(_searchText, _selectedCompany, _selectedModel);
    const container = $('spResults');
    if (!container) return;

    if (results.length === 0 && (_searchText || _selectedCompany)) {
      container.innerHTML = `
        <div class="sp-empty">
          <div class="sp-empty-icon">🔍</div>
          <div class="sp-empty-text">No parts found</div>
          <div class="sp-empty-sub">Try different search terms or change tractor selection</div>
        </div>
      `;
      return;
    }

    if (results.length === 0) {
      container.innerHTML = `
        <div class="sp-empty">
          <div class="sp-empty-icon">📦</div>
          <div class="sp-empty-text">Search for spare parts</div>
          <div class="sp-empty-sub">Type part name in English or Hindi, or select a category below</div>
        </div>
      `;
      return;
    }

    container.innerHTML = results.map(part => {
      const compatForTractor = _selectedCompany
        ? (part.compatible || []).filter(c => c.company === _selectedCompany)
        : [];
      const compatTags = compatForTractor.length > 0
        ? compatForTractor.flatMap(c => c.models.map(m => `${c.company} ${m}`))
        : (part.compatible || []).slice(0, 3).flatMap(c => c.models.slice(0, 2).map(m => `${c.company} ${m}`));

      return `
        <div class="sp-part-card" onclick="window._spViewPart('${esc(part.id)}')">
          <div class="sp-part-header">
            <div class="sp-part-name">${esc(part.name)}</div>
            <div class="sp-part-category">${esc(part.category)}</div>
          </div>
          <div class="sp-part-meta">${compatTags.length} tractor models compatible</div>
          <div class="sp-part-compat">
            ${compatTags.slice(0, 5).map(t => `<span class="sp-part-compat-tag">${esc(t)}</span>`).join('')}
            ${compatTags.length > 5 ? `<span class="sp-part-compat-tag">+${compatTags.length - 5} more</span>` : ''}
          </div>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="sp-btn sp-btn-secondary sp-btn-sm" onclick="event.stopPropagation();window._spAddCompare('${esc(part.id)}')" style="flex:1;">⚖️ Compare</button>
            <button class="sp-btn sp-btn-primary sp-btn-sm" onclick="event.stopPropagation();window._spViewPart('${esc(part.id)}')" style="flex:1;">View Details →</button>
          </div>
        </div>
      `;
    }).join('');

    // Save search history
    if (_searchText && _user) saveSearchHistory(_searchText);
  }

  // ===== CATALOG TAB =====
  function renderCatalog(el) {
    const grouped = {};
    CATEGORIES.forEach(cat => {
      const parts = PARTS_CATALOG.filter(p => p.category === cat);
      if (parts.length > 0) grouped[cat] = parts;
    });

    el.innerHTML = `
      <div class="sp-card">
        <div class="sp-card-title"><span class="sp-card-title-icon">📦</span> Parts Catalog</div>
        <p style="font-size:13px;color:var(--sp-text-light);margin-bottom:14px;">
          ${PARTS_CATALOG.length} spare parts in ${Object.keys(grouped).length} categories
        </p>

        ${Object.entries(grouped).map(([cat, parts]) => `
          <div style="margin-bottom:18px;">
            <div style="font-size:14px;font-weight:700;color:var(--sp-primary);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
              <span>${getCategoryIcon(cat)}</span> ${esc(cat)}
              <span style="font-size:12px;font-weight:400;color:var(--sp-text-light);">(${parts.length})</span>
            </div>
            ${parts.map(part => `
              <div class="sp-part-card" onclick="window._spViewPart('${esc(part.id)}')" style="margin-bottom:8px;">
                <div class="sp-part-header">
                  <div class="sp-part-name" style="font-size:14px;">${esc(part.name)}</div>
                  <button class="sp-btn sp-btn-secondary sp-btn-sm" onclick="event.stopPropagation();window._spAddCompare('${esc(part.id)}')" style="width:auto;min-height:32px;padding:6px 10px;font-size:12px;">⚖️</button>
                </div>
                <div class="sp-part-meta">${(part.compatible || []).length} tractors • ${(part.compatible || []).map(c => c.company).filter((v,i,a) => a.indexOf(v)===i).join(', ')}</div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }

  function getCategoryIcon(cat) {
    const icons = {
      'Filters': '🛢️', 'Belts': '🔄', 'Clutch': '⚙️', 'Brake': '🛑',
      'Hydraulics': '💧', 'Cooling': '🌡️', 'Electrical': '⚡', 'Tyre': '🛞',
      'Engine': '🔧', 'Steering': '🎯', 'Lights': '💡', 'Body': '🏗️'
    };
    return icons[cat] || '📦';
  }

  // ===== COMPARE TAB =====
  function renderCompare(el) {
    if (_compareList.length === 0) {
      el.innerHTML = `
        <div class="sp-card">
          <div class="sp-card-title"><span class="sp-card-title-icon">⚖️</span> Price Comparison</div>
          <div class="sp-empty">
            <div class="sp-empty-icon">⚖️</div>
            <div class="sp-empty-text">No parts added for comparison</div>
            <div class="sp-empty-sub">Search parts and click ⚖️ Compare to add them here</div>
          </div>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="sp-card">
        <div class="sp-card-title"><span class="sp-card-title-icon">⚖️</span> Price Comparison (${_compareList.length} parts)</div>
        <button class="sp-btn sp-btn-danger sp-btn-sm" onclick="window._spClearCompare()" style="margin-bottom:14px;width:auto;">✕ Clear All</button>

        ${_compareList.map(partId => {
          const part = PARTS_CATALOG.find(p => p.id === partId);
          if (!part) return '';
          const prices = getSourcePrices(part, _selectedCompany, _selectedModel);
          const hasPrice = prices.some(p => p.price !== null);

          return `
            <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--sp-border);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <div>
                  <div style="font-size:16px;font-weight:700;">${esc(part.name)}</div>
                  <div style="font-size:12px;color:var(--sp-text-light);">${esc(part.category)}</div>
                </div>
                <button class="sp-btn sp-btn-danger sp-btn-sm" onclick="window._spRemoveCompare('${esc(part.id)}')" style="width:auto;min-height:32px;padding:6px 10px;font-size:12px;">✕</button>
              </div>

              ${prices.map(source => `
                <div class="sp-source-card ${!hasPrice ? '' : ''}">
                  <div class="sp-source-header">
                    <div class="sp-source-name">${esc(source.sourceName)}</div>
                    <span class="sp-badge sp-badge-gray">${esc(source.sourceType)}</span>
                  </div>
                  ${source.price !== null ? `
                    <div class="sp-price-row"><span class="sp-price-label">Product Price</span><span class="sp-price-value">₹${source.price}</span></div>
                    <div class="sp-price-row"><span class="sp-price-label">Delivery</span><span class="sp-price-value">${source.deliveryCharge !== null ? '₹' + source.deliveryCharge : 'Not available'}</span></div>
                    <div class="sp-price-total">Total: ₹${source.price + (source.deliveryCharge || 0)}</div>
                  ` : `
                    <div class="sp-price-na">⚠️ Price not available</div>
                    <div style="font-size:12px;color:var(--sp-text-light);margin-top:4px;">${esc(source.note || 'Check source directly')}</div>
                  `}
                  ${source.productUrl ? `<a href="${esc(source.productUrl)}" target="_blank" class="sp-source-link">🔗 Visit Source →</a>` : ''}
                </div>
              `).join('')}

              ${!hasPrice ? `
                <div style="background:#fef3c7;border-radius:10px;padding:12px;text-align:center;margin-top:8px;">
                  <div style="font-size:14px;font-weight:600;color:#92400e;">ℹ️ Verified price अभी उपलब्ध नहीं है</div>
                  <div style="font-size:12px;color:#a16207;margin-top:4px;">Check manufacturer website or local dealer for current pricing</div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  window._spAddCompare = function(partId) {
    if (_compareList.includes(partId)) {
      toast('Already added for comparison');
      return;
    }
    _compareList.push(partId);
    toast('✅ Added to compare');
  };

  window._spRemoveCompare = function(partId) {
    _compareList = _compareList.filter(id => id !== partId);
    renderTab(_currentTab);
  };

  window._spClearCompare = function() {
    _compareList = [];
    renderTab(_currentTab);
  };

  // ===== ANALYSIS TAB =====
  function renderAnalysis(el) {
    // Analyze catalog
    const catCounts = {};
    CATEGORIES.forEach(cat => {
      const parts = PARTS_CATALOG.filter(p => p.category === cat);
      if (parts.length > 0) catCounts[cat] = parts.length;
    });

    const companyCounts = {};
    PARTS_CATALOG.forEach(part => {
      (part.compatible || []).forEach(c => {
        companyCounts[c.company] = (companyCounts[c.company] || 0) + 1;
      });
    });

    el.innerHTML = `
      <div class="sp-card">
        <div class="sp-card-title"><span class="sp-card-title-icon">📊</span> Catalog Analysis</div>

        <div class="sp-summary-grid" style="grid-template-columns:repeat(3,1fr);">
          <div class="sp-summary-card blue">
            <div class="sp-summary-icon">📦</div>
            <div class="sp-summary-label">Total Parts</div>
            <div class="sp-summary-value">${PARTS_CATALOG.length}</div>
          </div>
          <div class="sp-summary-card green">
            <div class="sp-summary-icon">🏷️</div>
            <div class="sp-summary-label">Categories</div>
            <div class="sp-summary-value">${Object.keys(catCounts).length}</div>
          </div>
          <div class="sp-summary-card yellow">
            <div class="sp-summary-icon">🚜</div>
            <div class="sp-summary-label">Brands</div>
            <div class="sp-summary-value">${Object.keys(companyCounts).length}</div>
          </div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="sp-card">
        <div class="sp-card-title"><span class="sp-card-title-icon">🏷️</span> Parts by Category</div>
        ${Object.entries(catCounts).map(([cat, count]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--sp-border);">
            <span style="font-weight:600;display:flex;align-items:center;gap:8px;">${getCategoryIcon(cat)} ${esc(cat)}</span>
            <span class="sp-badge sp-badge-blue">${count} parts</span>
          </div>
        `).join('')}
      </div>

      <!-- Brand Coverage -->
      <div class="sp-card">
        <div class="sp-card-title"><span class="sp-card-title-icon">🚜</span> Parts Coverage by Brand</div>
        ${Object.entries(companyCounts).sort((a,b) => b[1] - a[1]).map(([brand, count]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--sp-border);">
            <span style="font-weight:600;">${esc(brand)}</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:80px;height:8px;background:#f3f4f6;border-radius:4px;overflow:hidden;">
                <div style="width:${Math.round(count/PARTS_CATALOG.length*100)}%;height:100%;background:var(--sp-primary);border-radius:4px;"></div>
              </div>
              <span class="sp-badge sp-badge-green">${count}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Price Sources Status -->
      <div class="sp-card">
        <div class="sp-card-title"><span class="sp-card-title-icon">💰</span> Price Source Status</div>
        <div style="background:#fef3c7;border-radius:10px;padding:14px;margin-bottom:12px;">
          <div style="font-weight:600;color:#92400e;">ℹ️ Live Price Integration</div>
          <div style="font-size:13px;color:#a16207;margin-top:6px;">
            External price sources are not yet connected. Part information is available from the catalog, but verified prices will require API integration with parts suppliers and manufacturer portals.
          </div>
        </div>
        ${SOURCES.map(s => `
          <div class="sp-source-card">
            <div class="sp-source-header">
              <div class="sp-source-name">${esc(s.name)}</div>
              <span class="sp-badge sp-badge-yellow">Not Connected</span>
            </div>
            <div style="font-size:13px;color:var(--sp-text-light);margin-top:4px;">${esc(s.note)}</div>
          </div>
        `).join('')}
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

  // ===== PART DETAIL VIEW =====
  window._spViewPart = function(partId) {
    const part = PARTS_CATALOG.find(p => p.id === partId);
    if (!part) return;

    const prices = getSourcePrices(part, _selectedCompany, _selectedModel);
    const hasPrice = prices.some(p => p.price !== null);

    // Compatibility for selected tractor
    let compatDisplay = '';
    if (_selectedCompany) {
      const compat = (part.compatible || []).filter(c => c.company === _selectedCompany);
      if (compat.length > 0) {
        compatDisplay = compat.flatMap(c => c.models.map(m => `${c.company} ${m}`));
      }
    }
    if (compatDisplay.length === 0) {
      compatDisplay = (part.compatible || []).flatMap(c => c.models.map(m => `${c.company} ${m}`));
    }

    openModal(`
      <!-- Part Info -->
      <div style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span class="sp-badge sp-badge-blue">${esc(part.category)}</span>
          <button class="sp-btn sp-btn-secondary sp-btn-sm" onclick="window._spAddCompare('${esc(part.id)}');window._spCloseModal();" style="width:auto;min-height:32px;">⚖️ Add to Compare</button>
        </div>
        <div style="font-size:12px;color:var(--sp-text-light);margin-top:8px;">
          Part ID: ${esc(part.id)}
        </div>
      </div>

      <!-- Compatible Tractors -->
      <div style="margin-bottom:16px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;">🚜 Compatible Tractors</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${compatDisplay.slice(0, 12).map(t => `<span class="sp-badge sp-badge-green">${esc(t)}</span>`).join('')}
          ${compatDisplay.length > 12 ? `<span class="sp-badge sp-badge-gray">+${compatDisplay.length - 12} more</span>` : ''}
        </div>
      </div>

      <!-- Price Sources -->
      <div style="margin-bottom:16px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;">💰 Price Sources</div>
        ${prices.map(source => `
          <div class="sp-source-card ${!hasPrice ? '' : ''}">
            <div class="sp-source-header">
              <div class="sp-source-name">${esc(source.sourceName)}</div>
              <span class="sp-badge sp-badge-gray">${esc(source.sourceType)}</span>
            </div>
            ${source.price !== null ? `
              <div class="sp-price-row"><span class="sp-price-label">Product Price</span><span class="sp-price-value">₹${source.price}</span></div>
              <div class="sp-price-row"><span class="sp-price-label">Delivery</span><span class="sp-price-value">${source.deliveryCharge !== null ? '₹' + source.deliveryCharge : 'Not available'}</span></div>
              <div class="sp-price-total">Total: ₹${source.price + (source.deliveryCharge || 0)}</div>
              ${source.lastUpdated ? `<div style="font-size:11px;color:var(--sp-text-light);margin-top:4px;">Last updated: ${esc(source.lastUpdated)}</div>` : ''}
            ` : `
              <div class="sp-price-na">⚠️ Price not available</div>
              <div style="font-size:12px;color:var(--sp-text-light);margin-top:4px;">${esc(source.note || 'Check source directly for pricing')}</div>
            `}
            ${source.productUrl ? `<a href="${esc(source.productUrl)}" target="_blank" class="sp-source-link">🔗 Visit Source →</a>` : ''}
          </div>
        `).join('')}
      </div>

      ${!hasPrice ? `
        <div style="background:#fef3c7;border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:14px;font-weight:600;color:#92400e;">ℹ️ Verified price अभी उपलब्ध नहीं है</div>
          <div style="font-size:12px;color:#a16207;margin-top:4px;">कृपया manufacturer website या local dealer से price check करें।</div>
        </div>
      ` : ''}
    `, part.name);
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
      // Keep local cache updated
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
      // Load Phase 2 tractor details (read-only integration)
      const tractorDoc = await F.getDoc(F.doc(window.spDb, 'tractor_details', uid));
      _tractor = tractorDoc.exists() ? tractorDoc.data() : null;

      // Load search history
      const histSnap = await F.getDocs(F.query(
        F.collection(window.spDb, 'part_search_history'),
        F.where('ownerUid', '==', uid)
      ));
      _searchHistory = histSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      _searchHistory.sort((a, b) => (b.searchedAt || '').localeCompare(a.searchedAt || ''));

      // Pre-fill tractor selection
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
