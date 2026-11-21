/* ===== لوحة الجمعية المشاركة ===== */
const me = () => S.assoc(S.user().assocId);
const OKEXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'zip'];

V.home = () => {
  const a = me(), st = S.stats(a), cs = S.currentStage(a), u = S.user(), dp = S.domainPerf(a.id), showDom = S.visibleToAssoc('docs') && dp.v !== null;
  const todo = S.reqsFor(a).filter(r => S.sub(a.id, r.id).status !== 'approved' && S.stageState(a, S.stage(r.stage)) !== 'locked').sort((x, y) => x.due.localeCompare(y.due)).slice(0, 5);
  const evalSt = S.db.tracks.exec.locked && !S.visibleToAssoc('exec') ? 'قيد التقييم' : S.visibleToAssoc('exec') ? 'أُعلنت النتائج النهائية' : S.visibleToAssoc('docs') ? 'أُعلنت نتائج الوثائق' : S.db.tracks.docs.locked ? 'قيد التقييم' : 'لم يبدأ';
  const news = S.notifsFor(u).slice(0, 3), nextM = S.db.meetings.filter(m => m.date >= S.today()).sort((x, y) => x.date.localeCompare(y.date))[0];
  return {
    title: 'لوحة الجمعية', crumb: esc(a.name),
    html: `<div class="hello">${av(a.short, 'lg')}<div><p>مرحبًا بكم في منصة سجايا</p><h2>${esc(a.name)}</h2><p class="mt8">${stBadge(a)}</p></div><button class="btn sm glass2 hello-ct" onclick="A.contactAdmin()">${waIcon('sm')} تواصل مع إدارة المبادرة</button>
      ${a.status === 'accepted' ? `<div class="hl" title="قاعدة التصنيف: أخضر بلا متطلبات إلزامية متأخرة · أصفر إذا لم يتجاوز المتأخر ٢٠٪ من المستحق · أحمر إذا تجاوز ٢٠٪"><span class="dot ${st.health}"></span><span><b>${S.HEALTH[st.health].t}</b><small>${st.overdue ? AR(st.overdue) + ' متطلبات متأخرة من ' + AR(st.due) + ' مستحقة' : 'لا توجد متطلبات متأخرة'}</small></span></div>` : ''}</div>
    <div class="grid g3 sect">
      ${kpi('target', pct(st.progress), 'مستوى الإنجاز العام')}
      ${kpi('layers', `<span style="font-size:18px">${esc(cs.name)}</span>`, 'المرحلة الحالية', `المرحلة ${AR(cs.id)} من ١٠`)}
      ${kpi('check', `${AR(st.approved)} <small>من ${AR(st.total)}</small>`, 'المتطلبات المكتملة')}
      ${kpi('clipboard', AR(st.remaining), 'المتطلبات المتبقية', st.pending ? `${AR(st.pending)} بانتظار المراجعة` : '', '', 'requirements')}
      ${kpi('calendar', st.next ? `<span style="font-size:18px">${fmtDs(st.next.due)}</span>` : '—', 'موعد التسليم القادم', st.next ? `${esc(st.next.title)} · ${dueTxt(st.next.due)}` : 'لا توجد مواعيد قريبة')}
      ${kpi('award', `<span style="font-size:18px">${evalSt}</span>`, 'حالة التقييم', '', '', 'my-results')}
    </div>
    <div class="card"><div class="hd"><div><h3>مسار المبادرة</h3><span class="sub">موقعكم الحالي والمطلوب في كل مرحلة</span></div><span class="small muted">${fmtDs(cs.start)} — ${fmtDs(cs.end)}</span></div><div class="bd">${stepper(a)}${cs.note ? `<div class="note info">${icon('alert', 'sm')}<span>${esc(cs.note)}</span></div>` : ''}</div></div>
    <div class="grid cols2" style="grid-template-columns:1.3fr 1fr;align-items:start">
      <div class="card"><div class="hd"><h3>المطلوب إنجازه</h3><a class="btn sm soft" href="#/requirements">كل المتطلبات</a></div>
        ${todo.map(r => { const x = S.sub(a.id, r.id), od = daysTo(r.due) < 0 && x.status !== 'pending'; return `<div class="rq"><div class="fi">${icon('file', 'sm')}</div><div class="grow"><h4>${esc(r.title)}</h4><div class="meta"><span class="${od ? 'late' : ''}">${icon('calendar', 'sm')} ${fmtDs(r.due)} · ${dueTxt(r.due)}</span>${fBadge(x.status)}</div></div><a class="btn sm ${x.status === 'pending' ? 'ghost' : 'primary'}" href="#/requirements">${x.status === 'pending' ? 'عرض' : icon('upload', 'sm') + ' رفع'}</a></div>`; }).join('') || empty('أنجزتم جميع المتطلبات المفتوحة', 'check')}</div>
      <div><div class="card"><div class="hd"><h3>الإنجاز حسب المراحل</h3></div><div class="bd"><div class="chartbox sm"><canvas id="cMy"></canvas></div></div></div>
        ${nextM ? `<div class="sect">${mCard(nextM, "go('my-meetings')")}</div>` : ''}</div>
    </div>
    <div class="grid cols2 g2" style="align-items:start">
      <div class="card"><div class="hd"><h3>الأداء في المجالات الثلاثة</h3></div>${showDom ? `<div class="bd"><div class="chartbox sm"><canvas id="cMyDom"></canvas></div></div>` : `<div class="lockbox">${icon('lock', 'lg')}<p class="muted mt8">يظهر الأداء في المجالات بعد إعلان نتائج التقييم.</p></div>`}</div>
      <div class="card"><div class="hd"><h3>آخر التنبيهات</h3><a class="btn sm soft" href="#/alerts">الكل</a></div>${news.map(n => ntItem(n, u)).join('') || empty('لا توجد تنبيهات', 'bell')}</div>
    </div>`,
    after() {
      const ss = S.db.stages.filter(s => S.reqsFor(a).some(r => r.stage === s.id));
      chart('cMy', { type: 'bar', data: { labels: ss.map(s => s.name), datasets: [{ data: ss.map(s => S.stageProgress(a, s)), backgroundColor: ss.map(s => S.stageState(a, s) === 'locked' ? '#E5E8EE' : '#30908C'), borderRadius: 6, maxBarThickness: 30 }] }, options: { indexAxis: 'y', scales: { x: { reverse: true, max: 100, grid: { color: '#EEF0F4' }, border: { display: false }, ticks: { callback: v => AR(v) + '٪' } }, y: { position: 'right', grid: { display: false }, border: { display: false } } }, plugins: { tooltip: { callbacks: { label: c => ' ' + pct(c.raw) } } } } });
      if (showDom) chart('cMyDom', { type: 'radar', data: { labels: Object.values(S.DOMAINS), datasets: [{ data: Object.keys(S.DOMAINS).map(d => dp[d]), borderColor: '#30908C', backgroundColor: 'rgba(48,144,140,.18)', borderWidth: 2.5, pointBackgroundColor: '#30908C' }] }, options: { scales: { r: { min: 0, max: 100, ticks: { display: false, stepSize: 25 }, grid: { color: '#E5E8EE' }, angleLines: { color: '#E5E8EE' }, pointLabels: { font: { size: 13, family: '"Thmanyah Serif Text"' }, color: '#2E3143' } } }, plugins: { tooltip: { callbacks: { label: c => ' ' + pct(c.raw) } } } } });
    },
  };
};

