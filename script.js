// ═══════════════════════════════════════════════════════
//  AGENDIO — script.js
//  Toda a lógica da aplicação
// ═══════════════════════════════════════════════════════

// ── BUSINESS TYPES ──────────────────────────────────────
const BUSINESS_TYPES = [
  { id: 'barbearia', label: 'Barbearia',        icon: '💈', color: '#c8440a', service: 'corte'         },
  { id: 'salao',     label: 'Salão de Beleza',   icon: '💇', color: '#b0308a', service: 'serviço'       },
  { id: 'clinica',   label: 'Clínica / Saúde',   icon: '🏥', color: '#2d7a4f', service: 'consulta'      },
  { id: 'tatuagem',  label: 'Estúdio de Tattoo', icon: '🎨', color: '#4a30c8', service: 'sessão'        },
  { id: 'manicure',  label: 'Manicure / Nail',   icon: '💅', color: '#c83070', service: 'atendimento'   },
  { id: 'personal',  label: 'Personal Trainer',  icon: '💪', color: '#c87010', service: 'treino'        },
  { id: 'estetica',  label: 'Estética',           icon: '✨', color: '#708030', service: 'procedimento'  },
  { id: 'outro',     label: 'Outro negócio',      icon: '🏪', color: '#555555', service: 'atendimento'   },
];

// ── STORAGE & DEFAULTS ──────────────────────────────────
const DEFAULT_SETTINGS = {
  shopName: 'Meu Negócio',
  barberName: 'Profissional',
  shopAddress: '',
  bizType: 'barbearia',
  workDays: [1, 2, 3, 4, 5, 6],
  startTime: '08:00',
  endTime: '18:00',
  intervalMin: 30,
  lunchBreak: 'none',
  offDates: [],
  locked: false,
  lockedSince: null,
  waNumber: '',
  rem1h: true,
  remMorning: false,
};

const NO_SHOW_TIMEOUT = 10 * 60 * 1000; // 10 minutes

function loadDB() {
  try { return JSON.parse(localStorage.getItem('af_db') || '{"appointments":{}}'); }
  catch { return { appointments: {} }; }
}
function saveDB(db) { localStorage.setItem('af_db', JSON.stringify(db)); }

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('af_cfg') || 'null');
    return s ? { ...DEFAULT_SETTINGS, ...s } : { ...DEFAULT_SETTINGS };
  } catch { return { ...DEFAULT_SETTINGS }; }
}
function persistSettings(s) { localStorage.setItem('af_cfg', JSON.stringify(s)); }

function getAdminPw() { return localStorage.getItem('af_pw') || ''; }
function setAdminPw(pw) { localStorage.setItem('af_pw', pw); }
function isSetupDone() { return !!localStorage.getItem('af_pw'); }

// ── SETUP WIZARD ────────────────────────────────────────
let wizardBizType = BUSINESS_TYPES[0];

function initWizard() {
  const grid = document.getElementById('btype-grid');
  BUSINESS_TYPES.forEach(bt => {
    const el = document.createElement('div');
    el.className = 'btype' + (bt.id === wizardBizType.id ? ' selected' : '');
    el.innerHTML = `<span class="btype-icon">${bt.icon}</span>${bt.label}`;
    el.onclick = () => {
      document.querySelectorAll('.btype').forEach(b => b.classList.remove('selected'));
      el.classList.add('selected');
      wizardBizType = bt;
    };
    grid.appendChild(el);
  });
}

function wizardNext(step) {
  if (step === 1) {
    document.getElementById('wizard-step-1').style.display = 'none';
    document.getElementById('wizard-step-2').style.display = 'block';
    document.getElementById('wizard-btype-icon').textContent = wizardBizType.icon;
  } else if (step === 2) {
    const name = document.getElementById('wiz-shop-name').value.trim();
    if (!name) { alert('Digite o nome do negócio'); return; }
    document.getElementById('wizard-step-2').style.display = 'none';
    document.getElementById('wizard-step-3').style.display = 'block';
  }
}

function wizardBack(step) {
  if (step === 1) {
    document.getElementById('wizard-step-2').style.display = 'none';
    document.getElementById('wizard-step-1').style.display = 'block';
  } else if (step === 2) {
    document.getElementById('wizard-step-3').style.display = 'none';
    document.getElementById('wizard-step-2').style.display = 'block';
  }
}

