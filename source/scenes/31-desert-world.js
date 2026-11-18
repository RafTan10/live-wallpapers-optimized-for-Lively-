// Original desert-world epic — a binary-star desert planet. A ringed gas giant rises over a sea of dunes,
// an ancient city is carved into the mesas, wind-yachts sail the sand, a storm wall advances from the west,
// and half-buried monoliths carry inscriptions. All of it annotated with the physics of such a world.
const SCENE = {
  focus: [0.74, 0.24],
  glow: 0.32,
  ambient: false,
  anchors: [[0.42, 0.05], [0.56, 0.12], [0.42, 0.18], [0.6, 0.04], [0.5, 0.26], [0.36, 0.1]],
  title: 'DESERT WORLD · CIRCUMBINARY PLANET',
  sub: 'two suns · ringed giant moon-host · dune sea',
  eqs: [
    { e: 'T² = 4π² a³ / G(M₁ + M₂)', n: 'the two suns orbit their common centre of mass' },
    { e: 'm₁ r₁ = m₂ r₂', n: 'balance point (barycentre) of the binary' },
    { e: 'S = L₁ / 4πd₁² + L₂ / 4πd₂²', n: 'sunlight on the surface from both stars' },
    { e: 'd_Roche ≈ 2.44 R (ρ_M / ρ_m)^(1/3)', n: 'inside this limit a moon is torn into rings' },
    { e: 'P = ½ ρ A v³ C_p', n: 'power a sail can draw from the wind' },
    { e: 'w_s = (ρ_p − ρ_a) g d² / 18μ', n: 'settling speed of dust in a storm (Stokes)' },
    { e: 'T_eq = T★ √(R★ / 2d) (1 − A)^(1/4)', n: 'equilibrium temperature of the planet' }
  ],
  init() {
    this.horizon = H * 0.6;
    this.stars = [];
    for (let i = 0; i < 240; i++) this.stars.push([Math.random(), Math.random() * 0.55, rand(0.05, 0.4), rand(0, TAU)]);
    this.L = 4;
    this.yachts = [0, 1, 2].map(i => ({ u: rand(0.2, 0.9), v: rand(0.006, 0.011), layer: 1 + i, s: 0.9 + i * 0.4, trail: [] }));
    this.dust = [];
    for (let i = 0; i < 220; i++) this.dust.push({ x: Math.random() * 0.4, y: rand(0.25, 0.95), v: rand(0.02, 0.06), a: rand(0.1, 0.4), ph: rand(0, TAU) });
    this.city = this.buildCity();
    this.walker = 0.55;
  },
  // far mesas with a city cut into their cliffs (pre-rendered; static)
  buildCity() {
    const c = document.createElement('canvas'); c.width = base.width; c.height = base.height;
    const g = c.getContext('2d'); g.setTransform(DPR, 0, 0, DPR, 0, 0);
    const hz = this.horizon;
    const mesas = [[0.4, 0.52, 0.11], [0.5, 0.66, 0.16], [0.68, 0.78, 0.09], [0.86, 1.02, 0.13]];
    this.mesas = mesas;
    for (const [a, b, h] of mesas) {
      const x0 = a * W, x1 = b * W, top = hz - h * H, step = (x1 - x0) * 0.08;
      g.beginPath(); g.moveTo(x0 - step * 1.4, hz);
      g.lineTo(x0, top + step * 0.3); g.lineTo(x0 + step, top); g.lineTo(x1 - step, top); g.lineTo(x1, top + step * 0.4); g.lineTo(x1 + step * 1.2, hz); g.closePath();
      g.fillStyle = DARK(9); g.fill();
      g.strokeStyle = PAL[16]; g.globalAlpha = 0.45; g.lineWidth = 1 * scale; g.stroke();
      // strata
      g.globalAlpha = 0.12; g.beginPath();
      for (let k = 1; k < 9; k++) { const y = top + (hz - top) * k / 9; g.moveTo(x0 - step * 1.4 * k / 9, y); g.lineTo(x1 + step * 1.2 * k / 9, y); }
      g.stroke();
      // carved terraces, arched doorways and windows
      g.globalAlpha = 0.5; g.strokeStyle = PAL[18]; g.lineWidth = 0.8 * scale;
      const rows = Math.floor((hz - top) / (14 * scale));
      for (let r = 1; r < rows; r++) {
        const y = top + r * 14 * scale, inset = step * 1.3 * r / rows;
        g.beginPath(); g.moveTo(x0 + inset * 0.2, y + 6 * scale); g.lineTo(x1 - inset * 0.2, y + 6 * scale); g.globalAlpha = 0.15; g.stroke();
        for (let x = x0 + step * 0.6; x < x1 - step * 0.6; x += 11 * scale) {
          if (hash(x * 0.37 + r * 13.1) > 0.16) continue;
          const lit = hash(x * 1.7 + r) < 0.45;
          g.globalAlpha = lit ? 0.75 : 0.3; g.fillStyle = PAL[lit ? 22 : 14];
          g.beginPath(); g.moveTo(x - 2 * scale, y + 5 * scale); g.lineTo(x - 2 * scale, y); g.arc(x, y, 2 * scale, Math.PI, 0); g.lineTo(x + 2 * scale, y + 5 * scale); g.closePath(); g.fill();
        }
      }
    }
    // a great spire on the largest mesa
    const sx = 0.58 * W, st = hz - 0.16 * H;
    g.globalAlpha = 1; g.fillStyle = DARK(8);
    g.beginPath(); g.moveTo(sx - 14 * scale, st); g.lineTo(sx - 4 * scale, st - H * 0.2); g.lineTo(sx, st - H * 0.24); g.lineTo(sx + 4 * scale, st - H * 0.2); g.lineTo(sx + 14 * scale, st); g.closePath(); g.fill();
    g.globalAlpha = 0.6; g.strokeStyle = PAL[19]; g.stroke();
    g.globalAlpha = 0.25; g.beginPath();
    for (let k = 1; k < 8; k++) { const y = st - H * 0.2 * k / 8, w = 14 * scale * (1 - k / 8) + 4 * scale * k / 8; g.moveTo(sx - w, y); g.lineTo(sx + w, y); }
    g.stroke();
    this.spire = [sx, st - H * 0.24];
    return c;
  },
  dune(i, x, t) {
    const z = 1 + i * 0.7, sp = 0.004 / z;
    const per = W * (0.55 - i * 0.07), u = (x / per + t * sp * 3 + i * 0.41 + 0.35 * noise3(x * 0.0011 / scale + i * 5, i, 4));
    const f = u - Math.floor(u);
    const prof = f < 0.8 ? Math.sin((f / 0.8) * Math.PI / 2) : Math.cos(((f - 0.8) / 0.2) * Math.PI / 2);
    const amp = H * (0.05 + i * 0.035) * (0.8 + 0.4 * noise3(Math.floor(u) * 0.7, i, 1));
    return [H * (0.64 + i * 0.09) - prof * amp, f];
  },
  update(dt, t) {
    for (const y of this.yachts) { y.u += y.v * dt; if (y.u > 1.1) { y.u = -0.1; y.trail = []; } }
    for (const d of this.dust) { d.x += d.v * dt; if (d.x > 0.42 + 0.05 * Math.sin(t * 0.1)) { d.x = 0; d.y = rand(0.25, 0.95); } }
    this.walker += dt * 0.0022; if (this.walker > 0.98) this.walker = 0.5;
  },
  draw(t, ox, oy) {
    const hz = this.horizon + oy * 0.3;
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.stars) { ctx.globalAlpha = s[2] * (0.75 + 0.25 * Math.sin(t * 0.4 + s[3])); ctx.fillStyle = PAL[19]; ctx.fillRect(s[0] * W, s[1] * H, 1.3 * scale, 1.3 * scale); }
    // binary suns orbiting their barycentre
    const bx = this.focus[0] * W + ox * 0.15, by = this.focus[1] * H + oy * 0.15, ob = t * TAU / 90;
    const s1 = [bx + Math.cos(ob) * 46 * scale, by + Math.sin(ob) * 18 * scale], s2 = [bx - Math.cos(ob) * 74 * scale, by - Math.sin(ob) * 29 * scale];
    for (const [p, r, a] of [[s1, H * 0.032, 0.45], [s2, H * 0.022, 0.35]]) {
      const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 3);
      g.addColorStop(0, shade(1, a)); g.addColorStop(0.33, shade(0.9, a * 0.5)); g.addColorStop(1, shade(0.7, 0));
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(p[0] - r * 3, p[1] - r * 3, r * 6, r * 6);
      ctx.globalAlpha = 0.6; ctx.strokeStyle = PAL[22]; ctx.lineWidth = 1 * scale; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.stroke();
    }
    this.suns = [s1, s2, [bx, by]];
    // ringed gas giant rising behind the horizon
    const gx = W * 0.3 + ox * 0.2, gy = hz + H * 0.04, gr = H * 0.26, tilt = -0.32;
    const ring = (front) => {
      for (let k = 0; k < 7; k++) {
        if (k === 3) continue;                                 // a gap in the rings
        const rr = gr * (1.35 + k * 0.09);
        ctx.globalAlpha = 0.3 + 0.08 * (k % 3); ctx.strokeStyle = PAL[19]; ctx.lineWidth = (1 + (k % 2)) * scale;
        ctx.beginPath(); ctx.ellipse(gx, gy, rr, rr * 0.22, tilt, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.stroke();
      }
    };
    ring(false);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, hz); ctx.clip();
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = DARK(6);
    ctx.beginPath(); ctx.arc(gx, gy, gr, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.save(); ctx.beginPath(); ctx.arc(gx, gy, gr, 0, TAU); ctx.clip();
    ctx.translate(gx, gy); ctx.rotate(tilt);
    for (let k = -9; k <= 9; k++) {
      const y = k * gr / 9.5, w = Math.sqrt(Math.max(0, gr * gr - y * y));
      ctx.globalAlpha = 0.1 + 0.08 * Math.abs(Math.sin(k * 1.7)); ctx.strokeStyle = PAL[15]; ctx.lineWidth = (1 + Math.abs(k % 3)) * scale;
      ctx.beginPath(); ctx.moveTo(-w, y); for (let x = -w; x <= w; x += 8 * scale) ctx.lineTo(x, y + Math.sin(x * 0.03 / scale + k + t * 0.05) * 1.5 * scale); ctx.stroke();
    }
    ctx.restore();
    // lit limb toward the suns
    ctx.globalAlpha = 0.55; ctx.strokeStyle = PAL[20]; ctx.lineWidth = 1.4 * scale;
    ctx.beginPath(); ctx.arc(gx, gy, gr, -Math.PI * 0.55, Math.PI * 0.15); ctx.stroke();
    ctx.globalAlpha = 0.2; ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI * 0.15, Math.PI * 1.45); ctx.stroke();
    ring(true);
    ctx.restore();
    this.giant = [gx, gy, gr];
    // the storm wall advancing from the west
    const sw = W * (0.2 + 0.03 * Math.sin(t * 0.05));
    ctx.globalCompositeOperation = 'source-over';
    for (let layer = 0; layer < 3; layer++) {
      const edge = [];
      for (let y = H; y >= -10; y -= 8 * scale) {
        const f = 1 - y / H;
        const x = sw * (1 - layer * 0.22) * (1 + 0.5 * f) + noise3(y * 0.006 / scale, t * 0.08 + layer, layer) * W * 0.05 - f * f * W * 0.04;
        edge.push([x, y]);
      }
      const gr = ctx.createLinearGradient(0, H, 0, 0);
      gr.addColorStop(0, DARK(10 - layer * 2.5)); gr.addColorStop(1, `hsla(${theme.hue},${Math.min(theme.sat, 10)}%,${10 - layer * 2.5}%,0)`);
      ctx.beginPath(); ctx.moveTo(0, H); for (const [x, y] of edge) ctx.lineTo(x, y); ctx.lineTo(0, -10); ctx.closePath();
      ctx.globalAlpha = 0.55 + layer * 0.15; ctx.fillStyle = gr; ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath(); edge.forEach(([x, y], k) => { if (y < H * 0.15) return; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.globalAlpha = 0.16; ctx.strokeStyle = PAL[16]; ctx.lineWidth = 1 * scale; ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalCompositeOperation = 'lighter';
    // billows inside the storm
    for (let k = 0; k < 26; k++) {
      const y = H * (0.25 + 0.7 * hash(k)), x = sw * (0.3 + 0.6 * hash(k + 9)) + Math.sin(t * 0.2 + k) * 12 * scale, r = (18 + 40 * hash(k + 3)) * scale;
      ctx.globalAlpha = 0.08; ctx.strokeStyle = PAL[16]; ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    }
    ctx.fillStyle = PAL[18];
    for (const d of this.dust) { ctx.globalAlpha = d.a * (1 - d.x / 0.45); ctx.fillRect(d.x * W, d.y * H + Math.sin(t + d.ph) * 4 * scale, 2 * scale, 1 * scale); }
    this.storm = sw;
    // mesas and the carved city
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.drawImage(this.city, ox * 0.35, oy * 0.3, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const [spx, spy] = this.spire;
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 0.8); ctx.fillStyle = PAL[23]; ctx.fillRect(spx + ox * 0.35 - 1.5 * scale, spy + oy * 0.3 - 4 * scale, 3 * scale, 3 * scale);
    // dune sea
    const step = 5 * scale;
    this.ridges = [];
    for (let i = 0; i < this.L; i++) {
      const pts = [];
      for (let x = -step; x <= W + step; x += step) { const [y, f] = this.dune(i, x, t); pts.push([x, y + oy * (0.3 + i * 0.15), f]); }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = DARK(13 - i * 2.8);
      ctx.beginPath(); ctx.moveTo(pts[0][0], H); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.lineTo(W + step, H); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = (0.8 + i * 0.2) * scale;
      for (let k = 1; k < pts.length; k++) {
        const lee = pts[k][2] > 0.8;
        ctx.globalAlpha = lee ? 0.15 : 0.32 + i * 0.1; ctx.strokeStyle = PAL[lee ? 13 : 17 + i];
        ctx.beginPath(); ctx.moveTo(pts[k - 1][0], pts[k - 1][1]); ctx.lineTo(pts[k][0], pts[k][1]); ctx.stroke();
      }
      if (i >= 1) {
        ctx.lineWidth = 0.6 * scale; ctx.strokeStyle = PAL[15];
        for (let r = 1; r <= 5 + i * 3; r++) {
          const d = r * (6 + i * 3) * scale;
          ctx.globalAlpha = 0.13; ctx.beginPath(); let pen = false;
          for (const [x, y, f] of pts) { if (f > 0.78 || f < 0.05) { pen = false; continue; } const yy = y + d + Math.sin(x * 0.03 / scale + r) * 2 * scale; pen ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); pen = true; }
          ctx.stroke();
        }
      }
      this.ridges.push(pts);
      // wind-yachts sailing on this layer
      for (const yt of this.yachts) {
        if (yt.layer !== i) continue;
        const x = yt.u * W, k = clamp(Math.round((x + step) / step), 0, pts.length - 1), y = pts[k][1], s = yt.s * scale;
        yt.trail.push([x, y]); if (yt.trail.length > 40) yt.trail.shift();
        ctx.fillStyle = PAL[17];
        yt.trail.forEach((p, j) => { ctx.globalAlpha = 0.25 * j / 40; ctx.fillRect(p[0] - (40 - j) * 0.8 * s, p[1] - 3 * s - (40 - j) * 0.15 * s + Math.sin(j + t) * 2 * s, 2 * s, 2 * s); });
        ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = DARK(3); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.moveTo(x - 16 * s, y - 4 * s); ctx.lineTo(x + 16 * s, y - 4 * s); ctx.lineTo(x + 10 * s, y - 8 * s); ctx.lineTo(x - 12 * s, y - 8 * s); ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.75; ctx.strokeStyle = PAL[20]; ctx.lineWidth = 1 * scale;
        ctx.beginPath(); ctx.moveTo(x - 16 * s, y - 4 * s); ctx.lineTo(x + 16 * s, y - 4 * s); ctx.lineTo(x + 10 * s, y - 8 * s); ctx.lineTo(x - 12 * s, y - 8 * s); ctx.closePath();
        ctx.moveTo(x, y - 8 * s); ctx.lineTo(x, y - 52 * s);
        ctx.moveTo(x, y - 50 * s); ctx.quadraticCurveTo(x + 20 * s, y - 32 * s, x + 2 * s, y - 11 * s); ctx.lineTo(x, y - 11 * s);
        ctx.moveTo(x - 2 * s, y - 46 * s); ctx.quadraticCurveTo(x - 14 * s, y - 30 * s, x - 2 * s, y - 13 * s);
        ctx.moveTo(x - 14 * s, y - 4 * s); ctx.lineTo(x - 18 * s, y); ctx.moveTo(x + 13 * s, y - 4 * s); ctx.lineTo(x + 17 * s, y);
        ctx.stroke();
      }
    }
    // half-buried monoliths and a broken arch in the foreground
    const fy = H * 0.97 + oy;
    ctx.globalCompositeOperation = 'source-over';
    const mono = [[0.72, 0.26, 0.035, 0.08], [0.79, 0.18, 0.028, -0.12], [0.94, 0.3, 0.04, 0.04]];
    for (const [mxf, mh, mw, lean] of mono) {
      const x = mxf * W + ox, h = mh * H, w = mw * W;
      ctx.save(); ctx.translate(x, fy); ctx.rotate(lean);
      ctx.globalAlpha = 1; ctx.fillStyle = DARK(4);
      ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -h); ctx.lineTo(-w * 0.1, -h - w * 0.4); ctx.lineTo(w / 2, -h * 0.9); ctx.lineTo(w / 2, 0); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55; ctx.strokeStyle = PAL[18]; ctx.lineWidth = 1 * scale; ctx.stroke();
      // inscriptions
      ctx.font = MONO(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL[17];
      for (let r = 0; r < Math.floor(h / (14 * scale)) - 1; r++) for (let c = 0; c < 3; c++) {
        const ch = GLYPHS[Math.floor(hash(mxf * 100 + r * 7 + c) * GLYPHS.length)];
        ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 0.3 + r * 0.5 + c);
        ctx.fillText(ch, (c - 1) * w * 0.28, -h * 0.85 + r * 14 * scale);
      }
      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5; ctx.strokeStyle = PAL[18]; ctx.lineWidth = 1.2 * scale;
    const ax = W * 0.86 + ox, ar = W * 0.035;
    ctx.beginPath(); ctx.moveTo(ax - ar, fy); ctx.lineTo(ax - ar, fy - H * 0.12); ctx.arc(ax, fy - H * 0.12, ar, Math.PI, Math.PI * 1.62); ctx.stroke();
    // a lone traveller walking toward the ruins
    const wx = this.walker * W + ox, wy = this.ridges[this.L - 1][clamp(Math.round((this.walker * W + step) / step), 0, this.ridges[this.L - 1].length - 1)][1], st = Math.sin(t * 2.2) * 3 * scale;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.strokeStyle = DARK(2); ctx.fillStyle = DARK(2); ctx.lineWidth = 2.4 * scale;
    ctx.beginPath(); ctx.moveTo(wx, wy - 14 * scale); ctx.lineTo(wx - st, wy); ctx.moveTo(wx, wy - 14 * scale); ctx.lineTo(wx + st, wy); ctx.moveTo(wx, wy - 14 * scale); ctx.lineTo(wx, wy - 28 * scale); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(wx - 6 * scale, wy - 12 * scale); ctx.lineTo(wx, wy - 31 * scale); ctx.lineTo(wx + 6 * scale, wy - 12 * scale); ctx.fill();
    ctx.beginPath(); ctx.arc(wx, wy - 32 * scale, 3.5 * scale, 0, TAU); ctx.fill();
    ctx.lineWidth = 1.4 * scale; ctx.beginPath(); ctx.moveTo(wx + 7 * scale, wy - 36 * scale); ctx.lineTo(wx + 7 * scale + st * 0.3, wy); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.4; ctx.strokeStyle = PAL[18]; ctx.lineWidth = 0.8 * scale;
    ctx.beginPath(); ctx.arc(wx, wy - 32 * scale, 3.5 * scale, Math.PI * 1.2, Math.PI * 1.9); ctx.stroke();
  },
  drawOver(t) {
    if (!SETTINGS.math || !this.suns) return;
    const o = octx;
    o.font = MONO(10.5); o.textBaseline = 'middle'; o.textAlign = 'left'; o.lineWidth = 0.8 * scale;
    // binary orbit: barycentre and the two paths
    const [s1, s2, bc] = this.suns;
    o.globalAlpha = 0.35; o.strokeStyle = PAL[18]; o.setLineDash([2 * scale, 4 * scale]);
    o.beginPath(); o.ellipse(bc[0], bc[1], 46 * scale, 18 * scale, 0, 0, TAU); o.stroke();
    o.beginPath(); o.ellipse(bc[0], bc[1], 74 * scale, 29 * scale, 0, 0, TAU); o.stroke(); o.setLineDash([]);
    o.globalAlpha = 0.8; o.fillStyle = PAL[20]; o.beginPath(); o.arc(bc[0], bc[1], 2 * scale, 0, TAU); o.fill();
    o.globalAlpha = 0.6;
    o.fillText('barycentre · M₁ / M₂ = r₂ / r₁ ≈ 1.6', bc[0] - 60 * scale, bc[1] + 54 * scale);
    o.fillText(`binary phase ${((t / 90) % 1 * 360).toFixed(0).padStart(3, '0')}°`, bc[0] - 60 * scale, bc[1] + 70 * scale);
    // ring annotation
    const [gx, gy, gr] = this.giant;
    o.globalAlpha = 0.45; o.strokeStyle = PAL[17];
    const px = gx + Math.cos(-0.32) * gr * 1.62, py = gy + Math.sin(-0.32) * gr * 1.62;
    o.beginPath(); o.moveTo(px, py); o.lineTo(px + 40 * scale, py - 50 * scale); o.lineTo(px + 60 * scale, py - 50 * scale); o.stroke();
    o.globalAlpha = 0.6; o.fillStyle = PAL[18];
    o.fillText('rings inside the Roche limit ≈ 2.44 R', px + 66 * scale, py - 50 * scale);
    o.globalAlpha = 0.45;
    o.fillText('gap: orbital resonance with an inner moon', px + 66 * scale, py - 34 * scale);
    // storm front readout
    o.globalAlpha = 0.6; o.fillStyle = PAL[18];
    o.fillText(`STORM FRONT  x = ${(this.storm / W * 100).toFixed(1)}%  ·  gusts ≈ 30 m/s`, this.storm + 14 * scale, H * 0.2);
    o.globalAlpha = 0.45;
    const P = 0.5 * 1.2 * 12 * 12 ** 3 * 0.35;
    o.fillText(`sail: P = ½ρAv³C_p ≈ ${(P / 1000).toFixed(1)} kW  (A = 12 m², v = 12 m/s)`, W * 0.44, H * 0.92);
  },
  hud(t) { return ['three wind-yachts · one traveller', `local time: ${(((t / 120) % 1) * 24).toFixed(1).padStart(4, '0')} h (two-sun day)`]; }
};
