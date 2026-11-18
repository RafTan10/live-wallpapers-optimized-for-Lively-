// Realistic — a slow flight over an endless sea of dunes at golden hour. The terrain is a lit 3D heightfield
// with cast shadows; a low sun burns through the haze, sand streams on the wind and a caravan crosses far ahead.
const SCENE = {
  focus: [0.66, 0.47],
  glow: 0,
  ambient: false,
  dust: false,
  anchors: [[0.3, 0.08], [0.5, 0.05], [0.3, 0.18], [0.5, 0.14], [0.3, 0.28], [0.5, 0.24]],
  title: 'ERG · GOLDEN HOUR',
  sub: 'sun elevation ≈ 4° · flying above the crests',
  eqs: [
    { e: 'I = I₀ e^(−τ / sin α)', n: 'a low sun shines through far more air' },
    { e: 'q ∝ u*³', n: 'sand flux grows with the cube of wind friction speed' },
    { e: 'θ_r ≈ 34°', n: 'angle of repose — the steep slip face' },
    { e: 'L_shadow = h / tan α', n: 'shadows stretch as the sun sinks' }
  ],
  init() {
    const warm = SETTINGS.palette !== 'grey', g = c => warm ? c : toGrey(c);
    this.C = { skyTop: g([30, 18, 14]), skyMid: g([112, 62, 34]), skyHz: g([242, 176, 108]), sun: g([255, 236, 198]), fog: g([236, 168, 104]) };
    this.T = TERRAIN.build({ N: 1024, lambda: 120, amp: 40, angle: 0.4, az: 0.45, el: 0.07, ambient: 0.16, gain: 1.7, second: 0.12, rough: 0.25 });
    this.lut = TERRAIN.lut([[0, g([30, 15, 9])], [0.1, g([62, 32, 18])], [0.28, g([128, 70, 38])], [0.5, g([206, 132, 74])], [0.75, g([248, 190, 124])], [1, g([255, 234, 196])]]);
    this.RW = Math.round(W / 2); this.RH = Math.round(H / 2);
    this.cv = document.createElement('canvas'); this.cv.width = this.RW; this.cv.height = this.RH;
    this.cx2 = this.cv.getContext('2d'); this.img = this.cx2.createImageData(this.RW, this.RH);
    this.buf = new Uint32Array(this.img.data.buffer);
    this.cam = { x: 300, z: 100, h: 60, yaw: 0, fov: 1.05, horizon: 0.47 };
    this.camH = 60;
    this.streaks = [];
    for (let i = 0; i < 140; i++) this.streaks.push({ x: Math.random(), y: rand(0.62, 1), v: rand(0.05, 0.14), l: rand(20, 70), a: rand(0.04, 0.14) });
    this.motes = [];
    for (let i = 0; i < 80; i++) this.motes.push({ x: Math.random(), y: rand(0.2, 0.7), ph: rand(0, TAU), s: rand(0.6, 2) });
  },
  update(dt, t) {
    const c = this.cam;
    c.z += dt * 2.2 * SETTINGS.speed;
    c.x = 300 + Math.sin(t * 0.008) * 120;
    c.yaw = 0.12 * Math.sin(t * 0.011);
    let mx = 0; for (let k = 0; k < 5; k++) mx = Math.max(mx, TERRAIN.sample(this.T, c.x + Math.sin(c.yaw) * k * 12, c.z + k * 12));
    this.camH += ((mx + 30) - this.camH) * Math.min(1, dt * 0.5);
    c.h = this.camH;
    for (const s of this.streaks) { s.x += s.v * dt; if (s.x > 1.1) { s.x = -0.1; s.y = rand(0.62, 1); } }
    for (const m of this.motes) { m.x += dt * 0.003; if (m.x > 1) m.x = 0; }
  },
  project(wx, wz, hh) {
    const c = this.cam, RW = this.RW, RH = this.RH;
    const dx = wx - c.x, dz = wz - c.z, cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
    const lx = dx * cy - dz * sy, lz = dx * sy + dz * cy;
    if (lz < 1) return null;
    const focal = (RW / 2) / Math.tan(c.fov / 2);
    return [(RW / 2 + lx / lz * focal) * W / RW, (RH * c.horizon + (c.h - hh) / lz * focal) * H / RH, lz];
  },
  draw(t, ox, oy) {
    const C = this.C, hz = H * this.cam.horizon;
    const sx = this.focus[0] * W + ox * 0.1, sy = this.focus[1] * H - H * 0.03 + oy * 0.1;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const sky = ctx.createLinearGradient(0, 0, 0, hz + H * 0.05);
    sky.addColorStop(0, rgba(C.skyTop)); sky.addColorStop(0.6, rgba(C.skyMid)); sky.addColorStop(1, rgba(C.skyHz));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    let g = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * 0.95);
    g.addColorStop(0, rgba(C.sun, 0.5)); g.addColorStop(0.07, rgba(C.sun, 0.25)); g.addColorStop(0.35, rgba(C.fog, 0.1)); g.addColorStop(1, rgba(C.fog, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    g = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * 0.03);
    g.addColorStop(0, rgba([255, 253, 242])); g.addColorStop(0.75, rgba(C.sun)); g.addColorStop(1, rgba(C.sun, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, H * 0.03, 0, TAU); ctx.fill();
    // terrain
    TERRAIN.render(this.T, this.cam, this.buf, this.RW, this.RH, this.lut, C.fog, 1000, 0.0028);
    this.cx2.putImageData(this.img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.cv, -12 * scale + ox * 0.3, -12 * scale + oy * 0.3, W + 24 * scale, H + 24 * scale);
    // light scattering over the land near the sun
    ctx.globalCompositeOperation = 'lighter';
    g = ctx.createRadialGradient(sx, hz, 0, sx, hz, W * 0.45);
    g.addColorStop(0, rgba(C.sun, 0.28)); g.addColorStop(0.3, rgba(C.fog, 0.1)); g.addColorStop(1, rgba(C.fog, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let k = 0; k < 6; k++) {
      const y = sy + (k - 2) * H * 0.011 + Math.sin(t * 0.05 + k) * 2 * scale;
      const hg = ctx.createLinearGradient(sx - W * 0.3, 0, sx + W * 0.3, 0);
      hg.addColorStop(0, rgba(C.fog, 0)); hg.addColorStop(0.5, rgba(C.sun, 0.06)); hg.addColorStop(1, rgba(C.fog, 0));
      ctx.fillStyle = hg; ctx.fillRect(sx - W * 0.3, y, W * 0.6, (1 + k % 3) * scale);
    }
    // a far caravan walking across the dunes
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = rgba([20, 10, 6], 0.9);
    const base = this.cam.z + 260, bx0 = 300 + ((t * 0.9) % 260) - 130;
    for (let k = 0; k < 8; k++) {
      const wx = bx0 + k * 2.2, wz = base + k * 0.6, hh = TERRAIN.sample(this.T, wx, wz);
      const p = this.project(wx, wz, hh + 0.5); if (!p) continue;
      const s = Math.max(0.6, 90 / p[2]) * scale, bob = Math.sin(t * 3 + k) * 0.3 * s;
      ctx.fillRect(p[0] - 2.2 * s, p[1] - 4 * s + bob, 4.4 * s, 2.2 * s); ctx.fillRect(p[0] + 1.2 * s, p[1] - 6 * s + bob, 1 * s, 2.5 * s);
      ctx.fillRect(p[0] - 1.8 * s, p[1] - 2 * s, 0.6 * s, 2 * s); ctx.fillRect(p[0] + 1.2 * s, p[1] - 2 * s, 0.6 * s, 2 * s);
    }
    // wind-blown sand sheets low over the ground
    ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1 * scale;
    for (const s of this.streaks) {
      ctx.globalAlpha = s.a; ctx.strokeStyle = rgba(C.sun);
      const x = s.x * W, y = s.y * H + Math.sin(t * 0.7 + s.y * 20) * 3 * scale;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s.l * scale, y + 2 * scale); ctx.stroke();
    }
    for (const m of this.motes) {
      const x = m.x * W, y = m.y * H + Math.sin(t * 0.4 + m.ph) * 6 * scale;
      const near = Math.max(0, 1 - Math.hypot(x - sx, y - sy) / (W * 0.45));
      ctx.globalAlpha = 0.1 + 0.5 * near; ctx.fillStyle = rgba(C.sun); ctx.fillRect(x, y, m.s * scale, m.s * scale);
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const v = ctx.createRadialGradient(W * 0.6, H * 0.5, H * 0.35, W * 0.6, H * 0.5, W * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  },
  hud() { return [`distance flown ${(this.cam.z * 0.012).toFixed(2)} km`]; }
};
