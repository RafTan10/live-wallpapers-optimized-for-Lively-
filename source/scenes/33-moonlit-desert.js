// Realistic — a moonlit desert. Cold light from a high moon falls across a slowly drifting dune field
// under a dense band of stars; a small camp glows in a hollow and the occasional meteor crosses the sky.
const SCENE = {
  focus: [0.3, 0.2],
  glow: 0,
  ambient: false,
  dust: false,
  anchors: [[0.5, 0.06], [0.62, 0.12], [0.5, 0.2], [0.66, 0.26], [0.42, 0.3], [0.7, 0.06]],
  title: 'DESERT · MOONLIGHT',
  sub: 'moon elevation ≈ 32° · no light pollution',
  eqs: [
    { e: 'm = −2.5 log₁₀(F / F₀)', n: 'star brightness on the magnitude scale' },
    { e: 'E_moon ≈ 0.25 lx', n: 'full-moon illuminance — about 1/400 000 of sunlight' },
    { e: 'T_night ≈ T_day − 30 K', n: 'dry air loses heat fast after sunset' },
    { e: 'v_meteor ≈ 11–72 km/s', n: 'entry speed of a meteor' }
  ],
  init() {
    const warm = SETTINGS.palette !== 'grey', g = c => warm ? c : toGrey(c);
    this.C = { skyTop: g([6, 8, 16]), skyHz: g([30, 36, 52]), moon: g([236, 238, 246]), fog: g([28, 32, 46]), fire: g([255, 170, 90]) };
    this.T = TERRAIN.build({ N: 1024, lambda: 110, amp: 36, angle: -0.5, az: -0.9, el: 0.5, ambient: 0.1, gain: 1.1, second: 0.14, rough: 0.25, ripple: 0.04 });
    this.lut = TERRAIN.lut([[0, g([5, 6, 10])], [0.15, g([14, 15, 22])], [0.35, g([36, 38, 50])], [0.6, g([74, 76, 90])], [0.85, g([118, 118, 132])], [1, g([150, 150, 162])]]);
    this.RW = Math.round(W / 2); this.RH = Math.round(H / 2);
    this.cv = document.createElement('canvas'); this.cv.width = this.RW; this.cv.height = this.RH;
    this.cx2 = this.cv.getContext('2d'); this.img = this.cx2.createImageData(this.RW, this.RH);
    this.buf = new Uint32Array(this.img.data.buffer);
    this.cam = { x: 500, z: 300, h: 70, yaw: 0, fov: 1.05, horizon: 0.5 };
    this.camH = 70;
    // star field with a dense diagonal band (pre-rendered once)
    this.sky = document.createElement('canvas'); this.sky.width = base.width; this.sky.height = base.height;
    const s = this.sky.getContext('2d'); s.setTransform(DPR, 0, 0, DPR, 0, 0);
    for (let i = 0; i < 2600; i++) {
      const u = Math.random(), off = (Math.random() + Math.random() + Math.random() - 1.5) * 0.12;
      const inBand = Math.random() < 0.7;
      const x = inBand ? u * W : Math.random() * W, y = inBand ? (0.9 - 0.85 * u + off) * H * 0.55 : Math.random() * H * 0.55;
      const b = Math.random() ** 3;
      s.globalAlpha = 0.15 + 0.8 * b; s.fillStyle = rgba(g([220, 226, 255]));
      const r = (0.4 + 1.3 * b) * scale; s.fillRect(x, y, r, r);
    }
    for (let i = 0; i < 40; i++) {
      const u = Math.random(), x = u * W, y = (0.9 - 0.85 * u + (Math.random() - 0.5) * 0.15) * H * 0.55, r = rand(30, 90) * scale;
      const gr = s.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(g([120, 130, 170]), 0.05)); gr.addColorStop(1, rgba([0, 0, 0], 0));
      s.globalAlpha = 1; s.fillStyle = gr; s.fillRect(x - r, y - r, r * 2, r * 2);
    }
    this.bright = [];
    for (let i = 0; i < 14; i++) this.bright.push([Math.random(), Math.random() * 0.45, rand(0, TAU)]);
    this.meteor = null; this.next = rand(6, 14);
    this.camp = { x: 520, z: 520 };
  },
  update(dt, t) {
    const c = this.cam;
    c.z = 300 + t * 0.6 * SETTINGS.speed; c.x = 500 + Math.sin(t * 0.006) * 30;
    c.yaw = 0.25 * Math.sin(t * 0.004) + 0.1;
    let mx = 0; for (let k = 0; k < 5; k++) mx = Math.max(mx, TERRAIN.sample(this.T, c.x + Math.sin(c.yaw) * k * 12, c.z + k * 12));
    this.camH += ((mx + 32) - this.camH) * Math.min(1, dt * 0.5); c.h = this.camH;
    this.next -= dt;
    if (!this.meteor && this.next <= 0) { this.meteor = { x: rand(0.3, 0.9), y: rand(0.05, 0.25), vx: -rand(0.12, 0.2), vy: rand(0.05, 0.1), age: 0, life: 1.4 }; this.next = rand(14, 30); }
    if (this.meteor) { this.meteor.age += dt; if (this.meteor.age > this.meteor.life) this.meteor = null; }
    this.camp.z = c.z + 140;
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
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const sky = ctx.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, rgba(C.skyTop)); sky.addColorStop(1, rgba(C.skyHz));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(this.sky, ox * 0.1, oy * 0.1, W, H);
    for (const b of this.bright) {
      const tw = 0.7 + 0.3 * Math.sin(t * 0.8 + b[2]), x = b[0] * W, y = b[1] * H, r = 3.5 * tw * scale;
      ctx.globalAlpha = 0.7 * tw; ctx.strokeStyle = rgba(C.moon); ctx.lineWidth = 0.8 * scale;
      ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
    }
    if (this.meteor) {
      const m = this.meteor, k = m.age / m.life, x = (m.x + m.vx * m.age) * W, y = (m.y + m.vy * m.age) * H;
      const gr = ctx.createLinearGradient(x, y, x - m.vx * W * 0.4, y - m.vy * H * 0.4);
      gr.addColorStop(0, rgba(C.moon, 0.65 * Math.sin(Math.PI * k))); gr.addColorStop(1, rgba(C.moon, 0));
      ctx.globalAlpha = 1; ctx.strokeStyle = gr; ctx.lineWidth = 1.3 * scale;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - m.vx * W * 0.4, y - m.vy * H * 0.4); ctx.stroke();
    }
    // moon and halo
    const mx = this.focus[0] * W + ox * 0.1, my = this.focus[1] * H + oy * 0.1, mr = H * 0.035;
    let g = ctx.createRadialGradient(mx, my, 0, mx, my, H * 0.4);
    g.addColorStop(0, rgba(C.moon, 0.25)); g.addColorStop(0.1, rgba(C.moon, 0.08)); g.addColorStop(1, rgba(C.moon, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    g = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, 0, mx, my, mr);
    g.addColorStop(0, rgba(C.moon)); g.addColorStop(1, rgba(mixc(C.moon, [150, 150, 160], 0.4)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.18; ctx.fillStyle = rgba([90, 92, 104]);
    for (const [dx, dy, r] of [[-0.3, -0.15, 0.22], [0.2, 0.25, 0.16], [0.15, -0.35, 0.1], [-0.15, 0.4, 0.09]]) { ctx.beginPath(); ctx.arc(mx + dx * mr, my + dy * mr, r * mr, 0, TAU); ctx.fill(); }
    // terrain
    ctx.globalAlpha = 1;
    TERRAIN.render(this.T, this.cam, this.buf, this.RW, this.RH, this.lut, C.fog, 1000, 0.0024);
    this.cx2.putImageData(this.img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.cv, -12 * scale + ox * 0.3, -12 * scale + oy * 0.3, W + 24 * scale, H + 24 * scale);
    // a small camp in a hollow: tent silhouette and a gently flickering fire glow
    const cp = this.project(this.camp.x, this.camp.z, TERRAIN.sample(this.T, this.camp.x, this.camp.z));
    if (cp && cp[1] > hz) {
      const s = Math.max(0.5, 160 / cp[2]) * scale, fl = 0.85 + 0.1 * Math.sin(t * 2.3) + 0.05 * Math.sin(t * 5.1);
      ctx.globalCompositeOperation = 'lighter';
      g = ctx.createRadialGradient(cp[0] + 10 * s, cp[1] - 2 * s, 0, cp[0] + 10 * s, cp[1] - 2 * s, 60 * s);
      g.addColorStop(0, rgba(C.fire, 0.45 * fl)); g.addColorStop(0.2, rgba(C.fire, 0.15 * fl)); g.addColorStop(1, rgba(C.fire, 0));
      ctx.fillStyle = g; ctx.fillRect(cp[0] - 60 * s, cp[1] - 70 * s, 140 * s, 110 * s);
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = rgba([6, 6, 10]);
      ctx.beginPath(); ctx.moveTo(cp[0] - 9 * s, cp[1]); ctx.lineTo(cp[0] - 1 * s, cp[1] - 9 * s); ctx.lineTo(cp[0] + 7 * s, cp[1]); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.9 * fl; ctx.fillStyle = rgba(C.fire);
      ctx.beginPath(); ctx.ellipse(cp[0] + 10 * s, cp[1] - 1.5 * s, 1.6 * s, 2.4 * s, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.25; ctx.strokeStyle = rgba([180, 180, 190]); ctx.lineWidth = 1 * s;
      for (let k = 0; k < 4; k++) { const ph = (t * 0.2 + k / 4) % 1; ctx.beginPath(); ctx.arc(cp[0] + 10 * s + Math.sin(t + k) * 3 * s, cp[1] - 5 * s - ph * 40 * s, (2 + ph * 8) * s, 0, TAU); ctx.globalAlpha = 0.15 * (1 - ph); ctx.stroke(); }
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const v = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.35, W * 0.5, H * 0.5, W * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  },
  hud() { return ['camp · 1 fire']; }
};
