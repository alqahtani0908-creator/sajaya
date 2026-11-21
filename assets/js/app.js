/* ===== الهيكل العام والتوجيه والدخول ===== */
const V = {};      // الشاشات
const A = {};      // الإجراءات
const ADMIN = ['director', 'assistant'];
const ACCESS = {
  dashboard: ADMIN, associations: ADMIN, association: ADMIN, stages: ADMIN, files: ADMIN, meetings: ADMIN, evaluation: ADMIN, notifications: ADMIN, reports: ADMIN, audit: ADMIN, settings: ADMIN,
  evaluate: ['director', 'assistant', 'evaluator'], 'eval-home': ['evaluator'], report: ['director', 'assistant', 'evaluator', 'assoc'],
  home: ['assoc'], requirements: ['assoc'], 'my-meetings': ['assoc'], 'my-results': ['assoc'], alerts: ['assoc'], profile: ['assoc'],
};
const HOME = { director: 'dashboard', assistant: 'dashboard', evaluator: 'eval-home', assoc: 'home' };
const go = p => { location.hash = '#/' + p; };
const allowed = (u, name) => S.rolesOf(u).some(r => ACCESS[name].includes(r));
let lastRoute = '';

// القائمة تُبنى من اتحاد أدوار المستخدم، فمن يجمع «مساعد إداري + مقيّم» يرى الأقسام معًا دون تكرار
function navFor(u) {
  if (S.has(u, 'assoc')) return [
    ['', [['home', 'home', 'لوحة الجمعية'], ['requirements', 'clipboard', 'المتطلبات والملفات'], ['my-meetings', 'video', 'اللقاءات والمهام'], ['my-results', 'award', 'نتائج التقييم']]],
    ['المتابعة', [['alerts', 'bell', 'التنبيهات', S.unread(u)], ['report/assoc/' + u.assocId, 'chart', 'تقرير الأداء'], ['profile', 'building', 'بيانات الجمعية']]],
  ];
  const out = [], adm = S.isAdmin(u);
  const myTasks = S.has(u, 'evaluator') ? Object.keys(S.db.tracks).reduce((t, k) => t + (S.db.tracks[k].locked && !S.db.tracks[k].approved ? Object.keys(S.db.assign[k] || {}).filter(id => S.assigned(k, id).includes(u.id) && !(S.evalOf(k, id, u.id) || {}).done).length : 0), 0) : 0;
  if (adm) {
    const pend = Object.values(S.db.subs).filter(s => s.status === 'pending').length;
    out.push(['', [['dashboard', 'grid', 'لوحة المؤشرات']]],
      ['إدارة المبادرة', [['associations', 'building', 'الجمعيات'], ['stages', 'layers', 'المراحل والمتطلبات'], ['files', 'file', 'الوثائق والشواهد', pend], ['meetings', 'video', 'اللقاءات والمهام']]]);
  }
  const ev = [];
  if (adm) ev.push(['evaluation', 'award', 'التقييم والنتائج']);
  if (S.has(u, 'evaluator')) ev.push(['eval-home', 'star', 'مهام التقييم', myTasks]);
  out.push([adm ? 'التقييم' : '', ev]);
  if (adm) out.push(['التواصل والتقارير', [['notifications', 'bell', 'الإشعارات والمراسلات', S.unread(u)], ['reports', 'chart', 'التقارير']]],
    ['النظام', [['audit', 'history', 'سجل العمليات'], ['settings', 'settings', 'الإعدادات والصلاحيات']]]);
  return out;
}
const roleChips = u => S.rolesOf(u).map(r => `<span class="rchip">${S.ROLES[r]}</span>`).join('');

