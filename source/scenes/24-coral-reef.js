// Nature — under the sea. Sunlight falls in shafts through the surface, a school of fish moves by the
// three boids rules, kelp sways, bubbles rise and swell as the pressure drops, corals branch on the floor.
const SCENE = {
  focus: [0.55, 0.0],
  glow: 0.32,
  anchors: [[0.24, 0.12], [0.46, 0.08], [0.22, 0.3], [0.62, 0.22], [0.24, 0.46], [0.5, 0.36]],
  title: 'CORAL REEF · COLLECTIVE MOTION',
  sub: 'boids: separation · alignment · cohesion',
  eqs: [
    { e: 'v ← v + w_s s + w_a a + w_c c', n: "Reynolds' boids: three local rules make a school" },
    { e: 'n₁ sin θ₁ = n₂ sin θ₂', n: "Snell's law — light bends entering the water" },
    { e: 'I(z) = I₀ e^(−k z)', n: 'light fades with depth' },
    { e: 'P = P₀ + ρ g h', n: 'pressure grows 1 atm every ≈ 10 m' },
    { e: 'P V = const', n: "Boyle's law — rising bubbles grow" },
    { e: 'n_water ≈ 1.33', n: 'refractive index of water' }
  ],
  init() {
    this.fish = [];
    for (let i = 0; i < 70; i++) this.fish.push({ x: rand(0.3, 0.8) * W, y: rand(0.3, 0.6) * H, vx: rand(-1, 1) * 40 * scale, vy: rand(-1, 1) * 20 * scale });
    this.kelp = [];
    for (let i = 0; i < 16; i++) this.kelp.push({ x: rand(0.22, 0.98), h: rand(0.25, 0.5), ph: rand(0, TAU), seg: 14 });
    this.bubbles = [];
    for (let i = 0; i < 36; i++) this.bubbles.push(this.newBubble(true));
    this.corals = [];
    for (let i = 0; i < 9; i++) this.corals.push({ x: rand(0.24, 0.98), s: rand(0.6, 1.2), seed: i * 31 + 7 });
    this.floor = H * 0.9;
  },
  newBubble(any) { return { x: rand(0.25, 0.98), y: any ? rand(0.2, 0.9) : 0.9, r: rand(1.2, 3), ph: rand(0, TAU) }; },
  update(dt, t) {
    const F = this.fish, R = 46 * scale, Rs = 16 * scale, vmax = 70 * scale;
    for (const f of F) {
      let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0;
      for (const g of F) {
        if (g === f) continue;
        const dx = g.x - f.x, dy = g.y - f.y, d = Math.hypot(dx, dy);
        if (d < R) { ax += g.vx; ay += g.vy; cx += g.x; cy += g.y; n++; if (d < Rs) { sx -= dx / (d + 1e-3); sy -= dy / (d + 1e-3); } }
      }
      if (n) { f.vx += ((ax / n - f.vx) * 0.6 + (cx / n - f.x) * 0.5) * dt; f.vy += ((ay / n - f.vy) * 0.6 + (cy / n - f.y) * 0.5) * dt; }
      f.vx += sx * 60 * scale * dt; f.vy += sy * 60 * scale * dt;
      // a slow wandering target keeps the school moving around the screen
      const tx = W * (0.6 + 0.3 * Math.sin(t * 0.07)), ty = H * (0.45 + 0.15 * Math.sin(t * 0.11));
      f.vx += (tx - f.x) * 0.04 * dt; f.vy += (ty - f.y) * 0.05 * dt;
      const v = Math.hypot(f.vx, f.vy); if (v > vmax) { f.vx *= vmax / v; f.vy *= vmax / v; }
      f.x += f.vx * dt; f.y += f.vy * dt;
    }
    for (const b of this.bubbles) { const depthK = 1 + (b.y - 0.2); b.y -= 0.035 * dt / depthK; b.x += Math.sin(t * 2 + b.ph) * 0.0006; if (b.y < 0.05) Object.assign(b, this.newBubble(false)); }
  },
  coral(x, y, ang, len, d, seed, out) {
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    out.push([x, y, x2, y2, d]);
    if (d <= 1) return;
    const h = hash(seed);
    this.coral(x2, y2, ang - 0.35 - h * 0.3, len * 0.75, d - 1, seed * 2 + 1, out);
    this.coral(x2, y2, ang + 0.35 + h * 0.3, len * 0.75, d - 1, seed * 2 + 2, out);
    if (h > 0.6) this.coral(x2, y2, ang, len * 0.7, d - 2, seed * 3 + 5, out);
  },
  draw(t, ox, oy) {
    ctx.globalCompositeOperation = 'lighter';
    // surface with refraction ripples
    ctx.lineWidth = 0.8 * scale;
    for (let k = 0; k < 4; k++) {
      ctx.globalAlpha = 0.25 - k * 0.05; ctx.strokeStyle = PAL[19];
      ctx.beginPath();
      for (let x = 0; x <= W; x += 10 * scale) { const y = H * 0.05 + k * 6 * scale + Math.sin(x * 0.012 / scale + t * 0.9 + k) * 3 * scale + Math.sin(x * 0.031 / scale - t * 1.3) * 1.5 * scale; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    // god rays: wedges from the surface, swaying with the waves
    for (let k = 0; k < 9; k++) {
      const x0 = W * (0.2 + k * 0.1) + Math.sin(t * 0.25 + k * 1.7) * W * 0.02, w0 = W * 0.018 * (1 + hash(k)), spread = W * 0.06;
      const g = ctx.createLinearGradient(0, H * 0.05, 0, H * 0.9);
      g.addColorStop(0, shade(0.9, 0.14)); g.addColorStop(1, shade(0.6, 0));
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 0.4 + k); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x0 - w0, H * 0.05); ctx.lineTo(x0 + w0, H * 0.05); ctx.lineTo(x0 + w0 + spread * 0.6 + W * 0.08, H * 0.9); ctx.lineTo(x0 - w0 + W * 0.08 - spread * 0.2, H * 0.9); ctx.closePath(); ctx.fill();
    }
    // caustic net on the sand
    ctx.lineWidth = 0.7 * scale; ctx.strokeStyle = PAL[18];
    for (let k = 0; k < 6; k++) {
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8 * scale) {
        const y = this.floor + k * 7 * scale + Math.sin(x * 0.02 / scale + t * 0.7 + k * 1.3) * 4 * scale + Math.sin(x * 0.047 / scale - t * 0.5 + k) * 2.5 * scale;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 0.4; ctx.strokeStyle = PAL[16]; ctx.lineWidth = 1 * scale;
    ctx.beginPath(); for (let x = 0; x <= W; x += 10 * scale) { const y = this.floor + noise3(x * 0.004, 2, 1) * 10 * scale; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    // corals
    for (const c of this.corals) {
      const segs = []; this.coral(c.x * W + ox * 0.6, this.floor, -Math.PI / 2, H * 0.05 * c.s, 6, c.seed, segs);
      ctx.strokeStyle = PAL[17];
      for (let d = 6; d >= 1; d--) {
        ctx.globalAlpha = 0.25 + 0.05 * d; ctx.lineWidth = (0.6 + d * 0.35) * scale;
        ctx.beginPath(); for (const sg of segs) if (sg[4] === d) { ctx.moveTo(sg[0], sg[1]); ctx.lineTo(sg[2], sg[3]); } ctx.stroke();
      }
    }
    // kelp
    for (const k of this.kelp) {
      let x = k.x * W + ox * 0.5, y = this.floor;
      const L = k.h * H / k.seg;
      ctx.beginPath(); ctx.moveTo(x, y);
      const pts = [];
      for (let i = 1; i <= k.seg; i++) {
        const a = -Math.PI / 2 + Math.sin(t * 0.5 + k.ph + i * 0.35) * 0.18 * (i / k.seg) + 0.08;
        x += Math.cos(a) * L; y += Math.sin(a) * L; ctx.lineTo(x, y); pts.push([x, y, a]);
      }
      ctx.globalAlpha = 0.4; ctx.strokeStyle = PAL[16]; ctx.lineWidth = 1.6 * scale; ctx.stroke();
      ctx.lineWidth = 0.8 * scale; ctx.beginPath();
      pts.forEach(([px, py, a], i) => { if (i % 2) return; const s = i % 4 ? 1 : -1, l = 10 * scale; ctx.moveTo(px, py); ctx.quadraticCurveTo(px + s * l * 0.6, py - l * 0.2, px + s * l, py + l * 0.3); });
      ctx.globalAlpha = 0.3; ctx.stroke();
    }
    // fish
    for (const f of this.fish) {
      const a = Math.atan2(f.vy, f.vx), s = 7 * scale, wig = Math.sin(t * 9 + f.x * 0.05) * 0.25;
      ctx.save(); ctx.translate(f.x + ox * 0.8, f.y + oy * 0.8); ctx.rotate(a);
      ctx.globalAlpha = 0.75; ctx.strokeStyle = PAL[21]; ctx.lineWidth = 1 * scale;
      ctx.beginPath(); ctx.moveTo(s, 0); ctx.quadraticCurveTo(0, -s * 0.45, -s * 0.8, 0); ctx.quadraticCurveTo(0, s * 0.45, s, 0);
      ctx.moveTo(-s * 0.8, 0); ctx.lineTo(-s * 1.3, -s * 0.4 + wig * s); ctx.lineTo(-s * 1.3, s * 0.4 + wig * s); ctx.closePath(); ctx.stroke();
      ctx.restore();
    }
    // bubbles (grow as they rise: V ∝ 1/P)
    ctx.strokeStyle = PAL[20]; ctx.lineWidth = 0.8 * scale;
    for (const b of this.bubbles) {
      const P = 1 + (b.y - 0.05) * 3, r = b.r * Math.cbrt(4 / P) * scale;
      ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(b.x * W, b.y * H, r, 0, TAU); ctx.stroke();
    }
  },
  drawOver(t) {
    if (!SETTINGS.math) return;
    const o = octx;
    // depth gauge with pressure on the right
    const x = W * 0.965, y0 = H * 0.08, y1 = this.floor;
    o.lineWidth = 0.8 * scale; o.globalAlpha = 0.4; o.strokeStyle = PAL[15];
    o.beginPath(); o.moveTo(x, y0); o.lineTo(x, y1); o.stroke();
    o.font = MONO(10); o.textBaseline = 'middle'; o.textAlign = 'right'; o.fillStyle = PAL[16];
    for (let k = 0; k <= 5; k++) {
      const y = lerp(y0, y1, k / 5), d = k * 6;
      o.beginPath(); o.moveTo(x - 5 * scale, y); o.lineTo(x, y); o.stroke();
      o.fillText(`${d} m  ${(1 + d / 10.06).toFixed(2)} atm  ${(100 * Math.exp(-0.12 * d)).toFixed(0)}% light`, x - 9 * scale, y);
    }
    // the school's centre and heading
    let cx = 0, cy = 0, vx = 0, vy = 0; for (const f of this.fish) { cx += f.x; cy += f.y; vx += f.vx; vy += f.vy; }
    const n = this.fish.length; cx /= n; cy /= n; vx /= n; vy /= n;
    let pol = 0; for (const f of this.fish) pol += f.vx * vx + f.vy * vy > 0 ? (f.vx * vx + f.vy * vy) / (Math.hypot(f.vx, f.vy) * Math.hypot(vx, vy) + 1e-6) : 0;
    o.globalAlpha = 0.55; o.strokeStyle = PAL[20]; o.setLineDash([2 * scale, 4 * scale]);
    o.beginPath(); o.arc(cx, cy, 6 * scale, 0, TAU); o.moveTo(cx, cy); o.lineTo(cx + vx * 1.2, cy + vy * 1.2); o.stroke(); o.setLineDash([]);
    o.textAlign = 'left'; o.fillStyle = PAL[18]; o.globalAlpha = 0.65;
    o.fillText(`school centre · polarisation φ = ${(pol / n).toFixed(2)}`, cx + 12 * scale, cy - 12 * scale);
  },
  hud() { return [`${this.fish.length} fish · neighbourhood radius 46 px`]; }
};
