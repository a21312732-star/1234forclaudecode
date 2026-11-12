// Пакетная озвучка freetts.ru по WebSocket: один браузер, много коротких кусков.
// node tools/freetts-batch.js <voiceId> chunks.json outdir
// chunks.json — массив строк; пишет outdir/0001.mp3 ...; уже существующие файлы пропускает.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [voiceId, list, outdir] = process.argv.slice(2);
const chunks = JSON.parse(fs.readFileSync(list, 'utf8'));
fs.mkdirSync(outdir, { recursive: true });
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('https://freetts.ru/', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  for (let i = 0; i < chunks.length; i++) {
    const out = path.join(outdir, String(i + 1).padStart(4, '0') + '.mp3');
    if (fs.existsSync(out)) continue;
    let res = null;
    for (let a = 0; a < 5 && !res?.b64; a++) {
      res = await p.evaluate(({ text, voiceId }) => new Promise((resolve) => {
        const parts = [], ws = new WebSocket('wss://api.freetts.ru/generate'); ws.binaryType = 'arraybuffer'; let msg = '', fin = false;
        const done = async (err) => { if (fin) return; fin = true; try { ws.close(); } catch (e) {} if (err || !parts.length) return resolve({ err: err || msg || 'нет аудио' });
          const u = new Uint8Array(await new Blob(parts).arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); resolve({ b64: btoa(s) }); };
        ws.onopen = () => ws.send(JSON.stringify({ action: 'start', text: text + '⁣', voiceId }));
        ws.onmessage = (e) => { if (e.data instanceof ArrayBuffer) { parts.push(e.data); return; } let r; try { r = JSON.parse(e.data); } catch (x) { return; }
          msg = r.message || msg; if (r.status === 'error') done(r.message || 'ошибка'); if (r.status === 'ready') done(); };
        ws.onerror = () => done('ошибка соединения'); setTimeout(() => done('таймаут'), 180000);
      }), { text: chunks[i], voiceId });
      if (!res.b64) { console.log(`#${i + 1} попытка ${a + 1}: ${res.err}`); await p.waitForTimeout(8000 + a * 8000); }
    }
    if (res?.b64) { fs.writeFileSync(out, Buffer.from(res.b64, 'base64')); console.log(`#${i + 1}/${chunks.length} ok`); }
    else console.log(`#${i + 1} НЕ ПОЛУЧЕНО`);
  }
  await b.close();
})();
