// Geography — a slowly shifting terrain drawn as contour lines (marching squares on fBm noise),
// with survey stations reading elevation and the gradient ∇h.
const SCENE = {
  ambient: false,
  focus: [0.6, 0.48],
  anchors: [[0.30, 0.12], [0.56, 0.08], [0.26, 0.42], [0.30, 0.62], [0.44, 0.2], [0.24, 0.84]],
  title: 'TOPOGRAPHIC SURVEY · CONTOUR MAP',
  sub: 'contour interval 100 m · index contours every 500 m',
  eqs: [
    { e: 'h(x, y) = Σ 2⁻ᵏ N(2ᵏx, 2ᵏy)', n: 'fractal Brownian terrain (fBm)' },
    { e: '∇h · t = 0', n: 'a contour runs perpendicular to the gradient' },
    { e: 'slope = |∇h| = √(h_x² + h_y²)', n: 'steepest ascent' },
    { e: 'dh = ∇h · dr', n: 'change in height along a path' },
    { e: '{ (x, y) : h(x, y) = c }', n: 'a level set — one contour line' },
    { e: 'closer lines ⇔ steeper ground', n: 'reading a contour map' }
  ],
  init() {
    this.cs = Math.round(9 * scale);
    this.nx = Math.ceil(W / this.cs) + 2; this.ny = Math.ceil(H / this.cs) + 2;
    this.field = new Float32Array(this.nx * this.ny);
    this.frame = 0;
    this.stations = [[0.42, 0.3], [0.7, 0.62], [0.86, 0.28], [0.44, 0.76]].map(([x, y], i) => ({ x, y, n: 'S' + (i + 1) }));
    this.paths = null;
    this.compute(0);
  },
  h(x, y, z) {
    const f = 0.0012 / scale;
    let v = 0, a = 1, fr = 1;
    for (let k = 0; k < 4; k++) { v += a * noise3(x * f * fr + k * 31, y * f * fr, z + k * 7); a *= 0.5; fr *= 2.03; }
    return 1450 + v * 1900;
  },
  compute(z) {
    const { nx, ny, cs, field } = this;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) field[j * nx + i] = this.h(i * cs, j * cs, z);
    // marching squares into Path2D buckets
    const paths = [];
    for (let k = 0; k < 8; k++) paths.push(new Path2D());
    const STEP = 100;
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = field[j * nx + i], b = field[j * nx + i + 1], c = field[(j + 1) * nx + i + 1], d = field[(j + 1) * nx + i];
      const lo = Math.min(a, b, c, d), hi = Math.max(a, b, c, d);
      for (let L = Math.ceil(lo / STEP) * STEP; L <= hi; L += STEP) {
        const x0 = i * cs, y0 = j * cs;
        const pts = [];
        const edge = (va, vb, xa, ya, xb, yb) => {
          if ((va < L) !== (vb < L)) { const t = (L - va) / (vb - va); pts.push(xa + (xb - xa) * t, ya + (yb - ya) * t); }
        };
        edge(a, b, x0, y0, x0 + cs, y0);
        edge(b, c, x0 + cs, y0, x0 + cs, y0 + cs);
        edge(c, d, x0 + cs, y0 + cs, x0, y0 + cs);
        edge(d, a, x0, y0 + cs, x0, y0);
        if (pts.length < 4) continue;
        const idx = (Math.round(L / STEP) % 5 === 0) ? 4 : 0;
        const bucket = idx + clamp(Math.floor((L - 300) / 700), 0, 3);
        const P = paths[bucket];
        P.moveTo(pts[0], pts[1]); P.lineTo(pts[2], pts[3]);
        if (pts.length === 8) { P.moveTo(pts[4], pts[5]); P.lineTo(pts[6], pts[7]); }
      }
    }
    this.paths = paths;
  },
  sample(px, py) {
    const { nx, ny, cs, field } = this;
    const fx = px / cs, fy = py / cs, i = clamp(Math.floor(fx), 0, nx - 2), j = clamp(Math.floor(fy), 0, ny - 2);
    const u = fx - i, v = fy - j;
    const a = field[j * nx + i], b = field[j * nx + i + 1], c = field[(j + 1) * nx + i + 1], d = field[(j + 1) * nx + i];
    const h = lerp(lerp(a, b, u), lerp(d, c, u), v);
    const gx = (lerp(b, c, v) - lerp(a, d, v)) / cs, gy = (lerp(d, c, u) - lerp(a, b, u)) / cs;
    return [h, gx, gy];
  },
  update(dt, t) {
    this.frame++;
    if (this.frame % 3 === 0) this.compute(t * SETTINGS.drift);
  },
  draw(t, ox, oy) {
    if (!this.paths) return;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 8; k++) {
      const index = k >= 4, lvl = k % 4;
      ctx.strokeStyle = PAL[Math.round(9 + lvl * 3 + (index ? 4 : 0))];
      ctx.globalAlpha = index ? 0.6 : 0.3 + lvl * 0.05;
      ctx.lineWidth = (index ? 1.4 : 0.8) * scale;
      ctx.stroke(this.paths[k]);
    }
    ctx.restore();
  },
  drawOver(t, ox, oy) {
    const o = octx;
    o.font = MONO(10.5); o.textBaseline = 'middle';
    for (const s of this.stations) {
      const px = s.x * W, py = s.y * H;
      const [h, gx, gy] = this.sample(px - ox, py - oy);
      o.strokeStyle = PAL[20]; o.fillStyle = PAL[20]; o.lineWidth = 1 * scale;
      o.globalAlpha = 0.85;
      // station triangle
      const r = 6 * scale;
      o.beginPath(); o.moveTo(px, py - r); o.lineTo(px + r * 0.87, py + r * 0.5); o.lineTo(px - r * 0.87, py + r * 0.5); o.closePath(); o.stroke();
      if (!SETTINGS.math) continue;
      // gradient arrow (uphill)
      const g = Math.hypot(gx, gy), L = clamp(g * 9, 12, 60) * scale;
      if (g > 1e-6) {
        const ux = gx / g, uy = gy / g, ex = px + ux * L, ey = py + uy * L;
        o.globalAlpha = 0.6;
        o.beginPath(); o.moveTo(px, py); o.lineTo(ex, ey);
        o.lineTo(ex - (ux * Math.cos(0.4) - uy * Math.sin(0.4)) * 7 * scale, ey - (uy * Math.cos(0.4) + ux * Math.sin(0.4)) * 7 * scale);
        o.moveTo(ex, ey);
        o.lineTo(ex - (ux * Math.cos(-0.4) - uy * Math.sin(-0.4)) * 7 * scale, ey - (uy * Math.cos(-0.4) + ux * Math.sin(-0.4)) * 7 * scale);
        o.stroke();
      }
      o.textAlign = 'left'; o.globalAlpha = 0.8;
      o.fillText(`${s.n}  h = ${Math.round(h).toLocaleString('en-US')} m`, px + 12 * scale, py - 10 * scale);
      o.globalAlpha = 0.5;
      const slopeDeg = Math.atan(g / scale * 0.25) * 180 / Math.PI;
      o.fillText(`|∇h| → slope ${slopeDeg.toFixed(1)}°`, px + 12 * scale, py + 6 * scale);
    }
    // cross-section A–B with an elevation profile
    const A = [W * 0.36, H * 0.52], B = [W * 0.9, H * 0.42];
    o.globalAlpha = 0.55; o.strokeStyle = PAL[19]; o.setLineDash([4 * scale, 4 * scale]);
    o.beginPath(); o.moveTo(A[0], A[1]); o.lineTo(B[0], B[1]); o.stroke(); o.setLineDash([]);
    o.globalAlpha = 0.8; o.fillStyle = PAL[20]; o.textAlign = 'center';
    o.fillText('A', A[0] - 10 * scale, A[1]); o.fillText('B', B[0] + 10 * scale, B[1]);
    const px0 = W * 0.6, py0 = H * 0.93, pw = W * 0.34, ph = H * 0.12;
    const hs = [];
    for (let i = 0; i <= 140; i++) { const u = i / 140; hs.push(this.sample(lerp(A[0], B[0], u) - ox, lerp(A[1], B[1], u) - oy)[0]); }
    const hmin = -100, hmax = 3100;
    o.globalAlpha = 0.25; o.strokeStyle = PAL[14]; o.lineWidth = 0.8 * scale;
    o.beginPath(); o.moveTo(px0, py0); o.lineTo(px0 + pw, py0); o.moveTo(px0, py0); o.lineTo(px0, py0 - ph); o.stroke();
    o.beginPath();
    hs.forEach((h, i) => { const x = px0 + i / 140 * pw, y = py0 - (h - hmin) / (hmax - hmin) * ph; i ? o.lineTo(x, y) : o.moveTo(x, y); });
    o.globalAlpha = 0.8; o.strokeStyle = PAL[20]; o.lineWidth = 1.1 * scale; o.stroke();
    o.lineTo(px0 + pw, py0); o.lineTo(px0, py0); o.closePath();
    o.globalAlpha = 0.08; o.fillStyle = PAL[20]; o.fill();
    o.globalAlpha = 0.55; o.fillStyle = PAL[17]; o.textAlign = 'left';
    o.fillText('PROFILE A–B   h(s)', px0, py0 - ph - 12 * scale);
    o.textAlign = 'right'; o.globalAlpha = 0.4;
    o.fillText('3000 m', px0 - 6 * scale, py0 - ph); o.fillText('0', px0 - 6 * scale, py0);
    // north arrow + scale bar
    const nx = W * 0.93, ny = H * 0.62;
    o.globalAlpha = 0.55; o.strokeStyle = PAL[17]; o.fillStyle = PAL[17]; o.textAlign = 'center';
    o.beginPath(); o.moveTo(nx, ny + 18 * scale); o.lineTo(nx, ny - 18 * scale); o.lineTo(nx - 5 * scale, ny - 10 * scale);
    o.moveTo(nx, ny - 18 * scale); o.lineTo(nx + 5 * scale, ny - 10 * scale); o.stroke();
    o.fillText('N', nx, ny - 30 * scale);
    const bx = W * 0.8, by = H * 0.7, bw = 160 * scale;
    o.beginPath(); o.moveTo(bx, by); o.lineTo(bx + bw, by);
    for (let k = 0; k <= 4; k++) { o.moveTo(bx + bw * k / 4, by - 4 * scale); o.lineTo(bx + bw * k / 4, by + 4 * scale); }
    o.stroke();
    o.fillText('0', bx, by + 14 * scale); o.fillText('2 km', bx + bw, by + 14 * scale);
  },
  hud() { return ['grid 9 px · marching squares · 4 octaves']; }
};
