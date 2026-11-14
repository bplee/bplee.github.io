/* ══════════════════════════════════════════
   THE CAVERN — under the observatory hill
   Outside: a cave mouth at the foot of the hill's little cliff (CAVE_X),
   packed with earth until you dig it open with a shovel.
   Inside: its own scene (scene === 'cavern'). A narrow root-lined tunnel
   slopes down, then opens into a big chamber with ledges and an
   underground pool at the bottom. The camera follows you up and down.

   Coordinates: x is 0..CAVE_W; heights in CAVE_FLOOR / CAVE_CEIL are px
   below the entrance floor (caveRef), so + is deeper.
══════════════════════════════════════════ */
const CAVE_X = 7105;   // world x of the cave mouth (outside)
const CAVE_W = 4700;

const CAVE_FLOOR = [
  [0, 0], [240, 0], [380, 30], [520, 70], [640, 95], [720, 110],      // the tunnel
  [780, 170], [860, 250], [960, 290], [1060, 360], [1160, 450],        // it opens up…
  [1260, 500], [1360, 600], [1440, 700], [1500, 770],                  // …and drops toward the lake
  [1560, 860], [1700, 930], [1880, 960], [1960, 1040],                 // the shallow shelf
  [2020, 1250], [2080, 1480], [2160, 1620], [2300, 1660], [2440, 1650], [2520, 1560],   // the deep trench
  [2580, 1300], [2640, 1080], [2760, 980], [2900, 930], [3000, 850], [3060, 770], [3120, 700],  // up the far side
  [3400, 706], [3700, 700], [4700, 700],                               // the old mine, then umber's burrow
];
const CAVE_CEIL = [
  [0, -150], [240, -140], [380, -110], [520, -60], [640, -30], [720, -20],
  [780, -120], [860, -300], [1000, -470], [1300, -560], [1800, -600],
  [2400, -600], [2800, -480], [3000, -200], [3100, 300], [3160, 480],  // the roof comes down into the mine
  [3500, 470], [3800, 490], [3880, 470],
  [3940, 330], [4100, 300], [4400, 310], [4500, 360],                  // umber's burrow (a little taller)
  [4530, 420], [4540, -480], [4600, -480], [4610, 420], [4700, 420],   // the ladder shaft up to the surface
];
// one-way rock ledges (land on them from above, ↓ to drop through)
const CAVE_LEDGES = [
  { x1: 880,  x2: 1000, y: 180 },
  { x1: 1150, x2: 1270, y: 345 },
  { x1: 1310, x2: 1420, y: 265 },          // a climb up the chamber wall…
  { x1: 1460, x2: 1570, y: 185 },
  { x1: 1610, x2: 1730, y: 110, perch: true },   // …to the glowstone's perch, high over the lake
  { x1: 1720, x2: 1830, y: 690 },          // stepping stones across the water
  { x1: 1960, x2: 2080, y: 640 },
  { x1: 2250, x2: 2360, y: 690 },
  { x1: 2600, x2: 2720, y: 660 },
  { x1: 2860, x2: 2970, y: 640 },
  { x1: 3290, x2: 3400, y: 580, scaffold: true },   // the miners' old scaffold
];
const WATER_REL = 760, POOL_X0 = 1492, POOL_X1 = 3068;
const GLOWSTONE_X = 1670, GLOWSTONE_Y = 110;

const caveState = { dug: false, digging: 0, seenPool: false, entered: false };
const cave = { drips: [], ripples: [], spores: [], dirt: [], splashes: [] };

function caveRef() { return H * BASE_GND; }
function polyAt(P, x) {
  if (x <= P[0][0]) return P[0][1];
  for (let i = 0; i < P.length - 1; i++) {
    const [x1, y1] = P[i], [x2, y2] = P[i + 1];
    if (x >= x1 && x <= x2) return y1 + (y2 - y1) * (x - x1) / (x2 - x1);
  }
  return P[P.length - 1][1];
}
function caveFloorY(x) { return caveRef() + polyAt(CAVE_FLOOR, x); }
function caveCeilY(x)  { return caveRef() + polyAt(CAVE_CEIL, x); }
function cavePlatformY(x) {
  for (const l of CAVE_LEDGES) if (x >= l.x1 && x <= l.x2) return caveRef() + l.y;
  return null;
}
const waterY = () => caveRef() + WATER_REL;

