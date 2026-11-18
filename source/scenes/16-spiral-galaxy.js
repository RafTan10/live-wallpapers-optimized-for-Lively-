// Cosmos — a spiral galaxy. Stars orbit with a flat rotation curve (inner stars take less time
// to go round), while the logarithmic spiral arms turn rigidly as a density wave that stars pass through.
const SCENE = {
  focus: [0.62, 0.5],
  anchors: [[0.28, 0.10], [0.5, 0.06], [0.22, 0.30], [0.62, 0.95], [0.40, 0.92], [0.22, 0.46]],
  title: 'SPIRAL GALAXY · DENSITY-WAVE ARMS',
  sub: 'flat rotation curve · 2 logarithmic arms',
  eqs: [
    { e: 'r = a e^(bθ)', n: 'logarithmic spiral — the shape of the arms' },
    { e: 'v(r) ≈ const ≈ 220 km/s', n: 'observed flat rotation curve' },
    { e: 'v(r) = √(G M(r) / r)', n: 'circular orbital speed' },
    { e: 'M(r) = v² r / G  ∝  r', n: 'mass grows with radius → dark matter' },
    { e: 'Ω(r) = v / r', n: 'inner stars complete an orbit sooner' },
    { e: 'tan ψ = b', n: 'pitch angle of the spiral r = a e^(bθ)' }
  ],
  init() {
    this.R = Math.min(W, H) * 0.44;
    this.n = Math.round(7500 * SETTINGS.density);
    this.stars = [];
    for (let i = 0; i < this.n; i++) {
      const r = Math.pow(Math.random(), 0.65) * 1.0 + 0.02;
      this.stars.push({ r, th: rand(0, TAU), z: (Math.random() - 0.5) * 0.05 * (1.2 - r), b: rand(0.3, 1), s: Math.random() < 0.03 ? 2 : 1 });
    }
    this.bg = [];
    for (let i = 0; i < 220; i++) this.bg.push([Math.random(), Math.random(), rand(0.05, 0.35)]);
    this.tilt = 0.52; this.rot = -0.35;
    this.b = 0.32;                 // spiral tightness: pitch angle ψ = atan(b) ≈ 17.7°
  },
  update() {},
  draw(t, ox, oy) {
    const cx = this.focus[0] * W + ox, cy = this.focus[1] * H + oy, R = this.R;
    const pat = t * 0.018;          // pattern speed (rigid)
    const v = 0.05;                  // flat rotation: ω = v / r
    const ct = Math.cos(this.rot), st = Math.sin(this.rot);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = PAL[18];
    for (const s of this.bg) { ctx.globalAlpha = s[2]; ctx.fillRect(s[0] * W, s[1] * H, 1.2 * scale, 1.2 * scale); }
    // core glow
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.34);
    g.addColorStop(0, shade(0.95, 0.5)); g.addColorStop(0.3, shade(0.7, 0.18)); g.addColorStop(1, shade(0.5, 0));
    ctx.globalAlpha = 1; ctx.fillStyle = g;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(this.rot); ctx.scale(1, this.tilt); ctx.beginPath(); ctx.arc(0, 0, R * 0.34, 0, TAU); ctx.fill(); ctx.restore();
    // stars
    for (const s of this.stars) {
      const th = s.th + v / Math.max(0.06, s.r) * t;
      const armAng = Math.log(s.r / 0.05) / this.b + pat;            // where the arm sits at this radius
      let d = ((th - armAng) % Math.PI + Math.PI) % Math.PI;          // two arms, π apart
      d = Math.min(d, Math.PI - d);
      const inArm = Math.exp(-(d * d) / 0.16);
      const bright = s.b * (0.28 + 0.72 * inArm) * (s.r < 0.25 ? 1.3 : 1);
      if (bright < 0.06) continue;
      const x = s.r * Math.cos(th) * R, y = s.r * Math.sin(th) * R * this.tilt + s.z * R;
      const sx = cx + x * ct - y * st, sy = cy + x * st + y * ct;
      ctx.globalAlpha = bright * 0.85; ctx.fillStyle = PAL[Math.round(12 + 11 * bright)];
      const sz = s.s * scale * (1.1 + inArm * 0.9);
      ctx.fillRect(sx, sy, sz, sz);
    }
    // arm guide curves (the density wave), faint
    ctx.lineWidth = 0.8 * scale; ctx.strokeStyle = PAL[15];
    for (const off of [0, Math.PI]) {
      ctx.globalAlpha = 0.14; ctx.setLineDash([2 * scale, 6 * scale]);
      ctx.beginPath();
      for (let k = 0; k <= 160; k++) {
        const r = 0.05 * Math.exp(this.b * (k / 160) * 3.4 * Math.PI / 1.0 * 0.92);
        if (r > 1.02) break;
        const th = Math.log(r / 0.05) / this.b + pat + off;
        const x = r * Math.cos(th) * R, y = r * Math.sin(th) * R * this.tilt;
        const sx = cx + x * ct - y * st, sy = cy + x * st + y * ct;
        k ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    // rotation-curve inset: observed (flat) vs Keplerian (expected from visible mass)
    const bx = W * 0.22, by = H * 0.62, bw = W * 0.2, bh = H * 0.16;
    ctx.globalAlpha = 0.3; ctx.strokeStyle = PAL[14];
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) { const r = i / 100, vv = Math.min(1, r / 0.08) * (1 - 0.05 * Math.exp(-((r - 0.15) ** 2) / 0.004)) * 0.82; const x = bx + r * bw, y = by + bh - vv * bh; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.globalAlpha = 0.85; ctx.strokeStyle = PAL[21]; ctx.lineWidth = 1.2 * scale; ctx.stroke();
    ctx.beginPath();
    for (let i = 4; i <= 100; i++) { const r = i / 100, vv = Math.min(1, r / 0.08 * 0.82, 0.82 * Math.sqrt(0.12 / r)); const x = bx + r * bw, y = by + bh - vv * bh; i > 4 ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[16]; ctx.setLineDash([3 * scale, 4 * scale]); ctx.stroke(); ctx.setLineDash([]);
    this.ins = [bx, by, bw, bh, cx, cy];
  },
  drawOver(t) {
    if (!SETTINGS.math || !this.ins) return;
    const o = octx, [bx, by, bw, bh, cx, cy] = this.ins;
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'left'; o.fillStyle = PAL[17];
    o.globalAlpha = 0.65; o.fillText('ROTATION CURVE  v(r)', bx, by - 14 * scale);
    o.globalAlpha = 0.5;
    o.fillText('— observed (flat)', bx + bw * 0.45, by + bh * 0.08);
    o.fillText('-- expected from visible mass', bx + bw * 0.45, by + bh * 0.62);
    o.fillText('r', bx + bw + 8 * scale, by + bh); o.fillText('v', bx - 12 * scale, by);
    // scale bar & labels on the galaxy
    o.globalAlpha = 0.5; o.textAlign = 'center';
    const sb = this.R * 0.3;
    o.strokeStyle = PAL[15]; o.lineWidth = 0.8 * scale;
    o.beginPath(); o.moveTo(cx - sb / 2, cy + this.R * 0.62); o.lineTo(cx + sb / 2, cy + this.R * 0.62); o.stroke();
    o.fillText('≈ 15 000 ly', cx, cy + this.R * 0.62 + 14 * scale);
    o.globalAlpha = 0.6; o.textAlign = 'left';
    o.fillText(`arm pitch  ψ = ${(Math.atan(this.b) * 180 / Math.PI).toFixed(1)}°`, cx + this.R * 0.7, cy - this.R * 0.48);
  },
  hud() { return [`${this.n.toLocaleString('en-US')} stars · pattern speed Ωₚ fixed`]; }
};
