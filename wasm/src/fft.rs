use rustfft::{FftPlanner, num_complex::Complex};

pub struct FftAnalyzer {
    planner: FftPlanner<f32>,
    size: usize,
    window: Vec<f32>,
}

impl FftAnalyzer {
    pub fn new(size: usize) -> Self {
        let mut window = vec![0.0f32; size];
        for i in 0..size {
            let t = i as f32 / (size - 1) as f32;
            window[i] = 0.5 - 0.5 * (2.0 * core::f32::consts::PI * t).cos();
        }
        Self {
            planner: FftPlanner::new(),
            size,
            window,
        }
    }

    pub fn compute_magnitude(&mut self, samples: &[f32], magnitudes: &mut [f32]) {
        let n = self.size.min(samples.len());
        let fft = self.planner.plan_fft_forward(n);
        let mut buf: Vec<Complex<f32>> = (0..n)
            .map(|i| Complex::new(samples[i] * self.window[i], 0.0))
            .collect();
        fft.process(&mut buf);
        let half = n / 2 + 1;
        for i in 0..half.min(magnitudes.len()) {
            magnitudes[i] = (buf[i].re * buf[i].re + buf[i].im * buf[i].im).sqrt();
        }
    }
}
