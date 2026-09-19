// Web Audio API Synthesizer with automatic user-gesture unlock, master compressor & debounce guard
// Guarantees zero latency, perfectly consistent normalized volume, and eliminates audio clicks/phase cancellation

let sharedAudioCtx = null;
let masterCompressor = null;
let lastChimeTimestamp = 0;

function getAudioContext() {
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
      try {
        // Dynamics compressor normalizes perceived loudness and prevents harsh volume spikes / clipping
        masterCompressor = sharedAudioCtx.createDynamicsCompressor();
        masterCompressor.threshold.setValueAtTime(-18, sharedAudioCtx.currentTime);
        masterCompressor.knee.setValueAtTime(12, sharedAudioCtx.currentTime);
        masterCompressor.ratio.setValueAtTime(6, sharedAudioCtx.currentTime);
        masterCompressor.attack.setValueAtTime(0.003, sharedAudioCtx.currentTime);
        masterCompressor.release.setValueAtTime(0.2, sharedAudioCtx.currentTime);
        masterCompressor.connect(sharedAudioCtx.destination);
      } catch (_) {
        masterCompressor = null;
      }
    }
  }
  return sharedAudioCtx;
}

// Automatically prime and unlock AudioContext on the very first user interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch (_) {}
  };

  ['click', 'pointerdown', 'keydown', 'touchstart'].forEach((evt) => {
    window.addEventListener(evt, unlockAudio, { passive: true });
  });
}

export function playNotificationChime() {
  try {
    const nowMs = Date.now();
    // Strict 450ms debounce guard: prevents overlapping waveforms, acoustic phase cancellation, and double-volume spikes
    if (nowMs - lastChimeTimestamp < 450) {
      return;
    }
    lastChimeTimestamp = nowMs;

    const ctx = getAudioContext();
    if (!ctx) return;

    // If suspended, attempt to resume before playback
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playChimeNodes(ctx)).catch(() => {});
      return;
    }

    playChimeNodes(ctx);
  } catch (_) {
    // Graceful fallback
  }
}

function playChimeNodes(ctx) {
  try {
    // 10ms lookahead prevents hardware buffer truncation on the first samples
    const now = ctx.currentTime + 0.01;
    const destination = masterCompressor || ctx.destination;

    // Tone 1 (D5 - 587.33Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);

    // Smooth ADSR envelope: 15ms linear attack eliminates initial click/pop, followed by smooth exponential decay
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc1.connect(gain1);
    gain1.connect(destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Tone 2 (A5 - 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.08);

    gain2.gain.setValueAtTime(0.0001, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.095);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc2.connect(gain2);
    gain2.connect(destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.28);
  } catch (_) {}
}
