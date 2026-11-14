/* ══════════════════════════════════════════
   THE SEA — wade in and swim (same controls as the lake: hold ↓ to dive,
   hold jump to swim up, the same breath meter; the fishbowl helmet works too).
   · the bay (mainland side): sandy shallows, then a coral shelf with a little
     community on it, and ollie the octopus, who gardens it.
   · the reef city (island side): a big tiered reef stepping down from the
     surf to a sheer drop. the reef crest is what breaks the swell into the
     island's surf. towers of coral lit by glowing polyps, an arch, eels,
     seahorses, jellyfish, turtles, a ray, crabs, and lots of fish — the
     deeper tiers need umber's helmet.
   · both reefs end at a drop into the open sea. a net is strung across each
     drop, and each net's one gap is guarded by a pufferfish: bart on the
     mainland side, his sister bea on the island side. nobody swims through.
══════════════════════════════════════════ */
const SEA_NET_X = 11510, ISLE_NET_X = 13710, REEF_X = 14470;
const CORAL_X0 = 10640, CORAL_X1 = 11480, CITY_X0 = 13740, CITY_X1 = 14560;
const sea = { ripples: [], splashes: [], bubbles: [], fish: [], warnT: 0, puff: { bart: 0, bea: 0 }, swimmers: [] };

const ollie = makeRegular({ name: 'ollie', kind: 'octopus', color: '#d890a8', x: 10980 });
const bart  = makeRegular({ name: 'bart',  kind: 'puffer',  color: '#d8c070', x: SEA_NET_X - 26 });
const bea   = makeRegular({ name: 'bea',   kind: 'puffer',  color: '#9ad0c0', x: ISLE_NET_X + 26 });
const GUARDS = [{ n: bart, netX: SEA_NET_X, side: -1 }, { n: bea, netX: ISLE_NET_X, side: 1 }];
const guardY = g => seaY() + 150 + Math.sin(tick * 0.03 + (g.side > 0 ? 2 : 0)) * 6;
OUT_TALKERS.push({ n: ollie, at: () => [ollie.x, groundY(ollie.x) - 60] });
GUARDS.forEach(g => OUT_TALKERS.push({ n: g.n, at: () => [g.n.x, guardY(g) - 40] }));

/* ── coral, built once ── */
const CORAL_COLS = [[230, 120, 140], [240, 170, 110], [170, 130, 220], [120, 200, 190], [240, 210, 120], [250, 140, 100], [140, 170, 240]];
function makeCorals(x0, x1, n, seed, big) {
  return Array.from({ length: n }, (_, i) => {
    const x = x0 + 10 + (i + hash(i * 3.7 + seed) * 0.8) * (x1 - x0 - 20) / n;
    return { x, kind: ['branch', 'brain', 'fan', 'tube', 'branch', 'anemone', 'fan'][Math.floor(hash(i * 1.3 + seed) * 7)],
             s: (0.7 + hash(i * 5.1 + seed) * 0.8) * (big ? 1.35 : 1), col: CORAL_COLS[(i + seed) % CORAL_COLS.length], ph: hash(i + seed) * 6 };
  });
}
const CORALS = makeCorals(CORAL_X0, CORAL_X1, 46, 0).filter(c => Math.abs(c.x - ollie.x) > 30);
const CITY_CORALS = makeCorals(CITY_X0, CITY_X1, 90, 17, true);
const STARS_SEA = [10760, 10890, 11170, 11330, 13820, 14050, 14260, 14420].map((x, i) => ({ x, r: 0.4 + i * 0.37, col: ['#e88a70', '#e8b070', '#d870a0', '#e88a70'][i % 4] }));
// the city skyline: coral towers on the tiers, windows lit by glowing polyps
const TOWERS = [
  { x: 13790, h: 230, w: 34 }, { x: 13850, h: 160, w: 26 }, { x: 13880, h: 290, w: 40 },
  { x: 14000, h: 190, w: 30 }, { x: 14070, h: 140, w: 24 }, { x: 14110, h: 210, w: 32 },
  { x: 14230, h: 120, w: 26 }, { x: 14300, h: 150, w: 28 },
].map((t, i) => Object.assign(t, { col: CORAL_COLS[(i * 3) % CORAL_COLS.length], eel: i % 3 === 1 }));
const ARCH = { x0: 14200, x1: 14290 };

