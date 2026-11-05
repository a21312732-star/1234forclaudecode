#!/usr/bin/env python3
"""Вставляет рекламный баннер в середину каждой минуты ролика (0:30, 1:30, 2:30 …).

Пока идёт баннер, ролик стоит на паузе и звучит только баннер. Баннер стоит по центру
вертикального кадра на размытом стоп-кадре ролика.
Чтобы не резать диктора на полуслове, точка вставки сдвигается к ближайшей паузе в речи
(не дальше чем на 1,5 с от :30), если рядом с роликом лежит voice.mp3.

Запуск: python3 tools/add-banner.py ads/banner.mp4 ролик.mp4 [ролик2.mp4 …]
Результат: ролик-banner.mp4 рядом с исходником (исходник не меняется).
"""
import os, re, subprocess, sys, tempfile

W, H, FPS, SR = 1080, 1920, 30, 44100
SHIFT = 1.5

def probe(path, entry):
    return subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", entry, "-of", "csv=p=0", path]).decode().strip()

def silences(voice):
    out = subprocess.run(["ffmpeg", "-i", voice, "-af", "silencedetect=n=-38dB:d=0.15", "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    return [(a + b) / 2 for a, b in zip(st, en)]

def run(banner, video):
    dur = float(probe(video, "format=duration"))
    bdur = float(probe(banner, "format=duration"))
    voice = os.path.join(os.path.dirname(os.path.abspath(video)), "voice.mp3")
    mids = silences(voice) if os.path.exists(voice) else []
    points = []
    t = 30.0
    while t < dur - 2:
        near = [m for m in mids if abs(m - t) <= SHIFT]
        points.append(round(min(near, key=lambda m: abs(m - t)) if near else t, 2))
        t += 60
    if not points:
        print(f"{video}: короче 0:32 — баннер не нужен"); return
    tmp = tempfile.mkdtemp()
    # блок баннера для каждой точки: размытый стоп-кадр ролика + баннер по центру + звук баннера
    blocks = []
    for k, p in enumerate(points):
        bg = os.path.join(tmp, f"bg{k}.png")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, p - 0.04):.3f}", "-i", video, "-frames:v", "1", bg], check=True)
        out = os.path.join(tmp, f"block{k}.mp4")
        vf = (f"[0:v]scale={W}:{H},boxblur=28:2,eq=brightness=-0.28[bg];"
              f"[1:v]scale={W}:-2,fps={FPS},format=yuv420p[ad];"
              f"[bg][ad]overlay=(W-w)/2:(H-h)/2:shortest=1,fps={FPS},format=yuv420p[v];[1:a]aresample={SR},aformat=channel_layouts=stereo[a]")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-t", f"{bdur:.3f}", "-i", bg, "-i", banner,
                        "-filter_complex", vf, "-map", "[v]", "-map", "[a]", "-t", f"{bdur:.3f}",
                        "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-c:a", "aac", "-b:a", "160k", "-ar", str(SR), out], check=True)
        blocks.append(out)
    # склейка: кусок ролика → баннер → кусок ролика …
    inputs, parts, cuts = ["-i", video], [], [0.0] + points + [dur]
    for b in blocks: inputs += ["-i", b]
    fc = []
    for k in range(len(cuts) - 1):
        a, b = cuts[k], cuts[k + 1]
        fc.append(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS,fps={FPS},format=yuv420p[v{k}];[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,aresample={SR}[a{k}]")
        parts.append(f"[v{k}][a{k}]")
        if k < len(blocks): parts.append(f"[{k + 1}:v][{k + 1}:a]")
    fc.append("".join(parts) + f"concat=n={len(parts)}:v=1:a=1[v][a]")
    res = re.sub(r"\.mp4$", "", video) + "-banner.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "[v]", "-map", "[a]",
                    "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
                    "-movflags", "+faststart", res], check=True)
    print(f"{res}: баннер на {', '.join(f'{int(p // 60)}:{p % 60:05.2f}' for p in points)} · {float(probe(res, 'format=duration')):.1f} с")

if __name__ == "__main__":
    for v in sys.argv[2:]: run(sys.argv[1], v)
