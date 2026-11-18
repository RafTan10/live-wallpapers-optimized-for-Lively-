// Biology — a B-DNA double helix turning in 3D, with complementary base pairs (A–T, G–C),
// a second helix further back, drifting base-ring molecules, and a live codon → amino-acid ticker.
const CODE = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';   // standard genetic code, order TCAG
const AA3 = { F: 'Phe', L: 'Leu', S: 'Ser', Y: 'Tyr', '*': 'Stop', C: 'Cys', W: 'Trp', P: 'Pro', H: 'His', Q: 'Gln', R: 'Arg',
              I: 'Ile', M: 'Met', T: 'Thr', N: 'Asn', K: 'Lys', V: 'Val', A: 'Ala', D: 'Asp', E: 'Glu', G: 'Gly' };
const SCENE = {
  focus: [0.62, 0.5],
  title: 'B-DNA DOUBLE HELIX',
  sub: '10.5 bp per turn · pitch 3.4 nm · Ø 2.0 nm',
  anchors: [[0.30, 0.12], [0.56, 0.08], [0.26, 0.30], [0.70, 0.74], [0.36, 0.56], [0.76, 0.22]],
  eqs: [
    { e: 'h(s) = (r cos 2πs/p,  r sin 2πs/p,  s)', n: 'parametric helix, pitch p' },
    { e: 'A ═ T    G ≡ C', n: '2 and 3 hydrogen bonds per pair' },
    { e: '%A = %T,   %G = %C', n: "Chargaff's rules" },
    { e: 'p / bp = 3.4 nm / 10.5 ≈ 0.34 nm', n: 'rise per base pair' },
    { e: '4³ = 64 codons → 20 amino acids', n: 'the genetic code is redundant' },
    { e: '4ⁿ possible sequences', n: 'information in n base pairs' }
  ],
  init() {
    this.P = H * 0.46;
    this.r = this.P * (1.0 / 3.4);
    this.ang = -0.42;
    this.len = Math.hypot(W, H) * 0.9;
    this.minor = 2.4;
    this.seq = [];
    for (let i = 0; i < 4096; i++) this.seq.push('ATGC'[(Math.random() * 4) | 0]);
    this.seq[0] = 'A'; this.seq[1] = 'T'; this.seq[2] = 'G';
    this.mols = [];
    for (let i = 0; i < 11; i++) this.mols.push({ x: Math.random(), y: Math.random(), vx: rand(-0.004, 0.004), vy: rand(-0.004, 0.004), r: rand(14, 28), a: rand(0, TAU), w: rand(-0.15, 0.15), two: Math.random() < 0.5, al: rand(0.22, 0.42) });
  },
  update(dt) {
    for (const m of this.mols) {
      m.x += m.vx * dt; m.y += m.vy * dt; m.a += m.w * dt;
      if (m.x < -0.05) m.x = 1.05; if (m.x > 1.05) m.x = -0.05; if (m.y < -0.05) m.y = 1.05; if (m.y > 1.05) m.y = -0.05;
    }
  },
  helix(cx, cy, P, r, ang, len, spin, mul, letters, t) {
    const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
    const pt = (s, th) => {
      const a = Math.cos(th) * r, z = Math.sin(th);
      const f = 1 + z * 0.08;
      return [cx + ux * s + nx * a * f, cy + uy * s + ny * a * f, z];
    };
    const L = len / 2;
    for (const off of [0, this.minor]) {
      let prev = null;
      for (let s = -L; s <= L; s += 5 * scale) {
        const p = pt(s, TAU * s / P + spin + off);
        if (prev) {
          const front = 0.5 - 0.5 * p[2], edge = clamp(1 - Math.abs(s) / L, 0, 1);
          ctx.globalAlpha = (0.28 + 0.5 * front) * Math.min(1, edge * 4) * mul;
          ctx.strokeStyle = PAL[Math.round(10 + 11 * front)];
          ctx.lineWidth = (1 + 1.6 * front) * scale * (0.5 + 0.5 * mul);
          ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
        }
        prev = p;
      }
    }
    const rise = P / 10.5, k0 = Math.floor(-L / rise), k1 = Math.floor(L / rise);
    const shift = Math.floor(t * 0.9);
    const comp = { A: 'T', T: 'A', G: 'C', C: 'G' };
    let mark = null;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let k = k0; k <= k1; k++) {
      const s = k * rise, th = TAU * s / P + spin;
      const a = pt(s, th), b = pt(s, th + this.minor);
      const edge = clamp(1 - Math.abs(s) / L, 0, 1);
      const front = 0.5 - 0.25 * (a[2] + b[2]);
      ctx.globalAlpha = (0.08 + 0.4 * front) * Math.min(1, edge * 4) * mul;
      ctx.strokeStyle = PAL[13]; ctx.lineWidth = 0.9 * scale;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      if (!letters) continue;
      const base = this.seq[((k + shift) % 4096 + 4096) % 4096], pair = comp[base];
      for (const [p, ch] of [[a, base], [b, pair]]) {
        const fr = 0.5 - 0.5 * p[2];
        ctx.globalAlpha = (0.15 + 0.8 * fr) * Math.min(1, edge * 4) * mul;
        ctx.fillStyle = PAL[Math.round(12 + 11 * fr)];
        ctx.font = MONO(8 + 6 * fr);
        ctx.fillText(ch, p[0], p[1]);
      }
      if (k === 0) mark = [a, b, base, pair];
    }
    return mark;
  },
  draw(t, ox, oy) {
    const cx = this.focus[0] * W + ox, cy = this.focus[1] * H + oy;
    ctx.globalCompositeOperation = 'lighter';
    // drifting base-ring molecules (hexagon, or hexagon + pentagon like a purine)
    ctx.lineWidth = 0.9 * scale;
    for (const m of this.mols) {
      const x = m.x * W, y = m.y * H, r = m.r * scale;
      ctx.globalAlpha = m.al; ctx.strokeStyle = PAL[15];
      ctx.beginPath();
      for (let k = 0; k <= 6; k++) { const a = m.a + k * TAU / 6; k ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      if (m.two) {
        const a1 = m.a, a2 = m.a + TAU / 6;
        const p1 = [x + Math.cos(a1) * r, y + Math.sin(a1) * r], p2 = [x + Math.cos(a2) * r, y + Math.sin(a2) * r];
        const mid = (a1 + a2) / 2, d = r * 1.95;
        const q1 = [x + Math.cos(mid - 0.42) * d, y + Math.sin(mid - 0.42) * d], q2 = [x + Math.cos(mid) * d * 1.12, y + Math.sin(mid) * d * 1.12], q3 = [x + Math.cos(mid + 0.42) * d, y + Math.sin(mid + 0.42) * d];
        ctx.moveTo(p1[0], p1[1]); ctx.lineTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); ctx.lineTo(q3[0], q3[1]); ctx.lineTo(p2[0], p2[1]);
      }
      ctx.stroke();
      ctx.globalAlpha = m.al * 0.8; ctx.fillStyle = PAL[17]; ctx.font = MONO(8);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(m.two ? 'N' : 'C', x + Math.cos(m.a + 2) * r * 0.55, y + Math.sin(m.a + 2) * r * 0.55);
    }
    // a second, distant helix behind
    this.helix(W * 0.4 + ox * 0.4, H * 0.3 + oy * 0.4, this.P * 0.5, this.r * 0.5, -0.16, this.len * 0.55, -t * 0.3, 0.45, false, t);
    // main helix
    this.marks = this.helix(cx, cy, this.P, this.r, this.ang, this.len, t * 0.45, 1, true, t) || [];
    // codon ticker along the bottom
    const shift = Math.floor(t * 0.9), y0 = H * 0.9, x0 = W * 0.24;
    const frac = (t * 0.9) % 1;
    ctx.font = MONO(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const cw = 11 * scale;
    for (let i = 0; i < 66; i++) {
      const b = this.seq[(i + shift) % 4096], x = x0 + (i - frac) * cw;
      const edge = clamp(Math.min(i - frac, 66 - i) / 6, 0, 1);
      ctx.globalAlpha = 0.55 * edge; ctx.fillStyle = PAL[18];
      ctx.fillText(b, x, y0);
      if ((i + shift) % 3 === 0 && i + 2 < 66) {
        const idx = 'TCAG'.indexOf(b) * 16 + 'TCAG'.indexOf(this.seq[(i + 1 + shift) % 4096]) * 4 + 'TCAG'.indexOf(this.seq[(i + 2 + shift) % 4096]);
        const aa = AA3[CODE[idx]];
        ctx.globalAlpha = 0.35 * edge; ctx.strokeStyle = PAL[14]; ctx.lineWidth = 0.8 * scale;
        ctx.beginPath(); ctx.moveTo(x - cw * 0.45, y0 + 10 * scale); ctx.lineTo(x + cw * 2.45, y0 + 10 * scale); ctx.stroke();
        ctx.globalAlpha = 0.5 * edge; ctx.fillStyle = aa === 'Stop' || aa === 'Met' ? PAL[22] : PAL[15];
        ctx.font = MONO(10);
        ctx.fillText(aa, x + cw, y0 + 22 * scale);
        ctx.font = MONO(12);
      }
    }
    ctx.globalAlpha = 0.4; ctx.fillStyle = PAL[15]; ctx.font = MONO(10); ctx.textAlign = 'right';
    ctx.fillText("5′", x0 - 10 * scale, y0); ctx.textAlign = 'left';
    ctx.fillText("3′", x0 + 66 * cw, y0);
  },
  drawOver(t, ox, oy) {
    if (!SETTINGS.math) return;
    const o = octx, cx = this.focus[0] * W + ox, cy = this.focus[1] * H + oy;
    const ux = Math.cos(this.ang), uy = Math.sin(this.ang), nx = -uy, ny = ux;
    o.strokeStyle = PAL[14]; o.fillStyle = PAL[17]; o.lineWidth = 0.8 * scale; o.font = MONO(10.5);
    o.textBaseline = 'middle';
    const d = this.r * 1.9, s0 = this.P * 0.2, s1 = s0 + this.P;
    const A = [cx + ux * s0 + nx * d, cy + uy * s0 + ny * d], B = [cx + ux * s1 + nx * d, cy + uy * s1 + ny * d];
    o.globalAlpha = 0.45;
    o.beginPath(); o.moveTo(A[0], A[1]); o.lineTo(B[0], B[1]);
    for (const P of [A, B]) { o.moveTo(P[0] - nx * 7 * scale, P[1] - ny * 7 * scale); o.lineTo(P[0] + nx * 7 * scale, P[1] + ny * 7 * scale); }
    o.stroke();
    o.globalAlpha = 0.7; o.textAlign = 'center';
    o.fillText('p = 3.4 nm  (one full turn)', (A[0] + B[0]) / 2 + nx * 16 * scale, (A[1] + B[1]) / 2 + ny * 16 * scale);
    const s2 = -this.P * 0.9;
    const C = [cx + ux * s2 - nx * this.r, cy + uy * s2 - ny * this.r], D = [cx + ux * s2 + nx * this.r, cy + uy * s2 + ny * this.r];
    o.globalAlpha = 0.4; o.setLineDash([2 * scale, 4 * scale]);
    o.beginPath(); o.moveTo(C[0], C[1]); o.lineTo(D[0], D[1]); o.stroke(); o.setLineDash([]);
    o.globalAlpha = 0.65; o.textAlign = 'right';
    o.fillText('Ø 2.0 nm', C[0] - 8 * scale, C[1] - 6 * scale);
    if (this.marks && this.marks.length) {
      const [a, b, x, y] = this.marks, mx2 = (a[0] + b[0]) / 2, my2 = (a[1] + b[1]) / 2;
      o.globalAlpha = 0.5; o.textAlign = 'left';
      o.beginPath(); o.moveTo(mx2, my2); o.lineTo(mx2 + 60 * scale, my2 - 90 * scale); o.lineTo(mx2 + 76 * scale, my2 - 90 * scale); o.stroke();
      o.globalAlpha = 0.75;
      o.fillText(`${x}–${y}   ${x === 'A' || x === 'T' ? '2' : '3'} H-bonds`, mx2 + 82 * scale, my2 - 90 * scale);
    }
    o.globalAlpha = 0.45; o.textAlign = 'left'; o.fillStyle = PAL[15];
    o.fillText('reading frame → codons → amino acids', W * 0.24, H * 0.9 - 22 * scale);
  },
  hud(t) { return [`rotation ${((t * 0.45 * 180 / Math.PI) % 360).toFixed(1).padStart(5, '0')}°`]; }
};