function shell(u, name, v) {
  const a = u.assocId ? S.assoc(u.assocId) : null;
  const cur = location.hash.replace(/^#\/?/, '');
  const isOn = p => cur === p || name === p || (p === 'associations' && name === 'association') || (p === 'evaluation' && name === 'evaluate' && !cur.includes('/mine')) || (p === 'eval-home' && name === 'evaluate' && cur.includes('/mine')) || (p === 'reports' && name === 'report' && !S.has(u, 'assoc'));
  const nav = navFor(u).map(([g, items]) => (g ? `<div class="grp">${g}</div>` : '') + items.map(([p, ic, t, ct]) => `<a class="ni ${isOn(p) ? 'on' : ''}" href="#/${p}">${icon(ic)}<span>${t}</span>${ct ? `<span class="ct num">${AR(ct)}</span>` : ''}</a>`).join('')).join('');
  const demoAcc = [['u1', 'مدير المبادرة'], ['u2', 'مساعد إداري + مقيّمة'], ['u3', 'عضو لجنة التقييم'], ['ua1', 'جمعية مشاركة']];
  const bell = S.has(u, 'assoc') ? 'alerts' : S.isAdmin(u) ? 'notifications' : 'eval-home';
  return `<div class="shell" id="shell">
    <aside class="side">
      <a class="brand" href="index.html" style="color:#fff"><img src="assets/img/icon-white.svg" alt=""><span><b>منصة سجايا</b><small>قيم أصيلة.. وطباع نبيلة</small></span></a>
      <nav>${nav}</nav>
      <div class="spons"><div><small>تنفيذ</small><img src="assets/img/partners/itmam-white.png" alt="جمعية إتمام للتمكين القيمي للأيتام"></div><div><small>برعاية</small><img src="assets/img/partners/majed-logo-white.svg" alt="مؤسسة أبناء علي بن عثمان الماجد الأهلية"></div></div>
      <div class="me">${av(a ? a.short : u.name)}<span><b>${esc(a ? a.name : u.name)}</b><small>${a ? esc(u.name) : roleChips(u)}</small></span><button onclick="A.logout()" title="تسجيل الخروج" aria-label="تسجيل الخروج">${icon('logout')}</button></div>
    </aside>
    <div class="scrim" onclick="$('#shell').classList.remove('nav-open')"></div>
    <div class="main">
      <header class="top">
        <button class="btn sm icon ghost burger" onclick="$('#shell').classList.toggle('nav-open')" aria-label="القائمة">${icon('menu')}</button>
        <div class="grow" style="min-width:0"><div class="crumb">${esc(S.db.cycle)} ${v.crumb ? ' / ' + v.crumb : ''}</div><h1>${v.title}</h1></div>
        <button class="searchbtn noprint" onclick="A.palette()" aria-label="بحث سريع">${icon('search', 'sm')}<span>ابحث أو انتقل…</span><kbd>⌘K</kbd></button>
        <span class="demo-tag">عرض تجريبي</span>
        <select class="input sm noprint" style="width:auto" onchange="A.switchUser(this.value)" title="تبديل الحساب للعرض التجريبي" aria-label="تبديل الحساب">${demoAcc.map(([id, t]) => opt(id, t, demoAcc.some(d => d[0] === u.id) ? u.id : (S.has(u, 'assoc') ? 'ua1' : 'u3'))).join('')}</select>
        <a class="btn sm icon ghost bellb" href="#/${bell}" aria-label="التنبيهات">${icon('bell')}${S.unread(u) ? '<i></i>' : ''}</a>
      </header>
      <main class="page">${v.html}</main>
    </div>
  </div>`;
}

function render() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const name = parts[0] || '', u = S.user(), app = $('#app');
  closeModal();
  if (AUTH[name]) { app.innerHTML = AUTH[name](...parts.slice(1)); return; }
  if (!u) return go('login');
  if (!V[name] || !allowed(u, name)) return go(HOME[u.role]);
  const v = V[name](...parts.slice(1));
  if (!v) return go(HOME[u.role]);
  const keep = lastRoute === location.hash ? scrollY : 0; lastRoute = location.hash;
  app.innerHTML = shell(u, name, v);
  document.title = v.title.replace(/<[^>]+>/g, '') + ' — منصة سجايا';
  if (v.after) v.after();
  countUp();
  scrollTo(0, keep);
}
const R = render;
addEventListener('hashchange', render);
addEventListener('DOMContentLoaded', render);

