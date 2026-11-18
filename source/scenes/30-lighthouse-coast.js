// Coast — a lighthouse on a clifftop above a fishing village. Its beam sweeps round slowly over the sea,
// waves break on the rocks below, and the geometry of how far the light can be seen is worked out.
const SCENE = {
  focus: [0.66, 0.3],
  ambient: false,
  anchors: [[0.24, 0.08], [0.44, 0.05], [0.22, 0.22], [0.42, 0.18], [0.22, 0.34], [0.5, 0.3]],
  title: 'LIGHTHOUSE · GEOGRAPHIC RANGE',
  sub: 'beam period 20 s · focal plane ≈ 100 m above sea',
  eqs: [
    { e: 'd ≈ 3.57 √h  km', n: 'distance to the horizon from height h (metres)' },
    { e: 'd = √(2 R h)', n: 'the same, from Earth’s radius R = 6371 km' },
    { e: 'D = 3.57 (√h₁ + √h₂)', n: 'geographic range: light and observer heights' },
    { e: '1/f = 1/u + 1/v', n: 'the lens focuses the lamp into a parallel beam' },
    { e: 'I ∝ 1 / r²', n: 'without a lens, intensity falls with distance squared' },
    { e: 'Fl W 20s', n: 'light characteristic: one white flash every 20 seconds' }
  ],
  init() {
    this.horizon = H * 0.56;
    this.stars = [];
    for (let i = 0; i < 230; i++) this.stars.push([Math.random(), Math.random() * 0.52, rand(0.06, 0.45), rand(0, TAU)]);
    this.cliff = [];
    for (let i = 0; i <= 60; i++) { const u = i / 60; this.cliff.push(u); }
    this.houses = [[0.74, 1], [0.79, 0.8], [0.83, 1.1], [0.88, 0.9], [0.93, 1.05], [0.6, 0.85], [0.56, 0.7]].map(([x, s]) => ({ x, s, lit: Math.random() < 0.7, seed: Math.random() * 10 }));
    this.gulls = [];
    for (let i = 0; i < 6; i++) this.gulls.push({ x: rand(0.3, 0.9), y: rand(0.12, 0.35), r: rand(0.03, 0.08), ph: rand(0, TAU), w: rand(0.15, 0.3) });
  },
  update() {},
  cliffTop(x) {
    // cliff occupies the right side: a plateau with a ragged edge dropping toward the sea on the left
    const edge = W * 0.5;
    if (x < edge) return null;
    return H * 0.47 + noise3(x * 0.006, 3, 1) * H * 0.02 - Math.min(1, (x - edge) / (W * 0.08)) * H * 0.02;
  },
  draw(t, ox, oy) {
    const hz = this.horizon + oy * 0.3;
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.stars) { ctx.globalAlpha = s[2] * (0.75 + 0.25 * Math.sin(t * 0.4 + s[3])); ctx.fillStyle = PAL[19]; ctx.fillRect(s[0] * W, s[1] * H, 1.3 * scale, 1.3 * scale); }
    // the beam: two opposite beams rotating about the vertical axis; seen from the side,
    // a beam's length on screen is ∝ |cos φ| and it widens as it turns toward the viewer
    const lx = this.focus[0] * W + ox * 0.6, ly = this.focus[1] * H + oy * 0.6;
    const phi = t * TAU / 20;
    for (const off of [0, Math.PI]) {
      const c = Math.cos(phi + off), s = Math.sin(phi + off);
      const len = W * 0.75 * Math.abs(c), spread = H * (0.03 + 0.05 * Math.max(0, s));
      const dir = Math.sign(c) || 1;
      const g = ctx.createLinearGradient(lx, ly, lx + dir * len, ly);
      const toward = Math.max(0, s);
      g.addColorStop(0, shade(1, 0.22 + 0.12 * toward)); g.addColorStop(1, shade(0.8, 0));
      ctx.globalAlpha = 1; ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(lx, ly - 3 * scale); ctx.lineTo(lx + dir * len, ly - spread); ctx.lineTo(lx + dir * len, ly + spread); ctx.lineTo(lx, ly + 3 * scale); ctx.closePath(); ctx.fill();
    }
    // lantern glow (steady, gently brighter when a beam faces us — never a sharp flash)
    const face = Math.max(Math.max(0, Math.sin(phi)), Math.max(0, Math.sin(phi + Math.PI)));
    const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, H * 0.06);
    lg.addColorStop(0, shade(1, 0.45 + 0.2 * face)); lg.addColorStop(1, shade(0.8, 0));
    ctx.fillStyle = lg; ctx.fillRect(lx - H * 0.06, ly - H * 0.06, H * 0.12, H * 0.12);
    // gulls
    ctx.strokeStyle = PAL[18]; ctx.lineWidth = 1 * scale;
    for (const g of this.gulls) {
      const a = t * g.w + g.ph, x = (g.x + Math.cos(a) * g.r) * W, y = (g.y + Math.sin(a) * g.r * 0.4) * H, f = Math.sin(t * 3 + g.ph) * 3 * scale, w = 7 * scale;
      ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(x - w, y - f); ctx.quadraticCurveTo(x - w * 0.4, y - 2 * scale, x, y); ctx.quadraticCurveTo(x + w * 0.4, y - 2 * scale, x + w, y - f); ctx.stroke();
    }
    // sea
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.6; ctx.fillStyle = DARK(3); ctx.fillRect(0, hz, W, H - hz);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.4; ctx.strokeStyle = PAL[16]; ctx.lineWidth = 0.9 * scale; ctx.beginPath(); ctx.moveTo(0, hz); ctx.lineTo(W, hz); ctx.stroke();
    for (let k = 0; k < 34; k++) {
      const p = Math.pow((k + 1) / 34, 1.8), y = hz + (H - hz) * p;
      ctx.globalAlpha = 0.06 + 0.3 * p; ctx.strokeStyle = PAL[Math.round(10 + 8 * p)]; ctx.lineWidth = (0.6 + p) * scale;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 10 * scale) { const yy = y + (Math.sin(x * 0.006 / (p + 0.2) / scale + t * 0.9 + k * 0.6) * 0.6 + Math.sin(x * 0.017 / (p + 0.2) / scale - t * 1.3 + k)) * 4 * p * scale; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }
      ctx.stroke();
    }
    // beam glitter on the water
    for (const off of [0, Math.PI]) {
      const c = Math.cos(phi + off); if (Math.abs(c) < 0.2) continue;
      for (let k = 0; k < 40; k++) {
        const x = lx + Math.sign(c) * W * 0.75 * Math.abs(c) * hash(k + Math.floor(t * 2)), y = hz + (H - hz) * 0.15 * hash(k * 3.1);
        ctx.globalAlpha = 0.25 * Math.abs(c); ctx.fillStyle = PAL[22]; ctx.fillRect(x, y, 5 * scale, 1 * scale);
      }
    }
    // cliff
    ctx.globalCompositeOperation = 'source-over';
    const pts = [];
    for (let x = W * 0.5; x <= W + 8; x += 6 * scale) pts.push([x + ox * 0.6, this.cliffTop(x) + oy * 0.6]);
    ctx.globalAlpha = 1; ctx.fillStyle = DARK(5);
    ctx.beginPath(); ctx.moveTo(pts[0][0] - W * 0.03, H); ctx.lineTo(pts[0][0] - W * 0.01, hz + H * 0.08);
    ctx.lineTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.45; ctx.strokeStyle = PAL[17]; ctx.lineWidth = 1 * scale;
    ctx.beginPath(); ctx.moveTo(pts[0][0] - W * 0.01, hz + H * 0.08); ctx.lineTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.stroke();
    // rock strata hatching on the cliff face
    ctx.globalAlpha = 0.12; ctx.lineWidth = 0.7 * scale; ctx.beginPath();
    for (let k = 1; k < 14; k++) { const y = pts[0][1] + k * 18 * scale; ctx.moveTo(pts[0][0] - W * 0.01 - k * 1.5 * scale, y); ctx.lineTo(pts[0][0] + W * 0.12 + noise3(k, 1, 1) * 40 * scale, y + noise3(k, 2, 1) * 6 * scale); }
    ctx.stroke();
    // surf at the foot of the cliff
    for (let k = 0; k < 5; k++) {
      const ph = (t * 0.25 + k / 5) % 1, x0 = pts[0][0] - W * 0.03 - ph * W * 0.06, y = hz + H * 0.11 + k * 7 * scale;
      ctx.globalAlpha = 0.4 * (1 - ph); ctx.strokeStyle = PAL[21];
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo(x0 + W * 0.02, y - 4 * scale, x0 + W * 0.05, y); ctx.stroke();
    }
    // lighthouse tower
    const bx = lx, by = this.cliffTop(this.focus[0] * W) + oy * 0.6, top = ly + H * 0.04;
    const w0 = W * 0.022, w1 = W * 0.014;
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = DARK(6);
    ctx.beginPath(); ctx.moveTo(bx - w0, by); ctx.lineTo(bx - w1, top); ctx.lineTo(bx + w1, top); ctx.lineTo(bx + w0, by); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.7; ctx.strokeStyle = PAL[20]; ctx.lineWidth = 1.1 * scale; ctx.stroke();
    ctx.globalAlpha = 0.35; ctx.beginPath();
    for (let k = 1; k < 4; k++) { const f = k / 4, y = lerp(by, top, f), w = lerp(w0, w1, f); ctx.moveTo(bx - w, y); ctx.lineTo(bx + w, y); }
    ctx.stroke();
    ctx.globalAlpha = 0.7; ctx.beginPath();
    ctx.rect(bx - w1 * 1.4, top - 3 * scale, w1 * 2.8, 3 * scale);                    // gallery
    ctx.rect(bx - w1 * 0.8, ly - H * 0.025, w1 * 1.6, H * 0.04);                   // lantern room
    ctx.moveTo(bx - w1, ly - H * 0.025); ctx.quadraticCurveTo(bx, ly - H * 0.06, bx + w1, ly - H * 0.025);   // dome
    ctx.moveTo(bx, ly - H * 0.05); ctx.lineTo(bx, ly - H * 0.065);
    ctx.stroke();
    // keeper's cottage and village houses
    for (const hs of this.houses) {
      const x = hs.x * W + ox * 0.6, y = this.cliffTop(hs.x * W) + oy * 0.6, w = W * 0.025 * hs.s, h = H * 0.03 * hs.s;
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = DARK(4);
      ctx.beginPath(); ctx.rect(x - w / 2, y - h, w, h); ctx.moveTo(x - w * 0.62, y - h); ctx.lineTo(x, y - h * 1.8); ctx.lineTo(x + w * 0.62, y - h); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[18]; ctx.lineWidth = 0.9 * scale;
      ctx.beginPath(); ctx.moveTo(x - w * 0.62, y - h); ctx.lineTo(x, y - h * 1.8); ctx.lineTo(x + w * 0.62, y - h); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x - w / 2, y); ctx.moveTo(x + w / 2, y - h); ctx.lineTo(x + w / 2, y); ctx.stroke();
      if (hs.lit) { ctx.globalAlpha = 0.6 + 0.2 * Math.sin(t * 0.7 + hs.seed); ctx.fillStyle = PAL[22]; ctx.fillRect(x - w * 0.2, y - h * 0.65, w * 0.18, h * 0.3); ctx.fillRect(x + w * 0.06, y - h * 0.65, w * 0.18, h * 0.3); }
    }
    this.geo = { lx, ly, by, hz };
  },
  drawOver(t) {
    if (!SETTINGS.math || !this.geo) return;
    const o = octx, { lx, ly, hz } = this.geo;
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.lineWidth = 0.8 * scale;
    // height dimension
    const x = lx + W * 0.05;
    o.globalAlpha = 0.45; o.strokeStyle = PAL[17];
    o.beginPath(); o.moveTo(x, ly); o.lineTo(x, hz); o.moveTo(x - 5 * scale, ly); o.lineTo(x + 5 * scale, ly); o.moveTo(x - 5 * scale, hz); o.lineTo(x + 5 * scale, hz); o.stroke();
    o.globalAlpha = 0.7; o.fillStyle = PAL[18]; o.textAlign = 'left';
    o.fillText('h₁ = 100 m', x + 8 * scale, (ly + hz) / 2);
    // range diagram: curved Earth, tangent lines from lighthouse and ship
    const cx = W * 0.28, cy = H * 0.88, R = H * 0.5;
    o.globalAlpha = 0.35; o.strokeStyle = PAL[16];
    o.beginPath(); o.arc(cx, cy + R, R, -Math.PI * 0.82, -Math.PI * 0.18); o.stroke();
    const a1 = -Math.PI * 0.62, a2 = -Math.PI * 0.38, hh = R * 0.06;
    const P1 = [cx + Math.cos(a1) * (R + hh), cy + R + Math.sin(a1) * (R + hh)], P2 = [cx + Math.cos(a2) * (R + hh * 0.35), cy + R + Math.sin(a2) * (R + hh * 0.35)];
    const T = [cx + Math.cos(-Math.PI / 2 - 0.05) * R, cy + R + Math.sin(-Math.PI / 2 - 0.05) * R];
    o.globalAlpha = 0.6; o.strokeStyle = PAL[20];
    o.beginPath(); o.moveTo(P1[0], P1[1]); o.lineTo(T[0], T[1]); o.lineTo(P2[0], P2[1]); o.stroke();
    o.fillStyle = PAL[20];
    for (const P of [P1, P2, T]) { o.beginPath(); o.arc(P[0], P[1], 2.5 * scale, 0, TAU); o.fill(); }
    const d1 = 3.57 * Math.sqrt(100), d2 = 3.57 * Math.sqrt(5);
    o.globalAlpha = 0.6; o.fillStyle = PAL[17]; o.textAlign = 'center';
    o.fillText(`light h₁ = 100 m → ${d1.toFixed(1)} km`, P1[0], P1[1] - 14 * scale);
    o.fillText(`ship h₂ = 5 m → ${d2.toFixed(1)} km`, P2[0], P2[1] - 14 * scale);
    o.globalAlpha = 0.75;
    o.fillText(`seen from up to ${(d1 + d2).toFixed(1)} km away`, cx, cy - hh * 0.2 - 4 * scale);
  },
  hud(t) { return [`beam bearing ${(((t * 360 / 20) % 360)).toFixed(0).padStart(3, '0')}°`]; }
};
