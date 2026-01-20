// --- Paper/Envelope Sound Effects (CC0 samples via Tone.js, with fallback) ---

let sfxEnvelopeOpen = null;
let sfxLetterClick = null;
let sfxFilter = null;
let sfxGain = null;
let htmlEnvelopeOpen = null;
let htmlLetterClick = null;
let sfxInitAttempted = false;

function clampNumber(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getSfxSeekSeconds(kind, fallback) {
  const cfg = window.LOVE_LETTER_CONFIG || {};
  const sfx = cfg.sfx || {};
  const key = kind === 'envelope' ? 'envelopeSeekSeconds' : 'letterSeekSeconds';
  const v = sfx[key];
  return Number.isFinite(v) ? Math.max(0, v) : fallback;
}

function getSfxPlaySeconds(kind, fallback) {
  const cfg = window.LOVE_LETTER_CONFIG || {};
  const sfx = cfg.sfx || {};
  const key = kind === 'envelope' ? 'envelopePlaySeconds' : 'letterPlaySeconds';
  const v = sfx[key];
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, v);
}

function getSfxSeekByKey(key, fallback) {
  const cfg = window.LOVE_LETTER_CONFIG || {};
  const sfx = cfg.sfx || {};
  const v = sfx[key];
  return Number.isFinite(v) ? Math.max(0, v) : fallback;
}

function getSfxPlayByKey(key, fallback) {
  const cfg = window.LOVE_LETTER_CONFIG || {};
  const sfx = cfg.sfx || {};
  const v = sfx[key];
  return Number.isFinite(v) ? Math.max(0, v) : fallback;
}

function isFileProtocol() {
  return typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
}

function ensureHtmlAudio() {
  if (htmlEnvelopeOpen && htmlLetterClick) return;
  htmlEnvelopeOpen = new Audio('audio/envelope-open.wav');
  htmlEnvelopeOpen.preload = 'auto';
  htmlEnvelopeOpen.volume = 0.55;

  htmlEnvelopeOpen.addEventListener(
    'loadedmetadata',
    () => {
      if (Number.isFinite(htmlEnvelopeOpen._seekPending)) {
        try {
          const t = clampNumber(
            htmlEnvelopeOpen._seekPending,
            0,
            Math.max(0, (htmlEnvelopeOpen.duration || 0) - 0.05)
          );
          htmlEnvelopeOpen.currentTime = t;
        } catch {}
        htmlEnvelopeOpen._seekPending = null;
      }
    },
    { passive: true }
  );

  htmlLetterClick = new Audio('audio/letter-click.wav');
  htmlLetterClick.preload = 'auto';
  htmlLetterClick.volume = 0.5;

  htmlLetterClick.addEventListener(
    'loadedmetadata',
    () => {
      if (Number.isFinite(htmlLetterClick._seekPending)) {
        try {
          const t = clampNumber(
            htmlLetterClick._seekPending,
            0,
            Math.max(0, (htmlLetterClick.duration || 0) - 0.05)
          );
          htmlLetterClick.currentTime = t;
        } catch {}
        htmlLetterClick._seekPending = null;
      }
    },
    { passive: true }
  );
}

function playHtmlAudio(aud, seekSeconds = 0, playSeconds = 0) {
  if (!aud) return;
  const seek = Number.isFinite(seekSeconds) ? Math.max(0, seekSeconds) : 0;
  const playLen = Number.isFinite(playSeconds) ? Math.max(0, playSeconds) : 0;
  try {
    if (aud.readyState >= 1) {
      const t = seek
        ? clampNumber(seek, 0, Math.max(0, (aud.duration || 0) - 0.05))
        : 0;
      aud.currentTime = t;
    } else {
      aud.currentTime = 0;
      if (seek) aud._seekPending = seek;
    }
  } catch {}
  // Tiny random pitch shift makes repeats feel less like a UI click.
  try {
    aud.playbackRate = 0.98 + Math.random() * 0.04;
  } catch {}

  // Cancel any previous scheduled stop for this <audio> element.
  aud._playId = (aud._playId || 0) + 1;
  const playId = aud._playId;

  const p = aud.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});

  if (playLen > 0) {
    const rate = Number.isFinite(aud.playbackRate) && aud.playbackRate > 0 ? aud.playbackRate : 1;
    const ms = Math.max(0, (playLen / rate) * 1000);
    window.setTimeout(() => {
      if (aud._playId !== playId) return;
      try {
        aud.pause();
      } catch {}
    }, ms);
  }
}

