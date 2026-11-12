#!/usr/bin/env python3
"""Собирает index.html длинного ролика из story.txt: субтитры по предложениям, сцены по абзацам."""
import re, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
paras = [p.strip().replace("\n", " ") for p in open(os.path.join(HERE, "story.txt"), encoding="utf-8").read().split("\n\n") if p.strip()]
RATE = 10.0  # символов в секунду (оценка; точные времена расставит make-voice.py)
# сцена: (номер абзаца, тип)
SCENE_MAP = [(0, "title"), (1, "depart"), (2, "carriage"), (4, "wake"), (7, "empty"), (9, "speaker"), (11, "map"), (12, "lampsOut"),
             (15, "platform"), (16, "leave"), (18, "house"), (19, "timetable"), (20, "passport"), (23, "hall"), (25, "cashier"), (28, "rules"),
             (30, "cashierEmpty"), (31, "bench"), (32, "voices"), (38, "litTrain"), (41, "sleeve"), (47, "faceless"), (50, "talk"),
             (55, "kitchen"), (61, "darkTrain"), (66, "wakeUp"), (70, "ticket"), (72, "news"), (74, "nightRide"), (76, "finale"), (78, "outro")]
caps, t, pstart = [], 0.1, []
for i, p in enumerate(paras):
    pstart.append(round(t, 2))
    for s in re.split(r"(?<=[.!?…»])\s+(?=[А-ЯЁ«—])", p):
        words = s.split()
        while words:  # длинные предложения режем на строки до 11 слов
            n = len(words) if len(words) <= 13 else 11
            chunk = " ".join(words[:n]); words = words[n:]
            caps.append([round(t, 2), chunk]); t += max(1.2, len(chunk) / RATE)
    t += 0.6
end = round(t + 1.0, 2)
caps.append([round(t, 2), ""])
scenes = []
for k, (pi, typ) in enumerate(SCENE_MAP):
    s0 = pstart[pi] if k else 0
    e0 = pstart[SCENE_MAP[k + 1][0]] if k + 1 < len(SCENE_MAP) else round(t, 2)
    scenes.append({"id": f"s{k + 1}", "s": s0, "e": e0, "type": typ})
scenes.append({"id": f"s{len(scenes) + 1}", "s": round(t, 2), "e": end, "type": "hold"})
esc = lambda s: s.replace("\\", "\\\\").replace('"', '\\"')
caps_js = ",\n".join(f'  [{c[0]}, "{esc(c[1])}"]' for c in caps)
scenes_js = ", ".join(f'{{ id: "{s["id"]}", s: {s["s"]}, e: {s["e"]} }}' for s in scenes)
types_js = json.dumps({s["id"]: s["type"] for s in scenes})
tpl = open(os.path.join(HERE, "template.html"), encoding="utf-8").read()
html = tpl.replace("/*DUR*/", str(end)).replace("/*CAPS*/", caps_js).replace("/*SCENES*/", scenes_js).replace("/*TYPES*/", types_js) \
          .replace("/*SCENEDIVS*/", "".join(f'<div class="scene" id="{s["id"]}"><svg class="full" width="1920" height="1080" viewBox="0 0 1920 1080" id="a{s["id"][1:]}"></svg></div>' for s in scenes)) \
          .replace("/*PSTART*/", json.dumps(pstart))
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(html)
print("сцен:", len(scenes), "субтитров:", len(caps), "длина (оценка):", end, "с")
