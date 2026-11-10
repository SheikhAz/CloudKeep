import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const NARROW = 700;   /* px: phone layout + lighter particle counts */
const FOV = 45;
const CAM_Z = 6;
const TAU = Math.PI * 2;
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

/* ---------------- shaders ---------------- */
const DUST_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPx;
  uniform float uExit;
  uniform float uPush;
  uniform vec3  uSpan;
  uniform vec2  uPointer;
  attribute float aSeed;
  attribute float aSize;
  attribute float aRed;
  varying float vAlpha;
  varying float vRed;

  void main() {
    vec3 p = position * uSpan;

    /* slow upward drift that wraps around + a gentle sway */
    float speed = 0.05 + aSeed * 0.09;
    p.y = mod(p.y + uSpan.y + uTime * speed, uSpan.y * 2.0) - uSpan.y;
    p.x += sin(uTime * 0.25 + aSeed * 40.0 + p.y * 0.7) * 0.18;
    p.z += cos(uTime * 0.21 + aSeed * 25.0 + p.x * 0.5) * 0.18;

    /* pointer pushes dust away */
    vec2 d = p.xy - uPointer;
    float r = length(d);
    p.xy += normalize(d + 1e-4) * (1.0 - smoothstep(0.0, 1.5, r)) * 0.55 * uPush;

    /* exit: dust rushes toward the camera */
    p.z += uExit * uExit * 9.0 * (0.4 + aSeed);
    p.xy *= 1.0 + uExit * 0.8;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float depth = -mv.z;
    gl_PointSize = min(aSize * uPx * (6.0 / max(depth, 0.5)), 64.0 * uPx);

    float tw = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 1.6) + aSeed * 60.0);
    vAlpha = tw * (1.0 - smoothstep(4.0, 16.0, depth)) * (1.0 - uExit);
    vRed = aRed;
  }
`;

const DUST_FRAG = /* glsl */ `
  varying float vAlpha;
  varying float vRed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = 1.0 - smoothstep(0.0, 0.5, d);
    a *= a;
    vec3 col = mix(vec3(0.96, 0.95, 0.92), vec3(1.0, 0.10, 0.08), vRed);
    gl_FragColor = vec4(col, a * vAlpha);
  }
`;

const RING_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPx;
  uniform float uExit;
  uniform float uDir;
  uniform float uPower;
  attribute float aAngle;
  attribute float aSize;
  varying float vAlpha;
  varying float vHead;

  void main() {
    vec3 p = position;
    p.xy *= 1.0 + uExit * 1.4;
    p.z  += uExit * uExit * 6.0;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    /* a bright "comet" arc travelling around the ring */
    float head = pow(0.5 + 0.5 * cos(aAngle - uTime * 0.55 * uDir), 5.0);
    vHead = head;
    gl_PointSize = min(aSize * uPx * (1.0 + head * 1.4) * (6.0 / max(-mv.z, 0.5)), 48.0 * uPx);
    vAlpha = (0.16 + head * 0.84) * (1.0 - uExit) * uPower;
  }
`;

const RING_FRAG = /* glsl */ `
  varying float vAlpha;
  varying float vHead;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = 1.0 - smoothstep(0.0, 0.5, d);
    a *= a;
    vec3 col = mix(vec3(1.0, 0.12, 0.10), vec3(1.0, 0.93, 0.90), vHead * 0.65);
    gl_FragColor = vec4(col, a * vAlpha);
  }
`;

