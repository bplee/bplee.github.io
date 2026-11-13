/* ══════════════════════════════════════════
   WEATHER
   Random weather that drifts from one kind to the next.
   Each type has an "amount" 0..1 that fades in/out, so transitions blend.

   Gameplay effects (outside only):
     rain / storm  → slippery ground
     snow          → slower walking, snow piles up on the ground + roofs
     wind / storm  → pushes the player and the volleyball
     fog           → hard to see
   Whimsy: petal showers, falling stars, and very occasionally… frogs.

   Debug: ?weather=snow in the URL forces a starting type; press R to reroll.
══════════════════════════════════════════ */
const WEATHER_TYPES = {
  clear:  { label: 'clear night',     weight: 3   },
  rain:   { label: 'rain',            weight: 2   },
  storm:  { label: 'thunderstorm',    weight: 1   },
  snow:   { label: 'snowfall',        weight: 1.4 },
  fog:    { label: 'fog',             weight: 1.2 },
  wind:   { label: 'blustery',        weight: 1.4 },
  petals: { label: 'petal shower',    weight: 0.7 },
  stars:  { label: 'falling stars',   weight: 0.6 },
  frogs:  { label: 'raining frogs?!', weight: 0.3 },
};
// how hard the wind blows for each type (sign is random)
const WIND_STRENGTH = { clear: 0.1, rain: 0.4, storm: 1.6, snow: 0.3, fog: 0, wind: 2.2, petals: 0.7, stars: 0.1, frogs: 0.3 };

const weather = {
  type: 'clear',
  timer: 60 * 35,          // frames until the weather changes
  amt: {},                 // type → 0..1 blend amount
  wind: 0, windTarget: 0,
  flash: 0, bolt: null,    // lightning
  snowCover: 0,            // 0..1 accumulated snow
  particles: [],           // screen-space: rain, snow, petals, leaves, splashes
  frogs: [],               // world-space frogs that fall and hop away
  shooting: [],            // screen-space shooting stars
  lastCamX: 0,
  wished: false,
};
Object.keys(WEATHER_TYPES).forEach(k => weather.amt[k] = 0);

const CLOUDS = Array.from({ length: 9 }, () => ({
  x: Math.random() * 1.6, y: 0.04 + Math.random() * 0.26,
  w: 120 + Math.random() * 200, h: 30 + Math.random() * 30,
}));

const rand = (a, b) => a + Math.random() * (b - a);

function pickWeather() {
  const opts = Object.keys(WEATHER_TYPES).filter(k => k !== weather.type);
  const total = opts.reduce((s, k) => s + WEATHER_TYPES[k].weight, 0);
  let r = Math.random() * total;
  for (const k of opts) { r -= WEATHER_TYPES[k].weight; if (r <= 0) return k; }
  return 'clear';
}

function setWeather(type) {
  weather.type  = type;
  weather.timer = Math.floor(rand(40, 90) * 60);
  weather.windTarget = WIND_STRENGTH[type] * (Math.random() < 0.5 ? -1 : 1);
  const box = document.getElementById('weather-box');
  if (box) {
    box.querySelector('.w-label').textContent = WEATHER_TYPES[type].label;
    box.classList.remove('pulse'); void box.offsetWidth; box.classList.add('pulse');
  }
}

// Called once at load
function initWeather() {
  const forced = new URLSearchParams(location.search).get('weather');
  const start = WEATHER_TYPES[forced] ? forced : 'clear';
  setWeather(start);
  weather.amt[start] = 1;
  weather.wind = weather.windTarget;
  if (!forced) weather.timer = 60 * 35; // always open on a calm night
}

window.addEventListener('keydown', e => {
  if (e.code === 'KeyR' && !e.repeat) setWeather(pickWeather());
});

