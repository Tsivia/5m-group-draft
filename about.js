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

  const hx = $('.hx');

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

  /* ================= 1. פתיחה: "נעים מאד" בתוך החדר =================
     הכותרת אות אחרי אות (כמו בכל האתר), ו"ואתם?" קופץ אחרון וסימן השאלה מתנדנד מדי פעם.
     החדר זז מעט עם העכבר, ובגלילה נכנסים לתוך החלון (heroScroll, שנקרא ליד שאר המעברים) */
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

    {
      // החדר עומד במקומו מהרגע הראשון (בלי תמונה גדולה שמתכווצת בכניסה), וזז מעט עם העכבר (עומק)
      const stage = $('.hx1__stage', hx), room = $('.hx1__room', hx), r = $('.hx1__r', hx), q = $('.hx1__q', hx);
      titles(.7);
      if (hover) {
        let mx = 0, my = 0, tx = 0, ty = 0;
        addEventListener('mousemove', e => { tx = (e.clientX / innerWidth - .5) * -22; ty = (e.clientY / innerHeight - .5) * -14; }, { passive: true });
        gsap.ticker.add(() => { if (Math.abs(tx - mx) + Math.abs(ty - my) < .05) return; mx += (tx - mx) * .06; my += (ty - my) * .06; room.style.translate = `calc(-50% + ${mx.toFixed(2)}px) calc(-50% + ${my.toFixed(2)}px)`; });
      }
      // בגלילה: נכנסים לתוך החלון עד שהנוף ממלא את המסך, ואז האור ממלא הכל והאזור הבא עולה
      heroScroll = () => {
        cover(hx, at, 0, false, 55);
        // מובייל: אותו רעיון בלי ההצמדה. כשגוללים החוצה האור ממלא את הפתיחה, כך שאין קו בין הכחול לנייר שמתחת
        if (!desk) { gsap.fromTo(stage, { '--f': 0 }, { '--f': 1, ease: 'none', scrollTrigger: { trigger: hx, start: 'top top', end: () => '+=' + Math.round(innerHeight * .4), scrub: true, invalidateOnRefresh: true,
          onUpdate: s => header && header.classList.toggle('is-light', s.progress > .85) } }); return; }
        const zMax = () => { const b = room.getBoundingClientRect(), z = parseFloat(getComputedStyle(stage).getPropertyValue('--z')) || 1, w = b.width / z, h = b.height / z; return Math.max(innerWidth / (.343 * w), innerHeight / (.57 * h)) * 1.06; };
        gsap.timeline({ scrollTrigger: { start: 0, end: () => '+=' + Math.round(innerHeight * .55), scrub: .5, invalidateOnRefresh: true,
            onUpdate: s => header && header.classList.toggle('is-light', s.progress > .85) } })   // כשהאור ממלא את המסך, ההדר עובר לבהיר
          .fromTo(stage, { '--z': 1 }, { '--z': zMax, duration: 1, ease: 'power2.in', immediateRender: false }, 0)
          .to(r, { x: 260, autoAlpha: 0, duration: .4, ease: 'power1.in' }, 0)
          .to(q, { x: -260, autoAlpha: 0, duration: .4, ease: 'power1.in' }, 0)
          .fromTo(stage, { '--f': 0 }, { '--f': 1, duration: .22, ease: 'none', immediateRender: false }, .78);
      };
    }
  }

  /* ================= 2. אתם / גם אנחנו =================
     כשהאזור מגיע: הכותרת אות אחרי אות, המשפט שורה אחרי שורה, קו כתום נמתח תחת כל אחד משלושת הפעלים,
     ואז "איך ידענו?" ו"כי גם אנחנו.". בלי לעצור את הגלילה.
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
    const k = $('.at__k', at), lead = $('.at__lead', at), lines = $$('.at__v i', at), ask = $('.at__ask', at), ans = $('.at__ans', at), firm = $('.at__firm', at);
    const titleChars = splitChars($('.at__title', at));
    const words = splitWords(lead), fw = firm ? splitWords(firm) : [];
    gsap.set(titleChars, LETTER); gsap.set(k, { autoAlpha: 0, y: 18 }); gsap.set(words, { autoAlpha: 0, y: 26 }); gsap.set([ask, ans], { autoAlpha: 0, y: 24 }); gsap.set(fw, { autoAlpha: 0, y: 26 });
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    tl.to(k, { autoAlpha: 1, y: 0, duration: .6 }, 0)
      .add(() => playChars(titleChars), .1)
      .add(() => playLines(words), .45);
    lines.forEach((l, i) => tl.to(l, { scaleX: 1, duration: .5, ease: 'power2.inOut' }, .85 + i * .2));
    tl.to(ask, { autoAlpha: 1, y: 0, duration: .6 }, 1.3)
      .to(ans, { autoAlpha: 1, y: 0, duration: .6, ease: 'back.out(1.6)' }, 1.6)
      .add(() => playLines(fw), 2.05);   // ואז "בדיוק בשביל זה הקמנו את 5M Group"
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
      // ברצועה שנגללת הצידה (מובייל): הפנים הפעילות תמיד במרכז הרצועה. רק הרצועה זזה, לא העמוד
      if (film.scrollWidth > film.clientWidth + 2) { const fr = film.getBoundingClientRect(), br = thumbs[i].getBoundingClientRect(); film.scrollBy({ left: br.left + br.width / 2 - (fr.left + fr.width / 2), behavior: reduce ? 'auto' : 'smooth' }); }
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

  /* ================= 5. ה-DNA שלנו: משולש הזהב של דף הבית (sections.js), בלי התוויות והמגירה =================
     בכניסה הפסל נבנה: הבסיס עולה, האמצע נוחת עליו והקודקוד יורד אחרון. גלילה אחת = שלב אחד:
     המספר, השם אות אחרי אות, ההסבר שורה אחרי שורה ו"כאן עושים את זה.", השכבה שלו בפסל מתמלאת ומתרוממת,
     והמקטע שלו למטה מתמלא. אחרי השלב השלישי עוד גלילה אחת ממשיכה ל"למה 5M".
     במובייל: בלי נעיצה, שלושת השלבים הם כרטיסים שמחליקים הצידה (כמו בדף הבית) */
  const STEP_DUR = .85;
  let stepLock = 0;
  const stepEase = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const stepper = (st, count, prevY, nextY) => {
    const stops = () => Array.from({ length: count }, (_, k) => st.start + (st.end - st.start) * k / (count - 1));
    const curY = () => window.lenis ? window.lenis.scroll : scrollY;
    const inZone = () => { const y = curY(); return y >= st.start - 4 && y <= st.end + 4; };
    const nearest = () => { const y = curY(), S = stops(); let k = 0; S.forEach((v, i) => { if (Math.abs(v - y) < Math.abs(S[k] - y)) k = i; }); return k; };
    let busy = false, queued = 0, lastT = 0, lastAbs = 0, lastStep = 0, guard = 0;
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
      if (dir < 0 && !prevY && curY() <= st.start + 4) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const now = performance.now(), gap = now - lastT, abs = Math.abs(e.deltaY);
      const fresh = gap > 140 || abs > lastAbs * 1.4 + 4;
      lastT = now; lastAbs = abs;
      if (!fresh) return;
      if (busy) { if (now - lastStep > 300) queued = dir; return; }
      stepTo(dir);
    }, { capture: true, passive: false });
  };

  const agt = $('.agt');
  if (agt) {
    const car = mobile();
    const steps = $$('.gts', agt), segs = $$('.gt__seg', agt), bars = segs.map(s => $('.gt__bar b', s));
    const pieces = [1, 2, 3].map(n => $('.gt__piece--' + n, agt)), fills = [1, 2, 3].map(n => $('.gt__fill--' + n, agt)), sculpt = $('.gt__sculpt', agt);
    const pair = k => [pieces[k], fills[k]];
    const parts = steps.map(s => ({ no: $('.gts__no', s), name: splitChars($('.gts__name', s)), words: splitWords($('.gts__lead', s)), dn: $('.gts__do', s) }));
    const all = p => [p.no, ...p.name, ...p.words, p.dn];
    const track = $('.gt__steps', agt);
    if (car) agt.classList.add('is-car');
    if (!reduce && !car) parts.forEach(p => gsap.set(all(p), { autoAlpha: 0 }));

    let on = -1;
    const show = i => {
      if (i === on) return;
      const prev = on; on = i;
      segs.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.setAttribute('aria-current', k === i ? 'step' : 'false'); });
      // השכבות מתמלאות בצבע מלמטה: בשלב 1 הבסיס, בשלב 2 גם האמצע, ובשלב 3 שלושתן. השכבה של השלב הנוכחי מתרוממת
      pieces.forEach((p, k) => p.classList.toggle('is-now', k === i));
      fills.forEach((f, k) => { f.classList.toggle('is-on', k <= i); f.classList.toggle('is-now', k === i); });
      sculpt.classList.add('has-on');
      if (car) bars.forEach((b, k) => { b.style.transform = 'scaleX(' + (k <= i ? 1 : 0) + ')'; });
      if (reduce || car) { steps.forEach((s, k) => s.classList.toggle('is-on', k === i)); return; }
      if (prev >= 0) {
        const p = parts[prev], s = steps[prev];
        gsap.to(all(p), { autoAlpha: 0, y: -18, duration: .3, stagger: .002, ease: 'power2.in', overwrite: true, onComplete: () => { if (on !== prev) s.classList.remove('is-on'); } });
      }
      const p = parts[i]; steps[i].classList.add('is-on');
      const d = prev >= 0 ? .3 : .1;
      gsap.set(p.name, LETTER); gsap.set(p.words, { autoAlpha: 0, y: 26 });
      gsap.to(p.name, { autoAlpha: 1, y: 0, rotateX: 0, duration: .7, stagger: .03, delay: d, ease: 'back.out(1.8)', overwrite: true });
      gsap.delayedCall(d + .25, () => { if (on === i) playLines(p.words); });
      gsap.fromTo(p.dn, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .6, delay: d + .6, ease: 'power3.out', overwrite: true });
      gsap.fromTo(p.no, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .6, delay: d - .05, ease: 'power3.out', overwrite: true });
    };

    let st = null;
    const AT = [1 / 3, 2 / 3, 1];
    const toY = y => window.lenis ? window.lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y, behavior: 'smooth' });
    const slide = k => { const r = track.getBoundingClientRect(), b = steps[k].getBoundingClientRect(), pd = parseFloat(getComputedStyle(track).paddingRight) || 0; track.scrollBy({ left: b.right - (r.right - pd), behavior: reduce ? 'auto' : 'smooth' }); };
    const go = k => { if (car) slide(k); else if (st) toY(st.start + 2 + (st.end - st.start) * AT[k]); else show(k); };
    $$('[data-go]', agt).forEach(b => b.addEventListener('click', () => go(+b.dataset.go)));
    let carReady = reduce;
    const pick = () => { const r = track.getBoundingClientRect(), c = r.left + r.width / 2; let k = 0, dd = Infinity; steps.forEach((s, i) => { const b = s.getBoundingClientRect(), e = Math.abs(b.left + b.width / 2 - c); if (e < dd) { dd = e; k = i; } }); if (carReady) show(k); };
    if (car) { let fr = 0; track.addEventListener('scroll', () => { fr = fr || requestAnimationFrame(() => { fr = 0; pick(); }); }, { passive: true }); }
    if (reduce) { show(0); if (!car) bars.forEach(b => { b.style.transform = 'scaleX(1)'; }); }
    else {
      gsap.set(pair(0), { y: 120, autoAlpha: 0 });
      gsap.set(pair(1), { y: -150, autoAlpha: 0 });
      gsap.set(pair(2), { y: -260, rotation: -6, autoAlpha: 0 });
      const inc = car ? track : $('.gt__inc', agt);
      gsap.set([...segs, inc], { autoAlpha: 0, y: 20 });
      ScrollTrigger.create({ trigger: agt, start: car ? 'top 70%' : 'top 45%', once: true, onEnter: () => {
        gsap.to(pair(0), { y: 0, autoAlpha: 1, duration: 1.3, ease: 'expo.out' });
        gsap.to(pair(1), { y: 0, autoAlpha: 1, duration: 1.2, delay: .3, ease: 'back.out(1.2)' });
        gsap.to(pair(2), { y: 0, rotation: 0, autoAlpha: 1, duration: 1.4, delay: .6, ease: 'back.out(1.5)', onComplete: () => gsap.to(pair(2), { y: -9, duration: 2.8, yoyo: true, repeat: -1, ease: 'sine.inOut' }) });
        gsap.to(inc, { autoAlpha: 1, y: 0, duration: 1, delay: .5, ease: 'expo.out' });
        gsap.to(segs, { autoAlpha: 1, y: 0, duration: 1, stagger: .12, delay: .7, ease: 'expo.out', clearProps: 'opacity,visibility,transform' });
        gsap.delayedCall(.9, () => { if (car) { carReady = true; pick(); } else if (on < 0) show(0); });
      } });
      if (!car) {
        st = ScrollTrigger.create({ trigger: agt, start: 'top top', end: () => '+=' + Math.round(innerHeight * 1.8), pin: true, invalidateOnRefresh: true,
          onUpdate: s => { const p = s.progress; bars.forEach((b, k) => { b.style.transform = 'scaleX(' + clamp(p * 2 + 1 - k).toFixed(3) + ')'; }); if (on >= 0 || p > 0) show(p < .25 ? 0 : p < .75 ? 1 : 2); } });
        // אחרי השלב השלישי, עוד גלילה אחת מביאה את "למה 5M" למסך
        stepper(st, 3, null, () => st.end + innerHeight);
      }
    }
  }

  /* ================= 6. למה 5M: המספרים נספרים כשהכרטיסים נכנסים ================= */
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
    if (!mobile()) gsap.fromTo($('.a5__bg', a5), { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: a5, start: 'top bottom', end: 'bottom top', scrub: true } });
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
  // אחרי "אם קלטנו נכון" הגלילה רגילה: רפי לא עולה מעל האזור, פשוט ממשיכים אליו
  cover(atm, agt, .08, false, 50);   // ה-DNA עולה מעל הצוות, אחרי רגע שבו הצוות עומד שלם

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
