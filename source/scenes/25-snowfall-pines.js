// Nature — snow falling through a misty pine forest at night, a cabin window glowing.
// Near flakes are drawn as six-fold dendrites; a large magnified crystal turns slowly with its symmetry marked.
const SCENE = {
  focus: [0.6, 0.35],
  glow: 0.22,
  anchors: [[0.24, 0.08], [0.46, 0.05], [0.22, 0.2], [0.44, 0.15], [0.62, 0.08], [0.22, 0.32]],
  title: 'SNOWFALL · ICE Ih CRYSTALS',
  sub: 'six-fold symmetry · dendritic growth',
  eqs: [
    { e: 'v_t = 2 (ρ_p − ρ_f) g r² / (9 μ)', n: 'Stokes terminal velocity (sphere approximation)' },
    { e: 'Pₙ = 3 (4/3)ⁿ  → ∞', n: 'Koch snowflake: infinite perimeter' },
    { e: 'Aₙ → (8/5) A₀', n: '…enclosing a finite area' },
    { e: 'D = log 4 / log 3 ≈ 1.262', n: 'fractal dimension of the Koch curve' },
    { e: 'C₆ · 60°', n: 'hexagonal symmetry of ice Ih' },
    { e: 'T ≈ −15 °C → dendrites', n: 'Nakaya: shape depends on temperature and humidity' }
  ],
  init() {
    this.ground = H * 0.84;
    // pre-render a few dendrite sprites
    this.sprites = [0, 1, 2, 3].map(k => this.makeFlake(48, k));
    this.bigSprite = this.makeFlake(320, 3);
    this.flakes = [];
    for (let i = 0; i < 260; i++) this.flakes.push(this.newFlake(true));
    this.trees = [];
    for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 26 - layer * 6; i++) this.trees.push({ x: Math.random(), h: rand(0.12, 0.26) * (0.6 + layer * 0.25), layer });
    this.trees.sort((a, b) => a.layer - b.layer);
  },
  makeFlake(sz, k) {
    const c = document.createElement('canvas'); c.width = c.height = sz;
    const g = c.getContext('2d'), r = sz / 2;
    g.translate(r, r); g.strokeStyle = PAL[22]; g.lineCap = 'round';
    for (let a = 0; a < 6; a++) {
      g.save(); g.rotate(a * Math.PI / 3);
      const lw = sz / 48;
      g.lineWidth = 1.6 * lw; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * 0.92); g.stroke();
      g.lineWidth = 1.1 * lw;
      const n = 2 + k;
      for (let b = 1; b <= n; b++) {
        const y = -r * (0.25 + 0.6 * b / (n + 1)), l = r * (0.32 - 0.05 * b) * (k % 2 ? 1 : 0.75);
        g.beginPath(); g.moveTo(0, y); g.lineTo(-l * 0.8, y - l * 0.6); g.moveTo(0, y); g.lineTo(l * 0.8, y - l * 0.6); g.stroke();
      }
      g.restore();
    }
    if (k === 3) { g.lineWidth = sz / 48; g.beginPath(); for (let a = 0; a <= 6; a++) { const x = Math.cos(a * Math.PI / 3 + Math.PI / 6) * r * 0.25, y = Math.sin(a * Math.PI / 3 + Math.PI / 6) * r * 0.25; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    return c;
  },
  newFlake(any) {
    const z = Math.random();
    return { x: Math.random(), y: any ? Math.random() : -0.03, z, s: 2 + z * 14, v: 0.02 + z * 0.06, ph: rand(0, TAU), rot: rand(0, TAU), w: rand(-0.6, 0.6), k: (Math.random() * 4) | 0 };
  },
  update(dt, t) {
    for (const f of this.flakes) {
      f.y += f.v * dt; f.x += (Math.sin(t * 0.5 + f.ph) * 0.004 + 0.002) * dt; f.rot += f.w * dt;
      if (f.y > 1.03) Object.assign(f, this.newFlake(false));
      if (f.x > 1.02) f.x = -0.02;
    }
  },
  draw(t, ox, oy) {
    const mx = this.focus[0] * W, my = this.focus[1] * H;
    ctx.globalCompositeOperation = 'lighter';
    // far flakes first
    for (const f of this.flakes) if (f.z < 0.5) { ctx.globalAlpha = 0.25 + f.z * 0.6; ctx.fillStyle = PAL[19]; const s = (1 + f.z * 2) * scale; ctx.fillRect(f.x * W + ox * f.z, f.y * H + oy * f.z, s, s); }
    // pine forest in three layers with mist between
    ctx.globalCompositeOperation = 'source-over';
    for (let layer = 0; layer < 3; layer++) {
      const base = this.ground - (2 - layer) * H * 0.035;
      ctx.globalAlpha = 1; ctx.fillStyle = DARK(12 - layer * 4);
      ctx.beginPath();
      for (const tr of this.trees) {
        if (tr.layer !== layer) continue;
        const x = tr.x * W + ox * (0.2 + layer * 0.3), h = tr.h * H, w = h * 0.28;
        for (let tier = 0; tier < 5; tier++) {
          const y0 = base - h * tier * 0.18, y1 = base - h * (tier * 0.18 + 0.32), ww = w * (1 - tier * 0.17);
          ctx.moveTo(x - ww, y0); ctx.lineTo(x, y1); ctx.lineTo(x + ww, y0);
        }
      }
      ctx.fill();
      // snow on the branch tips
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.18 + layer * 0.1; ctx.strokeStyle = PAL[20]; ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      for (const tr of this.trees) {
        if (tr.layer !== layer) continue;
        const x = tr.x * W + ox * (0.2 + layer * 0.3), h = tr.h * H, w = h * 0.28;
        for (let tier = 0; tier < 5; tier++) { const y0 = base - h * tier * 0.18, ww = w * (1 - tier * 0.17); ctx.moveTo(x - ww * 0.9, y0 - 1); ctx.lineTo(x - ww * 0.4, y0 - h * 0.05); }
      }
      ctx.stroke();
      // mist band
      const mg = ctx.createLinearGradient(0, base - H * 0.08, 0, base);
      mg.addColorStop(0, shade(0.6, 0)); mg.addColorStop(1, shade(0.6, 0.08));
      ctx.globalAlpha = 1; ctx.fillStyle = mg; ctx.fillRect(0, base - H * 0.08, W, H * 0.08);
      ctx.globalCompositeOperation = 'source-over';
    }
    // snowy ground
    ctx.globalAlpha = 1; ctx.fillStyle = DARK(13); ctx.fillRect(0, this.ground, W, H - this.ground);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.4; ctx.strokeStyle = PAL[19]; ctx.lineWidth = 1 * scale;
    ctx.beginPath(); ctx.moveTo(0, this.ground); ctx.lineTo(W, this.ground); ctx.stroke();
    // cabin with a warm window
    const cx = W * 0.8 + ox * 0.9, cy = this.ground, cw = W * 0.06, ch = H * 0.07;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = DARK(3); ctx.beginPath(); ctx.rect(cx - cw / 2, cy - ch, cw, ch); ctx.moveTo(cx - cw * 0.62, cy - ch); ctx.lineTo(cx, cy - ch * 1.75); ctx.lineTo(cx + cw * 0.62, cy - ch); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.6; ctx.strokeStyle = PAL[20];
    ctx.beginPath(); ctx.moveTo(cx - cw * 0.62, cy - ch); ctx.lineTo(cx, cy - ch * 1.75); ctx.lineTo(cx + cw * 0.62, cy - ch); ctx.stroke();
    const wg = ctx.createRadialGradient(cx - cw * 0.15, cy - ch * 0.5, 0, cx - cw * 0.15, cy - ch * 0.5, cw * 1.6);
    wg.addColorStop(0, shade(1, 0.35)); wg.addColorStop(1, shade(0.8, 0));
    ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 1.3); ctx.fillStyle = wg; ctx.fillRect(cx - cw * 2, cy - ch * 2.2, cw * 4, ch * 2.6);
    ctx.globalAlpha = 0.9; ctx.fillStyle = PAL[23]; ctx.fillRect(cx - cw * 0.3, cy - ch * 0.7, cw * 0.28, ch * 0.35);
    // smoke from the chimney
    ctx.strokeStyle = PAL[16]; ctx.lineWidth = 1 * scale;
    for (let k = 0; k < 5; k++) {
      const ph = (t * 0.15 + k / 5) % 1;
      ctx.globalAlpha = 0.25 * (1 - ph);
      ctx.beginPath(); ctx.arc(cx + cw * 0.25 + ph * 30 * scale + Math.sin(t + k) * 4 * scale, cy - ch * 1.6 - ph * 90 * scale, (4 + ph * 14) * scale, 0, TAU); ctx.stroke();
    }
    // near flakes as dendrite sprites
    for (const f of this.flakes) {
      if (f.z < 0.5) continue;
      const s = f.s * scale, x = f.x * W + ox * f.z * 1.5, y = f.y * H + oy * f.z * 1.5;
      ctx.save(); ctx.translate(x, y); ctx.rotate(f.rot);
      ctx.globalAlpha = 0.3 + (f.z - 0.5) * 1.1;
      ctx.drawImage(this.sprites[f.k], -s / 2, -s / 2, s, s);
      ctx.restore();
    }
    // magnified crystal
    const R = H * 0.12, X = W * 0.3, Y = H * 0.44;
    ctx.save(); ctx.translate(X, Y); ctx.rotate(t * 0.05);
    ctx.globalAlpha = 0.8; ctx.drawImage(this.bigSprite, -R, -R, R * 2, R * 2);
    ctx.restore();
    this.big = [X, Y, R, t * 0.05];
  },
  drawOver(t) {
    if (!SETTINGS.math || !this.big) return;
    const o = octx, [X, Y, R, a] = this.big;
    o.lineWidth = 0.8 * scale; o.strokeStyle = PAL[16];
    o.globalAlpha = 0.3; o.setLineDash([2 * scale, 4 * scale]);
    o.beginPath(); o.arc(X, Y, R * 1.12, 0, TAU); o.stroke();
    for (let k = 0; k < 6; k++) { const b = a + k * Math.PI / 3 - Math.PI / 2; o.beginPath(); o.moveTo(X, Y); o.lineTo(X + Math.cos(b) * R * 1.2, Y + Math.sin(b) * R * 1.2); o.stroke(); }
    o.setLineDash([]);
    o.globalAlpha = 0.6; o.strokeStyle = PAL[20];
    o.beginPath(); o.arc(X, Y, R * 0.35, a - Math.PI / 2, a - Math.PI / 2 + Math.PI / 3); o.stroke();
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'center'; o.fillStyle = PAL[18];
    o.fillText('60°', X + Math.cos(a - Math.PI / 3) * R * 0.5, Y + Math.sin(a - Math.PI / 3) * R * 0.5);
    o.globalAlpha = 0.6;
    o.fillText('ICE CRYSTAL (magnified)  ·  C₆ symmetry', X, Y + R * 1.12 + 18 * scale);
    o.globalAlpha = 0.45;
    o.fillText('≈ 2 mm across · grew at about −15 °C', X, Y + R * 1.12 + 34 * scale);
  },
  hud() { return [`${this.flakes.length} flakes · 3 depth layers`]; }
};
