"use strict";
/* Общая рисовка канала ностальгии: спальня, календарь-машина времени, подросток, реквизит эпох.
   Без логотипов, настоящих людей и персонажей игр — только узнаваемые вещи. Подключается после survival/engine.js. */
const W = 1080, H = 1920, FL = 1150;
const TEEN = { coat: "#7b5cff", coat2: "#5a3fd6", hair: "#2a1a10", pants: "#2d3a4f" };
const FRIEND = { coat: "#ff8a3d", coat2: "#c75f15", hair: "#6b3e1f", pants: "#3b3f58" };
const FRIEND2 = { coat: "#3ecf8e", coat2: "#1f9a62", hair: "#1a1a1a", pants: "#2d3a4f" };

// элементы-плашки: [сцена, id, класс, x|"c", y, содержимое, появление, исчезновение, наклон, стиль]
function buildE(E) {
  E.forEach(([s, id, k, x, y, c, a, o, r, st]) => {
    let html = "", style = (x === "c" ? "left:0;right:0;margin:auto;width:max-content;" : k === "opt" ? "" : `left:${x}px;`) + `top:${y}px;` + (st || "");
    if (k.startsWith("tile")) html = `<span class="em">${c[0]}</span><b>${c[1]}</b>`;
    else if (k === "opt") html = `<span class="em">${c[0]}</span>${c[1]}<span class="k">${c[2]}</span>`;
    else html = c.replace(/(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)/gu, '<span class="em">$1</span>');
    document.getElementById(s).insertAdjacentHTML("beforeend", `<div class="${k} el" id="${id}" style="${style}">${html}</div>`);
  });
}
const makeElUpd = (E) => { const sb = {}; E.forEach((e) => (sb[e[0]] = sb[e[0]] || []).push(e));
  return (sid, t) => (sb[sid] || []).forEach(([, id, , , , , a, o, r]) => { const el = document.getElementById(id); pop(el, t, a, r || 0); if (t < a) el.style.opacity = 0; if (o && o !== 99) hide(el, t, o); }); };
const P = (id, x, y, s, pose, r = 0, o = 1) => { at(id, x, y, s, o, r); setPose(id, pose); };
const hip = (s, fl = FL) => fl - 88 * s;

