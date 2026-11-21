/* ===== شاشات الإدارة ===== */
const accepted = () => S.db.assocs.filter(a => a.status === 'accepted');
const HCOL = { ok: '#30908C', warn: '#C98A1B', bad: '#CE4F47', off: '#B7BCC8' };
const BLOBS = {};
const docReq = () => S.db.requirements.find(r => r.cat === 'وثيقة المبادرة' && r.mandatory) || {};
const kpi = (ic, v, l, s = '', cls = '', href = '') => `<${href ? `a href="#/${href}"` : 'div'} class="kpi ${cls}"><div class="io">${icon(ic)}</div><div><div class="v num">${v}</div><div class="l">${l}</div>${s ? `<div class="s">${s}</div>` : ''}</div></${href ? 'a' : 'div'}>`;

/* ---------- ما يحتاج انتباهك: أهم المهام بنقرة واحدة ---------- */
function attention() {
  const pend = Object.values(S.db.subs).filter(x => x.status === 'pending').length, late = accepted().filter(a => S.stats(a).overdue).length;
  const evI = Object.keys(S.db.tracks).filter(k => trk(k).locked && !trk(k).approved).map(k => ({ k, gaps: eligible(k).filter(a => S.evalState(k, a.id).gapHigh).length, short: eligible(k).filter(a => S.evalState(k, a.id).short).length, inc: eligible(k).filter(a => !S.evalState(k, a.id).complete).length }));
  const nm = S.db.meetings.filter(m => m.date >= S.today()).sort((x, y) => x.date.localeCompare(y.date))[0];
  const it = [];
  if (pend) it.push(['file', `${AR(pend)} ملفات بانتظار مراجعتك`, 'اعتمدها أو أعدها للتعديل', "go('files')", 'مراجعة']);
  if (late) it.push(['alert', `${AR(late)} جمعيات لديها متطلبات متأخرة`, 'رسالة جاهزة لكل جمعية عبر واتساب أو البريد', 'A.contactLate()', 'مراسلة', 'bad']);
  evI.forEach(x => { if (x.short) it.push(['users', `${AR(x.short)} جمعيات بلا عدد كافٍ من المقيّمين`, trk(x.k).name, `go('evaluation/${x.k}/assign')`, 'توزيع', 'warn']); else if (x.gaps) it.push(['star', `تباين مرتفع في ${AR(x.gaps)} جمعيات`, trk(x.k).name + ' — راجع الأوراق قبل الاعتماد', `go('evaluation/${x.k}')`, 'مراجعة', 'warn']); else if (x.inc) it.push(['star', `${AR(x.inc)} جمعيات لم يكتمل تقييمها`, trk(x.k).name, `go('evaluation/${x.k}')`, 'متابعة']); });
  if (nm) it.push(['video', nm.title, `${fmtD(nm.date)} · ${dueTxt(nm.date)}`, `A.mSend('${nm.id}')`, 'إرسال الرابط']);
  if (!it.length) return '';
  return `<div class="attn"><div class="attn-h"><span class="pulse-dot"></span><b>يحتاج انتباهك</b><small>${AR(it.length)} مهام</small></div><div class="attn-l">${it.map(([ic, t, d, fn, btn, c]) => `<div class="attn-i ${c || ''}"><span class="io">${icon(ic, 'sm')}</span><div class="grow" style="min-width:0"><b>${t}</b><small>${esc(d)}</small></div><button class="btn sm ${c === 'bad' ? 'wa' : 'soft'}" onclick="${fn}">${c === 'bad' ? waIcon('sm') : ''}${btn}</button></div>`).join('')}</div></div>`;
}

/* ---------- لوحة المؤشرات ---------- */
let dashF = 'all';
V.dashboard = () => {
  const all = S.db.assocs, acc = accepted(), st = Object.fromEntries(all.map(a => [a.id, S.stats(a)]));
  const set = acc.filter(a => dashF === 'all' || st[a.id].health === dashF);
  const readyReqs = S.db.requirements.filter(r => r.stage === 3 && r.mandatory);
  const k = {
    reg: all.filter(a => a.active && a.status !== 'initial').length,
    ready: all.filter(a => readyReqs.length && readyReqs.every(r => S.sub(a.id, r.id).status === 'approved')).length,
    docs: all.filter(a => S.sub(a.id, docReq().id).status !== 'none').length,
    evald: all.filter(a => S.trackScore('docs', a.id) !== null).length,
    started: acc.filter(a => S.db.requirements.some(r => r.stage === 8 && S.sub(a.id, r.id).status !== 'none')).length,
    late: acc.filter(a => st[a.id].health === 'bad'), warn: acc.filter(a => st[a.id].health === 'warn'),
    avg: acc.length ? Math.round(acc.reduce((t, a) => t + st[a.id].progress, 0) / acc.length) : 0,
    pend: Object.values(S.db.subs).filter(s => s.status === 'pending').length,
  };
  const rk = S.ranking('docs'), avgScore = rk.length ? (rk.reduce((t, x) => t + x.score, 0) / rk.length).toFixed(1) : '—';
  const gs = S.globalStage();
  const lateRows = [...k.late, ...k.warn].sort((a, b) => st[b.id].overdue - st[a.id].overdue).slice(0, 7);
  return {
    title: 'لوحة المؤشرات', crumb: 'نظرة عامة على المبادرة',
    html: `${attention()}
    <div class="grid g4 kp">
      ${kpi('building', AR(all.length), 'إجمالي الجمعيات المسجلة', `${AR(acc.length)} مقبولة للمشاركة`, 'dark', 'associations')}
      ${kpi('check', AR(k.reg), 'مكتملة التسجيل', 'حسابات مفعّلة')}
      ${kpi('shield', AR(k.ready), 'مستكملة للجاهزية', 'اعتُمدت متطلباتها')}
      ${kpi('file', AR(k.docs), 'وثائق المبادرات المستلمة', `${AR(k.evald)} وثيقة تم تقييمها`)}
      ${kpi('flag', AR(k.started), 'بدأت التنفيذ', 'رفعت تقارير أو شواهد')}
      ${kpi('award', AR(avgScore), 'متوسط نتائج تقييم الوثائق', 'من ١٠٠ درجة')}
      ${kpi('clock', AR(k.pend), 'ملفات بانتظار المراجعة', 'اضغط للمراجعة', '', 'files')}
      ${kpi('alert', AR(k.late.length), 'جمعيات متأخرة عن الخطة', `${AR(k.warn.length)} تحتاج إلى استكمال`, 'alert')}
    </div>
    <div class="grid cols3" style="grid-template-columns:1fr 1fr 1.25fr">
      <div class="card"><div class="hd"><h3>متوسط تقدم الجمعيات</h3></div><div class="bd center" style="display:grid;place-items:center;gap:12px">${ring(k.avg, 190, 'الإنجاز العام')}<p class="small muted">المرحلة الحالية: <b style="color:var(--ink)">${esc(gs.name)}</b></p></div></div>
      <div class="card"><div class="hd"><h3>حالات الجمعيات</h3><span class="sub">وفق قاعدة التأخر</span></div><div class="bd"><div class="chartbox sm"><canvas id="cStatus"></canvas></div></div></div>
      <div class="card"><div class="hd"><h3>المراحل الزمنية للمبادرة</h3><a class="btn sm soft" href="#/stages">إدارة</a></div><div class="bd" style="padding:10px 20px">
        ${S.db.stages.map(s => `<div class="row" style="padding:7px 0;gap:12px;flex-wrap:nowrap"><span class="dot ${s.state === 'done' ? 'ok' : s.state === 'open' ? 'warn' : ''}"></span><span class="grow small ${s.state === 'locked' ? 'muted' : ''}" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${AR(s.id)}. ${esc(s.name)}</span><span class="xs muted num" style="white-space:nowrap">${fmtDs(s.start)} – ${fmtDs(s.end)}</span></div>`).join('')}
      </div></div>
    </div>
    <div class="card"><div class="hd"><div><h3>مستوى تقدم الجمعيات</h3><span class="sub">نسبة المتطلبات المعتمدة لكل جمعية — اللون يدل على حالة الالتزام</span></div>
      <div class="seg">${[['all', 'الكل'], ['ok', 'وفق الخطة'], ['warn', 'تحتاج استكمال'], ['bad', 'متأخرة']].map(([v, t]) => `<button class="${dashF === v ? 'on' : ''}" onclick="dashF='${v}';R()">${t}</button>`).join('')}</div></div>
      <div class="bd"><div class="chartbox"><canvas id="cProg"></canvas></div></div></div>
    <div class="grid g2 cols2">
      <div class="card"><div class="hd"><div><h3>تطور الإنجاز العام</h3><span class="sub">نسبة المتطلبات المعتمدة تراكميًا عبر الزمن</span></div></div><div class="bd"><div class="chartbox sm"><canvas id="cLine"></canvas></div></div></div>
      <div class="card"><div class="hd"><div><h3>الالتزام الزمني حسب المرحلة</h3><span class="sub">نسبة التسليم في الموعد من إجمالي المتطلبات الإلزامية</span></div></div><div class="bd"><div class="chartbox sm"><canvas id="cCommit"></canvas></div></div></div>
    </div>
    <div class="card"><div class="hd"><div><h3>نتائج تقييم الوثائق حسب المعايير</h3><span class="sub">متوسط درجات المقيمين موزعًا على المعايير</span></div><a class="btn sm soft" href="#/evaluation">التقييم والنتائج</a></div><div class="bd"><div class="chartbox lg"><canvas id="cEval"></canvas></div></div></div>
    <div class="grid cols2" style="grid-template-columns:1.4fr 1fr">
      <div class="card"><div class="hd"><div><h3>الأداء في المجالات الثلاثة</h3><span class="sub">قيمنا الأصيلة · علوم وسنع · التميز الذاتي</span></div></div><div class="bd"><div class="chartbox"><canvas id="cDom"></canvas></div></div></div>
      <div class="card"><div class="hd"><h3>جمعيات تحتاج إلى متابعة</h3>${lateRows.length ? `<button class="btn sm wa" onclick="A.contactLate()">${waIcon('sm')} مراسلة المتأخرة</button>` : ''}</div>
        ${lateRows.length ? `<div class="tbl-wrap"><table class="tbl"><tbody>${lateRows.map(a => `<tr class="click" onclick="go('association/${a.id}')"><td><div class="nm" style="min-width:0">${av(a.short, 'sm alt')}<span><b>${esc(a.name)}</b><small>${AR(st[a.id].overdue)} متطلبات متأخرة</small></span></div></td><td>${hBadge(st[a.id].health)}</td><td>${quickContact(a.id, 'late', { 'العدد': AR(st[a.id].overdue) })}</td></tr>`).join('')}</tbody></table></div>` : empty('جميع الجمعيات تسير وفق الخطة', 'check')}
      </div>
    </div>`,
    after() {
      const nm = a => a.short, sorted = [...set].sort((a, b) => st[b.id].progress - st[a.id].progress);
      chart('cProg', { type: 'bar', data: { labels: sorted.map(nm), datasets: [{ data: sorted.map(a => st[a.id].progress), backgroundColor: sorted.map(a => HCOL[st[a.id].health]), borderRadius: 7, maxBarThickness: 34 }] }, options: { scales: axes({ max: 100, pct: 1 }), plugins: { tooltip: { callbacks: { title: i => sorted[i[0].dataIndex].name, label: c => ` الإنجاز: ${pct(c.raw)}` } } } } });
      chart('cStatus', { type: 'doughnut', data: { labels: ['تسير وفق الخطة', 'تحتاج إلى استكمال', 'متأخرة'], datasets: [{ data: ['ok', 'warn', 'bad'].map(h => acc.filter(a => st[a.id].health === h).length), backgroundColor: [HCOL.ok, HCOL.warn, HCOL.bad], borderWidth: 3, borderColor: '#fff', hoverOffset: 6 }] }, options: { cutout: '66%', plugins: { legend: { display: true, position: 'bottom' } } } });
      const t0 = S.db.seededAt - 130 * S.DAY, pts = [], total = acc.reduce((t, a) => t + S.reqsFor(a).length, 0) || 1, n = 13;
      for (let i = 0; i <= n; i++) { const d = t0 + (Date.now() - t0) * i / n; pts.push({ d, v: Math.round(acc.reduce((t, a) => t + S.reqsFor(a).filter(r => { const s = S.sub(a.id, r.id); return s.status === 'approved' && new Date(s.updatedAt) <= d; }).length, 0) / total * 100) }); }
      chart('cLine', { type: 'line', data: { labels: pts.map(p => fmtDs(p.d)), datasets: [{ data: pts.map(p => p.v), borderColor: '#30908C', borderWidth: 3, tension: .35, pointRadius: 0, pointHoverRadius: 5, fill: true, backgroundColor: c => { const g = c.chart.ctx.createLinearGradient(0, 0, 0, 230); g.addColorStop(0, 'rgba(48,144,140,.28)'); g.addColorStop(1, 'rgba(48,144,140,0)'); return g; } }] }, options: { interaction: { intersect: false, mode: 'index' }, scales: { ...axes({ max: 100, pct: 1 }), x: { reverse: true, grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 7 } } } } });
      const t = S.today(), cs = S.db.stages.map(s => { const rs = S.db.requirements.filter(r => r.stage === s.id && r.mandatory && r.due < t); if (!rs.length) return null; let on = 0; acc.forEach(a => rs.forEach(r => { const x = S.sub(a.id, r.id); if (x.status !== 'none' && !x.late) on++; })); return { s, v: Math.round(on / (rs.length * acc.length) * 100) }; }).filter(Boolean);
      chart('cCommit', { type: 'bar', data: { labels: cs.map(x => x.s.name), datasets: [{ data: cs.map(x => x.v), backgroundColor: cs.map(x => x.v >= 85 ? '#30908C' : x.v >= 70 ? '#5DA88B' : '#C98A1B'), borderRadius: 7, maxBarThickness: 44 }] }, options: { scales: axes({ max: 100, pct: 1 }), plugins: { tooltip: { callbacks: { label: c => ` في الموعد: ${pct(c.raw)}` } } } } });
      const ranked = rk.filter(x => dashF === 'all' || st[x.a.id].health === dashF), crit = S.db.tracks.docs.criteria;
      chart('cEval', { type: 'bar', data: { labels: ranked.map(x => x.a.short), datasets: crit.map((c, i) => ({ label: c.name, data: ranked.map(x => S.critScores('docs', x.a.id)[i].score), backgroundColor: PAL[i % PAL.length], borderRadius: 3, maxBarThickness: 34 })) }, options: { scales: axes({ max: 100, stacked: 1 }), plugins: { legend: { display: true, position: 'bottom' }, tooltip: { mode: 'index', callbacks: { title: i => ranked[i[0].dataIndex].a.name, footer: i => 'المجموع: ' + AR(ranked[i[0].dataIndex].score) } } } } });
      chart('cDom', { type: 'bar', data: { labels: set.map(nm), datasets: Object.entries(S.DOMAINS).map(([d, name], i) => ({ label: name, data: set.map(a => S.domainPerf(a.id)[d]), backgroundColor: ['#30908C', '#8FC9B4', '#2E3143'][i], borderRadius: 4, barPercentage: .8, categoryPercentage: .7 })) }, options: { scales: axes({ max: 100, pct: 1 }), plugins: { legend: { display: true, position: 'bottom' }, tooltip: { mode: 'index' } } } });
    },
  };
};