/* ---------- المتطلبات والملفات ---------- */
let RQF = 'all';
V.requirements = () => {
  const a = me(), st = S.stats(a);
  const keep = x => RQF === 'all' || (RQF === 'todo' ? x.status !== 'approved' : x.status === 'approved');
  const groups = S.db.stages.filter(s => s.id <= S.cap(a)).map(s => {
    const state = S.stageState(a, s), rs = S.reqsFor(a).filter(r => r.stage === s.id && keep(S.sub(a.id, r.id))); if (!rs.length) return '';
    return `<div class="stg ${state}"><div class="sh"><div class="sn">${state === 'locked' ? icon('lock', 'sm') : AR(s.id)}</div><div class="grow"><h3>${esc(s.name)}</h3><small>${fmtD(s.start)} — ${fmtD(s.end)}</small></div>${badge(stageStateTxt[state])}<div style="width:130px">${bar(S.stageProgress(a, s))}</div></div>
      ${rs.map(r => {
        const x = S.sub(a.id, r.id), od = r.due < S.today() && ['none', 'revise'].includes(x.status), can = state !== 'locked' && x.status !== 'approved';
        return `<div class="rq"><div class="fi">${icon(x.status === 'approved' ? 'check' : 'file', 'sm')}</div><div class="grow">
          <h4>${esc(r.title)} ${badge({ t: r.mandatory ? 'إلزامي' : 'اختياري', c: r.mandatory ? 'teal' : '' }, 'plain')}</h4><p>${esc(r.desc)}</p>
          <div class="meta"><span class="${od ? 'late' : ''}">${icon('calendar', 'sm')} الموعد ${fmtD(r.due)}${x.status === 'approved' ? '' : ' · ' + dueTxt(r.due)}</span>${fBadge(x.status)}${x.files.length ? `<span>${icon('clock', 'sm')} آخر تحديث ${fmtDT(x.updatedAt)}</span>` : ''}${x.late ? '<span class="late">رُفع بعد الموعد</span>' : ''}</div>
          ${x.status === 'revise' && x.note ? `<div class="note">${icon('alert', 'sm')}<span><b>ملاحظة الإدارة:</b> ${esc(x.note)}</span></div>` : ''}
          <div>${x.files.map(f => `<span class="fchip">${icon('file', 'sm')}<span>${esc(f.name)}</span><small>${fsize(f.size)} · ن${AR(f.v)}</small></span>`).join('')}${x.history && x.history.length ? `<span class="fchip" style="border-style:dashed" title="${x.history.map(f => esc(f.name)).join('، ')}">${icon('history', 'sm')}<small>${AR(x.history.length)} نسخ سابقة محفوظة</small></span>` : ''}</div></div>
          ${can ? `<label class="btn sm ${x.status === 'none' || x.status === 'revise' ? 'primary' : 'ghost'}" style="cursor:pointer">${icon('upload', 'sm')} ${x.status === 'none' ? 'رفع الملف' : 'إعادة الرفع'}<input type="file" hidden multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip" onchange="A.upload('${r.id}',this)"></label>` : state === 'locked' ? `<span class="small muted row" style="gap:4px">${icon('lock', 'sm')} لم تُفتح</span>` : ''}</div>`;
      }).join('')}</div>`;
  }).join('');
  return {
    title: 'المتطلبات والملفات', crumb: 'رفع الوثائق والشواهد ومتابعة اعتمادها',
    html: `<div class="grid g4 kp">${kpi('check', AR(st.approved), 'معتمدة')}${kpi('clock', AR(st.pending), 'بانتظار المراجعة')}${kpi('edit', AR(st.revise), 'تحتاج إلى تعديل')}${kpi('alert', AR(st.overdue), 'متأخرة', '', st.overdue ? 'alert' : '')}</div>
    <div class="row between sect"><div class="tabs">${[['all', 'كل المتطلبات'], ['todo', 'المطلوب الآن'], ['done', 'المكتملة']].map(([v, t]) => `<button class="${RQF === v ? 'on' : ''}" onclick="RQF='${v}';R()">${t}</button>`).join('')}</div><span class="small muted">الصيغ المقبولة: PDF، Word، Excel، الصور، ZIP — حتى ٢٥ م.ب للملف</span></div>
    <div class="sect">${groups || `<div class="card">${empty('لا توجد متطلبات في هذا التصنيف', 'check')}</div>`}</div>`,
  };
};
A.upload = (rId, inp) => {
  const a = me(), r = S.req(rId), files = [...inp.files]; if (!files.length) return;
  const bad = files.find(f => !OKEXT.includes(f.name.split('.').pop().toLowerCase()) || f.size > 25 * 1048576);
  if (bad) return toast(`تعذر رفع «${bad.name}» — صيغة غير مدعومة أو الحجم يتجاوز ٢٥ م.ب`, 'alert');
  const key = a.id + ':' + rId, x = S.db.subs[key] || (S.db.subs[key] = { status: 'none', files: [], history: [], note: '', late: false });
  const v = Math.max(0, ...x.files.map(f => f.v), ...(x.history || []).map(f => f.v)) + 1, now = new Date().toISOString();
  x.history = [...x.files, ...(x.history || [])];
  x.files = files.map(f => { const id = S.uid(); BLOBS[id] = URL.createObjectURL(f); return { id, name: f.name, size: f.size, at: now, v }; });
  Object.assign(x, { status: 'pending', at: x.at || now, updatedAt: now, late: S.today() > r.due });
  S.log(v > 1 ? 'إعادة رفع ملف' : 'رفع ملف', `${r.title} · ${a.name}`);
  S.db.notifs.unshift({ id: S.uid(), to: 'admin', type: 'file', title: 'وثيقة جديدة بانتظار المراجعة', body: `رفعت ${a.name} ملف «${r.title}».`, at: now, by: S.user().id, read: {} }); S.save();
  toast(`تم رفع ${AR(files.length)} ملف وإرساله للمراجعة`, 'upload'); R();
};

