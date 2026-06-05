# Uke Sensei

A browser-based ukulele practice companion that listens to your playing, detects notes and chords in real time, visualizes everything on an interactive fretboard, and guides you through scale exercises.

## Features

### Real-time note detection
Uses your microphone and the McLeod Pitch Method to detect what note you're playing with sub-cent accuracy. A live tuning meter shows how sharp or flat you are, and the detected note lights up on the fretboard instantly.

### Chord detection and diagrams
When you strum a chord, Uke Sensei identifies it from the notes ringing within a short time window. The detected chord is displayed as a standard ukulele fretting diagram showing finger positions, open strings, and barres. Supports major, minor, 7th, maj7, min7, diminished, augmented, sus2, sus4, and more.

### Interactive SVG fretboard
A custom-rendered 4-string, 15-fret ukulele fretboard that shows:
- Detected notes highlighted in real time with a pulse animation
- Scale patterns color-coded with root notes emphasized
- Exercise targets with a glow effect
- Fret markers at positions 5, 7, 10, and 12

The fretboard can be **flipped** so the lowest-pitched string appears on top -- useful if you prefer to see the fretboard matching your perspective when looking down at your uke.

### Tuning support with auto-detection
Supports both Standard (High G) and Low G tunings. You can select your tuning manually, or just start playing -- when the app hears your open G string it automatically detects whether you're using high G or low G and switches accordingly.

### Scale exercises
Practice scales in all 12 keys across 10 scale types:
- **7 modes**: Ionian (Major), Dorian, Phrygian, Lydian, Mixolydian, Aeolian (Natural Minor), Locrian
- **Pentatonic**: Major and Minor
- **Blues**

That's 120 key/scale combinations. Each exercise guides you note-by-note up the fretboard, highlighting the next target and telling you the string and fret to play.

### Performance feedback
After completing an exercise you get a summary with:
- Accuracy percentage
- Average cents deviation (how in-tune you were)
- Total time
- A performance rating
- A contextual suggestion for what to practice next

### Dark / light mode
Toggle between dark and light themes. Your preference is saved in the browser.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and click **Start Listening** to begin.

## How to use

### Free Play
Start the microphone and play your ukulele. The fretboard lights up showing which notes you're hitting. Use the scale overlay controls to display any scale/mode and see how your playing relates to it.

### Exercises
Switch to the Exercises tab, pick a key and scale, then hit Start Exercise. Play each highlighted note to advance through the scale. Hold each note briefly (~200ms) for it to register. When you finish, review your accuracy and get a suggestion for what to try next.

### Chord detection
Strum any chord and the chord name and fretting diagram appear alongside the fretboard. The detector identifies chords from the notes it hears within a short window, so single notes won't trigger false chord detections.

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS
- pitchy (McLeod Pitch Method for pitch detection)
- Zustand (state management)
- Custom SVG rendering for fretboard and chord diagrams
