// Architecture — a mosque at dusk beside a reflecting pool, under a crescent moon. Above it turns an
// eight-fold star pattern of the kind used in Islamic geometric art, built from squares and octagons.
const SCENE = {
  focus: [0.64, 0.5],
  ambient: false,
  anchors: [[0.46, 0.05], [0.66, 0.08], [0.2, 0.62], [0.2, 0.74], [0.2, 0.86], [0.42, 0.95]],
  title: 'MOSQUE · EIGHT-FOLD GEOMETRY',
  sub: 'star polygon {8/2} · tiling 4.8.8',
  eqs: [
    { e: '{8/2} = two squares turned 45°', n: 'the eight-pointed star' },
    { e: '{8/3}', n: 'star octagon — join every third vertex' },
    { e: 'C₈ · 45°', n: 'eight-fold rotational symmetry' },
    { e: '(n − 2) · 180° / n = 135°', n: 'interior angle of a regular octagon' },
    { e: '4.8.8', n: 'square–octagon tiling: a square and two octagons at every vertex' },
    { e: 'a_oct = 2 (1 + √2) s²', n: 'area of a regular octagon of side s' }
  ],
  init() {
    this.pool = H * 0.8;
    this.stars = [];
    for (let i = 0; i < 200; i++) this.stars.push([Math.random(), Math.random() * 0.7, rand(0.06, 0.4), rand(0, TAU)]);
    this.sil = this.buildMosque();
  },
  update() {},
  buildMosque() {
    const c = document.createElement('canvas'); c.width = base.width; c.height = base.height;
    const g = c.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0);
    const cx = this.focus[0] * W, gy = this.pool, u = H * 0.05;
    const path = new Path2D();
    // prayer hall
    path.rect(cx - u * 5, gy - u * 3.2, u * 10, u * 3.2);
    // drum + onion dome
    path.rect(cx - u * 2, gy - u * 4.4, u * 4, u * 1.2);
    const dome = (x, y, R, Hh) => {
      const p = new Path2D(); p.moveTo(x - R, y);
      for (let i = 0; i <= 40; i++) { const tt = i / 40, r = R * (1 + 0.32 * Math.sin(Math.PI * Math.min(tt / 0.6, 1))) * Math.pow(1 - tt, 0.85); p.lineTo(x - r, y - tt * Hh); }
      for (let i = 40; i >= 0; i--) { const tt = i / 40, r = R * (1 + 0.32 * Math.sin(Math.PI * Math.min(tt / 0.6, 1))) * Math.pow(1 - tt, 0.85); p.lineTo(x + r, y - tt * Hh); }
      p.closePath(); return p;
    };
    path.addPath(dome(cx, gy - u * 4.4, u * 2, u * 3.6));
    path.addPath(dome(cx - u * 3.4, gy - u * 3.2, u * 0.9, u * 1.7));
    path.addPath(dome(cx + u * 3.4, gy - u * 3.2, u * 0.9, u * 1.7));
    // minarets
    for (const s of [-1, 1]) {
      const x = cx + s * u * 7;
      path.rect(x - u * 0.38, gy - u * 9, u * 0.76, u * 9);
      path.rect(x - u * 0.6, gy - u * 6.2, u * 1.2, u * 0.25);
      path.rect(x - u * 0.55, gy - u * 8.8, u * 1.1, u * 0.22);
      path.addPath(dome(x, gy - u * 9, u * 0.42, u * 1.1));
    }
    // fill + rim light
    g.fillStyle = DARK(3); g.fill(path);
    g.strokeStyle = PAL[19]; g.lineWidth = 1.1 * scale; g.globalAlpha = 0.7; g.stroke(path);
    // arcade of pointed arches and windows
    g.globalAlpha = 0.5; g.lineWidth = 0.9 * scale; g.strokeStyle = PAL[18];
    const arch = (x, y, w, h) => { g.moveTo(x - w / 2, y); g.lineTo(x - w / 2, y - h); g.quadraticCurveTo(x - w / 2, y - h - w * 0.75, x, y - h - w * 0.9); g.quadraticCurveTo(x + w / 2, y - h - w * 0.75, x + w / 2, y - h); g.lineTo(x + w / 2, y); };
    g.beginPath();
    for (let k = -4; k <= 4; k++) arch(cx + k * u * 1.05, gy, u * 0.7, u * 1.3);
    arch(cx, gy, u * 1.3, u * 1.6);
    for (let k = -3; k <= 3; k++) arch(cx + k * u * 0.5, gy - u * 3.45, u * 0.22, u * 0.5);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) arch(cx + s * u * 7, gy - u * (1.5 + k * 2.2), u * 0.22, u * 0.5);
    g.stroke();
    // finials with crescents
    g.globalAlpha = 0.8; g.lineWidth = 1 * scale; g.strokeStyle = PAL[21];
    const fin = (x, y, s) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - s * 1.6); g.stroke(); g.beginPath(); g.arc(x, y - s * 2.1, s * 0.45, 0.6, TAU - 0.6); g.stroke(); };
    fin(cx, gy - u * 8, u * 0.4); fin(cx - u * 3.4, gy - u * 4.9, u * 0.25); fin(cx + u * 3.4, gy - u * 4.9, u * 0.25);
    for (const s of [-1, 1]) fin(cx + s * u * 7, gy - u * 10.1, u * 0.25);
    // lamp-lit windows
    g.globalAlpha = 0.7; g.fillStyle = PAL[22];
    for (let k = -3; k <= 3; k++) g.fillRect(cx + k * u * 0.5 - 1.5 * scale, gy - u * 3.75, 3 * scale, 6 * scale);
    for (let k = -4; k <= 4; k++) { if (k === 0) continue; g.globalAlpha = 0.25; g.fillRect(cx + k * u * 1.05 - u * 0.3, gy - u * 1.3, u * 0.6, u * 1.3); }
    this.u = u;
    return c;
  },
  starPattern(cx, cy, R, rot) {
    // square lattice of 8-pointed stars ({8/2}) with octagons between them, clipped to a circle
    const a = R / 3.2, s = a * 0.42;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.beginPath();
    for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) {
      const x = i * a, y = j * a;
      if (Math.hypot(x, y) > R + a) continue;
      for (const off of [0, Math.PI / 4]) {
        for (let k = 0; k <= 4; k++) { const b = off + k * Math.PI / 2, px = x + Math.cos(b) * s * 1.2, py = y + Math.sin(b) * s * 1.2; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      }
      // octagon around each star
      for (let k = 0; k <= 8; k++) { const b = Math.PI / 8 + k * Math.PI / 4, px = x + Math.cos(b) * s * 1.55, py = y + Math.sin(b) * s * 1.55; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      // connecting struts to neighbours (forming the square cells)
      for (let k = 0; k < 4; k++) { const b = k * Math.PI / 2; ctx.moveTo(x + Math.cos(b) * s * 1.43, y + Math.sin(b) * s * 1.43); ctx.lineTo(x + Math.cos(b) * (a - s * 1.43), y + Math.sin(b) * (a - s * 1.43)); }
    }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalAlpha = 0.3; ctx.strokeStyle = PAL[18]; ctx.lineWidth = 0.9 * scale; ctx.stroke();
    ctx.restore();
  },
  draw(t, ox, oy) {
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.stars) { ctx.globalAlpha = s[2] * (0.75 + 0.25 * Math.sin(t * 0.5 + s[3])); ctx.fillStyle = PAL[19]; ctx.fillRect(s[0] * W, s[1] * H, 1.3 * scale, 1.3 * scale); }
    // crescent moon
    const mx = W * 0.88 + ox * 0.15, my = H * 0.16, mr = H * 0.045;
    ctx.globalAlpha = 0.85; ctx.fillStyle = shade(0.85, 0.5);
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = DARK(5);
    ctx.beginPath(); ctx.arc(mx + mr * 0.42, my - mr * 0.15, mr * 0.88, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    // rotating geometric pattern in the sky
    const pc = [W * 0.36 + ox * 0.3, H * 0.33 + oy * 0.3], pr = H * 0.25;
    this.starPattern(pc[0], pc[1], pr, t * 0.02);
    // highlight the central star
    ctx.save(); ctx.translate(pc[0], pc[1]); ctx.rotate(t * 0.02);
    const s = pr / 3.2 * 0.42 * 1.2;
    ctx.beginPath();
    for (const off of [0, Math.PI / 4]) for (let k = 0; k <= 4; k++) { const b = off + k * Math.PI / 2; k ? ctx.lineTo(Math.cos(b) * s, Math.sin(b) * s) : ctx.moveTo(Math.cos(b) * s, Math.sin(b) * s); }
    ctx.globalAlpha = 0.8; ctx.strokeStyle = PAL[22]; ctx.lineWidth = 1.3 * scale; ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 0.35; ctx.strokeStyle = PAL[19]; ctx.lineWidth = 1 * scale;
    ctx.beginPath(); ctx.arc(pc[0], pc[1], pr, 0, TAU); ctx.arc(pc[0], pc[1], pr * 1.04, 0, TAU); ctx.stroke();
    this.pc = [pc[0], pc[1], pr];
    // mosque silhouette and its reflection
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1; ctx.drawImage(this.sil, ox * 0.6, oy * 0.6, W, H);
    const py = this.pool + oy * 0.6;
    ctx.save(); ctx.beginPath(); ctx.rect(0, py, W, H - py); ctx.clip();
    for (let k = 0; k < 18; k++) {
      const y0 = py + k * (H - py) / 18, h = (H - py) / 18 + 1;
      ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, h); ctx.clip();
      ctx.translate(Math.sin(t * 0.9 + k * 0.8) * 2.5 * scale, 2 * py); ctx.scale(1, -1);
      ctx.globalAlpha = 0.28 * (1 - k / 22);
      ctx.drawImage(this.sil, ox * 0.6, oy * 0.6, W, H);
      ctx.restore();
    }
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[17]; ctx.lineWidth = 1 * scale;
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
    // pool tiles in perspective
    ctx.globalAlpha = 0.08; ctx.beginPath();
    const vx = this.focus[0] * W;
    for (let k = -16; k <= 16; k++) { ctx.moveTo(vx + k * 18 * scale, py); ctx.lineTo(vx + k * 70 * scale, H); }
    ctx.stroke();
  },
  drawOver(t) {
    if (!SETTINGS.math || !this.pc) return;
    const o = octx, [cx, cy, R] = this.pc;
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'left'; o.lineWidth = 0.8 * scale;
    // 45° symmetry wedge
    const a = t * 0.02;
    o.globalAlpha = 0.45; o.strokeStyle = PAL[20]; o.setLineDash([3 * scale, 4 * scale]);
    o.beginPath(); o.moveTo(cx, cy); o.lineTo(cx + Math.cos(a) * R * 1.12, cy + Math.sin(a) * R * 1.12); o.moveTo(cx, cy); o.lineTo(cx + Math.cos(a + Math.PI / 4) * R * 1.12, cy + Math.sin(a + Math.PI / 4) * R * 1.12); o.stroke();
    o.setLineDash([]);
    o.beginPath(); o.arc(cx, cy, R * 0.3, a, a + Math.PI / 4); o.stroke();
    o.globalAlpha = 0.75; o.fillStyle = PAL[20];
    o.fillText('45°', cx + Math.cos(a + Math.PI / 8) * R * 0.38, cy + Math.sin(a + Math.PI / 8) * R * 0.38);
    o.globalAlpha = 0.55; o.fillStyle = PAL[17];
    o.fillText('rotational symmetry C₈ · mirror lines every 22.5°', cx - R, cy + R * 1.12 + 18 * scale);
    // dome profile annotation
    const u = this.u, dx = this.focus[0] * W, dy = this.pool - u * 4.4;
    o.globalAlpha = 0.4; o.strokeStyle = PAL[16];
    o.beginPath(); o.moveTo(dx + u * 2.9, dy); o.lineTo(dx + u * 2.9, dy - u * 3.6); o.moveTo(dx + u * 2.75, dy); o.lineTo(dx + u * 3.05, dy); o.moveTo(dx + u * 2.75, dy - u * 3.6); o.lineTo(dx + u * 3.05, dy - u * 3.6); o.stroke();
    o.globalAlpha = 0.55; o.fillStyle = PAL[17];
    o.fillText('onion dome  r(y) bulges ≈ 1.3× the drum', dx + u * 3.2, dy - u * 1.8);
  },
  hud() { return ['dusk · crescent moon · reflecting pool']; }
};
