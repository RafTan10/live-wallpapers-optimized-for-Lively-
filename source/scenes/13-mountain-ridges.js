// Landscape — layered mountain ridges from fractal noise, drifting past at depth-dependent speeds.
// Far ridges fade into haze (Beer–Lambert), a flock of birds crosses, and peaks carry survey labels.
const SCENE = {
  focus: [0.7, 0.3],
  glow: 0.3,
  anchors: [[0.28, 0.10], [0.5, 0.06], [0.24, 0.22], [0.44, 0.18], [0.30, 0.3], [0.56, 0.24]],
  title: 'ALPINE RIDGES · FRACTAL TERRAIN',
  sub: '7 ridgelines · parallax ∝ 1 / depth',
  eqs: [
    { e: 'I = I₀ e^(−β d)', n: 'Beer–Lambert law — why distant ridges fade' },
    { e: 'p(h) = p₀ e^(−Mgh / RT)', n: 'barometric formula' },
    { e: 'dT/dh ≈ −6.5 K/km', n: 'standard atmospheric lapse rate' },
    { e: 'h(x) = Σ 2⁻ᵏᴴ N(2ᵏx)', n: 'fractal ridge profile, Hurst exponent H' },
    { e: 'v_screen ∝ 1 / z', n: 'motion parallax' },
    { e: 'D = 2 − H', n: 'fractal dimension of a ridgeline' }
  ],
  init() {
    this.L = 7;
    this.birds = [];
    for (let i = 0; i < 14; i++) this.birds.push({ dx: rand(-60, 60), dy: rand(-25, 25), ph: rand(0, TAU), s: rand(0.7, 1.2) });
    this.flock = { x: -0.1, y: 0.28 };
    this.peaks = [];
  },
  ridge(i, x, t) {
    const z = 1 + i * 0.9;
    const sp = 0.012 / z * SETTINGS.speed;
    const f = 0.0016 / scale * (1 + i * 0.25);
    let v = 0, a = 1, fr = 1;
    for (let k = 0; k < 5; k++) { v += a * noise3((x + t * sp * W) * f * fr + i * 13.1, i * 3.7, k * 5.3); a *= 0.52; fr *= 2.1; }
    const base = H * (0.42 + i * 0.075);
    return base - Math.abs(v) * H * (0.34 - i * 0.025) - v * H * 0.05;
  },
  update(dt) {
    this.flock.x += dt * 0.012;
    if (this.flock.x > 1.15) { this.flock.x = -0.15; this.flock.y = rand(0.15, 0.32); }
  },
  draw(t, ox, oy) {
    const sunx = this.focus[0] * W + ox * 0.2, suny = this.focus[1] * H + oy * 0.2;
    ctx.globalCompositeOperation = 'source-over';
    // sun disc and rings of haze
    ctx.globalAlpha = 0.85; ctx.fillStyle = shade(0.75, 0.35);
    ctx.beginPath(); ctx.arc(sunx, suny, H * 0.06, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[20]; ctx.lineWidth = 1 * scale;
    ctx.beginPath(); ctx.arc(sunx, suny, H * 0.06, 0, TAU); ctx.stroke();
    for (let k = 1; k <= 4; k++) { ctx.globalAlpha = 0.1 / k; ctx.beginPath(); ctx.arc(sunx, suny, H * 0.06 * (1 + k * 0.6), 0, TAU); ctx.stroke(); }
    // sun's horizontal haze bands
    ctx.lineWidth = 0.8 * scale;
    for (let k = 0; k < 9; k++) {
      const y = suny + H * 0.02 * (k - 4) * 1.6;
      ctx.globalAlpha = 0.06; ctx.strokeStyle = PAL[18];
      ctx.beginPath(); ctx.moveTo(sunx - W * 0.2, y); ctx.lineTo(sunx + W * 0.2, y); ctx.stroke();
    }
    // birds
    ctx.strokeStyle = PAL[17]; ctx.lineWidth = 1 * scale;
    for (const b of this.birds) {
      const x = this.flock.x * W + b.dx * scale * 2 + Math.sin(t * 0.4 + b.ph) * 8 * scale, y = this.flock.y * H + b.dy * scale * 2 + Math.cos(t * 0.3 + b.ph) * 5 * scale;
      const flap = Math.sin(t * 4 * b.s + b.ph) * 3 * scale, w = 6 * scale * b.s;
      ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.moveTo(x - w, y - flap); ctx.quadraticCurveTo(x - w * 0.4, y - 2 * scale, x, y); ctx.quadraticCurveTo(x + w * 0.4, y - 2 * scale, x + w, y - flap); ctx.stroke();
    }
    // ridges, far to near
    const step = 6 * scale;
    this.peaks = [];
    for (let i = 0; i < this.L; i++) {
      const haze = Math.exp(-(this.L - 1 - i) * 0.35);           // near = 1, far → 0.13
      const pts = [];
      for (let x = -step; x <= W + step; x += step) pts.push([x, this.ridge(i, x, t) + oy * (0.2 + i * 0.12)]);
      // fill: far ridges lighter (haze), near ridges darker
      ctx.globalAlpha = 1;
      ctx.fillStyle = `hsl(${theme.hue},${Math.min(theme.sat, 10)}%,${(18 - i * 2.2).toFixed(1)}%)`;
      ctx.beginPath(); ctx.moveTo(pts[0][0], H); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.lineTo(W + step, H); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.25 + 0.55 * haze; ctx.strokeStyle = PAL[Math.round(12 + 9 * haze)]; ctx.lineWidth = (0.8 + 0.6 * haze) * scale;
      ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      // hatching on the near slopes
      if (i >= this.L - 3) {
        ctx.globalAlpha = 0.08 + 0.05 * (i - (this.L - 3)); ctx.strokeStyle = PAL[14]; ctx.lineWidth = 0.7 * scale;
        ctx.beginPath();
        for (let k = 1; k < pts.length - 1; k += 2) {
          const sl = pts[k + 1][1] - pts[k - 1][1];
          if (Math.abs(sl) < 3 * scale) continue;
          const len = Math.min(40, Math.abs(sl) * 2.5) * scale;
          ctx.moveTo(pts[k][0], pts[k][1] + 3 * scale); ctx.lineTo(pts[k][0] + sl * 0.5, pts[k][1] + len);
        }
        ctx.stroke();
      }
      // local maxima → peak labels for the three nearest ridges
      if (i >= this.L - 2) {
        for (let k = 8; k < pts.length - 8; k++) {
          const y = pts[k][1];
          let top = true; for (let m = -8; m <= 8; m++) if (pts[k + m][1] < y) { top = false; break; }
          if (top && pts[k][0] > W * 0.2 && pts[k][0] < W * 0.9) { this.peaks.push([pts[k][0], y, i]); k += 40; }
        }
      }
    }
  },
  drawOver(t) {
    if (!SETTINGS.math) return;
    const o = octx;
    o.font = MONO(10); o.textBaseline = 'middle'; o.textAlign = 'center';
    for (const [x, y, i] of this.peaks) {
      const elev = Math.round(1800 + (H - y) / H * 3600 + i * 40);
      o.globalAlpha = 0.6; o.fillStyle = PAL[19]; o.strokeStyle = PAL[17]; o.lineWidth = 0.8 * scale;
      o.beginPath(); o.moveTo(x, y - 4 * scale); o.lineTo(x, y - 22 * scale); o.stroke();
      o.fillText(`▲ ${elev.toLocaleString('en-US')} m`, x, y - 30 * scale);
    }
    // altitude scale on the right
    const x = W * 0.965;
    o.globalAlpha = 0.4; o.strokeStyle = PAL[15]; o.textAlign = 'right';
    o.beginPath(); o.moveTo(x, H * 0.2); o.lineTo(x, H * 0.95); o.stroke();
    for (let k = 0; k <= 6; k++) {
      const y = H * 0.95 - k * (H * 0.75 / 6);
      o.beginPath(); o.moveTo(x - 5 * scale, y); o.lineTo(x, y); o.stroke();
      o.fillText(`${k * 1000} m  ${(101.3 * Math.exp(-k * 1000 / 8400)).toFixed(0)} kPa`, x - 9 * scale, y);
    }
  },
  hud() { return ['haze  β ≈ 0.35 per layer']; }
};
