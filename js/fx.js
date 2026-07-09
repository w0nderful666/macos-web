/* System sounds via Web Audio (no external files) */
window.MacFX = (() => {
  let ctx = null;
  let master = 0.35;
  let enabled = true;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function setVolume(v) {
    master = Math.max(0, Math.min(1, v));
  }

  function setEnabled(on) {
    enabled = !!on;
  }

  function tone({ freq = 440, type = "sine", dur = 0.08, gain = 0.08, freqEnd, delay = 0 }) {
    if (!enabled || master <= 0) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain * master, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  function noiseBurst({ dur = 0.04, gain = 0.04 }) {
    if (!enabled || master <= 0) return;
    const c = ensure();
    if (!c) return;
    const n = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = c.createBufferSource();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 1800;
    src.buffer = n;
    g.gain.value = gain * master;
    src.connect(f);
    f.connect(g);
    g.connect(c.destination);
    src.start();
  }

  const play = {
    boot() {
      tone({ freq: 520, freqEnd: 780, dur: 0.35, gain: 0.06, type: "triangle" });
      tone({ freq: 780, freqEnd: 1040, dur: 0.4, gain: 0.05, type: "sine", delay: 0.12 });
    },
    login() {
      tone({ freq: 660, dur: 0.06, gain: 0.05 });
      tone({ freq: 880, dur: 0.1, gain: 0.05, delay: 0.07 });
    },
    open() {
      tone({ freq: 520, freqEnd: 880, dur: 0.12, gain: 0.04, type: "sine" });
    },
    close() {
      tone({ freq: 640, freqEnd: 320, dur: 0.1, gain: 0.035, type: "sine" });
    },
    min() {
      tone({ freq: 500, freqEnd: 280, dur: 0.14, gain: 0.03, type: "triangle" });
    },
    max() {
      tone({ freq: 360, freqEnd: 620, dur: 0.12, gain: 0.03, type: "triangle" });
    },
    click() {
      noiseBurst({ dur: 0.02, gain: 0.03 });
    },
    alert() {
      tone({ freq: 880, dur: 0.08, gain: 0.05 });
      tone({ freq: 660, dur: 0.12, gain: 0.05, delay: 0.1 });
    },
    notif() {
      tone({ freq: 880, dur: 0.06, gain: 0.04, type: "sine" });
      tone({ freq: 1174, dur: 0.1, gain: 0.04, type: "sine", delay: 0.08 });
    },
    emptyTrash() {
      tone({ freq: 200, freqEnd: 80, dur: 0.18, gain: 0.05, type: "sawtooth" });
      noiseBurst({ dur: 0.08, gain: 0.04 });
    },
    volume() {
      tone({ freq: 740, dur: 0.05, gain: 0.045 });
    },
  };

  return { play, setVolume, setEnabled, ensure };
})();
