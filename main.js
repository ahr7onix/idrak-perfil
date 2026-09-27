import * as THREE from "three";

const P = window.PROFILE;
const $ = (id) => document.getElementById(id);
const root = document.documentElement;
root.style.setProperty("--red", P.red);
root.style.setProperty("--fire", P.fire);
root.style.setProperty("--ice", P.ice);
document.title = `WANTED · ${P.name}`;

/* ============================================================
   Cartaz
   ============================================================ */
$("enter-name").textContent = P.name;
$("name").textContent = P.name;
$("epithet").textContent = `"${P.epithet}"`;
$("bounty").textContent = P.bounty;
$("bio").textContent = P.bio;
$("t-name").textContent = P.name;
$("t-epithet").textContent = P.epithet;

// Verso do cartaz + botão de virar
$("b-quote").textContent = `"${P.back.quote}"`;
P.back.crew.forEach((c) => { const li = document.createElement("li"); li.textContent = c; $("b-crew").appendChild(li); });
$("b-dream").textContent = P.back.dream;
$("b-favs").textContent = P.back.favorites.join(" · ");
$("b-sign").textContent = P.name;
document.querySelectorAll("[data-flip]").forEach((b) => b.addEventListener("click", (e) => {
  e.stopPropagation();
  $("poster").classList.toggle("flipped");
}));

// Cursor de Haki
const cursorEl = $("cursor");
addEventListener("pointermove", (e) => { cursorEl.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; });
document.addEventListener("mouseover", (e) => cursorEl.classList.toggle("hover", !!e.target.closest("a, button, input")));

