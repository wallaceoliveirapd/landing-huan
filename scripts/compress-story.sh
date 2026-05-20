#!/usr/bin/env bash
# Compress a video for Huan Stories.
#
# H.264 baseline-friendly settings tuned for mobile playback:
#   - libx264 + CRF 23 (visually lossless-ish, ~5-10x smaller than source)
#   - yuv420p pixel format (Safari / iOS compatibility)
#   - faststart so the moov atom sits at the front (instant playback)
#   - AAC audio at 128k stereo
#   - max width 1080 (preserves aspect, no upscaling)
#
# Usage:
#   scripts/compress-story.sh input.mov [output.mp4]
#
# If output is omitted, writes alongside input with .min.mp4 suffix.

set -euo pipefail

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found. Install with: brew install ffmpeg" >&2
  exit 1
fi

IN="${1:-}"
if [[ -z "$IN" || ! -f "$IN" ]]; then
  echo "Usage: $0 <input> [output]" >&2
  exit 1
fi

OUT="${2:-${IN%.*}.min.mp4}"

ffmpeg -y -i "$IN" \
  -vf "scale='min(1080,iw)':'-2':flags=lanczos" \
  -c:v libx264 -preset slow -crf 23 \
  -pix_fmt yuv420p \
  -profile:v high -level 4.0 \
  -movflags +faststart \
  -c:a aac -b:a 128k -ac 2 \
  "$OUT"

IN_SZ=$(du -h "$IN" | cut -f1)
OUT_SZ=$(du -h "$OUT" | cut -f1)
echo ""
echo "✓ $IN ($IN_SZ) → $OUT ($OUT_SZ)"
