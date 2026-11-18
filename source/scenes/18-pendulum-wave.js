// Mechanics — a pendulum wave: 18 pendulums whose lengths are chosen so they complete
// 51, 52, 53 … swings in the same 60 s. They drift into travelling waves, then realign.
const SCENE = {
  focus: [0.62, 0.42],
  anchors: [[0.26, 0.10], [0.5, 0.06], [0.22, 0.88], [0.62, 0.96], [0.42, 0.95], [0.22, 0.72]],
  title: 'PENDULUM WAVE · 18 PENDULUMS',
  sub: 'Γ = 60 s · N = 51 … 68 oscillations per cycle',
  eqs: [
    { e: 'T = 2π √(L / g)', n: 'period of a simple pendulum (small angles)' },
    { e: 'Lₙ = g (Γ / (2π(N + n)))²', n: 'length so pendulum n swings N + n times in Γ' },
    { e: 'θₙ(t) = θ₀ cos(2π (N + n) t / Γ)', n: 'each pendulum on its own' },
    { e: 'Δφ = 2π t / Γ', n: 'neighbouring phase difference grows linearly' },
    { e: 'θ̈ + (g / L) sin θ = 0', n: 'full pendulum equation' },
    { e: 'E = ½ m L² θ̇² + m g L (1 − cos θ)', n: 'energy of one pendulum' }
  ],
  init() {
    this.n = 18; this.N = 51; this.G = 60;
    this.L = Array.from({ length: this.n }, (_, k) => 9.81 * (this.G / (TAU * (this.N + k))) ** 2);
    this.trails = Array.from({ length: this.n }, () => []);
  },
  update() {},
  geom() {
    const x0 = W * 0.4, x1 = W * 0.86, top = H * 0.14;
    const Lmax = this.L[0], scaleL = H * 0.85 / Lmax;
    return { x0, x1, top, scaleL };
  },
  draw(t, ox, oy) {
    const { x0, x1, top, scaleL } = this.geom();
    const th0 = 0.38;
    ctx.globalCompositeOperation = 'lighter';
    // 3D: the bar runs left–right; each pendulum swings toward/away from the viewer.
    // Seen from the front and a little above, the bobs trace a wave down the screen.
    const P3 = (x, y, z) => [x + ox + y * 0.18, top + oy - z * 0.6 + y * 0.35];
    const b0 = P3(x0 - 20 * scale, 0, 0), b1 = P3(x1 + 20 * scale, 0, 0);
    ctx.globalAlpha = 0.7; ctx.strokeStyle = PAL[19]; ctx.lineWidth = 2 * scale;
    ctx.beginPath(); ctx.moveTo(b0[0], b0[1]); ctx.lineTo(b1[0], b1[1]); ctx.stroke();
    ctx.globalAlpha = 0.25; ctx.lineWidth = 1 * scale;
    for (const xx of [x0 - 20 * scale, x1 + 20 * scale]) { const a = P3(xx, 0, 0), b = P3(xx, 0, -H * 0.98); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    this.bobs = [];
    for (let k = 0; k < this.n; k++) {
      const ph = TAU * (this.N + k) * t / this.G;
      const th = th0 * Math.cos(ph);
      const px = lerp(x0, x1, k / (this.n - 1));
      const Ls = this.L[k] * scaleL;
      const piv = P3(px, 0, 0), bob = P3(px, Math.sin(th) * Ls, -Math.cos(th) * Ls);
      const bx = bob[0], by = bob[1];
      // V-shaped double string (as on a real pendulum-wave rig)
      ctx.globalAlpha = 0.3; ctx.strokeStyle = PAL[16]; ctx.lineWidth = 0.8 * scale;
      ctx.beginPath(); ctx.moveTo(piv[0] - 7 * scale, piv[1]); ctx.lineTo(bx, by); ctx.lineTo(piv[0] + 7 * scale, piv[1]); ctx.stroke();
      const tr = this.trails[k]; tr.push([bx, by]); if (tr.length > 9) tr.shift();
      ctx.beginPath(); tr.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.globalAlpha = 0.18; ctx.strokeStyle = PAL[20]; ctx.lineWidth = 1.4 * scale; ctx.stroke();
      const v = Math.abs(Math.sin(ph)), near = 0.5 + 0.5 * Math.sin(th) / Math.sin(th0);
      const rad = (5.5 + 2.5 * near) * scale;
      ctx.globalAlpha = 0.6 + 0.35 * v; ctx.fillStyle = PAL[Math.round(15 + 8 * near)];
      ctx.beginPath(); ctx.arc(bx, by, rad, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.6; ctx.strokeStyle = PAL[23]; ctx.lineWidth = 1 * scale;
      ctx.beginPath(); ctx.arc(bx, by, rad + 3 * scale, 0, TAU); ctx.stroke();
      // shadow on the floor directly below
      const sh = P3(px, Math.sin(th) * Ls, -H * 0.98);
      ctx.globalAlpha = 0.25; ctx.fillStyle = PAL[14];
      ctx.beginPath(); ctx.ellipse(sh[0], sh[1], 8 * scale, 2.2 * scale, 0, 0, TAU); ctx.fill();
      this.bobs.push([bx, by, th]);
    }
    // the instantaneous wave through the bobs
    ctx.globalAlpha = 0.25; ctx.strokeStyle = PAL[21]; ctx.lineWidth = 1 * scale; ctx.setLineDash([3 * scale, 4 * scale]);
    ctx.beginPath(); this.bobs.forEach((b, i) => i ? ctx.lineTo(b[0], b[1]) : ctx.moveTo(b[0], b[1])); ctx.stroke(); ctx.setLineDash([]);
    // phase diagram: θ of each pendulum vs index
    const gx = W * 0.22, gy = H * 0.28, gw = W * 0.12, gh = H * 0.26;
    ctx.globalAlpha = 0.3; ctx.strokeStyle = PAL[14];
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.beginPath(); ctx.moveTo(gx, gy + gh / 2); ctx.lineTo(gx + gw, gy + gh / 2); ctx.stroke();
    ctx.fillStyle = PAL[22];
    this.bobs.forEach((b, i) => {
      const x = gx + (i + 0.5) / this.n * gw, y = gy + gh / 2 - b[2] / th0 * gh * 0.45;
      ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(x, y, 2.2 * scale, 0, TAU); ctx.fill();
    });
    // phase-space portrait of pendulum 1: θ vs θ̇
    const qx = gx + gw / 2, qy = gy + gh + H * 0.17, qr = H * 0.1;
    ctx.globalAlpha = 0.25; ctx.strokeStyle = PAL[14];
    ctx.beginPath(); ctx.moveTo(qx - qr * 1.2, qy); ctx.lineTo(qx + qr * 1.2, qy); ctx.moveTo(qx, qy - qr * 1.2); ctx.lineTo(qx, qy + qr * 1.2); ctx.stroke();
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[19];
    ctx.beginPath(); ctx.ellipse(qx, qy, qr, qr * 0.75, 0, 0, TAU); ctx.stroke();
    const ph0 = TAU * this.N * t / this.G;
    ctx.globalAlpha = 0.95; ctx.fillStyle = PAL[23];
    ctx.beginPath(); ctx.arc(qx + Math.cos(ph0) * qr, qy - Math.sin(ph0) * qr * 0.75, 3 * scale, 0, TAU); ctx.fill();
    this.ins = [gx, gy, gw, gh, qx, qy, qr];
  },
  drawOver(t) {
    if (!SETTINGS.math || !this.ins) return;
    const o = octx, [gx, gy, gw, gh, qx, qy, qr] = this.ins;
    const { x0, x1, top } = this.geom();
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'left'; o.fillStyle = PAL[17];
    o.globalAlpha = 0.65; o.fillText('θₙ  vs  n', gx, gy - 14 * scale);
    o.fillText('PHASE SPACE  (θ, θ̇)  pendulum 1', qx - qr * 1.2, qy - qr * 1.2 - 14 * scale);
    const tc = t % this.G, left = this.G - tc;
    o.globalAlpha = 0.6;
    o.fillText(`cycle ${(tc).toFixed(1).padStart(4, '0')} / ${this.G} s   realigns in ${left.toFixed(1)} s`, x0, H * 0.94);
    o.globalAlpha = 0.45; o.textAlign = 'center';
    for (const k of [0, this.n - 1]) {
      const x = lerp(x0, x1, k / (this.n - 1));
      o.fillText(`L = ${(this.L[k] * 100).toFixed(1)} cm`, x, top - 18 * scale);
    }
  },
  hud(t) { return [`pattern repeats every ${this.G} s`]; }
};
