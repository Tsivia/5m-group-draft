/* עמוד המסלולים (tracks.html).
   אותה שפת תנועה של דף הבית: כותרות אות אחרי אות, טקסטים שורה אחרי שורה, גלילה חלקה (Lenis).
   1 פתיחה: נוף אחד, שלושה חלונות · 2 שלושת המסלולים בכרטיסים
   3 המשפטים מתחלפים ליד תמונת המשפחה · 4 תנאי הסף עם ההודעה של דף הבית · 5 סגירה עם הבלון · 6 התחילו בקטן (המזח) · פוטר */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => innerWidth <= 900;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const header = $('.site-header');

  // הלוגו הכהה להדר הבהיר (כמו בדף הבית)
  const logoA = header && $('.site-header__logo', header);
  if (logoA && !$('.logo-on-light', logoA)) { const im = document.createElement('img'); im.className = 'logo-on-light'; im.src = 'assets/logo-5m.svg'; im.alt = ''; im.setAttribute('aria-hidden', 'true'); logoA.appendChild(im); }

  /* ---------- תנאי הסף: עובד גם בלי אנימציות ---------- */
  const tc = $('.tc'), stats = $$('.tc .stat');
  const note = tc && $('.match__note', tc), noteN = tc && $('.match__note-n', tc), noteT = tc && $('.match__note-t', tc);
  const NOTES = ['', 'תנאי אחד מתוך שלושה. ממשיכים לבדוק?', 'עוד תנאי אחד, ואתם שם', 'יופי! יש לכם את שלושת התנאים להצטרף לתוכנית'];
  const syncFit = () => {
    let n = 0;
    stats.forEach(s => { const on = $('.stat__in', s).checked; s.classList.toggle('is-checked', on); if (on) n++; });
    tc && tc.classList.toggle('is-fit', n === stats.length);
    if (!note) return;
    note.classList.toggle('is-on', n > 0);
    if (n > 0) {
      const put = () => { noteN.textContent = n + '/3'; noteT.textContent = NOTES[n]; };
      if (!window.gsap || reduce || !note.dataset.n) put();
      else gsap.timeline().to([noteN, noteT], { autoAlpha: 0, y: -8, duration: .2, ease: 'power2.in' }).add(put).fromTo([noteN, noteT], { y: 8 }, { autoAlpha: 1, y: 0, duration: .35, ease: 'power3.out' });
      note.dataset.n = n;
    } else delete note.dataset.n;
  };
  stats.forEach(s => $('.stat__in', s).addEventListener('change', syncFit));

  /* ---------- המשפטים של המשפחות: הרצועה, התמונה הראשונה והמשפט הראשון. עובד גם בלי אנימציות ---------- */
  const tv = $('.tv');
  const VO = $$('.tv__src li').map(li => ({ q: li.textContent.trim(), img: li.dataset.img, pos: li.dataset.pos || '50% 50%' }));
  const vFace = tv && $('.tv__face', tv), vQ = tv && $('.tv__quote p', tv), vFilm = tv && $('.tv__film', tv);
  const vImg = i => { const im = new Image(); im.src = VO[i].img; im.alt = ''; im.decoding = 'async'; im.style.objectPosition = VO[i].pos; return im; };
  if (tv && VO.length) {
    vFilm.innerHTML = VO.map((v, i) => '<button class="vthumb" type="button" role="tab" aria-selected="' + (i === 0) + '" aria-label="משפט ' + (i + 1) + '"><img src="' + v.img + '" alt="" loading="lazy" decoding="async" style="object-position:' + v.pos + '"><i aria-hidden="true"></i></button>').join('');
    vFace.appendChild(vImg(0)); vQ.textContent = VO[0].q;
  }

  if (!window.gsap || !window.ScrollTrigger) {
    header && header.classList.add('is-solid');
    $$('.vthumb').forEach((t, i) => t.addEventListener('click', () => { vFace.replaceChildren(vImg(i)); vQ.textContent = VO[i].q; }));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // גלילה חלקה, בדיוק כמו בדף הבית
  if (window.Lenis && !reduce) {
    const lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, wheelMultiplier: 1.15, touchMultiplier: 1.8, anchors: { offset: 0 } });
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

  /* ---------- שדה נקודות: אותו מתכון של ההמלצות בדף הבית (קטנות, כמעט שקופות, נפרשות על כל האזור) ---------- */
  const dotField = (canvas, o) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const GAP = 17, SIZE = 2, PROX = 140, PUSH = o.push ?? 10, SWELL = o.swell ?? .5, TENSION = .09, DAMP = .78, col = o.color || '16,14,54';
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
  const DARK_DOTS = { color: '245,245,245', base: .06, hover: .16 }, LIGHT_DOTS = { base: .07, hover: .1, swell: .25, push: 8 };
  $$('.dotfield').forEach(c => dotField(c, c.closest('[data-theme="light"]') ? LIGHT_DOTS : DARK_DOTS));

  // מעבר בגלילה אחת: כשמתחילים לגלול לתוך המעבר, הגלילה ממשיכה לבד עד שהאזור הבא מכסה את המסך (אותו קוד של דף הבית)
  const snapCover = el => {
    if (reduce || !el) return;
    let busy = false;
    const go = y => {
      if (busy || !window.lenis) return; busy = true;
      window.lenis.scrollTo(y, { duration: .9, easing: t => 1 - Math.pow(1 - t, 4), force: true, onComplete: () => { busy = false; } });
      setTimeout(() => { busy = false; }, 1400);
    };
    const target = () => window.lenis ? window.lenis.targetScroll : scrollY;
    ScrollTrigger.create({ trigger: el, start: 'top bottom-=2', end: 'top top+=2',
      onEnter: s => { const t = target(); if (t > s.start && t < s.end) go(s.end + 2); },
      onEnterBack: s => { const t = target(); if (t > s.start && t < s.end) go(s.start - 2); } });
  };

  /* ================= 1. פתיחה: שלושה משפטים עם תמונה עגולה. התמונות נפתחות מהמרכז, לחיצה מסמנת ומובילה לכרטיס המסלול ================= */
  const th = $('.th');
  if (th) {
    const opts = $$('.opt', th);
    opts.forEach(o => {
      const a = $('.opt__a', o);
      a.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        opts.forEach(x => x.classList.toggle('is-picked', x === o));
        const target = $(a.getAttribute('href'));
        if (!target) return;
        // רגע לראות את הסימון, ואז גלילה לכרטיס של המסלול, שמואר לרגע
        setTimeout(() => {
          const off = -(header ? header.offsetHeight : 64) - 20;
          if (window.lenis) window.lenis.scrollTo(target, { offset: off, duration: 1.4 });
          else target.scrollIntoView({ behavior: 'smooth' });
          target.classList.add('is-flash');
          setTimeout(() => target.classList.remove('is-flash'), 2600);
        }, reduce ? 0 : 650);
      });
    });
    if (!reduce) {
      const title = $('.th__title', th), ask = $('.th__ask', th), hint = $('.th__hint', th);
      const chars = splitChars(title);
      const parts = o => $$('.opt__q, .opt__foot, .opt__trk', o);
      gsap.set(chars, LETTER);
      gsap.set([ask, hint], { autoAlpha: 0, y: 20 });
      gsap.set(opts.map(parts).flat(), { autoAlpha: 0, y: 24 });
      gsap.set(opts.map(o => $('.opt__face', o)), { clipPath: 'circle(0% at 50% 50%)' });
      gsap.set(opts.map(o => $('.opt__face img', o)), { scale: 1.3 });
      const tl = gsap.timeline({ delay: .05 })
        .add(() => playChars(chars), .2)
        .to(ask, { autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out' }, .6)
        .to(hint, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out' }, .8);
      opts.forEach((o, i) => {
        const at = .75 + i * .15;
        tl.to($('.opt__face', o), { clipPath: 'circle(75% at 50% 50%)', duration: 1.3, ease: 'expo.inOut', clearProps: 'clipPath' }, at)
          .to($('.opt__face img', o), { scale: 1, duration: 2.2, ease: 'expo.out', clearProps: 'transform' }, at + .1)
          .to(parts(o), { autoAlpha: 1, y: 0, duration: 1, stagger: .08, ease: 'power3.out' }, at + .35);
      });
    }
  }

  /* ================= 2. שלושת המסלולים: הכרטיסים עולים אחד אחרי השני ================= */
  const tp = $('.tp');
  if (tp && !reduce) {
    const plans = $$('.plan', tp);
    gsap.set(plans, { autoAlpha: 0, y: 70 });
    plans.forEach(p => { gsap.set($('.plan__img img', p), { scale: 1.18 }); });
    ScrollTrigger.create({ trigger: $('.tp__list', tp), start: 'top 80%', once: true, onEnter: () => plans.forEach((p, i) => {
      const d = i * .14;
      gsap.to(p, { autoAlpha: 1, y: 0, duration: 1.2, delay: d, ease: 'expo.out', clearProps: 'transform,translate' });
      gsap.to($('.plan__img img', p), { scale: 1.03, duration: 2.2, delay: d + .1, ease: 'expo.out', clearProps: 'transform' });
    }) });
  }
  // שורה שנפתחת משנה את הגובה של העמוד: מעדכנים את נקודות הגלילה
  $$('.plan .row').forEach(r => r.addEventListener('toggle', () => ScrollTrigger.refresh()));


  /* ================= 3. ההמלצות עולות על המסלולים: המסלולים נעוצים רגע, וגלגלת אחת מעלה את כל האזור (כמו בדף הבית) ================= */
  const tpSec = $('.tp');
  if (tpSec && tv && !reduce && !mobile()) {
    ScrollTrigger.create({ trigger: tpSec, start: 'bottom bottom', end: () => '+=' + Math.round(innerHeight * 1.3), pin: true, pinSpacing: false });
    snapCover(tv);
  }

  /* ================= 3. המשפטים: בדיוק כמו ההמלצות בדף הבית. תמונה עגולה, המשפט עולה שורה אחרי שורה,
     רצועת תמונות שמתנפחת מתחת לעכבר, ופס התקדמות שמעביר למשפט הבא ================= */
  if (tv && VO.length) {
    const film = vFilm, face = vFace, qp = vQ, qbox = $('.tv__quote', tv);
    const thumbs = $$('.vthumb', film), bars = thumbs.map(t => $('i', t));
    // גובה קבוע לציטוט לפי הארוך ביותר: כשמתחלף משפט, שום דבר מתחתיו לא קופץ
    const measure = () => { const m = qp.cloneNode(); m.style.cssText = 'position:absolute;visibility:hidden;left:0;right:0;'; qbox.appendChild(m);
      let h = 0; VO.forEach(v => { m.textContent = v.q; h = Math.max(h, m.offsetHeight); }); m.remove(); qbox.style.setProperty('--qh', h + 'px'); };
    measure(); addEventListener('resize', () => requestAnimationFrame(measure)); document.fonts && document.fonts.ready.then(measure);
    let cur = -1, prog = null, hover = false, inView = false, first = true;
    const sync = () => { if (prog) (inView && !hover && document.visibilityState === 'visible') ? prog.resume() : prog.pause(); };
    const run = () => {
      if (prog) prog.kill();
      gsap.set(bars, { scaleX: 0 });
      if (reduce) return;
      // זמן קריאה לפי האורך: בערך שלוש מילים בשנייה, ולא פחות מ-9 שניות
      prog = gsap.fromTo(bars[cur], { scaleX: 0 }, { scaleX: 1, duration: Math.max(9, VO[cur].q.split(' ').length / 3), ease: 'none', onComplete: () => go((cur + 1) % thumbs.length) });
      sync();
    };
    const go = (i, focus) => {
      if (i === cur) return;
      cur = i;
      thumbs.forEach((t, k) => { t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; gsap.to(t, { '--b': k === i ? 1.3 : 1, duration: reduce ? 0 : .55, ease: 'power3.out', overwrite: 'auto' }); });
      if (focus) thumbs[i].focus();
      // התמונה העגולה: החדשה נכנסת מעל הקודמת
      const im = vImg(i); face.appendChild(im);
      const olds = $$('img', face).filter(x => x !== im);
      if (first || reduce) olds.forEach(o => o.remove());
      else gsap.fromTo(im, { autoAlpha: 0, scale: 1.25 }, { autoAlpha: 1, scale: 1, duration: .9, ease: 'expo.out', onComplete: () => olds.forEach(o => o.remove()) });
      const put = () => {
        qp.textContent = VO[i].q;
        if (reduce) return;
        const w = splitWords(qp);
        gsap.set(qp, { autoAlpha: 1, y: 0 });
        gsap.set(w, { autoAlpha: 0, y: 26 });
        if (first) { qp._w = w; return; }
        playLines(w);
      };
      if (first || reduce) put();
      else gsap.to(qp, { autoAlpha: 0, y: -14, duration: .35, ease: 'power2.in', onComplete: put });
      first = false;
      run();
    };
    thumbs.forEach((t, k) => t.addEventListener('click', () => go(k)));
    film.addEventListener('keydown', e => {
      const d = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0; if (!d) return;
      e.preventDefault(); go((cur + d + thumbs.length) % thumbs.length, true);
    });
    // הרצועה מתנפחת מתחת לעכבר, כמו בדף הבית
    let centers = [];
    const qz = thumbs.map(t => gsap.quickTo(t, '--z', { duration: .32, ease: 'power3.out' }));
    film.addEventListener('mouseenter', () => { hover = true; sync(); centers = thumbs.map(t => { const r = t.getBoundingClientRect(); return r.left + r.width / 2; }); });
    film.addEventListener('mousemove', e => {
      if (mobile() || reduce) return;
      const R = Math.max(120, thumbs[0].offsetWidth * 2.8);
      thumbs.forEach((t, k) => { const f = clamp(1 - Math.abs(e.clientX - centers[k]) / R); qz[k](f * f * (3 - 2 * f)); });
    });
    film.addEventListener('mouseleave', () => { hover = false; sync(); qz.forEach(q => q(0)); });
    const vs = $('.tv__stage', tv);
    vs.addEventListener('mouseenter', () => { hover = true; sync(); });
    vs.addEventListener('mouseleave', () => { hover = false; sync(); });
    document.addEventListener('visibilitychange', sync);
    ScrollTrigger.create({ trigger: tv, start: 'top 60%', end: 'bottom 15%', onToggle: s => { inView = s.isActive; sync(); } });
    face.replaceChildren();
    go(0);
    if (!reduce) {
      gsap.set(face, { autoAlpha: 0, y: 20 });
      gsap.set(thumbs, { autoAlpha: 0, y: 40 });
      ScrollTrigger.create({ trigger: tv, start: 'top 55%', once: true, onEnter: () => {
        gsap.to(face, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out' });
        gsap.delayedCall(.25, () => qp._w && playLines(qp._w));
        gsap.to(thumbs, { autoAlpha: 1, y: 0, duration: 1, stagger: { each: .05, from: 'center' }, delay: .4, ease: 'expo.out' });
      } });
      gsap.fromTo($('.voices__mark', tv), { yPercent: 18 }, { yPercent: -12, ease: 'none', scrollTrigger: { trigger: tv, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    }
  }

  /* ================= 4. מזדהים? המספרים נספרים, וסימן השאלה מתנדנד ================= */
  if (tc && !reduce) {
    // בלי קו בין הכחול לבהיר: "מזדהים" מתחיל בכחול של ההמלצות, ותוך כדי גלילה כל המסך מתבהר יחד
    // (גם ההמלצות וגם "מזדהים"), כך שאין רגע שבו רואים כחול ליד בהיר. התוכן של ההמלצות נעלם בזמן הזה, והטקסט כאן מתכהה
    const setTheme = s => { const t = s.progress > .55 ? 'light' : 'dark'; tc.dataset.theme = t; if (tv) tv.dataset.theme = t; };
    const tvOut = tv ? $$(':scope > *:not(.tv__src)', tv) : [];
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: tc, start: 'top 75%', end: 'top 15%', scrub: true, invalidateOnRefresh: true, onUpdate: setTheme, onRefresh: setTheme } })
      .fromTo(tc, { backgroundColor: '#090725', color: '#FBF5F2' }, { backgroundColor: '#FBF5F2', color: '#100E36' }, 0)
      .fromTo(tv, { backgroundColor: '#090725' }, { backgroundColor: '#FBF5F2' }, 0)
      .fromTo(tvOut, { opacity: 1 }, { opacity: 0, duration: .6 }, 0);
    const tcLight = $('.light', tc);
    // אור החלון: בטלפון חלש יותר, כדי שהנייר יישאר נקי
    if (tcLight) gsap.fromTo(tcLight, { opacity: 0 }, { opacity: () => mobile() ? .3 : .5, ease: 'none', scrollTrigger: { trigger: tc, start: 'top 10%', end: 'top -40%', scrub: true, invalidateOnRefresh: true } });
    const rolls = $$('[data-roll]', tc);
    rolls.forEach(el => { el._t = el.textContent; });
    const fmt = n => Math.round(n).toLocaleString('en-US');
    ScrollTrigger.create({ trigger: $('.tc__stats', tc), start: 'top 85%', once: true, onEnter: () => {
      rolls.forEach(el => {
        const parts = el._t.match(/[\d,]+/g).map(s => +s.replace(/,/g, '')), o = { k: 0 };
        gsap.to(o, { k: 1, duration: 1.6, ease: 'power3.out', onUpdate: () => { let i = 0; el.textContent = el._t.replace(/[\d,]+/g, () => fmt(parts[i++] * o.k)); }, onComplete: () => { el.textContent = el._t; } });
      });
    } });
    rise($$('.stat', tc), $('.tc__stats', tc), { y: 40, stagger: .12, start: 'top 88%' });
    rise([$('.tc__go', tc)], $('.tc__go', tc), { y: 24, start: 'top 95%' });
    const t = $('.tc__title', tc);
    ScrollTrigger.create({ trigger: t, start: 'top 80%', once: true, onEnter: () => {
      const chs = $$('.ch', t), mark = chs[chs.length - 1];
      if (mark) { mark.style.transformOrigin = '30% 90%'; gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 1.6 }).to(mark, { rotation: -10, duration: .45, ease: 'sine.inOut' }).to(mark, { rotation: 7, duration: .5, ease: 'sine.inOut' }).to(mark, { rotation: 0, duration: .7, ease: 'elastic.out(1, .5)' }); }
    } });
  }

  /* ================= 6. התחילו בקטן: כמו "לכל אורך הדרך" בדף הבית. חלון קטן של המזח נפתח למסך מלא, הצל יורד, והטקסט עולה ================= */
  const ts = $('.ts');
  if (ts) {
    const win = $('.ts__win', ts), vid = $('video', win), shade = $('.ts__shade', ts);
    const title = $('.ts__title', ts), parts = $$('.ts__stat, .ts__t, .ts__lead, .ts__list, .ts__cta', ts);
    if (vid && !reduce) {
      ScrollTrigger.create({ trigger: ts, start: 'top bottom+=100%', once: true, onEnter: () => { vid.src = vid.dataset.src; vid.load(); } });
      new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { vid.playbackRate = .9; const p = vid.play(); p && p.catch(() => {}); } else vid.pause(); })).observe(ts);
    }
    if (reduce) { gsap.set(win, { clipPath: 'inset(0% 0% 0% 0%)' }); }
    else {
      const chars = splitChars(title);
      gsap.set(chars, LETTER);
      gsap.set(parts, { autoAlpha: 0, y: 30 });
      const tl = gsap.timeline({ defaults: { ease: 'none' } })
        .fromTo(win, { clipPath: () => mobile() ? 'inset(40% 14% 16% 14%)' : 'inset(42% 35% 10% 35%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power2.inOut' }, 0)
        .fromTo(vid, { scale: 1.1 }, { scale: 1, duration: 2, ease: 'sine.out' }, 0)
        .fromTo(shade, { opacity: 0 }, { opacity: 1, duration: .6 }, .7)
        .to(chars, { autoAlpha: 1, y: 0, rotateX: 0, duration: .35, stagger: .008, ease: 'back.out(1.6)' }, 1.0)
        .to(parts, { autoAlpha: 1, y: 0, duration: .4, stagger: .12, ease: 'power3.out' }, 1.3)
        .to({}, { duration: .6 });
      ScrollTrigger.create({ trigger: ts, start: 'top top', end: () => '+=' + Math.round(innerHeight * 1.8), pin: true, scrub: .8, animation: tl, invalidateOnRefresh: true });
    }
  }

  /* ================= 5. סגירה: המשפחה על הגבעה, והבלון ברוח ================= */
  const tf = $('.tf');
  if (tf && !reduce) {
    // המשפט מתמלא מילה אחר מילה בזמן הגלילה, מאפור שקוף לצבע המלא
    const tw = $$('.tf__title > span', tf).map(s => splitWords(s)).flat();
    gsap.fromTo(tw, { opacity: .14 }, { opacity: 1, ease: 'none', stagger: .12, scrollTrigger: { trigger: $('.tf__title', tf), start: 'top 82%', end: 'top 30%', scrub: .6 } });
    // הסגירה נעוצה ורואים אותה עוד רגע (60svh), ורק אז "התחילו בקטן" עולה עליה בגלילה אחת
    if (!mobile()) ScrollTrigger.create({ trigger: tf, start: 'bottom bottom', end: () => '+=' + Math.round(innerHeight * 1.6), pin: true, pinSpacing: false });
    // במובייל אין נעיצה, ולכן גם בלי קפיצה אוטומטית: שלא ידלגו על המשפחה עם הבלון
    if (!mobile()) snapCover(document.querySelector('.ts'));
    const land = $('.tf__land', tf);
    gsap.fromTo(land, { y: () => innerHeight * .1 }, { y: 0, ease: 'none', scrollTrigger: { trigger: tf, start: 'top bottom', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true } });
    // הבלון מתנדנד סביב היד של הילדה (נקודות בפיקסלים של התמונה), החוט תמיד מהיד אל הקשר, והבלון מסתובב מעט
    const bal = $('.tf__balloon', tf), str = $('.tf__string', tf);
    const HX = 1902, HY = 690, KX = 1978, KY = 499;
    const L = Math.hypot(KX - HX, HY - KY), A0 = Math.atan2(KX - HX, HY - KY);
    let on = false;
    const tick = () => {
      const t = performance.now() / 1000;
      const ang = A0 + .075 * Math.sin(t * .62) + .028 * Math.sin(t * 1.7 + 1.1);
      const l = L * (1 + .014 * Math.sin(t * 1.05 + .4));
      const kx = HX + l * Math.sin(ang), ky = HY - l * Math.cos(ang);
      const bend = 7 * Math.sin(t * .9 + .6), mx = (HX + kx) / 2 - bend * Math.cos(ang), my = (HY + ky) / 2 - bend * Math.sin(ang);
      str.setAttribute('d', 'M' + HX + ' ' + HY + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + kx.toFixed(1) + ' ' + ky.toFixed(1));
      bal.setAttribute('transform', 'translate(' + (kx - KX).toFixed(2) + ' ' + (ky - KY).toFixed(2) + ') rotate(' + ((ang - A0) * 57.3 * .7).toFixed(2) + ' ' + KX + ' ' + KY + ')');
    };
    if (bal && str) new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !on) { on = true; gsap.ticker.add(tick); } else if (!e.isIntersecting && on) { on = false; gsap.ticker.remove(tick); } })).observe(land);
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
    // אזורים נעוצים יושבים בתוך pin-spacer, ולכן מודדים את העוטף שלהם
    zones = $$('main > [data-theme], main > .pin-spacer > [data-theme]').map(sec => { const box = sec.parentElement.classList.contains('pin-spacer') ? sec.parentElement : sec; const r = box.getBoundingClientRect(), top = r.top + scrollY; return { sec, top, bottom: top + r.height, glass: sec.dataset.header === 'glass' && !mobile() }; });
    // הרווח שלפני אזור שעולה על הקודם (בזמן שהקודם נעוץ) שייך לאזור הקודם
    zones.forEach((z, i) => { if (zones[i + 1]) z.bottom = Math.max(z.bottom, zones[i + 1].top); });
  };
  ScrollTrigger.addEventListener('refresh', mapZones);
  const tick = () => {
    if (!header) return;
    const y = window.lenis ? window.lenis.scroll : scrollY, line = y + hh + 4;
    let z = null; for (const q of zones) if (q.top <= line && q.bottom > line) z = q;
    // הצבע נקרא בכל רגע מהאזור עצמו, כי ב'מזדהים' הוא מתחלף תוך כדי גלילה
    const isLight = !!(z && z.sec.dataset.theme === 'light'), glass = !!(z && z.glass);
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
