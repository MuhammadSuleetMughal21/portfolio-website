#!/bin/bash
# Dense frame extraction for the reference screen recording.
# Usage: scripts/extract_frames.sh <video> <outdir>
# Writes: <outdir>/all/      every single decoded frame (no seeking, nothing skipped)
#         <outdir>/scenes/   frames where the picture changes significantly
#         <outdir>/grid2fps/ uniform 2 fps contact sheet source
set -euo pipefail
in="$1"; out="$2"
mkdir -p "$out/all" "$out/scenes" "$out/grid2fps"
ffmpeg -hide_banner -loglevel error -i "$in" -fps_mode passthrough "$out/all/f_%05d.png"
ffmpeg -hide_banner -loglevel error -i "$in" -vf "select='gt(scene,0.08)',showinfo" -fps_mode passthrough "$out/scenes/s_%04d.png" 2>"$out/scenes/showinfo.log" || true
ffmpeg -hide_banner -loglevel error -i "$in" -vf fps=2 "$out/grid2fps/g_%04d.png"
echo "all: $(ls "$out/all" | wc -l)  scenes: $(ls "$out/scenes" | grep -c png || true)  2fps: $(ls "$out/grid2fps" | wc -l)"
