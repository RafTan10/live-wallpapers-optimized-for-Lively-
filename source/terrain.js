// ===================== TERRAIN ENGINE (realistic scenes) =====================
// A tileable dune heightfield with sun lighting and cast shadows, rendered every frame with a
// front-to-back column ("voxel space") renderer into a small image that is scaled up smoothly.
const TERRAIN = {
  build(o) {
    const N = o.N || 1024, M = N - 1, h = new Float32Array(N * N);
    const B = 128;
    const raw = (x, z) => {
      const a = o.angle ?? 0.35, ca = Math.cos(a), sa = Math.sin(a);
      const warp = noise3(x * 0.004, z * 0.004, 1.7) * 1.4 + noise3(x * 0.011, z * 0.011, 5.1) * 0.35;
      const u = (x * ca + z * sa) / o.lambda + warp;
      const f = u - Math.floor(u);
      const prof = f < 0.72 ? (1 - Math.cos(f / 0.72 * Math.PI)) / 2 : Math.pow(Math.cos((f - 0.72) / 0.28 * Math.PI / 2), 1.6);
      const ampMod = 0.55 + 0.45 * (0.5 + 0.5 * noise3(x * 0.003, z * 0.003, 9.2));
      // a second, smaller dune set at another angle makes crests branch and wander
      const u2 = (x * Math.cos(a + 1.1) + z * Math.sin(a + 1.1)) / (o.lambda * 0.45) + warp * 0.7;
      const f2 = u2 - Math.floor(u2), p2 = f2 < 0.7 ? (1 - Math.cos(f2 / 0.7 * Math.PI)) / 2 : Math.cos((f2 - 0.7) / 0.3 * Math.PI / 2);
      let v = o.amp * ampMod * prof + o.amp * (o.second ?? 0.22) * p2 + noise3(x * 0.006, z * 0.006, 3.3) * o.amp * (o.rough ?? 0.5);
      if (o.spires) {
        const s = noise3(x * 0.0065, z * 0.0065, 21.5) + 0.35 * noise3(x * 0.02, z * 0.02, 4.4);
        const m = clamp((s - o.spires.th) / 0.05, 0, 1);
        v = Math.max(v, m * (o.spires.height + noise3(x * 0.03, z * 0.03, 8) * 6) );
      }
      return v;
    };
    // seamless tiling: blend with the copy one period away inside an edge band
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      let v = raw(x, z);
      const sx = x > N - B ? (x - (N - B)) / B : 0, sz = z > N - B ? (z - (N - B)) / B : 0;
      if (sx || sz) {
        const vx = raw(x - N, z), vz = raw(x, z - N), vxz = raw(x - N, z - N);
        const ax = sx * sx * (3 - 2 * sx), az = sz * sz * (3 - 2 * sz);
        v = lerp(lerp(v, vx, ax), lerp(vz, vxz, ax), az);
      }
      h[z * N + x] = v;
    }
    // lighting: Lambert + soft cast shadows marched toward the light + ripple texture
    const L = [Math.cos(o.el) * Math.sin(o.az), Math.sin(o.el), Math.cos(o.el) * Math.cos(o.az)];
    const lh = Math.hypot(L[0], L[2]), dx = L[0] / lh, dz = L[2] / lh, rise = Math.tan(o.el);
    const light = new Float32Array(N * N);
    const a = o.angle ?? 0.35, ca = Math.cos(a), sa = Math.sin(a);
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      const i = z * N + x;
      const hx = h[z * N + ((x + 1) & M)] - h[z * N + ((x - 1) & M)], hz = h[((z + 1) & M) * N + x] - h[((z - 1) & M) * N + x];
      let nx = -hx / 2, ny = 1, nz = -hz / 2; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      let d = nx * L[0] + ny * L[1] + nz * L[2];
      d = Math.max(0, d);
      let sh = 1;
      if (d > 0) {
        let px = x, pz = z, ph = h[i];
        for (let s = 1; s < 70; s++) {
          px += dx * 1.5; pz += dz * 1.5; ph += rise * 1.5;
          const hh = h[((pz | 0) & M) * N + ((px | 0) & M)];
          if (hh > ph) { sh = Math.max(0.12, 1 - (hh - ph) * 0.35); if (sh <= 0.12) break; }
        }
      }
      const rip = 1 + (o.ripple ?? 0.03) * Math.sin((x * ca + z * sa) * 1.9 + noise3(x * 0.05, z * 0.05, 2) * 3) * (ny > 0.97 ? 1 : 0.3);
      light[i] = (o.ambient + (1 - o.ambient) * d * sh * o.gain) * rip;
    }
    return { N, M, h, light };
  },
  sample(T, x, z) {
    const { N, M, h } = T;
    const x0 = Math.floor(x), z0 = Math.floor(z), fx = x - x0, fz = z - z0;
    const i00 = (z0 & M) * N + (x0 & M), i10 = (z0 & M) * N + ((x0 + 1) & M), i01 = ((z0 + 1) & M) * N + (x0 & M), i11 = ((z0 + 1) & M) * N + ((x0 + 1) & M);
    return (h[i00] * (1 - fx) + h[i10] * fx) * (1 - fz) + (h[i01] * (1 - fx) + h[i11] * fx) * fz;
  },
  // renders into a Uint32 pixel buffer (RW × RH); sky stays transparent
  render(T, cam, buf32, RW, RH, colorLUT, fogC, zfar, fogK) {
    buf32.fill(0);
    const { N, M, h, light } = T;
    const tanH = Math.tan(cam.fov / 2), focal = (RW / 2) / tanH;
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
    const hy = RH * cam.horizon;
    const LUTN = colorLUT.length;
    for (let col = 0; col < RW; col++) {
      const sxn = (col - RW / 2) / (RW / 2) * tanH;
      let ybuf = RH;
      let z = 1, dz = 0.4;
      while (z < zfar && ybuf > 0) {
        const lx = sxn * z, lz = z;
        const wx = cam.x + lx * cy + lz * sy, wz = cam.z - lx * sy + lz * cy;
        const x0 = Math.floor(wx), z0 = Math.floor(wz), fx = wx - x0, fz = wz - z0;
        const i00 = (z0 & M) * N + (x0 & M), i10 = (z0 & M) * N + ((x0 + 1) & M), i01 = ((z0 + 1) & M) * N + (x0 & M), i11 = ((z0 + 1) & M) * N + ((x0 + 1) & M);
        const hh = (h[i00] * (1 - fx) + h[i10] * fx) * (1 - fz) + (h[i01] * (1 - fx) + h[i11] * fx) * fz;
        let syv = (hy + (cam.h - hh) / z * focal) | 0;
        if (syv < ybuf) {
          const li = (light[i00] * (1 - fx) + light[i10] * fx) * (1 - fz) + (light[i01] * (1 - fx) + light[i11] * fx) * fz;
          const fog = 1 - Math.exp(-z * fogK);
          let ci = Math.min(LUTN - 1, Math.max(0, (li * (LUTN - 1) / 1.5) | 0));
          const c = colorLUT[ci];
          const r = c[0] + (fogC[0] - c[0]) * fog, g = c[1] + (fogC[1] - c[1]) * fog, b = c[2] + (fogC[2] - c[2]) * fog;
          const px = 0xff000000 | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0);
          if (syv < 0) syv = 0;
          for (let y = syv; y < ybuf; y++) buf32[y * RW + col] = px;
          ybuf = syv;
        }
        z += dz; dz *= 1.011;
      }
    }
  },
  lut(stops, n = 256) { const out = []; for (let i = 0; i < n; i++) out.push(ramp(stops, i / (n - 1) * 1.5 / 1.5)); return out; }
};
// ============================================================================