// HUD: título do arco, ficha e barras de atributos
$("arc").textContent = P.arc;
$("s-crew").textContent = P.sheet.crew;
$("s-fruit").textContent = P.sheet.fruit;
$("s-status").textContent = P.sheet.status;
const statFills = P.stats.map((st) => {
  const el = document.createElement("div");
  el.className = "stat";
  el.innerHTML = `<div class="stat-row"><span></span><b></b></div><div class="stat-bar"><div class="stat-fill"></div></div>`;
  el.querySelector("span").textContent = st.label.toUpperCase();
  el.querySelector("b").textContent = st.value;
  $("stats").appendChild(el);
  return { fill: el.querySelector(".stat-fill"), value: st.value };
});
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function updateHud() {
  if (!songDur) return;
  const k = songT / songDur;
  $("tl-fill").style.width = `${k * 100}%`;
  $("tl-head").style.left = `${k * 100}%`;
  $("tl-now").textContent = fmt(songT);
  $("tl-total").textContent = fmt(songDur);
  const f = Math.floor(performance.now() / (1000 / 24)) % 24;
  const s = Math.floor(performance.now() / 1000);
  $("tc").textContent = `00:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
  // barras respiram com a batida
  statFills.forEach((st, i) => {
    if (!document.body.classList.contains("stats-on")) return;
    const wobble = Math.min(100, st.value + (kick * 8 - 4) * ((i % 2) ? 1 : -0.6));
    st.fill.style.transition = "width .12s linear";
    st.fill.style.width = `${Math.max(0, wobble)}%`;
  });
}

function popAt(x, y, word) {
  const el = document.createElement("div");
  el.className = "pop" + (word.startsWith("ゴ") ? " menace" : "");
  el.textContent = word;
  el.style.left = `${x}px`; el.style.top = `${y}px`;
  el.style.setProperty("--r", `${(Math.random() - 0.5) * 20}deg`);
  $("sfx-layer").appendChild(el);
  setTimeout(() => el.remove(), 1150);
}

// Onomatopeias estourando nas batidas fortes (lado direito da tela, longe do cartaz)
let lastPop = 0;
function maybePop(t) {
  if (kick < 0.55 || t - lastPop < 0.9 || !document.body.classList.contains("opened")) return;
  lastPop = t;
  const el = document.createElement("div");
  const list = document.body.classList.contains("gear5") ? ["ドンドットット", "ニカ!", "ハハハ!"] : P.sfx;
  const word = list[Math.floor(Math.random() * list.length)];
  el.className = "pop" + (word.startsWith("ゴ") ? " menace" : "");
  el.textContent = word;
  const wide = innerWidth >= 1100;
  el.style.left = `${wide ? 45 + Math.random() * 25 : 15 + Math.random() * 70}%`;
  el.style.top = `${22 + Math.random() * 56}%`;
  el.style.setProperty("--r", `${(Math.random() - 0.5) * 24}deg`);
  $("sfx-layer").appendChild(el);
  setTimeout(() => el.remove(), 1150);
}

// sem faixas pretas: o vídeo ocupa a tela inteira
function layoutBars() {
  const bar = 0;
  root.style.setProperty("--bar", "0px");
  // cartaz encolhe para caber inteiro entre as faixas (só em telas largas; no celular dá pra rolar)
  const poster = document.getElementById("poster");
  poster.style.zoom = 1;
  if (innerWidth > innerHeight) {
    const avail = innerHeight - bar * 2 - 40;
    poster.style.zoom = Math.max(0.45, Math.min(1, avail / poster.offsetHeight)).toFixed(3);
  }
}
layoutBars();
addEventListener("resize", layoutBars);
const photoLive = $("photo-live");
const pctx = photoLive.getContext("2d");
if (P.avatar) { $("photo").style.backgroundImage = `url("${P.avatar}")`; $("photo").classList.add("has-avatar"); photoLive.remove(); }
function drawPhoto() {
  if (P.avatar || video.readyState < 2) return;
  // recorte quadrado do centro do vídeo, com leve zoom respirando
  const vw = video.videoWidth, vh = video.videoHeight, s = Math.min(vw, vh) * (0.78 + Math.sin(performance.now() / 3000) * 0.04);
  pctx.filter = "sepia(.75) contrast(1.35) brightness(.95) saturate(.8)";
  pctx.drawImage(video, (vw - s) / 2, (vh - s) / 2 - vh * 0.04, s, s, 0, 0, 320, 320);
}

// recompensa contando quando o cartaz cai
function countBounty() {
  const target = Number(String(P.bounty).replace(/\D/g, "")) || 0;
  const t0 = performance.now(), dur = 1600;
  (function step(now) {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
    $("bounty").textContent = Math.round(target * e).toLocaleString("pt-BR");
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

P.links.forEach((l) => {
  const el = document.createElement(l.copy ? "button" : "a");
  el.className = "link";
  el.style.setProperty("--icon", `url(https://cdn.jsdelivr.net/npm/simple-icons@13/icons/${l.platform}.svg)`);
  el.innerHTML = "<i></i><span><b></b><small></small></span>";
  el.querySelector("b").textContent = l.label;
  el.querySelector("small").textContent = l.handle;
  if (l.copy) {
    el.type = "button";
    el.addEventListener("click", () => { navigator.clipboard?.writeText(l.handle); toast(`${l.label} copiado!`); });
  } else { el.href = l.url; el.target = "_blank"; el.rel = "noopener"; }
  $("links").appendChild(el);
});

let toastTimer;
function toast(msg) {
  $("toast").textContent = msg;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 1600);
}

