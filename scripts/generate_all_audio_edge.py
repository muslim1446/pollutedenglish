#!/usr/bin/env python3
"""
Bulk neural audio generator — fills EVERY missing vocab + scenario MP3
with real intelligible speech (Edge Neural TTS, en-US-AriaNeural),
normalized to 44.1kHz / 128k / mono MP3 to match human Commons files.
Skips files that already exist and are >1000 bytes (keeps human audio).
"""
import asyncio
import json
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "public", "data", "vocabulary.json")
AUDIO_DIR = os.path.join(ROOT, "public", "audio")
VOICE = os.environ.get("EDGE_VOICE", "en-US-AriaNeural")
CONCURRENCY = int(os.environ.get("EDGE_CONCURRENCY", "10"))
EDGE_MAX = int(os.environ.get("EDGE_MAX", "0"))  # 0 = no limit; e.g. 120 per chunked run

try:
    import edge_tts
except ImportError:
    print("FATAL: edge-tts not installed. Run: pip install edge-tts", flush=True)
    sys.exit(1)


def needs_file(path):
    return (not os.path.exists(path)) or (os.path.getsize(path) < 1000)


def ffmpeg_normalize(src, dst):
    cmd = [
        "ffmpeg", "-y", "-v", "quiet",
        "-i", src,
        "-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", "-ac", "1",
        dst,
    ]
    r = subprocess.run(cmd, capture_output=True)
    return r.returncode == 0 and os.path.exists(dst) and os.path.getsize(dst) > 1000


async def synth_one(sem, text, target, tag):
    async with sem:
        for attempt in range(1, 4):
            tmp = None
            try:
                fd, tmp = tempfile.mkstemp(suffix=".mp3")
                os.close(fd)
                comm = edge_tts.Communicate(text, VOICE)
                await comm.save(tmp)
                if os.path.getsize(tmp) < 500:
                    raise RuntimeError("empty TTS output")
                # normalize in place to target
                os.makedirs(os.path.dirname(target), exist_ok=True)
                tmp2 = target + ".tmp.mp3"
                if ffmpeg_normalize(tmp, tmp2):
                    os.replace(tmp2, target)
                else:
                    # fallback: keep raw edge output
                    os.replace(tmp, target)
                    tmp = None
                return (tag, True, "")
            except Exception as e:
                err = f"{type(e).__name__}: {e}"
                if attempt < 3:
                    await asyncio.sleep(1.5 * attempt)
                    continue
                return (tag, False, err)
            finally:
                try:
                    if tmp and os.path.exists(tmp):
                        os.remove(tmp)
                except Exception:
                    pass


async def main():
    with open(DATA, encoding="utf-8") as f:
        d = json.load(f)
    words = d.get("words", [])
    scenarios = d.get("scenarios", [])
    tasks = []
    for w in words:
        wl = str(w.get("word", "")).lower().strip()
        if not wl:
            continue
        target = os.path.join(AUDIO_DIR, wl + ".mp3")
        if needs_file(target):
            tasks.append((w.get("word", wl), target, f"word:{wl}"))
    for s in scenarios:
        au = s.get("audioUrl", "")
        # expected like /audio/scenario_12.mp3
        rel = au.lstrip("/").replace("/", os.sep)
        target = os.path.join(ROOT, "public", os.path.basename(rel)) if rel.startswith("audio") else os.path.join(ROOT, rel)
        # normalize: public/audio/<file>
        if not target.startswith(AUDIO_DIR):
            target = os.path.join(AUDIO_DIR, os.path.basename(target))
        text = s.get("transcript") or s.get("targetWord") or ""
        if needs_file(target):
            tasks.append((text, target, f"scen:{s.get('id')}"))
    print(f"VOICE={VOICE} CONC={CONCURRENCY} MAX={EDGE_MAX}", flush=True)
    print(f"words={len(words)} scenarios={len(scenarios)} to_generate={len(tasks)}", flush=True)
    if EDGE_MAX > 0:
        tasks = tasks[:EDGE_MAX]
        print(f"chunked run: processing first {len(tasks)}", flush=True)
    if not tasks:
        print("ALL AUDIO PRESENT — nothing to do.", flush=True)
        return
    sem = asyncio.Semaphore(CONCURRENCY)
    done = 0
    failed = []
    batch = []
    for text, target, tag in tasks:
        batch.append(synth_one(sem, text, target, tag))
    for coro in asyncio.as_completed(batch):
        tag, ok, err = await coro
        done += 1
        if not ok:
            failed.append((tag, err))
            print(f"[{done}/{len(tasks)}] FAIL {tag} :: {err}", flush=True)
        else:
            if done % 25 == 0 or done == len(tasks):
                print(f"[{done}/{len(tasks)}] ok ... last={tag}", flush=True)
    print(f"DONE ok={done-len(failed)} fail={len(failed)}", flush=True)
    if failed:
        print("FAILED LIST:", flush=True)
        for t, e in failed[:50]:
            print(f" - {t}: {e}", flush=True)
        sys.exit(2)


if __name__ == "__main__":
    asyncio.run(main())
