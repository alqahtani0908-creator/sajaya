/* ===== أدوات الواجهة ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const pct = n => AR(n) + '٪';
const fmtD = d => d ? new Date(d).toLocaleDateString('ar-SA-u-ca-gregory-nu-arab', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDs = d => d ? new Date(d).toLocaleDateString('ar-SA-u-ca-gregory-nu-arab', { day: 'numeric', month: 'short' }) : '—';
const fmtDT = d => d ? new Date(d).toLocaleString('ar-SA-u-ca-gregory-nu-arab', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';
const fsize = b => b > 1048576 ? AR((b / 1048576).toFixed(1)) + ' م.ب' : AR(Math.round(b / 1024)) + ' ك.ب';
const daysTo = d => Math.ceil((new Date(d) - new Date(S.today())) / S.DAY);
function dueTxt(d) { const n = daysTo(d); return n < 0 ? `متأخر ${AR(-n)} يوم` : n === 0 ? 'اليوم' : n === 1 ? 'غدًا' : `بعد ${AR(n)} يوم`; }
function ago(d) { const m = Math.floor((Date.now() - new Date(d)) / 6e4); if (m < 1) return 'الآن'; if (m < 60) return `قبل ${AR(m)} دقيقة`; const h = Math.floor(m / 60); if (h < 24) return `قبل ${AR(h)} ساعة`; const dd = Math.floor(h / 24); return dd < 30 ? `قبل ${AR(dd)} يوم` : fmtD(d); }

const badge = (o, extra = '') => `<span class="badge ${o.c} ${extra}">${o.t}</span>`;
const stBadge = a => badge(S.STATUS[a.status]);
const fBadge = s => badge(S.FSTATUS[s]);
const hBadge = h => `<span class="badge ${S.HEALTH[h].c}">${S.HEALTH[h].t}</span>`;
const av = (name, cls = '') => `<span class="av ${cls}">${esc((name || '؟').replace(/^(جمعية|د\.|أ\.)\s*/, '').trim()[0] || '؟')}</span>`;
const bar = (v, cls = '') => `<div class="pbar"><div class="progress ${cls}"><i style="width:${v}%"></i></div><span class="num">${pct(v)}</span></div>`;
const empty = (t, ic = 'file') => `<div class="empty">${icon(ic)}<div>${t}</div></div>`;
const opt = (v, t, sel) => `<option value="${esc(v)}" ${v == sel ? 'selected' : ''}>${esc(t)}</option>`;

function ring(v, size = 170, label = '') {
  const r = size / 2 - 12, c = 2 * Math.PI * r;
  return `<div class="ringw" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5DA88B"/><stop offset="1" stop-color="#30908C"/></linearGradient></defs><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#EEF0F4" stroke-width="14"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#30908C" stroke-width="14" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - v / 100)}"/></svg><div class="c"><b class="num">${pct(v)}</b><span>${label}</span></div></div>`;
}

function toast(msg, ic = 'check') { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = icon(ic) + `<span>${esc(msg)}</span>`; $('#toasts').appendChild(t); setTimeout(() => { t.style.opacity = 0; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 3200); }
function modal(title, body, foot = '', wide = false) {
  closeModal();
  const m = document.createElement('div'); m.className = 'modal-bg'; m.id = 'modal';
  m.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><div class="mh"><h3>${title}</h3><button class="btn sm icon ghost" onclick="closeModal()" aria-label="إغلاق">${icon('x', 'sm')}</button></div><div class="mb">${body}</div>${foot ? `<div class="mf">${foot}</div>` : ''}</div>`;
  m.addEventListener('mousedown', e => { if (e.target === m) closeModal(); });
  document.body.appendChild(m);
  const f = $('input,select,textarea', m); if (f) setTimeout(() => f.focus(), 50);
}
function closeModal() { const m = $('#modal'); if (m) m.remove(); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
const formData = sel => Object.fromEntries(new FormData($(sel)).entries());

/* الرسوم البيانية */
const CH = {};
const PAL = ['#30908C', '#5DA88B', '#2E3143', '#8FC9B4', '#555B6D', '#C98A1B', '#3A78B8', '#B7BCC8'];
function chart(id, cfg) {
  const el = document.getElementById(id); if (!el || !window.Chart) return;
  if (CH[id]) CH[id].destroy();
  Chart.defaults.font.family = '"Thmanyah Serif Text", sans-serif'; Chart.defaults.font.size = 12; Chart.defaults.color = '#8A90A0'; Chart.defaults.locale = 'ar-SA';
  const base = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false, rtl: true, labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 16 } }, tooltip: { rtl: true, backgroundColor: '#2E3143', padding: 12, cornerRadius: 10, titleFont: { family: '"Thmanyah Serif Text"', weight: '500' } } } };
  const merge = (a, b) => { for (const k in b) a[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) ? merge(a[k] || {}, b[k]) : b[k]; return a; };
  cfg.options = merge(base, cfg.options || {});
  CH[id] = new Chart(el, cfg);
}
const axes = (o = {}) => ({ x: { grid: { display: false }, border: { display: false }, reverse: true, stacked: !!o.stacked, ticks: { maxRotation: 50, minRotation: 0, autoSkip: false } }, y: { position: 'right', beginAtZero: true, max: o.max, stacked: !!o.stacked, grid: { color: '#EEF0F4' }, border: { display: false }, ticks: { callback: o.pct ? v => AR(v) + '٪' : undefined } } });

/* تصدير */
function exportXlsx(rows, file, sheet = 'البيانات') {
  if (!window.XLSX) return toast('تعذر تحميل مكتبة التصدير، تحقق من الاتصال.', 'alert');
  const ws = XLSX.utils.json_to_sheet(rows); ws['!cols'] = Object.keys(rows[0] || {}).map(() => ({ wch: 24 }));
  const wb = XLSX.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] }; XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 30)); XLSX.writeFile(wb, file + '.xlsx');
  toast('تم تصدير الملف بصيغة Excel', 'download');
}
function downloadText(name, text, type = 'application/json') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }

/* شريط المراحل لجمعية */
function stepper(a) {
  return `<div class="stepper">${S.db.stages.map(s => { const st = S.stageState(a, s); return `<div class="step ${st}" title="${esc(s.desc)}"><div class="b">${st === 'done' ? icon('check', 'sm') : st === 'locked' ? icon('lock', 'sm') : AR(s.id)}</div><div class="t">${esc(s.name)}</div><div class="d">${st === 'open' ? pct(S.stageProgress(a, s)) + ' · جارية' : fmtDs(s.end)}</div></div>`; }).join('')}</div>`;
}
/* عدّاد الأرقام في بطاقات المؤشرات */
function countUp(root = document) {
  return; // الأرقام تُعرض مباشرة دون عدّاد متحرك
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const toL = t => t.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  $$('.kpi .v.num, .ringw .c b', root).forEach(el => {
    if (el.children.length) return;
    const txt = el.textContent, m = toL(txt).match(/^(\d+(?:\.\d+)?)(.*)$/); if (!m) return;
    const to = +m[1], dec = (m[1].split('.')[1] || '').length, suf = m[2], t0 = performance.now(), dur = 1100;
    const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = AR((to * e).toFixed(dec)) + suf; if (p < 1) requestAnimationFrame(step); else el.textContent = txt; };
    requestAnimationFrame(step);
  });
}
const stageStateTxt ={ done: { t: 'مكتملة', c: 'ok' }, open: { t: 'مفتوحة', c: 'warn' }, locked: { t: 'مغلقة', c: '' } };
