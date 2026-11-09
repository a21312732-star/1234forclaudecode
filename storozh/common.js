"use strict";
/* Общая графика сериала «Правила ночного сторожа». Подключается после survival/engine.js. */
const SW_ = 1080, SH_ = 1920, FOC = 700, VY = 760, CAMH = 1.6, OL = "#12131a";
const PP = (x, y, z) => [540 + x * FOC / z, VY + (CAMH - y) * FOC / z];
const pts = (a) => a.map(([x, y, z]) => PP(x, y, z).map((v) => v.toFixed(1)).join(",")).join(" ");
const poly = (a, fill, ex = "") => `<polygon points="${pts(a)}" fill="${fill}" ${ex}/>`;
const SKIN = "#efbd97", SKIN2 = "#e9b48f", COAT = "#23324d", COAT2 = "#1a2640", HAIR = "#3a2a20";

const DEFS = `<defs>
  <radialGradient id="gLamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6d8" stop-opacity=".9"/><stop offset=".35" stop-color="#ffe7a8" stop-opacity=".35"/><stop offset="1" stop-color="#ffe7a8" stop-opacity="0"/></radialGradient>
  <radialGradient id="gPool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff0c0" stop-opacity=".35"/><stop offset="1" stop-color="#fff0c0" stop-opacity="0"/></radialGradient>
  <radialGradient id="gFog" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#7d8fa8" stop-opacity=".45"/><stop offset="1" stop-color="#7d8fa8" stop-opacity="0"/></radialGradient>
  <radialGradient id="gExit" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3dff8a" stop-opacity=".55"/><stop offset="1" stop-color="#3dff8a" stop-opacity="0"/></radialGradient>
  <radialGradient id="gVig" cx=".5" cy=".45" r=".75"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
  <linearGradient id="gBeam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff7d6" stop-opacity=".55"/><stop offset="1" stop-color="#fff7d6" stop-opacity=".07"/></linearGradient>
  <radialGradient id="gTorch" cx=".5" cy=".45" r=".55"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".55" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".93"/></radialGradient>
  <radialGradient id="gMoon" cx=".5" cy=".5" r=".5"><stop offset=".2" stop-color="#e8f0ff" stop-opacity=".5"/><stop offset="1" stop-color="#e8f0ff" stop-opacity="0"/></radialGradient>
  <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070f"/><stop offset="1" stop-color="#1b2740"/></linearGradient>
  <linearGradient id="gGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d8fa8" stop-opacity=".35"/><stop offset="1" stop-color="#7d8fa8" stop-opacity="0"/></linearGradient>
  <pattern id="gWood" width="1080" height="60" patternUnits="userSpaceOnUse"><rect width="1080" height="60" fill="#4a3022"/><path d="M0 58 H1080" stroke="#2e1d14" stroke-width="4"/><path d="M0 20 Q300 30 600 18 T1080 22" stroke="#553829" stroke-width="3" fill="none"/></pattern>
  <filter id="fBlur"><feGaussianBlur stdDeviation="9"/></filter>
</defs>`;

