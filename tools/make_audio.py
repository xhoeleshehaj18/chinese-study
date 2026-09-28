#!/usr/bin/env python3
"""Generate natural-sounding audio for every word and sentence in js/content.js.

Uses Microsoft's neural voices through edge-tts (pip install edge-tts), and ffmpeg to pad
each clip with a little silence so phones and Bluetooth speakers don't clip the first or
last syllable. Clips are named by a hash of their voice and text, so re-running only makes
the new ones. Run from the project root after editing content.js:

    python3 tools/make_audio.py

Writes audio/*.mp3 and audio/manifest.json ({text: {voice: file}}), listing only the clips
that exist, so a run that can't reach the voice service still leaves a working manifest.
The app plays these and falls back to the browser's text-to-speech for anything missing.
"""
import asyncio, hashlib, json, os, subprocess, sys, tempfile

import edge_tts

# Short name → edge-tts voice. Keep in step with VOICE_INFO in js/speech.js.
VOICES = {
    'xiaoxiao': 'zh-CN-XiaoxiaoNeural',  # the default: every text has a clip in this voice
    'xiaoyi': 'zh-CN-XiaoyiNeural',
    'yunjian': 'zh-CN-YunjianNeural',
    'yunxi': 'zh-CN-YunxiNeural',
    'yunxia': 'zh-CN-YunxiaNeural',
    'yunyang': 'zh-CN-YunyangNeural',
}
DEFAULT = 'xiaoxiao'
# Which voices each kind of text is recorded in. Hearing tones and sounds from several speakers
# trains the tone itself rather than one voice's version of it, so the sound drills get all six.
# Phrases and numbers are longer clips, so they get two (a female and a male voice) to keep the
# offline download small.
VOICES_FOR = {
    'sound': list(VOICES),
    'phrase': [DEFAULT, 'yunxi'],
    'number': [DEFAULT, 'yunxi'],
    'other': [DEFAULT],
}
RATE = '-10%'  # a touch slower than conversational; the app's speed slider scales from here
OUT = 'audio'
CONCURRENCY = 6

# Every string the app passes to speak(), by kind. The clean-up must match speechText() in js/speech.js.
LIST_TEXTS = r"""
const c = await import('./js/content.js');
const n = await import('./js/numbers.js');
const kinds = {
  other: ['你好，很高兴认识你'],  // the speed-slider sample on the Me tab
  phrase: c.UNITS.flatMap(u => u.items.flatMap(it => [it.zh, it.ex[0]])),
  sound: [
    ...c.TONE_SETS.flatMap(s => s.zh), ...c.PAIR_WORDS.map(w => w.zh), ...c.CHANGE_WORDS.map(w => w.zh),
    ...c.SOUND_SETS.flatMap(s => s.groups.flatMap(g => g.map(([z]) => z))),
  ],
  number: n.NUMBER_SETS.flatMap(set => set.map(x => x.zh)),
};
const clean = t => t.replace(/[…]/g, '').replace(/\s*\/\s*/g, '，').trim();
for (const k in kinds) kinds[k] = [...new Set(kinds[k].map(clean))].filter(Boolean);
console.log(JSON.stringify(kinds));
"""


def wanted():
    """{text: [voices]}: every text in the voices its kinds call for, the default voice first."""
    out = subprocess.run(['node', '--input-type=module', '-e', LIST_TEXTS],
                         check=True, capture_output=True, text=True).stdout
    voices = {}
    for kind, texts in json.loads(out).items():
        for t in texts:
            voices.setdefault(t, set()).update(VOICES_FOR[kind])
    return {t: sorted(vs, key=list(VOICES).index) for t, vs in voices.items()}


def name(text, voice):
    # Default-voice clips keep the plain text hash they've always had.
    key = text if voice == DEFAULT else f'{voice}|{text}'
    return hashlib.sha1(key.encode()).hexdigest()[:12] + '.mp3'


async def make(text, voice, sem, failed, run):
    path = os.path.join(OUT, name(text, voice))
    if os.path.exists(path):
        return
    async with sem:
        # Several failures in a row: the service is unreachable, so don't sit through the
        # retries for every remaining clip.
        if run['streak'] >= CONCURRENCY:
            failed.append((text, voice))
            return
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
            raw = tmp.name
        try:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(text, VOICES[voice], rate=RATE).save(raw)
                    break
                except Exception as e:  # the service drops connections now and then
                    if attempt == 3:
                        print(f'failed {voice} {text}: {e}', file=sys.stderr)
                        failed.append((text, voice))
                        run['streak'] += 1
                        return
                    print(f'retry {voice} {text}: {e}', file=sys.stderr)
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
        run['streak'] = 0
        print('made', voice, text)


async def main():
    os.makedirs(OUT, exist_ok=True)
    texts = wanted()
    sem = asyncio.Semaphore(CONCURRENCY)
    failed, run = [], {'streak': 0}
    await asyncio.gather(*(make(t, v, sem, failed, run) for t, vs in texts.items() for v in vs))
    # Only clips that exist go in the manifest.
    manifest = {}
    for t in sorted(texts):
        have = {v: name(t, v) for v in texts[t] if os.path.exists(os.path.join(OUT, name(t, v)))}
        if have:
            manifest[t] = have
    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=0)
    # Clips whose text (or voice) is no longer in the course.
    keep = {name(t, v) for t, vs in texts.items() for v in vs} | {'manifest.json'}
    for f in os.listdir(OUT):
        if f not in keep:
            os.unlink(os.path.join(OUT, f))
            print('removed', f)
    clips = sum(len(v) for v in manifest.values())
    print(f'{clips} clips for {len(manifest)} texts in {OUT}/')
    if failed:
        print(f'{len(failed)} clips could not be made (is the voice service reachable?). '
              'The app says those in another voice or with the browser voice. Run this again to fill them in.',
              file=sys.stderr)
        sys.exit(1)


asyncio.run(main())
