"use strict";
/* Карандашный стиль (цветные карандаши на бумаге) + пиксельный путешественник. Подключается после survival/engine.js */
const W = 1080, H = 1920, INK = "#3a2a20";
const PDEFS = `<defs>
  <filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="4" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 .55  0 0 0 0 .5  0 0 0 0 .42  0 0 0 -1.4 .9" result="g"/><feComposite in="g" in2="SourceGraphic" operator="in"/></filter>
  <filter id="pencil" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="2" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="9" result="d"/><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="9" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.5 -.35" result="ga"/><feComposite in="d" in2="ga" operator="in"/></filter>
  <filter id="crayon" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="5" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="7" result="d"/><feTurbulence type="fractalNoise" baseFrequency=".5 .08" numOctaves="2" seed="7" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 3 -.45" result="ga"/><feComposite in="d" in2="ga" operator="in"/></filter>
  <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 7 H14" stroke="#3a2a1a" stroke-width="2.2" opacity=".45"/></pattern>
  <pattern id="hatchW" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><path d="M0 9 H18" stroke="#fff" stroke-width="2" opacity=".35"/></pattern>
</defs>`;
const fillP = (d, c, extra = "") => `<g filter="url(#crayon)"><path d="${d}" fill="${c}" ${extra}/></g>`;
const lineP = (d, w = 5, c = INK) => `<g filter="url(#pencil)"><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" transform="translate(3 -2)" fill="none" stroke="${c}" stroke-width="${w * .5}" opacity=".5" stroke-linecap="round"/></g>`;
const bothP = (d, c, w = 5, hatch = false) => fillP(d, c) + (hatch ? `<path d="${d}" fill="url(#hatch)" filter="url(#pencil)"/>` : "") + lineP(d, w);
const circ = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const px = (x, y, w, h) => `M${x} ${y} h${w} v${h} h${-w}Z`;
const paperOver = () => `<rect width="${W}" height="${H}" fill="#f3ead6" filter="url(#paper)" opacity=".18" style="mix-blend-mode:multiply" pointer-events="none"/><rect width="${W}" height="${H}" fill="none" stroke="#e8dcc0" stroke-width="40"/>`;
const sky = (top, bot, y = 1250) => { let s = ""; const n = 6; for (let i = 0; i < n; i++) { const k = i / (n - 1); const mix = (a, b) => Math.round(parseInt(a, 16) + (parseInt(b, 16) - parseInt(a, 16)) * k).toString(16).padStart(2, "0");
  const c = "#" + mix(top.slice(1, 3), bot.slice(1, 3)) + mix(top.slice(3, 5), bot.slice(3, 5)) + mix(top.slice(5, 7), bot.slice(5, 7)); s += fillP(px(-20, (y / n) * i - 10, W + 40, y / n + 30), c); } return s; };

// ---------- пиксельный путешественник: ноги в (0,0) ----------
function hero(id, o = {}) {
  const c = o.color || "#d97757";
  const leg = (x) => `<g class="lg">${bothP(px(x, -70, 30, 72), c, 5)}</g>`;
  return `<g id="${id}"><g class="bd">
    ${leg(-110)}${leg(-50)}${leg(20)}${leg(80)}
    ${o.pack ? bothP("M-150 -270 h70 v170 h-70Z", "#6a8a4a", 5, true) : ""}
    ${bothP(px(-130, -280, 260, 210), c, 6, true)}
    <g class="al">${bothP(px(-160, -200, 32, 60), c, 5)}</g><g class="ar">${bothP(px(128, -200, 32, 60), c, 5)}</g>
    <g class="ey">${bothP(px(-70, -250, 26, 52), "#2a1a14", 4)}${bothP(px(44, -250, 26, 52), "#2a1a14", 4)}</g>
    <g class="hp" opacity="0">${lineP("M-72 -222 l13 -16 l13 16", 7)}${lineP("M42 -222 l13 -16 l13 16", 7)}</g>
    ${o.hat ? o.hat : ""}</g></g>`;
}
// поза: t — время, walk — ходьба 0..1, wave — махать правой рукой, happy — глаза-дуги, blink — моргание
function setHero(id, x, y, s, p = {}, t = 0) {
  const g = document.getElementById(id); g.setAttribute("transform", `translate(${x} ${y}) scale(${s})`);
  const w = p.walk || 0;
  g.querySelectorAll(".lg").forEach((l, i) => l.setAttribute("transform", `translate(0 ${-Math.max(0, Math.sin(t * 12 + i * Math.PI / 2)) * 16 * w})`));
  g.querySelector(".bd").setAttribute("transform", `translate(0 ${-Math.abs(Math.sin(t * 12)) * 8 * w + (p.bob || 0) * Math.sin(t * 3) * 6})`);
  g.querySelector(".ar").setAttribute("transform", p.wave ? `rotate(${-140 + 25 * Math.sin(t * 10)} 144 -200)` : p.armUp ? "rotate(-150 144 -200)" : "");
  g.querySelector(".al").setAttribute("transform", p.armUpL ? "rotate(150 -144 -200)" : "");
  const bl = p.blink !== false && (t % 3.2) < .12; g.querySelector(".ey").setAttribute("opacity", p.happy ? 0 : 1);
  g.querySelector(".ey").setAttribute("transform", bl ? "translate(0 -225) scale(1 .15) translate(0 225)" : "");
  g.querySelector(".hp").setAttribute("opacity", p.happy ? 1 : 0);
}
// мягкий музыкальный фон: «музыкальная шкатулка» по пентатонике
function lullaby(sfx, add, dur, seed = 1, bpm = 84) {
  const beat = 60 / bpm, scale = [262, 294, 330, 392, 440, 523, 587, 659], chords = [[131, 196], [110, 165], [147, 220], [98, 147]];
  for (let k = 0; k * beat < dur - .5; k++) {
    const t = k * beat; if (k % 4 === 0) chords[(k / 4) % 4].forEach((f) => add(t, (a) => sfx.osc("sine", f, a, .3, .05, beat * 4)));
    if (hash(k * 7 + seed) > .25) { const f = scale[Math.floor(hash(k * 3 + seed) * scale.length)]; add(t, (a) => sfx.osc("triangle", f, a, .01, .07, beat * 1.6)); add(t + .002, (a) => sfx.osc("sine", f * 2, a, .01, .02, beat)); }
  }
}
const PCSS = `#cap{top:auto;bottom:150px;min-height:0;font:700 74px/1.1 Caveat,cursive;text-transform:none;letter-spacing:0;color:#3a2a20;
  text-shadow:0 0 18px #fff8e6,0 0 6px #fff8e6,0 0 2px #fff8e6} #cap .w{margin:0 .1em} #vign{display:none}
.card{position:absolute;left:0;right:0;margin:auto;top:240px;width:max-content;padding:20px 50px;background:#fffaf0;border:5px solid #3a2a20;border-radius:8px;transform:rotate(-2deg);
  font:700 96px Caveat,cursive;color:#3a2a20;z-index:6;box-shadow:6px 8px 0 rgba(58,42,32,.25)}`;
document.head.insertAdjacentHTML("beforeend", `<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap" rel="stylesheet"><style>${PCSS}</style>`);
