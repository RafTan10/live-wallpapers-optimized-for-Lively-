// Water — rain falling on a still pond. Each drop sends out rings that spread, weaken and overlap;
// floating leaves bob as the ripples pass. Seen in perspective.
const SCENE = {
  focus: [0.6, 0.55],
  anchors: [[0.28, 0.10], [0.5, 0.06], [0.24, 0.26], [0.62, 0.95], [0.40, 0.95], [0.44, 0.2]],
  title: 'RIPPLES · 2D WAVE EQUATION',
  sub: 'capillary–gravity waves on a pond',
  eqs: [
    { e: '∂²u/∂t² = c² ∇²u', n: 'the wave equation in two dimensions' },
    { e: 'ω² = g k + (σ / ρ) k³', n: 'capillary–gravity dispersion' },
    { e: 'u(r, t) ∝ J₀(k r) cos(ω t)', n: 'circular waves — Bessel functions' },
    { e: 'A ∝ 1 / √r', n: 'ring amplitude falls as energy spreads around the circle' },
    { e: 'λ_min = 2π √(σ / (ρ g)) ≈ 1.7 cm', n: 'slowest possible wave on water' },
    { e: 'u = u₁ + u₂', n: 'superposition — overlapping rings simply add' }
  ],
  init() {
    this.drops = []; this.next = 0; this.count = 0;
    this.rain = [];
    for (let i = 0; i < 160; i++) this.rain.push({ x: Math.random(), y: Math.random(), v: rand(0.9, 1.4), l: rand(10, 24) });
    this.leaves = [];
    for (let i = 0; i < 7; i++) this.leaves.push({ x: rand(0.1, 0.9), y: rand(0.15, 0.9), r: rand(0.014, 0.026), a: rand(0, TAU), w: rand(-0.05, 0.05), vx: rand(-0.004, 0.004) });
    this.reeds = [];
    for (let i = 0; i < 34; i++) { const c = Math.random() < 0.5 ? rand(0.02, 0.16) : rand(0.8, 0.97); this.reeds.push({ x: c + rand(-0.02, 0.02), h: rand(0.03, 0.09), ph: rand(0, TAU) }); }
  },
  pondToScreen(x, y, ox, oy) {
    const top = H * 0.38, bot = H * 1.02;
    const p = 0.35 + 0.65 * y;                                 // perspective: nearer = larger
    const sy = top + (bot - top) * (y * y * 0.35 + y * 0.65);
    return [W * 0.5 + (x - 0.5) * W * 1.3 * p + ox * p, sy + oy * p, p];
  },
  update(dt) {
    this.next -= dt;
    while (this.next <= 0) {
      this.drops.push({ x: Math.random(), y: Math.pow(Math.random(), 0.8), age: 0, A: rand(0.5, 1) });
      this.next += rand(0.08, 0.55) / SETTINGS.rain; this.count++;
    }
    for (const d of this.drops) d.age += dt;
    this.drops = this.drops.filter(d => d.age < 5);
    for (const r of this.rain) { r.y += r.v * dt; r.x += r.v * dt * 0.08; if (r.y > 1) { r.y = 0; r.x = Math.random(); } }
    for (const l of this.leaves) { l.a += l.w * dt; l.x += l.vx * dt; if (l.x < 0.05 || l.x > 0.95) l.vx *= -1; }
  },
  draw(t, ox, oy) {
    ctx.globalCompositeOperation = 'lighter';
    // far shore line and reeds
    const shore = H * 0.38;
    ctx.globalAlpha = 0.35; ctx.strokeStyle = PAL[15]; ctx.lineWidth = 0.9 * scale;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8 * scale) { const y = shore - 6 * scale - noise3(x * 0.004, 1, 2) * 26 * scale; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    // tree line silhouettes behind the shore
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 5 * scale) { const y = shore - 30 * scale - Math.abs(noise3(x * 0.012, 4, 1)) * 90 * scale - noise3(x * 0.003, 2, 2) * 40 * scale; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    for (const r of this.reeds) {
      const x = r.x * W, y0 = shore + 2 * scale, sway = Math.sin(t * 0.7 + r.ph) * 4 * scale;
      ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + sway * 0.5, y0 - r.h * H * 0.5, x + sway, y0 - r.h * H * 0.6); ctx.stroke();
    }
    // reference grid on the water (fades with distance)
    ctx.lineWidth = 0.6 * scale; ctx.strokeStyle = PAL[13];
    for (let k = 0; k <= 10; k++) {
      ctx.globalAlpha = 0.06;
      let a = this.pondToScreen(k / 10, 0, ox, oy), b = this.pondToScreen(k / 10, 1, ox, oy);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      a = this.pondToScreen(0, k / 10, ox, oy); b = this.pondToScreen(1, k / 10, ox, oy);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    // ripple rings: 3 crests per drop, speed c, amplitude ∝ 1/√r
    for (const d of this.drops) {
      const c0 = this.pondToScreen(d.x, d.y, ox, oy);
      for (let k = 0; k < 3; k++) {
        const r = d.age * 0.045 - k * 0.012;
        if (r <= 0.001) continue;
        const amp = d.A / Math.sqrt(1 + r * 60) * Math.exp(-d.age * 0.5) * (1 - k * 0.3);
        const rx = r * W * 1.3 * c0[2], ry = rx * (0.18 + 0.3 * d.y);
        ctx.globalAlpha = clamp(amp * 1.4, 0, 0.85); ctx.strokeStyle = PAL[Math.round(15 + 8 * amp)];
        ctx.lineWidth = (0.6 + 1.2 * amp * c0[2]) * scale;
        ctx.beginPath(); ctx.ellipse(c0[0], c0[1], rx, ry, 0, 0, TAU); ctx.stroke();
      }
      if (d.age < 0.35) {
        ctx.globalAlpha = 0.8 * (1 - d.age / 0.35); ctx.fillStyle = PAL[23];
        for (let k = 0; k < 5; k++) {
          const a = k / 5 * Math.PI + Math.PI, h = d.age * 60 * scale * c0[2];
          ctx.fillRect(c0[0] + Math.cos(a) * h * 0.6, c0[1] + Math.sin(a) * h * 0.5 - h * 0.3, 1.5 * scale, 1.5 * scale);
        }
      }
    }
    // floating leaves bob with the local wave height
    for (const l of this.leaves) {
      let u = 0;
      for (const d of this.drops) {
        const r = Math.hypot(l.x - d.x, (l.y - d.y) * 0.8), front = d.age * 0.045;
        if (Math.abs(r - front) < 0.02) u += Math.cos((r - front) / 0.02 * Math.PI) * d.A * 0.5;
      }
      const c0 = this.pondToScreen(l.x, l.y, ox, oy), rx = l.r * W * c0[2], ry = rx * (0.25 + 0.3 * l.y);
      ctx.globalAlpha = 0.55; ctx.strokeStyle = PAL[18]; ctx.lineWidth = 1 * scale;
      ctx.beginPath(); ctx.ellipse(c0[0], c0[1] - u * 6 * scale, rx, ry, 0, l.a + 0.12, l.a + TAU - 0.12); ctx.lineTo(c0[0], c0[1] - u * 6 * scale); ctx.closePath(); ctx.stroke();
      ctx.globalAlpha = 0.25;
      for (let v = 0; v < 5; v++) { const a = l.a + 0.6 + v * 1.1; ctx.beginPath(); ctx.moveTo(c0[0], c0[1] - u * 6 * scale); ctx.lineTo(c0[0] + Math.cos(a) * rx * 0.8, c0[1] - u * 6 * scale + Math.sin(a) * ry * 0.8); ctx.stroke(); }
    }
    // falling rain
    ctx.strokeStyle = PAL[17]; ctx.lineWidth = 0.8 * scale;
    ctx.globalAlpha = 0.33;
    ctx.beginPath();
    for (const r of this.rain) {
      const x = r.x * W, y = r.y * H, l = r.l * scale;
      ctx.moveTo(x, y); ctx.lineTo(x - l * 0.08, y - l);
    }
    ctx.stroke();
  },
  drawOver() {
    if (!SETTINGS.math) return;
    const o = octx;
    // amplitude-vs-radius plot for a single ring
    const x0 = W * 0.76, y0 = H * 0.2, w = W * 0.18, h = H * 0.09;
    o.globalAlpha = 0.3; o.strokeStyle = PAL[14]; o.lineWidth = 0.8 * scale;
    o.beginPath(); o.moveTo(x0, y0); o.lineTo(x0, y0 + h); o.lineTo(x0 + w, y0 + h); o.stroke();
    o.beginPath();
    for (let i = 0; i <= 120; i++) { const r = i / 120, A = 1 / Math.sqrt(1 + r * 60); const x = x0 + r * w, y = y0 + h - A * h; i ? o.lineTo(x, y) : o.moveTo(x, y); }
    o.globalAlpha = 0.7; o.strokeStyle = PAL[19]; o.stroke();
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'left'; o.fillStyle = PAL[17];
    o.globalAlpha = 0.6; o.fillText('ring amplitude  A(r) ∝ 1/√r', x0, y0 - 14 * scale);
    o.globalAlpha = 0.45; o.fillText(`${this.drops.length} rings on the water · ${this.count} drops so far`, x0, y0 + h + 16 * scale);
  },
  hud() { return [`rain rate × ${SETTINGS.rain}`]; }
};
