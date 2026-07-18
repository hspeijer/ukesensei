/**
 * Audit the chord voicing databases in src/theory/chords.ts (ukulele + guitar).
 *
 * - Verifies every voicing's sounded pitch classes exactly match its declared
 *   chord quality (no wrong notes, no missing chord tones; the perfect 5th may
 *   be omitted for 4+ tone qualities, standard shell-voicing practice).
 * - Checks frets/fingers array lengths and flags duplicate root/quality entries.
 * - Lists every root x quality combination that has no voicing.
 * - With --generate [instrument], proposes playable voicings for missing combos.
 *
 * Usage: node scripts/audit-chords.mjs [--generate] [ukulele|guitar]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, '../src/theory/chords.ts'), 'utf8');

function extractLiteral(name) {
  const start = source.indexOf(`export const ${name}`);
  if (start === -1) throw new Error(`Cannot find ${name} in chords.ts`);
  const eq = source.indexOf('=', start);
  const openIdx = source.slice(eq).search(/[[{]/) + eq;
  const openChar = source[openIdx];
  const closeChar = openChar === '[' ? ']' : '}';
  let depth = 0;
  for (let i = openIdx; i < source.length; i++) {
    if (source[i] === openChar) depth++;
    else if (source[i] === closeChar) {
      depth--;
      if (depth === 0) return source.slice(openIdx, i + 1);
    }
  }
  throw new Error(`Unbalanced literal for ${name}`);
}

const CHORD_QUALITIES = eval(`(${extractLiteral('CHORD_QUALITIES')})`);

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ENHARMONIC = { Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B' };
const semitone = (note) => CHROMATIC.indexOf(ENHARMONIC[note] ?? note);
const pc = (n) => ((n % 12) + 12) % 12;

const INSTRUMENTS = {
  ukulele: {
    tableName: 'UKULELE_VOICINGS',
    open: ['G', 'C', 'E', 'A'].map(semitone),
    minSounded: 3,
    maxFret: 9,
    // Re-entrant 4-string: muting is not idiomatic, search full shapes only.
    allowMutes: false,
    requireRootInBass: false,
  },
  guitar: {
    tableName: 'GUITAR_VOICINGS',
    open: ['E', 'A', 'D', 'G', 'B', 'E'].map(semitone),
    minSounded: 4,
    maxFret: 9,
    allowMutes: true,
    requireRootInBass: true,
  },
};

function qualityPcs(rootPc, intervals) {
  return new Set(intervals.map((iv) => pc(rootPc + iv)));
}

/**
 * Chord tones a voicing must cover. The perfect 5th may be omitted (standard
 * shell-voicing practice) when the quality has 4+ tones, as long as the root,
 * the 3rd (or sus tone) and the color tones are all present.
 */
function requiredPcs(rootPc, intervals) {
  const distinct = new Set(intervals.map(pc));
  if (distinct.size <= 3) return qualityPcs(rootPc, intervals);
  return new Set([...distinct].filter((iv) => iv !== 7).map((iv) => pc(rootPc + iv)));
}

function voicingPcs(frets, open) {
  const pcs = new Set();
  for (let s = 0; s < open.length; s++) {
    if (frets[s] >= 0) pcs.add(pc(open[s] + frets[s]));
  }
  return pcs;
}

const suffixToQuality = new Map(Object.entries(CHORD_QUALITIES).map(([q, def]) => [def.suffix, q]));

