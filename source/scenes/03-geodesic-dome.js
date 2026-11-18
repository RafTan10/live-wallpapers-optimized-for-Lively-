// Architecture — geodesic domes: an icosahedron subdivided and projected onto a sphere,
// cut to a hemisphere, slowly turning. A laser scan plane, a second smaller dome, a site grid
// and a plan-view drawing fill out the blueprint.
const SCENE = {
  focus: [0.63, 0.52],
  anchors: [[0.30, 0.12], [0.56, 0.08], [0.22, 0.3], [0.62, 0.95], [0.42, 0.95], [0.44, 0.22]],
  title: 'GEODESIC DOME · ICOSAHEDRAL',
  sub: '',
  eqs: [
    { e: 'V − E + F = 2', n: "Euler's formula for a closed polyhedron" },
    { e: 'F = 20ν²,  E = 30ν²,  V = 10ν² + 2', n: 'geodesic sphere of frequency ν' },
    { e: 'x² + y² + z² = r²', n: 'every vertex lies on the sphere' },
    { e: 'chord = 2r sin(α / 2)', n: 'strut length from its central angle' },
    { e: '(0, ±1, ±φ)', n: 'icosahedron vertices, φ = golden ratio' },
    { e: 'V − E + F = 1', n: 'Euler characteristic of a hemisphere (a disk)' }
  ],
  buildMesh(nu) {
    const phi = (1 + Math.sqrt(5)) / 2;
    let iv = [[-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0], [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
              [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]];
    const ang = Math.atan2(1, phi);          // tilt so a vertex points straight up
    iv = iv.map(([x, y, z]) => [x * Math.cos(ang) - y * Math.sin(ang), x * Math.sin(ang) + y * Math.cos(ang), z]);
    const faces = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
                   [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    const norm = v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
    const verts = [], index = new Map();
    const vid = v => {
      const k = v.map(c => Math.round(c * 1e4)).join(',');
      if (!index.has(k)) { index.set(k, verts.length); verts.push(v); }
      return index.get(k);
    };
    const tris = [];
    for (const [a, b, c] of faces) {
      const A = norm(iv[a]), B = norm(iv[b]), C = norm(iv[c]);
      const P = (i, j) => norm([0, 1, 2].map(k => A[k] + (B[k] - A[k]) * i / nu + (C[k] - A[k]) * j / nu));
      const id = {};
      for (let i = 0; i <= nu; i++) for (let j = 0; j <= nu - i; j++) id[i + ',' + j] = vid(P(i, j));
      for (let i = 0; i < nu; i++) for (let j = 0; j < nu - i; j++) {
        tris.push([id[i + ',' + j], id[(i + 1) + ',' + j], id[i + ',' + (j + 1)]]);
        if (i + j < nu - 1) tris.push([id[(i + 1) + ',' + j], id[(i + 1) + ',' + (j + 1)], id[i + ',' + (j + 1)]]);
      }
    }
    const keep = tris.filter(t => (verts[t[0]][1] + verts[t[1]][1] + verts[t[2]][1]) / 3 > -0.02);
    const used = new Set(), edges = new Map();
    for (const t of keep) {
      for (const v of t) used.add(v);
      for (let k = 0; k < 3; k++) {
        const a = t[k], b = t[(k + 1) % 3], key = a < b ? a + '-' + b : b + '-' + a;
        edges.set(key, [a, b]);
      }
    }
    return { verts, edges: [...edges.values()], used: [...used], V: used.size, E: edges.size, F: keep.length, glyph: verts.map(() => pick()) };
  },
  init() {
    const nu = SETTINGS.frequency;
    this.main = this.buildMesh(nu);
    this.small = this.buildMesh(2);
    const m = this.main;
    this.sub = `ν = ${nu} · V ${m.V} · E ${m.E} · F ${m.F} · V − E + F = ${m.V - m.E + m.F}`;
    this.S = Math.min(W, H) * 0.34;
  },
  update() {},
  project(v, rot, cx, cy, S) {
    const c = Math.cos(rot), s = Math.sin(rot);
    const x = v[0] * c - v[2] * s, z = v[0] * s + v[2] * c, y = v[1];
    const el = 0.32, ce = Math.cos(el), se = Math.sin(el);
    const y2 = y * ce - z * se, z2 = y * se + z * ce;
    const d = 4.2, f = d / (d + z2);
    return [cx + x * S * f, cy - y2 * S * f, z2, f];
  },
  drawDome(mesh, cx, cy, S, rot, mul, scan) {
    const P = mesh.verts.map(v => this.project(v, rot, cx, cy, S));
    ctx.lineWidth = 1 * scale;
    for (const [a, b] of mesh.edges) {
      const pa = P[a], pb = P[b];
      const depth = (pa[2] + pb[2]) / 2;
      const hy = (mesh.verts[a][1] + mesh.verts[b][1]) / 2;
      const hit = scan === null ? 0 : Math.max(0, 1 - Math.abs(hy - scan) / 0.06);
      const front = 0.5 - depth * 0.5;
      ctx.globalAlpha = (0.12 + 0.45 * front + 0.5 * hit) * mul;
      ctx.strokeStyle = PAL[Math.round(10 + 8 * front + 5 * hit)];
      ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = MONO(10);
    for (const i of mesh.used) {
      const p = P[i], hit = scan === null ? 0 : Math.max(0, 1 - Math.abs(mesh.verts[i][1] - scan) / 0.08), front = 0.5 - p[2] * 0.5;
      ctx.globalAlpha = (0.2 * front + 0.85 * hit) * mul;
      ctx.fillStyle = PAL[Math.round(14 + 8 * hit)];
      if (hit > 0.05) ctx.fillText(mesh.glyph[i], p[0], p[1] - 9 * scale);
      ctx.fillRect(p[0] - 1.2 * scale, p[1] - 1.2 * scale, 2.4 * scale, 2.4 * scale);
    }
  },
  ring(r, y, rot, cx, cy, S) {
    ctx.beginPath();
    for (let s = 0; s <= 96; s++) {
      const a = s / 96 * TAU, p = this.project([Math.cos(a) * r, y, Math.sin(a) * r], rot, cx, cy, S);
      s ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
  },
  draw(t, ox, oy) {
    const S = this.S;
    const cx = this.focus[0] * W + ox, cy = this.focus[1] * H + oy + S * 0.2;
    const rot = t * 0.06;
    const scan = 0.5 + 0.5 * Math.sin(t * 0.35);
    ctx.globalCompositeOperation = 'lighter';
    // site grid on the ground plane, fading with distance
    ctx.lineWidth = 0.7 * scale;
    const G = 3.2, stp = 0.4;
    for (let k = -G; k <= G + 1e-6; k += stp) {
      for (const dir of [0, 1]) {
        ctx.beginPath();
        for (let s = -G; s <= G + 1e-6; s += stp / 2) {
          const v = dir ? [k, 0, s] : [s, 0, k];
          const p = this.project(v, 0.35, cx, cy, S);
          s === -G ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
        }
        ctx.globalAlpha = 0.07; ctx.strokeStyle = PAL[13]; ctx.stroke();
      }
    }
    // ground rings around the main dome
    for (let k = 1; k <= 6; k++) {
      ctx.globalAlpha = 0.12 - k * 0.012; ctx.strokeStyle = PAL[13];
      this.ring(k * 0.32, 0, rot, cx, cy, S); ctx.stroke();
    }
    // second, smaller dome (frequency 2) further back on the site
    const s2 = S * 0.42, c2x = cx - S * 1.55, c2y = cy - S * 0.22;
    this.drawDome(this.small, c2x, c2y, s2, -t * 0.045, 0.55, null);
    ctx.globalAlpha = 0.1; ctx.strokeStyle = PAL[13];
    this.ring(1.15, 0, 0, c2x, c2y, s2); ctx.stroke();
    // main dome with the scan plane
    this.drawDome(this.main, cx, cy, S, rot, 1, scan);
    const rr = Math.sqrt(Math.max(0, 1 - scan * scan));
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[21]; ctx.lineWidth = 1.2 * scale;
    this.ring(rr + 0.04, scan, rot, cx, cy, S); ctx.stroke();
    // plan view (top-down) of the main dome
    const pcx = W * 0.3, pcy = H * 0.76, pr = H * 0.1;
    ctx.lineWidth = 0.8 * scale;
    ctx.globalAlpha = 0.3; ctx.strokeStyle = PAL[14];
    ctx.beginPath(); ctx.arc(pcx, pcy, pr * 1.06, 0, TAU); ctx.stroke();
    const c = Math.cos(rot), sn = Math.sin(rot), V = this.main.verts;
    for (const [a, b] of this.main.edges) {
      const A = V[a], B = V[b];
      const ax = A[0] * c - A[2] * sn, az = A[0] * sn + A[2] * c, bx = B[0] * c - B[2] * sn, bz = B[0] * sn + B[2] * c;
      const hgt = (A[1] + B[1]) / 2;
      ctx.globalAlpha = 0.1 + 0.35 * hgt; ctx.strokeStyle = PAL[Math.round(12 + 8 * hgt)];
      ctx.beginPath(); ctx.moveTo(pcx + ax * pr, pcy + az * pr); ctx.lineTo(pcx + bx * pr, pcy + bz * pr); ctx.stroke();
    }
    // scan contour in plan
    ctx.globalAlpha = 0.6; ctx.strokeStyle = PAL[21];
    ctx.beginPath(); ctx.arc(pcx, pcy, rr * pr, 0, TAU); ctx.stroke();
    this._scan = scan; this._cx = cx; this._cy = cy; this._plan = [pcx, pcy, pr]; this._small = [c2x, c2y, s2];
  },
  drawOver(t) {
    if (!SETTINGS.math) return;
    const o = octx, cx = this._cx, cy = this._cy, S = this.S;
    o.strokeStyle = PAL[14]; o.fillStyle = PAL[16]; o.lineWidth = 0.8 * scale;
    o.font = MONO(10.5); o.textBaseline = 'middle';
    // diameter dimension line below the dome
    const L = this.project([-1, 0, 0], 0, cx, cy, S), R = this.project([1, 0, 0], 0, cx, cy, S);
    const y = cy + S * 0.62;
    o.globalAlpha = 0.45;
    o.beginPath(); o.moveTo(L[0], y); o.lineTo(R[0], y);
    o.moveTo(L[0], y - 6 * scale); o.lineTo(L[0], y + 6 * scale); o.moveTo(R[0], y - 6 * scale); o.lineTo(R[0], y + 6 * scale);
    o.stroke();
    o.globalAlpha = 0.7; o.textAlign = 'center';
    o.fillText('Ø = 2r', (L[0] + R[0]) / 2, y + 14 * scale);
    // height dimension at the right
    const top = this.project([0, 1, 0], 0, cx, cy, S), x = R[0] + 40 * scale;
    o.globalAlpha = 0.45;
    o.beginPath(); o.moveTo(x, top[1]); o.lineTo(x, cy);
    o.moveTo(x - 6 * scale, top[1]); o.lineTo(x + 6 * scale, top[1]); o.moveTo(x - 6 * scale, cy); o.lineTo(x + 6 * scale, cy);
    o.stroke();
    o.globalAlpha = 0.7; o.textAlign = 'left';
    o.fillText('h = r', x + 10 * scale, top[1]);
    const sp = this.project([0, this._scan, 0], 0, cx, cy, S);
    o.fillText(`scan  y/r = ${this._scan.toFixed(3)}`, x + 10 * scale, sp[1]);
    o.globalAlpha = 0.35;
    o.beginPath(); o.moveTo(x - 4 * scale, sp[1]); o.lineTo(x + 6 * scale, sp[1]); o.stroke();
    // plan + small dome labels
    const [pcx, pcy, pr] = this._plan;
    o.globalAlpha = 0.6; o.textAlign = 'center';
    o.fillText('PLAN  (top view)', pcx, pcy + pr * 1.06 + 16 * scale);
    o.globalAlpha = 0.45;
    o.fillText(`scan circle  r' = r√(1 − y²) = ${Math.sqrt(Math.max(0, 1 - this._scan ** 2)).toFixed(3)} r`, pcx, pcy + pr * 1.06 + 32 * scale);
    const [sx, sy, ss] = this._small;
    o.globalAlpha = 0.55;
    o.fillText(`ν = 2 · V ${this.small.V} · E ${this.small.E} · F ${this.small.F}`, sx, sy + ss * 0.55 + 18 * scale);
  },
  hud() { return ['strut lengths from chord = 2r sin(α/2)']; }
};
