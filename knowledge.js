/* מרכז הידע הפיננסי (knowledge.html) ועמוד מאמר (article.html).
   התוכן נבנה מ-knowledge-data.js. אותה שפת תנועה של שאר העמודים: כותרות אות אחרי אות,
   טקסטים שורה אחרי שורה, גלילה חלקה (Lenis), כרטיסים שעולים בגלילה. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => innerWidth <= 900;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const header = $('.site-header');
  const DATA = window.KNOW || [], CATS = window.KNOW_CATS || {};
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  // הלוגו הכהה להדר הבהיר (כמו בשאר העמודים)
  const logoA = header && $('.site-header__logo', header);
  if (logoA && !$('.logo-on-light', logoA)) { const im = document.createElement('img'); im.className = 'logo-on-light'; im.src = 'assets/logo-5m.svg'; im.alt = ''; im.setAttribute('aria-hidden', 'true'); logoA.appendChild(im); }

  /* ---------- כרטיס מאמר ---------- */
  const card = (a, lvl = 'h2') => `<li class="kc" data-cat="${a.cat}"><a class="kc__a" href="article.html?a=${encodeURIComponent(a.slug)}">
    <span class="kc__img"><img src="${a.img}" alt="" loading="lazy" decoding="async" style="object-position:${a.pos || '50% 50%'}"><i class="kc__hz" aria-hidden="true"></i></span>
    <span class="kc__meta"><span class="tag">${esc(CATS[a.cat] || '')}</span><span class="kc__time">${a.mins} דקות קריאה</span></span>
    <${lvl} class="kc__t">${esc(a.title)}</${lvl}>
    <span class="kc__bot"><span class="kc__x">${esc(a.excerpt)}</span>
    <span class="kc__go">לקריאת המאמר<span class="arr" aria-hidden="true">&gt;&gt;</span></span></span></a></li>`;

  /* ================= עמוד מרכז הידע: כרטיסים + סינון לפי נושא ================= */
  const grid = $('.kh .kgrid');
  let filterCards = null;
  if (grid) {
    grid.innerHTML = DATA.map(a => card(a)).join('');
    const btns = $$('.kf__b'), line = $('.kf__line');
    // הקו הכתום עובר אל המילה הנבחרת
    const moveLine = (instant) => {
      const b = btns.find(x => x.getAttribute('aria-pressed') === 'true'); if (!b || !line) return;
      if (instant) line.style.transition = 'none';
      line.style.setProperty('--x', b.offsetLeft + 'px');
      line.style.setProperty('--w', b.offsetWidth + 'px');
      if (instant) { line.offsetWidth; line.style.transition = ''; }
    };
    addEventListener('resize', () => moveLine(true));
    document.fonts && document.fonts.ready.then(() => moveLine(true));
    // בטלפון השורה ממורכזת: כל שינוי ברוחב השורה (גם בלי resize של החלון) מזיז את המילים, אז הקו נמדד מחדש
    if (window.ResizeObserver && line) new ResizeObserver(() => moveLine(true)).observe(line.parentElement);
    const apply = (cat, animate) => {
      btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
      moveLine(!animate);
      const items = $$('.kc', grid), show = items.filter(li => cat === 'all' || li.dataset.cat === cat);
      items.forEach(li => { li.hidden = !show.includes(li); });
      if (animate && window.gsap && !reduce) gsap.fromTo(show, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .7, stagger: .06, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };
    filterCards = apply;
    btns.forEach(b => b.addEventListener('click', () => {
      const cat = b.dataset.cat; apply(cat, true);
      const u = new URL(location.href); cat === 'all' ? u.searchParams.delete('cat') : u.searchParams.set('cat', cat); history.replaceState(null, '', u);
    }));
    // מדף הבית אפשר להגיע ישר לנושא: knowledge.html?cat=invest
    const pre = new URLSearchParams(location.search).get('cat');
    apply(pre && CATS[pre] ? pre : 'all', false);
  }

  /* ================= עמוד מאמר ================= */
  const art = $('.ka');
  if (art) {
    const slug = new URLSearchParams(location.search).get('a');
    const a = DATA.find(x => x.slug === slug) || DATA[0];
    if (a) {
      document.title = a.title + ' · מרכז הידע הפיננסי · 5M Group';
      const md = $('meta[name="description"]'); md && md.setAttribute('content', a.excerpt);
      $('.ka__cat').textContent = CATS[a.cat] || '';
      $('.ka__cat').href = 'knowledge.html?cat=' + a.cat;
      $('.ka__time').textContent = a.mins + ' דקות קריאה';
      // הכותרת: המילים שב-em בכתום
      const t = esc(a.title), e = a.em ? esc(a.em) : '';
      $('.ka__title').innerHTML = e && t.includes(e) ? t.replace(e, `<em>${e}</em>`) : t;
      $('.ka__lead').textContent = a.excerpt;
      const im = $('.ka__img img'); im.src = a.img; im.style.objectPosition = a.pos || '50% 50%';
      // המספר המודגש הראשון יושב על התמונה בתווית זכוכית. אם יש עוד, הם נשארים בגוף המאמר
      const stats = a.body.filter(b => b[0] === 'stat'), glass = $('.ka__glass');
      if (stats.length && glass) { $('.ka__num', glass).textContent = stats[0][1]; $('.ka__cap', glass).textContent = stats[0][2]; glass.hidden = false; }
      $('.kb__in').innerHTML = a.body.map(([t, x, y], i) =>
        t === 'h' ? `<h2>${esc(x)}</h2>`
        : t === 'list' ? `<ul class="kb__list">${x.map(li => `<li>${esc(li)}</li>`).join('')}</ul>`
        : t === 'stat' ? (a.body[i] === stats[0] ? '' : `<div class="kb__stat"><span class="ka__num">${esc(x)}</span><p class="ka__cap">${esc(y)}</p></div>`)
        : `<p>${esc(x)}</p>`).join('')
        + '<p class="kb__note">המידע במאמר הוא כללי ולהמחשה בלבד, ואינו מהווה ייעוץ השקעות, ייעוץ פנסיוני או ייעוץ מס המותאם לנתונים האישיים שלכם.</p>';
      // עוד שלושה מאמרים: קודם מאותו נושא, ואחר כך הבאים בתור
      const rest = DATA.filter(x => x !== a), more = [...rest.filter(x => x.cat === a.cat), ...rest.filter(x => x.cat !== a.cat)].slice(0, 3);
      $('.km .kgrid').innerHTML = more.map(x => card(x, 'h3')).join('');
    }
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


  /* ================= פתיחה ================= */
  const batchUp = (els, o = {}) => {
    if (reduce || !els.length) return;
    gsap.set(els, { autoAlpha: 0, y: o.y ?? 40 });
    ScrollTrigger.batch(els, { start: o.start || 'top 92%', once: true, onEnter: b => gsap.to(b, { autoAlpha: 1, y: 0, duration: 1.1, stagger: o.stagger ?? .1, ease: 'expo.out', clearProps: 'transform' }) });
  };
  const kh = $('.kh');
  if (kh && !reduce) {
    const lines = $$('.kh__l', kh).map(l => splitChars(l));
    $('.kh__title', kh).setAttribute('aria-label', $('.kh__title', kh).textContent.replace(/\s+/g, ' ').trim());
    $$('.kh__l', kh).forEach(s => s.removeAttribute('aria-label'));
    const lead = splitWords($('.kh__lead', kh)), eye = $('.kh__eye', kh), btns = $$('.kf__b', kh), kline = $('.kf__line', kh);
    gsap.set(lines.flat(), LETTER);
    gsap.set(lead, { autoAlpha: 0, y: 26 });
    gsap.set([eye, ...btns], { autoAlpha: 0, y: 18 });
    kline && gsap.set(kline, { autoAlpha: 0 });
    const tl = gsap.timeline({ delay: .1 }).to(eye, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out' }, 0);
    lines.forEach((ch, i) => tl.add(() => playChars(ch), .1 + i * .35));
    tl.add(() => playLines(lead), .7).to(btns, { autoAlpha: 1, y: 0, duration: .8, stagger: .06, ease: 'power3.out', clearProps: 'transform' }, .95);
    kline && tl.to(kline, { autoAlpha: 1, duration: .8, ease: 'power2.out' }, 1.2);
    // הכרטיסים עולים: השורה הראשונה מיד בפתיחה, השאר בגלילה
    batchUp($$('.kc', kh), { y: 50, stagger: .09, start: 'top 96%' });
  }

  const ka = $('.ka');
  if (ka && !reduce) {
    const ttl = splitChars($('.ka__title', ka)), lead = splitWords($('.ka__lead', ka)), img = $('.ka__img', ka), top = $$('.ka__back, .ka__meta', ka);
    gsap.set(ttl, LETTER);
    gsap.set(lead, { autoAlpha: 0, y: 26 });
    gsap.set(top, { autoAlpha: 0, y: 18 });
    gsap.set(img, { clipPath: 'inset(100% 0 0 0)' });
    gsap.set($('img', img), { scale: 1.12 });
    gsap.timeline({ delay: .1 })
      .to(top, { autoAlpha: 1, y: 0, duration: .8, stagger: .08, ease: 'power3.out', clearProps: 'transform' }, 0)
      .add(() => playChars(ttl), .2)
      .add(() => playLines(lead), .65)
      .to(img, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath' }, .8)
      .to($('img', img), { scale: 1, duration: 1.8, ease: 'expo.out' }, .8)
      .fromTo($('.ka__glass', ka), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 1.7);
    batchUp($$('.kb__in > *'), { y: 30, stagger: .07 });
    batchUp($$('.km .kc'), { y: 50, stagger: .09 });
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
    // אזור בהיר שנמס לנייבי בתחתיתו (.kh::after, .km::after): החצי התחתון של המעבר כבר כהה, ולכן ההדר מתחלף לכהה שם.
    // כך ההדר נהיה כהה מעל הפוטר גם במסכים שבהם הפוטר נמוך מהמסך (אחרת קו ההדר לא מגיע אליו לעולם, ונשאר בהיר עד הסוף)
    zones = $$('main > [data-theme], main > .pin-spacer > [data-theme]').map(sec => { const box = sec.parentElement.classList.contains('pin-spacer') ? sec.parentElement : sec; const r = box.getBoundingClientRect(), top = r.top + scrollY, light = sec.dataset.theme === 'light', fade = light ? parseFloat(getComputedStyle(sec, '::after').height) || 0 : 0; return { top, bottom: top + r.height - fade / 2, light, glass: sec.dataset.header === 'glass' }; });
  };
  ScrollTrigger.addEventListener('refresh', mapZones);
  // גובה התוכן משתנה גם בלי refresh (פונטים שנטענים, סינון המאמרים): מודדים את האזורים מחדש
  if (window.ResizeObserver && $('main')) { let raf = 0; new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(mapZones); }).observe($('main')); }
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