function ensureToneStarted() {
  if (typeof Tone === 'undefined') return;
  if (Tone.context && Tone.context.state !== 'running') {
    Tone.start().catch(() => {});
  }
}

function ensureSfxPlayers() {
  if (typeof Tone === 'undefined') return;
  if (sfxEnvelopeOpen && sfxLetterClick) return;

  if (!sfxFilter || !sfxGain) {
    // Softens sharp transients so it reads as paper, not a click.
    sfxGain = new Tone.Gain(1).toDestination();
    sfxFilter = new Tone.Filter(5200, 'lowpass').connect(sfxGain);
  }

  // Avoid repeated init attempts if something fails (common on file://)
  if (sfxInitAttempted && isFileProtocol()) return;
  sfxInitAttempted = true;

  sfxEnvelopeOpen = new Tone.Player({
    url: 'audio/envelope-open.wav',
    autostart: false,
    fadeIn: 0.008,
    fadeOut: 0.06,
  }).connect(sfxFilter);
  sfxEnvelopeOpen.volume.value = -10;

  sfxLetterClick = new Tone.Player({
    url: 'audio/letter-click.wav',
    autostart: false,
    fadeIn: 0.006,
    fadeOut: 0.05,
  }).connect(sfxFilter);
  sfxLetterClick.volume.value = -12;
}



function playPaperRustle() {
  const seekSeconds = getSfxSeekSeconds('envelope', 1.6);
  const playSeconds = getSfxPlaySeconds('envelope', 0);
  // Prefer HTMLAudio for file:// compatibility; Tone.Player for http(s)
  if (isFileProtocol() || typeof Tone === 'undefined') {
    ensureHtmlAudio();
    playHtmlAudio(htmlEnvelopeOpen, seekSeconds, playSeconds);
    return;
  }

  ensureToneStarted();
  ensureSfxPlayers();

  if (sfxEnvelopeOpen && sfxEnvelopeOpen.loaded) {
    sfxEnvelopeOpen.playbackRate = 0.98 + Math.random() * 0.04;
    const dur = sfxEnvelopeOpen.buffer ? sfxEnvelopeOpen.buffer.duration : 0;
    const t = dur ? clampNumber(seekSeconds, 0, Math.max(0, dur - 0.05)) : 0;
    const maxPlay = playSeconds > 0 && dur ? clampNumber(playSeconds, 0, Math.max(0.01, dur - t)) : undefined;
    sfxEnvelopeOpen.start(undefined, t, maxPlay);
    return;
  }

  // Fallback: airy noise rustle
  const now = Tone.now();
  const noise = new Tone.Noise('white').start(now);
  const filter = new Tone.Filter(5200, 'lowpass').toDestination();
  filter.volume.value = -24;
  const env = new Tone.AmplitudeEnvelope({
    attack: 0.02,
    decay: 0.16,
    sustain: 0.0,
    release: 0.04,
  }).connect(filter);
  noise.connect(env);
  env.triggerAttackRelease(0.16, now);
  setTimeout(() => {
    noise.stop();
    env.dispose();
    filter.dispose();
    noise.dispose();
  }, 220);
}