function wizardFinish() {
  const pw1 = document.getElementById('wiz-pw1').value;
  const pw2 = document.getElementById('wiz-pw2').value;
  if (pw1.length < 4) { alert('Senha deve ter ao menos 4 caracteres'); return; }
  if (pw1 !== pw2)    { alert('As senhas não conferem'); return; }

  const settings = loadSettings();
  settings.shopName   = document.getElementById('wiz-shop-name').value.trim() || 'Meu Negócio';
  settings.barberName = document.getElementById('wiz-barber-name').value.trim() || 'Profissional';
  settings.waNumber   = document.getElementById('wiz-wa-number').value.replace(/\D/g, '');
  settings.bizType    = wizardBizType.id;
  persistSettings(settings);
  setAdminPw(pw1);

  document.getElementById('setup-wizard').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
  bootApp();
}

function checkPwStrength(inputId, barId) {
  const pw  = document.getElementById(inputId).value;
  const bar = document.getElementById(barId);
  let score = 0;
  if (pw.length >= 4)                          score++;
  if (pw.length >= 8)                          score++;
  if (/[0-9]/.test(pw))                        score++;
  if (/[A-Z]/.test(pw) || /[!@#$%]/.test(pw)) score++;
  const colors = ['#b03030', '#c87010', '#d4a843', '#2d7a4f'];
  const widths = ['25%', '50%', '75%', '100%'];
  bar.style.width      = score ? widths[score - 1]  : '0';
  bar.style.background = score ? colors[score - 1] : '#3a3a3a';
}

// ── HELPERS ─────────────────────────────────────────────
const DAYS_PT   = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function getBizType(id) {
  return BUSINESS_TYPES.find(b => b.id === id) || BUSINESS_TYPES[0];
}

function generateSlots(settings) {
  const slots = [];
  const [sh, sm] = settings.startTime.split(':').map(Number);
  const [eh, em] = settings.endTime.split(':').map(Number);
  const iv = parseInt(settings.intervalMin);
  let cur = sh * 60 + sm, end = eh * 60 + em, ls = null, le = null;
  if (settings.lunchBreak !== 'none') {
    const [a, b] = settings.lunchBreak.split('-');
    const [lsh, lsm] = a.split(':').map(Number);
    const [leh, lem] = b.split(':').map(Number);
    ls = lsh * 60 + lsm;
    le = leh * 60 + lem;
  }
  while (cur < end) {
    if (ls !== null && cur >= ls && cur < le) { cur += iv; continue; }
    slots.push(`${String(Math.floor(cur / 60)).padStart(2,'0')}:${String(cur % 60).padStart(2,'0')}`);
    cur += iv;
  }
  return slots;
}

function getWeekDays() {
  const settings = loadSettings(), days = [], now = new Date();
  let i = 0;
  while (days.length < 6 && i < 30) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dow = d.getDay(), key = d.toISOString().slice(0, 10);
    if (settings.workDays.includes(dow))
      days.push({ date: d, key, name: DAYS_PT[dow], label: `${d.getDate()} ${MONTHS_PT[d.getMonth()]}` });
    i++;
  }
  return days;
}

function slotDateTime(dayKey, time) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(dayKey + 'T00:00:00');
  d.setHours(h, m, 0, 0);
  return d;
}

function isShopOpen() {
  const settings = loadSettings();
  const now = new Date(), dow = now.getDay();
  if (!settings.workDays.includes(dow)) return false;
  if (settings.offDates.includes(now.toISOString().slice(0, 10))) return false;
  if (settings.locked) return false;
  const [sh, sm] = settings.startTime.split(':').map(Number);
  const [eh, em] = settings.endTime.split(':').map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= sh * 60 + sm && mins < eh * 60 + em;
}

function getFreeSlots(dayKey) {
  const db = loadDB(), settings = loadSettings();
  const shopSlots = generateSlots(settings);
  const dayAppts  = db.appointments[dayKey] || {};
  const now       = new Date(), todayKey = now.toISOString().slice(0, 10);
  if (settings.offDates.includes(dayKey))          return [];
  if (settings.locked && dayKey === todayKey)       return [];
  return shopSlots.filter(time => {
    if (dayAppts[time]) {
      if (dayAppts[time].cancelled) return true;
      return !!dayAppts[time].freed;
    }
    if (dayKey === todayKey && slotDateTime(dayKey, time) < now) return false;
    return true;
  });
}

function isJustFreed(dayKey, time) {
  const db   = loadDB();
  const appt = db.appointments[dayKey]?.[time];
  if (!appt) return false;
  if (appt.freed)     return (Date.now() - appt.freedAt)     < 5 * 60 * 1000;
  if (appt.cancelled) return (Date.now() - appt.cancelledAt) < 5 * 60 * 1000;
  return false;
}

function genCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

// ── SCREEN MANAGEMENT ───────────────────────────────────
let currentDay = null, selectedSlot = null, lastBooking = null;

function showScreen(id) {
  document.querySelectorAll('#main-app .screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ── LANDING PAGE ────────────────────────────────────────
function renderLanding() {
  const settings = loadSettings();
  const biz = getBizType(settings.bizType);

  document.getElementById('header-shop-name').textContent = settings.shopName;
  document.getElementById('header-biz-type').textContent  = biz.label;
  document.getElementById('hero-shop-name').textContent   = settings.shopName;
  document.getElementById('hero-barber-name').textContent = settings.barberName;
  document.getElementById('hero-biz-label').textContent   = biz.label;

  const addrEl = document.getElementById('hero-address');
  addrEl.textContent    = settings.shopAddress || '';
  addrEl.style.display  = settings.shopAddress ? 'block' : 'none';

  document.title = settings.shopName + ' • Agendio';
  document.documentElement.style.setProperty('--accent', biz.color);

  const badge = document.getElementById('open-status-badge');
  badge.innerHTML = isShopOpen()
    ? `<div class="open-badge"><div class="open-dot"></div>Aberto agora</div>`
    : `<div class="closed-badge">🔴 Fechado no momento</div>`;

  const strip = document.getElementById('hours-strip');
  strip.innerHTML = getWeekDays().slice(0, 3).map(day => {
    const free = getFreeSlots(day.key);
    return `<div class="hour-block"><div class="hday">${day.name.slice(0,3)}</div>${free.length} livres</div>`;
  }).join('');

  renderHotSlots();
}

function renderHotSlots() {
  const section  = document.getElementById('hot-slots-section');
  const db       = loadDB();
  const todayKey = new Date().toISOString().slice(0, 10);
  const now      = new Date();
  const hot      = [];

  Object.keys(db.appointments[todayKey] || {}).forEach(time => {
    const appt = db.appointments[todayKey][time];
    if (!appt) return;
    const isHot =
      (appt.freed     && (Date.now() - appt.freedAt)     < 10 * 60 * 1000) ||
      (appt.cancelled && (Date.now() - appt.cancelledAt) < 10 * 60 * 1000);
    if (isHot && slotDateTime(todayKey, time) > now) hot.push(time);
  });

  if (!hot.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  section.innerHTML = `
    <div class="hot-slots">
      <div class="hot-slots-title">🔥 Horários disponíveis agora — Hoje</div>
      ${hot.map(t => `
        <div class="hot-slot-item">
          <div>
            <span class="hot-slot-time">${t}</span>
            <span class="hot-slot-label">⚡ Acabou de abrir</span>
          </div>
          <button class="book-now-btn" onclick="quickBook('${todayKey}','${t}')">Agendar agora</button>
        </div>`).join('')}
    </div>`;
}

function quickBook(dayKey, time) {
  const day = getWeekDays().find(d => d.key === dayKey);
  if (!day) return;
  currentDay   = day;
  selectedSlot = time;
  document.getElementById('booking-summary').innerHTML =
    `<strong>📅 Dia:</strong> ${day.name}, ${day.label}<br><strong>🕐 Horário:</strong> ${time}`;
  document.getElementById('client-name').value  = '';
  document.getElementById('client-phone').value = '';
  showScreen('screen-form');
}

// ── DAYS & SLOTS ────────────────────────────────────────
function renderDays() {
  const grid     = document.getElementById('days-grid');
  const days     = getWeekDays();
  const settings = loadSettings();
  const todayKey = new Date().toISOString().slice(0, 10);
  const banner   = document.getElementById('lock-banner');

  settings.locked ? banner.classList.add('visible') : banner.classList.remove('visible');
  grid.innerHTML = '';

  if (!days.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--mid);padding:26px 0;">
      Configure os dias de trabalho no painel admin</div>`;
    return;
  }

  days.forEach(day => {
    const isOff    = settings.offDates.includes(day.key);
    const isLocked = settings.locked && day.key === todayKey;
    const free     = (!isOff && !isLocked) ? getFreeSlots(day.key) : [];
    const hasAny   = free.length > 0;
    const justFreed = free.some(t => isJustFreed(day.key, t));

    const card = document.createElement('div');
    card.className = 'day-card' +
      (isOff      ? ' day-off'    :
       isLocked   ? ' locked-day' :
       !hasAny    ? ' no-slots'   :
       justFreed  ? ' has-available' : '');

    const status = isOff     ? 'Folga'          :
                   isLocked  ? '🔒 Fechado hoje' :
                   !hasAny   ? 'Sem horários'    :
                   `<span>${free.length}</span> horários livres`;

    card.innerHTML = `
      <div class="day-name">${day.name}</div>
      <div class="day-date">${day.label}</div>
      <div class="slot-count">${status}</div>`;

    if (hasAny) card.onclick = () => openDay(day);
    grid.appendChild(card);
  });
}

function openDay(day) {
  currentDay   = day;
  selectedSlot = null;
  document.getElementById('slots-day-title').textContent = day.name;
  document.getElementById('slots-day-date').textContent  = day.label;
  renderSlots();
  showScreen('screen-slots');
}

function renderSlots() {
  const grid = document.getElementById('slots-grid');
  const free = getFreeSlots(currentDay.key);
  grid.innerHTML = '';

  if (!free.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--mid);padding:16px 0;">
      Sem horários disponíveis</div>`;
  }
  free.forEach(time => {
    const freed = isJustFreed(currentDay.key, time);
    const btn   = document.createElement('button');
    btn.className  = 'slot-btn' + (freed ? ' just-freed' : '');
    btn.textContent = time;
    btn.onclick    = () => selectSlot(time, btn);
    grid.appendChild(btn);
  });
  document.getElementById('btn-continue-slots').disabled = true;
}

function selectSlot(time, btn) {
  selectedSlot = time;
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('btn-continue-slots').disabled = false;
}

function showFormScreen() {
  document.getElementById('booking-summary').innerHTML =
    `<strong>📅 Dia:</strong> ${currentDay.name}, ${currentDay.label}<br><strong>🕐 Horário:</strong> ${selectedSlot}`;
  document.getElementById('client-name').value  = '';
  document.getElementById('client-phone').value = '';
  showScreen('screen-form');
}

// ── CONFIRM BOOKING ─────────────────────────────────────
function confirmBooking() {
  const name  = document.getElementById('client-name').value.trim();
  const phone = document.getElementById('client-phone').value.trim();
  if (!name)  { showToast('Digite seu nome',     true); return; }
  if (!phone) { showToast('Digite seu telefone', true); return; }

  const db = loadDB();
  if (!db.appointments[currentDay.key]) db.appointments[currentDay.key] = {};
  const existing = db.appointments[currentDay.key][selectedSlot];
  if (existing && !existing.freed && !existing.cancelled) {
    showToast('Horário ocupado 😬', true);
    showScreen('screen-slots');
    renderSlots();
    return;
  }

  const code = genCode();
  db.appointments[currentDay.key][selectedSlot] = {
    name, phone,
    bookedAt: Date.now(),
    arrived: false,
    freed: false, freedAt: null,
    countdownStart: null,
    cancelled: false, cancelledAt: null,
    code,
  };
  saveDB(db);

  lastBooking = { name, phone, day: currentDay, slot: selectedSlot, code };

  const settings = loadSettings();
  const biz      = getBizType(settings.bizType);

  document.getElementById('success-details').innerHTML = `
    <div class="row"><span>Cliente</span><span>${name}</span></div>
    <div class="row"><span>Telefone</span><span>${phone}</span></div>
    <div class="row"><span>Dia</span><span>${currentDay.name}, ${currentDay.label}</span></div>
    <div class="row"><span>Horário</span><span>${selectedSlot}</span></div>
    <div class="row"><span>${biz.label}</span><span>${settings.shopName}</span></div>`;

  document.getElementById('cancel-code-display').textContent = code;

  const notice = document.getElementById('reminder-notice');
  notice.style.display = (settings.rem1h && settings.waNumber) ? 'block' : 'none';

  showScreen('screen-success');
  showToast('Agendamento confirmado! ✅');
}

// ── WHATSAPP ────────────────────────────────────────────
function openWhatsApp() {
  if (!lastBooking) return;
  const settings = loadSettings();
  const biz      = getBizType(settings.bizType);
  const { name, day, slot, code } = lastBooking;

  const msg = `Olá! Acabei de agendar um(a) *${biz.service}* em *${settings.shopName}*.\n\n` +
              `${biz.icon} *${day.name}, ${day.label} às ${slot}*\n` +
              `Nome: ${name}\nCódigo: ${code}\n\nAguardo confirmação!`;

  const waNum = settings.waNumber || '';
  const url   = waNum
    ? `https://wa.me/55${waNum}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ── CANCELLATION ────────────────────────────────────────
function showCancelScreen() {
  document.getElementById('cancel-code-input').value = '';
  document.getElementById('cancel-result').innerHTML = '';
  showScreen('screen-cancel');
}

function processCancellation() {
  const inputCode = document.getElementById('cancel-code-input').value.trim().toUpperCase();
  if (!inputCode || inputCode.length < 4) { showToast('Digite o código completo', true); return; }

  const db = loadDB();
  let found = false;

  Object.keys(db.appointments).forEach(dayKey => {
    Object.keys(db.appointments[dayKey]).forEach(time => {
      const appt = db.appointments[dayKey][time];
      if (!appt || appt.cancelled || appt.arrived) return;
      if (appt.code !== inputCode) return;

      found = true;
      const diff = slotDateTime(dayKey, time).getTime() - Date.now();
      if (diff < 30 * 60 * 1000 && diff > 0) {
        document.getElementById('cancel-result').innerHTML =
          `<div style="background:#2a1010;border:1px solid var(--red);border-radius:8px;padding:13px;font-size:13px;color:#e08080;">
            ⚠️ Cancelamento não permitido — faltam menos de 30 minutos.
          </div>`;
        return;
      }

      db.appointments[dayKey][time].cancelled   = true;
      db.appointments[dayKey][time].cancelledAt = Date.now();
      saveDB(db);

      const [y, m, d] = dayKey.split('-');
      document.getElementById('cancel-result').innerHTML =
        `<div style="background:#0d2a1a;border:1px solid var(--green);border-radius:8px;padding:13px;font-size:13px;color:#80e0a0;">
          ✅ Cancelado com sucesso! Horário <strong>${time}</strong> de ${d}/${m} foi liberado.
        </div>`;
      renderDays();
      renderLanding();
      showToast('Horário cancelado e liberado');
    });
  });

  if (!found) {
    document.getElementById('cancel-result').innerHTML =
      `<div style="background:#2a1010;border:1px solid var(--red);border-radius:8px;padding:13px;font-size:13px;color:#e08080;">
        ❌ Código não encontrado.
      </div>`;
  }
}

// ── ADMIN AUTH ──────────────────────────────────────────
function goToLogin() {
  if (sessionStorage.getItem('af_ok')) showAdminPanel();
  else showScreen('screen-login');
}

function adminLogin() {
  const pw = document.getElementById('admin-password').value;
  if (pw === getAdminPw()) {
    sessionStorage.setItem('af_ok', '1');
    showAdminPanel();
  } else {
    showToast('Senha incorreta', true);
  }
}

function adminLogout() {
  sessionStorage.removeItem('af_ok');
  showScreen('screen-landing');
}

// ── CHANGE PASSWORD ─────────────────────────────────────
function changePassword() {
  const cur  = document.getElementById('pw-current').value;
  const nw   = document.getElementById('pw-new').value;
  const conf = document.getElementById('pw-confirm').value;

  if (cur !== getAdminPw())   { showToast('Senha atual incorreta', true); return; }
  if (nw.length < 4)          { showToast('Nova senha muito curta (mín. 4)', true); return; }
  if (nw !== conf)            { showToast('As senhas não conferem', true); return; }

  setAdminPw(nw);
  document.getElementById('pw-current').value = '';
  document.getElementById('pw-new').value     = '';
  document.getElementById('pw-confirm').value = '';
  document.getElementById('pw-bar2').style.width = '0';
  showToast('✅ Senha alterada com sucesso!');
}

// ── ADMIN PANEL ─────────────────────────────────────────
let adminDaySelected = null, currentAdminTab = 'agenda';

function showAdminPanel() {
  const days = getWeekDays();
  if (!adminDaySelected && days.length) adminDaySelected = days[0].key;
  switchAdminTab(currentAdminTab);
  showScreen('screen-admin');
}

function switchAdminTab(tab, btnEl) {
  currentAdminTab = tab;
  document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) {
    btnEl.classList.add('active');
  } else {
    const idx  = ['agenda','lock','reminder','settings','security'].indexOf(tab);
    const btns = document.querySelectorAll('.admin-nav-btn');
    if (btns[idx]) btns[idx].classList.add('active');
  }
  ['agenda','lock','reminder','settings','security'].forEach(t => {
    document.getElementById('admin-tab-' + t).style.display = t === tab ? 'block' : 'none';
  });
  if (tab === 'agenda')   renderAgendaTab();
  if (tab === 'lock')     renderLockTab();
  if (tab === 'reminder') renderReminderTab();
  if (tab === 'settings') renderSettingsTab();
}

function renderAgendaTab() {
  const days     = getWeekDays();
  const settings = loadSettings();
  const tabs     = document.getElementById('admin-day-tabs');
  tabs.innerHTML = '';

  days.forEach(day => {
    const t     = document.createElement('div');
    const isOff = settings.offDates.includes(day.key);
    t.className  = 'day-tab' + (day.key === adminDaySelected ? ' active' : '') + (isOff ? ' is-off' : '');
    t.textContent = day.name.slice(0, 3) + ' ' + day.date.getDate();
    t.onclick = () => { adminDaySelected = day.key; renderAgendaTab(); };
    tabs.appendChild(t);
  });
  renderAdminAppointments();
}

function renderAdminAppointments() {
  const db        = loadDB(), settings = loadSettings();
  const shopSlots = generateSlots(settings);
  const appts     = db.appointments[adminDaySelected] || {};
  const container = document.getElementById('admin-appointments');
  container.innerHTML = '';

  if (settings.offDates.includes(adminDaySelected)) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🚫</div>Dia de folga</div>`;
    return;
  }

  const booked = shopSlots.filter(t => appts[t] && !appts[t].freed);
  if (!booked.length) {
    container.innerHTML = `<div class="empty-state"><div class="icon">📋</div>Nenhum agendamento neste dia</div>`;
    return;
  }

  booked.forEach(time => {
    const appt = appts[time];
    const card = document.createElement('div');
    card.className = 'appointment-card' +
      (appt.arrived   ? ' arrived'        : '') +
      (appt.cancelled ? ' cancelled-card' : '');

    let actionHtml = '';
    if (appt.cancelled) {
      actionHtml = `<span class="cancelled-badge">✗ Cancelado</span>`;
    } else if (appt.arrived) {
      actionHtml = `<span class="arrived-badge">✓ Chegou</span>`;
    } else {
      const cdInfo = getCountdownInfo(appt);
      const cdHtml = cdInfo.active
        ? `<span class="countdown-badge" id="cd-${adminDaySelected}-${time.replace(':','')}">⏱ ${cdInfo.label}</span>`
        : '';
      actionHtml = `${cdHtml}<button class="arrived-btn" onclick="markArrived('${adminDaySelected}','${time}')">✓ Chegou</button>`;
    }

    const biz = getBizType(settings.bizType);
    const reminderMsg = encodeURIComponent(
      `Olá ${appt.name}! Lembrete: seu ${biz.service} em ${settings.shopName} é hoje às ${time}. Te esperamos! ${biz.icon}`
    );
    const waLink = settings.waNumber
      ? `<a href="https://wa.me/55${settings.waNumber}?text=${reminderMsg}" target="_blank" style="font-size:11px;color:var(--wa);text-decoration:none;">📲 Lembrete WA</a>`
      : '';

    card.innerHTML = `
      <div class="time-badge">${time}</div>
      <div class="client-name">${appt.name}</div>
      <div class="client-phone">📱 ${appt.phone}</div>
      <div class="card-bottom">
        <div style="display:flex;flex-direction:column;gap:2px;">
          ${waLink}
          <span style="font-size:10px;color:var(--mid);">Ag. ${formatRelativeTime(appt.bookedAt)}</span>
        </div>
        <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;">${actionHtml}</div>
      </div>`;
    container.appendChild(card);
  });
}

function getCountdownInfo(appt) {
  if (!appt.countdownStart) return { active: false };
  const rem = NO_SHOW_TIMEOUT - (Date.now() - appt.countdownStart);
  if (rem <= 0) return { active: false };
  return {
    active: true,
    label: `${Math.floor(rem / 60000)}:${String(Math.floor((rem % 60000) / 1000)).padStart(2,'0')}`,
  };
}

function markArrived(dayKey, time) {
  const db = loadDB();
  if (!db.appointments[dayKey]?.[time]) return;
  db.appointments[dayKey][time].arrived        = true;
  db.appointments[dayKey][time].countdownStart = null;
  saveDB(db);
  renderAdminAppointments();
  showToast('✓ Marcado como chegou!');
}

function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000)    return 'agora';
  if (diff < 3600000)  return `há ${Math.floor(diff / 60000)}min`;
  return `há ${Math.floor(diff / 3600000)}h`;
}

