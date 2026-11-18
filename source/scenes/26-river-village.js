// Village — a riverside village in the Bengal delta at sunrise. Thatched do-chala huts and palms line the far bank,
// country boats drift on the river, egrets cross the sky and rice fields run toward the vanishing point.
const SCENE = {
  focus: [0.72, 0.36],
  glow: 0.3,
  ambient: false,
  anchors: [[0.24, 0.08], [0.46, 0.05], [0.22, 0.2], [0.42, 0.16], [0.62, 0.08], [0.24, 0.3]],
  title: 'RIVER VILLAGE · DELTA AT DAWN',
  sub: 'one-point perspective · floating boats',
  eqs: [
    { e: 'F_b = ρ g V_displaced', n: "Archimedes — a boat floats on the water it pushes aside" },
    { e: 'Q = A v', n: 'river discharge: cross-section × speed' },
    { e: "v = (1/n) R^(2/3) S^(1/2)", n: "Manning's equation for open channels" },
    { e: "x' = f · x / z", n: 'perspective — rows of rice meet at one point' },
    { e: 'T = 2π √(m / (ρ g A_w))', n: 'heave period of a bobbing boat' },
    { e: 'Δt_sunrise ≈ 2 min per 0.5° of horizon', n: 'the sun rises its own width in about two minutes' }
  ],
  init() {
    this.bank = H * 0.5; this.shore = H * 0.72;
    this.huts = [0.32, 0.4, 0.47, 0.58, 0.66, 0.86].map((x, i) => ({ x, w: rand(0.035, 0.05), h: rand(0.035, 0.05), smoke: i === 2 || i === 4 }));
    this.palms = [0.27, 0.36, 0.44, 0.52, 0.55, 0.62, 0.7, 0.79, 0.83, 0.92, 0.97].map(x => ({ x, h: rand(0.14, 0.24), lean: rand(-0.2, 0.2), ph: rand(0, TAU) }));
    this.boats = [
      { x: 0.1, y: 0.58, s: 0.8, v: 0.006, canopy: true, man: false },
      { x: 0.5, y: 0.64, s: 1.2, v: 0.004, canopy: false, man: true },
      { x: 0.8, y: 0.55, s: 0.55, v: 0.008, canopy: true, man: true }
    ];
    this.birds = [];
    for (let i = 0; i < 7; i++) this.birds.push({ dx: i * 30 - rand(0, 20), dy: Math.abs(i - 3) * 14 + rand(-4, 4), ph: rand(0, TAU) });
    this.flock = -0.1;
    this.tufts = [];
    for (let i = 0; i < 520; i++) this.tufts.push({ u: Math.random() * 2 - 1, v: Math.random(), ph: rand(0, TAU) });
  },
  update(dt) {
    for (const b of this.boats) { b.x += b.v * dt; if (b.x > 1.15) b.x = -0.15; }
    this.flock += dt * 0.015; if (this.flock > 1.2) this.flock = -0.2;
  },
  hut(x, y, w, h) {
    ctx.beginPath();
    ctx.rect(x - w / 2, y - h, w, h);
    ctx.moveTo(x - w * 0.66, y - h + 2 * scale);
    ctx.quadraticCurveTo(x, y - h - h * 0.22, x + w * 0.66, y - h + 2 * scale);
    ctx.lineTo(x + w * 0.42, y - h * 1.9);
    ctx.quadraticCurveTo(x, y - h * 2.12, x - w * 0.42, y - h * 1.9);
    ctx.closePath();
  },
  palm(x, y, h, lean, t, ph) {
    const tx = x + lean * h, ty = y - h, sw = Math.sin(t * 0.6 + ph) * 3 * scale;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * h * 0.2, y - h * 0.6, tx + sw * 0.5, ty);
    for (let k = 0; k < 8; k++) {
      const a = -Math.PI / 2 + (k - 3.5) * 0.42, L = h * 0.32;
      ctx.moveTo(tx + sw * 0.5, ty);
      ctx.quadraticCurveTo(tx + Math.cos(a) * L * 0.6 + sw, ty + Math.sin(a) * L * 0.6 - L * 0.15, tx + Math.cos(a) * L + sw, ty + Math.sin(a) * L * 0.4 + L * 0.35);
    }
  },
  boat(b, t, ox) {
    const x = b.x * W + ox * b.s, y = b.y * H + Math.sin(t * 1.4 + b.x * 20) * 1.5 * scale, L = W * 0.05 * b.s, d = L * 0.18;
    const tilt = Math.sin(t * 1.1 + b.x * 9) * 0.03;
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
    ctx.beginPath();
    ctx.moveTo(-L, -d * 1.4); ctx.quadraticCurveTo(-L * 0.4, d * 1.2, 0, d); ctx.quadraticCurveTo(L * 0.4, d * 1.2, L, -d * 1.4);
    ctx.quadraticCurveTo(0, -d * 0.1, -L, -d * 1.4); ctx.closePath();
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = DARK(3); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6; ctx.strokeStyle = PAL[18]; ctx.lineWidth = 1 * scale; ctx.stroke();
    if (b.canopy) { ctx.beginPath(); ctx.moveTo(-L * 0.35, -d * 0.5); ctx.quadraticCurveTo(0, -d * 3.6, L * 0.35, -d * 0.5); ctx.globalAlpha = 0.5; ctx.stroke(); }
    if (b.man) {
      ctx.globalAlpha = 0.6; ctx.beginPath();
      const mx = L * 0.6; ctx.moveTo(mx, -d); ctx.lineTo(mx, -d * 4); ctx.arc(mx, -d * 4.5, d * 0.5, 0, TAU);
      const pa = -1.2 + Math.sin(t * 0.8 + b.x * 5) * 0.15; ctx.moveTo(mx - Math.cos(pa) * d * 6, -d * 3 - Math.sin(pa) * d * 6); ctx.lineTo(mx + Math.cos(pa) * d * 3, -d * 3 + Math.sin(pa) * d * 3.5);
      ctx.stroke();
    }
    ctx.restore();
    // reflection
    ctx.globalAlpha = 0.18; ctx.strokeStyle = PAL[16]; ctx.lineWidth = 0.8 * scale;
    ctx.beginPath(); for (let k = -3; k <= 3; k++) { const yy = y + d * 1.8 + Math.abs(k) * 2 * scale; ctx.moveTo(x - L * 0.8 + Math.sin(t + k) * 3 * scale, yy + k * 3 * scale); ctx.lineTo(x + L * 0.8 + Math.sin(t + k) * 3 * scale, yy + k * 3 * scale); } ctx.stroke();
  },
  draw(t, ox, oy) {
    const sx = this.focus[0] * W + ox * 0.15, sy = this.focus[1] * H + oy * 0.15, sr = H * 0.05;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.85; ctx.fillStyle = shade(0.8, 0.35); ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[21]; ctx.lineWidth = 1 * scale; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.stroke();
    // mist bands across the sky
    for (let k = 0; k < 7; k++) {
      const y = H * (0.3 + k * 0.03), off = Math.sin(t * 0.03 + k) * W * 0.05;
      ctx.globalAlpha = 0.07; ctx.strokeStyle = PAL[18]; ctx.lineWidth = (2 + k) * scale;
      ctx.beginPath(); ctx.moveTo(W * (0.15 + 0.05 * k) + off, y); ctx.lineTo(W * (0.75 + 0.04 * k) + off, y); ctx.stroke();
    }
    // egrets
    ctx.strokeStyle = PAL[20]; ctx.lineWidth = 1.1 * scale;
    for (const b of this.birds) {
      const x = this.flock * W + b.dx * scale * 2, y = H * 0.2 + b.dy * scale * 1.5, f = Math.sin(t * 2.4 + b.ph) * 4 * scale, w = 9 * scale;
      ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(x - w, y - f); ctx.quadraticCurveTo(x - w * 0.4, y - 3 * scale, x, y); ctx.quadraticCurveTo(x + w * 0.4, y - 3 * scale, x + w, y - f); ctx.stroke();
    }
    // far bank: tree clumps, palms and huts (silhouettes with edge light)
    const bank = this.bank + oy * 0.3;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = DARK(5);
    ctx.beginPath(); ctx.moveTo(0, bank);
    for (let x = 0; x <= W; x += 6 * scale) ctx.lineTo(x, bank - H * 0.035 - Math.abs(noise3(x * 0.006, 1, 3)) * H * 0.05);
    ctx.lineTo(W, bank); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25; ctx.strokeStyle = PAL[15]; ctx.lineWidth = 0.8 * scale; ctx.stroke();
    for (const p of this.palms) {
      this.palm(p.x * W + ox * 0.3, bank - H * 0.02, p.h * H, p.lean, t, p.ph);
      ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[17]; ctx.lineWidth = 1.2 * scale; ctx.stroke();
    }
    for (const hu of this.huts) {
      const x = hu.x * W + ox * 0.3, y = bank, w = hu.w * W, h = hu.h * H;
      this.hut(x, y, w, h);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = DARK(4); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55; ctx.strokeStyle = PAL[18]; ctx.lineWidth = 1 * scale; ctx.stroke();
      // thatch lines
      ctx.globalAlpha = 0.2; ctx.beginPath();
      for (let k = 1; k < 7; k++) { const u = k / 7 - 0.5; ctx.moveTo(x + u * w * 1.25, y - h + 1); ctx.lineTo(x + u * w * 0.82, y - h * 1.92); }
      ctx.stroke();
      ctx.globalAlpha = 0.5; ctx.strokeRect(x - w * 0.1, y - h * 0.62, w * 0.2, h * 0.62);
      if (hu.smoke) for (let k = 0; k < 5; k++) { const ph = (t * 0.12 + k / 5) % 1; ctx.globalAlpha = 0.2 * (1 - ph); ctx.beginPath(); ctx.arc(x + w * 0.2 + ph * 40 * scale, y - h * 2 - ph * 110 * scale, (3 + ph * 16) * scale, 0, TAU); ctx.stroke(); }
    }
    // river: ripples, reflections of the bank, the sun's glitter path
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[16]; ctx.beginPath(); ctx.moveTo(0, bank); ctx.lineTo(W, bank); ctx.stroke();
    for (let k = 0; k < 30; k++) {
      const y = bank + Math.pow(k / 30, 1.4) * (this.shore - bank);
      ctx.globalAlpha = 0.05 + 0.08 * k / 30; ctx.strokeStyle = PAL[15]; ctx.lineWidth = 0.7 * scale;
      ctx.beginPath(); for (let x = 0; x <= W; x += 14 * scale) { const yy = y + Math.sin(x * 0.012 / scale + t * 0.6 + k * 0.7) * (0.6 + k * 0.05) * scale; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke();
      const gw = W * (0.01 + 0.05 * k / 30);
      for (let g = 0; g < 3; g++) {
        const gx = sx + (hash(k * 7 + g + Math.floor(t * 1.5)) - 0.5) * gw * 2;
        ctx.globalAlpha = 0.35 * (0.5 + 0.5 * Math.sin(t * 2 + k + g)); ctx.strokeStyle = PAL[22]; ctx.lineWidth = 1.2 * scale;
        ctx.beginPath(); ctx.moveTo(gx - 6 * scale, y); ctx.lineTo(gx + 6 * scale, y); ctx.stroke();
      }
    }
    for (const p of this.palms) {
      const x = p.x * W + ox * 0.3;
      ctx.save(); ctx.translate(0, 2 * (bank + 2 * scale)); ctx.scale(1, -1);
      this.palm(x, bank - H * 0.02, p.h * H * 0.8, p.lean, t, p.ph);
      ctx.restore();
      ctx.globalAlpha = 0.1; ctx.strokeStyle = PAL[16]; ctx.lineWidth = 1 * scale; ctx.stroke();
    }
    for (const b of this.boats) this.boat(b, t, ox);
    // near bank and rice fields in one-point perspective
    const shore = this.shore + oy * 0.6, vx = W * 0.6, vy = this.bank;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = DARK(7);
    ctx.beginPath(); ctx.moveTo(0, shore); for (let x = 0; x <= W; x += 10 * scale) ctx.lineTo(x, shore + noise3(x * 0.005, 9, 1) * 6 * scale); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.45; ctx.strokeStyle = PAL[17]; ctx.lineWidth = 1 * scale; ctx.stroke();
    ctx.lineWidth = 0.7 * scale; ctx.strokeStyle = PAL[14];
    for (let k = -14; k <= 14; k++) {
      const xb = vx + k * W * 0.09, f = (shore - vy) / (H - vy);
      ctx.globalAlpha = 0.14; ctx.beginPath(); ctx.moveTo(vx + (xb - vx) * f, shore); ctx.lineTo(xb, H); ctx.stroke();
    }
    for (let k = 1; k <= 8; k++) { const y = shore + (H - shore) * Math.pow(k / 8, 1.6); ctx.globalAlpha = 0.1; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = PAL[17]; ctx.lineWidth = 0.8 * scale; ctx.beginPath();
    for (const tf of this.tufts) {
      const y = shore + (H - shore) * Math.pow(tf.v, 1.5), f = (y - vy) / (H - vy);
      const x = vx + tf.u * W * 1.4 * f, h = (4 + 14 * f) * scale, sw = Math.sin(t * 1.1 + tf.ph + x * 0.004) * 2.5 * scale * f;
      if (x < -20 || x > W + 20) continue;
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sw * 0.3, y - h * 0.6, x + sw, y - h);
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x - h * 0.2, y - h * 0.5, x - h * 0.35 + sw, y - h * 0.8);
    }
    ctx.globalAlpha = 0.3; ctx.stroke();
    this.vp = [vx, vy];
  },
  drawOver(t) {
    if (!SETTINGS.math || !this.vp) return;
    const o = octx, [vx, vy] = this.vp;
    o.lineWidth = 0.8 * scale; o.setLineDash([2 * scale, 6 * scale]);
    o.globalAlpha = 0.3; o.strokeStyle = PAL[18];
    for (const k of [-5, -2, 2, 5]) { o.beginPath(); o.moveTo(vx, vy); o.lineTo(vx + k * W * 0.09, H); o.stroke(); }
    o.setLineDash([]);
    o.globalAlpha = 0.7; o.beginPath(); o.arc(vx, vy, 4 * scale, 0, TAU); o.stroke();
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'left'; o.fillStyle = PAL[18];
    o.fillText('vanishing point', vx + 10 * scale, vy - 10 * scale);
    const b = this.boats[1], x = b.x * W, y = b.y * H;
    if (x > W * 0.2 && x < W * 0.85) {
      o.globalAlpha = 0.45; o.beginPath(); o.moveTo(x, y + 10 * scale); o.lineTo(x + 40 * scale, y + 46 * scale); o.lineTo(x + 56 * scale, y + 46 * scale); o.stroke();
      o.globalAlpha = 0.65; o.fillText('displaced water ≈ boat + load ≈ 0.6 t', x + 62 * scale, y + 46 * scale);
    }
    o.globalAlpha = 0.5;
    o.fillText('river flow  →  v ≈ 0.8 m/s', W * 0.24, H * 0.62);
  },
  hud() { return ['6 huts · 3 country boats · 1 flock of egrets']; }
};