// спальня: окно (ночь/утро), кровать, стол, гирлянда, постеры без надписей
function bedroom(p) {
  let stars = ""; for (let i = 0; i < 10; i++) stars += `<circle cx="${110 + 200 * hash(i)}" cy="${400 + 260 * hash(i + 3)}" r="3" fill="#fff"/>`;
  let lights = ""; for (let i = 0; i < 14; i++) lights += `<circle class="${p}gl" cx="${60 + i * 72}" cy="${290 + 18 * Math.sin(i)}" r="12" fill="${["#ff5a8a", "#ffd23f", "#5cc8ff", "#4dff8a"][i % 4]}"/>`;
  return `<defs><linearGradient id="${p}wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2f5e"/><stop offset="1" stop-color="#4f437a"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#${p}wall)"/><path d="M0 290 Q540 340 1080 290" stroke="#222" stroke-width="3" fill="none"/>${lights}
    <rect x="70" y="360" width="280" height="380" fill="#0d1530" stroke="#d9c7a0" stroke-width="14"/><rect id="${p}sky" x="77" y="367" width="266" height="366" fill="#ffd9a0" opacity="0"/>${stars}
    <path d="M210 360 V740 M70 550 H350" stroke="#d9c7a0" stroke-width="10"/>
    <rect x="430" y="400" width="170" height="230" rx="8" fill="#ff8a3d" transform="rotate(-4 515 515)"/><circle cx="515" cy="490" r="50" fill="#ffd23f" transform="rotate(-4 515 515)"/>
    <rect x="640" y="380" width="150" height="200" rx="8" fill="#5cc8ff" transform="rotate(5 715 480)"/><path d="M660 540 L715 430 L770 540Z" fill="#3a2f5e" transform="rotate(5 715 480)"/>
    <rect y="${FL}" width="${W}" height="${H - FL}" fill="#6a4a3a"/>${Array.from({ length: 8 }, (_, i) => `<path d="M0 ${FL + 40 + i * 80} H${W}" stroke="#5a3a2a" stroke-width="5"/>`).join("")}
    <g><rect x="60" y="${FL - 170}" width="620" height="120" rx="20" fill="#5a4a8a" stroke="#2a2050" stroke-width="8"/><rect x="70" y="${FL - 210}" width="600" height="70" rx="26" fill="#e9e4f2"/>
      <rect x="80" y="${FL - 250}" width="150" height="66" rx="28" fill="#fff" stroke="#bbb" stroke-width="4"/><rect x="60" y="${FL - 240}" width="26" height="240" fill="#4a3a6a"/></g>
    <g><rect x="760" y="${FL - 300}" width="300" height="24" fill="#8a6a4a"/><rect x="780" y="${FL - 276}" width="20" height="276" fill="#6a4a2a"/><rect x="1020" y="${FL - 276}" width="20" height="276" fill="#6a4a2a"/></g>
    <rect id="${p}dark" width="${W}" height="${H}" fill="#06040f" opacity="0"/>`;
}
const blanket = (id) => `<path id="${id}" d="M250 ${FL - 220} H675 V${FL - 140} H250Z" fill="#ff5a8a" stroke="#a02a4a" stroke-width="6"/>`;
// спит / просыпается: open 0 — спит (глаза закрыты), 1 — сел на кровати
function sleeper(id, t, open, x = 360) {
  const up = easeInOut(open);
  P(id, lerp(x - 40, x, up), lerp(FL - 225, FL - 260, up), 1.15, { la: 20, ra: 20 + 120 * up * (t > 2 ? 1 : 0), face: up > .5 ? "shock" : "calm", blink: up < .3, look: up > .5 ? 1 : 0 }, lerp(-90, -8, up));
}
// календарь-«машина времени»: годы листаются от 2026 к нужному
function calendar(id) {
  return `<g id="${id}"><rect x="-230" y="-200" width="460" height="400" rx="26" fill="#fff" stroke="#000" stroke-width="10"/><rect x="-230" y="-200" width="460" height="110" rx="26" fill="#ff3b47"/>
    <rect x="-230" y="-120" width="460" height="30" fill="#ff3b47"/>${[-140, -50, 50, 140].map((x) => `<rect x="${x - 10}" y="-230" width="20" height="60" rx="10" fill="#333"/>`).join("")}
    <text y="-118" font-size="56" text-anchor="middle" fill="#fff" font-family="Montserrat">ЯНВАРЬ</text>
    <text class="yr" y="110" font-size="180" text-anchor="middle" fill="#111" font-family="Montserrat">2026</text>
    <path class="pg" d="M-230 -90 H230 V200 H-230Z" fill="#f2f2f2" opacity="0"/></g>`;
}
function updCalendar(id, t, a, b, target) {
  const k = prog(t, a, b), y = Math.round(lerp(2026, target, easeOut(k))), g = document.getElementById(id);
  g.querySelector(".yr").textContent = y; g.querySelector(".yr").setAttribute("fill", k >= 1 ? "#ff3b47" : "#111");
  const flip = k > 0 && k < 1 ? ((t - a) * 9) % 1 : 1; g.querySelector(".pg").setAttribute("opacity", k > 0 && k < 1 ? 1 - flip : 0);
}
// реквизит
const popit = (id, s = 1) => `<g id="${id}"><rect x="-200" y="-200" width="400" height="400" rx="50" fill="#fff" stroke="#000" stroke-width="8"/>
  ${Array.from({ length: 25 }, (_, i) => { const r = Math.floor(i / 5), c = i % 5; return `<circle class="pb" data-i="${i}" cx="${-160 + c * 80}" cy="${-160 + r * 80}" r="32" fill="${["#ff4d4d", "#ff9a3d", "#ffd23f", "#4dd16a", "#4d9aff"][r]}" stroke="#000" stroke-width="4"/>`; }).join("")}</g>`;
function updPopit(id, t, speed = 3, seed = 0) { $$(`#${id} .pb`).forEach((b, i) => { const pressed = ((t * speed + hash(i + seed) * 5) % 2) > 1; b.setAttribute("r", pressed ? 24 : 32); b.setAttribute("opacity", pressed ? .6 : 1); }); }
const dimple = (id) => `<g id="${id}"><rect x="-130" y="-60" width="260" height="120" rx="60" fill="#9b6bff" stroke="#000" stroke-width="7"/><circle cx="-50" r="34" fill="#ffd23f" stroke="#000" stroke-width="5"/><circle cx="50" r="34" fill="#4dd16a" stroke="#000" stroke-width="5"/>
  <circle cx="0" cy="-90" r="14" fill="#fff" stroke="#000" stroke-width="4"/><path d="M0 -76 V-60" stroke="#000" stroke-width="5"/></g>`;
