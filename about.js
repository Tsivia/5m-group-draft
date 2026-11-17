/* עמוד "מי אנחנו" (about.html), גרסה 3.
   אותה שפת תנועה של דף הבית ושל עמוד המסלולים: כותרות אות אחרי אות, טקסטים שורה אחרי שורה, גלילה חלקה (Lenis), נקודות עדינות.
   1 פתיחה: נעים מאד · 2 אתם / גם אנחנו · 3 רפי · 4 הצוות (המתכון של ההמלצות) · 5 למה 5M (עולה מעל הבהיר) · פוטר */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => innerWidth <= 900;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const U = () => Math.min(innerWidth, 1920) / 1920;
  const header = $('.site-header');

  // הלוגו הכהה להדר הבהיר (כמו בדף הבית)
  const logoA = header && $('.site-header__logo', header);
  if (logoA && !$('.logo-on-light', logoA)) { const im = document.createElement('img'); im.className = 'logo-on-light'; im.src = 'assets/logo-5m.svg'; im.alt = ''; im.setAttribute('aria-hidden', 'true'); logoA.appendChild(im); }

  /* ---------- הצעות לפתיחה: בעמוד נשאר רק הכיוון שנבחר (about.html?hero=1..5) ---------- */
  const HV = (() => { const v = +new URLSearchParams(location.search).get('hero'); return v >= 1 && v <= 5 ? v : 1; })();
  $$('.hx').forEach(s => { if (+s.dataset.hv !== HV) s.remove(); });
  { const old = $('.ah'); if (old) old.remove(); }
  $$('.hxs a').forEach(a => a.classList.toggle('is-on', a.getAttribute('href') === '?hero=' + HV));
  const hx = $('.hx');
  // 3. הגלולה: החלון המעוגל יושב בדיוק על המקום שנשמר לו בתוך השורה
  const pill = hx && $('.hx3__pill', hx), slot = hx && $('.hx3__slot', hx);
  const slotBox = () => { const s = slot.getBoundingClientRect(), st = slot.closest('.hx3__stage').getBoundingClientRect(); return { left: s.left - st.left, top: s.top - st.top, width: s.width, height: s.height }; };
  const placePill = () => { if (!pill || !slot) return; const b = slotBox(); Object.assign(pill.style, { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px' }); };
  if (pill) { placePill(); document.fonts && document.fonts.ready.then(placePill); }

  /* ---------- הצוות: עובד גם בלי אנימציות (לחיצה על תמונה ברצועה) ---------- */
  const atm = $('.atm'), people = atm ? $$('.atm__all li', atm) : [], film = atm && $('.atm__film', atm);
  const tPh = atm && $('.atm__ph', atm), tImg = atm && $('.atm__ph img', atm), tG = atm && $('.atm__g', atm), tN = atm && $('.atm__n', atm), tD = atm && $('.atm__d', atm), tTx = atm && $('.atm__tx', atm);
  const thumbs = [];
  let cur = 0;
  if (atm) atm.dataset.v = innerWidth <= 900 ? 1 : 3;
  if (atm && film && people.length) {
    atm.classList.add('is-live');
    people.forEach((p, i) => {
      const b = document.createElement('button');
      b.className = 'tthumb'; b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', p.querySelector('b').textContent);
      b.setAttribute('aria-selected', String(i === 0));
      if (p.dataset.fy) b.style.setProperty('--fy', p.dataset.fy);
      b.innerHTML = '<img src="assets/team-' + p.dataset.img + '.webp" alt="" loading="lazy" decoding="async"><i aria-hidden="true"></i>';
      film.appendChild(b); thumbs.push(b);
    });
    thumbs[0].classList.add('is-on');
  }
  const fillTeam = i => {
    const p = people[i];
    tImg.src = 'assets/team-' + p.dataset.img + '.webp';
    tPh.style.setProperty('--fy', p.dataset.fy || '18%');
    tG.textContent = p.dataset.g; tN.textContent = p.querySelector('b').textContent; tD.textContent = p.querySelector('span').textContent;
  };

  if (!window.gsap || !window.ScrollTrigger) {
    header && header.classList.add('is-solid', 'is-light');
    thumbs.forEach((b, i) => b.addEventListener('click', () => { thumbs.forEach((x, j) => { x.classList.toggle('is-on', j === i); x.setAttribute('aria-selected', String(j === i)); }); fillTeam(i); }));
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

  /* ================= 1. פתיחה: "נעים מאד" =================
     נכנסים ורואים את כל הנוף על כל המסך. אחרי רגע קצר התמונה מתכווצת לבד לחלון במרכז (--p), בלי לחכות לגלילה,
     והכותרת והשאלה נכנסות מהצדדים, אות אחרי אות. סימן השאלה מתנדנד מדי פעם.
     עומק: התמונה והטקסטים זזים עם העכבר במהירויות שונות */
  const ah = $('.ah');
  if (ah && !reduce) {
    const stage = $('.ah__stage', ah), win = $('.ah__win', ah), img = $('.ah__win img', ah), r = $('.ah__r', ah), q = $('.ah__q', ah), eye = $('.ah__eyebrow', ah);
    const c1 = splitChars($('.ah__l1', ah)), c2 = splitChars($('.ah__l2', ah)), c3 = splitChars($('.ah__q span', ah));
    const desk = !mobile();
    gsap.set([...c1, ...c2, ...c3], LETTER);
    const playTitles = () => {
      playChars(c1); playChars(c2, .25);
      gsap.to(c3, { autoAlpha: 1, y: 0, rotateX: 0, duration: .9, stagger: .08, delay: .55, ease: 'back.out(2.4)' });
      const mark = c3[c3.length - 1];
      if (mark) gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 3 }).to(mark, { rotation: -10, duration: .45, ease: 'sine.inOut' }).to(mark, { rotation: 7, duration: .5, ease: 'sine.inOut' }).to(mark, { rotation: 0, duration: .7, ease: 'elastic.out(1, .5)' });
    };
    const tl = gsap.timeline({ delay: .05 });
    tl.fromTo(win, { autoAlpha: 0 }, { autoAlpha: 1, duration: .9, ease: 'power2.out' }, 0)
      .fromTo(img, { scale: 1.08 }, { scale: 1, duration: 2.6, ease: 'expo.out' }, 0);
    if (desk) {
      tl.fromTo(stage, { '--p': 1 }, { '--p': 0, duration: 1.7, ease: 'expo.inOut' }, 1.1)
        .add(playTitles, 1.9);
      if (matchMedia('(hover: hover)').matches) {
        const qi = [gsap.quickTo(img, 'x', { duration: 1.8, ease: 'power3.out' }), gsap.quickTo(img, 'y', { duration: 1.8, ease: 'power3.out' })];
        const qt = [gsap.quickTo([r, q], 'x', { duration: 1.6, ease: 'power3.out' }), gsap.quickTo([r, q], 'y', { duration: 1.6, ease: 'power3.out' })];
        addEventListener('mousemove', e => { const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5; qi[0](-nx * 22); qi[1](-ny * 14); qt[0](nx * 10); qt[1](ny * 6); }, { passive: true });
      }
    } else {
      gsap.set(eye, { autoAlpha: 0, y: 16 });
      tl.to(eye, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out' }, .4).add(playTitles, .6);
    }
  }

  /* ================= הצעות לפתיחה: הכניסה של כל כיוון =================
     הכותרת אות אחרי אות (כמו בכל האתר), ו"ואתם?" קופץ אחרון וסימן השאלה מתנדנד מדי פעם.
     הגלילה של כל כיוון: heroScroll(), שנקרא ליד שאר המעברים */
  let heroScroll = () => {};
  if (hx && !reduce) {
    const desk = !mobile();
    const lines = $$('.hx__l', hx).map(l => splitChars(l));
    const qEl = $('.hx__q span', hx), qc = qEl ? splitChars(qEl) : [];
    const eye = $('.eyebrow', hx);
    gsap.set([...lines.flat(), ...qc], LETTER); gsap.set(eye, { autoAlpha: 0, y: 14 });
    const titles = t0 => gsap.delayedCall(t0, () => {
      gsap.to(eye, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out' });
      lines.forEach((c, i) => playChars(c, .12 + i * .22));
      if (!qc.length) return;
      gsap.to(qc, { autoAlpha: 1, y: 0, rotateX: 0, duration: .9, stagger: .08, delay: .3 + lines.length * .22, ease: 'back.out(2.4)' });
      const mark = qc[qc.length - 1];
      gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 3.6 }).to(mark, { rotation: -10, duration: .45, ease: 'sine.inOut' }).to(mark, { rotation: 7, duration: .5, ease: 'sine.inOut' }).to(mark, { rotation: 0, duration: .7, ease: 'elastic.out(1, .5)' });
    });
    const hover = desk && matchMedia('(hover: hover)').matches;

    if (HV === 1) {
      // החדר: נכנסים מעט מקרוב ונסוגים, והחדר זז מעט עם העכבר (עומק)
      const stage = $('.hx1__stage', hx), room = $('.hx1__room', hx), r = $('.hx1__r', hx), q = $('.hx1__q', hx);
      gsap.fromTo(stage, { '--z': 1.14 }, { '--z': 1, duration: 2.8, ease: 'expo.out' });
      gsap.fromTo(room, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: 'power2.out' });
      titles(.7);
      if (hover) {
        let mx = 0, my = 0, tx = 0, ty = 0;
        addEventListener('mousemove', e => { tx = (e.clientX / innerWidth - .5) * -22; ty = (e.clientY / innerHeight - .5) * -14; }, { passive: true });
        gsap.ticker.add(() => { if (Math.abs(tx - mx) + Math.abs(ty - my) < .05) return; mx += (tx - mx) * .06; my += (ty - my) * .06; room.style.translate = `calc(-50% + ${mx.toFixed(2)}px) calc(-50% + ${my.toFixed(2)}px)`; });
      }
      // בגלילה: נכנסים לתוך החלון עד שהנוף ממלא את המסך, ואז האור ממלא הכל והאזור הבא עולה
      heroScroll = () => {
        cover(hx, at, 0, false, 85);
        if (!desk) return;
        const zMax = () => { const b = room.getBoundingClientRect(), z = parseFloat(getComputedStyle(stage).getPropertyValue('--z')) || 1, w = b.width / z, h = b.height / z; return Math.max(innerWidth / (.328 * w), innerHeight / (.55 * h)) * 1.1; };
        gsap.timeline({ scrollTrigger: { start: 0, end: () => '+=' + Math.round(innerHeight * .85), scrub: .6, invalidateOnRefresh: true } })
          .fromTo(stage, { '--z': 1 }, { '--z': zMax, duration: 1, ease: 'power2.in', immediateRender: false }, 0)
          .to(r, { x: 260, autoAlpha: 0, duration: .4, ease: 'power1.in' }, 0)
          .to(q, { x: -260, autoAlpha: 0, duration: .4, ease: 'power1.in' }, 0)
          .fromTo(stage, { '--f': 0 }, { '--f': 1, duration: .22, ease: 'none', immediateRender: false }, .78);
      };
    }

    if (HV === 2) {
      // היכרות: התמונה נחשפת מהקו האמצעי החוצה, והכותרת נכנסת בצד הכחול
      const ph = $('.hx2__ph', hx), img = $('.hx2__ph img', hx);
      if (desk) dotField($('.hx2__dots', hx), DARK_DOTS);
      gsap.fromTo(ph, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut', delay: .15 });
      gsap.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 3, ease: 'expo.out', delay: .15 });
      titles(.8);
      if (hover) { const qi = [gsap.quickTo(img, 'x', { duration: 1.8, ease: 'power3.out' }), gsap.quickTo(img, 'y', { duration: 1.8, ease: 'power3.out' })];
        addEventListener('mousemove', e => { qi[0]((e.clientX / innerWidth - .5) * -18); qi[1]((e.clientY / innerHeight - .5) * -12); }, { passive: true }); }
      heroScroll = () => {
        cover(hx, at, .35, false, 25);
        if (desk) gsap.to(img, { yPercent: -5, ease: 'none', scrollTrigger: { start: 0, end: () => '+=' + Math.round(innerHeight * 1.25), scrub: true } });
      };
    }

    if (HV === 3) {
      // הגלולה: החלון נפתח באמצע השורה, והתמונה בתוכו מתקרבת לאט
      const img = $('img', pill), inEl = $('.hx3__in', hx), stage = $('.hx3__stage', hx);
      gsap.fromTo(pill, { autoAlpha: 0, scale: .3 }, { autoAlpha: 1, scale: 1, duration: 1.5, ease: 'expo.out', delay: .9 });
      gsap.fromTo(img, { scale: 2.3 }, { scale: 1.8, duration: 3.2, ease: 'expo.out', delay: .9 });
      titles(.2);
      // בגלילה: החלון גדל עד שהוא ממלא את כל המסך, והכותרת נעלמת
      heroScroll = () => {
        cover(hx, at, 0, false, 95);
        if (!desk) { addEventListener('resize', placePill); return; }
        gsap.timeline({ scrollTrigger: { start: 0, end: () => '+=' + Math.round(innerHeight * .9), scrub: .6, invalidateOnRefresh: true } })
          .fromTo(pill, { left: () => slotBox().left, top: () => slotBox().top, width: () => slotBox().width, height: () => slotBox().height, borderRadius: () => slotBox().height / 2 },
            { left: 0, top: 0, width: () => stage.clientWidth, height: () => stage.clientHeight, borderRadius: 0, duration: 1, ease: 'power2.inOut', immediateRender: false }, 0)
          .to(inEl, { autoAlpha: 0, duration: .35, ease: 'none' }, .05)
          .fromTo(img, { scale: 1.8 }, { scale: 1, duration: 1, ease: 'power2.inOut', immediateRender: false }, 0);
      };
    }

    if (HV === 4) {
      // סרט: הפסים השחורים נפתחים, הווידאו מתרחק לאט, ואז הכותרת
      const vid = $('video', hx), bars = $$('.hx4__bar', hx);
      if (vid) { vid.play && vid.play().catch(() => {}); gsap.fromTo(vid, { scale: 1.16 }, { scale: 1.02, duration: 7, ease: 'power2.out' }); }
      gsap.fromTo(bars, { scaleY: 1 }, { scaleY: 0, duration: 1.8, ease: 'expo.inOut', delay: .35 });
      titles(1.3);
      heroScroll = () => {
        cover(hx, at, .45, false, 25);
        if (desk && vid) gsap.to($('.hx4__media', hx), { scale: 1.1, yPercent: 4, ease: 'none', scrollTrigger: { start: 0, end: () => '+=' + Math.round(innerHeight * 1.25), scrub: true } });
      };
    }

    if (HV === 5) {
      // אלבום: התמונות מגיעות מהמרכז אחת אחרי השנייה, זזות עם העכבר לפי העומק שלהן, ומתפזרות בגלילה
      const cards = $$('.hx5__c', hx), stage = $('.hx5__stage', hx);
      gsap.fromTo(cards, { autoAlpha: 0, scale: .55 }, { autoAlpha: 1, scale: 1, duration: 1.6, stagger: { each: .09, from: 'random' }, ease: 'expo.out', delay: .25 });
      titles(.5);
      if (hover) {
        const qs = cards.map(c => [gsap.quickTo(c, 'x', { duration: 1.6, ease: 'power3.out' }), gsap.quickTo(c, 'y', { duration: 1.6, ease: 'power3.out' }), +c.dataset.d || 1]);
        addEventListener('mousemove', e => { const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5; qs.forEach(([fx, fy, d]) => { fx(-nx * 40 * d); fy(-ny * 26 * d); }); }, { passive: true });
      }
      heroScroll = () => {
        cover(hx, at, 0, false, 40);
        if (!desk) return;
        const tl = gsap.timeline({ scrollTrigger: { start: 0, end: () => '+=' + Math.round(innerHeight * 1.4), scrub: .6 } });
        cards.forEach(c => { const d = +c.dataset.d || 1, r = c.getBoundingClientRect(), side = (r.left + r.width / 2) < stage.clientWidth / 2 ? -1 : 1;
          tl.to(c, { yPercent: -70 * d, xPercent: side * 22 * d, ease: 'none', duration: 1 }, 0); });
      };
    }
  }

  /* ================= 2. אתם / גם אנחנו =================
     כשהאזור מגיע: הכותרת אות אחרי אות, המשפט שורה אחרי שורה, קו כתום נמתח תחת כל אחד משלושת הפעלים,
     ואז "איך ידענו?", המילה "אתם" מתהפכת ל"גם אנחנו", ו"כי גם אנחנו." נכנס. בלי לעצור את הגלילה.
     ברקע המשפחה על הגבעה, והבלון מתנדנד ברוח (בדיוק כמו בעמוד המסלולים) */
  const at = $('.at');
  if (at) {
    const land = $('.at__land', at), bal = $('.at__balloon', at), str = $('.at__string', at);
    const HX = 1902, HY = 690, KX = 1978, KY = 499;
    const L = Math.hypot(KX - HX, HY - KY), A0 = Math.atan2(KX - HX, HY - KY);
    let on = false;
    const sway = () => {
      const t = performance.now() / 1000;
      const ang = A0 + .075 * Math.sin(t * .62) + .028 * Math.sin(t * 1.7 + 1.1);
      const l = L * (1 + .014 * Math.sin(t * 1.05 + .4));
      const kx = HX + l * Math.sin(ang), ky = HY - l * Math.cos(ang);
      const bend = 7 * Math.sin(t * .9 + .6), mx = (HX + kx) / 2 - bend * Math.cos(ang), my = (HY + ky) / 2 - bend * Math.sin(ang);
      str.setAttribute('d', 'M' + HX + ' ' + HY + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + kx.toFixed(1) + ' ' + ky.toFixed(1));
      bal.setAttribute('transform', 'translate(' + (kx - KX).toFixed(2) + ' ' + (ky - KY).toFixed(2) + ') rotate(' + ((ang - A0) * 57.3 * .7).toFixed(2) + ' ' + KX + ' ' + KY + ')');
    };
    if (bal && str && !reduce) new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !on) { on = true; gsap.ticker.add(sway); } else if (!e.isIntersecting && on) { on = false; gsap.ticker.remove(sway); } })).observe(land);
  }
  if (at && !reduce) {
    const flip = $('.at__flip', at), wa = $('.at__w--a', at), wb = $('.at__w--b', at), rest = $('.at__rest', at);
    const k = $('.at__k', at), lead = $('.at__lead', at), lines = $$('.at__v i', at), ask = $('.at__ask', at), ans = $('.at__ans', at);
    const titleChars = [...splitChars(wa), ...splitChars(rest)];
    const words = splitWords(lead);
    const widths = () => ({ a: wa.offsetWidth, b: wb.offsetWidth });
    let WD = widths(), flipped = false;
    gsap.set(flip, { width: WD.a });
    ScrollTrigger.addEventListener('refreshInit', () => { gsap.set(flip, { clearProps: 'width' }); WD = widths(); gsap.set(flip, { width: flipped ? WD.b : WD.a }); });
    gsap.set(titleChars, LETTER); gsap.set(k, { autoAlpha: 0, y: 18 }); gsap.set(words, { autoAlpha: 0, y: 26 }); gsap.set([ask, ans], { autoAlpha: 0, y: 24 });
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    tl.to(k, { autoAlpha: 1, y: 0, duration: .6 }, 0)
      .add(() => playChars(titleChars), .1)
      .add(() => playLines(words), .45);
    lines.forEach((l, i) => tl.to(l, { scaleX: 1, duration: .5, ease: 'power2.inOut' }, .85 + i * .2));
    tl.to(ask, { autoAlpha: 1, y: 0, duration: .6 }, 1.3)
      .add(() => { flipped = true; }, 1.55)
      .to(wa, { rotationX: -90, autoAlpha: 0, duration: .35, ease: 'power2.in' }, 1.55)
      .to(flip, { width: () => WD.b, duration: .55, ease: 'power3.inOut' }, 1.57)
      .fromTo(wb, { rotationX: 90, autoAlpha: 0 }, { rotationX: 0, autoAlpha: 1, duration: .55, ease: 'back.out(1.5)', immediateRender: false }, 1.75)
      .to(ans, { autoAlpha: 1, y: 0, duration: .6, ease: 'back.out(1.6)' }, 1.9);
    ScrollTrigger.create({ trigger: at, start: 'top 72%', once: true, onEnter: () => tl.play() });
  }

  /* ================= 3. רפי: כמו "כמה מילים עלינו" בדף הבית. התמונה עולה מלמטה, ותווית השם צפה אליה ================= */
  const ar = $('.ar');
  // הטקסט הרץ ברקע מתחיל בדיוק בגובה הכפתור (גוף האותיות, לפי ה-מ ולא ה-ל), כמו בדף הבית. במובייל נשאר בתחתית
  if (ar) {
    const giant = $('.ar__giant', ar), gtxt = $('.ar__track span', ar), atext = $('.ar__text', ar), abtn = $('.ar__text .btn', ar);
    const placeGiant = () => {
      if (innerWidth <= 900) { giant.classList.remove('is-placed'); giant.style.top = ''; return; }
      const cs = getComputedStyle(gtxt), fs = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight) || fs;
      const c = document.createElement('canvas').getContext('2d'); c.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
      const m = c.measureText(gtxt.textContent), half = (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
      const capTop = half + m.fontBoundingBoxAscent - c.measureText('מ').actualBoundingBoxAscent;
      giant.style.top = Math.round(atext.offsetTop + abtn.offsetTop - capTop) + 'px'; giant.classList.add('is-placed');
    };
    placeGiant(); addEventListener('resize', () => requestAnimationFrame(placeGiant)); document.fonts && document.fonts.ready.then(placeGiant);
    ScrollTrigger.addEventListener('refreshInit', placeGiant);
  }
  if (ar && !reduce) {
    const photo = $('.ar__photo', ar), card = $('.ar__card', ar);
    gsap.set(photo, { autoAlpha: 0, y: 70 }); gsap.set(card, { autoAlpha: 0, x: 40 });
    ScrollTrigger.create({ trigger: ar, start: 'top 62%', once: true, onEnter: () => {
      gsap.to(photo, { autoAlpha: 1, y: 0, duration: 1.4, ease: 'expo.out' });
      gsap.to(card, { autoAlpha: 1, x: 0, duration: 1.2, delay: .55, ease: 'expo.out' });
    } });
    if (matchMedia('(hover: hover) and (min-width: 901px)').matches) {
      const px = gsap.quickTo($('img', photo), 'x', { duration: 1.6, ease: 'power3.out' }), cx = gsap.quickTo(card, 'y', { duration: 1.8, ease: 'power3.out' });
      addEventListener('mousemove', e => { px((e.clientX / innerWidth - .5) * 10); cx((e.clientY / innerHeight - .5) * 12); }, { passive: true });
    }
  }

  /* ================= 4. הצוות =================
     במחשב: קיר משפחתי במסך אחד (טורים רצים משני הצדדים, האדם הפעיל במרכז). במובייל: אדם אחד במרכז ורצועת פנים */
  const TV = atm ? +atm.dataset.v : 1;
  const P = i => { const p = people[i]; return { img: 'assets/team-' + p.dataset.img + '.webp', fy: p.dataset.fy || '18%', g: p.dataset.g, n: p.querySelector('b').textContent, d: p.querySelector('span').textContent }; };
  // ---------- מובייל: אדם אחד במרכז, ורצועת הפנים מתחתיו ----------
  if (atm && thumbs.length && TV === 1) {
    const DUR = 4.6;
    let fill = null, paused = false, inView = false, started = false;
    const bars = thumbs.map(b => $('i', b));
    const show = (i, animate = true) => {
      if (i === cur && animate) return;
      cur = i;
      thumbs.forEach((b, j) => { b.classList.toggle('is-on', j === i); b.setAttribute('aria-selected', String(j === i)); if (j !== i) gsap.set(bars[j], { scaleX: 0 }); });
      if (!animate || reduce) { fillTeam(i); return; }
      gsap.to([tPh, tTx], { autoAlpha: 0, y: 12, duration: .25, ease: 'power2.in', overwrite: true, onComplete: () => {
        fillTeam(i);
        gsap.fromTo(tPh, { autoAlpha: 0, y: 0, scale: .96 }, { autoAlpha: 1, scale: 1, duration: .9, ease: 'expo.out' });
        gsap.set(tTx, { autoAlpha: 1, y: 0 });
        gsap.fromTo([tG, tN, tD], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .75, stagger: .08, ease: 'power3.out' });
      } });
      magnify();
    };
    const run = () => {
      fill && fill.kill();
      if (reduce || paused || !inView) return;
      fill = gsap.fromTo(bars[cur], { scaleX: 0 }, { scaleX: 1, duration: DUR, ease: 'none', onComplete: () => { show((cur + 1) % thumbs.length); run(); } });
    };
    let mx = null;
    const qz = thumbs.map(b => gsap.quickTo(b, '--z', { duration: .45, ease: 'power3.out' }));
    const magnify = () => {
      const tw = thumbs[0].offsetWidth || 1;
      thumbs.forEach((b, j) => {
        let z = j === cur ? .55 : 0;
        if (mx !== null && !mobile()) { const r = b.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mx); z = Math.max(z, Math.pow(clamp(1 - d / (tw * 2.6)), 2)); }
        qz[j](z);
      });
    };
    film.addEventListener('mousemove', e => { mx = e.clientX; magnify(); });
    film.addEventListener('mouseenter', () => { paused = true; fill && fill.pause(); });
    film.addEventListener('mouseleave', () => { mx = null; magnify(); paused = false; fill ? fill.resume() : run(); });
    thumbs.forEach((b, i) => b.addEventListener('click', () => { show(i); gsap.set(bars[i], { scaleX: 1 }); fill && fill.kill(); fill = null; }));
    film.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const n = (cur + (e.key === 'ArrowLeft' ? 1 : -1) + thumbs.length) % thumbs.length;
      show(n); thumbs[n].focus(); e.preventDefault();
    });
    magnify();
    if (!reduce) {
      gsap.set(thumbs, { autoAlpha: 0, y: 24 });
      gsap.set([tPh, tTx], { autoAlpha: 0, y: 30 });
      ScrollTrigger.create({ trigger: $('.atm__stage', atm), start: 'top 82%', once: true, onEnter: () => {
        started = true;
        gsap.to(tPh, { autoAlpha: 1, y: 0, duration: 1.3, ease: 'expo.out' });
        gsap.to(tTx, { autoAlpha: 1, y: 0, duration: 1.2, delay: .15, ease: 'expo.out' });
        gsap.to(thumbs, { autoAlpha: 1, y: 0, duration: .8, stagger: .035, delay: .3, ease: 'power3.out', clearProps: 'transform' });
        if (inView) run();
      } });
    }
    new IntersectionObserver(es => { inView = es[0].isIntersecting; if (!started && !reduce) return; inView ? (fill ? fill.resume() : run()) : fill && fill.pause(); }, { threshold: .3 }).observe(film);
  }

  // ---------- מחשב: קיר משפחתי במסך אחד ----------
  // ארבעה טורים שווים, שניים מכל צד, רצים כל הזמן: החיצוניים למעלה והפנימיים למטה (סימטרי). כל טור הוא רשימה שחוזרת על עצמה בלי תפר.
  // במרכז הכותרת והאדם הפעיל. מתחלף לבד עם פס התקדמות. מעבר עכבר על תמונה עוצר את הטור, מגדיל אותה ומעביר אותה למרכז
  if (atm && people.length && TV === 3) {
    const wall = document.createElement('div'); wall.className = 'twall';
    const mk = (dir, dur) => { const u = document.createElement('ul'); u.className = 'twall__col twall__col--' + dir; u.style.setProperty('--dur', dur + 's'); const t = document.createElement('div'); t.className = 'twall__track'; u.appendChild(t); return u; };
    const center = document.createElement('div'); center.className = 'twall__center';
    const cols = [mk('up', 58), mk('down', 50), center, mk('down', 50), mk('up', 58)];
    cols.forEach(c => wall.appendChild(c));
    center.appendChild($('.atm__head', atm)); center.appendChild($('.atm__stage', atm));
    const meter = document.createElement('div'); meter.className = 'twall__meter'; meter.setAttribute('aria-hidden', 'true');
    meter.innerHTML = '<span class="twall__bar"><i></i></span>';
    center.appendChild(meter);
    $('.atm__film', atm).before(wall);
    // חלוקה: כל טור מקבל אנשים אחרים. החצי של כל טור ארוך מהמסך, ומוכפל פעמיים כדי שהלולאה תהיה רציפה
    const slots = [0, 1, 3, 4], groups = [[], [], [], []];
    people.forEach((p, i) => groups[i % 4].push(i));
    const buttons = [];
    groups.forEach((g, ci) => {
      const track = $('.twall__track', cols[slots[ci]]);
      let half = g.slice(); while (half.length < 6) half = half.concat(g);
      [...half, ...half].forEach((i, k) => {
        const d = P(i), li = document.createElement('div'); li.className = 'wp'; li.dataset.i = i;
        li.innerHTML = '<button class="wp__b" type="button" aria-label="' + d.n + '"' + (k >= half.length ? ' tabindex="-1" aria-hidden="true"' : '') + ' style="--fy:' + d.fy + '"><img src="' + d.img + '" alt="" loading="lazy" decoding="async"></button>';
        track.appendChild(li); buttons.push(li);
      });
    });
    const bar = $('.twall__bar i', meter);
    let at3 = 0, fill = null, hovering = false, inView = false;
    const set = (i, animate = true) => {
      at3 = i; buttons.forEach(w => w.classList.toggle('is-on', +w.dataset.i === i));
      if (!animate || reduce) { fillTeam(i); return; }
      gsap.to([tPh, tTx], { autoAlpha: 0, y: 10, duration: .22, ease: 'power2.in', overwrite: true, onComplete: () => {
        fillTeam(i);
        gsap.fromTo(tPh, { autoAlpha: 0, scale: .96, y: 0 }, { autoAlpha: 1, scale: 1, duration: .9, ease: 'expo.out' });
        gsap.set(tTx, { autoAlpha: 1, y: 0 });
        gsap.fromTo([tG, tN, tD], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .7, stagger: .07, ease: 'power3.out' });
      } });
    };
    set(0, false);
    const run = () => { fill && fill.kill(); if (reduce || hovering || !inView) return; fill = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 4.4, ease: 'none', onComplete: () => { set((at3 + 1) % people.length); run(); } }); };
    buttons.forEach(w => { const b = $('button', w), i = +w.dataset.i; const pick = () => { hovering = true; fill && fill.kill(); gsap.set(bar, { scaleX: 1 }); if (i !== at3) set(i); }; b.addEventListener('mouseenter', pick); b.addEventListener('focus', pick); b.addEventListener('click', pick); });
    wall.addEventListener('mouseleave', () => { hovering = false; run(); });
    new IntersectionObserver(es => { inView = es[0].isIntersecting; inView ? run() : fill && fill.kill(); }, { threshold: .4 }).observe(center);
    if (reduce) wall.classList.add('is-paused');
    else { gsap.set(cols.filter(c => c !== center), { autoAlpha: 0, y: 60 }); ScrollTrigger.create({ trigger: atm, start: 'top 70%', once: true, onEnter: () => gsap.to(cols.filter(c => c !== center), { autoAlpha: 1, y: 0, duration: 1.4, stagger: .1, ease: 'expo.out', clearProps: 'transform' }) }); }
  }

  /* ================= 5. למה 5M: המספרים נספרים כשהכרטיסים נכנסים ================= */
  const a5 = $('.a5');
  if (a5 && !reduce) {
    const steps = $$('.a5s', a5), arrs = $$('.a5__arr', a5), vals = $$('.a5s__v', a5);
    const showV = v => { const n = +v.dataset.to, c = v._c || 0; v.textContent = (n >= 10 ? Math.round(c) : c.toFixed(c >= n ? 0 : 1)) + v.dataset.fmt; };
    vals.forEach(v => { v._c = 0; showV(v); });
    gsap.set(steps, { autoAlpha: 0, y: 40 }); gsap.set(arrs, { autoAlpha: 0, x: 18 });
    ScrollTrigger.create({ trigger: $('.a5__steps', a5), start: 'top 84%', once: true, onEnter: () => {
      steps.forEach((s, i) => {
        const d = i * .32, v = $('.a5s__v', s);
        gsap.to(s, { autoAlpha: 1, y: 0, duration: 1, delay: d, ease: 'expo.out', clearProps: 'transform' });
        gsap.to(s, { '--on': 1, duration: 1.1, delay: d + .3, ease: 'power2.inOut' });
        if (v) gsap.to(v, { _c: +v.dataset.to, duration: 1.5, delay: d + .2, ease: 'power2.out', onUpdate: () => showV(v) });
      });
      gsap.to(arrs, { autoAlpha: 1, x: 0, duration: .7, stagger: .32, delay: .45, ease: 'power3.out' });
    } });
    gsap.fromTo($('.a5__bg', a5), { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: a5, start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ================= מעברים: האזור הבא עולה כולו מעל הקודם בגלילה אחת (כמו בדף הבית) =================
     האזור הקודם נעצר ברגע שהתחתית שלו מגיעה לתחתית המסך, והבא גולל מעליו. הקודם מחשיך מעט מתחתיו,
     וברגע שמתחילים לגלול לתוך המעבר, הגלילה משלימה אותו לבד. רק במחשב */
  const cover = (prev, next, dim, snap = true, hold = 0) => {
    if (!prev || !next || reduce || mobile()) return;
    if (hold) next.style.marginTop = hold + 'svh';   // רווח שבו הקודם עומד שלם לפני שהבא מתחיל לעלות
    ScrollTrigger.create({ trigger: prev, start: 'bottom bottom', end: () => '+=' + Math.round(innerHeight * (1 + hold / 100)), pin: true, pinSpacing: false, invalidateOnRefresh: true });
    const veil = document.createElement('i'); veil.className = 'cv-veil'; veil.setAttribute('aria-hidden', 'true'); prev.appendChild(veil);
    gsap.fromTo(veil, { opacity: 0 }, { opacity: dim, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true } });
    if (!window.lenis || !snap) return;
    let busy = false;
    const go = y => { if (busy) return; busy = true; window.lenis.scrollTo(y, { duration: .95, easing: t => 1 - Math.pow(1 - t, 4), force: true, onComplete: () => { busy = false; } }); setTimeout(() => { busy = false; }, 1400); };
    const target = () => window.lenis.targetScroll;
    ScrollTrigger.create({ trigger: next, start: 'top bottom-=2', end: 'top top+=2',
      onEnter: s => { const t = target(); if (t > s.start && t < s.end) go(s.end + 2); },
      onEnterBack: s => { const t = target(); if (t > s.start && t < s.end) go(s.start - 2); } });
  };
  heroScroll();
  cover(at, $('.ar'), .08, false, 50);
  cover(atm, a5, .35, false, 50);

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

  /* ================= ההדר: רקע ברגע שגוללים, ובהיר מעל האזורים הבהירים (האחרון שעולה מנצח) ================= */
  let zones = [], hh = header ? header.offsetHeight : 64, last = '';
  const mapZones = () => {
    hh = header ? header.offsetHeight : 64;
    zones = $$('main > [data-theme], main > .pin-spacer > [data-theme]').map(sec => {
      const box = sec.parentElement.classList.contains('pin-spacer') ? sec.parentElement : sec, r = box.getBoundingClientRect(), top = r.top + scrollY;
      return { top, bottom: top + r.height, light: sec.dataset.theme === 'light', glass: sec.dataset.header === 'glass' };
    });
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
  mapZones(); tick();

  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  const onLoaded = () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); };
  document.readyState === 'complete' ? requestAnimationFrame(onLoaded) : addEventListener('load', onLoaded);
})();
