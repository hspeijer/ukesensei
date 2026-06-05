import express from 'express';
import cors from 'cors';
import { sessionsRouter } from './routes/sessions.js';
import { analysisRouter } from './routes/analysis.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001');

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/sessions', sessionsRouter);
app.use('/api/sessions', analysisRouter);
app.use('/api', analysisRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Uke Sensei server running on http://localhost:${PORT}`);
});
