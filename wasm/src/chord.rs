use crate::ChordResult;

/// Chord quality templates as semitone intervals from root.
/// Indices match the QUALITY constants below.
const TEMPLATES: &[&[u8]] = &[
    &[0, 4, 7],       // 0: major
    &[0, 3, 7],       // 1: minor
    &[0, 4, 7, 10],   // 2: dom7
    &[0, 4, 7, 11],   // 3: maj7
    &[0, 3, 7, 10],   // 4: min7
    &[0, 3, 6],       // 5: dim
    &[0, 4, 8],       // 6: aug
    &[0, 2, 7],       // 7: sus2
    &[0, 5, 7],       // 8: sus4
];

const QUALITY_PRIORITY: &[f32] = &[
    1.0,  // major
    0.95, // minor
    0.85, // dom7
    0.80, // maj7
    0.80, // min7
    0.60, // dim
    0.60, // aug
    0.70, // sus2
    0.70, // sus4
];

/// Detect a chord from a 12-bin chroma vector.
/// Returns root (0-11), quality index, and confidence.
pub fn detect_chord_from_chroma(chroma: &[f32; 12]) -> ChordResult {
    let max_energy: f32 = chroma.iter().cloned().fold(0.0f32, f32::max);
    if max_energy < 0.01 {
        return ChordResult { root: 255, quality: 255, confidence: 0.0 };
    }

    let mut norm = [0.0f32; 12];
    for i in 0..12 {
        norm[i] = chroma[i] / max_energy;
    }

    let active_bins = norm.iter().filter(|&&v| v > 0.15).count();
    if active_bins < 3 {
        return ChordResult { root: 255, quality: 255, confidence: 0.0 };
    }

    let mut best_root: u8 = 255;
    let mut best_quality: u8 = 255;
    let mut best_score: f32 = -1.0;

    for root in 0u8..12 {
        for (qi, template) in TEMPLATES.iter().enumerate() {
            let score = match_template(&norm, root, template, QUALITY_PRIORITY[qi]);
            if score > best_score {
                best_score = score;
                best_root = root;
                best_quality = qi as u8;
            }
        }
    }

    if best_score < 0.3 {
        return ChordResult { root: 255, quality: 255, confidence: 0.0 };
    }

    ChordResult {
        root: best_root,
        quality: best_quality,
        confidence: best_score,
    }
}

fn match_template(chroma: &[f32; 12], root: u8, template: &[u8], priority: f32) -> f32 {
    let mut template_energy = 0.0f32;
    let mut total_template_weight = 0.0f32;

    for &interval in template {
        let bin = ((root + interval) % 12) as usize;
        let weight = if interval == 0 { 1.5 } else { 1.0 };
        template_energy += chroma[bin] * weight;
        total_template_weight += weight;
    }

    let match_ratio = template_energy / total_template_weight;

    let mut noise = 0.0f32;
    let mut noise_bins = 0;
    for i in 0..12 {
        let is_template = template.iter().any(|&t| ((root + t) % 12) as usize == i);
        if !is_template && chroma[i] > 0.1 {
            noise += chroma[i];
            noise_bins += 1;
        }
    }
    let noise_penalty = if noise_bins > 0 { noise / (noise_bins as f32 + template.len() as f32) } else { 0.0 };

    let root_bin = root as usize;
    let root_bonus = if chroma[root_bin] > 0.5 { 0.1 } else { 0.0 };

    (match_ratio - noise_penalty * 0.5 + root_bonus) * priority
}
