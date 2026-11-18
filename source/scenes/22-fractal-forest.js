// Nature — a moonlit forest of fractal trees, each grown by the same branching rule, swaying in the wind.
// Leaves drift down and fireflies wander between the trunks.
const SCENE = {
  focus: [0.7, 0.28],
  glow: 0.24,
  anchors: [[0.24, 0.08], [0.46, 0.05], [0.24, 0.2], [0.44, 0.16], [0.6, 0.07], [0.24, 0.32]],
  title: 'FRACTAL FOREST · BRANCHING RULES',
  sub: 'depth 9 · length ratio ≈ 0.72',
  eqs: [
    { e: 'F → F[+F][−F]', n: 'L-system rule: every branch grows two branches' },
    { e: 'd² = d₁² + d₂²', n: "Leonardo's rule — cross-section is conserved at a fork" },
    { e: 'ℓₙ = ℓ₀ rⁿ', n: 'branch length shrinks geometrically' },
    { e: 'D = log 2 / log(1/r)', n: 'fractal dimension of the branching' },
    { e: 'N = 2ⁿ', n: 'branches at depth n' },
    { e: 'θ_bend ∝ F L³ / (3 E I)', n: 'a branch bends in the wind like a cantilever' }
  ],
  init() {
    this.ground = H * 0.86;
    this.trees = [];
    const xs = [0.34, 0.48, 0.6, 0.73, 0.86, 0.95, 0.27];
    xs.forEach((x, i) => this.trees.push({ x, L: H * rand(0.11, 0.17) * (i === 2 ? 1.3 : 1), seed: i * 97 + 13, depth: i === 2 ? 10 : 9, a: rand(0.32, 0.46), back: i >= 5 }));
    this.leaves = [];
    for (let i = 0; i < 45; i++) this.leaves.push(this.newLeaf(true));
    this.flies = [];
    for (let i = 0; i < 34; i++) this.flies.push({ x: rand(0.25, 1), y: rand(0.55, 0.85), ph: rand(0, TAU), f: rand(0.25, 0.6), s: rand(0, 100) });
    this.grass = [];
    for (let i = 0; i < 260; i++) this.grass.push({ x: Math.random(), h: rand(6, 18), ph: rand(0, TAU) });
  },
  newLeaf(any) { return { x: rand(0.25, 1), y: any ? rand(0.1, 0.85) : rand(0.15, 0.4), vy: rand(0.015, 0.03), ph: rand(0, TAU), a: rand(0, TAU), w: rand(-1.5, 1.5) }; },
  update(dt, t) {
    for (const l of this.leaves) { l.y += l.vy * dt; l.x += Math.sin(t * 0.7 + l.ph) * 0.004 * dt - 0.004 * dt; l.a += l.w * dt; if (l.y > 0.86) Object.assign(l, this.newLeaf(false)); }
    for (const f of this.flies) { f.s += dt; f.x += noise3(f.s * 0.2, f.ph, 1) * 0.02 * dt; f.y += noise3(f.ph, f.s * 0.2, 2) * 0.015 * dt; f.y = clamp(f.y, 0.45, 0.85); if (f.x < 0.22) f.x = 1; if (f.x > 1) f.x = 0.22; }
  },
  branch(x, y, ang, len, d, seed, t, tree, out) {
    const sway = Math.sin(t * 0.6 + tree.x * 7 + (tree.depth - d) * 0.35) * 0.035 * (tree.depth - d + 1) / tree.depth;
    const a = ang + sway;
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    out.push([x, y, x2, y2, d]);
    if (d <= 1) return;
    const h1 = hash(seed), h2 = hash(seed + 1.7);
    const spread = tree.a * (0.8 + 0.5 * h1);
    this.branch(x2, y2, a - spread * (0.7 + 0.4 * h2), len * (0.68 + 0.08 * h1), d - 1, seed * 2 + 1, t, tree, out);
    this.branch(x2, y2, a + spread * (0.7 + 0.4 * h1), len * (0.68 + 0.08 * h2), d - 1, seed * 2 + 2, t, tree, out);
  },
  draw(t, ox, oy) {
    const mx = this.focus[0] * W + ox * 0.2, my = this.focus[1] * H + oy * 0.2, mr = H * 0.07;
    ctx.globalCompositeOperation = 'lighter';
    // moon with a halo
    ctx.globalAlpha = 0.85; ctx.fillStyle = shade(0.75, 0.4);
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[21]; ctx.lineWidth = 1 * scale;
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.12; ctx.beginPath(); ctx.arc(mx, my, mr * 2.1, 0, TAU); ctx.stroke();
    // trees
    for (const tree of this.trees) {
      const segs = [];
      this.branch(tree.x * W + ox * (tree.back ? 0.3 : 0.7), this.ground + oy * 0.5, -Math.PI / 2, tree.L, tree.depth, tree.seed, t, tree, segs);
      // batch by depth: one stroke per level
      const byD = {};
      for (const sg of segs) (byD[sg[4]] = byD[sg[4]] || []).push(sg);
      for (const d in byD) {
        const k = d / tree.depth;
        ctx.globalAlpha = (tree.back ? 0.25 : 0.45) + 0.3 * k;
        ctx.strokeStyle = PAL[Math.round((tree.back ? 12 : 15) + 6 * k)];
        ctx.lineWidth = Math.max(0.5, Math.pow(Math.SQRT1_2, tree.depth - d) * 7) * scale * (tree.back ? 0.7 : 1);
        ctx.beginPath();
        for (const [x1, y1, x2, y2] of byD[d]) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
        ctx.stroke();
      }
      ctx.globalAlpha = 0.35; ctx.fillStyle = PAL[19];
      ctx.beginPath();
      for (const [x1, y1, x2, y2] of byD[1] || []) {
        if (hash(Math.round(x2) * 0.13 + Math.round(y2)) < 0.35) { ctx.moveTo(x2 + 2.4 * scale, y2); ctx.ellipse(x2, y2, 2.4 * scale, 1.3 * scale, 0, 0, TAU); }
      }
      ctx.fill();
      if (tree === this.trees[2]) this.main = { x: tree.x * W + ox * 0.7, y: this.ground, L: tree.L };
    }
    // ground and grass
    ctx.globalAlpha = 0.45; ctx.strokeStyle = PAL[16]; ctx.lineWidth = 1 * scale;
    ctx.beginPath(); ctx.moveTo(0, this.ground); for (let x = 0; x <= W; x += 10 * scale) ctx.lineTo(x, this.ground + noise3(x * 0.004, 7, 1) * 6 * scale + oy * 0.5); ctx.stroke();
    ctx.lineWidth = 0.7 * scale; ctx.strokeStyle = PAL[15];
    ctx.beginPath();
    for (const g of this.grass) {
      const x = g.x * W, y = this.ground + oy * 0.5, sw = Math.sin(t * 0.9 + g.ph) * 3 * scale;
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sw * 0.4, y - g.h * scale * 0.6, x + sw, y - g.h * scale);
    }
    ctx.globalAlpha = 0.35; ctx.stroke();
    // falling leaves
    ctx.strokeStyle = PAL[18]; ctx.lineWidth = 0.8 * scale;
    for (const l of this.leaves) {
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.ellipse(l.x * W, l.y * H, 4 * scale, 1.8 * scale * Math.abs(Math.cos(l.a)) + 0.4, l.a * 0.5, 0, TAU); ctx.stroke();
    }
    // fireflies: soft glow, slow pulse
    for (const f of this.flies) {
      const p = 0.5 + 0.5 * Math.sin(t * f.f * TAU * 0.5 + f.ph);
      const x = f.x * W, y = f.y * H;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 9 * scale);
      g.addColorStop(0, shade(1, 0.55 * p)); g.addColorStop(1, shade(0.8, 0));
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(x - 9 * scale, y - 9 * scale, 18 * scale, 18 * scale);
    }
  },
  drawOver(t) {
    if (!SETTINGS.math || !this.main) return;
    const o = octx, m = this.main;
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'left'; o.lineWidth = 0.8 * scale;
    // trunk length annotation and branching levels
    o.globalAlpha = 0.45; o.strokeStyle = PAL[16];
    const x = m.x - 26 * scale;
    o.beginPath(); o.moveTo(x, m.y); o.lineTo(x, m.y - m.L); o.moveTo(x - 4 * scale, m.y); o.lineTo(x + 4 * scale, m.y); o.moveTo(x - 4 * scale, m.y - m.L); o.lineTo(x + 4 * scale, m.y - m.L); o.stroke();
    o.globalAlpha = 0.65; o.fillStyle = PAL[18]; o.textAlign = 'right';
    o.fillText('ℓ₀', x - 8 * scale, m.y - m.L / 2);
    let y = m.y - m.L, L = m.L * 0.72;
    for (let n = 1; n <= 4; n++) {
      o.globalAlpha = 0.4;
      o.fillText(`ℓ${'₀₁₂₃₄'[n]} ≈ ${(0.72 ** n).toFixed(2)} ℓ₀   ${2 ** n} branches`, x - 8 * scale, y - L * 0.5);
      y -= L; L *= 0.72;
    }
    o.textAlign = 'left'; o.globalAlpha = 0.55;
    o.fillText(`D = log 2 / log(1/0.72) ≈ ${(Math.log(2) / Math.log(1 / 0.72)).toFixed(2)}`, W * 0.24, H * 0.92);
  },
  hud() { return [`${this.trees.length} trees · ${this.flies.length} fireflies`]; }
};
