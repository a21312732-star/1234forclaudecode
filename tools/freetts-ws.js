// Озвучка через freetts.ru напрямую по WebSocket (без интерфейса сайта, который часто не грузится).
// node tools/freetts-ws.js <voiceId> текст.txt out.mp3     (voiceId — из https://api.freetts.ru/voices?lang=rus, напр. rus_Nikita_Kalinin)
const { chromium } = require('playwright');
const fs = require('fs');
const [voiceId, textFile, out] = process.argv.slice(2);
if (!voiceId || !textFile || !out) { console.error('node tools/freetts-ws.js voiceId text.txt out.mp3'); process.exit(1); }
const text = fs.readFileSync(textFile, 'utf8').trim();
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  if (process.env.DEBUG) p.on('console', (m) => console.error(m.text()));
  await p.goto('https://freetts.ru/', { waitUntil: 'domcontentloaded', timeout: 60000 }); // тот же origin, что у сайта
  let res = null;
  for (let attempt = 0; attempt < 4 && !res?.b64; attempt++) {
    res = await p.evaluate(({ text, voiceId }) => new Promise((resolve) => {
      const parts = [], ws = new WebSocket('wss://api.freetts.ru/generate'); ws.binaryType = 'arraybuffer'; let msg = '';
      const done = async (err) => { try { ws.close(); } catch (e) {} if (err || !parts.length) return resolve({ err: err || msg || 'нет аудио' });
        const u = new Uint8Array(await new Blob(parts).arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); resolve({ b64: btoa(s) }); };
      ws.onopen = () => ws.send(JSON.stringify({ action: 'start', text: text + '⁣', voiceId }));
      ws.onmessage = (e) => { if (e.data instanceof ArrayBuffer) { parts.push(e.data); return; } let r; try { r = JSON.parse(e.data); } catch (x) { return; }
        msg = r.message || msg; console.log('status', r.status, r.message || '', parts.length); if (r.status === 'error') done(r.message || 'ошибка'); if (r.status === 'ready') done(); };
      ws.onerror = () => done('ошибка соединения'); setTimeout(() => done('таймаут'), 240000);
    }), { text, voiceId });
    if (!res.b64) { console.error('попытка', attempt + 1, ':', res.err); await p.waitForTimeout(10000); }
  }
  await b.close();
  if (!res?.b64) process.exit(3);
  const buf = Buffer.from(res.b64, 'base64'); fs.writeFileSync(out, buf); console.log('ok', out, buf.length, 'байт');
})();