/* ---------- الجمعيات ---------- */
const AF = { q: '', s: '', h: '' };
function assocRows() {
  const rows = S.db.assocs.filter(a => (!AF.s || a.status === AF.s) && (!AF.q || (a.name + a.city + a.rep.name).includes(AF.q))).map(a => ({ a, st: S.stats(a) })).filter(x => !AF.h || x.st.health === AF.h);
  return rows.length ? rows.map(({ a, st }) => `<tr class="click" onclick="go('association/${a.id}')">
    <td><div class="nm">${av(a.short, 'alt')}<span><b>${esc(a.name)}</b><small>${esc(a.city)}${a.active ? '' : ' · <span style="color:var(--warn)">غير مفعّل</span>'}</small></span></div></td>
    <td><div class="small">${esc(a.rep.name)}</div><div class="xs muted" dir="ltr" style="text-align:right">${esc(a.rep.phone)}</div></td>
    <td>${stBadge(a)}</td><td class="small">${esc(S.currentStage(a).name)}</td><td>${bar(st.progress, st.health === 'bad' ? 'bad' : st.health === 'warn' ? 'warn' : '')}</td>
    <td>${a.status === 'accepted' ? `<span class="row" style="gap:8px;flex-wrap:nowrap"><span class="dot ${st.health}"></span><span class="small">${S.HEALTH[st.health].t}</span></span>` : '<span class="muted">—</span>'}</td>
    <td><div class="acts" onclick="event.stopPropagation()"><button class="btn sm icon ghost" title="تعديل البيانات" onclick="A.assocForm('${a.id}')">${icon('edit', 'sm')}</button>${quickContact(a.id)}</div></td></tr>`).join('') : `<tr><td colspan="7">${empty('لا توجد جمعيات مطابقة', 'search')}</td></tr>`;
}
V.associations = () => {
  const c = k => S.db.assocs.filter(a => a.status === k).length;
  return {
    title: 'الجمعيات', crumb: 'إدارة حسابات الجمعيات وحالات التسجيل',
    html: `<div class="grid g4 kp">${Object.entries(S.STATUS).filter(([k]) => k !== 'complete').map(([k, o]) => kpi(k === 'accepted' ? 'check' : k === 'rejected' ? 'x' : k === 'awaiting' ? 'clock' : 'edit', AR(c(k)), o.t)).join('')}</div>
    <div class="card"><div class="toolbar">
      <div class="search">${icon('search', 'sm')}<input class="input sm" placeholder="بحث باسم الجمعية أو المدينة أو الممثل" value="${esc(AF.q)}" oninput="AF.q=this.value.trim();$('#assocBody').innerHTML=assocRows()"></div>
      <select class="input sm" style="width:auto" onchange="AF.s=this.value;$('#assocBody').innerHTML=assocRows()"><option value="">كل حالات التسجيل</option>${Object.entries(S.STATUS).map(([k, o]) => opt(k, o.t, AF.s)).join('')}</select>
      <select class="input sm" style="width:auto" onchange="AF.h=this.value;$('#assocBody').innerHTML=assocRows()"><option value="">كل حالات الالتزام</option>${['ok', 'warn', 'bad'].map(h => opt(h, S.HEALTH[h].t, AF.h)).join('')}</select>
      <span class="grow"></span>
      <button class="btn sm ghost" onclick="A.exportAssocs()">${icon('excel', 'sm')} تصدير Excel</button>
      <button class="btn sm primary" onclick="A.assocForm()">${icon('plus', 'sm')} إضافة جمعية</button></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>الجمعية</th><th>الممثل</th><th>حالة التسجيل</th><th>المرحلة الحالية</th><th>الإنجاز</th><th>الالتزام</th><th></th></tr></thead><tbody id="assocBody">${assocRows()}</tbody></table></div></div>`,
  };
};
A.assocForm = id => {
  const a = id ? S.assoc(id) : { name: '', city: '', license: '', status: 'initial', rep: { name: '', role: 'منسق المبادرة', phone: '', email: '' } };
  modal(id ? 'تعديل بيانات الجمعية' : 'إضافة جمعية', `<form id="af" class="grid" onsubmit="return A.assocSave(event,'${id || ''}')">
    <div class="field"><label>اسم الجمعية</label><input class="input" name="name" required value="${esc(a.name)}"></div>
    <div class="grid g3"><div class="field"><label>المدينة</label><input class="input" name="city" required value="${esc(a.city)}"></div><div class="field"><label>رقم الترخيص</label><input class="input" name="license" value="${esc(a.license)}"></div><div class="field"><label>حالة التسجيل</label><select class="input" name="status">${Object.entries(S.STATUS).map(([k, o]) => opt(k, o.t, a.status)).join('')}</select></div></div>
    <div class="grid g2"><div class="field"><label>ممثل الجمعية</label><input class="input" name="rep" required value="${esc(a.rep.name)}"></div><div class="field"><label>الصفة</label><input class="input" name="role" value="${esc(a.rep.role)}"></div></div>
    <div class="grid g2"><div class="field"><label>الجوال</label><input class="input" name="phone" dir="ltr" style="text-align:right" value="${esc(a.rep.phone)}"></div><div class="field"><label>البريد الإلكتروني</label><input class="input" type="email" name="email" required dir="ltr" style="text-align:right" value="${esc(a.rep.email)}"></div></div>
  </form>`, `<button class="btn primary" onclick="$('#af').requestSubmit()">${id ? 'حفظ التعديلات' : 'إنشاء الحساب وإرسال رابط التفعيل'}</button><button class="btn ghost" onclick="closeModal()">إلغاء</button>`);
};
A.assocSave = (e, id) => {
  e.preventDefault(); const d = formData('#af'); let a = id ? S.assoc(id) : null;
  if (!a) { const nid = 'a' + Date.now().toString(36); a = { id: nid, active: false, createdAt: new Date().toISOString(), p: .8, rep: {} }; S.db.assocs.push(a); S.db.users.push({ id: 'u' + nid, role: 'assoc', name: d.rep, email: d.email, assocId: nid }); }
  const old = a.status;
  Object.assign(a, { name: d.name, short: d.name.replace(/^جمعية\s*/, '').split(' ')[0], city: d.city, license: d.license, status: d.status }); Object.assign(a.rep, { name: d.rep, role: d.role, phone: d.phone, email: d.email });
  const u = S.db.users.find(x => x.assocId === a.id); if (u) { u.name = d.rep; u.email = d.email; }
  if (id && old !== d.status) { S.log('تغيير حالة جمعية', `${a.name} ← ${S.STATUS[d.status].t}`); S.notify(a.id, d.status === 'accepted' ? 'ok' : 'info', 'تحديث حالة التسجيل', `أصبحت حالة تسجيل الجمعية: ${S.STATUS[d.status].t}.`); }
  else S.log(id ? 'تعديل بيانات جمعية' : 'إضافة جمعية', a.name);
  closeModal(); toast(id ? 'تم حفظ بيانات الجمعية' : 'تم إنشاء الحساب وإرسال رابط التفعيل', id ? 'check' : 'mail'); R(); return false;
};
A.sendLink = id => A.contact(id, 'login');
A.resetPass = id => { const a = S.assoc(id); S.log('إعادة تعيين كلمة المرور', a.name); toast('أُرسل رابط إعادة تعيين كلمة المرور إلى بريد الجمعية', 'mail'); };
A.setStatus = (id, v) => { const a = S.assoc(id); a.status = v; S.log('تغيير حالة جمعية', `${a.name} ← ${S.STATUS[v].t}`); S.notify(id, v === 'accepted' ? 'ok' : 'info', 'تحديث حالة التسجيل', `أصبحت حالة تسجيل الجمعية: ${S.STATUS[v].t}.`); toast('تم تحديث حالة الجمعية'); R(); };
A.exportAssocs = () => exportXlsx(S.db.assocs.map(a => { const s = S.stats(a); return { 'الجمعية': a.name, 'المدينة': a.city, 'رقم الترخيص': a.license, 'الممثل': a.rep.name, 'الصفة': a.rep.role, 'الجوال': a.rep.phone, 'البريد': a.rep.email, 'حالة التسجيل': S.STATUS[a.status].t, 'الحساب': a.active ? 'مفعّل' : 'غير مفعّل', 'المرحلة الحالية': S.currentStage(a).name, 'نسبة الإنجاز %': s.progress, 'الالتزام الزمني %': s.commit, 'متطلبات متأخرة': s.overdue, 'حالة الالتزام': S.HEALTH[s.health].t }; }), 'جمعيات-مبادرة-سجايا', 'الجمعيات');

