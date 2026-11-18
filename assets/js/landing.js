/* ===== تفاعلات الواجهة الرئيسية ===== */
(() => {
  hydrateIcons();
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const fmt = d => new Date(d).toLocaleDateString('ar-SA-u-ca-gregory-nu-arab', { day: 'numeric', month: 'long' });
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('#yr').textContent = AR(new Date().getFullYear());

  /* البداية */
  const start = () => { $('#intro').classList.add('out'); document.body.classList.add('ready'); };
  if (RM || sessionStorage.getItem('sj.intro')) start(); else { try { sessionStorage.setItem('sj.intro', 1); } catch (e) { } setTimeout(start, 1150); }

  /* شريط القيم */
  const vals = ['الصدق', 'الرحمة', 'الأمانة', 'النبل', 'الصفاء', 'الوفاء', 'الحياء', 'الكرم', 'بر الوالدين', 'الشجاعة', 'السنع', 'المروءة'];
  const chunk = vals.map(v => `<span>${v}</span>`).join('');
  $('#marq').innerHTML = chunk + chunk + chunk + chunk;

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
  setTimeout(() => $$('.chip [data-count]').forEach(c => { c.done = 1; count(c); }), RM ? 0 : 1500);

  /* التمرير: الشريط العلوي، التنقل، الخط الزمني */
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
    $('.hero').addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(), x = (e.clientX - (r.left + r.width / 2)) / innerWidth, y = (e.clientY - (r.top + r.height / 2)) / innerHeight; tilt.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 18}deg)`; });
  }

  /* الأعماق: لآلئ مضيئة صاعدة */
  const cv = $('#deep'), ctx = cv.getContext('2d'); let W, H, P = [], DPR = Math.min(2, devicePixelRatio || 1), run = true;
  const size = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const n = Math.round(Math.min(90, W * H / 14000)); P = Array.from({ length: n }, () => mk(true)); };
  const mk = init => ({ x: Math.random() * W, y: init ? Math.random() * H : H + 10, r: Math.random() * 2.2 + .4, s: Math.random() * .35 + .08, w: Math.random() * 2 * Math.PI, a: Math.random() * .5 + .15, big: Math.random() < .08 });
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
