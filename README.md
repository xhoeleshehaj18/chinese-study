# 说中文 · Speak Chinese

A speaking-first Mandarin study app for beginners. Static site — no build step, no login. Runs on GitHub Pages.

## Method
One thing at a time. The course is a path of 20 stages, and each one unlocks only when you've mastered the one before it.

| # | Stage | Pass mark |
|---|-------|-----------|
| 1 | 👂 Hear the four tones (draw the tone of a single syllable) | 49 of your last 50 (98%) |
| 2 | 👂 Hear tone pairs (draw both tones of a two-syllable word) | 49 of your last 50 |
| 3 | 👂 Hear tone changes (draw the tones as said: neutral tone, 3–3 → 2–3, 不 and 一) | 49 of your last 50 |
| 4 | 👂 Hear tones in phrases (draw the missing tones of a natural phrase, in 4 levels) | 49 of your last 50 on each level |
| 5 | 👂 Hear tricky sounds (zh/j/z, ch/q/c, sh/x/s, u/ü, n/ng, r/l, aspiration) | 49 of your last 50 |
| 6 | 🗣 Say the four tones (graded from your voice's pitch) | 45 of your last 50 (90%, because pitch tracking isn't precise enough for 98%) |
| 7 | 🗣 Say tone pairs (two-syllable words, each syllable checked) | 40 of your last 50 syllables (80%, because splitting a word into syllables makes pitch tracking less reliable still) |
| 8–10 | Phrase units 1–3 (up to "Numbers 1–10") | A unit test on a later day: every phrase both ways, 98% of questions right (a perfect score for units under 50 questions), one try per day |
| 11 | 👂 Catch the numbers (hear a number, type it: 11–99, hundreds, prices in 块, phone numbers, in 4 levels) | 49 of your last 50 on each level |
| 12–20 | Phrase units 4–12 | As above |

Inside a phrase unit:
- **Spaced repetition (FSRS)** brings each phrase back right before you'd forget it. Earlier units stay in review.
- **Two cards per phrase**: 👂 *Listen* (hear it, recall the meaning) and 🗣 *Speak* (see English, say it aloud). Speech recognition checks you when the browser supports it; otherwise you record yourself and compare. Speak cards have a hint button, and using a hint caps your rating at Hard.
- New phrases come in pairs: meet them, then get quizzed straight away. Missed cards come back when they're actually due, with a countdown if you're waiting.
- **Shadowing** of example sentences opens on the Path tab once you know a few phrases.
- Pinyin comes first, with tone colours (1 red · 2 orange · 3 green · 4 blue). Simplified characters are shown alongside and can be hidden.
- Pinyin shows the written tones, so where a tone is said differently (3–3 → 2–3), a line under it says so: *Tone change: nǐ → ní*. In a run of three or more 3rd tones, the changes that depend on phrasing are marked "(often)".
- Many phrases also show a word-by-word meaning (你叫什么名字 is literally "you are called what name?"), and short notes cover the grammar and usage beginners trip over: no word for "yes", 很 isn't always "very", 是 doesn't go with adjectives, measure words, and word pairs that differ only in tone (买 mǎi / 卖 mài, 哪里 / 那里).

**Drawing tones.** All four hearing stages have you draw the tones you hear rather than pick numbers: stage 1 one tone, stage 2 both tones of a word, stage 3 the tones as actually said (tap for a neutral tone), and stage 4 the missing tones of a phrase. In stages 1 and 2 there are no light tones, so a tap asks for the tone's shape and isn't counted. A wrong single tone also offers 🔊 Compare, which plays the syllable you drew and then the right one. In stages 2 and 3 a word counts as right when all its tones are.

**Hear tones in phrases** plays a word or example sentence from the phrase units and shows its pinyin with some tones left out. You draw each missing tone in turn on a pad with high, mid and low guide lines, and your stroke snaps to the tone it matches. Height counts: a fall from the top is a 4th tone, and anything that stays low (a low dip, a low fall, a low level line) is a 3rd tone, so the half-3rd said before another tone counts. A tap is a light (neutral) tone. A stroke that isn't a tone shape (too small, a hump, a zigzag) asks you to draw again and isn't counted. A right tone turns its box green and moves on; a wrong one turns it red, draws the right contour over yours and replays the phrase. Either way you can draw the next tone straight away (after a wrong one, Continue also moves on). Level 1 leaves out one tone in a 2–4 syllable phrase, level 2 two tones, level 3 three tones in phrases of 5+ syllables, and level 4 every tone. Each tone counts as one answer; at 49 of the last 50 you move up a level and the count starts again. The answer is the tone as spoken (你好 is ní hǎo). In a run of three or more 3rd tones, which ones become 2nd tones depends on phrasing, so those syllables are shown with a dotted underline and never asked (the last one, which always stays 3rd, is).

