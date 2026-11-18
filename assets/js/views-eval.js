/* ===== التقييم والتقارير ===== */
const eligible = k => k === 'docs' ? S.db.assocs.filter(a => S.sub(a.id, docReq().id).status !== 'none') : accepted();
const evaluators = () => S.db.users.filter(u => u.role === 'evaluator');
const hbar = (n, v, max, txt) => `<div class="hbar"><span>${esc(n)}</span><div class="progress"><i style="width:${max ? Math.round((v || 0) / max * 100) : 0}%"></i></div><b class="num" style="text-align:end">${txt}</b></div>`;
const rankB = i => `<span class="rank r${i + 1} num">${AR(i + 1)}</span>`;

/* ---------- التقييم والنتائج (الإدارة) ---------- */
V.evaluation = (k = 'docs', tab = 'results') => {
  const t = S.db.tracks[k]; if (!t) return null;
  const evs = evaluators(), list = eligible(k), max = S.trackMax(k), dir = S.can('approve');
  const rows = list.map(a => ({ a, score: S.trackScore(k, a.id) })).sort((x, y) => (y.score ?? -1) - (x.score ?? -1));
  const doneAll = rows.filter(r => r.score !== null).length, hasEvals = Object.keys(S.db.evals[k]).length > 0;
  const results = !t.locked ? `<div class="lockbox"><div class="lk">${icon('lock', 'lg')}</div><h3>لم يبدأ التقييم بعد</h3><p class="muted mt8">راجع المعايير والأوزان ثم ثبّت نسخة المعايير لبدء إدخال الدرجات.</p><button class="btn soft mt16" onclick="go('evaluation/${k}/criteria')">مراجعة المعايير</button></div>` :
    `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الترتيب</th><th>الجمعية</th>${evs.map(e => `<th>${esc(e.name)}</th>`).join('')}<th>المتوسط من ${AR(max)}</th><th></th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${r.score === null ? '<span class="muted">—</span>' : rankB(i)}</td><td><div class="nm">${av(r.a.short, 'sm alt')}<span><b>${esc(r.a.name)}</b><small>${esc(r.a.city)}</small></span></div></td>
      ${evs.map(e => { const ev = S.evalOf(k, r.a.id, e.id); return `<td class="num">${!ev ? '<span class="muted small">لم يبدأ</span>' : ev.done ? `<b>${AR(S.evalTotal(ev))}</b>` : `<span class="badge warn plain">مسودة ${AR(S.evalTotal(ev))}</span>`}</td>`; }).join('')}
      <td>${r.score === null ? '<span class="muted">—</span>' : `<div class="pbar"><div class="progress"><i style="width:${r.score / max * 100}%"></i></div><b class="num" style="font-family:var(--f-head);color:var(--teal-700)">${AR(r.score)}</b></div>`}</td>
      <td><div class="acts">${t.approved ? '' : `<a class="btn sm soft" href="#/evaluate/${k}/${r.a.id}">${icon('edit', 'sm')} الدرجات</a>`}${r.score !== null ? `<a class="btn sm icon ghost" href="#/report/eval/${k}/${r.a.id}" title="تقرير التقييم">${icon('file', 'sm')}</a>` : ''}</div></td></tr>`).join('') || `<tr><td colspan="9">${empty('لا توجد جمعيات مؤهلة للتقييم بعد')}</td></tr>`}</tbody></table></div>`;
  const total = t.criteria.reduce((s, c) => s + c.inds.reduce((x, n) => x + (+n.max || 0), 0), 0);
  const criteria = t.locked ? `<div class="bd"><div class="note ok">${icon('lock', 'sm')}<span>المعايير مثبتة (النسخة ${AR(t.version)}) منذ ${fmtD(t.lockedAt)}، ولا يمكن تعديلها حفاظًا على سلامة النتائج المسجلة.${dir && !hasEvals ? ` <a href="javascript:A.unlockTrack('${k}')">إلغاء التثبيت</a>` : ''}</span></div>
      ${t.criteria.map((c, i) => `<div class="crit mt16"><div class="ch"><span class="rank num">${AR(i + 1)}</span><h3>${esc(c.name)}</h3><span class="wt num">${AR(c.inds.reduce((x, n) => x + n.max, 0))} درجة</span></div>${c.inds.map(n => `<div class="ind"><div>${esc(n.name)} ${n.dom ? badge({ t: S.DOMAINS[n.dom], c: 'teal' }, 'plain') : ''}<div class="ev">${n.reqs.map(id => S.req(id) ? `<span class="no">${icon('link', 'sm')}${esc(S.req(id).title)}</span>` : '').join('')}</div></div><div class="sc"><b class="num">${AR(n.max)}</b><span class="muted small">درجات</span></div></div>`).join('')}</div>`).join('')}</div>` :
    `<div class="bd"><div class="row between"><div class="note info" style="margin:0;flex:1">${icon('edit', 'sm')}<span>يمكن تعديل المعايير والمؤشرات والأوزان بحرية قبل التثبيت. بعد بدء التقييم تُثبَّت النسخة ولا تتغير النتائج السابقة.</span></div><span class="badge ${total === 100 ? 'ok' : 'warn'}" id="cTot">مجموع الأوزان: ${AR(total)} / ١٠٠</span></div>
      ${t.criteria.map((c, ci) => `<div class="crit mt16"><div class="ch"><span class="rank num">${AR(ci + 1)}</span><input class="input sm" style="flex:1" value="${esc(c.name)}" onchange="A.cSet('${k}',${ci},this.value)" aria-label="اسم المعيار"><span class="wt num">${AR(c.inds.reduce((x, n) => x + (+n.max || 0), 0))} درجة</span><button class="btn sm icon ghost" onclick="A.cDel('${k}',${ci})" title="حذف المعيار">${icon('trash', 'sm')}</button></div>
        ${c.inds.map((n, ii) => `<div class="ind"><div><input class="input sm" value="${esc(n.name)}" onchange="A.iSet('${k}',${ci},${ii},'name',this.value)" aria-label="المؤشر"><div class="row mt8" style="gap:6px"><select class="input sm" style="width:auto" onchange="A.iSet('${k}',${ci},${ii},'dom',this.value)" aria-label="المجال"><option value="">بدون مجال</option>${Object.entries(S.DOMAINS).map(([d, nm]) => opt(d, nm, n.dom)).join('')}</select><select class="input sm" style="width:auto;max-width:230px" onchange="A.iSet('${k}',${ci},${ii},'req',this.value)" aria-label="ربط شاهد"><option value="">＋ ربط بشاهد مرفوع</option>${S.db.requirements.map(r => opt(r.id, r.title)).join('')}</select>${n.reqs.map(id => S.req(id) ? `<span class="badge teal plain" style="cursor:pointer" onclick="A.iSet('${k}',${ci},${ii},'unreq','${id}')">${esc(S.req(id).title)} ✕</span>` : '').join('')}</div></div>
          <div class="sc"><input class="input sm num" type="number" min="1" max="100" value="${n.max}" onchange="A.iSet('${k}',${ci},${ii},'max',this.value)" aria-label="الدرجة العظمى"><button class="btn sm icon ghost" onclick="A.iDel('${k}',${ci},${ii})" title="حذف المؤشر">${icon('x', 'sm')}</button></div></div>`).join('')}
        <div class="ind"><button class="btn sm soft" style="width:max-content" onclick="A.iAdd('${k}',${ci})">${icon('plus', 'sm')} مؤشر</button></div></div>`).join('')}
      <div class="row mt16"><button class="btn ghost" onclick="A.cAdd('${k}')">${icon('plus', 'sm')} إضافة معيار</button><span class="grow"></span>${dir ? `<button class="btn primary" onclick="A.lockTrack('${k}')">${icon('lock', 'sm')} تثبيت المعايير وبدء التقييم</button>` : '<span class="small muted">تثبيت المعايير من صلاحيات مدير المبادرة</span>'}</div></div>`;
  return {
    title: 'التقييم والنتائج', crumb: 'مساران مستقلان: تقييم الوثائق وتقييم التميز في التنفيذ',
    html: `<div class="tabs mb16">${Object.values(S.db.tracks).map(x => `<button class="${x.key === k ? 'on' : ''}" onclick="go('evaluation/${x.key}')">${x.name}</button>`).join('')}</div>
    <div class="steps3">
      <div class="s3 ${t.locked ? 'on' : ''}"><div class="io">${icon('lock', 'sm')}</div><div><b>١. تثبيت المعايير</b><small>${t.locked ? `النسخة ${AR(t.version)} · ${fmtDs(t.lockedAt)}` : 'قابلة للتعديل'}</small></div></div>
      <div class="s3 ${t.locked && doneAll ? 'on' : ''}"><div class="io">${icon('star', 'sm')}</div><div><b>٢. إدخال الدرجات</b><small>${AR(doneAll)} من ${AR(list.length)} جمعية مقيّمة</small></div></div>
      <div class="s3 ${t.approved ? 'on' : ''}"><div class="io">${icon('shield', 'sm')}</div><div class="grow"><b>٣. اعتماد النتائج</b><small>${t.approved ? 'معتمدة · ' + fmtDs(t.approvedAt) : 'بانتظار مدير المبادرة'}</small></div>${dir && t.locked ? `<button class="switch ${t.approved ? 'on' : ''}" onclick="A.approveTrack('${k}')" aria-label="اعتماد النتائج"></button>` : ''}</div>
      <div class="s3 ${t.published ? 'on' : ''}"><div class="io">${icon('eye', 'sm')}</div><div class="grow"><b>٤. الإعلان للجمعيات</b><small>${t.published ? 'النتائج ظاهرة للجمعيات' : 'مخفية عن الجمعيات'}</small></div>${dir && t.approved ? `<button class="switch ${t.published ? 'on' : ''}" onclick="A.publishTrack('${k}')" aria-label="نشر النتائج"></button>` : ''}</div>
    </div>
    <div class="card sect"><div class="toolbar"><div class="tabs"><button class="${tab === 'results' ? 'on' : ''}" onclick="go('evaluation/${k}/results')">النتائج والترتيب</button><button class="${tab === 'criteria' ? 'on' : ''}" onclick="go('evaluation/${k}/criteria')">المعايير والأوزان</button></div><span class="grow"></span>
      ${tab === 'results' && doneAll ? `<a class="btn sm ghost" href="#/report/compare/${k}">${icon('chart', 'sm')} تقرير المقارنة</a><button class="btn sm ghost" onclick="A.exportResults('${k}')">${icon('excel', 'sm')} تصدير Excel</button>` : ''}</div>${tab === 'criteria' ? criteria : results}</div>`,
  };
};
const trk = k => S.db.tracks[k];
A.cSet = (k, ci, v) => { trk(k).criteria[ci].name = v; S.save(); };
A.iSet = (k, ci, ii, f, v) => { const n = trk(k).criteria[ci].inds[ii]; if (f === 'max') n.max = Math.max(1, +v || 1); else if (f === 'dom') n.dom = v || null; else if (f === 'req') { if (v && !n.reqs.includes(v)) n.reqs.push(v); } else if (f === 'unreq') n.reqs = n.reqs.filter(x => x !== v); else n.name = v; S.save(); if (f !== 'name') R(); };
A.cAdd = k => { trk(k).criteria.push({ id: k[0] + S.uid(), name: 'معيار جديد', inds: [{ id: S.uid(), name: 'مؤشر جديد', max: 5, dom: null, reqs: [] }] }); S.save(); R(); };
A.iAdd = (k, ci) => { trk(k).criteria[ci].inds.push({ id: S.uid(), name: 'مؤشر جديد', max: 5, dom: null, reqs: [] }); S.save(); R(); };
A.cDel = (k, ci) => { trk(k).criteria.splice(ci, 1); S.save(); R(); };
A.iDel = (k, ci, ii) => { const c = trk(k).criteria[ci]; if (c.inds.length < 2) return toast('يجب أن يحتوي المعيار على مؤشر واحد على الأقل', 'alert'); c.inds.splice(ii, 1); S.save(); R(); };
A.lockTrack = k => { const t = trk(k), m = S.trackMax(k); if (m !== 100) return toast(`مجموع الأوزان ${AR(m)} — يجب أن يساوي ١٠٠ قبل التثبيت`, 'alert'); modal('تثبيت المعايير وبدء التقييم', `<p>ستُثبَّت نسخة المعايير الحالية لمسار «${t.name}» ويبدأ المقيّمون بإدخال الدرجات. لا يمكن تعديل المعايير بعد تسجيل أي تقييم.</p>`, `<button class="btn primary" onclick="A.lockGo('${k}')">تثبيت وبدء التقييم</button><button class="btn ghost" onclick="closeModal()">تراجع</button>`); };
A.lockGo = k => { const t = trk(k); t.locked = true; t.lockedAt = new Date().toISOString(); S.log('تثبيت نسخة المعايير', `${t.short} — النسخة ${t.version}`); closeModal(); toast('تم تثبيت المعايير وفتح التقييم'); go(`evaluation/${k}/results`); };
A.unlockTrack = k => { const t = trk(k); t.locked = false; t.version++; S.log('إلغاء تثبيت المعايير', t.short); toast('أُلغي التثبيت ويمكن تعديل المعايير'); R(); };
A.approveTrack = k => { const t = trk(k); if (!t.approved) { const miss = eligible(k).filter(a => S.trackScore(k, a.id) === null).length; if (miss) return toast(`${AR(miss)} جمعية لم يكتمل تقييمها بعد`, 'alert'); } t.approved = !t.approved; t.approvedAt = t.approved ? new Date().toISOString() : null; if (!t.approved) t.published = false; S.log(t.approved ? 'اعتماد نتائج' : 'إلغاء اعتماد نتائج', t.name); toast(t.approved ? 'تم اعتماد النتائج' : 'أُلغي اعتماد النتائج'); R(); };
A.publishTrack = k => { const t = trk(k); t.published = !t.published; S.log(t.published ? 'نشر النتائج للجمعيات' : 'إخفاء النتائج عن الجمعيات', t.name); if (t.published) S.notify('all', 'ok', `إعلان نتائج ${t.short}`, 'تم اعتماد النتائج ويمكن الاطلاع عليها من صفحة نتائج التقييم.'); toast(t.published ? 'أصبحت النتائج ظاهرة للجمعيات' : 'أُخفيت النتائج عن الجمعيات', 'eye'); R(); };
A.exportResults = k => exportXlsx(S.ranking(k).map((x, i) => { const o = { 'الترتيب': i + 1, 'الجمعية': x.a.name, 'المدينة': x.a.city }; S.critScores(k, x.a.id).forEach(c => o[`${c.name} (${c.max})`] = c.score); evaluators().forEach(e => { const ev = S.evalOf(k, x.a.id, e.id); o[e.name] = ev && ev.done ? S.evalTotal(ev) : ''; }); o['المتوسط النهائي'] = x.score; return o; }), `نتائج-${trk(k).short}`, 'النتائج');

/* ---------- نموذج إدخال الدرجات ---------- */
V.evaluate = (k, aId, eId) => {
  const t = S.db.tracks[k], a = S.assoc(aId), u = S.user(); if (!t || !a) return null;
  const evs = evaluators(); if (u.role === 'evaluator') eId = u.id; else eId = eId || evs[0].id;
  const ev = S.evalOf(k, aId, eId) || { scores: {}, note: '', done: false }, ro = t.approved, back = u.role === 'evaluator' ? 'eval-home' : 'evaluation/' + k, max = S.trackMax(k);
  if (!t.locked) return { title: t.name, crumb: '', html: `<div class="card lockbox"><div class="lk">${icon('lock', 'lg')}</div><h3>لم يُفتح هذا المسار للتقييم بعد</h3><p class="muted mt8">سيُتاح إدخال الدرجات بعد تثبيت المعايير من مدير المبادرة.</p><a class="btn soft mt16" href="#/${back}">رجوع</a></div>` };
  return {
    title: t.name, crumb: `<a href="#/${back}">${u.role === 'evaluator' ? 'مهام التقييم' : 'التقييم والنتائج'}</a>`,
    html: `<div class="card"><div class="bd row" style="gap:16px">${av(a.short, 'lg')}<div class="grow"><h2 style="font-size:19px">${esc(a.name)}</h2><p class="small muted">${esc(a.city)} · ${t.name} — النسخة ${AR(t.version)}</p></div>
      ${u.role !== 'evaluator' ? `<div class="field"><label>الإدخال باسم المقيّم</label><select class="input sm" onchange="go('evaluate/${k}/${aId}/'+this.value)">${evs.map(e => opt(e.id, e.name, eId)).join('')}</select></div>` : ''}
      ${ro ? badge({ t: 'النتائج معتمدة — للعرض فقط', c: 'ok' }) : ev.done ? badge({ t: 'تقييم مكتمل', c: 'ok' }) : badge({ t: Object.keys(ev.scores).length ? 'مسودة' : 'لم يبدأ', c: 'warn' })}</div></div>
    <div class="sect">${t.criteria.map((c, i) => `<div class="crit"><div class="ch"><span class="rank num">${AR(i + 1)}</span><h3>${esc(c.name)}</h3><span class="wt num">${AR(c.inds.reduce((x, n) => x + n.max, 0))} درجة</span></div>
      ${c.inds.map(n => { const files = n.reqs.flatMap(id => S.sub(aId, id).files.map(f => ({ f, r: S.req(id) }))); return `<div class="ind"><div><b style="font-weight:500">${esc(n.name)}</b> ${n.dom ? badge({ t: S.DOMAINS[n.dom], c: 'teal' }, 'plain') : ''}<div class="ev">${files.length ? files.map(x => `<a onclick="A.fileOpen('${x.f.id}')" title="${esc(x.r.title)}">${icon('link', 'sm')}${esc(x.f.name)}</a>`).join('') : n.reqs.length ? '<span class="no">لم تُرفع الشواهد المرتبطة بعد</span>' : ''}</div></div>
        <div class="sc"><input class="input num" type="number" min="0" max="${n.max}" step="0.5" id="sc_${n.id}" value="${ev.scores[n.id] ?? ''}" ${ro ? 'disabled' : ''} oninput="A.evTotal(this,${n.max})" aria-label="${esc(n.name)}"><span class="muted small num">/ ${AR(n.max)}</span></div></div>`; }).join('')}</div>`).join('')}</div>
    <div class="card sect"><div class="bd field"><label>ملاحظات وتوصيات المقيّم</label><textarea class="input" id="evNote" ${ro ? 'disabled' : ''} placeholder="أبرز نقاط القوة وفرص التحسين...">${esc(ev.note)}</textarea></div></div>
    <div class="totalbar"><div><div class="small" style="color:rgba(255,255,255,.6)">المجموع</div><div class="tv num"><span id="evT">${AR(S.evalTotal(ev))}</span> <small>/ ${AR(max)}</small></div></div><span class="grow"></span>
      ${ro ? `<a class="btn ghost" href="#/${back}">رجوع</a>` : `<a class="btn" style="background:rgba(255,255,255,.1);color:#fff" href="#/${back}">إلغاء</a><button class="btn" style="background:rgba(255,255,255,.1);color:#fff" onclick="A.evSave('${k}','${aId}','${eId}',false)">حفظ كمسودة</button><button class="btn primary" onclick="A.evSave('${k}','${aId}','${eId}',true)">${icon('check', 'sm')} اعتماد التقييم</button>`}</div>`,
  };
};
A.evTotal = (el, max) => { if (+el.value > max) el.value = max; if (+el.value < 0) el.value = 0; $('#evT').textContent = AR($$('.ind .sc input[id^="sc_"]').reduce((t, i) => t + (+i.value || 0), 0)); };
A.evSave = (k, aId, eId, done) => {
  const scores = {}; let miss = 0;
  trk(k).criteria.forEach(c => c.inds.forEach(n => { const el = document.getElementById('sc_' + n.id); if (el.value === '') miss++; else scores[n.id] = Math.max(0, Math.min(n.max, +el.value)); }));
  if (done && miss) return toast(`أدخل درجات جميع المؤشرات (${AR(miss)} متبقية)`, 'alert');
  (S.db.evals[k][aId] = S.db.evals[k][aId] || {})[eId] = { scores, note: $('#evNote').value.trim(), done, at: new Date().toISOString() };
  S.log(done ? 'إدخال درجات' : 'حفظ مسودة تقييم', `${trk(k).short} · ${S.assoc(aId).name} · ${S.userById(eId).name}`);
  toast(done ? 'تم اعتماد التقييم' : 'تم حفظ المسودة'); if (done) go(S.user().role === 'evaluator' ? 'eval-home' : 'evaluation/' + k); else R();
};

/* ---------- لوحة المقيّم ---------- */
let evTrack = 'docs';
V['eval-home'] = () => {
  const u = S.user(), t = S.db.tracks[evTrack], list = eligible(evTrack), mine = a => S.evalOf(evTrack, a.id, u.id), done = list.filter(a => mine(a) && mine(a).done).length;
  return {
    title: 'مهام التقييم', crumb: 'لجنة التقييم',
    html: `<div class="hello"><div>${av(u.name, 'lg')}</div><div><h2>مرحبًا ${esc(u.name)}</h2><p>تقييم الجمعيات وفق المعايير المعتمدة، مع الاطلاع على الوثائق والشواهد المرتبطة بكل مؤشر.</p></div></div>
    <div class="grid g2 sect">${Object.values(S.db.tracks).map(x => { const l = eligible(x.key), d = l.filter(a => { const e = S.evalOf(x.key, a.id, u.id); return e && e.done; }).length; return `<div class="kpi" style="cursor:pointer;${evTrack === x.key ? 'border-color:var(--teal);box-shadow:0 0 0 4px rgba(48,144,140,.1)' : ''}" onclick="evTrack='${x.key}';R()"><div class="io">${icon(x.key === 'docs' ? 'file' : 'award')}</div><div class="grow"><div class="l b">${x.name}</div><div class="s">${!x.locked ? 'لم يُفتح بعد' : x.approved ? 'النتائج معتمدة' : 'التقييم جارٍ'} · أنجزت ${AR(d)} من ${AR(l.length)}</div><div class="progress mt8"><i style="width:${l.length ? d / l.length * 100 : 0}%"></i></div></div></div>`; }).join('')}</div>
    <div class="card sect"><div class="hd"><h3>${t.name}</h3><span class="sub">${AR(done)} من ${AR(list.length)} مكتملة</span></div>
    ${!t.locked ? `<div class="lockbox"><div class="lk">${icon('lock', 'lg')}</div><h3>لم يُفتح هذا المسار بعد</h3><p class="muted mt8">سيصلك إشعار عند تثبيت المعايير وبدء التقييم.</p></div>` : `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>الجمعية</th><th>حالة تقييمي</th><th>درجتي</th><th></th></tr></thead><tbody>${list.map(a => { const e = mine(a); return `<tr><td><div class="nm">${av(a.short, 'sm alt')}<span><b>${esc(a.name)}</b><small>${esc(a.city)}</small></span></div></td><td>${badge(!e ? { t: 'لم يبدأ', c: '' } : e.done ? { t: 'مكتمل', c: 'ok' } : { t: 'مسودة', c: 'warn' })}</td><td class="num b">${e ? AR(S.evalTotal(e)) : '—'}</td><td><div class="acts"><a class="btn sm ${e && e.done ? 'ghost' : 'primary'}" href="#/evaluate/${evTrack}/${a.id}">${t.approved ? 'عرض' : e && e.done ? 'تعديل' : e ? 'استكمال' : 'بدء التقييم'}</a></div></td></tr>`; }).join('')}</tbody></table></div>`}</div>`,
  };
};

/* ---------- مركز التقارير ---------- */
V.reports = () => {
  const rc = (ic, t, d, btn) => `<div class="card"><div class="bd"><div class="kpi" style="border:0;box-shadow:none;padding:0"><div class="io">${icon(ic)}</div><div><h3 style="font-size:16px">${t}</h3><p class="small muted mt8">${d}</p></div></div><div class="row mt16">${btn}</div></div></div>`;
  const sel = `<select class="input sm" id="rpA" style="flex:1;min-width:150px">${S.db.assocs.map(a => opt(a.id, a.name)).join('')}</select>`;
  return {
    title: 'التقارير', crumb: 'تقارير قابلة للطباعة والتصدير بصيغتي PDF و Excel',
    html: `<div class="grid g3">
      ${rc('building', 'التقرير الفردي للجمعية', 'بيانات الجمعية، المرحلة الحالية، نسبة الإنجاز، الالتزام، حالة الوثائق، نتائج التقييم وأبرز الملاحظات.', `${sel}<button class="btn sm primary" onclick="go('report/assoc/'+$('#rpA').value)">عرض التقرير</button>`)}
      ${rc('chart', 'التقرير العام للمبادرة', 'عدد الجمعيات، نسب الإنجاز العامة، تقدم المراحل، نتائج التقييمين، وأبرز المؤشرات والتحديات.', `<a class="btn sm primary" href="#/report/general">عرض التقرير</a>`)}
      ${rc('trophy', 'تقرير المقارنة بين الجمعيات', 'مقارنة أداء الجمعيات وفق المعايير المعتمدة مع ترتيب النتائج وإمكانية التصدير.', `<a class="btn sm primary" href="#/report/compare/docs">تقييم الوثائق</a><a class="btn sm ghost" href="#/report/compare/exec">تقييم التنفيذ</a>`)}
      ${rc('award', 'تقارير تقييم الوثائق والتنفيذ', 'تقرير تقييم مستقل لكل جمعية بدرجات المعايير والمؤشرات وملاحظات المقيمين.', `<select class="input sm" id="rpE" style="flex:1;min-width:150px">${S.db.assocs.filter(a => S.trackScore('docs', a.id) !== null).map(a => opt(a.id, a.name)).join('')}</select><button class="btn sm primary" onclick="go('report/eval/docs/'+$('#rpE').value)">عرض</button>`)}
      ${rc('clock', 'تقرير الالتزام والإنجاز', 'نسب الإنجاز والالتزام الزمني والمتطلبات المتأخرة وحضور اللقاءات لكل جمعية.', `<a class="btn sm primary" href="#/report/commit">عرض التقرير</a>`)}
      ${rc('excel', 'تصدير البيانات', 'تصدير قوائم الجمعيات والنتائج وسجل العمليات إلى Excel.', `<button class="btn sm ghost" onclick="A.exportAssocs()">الجمعيات</button><button class="btn sm ghost" onclick="A.exportResults('docs')">نتائج الوثائق</button>`)}
    </div>`,
  };
};
const repWrap = (title, sub, body, tools = '') => `<div class="row between noprint mb16" style="max-width:940px;margin-inline:auto"><button class="btn ghost" onclick="history.back()">${icon('back', 'sm')} رجوع</button><div class="row">${tools}<button class="btn primary" onclick="print()">${icon('print', 'sm')} طباعة / حفظ PDF</button></div></div>
  <div class="report"><div class="cover"><img src="assets/img/icon-white.png" alt=""><div><h1>${title}</h1><p>${sub}</p></div><div class="dt">مبادرة سجايا<br>${esc(S.db.cycle)}<br>${fmtD(new Date())}</div></div><div class="body">${body}</div><div class="foot"><span>منصة سجايا الرقمية — قيم أصيلة.. وطباع نبيلة</span><span>تنفيذ <img src="assets/img/partners/itmam-color.png" alt="جمعية إتمام للتمكين القيمي للأيتام"> · برعاية <img src="assets/img/partners/majed-logo-primary.svg" alt="مؤسسة أبناء علي بن عثمان الماجد الأهلية"></span></div></div>`;
const evalBlock = (k, a) => { const t = trk(k), sc = S.trackScore(k, a.id), rk = S.ranking(k), pos = rk.findIndex(x => x.a.id === a.id); if (sc === null) return ''; return `<h2>${t.name}</h2><div class="rk" style="grid-template-columns:repeat(3,1fr)"><div><b class="num">${AR(sc)}</b><span>الدرجة من ${AR(S.trackMax(k))}</span></div><div><b class="num">${AR(pos + 1)}</b><span>الترتيب من ${AR(rk.length)}</span></div><div><b class="num">${AR(S.doneEvals(k, a.id).length)}</b><span>عدد المقيمين</span></div></div><div class="mt16">${S.critScores(k, a.id).map(c => hbar(c.name, c.score, c.max, `${AR(c.score)} / ${AR(c.max)}`)).join('')}</div>`; };

V.report = (type, p1, p2) => {
  const u = S.user(), isA = u.role === 'assoc', crumb = isA ? '' : u.role === 'evaluator' ? '' : '<a href="#/reports">التقارير</a>';
  if (isA && !(['assoc', 'eval'].includes(type) && (type === 'assoc' ? p1 : p2) === u.assocId)) return null;
  if (u.role === 'evaluator' && type !== 'eval') return null;

  if (type === 'assoc') {
    const a = S.assoc(p1); if (!a) return null; const st = S.stats(a), cs = S.currentStage(a), dp = S.domainPerf(a.id);
    const past = S.db.meetings.filter(m => a.id in m.att), att = past.length ? Math.round(past.filter(m => m.att[a.id]).length / past.length * 100) : null;
    const show = k => !isA || S.visibleToAssoc(k), notes = S.reqsFor(a).map(r => ({ r, x: S.sub(a.id, r.id) })).filter(o => o.x.status === 'revise' && o.x.note);
    const evNotes = Object.keys(S.db.tracks).filter(show).flatMap(k => S.doneEvals(k, a.id).map(e => e.note).filter(Boolean));
    return {
      title: 'تقرير أداء الجمعية', crumb, html: repWrap('تقرير أداء الجمعية', esc(a.name), `
      <h2>بيانات الجمعية</h2><div class="dl"><div><span>الجمعية</span><b>${esc(a.name)}</b></div><div><span>المدينة</span><b>${esc(a.city)}</b></div><div><span>ممثل الجمعية</span><b>${esc(a.rep.name)}</b></div><div><span>حالة التسجيل</span>${stBadge(a)}</div><div><span>المرحلة الحالية</span><b>${esc(cs.name)}</b></div><div><span>حالة الالتزام</span>${hBadge(st.health)}</div></div>
      <h2>المؤشرات العامة</h2><div class="rk"><div><b class="num">${pct(st.progress)}</b><span>مستوى الإنجاز العام</span></div><div><b class="num">${AR(st.approved)} / ${AR(st.total)}</b><span>المتطلبات المكتملة</span></div><div><b class="num">${pct(st.commit)}</b><span>الالتزام الزمني</span></div><div><b class="num">${att === null ? '—' : pct(att)}</b><span>حضور اللقاءات</span></div></div>
      <h2>التقدم حسب المراحل</h2>${S.db.stages.filter(s => s.id <= S.cap(a)).map(s => { const p = S.stageProgress(a, s); return hbar(`${s.id}. ${s.name}`.replace(/^\d+/, d => AR(d)), p, 100, pct(p)); }).join('')}
      ${Object.keys(S.db.tracks).map(k => show(k) ? evalBlock(k, a) : S.trackScore(k, a.id) !== null || trk(k).locked ? `<h2>${trk(k).name}</h2><div class="note info">${icon('lock', 'sm')}<span>تظهر النتائج بعد اعتمادها وإعلانها رسميًا من إدارة المبادرة.</span></div>` : '').join('')}
      ${Object.values(dp).some(v => v !== null) && show('docs') ? `<h2>الأداء في المجالات الثلاثة</h2>${Object.entries(S.DOMAINS).map(([d, n]) => hbar(n, dp[d], 100, dp[d] === null ? '—' : pct(dp[d]))).join('')}` : ''}
      <h2>حالة الوثائق والشواهد</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>المتطلب</th><th>الموعد</th><th>الحالة</th><th>آخر تحديث</th><th></th></tr></thead><tbody>${reqTable(a, false)}</tbody></table></div>
      <h2>أبرز الملاحظات</h2>${notes.length || evNotes.length ? `<ul style="margin:0;padding-inline-start:20px;line-height:2.1">${notes.map(o => `<li><b>${esc(o.r.title)}:</b> ${esc(o.x.note)}</li>`).join('')}${evNotes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : '<p class="muted">لا توجد ملاحظات مفتوحة.</p>'}`),
    };
  }

  if (type === 'eval') {
    const k = p1, a = S.assoc(p2), t = trk(k); if (!a || !t || S.trackScore(k, a.id) === null || (isA && !S.visibleToAssoc(k))) return null;
    const es = S.doneEvals(k, a.id);
    return {
      title: 'تقرير التقييم', crumb, html: repWrap(`تقرير ${t.name}`, esc(a.name), `${evalBlock(k, a).replace(/<h2>.*?<\/h2>/, '<h2>ملخص النتيجة</h2>')}
      <h2>تفصيل المعايير والمؤشرات</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>المعيار / المؤشر</th><th>الدرجة العظمى</th><th>متوسط المقيمين</th><th>النسبة</th></tr></thead><tbody>${t.criteria.map(c => { const cs = S.critScores(k, a.id).find(x => x.id === c.id); return `<tr style="background:#FAFBFC"><td class="b">${esc(c.name)}</td><td class="num b">${AR(cs.max)}</td><td class="num b">${AR(cs.score)}</td><td class="num b">${pct(Math.round(cs.score / cs.max * 100))}</td></tr>` + c.inds.map(n => { const v = +(es.reduce((s, e) => s + (+e.scores[n.id] || 0), 0) / es.length).toFixed(1); return `<tr><td style="padding-inline-start:34px">${esc(n.name)}</td><td class="num">${AR(n.max)}</td><td class="num">${AR(v)}</td><td class="num">${pct(Math.round(v / n.max * 100))}</td></tr>`; }).join(''); }).join('')}</tbody></table></div>
      <h2>ملاحظات وتوصيات لجنة التقييم</h2><ul style="margin:0;padding-inline-start:20px;line-height:2.1">${es.filter(e => e.note).map((e, i) => `<li><b>المقيّم ${AR(i + 1)}:</b> ${esc(e.note)}</li>`).join('') || '<li class="muted">لا توجد ملاحظات.</li>'}</ul>
      <p class="small muted mt24">حالة النتيجة: ${t.approved ? `معتمدة من مدير المبادرة بتاريخ ${fmtD(t.approvedAt)}` : 'أولية — لم تُعتمد بعد'}.</p>`),
    };
  }

  const acc = accepted(), st = Object.fromEntries(S.db.assocs.map(a => [a.id, S.stats(a)]));
  if (type === 'general') {
    const avg = Math.round(acc.reduce((t, a) => t + st[a.id].progress, 0) / (acc.length || 1)), com = Math.round(acc.reduce((t, a) => t + st[a.id].commit, 0) / (acc.length || 1));
    const hc = h => acc.filter(a => st[a.id].health === h).length;
    const missed = S.db.requirements.filter(r => r.mandatory && r.due < S.today()).map(r => ({ r, n: acc.filter(a => ['none', 'revise'].includes(S.sub(a.id, r.id).status)).length })).sort((x, y) => y.n - x.n)[0];
    const tb = k => { const rk = S.ranking(k); if (!rk.length) return `<p class="muted">${trk(k).locked ? 'التقييم جارٍ ولم تكتمل النتائج.' : 'لم يبدأ هذا المسار بعد.'}</p>`; const v = rk.map(x => x.score), cs = trk(k).criteria.map((c, i) => { const mx = c.inds.reduce((x, n) => x + n.max, 0); return { name: c.name, max: mx, v: +(rk.reduce((s, x) => s + S.critScores(k, x.a.id)[i].score, 0) / rk.length).toFixed(1) }; }); return `<div class="rk"><div><b class="num">${AR(rk.length)}</b><span>جمعيات مقيّمة</span></div><div><b class="num">${AR((v.reduce((a, b) => a + b, 0) / v.length).toFixed(1))}</b><span>متوسط الدرجات</span></div><div><b class="num">${AR(Math.max(...v))}</b><span>أعلى درجة</span></div><div><b class="num">${AR(Math.min(...v))}</b><span>أدنى درجة</span></div></div><div class="mt16">${cs.map(c => hbar(c.name, c.v, c.max, `${AR(c.v)} / ${AR(c.max)}`)).join('')}</div>`; };
    const weak = (() => { const rk = S.ranking('docs'); if (!rk.length) return null; return trk('docs').criteria.map((c, i) => ({ c, p: rk.reduce((s, x) => { const z = S.critScores('docs', x.a.id)[i]; return s + z.score / z.max; }, 0) / rk.length })).sort((x, y) => x.p - y.p)[0]; })();
    return {
      title: 'التقرير العام للمبادرة', crumb, html: repWrap('التقرير العام للمبادرة', 'ملخص تنفيذي لمؤشرات مبادرة سجايا', `
      <h2>الجمعيات</h2><div class="rk"><div><b class="num">${AR(S.db.assocs.length)}</b><span>جمعيات مسجلة</span></div><div><b class="num">${AR(acc.length)}</b><span>مقبولة للمشاركة</span></div><div><b class="num">${pct(avg)}</b><span>متوسط الإنجاز العام</span></div><div><b class="num">${pct(com)}</b><span>متوسط الالتزام الزمني</span></div></div>
      <div class="mt16">${hbar('تسير وفق الخطة', hc('ok'), acc.length, AR(hc('ok')))}${hbar('تحتاج إلى استكمال', hc('warn'), acc.length, AR(hc('warn')))}${hbar('متأخرة عن الخطة', hc('bad'), acc.length, AR(hc('bad')))}</div>
      <h2>مستوى تقدم المراحل</h2>${S.db.stages.map(s => { const p = Math.round(acc.reduce((t, a) => t + S.stageProgress(a, s), 0) / (acc.length || 1)); return hbar(`${AR(s.id)}. ${s.name}`, p, 100, s.state === 'locked' ? 'مغلقة' : pct(p)); }).join('')}
      <h2>نتائج تقييم الوثائق</h2>${tb('docs')}<h2>نتائج تقييم التنفيذ</h2>${tb('exec')}
      <h2>أبرز المؤشرات والتحديات</h2><ul style="margin:0;padding-inline-start:20px;line-height:2.1">
        <li>${AR(hc('bad'))} جمعيات متأخرة عن الخطة و${AR(hc('warn'))} تحتاج إلى استكمال بعض المتطلبات.</li>
        ${missed && missed.n ? `<li>أكثر المتطلبات تأخرًا: «${esc(missed.r.title)}» — لم تستكمله ${AR(missed.n)} جمعيات.</li>` : ''}
        ${weak ? `<li>أضعف معايير الوثائق أداءً: «${esc(weak.c.name)}» بمتوسط ${pct(Math.round(weak.p * 100))}.</li>` : ''}
        <li>${AR(Object.values(S.db.subs).filter(s => s.status === 'pending').length)} ملفات بانتظار مراجعة الإدارة.</li></ul>`),
    };
  }

  if (type === 'compare') {
    const k = p1 || 'docs', t = trk(k), rk = S.ranking(k);
    return {
      title: 'تقرير المقارنة بين الجمعيات', crumb, html: repWrap('تقرير المقارنة بين الجمعيات', t.name + (t.approved ? ' — نتائج معتمدة' : ' — نتائج أولية'), rk.length ? `
      <h2>ترتيب الجمعيات حسب النتائج</h2><div class="tbl-wrap"><table class="tbl" style="font-size:13px"><thead><tr><th>#</th><th>الجمعية</th>${t.criteria.map(c => `<th style="white-space:normal;min-width:76px">${esc(c.name)}<br><span class="num">(${AR(c.inds.reduce((x, n) => x + n.max, 0))})</span></th>`).join('')}<th>المجموع</th><th>الإنجاز</th><th>الالتزام</th></tr></thead><tbody>${rk.map((x, i) => `<tr><td>${rankB(i)}</td><td class="b" style="white-space:nowrap">${esc(x.a.short)}</td>${S.critScores(k, x.a.id).map(c => `<td class="num">${AR(c.score)}</td>`).join('')}<td class="num b" style="color:var(--teal-700)">${AR(x.score)}</td><td class="num">${pct(st[x.a.id].progress)}</td><td class="num">${pct(st[x.a.id].commit)}</td></tr>`).join('')}</tbody></table></div>
      <h2>المقارنة البيانية</h2>${rk.map(x => hbar(x.a.name, x.score, S.trackMax(k), AR(x.score))).join('')}` : `<div class="lockbox"><div class="lk">${icon('lock', 'lg')}</div><h3>لا توجد نتائج في هذا المسار بعد</h3></div>`, rk.length ? `<button class="btn ghost" onclick="A.exportResults('${k}')">${icon('excel', 'sm')} تصدير Excel</button>` : ''),
    };
  }

  if (type === 'commit') {
    const rows = [...acc].sort((a, b) => st[b.id].progress - st[a.id].progress);
    const attOf = a => { const p = S.db.meetings.filter(m => a.id in m.att); return p.length ? Math.round(p.filter(m => m.att[a.id]).length / p.length * 100) : 0; };
    return {
      title: 'تقرير الالتزام والإنجاز', crumb, html: repWrap('تقرير الالتزام والإنجاز', 'نسب الإنجاز والالتزام الزمني لكل جمعية', `
      <div class="note info" style="margin:0 0 18px">${icon('alert', 'sm')}<span>قاعدة التصنيف: 🟢 لا توجد متطلبات إلزامية متأخرة · 🟡 المتأخر لا يتجاوز ٢٠٪ من المتطلبات المستحقة · 🔴 المتأخر أكثر من ٢٠٪.</span></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>الجمعية</th><th>الإنجاز</th><th>الالتزام الزمني</th><th>متأخرة</th><th>حضور اللقاءات</th><th>الحالة</th></tr></thead><tbody>${rows.map(a => `<tr><td class="b">${esc(a.name)}</td><td>${bar(st[a.id].progress)}</td><td class="num">${pct(st[a.id].commit)}</td><td class="num">${AR(st[a.id].overdue)}</td><td class="num">${pct(attOf(a))}</td><td>${hBadge(st[a.id].health)}</td></tr>`).join('')}</tbody></table></div>`,
        `<button class="btn ghost" onclick="exportXlsx(accepted().map(a=>{const s=S.stats(a);return{'الجمعية':a.name,'الإنجاز %':s.progress,'الالتزام %':s.commit,'متطلبات متأخرة':s.overdue,'الحالة':S.HEALTH[s.health].t}}),'تقرير-الالتزام','الالتزام')">${icon('excel', 'sm')} تصدير Excel</button>`),
    };
  }
  return null;
};
