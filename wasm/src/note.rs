/// Compute RMS energy of samples.
pub fn compute_rms(samples: &[f32]) -> f32 {
    if samples.is_empty() {
        return 0.0;
    }
    let sum_sq: f32 = samples.iter().map(|&s| s * s).sum();
    (sum_sq / samples.len() as f32).sqrt()
}

/// Convert frequency to MIDI note number and cents deviation.
/// A4 = 440 Hz = MIDI 69
pub fn freq_to_midi_cents(freq: f32) -> (u8, f32) {
    if freq <= 0.0 {
        return (0, 0.0);
    }
    let midi_float = 69.0 + 12.0 * (freq / 440.0).log2();
    let midi_round = midi_float.round();
    let cents = (midi_float - midi_round) * 100.0;
    let midi_u8 = (midi_round as i32).clamp(0, 127) as u8;
    (midi_u8, cents)
}

/// MIDI note to note name index (0=C, 1=C#, ... 11=B)
pub fn midi_to_chroma(midi: u8) -> u8 {
    midi % 12
}
