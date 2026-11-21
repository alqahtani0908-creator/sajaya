/* ===== طبقة البيانات — تخزين محلي تجريبي قابل للاستبدال بقاعدة بيانات سحابية ===== */
const S = (() => {
  const KEY = 'sajaya.db.v6', SKEY = 'sajaya.session';
  const DAY = 864e5;
  let seed = 20261118;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const uid = () => Math.random().toString(36).slice(2, 9);

  const STATUS = {
    initial: { t: 'تسجيل أولي', c: 'info' }, awaiting: { t: 'بانتظار استكمال المتطلبات', c: 'warn' },
    complete: { t: 'مكتمل المتطلبات', c: 'teal' }, accepted: { t: 'مقبولة للمشاركة', c: 'ok' }, rejected: { t: 'غير مقبولة', c: 'bad' },
  };
  const FSTATUS = {
    none: { t: 'لم يُرفع', c: '' }, pending: { t: 'بانتظار المراجعة', c: 'info' },
    approved: { t: 'معتمد', c: 'ok' }, revise: { t: 'يحتاج إلى تعديل', c: 'warn' },
  };
  const ROLES = { director: 'مدير المبادرة', assistant: 'المساعد الإداري', evaluator: 'عضو لجنة التقييم', assoc: 'جمعية مشاركة' };
  const DOMAINS = { v: 'قيمنا الأصيلة', h: 'علوم وسنع', s: 'التميز الذاتي' };
  const CATS = ['الجاهزية', 'وثيقة المبادرة', 'الاتفاقيات', 'التهيئة', 'التنفيذ', 'القياس', 'التقييم النهائي'];

  function build() {
    seed = 20261118;
    const now = Date.now();
    const D = n => new Date(now + n * DAY).toISOString().slice(0, 10);
    const T = n => new Date(now + n * DAY).toISOString();

    const stages = [
      ['التسجيل الأولي', 'تسجيل بيانات الجمعية وإبداء الرغبة في المشاركة.', -150, -125],
      ['اللقاء التعريفي', 'عرض موعد اللقاء ورابطه وتأكيد الحضور.', -122, -120],
      ['استكمال الجاهزية', 'رفع متطلبات الجاهزية وخطاب الاستعداد والمستندات المطلوبة.', -118, -98],
      ['تقديم وثيقة المبادرة', 'رفع الوثيقة وفق كراسة المواصفات والمعايير.', -97, -70],
      ['تقييم الوثائق', 'تقييم الوثائق وإظهار حالة الطلب والملاحظات.', -69, -52],
      ['اعتماد المشاركة والاتفاقيات', 'رفع الاتفاقية وتوثيق استكمال توقيعها.', -51, -40],
      ['التهيئة للتنفيذ', 'متابعة اللقاءات التمهيدية العشرة ومتطلباتها.', -39, -12],
      ['تنفيذ المبادرات', 'متابعة الأنشطة والبرامج ورفع التقارير والشواهد.', -11, 110],
      ['التقييم النهائي', 'تقييم التنفيذ والنتائج وفق معايير التميز المعتمدة.', 111, 135],
      ['الملتقى الختامي', 'إعلان النتائج النهائية وإصدار التقارير وإغلاق المبادرة.', 140, 141],
    ].map((s, i) => ({ id: i + 1, name: s[0], desc: s[1], start: D(s[2]), end: D(s[3]), state: i < 7 ? 'done' : i === 7 ? 'open' : 'locked', note: '' }));

    const R = (stage, cat, title, desc, mandatory, due) => ({ id: 'r' + (requirements.length + 1), stage, cat, title, desc, mandatory, due: D(due), targets: 'all' });
    const requirements = [];
    [
      [3, 'الجاهزية', 'خطاب استعداد الجمعية', 'خطاب رسمي موقع من رئيس مجلس الإدارة أو المدير التنفيذي.', true, -100],
      [3, 'الجاهزية', 'بيانات فريق العمل', 'أسماء فريق المبادرة وأدوارهم وبيانات التواصل.', true, -100],
      [3, 'الجاهزية', 'نموذج متطلبات الجاهزية', 'تعبئة نموذج الجاهزية المعتمد من إدارة المبادرة.', true, -98],
      [3, 'الجاهزية', 'الترخيص وشهادة الحوكمة', 'صورة سارية من الترخيص وآخر شهادة حوكمة.', false, -98],
      [4, 'وثيقة المبادرة', 'وثيقة المبادرة المتكاملة', 'الوثيقة الشاملة للمجالات الثلاثة وفق كراسة المواصفات.', true, -70],
      [4, 'وثيقة المبادرة', 'الخطة التشغيلية والموازنة', 'الجدول الزمني التفصيلي والموازنة التقديرية.', true, -70],
      [4, 'وثيقة المبادرة', 'ملحقات داعمة', 'أي ملاحق أو نماذج تدعم الوثيقة.', false, -70],
      [6, 'الاتفاقيات', 'الاتفاقية الموقعة', 'نسخة الاتفاقية بعد توقيعها وختمها.', true, -42],
      [6, 'الاتفاقيات', 'بيانات الحساب البنكي', 'شهادة الآيبان المعتمدة للجمعية.', true, -42],
      [7, 'التهيئة', 'تكليف: تحليل احتياج المستفيدين', 'مخرج اللقاء التمهيدي الثاني.', true, -30],
      [7, 'التهيئة', 'تكليف: مصفوفة البرامج والأنشطة', 'مخرج اللقاءات من الثالث إلى الخامس.', true, -20],
      [7, 'القياس', 'خطة القياس القبلي والبعدي', 'أدوات القياس وآلية تطبيقها.', true, -13],
      [8, 'القياس', 'نتائج القياس القبلي', 'نتائج تطبيق القياس القبلي على المستفيدين.', true, -6],
      [8, 'التنفيذ', 'تقرير الأنشطة — الشهر الأول', 'تقرير موجز بالأنشطة المنفذة ونسب الإنجاز.', true, -3],
      [8, 'التنفيذ', 'الصور والشواهد — الشهر الأول', 'توثيق مصور للأنشطة المنفذة.', true, -3],
      [8, 'التنفيذ', 'سجلات الحضور', 'كشوف حضور المستفيدين للأنشطة.', true, -2],
      [8, 'التنفيذ', 'تقرير الأنشطة — الشهر الثاني', 'تقرير موجز بالأنشطة المنفذة ونسب الإنجاز.', true, 24],
      [8, 'التنفيذ', 'الشراكات المجتمعية الموثقة', 'اتفاقيات أو خطابات الشراكة مع الجهات المجتمعية.', false, 38],
      [9, 'القياس', 'نتائج القياس البعدي', 'نتائج القياس البعدي ومؤشرات المستفيدين.', true, 115],
      [9, 'التقييم النهائي', 'التقرير الختامي والشواهد النهائية', 'التقرير الختامي الشامل للمبادرة.', true, 118],
    ].forEach(a => requirements.push(R(...a)));

    const names = ['رفد', 'سند', 'أثر', 'وئام', 'غراس', 'مودة', 'بنيان', 'ركن', 'عطاء', 'رحماء', 'نماء', 'إيلاف', 'بشائر', 'وصال', 'كنف', 'تآلف', 'مأوى', 'سكن', 'رواء', 'ضياء'];
    const cities = ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'بريدة', 'أبها', 'تبوك', 'حائل', 'جازان', 'نجران', 'الباحة', 'سكاكا', 'عرعر', 'الطائف', 'الأحساء', 'الخبر', 'ينبع', 'خميس مشيط', 'عنيزة'];
    const fn = ['محمد', 'عبدالله', 'فهد', 'نورة', 'سارة', 'خالد', 'ريم', 'سلطان', 'هند', 'ماجد', 'منيرة', 'تركي'];
    const ln = ['الحربي', 'القحطاني', 'الشهري', 'الدوسري', 'العنزي', 'الزهراني', 'المطيري', 'الغامدي', 'السبيعي', 'العمري'];
    const dil = [.98, .95, .9, .93, .85, .8, .88, .74, .7, .96, .64, .82, .58, .9, .78, .52, .86, .5, .6, .5];
    const assocs = names.map((n, i) => ({
      id: 'a' + (i + 1), name: `جمعية ${n} لرعاية الأيتام`, short: n, city: cities[i], license: String(1000 + Math.floor(rnd() * 3000)),
      rep: { name: pick(fn) + ' ' + pick(ln), role: 'منسق المبادرة', phone: '05' + String(Math.floor(rnd() * 1e8)).padStart(8, '0'), email: `sajaya${i + 1}@example.org` },
      status: i < 17 ? 'accepted' : i === 17 ? 'rejected' : i === 18 ? 'awaiting' : 'initial',
      active: i !== 19, createdAt: T(-148 + Math.floor(rnd() * 20)), p: dil[i],
    }));

    const subs = {};
    const fnames = ['المستند', 'الملف-المعتمد', 'نسخة-نهائية', 'مرفق'];
    const mk = (a, r, status, late) => {
      const at = T(Math.min(-0.2, (new Date(r.due) - now) / DAY + (late ? 1 + rnd() * 4 : -(1 + rnd() * 5))));
      const ext = r.title.includes('صور') ? 'zip' : r.title.includes('سجلات') || r.title.includes('الموازنة') ? 'xlsx' : 'pdf';
      const files = [{ id: uid(), name: `${r.title.replace(/[—:]/g, '').replace(/\s+/g, '-')}.${ext}`, size: Math.floor(200 + rnd() * 4800) * 1024, at, v: 1 }];
      const history = [];
      if (status === 'revise' || rnd() < .15) { history.push({ ...files[0], name: pick(fnames) + '-قديم.' + ext }); files[0].v = 2; }
      subs[a.id + ':' + r.id] = { status, files, history, late: !!late, at, updatedAt: at, note: status === 'revise' ? 'نأمل استكمال البيانات الناقصة وإعادة رفع الملف بعد التوقيع والختم.' : '' };
    };
    assocs.forEach((a, i) => requirements.forEach(r => {
      const past = new Date(r.due) < now;
      if (a.status === 'accepted') {
        if (r.stage <= 6) { if (r.mandatory || rnd() < a.p) mk(a, r, 'approved', rnd() > a.p + .1); }
        else if (r.stage <= 8 && past) {
          const x = rnd(), p = a.p ** 2.2;
          if (x < p) mk(a, r, (new Date(r.due) > now - 5 * DAY && rnd() < .45) ? 'pending' : 'approved', rnd() > p + .08);
          else if (x < p + (1 - p) * .3) mk(a, r, 'pending', true);
          else if (x < p + (1 - p) * .55) mk(a, r, 'revise', false);
        } else if (r.stage === 8 && rnd() < a.p * .3) mk(a, r, 'pending', false);
      } else if (a.status === 'rejected') { if (r.stage <= 4 && r.mandatory) mk(a, r, 'approved', rnd() < .5); }
      else if (a.status === 'awaiting') { if (r.id === 'r1') mk(a, r, 'approved', true); if (r.id === 'r2') mk(a, r, 'revise', true); }
    }));

    const C = (id, name, inds) => ({ id, name, inds: inds.map((x, j) => ({ id: id + '.' + (j + 1), name: x[0], max: x[1], dom: x[2] || null, reqs: x[3] || [] })) });
    const tracks = {
      docs: {
        key: 'docs', name: 'تقييم وثائق المبادرات', short: 'تقييم الوثائق', version: 1, locked: true, lockedAt: T(-69), approved: true, approvedAt: T(-53), published: true,
        criteria: [
          C('d1', 'وضوح الرؤية والأهداف', [['صياغة الأهداف وقابليتها للقياس', 8, null, ['r5']], ['ارتباط الأهداف بمجالات المبادرة', 7, null, ['r5']]]),
          C('d2', 'تكامل المجالات الثلاثة', [['مجال قيمنا الأصيلة', 7, 'v', ['r5']], ['مجال علوم وسنع', 7, 'h', ['r5']], ['مجال التميز الذاتي', 6, 's', ['r5']]]),
          C('d3', 'جودة تصميم البرامج والأنشطة', [['تنوع الأنشطة وملاءمتها للفئة المستهدفة', 10, null, ['r5']], ['الابتكار والأصالة في الطرح', 10, null, ['r5', 'r7']]]),
          C('d4', 'الخطة التنفيذية والزمنية', [['واقعية الجدول الزمني', 8, null, ['r6']], ['توزيع الأدوار والمسؤوليات', 7, null, ['r2', 'r6']]]),
          C('d5', 'القياس والأثر', [['أدوات القياس القبلي والبعدي', 8, null, ['r5']], ['مؤشرات الأثر على المستفيدين', 7, null, ['r5']]]),
          C('d6', 'الموازنة والاستدامة', [['كفاءة الموازنة التقديرية', 8, null, ['r6']], ['خطة الاستدامة والشراكات', 7, null, ['r5']]]),
        ],
      },
      exec: {
        key: 'exec', name: 'تقييم التميز في التنفيذ', short: 'تقييم التنفيذ', version: 1, locked: true, lockedAt: T(-3), approved: false, approvedAt: null, published: false,
        criteria: [
          C('e1', 'تكامل المجالات الثلاثة', [['تنفيذ برامج قيمنا الأصيلة', 5, 'v', ['r14', 'r17']], ['تنفيذ برامج علوم وسنع', 5, 'h', ['r14', 'r17']], ['تنفيذ برامج التميز الذاتي', 5, 's', ['r14', 'r17']]]),
          C('e2', 'انتظام التنفيذ', [['تنفيذ الأنشطة وفق الخطة المعتمدة', 8, null, ['r14', 'r17']], ['انتظام حضور المستفيدين', 7, null, ['r16']]]),
          C('e3', 'مشاركة الأسرة والمجتمع', [['برامج إشراك الأسرة والمجتمع المحلي', 10, null, ['r15']]]),
          C('e4', 'الشراكات المجتمعية', [['عدد الشراكات الفاعلة ونوعيتها', 10, null, ['r18']]]),
          C('e5', 'نتائج المستفيدين', [['الفرق بين القياس القبلي والبعدي', 12, null, ['r13', 'r19']], ['رضا المستفيدين وأسرهم', 8, null, ['r19']]]),
          C('e6', 'جودة التوثيق', [['اكتمال التقارير والشواهد وجودتها', 10, null, ['r14', 'r15', 'r20']]]),
          C('e7', 'الاستدامة', [['خطة استمرار الأثر بعد المبادرة', 10, null, ['r20']]]),
          C('e8', 'الالتزام بالخطة الزمنية', [['الالتزام بمواعيد التسليم والتنفيذ', 10, null, []]]),
        ],
      },
    };

    const users = [
      { id: 'u1', roles: ['director'], name: 'د. عبدالعزيز المنصور', email: 'director@sajaya.example', phone: '0550000001' },
      { id: 'u2', roles: ['assistant', 'evaluator'], name: 'أ. سارة العتيبي', email: 'admin@sajaya.example', phone: '0550000002' },
      { id: 'u3', roles: ['evaluator'], name: 'د. هيفاء الراشد', email: 'eval1@sajaya.example', phone: '0550000003' },
      { id: 'u4', roles: ['evaluator'], name: 'د. ناصر الفيفي', email: 'eval2@sajaya.example', phone: '0550000004' },
      { id: 'u5', roles: ['evaluator'], name: 'أ. لطيفة البلوي', email: 'eval3@sajaya.example', phone: '0550000005' },
      ...assocs.map(a => ({ id: 'ua' + a.id.slice(1), roles: ['assoc'], name: a.rep.name, email: a.rep.email, assocId: a.id })),
    ];

    const evals = { docs: {}, exec: {} };
    const notes = ['وثيقة متماسكة وأهداف واضحة، مع الحاجة إلى تفصيل أدوات القياس.', 'برامج نوعية ومبتكرة، ويُوصى بتعزيز خطة الاستدامة.', 'تكامل جيد بين المجالات، والجدول الزمني يحتاج إلى مراجعة.', 'طرح مميز لمجال علوم وسنع، ويُنصح بتوسيع الشراكات.'];
    assocs.slice(0, 18).forEach(a => {
      evals.docs[a.id] = {};
      ['u3', 'u4', 'u5'].forEach(e => {
        const base = a.status === 'rejected' ? .5 : .56 + .42 * a.p, scores = {};
        tracks.docs.criteria.forEach(c => c.inds.forEach(n => scores[n.id] = Math.max(1, Math.min(n.max, Math.round(n.max * (base + (rnd() - .5) * .22))))));
        evals.docs[a.id][e] = { scores, note: pick(notes), done: true, at: T(-60 + rnd() * 6) };
      });
    });
    // تقييم التنفيذ: جارٍ — بعض المقيّمين أنهوا جمعيات، ومسودة واحدة
    const execNotes = ['تنفيذ منتظم وتوثيق جيد، ويُوصى بتوسيع إشراك الأسر.', 'أثر واضح على المستفيدين، والشراكات تحتاج إلى تفعيل أكبر.', 'التزام زمني ممتاز، مع فرصة لتعميق برامج التميز الذاتي.'];
    // التكليف: الوثائق — اللجنة الثلاثية كاملة لكل جمعية؛ التنفيذ — مقيّمان لكل جمعية بالتناوب
    const assign = { docs: {}, exec: {} };
    assocs.slice(0, 18).forEach(a => assign.docs[a.id] = ['u3', 'u4', 'u5']);
    const pool = ['u4', 'u5', 'u3', 'u2'];
    assocs.filter(a => a.status === 'accepted').forEach((a, i) => assign.exec[a.id] = [pool[i % 4], pool[(i + 1) % 4]]);
    Object.entries(assign.exec).forEach(([id, es], i) => es.forEach((e, j) => {
      if (i > 8 || (i > 5 && j === 1)) return; // جمعيات لم يكتمل تقييمها بعد
      const a = assocs.find(x => x.id === id), base = .5 + .45 * a.p + (j ? .06 : -.02) * (i === 3 ? 4 : 1), scores = {};
      tracks.exec.criteria.forEach(c => c.inds.forEach(n => scores[n.id] = Math.max(1, Math.min(n.max, Math.round(n.max * (base + (rnd() - .5) * .2))))));
      (evals.exec[id] = evals.exec[id] || {})[e] = { scores, note: pick(execNotes), done: !(i === 8 && j === 1), at: T(-1 + rnd()) };
    }));

    const mt = [
      ['اللقاء التعريفي بمبادرة سجايا', -121, 'تأكيد الرغبة في المشاركة'],
      ['فلسفة مبادرة سجايا ومجالاتها', -38, 'قراءة كراسة المواصفات'], ['تحليل احتياج المستفيدين', -35, 'نموذج تحليل الاحتياج'],
      ['تصميم البرامج القيمية', -32, 'مسودة برامج قيمنا الأصيلة'], ['علوم وسنع: الموروث الاجتماعي', -29, 'مسودة برامج علوم وسنع'],
      ['التميز الذاتي وبناء المهارات', -26, 'مسودة برامج التميز الذاتي'], ['إشراك الأسرة والمجتمع', -23, 'خطة إشراك الأسرة'],
      ['بناء الشراكات المجتمعية', -20, 'قائمة الشركاء المحتملين'], ['القياس القبلي والبعدي', -17, 'أدوات القياس'],
      ['التوثيق وإعداد التقارير', -15, 'نموذج التقرير الشهري'], ['الاستدامة وخطة الانطلاق', -13, 'خطة الانطلاق'],
      ['لقاء المتابعة الشهري الأول', 6, 'عرض موجز عن إنجاز الشهر الأول'],
    ];
    const meetings = mt.map((m, i) => {
      const att = {}, done = {};
      if (m[1] < 0) assocs.forEach(a => { if (a.status === 'accepted' || i === 0 && a.status !== 'initial') { att[a.id] = rnd() < a.p + .1; done[a.id] = rnd() < a.p; } });
      return { id: 'm' + i, kind: i === 0 ? 'تعريفي' : i <= 10 ? 'تمهيدي' : 'متابعة', no: i >= 1 && i <= 10 ? i : null, title: m[0], date: D(m[1]), time: '19:30', link: 'https://meet.example.org/sajaya-' + i, materials: m[1] < 0 ? [{ name: 'العرض التقديمي.pdf' }, { name: 'ورقة العمل.docx' }] : [], task: { title: m[2], due: D(m[1] + 5) }, att, done };
    });

    const notifs = [
      { to: 'all', type: 'meeting', title: 'لقاء المتابعة الشهري الأول', body: 'ندعوكم لحضور لقاء المتابعة الشهري الأول، ورابط اللقاء متاح في صفحة اللقاءات.', at: T(-1) },
      { to: 'all', type: 'warn', title: 'تذكير: تقرير الشهر الثاني', body: 'يقترب موعد تسليم تقرير الأنشطة للشهر الثاني، نأمل الرفع قبل الموعد المحدد.', at: T(-2) },
      { to: 'a1', type: 'ok', title: 'تم اعتماد ملف', body: 'تم اعتماد «تقرير الأنشطة — الشهر الأول».', at: T(-2.5) },
      { to: 'a1', type: 'file', title: 'ملاحظة على ملف', body: 'نأمل مراجعة الملاحظات على أحد الملفات المرفوعة وإعادة رفعه.', at: T(-4) },
      { to: 'admin', type: 'file', title: 'وثيقة جديدة بانتظار المراجعة', body: 'رفعت جمعية رفد ملف «سجلات الحضور».', at: T(-1.2) },
      { to: 'all', type: 'info', title: 'انطلاق مرحلة تنفيذ المبادرات', body: 'نبارك للجمعيات المقبولة انطلاق مرحلة التنفيذ، ونتمنى للجميع التوفيق.', at: T(-11) },
      { to: 'all', type: 'ok', title: 'إعلان نتائج تقييم الوثائق', body: 'تم اعتماد نتائج تقييم وثائق المبادرات، ويمكن الاطلاع عليها من صفحة التقييم.', at: T(-52) },
    ].map(n => ({ id: uid(), by: 'u2', read: {}, ...n }));

    const audit = [
      ['u2', 'اعتماد ملف', 'تقرير الأنشطة — الشهر الأول · جمعية رفد', -2.5], ['u2', 'طلب تعديل ملف', 'سجلات الحضور · جمعية ركن', -3],
      ['u1', 'فتح مرحلة', 'تنفيذ المبادرات', -11], ['u2', 'إضافة متطلب', 'الشراكات المجتمعية الموثقة', -12],
      ['u1', 'اعتماد نتائج', 'تقييم وثائق المبادرات', -53], ['u1', 'نشر النتائج للجمعيات', 'تقييم وثائق المبادرات', -52],
      ['u3', 'إدخال درجات', 'تقييم الوثائق · جمعية سند', -58], ['u2', 'تغيير حالة جمعية', 'جمعية سكن ← غير مقبولة', -51],
      ['u1', 'تثبيت نسخة المعايير', 'تقييم الوثائق — النسخة 1', -69], ['u2', 'إرسال رابط تفعيل', 'جمعية ضياء', -6],
    ].map(x => ({ id: uid(), user: x[0], action: x[1], target: x[2], at: T(x[3]) })).sort((a, b) => b.at.localeCompare(a.at));

    const settings = {
      minEvaluators: 2, gapAlert: 15, weights: { docs: 30, exec: 70 }, assistantCanScore: false,
      contact: { whatsapp: '0503700028', email: 'info@itmaam.org.sa', site: 'https://itmaam.org.sa' },
      templates: {
        general: { title: 'رسالة عامة', subject: 'مبادرة سجايا — {الجمعية}', body: 'السلام عليكم ورحمة الله وبركاته\nالأستاذ/ة {الممثل} — {الجمعية}\n\n\n\nمع خالص التحية،\nإدارة مبادرة سجايا' },
        reminder: { title: 'تذكير بمتطلب', subject: 'تذكير: {المتطلب} — مبادرة سجايا', body: 'السلام عليكم ورحمة الله وبركاته\nالأستاذ/ة {الممثل} — {الجمعية}\n\nنذكّركم بأن موعد تسليم «{المتطلب}» هو {الموعد}، ونأمل رفعه عبر المنصة:\n{الرابط}\n\nشاكرين تعاونكم،\nإدارة مبادرة سجايا' },
        revise: { title: 'طلب تعديل ملف', subject: 'ملاحظة على «{المتطلب}» — مبادرة سجايا', body: 'السلام عليكم ورحمة الله وبركاته\nالأستاذ/ة {الممثل} — {الجمعية}\n\nبعد مراجعة «{المتطلب}» نأمل التكرم بما يلي:\n{الملاحظة}\n\nويمكنكم إعادة الرفع من المنصة:\n{الرابط}\n\nإدارة مبادرة سجايا' },
        late: { title: 'متطلبات متأخرة', subject: 'متطلبات متأخرة — {الجمعية}', body: 'السلام عليكم ورحمة الله وبركاته\nالأستاذ/ة {الممثل} — {الجمعية}\n\nلاحظنا وجود {العدد} متطلبات متأخرة عن موعدها، نأمل استكمالها في أقرب وقت عبر المنصة:\n{الرابط}\n\nونسعد بمساعدتكم في أي استفسار.\nإدارة مبادرة سجايا' },
        meeting: { title: 'دعوة لقاء', subject: 'دعوة: {اللقاء}', body: 'السلام عليكم ورحمة الله وبركاته\nالأستاذ/ة {الممثل} — {الجمعية}\n\nيسعدنا دعوتكم لحضور «{اللقاء}» يوم {الموعد}.\nرابط اللقاء: {رابط_اللقاء}\n\nإدارة مبادرة سجايا' },
        login: { title: 'رابط الدخول', subject: 'الدخول إلى منصة سجايا', body: 'السلام عليكم ورحمة الله وبركاته\nالأستاذ/ة {الممثل} — {الجمعية}\n\nيمكنكم الدخول إلى حساب الجمعية في منصة سجايا عبر الرابط:\n{الرابط}\n\nإدارة مبادرة سجايا' },
        evaluator: { title: 'تكليف مقيّم', subject: 'تكليف بالتقييم — مبادرة سجايا', body: 'السلام عليكم ورحمة الله وبركاته\nسعادة {المقيم}\n\nتم تكليفكم بتقييم {العدد} جمعيات في «{المسار}». يمكنكم البدء من صفحة مهام التقييم:\n{الرابط}\n\nشاكرين لكم،\nإدارة مبادرة سجايا' },
        toAdmin: { title: 'من الجمعية إلى الإدارة', subject: 'استفسار من {الجمعية}', body: 'السلام عليكم ورحمة الله وبركاته\nإدارة مبادرة سجايا الموقرة\n\nمعكم {الممثل} من {الجمعية}، ولدينا استفسار بخصوص:\n\n\nشاكرين لكم.' },
      },
    };
    return { v: 6, seededAt: now, settings, assign, cycle: 'الدورة الأولى ١٤٤٨هـ', stages, requirements, assocs, subs, tracks, evals, users, meetings, notifs, audit };
  }

  let db;
  function load() { try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; } if (!db || db.v !== 6) { db = build(); save(); } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { } }
  function reset() { db = build(); save(); }
  load();

  /* الجلسة والأدوار — يمكن للمستخدم أن يحمل أكثر من دور */
  const ORDER = ['director', 'assistant', 'evaluator', 'assoc'];
  const rolesOf = u => (u && (u.roles || (u.role ? [u.role] : []))) || [];
  const primary = u => ORDER.find(r => rolesOf(u).includes(r)) || 'assoc';
  const has = (u, r) => rolesOf(u).includes(r);
  const isAdmin = u => has(u, 'director') || has(u, 'assistant');
  const user = () => { try { const u = db.users.find(x => x.id === sessionStorage.getItem(SKEY)); if (u) u.role = primary(u); return u || null; } catch (e) { return null; } };
  const login = id => sessionStorage.setItem(SKEY, id);
  const logout = () => sessionStorage.removeItem(SKEY);
  // صلاحيات: اتحاد صلاحيات أدوار المستخدم
  const PERMS = {
    director: ['dashboard', 'assocs', 'stages', 'files', 'meetings', 'notify', 'reports', 'audit', 'settings', 'criteria', 'approve', 'users', 'assign', 'reopen'],
    assistant: ['dashboard', 'assocs', 'stages', 'files', 'meetings', 'notify', 'reports', 'audit', 'settings', 'assign', 'reopen'],
    evaluator: ['evaluate'], assoc: ['assoc'],
  };
  const can = p => { const u = user(); return !!u && rolesOf(u).some(r => PERMS[r].includes(p)); };
  const normPhone = ph => { const d = String(ph || '').replace(/\D/g, ''); return d.startsWith('966') ? d : d.startsWith('05') ? '966' + d.slice(1) : d.startsWith('5') && d.length === 9 ? '966' + d : d; };

  /* أدوات */
  const today = () => new Date().toISOString().slice(0, 10);
  const assoc = id => db.assocs.find(a => a.id === id);
  const stage = id => db.stages.find(s => s.id === +id);
  const req = id => db.requirements.find(r => r.id === id);
  const userById = id => db.users.find(u => u.id === id);
  const cap = a => ({ accepted: 10, rejected: 5, complete: 4, awaiting: 3, initial: 1 })[a.status];
  const reqsFor = a => db.requirements.filter(r => (r.targets === 'all' || r.targets.includes(a.id)) && r.stage <= cap(a));
  const sub = (aId, rId) => db.subs[aId + ':' + rId] || { status: 'none', files: [], history: [], note: '' };
  const globalStage = () => db.stages.find(s => s.state === 'open') || [...db.stages].reverse().find(s => s.state === 'done') || db.stages[0];
  const currentStage = a => a.status === 'accepted' ? globalStage() : stage(Math.max(1, cap(a)));
  const stageState = (a, s) => { if (s.id > cap(a)) return 'locked'; if (a.status !== 'accepted') return s.id < cap(a) ? 'done' : 'open'; return s.state; };

  function stats(a) {
    const rs = reqsFor(a), t = today();
    let approved = 0, pending = 0, revise = 0, none = 0, overdue = 0, due = 0, ontime = 0;
    rs.forEach(r => {
      const s = sub(a.id, r.id);
      if (s.status === 'approved') approved++; else if (s.status === 'pending') pending++; else if (s.status === 'revise') revise++; else none++;
      if (r.mandatory && r.due < t) { due++; if (s.status === 'none' || s.status === 'revise') overdue++; if (s.status !== 'none' && !s.late) ontime++; }
    });
    const total = rs.length, progress = total ? Math.round(approved / total * 100) : 0, ratio = due ? overdue / due : 0;
    const health = a.status === 'rejected' ? 'off' : ratio === 0 ? 'ok' : ratio <= .2 ? 'warn' : 'bad';
    const next = rs.filter(r => r.due >= t && sub(a.id, r.id).status !== 'approved' && stageState(a, stage(r.stage)) !== 'locked').sort((x, y) => x.due.localeCompare(y.due))[0] || null;
    return { total, approved, pending, revise, none, overdue, due, ontime, progress, ratio, health, next, commit: due ? Math.round(ontime / due * 100) : 100, remaining: total - approved };
  }
  const HEALTH = { ok: { t: 'تسير وفق الخطة', c: 'ok' }, warn: { t: 'تحتاج إلى استكمال بعض المتطلبات', c: 'warn' }, bad: { t: 'متأخرة عن الخطة', c: 'bad' }, off: { t: 'خارج المنافسة', c: '' } };
  function stageProgress(a, s) { const rs = reqsFor(a).filter(r => r.stage === s.id); if (!rs.length) return stageState(a, s) === 'done' ? 100 : 0; return Math.round(rs.filter(r => sub(a.id, r.id).status === 'approved').length / rs.length * 100); }

  /* التقييم — يُحتسب من المقيّمين المكلَّفين فقط */
  const trackMax = k => db.tracks[k].criteria.reduce((t, c) => t + c.inds.reduce((x, n) => x + (+n.max || 0), 0), 0);
  const evaluatorsAll = () => db.users.filter(u => has(u, 'evaluator'));
  const assigned = (k, aId) => ((db.assign[k] || {})[aId] || []).filter(id => db.users.some(u => u.id === id));
  const evalOf = (k, aId, eId) => (db.evals[k][aId] || {})[eId] || null;
  const evalTotal = e => e ? Object.values(e.scores).reduce((t, v) => t + (+v || 0), 0) : 0;
  const doneEvals = (k, aId) => assigned(k, aId).map(e => evalOf(k, aId, e)).filter(e => e && e.done);
  function evalState(k, aId) {
    const as = assigned(k, aId), es = doneEvals(k, aId), mx = trackMax(k), tot = es.map(evalTotal);
    const drafts = as.filter(e => { const x = evalOf(k, aId, e); return x && !x.done; }).length;
    const gap = tot.length > 1 ? Math.round((Math.max(...tot) - Math.min(...tot)) / mx * 100) : 0;
    const complete = as.length >= (db.settings.minEvaluators || 1) && es.length === as.length;
    return { n: as.length, done: es.length, drafts, complete, short: as.length < (db.settings.minEvaluators || 1), gap, gapHigh: gap >= (db.settings.gapAlert || 100) };
  }
  function trackScore(k, aId) { const es = doneEvals(k, aId); return es.length ? +(es.reduce((t, e) => t + evalTotal(e), 0) / es.length).toFixed(1) : null; }
  const trackPct = (k, aId) => { const s = trackScore(k, aId); return s === null ? null : +(s / trackMax(k) * 100).toFixed(1); };
  function critScores(k, aId) { const es = doneEvals(k, aId); return db.tracks[k].criteria.map(c => { const max = c.inds.reduce((t, n) => t + n.max, 0); const sc = es.length ? es.reduce((t, e) => t + c.inds.reduce((x, n) => x + (+e.scores[n.id] || 0), 0), 0) / es.length : null; return { id: c.id, name: c.name, max, score: sc === null ? null : +sc.toFixed(1), pct: sc === null ? null : Math.round(sc / max * 100) }; }); }
  // ترتيب تنافسي: المتساوون في الدرجة يتشاركون المركز (١، ١، ٣...)
  function rankList(items) { items.sort((x, y) => y.score - x.score); items.forEach((x, i) => x.rank = i && items[i - 1].score === x.score ? items[i - 1].rank : i + 1); return items; }
  const ranking = (k, onlyComplete) => rankList(db.assocs.map(a => ({ a, score: trackScore(k, a.id), pct: trackPct(k, a.id), st: evalState(k, a.id) })).filter(x => x.score !== null && (!onlyComplete || x.st.complete)));
  // المؤشر النهائي للتميز: مزيج موزون من نسبتي المسارين
  function finalIndex(aId) { const w = db.settings.weights, d = trackPct('docs', aId), e = trackPct('exec', aId); if (d === null || e === null) return null; return +((d * w.docs + e * w.exec) / (w.docs + w.exec)).toFixed(1); }
  const finalRanking = () => rankList(db.assocs.map(a => ({ a, score: finalIndex(a.id) })).filter(x => x.score !== null));
  function domainPerf(aId) {
    const acc = { v: [0, 0], h: [0, 0], s: [0, 0] };
    Object.keys(db.tracks).forEach(k => { const es = doneEvals(k, aId); if (!es.length) return; db.tracks[k].criteria.forEach(c => c.inds.forEach(n => { if (n.dom) { acc[n.dom][0] += es.reduce((t, e) => t + (+e.scores[n.id] || 0), 0) / es.length; acc[n.dom][1] += n.max; } })); });
    const o = {}; Object.keys(acc).forEach(d => o[d] = acc[d][1] ? Math.round(acc[d][0] / acc[d][1] * 100) : null); return o;
  }
  const visibleToAssoc = k => db.tracks[k].approved && db.tracks[k].published;
  // من يملك تعديل ورقة تقييم: المقيّم المكلَّف نفسه، أو المساعد إن سُمح له بالإدخال نيابةً
  function canScore(u, k, aId, eId) {
    if (!u || db.tracks[k].approved || !db.tracks[k].locked || !assigned(k, aId).includes(eId)) return false;
    if (u.id === eId && has(u, 'evaluator')) return true;
    return !!db.settings.assistantCanScore && has(u, 'assistant');
  }

  /* سجل وإشعارات */
  function log(action, target) { const u = user(); db.audit.unshift({ id: uid(), user: u ? u.id : '-', action, target, at: new Date().toISOString() }); save(); }
  function notify(to, type, title, body) { const u = user(); db.notifs.unshift({ id: uid(), to, type, title, body, at: new Date().toISOString(), by: u ? u.id : '-', read: {} }); save(); }
  function notifsFor(u) { if (!u) return []; return db.notifs.filter(n => has(u, 'assoc') ? (n.to === 'all' || n.to === u.assocId) : ((isAdmin(u) && n.to === 'admin') || n.to === 'u:' + u.id)); }
  const unread = u => notifsFor(u).filter(n => !n.read[u.id]).length;

  /* القوالب */
  function fill(key, ctx) { const t = db.settings.templates[key] || db.settings.templates.general, f = x => String(x || '').replace(/\{([^}]+)\}/g, (m, k2) => ctx[k2] !== undefined ? ctx[k2] : m); return { subject: f(t.subject), body: f(t.body) }; }

  return {
    get db() { return db; }, save, reset, uid, user, login, logout, can, has, isAdmin, rolesOf, primary, normPhone, today, assoc, stage, req, userById, cap, reqsFor, sub, globalStage, currentStage, stageState, stats, stageProgress,
    trackMax, evaluatorsAll, assigned, evalOf, evalTotal, doneEvals, evalState, trackScore, trackPct, critScores, ranking, finalIndex, finalRanking, domainPerf, visibleToAssoc, canScore, log, notify, notifsFor, unread, fill,
    STATUS, FSTATUS, ROLES, DOMAINS, CATS, HEALTH, DAY,
  };
})();
