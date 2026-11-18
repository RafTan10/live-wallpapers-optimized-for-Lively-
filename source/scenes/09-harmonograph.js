// Music — a harmonograph: two damped pendulums at the frequency ratio of a musical interval.
// The figure slowly precesses and cycles through the fifth, fourth, major third, octave, minor third.
const SCENE = {
  focus: [0.58, 0.47],
  anchors: [[0.36, 0.08], [0.56, 0.05], [0.40, 0.81], [0.78, 0.52], [0.78, 0.66], [0.36, 0.95]],
  title: 'HARMONOGRAPH · JUST INTERVALS',
  sub: 'two damped pendulums · base f₁ = 220 Hz (A3)',
  eqs: [
    { e: 'x(t) = A sin(2πf₁t + φ₁) e^(−dt)', n: 'damped pendulum, x axis' },
    { e: 'y(t) = A sin(2πf₂t + φ₂) e^(−dt)', n: 'damped pendulum, y axis' },
    { e: 'f₂ / f₁ = 3 / 2', n: 'perfect fifth — the simplest ratio after the octave' },
    { e: 'fₙ = 440 · 2^((n − 49) / 12) Hz', n: 'equal temperament, n-th piano key' },
    { e: '2^(7/12) ≈ 1.4983 ≈ 3/2', n: 'why an equal-tempered fifth sounds almost pure' },
    { e: 'y(t) = Σ Aₖ sin(kωt + φₖ)', n: 'Fourier series — timbre as a sum of harmonics' }
  ],
  init() {
    this.intervals = [
      { r: [3, 2], n: 'perfect fifth' }, { r: [4, 3], n: 'perfect fourth' }, { r: [5, 4], n: 'major third' },
      { r: [2, 1], n: 'octave' }, { r: [6, 5], n: 'minor third' }, { r: [5, 3], n: 'major sixth' }
    ];
    this.S = H * 0.3;
    this.heads = [0, 0.33, 0.66].map(o => ({ o, g: pick() }));
  },
  update() {},
  current(t) {
    const per = SETTINGS.intervalSeconds, k = Math.floor(t / per), f = (t % per) / per;
    const a = this.intervals[k % this.intervals.length], b = this.intervals[(k + 1) % this.intervals.length];
    const mixT = clamp((f - 0.85) / 0.15, 0, 1);
    return { a, b, mix: mixT * mixT * (3 - 2 * mixT) };
  },
  curve(ratio, t, tau) {
    const d = 0.022, f1 = 1, f2 = ratio[0] / ratio[1] + 0.0025;
    const ph = t * 0.12;
    const e = Math.exp(-d * tau);
    const x = (Math.sin(f1 * tau + ph) * 0.8 + Math.sin(f1 * 1.003 * tau + 1.3) * 0.2) * e;
    const y = (Math.sin(f2 * tau) * 0.8 + Math.sin(f2 * 0.998 * tau + ph * 0.5 + 0.4) * 0.2) * e;
    return [x, y];
  },
  draw(t, ox, oy) {
    const cx = this.focus[0] * W + ox, cy = this.focus[1] * H + oy;
    const { a, b, mix } = this.current(t);
    ctx.globalCompositeOperation = 'lighter';
    const TMAX = 110, N = 2600, CH = 12;
    const drawOne = (ratio, alphaMul) => {
      if (alphaMul <= 0.001) return;
      for (let c = 0; c < CH; c++) {
        ctx.beginPath();
        for (let i = Math.floor(N * c / CH); i <= Math.floor(N * (c + 1) / CH); i++) {
          const tau = i / N * TMAX, p = this.curve(ratio, t, tau);
          const X = cx + p[0] * this.S, Y = cy + p[1] * this.S;
          i === Math.floor(N * c / CH) ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
        }
        const f = 1 - c / CH;
        ctx.globalAlpha = (0.08 + 0.5 * f * f) * alphaMul;
        ctx.strokeStyle = PAL[Math.round(11 + 11 * f)];
        ctx.lineWidth = (0.6 + 0.6 * f) * scale;
        ctx.stroke();
      }
    };
    drawOne(a.r, 1 - mix);
    drawOne(b.r, mix);
    // glyphs tracing the curve
    ctx.font = MONO(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const h of this.heads) {
      const tau = ((t * 0.06 + h.o) % 1) * TMAX * 0.6;
      const p = this.curve(mix < 0.5 ? a.r : b.r, t, tau);
      ctx.globalAlpha = 0.9; ctx.fillStyle = PAL[23];
      ctx.fillText(h.g, cx + p[0] * this.S, cy + p[1] * this.S);
    }
    // oscilloscope strip: the two tones and their sum
    const sx0 = W * 0.42, sx1 = W * 0.94, sy = H * 0.9, amp = H * 0.025;
    const r = (mix < 0.5 ? a : b).r;
    for (const [fn, lvl, al] of [[x => Math.sin(x), 12, 0.35], [x => Math.sin(x * r[0] / r[1]), 12, 0.35], [x => (Math.sin(x) + Math.sin(x * r[0] / r[1])) / 2, 20, 0.7]]) {
      ctx.beginPath();
      for (let x = sx0; x <= sx1; x += 2) {
        const v = fn((x - sx0) / (sx1 - sx0) * 6 * TAU - t * 2.2);
        x === sx0 ? ctx.moveTo(x, sy - v * amp) : ctx.lineTo(x, sy - v * amp);
      }
      ctx.globalAlpha = al; ctx.strokeStyle = PAL[lvl]; ctx.lineWidth = 1 * scale; ctx.stroke();
    }
    this.cur = mix < 0.5 ? a : b;
    // small multiples: every interval in the cycle, the current one highlighted
    const tx = W * 0.26, ty0 = H * 0.2, tr = H * 0.045, gap = H * 0.12;
    this.thumbs = [];
    this.intervals.forEach((iv, k) => {
      const y = ty0 + k * gap, on = iv === this.cur;
      ctx.beginPath();
      for (let i = 0; i <= 700; i++) {
        const p = this.curve(iv.r, t * 0.6, i / 700 * 60);
        i ? ctx.lineTo(tx + p[0] * tr, y + p[1] * tr) : ctx.moveTo(tx + p[0] * tr, y + p[1] * tr);
      }
      ctx.globalAlpha = on ? 0.75 : 0.22; ctx.strokeStyle = PAL[on ? 21 : 15]; ctx.lineWidth = 0.8 * scale; ctx.stroke();
      this.thumbs.push([tx, y, tr, iv, on]);
    });
    // harmonic spectrum: harmonics of f1 (up) and f2 (down); shared ones line up
    const qx0 = W * 0.775, qx1 = W * 0.965, qy = H * 0.3, qh = H * 0.07, fmax = 10;
    const ratio = r[0] / r[1];
    ctx.globalAlpha = 0.25; ctx.strokeStyle = PAL[14]; ctx.lineWidth = 0.8 * scale;
    ctx.beginPath(); ctx.moveTo(qx0, qy); ctx.lineTo(qx1, qy); ctx.stroke();
    this.shared = 0;
    for (let n = 1; n <= 9; n++) {
      const f = n; if (f > fmax) break;
      const x = qx0 + f / fmax * (qx1 - qx0);
      let hit = false; for (let m = 1; m <= 9; m++) if (Math.abs(m * ratio - f) < 1e-6) hit = true;
      if (hit) this.shared++;
      ctx.globalAlpha = hit ? 0.9 : 0.45; ctx.strokeStyle = PAL[hit ? 23 : 17]; ctx.lineWidth = (hit ? 2 : 1.4) * scale;
      ctx.beginPath(); ctx.moveTo(x, qy); ctx.lineTo(x, qy - qh / n * 1.6); ctx.stroke();
    }
    for (let m = 1; m <= 9; m++) {
      const f = m * ratio; if (f > fmax) break;
      const x = qx0 + f / fmax * (qx1 - qx0);
      const hit = Math.abs(f - Math.round(f)) < 1e-6;
      ctx.globalAlpha = hit ? 0.9 : 0.4; ctx.strokeStyle = PAL[hit ? 23 : 15]; ctx.lineWidth = (hit ? 2 : 1.4) * scale;
      ctx.beginPath(); ctx.moveTo(x, qy); ctx.lineTo(x, qy + qh / m * 1.6); ctx.stroke();
    }
    this.spec = [qx0, qx1, qy, qh, fmax];
  },
  drawOver() {
    if (!SETTINGS.math || !this.cur) return;
    const o = octx, r = this.cur.r;
    o.font = MONO(10); o.textBaseline = 'middle'; o.textAlign = 'left';
    for (const [x, y, tr, iv, on] of this.thumbs || []) {
      o.globalAlpha = on ? 0.85 : 0.35; o.fillStyle = PAL[on ? 21 : 15];
      o.fillText(`${iv.r[0]}:${iv.r[1]}  ${iv.n}`, x + tr * 1.5, y);
    }
    if (this.spec) {
      const [sx0, sx1, sy, sh] = this.spec;
      o.globalAlpha = 0.6; o.fillStyle = PAL[17];
      o.fillText('HARMONICS   f₁ ↑   f₂ ↓', sx0, sy - sh * 1.9);
      o.globalAlpha = 0.45;
      o.fillText(`shared harmonics below 10f₁: ${this.shared}  → consonance`, sx0, sy + sh * 1.9);
    }
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'left'; o.fillStyle = PAL[17];
    o.globalAlpha = 0.65;
    o.fillText(`${this.cur.n}   ${r[0]} : ${r[1]}   ${(220).toFixed(1)} Hz + ${(220 * r[0] / r[1]).toFixed(1)} Hz`, W * 0.42, H * 0.9 - 32 * scale);
    o.globalAlpha = 0.4;
    o.fillText('sum of the two tones', W * 0.42, H * 0.9 + 30 * scale);
  },
  hud(t) { const c = this.current(t); const s = c.mix < 0.5 ? c.a : c.b; return [`interval: ${s.n} (${s.r[0]}:${s.r[1]})`]; }
};