// ── LOCK TAB ────────────────────────────────────────────
function renderLockTab() {
  const settings = loadSettings();
  const box      = document.getElementById('lock-box-container');

  if (settings.locked) {
    const since = settings.lockedSince
      ? new Date(settings.lockedSince).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '—';
    box.innerHTML = `
      <div class="lock-box">
        <h3>🔒 Agenda Bloqueada</h3>
        <div class="lock-status"><div class="lock-dot red"></div>Bloqueada desde ${since}</div>
        <p>Nenhum novo agendamento pode ser feito. Agendamentos existentes continuam confirmados.</p>
        <button class="btn btn-green" onclick="toggleLock(false)">✅ Reabrir Agenda</button>
      </div>
      <div class="info-box">💡 O bloqueio não cancela agendamentos existentes — apenas impede novos.</div>`;
  } else {
    box.innerHTML = `
      <div class="lock-box unlocked">
        <h3>Controle de Disponibilidade</h3>
        <div class="lock-status"><div class="lock-dot"></div>Agenda aberta normalmente</div>
        <p>Use o bloqueio de emergência para pausar novos agendamentos temporariamente.</p>
        <button class="btn btn-danger" onclick="toggleLock(true)">🔒 Fechar Agenda Agora</button>
      </div>
      <div class="info-box">💡 Útil para emergências, saída inesperada ou qualquer imprevisto.</div>`;
  }
}