/* ── things that live down there ── */
function addFish(lo, hi, n, seed, homeFn, colFn, schools) {
  for (let i = 0; i < n; i++) {
    const school = i < schools * 8 ? Math.floor(i / 8) : -1;
    const home = homeFn(i, school);
    sea.fish.push({
      lo, hi, school: school >= 0 ? school + seed : -1, x: lo + hash(i * 9.1 + seed) * (hi - lo), d: home, home,
      vx: (hash(i * 6.6 + seed) < 0.5 ? -1 : 1) * (0.4 + hash(i * 3.9 + seed) * 0.4), ph: hash(i + seed) * 6, dart: 0,
      k: school >= 0 ? 0.45 : 0.6 + hash(i * 1.1 + seed) * 0.5, deep: home > 450, tall: school < 0 && hash(i * 2.7 + seed) < 0.3,
      col: colFn(i, school),
    });
  }
}
const FISH_COLS = [[230, 170, 90], [160, 200, 220], [220, 130, 120], [200, 210, 150], [190, 150, 230], [250, 220, 120], [120, 220, 200]];
addFish(10500, SEA_NET_X - 30, 36, 0, (i, s) => s >= 0 ? 70 + s * 45 : 40 + hash(i * 2.2) * 170, (i, s) => s >= 0 ? FISH_COLS[s] : FISH_COLS[i % 5], 3);
addFish(CITY_X0, CITY_X1, 64, 10, (i, s) => s >= 0 ? 90 + s * 110 : 60 + hash(i * 2.2) * 520, (i, s) => s >= 0 ? FISH_COLS[(s + 3) % 7] : FISH_COLS[i % 7], 4);
// drifting and gliding things in the reef city
const CITY_LIFE = [
  ...[13800, 13930, 14060, 14160, 13870, 14010].map((x, i) => ({ kind: 'jelly', x, y: 200 + i * 70, ph: i * 1.3, col: [[200, 160, 240], [160, 220, 240], [240, 170, 200]][i % 3] })),
  { kind: 'turtle', x: 13900, y: 260, vx: 0.35 }, { kind: 'turtle', x: 14300, y: 140, vx: -0.25 },
  { kind: 'ray', x: 14100, y: 380, vx: 0.5 },
  ...[13960, 14150, 14330, 14480].map((x, i) => ({ kind: 'seahorse', x, ph: i * 2, col: [[240, 190, 90], [240, 140, 150], [150, 210, 190], [220, 180, 240]][i] })),
  ...[13830, 14090, 14400, 14520].map((x, i) => ({ kind: 'crab', x, ph: i * 1.7 })),
  ...[13760, 14030, 14250, 14450].map((x, i) => ({ kind: 'urchin', x, s: 0.8 + i * 0.15 })),
];

/* ── who's nearby ── */
const underSea = () => scene === 'outside' && player.inWater;
function nearOllie() { return underSea() && Math.abs(player.wx - ollie.x) < 60 && player._py > seaY() + 100; }
function nearGuard() { return underSea() && player._py > seaY() + 40 ? GUARDS.find(g => g.side < 0 ? player.wx > g.netX - 90 && player.wx < g.netX : player.wx < g.netX + 90 && player.wx > g.netX) : null; }

const OLLIE_LINES = [
  "welcome to the reef! wipe your feet. well — you can't really wipe anything down here. welcome anyway!",
  "i garden. that's brain coral, that's fan coral, and that's gerald. gerald is a rock. he's doing his best.",
  "everyone on the reef knows everyone. it's a small reef. everybody knows your business. i love it.",
  "don't mind bart at the net. he's grumpy because he cares. mostly he's grumpy.",
  'i have three hearts. two of them like you already. the third takes a while.',
  "there's a reef across the sea, they say, ten times this one. a whole city. i'm not jealous. i'm a little jealous.",
];
const GUARD_LINES = {
  bart: [
    'halt. HALT. who goes there. …a mouse. halt anyway.',
    "past this net is open water. big currents, bigger fish. nobody goes through. nobody's ALLOWED through. i'm the nobody-allowed-through fish.",
    "i'm not puffed up. this is my regular size. it's the water. it's very cold.",
    "rules are rules. you want to cross the sea, you get a boat. a good one. and a better reason than 'i wanted to see'.",
  ],
  bea: [
    "halt! oh — you're the one who came on the boat. still: halt. it's tradition.",
    "past the net it's straight down. nobody knows how far. i dropped a pebble once. i'm still listening.",
    "the surf up top? that's us. the reef breaks the swell into nice tidy waves. rae thinks they're a gift from the sea. they're a gift from US.",
    "my brother guards the net on the other side. we haven't spoken in years. we wave, though. well. we puff.",
  ],
};
function talkToGuard(g) {
  const n = g.n, L = GUARD_LINES[n.name];
  let line;
  if (n === bart && boat.crossed && n.li >= L.length) line = ["you sailed it? through the storm? …huh. don't tell anyone i said this, but that's brave.", met.bea ? "you met bea? …is she well? does she still puff up when she's nervous? good. good." : 'still not letting you through. but brave.'][n.li++ % 2];
  else if (n === bea && met.bart && n.li >= L.length) line = ["you've met bart? …tell him the net on this side is very well kept. he'll know what i mean.", "he still says 'halt' twice? ha. he always did."][n.li++ % 2];
  else line = L[n.li++ % L.length];
  if (/puffed|nervous/.test(line)) sea.puff[n.name] = 160;
  say(n, line, true);
}
OUT_SPOTS.push(() => {
  if (!underSea()) return null;
  const g = nearGuard();
  if (g && g.n.bubbleT < 200) return { text: `press E to talk to ${g.n.name}`, act: () => talkToGuard(g) };
  if (nearOllie() && ollie.bubbleT < 200) return { text: 'press E to talk to ollie', act: () => say(ollie, OLLIE_LINES[ollie.li++ % OLLIE_LINES.length], true) };
  if (player.wx > CITY_X0 && player.wx < CITY_X1 && player._py > seaY() + 60) return { text: 'the reef city' };
  return null;
});

