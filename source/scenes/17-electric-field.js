// Electromagnetism — four point charges drifting slowly. Field lines are traced live from the positive
// charges by integrating E = Σ kq r̂ / r², over a faint grid of field-direction arrows.
const SCENE = {
  focus: [0.62, 0.5],
  anchors: [[0.28, 0.08], [0.5, 0.05], [0.22, 0.92], [0.62, 0.95], [0.42, 0.95], [0.22, 0.5]],
  title: 'ELECTROSTATIC FIELD · 4 POINT CHARGES',
  sub: 'field lines traced by numerical integration',
  eqs: [
    { e: 'E = k Σ qᵢ (r − rᵢ) / |r − rᵢ|³', n: "Coulomb's law, superposed" },
    { e: '∇ · E = ρ / ε₀', n: "Gauss's law" },
    { e: '∇ × E = 0', n: 'electrostatic field is curl-free' },
    { e: 'E = −∇V,   V = k Σ qᵢ / |r − rᵢ|', n: 'field from the potential' },
    { e: 'k = 1 / (4πε₀) ≈ 8.99 × 10⁹ N·m²/C²', n: "Coulomb's constant" },
    { e: 'dr/ds = E / |E|', n: 'equation of a field line' }
  ],
  init() {
    this.q = [
      { q: 1, ax: 0.16, ay: 0.12, fx: 0.11, fy: 0.07, px: 0, py: 1, cx: 0.5, cy: 0.38 },
      { q: -1, ax: 0.14, ay: 0.12, fx: 0.08, fy: 0.13, px: 2, py: 0.5, cx: 0.74, cy: 0.62 },
      { q: 1, ax: 0.1, ay: 0.14, fx: 0.06, fy: 0.09, px: 4, py: 3, cx: 0.86, cy: 0.3 },
      { q: -1, ax: 0.12, ay: 0.1, fx: 0.1, fy: 0.05, px: 1, py: 5, cx: 0.5, cy: 0.72 }
    ];
    this.nl = SETTINGS.lines;
    this.probes = [];
    for (let i = 0; i < 40; i++) this.probes.push({ x: Math.random(), y: Math.random(), g: pick(), age: Math.random() * 6 });
  },
  pos(c, t) { return [(c.cx + c.ax * Math.sin(t * c.fx + c.px)) * W, (c.cy + c.ay * Math.sin(t * c.fy + c.py)) * H]; },
  field(x, y) {
    let ex = 0, ey = 0;
    for (const c of this.cur) {
      const dx = x - c[0], dy = y - c[1], r2 = dx * dx + dy * dy + 30, r3 = r2 * Math.sqrt(r2);
      ex += c[2] * dx / r3; ey += c[2] * dy / r3;
    }
    return [ex, ey];
  },
  update(dt, t) {
    this.cur = this.q.map(c => { const p = this.pos(c, t); return [p[0], p[1], c.q]; });
    for (const p of this.probes) {
      const e = this.field(p.x * W, p.y * H), m = Math.hypot(e[0], e[1]) || 1;
      p.x += e[0] / m * 0.03 * dt; p.y += e[1] / m * 0.03 * dt; p.age += dt;
      let near = false; for (const c of this.cur) if (Math.hypot(p.x * W - c[0], p.y * H - c[1]) < 20 * scale) near = true;
      if (p.age > 9 || near || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) { p.x = Math.random(); p.y = Math.random(); p.age = 0; p.g = pick(); }
    }
  },
  draw(t, ox, oy) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.save(); ctx.translate(ox, oy);
    // direction arrows on a grid, length ∝ log|E|
    const sp = 52 * scale;
    ctx.lineWidth = 0.8 * scale; ctx.strokeStyle = PAL[14];
    for (let y = sp / 2; y < H; y += sp) for (let x = sp / 2; x < W; x += sp) {
      const e = this.field(x, y), m = Math.hypot(e[0], e[1]);
      if (m === 0) continue;
      const ux = e[0] / m, uy = e[1] / m, L = clamp(Math.log10(m * 1e6) * 4, 3, 13) * scale;
      ctx.globalAlpha = 0.18;
      ctx.beginPath(); ctx.moveTo(x - ux * L / 2, y - uy * L / 2); ctx.lineTo(x + ux * L / 2, y + uy * L / 2);
      ctx.lineTo(x + ux * L / 2 - (ux * 0.9 - uy * 0.45) * 3.5 * scale, y + uy * L / 2 - (uy * 0.9 + ux * 0.45) * 3.5 * scale);
      ctx.stroke();
    }
    // field lines from each positive charge
    const h = 5 * scale;
    for (const c of this.cur) {
      if (c[2] < 0) continue;
      for (let k = 0; k < this.nl; k++) {
        const a = k / this.nl * TAU + t * 0.01;
        let x = c[0] + Math.cos(a) * 9 * scale, y = c[1] + Math.sin(a) * 9 * scale;
        ctx.beginPath(); ctx.moveTo(x, y);
        let done = false;
        for (let s = 0; s < 420 && !done; s++) {
          const e1 = this.field(x, y), m1 = Math.hypot(e1[0], e1[1]) || 1;
          const mx = x + e1[0] / m1 * h / 2, my = y + e1[1] / m1 * h / 2;
          const e2 = this.field(mx, my), m2 = Math.hypot(e2[0], e2[1]) || 1;
          x += e2[0] / m2 * h; y += e2[1] / m2 * h;
          ctx.lineTo(x, y);
          if (x < -50 || x > W + 50 || y < -50 || y > H + 50) done = true;
          for (const d of this.cur) if (d[2] < 0 && Math.hypot(x - d[0], y - d[1]) < 8 * scale) done = true;
        }
        ctx.globalAlpha = 0.32; ctx.strokeStyle = PAL[18]; ctx.lineWidth = 0.9 * scale; ctx.stroke();
      }
    }
    // equipotential-ish rings around each charge
    for (const c of this.cur) {
      for (let k = 1; k <= 4; k++) {
        ctx.globalAlpha = 0.12 / k * 2; ctx.strokeStyle = PAL[c[2] > 0 ? 20 : 15];
        ctx.setLineDash(c[2] > 0 ? [] : [2 * scale, 4 * scale]);
        ctx.beginPath(); ctx.arc(c[0], c[1], k * 22 * scale, 0, TAU); ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.95; ctx.strokeStyle = PAL[23]; ctx.lineWidth = 1.4 * scale;
      ctx.beginPath(); ctx.arc(c[0], c[1], 9 * scale, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c[0] - 4.5 * scale, c[1]); ctx.lineTo(c[0] + 4.5 * scale, c[1]);
      if (c[2] > 0) { ctx.moveTo(c[0], c[1] - 4.5 * scale); ctx.lineTo(c[0], c[1] + 4.5 * scale); }
      ctx.stroke();
    }
    // test charges drifting along the field
    ctx.font = MONO(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL[21];
    for (const p of this.probes) { ctx.globalAlpha = 0.6 * Math.sin(Math.PI * p.age / 9); ctx.fillText(p.g, p.x * W, p.y * H); }
    ctx.restore();
  },
  drawOver(t, ox, oy) {
    if (!SETTINGS.math || !this.cur) return;
    const o = octx;
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'left';
    this.cur.forEach((c, i) => {
      o.globalAlpha = 0.7; o.fillStyle = PAL[19];
      o.fillText(`q${'₁₂₃₄'[i]} = ${c[2] > 0 ? '+' : '−'}1`, c[0] + ox + 16 * scale, c[1] + oy - 14 * scale);
    });
    // field-strength readout at a probe point
    const px = W * 0.66, py = H * 0.5, e = this.field(px - ox, py - oy), m = Math.hypot(e[0], e[1]);
    o.globalAlpha = 0.7; o.strokeStyle = PAL[21]; o.lineWidth = 1 * scale;
    o.beginPath(); o.arc(px, py, 4 * scale, 0, TAU); o.stroke();
    o.fillStyle = PAL[18];
    o.fillText(`|E| = ${(m * 1e5).toFixed(2)}  (arb.)`, px + 12 * scale, py + 16 * scale);
    o.fillText(`direction ${((Math.atan2(-e[1], e[0]) * 180 / Math.PI + 360) % 360).toFixed(0)}°`, px + 12 * scale, py + 32 * scale);
  },
  hud() { return [`${this.nl} lines per positive charge · midpoint (RK2) steps`]; }
};
