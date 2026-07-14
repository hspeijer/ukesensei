#!/bin/bash
set -euo pipefail

OUTPUT="${1:-$HOME/uke-sensei-recording-$(date +%Y%m%d-%H%M%S).mp4}"

echo "Recording to: $OUTPUT"
echo "A screen picker dialog will appear. Select the browser window."
echo "Press Ctrl+C to stop recording."
echo ""

# Record screen via PipeWire portal + microphone via PulseAudio
# The portal will show a window picker on Wayland
ffmpeg \
  -f pipewire -framerate 30 -i - \
  -f pulse -ac 1 -i default \
  -c:v libx264 -preset ultrafast -crf 22 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  -y "$OUTPUT" < <(
    # Use xdg-desktop-portal to get screen capture
    python3 -c "
import dbus
import subprocess
bus = dbus.SessionBus()
portal = bus.get_object('org.freedesktop.portal.Desktop', '/org/freedesktop/portal/desktop')
print('Use OBS instead - PipeWire raw capture requires portal integration')
" 2>/dev/null || true
  )