/* جدول متطلبات جمعية (مشترك) */
function reqTable(a, admin) {
  return S.db.stages.filter(s => S.reqsFor(a).some(r => r.stage === s.id)).map(s => `<tr><td colspan="5" style="background:#FAFBFC;font-family:var(--f-head);font-size:13px">${AR(s.id)}. ${esc(s.name)}</td></tr>` + S.reqsFor(a).filter(r => r.stage === s.id).map(r => { const x = S.sub(a.id, r.id), od = r.mandatory && r.due < S.today() && ['none', 'revise'].includes(x.status); return `<tr><td>${esc(r.title)} ${r.mandatory ? '' : '<span class="badge plain">اختياري</span>'}</td><td class="small num ${od ? '' : 'muted'}" style="${od ? 'color:var(--bad)' : ''}">${fmtDs(r.due)}${od ? ' · متأخر' : ''}</td><td>${fBadge(x.status)}</td><td class="small muted num">${x.files.length ? fmtDs(x.updatedAt) : '—'}</td><td>${admin && x.files.length ? `<div class="acts"><button class="btn sm soft" onclick="A.review('${a.id}','${r.id}')">مراجعة</button></div>` : ''}</td></tr>`; }).join('')).join('');
}
V.association = id => {
  const a = S.assoc(id); if (!a) return null; const st = S.stats(a), cs = S.currentStage(a), dp = S.domainPerf(a.id);
  const past = S.db.meetings.filter(m => a.id in m.att), att = past.length ? Math.round(past.filter(m => m.att[a.id]).length / past.length * 100) : null;
  return {
    title: esc(a.name), crumb: '<a href="#/associations">الجمعيات</a>',
    html: `<div class="card"><div class="bd row" style="gap:18px">${av(a.short, 'lg')}
      <div class="grow"><h2 style="font-size:20px">${esc(a.name)}</h2><div class="row small muted mt8" style="gap:6px 18px"><span class="row" style="gap:5px">${icon('pin', 'sm')}${esc(a.city)}</span><span class="row" style="gap:5px">${icon('user', 'sm')}${esc(a.rep.name)} — ${esc(a.rep.role)}</span><span class="row" style="gap:5px" dir="ltr">${esc(a.rep.email)}${icon('mail', 'sm')}</span><span class="row" style="gap:5px" dir="ltr">${esc(a.rep.phone)}${icon('phone', 'sm')}</span></div></div>
      <div class="row"><select class="input sm" style="width:auto" onchange="A.setStatus('${a.id}',this.value)" aria-label="حالة التسجيل">${Object.entries(S.STATUS).map(([k, o]) => opt(k, o.t, a.status)).join('')}</select>
      <button class="btn sm ghost" onclick="A.assocForm('${a.id}')">${icon('edit', 'sm')} تعديل</button><button class="btn sm wa" onclick="A.contact('${a.id}')">${waIcon('sm')} مراسلة</button><button class="btn sm ghost" onclick="A.sendLink('${a.id}')">${icon('link', 'sm')} رابط الدخول</button><button class="btn sm ghost" onclick="A.resetPass('${a.id}')">${icon('lock', 'sm')} إعادة تعيين</button><a class="btn sm primary" href="#/report/assoc/${a.id}">${icon('chart', 'sm')} تقرير الأداء</a></div></div></div>
    <div class="grid g4 kp">
      ${kpi('target', pct(st.progress), 'مستوى الإنجاز العام', `${AR(st.approved)} من ${AR(st.total)} متطلبًا`)}
      ${kpi('layers', `<span style="font-size:17px">${esc(cs.name)}</span>`, 'المرحلة الحالية', `المرحلة ${AR(cs.id)} من ١٠`)}
      ${kpi('clock', pct(st.commit), 'الالتزام الزمني', att === null ? '' : `حضور اللقاءات ${pct(att)}`)}
      ${kpi('alert', AR(st.overdue), 'متطلبات متأخرة', S.HEALTH[st.health].t, st.health === 'bad' ? 'alert' : '')}
    </div>
    <div class="card"><div class="hd"><h3>مسار المراحل</h3>${hBadge(st.health)}</div><div class="bd">${stepper(a)}</div></div>
    <div class="grid cols2" style="grid-template-columns:1.6fr 1fr">
      <div class="card"><div class="hd"><h3>المتطلبات والملفات</h3><span class="sub">${AR(st.pending)} بانتظار المراجعة</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>المتطلب</th><th>الموعد</th><th>الحالة</th><th>آخر تحديث</th><th></th></tr></thead><tbody>${reqTable(a, true)}</tbody></table></div></div>
      <div><div class="card"><div class="hd"><h3>نتائج التقييم</h3></div><div class="bd">${Object.values(S.db.tracks).map(t => { const sc = S.trackScore(t.key, a.id); return `<div class="row between" style="padding:8px 0"><div><b style="font-weight:500">${t.short}</b><div class="xs muted">${AR(S.doneEvals(t.key, a.id).length)} مقيمين · ${t.approved ? 'معتمد' : 'غير معتمد'}</div></div><div class="row"><b class="num" style="font-family:var(--f-head);font-size:22px;color:var(--teal-700)">${sc === null ? '—' : AR(sc)}</b>${sc === null ? '' : `<a class="btn sm icon ghost" href="#/report/eval/${t.key}/${a.id}" title="تقرير التقييم">${icon('file', 'sm')}</a>`}</div></div>`; }).join('')}</div></div>
      <div class="card mt16"><div class="hd"><h3>الأداء في المجالات</h3></div><div class="bd">${Object.entries(S.DOMAINS).map(([d, n]) => `<div style="padding:6px 0"><div class="row between small"><span>${n}</span><b class="num">${dp[d] === null ? '—' : pct(dp[d])}</b></div><div class="progress mt8"><i style="width:${dp[d] || 0}%"></i></div></div>`).join('')}</div></div></div>
    </div>`,
  };
};

