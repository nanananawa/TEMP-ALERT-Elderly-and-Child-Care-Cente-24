// ElderCare 24 - Elderly Care Center Web Application Logic
// ระบบศูนย์ดูแลผู้สูงอายุแบบแบ่งห้องพัก (Elderly Care Center / Nursing Home Dashboard)

const LOCAL_STORAGE_KEY = 'eldercare_center_state_v3';
const DEFAULT_FIREBASE_URL = 'https://temp-alert-elderly-and-c-4b008-default-rtdb.asia-southeast1.firebasedatabase.app';

const TURN_POSITIONS = [
  'นอนหงาย',
  'นอนตะแคงขวา 30°',
  'นอนหงาย',
  'นอนตะแคงซ้าย 30°',
  'ยกหัวสูง 30° (Semi-Fowler)'
];

// Initial mock rooms for Senior Living Center
const INITIAL_ROOMS = [
  {
    id: 'r101',
    roomNo: 'ห้อง 101',
    name: 'คุณยายสมศรี ใจดี',
    age: '76 ปี',
    hn: 'HN-00482',
    weight: 52.0,
    avatar: '👵',
    careLevel: 'bedridden', // 'bedridden' | 'semi' | 'self'
    condition: 'ความดันโลหิตสูง, ผู้ป่วยติดเตียง',
    deviceId: 'elderly1',
    battery: 98,
    temp: 36.8,
    vitals: { bpSys: 122, bpDia: 78, pulse: 74, spo2: 98, glucose: 110, lastUpdated: new Date().toISOString() },
    turnSchedule: { currentPosIndex: 1, nextTurnDue: Date.now() + 75 * 60 * 1000 }, // เหลือ 1 ชม. 15 นาที
    hydration: { todayMl: 1250, goalMl: 2000 },
    medications: [
      { id: 'm1_1', name: 'Amlodipine 5mg (ลดความดัน)', meal: 'morning', desc: '1 เม็ด หลังอาหารเช้า', takenToday: true, timeTaken: '08:15' },
      { id: 'm1_2', name: 'Metformin 500mg (เบาหวาน)', meal: 'morning', desc: '1 เม็ด พร้อมอาหารเช้า', takenToday: true, timeTaken: '08:15' },
      { id: 'm1_3', name: 'วิตามินบีรวม / บำรุงปลายประสาท', meal: 'noon', desc: '1 เม็ด หลังอาหารกลางวัน', takenToday: false },
      { id: 'm1_4', name: 'Atorvastatin 20mg (ลดไขมัน)', meal: 'bedtime', desc: '1 เม็ด ก่อนนอน', takenToday: false }
    ],
    history: [],
    logs: []
  },
  {
    id: 'r102',
    roomNo: 'ห้อง 102',
    name: 'คุณตาสมศักดิ์ วงศ์สว่าง',
    age: '82 ปี',
    hn: 'HN-00511',
    weight: 64.0,
    avatar: '👴',
    careLevel: 'semi',
    condition: 'เบาหวาน, มีไข้เฝ้าระวังติดเชื้อ Sepsis',
    deviceId: 'elderly2',
    battery: 91,
    temp: 37.9, // ⚠️ ไข้สูงเฝ้าระวัง
    vitals: { bpSys: 142, bpDia: 90, pulse: 88, spo2: 94, glucose: 165, lastUpdated: new Date().toISOString() },
    turnSchedule: { currentPosIndex: 0, nextTurnDue: Date.now() + 100 * 60 * 1000 },
    hydration: { todayMl: 900, goalMl: 2000 },
    medications: [
      { id: 'm2_1', name: 'Metformin 850mg', meal: 'morning', desc: '1 เม็ด เช้า', takenToday: true, timeTaken: '08:30' },
      { id: 'm2_2', name: 'ยาปฏิชีวนะฆ่าเชื้อ (Amoxicillin)', meal: 'noon', desc: '1 เม็ด กลางวัน', takenToday: false },
      { id: 'm2_3', name: 'Paracetamol 500mg', meal: 'noon', desc: '1 เม็ด ลดไข้', takenToday: false }
    ],
    history: [],
    logs: []
  },
  {
    id: 'r103',
    roomNo: 'ห้อง 103',
    name: 'คุณยายประนอม ศรีสุข',
    age: '79 ปี',
    hn: 'HN-00389',
    weight: 48.0,
    avatar: '👵',
    careLevel: 'bedridden',
    condition: 'อัมพฤกษ์ซีกขวา, แผลกดทับระยะแรก',
    deviceId: 'elderly3',
    battery: 85,
    temp: 36.6,
    vitals: { bpSys: 118, bpDia: 75, pulse: 70, spo2: 99, glucose: 95, lastUpdated: new Date().toISOString() },
    turnSchedule: { currentPosIndex: 2, nextTurnDue: Date.now() - 5 * 60 * 1000 }, // 🔄 ถึงเวลาพลิกตัวแล้ว!
    hydration: { todayMl: 1400, goalMl: 1800 },
    medications: [
      { id: 'm3_1', name: 'Aspirin 81mg', meal: 'morning', desc: '1 เม็ด หลังอาหารเช้า', takenToday: true, timeTaken: '08:00' },
      { id: 'm3_2', name: 'ยาคลายกล้ามเนื้อ', meal: 'bedtime', desc: '1 เม็ด ก่อนนอน', takenToday: false }
    ],
    history: [],
    logs: []
  },
  {
    id: 'r104',
    roomNo: 'ห้อง 104',
    name: 'คุณตาทองดี สว่างแดน',
    age: '85 ปี',
    hn: 'HN-00620',
    weight: 50.0,
    avatar: '👴',
    careLevel: 'bedridden',
    condition: 'ภาวะสมองเสื่อม, ตัวเย็น Hypothermia',
    deviceId: 'elderly4',
    battery: 94,
    temp: 35.3, // 🚨 ตัวเย็นวิกฤต!
    vitals: { bpSys: 105, bpDia: 68, pulse: 62, spo2: 96, glucose: 88, lastUpdated: new Date().toISOString() },
    turnSchedule: { currentPosIndex: 3, nextTurnDue: Date.now() + 45 * 60 * 1000 },
    hydration: { todayMl: 800, goalMl: 1800 },
    medications: [
      { id: 'm4_1', name: 'Donepezil 5mg', meal: 'bedtime', desc: '1 เม็ด ก่อนนอน', takenToday: false }
    ],
    history: [],
    logs: []
  },
  {
    id: 'r105',
    roomNo: 'ห้อง 105',
    name: 'คุณยายมาลี วงศ์พาณิชย์',
    age: '73 ปี',
    hn: 'HN-00445',
    weight: 58.0,
    avatar: '👵',
    careLevel: 'self',
    condition: 'ไขมันในเลือด, ช่วยเหลือตัวเองได้ดี',
    deviceId: 'elderly5',
    battery: 99,
    temp: 36.7,
    vitals: { bpSys: 128, bpDia: 82, pulse: 76, spo2: 98, glucose: 105, lastUpdated: new Date().toISOString() },
    turnSchedule: { currentPosIndex: 0, nextTurnDue: Date.now() + 90 * 60 * 1000 },
    hydration: { todayMl: 1750, goalMl: 2000 },
    medications: [
      { id: 'm5_1', name: 'Simvastatin 20mg', meal: 'bedtime', desc: '1 เม็ด ก่อนนอน', takenToday: false }
    ],
    history: [],
    logs: []
  },
  {
    id: 'r106',
    roomNo: 'ห้อง 106',
    name: 'คุณตาสมชาย ภักดีชน',
    age: '80 ปี',
    hn: 'HN-00599',
    weight: 62.0,
    avatar: '👴',
    careLevel: 'semi',
    condition: 'พาร์กินสัน, กึ่งติดเตียง',
    deviceId: 'elderly6',
    battery: 89,
    temp: 36.9,
    vitals: { bpSys: 120, bpDia: 80, pulse: 72, spo2: 97, glucose: 112, lastUpdated: new Date().toISOString() },
    turnSchedule: { currentPosIndex: 1, nextTurnDue: Date.now() + 60 * 60 * 1000 },
    hydration: { todayMl: 1300, goalMl: 2000 },
    medications: [
      { id: 'm6_1', name: 'Madopar 125mg', meal: 'morning', desc: '1 เม็ด เช้า', takenToday: true, timeTaken: '08:00' },
      { id: 'm6_2', name: 'Madopar 125mg', meal: 'noon', desc: '1 เม็ด กลางวัน', takenToday: false }
    ],
    history: [],
    logs: []
  }
];

