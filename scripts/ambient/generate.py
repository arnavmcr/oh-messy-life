#!/usr/bin/env python3
"""Generate ambient audio clips with ElevenLabs (sound effects + music).

Usage:
  python3 scripts/ambient/generate.py            # dry run: lists clips + estimated cost
  python3 scripts/ambient/generate.py --yes      # actually generate (spends API credit)
  python3 scripts/ambient/generate.py --yes --only pawnshop

Clips are saved to public/audio/<entry>/<id>.mp3. Existing files are skipped
unless --force is passed. Reads ELEVENLABS_API_KEY from .env.local.
Estimates use the published API rates (~$0.12/min SFX, ~$0.15/min music).
"""
import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SFX_URL = "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128"
MUSIC_URL = "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128"
RATE_PER_MIN = {"sfx": 0.12, "music": 0.15}

ENTRY = "october-november-26"
CLIPS = [
    # Music API needs a paid plan (402 on free), so the stinger uses the SFX endpoint.
    {"id": "stinger", "kind": "sfx", "seconds": 24,
     "prompt": "lush ethereal shoegaze ambient piece, layers of shimmering reverb-drenched electric guitars swelling and receding, warm evolving synth pads, slow dreamy melody, soft tape haze, deep stereo width, gentle crescendo then a long soft fade out, no drums"},
    {"id": "pawnshop", "kind": "sfx", "seconds": 14,
     "prompt": "old school Berlin techno, slow steady four-on-the-floor kick at 125 bpm, deep dubby chord stabs, hypnotic repetitive minimal groove, dark warehouse atmosphere, analog hi-hats, immediate start with no long intro, heard in a club with a subtle crowd, heavy but spacious and groovy, not fast"},
    {"id": "cops", "kind": "sfx", "seconds": 8,
     "prompt": "bass-heavy house music at a house party cutting off abruptly, crowd groaning, police siren approaching outside"},
    {"id": "tides", "kind": "sfx", "seconds": 14,
     "prompt": "soft ocean waves on a quiet beach beneath lush ambient pads, Jon Hopkins meets Sigur Ros, slowly evolving warm synth textures, glacial swelling strings-like pads, soft airy choral-like tones, no guitar, no drums, hazy sunset, spacious and emotional"},
]


def load_key() -> str:
    for line in (ROOT / ".env.local").read_text().splitlines():
        if line.startswith("ELEVENLABS_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("[FAIL] ELEVENLABS_API_KEY not found in .env.local")


def generate(clip: dict, key: str) -> bytes:
    if clip["kind"] == "sfx":
        url = SFX_URL
        body = {"text": clip["prompt"], "duration_seconds": clip["seconds"],
                "prompt_influence": 0.5, "model_id": "eleven_text_to_sound_v3"}
    else:
        url = MUSIC_URL
        body = {"prompt": clip["prompt"], "music_length_ms": clip["seconds"] * 1000,
                "model_id": "music_v2_5", "force_instrumental": True}
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(), method="POST",
        headers={"xi-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        return resp.read()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--yes", action="store_true", help="confirm and spend credit")
    ap.add_argument("--force", action="store_true", help="overwrite existing files")
    ap.add_argument("--only", help="comma-separated clip ids")
    args = ap.parse_args()

    only = set(args.only.split(",")) if args.only else None
    clips = [c for c in CLIPS if not only or c["id"] in only]
    out_dir = ROOT / "public" / "audio" / ENTRY

    total = 0.0
    for c in clips:
        cost = c["seconds"] / 60 * RATE_PER_MIN[c["kind"]]
        total += cost
        exists = (out_dir / f"{c['id']}.mp3").exists() and not args.force
        print(f"  {c['id']:<9} {c['kind']:<5} {c['seconds']:>3}s  ~${cost:.3f}  {'[exists, skip]' if exists else ''}")
        print(f"            {c['prompt']}")
    print(f"\nEstimated total: ~${total:.2f}")
    if not args.yes:
        print("Dry run. Re-run with --yes to generate.")
        return

    key = load_key()
    out_dir.mkdir(parents=True, exist_ok=True)
    for c in clips:
        path = out_dir / f"{c['id']}.mp3"
        if path.exists() and not args.force:
            print(f"[SKIP] {c['id']}")
            continue
        try:
            path.write_bytes(generate(c, key))
            print(f"[OK]   {c['id']} -> {path.relative_to(ROOT)} ({path.stat().st_size // 1024} KB)")
        except urllib.error.HTTPError as e:
            print(f"[FAIL] {c['id']}: HTTP {e.code} {e.read().decode()[:300]}")


if __name__ == "__main__":
    main()