const crown = (id) => `<path id="${id}" d="M-70 30 L-80 -40 L-40 -5 L0 -60 L40 -5 L80 -40 L70 30Z" fill="#ffd23f" stroke="#000" stroke-width="7"/>`;
const phone = (id, inner = "") => `<g id="${id}"><rect x="-210" y="-400" width="420" height="800" rx="56" fill="#111" stroke="#333" stroke-width="10"/><rect x="-185" y="-360" width="370" height="720" rx="30" fill="#1a1a2e"/>${inner}</g>`;
const laptop = (id, inner = "") => `<g id="${id}"><rect x="-330" y="-230" width="660" height="420" rx="20" fill="#222" stroke="#444" stroke-width="8"/><rect x="-305" y="-205" width="610" height="370" fill="#10101c"/>${inner}
  <path d="M-380 190 H380 L340 230 H-340Z" fill="#555"/></g>`;
const chat = (id, n = 8) => `<g id="${id}">${Array.from({ length: n }, (_, i) => `<g class="cm"><rect x="0" y="-20" width="${150 + 120 * hash(i)}" height="34" rx="10" fill="${["#ff5a8a", "#5cc8ff", "#ffd23f", "#4dff8a"][i % 4]}" opacity=".85"/></g>`).join("")}</g>`;
function updChat(id, t, x, y0, y1) { $$(`#${id} .cm`).forEach((c, i) => { const k = ((t * .9 + i / 8) % 1); c.setAttribute("transform", `translate(${x} ${lerp(y1, y0, k)})`); c.setAttribute("opacity", k < .1 ? k * 10 : 1); }); }
const traffic = (id) => `<g id="${id}"><rect x="-90" y="-260" width="180" height="420" rx="40" fill="#222" stroke="#000" stroke-width="8"/><rect x="-14" y="160" width="28" height="300" fill="#444"/>
  <circle class="rd" cy="-150" r="62" fill="#ff2a2a"/><circle class="gr" cy="40" r="62" fill="#2aff6a"/></g>`;
const spinner = (id) => `<g id="${id}"><g class="sp">${[0, 120, 240].map((a) => `<g transform="rotate(${a})"><rect x="-26" y="-150" width="52" height="150" rx="26" fill="#4d9aff" stroke="#000" stroke-width="6"/><circle cy="-120" r="40" fill="#ddd" stroke="#000" stroke-width="6"/></g>`).join("")}
  <circle r="48" fill="#ddd" stroke="#000" stroke-width="6"/><circle r="22" fill="#4d9aff"/></g><circle class="glow" r="190" fill="none" stroke="#5cf0ff" stroke-width="22" opacity="0" style="filter:drop-shadow(0 0 30px #5cf0ff)"/></g>`;
const slime = (id) => `<path id="${id}" fill="#4dff8a" stroke="#1a8a3a" stroke-width="7" opacity=".9"/>`;
function updSlime(id, t, cx, cy, stretch = 0, r0 = 110) { let d = ""; const n = 14; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, r = r0 + r0 * .13 * Math.sin(a * 3 + t * 3) + (Math.abs(Math.sin(a)) > .9 ? stretch : 0);
  d += (i ? " L" : "M") + `${cx + Math.cos(a) * r * (1 + stretch / 400)} ${cy + Math.sin(a) * r * .7}`; } $("#" + id).setAttribute("d", d + "Z"); }
// кубический (воксельный) домик — без узнаваемых персонажей
function voxelHouse(id) {
  let s = ""; const B = 70; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) s += `<rect class="vx" data-k="${r * 6 + c}" x="${-210 + c * B}" y="${-r * B - B}" width="${B}" height="${B}" fill="${r === 3 ? "#7a4a2a" : (r + c) % 2 ? "#a0703a" : "#8a6030"}" stroke="#3a2010" stroke-width="5"/>`;
  s += `<rect x="-35" y="-140" width="70" height="140" fill="#3a2010"/><rect x="${-210 + 4 * B}" y="${-2 * B - B}" width="${B}" height="${B}" fill="#9fd0ef" stroke="#3a2010" stroke-width="5"/>`;
  return `<g id="${id}">${s}</g>`;
}
const notes = (id, n = 6) => `<g id="${id}">${Array.from({ length: n }, () => `<text font-size="90" fill="#ffd23f" stroke="#000" stroke-width="4" paint-order="stroke">♪</text>`).join("")}</g>`;
function updNotes(id, t, x, y) { $$(`#${id} text`).forEach((n, i) => { const k = ((t * .6 + i / 6) % 1); n.setAttribute("x", x + 80 * Math.sin(t * 2 + i) + (i % 3 - 1) * 90); n.setAttribute("y", y - 420 * k); n.setAttribute("opacity", 1 - k); }); }
// закрывает глаза → темнота (петля к первому кадру)
function closeEyes(sceneT, t, a, b) { return { k: prog(t, a, b) }; }