let state = {
  selectedRoomId: 'r101',
  roomFilter: 'all', // 'all', 'alert', 'turn', 'med', 'bedridden', 'normal', 'critical'
  searchQuery: '',
  medSearchQuery: '',
  logSearchQuery: '',
  rooms: JSON.parse(JSON.stringify(INITIAL_ROOMS)),
  emergencyContact: {
    phone: '1669',
    title: 'สายด่วนการแพทย์ฉุกเฉิน 1669'
  },
  mode: 'firebase', // 'firebase' หรือ 'demo'
  firebaseUrl: DEFAULT_FIREBASE_URL,
  soundEnabled: true,
  sirenEnabled: true,
  wakeLockActive: false,
  centerLogs: []
};

let modalRoomChartInstance = null;
let firebaseEventSource = null;
let timerTickInterval = null;
let audioCtx = null;
let wakeLockSentinel = null;
let deferredInstallPrompt = null;
let alertDismissed = false;

// ==========================================
// Initialization & Lifecycle
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initHistorySeeds();
  initPwa();
  updateUI();
  setupAudioUnlock();
  checkAudioStatus();

  if (state.mode === 'firebase') {
    connectFirebase();
  } else {
    enableDemoMode();
  }

  // 1-second interval for timers and alarm check
  timerTickInterval = setInterval(() => {
    updateAllTurnTimers();
    checkCentralAlarms();
  }, 1000);
});

// Load state from localStorage
function loadState() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.rooms) && parsed.rooms.length > 0) state.rooms = parsed.rooms;
      if (parsed.selectedRoomId) state.selectedRoomId = parsed.selectedRoomId;
      if (parsed.firebaseUrl && !parsed.firebaseUrl.includes('babyteam-parent-default-rtdb') && !parsed.firebaseUrl.includes('babytemp-9beab')) {
        state.firebaseUrl = parsed.firebaseUrl;
      } else {
        state.firebaseUrl = DEFAULT_FIREBASE_URL;
      }
      if (typeof parsed.soundEnabled !== 'undefined') state.soundEnabled = parsed.soundEnabled;
      if (typeof parsed.sirenEnabled !== 'undefined') state.sirenEnabled = parsed.sirenEnabled;
      if (parsed.emergencyContact) state.emergencyContact = { ...state.emergencyContact, ...parsed.emergencyContact };
      if (Array.isArray(parsed.centerLogs)) state.centerLogs = parsed.centerLogs;
    }
  } catch (e) {
    console.warn('Could not load state:', e);
  }
}

// Save state to localStorage
function saveState() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save state:', e);
  }
}

// Seed historical data if empty
function initHistorySeeds() {
  const now = Date.now();
  state.rooms.forEach(r => {
    if (!r.history || r.history.length === 0) {
      r.history = [];
      for (let i = 12; i >= 0; i--) {
        const t = new Date(now - i * 30 * 60 * 1000).toISOString();
        const variance = (Math.sin(i / 2) * 0.3) + (Math.random() * 0.1 - 0.05);
        r.history.push({
          time: t,
          temp: parseFloat((r.temp + variance).toFixed(1))
        });
      }
    }
    if (!r.logs) r.logs = [];
  });
}

// ==========================================
// UI Update Master Function
// ==========================================
function updateUI() {
  const badge = document.getElementById('headerCenterRoomsBadge');
  if (badge) badge.textContent = `${state.rooms.length} ห้องพัก`;

  renderCenterStatistics();
  renderRoomsGrid();
  renderCenterMedsList();
  populateReportRoomSelect();
  renderCenterLogs();
  updateDoctorReport();
}

// ==========================================
// Search Handlers (พิมพ์ค้นหา)
// ==========================================
function handleRoomSearch(query) {
  state.searchQuery = (query || '').trim().toLowerCase();
  const clearBtn = document.getElementById('btnClearSearch');
  if (clearBtn) {
    clearBtn.style.display = state.searchQuery.length > 0 ? 'flex' : 'none';
  }
  renderRoomsGrid();
}

function clearRoomSearch() {
  const input = document.getElementById('roomSearchInput');
  if (input) {
    input.value = '';
    input.focus();
  }
  handleRoomSearch('');
}

function handleMedSearch(query) {
  state.medSearchQuery = (query || '').trim().toLowerCase();
  renderCenterMedsList();
}

function handleLogSearch(query) {
  state.logSearchQuery = (query || '').trim().toLowerCase();
  renderCenterLogs();
}

// ==========================================
// Statistics & Filter Pills
// ==========================================
function renderCenterStatistics() {
  const total = state.rooms.length;
  let normal = 0;
  let warning = 0;
  let critical = 0;
  let turnDue = 0;
  let medsDue = 0;
  let bedridden = 0;

  state.rooms.forEach(r => {
    if (r.temp < 35.5 || r.temp >= 38.0 || (r.vitals && r.vitals.spo2 < 95)) {
      critical++;
    } else if (r.temp >= 37.3 || (r.vitals && r.vitals.bpSys >= 140)) {
      warning++;
    } else {
      normal++;
    }

    if (r.turnSchedule && r.turnSchedule.nextTurnDue <= Date.now()) {
      turnDue++;
    }

    const untakenMeds = (r.medications || []).filter(m => !m.takenToday);
    if (untakenMeds.length > 0) {
      medsDue++;
    }

    if (r.careLevel === 'bedridden') {
      bedridden++;
    }
  });

  document.getElementById('statTotalRooms').textContent = total;
  document.getElementById('statNormalRooms').textContent = normal;
  document.getElementById('statWarningRooms').textContent = warning;
  document.getElementById('statCriticalRooms').textContent = critical;
  document.getElementById('statTurnDueRooms').textContent = turnDue;

  document.getElementById('countAll').textContent = total;
  document.getElementById('countAlert').textContent = warning + critical;
  document.getElementById('countTurn').textContent = turnDue;
  document.getElementById('countMed').textContent = medsDue;
  document.getElementById('countBedridden').textContent = bedridden;
}

function setRoomFilter(filter) {
  state.roomFilter = filter;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`filter-${filter}`);
  if (target) target.classList.add('active');
  renderRoomsGrid();
}

function filterRoomsMedsDue() {
  setRoomFilter('med');
  switchTab('home');
}

