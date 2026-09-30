// =========================================================
// Workflash "Automation Core" – 3D particle scene
// The geometry is generated in Python (python/generate_3d_scene.py → assets/core3d.bin).
// This file only draws it with plain WebGL (no libraries) and morphs between shapes:
//   Spark (bolt) → Automate (gear) → AI (neural knot) → Scale (globe)
// Loads lazily when the section comes near the screen and pauses when it is off-screen.
// =========================================================
(() => {
  const section = document.getElementById('core3d');
  const canvas = document.getElementById('coreCanvas');
  if (!section || !canvas) return;
  const stageBtns = [...section.querySelectorAll('.core-stage')];
  const hudShape = section.querySelector('[data-hud=shape]');
  const hudCount = section.querySelector('[data-hud=count]');
  const hudFps = section.querySelector('[data-hud=fps]');
  const DATA_URL = section.dataset.src || '/assets/core3d.bin';
  const NAMES = ['SPARK', 'AUTOMATE', 'AI CORE', 'SCALE'];
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOLD = 4200, MORPH = 2300, PULSE = 1400;

  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  if (!gl) { section.classList.add('no-gl'); return; }

  // ---------- shaders ----------
  const VS = `
    attribute vec3 aFrom; attribute vec3 aTo; attribute vec4 aRand;
    uniform float uScale, uMix, uTime, uAspect, uPx, uPulse, uRing, uOffset, uFocal, uDist;
    uniform mat3 uRot;
    varying vec3 vCol; varying float vA;
    void main() {
      float d = aRand.y * 0.45;
      float t = clamp((uMix - d) / 0.55, 0.0, 1.0);
      t = t * t * (3.0 - 2.0 * t);
      vec3 p = mix(aFrom, aTo, t) * uScale;
      float burst = sin(t * 3.14159) * (1.0 - uRing);
      vec3 dir = normalize(p + vec3(0.0001, 0.0002, 0.0003));
      p += dir * burst * (0.25 + aRand.x * 0.9);
      p += vec3(sin(uTime * (1.0 + aRand.w) + aRand.z * 6.283), cos(uTime * 1.3 + aRand.z * 9.0), sin(uTime * 0.7 + aRand.z * 4.0)) * 0.016;
      if (uRing > 0.5) {
        float a = uTime * (0.35 + aRand.w * 0.05);
        p = vec3(p.x * cos(a) - p.z * sin(a), p.y, p.x * sin(a) + p.z * cos(a));
      }
      float r = length(p);
      float wave = exp(-pow((r - uPulse * 4.0) * 3.0, 2.0)) * (1.0 - uPulse) * step(0.001, uPulse);
      p += dir * wave * 0.45;
      vec3 q = uRot * p;
      float z = uDist - q.z;
      gl_Position = vec4(q.x * uFocal / uAspect + uOffset * z, q.y * uFocal, 0.0, z);
      gl_PointSize = uPx * (0.45 + aRand.x * 0.9) * (1.0 + burst * 0.9 + wave * 2.5) / z;
      vec3 cyan = vec3(0.35, 0.9, 1.0), blue = vec3(0.25, 0.55, 1.0), violet = vec3(0.62, 0.45, 1.0);
      vec3 c = mix(cyan, blue, smoothstep(-1.4, 1.4, q.y + aRand.w * 0.8));
      c = mix(c, violet, smoothstep(0.82, 1.0, aRand.w) * 0.8);
      c = mix(c, vec3(1.0), clamp(burst * 0.55 + wave * 0.8, 0.0, 1.0));
      if (uRing > 0.5) c = mix(cyan, vec3(1.0), 0.25);
      vCol = c;
      float tw = 0.62 + 0.38 * sin(uTime * (2.0 + aRand.w * 3.0) + aRand.z * 40.0);
      vA = tw * (0.35 + 0.65 * smoothstep(uDist + 2.6, uDist - 1.8, z)) * (uRing > 0.5 ? 0.9 : 1.35);
    }`;
  const FS = `
    precision mediump float;
    varying vec3 vCol; varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      a = a * a * vA;
      gl_FragColor = vec4(vCol * a, a);
    }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { console.warn('core3d', e); section.classList.add('no-gl'); return; }
  const A = { from: gl.getAttribLocation(prog, 'aFrom'), to: gl.getAttribLocation(prog, 'aTo'), rand: gl.getAttribLocation(prog, 'aRand') };
  const U = {};
  ['uScale', 'uMix', 'uTime', 'uAspect', 'uPx', 'uPulse', 'uRing', 'uOffset', 'uFocal', 'uDist', 'uRot'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

  // ---------- state ----------
  let shapes = [], ringBuf = null, randBuf = null, N = 0, R = 0, scale = 1, ready = false;
  let cur = 0, next = 0, mix = 0, morphStart = 0, holdStart = 0, pulseStart = -1e9, queued = -1;
  let visible = false, raf = 0, t0 = performance.now(), last = t0, drawN = 0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let yawDrift = 0;

  const load = async () => {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('core3d data ' + res.status);
    const buf = await res.arrayBuffer();
    const dv = new DataView(buf);
    if (String.fromCharCode(...new Uint8Array(buf, 0, 4)) !== 'WF3D') throw new Error('bad core3d file');
    const S = dv.getUint16(6, true); N = dv.getUint32(8, true); R = dv.getUint32(12, true); scale = dv.getFloat32(16, true);
    const all = new Int16Array(buf, 20);
    for (let i = 0; i < S; i++) {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, all.subarray(i * N * 3, (i + 1) * N * 3), gl.STATIC_DRAW);
      shapes.push(b);
    }
    ringBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ringBuf);
    gl.bufferData(gl.ARRAY_BUFFER, all.subarray(S * N * 3, S * N * 3 + R * 3), gl.STATIC_DRAW);
    // per-particle random values: size, morph delay, twinkle phase, colour
    let seed = 2021; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const M = Math.max(N, R), rv = new Float32Array(M * 4);
    for (let i = 0; i < M * 4; i++) rv[i] = rnd();
    for (let i = 0; i < M; i++) rv[i * 4] = Math.pow(rv[i * 4], 2.2); // mostly small points, a few big glowing ones
    randBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, randBuf); gl.bufferData(gl.ARRAY_BUFFER, rv, gl.STATIC_DRAW);
    ready = true;
    section.classList.add('gl-ready');
  };

  // ---------- sizing ----------
  let W = 1, H = 1, dpr = 1, wide = true;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    wide = r.width >= 900;
    drawN = Math.round(N * (r.width < 640 ? 0.6 : 1));
    if (hudCount) hudCount.textContent = (drawN * 1 + R).toLocaleString('en-IN');
  };
  new ResizeObserver(() => { resize(); if (!raf) frame(performance.now()); }).observe(canvas);

  // ---------- interaction ----------
  section.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.tx = ((e.clientX - r.left) / r.width - (wide ? 0.72 : 0.5)) * 2;
    mouse.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, { passive: true });
  section.addEventListener('pointerleave', () => { mouse.tx = 0; mouse.ty = 0; });
  canvas.addEventListener('pointerdown', () => { pulseStart = performance.now(); if (window.WF && WF.track) WF.track('core3d_pulse'); });

  const setActive = (i) => {
    stageBtns.forEach((b, k) => { b.classList.toggle('is-active', k === i); b.setAttribute('aria-selected', k === i); });
    if (hudShape) hudShape.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(NAMES.length).padStart(2, '0') + ' · ' + NAMES[i];
  };
  const goTo = (i, now = performance.now()) => {
    if (!ready || i === next) return;
    if (mix > 0 && mix < 1) { queued = i; return; }
    next = i; mix = REDUCED ? 1 : 0; morphStart = now;
    setActive(i);
    if (REDUCED) { cur = next; mix = 0; holdStart = now; if (!raf) raf = requestAnimationFrame(frame); }
  };
  stageBtns.forEach((b, i) => b.addEventListener('click', () => goTo(i)));

  // ---------- render ----------
  const bindShape = (loc, buf) => { gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 3, gl.SHORT, false, 0, 0); };
  let fpsAcc = 0, fpsN = 0;
  function frame(now) {
    raf = 0;
    if (!ready) return;
    const dt = Math.min(64, now - last); last = now;
    const time = (now - t0) / 1000;

    // morph timeline
    if (next !== cur) {
      mix = Math.min(1, (now - morphStart) / MORPH);
      if (mix >= 1) { cur = next; mix = 0; holdStart = now; pulseStart = now; if (queued >= 0) { const q = queued; queued = -1; goTo(q, now); } }
    } else if (!REDUCED && now - holdStart > HOLD) {
      goTo((cur + 1) % shapes.length, now);
    }
    stageBtns.forEach((b, k) => b.style.setProperty('--p', k === next ? (next !== cur ? 0 : Math.min(1, (now - holdStart) / HOLD)) : 0));

    // camera
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    if (!REDUCED) yawDrift += dt * 0.00022;
    const yaw = yawDrift + mouse.x * 0.7, pitch = 0.22 + mouse.y * 0.45;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch);
    // column-major mat3 = Rx(pitch) * Ry(yaw)
    const rot = new Float32Array([cy, sx * sy, -cx * sy, 0, cx, sx, sy, -sx * cy, cx * cy]);

    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(prog);
    const focal = 1 / Math.tan((38 * Math.PI) / 360);
    const pulse = (now - pulseStart) / PULSE;
    gl.uniform1f(U.uScale, scale);
    gl.uniform1f(U.uTime, REDUCED ? 0 : time);
    gl.uniform1f(U.uAspect, W / H);
    gl.uniform1f(U.uPx, 26 * dpr * Math.min(1.25, Math.max(0.7, H / dpr / 680)));
    gl.uniform1f(U.uPulse, pulse > 0 && pulse < 1 ? pulse : 0);
    gl.uniform1f(U.uOffset, wide ? 0.4 : 0);
    gl.uniform1f(U.uFocal, focal);
    gl.uniform1f(U.uDist, wide ? 7.6 : 6.6);
    gl.uniformMatrix3fv(U.uRot, false, rot);

    gl.bindBuffer(gl.ARRAY_BUFFER, randBuf); gl.enableVertexAttribArray(A.rand); gl.vertexAttribPointer(A.rand, 4, gl.FLOAT, false, 0, 0);
    // main shape (morphing)
    bindShape(A.from, shapes[cur]); bindShape(A.to, shapes[next]);
    gl.uniform1f(U.uMix, next !== cur ? mix : 0); gl.uniform1f(U.uRing, 0);
    gl.drawArrays(gl.POINTS, 0, drawN);
    // orbit rings
    bindShape(A.from, ringBuf); bindShape(A.to, ringBuf);
    gl.uniform1f(U.uMix, 0); gl.uniform1f(U.uRing, 1);
    gl.drawArrays(gl.POINTS, 0, R);

    if (hudFps) { fpsAcc += dt; fpsN++; if (fpsAcc > 600) { hudFps.textContent = Math.round((1000 * fpsN) / fpsAcc) + ' fps'; fpsAcc = 0; fpsN = 0; } }
    if (visible && !document.hidden && !REDUCED) raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!raf && ready && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  // ---------- lazy start ----------
  let loading = null;
  new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      visible = en.isIntersecting;
      if (visible && !loading) {
        loading = load().then(() => { resize(); holdStart = performance.now(); setActive(0); frame(performance.now()); start(); })
          .catch((err) => { console.warn(err); section.classList.add('no-gl'); });
      }
      if (visible) start();
    });
  }, { rootMargin: '250px 0px' }).observe(section);
  document.addEventListener('visibilitychange', start);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); section.classList.add('no-gl'); });
})();
