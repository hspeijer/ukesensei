import type { SessionDetail, SessionSummary, UploadMetadata } from '../api/sessionApi';

const DB_NAME = 'ukesensei-sessions';
const DB_VERSION = 1;
const STORE = 'sessions';

interface StoredSession {
  id: string;
  createdAt: string;
  metadata: UploadMetadata;
  audioBlob: Blob | null;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export function isLocalSessionId(id: string): boolean {
  return id.startsWith('local-');
}

export async function saveLocalSession(
  metadata: UploadMetadata,
  audioBlob: Blob | null,
): Promise<string> {
  const id = `local-${crypto.randomUUID()}`;
  const record: StoredSession = {
    id,
    createdAt: new Date().toISOString(),
    metadata,
    audioBlob: audioBlob && audioBlob.size > 0 ? audioBlob : null,
  };

  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(record);
  await txComplete(tx);
  db.close();
  return id;
}

function toSummary(record: StoredSession): SessionSummary {
  const m = record.metadata;
  const durationSec = Math.max(0, (m.endedAt - m.startedAt) / 1000);
  return {
    id: record.id,
    createdAt: record.createdAt,
    scaleKey: m.scaleKey,
    root: m.root,
    bpm: m.bpm,
    tuningKey: m.tuningKey,
    durationSec,
    pitchAccuracy: Math.round(m.pitchAccuracy * 100),
    timingOnTimePercent: Math.round(m.timingOnTimePercent * 100),
    overallScore: Math.round(m.overallScore * 100),
    analysisStatus: 'none',
    hasAudio: !!record.audioBlob,
  };
}

export async function listLocalSessions(): Promise<SessionSummary[]> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const req = tx.objectStore(STORE).getAll();
  const records: StoredSession[] = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return records
    .map(toSummary)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getLocalSession(id: string): Promise<SessionDetail | null> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const req = tx.objectStore(STORE).get(id);
  const record: StoredSession | undefined = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (!record) return null;

  const summary = toSummary(record);
  return {
    ...summary,
    notes: record.metadata.notes,
    chords: record.metadata.chords ?? null,
    startedAt: record.metadata.startedAt,
    endedAt: record.metadata.endedAt,
  };
}

export async function getLocalAudioBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const req = tx.objectStore(STORE).get(id);
  const record: StoredSession | undefined = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return record?.audioBlob ?? null;
}

export async function deleteLocalSession(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(id);
  await txComplete(tx);
  db.close();
}

export async function updateLocalSessionNotes(
  id: string,
  notes: UploadMetadata['notes'],
): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const req = store.get(id);
  const record: StoredSession | undefined = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  if (record) {
    record.metadata.notes = notes;
    store.put(record);
  }
  await txComplete(tx);
  db.close();
}
