import './style.css';

// ---------- setup ----------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 0;
let H = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

const GOLD = '#ffc857';
const EMBER = '#ff7a3d';
const ICE = '#8fe3ff';

// ---------- state ----------
let state = 'title'; // 'title' | 'play' | 'over'
let elapsed = 0;
let spawnTimer = 0;
let overAt = 0;
let best = 0;
try { best = Number(localStorage.getItem('asteroidDoge.best')) || 0; } catch (e) { /* storage unavailable */ }

const player = { x: 0, y: 0, r: 16 };
let asteroids = [];
let particles = [];

const stars = Array.from({ length: 90 }, () => ({
  x: Math.random(),
  y: Math.random(),
  z: 0.2 + Math.random() * 0.8,
}));

// ---------- input ----------
const keys = new Set();
let pointerTarget = null;

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  keys.add(k);
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  if ((k === ' ' || k === 'enter') && canStart()) start();
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

canvas.addEventListener('pointerdown', (e) => {
  pointerTarget = { x: e.clientX, y: e.clientY };
  if (canStart()) start();
});
canvas.addEventListener('pointermove', (e) => {
  if (e.buttons || e.pointerType === 'mouse') pointerTarget = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointerup', (e) => {
  if (e.pointerType !== 'mouse') pointerTarget = null;
});

function canStart() {
  if (state === 'title') return true;
  return state === 'over' && performance.now() - overAt > 600; // avoid instant restarts
}

// ---------- game flow ----------
function start() {
  state = 'play';
  elapsed = 0;
  spawnTimer = 0;
  asteroids = [];
  particles = [];
  player.x = W / 2;
  player.y = H * 0.8;
}

function gameOver() {
  state = 'over';
  overAt = performance.now();
  const score = Math.floor(elapsed * 10);
  if (score > best) {
    best = score;
    try { localStorage.setItem('asteroidDoge.best', String(best)); } catch (e) { /* ignore */ }
  }
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 60 + Math.random() * 260;
    particles.push({
      x: player.x, y: player.y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 0.6 + Math.random() * 0.8,
      color: Math.random() < 0.5 ? GOLD : EMBER,
    });
  }
}

function spawnAsteroid() {
  const r = 14 + Math.random() * 30;
  const points = Array.from({ length: 9 }, (_, i) => {
    const ang = (i / 9) * Math.PI * 2;
    const rad = r * (0.75 + Math.random() * 0.35);
    return [Math.cos(ang) * rad, Math.sin(ang) * rad];
  });
  asteroids.push({
    x: Math.random() * W,
    y: -r * 2,
    vx: (Math.random() - 0.5) * 80,
    vy: 110 + Math.random() * 90 + elapsed * 4,
    r,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 3,
    points,
  });
}

// ---------- update ----------
function update(dt) {
  // stars drift in every state
  for (const s of stars) {
    s.y += dt * 0.05 * s.z * (state === 'play' ? 3 : 1);
    if (s.y > 1) { s.y = 0; s.x = Math.random(); }
  }

  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);

  if (state !== 'play') return;
  elapsed += dt;

  // movement: keyboard, or pointer/touch steering
  const speed = 360;
  let dx = 0;
  let dy = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    player.x += (dx / len) * speed * dt;
    player.y += (dy / len) * speed * dt;
  } else if (pointerTarget) {
    const tx = pointerTarget.x - player.x;
    const ty = pointerTarget.y - player.y;
    const dist = Math.hypot(tx, ty);
    if (dist > 2) {
      const step = Math.min(dist, 700 * dt);
      player.x += (tx / dist) * step;
      player.y += (ty / dist) * step;
    }
  }
  player.x = Math.max(player.r, Math.min(W - player.r, player.x));
  player.y = Math.max(player.r, Math.min(H - player.r, player.y));

  // asteroids get more frequent over time
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnAsteroid();
    spawnTimer = Math.max(0.22, 0.85 - elapsed * 0.01);
  }

  for (const a of asteroids) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    a.rot += a.spin * dt;
    if (Math.hypot(a.x - player.x, a.y - player.y) < a.r * 0.85 + player.r * 0.7) {
      gameOver();
      break;
    }
  }
  asteroids = asteroids.filter((a) => a.y < H + a.r * 2 && a.x > -100 && a.x < W + 100);
}

// ---------- draw ----------
function draw() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0b1026');
  sky.addColorStop(0.6, '#151b3f');
  sky.addColorStop(1, '#3a2149');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.globalAlpha = 0.35 + s.z * 0.65;
    ctx.fillRect(s.x * W, s.y * H, s.z * 2, s.z * 2);
  }
  ctx.globalAlpha = 1;

  for (const a of asteroids) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    ctx.beginPath();
    a.points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fillStyle = '#2b2447';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#8a7aa8';
    ctx.stroke();
    ctx.restore();
  }

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
  }
  ctx.globalAlpha = 1;

  if (state !== 'over') drawPlayer();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#eef2ff';

  if (state === 'play') {
    ctx.textAlign = 'left';
    ctx.font = '20px Georgia, serif';
    ctx.fillText(`Score ${Math.floor(elapsed * 10)}`, 16, 32);
    ctx.textAlign = 'right';
    ctx.fillStyle = ICE;
    ctx.fillText(`Best ${best}`, W - 16, 32);
  } else if (state === 'title') {
    banner('ASTEROID DOGE', 'Dodge the rocks. Survive the dark.', 'Arrows / WASD / touch to steer. Press Space or tap to launch.');
  } else {
    banner('WRECKED', `Score ${Math.floor(elapsed * 10)}  \u00b7  Best ${best}`, 'Press Space or tap to try again.');
  }
}

function drawPlayer() {
  ctx.save();
  ctx.shadowColor = GOLD;
  ctx.shadowBlur = 18;
  ctx.font = '34px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\uD83D\uDC15', player.x, player.y);
  ctx.restore();
}

function banner(title, line1, line2) {
  const g = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
  g.addColorStop(0, GOLD);
  g.addColorStop(1, EMBER);
  ctx.fillStyle = g;
  ctx.font = `bold ${Math.min(64, W / 9)}px Georgia, serif`;
  ctx.fillText(title, W / 2, H * 0.38);
  ctx.fillStyle = '#c9d3ff';
  ctx.font = `italic ${Math.min(22, W / 20)}px Georgia, serif`;
  ctx.fillText(line1, W / 2, H * 0.38 + 44);
  ctx.fillStyle = ICE;
  ctx.font = `${Math.min(16, W / 24)}px Georgia, serif`;
  ctx.fillText(line2, W / 2, H * 0.38 + 80);
}

// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
