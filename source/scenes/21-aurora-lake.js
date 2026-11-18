// Nature — the northern lights over a mountain lake. Curtains of light ripple along the magnetic field,
// mirrored in still water, with pines along the shore and a dipole-field diagram of the Earth.
const SCENE = {
  focus: [0.6, 0.3],
  glow: 0.2,
  ambient: false,
  anchors: [[0.24, 0.08], [0.46, 0.05], [0.22, 0.9], [0.62, 0.95], [0.42, 0.95], [0.22, 0.8]],
  title: 'AURORA BOREALIS · GEOMAGNETIC',
  sub: 'oxygen 557.7 nm · nitrogen 427.8 nm',
  eqs: [
    { e: 'F = q (v × B)', n: 'Lorentz force — electrons spiral down the field lines' },
    { e: 'r_L = m v⊥ / (|q| B)', n: 'gyroradius of a charged particle' },
    { e: 'λ = 557.7 nm', n: 'atomic oxygen — the green auroral line' },
    { e: 'B(r) ∝ 1 / r³', n: 'strength of a dipole field' },
    { e: 'E = h c / λ ≈ 2.22 eV', n: 'energy of one green auroral photon' },
    { e: 'r = L cos² λ_m', n: 'dipole field line, L-shell parameter' }
  ],
  init() {
    this.horizon = H * 0.66;
    this.stars = [];
    for (let i = 0; i < 280; i++) this.stars.push([Math.random(), Math.random() * 0.62, rand(0.08, 0.5), rand(0, TAU), rand(0.8, 1.7)]);
    const c = document.createElement('canvas'); c.width = 1; c.height = 256;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 256, 0, 0);
    const [r0, g0, b0] = RGB[23];
    gr.addColorStop(0, `rgba(${r0},${g0},${b0},0)`); gr.addColorStop(0.04, `rgba(${r0},${g0},${b0},1)`);
    gr.addColorStop(0.25, `rgba(${r0},${g0},${b0},0.45)`); gr.addColorStop(1, `rgba(${r0},${g0},${b0},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 1, 256);
    this.ray = c;
    this.pines = [];
    for (let i = 0; i < 70; i++) this.pines.push({ x: Math.random(), h: rand(0.03, 0.09), w: rand(0.6, 1) });
    this.pines.sort((a, b) => a.h - b.h);
  },
  update() {},
  curtain(k, x, t) {
    const base = H * (0.22 + k * 0.07) + noise3(x * 0.0018 / scale + k * 3, t * 0.05, k) * H * 0.12 + Math.sin(x * 0.004 / scale + t * 0.2 + k) * H * 0.02;
    const b = Math.max(0, noise3(x * 0.006 / scale, t * 0.12 + k * 5, 2 + k) * 1.6 + 0.35) * (0.6 + 0.4 * Math.sin(x * 0.02 / scale + t * 0.6 + k * 2));
    const h = H * (0.12 + 0.12 * (0.5 + 0.5 * noise3(x * 0.003 / scale, k, t * 0.07)));
    return [base, b, h];
  },
  draw(t, ox, oy) {
    const hz = this.horizon;
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.stars) { ctx.globalAlpha = s[2] * (0.75 + 0.25 * Math.sin(t * 0.4 + s[3])); ctx.fillStyle = PAL[19]; ctx.fillRect(s[0] * W, s[1] * H, s[4] * scale, s[4] * scale); }
    // aurora curtains, drawn as vertical rays of light
    const step = 3 * scale;
    for (let k = 0; k < 3; k++) {
      for (let x = -step; x < W + step; x += step) {
        const [y, b, h] = this.curtain(k, x + ox * 0.3, t);
        if (b < 0.03) continue;
        ctx.globalAlpha = clamp(b * (0.32 - k * 0.07), 0, 0.4);
        ctx.drawImage(this.ray, x, y - h, step * 1.1, h * 1.05);
        // reflection in the lake (dimmer, broken by ripples)
        const ry = hz + (hz - y) * 0.9;
        if (ry < H) {
          ctx.globalAlpha = clamp(b * (0.2 - k * 0.04), 0, 0.24) * (0.6 + 0.4 * Math.sin(ry * 0.08 + t * 1.3 + x * 0.01));
          ctx.save(); ctx.translate(x + Math.sin(t * 0.8 + ry * 0.05) * 2 * scale, ry); ctx.scale(1, -1);
          ctx.drawImage(this.ray, 0, -h * 0.9, step * 1.1, h * 0.9); ctx.restore();
        }
      }
    }
    // mountains behind the lake
    ctx.globalCompositeOperation = 'source-over';
    for (let m = 0; m < 2; m++) {
      ctx.beginPath(); ctx.moveTo(0, hz);
      for (let x = 0; x <= W + 8; x += 8 * scale) {
        let v = 0, a = 1, f = 0.0015 / scale * (1 + m * 0.6);
        for (let o = 0; o < 4; o++) { v += a * Math.abs(noise3(x * f + m * 9, m * 4, o * 3)); a *= 0.5; f *= 2.1; }
        ctx.lineTo(x, hz - v * H * (0.2 - m * 0.07) - H * 0.01);
      }
      ctx.lineTo(W, hz); ctx.closePath();
      ctx.globalAlpha = 1; ctx.fillStyle = DARK(9 - m * 3); ctx.fill();
      ctx.globalAlpha = 0.4 - m * 0.1; ctx.strokeStyle = PAL[17 - m * 3]; ctx.lineWidth = 0.9 * scale; ctx.stroke();
    }
    // lake surface
    ctx.globalAlpha = 0.55; ctx.fillStyle = DARK(3); ctx.fillRect(0, hz, W, H - hz);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 0.7 * scale;
    for (let k = 0; k < 26; k++) {
      const y = hz + Math.pow(k / 26, 1.6) * (H - hz);
      ctx.globalAlpha = 0.05 + 0.08 * k / 26; ctx.strokeStyle = PAL[15];
      ctx.beginPath();
      for (let x = 0; x <= W; x += 12 * scale) { const yy = y + Math.sin(x * 0.01 / scale + t * 0.5 + k) * (0.5 + k * 0.08) * scale; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }
      ctx.stroke();
    }
    // pine trees along the shore and their reflections
    ctx.globalCompositeOperation = 'source-over';
    for (const p of this.pines) {
      const x = p.x * W, h = p.h * H, w = h * 0.32 * p.w;
      for (const dir of [1, -1]) {
        ctx.globalAlpha = dir > 0 ? 1 : 0.5; ctx.fillStyle = DARK(dir > 0 ? 2.5 : 4);
        ctx.beginPath();
        for (let tier = 0; tier < 4; tier++) {
          const y0 = hz - dir * h * tier * 0.24, y1 = hz - dir * h * (tier * 0.24 + 0.42), ww = w * (1 - tier * 0.22);
          ctx.moveTo(x - ww, y0); ctx.lineTo(x, y1); ctx.lineTo(x + ww, y0);
        }
        ctx.fill();
      }
    }
    // shoreline
    ctx.globalAlpha = 0.4; ctx.strokeStyle = PAL[16]; ctx.lineWidth = 0.9 * scale;
    ctx.beginPath(); ctx.moveTo(0, hz); ctx.lineTo(W, hz); ctx.stroke();
  },
  drawOver(t) {
    if (!SETTINGS.math) return;
    const o = octx;
    // Earth's dipole field: field lines r = L cos²λ for several L-shells; auroral oval where they meet the surface
    const cx = W * 0.27, cy = H * 0.24, R = H * 0.05;
    o.lineWidth = 0.8 * scale;
    o.globalAlpha = 0.6; o.strokeStyle = PAL[19];
    o.beginPath(); o.arc(cx, cy, R, 0, TAU); o.stroke();
    for (const L of [1.6, 2.2, 3, 4.2]) {
      for (const side of [1, -1]) {
        o.globalAlpha = 0.28; o.strokeStyle = PAL[16];
        o.beginPath();
        let first = true;
        for (let a = -1.4; a <= 1.4; a += 0.02) {
          const r = L * Math.cos(a) ** 2;
          if (r < 1) { first = true; continue; }
          const x = cx + side * r * Math.cos(a) * R, y = cy - r * Math.sin(a) * R;
          first ? o.moveTo(x, y) : o.lineTo(x, y); first = false;
        }
        o.stroke();
      }
    }
    // a particle spiralling down one field line
    const ph = (t * 0.15) % 1, L = 4.2, a = 1.1 * (1 - ph) + 0.05, r = L * Math.cos(a) ** 2;
    const px = cx + r * Math.cos(a) * R, py = cy - r * Math.sin(a) * R;
    o.globalAlpha = 0.9; o.fillStyle = PAL[23];
    o.beginPath(); o.arc(px + Math.cos(t * 9) * 3 * scale, py + Math.sin(t * 9) * 3 * scale, 2 * scale, 0, TAU); o.fill();
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'left'; o.fillStyle = PAL[17];
    o.globalAlpha = 0.6; o.fillText('DIPOLE FIELD  r = L cos²λ', cx - R * 4.4, cy + R * 4.6);
    o.globalAlpha = 0.45; o.fillText('electrons follow field lines to the poles', cx - R * 4.4, cy + R * 4.6 + 16 * scale);
    // emission-line spectrum strip
    const sx = W * 0.72, sy = H * 0.9, sw = W * 0.22;
    o.globalAlpha = 0.3; o.strokeStyle = PAL[14];
    o.beginPath(); o.moveTo(sx, sy); o.lineTo(sx + sw, sy); o.stroke();
    for (const [nm, h, lbl] of [[427.8, 0.35, 'N₂⁺ 427.8'], [557.7, 1, 'O 557.7'], [630.0, 0.5, 'O 630.0'], [636.4, 0.2, '']]) {
      const x = sx + (nm - 400) / 260 * sw;
      o.globalAlpha = 0.85; o.strokeStyle = PAL[22]; o.lineWidth = 1.6 * scale;
      o.beginPath(); o.moveTo(x, sy); o.lineTo(x, sy - h * H * 0.05); o.stroke();
      if (lbl) { o.globalAlpha = 0.5; o.fillStyle = PAL[16]; o.textAlign = 'center'; o.fillText(lbl, x, sy + 14 * scale); }
    }
    o.textAlign = 'left'; o.globalAlpha = 0.6; o.fillStyle = PAL[17];
    o.fillText('EMISSION LINES (nm)', sx, sy - H * 0.05 - 16 * scale);
  },
  hud() { return ['altitude of green emission ≈ 100–250 km']; }
};
