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
let lastRoute = '';

function navFor(u) {
  if (u.role === 'assoc') return [
    ['', [['home', 'home', 'لوحة الجمعية'], ['requirements', 'clipboard', 'المتطلبات والملفات'], ['my-meetings', 'video', 'اللقاءات والمهام'], ['my-results', 'award', 'نتائج التقييم']]],
    ['المتابعة', [['alerts', 'bell', 'التنبيهات', S.unread(u)], ['report/assoc/' + u.assocId, 'chart', 'تقرير الأداء'], ['profile', 'building', 'بيانات الجمعية']]],
  ];
  if (u.role === 'evaluator') return [['', [['eval-home', 'star', 'مهام التقييم']]]];
  const pend = Object.values(S.db.subs).filter(s => s.status === 'pending').length;
  return [
    ['', [['dashboard', 'grid', 'لوحة المؤشرات']]],
    ['إدارة المبادرة', [['associations', 'building', 'الجمعيات'], ['stages', 'layers', 'المراحل والمتطلبات'], ['files', 'file', 'الوثائق والشواهد', pend], ['meetings', 'video', 'اللقاءات والمهام']]],
    ['التقييم', [['evaluation', 'award', 'التقييم والنتائج']]],
    ['التواصل والتقارير', [['notifications', 'bell', 'الإشعارات والمراسلات', S.unread(u)], ['reports', 'chart', 'التقارير']]],
    ['النظام', [['audit', 'history', 'سجل العمليات'], ['settings', 'settings', 'الإعدادات والصلاحيات']]],
  ];
}

function shell(u, name, v) {
  const a = u.assocId ? S.assoc(u.assocId) : null;
  const cur = location.hash.replace(/^#\/?/, '');
  const nav = navFor(u).map(([g, items]) => (g ? `<div class="grp">${g}</div>` : '') + items.map(([p, ic, t, ct]) => `<a class="ni ${cur === p || name === p || (p === 'associations' && name === 'association') || (p === 'evaluation' && name === 'evaluate' && u.role !== 'evaluator') || (p === 'eval-home' && name === 'evaluate') || (p === 'reports' && name === 'report' && u.role !== 'assoc') ? 'on' : ''}" href="#/${p}">${icon(ic)}<span>${t}</span>${ct ? `<span class="ct num">${AR(ct)}</span>` : ''}</a>`).join('')).join('');
  const demoAcc = [['u1', 'مدير المبادرة'], ['u2', 'المساعد الإداري'], ['u3', 'لجنة التقييم'], ['ua1', 'جمعية مشاركة']];
  return `<div class="shell" id="shell">
    <aside class="side">
      <a class="brand" href="index.html" style="color:#fff"><img src="assets/img/icon-white.png" alt=""><span><b>منصة سجايا</b><small>قيم أصيلة.. وطباع نبيلة</small></span></a>
      <nav>${nav}</nav>
      <div class="spons"><div><small>تنفيذ</small><img src="assets/img/partners/itmam-white.png" alt="جمعية إتمام للتمكين القيمي للأيتام"></div><div><small>برعاية</small><img src="assets/img/partners/majed-logo-white.svg" alt="مؤسسة أبناء علي بن عثمان الماجد الأهلية"></div></div>
      <div class="me">${av(a ? a.short : u.name)}<span><b>${esc(a ? a.name : u.name)}</b><small>${esc(a ? u.name : S.ROLES[u.role])}</small></span><button onclick="A.logout()" title="تسجيل الخروج" aria-label="تسجيل الخروج">${icon('logout')}</button></div>
    </aside>
    <div class="scrim" onclick="$('#shell').classList.remove('nav-open')"></div>
    <div class="main">
      <header class="top">
        <button class="btn sm icon ghost burger" onclick="$('#shell').classList.toggle('nav-open')" aria-label="القائمة">${icon('menu')}</button>
        <div><div class="crumb">${esc(S.db.cycle)} ${v.crumb ? ' / ' + v.crumb : ''}</div><h1>${v.title}</h1></div>
        <div class="sp"></div>
        <span class="demo-tag">عرض تجريبي</span>
        <select class="input sm noprint" style="width:auto" onchange="A.switchUser(this.value)" title="تبديل الدور للعرض التجريبي" aria-label="تبديل الدور">${demoAcc.map(([id, t]) => opt(id, t, demoAcc.some(d => d[0] === u.id) ? u.id : (u.role === 'assoc' ? 'ua1' : 'u3'))).join('')}</select>
        <a class="btn sm icon ghost bellb" href="#/${u.role === 'assoc' ? 'alerts' : u.role === 'evaluator' ? 'eval-home' : 'notifications'}" aria-label="التنبيهات">${icon('bell')}${S.unread(u) ? '<i></i>' : ''}</a>
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
  if (!V[name] || !ACCESS[name].includes(u.role)) return go(HOME[u.role]);
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

A.logout = () => { S.logout(); go('login'); };
A.switchUser = id => { S.login(id); const u = S.user(); lastRoute = ''; if (location.hash === '#/' + HOME[u.role]) render(); else go(HOME[u.role]); };

/* ---------- الدخول والتسجيل ---------- */
const authWrap = (inner) => `<div class="auth">
  <div class="art"><span class="au x1"></span><span class="au x2"></span>
    <a href="index.html" class="row" style="gap:12px;color:#fff;position:relative;z-index:1"><img src="assets/img/icon-white.png" alt="" style="height:44px"><b style="font-family:var(--f-head);font-size:18px">منصة سجايا</b></a>
    <div class="pearl"><img src="assets/img/icon.png" alt="رمز سجايا"></div>
    <div style="position:relative;z-index:1"><h2>المرجع الرقمي الموحّد<br>لمبادرة <em>سجايا</em></h2><p class="mt16">تسجيل الجمعيات، استقبال الوثائق والشواهد، التقييم، ومتابعة التنفيذ وقياس الأداء — في منصة واحدة.</p></div>
    <div class="foot"><span>برعاية</span><img src="assets/img/partners/majed-logo-white.svg" alt="مؤسسة أبناء علي بن عثمان الماجد الأهلية"><span style="width:1px;height:24px;background:rgba(255,255,255,.15)"></span><span>تنفيذ</span><img src="assets/img/partners/itmam-white.png" alt="جمعية إتمام للتمكين القيمي للأيتام"></div></div>
  <div class="frm"><div class="box"><img class="logo-m" src="assets/img/icon.png" alt="">${inner}</div></div></div>`;

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