// inclinação 3D do cartaz
const poster = $("poster");
poster.addEventListener("mousemove", (e) => {
  const r = poster.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
  poster.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 16}deg)`;
});
poster.addEventListener("mouseleave", () => { poster.style.transform = ""; });

/* ============================================================
   Vídeo de fundo (mudo) + música pelo player do YouTube
   ============================================================ */
const video = $("bgvideo");
video.src = P.video;
video.play().catch(() => {});             // roda mudo o tempo todo

// no PC o player fica no HUD (entre a ficha e a linha do tempo); no celular, embaixo do cartaz
function placePlayer() {
  const box = $("ytbox"), wide = innerWidth >= 1100;
  if (wide && box.parentElement !== $("hud")) $("hud").insertBefore(box, document.querySelector("#hud .timeline"));
  if (!wide && box.parentElement !== $("app")) $("app").appendChild(box);
}
placePlayer();
addEventListener("resize", placePlayer);

$("trk-title").textContent = P.music.title;
$("trk-artist").textContent = P.music.artist;

let yt, ytReady = false, wantPlay = false, playing = false, songT = 0, songDur = 0;
window.onYouTubeIframeAPIReady = () => {
  yt = new YT.Player("yt", {
    videoId: P.music.youtube,
    playerVars: { playsinline: 1, loop: 1, playlist: P.music.youtube, rel: 0, controls: 1 },
    events: {
      onReady: () => {
        ytReady = true;
        yt.setVolume(+$("volume").value * 100);
        if (wantPlay) yt.playVideo();
      },
      onStateChange: (e) => {
        playing = e.data === YT.PlayerState.PLAYING;
        $("play").textContent = playing ? "❚❚" : "▶";
      },
    },
  });
};
const ytScript = document.createElement("script");
ytScript.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(ytScript);

$("enter").addEventListener("click", () => {
  $("enter").classList.add("gone");
  $("app").classList.remove("hidden");
  document.body.classList.add("opened");      // abre a cortina e roda os créditos
  requestAnimationFrame(layoutBars);              // mede o cartaz já visível
  $("bounty").textContent = "0";
  setTimeout(countBounty, 4700);                  // começa quando o cartaz termina de cair
  setTimeout(() => {                              // barras de atributos enchem quando o HUD aparece
    statFills.forEach((st) => (st.fill.style.width = `${st.value}%`));
    setTimeout(() => document.body.classList.add("stats-on"), 1500);
  }, 5600);
  video.play().catch(() => {});             // sem voltar pro 0: o seek travava o vídeo no clique
  wantPlay = true;
  if (ytReady) yt.playVideo();
  kick = 1;
}, { once: true });

$("play").addEventListener("click", () => {
  if (!ytReady) return;
  playing ? yt.pauseVideo() : yt.playVideo();
});
$("volume").addEventListener("input", (e) => { if (ytReady) yt.setVolume(+e.target.value * 100); });

// Batida: o YouTube não deixa ler o áudio, então os efeitos seguem um relógio no BPM da música,
// preso ao tempo do player (pausou, parou; pulou, acompanha)
const beatLen = 60 / P.music.bpm;
let beat = 0, kick = 0, lastBeatN = -1;
function readAudio() {
  if (!ytReady || !playing) { beat *= 0.9; return; }
  songT = yt.getCurrentTime() || 0;
  songDur = yt.getDuration() || 0;
  const n = Math.floor(songT / beatLen), ph = (songT % beatLen) / beatLen;
  if (n !== lastBeatN) {
    if (lastBeatN >= 0) kick = Math.max(kick, n % 4 === 0 ? 1 : n % 2 === 0 ? 0.75 : 0.5);
    lastBeatN = n;
  }
  beat = 0.55 * Math.exp(-ph * 4);
}

// Cor média do vídeo (8x8 px) -> ilumina o cartaz com a luz da cena
const ambC = document.createElement("canvas");
ambC.width = ambC.height = 8;
const ambX = ambC.getContext("2d", { willReadFrequently: true });
let amb = [255, 120, 40];
setInterval(() => {
  if (video.readyState < 2) return;
  ambX.drawImage(video, 0, 0, 8, 8);
  const d = ambX.getImageData(0, 0, 8, 8).data;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4, m = Math.max(r, g, b) / n || 1;
  const k = 255 / Math.max(m, 60);                     // normaliza o brilho, mantém a cor
  const target = [r / n * k, g / n * k, b / n * k];
  amb = amb.map((v, i) => v + (target[i] - v) * 0.5);
  root.style.setProperty("--amb", amb.map((v) => Math.round(Math.min(255, v))).join(", "));
}, 120);

// barrinhas no player pulsando na batida
const wctx = $("wave").getContext("2d");
function drawWave() {
  const W = 120, H = 34, n = 16, t = performance.now() / 1000;
  wctx.clearRect(0, 0, W, H);
  wctx.fillStyle = P.red;
  for (let i = 0; i < n; i++) {
    const wob = 0.5 + 0.5 * Math.sin(i * 1.7 + t * 5) * Math.cos(i * 0.6 - t * 3);
    const h = playing ? Math.max(3, H * (0.15 + (beat + kick * 0.5) * wob)) : 3;
    wctx.fillRect(i * (W / n) + 1, (H - h) / 2, W / n - 3, Math.min(H, h));
  }
}

/* ============================================================
   Cena: shader de mangá sobre o vídeo + partículas 3D
   ============================================================ */
const canvas = $("fx");
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false }); }
catch (e) { renderer = null; }

if (renderer) {
  document.body.classList.add("webgl");
  // resolução adaptativa: começa em 1x e baixa sozinha se o FPS cair (placa de vídeo integrada)
  const maxPR = Math.min(devicePixelRatio, 1);
  let pr = maxPR, fpsFrames = 0, fpsT0 = performance.now(), goodSecs = 0;
  renderer.setPixelRatio(pr);
  renderer.setSize(innerWidth, innerHeight);
  function adaptResolution() {
    fpsFrames++;
    const now = performance.now();
    if (now - fpsT0 < 1000) return;
    const fps = fpsFrames * 1000 / (now - fpsT0);
    fpsFrames = 0; fpsT0 = now;
    let next = pr;
    if (fps < 45) { next = Math.max(0.5, pr * 0.8); goodSecs = 0; }
    else if (fps > 57 && ++goodSecs >= 3) { next = Math.min(maxPR, pr * 1.15); goodSecs = 0; }
    if (Math.abs(next - pr) > 0.01) { pr = next; renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight); }
  }
  renderer.autoClear = false;

  const videoTex = new THREE.VideoTexture(video);
  videoTex.colorSpace = THREE.SRGBColorSpace;

  // ---------- quadro de fundo: o vídeo passando pelo shader ----------
  const fxUniforms = {
    uVideo: { value: videoTex }, uRes: { value: new THREE.Vector2(innerWidth, innerHeight) },
    uVideoAspect: { value: 1500 / 1080 }, uTime: { value: 0 },
    uBeat: { value: 0 }, uKick: { value: 0 }, uMouse: { value: new THREE.Vector2() },
    uRed: { value: new THREE.Color(P.red) },
    uShock: { value: 9 }, uShockPos: { value: new THREE.Vector2(0.5, 0.5) }, uGear: { value: 0 },
  };
  video.addEventListener("loadedmetadata", () => { fxUniforms.uVideoAspect.value = video.videoWidth / video.videoHeight; });

  // ---------- Haki do Rei no clique: onda de choque + raios pretos/vermelhos rachando a tela ----------
  const crackCanvas = $("cracks"), cx2 = crackCanvas.getContext("2d");
  let bolts = [];
  function sizeCracks() { crackCanvas.width = innerWidth; crackCanvas.height = innerHeight; }
  sizeCracks();
  addEventListener("resize", sizeCracks);
  function boltPath(x, y, ang, len, depth) {
    const pts = [[x, y]];
    const steps = 10 + Math.floor(Math.random() * 6);
    for (let i = 1; i <= steps; i++) {
      ang += (Math.random() - 0.5) * 0.9;
      x += Math.cos(ang) * len / steps; y += Math.sin(ang) * len / steps;
      pts.push([x, y]);
      if (depth > 0 && Math.random() < 0.18) bolts.push({ pts: boltPath(x, y, ang + (Math.random() - 0.5) * 1.6, len * 0.45, depth - 1), life: 0.7, w: 0.6 });
    }
    return pts;
  }
  let lastHaki = 0;
  addEventListener("pointerdown", (e) => {
    if (!document.body.classList.contains("opened")) return;
    if (e.target.closest(".poster, a, button, input")) return;
    const now = performance.now();
    if (now - lastHaki < 450) return;
    lastHaki = now;
    const n = 6 + Math.floor(Math.random() * 3), reach = Math.max(innerWidth, innerHeight) * 0.45;
    for (let i = 0; i < n; i++) bolts.push({ pts: boltPath(e.clientX, e.clientY, (i / n) * Math.PI * 2 + Math.random() * 0.5, reach * (0.5 + Math.random() * 0.6), 2), life: 0.7, w: 1 });
    fxUniforms.uShock.value = 0;
    fxUniforms.uShockPos.value.set(e.clientX / innerWidth, 1 - e.clientY / innerHeight);
    kick = 1;
    lastPop = 0;
    popAt(e.clientX, e.clientY, "ドン!");
  });
  function drawCracks(dt) {
    cx2.clearRect(0, 0, crackCanvas.width, crackCanvas.height);
    bolts = bolts.filter((b) => (b.life -= dt) > 0);
    for (const b of bolts) {
      const a = Math.min(1, b.life / 0.35);
      cx2.lineJoin = "round";
      cx2.beginPath();
      b.pts.forEach(([x, y], i) => (i ? cx2.lineTo(x, y) : cx2.moveTo(x, y)));
      cx2.shadowColor = P.red; cx2.shadowBlur = 22;
      cx2.strokeStyle = `rgba(227, 23, 43, ${0.9 * a})`; cx2.lineWidth = 7 * b.w; cx2.stroke();
      cx2.shadowBlur = 0;
      cx2.strokeStyle = `rgba(0, 0, 0, ${a})`; cx2.lineWidth = 2.6 * b.w; cx2.stroke();
    }
  }

  // ---------- easter egg: digite "gear5" ou "nika" ----------
  let typed = "", gearUntil = 0;
  addEventListener("keydown", (e) => {
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-5);
    if (typed.endsWith("gear5") || typed.endsWith("nika")) {
      typed = "";
      gearUntil = performance.now() + 9000;
      document.body.classList.add("gear5");
      toast("GEAR 5 · ニカ");
      popAt(innerWidth * 0.55, innerHeight * 0.4, "ドンドットット");
    }
  });
  const bgScene = new THREE.Scene();
  const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: fxUniforms, depthTest: false, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uVideo; uniform vec2 uRes, uMouse; uniform float uVideoAspect, uTime, uBeat, uKick; uniform vec3 uRed;
      uniform float uShock, uGear; uniform vec2 uShockPos;
      varying vec2 vUv;
      float hash(float n) { return fract(sin(n) * 43758.5453); }
      float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

      // "object-fit: cover" do vídeo na tela
      vec2 cover(vec2 uv) {
        float sa = uRes.x / uRes.y;
        vec2 s = sa > uVideoAspect ? vec2(1.0, uVideoAspect / sa) : vec2(sa / uVideoAspect, 1.0);
        return (uv - 0.5) * s + 0.5;
      }
      vec3 tex(vec2 uv) { return texture2D(uVideo, clamp(uv, 0.001, 0.999)).rgb; }

      void main() {
        float aspect = uRes.x / uRes.y;
        vec2 uv = cover(vUv);
        // soco de zoom + tremor de câmera na batida, parallax leve do mouse
        float push = 1.0 - 0.06 * (0.5 + 0.5 * sin(uTime * 0.05));                  // zoom lento de câmera
        uv = (uv - 0.5) * push * (1.0 - uKick * 0.05 - uBeat * 0.015) + 0.5;
        uv += vec2(sin(uTime * 13.0), cos(uTime * 11.0)) * 0.0006;                   // tremor de película
        uv += (vec2(hash(uTime * 91.0), hash(uTime * 57.0 + 3.0)) - 0.5) * uKick * 0.012;
        uv += uMouse * 0.008;

        // glitch: faixas horizontais deslocadas nos golpes fortes
        float band = floor(vUv.y * 38.0);
        float g = step(1.0 - uKick * 0.35, hash(band + floor(uTime * 24.0)));
        uv.x += (hash(band * 7.0) - 0.5) * 0.09 * g;

        // onda de choque do Haki do Rei (a partir do clique)
        vec2 sd = (vUv - uShockPos) * vec2(aspect, 1.0);
        float sdist = length(sd);
        float ring = exp(-pow((sdist - uShock * 1.1) * 12.0, 2.0)) * smoothstep(1.3, 0.0, uShock);
        uv -= normalize(sd + 1e-5) / vec2(aspect, 1.0) * ring * 0.05;

        // separação RGB (mais forte na batida e nas bordas)
        vec2 dir = (vUv - 0.5);
        float ca = 0.0015 + uKick * 0.012 + length(dir) * 0.004;
        vec3 col = vec3(tex(uv + dir * ca * 2.0).r, tex(uv).g, tex(uv - dir * ca * 2.0).b);

        // retícula de mangá (halftone) nas sombras
        float lum = dot(col, vec3(0.299, 0.587, 0.114));
        vec2 gp = gl_FragCoord.xy * mat2(0.7071, -0.7071, 0.7071, 0.7071) / 4.5;
        float dotShape = length(fract(gp) - 0.5);
        float ink = 1.0 - smoothstep(0.0, 0.08, dotShape - (1.0 - lum) * 0.55);
        col *= mix(1.0, 0.55, ink * smoothstep(0.55, 0.1, lum) * 0.8);

        // linhas de velocidade saindo do centro na batida
        vec2 p = dir * vec2(aspect, 1.0);
        float ang = atan(p.y, p.x);
        float ray = step(0.86, hash(floor(ang * 90.0) + floor(uTime * 14.0)));
        float r = length(p);
        col = mix(col, vec3(1.0), ray * smoothstep(0.3, 0.95, r) * clamp(uKick * 1.3, 0.0, 0.85));

        // ---- CINEMA ----
        // brilho nas luzes fortes (bloom barato em 6 amostras) + flare anamórfico horizontal
        vec3 glow = vec3(0.0);
        for (int i = 0; i < 6; i++) {
          float a = float(i) * 1.0472;
          vec3 s = tex(uv + vec2(cos(a), sin(a)) * 0.008 * vec2(1.0 / aspect, 1.0));
          glow += max(s - 0.8, 0.0);
        }
        col += glow / 6.0 * 0.9;
        vec3 streak = vec3(0.0);
        for (int i = -3; i <= 3; i++) {
          vec3 s = tex(uv + vec2(float(i) * 0.036, 0.0));
          streak += max(s - 0.8, 0.0) * (1.0 - abs(float(i)) / 4.0);
        }
        col += vec3(0.35, 0.55, 1.0) * dot(streak, vec3(0.333)) * 0.7 * (1.0 + uKick);

        // curva de filme + teal nas sombras / laranja nas altas luzes
        col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);      // ACES
        float l2 = dot(col, vec3(0.299, 0.587, 0.114));
        col += vec3(-0.02, 0.03, 0.05) * smoothstep(0.45, 0.0, l2);
        col += vec3(0.06, 0.02, -0.04) * smoothstep(0.45, 1.0, l2);
        col = mix(vec3(l2), col, 1.12);                                             // um pouco mais saturado
        col += uRed * 0.05 * smoothstep(0.4, 0.0, lum) * (0.5 + uBeat);            // Haki nas sombras
        col += vec3(1.0, 0.95, 0.9) * uKick * 0.07;                                 // flash no golpe

        // luz vazando (light leak) quente passeando pelas bordas
        vec2 lp = vec2(0.5 + 0.55 * sin(uTime * 0.13), 0.5 + 0.6 * cos(uTime * 0.09));
        col += vec3(1.0, 0.45, 0.15) * 0.12 * smoothstep(0.75, 0.0, length((vUv - lp) * vec2(aspect, 1.0)));

        // poeira e riscos de película
        float scratch = step(0.9985, hash(floor(vUv.x * 900.0) + floor(uTime * 12.0))) * step(0.6, hash(floor(uTime * 12.0) + 5.0));
        col += scratch * 0.12;
        float dust = step(0.99985, hash2(floor(gl_FragCoord.xy / 3.0) + floor(uTime * 8.0)));
        col = mix(col, vec3(0.05), dust * 0.8);

        // anel vermelho da onda de choque
        col += vec3(1.0, 0.1, 0.12) * ring * 0.35;
        col = mix(col, col * vec3(0.55, 0.25, 0.28), smoothstep(0.5, 0.0, sdist) * smoothstep(0.5, 0.0, uShock) * 0.6);

        // GEAR 5: mundo vira desenho branco com traço de nanquim
        if (uGear > 0.001) {
          vec2 px = 1.5 / uRes;
          float lx = dot(tex(uv + vec2(px.x, 0.0)) - tex(uv - vec2(px.x, 0.0)), vec3(0.333));
          float ly = dot(tex(uv + vec2(0.0, px.y)) - tex(uv - vec2(0.0, px.y)), vec3(0.333));
          float edge = smoothstep(0.05, 0.16, length(vec2(lx, ly)));
          float toon = floor(lum * 3.0) / 3.0;
          vec3 cartoon = mix(vec3(0.97, 0.96, 0.93), vec3(0.78, 0.76, 0.8), 1.0 - toon) * (1.0 - edge);
          col = mix(col, cartoon, uGear);
        }

        // vinheta, grão fino e leve cintilação do projetor
        col *= smoothstep(1.3, 0.3, length(dir * vec2(aspect * 0.8, 1.0)));
        col += (hash2(gl_FragCoord.xy + uTime * 60.0) - 0.5) * 0.045;
        col *= 0.985 + 0.015 * sin(uTime * 48.0);
        gl_FragColor = vec4(col, 1.0);
      }`,
  })));

  // ---------- partículas 3D: neve (azul) e brasas (fogo) em profundidade ----------
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
  camera.position.z = 10;
  function dotTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,.5)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  const dotTex = dotTexture();
  function particles(count, color, size, blending) {
    const pos = new Float32Array(count * 3), data = [];
    for (let i = 0; i < count; i++) {
      pos.set([(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, Math.random() * -30 + 8], i * 3);
      data.push({ v: 0.4 + Math.random() * 1.4, ph: Math.random() * 6.28 });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      color, size, map: dotTex, transparent: true, depthWrite: false, blending, sizeAttenuation: true,
    }));
    pts.userData.data = data;
    scene.add(pts);
    return pts;
  }
  const snow = particles(900, new THREE.Color(P.ice), 0.16, THREE.NormalBlending);
  const embers = particles(260, new THREE.Color(P.fire), 0.2, THREE.AdditiveBlending);

  let mx = 0, my = 0;
  addEventListener("mousemove", (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  addEventListener("resize", () => {
    renderer.setSize(innerWidth, innerHeight);
    fxUniforms.uRes.value.set(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  const clock = new THREE.Clock();
  let last = 0;
  (function loop() {
    requestAnimationFrame(loop);
    adaptResolution();
    const t = clock.getElapsedTime(), dt = Math.min(0.05, t - last); last = t;
    readAudio(t);
    kick *= Math.pow(0.02, dt);
    root.style.setProperty("--beat", (beat * 0.6 + kick * 0.6).toFixed(3));
    drawWave();
    drawPhoto();
    updateHud();
    maybePop(t);

    drawCracks(dt);
    fxUniforms.uShock.value += dt * 1.2;
    const gearOn = performance.now() < gearUntil;
    fxUniforms.uGear.value += ((gearOn ? 1 : 0) - fxUniforms.uGear.value) * 0.08;
    if (!gearOn && document.body.classList.contains("gear5")) document.body.classList.remove("gear5");
    fxUniforms.uTime.value = t;
    fxUniforms.uBeat.value = beat;
    fxUniforms.uKick.value = kick;
    fxUniforms.uMouse.value.set(mx, -my);

    // neve cai e dança; brasas sobem; as duas aceleram no golpe
    const boost = 1 + kick * 4;
    for (const [pts, dirY] of [[snow, -1], [embers, 1]]) {
      const a = pts.geometry.attributes.position.array, d = pts.userData.data;
      for (let i = 0; i < d.length; i++) {
        const o = i * 3;
        a[o + 1] += dirY * d[i].v * dt * boost;
        a[o] += Math.sin(t * 0.7 + d[i].ph) * dt * 0.5 + dt * 0.25;
        if (a[o + 1] < -10) a[o + 1] = 10;
        if (a[o + 1] > 10) a[o + 1] = -10;
        if (a[o] > 15) a[o] = -15;
      }
      pts.geometry.attributes.position.needsUpdate = true;
    }
    embers.material.size = 0.2 + kick * 0.25;
    camera.position.x += (mx * 1.5 - camera.position.x) * 0.05;
    camera.position.y += (-my * 1 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, -5);

    renderer.clear();
    renderer.render(bgScene, bgCam);
    renderer.render(scene, camera);
  })();
} else {
  // sem WebGL: só o vídeo normal por trás, e a batida ainda mexe no cartaz
  (function loop(t) {
    requestAnimationFrame(loop);
    readAudio(t / 1000);
    kick *= 0.93;
    root.style.setProperty("--beat", (beat * 0.6 + kick * 0.6).toFixed(3));
    drawWave();
  })(0);
}
