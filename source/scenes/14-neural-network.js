// Computer science — a small neural network (2-8-8-1, tanh) actually training by gradient descent
// to separate two rings of points. Its decision boundary, weights, activations and loss are live.
const SCENE = {
  focus: [0.62, 0.48],
  anchors: [[0.30, 0.08], [0.52, 0.05], [0.42, 0.92], [0.62, 0.95], [0.40, 0.84], [0.22, 0.86]],
  title: 'NEURAL NETWORK · 2-8-8-1 · tanh',
  sub: 'stochastic gradient descent · binary cross-entropy',
  eqs: [
    { e: 'a⁽ˡ⁾ = tanh(W⁽ˡ⁾ a⁽ˡ⁻¹⁾ + b⁽ˡ⁾)', n: 'forward pass through one layer' },
    { e: 'σ(z) = 1 / (1 + e⁻ᶻ)', n: 'sigmoid output — a probability' },
    { e: 'L = −[y log ŷ + (1 − y) log(1 − ŷ)]', n: 'binary cross-entropy loss' },
    { e: 'δ⁽ˡ⁾ = (W⁽ˡ⁺¹⁾ᵀ δ⁽ˡ⁺¹⁾) ⊙ (1 − a⁽ˡ⁾²)', n: 'backpropagation' },
    { e: 'W ← W − η ∂L/∂W', n: 'gradient descent update' },
    { e: '∂L/∂z = ŷ − y', n: 'why sigmoid + cross-entropy pair so neatly' }
  ],
  init() {
    this.sizes = [2, 8, 8, 1];
    this.reset();
    this.data = [];
    for (let i = 0; i < 220; i++) {
      const y = i % 2, r = y ? rand(0.55, 0.9) : rand(0, 0.35), a = rand(0, TAU);
      this.data.push([r * Math.cos(a), r * Math.sin(a), y]);
    }
    this.grid = 34; this.heat = new Float32Array(this.grid * this.grid);
    this.cv = document.createElement('canvas'); this.cv.width = this.cv.height = this.grid;
    this.cx2 = this.cv.getContext('2d'); this.img = this.cx2.createImageData(this.grid, this.grid);
    this.frame = 0;
  },
  reset() {
    const s = this.sizes;
    this.Wt = []; this.B = [];
    for (let l = 1; l < s.length; l++) {
      const m = []; for (let i = 0; i < s[l]; i++) { const row = []; for (let j = 0; j < s[l - 1]; j++) row.push(rand(-1, 1) * Math.sqrt(1.5 / s[l - 1])); m.push(row); }
      this.Wt.push(m); this.B.push(new Array(s[l]).fill(0));
    }
    this.loss = []; this.steps = 0; this.epochT = 0;
  },
  forward(x) {
    const A = [x];
    for (let l = 0; l < this.Wt.length; l++) {
      const prev = A[l], out = [];
      for (let i = 0; i < this.Wt[l].length; i++) {
        let z = this.B[l][i]; const w = this.Wt[l][i];
        for (let j = 0; j < prev.length; j++) z += w[j] * prev[j];
        out.push(l === this.Wt.length - 1 ? 1 / (1 + Math.exp(-z)) : Math.tanh(z));
      }
      A.push(out);
    }
    return A;
  },
  train(batch, lr) {
    const gW = this.Wt.map(m => m.map(r => r.map(() => 0))), gB = this.B.map(b => b.map(() => 0));
    let Ls = 0;
    for (let n = 0; n < batch; n++) {
      const d = this.data[(Math.random() * this.data.length) | 0];
      const A = this.forward([d[0], d[1]]), yh = A[A.length - 1][0];
      Ls += -(d[2] * Math.log(yh + 1e-9) + (1 - d[2]) * Math.log(1 - yh + 1e-9));
      let delta = [yh - d[2]];
      for (let l = this.Wt.length - 1; l >= 0; l--) {
        const prev = A[l];
        for (let i = 0; i < delta.length; i++) { gB[l][i] += delta[i]; for (let j = 0; j < prev.length; j++) gW[l][i][j] += delta[i] * prev[j]; }
        if (l > 0) {
          const nd = [];
          for (let j = 0; j < prev.length; j++) { let s = 0; for (let i = 0; i < delta.length; i++) s += this.Wt[l][i][j] * delta[i]; nd.push(s * (1 - prev[j] * prev[j])); }
          delta = nd;
        }
      }
    }
    for (let l = 0; l < this.Wt.length; l++) for (let i = 0; i < this.Wt[l].length; i++) {
      this.B[l][i] -= lr * gB[l][i] / batch;
      for (let j = 0; j < this.Wt[l][i].length; j++) this.Wt[l][i][j] -= lr * gW[l][i][j] / batch;
    }
    return Ls / batch;
  },
  update(dt, t) {
    this.epochT += dt;
    if (this.epochT > SETTINGS.retrainEvery) this.reset();
    let L = 0;
    for (let k = 0; k < 6; k++) { L += this.train(16, 0.25); this.steps++; }
    this.loss.push(L / 6); if (this.loss.length > 600) this.loss.shift();
    this.frame++;
    if (this.frame % 6 === 0) {
      const g = this.grid, d = this.img.data;
      for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) {
        const p = this.forward([(i + 0.5) / g * 2 - 1, (j + 0.5) / g * 2 - 1]);
        const v = p[p.length - 1][0], c = RGB[Math.round(4 + v * 12)], k = (j * g + i) * 4;
        d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 25 + Math.abs(v - 0.5) * 110;
      }
      this.cx2.putImageData(this.img, 0, 0);
    }
    const a = t * 0.35;
    this.probe = [0.75 * Math.cos(a) * (0.5 + 0.5 * Math.sin(t * 0.21)), 0.75 * Math.sin(a) * (0.5 + 0.5 * Math.sin(t * 0.21))];
    this.act = this.forward(this.probe);
  },
  layout() {
    const x0 = W * 0.44, x1 = W * 0.9, yc = H * 0.46, span = H * 0.62;
    return this.sizes.map((n, l) => {
      const x = lerp(x0, x1, l / (this.sizes.length - 1));
      return Array.from({ length: n }, (_, i) => [x, yc + (n === 1 ? 0 : (i / (n - 1) - 0.5) * span * (0.35 + 0.65 * n / 8))]);
    });
  },
  draw(t, ox, oy) {
    const Lp = this.layout().map(layer => layer.map(([x, y]) => [x + ox, y + oy]));
    ctx.globalCompositeOperation = 'lighter';
    // edges: brightness ∝ |weight|, dashed when negative; pulses travel forward
    for (let l = 0; l < this.Wt.length; l++) for (let i = 0; i < this.Wt[l].length; i++) for (let j = 0; j < this.Wt[l][i].length; j++) {
      const w = this.Wt[l][i][j], a = Lp[l][j], b = Lp[l + 1][i];
      ctx.globalAlpha = clamp(0.04 + Math.abs(w) * 0.22, 0, 0.6); ctx.strokeStyle = PAL[w > 0 ? 19 : 13];
      ctx.lineWidth = (0.5 + Math.min(2, Math.abs(w)) * 0.7) * scale;
      if (w < 0) ctx.setLineDash([3 * scale, 4 * scale]);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.setLineDash([]);
      const ph = ((t * 0.6 - l * 0.33) % 1 + 1) % 1;
      const act = Math.abs(this.act[l][j]);
      if (act > 0.25 && Math.abs(w) > 0.4) {
        ctx.globalAlpha = 0.7 * act; ctx.fillStyle = PAL[22];
        ctx.fillRect(lerp(a[0], b[0], ph) - 1.2 * scale, lerp(a[1], b[1], ph) - 1.2 * scale, 2.4 * scale, 2.4 * scale);
      }
    }
    // nodes: brightness = activation for the moving probe input
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    Lp.forEach((layer, l) => layer.forEach(([x, y], i) => {
      const a = this.act[l][i], v = l === Lp.length - 1 ? a : (a + 1) / 2;
      const r = (l === 0 || l === Lp.length - 1 ? 13 : 10) * scale;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1; ctx.fillStyle = `hsl(${theme.hue},${Math.min(theme.sat, 10)}%,${(4 + v * 14).toFixed(1)}%)`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 + 0.4 * v; ctx.strokeStyle = PAL[Math.round(14 + 9 * v)]; ctx.lineWidth = 1.1 * scale;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.85; ctx.fillStyle = PAL[22]; ctx.font = MONO(8.5);
      ctx.fillText(a.toFixed(2).replace('0.', '.'), x, y);
    }));
    // decision-boundary inset with the data points
    const bx = W * 0.2, by = H * 0.24, bs = H * 0.34;
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 1; ctx.drawImage(this.cv, bx, by, bs, bs);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35; ctx.strokeStyle = PAL[15]; ctx.lineWidth = 0.8 * scale; ctx.strokeRect(bx, by, bs, bs);
    for (const d of this.data) {
      const x = bx + (d[0] + 1) / 2 * bs, y = by + (d[1] + 1) / 2 * bs;
      ctx.globalAlpha = 0.85; ctx.strokeStyle = ctx.fillStyle = PAL[d[2] ? 23 : 16];
      if (d[2]) ctx.fillRect(x - 1.4 * scale, y - 1.4 * scale, 2.8 * scale, 2.8 * scale);
      else { ctx.beginPath(); ctx.arc(x, y, 1.8 * scale, 0, TAU); ctx.stroke(); }
    }
    const px = bx + (this.probe[0] + 1) / 2 * bs, py = by + (this.probe[1] + 1) / 2 * bs;
    ctx.globalAlpha = 0.9; ctx.strokeStyle = PAL[23]; ctx.lineWidth = 1 * scale;
    ctx.beginPath(); ctx.arc(px, py, 6 * scale, 0, TAU); ctx.moveTo(px - 10 * scale, py); ctx.lineTo(px + 10 * scale, py); ctx.moveTo(px, py - 10 * scale); ctx.lineTo(px, py + 10 * scale); ctx.stroke();
    // loss curve
    const lx = bx, ly = by + bs + 60 * scale, lw = bs, lh = H * 0.12;
    ctx.globalAlpha = 0.3; ctx.strokeStyle = PAL[14];
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + lh); ctx.lineTo(lx + lw, ly + lh); ctx.stroke();
    ctx.beginPath();
    this.loss.forEach((v, i) => { const x = lx + i / 600 * lw, y = ly + lh - clamp(v / 0.8, 0, 1) * lh; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.globalAlpha = 0.8; ctx.strokeStyle = PAL[20]; ctx.lineWidth = 1 * scale; ctx.stroke();
    this.ins = [bx, by, bs, lx, ly, lw, lh, Lp];
  },
  drawOver() {
    if (!SETTINGS.math || !this.ins) return;
    const o = octx, [bx, by, bs, lx, ly, lw, lh, Lp] = this.ins;
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'left'; o.fillStyle = PAL[17];
    o.globalAlpha = 0.65; o.fillText('DECISION BOUNDARY   ŷ(x₁, x₂)', bx, by - 14 * scale);
    const last = this.loss[this.loss.length - 1] || 0;
    o.fillText(`LOSS   L = ${last.toFixed(3)}   step ${this.steps}`, lx, ly - 14 * scale);
    let acc = 0; for (const d of this.data) { const p = this.forward([d[0], d[1]]); if ((p[3][0] > 0.5) === (d[2] === 1)) acc++; }
    o.globalAlpha = 0.5; o.fillText(`accuracy ${(acc / this.data.length * 100).toFixed(1)}%   η = 0.25   batch 16`, lx, ly + lh + 16 * scale);
    o.textAlign = 'center';
    ['input x', 'hidden 1', 'hidden 2', 'output ŷ'].forEach((s, l) => { o.globalAlpha = 0.5; o.fillText(s, Lp[l][0][0], H * 0.08 + Lp[l][0][1] * 0 + H * 0.06); });
    o.globalAlpha = 0.75; o.textAlign = 'left';
    const out = Lp[3][0];
    o.fillText(`P(outer ring) = ${this.act[3][0].toFixed(3)}`, out[0] + 20 * scale, out[1]);
  },
  hud() { return [`re-initialised every ${SETTINGS.retrainEvery} s`]; }
};
