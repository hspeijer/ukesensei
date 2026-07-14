let sharedCtx: AudioContext | null = null;

/** A single AudioContext shared by all synth hooks so switching instruments doesn't pile up contexts. */
export function getSharedAudioContext(): AudioContext {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AudioContext();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume();
  }
  return sharedCtx;
}
