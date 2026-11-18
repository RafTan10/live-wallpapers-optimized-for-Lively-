// Engineering — a gear train. Each gear's speed follows from the tooth counts (ω₁N₁ = ω₂N₂),
// teeth stay correctly meshed, and pitch circles, centre lines and rpm readouts are drawn like a drawing sheet.
const SCENE = {
  focus: [0.62, 0.5],
  anchors: [[0.26, 0.08], [0.48, 0.05], [0.22, 0.9], [0.62, 0.96], [0.42, 0.95], [0.22, 0.74]],
  title: 'GEAR TRAIN · SPUR GEARS',
  sub: 'module m = const · pressure angle 20°',
  eqs: [
    { e: 'ω₁ N₁ = ω₂ N₂', n: 'meshing gears share the same pitch-line speed' },
    { e: 'd = m N', n: 'pitch diameter from module and tooth count' },
    { e: 'i = N_out / N_in', n: 'gear ratio' },
    { e: 'x = r_b (cos t + t sin t),  y = r_b (sin t − t cos t)', n: 'involute curve — the ideal tooth flank' },
    { e: 'τ_out = τ_in · i  (losses aside)', n: 'torque is multiplied as speed drops' },
    { e: 'r_b = r cos 20°', n: 'base circle of the involute' }
  ],
  init() {
    this.m = Math.min(W, H) * 0.0105;
    // chain: tooth counts and the direction (angle) from the previous gear
    const spec = [[36, 0], [14, -0.24], [48, 0.721], [20, 2.303], [28, -3.054], [12, -2.459]];
    this.g = [];
    let x = W * 0.48, y = H * 0.44;
    spec.forEach(([N, ang], i) => {
      const r = this.m * N / 2;
      if (i > 0) { const p = this.g[i - 1]; const d = p.r + r; x = p.x + Math.cos(ang) * d; y = p.y + Math.sin(ang) * d; }
      this.g.push({ N, r, x, y, ang, parent: i - 1 });
    });
    // keep the train inside the screen: shift so its bounding box is centred on the focus
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (const q of this.g) { minx = Math.min(minx, q.x - q.r); maxx = Math.max(maxx, q.x + q.r); miny = Math.min(miny, q.y - q.r); maxy = Math.max(maxy, q.y + q.r); }
    const dx = this.focus[0] * W - (minx + maxx) / 2, dy = this.focus[1] * H - (miny + maxy) / 2;
    for (const q of this.g) { q.x += dx; q.y += dy; }
  },
  update() {},
  angles(t) {
    const th = [t * SETTINGS.speed * 0.25];
    for (let i = 1; i < this.g.length; i++) {
      const p = this.g[i - 1], q = this.g[i], a = q.ang;
      th.push(a + Math.PI - Math.PI / q.N - (p.N / q.N) * (th[i - 1] - a));
    }
    return th;
  },
  gearPath(q, th, cx, cy) {
    const N = q.N, r = q.r, ra = r + this.m, rr = r - 1.25 * this.m, pa = TAU / N;
    ctx.beginPath();
    for (let k = 0; k < N; k++) {
      const c = th + k * pa;
      const pts = [[rr, c - pa * 0.5], [rr, c - pa * 0.28], [r, c - pa * 0.25], [ra, c - pa * 0.14], [ra, c + pa * 0.14], [r, c + pa * 0.25], [rr, c + pa * 0.28]];
      pts.forEach(([R, a], i) => { const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R; (k === 0 && i === 0) ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    }
    ctx.closePath();
  },
  draw(t, ox, oy) {
    const th = this.angles(t);
    ctx.globalCompositeOperation = 'lighter';
    // centre lines between meshing gears
    ctx.lineWidth = 0.8 * scale; ctx.setLineDash([10 * scale, 4 * scale, 2 * scale, 4 * scale]);
    for (let i = 1; i < this.g.length; i++) {
      const p = this.g[i - 1], q = this.g[i];
      ctx.globalAlpha = 0.22; ctx.strokeStyle = PAL[15];
      ctx.beginPath(); ctx.moveTo(p.x + ox, p.y + oy); ctx.lineTo(q.x + ox, q.y + oy); ctx.stroke();
    }
    ctx.setLineDash([]);
    this.g.forEach((q, i) => {
      const cx = q.x + ox, cy = q.y + oy, a = th[i];
      // body
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.92; ctx.fillStyle = `hsl(${theme.hue},${Math.min(theme.sat, 10)}%,6%)`;
      this.gearPath(q, a, cx, cy); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.7; ctx.strokeStyle = PAL[19]; ctx.lineWidth = 1.1 * scale;
      this.gearPath(q, a, cx, cy); ctx.stroke();
      // pitch circle (dash-dot), hub, spokes or holes
      ctx.globalAlpha = 0.28; ctx.strokeStyle = PAL[16]; ctx.lineWidth = 0.8 * scale;
      ctx.setLineDash([8 * scale, 3 * scale, 2 * scale, 3 * scale]);
      ctx.beginPath(); ctx.arc(cx, cy, q.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      const hub = Math.max(5 * scale, q.r * 0.16);
      ctx.globalAlpha = 0.6; ctx.strokeStyle = PAL[18];
      ctx.beginPath(); ctx.arc(cx, cy, hub, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, hub * 0.45, 0, TAU); ctx.stroke();
      if (q.N >= 24) {
        const nh = q.N >= 40 ? 6 : 5, rh = (q.r - 1.25 * this.m) * 0.62, hs = q.r * 0.17;
        for (let k = 0; k < nh; k++) {
          const ha = a + k * TAU / nh + 0.3;
          ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(cx + Math.cos(ha) * rh, cy + Math.sin(ha) * rh, hs, 0, TAU); ctx.stroke();
        }
        ctx.globalAlpha = 0.2;
        ctx.beginPath(); ctx.arc(cx, cy, q.r - 1.25 * this.m - 4 * scale, 0, TAU); ctx.stroke();
      } else {
        for (let k = 0; k < 4; k++) {
          const ha = a + k * TAU / 4;
          ctx.globalAlpha = 0.35;
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(ha) * hub, cy + Math.sin(ha) * hub); ctx.lineTo(cx + Math.cos(ha) * (q.r - 1.4 * this.m), cy + Math.sin(ha) * (q.r - 1.4 * this.m)); ctx.stroke();
        }
      }
      // centre cross
      ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[15];
      ctx.beginPath(); ctx.moveTo(cx - hub * 1.6, cy); ctx.lineTo(cx + hub * 1.6, cy); ctx.moveTo(cx, cy - hub * 1.6); ctx.lineTo(cx, cy + hub * 1.6); ctx.stroke();
      // a marked tooth so the rotation is easy to follow
      ctx.globalAlpha = 0.9; ctx.fillStyle = PAL[23];
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (q.r + this.m * 0.4), cy + Math.sin(a) * (q.r + this.m * 0.4), 2 * scale, 0, TAU); ctx.fill();
    });
    // involute construction on the first gear: base circle + one involute curve
    const q = this.g[0], rb = q.r * Math.cos(20 * Math.PI / 180), cx = q.x + ox, cy = q.y + oy, a0 = th[0] + 0.9;
    ctx.globalAlpha = 0.22; ctx.strokeStyle = PAL[21]; ctx.setLineDash([2 * scale, 4 * scale]);
    ctx.beginPath(); ctx.arc(cx, cy, rb, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = 0.6; ctx.beginPath();
    for (let k = 0; k <= 40; k++) {
      const s = k / 40 * 0.9, x = rb * (Math.cos(s) + s * Math.sin(s)), y = rb * (Math.sin(s) - s * Math.cos(s));
      const X = cx + x * Math.cos(a0) - y * Math.sin(a0), Y = cy + x * Math.sin(a0) + y * Math.cos(a0);
      k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke();
    this.th = th;
  },
  drawOver(t, ox, oy) {
    if (!SETTINGS.math) return;
    const o = octx, rpm0 = SETTINGS.speed * 0.25 * 60 / TAU;
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'center';
    this.g.forEach((q, i) => {
      const rpm = rpm0 * this.g[0].N / q.N, dir = i % 2 === 0 ? '↻' : '↺';
      o.globalAlpha = 0.75; o.fillStyle = PAL[19];
      o.fillText(`N = ${q.N}`, q.x + ox, q.y + oy + q.r + this.m * 2.6);
      o.globalAlpha = 0.5;
      o.fillText(`${rpm.toFixed(2)} rpm ${dir}`, q.x + ox, q.y + oy + q.r + this.m * 2.6 + 15 * scale);
    });
    // ratio table
    const x = W * 0.22, y = H * 0.3;
    o.textAlign = 'left'; o.globalAlpha = 0.65; o.fillStyle = PAL[17];
    o.fillText('STAGE   N_in → N_out   ratio', x, y);
    for (let i = 1; i < this.g.length; i++) {
      o.globalAlpha = 0.45;
      o.fillText(`  ${i}      ${String(this.g[i - 1].N).padStart(2)} → ${String(this.g[i].N).padStart(2)}       ${(this.g[i].N / this.g[i - 1].N).toFixed(3)}`, x, y + i * 16 * scale);
    }
    o.globalAlpha = 0.6;
    o.fillText(`overall  ${this.g[0].N} → ${this.g[this.g.length - 1].N}   i = ${(this.g[this.g.length - 1].N / this.g[0].N).toFixed(3)}`, x, y + this.g.length * 16 * scale + 6 * scale);
  },
  hud() { return [`driver ${(SETTINGS.speed * 0.25 * 60 / TAU).toFixed(2)} rpm · ${this.g.length} gears`]; }
};
