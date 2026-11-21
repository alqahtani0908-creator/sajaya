/* ===== تفاعلات الواجهة الرئيسية ===== */
(() => {
  hydrateIcons();
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const fmt = d => new Date(d).toLocaleDateString('ar-SA-u-ca-gregory-nu-arab', { day: 'numeric', month: 'long' });
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('#yr').textContent = AR(new Date().getFullYear());

  /* البداية */
  const start = () => document.body.classList.add('ready');
  requestAnimationFrame(() => requestAnimationFrame(start));

  /* شريط القيم */
  const vals = ['الصدق', 'الرحمة', 'الأمانة', 'النبل', 'الصفاء', 'الوفاء', 'الحياء', 'الكرم', 'بر الوالدين', 'الشجاعة', 'السنع', 'المروءة'];
  // عِقد السجايا: كل قيمة لؤلؤة منظومة في خيط، صفّان بحركتين متعاكستين
  const bead = v => `<span class="bead"><i class="pearl" aria-hidden="true"></i><span>${v}</span></span>`;
  const half = Math.ceil(vals.length / 2), r1 = vals.slice(0, half).concat(vals.slice(half)), r2 = vals.slice(half).concat(vals.slice(0, half));
  $('#nk1').innerHTML = (r1.map(bead).join('')).repeat(4); $('#nk2').innerHTML = (r2.map(bead).join('')).repeat(4);

  /* التواصل من إعدادات المنصة */
  const C = (S.db.settings || {}).contact || { whatsapp: '0503700028', email: 'info@itmaam.org.sa', site: 'https://itmaam.org.sa' };
  const wa = d => { d = String(d).replace(/\D/g, ''); return d.startsWith('966') ? d : d.startsWith('05') ? '966' + d.slice(1) : d; };
  const fmtPh = d => String(d).replace(/\D/g, '').replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
  $('#ctWa').href = 'https://wa.me/' + wa(C.whatsapp) + '?text=' + encodeURIComponent('السلام عليكم ورحمة الله وبركاته\nأرغب في الاستفسار عن مبادرة سجايا.');
  $('#ctWaN').textContent = fmtPh(C.whatsapp);
  $('#ctMail').href = 'mailto:' + C.email + '?subject=' + encodeURIComponent('استفسار عن مبادرة سجايا'); $('#ctMailN').textContent = C.email;
  $('#ctSite').href = C.site; $('#ctSiteN').textContent = C.site.replace(/^https?:\/\//, '').replace(/\/$/, '');

  /* المراحل */
  const gs = S.globalStage(), stages = S.db.stages, acc = S.db.assocs.filter(a => a.status === 'accepted');
  const avg = acc.length ? Math.round(acc.reduce((t, a) => t + S.stageProgress(a, gs), 0) / acc.length) : 0;
  const left = Math.max(0, Math.ceil((new Date(gs.end) - new Date()) / 864e5));
  $('#nowCard').innerHTML = `<span class="pulse">${icon('flag')}</span><div style="flex:1;min-width:180px"><small>المرحلة الحالية · ${AR(gs.id)} من ${AR(stages.length)}</small><b>${gs.name}</b></div><div class="bar"><span>متوسط الإنجاز ${AR(avg)}٪ · متبقٍ ${AR(left)} يوم</span><div><i style="width:${avg}%"></i></div></div>`;
  $('#tl').insertAdjacentHTML('beforeend', stages.map(s => {
    const st = s.id === gs.id ? 'now' : s.state === 'done' ? 'done' : '';
    return `<div class="st ${st}" data-id="${s.id}"><span class="dot"></span><div class="box"><div class="n"><span>المرحلة ${AR(s.id)}</span><em>${st === 'now' ? 'جارية الآن' : st === 'done' ? 'مكتملة' : 'قادمة'}</em></div><h4>${s.name}</h4><p>${s.desc}</p><div class="d">${icon('calendar', 'sm')} ${fmt(s.start)} — ${fmt(s.end)}</div></div></div>`;
  }).join(''));

  /* الإعلانات */
  $('#newsList').innerHTML = S.db.notifs.filter(n => n.to === 'all').slice(0, 4).map(n => { const d = new Date(n.at); return `<div class="it"><div class="dt"><div><b class="num">${AR(d.getDate())}</b>${d.toLocaleDateString('ar-SA-u-ca-gregory', { month: 'short' })}</div></div><div><h4>${n.title}</h4><p>${n.body}</p></div></div>`; }).join('');

  /* العدّاد */
  const count = el => { const to = +el.dataset.count, t0 = performance.now(), dur = 1600; const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = AR(Math.round(to * e)); if (p < 1) requestAnimationFrame(step); }; RM ? el.textContent = AR(to) : requestAnimationFrame(step); };

  /* الظهور عند التمرير */
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('in'); $$('[data-count]').forEach(c => { if (e.target.contains(c) && !c.done) { c.done = 1; count(c); } }); io.unobserve(e.target); }), { threshold: .14, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => { const sib = [...el.parentElement.children].filter(x => x.classList.contains('reveal')); el.style.transitionDelay = (sib.indexOf(el) * 90) + 'ms'; io.observe(el); });
  setTimeout(() => $$('.chip [data-count], .hstats [data-count]').forEach(c => { c.done = 1; count(c); }), RM ? 0 : 1500);

  /* التمرير: الشريط العلوي، التنقل، الخط الزمني */
  /* مؤشّر منزلق خلف روابط الشريط: يتبع الرابط النشط ويلحق بالمؤشر عند التمرير فوق الروابط */
  const ind = $('#ind'); let hov = null;
  const moveInd = a => { if (!ind) return; if (!a) { ind.style.opacity = 0; return; } const p = a.parentElement.getBoundingClientRect(), r = a.getBoundingClientRect(); ind.style.opacity = 1; ind.style.width = r.width + 'px'; ind.style.transform = `translateX(${r.left - p.left}px)`; };
  $$('#links a').forEach(a => { a.addEventListener('pointerenter', () => { hov = a; moveInd(a); }); a.addEventListener('pointerleave', () => { hov = null; moveInd($$('#links a').find(x => x.classList.contains('on'))); }); });
  addEventListener('resize', () => moveInd($$('#links a').find(x => x.classList.contains('on'))));
  const nav = $('#nav'), bar = $('#progress'), top = $('#totop'), fill = $('#tlFill'), tl = $('#tl'), secs = $$('main section[id]'), links = $$('#links a');
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h ? y / h : 0})`;
    nav.classList.toggle('solid', y > 30); top.classList.toggle('show', y > 900);
    const r = tl.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .6 - r.top) / r.height));
    fill.style.height = (p * 100) + '%';
    $$('.st').forEach(s => { const sr = s.getBoundingClientRect(); s.classList.toggle('lit', sr.top + 30 < innerHeight * .6); });
    let cur = ''; secs.forEach(s => { if (s.getBoundingClientRect().top < 140) cur = s.id; });
    links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur));
    if (!hov) moveInd(links.find(a => a.classList.contains('on')));
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  top.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });

  /* قائمة الجوال */
  const mnav = $('#mnav'), mb = $('#menuBtn');
  const tog = o => { mnav.classList.toggle('open', o); mb.innerHTML = icon(o ? 'x' : 'menu'); document.body.style.overflow = o ? 'hidden' : ''; };
  mb.onclick = () => tog(!mnav.classList.contains('open'));
  $$('#mnav a').forEach((a, i) => { a.style.transitionDelay = (i * 40) + 'ms'; a.addEventListener('click', () => tog(false)); });

  /* بقعة الضوء والإمالة */
  $$('.spot,.dom').forEach(el => el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), t = el.querySelector('.in') || el; t.style.setProperty('--mx', (e.clientX - r.left) + 'px'); t.style.setProperty('--my', (e.clientY - r.top) + 'px'); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px'); }));
  if (!RM && matchMedia('(hover:hover)').matches) {
    $$('.tilt3').forEach(el => { el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`; }); el.addEventListener('pointerleave', () => el.style.transform = ''); });
    const tilt = $('#tilt'), stage = $('#stage');
    $('.hero').addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(), x = (e.clientX - (r.left + r.width / 2)) / innerWidth, y = (e.clientY - (r.top + r.height / 2)) / innerHeight;  });
  }

  /* الأعماق: لآلئ مضيئة صاعدة */
  const cv = $('#deep'), ctx = cv.getContext('2d'); let W, H, P = [], DPR = Math.min(2, devicePixelRatio || 1), run = true;
  const size = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const n = Math.round(Math.min(40, W * H / 32000)); P = Array.from({ length: n }, () => mk(true)); };
  const mk = init => ({ x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: Math.random() * 2.2 + .4, s: Math.random() * .35 + .08, w: Math.random() * 2 * Math.PI, a: Math.random() * .3 + .08, big: false });
  const draw = () => {
    if (!run) return; ctx.clearRect(0, 0, W, H);
    for (const p of P) {
      p.y -= p.s; p.w += .01; p.x += Math.sin(p.w) * .25;
      if (p.y < -10) Object.assign(p, mk(false));
      const fade = Math.min(1, p.y / (H * .5)), r = p.big ? p.r * 2.6 : p.r;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
      g.addColorStop(0, `rgba(220,255,240,${p.a * fade})`); g.addColorStop(.3, `rgba(143,211,184,${p.a * .5 * fade})`); g.addColorStop(1, 'rgba(48,144,140,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 4, 0, 7); ctx.fill();
    }
    requestAnimationFrame(draw);
  };
  size(); addEventListener('resize', size);
  if (!RM) { draw(); new IntersectionObserver(([e]) => { const was = run; run = e.isIntersecting; if (run && !was) draw(); }).observe(cv); } else { run = true; draw(); run = false; }
})();
