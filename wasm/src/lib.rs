#![allow(dead_code)]

mod fft;
mod pitch;
mod note;
mod chord;

use core::sync::atomic::{AtomicBool, Ordering};

struct GlobalState {
    sample_buf: Vec<f32>,
    chord_chroma: [f32; 12],
    chord_result: ChordResult,
    pitch_state: Option<pitch::PitchDetector>,
    pitch_result: PitchResult,
}

impl GlobalState {
    const fn new() -> Self {
        Self {
            sample_buf: Vec::new(),
            chord_chroma: [0.0; 12],
            chord_result: ChordResult { root: 255, quality: 255, confidence: 0.0 },
            pitch_state: None,
            pitch_result: PitchResult { frequency: 0.0, clarity: 0.0, midi_note: 0, cents: 0.0, rms: 0.0 },
        }
    }
}

static INIT: AtomicBool = AtomicBool::new(false);
static mut STATE_STORAGE: GlobalState = GlobalState::new();

fn state() -> &'static mut GlobalState {
    unsafe { &mut *(&raw mut STATE_STORAGE) }
}

#[repr(C)]
#[derive(Clone, Copy)]
pub struct PitchResult {
    pub frequency: f32,
    pub clarity: f32,
    pub midi_note: u8,
    pub cents: f32,
    pub rms: f32,
}

#[repr(C)]
#[derive(Clone, Copy)]
pub struct ChordResult {
    pub root: u8,
    pub quality: u8,
    pub confidence: f32,
}

#[unsafe(no_mangle)]
pub extern "C" fn alloc(len: usize) -> *mut f32 {
    let s = state();
    s.sample_buf.resize(len, 0.0);
    s.sample_buf.as_mut_ptr()
}

#[unsafe(no_mangle)]
pub extern "C" fn init(sample_rate: f32, buf_size: usize) {
    let s = state();
    s.sample_buf = vec![0.0; buf_size];
    s.pitch_state = Some(pitch::PitchDetector::new(buf_size, sample_rate));
    INIT.store(true, Ordering::Release);
}

#[unsafe(no_mangle)]
pub extern "C" fn analyze_pitch() -> *const PitchResult {
    let s = state();
    let rms = note::compute_rms(&s.sample_buf);

    if rms < 0.005 {
        s.pitch_result = PitchResult { frequency: 0.0, clarity: 0.0, midi_note: 0, cents: 0.0, rms };
        return &s.pitch_result as *const PitchResult;
    }

    if let Some(ref mut detector) = s.pitch_state {
        let (freq, clarity) = detector.detect(&s.sample_buf);
        if freq > 0.0 && clarity > 0.0 {
            let (midi, cents) = note::freq_to_midi_cents(freq);
            s.pitch_result = PitchResult { frequency: freq, clarity, midi_note: midi, cents, rms };
        } else {
            s.pitch_result = PitchResult { frequency: 0.0, clarity: 0.0, midi_note: 0, cents: 0.0, rms };
        }
    }
    &s.pitch_result as *const PitchResult
}

#[unsafe(no_mangle)]
pub extern "C" fn get_chroma_ptr() -> *mut f32 {
    let s = state();
    s.chord_chroma.as_mut_ptr()
}

#[unsafe(no_mangle)]
pub extern "C" fn detect_chord() -> *const ChordResult {
    let s = state();
    s.chord_result = chord::detect_chord_from_chroma(&s.chord_chroma);
    &s.chord_result as *const ChordResult
}

#[unsafe(no_mangle)]
pub extern "C" fn get_sample_ptr() -> *const f32 {
    let s = state();
    s.sample_buf.as_ptr()
}

#[unsafe(no_mangle)]
pub extern "C" fn get_buf_size() -> usize {
    let s = state();
    s.sample_buf.len()
}
