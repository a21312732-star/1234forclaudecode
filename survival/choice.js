"use strict";
/* Общий каркас роликов-выборов «А/Б/В» (подключается после engine.js).
   E: [сцена, id, класс, x|"c", y, контент, появление, скрытие(99 — никогда), поворот, стиль] */
const sb = {};
function buildE(E) {
  E.forEach(([s, id, k, x, y, c, a, o, r, st]) => {
    let html = "", style = (x === "c" ? "left:0;right:0;margin:auto;width:max-content;" : k === "opt" ? "" : `left:${x}px;`) + `top:${y}px;` + (st || "");
    if (k.startsWith("tile")) html = `<span class="em">${c[0]}</span><b>${c[1]}</b>`;
    else if (k === "opt") html = `<span class="em">${c[0]}</span>${c[1]}<span class="k">${c[2]}</span>`;
    else html = c.replace(/(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)/gu, '<span class="em">$1</span>');
    document.getElementById(s).insertAdjacentHTML("beforeend", `<div class="${k} el" id="${id}" style="${style}">${html}</div>`);
    (sb[s] = sb[s] || []).push([s, id, k, x, y, c, a, o, r]);
  });
}
const elUpd = (sid, t) => (sb[sid] || []).forEach(([, id, , , , , a, o, r]) => { const el = document.getElementById(id); pop(el, t, a, r || 0); if (t < a && a > 0) el.style.opacity = 0; if (o && o !== 99) hide(el, t, o); });
const P = (id, x, y, s, pose, r = 0, o = 1) => { at(id, x, y, s, o, r); setPose(id, pose); };
// варианты ответа А/Б/В в одной сцене + обратный отсчёт 3-2-1 (в элементе cntId)
const OPTS3 = (s, ids, y0, opts, times) => opts.map((o, i) => [s, ids[i], "opt", 0, y0 + i * 170, o, times[i]]);
function countdown(el, t, t0) {
  const k = t >= t0 && t < t0 + 1.95 ? Math.min(2, Math.floor((t - t0) / .65)) : -1;
  el.textContent = k >= 0 ? 3 - k : ""; el.style.transform = k >= 0 ? `scale(${1 + .4 * (1 - prog(t, t0 + .65 * k, t0 + .65 * k + .2))})` : "";
}
// петля: последние две сцены показывают первый кадр с наездом
function loopTo(U, t, a, b, origin = "540px 760px") {
  const s1 = $("#s1"); s1.style.display = "block"; s1.style.opacity = 1; U.s1(0, 0); elUpd("s1", 0);
  const z = easeInOut(prog(t, a + .05, b - .1)); $("#a1").style.transformOrigin = origin; $("#a1").style.transform = `scale(${lerp(1.4, 1, z)})`;
  const hk = $("#hook1"); if (hk) hk.style.opacity = prog(t, b - .6, b - .05);
}
function holdFirst(U) { const s1 = $("#s1"); s1.style.display = "block"; s1.style.opacity = 1; U.s1(0, 0); elUpd("s1", 0); const hk = $("#hook1"); if (hk) hk.style.opacity = 1; }
const makeUPD = (U) => { const o = {}; SCENES.forEach(({ id }) => { o[id] = (lt, t) => { U[id](lt, t); elUpd(id, t); }; }); return o; };
// типовой звук выбора: тики, удары сердца, 3-2-1, правильный ответ, «попы» плашек, переход петли
function choiceSound(sfx, add, { tick = [], cd, ans, loop }) {
  for (let t = tick[0]; t < tick[1]; t += .55) add(t, (a) => sfx.heart(a, .6));
  [0, .65, 1.3].forEach((d) => add(cd + d, sfx.beep)); add(ans, sfx.ok); add(ans, sfx.ding);
  E.forEach((e) => { if (e[6] > 0) add(Math.max(0, e[6] - .02), sfx.pop); });
  add(loop[0] + .05, sfx.whooshDown); add(loop[1] - .6, (a) => sfx.riser(a, .5));
}