/* البحث السريع: صفحات وجمعيات وإجراءات — ⌘K / Ctrl+K */
A.palette = () => {
  const u = S.user(); if (!u) return;
  const items = [];
  navFor(u).forEach(([, its]) => its.forEach(([p, ic, t]) => items.push({ t, s: 'صفحة', ic, go: p })));
  if (S.isAdmin(u)) {
    S.db.assocs.forEach(a => items.push({ t: a.name, s: a.city + ' · ' + S.STATUS[a.status].t, ic: 'building', go: 'association/' + a.id }));
    items.push({ t: 'مراجعة الملفات المعلّقة', s: 'إجراء', ic: 'check', go: 'files' }, { t: 'مراسلة الجمعيات المتأخرة', s: 'إجراء', ic: 'send', run: () => A.contactLate() }, { t: 'إضافة متطلب جديد', s: 'إجراء', ic: 'plus', run: () => { go('stages'); setTimeout(() => A.reqForm(), 60); } }, { t: 'توزيع المقيّمين', s: 'إجراء', ic: 'users', go: 'evaluation/exec/assign' }, { t: 'قوالب الرسائل', s: 'الإعدادات', ic: 'mail', go: 'settings/messages' });
  }
  if (S.has(u, 'evaluator')) Object.keys(S.db.tracks).forEach(k => Object.keys(S.db.assign[k] || {}).forEach(id => { if (S.assigned(k, id).includes(u.id) && S.db.tracks[k].locked) items.push({ t: S.assoc(id).name, s: 'تقييمي · ' + S.db.tracks[k].short, ic: 'star', go: `evaluate/${k}/${id}/mine` }); }));
  modal('', `<div class="pal"><div class="palin">${icon('search')}<input id="palQ" placeholder="اكتب اسم جمعية أو صفحة أو إجراء…" autocomplete="off"></div><div class="pall" id="palL"></div><div class="palf"><span><kbd>↑</kbd><kbd>↓</kbd> للتنقل</span><span><kbd>Enter</kbd> للفتح</span><span><kbd>Esc</kbd> للإغلاق</span></div></div>`);
  const m = $('#modal .modal'); m.classList.add('palm'); m.querySelector('.mh').style.display = 'none';
  let sel = 0, cur = [];
  const draw = () => { const q = $('#palQ').value.trim(); cur = items.filter(x => !q || (x.t + ' ' + x.s).includes(q)).slice(0, 9); sel = Math.min(sel, Math.max(0, cur.length - 1)); $('#palL').innerHTML = cur.map((x, i) => `<button class="pi ${i === sel ? 'on' : ''}" data-i="${i}"><span class="pic">${icon(x.ic, 'sm')}</span><span class="grow"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span>${icon('chev', 'sm')}</button>`).join('') || `<div class="empty small">لا نتائج مطابقة</div>`; $$('#palL .pi').forEach(b => b.onclick = () => pick(+b.dataset.i)); };
  const pick = i => { const x = cur[i]; if (!x) return; closeModal(); if (x.go) go(x.go); else x.run(); };
  $('#palQ').oninput = () => { sel = 0; draw(); };
  $('#palQ').onkeydown = e => { if (e.key === 'ArrowDown') { sel = Math.min(cur.length - 1, sel + 1); draw(); e.preventDefault(); } else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); } else if (e.key === 'Enter') pick(sel); };
  draw();
};
addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if ($('#modal')) closeModal(); else A.palette(); } });

A.logout = () => { S.logout(); go('login'); };
A.switchUser = id => { S.login(id); const u = S.user(); lastRoute = ''; if (location.hash === '#/' + HOME[u.role]) render(); else go(HOME[u.role]); };

