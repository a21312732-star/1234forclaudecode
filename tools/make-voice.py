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
import glob, os, re, subprocess, sys, tempfile
import numpy as np
import parselmouth
from parselmouth.praat import call

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, "index.html")
OUT = os.path.join(ROOT, "voice.mp3")
# Образец голоса для клонирования: *.wav в папке voice-ref/ (в git не попадает). Нет образца — RHVoice.
REF_DIR = os.environ.get("VOICE_REF", os.path.join(ROOT, "voice-ref"))
REFS = sorted(glob.glob(os.path.join(REF_DIR, "*.wav")))
ENGINE = "xtts" if REFS else "rhvoice"

VOICE = "aleksandr-hq"
RATE = 98            # естественный темп (~5 слогов в секунду)
TARGET_F0 = 109.0    # медиана высоты голоса, Гц
RANGE = 1.15         # 1.0 = исходная выразительность, меньше = ровнее
CEIL_F0 = 158.0     # мягкий потолок интонации, Гц
PAUSE = 0.4          # минимальная пауза после фразы, с
# Тембр под образец: разница усреднённых спектров (Гц, дБ), снята по образцу двумя проходами
TIMBRE_EQ = "entry(100,0.0);entry(160,-10.1);entry(250,-12.8);entry(400,-5.2);entry(630,-11.9);entry(1000,0.0);entry(1600,-5.8);entry(2500,-13.0);entry(4000,-13.4);entry(6300,-4.2);entry(10000,1.8)"

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

# 1-2. synthesis
texts = []
for g in groups:
    text = " ".join(plain(caps[i][1]) for i in g)
    for a, b in REPL: text = text.replace(a, b)
    texts.append(text.strip(" ,"))

def trim_to(src_wav, dst_wav):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src_wav, "-af", TRIM, "-ar", "44100", "-ac", "1", dst_wav], check=True)
    return dur_of(dst_wav)

def synth_xtts():
    """Клонирование голоса по образцу (XTTS-v2, лицензия CPML — только некоммерческое использование)."""
    if os.environ.get("COQUI_TOS_AGREED") != "1":
        sys.exit("XTTS-v2 распространяется по Coqui Public Model License (некоммерческое использование).\n"
                 "Если согласны с ней, запустите: COQUI_TOS_AGREED=1 python3 tools/make-voice.py")
    import torch, wave
    from TTS.api import TTS
    torch.set_num_threads(os.cpu_count() or 4)
    model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to("cpu").synthesizer.tts_model
    lat, emb = model.get_conditioning_latents(audio_path=REFS)
    # Проверка распознаванием речи (Whisper): лишние слоги в конце фразы — известная слабость XTTS
    from faster_whisper import WhisperModel
    import difflib
    asr = WhisperModel("medium", device="cpu", compute_type="int8")
    norm = lambda w: re.sub(r"[^а-я0-9]", "", w.lower().replace("ё", "е"))

    def check(path, text):
        """-> (схожесть с текстом 0..1, время конца последнего нужного слова или None)"""
        pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                             capture_output=True, check=True).stdout
        audio = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768
        segs, _ = asr.transcribe(audio, language="ru", word_timestamps=True, beam_size=5)  # без подсказки, иначе не слышит лишнее
        heard = [(norm(w.word), w.end) for sg in segs for w in sg.words if norm(w.word)]
        want = [norm(w) for w in text.split() if norm(w)]
        cut, extra = None, 99  # конец последнего ожидаемого слова и сколько слов после него
        for i in range(len(heard) - 1, -1, -1):
            if difflib.SequenceMatcher(None, heard[i][0], want[-1]).ratio() >= 0.6:
                cut, extra = heard[i][1], len(heard) - 1 - i
                break
        upto = [h for h, _ in heard][:len(heard) - extra] if cut is not None else [h for h, _ in heard]
        # посимвольно: «стаёку» вместо «стояку» — почти совпадение, а пропущенное или лишнее слово — нет
        sim = difflib.SequenceMatcher(None, " ".join(want), " ".join(upto)).ratio()
        return sim, cut, extra

    out = []
    for k, text in enumerate(texts):
        best = None
        for attempt in range(5):
            torch.manual_seed(1000 + 37 * attempt + k)
            wav = np.asarray(model.inference(text, "ru", lat, emb, temperature=0.6, repetition_penalty=5.0,
                                             top_p=0.85, speed=1.0)["wav"], dtype=np.float32)
            raw = os.path.join(tmp, f"{k:02d}.x{attempt}.wav")
            with wave.open(raw, "wb") as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000)
                w.writeframes((np.clip(wav, -1, 1) * 32767).astype(np.int16).tobytes())
            path = os.path.join(tmp, f"{k:02d}.a{attempt}.wav")
            trim_to(raw, path)
            sim, cut, extra = check(path, text)
            key = (round(sim, 2), -min(extra, 3))
            if best is None or key > best[0]:
                best = (key, sim, cut, extra, path)
            if sim >= 0.9 and extra == 0: break
        _, sim, cut, extra, path = best
        if cut is not None:  # обрезаем после последнего слова: бормотание и шум в хвосте
            fixed = path.replace(".wav", ".cut.wav")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-t", f"{cut + 0.12:.2f}",
                            "-af", "afade=t=out:st=%.2f:d=0.08" % (cut + 0.04), fixed], check=True)
            path = fixed
        d = dur_of(path)
        out.append((text, path, d))
        print(f"  [{k + 1}/{len(texts)}] {d:4.2f}s  совпадение {sim:.2f}{'  убрано лишних слов: %d' % extra if cut is not None and extra else ''}  {text}", flush=True)
    return out