/* ---------- اللقاءات ---------- */
V['my-meetings'] = () => {
  const a = me(), ms = [...S.db.meetings].sort((x, y) => y.date.localeCompare(x.date)), up = ms.filter(m => m.date >= S.today()).reverse(), past = ms.filter(m => m.date < S.today() && a.id in m.att);
  const att = past.length ? Math.round(past.filter(m => m.att[a.id]).length / past.length * 100) : 0, dn = past.length ? Math.round(past.filter(m => m.done[a.id]).length / past.length * 100) : 0;
  return {
    title: 'اللقاءات والمهام', crumb: 'مواعيد اللقاءات وروابطها والتكليفات المطلوبة',
    html: `<div class="grid g3">${kpi('users', pct(att), 'نسبة الحضور', `${AR(past.filter(m => m.att[a.id]).length)} من ${AR(past.length)} لقاء`)}${kpi('clipboard', pct(dn), 'إنجاز التكليفات')}${kpi('calendar', AR(up.length), 'لقاءات قادمة')}</div>
    ${up.map(m => `<div class="card sect" style="border-color:#bfe0d2"><div class="bd row" style="gap:18px"><div class="av lg">${icon('video', 'lg')}</div><div class="grow"><div class="row" style="gap:6px">${badge({ t: 'لقاء قادم', c: 'warn' })}${badge({ t: m.kind, c: 'teal' }, 'plain')}</div><h3 style="font-size:18px;margin-top:6px">${esc(m.title)}</h3><p class="small muted">${fmtD(m.date)} · الساعة ${AR(m.time)} · ${dueTxt(m.date)} · التكليف: ${esc(m.task.title)}</p></div>
      <div class="row"><button class="btn ${m.rsvp && m.rsvp[a.id] ? 'soft' : 'ghost'}" onclick="A.rsvp('${m.id}')">${icon('check', 'sm')} ${m.rsvp && m.rsvp[a.id] ? 'تم تأكيد الحضور' : 'تأكيد الحضور'}</button><a class="btn primary" href="${esc(m.link)}" target="_blank" rel="noopener">${icon('video', 'sm')} رابط اللقاء</a></div></div></div>`).join('')}
    <div class="card sect"><div class="hd"><h3>اللقاءات السابقة</h3></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>اللقاء</th><th>التاريخ</th><th>الحضور</th><th>التكليف</th><th>المواد</th></tr></thead><tbody>${past.map(m => `<tr><td><b style="font-weight:500">${esc(m.title)}</b><div class="xs muted">${m.kind}${m.no ? ' ' + AR(m.no) : ''}</div></td><td class="small num">${fmtD(m.date)}</td><td>${badge(m.att[a.id] ? { t: 'حضر', c: 'ok' } : { t: 'لم يحضر', c: 'bad' })}</td><td><div class="small">${esc(m.task.title)}</div>${badge(m.done[a.id] ? { t: 'مُنجز', c: 'ok' } : { t: 'غير مُنجز', c: 'warn' })}</td><td>${m.materials.map(f => `<span class="fchip" style="margin:2px">${icon('download', 'sm')}${esc(f.name)}</span>`).join('')}</td></tr>`).join('') || `<tr><td colspan="5">${empty('لا توجد لقاءات سابقة')}</td></tr>`}</tbody></table></div></div>`,
  };
};
A.rsvp = id => { const m = S.db.meetings.find(x => x.id === id), a = me(); m.rsvp = m.rsvp || {}; m.rsvp[a.id] = !m.rsvp[a.id]; S.log('تأكيد حضور لقاء', `${m.title} · ${a.name}`); toast(m.rsvp[a.id] ? 'تم تأكيد حضوركم' : 'أُلغي تأكيد الحضور'); R(); };