/* ══════════════════════════════════════════
   UPDATE
══════════════════════════════════════════ */
const GUARD_SHOUTS = ['NOPE. no. absolutely not. back you go.', "hey! HEY! net's there for a reason!", "open water. dangerous. that's the whole speech."];
// keep swimmers out of the open sea: a net + a pufferfish on each side
function seaClamp() {
  if (scene !== 'outside' || player.riding || !player.inWater) return;
  GUARDS.forEach(g => {
    const past = g.side < 0 ? player.wx > g.netX - 12 && player.wx < 12600 : player.wx < g.netX + 12 && player.wx > 12600;
    if (!past) return;
    player.wx = g.side < 0 ? g.netX - 12 : g.netX + 12;
    _vx = g.side < 0 ? Math.min(0, _vx) - 0.5 : Math.max(0, _vx) + 0.5;
    if (sea.warnT <= 0) { sea.warnT = 300; sea.puff[g.n.name] = 120; achieve('puffed'); say(g.n, GUARD_SHOUTS[Math.floor(Math.random() * 3)]); }
  });
}
function updateSea() {
  if (sea.warnT > 0) sea.warnT--;
  for (const k in sea.puff) if (sea.puff[k] > 0) sea.puff[k]--;
  if (lake.deepHintT > 0 && scene === 'outside') lake.deepHintT--;
  const g = nearGuard();
  if (g && sea.puff[g.n.name] < 40 && Math.abs(_vx) > 1.5 && Math.abs(player.wx - g.netX) < 60) { sea.puff[g.n.name] = 120; achieve('puffed'); }
  ollie.x = 10980 + Math.sin(tick * 0.008) * 24;
  GUARDS.forEach(q => q.n.x = q.netX + q.side * 26 + Math.sin(tick * 0.02 + q.side) * 6);
  const wy = seaY(), s = playerScale();
  if (lake.under && scene === 'outside' && tick % 24 === 0) puffBubbles(1);
  const nearCity = camX + W > CITY_X0 - 200 && camX < CITY_X1 + 200, nearBay = camX + W > CORAL_X0 && camX < CORAL_X1 + 200;
  if (Math.random() < 0.04 && nearBay) { const x = rand(CORAL_X0, CORAL_X1); sea.bubbles.push({ x, y: groundY(x) - 6, r: rand(1, 2.5), ph: rand(0, 6) }); }
  if (Math.random() < 0.08 && nearCity) { const t = TOWERS[Math.floor(Math.random() * TOWERS.length)]; sea.bubbles.push({ x: t.x + rand(-6, 6), y: groundY(t.x) - t.h, r: rand(1, 2.5), ph: rand(0, 6) }); }
  for (let i = sea.bubbles.length - 1; i >= 0; i--) {
    const b = sea.bubbles[i]; b.y -= 0.6 + b.r * 0.25; b.ph += 0.1; b.x += Math.sin(b.ph) * 0.3;
    if (b.y <= wy) { sea.bubbles.splice(i, 1); if (Math.random() < 0.3) sea.ripples.push({ x: b.x, r: 1, life: 0.6 }); }
  }
  for (let i = sea.ripples.length - 1; i >= 0; i--) { const r = sea.ripples[i]; r.r += 0.4; r.life -= 0.02; if (r.life <= 0) sea.ripples.splice(i, 1); }
  for (let i = sea.splashes.length - 1; i >= 0; i--) { const p = sea.splashes[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= 0.04; if (p.life <= 0) sea.splashes.splice(i, 1); }
  // fish: schools swim together, everyone scatters if you swim close
  const pcx = player.wx, pcy = player._py - 30 * s, lead = {};
  sea.fish.forEach(f => {
    if (f.x < camX - 900 || f.x > camX + W + 900) return;   // only the fish nearby
    f.ph += 0.03; f.dart *= 0.95;
    if (f.school >= 0 && lead[f.school]) { const L = lead[f.school]; f.vx += (L.vx - f.vx) * 0.05; f.x += (L.x + ((f.ph * 10) % 30) - 15 - f.x) * 0.01; }
    else if (f.school >= 0) lead[f.school] = f;
    f.x += f.vx * (1 + f.dart * 2);
    const floorD = groundY(f.x) - wy - 12;
    const want = Math.max(16, Math.min(floorD, f.home + Math.sin(f.ph) * 14));
    f.d += (want - f.d) * 0.05;
    if (f.x < f.lo || f.x > f.hi || floorD < 20) { f.vx = -f.vx; f.x += f.vx * 3; }
    if (player.inWater) { const dx = f.x - pcx, dy = wy + f.d - pcy; if (dx * dx + dy * dy < 70 * 70) { f.vx = Math.sign(dx || 1) * Math.abs(f.vx); f.dart = 1; } }
  });
  if (nearCity) CITY_LIFE.forEach(c => {
    if (c.vx) { c.x += c.vx; if (c.x < CITY_X0 + 20 || c.x > CITY_X1 - 20) c.vx = -c.vx; }
    if (c.kind === 'jelly') { c.ph += 0.03; c.y += Math.sin(c.ph) * 0.35 - 0.05; if (c.y < 60) c.y = 520; }
  });
}

/* ══════════════════════════════════════════
   DRAW
══════════════════════════════════════════ */
function seaShape(top) {
  const x0 = Math.max(SEA_X0, camX - 20), x1 = Math.min(SEA_X1, camX + W + 20), ox = -camX;
  if (x1 <= x0) return false;
  ctx.beginPath(); ctx.moveTo(ox + x0, top(x0));
  for (let x = x0; x <= x1; x += 8) ctx.lineTo(ox + x, top(x));
  ctx.lineTo(ox + x1, top(x1));
  for (let x = x1; x >= x0; x -= 8) ctx.lineTo(ox + x, Math.max(top(x), groundY(x)));
  ctx.lineTo(ox + x0, Math.max(top(x0), groundY(x0)));
  ctx.closePath();
  return true;
}
function drawSeaBack() {
  const wy = seaY(), ox = -camX;
  if (!seaShape(waveY)) return;
  const g = ctx.createLinearGradient(0, wy, 0, wy + 1200);
  g.addColorStop(0, 'rgba(26,70,100,0.88)'); g.addColorStop(0.2, 'rgba(14,44,72,0.93)'); g.addColorStop(1, 'rgba(3,8,20,0.98)');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); seaShape(waveY); ctx.clip();
  // moonlight falling through the water
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(camX / 300) * 300 + i * 300 - 600 + Math.sin(tick * 0.004 + i) * 30;
    const lg = ctx.createLinearGradient(0, wy, 0, wy + 360);
    lg.addColorStop(0, 'rgba(160,210,230,0.07)'); lg.addColorStop(1, 'rgba(160,210,230,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(ox + x, wy); ctx.lineTo(ox + x + 50, wy); ctx.lineTo(ox + x + 140, wy + 360); ctx.lineTo(ox + x + 40, wy + 360); ctx.closePath(); ctx.fill();
  }
  // the deep past each net: darkness
  [[SEA_NET_X, 1], [ISLE_NET_X, -1]].forEach(([nx, d]) => {
    if (nx - camX < -500 || nx - camX > W + 500) return;
    const dg = ctx.createLinearGradient(ox + nx, 0, ox + nx + 400 * d, 0);
    dg.addColorStop(0, 'rgba(2,6,14,0)'); dg.addColorStop(1, 'rgba(2,6,14,0.55)');
    ctx.fillStyle = dg; ctx.fillRect(d > 0 ? ox + nx : -10, wy, d > 0 ? W - ox - nx + 40 : ox + nx + 10, 1600);
  });
  if (camX + W > CORAL_X0 - 50 && camX < SEA_NET_X + 200) {
    drawCorals(CORALS);
    drawCritter(ox + ollie.x, groundY(ollie.x) + 1, 'octopus', { color: ollie.color, scale: 1.4, dir: faceToward(ollie.x, 1) });
    drawReefSign(10700, 'the reef');
  }
  if (camX + W > CITY_X0 - 100 && camX < CITY_X1 + 100) drawReefCity();
  GUARDS.forEach(q => {
    if (q.netX - camX < -100 || q.netX - camX > W + 100) return;
    drawSeaNet(q.netX, q.side);
    drawCritter(ox + q.n.x, guardY(q), 'puffer', { color: q.n.color, scale: 1.2, dir: faceToward(q.n.x, q.side), puffed: Math.min(1, sea.puff[q.n.name] / 30) });
  });
  sea.fish.forEach(f => { const x = ox + f.x, y = wy + f.d; if (x > -30 && x < W + 30) f.tall ? drawAngelfish(x, y, f) : drawFish(x, y, f); });
  ctx.strokeStyle = 'rgba(200,240,250,0.55)'; ctx.lineWidth = 0.8;
  sea.bubbles.forEach(b => { ctx.beginPath(); ctx.arc(ox + b.x, b.y, b.r, 0, 7); ctx.stroke(); });
  ctx.restore();
}
function drawReefSign(x, text) {
  const sx = x - camX, sb = groundY(x);
  ctx.fillStyle = '#4a4a40'; ctx.fillRect(sx - 1.5, sb - 40, 3, 40); ctx.fillRect(sx - 30, sb - 52, 60, 16);
  ctx.fillStyle = 'rgba(220,230,210,0.8)'; ctx.font = '8px Space Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText(text, sx, sb - 41);
}

