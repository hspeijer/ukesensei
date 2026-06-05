/// McLeod Pitch Method (MPM) implementation.
pub struct PitchDetector {
    buf_size: usize,
    sample_rate: f32,
    nsdf: Vec<f32>,
}

impl PitchDetector {
    pub fn new(buf_size: usize, sample_rate: f32) -> Self {
        Self {
            buf_size,
            sample_rate,
            nsdf: vec![0.0; buf_size],
        }
    }

    pub fn detect(&mut self, samples: &[f32]) -> (f32, f32) {
        let n = samples.len().min(self.buf_size);
        if n < 2 {
            return (0.0, 0.0);
        }

        self.compute_nsdf(samples, n);
        self.find_pitch(n)
    }

    fn compute_nsdf(&mut self, x: &[f32], n: usize) {
        for tau in 0..n {
            let mut acf = 0.0f32;
            let mut divisor = 0.0f32;
            let limit = n - tau;
            for j in 0..limit {
                acf += x[j] * x[j + tau];
                divisor += x[j] * x[j] + x[j + tau] * x[j + tau];
            }
            self.nsdf[tau] = if divisor > 0.0 { 2.0 * acf / divisor } else { 0.0 };
        }
    }

    fn find_pitch(&self, n: usize) -> (f32, f32) {
        let mut max_positions: Vec<(usize, f32)> = Vec::new();
        let mut was_negative = true;
        let mut max_val = f32::NEG_INFINITY;
        let mut max_idx = 0;

        let min_tau = (self.sample_rate / 1200.0).ceil() as usize;
        let max_tau = (self.sample_rate / 60.0).floor() as usize;
        let search_end = n.min(max_tau + 1);

        for tau in min_tau..search_end {
            let val = self.nsdf[tau];
            if val < 0.0 {
                if !was_negative && max_val > 0.0 {
                    max_positions.push((max_idx, max_val));
                }
                was_negative = true;
                max_val = f32::NEG_INFINITY;
            } else {
                was_negative = false;
                if val > max_val {
                    max_val = val;
                    max_idx = tau;
                }
            }
        }
        if !was_negative && max_val > 0.0 {
            max_positions.push((max_idx, max_val));
        }

        if max_positions.is_empty() {
            return (0.0, 0.0);
        }

        let global_max = max_positions.iter().map(|&(_, v)| v).fold(0.0f32, f32::max);
        let threshold = global_max * 0.8;

        for &(idx, val) in &max_positions {
            if val >= threshold {
                let refined = self.parabolic_interp(idx, n);
                let freq = self.sample_rate / refined;
                return (freq, val);
            }
        }

        (0.0, 0.0)
    }

    fn parabolic_interp(&self, idx: usize, n: usize) -> f32 {
        if idx == 0 || idx >= n - 1 {
            return idx as f32;
        }
        let alpha = self.nsdf[idx - 1];
        let beta = self.nsdf[idx];
        let gamma = self.nsdf[idx + 1];
        let denom = alpha - 2.0 * beta + gamma;
        if denom.abs() < 1e-12 {
            return idx as f32;
        }
        let p = 0.5 * (alpha - gamma) / denom;
        idx as f32 + p
    }
}