/* ---------- المراحل والمتطلبات ---------- */
V.stages = () => {
  const acc = accepted();
  return {
    title: 'المراحل والمتطلبات', crumb: 'التحكم في فتح المراحل ومواعيدها ومتطلباتها دون تدخل برمجي',
    html: `<div class="row between mb16"><p class="muted small">غيّر حالة أي مرحلة مباشرة، وأضف متطلبات جديدة وحدّد الجمعيات المستهدفة والموعد النهائي.</p><button class="btn primary" onclick="A.reqForm()">${icon('plus', 'sm')} إضافة متطلب</button></div>` +
      S.db.stages.map(s => {
        const rs = S.db.requirements.filter(r => r.stage === s.id), avg = acc.length ? Math.round(acc.reduce((t, a) => t + S.stageProgress(a, s), 0) / acc.length) : 0;
        return `<div class="stg ${s.state}"><div class="sh"><div class="sn">${AR(s.id)}</div>
          <div class="grow"><h3>${esc(s.name)}</h3><small>${fmtD(s.start)} — ${fmtD(s.end)} · ${esc(s.desc)}</small>${s.note ? `<div class="note info">${icon('alert', 'sm')}<span>${esc(s.note)}</span></div>` : ''}</div>
          <div style="width:150px">${bar(avg)}</div>
          <div class="seg">${[['locked', 'مغلقة', ''], ['open', 'مفتوحة', 'warn'], ['done', 'مكتملة', 'ok']].map(([v, t, c]) => `<button class="${s.state === v ? 'on ' + c : ''}" onclick="A.setStage(${s.id},'${v}')">${t}</button>`).join('')}</div>
          <button class="btn sm icon ghost" title="تعديل المرحلة" onclick="A.stageForm(${s.id})">${icon('edit', 'sm')}</button></div>
          ${rs.map(r => { const n = acc.filter(a => S.sub(a.id, r.id).status !== 'none').length, tg = r.targets === 'all' ? acc.length : r.targets.length; return `<div class="rq"><div class="fi">${icon('file', 'sm')}</div><div class="grow"><h4>${esc(r.title)} ${badge({ t: r.mandatory ? 'إلزامي' : 'اختياري', c: r.mandatory ? 'teal' : '' }, 'plain')}</h4><p>${esc(r.desc)}</p><div class="meta"><span>${icon('calendar', 'sm')} ${fmtD(r.due)}</span><span>${icon('clipboard', 'sm')} ${esc(r.cat)}</span><span>${icon('building', 'sm')} ${r.targets === 'all' ? 'جميع الجمعيات' : AR(tg) + ' جمعيات محددة'}</span><span>${icon('upload', 'sm')} رفعت ${AR(n)} من ${AR(tg)}</span></div></div><div class="acts"><button class="btn sm icon ghost" onclick="A.reqForm('${r.id}')" title="تعديل">${icon('edit', 'sm')}</button><button class="btn sm icon ghost" onclick="A.reqDel('${r.id}')" title="حذف">${icon('trash', 'sm')}</button></div></div>`; }).join('')}
          <div class="rq" style="padding:10px 20px"><button class="btn sm soft" onclick="A.reqForm('',${s.id})">${icon('plus', 'sm')} متطلب جديد في هذه المرحلة</button></div></div>`;
      }).join(''),
  };
};
A.setStage = (id, v) => { const s = S.stage(id); if (s.state === v) return; s.state = v; S.log(v === 'open' ? 'فتح مرحلة' : v === 'done' ? 'إكمال مرحلة' : 'إغلاق مرحلة', s.name); if (v === 'open') S.notify('all', 'info', `فتح مرحلة: ${s.name}`, s.desc); S.save(); toast(`تم تحديث حالة مرحلة «${s.name}»`); R(); };
A.stageForm = id => { const s = S.stage(id); modal('تعديل المرحلة', `<form id="sf" class="grid" onsubmit="return A.stageSave(event,${id})"><div class="field"><label>اسم المرحلة</label><input class="input" name="name" required value="${esc(s.name)}"></div><div class="field"><label>الوصف</label><input class="input" name="desc" value="${esc(s.desc)}"></div><div class="grid g2"><div class="field"><label>تاريخ البداية</label><input class="input" type="date" name="start" value="${s.start}" required></div><div class="field"><label>تاريخ النهاية</label><input class="input" type="date" name="end" value="${s.end}" required></div></div><div class="field"><label>ملاحظة إدارية تظهر للجمعيات</label><textarea class="input" name="note">${esc(s.note)}</textarea></div></form>`, `<button class="btn primary" onclick="$('#sf').requestSubmit()">حفظ</button><button class="btn ghost" onclick="closeModal()">إلغاء</button>`); };
A.stageSave = (e, id) => { e.preventDefault(); Object.assign(S.stage(id), formData('#sf')); S.log('تعديل مرحلة', S.stage(id).name); closeModal(); toast('تم حفظ بيانات المرحلة'); R(); return false; };
A.reqForm = (id, stageId) => {
  const r = id ? S.req(id) : { title: '', desc: '', stage: stageId || S.globalStage().id, cat: 'التنفيذ', mandatory: true, due: new Date(Date.now() + 14 * S.DAY).toISOString().slice(0, 10), targets: 'all' };
  modal(id ? 'تعديل متطلب' : 'إضافة متطلب جديد', `<form id="rf" class="grid" onsubmit="return A.reqSave(event,'${id || ''}')">
    <div class="field"><label>عنوان المتطلب</label><input class="input" name="title" required value="${esc(r.title)}" placeholder="مثال: تقرير الأنشطة — الشهر الثالث"></div>
    <div class="field"><label>الوصف والتعليمات</label><textarea class="input" name="desc">${esc(r.desc)}</textarea></div>
    <div class="grid g3"><div class="field"><label>المرحلة</label><select class="input" name="stage">${S.db.stages.map(s => opt(s.id, `${s.id}. ${s.name}`, r.stage)).join('')}</select></div><div class="field"><label>التصنيف</label><select class="input" name="cat">${S.CATS.map(c => opt(c, c, r.cat)).join('')}</select></div><div class="field"><label>الموعد النهائي</label><input class="input" type="date" name="due" required value="${r.due}"></div></div>
    <div class="grid g2"><div class="field"><label>نوع المتطلب</label><select class="input" name="mandatory">${opt('1', 'إلزامي', r.mandatory ? '1' : '0')}${opt('0', 'اختياري', r.mandatory ? '1' : '0')}</select></div><div class="field"><label>الجمعيات المستهدفة</label><select class="input" name="tmode" onchange="$('#tg').style.display=this.value==='some'?'grid':'none'">${opt('all', 'جميع الجمعيات', r.targets === 'all' ? 'all' : 'some')}${opt('some', 'جمعيات محددة', r.targets === 'all' ? 'all' : 'some')}</select></div></div>
    <div id="tg" class="grid g3" style="display:${r.targets === 'all' ? 'none' : 'grid'};gap:6px;max-height:180px;overflow:auto;padding:12px;border:1px solid var(--line);border-radius:11px">${accepted().map(a => `<label class="row small" style="gap:6px;flex-wrap:nowrap"><input type="checkbox" name="t_${a.id}" ${r.targets !== 'all' && r.targets.includes(a.id) ? 'checked' : ''}> ${esc(a.short)}</label>`).join('')}</div>
    ${id ? '' : '<label class="row small" style="gap:8px"><input type="checkbox" name="notify" checked> إشعار الجمعيات المستهدفة بالمتطلب الجديد</label>'}
  </form>`, `<button class="btn primary" onclick="$('#rf').requestSubmit()">${id ? 'حفظ' : 'إضافة المتطلب'}</button><button class="btn ghost" onclick="closeModal()">إلغاء</button>`);
};
A.reqSave = (e, id) => {
  e.preventDefault(); const d = formData('#rf'), targets = d.tmode === 'all' ? 'all' : Object.keys(d).filter(k => k.startsWith('t_')).map(k => k.slice(2));
  if (targets !== 'all' && !targets.length) return toast('اختر جمعية واحدة على الأقل', 'alert'), false;
  const v = { title: d.title, desc: d.desc, stage: +d.stage, cat: d.cat, due: d.due, mandatory: d.mandatory === '1', targets };
  if (id) Object.assign(S.req(id), v); else { S.db.requirements.push({ id: 'r' + Date.now().toString(36), ...v }); if (d.notify) (targets === 'all' ? ['all'] : targets).forEach(t => S.notify(t, 'file', 'متطلب جديد', `أُضيف متطلب «${d.title}» وموعده النهائي ${fmtD(d.due)}.`)); }
  S.db.requirements.sort((x, y) => x.stage - y.stage || x.due.localeCompare(y.due));
  S.log(id ? 'تعديل متطلب' : 'إضافة متطلب', d.title); closeModal(); toast(id ? 'تم حفظ المتطلب' : 'تمت إضافة المتطلب وإشعار الجمعيات'); R(); return false;
};
A.reqDel = id => { const r = S.req(id), n = Object.keys(S.db.subs).filter(k => k.endsWith(':' + id)).length; modal('حذف المتطلب', `<p>سيُحذف المتطلب «${esc(r.title)}»${n ? ` مع أرشفة ${AR(n)} ملفات مرفوعة عليه` : ''}. هل تريد المتابعة؟</p>`, `<button class="btn danger" onclick="A.reqDelGo('${id}')">حذف</button><button class="btn ghost" onclick="closeModal()">تراجع</button>`); };
A.reqDelGo = id => { const r = S.req(id); S.db.requirements = S.db.requirements.filter(x => x.id !== id); S.log('حذف متطلب', r.title); closeModal(); toast('تم حذف المتطلب'); R(); };

