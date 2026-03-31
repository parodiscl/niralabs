/**
 * NIRA LABS — Labs / Experimento 01
 * DERIVA — 2157
 * Three.js · scroll-driven · GLSL shaders
 */

import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════
   SHADERS
═══════════════════════════════════════════════════════ */

const STAR_VERT = `
  uniform float uTime;
  uniform float uPR;
  uniform float uProgress;
  attribute float aSize;
  attribute float aPhase;
  attribute vec3  aColor;
  varying   vec3  vColor;
  varying   float vA;
  varying   float vProgress;
  void main() {
    vColor    = aColor;
    vProgress = uProgress;
    vA        = 0.55 + 0.45 * sin(uTime * 1.6 + aPhase * 6.283);
    vec4 mv   = modelViewMatrix * vec4(position, 1.0);
    // Estrellas crecen con la velocidad — efecto warp
    float warp = 1.0 + uProgress * 4.2;
    gl_PointSize = aSize * uPR * (380.0 / -mv.z) * warp;
    gl_Position  = projectionMatrix * mv;
  }
`;
const STAR_FRAG = `
  varying vec3  vColor;
  varying float vA;
  varying float vProgress;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = pow(1.0 - smoothstep(0.0, 0.5, d), 1.2);
    // A mayor velocidad, el núcleo se vuelve más blanco/brillante
    vec3 boosted = mix(vColor, vec3(1.3, 1.35, 1.5), vProgress * 0.55);
    gl_FragColor = vec4(boosted, a * vA);
  }
`;

/* Polvo de estrellas — pequeñas, densas, en el tubo de vuelo */
const DUST_VERT = `
  uniform float uTime;
  uniform float uPR;
  uniform float uProgress;
  attribute float aSize;
  varying   float vA;
  void main() {
    vA       = 0.3 + 0.7 * uProgress;
    vec4 mv  = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPR * (200.0 / -mv.z) * (1.0 + uProgress * 2.0);
    gl_Position  = projectionMatrix * mv;
  }
`;
const DUST_FRAG = `
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = (1.0 - smoothstep(0.0, 0.5, d)) * vA;
    gl_FragColor = vec4(0.85, 0.92, 1.0, a * 0.6);
  }
`;

const ROCK_VERT = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal   = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ROCK_FRAG = `
  uniform vec3  uGlow;
  uniform vec3  uGlow2;
  uniform float uTime;
  uniform float uProgress;
  varying vec3  vNormal;
  varying vec3  vWorldPos;
  void main() {
    vec3  view    = normalize(cameraPosition - vWorldPos);
    float NdotV   = abs(dot(view, vNormal));
    float fresnel = pow(1.0 - NdotV, 2.0);
    float rim     = pow(1.0 - NdotV, 5.0);
    float pulse   = 0.88 + 0.12 * sin(uTime * 0.7 + vWorldPos.z * 0.015);

    vec3 base = vec3(0.14, 0.15, 0.22);
    vec3 lit  = mix(base, uGlow * 0.35, 0.3);
    vec3 col  = mix(lit, uGlow,  fresnel * 0.80);
    col       = mix(col, uGlow2, rim * 0.55);

    // A mayor progreso, las rocas se iluminan más (nos acercamos a ellas)
    col *= pulse * (1.0 + uProgress * 0.4);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const NEBULA_VERT = `
  varying vec2 vUv;
  void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
`;
const NEBULA_FRAG = `
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uA;
  varying vec2  vUv;
  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
  }
  float fbm(vec2 p){
    float v=0.0,a=0.5;
    for(int i=0;i<6;i++){ v+=a*noise(p); p=p*2.1+vec2(1.7,9.2); a*=0.48; }
    return v;
  }
  void main(){
    vec2 uv=vUv-0.5;
    float d=length(uv)*1.8;
    float n=fbm(uv*2.8+uTime*0.025);
    float edge=1.0-smoothstep(0.0,1.0,d);
    float a=edge*n*uA;
    a=pow(a,0.75);
    gl_FragColor=vec4(uColor,clamp(a,0.0,1.0));
  }