/* ── physics hook (called from updatePlayer) ── */
function caveCeiling() {
  if (player.climbing) return;
  const s = playerScale(), head = player._py - 72 * s, c = caveCeilY(player.wx) + 2;
  if (head < c) { player._py = c + 72 * s; if (player.vy < 0) player.vy = 0; }
}
// (the lake — swimming, diving, breath — lives in cavern_lake.js)

/* ══════════════════════════════════════════
   ENTER / EXIT / DIG
══════════════════════════════════════════ */
function nearCaveMouth() { return scene === 'outside' && Math.abs(player.wx - CAVE_X) < 46 && player._py > groundY(CAVE_X) - 20; }

function caveMouthPopup() {
  if (!nearCaveMouth()) return null;
  if (caveState.digging > 0) return null;
  if (caveState.dug) return 'press E to go into the cave';
  return hasItem('shovel') ? 'press E to dig' : 'a cave mouth, packed with earth. if only you had a shovel…';
}
function cavernPopup() {
  if (player.wx < 110) return 'press E to climb back out';
  if (!hasItem('glowstone') && Math.abs(player.wx - GLOWSTONE_X) < 200 && player._py > caveRef() + GLOWSTONE_Y + 40 && player._py < caveRef() + 560) return 'something is glowing, way up there…';
  return lakePopup() || deepPopup();
}

function enterCavern() {
  fadeTransition(() => {
    scene = 'cavern';
    player.wx = 90; player._py = caveFloorY(90); player.vy = 0; _vx = 0;
    player.onPlatform = false; player.inWater = false; player.facingRight = true;
    camX = 0; camY = player._py - H * 0.58;
    if (!caveState.entered) showHint("the old mole's tunnel. it smells like roots.", 3000);
    caveState.entered = true;
  });
}
function exitCavern() {
  fadeTransition(() => {
    scene = 'outside';
    player.wx = CAVE_X + 40; player._py = groundY(player.wx); player.vy = 0; _vx = 0;
    player.onPlatform = false; player.inWater = false; player.facingRight = true; player.climbing = 0;
    lake.under = false; lake.surfacing = false; lake.breath = 1;
    camX = Math.max(0, Math.min(WORLD_W - W, player.wx - W * 0.3)); camY = 0;
    weather.lastCamX = camX;
  });
}

window.addEventListener('keydown', e => {
  if (e.code !== 'KeyE' || e.repeat || transitioning || !started) return;
  if (scene === 'cavern') { if (player.wx < 110) exitCavern(); else lakeAction() || deepAction(); return; }
  if (scene !== 'outside' || !nearCaveMouth() || caveState.digging > 0) return;
  if (caveState.dug) enterCavern();
  else if (hasItem('shovel')) { caveState.digging = 90; showHint('dig, dig, dig…', 1500); }
});

/* ══════════════════════════════════════════
   UPDATE
══════════════════════════════════════════ */
// outside: digging + dirt flying
function updateCaveMouth() {
  if (caveState.digging > 0) {
    caveState.digging--;
    player.bumpT = 6; _vx = 0;
    if (tick % 4 === 0) cave.dirt.push({ x: CAVE_X + rand(-14, 14), y: groundY(CAVE_X) - 10, vx: rand(-2.5, 2.5), vy: rand(-4, -2), life: 1 });
    if (caveState.digging === 0) {
      caveState.dug = true;
      if (questState.dig === 'open') completeQuest('dig');
      startQuest('report');
      showHint('the earth gives way. a cool breath of air comes out of the dark.', 3200);
    }
  }
  for (let i = cave.dirt.length - 1; i >= 0; i--) {
    const d = cave.dirt[i]; d.x += d.vx; d.y += d.vy; d.vy += 0.25; d.life -= 0.02;
    if (d.life <= 0 || d.y > groundY(d.x) + 2) cave.dirt.splice(i, 1);
  }
}