/* ---------- الوثائق والشواهد ---------- */
const FF = { s: 'pending', st: '', a: '', q: '' };
function fileRows() {
  const out = [];
  S.db.assocs.forEach(a => { if (FF.a && a.id !== FF.a) return; S.reqsFor(a).forEach(r => { const x = S.sub(a.id, r.id); if ((FF.s && x.status !== FF.s) || (FF.st && r.stage !== +FF.st) || (FF.q && !(r.title + a.name).includes(FF.q))) return; out.push({ a, r, x }); }); });
  out.sort((p, q) => (q.x.updatedAt || '').localeCompare(p.x.updatedAt || ''));
  $('#fCount') && ($('#fCount').textContent = AR(out.length) + ' نتيجة');
  return out.length ? out.slice(0, 150).map(({ a, r, x }) => `<tr><td><div class="nm"><span class="av sm alt">${icon('file', 'sm')}</span><span><b>${esc(r.title)}</b><small>${esc(r.cat)} · ${r.mandatory ? 'إلزامي' : 'اختياري'}${x.files.length ? ` · ${AR(x.files.length)} ملف` : ''}</small></span></div></td><td class="small"><a href="#/association/${a.id}" style="color:inherit">${esc(a.name)}</a></td><td class="small">${esc(S.stage(r.stage).name)}</td><td class="small num">${x.files.length ? fmtDT(x.updatedAt) : '<span class="muted">—</span>'}${x.late ? ' <span class="badge bad plain">بعد الموعد</span>' : ''}</td><td>${fBadge(x.status)}</td><td><div class="acts">${x.files.length ? `<button class="btn sm ${x.status === 'pending' ? 'primary' : 'ghost'}" onclick="A.review('${a.id}','${r.id}')">${x.status === 'pending' ? 'مراجعة' : 'عرض'}</button>` : `<button class="btn sm ghost" onclick="A.nudge('${a.id}','${r.id}')">${icon('bell', 'sm')} تذكير</button>`}</div></td></tr>`).join('') : `<tr><td colspan="6">${empty('لا توجد ملفات مطابقة للتصفية', 'file')}</td></tr>`;
}
V.files = () => {
  const c = k => Object.values(S.db.subs).filter(s => s.status === k).length, upd = "$('#fileBody').innerHTML=fileRows()";
  return {
    title: 'الوثائق والشواهد', crumb: 'مراجعة الملفات واعتمادها أو إعادتها للتعديل',
    html: `<div class="grid g3">${kpi('clock', AR(c('pending')), 'بانتظار المراجعة')}${kpi('check', AR(c('approved')), 'ملفات معتمدة')}${kpi('edit', AR(c('revise')), 'تحتاج إلى تعديل')}</div>
    <div class="card"><div class="toolbar">
      <div class="tabs">${[['pending', 'بانتظار المراجعة'], ['revise', 'تحتاج تعديل'], ['approved', 'معتمدة'], ['none', 'لم تُرفع'], ['', 'الكل']].map(([v, t]) => `<button class="${FF.s === v ? 'on' : ''}" onclick="FF.s='${v}';R()">${t}</button>`).join('')}</div><span class="grow"></span><span class="small muted" id="fCount"></span></div>
      <div class="toolbar"><div class="search">${icon('search', 'sm')}<input class="input sm" placeholder="بحث باسم الملف أو الجمعية" value="${esc(FF.q)}" oninput="FF.q=this.value.trim();${upd}"></div>
      <select class="input sm" style="width:auto" onchange="FF.st=this.value;${upd}"><option value="">كل المراحل</option>${S.db.stages.filter(s => S.db.requirements.some(r => r.stage === s.id)).map(s => opt(s.id, s.name, FF.st)).join('')}</select>
      <select class="input sm" style="width:auto" onchange="FF.a=this.value;${upd}"><option value="">كل الجمعيات</option>${S.db.assocs.map(a => opt(a.id, a.name, FF.a)).join('')}</select></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>المتطلب</th><th>الجمعية</th><th>المرحلة</th><th>تاريخ الرفع</th><th>الحالة</th><th></th></tr></thead><tbody id="fileBody"></tbody></table></div></div>`,
    after() { $('#fileBody').innerHTML = fileRows(); },
  };
};
const fileRow = (f, old) => `<div class="row" style="padding:10px 12px;border:1px solid var(--line);border-radius:11px;margin-bottom:8px;gap:12px;${old ? 'opacity:.7' : ''}"><span class="av sm alt">${icon('file', 'sm')}</span><span class="grow"><b style="font-weight:500;font-size:14px">${esc(f.name)}</b><div class="xs muted">${fsize(f.size)} · ${fmtDT(f.at)} · النسخة ${AR(f.v)}${old ? ' (سابقة)' : ''}</div></span><button class="btn sm ghost" onclick="A.fileOpen('${f.id}')">${icon('eye', 'sm')} معاينة</button><button class="btn sm icon ghost" onclick="A.fileOpen('${f.id}',1)" title="تحميل">${icon('download', 'sm')}</button></div>`;
A.fileOpen = (id, dl) => { const u = BLOBS[id]; let name = 'file'; Object.values(S.db.subs).forEach(x => [...x.files, ...(x.history || [])].forEach(f => { if (f.id === id) name = f.name; })); if (!u) return toast('ملف تجريبي — المعاينة والتحميل تعملان مع الملفات المرفوعة فعليًا', 'alert'); if (dl) { const a = document.createElement('a'); a.href = u; a.download = name; a.click(); } else open(u, '_blank'); };
A.review = (aId, rId) => {
  const a = S.assoc(aId), r = S.req(rId), x = S.sub(aId, rId);
  modal('مراجعة ملف', `<div class="row between"><div><h3 style="font-size:16px">${esc(r.title)}</h3><p class="small muted">${esc(a.name)} · ${esc(S.stage(r.stage).name)} · الموعد ${fmtD(r.due)}</p></div>${fBadge(x.status)}</div>
    <h4 class="small muted mt16 mb16" style="font-family:var(--f-body)">الملفات الحالية</h4>${x.files.map(f => fileRow(f)).join('')}
    ${x.history && x.history.length ? `<h4 class="small muted mt16 mb16" style="font-family:var(--f-body)">النسخ السابقة المحفوظة</h4>${x.history.map(f => fileRow(f, 1)).join('')}` : ''}
    <div class="field mt16"><label>ملاحظات الإدارة (تظهر للجمعية)</label><textarea class="input" id="rvNote" placeholder="اكتب الملاحظة عند طلب التعديل...">${esc(x.note || '')}</textarea></div>`,
    `<button class="btn primary" onclick="A.reviewGo('${aId}','${rId}','approved')">${icon('check', 'sm')} اعتماد الملف</button><button class="btn" style="background:var(--warn-bg);color:var(--warn)" onclick="A.reviewGo('${aId}','${rId}','revise')">${icon('edit', 'sm')} طلب تعديل</button><button class="btn ghost" onclick="closeModal()">إغلاق</button>`);
};
A.reviewGo = (aId, rId, status) => {
  const x = S.db.subs[aId + ':' + rId], r = S.req(rId), note = $('#rvNote').value.trim();
  if (status === 'revise' && !note) return toast('اكتب ملاحظة توضح التعديل المطلوب', 'alert');
  x.status = status; x.note = note; x.updatedAt = new Date().toISOString();
  S.log(status === 'approved' ? 'اعتماد ملف' : 'طلب تعديل ملف', `${r.title} · ${S.assoc(aId).name}`);
  S.notify(aId, status === 'approved' ? 'ok' : 'file', status === 'approved' ? 'تم اعتماد ملف' : 'ملاحظة على ملف', status === 'approved' ? `تم اعتماد «${r.title}».` : `يحتاج «${r.title}» إلى تعديل: ${note}`);
  closeModal(); toast(status === 'approved' ? 'تم اعتماد الملف وإشعار الجمعية' : 'أُعيد الملف للتعديل وأُشعرت الجمعية'); R();
  if (status === 'revise') setTimeout(() => A.contact(aId, 'revise', { 'المتطلب': r.title, 'الملاحظة': note }), 120);
};
A.nudge = (aId, rId) => { const r = S.req(rId); A.contact(aId, 'reminder', { 'المتطلب': r.title, 'الموعد': fmtD(r.due) }); };

