#!/usr/bin/env python3
"""Генерирует озвучку voice.mp3 из субтитров index.html.

Нужно:  sudo apt install rhvoice rhvoice-russian ffmpeg
        pip install praat-parselmouth numpy
Запуск: python3 tools/make-voice.py

Подача подогнана под образец (низкий спокойный мужской голос, ~5 слогов/с, ровные паузы):
  1. Каждая фраза синтезируется RHVoice в естественном темпе — без ускорения.
  2. Интонация опускается до ~109 Гц, скачки вверх сглаживаются (PSOLA через Praat).
  3. Если фраза длиннее своего окна, таймлайн видео растягивается (массив WARP в index.html),
     поэтому анимация и звуковые эффекты подстраиваются под голос, а не голос под них.
  4. Субтитры внутри фраз выставляются по реальной речи.
  5. Всё сводится в одну дорожку voice.mp3: ближе, суше и ярче, как в образце.
"""
import os, re, subprocess, tempfile
import numpy as np
import parselmouth
from parselmouth.praat import call

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, "index.html")
OUT = os.path.join(ROOT, "voice.mp3")

VOICE = "aleksandr-hq"
RATE = 98            # естественный темп (~5 слогов в секунду)
TARGET_F0 = 109.0    # медиана высоты голоса, Гц
RANGE = 1.15         # 1.0 = исходная выразительность, меньше = ровнее
CEIL_F0 = 158.0     # мягкий потолок интонации, Гц
PAUSE = 0.4          # минимальная пауза после фразы, с

REPL = [("2:47", "два сорок семь"), ("40 децибел", "сорок децибел"), ("31 децибел", "тридцать один децибел"),
        ("120 литров", "сто двадцать литров"), ("3:30", "три тридцать"), ("3:41", "Три сорок одна"),
        ("«", ""), ("»", ""), (" —", ",")]

src = open(HTML, encoding="utf-8").read()
body = re.search(r"const CAPS = \[\n(.*?)\n\];", src, re.S).group(1)
ENTRY = re.compile(r'\[(\d+(?:\.\d+)?), "((?:[^"\\]|\\.)*)"\]')
caps = [[float(t), txt] for t, txt in ENTRY.findall(body)]
DUR = float(re.search(r"const DUR = (\d+(?:\.\d+)?)", src).group(1))
END_SCENE = float(re.findall(r'\{ id: "s\d", s: (\d+(?:\.\d+)?), e: [\d.]+ \}', src)[-1])

plain = lambda s: re.sub(r"\{\w:([^}]*)\}", r"\1", s).strip()
groups, cur = [], []
for i, (t, txt) in enumerate(caps):
    if not plain(txt): continue
    cur.append(i)
    if re.search(r"[.!?:»—]$", plain(txt)): groups.append(cur); cur = []
if cur: groups.append(cur)

tmp = tempfile.mkdtemp()
TRIM = ("silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
        "silenceremove=start_periods=1:start_threshold=-45dB,areverse")

def dur_of(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]))

