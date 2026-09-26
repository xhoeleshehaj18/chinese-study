#!/usr/bin/env python3
"""Generate natural-sounding audio for every word and sentence in js/content.js.

Uses Microsoft's neural voices through edge-tts (pip install edge-tts), and ffmpeg to pad
each clip with a little silence so phones and Bluetooth speakers don't clip the first or
last syllable. Clips are named by a hash of their text, so re-running only makes the
new ones. Run from the project root after editing content.js:

    python3 tools/make_audio.py

Writes audio/*.mp3 and audio/manifest.json ({text: file}). The app plays these and falls
back to the browser's text-to-speech for anything missing.
"""
import asyncio, hashlib, json, os, subprocess, sys, tempfile

import edge_tts

VOICE = 'zh-CN-XiaoxiaoNeural'
RATE = '-10%'  # a touch slower than conversational; the app's speed slider scales from here
OUT = 'audio'
CONCURRENCY = 6

# Every string the app passes to speak(). The clean-up must match speechText() in js/speech.js.
LIST_TEXTS = r"""
const c = await import('./js/content.js');
const texts = new Set(['你好，很高兴认识你']);  // the speed-slider sample on the Me tab
for (const u of c.UNITS) for (const it of u.items) { texts.add(it.zh); texts.add(it.ex[0]); }
for (const s of c.TONE_SETS) s.zh.forEach(z => texts.add(z));
for (const w of c.PAIR_WORDS) texts.add(w.zh);
for (const w of c.CHANGE_WORDS) texts.add(w.zh);
for (const s of c.SOUND_SETS) for (const g of s.groups) for (const [z] of g) texts.add(z);
const clean = t => t.replace(/[…]/g, '').replace(/\s*\/\s*/g, '，').trim();
console.log(JSON.stringify([...new Set([...texts].map(clean))].filter(Boolean)));
"""


def texts():
    out = subprocess.run(['node', '--input-type=module', '-e', LIST_TEXTS],
                         check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def name(text):
    return hashlib.sha1(text.encode()).hexdigest()[:12] + '.mp3'


async def make(text, sem):
    path = os.path.join(OUT, name(text))
    if os.path.exists(path):
        return
    async with sem:
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
            raw = tmp.name
        try:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(text, VOICE, rate=RATE).save(raw)
                    break
                except Exception as e:  # the service drops connections now and then
                    if attempt == 3:
                        raise
                    print(f'retry {text}: {e}', file=sys.stderr)
                    await asyncio.sleep(2 * (attempt + 1))
            # edge-tts leaves up to 1.5 s of silence around the speech: trim it, then pad with
            # a fixed 150 ms lead-in and 250 ms tail. Mono 48 kbps.
            trim = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02'
            proc = await asyncio.create_subprocess_exec(
                'ffmpeg', '-v', 'error', '-y', '-i', raw,
                '-af', f'{trim},areverse,{trim},areverse,adelay=150,apad=pad_dur=0.25',
                '-ac', '1', '-b:a', '48k', path)
            if await proc.wait():
                raise RuntimeError(f'ffmpeg failed on {text}')
        finally:
            os.unlink(raw)
        print('made', text)


async def main():
    os.makedirs(OUT, exist_ok=True)
    all_texts = texts()
    sem = asyncio.Semaphore(CONCURRENCY)
    await asyncio.gather(*(make(t, sem) for t in all_texts))
    manifest = {t: name(t) for t in sorted(all_texts)}
    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=0)
    # Clips whose text is no longer in the course.
    keep = set(manifest.values()) | {'manifest.json'}
    for f in os.listdir(OUT):
        if f not in keep:
            os.unlink(os.path.join(OUT, f))
            print('removed', f)
    print(f'{len(manifest)} clips in {OUT}/')


asyncio.run(main())
