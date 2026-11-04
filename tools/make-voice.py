#!/usr/bin/env python3
"""Генерирует озвучку voice.mp3 из субтитров index.html (голос RHVoice).

Требуется: sudo apt install rhvoice rhvoice-russian ffmpeg
Запуск:    python3 tools/make-voice.py

Что делает:
  1. Читает массив CAPS из index.html и группирует куски субтитров во фразы.
  2. Синтезирует каждую фразу; если не влезает до следующей — ускоряет (до 135%).
  3. Переставляет время внутренних кусков субтитров под реальную речь
     и записывает обратно в index.html.
  4. Собирает одну дорожку voice.mp3 длиной во всё видео.
"""
import math, os, re, subprocess, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, "index.html")
OUT = os.path.join(ROOT, "voice.mp3")
VOICE, PITCH, BASE_RATE, MAX_RATE = "aleksandr-hq", 88, 108, 135
REPL = [("2:47", "два сорок семь"), ("40 децибел", "сорок децибел"), ("31 децибел", "тридцать один децибел"),
        ("120 литров", "сто двадцать литров"), ("3:30", "три тридцать"), ("3:41", "Три сорок одна"),
        ("«", ""), ("»", ""), (" —", ",")]

src = open(HTML, encoding="utf-8").read()
m = re.search(r"const CAPS = \[\n(.*?)\n\];", src, re.S)
body = m.group(1)
ENTRY = re.compile(r'\[(\d+(?:\.\d+)?), "((?:[^"\\]|\\.)*)"\]')
caps = [[float(t), txt] for t, txt in ENTRY.findall(body)]
dur_total = float(re.search(r"const DUR = (\d+(?:\.\d+)?)", src).group(1))
end_scene = float(re.findall(r'\{ id: "s\d", s: (\d+(?:\.\d+)?), e: [\d.]+ \}', src)[-1])

plain = lambda s: re.sub(r"\{\w:([^}]*)\}", r"\1", s).strip()
groups, cur = [], []
for i, (t, txt) in enumerate(caps):
    if not plain(txt): continue
    cur.append(i)
    if re.search(r"[.!?:»—]$", plain(txt)): groups.append(cur); cur = []
if cur: groups.append(cur)

tmp = tempfile.mkdtemp()
def synth(text, rate, path):
    subprocess.run(["RHVoice-test", "-p", VOICE, "-r", str(rate), "-t", str(PITCH), "-o", path + ".raw.wav"],
                   input=text.encode(), check=True)
    af = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path + ".raw.wav", "-af", af, "-ar", "44100", "-ac", "1", path], check=True)
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]))

clips = []
for gi, g in enumerate(groups):
    start = caps[g[0]][0]
    nxt = caps[groups[gi + 1][0]][0] if gi + 1 < len(groups) else end_scene
    window = nxt - start - 0.12
    text = " ".join(plain(caps[i][1]) for i in g)
    for a, b in REPL: text = text.replace(a, b)
    text = text.strip(" ,")
    path = os.path.join(tmp, f"{gi:02d}.wav")
    d = synth(text, 100, path)
    rate = min(MAX_RATE, max(BASE_RATE, math.ceil(100 * d / window)))
    d = synth(text, rate, path)
    flag = "  !! не влезает" if d > window + 0.05 else ""
    print(f"{start:5.1f}s  {d:4.2f}/{window:4.2f}s  rate {rate}%  {text}{flag}")
    clips.append((start, path))
    # inner caption chunks follow the speech, proportionally to characters
    lens = [len(plain(caps[i][1])) + 1 for i in g]
    total, acc = sum(lens), 0
    for k, i in enumerate(g):
        if k: caps[i][0] = round(start + d * acc / total, 2)
        acc += lens[k]

# write caption timings back
it = iter(caps)
new_body = ENTRY.sub(lambda mm: (lambda c: f'[{c[0]:g}, "{c[1]}"]')(next(it)), body)
open(HTML, "w", encoding="utf-8").write(src.replace(body, new_body))

# mix all clips onto one timeline track
inputs, filt = [], []
for k, (t, p) in enumerate(clips):
    inputs += ["-i", p]
    ms = int(t * 1000)
    filt.append(f"[{k}]adelay={ms}|{ms}[d{k}]")
mix = "".join(f"[d{k}]" for k in range(len(clips)))
filt.append(f"{mix}amix=inputs={len(clips)}:normalize=0,aecho=0.8:0.6:45:0.18,"
            f"highpass=f=70,loudnorm=I=-16:TP=-1.5,apad=whole_dur={dur_total}[out]")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[out]",
                "-t", str(dur_total), "-ac", "2", "-ar", "44100", "-b:a", "160k", OUT], check=True)
print("готово:", OUT)