function playEnvelopeClose() {
  const seekSeconds = getSfxSeekByKey('envelopeCloseSeekSeconds', getSfxSeekSeconds('envelope', 1.6));
  const playSeconds = getSfxPlayByKey('envelopeClosePlaySeconds', getSfxPlaySeconds('envelope', 0));

  // Prefer HTMLAudio for file:// compatibility; Tone.Player for http(s)
  if (isFileProtocol() || typeof Tone === 'undefined') {
    ensureHtmlAudio();
    playHtmlAudio(htmlEnvelopeOpen, seekSeconds, playSeconds);
    return;
  }

  ensureToneStarted();
  ensureSfxPlayers();

  if (sfxEnvelopeOpen && sfxEnvelopeOpen.loaded) {
    sfxEnvelopeOpen.playbackRate = 0.98 + Math.random() * 0.04;
    const dur = sfxEnvelopeOpen.buffer ? sfxEnvelopeOpen.buffer.duration : 0;
    const t = dur ? clampNumber(seekSeconds, 0, Math.max(0, dur - 0.05)) : 0;
    const maxPlay = playSeconds > 0 && dur ? clampNumber(playSeconds, 0, Math.max(0.01, dur - t)) : undefined;
    sfxEnvelopeOpen.start(undefined, t, maxPlay);
    return;
  }

  // If Tone isn't ready yet, fall back to the same noise rustle.
  const now = Tone.now();
  const noise = new Tone.Noise('white').start(now);
  const filter = new Tone.Filter(5200, 'lowpass').toDestination();
  filter.volume.value = -24;
  const env = new Tone.AmplitudeEnvelope({
    attack: 0.02,
    decay: 0.16,
    sustain: 0.0,
    release: 0.04,
  }).connect(filter);
  noise.connect(env);
  env.triggerAttackRelease(0.16, now);
  setTimeout(() => {
    noise.stop();
    env.dispose();
    filter.dispose();
    noise.dispose();
  }, 220);
}


function playPaperSlide() {
  const seekSeconds = getSfxSeekSeconds('letter', 1.4);
  const playSeconds = getSfxPlaySeconds('letter', 0);
  // Prefer HTMLAudio for file:// compatibility; Tone.Player for http(s)
  if (isFileProtocol() || typeof Tone === 'undefined') {
    ensureHtmlAudio();
    playHtmlAudio(htmlLetterClick, seekSeconds, playSeconds);
    return;
  }

  ensureToneStarted();
  ensureSfxPlayers();

  if (sfxLetterClick && sfxLetterClick.loaded) {
    sfxLetterClick.playbackRate = 0.98 + Math.random() * 0.04;
    const dur = sfxLetterClick.buffer ? sfxLetterClick.buffer.duration : 0;
    const t = dur ? clampNumber(seekSeconds, 0, Math.max(0, dur - 0.05)) : 0;
    const maxPlay = playSeconds > 0 && dur ? clampNumber(playSeconds, 0, Math.max(0.01, dur - t)) : undefined;
    sfxLetterClick.start(undefined, t, maxPlay);
    return;
  }

  // Fallback: subtle filtered noise slide
  const now = Tone.now();
  const noise = new Tone.Noise('white').start(now);
  const filter = new Tone.Filter(3000, 'lowpass').toDestination();
  filter.volume.value = -20;
  const env = new Tone.AmplitudeEnvelope({
    attack: 0.006,
    decay: 0.11,
    sustain: 0.0,
    release: 0.02,
  }).connect(filter);
  noise.connect(env);
  env.triggerAttackRelease(0.11, now);
  setTimeout(() => {
    noise.stop();
    env.dispose();
    filter.dispose();
    noise.dispose();
  }, 170);
}
const envelope = document.getElementById('envelope');
const envelopeSvg = document.getElementById('envelope-svg');
const envelopeClickTarget = document.getElementById('env-click');
const letterButton = document.getElementById('letter');
const heartsCanvas = document.getElementById('hearts-canvas');

const cfg = window.LOVE_LETTER_CONFIG || {};
const recipientName = cfg.recipientName || 'Pen';
const title = cfg.title || 'Dear';
const message = Array.isArray(cfg.message) ? cfg.message : ['...'];
const signature = cfg.signature || '';
const peekLineCount = Number.isFinite(cfg.peekLineCount) ? cfg.peekLineCount : 11;

// ----------------------
// Floating hearts (canvas physics)
// ----------------------

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function pick(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.map = new Map();
  }
  clear() {
    this.map.clear();
  }
  key(cx, cy) {
    return `${cx},${cy}`;
  }
  insert(item, x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const k = this.key(cx, cy);
    const bucket = this.map.get(k);
    if (bucket) bucket.push(item);
    else this.map.set(k, [item]);
    item._cx = cx;
    item._cy = cy;
  }
  queryNeighbors(item) {
    const results = [];
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const k = this.key(item._cx + ox, item._cy + oy);
        const bucket = this.map.get(k);
        if (bucket) results.push(bucket);
      }
    }
    return results;
  }
}

class HeartsSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.w = 0;
    this.h = 0;
    this.hearts = [];
    this.lastT = 0;
    this.spawnT = 0;

    const heartsCfg = (cfg && cfg.hearts) || {};
    this.enabled = heartsCfg.enabled !== false;
    this.max = Number.isFinite(heartsCfg.max) ? heartsCfg.max : 42;
    this.spawnMs = Array.isArray(heartsCfg.spawnMs) ? heartsCfg.spawnMs : [260, 520];
    this.size = Array.isArray(heartsCfg.size) ? heartsCfg.size : [10, 22];
    this.riseSpeed = Array.isArray(heartsCfg.riseSpeed) ? heartsCfg.riseSpeed : [40, 95];

    const popCfg = (heartsCfg && heartsCfg.pop) || {};
    this.popEnabled = popCfg.enabled !== false;
    this.popSound = popCfg.sound !== false;

    this.audioCtx = null;

    this.nextSpawn = rand(this.spawnMs[0], this.spawnMs[1]);

    this.colors = [
      '#ff2d55',
      '#ff4d6d',
      '#ff5c8a',
      '#ff7aa2',
      '#ff8fb1',
      '#ff3b30',
      '#ff6b6b',
    ];

    this.hash = new SpatialHash(56);
    this._raf = 0;
    this._onResize = () => this.resize();
  }

  start() {
    if (!this.canvas || !this.ctx) return;
    if (!this.enabled || prefersReducedMotion()) return;
    this.resize();
    window.addEventListener('resize', this._onResize, { passive: true });
    this._raf = window.requestAnimationFrame((t) => this.tick(t));
  }

  stop() {
    window.removeEventListener('resize', this._onResize);
    if (this._raf) window.cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  resize() {
    this.w = Math.max(1, Math.floor(window.innerWidth));
    this.h = Math.max(1, Math.floor(window.innerHeight));
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  spawn() {
    if (this.hearts.length >= this.max) return;

    const r = rand(this.size[0], this.size[1]);
    const x = rand(r + 6, this.w - r - 6);
    const y = this.h + r + rand(6, 60);
    const baseVy = -rand(this.riseSpeed[0], this.riseSpeed[1]);

    const heart = {
      x,
      y,
      vx: rand(-14, 14),
      vy: baseVy,
      r,
      rot: rand(-0.5, 0.5),
      vr: rand(-0.7, 0.7),
      wobble: rand(0, Math.PI * 2),
      color: pick(this.colors),
      life: 0,
      ttl: rand(6.0, 10.0),
      popping: false,
      popT: 0,
      _cx: 0,
      _cy: 0,
    };

    this.hearts.push(heart);
  }

  resolveCollisions() {
    this.hash.clear();
    for (const h of this.hearts) {
      this.hash.insert(h, h.x, h.y);
    }

    for (const a of this.hearts) {
      if (a.popping) continue;
      const neighborBuckets = this.hash.queryNeighbors(a);
      for (const bucket of neighborBuckets) {
        for (const b of bucket) {
          if (a === b) continue;
          if (b.popping) continue;
          // Prevent double work by ordering on memory-ish stable property
          if (a.y < b.y) continue;

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const rr = a.r + b.r;
          const d2 = dx * dx + dy * dy;
          if (d2 === 0 || d2 >= rr * rr) continue;

          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;

          // Positional correction (push apart)
          const penetration = rr - d;
          const push = penetration * 0.5;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;

          // Velocity impulse along normal (simple elastic-ish)
          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const velAlongNormal = rvx * nx + rvy * ny;
          if (velAlongNormal > 0) continue;

          const restitution = 0.55;
          const j = -(1 + restitution) * velAlongNormal / 2;
          const ix = j * nx;
          const iy = j * ny;

          a.vx -= ix;
          a.vy -= iy;
          b.vx += ix;
          b.vy += iy;

          // Add a tiny spin on bump
          a.vr -= nx * 0.12;
          b.vr += nx * 0.12;
        }
      }
    }
  }

  drawHeart(h) {
    const ctx = this.ctx;
    const t = h.life;
    const fadeOut = clamp(1 - Math.max(0, (t - (h.ttl - 2.0)) / 2.0), 0, 1);
    const popFade = h.popping ? clamp(1 - h.popT / 0.22, 0, 1) : 1;
    const fade = fadeOut * popFade;

    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.rot);

    // Pop animation: scale up quickly then vanish
    let popScale = 1;
    if (h.popping) {
      const p = clamp(h.popT / 0.22, 0, 1);
      popScale = 1 + p * 0.55;
    }
    const wob = Math.sin(h.wobble + t * 2.4) * 0.06;
    ctx.scale((1 + wob) * popScale, (1 - wob) * popScale);

    // Hand-drawn: draw 2-3 slightly jittered strokes
    const ink = 'rgba(27,44,142,0.70)';
    ctx.globalAlpha = 0.95 * fade;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fillStyle = h.color;

    const drawPath = (jitter) => {
      const r = h.r;
      ctx.beginPath();
      // Heart param (simple bezier heart)
      const x = 0 + jitter;
      const y = 0 + jitter * 0.4;
      ctx.moveTo(x, y + r * 0.35);
      ctx.bezierCurveTo(x + r * 0.85, y - r * 0.35, x + r * 1.05, y + r * 0.75, x, y + r * 1.15);
      ctx.bezierCurveTo(x - r * 1.05, y + r * 0.75, x - r * 0.85, y - r * 0.35, x, y + r * 0.35);
      ctx.closePath();
    };

    drawPath(0);
    ctx.fill();

    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1.6, h.r * 0.16);
    drawPath(rand(-0.35, 0.35));
    ctx.stroke();
    ctx.globalAlpha = 0.45 * fade;
    ctx.lineWidth = Math.max(1.2, h.r * 0.12);
    drawPath(rand(-0.55, 0.55));
    ctx.stroke();

    ctx.restore();

    // Small burst lines on pop
    if (h.popping) {
      const p = clamp(h.popT / 0.22, 0, 1);
      const burstA = 0.55 * (1 - p);
      if (burstA > 0.01) {
        ctx.save();
        ctx.globalAlpha = burstA;
        ctx.translate(h.x, h.y);
        ctx.strokeStyle = 'rgba(27,44,142,0.65)';
        ctx.lineWidth = Math.max(1.4, h.r * 0.12);
        ctx.lineCap = 'round';
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2 + h.wobble;
          const r0 = h.r * (1.0 + p * 0.6);
          const r1 = r0 + h.r * (0.6 + p * 0.8);
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
          ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  ensureAudio() {
    if (!this.popSound) return null;
    if (this.audioCtx && this.audioCtx.state !== 'closed') return this.audioCtx;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    this.audioCtx = new AudioContext();
    return this.audioCtx;
  }

  playPop() {
    // Use Tone.js for a cartoon bubble pop
    if (typeof Tone === 'undefined') return;
    // Main pop: short, low sine with a fast pitch drop and a little pitch "blip"
    const now = Tone.now();
    const synth = new Tone.MembraneSynth({
      pitchDecay: 0.04,
      octaves: 2.5,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.13,
        sustain: 0.0,
        release: 0.01
      }
    }).toDestination();
    synth.triggerAttackRelease('C4', 0.14, now, 0.7);

    // Add a quick high "blip" for cartooniness
    const blip = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.04,
        sustain: 0.0,
        release: 0.01
      }
    }).toDestination();
    blip.triggerAttackRelease('C6', 0.05, now + 0.01, 0.25);
  }

  popAt(x, y) {
    if (!this.popEnabled) return false;
    // Find nearest heart under cursor (top-most feel)
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i];
      if (h.popping) continue;
      const dx = x - h.x;
      const dy = y - h.y;
      if (dx * dx + dy * dy <= (h.r * 1.15) * (h.r * 1.15)) {
        h.popping = true;
        h.popT = 0;
        // Let it finish its pop animation then remove
        h.ttl = Math.min(h.ttl, h.life + 0.25);
        this.playPop();
        return true;
      }
    }
    return false;
  }

  tick(tMs) {
    const t = tMs / 1000;
    const dt = this.lastT ? clamp(t - this.lastT, 0, 0.033) : 0;
    this.lastT = t;

    this.spawnT += dt * 1000;
    if (this.spawnT >= this.nextSpawn) {
      this.spawnT = 0;
      this.nextSpawn = rand(this.spawnMs[0], this.spawnMs[1]);
      this.spawn();
      if (Math.random() < 0.25) this.spawn();
    }

    // Integrate
    for (const h of this.hearts) {
      h.life += dt;
      h.wobble += dt;

      if (h.popping) {
        h.popT += dt;
      }

      // Gentle drift + upward buoyancy
      h.vx += Math.sin(h.wobble * 1.3) * 4.0 * dt;
      h.vy += -6.0 * dt;

      // Mild damping
      h.vx *= 0.995;
      h.vy *= 0.998;
      h.vr *= 0.99;

      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.rot += h.vr * dt;

      // Walls (bounce softly)
      if (h.x - h.r < 0) {
        h.x = h.r;
        h.vx = Math.abs(h.vx) * 0.65;
      } else if (h.x + h.r > this.w) {
        h.x = this.w - h.r;
        h.vx = -Math.abs(h.vx) * 0.65;
      }
    }

    // Collisions
    this.resolveCollisions();

    // Remove dead
    this.hearts = this.hearts.filter((h) => h.life < h.ttl && h.y + h.r > -80);

    // Draw
    this.ctx.clearRect(0, 0, this.w, this.h);
    for (const h of this.hearts) {
      this.drawHeart(h);
    }

    this._raf = window.requestAnimationFrame((t2) => this.tick(t2));
  }
}

