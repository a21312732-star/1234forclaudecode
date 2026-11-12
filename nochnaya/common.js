"use strict";
/* «Ночная смена»: горизонтальные (1920×1080) сцены для длинных историй. Подключается после survival/engine.js */
const W = 1920, H = 1080, OL = "#0e0f14";
const DEFS = `<defs>
  <radialGradient id="gL" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2c8" stop-opacity=".9"/><stop offset=".35" stop-color="#ffe2a0" stop-opacity=".35"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient>
  <radialGradient id="gV" cx=".5" cy=".5" r=".75"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
  <linearGradient id="gFog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8090a8" stop-opacity="0"/><stop offset=".7" stop-color="#8090a8" stop-opacity=".35"/><stop offset="1" stop-color="#8090a8" stop-opacity=".1"/></linearGradient>
  <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03050c"/><stop offset="1" stop-color="#18223a"/></linearGradient>
  <linearGradient id="gWarm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf7a"/><stop offset="1" stop-color="#e8943a"/></linearGradient>
  <filter id="fB"><feGaussianBlur stdDeviation="6"/></filter><filter id="fSep"><feColorMatrix type="matrix" values=".5 .45 .2 0 .08  .4 .4 .18 0 .05  .3 .3 .15 0 0  0 0 0 1 0"/></filter>
</defs>`;
const vig = `<rect width="${W}" height="${H}" fill="url(#gV)"/>`;
const rain = (id) => `<g id="${id}" stroke="#b8c8e0" stroke-width="2" opacity=".35"></g>`;
const setRain = (id, t, n = 70) => { const g = document.getElementById(id); if (!g) return; let s = "";
  for (let i = 0; i < n; i++) { const x = (hash(i) * W + t * 60) % W, y = (hash(i + 99) * H + t * (700 + 300 * hash(i + 7))) % H; s += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l-6 26"/>`; } g.innerHTML = s; };
const pine = (x, y, h, c = "#05070c") => `<path d="M${x} ${y - h} L${x - h * .26} ${y - h * .45} L${x - h * .13} ${y - h * .45} L${x - h * .34} ${y} L${x + h * .34} ${y} L${x + h * .13} ${y - h * .45} L${x + h * .26} ${y - h * .45} Z" fill="${c}"/>`;
const forest = (y, c = "#05070c", seed = 0) => Array.from({ length: 24 }, (_, i) => pine(i * 90 - 40 + 30 * hash(i + seed), y, 220 + 160 * hash(i + seed + 50), c)).join("");

// ---------- вагон электрички изнутри (вид вдоль борта) ----------
function carriage(id, o = {}) {
  const lit = o.lit !== false;
  let s = `<rect width="${W}" height="${H}" fill="${lit ? "#cbbf98" : "#3a3a34"}"/><rect y="760" width="${W}" height="320" fill="${lit ? "#6a5a48" : "#2a241e"}"/>`;
  for (let i = 0; i < 4; i++) { const x = 120 + i * 460;
    s += `<rect x="${x}" y="220" width="320" height="300" rx="24" fill="${o.bright ? "#9fc4e0" : "#020306"}" stroke="${OL}" stroke-width="10"/><rect x="${x}" y="220" width="320" height="300" rx="24" fill="#fff" opacity=".05"/>`;
    if (o.bright) s += `<path d="M${x + 20} 500 l80 -60 l60 40 l90 -80 l70 100" stroke="#4a6a8a" stroke-width="12" fill="none"/>`;
    s += `<g><rect x="${x - 40}" y="600" width="400" height="34" rx="10" fill="#8a5a32" stroke="${OL}" stroke-width="6"/><rect x="${x - 40}" y="560" width="400" height="44" rx="10" fill="#7a4a2a" stroke="${OL}" stroke-width="6"/><rect x="${x - 20}" y="634" width="20" height="130" fill="#333"/><rect x="${x + 320}" y="634" width="20" height="130" fill="#333"/></g>`; }
  s += `<rect y="0" width="${W}" height="120" fill="${lit ? "#e6dcc0" : "#4a4a40"}"/>`;
  for (let i = 0; i < 6; i++) s += `<g class="lp" data-i="${i}"><rect x="${100 + i * 330}" y="110" width="200" height="26" rx="10" fill="#fff6c8" stroke="${OL}" stroke-width="5"/><ellipse class="gl" cx="${200 + i * 330}" cy="160" rx="260" ry="160" fill="url(#gL)" opacity="${lit ? .5 : .15}"/></g>`;
  return `<g id="${id}">${s}<rect id="${id}D" width="${W}" height="${H}" fill="#000" opacity="0"/></g>`;
}
const setLamps = (id, f) => document.querySelectorAll(`#${id} .lp`).forEach((l) => l.setAttribute("opacity", f(+l.dataset.i)));
// клетчатая сумка
const bag = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-60 -60 Q0 -110 60 -60" fill="none" stroke="#3a2a1a" stroke-width="8"/><rect x="-80" y="-60" width="160" height="110" rx="12" fill="#a83a3a" stroke="${OL}" stroke-width="6"/>${[-40, 0, 40].map((x) => `<path d="M${x} -60 V50" stroke="#e8d8c0" stroke-width="6" opacity=".6"/>`).join("")}${[-30, 10].map((y) => `<path d="M-80 ${y} H80" stroke="#e8d8c0" stroke-width="6" opacity=".6"/>`).join("")}</g>`;

// ---------- электричка снаружи ----------
function trainOut(id, o = {}) {
  const win = o.dark ? "#05070c" : "#ffd27a", body = o.body || "#3a6a4a";
  let s = "";
  for (let c = 0; c < 4; c++) { const x = c * 760;
    s += `<rect x="${x}" y="0" width="740" height="300" rx="30" fill="${body}" stroke="${OL}" stroke-width="10"/><rect x="${x}" y="230" width="740" height="26" fill="#c84a2a"/>`;
    for (let k = 0; k < 6; k++) s += `<rect class="w" x="${x + 40 + k * 112}" y="50" width="86" height="110" rx="12" fill="${win}" stroke="${OL}" stroke-width="6"/>`; }
  return `<g id="${id}">${s}</g>`;
}
const rails = (y, x1 = W, end = null) => `<g><rect x="0" y="${y}" width="${end ?? x1}" height="16" fill="#555"/><rect x="0" y="${y + 40}" width="${end ?? x1}" height="16" fill="#555"/>${Array.from({ length: 40 }, (_, i) => i * 60 < (end ?? x1) ? `<rect x="${i * 60}" y="${y - 6}" width="22" height="70" fill="#3a2a1a"/>` : "").join("")}</g>`;

// ---------- платформа «Тихая» ----------
function platform(id, o = {}) {
  return `<g id="${id}"><rect width="${W}" height="${H}" fill="url(#gSky)"/>${forest(700, "#070a12", 3)}${forest(760, "#04060a", 9)}
    <rect y="760" width="${W}" height="320" fill="#0c0e14"/>${rails(800, W, o.railEnd)}
    <path d="M0 860 H${W} V1080 H0Z" fill="#3a3a40"/><path d="M0 860 H${W}" stroke="#d9c25a" stroke-width="8" stroke-dasharray="40 30"/>
    ${Array.from({ length: 10 }, (_, i) => `<path d="M${i * 200 + 50} 900 l40 60 l-20 40" stroke="#26262c" stroke-width="5" fill="none"/>`).join("")}
    <g transform="translate(${o.lampX || 960} 860)"><rect x="-8" y="-520" width="16" height="520" fill="#2a2a2a"/><path d="M0 -520 h60 v20" stroke="#2a2a2a" stroke-width="10" fill="none"/><rect x="40" y="-506" width="40" height="22" rx="6" fill="#fff6c8"/><ellipse class="gl" cx="60" cy="-300" rx="420" ry="420" fill="url(#gL)" opacity=".55"/></g>
    ${o.sign !== false ? `<g transform="translate(${o.signX || 1450} 860)"><rect x="-6" y="-300" width="12" height="300" fill="#2a2a2a"/><rect x="-170" y="-360" width="340" height="90" fill="#e8e2cc" stroke="${OL}" stroke-width="8"/><text y="-298" font-size="64" text-anchor="middle" fill="#1a2a5a" font-family="Montserrat" font-weight="900">Т И Х А Я</text></g>` : ""}
    ${o.bench ? `<g transform="translate(${o.benchX || 760} 900)"><rect x="-150" y="-60" width="300" height="20" fill="#5a3a22" stroke="${OL}" stroke-width="5"/><rect x="-150" y="-110" width="300" height="20" fill="#5a3a22" stroke="${OL}" stroke-width="5"/><rect x="-130" y="-40" width="14" height="70" fill="#222"/><rect x="116" y="-40" width="14" height="70" fill="#222"/></g>` : ""}
    <rect y="600" width="${W}" height="480" fill="url(#gFog)"/></g>`;
}
// ---------- деревянный вокзал ----------
const stationHouse = (id) => `<g id="${id}"><rect x="620" y="420" width="680" height="440" fill="#2e4a3a" stroke="${OL}" stroke-width="10"/>${Array.from({ length: 14 }, (_, i) => `<path d="M620 ${450 + i * 30} H1300" stroke="#263e30" stroke-width="5"/>`).join("")}
  <path d="M580 430 L960 250 L1340 430Z" fill="#3a2a22" stroke="${OL}" stroke-width="10"/><rect x="900" y="640" width="120" height="220" fill="#2a1a12" stroke="${OL}" stroke-width="8"/>
  <rect x="680" y="560" width="160" height="150" fill="#ffd27a" stroke="${OL}" stroke-width="8"/><rect x="1080" y="560" width="160" height="150" fill="#0a0c10" stroke="${OL}" stroke-width="8"/><path d="M760 560 V710 M680 635 H840 M1160 560 V710 M1080 635 H1240" stroke="${OL}" stroke-width="6"/>
  <ellipse cx="760" cy="640" rx="260" ry="200" fill="url(#gL)" opacity=".35"/><rect x="1040" y="740" width="70" height="90" fill="#d8d0b8" stroke="${OL}" stroke-width="5"/></g>`;
// ---------- зал ожидания ----------
const hall = (id) => `<g id="${id}"><rect width="${W}" height="${H}" fill="#3a2e22"/>${Array.from({ length: 30 }, (_, i) => `<path d="M${i * 66} 0 V780" stroke="#33281e" stroke-width="6"/>`).join("")}<rect y="780" width="${W}" height="300" fill="#2a1e14"/>
  <g transform="translate(960 230)"><circle r="90" fill="#e8e2cc" stroke="${OL}" stroke-width="10"/><path d="M0 0 V-62 M0 0 L48 22" stroke="${OL}" stroke-width="10" stroke-linecap="round"/></g>
  ${[180, 1350].map((x) => `<g transform="translate(${x} 800)"><rect x="0" y="-80" width="380" height="24" fill="#6a4a2a" stroke="${OL}" stroke-width="5"/><rect x="0" y="-150" width="380" height="24" fill="#6a4a2a" stroke="${OL}" stroke-width="5"/><rect x="20" y="-56" width="16" height="70" fill="#222"/><rect x="344" y="-56" width="16" height="70" fill="#222"/></g>`).join("")}
  <g id="${id}K" transform="translate(960 560)"><rect x="-230" y="-220" width="460" height="300" fill="#4a3a28" stroke="${OL}" stroke-width="10"/><rect x="-170" y="-180" width="340" height="200" fill="#1a1a14" stroke="${OL}" stroke-width="6"/><rect x="-170" y="-180" width="340" height="200" fill="#e8dcc0" opacity=".08"/>
    <g class="fig"><path d="M-80 20 Q-90 -100 0 -120 Q90 -100 80 20Z" fill="#050505"/><ellipse cx="0" cy="-130" rx="56" ry="64" fill="#050505"/></g>
    <g class="mit"><rect x="-90" y="-10" width="60" height="40" rx="16" fill="#8a3a4a" stroke="${OL}" stroke-width="4"/><rect x="30" y="-10" width="60" height="40" rx="16" fill="#8a3a4a" stroke="${OL}" stroke-width="4"/></g>
    <rect x="-60" y="20" width="120" height="16" fill="#2a2018"/><text y="-200" font-size="34" text-anchor="middle" fill="#d9c25a" font-family="Montserrat" font-weight="900">КАССА</text></g>
  <ellipse cx="960" cy="420" rx="420" ry="260" fill="url(#gL)" opacity=".3"/></g>`;
// ---------- лист бумаги (расписание, правила, газета, билет) ----------
const paper = (lines, o = {}) => `<g><rect x="-460" y="-360" width="920" height="720" fill="#000" opacity=".4" transform="translate(16 20)"/><rect x="-460" y="-360" width="920" height="720" fill="${o.bg || "#e8dcbc"}" stroke="${OL}" stroke-width="6"/>
  ${lines.map((l, i) => `<text class="ln" x="-400" y="${-260 + i * 74}" font-family="${l.hand ? "Caveat" : "JetBrains Mono"}" font-weight="700" font-size="${l.size || 40}" fill="${l.c || "#1f2a44"}" ${l.strike ? 'text-decoration="line-through"' : ""}>${l.t}</text>${l.strike ? `<path d="M-400 ${-272 + i * 74} H${-400 + l.t.length * 24}" stroke="#1f2a44" stroke-width="4"/>` : ""}`).join("")}</g>`;
// ---------- поезд с огнями / без огней сбоку, на платформе ----------
const faceless = (x, y) => `<g transform="translate(${x} ${y})"><ellipse rx="26" ry="32" fill="#8a8a8a"/><path d="M-30 60 Q0 20 30 60" fill="#6a6a6a"/></g>`;
// ---------- кухня бабушки (воспоминание) ----------
const kitchen = (id) => `<g id="${id}"><rect width="${W}" height="${H}" fill="#f2d8a8"/><rect y="760" width="${W}" height="320" fill="#b8865a"/>
  <rect x="1180" y="180" width="520" height="380" fill="#bfe3f5" stroke="#7a5a3a" stroke-width="16"/><path d="M1180 180 Q1300 360 1180 560 M1700 180 Q1580 360 1700 560" fill="#4a9a5a" stroke="#2e6a3a" stroke-width="4"/>
  <rect x="200" y="520" width="520" height="240" fill="#e8e2cc" stroke="#7a5a3a" stroke-width="10"/><rect x="230" y="470" width="460" height="50" fill="#555"/><circle cx="350" cy="495" r="34" fill="#333"/><circle cx="560" cy="495" r="34" fill="#333"/>
  <ellipse cx="350" cy="470" rx="70" ry="16" fill="#e8b860" stroke="#7a5a3a" stroke-width="4"/>
  <rect x="800" y="620" width="560" height="30" fill="#f4f1e6" stroke="#7a5a3a" stroke-width="6"/>${Array.from({ length: 8 }, (_, i) => `<circle cx="${840 + i * 66}" cy="635" r="9" fill="#c8242f"/>`).join("")}<rect x="830" y="650" width="20" height="110" fill="#7a5a3a"/><rect x="1310" y="650" width="20" height="110" fill="#7a5a3a"/>
  <g transform="translate(1060 610)"><ellipse rx="90" ry="20" fill="#fff" stroke="#7a5a3a" stroke-width="4"/>${[0, 1, 2, 3].map((i) => `<ellipse cy="${-8 - i * 10}" rx="${70 - i * 4}" ry="12" fill="#e8b860" stroke="#a8743a" stroke-width="3"/>`).join("")}</g>
  <g id="${id}S">${[0, 1, 2].map((i) => `<path class="st" d="M${330 + i * 30} 440 q-20 -40 0 -80 q20 -40 0 -80" stroke="#fff" stroke-width="8" fill="none" opacity=".5"/>`).join("")}</g></g>`;
