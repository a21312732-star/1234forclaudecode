"use strict";
/* Гоша — герой серии. Плоская рисовка с толстым контуром, мимика, моргание, шарф, сжатие-растяжение.
   Начало координат — таз; ноги ~86 вниз, макушка с помпоном ~-264 вверх. */
const OL = "#1b1f2a";                       // цвет контура
const ow = (w = 5) => `stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const G = { coat: "#ff8a2a", coat2: "#e06a12", stripe: "#ffd166", pants: "#3b4a6b", hat: "#2f80ed", pom: "#fff", skin: "#ffd7b5", scarf: "#e63946", scarf2: "#fff", mitt: "#2f80ed", hair: "#6b3e1f" };

function gosha(id, extra = "") {
  const leg = (c, x) => `<g class="${c}" transform="translate(${x} 0)"><rect x="-13" y="-6" width="26" height="74" rx="12" fill="${G.pants}" ${ow()}/>
    <ellipse cx="6" cy="76" rx="24" ry="13" fill="#2a2a2a" ${ow()}/></g>`;
  const arm = (c, x) => `<g class="${c}" transform="translate(${x} -88)"><rect x="-13" y="-8" width="26" height="70" rx="13" fill="${G.coat}" ${ow()}/>
    <circle class="mitt" cy="68" r="15" fill="${G.mitt}" ${ow()}/></g>`;
  return `<g id="${id}"><g class="pr">
    <g class="sct"><path class="sctail" d="M18 -104 q36 18 30 70 l-22 4 q4 -46 -24 -62z" fill="${G.scarf}" ${ow()}/><path d="M28 -78 l22 -4 M30 -58 l20 -2" stroke="${G.scarf2}" stroke-width="6"/></g>
    ${leg("lL", -19)}${leg("rL", 19)}
    <rect x="-50" y="-108" width="100" height="120" rx="36" fill="${G.coat}" ${ow()}/>
    <path d="M-48 -52 H48" stroke="${G.stripe}" stroke-width="14"/><path d="M-48 -52 H48" stroke="${OL}" stroke-width="3" opacity=".25"/>
    <path d="M0 -104 V10" stroke="${G.coat2}" stroke-width="5"/>
    ${arm("aL", -48)}${arm("aR", 48)}
    <rect x="-40" y="-118" width="80" height="24" rx="12" fill="${G.scarf}" ${ow()}/><path d="M-22 -118 v24 M0 -118 v24 M22 -118 v24" stroke="${G.scarf2}" stroke-width="5"/>
    <g class="hd" transform="translate(0 -172)">
      <circle cx="-62" cy="6" r="13" fill="${G.skin}" ${ow()}/><circle cx="62" cy="6" r="13" fill="${G.skin}" ${ow()}/>
      <circle r="64" fill="${G.skin}" ${ow()}/>
      <path d="M-40 -40 q8 18 22 4 q6 16 22 2" fill="${G.hair}" ${ow(4)}/>
      <path d="M-66 -18 Q-66 -92 0 -94 Q66 -92 66 -18 Z" fill="${G.hat}" ${ow()}/><rect x="-70" y="-30" width="140" height="24" rx="12" fill="#1f63c9" ${ow()}/>
      <circle cx="0" cy="-104" r="20" fill="${G.pom}" ${ow()}/>
      <g class="chk"><ellipse cx="-38" cy="24" rx="13" ry="8" fill="#ff8f8f" opacity=".55"/><ellipse cx="38" cy="24" rx="13" ry="8" fill="#ff8f8f" opacity=".55"/></g>
      <g fill="#c98a5e"><circle cx="-30" cy="14" r="2.5"/><circle cx="-24" cy="20" r="2.5"/><circle cx="30" cy="14" r="2.5"/><circle cx="24" cy="20" r="2.5"/></g>
      <g class="eyes"><ellipse class="eL" cx="-22" cy="2" rx="15" ry="18" fill="#fff" ${ow(4)}/><ellipse class="eR" cx="22" cy="2" rx="15" ry="18" fill="#fff" ${ow(4)}/>
        <g class="pup"><circle class="pL" cx="-20" cy="4" r="8" fill="${OL}"/><circle class="pR" cx="24" cy="4" r="8" fill="${OL}"/><circle cx="-17" cy="0" r="3" fill="#fff"/><circle cx="27" cy="0" r="3" fill="#fff"/></g>
        <path class="lid" d="M-38 -16 h76 v0 h-76z" fill="${G.skin}"/></g>
      <path class="brL" d="M-36 -24 L-10 -22" ${ow(7)} fill="none"/><path class="brR" d="M10 -22 L36 -24" ${ow(7)} fill="none"/>
      <ellipse cx="0" cy="16" rx="8" ry="6" fill="#f4a68a" ${ow(3)}/>
      <path class="mo" d="M-14 34 Q0 44 14 34" fill="none" ${ow(5)}/>
    </g></g>${extra}</g>`;
}
// мимика: [рот, заливка рта, бровь Л, бровь П, масштаб зрачков]
const GF = {
  calm:   ["M-14 34 Q0 44 14 34", "none", "M-36 -24 L-10 -22", "M10 -22 L36 -24", 1],
  smug:   ["M-16 36 Q4 44 20 28", "none", "M-36 -28 L-10 -22", "M10 -30 L36 -40", 1],
  happy:  ["M-20 30 Q0 54 20 30 Z", "#7a1f1f", "M-36 -30 L-10 -30", "M10 -30 L36 -30", 1],
  panic:  ["M-12 34 Q0 14 12 34 Q0 56 -12 34Z", "#7a1f1f", "M-36 -38 L-12 -28", "M12 -28 L36 -38", .6],
  shock:  ["M-9 38 a9 11 0 1 0 18 0 a9 11 0 1 0 -18 0", "#7a1f1f", "M-36 -44 L-10 -40", "M10 -40 L36 -44", .45],
  focus:  ["M-12 38 L12 38", "none", "M-36 -18 L-10 -12", "M10 -12 L36 -18", 1],
  cold:   ["M-18 36 l6 -5 l6 5 l6 -5 l6 5 l6 -5", "none", "M-36 -20 L-10 -26", "M10 -26 L36 -20", .8],
  worried:["M-14 40 Q0 30 14 40", "none", "M-36 -20 L-10 -30", "M10 -30 L36 -20", .9],
};
// поза: la/ra — подъём рук (0 вниз, 90 в стороны, 180 вверх), ll/rl — ног, face, look (-1..1), tilt, sq — сжатие (>1 — вытянут), blink, cold (0..1 — синеет), scarf — угол шарфа
function poseG(id, p = {}, t = 0) {
  const g = document.getElementById(id), q = (s) => g.querySelector(s);
  q(".aL").setAttribute("transform", `translate(-48 -88) rotate(${p.la || 0})`); q(".aR").setAttribute("transform", `translate(48 -88) rotate(${-(p.ra || 0)})`);
  q(".lL").setAttribute("transform", `translate(-19 0) rotate(${p.ll || 0})`); q(".rL").setAttribute("transform", `translate(19 0) rotate(${-(p.rl || 0)})`);
  q(".hd").setAttribute("transform", `translate(${p.hx || 0} ${-172 + (p.hy || 0)}) rotate(${p.tilt || 0})`);
  const sq = p.sq || 1; q(".pr").setAttribute("transform", `scale(${1 / Math.sqrt(sq)} ${sq})`);
  const f = GF[p.face || "calm"], mo = q(".mo");
  mo.setAttribute("d", f[0]); mo.setAttribute("fill", f[1]); q(".brL").setAttribute("d", f[2]); q(".brR").setAttribute("d", f[3]);
  const lx = (p.look || 0) * 7, ly = (p.lookY || 0) * 6;
  q(".pup").setAttribute("transform", `translate(${lx} ${ly}) translate(0 2) scale(${f[4]}) translate(0 -2)`);
  // моргание: само каждые ~2.7 с, плюс по запросу
  const bl = p.blink || ((t * .37 + .13) % 1) < .045 ? 1 : 0;
  q(".lid").setAttribute("d", bl ? "M-38 -16 h76 v36 h-76z" : "M-38 -16 h76 v0 h-76z");
  g.querySelectorAll(".eL,.eR").forEach((e) => e.setAttribute("ry", bl ? 3 : 18));
  q(".pup").setAttribute("opacity", bl ? 0 : 1);
  q(".chk").setAttribute("opacity", 1 - (p.cold || 0) * .9);
  q(".hd circle:nth-of-type(3)").setAttribute("fill", p.cold ? mixC("#ffd7b5", "#bcd8f0", p.cold) : G.skin);
  q(".sct").setAttribute("transform", `rotate(${p.scarf != null ? p.scarf : 8 * Math.sin(t * 5)} 18 -104)`);
}
const mixC = (a, b, k) => { const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)); const A = h(a), B = h(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join(""); };
const walkG = (t, k = 1, extra = {}) => { const w = Math.sin(t * 8 * k); return { la: 22 * w, ra: -22 * w, ll: 24 * w, rl: -24 * w, sq: 1 + .03 * Math.abs(Math.cos(t * 8 * k)), ...extra }; };
// плёночное зерно поверх кадра
function grain(el) {
  const c = document.createElement("canvas"); c.width = 360; c.height = 640; const x = c.getContext("2d"), d = x.createImageData(360, 640);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (Math.random() - .5) * 90; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:overlay;opacity:.16;pointer-events:none;z-index:37"; el.appendChild(c);
}