/* ── what weather does to the player ── */
function weatherPhysics() {
  const a = weather.amt;
  return {
    speed: 1 - 0.22 * a.snow,
    slip:  Math.min(1, Math.max(a.rain * 0.55, a.storm * 0.65, a.snow * 0.45)),
    wind:  weather.wind,
  };
}
// horizontal acceleration the wind applies to the volleyball
function windAccel() { return scene === 'outside' ? weather.wind * 0.006 : 0; }

function cloudiness() {
  const a = weather.amt;
  return Math.min(1, Math.max(a.rain * 0.8, a.storm, a.snow * 0.7, a.fog * 0.5, a.frogs * 0.7, a.wind * 0.3));
}

/* ── UPDATE ── */
function spawnCount(rate) { return Math.floor(rate) + (Math.random() < rate % 1 ? 1 : 0); }

function makeBolt() {
  const pts = [];
  let x = rand(0.1, 0.9) * W, y = 0;
  const gy = groundY(x + camX) - camY;
  while (y < gy) { pts.push([x, y]); x += rand(-30, 30); y += rand(25, 60); }
  pts.push([x, gy]);
  return pts;
}

function updateWeather() {
  const a = weather.amt;

  if (--weather.timer <= 0) setWeather(pickWeather());

  // blend amounts toward the current type (~5s cross-fade)
  for (const k in a) {
    const target = k === weather.type ? 1 : 0;
    a[k] += Math.max(-0.003, Math.min(0.003, target - a[k]));
  }

  // wind eases toward its target, with gusts
  const gust = Math.sin(tick * 0.013) * 0.35 * Math.abs(weather.windTarget);
  weather.wind += (weather.windTarget + gust - weather.wind) * 0.01;

  // snow piles up while it snows, melts otherwise
  weather.snowCover = Math.max(0, Math.min(1, weather.snowCover + a.snow * 0.0005 - (1 - a.snow) * 0.0004));

  CLOUDS.forEach((cl, i) => {
    cl.x += (0.00006 + weather.wind * 0.00012) * (1 + i * 0.1);
    if (cl.x > 1.7) cl.x -= 2; if (cl.x < -0.4) cl.x += 2;
  });

  // lightning
  weather.flash *= 0.88;
  if (a.storm > 0.5 && Math.random() < 0.0035) { weather.flash = 1; weather.bolt = makeBolt(); }

  if (scene !== 'outside') { weather.particles.length = 0; weather.shooting.length = 0; return; }

  // keep particles anchored to the world as the camera moves
  const dx = camX - weather.lastCamX;
  weather.lastCamX = camX;
  if (Math.abs(dx) < 200) weather.particles.forEach(p => p.x -= dx);

  const P = weather.particles;
  const w = weather.wind;
  if (P.length < 700) {
    for (let i = spawnCount(a.rain * 4 + a.storm * 8); i--;)
      P.push({ k: 'rain', x: rand(-150, W + 150), y: rand(-40, -5), vx: w * 2.5, vy: rand(9, 13), len: rand(10, 17) });
    for (let i = spawnCount(a.snow * 1.6); i--;)
      P.push({ k: 'snow', x: rand(-100, W + 100), y: -5, vx: 0, vy: rand(0.6, 1.4), r: rand(1, 2.6), ph: rand(0, 6) });
    for (let i = spawnCount(a.petals * 0.7); i--;)
      P.push({ k: 'petal', x: rand(-100, W + 100), y: -5, vx: 0, vy: rand(0.7, 1.3), rot: rand(0, 6), vr: rand(-0.08, 0.08), ph: rand(0, 6) });
    for (let i = spawnCount(a.wind * 0.5 + a.storm * 0.25); i--;) {
      const fromLeft = w >= 0;
      P.push({ k: 'leaf', x: fromLeft ? -10 : W + 10, y: rand(0.25, 0.85) * H, vx: w * rand(2.5, 4), vy: 0, rot: rand(0, 6), vr: rand(-0.15, 0.15), ph: rand(0, 6), green: Math.random() < 0.4 });
    }
  }

  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i];
    let dead = false;
    switch (p.k) {
      case 'rain':
        p.x += p.vx; p.y += p.vy;
        if (p.y >= (groundY(p.x + camX) - camY)) {
          dead = true;
          if (Math.random() < 0.4) for (let j = 0; j < 2; j++)
            P.push({ k: 'splash', x: p.x, y: p.y - 1, vx: rand(-1.2, 1.2), vy: rand(-2, -1), life: 12 });
        }
        break;
      case 'snow':
        p.ph += 0.03;
        p.x += w * 0.9 + Math.sin(p.ph) * 0.4; p.y += p.vy;
        if (p.y >= (groundY(p.x + camX) - camY)) dead = true;
        break;
      case 'petal':
        p.ph += 0.04; p.rot += p.vr;
        p.x += w * 1.4 + Math.sin(p.ph) * 0.8; p.y += p.vy;
        if (p.y >= (groundY(p.x + camX) - camY)) dead = true;
        break;
      case 'leaf':
        p.ph += 0.05; p.rot += p.vr;
        p.x += p.vx; p.y += Math.sin(p.ph) * 1.2 + 0.3;
        if (p.x < -40 || p.x > W + 40 || p.y > H) dead = true;
        break;
      case 'splash':
        p.x += p.vx; p.y += p.vy; p.vy += 0.25;
        if (--p.life <= 0) dead = true;
        break;
    }
    if (dead || p.x < -300 || p.x > W + 300) P.splice(i, 1);
  }

  // frogs: fall from the sky, land, and hop off unbothered
  if (Math.random() < a.frogs * 0.035) {
    weather.frogs.push({ x: camX + rand(0.05, 0.95) * W, y: -20, vx: w * 0.5, vy: 2, hops: 0, dir: Math.random() < 0.5 ? -1 : 1, onGround: false, alpha: 1 });
  }
  for (let i = weather.frogs.length - 1; i >= 0; i--) {
    const f = weather.frogs[i];
    f.x += f.vx; f.y += f.vy; f.vy += 0.3;
    const gy = groundY(f.x);
    if (f.y >= gy) {
      f.y = gy;
      if (f.hops++ > 6) f.alpha -= 0.05;
      f.vy = -rand(4, 6); f.vx = f.dir * rand(1, 2);
    }
    if (f.alpha <= 0 || f.x < camX - 200 || f.x > camX + W + 200) weather.frogs.splice(i, 1);
  }

  // shooting stars (rare normally, frequent during 'stars')
  if (Math.random() < 0.0006 + a.stars * 0.03) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    weather.shooting.push({ x: rand(0.1, 0.9) * W, y: rand(0.02, 0.3) * H, vx: dir * rand(6, 10), vy: rand(2, 4), life: 1 });
    if (a.stars > 0.5 && !weather.wished && !vball.active) { weather.wished = true; showHint('falling stars… make a wish', 2600); }
  }
  for (let i = weather.shooting.length - 1; i >= 0; i--) {
    const s = weather.shooting[i];
    s.x += s.vx; s.y += s.vy; s.life -= 0.025;
    if (s.life <= 0) weather.shooting.splice(i, 1);
  }
}

