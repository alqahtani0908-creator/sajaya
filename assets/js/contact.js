/* ===== التواصل عبر واتساب والبريد برسائل جاهزة قابلة للتعديل ===== */
const appLink = (p = 'login') => location.origin + location.pathname.replace(/[^/]*$/, '') + 'app.html#/' + p;
const waUrl = (phone, text) => `https://wa.me/${S.normPhone(phone)}?text=${encodeURIComponent(text)}`;
const mailUrl = (to, subject, body, bcc) => `mailto:${to ? encodeURIComponent(to) : ''}?${bcc ? 'bcc=' + encodeURIComponent(bcc) + '&' : ''}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const assocCtx = (a, extra = {}) => ({ 'الجمعية': a.name, 'الممثل': a.rep.name, 'الرابط': appLink('login'), 'المرحلة': S.currentStage(a).name, 'المنصة': 'منصة سجايا', ...extra });
const WA_IC = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor;stroke:none"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3z"/></svg>';
const waIcon = (cls = '') => WA_IC.replace('class="ic"', `class="ic ${cls}"`);

/* نافذة مراسلة جهة واحدة: قالب + نص قابل للتعديل + أزرار واتساب/بريد/إشعار/نسخ */
let CT = null;
A.contact = (aId, key = 'general', extra = {}) => {
  const a = S.assoc(aId); if (!a) return;
  CT = { kind: 'assoc', aId, extra, name: a.name, person: a.rep.name, phone: a.rep.phone, email: a.rep.email, key };
  ctModal();
};
A.contactUser = (uId, key = 'evaluator', extra = {}) => {
  const u = S.userById(uId); if (!u) return;
  CT = { kind: 'user', uId, extra: { 'المقيم': u.name, 'الرابط': appLink('eval-home'), ...extra }, name: u.name, person: u.name, phone: u.phone, email: u.email, key };
  ctModal();
};
A.contactAdmin = () => {
  const u = S.user(), a = S.assoc(u.assocId), c = S.db.settings.contact;
  CT = { kind: 'admin', aId: a.id, extra: {}, name: 'إدارة مبادرة سجايا', person: 'إدارة المبادرة', phone: c.whatsapp, email: c.email, key: 'toAdmin' };
  ctModal();
};
function ctText(key) {
  const ctx = CT.kind === 'user' ? { ...CT.extra } : assocCtx(S.assoc(CT.aId), CT.extra);
  return S.fill(key, ctx);
}
function ctModal() {
  const T = S.db.settings.templates, msg = ctText(CT.key), keys = CT.kind === 'admin' ? ['toAdmin'] : CT.kind === 'user' ? ['evaluator', 'general'] : Object.keys(T).filter(k => !['toAdmin', 'evaluator'].includes(k));
  modal(`${waIcon('sm')} مراسلة — ${esc(CT.name)}`, `
    <div class="ctto"><div class="row" style="gap:12px;flex-wrap:nowrap">${av(CT.name, 'alt')}<div class="grow" style="min-width:0"><b>${esc(CT.person)}</b><div class="xs muted">${esc(CT.name)}</div></div>
      <div class="ctway"><span dir="ltr">${esc(CT.phone || '—')}</span><span dir="ltr">${esc(CT.email || '—')}</span></div></div></div>
    ${keys.length > 1 ? `<div class="field mt16"><label>القالب</label><div class="chips" id="ctKeys">${keys.map(k => `<button type="button" class="chip2 ${k === CT.key ? 'on' : ''}" onclick="A.ctKey('${k}')">${esc(T[k].title)}</button>`).join('')}</div></div>` : ''}
    <div class="field mt16"><label>عنوان البريد</label><input class="input" id="ctSub" value="${esc(msg.subject)}"></div>
    <div class="field mt16"><label class="row between"><span>نص الرسالة</span><span class="xs muted">يمكنك التعديل قبل الإرسال · القوالب الدائمة من الإعدادات</span></label><textarea class="input" id="ctBody" rows="9" style="line-height:1.9">${esc(msg.body)}</textarea></div>`,
    `<button class="btn wa" onclick="A.ctSend('wa')" ${CT.phone ? '' : 'disabled'}>${waIcon('sm')} إرسال عبر واتساب</button>
     <button class="btn primary" onclick="A.ctSend('mail')" ${CT.email ? '' : 'disabled'}>${icon('mail', 'sm')} البريد الإلكتروني</button>
     ${CT.kind === 'assoc' ? `<button class="btn ghost" onclick="A.ctSend('inapp')">${icon('bell', 'sm')} إشعار داخل المنصة</button>` : ''}
     <button class="btn ghost icon" title="نسخ النص" onclick="A.ctSend('copy')">${icon('clipboard', 'sm')}</button>`);
}
A.ctKey = k => { CT.key = k; const m = ctText(k); $('#ctSub').value = m.subject; $('#ctBody').value = m.body; $$('#ctKeys .chip2').forEach(b => b.classList.toggle('on', b.getAttribute('onclick').includes(`'${k}'`))); };
A.ctSend = way => {
  const sub = $('#ctSub').value, body = $('#ctBody').value;
  if (way === 'wa') open(waUrl(CT.phone, body), '_blank', 'noopener');
  else if (way === 'mail') location.href = mailUrl(CT.email, sub, body);
  else if (way === 'copy') { navigator.clipboard && navigator.clipboard.writeText(body).then(() => toast('تم نسخ الرسالة', 'clipboard')); return; }
  else if (way === 'inapp') { S.notify(CT.aId, 'info', sub, body); toast('أُرسل الإشعار داخل المنصة', 'bell'); }
  S.log(way === 'wa' ? 'مراسلة عبر واتساب' : way === 'mail' ? 'مراسلة عبر البريد' : 'إشعار داخل المنصة', `${S.db.settings.templates[CT.key].title} ← ${CT.name}`);
  if (way !== 'inapp') toast(way === 'wa' ? 'فُتح واتساب بالرسالة الجاهزة' : 'فُتح البريد بالرسالة الجاهزة', way === 'wa' ? 'send' : 'mail');
  closeModal();
};

/* مراسلة جماعية: لكل جمعية زر واتساب برسالتها المخصّصة، مع بريد جماعي بنسخة مخفية */
A.bulkContact = (ids, key = 'general', extraFn = () => ({}), title = 'مراسلة جماعية') => {
  const list = ids.map(id => S.assoc(id)).filter(Boolean); if (!list.length) return toast('لا توجد جمعيات في هذه القائمة', 'alert');
  const T = S.db.settings.templates[key], m0 = S.fill(key, assocCtx(list[0], extraFn(list[0])));
  modal(`${waIcon('sm')} ${esc(title)}`, `
    <div class="note info" style="margin:0 0 14px">${icon('alert', 'sm')}<span>رسالة «${esc(T.title)}» مخصّصة باسم كل جمعية وممثلها. اضغط واتساب لكل جمعية، أو أرسل بريدًا جماعيًا دفعة واحدة.</span></div>
    <div class="bulk">${list.map(a => `<div class="brow" id="br_${a.id}">${av(a.short, 'sm alt')}<div class="grow" style="min-width:0"><b>${esc(a.name)}</b><div class="xs muted">${esc(a.rep.name)}</div></div>
      <a class="btn sm wa" target="_blank" rel="noopener" href="${esc(waUrl(a.rep.phone, S.fill(key, assocCtx(a, extraFn(a))).body))}" onclick="A.bulkMark('${a.id}','واتساب','${esc(T.title)}')">${waIcon('sm')}</a>
      <a class="btn sm ghost icon" href="${esc(mailUrl(a.rep.email, S.fill(key, assocCtx(a, extraFn(a))).subject, S.fill(key, assocCtx(a, extraFn(a))).body))}" onclick="A.bulkMark('${a.id}','البريد','${esc(T.title)}')" title="بريد">${icon('mail', 'sm')}</a><span class="sent">${icon('check', 'sm')}</span></div>`).join('')}</div>`,
    `<a class="btn primary" href="${esc(mailUrl('', m0.subject.replace(list[0].name, 'جمعيات مبادرة سجايا'), m0.body.replace(list[0].rep.name, 'ممثلي الجمعيات').replace(list[0].name, 'الجمعيات المشاركة'), list.map(a => a.rep.email).join(',')))}" onclick="S.log('بريد جماعي','${esc(T.title)} ← ${list.length} جمعية')">${icon('mail', 'sm')} بريد جماعي (${AR(list.length)})</a>
     <button class="btn ghost" onclick="A.bulkInapp('${ids.join(',')}','${key}')">${icon('bell', 'sm')} إشعار داخل المنصة للجميع</button>`, true);
};
A.bulkMark = (id, via, t) => { const r = document.getElementById('br_' + id); if (r) r.classList.add('done'); S.log('مراسلة عبر ' + via, `${t} ← ${S.assoc(id).name}`); };
A.bulkInapp = (ids, key) => { ids.split(',').forEach(id => { const a = S.assoc(id), m = S.fill(key, assocCtx(a)); S.notify(id, 'info', m.subject, m.body); }); S.log('إشعار جماعي', `${S.db.settings.templates[key].title} ← ${ids.split(',').length} جمعية`); closeModal(); toast('أُرسل الإشعار لجميع الجمعيات المحددة', 'bell'); };
A.contactLate = () => {
  const late = S.db.assocs.filter(a => a.status === 'accepted' && S.stats(a).overdue > 0);
  A.bulkContact(late.map(a => a.id), 'late', a => ({ 'العدد': AR(S.stats(a).overdue) }), 'مراسلة الجمعيات المتأخرة');
};

/* أزرار سريعة تُستخدم في الجداول والبطاقات */
const quickContact = (aId, key = 'general', extra) => `<button class="btn sm icon wa-soft" title="واتساب / بريد" onclick="event.stopPropagation();A.contact('${aId}','${key}'${extra ? `,${esc(JSON.stringify(extra))}` : ''})">${waIcon('sm')}</button>`;
