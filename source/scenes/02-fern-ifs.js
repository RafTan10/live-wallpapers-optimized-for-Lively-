// Botany — the Barnsley fern: four affine maps chosen at random (chaos game).
// One coefficient slowly oscillates so the fern sways as if in a breeze.
const SCENE = {
  focus: [0.64, 0.55],
  anchors: [[0.30, 0.08], [0.50, 0.05], [0.14, 0.62], [0.14, 0.78], [0.36, 0.13], [0.14, 0.92]],
  title: 'BARNSLEY FERN · ITERATED FUNCTION SYSTEM',
  sub: '4 affine maps · chaos game',
  eqs: [
    { e: 'xₙ₊₁ = Aᵢ xₙ + bᵢ', n: 'iterated function system' },
    { e: 'f₂(x, y) = (0.85x + 0.04y,  −0.04x + 0.85y + 1.6)', n: 'successively smaller leaflets' },
    { e: 'f₁(x, y) = (0,  0.16y)', n: 'the stem' },
    { e: 'p = (0.01, 0.85, 0.07, 0.07)', n: 'probability of each map' },
    { e: 'f₃(x, y) = (0.20x − 0.26y,  0.23x + 0.22y + 1.6)', n: 'largest left leaflet' },
    { e: 'f₄(x, y) = (−0.15x + 0.28y,  0.26x + 0.24y + 0.44)', n: 'largest right leaflet' }
  ],
  init() {
    this.fh = Math.round(H * 0.9);
    this.fw = Math.round(this.fh * 0.5);
    this.buf = new Float32Array(this.fw * this.fh);
    this.cv = document.createElement('canvas'); this.cv.width = this.fw; this.cv.height = this.fh;
    this.cx2 = this.cv.getContext('2d');
    this.img = this.cx2.createImageData(this.fw, this.fh);
    this.x = 0; this.y = 0; this.b2 = 0.04; this.c2 = -0.04;
    this.spores = [];
    for (let i = 0; i < 40; i++) this.spores.push(this.newSpore(true));
    this.col = RGB[21];
  },
  newSpore(any) {
    return { x: rand(0.2, 0.8), y: any ? rand(0, 1) : rand(0.6, 1), v: rand(0.006, 0.02), g: pick(), a: rand(0.2, 0.6) };
  },
  update(dt, t) {
    this.b2 = 0.04 + 0.016 * Math.sin(t * 0.45);
    this.c2 = -0.04 + 0.009 * Math.sin(t * 0.31 + 1.3);
    const buf = this.buf, fw = this.fw, fh = this.fh;
    for (let i = 0; i < buf.length; i++) buf[i] *= 0.9;
    let x = this.x, y = this.y;
    const n = Math.round(26000 * SETTINGS.density);
    const sx = fw / 5.2, sy = fh / 10.3;
    for (let i = 0; i < n; i++) {
      const r = Math.random(); let nx, ny;
      if (r < 0.01)      { nx = 0; ny = 0.16 * y; }
      else if (r < 0.86) { nx = 0.85 * x + this.b2 * y; ny = this.c2 * x + 0.85 * y + 1.6; }
      else if (r < 0.93) { nx = 0.2 * x - 0.26 * y; ny = 0.23 * x + 0.22 * y + 1.6; }
      else               { nx = -0.15 * x + 0.28 * y; ny = 0.26 * x + 0.24 * y + 0.44; }
      x = nx; y = ny;
      const px = ((x + 2.4) * sx) | 0, py = (fh - 2 - y * sy) | 0;
      if (px >= 0 && px < fw && py >= 0 && py < fh) buf[py * fw + px] += 1;
    }
    this.x = x; this.y = y;
    const d = this.img.data, c = this.col;
    for (let i = 0, j = 0; i < buf.length; i++, j += 4) {
      const v = buf[i];
      d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2];
      d[j + 3] = v > 0.02 ? 255 * (1 - Math.exp(-v * 0.7)) : 0;
    }
    this.cx2.putImageData(this.img, 0, 0);
    for (const s of this.spores) {
      s.y -= s.v * dt; s.x += Math.sin(t * 0.5 + s.y * 6) * 0.004 * dt;
      if (s.y < -0.05) Object.assign(s, this.newSpore(false));
    }
  },
  draw(t, ox, oy) {
    const fx = this.focus[0] * W + ox - this.fw / 2, fy = H * 0.06 + oy;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.95;
    ctx.drawImage(this.cv, fx, fy);
    // two more ferns further back (same wind), one mirrored
    for (const [px, k, al, flip] of [[0.42, 0.52, 0.3, true], [0.865, 0.38, 0.2, false]]) {
      const w = this.fw * k, h = this.fh * k, x = px * W + ox * 0.6 - w / 2, y = fy + this.fh - h;
      ctx.save(); ctx.globalAlpha = al;
      if (flip) { ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(this.cv, 0, 0, w, h); }
      else ctx.drawImage(this.cv, x, y, w, h);
      ctx.restore();
    }
    // magnifier: one leaflet enlarged — it is a small copy of the whole fern
    const sx = this.fw / 5.2, sy = this.fh / 10.3;
    const wx0 = 0.55, wy0 = 2.5, ws = 1.2;                       // world window
    const bx = (wx0 + 2.4) * sx, by = this.fh - 2 - (wy0 + ws) * sy, bw = ws * sx, bh = ws * sy;
    const mcx = W * 0.27, mcy = H * 0.34, mr = H * 0.13;
    ctx.save();
    ctx.beginPath(); ctx.arc(mcx, mcy, mr, 0, TAU); ctx.clip();
    ctx.globalAlpha = 0.95;
    ctx.drawImage(this.cv, bx, by, bw, bh, mcx - mr, mcy - mr, mr * 2, mr * 2);
    ctx.restore();
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[17]; ctx.lineWidth = 1 * scale;
    ctx.beginPath(); ctx.arc(mcx, mcy, mr, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.3;
    ctx.strokeRect(fx + bx, fy + by, bw, bh);
    ctx.setLineDash([2 * scale, 5 * scale]);
    ctx.beginPath(); ctx.moveTo(fx + bx, fy + by); ctx.lineTo(mcx + mr * 0.2, mcy - mr * 0.98);
    ctx.moveTo(fx + bx, fy + by + bh); ctx.lineTo(mcx + mr * 0.2, mcy + mr * 0.98); ctx.stroke();
    ctx.setLineDash([]);
    this.mag = { mcx, mcy, mr, k: (mr * 2) / bw };
    // ground line
    ctx.globalAlpha = 0.25; ctx.strokeStyle = PAL[14]; ctx.lineWidth = 0.8 * scale;
    ctx.beginPath(); ctx.moveTo(fx - this.fw * 0.6, fy + this.fh - 1); ctx.lineTo(fx + this.fw * 1.6, fy + this.fh - 1); ctx.stroke();
    ctx.font = MONO(11); ctx.textAlign = 'center';
    for (const s of this.spores) {
      ctx.globalAlpha = s.a * clamp(s.y * 4, 0, 1);
      ctx.fillStyle = PAL[17];
      ctx.fillText(s.g, fx + s.x * this.fw, fy + s.y * this.fh);
    }
  },
  drawOver(t, ox, oy) {
    if (!SETTINGS.math) return;
    if (this.mag) {
      octx.font = MONO(10.5); octx.textAlign = 'center'; octx.textBaseline = 'top';
      octx.globalAlpha = 0.7; octx.fillStyle = PAL[18];
      octx.fillText(`×${this.mag.k.toFixed(1)}  ·  self-similar: each leaflet ≈ the whole fern`, this.mag.mcx, this.mag.mcy + this.mag.mr + 10 * scale);
    }
    const o = octx, fx = this.focus[0] * W + ox - this.fw / 2, fy = H * 0.06 + oy;
    // Bounding box with dimension ticks, like a specimen plate
    o.strokeStyle = PAL[13]; o.fillStyle = PAL[15]; o.lineWidth = 0.8 * scale;
    o.globalAlpha = 0.3; o.setLineDash([2 * scale, 6 * scale]);
    o.strokeRect(fx - 10 * scale, fy - 6 * scale, this.fw + 20 * scale, this.fh + 6 * scale);
    o.setLineDash([]);
    o.globalAlpha = 0.55; o.font = MONO(10); o.textBaseline = 'middle';
    o.textAlign = 'left';
    for (let k = 0; k <= 10; k += 2) {
      const y = fy + this.fh - 2 - k * (this.fh / 10.3);
      o.beginPath(); o.moveTo(fx + this.fw + 10 * scale, y); o.lineTo(fx + this.fw + 16 * scale, y); o.stroke();
      o.fillText('y=' + k, fx + this.fw + 20 * scale, y);
    }
    o.globalAlpha = 0.6;
    o.fillText(`b₂ = ${this.b2.toFixed(3)}   c₂ = ${this.c2.toFixed(3)}   (wind)`, fx - 10 * scale, fy + this.fh + 22 * scale);
  },
  hud(t) { return [`points per frame ${Math.round(26000 * SETTINGS.density).toLocaleString('en-US')}`]; }
};
