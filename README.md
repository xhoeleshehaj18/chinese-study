# 说中文 · Speak Chinese

A speaking-first Mandarin study app for beginners. Static site — no build step, no login. Runs on GitHub Pages.

## Method
One thing at a time. The course is a path of 16 stages, and each one unlocks only when you've mastered the one before it.

| # | Stage | Pass mark |
|---|-------|-----------|
| 1 | 👂 Hear the four tones (single syllables) | 49 of your last 50 (98%) |
| 2 | 👂 Hear tone pairs (two-syllable words) | 49 of your last 50 |
| 3 | 👂 Hear tricky sounds (zh/j/z, ch/q/c, sh/x/s, u/ü, n/ng, r/l, aspiration) | 49 of your last 50 |
| 4 | 🗣 Say the four tones (graded from your voice's pitch) | 45 of your last 50 (90%, because pitch tracking isn't precise enough for 98%) |
| 5–16 | Phrase units | A unit test on a later day: every phrase both ways, 98% of questions right (a perfect score for units under 50 questions), one try per day |

Inside a phrase unit:
- **Spaced repetition (FSRS)** brings each phrase back right before you'd forget it. Earlier units stay in review.
- **Two cards per phrase**: 👂 *Listen* (hear it, recall the meaning) and 🗣 *Speak* (see English, say it aloud). Speech recognition checks you when the browser supports it; otherwise you record yourself and compare. Speak cards have a hint button, and using a hint caps your rating at Hard.
- New phrases come in pairs: meet them, then get quizzed straight away. Missed cards come back when they're actually due, with a countdown if you're waiting.
- **Shadowing** of example sentences opens on the Path tab once you know a few phrases.
- Pinyin comes first, with tone colours (1 red · 2 orange · 3 green · 4 blue). Simplified characters are shown alongside and can be hidden.

You can skip a stage on the **Me** tab if you already know it.

## Files
- `js/content.js`: phrase units, tone syllables, tone-pair words and sound contrasts. Add units here.
- `js/path.js`: stage list, pass marks and unlocking.
- `js/store.js`: progress in `localStorage` and FSRS scheduling ([ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs), MIT, vendored in `vendor/`).
- `js/speech.js`: text-to-speech, speech recognition, recording, pitch detection.
- `js/tone-grade.js`: classifies a pitch contour as tone 1–4.
- `js/app.js`: UI.

## Run locally
```
python3 -m http.server 8123
```
Then open http://localhost:8123.

Progress lives in the browser. Use **Me → Export** to back it up or move it to another device.