function updateCavern() {
  const R = caveRef();
  updateLake(); updateDeep();
  if (!caveState.seenPool && player.wx > 1440) {
    caveState.seenPool = true;
    showHint(questState.report === 'open' ? "a lake. under the hill. nova will want to hear about this." : 'a hidden lake under the hill…', 3500);
  }
  if (!hasItem('glowstone') && Math.abs(player.wx - GLOWSTONE_X) < 20 && player.onGround && player._py < R + GLOWSTONE_Y + 4) {
    give('glowstone');
  }
  // drips from the ceiling (mostly over the pool)
  if (Math.random() < 0.04) {
    const x = Math.random() < 0.7 ? rand(POOL_X0 + 20, POOL_X1 - 20) : rand(300, CAVE_W - 100);
    cave.drips.push({ x, y: caveCeilY(x) + 4, vy: 0 });
  }
  for (let i = cave.drips.length - 1; i >= 0; i--) {
    const d = cave.drips[i]; d.vy += 0.3; d.y += d.vy;
    const inPool = d.x > POOL_X0 && d.x < POOL_X1;
    if (inPool && d.y >= waterY()) { cave.ripples.push({ x: d.x, r: 1, life: 1 }); cave.drips.splice(i, 1); }
    else if (!inPool && d.y >= caveFloorY(d.x)) cave.drips.splice(i, 1);
  }
  for (let i = cave.ripples.length - 1; i >= 0; i--) { const r = cave.ripples[i]; r.r += 0.4; r.life -= 0.02; if (r.life <= 0) cave.ripples.splice(i, 1); }
  for (let i = cave.splashes.length - 1; i >= 0; i--) { const s = cave.splashes[i]; s.x += s.vx; s.y += s.vy; s.vy += 0.25; s.life -= 0.04; if (s.life <= 0) cave.splashes.splice(i, 1); }
  // floating glow spores in the big chamber
  if (cave.spores.length < 60 && Math.random() < 0.3) {
    const x = rand(760, CAVE_W - 60);
    cave.spores.push({ x, y: rand(caveCeilY(x) + 40, caveFloorY(x) - 20), ph: rand(0, 6), life: 0 });
  }
  cave.spores.forEach(p => { p.ph += 0.02; p.x += Math.sin(p.ph) * 0.2; p.y -= 0.08; p.life += 0.004; });
  for (let i = cave.spores.length - 1; i >= 0; i--) if (cave.spores[i].life > 2) cave.spores.splice(i, 1);
}

/* ══════════════════════════════════════════
   DRAW — outside: the cave mouth at the bottom of the cliff
══════════════════════════════════════════ */
function drawCaveMouth() {
  const sx = CAVE_X - camX;
  if (sx < -200 || sx > W + 200) return;
  const gy = groundY(CAVE_X);
  ctx.save();
  // a rocky outcrop around the opening (decoration — you walk in front of it)
  ctx.fillStyle = '#1e1a15';
  ctx.beginPath();
  ctx.moveTo(sx - 50, gy); ctx.lineTo(sx - 46, gy - 128); ctx.quadraticCurveTo(sx + 10, gy - 140, sx + 40, gy - 96);
  ctx.quadraticCurveTo(sx + 66, gy - 50, sx + 70, gy); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(120,110,90,0.4)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(80,72,60,0.35)';
  [[-30, -100, 6], [20, -110, 4], [44, -60, 5], [-36, -40, 4]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(sx + dx, gy + dy, r, 0, 7); ctx.fill(); });
  // roots poking out over the top
  ctx.strokeStyle = 'rgba(110,85,60,0.7)';
  for (let i = 0; i < 5; i++) {
    const rx = sx - 30 + i * 16, sw = Math.sin(tick * 0.025 + i) * 2 + weather.wind * 2;
    ctx.beginPath(); ctx.moveTo(rx, gy - 92); ctx.quadraticCurveTo(rx + sw * 0.4, gy - 82, rx + sw, gy - 70 - (i % 2) * 6); ctx.stroke();
  }
  // the opening
  ctx.fillStyle = '#050608';
  ctx.beginPath(); ctx.moveTo(sx - 30, gy); ctx.lineTo(sx - 30, gy - 50); ctx.quadraticCurveTo(sx, gy - 92, sx + 34, gy - 50); ctx.lineTo(sx + 34, gy); ctx.closePath(); ctx.fill();
  // a faint teal glow from deep inside
  const p = 0.6 + 0.4 * Math.sin(tick * 0.02);
  drawGlow(sx + 2, gy - 30, 46, (caveState.dug ? 0.22 : 0.08) * p, [100, 220, 210]);
  // packed earth until it's dug out
  const left = caveState.dug ? 0 : caveState.digging > 0 ? caveState.digging / 90 : 1;
  if (left > 0) {
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath(); ctx.moveTo(sx - 30, gy); ctx.quadraticCurveTo(sx + 2, gy - 80 * left, sx + 34, gy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(90,70,45,0.6)';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(sx - 20 + i * 9, gy - 8 - (i % 3) * 10 * left, 2, 0, 7); ctx.fill(); }
  }
  cave.dirt.forEach(d => { ctx.fillStyle = `rgba(110,85,55,${d.life})`; ctx.fillRect(d.x - camX, d.y, 3, 3); });
  // sign
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(sx + 140, gy - 40, 3, 40); ctx.fillRect(sx + 110, gy - 50, 64, 16);
  ctx.fillStyle = 'rgba(230,205,160,0.85)'; ctx.font = '8px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText("the old mole's", sx + 142, gy - 44); ctx.fillText('tunnel', sx + 142, gy - 37);
  ctx.restore();
}

