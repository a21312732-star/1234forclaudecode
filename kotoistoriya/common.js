"use strict";
/* «Котоистория»: коты-персонажи (совместимы с setPose движка) и общие детали. Подключается после survival/engine.js */
const W = 1080, H = 1920, OL = "#1a1410";
// шапки и костюмы
const HATS = {
  slouch: (c = "#7a6a4a") => `<path d="M-62 -20 Q-60 -34 -30 -36 Q-26 -70 0 -72 Q26 -70 30 -36 Q60 -34 62 -12 Q30 -26 0 -26 Q-40 -26 -62 -20Z" fill="${c}" stroke="${OL}" stroke-width="4"/><rect x="-30" y="-44" width="60" height="8" fill="#3a2a1a"/>`,
  turban: (c = "#f4f1e6") => `<path d="M-42 -14 Q-50 -64 0 -70 Q50 -64 42 -14 Q20 -30 0 -28 Q-20 -30 -42 -14Z" fill="${c}" stroke="${OL}" stroke-width="4"/><path d="M-36 -40 Q0 -56 36 -40" stroke="#d8d2c0" stroke-width="5" fill="none"/><circle cy="-52" r="8" fill="#c8242f"/>`,
  crown: (c = "#ffd23f") => `<path d="M-30 -30 L-34 -66 L-16 -48 L0 -72 L16 -48 L34 -66 L30 -30Z" fill="${c}" stroke="${OL}" stroke-width="4"/><circle cy="-44" r="5" fill="#c8242f"/>`,
  helmet: (c = "#9aa3ad") => `<path d="M-42 -10 Q-46 -66 0 -68 Q46 -66 42 -10 Z" fill="${c}" stroke="${OL}" stroke-width="4"/><path d="M0 -68 V-84" stroke="#c8242f" stroke-width="10" stroke-linecap="round"/>`,
  bicorne: (c = "#1a1a24") => `<path d="M-70 -20 Q0 -90 70 -20 Q0 -40 -70 -20Z" fill="${c}" stroke="${OL}" stroke-width="4"/><circle cx="0" cy="-44" r="8" fill="#c8242f"/>`,
  cap: (c = "#2b4a7a") => `<path d="M-36 -18 Q-36 -56 0 -56 Q36 -56 36 -18 Z" fill="${c}" stroke="${OL}" stroke-width="4"/><path d="M-36 -18 L-62 -14" stroke="${c}" stroke-width="8" stroke-linecap="round"/>`,
};
// кот: тело как у person(), голова кошачья; хвост .tl
function cat(id, o = {}) {
  const fur = o.fur || "#e8a14a", fur2 = o.fur2 || "#c27a2a", c = o.coat || "#4a6a3a", c2 = o.coat2 || "#2e4a24", p = o.pants || c2, belly = o.belly || "#f6e2c4";
  const leg = (cls, x) => `<g class="${cls}" transform="translate(${x} 0)"><rect x="-12" y="-4" width="24" height="82" rx="11" fill="${p}" stroke="${OL}" stroke-width="3"/><ellipse cx="2" cy="80" rx="17" ry="10" fill="${fur}" stroke="${OL}" stroke-width="3"/></g>`;
  const arm = (cls, x) => `<g class="${cls}" transform="translate(${x} -84)"><rect x="-11" y="-6" width="22" height="72" rx="11" fill="${c}" stroke="${OL}" stroke-width="3"/><circle cy="70" r="12" fill="${fur}" stroke="${OL}" stroke-width="3"/></g>`;
  const ear = (s) => `<path d="M${s * 14} -26 L${s * 34} -66 L${s * 42} -16Z" fill="${fur}" stroke="${OL}" stroke-width="4"/><path d="M${s * 22} -28 L${s * 33} -54 L${s * 37} -24Z" fill="#f2a6a0"/>`;
  return `<g id="${id}"><path class="tl" d="M24 -20 Q90 -10 96 -70 Q100 -110 80 -120" fill="none" stroke="${OL}" stroke-width="18" stroke-linecap="round"/><path class="tl2" d="M24 -20 Q90 -10 96 -70 Q100 -110 80 -120" fill="none" stroke="${fur}" stroke-width="11" stroke-linecap="round"/>
    <g class="pr">${leg("lL", -15)}${leg("rL", 15)}
    <rect x="-38" y="-100" width="76" height="108" rx="28" fill="${c}" stroke="${OL}" stroke-width="4"/><path d="M0 -96 V4" stroke="${c2}" stroke-width="5"/>
    ${o.belt ? `<rect x="-38" y="-30" width="76" height="12" fill="${o.belt}"/>` : ""}${o.medal ? `<circle cx="-18" cy="-70" r="8" fill="#ffd23f" stroke="${OL}" stroke-width="3"/>` : ""}
    ${arm("aL", -36)}${arm("aR", 36)}
    <g class="hd" transform="translate(0 -136)">${ear(-1)}${ear(1)}
      <ellipse rx="46" ry="40" fill="${fur}" stroke="${OL}" stroke-width="4"/><path d="M-20 -36 Q-14 -24 -8 -36 M8 -36 Q14 -24 20 -36" stroke="${fur2}" stroke-width="5" fill="none"/>
      <ellipse cx="0" cy="16" rx="24" ry="16" fill="${belly}"/>
      <g class="eyes"><ellipse cx="-17" cy="-2" rx="10" ry="12" fill="#f4e27a" stroke="${OL}" stroke-width="3"/><ellipse cx="17" cy="-2" rx="10" ry="12" fill="#f4e27a" stroke="${OL}" stroke-width="3"/>
        <ellipse class="eL" cx="-17" cy="-2" rx="4" ry="6" fill="#1a1410"/><ellipse class="eR" cx="17" cy="-2" rx="4" ry="6" fill="#1a1410"/></g>
      <path d="M-5 10 L5 10 L0 16Z" fill="#e0707a"/><path d="M-50 12 L-24 14 M-50 22 L-24 18 M50 12 L24 14 M50 22 L24 18" stroke="${OL}" stroke-width="2"/>
      <path class="br" d="M-26 -18 L-10 -14 M10 -14 L26 -18" stroke="${fur2}" stroke-width="4" stroke-linecap="round"/>
      <path class="mo" d="M-8 20 Q0 26 8 20" stroke="${OL}" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${o.hat ? HATS[o.hat](o.hatC) : ""}${o.beard ? `<path d="M-30 18 Q0 70 30 18 Q0 34 -30 18Z" fill="${o.beard}" stroke="${OL}" stroke-width="3"/>` : ""}</g>
  </g></g>`;
}
const wag = (id, t, k = 1) => document.querySelectorAll(`#${id} .tl, #${id} .tl2`).forEach((e) => e.setAttribute("transform", `rotate(${10 * Math.sin(t * 4 * k)} 24 -20)`));
// старая бумага / рамка-титр для дат
const paperBg = (c1 = "#f3e2c0", c2 = "#e2c99a") => `<defs><radialGradient id="pb" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#pb)"/>`;
const vig = (op = .55) => `<defs><radialGradient id="vg${Math.round(op * 100)}" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${op}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#vg${Math.round(op * 100)})"/>`;
