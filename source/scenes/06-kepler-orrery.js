// Astronomy — an orrery of the inner and outer planets on true Kepler ellipses (real a, e, ϖ),
// plus a comet that sweeps out equal areas in equal times (Kepler's second law).
const SCENE = {
  ambient: false,
  focus: [0.6, 0.52],
  title: "KEPLERIAN ORBITS · SOLAR SYSTEM",
  sub: 'real a, e and perihelion · radii drawn ∝ √a (not to scale)',
  eqs: [
    { e: 'M = E − e sin E', n: "Kepler's equation (solved by Newton's method)" },
    { e: 'r = a(1 − e²) / (1 + e cos ν)', n: 'the orbit is an ellipse with the Sun at a focus' },
    { e: 'dA/dt = L / 2m = const', n: "Kepler's second law — equal areas in equal times" },
    { e: 'T² ∝ a³', n: "Kepler's third law" },
    { e: 'F = G m₁ m₂ / r²', n: "Newton's law of gravitation" },
    { e: 'v² = GM (2/r − 1/a)', n: 'vis-viva equation' }
  ],
  init() {
    // name, a (AU), e, longitude of perihelion (deg)
    this.planets = [
      ['Mercury', 0.387, 0.206, 77], ['Venus', 0.723, 0.007, 131], ['Earth', 1.0, 0.017, 103],
      ['Mars', 1.524, 0.093, 336], ['Jupiter', 5.203, 0.049, 14], ['Saturn', 9.537, 0.054, 93]
    ].map(([n, a, e, w], i) => ({ n, a, e, w: w * Math.PI / 180, M0: rand(0, TAU), T: Math.pow(a, 1.5), g: '•' }));
    this.comet = { n: 'comet', a: 3.4, e: 0.82, w: 2.2, M0: 0, T: Math.pow(3.4, 1.5) };
    this.S = Math.min(W * 0.38, H * 0.9) / Math.sqrt(9.6);
    this.el = Math.sin(0.5);
    this.belt = [];
    for (let i = 0; i < 380; i++) this.belt.push({ a: rand(2.15, 3.3), M: rand(0, TAU), e: rand(0, 0.12), w: rand(0, TAU) });
    this.wedges = 14;
    this.stars = [];
    for (let i = 0; i < 260; i++) this.stars.push([Math.random(), Math.random(), rand(0.05, 0.4), rand(0.8, 1.7)]);
    // moons: [planet index, orbit radius px, period in days]
    this.moons = [[2, 9, 27.3], [4, 9, 1.77], [4, 13, 3.55], [4, 18, 7.15], [4, 25, 16.7], [5, 20, 15.9]];
  },
  update() {},
  solve(M, e) { let E = M; for (let i = 0; i < 6; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; },
  pos(b, M, cx, cy) {
    const E = this.solve(M, b.e);
    const x = b.a * (Math.cos(E) - b.e), y = b.a * Math.sqrt(1 - b.e * b.e) * Math.sin(E);
    const r = Math.hypot(x, y), ang = Math.atan2(y, x) + b.w;
    const rs = this.S * Math.sqrt(r);                    // compress radius ∝ √r
    return [cx + rs * Math.cos(ang), cy + rs * Math.sin(ang) * this.el, r];
  },
  orbitPath(b, cx, cy) {
    ctx.beginPath();
    for (let s = 0; s <= 160; s++) { const p = this.pos(b, s / 160 * TAU, cx, cy); s ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
  },
  draw(t, ox, oy) {
    const cx = this.focus[0] * W + ox, cy = this.focus[1] * H + oy;
    const yr = t / SETTINGS.yearSeconds;
    this.yr = yr;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 0.9 * scale;
    // background stars
    ctx.fillStyle = PAL[17];
    for (const s of this.stars) { ctx.globalAlpha = s[2]; ctx.fillRect(s[0] * W, s[1] * H, s[3] * scale, s[3] * scale); }
    // zodiac ring: ecliptic longitude scale beyond Saturn
    const zr = this.S * Math.sqrt(10.4);
    ctx.globalAlpha = 0.18; ctx.strokeStyle = PAL[14];
    ctx.beginPath(); ctx.ellipse(cx, cy, zr, zr * this.el, 0, 0, TAU); ctx.stroke();
    ctx.beginPath();
    for (let d = 0; d < 360; d += 5) {
      const a = -d * Math.PI / 180, L = (d % 30 === 0 ? 12 : d % 10 === 0 ? 7 : 3.5) * scale;
      const x0 = cx + Math.cos(a) * zr, y0 = cy + Math.sin(a) * zr * this.el;
      const nx = Math.cos(a), ny = Math.sin(a) * this.el, nm = Math.hypot(nx, ny);
      ctx.moveTo(x0, y0); ctx.lineTo(x0 + nx / nm * L, y0 + ny / nm * L);
    }
    ctx.globalAlpha = 0.28; ctx.stroke();
    this.zr = zr;
    // asteroid belt
    ctx.fillStyle = PAL[13];
    for (const b of this.belt) {
      const p = this.pos(b, b.M + TAU * yr / Math.pow(b.a, 1.5), cx, cy);
      ctx.globalAlpha = 0.35; ctx.fillRect(p[0], p[1], 1.3 * scale, 1.3 * scale);
    }
    // comet: equal-time wedges
    const c = this.comet, Mc = c.M0 + TAU * yr / c.T;
    const k0 = Math.floor(Mc / TAU * this.wedges);
    for (let k = k0 - this.wedges + 1; k <= k0; k++) {
      const m0 = k * TAU / this.wedges, m1 = Math.min(Mc, (k + 1) * TAU / this.wedges);
      ctx.beginPath(); ctx.moveTo(cx, cy);
      for (let s = 0; s <= 12; s++) { const p = this.pos(c, lerp(m0, m1, s / 12), cx, cy); ctx.lineTo(p[0], p[1]); }
      ctx.closePath();
      const age = (k0 - k) / this.wedges;
      ctx.globalAlpha = (k % 2 ? 0.05 : 0.022) * (1 - age * 0.6);
      ctx.fillStyle = PAL[20]; ctx.fill();
    }
    ctx.globalAlpha = 0.22; ctx.strokeStyle = PAL[14]; ctx.setLineDash([3 * scale, 5 * scale]);
    this.orbitPath(c, cx, cy); ctx.stroke(); ctx.setLineDash([]);
    // planet orbits
    for (const p of this.planets) { ctx.globalAlpha = 0.3; ctx.strokeStyle = PAL[14]; this.orbitPath(p, cx, cy); ctx.stroke(); }
    // Sun
    const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40 * scale);
    sg.addColorStop(0, shade(1, 0.9)); sg.addColorStop(0.15, shade(0.9, 0.5)); sg.addColorStop(1, shade(0.5, 0));
    ctx.globalAlpha = 1; ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(cx, cy, 40 * scale, 0, TAU); ctx.fill();
    // planets
    this.ppos = [];
    for (const p of this.planets) {
      const q = this.pos(p, p.M0 + TAU * yr / p.T, cx, cy);
      this.ppos.push(q);
      ctx.globalAlpha = 0.95; ctx.fillStyle = PAL[22];
      ctx.beginPath(); ctx.arc(q[0], q[1], (2 + Math.log(1 + p.a) * 1.2) * scale, 0, TAU); ctx.fill();
    }
    // moons and Saturn's rings
    ctx.fillStyle = PAL[19]; ctx.strokeStyle = PAL[16];
    for (const [pi, r, P] of this.moons) {
      const q = this.ppos[pi], a = TAU * t * 0.35 / P;
      ctx.globalAlpha = 0.18; ctx.lineWidth = 0.7 * scale;
      ctx.beginPath(); ctx.ellipse(q[0], q[1], r * scale, r * scale * this.el, 0, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.arc(q[0] + Math.cos(a) * r * scale, q[1] + Math.sin(a) * r * scale * this.el, 1.3 * scale, 0, TAU); ctx.fill();
    }
    const sq = this.ppos[5];
    ctx.globalAlpha = 0.6; ctx.lineWidth = 1 * scale; ctx.strokeStyle = PAL[18];
    ctx.beginPath(); ctx.ellipse(sq[0], sq[1], 11 * scale, 4 * scale, -0.3, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(sq[0], sq[1], 14 * scale, 5 * scale, -0.3, 0, TAU); ctx.globalAlpha = 0.3; ctx.stroke();
    // comet head + tail (points away from the Sun, longer near perihelion)
    const q = this.pos(c, Mc, cx, cy);
    const ang = Math.atan2(q[1] - cy, q[0] - cx), len = (140 / Math.max(0.6, q[2])) * scale;
    ctx.font = MONO(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 1; i <= 14; i++) {
      const f = i / 14;
      ctx.globalAlpha = 0.6 * (1 - f); ctx.fillStyle = PAL[20];
      ctx.fillText(GLYPHS[(i * 7 + Math.floor(t * 2)) % GLYPHS.length], q[0] + Math.cos(ang) * len * f + Math.sin(t * 3 + i) * 2, q[1] + Math.sin(ang) * len * f);
    }
    ctx.globalAlpha = 1; ctx.fillStyle = PAL[23];
    ctx.beginPath(); ctx.arc(q[0], q[1], 2.6 * scale, 0, TAU); ctx.fill();
    this.cpos = q;
  },
  drawOver(t) {
    if (!SETTINGS.math || !this.ppos) return;
    const o = octx;
    o.font = MONO(10); o.textBaseline = 'middle'; o.textAlign = 'left';
    this.planets.forEach((p, i) => {
      const q = this.ppos[i];
      o.globalAlpha = 0.6; o.fillStyle = PAL[18];
      o.fillText(p.n, q[0] + 8 * scale, q[1] - 7 * scale);
      o.globalAlpha = 0.38; o.fillStyle = PAL[14];
      o.fillText(`a ${p.a.toFixed(3)}  e ${p.e.toFixed(3)}`, q[0] + 8 * scale, q[1] + 6 * scale);
    });
    const q = this.cpos;
    // zodiac labels
    const cx = this.focus[0] * W, cy = this.focus[1] * H;
    o.globalAlpha = 0.4; o.fillStyle = PAL[15]; o.textAlign = 'center';
    for (let d = 0; d < 360; d += 30) {
      const a = -d * Math.PI / 180;
      o.fillText(d + '°', cx + Math.cos(a) * (this.zr + 26 * scale), cy + Math.sin(a) * (this.zr * this.el + 18 * scale));
    }
    o.textAlign = 'left';
    o.globalAlpha = 0.6; o.fillStyle = PAL[18];
    o.fillText(`comet  e = 0.82  r = ${q[2].toFixed(2)} AU`, q[0] + 10 * scale, q[1] - 8 * scale);
  },
  hud() { return [`elapsed ${this.yr ? this.yr.toFixed(2) : '0.00'} Earth years`, `comet wedges: 1/${this.wedges} of its period each`]; }
};