/* ---------- الدخول والتسجيل ---------- */
const authWrap = (inner) => `<div class="auth">
  <div class="art">
    <a href="index.html" class="row" style="gap:12px;color:#fff;position:relative;z-index:1"><img src="assets/img/icon-white.svg" alt="" style="height:44px"><b style="font-family:var(--f-head);font-size:18px">منصة سجايا</b></a>
    <figure class="emb"><img src="assets/img/icon.svg" alt="رمز سجايا"><figcaption>اللؤلؤة في صدفتها</figcaption></figure>
    <div style="position:relative;z-index:1"><h2>المرجع الرقمي الموحّد<br>لمبادرة <em>سجايا</em></h2><p class="mt16">تسجيل الجمعيات، استقبال الوثائق والشواهد، التقييم، ومتابعة التنفيذ وقياس الأداء — في منصة واحدة.</p></div>
    <div class="foot"><span>برعاية</span><img src="assets/img/partners/majed-logo-white.svg" alt="مؤسسة أبناء علي بن عثمان الماجد الأهلية"><span style="width:1px;height:24px;background:rgba(255,255,255,.15)"></span><span>تنفيذ</span><img src="assets/img/partners/itmam-white.png" alt="جمعية إتمام للتمكين القيمي للأيتام"></div></div>
  <div class="frm"><div class="box"><img class="logo-m" src="assets/img/icon.svg" alt="">${inner}</div></div></div>`;

const AUTH = {
  login: () => authWrap(`
    <h1>تسجيل الدخول</h1><p class="muted">مرحبًا بكم في منصة سجايا الرقمية</p>
    <form class="grid mt24" onsubmit="return A.doLogin(event)">
      <div class="field"><label>البريد الإلكتروني</label><input class="input" name="email" type="email" required placeholder="name@example.org" dir="ltr" style="text-align:right"></div>
      <div class="field"><label>كلمة المرور</label><input class="input" name="pass" type="password" required placeholder="••••••••" dir="ltr" style="text-align:right"></div>
      <div class="row between small"><label class="row" style="gap:6px"><input type="checkbox"> تذكرني</label><a href="#/forgot">نسيت كلمة المرور؟</a></div>
      <button class="btn primary lg">دخول</button>
    </form>
    <div class="sep">دخول سريع للعرض التجريبي</div>
    <div class="demo">
      <button onclick="A.switchUser('u1')">${av('م')}<span><b>مدير المبادرة</b><small>إشراف واعتماد النتائج</small></span></button>
      <button onclick="A.switchUser('u2')">${av('س', 'alt')}<span><b>المساعد الإداري</b><small>الجمعيات والملفات والمراحل</small></span></button>
      <button onclick="A.switchUser('u3')">${av('ت', 'alt')}<span><b>لجنة التقييم</b><small>إدخال الدرجات والملاحظات</small></span></button>
      <button onclick="A.switchUser('ua1')">${av('ج')}<span><b>جمعية مشاركة</b><small>لوحة الجمعية ورفع الملفات</small></span></button>
    </div>
    <p class="small muted center mt24">جمعية جديدة؟ <a href="#/register">التسجيل الأولي</a> · <a href="index.html">الواجهة الرئيسية</a></p>`),

  forgot: () => authWrap(`
    <h1>استعادة الحساب</h1><p class="muted">أدخل بريد الجمعية وسنرسل رابط إعادة تعيين كلمة المرور.</p>
    <form class="grid mt24" onsubmit="event.preventDefault();toast('تم إرسال رابط إعادة التعيين إلى البريد المسجل','mail');go('login')">
      <div class="field"><label>البريد الإلكتروني</label><input class="input" type="email" required dir="ltr" style="text-align:right"></div>
      <button class="btn primary lg">إرسال الرابط</button>
    </form><p class="small center mt24"><a href="#/login">العودة لتسجيل الدخول</a></p>`),

  register: (done) => authWrap(done ? `
    <div class="center"><div class="av lg" style="margin:0 auto 16px">${icon('mail', 'lg')}</div>
    <h1>تم استلام طلب التسجيل</h1>
    <p class="muted mt8">أُرسل رابط تفعيل الحساب إلى بريد الجمعية. بعد التفعيل يمكنكم متابعة المراحل ورفع المتطلبات.</p>
    <div class="note info mt24" style="text-align:start">${icon('alert', 'sm')}<span>في العرض التجريبي يمكنك محاكاة فتح رابط التفعيل مباشرة.</span></div>
    <button class="btn primary lg mt16" onclick="A.activate('${esc(done)}')">تفعيل الحساب والدخول</button></div>` : `
    <h1>التسجيل الأولي للجمعيات</h1><p class="muted">سجّل بيانات الجمعية وممثلها المسؤول عن المبادرة.</p>
    <form class="grid mt24" id="regF" onsubmit="return A.doRegister(event)">
      <div class="field"><label>اسم الجمعية</label><input class="input" name="name" required placeholder="جمعية ... لرعاية الأيتام"></div>
      <div class="grid g2"><div class="field"><label>المدينة</label><input class="input" name="city" required></div><div class="field"><label>رقم الترخيص</label><input class="input" name="license" required inputmode="numeric"></div></div>
      <div class="grid g2"><div class="field"><label>اسم ممثل الجمعية</label><input class="input" name="rep" required></div><div class="field"><label>الصفة</label><input class="input" name="role" value="منسق المبادرة"></div></div>
      <div class="grid g2"><div class="field"><label>رقم الجوال</label><input class="input" name="phone" required placeholder="05xxxxxxxx" dir="ltr" style="text-align:right" pattern="05[0-9]{8}"></div><div class="field"><label>البريد الإلكتروني</label><input class="input" name="email" type="email" required dir="ltr" style="text-align:right"></div></div>
      <label class="row small" style="gap:8px;flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" required style="margin-top:5px"> <span>أقر بصحة البيانات ورغبة الجمعية في المشاركة في مبادرة سجايا وفق كراسة المواصفات والمعايير.</span></label>
      <button class="btn primary lg">إرسال طلب التسجيل</button>
    </form><p class="small muted center mt24">لديك حساب؟ <a href="#/login">تسجيل الدخول</a></p>`),
};

