"use strict";
/* Общий движок серии «Выживи».
   Ролик (index.html) объявляет: DUR, WARP, SCENES, CAPS, SPEAK, SHAKES, FLASHES, UPD, build(), clockText(t),
   MUSIC, SOUND(sfx, add) — и в конце вызывает ENGINE.start().
   Последние две сцены — петля: камера возвращается к первому кадру, финальный кадр совпадает с первым. */

/* ---------- математика и анимация ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a, b, x) => a + (b - a) * x;
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const pulse = (t, a, b, f = .12) => Math.min(prog(t, a, a + f), 1 - prog(t, b - f, b));
function warp(t, a, b) {
  for (let i = 1; i < WARP.length; i++) { const p = WARP[i - 1], q = WARP[i];
    if (t <= q[a] || i === WARP.length - 1) return p[b] + (t - p[a]) * (q[b] - p[b]) / ((q[a] - p[a]) || 1); }
  return t;
}
const toNew = (t) => warp(t, 0, 1), toOld = (t) => warp(t, 1, 0);
const frame = (t) => render(toOld(t));

// HTML-элементы: появление, «поп», исчезание
const show = (el, t, at0, dur = 0.3, dy = 30) => {
  const p = easeOut(prog(t, at0, at0 + dur));
  el.style.opacity = p; el.style.transform = `translateY(${(1 - p) * dy}px) scale(${0.9 + 0.1 * p})`;
};
const pop = (el, t, at0, rot = 0) => { const p = prog(t, at0, at0 + .3); const s = p < 1 ? easeOut(p) * (1 + .25 * Math.sin(p * Math.PI)) : 1;
  el.style.opacity = p > 0 ? 1 : 0; el.style.transform = `rotate(${rot}deg) scale(${s})`; };
const hide = (el, t, a, b = a + .2) => { if (t > a) el.style.opacity = Math.min(+el.style.opacity, 1 - prog(t, a, b)); };
const popIn = (sel, t, a, rot = 0, out = 1e9) => { const el = $(sel); pop(el, t, a, rot); if (t < a) el.style.opacity = 0; hide(el, t, out); return el; };
// SVG-элементы
const at = (id, x, y, s = 1, o = 1, r = 0) => { const e = document.getElementById(id); e.setAttribute("transform", `translate(${x} ${y}) rotate(${r}) scale(${s})`); e.setAttribute("opacity", o); };
const op = (id, o) => document.getElementById(id).setAttribute("opacity", o);

/* ---------- персонаж: плоская 2D-рисовка ---------- */
// Начало координат — таз. Позы: la/ra — подъём рук (0 = вниз, 90 = в стороны, 180 = вверх), ll/rl — ног, face — эмоция.
function person(id, o = {}) {
  const c = o.coat || "#e8553d", c2 = o.coat2 || "#b83a26", p = o.pants || "#2d3a4f", skin = o.skin || "#f4c7a1", hair = o.hair || "#3b2a1e";
  const hat = o.hat ? `<path d="M-38 -8 Q-38 -48 0 -48 Q38 -48 38 -8 Z" fill="${o.hat}"/><rect x="-41" y="-14" width="82" height="16" rx="8" fill="${o.hat2 || "#fff"}"/><circle cy="-52" r="11" fill="${o.hat2 || "#fff"}"/>`
    : `<path d="M-36 -6 Q-40 -44 0 -42 Q38 -44 36 -6 Q30 -26 0 -28 Q-24 -28 -36 -6Z" fill="${hair}"/>`;
  const leg = (cls, x) => `<g class="${cls}" transform="translate(${x} 0)"><rect x="-12" y="-4" width="24" height="82" rx="11" fill="${p}"/><rect x="-14" y="70" width="32" height="18" rx="9" fill="#1d1d1d"/></g>`;
  const arm = (cls, x) => `<g class="${cls}" transform="translate(${x} -84)"><rect x="-11" y="-6" width="22" height="72" rx="11" fill="${c}"/><circle cy="70" r="12" fill="${o.gloves || skin}"/></g>`;
  return `<g id="${id}"><g class="pr">${leg("lL", -15)}${leg("rL", 15)}
    <rect x="-38" y="-100" width="76" height="108" rx="28" fill="${c}"/><path d="M0 -96 V4" stroke="${c2}" stroke-width="5"/>
    ${o.scarf ? `<rect x="-30" y="-104" width="60" height="18" rx="9" fill="${o.scarf}"/>` : ""}
    ${arm("aL", -36)}${arm("aR", 36)}
    <g class="hd" transform="translate(0 -136)"><circle r="38" fill="${skin}"/>${hat}
      <g class="eyes"><ellipse class="eL" cx="-13" cy="2" rx="5" ry="6" fill="#222"/><ellipse class="eR" cx="13" cy="2" rx="5" ry="6" fill="#222"/></g>
      <path class="br" d="M-22 -12 L-6 -10 M6 -10 L22 -12" stroke="#3b2a1e" stroke-width="4" stroke-linecap="round"/>
      <path class="mo" d="M-10 18 Q0 24 10 18" stroke="#7a2c1e" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="-24" cy="12" r="6" fill="#ff8a8a" opacity=".45"/><circle cx="24" cy="12" r="6" fill="#ff8a8a" opacity=".45"/></g>
  </g></g>`;
}
const FACES = {
  calm: ["M-10 18 Q0 24 10 18", "#7a2c1e", "none", "M-22 -12 L-6 -10 M6 -10 L22 -12"],
  happy: ["M-14 14 Q0 30 14 14", "#7a2c1e", "none", "M-22 -14 L-6 -14 M6 -14 L22 -14"],
  panic: ["M-9 20 Q0 4 9 20 Q0 32 -9 20Z", "#5a1a12", "#5a1a12", "M-22 -18 L-6 -12 M6 -12 L22 -18"],
  worried: ["M-10 22 Q0 14 10 22", "#7a2c1e", "none", "M-22 -10 L-6 -16 M6 -16 L22 -10"],
  focus: ["M-9 19 L9 19", "#7a2c1e", "none", "M-22 -9 L-6 -6 M6 -6 L22 -9"],
  cold: ["M-12 20 L-6 16 L0 20 L6 16 L12 20", "#5a7aa0", "none", "M-22 -10 L-6 -14 M6 -14 L22 -10"],
};
function setPose(id, p = {}) {
  const g = document.getElementById(id);
  const s = (sel, tr) => { const e = g.querySelector(sel); e.setAttribute("transform", tr); };
  s(".aL", `translate(-36 -84) rotate(${p.la || 0})`); s(".aR", `translate(36 -84) rotate(${-(p.ra || 0)})`);
  s(".lL", `translate(-15 0) rotate(${p.ll || 0})`); s(".rL", `translate(15 0) rotate(${-(p.rl || 0)})`);
  s(".hd", `translate(${p.hx || 0} ${-136 + (p.hy || 0)}) rotate(${p.tilt || 0})`);
  const f = FACES[p.face || "calm"], mo = g.querySelector(".mo");
  mo.setAttribute("d", f[0]); mo.setAttribute("stroke", f[1]); mo.setAttribute("fill", f[2]); g.querySelector(".br").setAttribute("d", f[3]);
  const blink = p.blink ? .15 : 1; g.querySelectorAll(".eL,.eR").forEach((e) => e.setAttribute("ry", 6 * blink * (p.face === "panic" ? 1.4 : 1)));
  const lx = p.look || 0; g.querySelector(".eyes").setAttribute("transform", `translate(${lx * 6} 0)`);
}
// ходьба: поза на момент t
const walk = (t, k = 1, extra = {}) => { const w = Math.sin(t * 9 * k); return { la: 20 * w, ra: -20 * w, ll: 22 * w, rl: -22 * w, ...extra }; };

