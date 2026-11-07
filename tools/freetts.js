// Озвучка через freetts.ru (бесплатный сайт синтеза речи) в браузере Playwright.
// node tools/freetts.js "Глеб Осипов" текст.txt out.mp3
// Сайт иногда отвечает 502 — страница открывается с повторами. Сайт работает по одному запросу: длинные тексты лучше
// отправлять целиком (до ~1000 символов), он сам склеивает фразы.
const { chromium } = require('playwright');
const fs = require('fs');
const [voice, textFile, out] = process.argv.slice(2);
if (!voice || !textFile || !out) { console.error('node tools/freetts.js "Имя голоса" text.txt out.mp3'); process.exit(1); }
const text = fs.readFileSync(textFile, 'utf8').trim();

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 1400 } });
  // сайт отдаёт mp3 как blob: перехватываем URL.createObjectURL и сохраняем аудио-blob'ы
  await p.addInitScript(() => {
    window.__aud = []; const orig = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (o) => { try { if (o && o.type && o.type.includes('audio')) window.__aud.push(o); } catch (e) {} return orig(o); };
  });
  let ok = false;
  for (let i = 0; i < 6 && !ok; i++) {
    await p.goto('https://freetts.ru/', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    ok = (await p.locator('textarea').count()) > 0;
    if (!ok) await p.waitForTimeout(5000 + i * 5000);
  }
  if (!ok) { console.error('freetts.ru не открылся'); process.exit(2); }
  // выбор голоса
  await p.locator('button').filter({ hasText: 'Язык' }).first().click();
  const card = p.locator('p.voice-name', { hasText: new RegExp(`^${voice}$`) }).first();
  await card.waitFor({ timeout: 20000 });
  await card.locator('xpath=ancestor::*[.//button[contains(., "Выбрать")]][1]').locator('button', { hasText: 'Выбрать' }).first().click();
  await p.waitForTimeout(800);
  // ловим mp3 из ответа
  let mp3 = null;
  await p.evaluate(() => { window.__aud = []; });
  await p.locator('textarea').first().fill(text);
  await p.getByRole('button', { name: 'Озвучить текст' }).click();
  for (let s = 0; s < 240 && !mp3; s++) {
    await p.waitForTimeout(1000);
    const b64 = await p.evaluate(async () => { const a = window.__aud[window.__aud.length - 1]; if (!a) return null;
      const u = new Uint8Array(await a.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); });
    if (b64) mp3 = Buffer.from(b64, 'base64');
  }
  await b.close();
  if (!mp3) { console.error('аудио не получено'); process.exit(3); }
  fs.writeFileSync(out, mp3); console.log('ok', out, mp3.length, 'байт');
})();
