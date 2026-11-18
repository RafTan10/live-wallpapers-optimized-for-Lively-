// Architecture — a Gothic cathedral front drawn like an architect's elevation. The rose window's 12-fold tracery
// turns slowly, pointed arches show their two construction circles, and stars wheel overhead.
const SCENE = {
  focus: [0.62, 0.5],
  anchors: [[0.24, 0.08], [0.46, 0.05], [0.2, 0.3], [0.2, 0.5], [0.2, 0.7], [0.2, 0.9]],
  title: 'GOTHIC CATHEDRAL · WEST ELEVATION',
  sub: 'equilateral arches · rose window D₁₂',
  eqs: [
    { e: 'R = span', n: 'equilateral pointed arch: each side is an arc centred on the opposite springing' },
    { e: 'h = span · sin 60° ≈ 0.866 · span', n: 'rise of an equilateral arch' },
    { e: 'D₁₂', n: 'symmetry group of the rose window: 12 rotations, 12 reflections' },
    { e: 'y = a cosh(x / a)', n: 'catenary — the ideal shape for an arch in pure compression' },
    { e: 'H_thrust = w L² / (8 f)', n: 'horizontal thrust that flying buttresses resist' },
    { e: 'φ = (1 + √5) / 2', n: 'proportions often set out with the golden ratio' }
  ],
  init() {
    this.stars = [];
    for (let i = 0; i < 220; i++) this.stars.push([Math.random(), Math.random() * 0.8, rand(0.08, 0.45), rand(0.8, 1.6)]);
    this.ground = H * 0.9;
    this.u = H * 0.09;     // module
  },
  update() {},
  arch(cx, ys, s, legs) {
    ctx.moveTo(cx - s / 2, ys + legs); ctx.lineTo(cx - s / 2, ys);
    ctx.arc(cx + s / 2, ys, s, Math.PI, Math.PI * 4 / 3);
    ctx.arc(cx - s / 2, ys, s, -Math.PI / 3, 0);
    ctx.lineTo(cx + s / 2, ys + legs);
  },
  rose(cx, cy, R, a) {
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.arc(cx, cy, R * 0.92, 0, TAU);
    ctx.moveTo(cx + R * 0.22, cy); ctx.arc(cx, cy, R * 0.22, 0, TAU);
    for (let k = 0; k < 12; k++) {
      const b = a + k * TAU / 12, c = Math.cos(b), s = Math.sin(b);
      ctx.moveTo(cx + c * R * 0.22, cy + s * R * 0.22); ctx.lineTo(cx + c * R * 0.92, cy + s * R * 0.92);
      const pr = R * 0.17, px = cx + Math.cos(b + Math.PI / 12) * R * 0.62, py = cy + Math.sin(b + Math.PI / 12) * R * 0.62;
      ctx.moveTo(px + pr, py); ctx.arc(px, py, pr, 0, TAU);
      const qr = R * 0.07, qx = cx + Math.cos(b + Math.PI / 12) * R * 0.84, qy = cy + Math.sin(b + Math.PI / 12) * R * 0.84;
      ctx.moveTo(qx + qr, qy); ctx.arc(qx, qy, qr, 0, TAU);
      const fx = cx + c * R * 0.35, fy = cy + s * R * 0.35, fr = R * 0.08;
      ctx.moveTo(fx + fr, fy); ctx.arc(fx, fy, fr, 0, TAU);
    }
  },
  draw(t, ox, oy) {
    const cx = this.focus[0] * W + ox, g = this.ground + oy, u = this.u;
    ctx.globalCompositeOperation = 'lighter';
    // slowly wheeling stars (around a pole above the towers)
    const pole = [cx, H * 0.05], rot = t * 0.004;
    for (const s of this.stars) {
      const dx = s[0] * W - pole[0], dy = s[1] * H - pole[1], c = Math.cos(rot), sn = Math.sin(rot);
      ctx.globalAlpha = s[2]; ctx.fillStyle = PAL[19];
      ctx.fillRect(pole[0] + dx * c - dy * sn, pole[1] + dx * sn + dy * c, s[3] * scale, s[3] * scale);
    }
    const nave = { w: u * 3.4, h: u * 5.2 }, tw = u * 1.5, th = u * 6.6;
    const shapes = [];
    // towers with spires
    for (const side of [-1, 1]) {
      const x = cx + side * (nave.w / 2 + tw / 2);
      shapes.push(() => { ctx.rect(x - tw / 2, g - th, tw, th); ctx.moveTo(x - tw / 2, g - th); ctx.lineTo(x, g - th - u * 3.2); ctx.lineTo(x + tw / 2, g - th); });
    }
    shapes.push(() => { ctx.rect(cx - nave.w / 2, g - nave.h, nave.w, nave.h); ctx.moveTo(cx - nave.w / 2, g - nave.h); ctx.lineTo(cx, g - nave.h - u * 1.6); ctx.lineTo(cx + nave.w / 2, g - nave.h); });
    // occluding fills then outlines
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.96; ctx.fillStyle = DARK(4);
    for (const f of shapes) { ctx.beginPath(); f(); ctx.fill(); }
    // flying buttresses
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 1.1 * scale; ctx.strokeStyle = PAL[17]; ctx.globalAlpha = 0.5;
    for (const side of [-1, 1]) {
      const x0 = cx + side * (nave.w / 2 + tw), pier = x0 + side * u * 1.6;
      ctx.beginPath(); ctx.rect(Math.min(pier, pier + side * u * 0.4), g - u * 3.2, u * 0.4, u * 3.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pier, g - u * 3.0); ctx.quadraticCurveTo(x0 + side * u * 0.6, g - u * 3.4, x0, g - u * 4.4); ctx.moveTo(pier, g - u * 2.4); ctx.quadraticCurveTo(x0 + side * u * 0.5, g - u * 2.6, x0, g - u * 3.6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pier + side * u * 0.2, g - u * 3.2); ctx.lineTo(pier + side * u * 0.2, g - u * 4); ctx.stroke();
    }
    ctx.globalAlpha = 0.7; ctx.strokeStyle = PAL[19]; ctx.lineWidth = 1.2 * scale;
    for (const f of shapes) { ctx.beginPath(); f(); ctx.stroke(); }
    // tower details: lancet windows, string courses, crockets on spires
    ctx.lineWidth = 0.9 * scale;
    for (const side of [-1, 1]) {
      const x = cx + side * (nave.w / 2 + tw / 2);
      ctx.globalAlpha = 0.45; ctx.strokeStyle = PAL[17];
      ctx.beginPath();
      for (let lv = 0; lv < 3; lv++) {
        const ys = g - u * (2.2 + lv * 1.6);
        for (const dx of [-0.25, 0.25]) this.arch(x + dx * tw, ys, tw * 0.28, u * 0.9);
        ctx.moveTo(x - tw / 2, ys + u * 1.05); ctx.lineTo(x + tw / 2, ys + u * 1.05);
      }
      ctx.stroke();
      ctx.globalAlpha = 0.35; ctx.beginPath();
      for (let k = 1; k <= 6; k++) { const yy = g - th - u * 3.2 * k / 7, xx = tw / 2 * (1 - k / 7); ctx.moveTo(x - xx, yy); ctx.lineTo(x - xx - 4 * scale, yy - 4 * scale); ctx.moveTo(x + xx, yy); ctx.lineTo(x + xx + 4 * scale, yy - 4 * scale); }
      ctx.stroke();
      ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.moveTo(x, g - th - u * 3.2); ctx.lineTo(x, g - th - u * 3.6); ctx.moveTo(x - 4 * scale, g - th - u * 3.45); ctx.lineTo(x + 4 * scale, g - th - u * 3.45); ctx.stroke();
    }
    // portals (three equilateral arches), gallery of kings
    ctx.globalAlpha = 0.65; ctx.strokeStyle = PAL[19]; ctx.lineWidth = 1.1 * scale;
    ctx.beginPath();
    this.arch(cx, g - u * 1.3, u * 1.5, u * 1.3); this.arch(cx, g - u * 1.3, u * 1.2, u * 1.3); this.arch(cx, g - u * 1.3, u * 0.9, u * 1.3);
    for (const side of [-1, 1]) { const x = cx + side * (nave.w / 2 + tw / 2); this.arch(x, g - u * 0.9, tw * 0.55, u * 0.9); }
    ctx.stroke();
    ctx.globalAlpha = 0.35; ctx.beginPath();
    for (let k = 0; k < 9; k++) { const x = cx - nave.w / 2 + nave.w * (k + 0.5) / 9; this.arch(x, g - u * 2.7, nave.w / 11, u * 0.35); }
    ctx.moveTo(cx - nave.w / 2, g - u * 2.4); ctx.lineTo(cx + nave.w / 2, g - u * 2.4);
    ctx.stroke();
    // rose window: soft glow, then turning tracery
    const rc = [cx, g - u * 3.8], R = u * 1.15;
    const gl = ctx.createRadialGradient(rc[0], rc[1], 0, rc[0], rc[1], R * 1.4);
    gl.addColorStop(0, shade(0.9, 0.22)); gl.addColorStop(1, shade(0.6, 0));
    ctx.globalAlpha = 0.8 + 0.2 * Math.sin(t * 0.4); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(rc[0], rc[1], R * 1.4, 0, TAU); ctx.fill();
    this.rose(rc[0], rc[1], R, t * 0.04);
    ctx.globalAlpha = 0.75; ctx.strokeStyle = PAL[21]; ctx.lineWidth = 1 * scale; ctx.stroke();
    // ground line and pavement grid in perspective
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[17]; ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(W, g); ctx.stroke();
    ctx.globalAlpha = 0.1; ctx.beginPath();
    for (let k = -12; k <= 12; k++) { ctx.moveTo(cx + k * u * 0.5, g); ctx.lineTo(cx + k * u * 1.8, H); }
    for (let k = 1; k < 5; k++) { const y = g + (H - g) * (k / 5) ** 1.4; ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    this.geo = { cx, g, u, rc, R, nave, tw, th };
  },
  drawOver(t) {
    if (!SETTINGS.math || !this.geo) return;
    const o = octx, { cx, g, u, rc, R, nave, tw, th } = this.geo;
    o.lineWidth = 0.8 * scale; o.font = MONO(10.5); o.textBaseline = 'middle';
    // construction circles of the main portal arch
    const ys = g - u * 1.3, s = u * 1.5;
    o.globalAlpha = 0.25; o.strokeStyle = PAL[20]; o.setLineDash([3 * scale, 4 * scale]);
    o.beginPath(); o.arc(cx - s / 2, ys, s, 0, TAU); o.moveTo(cx + s / 2 + s, ys); o.arc(cx + s / 2, ys, s, 0, TAU); o.stroke(); o.setLineDash([]);
    o.globalAlpha = 0.7; o.fillStyle = PAL[20];
    for (const x of [cx - s / 2, cx + s / 2]) { o.beginPath(); o.arc(x, ys, 2.5 * scale, 0, TAU); o.fill(); }
    o.textAlign = 'left'; o.fillText('R = span', cx + s * 1.6, ys - s * 0.2);
    // rose window: radius and 30° sector
    o.globalAlpha = 0.5; o.strokeStyle = PAL[18];
    o.beginPath(); o.moveTo(rc[0], rc[1]); o.lineTo(rc[0] + R * 1.25, rc[1]); o.stroke();
    o.beginPath(); o.arc(rc[0], rc[1], R * 1.18, -Math.PI / 12, Math.PI / 12); o.stroke();
    o.fillStyle = PAL[18]; o.fillText('30° = 360° / 12', rc[0] + R * 1.3, rc[1] - 10 * scale);
    // overall dimensions
    const left = cx - nave.w / 2 - tw, right = cx + nave.w / 2 + tw, top = g - th - u * 3.6;
    o.globalAlpha = 0.4; o.strokeStyle = PAL[16];
    o.beginPath(); o.moveTo(left, g + u * 0.6); o.lineTo(right, g + u * 0.6); o.moveTo(left, g + u * 0.45); o.lineTo(left, g + u * 0.75); o.moveTo(right, g + u * 0.45); o.lineTo(right, g + u * 0.75);
    o.moveTo(right + u * 1.9, g); o.lineTo(right + u * 1.9, top); o.moveTo(right + u * 1.75, g); o.lineTo(right + u * 2.05, g); o.moveTo(right + u * 1.75, top); o.lineTo(right + u * 2.05, top);
    o.stroke();
    o.globalAlpha = 0.6; o.fillStyle = PAL[17]; o.textAlign = 'center';
    o.fillText(`width ${((right - left) / u * 6.5).toFixed(0)} m`, (left + right) / 2, g + u * 0.85);
    o.textAlign = 'left'; o.fillText(`height ${((g - top) / u * 6.5).toFixed(0)} m`, right + u * 2.1, (g + top) / 2);
  },
  hud() { return ['scale: 1 module ≈ 6.5 m']; }
};