# 1. synthesis
raw = []
for gi, g in enumerate(groups):
    text = " ".join(plain(caps[i][1]) for i in g)
    for a, b in REPL: text = text.replace(a, b)
    text = text.strip(" ,")
    p = os.path.join(tmp, f"{gi:02d}")
    subprocess.run(["RHVoice-test", "-p", VOICE, "-r", str(RATE), "-t", "92", "-o", p + ".rh.wav"], input=text.encode(), check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", p + ".rh.wav", "-af", TRIM, "-ar", "44100", "-ac", "1", p + ".wav"], check=True)
    raw.append((text, p + ".wav"))

# 2. intonation: lower and flatten
all_f0 = []
for _, p in raw:
    f0 = parselmouth.Sound(p).to_pitch_ac(pitch_floor=60, pitch_ceiling=350).selected_array["frequency"]
    all_f0 += list(f0[f0 > 0])
SRC_MED = float(np.median(all_f0))

def reshape(f):
    st = 12 * np.log2(f / SRC_MED) * RANGE
    g = TARGET_F0 * 2 ** (st / 12)
    return g if g <= CEIL_F0 else CEIL_F0 + (g - CEIL_F0) * 0.45

clips = []
for k, (text, p) in enumerate(raw):
    snd = parselmouth.Sound(p)
    manip = call(snd, "To Manipulation", 0.01, 60, 350)
    tier = call(manip, "Extract pitch tier")
    new = call("Create PitchTier", "new", snd.xmin, snd.xmax)
    for i in range(1, call(tier, "Get number of points") + 1):
        call(new, "Add point", call(tier, "Get time from index", i), reshape(call(tier, "Get value at index", i)))
    call([new, manip], "Replace pitch tier")
    out = call(manip, "Get resynthesis (overlap-add)")
    q = p.replace(".wav", ".tuned.wav"); out.save(q, "WAV")
    clips.append((text, q, dur_of(q)))

# 3. timeline warp: old (story) time -> new (video) time
olds = [caps[g[0]][0] for g in groups] + [END_SCENE]
news = [olds[0]]
for i, (_, _, d) in enumerate(clips):
    news.append(news[-1] + max(olds[i + 1] - olds[i], d + PAUSE))
warp = [(0.0, 0.0)] + list(zip(olds, news)) + [(DUR, news[-1] + (DUR - END_SCENE))]
VDUR = warp[-1][1]
for i, (text, _, d) in enumerate(clips):
    stretch = (news[i + 1] - news[i]) - (olds[i + 1] - olds[i])
    print(f"{news[i]:5.1f}s  {d:4.2f}s  {'+%.2fs' % stretch if stretch > 0.005 else '     '}  {text}")

# 4. caption chunks follow the speech (stored in story time)
for i, g in enumerate(groups):
    d = clips[i][2]
    lens = [len(plain(caps[j][1])) + 1 for j in g]
    total, acc = sum(lens), 0
    for k, j in enumerate(g):
        if k:
            tn = news[i] + d * acc / total
            caps[j][0] = round(olds[i] + (tn - news[i]) * (olds[i + 1] - olds[i]) / (news[i + 1] - news[i]), 2)
        acc += lens[k]
it = iter(caps)
new_body = ENTRY.sub(lambda m: (lambda c: f'[{c[0]:g}, "{c[1]}"]')(next(it)), body)
src = src.replace(body, new_body)
src = re.sub(r"const WARP = \[.*?\];", "const WARP = [" + ", ".join(f"[{a:g}, {b:.2f}]" for a, b in warp) + "];", src, count=1)
open(HTML, "w", encoding="utf-8").write(src)

# 5. mix onto one track, closer and brighter
inputs, filt = [], []
for k, (_, q, _) in enumerate(clips):
    inputs += ["-i", q]
    ms = int(news[k] * 1000)
    filt.append(f"[{k}]adelay={ms}|{ms}[d{k}]")
filt.append("".join(f"[d{k}]" for k in range(len(clips))) +
            f"amix=inputs={len(clips)}:normalize=0,highpass=f=75,"
            "equalizer=f=160:t=q:w=1:g=2,equalizer=f=1200:t=q:w=1:g=1.5,equalizer=f=3500:t=q:w=1.2:g=4,equalizer=f=8000:t=q:w=1:g=2,"
            "acompressor=threshold=0.1:ratio=3:attack=5:release=120,aecho=0.8:0.5:28:0.07,"
            f"loudnorm=I=-16:TP=-1.5,apad=whole_dur={VDUR}[out]")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[out]",
                "-t", f"{VDUR:.2f}", "-ac", "2", "-ar", "44100", "-b:a", "160k", OUT], check=True)
print(f"готово: {OUT}  (видео {VDUR:.1f} с вместо {DUR:g} с)")