function drawCorals(list) {
  const ox = -camX;
  ctx.save(); ctx.lineCap = 'round';
  list.forEach(c => {
    const x = ox + c.x; if (x < -70 || x > W + 70) return;
    const b = groundY(c.x) + 2, [r, g, bl] = c.col, s = c.s, sw = Math.sin(tick * 0.02 + c.ph) * 3;
    ctx.strokeStyle = `rgba(${r},${g},${bl},0.75)`; ctx.fillStyle = `rgba(${r},${g},${bl},0.45)`; ctx.lineWidth = 3 * s;
    if (c.kind === 'branch') {
      const br = (x0, y0, a, l, d) => { if (d > 3) return; const x1 = x0 + Math.sin(a) * l, y1 = y0 - Math.cos(a) * l; ctx.lineWidth = (3.5 - d) * s; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); br(x1, y1, a - 0.5, l * 0.7, d + 1); br(x1, y1, a + 0.45, l * 0.7, d + 1); };
      br(x, b, sw * 0.03, 16 * s, 0);
    } else if (c.kind === 'brain') {
      ctx.beginPath(); ctx.ellipse(x, b - 2, 15 * s, 11 * s, 0, Math.PI, 0); ctx.fill();
      ctx.lineWidth = 1; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(x + i * 5 * s, b - 4 * s, 4 * s, Math.PI, 0); ctx.stroke(); }
    } else if (c.kind === 'fan') {
      ctx.lineWidth = 1;
      for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x, b); ctx.quadraticCurveTo(x + i * 4 * s, b - 20 * s, x + i * 6 * s + sw, b - 34 * s); ctx.stroke(); }
      ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.moveTo(x, b); ctx.arc(x + sw * 0.5, b, 34 * s, -Math.PI * 0.8, -Math.PI * 0.2); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    } else if (c.kind === 'tube') {
      [[-6, 22], [0, 30], [6, 18]].forEach(([dx, h]) => { ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(x + dx * s, b); ctx.lineTo(x + dx * s + sw * 0.3, b - h * s); ctx.stroke(); ctx.fillStyle = 'rgba(20,10,20,0.6)'; ctx.beginPath(); ctx.arc(x + dx * s + sw * 0.3, b - h * s, 1.8 * s, 0, 7); ctx.fill(); });
    } else {   // anemone, with a little clownfish
      ctx.lineWidth = 1.5 * s;
      for (let i = -5; i <= 5; i++) { const a = i * 0.18 + Math.sin(tick * 0.05 + i + c.ph) * 0.15; ctx.beginPath(); ctx.moveTo(x + i * s, b - 4); ctx.lineTo(x + i * s + Math.sin(a) * 14 * s, b - 4 - Math.cos(a) * 14 * s); ctx.stroke(); }
      const cx = x + Math.sin(tick * 0.04 + c.ph) * 10, cy = b - 16 * s + Math.cos(tick * 0.05 + c.ph) * 3;
      ctx.fillStyle = 'rgba(240,140,60,0.9)'; ctx.beginPath(); ctx.ellipse(cx, cy, 4, 2.4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(250,250,250,0.9)'; ctx.fillRect(cx - 0.6, cy - 2.4, 1.2, 4.8);
    }
  });
  STARS_SEA.forEach(st => {
    const x = ox + st.x, y = groundY(st.x) - 2; if (x < -20 || x > W + 20) return;
    ctx.fillStyle = st.col; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.5 : 7, a = st.r + i * Math.PI / 5; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6); }
    ctx.closePath(); ctx.fill();
  });
  ctx.restore();
}