A.doLogin = e => {
  e.preventDefault(); const f = new FormData(e.target), u = S.db.users.find(x => x.email.toLowerCase() === String(f.get('email')).trim().toLowerCase());
  if (!u) return toast('البريد غير مسجل في المنصة', 'alert'), false;
  if (u.assocId && !S.assoc(u.assocId).active) return toast('الحساب غير مفعّل، راجع رابط التفعيل في بريدك', 'alert'), false;
  A.switchUser(u.id); return false;
};
A.doRegister = e => {
  e.preventDefault(); const d = formData('#regF'), n = S.db.assocs.length + 1, id = 'a' + Date.now().toString(36);
  if (S.db.users.some(u => u.email.toLowerCase() === d.email.toLowerCase())) return toast('هذا البريد مسجل مسبقًا', 'alert'), false;
  S.db.assocs.push({ id, name: d.name, short: d.name.replace(/^جمعية\s*/, '').split(' ')[0], city: d.city, license: d.license, rep: { name: d.rep, role: d.role, phone: d.phone, email: d.email }, status: 'initial', active: false, createdAt: new Date().toISOString(), p: .8 });
  S.db.users.push({ id: 'u' + id, role: 'assoc', name: d.rep, email: d.email, assocId: id });
  S.db.notifs.unshift({ id: S.uid(), to: 'admin', type: 'info', title: 'تسجيل أولي جديد', body: `سجّلت «${d.name}» في المبادرة وهي بانتظار التفعيل.`, at: new Date().toISOString(), by: '-', read: {} });
  S.save(); go('register/' + id); return false;
};
A.activate = id => { const a = S.assoc(id); if (!a) return go('login'); a.active = true; S.save(); A.switchUser('u' + id); toast('تم تفعيل الحساب، مرحبًا بكم في سجايا'); };