/* ---------- نتائج التقييم ---------- */
V['my-results'] = () => {
  const a = me();
  return {
    title: 'نتائج التقييم', crumb: 'النتائج والملاحظات المصرّح بعرضها',
    html: Object.values(S.db.tracks).map(t => {
      const k = t.key, sc = S.trackScore(k, a.id);
      if (!S.visibleToAssoc(k) || sc === null) return `<div class="card sect"><div class="hd"><h3>${t.name}</h3>${badge(!t.locked ? { t: 'لم يبدأ', c: '' } : sc === null && S.visibleToAssoc(k) ? { t: 'غير مشمولة', c: '' } : { t: 'قيد التقييم', c: 'warn' })}</div><div class="lockbox"><div class="lk">${icon('lock', 'lg')}</div><h3>${!t.locked ? 'لم تبدأ هذه المرحلة من التقييم' : 'النتائج غير معلنة بعد'}</h3><p class="muted mt8">تظهر الدرجات والترتيب والملاحظات بعد اعتماد النتائج وإعلانها رسميًا من إدارة المبادرة.</p></div></div>`;
      const rk = S.ranking(k), me_ = rk.find(x => x.a.id === a.id), pos = me_ ? me_.rank : 0, max = S.trackMax(k), notes = S.doneEvals(k, a.id).map(e => e.note).filter(Boolean);
      return `<div class="card sect"><div class="hd"><h3>${t.name}</h3><div class="row">${badge({ t: 'نتائج معتمدة', c: 'ok' })}<a class="btn sm soft" href="#/report/eval/${k}/${a.id}">${icon('file', 'sm')} تقرير التقييم</a></div></div>
        <div class="bd grid cols2" style="grid-template-columns:260px 1fr;gap:28px;align-items:center"><div class="center" style="display:grid;place-items:center;gap:10px">${ring(Math.round(sc / max * 100), 180, `${AR(sc)} من ${AR(max)}`)}<div class="row" style="gap:8px">${rankB(pos)}<span class="small">الترتيب ${AR(pos)} من ${AR(rk.length)}</span></div></div>
        <div>${S.critScores(k, a.id).map(c => hbar(c.name, c.score, c.max, `${AR(c.score)} / ${AR(c.max)}`)).join('')}</div></div>
        ${notes.length ? `<div class="bd" style="border-top:1px solid var(--line-2)"><b class="small">ملاحظات وتوصيات لجنة التقييم</b><ul style="margin:8px 0 0;padding-inline-start:20px;line-height:2;color:var(--ink-2)">${notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''}</div>`;
    }).join(''),
  };
};

/* ---------- التنبيهات ---------- */
V.alerts = () => {
  const u = S.user(), list = S.notifsFor(u);
  return { title: 'التنبيهات', crumb: 'إشعارات المواعيد والملاحظات والمهام الجديدة', html: `<div class="card">${list.map(n => ntItem(n, u)).join('') || empty('لا توجد تنبيهات', 'bell')}</div>`, after() { if (list.some(n => !n.read[u.id])) { list.forEach(n => n.read[u.id] = true); S.save(); } } };
};

/* ---------- بيانات الجمعية ---------- */
V.profile = () => {
  const a = me();
  return {
    title: 'بيانات الجمعية', crumb: 'بيانات الجمعية وممثلها المسؤول عن المبادرة',
    html: `<div class="card" style="max-width:760px"><form class="bd grid" id="pf" onsubmit="return A.profileSave(event)">
      <div class="row" style="gap:16px">${av(a.short, 'lg')}<div><h2 style="font-size:19px">${esc(a.name)}</h2><p class="small muted">رقم الترخيص ${esc(a.license)} · ${stBadge(a)}</p></div></div>
      <div class="grid g2"><div class="field"><label>اسم الجمعية</label><input class="input" value="${esc(a.name)}" disabled></div><div class="field"><label>المدينة</label><input class="input" name="city" value="${esc(a.city)}" required></div></div>
      <div class="grid g2"><div class="field"><label>ممثل الجمعية</label><input class="input" name="rep" value="${esc(a.rep.name)}" required></div><div class="field"><label>الصفة</label><input class="input" name="role" value="${esc(a.rep.role)}"></div></div>
      <div class="grid g2"><div class="field"><label>الجوال</label><input class="input" name="phone" dir="ltr" style="text-align:right" value="${esc(a.rep.phone)}"></div><div class="field"><label>البريد الإلكتروني</label><input class="input" value="${esc(a.rep.email)}" dir="ltr" style="text-align:right" disabled></div></div>
      <p class="xs muted">لتغيير اسم الجمعية أو البريد المعتمد يُرجى التواصل مع إدارة المبادرة.</p>
      <div class="row"><button class="btn primary">حفظ التعديلات</button><button type="button" class="btn ghost" onclick="toast('أُرسل رابط تغيير كلمة المرور إلى بريدكم','mail')">${icon('lock', 'sm')} تغيير كلمة المرور</button></div></form></div>`,
  };
};
A.profileSave = e => { e.preventDefault(); const d = formData('#pf'), a = me(); a.city = d.city; Object.assign(a.rep, { name: d.rep, role: d.role, phone: d.phone }); S.user().name = d.rep; S.log('تعديل بيانات الجمعية', a.name); toast('تم حفظ البيانات'); R(); return false; };
