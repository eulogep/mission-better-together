"""Synthèse locale des récits français. Les modèles Piper sont fournis séparément."""
import json
import sys
from pathlib import Path
from subprocess import run

from piper import PiperVoice, SynthesisConfig

models, output = map(Path, sys.argv[1:])
output.mkdir(parents=True, exist_ok=True)
stories = json.load(sys.stdin)
voices = {}
cue_points = {}

for story in stories:
    story_id = story["id"]
    speaker = {"camille": 1, "samir": 1, "theo": 1, "parent-alex": 0}.get(story_id)
    model = "upmc" if speaker is not None else "siwis"
    if model not in voices:
        voices[model] = PiperVoice.load(models / f"fr_FR-{model}-medium.onnx")
    voice = voices[model]
    config = SynthesisConfig(speaker_id=speaker, length_scale=1.04)
    rate = voice.config.sample_rate
    silence = b"\0\0" * round(rate * 0.34)
    starts = []
    pcm = bytearray()

    for line in story["transcriptFr"]:
        starts.append(round(len(pcm) / (rate * 2), 3))
        line = (line.strip("« »").replace("3018", "trente dix-huit")
                .replace("CPE", "cé pé e").replace("CM2", "cé ème deux"))
        for chunk in voice.synthesize(line, syn_config=config):
            pcm.extend(chunk.audio_int16_bytes)
        pcm.extend(silence)

    destination = output / f"temoignage-{story_id}-fr.mp3"
    temporary = destination.with_suffix(".tmp.mp3")
    run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "s16le", "-ar", str(rate), "-ac", "1", "-i", "pipe:0",
        "-af", "highpass=f=70,loudnorm=I=-18:TP=-2:LRA=7",
        "-ar", str(rate), "-c:a", "libmp3lame", "-b:a", "64k", str(temporary),
    ], input=pcm, check=True)
    temporary.replace(destination)
    cue_points[story_id] = starts

print(json.dumps(cue_points, indent=2, ensure_ascii=False))