**Say tone pairs** shows a word from stage 2 and records you. It splits your pitch into the two syllables (at the break in your voice between them, or where the pitch jumps) and checks each against rules for its tone: a 1st tone level and not lower than the other syllable, a 2nd tone climbing, a 3rd tone lower than the other syllable, a 4th tone dropping. Tested on recordings of two native voices at two speeds, it accepts about 80% of correctly said syllables and about 20% of wrong ones, which is why the pass mark is lower and the pitch picture is the main guide. "Don't count this one" takes back both syllables.

**Warm-up.** Before the first phrase session of each day, you get about 10 quick questions mixed from the listening stages you've passed, leaning towards what you've been missing. You can skip it.

Drills lean towards what you get wrong: a tone, word or sound you miss comes up more often until you get it right again.

**Checking your tones.** Speech recognition only checks the *words*. It usually accepts the right words said with the wrong tones, so a match is labelled "Understood" rather than "Perfect". The 📈 button records you and draws your pitch next to the expected melody (model on the left, you on the right). The model is drawn from the pinyin with tone changes applied, because the browser won't let the app measure its own text-to-speech audio. On Speak cards and in tests, the model stays hidden until you reveal the answer.

You can skip a stage on the **Me** tab if you already know it.

## Files
- `js/content.js`: phrase units, tone syllables, tone-pair words and sound contrasts. Add units here, then regenerate the audio (below).
- `audio/`: a natural-voice clip (Microsoft's neural voice Xiaoxiao, via [edge-tts](https://github.com/rany2/edge-tts)) for every word and sentence the app says, named by a hash of the text, plus `manifest.json`. Anything without a clip falls back to the browser's own text-to-speech, which sounds more robotic.
- `tools/make_audio.py`: makes the clips. After editing `content.js`, run `python3 tools/make_audio.py` (needs `pip install edge-tts` and ffmpeg). It only makes new clips and deletes ones no longer used.
- `js/path.js`: stage list, pass marks, levels and unlocking.
- `js/numbers.js`: how numbers, prices and phone numbers are said, and the fixed set of them for "Catch the numbers" (fixed so each has a clip; `make_audio.py` reads it).
- `js/phrase-tones.js`: the phrases and levels for "Hear tones in phrases", built from `content.js`, with spoken tones worked out by `pitch-view.js`.
- `js/store.js`: progress in `localStorage` and FSRS scheduling ([ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs), MIT, vendored in `vendor/`).
- `js/speech.js`: text-to-speech, speech recognition, recording, pitch detection.
- `js/tone-grade.js`: classifies a pitch contour as tone 1–4, and checks each syllable of a two-syllable word against its tone.
- `js/pitch-view.js`: expected phrase melody (with tone changes) and the side-by-side pitch picture.
- `js/app.js`: UI.

## Run locally
```
python3 -m http.server 8123
```
Then open http://localhost:8123.

Progress lives in the browser. Use **Me → Export** to back it up or move it to another device; the Today tab reminds you if it's been two weeks. The app also asks the browser to keep its storage persistent.

`sw.js` caches the app for offline use. Add any new file to its `CORE` list (and to `FILES` in `js/update.js`) and bump `CACHE`. Voice clips go in a separate cache that survives updates: the service worker downloads all of them (about 4 MB) in the background when a new version activates, and caches any others as they're played. Bump `CACHE` after regenerating the audio so new clips are downloaded for offline use too.

`js/update.js` checks for a new version whenever the app is opened or brought back to the foreground. It compares each file's ETag / Last-Modified with the copy that's running, so there's no version number to bump. A pill slides down from the top while it checks ("Checking for updates…" → "Up to date", then it slides away). When something changed, it offers **Update**, shows the download progress and restarts the app. Me → App updates has **Check now** and **Force update**; Force update re-downloads every file past the browser cache before reloading, so it's safe to press offline.