// --- 1. Verify existing voicings -------------------------------------------
let errors = 0;
const tables = {};
for (const [instrument, cfg] of Object.entries(INSTRUMENTS)) {
  const voicings = eval(`(${extractLiteral(cfg.tableName)})`);
  tables[instrument] = voicings;
  const seen = new Set();

  for (const v of voicings) {
    const label = `${instrument} ${v.name}${v.suffix}`;
    if (v.frets.length !== cfg.open.length || v.fingers.length !== cfg.open.length) {
      console.log(`INVALID  ${label}: expected ${cfg.open.length} strings`);
      errors++;
      continue;
    }
    const quality = suffixToQuality.get(v.suffix);
    if (!quality) {
      console.log(`INVALID  ${label}: unknown suffix '${v.suffix}'`);
      errors++;
      continue;
    }
    const key = `${semitone(v.name)}|${v.suffix}`;
    if (seen.has(key)) {
      console.log(`DUPLICATE  ${label}`);
      errors++;
    }
    seen.add(key);

    const rootPc = semitone(v.name);
    const allowed = qualityPcs(rootPc, CHORD_QUALITIES[quality].intervals);
    const required = requiredPcs(rootPc, CHORD_QUALITIES[quality].intervals);
    const sounded = voicingPcs(v.frets, cfg.open);
    const wrong = [...sounded].filter((p) => !allowed.has(p)).map((p) => CHROMATIC[p]);
    const missing = [...required].filter((p) => !sounded.has(p)).map((p) => CHROMATIC[p]);
    if (wrong.length || missing.length) {
      const notes = [...sounded].map((p) => CHROMATIC[p]).join(' ');
      console.log(
        `INVALID  ${label} [${v.frets}] sounds {${notes}}` +
          (wrong.length ? ` wrong: ${wrong.join(' ')}` : '') +
          (missing.length ? ` missing: ${missing.join(' ')}` : ''),
      );
      errors++;
    }
  }
}
console.log(errors === 0 ? 'All existing voicings are valid.' : `${errors} invalid voicing(s).`);

// --- 2. Find missing root x quality combos ----------------------------------
const missingByInstrument = {};
for (const [instrument] of Object.entries(INSTRUMENTS)) {
  const have = new Set(tables[instrument].map((v) => `${semitone(v.name)}|${v.suffix}`));
  const missing = [];
  for (const def of Object.values(CHORD_QUALITIES)) {
    for (let rootPc = 0; rootPc < 12; rootPc++) {
      if (!have.has(`${rootPc}|${def.suffix}`)) missing.push({ rootPc, def });
    }
  }
  missingByInstrument[instrument] = missing;
  console.log(
    `\n${instrument}: ${missing.length} missing combo(s) of ${12 * Object.keys(CHORD_QUALITIES).length} total.`,
  );
  if (missing.length && !process.argv.includes('--generate')) {
    console.log(missing.map((m) => `${CHROMATIC[m.rootPc]}${m.def.suffix}`).join(', '));
  }
}

if (!process.argv.includes('--generate')) {
  process.exit(errors === 0 ? 0 : 1);
}

// --- 3. Generate voicings for missing combos ---------------------------------

/**
 * Estimate whether a shape is fingerable: fretted notes minus those coverable
 * by an index barre must fit in 4 fingers. A barre at the lowest fretted fret
 * only works if no sounded string above the first barred string is open.
 */
function fingersNeeded(frets) {
  const fretted = frets.filter((f) => f > 0).length;
  if (fretted === 0) return 0;
  const minFret = Math.min(...frets.filter((f) => f > 0));
  const barreStrings = frets
    .map((f, i) => (f === minFret ? i : -1))
    .filter((i) => i >= 0);
  const canBarre =
    barreStrings.length >= 2 &&
    frets.every((f, i) => i < barreStrings[0] || f !== 0);
  return canBarre ? fretted - barreStrings.length + 1 : fretted;
}