function toggleLock(lock) {
  const settings    = loadSettings();
  settings.locked   = lock;
  settings.lockedSince = lock ? Date.now() : null;
  persistSettings(settings);
  renderLockTab();
  renderDays();
  renderLanding();
  showToast(lock ? '🔒 Agenda fechada' : '✅ Agenda reaberta!');
}

// ── REMINDER TAB ────────────────────────────────────────
function renderReminderTab() {
  const settings = loadSettings();
  document.getElementById('rem-1h').checked      = settings.rem1h !== false;
  document.getElementById('rem-morning').checked = !!settings.remMorning;
  document.getElementById('wa-number').value     = settings.waNumber || '';
}

function saveReminderSettings() {
  const settings       = loadSettings();
  settings.rem1h       = document.getElementById('rem-1h').checked;
  settings.remMorning  = document.getElementById('rem-morning').checked;
  settings.waNumber    = document.getElementById('wa-number').value.replace(/\D/g, '');
  persistSettings(settings);
  showToast('✅ Configurações salvas!');
}

// ── SETTINGS TAB ────────────────────────────────────────
function renderSettingsTab() {
  const settings  = loadSettings();
  const DAY_NAMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  const sel = document.getElementById('biz-type-select');
  sel.innerHTML = '';
  BUSINESS_TYPES.forEach(bt => {
    const o = document.createElement('option');
    o.value       = bt.id;
    o.textContent = bt.icon + ' ' + bt.label;
    if (bt.id === settings.bizType) o.selected = true;
    sel.appendChild(o);
  });

  document.getElementById('shop-name').value    = settings.shopName;
  document.getElementById('barber-name').value  = settings.barberName;
  document.getElementById('shop-address').value = settings.shopAddress || '';

  const wdg = document.getElementById('work-days-grid');
  wdg.innerHTML = '';
  [1, 2, 3, 4, 5, 6, 0].forEach(dow => {
    const d = document.createElement('div');
    d.className    = 'day-toggle' + (settings.workDays.includes(dow) ? ' on' : '');
    d.textContent  = DAY_NAMES[dow];
    d.dataset.dow  = dow;
    d.onclick      = () => d.classList.toggle('on');
    wdg.appendChild(d);
  });

  document.getElementById('work-start').value    = settings.startTime;
  document.getElementById('work-end').value      = settings.endTime;
  document.getElementById('slot-interval').value = settings.intervalMin;
  document.getElementById('lunch-break').value   = settings.lunchBreak;
  renderOffDates(settings.offDates);
}