/* ---------- субтитры ---------- */
function parseCap(str) {
  const out = []; const re = /\{(\w):([^}]*)\}|([^{]+)/g; let m;
  while ((m = re.exec(str))) { const cls = m[1] || "", txt = m[2] !== undefined ? m[2] : m[3];
    txt.split(/\s+/).filter(Boolean).forEach((w) => out.push({ w, cls })); }
  return out;
}
const capEnd = (i) => (i + 1 < CAPS.length ? CAPS[i + 1][0] : DUR);

/* ---------- кадр ---------- */
let lastCap = -1;
function render(t) {
  t = clamp(t, 0, DUR);
  let gl = 0; const N = SCENES.length;
  SCENES.forEach((sc, i) => {
    const on = t >= sc.s && (t < sc.e || (i === N - 1 && t <= sc.e));
    const el = document.getElementById(sc.id);
    if (!on) el.style.display = "none";
    else {
      el.style.display = "block";
      const lt = t - sc.s;
      // первая сцена без проявления (первый кадр = последнему), последние две — петля
      el.style.opacity = i === 0 ? 1 - prog(t, sc.e - .2, sc.e) : i >= N - 2 ? 1 : Math.min(prog(lt, 0, .2), 1 - prog(t, sc.e - .2, sc.e));
      UPD[sc.id](lt, t);
    }
    if (i > 0 && i < N - 2) gl = Math.max(gl, 1 - Math.abs(t - sc.s) / 0.16);
  });
  const st = $("#stage");
  if (gl > 0) { const dx = (hash(t * 97) - .5) * 26 * gl;
    st.style.filter = `drop-shadow(${dx}px 0 0 rgba(255,40,80,${.55 * gl})) drop-shadow(${-dx}px 0 0 rgba(40,200,255,${.5 * gl})) contrast(${1 + .25 * gl})`;
  } else st.style.filter = "";
  let sx = 0, sy = 0; (typeof SHAKES !== "undefined" ? SHAKES : []).forEach((k) => { if (t > k && t < k + .5) { const a = Math.exp(-(t - k) * 9) * 24; sx += a * Math.sin((t - k) * 70); sy += a * Math.cos((t - k) * 55); } });
  $("#cam").style.transform = sx || sy ? `translate(${sx}px,${sy}px)` : "";
  let fl = 0; (typeof FLASHES !== "undefined" ? FLASHES : []).forEach((k) => { if (t > k && t < k + .3) fl = Math.max(fl, .5 * (1 - prog(t, k, k + .3))); });
  $("#flash").style.opacity = fl;
  if (typeof OVERLAY === "function") OVERLAY(t); // поверх сцен (плашки глав и т.п.)
  const ck = clockText(t), c = $("#clock"); c.style.display = ck ? "block" : "none"; if (ck) c.textContent = ck;
  let ci = -1; CAPS.forEach(([a], i) => { if (t >= a) ci = i; });
  const cap = $("#cap");
  if (ci !== lastCap) { lastCap = ci; cap.innerHTML = ci < 0 ? "" : parseCap(CAPS[ci][1]).map((o) => `<span class="w ${o.cls}">${o.w}</span>`).join(" "); }
  if (ci >= 0) {
    const a = CAPS[ci][0], b = capEnd(ci), ws = cap.querySelectorAll(".w"), n = ws.length;
    const span = Math.min(b - a, 0.26 * n + 0.2) * 0.85;
    ws.forEach((w, i) => { const s0 = a + (i / Math.max(1, n)) * span, on = t >= s0;
      w.style.opacity = on ? 1 : 0; w.style.transform = on ? `scale(${1 + 0.1 * (1 - prog(t, s0, s0 + .15))})` : "scale(.7)"; });
    const pp = easeOut(prog(t, a, a + .15));
    cap.style.transform = `translateY(${(1 - pp) * 14}px)`; cap.style.opacity = Math.min(pp, 1 - prog(t, b - .06, b));
  } else cap.style.opacity = 0;
}

