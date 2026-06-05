import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import * as queries from '../db/queries.js';
import { analyzeAudio } from '../analysis/fftStringAnalyzer.js';
import type { AnalysisResult } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = path.resolve(__dirname, '../../data/audio');
const ANALYSIS_DIR = path.resolve(__dirname, '../../data/analysis');

fs.mkdirSync(ANALYSIS_DIR, { recursive: true });

function findAudioFile(id: string): string | null {
  for (const ext of ['.wav', '.webm', '.ogg', '.mp4']) {
    const p = path.join(AUDIO_DIR, `${id}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function ensureWav(audioPath: string): string {
  if (audioPath.endsWith('.wav')) return audioPath;

  const wavPath = audioPath.replace(/\.[^.]+$/, '.wav');
  if (fs.existsSync(wavPath)) return wavPath;

  execSync(
    `ffmpeg -y -i "${audioPath}" -ac 1 -ar 44100 -sample_fmt s16 "${wavPath}"`,
    { stdio: 'pipe', timeout: 30000 },
  );
  return wavPath;
}

export const analysisRouter = Router();

analysisRouter.post('/:id/analyze', (req, res) => {
  try {
    const id = req.params.id;
    const session = queries.getSession(id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const audioPath = findAudioFile(id);
    if (!audioPath) {
      res.status(400).json({ error: 'No audio file for this session' });
      return;
    }

    queries.updateAnalysisStatus(id, 'processing');

    const wavPath = ensureWav(audioPath);
    const audioBuffer = fs.readFileSync(wavPath);
    const result = analyzeAudio(audioBuffer, session.tuningKey);
    result.sessionId = id;

    const analysisPath = path.join(ANALYSIS_DIR, `${id}.json`);
    fs.writeFileSync(analysisPath, JSON.stringify(result));

    queries.updateAnalysisStatus(id, 'complete');

    res.json({ status: 'complete' });
  } catch (err) {
    console.error('Analysis failed:', err);
    const id = req.params.id;
    queries.updateAnalysisStatus(id, 'error');
    res.status(500).json({ error: 'Analysis failed' });
  }
});

analysisRouter.get('/:id/analysis', (req, res) => {
  try {
    const id = req.params.id;
    const analysisPath = path.join(ANALYSIS_DIR, `${id}.json`);

    if (!fs.existsSync(analysisPath)) {
      res.status(404).json({ error: 'Analysis not found. Trigger analysis first.' });
      return;
    }

    const data = JSON.parse(fs.readFileSync(analysisPath, 'utf-8')) as AnalysisResult;
    res.json(data);
  } catch (err) {
    console.error('Failed to get analysis:', err);
    res.status(500).json({ error: 'Failed to get analysis' });
  }
});

analysisRouter.get('/stats', (_req, res) => {
  try {
    const stats = queries.getStats();
    res.json(stats);
  } catch (err) {
    console.error('Failed to get stats:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});