/* ---------- اللقاءات والمهام ---------- */
const mStat = m => { const ids = Object.keys(m.att), n = ids.length || 1; return { n: ids.length, att: Math.round(ids.filter(i => m.att[i]).length / n * 100), done: Math.round(ids.filter(i => m.done[i]).length / n * 100), attN: ids.filter(i => m.att[i]).length, doneN: ids.filter(i => m.done[i]).length }; };
function mCard(m, click) {
  const d = new Date(m.date), up = m.date >= S.today(), s = mStat(m);
  return `<div class="mcard ${up ? 'up' : ''}" onclick="${click}"><div class="row" style="flex-wrap:nowrap;gap:14px"><div class="dt"><div><b class="num">${AR(d.getDate())}</b>${d.toLocaleDateString('ar-SA-u-ca-gregory', { month: 'short' })}</div></div><div class="grow"><div class="row" style="gap:6px">${badge({ t: m.kind + (m.no ? ' ' + AR(m.no) : ''), c: 'teal' }, 'plain')}${up ? badge({ t: 'قادم', c: 'warn' }) : ''}</div><h3 style="font-size:15px;margin-top:6px">${esc(m.title)}</h3></div></div>
    <div class="small muted row" style="gap:6px">${icon('clipboard', 'sm')} التكليف: ${esc(m.task.title)}</div>
    ${up ? `<div class="small row" style="gap:6px;color:var(--teal-700)">${icon('clock', 'sm')} ${AR(m.time)} · ${dueTxt(m.date)}</div>` : `<div class="mini"><span>الحضور <b class="num">${pct(s.att)}</b></span><span>إنجاز التكليف <b class="num">${pct(s.done)}</b></span></div><div class="progress"><i style="width:${s.att}%"></i></div>`}</div>`;
}
V.meetings = () => {
  const past = S.db.meetings.filter(m => m.date < S.today() && Object.keys(m.att).length), avg = k => past.length ? Math.round(past.reduce((t, m) => t + mStat(m)[k], 0) / past.length) : 0;
  return {
    title: 'اللقاءات والمهام', crumb: 'اللقاء التعريفي واللقاءات التمهيدية العشرة ولقاءات المتابعة',
    html: `<div class="grid g4 kp">${kpi('video', AR(S.db.meetings.length), 'إجمالي اللقاءات')}${kpi('users', pct(avg('att')), 'متوسط نسبة الحضور')}${kpi('clipboard', pct(avg('done')), 'متوسط إنجاز التكليفات')}${kpi('calendar', AR(S.db.meetings.filter(m => m.date >= S.today()).length), 'لقاءات قادمة')}</div>
    <div class="row between sect"><h3>جدول اللقاءات</h3><button class="btn primary" onclick="A.meetForm()">${icon('plus', 'sm')} إضافة لقاء</button></div>
    <div class="grid g3 sect">${[...S.db.meetings].sort((a, b) => b.date.localeCompare(a.date)).map(m => mCard(m, `A.meeting('${m.id}')`)).join('')}</div>`,
  };
};
A.meeting = id => {
  const m = S.db.meetings.find(x => x.id === id), list = accepted();
  list.forEach(a => { if (!(a.id in m.att)) { m.att[a.id] = false; m.done[a.id] = false; } });
  const s = mStat(m);
  modal(esc(m.title), `<div class="grid g4" style="gap:10px"><div class="field"><label>التاريخ</label><input class="input sm" type="date" value="${m.date}" onchange="A.mSet('${id}','date',this.value)"></div><div class="field"><label>الوقت</label><input class="input sm" type="time" value="${m.time}" onchange="A.mSet('${id}','time',this.value)"></div><div class="field" style="grid-column:span 2"><label>رابط اللقاء</label><input class="input sm" dir="ltr" value="${esc(m.link)}" onchange="A.mSet('${id}','link',this.value)"></div></div>
    <div class="grid g2 mt16" style="gap:10px"><div class="field"><label>التكليف المطلوب بعد اللقاء</label><input class="input sm" value="${esc(m.task.title)}" onchange="A.mSet('${id}','task',this.value)"></div><div class="field"><label>المواد العلمية المرفقة</label><div>${m.materials.map(f => `<span class="fchip" style="margin-top:0">${icon('file', 'sm')}${esc(f.name)}</span>`).join('') || '<span class="small muted">لا توجد مرفقات</span>'} <label class="btn sm soft" style="cursor:pointer">${icon('upload', 'sm')} إرفاق<input type="file" hidden multiple onchange="A.mMat('${id}',this)"></label></div></div></div>
    <div class="row between mt24 mb16"><b>سجل الحضور والتكليفات</b><span class="small muted">الحضور <b id="mA" class="num">${AR(s.attN)}</b> · أنجز التكليف <b id="mD" class="num">${AR(s.doneN)}</b> من ${AR(list.length)}</span></div>
    <div class="tbl-wrap" style="max-height:340px;border:1px solid var(--line);border-radius:12px"><table class="tbl"><thead><tr><th>الجمعية</th><th>الحضور</th><th>إنجاز التكليف</th></tr></thead><tbody>${list.map(a => `<tr><td>${esc(a.name)}</td><td><button class="switch ${m.att[a.id] ? 'on' : ''}" onclick="A.mTog(this,'${id}','${a.id}','att')" aria-label="حضور"></button></td><td><button class="switch ${m.done[a.id] ? 'on' : ''}" onclick="A.mTog(this,'${id}','${a.id}','done')" aria-label="تكليف"></button></td></tr>`).join('')}</tbody></table></div>`,
    `<button class="btn primary" onclick="A.mClose('${id}')">حفظ وإغلاق</button><button class="btn soft" onclick="A.mSend('${id}')">${icon('send', 'sm')} إرسال الرابط للجمعيات</button>`, true);
};
A.mClose = id => { closeModal(); S.log('تحديث لقاء', S.db.meetings.find(x => x.id === id).title); R(); };
A.mTog = (el, id, aId, k) => { const m = S.db.meetings.find(x => x.id === id); m[k][aId] = !m[k][aId]; el.classList.toggle('on'); S.save(); const s = mStat(m); $('#mA').textContent = AR(s.attN); $('#mD').textContent = AR(s.doneN); };
A.mSet = (id, k, v) => { const m = S.db.meetings.find(x => x.id === id); if (k === 'task') m.task.title = v; else m[k] = v; S.save(); };
A.mMat = (id, inp) => { const m = S.db.meetings.find(x => x.id === id);[...inp.files].forEach(f => m.materials.push({ name: f.name })); S.save(); toast('تم إرفاق المواد'); A.meeting(id); };
A.mSend = id => { const m = S.db.meetings.find(x => x.id === id); S.notify('all', 'meeting', m.title, `موعد اللقاء ${fmtD(m.date)} الساعة ${AR(m.time)} — الرابط متاح في صفحة اللقاءات.`); S.log('إرسال رابط لقاء', m.title); A.bulkContact(accepted().map(a => a.id), 'meeting', () => ({ 'اللقاء': m.title, 'الموعد': `${fmtD(m.date)} الساعة ${AR(m.time)}`, 'رابط_اللقاء': m.link }), 'إرسال رابط اللقاء'); };
A.meetForm = () => modal('إضافة لقاء', `<form id="mf" class="grid" onsubmit="return A.meetSave(event)"><div class="field"><label>عنوان اللقاء</label><input class="input" name="title" required></div><div class="grid g3"><div class="field"><label>النوع</label><select class="input" name="kind">${['متابعة', 'تمهيدي', 'تعريفي'].map(k => opt(k, k)).join('')}</select></div><div class="field"><label>التاريخ</label><input class="input" type="date" name="date" required></div><div class="field"><label>الوقت</label><input class="input" type="time" name="time" value="19:30"></div></div><div class="field"><label>رابط اللقاء</label><input class="input" name="link" dir="ltr" placeholder="https://"></div><div class="field"><label>التكليف المطلوب بعد اللقاء</label><input class="input" name="task"></div></form>`, `<button class="btn primary" onclick="$('#mf').requestSubmit()">إضافة</button><button class="btn ghost" onclick="closeModal()">إلغاء</button>`);
A.meetSave = e => { e.preventDefault(); const d = formData('#mf'); S.db.meetings.push({ id: 'm' + Date.now().toString(36), kind: d.kind, no: null, title: d.title, date: d.date, time: d.time, link: d.link, materials: [], task: { title: d.task || '—', due: d.date }, att: {}, done: {} }); S.log('إضافة لقاء', d.title); closeModal(); toast('تمت إضافة اللقاء'); R(); return false; };

/* ---------- الإشعارات ---------- */
const NIC = { info: 'bell', ok: 'check', warn: 'clock', file: 'file', meeting: 'video' };
const ntItem = (n, u) => `<div class="nt ${n.type} ${u && !n.read[u.id] ? 'new' : ''}"><div class="io">${icon(NIC[n.type] || 'bell')}</div><div class="grow"><div class="row between"><h4>${esc(n.title)}</h4><time>${ago(n.at)}</time></div><p>${esc(n.body)}</p>${u && u.role !== 'assoc' && n.to !== 'admin' ? `<div class="xs muted mt8">إلى: ${n.to === 'all' ? 'جميع الجمعيات' : esc((S.assoc(n.to) || {}).name || '')} · بواسطة ${esc((S.userById(n.by) || {}).name || 'النظام')}</div>` : ''}</div></div>`;
let ntTab = 'sent';
V.notifications = () => {
  const u = S.user(), inbox = S.notifsFor(u), sent = S.db.notifs.filter(n => n.to !== 'admin');
  return {
    title: 'الإشعارات والمراسلات', crumb: 'إعلانات عامة وتنبيهات للجمعيات مع سجل للمرسل',
    html: `<div class="grid cols2" style="grid-template-columns:1fr 1.3fr;align-items:start">
      <div class="card"><div class="hd"><h3>إشعار جديد</h3></div><form class="bd grid" id="nf" onsubmit="return A.sendNotif(event)">
        <div class="grid g2"><div class="field"><label>المرسل إليه</label><select class="input" name="to"><option value="all">جميع الجمعيات</option>${S.db.assocs.map(a => opt(a.id, a.name)).join('')}</select></div><div class="field"><label>النوع</label><select class="input" name="type">${opt('info', 'إعلان عام')}${opt('warn', 'تذكير بموعد')}${opt('meeting', 'رابط لقاء أو تحديث')}${opt('file', 'ملاحظة على ملف')}</select></div></div>
        <div class="field"><label>العنوان</label><input class="input" name="title" required></div><div class="field"><label>نص الإشعار</label><textarea class="input" name="body" required></textarea></div>
        <label class="row small" style="gap:8px"><input type="checkbox" name="email" checked> إرسال نسخة عبر البريد الإلكتروني</label>
        <label class="row small muted" style="gap:8px"><input type="checkbox" disabled> رسالة واتساب (تتاح عند ربط خدمة التكامل)</label>
        <div class="row"><button class="btn primary">${icon('send', 'sm')} إرسال</button><button type="button" class="btn soft" onclick="A.remindDue()">${icon('clock', 'sm')} تذكير آلي بالمواعيد القريبة</button></div></form></div>
      <div class="card"><div class="hd"><div class="tabs"><button class="${ntTab === 'sent' ? 'on' : ''}" onclick="ntTab='sent';R()">سجل المرسل (${AR(sent.length)})</button><button class="${ntTab === 'in' ? 'on' : ''}" onclick="ntTab='in';R()">تنبيهات الإدارة (${AR(inbox.length)})</button></div></div>
      <div style="max-height:640px;overflow:auto">${(ntTab === 'sent' ? sent : inbox).map(n => ntItem(n, u)).join('') || empty('لا توجد إشعارات', 'bell')}</div></div></div>`,
    after() { if (ntTab === 'in') { inbox.forEach(n => n.read[u.id] = true); S.save(); } },
  };
};
A.sendNotif = e => { e.preventDefault(); const d = formData('#nf'); S.notify(d.to, d.type, d.title, d.body); S.log('إرسال إشعار', `${d.title} ← ${d.to === 'all' ? 'جميع الجمعيات' : S.assoc(d.to).name}`); toast(d.email ? 'تم إرسال الإشعار داخل المنصة وعبر البريد' : 'تم إرسال الإشعار', 'send'); ntTab = 'sent'; R(); return false; };
A.remindDue = () => { let n = 0; accepted().forEach(a => { const rs = S.reqsFor(a).filter(r => { const d = daysTo(r.due); return d >= 0 && d <= 30 && S.sub(a.id, r.id).status === 'none' && S.stage(r.stage).state === 'open'; }); if (rs.length) { n++; S.notify(a.id, 'warn', 'تذكير بقرب موعد التسليم', `لديكم ${AR(rs.length)} متطلبات يقترب موعدها، أقربها «${rs[0].title}» (${dueTxt(rs[0].due)}).`); } }); S.log('تذكير آلي بالمواعيد', `${n} جمعية`); toast(`أُرسل التذكير إلى ${AR(n)} جمعية`, 'bell'); R(); };

/* ---------- سجل العمليات ---------- */
V.audit = () => ({
  title: 'سجل العمليات', crumb: 'توثيق من رفع الملف أو عدّل الدرجة ومتى',
  html: `<div class="card"><div class="toolbar"><div class="search">${icon('search', 'sm')}<input class="input sm" placeholder="بحث في السجل" oninput="const q=this.value.trim();$$('#auB tr').forEach(r=>r.style.display=r.textContent.includes(q)?'':'none')"></div><span class="grow"></span><button class="btn sm ghost" onclick="exportXlsx(S.db.audit.map(l=>({'التاريخ':fmtDT(l.at),'المستخدم':(S.userById(l.user)||{}).name||'النظام','العملية':l.action,'التفاصيل':l.target})),'سجل-العمليات','السجل')">${icon('excel', 'sm')} تصدير</button></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>التاريخ والوقت</th><th>المستخدم</th><th>العملية</th><th>التفاصيل</th></tr></thead><tbody id="auB">${S.db.audit.slice(0, 300).map(l => { const u = S.userById(l.user); return `<tr><td class="small num muted" style="white-space:nowrap">${fmtDT(l.at)}</td><td><div class="nm" style="min-width:150px">${av(u ? (u.assocId ? S.assoc(u.assocId).short : u.name) : 'ن', 'sm alt')}<span><b>${esc(u ? u.name : 'النظام')}</b><small>${u ? S.rolesOf(u).map(r => S.ROLES[r]).join(' + ') : ''}</small></span></div></td><td>${badge({ t: l.action, c: 'teal' }, 'plain')}</td><td class="small">${esc(l.target)}</td></tr>`; }).join('')}</tbody></table></div></div>`,
});

