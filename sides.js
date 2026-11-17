/* =========================================================
   5M · "מצד אחד / ומצד שני": סקשן אחד מוצמד
   ---------------------------------------------------------
   הסקשן ממתין שקוף מעל סוף ההירו. כשהתמונה של ההירו כבר נעלמה
   לכחול, הוא נעצר, ואז הטקסט נכנס (בזמן, לא בגלילה).
   בהמשך הגלילה הטקסט מתחלף ל"ומצד שני". עובד גם אחורה.
   בלי GSAP או עם העדפה לתנועה מופחתת: שני המצבים זה אחרי זה.
   ========================================================= */
(function () {
  const section = document.querySelector('[data-sides]');
  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  if (!section || !gsap || !ScrollTrigger) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);
  // גלילה חלקה (Lenis), מסונכרנת עם ScrollTrigger: בלי קפיצות ובלי תחושה של תקיעה
  if (window.Lenis) {
    // גלילה רכה: זמן גלישה קצת ארוך יותר והאטה עדינה בסוף, כך שהיא מרגישה חלקה ולא נתקעת
    const lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, wheelMultiplier: 1.45, touchMultiplier: 2, anchors: true }); window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    // לפני ש-GSAP מצייר את הפריים: הגלילה נקבעת כשהעמוד עוד מסודר, בלי לכפות עליו סידור מחדש באמצע הפריים
    gsap.ticker.add(t => lenis.raf(t * 1000), false, true);
    gsap.ticker.lagSmoothing(0);
  }
  section.classList.add('is-live');

  const A = section.querySelector('.sides__state--a');
  const B = section.querySelector('.sides__state--b');
  const lines = s => s.querySelectorAll('.sides__title > span');
  const texts = s => s.querySelectorAll('.sides__pt');
  /* הטקסט הרץ נכנס שורה אחרי שורה: מפצלים לפי מילים (ההדגשות נשמרות), מזהים את השורות לפי הגובה שלהן במסך,
     וכל שורה עולה מעט מלמטה ונכנסת, בהפרש קצר בין שורה לשורה. בזמן, לא בגלילה */
  const wordSplit = els => { const out = [];
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) { const fr = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(part => { if (!part) return;
          if (/^\s+$/.test(part)) fr.appendChild(document.createTextNode(part));
          else { const sp = document.createElement('span'); sp.className = 'lw'; sp.style.display = 'inline-block'; sp.textContent = part; fr.appendChild(sp); out.push(sp); } });
        c.replaceWith(fr); }
      else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c); });
    els.forEach(walk); gsap.set(out, { autoAlpha: 0, y: 26 }); return out; };
  const LINE_GAP = .09;                                           // שניות בין שורה לשורה
  const lineTl = new WeakMap();
  const playLines = (words, gap = LINE_GAP) => { if (!words.length) return; lineTl.get(words[0])?.kill();
    let top = null, n = -1; const ln = words.map(w => { const t = Math.round(w.getBoundingClientRect().top); if (top === null || Math.abs(t - top) > 6) { n++; top = t; } return n; });
    lineTl.set(words[0], gsap.to(words, { autoAlpha: 1, y: 0, duration: .75, ease: 'power3.out', stagger: i => ln[i] * gap })); };
  const hideLines = words => { if (!words.length) return; lineTl.get(words[0])?.kill(); gsap.set(words, { autoAlpha: 0, y: 26 }); };
  // מפעיל בתוך טיימליין: נכנס כשעוברים את הנקודה, ונעלם כשחוזרים אחורה
  // gap 0: כל הפסקה נכנסת יחד (ב"מצד אחד" וב"ומצד שני", לבקשת צביה)
  const linesAt = (words, gap) => ({ duration: .01, onStart: () => playLines(words, gap), onReverseComplete: () => hideLines(words) });
  const rows = s => s.querySelectorAll('.sides__points li');
  // כותרת אות אחרי אות: מפצלים את השורות לאותיות (אין ניקוד, אז העברית לא נשברת). קורא מסך מקבל את הטקסט המלא
  const chars = s => { const h = s.querySelector('.sides__title'); h.setAttribute('aria-label', [...lines(s)].map(l => l.textContent).join(' '));
    lines(s).forEach(l => { l.setAttribute('aria-hidden', 'true'); l.innerHTML = l.textContent.split(' ').map(w => '<span style="display:inline-block;white-space:nowrap">' + [...w].map(c => '<span class="sides__ch" style="display:inline-block">' + c + '</span>').join('') + '</span>').join(' '); });
    return s.querySelectorAll('.sides__ch'); };
  const charsA = chars(A), charsB = chars(B);
  const LETTER = { autoAlpha: 0, y: 26, rotateX: -60 };

  /* ---------- כניסה: הכותרת, ואז כל שורה בתורה: העיגול קופץ והטקסט עולה ---------- */
  const house = section.querySelector('.sides__house');
  // מעבר קולנועי מההירו (רק בעמוד הכחול, שבו יש מרווח גלילה אחרי ההירו): הבית כבר נראה דרך החלון, אז הוא לא נכנס שוב
  const cine = !section.classList.contains('sides--light') && !!document.querySelector('.story__runway');
  if (!cine) gsap.set(house, { autoAlpha: 0, y: 30 });
  gsap.set(charsA, LETTER);
  gsap.set(texts(A), { autoAlpha: 0, y: 22 });
  const wordsA = wordSplit([...texts(A)]);
  gsap.set(rows(A), { '--ic': 0 });
  const intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
    .to(cine ? {} : house, cine ? { duration: .01 } : { autoAlpha: 1, y: 0, duration: 1.4 }, 0)
    .to(charsA, { autoAlpha: 1, y: 0, rotateX: 0, duration: .7, stagger: .035, ease: 'back.out(1.8)' }, .1)
    .to(rows(A), { '--ic': 1, duration: .5, stagger: .13, ease: 'back.out(2.2)' }, .95)
    .set(texts(A), { autoAlpha: 1, y: 0 }, 1.0)
    .to({}, linesAt(wordsA, 0), 1.0);

  /* ---------- בגלילה: "מצד אחד" יוצא, "ומצד שני" נכנס ---------- */
  gsap.set(B, { autoAlpha: 0 });
  gsap.set(charsB, LETTER);
  const maze = section.querySelector('.sides__maze'), visual = section.querySelector('.sides__visual');
  gsap.set(maze, { autoAlpha: 0, scale: 1.08 });
  gsap.set(texts(B), { autoAlpha: 0, y: 22 });
  const wordsB = wordSplit([...texts(B)]);

  /* המשולש של הלוגו עובר בין האזורים: יוצא מחלון הבית ושוקע לתוך החדר שבמרכז המבוך.
     המיקומים נמדדים מהתמונות עצמן (שבר מגודל התמונה), ולכן נכונים בכל רוחב מסך */
  const tri = section.querySelector('.sides__tri');
  const WIN = { l: .6528, t: .0814, w: .0892, h: .3066 };   // החלון המשולש בבית (house-hero)
  // החדר המשולש במבוך (נמדד מהכתום שבתמונה). כל תמונת מבוך מגדירה אותו בעצמה (data-room: l,t,w,h)
  const ROOM = (() => { const r = (section.querySelector('.sides__maze--lit')?.dataset.room || '.423,.279,.170,.308').split(',').map(Number); return { l: r[0], t: r[1], w: r[2], h: r[3] }; })();
  const inImg = (f, x0, y0, W, H) => ({ x: x0 + f.l * W, y: y0 + f.t * H, w: f.w * W, h: f.h * H });
  const win = () => inImg(WIN, visual.offsetLeft + house.offsetLeft, visual.offsetTop + house.offsetTop, house.offsetWidth, house.offsetHeight);
  // שלוש הפינות של הזכוכית המשולשת, כפי שהן בצילום (כולל הפרספקטיבה: הבסיס יורד מעט ימינה).
  // A קודקוד עליון, B פינה שמאלית תחתונה, C פינה ימנית תחתונה. נמדד בפיקסלים מהמקור של house-hero (2752x1536)
  // כל תמונת בית מגדירה את הפינות שלה (data-win בפיקסלים של המקור, data-win-size גודל המקור), כי בעמוד הלבן יש בית אחר
  const WINPTS = (() => { const sz = (house.dataset.winSize || '2752,1536').split(',').map(Number);
    const p = (house.dataset.win || '1796.5,125 1796.5,564 2042,596').split(' ').map(s => s.split(',').map(Number)).map(q => [q[0] / sz[0], q[1] / sz[1]]);
    return { A: p[0], B: p[1], C: p[2] }; })();
  // לפי המיקום האמיתי על המסך, יחסית לשכבה של המנסרה (כולל פס הגלילה, שבעברית נמצא משמאל)
  const winPts = () => { const r = house.getBoundingClientRect(), c = triCanvas.getBoundingClientRect();
    const p = k => [r.left - c.left + WINPTS[k][0] * r.width, r.top - c.top + WINPTS[k][1] * r.height];
    return { A: p('A'), B: p('B'), C: p('C') }; };
  const room = () => inImg(ROOM, maze.offsetLeft, maze.offsetTop, maze.offsetWidth, maze.offsetHeight);
  // הפתח של החדר המשולש במבוך (שלוש הפינות של שפת הקירות, בשברים מהתמונה): A הקודקוד הרחוק, B הפינה הישרה, C הפינה השלישית.
  // המשולש נוחת ושוכב בדיוק בפתח הזה, באותה פרספקטיבה של התמונה
  const SEAT = (() => { const p = (section.querySelector('.sides__maze--lit')?.dataset.seat || '').split(' ').map(s => s.split(',').map(Number)); return p.length === 3 ? { A: p[0], B: p[1], C: p[2] } : null; })();
  const seatPts = () => { if (!SEAT) return null; const r = maze.getBoundingClientRect(), c = triCanvas.getBoundingClientRect();
    const f = k => [r.left - c.left + SEAT[k][0] * r.width, r.top - c.top + SEAT[k][1] * r.height];
    return { A: f('A'), B: f('B'), C: f('C'), depth: (+(section.querySelector('.sides__maze--lit')?.dataset.seatDepth) || 0) * r.height }; };
  // הרגע הגדול: המשולש גדול ופונה אלינו, באמצע הצד השמאלי (במובייל: באמצע), כדי שיבינו מה רואים
  const big = () => { const W = section.offsetWidth, H = section.offsetHeight, mob = W <= 900;
    const h = Math.min(H * (mob ? .34 : .52), W * (mob ? .3 : .21) / .511), w = h * .511;
    return { x: W * (mob ? .5 : .27) - w / 2, y: H * (mob ? .24 : .46) - h / 2, w, h }; };
  // ממש מעל החדר, רגע לפני שהוא נוחת
  const hover = () => { const b = room(); return { x: b.x, y: b.y - innerHeight * .1, w: b.w, h: b.h }; };
  // בין האזורים: מרחף באמצע המסך
  const float = () => slotOf(bigRect());
  // בתחתית החדר: עומד בפנים, כמעט כולו מתחת לשפת הקירות (הקירות מסתירים אותו)
  const deep = () => { const b = room(); return { x: b.x, y: b.y + b.h * .85, w: b.w, h: b.h }; };
  const stand = () => { const b = room(); return { x: b.x, y: b.y - innerHeight * .2 - b.h * .25, w: b.w, h: b.h }; };   // מעל המבוך, אחרי שעלה מהחדר   // בין האזורים: המשולש של הלוגו הגדול במרכז המסך
  const floatOld = () => { const W = innerWidth, H = innerHeight, h = H * (W <= 900 ? .26 : .34), w = h * .511;
    return { x: W / 2 - w / 2, y: H * .44 - h / 2, w, h }; };
  const at = (r, extra) => Object.assign({ x: () => r().x, y: () => r().y, w: () => r().w, h: () => r().h }, extra);
  /* הלוגו המלא: כשהמסך נהיה לבן, המשולש הוא כבר המשולש של לוגו גדול במרכז המסך (האותיות מופיעות סביבו),
     ובאזור הבא הלוגו כולו מתקטן ונוסע למקום שלו. האותיות בשכבה קבועה משלהן, והמשולש (התלת-ממדי) נשאר המשולש שלהן */
  const LOGO_SLOT = { l: .4836, t: .1756, w: .2899, h: .8189 };   // המשולש בתוך הלוגו (מהווקטור של הפיגמה)
  const ratLogo = document.querySelector('.rat__logo-wrap');
  const cRect = () => (document.querySelector('.tri3d') || document.documentElement).getBoundingClientRect();
  // הלוגו הגדול על המסך הלבן: קטן מעט וגבוה מהאמצע, כדי שהמשפחה שבתחתית תיראה
  const bigRect = () => { const c = cRect(), w = Math.min(innerWidth * (innerWidth <= 900 ? .5 : .19), innerHeight * .29 * 490 / 338.1), h = w * 338.1 / 490;
    return { x: (innerWidth - w) / 2 - c.left, y: innerHeight * .33 - h / 2 - c.top, w, h }; };   // הלוגו המעודכן גבוה יותר (GROUP מתחת): קטן וגבוה כדי שהמשפחה תיראה
  const finalRect = () => { if (!ratLogo) return bigRect(); const r = ratLogo.getBoundingClientRect(), c = cRect(), s = +gsap.getProperty(ratLogo, 'scale') || 1;
    const w = r.width / s, h = r.height / s; return { x: r.left + (r.width - w) / 2 - c.left, y: r.top + (r.height - h) / 2 - c.top, w, h }; };
  const FLY = { p: 0, o: 0, out: 0, tri: 0 };   // tri: המשולש השטוח של הלוגו   // p: ממרכז המסך (0) למקום (1). o: הופעה בסוף האזור הכהה. out: היעלמות כשהלוגו האמיתי מחליף אותו
  // הלוגו התלת-ממדי: אחרי שהלוגו נוחת במקום שלו, האותיות הופכות לפסל באותו חומר ועומק של המשולש, גדלות מעט ונוטות קלות
  const LOGO3D = { on: 0, g: 1, rx: 0, ry: 0, rect: () => finalRect() };
  const flyRect = () => { const a = bigRect(), b = finalRect(), t = FLY.p; return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t }; };
  const slotOf = r => ({ x: r.x + LOGO_SLOT.l * r.w, y: r.y + LOGO_SLOT.t * r.h, w: LOGO_SLOT.w * r.w, h: LOGO_SLOT.h * r.h });
  let flyEl = null, flyT = null;
  if (ratLogo) {
    flyEl = document.createElement('div'); flyEl.className = 'logo-fly'; flyEl.setAttribute('aria-hidden', 'true');
    const svg = ratLogo.querySelector('svg').cloneNode(true);
    svg.querySelectorAll('.rat__neon').forEach(n => n.remove());
    svg.querySelectorAll('[id]').forEach(n => { const id = n.id; n.id = 'fly-' + id; svg.querySelectorAll('[href="#' + id + '"]').forEach(u => u.setAttribute('href', '#fly-' + id)); });
    svg.querySelectorAll('.rat__logo-n').forEach(g => { g.removeAttribute('class'); g.removeAttribute('style'); });
    svg.querySelectorAll('.rat__logo-t').forEach(g => { g.removeAttribute('class'); g.removeAttribute('style'); g.setAttribute('data-fly-t', ''); g.style.opacity = 0; });
    flyEl.appendChild(svg); document.body.appendChild(flyEl); flyT = svg.querySelector('[data-fly-t]');
  }
  // עד שהעמוד נטען עד הסוף, ScrollTrigger עוד מודד (ומרנדר את האנימציות בזמן המדידה), והלוגו הבזיק בענק מעל ההירו. לכן הוא מוסתר עד אז
  // כשהוא מוסתר ממילא לא מודדים ולא מזיזים אותו (מדידה וגודל חדש בכל פריים הכבידו על הגלילה)
  let flyShown = true;
  const placeFly = () => { if (!flyEl) return; const a = document.readyState === 'complete' ? FLY.o * (1 - FLY.out) : 0;
    if (a <= 0 && !flyShown) { flyT && (flyT.style.opacity = FLY.tri); return; }
    flyShown = a > 0; const r = flyRect(), c = cRect();
    gsap.set(flyEl, { x: r.x + c.left, y: r.y + c.top, width: r.w, height: r.h, autoAlpha: a });
    flyT && (flyT.style.opacity = FLY.tri); };
  addEventListener('resize', placeFly);
  [house, maze].forEach(i => i.complete || i.addEventListener('load', () => ScrollTrigger.refresh(), { once: true }));

  /* המשולש עצמו: מנסרה תלת-ממדית מוארת (three.js), בשכבה קבועה מעל כל העמוד. בלי WebGL: המשולש השטוח כגיבוי */
  // lock: 1 = המשולש יושב בדיוק בפתח שלו בבית (בפרספקטיבה של הצילום). pull: כמה הוא נשלף מהקיר.
  // mat: 0 = הפנים שלו הם הזכוכית המוארת מהצילום עצמו, 1 = החומר של הפסל
  const S = { x: 0, y: 0, w: 1, h: 1, rx: 0, ry: 0, rz: 0, o: 0, lock: 0, pull: 1, mat: 1, seat: 0, lift: 0, inside: 0, sink: 0 };   // sink: שוקע לעומק החדר   // inside: הקירות של החדר מסתירים אותו   // lift: עולה ישר מתוך החדר   // seat: 1 = שוכב בפתח של החדר במבוך
  const SEA = { v: 0 };                                      // 0 = הים נראה כרקע עדין, 1 = נעלם לגמרי
  const triCanvas = document.querySelector('.tri3d');
  if (triCanvas && window.THREE) document.documentElement.classList.add('has-tri3d');
  // המנסרה (three.js): יצירה והרכבת השיידרים חוסמות את הדפדפן ואת כרטיס המסך לשנייה-שתיים.
  // בזמן מסך הטעינה היא נבנית רק אחרי שהלוגו סיים להיבנות (רק הפס הדק עוד זז), ומסך הטעינה מחכה לה.
  // עד אז (או בלי WebGL) המשולש השטוח משמש גיבוי
  let prism = null;
  const startPrism = () => {
    prism = createPrism(triCanvas, house, WINPTS, winPts, seatPts);
    if (prism) { tri.remove(); try { prism.warm(); } catch (e) {} requestAnimationFrame(() => drawTri()); }
    else document.documentElement.classList.remove('has-tri3d');
    dispatchEvent(new Event('prism-ready'));
  };
  if (triCanvas && window.THREE) startPrism();   // הסקריפט הזה רץ רק אחרי שהלוגו של מסך הטעינה סיים להיבנות
  else { document.documentElement.classList.remove('has-tri3d'); dispatchEvent(new Event('prism-ready')); }
  const TURN = Math.PI * 2;
  let tl;
  // באזור הלבן רק האנימציה שלו קובעת איפה המשולש (על הלוגו שנוסע) וכמה הוא גלוי, גם אם האזור הקודם מתעדכן באותו רגע
  const RAT = { active: false, o: 0 };   // באזור הלבן המשולש כבר שטוח, חלק מהלוגו שנוסע
  const drawTri = () => {
    if (RAT.active) Object.assign(S, slotOf(flyRect())), S.o = RAT.o;
    placeFly();                                                // הלוגו שנוסע תמיד מסונכרן עם המצב (גם בגלילה אחורה)
    const live = tl && tl.time() > tl.labels.out;              // לפני היציאה מהחלון הוא לא קיים
    if (prism) return prism.draw(S, live ? S.o : 0, LOGO3D.on ? LOGO3D : null);
    gsap.set(tri, { x: S.x, y: S.y, width: S.w, height: S.h, autoAlpha: live ? S.o : 0, rotationY: S.ry * 57.3, rotationX: S.rx * 57.3, rotation: S.rz * 57.3, transformPerspective: 900 });
  };
  const white = section.querySelector('.sides__white'), lit = section.querySelector('.sides__maze--lit');
  const ratCity = document.querySelector('.rat__city') || {};
  if (ratCity.style) gsap.set(ratCity, { autoAlpha: 0 });
  // הבלון: נע ברוח. מתנדנד סביב היד של הילדה (נקודות בפיקסלים של התמונה), החוט תמיד מהיד אל הקשר, והבלון מסתובב מעט סביב הקשר
  (() => {
    const bal = document.querySelector('.rat__balloon'), str = document.querySelector('.rat__string');
    if (!bal || !str || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const HX = 1902, HY = 690, KX = 1978, KY = 499, BX = 40, BY = 107;   // היד, הקשר, והקשר בתוך תמונת הבלון
    const L = Math.hypot(KX - HX, HY - KY), A0 = Math.atan2(KX - HX, HY - KY);
    let on = false;
    const tick = () => {
      const t = performance.now() / 1000;
      const a = A0 + .075 * Math.sin(t * .62) + .028 * Math.sin(t * 1.7 + 1.1);
      const l = L * (1 + .014 * Math.sin(t * 1.05 + .4));
      const kx = HX + l * Math.sin(a), ky = HY - l * Math.cos(a);
      const bend = 7 * Math.sin(t * .9 + .6), mx = (HX + kx) / 2 - bend * Math.cos(a), my = (HY + ky) / 2 - bend * Math.sin(a);
      str.setAttribute('d', `M${HX} ${HY} Q${mx.toFixed(1)} ${my.toFixed(1)} ${kx.toFixed(1)} ${ky.toFixed(1)}`);
      bal.setAttribute('transform', `translate(${(kx - KX).toFixed(2)} ${(ky - KY).toFixed(2)}) rotate(${((a - A0) * 57.3 * .7).toFixed(2)} ${KX} ${KY})`);
    };
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !on) { on = true; gsap.ticker.add(tick); } else if (!e.isIntersecting && on) { on = false; gsap.ticker.remove(tick); } })).observe(ratCity);
  })();
  const dotsEl = section.querySelector('.sides__dots') || {};
  const dots = createDots(section.querySelector('.sides__dots'), maze, section.classList.contains('sides--light'));

  tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onUpdate: drawTri })
    .to({}, { duration: .25 })                                     // המשולש יוצא כמעט מיד
    .addLabel('out')
    .to(A, { autoAlpha: 0, y: -24, duration: .6, ease: 'power1.in' }, 'out+=1.3')   // הטקסט נשאר בזמן שהמשולש יוצא
    // 1. המשולש הוא הזכוכית המוארת עצמה: יושב בדיוק בפתח, באותם פיקסלים, ומתחתיו החלון כבר כבוי (אין שני משולשים)
    .set(S, at(win, { rx: 0, ry: 0, rz: 0, o: 1, lock: 1, pull: 0, mat: 0 }), 'out')
    .set(section.querySelector('.sides__house--off'), { opacity: 1 }, 'out')
    // הפתח מגיב: כשהמשולש משתחרר, נשאר בזכוכית הריקה אור חם עמום מהחדר, והוא דועך (לא עוד משולש: שטוח, חלש, בלי נפח)
    .fromTo(section.querySelector('.sides__afterglow'), { opacity: 0 }, { opacity: .5, duration: .3, ease: 'power1.out', immediateRender: false }, 'out+=.32')
    .to(section.querySelector('.sides__afterglow'), { opacity: 0, duration: .75, ease: 'power1.in' }, 'out+=.62')
    // נשלף ישר החוצה מהקיר, לאורך כל העובי שלו, בלי להסתובב. מה שעוד בתוך הקיר לא נראה
    .to(S, { pull: 1, duration: .45, ease: 'power2.inOut' }, 'out+=.04')
    .to(S, { mat: 1, duration: .6, ease: 'power1.inOut' }, 'out+=.22')         // הזכוכית הופכת לחומר של הפסל
    // 2. רק כשהוא חופשי: משתחרר מהזווית של הקיר, יוצא וגדל, ונעצר רגע גדול מולנו
    .to(S, { lock: 0, duration: 1.05, ease: 'power2.inOut' }, 'out+=.45')
    // תוך כדי מסתובב בעדינות מהזווית של הקיר אל הצד השני, כך שהצלע האלכסונית והעובי שלו נקראים ברגע הגדול
    // (הוא משמאל למרכז המסך, אז סיבוב לכיוון הזה מוסיף לפרספקטיבה במקום לבטל אותה)
    .to(S, at(big, { rx: .06, ry: -.32, rz: -.02, duration: 1.05, ease: 'power2.inOut' }), 'out+=.45')
    .to(S, { ry: -.38, duration: .8, ease: 'sine.inOut' }, 'out+=1.5')               // נשימה קטנה ברגע הגדול
    .to(visual, { autoAlpha: 0, duration: .9, ease: 'power1.in' }, 'out+=.7')
    .to(maze, { autoAlpha: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, 'out+=1.7')
    .fromTo(dotsEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4, ease: 'power1.out', immediateRender: false }, 'out+=1.7')   // רצפת הנקודות עולה עם המבוך
    // רקע הים (שנשאר עדין מאחורי "מצד אחד") נעלם לגמרי לפני שהמבוך עולה: באזור המבוך יש רק כחול כהה
    .to(SEA, { v: cine ? 1 : 0, duration: .8, ease: 'power1.inOut', onUpdate: () => { window.heroSeaOff = SEA.v; } }, 'out+=1.1')
    // 3. סיבוב אחד בלבד, רגוע, תוך כדי שהוא יורד אל מעל החדר ונוטה מעט כמו שמסתכלים עליו מלמעלה. ואז נכנס פנימה והחדר נדלק
    .to(S, { ry: Math.PI, duration: 1.3, ease: 'power1.inOut' }, 'out+=2.2')   // חצי סיבוב רך: מגיע אל הפתח כבר בצד שמתאים לצורה שלו, אז הוא נשכב לתוכו בלי להתהפך
    .to(S, at(hover, { rx: .14, rz: 0, duration: 1.3, ease: 'power2.inOut' }), 'out+=2.2')
    // צולל פנימה לחדר ונעלם בתוכו, והחדר נדלק: רואים בעיקר את האור, לא את המשולש עצמו
    // צולל לתוך הפתח: הקירות של החדר מסתירים אותו בהדרגה בזמן שהוא יורד פנימה, ואז החדר נדלק
    // הכניסה: מעל הפתח הוא נשכב אל המישור של הפתח (באותה פרספקטיבה של המבוך), יורד לתוכו ושוקע לעומק,
    // הקירות הקדמיים מסתירים אותו בהדרגה, והחדר נדלק בזמן שהוא נבלע: בסוף רואים רק את האור
    .set(S, { inside: 1, lift: .5, sink: 0 }, 'out+=3.3')
    .to(S, { seat: 1, duration: .55, ease: 'power2.inOut' }, 'out+=3.3')
    .to(S, { lift: 0, duration: .5, ease: 'power2.in' }, 'out+=3.35')
    .to(S, { sink: 1, duration: .5, ease: 'power1.in' }, 'out+=3.85')
    .fromTo(lit, { autoAlpha: 0 }, { autoAlpha: 1, duration: .5, ease: 'power1.out' }, 'out+=3.75')
    .to(S, { o: 0, duration: .3, ease: 'power1.in' }, 'out+=4.05')
    .set(B, { autoAlpha: 1 }, 'out+=2.1')
    .to(charsB, { autoAlpha: 1, y: 0, rotateX: 0, duration: .5, stagger: .025, ease: 'back.out(1.8)' }, 'out+=2.15')
    .set(texts(B), { autoAlpha: 1, y: 0 }, 'out+=2.5')
    .to({}, linesAt(wordsB, 0), 'out+=2.5')
    .to({}, { duration: 1 })                                       // זמן לקרוא
    // 4. המשולש יוצא שוב מהמבוך (החדר כבה), עולה לאמצע, והרקע הופך ללבן לקראת מרוץ העכברים
    .addLabel('c')
    .set(S, at(deep, { rx: .14, ry: 0, rz: 0, o: 0, inside: 1, seat: 0, lift: 0, sink: 0 }), 'c')
    // 1. עולה מתוך האור של החדר, ישר למעלה, עומד (בלי שום סיבוב)
    .to(S, { o: 1, duration: .2, ease: 'none' }, 'c')
    .to(lit, { autoAlpha: 0, duration: .4, ease: 'power1.in' }, 'c+=.15')
    .to(S, at(stand, { rx: 0, duration: .65, ease: 'power2.inOut' }), 'c+=.1')   // עולה מתוך החדר: הקירות מסתירים את מה שעוד בפנים
    .set(S, { inside: 0 }, 'c+=.75')
    // 2. סיבוב אחד עדין ואיטי, תוך כדי שהוא טס אל המקום של המשולש בלוגו הגדול
    .to(S, at(float, { rz: 0, duration: 1.15, ease: 'power2.inOut' }), 'c+=.7')
    .to(S, { ry: TURN, duration: 1.3, ease: 'sine.inOut' }, 'c+=.65')
    // כשהמסך נהיה לבן: האותיות של הלוגו מופיעות במרכז, והמשולש נכנס למקום שלו ביניהן
    .fromTo(FLY, { o: 0 }, { o: 1, duration: .55, ease: 'power1.out', immediateRender: false, onUpdate: placeFly, onReverseComplete: placeFly }, 'c+=.95')
    .to(B, { autoAlpha: 0, duration: .6, ease: 'power1.in' }, 'c')
    .to(maze, { autoAlpha: 0, duration: .8, ease: 'power1.in' }, 'c+=.5')
    .to(dotsEl, { autoAlpha: 0, duration: .8, ease: 'power1.in' }, 'c+=.5')
    .fromTo(white, { opacity: 0 }, { opacity: 1, duration: .8, ease: 'power1.inOut', immediateRender: false }, 'c+=.7')
    // תמונת המשפחה של מרוץ העכברים מופיעה רק אחרי שהמסך כבר לבן לגמרי (בלי פס מטושטש מעל המבוך הכהה)
    .fromTo(ratCity, { autoAlpha: 0 }, { autoAlpha: 1, duration: .6, ease: 'power1.inOut', immediateRender: false }, 'c+=1.55')
    // נכנס למקום שלו בלוגו: הופך למשולש השטוח של הלוגו, בצבע המקורי, כמו שאר האותיות
    .fromTo(FLY, { tri: 0 }, { tri: 1, duration: .3, ease: 'power1.inOut', immediateRender: false, onUpdate: placeFly, onReverseComplete: placeFly }, 'c+=1.8')
    .to(S, { o: 0, duration: .3, ease: 'power1.inOut' }, 'c+=1.8')
    .to({}, { duration: .3 });
  drawTri();
  // ScrollTrigger מרנדר את האנימציות בזמן המדידה (בלי אירועים) ואז מחזיר אותן: מציירים שוב לפי המצב האמיתי,
  // כדי שהלוגו שנוסע והמשולש לא יישארו גלויים בטעות (למשל על ההירו)
  ScrollTrigger.addEventListener('refresh', () => { RAT.active = false; requestAnimationFrame(() => { const r = ScrollTrigger.getAll().find(x => x.pin && x.animation && x.animation !== tl); RAT.active = !!(r && r.animation.progress() > 0); drawTri(); }); });
  document.readyState === 'complete' ? requestAnimationFrame(drawTri) : addEventListener('load', () => requestAnimationFrame(drawTri), { once: true });
  // המשולש התלת-ממדי מתחמם מראש, ברגע פנוי אחרי הטעינה, ולא ברגע שהגולל מגיע אליו

  /* ---------- הרקע: נוף לילה עם מפת עומק, זז עם העכבר (כמו בהירו) ---------- */
  const light = section.classList.contains('sides--light');
  // בגרסה הקולנועית הרקע הזה מוסתר: לא פותחים בשבילו הקשר WebGL נוסף (חוסך זיכרון של כרטיס המסך)
  const bg = cine ? null : createBackdrop(section.querySelector('.sides__bg'), light);
  // הרקע סטטי: נצייר אותו פעם אחת, ושוב רק כשמשנים גודל חלון

  const enter = () => { section.classList.add('is-on'); intro.play(); };
  const leave = () => { section.classList.remove('is-on'); intro.reverse(); };

  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => '+=' + Math.round(innerHeight * 2.3),             // פחות גלילה: הכול זורם (לבקשת הלקוחות, מהודק יותר)
    pin: true,
    scrub: .4,
    animation: tl,
    invalidateOnRefresh: true,
    onEnter: light ? null : enter,
    onLeaveBack: light ? null : leave,
  });
  // בעמוד הלבן הסקשן עולה מתחת להירו, אז הטקסט והתמונה נכנסים כבר כשהוא באמצע המסך, לא רק כשהוא נעצר
  if (light) ScrollTrigger.create({ trigger: section, start: 'top 55%', onEnter: enter, onLeaveBack: leave });
  if (st.scroll() > st.start) { section.classList.add('is-on'); intro.progress(1); }   // נטען באמצע הדף

  /* ---------- מעבר קולנועי מההירו: אותה סצנה ממשיכה ----------
     בגלילה המצלמה של ההירו ממשיכה בזום, הדמויות והחדר (הקירות והחלון) נעלמים, ונשארים רק הים והשמש (hero-scene.js).
     הרקע הזה נשאר קבוע מאחורי האזור הזה, והבית עולה אל החוף יחד עם הגלילה */
  if (cine) {
    section.classList.add('is-cine');
    document.documentElement.classList.add('sea-bg');
  }

  addEventListener('resize', () => { bg && (bg.resize(), bg.draw()); prism && (prism.resize(), drawTri()); });

  /* ---------- מרוץ העכברים: הכותרת נכנסת אות אחרי אות, והמשולש מסתובב פעם אחת ונכנס למקום שלו בלוגו ---------- */
  const rat = document.querySelector('[data-rat]');
  if (rat) {
    rat.classList.add('is-live');
    const title = rat.querySelector('.rat__title');
    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
    const split = el => [...el.childNodes].forEach(n => {
      if (n.nodeType === 1) return split(n);
      if (n.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(' '));
        const w = document.createElement('span'); w.style.cssText = 'display:inline-block;white-space:nowrap';
        [...part].forEach(ch => { const s = document.createElement('span'); s.className = 'sides__ch'; s.style.display = 'inline-block'; s.textContent = ch; w.appendChild(s); });
        frag.appendChild(w);
      });
      n.replaceWith(frag);
    });
    rat.querySelectorAll('.rat__line').forEach(l => { l.setAttribute('aria-hidden', 'true'); split(l); });
    const charsR = rat.querySelectorAll('.sides__ch');
    const logo3d = rat.querySelectorAll('.rat__logo-n, .rat__logo-t, .rat__slogan');
    const logoWrap = rat.querySelector('.rat__logo-wrap'), logoN = rat.querySelector('.rat__logo-n'), logoT = rat.querySelector('.rat__logo-t');
    const texts = rat.querySelectorAll('.rat__text');
    const wordsR = wordSplit([...texts]);
    gsap.set(charsR, LETTER);
    gsap.set(logoN, { autoAlpha: 0 });
    gsap.set(logoT, { autoAlpha: prism ? 0 : 1 });
    gsap.set(texts, { autoAlpha: 0, y: 24 });
    // מקום המשולש בתוך הלוגו (נמדד מהווקטור של הפיגמה), ביחס למסך כשהסקשן עומד
    const SLOT = { l: .4836, t: .1756, w: .2899, h: .8189 };
    const slot = () => { const r = logoWrap.getBoundingClientRect(), s = rat.getBoundingClientRect();
      return { x: r.left - s.left + SLOT.l * r.width, y: r.top - s.top + SLOT.t * r.height, w: SLOT.w * r.width, h: SLOT.h * r.height }; };
    const ratTl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onUpdate: () => { RAT.active = ratTl.progress() > 0; drawTri(); } })
      // 1. הלוגו הגדול נשאר רגע במרכז, על רקע הבניינים
      .to({}, { duration: .55 })
      // 2. הלוגו כולו (האותיות והמשולש יחד) מתקטן ונוסע הצידה, אל המקום שלו
      .to(FLY, { p: 1, duration: 1.4, ease: 'power2.inOut' }, .55)
      // התמונה של המשפחה יורדת בעדינות, כדי שהטקסט שעולה במקום לא יעמוד על הדמויות
      .fromTo('.rat__city', { y: 0 }, { y: () => Math.min(innerWidth, 1920) / 1920 * 50, duration: 1.3, ease: 'power2.inOut' }, .65)
      // 3. במקום: הלוגו מתחלף בלוגו התלת-ממדי (מגניפיק), והמשולש נבלע במשולש שלו
      .to(logo3d, { autoAlpha: 1, duration: .35, ease: 'power1.out' }, 1.95)
      .to(FLY, { out: 1, duration: .35, ease: 'power1.out' }, 1.95)
      // 4. רק עכשיו: הכותרת, ואחריה הטקסט
      .to(charsR, { autoAlpha: 1, y: 0, rotateX: 0, duration: .6, stagger: .025, ease: 'back.out(1.8)' }, 2.05)
      .set(texts, { autoAlpha: 1, y: 0 }, 2.45)
      .to({}, linesAt(wordsR), 2.45)
      .to({}, { duration: 1.2 });
    // משולש הזהב עולה מעל הסקשן בזמן שהוא עדיין עומד: עוד מסך אחד של עצירה בסוף, באותה מהירות גלילה
    const RLEN = 1.4, cover = !!document.querySelector('.gt');
    if (cover) ratTl.to({}, { duration: ratTl.duration() / RLEN });
    ScrollTrigger.create({
      trigger: rat,
      start: 'top top',
      end: () => '+=' + Math.round(innerHeight * (RLEN + (cover ? 1 : 0))),
      pin: true,
      scrub: .4,
      animation: ratTl,
      invalidateOnRefresh: true,
      onEnter: () => rat.classList.add('is-on'),
      onLeaveBack: () => rat.classList.remove('is-on'),
    });
  }

  /* ---------- המסע וההדר ----------
     ההדר הסטיקי הופך ללבן ברגע שהרקע בהיר. כאן גם מחושב באיזה שלב של המסע אנחנו (לתפריט ההתקדמות שייבחר) */
  (() => {
    const header = document.querySelector('.site-header');
    const logoA = header && header.querySelector('.site-header__logo');
    if (logoA && !logoA.querySelector('.logo-on-light')) {
      const im = document.createElement('img'); im.className = 'logo-on-light'; im.src = 'assets/logo-5m.svg'; im.alt = ''; im.setAttribute('aria-hidden', 'true');
      logoA.appendChild(im);
    }
    const ratEl = document.querySelector('[data-rat]');
    // שדרת המסע: שלושה מקטעים, השם של כל פרק לאורך המקטע שלו
    const STEPS = [['1', 'מצד אחד'], ['2', 'ומצד שני'], ['3', 'היציאה מהמרוץ']];   // השמות רק לקוראי מסך
    const spine = document.createElement('nav'); spine.className = 'spine'; spine.setAttribute('aria-label', 'ההתקדמות במסע');
    spine.innerHTML = STEPS.map(([n, l], i) => '<button class="spine__seg" type="button" data-step="' + i + '"><span class="spine__text"><span class="spine__num">' + n + '</span><span class="spine__name">' + l + '</span></span><span class="spine__line"><i></i><span class="spine__dot"></span></span></button>').join('');
    document.body.appendChild(spine);
    const segs = [...spine.querySelectorAll('.spine__seg')];
    const pinned = () => ScrollTrigger.getAll().find(x => x.animation === tl);
    const ratST = () => ratEl && ScrollTrigger.getAll().find(x => x.trigger === ratEl && x.pin);
    const tB = () => tl.labels.out + 2.1, tW = () => tl.labels.c + .7;     // ומצד שני נכנס / המסך נהיה לבן
    const timeToY = (P, t) => P.start + (P.end - P.start) * Math.min(1, t / tl.duration());
    spine.addEventListener('click', e => {
      const b = e.target.closest('.spine__seg'); if (!b) return;
      const P = pinned(), R = ratST(), i = +b.dataset.step;
      const y = i === 0 ? P.start + 2 : i === 1 ? timeToY(P, tB() + .45) : (R ? R.start + (R.end - R.start) * .6 : timeToY(P, tl.duration()));
      scrollTo({ top: y, behavior: 'smooth' });
    });
    let last = '';
    let themeTick = 0, lastTheme = null, lastGlass = false;   // ההדר לפי האזור שמתחתיו: בודקים רק פעם בכמה פריימים
    let Pc = null, Rc, ly = -1, lt = -1, hh = header ? header.offsetHeight : 64, zones = null;
    // האזורים שאחרי מרוץ העכברים: איפה כל אחד מתחיל ונגמר בעמוד (כולל זמן הנעיצה). מחושב רק ב-refresh, ובגלילה רק משווים מספרים
    const mapZones = () => { zones = [...document.querySelectorAll('main > [data-theme], main > .pin-spacer > [data-theme]')].map(sec => { const box = sec.parentElement.classList.contains('pin-spacer') ? sec.parentElement : sec, r = box.getBoundingClientRect(), top = r.top + scrollY; return { top, bottom: top + r.height, light: sec.dataset.theme === 'light', glass: sec.dataset.header === 'glass' }; }); };
    ScrollTrigger.addEventListener('refresh', () => { Pc = null; ly = -1; hh = header ? header.offsetHeight : 64; zones = null; });
    gsap.ticker.add(() => {
      if (!Pc) { Pc = pinned(); Rc = ratST(); if (!Pc) return; }
      // המיקום מ-Lenis ולא scrollY: קריאה של scrollY אחרי ש-GSAP כתב סגנונות מכריחה את הדפדפן לסדר את כל העמוד מחדש
      const P = Pc, R = Rc, t = tl.time(), y = window.lenis ? Math.round(window.lenis.scroll) : scrollY;
      if (y === ly && t === lt) return; ly = y; lt = t;
      const on = y >= P.start - innerHeight * .25 && (!R || y <= R.end + innerHeight * .1);
      let isLight = (+(white.style.opacity || 0) > .5) || y >= P.end - 2 || (light && y >= P.start - innerHeight * .5);   // בעמוד הלבן האזור כולו בהיר
      // אחרי מרוץ העכברים: ההדר לפי האזור שמתחתיו (data-theme)
      if (R && y > R.end - 2) { if (!zones) mapZones(); const line = y + hh + 4; let z = null; for (const q of zones) if (q.top <= line && q.bottom > line) z = q; if (z) { lastTheme = z.light; lastGlass = z.glass; } else if (lastTheme === null) lastTheme = isLight; isLight = lastTheme; } else { lastTheme = null; lastGlass = false; }
      let p, step;
      if (t < tB()) { p = .5 * t / tB(); step = 0; }
      else if (t < tW()) { p = .5 + .5 * (t - tB()) / (tW() - tB()); step = 1; }
      else { p = 1; step = 2; }
      if (y >= P.end - 2) { p = 1; step = 2; }
      // כמה מהפרק הפעיל עברנו: בשני הראשונים לפי הסקשן הנעוץ, בשלישי לפי האזור הלבן
      const local = step === 0 ? p / .5 : step === 1 ? (p - .5) / .5 : (R ? Math.min(1, Math.max(0, (y - P.end) / Math.max(1, R.end - P.end))) : 1);
      const key = on + '|' + isLight + '|' + lastGlass + '|' + step + '|' + local.toFixed(3);
      if (key === last) return; last = key;
      header && header.classList.toggle('is-light', isLight);
      header && header.classList.toggle('is-glass', lastGlass);
      spine.classList.toggle('is-on', on); spine.classList.toggle('is-light', isLight);
      segs.forEach((g, i) => {
        const f = i < step ? 1 : i === step ? Math.min(1, Math.max(0, local)) : 0;
        g.classList.toggle('is-active', i === step); g.classList.toggle('is-done', i < step);
        g.setAttribute('aria-current', i === step ? 'step' : 'false');
        g.querySelector('.spine__line i').style.transform = 'scaleY(' + f.toFixed(4) + ')';
        g.querySelector('.spine__dot').style.top = (f * 100).toFixed(2) + '%';
      });
    });
  })();

  /* מנסרה תלת-ממדית בצורת המשולש של הלוגו: שוליים מעוגלים, כתום המותג, אור חם מלפנים ואור קר מאחור.
     הקנבס מכסה את הסקשן, ויחידה אחת בסצנה = פיקסל אחד, אז אותם מיקומים של החלון והחדר */
  function createPrism(canvas, photo, PHOTO_PTS, restPts, seatPts) {
    const T = window.THREE;
    if (!canvas || !T) return null;
    let renderer;
    try { renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.debug.checkShaderErrors = false;                 // לא לחכות לסיום ההרכבה של השיידרים (הדפדפן מרכיב אותם ברקע)   // שכבה על כל המסך: מעל 1.5 לא רואים הבדל, ורק מכבידים על הגלילה
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.localClippingEnabled = true;                    // מישור הקיר: מה שעוד בתוך הקיר לא מצויר
    const scene = new T.Scene();
    const FOV = 30, camera = new T.PerspectiveCamera(FOV, 1, 1, 20000);
    const orange = new T.Color('#F15A3B').convertSRGBToLinear();
    // הצללית של הלוגו, עם פינות מעוגלות מעט (רדיוס קטן, כדי שהצורה תישאר מזוהה)
    const shape = new T.Shape(), PTS = [[0, 1], [0, 0], [.511, 0]], RAD = .022;
    const toward = (p, q, d) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy); return [p[0] + dx / L * d, p[1] + dy / L * d]; };
    PTS.forEach((p, i) => {
      const prev = PTS[(i + 2) % 3], next = PTS[(i + 1) % 3], a1 = toward(p, prev, RAD), a2 = toward(p, next, RAD);
      if (i === 0) shape.moveTo(a1[0], a1[1]); else shape.lineTo(a1[0], a1[1]);
      shape.quadraticCurveTo(p[0], p[1], a2[0], a2[1]);
    });
    shape.closePath();
    // פסל יוקרתי: לוח עבה ומדויק כמו זכוכית יצוקה, עם שיפוע זעיר בקצוות שתופס אור (לא מסגרת ולא כרית מעוגלת)
    const DEPTH = .1, BT = .006, BS = .005;
    const geo = new T.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: BT, bevelSize: BS, bevelSegments: 6, curveSegments: 10 });
    geo.computeBoundingBox();
    const off = geo.boundingBox.getCenter(new T.Vector3());
    geo.center(); geo.computeBoundingBox();
    const bb = geo.boundingBox, bw = bb.max.x - bb.min.x, bh = bb.max.y - bb.min.y;
    const ZF = DEPTH / 2 + BT;                                 // הפאה הקדמית, אחרי המירכוז
    const CORN = PTS.map(p => [p[0] - off.x, p[1] - off.y]);   // A קודקוד, B שמאל-תחתון, C ימין-תחתון
    // הפאה: בהתחלה היא הזכוכית המוארת מהצילום עצמו (אותם פיקסלים בדיוק), ותוך כדי היציאה עוברת לחומר של הפסל:
    // אפרסק-ענבר בהיר במרכז התחתון, כתום חם באמצע, וכתום שרוף עמוק למעלה ובקצוות (הצבעים נדגמו מהחלון)
    const FW = 384, FH = 768;
    const gc = document.createElement('canvas'); gc.width = FW; gc.height = FH; const gx = gc.getContext('2d');
    // שתי השכבות של הפאה מצוירות פעם אחת בלבד (החומר, והזכוכית מהצילום), ובמעבר רק מערבבים ביניהן.
    // קודם הצילום הגדול צויר מחדש בכל פריים של המעבר, וזה האט את הגלילה בדיוק כשהמשולש יוצא מהחלון
    const layer = () => { const c = document.createElement('canvas'); c.width = FW; c.height = FH; return c; };
    const matFace = layer(); (() => { const m = matFace.getContext('2d');
      m.fillStyle = '#86260f'; m.fillRect(0, 0, FW, FH);
      const rg = m.createRadialGradient(46 * 3, 236 * 3, 0, 46 * 3, 236 * 3, 250 * 3);
      rg.addColorStop(0, '#ff9d5e'); rg.addColorStop(.25, '#ff7a3f'); rg.addColorStop(.52, '#ec6533'); rg.addColorStop(.78, '#c2421c'); rg.addColorStop(1, '#86260f');
      m.fillStyle = rg; m.fillRect(0, 0, FW, FH); })();
    let photoFace = null;
    const getPhotoFace = () => {
      if (photoFace || !photo || !photo.complete || !photo.naturalWidth) return photoFace;
      photoFace = layer(); const p = photoFace.getContext('2d');
      // מיפוי: פינות הפאה (A, B, C) אל אותן פינות בצילום
      const nw = photo.naturalWidth, nh = photo.naturalHeight, P = k2 => [PHOTO_PTS[k2][0] * nw, PHOTO_PTS[k2][1] * nh];
      const A = P('A'), B = P('B'), C = P('C');
      const U = [(C[0] - B[0]) / FW, (C[1] - B[1]) / FW], V = [(B[0] - A[0]) / FH, (B[1] - A[1]) / FH];
      const det = U[0] * V[1] - V[0] * U[1];
      const a = V[1] / det, b = -U[1] / det, c = -V[0] / det, d = U[0] / det;
      p.setTransform(a, b, c, d, -(a * A[0] + c * A[1]), -(b * A[0] + d * A[1]));
      try { p.drawImage(photo, 0, 0); } catch (e) { photoFace = null; /* בלי הצילום: רק החומר */ }
      return photoFace;
    };
    const paintFace = k => {
      gx.setTransform(1, 0, 0, 1, 0, 0); gx.globalAlpha = 1;
      gx.drawImage(matFace, 0, 0);
      const pf = k < 1 ? getPhotoFace() : null;
      if (pf) { gx.globalAlpha = 1 - k; gx.drawImage(pf, 0, 0); gx.globalAlpha = 1; }
    };
    paintFace(1);
    const faceTex = new T.CanvasTexture(gc); faceTex.encoding = T.sRGBEncoding;
    faceTex.repeat.set(1 / .511, 1);                                    // ה-UV של הפאה הם קואורדינטות הצורה: הבהיר למטה
    // סאטן רך: האור בא בעיקר מבפנים (emissive), והאורות החיצוניים רק נוגעים בשוליים
    // חומר סטנדרטי (בלי ציפוי 'פיזיקלי'): נראה כמעט אותו דבר, אבל השיידר שלו קטן בהרבה. בכרטיסי מסך של Intel ההרכבה של החומר הפיזיקלי עצרה את הדפדפן לשניות
    const satin = { shininess: 38, specular: new T.Color(0x5a4a44), transparent: true, premultipliedAlpha: true };
    const capMat = new T.MeshPhongMaterial(Object.assign({ map: faceTex, emissive: 0xffffff, emissiveMap: faceTex, emissiveIntensity: .2 }, satin));   // רק מעט אור פנימי: כמו חפץ אמיתי שמואר מבחוץ
    // הצדדים והשוליים: כתום שרוף כהה, כמו מסגרת החלון בצל, כדי שהנפח ייקרא
    // הצדדים: אותו כתום בדיוק (חומר אחד, לא מסגרת בצבע אחר). הם נראים כהים יותר רק בגלל זווית האור
    // הצדדים: אותו חומר, כתום מעט כהה יותר מהפנים, כדי שהנפח ייקרא בלי קו בהיר בקצה
    const sideMat = new T.MeshPhongMaterial(Object.assign({ color: new T.Color('#c84d25').convertSRGBToLinear(),
      emissive: new T.Color('#c84d25').convertSRGBToLinear(), emissiveIntensity: .05 }, satin));
    const mats = [capMat, sideMat];
    // סביבה להשתקפויות רכות: חלון אור חם גדול ומפוזר למעלה-שמאל, ומילוי קריר וחלש מימין
    try {
      const ec = document.createElement('canvas'); ec.width = 512; ec.height = 256; const g = ec.getContext('2d');
      const sky = g.createLinearGradient(0, 0, 0, 256); sky.addColorStop(0, '#24204f'); sky.addColorStop(.55, '#110e34'); sky.addColorStop(1, '#06051a');
      g.fillStyle = sky; g.fillRect(0, 0, 512, 256);
      const soft = (x, y, r, col) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); };
      soft(150, 75, 120, 'rgba(255,200,170,.38)');
      soft(410, 125, 90, 'rgba(150,165,230,.2)');
      // שני סופטבוקסים צרים וגבוהים, כמו בסטודיו: כשהוא מסתובב, פס אור רך חולף על הפאות ועל השוליים
      const strip = (x, w, col) => { const lg = g.createLinearGradient(x - w, 0, x + w, 0); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(.5, col); lg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = lg; g.fillRect(x - w, 40, w * 2, 150); };
      strip(96, 16, 'rgba(255,226,206,.55)'); strip(300, 12, 'rgba(255,214,190,.32)'); strip(452, 10, 'rgba(190,200,255,.26)');
      const et = new T.CanvasTexture(ec); et.mapping = T.EquirectangularReflectionMapping; et.encoding = T.sRGBEncoding;
      /*ENVTEST*/ et.dispose();
    } catch (e) { /* בלי סביבה: רק האורות */ }
    const clip = new T.Plane(new T.Vector3(0, 0, 1), 1e6);    // כבוי (רחוק מאחור) עד שצריך אותו
    mats.forEach(m => { m.clippingPlanes = [clip]; });
    const mesh = new T.Mesh(geo, mats);
    scene.add(mesh);
    // תאורה קולנועית רכה: אור מפתח חם מלמעלה-שמאל, מילוי קריר חלש, ואור קצה עדין מאחור שמצייר את השוליים
    scene.add(new T.HemisphereLight(0xffe6d8, 0x1a0f2a, .5));   // חם-ניטרלי: כדי שהכתום לא יהפוך לורוד בזוויות
    const key = new T.DirectionalLight(0xffe4d0, 1.45); key.position.set(-.9, 1.1, 1.2); scene.add(key);
    const fill = new T.DirectionalLight(0x9aa6ff, .28); fill.position.set(1, -.2, .8); scene.add(fill);
    const rim = new T.DirectionalLight(0xffb48c, .42); rim.position.set(.6, .9, -1.2); scene.add(rim);
    let W = 1, H = 1;
    /* ---------- התנוחה בתוך הפתח ----------
       הקיר של הבית מצולם בזווית (הבסיס של החלון יורד ימינה, ורואים את הקיר השמאלי של הבית).
       מחפשים את הסיבוב של המשולש שנותן בדיוק את השיפוע הזה, ואז את הגודל והמיקום שבהם שלוש הפינות
       של הפאה הקדמית יושבות על שלוש הפינות של הזכוכית בצילום. כך הוא באותה פרספקטיבה כמו הבית */
    const v3 = new T.Vector3();
    // המטריצה נבנית ידנית: מיקום, סיבוב, גודל, ועוד הטיה קטנה של הפאה (shear) שמתאימה את שיפוע הבסיס לצילום
    mesh.matrixAutoUpdate = false;
    const qv = new T.Quaternion(), eu = new T.Euler(), pv = new T.Vector3(), sv = new T.Vector3(), M4 = new T.Matrix4(), SH = new T.Matrix4();
    const pose = (px, py, pz, sx, sy, rx, ry, rz, k) => {
      pv.set(px, py, pz); sv.set(sx, sy, sy); qv.setFromEuler(eu.set(rx, ry, rz)); M4.compose(pv, qv, sv);
      SH.set(1, 0, 0, 0, k, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
      mesh.matrix.multiplyMatrices(M4, SH); mesh.updateMatrixWorld(true);
    };
    const project = (px, py, pz, sx, sy, ry, k) => {
      pose(px, py, pz, sx, sy, 0, ry, 0, k);
      return CORN.map(c => { v3.set(c[0], c[1], ZF).applyMatrix4(mesh.matrixWorld).project(camera); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H]; });
    };
    const box = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys),
        cx: (xs[0] + xs[1] + xs[2]) / 3, cy: (ys[0] + ys[1] + ys[2]) / 3 }; };
    const slopeOf = p => (p[2][1] - p[1][1]) / (p[2][0] - p[1][0]);
    // זווית קבועה ומתונה מול הקיר (רואים את הצד השמאלי שלו כשהוא יוצא, כמו את הקיר השמאלי של הבית),
    // ואז גודל, מיקום והטיה כך ששלוש הפינות יושבות בדיוק על שלוש הפינות של הזכוכית
    const REST_RY = .3;
    const fitAt = (ry, tgt) => {
      const tb = box(tgt), want = slopeOf(tgt);
      let sx = tb.w / .511, sy = tb.h, X = tb.cx - W / 2, Y = H / 2 - tb.cy, k = 0;
      const n = [Math.sin(ry), Math.cos(ry)];
      const P = kk => project(X - n[0] * ZF * sy, Y, -n[1] * ZF * sy, sx, sy, ry, kk);
      for (let i = 0; i < 8; i++) {
        let pb = box(P(k)); sx *= tb.w / pb.w; sy *= tb.h / pb.h;
        pb = box(P(k)); X += tb.cx - pb.cx; Y -= tb.cy - pb.cy;
        const s0 = slopeOf(P(k)), s1 = slopeOf(P(k + .01));
        if (Math.abs(s1 - s0) > 1e-6) k += (want - s0) / ((s1 - s0) / .01);
      }
      return { X, Y, sx, sy, ry, k, n };
    };
    let restKey = '', rest = null;
    const restPose = () => {
      const t = restPts(), tgt = [t.A, t.B, t.C];
      const key = tgt.map(p => p.map(Math.round).join(',')).join(';') + '|' + W + 'x' + H;
      if (key === restKey && rest) return rest;
      restKey = key; rest = fitAt(REST_RY, tgt);
      return rest;
    };
    let lastK = -1, lastSh = '', lastClip = '';
    const setMat = k => {
      if (k === lastK) return; lastK = k;
      paintFace(k); faceTex.needsUpdate = true;
      // בפתח: רק הצבע של הצילום (אור פנימי בלבד, בלי ברק), כך שאי אפשר להבחין בינו לבין החלון. בחוץ: סאטן
      capMat.color.setScalar(k);
      capMat.emissiveIntensity = 1 - .8 * k;
      capMat.envMapIntensity = .6 * k; capMat.clearcoat = .26 * k; capMat.reflectivity = .5 * k; capMat.metalness = .04 * k;
    };
    const lerp = (a, b, t) => a + (b - a) * t;
    /* הלוגו התלת-ממדי: האותיות מהווקטור של הלוגו (SVGLoader) בעומק ובשיפוע של המשולש, בנייבי סאטן,
       והמשולש עצמו (אותו גוף ואותו חומר) במקום שלו ביניהן. הכול בקבוצה אחת שמסתובבת יחד */
    let logo = null;
    const buildLogo = () => {
      if (logo !== null) return logo; logo = false;
      const src = document.getElementById('lg-n');
      if (!src || !T.SVGLoader) return logo;
      try {
        const data = new T.SVGLoader().parse('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490 338.113">' + src.innerHTML + '</svg>');
        const shapes = []; data.paths.forEach(p => T.SVGLoader.createShapes(p).forEach(sh => shapes.push(sh)));
        const LD = 15;
        // פחות נקודות בעקומות ובשיפוע (בגודל הזה לא רואים הבדל): בנייה מהירה פי כמה, ופחות עומס על כרטיס המסך
        const lg = new T.ExtrudeGeometry(shapes, { depth: LD, bevelEnabled: true, bevelThickness: 1, bevelSize: .8, bevelSegments: 2, curveSegments: 6 });
        lg.translate(-245, -169.06, -LD / 2); lg.scale(1, -1, 1); lg.computeVertexNormals();
        const navy = new T.Color('#0b0928').convertSRGBToLinear();   // מעט כהה מהנייבי של המותג: האור מבהיר אותו בחזרה
        // חומר רגיל במקום 'פיזיקלי' עם ציפוי: השיידר שלו קטן בהרבה (ההרכבה שלו עצרה את הדפדפן לשניות)
        const face = new T.MeshPhongMaterial({ color: navy, shininess: 30, specular: new T.Color(0x3a3760), side: T.DoubleSide });
        const side = new T.MeshPhongMaterial({ color: new T.Color('#1d1a4e').convertSRGBToLinear(), shininess: 24, specular: new T.Color(0x2a2850), side: T.DoubleSide });
        const letters = new T.Mesh(lg, [face, side]);
        const tri = new T.Mesh(geo, mats);
        tri.position.set(240.3 + 41.4 - 245, 169.06 - (63.9 + 80.35), 0);
        tri.scale.set(82.8 / bw, 160.7 / bh, 160.7 / bh);
        const grp = new T.Group(); grp.add(letters); grp.add(tri); grp.visible = false; scene.add(grp);
        logo = grp;
      } catch (e) { logo = false; }
      return logo;
    };
    const api = {
      resize() {
        W = canvas.clientWidth || 1; H = canvas.clientHeight || 1;
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        camera.position.set(0, 0, (H / 2) / Math.tan(FOV / 2 * Math.PI / 180));
        camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
        rest = null;
      },
      draw(s, o, L3) {
        canvas.style.visibility = o > .001 ? 'visible' : 'hidden';
        if (o <= .001) return;
        const L = s.lock || 0, pull = s.pull == null ? 1 : s.pull;
        setMat(Math.round((s.mat == null ? 1 : s.mat) * 48) / 48);   // 48 שלבים: חלק לעין, ופחות העלאות של הטקסטורה
        // התנוחה הרגילה: לפי המלבן על המסך.
        // הצללית נשארת קריאה בסיבוב: עובר מהר דרך הרגע שבו רואים רק את הצד, ונשאר יותר זמן מול הפנים
        let px = s.x + s.w / 2 - W / 2, py = H / 2 - (s.y + s.h / 2), pz = 0, sx = s.w / bw, sy = s.h / bh;
        let rx = s.rx, ry = s.ry - .22 * Math.sin(2 * s.ry), rz = s.rz, k = 0;
        clip.set(v3.set(0, 0, 1), 1e6);
        if (L > 0) {
          const r = restPose();
          // נשלף לאורך הניצב לקיר: מתחיל כשהפאה הקדמית במישור הקיר, ונגמר כשכל העובי בחוץ ועוד מרווח ממנו
          const d = ZF * r.sy * (-1 + pull * 4.2);
          const fx = r.X + r.n[0] * d, fz = r.n[1] * d;
          px = lerp(px, fx, L); py = lerp(py, r.Y, L); pz = lerp(pz, fz, L);
          sx = lerp(sx, r.sx, L); sy = lerp(sy, r.sy, L);
          rx = lerp(rx, 0, L); ry = lerp(ry, r.ry, L); rz = lerp(rz, 0, L); k = r.k * L;
          // מישור הקיר (קצת מאחורי הפאה הקדמית במנוחה): מה שעוד בתוך הקיר לא נראה
          if (pull < 1 && L > .999) clip.setFromNormalAndCoplanarPoint(v3.set(r.n[0], 0, r.n[1]), new T.Vector3(r.X - r.n[0] * .15, r.Y, -r.n[1] * .15));
        }
        pose(px, py, pz, sx, sy, rx, ry, rz, k);
        // שוכב בפתח החדר: מיפוי ישיר של שלוש הפינות של הפאה אל שלוש הפינות של הפתח (מעט פנימה), דק, ומתמזג מהתנוחה הרגילה
        const seat = s.seat || 0, sp = (seat > 0 || s.inside > 0) && seatPts ? seatPts() : null;
        if (sp && seat > 0) {
          // היעד: רצפת החדר (הפתח, מוזז למטה בגובה הקירות), מעט פנימה. מה שמחוץ לפתח מוסתר בקירות (clip למטה)
          // יושב מעט מתחת לשפת הקירות וממלא את הפתח (כמו חלק שננעל במקום); lift מרים אותו ישר למעלה, באותה תנוחה
          const sk = s.sink || 0, rest = (sp.depth || 0) * (.35 + .9 * sk), dy = rest - (s.lift || 0) * (rest + H * .2), cx = (sp.A[0] + sp.B[0] + sp.C[0]) / 3, cy = (sp.A[1] + sp.B[1] + sp.C[1]) / 3 + dy, ins = .98 - .14 * sk;
          const w = p => [cx + (p[0] - cx) * ins - W / 2, H / 2 - (cy + (p[1] + dy - cy) * ins)];
          const SA = w(sp.A), SB = w(sp.B), SC = w(sp.C);
          const u1 = [CORN[0][0] - CORN[1][0], CORN[0][1] - CORN[1][1]], u2 = [CORN[2][0] - CORN[1][0], CORN[2][1] - CORN[1][1]];
          const v1 = [SA[0] - SB[0], SA[1] - SB[1]], v2 = [SC[0] - SB[0], SC[1] - SB[1]];
          const det = u1[0] * u2[1] - u2[0] * u1[1];
          const i00 = u2[1] / det, i01 = -u2[0] / det, i10 = -u1[1] / det, i11 = u1[0] / det;
          const a = v1[0] * i00 + v2[0] * i10, b = v1[0] * i01 + v2[0] * i11, c = v1[1] * i00 + v2[1] * i10, d = v1[1] * i01 + v2[1] * i11;
          const tx = SB[0] - (a * CORN[1][0] + b * CORN[1][1]), ty = SB[1] - (c * CORN[1][0] + d * CORN[1][1]);
          const sz = Math.hypot(a, c) * .35;
          M4.set(a, b, 0, tx, c, d, 0, ty, 0, 0, sz, -ZF * sz, 0, 0, 0, 1);
          const e = mesh.matrix.elements, f = M4.elements;
          for (let i = 0; i < 16; i++) e[i] += (f[i] - e[i]) * seat;
          mesh.updateMatrixWorld(true);
        }
        // הקירות של החדר מסתירים אותו: רואים אותו רק דרך הפתח (ומעליו, באוויר), כך שהוא באמת נכנס פנימה
        // מסתירים רק את מה שמתחת לשפת הקירות הקדמיים של החדר (C-B-A); מעליה הכול גלוי, כך שכשהוא עולה שום דבר לא נחתך
        const clipNow = sp ? 'polygon(' + [[-4000, -4000], [W + 4000, -4000], [W + 4000, sp.A[1]], sp.A, sp.B, sp.C, [-4000, sp.C[1]]].map(p => p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px').join(',') + ')' : 'none';
        if (clipNow !== lastClip) { canvas.style.clipPath = clipNow; lastClip = clipNow; }
        // הצל על הרקע מופיע רק כשהוא כבר רחוק מהקיר (בפתח אין לו צל משלו)
        // צל: ליד הקיר צל מגע קצר ורך (גדל ככל שהוא נשלף), וכשהוא חופשי צל רך ורחוק מתחתיו
        const u = Math.min(innerWidth, 1920) / 1920, near = L * pull, far = (1 - L) * (1 - (s.seat || 0));   // שוכב בפתח: בלי צל מרחף
        const shY = 7 * u * far + 5 * near, shB = 14 * u * far + 7 * near, shA = .14 * far + .55 * near * L;   // צל רך ועדין מאוד
        const sh = Math.round(shY * 10) / 10 + "px " + Math.round(shB * 10) / 10 + "px rgb(4 3 20 / " + Math.round(shA * 100) / 100 + ")";
        if (sh !== lastSh) { canvas.style.filter = 'drop-shadow(' + Math.round(3 * near * 10) / 10 + 'px ' + sh + ')'; lastSh = sh; }
        // הלוגו התלת-ממדי: במקום המשולש הבודד, הקבוצה כולה (אותיות ומשולש) במקום של הלוגו
        const lgo = L3 ? buildLogo() : null;
        if (lgo) {
          const r = L3.rect(), sc = r.w / 490 * L3.g;
          lgo.visible = true; mesh.visible = false;
          lgo.position.set(r.x + r.w / 2 - W / 2, H / 2 - (r.y + r.h / 2), 0);
          lgo.scale.set(sc, sc, sc); lgo.rotation.set(L3.rx, L3.ry, 0);
        } else { if (logo) logo.visible = false; mesh.visible = true; }
        capMat.opacity = o;
        sideMat.opacity = o * Math.min(1, pull / .06);           // בפתח הצדדים בתוך הקיר: אפילו קו דק שלהם לא נראה
        renderer.render(scene, camera);
      },
      // חימום: הרכבת השיידרים, העלאת הטקסטורות ובניית הלוגו התלת-ממדי מראש, בזמן שהדפדפן פנוי.
      // בלי זה, כל אלה קרו ברגע שהמשולש יוצא מהחלון (ושוב בלוגו) והגלילה נתקעה לשבריר שנייה
      warm() {
        const vis = canvas.style.visibility; canvas.style.visibility = 'hidden';
        getPhotoFace(); paintFace(0); faceTex.needsUpdate = true;
        const lg = buildLogo();
        try {
          renderer.compile(scene, camera);
          if (lg) { lg.visible = true; renderer.compile(scene, camera); }
          renderer.render(scene, camera);
        } catch (e) { /* לא קריטי */ }
        if (lg) lg.visible = false;
        lastK = -1; renderer.clear();
        canvas.style.visibility = vis;
      },
      dispose() { geo.dispose(); mats.forEach(m => m.dispose()); faceTex.dispose(); renderer.dispose(); },
    };
    api.resize();
    return api;
  }
  addEventListener('pagehide', () => { st.kill(); tl.kill(); intro.kill(); bg && bg.dispose(); prism && prism.dispose(); }, { once: true });

  /* רקע טכנולוגי בקוד, בלי תמונה ובלי תזוזה: רצפת קווי אור בפרספקטיבה ונקודות דקות,
     בעיקר בצד ימין (מאחורי הטקסט), ואור רך מאחורי הבית */
  /* ---------- רקע נקודות (בהשראת DotGrid של React Bits) ----------
     רשת שטוחה של נקודות זעירות ובהירות מאוד, שנבלעת ברקע: היא נראית בעיקר מתחת למבוך ונמסה לכל הכיוונים.
     העכבר עובד כמו מגנט: הנקודות שלידו נדחפות הצידה על קפיץ, מתנפחות ומתבהרות, וחוזרות למקום בעדינות.
     קנבס דו-ממדי (בלי WebGL נוסף), ומצויר רק כשהשכבה גלויה */
  function createDots(canvas, anchor, light) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, raf = 0, pts = null;
    // בדיוק כמו הנקודות ברקע של ההמלצות: קטנות, עדינות מאוד ושקופות, ומפוזרות באופן שווה על כל הרקע
    const GAP = 17, SIZE = 2, PROX = 140, PUSH = 10, SWELL = .5, TENSION = .09, DAMP = .78;
    const P = { x: -9999, y: -9999, lx: -9999, ly: -9999, vx: 0, vy: 0 };
    const col = light ? '128,126,158' : '212,212,218';   // טיפה כהה יותר מהלבן של ההמלצות
    const AM = light ? .6 : .42;   // השקיפות המקסימלית: רמות השקיפות מתחלקות עד אליה, כך שגם נקודות עדינות מאוד מצוירות מדויק
    // ציור מהיר: הנקודות מקובצות לפי שקיפות (16 רמות), וכל קבוצה מצוירת בפעולה אחת, במקום אלפי פעולות בכל פריים.
    // כשהכול עומד (בלי גלילה ובלי עכבר) לא מציירים בכלל
    const NB = 16; let bx = null, bn = null, lastKey = '', alive = true;
    const build = () => {
      dpr = Math.min(devicePixelRatio || 1, 1.5); W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      const cols = Math.ceil(W / GAP) + 1, rows = Math.ceil(H / GAP) + 1, n = cols * rows;
      pts = { n, rx: new Float32Array(n), ry: new Float32Array(n), ox: new Float32Array(n), oy: new Float32Array(n), vx: new Float32Array(n), vy: new Float32Array(n), e: new Float32Array(n) };
      const x0 = (W - (cols - 1) * GAP) / 2, y0 = (H - (rows - 1) * GAP) / 2;
      for (let r = 0, i = 0; r < rows; r++) for (let c = 0; c < cols; c++, i++) { pts.rx[i] = x0 + c * GAP; pts.ry[i] = y0 + r * GAP; }
      bx = Array.from({ length: NB }, () => new Float32Array(n * 3)); bn = new Int32Array(NB); lastKey = ''; alive = true;
      // הנקודות נעלמות בהדרגה לפני הטקסט שבצד, כדי שלא יעברו מתחת לאותיות (במובייל הטקסט מתחת, אז אין גבול)
      const para = canvas.closest('[data-sides]')?.querySelector('.sides__state--b .sides__para');
      const pl = para ? para.getBoundingClientRect().left - canvas.getBoundingClientRect().left : W;
      textEdge = pl > W * .3 ? pl : W + 999;
    };
    let textEdge = 1e9;
    addEventListener('resize', () => { W = 0; });
    addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); P.x = e.clientX - r.left; P.y = e.clientY - r.top; });
    document.addEventListener('mouseleave', () => { P.x = P.y = -9999; });
    const draw = () => {
      raf = requestAnimationFrame(draw);
      // גלוי רק כשהמבוך על המסך (GSAP מסמן את זה בסגנון של הקנבס): בלי חישוב סגנונות בכל פריים
      const v = canvas.style.visibility; if (!v || v === 'hidden') return;
      if (!W || !pts) build();
      // מהירות העכבר: תנועה מהירה דוחפת קצת יותר רחוק
      if (P.lx > -9000 && P.x > -9000) { P.vx += ((P.x - P.lx) - P.vx) * .3; P.vy += ((P.y - P.ly) - P.vy) * .3; } else { P.vx *= .8; P.vy *= .8; }
      const moved = P.x !== P.lx || P.y !== P.ly || Math.abs(P.vx) + Math.abs(P.vy) > .05;
      P.lx = P.x; P.ly = P.y;
      if (!anchor) return;
      // האזור שבו הן נראות: אליפסה רכה וגדולה מתחת למבוך
      // השדה יורד גם אל מתחת למבוך (שם הן היו כהות מדי), ונשאר בהיר על רוב השטח שלו
      // שדה בהיר מתחת למבוך (מאחוריו), שנבלע ברקע בכל הקצוות: הוא נגמר לפני קצה המסך, ולא נחתך בו
      // כמו בהמלצות: אליפסה רכה על כל הרקע של האזור, לא רק סביב המבוך
      const ex = W * .28, ey = H * .55, erx = W * .42, ery = H * .52;   // שמאלה, מתחת למבוך; נעלם ברכות לפני הקצוות
      const key = ex.toFixed(1) + ',' + ey.toFixed(1) + ',' + erx.toFixed(1) + ',' + ery.toFixed(1);
      if (key === lastKey && !moved && !alive) return;      // שום דבר לא זז: הפריים הקודם עדיין נכון
      lastKey = key; alive = false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgb(' + col + ')';
      bn.fill(0);
      const sp = Math.hypot(P.vx, P.vy);
      for (let i = 0; i < pts.n; i++) {
        const rx = pts.rx[i], ry = pts.ry[i];
        const qx = (rx - ex) / erx, qy = (ry - ey) / ery, q = qx * qx + qy * qy;
        if (q >= 1) continue;
        // בכהה: חזק במרכז מתחת למבוך, ונמס לגמרי לפני קצוות המסך (בצדדים, למעלה ולמטה)
        const sx = Math.min(1, Math.max(0, rx / (W * .2))), sy = Math.min(1, Math.max(0, Math.min(ry / (H * .16), (H - ry) / (H * .22))));
        const mask = light ? (1 - q) * (1 - q) : Math.pow(1 - q, 1.5) * sx * sx * (3 - 2 * sx) * sy * sy * (3 - 2 * sy);
        let tx = 0, ty = 0, te = 0;
        if (!reduce) {
          const dx = rx - P.x, dy = ry - P.y, d = Math.hypot(dx, dy);
          if (d < PROX) {
            const f = 1 - d / PROX, f2 = f * f, inv = d > .001 ? 1 / d : 0;
            tx = dx * inv * f2 * PUSH + P.vx * f2 * .55;
            ty = dy * inv * f2 * PUSH + P.vy * f2 * .55;
            te = Math.min(1, f2 * 1.3 + sp * .004 * f);
          }
        }
        // קפיץ: הנקודה נמשכת אל היעד ומתנדנדת מעט לפני שהיא נרגעת
        pts.vx[i] = (pts.vx[i] + (tx - pts.ox[i]) * TENSION) * DAMP; pts.vy[i] = (pts.vy[i] + (ty - pts.oy[i]) * TENSION) * DAMP;
        pts.ox[i] += pts.vx[i]; pts.oy[i] += pts.vy[i];
        pts.e[i] += (te - pts.e[i]) * .14;
        if (!alive && (Math.abs(pts.vx[i]) + Math.abs(pts.vy[i]) > .01 || Math.abs(te - pts.e[i]) > .002)) alive = true;
        const e = pts.e[i], s = SIZE * (1 + SWELL * e);
        // בעמוד הכהה: הרבה יותר בהירות (כמעט לבנות במרכז). בעמוד הלבן בהיר זה ההפך: עדינות ושקופות הרבה יותר
        const a = mask * (light ? .11 + .17 * e : .2 + .2 * e);                     // אותה שקיפות בדיוק כמו בהמלצות (בסיס .06, ובמעבר עכבר עד .22)
        if (a < .01) continue;
        const b = Math.min(NB - 1, Math.floor(a / AM * NB)), arr = bx[b], j = bn[b] * 3;
        arr[j] = rx + pts.ox[i]; arr[j + 1] = ry + pts.oy[i]; arr[j + 2] = s / 2 + .35; bn[b]++;
      }
      for (let b = 0; b < NB; b++) {
        const m = bn[b]; if (!m) continue;
        const arr = bx[b]; ctx.globalAlpha = (b + .5) / NB * AM; ctx.beginPath();
        for (let j = 0; j < m * 3; j += 3) { ctx.moveTo(arr[j] + arr[j + 2], arr[j + 1]); ctx.arc(arr[j], arr[j + 1], arr[j + 2], 0, 6.2832); }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);
    return { dispose() { cancelAnimationFrame(raf); } };
  }

  function createBackdrop(canvas, light) {
    if (!canvas) return null;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
    if (!gl || !gl.getExtension('OES_standard_derivatives')) return null;
    const vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
    // בגרסה הלבנה: אותם קווים בדיוק, בכחול עדין על לבן
    const fs = `#extension GL_OES_standard_derivatives : enable
      precision mediump float;
      uniform vec2 uRes;
      const vec3 NAVY = vec3(9.0, 7.0, 37.0) / 255.0;
      const vec3 LINE = vec3(.50, .55, 1.0);
      ${light ? `const vec3 BASE = vec3(245.0) / 255.0;
      vec3 ink(vec3 col, vec3 c, float a){ return mix(col, vec3(16.0, 14.0, 54.0) / 255.0, a * 1.3); }`
      : `const vec3 BASE = NAVY;
      vec3 ink(vec3 col, vec3 c, float a){ return col + c * a; }`}
      float grid(vec2 q, float w){ vec2 g = abs(fract(q - .5) - .5) / fwidth(q); return 1.0 - min(min(g.x, g.y) / w, 1.0); }
      void main(){
        vec2 f = gl_FragCoord.xy / uRes;
        float asp = uRes.x / uRes.y;
        vec2 vp = vec2(.62, .40);                                  // נקודת המגוז: במרכז הצד הימני
        vec3 col = BASE;
        // אור רך מאחורי הבית
        vec2 dg = (f - vec2(.25, .38)) * vec2(asp, 1.0);
        ${light ? 'col = mix(col, NAVY, exp(-dot(dg, dg) * 3.2) * .035);' : 'col += vec3(.10, .11, .30) * exp(-dot(dg, dg) * 3.2) * .38;'}
        if (f.y < vp.y) {
          // הרצפה: כל שורה רחוקה יותר ככל שמתקרבים לאופק
          float h = vp.y - f.y;
          float z = .55 / h;
          vec2 q = vec2((f.x - vp.x) * asp * z, z);
          float l = grid(q * 1.4, 1.0);
          float fade = smoothstep(0.0, .16, h)                 // נמס באופק
                     * smoothstep(.36, .62, f.x)                       // רק בצד ימין: לא נוגע בבית
                     * (1.0 - smoothstep(.9, 1.0, f.x) * .6);          // נרגע בקצה
          col = ink(col, LINE, l * .09 * fade);
          col = mix(col, BASE, smoothstep(.12, 0.0, f.y) * .8);        // נבלע בתחתית
        } else {
          // השמיים: רשת נקודות דקה מאוד, שנעלמת כלפי מעלה
          vec2 q = (f - vp) * vec2(asp, 1.0) * 46.0;
          vec2 cell = abs(fract(q) - .5);
          float dot1 = 1.0 - smoothstep(.0, .06, length(cell));
          float up = 1.0 - smoothstep(.0, .55, f.y - vp.y);
          col = ink(col, LINE, dot1 * .06 * up * smoothstep(.40, .66, f.x));
        }
        // קו אופק עדין
        col = ink(col, LINE, .02 * exp(-pow((f.y - vp.y) * 140.0, 2.0)) * smoothstep(.38, .62, f.x));
        gl_FragColor = vec4(col, 1.0);
      }`;
    const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(pr, n);
    const api = {
      resize() { const r = Math.min(devicePixelRatio || 1, 1.5); canvas.width = Math.round(canvas.clientWidth * r); canvas.height = Math.round(canvas.clientHeight * r); gl.viewport(0, 0, canvas.width, canvas.height); },
      draw() { if (canvas.width !== Math.round(canvas.clientWidth * Math.min(devicePixelRatio || 1, 1.5))) api.resize();
        gl.uniform2f(U('uRes'), canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); },
      dispose() { gl.deleteBuffer(buf); gl.deleteProgram(pr); },
    };
    api.resize(); api.draw();
    return api;
  }
})();
