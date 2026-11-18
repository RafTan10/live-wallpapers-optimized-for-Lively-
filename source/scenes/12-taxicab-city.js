// Urban — an isometric city of wireframe towers. Traffic flows along the street grid, and a route
// from A to B shows taxicab geometry: every shortest path has the same length |Δx| + |Δy|.
const SCENE = {
  focus: [0.6, 0.55],
  anchors: [[0.28, 0.10], [0.5, 0.06], [0.22, 0.28], [0.22, 0.86], [0.42, 0.94], [0.22, 0.44]],
  title: 'TAXICAB GEOMETRY · CITY GRID',
  sub: 'isometric projection · 30°',
  eqs: [
    { e: 'd(A, B) = |x₁ − x₂| + |y₁ − y₂|', n: 'taxicab (Manhattan) distance' },
    { e: 'N = C(Δx + Δy, Δx) = (Δx + Δy)! / (Δx! Δy!)', n: 'number of shortest routes on a grid' },
    { e: 'd₂ = √(Δx² + Δy²) ≤ d₁', n: 'straight-line distance is never longer' },
    { e: '(x, y, z) ↦ ((x − y) cos 30°, (x + y) sin 30° − z)', n: 'isometric projection' },
    { e: 'dist[v] = min(dist[v], dist[u] + w(u, v))', n: "Dijkstra's relaxation step" },
    { e: 'ρ = N / A', n: 'density — people per unit area' }
  ],
  init() {
    this.G = 13;
    this.u = Math.min(W, H) * 0.052;
    this.b = [];
    for (let i = 0; i < this.G; i++) for (let j = 0; j < this.G; j++) {
      const c = Math.hypot(i - this.G / 2, j - this.G / 2) / (this.G * 0.7);
      const h = Math.max(0.3, (1 - c) * 5.5 * (0.45 + 0.55 * (0.5 + 0.5 * noise3(i * 0.4, j * 0.4, 3))) + rand(-0.3, 0.6));
      const lit = [];
      for (let k = 0; k < 30; k++) lit.push(Math.random() < 0.3);
      this.b.push({ i, j, h, lit, park: Math.random() < 0.06 });
    }
    this.cars = [];
    for (let k = 0; k < 70; k++) this.cars.push(this.newCar());
    this.newRoute();
  },
  newCar() {
    const horiz = Math.random() < 0.5, line = (Math.random() * (this.G + 1)) | 0;
    return { horiz, line, s: Math.random() * this.G, v: rand(0.25, 0.7) * (Math.random() < 0.5 ? -1 : 1) };
  },
  newRoute() {
    const G = this.G;
    let ax, ay, bx, by;
    do { ax = (Math.random() * (G + 1)) | 0; ay = (Math.random() * (G + 1)) | 0; bx = (Math.random() * (G + 1)) | 0; by = (Math.random() * (G + 1)) | 0; }
    while (Math.abs(ax - bx) < 4 || Math.abs(ay - by) < 4);
    const path = [[ax, ay]];
    let x = ax, y = ay;
    while (x !== bx || y !== by) {
      if (x !== bx && (y === by || Math.random() < 0.5)) x += Math.sign(bx - x); else y += Math.sign(by - y);
      path.push([x, y]);
    }
    const dx = Math.abs(ax - bx), dy = Math.abs(ay - by);
    let c = 1; for (let k = 1; k <= dx; k++) c = c * (dy + k) / k;
    this.route = { path, A: [ax, ay], B: [bx, by], dx, dy, N: Math.round(c), age: 0 };
  },
  update(dt) {
    for (const c of this.cars) {
      c.s += c.v * dt;
      if (c.s < 0 || c.s > this.G) Object.assign(c, this.newCar(), { s: c.v > 0 ? 0 : this.G });
    }
    this.route.age += dt;
    if (this.route.age > 16) this.newRoute();
  },
  iso(x, y, z, cx, cy) {
    const u = this.u, c = 0.866, s = 0.5;
    return [cx + (x - y) * c * u, cy + (x + y) * s * u - z * u - this.G * s * u];
  },
  draw(t, ox, oy) {
    const cx = this.focus[0] * W + ox, cy = this.focus[1] * H + oy;
    const G = this.G, gap = 0.18;
    // street grid
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 0.8 * scale;
    for (let k = 0; k <= G; k++) {
      ctx.globalAlpha = 0.16; ctx.strokeStyle = PAL[14];
      let a = this.iso(k, -0.5, 0, cx, cy), b = this.iso(k, G + 0.5, 0, cx, cy);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      a = this.iso(-0.5, k, 0, cx, cy); b = this.iso(G + 0.5, k, 0, cx, cy);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    // traffic
    for (const c of this.cars) {
      const p = c.horiz ? this.iso(c.s, c.line, 0, cx, cy) : this.iso(c.line, c.s, 0, cx, cy);
      const q = c.horiz ? this.iso(c.s - c.v * 0.6, c.line, 0, cx, cy) : this.iso(c.line, c.s - c.v * 0.6, 0, cx, cy);
      ctx.globalAlpha = 0.45; ctx.strokeStyle = PAL[18]; ctx.lineWidth = 1.2 * scale;
      ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
      ctx.globalAlpha = 0.9; ctx.fillStyle = PAL[22];
      ctx.fillRect(p[0] - 1.2 * scale, p[1] - 1.2 * scale, 2.4 * scale, 2.4 * scale);
    }
    // route A → B, drawn progressively
    const R = this.route, prog = clamp(R.age / 6, 0, 1) * (R.path.length - 1);
    ctx.globalAlpha = 0.95; ctx.strokeStyle = PAL[23]; ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    for (let k = 0; k <= Math.floor(prog); k++) {
      const [x, y] = R.path[k], p = this.iso(x, y, 0, cx, cy);
      k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    if (prog < R.path.length - 1) {
      const k = Math.floor(prog), f = prog - k, a = R.path[k], b = R.path[k + 1];
      const p = this.iso(lerp(a[0], b[0], f), lerp(a[1], b[1], f), 0, cx, cy);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
    // straight-line comparison
    const pA = this.iso(R.A[0], R.A[1], 0, cx, cy), pB = this.iso(R.B[0], R.B[1], 0, cx, cy);
    ctx.globalAlpha = 0.4; ctx.setLineDash([3 * scale, 5 * scale]); ctx.lineWidth = 1 * scale;
    ctx.beginPath(); ctx.moveTo(pA[0], pA[1]); ctx.lineTo(pB[0], pB[1]); ctx.stroke(); ctx.setLineDash([]);
    // towers, back to front
    ctx.globalCompositeOperation = 'source-over';
    const order = [...this.b].sort((a, b) => (a.i + a.j) - (b.i + b.j));
    for (const q of order) {
      const x0 = q.i + gap, y0 = q.j + gap, x1 = q.i + 1 - gap, y1 = q.j + 1 - gap;
      if (q.park) {
        ctx.globalAlpha = 0.3; ctx.fillStyle = PAL[15];
        for (let k = 0; k < 5; k++) { const p = this.iso(lerp(x0, x1, (k * 0.37) % 1), lerp(y0, y1, (k * 0.61) % 1), 0, cx, cy); ctx.beginPath(); ctx.arc(p[0], p[1] - 3 * scale, 3 * scale, 0, TAU); ctx.fill(); }
        continue;
      }
      const h = q.h;
      const A = this.iso(x0, y1, 0, cx, cy), B = this.iso(x1, y1, 0, cx, cy), C = this.iso(x1, y0, 0, cx, cy);
      const A2 = this.iso(x0, y1, h, cx, cy), B2 = this.iso(x1, y1, h, cx, cy), C2 = this.iso(x1, y0, h, cx, cy), D2 = this.iso(x0, y0, h, cx, cy);
      // occluding fill
      ctx.globalAlpha = 0.94; ctx.fillStyle = `hsl(${theme.hue},${Math.min(theme.sat, 10)}%,5%)`;
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(C2[0], C2[1]); ctx.lineTo(D2[0], D2[1]); ctx.lineTo(A2[0], A2[1]); ctx.closePath(); ctx.fill();
      // edges
      const depth = (q.i + q.j) / (2 * G);
      ctx.globalAlpha = 0.3 + 0.45 * depth; ctx.strokeStyle = PAL[Math.round(13 + 7 * depth)]; ctx.lineWidth = 0.9 * scale;
      ctx.beginPath();
      ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]);
      ctx.moveTo(A2[0], A2[1]); ctx.lineTo(B2[0], B2[1]); ctx.lineTo(C2[0], C2[1]); ctx.lineTo(D2[0], D2[1]); ctx.closePath();
      ctx.moveTo(A[0], A[1]); ctx.lineTo(A2[0], A2[1]); ctx.moveTo(B[0], B[1]); ctx.lineTo(B2[0], B2[1]); ctx.moveTo(C[0], C[1]); ctx.lineTo(C2[0], C2[1]);
      ctx.stroke();
      // lit windows on the two visible faces
      ctx.fillStyle = PAL[21];
      const floors = Math.min(10, Math.floor(h / 0.45));
      let w = 0;
      for (let f = 0; f < floors; f++) {
        const z = (f + 0.6) * (h / (floors + 0.2));
        for (let k = 0; k < 3; k++) {
          const blink = q.lit[(w + Math.floor(t / 9 + q.i)) % 30]; w++;
          if (!blink) continue;
          const u2 = (k + 0.5) / 3;
          const p1 = this.iso(lerp(x0, x1, u2), y1, z, cx, cy), p2 = this.iso(x1, lerp(y1, y0, u2), z, cx, cy);
          ctx.globalAlpha = 0.55; ctx.fillRect(p1[0] - 0.9 * scale, p1[1] - 0.9 * scale, 1.8 * scale, 1.8 * scale);
          ctx.globalAlpha = 0.35; ctx.fillRect(p2[0] - 0.9 * scale, p2[1] - 0.9 * scale, 1.8 * scale, 1.8 * scale);
        }
      }
    }
    this._pA = pA; this._pB = pB;
  },
  drawOver(t, ox, oy) {
    const o = octx, R = this.route;
    o.font = MONO(12); o.textAlign = 'center'; o.textBaseline = 'middle';
    o.globalAlpha = 0.95; o.fillStyle = PAL[23];
    o.fillText('A', this._pA[0], this._pA[1] - 14 * scale); o.fillText('B', this._pB[0], this._pB[1] - 14 * scale);
    if (!SETTINGS.math) return;
    o.font = MONO(10.5); o.textAlign = 'left';
    const x = W * 0.22, y = H * 0.6;
    o.globalAlpha = 0.7; o.fillStyle = PAL[18];
    o.fillText('ROUTE  A → B', x, y);
    o.globalAlpha = 0.5;
    o.fillText(`Δx = ${R.dx} blocks   Δy = ${R.dy} blocks`, x, y + 18 * scale);
    o.fillText(`taxicab  d₁ = ${R.dx + R.dy}`, x, y + 34 * scale);
    o.fillText(`straight d₂ = ${Math.hypot(R.dx, R.dy).toFixed(2)}`, x, y + 50 * scale);
    o.fillText(`shortest routes  C(${R.dx + R.dy}, ${R.dx}) = ${R.N.toLocaleString('en-US')}`, x, y + 66 * scale);
  },
  hud() { return [`${this.G}×${this.G} blocks · ${this.cars.length} vehicles`]; }
};
