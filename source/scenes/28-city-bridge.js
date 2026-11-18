// Cityscape — a city skyline at night across a river, crossed by a suspension bridge. The main cable hangs
// in a parabola, traffic streams over the deck, and windows and lights shimmer in the water.
const SCENE = {
  focus: [0.62, 0.42],
  ambient: false,
  anchors: [[0.24, 0.08], [0.46, 0.05], [0.22, 0.18], [0.62, 0.1], [0.4, 0.14], [0.22, 0.28]],
  title: 'SUSPENSION BRIDGE · CITY AT NIGHT',
  sub: 'main cable: parabola under a uniform deck load',
  eqs: [
    { e: 'y = 4 h x² / L²', n: 'cable shape for a uniformly loaded deck' },
    { e: 'T_H = w L² / (8 h)', n: 'horizontal cable tension' },
    { e: 'T_max = T_H √(1 + (4h / L)²)', n: 'peak tension, at the towers' },
    { e: 'y = a cosh(x / a)', n: 'catenary — a cable carrying only its own weight' },
    { e: 'h / L ≈ 1 / 9', n: 'typical sag-to-span ratio' },
    { e: 'f = (1 / 2L) √(T / μ)', n: 'fundamental frequency of a taut cable' }
  ],
  init() {
    this.water = H * 0.7;
    this.deck = H * 0.63;
    this.tA = W * 0.4; this.tB = W * 0.86;
    this.towerTop = H * 0.3;
    this.stars = [];
    for (let i = 0; i < 160; i++) this.stars.push([Math.random(), Math.random() * 0.45, rand(0.06, 0.35)]);
    this.blds = [];
    for (const layer of [0, 1]) {
      let x = -10;
      while (x < W + 10) {
        const w = rand(0.025, 0.06) * W * (layer ? 1 : 0.8), h = (layer ? rand(0.1, 0.3) : rand(0.08, 0.2)) * H * (0.7 + 0.6 * Math.exp(-((x / W - 0.62) ** 2) / 0.05));
        this.blds.push({ x, w, h, layer, spire: Math.random() < 0.15, wins: Array.from({ length: 80 }, () => Math.random() < 0.35), seed: Math.random() * 100 });
        x += w + rand(2, 10) * scale;
      }
    }
    this.cars = [];
    for (let i = 0; i < 40; i++) this.cars.push({ u: Math.random(), dir: i % 2 ? 1 : -1, v: rand(0.03, 0.05) });
  },
  update(dt) { for (const c of this.cars) { c.u += c.dir * c.v * dt; if (c.u > 1.05) c.u = -0.05; if (c.u < -0.05) c.u = 1.05; } },
  draw(t, ox, oy) {
    const wl = this.water + oy * 0.5;
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.stars) { ctx.globalAlpha = s[2]; ctx.fillStyle = PAL[19]; ctx.fillRect(s[0] * W, s[1] * H, 1.3 * scale, 1.3 * scale); }
    const mx = W * 0.27, my = H * 0.17, mr = H * 0.04;
    ctx.globalAlpha = 0.8; ctx.fillStyle = shade(0.8, 0.3); ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
    // skyline: far layer then near layer, windows lit
    for (const layer of [0, 1]) {
      for (const b of this.blds) {
        if (b.layer !== layer) continue;
        const x = b.x + ox * (0.2 + layer * 0.3), top = wl - b.h - (layer ? 0 : H * 0.03);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = DARK(layer ? 4 : 8);
        ctx.fillRect(x, top, b.w, wl - top);
        if (b.spire) { ctx.beginPath(); ctx.moveTo(x + b.w * 0.3, top); ctx.lineTo(x + b.w / 2, top - b.h * 0.25); ctx.lineTo(x + b.w * 0.7, top); ctx.fill(); }
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = layer ? 0.4 : 0.2; ctx.strokeStyle = PAL[layer ? 16 : 13]; ctx.lineWidth = 0.8 * scale;
        ctx.beginPath(); ctx.moveTo(x, wl); ctx.lineTo(x, top); ctx.lineTo(x + b.w, top); ctx.lineTo(x + b.w, wl); ctx.stroke();
        if (b.spire) { ctx.beginPath(); ctx.moveTo(x + b.w * 0.3, top); ctx.lineTo(x + b.w / 2, top - b.h * 0.25); ctx.lineTo(x + b.w * 0.7, top); ctx.stroke(); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 1.2 + b.seed); ctx.fillStyle = PAL[22]; ctx.fillRect(x + b.w / 2 - scale, top - b.h * 0.25 - 3 * scale, 2 * scale, 2 * scale); }
        const cols = Math.max(2, Math.floor(b.w / (7 * scale))), rows = Math.min(16, Math.floor(b.h / (9 * scale)));
        ctx.fillStyle = PAL[layer ? 21 : 18];
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const idx = (r * cols + c + Math.floor(t / 7 + b.seed)) % 80;
          if (!b.wins[idx]) continue;
          ctx.globalAlpha = layer ? 0.55 : 0.3;
          const wx = x + (c + 0.5) * b.w / cols, wy = top + 6 * scale + r * 9 * scale;
          ctx.fillRect(wx - 1.2 * scale, wy, 2.4 * scale, 3 * scale);
          // reflection streak
          ctx.globalAlpha *= 0.35;
          ctx.fillRect(wx - 1.2 * scale + Math.sin(t * 1.5 + wy) * 2 * scale, wl + (wl - wy) * 0.9, 2.4 * scale, 4 * scale);
        }
      }
    }
    // water surface
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.5; ctx.fillStyle = DARK(2); ctx.fillRect(0, wl, W, H - wl);
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 30; k++) {
      const y = wl + Math.pow(k / 30, 1.3) * (H - wl);
      ctx.globalAlpha = 0.04 + 0.08 * k / 30; ctx.strokeStyle = PAL[15]; ctx.lineWidth = 0.7 * scale;
      ctx.beginPath(); for (let x = 0; x <= W; x += 14 * scale) { const yy = y + Math.sin(x * 0.01 / scale + t * 0.7 + k) * (0.5 + k * 0.06) * scale; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke();
    }
    // bridge: towers, deck, main cable (parabola), side spans, suspenders
    const A = this.tA + ox, B = this.tB + ox, deck = this.deck + oy * 0.5, tt = this.towerTop + oy * 0.5, L = B - A, sag = H * 0.24;
    const cab = x => { const xm = x - (A + L / 2); return tt + H * 0.02 + sag * (1 - 4 * (xm * xm) / (L * L)); };
    for (const dir of [1, -1]) {
      const yRef = y => dir > 0 ? y : wl + (wl - y) * 0.85 + Math.sin(t + y * 0.05) * 2 * scale;
      const al = dir > 0 ? 1 : 0.18;
      ctx.lineWidth = 1 * scale;
      // towers
      for (const x of [A, B]) {
        ctx.globalAlpha = 0.7 * al; ctx.strokeStyle = PAL[20];
        ctx.beginPath();
        for (const dx of [-7, 7]) { ctx.moveTo(x + dx * scale, yRef(wl)); ctx.lineTo(x + dx * 0.7 * scale, yRef(tt)); }
        for (const yy of [tt + H * 0.02, deck - H * 0.06, deck + H * 0.02]) { ctx.moveTo(x - 7 * scale, yRef(yy)); ctx.lineTo(x + 7 * scale, yRef(yy)); }
        ctx.stroke();
        if (dir > 0) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 0.9 + x); ctx.fillStyle = PAL[23]; ctx.fillRect(x - 1.5 * scale, tt - 5 * scale, 3 * scale, 3 * scale); }
      }
      // deck
      ctx.globalAlpha = 0.65 * al; ctx.strokeStyle = PAL[19]; ctx.lineWidth = 1.4 * scale;
      ctx.beginPath(); ctx.moveTo(0, yRef(deck + H * 0.04)); ctx.quadraticCurveTo(W * 0.2, yRef(deck), A, yRef(deck)); ctx.lineTo(B, yRef(deck)); ctx.lineTo(W, yRef(deck + H * 0.01)); ctx.stroke();
      ctx.lineWidth = 0.8 * scale; ctx.globalAlpha = 0.35 * al;
      ctx.beginPath(); ctx.moveTo(0, yRef(deck + H * 0.048)); ctx.quadraticCurveTo(W * 0.2, yRef(deck + H * 0.008), A, yRef(deck + H * 0.008)); ctx.lineTo(W, yRef(deck + H * 0.018)); ctx.stroke();
      // main cable and side spans
      ctx.globalAlpha = 0.75 * al; ctx.strokeStyle = PAL[21]; ctx.lineWidth = 1.3 * scale;
      ctx.beginPath();
      for (let x = A; x <= B; x += 6 * scale) x === A ? ctx.moveTo(x, yRef(cab(x))) : ctx.lineTo(x, yRef(cab(x)));
      ctx.lineTo(B, yRef(cab(B)));
      ctx.moveTo(A, yRef(tt + H * 0.02)); ctx.quadraticCurveTo(A - W * 0.12, yRef(deck - H * 0.12), A - W * 0.25, yRef(deck));
      ctx.moveTo(B, yRef(tt + H * 0.02)); ctx.quadraticCurveTo(B + W * 0.07, yRef(deck - H * 0.1), W + 20 * scale, yRef(deck - H * 0.02));
      ctx.stroke();
      // suspenders
      ctx.globalAlpha = 0.28 * al; ctx.strokeStyle = PAL[18]; ctx.lineWidth = 0.7 * scale;
      ctx.beginPath();
      for (let x = A + 12 * scale; x < B; x += 12 * scale) { ctx.moveTo(x, yRef(cab(x))); ctx.lineTo(x, yRef(deck)); }
      ctx.stroke();
      // deck lamps
      ctx.fillStyle = PAL[22];
      for (let x = A + 24 * scale; x < B; x += 48 * scale) { ctx.globalAlpha = 0.7 * al; ctx.fillRect(x - 1.2 * scale, yRef(deck - 4 * scale), 2.4 * scale, 2.4 * scale); }
    }
    // traffic: headlights one way, tail lights the other
    for (const c of this.cars) {
      const x = lerp(-W * 0.05, W * 1.05, c.u) + ox, y = (x < A ? deck + (H * 0.04) * Math.pow(Math.max(0, (A - x) / A), 2) : deck) - (c.dir > 0 ? 2 : -3) * scale;
      ctx.globalAlpha = c.dir > 0 ? 0.9 : 0.5; ctx.strokeStyle = PAL[c.dir > 0 ? 23 : 17]; ctx.lineWidth = 1.6 * scale;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - c.dir * 10 * scale, y); ctx.stroke();
    }
    this.geo = { A, B, tt, deck, sag, L, cab };
  },
  drawOver(t) {
    if (!SETTINGS.math || !this.geo) return;
    const o = octx, { A, B, tt, sag, L, cab } = this.geo;
    o.lineWidth = 0.8 * scale; o.font = MONO(10.5); o.textBaseline = 'middle';
    // span and sag dimensions
    const y = tt - H * 0.05;
    o.globalAlpha = 0.45; o.strokeStyle = PAL[17];
    o.beginPath(); o.moveTo(A, y); o.lineTo(B, y); o.moveTo(A, y - 5 * scale); o.lineTo(A, y + 5 * scale); o.moveTo(B, y - 5 * scale); o.lineTo(B, y + 5 * scale); o.stroke();
    const mid = (A + B) / 2, y0 = tt + H * 0.02, y1 = cab(mid);
    o.setLineDash([2 * scale, 4 * scale]); o.beginPath(); o.moveTo(A, y0); o.lineTo(B, y0); o.stroke(); o.setLineDash([]);
    o.beginPath(); o.moveTo(mid, y0); o.lineTo(mid, y1); o.moveTo(mid - 5 * scale, y1); o.lineTo(mid + 5 * scale, y1); o.stroke();
    o.globalAlpha = 0.7; o.fillStyle = PAL[18]; o.textAlign = 'center';
    o.fillText('L = 1 000 m', mid, y - 12 * scale);
    o.textAlign = 'left'; o.fillText('h = 110 m', mid + 10 * scale, (y0 + y1) / 2);
    // tension calculation
    const x = W * 0.22, yy = H * 0.42;
    o.globalAlpha = 0.6; o.fillStyle = PAL[17];
    o.fillText('w = 200 kN/m (deck + traffic)', x, yy);
    o.globalAlpha = 0.5;
    const TH = 200e3 * 1000 * 1000 / (8 * 110), Tm = TH * Math.sqrt(1 + (4 * 110 / 1000) ** 2);
    o.fillText(`T_H = wL²/8h ≈ ${(TH / 1e6).toFixed(0)} MN`, x, yy + 16 * scale);
    o.fillText(`T_max ≈ ${(Tm / 1e6).toFixed(0)} MN at the towers`, x, yy + 32 * scale);
  },
  hud() { return [`${this.cars.length} vehicles · ${this.blds.length} buildings`]; }
};