function generateVoicing(instrument, rootPc, intervals) {
  const cfg = INSTRUMENTS[instrument];
  const numStrings = cfg.open.length;
  const allowed = qualityPcs(rootPc, intervals);
  const required = requiredPcs(rootPc, intervals);
  let best = null;

  // Mutes allowed only as a bass-side prefix and/or a treble-side suffix.
  const mutePatterns = [];
  if (cfg.allowMutes) {
    for (let lead = 0; lead <= numStrings - cfg.minSounded; lead++) {
      for (let trail = 0; trail <= numStrings - cfg.minSounded - lead; trail++) {
        mutePatterns.push({ lead, trail });
      }
    }
  } else {
    mutePatterns.push({ lead: 0, trail: 0 });
  }

  for (const { lead, trail } of mutePatterns) {
    const soundedCount = numStrings - lead - trail;
    const combos = Math.pow(cfg.maxFret + 1, soundedCount);
    for (let c = 0; c < combos; c++) {
      const frets = new Array(numStrings).fill(-1);
      let rem = c;
      for (let s = lead; s < numStrings - trail; s++) {
        frets[s] = rem % (cfg.maxFret + 1);
        rem = Math.floor(rem / (cfg.maxFret + 1));
      }

      const sounded = voicingPcs(frets, cfg.open);
      if ([...sounded].some((p) => !allowed.has(p))) continue;
      if ([...required].some((p) => !sounded.has(p))) continue;
      if (cfg.requireRootInBass && pc(cfg.open[lead] + frets[lead]) !== rootPc) continue;

      const frettedFrets = frets.filter((f) => f > 0);
      const span = frettedFrets.length
        ? Math.max(...frettedFrets) - Math.min(...frettedFrets)
        : 0;
      if (span > 3) continue;
      if (fingersNeeded(frets) > 4) continue;

      const maxFret = Math.max(...frets);
      const opens = frets.filter((f) => f === 0).length;
      const score =
        frettedFrets.reduce((x, y) => x + y, 0) +
        3 * span +
        2 * Math.max(0, maxFret - 4) +
        4 * (lead + trail) -
        opens;
      if (!best || score < best.score) best = { frets, score };
    }
  }
  return best?.frets ?? null;
}

function assignFingers(frets) {
  const numStrings = frets.length;
  const fingers = new Array(numStrings).fill(0);
  const fretted = frets
    .map((fret, string) => ({ fret, string }))
    .filter((n) => n.fret > 0);
  if (fretted.length === 0) return { fingers, barres: undefined };

  const minFret = Math.min(...fretted.map((n) => n.fret));
  const atMin = fretted.filter((n) => n.fret === minFret);
  const barreOk =
    atMin.length >= 2 &&
    frets.every((f, i) => i < atMin[0].string || f !== 0);
  const useBarre = barreOk && (atMin.length >= 3 || fretted.length > 4 || (atMin.length === 2 && fretted.length > atMin.length));

  let next = 1;
  let barres;
  if (useBarre) {
    for (const n of atMin) fingers[n.string] = 1;
    barres = [minFret];
    next = 2;
  }
  const rest = fretted
    .filter((n) => !(useBarre && n.fret === minFret))
    .sort((x, y) => x.fret - y.fret || x.string - y.string);
  for (const n of rest) fingers[n.string] = Math.min(next++, 4);
  return { fingers, barres };
}

const onlyInstrument = process.argv.find((a) => a === 'ukulele' || a === 'guitar');
for (const [instrument, missing] of Object.entries(missingByInstrument)) {
  if (onlyInstrument && instrument !== onlyInstrument) continue;
  if (missing.length === 0) continue;

  console.log(`\nGenerated ${instrument} voicings:\n`);
  const byQuality = new Map();
  for (const { rootPc, def } of missing) {
    const frets = generateVoicing(instrument, rootPc, def.intervals);
    const name = CHROMATIC[rootPc];
    if (!frets) {
      console.log(`  // no playable voicing found for ${name}${def.suffix}`);
      continue;
    }
    const { fingers, barres } = assignFingers(frets);
    const pad = (s, w) => `${s},`.padEnd(w);
    const line =
      `  { name: ${pad(`'${name}'`, 6)} suffix: ${pad(`'${def.suffix}'`, 8)} ` +
      `frets: [${frets.join(', ')}], fingers: [${fingers.join(', ')}]` +
      (barres ? `, barres: [${barres.join(', ')}]` : '') +
      ' },';
    if (!byQuality.has(def.suffix)) byQuality.set(def.suffix, []);
    byQuality.get(def.suffix).push(line);
  }
  for (const [suffix, lines] of byQuality) {
    console.log(`  // ${suffix || 'major'}`);
    for (const line of lines) console.log(line);
    console.log('');
  }
}
