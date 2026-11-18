// Nature — a sunflower head growing by Vogel's model of phyllotaxis.
// Each seed keeps its golden-angle direction and drifts outward as new seeds are born at the centre.
const GOLDEN = Math.PI * (3 - Math.sqrt(5));   // 137.508° in radians
const SCENE = {
  focus: [0.63, 0.5],
  title: 'PHYLLOTAXIS · VOGEL MODEL',
  sub: 'golden angle 137.508° · parastichies 21 | 34',
  eqs: [
    { e: 'θₙ = n · 137.508°', n: 'divergence angle between seeds' },
    { e: 'rₙ = c √n', n: "Vogel's model (1979)" },
    { e: 'φ = (1 + √5) / 2 ≈ 1.618', n: 'golden ratio' },
    { e: 'Fₙ = Fₙ₋₁ + Fₙ₋₂', n: 'Fibonacci recurrence' },
    { e: '360° · (2 − φ) ≈ 137.508°', n: 'golden angle' },
    { e: 'Fₙ₊₁ / Fₙ → φ', n: 'ratio of consecutive Fibonacci numbers' }
  ],
  init() {
    this.N = Math.round(1150 * SETTINGS.density);
    this.c = Math.min(W, H) * 0.355 / Math.sqrt(this.N);
    this.glyphs = []; for (let i = 0; i < 4096; i++) this.glyphs.push(pick());
    this.phase = this.N;
    // Fibonacci squares for the golden-spiral diagram: directions up, right, down, left, …
    const F = [1, 1, 2, 3, 5, 8, 13, 21, 34];
    let bx = 0, by = 0, bw = 1, bh = 1;
    this.sq = [{ x: 0, y: 0, s: 1, d: 3 }];
    for (let i = 1; i < F.length; i++) {
      const s = F[i], d = (i - 1) % 4;
      let x, y;
      if (d === 0) { x = bx + bw; y = by; } else if (d === 1) { x = bx; y = by + bh; }
      else if (d === 2) { x = bx - s; y = by; } else { x = bx; y = by - s; }
      this.sq.push({ x, y, s, d });
      const nx0 = Math.min(bx, x), ny0 = Math.min(by, y), nx1 = Math.max(bx + bw, x + s), ny1 = Math.max(by + bh, y + s);
      bx = nx0; by = ny0; bw = nx1 - nx0; bh = ny1 - ny0;
    }
    this.gb = { bx, by, bw, bh };
  },
  drawGolden(t) {
    const { bx, by, bw, bh } = this.gb;
    const u = (W * 0.17) / Math.max(bw, bh);
    const X0 = W * 0.115, Y0 = H * 0.86 - bh * u;
    const cyc = 46, ph = t % cyc;
    const shown = ph / 1.8;
    const fade = clamp((cyc - ph) / 4, 0, 1) * clamp(ph * 2, 0, 1);
    ctx.lineWidth = 0.9 * scale;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    this.sq.forEach((q, i) => {
      if (i > shown) return;
      const part = clamp(shown - i, 0, 1);
      const x = X0 + (q.x - bx) * u, y = Y0 + (q.y - by) * u, s = q.s * u;
      ctx.globalAlpha = 0.22 * fade * part; ctx.strokeStyle = PAL[14];
      ctx.strokeRect(x, y, s, s);
      const centers = [[x, y + s], [x, y], [x + s, y], [x + s, y + s]];
      const a0 = [1.5, 0, 0.5, 1][q.d] * Math.PI;
      const c = centers[q.d];
      ctx.globalAlpha = 0.6 * fade; ctx.strokeStyle = PAL[20];
      ctx.beginPath(); ctx.arc(c[0], c[1], s, a0, a0 + Math.PI / 2 * part); ctx.stroke();
      if (s > 14 * scale) {
        ctx.globalAlpha = 0.35 * fade * part; ctx.fillStyle = PAL[16];
        ctx.font = MONO(Math.min(13, 6 + q.s * 0.4));
        ctx.fillText(String(q.s), x + s / 2, y + s / 2);
      }
    });
  },
  update(dt) { this.phase += dt * SETTINGS.growth; },
  seed(j, cx, cy, rot) {
    const v = this.phase - j;
    const r = this.c * Math.sqrt(Math.max(0, v));
    const a = j * GOLDEN + rot;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a), v];
  },
  draw(t, ox, oy) {
    const cx = this.focus[0] * W + ox, cy = this.focus[1] * H + oy, rot = t * 0.012;
    const top = Math.floor(this.phase), N = this.N;
    ctx.globalCompositeOperation = 'lighter';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    this.drawGolden(t);
    // Ray florets: two rings of petals (34 and 21 — Fibonacci again), gently swaying
    const Rh = this.c * Math.sqrt(N * 0.97);
    for (const [cnt, len, al, off] of [[21, 0.42, 0.12, 0.5], [34, 0.34, 0.24, 0]]) {
      for (let i = 0; i < cnt; i++) {
        const a = (i + off) / cnt * TAU + rot * 1.3 + 0.025 * Math.sin(t * 0.5 + i * 1.7);
        const L = Rh * (len + 0.05 * Math.sin(i * 2.3)), w = 0.55 / cnt * 3.2;
        const p0 = [cx + Math.cos(a) * Rh * 0.98, cy + Math.sin(a) * Rh * 0.98];
        const tip = [cx + Math.cos(a) * (Rh + L), cy + Math.sin(a) * (Rh + L)];
        const c1 = [cx + Math.cos(a - w) * (Rh + L * 0.5), cy + Math.sin(a - w) * (Rh + L * 0.5)];
        const c2 = [cx + Math.cos(a + w) * (Rh + L * 0.5), cy + Math.sin(a + w) * (Rh + L * 0.5)];
        ctx.lineWidth = 0.9 * scale; ctx.strokeStyle = PAL[15]; ctx.globalAlpha = al;
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(c1[0], c1[1], tip[0], tip[1]);
        ctx.quadraticCurveTo(c2[0], c2[1], p0[0], p0[1]); ctx.stroke();
        ctx.globalAlpha = al * 0.45;
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
      }
    }
    // Parastichy spirals: seeds whose index differs by a Fibonacci number line up
    ctx.lineWidth = 0.8 * scale;
    for (const [step, fams, al] of [[21, [0, 7, 14], 0.3], [34, [5, 22], 0.24]]) {
      for (const f of fams) {
        ctx.beginPath();
        let first = true;
        let j = top - ((top - f) % step + step) % step;
        for (; this.phase - j <= N; j -= step) {
          const p = this.seed(j, cx, cy, rot);
          if (first) { ctx.moveTo(p[0], p[1]); first = false; } else ctx.lineTo(p[0], p[1]);
        }
        ctx.strokeStyle = PAL[14]; ctx.globalAlpha = al; ctx.stroke();
      }
    }

    // Seeds
    const fonts = [6, 8.5, 11, 13.5].map(MONO);
    for (let b = 0; b < 4; b++) {
      ctx.font = fonts[b];
      for (let j = top; this.phase - j <= N; j--) {
        const p = this.seed(j, cx, cy, rot), v = p[2], q = v / N;
        const fb = Math.min(3, Math.floor(Math.sqrt(q) * 4));
        if (fb !== b) continue;
        const fade = clamp(v / 4, 0, 1) * clamp((N - v) / (N * 0.12), 0, 1);
        ctx.globalAlpha = fade * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, q * 1.15)));
        ctx.fillStyle = PAL[Math.round(10 + 12 * (1 - q))];
        ctx.fillText(this.glyphs[((j % 4096) + 4096) % 4096], p[0], p[1]);
      }
    }
    // Centre disc
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[18];
    ctx.beginPath(); ctx.arc(cx, cy, this.c * Math.sqrt(6), 0, TAU); ctx.stroke();
  },
  drawOver(t, ox, oy) {
    if (!SETTINGS.math) return;
    const cx = this.focus[0] * W + ox, cy = this.focus[1] * H + oy, rot = t * 0.012;
    // Mark the newest seed and the golden angle between it and the previous one
    const j = Math.floor(this.phase) - 40;
    const a = this.seed(j, cx, cy, rot), b = this.seed(j - 1, cx, cy, rot);
    const o = octx;
    o.strokeStyle = PAL[18]; o.fillStyle = PAL[18]; o.lineWidth = 0.9 * scale;
    o.globalAlpha = 0.55;
    o.beginPath(); o.moveTo(cx, cy); o.lineTo(a[0], a[1]); o.moveTo(cx, cy); o.lineTo(b[0], b[1]); o.stroke();
    const a1 = Math.atan2(a[1] - cy, a[0] - cx);
    o.beginPath(); o.arc(cx, cy, 26 * scale, a1, a1 + GOLDEN); o.stroke();
    o.globalAlpha = 0.8; o.font = MONO(10.5); o.textAlign = 'left'; o.textBaseline = 'middle';
    const am = a1 + GOLDEN / 2;
    o.fillText('137.5°', cx + Math.cos(am) * 40 * scale, cy + Math.sin(am) * 40 * scale);
    // Outer reference ring with radius label
    const R = this.c * Math.sqrt(this.N * 0.88);
    o.globalAlpha = 0.25; o.setLineDash([2 * scale, 6 * scale]);
    o.beginPath(); o.arc(cx, cy, R + 18 * scale, 0, TAU); o.stroke(); o.setLineDash([]);
    o.globalAlpha = 0.5;
    o.fillText(`r = c√n,  n = ${Math.floor(this.phase).toLocaleString('en-US')}`, cx + R * 0.72 + 30 * scale, cy - R * 0.72 - 6 * scale);
  },
  hud(t) { return [`seeds ${this.N}   new seed every ${(1 / SETTINGS.growth).toFixed(2)} s`]; }
};
