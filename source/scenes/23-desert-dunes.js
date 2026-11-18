// Nature — desert dunes under a low sun. Wind ripples cover the slopes, sand streams off the crests,
// and a camel caravan crosses a ridge. Dunes have a gentle windward side and a steep slip face.
const SCENE = {
  focus: [0.74, 0.3],
  glow: 0.3,
  anchors: [[0.46, 0.05], [0.44, 0.16], [0.44, 0.26], [0.24, 0.4], [0.56, 0.34], [0.62, 0.1]],
  title: 'AEOLIAN DUNES · SAND TRANSPORT',
  sub: 'barchan profile · slip face at angle of repose',
  eqs: [
    { e: 'q ∝ (ρ / g) u*³', n: "Bagnold's sand-flux law" },
    { e: 'u(z) = (u* / κ) ln(z / z₀)', n: 'logarithmic wind profile, κ ≈ 0.41' },
    { e: 'θ_r ≈ 34°', n: 'angle of repose of dry sand — the slip face' },
    { e: 'c = q / (ρ_s H)', n: 'dune speed — small dunes migrate faster' },
    { e: 'tan θ_r = μ_s', n: 'repose angle from static friction' },
    { e: 'λ_ripple ≈ 5–15 cm', n: 'wind ripples on the dune surface' }
  ],
  init() {
    this.L = 5;
    this.grains = [];
    for (let i = 0; i < 260; i++) this.grains.push({ x: Math.random(), y: 0, age: Math.random() * 3, layer: 2 + (Math.random() * 3 | 0), v: rand(0.6, 1.2) });
    this.camels = [0, 1, 2, 3].map(i => ({ off: i * 0.022, ph: i * 1.3 }));
  },
  dune(i, x, t) {
    const z = 1 + i * 0.6, sp = 0.004 / z;
    const per = W * (0.5 - i * 0.05), u = (x / per + t * sp * 3 + i * 0.37 + 0.35 * noise3(x * 0.0012 / scale + i * 5, i, 4));
    const f = u - Math.floor(u);
    // asymmetric profile: long windward rise, short steep lee (slip) face
    const prof = f < 0.78 ? Math.sin((f / 0.78) * Math.PI / 2) : Math.cos(((f - 0.78) / 0.22) * Math.PI / 2);
    const amp = H * (0.07 + i * 0.03) * (0.8 + 0.4 * noise3(Math.floor(u) * 0.7, i, 1));
    const base = H * (0.5 + i * 0.1);
    return [base - prof * amp, f];
  },
  update(dt) {
    for (const g of this.grains) { g.age += dt; if (g.age > 3) { g.age = 0; g.x = Math.random(); } }
  },
  draw(t, ox, oy) {
    const sx = this.focus[0] * W + ox * 0.2, sy = this.focus[1] * H + oy * 0.2, sr = H * 0.065;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.8; ctx.fillStyle = shade(0.8, 0.35); ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[21]; ctx.lineWidth = 1 * scale; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.stroke();
    // heat shimmer bands near the horizon
    ctx.lineWidth = 0.8 * scale;
    for (let k = 0; k < 10; k++) {
      const y = H * 0.44 + k * 5 * scale;
      ctx.globalAlpha = 0.05; ctx.strokeStyle = PAL[18];
      ctx.beginPath(); for (let x = 0; x <= W; x += 14 * scale) { const yy = y + Math.sin(x * 0.02 / scale + t * 2 + k) * 1.5 * scale; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke();
    }
    const step = 5 * scale;
    for (let i = 0; i < this.L; i++) {
      const pts = [];
      for (let x = -step; x <= W + step; x += step) { const [y, f] = this.dune(i, x, t); pts.push([x, y + oy * (0.2 + i * 0.15), f]); }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1; ctx.fillStyle = DARK(14 - i * 2.4);
      ctx.beginPath(); ctx.moveTo(pts[0][0], H); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.lineTo(W + step, H); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      // crest line, brighter on the sunlit windward side
      ctx.lineWidth = (0.8 + i * 0.15) * scale;
      for (let k = 1; k < pts.length; k++) {
        const lee = pts[k][2] > 0.78;
        ctx.globalAlpha = lee ? 0.18 : 0.35 + i * 0.08; ctx.strokeStyle = PAL[lee ? 13 : 18 + i];
        ctx.beginPath(); ctx.moveTo(pts[k - 1][0], pts[k - 1][1]); ctx.lineTo(pts[k][0], pts[k][1]); ctx.stroke();
      }
      // wind ripples on the windward slopes of the nearer dunes
      if (i >= 2) {
        ctx.lineWidth = 0.6 * scale; ctx.strokeStyle = PAL[15];
        for (let r = 1; r <= 7 + i * 2; r++) {
          const d = r * (7 + i * 3) * scale;
          ctx.globalAlpha = 0.14;
          ctx.beginPath();
          let pen = false;
          for (let k = 0; k < pts.length; k++) {
            const [x, y, f] = pts[k];
            if (f > 0.76 || f < 0.05) { pen = false; continue; }
            const yy = y + d + Math.sin(x * 0.03 / scale + r) * 2 * scale;
            pen ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); pen = true;
          }
          ctx.stroke();
        }
      }
      if (i === 2) this.ridge = pts;
      if (i === this.L - 1) this.near = pts;
    }
    // sand blowing off the crests (saltation streamers)
    ctx.fillStyle = PAL[19];
    for (const g of this.grains) {
      const x0 = g.x * W, [y0, f] = this.dune(g.layer, x0, t);
      if (f < 0.6 || f > 0.8) continue;
      const x = x0 + g.age * 40 * g.v * scale, y = y0 + oy * (0.2 + g.layer * 0.15) - Math.sin(Math.min(1, g.age) * Math.PI) * 10 * scale + g.age * g.age * 6 * scale;
      ctx.globalAlpha = 0.5 * (1 - g.age / 3); ctx.fillRect(x, y, 1.3 * scale, 1.3 * scale);
    }
    // camel caravan walking along the third ridge
    if (this.ridge) {
      ctx.globalCompositeOperation = 'source-over';
      const base = ((t * 0.006 + 0.45) % 1.3) - 0.15;
      for (const c of this.camels) {
        const u = base + c.off, x = u * W;
        if (x < -40 || x > W + 40) continue;
        const k = clamp(Math.round((x + step) / step), 0, this.ridge.length - 1), y = this.ridge[k][1];
        const s = 1.2 * scale, bob = Math.sin(t * 3 + c.ph) * 1 * scale;
        ctx.globalAlpha = 0.95; ctx.fillStyle = DARK(2);
        ctx.beginPath();
        ctx.ellipse(x, y - 13 * s + bob, 9 * s, 4.5 * s, 0, 0, TAU);                 // body
        ctx.ellipse(x - 1 * s, y - 17 * s + bob, 4 * s, 3.5 * s, 0, Math.PI, TAU);  // hump
        ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 7 * s, y - 14 * s + bob); ctx.quadraticCurveTo(x + 12 * s, y - 16 * s, x + 12 * s, y - 22 * s + bob); ctx.lineTo(x + 15 * s, y - 22 * s + bob);
        ctx.lineWidth = 2.2 * s; ctx.strokeStyle = DARK(2); ctx.stroke();
        ctx.lineWidth = 1.3 * s;
        for (const lx of [-6, -3, 4, 7]) { const sw = Math.sin(t * 3 + c.ph + lx) * 2 * s; ctx.beginPath(); ctx.moveTo(x + lx * s, y - 10 * s + bob); ctx.lineTo(x + lx * s + sw, y); ctx.stroke(); }
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35; ctx.strokeStyle = PAL[17]; ctx.lineWidth = 0.7 * scale;
        ctx.beginPath(); ctx.ellipse(x, y - 13 * s + bob, 9 * s, 4.5 * s, 0, Math.PI, TAU); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  },
  drawOver(t) {
    if (!SETTINGS.math) return;
    const o = octx;
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'left'; o.lineWidth = 0.8 * scale;
    // angle-of-repose marker on a near slip face
    if (this.near) {
      const p = this.near;
      for (let k = 2; k < p.length - 2; k++) {
        if (p[k][2] > 0.8 && p[k - 1][2] <= 0.8 && p[k][0] > W * 0.3 && p[k][0] < W * 0.85) {
          const x = p[k][0], y = p[k][1], L = 70 * scale, a = 34 * Math.PI / 180;
          o.globalAlpha = 0.6; o.strokeStyle = PAL[19];
          o.beginPath(); o.moveTo(x, y); o.lineTo(x + L, y); o.moveTo(x, y); o.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); o.stroke();
          o.beginPath(); o.arc(x, y, 30 * scale, 0, a); o.stroke();
          o.fillStyle = PAL[19]; o.fillText('θ_r ≈ 34°  slip face', x + L + 8 * scale, y + 10 * scale);
          break;
        }
      }
    }
    // wind profile inset u(z) = (u*/κ) ln(z/z0)
    const bx = W * 0.27, by = H * 0.17, bw = W * 0.12, bh = H * 0.14;
    o.globalAlpha = 0.3; o.strokeStyle = PAL[14];
    o.beginPath(); o.moveTo(bx, by); o.lineTo(bx, by + bh); o.lineTo(bx + bw, by + bh); o.stroke();
    o.beginPath();
    for (let i = 1; i <= 60; i++) { const z = i / 60, u = Math.log(z / 0.002) / Math.log(1 / 0.002); const x = bx + u * bw, y = by + bh - z * bh; i > 1 ? o.lineTo(x, y) : o.moveTo(x, y); }
    o.globalAlpha = 0.75; o.strokeStyle = PAL[20]; o.stroke();
    for (let i = 1; i <= 5; i++) { const z = i / 5.5, u = Math.log(z / 0.002) / Math.log(1 / 0.002); const y = by + bh - z * bh, x = bx + u * bw; o.globalAlpha = 0.4; o.beginPath(); o.moveTo(bx, y); o.lineTo(x, y); o.lineTo(x - 4 * scale, y - 3 * scale); o.moveTo(x, y); o.lineTo(x - 4 * scale, y + 3 * scale); o.stroke(); }
    o.globalAlpha = 0.6; o.fillStyle = PAL[17];
    o.fillText('WIND PROFILE  u(z)', bx, by - 14 * scale);
    o.globalAlpha = 0.4; o.fillText('z', bx - 10 * scale, by); o.fillText('u', bx + bw + 6 * scale, by + bh);
  },
  hud() { return ['wind → east · caravan of 4']; }
};
