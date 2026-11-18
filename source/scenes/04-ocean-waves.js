// Ocean — a moonlit sea built from a sum of deep-water waves (ω² = g k), seen in perspective,
// under a starry sky with the Milky Way. Starlight twinkles on the wave crests.
const SCENE = {
  ambient: false,
  dust: false,
  focus: [0.72, 0.3],
  glow: 0.22,
  anchors: [[0.30, 0.10], [0.50, 0.20], [0.26, 0.36], [0.40, 0.08], [0.30, 0.25], [0.52, 0.34]],
  title: 'DEEP-WATER WAVES · LINEAR THEORY',
  sub: 'g = 9.81 m/s² · 5 superposed components',
  eqs: [
    { e: 'ω² = g k', n: 'deep-water dispersion relation' },
    { e: 'η(x, t) = Σ Aₙ cos(kₙ · x − ωₙ t + φₙ)', n: 'sea surface as a sum of waves' },
    { e: 'c = ω / k = √(g / k)', n: 'phase speed — long waves travel faster' },
    { e: 'c_g = c / 2', n: 'group velocity in deep water' },
    { e: 'λ = 2π / k', n: 'wavelength' },
    { e: 'θᵢ = θᵣ', n: 'law of reflection — why the glints line up under the moon' }
  ],
  init() {
    this.horizon = H * 0.52;
    this.rows = Math.round(48 * SETTINGS.density);
    this.waves = [];
    const L = [42, 27, 17, 11, 7];
    for (let i = 0; i < L.length; i++) {
      const k = TAU / L[i], dir = rand(-0.5, 0.5) + Math.PI / 2;
      this.waves.push({ k, w: Math.sqrt(9.81 * k), A: 0.55 * Math.pow(L[i] / 42, 0.8), cx: Math.cos(dir), cz: Math.sin(dir), p: rand(0, TAU), L: L[i] });
    }
    // sky: faint stars, a Milky Way band, and a few bright twinkling stars
    this.stars = [];
    for (let i = 0; i < 300; i++) this.stars.push({ x: Math.random(), y: Math.pow(Math.random(), 1.3) * 0.97, a: rand(0.08, 0.5), s: rand(0.8, 1.8), ph: rand(0, TAU), f: rand(0.2, 0.7) });
    this.milky = [];
    for (let i = 0; i < 700; i++) {
      const u = Math.random(), off = (Math.random() + Math.random() + Math.random() - 1.5) * 0.09;
      const x = u, y = 0.08 + 0.75 * u + off * 1.4;          // diagonal band across the sky
      if (y > 0 && y < 0.98) this.milky.push({ x, y, a: rand(0.1, 0.38) * Math.max(0.15, 1 - Math.abs(off) * 5) });
    }
    this.bright = [];
    for (let i = 0; i < 16; i++) this.bright.push({ x: rand(0.05, 0.98), y: rand(0.05, 0.85), s: rand(3, 7), ph: rand(0, TAU), f: rand(0.25, 0.6) });
    // sparkles that ride the wave crests
    this.sparks = [];
    for (let i = 0; i < 170; i++) this.sparks.push({ row: Math.floor(Math.pow(Math.random(), 0.7) * this.rows), x: Math.random(), ph: rand(0, TAU), f: rand(0.3, 0.9), s: rand(1.5, 4.5) });
    this.riders = [];
    for (let i = 0; i < 46; i++) this.riders.push({ row: Math.floor(rand(0.45, 1) * this.rows), x: Math.random(), g: pick(), a: rand(0.3, 0.8) });
    this.meteor = null; this.nextMeteor = rand(8, 20);
  },
  eta(X, Z, t) {
    let s = 0;
    for (const w of this.waves) s += w.A * Math.cos(w.k * (X * w.cx + Z * w.cz) - w.w * t + w.p);
    return s;
  },
  update(dt, t) {
    for (const r of this.riders) { r.x += dt * 0.006; if (r.x > 1) { r.x = 0; r.g = pick(); } }
    for (const s of this.sparks) { s.x += dt * 0.004; if (s.x > 1) s.x = 0; }
    this.nextMeteor -= dt;
    if (this.nextMeteor <= 0 && !this.meteor) {
      this.meteor = { x: rand(0.1, 0.6), y: rand(0.05, 0.25), vx: rand(0.12, 0.2), vy: rand(0.05, 0.09), age: 0, life: 1.6 };
      this.nextMeteor = rand(18, 35);
    }
    if (this.meteor) { this.meteor.age += dt; if (this.meteor.age > this.meteor.life) this.meteor = null; }
  },
  rowGeom(i) {
    const p = Math.pow((i + 1) / this.rows, 1.9);
    return { p, y0: this.horizon + (H * 1.04 - this.horizon) * p, Z: 30 / p };
  },
  surfY(row, sx, t, oy) {
    const g = this.rowGeom(row), X = (sx - W * 0.5) / (g.p * W) * 110;
    return { y: g.y0 - this.eta(X, g.Z, t) * H * 0.045 * g.p + oy * g.p, e: this.eta(X, g.Z, t), p: g.p };
  },
  sparkle(x, y, s, a, lvl) {
    ctx.globalAlpha = a; ctx.strokeStyle = PAL[lvl]; ctx.fillStyle = PAL[lvl];
    ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke();
    ctx.fillRect(x - 0.8 * scale, y - 0.8 * scale, 1.6 * scale, 1.6 * scale);
  },
  draw(t, ox, oy) {
    const mxp = this.focus[0] * W + ox * 0.5, myp = this.focus[1] * H + oy * 0.5, mr = H * 0.055;
    const hz = this.horizon;
    ctx.globalCompositeOperation = 'lighter';
    // Milky Way
    ctx.fillStyle = PAL[19];
    for (const m of this.milky) { ctx.globalAlpha = m.a; ctx.fillRect(m.x * W, m.y * hz, 1.1 * scale, 1.1 * scale); }
    // stars
    for (const s of this.stars) {
      ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(t * s.f + s.ph));
      ctx.fillStyle = PAL[19];
      ctx.fillRect(s.x * W, s.y * hz, s.s * scale, s.s * scale);
    }
    ctx.lineWidth = 0.9 * scale;
    for (const b of this.bright) {
      const tw = 0.6 + 0.4 * Math.sin(t * b.f + b.ph);
      this.sparkle(b.x * W, b.y * hz, b.s * tw * scale, 0.45 + 0.4 * tw, 22);
    }
    // shooting star
    if (this.meteor) {
      const m = this.meteor, k = m.age / m.life, x = (m.x + m.vx * m.age) * W, y = (m.y + m.vy * m.age) * hz;
      const g = ctx.createLinearGradient(x, y, x - m.vx * W * 0.5, y - m.vy * hz * 0.5);
      g.addColorStop(0, shade(1, 0.6 * Math.sin(Math.PI * k))); g.addColorStop(1, shade(0.6, 0));
      ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.3 * scale;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - m.vx * W * 0.5, y - m.vy * hz * 0.5); ctx.stroke();
    }
    // moon
    const mg = ctx.createRadialGradient(mxp - mr * 0.3, myp - mr * 0.3, 0, mxp, myp, mr);
    mg.addColorStop(0, shade(0.95, 0.55)); mg.addColorStop(1, shade(0.6, 0.18));
    ctx.globalAlpha = 1; ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(mxp, myp, mr, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.7; ctx.strokeStyle = PAL[22]; ctx.lineWidth = 1.2 * scale;
    ctx.beginPath(); ctx.arc(mxp, myp, mr, 0, TAU); ctx.stroke();
    // a few craters
    ctx.globalAlpha = 0.25; ctx.strokeStyle = PAL[14]; ctx.lineWidth = 0.8 * scale;
    for (const [dx, dy, r] of [[-0.3, -0.1, 0.18], [0.25, 0.3, 0.12], [0.1, -0.4, 0.09], [-0.2, 0.42, 0.08]]) {
      ctx.beginPath(); ctx.arc(mxp + dx * mr, myp + dy * mr, r * mr, 0, TAU); ctx.stroke();
    }
    // horizon
    ctx.globalAlpha = 0.35; ctx.strokeStyle = PAL[14]; ctx.lineWidth = 0.8 * scale;
    ctx.beginPath(); ctx.moveTo(0, hz); ctx.lineTo(W, hz); ctx.stroke();
    // soft glow on the water below the moon
    const rg = ctx.createRadialGradient(mxp, hz + H * 0.18, 0, mxp, hz + H * 0.18, H * 0.35);
    rg.addColorStop(0, shade(0.8, 0.07)); rg.addColorStop(1, shade(0.6, 0));
    ctx.globalAlpha = 1; ctx.fillStyle = rg;
    ctx.fillRect(0, hz, W, H - hz);
    // sea surface lines
    const step = 10 * scale;
    for (let i = 0; i < this.rows; i++) {
      const g = this.rowGeom(i), amp = H * 0.045 * g.p;
      const glintW = W * (0.015 + 0.09 * g.p);
      ctx.lineWidth = (0.6 + 0.8 * g.p) * scale;
      ctx.strokeStyle = PAL[Math.round(8 + 10 * g.p)];
      const gw = (1.2 + 1.6 * g.p) * scale;
      ctx.globalAlpha = 0.18 + 0.5 * g.p;
      ctx.beginPath();
      const pts = [];
      for (let sx = -step; sx <= W + step; sx += step) {
        const X = (sx - W * 0.5) / (g.p * W) * 110;
        const y = g.y0 - this.eta(X, g.Z, t) * amp + oy * g.p;
        pts.push(sx, y);
        sx > -step ? ctx.lineTo(sx, y) : ctx.moveTo(sx, y);
      }
      ctx.stroke();
      ctx.strokeStyle = PAL[22];
      for (let k = 2; k < pts.length; k += 2) {
        const sx = pts[k], dxm = Math.abs(sx - mxp);
        if (dxm > glintW) continue;
        const slope = pts[k + 1] - pts[k - 1];
        const gl = Math.pow(clamp(0.5 + slope / (amp * 0.5 + 1), 0, 1), 3) * (1 - dxm / glintW);
        if (gl < 0.05) continue;
        ctx.globalAlpha = gl * (0.5 + 0.5 * g.p); ctx.lineWidth = gw;
        ctx.beginPath(); ctx.moveTo(pts[k - 2], pts[k - 1]); ctx.lineTo(sx, pts[k + 1]); ctx.stroke();
      }
    }
    // reflections of the bright stars: little twinkles straight below each star
    ctx.lineWidth = 0.8 * scale;
    for (const b of this.bright) {
      const sx = b.x * W;
      for (let i = 4; i < this.rows * 0.75; i += 3) {
        const s = this.surfY(i, sx + Math.sin(i * 1.7 + t * 0.4) * 4 * scale, t, oy);
        const tw = 0.5 + 0.5 * Math.sin(t * (b.f + i * 0.03) + b.ph + i);
        if (tw < 0.35) continue;
        this.sparkle(sx, s.y - 1.5 * scale, (1 + 2.2 * s.p) * tw * scale, 0.3 * tw * (0.4 + s.p), 21);
      }
    }
    // starlight sparkles on the crests
    for (const sp of this.sparks) {
      const sx = sp.x * W, s = this.surfY(sp.row, sx, t, oy);
      const crest = clamp((s.e - 0.15) / 0.9, 0, 1);
      if (crest <= 0) continue;
      const tw = 0.5 + 0.5 * Math.sin(t * sp.f + sp.ph);
      this.sparkle(sx, s.y - 2 * scale, sp.s * (0.4 + s.p) * tw * scale, crest * tw * (0.35 + 0.55 * s.p), 22);
    }
    // glyphs riding the swell
    ctx.font = MONO(11); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    for (const r of this.riders) {
      const s = this.surfY(r.row, r.x * W, t, oy);
      ctx.globalAlpha = r.a * s.p * clamp(Math.sin(Math.PI * r.x) * 3, 0, 1);
      ctx.fillStyle = PAL[19];
      ctx.fillText(r.g, r.x * W, s.y - 3 * scale);
    }
  },
  drawOver(t) {
    if (!SETTINGS.math) return;
    const o = octx;
    const x0 = W * 0.76, y0 = H * 0.62;
    o.font = MONO(10); o.textBaseline = 'middle'; o.textAlign = 'left';
    o.strokeStyle = PAL[14]; o.fillStyle = PAL[16]; o.lineWidth = 0.8 * scale;
    o.globalAlpha = 0.6;
    o.fillText('component   λ (m)   c (m/s)', x0, y0);
    this.waves.forEach((w, i) => {
      const y = y0 + (i + 1) * 16 * scale;
      o.globalAlpha = 0.5;
      o.fillText(`  n=${i + 1}       ${String(w.L).padStart(3)}     ${(w.w / w.k).toFixed(2)}`, x0, y);
    });
    const mxp = this.focus[0] * W, myp = this.focus[1] * H, mr = H * 0.055;
    o.globalAlpha = 0.45;
    o.beginPath(); o.moveTo(mxp + mr * 0.8, myp - mr * 0.8); o.lineTo(mxp + mr * 1.8, myp - mr * 1.6); o.lineTo(mxp + mr * 2.3, myp - mr * 1.6); o.stroke();
    o.globalAlpha = 0.65;
    o.fillText('glint where surface slope reflects the moon', mxp + mr * 2.45, myp - mr * 1.6);
  },
  hud() { return [`surface sampled every 10 px · ${this.rows} depth rows`]; }
};