/* ══════════════════════════════════════════
   DRAW — inside the cavern (call inside the camera translate)
══════════════════════════════════════════ */
const CAVE_SPECKS = Array.from({ length: 800 }, () => ({ x: Math.random() * CAVE_W, y: -700 + Math.random() * 2500, r: 0.6 + Math.random() * 2, a: 0.05 + Math.random() * 0.12 }));
const CAVE_PILLARS = [[1080, 46, 0.5], [2780, 60, 0.45]];       // x, width, darkness (background)
const CAVE_MUSHROOMS = [300, 560, 820, 1180, 1520, 1880, 2260, 2620];                    // upside-down, on the ceiling
const GLOWWORMS = Array.from({ length: 200 }, () => ({ x: 760 + Math.random() * 2300, d: 4 + Math.random() * 40, ph: Math.random() * 6 }));
const CRYSTALS = [[1460, 1], [3085, 1.2], [3150, 0.8], [960, 0.7]];

function cavePath(P, step) {
  const x0 = Math.max(0, camX - 30), x1 = Math.min(CAVE_W, camX + W + 30), R = caveRef(), pts = [];
  for (let x = x0; x <= x1; x += step) pts.push([x, R + polyAt(P, x)]);
  pts.push([x1, R + polyAt(P, x1)]);
  return pts;
}

