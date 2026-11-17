/* =========================================================
   5M · רקע ההירו: צילום אמנותי בתלת-מימד
   ---------------------------------------------------------
   - חדר (צילום + מפת עומק) ומשפחה כשכבה נפרדת מעליו.
   - עכבר: מצלמה שזזה בתוך החדר. הקירות הקרובים זזים הרבה,
     החלון כמעט לא, והמשפחה ביניהם. בלי מריחות: לכל פיקסל
     מחפשים את המשטח האמיתי שנראה ממנו (parallax occlusion).
   - בחוץ: שמש כתומה (הכתום של המותג) נמוכה מעל הים, עם הילה חמה,
     שביל אור על המים, ועננים עדינים מאוד שנודדים בשמיים בשתי שכבות
     עומק. הסמן מזיז אותם בעדינות, כמו נשיפה, והם חוזרים לאט.
   - תנועה עוד לפני הגלילה: זום איטי מאוד פנימה ונשימה עדינה.
   - גלילה: זום קטן נוסף, המשפחה נעלמת והרקע מתעמעם לקראת הסיפור.
   - כהה על כהה: הבהירות של הצילום ממופה לטווח צר של נייבי.
   ========================================================= */
(() => {
  const host = document.querySelector('[data-hero-scene]');
  if (!host) return;
  const story = host.closest('[data-story]') || host.parentElement;
  const glCanvas = host.querySelector('.hero__gl');
  const fadeEl = host.querySelector('.hero__fade');
  const ds = host.dataset;

  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;

  /* ---------- הגדרות (אפשר לכוונן ב-data-*) ---------- */
  const num = (v, d) => (v === undefined || v === '' ? d : parseFloat(v));
  const PHOTO = ds.mode === 'photo';
  /* מיקום הצילום על הבמה (1920×1080): רוחב יחסי וגובה הקצה העליון. החלון קטן מהמסך, והקירות הכהים מאחורי הטקסט */
  const PH = { w: num(ds.photoW, .9), top: num(ds.photoTop, 0), fam: (ds.familyRect || '.3,.2736,.2762,.6139').split(',').map(Number),
    sun: (ds.sun || '.603,.476,.012').split(',').map(Number), glass: (ds.glass || '.219,.15,.806,.77').split(',').map(Number), horizon: num(ds.horizon, .49),
    parBg: num(ds.parBg, 7), parFam: num(ds.parFam, 11), lift: num(ds.lift, .55), edge: ds.edge || '#200816', scrim: (ds.scrim || '.42,.38').split(',').map(Number),
    x: num(ds.photoX, 0), pane: (ds.pane || '.432,.224,.571,.57').split(',').map(Number), vig: num(ds.vig, 0), edgeW: num(ds.edgeW, .035),
    rise: (ds.sunRise || '.507,.33').split(',').map(Number), riseTime: num(ds.riseTime, 14), feet: num(ds.feet, .97), sky: num(ds.skyGrade, .85),
    parView: num(ds.parView, 8), feetLine: num(ds.feetLine, .809),
    floor: (ds.floor || '.789,.8174,.8373,.985').split(',').map(Number), depthK: num(ds.depthK, 2.2) };   // floor: האדן, הרגליים בצילום, הרגליים במקום החדש, סוף הצללים   // parView: כמה הנוף שבחלון זז נגד העכבר (תלת-מימד). feetLine: קו הרגליים בצילום
  // הזריחה מתחילה רק כשמסך הטעינה נפתח (כדי שלא תעבור מאחוריו)
  let riseT0 = 0;
  const REF_W = 1920, REF_H = 1080;                  // במה וירטואלית (הפריים בפיגמה)
  const SCENE_SCALE = num(ds.sceneScale, .8);        // רוחב הצילום ביחס לבמה (הוגדל מ-.7: חלון גדול יותר)
  const SCENE_Y = num(ds.sceneY, .15);               // הרמת הצילום (חלק מהגובה)
  const FAMILY_SCALE = num(ds.familyScale, 1.14);       // גודל המשפחה בתוך החדר
  const DEPTH_X = num(ds.depthX, .095);              // עוצמת התלת-מימד בעכבר, לרוחב
  const DEPTH_Y = num(ds.depthY, .05);               // ולגובה
  const FOCUS = num(ds.focus, .12);                  // העומק שעומד במקום
  const FAMILY_NEAR = num(ds.familyNear, .26);       // העומק של שכבת המשפחה
  const DEPTH_RANGE = .6;                            // כמה "עמוק" החדר
  const DOLLY = num(ds.dolly, .12);                  // נסיעה עדינה קדימה בגלילה
  const CLOUDS = num(ds.clouds, .55);                // כמה עננים בשמיים
  // data-scroll-zoom="0" (העמוד הלבן): בלי שום אפקט בגלילה. במקומו ההירו עצמו נושם: זום איטי פנימה והחוצה
  const SCROLL_FX = ds.scrollZoom !== '0';
  const ZOOM_AT_Y = -.02;                          // נקודת העוגן של הזום: קצת מעל המרכז. הים נשאר גבוה יותר ועדיין יש מקום לשמיים (בלי תזוזה לצדדים)
  const AMB_ZOOM = .07, AMB_CYCLE = 24;              // עד 7% זום, מחזור מלא של 24 שניות
  /* ---------- מראה המשפחה (נבחר: פרטים אמיתיים בקונטרסט) ----------
     detail: רואים שיער, בד וצורות. dmode 2 = צללים עמוקים ורק מה שתופס אור בולט.
     tri / mirror / sun: אופציות שנוסו ולא נבחרו, כבויות. */
  const LOOK = { sun: 0, detail: 1, dmode: 2, tri: 0, mirror: 0 };
  // השמש: רדיוס קבוע, מיקום שמחושב לפי המסך (לא מתחת לטקסט), ועולה מעט בכניסה כמו זריחה
  // זריחה: בפתיחה כבר רואים חצי שמש (המרכז שלה על קו המים), והיא עולה לאט והשמיים סביבה מתחממים
  const SUN_R = .02, SUN_MAX_X = .64, SUN_Y = .34, SUN_Y_START = .499, RISE_DELAY = .8, RISE_TIME = 13;   // עולה גבוה לשמיים
  let sunX = SUN_MAX_X;
  /* פריסה לפי המסך בפועל: המשפחה תמיד במרכז הרווח שבין שני גושי הטקסט.
     השמש תמיד ממש מימין למשפחה, לא מאחוריה. */
  function placeSun() {
    if (PHOTO) return;
    const brand = document.querySelector('.hero__brand'), intro = document.querySelector('.hero__intro');
    if (geo()) { const G = geo(); SCENE_X = G.x; famScale = G.famScale; sunX = Math.min(.66, G.fam[0] + G.fam[2] + .02); return; }
    famScale = FAMILY_SCALE;
    if (!brand || !intro || innerWidth <= 1100) { SCENE_X = 0; sunX = SUN_MAX_X; return; }
    const hr = host.getBoundingClientRect(), Z = unit * 1.03;
    const toStage = px => (px - hr.left - W / 2) / Z;
    const left = toStage(brand.getBoundingClientRect().right), right = toStage(intro.getBoundingClientRect().left);
    const w = REF_W * 1.23 * SCENE_SCALE;
    const gap = right - left, mid = (left + right) / 2, m = 26;
    // במסכים צרים המשפחה קטנה מעט כדי להיכנס לרווח (עד 80% מהגודל)
    famScale = FAMILY_SCALE * Math.max(.8, Math.min(1, (gap - m * 2) / (FAM[2] * FAMILY_SCALE * w)));
    const famW = FAM[2] * famScale * w;
    // הידיים הפרושות של הקטנה מרחיבות את השכבה ימינה, אז מרכז הגופים קצת משמאל למרכז השכבה: מתקנים
    const famC = mid + famW * .06;
    SCENE_X = (famC - .001 * w) / REF_W;
    // השמש תמיד מימין למשפחה (לעולם לא מאחוריה), קרוב אליה, ולא יותר ימינה מהמקום המקורי
    const famRightUV = .501 + (FAM[0] + FAM[2] - .501) * famScale;
    sunX = Math.min(.672, famRightUV + SUN_R + .016);
  }
  const TARGET = (ds.target || '.5,.42').split(',').map(Number);
  const FAM = (ds.familyRect || '.4202,.359,.1619,.52').split(',').map(Number);
  let SCENE_X = 0, famScale = 1.14;

  /* ---------- מצב ---------- */
  let W = 1, H = 1, DPR = 1, unit = 1;
  const mouse = { x: 0, y: 0, ex: 0, ey: 0, cx: -1, cy: -1, moved: 0, active: false };
  let scrollP = 0, scrollE = 0, intro = 1, running = false, visible = true;
  const halo = { x: 0, y: 0, k: 0 };
  const t0 = performance.now();

  const loadImg = src => new Promise((ok, no) => {
    const i = new Image(); i.decoding = 'async';
    i.onload = () => ok(i); i.onerror = no; i.src = src;
  });

  /* =========================================================
     WebGL
     ========================================================= */
  const gl = glCanvas.getContext('webgl', { premultipliedAlpha: false, antialias: false, alpha: false });
  // אם הדפדפן מכבה את ההקשר (עומס על כרטיס המסך), מבקשים אותו בחזרה, וכשהוא חוזר טוענים מחדש את הסצנה
  glCanvas.addEventListener('webglcontextlost', e => { e.preventDefault(); }, false);
  glCanvas.addEventListener('webglcontextrestored', () => { location.reload(); }, false);
  let uni = {}, imgAspect = 2.5, glReady = false, clearTex = null;

  const VERT = `
    attribute vec2 p;
    void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
  const FRAG = `
    precision highp float;
    uniform sampler2D uImg, uDepth, uFam, uClear;
    uniform vec2 uRes;
    uniform float uUnit, uZoom, uTime;
    uniform vec2 uPan;         // נקודת העוגן של הזום (פיקסלים)
    uniform float uSunOff;     // 1 = השמש נעלמה לגמרי
    uniform float uWaves;      // באזור הבא: כמה רכסי הגלים נשארים גלויים מעל הכחול הכהה (0 במבוך)
    uniform vec4 uRect;        // x0, y0, w, h של הצילום ביחידות במה (מרכז = 0,0, y למטה)
    uniform vec4 uFamRect;     // המשפחה, ב-uv של הצילום
    uniform vec2 uMouse, uDepthAmt, uTarget;
    uniform float uFocus, uFamNear, uFamScale, uRange, uDolly, uClouds, uFamAlpha, uAspect;
    uniform vec3 uSun;          // x, y, רדיוס (uv בצילום)
    uniform float uStrength, uGamma, uIntro, uDim, uRays, uRise, uRoom;
    uniform vec3 uCursor;       // x, y בפיקסלים של הקנבס, עוצמה
    uniform vec4 uLook;         // אופציות להשוואה: x פרטים אמיתיים, y משולש אור, z השתקפות, w (שמור)
    uniform vec3 uBg, uTint, uSunCol, uCloudCol;
    uniform vec3 uSkyLo, uSkyMid, uSkyHi, uSeaLo, uSeaHi, uNavy;   // אופציות ההירו: צבעי השמיים והים, והכחול שאליו הכול נבלע בגלילה
    uniform float uSkyAmt, uSeaAmt, uRayAmt, uFamLit, uWall;       // עוצמות: שמיים, ים, קרני אור, הדמויות המוארות, חלון מקיר לקיר

    float nearAt(vec2 uv){ return 1.0 - texture2D(uDepth, clamp(uv, 0.0, 1.0)).r; }
    float scaleFor(float n){ float z = 1.0 - n * uRange; return z / max(z - uDolly, .015); }
    vec2 project(vec2 uv, float n){
      vec2 sh = uMouse * (n - uFocus) * uDepthAmt;
      return uTarget + (uv - uTarget - sh) / scaleFor(n);
    }

    // רעש רך לערפל
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vnoise(vec2 p){
      vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = .5;
      for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; }
      return v;
    }
    // שכבת עננים דקה: פסים רכים ומתוחים לרוחב, רק בשמיים
    float cloudLayer(vec2 q, float speed, float seed){
      vec2 p = q * vec2(2.2, 9.0) + vec2(uTime * speed + seed, seed * .37);
      float n = fbm(p + .5 * vec2(fbm(p * .5 + uTime * .006), 0.0));
      return smoothstep(.5, .85, n) * smoothstep(.47, .3, q.y);
    }

    // המשפחה: uv של השכבה עבור נקודה במסך
    vec2 famUV(vec2 uv){
      vec2 fp = project(uv, uFamNear);
      vec2 anchor = vec2(uFamRect.x + uFamRect.z * .5, uFamRect.y + uFamRect.w * .985);
      return (anchor + (fp - anchor) / uFamScale - uFamRect.xy) / uFamRect.zw;
    }
    float famA(vec2 uv){
      vec2 f = famUV(uv);
      if (f.x <= 0.0 || f.x >= 1.0 || f.y <= 0.0 || f.y >= 1.0) return 0.0;
      return texture2D(uFam, f).a * uFamAlpha;
    }
    // כמה אור שמש נכנס דרך הנקודה הזו (שמיים בהירים ליד השמש, לא מוסתרים)
    float sunMask(vec2 uv){
      vec2 p = project(uv, .02);
      float far = 1.0 - smoothstep(.07, .16, nearAt(p));
      float L = dot(texture2D(uImg, clamp(p, 0.0, 1.0)).rgb, vec3(.299, .587, .114));
      vec2 q = project(uv, -.3);
      float r = length(vec2((q.x - uSun.x) * uAspect, q.y - uSun.y)) / (uSun.z * uAspect);
      float g = uWall * smoothstep(.338, .35, p.x) * (1.0 - smoothstep(.713, .725, p.x)) * smoothstep(.14, .152, p.y) * (1.0 - smoothstep(.774, .786, p.y));
      return max(far, g) * max(smoothstep(.42, .6, L), g) * exp(-r * .3);   // בלי "צל קרניים" מהדמויות: הוא יצר הילה שזזה מהידיים והראש
    }

    void main(){
      vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
      vec2 stage = (px - uRes * .5 - uPan) / (uUnit * uZoom);
      vec2 uv = (stage - uRect.xy) / uRect.zw;

      // סורקים מהקרוב לרחוק, עד שפוגעים במשטח, ואז מחדדים בחיפוש בינארי
      const int STEPS = 22;                        // פחות צעדים (עם החיפוש הבינארי זה אותו דיוק): השיידר מורכב מהר יותר ורץ קל יותר
      float hn = 0.0, prev = 1.0;
      for (int i = 0; i < STEPS; i++) {
        float n = 1.0 - float(i) / float(STEPS - 1);
        if (nearAt(project(uv, n)) >= n) { hn = n; break; }
        prev = n;
      }
      float lo = hn, hi = prev;
      for (int j = 0; j < 6; j++) {
        float mid = (lo + hi) * .5;
        if (nearAt(project(uv, mid)) >= mid) lo = mid; else hi = mid;
      }
      hn = lo;
      vec2 hit = project(uv, hn);
      vec3 src = texture2D(uImg, clamp(hit, 0.0, 1.0)).rgb;

      float edge = smoothstep(0.0, .14, hit.x) * smoothstep(1.0, .86, hit.x)
                 * smoothstep(0.0, .1, hit.y) * smoothstep(1.0, .9, hit.y);
      float k = edge * (1.0 - uIntro);

      // כהה על כהה
      float L = dot(src, vec3(.299, .587, .114));
      float tone = pow(clamp((L - .02) / .98, 0.0, 1.0), uGamma);
      vec3 col = mix(uBg, uTint, tone * uStrength * k);

      // בחוץ: רק איפה שרואים שמיים או ים דרך הזכוכית (רחוק ובהיר, לא המסגרות הכהות)
      float outside = (1.0 - smoothstep(.07, .16, hn)) * smoothstep(.42, .6, L) * k;
      float waveHi = 0.0;                                   // רכסי הגלים, כדי שיישארו גלויים גם כשהים מעומעם
      // מעל קו המים (שמיים והרים): לא תלוי במפת העומק, שסימנה את ההרים כקרובים והשאירה אותם ככתם כחול
      outside = max(outside, step(hit.y, .5) * smoothstep(.3, .45, L) * k);
      // רק דרך הזכוכית: בלי קיר הבטון הבהיר משמאל לחלון ובלי התקרה, שאחרת נצבעים כשמיים בקצוות משוננים
      // הזכוכית הגדולה עד העמוד (קצה ישר ב-.719), ופס הזכוכית הצר שמימין לעמוד
      float glass = smoothstep(.344, .353, hit.x) * (1.0 - smoothstep(.716, .719, hit.x))
                  + smoothstep(.7545, .7575, hit.x) * (1.0 - smoothstep(.766, .769, hit.x));
      outside *= glass * smoothstep(.146, .156, hit.y);
      // בגלילה החדר נעלם (קירות, תקרה, מסגרות החלון): במקומו מציירים את השמיים והים עצמם,
      // באותו צבע בסיס שרואים דרך הזכוכית, ואז כל אפקטי הזריחה והגלים חלים על כל המסך
      if (uRoom > 0.0) {
        vec2 qq = project(uv, -.3);
        float skyB = smoothstep(.502, .496, qq.y);
        vec3 skyBase = mix(uBg, uTint, .64 * uStrength / .72);
        vec3 seaBase = mix(uBg, uTint, .56 * uStrength / .72);
        col = mix(col, mix(seaBase, skyBase, skyB), uRoom);   // גם מה שנראה דרך הזכוכית: אחרת נשארים קווים של המסגרות
        outside = mix(outside, 1.0, uRoom);
      }
      if (uWall > 0.0) {
        float gx = smoothstep(.338, .35, hit.x) * (1.0 - smoothstep(.713, .725, hit.x));
        float gy = smoothstep(.14, .152, hit.y) * (1.0 - smoothstep(.774, .786, hit.y));
        float win = uWall * gx * gy;
        vec2 qw = project(uv, -.3);
        float skyW = smoothstep(.502, .496, qw.y);
        vec3 skyBaseW = mix(uBg, uTint, .64 * uStrength / .72);
        vec3 seaBaseW = mix(uBg, uTint, .56 * uStrength / .72);
        col = mix(col, mix(seaBaseW, skyBaseW, skyW), win);
        outside = max(outside, win);
      }
      if (outside > 0.0) {
        vec2 q = project(uv, -.3);                          // השמש והעננים רחוקים יותר מהחלון
        vec2 dv = vec2((q.x - uSun.x) * uAspect, q.y - uSun.y);
        float r = length(dv) / (uSun.z * uAspect);
        const float HORIZON = .499;                            // קו המים בצילום
        float sky = smoothstep(HORIZON + .003, HORIZON - .003, q.y);
        float halo = (exp(-r * .45) * .6 + exp(-r * 1.4) * .45) * mix(.3, 1.0, uRise) * (1.0 - uSunOff);   // הילה חמה רחבה, מתחזקת עם הזריחה
        // עננים דקים שחוצים את השמיים, מוארים בחום ליד השמש
        float cl = (cloudLayer(project(uv, -.45), .006, 0.0) * .7 + cloudLayer(project(uv, -.8), .010, 3.7) * .5) * uClouds;
        cl *= 1.0 - .85 * texture2D(uClear, px / uRes).r;          // הסמן נושף אותם הצידה
        vec3 cloudC = mix(uCloudCol, uSunCol, .55 * exp(-r * .7));
        // שביל אור על המים
        float below = 1.0 - sky;
        float path = exp(-pow(dv.x / (uSun.z * uAspect * (.7 + (q.y - HORIZON) * 7.0)), 2.0))
                   * smoothstep(HORIZON + .28, HORIZON, q.y)
                   * (.7 + .3 * vnoise(vec2(q.x * 160.0, q.y * 900.0 - uTime * .6)));   // נצנוץ רך, לא פסים
        path *= mix(.35, 1.0, uRise) * (1.0 - uSunOff);
        // הדיסק עצמו, רך בקצוות. בזריחה הוא יוצא מתוך קו המים
        float disc = (1.0 - smoothstep(.62, 1.0, r)) * sky * (1.0 - uSunOff);
        // פס זריחה חם לאורך קו האופק, רחב סביב השמש, שמתחזק ככל שהיא עולה
        float band = exp(-abs(q.y - HORIZON) * 22.0) * exp(-pow(dv.x / (uAspect * .55), 2.0)) * (1.0 - uSunOff);
        vec3 dawn = mix(uSunCol, vec3(.96, .62, .58), .35);
        // גלים עדינים במים: מישור בפרספקטיבה, צפופים ליד האופק ורחבים קרוב.
        // שתי שכבות שמתגלגלות לאט מהאופק אלינו (כמו גלים אמיתיים), אחת נוטה מעט לצד
        float dd = max(q.y - HORIZON, .0015);
        vec2 wp = vec2(q.x * 2.6 / dd, 1.0 / dd);
        // גלים ארוכים (רוחב גדול, מעט שורות), כדי שהתנועה תיראה ולא תהיה רעש דק
        float w1 = fbm(vec2(wp.x * .06 + uTime * .012, wp.y * .32 + uTime * .42));
        float w2 = fbm(vec2(wp.x * .1 - uTime * .018 + 4.0, wp.y * .5 + uTime * .55));
        float wn = w1 * .6 + w2 * .4;
        float wfade = below * smoothstep(.003, .03, dd);
        float crest = smoothstep(.5, .72, wn) * wfade * smoothstep(HORIZON + .32, HORIZON + .04, q.y);
        float trough = smoothstep(.46, .2, wn) * wfade;
        waveHi = smoothstep(.46, .86, wn) * wfade * smoothstep(HORIZON + .6, HORIZON + .03, q.y) * outside;   // רך ורחב: נשימה של אור, לא קווים
        // שמיים של זריחה: זהב ליד האופק, ורוד באמצע וסגול למעלה. מתחממים ככל שהשמש עולה
        float hgt = clamp((HORIZON - q.y) / .32, 0.0, 1.0);
        vec3 skyCol = mix(uSkyLo, uSkyMid, smoothstep(.0, .5, hgt));
        skyCol = mix(skyCol, uSkyHi, smoothstep(.45, 1.0, hgt));
        vec3 o = col;
        o = mix(o, skyCol, sky * mix(.35, 1.0, uRise) * uSkyAmt * (1.0 - .35 * hgt));
        o = mix(o, mix(uSeaLo, uSeaHi, smoothstep(HORIZON, HORIZON + .25, q.y)), below * mix(.35, 1.0, uRise) * uSeaAmt);   // המים משקפים את הצבעים
        o = mix(o, uSunCol, clamp(halo * sky * .95 + path * below * .3, 0.0, 1.0));
        o = mix(o, dawn, clamp(band * uRise * .6, 0.0, 1.0));
        o = mix(o, mix(uTint * 1.25, dawn, clamp(path * 2.0 + band * uRise, 0.0, 1.0)), crest * .6 * (1.0 - .7 * uDim));    // רכס הגל (נרגע מאוד כשהים הופך לרקע של האזור הבא, כדי שלא יהיו פסים): בהיר, וחם בשביל האור
        o = mix(o, uBg, trough * .3 * (1.0 - .7 * uDim));                                                                              // והשקע שבין הגלים כהה יותר
        o = mix(o, cloudC, clamp(cl * sky, 0.0, 1.0) * .5);
        vec3 core = mix(uSunCol, vec3(1.0, .86, .62), (.3 + .35 * uRise) * (1.0 - r));   // ככל שעולה, הלב שלה זהוב ובהיר יותר
        o = mix(o, core, disc * .92);
        col = mix(col, o, outside);
      }

      // איפה השמש במסך (כולל התזוזה עם העכבר)
      vec2 S = uTarget + (uSun.xy - uTarget) * scaleFor(-.3) + uMouse * (-.3 - uFocus) * uDepthAmt;

      // המשפחה: שכבה משלה, עומדת על הרצפה מול החלון
      vec2 fuv = famUV(uv);
      float fin = (1.0 - uIntro) * uFamAlpha;
      const float FEET = .99;                               // קו כפות הרגליים בשכבה
      if (fuv.x > -.15 && fuv.x < 1.15 && fuv.y > .85 && fuv.y < 1.45) {
        // צל מגע: כהות רכה בדיוק מתחת לכפות הרגליים, כדי שהם יעמדו על הרצפה
        float cover = 0.0;
        for (int k = -3; k <= 3; k++) cover += texture2D(uFam, vec2(clamp(fuv.x + float(k) * .016, 0.0, 1.0), FEET - .012)).a;
        cover /= 7.0;
        float ao = cover * exp(-abs(fuv.y - FEET) / .02);
        // צל ארוך לכיוון המצלמה (השמש מאחוריהם): מתחיל מהרגליים, מתרכך ונעלם
        float t = (fuv.y - FEET) / .36;
        float castSh = 0.0;
        if (t > 0.0 && t < 1.0) {
          float sy = FEET - t * FEET;
          float sx = .5 + (fuv.x - .5) / (1.0 + t * .35);
          float bl = .006 + t * .03;
          castSh = (texture2D(uFam, vec2(clamp(sx - bl, 0.0, 1.0), sy)).a
                + texture2D(uFam, vec2(clamp(sx, 0.0, 1.0), sy)).a
                + texture2D(uFam, vec2(clamp(sx + bl, 0.0, 1.0), sy)).a) / 3.0;
          castSh *= pow(1.0 - t, 1.6) * step(0.0, sx) * step(sx, 1.0);
        }
        float shadowK = 1.0 - uLook.z;                   // בהשתקפות: הצל מתחלף בבבואה
        col = mix(col, uBg * .55, clamp(max(ao * .75, castSh * .5 * shadowK), 0.0, 1.0) * fin);
        // השתקפות: הבבואה של המשפחה ברצפה מבריקה, חדה ליד הרגליים ונעלמת למטה
        if (uLook.z > 0.0) {
          float tm = (fuv.y - FEET) / .55;
          if (tm > 0.0 && tm < 1.0) {
            vec2 mu = vec2(fuv.x, FEET - tm * .55);
            float ma = texture2D(uFam, clamp(mu, 0.0, 1.0)).a * step(0.0, fuv.x) * step(fuv.x, 1.0);
            vec3 mc = mix(uBg, uTint, .1 * uStrength);
            col = mix(col, mc, ma * pow(1.0 - tm, 1.5) * .8 * uLook.z * fin);
          }
        }
      }
      // משולש אור בצורת הלוגו מאחוריהם, כמו גג של אור שמגן עליהם
      if (uLook.y > 0.0) {
        // בקואורדינטות של המשפחה: קודקוד מעל ראש האב, צלע אנכית משמאל, אלכסון יורד ימינה
        vec2 A = vec2(-.12, -.32), Cp = vec2(1.12, FEET);
        vec2 q = fuv;
        // מרחק חתום משולש (פנימה חיובי), לקצה רך
        float e1 = (q.x - A.x);                                            // הצלע האנכית
        float e2 = (FEET - q.y);                                           // הבסיס
        vec2 hyp = normalize(vec2(Cp.y - A.y, -(Cp.x - A.x)));             // נורמל לאלכסון
        float e3 = -dot(q - A, hyp);
        float inside = min(min(e1, e2), e3);
        float tri = smoothstep(-.004, .012, inside);   // קצה חד, בלי טשטוש
        float grad = mix(.45, 1.0, smoothstep(-.32, FEET, q.y));          // חזק יותר למטה, ליד הרצפה
        col = mix(col, mix(uTint, vec3(1.0, .86, .76), .55), tri * grad * .3 * uLook.y * fin);
      }
      if (fuv.x > 0.0 && fuv.x < 1.0 && fuv.y > 0.0 && fuv.y < 1.0) {
        float a = texture2D(uFam, fuv).a;
        vec3 fc = mix(uBg, uTint, .14 * uStrength);       // צללית נקייה, בלי הילה
        if (uLook.x > 0.0) {
          // פרטים אמיתיים: שיער, קפלי בד וצורות גוף, בטון כהה של החדר
          float Lf = dot(texture2D(uFam, fuv).rgb, vec3(.299, .587, .114));   // בלי חלוקה בשקיפות: זה מה שיצר הילה בקצוות
          vec3 light = mix(uTint, vec3(.78, .74, .86), .25);
          float v = clamp(.08 + pow(Lf, .8) * .95, 0.0, 1.0);                 // רגיל
          if (uLook.w > .5 && uLook.w < 1.5) v = clamp(pow(Lf, 1.15) * .72, 0.0, 1.0);          // כהה
          if (uLook.w > 1.5) v = pow(smoothstep(.05, .5, Lf), 1.5) * .95;                        // כהה עם קונטרסט (הגרסה שנבחרה)
          v *= smoothstep(.55, .95, a);                                          // הקצה נשאר כהה ונקי
          vec3 fd = mix(uBg * (uLook.w > .5 ? .8 : 1.0), light, v * uStrength);
          fc = mix(fc, fd, uLook.x);
        }
        // דמויות מוארות: הצבעים האמיתיים של הצילום, מוארים בחום של הזריחה (בלי לאבד את הפרטים)
        if (uFamLit > 0.0) {
          vec3 fr = texture2D(uFam, fuv).rgb;
          vec3 lit = pow(fr, vec3(.72)) * 1.3 + vec3(.06, .04, .03);
          lit *= vec3(1.06, .97, .92);
          fc = mix(fc, lit, uFamLit * smoothstep(.55, .95, a));
        }
        col = mix(col, fc, a * fin);                      // אטום לגמרי: עמודי החלון שמאחוריהם לא נראים דרכם
      }

      // קרני אור: מהשמש פנימה לחדר, עוברות בין הדמויות ומשתנות עם העכבר
      if (uRays > 0.0) {
        float acc = 0.0, w = 1.0;
        for (int i = 0; i < 11; i++) {                 // 11 דגימות במקום 18: אותן קרניים רכות, חצי מהעבודה לכרטיס המסך
          vec2 p = mix(uv, S, float(i) / 11.0 * .9);
          acc += sunMask(p) * w;
          w *= .885;
        }
        float rays = acc / 5.6;
        rays *= 1.0 - famA(uv);                          // הדמויות לפני האור: הקרניים לא עוברות עליהן (אחרת עמוד החלון מטיל עליהן פס כהה)
        col += uSunCol * rays * uRays * edge * (1.0 - uIntro) * uRayAmt;
      }

      // הילה עדינה מאוד סביב הסמן: אור בהיר ורך עם מרקם של ענן
      if (uCursor.z > .001) {
        vec2 d = (px - uCursor.xy) / (uUnit * 280.0);
        float fall = exp(-dot(d, d) * 1.6);
        float cloud = .55 + .45 * fbm(px / (uUnit * 210.0) + vec2(uTime * .05, -uTime * .03));
        col = mix(col, vec3(.9, .96, 1.0), fall * cloud * .1 * uCursor.z * (1.0 - uIntro));   // תכלת בהיר מאוד, בלי צהוב
      }

      col = mix(col, uNavy, uDim);
      // באזור הבא: הים נשאר כהה, ורק אור עדין מאוד על רכסי הגלים נע לאט (חלש, כדי שלא ייראה כפסים)
      col = mix(col, mix(uTint, vec3(.98, .72, .55), .25) * .9, waveHi * uWaves * .1);
      gl_FragColor = vec4(col, 1.0);
    }`;

  const FRAG_PHOTO = `
    precision highp float;
    uniform sampler2D uBgTex, uFamTex, uPlateTex, uMaskTex, uSunTex;
    uniform float uRoom, uHasPlate, uDisc, uSpill, uHasMask, uSunOn, uWave;
    uniform vec2 uView, uImgPx;
    uniform vec3 uCursor;
    uniform vec4 uFloor, uFx;   // uFx.z: העננים נעים
    uniform float uDepthK;      // בגלילה: החדר נעלם ונשאר רק הנוף (החלונית האמצעית, משוכפלת במראה לצדדים ולמטה)
    uniform vec2 uRes, uPan, uMouse, uPar, uScrim;
    uniform float uUnit, uZoom, uTime, uIntro, uDim, uFamAlpha, uLift, uHorizon, uRise, uVig, uEdgeW, uSunVis, uFeet, uSky;
    uniform vec4 uRect, uFamRect, uGlass, uPane;
    uniform vec3 uSun, uEdge, uNavy;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vnoise(vec2 p){
      vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
    }
    vec3 skyAt(float t){
      vec3 sk = mix(vec3(1.0, .66, .48), vec3(.98, .56, .58), smoothstep(0.0, .14, t));
      sk = mix(sk, vec3(.84, .5, .66), smoothstep(.1, .38, t));
      sk = mix(sk, vec3(.52, .45, .76), smoothstep(.32, .66, t));
      return mix(sk, vec3(.24, .32, .66), smoothstep(.6, 1.0, t));
    }
    // מסכת המשפחה (איפה יש אנשים בצילום)
    float famAt(vec2 p){ return uHasMask > .5 ? texture2D(uMaskTex, clamp(p, .0005, .9995)).r : 0.0; }
    // השמש מהצילום (שכבה משלה): מה שהיא מוסיפה לשמיים, במיקום הנוכחי שלה, ורק מעל קו המים
    vec3 sunAt(vec2 p){
      vec2 s = (p - uSun.xy) * uImgPx + .5;
      if (s.x < 0.0 || s.x > 1.0 || s.y < 0.0 || s.y > 1.0) return vec3(0.0);
      return texture2D(uSunTex, s).rgb * smoothstep(uHorizon + .0008, uHorizon - .0012, p.y) * uSunOn;
    }
    vec2 mirrorIn(vec2 p, vec4 r){
      p.x = p.x < r.x ? 2.0 * r.x - p.x : (p.x > r.z ? 2.0 * r.z - p.x : p.x);
      p.y = p.y < r.y ? 2.0 * r.y - p.y : (p.y > r.w ? 2.0 * r.w - p.y : p.y);
      return p;
    }
    // הנוף בלי החדר: החלונית האמצעית (בלי מסגרות), משוכפלת במראה לרוחב; הים משוכפל במראה כלפי מטה, והשמיים ממשיכים למעלה
    vec3 view(vec2 uv){
      float wd = uPane.z - uPane.x;
      float t0 = (uv.x - uPane.x) / wd;
      float t = 1.0 - abs(mod(t0, 2.0) - 1.0);
      float x = uPane.x + t * wd, y = uv.y;
      float sh = uPane.w - (uHorizon + .02);
      if (y > uPane.w) { float k = y - uPane.w; y = uPane.w - (sh - abs(mod(k, 2.0 * sh) - sh)); }
      float yTop = uPane.y + .035;                                        // שורה נקייה של שמיים, מתחת למשקוף
      vec3 c = texture2D(uPlateTex, vec2(x, max(y, yTop))).rgb;
      // מחוץ לחלון עצמו: ממוצע של השורה (בלי לשכפל את השמש), כך שהשמיים והים ממשיכים לצדדים כמעבר רך
      float yy = max(y, yTop);
      vec3 av = vec3(0.0);
      for (int k = 0; k < 6; k++) av += texture2D(uPlateTex, vec2(uPane.x + wd * (float(k) + .5) / 6.0, yy)).rgb;
      av /= 6.0;
      float outside = smoothstep(0.0, .3, max(-t0, t0 - 1.0));
      c = mix(c, av, outside);
      // מעל החלון: ממוצע השורה (בלי פסים), שמתכהה בעדינות לכחול עמוק כלפי מעלה
      vec3 rowTop = vec3(0.0);
      for (int k = 0; k < 6; k++) rowTop += texture2D(uPlateTex, vec2(uPane.x + wd * (float(k) + .5) / 6.0, yTop)).rgb;
      rowTop /= 6.0;
      float up = smoothstep(0.0, .05, yTop - uv.y);
      return mix(c, mix(rowTop, rowTop * vec3(.62, .68, .92), smoothstep(0.0, .5, yTop - uv.y)), up);
    }
    void main(){
      vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
      vec2 stage = (px - uRes * .5 - uPan) / (uUnit * uZoom);
      // החדר: זז עם העכבר לפי עומק. קיר החלון זז מעט, והקירות, התקרה והרצפה שקרובים אלינו זזים יותר
      vec2 uv0 = (stage - uRect.xy) / uRect.zw;
      float dn = clamp(max(max((uGlass.x - uv0.x) / uGlass.x, (uv0.x - uGlass.z) / (1.0 - uGlass.z)), max((uv0.y - uFloor.x) / (1.0 - uFloor.x), (uGlass.y - uv0.y) / uGlass.y)), 0.0, 1.0);
      vec2 uv = uv0 + uMouse * uPar.x * (1.0 + uDepthK * dn) / uRect.zw;
      // הרצפה שלפני החלון נמתחת: המשפחה (שכבה משלה) עומדת רחוק יותר מהחלון, והצללים שלה זזים איתה
      vec2 ruv = uv;
      if (uv.y > uFloor.x && uv.y < uFloor.w) {
        float yy = uv.y < uFloor.z ? uFloor.x + (uv.y - uFloor.x) * (uFloor.y - uFloor.x) / (uFloor.z - uFloor.x)
                                   : uFloor.y + (uv.y - uFloor.z) * (uFloor.w - uFloor.y) / (uFloor.w - uFloor.z);
        float wx = smoothstep(uGlass.x - .08, uGlass.x - .01, uv.x) * (1.0 - smoothstep(uGlass.z + .01, uGlass.z + .08, uv.x));
        ruv.y = mix(uv.y, yy, wx);
      }
      vec3 col = texture2D(uBgTex, clamp(ruv, .0005, .9995)).rgb;
      float fam = famAt(uv);
      {
        // הזכוכית עצמה (מבפנים למסגרת)
        vec4 vr = vec4(uGlass.x + .0006, uGlass.y + .0018, uGlass.z - .0016, uGlass.w - .003);
        float paneM = smoothstep(vr.x, vr.x + .0012, uv.x) * (1.0 - smoothstep(vr.z - .0012, vr.z, uv.x)) * smoothstep(vr.y, vr.y + .0012, uv.y) * (1.0 - smoothstep(vr.w - .0012, vr.w, uv.y));
        if (paneM > 0.0) {
          // הנוף רחוק: זז אחרת מהחדר (תלת-מימד). ליד המסגרת התזוזה נחלשת בהדרגה, כך שאין תפר
          float ef = smoothstep(vr.x, vr.x + .035, uv.x) * smoothstep(vr.z, vr.z - .035, uv.x) * smoothstep(vr.y, vr.y + .05, uv.y) * smoothstep(vr.w, vr.w - .03, uv.y);
          vec2 pv = mirrorIn(uv + uView * ef, vr);
          float lite = 1.0;
          float dsea = (pv.y - uHorizon) / max(.001, vr.w - uHorizon);
          if (dsea > 0.0 && uWave > 0.0) {
            // גלים: גלים רכים שמתקרבים מהאופק (בפרספקטיבה: רחוק קטנים וצפופים, קרוב גדולים), ואדוות לרוחב
            float z = 1.0 / (dsea + .08);
            float ph = z * 3.6 + uTime * 1.5;
            float amp = mix(.00025, .0026, dsea * dsea) * uWave;
            float rip = vnoise(vec2(pv.x * 150.0 / (dsea + .2), z * 4.0 - uTime * 1.1)) - .5;
            vec2 dw = vec2(sin(ph * .6 + pv.x * 55.0 + uTime * .7) * .7 + rip * 1.5, sin(ph)) * amp;
            pv += dw;
            pv.y = max(pv.y, uHorizon + .0015);
            pv = mirrorIn(pv, vr);
            lite = 1.0 + (sin(ph) * .5 + rip * .6) * .09 * dsea * uWave;   // רכסי הגלים תופסים קצת יותר אור
          }
          vec2 pvs = pv;
          if (uFx.z > .001 && pv.y < uHorizon) {
            float hgt = clamp((uHorizon - pv.y) / max(.001, uHorizon - vr.y), 0.0, 1.0);
            pvs.x += (sin(uTime * .045) * .03 + sin(uTime * .11 + 1.7) * .006) * hgt * hgt * uFx.z * ef;
            pvs = mirrorIn(pvs, vr);
          }
          vec3 bgv = texture2D(uBgTex, pvs).rgb;
          if (uHasPlate > .5) bgv = mix(bgv, texture2D(uPlateTex, pv).rgb, famAt(pv));   // מאחורי האנשים: רקע נקי (השמיים והים ממשיכים בגוון של הצילום)
          bgv = bgv * lite + sunAt(pv);
          col = mix(col, bgv, paneM * (1.0 - fam * uFamAlpha));                 // המשפחה מלפנים (ונמוגה בגלילה)
        }
      }
      float aspect = uRect.z / uRect.w;
      // הזכוכית בלבד: בתוך המלבן של החלון, ורק איפה שבהיר (המסגרות והעמודים הכהים לא מקבלים את האור של השמש)
      float inRect = smoothstep(uGlass.x, uGlass.x + .002, uv.x) * (1.0 - smoothstep(uGlass.z - .002, uGlass.z, uv.x)) * smoothstep(uGlass.y, uGlass.y + .002, uv.y) * (1.0 - smoothstep(uGlass.w - .002, uGlass.w, uv.y));
      float glass = inRect * smoothstep(.3, .48, dot(col, vec3(.3, .55, .15)));
      // הקירות והרצפה מתכהים בעדינות ככל שמתרחקים מהחלון (רק אור השחר מאיר את החדר), והטקסט יושב על רקע כהה
      vec2 vq = (uv - vec2(.5, .43)) * vec2(1.0, 1.45);
      col = mix(col, uEdge, smoothstep(.12, .64, length(vq)) * uVig * (1.0 - inRect));
      {
        float ddx = max(max(uGlass.x - uv.x, uv.x - uGlass.z), 0.0) * aspect;
        float ddy = max(max(uGlass.y - uv.y, uv.y - uGlass.w), 0.0);
        float floorLobe = step(uGlass.w, uv.y);                              // על הרצפה האור נשפך רחוק יותר קדימה
        float dd2 = length(vec2(ddx * mix(1.0, .8, floorLobe), ddy * mix(1.0, .55, floorLobe)));
        float sp = (exp(-dd2 * 7.0) * .75 + exp(-dd2 * 2.6) * .25) * (1.0 - inRect) * uSpill * (1.0 - uRoom) * (1.0 - fam);   // לא על האנשים
        col = 1.0 - (1.0 - col) * (1.0 - vec3(.96, .8, .84) * sp);
      }
      float inside = smoothstep(0.0, uEdgeW, uv.x) * smoothstep(1.0, 1.0 - uEdgeW, uv.x) * smoothstep(0.0, uEdgeW, uv.y) * smoothstep(1.0, 1.0 - uEdgeW, uv.y);
      col = mix(uEdge, col, inside);
      if (uRoom > 0.0) col = mix(col, view(uv) + sunAt(uv), uRoom);
      glass = mix(glass, 1.0, uRoom);
      {
        float L = dot(col, vec3(.3, .55, .15));
        float t = clamp((uHorizon - uv.y) / max(.001, uHorizon - uGlass.y), 0.0, 1.0);   // 0 באופק, 1 בראש החלון
        vec3 sk = skyAt(t);
        float dsea = clamp((uv.y - uHorizon) / max(.001, uGlass.w - uHorizon), 0.0, 1.5);
        vec3 sb = mix(vec3(.88, .56, .62), vec3(.27, .32, .6), smoothstep(0.0, .7, dsea));
        sb = mix(sb, vec3(.16, .2, .44), smoothstep(.7, 1.5, dsea));
        vec3 se = sb * (.5 + .75 * L);                                   // שומר על המרקם של הגלים
        float isSky = smoothstep(uHorizon + .0015, uHorizon - .0015, uv.y);
        vec3 graded = mix(se, mix(sk, sk * (.85 + .3 * L), .3), isSky);
        col = mix(col, graded, glass * uSky);
        float fl = uv.y - (uGlass.w + .004);
        if (fl > 0.0 && uRoom < 1.0) {
          float my = uHorizon - fl * 1.35;                                 // המקום בשמיים שהרצפה משקפת כאן
          float ft = clamp((uHorizon - my) / max(.001, uHorizon - uGlass.y), 0.0, 1.0);
          float xin = smoothstep(uGlass.x - .05, uGlass.x + .02, uv.x) * (1.0 - smoothstep(uGlass.z - .02, uGlass.z + .05, uv.x));
          float fr = xin * exp(-fl * 5.5) * .42 * uSky * (1.0 - uRoom);
          col = mix(col, skyAt(ft) * (.55 + .5 * L), fr);
        }
      }
      // השמש: עולה לאט מתוך הים. דיסק עגול וחד, הילה חמה שמתחזקת עם הזריחה, והשמיים סביבה מתחממים
      float hz = uHorizon;
      vec2 d = vec2((uv.x - uSun.x) * aspect, uv.y - uSun.y);
      float r = length(d) / uSun.z;
      float breathe = .5 + .5 * sin(uTime * .6);
      float sky = smoothstep(hz + .0012, hz - .0012, uv.y);
      vec3 sunCol = vec3(1.0, .62, .36);
      float sv = uSunVis;
      // השמיים סביב השמש מתחממים (גוון אפרסק-זהב), וההילה מתחזקת ככל שהיא עולה
      float warm = exp(-r * .28) * (.4 + .35 * uRise) * sky * sv;
      col = mix(col, col * vec3(1.08, .86, .72) + vec3(.1, .03, .0), clamp(warm * mix(.35, 1.0, uDisc), 0.0, 1.0) * glass);
      float halo = (exp(-r * .9) * .8 + exp(-r * .26) * .3) * (.6 + .4 * uRise) * (.9 + .1 * breathe);
      float band = exp(-abs(uv.y - hz) * 46.0) * exp(-pow((uv.x - uSun.x) * aspect / .26, 2.0)) * (.12 + .3 * uRise);
      col += sunCol * (halo * .35 * sky + band * .55) * glass * sv * mix(.3, 1.0, uDisc);
      // שביל האור על המים: עמוד חם מתחת לשמש, עם ניצוצות שזזים לאט
      float dd = uv.y - hz;
      if (dd > 0.0) {
        float pw = uSun.z * .85 + dd * .22;
        float path = exp(-pow((uv.x - uSun.x) * aspect / pw, 2.0)) * exp(-dd * 12.0);
        float sp = vnoise(vec2(uv.x * 900.0, uv.y * 2600.0 / (1.0 + dd * 18.0) - uTime * 1.3));
        col += vec3(1.0, .8, .6) * path * (.2 + .95 * smoothstep(.55, .95, sp)) * (.35 + .65 * uRise) * glass * sv;
      }
      float edge = 1.4 / (uSun.z * uRect.w * uUnit * uZoom);   // קצה חד: כפיקסל וחצי
      float disc = (1.0 - smoothstep(1.0 - edge, 1.0, r)) * sky * uDisc;
      // דיסק מלא ובהיר (בלי שפה כהה שנראית כמו טבעת): זהב-לבן, מעט חם יותר בשוליים
      // השמש כאור אחד: הלב (הדיסק) הוא הנקודה הבהירה ביותר, וממנו האור יורד החוצה (בלי טבעת). מיזוג screen, כמו אור אמיתי
      float gl = exp(-max(r - 1.0, 0.0) * 3.0) * .45 + exp(-r * .3) * .22 * (.6 + .4 * uRise);
      float I = max(disc, gl * (1.0 - disc));
      vec3 sc = mix(vec3(1.0, .48, .28), vec3(1.0, .74, .46), smoothstep(.2, .9, gl));
      col = 1.0 - (1.0 - col) * (1.0 - clamp(sc * gl * (1.0 - disc) * glass * sv * sky * mix(.42 + .14 * breathe, 1.0, uDisc), 0.0, 1.0));   // ההילה: כתום-ורוד חם (על שמש של צילום: עדינה ונושמת)
      vec3 dc = mix(vec3(1.0, .78, .5), vec3(1.0, .93, .78), smoothstep(1.0, .15, r));                  // הדיסק: זהוב-חם, לב בהיר יותר
      col = mix(col, dc, disc * glass * sv);
      // השתקפות רכה של השמש ברצפה המבריקה, מתחת לחלונית שלה
      float fy = uGlass.w + .006;
      if (uv.y > fy) {
        float ry = fy + (fy - uSun.y) * .55;
        float fr = exp(-pow((uv.x - uSun.x) * aspect / (uSun.z * 2.4), 2.0)) * exp(-pow((uv.y - ry) / (uSun.z * 5.5), 2.0));
        col += sunCol * fr * .24 * (.3 + .7 * uRise) * (1.0 - uRoom) * sv * uDisc;
      }
      // המשפחה: שכבה משלה (כולל ההשתקפות שלה ברצפה), זזה עוד קצת עם העכבר
      vec2 fuv0 = (stage - uRect.xy + uMouse * uPar.y) / uRect.zw;
      vec2 fuv = (fuv0 - uFamRect.xy) / uFamRect.zw;
      float rv = fuv.y - uFeet;
      if (fuv.x > 0.0 && fuv.x < 1.0 && rv > 0.0 && rv < .7) {
        vec2 m = vec2(fuv.x, uFeet - rv);
        float dy = .006 + rv * .02;                                      // מטושטשת יותר ככל שמתרחקת מהרגליים
        vec4 r0 = texture2D(uFamTex, m), r1 = texture2D(uFamTex, m + vec2(0.0, dy)), r2 = texture2D(uFamTex, m - vec2(0.0, dy));
        vec4 rf = (r0 * 2.0 + r1 + r2) * .25;
        float fade = pow(1.0 - rv / .7, 2.2) * .34;
        col = mix(col, mix(rf.rgb, col, .45), rf.a * fade * uFamAlpha);
      }
      if (fuv.x > 0.0 && fuv.x < 1.0 && fuv.y > 0.0 && fuv.y < 1.0) {
        vec4 f = texture2D(uFamTex, fuv);
        vec3 fl = pow(f.rgb, vec3(1.0 / (1.0 + uLift))) * (1.0 + .18 * uLift) + vec3(.03, .015, .01) * uLift;
        col = mix(col, fl, f.a * uFamAlpha);
      }
      // הטקסט: הצדדים כהים מעט יותר (רק מאחורי הטקסט)
      float xs = px.x / uRes.x;
      float ys = px.y / uRes.y;
      vec2 di = vec2((xs - .74) * 1.6, ys - .64);
      col *= 1.0 - uScrim.x * smoothstep(.36, .02, xs) - uScrim.y * (.55 * smoothstep(.54, .98, xs) + .6 * exp(-dot(di, di) * 9.0));
      // הילה חמה ורכה מתחת לעכבר (אור שנשפך על החדר)
      {
        vec2 dc = (px - uCursor.xy) / uRes.y;
        float g = (exp(-dot(dc, dc) / .06) * .22 + exp(-dot(dc, dc) / .3) * .09) * uCursor.z * (1.0 - uRoom);
        col = 1.0 - (1.0 - col) * (1.0 - clamp(vec3(.62, .78, 1.0) * g, 0.0, 1.0));
      }
      col = mix(col, uNavy, uIntro);
      col = mix(col, uNavy, uDim);
      gl_FragColor = vec4(col, 1.0);
    }`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function texture(source, unitIndex, fmt = gl.RGB) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unitIndex);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt, fmt, gl.UNSIGNED_BYTE, source);
    return t;
  }
  function softDepth(img) {
    const c = document.createElement('canvas');
    c.width = 480; c.height = Math.round(480 / imgAspect);
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    if ('filter' in g) g.filter = 'blur(1.2px)';
    g.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  /* ---------- מפת "הנשיפה" של הסמן (ברזולוציה נמוכה, נדעכת לאט) ---------- */
  const clearCanvas = document.createElement('canvas');
  clearCanvas.width = 192; clearCanvas.height = 108;
  const cctx = clearCanvas.getContext('2d');
  cctx.fillStyle = '#000'; cctx.fillRect(0, 0, 192, 108);
  function updateClear(dt) {
    // נדעך: הערפל חוזר בעדינות תוך כמה שניות
    cctx.globalCompositeOperation = 'source-over';
    cctx.fillStyle = `rgba(0,0,0,${Math.min(.06, dt / 1000 * .5)})`;
    cctx.fillRect(0, 0, 192, 108);
    if (mouse.active && mouse.moved > 0) {
      const x = mouse.cx * 192, y = mouse.cy * 108, r = 22;
      const g = cctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${Math.min(.22, mouse.moved * .012)})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      cctx.globalCompositeOperation = 'lighter';
      cctx.fillStyle = g; cctx.fillRect(x - r, y - r, r * 2, r * 2);
      mouse.moved *= .6;
    }
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, clearTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, clearCanvas);
  }

  async function initGL() {
    if (!gl) return false;
    if (PHOTO) {
      const [bg, fam, plate, mask, sunImg] = await Promise.all([loadImg(ds.image), loadImg(ds.family), ds.plate ? loadImg(ds.plate) : null,
        ds.mask ? loadImg(ds.mask) : null, ds.sunImg ? loadImg(ds.sunImg) : null]);
      imgAspect = bg.naturalWidth / bg.naturalHeight;
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG_PHOTO));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      texture(bg, 0);
      texture(fam, 1, gl.RGBA);
      texture(plate || bg, 2);
      texture(mask || bg, 3);
      texture(sunImg || bg, 4);
      ['uBgTex', 'uFamTex', 'uRoom', 'uRes', 'uPan', 'uMouse', 'uPar', 'uScrim', 'uUnit', 'uZoom', 'uTime', 'uIntro', 'uDim', 'uFamAlpha', 'uLift', 'uHorizon',
       'uRect', 'uFamRect', 'uGlass', 'uSun', 'uEdge', 'uNavy', 'uPane', 'uRise', 'uVig', 'uEdgeW', 'uSunVis', 'uFeet', 'uSky', 'uPlateTex', 'uHasPlate', 'uDisc', 'uSpill',
       'uMaskTex', 'uSunTex', 'uHasMask', 'uSunOn', 'uWave', 'uView', 'uImgPx', 'uCursor', 'uFloor', 'uDepthK', 'uFx'].forEach(n => (uni[n] = gl.getUniformLocation(prog, n)));
      gl.uniform1i(uni.uBgTex, 0);
      gl.uniform1i(uni.uFamTex, 1);
      gl.uniform1i(uni.uPlateTex, 2);
      gl.uniform1f(uni.uHasPlate, plate ? 1 : 0);
      gl.uniform1i(uni.uMaskTex, 3);
      gl.uniform1i(uni.uSunTex, 4);
      gl.uniform1f(uni.uHasMask, mask ? 1 : 0);
      gl.uniform1f(uni.uSunOn, sunImg ? 1 : 0);
      gl.uniform2f(uni.uImgPx, bg.naturalWidth / (sunImg ? sunImg.naturalWidth : 128), bg.naturalHeight / (sunImg ? sunImg.naturalHeight : 128));
      readColors();
      glReady = true;
      return true;
    }
    const [img, depth, fam] = await Promise.all([loadImg(ds.image), loadImg(ds.depth), loadImg(ds.family)]);
    imgAspect = img.naturalWidth / img.naturalHeight;
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    texture(img, 0);
    texture(softDepth(depth), 1);
    texture(fam, 2, gl.RGBA);
    clearTex = texture(clearCanvas, 3);
    ['uImg', 'uDepth', 'uFam', 'uClear', 'uRes', 'uUnit', 'uZoom', 'uTime', 'uRect', 'uFamRect', 'uMouse', 'uDepthAmt',
     'uTarget', 'uFocus', 'uFamNear', 'uFamScale', 'uRange', 'uDolly', 'uClouds', 'uFamAlpha', 'uAspect', 'uSun',
     'uStrength', 'uGamma', 'uIntro', 'uDim', 'uRays', 'uCursor', 'uLook', 'uBg', 'uTint', 'uSunCol', 'uCloudCol', 'uRise', 'uRoom', 'uPan', 'uSunOff', 'uWaves',
     'uSkyLo', 'uSkyMid', 'uSkyHi', 'uSeaLo', 'uSeaHi', 'uNavy', 'uSkyAmt', 'uSeaAmt', 'uRayAmt', 'uFamLit', 'uWall']
      .forEach(n => (uni[n] = gl.getUniformLocation(prog, n)));
    gl.uniform1i(uni.uImg, 0);
    gl.uniform1i(uni.uDepth, 1);
    gl.uniform1i(uni.uFam, 2);
    gl.uniform1i(uni.uClear, 3);
    readColors();
    glReady = true;
    return true;
  }

  /* ---------- אופציות להאיר את ההירו (להשוואה; נבחרות מהמתג שבפינה או ?hero=a) ----------
     orig: המקור. a: זריחה עם שמיים תכלת חיים. b: חלון מקיר לקיר בתכלת, דמויות מוארות, טקסט כהה.
     c: שקיעה חמה ומוארת. d: חלון מקיר לקיר בצבעי השקיעה של המקור.
     בגלילה כל אופציה חוזרת בהדרגה לצבעי המקור, כדי שהמעבר לאזור הבא (הכחול) יישאר כמו שהוא */
  const C = h => hexToRgb(h);
  const ORIG = { sky: [[1, .64, .34], [.9, .46, .58], [.5, .36, .72]], skyAmt: .42, sea: [[1, .62, .38], [.7, .42, .6]], seaAmt: .2, rays: .35, famLit: 0, wall: 0 };
  const LOOKS = {
    orig: {},
    a: { bg: '#141133', tint: '#4a4f93', strength: .8, gamma: .58, cloud: '#ffffff', sun: '#FF7A45',
         sky: [[1, .76, .52], [.66, .86, .97], [.36, .7, .95]], skyAmt: .95, sea: [[1, .8, .62], [.3, .58, .82]], seaAmt: .75, rays: .7, famLit: .35 },
    b: { geo: 1, bg: '#5d6f96', tint: '#f3eee9', strength: .82, gamma: .7, cloud: '#ffffff', sun: '#FF7A45',
         sky: [[1, .82, .62], [.74, .89, .98], [.45, .74, .96]], skyAmt: .95, sea: [[1, .84, .7], [.4, .66, .86]], seaAmt: .8, rays: .45, famLit: .75, wall: 1, text: 'dark' },
    c: { bg: '#1d1238', tint: '#6e5a9c', strength: .8, gamma: .56, cloud: '#f2b3a6', sun: '#FF6A3D',
         sky: [[1, .7, .38], [.98, .52, .55], [.62, .42, .8]], skyAmt: .85, sea: [[1, .66, .42], [.74, .46, .66]], seaAmt: .55, rays: .7, famLit: .45 },
    d: { geo: 1, bg: '#2a1f52', tint: '#9b86c9', strength: .78, gamma: .6, cloud: '#f2b3a6', sun: '#FF6A3D',
         sky: [[1, .7, .4], [.96, .54, .6], [.56, .42, .82]], skyAmt: .9, sea: [[1, .68, .46], [.62, .46, .74]], seaAmt: .6, rays: .4, famLit: .55, wall: 1 },
  };
  let lookKey = (new URLSearchParams(location.search).get('hero') || '').toLowerCase();
  try { if (!LOOKS[lookKey]) lookKey = localStorage.getItem('heroLook') || 'orig'; } catch (e) { if (!LOOKS[lookKey]) lookKey = 'orig'; }
  if (!LOOKS[lookKey]) lookKey = 'orig';
  const applyLookClass = () => { document.documentElement.dataset.heroLook = lookKey; document.documentElement.dataset.heroText = LOOKS[lookKey].text || 'light'; };
  applyLookClass();
  window.setHeroLook = k => { if (!LOOKS[k]) return; lookKey = k; try { localStorage.setItem('heroLook', k); } catch (e) {} applyLookClass(); placeSun(); dispatchEvent(new Event('hero-look')); if (calm) drawGL(); };
  window.heroLookKey = () => lookKey;
  const mixV = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  // החלון ממלא את המסך: הצילום גדול פי ~2.7, הזכוכית (u .344–.719) ברוחב הבמה ובמרכזה, קו המים קצת מעל האמצע,
  // והמשפחה עומדת על פס הרצפה שבתחתית, באמצע הרווח שבין שני גושי הטקסט
  const GEO = { scale: 2.168, x: -.084, y: -.266, fam: [.4703, .603, .0684, .22], famScale: 1, sunR: .0085, sunY: .44 };
  const geo = () => (LOOKS[lookKey].geo ? GEO : null);

  let colors = {};
  function readColors() {
    const cs = getComputedStyle(host);
    colors = {
      bg: hexToRgb(cs.getPropertyValue('--scene-bg').trim() || '#090725'),
      tint: hexToRgb(cs.getPropertyValue('--scene-tint').trim() || '#292c5e'),
      sun: hexToRgb(cs.getPropertyValue('--scene-sun').trim() || '#F15A3B'),
      cloud: hexToRgb(cs.getPropertyValue('--scene-cloud').trim() || '#6a6fae'),
      strength: num(cs.getPropertyValue('--scene-strength'), .72),
      gamma: num(cs.getPropertyValue('--scene-gamma'), .62),
    };
  }

  /* המלבן של הזכוכית במסך (פיקסלים של העמוד), לפי הזום הנוכחי. ממנו נפתחת המסכה של הסקשן הבא (sides.js) */
  let lastZoom = 1;
  window.heroGlassLive = () => {
    const r = window.heroGlassRect(); if (!r || !PHOTO) return r;
    const z = unit * lastZoom, v = PH.parView + PH.parBg;
    return { x: r.x - mouse.ex * PH.parBg * z, y: r.y - mouse.ey * .6 * PH.parBg * z, w: r.w, h: r.h, vx: mouse.ex * v * z, vy: mouse.ey * .6 * .7 * v * z };
  };
  window.heroGlassRect = () => {
    if (!glReady) return null;
    const [rx, ry, rw, rh] = sceneRect(), z = unit * lastZoom, hr = host.getBoundingClientRect();
    const pt = (u, v) => [(rx + u * rw) * z + W / 2 + hr.left, (ry + v * rh) * z + H / 2 + hr.top];
    const G = PHOTO ? PH.glass : [.344, .146, .719, .78];
    const [x0, y0] = pt(G[0], G[1]), [x1, y1] = pt(G[2], G[3]);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  };
  function sceneRect() {
    if (PHOTO && mobFit) {
      // מובייל: החלון והמשפחה בגובה המסך, ממורכזים, בין ה-95% שלמעלה ל-5% שלמטה (בזמן המנוחה, אחרי הזום האיטי של הפתיחה)
      const z = SCROLL_FX ? 1.045 : 1, pan = SCROLL_FX ? ZOOM_AT_Y * H * (1 - z) : 0, k = unit * z;
      const y0 = (mobFit.top - H / 2 - pan) / k, y1 = (mobFit.feet - H / 2 - pan) / k;
      const h = Math.max(1, (y1 - y0) / (PH.feetLine - PH.glass[1])), w = h * imgAspect, fc = PH.fam[0] + PH.fam[2] / 2;
      return [-w * fc, y0 - PH.glass[1] * h, w, h];
    }
    if (PHOTO) {
      // במסכים צרים מ-16:9 (כמו 1440×900) הטקסטים קרובים יותר זה לזה, אז הצילום מוקטן באותו יחס: החלון תמיד ברווח שביניהם
      const r = Math.min(1, (W / H) / (REF_W / REF_H)), k = ds.photoFit ? Math.pow(r, num(ds.photoFitK, 1.6)) : 1;
      const w0 = REF_W * PH.w, h0 = w0 / imgAspect, w = w0 * k, h = h0 * k, fx = ds.photoFit ? num(ds.photoFitX, -.19) * REF_W * (1 - r) : 0;
      return [-w / 2 + PH.x * REF_W * k + fx, -REF_H / 2 + PH.top * REF_H + (h0 - h) / 2, w, h];
    }
    const G = geo(), w = REF_W * 1.23 * (G ? G.scale : SCENE_SCALE), h = w / imgAspect;
    return [-w / 2 + SCENE_X * REF_W, REF_H / 2 - h - (G ? G.y : SCENE_Y) * REF_H, w, h];
  }

  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  function drawPhoto() {
    const p = ease(scrollE);
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.uniform2f(uni.uRes, glCanvas.width, glCanvas.height);
    gl.uniform1f(uni.uUnit, unit * DPR);
    const tz = Math.min(1, (performance.now() - t0) / 14000);
    lastZoom = SCROLL_FX ? 1.0 + .045 * (1 - Math.pow(1 - tz, 3)) + 1.4 * Math.pow(p, 1.7) : 1.0 + AMB_ZOOM * (.5 - .5 * Math.cos((performance.now() - t0) / 1000 * Math.PI * 2 / AMB_CYCLE));
    gl.uniform1f(uni.uZoom, lastZoom);
    gl.uniform2f(uni.uPan, 0, SCROLL_FX ? ZOOM_AT_Y * glCanvas.height * (1 - lastZoom) : 0);
    gl.uniform1f(uni.uTime, (performance.now() - t0) / 1000);
    gl.uniform4f(uni.uRect, ...sceneRect());
    gl.uniform4f(uni.uFamRect, ...PH.fam);
    gl.uniform4f(uni.uGlass, ...PH.glass);
    // הזריחה: מתחילה כשמסך הטעינה נפתח. המרכז של השמש על קו המים (חצי שמש), ועולה לאט ב-14 שניות ונעצרת ברכות
    if (!riseT0 && !document.documentElement.classList.contains('is-loading')) riseT0 = performance.now() + 400;
    const rt = calm ? 1 : riseT0 ? Math.min(1, Math.max(0, (performance.now() - riseT0) / 1000 / PH.riseTime)) : 0;
    const rise = 1 - Math.pow(1 - rt, 1.7);
    gl.uniform3f(uni.uSun, PH.sun[0], PH.rise[0] + (PH.rise[1] - PH.rise[0]) * rise, PH.sun[2]);
    gl.uniform1f(uni.uRise, rise);
    gl.uniform1f(uni.uSunVis, 1 - Math.min(1, Math.max(0, (p - .1) / .28)));   // בגלילה פנימה השמש נמוגה (לא נשאר עיגול כהה)
    gl.uniform4f(uni.uPane, ...PH.pane);
    gl.uniform1f(uni.uVig, PH.vig);
    gl.uniform1f(uni.uEdgeW, PH.edgeW);
    gl.uniform1f(uni.uFeet, PH.feet);
    gl.uniform1f(uni.uSky, PH.sky);
    gl.uniform1f(uni.uDisc, ds.noDisc ? 0 : 1);
    gl.uniform1f(uni.uSpill, num(ds.spill, 0));
    gl.uniform1f(uni.uHorizon, PH.horizon);
    // תלת-מימד: החדר (קרוב) זז נגד העכבר, והנוף שבחלון (רחוק) זז איתו. בלי עכבר: נשימה איטית
    gl.uniform2f(uni.uMouse, mouse.ex, mouse.ey * .6);
    // המשפחה עומדת לפני החלון: זזה כמו הרצפה שמתחת לרגליים שלה (יותר מהחלון, פחות מהקירות הקרובים)
    gl.uniform2f(uni.uPar, PH.parBg, PH.parBg * (1 + PH.depthK * (PH.floor[2] - PH.floor[0]) / (1 - PH.floor[0])));
    gl.uniform4f(uni.uFloor, ...PH.floor);
    gl.uniform4f(uni.uFx, 0, 0, 1, 0);   // העננים נעים
    gl.uniform1f(uni.uDepthK, PH.depthK);
    { const R = sceneRect(), v = PH.parView + PH.parBg; gl.uniform2f(uni.uView, -mouse.ex * v / R[2], -mouse.ey * .6 * v * .7 / R[3]); }
    // ההילה עוקבת אחרי הסמן באיחור רך, ונעלמת כשהעכבר יוצא
    halo.x += (mouse.cx * glCanvas.width - halo.x) * .14;
    halo.y += (mouse.cy * glCanvas.height - halo.y) * .14;
    halo.k += ((mouse.active ? 1 : 0) - halo.k) * .05;
    gl.uniform3f(uni.uCursor, halo.x, halo.y, halo.k);
    gl.uniform1f(uni.uWave, 1);
    gl.uniform1f(uni.uLift, PH.lift);
    gl.uniform3f(uni.uEdge, ...hexToRgb(PH.edge));
    gl.uniform3f(uni.uNavy, ...colors.bg);
    const back = Math.min(1, Math.max(0, p / .3));
    const sk = mobFit ? 0 : 1 - back;   // במובייל אין טקסט בצדדים: בלי הכהיה בצד
    gl.uniform2f(uni.uScrim, PH.scrim[0] * sk, PH.scrim[1] * sk);
    gl.uniform1f(uni.uFamAlpha, 1 - Math.min(1, Math.max(0, (scrollE - .08) / .37)));
    gl.uniform1f(uni.uIntro, intro * intro);
    const room = SCROLL_FX ? Math.min(1, Math.max(0, (p - .1) / .45)) : 0;
    gl.uniform1f(uni.uRoom, room * room * (3 - 2 * room));
    const pd = Math.max(p, ease(scrollP));
    // מאחורי "מצד אחד" הים כמעט נבלע בכחול (8%), כמו באתר החי: השמיים החדשים בהירים יותר, ב-20% הם הורידו את הקונטרסט של הבית
    const seaDim = SCROLL_FX ? .92 * Math.min(1, Math.max(0, (pd - .45) / .55)) : 0;
    gl.uniform1f(uni.uDim, Math.max(seaDim, Math.min(1, window.heroSeaOff || 0)));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function drawGL(dt = 16) {
    if (!glReady) return;
    if (PHOTO) return drawPhoto();
    updateClear(dt);
    const p = ease(scrollE);
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.uniform2f(uni.uRes, glCanvas.width, glCanvas.height);
    gl.uniform1f(uni.uUnit, unit * DPR);
    // זום איטי מאוד עוד לפני הגלילה (כ-14 שניות), ועוד קצת בגלילה
    const tz = Math.min(1, (performance.now() - t0) / 14000);
    // בגלילה: המצלמה נוסעת ברצף קדימה אל תוך החלון (עד הסוף, בלי לעצור), והסקשן הבא נחשף דרך הזכוכית
    lastZoom = SCROLL_FX
      ? 1.0 + .045 * (1 - Math.pow(1 - tz, 3)) + 1.4 * Math.pow(p, 1.7)
      : 1.0 + AMB_ZOOM * (.5 - .5 * Math.cos((performance.now() - t0) / 1000 * Math.PI * 2 / AMB_CYCLE));
    gl.uniform1f(uni.uZoom, lastZoom);
    gl.uniform1f(uni.uTime, (performance.now() - t0) / 1000);
    gl.uniform4f(uni.uRect, ...sceneRect());
    gl.uniform4f(uni.uFamRect, ...(geo() ? GEO.fam : FAM));
    gl.uniform2f(uni.uMouse, -mouse.ex, -mouse.ey);   // כמו בדוגמה: הקרוב זז נגד הסמן
    gl.uniform2f(uni.uDepthAmt, DEPTH_X, DEPTH_Y);
    gl.uniform2f(uni.uTarget, TARGET[0], TARGET[1]);
    gl.uniform1f(uni.uFocus, FOCUS);
    gl.uniform1f(uni.uFamNear, FAMILY_NEAR);
    gl.uniform1f(uni.uFamScale, famScale);
    gl.uniform1f(uni.uRange, DEPTH_RANGE);
    gl.uniform1f(uni.uDolly, DOLLY * p);
    gl.uniform1f(uni.uClouds, CLOUDS);
    gl.uniform1f(uni.uFamAlpha, 1 - Math.min(1, Math.max(0, (scrollE - .08) / .37)));   // המשפחה נעלמת בגלילה
    gl.uniform1f(uni.uAspect, imgAspect);
    // השמש נושמת: גדלה וקטנה לאט מאוד (מחזור של כ-16 שניות), יחד עם ההילה והקרניים
    const ts = (performance.now() - t0) / 1000;
    const breathe = 1 + .06 * Math.sin(ts * .39) + .02 * Math.sin(ts * .17 + 1.1);
    const rise = calm ? 1 : Math.min(1, Math.max(0, (ts - RISE_DELAY) / RISE_TIME));
    const riseE = rise < .5 ? 4 * rise * rise * rise : 1 - Math.pow(-2 * rise + 2, 3) / 2;   // מתחיל לאט, עולה, ומאט בסוף
    const G = geo();
    gl.uniform3f(uni.uSun, sunX, SUN_Y_START + ((G ? G.sunY : SUN_Y) - SUN_Y_START) * riseE, (G ? G.sunR : SUN_R) * breathe);
    gl.uniform1f(uni.uRise, riseE);
    gl.uniform1f(uni.uIntro, intro * intro);
    // לפני הסקשן הבא החדר נעלם לגמרי. לפי הגלילה הישירה (בלי השהיה), כדי שלא יישאר קו בגלילה מהירה
    const pd = Math.max(p, ease(scrollP));
    // החדר נעלם בהדרגה, והים והשמש נשארים כרקע רך לאזור הבא (מעט מעומעם, כדי שהטקסט ייקרא)
    const room = SCROLL_FX ? Math.min(1, Math.max(0, (p - .12) / .55)) : 0;
    gl.uniform1f(uni.uRoom, room * room * (3 - 2 * room));
    // זום ישר פנימה אל הים: הנקודה שמתחת למרכז נשארת במקום, אז אין תזוזה לצדדים או למעלה, רק התקרבות
    gl.uniform2f(uni.uPan, 0, SCROLL_FX ? ZOOM_AT_Y * glCanvas.height * (1 - lastZoom) : 0);
    // השמש נעלמת לגמרי יחד עם החדר: נשאר רק הים
    const sunOff = SCROLL_FX ? Math.min(1, Math.max(0, (p - .1) / .45)) : 0;
    gl.uniform1f(uni.uSunOff, sunOff * sunOff * (3 - 2 * sunOff));
    // באזור הבא הים נשאר רק כרקע עדין על הכחול הכהה (בערך 20%),
    // ובשלב המבוך הם נעלמים לגמרי (sides.js קובע window.heroSeaOff)
    const seaDim = SCROLL_FX ? .8 * Math.min(1, Math.max(0, (pd - .45) / .55)) : 0;
    gl.uniform1f(uni.uDim, Math.max(seaDim, Math.min(1, window.heroSeaOff || 0)));
    gl.uniform1f(uni.uWaves, (seaDim / .8) * (1 - Math.min(1, window.heroSeaOff || 0)));
    gl.uniform1f(uni.uRays, 1 - (SCROLL_FX ? Math.min(1, Math.max(0, (p - .12) / .55)) : 0));   // קרני האור לתוך החדר נעלמות עם החדר
    // ההילה עוקבת אחרי הסמן באיחור רך, ונעלמת כשהעכבר יוצא
    halo.x += (mouse.cx * glCanvas.width - halo.x) * .12;
    halo.y += (mouse.cy * glCanvas.height - halo.y) * .12;
    halo.k += ((mouse.active ? 1 : 0) - halo.k) * .05;
    gl.uniform3f(uni.uCursor, halo.x, halo.y, halo.k);
    gl.uniform4f(uni.uLook, LOOK.detail, LOOK.tri, LOOK.mirror, LOOK.dmode);
    const L = LOOKS[lookKey], back = Math.min(1, Math.max(0, p / .3));   // 0 = האופציה במלואה, 1 = צבעי המקור
    const pick = (key, orig, conv) => L[key] === undefined ? orig : (conv ? mixV(conv(L[key]), orig, back) : L[key] + (orig - L[key]) * back);
    gl.uniform3f(uni.uBg, ...pick('bg', colors.bg, C));
    gl.uniform3f(uni.uTint, ...pick('tint', colors.tint, C));
    gl.uniform3f(uni.uSunCol, ...pick('sun', colors.sun, C));
    gl.uniform3f(uni.uCloudCol, ...pick('cloud', colors.cloud, C));
    gl.uniform1f(uni.uStrength, pick('strength', colors.strength));
    gl.uniform1f(uni.uGamma, pick('gamma', colors.gamma));
    gl.uniform3f(uni.uNavy, ...colors.bg);
    const sky = L.sky ? L.sky.map((c, i) => mixV(c, ORIG.sky[i], back)) : ORIG.sky, sea = L.sea ? L.sea.map((c, i) => mixV(c, ORIG.sea[i], back)) : ORIG.sea;
    gl.uniform3f(uni.uSkyLo, ...sky[0]); gl.uniform3f(uni.uSkyMid, ...sky[1]); gl.uniform3f(uni.uSkyHi, ...sky[2]);
    gl.uniform3f(uni.uSeaLo, ...sea[0]); gl.uniform3f(uni.uSeaHi, ...sea[1]);
    gl.uniform1f(uni.uSkyAmt, pick('skyAmt', ORIG.skyAmt));
    gl.uniform1f(uni.uSeaAmt, pick('seaAmt', ORIG.seaAmt));
    gl.uniform1f(uni.uRayAmt, pick('rays', ORIG.rays));
    gl.uniform1f(uni.uFamLit, pick('famLit', ORIG.famLit));
    gl.uniform1f(uni.uWall, L.wall || 0);   // בחלון המלא המסגרות לא חוזרות בגלילה (הצילום נשאר מוגדל)
    // באופציות הבהירות: הפסים הכהים למעלה ולמטה (שמובילים לאזור הבא) מופיעים רק בגלילה
    if (fadeEl) fadeEl.style.opacity = L.bg ? String(back) : '';
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /* =========================================================
     לולאה
     ========================================================= */
  function update(dt) {
    const k = Math.min(dt / 16.67, 3);
    const t = (performance.now() - t0) / 1000;
    const idleX = Math.sin(t * .23) * .5, idleY = Math.sin(t * .17 + 1.3) * .28;
    const tx = mouse.active ? mouse.x : idleX, ty = mouse.active ? mouse.y : idleY;
    mouse.ex += (tx - mouse.ex) * .045 * k;
    mouse.ey += (ty - mouse.ey) * .045 * k;
    scrollE += (scrollP - scrollE) * .085 * k;
    if (intro > 0) intro = Math.max(0, 1 - (performance.now() - t0) / 2600);
  }

  /* אחרי ההירו הסצנה היא רק רקע עמום של ים מאחורי "מצד אחד": מציירים אותה בחצי מהפריימים (הים זז לאט, לא רואים הבדל),
     וכשהים כבר נעלם לגמרי (באזור המבוך) לא מציירים בכלל. כך כרטיס המסך פנוי לגלילה ולמשולש */
  let last = performance.now(), skip = false, drawnOff = false, lastLoad = 0;
  const loadingNow = () => document.documentElement.classList.contains('is-loading');
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (loadingNow() && now - lastLoad < 250) return;
    lastLoad = now;
    const bg = SCROLL_FX && scrollP >= .995 && scrollE >= .99;
    const off = bg && (window.heroSeaOff || 0) >= .999;
    if (off && drawnOff) return;
    if (bg && !off && (skip = !skip)) return;
    const dt = Math.min(now - last, 50); last = now;
    update(dt); drawGL(dt); drawnOff = off;
  }
  function play() {
    if (running || calm || !visible || document.hidden) return;
    running = true; last = performance.now();
    requestAnimationFrame(frame);
  }
  const pause = () => { running = false; };

  // קו הרגליים במסך (במצב המנוחה, אחרי הזום האיטי של הפתיחה), כדי שהכפתור מימין יישב עליו
  function placeFeet() {
    if (!PHOTO || !glReady || !heroEl) return;
    const R = sceneRect(), z = SCROLL_FX ? 1.045 : 1, pan = SCROLL_FX ? ZOOM_AT_Y * H * (1 - z) : 0;
    const y = (R[1] + PH.feetLine * R[3]) * unit * z + H / 2 + pan;
    heroEl.style.setProperty('--feet-y', y.toFixed(1) + 'px');
    heroEl.style.setProperty('--glass-top', ((R[1] + PH.glass[1] * R[3]) * unit * z + H / 2 + pan).toFixed(1) + 'px');
  }
  const heroEl = story.querySelector('.hero');
  /* מובייל: ההירו הנקי. ה-CSS ממקם את "95%" למעלה ואת "5%" למטה, והצילום (החלון והמשפחה) נכנס בדיוק ביניהם,
     כך שהמשפחה אף פעם לא מתחת לטקסט */
  let mobFit = null;
  function fitMobile() {
    mobFit = null;
    if (!PHOTO || innerWidth > 900 || !heroEl) return;
    const a = heroEl.querySelector('.hero__stat:not(.hero__stat--few)'), b = heroEl.querySelector('.hero__stat--few');
    if (!a || !b) return;
    const t = heroEl.getBoundingClientRect().top, ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    if (!ra.height || !rb.height) return;
    mobFit = { top: ra.bottom - t + Math.max(22, H * .038), feet: rb.top - t - Math.max(24, H * .045) };
  }
  if (document.fonts) document.fonts.ready.then(() => { fitMobile(); if (glReady) placeFeet(); });
  function resize() {
    requestAnimationFrame(placeSun);
    const r = host.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    DPR = 1;
    glCanvas.width = Math.round(W * DPR); glCanvas.height = Math.round(H * DPR);
    unit = Math.max(W / REF_W, H / REF_H);
    fitMobile();
    if (glReady) { readColors(); placeFeet(); }
    onScroll();
    if (calm) drawGL();
  }

  const hero = story.querySelector('.hero'), heroBrand = hero && hero.querySelector('.hero__brand');
  function onScroll() {
    const travel = Math.max(1, (hero ? hero.offsetHeight : innerHeight));
    const top = story.getBoundingClientRect().top;
    scrollP = SCROLL_FX ? Math.min(Math.max(-top / travel, 0), 1) : 0;
    // מובייל: הטקסט (95/5) נעלם מהר בתחילת הגלילה, לפני שהמשפחה גדלה לעברו
    if (heroBrand && (mobFit || heroBrand.style.opacity)) {
      const f = mobFit ? Math.min(1, -top / (H * .2)) : 0, e = f > 0 ? f * f * (3 - 2 * f) : 0;
      heroBrand.style.opacity = e > 0 ? (1 - e).toFixed(3) : '';
      heroBrand.style.transform = e > 0 ? 'translateY(' + (-18 * e).toFixed(1) + 'px)' : '';
      heroBrand.style.pointerEvents = e > .9 ? 'none' : '';
    }
    if (calm) { scrollE = scrollP; drawGL(); }
  }

  /* ---------- אירועים ---------- */
  if (!touch) {
    addEventListener('pointermove', e => {
      const nx = e.clientX / innerWidth, ny = e.clientY / innerHeight;
      mouse.moved += Math.hypot(nx - mouse.cx, ny - mouse.cy) * 100;
      mouse.cx = nx; mouse.cy = ny;
      mouse.x = nx * 2 - 1; mouse.y = ny * 2 - 1;
      mouse.active = true;
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { mouse.active = false; });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', resize);
  // ממשיך לצייר כל עוד ההירו או האזור שאחריו (שהים הוא הרקע שלו) על המסך
  const seen = new Set();
  const io = new IntersectionObserver(ens => { ens.forEach(en => en.isIntersecting ? seen.add(en.target) : seen.delete(en.target)); visible = seen.size > 0; visible ? play() : pause(); });
  io.observe(story);
  const nextSec = document.querySelector('[data-sides]'); if (nextSec && SCROLL_FX) io.observe(nextSec);
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));

  /* ---------- מתג האופציות (להשוואה): בפינה של ההירו, נעלם בגלילה ---------- */
  const heroSec = document.querySelector('.hero');
  if (heroSec && !PHOTO) {
    const NAMES = [['orig', 'מקור'], ['a', 'א · זריחה תכלת'], ['c', 'ג · שקיעה חמה']];   // החלון המלא (ב, ד) ירד לבקשת צביה
    const box = document.createElement('div'); box.className = 'hero-looks'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'אופציות להירו');
    const sync = () => box.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.look === lookKey)));
    NAMES.forEach(([k, t]) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.look = k; b.textContent = t; b.addEventListener('click', () => { window.setHeroLook(k); sync(); }); box.appendChild(b); });
    heroSec.appendChild(box); sync(); addEventListener('hero-look', sync);
    addEventListener('scroll', () => { const o = scrollY > innerHeight * .15 ? 0 : 1; box.style.opacity = o; box.style.pointerEvents = o ? '' : 'none'; }, { passive: true });
  }

  /* ---------- התחלה ---------- */
  resize();
  // בזמן מסך הטעינה: ההכנה של WebGL (הרכבת השיידרים והעלאת התמונות לכרטיס המסך) עוצרת לרגע את כל האנימציות במסך.
  // לכן היא מתחילה רק אחרי שהלוגו סיים להיבנות, כשרק הפס הדק עוד זז
  initGL()
    .catch(err => { console.warn('hero scene: WebGL off', err); return false; })
    .then(ok => {
      if (!ok) host.classList.add('no-gl');
      host.classList.add('is-ready');
      placeFeet();
      if (calm) { intro = 0; scrollE = scrollP; drawGL(); } else play();
      // מסך הטעינה נפתח רק אחרי שהתמונה כבר צוירה על המסך
      requestAnimationFrame(() => requestAnimationFrame(() => dispatchEvent(new Event('hero-ready'))));
    });
})();
