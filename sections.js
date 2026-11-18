/* האזורים שאחרי מרוץ העכברים (גרסה 6).
   כללי: כל כותרת נכנסת אות אחרי אות (כמו "מצד אחד"), וכל טקסט נכנס שורה אחרי שורה.
   עומק ברקע: שדה הנקודות של המבוך, העיר של מרוץ העכברים והטקסט הענק. במעבר לאזור חדש המסך כולו עולה מעל הקודם בגלילה אחת.
   1 משולש הזהב · 2 שורה תחתונה · 3 מי אנחנו · 4 למי זה מתאים · 5 לכל אורך הדרך · 6 המלצות · 7 שלושת המצבים · 8 המפנה · 9 מסלולים · 10 מרכז הידע · 11 פוטר */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const U = () => Math.min(innerWidth, 1920) / 1920;
  const mobile = () => innerWidth <= 900;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  /* גלילה בשלבים (משולש הזהב, שורה תחתונה): גלילה אחת = שלב אחד, במעבר רך (התחלה וסיום עדינים).
     תנועה חדשה מזוהה גם כשמשטח המגע עוד "מתגלגל" (האינרציה רק נחלשת, תנועה חדשה מתחזקת), כך שלא מרגישים תקיעות.
     גלילה שמגיעה באמצע מעבר לא הולכת לאיבוד: היא נשמרת ומתבצעת מיד כשהמעבר נגמר.
     count: מספר העצירות. prevY/nextY: לאן גולשים מעל העצירה הראשונה / אחרי האחרונה (null = הגלילה הרגילה ממשיכה) */
  const STEP_DUR = .85;
  let stepLock = 0;   // עד מתי מעבר כלשהו רץ: בזמן הזה שום גלילה לא דולפת לגלילה הרגילה (גם במעבר בין שני אזורים)
  const stepEase = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const stepper = (st, count, prevY, nextY) => {
    const stops = () => Array.from({ length: count }, (_, k) => st.start + (count > 1 ? (st.end - st.start) * k / (count - 1) : 0));
    const curY = () => window.lenis ? window.lenis.scroll : scrollY;
    const inZone = () => { const y = curY(); return y >= st.start - 4 && y <= st.end + 4; };
    const nearest = () => { const y = curY(), S = stops(); let k = 0; S.forEach((v, i) => { if (Math.abs(v - y) < Math.abs(S[k] - y)) k = i; }); return k; };
    let busy = false, queued = 0, lastT = 0, lastAbs = 0, lastStep = 0, ty = null, guard = 0;
    const glide = y => {
      busy = true; clearTimeout(guard); stepLock = performance.now() + STEP_DUR * 1000 + 120;
      const done = () => { if (!busy) return; busy = false; clearTimeout(guard); if (queued) { const d = queued; queued = 0; stepTo(d); } };
      window.lenis ? window.lenis.scrollTo(y, { duration: STEP_DUR, easing: stepEase, force: true, onComplete: done }) : scrollTo(0, y);
      guard = setTimeout(done, STEP_DUR * 1000 + 200);
    };
    const stepTo = dir => {
      const n = nearest() + dir;
      if (n < 0) { const y = prevY && prevY(); if (y != null) glide(y); return; }
      if (n > count - 1) { const y = nextY && nextY(); if (y != null) glide(y); return; }
      lastStep = performance.now(); glide(stops()[n]);
    };
    addEventListener('wheel', e => {
      if (e.ctrlKey) return;
      if (!inZone()) { if (performance.now() < stepLock) { e.preventDefault(); e.stopImmediatePropagation(); } return; }
      const dir = Math.sign(e.deltaY); if (!dir) return;
      if (dir < 0 && !prevY && curY() <= st.start + 4) return;      // מעל השלב הראשון: הגלילה הרגילה חוזרת
      e.preventDefault(); e.stopImmediatePropagation();
      const now = performance.now(), gap = now - lastT, abs = Math.abs(e.deltaY);
      const fresh = gap > 140 || abs > lastAbs * 1.4 + 4;           // תנועה חדשה: אחרי שקט קצר, או כשהגלילה מתחזקת שוב
      lastT = now; lastAbs = abs;
      if (!fresh) return;
      if (busy) { if (now - lastStep > 300) queued = dir; return; }
      stepTo(dir);
    }, { capture: true, passive: false });
    addEventListener('touchstart', e => { ty = inZone() ? e.touches[0].clientY : null; }, { passive: true });
    addEventListener('touchmove', e => { if (ty !== null) e.preventDefault(); }, { passive: false });
    addEventListener('touchend', e => { if (ty === null) return; const dy = ty - e.changedTouches[0].clientY; ty = null; if (Math.abs(dy) > 30) { const d = dy > 0 ? 1 : -1; busy ? (queued = d) : stepTo(d); } }, { passive: true });
  };
  const pad = n => String(n).padStart(2, '0');
  const scrollToY = y => window.lenis ? window.lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });

  // ההדר: ברגע שגוללים הוא מקבל רקע, כדי שהטקסט של ההירו לא ייראה עולה מתחתיו
  const header = $('.site-header');
  const solid = () => header && header.classList.toggle('is-solid', scrollY > 8);
  addEventListener('scroll', solid, { passive: true }); solid();

  /* ---------- כותרות: אות אחרי אות, בדיוק כמו בכותרות של "מצד אחד" ----------
     מילה שלמה לא נשברת באמצע, ומילים באנגלית (bdi) נשארות יחידה אחת כדי שהסדר שלהן לא יתהפך */
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
  const playChars = chars => gsap.to(chars, { autoAlpha: 1, y: 0, rotateX: 0, duration: .7, stagger: Math.min(.035, 1.2 / chars.length), ease: 'back.out(1.8)', overwrite: true });
  $$('[data-title]').forEach(el => {
    const chars = splitChars(el); if (reduce) return;
    gsap.set(chars, LETTER);
    ScrollTrigger.create({ trigger: el, start: 'top 86%', once: true, onEnter: () => playChars(chars) });
  });

  /* ---------- טקסט רץ: שורה אחרי שורה (כמו הנקודות של "מצד אחד") ----------
     מפצלים למילים, מזהים שורות לפי הגובה במסך, וכל שורה עולה קצת מלמטה בהפרש קצר מהקודמת */
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
  const lineTl = new WeakMap();
  const playLines = words => {
    if (!words.length) return;
    lineTl.get(words[0])?.kill();
    let top = null, n = -1;
    const ln = words.map(w => { const t = Math.round(w.getBoundingClientRect().top); if (top === null || Math.abs(t - top) > 6) { n++; top = t; } return n; });
    lineTl.set(words[0], gsap.to(words, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out', stagger: i => ln[i] * .09 }));
  };
  const hideLines = words => { if (!words.length) return; lineTl.get(words[0])?.kill(); gsap.set(words, { autoAlpha: 0, y: 26 }); };
  // בתוך טיימליין של גלילה: נכנס כשעוברים את הנקודה, ונעלם כשחוזרים אחורה
  const linesAt = words => ({ duration: .01, onStart: () => playLines(words), onReverseComplete: () => hideLines(words) });
  const lines = (el, start = 'top 88%') => {
    const w = splitWords(el); if (reduce) return w;
    gsap.set(w, { autoAlpha: 0, y: 26 });
    ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => playLines(w) });
    return w;
  };
  $$('[data-lines]').forEach(el => lines(el));
  if (!reduce) {
    const fades = $$('[data-fade]');
    gsap.set(fades, { autoAlpha: 0, y: 30 });
    ScrollTrigger.batch(fades, { start: 'top 92%', once: true, onEnter: b => gsap.to(b, { autoAlpha: 1, y: 0, duration: 1.1, stagger: .09, ease: 'power3.out' }) });
  }
  const rise = (els, trigger, opts = {}) => {
    if (reduce || !els.length) return;
    gsap.set(els, { autoAlpha: 0, y: opts.y ?? 50 });
    ScrollTrigger.create({ trigger, start: opts.start || 'top 84%', once: true, onEnter: () => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, stagger: opts.stagger ?? .1, ease: 'expo.out', clearProps: 'transform' }) });
  };
  const pin = (trigger, tl, len) => ScrollTrigger.create({ trigger, start: 'top top', end: () => '+=' + Math.round(innerHeight * len()), pin: true, scrub: .8, animation: tl, invalidateOnRefresh: true });

  /* ---------- מעבר: המסך החדש עולה כולו מעל הקודם, בגלילה אחת ----------
     ברגע שמתחילים לגלול לתוך המעבר, הגלילה משלימה אותו לבד (ובחזרה למעלה, אותו דבר) */
  const snapCover = el => {
    if (reduce || !el) return;
    let busy = false;
    const go = y => {
      if (busy || !window.lenis) return; busy = true;
      // קצר יותר (שנייה): פחות זמן שבו הגלילה "נעולה" ומרגישה תקועה
      // בלי נעילה: אם ממשיכים לגלול באמצע, הגלילה של המשתמש קובעת (קודם זה הרגיש כמו תקיעה)
      window.lenis.scrollTo(y, { duration: .9, easing: t => 1 - Math.pow(1 - t, 4), force: true, onComplete: () => { busy = false; } });
      setTimeout(() => { busy = false; }, 1400);
    };
    // רק כשהמשתמש באמת גולל לתוך המעבר: קפיצה של קישור בתפריט, או גלילה שכבר יעדה מעבר לאזור, לא נעצרת כאן
    const target = () => window.lenis ? window.lenis.targetScroll : scrollY;
    ScrollTrigger.create({ trigger: el, start: 'top bottom-=2', end: 'top top+=2',
      onEnter: s => { const t = target(); if (t > s.start && t < s.end) go(s.end + 2); },
      onEnterBack: s => { const t = target(); if (t > s.start && t < s.end) go(s.start - 2); } });
  };

  /* ---------- שדה נקודות: אותה רשת עדינה של המבוך, עם המגנט של העכבר ----------
     ellipse: איפה השדה נראה (נמס לכל הכיוונים). share: איזה חלק מהנקודות יכול להידלק בכתום (state.a = 0..1) */
  const dotField = (canvas, o) => {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const GAP = o.gap || 17, SIZE = o.size || 2, PROX = 140, PUSH = o.push ?? 22, SWELL = o.swell ?? 1.8, TENSION = .09, DAMP = .78;
    const col = o.color || '16,14,54';
    const state = { a: 0 };
    let W = 0, H = 0, dpr = 1, raf = 0, live = false, p = null;
    const M = { x: -9999, y: -9999 };
    const build = () => {
      W = canvas.clientWidth; H = canvas.clientHeight; if (!W || !H) return false;
      dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      const e = o.ellipse(W, H), cols = Math.ceil(W / GAP) + 1, rows = Math.ceil(H / GAP) + 1;
      const x0 = (W - (cols - 1) * GAP) / 2, y0 = (H - (rows - 1) * GAP) / 2;
      const xs = [], ys = [], ms = [], fl = [], dl = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = x0 + c * GAP, y = y0 + r * GAP, qx = (x - e.cx) / e.rx, qy = (y - e.cy) / e.ry, q = qx * qx + qy * qy;
        if (q >= 1) continue;
        xs.push(x); ys.push(y); ms.push((1 - q) * (1 - q)); fl.push(Math.random() < (o.share || 0) ? 1 : 0); dl.push(Math.random() * .7);
      }
      const n = xs.length;
      p = { n, x: Float32Array.from(xs), y: Float32Array.from(ys), m: Float32Array.from(ms), f: Uint8Array.from(fl), d: Float32Array.from(dl), ox: new Float32Array(n), oy: new Float32Array(n), vx: new Float32Array(n), vy: new Float32Array(n), e: new Float32Array(n) };
      return true;
    };
    const hot = [], NB = 16, AM = Math.min(1, o.base + o.hover);
    let bx = null, bn = null, alive = true, lastA = -1, lmx = -9999, lmy = -9999;
    const near = (x, y) => x > -PROX && x < W + PROX && y > -PROX && y < H + PROX;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      // בלי לקרוא את הגודל בכל פריים (זה מכריח סידור של העמוד). הגודל נבנה מחדש בשינוי חלון וב-refresh
      if (!p) { if (!build()) return; bx = Array.from({ length: NB }, () => new Float32Array(p.n * 3)); bn = new Int32Array(NB); alive = true; }
      // שום דבר לא זז (העכבר רחוק ולא זז, והנקודות כבר נרגעו): הפריים הקודם עדיין נכון
      const mv = (M.x !== lmx || M.y !== lmy) && (near(M.x, M.y) || near(lmx, lmy));
      lmx = M.x; lmy = M.y;
      if (!mv && !alive && state.a === lastA) return;
      lastA = state.a; alive = false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgb(' + col + ')';
      hot.length = 0; bn.fill(0);
      const A = state.a;
      for (let i = 0; i < p.n; i++) {
        let tx = 0, ty = 0, te = 0;
        if (!reduce) {
          const dx = p.x[i] - M.x, dy = p.y[i] - M.y;
          if (dx > -PROX && dx < PROX && dy > -PROX && dy < PROX) {
            const d = Math.hypot(dx, dy);
            if (d < PROX) { const f = 1 - d / PROX, f2 = f * f, inv = d > .001 ? 1 / d : 0; tx = dx * inv * f2 * PUSH; ty = dy * inv * f2 * PUSH; te = Math.min(1, f2 * 1.3); }
          }
        }
        p.vx[i] = (p.vx[i] + (tx - p.ox[i]) * TENSION) * DAMP; p.vy[i] = (p.vy[i] + (ty - p.oy[i]) * TENSION) * DAMP;
        p.ox[i] += p.vx[i]; p.oy[i] += p.vy[i];
        p.e[i] += (te - p.e[i]) * .14;
        if (!alive && (Math.abs(p.vx[i]) + Math.abs(p.vy[i]) > .01 || Math.abs(te - p.e[i]) > .002)) alive = true;
        const ev = p.e[i];
        let a = p.m[i] * (o.base + o.hover * ev);
        const k = p.f[i] && A > 0 ? clamp((A - p.d[i]) / .3) : 0;
        if (k > 0) { hot.push(i, k); a *= 1 - k; }
        if (a < .01) continue;
        const b = Math.min(NB - 1, Math.floor(a / AM * NB)), arr = bx[b], j = bn[b] * 3;
        arr[j] = p.x[i] + p.ox[i]; arr[j + 1] = p.y[i] + p.oy[i]; arr[j + 2] = SIZE * (1 + SWELL * ev) / 2 + .35; bn[b]++;
      }
      for (let b = 0; b < NB; b++) {
        const m = bn[b]; if (!m) continue;
        const arr = bx[b]; ctx.globalAlpha = (b + .5) / NB * AM; ctx.beginPath();
        for (let j = 0; j < m * 3; j += 3) { ctx.moveTo(arr[j] + arr[j + 2], arr[j + 1]); ctx.arc(arr[j], arr[j + 1], arr[j + 2], 0, 6.2832); }
        ctx.fill();
      }
      if (hot.length) {
        ctx.fillStyle = 'rgb(241,90,59)';
        for (let j = 0; j < hot.length; j += 2) { const i = hot[j], k = hot[j + 1]; ctx.globalAlpha = Math.min(1, .4 + .6 * p.m[i] * 1.6) * k; ctx.beginPath(); ctx.arc(p.x[i] + p.ox[i], p.y[i] + p.oy[i], SIZE * (1 + .9 * k) / 2 + .5, 0, 6.2832); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    };
    new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting && !live) { live = true; raf = requestAnimationFrame(draw); }
      else if (!en.isIntersecting && live) { live = false; cancelAnimationFrame(raf); }
    })).observe(canvas);
    addEventListener('mousemove', ev => { const r = canvas.getBoundingClientRect(); M.x = ev.clientX - r.left; M.y = ev.clientY - r.top; }, { passive: true });
    document.addEventListener('mouseleave', () => { M.x = M.y = -9999; });
    addEventListener('resize', () => { p = null; });
    ScrollTrigger.addEventListener('refresh', () => { p = null; });
    return { state };
  };

  const hoverable = () => matchMedia('(hover: hover) and (min-width: 901px)').matches;

  // ================= 1. משולש הזהב (גרסה 12): הפסל במרכז, מימין השלב הפעיל, משמאל התוויות שלו, ולמטה שלושה מקטעים שמתמלאים בגלילה =================
  const gt = $('.gt');
  if (gt) {
    // במובייל (car): בלי נעיצה ובלי גלילה בשלבים, הגלילה בעמוד טבעית. במגע, הגלילה בשלבים לא הזיזה את המסך עד שהאצבע עזבה
    // (הרגיש תקוע), ומהשלב הראשון אי אפשר היה לחזור למעלה. במקום זה שלושת השלבים הם כרטיסים שמחליקים הצידה,
    // והפסל והמקטעים מעליהם מגיבים לכרטיס שמול העיניים. גם הגלישה האוטומטית בכניסה לאזור כבויה במגע (נלחמה באצבע)
    const car = mobile();
    if ($('.rat.is-live') && !reduce && !car) { gt.classList.add('is-cover'); snapCover(gt); }   // במובייל בלי כיסוי: הגלילה ממשיכה רגיל
    const steps = $$('.gts', gt), sets = $$('.gt__sets .gts__tags', gt), segs = $$('.gt__seg', gt), bars = segs.map(s => $('.gt__bar b', s));
    const pieces = [1, 2, 3].map(n => $('.gt__piece--' + n, gt)), fills = [1, 2, 3].map(n => $('.gt__fill--' + n, gt)), sculpt = $('.gt__sculpt', gt);
    const pair = k => [pieces[k], fills[k]];
    const fig = $('.gt__fig', gt), panels = $$('.gt__panel', gt), xBtn = $('.gt__x', gt);
    const parts = steps.map((s, k) => ({ no: $('.gts__no', s), name: splitChars($('.gts__name', s)), words: splitWords($('.gts__lead', s)), btn: $('.btn', s), chips: $$('li', sets[k]) }));
    const all = p => [p.no, ...p.name, ...p.words, p.btn, ...p.chips];
    const track = $('.gt__steps', gt);
    if (car) {
      gt.classList.add('is-car');
      // התוויות של כל שלב ("מה כולל השלב") עוברות לתוך החלונית של "לפרטים נוספים" שלו (לבקשת צביה):
      // בכרטיס נשארים רק המספר, השם, ההסבר והכפתור, וכך יש מקום לפסל גדול יותר
      const incH = $('.gt__inc-h', gt);
      steps.forEach((s, k) => { const pn = panels[k]; if (!pn) return; pn.appendChild(incH.cloneNode(true)); pn.appendChild(sets[k]); });
      // הכותרת והפסל קבועים למעלה והכרטיסים נערמים מתחתם: מודדים את גובה הכותרת ואת הכרטיס הגבוה, והפסל מקבל את מה שנשאר במסך
      const head = $('.gt__head', gt);
      const measure = () => { gt.style.setProperty('--gth', head.offsetHeight + 'px'); gt.style.setProperty('--gtc', Math.max(...steps.map(s => s.offsetHeight)) + 'px'); gt.style.setProperty('--gtl', steps[steps.length - 1].offsetHeight + 'px'); };
      measure(); addEventListener('resize', measure);
      if (document.fonts) document.fonts.ready.then(measure);
    }
    if (!reduce && !car) parts.forEach(p => gsap.set(all(p), { autoAlpha: 0 }));
    // במובייל המגירה קבועה על המסך: בזמן שהיא פתוחה העמוד מאחוריה לא נגלל
    const lock = v => { if (!car) return; document.documentElement.style.overflow = v ? 'hidden' : ''; if (window.lenis) v ? window.lenis.stop() : window.lenis.start(); };

    const panelWords = panels.map(() => null);
    let lastBtn = null;
    const openWin = k => {
      panels.forEach((pn, i) => { pn.hidden = i !== k; });
      gt.classList.add('is-open'); $('.gt__win', gt).scrollTop = 0; lock(true);
      if (!reduce) { if (!panelWords[k]) panelWords[k] = $$('.gt__pt, p', panels[k]).flatMap(splitWords); hideLines(panelWords[k]); setTimeout(() => playLines(panelWords[k]), 380); }
      xBtn.focus({ preventScroll: true });
    };
    const closeWin = () => { if (!gt.classList.contains('is-open')) return; gt.classList.remove('is-open'); lock(false); lastBtn && lastBtn.focus({ preventScroll: true }); };
    $$('[data-open]', gt).forEach(b => b.addEventListener('click', () => { lastBtn = b; openWin(+b.dataset.open); }));
    xBtn.addEventListener('click', closeWin);
    $('.gt__scrim', gt).addEventListener('click', closeWin);   // לחיצה מחוץ למגירה סוגרת אותה
    gt.addEventListener('keydown', e => { if (e.key === 'Escape') closeWin(); });

    // החלפת שלב: המספר מתגלגל, השם נכתב אות אחרי אות, ההסבר שורה אחרי שורה, התוויות קופצות אחת אחרי השנייה,
    // השכבה שלו בפסל מתרוממת, והמקטע שלו למטה מודגש
    let on = -1;
    const show = i => {
      if (i === on) return;
      const prev = on; on = i;
      segs.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.setAttribute('aria-current', k === i ? 'step' : 'false'); });
      // השכבות מתמלאות בצבע אחת אחרי השנייה מלמטה: בשלב 1 הבסיס, בשלב 2 גם האמצע, ובשלב 3 שלושתן. השכבה של השלב הנוכחי מתרוממת
      pieces.forEach((p, k) => p.classList.toggle('is-now', k === i));
      fills.forEach((f, k) => { f.classList.toggle('is-on', k <= i); f.classList.toggle('is-now', k === i); });
      sculpt.classList.add('has-on');
      closeWin();
      if (car) bars.forEach((b, k) => { b.style.transform = 'scaleX(' + (k <= i ? 1 : 0) + ')'; });   // המקטעים מתמלאים עד הכרטיס הנוכחי
      if (reduce || car) { steps.forEach((s, k) => s.classList.toggle('is-on', k === i)); sets.forEach((s, k) => s.classList.toggle('is-on', k === i)); return; }
      if (prev >= 0) {
        const p = parts[prev], s = steps[prev], c = sets[prev];
        gsap.to(all(p), { autoAlpha: 0, y: -18, duration: .3, stagger: .002, ease: 'power2.in', overwrite: true, onComplete: () => { if (on !== prev) { s.classList.remove('is-on'); c.classList.remove('is-on'); } } });
      }
      const p = parts[i]; steps[i].classList.add('is-on'); sets[i].classList.add('is-on');
      const d = prev >= 0 ? .3 : .1;
      gsap.set(p.name, LETTER); gsap.set(p.words, { autoAlpha: 0, y: 26 });
      gsap.to(p.name, { autoAlpha: 1, y: 0, rotateX: 0, duration: .7, stagger: .03, delay: d, ease: 'back.out(1.8)', overwrite: true });
      gsap.delayedCall(d + .25, () => { if (on === i) playLines(p.words); });
      gsap.fromTo(p.chips, { autoAlpha: 0, y: 18, scale: .94 }, { autoAlpha: 1, y: 0, scale: 1, duration: .7, stagger: .06, delay: d + .2, ease: 'expo.out', overwrite: true });
      gsap.fromTo(p.btn, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .6, delay: d + .55, ease: 'power3.out', overwrite: true });
      gsap.fromTo(p.no, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .6, delay: d - .05, ease: 'power3.out', overwrite: true });
    };

    let st = null;
    const AT = [1 / 3, 2 / 3, 1];   // לחיצה על שלב: המקטע שלו מלא
    // במובייל: לחיצה על מקטע או על שכבה בפסל מחליקה את הכרטיסים אל השלב (רק הצידה, העמוד לא זז)
    // במובייל השלבים אחד מתחת לשני והפסל דבוק למעלה: לחיצה על שכבה בפסל גוללת את העמוד אל הכרטיס שלה, מתחת לפסל
    // הכרטיסים דבוקים (sticky), אז המיקום הטבעי שלהם מחושב מראש הרשימה: כל הכרטיסים שלפניו והרווחים ביניהם
    const slide = k => { const sy = window.lenis ? window.lenis.scroll : scrollY, gap = parseFloat(getComputedStyle(track).rowGap) || 0;
      let top = track.getBoundingClientRect().top + sy + (parseFloat(getComputedStyle(track).paddingTop) || 0);
      for (let i = 0; i < k; i++) top += steps[i].offsetHeight + gap;
      const y = top - (parseFloat(getComputedStyle(steps[k]).top) || fig.getBoundingClientRect().bottom) + 1; window.lenis ? window.lenis.scrollTo(y, { duration: .9 }) : scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); };
    const go = k => { closeWin(); if (car) slide(k); else if (st) scrollToY(st.start + 2 + (st.end - st.start) * AT[k]); else show(k); };
    $$('[data-go]', gt).forEach(b => b.addEventListener('click', () => go(+b.dataset.go)));
    // במובייל: השלב הפעיל הוא הכרטיס שהכי קרוב למרכז. מחכים לסוף הכניסה של הפסל, כדי שהצבע יעלה אחרי שהוא נבנה
    let carReady = reduce;
    // השלב הפעיל: הכרטיס שעובר את הקו שבאמצע השטח הפנוי מתחת לפסל הדבוק
    const pick = () => { const line = fig.getBoundingClientRect().bottom + (innerHeight - fig.getBoundingClientRect().bottom) * .45; let k = 0; steps.forEach((s, i) => { if (s.getBoundingClientRect().top < line) k = i; }); if (carReady) show(k); };
    // הכרטיס שמתחת נחתך בדיוק בקצה העליון של הכרטיס שעולה עליו: כשהחדש נעצר, הקודם נעלם לגמרי (גם אם הוא גבוה יותר)
    const cover = () => steps.forEach((s, i) => { const n = steps[i + 1]; const d = n ? s.getBoundingClientRect().bottom - n.getBoundingClientRect().top : 0; s.style.clipPath = d > 0 ? 'inset(0 0 ' + d.toFixed(1) + 'px 0)' : ''; });
    if (car) { let fr = 0; addEventListener('scroll', () => { fr = fr || requestAnimationFrame(() => { fr = 0; pick(); cover(); }); }, { passive: true }); }
    if (reduce) { show(0); if (!car) bars.forEach(b => { b.style.transform = 'scaleX(1)'; }); }
    else {
      // הכניסה: הפסל נבנה. הבסיס עולה, האמצע נוחת עליו, וקודקוד הזהב יורד אחרון ונשאר לרחף בעדינות. המקטעים למטה עולים אחריו
      gsap.set(pair(0), { y: 120, autoAlpha: 0 });
      gsap.set(pair(1), { y: -150, autoAlpha: 0 });
      gsap.set(pair(2), { y: -260, rotation: -6, autoAlpha: 0 });
      const inc = car ? track : $('.gt__inc', gt);   // במובייל הכרטיסים עולים במקום עמודת התוויות
      gsap.set([...segs, inc], { autoAlpha: 0, y: 20 });
      ScrollTrigger.create({ trigger: gt, start: car ? 'top 70%' : 'top 45%', once: true, onEnter: () => {
        gsap.to(pair(0), { y: 0, autoAlpha: 1, duration: 1.3, ease: 'expo.out' });
        gsap.to(pair(1), { y: 0, autoAlpha: 1, duration: 1.2, delay: .3, ease: 'back.out(1.2)' });
        gsap.to(pair(2), { y: 0, rotation: 0, autoAlpha: 1, duration: 1.4, delay: .6, ease: 'back.out(1.5)', onComplete: () => gsap.to(pair(2), { y: -9, duration: 2.8, yoyo: true, repeat: -1, ease: 'sine.inOut' }) });
        gsap.to(inc, { autoAlpha: 1, y: 0, duration: 1, delay: .5, ease: 'expo.out' });
        gsap.to(segs, { autoAlpha: 1, y: 0, duration: 1, stagger: .12, delay: .7, ease: 'expo.out', clearProps: 'opacity,visibility,transform' });
        gsap.delayedCall(.9, () => { if (car) { carReady = true; pick(); } else if (on < 0) show(0); });
      } });
      if (!car) {
        st = ScrollTrigger.create({ trigger: gt, start: 'top top', end: () => '+=' + Math.round(innerHeight * 1.8), pin: true, invalidateOnRefresh: true,
          onUpdate: s => { const p = s.progress; bars.forEach((b, k) => { b.style.transform = 'scaleX(' + clamp(p * 2 + 1 - k).toFixed(3) + ')'; }); if (on >= 0 || p > 0) show(p < .25 ? 0 : p < .75 ? 1 : 2); } });
        // גלילה אחת = שלב אחד. כשמגיעים לאזור כבר רואים את שלב 1, ולכן הגלילה הראשונה עוברת לשלב 2.
        // אחרי השלישי, עוד גלילה אחת עוברת ל"שורה תחתונה"
        stepper(st, 3, null, () => { const nx = ScrollTrigger.getById('sum2'); return nx ? nx.start : st.end + innerHeight; });
      }
    }
  }

  // ================= 2. שורה תחתונה (גרסה 18): חשבון של מילים =================
  // מגיעים לאזור והחשבון נבנה לבד: כל שורה נכנסת עם הפלוס שלה, אחת אחרי השנייה, ואז "=" נמתח,
  // מילות התוצאה עולות, וחלון התמונה של המשפחה נפתח באמצע המשפט. בסוף "וא(ע)ושר משפחתי".
  // עצירה אחת בלבד (לא שלב לכל שורה כמו במשולש הזהב): גלילה למטה ממשיכה לרפי, גלילה למעלה חוזרת למשולש
  const sum2 = $('.sum2');
  if (sum2) {
    const rows = $$('.sum2__row', sum2), ops = $$('.sum2__op', sum2), eq = $('.sum2__eq', sum2), words = $$('.sum2__w', sum2),
      pic = $('.sum2__pic', sum2), picImg = $('.sum2__pic img', sum2), sub = $('.sum2__sub', sum2);
    if (reduce) sum2.classList.add('is-done');
    else {
      gsap.set(rows, { autoAlpha: 0, y: 26 * U() });
      gsap.set(ops, { scale: 0, rotate: -90 });
      gsap.set(eq, { autoAlpha: 0, scaleX: 0 });
      gsap.set(words, { autoAlpha: 0, y: 44 * U() });
      gsap.set(pic, { clipPath: 'inset(0% 50% 0% 50%)' });
      gsap.set(picImg, { scale: 1.35 });
      gsap.set(sub, { autoAlpha: 0, y: 26 * U() });
      const tl = gsap.timeline({ paused: true, onComplete: () => sum2.classList.add('is-done') });
      rows.forEach((r, k) => {
        const at = .1 + k * .5;
        tl.to(r, { autoAlpha: 1, y: 0, duration: .7, ease: 'power3.out' }, at)
          .to(ops[k], { scale: 1, rotate: 0, duration: .6, ease: 'back.out(2.2)' }, at + .05);
      });
      tl.to(eq, { autoAlpha: 1, scaleX: 1, duration: .55, ease: 'power3.out' }, 1.7)
        .to(words, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .14 }, 2)
        .to(pic, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.inOut' }, 2.15)
        .to(picImg, { scale: 1, duration: 1.6, ease: 'power2.out' }, 2.15)
        .to(sub, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out' }, 2.7);
      // החשבון נסגר כשהאזור כמעט כולו במסך (גם כשמגיעים בגלילה רגילה)
      ScrollTrigger.create({ trigger: sum2, start: mobile() ? 'top 60%' : 'top 30%', once: true, onEnter: () => tl.play() });
      if (!mobile()) {
        const st = ScrollTrigger.create({ id: 'sum2', trigger: sum2, start: 'top top', end: 'top top' });
        // גלילה למטה לפני שהחשבון נסגר: רק מזרזת אותו (כדי שלא יפספסו את התוצאה). אחרי שנסגר: עוברת לרפי, ממורכז מתחת להדר
        stepper(st, 1, () => { const g = ScrollTrigger.getAll().find(s => s.pin && s.trigger === $('.gt')); return g ? g.end : st.start - innerHeight; }, () => {
          if (tl.progress() < .8) { tl.play(); tl.timeScale(2.6); return null; }
          const w = $('.who'); if (!w) return st.start + innerHeight;
          const y = window.lenis ? window.lenis.scroll : scrollY, r = w.getBoundingClientRect(), hh = $('.site-header')?.offsetHeight || 0, room = innerHeight - hh;
          return Math.round(r.height < room ? y + r.top - hh - (room - r.height) / 2 : y + r.top - hh);
        });
      }
    }
  }

  // אזור שנכנס כולו במסך: כשמגיעים אליו הוא ננעל במרכז המסך לרגע (נעיצה קצרה), וכשהגלילה נעצרת קרוב אליו
  // (רואים אותו חתוך מלמעלה או מלמטה) המסך נאסף אליו ברכות, כך שתמיד רואים אותו שלם
  const holds = [];
  const holdSection = (el, len = .55) => {
    if (!el || reduce || mobile()) return null;
    const st = ScrollTrigger.create({ trigger: el, start: 'center center', end: () => '+=' + Math.round(innerHeight * len), pin: true, invalidateOnRefresh: true });
    holds.push(st);
    return st;
  };
  if (!reduce) {
    let tm = 0, gliding = false;
    const settle = () => {
      if (gliding || !window.lenis) return;
      const y = window.lenis.scroll, H = innerHeight;
      for (const st of holds) {
        let to = null;
        if (y > st.start - H * .36 && y < st.start - 2) to = st.start + 2;          // מגיעים מלמעלה ונעצרים כשהוא חתוך למטה
        else if (y > st.end + 2 && y < st.end + H * .18) to = st.end - 2;           // יוצאים למטה ונעצרים כשהוא חתוך למעלה
        if (to !== null) { gliding = true; window.lenis.scrollTo(to, { duration: .7, easing: t => 1 - Math.pow(1 - t, 3), onComplete: () => { gliding = false; } }); setTimeout(() => { gliding = false; }, 900); return; }
      }
    };
    const hook = () => window.lenis && window.lenis.on('scroll', () => { clearTimeout(tm); tm = setTimeout(settle, 160); });
    window.lenis ? hook() : addEventListener('load', hook);
  }

  // ================= 3. מי אנחנו: השם בענק זז כל הזמן מאחור, רפי עולה מלמטה וכרטיס השם צף לידו =================
  const who = $('.who');
  if (who) {
    const photo = $('.who__photo', who), giant = $('.who__giant', who), gtxt = $('.who__track span', who), wbtn = $('.who__text .btn', who), wtext = $('.who__text', who);
    dotField($('.dotfield', who), { base: .11, hover: .2, swell: .5, push: 10, ellipse: (W, H) => {
      if (mobile()) return { cx: W * .5, cy: H * .72, rx: W * .49, ry: H * .3 };
      return { cx: photo.offsetLeft + photo.offsetWidth / 2, cy: photo.offsetTop + photo.offsetHeight * .45, rx: photo.offsetWidth * 1.05, ry: photo.offsetHeight * .75 };
    } });
    // מודדים את האותיות עצמן (לא את תיבת השורה): כמה רווח יש מעל הראש שלהן, ומה הגובה שלהן מעל קו הבסיס
    const placeGiant = () => {
      if (mobile()) { giant.classList.remove('is-placed'); giant.style.top = ''; who.style.removeProperty('--over'); return; }
      const cs = getComputedStyle(gtxt), fs = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight) || fs;
      const c = document.createElement('canvas').getContext('2d'); c.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
      const m = c.measureText(gtxt.textContent);
      const half = (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
      const capTop = half + m.fontBoundingBoxAscent - c.measureText('מ').actualBoundingBoxAscent;   // לפי גובה גוף האות (מ), לא לפי ה-ל שבולטת מעל
      who.style.setProperty('--over', Math.max(0, Math.round(m.actualBoundingBoxAscent - wbtn.offsetHeight)) + 'px');
      giant.style.top = Math.round(wtext.offsetTop + wbtn.offsetTop - capTop) + 'px'; giant.classList.add('is-placed');
    };
    placeGiant(); addEventListener('resize', () => requestAnimationFrame(placeGiant)); document.fonts && document.fonts.ready.then(placeGiant);
    ScrollTrigger.addEventListener('refreshInit', placeGiant);
  }
  if (who && !reduce) {
    const img = $('.who__photo img', who), card = $('.who__card', who);
    gsap.set(img, { yPercent: 16, autoAlpha: 0 });
    gsap.set(card, { autoAlpha: 0, y: 30, clipPath: 'inset(0% 0% 100% 0%)' });
    ScrollTrigger.create({ trigger: $('.who__photo', who), start: 'top 88%', once: true, onEnter: () => {
      gsap.to(img, { yPercent: 0, autoAlpha: 1, duration: 1.8, ease: 'expo.out' });
      gsap.to(card, { autoAlpha: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, delay: .8, ease: 'expo.out' });
    } });
  }

  // בלי נעיצה: היא יצרה תחושת תקיעות (לבקשת צביה). מגיעים לאזור בגלילה אחת מ"שורה תחתונה", ומשם גוללים רגיל

  // ================= 4. למי זה מתאים: 95% שהופך ל-5%, על רקע נקודות עדין, ומספרים מתגלגלים =================
  const match = $('.match');
  if (match) {
    dotField($('.dotfield', match), { base: .07, hover: .1, swell: .25, push: 8, ellipse: (W, H) => ({ cx: W * .5, cy: H * .5, rx: W * .49, ry: H * .47 }) });
    const nine = $('.match__nine', match), a = $('.match__a', match), b = $('.match__b', match);
    if (reduce) { gsap.set(a, { autoAlpha: 0 }); gsap.set(b, { autoAlpha: 1 }); }
    else {
      // 95% נשאר כשתי שניות, הופך ל-5% שנשאר כשלוש, וחוזר. כך רואים את שני המשפטים, והניגוד ביניהם הוא המסר
      gsap.set(b, { autoAlpha: 0, y: 16 });
      const tl = gsap.timeline({ paused: true, repeat: -1, yoyo: true, defaults: { ease: 'power3.inOut' } })
        .to({}, { duration: 1.1 })
        // ה-9 נופל באותו רגע שהמשפט כולו מתחלף: אף פעם לא רואים '5%' עם המשפט של ה-95%
        .to(nine, { yPercent: 70, opacity: 0, duration: .5 }, 1.1)
        .to(a, { autoAlpha: 0, y: -16, duration: .5 }, 1.15)
        .to(b, { autoAlpha: 1, y: 0, duration: .6 }, 1.45)
        .to({}, { duration: 1.9 });
      ScrollTrigger.create({ trigger: match, start: 'top 70%', end: 'bottom 20%', onToggle: s => s.isActive ? tl.play() : tl.pause() });
    }
    $$('[data-roll]', match).forEach(el => {
      const txt = el.textContent.trim();
      const box = document.createElement('span'); box.className = 'roll'; box.setAttribute('aria-hidden', 'true');
      const strips = [];
      [...txt].forEach(c => {
        if (/\d/.test(c)) {
          const d = document.createElement('span'); d.className = 'rd';
          const s = document.createElement('span'); s.className = 'rd__s';
          s.innerHTML = Array.from({ length: 20 }, (_, k) => '<span>' + (k % 10) + '</span>').join('');
          d.appendChild(s); box.appendChild(d); strips.push({ s, n: +c });
        } else { const t = document.createElement('span'); t.textContent = c; box.appendChild(t); }
      });
      const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = txt;
      el.replaceChildren(sr, box);
      const to = x => -(10 + x.n) * 5;
      if (reduce) { strips.forEach(x => gsap.set(x.s, { yPercent: to(x) })); return; }
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => strips.forEach((x, i) => gsap.fromTo(x.s, { yPercent: 0 }, { yPercent: to(x), duration: 2.1 + i * .12, delay: i * .05, ease: 'expo.out' })) });
    });
    rise($$('.stat__box', match), $('.match__stats', match), { y: 40, stagger: .1, start: 'top 90%' });
    // בדיקה עצמית: כל תנאי שמסמנים נספר, ובשלושה מתוך שלושה הכפתור מזמין לפגישה
    const boxes = $$('.stat__in', match), sn = $('.match__sn', match), stx = $('.match__st', match), ct = $('.match__ct', match);
    const score = () => {
      const n = boxes.filter(b => b.checked).length;
      boxes.forEach(b => b.closest('.stat').classList.toggle('is-checked', b.checked));
      match.classList.toggle('is-fit', n === 3);
      ct.textContent = n === 3 ? 'מעולה! בואו נקבע שיחת היכרות' : 'חושבים שאתם מתאימים? בדקו עכשיו';
      // ההערה: נכנסת אחרי הסימון הראשון, והטקסט מתחלף בעדינות בכל סימון
      if (note) {
        note.classList.toggle('is-on', n > 0);
        if (n > 0) {
          const put = () => { noteN.textContent = n + '/3'; noteT.textContent = NOTES[n]; };
          if (reduce || !note.dataset.n) put();
          else gsap.timeline().to([noteN, noteT], { autoAlpha: 0, y: -8, duration: .2, ease: 'power2.in' }).add(put).fromTo([noteN, noteT], { y: 8 }, { autoAlpha: 1, y: 0, duration: .35, ease: 'power3.out' });
          note.dataset.n = n;
        } else delete note.dataset.n;
      }
    };
    const note = $('.match__note', match), noteN = $('.match__note-n', match), noteT = $('.match__note-t', match);
    const NOTES = ['', 'תנאי אחד מתוך שלושה. ממשיכים לבדוק?', 'עוד תנאי אחד, ואתם שם', 'יופי! יש לכם את שלושת התנאים להצטרף לתוכנית'];
    boxes.forEach(b => b.addEventListener('change', score));
  }

  // ================= 5. לכל אורך הדרך: חלון קטן של הדרך נפתח למסך מלא, ואז הטקסט =================
  const road2 = $('.road2');
  if (road2) {
    if (match && !reduce) {
      ScrollTrigger.create({ trigger: match, start: 'bottom bottom', end: () => '+=' + Math.round(innerHeight * (mobile() ? 1.5 : 1.6)), pin: true, pinSpacing: false });
      if (!mobile()) snapCover(road2);   // במגע הגלישה האוטומטית נלחמה באצבע: במובייל המסך עולה פשוט עם הגלילה
    }
    const win = $('.road2__win', road2), img = $$('video, img', win), shade = $('.road2__shade', road2);
    // סרטון הזריחה: נטען רק כשמתקרבים, ומתחיל לנוע ברגע שהחלון נפתח
    const vid = $('video', win);
    let vids = [], vOn = false, vCur = 0, vTick = 0;
    if (vid && !reduce) {
      const v2 = vid.cloneNode(); vid.after(v2); vids = [vid, v2];
      ScrollTrigger.create({ trigger: road2, start: 'top bottom+=100%', once: true, onEnter: () => vids.forEach(v => { v.src = v.dataset.src; v.load(); }) });
    }
    const media = $$('video, img', win);   // כולל הסרטון המשוכפל, כדי ששניהם יהיו באותו גודל
    const vStart = v => { v.playbackRate = .9; v.currentTime = 0; const p = v.play(); p && p.catch(() => {}); };
    const vLoop = () => {
      if (!vOn) return;
      const a = vids[vCur], b = vids[1 - vCur];
      // שנייה וחצי לפני הסוף: הנגן השני מתחיל מההתחלה ונכנס ברכות מעל הראשון
      if (a.duration && a.currentTime > a.duration - 1.5 && b.paused) {
        vStart(b); gsap.fromTo(b, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power1.inOut', onComplete: () => { a.pause(); gsap.set(a, { opacity: 0 }); vCur = 1 - vCur; b.style.zIndex = 1; a.style.zIndex = 0; } });
      }
      vTick = requestAnimationFrame(vLoop);
    };
    const vPlay = () => { if (!vids.length) return; vOn = true; vCur = 0; gsap.set(vids[0], { opacity: 1 }); gsap.set(vids[1], { opacity: 0 }); vids[0].style.zIndex = 1; vids[1].style.zIndex = 0; vids[1].pause(); vStart(vids[0]); cancelAnimationFrame(vTick); vTick = requestAnimationFrame(vLoop); };
    if (vid && !reduce) new IntersectionObserver(es => es.forEach(en => {
      // מחוץ למסך: הסרטון והלולאה שבודקת אותו עוצרים לגמרי
      if (!en.isIntersecting) { vids.forEach(v => v.pause()); cancelAnimationFrame(vTick); }
      else if (vOn) { const p = vids[vCur].play(); p && p.catch(() => {}); cancelAnimationFrame(vTick); vTick = requestAnimationFrame(vLoop); }
    })).observe(road2);
    const vStop = () => { vOn = false; cancelAnimationFrame(vTick); vids.forEach(v => { v.pause(); v.currentTime = 0; }); };
    const words = splitWords($('.road2__lead', road2)), stat = $('.road2__stat', road2), en = $('.road2__en', road2), cnt = $('.road2__count', road2);
    const rtitle = $('.road2__title', road2);
    // במובייל החלון הקטן מתחיל ממש מתחת לכותרת (בכל גובה מסך), כך שרואים בו את הבית בקצה המזח ולא רק מים, והכותרת לא יושבת עליו
    const winM = () => { const s = $('.road2__stage', road2).getBoundingClientRect(), t = rtitle.getBoundingClientRect(); return 'inset(' + clamp((t.bottom - s.top + 26) / s.height * 100, 28, 52).toFixed(1) + '% 12% 11% 12%)'; };
    const fitEn = () => { if (mobile()) { en.style.width = ''; return; } const r = document.createRange(); r.selectNodeContents(rtitle); en.style.width = Math.round(r.getBoundingClientRect().width) + 'px'; };
    fitEn(); addEventListener('resize', () => requestAnimationFrame(fitEn)); document.fonts && document.fonts.ready.then(fitEn);
    let filled = -1;
    const fill = n => { if (n === filled) return; filled = n; cnt.textContent = n; };
    if (reduce) { gsap.set(win, { clipPath: 'inset(0% 0% 0% 0%)' }); gsap.set(media, { scale: 1 }); gsap.set(shade, { opacity: 1 }); fill(50); }
    else {
      gsap.set(words, { autoAlpha: 0, y: 26 });
      gsap.set([stat, en], { autoAlpha: 0, y: 30 });
      const o = { v: 0 };
      const tl = gsap.timeline({ defaults: { ease: 'none' } })
        .fromTo(win, { clipPath: () => mobile() ? winM() : 'inset(42% 35% 10% 35%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power2.inOut' }, 0)
        .fromTo(media, { scale: 1.1 }, { scale: 1, duration: 2, ease: 'sine.out' }, 0)   // זום עדין ואחיד לאורך כל הפתיחה
        .to({}, { duration: .01, onStart: vPlay, onReverseComplete: vStop }, .05)
        .to(shade, { opacity: 1, duration: .6 }, .7)
        .to({}, linesAt(words), 1.15)
        .to(stat, { autoAlpha: 1, y: 0, duration: .4, ease: 'power3.out' }, 1.55)
        .fromTo(o, { v: 0 }, { v: 50, duration: .9, ease: 'power1.inOut', onUpdate: () => fill(Math.round(o.v)) }, 1.65)
        .to(en, { autoAlpha: 1, y: 0, duration: .4, ease: 'power3.out' }, 1.4)
        .to({}, { duration: .7 });
      pin(road2, tl, () => 1.8);
    }
  }

  // ================= 6. המלצות: דיוקן עגול מעל ציטוט ארוך, ורצועת פנים שמתנפחת מתחת לעכבר =================
  // ההמלצות האמיתיות (שם פרטי ומקצוע). התמונות זמניות עד שיגיעו התמונות מהסרטונים
  const PEOPLE = [{"n":"שעיה","r":"מתווך","q":"הגעתי עם בלבול וחוסר סדר. היה לי הון ולא ידעתי מה לעשות איתו, וגם אני ואשתי לא תמיד חשבנו אותו דבר. ברגע שהבנתי שיש כאן אנשי מקצוע שמטפלים בכל העניין הכלכלי של המשפחה מקצה לקצה — מהתקציב ועד הפנסיות והנדל\"ן — הדברים התחילו להתחבר. תוך חודשיים כבר ממש הייתה בהירות. היום תיק הנכסים שלנו גדל משמעותית, והפן הכלכלי מסודר. יש לי רוגע מטורף ואני יודע שהכסף עובד. המלצתי על 5M אפילו לאבא שלי ולחבר קרוב, ואני לא ממליץ סתם."},
    {"n":"קותי","r":"קבלן","q":"הייתה לי דירה, משכנתא קטנה והכנסה מסודרת, אבל לא היה לי תיק נכסים. מאוד רציתי, פשוט לא היה לי האומץ לעשות זאת בלי מישהו שיודע איך מנהלים את זה. הייתי בצמיחה מאוד איטית, והיום עברתי לצמיחה גבוהה. תיק הנכסים שלנו הגיע לסדר גודל של כ־9 מיליון שקל. מבחינתי זה כמו לנטוע עץ — לא מחכים לפירות אחרי יומיים, מסתכלים לטווח ארוך. והאנשים? אנשים מקסימים וטובים שבאים לעבוד."},
    {"n":"דוד","r":"מהנדס תוכנה","q":"שנים ידעתי שאני צריך לעשות משהו, אבל תמיד היו תירוצים. בשלב מסוים הבנתי שהשעון מתקתק ושצריך לחצות את הכביש — וחציתי. היום יש לי רוגע וביטחון לקראת חתונות הילדים והפנסיה. כשאתה מתעסק בנכסים בהיקף של מיליונים, אתה משחק בעתיד שלך. בדיוק כמו שלא הייתי מטפל בעצמי בבעיה רפואית, גם כאן אני הולך למי שמבין. תשקיעו במי שזו המומחיות שלו."},
    {"n":"ריקי","r":"אופטומטריסטית","q":"אני בן אדם מאוד שקול ולא אוהבת לקחת סיכונים. חשוב לי לדעת מאיפה אני יוצאת ולאן אני מגיעה. בדיוק בשביל זה רציתי לעשות תהליך עם מישהו שמבין מה מתאים ונכון לנו. היום אני יודעת בדיוק מה אנחנו מכניסים, מוציאים ומה אפשר להשקיע. זה שיפר לי את איכות החיים ונתן לי הרבה רוגע. מבחינתי, הדבר הכי משמעותי הוא להרגיש שאני עושה את זה עם מישהו שאני יכולה לסמוך עליו — ולא בעיניים עצומות."},
    {"n":"נחום","r":"מנכ״ל <bdi lang=\"en\">MAOR K</bdi>","q":"השנים חולפות, הילדים גדלים. לא עשיתי שום דבר בשבילם. חמש עשרה שנה נשמעות הרבה, אבל במונחים של השקעות זה מעט. התהליך פתח לי את הראש לחשוב לטווח ארוך, להבין השקעות ואיך כסף עובד. יש יתרון עצום במקום אחד שנותן לך הכול — ניהול כלכלי, פיננסים ונדל״ן. זה ממש <bdi lang=\"en\">One Stop Shop</bdi>. בדיעבד אתה אומר לעצמך: אם רק הייתי יודע את הדברים האלה כשהייתי זוג צעיר."},
    {"n":"הדר","r":"מתווכת","q":"עבדנו מאוד קשה, אבל חיינו את היום ולא באמת בנינו את המחר. בעקבות התהליך שינינו את כל המבנה הפיננסי שלנו, והיום הכסף שאנחנו עובדים עליו הולך לנכסים ולבניית העתיד. לפני כן היינו שווים בערך 3.5 מיליון שקל, והיום סביב 9.5 מיליון — ואנחנו עדיין גרים באותו בית. מעבר למספרים, יש לי שקט. אני יודעת איך נוכל לעזור לילדים שלנו בעתיד, ותחושה שעשינו משהו אחראי וטוב עבור המשפחה."},
    {"n":"נתנאל","r":"קבלן","q":"עבדנו מאוד מאוד קשה, הרווחנו כסף ופשוט לא ידענו לאן הוא הולך. זה היה מתסכל. 5M הראו לנו איך לגרום לכסף להיות מושקע ולא להתפזר. שינינו את כל המבנה הפיננסי והעסקי שלנו, והיום יש לנו תיק נכסים של קרוב ל־9 מיליון שקל. התחושה היום אחרת לגמרי: הכסף מושקע, הוא לא עף ברוח, ויש הרבה יותר רוגע וחופש. אם צריך לסכם במשפט: <bdi lang=\"en\">Jump in. Do it. You’re in safe hands.</bdi>"},
    {"n":"יוסף","r":"עובד סוציאלי","q":"היו לי חצי מיליון עד שש מאות אלף שקל שהיו תקועים בתוך קירות. ידעתי שאני רוצה להשקיע, אבל הבנתי שאני לא באמת יודע איך עושים את זה נכון. היום עברתי מעולם של מחשבות לעולם של עשייה — יש לי נכס שעובד, התזרים השתפר ואנחנו חוסכים לנכס הבא. כל אנשי המקצוע בדרך היו ברמה גבוהה מאוד. הייתי ממליץ חד־משמעית. ליווי מדהים, יחס מטורף, עם תוצאות מקצועיות ביותר. באמת, לדעתי זה מיוחד מאוד, נדיר בשוק היום."},
    {"n":"מיכל","r":"תרפיסטית","q":"לפני התהליך הרגשנו תקועים ומבולבלים. חשבנו שאנחנו באים רק לקנות עוד נכס, ופתאום קיבלנו מענה רחב לכל המשפחה, פנסיה, מימון, נדל״ן וכל התמונה הכלכלית. הרגשנו עטופים מכל הכיוונים ובידיים טובות. היום התחושה היא שאנחנו בשליטה: אנחנו מנהלים ולא מנוהלים. יש לנו בסיס, יש לנו על מה להישען ויש לנו עתיד. ובעיניי גם הדברים הקטנים אומרים הכול, אפילו זכרו איזה קפה אנחנו אוהבים ואת הסוכרזית שלי."}];
  const voices = $('.voices'), vs = $('[data-voices]'), film = $('.voices__film');
  if (vs && film) {
    dotField($('.dotfield', voices), { color: '245,245,245', base: .06, hover: .16, swell: .5, push: 10, ellipse: (W, H) => ({ cx: W * .5, cy: H * .5, rx: W * .49, ry: H * .47 }) });
    const face = $('.voices__face', vs), nameEl = $('.voices__name', vs), qp = $('.voices__quote p', vs);
    vs.id = 'voices-panel'; vs.setAttribute('role', 'tabpanel');
    // תמונות זמניות מהתמונות שכבר יש באתר, עד שיגיעו התמונות האמיתיות מהסרטונים
    // התמונות האמיתיות מהסרטונים (לפי השמות ששלחו בוואטסאפ). למי שעוד אין תמונה: תמונה זמנית
    const PHOTO = { 'שעיה': 'shaya', 'קותי': 'kuti', 'דוד': 'david', 'ריקי': 'riki', 'נחום': 'nachum', 'הדר': 'hadar', 'נתנאל': 'netanel', 'יוסף': 'yosef', 'מיכל': 'michal' };
    const pic = i => PHOTO[PEOPLE[i].n] ? 'assets/voice-' + PHOTO[PEOPLE[i].n] + '.webp' : 'assets/client-' + pad(i + 1) + '.webp';
    film.innerHTML = PEOPLE.map((p, i) => '<button class="vthumb" type="button" role="tab" aria-selected="false" aria-controls="voices-panel" aria-label="ההמלצה של ' + p.n + '"><img src="' + pic(i) + '" alt="" loading="lazy" decoding="async"><i aria-hidden="true"></i></button>').join('');
    const playBtn = $('.voices__play', vs);
    // גובה קבוע לציטוט, לפי הארוך ביותר ברוחב הנוכחי: כשמתחלפת המלצה שום דבר מתחתיה לא קופץ
    const qbox = $('.voices__quote', vs);
    const measure = () => { const m = qp.cloneNode(); m.style.cssText = 'position:absolute;visibility:hidden;left:0;right:0;'; qbox.appendChild(m);
      let h = 0; PEOPLE.forEach(p => { m.innerHTML = p.q; h = Math.max(h, m.offsetHeight); }); m.remove(); qbox.style.setProperty('--qh', h + 'px'); };
    measure(); addEventListener('resize', () => requestAnimationFrame(measure)); document.fonts && document.fonts.ready.then(measure);
    const thumbs = $$('.vthumb', film), bars = thumbs.map(t => $('i', t));
    let cur = -1, prog = null, hover = false, inView = false;
    const centerThumb = k => {
      if (film.scrollWidth <= film.clientWidth + 2) return;
      const fr = film.getBoundingClientRect(), tr = thumbs[k].getBoundingClientRect();
      film.scrollBy({ left: (tr.left + tr.width / 2) - (fr.left + fr.width / 2), behavior: reduce ? 'auto' : 'smooth' });
    };
    // ההתמוססות בקצה השמאלי היא רמז שיש עוד פנים. כשמגיעים לסוף הרצועה היא נעלמת, כדי שהפנים האחרונות לא ייראו דהויות
    const filmEdge = () => film.classList.toggle('is-end', Math.abs(film.scrollLeft) >= film.scrollWidth - film.clientWidth - 4);
    film.addEventListener('scroll', filmEdge, { passive: true }); filmEdge();
    const sync = () => { if (prog) (inView && !hover && document.visibilityState === 'visible') ? prog.resume() : prog.pause(); };
    const run = () => {
      if (prog) prog.kill();
      gsap.set(bars, { scaleX: 0 });
      if (reduce) return;
      // זמן קריאה לפי האורך: בערך שלוש מילים בשנייה, ולא פחות מ-10 שניות
      prog = gsap.fromTo(bars[cur], { scaleX: 0 }, { scaleX: 1, duration: Math.max(10, PEOPLE[cur].q.split(' ').length / 3), ease: 'none', onComplete: () => go((cur + 1) % thumbs.length) });
      sync();
    };
    const go = (i, focus) => {
      if (i === cur) return;
      const first = cur < 0; cur = i;
      thumbs.forEach((t, k) => { t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; gsap.to(t, { '--b': k === i ? 1.3 : 1, duration: reduce ? 0 : .55, ease: 'power3.out', overwrite: 'auto' }); });
      if (focus) thumbs[i].focus();
      // בטלפון הרצועה נגללת הצידה: הפנים הפעילות מגיעות לאמצע (אחרי שהתנפחו), בלי להזיז את העמוד עצמו
      if (!first) gsap.delayedCall(reduce ? 0 : .6, () => centerThumb(i));
      // הדיוקן העגול: החדש נכנס מעל הקודם
      const im = new Image(); im.src = pic(i); im.alt = ''; im.decoding = 'async';
      face.appendChild(im);
      const olds = $$('img', face).filter(x => x !== im);
      if (first || reduce) olds.forEach(o => o.remove());
      else gsap.fromTo(im, { autoAlpha: 0, scale: 1.25 }, { autoAlpha: 1, scale: 1, duration: .9, ease: 'expo.out', onComplete: () => olds.forEach(o => o.remove()) });
      const put = () => {
        nameEl.innerHTML = '<b>' + PEOPLE[i].n + '</b> · <span class="voices__role">' + PEOPLE[i].r + '</span>';
        qp.innerHTML = PEOPLE[i].q;
        playBtn.setAttribute('aria-label', 'תציץ בפנים: העדות המלאה של ' + PEOPLE[i].n);
        if (reduce) return;
        const w = splitWords(qp);
        gsap.set([qp, nameEl], { autoAlpha: 1, y: 0 });
        gsap.set(w, { autoAlpha: 0, y: 26 });
        if (first) { qp._w = w; return; }
        playLines(w);
        gsap.fromTo(nameEl, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .7, delay: .3, ease: 'power3.out' });
      };
      if (first || reduce) put();
      else gsap.to([qp, nameEl], { autoAlpha: 0, y: -14, duration: .35, ease: 'power2.in', onComplete: put });
      run();
    };
    thumbs.forEach((t, k) => t.addEventListener('click', () => go(k)));
    // החלקה על ההמלצה עצמה בטלפון: ימינה = הבאה (כמו הרצועה, שממשיכה שמאלה), שמאלה = הקודמת. גלילה אנכית לא נחסמת
    let sx = null, sy = 0;
    vs.addEventListener('touchstart', e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
    vs.addEventListener('touchend', e => {
      if (sx === null) return; const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      go((cur + (dx > 0 ? 1 : -1) + thumbs.length) % thumbs.length);
    }, { passive: true });
    film.addEventListener('keydown', e => {
      const d = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0; if (!d) return;
      e.preventDefault(); go((cur + d + thumbs.length) % thumbs.length, true);
    });
    let centers = [];
    const qz = thumbs.map(t => gsap.quickTo(t, '--z', { duration: .32, ease: 'power3.out' }));
    film.addEventListener('mouseenter', () => { hover = true; sync(); centers = thumbs.map(t => { const r = t.getBoundingClientRect(); return r.left + r.width / 2; }); });
    film.addEventListener('mousemove', e => {
      if (mobile() || reduce) return;
      const R = Math.max(120, thumbs[0].offsetWidth * 2.8);
      thumbs.forEach((t, k) => { const f = clamp(1 - Math.abs(e.clientX - centers[k]) / R); qz[k](f * f * (3 - 2 * f)); });
    });
    film.addEventListener('mouseleave', () => { hover = false; sync(); qz.forEach(q => q(0)); });
    vs.addEventListener('mouseenter', () => { hover = true; sync(); });
    vs.addEventListener('mouseleave', () => { hover = false; sync(); });
    document.addEventListener('visibilitychange', sync);
    ScrollTrigger.create({ trigger: vs, start: 'top 85%', end: 'bottom 15%', onToggle: s => { inView = s.isActive; sync(); } });
    go(0);
    if (!reduce) {
      gsap.set([face, nameEl, playBtn], { autoAlpha: 0, y: 20 });
      gsap.set(thumbs, { autoAlpha: 0, y: 40 });
      ScrollTrigger.create({ trigger: vs, start: 'top 82%', once: true, onEnter: () => {
        gsap.to(face, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out' });
        gsap.delayedCall(.25, () => qp._w && playLines(qp._w));
        gsap.to([nameEl, playBtn], { autoAlpha: 1, y: 0, duration: .8, delay: .7, stagger: .12, ease: 'power3.out' });
        gsap.to(thumbs, { autoAlpha: 1, y: 0, duration: 1, stagger: { each: .04, from: 'center' }, delay: .4, ease: 'expo.out' });
      } });
      gsap.fromTo($('.voices__mark', voices), { yPercent: 18 }, { yPercent: -12, ease: 'none', scrollTrigger: { trigger: voices, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    }
  }

  // בלי נעיצה גם כאן: אותה תחושת תקיעות (לבקשת צביה)

  // ================= 7. שלושת המצבים: ערימה אחת במרכז שנפתחת לשורה מסודרת, ואז המפנה: הכרטיסים נסוגים
  // והמשפט "עד שהן החליטו לקחת אחריות..." עולה עם זריחה, כהמשך ישיר של הכותרת, ומוביל אל 12 התוצאות =================
  const peak = $('.peak');
  if (peak) {
    const cards = $$('.case', peak), cases = $('.cases', peak);
    const toCenter = c => c.parentElement.offsetWidth / 2 - (c.offsetLeft + c.offsetWidth / 2);   // בלי השפעת התנועה עצמה
    if (!reduce && !mobile()) {
      const START = [.15, .42, .69];   // 01 יוצא ימינה, 02 נשאר במרכז, 03 יוצא שמאלה
      const SPIN = [7, -4, -8];          // כמה כל כרטיס מסתובב באמצע הקשת
      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
      // בהתחלה: ערימה אחת מדויקת. רואים רק את הכרטיס הראשון
      cards.forEach((c, i) => {
        const inner = [$('.case__n', c), $('.case__name', c), $('.case__lead', c)];
        const sh = document.createElement('i'); sh.className = 'case__shine'; sh.setAttribute('aria-hidden', 'true'); c.appendChild(sh);
        const t = START[i];
        // התנועה הצידית, והקשת: הכרטיס עולה מעט באמצע הדרך ויורד למקום, מסתובב ומתיישר, וגדל לרגע
        tl.fromTo(c, { x: () => toCenter(c), y: 0, scale: 1, rotation: 0 }, { x: 0, duration: .9, immediateRender: true }, t)
          .to(c, { y: () => 46 * U(), rotation: SPIN[i], scale: 1.04, duration: .45, ease: 'power2.out' }, t)
          .to(c, { y: 0, rotation: 0, scale: 1, duration: .45, ease: 'power2.in' }, t + .45)
          .fromTo(sh, { xPercent: -120 }, { xPercent: 120, duration: .55, ease: 'power1.inOut' }, t + .7);
        // התוכן של הכרטיסים שמתחת לערימה נכנס רק כשהם נוחתים
      });
      tl.to({}, { duration: .5 });
      pin(peak, tl, () => 1.1);
      // עניין: כל כרטיס נוטה מעט אחרי העכבר, כמו כרטיס אמיתי ביד
      if (hoverable()) cards.forEach(c => {
        gsap.set(c, { transformPerspective: 1000 });
        const rx = gsap.quickTo(c, 'rotationX', { duration: .6, ease: 'power3' }), ry = gsap.quickTo(c, 'rotationY', { duration: .6, ease: 'power3' });
        c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height; ry((px - .5) * 10); rx(-(py - .5) * 8); c.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); c.style.setProperty('--my', (py * 100).toFixed(1) + '%'); });
        c.addEventListener('mouseleave', () => { rx(0); ry(0); });
      });
    } else if (!reduce) {
      // בטלפון: נטייה ותזוזה עדינות יותר, כדי שפינות הכרטיס לא ייצאו מהמסך, והכרטיס כבר ישר כשמגיעים לקרוא אותו
      const MESS = [-3, 2.5, 3.5];
      cards.forEach((c, i) => gsap.fromTo(c, { rotation: MESS[i], x: (i % 2 ? -1 : 1) * 16, scale: .96 },
        { rotation: 0, x: 0, scale: 1, ease: 'power2.out', scrollTrigger: { trigger: c, start: 'top 96%', end: 'top 64%', scrub: .6 } }));
    }
  }

  // ================= 8. המפנה: 12 תוויות זכוכית שנכנסות אחת אחרי השנייה, והתמונה מתקרבת לאט מאחוריהן =================
  const gain = $('.gain');
  if (gain && !reduce) {
    const tags = $$('.gtag', gain);
    gsap.set(tags, { autoAlpha: 0, y: 26, scale: .96 });
    ScrollTrigger.create({ trigger: $('.gain__tags', gain), start: 'top 86%', once: true, onEnter: () => gsap.to(tags, { autoAlpha: 1, y: 0, scale: 1, duration: .85, stagger: .06, ease: 'expo.out', clearProps: 'transform' }) });
  }

  // ================= 9. המסלולים ו-10. מרכז הידע: חשיפה =================
  rise($$('.trk'), '.tracks2__list', { y: 60, stagger: .12 });
  const tracks = $('.tracks2');
  if (tracks) dotField($('.dotfield', tracks), { color: '245,245,245', base: .06, hover: .16, swell: .5, push: 10, ellipse: (W, H) => ({ cx: W * .5, cy: H * .5, rx: W * .49, ry: H * .47 }) });
  // 10. מרכז הידע: אותן נקודות עדינות של ההמלצות
  const know = $('.know');
  if (know) dotField($('.dotfield', know), { color: '245,245,245', base: .06, hover: .16, swell: .5, push: 10, ellipse: (W, H) => ({ cx: W * .5, cy: H * .5, rx: W * .49, ry: H * .47 }) });
  if (!reduce) {
    const kc = $$('.know__img');
    if (kc.length) {
      gsap.set(kc, { clipPath: 'inset(100% 0% 0% 0%)' });
      ScrollTrigger.create({ trigger: '.know__cards', start: 'top 85%', once: true, onEnter: () => {
        gsap.fromTo(kc, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, stagger: .14, ease: 'expo.inOut' });
        gsap.fromTo(kc.map(k => $('img', k)), { scale: 1.25 }, { scale: 1, duration: 1.8, stagger: .14, ease: 'expo.out', clearProps: 'transform' });
      } });
    }
  }

  // ================= 11. הפוטר =================
  // השמש בתמונת הים: בדיוק בגובה הקצה התחתון של לוח הזכוכית, בכל גודל מסך (השמש נמצאת ב-55% מגובה התמונה)
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


  // ScrollTrigger מחשב את הנקודות לפי סדר היצירה: כל הכותרות והטקסטים נוצרו לפני הנעיצות שמעליהם,
  // ולכן הם הופעלו מוקדם מדי (לפני שרואים אותם). מסדרים לפי המיקום בעמוד ומחשבים מחדש
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  const onLoaded = () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); };
  document.readyState === 'complete' ? requestAnimationFrame(onLoaded) : addEventListener('load', onLoaded);
})();