function renderOffDates(offDates) {
  const list = document.getElementById('off-dates-list');
  list.innerHTML = '';
  if (!offDates.length) {
    list.innerHTML = `<p style="font-size:12px;color:var(--mid);margin-bottom:7px;">Nenhuma folga cadastrada</p>`;
    return;
  }
  [...offDates].sort().forEach(d => {
    const [y, m, day] = d.split('-');
    const item = document.createElement('div');
    item.className = 'off-date-item';
    item.innerHTML = `<span>🚫 ${day}/${m}/${y}</span><button class="remove-btn" onclick="removeOffDate('${d}')">×</button>`;
    list.appendChild(item);
  });
}

function addOffDate() {
  const val = document.getElementById('new-off-date').value;
  if (!val) { showToast('Selecione uma data', true); return; }
  const settings = loadSettings();
  if (settings.offDates.includes(val)) { showToast('Data já cadastrada', true); return; }
  settings.offDates.push(val);
  persistSettings(settings);
  renderOffDates(settings.offDates);
  document.getElementById('new-off-date').value = '';
  showToast('Folga adicionada!');
}

function removeOffDate(d) {
  const settings    = loadSettings();
  settings.offDates = settings.offDates.filter(x => x !== d);
  persistSettings(settings);
  renderOffDates(settings.offDates);
  showToast('Removido');
}

