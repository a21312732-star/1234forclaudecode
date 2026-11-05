const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const OUT = process.argv[2], FPS = 30;
// папка ролика: node tools/export-mp4.js out.mp4 kgb-1991 (по умолчанию — корень, «Тишина»)
const PROJ = require('path').resolve(__dirname, '..', process.argv[3] || '.');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').join(PROJ, 'index.html') + '?capture', { waitUntil: 'load' });
  await p.waitForTimeout(1000);
  const DUR = await p.evaluate(() => window.__DUR);
  const wav = await p.evaluate(() => window.__renderAudio());
  fs.writeFileSync(require('os').tmpdir() + '/tishina-audio.wav', Buffer.from(wav, 'base64'));
  // озвучка voice.mp3 (если есть) подмешивается к звуковым эффектам; эффекты приглушаются под голосом
  const voicePath = require('path').join(PROJ, 'voice.mp3');
  const VOICE_ARGS = fs.existsSync(voicePath) ? ['-i', voicePath, '-filter_complex',
    '[2:a]asplit=2[v][key];[1:a][key]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=300[fx];[fx][v]amix=inputs=2:normalize=0[a]',
    '-map', '0:v', '-map', '[a]'] : [];
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', require('os').tmpdir() + '/tishina-audio.wav', ...VOICE_ARGS, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.round(DUR * FPS);
  for (let i = 0; i < N; i++) {
    await p.evaluate(t => window.__render(t), i / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log('frame', i, '/', N);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log('errors:', JSON.stringify(errs));
  await b.close();
})();
