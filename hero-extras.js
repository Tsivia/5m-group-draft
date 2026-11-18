/* תוספות להירו: 1) 95 ו-5 נספרים מ-0 כשהאתר נפתח.
   2) מדי פעם כמה ציפורים אמיתיות (מצילום) חוצות את השמיים מאחורי הזכוכית, קטנות ועדינות.
   העננים הנעים מצוירים ב-hero-scene.js. */
(() => {
  const hero = document.querySelector('.hero');
  const bg = document.querySelector('.hero__bg');
  if (!hero || !bg) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loading = () => document.documentElement.classList.contains('is-loading');

  /* ---------- ספירה של 95 ו-5 ---------- */
  const nums = [...hero.querySelectorAll('.hero__num')];
  const finals = nums.map(n => parseInt(n.textContent, 10) || 0);
  function countUp() {
    nums.forEach((n, i) => {
      n.style.width = ''; n.textContent = finals[i];
      if (reduce) return;
      n.style.width = n.getBoundingClientRect().width + 'px';   // רוחב קבוע: התיאורים לא זזים בזמן הספירה
      n.textContent = '0';
      const t0 = performance.now() + 250 + i * 160, dur = 1800;
      const step = now => {
        const t = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - t, 3);
        n.textContent = Math.round(finals[i] * e);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  if (!reduce) nums.forEach(n => (n.textContent = '0'));
  const startCount = () => (loading() ? setTimeout(startCount, 100) : setTimeout(countUp, 200));
  startCount();

  /* ---------- יישור: ה-5% בדיוק בגובה הכותרת שמימין ("5M Group הוא בית..."), ה-95% מעליו ---------- */
  const brand = hero.querySelector('.hero__brand'), lead = hero.querySelector('.hero__lead'), five = hero.querySelector('.hero__stat--few .hero__stat-n');
  const DIGIT_C = .5;   // מרכז הספרות בתוך התיבה שלהן
  function alignFive() {
    if (!brand || !lead || !five) return;
    if (innerWidth <= 1100) { brand.style.top = ''; return; }
    const hr = hero.getBoundingClientRect(), lr = lead.getBoundingClientRect(), fr = five.getBoundingClientRect(), br = brand.getBoundingClientRect();
    const d = (lr.top + lr.bottom) / 2 - (fr.top + fr.height * DIGIT_C);
    if (Math.abs(d) > .5) brand.style.top = (br.top - hr.top + d).toFixed(1) + 'px';
  }
  alignFive();
  if (document.fonts) document.fonts.ready.then(alignFive);
  addEventListener('resize', () => requestAnimationFrame(alignFive));
  new MutationObserver(() => requestAnimationFrame(alignFive)).observe(hero, { attributes: true, attributeFilter: ['style'] });   // כשקו הרגליים מתעדכן

  /* ---------- ציפורים ---------- */
  if (reduce) return;
  // סנוניות מצילום אמיתי (מוארות מאחור, כמו בזריחה). שלבי מכת כנף: למעלה, באמצע, למטה, חוזרות; ו-5 היא גלישה
  const FRAMES = ['assets/bird-1.png', 'assets/bird-2.png', 'assets/bird-3.png', 'assets/bird-4.png', 'assets/bird-5.png'];
  const CYCLE = [0, 1, 2, 3], GLIDE = 4;
  FRAMES.forEach(src => { const im = new Image(); im.src = src; });
  // הקופסה חתוכה בדיוק לזכוכית (הציפורים עוברות מאחורי המסגרת), ובתוכה שכבת שמיים שזזה עם הנוף (תלת-מימד)
  const box = document.createElement('div');
  box.className = 'hero-birds'; box.setAttribute('aria-hidden', 'true');
  const sky = document.createElement('div'); sky.className = 'hero-birds__sky'; box.appendChild(sky);
  bg.appendChild(box);
  let flockT = 0, dir = -1;
  function bird(W, H, x0, x1, y, lag, dur, size) {
    const b = document.createElement('div'); b.className = 'hero-bird';
    b.style.width = size + 'px'; b.style.height = size * .87 + 'px';
    b.style.opacity = (.48 + Math.random() * .2).toFixed(2);          // שקופות ורחוקות
    if (dir > 0) b.style.scale = '-1 1';                                // התמונות פונות שמאלה; ימינה במראה
    const L = [document.createElement('i'), document.createElement('i')];
    L.forEach(l => { l.style.backgroundImage = 'url(' + FRAMES[GLIDE] + ')'; b.appendChild(l); });
    L[0].classList.add('on');
    sky.appendChild(b);
    // מסלול רך: קשת אחת עדינה, בלי קפיצות
    const arc = (Math.random() - .5) * H * .07, wob = H * (.006 + Math.random() * .008), ph = Math.random() * 6.28, keys = [];
    for (let k = 0; k <= 48; k++) { const t = k / 48, tx = t + .025 * Math.sin(t * 6.28 + ph); keys.push({ transform: 'translate(' + (x0 + (x1 - x0) * tx).toFixed(2) + 'px,' + (y + arc * Math.sin(Math.PI * t) + wob * Math.sin(t * 4.2 + ph)).toFixed(2) + 'px)' }); }
    const anim = b.animate(keys, { duration: dur, delay: lag, easing: 'linear', fill: 'both' });
    // מכות כנף רגועות, ושתי שכבות שמתחלפות ברכות; הרבה גלישה
    let f = 0, glide = 4 + Math.floor(Math.random() * 6), last = 0, cur = 0, alive = true, shown = GLIDE;
    const fps = 9 + Math.random() * 3;
    const show = idx => { if (idx === shown) return; shown = idx; const nx = 1 - cur; L[nx].style.backgroundImage = 'url(' + FRAMES[idx] + ')'; L[nx].classList.add('on'); L[cur].classList.remove('on'); cur = nx; };
    const flap = now => {
      if (!alive) return;
      if (now - last > 1000 / fps) {
        last = now;
        if (glide > 0) { glide--; show(GLIDE); }
        else { f = (f + 1) % CYCLE.length; show(CYCLE[f]); if (f === 0 && Math.random() < .55) glide = 6 + Math.floor(Math.random() * 10); }
      }
      requestAnimationFrame(flap);
    };
    requestAnimationFrame(flap);
    anim.onfinish = () => { alive = false; b.remove(); };
  }
  function flock() {
    if (!loading() && scrollY < innerHeight * .3 && box.clientWidth > 0 && !document.hidden) {
      const W = box.clientWidth, H = box.clientHeight;
      const n = 3 + Math.floor(Math.random() * 4);                 // להקה קטנה: 3 עד 6 סנוניות
      const y0 = H * (.1 + Math.random() * .18), dur = 11000 + Math.random() * 4000;
      const spreadX = 160 + n * 45, spreadY = H * (.1 + Math.random() * .08);   // מפוזרות
      // תמיד מימין לשמאל (ההיפוך לכיוון השני היה משקף גם את המסלול, והציפורים קפצו בקצה השמאלי ויצאו).
      // מתחילות ונגמרות רחוק מספיק מחוץ לזכוכית, כך שגם כשהשמיים זזים עם העכבר והמסלול מתנדנד אף ציפור לא מציצה בקצה
      const M = Math.ceil(W * .09 + 36);
      for (let i = 0; i < n; i++) {
        const size = 12 + Math.random() * 6;
        const ox = Math.random() * spreadX, oy = (Math.random() - .5) * spreadY;
        const lag = ox * 9 + Math.random() * 200;
        const x0 = W + M, x1 = -M - size;
        const d = dur * (x0 - x1) / (W + 60);                            // אותה מהירות כמו קודם
        bird(W, H, x0, x1, y0 + oy, lag, d * (.94 + Math.random() * .12), size);
      }
    }
    flockT = setTimeout(flock, 12000 + Math.random() * 9000);   // מדי פעם
  }
  flockT = setTimeout(flock, 4000);
  // המיקום: הזכוכית בפועל (כולל הזום והתזוזה של החדר עם העכבר), מוקטנת מעט כך שהציפורים נעלמות מתחת למסגרת
  const place = () => {
    const r = window.heroGlassLive && window.heroGlassLive();
    if (r) {
      const hb = bg.getBoundingClientRect(), ins = 5;
      box.style.transform = 'translate(' + (r.x - hb.left + ins) + 'px,' + (r.y - hb.top + ins) + 'px)';
      box.style.width = (r.w - ins * 2) + 'px'; box.style.height = (r.h - ins * 2) + 'px';
      sky.style.transform = 'translate(' + (r.vx || 0).toFixed(1) + 'px,' + (r.vy || 0).toFixed(1) + 'px)';
    }
    box.style.opacity = scrollY < innerHeight * .35 ? '1' : '0';
    requestAnimationFrame(place);
  };
  requestAnimationFrame(place);
})();