/* ---------- коридор: одноточечная перспектива; дальняя лампа (над фигурой) управляется через id ---------- */
function corridor(id, o = {}) {
  const Z1 = .8, Z2 = 16, X = 1.5, Y = 3, WA = 1.25;
  let s = `<rect width="${SW_}" height="${SH_}" fill="#0b0d14"/>` + poly([[-X, Y, Z1], [X, Y, Z1], [X, Y, Z2], [-X, Y, Z2]], "#1a1f2b");
  for (const sx of [-1, 1]) {
    s += poly([[sx * X, 0, Z1], [sx * X, WA, Z1], [sx * X, WA, Z2], [sx * X, 0, Z2]], "#17332c");
    s += poly([[sx * X, WA, Z1], [sx * X, Y, Z1], [sx * X, Y, Z2], [sx * X, WA, Z2]], "#323a4a");
    s += poly([[sx * X, WA - .03, Z1], [sx * X, WA + .03, Z1], [sx * X, WA + .03, Z2], [sx * X, WA - .03, Z2]], "#0e1f1a");
    s += poly([[sx * X, 0, Z1], [sx * X, .12, Z1], [sx * X, .12, Z2], [sx * X, 0, Z2]], "#0d1a16");
  }
  for (let i = 0; i < 6; i++) for (let j = 0; j < 31; j++) { const x0 = -X + i * .5, z0 = Z1 + j * .5;
    s += poly([[x0, 0, z0], [x0 + .5, 0, z0], [x0 + .5, 0, z0 + .5], [x0, 0, z0 + .5]], (i + j) % 2 ? "#23252e" : "#1c1e26", `stroke="#121319" stroke-width="1.5"`); }
  [[-1, 2.6, 0, "12"], [1, 4.2, 0, "13"], [-1, 6.4, 1, "14"], [1, 8.6, 0, "15"], [-1, 10.8, 0, "16"], [1, 12.6, 0, "17"]].forEach(([sx, z, ajar]) => {
    const x = sx * X;
    s += poly([[x, 0, z - .08], [x, 2.18, z - .08], [x, 2.18, z + .98], [x, 0, z + .98]], "#0f1116");
    s += poly([[x, 0, z], [x, 2.1, z], [x, 2.1, z + .9], [x, 0, z + .9]], ajar ? "#000" : "#3a2c26");
    if (ajar) s += poly([[x, 0, z + .9], [x, 2.1, z + .9], [x - sx * .55, 2.1, z + .6], [x - sx * .55, 0, z + .6]], "#4a382f", `stroke="${OL}" stroke-width="2"`);
    else { s += poly([[x, 1.25, z + .15], [x, 1.85, z + .15], [x, 1.85, z + .75], [x, 1.25, z + .75]], "#2c211c");
      s += poly([[x, 1.0, z + .72], [x, 1.06, z + .72], [x, 1.06, z + .8], [x, 1.0, z + .8]], "#8a7a5a"); }
    s += poly([[x, 2.25, z + .3], [x, 2.45, z + .3], [x, 2.45, z + .6], [x, 2.25, z + .6]], "#c9c2a8");
  });
  s += poly([[-X, 0, Z2], [X, 0, Z2], [X, Y, Z2], [-X, Y, Z2]], "#262c3a") + poly([[-X, 0, Z2], [X, 0, Z2], [X, WA, Z2], [-X, WA, Z2]], "#142a24");
  s += poly([[-.55, 0, Z2 - .01], [.55, 0, Z2 - .01], [.55, 2.2, Z2 - .01], [-.55, 2.2, Z2 - .01]], "#3a2c26", `stroke="${OL}" stroke-width="2"`);
  s += poly([[-.4, 1.3, Z2 - .02], [-.08, 1.3, Z2 - .02], [-.08, 1.9, Z2 - .02], [-.4, 1.9, Z2 - .02]], "#9fb4c8", `opacity=".5"`);
  s += poly([[.08, 1.3, Z2 - .02], [.4, 1.3, Z2 - .02], [.4, 1.9, Z2 - .02], [.08, 1.9, Z2 - .02]], "#9fb4c8", `opacity=".5"`);
  const [ex, ey] = PP(0, 2.45, Z2 - .02);
  s += `<circle cx="${ex}" cy="${ey}" r="70" fill="url(#gExit)"/><rect x="${ex - 22}" y="${ey - 7}" width="44" height="14" rx="2" fill="#1eff7a"/><text x="${ex}" y="${ey + 4}" font-size="9" font-weight="900" text-anchor="middle" font-family="Montserrat" fill="#063">ВЫХОД</text>`;
  s += `<ellipse cx="540" cy="${VY + 40}" rx="420" ry="360" fill="url(#gFog)"/>`;
  const lamp = (z, on, lid) => { let r = poly([[-.35, Y, z], [.35, Y, z], [.35, Y, z + .5], [-.35, Y, z + .5]], "#3b4050", `stroke="${OL}" stroke-width="2"`);
    const [lx, ly] = PP(0, Y - .05, z + .25), c = Array.from({ length: 24 }, (_, i) => [1.25 * Math.cos(i / 24 * 6.283), 0, z + .25 + 1.25 * Math.sin(i / 24 * 6.283)]);
    const lit = poly([[-.35, Y, z], [.35, Y, z], [.35, Y, z + .5], [-.35, Y, z + .5]], "#fff3cf") + `<circle cx="${lx}" cy="${ly}" r="${2.2 * FOC / z}" fill="url(#gLamp)"/>` + poly(c, "url(#gPool)");
    return r + (lid ? `<g id="${lid}">${lit}</g>` : on ? lit : ""); };
  s += lamp(3.2, 0) + lamp(7.2, 1) + lamp(11.2, 0) + lamp(13.3, 0, `${id}L`);
  s += `<g id="${id}F">${figure(.55, 13.6)}</g>`;
  if (o.beam) s += `<polygon id="${id}B" fill="url(#gBeam)" style="mix-blend-mode:screen"/><polygon id="${id}S" fill="#fff4cc" opacity=".2" style="mix-blend-mode:screen"/>`;
  return s;
}
// бледная фигура: длинные руки, голова набок (голова — отдельная группа .fh для наклона)
function figure(x, z) {
  const [bx, by] = PP(x, 0, z), k = FOC / z;
  return `<g transform="translate(${bx} ${by}) scale(${k / 100})">
    <ellipse cx="0" cy="0" rx="40" ry="8" fill="#000" opacity=".5"/>
    <path d="M-14 0 L-10 -95 M14 0 L10 -95" stroke="#c9cfd6" stroke-width="11" stroke-linecap="round"/>
    <path d="M-22 -95 Q-26 -150 -16 -175 L16 -175 Q26 -150 22 -95 Z" fill="#d6dbe0"/>
    <path d="M-17 -170 Q-40 -110 -34 -40 M17 -170 Q40 -110 34 -40" stroke="#c9cfd6" stroke-width="9" fill="none" stroke-linecap="round"/>
    <g class="fh" transform="translate(6 -196) rotate(24)"><ellipse rx="19" ry="24" fill="#e2e6ea"/><ellipse cx="-7" cy="-3" rx="5" ry="8" fill="#000"/><ellipse cx="7" cy="-3" rx="5" ry="8" fill="#000"/></g></g>`;
}
// луч фонаря из точки (tx,ty) в пятно на высоте yT, глубина z0..z0+3, смещение cx
function setBeam(id, tx, ty, aim, cx = .35, on = 1) {
  const z0 = lerp(3.6, 8.5, aim), yT = lerp(0, 1.0, aim), w = .55 + .2 * aim;
  const q = [[cx - w, yT, z0], [cx - w, yT, z0 + 3], [cx + w, yT, z0 + 3], [cx + w, yT, z0]].map(([x, y, z]) => PP(x, y, z));
  $("#" + id + "B").setAttribute("points", `${tx},${ty} ${q.map((p) => p.join(",")).join(" ")}`);
  const sp = Array.from({ length: 28 }, (_, i) => PP(cx + w * Math.cos(i / 28 * 6.283), yT, z0 + 1.5 + 1.5 * Math.sin(i / 28 * 6.283)));
  $("#" + id + "S").setAttribute("points", sp.map((p) => p.join(",")).join(" "));
  $("#" + id + "B").setAttribute("opacity", on); $("#" + id + "S").setAttribute("opacity", .2 * on);
}