function drawCavern() {
  const R = caveRef(), ox = -camX;
  const top = camY - 20, bot = camY + H + 20;
  const flick = 0.85 + Math.sin(tick * 0.21) * 0.05 + Math.sin(tick * 0.53) * 0.04;

  // solid rock everywhere…
  ctx.fillStyle = '#16120f'; ctx.fillRect(0, top, W, bot - top);
  CAVE_SPECKS.forEach(p => {
    const x = ox + p.x, y = R + p.y;
    if (x < -5 || x > W + 5 || y < top || y > bot) return;
    ctx.fillStyle = `rgba(150,130,100,${p.a})`; ctx.fillRect(x, y, p.r, p.r);
  });

  // …with the cave hollowed out of it
  const ceil = cavePath(CAVE_CEIL, 8), floor = cavePath(CAVE_FLOOR, 8);
  const hollow = () => {
    ctx.beginPath();
    ceil.forEach(([x, y], i) => i ? ctx.lineTo(ox + x, y) : ctx.moveTo(ox + x, y));
    for (let i = floor.length - 1; i >= 0; i--) ctx.lineTo(ox + floor[i][0], floor[i][1]);
    ctx.closePath();
  };
  hollow();
  const ig = ctx.createLinearGradient(0, R - 600, 0, R + 900);
  ig.addColorStop(0, '#0b1014'); ig.addColorStop(0.6, '#0d1618'); ig.addColorStop(1, '#0f1d1e');
  ctx.fillStyle = ig; ctx.fill();

  ctx.save(); hollow(); ctx.clip();
  // faint light from the entrance
  drawGlow(ox + 10, R - 60, 260, 0.12, [120, 140, 180]);
  // teal glow rising off the pool
  drawGlow(ox + (POOL_X0 + POOL_X1) / 2, waterY(), 520, 0.14 * flick, [90, 200, 190]);
  // distant rock layers + stone pillars in the background
  ctx.fillStyle = 'rgba(30,36,38,0.6)';
  ctx.beginPath(); ctx.moveTo(ox + 760, R + 900);
  for (let x = 760; x <= 3100; x += 40) ctx.lineTo(ox + x, R + 420 + Math.sin(x * 0.01) * 60 + Math.sin(x * 0.033) * 25);
  ctx.lineTo(ox + 3100, R + 900); ctx.closePath(); ctx.fill();
  CAVE_PILLARS.forEach(([px, w, dk]) => {
    const t = caveCeilY(px), b = caveFloorY(px);
    const pg = ctx.createLinearGradient(ox + px - w / 2, 0, ox + px + w / 2, 0);
    pg.addColorStop(0, `rgba(26,24,22,${0.9})`); pg.addColorStop(1, `rgba(40,36,32,${0.9})`);
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.moveTo(ox + px - w * 0.7, b); ctx.lineTo(ox + px - w * 0.35, (t + b) / 2); ctx.lineTo(ox + px - w * 0.6, t);
    ctx.lineTo(ox + px + w * 0.6, t); ctx.lineTo(ox + px + w * 0.35, (t + b) / 2); ctx.lineTo(ox + px + w * 0.7, b); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(80,90,60,0.25)'; ctx.lineWidth = 1;
    for (let y = t + 30; y < b - 10; y += 36) { ctx.beginPath(); ctx.moveTo(ox + px - w * 0.4, y); ctx.lineTo(ox + px + w * 0.4, y + 4); ctx.stroke(); }
  });
  // glow-worms dotting the ceiling (and twinkling)
  GLOWWORMS.forEach(g => {
    const x = ox + g.x; if (x < -10 || x > W + 10) return;
    const y = caveCeilY(g.x) + g.d, a = 0.35 + 0.35 * Math.sin(tick * 0.03 + g.ph);
    ctx.fillStyle = `rgba(140,230,255,${a})`; ctx.fillRect(x, y, 1.6, 1.6);
    ctx.strokeStyle = `rgba(140,230,255,${a * 0.25})`; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x + 0.8, y); ctx.lineTo(x + 0.8, y - g.d * 0.6); ctx.stroke();
  });
  ctx.restore();

  // rock edges
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(90,80,64,0.55)'; ctx.lineWidth = 2;
  ctx.beginPath(); ceil.forEach(([x, y], i) => i ? ctx.lineTo(ox + x, y) : ctx.moveTo(ox + x, y)); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,95,60,0.6)';
  ctx.beginPath(); floor.forEach(([x, y], i) => i ? ctx.lineTo(ox + x, y) : ctx.moveTo(ox + x, y)); ctx.stroke();
  // stalactites
  ctx.fillStyle = '#1d1915';
  for (let x = 800; x < 3060; x += 70 + (x % 50)) {
    const c = caveCeilY(x), l = 14 + (x * 7 % 30);
    ctx.beginPath(); ctx.moveTo(ox + x - 6, c - 2); ctx.lineTo(ox + x + 1, c + l); ctx.lineTo(ox + x + 7, c - 2); ctx.fill();
  }

  // hanging roots (thickest in the tunnel, right under the hill)
  ctx.strokeStyle = 'rgba(110,85,60,0.75)'; ctx.lineWidth = 1;
  for (let x = 20; x < 1300; x += x < 760 ? 23 : 47) {
    const c = caveCeilY(x), len = (x < 760 ? 18 : 30) + hash(x) * 30, sw = Math.sin(tick * 0.02 + x) * 3;
    ctx.beginPath(); ctx.moveTo(ox + x, c); ctx.quadraticCurveTo(ox + x + sw * 0.3, c + len * 0.6, ox + x + sw, c + len); ctx.stroke();
  }
  // glowing upside-down mushrooms on the ceiling
  CAVE_MUSHROOMS.forEach((x, i) => {
    const c = caveCeilY(x), p = 0.5 + 0.5 * Math.sin(tick * 0.05 + i);
    drawGlow(ox + x, c + 8, 34, 0.2 + 0.1 * p, [120, 200, 255]);
    ctx.fillStyle = 'rgba(200,215,230,0.6)'; ctx.fillRect(ox + x - 1, c, 2, 7);
    ctx.fillStyle = `rgba(140,210,255,${0.7 + 0.2 * p})`;
    ctx.beginPath(); ctx.ellipse(ox + x, c + 7, 7, 5, 0, 0, Math.PI); ctx.fill();
  });
  // the old mole's lanterns
  [[420, 32], [1110, 60]].forEach(([x, drop], i) => {
    const c = caveCeilY(x), sw = Math.sin(tick * 0.03 + i) * 0.15;
    ctx.save(); ctx.translate(ox + x, c); ctx.rotate(sw);
    ctx.strokeStyle = 'rgba(120,95,65,0.8)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, drop); ctx.stroke();
    ctx.fillStyle = '#4a3522'; ctx.fillRect(-4, drop, 8, 3);
    ctx.fillStyle = `rgba(255,200,120,${0.95 * flick})`; ctx.beginPath(); ctx.arc(0, drop + 7, 4.5, 0, 7); ctx.fill();
    drawGlow(0, drop + 7, 90, 0.22 * flick);
    ctx.restore();
  });
  // crystals by the pool
  CRYSTALS.forEach(([x, k], i) => {
    const b = caveFloorY(x), p = 0.6 + 0.4 * Math.sin(tick * 0.04 + i * 2);
    drawGlow(ox + x, b - 14 * k, 50 * k, 0.18 * p, [150, 120, 230]);
    [[-6, 22, -0.3], [0, 30, 0], [7, 18, 0.35]].forEach(([dx, h, rot]) => {
      ctx.save(); ctx.translate(ox + x + dx * k, b); ctx.rotate(rot);
      ctx.fillStyle = `rgba(170,140,240,${0.55 + 0.25 * p})`;
      ctx.beginPath(); ctx.moveTo(-3.5 * k, 0); ctx.lineTo(-3.5 * k, -h * k * 0.75); ctx.lineTo(0, -h * k); ctx.lineTo(3.5 * k, -h * k * 0.75); ctx.lineTo(3.5 * k, 0); ctx.fill();
      ctx.restore();
    });
  });
  // ledges
  CAVE_LEDGES.forEach(l => {
    const y = R + l.y;
    if (l.scaffold) {   // the miners' old plank scaffold
      ctx.fillStyle = '#3a2a1c';
      [l.x1 + 8, l.x2 - 12].forEach(px => ctx.fillRect(ox + px, y, 5, caveFloorY(px) - y));
      ctx.strokeStyle = 'rgba(90,65,40,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ox + l.x1 + 10, y + 8); ctx.lineTo(ox + l.x2 - 10, caveFloorY(l.x2) - 10); ctx.stroke();
      ctx.fillStyle = '#5a4026'; ctx.fillRect(ox + l.x1, y - 2, l.x2 - l.x1, 6);
      ctx.strokeStyle = 'rgba(30,20,12,0.7)'; ctx.lineWidth = 1;
      for (let px = l.x1 + 18; px < l.x2; px += 18) { ctx.beginPath(); ctx.moveTo(ox + px, y - 2); ctx.lineTo(ox + px, y + 4); ctx.stroke(); }
      return;
    }
    ctx.fillStyle = '#231e19';
    ctx.beginPath(); ctx.moveTo(ox + l.x1 - 6, y); ctx.lineTo(ox + l.x2 + 6, y); ctx.lineTo(ox + l.x2 - 10, y + 18); ctx.quadraticCurveTo(ox + (l.x1 + l.x2) / 2, y + 30, ox + l.x1 + 8, y + 16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(90,140,90,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox + l.x1 - 4, y); ctx.lineTo(ox + l.x2 + 4, y); ctx.stroke();
  });
  // the glowstone, waiting on the far ledge
  if (!hasItem('glowstone')) {
    const y = R + GLOWSTONE_Y - 8 + Math.sin(tick * 0.05) * 1.5, p = 0.7 + 0.3 * Math.sin(tick * 0.06);
    drawGlow(ox + GLOWSTONE_X, y, 40, 0.35 * p, [120, 230, 220]);
    ctx.fillStyle = `rgba(160,245,235,${0.9 * p})`;
    ctx.beginPath(); ctx.moveTo(ox + GLOWSTONE_X, y - 7); ctx.lineTo(ox + GLOWSTONE_X + 5, y); ctx.lineTo(ox + GLOWSTONE_X, y + 5); ctx.lineTo(ox + GLOWSTONE_X - 5, y); ctx.closePath(); ctx.fill();
  }
  // the entrance: night light spilling in + a sign
  const eg = ctx.createLinearGradient(ox, 0, ox + 140, 0);
  eg.addColorStop(0, 'rgba(70,90,130,0.35)'); eg.addColorStop(1, 'rgba(70,90,130,0)');
  ctx.fillStyle = eg; ctx.fillRect(ox, caveCeilY(0), 140, R - caveCeilY(0));
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(ox + 150, R - 36, 3, 36); ctx.fillRect(ox + 122, R - 48, 60, 14);
  ctx.fillStyle = 'rgba(230,205,160,0.85)'; ctx.font = '8px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText('mind the roots', ox + 152, R - 38);
  // drips + spores
  cave.drips.forEach(d => { ctx.fillStyle = 'rgba(170,220,235,0.7)'; ctx.fillRect(ox + d.x - 0.7, d.y, 1.4, 3); });
  cave.spores.forEach(p => {
    const a = Math.min(1, p.life, 2 - p.life) * 0.6;
    ctx.fillStyle = `rgba(150,240,220,${a})`; ctx.fillRect(ox + p.x, p.y, 1.5, 1.5);
  });
}