def synth_rhvoice():
    raw = []
    for gi, text in enumerate(texts):
        p = os.path.join(tmp, f"{gi:02d}")
        subprocess.run(["RHVoice-test", "-p", VOICE, "-r", str(RATE), "-t", "92", "-o", p + ".rh.wav"], input=text.encode(), check=True)
        trim_to(p + ".rh.wav", p + ".wav")
        raw.append((text, p + ".wav"))
    # intonation: lower and flatten
    all_f0 = []
    for _, p in raw:
        f0 = parselmouth.Sound(p).to_pitch_ac(pitch_floor=60, pitch_ceiling=350).selected_array["frequency"]
        all_f0 += list(f0[f0 > 0])
    src_med = float(np.median(all_f0))
    def reshape(f):
        st = 12 * np.log2(f / src_med) * RANGE
        g = TARGET_F0 * 2 ** (st / 12)
        return g if g <= CEIL_F0 else CEIL_F0 + (g - CEIL_F0) * 0.45
    out = []
    for text, p in raw:
        snd = parselmouth.Sound(p)
        manip = call(snd, "To Manipulation", 0.01, 60, 350)
        tier = call(manip, "Extract pitch tier")
        new = call("Create PitchTier", "new", snd.xmin, snd.xmax)
        for i in range(1, call(tier, "Get number of points") + 1):
            call(new, "Add point", call(tier, "Get time from index", i), reshape(call(tier, "Get value at index", i)))
        call([new, manip], "Replace pitch tier")
        q = p.replace(".wav", ".tuned.wav"); call(manip, "Get resynthesis (overlap-add)").save(q, "WAV")
        out.append((text, q, dur_of(q)))
    return out

print("движок:", ENGINE, *(os.path.basename(r) for r in REFS))
clips = synth_xtts() if ENGINE == "xtts" else synth_rhvoice()

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

# 5. mix onto one track
FX = {
    # клон уже звучит как образец — только лёгкая компрессия
    "xtts": "highpass=f=70,acompressor=threshold=0.12:ratio=2.5:attack=5:release=150,",
    # синтезатор: эквалайзер и тембр под образец
    "rhvoice": "highpass=f=75,equalizer=f=160:t=q:w=1:g=2,equalizer=f=1200:t=q:w=1:g=1.5,equalizer=f=3500:t=q:w=1.2:g=4,"
               "equalizer=f=8000:t=q:w=1:g=2,acompressor=threshold=0.1:ratio=3:attack=5:release=120,aecho=0.8:0.5:28:0.07,"
               f"firequalizer=gain='cubic_interpolate(f)':gain_entry='{TIMBRE_EQ}',",
}
inputs, filt = [], []
for k, (_, q, _) in enumerate(clips):
    inputs += ["-i", q]
    ms = int(news[k] * 1000)
    filt.append(f"[{k}]adelay={ms}|{ms}[d{k}]")
filt.append("".join(f"[d{k}]" for k in range(len(clips))) +
            f"amix=inputs={len(clips)}:normalize=0,{FX[ENGINE]}loudnorm=I=-16:TP=-1.5,apad=whole_dur={VDUR}[out]")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[out]",
                "-t", f"{VDUR:.2f}", "-ac", "2", "-ar", "44100", "-b:a", "160k", OUT], check=True)
print(f"готово: {OUT}  (видео {VDUR:.1f} с вместо {DUR:g} с)")