/* ── DRAW: behind the world ── */
function drawShootingStars() {
  ctx.save();
  ctx.lineCap = 'round';
  weather.shooting.forEach(s => {
    const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 6, s.y - s.vy * 6);
    g.addColorStop(0, `rgba(255,250,220,${s.life})`);
    g.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 6, s.y - s.vy * 6); ctx.stroke();
  });
  ctx.restore();
}

// darkens the sky and draws drifting clouds (covers stars + moon)
function drawClouds() {
  const c = cloudiness();
  if (c < 0.01) return;
  ctx.save();
  ctx.fillStyle = `rgba(8,10,16,${c * 0.55})`;
  ctx.fillRect(0, 0, W, H);
  CLOUDS.forEach((cl, i) => {
    const x = ((cl.x * W - camX * 0.05) % (W * 2) + W * 2) % (W * 2) - W * 0.3;
    const y = cl.y * H;
    ctx.fillStyle = `rgba(42,46,60,${c * 0.75})`;
    ctx.beginPath();
    ctx.ellipse(x, y, cl.w, cl.h, 0, 0, Math.PI * 2);
    ctx.ellipse(x + cl.w * 0.4, y - cl.h * 0.4, cl.w * 0.55, cl.h * 0.8, 0, 0, Math.PI * 2);
    ctx.ellipse(x - cl.w * 0.45, y - cl.h * 0.2, cl.w * 0.45, cl.h * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// a white rim of snow along the ground
function drawSnowCover() {
  const s = weather.snowCover;
  if (s < 0.02) return;
  ctx.save();
  ctx.beginPath();
  groundPath(8).forEach(([x, y], i) => i ? ctx.lineTo(x - camX, y) : ctx.moveTo(x - camX, y));
  ctx.strokeStyle = `rgba(230,236,245,${0.25 + s * 0.6})`;
  ctx.lineWidth = 1 + s * 6;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

function drawFrogs() {
  if (!weather.frogs.length) return;
  ctx.save();
  weather.frogs.forEach(f => {
    ctx.globalAlpha = Math.max(0, f.alpha);
    drawCritter(f.x - camX, f.y, 'toad', { color: '#7aa070', scale: 0.55, dir: f.dir });
  });
  ctx.restore();
}

/* ── DRAW: in front of the world ── */
function drawWeatherFront() {
  const a = weather.amt;
  ctx.save();
  ctx.lineCap = 'round';

  // particles
  ctx.lineWidth = 1;
  for (const p of weather.particles) {
    switch (p.k) {
      case 'rain':
        ctx.strokeStyle = 'rgba(170,190,220,0.45)';
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * p.len / p.vy, p.y - p.len); ctx.stroke();
        break;
      case 'splash':
        ctx.fillStyle = 'rgba(170,190,220,0.5)';
        ctx.fillRect(p.x, p.y, 1.5, 1.5);
        break;
      case 'snow':
        ctx.fillStyle = 'rgba(240,244,250,0.85)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        break;
      case 'petal':
        ctx.fillStyle = 'rgba(240,170,195,0.8)';
        ctx.beginPath(); ctx.ellipse(p.x, p.y, 3.5, 2, p.rot, 0, Math.PI * 2); ctx.fill();
        break;
      case 'leaf':
        ctx.fillStyle = p.green ? 'rgba(110,150,80,0.75)' : 'rgba(170,120,60,0.75)';
        ctx.beginPath(); ctx.ellipse(p.x, p.y, 5, 2.2, p.rot, 0, Math.PI * 2); ctx.fill();
        break;
    }
  }

  // fog: drifting bands near the ground
  if (a.fog > 0.01) {
    for (let i = 0; i < 4; i++) {
      const y = H * (0.55 + i * 0.09);
      const off = ((tick * (0.2 + i * 0.12) - camX * (0.3 + i * 0.15)) % (W * 2) + W * 2) % (W * 2);
      for (const x of [off - W * 2, off - W, off]) {
        const g = ctx.createRadialGradient(x + W * 0.5, y, 10, x + W * 0.5, y, W * 0.7);
        g.addColorStop(0, `rgba(150,160,175,${a.fog * 0.22})`);
        g.addColorStop(1, 'rgba(150,160,175,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - W * 0.2, y - H * 0.25, W * 1.4, H * 0.5);
      }
    }
    ctx.fillStyle = `rgba(120,130,145,${a.fog * 0.18})`;
    ctx.fillRect(0, 0, W, H);
  }

  // lightning
  if (weather.flash > 0.02) {
    if (weather.bolt && weather.flash > 0.35) {
      ctx.strokeStyle = `rgba(235,240,255,${weather.flash})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      weather.bolt.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(220,228,255,${weather.flash * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/* ── A window view of the weather (used inside the tavern) ── */
function drawWeatherWindow(x, y, w, h) {
  const a = weather.amt;
  const c = cloudiness();
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();

  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#070912'); g.addColorStop(1, '#141a2a');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);

  // a few stars + the moon peeking in when it's clear
  if (c < 0.6) {
    ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - c)})`;
    for (let i = 0; i < 6; i++) ctx.fillRect(x + ((i * 37 + x) % w), y + ((i * 23) % (h * 0.6)), 1.2, 1.2);
  }
  // distant treeline
  ctx.fillStyle = 'rgba(18,30,16,0.9)';
  for (let i = -1; i < 5; i++) {
    ctx.beginPath(); ctx.ellipse(x + i * w / 4 + 10, y + h, w / 5, h * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = `rgba(8,10,16,${c * 0.5})`; ctx.fillRect(x, y, w, h);

  const lean = weather.wind * 3;
  // rain streaks
  const rain = a.rain + a.storm * 1.5;
  if (rain > 0.02) {
    ctx.strokeStyle = `rgba(170,190,220,${0.5 * Math.min(1, rain)})`; ctx.lineWidth = 1;
    const n = Math.floor(rain * 22);
    for (let i = 0; i < n; i++) {
      const px = x + ((i * 53.7 + tick * lean * 0.8) % w + w) % w;
      const py = y + ((i * 31.3 + tick * 9) % (h + 20)) - 10;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - lean, py + 9); ctx.stroke();
    }
  }
  // snow / petals / frogs
  const drift = (n, speed, draw) => {
    for (let i = 0; i < n; i++) {
      const px = x + ((i * 41.3 + tick * (weather.wind * 0.6) + Math.sin(tick * 0.02 + i) * 6) % w + w) % w;
      const py = y + ((i * 29.1 + tick * speed) % (h + 10)) - 5;
      draw(px, py, i);
    }
  };
  if (a.snow > 0.02) { ctx.fillStyle = `rgba(240,244,250,${0.85 * a.snow})`; drift(Math.floor(a.snow * 16), 0.8, (px, py) => { ctx.beginPath(); ctx.arc(px, py, 1.6, 0, 7); ctx.fill(); }); }
  if (a.petals > 0.02) { ctx.fillStyle = `rgba(240,170,195,${0.8 * a.petals})`; drift(Math.floor(a.petals * 8), 0.9, (px, py, i) => { ctx.beginPath(); ctx.ellipse(px, py, 3, 1.8, tick * 0.05 + i, 0, 7); ctx.fill(); }); }
  if (a.frogs > 0.3) { ctx.globalAlpha = a.frogs; drift(2, 2.5, (px, py) => drawCritter(px, py, 'toad', { color: '#7aa070', scale: 0.35 })); ctx.globalAlpha = 1; }
  if (a.fog > 0.02) { ctx.fillStyle = `rgba(140,150,165,${a.fog * 0.55})`; ctx.fillRect(x, y, w, h); }
  if (weather.flash > 0.02) { ctx.fillStyle = `rgba(220,228,255,${weather.flash * 0.8})`; ctx.fillRect(x, y, w, h); }

  ctx.restore();

  // frost creeping in from the corners when it snows
  if (weather.snowCover > 0.05) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const f = weather.snowCover;
    [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy]) => {
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.45 * f);
      rg.addColorStop(0, `rgba(225,235,245,${0.7 * f})`); rg.addColorStop(1, 'rgba(225,235,245,0)');
      ctx.fillStyle = rg; ctx.fillRect(x, y, w, h);
    });
    ctx.fillStyle = `rgba(235,240,248,${0.8 * f})`;
    ctx.fillRect(x, y + h - 3 * f - 1, w, 3 * f + 1); // snow on the sill
    ctx.restore();
  }
}