let isOpen = false;
let isExpanded = false;

function escapeHtml(s) {
  return String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildLetterContentHtml() {
  const paragraphs = message.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  const sig = signature ? `<p class="signature">${escapeHtml(signature)}</p>` : '';
  return `
    <div class="letter-content" aria-live="polite">
      <h2>${escapeHtml(title)} ${escapeHtml(recipientName)},</h2>
      ${paragraphs}
      ${sig}
    </div>
  `;
}

function renderPaper() {
  const spans = Array.from({ length: Math.max(4, peekLineCount) }, () => '<span></span>').join('');
  letterButton.innerHTML = `
    <div class="paper">
      <div class="paper-body">
        <div class="peek-lines" aria-hidden="true">
          ${spans}
        </div>
        ${buildLetterContentHtml()}
      </div>
    </div>
  `;
}

envelopeClickTarget.addEventListener('click', () => {
  // Toggle: closed -> open, open -> close (letter slides back in)
  if (!isOpen) {
    envelope.classList.add('is-open');
    isOpen = true;
    playPaperRustle();
    return;
  }

  // If expanded, collapse first so it animates back toward the envelope
  if (isExpanded) {
    envelope.classList.remove('is-expanded');
    isExpanded = false;
    // Add a small paper rustle on close as it collapses back in.
    playPaperSlide();
    window.setTimeout(renderCollapsedPaper, 80);
    window.setTimeout(() => {
      playEnvelopeClose();
      envelope.classList.remove('is-open');
      isOpen = false;
    }, 420);
    return;
  }

  playEnvelopeClose();
  envelope.classList.remove('is-open');
  isOpen = false;
});

letterButton.addEventListener('click', (e) => {
  if (!isOpen) return;

  // Only allow clicks on the actual paper (prevents "invisible box" clicks)
  if (!e.target.closest('.paper')) return;

  // Paper click shouldn't also toggle the envelope
  e.stopPropagation();

  if (!isExpanded) {
    envelope.classList.add('is-expanded');
    isExpanded = true;
    playPaperSlide();
    return;
  }

  envelope.classList.remove('is-expanded');
  isExpanded = false;
  playPaperSlide();
  // No re-render needed; CSS toggles peek vs content
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!isExpanded) return;
  envelope.classList.remove('is-expanded');
  isExpanded = false;
  playPaperSlide();
  // No re-render needed; CSS toggles peek vs content
});

renderPaper();

// Start hearts
const heartsSystem = new HeartsSystem(heartsCanvas);
heartsSystem.start();

// Pop hearts on click/tap
heartsCanvas.addEventListener(
  'pointerdown',
  (e) => {
    // Ignore non-primary pointers
    if (e.isPrimary === false) return;
    const rect = heartsCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    heartsSystem.popAt(x, y);
  },
  { passive: true }
);
