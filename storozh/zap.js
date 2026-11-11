"use strict";
/* «Записки прошлого сторожа»: общие кадры (после common.js) */
// раскрытый журнал на столе под фонарём
const journal = (id) => desk + `<g id="${id}" transform="translate(540 900) rotate(-3)">
  <rect x="-470" y="-330" width="940" height="660" rx="14" fill="#000" opacity=".45" transform="translate(16 22)"/>
  <rect x="-470" y="-330" width="940" height="660" rx="14" fill="#5a2a1e" stroke="${OL}" stroke-width="8"/>
  <rect x="-440" y="-305" width="430" height="610" fill="#e3d6b0"/><rect x="10" y="-305" width="430" height="610" fill="#eadfbf"/>
  ${Array.from({ length: 12 }, (_, i) => `<path d="M-420 ${-250 + i * 46} H-30 M30 ${-250 + i * 46} H420" stroke="#9cb4c9" stroke-width="2" opacity=".6"/>`).join("")}
  ${Array.from({ length: 9 }, (_, i) => `<path d="M-410 ${-262 + i * 46} q60 -10 120 0 t120 0 t110 0" stroke="#1f2a44" stroke-width="5" fill="none" opacity=".8"/>`).join("")}
  ${Array.from({ length: 5 }, (_, i) => `<path d="M40 ${-262 + i * 46} q60 -10 120 0 t120 0 t110 0" stroke="#1f2a44" stroke-width="5" fill="none" opacity=".8"/>`).join("")}
  <path d="M0 -305 V305" stroke="#3a1a10" stroke-width="10"/></g><rect width="1080" height="1920" fill="url(#gTorch)"/>`;
// вырванная страница
const torn = `<rect width="1080" height="1920" fill="#0b0d14"/><g transform="translate(540 820) rotate(2)">
  <path d="M-380 -420 H380 V120 L330 160 L280 110 L220 170 L160 120 L100 175 L40 115 L-20 170 L-80 120 L-140 175 L-200 115 L-260 165 L-320 110 L-380 150Z" fill="#eadfbf" stroke="${OL}" stroke-width="6"/>
  ${Array.from({ length: 8 }, (_, i) => `<path d="M-340 ${-370 + i * 56} H340" stroke="#9cb4c9" stroke-width="2" opacity=".6"/>`).join("")}</g><rect width="1080" height="1920" fill="url(#gVig)"/>`;
// старый сторож спереди: перекрашиваем героя (седые волосы, коричневый пиджак)
function makeOld(gid) {
  const g = document.getElementById(gid);
  g.querySelectorAll(`[fill="${HAIR}"]`).forEach((e) => e.setAttribute("fill", "#a8a8a8"));
  g.querySelectorAll(`[fill="${COAT}"]`).forEach((e) => e.setAttribute("fill", "#5a4636"));
  g.querySelectorAll(`[fill="${COAT2}"]`).forEach((e) => e.setAttribute("fill", "#45362a"));
}
const ZAP_CSS = `
#stage{background:#0b0d14}
#clock{background:#c8242f;color:#fff;box-shadow:0 6px 0 #6a0f15;font-size:26px}
.full{transform-origin:540px 760px}
.ttl{position:absolute;left:30px;right:30px;text-align:center;font:900 76px/1.05 var(--head);color:#fff;z-index:6;
  text-shadow:6px 0 0 #000,-6px 0 0 #000,0 6px 0 #000,0 -6px 0 #000,5px 5px 0 #000,-5px 5px 0 #000,5px -5px 0 #000,-5px -5px 0 #000}
.ttl i{font-style:normal;color:#ffd23f}
.ep{position:absolute;left:40px;top:60px;background:#c8242f;color:#fff;font:900 34px var(--head);padding:10px 26px;border-radius:14px;z-index:6}
.bub{position:absolute;left:0;right:0;margin:auto;width:max-content;max-width:900px;padding:22px 40px;border-radius:50px;background:#fff;color:#111;font:900 56px var(--head);z-index:7;border:6px solid #000;text-align:center}
.bub i{font-style:italic;font-weight:800} .bub.red{background:#c8242f;color:#fff}
.bdg{position:absolute;left:0;right:0;margin:auto;width:max-content;padding:14px 30px;border-radius:18px;font:900 46px var(--head);z-index:7;border:5px solid #000}
.hand{position:absolute;left:150px;right:150px;top:470px;text-align:center;font:700 74px/1.15 Caveat;color:#1f2a44;z-index:6;transform:rotate(2deg)}`;
document.head.insertAdjacentHTML("beforeend", `<style>${ZAP_CSS}</style>`);