/* ---------- звук: синтез Web Audio (живое воспроизведение и офлайн-экспорт) ---------- */
function noiseBuf(ctx, sec = 3) { const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
function scheduleAudio(ctx, out, from) {
  const NB = noiseBuf(ctx);
  const TV = (tv) => ctx.currentTime + 0.05 + (tv - from);
  const T = (t) => TV(toNew(t));
  const env = (g, t0, a, peak, d) => { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d); };
  const osc = (type, f, t0, a, peak, d, f1) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + a + d); env(g, t0, a, peak, d); o.connect(g).connect(out); o.start(t0); o.stop(t0 + a + d + .05); return o; };
  const noise = (t0, dur, type, freq, q, peak, a = .01, f1) => { const s = ctx.createBufferSource(); s.buffer = NB; s.loop = true; const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.setValueAtTime(freq, t0); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + a + dur); f.Q.value = q;
    const g = ctx.createGain(); env(g, t0, a, peak, dur); s.connect(f).connect(g).connect(out); s.start(t0); s.stop(t0 + a + dur + .05); return f; };
  const sfx = {
    osc, noise,
    kick: (a, v = 1) => osc("sine", 140, a, .003, .7 * v, .3, 40),
    hat: (a, v = 1) => noise(a, .03, "highpass", 8000, 1, .08 * v, .001),
    boom: (a) => { osc("sine", 110, a, .005, 1.0, 1.4, 38); osc("triangle", 220, a, .005, .3, .5, 60); noise(a, .25, "lowpass", 900, 1, .5, .002, 120); },
    whoosh: (a, d = .3) => noise(a, d, "bandpass", 400, 1.5, .45, d * .6, 3500),
    whooshDown: (a) => noise(a, .8, "bandpass", 3000, 1.2, .45, .1, 200),
    ding: (a) => { [1320, 1980, 2640].forEach((f, i) => osc("sine", f, a, .002, .25 / (i + 1), 1.0)); },
    ok: (a) => { osc("sine", 880, a, .003, .25, .15); osc("sine", 1320, a + .1, .003, .25, .3); },
    no: (a) => { osc("square", 220, a, .003, .15, .2); osc("square", 160, a + .18, .003, .15, .3); },
    pop: (a) => osc("sine", 600, a, .002, .25, .1, 1300),
    tick: (a) => noise(a, .015, "highpass", 4000, 1, .18, .001),
    heart: (a, v = 1) => { osc("sine", 55, a, .01, .55 * v, .16); osc("sine", 48, a + .18, .01, .38 * v, .18); },
    breath: (a, d = .6) => noise(a, d, "bandpass", 1100, 1.2, .25, d * .4, 700),
    crack: (a) => { for (let i = 0; i < 6; i++) noise(a + i * .035 + hash(i) * .02, .03, "highpass", 2500 + 2000 * hash(i + 3), 2, .5, .001); osc("sine", 70, a, .002, .5, .4, 35); },
    splash: (a) => { noise(a, .7, "lowpass", 2500, .8, .7, .005, 300); noise(a, .4, "highpass", 3000, 1, .3, .003);
      for (let i = 0; i < 8; i++) osc("sine", 500 + 600 * hash(i + 9), a + .25 + i * .07, .003, .08, .06, 1500 + 800 * hash(i)); },
    bubbles: (a, n = 5) => { for (let i = 0; i < n; i++) osc("sine", 400 + 500 * hash(i + a), a + i * .11, .003, .07, .06, 1200); },
    wind: (a, d, v = 1) => { const f = noise(a, d, "bandpass", 500, 2.5, .16 * v, Math.min(1.5, d / 3));
      for (let k = 0; k < d; k += 1.3) f.frequency.linearRampToValueAtTime(350 + 450 * hash(k + 1), a + k + 1.3); },
    engine: (a, d, v = 1) => { osc("sawtooth", 42, a, .3, .14 * v, d); noise(a, d, "lowpass", 160, 1, .2 * v, .3); },
    shovel: (a) => { noise(a, .18, "bandpass", 900, 1, .4, .01, 400); noise(a + .2, .1, "lowpass", 600, 1, .3, .005); },
    whistle: (a, d = .35) => { const o = osc("sine", 2900, a, .02, .2, d); const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 38; lg.gain.value = 140; l.connect(lg).connect(o.frequency); l.start(a); l.stop(a + d + .1); },
    fire: (a, d) => { noise(a, d, "lowpass", 600, 1, .12, .3); for (let k = 0; k < d * 8; k++) noise(a + k / 8 + hash(k) * .1, .01, "highpass", 3000, 1, .3 * hash(k + 7), .001); },
    beep: (a) => osc("square", 1000, a, .003, .08, .12),
    ring: (a) => { for (let i = 0; i < 2; i++) { osc("sine", 425, a + i * 1.1, .02, .12, .9); } },
    riser: (a, d = 1) => noise(a, d, "bandpass", 300, 3, .3, d * .9, 5000),
  };
  // музыка: напряжённый гул + пульс; MUSIC = { bpm, root, parts: [[начало, конец, "pad"|"pulse"|"drive", громкость], ...] } в времени сценария
  const M = typeof MUSIC !== "undefined" ? MUSIC : { bpm: 90, root: 55, parts: [] }, BEAT = 60 / M.bpm, endV = toNew(DUR);
  M.parts.forEach(([s, e, kind, lv]) => {
    const a = T(s), b = T(e); if (toNew(e) < from) return;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, Math.max(a, ctx.currentTime)); g.gain.exponentialRampToValueAtTime(.09 * lv, Math.max(a, ctx.currentTime) + .6);
    g.gain.setValueAtTime(.09 * lv, Math.max(b - .4, ctx.currentTime + .7)); g.gain.exponentialRampToValueAtTime(0.0001, Math.max(b, ctx.currentTime + .8));
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = kind === "drive" ? 900 : 500; lp.connect(g).connect(out);
    [1, 1.5, 2, 1.003].forEach((k) => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = M.root * k; o.connect(lp); o.start(Math.max(a, ctx.currentTime)); o.stop(Math.max(b, ctx.currentTime + .9) + .1); });
  });
  for (let k = 0; k * BEAT < endV - .01; k++) {
    const tv = k * BEAT; if (tv < from - .01) continue;
    const t = toOld(tv), part = M.parts.find(([s, e]) => t >= s && t < e); if (!part) continue;
    const [, , kind, lv] = part, a = TV(tv);
    if (kind === "pulse") { if (k % 2 === 0) sfx.kick(a, .6 * lv); sfx.hat(a + BEAT / 2, .5 * lv); }
    if (kind === "drive") { sfx.kick(a, lv); if (k % 2) noise(a, .08, "bandpass", 1500, 1, .25 * lv, .001); sfx.hat(a + BEAT / 2, lv); sfx.hat(a + BEAT / 4, .4 * lv);
      if (k % 4 === 0) osc("sine", M.root * 1.5, a, .005, .5 * lv, .5, M.root); }
  }
  const EV = []; const add = (t, fn) => EV.push([t, fn]);
  SOUND(sfx, add);
  SCENES.slice(1, -2).forEach((s) => add(s.s - .05, (a) => noise(a, .12, "bandpass", 2000, .7, .12)));
  EV.forEach(([t, fn]) => { if (toNew(t) >= from - .01) fn(T(t)); });
}