/* ---------- человек со спины (ноги в 0,0). Рука с фонарём: плечо → локоть → кисть, двигается через setArm ---------- */
function personBack(id, o = {}) {
  const coat = o.coat || COAT, coat2 = o.coat2 || COAT2, hair = o.hair || HAIR, pants = o.pants || "#2a2f3d";
  const seg = (cls, w, c) => `<line class="${cls}o" stroke="${OL}" stroke-width="${w + 14}" stroke-linecap="round"/><line class="${cls}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  return `<g id="${id}"><g class="bd" stroke="${OL}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">
    <rect class="lgL" x="-62" y="-150" width="52" height="150" rx="20" fill="${pants}"/><rect class="lgR" x="10" y="-150" width="52" height="150" rx="20" fill="${pants}"/>
    <path d="M-74 -10 h68 v22 h-74z M6 -10 h68 v22 h-74z" fill="#1a1a1f"/>
    <path d="M-110 -170 Q-118 -370 -60 -390 L60 -390 Q118 -370 110 -170 Z" fill="${coat}"/>
    <path d="M-110 -170 Q-118 -370 -60 -390 L-30 -390 Q-80 -360 -84 -170 Z" fill="${coat2}" stroke="none"/>
    <rect x="-112" y="-200" width="224" height="34" rx="10" fill="${coat2}"/>
    ${o.label ? `<rect x="-96" y="-318" width="192" height="44" rx="6" fill="#d9c25a"/><text x="0" y="-284" font-family="Montserrat" font-weight="900" font-size="36" text-anchor="middle" fill="${COAT}" stroke="none">${o.label}</text>` : ""}
    <rect x="-150" y="-370" width="48" height="190" rx="22" fill="${coat2}" transform="rotate(8 -126 -370)"/></g>
    <g class="arm">${seg("ua", 48, coat)}${seg("fa", 44, coat2)}
      ${o.torch ? `<g class="tc" stroke="${OL}" stroke-width="6"><path d="M-14 0 L14 0 L20 -46 L-20 -46 Z" fill="#3a3a3a"/><rect x="-24" y="-60" width="48" height="16" rx="5" fill="#555"/></g>` : ""}
      <circle class="hn" r="24" fill="${SKIN2}" stroke="${OL}" stroke-width="7"/></g>
    <g class="hd" stroke="${OL}" stroke-width="7" stroke-linejoin="round"><circle cx="0" cy="-500" r="118" fill="${SKIN2}"/>
    <ellipse cx="-118" cy="-490" rx="18" ry="28" fill="${SKIN2}"/><ellipse cx="118" cy="-490" rx="18" ry="28" fill="${SKIN2}"/>
    ${o.old ? `<path d="M-122 -470 Q-128 -560 -80 -590 Q0 -560 80 -590 Q128 -560 122 -470 Q60 -430 0 -436 Q-60 -430 -122 -470 Z" fill="${hair}"/>`
      : `<path d="M-120 -470 Q-130 -600 -60 -625 L-70 -660 L-20 -632 L0 -672 L24 -632 L72 -656 L62 -620 Q132 -590 120 -470 Q60 -430 0 -436 Q-60 -430 -120 -470 Z" fill="${hair}"/><path d="M-60 -580 Q-20 -600 30 -585" fill="none" stroke="#5a4232" stroke-width="8"/>`}</g></g>`;
}
// рука: плечо (104,-360) → локоть → кисть; фонарь повёрнут на ang
function setArm(id, ex, ey, hx, hy, ang = 28) {
  const g = document.getElementById(id), L = (c, a, b, x, y) => g.querySelectorAll("." + c).forEach((l) => { l.setAttribute("x1", a); l.setAttribute("y1", b); l.setAttribute("x2", x); l.setAttribute("y2", y); });
  L("ua", 104, -350, ex, ey); L("uao", 104, -350, ex, ey); L("fa", ex, ey, hx, hy); L("fao", ex, ey, hx, hy);
  g.querySelector(".hn").setAttribute("transform", `translate(${hx} ${hy})`);
  const tc = g.querySelector(".tc"); if (tc) tc.setAttribute("transform", `translate(${hx + 8} ${hy - 16}) rotate(${ang})`);
}
// шаг: покачивание и ноги
function stepBack(id, t, on = 1) { const g = document.getElementById(id), w = Math.sin(t * 7) * on;
  g.querySelector(".lgL").setAttribute("transform", `translate(0 ${Math.max(0, w) * -14})`); g.querySelector(".lgR").setAttribute("transform", `translate(0 ${Math.max(0, -w) * -14})`);
  g.querySelector(".hd").setAttribute("transform", `translate(0 ${-Math.abs(w) * 6})`); }

/* ---------- лицо героя (центр головы 0,0; радиус ~320) с эмоциями ---------- */
function face(id) {
  return `<g id="${id}" stroke="${OL}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round">
    <ellipse cx="-318" cy="-20" rx="50" ry="72" fill="${SKIN2}"/><ellipse cx="318" cy="-20" rx="50" ry="72" fill="${SKIN2}"/>
    <path d="M-320 -60 Q-330 280 0 330 Q330 280 320 -60 Q320 -300 0 -310 Q-320 -300 -320 -60 Z" fill="${SKIN}"/>
    <path d="M-330 -40 Q-350 -330 -150 -380 L-170 -450 L-60 -395 L0 -470 L60 -392 L170 -445 L150 -375 Q345 -320 330 -40 Q300 -170 200 -200 Q80 -150 -40 -210 Q-160 -170 -250 -190 Q-310 -140 -330 -40 Z" fill="${HAIR}"/>
    <path d="M-130 -300 Q-60 -340 40 -320 M60 -330 Q130 -330 190 -290" fill="none" stroke="#5a4232" stroke-width="10"/>
    <g class="eo"><ellipse class="wl" cx="-125" cy="20" rx="78" ry="92" fill="#fff"/><ellipse class="wr" cx="125" cy="20" rx="78" ry="92" fill="#fff"/>
      <g class="pu" stroke="none"><circle class="pl" cx="-110" cy="30" r="20" fill="#14141a"/><circle class="pr" cx="140" cy="30" r="20" fill="#14141a"/>
      <circle cx="-104" cy="22" r="6" fill="#fff"/><circle cx="146" cy="22" r="6" fill="#fff"/></g></g>
    <g class="ec" fill="none" stroke-width="14"><path d="M-190 40 Q-125 -20 -60 40"/><path d="M60 40 Q125 -20 190 40"/></g>
    <path class="br" d="M-205 -110 Q-140 -150 -60 -120 M60 -120 Q140 -150 205 -110" fill="none" stroke-width="16"/>
    <path d="M-20 90 Q-30 150 10 160" fill="none" stroke="#b9805e" stroke-width="8"/>
    <ellipse class="mO" cx="10" cy="215" rx="34" ry="44" fill="#5a1a12"/>
    <path class="mL" d="M-110 180 Q10 190 130 180 Q110 300 10 300 Q-90 300 -110 180 Z" fill="#5a1a12"/>
    <path class="mS" d="M-50 210 Q10 225 70 205" fill="none" stroke-width="10"/>
    <ellipse class="mT" cx="10" cy="225" rx="44" ry="70" fill="#5a1a12"/>
    <path class="sw" d="M250 -150 Q275 -100 250 -80 Q225 -100 250 -150 Z" fill="#bfe3f5" stroke-width="5"/>
    <ellipse cx="-215" cy="135" rx="38" ry="18" fill="#ff8a8a" opacity=".35" stroke="none"/><ellipse cx="225" cy="135" rx="38" ry="18" fill="#ff8a8a" opacity=".35" stroke="none"/></g>`;
}
const BROWS = { fear: "M-205 -110 Q-140 -150 -60 -120 M60 -120 Q140 -150 205 -110", laugh: "M-205 -120 Q-130 -150 -60 -130 M60 -130 Q130 -150 205 -120",
  shock: "M-205 -150 Q-140 -190 -60 -160 M60 -160 Q140 -190 205 -150", calm: "M-200 -100 Q-130 -120 -60 -105 M60 -105 Q130 -120 200 -100" };
function setFace(id, ex = "fear", look = 0) {
  const g = document.getElementById(id), sh = (c, v) => g.querySelector("." + c).setAttribute("opacity", v ? 1 : 0);
  sh("eo", ex !== "laugh"); sh("ec", ex === "laugh"); sh("mO", ex === "fear"); sh("mL", ex === "laugh"); sh("mS", ex === "calm"); sh("mT", ex === "shock"); sh("sw", ex === "fear" || ex === "shock");
  g.querySelector(".br").setAttribute("d", BROWS[ex]);
  const r = ex === "shock" ? 13 : ex === "fear" ? 18 : 26; g.querySelectorAll(".pl,.pr").forEach((c) => c.setAttribute("r", r));
  g.querySelector(".pu").setAttribute("transform", `translate(${look * 30} 0)`);
  const k = ex === "shock" ? 1.12 : 1; g.querySelectorAll(".wl,.wr").forEach((e) => e.setAttribute("ry", 92 * k));
}
// плечи под крупным планом (центр головы в 0,0)
const shoulders = `<g stroke="${OL}" stroke-width="10" stroke-linejoin="round">
  <path d="M-420 920 Q-430 520 -260 430 L260 430 Q430 520 420 920 Z" fill="${COAT}"/>
  <path d="M-170 430 L-110 330 L110 330 L170 430 L60 520 L0 440 L-60 520 Z" fill="#1b2335"/>
  <rect x="-330" y="560" width="190" height="64" rx="8" fill="#d9c25a"/><text x="-235" y="604" font-family="Montserrat" font-weight="900" font-size="38" text-anchor="middle" fill="${COAT}" stroke="none">ОХРАНА</text>
  <rect x="200" y="470" width="90" height="150" rx="14" fill="#2b2b2b"/><path d="M265 470 V380" stroke-width="12"/><circle cx="245" cy="510" r="10" fill="#ff3b30" stroke="none"/>
  <rect x="-110" y="230" width="220" height="130" fill="#e3a985"/></g>`;
// герой в полный рост спереди (ноги в 0,0), держит лист
function guardFront(id, fid) {
  return `<g id="${id}"><g stroke="${OL}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">
    <rect x="-62" y="-150" width="52" height="150" rx="20" fill="#2a2f3d"/><rect x="10" y="-150" width="52" height="150" rx="20" fill="#2a2f3d"/>
    <path d="M-74 -10 h68 v22 h-74z M6 -10 h68 v22 h-74z" fill="#1a1a1f"/>
    <path d="M-110 -170 Q-118 -370 -60 -390 L60 -390 Q118 -370 110 -170 Z" fill="${COAT}"/><rect x="-112" y="-200" width="224" height="34" rx="10" fill="${COAT2}"/>
    <path d="M-50 -392 L0 -340 L50 -392" fill="#1b2335"/><rect x="-92" y="-330" width="80" height="28" rx="4" fill="#d9c25a"/>
    <rect x="-150" y="-370" width="48" height="190" rx="22" fill="${COAT2}" transform="rotate(8 -126 -370)"/>
    <rect x="102" y="-370" width="48" height="130" rx="22" fill="${COAT2}" transform="rotate(-8 126 -370)"/>
    <g transform="translate(60 -250) rotate(-8)"><rect x="-70" y="-90" width="120" height="160" fill="#eadfbf"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M-55 ${-65 + i * 26} H35" stroke="#1f2a44" stroke-width="5"/>`).join("")}</g>
    <circle cx="120" cy="-232" r="22" fill="${SKIN2}"/><circle cx="-2" cy="-232" r="22" fill="${SKIN2}"/></g>
    <g transform="translate(0 -505) scale(.36)">${face(fid)}</g></g>`;
}

/* ---------- лист с правилами (центр 0,0; маркер подсветки строк) ---------- */
const RULES = ["1. Обход — ровно в 00:00, 2:00 и 4:00.", "2. Не свети фонарём в конец коридора.", "3. Если тебя зовут из подвала —", "    не отвечай. Даже если голос знакомый.", "4. В 3:15 не смотри в окна.", "5. В бассейне нет воды.", "    Если слышишь плеск — уходи.", "6. Лифт не работает с 1987 года.", "7. Если в палате 14 горит свет —"];
function paper(id) {
  return `<g id="${id}"><rect x="-410" y="-600" width="820" height="1100" fill="#000" opacity=".4" transform="translate(16 20)"/>
    <rect x="-410" y="-600" width="820" height="1100" fill="#eadfbf"/>
    ${Array.from({ length: 22 }, (_, i) => `<path d="M-370 ${-440 + i * 44} H370" stroke="#9cb4c9" stroke-width="2" opacity=".6"/>`).join("")}
    <path d="M-320 -600 V500" stroke="#d98a8a" stroke-width="3"/><circle cx="40" cy="300" r="90" fill="none" stroke="#a87a4a" stroke-width="10" opacity=".35"/>
    <rect class="hl1" x="-310" y="-440" width="640" height="56" fill="#ffe14d" opacity="0"/><rect class="hl2" x="-310" y="-352" width="640" height="56" fill="#ff6b6b" opacity="0"/>
    <text x="0" y="-500" style="font-family:Caveat" font-weight="700" font-size="54" text-anchor="middle" fill="#1f2a44">ПРАВИЛА ДЛЯ НОЧНОГО СТОРОЖА</text>
    ${RULES.map((r, i) => `<text x="-300" y="${-400 + i * 88}" style="font-family:Caveat" font-weight="600" font-size="44" fill="#1f2a44" xml:space="preserve">${r}</text>`).join("")}
    <path d="M-300 400 Q-100 380 60 410 T380 400" stroke="#5a1a12" stroke-width="22" fill="none" opacity=".75"/>
    <path d="M-410 440 L-330 470 L-260 430 L-180 480 L-90 440 L0 485 L90 445 L190 480 L280 440 L410 470 L410 500 L-410 500 Z" fill="#4a3022"/></g>`;
}
const desk = `<rect width="${SW_}" height="${SH_}" fill="url(#gWood)"/>
  <g transform="translate(870 1480)"><ellipse cx="0" cy="10" rx="120" ry="40" fill="#000" opacity=".4"/><rect x="-90" y="-150" width="180" height="160" rx="20" fill="#e8e8e8" stroke="${OL}" stroke-width="7"/><path d="M90 -110 Q150 -100 140 -40 Q130 0 90 -20" fill="none" stroke="${OL}" stroke-width="18"/><ellipse cx="0" cy="-150" rx="90" ry="22" fill="#3a2418" stroke="${OL}" stroke-width="7"/></g>
  <g transform="translate(190 1560) rotate(-20)" stroke="${OL}" stroke-width="6"><circle r="44" fill="none" stroke="#b9a35a" stroke-width="12"/><rect x="30" y="-12" width="150" height="24" rx="6" fill="#c9b36a"/></g>`;

/* ---------- санаторий снаружи ---------- */
function exterior(id) {
  let s = `<rect width="${SW_}" height="${SH_}" fill="url(#gSky)"/>`;
  for (let i = 0; i < 60; i++) s += `<circle cx="${hash(i) * SW_}" cy="${hash(i + 50) * 700}" r="${1 + 2 * hash(i + 9)}" fill="#fff" opacity="${.3 + .5 * hash(i + 3)}"/>`;
  s += `<circle cx="820" cy="260" r="220" fill="url(#gMoon)"/><circle cx="820" cy="260" r="70" fill="#eef3ff"/><circle cx="845" cy="245" r="62" fill="#1b2740" opacity=".18"/>`;
  const pine = (x, y, h) => `<path d="M${x} ${y - h} L${x - h * .28} ${y - h * .45} L${x - h * .14} ${y - h * .45} L${x - h * .36} ${y} L${x + h * .36} ${y} L${x + h * .14} ${y - h * .45} L${x + h * .28} ${y - h * .45} Z" fill="#070b12"/>`;
  [[60, 1180, 520], [190, 1160, 430], [930, 1180, 560], [1040, 1170, 470], [320, 1120, 300], [760, 1120, 320]].forEach(([x, y, h]) => (s += pine(x, y, h)));
  // корпус: два этажа, колонны у входа
  s += `<g stroke="${OL}" stroke-width="6"><rect x="150" y="760" width="780" height="380" fill="#3a4152"/><path d="M130 760 L540 640 L950 760 Z" fill="#2b3140"/>
    <rect x="420" y="900" width="240" height="240" fill="#2b3140"/>${[440, 500, 580, 640].map((x) => `<rect x="${x - 12}" y="860" width="24" height="280" fill="#c9c2a8"/>`).join("")}
    <rect x="410" y="845" width="260" height="30" fill="#c9c2a8"/><rect x="500" y="980" width="80" height="160" fill="#14161c"/></g>`;
  const wins = []; for (const y of [800, 960]) for (const x of [190, 260, 330, 700, 770, 840]) wins.push([x, y]);
  wins.forEach(([x, y], i) => { const lit = i === 9; s += `<rect x="${x}" y="${y}" width="50" height="80" fill="${lit ? "#e8d48a" : "#10131a"}" stroke="${OL}" stroke-width="5"/>`;
    if (lit) s += `<g id="${id}W"><rect x="${x}" y="${y}" width="50" height="80" fill="#fff3b0" opacity=".3"/><path d="M${x + 25} ${y + 80} V${y + 40} M${x + 25} ${y + 30} m-9 0 a9 11 0 1 0 18 0 a9 11 0 1 0 -18 0" stroke="#111" stroke-width="10" fill="#111"/></g>`; });
  s += `<text x="540" y="740" font-family="Montserrat" font-weight="900" font-size="30" text-anchor="middle" fill="#c9c2a8">САНАТОРИЙ «СОСНОВЫЙ БОР»</text>`;
  s += `<rect y="1140" width="${SW_}" height="${SH_ - 1140}" fill="#0c1018"/><path d="M440 1920 L500 1140 L580 1140 L640 1920 Z" fill="#1a1f2a"/>`;
  // забор и ворота
  s += `<g stroke="#2a2f3a" stroke-width="8">${Array.from({ length: 28 }, (_, i) => { const x = i * 40 + 10; return x > 380 && x < 700 ? "" : `<path d="M${x} 1330 V1210"/>`; }).join("")}<path d="M0 1240 H380 M700 1240 H1080"/></g>
    <g stroke="#2a2f3a" stroke-width="8" fill="none"><path d="M380 1340 V1150 M700 1340 V1150"/><path d="M380 1180 L470 1200 V1330 M700 1180 L610 1200 V1330"/><path d="M400 1260 H460 M620 1260 H680"/></g>`;
  s += `<rect y="1250" width="${SW_}" height="300" fill="url(#gGround)"/>`;
  return s;
}
/* ---------- вахта (холл) ---------- */
function lobby() {
  return `<rect width="${SW_}" height="${SH_}" fill="#2b3240"/><rect y="760" width="${SW_}" height="420" fill="#17332c"/><rect y="756" width="${SW_}" height="10" fill="#0e1f1a"/>
    <rect y="1180" width="${SW_}" height="${SH_ - 1180}" fill="#1c1e26"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${-600 + i * 200} 1920 L${i * 100 - 50} 1180" stroke="#121319" stroke-width="3"/>`).join("")}
    ${[1260, 1380, 1540, 1760].map((y) => `<path d="M0 ${y} H1080" stroke="#121319" stroke-width="3"/>`).join("")}
    <g stroke="${OL}" stroke-width="6"><rect x="760" y="520" width="240" height="660" fill="#3a2c26"/><rect x="800" y="580" width="160" height="220" fill="#7d8fa8" opacity=".5"/><circle cx="790" cy="880" r="10" fill="#8a7a5a"/>
    <rect x="90" y="300" width="300" height="180" fill="#c9c2a8"/><text x="240" y="380" font-family="Montserrat" font-weight="900" font-size="34" text-anchor="middle" fill="#7a2020" stroke="none">БЕРЕГИТЕ</text><text x="240" y="430" font-family="Montserrat" font-weight="900" font-size="34" text-anchor="middle" fill="#7a2020" stroke="none">ТИШИНУ</text>
    <rect x="60" y="980" width="440" height="40" fill="#5a3d2c"/><rect x="80" y="1020" width="400" height="200" fill="#4a3022"/>
    <path d="M140 980 L160 900 L130 860 H210 L180 900 L200 980 Z" fill="#2b2b2b"/></g>
    <ellipse cx="170" cy="880" rx="200" ry="150" fill="url(#gLamp)" opacity=".7"/>
    <g transform="translate(560 280)"><circle r="70" fill="#e8e2cc" stroke="${OL}" stroke-width="8"/><path d="M0 0 V-46 M0 0 L30 12" stroke="${OL}" stroke-width="8" stroke-linecap="round"/></g>`;
}
/* ---------- настенные часы ---------- */
function wallClock(id) {
  return `<rect width="${SW_}" height="${SH_}" fill="#232a36"/><rect y="1180" width="${SW_}" height="${SH_ - 1180}" fill="#17332c"/>
    <g transform="translate(540 760)"><circle r="370" fill="#000" opacity=".35" transform="translate(14 18)"/><circle r="370" fill="#5a3d2c" stroke="${OL}" stroke-width="12"/><circle r="320" fill="#e8e2cc" stroke="${OL}" stroke-width="8"/>
    ${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * 6.283; return `<path d="M${270 * Math.sin(a)} ${-270 * Math.cos(a)} L${300 * Math.sin(a)} ${-300 * Math.cos(a)}" stroke="${OL}" stroke-width="${i % 3 ? 8 : 16}"/>`; }).join("")}
    <text y="-200" font-family="Montserrat" font-weight="900" font-size="64" text-anchor="middle" fill="${OL}">XII</text>
    <path id="${id}H" d="M0 20 V-160" stroke="${OL}" stroke-width="22" stroke-linecap="round"/><path id="${id}M" d="M0 26 V-240" stroke="${OL}" stroke-width="14" stroke-linecap="round"/>
    <path id="${id}S" d="M0 40 V-280" stroke="#c8242f" stroke-width="6" stroke-linecap="round"/><circle r="20" fill="${OL}"/></g>`;
}
