// Chemistry — a rock-salt (NaCl) crystal lattice turning in 3D. A (111) lattice plane sweeps through
// the crystal, and an inset shows X-rays reflecting off lattice planes (Bragg's law).
const SCENE = {
  focus: [0.62, 0.48],
  anchors: [[0.30, 0.10], [0.54, 0.06], [0.24, 0.30], [0.62, 0.95], [0.40, 0.92], [0.24, 0.46]],
  title: 'ROCK SALT · NaCl · Fm3̄m',
  sub: 'a = 5.64 Å · coordination 6 : 6',
  eqs: [
    { e: 'nλ = 2d sin θ', n: "Bragg's law of X-ray diffraction" },
    { e: 'd_hkl = a / √(h² + k² + l²)', n: 'spacing of the (hkl) lattice planes' },
    { e: 'a = 5.64 Å', n: 'lattice constant of sodium chloride' },
    { e: 'M ≈ 1.7476', n: 'Madelung constant of the rock-salt structure' },
    { e: 'U = −M z² e² N_A / (4πε₀ r₀) (1 − 1/n)', n: 'Born–Landé lattice energy' },
    { e: 'h x + k y + l z = 1', n: 'equation of a (hkl) plane in cell units' }
  ],
  init() {
    this.pts = [];
    const n = SETTINGS.size;
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) for (let k = -n; k <= n; k++)
      this.pts.push({ p: [i, j, k], na: ((i + j + k) % 2 + 2) % 2 === 0 });
    this.U = Math.min(W, H) * 0.115 * (2 / n);
    this.theta = 0.3;
  },
  update(dt, t) { this.theta = 0.18 + 0.32 * (0.5 + 0.5 * Math.sin(t * 0.13)); },
  proj(v, ry, rx, cx, cy) {
    let [x, y, z] = v;
    let c = Math.cos(ry), s = Math.sin(ry);
    [x, z] = [x * c - z * s, x * s + z * c];
    c = Math.cos(rx); s = Math.sin(rx);
    [y, z] = [y * c - z * s, y * s + z * c];
    const d = 14, f = d / (d + z);
    return [cx + x * this.U * f, cy - y * this.U * f, z, f];
  },
  draw(t, ox, oy) {
    const cx = this.focus[0] * W + ox, cy = this.focus[1] * H + oy;
    const ry = t * 0.07, rx = 0.42 + 0.12 * Math.sin(t * 0.05);
    const n = SETTINGS.size;
    const P = this.pts.map(q => this.proj(q.p, ry, rx, cx, cy));
    const plane = Math.round(((t * 0.35) % (6 * n + 2)) - (3 * n + 1));      // which (111) plane is lit
    ctx.globalCompositeOperation = 'lighter';
    // bonds along the axes
    ctx.lineWidth = 0.8 * scale;
    const idx = (i, j, k) => ((i + n) * (2 * n + 1) + (j + n)) * (2 * n + 1) + (k + n);
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) for (let k = -n; k <= n; k++) {
      const a = P[idx(i, j, k)];
      for (const [di, dj, dk] of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
        if (i + di > n || j + dj > n || k + dk > n) continue;
        const b = P[idx(i + di, j + dj, k + dk)];
        const front = 0.5 - (a[2] + b[2]) / (4 * n);
        ctx.globalAlpha = 0.05 + 0.18 * front; ctx.strokeStyle = PAL[13];
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
    }
    // conventional unit cell (edge = 2 ion spacings)
    const cube = [[0, 0, 0], [2, 0, 0], [2, 2, 0], [0, 2, 0], [0, 0, 2], [2, 0, 2], [2, 2, 2], [0, 2, 2]].map(v => this.proj(v, ry, rx, cx, cy));
    ctx.globalAlpha = 0.7; ctx.strokeStyle = PAL[21]; ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) {
      ctx.moveTo(cube[a][0], cube[a][1]); ctx.lineTo(cube[b][0], cube[b][1]);
    }
    ctx.stroke();
    // ions, back to front
    const order = P.map((p, i) => i).sort((a, b) => P[b][2] - P[a][2]);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const i of order) {
      const q = this.pts[i], p = P[i];
      const [a, b, c] = q.p, onPlane = a + b + c === plane;
      const front = 0.5 - p[2] / (2 * n * 1.8);
      const r = (q.na ? 3.2 : 5.6) * scale * p[3] * (this.U / (Math.min(W, H) * 0.085));
      ctx.globalAlpha = (0.25 + 0.55 * front) * (onPlane ? 1.6 : 1);
      ctx.strokeStyle = PAL[onPlane ? 23 : q.na ? 16 : 19]; ctx.lineWidth = 1 * scale;
      ctx.beginPath(); ctx.arc(p[0], p[1], r * 1.6, 0, TAU); ctx.stroke();
      if (onPlane || q.na) { ctx.fillStyle = PAL[onPlane ? 23 : 17]; ctx.beginPath(); ctx.arc(p[0], p[1], r * 0.5, 0, TAU); ctx.fill(); }
    }
    // Bragg inset: planes, incoming and reflected rays
    const bx = W * 0.24, by = H * 0.62, bw = W * 0.2, d = H * 0.035, th = this.theta;
    ctx.lineWidth = 0.9 * scale;
    for (let k = 0; k < 4; k++) {
      ctx.globalAlpha = 0.35; ctx.strokeStyle = PAL[15];
      ctx.beginPath(); ctx.moveTo(bx, by + k * d); ctx.lineTo(bx + bw, by + k * d); ctx.stroke();
      ctx.fillStyle = PAL[16];
      for (let x = bx + 8 * scale; x < bx + bw; x += 22 * scale) { ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(x, by + k * d, 2 * scale, 0, TAU); ctx.fill(); }
    }
    const hx = bx + bw * 0.5, L = bw * 0.55;
    for (let k = 0; k < 2; k++) {
      const yk = by + k * d;
      ctx.globalAlpha = 0.75 - k * 0.25; ctx.strokeStyle = PAL[22];
      ctx.beginPath();
      ctx.moveTo(hx - Math.cos(th) * L, yk - Math.sin(th) * L); ctx.lineTo(hx, yk);
      ctx.lineTo(hx + Math.cos(th) * L, yk - Math.sin(th) * L); ctx.stroke();
    }
    // intensity: N-slit interference of planes, peaks when 2d sinθ / λ is an integer
    const lam = 0.3, ratio = 2 * 1 * Math.sin(th) / lam, N = 6;
    const num = Math.sin(N * Math.PI * ratio), den = Math.sin(Math.PI * ratio);
    this.I = Math.abs(den) < 1e-6 ? 1 : (num * num) / (den * den) / (N * N);
    this.ratio = ratio;
    const gx = bx, gy = by + 4 * d + 26 * scale, gw = bw, gh = H * 0.05;
    ctx.globalAlpha = 0.3; ctx.strokeStyle = PAL[14];
    ctx.beginPath(); ctx.moveTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const a = 0.18 + 0.32 * i / 200, r2 = 2 * Math.sin(a) / lam;
      const nn = Math.sin(N * Math.PI * r2), dd = Math.sin(Math.PI * r2);
      const I = Math.abs(dd) < 1e-6 ? 1 : nn * nn / (dd * dd) / (N * N);
      const x = gx + i / 200 * gw, y = gy + gh - I * gh;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.globalAlpha = 0.6; ctx.strokeStyle = PAL[19]; ctx.stroke();
    const mxk = gx + (th - 0.18) / 0.32 * gw;
    ctx.globalAlpha = 0.9; ctx.strokeStyle = PAL[23];
    ctx.beginPath(); ctx.moveTo(mxk, gy); ctx.lineTo(mxk, gy + gh); ctx.stroke();
    this.inset = [bx, by, bw, d, gx, gy, gw, gh];
    this.plane = plane;
  },
  drawOver() {
    if (!SETTINGS.math || !this.inset) return;
    const o = octx, [bx, by, bw, d, gx, gy, gw, gh] = this.inset;
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'left'; o.fillStyle = PAL[17];
    o.globalAlpha = 0.65;
    o.fillText(`BRAGG REFLECTION   θ = ${(this.theta * 180 / Math.PI).toFixed(1)}°`, bx, by - 22 * scale);
    o.globalAlpha = 0.45;
    o.fillText(`2d sin θ / λ = ${this.ratio.toFixed(2)}   I/I₀ = ${this.I.toFixed(2)}${this.I > 0.8 ? '   ← peak (n = ' + Math.round(this.ratio) + ')' : ''}`, gx, gy + gh + 16 * scale);
    o.fillText('d', bx - 12 * scale, by + d / 2);
    o.globalAlpha = 0.55; o.textAlign = 'right';
    o.fillText(`lit plane (111):  h + k + l = ${this.plane}`, W * 0.95, H * 0.86);
    o.fillText('○ Cl⁻  r = 1.81 Å     ● Na⁺  r = 1.02 Å', W * 0.95, H * 0.86 + 16 * scale);
  },
  hud() { return [`${this.pts.length} ions shown`]; }
};
