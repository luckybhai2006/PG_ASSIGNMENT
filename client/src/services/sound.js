// Web Audio API Synthesizer with automatic user-gesture unlock & singleton AudioContext
// Guarantees zero latency, no browser AudioContext instance limits, and robust chime playback

let sharedAudioCtx = null;

function getAudioContext() {
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
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
    const now = ctx.currentTime;

    // Tone 1 (D5 - 587.33Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.09, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.16);

    // Tone 2 (A5 - 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.09);
    gain2.gain.setValueAtTime(0.09, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.28);
  } catch (_) {}
}
