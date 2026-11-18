// Chaos — the Lorenz attractor. Two trajectories start 10⁻⁵ apart and drift into
// completely different paths: the butterfly effect, with the gap measured live.
const SCENE = {
  focus: [0.62, 0.5],
  title: 'LORENZ SYSTEM · σ = 10  ρ = 28  β = 8/3',
  sub: 'RK4 integration · two trajectories, δ₀ = 10⁻⁵',
  eqs: [
    { e: 'dx/dt = σ (y − x)', n: 'Lorenz (1963)' },
    { e: 'dy/dt = x (ρ − z) − y', n: 'Lorenz (1963)' },
    { e: 'dz/dt = x y − β z', n: 'Lorenz (1963)' },
    { e: 'δ(t) ≈ δ₀ · e^(λt),  λ ≈ 0.906', n: 'largest Lyapunov exponent' },
    { e: 'C± = (±√(β(ρ−1)), ±√(β(ρ−1)), ρ − 1)', n: 'the two unstable fixed points' },
    { e: 'D ≈ 2.06', n: 'fractal dimension of the attractor' }
  ],
  init() {
    this.N = 2600;
    this.S = H * 0.0145;
    const f = (s) => {
      const [x, y, z] = s, sg = 10, r = 28, b = 8 / 3;
      return [sg * (y - x), x * (r - z) - y, x * y - b * z];
    };
    this.f = f;
    let s = [1, 1, 1];
    for (let i = 0; i < 3000; i++) s = this.rk4(s, 0.005);
    // collect successive maxima of z for the Lorenz map z(n+1) vs z(n)
    this.maxima = []; this.zh = [s[2], s[2]];
    let s2 = s;
    for (let i = 0; i < 24000; i++) { s2 = this.rk4(s2, 0.005); this.trackMax(s2[2]); }
    this.A = { s, tr: [] }; this.B = { s: [s[0] + 1e-5, s[1], s[2]], tr: [] };
    for (let i = 0; i < this.N; i++) this.step(0.005);
    this.sinceReset = 0;
    this.gA = pick(); this.gB = pick();
  },
  rk4(s, h) {
    const f = this.f;
    const k1 = f(s), k2 = f(s.map((v, i) => v + h / 2 * k1[i])), k3 = f(s.map((v, i) => v + h / 2 * k2[i])), k4 = f(s.map((v, i) => v + h * k3[i]));
    return s.map((v, i) => v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  },
  trackMax(z) {
    const [a, b] = this.zh;
    if (b > a && b > z) { this.maxima.push(b); if (this.maxima.length > 700) this.maxima.shift(); }
    this.zh = [b, z];
  },
  step(h) {
    for (const T of [this.A, this.B]) {
      T.s = this.rk4(T.s, h);
      T.tr.push(T.s); if (T.tr.length > this.N) T.tr.shift();
    }
    this.trackMax(this.A.s[2]);
  },
  update(dt) {
    const steps = Math.round(dt * SETTINGS.speed / 0.005);
    for (let i = 0; i < steps; i++) this.step(0.005);
    this.sinceReset += dt;
    if (this.sinceReset > SETTINGS.resetEvery) {
      this.B.s = [this.A.s[0] + 1e-5, this.A.s[1], this.A.s[2]];
      this.B.tr = this.B.tr.slice(-2);
      this.sinceReset = 0;
    }
    this.delta = Math.hypot(this.A.s[0] - this.B.s[0], this.A.s[1] - this.B.s[1], this.A.s[2] - this.B.s[2]);
  },
  proj(p, rot, cx, cy) {
    const c = Math.cos(rot), s = Math.sin(rot);
    const x = p[0] * c - p[1] * s, y = p[0] * s + p[1] * c, z = p[2] - 25;
    const el = 0.32;
    return [cx + x * this.S, cy - (z * Math.cos(el) - y * Math.sin(el)) * this.S, y];
  },
  drawTrail(tr, rot, cx, cy, lvl, wmul) {
    const n = tr.length, CH = 10;
    for (let c = 0; c < CH; c++) {
      const i0 = Math.floor(n * c / CH), i1 = Math.min(n - 1, Math.floor(n * (c + 1) / CH));
      if (i1 <= i0) continue;
      ctx.beginPath();
      for (let i = i0; i <= i1; i++) {
        const p = this.proj(tr[i], rot, cx, cy);
        i === i0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
      }
      const f = (c + 1) / CH;
      ctx.globalAlpha = 0.05 + 0.6 * f * f;
      ctx.strokeStyle = PAL[Math.round(lvl - 6 + 6 * f)];
      ctx.lineWidth = (0.7 + 0.9 * f) * scale * wmul;
      ctx.stroke();
    }
  },
  draw(t, ox, oy) {
    const cx = this.focus[0] * W + ox, cy = this.focus[1] * H + oy, rot = -0.8 + t * 0.04;
    ctx.globalCompositeOperation = 'lighter';
    // floor grid in the plane z = 0
    ctx.lineWidth = 0.7 * scale; ctx.strokeStyle = PAL[13];
    for (let k = -25; k <= 25; k += 5) {
      for (const dir of [0, 1]) {
        const a = this.proj(dir ? [k, -25, 0] : [-25, k, 0], rot, cx, cy), b = this.proj(dir ? [k, 25, 0] : [25, k, 0], rot, cx, cy);
        ctx.globalAlpha = k === 0 ? 0.16 : 0.08;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
    }
    // vertical z axis through the origin
    const z0 = this.proj([0, 0, 0], rot, cx, cy), z1 = this.proj([0, 0, 50], rot, cx, cy);
    ctx.globalAlpha = 0.12; ctx.setLineDash([2 * scale, 5 * scale]);
    ctx.beginPath(); ctx.moveTo(z0[0], z0[1]); ctx.lineTo(z1[0], z1[1]); ctx.stroke(); ctx.setLineDash([]);
    // Lorenz map inset: successive maxima of z
    const bx = W * 0.25, by = H * 0.56, bs = H * 0.26;
    ctx.globalAlpha = 0.25; ctx.strokeStyle = PAL[14]; ctx.lineWidth = 0.8 * scale;
    ctx.strokeRect(bx, by, bs, bs);
    ctx.globalAlpha = 0.12;
    ctx.beginPath(); ctx.moveTo(bx, by + bs); ctx.lineTo(bx + bs, by); ctx.stroke();
    const zm = v => (v - 29) / (48 - 29);
    ctx.fillStyle = PAL[20];
    const M = this.maxima;
    for (let i = 0; i + 1 < M.length; i++) {
      const x = bx + zm(M[i]) * bs, y = by + bs - zm(M[i + 1]) * bs;
      ctx.globalAlpha = 0.25 + 0.6 * (i / M.length);
      ctx.fillRect(x - 1 * scale, y - 1 * scale, 2 * scale, 2 * scale);
    }
    if (M.length > 2) {
      const x = bx + zm(M[M.length - 2]) * bs, y = by + bs - zm(M[M.length - 1]) * bs;
      ctx.globalAlpha = 0.9; ctx.strokeStyle = PAL[22];
      ctx.beginPath(); ctx.arc(x, y, 4 * scale, 0, TAU); ctx.stroke();
    }
    this.inset = [bx, by, bs];
    // x(t) time series strip
    const tx = W * 0.25, ty = H * 0.25, tw = W * 0.16, th = H * 0.07;
    const tr = this.A.tr, n = Math.min(tr.length, 1400);
    ctx.globalAlpha = 0.15; ctx.strokeStyle = PAL[14];
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + tw, ty); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = tr[tr.length - n + i], x = tx + i / n * tw, y = ty - p[0] / 20 * th;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.globalAlpha = 0.55; ctx.strokeStyle = PAL[19]; ctx.stroke();
    this.strip = [tx, ty, tw, th];
    this.drawTrail(this.B.tr, rot, cx, cy, 16, 0.8);
    this.drawTrail(this.A.tr, rot, cx, cy, 22, 1);
    // fixed points
    const q = Math.sqrt(8 / 3 * 27);
    ctx.font = MONO(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const sgn of [1, -1]) {
      const p = this.proj([sgn * q, sgn * q, 27], rot, cx, cy);
      ctx.globalAlpha = 0.6; ctx.fillStyle = PAL[18]; ctx.fillText('+', p[0], p[1]);
    }
    this.hA = this.proj(this.A.s, rot, cx, cy); this.hB = this.proj(this.B.s, rot, cx, cy);
    ctx.globalAlpha = 1; ctx.fillStyle = PAL[23]; ctx.font = MONO(13);
    ctx.fillText(this.gA, this.hA[0], this.hA[1]);
    ctx.globalAlpha = 0.8; ctx.fillStyle = PAL[17];
    ctx.fillText(this.gB, this.hB[0], this.hB[1]);
    this.rot = rot; this.c = [cx, cy];
  },
  drawOver(t) {
    if (!SETTINGS.math || !this.hA) return;
    const o = octx;
    o.strokeStyle = PAL[16]; o.fillStyle = PAL[18]; o.lineWidth = 0.8 * scale;
    o.globalAlpha = 0.45; o.setLineDash([2 * scale, 4 * scale]);
    o.beginPath(); o.moveTo(this.hA[0], this.hA[1]); o.lineTo(this.hB[0], this.hB[1]); o.stroke(); o.setLineDash([]);
    o.font = MONO(10.5); o.textAlign = 'left'; o.textBaseline = 'middle';
    o.globalAlpha = 0.75;
    o.fillText(`δ = ${this.delta.toExponential(2)}`, this.hA[0] + 14 * scale, this.hA[1] - 12 * scale);
    o.globalAlpha = 0.45;
    o.fillText('trajectory A', this.hA[0] + 14 * scale, this.hA[1] + 4 * scale);
    // fixed point labels
    const q = Math.sqrt(8 / 3 * 27), [cx, cy] = this.c;
    for (const [sgn, lbl] of [[1, 'C⁺'], [-1, 'C⁻']]) {
      const p = this.proj([sgn * q, sgn * q, 27], this.rot, cx, cy);
      o.globalAlpha = 0.6; o.fillText(lbl, p[0] + 8 * scale, p[1] - 8 * scale);
    }
    // inset labels
    if (this.inset) {
      const [bx, by, bs] = this.inset;
      o.globalAlpha = 0.6; o.textAlign = 'left'; o.fillStyle = PAL[17];
      o.fillText('LORENZ MAP   zₙ₊₁ vs zₙ  (successive maxima)', bx, by - 14 * scale);
      o.globalAlpha = 0.4;
      o.fillText('29', bx - 4 * scale, by + bs + 12 * scale); o.textAlign = 'right'; o.fillText('48', bx + bs, by + bs + 12 * scale);
      o.fillText('48', bx - 6 * scale, by + 4 * scale);
      o.textAlign = 'left';
      o.fillText(`n = ${this.maxima.length}`, bx + bs + 8 * scale, by + bs - 4 * scale);
      const [tx, ty, tw, th] = this.strip;
      o.globalAlpha = 0.55; o.fillText('x(t)  ·  the switching between wings never repeats', tx, ty - th - 12 * scale);
    }
    // axis gizmo
    const gx = W * 0.9, gy = H * 0.82, L = 32 * scale;
    o.globalAlpha = 0.45;
    for (const [v, n] of [[[1, 0, 25], 'x'], [[0, 1, 25], 'y'], [[0, 0, 26], 'z']]) {
      const p0 = this.proj([0, 0, 25], this.rot, 0, 0), p1 = this.proj(v, this.rot, 0, 0);
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1], m = Math.hypot(dx, dy) || 1;
      o.beginPath(); o.moveTo(gx, gy); o.lineTo(gx + dx / m * L, gy + dy / m * L); o.stroke();
      o.fillText(n, gx + dx / m * (L + 8 * scale), gy + dy / m * (L + 8 * scale));
    }
  },
  hud() { return [`separation |δ| = ${this.delta ? this.delta.toExponential(3) : '—'}`, `re-seeded every ${SETTINGS.resetEvery} s`]; }
};
