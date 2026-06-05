import { Router } from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as queries from '../db/queries.js';
import type { SessionMetadata } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = path.resolve(__dirname, '../../data/audio');

fs.mkdirSync(AUDIO_DIR, { recursive: true });

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

export const sessionsRouter = Router();

sessionsRouter.post(
  '/',
  upload.single('audio'),
  (req, res) => {
    try {
      const metaStr = req.body?.metadata;
      if (!metaStr) {
        res.status(400).json({ error: 'Missing metadata field' });
        return;
      }

      const meta: SessionMetadata = JSON.parse(metaStr);
      const id = uuid();
      const hasAudio = !!req.file;

      if (hasAudio && req.file) {
        const ext = req.file.originalname?.endsWith('.webm') || req.file.mimetype?.includes('webm')
          ? '.webm' : '.wav';
        const audioPath = path.join(AUDIO_DIR, `${id}${ext}`);
        fs.writeFileSync(audioPath, req.file.buffer);
      }

      queries.createSession(id, meta, hasAudio);

      res.status(201).json({ id });
    } catch (err) {
      console.error('Failed to create session:', err);
      res.status(500).json({ error: 'Failed to create session' });
    }
  },
);

sessionsRouter.get('/', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const sessions = queries.listSessions(limit, offset);
    res.json({ sessions });
  } catch (err) {
    console.error('Failed to list sessions:', err);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

sessionsRouter.get('/:id', (req, res) => {
  try {
    const session = queries.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json(session);
  } catch (err) {
    console.error('Failed to get session:', err);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

sessionsRouter.get('/:id/audio', (req, res) => {
  try {
    const id = req.params.id;
    let audioPath: string | null = null;
    let contentType = 'audio/wav';
    for (const [ext, mime] of [['.webm', 'audio/webm'], ['.wav', 'audio/wav'], ['.ogg', 'audio/ogg']] as const) {
      const p = path.join(AUDIO_DIR, `${id}${ext}`);
      if (fs.existsSync(p)) {
        audioPath = p;
        contentType = mime;
        break;
      }
    }
    if (!audioPath) {
      res.status(404).json({ error: 'Audio not found' });
      return;
    }
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    const stat = fs.statSync(audioPath);
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(audioPath).pipe(res);
  } catch (err) {
    console.error('Failed to stream audio:', err);
    res.status(500).json({ error: 'Failed to stream audio' });
  }
});

sessionsRouter.delete('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const deleted = queries.deleteSession(id);
    if (!deleted) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const audioPath = path.join(AUDIO_DIR, `${id}.wav`);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

    const analysisDir = path.resolve(__dirname, '../../data/analysis');
    const analysisPath = path.join(analysisDir, `${id}.json`);
    if (fs.existsSync(analysisPath)) fs.unlinkSync(analysisPath);

    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete session:', err);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});