function saveSettings() {
  const settings = loadSettings();
  settings.bizType     = document.getElementById('biz-type-select').value;
  settings.shopName    = document.getElementById('shop-name').value.trim()    || 'Meu Negócio';
  settings.barberName  = document.getElementById('barber-name').value.trim()  || 'Profissional';
  settings.shopAddress = document.getElementById('shop-address').value.trim();

  const toggles    = document.querySelectorAll('.day-toggle');
  settings.workDays = [];
  toggles.forEach(t => { if (t.classList.contains('on')) settings.workDays.push(parseInt(t.dataset.dow)); });

  settings.startTime  = document.getElementById('work-start').value;
  settings.endTime    = document.getElementById('work-end').value;
  settings.intervalMin = parseInt(document.getElementById('slot-interval').value);
  settings.lunchBreak = document.getElementById('lunch-break').value;

  if (settings.startTime >= settings.endTime) { showToast('Horário de início deve ser antes do fim', true); return; }
  if (!settings.workDays.length)              { showToast('Selecione ao menos um dia', true); return; }

  persistSettings(settings);
  renderDays();
  renderLanding();
  showToast('✅ Configurações salvas!');
}

// ── NO-SHOW TIMER ───────────────────────────────────────
function checkNoShows() {
  const db       = loadDB();
  const now      = Date.now();
  const todayKey = new Date().toISOString().slice(0, 10);
  let changed    = false;

  Object.keys(db.appointments[todayKey] || {}).forEach(time => {
    const appt = db.appointments[todayKey][time];
    if (!appt || appt.arrived || appt.freed || appt.cancelled) return;

    const slotMs = slotDateTime(todayKey, time).getTime();
    if (now >= slotMs && !appt.countdownStart) {
      db.appointments[todayKey][time].countdownStart = slotMs;
      changed = true;
    }
    if (appt.countdownStart && (now - appt.countdownStart) >= NO_SHOW_TIMEOUT) {
      db.appointments[todayKey][time].freed   = true;
      db.appointments[todayKey][time].freedAt = now;
      changed = true;
      showToast(`⚡ ${time} liberado — cliente não chegou`);
    }
  });

  if (changed) {
    saveDB(db);
    renderDays();
    renderLanding();
    if (document.getElementById('screen-admin').classList.contains('active') && currentAdminTab === 'agenda')
      renderAdminAppointments();
  }
}