// the reef city: towers, an arch, glowing windows, and everyone who lives there
function drawReefCity() {
  const ox = -camX, wy = seaY();
  ctx.save(); ctx.lineCap = 'round';
  // a soft glow over the whole city
  drawGlow(ox + 14000, wy + 400, 420, 0.08, [120, 200, 220]);
  // towers
  TOWERS.forEach((t, i) => {
    const x = ox + t.x; if (x < -80 || x > W + 80) return;
    const b = groundY(t.x) + 4, [r, g, bl] = t.col, sw = Math.sin(tick * 0.01 + i) * 2;
    ctx.fillStyle = `rgba(${r * 0.55 | 0},${g * 0.55 | 0},${bl * 0.6 | 0},0.92)`;
    ctx.beginPath(); ctx.moveTo(x - t.w / 2, b); ctx.quadraticCurveTo(x - t.w * 0.42, b - t.h * 0.6, x - t.w * 0.3 + sw, b - t.h);
    ctx.quadraticCurveTo(x + sw, b - t.h - t.w * 0.5, x + t.w * 0.3 + sw, b - t.h); ctx.quadraticCurveTo(x + t.w * 0.42, b - t.h * 0.6, x + t.w / 2, b); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(${r},${g},${bl},0.5)`; ctx.lineWidth = 1.2; ctx.stroke();
    // little side spires
    ctx.strokeStyle = `rgba(${r},${g},${bl},0.7)`; ctx.lineWidth = 4;
    [[-1, 0.45], [1, 0.62], [-1, 0.78]].forEach(([d, f]) => { const y = b - t.h * f; ctx.beginPath(); ctx.moveTo(x + d * t.w * 0.35, y); ctx.quadraticCurveTo(x + d * t.w * 0.75, y - 4, x + d * t.w * 0.8 + sw, y - 22); ctx.stroke(); });
    // glowing windows: polyps peeking out
    for (let k = 0; k < Math.floor(t.h / 34); k++) {
      const wx = x + (k % 2 ? 6 : -6) + sw * (k / 8), wyy = b - 22 - k * 30, on = 0.5 + 0.5 * Math.sin(tick * 0.03 + k * 1.7 + i);
      ctx.fillStyle = 'rgba(8,10,20,0.85)'; ctx.beginPath(); ctx.ellipse(wx, wyy, 4.5, 6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(190,250,230,${0.35 + 0.55 * on})`; ctx.beginPath(); ctx.arc(wx, wyy + 1, 2, 0, 7); ctx.fill();
      drawGlow(wx, wyy, 14, 0.25 * on, [160, 250, 220]);
    }
    // an eel living in a hole near the top
    if (t.eel) {
      const ey = b - t.h * 0.7, out = 10 + Math.max(0, Math.sin(tick * 0.02 + i)) * 18;
      ctx.fillStyle = 'rgba(8,10,20,0.9)'; ctx.beginPath(); ctx.ellipse(x + t.w * 0.3, ey, 6, 7, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(150,180,90,0.9)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x + t.w * 0.3, ey); ctx.quadraticCurveTo(x + t.w * 0.3 + out * 0.6, ey - 6 + Math.sin(tick * 0.08) * 3, x + t.w * 0.3 + out, ey - 2); ctx.stroke();
      ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(x + t.w * 0.3 + out - 2, ey - 4, 1.2, 0, 7); ctx.fill();
    }
  });
  // the arch
  const ax0 = ox + ARCH.x0, ax1 = ox + ARCH.x1;
  if (ax1 > -60 && ax0 < W + 60) {
    const b0 = groundY(ARCH.x0) + 4, b1 = groundY(ARCH.x1) + 4, top = Math.min(b0, b1) - 110;
    ctx.strokeStyle = 'rgba(150,100,140,0.9)'; ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(ax0, b0); ctx.bezierCurveTo(ax0 - 6, top, ax1 + 6, top, ax1, b1); ctx.stroke();
    ctx.strokeStyle = 'rgba(220,160,200,0.4)'; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 1; i < 8; i++) { const t = i / 8, x = ax0 + (ax1 - ax0) * t, y = top + 24 + Math.pow(2 * t - 1, 2) * 70; drawGlow(x, y, 10, 0.3, [240, 200, 255]); }
  }
  drawCorals(CITY_CORALS);
  // seahorses on the coral, crabs + urchins on the tiers
  CITY_LIFE.forEach(c => {
    const x = ox + c.x; if (x < -60 || x > W + 60) return;
    const b = groundY(c.x);
    if (c.kind === 'seahorse') drawSeahorse(x + 14, b - 46 + Math.sin(tick * 0.04 + c.ph) * 4, c.col);
    else if (c.kind === 'crab') drawCritter(x + Math.sin(tick * 0.01 + c.ph) * 20, b + 1, 'crab', { color: '#e07a5a', scale: 0.55 });
    else if (c.kind === 'urchin') {
      ctx.strokeStyle = 'rgba(60,40,80,0.95)'; ctx.lineWidth = 1;
      for (let i = 0; i < 16; i++) { const a = Math.PI + i * Math.PI / 15; ctx.beginPath(); ctx.moveTo(x, b - 4); ctx.lineTo(x + Math.cos(a) * 12 * c.s, b - 4 + Math.sin(a) * 12 * c.s); ctx.stroke(); }
      ctx.fillStyle = 'rgba(70,40,90,0.95)'; ctx.beginPath(); ctx.arc(x, b - 4, 5 * c.s, Math.PI, 0); ctx.fill();
    }
  });
  // the swimmers: turtles, a ray, jellyfish
  CITY_LIFE.forEach(c => {
    const x = ox + c.x; if (x < -80 || x > W + 80) return;
    const y = wy + c.y;
    if (c.kind === 'turtle') drawTurtle(x, y + Math.sin(tick * 0.02 + c.x) * 6, Math.sign(c.vx));
    else if (c.kind === 'ray') drawRay(x, y + Math.sin(tick * 0.015) * 14, Math.sign(c.vx));
    else if (c.kind === 'jelly') drawJelly(x + Math.sin(c.ph * 0.7) * 10, y, c.col, c.ph);
  });
  drawReefSign(CITY_X1 - 40, 'the reef city');
  // the reef crest, where the surf begins
  for (let i = 0; i < 10; i++) {
    const x = REEF_X - 70 + i * 16, b = groundY(x);
    ctx.fillStyle = `rgba(${[150, 130, 170][i % 3]},${[120, 110, 120][i % 3]},${[110, 120, 140][i % 3]},0.85)`;
    ctx.beginPath(); ctx.ellipse(ox + x, b - 4, 12, 14 + (i % 3) * 7, 0, Math.PI, 0); ctx.fill();
  }
  ctx.restore();
}

