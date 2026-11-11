"use strict";
/* Общая графика канала «Если вдруг» (после survival/engine.js) */
const W = 1080, H = 1920, GR = 1150;
const space = () => `<rect width="${W}" height="${H}" fill="#140a33"/>${Array.from({ length: 90 }, (_, i) => `<circle cx="${(hash(i) * W).toFixed(0)}" cy="${(hash(i + 70) * H).toFixed(0)}" r="${(1 + 3 * hash(i + 9)).toFixed(1)}" fill="#fff" opacity="${(.3 + .6 * hash(i + 3)).toFixed(2)}"/>`).join("")}`;
// мультяшная Земля: материки смещаются (вращение), лицо поверх
const LANDS = `<path d="M-170 -60 Q-120 -140 -40 -120 Q0 -60 -60 -20 Q-120 10 -150 60 Q-200 20 -170 -60Z M40 -170 Q120 -160 160 -90 Q130 -40 80 -70 Q30 -100 40 -170Z M60 60 Q140 40 180 90 Q150 170 80 160 Q40 120 60 60Z M-80 110 Q-30 90 0 140 Q-40 190 -90 170Z" fill="#46c46a" stroke="#111" stroke-width="10"/>`;
function earth(id, r = 300) {
  return `<g id="${id}"><defs><clipPath id="${id}c"><circle r="215"/></clipPath></defs><g transform="scale(${r / 215})">
    <circle r="230" fill="#7fd0ff" opacity=".25"/><circle r="215" fill="#3aa0ff" stroke="#111" stroke-width="14"/>
    <g clip-path="url(#${id}c)"><g class="ld">${[-430, 0, 430].map((x) => `<g transform="translate(${x} 0)">${LANDS}</g>`).join("")}</g></g>
    <circle r="215" fill="none" stroke="#111" stroke-width="14"/>
    <g class="fc"><ellipse class="e1" cx="-70" cy="-10" rx="44" ry="56" fill="#fff" stroke="#111" stroke-width="10"/><ellipse class="e2" cx="70" cy="-10" rx="44" ry="56" fill="#fff" stroke="#111" stroke-width="10"/>
      <circle class="p1" cx="-62" cy="-2" r="18" fill="#111"/><circle class="p2" cx="78" cy="-2" r="18" fill="#111"/>
      <path class="mo" fill="#5a1a12" stroke="#111" stroke-width="10"/><path class="br" fill="none" stroke="#111" stroke-width="14" stroke-linecap="round"/></g></g></g>`;
}
function setEarth(id, spin, mood = "calm", t = 0) {
  const g = document.getElementById(id); g.querySelector(".ld").setAttribute("transform", `translate(${((spin % 430) + 430) % 430 - 215} 0)`);
  const mo = { calm: "M-40 80 Q0 110 40 80 Q0 100 -40 80Z", shock: "M-38 95 a38 46 0 1 0 76 0 a38 46 0 1 0 -76 0Z", dizzy: "M-50 100 Q-25 80 0 100 Q25 120 50 100" }[mood];
  g.querySelector(".mo").setAttribute("d", mo); g.querySelector(".mo").setAttribute("fill", mood === "dizzy" ? "none" : "#5a1a12");
  g.querySelector(".br").setAttribute("d", mood === "shock" ? "M-130 -110 Q-80 -150 -30 -110 M30 -110 Q80 -150 130 -110" : "M-120 -90 Q-80 -105 -40 -90 M40 -90 Q80 -105 120 -90");
  const dz = mood === "dizzy"; g.querySelectorAll(".p1,.p2").forEach((p, i) => p.setAttribute("transform", dz ? `rotate(${t * 400 * (i ? 1 : -1)} ${i ? 70 : -70} -10) translate(0 -18)` : ""));
}
// город: дома, деревья, машины (группы с id для разлёта)
const house = (x, w, h, c) => `<g><rect x="${x}" y="${GR - h}" width="${w}" height="${h}" fill="${c}" stroke="#111" stroke-width="7"/>${Array.from({ length: Math.floor(h / 90) }, (_, r) => [0, 1].map((k) => `<rect x="${x + 18 + k * (w / 2)}" y="${GR - h + 24 + r * 90}" width="${w / 2 - 36}" height="44" fill="#ffe27a" stroke="#111" stroke-width="5"/>`).join("")).join("")}</g>`;
const tree = (x, s = 1) => `<g transform="translate(${x} ${GR}) scale(${s})"><rect x="-14" y="-120" width="28" height="120" fill="#7a5232" stroke="#111" stroke-width="6"/><circle cy="-170" r="80" fill="#46c46a" stroke="#111" stroke-width="7"/></g>`;
const car = (x, c) => `<g transform="translate(${x} ${GR - 36})"><rect x="-90" y="-50" width="180" height="60" rx="18" fill="${c}" stroke="#111" stroke-width="6"/><path d="M-50 -50 L-30 -90 H40 L60 -50" fill="#bfe3f5" stroke="#111" stroke-width="6"/><circle cx="-50" cy="14" r="24" fill="#222"/><circle cx="50" cy="14" r="24" fill="#222"/></g>`;
let SKN = 0; const skyDay = () => { const id = "sky" + (++SKN); return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb6ff"/><stop offset="1" stop-color="#cfeaff"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>
  <rect y="${GR}" width="${W}" height="${H - GR}" fill="#8a8f99"/><rect y="${GR}" width="${W}" height="18" fill="#5d626b"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${i * 200 + 30}" y="${GR + 90}" width="110" height="16" fill="#fff"/>`).join("")}`; };
const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse rx="120" ry="50" fill="#fff"/><ellipse cx="-60" cy="-30" rx="60" ry="50" fill="#fff"/><ellipse cx="50" cy="-40" rx="70" ry="60" fill="#fff"/></g>`;