`;

/* ═══════════════════════════════════════════════════════
   HISTORIA
═══════════════════════════════════════════════════════ */
const STORY = [
  {
    label: 'DERIVA — 2157',
    title: 'El último satélite\nde Nira Labs',
    body:  'Despertó solo, a 4.2 años luz\nde casa. Sin señal. Sin instrucciones.',
  },
  {
    label: 'SISTEMA ACTIVO',
    title: 'Solo código\ncorriendo en el vacío.',
    body:  'Lo que construimos bien no necesita\nque estemos ahí para funcionar.',
  },
  {
    label: 'SEÑAL DETECTADA',
    title: 'Cada app,\nun satélite lanzado.',
    body:  'Cada línea de código, una señal\nhacia adelante en el tiempo.',
  },
  {
    label: 'NIRA LABS',
    title: 'Construimos en\nlo desconocido.',
    body:  'Desde Santiago, Chile.\nHacia donde sea.',
  },
];

/* ═══════════════════════════════════════════════════════
   ESTILOS INYECTADOS
═══════════════════════════════════════════════════════ */
function injectStyles() {
  const s = document.createElement('style');
  s.textContent = `
    /* Story panel */
    .sp {
      position:absolute; left:0; right:0;
      height:100vh; display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      z-index:10; pointer-events:none; padding:0 32px;
    }
    .sp-label {
      font-family:'Space Grotesk',sans-serif;
      font-size:10px; font-weight:600;
      letter-spacing:0.28em; text-transform:uppercase;
      color:#00D4FF; margin-bottom:22px; opacity:0;
      transform:translateY(10px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .sp-title {
      font-family:'Space Grotesk',sans-serif;
      font-size:clamp(30px,4.8vw,66px); font-weight:700;
      letter-spacing:-1.5px; line-height:1.07;
      color:#ffffff; text-align:center; margin-bottom:18px;
      opacity:0; transform:translateY(18px);
      transition: opacity 0.6s ease 0.12s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.12s;
    }
    .sp-rule {
      width:32px; height:1px; background:#00D4FF;
      opacity:0; margin:0 auto 18px;
      transition: opacity 0.5s ease 0.22s;
    }
    .sp-body {
      font-family:'IBM Plex Sans',sans-serif;
      font-size:clamp(13px,1.55vw,17px); font-weight:300;
      color:rgba(232,236,240,0.5); line-height:1.78;
      text-align:center; max-width:440px;
      opacity:0; transform:translateY(10px);
      transition: opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s;
    }
    /* Visible state */
    .sp.active .sp-label { opacity:0.8;  transform:translateY(0); }
    .sp.active .sp-title { opacity:1;    transform:translateY(0); }
    .sp.active .sp-rule  { opacity:0.35; }
    .sp.active .sp-body  { opacity:1;    transform:translateY(0); }

    /* Intro cinematic */
    .intro-crawl {
      position:fixed; left:50%; top:50%;
      transform:translate(-50%,-50%);
      text-align:center; z-index:100;
      pointer-events:none;
      display:flex; flex-direction:column;
      align-items:center; gap:0;
    }
    .intro-crawl.hidden { pointer-events:none; }

    .ic-label {
      font-family:'Space Grotesk',sans-serif;
      font-size:9px; font-weight:600;
      letter-spacing:0.38em; text-transform:uppercase;
      color:rgba(0,212,255,0.85);
      opacity:0; will-change:opacity,transform;
      transition: opacity 0.7s ease, transform 0.7s ease;
    }
    .ic-rule {
      width:1px; height:32px;
      background:linear-gradient(to bottom, transparent, rgba(0,212,255,0.35), transparent);
      margin:16px auto; opacity:0;
      transition: opacity 0.5s ease;
    }
    .ic-main {
      font-family:'Space Grotesk',sans-serif;
      font-size:clamp(11px,1.3vw,14px); font-weight:300;
      letter-spacing:0.06em; line-height:2.0;
      color:rgba(232,236,240,0.72);
      max-width:320px; opacity:0;
      transform:translateY(8px);
      will-change:opacity,transform;
      transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1);
    }
    .ic-main strong {
      font-weight:700; color:rgba(232,236,240,1.0);
      letter-spacing:0.14em;
    }
    .ic-rule2 {
      width:1px; height:32px;
      background:linear-gradient(to bottom, transparent, rgba(0,212,255,0.35), transparent);
      margin:16px auto; opacity:0;
      transition: opacity 0.5s ease;
    }
    .ic-sub {
      font-family:'IBM Plex Sans',sans-serif;
      font-size:clamp(9px,0.9vw,11px); font-weight:300;
      letter-spacing:0.2em; text-transform:uppercase;
      color:rgba(232,236,240,0.32); opacity:0;
      transition: opacity 0.6s ease;
    }

    /* Scroll hint */
    .scroll-hint {
      position:absolute; bottom:48px; left:50%;
      transform:translateX(-50%);
      display:flex; flex-direction:column;
      align-items:center; gap:8px;
      z-index:10; pointer-events:none;
      transition: opacity 0.6s ease;
    }
    .scroll-hint span {
      font-family:'Space Grotesk',sans-serif;
      font-size:9px; font-weight:500;
      letter-spacing:0.22em; text-transform:uppercase;
      color:rgba(232,236,240,0.3);
    }
    .scroll-line {
      width:1px; height:40px;
      background:linear-gradient(to bottom, rgba(0,212,255,0.6), transparent);
      animation: scrollDrop 1.8s ease-in-out infinite;
    }
    @keyframes scrollDrop {
      0%   { transform:scaleY(0); transform-origin:top; opacity:1; }
      50%  { transform:scaleY(1); transform-origin:top; opacity:1; }
      100% { transform:scaleY(1); transform-origin:bottom; opacity:0; }
    }

    /* End screen */
    .end-screen {
      position:absolute; left:0; right:0;
      top:${STORY.length * 100 + 100}vh; height:100vh;
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      z-index:10; gap:32px;
    }
    .end-wordmark {
      font-family:'Space Grotesk',sans-serif;
      font-weight:600; font-size:clamp(36px,6vw,80px);
      letter-spacing:-3px; line-height:1;
      color:#ffffff; opacity:0;
      transition: opacity 1.2s ease;
    }
    .end-wordmark.visible { opacity:1; }
    .end-wm-l { color:#00D4FF; }
    .end-wm-a { color:#A78BFA; }
    .end-wm-b { color:#F472B6; }
    .end-wm-s { color:#34D399; }
    .end-sub {
      font-family:'IBM Plex Sans',sans-serif;
      font-size:clamp(12px,1.4vw,15px); font-weight:300;
      color:rgba(232,236,240,0.3); letter-spacing:0.1em;
      text-transform:uppercase;
      opacity:0; transition: opacity 1.2s ease 0.3s;
    }
    .end-sub.visible { opacity:1; }
    .end-back {
      font-family:'Space Grotesk',sans-serif;
      font-size:13px; font-weight:500;
      color:rgba(232,236,240,0.35);
      text-decoration:none; letter-spacing:0.05em;
      opacity:0; transition: opacity 1.2s ease 0.6s, color 0.2s ease;
    }
    .end-back.visible { opacity:1; }
    .end-back:hover { color:#00D4FF; }
  `;
  document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
export function init(stage) {

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile  = window.innerWidth < 768;

  injectStyles();

  /* ── Renderer ─────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x020408, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  stage.appendChild(renderer.domElement);

  /* ── Scene / Camera ───────────────────────────────── */
  const scene  = new THREE.Scene();
  scene.fog    = new THREE.FogExp2(0x020408, 0.00055);
  const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.5, 1500);
  camera.position.set(0, 0, 60);
  const clock  = new THREE.Clock();

  /* ── ESTRELLAS ────────────────────────────────────── */
  const N_STARS = mobile ? 2200 : 4800;
  const sp = new Float32Array(N_STARS*3), ss = new Float32Array(N_STARS),
        sph= new Float32Array(N_STARS),   sc = new Float32Array(N_STARS*3);

  const SCOLS = ['#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#00D4FF','#A78BFA','#F472B6','#34D399'];
  for (let i=0; i<N_STARS; i++) {
    const r=220+Math.random()*700, t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1);
    sp[i*3]=r*Math.sin(p)*Math.cos(t); sp[i*3+1]=r*Math.sin(p)*Math.sin(t); sp[i*3+2]=r*Math.cos(p);
    ss[i]=0.9+Math.random()*3.4; sph[i]=Math.random();
    const c=new THREE.Color(SCOLS[Math.floor(Math.random()*SCOLS.length)]);
    sc[i*3]=c.r; sc[i*3+1]=c.g; sc[i*3+2]=c.b;
  }
  const sgeo = new THREE.BufferGeometry();
  sgeo.setAttribute('position', new THREE.BufferAttribute(sp,3));
  sgeo.setAttribute('aSize',    new THREE.BufferAttribute(ss,1));
  sgeo.setAttribute('aPhase',   new THREE.BufferAttribute(sph,1));
  sgeo.setAttribute('aColor',   new THREE.BufferAttribute(sc,3));

  const starMat = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT, fragmentShader: STAR_FRAG,
    uniforms: {
      uTime:    {value:0},
      uPR:      {value:Math.min(devicePixelRatio,2)},
      uProgress:{value:0},
    },
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(sgeo, starMat));

  /* ── POLVO DE ESTRELLAS (tubo de vuelo) ───────────── */
  const N_DUST = mobile ? 800 : 1800;
  const dp = new Float32Array(N_DUST*3), ds = new Float32Array(N_DUST);
  for (let i=0; i<N_DUST; i++) {
    const ang = Math.random() * Math.PI * 2;
    const rad = 15 + Math.random() * 85; // tubo delgado
    dp[i*3]   = Math.cos(ang) * rad;
    dp[i*3+1] = Math.sin(ang) * rad;
    dp[i*3+2] = 80 - Math.random() * 950; // largo del tubo
    ds[i]     = 0.3 + Math.random() * 0.8;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp,3));
  dustGeo.setAttribute('aSize',    new THREE.BufferAttribute(ds,1));

  const dustMat = new THREE.ShaderMaterial({
    vertexShader: DUST_VERT, fragmentShader: DUST_FRAG,
    uniforms: {
      uTime:    {value:0},
      uPR:      {value:Math.min(devicePixelRatio,2)},
      uProgress:{value:0},
    },
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(dustGeo, dustMat));

  /* ── ASTEROIDES ───────────────────────────────────── */
  const N_ROCKS = mobile ? 120 : 240;

  const rgeo = new THREE.IcosahedronGeometry(1, 1);
  const rpos = rgeo.attributes.position;
  for (let i=0; i<rpos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(rpos,i);
    v.normalize().multiplyScalar(0.62 + Math.random()*0.62);
    rpos.setXYZ(i, v.x, v.y, v.z);
  }
  rpos.needsUpdate = true;
  rgeo.computeVertexNormals();

  const rockMat = new THREE.ShaderMaterial({
    vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG,
    uniforms: {
      uGlow:    {value: new THREE.Color('#00D4FF')},
      uGlow2:   {value: new THREE.Color('#A78BFA')},
      uTime:    {value: 0},
      uProgress:{value: 0},
    },
  });

  const rocks = new THREE.InstancedMesh(rgeo, rockMat, N_ROCKS);
  rocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(rocks);

  const rd = [], dummy = new THREE.Object3D();
  for (let i=0; i<N_ROCKS; i++) {
    const close = i < N_ROCKS * 0.15;
    const scale = close
      ? 18 + Math.random() * 32
      : 2  + Math.random() * 14;
    const spreadX = 500, spreadY = 240;
    const d = {
      x:(Math.random()-0.5)*spreadX,
      y:(Math.random()-0.5)*spreadY,
      z: close ? (-20 - Math.random()*200) : (-30 - Math.random()*780),
      scale,
      rx:Math.random()*Math.PI*2, ry:Math.random()*Math.PI*2, rz:Math.random()*Math.PI*2,
      vx:(Math.random()-0.5)*0.0020,
      vy:(Math.random()-0.5)*0.0012,
      vz:(Math.random()-0.5)*0.0016,
      close,
    };
    rd.push(d);
    dummy.position.set(d.x,d.y,d.z);
    dummy.scale.setScalar(d.scale);
    dummy.rotation.set(d.rx,d.ry,d.rz);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  }
  rocks.instanceMatrix.needsUpdate = true;

  /* ── NEBULAE ──────────────────────────────────────── */
  const nebMats = [], nebMeshes = [];
  [
    { col:'#003880', a:0.32, pos:[-80, 60,-180], w:600, h:380 },
    { col:'#380060', a:0.28, pos:[130,-50,-350], w:700, h:420 },
    { col:'#004040', a:0.26, pos:[-30, 90,-520], w:800, h:480 },
    { col:'#280040', a:0.22, pos:[-200,-80,-700],w:900, h:540 },
    { col:'#002060', a:0.30, pos:[200,  40,-420], w:650, h:390 },
  ].forEach(def => {
    const geo = new THREE.PlaneGeometry(def.w, def.h);
    const mat = new THREE.ShaderMaterial({
      vertexShader:NEBULA_VERT, fragmentShader:NEBULA_FRAG,
      uniforms:{ uTime:{value:0}, uColor:{value:new THREE.Color(def.col)}, uA:{value:def.a} },
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...def.pos);
    scene.add(m);
    nebMats.push(mat);
    nebMeshes.push(m);
  });

  /* ── DOM: SCROLL HINT ─────────────────────────────── */
  const hint = document.createElement('div');
  hint.className = 'scroll-hint';
  hint.innerHTML = `<div class="scroll-line"></div><span>scroll</span>`;
  stage.appendChild(hint);

  /* ── DOM: STORY PANELS ────────────────────────────── */
  const panels = STORY.map((s, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'sp';
    wrap.style.top = `${(i + 0.85) * 100}vh`;
    wrap.innerHTML = `
      <p class="sp-label">${s.label}</p>
      <h2 class="sp-title">${s.title.replace(/\n/g,'<br>')}</h2>
      <div class="sp-rule"></div>
      <p class="sp-body">${s.body.replace(/\n/g,'<br>')}</p>
    `;
    stage.appendChild(wrap);
    return wrap;
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => e.target.classList.toggle('active', e.isIntersecting));
  }, { threshold: 0.25 });
  panels.forEach(p => io.observe(p));

  /* ── DOM: END SCREEN ──────────────────────────────── */
  const endDiv = document.createElement('div');
  endDiv.className = 'end-screen';
  endDiv.innerHTML = `
    <div class="end-wordmark">
      nira<span class="end-wm-l">l</span><span class="end-wm-a">a</span><span class="end-wm-b">b</span><span class="end-wm-s">s</span>
    </div>
    <p class="end-sub">Experimentos de Nira Labs · 2157</p>
    <a href="index.html" class="end-back">← Volver al inicio</a>
  `;
  stage.appendChild(endDiv);

  const endIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const show = e.isIntersecting;
      endDiv.querySelector('.end-wordmark').classList.toggle('visible', show);
      endDiv.querySelector('.end-sub').classList.toggle('visible', show);
      endDiv.querySelector('.end-back').classList.toggle('visible', show);
    });
  }, { threshold: 0.4 });
  endIO.observe(endDiv);

  /* ── STAGE HEIGHT ─────────────────────────────────── */
  stage.style.height = `${(STORY.length + 3) * 100}vh`; // 700vh

  /* ── DOM: INTRO CINEMATIC ────────────────────────── */
  const intro = document.createElement('div');
  intro.className = 'intro-crawl';
  intro.innerHTML = `
    <span class="ic-label">AÑO 2157 — BORDE DEL SISTEMA</span>
    <div class="ic-rule"></div>
    <p class="ic-main">
      Nira Labs construyó algo<br>
      que no sabía cómo apagar.<br><br>
      Lo llamaron <strong>DERIVA</strong>.
    </p>
    <div class="ic-rule2"></div>
    <span class="ic-sub">Experimento 01 — Nira Labs</span>
  `;
  // Append a body para evitar que el canvas WebGL (capa GPU) lo tape
  document.body.appendChild(intro);

  // Helper: inline style — gana sobre cualquier regla CSS
  const icItems = ['.ic-label','.ic-rule','.ic-main','.ic-rule2','.ic-sub'];

  const icFadeIn = (sel, delay) => setTimeout(() => {
    const el = intro.querySelector(sel);
    if (!el) return;
    el.style.transition = `opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1)`;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  }, delay);

  const icFadeOut = () => {
    icItems.forEach(sel => {
      const el = intro.querySelector(sel);
      if (!el) return;
      el.style.transition = 'opacity 0.7s ease';
      el.style.opacity = '0';
    });
  };

  // Staggered fade in
  const showTimers = [
    icFadeIn('.ic-label',  300),
    icFadeIn('.ic-rule',   650),
    icFadeIn('.ic-main',   950),
    icFadeIn('.ic-rule2', 1300),
    icFadeIn('.ic-sub',   1600),
  ];

  // Auto hide a los 7s (suficiente tiempo para leer)
  const hideTimer = setTimeout(icFadeOut, 7000);

  // Desaparece en el primer scroll — pero solo después de 2s
  let introDismissed = false;
  let scrollDismissReady = false;
  setTimeout(() => { scrollDismissReady = true; }, 2000);

  const dismissIntro = () => {
    if (introDismissed) return;
    introDismissed = true;
    showTimers.forEach(clearTimeout);
    clearTimeout(hideTimer);
    icFadeOut();
  };

  /* ── MOUSE PARALLAX ──────────────────────────────── */
  let mouseX = 0, mouseY = 0;
  let smoothMX = 0, smoothMY = 0;

  const onMouseMove = (e) => {
    mouseX =  (e.clientX / innerWidth  - 0.5) * 2; // -1 → 1
    mouseY = -(e.clientY / innerHeight - 0.5) * 2; // -1 → 1 (Y invertido)
  };
  window.addEventListener('mousemove', onMouseMove, { passive:true });

  /* ── SCROLL ───────────────────────────────────────── */
  let scrollY = 0;
  const onScroll = () => {
    scrollY = window.scrollY;
    if (scrollDismissReady && scrollY > 20) dismissIntro();
    if (scrollY > 60) hint.style.opacity = '0';
  };
  window.addEventListener('scroll', onScroll, { passive:true });

  function progress() {
    const max = stage.scrollHeight - innerHeight;
    return Math.min(1, scrollY / Math.max(1, max));
  }

  /* ── RESIZE ───────────────────────────────────────── */
  const onResize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    starMat.uniforms.uPR.value = Math.min(devicePixelRatio, 2);
    dustMat.uniforms.uPR.value = Math.min(devicePixelRatio, 2);
  };
  window.addEventListener('resize', onResize);

  /* ── ANIMATE ──────────────────────────────────────── */
  let raf, prev = 0;
  // Suavizado de progreso para evitar saltos bruscos
  let smoothP = 0;

  function animate(now) {
    raf = requestAnimationFrame(animate);
    if (now - prev < 14) return;
    prev = now;

    const t  = clock.getElapsedTime();
    const p  = progress();
    smoothP  = smoothP + (p - smoothP) * 0.06; // lerp suave

    // Uniforms tiempo + progreso
    starMat.uniforms.uTime.value     = t;
    starMat.uniforms.uProgress.value = smoothP;
    dustMat.uniforms.uTime.value     = t;
    dustMat.uniforms.uProgress.value = smoothP;
    rockMat.uniforms.uTime.value     = t;
    rockMat.uniforms.uProgress.value = smoothP;
    nebMats.forEach(m => { m.uniforms.uTime.value = t; });

    // Lerp suave del mouse
    smoothMX += (mouseX - smoothMX) * 0.035;
    smoothMY += (mouseY - smoothMY) * 0.035;

    // Cámara: vuelo + drift sinusoidal + roll dramático al final
    if (!reduced) {
      camera.position.z = THREE.MathUtils.lerp(60, -860, smoothP);
      camera.position.x = Math.sin(t * 0.05) * 16  + smoothP * -28;
      camera.position.y = Math.cos(t * 0.035) * 8  + smoothP *  10;

      // Parallax de mouse — rotación lateral y diagonal
      // La fuerza baja a medida que hay más roll para no confundir
      const parallaxStr = 1.0 - smoothP * 0.3;
      camera.rotation.y =  smoothMX * -0.22 * parallaxStr;
      camera.rotation.x =  smoothMY *  0.14 * parallaxStr;

      // Roll: sutil al inicio, más pronunciado al acercarse al final
      const rollBase  = Math.sin(t * 0.042) * 0.022;
      const rollSpeed = smoothP * smoothP * 0.12;
      camera.rotation.z = rollBase + Math.sin(t * 0.11) * rollSpeed;
    }

    // Nebulae siempre de frente a la cámara (billboard)
    nebMeshes.forEach(m => m.lookAt(camera.position));

    // Glow colors dinámicos según progreso
    const hue1 = (smoothP * 0.6 + 0.55) % 1;
    const hue2 = (hue1 + 0.33) % 1;
    rockMat.uniforms.uGlow.value.setHSL(hue1, 0.95, 0.62);
    rockMat.uniforms.uGlow2.value.setHSL(hue2, 0.9, 0.58);

    // Rotar rocas — cercanas más rápido conforme avanzamos
    for (let i=0; i<N_ROCKS; i++) {
      const d  = rd[i];
      const sp = d.close ? (1.0 + smoothP * 2.5) : 1.0;
      d.rx += d.vx * sp;
      d.ry += d.vy * sp;
      d.rz += d.vz * sp;
      dummy.position.set(d.x,d.y,d.z);
      dummy.scale.setScalar(d.scale);
      dummy.rotation.set(d.rx,d.ry,d.rz);
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
    }
    rocks.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate(0);

  /* ── CLEANUP ──────────────────────────────────────── */
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    endIO.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', onMouseMove);
    showTimers.forEach(clearTimeout);
    clearTimeout(hideTimer);
    if (intro.parentNode) intro.parentNode.removeChild(intro);
    renderer.dispose();
    rgeo.dispose(); sgeo.dispose(); dustGeo.dispose();
    rockMat.dispose(); starMat.dispose(); dustMat.dispose();
    nebMats.forEach(m => m.dispose());
  };
}