/* ---------- плеер ---------- */
let VDUR = 0, VOICE = [];
let actx = null, bus = null, playing = false, pos = 0, t0 = 0, voiceOn = true, raf = 0, vIdx = 0, voiceFile = true, vtrack = null;
function now() { return playing ? (performance.now() - t0) / 1000 : pos; }
function startAudio() {
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume();
    if (bus) { bus.gain.setTargetAtTime(0, actx.currentTime, .02); const b = bus; setTimeout(() => b.disconnect(), 200); }
    bus = actx.createGain(); bus.gain.value = 0.7; const comp = actx.createDynamicsCompressor(); bus.connect(comp).connect(actx.destination);
    scheduleAudio(actx, bus, pos);
  } catch (e) { console.warn("audio", e); }
}
function stopAudio() { vtrack.pause(); if (bus && actx) { bus.gain.setTargetAtTime(0, actx.currentTime, .02); const b = bus; setTimeout(() => b.disconnect(), 200); bus = null; } stopVoice(); }
const synth = window.speechSynthesis; let ruVoice = null;
function pickVoice() { if (!synth) return; const vs = synth.getVoices(); ruVoice = vs.find((v) => /ru/i.test(v.lang) && /google|yandex|milena|natural/i.test(v.name)) || vs.find((v) => /ru/i.test(v.lang)) || null; }
function stopVoice() { if (synth) synth.cancel(); }
function speak(text) { if (!synth || !voiceOn || voiceFile) return; const u = new SpeechSynthesisUtterance(text); u.lang = "ru-RU"; if (ruVoice) u.voice = ruVoice; u.rate = 1.15; synth.speak(u); }
function syncVoiceIdx(t) { vIdx = VOICE.findIndex((v) => toNew(v.t) >= t - 0.05); if (vIdx < 0) vIdx = VOICE.length; }
function play() {
  if (pos >= VDUR) pos = 0;
  playing = true; t0 = performance.now() - pos * 1000; syncVoiceIdx(pos); startAudio();
  if (voiceFile) { try { vtrack.currentTime = pos; } catch (e) {} vtrack.muted = !voiceOn; vtrack.play().catch(() => {}); } $("#pp").textContent = "❚❚"; loop();
}
function pause() { pos = now(); playing = false; stopAudio(); cancelAnimationFrame(raf); $("#pp").textContent = "▶"; }
function seek(t) { const was = playing; if (was) pause(); pos = clamp(t, 0, VDUR); frame(pos); updUI(pos); if (was) play(); }
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function updUI(t) { $("#seek").value = t; $("#time").textContent = `${fmt(t)} / ${fmt(VDUR)}`; }
function loop() {
  const t = now();
  while (vIdx < VOICE.length && toNew(VOICE[vIdx].t) <= t) { if (t - toNew(VOICE[vIdx].t) < 0.6) speak(VOICE[vIdx].text); vIdx++; }
  if (voiceFile && !vtrack.paused && Math.abs(vtrack.currentTime - t) > 0.3) vtrack.currentTime = t;
  frame(t); updUI(t);
  if (t >= VDUR) { pos = 0; stopAudio(); play(); return; } // закольцовано, как в ленте
  raf = requestAnimationFrame(loop);
}
// формат: вертикальный 1080×1920 (Shorts/TikTok) или горизонтальный 1920×1080 (window.FORMAT = "landscape")
let SW = 1080, SH = 1920;
function fit() { const s = Math.min(innerWidth / SW, innerHeight / SH); $("#stage").style.transform = `translate(-50%,-50%) scale(${s})`; }