// ==========================================
// Render Rooms Grid (ผังห้องพักศูนย์ดูแล)
// ==========================================
function renderRoomsGrid() {
  const container = document.getElementById('elderlyRoomsGrid');
  if (!container) return;

  const filter = state.roomFilter;
  const q = state.searchQuery;

  const filtered = state.rooms.filter(r => {
    // 1. Category Filter
    let matchFilter = true;
    if (filter === 'all') matchFilter = true;
    else if (filter === 'normal') matchFilter = r.temp >= 35.5 && r.temp <= 37.2 && (!r.vitals || r.vitals.spo2 >= 95);
    else if (filter === 'alert') matchFilter = r.temp >= 37.3 || r.temp < 35.5 || (r.vitals && (r.vitals.spo2 < 95 || r.vitals.bpSys >= 140));
    else if (filter === 'critical') matchFilter = r.temp >= 38.0 || r.temp < 35.5 || (r.vitals && r.vitals.spo2 < 95);
    else if (filter === 'turn') matchFilter = r.turnSchedule && r.turnSchedule.nextTurnDue <= Date.now();
    else if (filter === 'med') matchFilter = (r.medications || []).some(m => !m.takenToday);
    else if (filter === 'bedridden') matchFilter = r.careLevel === 'bedridden';

    if (!matchFilter) return false;

    // 2. Search Query Filter
    if (q) {
      const matchRoom = r.roomNo.toLowerCase().includes(q) || r.roomNo.replace(/\D/g, '').includes(q);
      const matchName = r.name.toLowerCase().includes(q);
      const matchHn = (r.hn || '').toLowerCase().includes(q);
      const matchCondition = (r.condition || '').toLowerCase().includes(q);
      const matchDevice = (r.deviceId || '').toLowerCase().includes(q);
      
      let matchCareLevel = false;
      if (q.includes('ติดเตียง') && r.careLevel === 'bedridden') matchCareLevel = true;
      if (q.includes('กึ่ง') && r.careLevel === 'semi') matchCareLevel = true;
      if (q.includes('ช่วย') && r.careLevel === 'self') matchCareLevel = true;

      return matchRoom || matchName || matchHn || matchCondition || matchDevice || matchCareLevel;
    }

    return true;
  });

  // Update search badge
  const summaryEl = document.getElementById('searchResultSummary');
  if (summaryEl) {
    if (q) {
      summaryEl.style.display = 'inline-flex';
      summaryEl.innerHTML = `🔍 พบ <strong>${filtered.length} ห้อง</strong> จากคำค้นหา "${escapeHtml(q)}"`;
    } else {
      summaryEl.style.display = 'none';
    }
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: #ffffff; border-radius: var(--radius-lg); border: 2px dashed #cbd5e1;">
        <span style="font-size: 2.2rem;">🔍</span>
        <div style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-top: 8px;">
          ${q ? `ไม่พบห้องพักที่ตรงกับคำค้นหา "${escapeHtml(q)}"` : 'ไม่พบห้องพักตามเงื่อนไขที่เลือก'}
        </div>
        <p style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">
          ${q ? 'ลองค้นหาด้วยหมายเลขห้อง (เช่น 101), ชื่อผู้สูงอายุ หรือโรคประจำตัว' : 'ลองเปลี่ยนตัวกรอง หรือกดปุ่ม "แสดงทุกห้อง"'}
        </p>
        <button class="btn btn-primary" style="margin-top: 14px; font-size: 0.82rem;" onclick="${q ? 'clearRoomSearch()' : 'setRoomFilter(\'all\')'}">
          ${q ? '✕ ล้างคำค้นหา' : 'แสดงทุกห้อง'}
        </button>
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach(r => {
    let statusClass = 'status-normal';
    let statusBadgeText = '● อุณหภูมิปกติ';
    let statusBadgeClass = 'normal';

    if (r.temp < 35.5) {
      statusClass = 'status-hypo';
      statusBadgeText = '⚠️ ตัวเย็นผิดปกติ';
      statusBadgeClass = 'hypo';
    } else if (r.temp >= 38.0) {
      statusClass = 'status-critical';
      statusBadgeText = '🚨 ไข้สูงเสี่ยงติดเชื้อ';
      statusBadgeClass = 'critical';
    } else if (r.temp >= 37.3) {
      statusClass = 'status-warning';
      statusBadgeText = '● ไข้ต่ำ / เฝ้าระวัง';
      statusBadgeClass = 'lowfever';
    }

    const careTagMap = {
      bedridden: { text: '🛌 ติดเตียง 100%', class: 'bedridden' },
      semi: { text: '🦯 กึ่งติดเตียง', class: 'semi' },
      self: { text: '🚶 ช่วยเหลือตัวเองได้', class: 'self' }
    };
    const careInfo = careTagMap[r.careLevel] || { text: 'ผู้สูงอายุ', class: 'semi' };

    // Turn timer calculation
    const turnDue = r.turnSchedule ? r.turnSchedule.nextTurnDue : Date.now();
    const turnDiff = turnDue - Date.now();
    let turnStatusHtml = '';
    if (turnDiff <= 0) {
      turnStatusHtml = `<span style="color: #dc2626; font-weight: 800;">⚠️ ครบกำหนดพลิกตัวแล้ว!</span>`;
    } else {
      const mins = Math.floor(turnDiff / 60000);
      turnStatusHtml = `<span>🔄 เหลือ ${mins} นาที</span>`;
    }

    const curPos = r.turnSchedule ? TURN_POSITIONS[r.turnSchedule.currentPosIndex % TURN_POSITIONS.length] : 'นอนหงาย';

    // Medications check
    const totalMeds = (r.medications || []).length;
    const takenMeds = (r.medications || []).filter(m => m.takenToday).length;
    const medColor = takenMeds === totalMeds ? '#15803d' : '#b45309';

    html += `
      <div class="room-card ${statusClass}" id="card-${r.id}">
        <!-- Header -->
        <div class="room-header">
          <div class="room-badge-group">
            <span class="room-number-badge">${escapeHtml(r.roomNo)}</span>
            <span class="care-level-tag ${careInfo.class}">${careInfo.text}</span>
          </div>
          <span style="font-size: 0.72rem; color: #15803d; font-weight: 700;">📡 ${escapeHtml(r.deviceId)} 🔋 ${r.battery}%</span>
        </div>

        <!-- Resident Details -->
        <div>
          <div class="room-resident-name">${escapeHtml(r.name)}</div>
          <div class="room-resident-meta">อายุ ${escapeHtml(r.age)} • ${escapeHtml(r.hn)} ${r.condition ? `• <span style="color:#b45309;">${escapeHtml(r.condition)}</span>` : ''}</div>
        </div>

        <!-- Temperature Big Strip -->
        <div class="room-temp-strip">
          <div>
            <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">อุณหภูมิร่างกาย</span>
            <div class="room-temp-value">${r.temp.toFixed(1)} <span style="font-size: 1rem; color: var(--text-muted);">°C</span></div>
          </div>
          <span class="status-badge ${statusBadgeClass}" style="margin: 0; font-size: 0.75rem; padding: 4px 10px;">${statusBadgeText}</span>
        </div>

        <!-- Vitals Mini Grid -->
        <div class="room-vitals-mini">
          <div class="room-vital-box">
            <div class="room-vital-lbl">ความดัน (BP)</div>
            <div class="room-vital-val">${r.vitals ? `${r.vitals.bpSys}/${r.vitals.bpDia}` : '-'}</div>
          </div>
          <div class="room-vital-box">
            <div class="room-vital-lbl">ชีพจร (HR)</div>
            <div class="room-vital-val">${r.vitals ? `${r.vitals.pulse} bpm` : '-'}</div>
          </div>
          <div class="room-vital-box">
            <div class="room-vital-lbl">ออกซิเจน (SpO2)</div>
            <div class="room-vital-val" style="${r.vitals && r.vitals.spo2 < 95 ? 'color:#dc2626;' : ''}">${r.vitals ? `${r.vitals.spo2}%` : '-'}</div>
          </div>
          <div class="room-vital-box">
            <div class="room-vital-lbl">น้ำตาล (DTX)</div>
            <div class="room-vital-val">${r.vitals ? `${r.vitals.glucose}` : '-'}</div>
          </div>
        </div>

        <!-- Care Status Details -->
        <div class="room-care-status-row">
          <span>🔄 ท่านอน: <strong>${curPos}</strong></span>
          ${turnStatusHtml}
        </div>

        <div class="room-care-status-row">
          <span>💊 ยา: <strong style="color: ${medColor};">${takenMeds}/${totalMeds} รายการ</strong></span>
          <span>💧 ดื่มน้ำ: <strong>${r.hydration ? r.hydration.todayMl : 0} ml</strong></span>
        </div>

        <!-- Actions -->
        <div class="room-actions-bar">
          <button class="btn-room-action primary" onclick="openRoomDetailModal('${r.id}')">
            🔍 ดูแลห้องนี้
          </button>
          <button class="btn-room-action turn" onclick="quickTurnRoom('${r.id}')" title="กดเพื่อบันทึกการพลิกตัวทันที">
            ✔ พลิกตัวแล้ว
          </button>
          <button class="btn-room-action sos" onclick="triggerRoomSos('${r.id}')" title="กดส่งสัญญาณฉุกเฉิน">
            🚨
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// 1-Second updater for turn timers in open modal
function updateAllTurnTimers() {
  if (document.getElementById('modalRoomDetail').classList.contains('active')) {
    const room = state.rooms.find(r => r.id === state.selectedRoomId);
    if (room && room.turnSchedule) {
      const diff = room.turnSchedule.nextTurnDue - Date.now();
      const el = document.getElementById('modalTurnTimer');
      if (el) {
        if (diff <= 0) {
          el.textContent = 'ถึงเวลา!';
          el.style.color = '#dc2626';
        } else {
          const mins = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          el.style.color = '#2563eb';
        }
      }
    }
  }
}

// Central Siren & Alert Scanner
function checkCentralAlarms() {
  let criticalRooms = [];

  state.rooms.forEach(r => {
    if (r.temp < 35.5) {
      criticalRooms.push(`${r.roomNo} ${r.name} (ตัวเย็นวิกฤต ${r.temp.toFixed(1)}°C)`);
    } else if (r.temp >= 38.0) {
      criticalRooms.push(`${r.roomNo} ${r.name} (ไข้สูงเสี่ยงติดเชื้อ ${r.temp.toFixed(1)}°C)`);
    } else if (r.vitals && r.vitals.spo2 < 95) {
      criticalRooms.push(`${r.roomNo} ${r.name} (ออกซิเจนต่ำ ${r.vitals.spo2}%)`);
    }
  });

  const banner = document.getElementById('centralAlarmBanner');
  if (criticalRooms.length > 0 && !alertDismissed) {
    banner.style.display = 'flex';
    document.getElementById('alarmBannerTitle').textContent = `🚨 แจ้งเตือนฉุกเฉินระดับศูนย์ (${criticalRooms.length} ห้อง)!`;
    document.getElementById('alarmBannerSub').textContent = criticalRooms.join(' • ');

    if (state.sirenEnabled) {
      triggerAlarmSound('high');
    }
  } else if (criticalRooms.length === 0) {
    banner.style.display = 'none';
    alertDismissed = false;
  }
}

function dismissAlertBanner() {
  alertDismissed = true;
  document.getElementById('centralAlarmBanner').style.display = 'none';
}

// ==========================================
// Individual Room Detail Modal
// ==========================================
function openRoomDetailModal(roomId) {
  state.selectedRoomId = roomId;
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;

  document.getElementById('modalRoomNo').textContent = room.roomNo;
  document.getElementById('modalResidentName').textContent = room.name;
  document.getElementById('modalResidentAge').textContent = `อายุ ${room.age}`;
  document.getElementById('modalResidentHn').textContent = room.hn;
  document.getElementById('modalResidentWeight').textContent = `${room.weight.toFixed(1)} กก.`;
  document.getElementById('modalResidentCondition').textContent = `โรคประจำตัว: ${room.condition || 'ไม่มีระบุ'}`;
  document.getElementById('modalDeviceBattery').textContent = `📡 ${room.deviceId} | 🔋 ${room.battery}%`;

  const careTag = document.getElementById('modalCareLevelTag');
  careTag.className = `care-level-tag ${room.careLevel}`;
  careTag.textContent = room.careLevel === 'bedridden' ? 'ติดเตียง 100%' : (room.careLevel === 'semi' ? 'กึ่งติดเตียง' : 'ช่วยเหลือตัวเองได้');

  // Hero Temp
  document.getElementById('modalHeroTemp').textContent = room.temp.toFixed(1);
  const statusBadge = document.getElementById('modalStatusBadge');
  const statusText = document.getElementById('modalStatusText');
  const modalHeroCard = document.getElementById('modalHeroCard');

  if (room.temp < 35.5) {
    modalHeroCard.className = 'hero-card hypo';
    statusBadge.className = 'status-badge hypo';
    statusText.textContent = '⚠️ ตัวเย็นผิดปกติ (Hypothermia)';
    document.getElementById('modalAdviceText').textContent = 'ระวังภาวะตัวเย็นวิกฤต! ให้ห่มผ้าหนา ดื่มน้ำอุ่น และตรวจวัดซ้ำ';
  } else if (room.temp >= 38.0) {
    modalHeroCard.className = 'hero-card critical';
    statusBadge.className = 'status-badge critical';
    statusText.textContent = '🚨 ไข้สูงเสี่ยงติดเชื้อในกระแสเลือด (Sepsis)';
    document.getElementById('modalAdviceText').textContent = 'ผู้สูงอายุมีไข้สูงเสี่ยงติดเชื้อรุนแรง ตรวจดูความดัน ชีพจร และเตรียมพบแพทย์';
  } else if (room.temp >= 37.3) {
    modalHeroCard.className = 'hero-card lowfever';
    statusBadge.className = 'status-badge lowfever';
    statusText.textContent = '● มีไข้ต่ำ / เฝ้าระวัง';
    document.getElementById('modalAdviceText').textContent = 'เช็ดตัว ดื่มน้ำบ่อยๆ และสังเกตอาการซึมหรือสับสน';
  } else {
    modalHeroCard.className = 'hero-card normal';
    statusBadge.className = 'status-badge normal';
    statusText.textContent = '● อุณหภูมิปกติ สบายดี';
    document.getElementById('modalAdviceText').textContent = 'ผู้สูงอายุสบายดี ให้ดื่มน้ำและสังเกตอาการตามรอบ';
  }

  // Vitals
  const v = room.vitals || { bpSys: 120, bpDia: 80, pulse: 72, spo2: 98, glucose: 100 };
  document.getElementById('modalValBp').textContent = `${v.bpSys}/${v.bpDia}`;
  document.getElementById('modalValHr').textContent = v.pulse;
  document.getElementById('modalValSpo2').textContent = v.spo2;
  document.getElementById('modalValGlucose').textContent = v.glucose;

  // Turn Schedule
  const ts = room.turnSchedule || { currentPosIndex: 0, nextTurnDue: Date.now() + 7200000 };
  const curPos = TURN_POSITIONS[ts.currentPosIndex % TURN_POSITIONS.length];
  const nextPos = TURN_POSITIONS[(ts.currentPosIndex + 1) % TURN_POSITIONS.length];
  document.getElementById('modalTurnCurrentPos').textContent = curPos;
  document.getElementById('modalTurnNextPos').textContent = `ท่าถัดไป: ${nextPos}`;

  // Hydration
  const hyd = room.hydration || { todayMl: 1200, goalMl: 2000 };
  document.getElementById('modalHydrationLabel').textContent = `${hyd.todayMl.toLocaleString()} / ${hyd.goalMl.toLocaleString()} ml`;

  // Meds list
  renderActiveRoomMedList(room);

  // Chart
  renderModalRoomChart(room);

  document.getElementById('modalRoomDetail').classList.add('active');
}

function closeRoomDetailModal() {
  document.getElementById('modalRoomDetail').classList.remove('active');
}

function quickTurnRoom(roomId) {
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;

  if (!room.turnSchedule) room.turnSchedule = { currentPosIndex: 0, nextTurnDue: Date.now() + 7200000 };
  room.turnSchedule.currentPosIndex = (room.turnSchedule.currentPosIndex + 1) % TURN_POSITIONS.length;
  room.turnSchedule.nextTurnDue = Date.now() + 2 * 60 * 60 * 1000; // Reset 2 hours

  const curPos = TURN_POSITIONS[room.turnSchedule.currentPosIndex];
  addCenterLog({
    type: 'turn',
    roomNo: room.roomNo,
    residentName: room.name,
    title: `พลิกตัว ${room.roomNo} (${room.name})`,
    note: `เปลี่ยนเป็นท่า "${curPos}" (รอบถัดไป 2 ชม.)`
  });

  saveState();
  renderCenterStatistics();
  renderRoomsGrid();
  if (document.getElementById('modalRoomDetail').classList.contains('active')) {
    openRoomDetailModal(roomId);
  }
}

function recordActiveRoomTurn() {
  quickTurnRoom(state.selectedRoomId);
}

function triggerRoomSos(roomId) {
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;

  alert(`🚨 สัญญาณฉุกเฉิน (SOS) จาก ${room.roomNo} (${room.name})! ระบบส่งสัญญาณแจ้งเตือนแล้ว`);
  triggerAlarmSound('high');
  addCenterLog({
    type: 'alert',
    roomNo: room.roomNo,
    residentName: room.name,
    title: `🚨 ขอความช่วยเหลือฉุกเฉิน (SOS) จาก ${room.roomNo}`,
    note: `ผู้ป่วย: ${room.name} (${room.condition})`
  });
}

function addActiveRoomWater(ml) {
  const room = state.rooms.find(r => r.id === state.selectedRoomId);
  if (!room) return;
  if (!room.hydration) room.hydration = { todayMl: 0, goalMl: 2000 };
  room.hydration.todayMl += ml;

  addCenterLog({
    type: 'water',
    roomNo: room.roomNo,
    residentName: room.name,
    title: `${room.roomNo} ดื่มน้ำ +${ml} ml`,
    note: `รวมสะสมวันนี้ ${room.hydration.todayMl} ml`
  });

  saveState();
  renderRoomsGrid();
  document.getElementById('modalHydrationLabel').textContent = `${room.hydration.todayMl.toLocaleString()} / ${room.hydration.goalMl.toLocaleString()} ml`;
}

// Active Room Meds List
function renderActiveRoomMedList(room) {
  const container = document.getElementById('modalMedListContainer');
  if (!container) return;

  const meds = room.medications || [];
  if (meds.length === 0) {
    container.innerHTML = `<div style="font-size: 0.8rem; color: #94a3b8; padding: 10px 0;">ไม่มีรายการยาสำหรับห้องนี้</div>`;
    return;
  }

  let html = '';
  meds.forEach(med => {
    html += `
      <div class="med-item-row" style="margin-bottom: 6px; padding: 8px 12px;">
        <div class="med-item-info">
          <div class="med-name" style="font-size: 0.9rem;">${escapeHtml(med.name)}</div>
          <div class="med-dose-desc">${escapeHtml(med.desc)} ${med.takenToday ? `• <span style="color:#15803d; font-weight:700;">ทานแล้ว (${med.timeTaken || ''})</span>` : ''}</div>
        </div>
        <button class="btn-check-med ${med.takenToday ? 'checked' : ''}" onclick="toggleRoomMedCheck('${room.id}', '${med.id}')">
          ${med.takenToday ? '✔ ทานแล้ว' : '◯ ยังไม่ทาน'}
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function toggleRoomMedCheck(roomId, medId) {
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;
  const med = (room.medications || []).find(m => m.id === medId);
  if (!med) return;

  med.takenToday = !med.takenToday;
  if (med.takenToday) {
    med.timeTaken = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    addCenterLog({
      type: 'med',
      roomNo: room.roomNo,
      residentName: room.name,
      title: `${room.roomNo} ทานยา: ${med.name}`,
      note: med.desc
    });
  }

  saveState();
  renderCenterStatistics();
  renderRoomsGrid();
  renderCenterMedsList();
  if (document.getElementById('modalRoomDetail').classList.contains('active')) {
    renderActiveRoomMedList(room);
  }
}

// Modal Room Temperature Chart
function renderModalRoomChart(room) {
  const ctx = document.getElementById('modalRoomChart');
  if (!ctx) return;

  const history = room.history || [];
  const labels = history.map(h => new Date(h.time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
  const temps = history.map(h => h.temp);

  if (modalRoomChartInstance) {
    modalRoomChartInstance.destroy();
  }

  modalRoomChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'อุณหภูมิ (°C)',
          data: temps,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          min: 35.0,
          max: 40.0,
          ticks: { stepSize: 0.5, callback: (v) => `${v}°` }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

// Center Meds Tab List
function renderCenterMedsList() {
  const container = document.getElementById('elderlyCenterMedsList');
  if (!container) return;

  const q = state.medSearchQuery;
  const filteredRooms = state.rooms.filter(room => {
    if (!q) return true;
    const matchRoom = room.roomNo.toLowerCase().includes(q) || room.name.toLowerCase().includes(q);
    const matchMed = (room.medications || []).some(m => m.name.toLowerCase().includes(q) || (m.desc || '').toLowerCase().includes(q));
    return matchRoom || matchMed;
  });

  if (filteredRooms.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 30px; color: #64748b;">
        🔍 ไม่พบรายการยาที่ตรงกับคำค้นหา "${escapeHtml(q)}"
      </div>
    `;
    return;
  }

  let html = '';
  filteredRooms.forEach(room => {
    const meds = (room.medications || []).filter(med => {
      if (!q) return true;
      const matchRoom = room.roomNo.toLowerCase().includes(q) || room.name.toLowerCase().includes(q);
      if (matchRoom) return true;
      return med.name.toLowerCase().includes(q) || (med.desc || '').toLowerCase().includes(q);
    });

    const untaken = meds.filter(m => !m.takenToday);

    html += `
      <div style="background: #ffffff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div>
            <span class="room-number-badge">${escapeHtml(room.roomNo)}</span>
            <strong style="margin-left: 6px; color: #0f172a;">${escapeHtml(room.name)}</strong>
          </div>
          <span style="font-size: 0.75rem; font-weight: 700; color: ${untaken.length === 0 ? '#15803d' : '#b45309'};">
            ${untaken.length === 0 ? '✔ ทานยาครบแล้ว' : `⚠️ รอนทานอีก ${untaken.length} รายการ`}
          </span>
        </div>
        <div style="display: grid; gap: 6px;">
    `;

    meds.forEach(med => {
      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; background: #f8fafc; padding: 6px 10px; border-radius: 6px;">
          <div>
            <strong>${escapeHtml(med.name)}</strong> - <span style="color: var(--text-muted);">${escapeHtml(med.desc)}</span>
          </div>
          <button class="btn-check-med ${med.takenToday ? 'checked' : ''}" style="padding: 4px 10px; font-size: 0.72rem;" onclick="toggleRoomMedCheck('${room.id}', '${med.id}')">
            ${med.takenToday ? '✔ ทานแล้ว' : '◯ ยังไม่ทาน'}
          </button>
        </div>
      `;
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
}

// ==========================================
// Add New Room Modal
// ==========================================
function openAddRoomModal() {
  document.getElementById('addRoomNo').value = `ห้อง 10${state.rooms.length + 1}`;
  document.getElementById('addRoomResidentName').value = '';
  document.getElementById('addRoomAge').value = '75 ปี';
  document.getElementById('addRoomHn').value = `HN-00${700 + state.rooms.length}`;
  document.getElementById('addRoomCondition').value = '';
  document.getElementById('addRoomDeviceId').value = `elderly${state.rooms.length + 1}`;
  document.getElementById('modalAddRoom').classList.add('active');
}

function closeAddRoomModal() {
  document.getElementById('modalAddRoom').classList.remove('active');
}

function saveNewRoom() {
  const roomNo = document.getElementById('addRoomNo').value.trim();
  const name = document.getElementById('addRoomResidentName').value.trim();
  const age = document.getElementById('addRoomAge').value.trim() || '75 ปี';
  const hn = document.getElementById('addRoomHn').value.trim() || 'HN-NEW';
  const careLevel = document.getElementById('addRoomCareLevel').value;
  const condition = document.getElementById('addRoomCondition').value.trim();
  const deviceId = document.getElementById('addRoomDeviceId').value.trim() || 'elderly-sensor';

  if (!roomNo || !name) {
    alert('กรุณากรอกหมายเลขห้องและชื่อผู้สูงอายุ');
    return;
  }

  const newId = 'r_' + Date.now();
  const newRoom = {
    id: newId,
    roomNo,
    name,
    age,
    hn,
    weight: 55.0,
    avatar: '👵',
    careLevel,
    condition: condition || 'ผู้สูงอายุประจำศูนย์',
    deviceId,
    battery: 100,
    temp: 36.8,
    vitals: { bpSys: 120, bpDia: 80, pulse: 72, spo2: 98, glucose: 100, lastUpdated: new Date().toISOString() },
    turnSchedule: { currentPosIndex: 0, nextTurnDue: Date.now() + 2 * 60 * 60 * 1000 },
    hydration: { todayMl: 0, goalMl: 2000 },
    medications: [
      { id: 'm_' + Date.now(), name: 'ยาบำรุงสุขภาพ / วิตามิน', meal: 'morning', desc: '1 เม็ด หลังอาหารเช้า', takenToday: false }
    ],
    history: [
      { time: new Date().toISOString(), temp: 36.8 }
    ],
    logs: []
  };

  state.rooms.push(newRoom);
  addCenterLog({
    type: 'info',
    roomNo,
    residentName: name,
    title: `เปิดห้องพักใหม่: ${roomNo}`,
    note: `ผู้พักอาศัย: ${name} (${condition})`
  });

  saveState();
  closeAddRoomModal();
  updateUI();
  alert(`เปิดห้องพัก ${roomNo} สำหรับ ${name} เรียบร้อยแล้ว!`);
}

function deleteActiveRoom() {
  const room = state.rooms.find(r => r.id === state.selectedRoomId);
  if (!room) return;

  if (confirm(`คุณต้องการจำหน่าย/ลบห้อง ${room.roomNo} (${room.name}) หรือไม่?`)) {
    state.rooms = state.rooms.filter(r => r.id !== state.selectedRoomId);
    saveState();
    closeRoomDetailModal();
    updateUI();
  }
}

// ==========================================
// Vitals Modal
// ==========================================
function openVitalsModal() {
  const room = state.rooms.find(r => r.id === state.selectedRoomId);
  if (!room) return;
  const v = room.vitals || { bpSys: 120, bpDia: 80, pulse: 74, spo2: 98, glucose: 110 };

  document.getElementById('inputBpSys').value = v.bpSys;
  document.getElementById('inputBpDia').value = v.bpDia;
  document.getElementById('inputHr').value = v.pulse;
  document.getElementById('inputSpo2').value = v.spo2;
  document.getElementById('inputGlucose').value = v.glucose;
  document.getElementById('modalVitals').classList.add('active');
}

function closeVitalsModal() {
  document.getElementById('modalVitals').classList.remove('active');
}

function saveVitalsModal() {
  const room = state.rooms.find(r => r.id === state.selectedRoomId);
  if (!room) return;

  const bpSys = parseInt(document.getElementById('inputBpSys').value) || 120;
  const bpDia = parseInt(document.getElementById('inputBpDia').value) || 80;
  const pulse = parseInt(document.getElementById('inputHr').value) || 72;
  const spo2 = parseInt(document.getElementById('inputSpo2').value) || 98;
  const glucose = parseInt(document.getElementById('inputGlucose').value) || 100;

  room.vitals = {
    bpSys,
    bpDia,
    pulse,
    spo2,
    glucose,
    lastUpdated: new Date().toISOString()
  };

  addCenterLog({
    type: 'vitals',
    roomNo: room.roomNo,
    residentName: room.name,
    title: `บันทึกสัญญาณชีพ ${room.roomNo}`,
    note: `BP ${bpSys}/${bpDia}, HR ${pulse}, SpO2 ${spo2}%, DTX ${glucose}`
  });

  saveState();
  closeVitalsModal();
  renderCenterStatistics();
  renderRoomsGrid();
  if (document.getElementById('modalRoomDetail').classList.contains('active')) {
    openRoomDetailModal(room.id);
  }
}

// Add New Med Modal
function openAddMedModal() {
  document.getElementById('inputMedName').value = '';
  document.getElementById('inputMedDoseDesc').value = '';
  document.getElementById('modalAddMed').classList.add('active');
}

function closeAddMedModal() {
  document.getElementById('modalAddMed').classList.remove('active');
}

function saveNewMed() {
  const room = state.rooms.find(r => r.id === state.selectedRoomId);
  if (!room) return;

  const name = document.getElementById('inputMedName').value.trim();
  const meal = document.getElementById('inputMedMeal').value;
  const desc = document.getElementById('inputMedDoseDesc').value.trim();

  if (!name) {
    alert('กรุณากรอกชื่อยา');
    return;
  }

  if (!room.medications) room.medications = [];
  room.medications.push({
    id: 'm_' + Date.now(),
    name,
    meal,
    desc: desc || 'รับประทานตามแพทย์สั่ง',
    takenToday: false
  });

  saveState();
  closeAddMedModal();
  renderCenterMedsList();
  if (document.getElementById('modalRoomDetail').classList.contains('active')) {
    renderActiveRoomMedList(room);
  }
}

// ==========================================
// Central Logs & Timeline
// ==========================================
function addCenterLog(entry) {
  const newLog = {
    id: 'log_' + Date.now(),
    time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    type: entry.type || 'info',
    roomNo: entry.roomNo || '-',
    residentName: entry.residentName || '-',
    title: entry.title || 'บันทึกกิจกรรม',
    note: entry.note || ''
  };

  state.centerLogs.unshift(newLog);
  if (state.centerLogs.length > 80) state.centerLogs.pop();
  saveState();
  renderCenterLogs();
  updateDoctorReport();
}

function renderCenterLogs() {
  const container = document.getElementById('careLogsContainer');
  if (!container) return;

  const q = state.logSearchQuery;
  const filtered = state.centerLogs.filter(l => {
    if (!q) return true;
    return (
      (l.roomNo || '').toLowerCase().includes(q) ||
      (l.residentName || '').toLowerCase().includes(q) ||
      (l.title || '').toLowerCase().includes(q) ||
      (l.note || '').toLowerCase().includes(q)
    );
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 24px 0;">
        ${q ? `🔍 ไม่พบบันทึกกิจกรรมที่ตรงกับคำค้นหา "${escapeHtml(q)}"` : 'ยังไม่มีบันทึกกิจกรรมวันนี้'}
      </div>
    `;
    return;
  }

  const icons = {
    med: '💊',
    turn: '🔄',
    water: '💧',
    vitals: '🫀',
    alert: '🚨',
    info: '📝'
  };

  let html = '';
  filtered.forEach(l => {
    html += `
      <div class="log-item">
        <div class="log-left">
          <div class="log-icon-box">${icons[l.type] || '📝'}</div>
          <div>
            <div class="log-title">${escapeHtml(l.title)}</div>
            <div class="log-meta">${l.time} ${l.note ? `• ${escapeHtml(l.note)}` : ''}</div>
          </div>
        </div>
        <span class="room-number-badge" style="font-size: 0.75rem;">${escapeHtml(l.roomNo)}</span>
      </div>
    `;
  });

  container.innerHTML = html;
}

function clearCenterLogs() {
  if (confirm('คุณต้องการล้างประวัติการดูแลของศูนย์ทั้งหมดหรือไม่?')) {
    state.centerLogs = [];
    saveState();
    renderCenterLogs();
  }
}

// ==========================================
// Doctor / LINE Report Generator
// ==========================================
function populateReportRoomSelect() {
  const select = document.getElementById('reportRoomSelect');
  if (!select) return;

  let html = `<option value="all">🏢 ภาพรวมทุกห้องในศูนย์</option>`;
  state.rooms.forEach(r => {
    html += `<option value="${r.id}">${r.roomNo} - ${r.name}</option>`;
  });

  select.innerHTML = html;
}

function updateDoctorReport() {
  const reportBox = document.getElementById('doctorReportPreview');
  const select = document.getElementById('reportRoomSelect');
  if (!reportBox) return;

  const choice = select ? select.value : 'all';
  const now = new Date();
  const dateStr = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  let text = '';

  if (choice === 'all') {
    text = `🏢 [รายงานภาพรวมศูนย์ดูแลผู้สูงอายุ ElderCare 24]\n`;
    text += `วันเวลา: ${dateStr} เวลา ${timeStr} น.\n`;
    text += `จำนวนห้องพักทั้งหมด: ${state.rooms.length} ห้อง\n`;
    text += `──────────────────\n`;

    state.rooms.forEach(r => {
      const v = r.vitals || {};
      text += `📍 ${r.roomNo}: ${r.name} (${r.age})\n`;
      text += `  • อุณหภูมิ: ${r.temp.toFixed(1)}°C | BP: ${v.bpSys}/${v.bpDia} | SpO2: ${v.spo2}%\n`;
      text += `  • โรคประจำตัว: ${r.condition || '-'}\n`;
      text += `  • ท่าพลิกตัว: ${r.turnSchedule ? TURN_POSITIONS[r.turnSchedule.currentPosIndex % TURN_POSITIONS.length] : '-'}\n`;
    });
    text += `──────────────────\n`;
    text += `สถานะฉุกเฉิน: ${document.getElementById('statCriticalRooms').textContent} ห้องวิกฤต, ${document.getElementById('statWarningRooms').textContent} ห้องเฝ้าระวัง\n`;
  } else {
    const room = state.rooms.find(r => r.id === choice);
    if (room) {
      const v = room.vitals || {};
      text = `🏥 [รายงานสุขภาพผู้สูงอายุ - ${room.roomNo}]\n`;
      text += `ผู้สูงอายุ: ${room.name} (${room.age}) | HN: ${room.hn}\n`;
      text += `โรคประจำตัว: ${room.condition || '-'}\n`;
      text += `วันเวลา: ${dateStr} เวลา ${timeStr} น.\n`;
      text += `──────────────────\n`;
      text += `🌡️ อุณหภูมิ: ${room.temp.toFixed(1)}°C\n`;
      text += `🫀 สัญญาณชีพ: BP ${v.bpSys}/${v.bpDia} mmHg | HR ${v.pulse} bpm | SpO2 ${v.spo2}%\n`;
      text += `💧 ดื่มน้ำวันนี้: ${room.hydration ? room.hydration.todayMl : 0} ml\n`;
      text += `🔄 ท่าพลิกตัวล่าสุด: ${room.turnSchedule ? TURN_POSITIONS[room.turnSchedule.currentPosIndex % TURN_POSITIONS.length] : '-'}\n`;
      text += `💊 ยาที่ทานแล้ว: ${(room.medications || []).filter(m => m.takenToday).map(m => m.name).join(', ') || 'ยังไม่มี'}\n`;
    }
  }

  text += `──────────────────\n`;
  text += `บันทึกโดยระบบศูนย์ดูแลผู้สูงอายุ ElderCare 24`;
  reportBox.value = text;
}

function copyDoctorReport() {
  const reportBox = document.getElementById('doctorReportPreview');
  reportBox.select();
  reportBox.setSelectionRange(0, 99999);

  if (navigator.clipboard) {
    navigator.clipboard.writeText(reportBox.value).then(() => {
      alert('คัดลอกรายงานเรียบร้อยแล้ว! สามารถนำไปวางส่งในแชท LINE ได้ทันที');
    }).catch(() => {
      document.execCommand('copy');
      alert('คัดลอกรายงานเรียบร้อยแล้ว!');
    });
  } else {
    document.execCommand('copy');
    alert('คัดลอกรายงานเรียบร้อยแล้ว!');
  }
}

function shareActiveRoomDoctorReport() {
  const select = document.getElementById('reportRoomSelect');
  if (select) select.value = state.selectedRoomId;
  updateDoctorReport();
  closeRoomDetailModal();
  switchTab('logs');
  copyDoctorReport();
}

// Export Center Excel
function exportCenterExcel() {
  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"></head>
    <body>
    <h2>รายงานภาพรวมศูนย์ดูแลผู้สูงอายุ - ElderCare 24</h2>
    <p>วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH')}</p>
    <table border="1">
      <tr style="background:#0d9488;color:#ffffff;">
        <th>ห้อง</th>
        <th>ชื่อผู้สูงอายุ</th>
        <th>อายุ</th>
        <th>HN</th>
        <th>ระดับการดูแล</th>
        <th>โรคประจำตัว</th>
        <th>อุณหภูมิ (°C)</th>
        <th>ความดัน (BP)</th>
        <th>ชีพจร (HR)</th>
        <th>ออกซิเจน (SpO2)</th>
        <th>น้ำตาล (DTX)</th>
        <th>ดื่มน้ำ (ml)</th>
      </tr>
  `;

  state.rooms.forEach(r => {
    const v = r.vitals || {};
    tableHtml += `
      <tr>
        <td>${r.roomNo}</td>
        <td>${r.name}</td>
        <td>${r.age}</td>
        <td>${r.hn}</td>
        <td>${r.careLevel}</td>
        <td>${r.condition || '-'}</td>
        <td>${r.temp.toFixed(1)}</td>
        <td>${v.bpSys}/${v.bpDia}</td>
        <td>${v.pulse}</td>
        <td>${v.spo2}%</td>
        <td>${v.glucose}</td>
        <td>${r.hydration ? r.hydration.todayMl : 0}</td>
      </tr>
    `;
  });

  tableHtml += `</table></body></html>`;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ElderCare_Report_${new Date().toISOString().slice(0, 10)}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCenterCsv() {
  let csv = "\uFEFFห้อง,ชื่อ,อายุ,HN,ระดับการดูแล,โรคประจำตัว,อุณหภูมิ,ความดัน,ชีพจร,SpO2,DTX,ดื่มน้ำml\n";
  state.rooms.forEach(r => {
    const v = r.vitals || {};
    csv += `"${r.roomNo}","${r.name}","${r.age}","${r.hn}","${r.careLevel}","${r.condition || ''}",${r.temp.toFixed(1)},"${v.bpSys}/${v.bpDia}",${v.pulse},${v.spo2},${v.glucose},${r.hydration ? r.hydration.todayMl : 0}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ElderCare_Data_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ==========================================
// Simulation / Demo Mode
// ==========================================
function toggleSimulationModal() {
  document.getElementById('modalSimulation').classList.add('active');
}

function closeSimulationModal() {
  document.getElementById('modalSimulation').classList.remove('active');
}

function enableDemoMode() {
  state.mode = 'demo';
  document.getElementById('connectionStatusPill').className = 'connection-pill demo';
  document.getElementById('connectionStatusText').textContent = 'โหมดจำลอง (Demo)';
  document.getElementById('demoBanner').style.display = 'flex';
}

function setMode(newMode) {
  state.mode = newMode;
  saveState();
  if (newMode === 'firebase') {
    document.getElementById('demoBanner').style.display = 'none';
    document.getElementById('connectionStatusPill').className = 'connection-pill online';
    document.getElementById('connectionStatusText').textContent = 'Live เซนเซอร์';
    closeSimulationModal();
    connectFirebase();
  } else {
    enableDemoMode();
  }
}

function setSimTemp(val) {
  const room = state.rooms.find(r => r.id === state.selectedRoomId);
  if (room) {
    room.temp = val;
    if (!room.history) room.history = [];
    room.history.push({ time: new Date().toISOString(), temp: val });
  }

  saveState();
  updateUI();
  if (document.getElementById('modalRoomDetail').classList.contains('active')) {
    openRoomDetailModal(state.selectedRoomId);
  }
  closeSimulationModal();
}

// ==========================================
// Firebase Realtime Database Sync
// ==========================================
function connectFirebase() {
  if (state.mode !== 'firebase') return;
  const baseUrl = (state.firebaseUrl || DEFAULT_FIREBASE_URL).replace(/\/$/, '');
  const url = `${baseUrl}/.json`;

  try {
    if (firebaseEventSource) firebaseEventSource.close();
    firebaseEventSource = new EventSource(url);

    firebaseEventSource.addEventListener('put', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload && payload.data) {
          handleFirebaseData(payload.data);
        }
      } catch (err) {
        console.warn('Firebase parse error:', err);
      }
    });

    firebaseEventSource.onerror = () => {
      document.getElementById('connectionStatusPill').className = 'connection-pill demo';
      document.getElementById('connectionStatusText').textContent = 'กำลังเชื่อมต่อใหม่...';
    };
  } catch (err) {
    console.warn('Firebase error:', err);
  }
}

function handleFirebaseData(data) {
  let tempVal = null;
  if (typeof data.temperature !== 'undefined') tempVal = parseFloat(data.temperature);
  else if (typeof data.temp !== 'undefined') tempVal = parseFloat(data.temp);

  if (tempVal !== null && !isNaN(tempVal)) {
    // Map to Room 101 or deviceId match
    const room = state.rooms.find(r => r.deviceId === 'baby1') || state.rooms[0];
    if (room) {
      room.temp = tempVal;
      if (data.battery) room.battery = parseInt(data.battery);
      room.history.push({ time: new Date().toISOString(), temp: tempVal });
      if (room.history.length > 100) room.history.shift();
    }

    saveState();
    updateUI();
  }
}

// ==========================================
// Audio Alerts
// ==========================================
function setupAudioUnlock() {
  const unlock = () => {
    unlockAudio();
    window.removeEventListener('click', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('click', unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true });
}

function unlockAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    document.getElementById('audioUnlockBanner').style.display = 'none';
  } catch (e) {
    console.warn('Audio unlock error:', e);
  }
}

function checkAudioStatus() {
  if (!audioCtx || audioCtx.state === 'suspended') {
    document.getElementById('audioUnlockBanner').style.display = 'flex';
  }
}

function triggerAlarmSound(severity = 'med') {
  if (!state.soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const freq = severity === 'high' ? 880 : 587.33;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    console.warn('Alarm audio error:', e);
  }
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  const btn = document.getElementById('btnSoundToggle');
  const icon = document.getElementById('soundIcon');
  if (state.soundEnabled) {
    btn.classList.add('active');
    icon.textContent = '🔔';
  } else {
    btn.classList.remove('active');
    icon.textContent = '🔕';
  }
  saveState();
}

function toggleNightAlarm() {
  state.sirenEnabled = !state.sirenEnabled;
  const btn = document.getElementById('btnNightAlarm');
  if (state.sirenEnabled) {
    btn.classList.add('active');
    alert('เปิดไซเรนศูนย์เตือนภัย: เมื่อมีห้องที่อุณหภูมิหรือสัญญาณชีพผิดปกติ ระบบจะส่งเสียงเตือนทันที');
  } else {
    btn.classList.remove('active');
  }
  saveState();
}

// Screen Wake Lock
async function toggleWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      if (!state.wakeLockActive) {
        wakeLockSentinel = await navigator.wakeLock.request('screen');
        state.wakeLockActive = true;
        document.getElementById('btnWakeLock').classList.add('active');
        wakeLockSentinel.addEventListener('release', () => {
          state.wakeLockActive = false;
          document.getElementById('btnWakeLock').classList.remove('active');
        });
      } else if (wakeLockSentinel) {
        await wakeLockSentinel.release();
        wakeLockSentinel = null;
        state.wakeLockActive = false;
        document.getElementById('btnWakeLock').classList.remove('active');
      }
    } catch (e) {
      console.warn('Wake lock error:', e);
    }
  } else {
    alert('เบราว์เซอร์นี้ไม่รองรับ Screen Wake Lock API');
  }
}

// Tabs
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));

  const targetSection = document.getElementById(`tab-${tabId}`);
  const targetNav = document.getElementById(`nav-${tabId}`);

  if (targetSection) targetSection.classList.add('active');
  if (targetNav) targetNav.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveSettings() {
  state.emergencyContact.phone = document.getElementById('settingEmergencyPhone').value.trim() || '1669';

  const fbUrl = document.getElementById('settingFirebaseUrl').value.trim();
  if (fbUrl) state.firebaseUrl = fbUrl;

  saveState();
  updateUI();
  alert('บันทึกการตั้งค่าเรียบร้อยแล้ว!');
  switchTab('home');
}

// PWA
function initPwa() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('SW registration failed:', err);
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const btn = document.getElementById('btnInstallPwa');
    if (btn) {
      btn.style.display = 'inline-flex';
      btn.onclick = () => {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(() => {
          deferredInstallPrompt = null;
          btn.style.display = 'none';
        });
      };
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