/* ---------------- builders ---------------- */
function makeDust(count, uniforms) {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const size = new Float32Array(count);
  const red = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = Math.random() * 2 - 1;
    pos[i * 3 + 1] = Math.random() * 2 - 1;
    pos[i * 3 + 2] = Math.random() * 2 - 1;
    seed[i] = Math.random();
    size[i] = 1.1 + Math.pow(Math.random(), 3) * 4.2;  /* mostly fine specks, a few big bokeh */
    red[i] = Math.random() < 0.09 ? 1 : 0;             /* ~9% brand-red */
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aRed', new THREE.BufferAttribute(red, 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

function makeRing(count, radius, jitter, sizeRange, uniforms, { dir, power }) {
  const pos = new Float32Array(count * 3);
  const ang = new Float32Array(count);
  const size = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * TAU;
    const stray = Math.random() < 0.08;                 /* a few particles escape the band */
    const j = stray ? jitter * 6 : jitter;
    const r = radius * (1 + gauss() * j);
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.sin(a) * r;
    pos[i * 3 + 2] = gauss() * j * 1.4;
    ang[i] = a;
    size[i] = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aAngle', new THREE.BufferAttribute(ang, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: RING_VERT,
    fragmentShader: RING_FRAG,
    uniforms: { ...uniforms, uDir: { value: dir }, uPower: { value: power } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

/* ---------------- component ---------------- */
export default function LandingFX({ leaving }) {
  const wrapRef = useRef(null);
  const leavingRef = useRef(false);
  leavingRef.current = leaving;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return; /* no WebGL: the landing still works, just without the particles */
    }

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrow = wrap.clientWidth <= NARROW;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrow ? 1.75 : 2));
    renderer.setClearColor(0x000000, 0);
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
    camera.position.set(0, 0, CAM_Z);

    const u = {
      uTime: { value: 0 },
      uExit: { value: 0 },
      uPush: { value: 0 },
      uPx: { value: renderer.getPixelRatio() },
      uSpan: { value: new THREE.Vector3(5, 3, 3.5) },
      uPointer: { value: new THREE.Vector2(99, 99) },
    };

    /* particle counts: lighter on phones */
    const dust = makeDust(narrow ? 1400 : 3200, u);
    const rings = new THREE.Group();
    rings.add(makeRing(narrow ? 1100 : 1800, 1.0, 0.022, [1.6, 3.4], u, { dir: 1, power: 1 }));
    rings.add(makeRing(narrow ? 450 : 700, 0.64, 0.03, [1.2, 2.6], u, { dir: -1.4, power: 0.7 }));
    scene.add(dust, rings);

    /* ---- state ---- */
    let halfW = 1, halfH = 1, t = still ? 7 : 0, exit = 0, push = 0, raf = 0;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0, last: -1e9 };

    const onMove = (e) => {
      const r = wrap.getBoundingClientRect();
      ptr.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.ty = -(((e.clientY - r.top) / r.height) * 2 - 1);
      ptr.last = performance.now();
    };

    const render = () => renderer.render(scene, camera);

    const update = (dt) => {
      t += dt;
      if (leavingRef.current) exit = Math.min(1, exit + dt / 0.65);

      /* with no pointer (phones, idle desktop) the scene drifts on its own */
      const idle = performance.now() - ptr.last > 2500;
      const gx = idle ? Math.sin(t * 0.31) * 0.45 : ptr.tx;
      const gy = idle ? Math.cos(t * 0.23) * 0.3 : ptr.ty;
      ptr.x += (gx - ptr.x) * 0.05;
      ptr.y += (gy - ptr.y) * 0.05;
      push += ((idle ? 0 : 1) - push) * 0.06;

      u.uTime.value = t;
      u.uExit.value = exit;
      u.uPush.value = push;
      u.uPointer.value.set(ptr.x * halfW, ptr.y * halfH);

      camera.position.set(ptr.x * 0.35, ptr.y * 0.22, CAM_Z);
      camera.lookAt(0, 0, 0);

      rings.rotation.x = -1.02 + Math.sin(t * 0.2) * 0.05 + ptr.y * 0.18;
      rings.rotation.y = ptr.x * 0.3;
      rings.rotation.z = t * 0.04;
    };

    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      halfH = CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      halfW = halfH * camera.aspect;
      u.uSpan.value.set(halfW * 1.25, halfH * 1.2, 3.5);

      const isNarrow = w <= NARROW;
      const R = isNarrow ? halfW * 0.8 : Math.min(halfH * 1.15, halfW * 0.5);
      rings.scale.setScalar(R);
      rings.position.set(0, halfH * (isNarrow ? 0.22 : 0.16), -0.5);

      if (still) { update(0); render(); }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    if (!still) {
      window.addEventListener('pointermove', onMove, { passive: true });
      let last = performance.now();
      const frame = (now) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        update(dt);
        render();
      };
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        o.material?.dispose?.();
      });
      renderer.dispose();
      renderer.forceContextLoss?.();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={wrapRef} className="landing-fx" aria-hidden="true" />;
}