function updateCountdowns() {
  const todayKey = new Date().toISOString().slice(0, 10);
  const db       = loadDB();
  Object.keys(db.appointments[todayKey] || {}).forEach(time => {
    const appt = db.appointments[todayKey][time];
    if (!appt || appt.arrived || appt.freed || appt.cancelled || !appt.countdownStart) return;
    const el = document.getElementById(`cd-${todayKey}-${time.replace(':', '')}`);
    if (!el) return;
    const info = getCountdownInfo(appt);
    if (info.active) el.textContent = `⏱ ${info.label}`;
  });
}

// ── TOAST ───────────────────────────────────────────────
let toastTimer;
function showToast(msg, warn = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = warn ? 'warn' : '';
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3400);
}

// ── BOOT ────────────────────────────────────────────────
function bootApp() {
  renderLanding();
  renderDays();
  setInterval(checkNoShows,   15000);
  setInterval(updateCountdowns, 1000);
  setInterval(() => { renderDays(); renderLanding(); }, 60000);
  checkNoShows();
}

// ── ENTRY POINT ─────────────────────────────────────────
if (isSetupDone()) {
  document.getElementById('setup-wizard').style.display = 'none';
  document.getElementById('main-app').style.display     = 'block';
  bootApp();
} else {
  document.getElementById('setup-wizard').style.display = 'flex';
  document.getElementById('main-app').style.display     = 'none';
  initWizard();
}
