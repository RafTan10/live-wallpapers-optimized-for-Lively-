// Acoustics — a Chladni plate. Sand on a vibrating square plate is shaken off the moving parts and
// collects along the nodal lines, where the plate stays still. The mode (n, m) changes every few seconds.
const SCENE = {
  focus: [0.62, 0.5],
  anchors: [[0.16, 0.78], [0.16, 0.86], [0.16, 0.94], [0.44, 0.04], [0.26, 0.04], [0.16, 0.06]],
  title: 'CHLADNI FIGURES · VIBRATING PLATE',
  sub: 'sand gathers on the nodal lines u = 0',
  eqs: [
    { e: 'u = cos(nπx) cos(mπy) − cos(mπx) cos(nπy)', n: 'a standing-wave mode of a square plate' },
    { e: 'u(x, y) = 0', n: 'nodal lines — where the plate does not move' },
    { e: '∇⁴w = −(ρh / D) ∂²w/∂t²', n: 'Kirchhoff–Love plate equation' },
    { e: 'f ∝ (n² + m²)', n: 'higher modes ring at higher pitch (simplified)' },
    { e: 'D = E h³ / (12 (1 − ν²))', n: 'flexural rigidity of the plate' },
    { e: 'Δx ∝ |u(x, y)| ξ', n: 'sand is kicked in proportion to the local vibration' }
  ],
  init() {
    this.modes = [[1, 2], [2, 3], [1, 4], [3, 4], [2, 5], [1, 6], [3, 5], [4, 5], [2, 7], [3, 7]];
    this.k = 0; this.age = 0;
    const n = Math.round(9000 * SETTINGS.density);
    this.px = new Float32Array(n); this.py = new Float32Array(n);
    for (let i = 0; i < n; i++) { this.px[i] = Math.random(); this.py[i] = Math.random(); }
    this.S = Math.min(W * 0.5, H * 0.78);
    this.hist = [];
  },
  u(x, y, n, m) {
    const P = Math.PI;
    return Math.cos(n * P * x) * Math.cos(m * P * y) - Math.cos(m * P * x) * Math.cos(n * P * y);
  },
  mask(n, m) {
    const key = n + ',' + m;
    this.cache = this.cache || {};
    if (this.cache[key]) return this.cache[key];
    const g = 120, c = document.createElement('canvas'); c.width = c.height = g;
    const x = c.getContext('2d'); x.fillStyle = PAL[20];
    for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) {
      const a = this.u(i / g, j / g, n, m), b = this.u((i + 1) / g, j / g, n, m), d = this.u(i / g, (j + 1) / g, n, m);
      if ((a > 0) !== (b > 0) || (a > 0) !== (d > 0)) x.fillRect(i, j, 1, 1);
    }
    return (this.cache[key] = c);
  },
  update(dt) {
    this.age += dt;
    if (this.age > SETTINGS.modeSeconds) { this.age = 0; this.k = (this.k + 1) % this.modes.length; }
    const [n, m] = this.modes[this.k];
    const kick = 0.06 * Math.min(1, this.age / 0.5 + 0.3);
    const px = this.px, py = this.py;
    for (let i = 0; i < px.length; i++) {
      const a = Math.abs(this.u(px[i], py[i], n, m)) * kick;
      px[i] += (Math.random() - 0.5) * a; py[i] += (Math.random() - 0.5) * a;
      if (px[i] < 0) px[i] = -px[i]; if (px[i] > 1) px[i] = 2 - px[i];
      if (py[i] < 0) py[i] = -py[i]; if (py[i] > 1) py[i] = 2 - py[i];
    }
  },
  draw(t, ox, oy) {
    const S = this.S, x0 = this.focus[0] * W - S / 2 + ox, y0 = this.focus[1] * H - S / 2 + oy;
    const [n, m] = this.modes[this.k];
    ctx.globalCompositeOperation = 'lighter';
    // plate outline + clamp at the centre
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[18]; ctx.lineWidth = 1.2 * scale;
    ctx.strokeRect(x0, y0, S, S);
    ctx.globalAlpha = 0.2; ctx.strokeRect(x0 - 8 * scale, y0 - 8 * scale, S + 16 * scale, S + 16 * scale);
    ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(x0 + S / 2, y0 + S / 2, 5 * scale, 0, TAU); ctx.stroke();
    // faint ideal nodal lines (cached per mode)
    ctx.globalAlpha = 0.2;
    ctx.drawImage(this.mask(n, m), x0, y0, S, S);
    // sand
    ctx.globalAlpha = 0.55; ctx.fillStyle = PAL[22];
    const sz = 1.3 * scale;
    for (let i = 0; i < this.px.length; i++) ctx.fillRect(x0 + this.px[i] * S, y0 + this.py[i] * S, sz, sz);
    // mode-shape thumbnails for the whole cycle on the left (masks are cached)
    const tx = W * 0.2, ty = H * 0.16, ts = H * 0.075, gap = H * 0.085;
    this.modes.forEach(([a, b], k) => {
      const col = k % 2, row = k >> 1;
      const X = tx + col * (ts + gap * 0.4), Y = ty + row * (ts + gap * 0.35);
      const on = k === this.k;
      ctx.globalAlpha = on ? 0.7 : 0.25; ctx.strokeStyle = PAL[on ? 22 : 15]; ctx.lineWidth = 0.8 * scale;
      ctx.strokeRect(X, Y, ts, ts);
      ctx.globalAlpha = on ? 0.9 : 0.35;
      ctx.drawImage(this.mask(a, b), X, Y, ts, ts);
    });
    this.thumb = [tx, ty, ts, gap];
    // waveform of the driving tone
    const wx = x0, wy = y0 + S + 46 * scale, ww = S, wh = 14 * scale, f = n * n + m * m;
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[19]; ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    for (let i = 0; i <= 300; i++) { const x = wx + i / 300 * ww, y = wy - Math.sin(i / 300 * TAU * f * 0.35 - t * 6) * wh; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    this.geo = [x0, y0, S, wx, wy, f];
  },
  drawOver() {
    if (!SETTINGS.math || !this.geo) return;
    const o = octx, [x0, y0, S, wx, wy, f] = this.geo, [n, m] = this.modes[this.k];
    const [tx, ty] = this.thumb;
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'left'; o.fillStyle = PAL[17];
    o.globalAlpha = 0.7; o.fillText(`mode (n, m) = (${n}, ${m})   f ∝ n² + m² = ${f}`, x0, y0 - 18 * scale);
    o.globalAlpha = 0.45;
    o.fillText(`next mode in ${(SETTINGS.modeSeconds - this.age).toFixed(1)} s`, x0 + S - 150 * scale, y0 - 18 * scale);
    o.fillText('driving tone', wx, wy + 26 * scale);
    o.globalAlpha = 0.55; o.fillText('MODES IN THIS CYCLE', tx, ty - 14 * scale);
  },
  hud() { return [`${this.px.length.toLocaleString('en-US')} grains of sand`]; }
};
