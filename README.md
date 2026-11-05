# «ТИШИНА» — Часть 1

Вертикальное видео (9:16, ~1:19) в жанре «что бы ты сделал», сделанное целиком на HTML/CSS/JS.

- **`index.html`** — само видео: откройте в браузере и нажмите «▶ СМОТРЕТЬ».
  Анимация, субтитры по словам, звук (синтез через Web Audio) и озвучка `voice.mp3`.
  Если `voice.mp3` не загрузится, читает встроенный голос браузера.
  Пробел — пауза, ←/→ — перемотка на 5 с, кнопка «Голос» выключает озвучку.
- **`tishina.mp4`** — готовый ролик 1080×1920 с озвучкой и звуковыми эффектами (эффекты приглушаются под голосом).
- **`voice.mp3`** — дорожка озвучки (готовая озвучка с сайта синтеза речи, стыки очищены). Таймлайн видео растягивается под речь.
- **`SCENARIO.md`** — сценарий по сценам.
- **`tools/make-voice.py`** — пересоздаёт `voice.mp3` из субтитров и подгоняет под неё тайминги
  (нужны `rhvoice`, `rhvoice-russian`, `ffmpeg` и `pip install praat-parselmouth numpy`). Поменяли текст — запустите его, потом экспорт.
- **`tools/export-mp4.js`** — пересборка MP4 из HTML (нужны Node.js, Playwright и ffmpeg):

```bash
python3 tools/make-voice.py
```

```bash
node tools/export-mp4.js tishina.mp4
```

Параметр `index.html?t=75` открывает видео на нужной секунде.

## Озвучка своим голосом

1. Положите 2–3 фрагмента своего голоса по 10–15 секунд (`*.wav`, без музыки) в папку `voice-ref/` (она не попадает в git).
2. Установите `pip install coqui-tts torch faster-whisper praat-parselmouth numpy`.
3. Запустите (согласие с лицензией XTTS-v2 — только некоммерческое использование):

```bash
COQUI_TOS_AGREED=1 python3 tools/make-voice.py
```

Без папки `voice-ref/` скрипт использует синтезатор RHVoice.

## Озвучка готовым файлом (с сайта синтеза речи)

Сайты часто склеивают mp3 по предложениям — на каждой точке остаются щелчок и обрывающийся «воздух».
Скрипт режет файл на исходные кусочки, срезает хвост после речи (обычно ~0,1 с) с мягким затуханием,
распознаёт слова (Whisper), раскладывает их по фразам сценария, ужимает паузы и подгоняет анимацию:

```bash
VOICE_FILE=путь/к/озвучке.mp3 python3 tools/make-voice.py
```

Нужно: `pip install faster-whisper num2words praat-parselmouth numpy`.

## «Попал в 1991 год»

- `1991-part1/` — часть 1 (без рекламы), `1991-part1.mp4`
- `1991-part2/` — часть 2: «Я знаю, что будет в декабре», `1991-part2.mp4`

### Часть 2

Лежит в папке `1991-part2/` (`index.html`, `SCENARIO.md` с текстом для озвучки, `1991-part2.mp4`).
Те же инструменты, с указанием папки:

```bash
PROJECT=1991-part2 VOICE_FILE=путь/к/озвучке.mp3 python3 tools/make-voice.py
```

```bash
node tools/export-mp4.js 1991-part2/1991-part2.mp4 1991-part2
```

## «Попал в 1812 год»

- `1812-part1/` — часть 1 (`index.html`, `SCENARIO.md` с текстом для озвучки). Видео собирается после озвучки:

```bash
PROJECT=1812-part1 VOICE_FILE=путь/к/озвучке.mp3 python3 tools/make-voice.py
```

```bash
node tools/export-mp4.js 1812-part1/1812-part1.mp4 1812-part1
```

## «Ковчег-4» (заброшенная станция)

- `station-part1/` — часть 1 (`index.html`, `SCENARIO.md` с текстом для озвучки). Видео собирается после озвучки:

```bash
PROJECT=station-part1 VOICE_FILE=путь/к/озвучке.mp3 python3 tools/make-voice.py
```

```bash
node tools/export-mp4.js station-part1/station-part1.mp4 station-part1
```

## Рекламный баннер

`tools/add-banner.py` вставляет баннер (`ads/banner.mp4`) в середину каждой минуты — 0:30, 1:30, … (с подстройкой
до ±1,5 с к паузе в речи). Пока идёт баннер, ролик стоит на паузе и звучит только баннер; баннер — по центру кадра
на размытом стоп-кадре. Готовые версии лежат рядом с роликами как `*-banner.mp4`.

```bash
python3 tools/add-banner.py ads/banner.mp4 1812-part1/1812-part1.mp4
```
