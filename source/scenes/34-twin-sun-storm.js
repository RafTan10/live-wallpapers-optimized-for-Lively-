// Realistic — an alien desert under two setting suns. Towering rock buttes rise from the dunes, and a
// vast dust storm rolls in across the horizon, its billows lit from behind. Original world.
const SCENE = {
  focus: [0.62, 0.42],
  glow: 0,
  ambient: false,
  dust: false,
  anchors: [[0.3, 0.06], [0.5, 0.05], [0.3, 0.16], [0.52, 0.14], [0.3, 0.26], [0.52, 0.24]],
  title: 'TWIN SUNS · DUST FRONT',
  sub: 'circumbinary world · storm 40 km out',
  eqs: [
    { e: 'S = L₁ / 4πd₁² + L₂ / 4πd₂²', n: 'light from both stars adds up' },
    { e: 'w_s = (ρ_p − ρ_a) g d² / 18μ', n: 'how fast storm dust settles (Stokes)' },
    { e: 'τ = σ_ext ∫ n dl', n: 'optical depth — why the storm swallows the light' },
    { e: 'v_front ≈ 15–25 m/s', n: 'speed of a haboob-type dust front' }
  ],
  init() {
    const warm = SETTINGS.palette !== 'grey', g = c => warm ? c : toGrey(c);
    this.C = { skyTop: g([40, 22, 18]), skyMid: g([128, 70, 40]), skyHz: g([226, 150, 92]), sun: g([255, 230, 190]), sun2: g([255, 200, 160]), fog: g([196, 124, 76]), storm: g([84, 44, 24]), stormLit: g([246, 170, 104]) };
    this.T = TERRAIN.build({ N: 1024, lambda: 100, amp: 26, angle: 0.2, az: 0.25, el: 0.12, ambient: 0.16, gain: 1.6, second: 0.14, rough: 0.3, spires: { th: 0.5, height: 75 } });
    this.lut = TERRAIN.lut([[0, g([26, 13, 8])], [0.12, g([58, 30, 17])], [0.3, g([118, 64, 36])], [0.55, g([196, 122, 70])], [0.8, g([242, 180, 116])], [1, g([255, 226, 186])]]);
    this.RW = Math.round(W / 2); this.RH = Math.round(H / 2);
    this.cv = document.createElement('canvas'); this.cv.width = this.RW; this.cv.height = this.RH;
    this.cx2 = this.cv.getContext('2d'); this.img = this.cx2.createImageData(this.RW, this.RH);
    this.buf = new Uint32Array(this.img.data.buffer);
    this.cam = { x: 200, z: 100, h: 60, yaw: 0, fov: 1.1, horizon: 0.5 };
    this.camH = 60;
    // low-resolution billowing storm texture, updated a few times a second
    this.SW = 200; this.SH = 90;
    this.sc = document.createElement('canvas'); this.sc.width = this.SW; this.sc.height = this.SH;
    this.sx2 = this.sc.getContext('2d'); this.simg = this.sx2.createImageData(this.SW, this.SH);
    this.frame = 0;
    this.streaks = [];
    for (let i = 0; i < 160; i++) this.streaks.push({ x: Math.random(), y: rand(0.55, 1), v: rand(0.08, 0.2), l: rand(30, 90), a: rand(0.04, 0.14) });
  },
  stormTex(t) {
    const d = this.simg.data, { SW, SH } = this, C = this.C;
    for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) {
      const x = i / SW, y = j / SH;
      let n = 0, a = 0.5, f = 3;
      for (let k = 0; k < 4; k++) { n += a * noise3(x * f + t * 0.01 * (k + 1), y * f * 1.6 - t * 0.004, k * 7.3 + t * 0.006); a *= 0.5; f *= 2.1; }
      const top = 0.25 + 0.35 * (0.5 + 0.5 * noise3(x * 2.2, 3.1, t * 0.004)) + n * 0.25;        // ragged top of the wall
      const dens = clamp((y - top) * 3.2 + n * 0.8, 0, 1);
      const lit = clamp(1 - (y - top) * 2.4, 0, 1) * clamp(0.6 + n, 0, 1);                       // rim light along billow tops
      const c = mixc(C.storm, C.stormLit, lit * 0.8);
      const k = (j * SW + i) * 4;
      d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = dens * 235;
    }
    this.sx2.putImageData(this.simg, 0, 0);
  },
  update(dt, t) {
    const c = this.cam;
    c.z += dt * 1.6 * SETTINGS.speed; c.x = 200 + Math.sin(t * 0.007) * 80; c.yaw = 0.1 * Math.sin(t * 0.01);
    let mx = 0; for (let k = 0; k < 6; k++) mx = Math.max(mx, TERRAIN.sample(this.T, c.x + Math.sin(c.yaw) * k * 12, c.z + k * 12));
    this.camH += ((Math.min(mx, 40) + 30) - this.camH) * Math.min(1, dt * 0.4); c.h = Math.max(this.camH, TERRAIN.sample(this.T, c.x, c.z) + 8);
    this.frame++;
    if (this.frame % 4 === 1) this.stormTex(t);
    for (const s of this.streaks) { s.x += s.v * dt; if (s.x > 1.1) { s.x = -0.1; s.y = rand(0.55, 1); } }
  },
  draw(t, ox, oy) {
    const C = this.C, hz = H * this.cam.horizon;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const sky = ctx.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, rgba(C.skyTop)); sky.addColorStop(0.55, rgba(C.skyMid)); sky.addColorStop(1, rgba(C.skyHz));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // two suns, slowly drifting apart along their orbit
    const bx = this.focus[0] * W + ox * 0.1, by = this.focus[1] * H + oy * 0.1, ph = t * TAU / 160;
    const suns = [[bx + Math.cos(ph) * W * 0.05, by + Math.sin(ph) * H * 0.012, H * 0.032, C.sun], [bx - Math.cos(ph) * W * 0.08, by - Math.sin(ph) * H * 0.02 + H * 0.03, H * 0.022, C.sun2]];
    for (const [x, y, r, c] of suns) {
      ctx.globalCompositeOperation = 'lighter';
      let g = ctx.createRadialGradient(x, y, 0, x, y, H * 0.6);
      g.addColorStop(0, rgba(c, 0.4)); g.addColorStop(0.08, rgba(c, 0.18)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba([255, 252, 240])); g.addColorStop(0.75, rgba(c)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    // the storm wall on the horizon, partly covering the suns
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = 0.95;
    ctx.drawImage(this.sc, -W * 0.05 + ox * 0.15, hz - H * 0.5 + oy * 0.15, W * 1.1, H * 0.56);
    ctx.globalAlpha = 1;
    // terrain with buttes
    TERRAIN.render(this.T, this.cam, this.buf, this.RW, this.RH, this.lut, C.fog, 1000, 0.0032);
    this.cx2.putImageData(this.img, 0, 0);
    ctx.drawImage(this.cv, -12 * scale + ox * 0.3, -12 * scale + oy * 0.3, W + 24 * scale, H + 24 * scale);
    // forward scattering haze over the land
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(bx, hz, 0, bx, hz, W * 0.5);
    g.addColorStop(0, rgba(C.sun, 0.22)); g.addColorStop(0.35, rgba(C.fog, 0.08)); g.addColorStop(1, rgba(C.fog, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // sand sheets racing ahead of the storm
    ctx.lineWidth = 1 * scale;
    for (const s of this.streaks) {
      ctx.globalAlpha = s.a; ctx.strokeStyle = rgba(C.sun);
      const x = s.x * W, y = s.y * H + Math.sin(t * 0.8 + s.y * 30) * 3 * scale;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s.l * scale, y + 1.5 * scale); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const v = ctx.createRadialGradient(W * 0.55, H * 0.5, H * 0.35, W * 0.55, H * 0.5, W * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  },
  hud() { return ['storm front closing at ≈ 20 m/s']; }
};