/* ---------- الإعدادات ---------- */
const STAFF_ROLES = ['director', 'assistant', 'evaluator'];
const PH = ['{الجمعية}', '{الممثل}', '{الرابط}', '{المرحلة}', '{المتطلب}', '{الموعد}', '{الملاحظة}', '{العدد}', '{اللقاء}', '{رابط_اللقاء}', '{المقيم}', '{المسار}'];
let tplKey = 'reminder';
V.settings = (tab = 'users') => {
  const staff = S.db.users.filter(u => !S.has(u, 'assoc')), dir = S.can('users'), set = S.db.settings, T = set.templates;
  const P = [['لوحة المؤشرات والتقارير وسجل العمليات', 1, 1, 0, 0], ['إدارة الجمعيات والمراحل والمتطلبات', 1, 1, 0, 0], ['مراجعة الملفات واعتمادها', 1, 1, 0, 0], ['توزيع المقيّمين وإعادة فتح الأوراق', 1, 1, 0, 0], ['إدخال الدرجات في ورقته المكلَّف بها', 0, 0, 1, 0], ['إدخال الدرجات نيابةً عن المقيّم', 0, set.assistantCanScore ? 1 : 0, 0, 0], ['تعديل المعايير وتثبيتها', 1, 0, 0, 0], ['اعتماد النتائج وإعلانها', 1, 0, 0, 0], ['إدارة المستخدمين والأدوار', 1, 0, 0, 0], ['رفع الوثائق والشواهد لجمعيته فقط', 0, 0, 0, 1], ['الاطلاع على النتائج بعد إعلانها', 0, 0, 0, 1]];
  const tabs = { users: 'المستخدمون والأدوار', perms: 'مصفوفة الصلاحيات', eval: 'إعدادات التقييم', messages: 'قوالب الرسائل', contact: 'بيانات التواصل', backup: 'النسخ الاحتياطي', cycle: 'دورات المبادرة' };
  if (!tabs[tab]) tab = 'users';
  const t = T[tplKey] || T.general, demo = S.fill(tplKey, { ...assocCtx(S.db.assocs[0], { 'المتطلب': 'تقرير الأنشطة — الشهر الثاني', 'الموعد': fmtD(S.db.requirements[16].due), 'الملاحظة': 'نأمل إرفاق كشف الحضور الموقّع.', 'العدد': '٣', 'اللقاء': 'لقاء المتابعة الشهري', 'رابط_اللقاء': 'https://meet.example.org', 'المقيم': 'د. هيفاء الراشد', 'المسار': 'تقييم التنفيذ' }) });
  const body = {
    users: `<div class="toolbar"><span class="grow small muted">يمكن للمستخدم أن يجمع أكثر من دور (مثل مساعد إداري + مقيّم). حسابات الجمعيات تُدار من صفحة الجمعيات ولا تُجمع مع أدوار الفريق تجنّبًا لتعارض المصالح.</span>${dir ? `<button class="btn sm primary" onclick="A.userForm()">${icon('plus', 'sm')} إضافة مستخدم</button>` : ''}</div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>المستخدم</th><th>الأدوار</th><th>التواصل</th><th>تكليفات التقييم</th><th></th></tr></thead><tbody>${staff.map(u => { const n = Object.keys(S.db.tracks).reduce((s, k) => s + Object.keys(S.db.assign[k] || {}).filter(id => S.assigned(k, id).includes(u.id)).length, 0); return `<tr><td><div class="nm">${av(u.name, 'alt')}<span><b>${esc(u.name)}</b><small dir="ltr" style="text-align:right;display:block">${esc(u.email)}</small></span></div></td><td><div class="row" style="gap:6px">${S.rolesOf(u).map(r => badge({ t: S.ROLES[r], c: r === 'director' ? 'ok' : r === 'assistant' ? 'info' : 'teal' }, 'plain')).join('')}</div></td><td class="small" dir="ltr" style="text-align:right">${esc(u.phone || '—')}</td><td class="num">${S.has(u, 'evaluator') ? AR(n) + ' جمعية' : '<span class="muted">—</span>'}</td><td><div class="acts">${dir ? `<button class="btn sm icon ghost" onclick="A.userForm('${u.id}')" title="تعديل">${icon('edit', 'sm')}</button>` : ''}${S.has(u, 'evaluator') ? `<button class="btn sm icon wa-soft" onclick="A.contactUser('${u.id}')" title="مراسلة">${waIcon('sm')}</button>` : ''}${dir && u.id !== S.user().id ? `<button class="btn sm icon ghost" onclick="A.userDel('${u.id}')" title="حذف">${icon('trash', 'sm')}</button>` : ''}</div></td></tr>`; }).join('')}</tbody></table></div>`,
    perms: `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الصلاحية</th><th class="center">مدير المبادرة</th><th class="center">المساعد الإداري</th><th class="center">لجنة التقييم</th><th class="center">الجمعية</th></tr></thead><tbody>${P.map(p => `<tr><td>${p[0]}</td>${p.slice(1).map(v => `<td class="center">${v ? `<span style="color:var(--ok)">${icon('check')}</span>` : '<span class="muted">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="bd"><div class="note info" style="margin:0">${icon('shield', 'sm')}<span>صلاحيات من يجمع أكثر من دور = اتحاد صلاحيات أدواره. فصلنا إدخال الدرجات عن الإدارة: لا يُدخل الدرجة إلا المقيّم المكلَّف، ويستطيع المدير والمساعد الاطلاع وإعادة فتح الورقة فقط.</span></div></div>`,
    eval: `<form class="bd grid" id="evf" onsubmit="return A.saveEvalSet(event)" style="max-width:820px">
      <div class="grid g2"><div class="field"><label>الحد الأدنى لعدد المقيّمين لكل جمعية</label><input class="input num" type="number" min="1" max="9" name="minEvaluators" value="${set.minEvaluators}"><small class="muted xs">لا تُعدّ نتيجة الجمعية مكتملة حتى يعتمد جميع المقيّمين المكلَّفين أوراقهم.</small></div>
      <div class="field"><label>حد التنبيه على تباين المقيّمين (٪)</label><input class="input num" type="number" min="5" max="60" name="gapAlert" value="${set.gapAlert}"><small class="muted xs">يُنبَّه المدير إذا تجاوز الفرق بين أعلى وأدنى درجة هذه النسبة.</small></div></div>
      <div class="field"><label>أوزان المؤشر النهائي للتميز</label><div class="wsplit"><span>تقييم الوثائق <b class="num" id="wD">${AR(set.weights.docs)}٪</b></span><input type="range" min="0" max="100" step="5" name="wDocs" value="${set.weights.docs}" oninput="$('#wD').textContent=AR(this.value)+'٪';$('#wE').textContent=AR(100-this.value)+'٪'"><span>تقييم التنفيذ <b class="num" id="wE">${AR(set.weights.exec)}٪</b></span></div><small class="muted xs">المؤشر النهائي = متوسط موزون لنسبتي المسارين، ويُستخدم لترتيب الجمعيات المتميزة.</small></div>
      <label class="row" style="gap:10px;flex-wrap:nowrap"><button type="button" class="switch ${set.assistantCanScore ? 'on' : ''}" onclick="this.classList.toggle('on')" id="acs" aria-label="السماح بالإدخال نيابةً"></button><span><b style="font-weight:500">السماح للمساعد الإداري بإدخال الدرجات نيابةً عن المقيّم</b><br><small class="muted">مفيد عند استلام أوراق ورقية؛ يُوثَّق في السجل باسم المُدخِل.</small></span></label>
      <div class="row"><button class="btn primary">${icon('check', 'sm')} حفظ إعدادات التقييم</button></div></form>`,
    messages: `<div class="tplw"><div class="tpll">${Object.entries(T).map(([k, x]) => `<button class="${k === tplKey ? 'on' : ''}" onclick="tplKey='${k}';R()">${icon(k === 'toAdmin' ? 'building' : k === 'evaluator' ? 'star' : 'mail', 'sm')}<span>${esc(x.title)}</span></button>`).join('')}</div>
      <form class="tple" id="tf" onsubmit="return A.saveTpl(event)"><div class="field"><label>اسم القالب</label><input class="input" name="title" value="${esc(t.title)}" required></div>
      <div class="field"><label>عنوان البريد</label><input class="input" name="subject" id="tSub" value="${esc(t.subject)}"></div>
      <div class="field"><label>نص الرسالة (واتساب والبريد)</label><textarea class="input" name="body" id="tBody" rows="10" style="line-height:1.9" oninput="A.tplPreview()">${esc(t.body)}</textarea></div>
      <div class="field"><label>متغيرات تُستبدل تلقائيًا — اضغط للإدراج</label><div class="chips">${PH.map(p => `<button type="button" class="chip2" onclick="A.tplIns('${p}')">${p}</button>`).join('')}</div></div>
      <div class="row"><button class="btn primary">${icon('check', 'sm')} حفظ القالب</button><span class="small muted">تُستخدم القوالب في أزرار واتساب والبريد في كل المنصة.</span></div></form>
      <div class="tplp"><small>معاينة كما تصل في واتساب</small><div class="wabub" id="tPrev">${esc(demo.body).replace(/\n/g, '<br>')}</div></div></div>`,
    contact: `<form class="bd grid" id="cf" onsubmit="return A.saveContact(event)" style="max-width:720px"><p class="small muted">تظهر في الواجهة الرئيسية وفي زر «تواصل مع الإدارة» لدى الجمعيات.</p>
      <div class="grid g2"><div class="field"><label>رقم واتساب الإدارة</label><input class="input" name="whatsapp" dir="ltr" style="text-align:right" value="${esc(set.contact.whatsapp)}"></div><div class="field"><label>البريد الإلكتروني</label><input class="input" type="email" name="email" dir="ltr" style="text-align:right" value="${esc(set.contact.email)}"></div></div>
      <div class="field"><label>الموقع الإلكتروني</label><input class="input" name="site" dir="ltr" style="text-align:right" value="${esc(set.contact.site)}"></div>
      <div class="row"><button class="btn primary">${icon('check', 'sm')} حفظ</button><a class="btn wa" target="_blank" rel="noopener" href="${esc(waUrl(set.contact.whatsapp, 'تجربة رابط واتساب من منصة سجايا'))}">${waIcon('sm')} تجربة الرابط</a></div></form>`,
    backup: `<div class="bd grid g2"><div><h3 style="font-size:15px">نسخة احتياطية كاملة</h3><p class="small muted mt8">تنزيل جميع بيانات المبادرة (الجمعيات، الملفات، التقييمات، السجل) في ملف واحد يمكن استعادته لاحقًا. في البيئة التشغيلية يُجدول النسخ آليًا يوميًا.</p><div class="row mt16"><button class="btn primary" onclick="A.backup()">${icon('download', 'sm')} تنزيل نسخة احتياطية</button><label class="btn ghost" style="cursor:pointer">${icon('upload', 'sm')} استعادة من ملف<input type="file" accept=".json" hidden onchange="A.restore(this)"></label></div></div>
      <div><h3 style="font-size:15px">بيانات العرض التجريبي</h3><p class="small muted mt8">إعادة ضبط المنصة إلى البيانات التجريبية الأصلية وحذف كل التعديلات التي أُجريت في هذا المتصفح.</p><button class="btn danger mt16" onclick="A.resetAsk()">${icon('refresh', 'sm')} إعادة ضبط البيانات</button></div></div>`,
    cycle: `<div class="bd"><div class="row between"><div><h3 style="font-size:15px">${esc(S.db.cycle)}</h3><p class="small muted">الدورة الحالية · ${AR(S.db.assocs.length)} جمعية · ${AR(S.db.requirements.length)} متطلبًا</p></div>${badge({ t: 'نشطة', c: 'ok' })}</div><div class="note info mt16">${icon('alert', 'sm')}<span>عند انتهاء المبادرة تُؤرشف الدورة بجميع وثائقها ونتائجها للاطلاع فقط، ويمكن بدء دورة جديدة بنسخ المراحل والمعايير دون التأثير على البيانات السابقة.</span></div><button class="btn ghost mt16" disabled>${icon('plus', 'sm')} بدء دورة جديدة (بعد إغلاق الدورة الحالية)</button></div>`,
  };
  return { title: 'الإعدادات والصلاحيات', crumb: tabs[tab], html: `<div class="tabs mb16">${Object.entries(tabs).map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" onclick="go('settings/${k}')">${n}</button>`).join('')}</div><div class="card">${body[tab]}</div>` };
};
A.userForm = id => {
  const u = id ? S.userById(id) : { name: '', email: '', phone: '', roles: ['evaluator'] }, rs = S.rolesOf(u);
  modal(id ? 'تعديل مستخدم' : 'إضافة مستخدم', `<form id="uf" class="grid" onsubmit="return A.userSave(event,'${id || ''}')"><div class="field"><label>الاسم</label><input class="input" name="name" required value="${esc(u.name)}"></div>
    <div class="grid g2"><div class="field"><label>البريد الإلكتروني</label><input class="input" type="email" name="email" required dir="ltr" value="${esc(u.email)}"></div><div class="field"><label>الجوال (واتساب)</label><input class="input" name="phone" dir="ltr" placeholder="05xxxxxxxx" value="${esc(u.phone || '')}"></div></div>
    <div class="field"><label>الأدوار — يمكن اختيار أكثر من دور</label><div class="rolepick">${STAFF_ROLES.map(r => `<label class="${rs.includes(r) ? 'on' : ''}"><input type="checkbox" name="r_${r}" ${rs.includes(r) ? 'checked' : ''} onchange="this.parentElement.classList.toggle('on',this.checked)"><b>${S.ROLES[r]}</b><small>${{ director: 'إشراف عام واعتماد النتائج', assistant: 'الجمعيات والملفات والمراحل والتوزيع', evaluator: 'تقييم الجمعيات المكلَّف بها فقط' }[r]}</small></label>`).join('')}</div></div></form>`,
    `<button class="btn primary" onclick="$('#uf').requestSubmit()">${id ? 'حفظ' : 'إضافة وإرسال الدعوة'}</button><button class="btn ghost" onclick="closeModal()">إلغاء</button>`);
};
A.userSave = (e, id) => {
  e.preventDefault(); const d = formData('#uf'), roles = STAFF_ROLES.filter(r => d['r_' + r]), email = d.email.trim().toLowerCase();
  if (!roles.length) return toast('اختر دورًا واحدًا على الأقل', 'alert'), false;
  if (S.db.users.some(x => x.id !== id && x.email.toLowerCase() === email)) return toast('هذا البريد مسجّل لمستخدم آخر — لا يُسمح بتكرار الحسابات', 'alert'), false;
  if (id) { const u = S.userById(id), old = S.rolesOf(u); if (old.includes('director') && !roles.includes('director') && S.db.users.filter(x => S.has(x, 'director')).length < 2) return toast('يجب أن يبقى مدير واحد على الأقل للمبادرة', 'alert'), false; if (old.includes('evaluator') && !roles.includes('evaluator') && Object.keys(S.db.tracks).some(k => Object.keys(S.db.evals[k]).some(a => S.db.evals[k][a][id]))) return toast('لا يمكن إزالة دور المقيّم: لديه أوراق تقييم مسجّلة', 'alert'), false; Object.assign(u, { name: d.name, email: d.email.trim(), phone: d.phone, roles }); delete u.role; S.log('تعديل مستخدم', `${d.name} — ${roles.map(r => S.ROLES[r]).join(' + ')}`); }
  else { S.db.users.push({ id: 'u' + Date.now().toString(36), name: d.name, email: d.email.trim(), phone: d.phone, roles }); S.log('إضافة مستخدم', `${d.name} — ${roles.map(r => S.ROLES[r]).join(' + ')}`); }
  closeModal(); toast(id ? 'تم حفظ المستخدم' : 'تمت إضافة المستخدم وإرسال الدعوة', id ? 'check' : 'mail'); R(); return false;
};
A.userDel = id => {
  const u = S.userById(id), used = Object.keys(S.db.tracks).some(k => Object.keys(S.db.evals[k]).some(a => S.db.evals[k][a][id]));
  if (used) return toast('لا يمكن حذف مقيّم له أوراق تقييم مسجّلة', 'alert');
  if (S.has(u, 'director') && S.db.users.filter(x => S.has(x, 'director')).length < 2) return toast('لا يمكن حذف المدير الوحيد', 'alert');
  Object.keys(S.db.assign).forEach(k => Object.keys(S.db.assign[k]).forEach(a => S.db.assign[k][a] = S.db.assign[k][a].filter(x => x !== id)));
  S.db.users = S.db.users.filter(x => x.id !== id); S.log('حذف مستخدم', u.name); toast('تم حذف المستخدم وإلغاء تكليفاته'); R();
};
A.saveEvalSet = e => { e.preventDefault(); const d = formData('#evf'), s = S.db.settings; s.minEvaluators = Math.max(1, +d.minEvaluators || 1); s.gapAlert = Math.max(5, +d.gapAlert || 15); s.weights = { docs: +d.wDocs, exec: 100 - +d.wDocs }; s.assistantCanScore = $('#acs').classList.contains('on'); S.log('تعديل إعدادات التقييم', `الحد الأدنى ${s.minEvaluators} · التباين ${s.gapAlert}% · الأوزان ${s.weights.docs}/${s.weights.exec}`); toast('تم حفظ إعدادات التقييم'); R(); return false; };
A.saveTpl = e => { e.preventDefault(); const d = formData('#tf'); Object.assign(S.db.settings.templates[tplKey], d); S.log('تعديل قالب رسالة', d.title); toast('تم حفظ القالب'); R(); return false; };
A.tplIns = p => { const ta = $('#tBody'), i = ta.selectionStart ?? ta.value.length; ta.value = ta.value.slice(0, i) + p + ta.value.slice(ta.selectionEnd ?? i); ta.focus(); ta.selectionStart = ta.selectionEnd = i + p.length; A.tplPreview(); };
A.tplPreview = () => { const ctx = { ...assocCtx(S.db.assocs[0], { 'المتطلب': 'تقرير الأنشطة — الشهر الثاني', 'الموعد': '١٢ ديسمبر', 'الملاحظة': 'نأمل إرفاق كشف الحضور الموقّع.', 'العدد': '٣', 'اللقاء': 'لقاء المتابعة الشهري', 'رابط_اللقاء': 'https://meet.example.org', 'المقيم': 'د. هيفاء الراشد', 'المسار': 'تقييم التنفيذ' }) }; $('#tPrev').innerHTML = esc($('#tBody').value.replace(/\{([^}]+)\}/g, (m, k) => ctx[k] !== undefined ? ctx[k] : m)).replace(/\n/g, '<br>'); };
A.saveContact = e => { e.preventDefault(); Object.assign(S.db.settings.contact, formData('#cf')); S.log('تعديل بيانات التواصل', ''); toast('تم حفظ بيانات التواصل'); R(); return false; };
A.backup = () => { downloadText(`sajaya-backup-${S.today()}.json`, JSON.stringify(S.db)); S.log('تنزيل نسخة احتياطية', S.today()); toast('تم تنزيل النسخة الاحتياطية', 'database'); };
A.restore = inp => { const f = inp.files[0]; if (!f) return; f.text().then(t => { try { const d = JSON.parse(t); if (!d.assocs || !d.stages) throw 0; Object.keys(S.db).forEach(k => delete S.db[k]); Object.assign(S.db, d); S.log('استعادة نسخة احتياطية', f.name); toast('تمت استعادة البيانات'); R(); } catch (e) { toast('الملف غير صالح', 'alert'); } }); };
A.resetAsk = () => modal('إعادة ضبط البيانات', '<p>ستُحذف كل التعديلات وتعود المنصة إلى البيانات التجريبية الأصلية. هل تريد المتابعة؟</p>', `<button class="btn danger" onclick="S.reset();S.login('u1');closeModal();toast('أُعيد ضبط البيانات');R()">إعادة الضبط</button><button class="btn ghost" onclick="closeModal()">تراجع</button>`);
