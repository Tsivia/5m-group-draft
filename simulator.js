/* =====================================================================
   5M GROUP · סימולטור השקעות נדל"ן (דמו עיצובי)
   הלוגיקה, הספים והטקסטים הועתקו אחד לאחד מהסימולטור הקיים
   (ברירות המחדל שבקוד שלו). אין כאן שמירה למסד ואין טעינת הגדרות:
   אצל המפתח הלוגיקה נשארת כמו שהיא, ומתחלף רק העיצוב.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- נתונים (זהים לקוד הקיים) ---------------- */
  const C = { mortgageRatioLimit: .7, equityMinForScore: 3e5, equityStepForScore: 3e5, equityMaxScore: 3, incomeNetMultiplier: .4, incomeStep: 3500, incomeMaxScore: 5,
    redAgeMin: 25, redAgeMax: 60, ageHorizonMax: 60, projectionMaxYears: 30, doublingCycleSafe: 10, doublingCycleLeverage: 7 };

  const INCOME = [
    { value: 15e3, description: 'אוקי זה נחמד, נבדוק בהמשך אם זה מספיק לנו' },
    { value: 3e4, description: 'לא רע בכלל! אתם מרוויחים מעל הממוצע בישראל!' },
    { value: 4e4, description: 'זה יפה מאוד! אתם בעשירון העליון של ישראל!' },
    { value: 5e4, description: 'מכובד במיוחד! אין הרבה אנשים שמרוויחים ככה!' },
    { value: 999999999, description: 'זה מדהים! אתם בטופ של הטופ של ההכנסות בישראל!' }];
  const DEBT = [
    { value: 1500, score: 1, description: 'יש לכם מעט מאוד יכולת מינוף בנקאית, נבדוק בהמשך מה אפשר לעשות.' },
    { value: 3400, score: 2, description: 'נותר לכם מרווח למינוף, סכום חודשי סביר שניתן למנף.' },
    { value: 6900, score: 2, description: 'יש לכם אפשרות למנף סכום מעולה להשקעה!' },
    { value: 10400, score: 3, description: 'הופה זה מרשים! יש לכם סכום חודשי יפה שאפשר למנף.' },
    { value: 13900, score: 4, description: 'וואו! רוב האנשים בישראל לא יכולים למנף סכום כזה!' },
    { value: 999999999, score: 5, description: 'וואו! זה נדיר — סכום כזה מאפשר מינוף ענק להשקעה!' }];
  const SAVINGS = [
    { value: 1999, description: 'קודם כל זה יפה, נראה איך נשתמש בזה.' },
    { value: 2999, description: 'יפה לכם! יש הרבה אנשים שלא מצליחים לחסוך ככה!' },
    { value: 4999, description: 'זה יפה מאוד, אפילו מעל הממוצע!' },
    { value: 7999, description: 'מדהים! אין כמעט אנשים שחוסכים ככה!' },
    { value: 999999999, description: 'וואו! זה סכום גבוה מאוד שמאפשר השקעות מדהימות!' }];
  const LIQUIDITY = [
    { value: 299999, score: 0, description: 'זה לא רע! נדע בהמשך אם זה יספיק לנו להשקעה.' },
    { value: 799999, score: 1, description: 'הופה, אתם במצב ממש טוב!' },
    { value: 1199999, score: 2, description: 'מדהים! יש לכם חסכון גבוה מהממוצע!' },
    { value: 1599999, score: 3, description: 'אואה! זה סכום שיאפשר לכם הזדמנויות השקעה מדהימות!' },
    { value: 999999999, score: 4, description: 'וואו! יש לכם חסכון מטורף, תוכלו להרוויח ממנו הון!' }];
  const AGE = [
    { value: 24, description: 'מדהים שאתם פה! זה קצת מידי צעיר לנו, אבל נבדוק.' },
    { value: 30, description: 'צעירים, יפים וכל החיים לפניכם - הגיל המושלם!' },
    { value: 40, description: 'וואו זה גיל מעולה להתחיל להשקיע בו!' },
    { value: 50, description: 'אתם בשיא חייכם, עם חתונות ילדים על הראש, יש לנו השקעות מעולות בדיוק לכם!' },
    { value: 60, description: 'חתונות ילדים, הפרישה שבאופק, ניקח הכל בחשבון...' },
    { value: 999, description: 'מדהים שאתם פה! זה קצת מידי מבוגר לנו, אבל נבדוק.' }];
  const PERSONALITY = [
    { label: 'לאט ובטוח', value: -1, icon: 'shield' },
    { label: 'סיכון מחושב', value: 0, icon: 'target' },
    { label: 'מינוף זה החיים', value: 1, icon: 'rise' }];
  const EQUITY_TIERS = [
    { description: 'ואו! רק ל-5% מהמשקיעים יש סכום כזה', minEquity: 25e5 },
    { description: 'אליפות! יש לכם בסיס רציני לצמיחה מהירה מאוד', minEquity: 15e5 },
    { description: 'מדהים! אתם לגמרי במגרש של הגדולים', minEquity: 11e5 },
    { description: 'סכום מכובד בהחלט! יהיו לכם הרבה אפשרויות', minEquity: 7e5 },
    { description: 'הופה, יש פה עם מה לעבוד!', minEquity: 4e5 },
    { description: 'זה מעט מדי להשקעה, אבל בואו נמשיך ואולי נופתע', minEquity: 0 },
    { description: 'יש לכם מינוף מקסימלי, נמשיך לבדוק אם יש לכם אפשרות להשקיע ממקורות אחרים', minEquity: 0, isHighMortgage: true }];

  const VR = 'מה זה אומר בתכל׳ס?';
  const CTA_INV = 'לשיחת ייעוץ עם יועץ השקעות מומחה של Winner Real Estate';
  const CTA_FAM = 'לשיחת ייעוץ עם מומחה לכלכלת משפחה של Winner Real Estate';
  const LUCK = 'המון בהצלחה בינתיים!';
  const S = (text, cta, type, proj) => ({ summaryTitle: VR, summaryText: text, ctaText: cta, ctaType: type, showProjection: proj });
  const SCENARIOS = {
    PILA: S('אתם במצב הכי טוב שיש כדי להתחיל להשקיע!\nיש לכם את כל התנאים הנכונים - גם רזרבות, גם תזרים פנוי, גם נכס, עכשיו זה בדיוק הזמן הנכון להתחיל לתכנן תיק נכסים, לנצל את היתרונות שלכם - ולצאת לדרך.', CTA_INV, 'investment', true),
    pILA: S('יש לכם בסיס מעולה ממש להתחלה!\nהחסכונות, התזרים וטווח השקעה המצוין שלכם מהווים יחד קרש קפיצה מדהים להשקעה נדל״נית חכמה. זה בדיוק הזמן שלכם לתפור תיק השקעות שמתאים לאופי האישי וליעדים שלכם, ולהתחיל להשקיע עם מינוף אחראי וחכם.', CTA_INV, 'investment', true),
    PiLA: S('הכיוון חיובי, אבל קודם כל אתם צריכים לחזק את תזרים המזומנים השוטף שלכם.\nהיכולת לעמוד בתשלומי החזרים היא קריטית בשביל משקיע ממונף, לכן קודם כל, במחלקת כלכלת המשפחה שלנו נבנה לכם תכנית להקטנת התחייבויות ולשפר את ההכנסה הפנויה, זו השקעה בעצמכם ואתם רק תרוויחו ממנה!', CTA_FAM, 'family', true),
    PIlA: S('אתם מוכנים להשקעה - גם בלי חסכונות!\nהעובדה שיש לכם כסף בקירות מאפשרת לכם להתחיל תהליך השקעה גם בלי להסתמך על חסכונות, זה בדיוק מה שנדרש כדי לבנות תיק מבוסס ונכון. אז קדימה, שנתחיל להניע תהליך?', CTA_INV, 'investment', true),
    PILa: S('הבסיס הכלכלי שלכם מצוין!\nלצערנו הליווי שלנו לא מתאים לאנשים בגילכם, אבל אנחנו ממליצים לכם בחום לבדוק אם יש פתרונות שמתאימים לגילכם, כולל נכסים שמניבים בטווח קצר או השקעות שדורשות פחות מימון בנקאי.\nיש דרכים לבנות תיק חכם, זה פשוט דורש יותר זהירות.', CTA_INV, 'investment', false),
    PIla: S('אתם בהחלט יכולים להשקיע, אבל לצערנו הליווי שלנו לא מתאים לאנשים בגילכם.\nאנחנו ממליצים לכם בחום לבדוק אם יש פתרונות שמתאימים לגילכם, כולל נכסים שמניבים בטווח קצר או השקעות שדורשות פחות מימון בנקאי.\nיש דרכים לבנות תיק חכם, זה פשוט דורש יותר זהירות.', CTA_INV, 'investment', false),
    piLA: S('יש לכם אחלה בסיס - אבל נדרש ייצוב כלכלי קודם.\nיש לכם חיסכון יפה וזה מעולה, אבל בלי תזרים חיובי מספק יהיה לכם קשה לקבל מימון ולעמוד בתשלומים.\nאנחנו ממליצים לכם בחום לפנות למומחי כלכלת המשפחה שלנו שכבר סייעו לעשרות משפחות להגיע לתזרים חיובי משמעותי, ורק לאחר מכן להתחיל להתמנף על נדל״ן.', CTA_FAM, 'family', true),
    PilA: S('ממממ בעייתי קצת.\nללא הכנסה פנויה וללא חסכונות, קשה לנו להמליץ לכם על כניסה להשקעה חדשה - גם אם יש לכם נכס קיים.\nהעבודה שלכם כרגע היא על התזרים: לשפר את ההכנסות, להפחית התחייבויות מיותרות ולהגדיל את הרווחות כדי שתהיו יציבים מספיק להיכנס להשקעות מינוף.', CTA_FAM, 'family', true),
    pIlA: S('אתם פשוט כמעט שם, רק עוד טיפה הון עצמי ואתם יכולים להתחיל!\nתזרים זה מעולה, וגם טווח ההשקעה שלכם מצוין, אבל בלי חיסכון בצד או נכס קיים שאפשר למנף, יהיה קשה מאד להניע תהליך השקעה.\nאם תצליחו להגיע בקרוב ל-300K בחסכון תהיו מוכנים ליציאה לדרך מדהימה!', CTA_INV, 'investment', true),
    PiLa: S('לצערנו הליווי שלנו אינו מתאים למשקיעים בגילכם.\nהנכסים הקיימים והחסכונות שצברתם הם יתרון חשוב, אך עם תזרים נמוך וגיל שנחשב מחוץ לטווח המומלץ אצלנו, נצטרך לבדוק אם נוכל להציע לכם תכנית השקעות טובה מספיק.', CTA_INV, 'investment', false),
    pILa: S('לצערנו הליווי שלנו אינו מתאים למשקיעים בגילכם.\nיש לכם את הכלים הנכונים - רק צריך לבדוק בזהירות את ההשקעות המתאימות לכם.\nצריך להשתמש בהכנסה הפנויה ובחסכון שצברתם, ולהתאים לכם השקעות שמתאימות לטווח ההשקעה האפשרי שלכם, הניסיון שלנו בתחום יכול להיות משמעותי מאד עבורכם.', CTA_INV, 'investment', false),
    pilA: S('ממממם נראה קצת בעייתי כרגע.\nכדי להתחיל להשקיע דרוש לפחות אחד מהשלושה: תזרים, חיסכון או נכס למינוף.\nטווח השקעה מעולה כבר יש לכם, תתחילו בבניית חיסכון או בהגדלת הכנסות - אתם עוד תגיעו לשם.', CTA_INV, 'investment', true),
    Pila: S('מעבר לכך שהליווי שלנו לא מתאים למשקיעים בגילכם, המטרה שלכם כרגע צריכה להיות בניית תכנית כלכלית אישית, הרבה לפני שאתם רוצים להשקיע.\nאנחנו ממליצים לכם לקחת זמן, לסדר את מבנה ההוצאות וההתחייבויות שלכם ולבחון איך תוכלו להגדיל את ההון העצמי שלכם עם השקעות שמתאימות לכם.', CTA_FAM, 'family', false),
    piLa: S('זה אפשרי, אבל לצערנו הליווי שלנו אינו מתאים למשקיעים בגילכם.\nנכון שיש לכם חסכון יפה, אבל בלי יכולת חיסכון משמעותית יהיה לכם קשה לעמוד בתזרים המינוף.\nיתכן ויש דרכים נוספות להפיק ערך מהחיסכון שצברתם, פגישה עם מומחה השקעות יכולה לעזור לכם לבנות מסלול מותאם אישית.', CTA_INV, 'investment', false),
    pIla: S('אתם בדרך הנכונה, אבל עוד אין לכם מספיק בשביל להתחיל.\nיש לכם כבר הכנסות יציבות שמאפשרות חיסכון משמעותי, וגם הליווי שלנו לא מתאים לאנשים בגילכם, אז תמשיכו לחסוך במרץ, כשתגיעו למינימום 200K ש״ח הבסיס שלכם יתחזק ואפשר יהיה לתכנן לכם השקעה מדהימה.\nהמון בהצלחה בינתיים!', LUCK, 'luck', true),
    pila: S('מצטערים, בשלב זה השקעה אצלנו אינה רלוונטית עבורכם.\nאבל אם תצליחו לשפר את ההכנסות ותצברו חסכון משמעותי, אולי עוד ניפגש בהמשך!\nהמון בהצלחה בינתיים!', LUCK, 'luck', true),
    under25: S('הליווי שלנו לא מתאים למשקיעים מתחת לגיל 25.\nתמשיכו לחסוך ולבנות בסיס כלכלי איתן — כשתגיעו לגיל 25 נשמח לפגוש אתכם.\nהמון בהצלחה בינתיים!', LUCK, 'luck', false) };
  const STATUS = [
    { key: 'property', label: 'כסף בקירות', icon: 'home' },
    { key: 'income', label: 'הכנסות', icon: 'wallet' },
    { key: 'liquidity', label: 'הון נזיל', icon: 'vault' },
    { key: 'age', label: 'טווח השקעה', icon: 'rise' },
    { key: 'total', label: 'ניקוד כולל', icon: 'score' }];

  /* ---------------- חישובים (זהים לקוד הקיים) ---------------- */
  const pick = (v, list) => { if (v == null) return null; const s = [...list].sort((a, b) => a.value - b.value); for (const o of s) if (v <= o.value) return o; return s[s.length - 1]; };
  const highMortgage = (val, mort) => val && mort != null && val > 0 && mort / val > C.mortgageRatioLimit;
  function equityTier(eq, val, mort) {
    if (highMortgage(val, mort)) return EQUITY_TIERS.find(t => t.isHighMortgage);
    for (const t of EQUITY_TIERS) if (!t.isHighMortgage && eq >= t.minEquity) return t;
    return EQUITY_TIERS[EQUITY_TIERS.length - 2];
  }
  const equityScore = (eq, val, mort) => highMortgage(val, mort) || eq < C.equityMinForScore ? 0 : Math.min(C.equityMaxScore, Math.floor(eq / C.equityStepForScore));
  function incomeScore(inc, debt) {
    if (inc === null) return 0;
    const r = inc * C.incomeNetMultiplier - (debt ?? 0);
    if (r < 0) return 0; if (r < 1500) return 1;
    return Math.min(C.incomeMaxScore, Math.max(2, 2 + Math.ceil((r - 5e3) / C.incomeStep)));
  }
  const liqScore = v => (pick(v, LIQUIDITY) || {}).score ?? 0;
  const debtScore = v => (pick(v, DEBT) || {}).score ?? 0;
  function scores(e) {
    const eq = e.hasProperties ? equityScore(e.propertyValue - (e.mortgageAmount ?? 0), e.propertyValue, e.mortgageAmount ?? 0) : 0;
    const inc = incomeScore(e.monthlyIncome, e.monthlyDebt), dbt = debtScore(e.monthlyDebt), liq = liqScore(e.liquidity);
    return { total: eq + inc + dbt + liq };
  }
  function buying(e) {
    const net = Math.max(0, (e.monthlyIncome ?? 0) * C.incomeNetMultiplier - (e.monthlyDebt ?? 0));
    const fromIncome = Math.floor(net / C.incomeStep) * 5e5, fromLiquid = Math.floor((e.liquidity ?? 0) / 4e5) * 5e5;
    return { fromIncome, fromLiquid, total: fromIncome + fromLiquid };
  }
  const horizon = age => age == null ? 0 : Math.min(C.projectionMaxYears, Math.max(0, C.ageHorizonMax - age));
  const cycle = p => p === 1 ? C.doublingCycleLeverage : C.doublingCycleSafe;
  function propsNow(e) {
    const net = Math.max(0, (e.monthlyIncome ?? 0) * C.incomeNetMultiplier - (e.monthlyDebt ?? 0)), r = Math.floor(net / C.incomeStep);
    let eq = 0;
    if (e.hasProperties && e.propertyValue > 0 && (e.mortgageAmount ?? 0) / e.propertyValue <= C.mortgageRatioLimit) eq = Math.max(0, e.propertyValue - (e.mortgageAmount ?? 0));
    const i = Math.floor(((e.liquidity ?? 0) + eq) / C.equityStepForScore);
    return Math.max(0, Math.min(r, i), incomeScore(e.monthlyIncome, e.monthlyDebt));
  }
  const ageOk = e => e.age != null && e.age >= C.redAgeMin && e.age <= C.redAgeMax;
  function projection(e) {
    if (!ageOk(e)) return null;
    const now = propsNow(e), years = horizon(e.age), cyc = cycle(e.personality), mult = cyc <= 0 ? 0 : Math.floor(years / cyc), mid = Math.round(years / 2), midMult = cyc > 0 ? Math.floor(mid / cyc) : 0;
    return { now, in5years: now + now * midMult, in10years: now + now * mult, years, midYears: mid };
  }
  function propertyOk(e) {
    if (!e.hasProperties) return false;
    const eq = e.propertyValue - (e.mortgageAmount ?? 0), ratio = e.propertyValue > 0 ? (e.mortgageAmount ?? 0) / e.propertyValue : 0;
    return !(ratio > C.mortgageRatioLimit || eq < C.equityMinForScore);
  }
  function scenario(e) {
    const p = propertyOk(e), i = incomeScore(e.monthlyIncome, e.monthlyDebt) > 0, l = liqScore(e.liquidity) > 0, a = ageOk(e), total = scores(e).total;
    const boxes = (aa) => [p, i, l, aa].map((ok, k) => ({ ...STATUS[k], status: ok ? 'green' : 'red' })).concat({ ...STATUS[4], status: 'gray' });
    if (e.age != null && e.age < C.redAgeMin) return { totalScore: total, statusBoxes: boxes(false), ...SCENARIOS.under25 };
    const key = (p ? 'P' : 'p') + (i ? 'I' : 'i') + (l ? 'L' : 'l') + (a ? 'A' : 'a');
    return { totalScore: total, statusBoxes: boxes(a), ...(SCENARIOS[key] || SCENARIOS.pila) };
  }
  const ils = n => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n);
  const fmt = n => new Intl.NumberFormat('he-IL').format(n);

  /* ---------------- אייקונים (קו כתום, כמו ב"דברו איתנו") ---------------- */
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5V21H3z"/><path d="M9.5 21v-6.5h5V21"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/>',
    bank: '<path d="M3 21h18M5.5 17.5v-7M10 17.5v-7M14 17.5v-7M18.5 17.5v-7M12 3l8.5 5h-17z"/>',
    wallet: '<path d="M4 6.5h15.5V20H4z"/><path d="M4 6.5 16 3v3.5"/><path d="M15 12.5h4.5v3H15z"/>',
    card: '<rect x="2.5" y="5" width="19" height="14"/><path d="M2.5 10h19M6 15h4"/>',
    coins: '<circle cx="9" cy="9" r="5.5"/><path d="M17.5 10.4a5.5 5.5 0 1 1-7.1 7.1"/><path d="M8 7.5h1.2v3.4"/>',
    vault: '<rect x="3" y="3" width="18" height="18"/><circle cx="12" cy="12" r="4"/><path d="M12 8v1M12 15v1M8 12h1M15 12h1M6 21v1.5M18 21v1.5"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5"/><path d="M16 2.5v4M8 2.5v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/>',
    spark: '<path d="M12 3.5 13.9 9 19.5 11l-5.6 2L12 18.5 10.1 13 4.5 11l5.6-2z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    shield: '<path d="M12 21.5s7.5-3.6 7.5-9.5V5.3L12 2.5 4.5 5.3V12c0 5.9 7.5 9.5 7.5 9.5z"/><path d="M8.8 12l2.3 2.3 4.2-4.6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r=".6"/>',
    rise: '<path d="M21.5 7l-8 8-4.5-4.5-6.5 6.5"/><path d="M15.5 7h6v6"/>',
    form: '<path d="M8 3.5h8v3H8z"/><path d="M16 5h3.5v16.5h-15V5H8"/><path d="M8.5 12h7M8.5 16h4.5"/>',
    score: '<path d="M4 20V13M10 20V8M16 20v-4.5M21 20H3"/><path d="M14.5 4l2.5 2.5L21 2.5"/>' };
  const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const CROSS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* כותרת שנכנסת אות אחרי אות (מילים לא נשברות באמצע) */
  function split(text, start = 0, step = 22) {
    let d = start;
    return text.split(' ').map(w => `<span class="w">${Array.from(w).map(ch => `<span class="ch" style="--d:${(d += step)}">${esc(ch)}</span>`).join('')}</span>`).join(' ');
  }

  /* ---------------- השאלות (טקסטים זהים) ---------------- */
  const Q = {
    hasProperties: { kind: 'yesno', icon: 'home', title: 'בואו נתחיל מנדל״ן', q: 'יש לכם נכסים בבעלותכם?', sub: 'כל נכס נדל"ני בישראל נחשב – בית מגורים, דירות להשקעה, נכסים מסחריים או קרקעות מופשרות.' },
    propertyValue: { kind: 'num', key: 'propertyValue', icon: 'cash', title: 'אז בואו נעשה חשבון', q: 'מה שווי הנכסים שלכם?', sub: 'שווי ברוטו של הנכסים אם תמכרו אותם עכשיו, בלי להוריד את סכום המשכנתא שיש לכם.', min: 4e5, max: 2e7 },
    mortgageAmount: { kind: 'num', key: 'mortgageAmount', icon: 'bank', title: 'נמשיך עם החישוב', q: 'מה גובה המשכנתא על הנכסים שלכם?', sub: 'סכום יתרת המשכנתא העדכנית, כולל הלוואות נוספות אם לקחתם לצורך מימון ההון העצמי.', min: 0, max: 2e7 },
    income: { kind: 'num', key: 'monthlyIncome', icon: 'wallet', title: 'נעבור ישר להכנסות', q: 'כמה משק הבית שלכם מכניס נטו בחודש?', sub: 'משכורות, רווח מעסק, קצבאות, גמלאות, שכירויות וכל מה שהוא בתכלס כסף מזומן וניל שאתם מכניסים לכיס.', min: 1e4, max: 1e5 },
    debt: { kind: 'num', key: 'monthlyDebt', icon: 'card', title: '', q: 'כמה משלמים בחודש על משכנתאות / הלוואות?', sub: 'רק על משכנתאות והלוואות לטווח ארוך. לא כולל תשלומים מפורסים על קניות.', min: 0, max: 5e4 },
    savings: { kind: 'num', key: 'monthlySavings', icon: 'coins', title: 'ומכאן לנושא סופר חשוב: הפרשות', q: 'כמה אתם מצליחים לחסוך כל חודש?', sub: 'אנחנו מדברים על כל הכספים שאתם מצליחים בתכל׳ס לשים בצד, לא משנה מאיפה ואיך, זה כולל את מה שאתם מפרישים לבנק, לקרן השתלמות, לשוק ההון, לגמח"ים, או למעטפת המזומן שבמגירת הגרביים שלכם :)', min: 0, max: 2e4 },
    liquidity: { kind: 'num', key: 'liquidity', icon: 'vault', title: 'ונמשיך ישירות לחסכונות', q: 'כמה כסף יש לכם בצד?', sub: 'בבנק, בקופות חיסכון, בקופות גמל, בקרנות השתלמות, בשוק ההון, בגמח״ים או מתחת לבלטות - הכל בכל מכל כל.', min: 0, max: 1e7 },
    age: { kind: 'num', key: 'age', icon: 'calendar', title: 'נכון גיל זה רק מספר?', q: 'אז נשמח ממש לדעת בני כמה אתם', sub: 'אנחנו לא סתם חסרי טקט... יש השקעות שמתאימות לצעירים בתחילת הדרך, יש השקעות שמתאימות למבוגרים שצריכים להיערך לפרישה ולבלתמ״ים, ויש גם את אלו שבאמצע :)', min: 0, max: 120, plain: true, ph: 'הזינו גיל' },
    personality: { kind: 'pick', icon: 'spark', title: '', q: 'שאלה אישית אחרונה וסיימנו', sub: 'לדעתכם, איזה משפט מגדיר הכי טוב את ההתנהלות הפיננסית שלכם?' } };

  /* ---------------- מצב ---------------- */
  const START = { hasProperties: null, propertyValue: 3e5, mortgageAmount: 0, monthlyIncome: null, monthlyDebt: null, monthlySavings: null, liquidity: null, age: null, personality: null };
  let st = { ...START }, step = 'hasProperties', timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  const steps = () => { const k = ['hasProperties']; if (st.hasProperties) k.push('propertyValue', 'mortgageAmount'); k.push('income', 'debt', 'savings', 'liquidity', 'age', 'personality', 'leadForm', 'calculating', 'result'); return k; };
  const questions = () => steps().filter(k => !['leadForm', 'calculating', 'result'].includes(k));
  const next = () => { const s = steps(), i = s.indexOf(step); if (i + 1 < s.length) go(s[i + 1]); };
  const prev = () => { const s = steps(), i = s.indexOf(step); if (i > 0) go(s[i - 1]); };

  function canNext() {
    switch (step) {
      case 'propertyValue': case 'mortgageAmount': return true;
      case 'income': return (st.monthlyIncome ?? 0) > 0;
      case 'debt': return st.monthlyDebt !== null;
      case 'savings': return st.monthlySavings !== null;
      case 'liquidity': return st.liquidity !== null;
      case 'age': return (st.age ?? 0) > 0;
      case 'personality': return st.personality !== null;
      default: return false;
    }
  }

  /* הטקסט שמופיע במסך הביניים אחרי כל תשובה */
  function feedbackText() {
    switch (step) {
      case 'mortgageAmount': return equityTier(st.propertyValue - (st.mortgageAmount ?? 0), st.propertyValue, st.mortgageAmount ?? 0).description;
      case 'income': return pick(st.monthlyIncome, INCOME).description;
      case 'debt': return pick(st.monthlyDebt, DEBT).description;
      case 'savings': return pick(st.monthlySavings, SAVINGS).description;
      case 'liquidity': return pick(st.liquidity, LIQUIDITY).description;
      case 'age': return pick(st.age, AGE).description;
      /* בקוד הקיים יש באג: הוא בודק ערכים 1/2/3 אבל הערכים בפועל הם ‎-1/0/1, ולכן מוצג טקסט לא נכון. כאן מתוקן. */
      case 'personality': return st.personality === -1 ? 'לאט ובטוח — גישה חכמה! 🧠' : st.personality === 0 ? 'סיכון מחושב — מאוזנים! ⚖️' : st.personality === 1 ? 'מינוף זה החיים — אמיצים! 🚀' : 'מעולה! בואו נמשיך!';
      default: return 'מעולה! בואו נמשיך!';
    }
  }

  /* ---------------- רינדור ---------------- */
  const stage = document.getElementById('stage');
  const prog = document.getElementById('prog');
  const progStep = document.getElementById('prog-step'), progPct = document.getElementById('prog-pct'), progFill = document.getElementById('prog-fill');

  function setProgress() {
    const qs = questions(), m = qs.indexOf(step), f = qs.length;
    const show = step !== 'calculating' && step !== 'result';
    prog.hidden = !show;
    if (!show) return;
    const p = step === 'leadForm' ? 90 : m / f * 100;
    /* בקוד הקיים בטופס מופיע "שלב 0 מתוך 9". כאן: "כמעט סיימנו" */
    progStep.innerHTML = step === 'leadForm' ? 'כמעט סיימנו' : `שלב <b>${m + 1}</b> מתוך <b>${f}</b>`;
    progPct.textContent = Math.round(p) + '%';
    progFill.style.width = p + '%';
    prog.classList.toggle('is-zero', p === 0);
    prog.setAttribute('aria-valuenow', Math.round(p));
  }

  function swap(html, after) {
    const done = () => { stage.classList.remove('stage-out'); stage.innerHTML = html; after && after(); };
    if (!stage.innerHTML) return done();
    stage.classList.add('stage-out');
    setTimeout(done, 260);
  }

  function head(q, i0 = 0) {
    return `<div class="q">
      <div class="q__ic rise" style="--i:${i0}">${ic(q.icon)}</div>
      ${q.title ? `<p class="q__eyebrow rise" style="--i:${i0 + 1}">${esc(q.title)}</p>` : ''}
      <h2 class="q__text split">${split(q.q, 160)}</h2>
      <p class="q__sub rise" style="--i:${i0 + 4}">${esc(q.sub)}</p>
    </div>`;
  }
  const navHtml = (label = 'הבא', hideNext = false) => `
    <div class="nav rise" style="--i:7">
      <button class="back" type="button" data-act="back" ${steps().indexOf(step) === 0 ? 'disabled' : ''}><span class="arr">&lt;&lt;</span>הקודם</button>
      ${hideNext ? '' : `<button class="btn" type="button" data-act="next" ${canNext() ? '' : 'disabled'}><i class="hz" aria-hidden="true"></i>${label}<span class="arr">&gt;&gt;</span></button>`}
    </div>`;

  function go(to) {
    clearTimers();
    step = to;
    setProgress();
    const q = Q[step];
    if (q && q.kind === 'yesno') return swap(`<div class="stage__in">${head(q)}
        <div class="opts opts--2 rise" style="--i:5">
          <button class="opt" type="button" data-yes="1" aria-pressed="${st.hasProperties === true}"><span class="opt__l">כן</span></button>
          <button class="opt" type="button" data-yes="0" aria-pressed="${st.hasProperties === false}"><span class="opt__l">לא</span></button>
        </div></div><div class="stage__nav">${navHtml('הבא', true)}</div>`);
    if (q && q.kind === 'num') {
      const v = st[q.key] ?? 0;
      return swap(`${head(q)}
        <div class="num rise ${v > 0 ? '' : 'is-empty'}" style="--i:5">
          <input class="num__in" id="num" type="text" inputmode="numeric" autocomplete="off" aria-label="${esc(q.q)}" placeholder="${q.ph || (q.plain ? 'הזינו מספר' : 'הזינו סכום')}" value="${v > 0 ? fmt(v) : ''}">
          ${q.plain ? '' : '<span class="num__unit" aria-hidden="true">₪</span>'}
        </div>${navHtml()}`, () => { const n = document.getElementById('num'); n && n.focus({ preventScroll: true }); });
    }
    if (q && q.kind === 'pick') return swap(`${head(q)}
        <div class="opts opts--3 rise" style="--i:5">
          ${PERSONALITY.map(o => `<button class="opt" type="button" data-pick="${o.value}" aria-pressed="${st.personality === o.value}">${ic(o.icon)}<span class="opt__l opt__l--sm">${o.label}</span></button>`).join('')}
        </div>${navHtml('המשך')}`);
    if (step === 'leadForm') return swap(leadHtml());
    if (step === 'calculating') return swap(calcHtml(), runCalc);
    if (step === 'result') return swap(resultHtml(), runResult);
  }

  /* מסך ביניים: מופיע 4 שניות ואז ממשיך לשלב הבא */
  function feedback(text) {
    clearTimers();
    prog.hidden = true;
    swap(`<div class="fb"><div class="fb__card rise" style="--dur:4s">
        <div class="fb__ic">${ic('spark')}</div>
        <p class="fb__t">${esc(text)}</p>
        <span class="fb__time" aria-hidden="true"><i></i></span>
      </div></div>`);
    later(next, 4000);
  }

  /* ---------------- טופס הפרטים ---------------- */
  function leadHtml() {
    return `<div class="lead">
      <div class="lead__head">
        <div class="q__ic rise" style="--i:0">${ic('form')}</div>
        <h2 class="lead__t split">${split('רגע לפני התוצאות', 140)}</h2>
        <p class="lead__s rise" style="--i:3">השאירו פרטים ונשלח לכם את התוצאות המלאות</p>
      </div>
      <form class="lead__fields" id="lead" novalidate>
        <div class="fld rise" style="--i:4"><label class="fld__l" for="f-name">שם מלא</label><input class="fld__in" id="f-name" name="fullName" autocomplete="name" placeholder="ישראל ישראלי"></div>
        <div class="fld rise" style="--i:5"><label class="fld__l" for="f-tel">טלפון</label><input class="fld__in" id="f-tel" name="phone" type="tel" dir="ltr" autocomplete="tel" placeholder="050-1234567"></div>
        <div class="fld rise" style="--i:6"><label class="fld__l" for="f-mail">אימייל</label><input class="fld__in" id="f-mail" name="email" type="email" dir="ltr" autocomplete="email" placeholder="example@email.com"></div>
        <button class="btn btn--wide rise" style="--i:7" type="submit"><i class="hz" aria-hidden="true"></i><span class="lead__go">צפה בתוצאות</span><span class="arr">&gt;&gt;</span></button>
      </form>
      <div class="nav nav--end rise" style="--i:8"><button class="back" type="button" data-act="back"><span class="arr">&lt;&lt;</span>הקודם</button></div>
    </div>`;
  }
  function submitLead(form) {
    const v = Object.fromEntries(new FormData(form)), err = {};
    if (!v.fullName.trim()) err.fullName = 'שדה חובה';
    if (!v.phone.trim() || !/^0\d{8,9}$/.test(v.phone.replace(/[-\s]/g, ''))) err.phone = 'מספר טלפון לא תקין';
    if (!v.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) err.email = 'אימייל לא תקין';
    form.querySelectorAll('.fld').forEach(f => {
      const inp = f.querySelector('.fld__in'), msg = err[inp.name];
      f.classList.toggle('is-bad', !!msg);
      f.querySelector('.fld__err')?.remove();
      if (msg) f.insertAdjacentHTML('beforeend', `<span class="fld__err">${msg}</span>`);
    });
    if (Object.keys(err).length) return;
    /* כאן אצל המפתח: שמירת הליד במסד (simulator_leads). בדמו רק השהיה קצרה */
    const go2 = form.querySelector('.lead__go'), btn = form.querySelector('.btn');
    go2.textContent = 'שולח…'; btn.disabled = true;
    later(next, 650);
  }

  /* ---------------- מסך החישוב ---------------- */
  const CALC = [['מסכמים את התשובות...', 0], ['מעבדים את הסכומים...', 1200], ['מחשבים גם עליית ערך, מדדים ואינפלציה...', 2600], ['לוקחים בחשבון גם את הגיל והאופי שלכם...', 4200], ['הנה זה בא...', 5800]];
  const CALC_MS = 7200;
  function calcHtml() {
    return `<div class="calc" id="calc">
      <h2 class="calc__t split">${split('מעולה, נתחיל בחישוב...', 60, 20)}</h2>
      <p class="calc__p rise" style="--i:3">אנחנו מכניסים את התשובות שלכם לאלגוריתם מורכב<br>שפיתחו עבורכם צוות המומחים וטובי הכלכלנים של<br>Winner Real Estate<br>ומיד תקבלו תשובה מפורטת ומדויקת.</p>
      <ul class="calc__list">${CALC.map(([t]) => `<li class="calc__row"><span class="calc__mark">${CHECK}</span><span>${t}</span></li>`).join('')}</ul>
      <div class="calc__time" style="--dur:${CALC_MS}ms" aria-hidden="true"><i></i></div>
    </div>`;
  }
  function runCalc() {
    const rows = stage.querySelectorAll('.calc__row');
    CALC.forEach(([, d], k) => later(() => {
      rows.forEach((r, j) => { if (j < k) { r.classList.remove('is-now'); r.classList.add('is-done'); } });
      rows[k].classList.add('is-in', 'is-now');
    }, d));
    later(() => document.getElementById('calc')?.classList.add('is-out'), CALC_MS - 400);
    later(next, CALC_MS);
  }

  /* ---------------- התוצאה ---------------- */
  function resultHtml() {
    const sc = scenario(st), pr = projection(st), buy = buying(st);
    const allGreen = sc.statusBoxes.slice(0, 4).every(b => b.status === 'green');
    const boxes = sc.showProjection ? sc.statusBoxes : sc.statusBoxes.filter(b => b.key !== 'total');
    let i = 2;
    const statHtml = `<div class="stat rise" style="--n:${boxes.length};--i:${i++}">${boxes.map(b => `
        <div class="stat__box">${ic(b.icon)}<span class="stat__l">${b.label}</span>${b.key === 'total'
          ? `<span class="stat__score" data-count="${sc.totalScore}">0</span>`
          : `<span class="stat__m stat__m--${b.status === 'green' ? 'ok' : 'no'}" aria-label="${b.status === 'green' ? 'עומד בתנאי' : 'לא עומד בתנאי'}">${b.status === 'green' ? CHECK : CROSS}</span>`}</div>`).join('')}</div>`;

    let projHtml = '';
    if (sc.showProjection && pr) {
      const cols = [{ n: pr.now, l: 'ברגע זה' }];
      if (pr.midYears > 0 && pr.midYears !== pr.years) cols.push({ n: pr.in5years, l: `עוד ${pr.midYears} שנים` });
      if (pr.years > 0) cols.push({ n: pr.in10years, l: `עוד ${pr.years} שנים` });
      const max = Math.max(1, ...cols.map(c => c.n));
      projHtml = `<div class="rise" style="--i:${i++}"><h3 class="res__h">כמה נכסים יכולים להיות לכם?</h3></div>
        <div class="proj ${allGreen ? 'proj--ok' : ''} rise" style="--i:${i++}">${cols.map(c => `
          <div class="proj__col"><div class="proj__bar"><div class="proj__fill" style="--h:${(24 + 76 * c.n / max).toFixed(1)}%"><span class="proj__n" data-count="${c.n}">0</span></div></div><span class="proj__l">${c.l}</span></div>`).join('')}</div>`;
    }

    const buyHtml = buy.total > 0 ? `<div class="buy rise" style="--i:${i++}">
        <p class="buy__l">יכולת רכישה משוערת לנכס נוסף</p>
        <p class="buy__v" data-money="${buy.total}">${ils(0)}</p>
        <p class="buy__parts"><span>מההכנסה הפנויה: <b>${ils(buy.fromIncome)}</b></span><span>מההון הנזיל: <b>${ils(buy.fromLiquid)}</b></span></p>
      </div>` : '';

    const [lead, ...rest] = sc.summaryText.split('\n');
    const sumHtml = `<div class="sum ${allGreen ? 'sum--ok' : ''} rise" style="--i:${i++}">
        <h3 class="sum__t">${esc(sc.summaryTitle)}</h3>
        <p class="sum__lead">${esc(lead)}</p>
        ${rest.length ? `<p class="sum__p">${esc(rest.join('\n'))}</p>` : ''}
      </div>`;

    const ctaHtml = sc.ctaType !== 'luck'
      ? `<div class="res__cta rise" style="--i:${i++}"><button class="btn btn--wide" type="button"><i class="hz" aria-hidden="true"></i>${esc(sc.ctaText)}<span class="arr">&gt;&gt;</span></button></div>`
      : `<p class="res__luck rise" style="--i:${i++}">${esc(sc.ctaText)}</p>`;

    return `<div class="res">
      <h2 class="res__t split">${split('סיכום הסטטוס הפינאנסי שלכם', 40, 20)}</h2>
      ${statHtml}${projHtml}${buyHtml}${sumHtml}${ctaHtml}
      <div class="res__again rise" style="--i:${i++}"><button class="back" type="button" data-act="restart">התחל מחדש<span class="arr">&nbsp;↻</span></button></div>
    </div>`;
  }
  function countUp(el, to, money) {
    const t0 = performance.now(), dur = 1300;
    const tick = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3), v = Math.round(to * e);
      el.textContent = money ? ils(v) : v; if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    /* גיבוי: אם הלשונית ברקע והאנימציה לא רצה, המספר הסופי מופיע בכל מקרה */
    later(() => { el.textContent = money ? ils(to) : to; }, dur + 150);
  }
  function runResult() {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    stage.querySelectorAll('[data-count]').forEach(el => reduce ? el.textContent = el.dataset.count : later(() => countUp(el, +el.dataset.count), 500));
    stage.querySelectorAll('[data-money]').forEach(el => reduce ? el.textContent = ils(+el.dataset.money) : later(() => countUp(el, +el.dataset.money, true), 700));
    later(() => stage.querySelector('.proj')?.classList.add('is-on'), 450);
    document.getElementById('sim').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------------- אירועים ---------------- */
  stage.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t || t.disabled) return;
    if (t.dataset.act === 'back') return prev();
    if (t.dataset.act === 'restart') { st = { ...START }; return go('hasProperties'); }
    if (t.dataset.yes != null) {
      const yes = t.dataset.yes === '1';
      st.hasProperties = yes;
      stage.querySelectorAll('[data-yes]').forEach(b => b.setAttribute('aria-pressed', b === t));
      later(() => feedback(yes ? 'הו, התחלה מושלמת!' : 'הכל טוב, אולי בקרוב ממש...'), 150);
      return;
    }
    if (t.dataset.pick != null) {
      st.personality = +t.dataset.pick;
      stage.querySelectorAll('[data-pick]').forEach(b => b.setAttribute('aria-pressed', b === t));
      stage.querySelector('[data-act="next"]').disabled = !canNext();
      return;
    }
    if (t.dataset.act === 'next') {
      if (step === 'propertyValue') return next();
      return feedback(feedbackText());
    }
  });

  /* שדה הסכום: ספרות בלבד, פסיקים תוך כדי הקלדה, ואותם גבולות מינימום/מקסימום כמו בקוד הקיים */
  stage.addEventListener('input', e => {
    if (e.target.id !== 'num') return;
    const q = Q[step], digits = e.target.value.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
    const n = parseInt(digits, 10);
    st[q.key] = isNaN(n) ? 0 : Math.max(q.min, Math.min(q.max, n));
    e.target.value = digits ? fmt(+digits) : '';
    e.target.closest('.num').classList.toggle('is-empty', !digits);
    const b = stage.querySelector('[data-act="next"]'); if (b) b.disabled = !canNext();
  });
  stage.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'num') { const b = stage.querySelector('[data-act="next"]'); if (b && !b.disabled) b.click(); }
  });
  stage.addEventListener('submit', e => { if (e.target.id === 'lead') { e.preventDefault(); submitLead(e.target); } });
  stage.addEventListener('input', e => { const f = e.target.closest('.fld.is-bad'); if (f) { f.classList.remove('is-bad'); f.querySelector('.fld__err')?.remove(); } });

  /* ברק הזכוכית עוקב אחרי העכבר */
  const panel = document.getElementById('sim');
  panel.addEventListener('pointermove', e => {
    const r = panel.getBoundingClientRect();
    panel.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    panel.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  });

  go('hasProperties');
})();