function drawSeahorse(x, y, col) {
  const [r, g, b] = col;
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = `rgba(${r},${g},${b},0.95)`; ctx.fillStyle = `rgba(${r},${g},${b},0.5)`; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(6, -4, 3, 4); ctx.quadraticCurveTo(0, 12, 4, 16); ctx.arc(6, 16, 2.5, Math.PI, Math.PI * 2.6); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(1, -2, 4, 7, 0.2, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(1, -12, 3.5, 3, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, -12); ctx.lineTo(9, -11); ctx.stroke();
  ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(2, -13, 0.9, 0, 7); ctx.fill();
  ctx.restore();
}
function drawJelly(x, y, col, ph) {
  const [r, g, b] = col, p = Math.sin(ph * 3) * 0.15;
  drawGlow(x, y, 26, 0.2, col);
  ctx.fillStyle = `rgba(${r},${g},${b},0.35)`; ctx.strokeStyle = `rgba(${r},${g},${b},0.85)`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(x, y, 10 * (1 + p), 8 * (1 - p), 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(x + i * 2.6, y); ctx.quadraticCurveTo(x + i * 3 + Math.sin(tick * 0.06 + i) * 4, y + 12, x + i * 2 + Math.sin(tick * 0.05 + i) * 5, y + 24); ctx.stroke(); }
}
function drawTurtle(x, y, d) {
  ctx.save(); ctx.translate(x, y); ctx.scale(d || 1, 1);
  const f = Math.sin(tick * 0.06) * 0.5;
  ctx.fillStyle = 'rgba(120,150,100,0.8)';
  [[10, 5, f], [-10, 5, -f], [12, -5, -f], [-12, -5, f]].forEach(([dx, dy, a]) => { ctx.save(); ctx.translate(dx, dy); ctx.rotate(a + (dx > 0 ? 0.6 : -0.6)); ctx.beginPath(); ctx.ellipse(0, 0, 9, 3.5, 0, 0, 7); ctx.fill(); ctx.restore(); });
  ctx.fillStyle = 'rgba(110,130,80,0.95)'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 11, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(180,200,140,0.5)'; ctx.lineWidth = 1; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(i * 8, 0, 4, 6, 0, 0, 7); ctx.stroke(); }
  ctx.fillStyle = 'rgba(140,165,110,0.95)'; ctx.beginPath(); ctx.ellipse(22, -1, 6, 4.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(24, -2, 1, 0, 7); ctx.fill();
  ctx.restore();
}
function drawRay(x, y, d) {
  ctx.save(); ctx.translate(x, y); ctx.scale(d || 1, 1);
  const f = Math.sin(tick * 0.05) * 10;
  ctx.fillStyle = 'rgba(60,70,100,0.85)'; ctx.strokeStyle = 'rgba(150,170,210,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(24, 0); ctx.quadraticCurveTo(4, -6, -6, -30 - f); ctx.quadraticCurveTo(-8, -6, -22, 0); ctx.quadraticCurveTo(-8, 6, -6, 30 + f); ctx.quadraticCurveTo(4, 6, 24, 0); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-50, 2 + Math.sin(tick * 0.07) * 3); ctx.stroke();
  ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(16, -2, 1.2, 0, 7); ctx.fill();
  ctx.restore();
}
function drawAngelfish(x, y, f) {
  const k = f.k * 1.2, dir = Math.sign(f.vx) || 1, [r, g, b] = f.col;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.fillStyle = `rgba(${r},${g},${b},0.6)`; ctx.strokeStyle = `rgba(${r},${g},${b},0.95)`; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(8 * k, 0); ctx.quadraticCurveTo(0, -14 * k, -6 * k, -12 * k); ctx.lineTo(-4 * k, 0); ctx.lineTo(-6 * k, 12 * k); ctx.quadraticCurveTo(0, 14 * k, 8 * k, 0); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(30,30,40,0.5)'; ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.moveTo(1 * k, -8 * k); ctx.lineTo(1 * k, 8 * k); ctx.stroke();
  ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(5 * k, -1.5 * k, 1 * k, 0, 7); ctx.fill();
  ctx.restore();
}

// a net strung down across the drop, with one gap (guarded). side: which way the swimmer comes from (-1 = from the left)
function drawSeaNet(nx, side) {
  const ox = -camX, x = ox + nx, top = seaY(), bot = top + 1300, gap0 = top + 112, gap1 = top + 190;
  ctx.save();
  for (let i = -1; i <= 1; i++) { ctx.fillStyle = i ? 'rgba(220,120,90,0.9)' : 'rgba(240,220,180,0.9)'; ctx.beginPath(); ctx.arc(x + 7 + i * 7, waveY(nx) - 2, 5, 0, 7); ctx.fill(); }
  ctx.strokeStyle = 'rgba(200,190,160,0.45)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, gap0); ctx.moveTo(x, gap1); ctx.lineTo(x, bot);
  ctx.moveTo(x + 14, top); ctx.lineTo(x + 14, gap0); ctx.moveTo(x + 14, gap1); ctx.lineTo(x + 14, bot);
  for (let y = top + 8; y < bot; y += 12) {
    if (y > gap0 - 6 && y < gap1 + 6) continue;
    const sw = Math.sin(tick * 0.02 + y * 0.03) * 2;
    ctx.moveTo(x + sw, y); ctx.lineTo(x + 14 + sw, y + 12); ctx.moveTo(x + 14 + sw, y); ctx.lineTo(x + sw, y + 12);
  }
  ctx.stroke();
  const sx = side < 0 ? x - 40 : x + 2;
  ctx.fillStyle = 'rgba(210,190,120,0.85)'; ctx.fillRect(sx, gap0 - 22, 54, 14);
  ctx.fillStyle = 'rgba(40,30,20,0.9)'; ctx.font = '7px Space Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('NO ENTRY', sx + 27, gap0 - 12);
  ctx.restore();
}

// in front of the player: a blue tint underwater, the surface, foam, ripples, bubbles, the breath meter
function drawSeaFront() {
  const wy = seaY(), ox = -camX, s = playerScale();
  if (!seaShape(waveY)) return;
  ctx.fillStyle = 'rgba(40,110,150,0.16)'; ctx.fill();
  if (lake.under && scene === 'outside') drawGlow(player.wx - camX, player._py - 30 * s, 90, 0.1 + Math.min(0.12, (player._py - wy) / 3000), [150, 210, 230]);
  const x0 = Math.max(SEA_X0, camX - 20), x1 = Math.min(SEA_X1, camX + W + 20);
  ctx.strokeStyle = 'rgba(170,220,240,0.55)'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 6) { const y = waveY(x); x === x0 ? ctx.moveTo(ox + x, y) : ctx.lineTo(ox + x, y); }
  ctx.stroke();
  // whitecaps out in the storm; foam where the water meets the beach
  for (let x = Math.ceil(x0 / 40) * 40; x <= x1; x += 40) {
    const k = stormK(x);
    if (k > 0.2) {
      const y = waveY(x), crest = waveY(x - 6) > y && waveY(x + 6) > y;
      if (crest) { ctx.fillStyle = `rgba(230,240,250,${0.6 * k})`; ctx.beginPath(); ctx.ellipse(ox + x, y, 12, 2.5, 0, 0, 7); ctx.fill(); }
    }
  }
  const x = 10420 + Math.sin(tick * 0.03) * 10;
  if (x > camX - 40 && x < camX + W + 40) {
    ctx.fillStyle = 'rgba(230,240,245,0.45)';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(ox + x - 14 + i * 7, wy - 1, 4, 1.4, 0, 0, 7); ctx.fill(); }
  }
  sea.ripples.forEach(r => { ctx.strokeStyle = `rgba(180,230,240,${r.life * 0.6})`; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(ox + r.x, wy, r.r * 2.2, r.r * 0.45, 0, 0, 7); ctx.stroke(); });
  sea.splashes.forEach(p => { ctx.fillStyle = `rgba(190,235,245,${p.life})`; ctx.fillRect(ox + p.x, p.y, 2, 2); });
  if (scene === 'outside') drawBreathMeter();
}
