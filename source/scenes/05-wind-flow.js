// Weather — wind streamlines from a divergence-free (curl-noise) velocity field.
// Thousands of tracers leave fading trails; some carry characters.
const SCENE = {
  ambient: false,
  dust: false,
  focus: [0.6, 0.5],
  trail: 0.06,
  title: 'INCOMPRESSIBLE FLOW · CURL NOISE',
  sub: 'u = ∇ × ψ  ⇒  ∇ · u = 0',
  eqs: [
    { e: '∂u/∂t + (u · ∇)u = −∇p / ρ + ν∇²u', n: 'Navier–Stokes momentum equation' },
    { e: '∇ · u = 0', n: 'incompressibility — no sources or sinks' },
    { e: 'u = (∂ψ/∂y,  −∂ψ/∂x)', n: 'velocity from a stream function' },
    { e: 'ω = ∇ × u = −∇²ψ', n: 'vorticity' },
    { e: 'dx/dt = u(x, t)', n: 'tracer particles follow the flow' },
    { e: 'Re = U L / ν', n: 'Reynolds number' }
  ],
  init() {
    const n = Math.round(1700 * SETTINGS.density * (W * H) / (1920 * 1080));
    this.p = [];
    for (let i = 0; i < n; i++) this.p.push(this.spawn({}, true));
    this.fs = 0.0016 / scale;     // spatial frequency of the field
    this.probe = [W * 0.55, H * 0.42];
  },
  spawn(o, any) {
    o.x = Math.random() * W; o.y = Math.random() * H;
    o.px = o.x; o.py = o.y;
    o.life = rand(3, 10); o.age = any ? Math.random() * o.life : 0;
    o.g = Math.random() < 0.08 ? pick() : null;
    o.b = rand(0.4, 1);
    return o;
  },
  psi(x, y, z) {
    const f = this.fs;
    return noise3(x * f, y * f, z) + 0.45 * noise3(x * f * 2.3 + 17, y * f * 2.3, z * 1.3);
  },
  vel(x, y, z) {
    const e = 1.5;
    const dpy = (this.psi(x, y + e, z) - this.psi(x, y - e, z)) / (2 * e);
    const dpx = (this.psi(x + e, y, z) - this.psi(x - e, y, z)) / (2 * e);
    const k = 22000 * scale * scale;
    return [dpy * k + 14 * scale, -dpx * k];   // plus a gentle prevailing westerly
  },
  update(dt, t) {
    const z = t * 0.025;
    this.z = z;
    for (const o of this.p) {
      o.px = o.x; o.py = o.y;
      const v = this.vel(o.x, o.y, z);
      o.x += v[0] * dt * SETTINGS.speed; o.y += v[1] * dt * SETTINGS.speed;
      o.sp = Math.hypot(v[0], v[1]);
      o.age += dt;
      if (o.age > o.life || o.x < -20 || o.x > W + 20 || o.y < -20 || o.y > H + 20) this.spawn(o, false);
    }
  },
  draw(t, ox, oy) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 1.1 * scale;
    const buckets = [[], [], [], []];
    for (const o of this.p) {
      if (o.age < 0.05) continue;
      const k = Math.min(3, Math.floor(o.sp / (22 * scale)));
      buckets[k].push(o);
    }
    buckets.forEach((list, k) => {
      ctx.strokeStyle = PAL[12 + k * 3];
      ctx.globalAlpha = 0.18 + k * 0.1;
      ctx.beginPath();
      for (const o of list) { ctx.moveTo(o.px + ox, o.py + oy); ctx.lineTo(o.x + ox, o.y + oy); }
      ctx.stroke();
    });
  },
  drawOver(t, ox, oy) {
    const o = octx;
    o.font = MONO(11); o.textAlign = 'center'; o.textBaseline = 'middle';
    for (const q of this.p) {
      if (!q.g) continue;
      o.globalAlpha = 0.75 * q.b * Math.sin(Math.PI * q.age / q.life);
      o.fillStyle = PAL[19];
      o.fillText(q.g, q.x + ox, q.y + oy);
    }
    if (!SETTINGS.math) return;
    // Wind probe: velocity vector + readout
    const [px, py] = this.probe, v = this.vel(px, py, this.z || 0);
    const sp = Math.hypot(v[0], v[1]) / scale;
    const ang = Math.atan2(v[1], v[0]);
    o.strokeStyle = PAL[19]; o.fillStyle = PAL[19]; o.lineWidth = 1 * scale;
    o.globalAlpha = 0.7;
    o.beginPath(); o.arc(px, py, 4 * scale, 0, TAU); o.stroke();
    const L = 50 * scale, ex = px + Math.cos(ang) * L, ey = py + Math.sin(ang) * L;
    o.beginPath(); o.moveTo(px, py); o.lineTo(ex, ey);
    o.lineTo(ex - Math.cos(ang - 0.4) * 8 * scale, ey - Math.sin(ang - 0.4) * 8 * scale);
    o.moveTo(ex, ey); o.lineTo(ex - Math.cos(ang + 0.4) * 8 * scale, ey - Math.sin(ang + 0.4) * 8 * scale);
    o.stroke();
    o.font = MONO(10.5); o.textAlign = 'left';
    o.globalAlpha = 0.75;
    const deg = ((90 - ang * 180 / Math.PI) % 360 + 360) % 360;
    o.fillText(`|u| = ${(sp * 0.12).toFixed(2)} m/s`, px + 14 * scale, py + 18 * scale);
    o.fillText(`bearing ${deg.toFixed(0).padStart(3, '0')}°`, px + 14 * scale, py + 34 * scale);
  },
  hud() { return [`${this.p.length} tracers`]; }
};