const ENGINE = {
  start() {
    VDUR = WARP[WARP.length - 1][1];
    if (typeof FORMAT !== "undefined" && FORMAT === "landscape") { SW = 1920; SH = 1080; document.body.classList.add("land"); }
    // оверлеи и плеер — общие для всех роликов
    $("#stage").insertAdjacentHTML("beforeend", '<div id="clock"></div><div id="cap"></div><div id="vign"></div><div id="flash"></div>');
    document.body.insertAdjacentHTML("beforeend", `<audio id="vtrack" src="voice.mp3" preload="auto"></audio>
      <div id="start"><b>▶ СМОТРЕТЬ</b><span>Включите звук · пробел — пауза · ←/→ — перемотка</span></div>
      <div id="ui"><button id="pp">❚❚</button><input id="seek" type="range" min="0" max="60" step="0.01" value="0"><span id="time">0:00</span><button id="vo">🔊 Голос: вкл</button><button id="fs">⛶</button></div>`);
    vtrack = $("#vtrack"); vtrack.addEventListener("error", () => { voiceFile = false; });
    let cur = null; // фразы для запасного голоса браузера
    CAPS.forEach(([t, s]) => { let plain = s.replace(/\{\w:([^}]*)\}/g, "$1").trim(); if (!plain) return;
      SPEAK.forEach(([a, b]) => { plain = plain.split(a).join(b); }); if (!cur) cur = { t, text: "" };
      cur.text += (cur.text ? " " : "") + plain; if (/[.!?:»—]$/.test(plain)) { VOICE.push(cur); cur = null; } });
    if (cur) VOICE.push(cur);
    if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }
    build(); fit(); render(0); addEventListener("resize", fit);
    const qs = new URLSearchParams(location.search);
    if (qs.has("capture")) document.body.classList.add("capture");
    $("#seek").max = VDUR; updUI(0);
    if (qs.has("t")) { pos = +qs.get("t"); frame(pos); }
    $("#start").onclick = () => { $("#start").style.display = "none"; play(); };
    $("#pp").onclick = () => (playing ? pause() : play());
    $("#seek").oninput = (e) => seek(+e.target.value);
    $("#vo").onclick = () => { voiceOn = !voiceOn; $("#vo").textContent = voiceOn ? "🔊 Голос: вкл" : "🔇 Голос: выкл"; vtrack.muted = !voiceOn; if (!voiceOn) stopVoice(); };
    $("#fs").onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen && document.documentElement.requestFullscreen());
    addEventListener("keydown", (e) => { if ($("#start").style.display !== "none") return;
      if (e.code === "Space") { e.preventDefault(); playing ? pause() : play(); }
      if (e.code === "ArrowRight") seek(now() + 5); if (e.code === "ArrowLeft") seek(now() - 5); });
    // хуки для экспорта (tools/export-mp4.js)
    window.__render = frame; window.__DUR = VDUR; window.__SIZE = [SW, SH];
    window.__renderAudio = async () => {
      const sr = 44100, oc = new OfflineAudioContext(2, Math.ceil(sr * VDUR), sr);
      const g = oc.createGain(); g.gain.value = 0.7; const comp = oc.createDynamicsCompressor(); g.connect(comp).connect(oc.destination);
      scheduleAudio(oc, g, 0);
      const buf = await oc.startRendering();
      const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length, ab = new ArrayBuffer(44 + n * 4), v = new DataView(ab);
      const ws = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
      ws(0, "RIFF"); v.setUint32(4, 36 + n * 4, true); ws(8, "WAVE"); ws(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
      v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); ws(36, "data"); v.setUint32(40, n * 4, true);
      for (let i = 0, o = 44; i < n; i++, o += 4) { v.setInt16(o, clamp(L[i], -1, 1) * 32767, true); v.setInt16(o + 2, clamp(R[i], -1, 1) * 32767, true); }
      let bin = ""; const u8 = new Uint8Array(ab); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      return btoa(bin);
    };
  },
};
