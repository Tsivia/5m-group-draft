/* עמוד "דברו איתנו" (contact.html).
   אותה שפת תנועה של שאר העמודים: כותרות אות אחרי אות, טקסטים שורה אחרי שורה, גלילה חלקה (Lenis).
   פתיחה: הכותרת, חלון התמונה נפתח מלמטה, ולוח הטופס עולה · ארבע הדרכים לפנות עולות בגלילה · פוטר */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => innerWidth <= 900;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const header = $('.site-header');

  // הלוגו הכהה להדר הבהיר (כמו בשאר העמודים)
  const logoA = header && $('.site-header__logo', header);
  if (logoA && !$('.logo-on-light', logoA)) { const im = document.createElement('img'); im.className = 'logo-on-light'; im.src = 'assets/logo-5m.svg'; im.alt = ''; im.setAttribute('aria-hidden', 'true'); logoA.appendChild(im); }

  /* ---------- הטופס: עובד גם בלי אנימציות ----------
     בדיקה פשוטה בדפדפן, ואחרי השליחה הטופס מתחלף בהודעת תודה במקום.
     שימו לב: הטופס עוד לא מחובר לשום יעד (מייל או CRM), ולכן הפרטים לא נשלחים לשום מקום */
  const form = $('.cx__form'), done = $('.cx__done'), doneN = $('.cx__done-n');
  const RULES = {
    name: v => v.trim().length >= 2 ? '' : 'נא למלא שם',
    email: v => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'כתובת המייל לא נראית תקינה',
    phone: v => { const d = v.replace(/\D/g, ''); return d.length >= 9 && d.length <= 13 ? '' : 'נא למלא מספר טלפון תקין'; },
    privacy: (v, inp) => inp.checked ? '' : 'יש לאשר את מדיניות הפרטיות כדי לשלוח'
  };
  const check = inp => {
    const msg = RULES[inp.name] ? RULES[inp.name](inp.value, inp) : '';
    const fld = inp.closest('.fld'), err = $('.fld__err', fld);
    fld.classList.toggle('is-bad', !!msg);
    inp.setAttribute('aria-invalid', String(!!msg));
    err.textContent = msg;
    return !msg;
  };
  if (form) {
    const ok = $('.ok__in', form), inputs = [...$$('.fld__in', form), ok].filter(Boolean);
    // השגיאה מופיעה רק אחרי שיוצאים מהשדה, ונעלמת ברגע שמתקנים
    $$('.fld__in', form).forEach(inp => {
      inp.addEventListener('blur', () => { if (inp.value.trim()) check(inp); });
      inp.addEventListener('input', () => { if (inp.closest('.fld').classList.contains('is-bad')) check(inp); });
    });
    ok && ok.addEventListener('change', () => { if (ok.closest('.fld').classList.contains('is-bad')) check(ok); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const bad = inputs.filter(inp => !check(inp));
      if (bad.length) { bad[0].focus(); return; }
      const name = $('#cx-name', form).value.trim().split(/\s+/)[0];
      doneN.textContent = name ? ' ' + name : '';
      const show = () => { form.hidden = true; done.hidden = false; done.setAttribute('tabindex', '-1'); done.focus({ preventScroll: true }); };
      if (!window.gsap || reduce) { show(); return; }
      gsap.to(form, { autoAlpha: 0, y: -14, duration: .35, ease: 'power2.in', onComplete: () => {
        show();
        gsap.fromTo(done, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .7, ease: 'power3.out' });
      } });
    });
  }

  if (!window.gsap || !window.ScrollTrigger) { header && header.classList.add('is-solid'); return; }
  gsap.registerPlugin(ScrollTrigger);

  // גלילה חלקה, בדיוק כמו בשאר העמודים
  if (window.Lenis && !reduce) {
    const lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, wheelMultiplier: 1.15, touchMultiplier: 1.8, anchors: { offset: -((header ? header.offsetHeight : 64) + 30) } });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000), false, true);
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- כותרות: אות אחרי אות (y 26, rotateX -60, back.out), כמו "מצד אחד" ---------- */
  const LETTER = { autoAlpha: 0, y: 26, rotateX: -60 };
  const splitChars = el => {
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const out = [];
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 1) {
        if (n.tagName === 'BDI') { const w = document.createElement('span'); w.className = 'ch'; w.setAttribute('aria-hidden', 'true'); n.replaceWith(w); w.appendChild(n); out.push(w); return; }
        if (n.tagName !== 'BR') walk(n); return;
      }
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span'); w.style.cssText = 'display:inline-block;white-space:nowrap'; w.setAttribute('aria-hidden', 'true');
        [...part].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; w.appendChild(s); out.push(s); });
        frag.appendChild(w);
      });
      n.replaceWith(frag);
    });
    walk(el);
    return out;
  };
  const playChars = (chars, delay = 0) => gsap.to(chars, { autoAlpha: 1, y: 0, rotateX: 0, duration: .7, delay, stagger: Math.min(.035, 1.2 / chars.length), ease: 'back.out(1.8)', overwrite: true });

  /* ---------- טקסט רץ: שורה אחרי שורה ---------- */
  const splitWords = el => {
    const out = [];
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 1) {
        if (n.tagName === 'BDI') { const w = document.createElement('span'); w.className = 'lw'; n.replaceWith(w); w.appendChild(n); out.push(w); return; }
        if (n.tagName !== 'BR') walk(n); return;
      }
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const w = document.createElement('span'); w.className = 'lw'; w.textContent = part; frag.appendChild(w); out.push(w);
      });
      n.replaceWith(frag);
    });
    walk(el);
    return out;
  };
  function playLines(words) {
    if (!words.length) return;
    let top = null, n = -1;
    const ln = words.map(w => { const t = Math.round(w.getBoundingClientRect().top); if (top === null || Math.abs(t - top) > 6) { n++; top = t; } return n; });
    gsap.to(words, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out', stagger: i => ln[i] * .09, overwrite: true });
  }

  $$('[data-title]').forEach(el => {
    const chars = splitChars(el); if (reduce) return;
    gsap.set(chars, LETTER);
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => playChars(chars) });
  });
  $$('[data-lines]').forEach(el => {
    const w = splitWords(el); if (reduce) return;
    gsap.set(w, { autoAlpha: 0, y: 26 });
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => playLines(w) });
  });
  if (!reduce) {
    const fades = $$('[data-fade]');
    gsap.set(fades, { autoAlpha: 0, y: 30 });
    ScrollTrigger.batch(fades, { start: 'top 94%', once: true, onEnter: b => gsap.to(b, { autoAlpha: 1, y: 0, duration: 1.1, stagger: .09, ease: 'power3.out' }) });
  }
  const rise = (els, trigger, o = {}) => {
    if (reduce || !els.length) return;
    gsap.set(els, { autoAlpha: 0, y: o.y ?? 50 });
    ScrollTrigger.create({ trigger, start: o.start || 'top 84%', once: true, onEnter: () => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, stagger: o.stagger ?? .1, ease: 'expo.out', clearProps: 'transform' }) });
  };

  /* ---------- שדה נקודות: אותו מתכון של ההמלצות בדף הבית (קטנות, כמעט שקופות, מתנפחות מעט מתחת לעכבר) ---------- */
  const dotField = (canvas, o) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const GAP = 17, SIZE = 2, PROX = 140, PUSH = 10, SWELL = .5, TENSION = .09, DAMP = .78, col = o.color;
    let W = 0, H = 0, dpr = 1, raf = 0, live = false, p = null, alive = true, lmx = -9999, lmy = -9999;
    const M = { x: -9999, y: -9999 };
    const build = () => {
      W = canvas.clientWidth; H = canvas.clientHeight; if (!W || !H) return false;
      dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      const cols = Math.ceil(W / GAP) + 1, rows = Math.ceil(H / GAP) + 1, x0 = (W - (cols - 1) * GAP) / 2, y0 = (H - (rows - 1) * GAP) / 2;
      const cx = W * .5, cy = H * .5, rx = W * .49, ry = H * .47, xs = [], ys = [], ms = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = x0 + c * GAP, y = y0 + r * GAP, qx = (x - cx) / rx, qy = (y - cy) / ry, q = qx * qx + qy * qy;
        if (q < 1) { xs.push(x); ys.push(y); ms.push((1 - q) * (1 - q)); }
      }
      const n = xs.length;
      p = { n, x: Float32Array.from(xs), y: Float32Array.from(ys), m: Float32Array.from(ms), ox: new Float32Array(n), oy: new Float32Array(n), vx: new Float32Array(n), vy: new Float32Array(n), e: new Float32Array(n) };
      alive = true; return true;
    };
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!p && !build()) return;
      const near = (x, y) => x > -PROX && x < W + PROX && y > -PROX && y < H + PROX;
      const mv = (M.x !== lmx || M.y !== lmy) && (near(M.x, M.y) || near(lmx, lmy));
      lmx = M.x; lmy = M.y;
      if (!mv && !alive) return;
      alive = false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.fillStyle = 'rgb(' + col + ')';
      for (let i = 0; i < p.n; i++) {
        let tx = 0, ty = 0, te = 0;
        const dx = p.x[i] - M.x, dy = p.y[i] - M.y;
        if (dx > -PROX && dx < PROX && dy > -PROX && dy < PROX) { const d = Math.hypot(dx, dy); if (d < PROX) { const f = 1 - d / PROX, f2 = f * f, inv = d > .001 ? 1 / d : 0; tx = dx * inv * f2 * PUSH; ty = dy * inv * f2 * PUSH; te = Math.min(1, f2 * 1.3); } }
        p.vx[i] = (p.vx[i] + (tx - p.ox[i]) * TENSION) * DAMP; p.vy[i] = (p.vy[i] + (ty - p.oy[i]) * TENSION) * DAMP;
        p.ox[i] += p.vx[i]; p.oy[i] += p.vy[i]; p.e[i] += (te - p.e[i]) * .14;
        if (!alive && (Math.abs(p.vx[i]) + Math.abs(p.vy[i]) > .01 || Math.abs(te - p.e[i]) > .002)) alive = true;
        const a = p.m[i] * (o.base + o.hover * p.e[i]); if (a < .01) continue;
        ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(p.x[i] + p.ox[i], p.y[i] + p.oy[i], SIZE * (1 + SWELL * p.e[i]) / 2 + .35, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting && !live) { live = true; alive = true; raf = requestAnimationFrame(draw); }
      else if (!en.isIntersecting && live) { live = false; cancelAnimationFrame(raf); }
    })).observe(canvas);
    if (!reduce) addEventListener('mousemove', ev => { const r = canvas.getBoundingClientRect(); M.x = ev.clientX - r.left; M.y = ev.clientY - r.top; }, { passive: true });
    addEventListener('resize', () => { p = null; });
    ScrollTrigger.addEventListener('refresh', () => { p = null; });
  };
  dotField($('.cx .dotfield'), { color: '245,245,245', base: .06, hover: .16 });

  /* ================= פתיחה ================= */
  const cx = $('.cx');
  if (cx && !reduce) {
    const l1 = splitChars($('.cx__l1', cx)), l2 = splitChars($('.cx__l2', cx));
    $('.cx__title', cx).setAttribute('aria-label', 'בואו נדבר על העצמאות הכלכלית שלכם!');
    $$('.cx__l1, .cx__l2', cx).forEach(s => s.removeAttribute('aria-label'));
    // הנוף מתקרב לאט למקומו, הכותרת אות אחרי אות, לוח הטופס עולה והשדות אחריו, והעיגולים "צצים" בסוף
    const info = $('.cx__info', cx), panel = $('.cx__panel', cx), bg = $('.cx__bg img', cx);
    const inner = $$('.cx__ft, .fld, .cx__send', cx), dots = $$('.dots > li', cx);
    gsap.set([...l1, ...l2], LETTER);
    gsap.set(panel, { autoAlpha: 0, y: 30 });
    gsap.set([...inner, info], { autoAlpha: 0, y: 18 });
    gsap.set(dots, { autoAlpha: 0, y: 20, scale: .85 });
    gsap.timeline({ delay: .1 })
      .fromTo(bg, { scale: 1.08, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 2.4, ease: 'power2.out', clearProps: 'transform' }, 0)
      .add(() => playChars(l1), .1)
      .add(() => playChars(l2), .4)
      .to(panel, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', clearProps: 'transform' }, .6)
      .to(inner, { autoAlpha: 1, y: 0, duration: .8, stagger: .07, ease: 'power3.out', clearProps: 'transform' }, .9)
      .to(dots, { autoAlpha: 1, y: 0, scale: 1, duration: .8, stagger: .08, ease: 'back.out(1.6)', clearProps: 'transform' }, 1.5)
      .to(info, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out', clearProps: 'transform' }, 1.7);
  }

  /* ================= פוטר: השמש על הקצה התחתון של לוח הזכוכית, והטורים עולים ================= */
  const sky = $('.foot__sky'), skyImg = $('.foot__sky img'), fgrid = $('.foot__grid');
  const placeSun = () => {
    if (!sky || !skyImg || !fgrid || !skyImg.naturalWidth || mobile()) { sky && sky.style.removeProperty('--sun-y'); return; }
    const cw = sky.clientWidth, ch = sky.clientHeight, s = Math.max(cw / skyImg.naturalWidth, ch / skyImg.naturalHeight), rh = skyImg.naturalHeight * s;
    if (rh <= ch + 1) return;
    const target = fgrid.offsetTop + fgrid.offsetHeight - sky.offsetTop;
    sky.style.setProperty('--sun-y', (clamp((.55 * rh - target) / (rh - ch)) * 100).toFixed(1) + '%');
  };
  if (skyImg) { skyImg.complete ? placeSun() : skyImg.addEventListener('load', placeSun, { once: true }); addEventListener('resize', () => requestAnimationFrame(placeSun)); ScrollTrigger.addEventListener('refresh', placeSun); }
  rise($$('.foot__brand, .foot__h, .foot__nav a, .foot__contact .btn, .foot__bar > *'), '.foot__grid', { y: 30, stagger: .06, start: 'top 94%' });

  /* ================= ההדר: רקע ברגע שגוללים, ובהיר מעל האזורים הבהירים ================= */
  let zones = [], hh = header ? header.offsetHeight : 64, last = '';
  const mapZones = () => {
    hh = header ? header.offsetHeight : 64;
    // אזור נעוץ יושב בתוך pin-spacer, ולכן מודדים את העוטף שלו. הפוטר שעולה מעליו מנצח (הוא האחרון ברשימה)
    zones = $$('main > [data-theme], main > .pin-spacer > [data-theme]').map(sec => { const box = sec.parentElement.classList.contains('pin-spacer') ? sec.parentElement : sec; const r = box.getBoundingClientRect(), top = r.top + scrollY; return { top, bottom: top + r.height, light: sec.dataset.theme === 'light', glass: sec.dataset.header === 'glass' }; });
  };
  ScrollTrigger.addEventListener('refresh', mapZones);
  const tick = () => {
    if (!header) return;
    const y = window.lenis ? window.lenis.scroll : scrollY, line = y + hh + 4;
    let z = null; for (const q of zones) if (q.top <= line && q.bottom > line) z = q;
    const isLight = !!(z && z.light), glass = !!(z && z.glass);
    const key = (y > 8) + '|' + isLight + '|' + glass;
    if (key === last) return; last = key;
    header.classList.toggle('is-solid', y > 8);
    header.classList.toggle('is-light', isLight);
    header.classList.toggle('is-glass', glass);
  };
  gsap.ticker.add(tick);

  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  const onLoaded = () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); };
  document.readyState === 'complete' ? requestAnimationFrame(onLoaded) : addEventListener('load', onLoaded);
})();
