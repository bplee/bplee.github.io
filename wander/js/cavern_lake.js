/* ══════════════════════════════════════════
   THE UNDERGROUND LAKE (inside the cavern)
   · float on top; hold ↓ to dive, hold jump / ↑ to swim up,
     tap jump near the surface to leap out
   · a breath meter (bubbles over your head) drains while your head is
     under. run out and you shoot all the way back up to the surface.
   · on one breath you can only reach the shallow shelf. the deep trench
     needs umber's fishbowl helmet (see cavern_deep.js) — and at the very
     bottom, in a sunken teapot, lives peri the crab.
   Depths are px below the water surface (waterY()).
══════════════════════════════════════════ */
const LUNG_DEPTH   = 230;        // deepest your feet can go on one breath
const BREATH_TICKS = 60 * 8;     // eight seconds of air
const PERI_X = 2300, TEAPOT_X = 2400, UMBER_LAKE_X = 2200;

const lake = { breath: 1, surfacing: false, under: false, strokeT: 0, deepHintT: 0, taught: false,
               bubbles: [], fish: [], periStage: 0 };
const peri = makeRegular({ name: 'peri', kind: 'crab', color: '#d8876a', x: PERI_X, talkR: 70 });
peri.at = () => [peri.x, caveFloorY(peri.x), caveFloorY(peri.x) - 34];

// fish: most dart around the shallows, three lantern-fish keep to the trench
for (let i = 0; i < 18; i++) {
  const deep = i < 3;
  lake.fish.push({
    deep, x: deep ? 2120 + Math.random() * 380 : POOL_X0 + 100 + Math.random() * (POOL_X1 - POOL_X0 - 200),
    home: deep ? 720 + Math.random() * 160 : 30 + Math.random() * 170, d: 60,
    vx: (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.5),
    ph: Math.random() * 6, k: deep ? 1.4 : 0.6 + Math.random() * 0.5, dart: 0,
    col: deep ? [70, 60, 90] : [[230, 170, 90], [160, 200, 220], [220, 130, 120], [200, 210, 150]][i % 4],
  });
}
const KELP = Array.from({ length: 34 }, (_, i) => {
  const x = 1580 + i * 44 + Math.sin(i * 7.3) * 14;
  return { x, h: 40 + ((i * 37) % 60) + (x > 2000 && x < 2560 ? 70 : 0), ph: i * 1.7, glow: x > 2060 && x < 2540 };
}).filter(k => k.x < 3020);

/* ── physics (called from updatePlayer, after gravity) — the same swimming works in the sea outside (sea.js) ── */
const curWaterY = () => scene === 'cavern' ? waterY() : seaY();
function caveWater() {
  const s = playerScale(), wy = curWaterY();
  const inPool = scene === 'cavern' ? player.wx > POOL_X0 && player.wx < POOL_X1 : inSea(player.wx);
  const d = player._py - wy;                       // how deep your feet are
  const was = player.inWater;
  player.inWater = inPool && d > 0;
  const headY = player._py - 52 * s;
  lake.under = player.inWater && headY > wy + 2;
  const helmet = wearing('helmet');

  // breath: drains while your head is under (unless the helmet's on), refills at the surface
  if (lake.under && !helmet) {
    lake.breath = Math.max(0, lake.breath - 1 / BREATH_TICKS);
    if (lake.breath <= 0 && !lake.surfacing) {
      lake.surfacing = true;
      showHint('out of breath! up you go…', 2200); achieve('breathless');
    }
  } else if (!lake.under) {
    lake.breath = Math.min(1, lake.breath + 1 / 80);
    if (lake.surfacing) lake.surfacing = false;
  }
  if (!player.inWater) return;

  if (!was) {
    splashAt(player.wx, 10);
    if (!lake.taught) { lake.taught = true; showHint('hold ↓ to dive  ·  hold jump to swim up', 3800); }
  }
  player.jumpCount = 1; player.flipActive = false;
  _vx *= 0.9;
  if (lake.surfacing) _vx *= 0.8;
  if (lake.strokeT > 0) { lake.strokeT--; return; }   // a stroke/leap plays out with plain gravity

  const down = keys.ArrowDown || keys.KeyS;
  const up   = keys.Space || keys.ArrowUp || keys.KeyW;
  const eq   = 30 * s;                               // floating: about half under
  let target;
  if (lake.surfacing) target = -6;                   // out of air: all the way back up
  else if (down) {
    if (!helmet && d > LUNG_DEPTH) {
      target = -0.8;
      if (lake.deepHintT <= 0) { showHint("too deep for one breath. you'd need something to breathe from…", 3400); lake.deepHintT = 600; }
    } else target = helmet ? 2.8 : 2.4;
  }
  else if (up) target = -3;
  else if (helmet && d > eq + 16) target = 0.25;     // the brass helmet is heavy: you hover, sinking ever so slowly
  else target = Math.max(-2.2, Math.min(1.5, -(d - eq) * 0.06));   // bob up to the surface
  player.vy -= GRAVITY * player.mods.grav;           // water holds you up instead
  player.vy += (target - player.vy) * 0.12;
}

// jump while swimming: leap out near the surface, a kick upward when deeper
function swimStroke() {
  if (lake.surfacing) return;
  const s = playerScale(), d = player._py - curWaterY();
  if (d < 30 * s + 26) { player.vy = -10; lake.strokeT = 12; splashAt(player.wx, 5); }
  else { player.vy = Math.min(player.vy, -4.5); lake.strokeT = 8; puffBubbles(3); }
}
function splashAt(x, n) {
  const fx = scene === 'cavern' ? cave : sea, y = curWaterY();
  for (let i = 0; i < n; i++) fx.splashes.push({ x: x + rand(-8, 8), y, vx: rand(-1.5, 1.5), vy: rand(-3, -1), life: 1 });
  fx.ripples.push({ x, r: 2, life: 1 });
}
function puffBubbles(n) {
  const s = playerScale(), mx = player.wx + (player.facingRight ? 12 : -12) * s;
  for (let i = 0; i < n; i++) (scene === 'cavern' ? lake.bubbles : sea.bubbles).push({ x: mx + rand(-3, 3), y: player._py - 42 * s + rand(-3, 3), r: rand(1, 2.6), ph: rand(0, 6) });
}

/* ── peri ── */
function nearPeri() {
  if (scene !== 'cavern' || !player.inWater || player._py < waterY() + 700) return false;
  const d = Math.abs(player.wx - peri.x);
  return d < peri.talkR && !(umber.atLake && Math.abs(player.wx - UMBER_LAKE_X) < d);   // whoever's closer
}
const PERI_FLAVOR = [
  "the teapot fell from somewhere up there. i moved in. it's a very good teapot. it whistles when the current's right.",
  "the fish are lovely. they never remember my name, but they're lovely.",
  'sideways is the best way to walk. you always get to see where you\'ve been.',
  "the light on the water looks like stars from down here. umber says it isn't. umber's wrong.",
];
function talkToPeri() {
  let line, more = false;
  if (questState.umber === 'open') {
    line = [
      "umber? UMBER sent you? that old digger. is he all right? is he eating? he never eats when he's thinking.",
      "i stopped watching the surface, you know. every evening i'd look up at the light and think: maybe today. then one day i just… didn't look. it was easier not looking.",
      "tell him — no. tell him i kept his chair. he'll know what that means. and give him this. it fell from the mine years ago. i've kept it shiny. i didn't know why. i think i know why.",
    ][lake.periStage++];
    more = lake.periStage < 3;
    if (lake.periStage === 3) {
      completeQuest('umber');
      setTimeout(() => give('pickaxe', 'peri'), 900);
      startQuest('peri');
    }
  }
  else if (questState.peri === 'open') line = "go on! i'll be right here. i'm very good at waiting. i'd like to be worse at it.";
  else if (umber.atLake) line = ["he brought biscuits. they're soggy. they're the best thing i've ever eaten.", "eleven years, and he still hums when he's thinking. i'd forgotten. no — i hadn't."][Math.floor(Math.random() * 2)];
  else if (!met.peri) line = "oh! hello! sorry — i don't get visitors. not anymore. is it evening up there? it always feels like evening down here.";
  else line = PERI_FLAVOR[peri.li++ % PERI_FLAVOR.length];
  say(peri, line, true, { next: more && talkToPeri });
}

function lakePopup() {
  if (nearPeri()) return 'press E to talk to peri';
  return null;
}
function lakeAction() {
  if (nearPeri()) { talkToPeri(); return true; }
  return false;
}

/* ══════════════════════════════════════════
   UPDATE
══════════════════════════════════════════ */
function updateLake() {
  const wy = waterY(), s = playerScale();
  if (lake.deepHintT > 0) lake.deepHintT--;
  if (player.inWater && player.onGround && player.wx > 2080 && player.wx < 2520) achieve('diver');
  peri.x = PERI_X + Math.sin(tick * 0.012) * 18;          // shuffling sideways, as crabs do
  if (lake.under && tick % 24 === 0) puffBubbles(1);
  if (Math.random() < 0.05) {                             // bubbles from the teapot spout + the trench floor
    const x = Math.random() < 0.5 ? TEAPOT_X + 46 : rand(2100, 2520);
    lake.bubbles.push({ x, y: caveFloorY(x) - (x === TEAPOT_X + 46 ? 30 : 4), r: rand(1, 3), ph: rand(0, 6) });
  }
  for (let i = lake.bubbles.length - 1; i >= 0; i--) {
    const b = lake.bubbles[i]; b.y -= 0.6 + b.r * 0.25; b.ph += 0.1; b.x += Math.sin(b.ph) * 0.3;
    if (b.y <= wy) { lake.bubbles.splice(i, 1); if (Math.random() < 0.3) cave.ripples.push({ x: b.x, r: 1, life: 0.6 }); }
  }
  // fish: wander, turn at the shore, scatter when you swim close
  const pcx = player.wx, pcy = player._py - 30 * s;
  lake.fish.forEach(f => {
    f.ph += 0.03; f.dart *= 0.95;
    f.x += f.vx * (1 + f.dart * 2);
    const floorD = caveFloorY(f.x) - wy - 10 * f.k;
    let want = f.home + Math.sin(f.ph) * 14;
    want = Math.max(14, Math.min(floorD, want));
    f.d += (want - f.d) * 0.05;
    const lo = f.deep ? 2090 : POOL_X0 + 30, hi = f.deep ? 2530 : POOL_X1 - 30;
    if (f.x < lo || f.x > hi || floorD < 18) { f.vx = -f.vx; f.x += f.vx * 3; }
    if (player.inWater) {
      const dx = f.x - pcx, dy = wy + f.d - pcy;
      if (dx * dx + dy * dy < 70 * 70) { f.vx = Math.sign(dx || 1) * Math.abs(f.vx); f.dart = 1; }
    }
  });
}

/* ══════════════════════════════════════════
   DRAW — behind the player: the water itself + everything living in it
══════════════════════════════════════════ */
function lakeShape() {
  const wy = waterY(), x0 = Math.max(POOL_X0, camX - 20), x1 = Math.min(POOL_X1, camX + W + 20), ox = -camX;
  if (x1 <= x0) return false;
  ctx.beginPath(); ctx.moveTo(ox + x0, wy);
  for (let x = x0; x <= x1; x += 8) ctx.lineTo(ox + x, Math.max(wy, caveFloorY(x)));
  ctx.lineTo(ox + x1, Math.max(wy, caveFloorY(x1))); ctx.lineTo(ox + x1, wy); ctx.closePath();
  return true;
}

function drawLakeBack() {
  const wy = waterY(), ox = -camX;
  if (!lakeShape()) return;
  const g = ctx.createLinearGradient(0, wy, 0, wy + 900);
  g.addColorStop(0, 'rgba(30,105,118,0.6)'); g.addColorStop(0.25, 'rgba(16,68,88,0.75)'); g.addColorStop(1, 'rgba(5,16,30,0.94)');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); lakeShape(); ctx.clip();

  // soft light falling through the water
  for (let i = 0; i < 6; i++) {
    const x = POOL_X0 + 140 + i * 260 + Math.sin(tick * 0.004 + i) * 30;
    const lg = ctx.createLinearGradient(0, wy, 0, wy + 420);
    lg.addColorStop(0, 'rgba(140,220,220,0.07)'); lg.addColorStop(1, 'rgba(140,220,220,0)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.moveTo(ox + x, wy); ctx.lineTo(ox + x + 50, wy); ctx.lineTo(ox + x + 130, wy + 420); ctx.lineTo(ox + x + 40, wy + 420); ctx.closePath(); ctx.fill();
  }
  // kelp
  ctx.lineCap = 'round';
  KELP.forEach(k => {
    if (k.x < camX - 40 || k.x > camX + W + 40) return;
    const b = caveFloorY(k.x), top = Math.max(wy + 14, b - k.h);
    const sw = Math.sin(tick * 0.025 + k.ph) * 10;
    ctx.strokeStyle = k.glow ? 'rgba(70,150,130,0.7)' : 'rgba(60,110,70,0.75)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox + k.x, b); ctx.quadraticCurveTo(ox + k.x - sw, (b + top) / 2, ox + k.x + sw, top); ctx.stroke();
    ctx.fillStyle = k.glow ? 'rgba(90,190,160,0.45)' : 'rgba(70,130,80,0.5)';
    for (let t = 0.3; t < 1; t += 0.22) {
      const lx = ox + k.x + sw * (2 * t - 1) * t, ly = b + (top - b) * t;
      ctx.beginPath(); ctx.ellipse(lx + 4, ly, 5, 2, -0.5 + Math.sin(tick * 0.03 + t * 5) * 0.2, 0, 7); ctx.fill();
    }
    if (k.glow) drawGlow(ox + k.x + sw, top, 16, 0.25 + 0.1 * Math.sin(tick * 0.05 + k.ph), [110, 230, 200]);
  });
  // peri's sunken teapot (on its side, half in the silt) + umber's old chair
  drawTeapot(ox + TEAPOT_X, caveFloorY(TEAPOT_X));
  drawLakeChair(ox + UMBER_LAKE_X, caveFloorY(UMBER_LAKE_X));
  if (umber.atLake) {   // visiting, in his old chair, in his spare helmet
    const ub = caveFloorY(UMBER_LAKE_X) - 16;
    drawCritter(ox + UMBER_LAKE_X, ub, 'mole', { color: umber.color, dir: 1, scale: 1.4 });
    drawHelmetOn(ox + UMBER_LAKE_X + 16, ub - 34, 1.15);
  }
  // peri
  const pb = caveFloorY(peri.x);
  drawGlow(ox + peri.x, pb - 12, 60, 0.12, [255, 180, 150]);
  drawCritter(ox + peri.x, pb + 1, 'crab', { color: peri.color, dir: faceToward(peri.x, 1), talking: speaking(peri), scale: 1.35 });
  // fish
  lake.fish.forEach(f => {
    const x = ox + f.x, y = wy + f.d;
    if (x < -30 || x > W + 30) return;
    drawFish(x, y, f);
  });
  // bubbles
  ctx.strokeStyle = 'rgba(200,245,245,0.55)'; ctx.lineWidth = 0.8;
  lake.bubbles.forEach(b => { ctx.beginPath(); ctx.arc(ox + b.x, b.y, b.r, 0, 7); ctx.stroke(); });
  ctx.restore();
}

function drawFish(x, y, f) {
  const k = f.k, dir = Math.sign(f.vx) || 1, wag = Math.sin(tick * 0.25 + f.ph) * 2.5 * k;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  if (f.deep) {   // a lantern-fish: dark, with a little light dangling in front
    const p = 0.7 + 0.3 * Math.sin(tick * 0.06 + f.ph);
    drawGlow(16 * k, -9 * k, 30 * k, 0.45 * p, [150, 240, 220]);
    ctx.strokeStyle = 'rgba(120,110,140,0.8)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(4 * k, -5 * k); ctx.quadraticCurveTo(12 * k, -14 * k, 16 * k, -9 * k); ctx.stroke();
    ctx.fillStyle = `rgba(190,255,240,${p})`; ctx.beginPath(); ctx.arc(16 * k, -9 * k, 1.8 * k, 0, 7); ctx.fill();
  }
  const [r, g, b] = f.col;
  ctx.fillStyle = `rgba(${r},${g},${b},${f.deep ? 0.8 : 0.55})`; ctx.strokeStyle = `rgba(${r},${g},${b},0.9)`; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.ellipse(0, 0, 8 * k, 3.6 * k, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-7 * k, 0); ctx.lineTo(-13 * k, -4 * k + wag * 0.5); ctx.lineTo(-13 * k, 4 * k + wag * 0.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(4.5 * k, -0.8 * k, 0.9 * k, 0, 7); ctx.fill();
  ctx.restore();
}

function drawTeapot(x, b) {
  ctx.save(); ctx.translate(x, b); ctx.rotate(-0.12);
  drawGlow(-10, -26, 70, 0.14, [255, 200, 140]);   // a warm light inside — someone lives here
  ctx.fillStyle = 'rgba(200,205,210,0.85)'; ctx.strokeStyle = 'rgba(120,140,170,0.9)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(0, -26, 46, 32, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(80,110,170,0.7)'; ctx.lineWidth = 1;     // the blue willow pattern
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * 16, -26, 7, 0, 7); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-40, -36); ctx.quadraticCurveTo(0, -46, 40, -36); ctx.stroke();
  ctx.fillStyle = 'rgba(200,205,210,0.85)'; ctx.strokeStyle = 'rgba(120,140,170,0.9)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(40, -30); ctx.quadraticCurveTo(58, -32, 62, -48); ctx.lineTo(56, -48); ctx.quadraticCurveTo(52, -38, 40, -20); ctx.fill(); ctx.stroke();   // spout
  ctx.beginPath(); ctx.arc(-50, -26, 12, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();                                       // handle
  // the open lid end is the front door: dark, with lamplight
  ctx.fillStyle = 'rgba(40,30,25,0.95)'; ctx.beginPath(); ctx.ellipse(-8, -14, 14, 11, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,130,0.5)'; ctx.beginPath(); ctx.ellipse(-8, -12, 9, 7, 0, 0, 7); ctx.fill();
  // silt drifted up its side
  ctx.fillStyle = 'rgba(40,50,48,0.95)'; ctx.beginPath(); ctx.moveTo(-70, 2); ctx.quadraticCurveTo(0, -12, 70, 2); ctx.closePath(); ctx.fill();
  ctx.restore();
  // the lid, a little way off
  ctx.fillStyle = 'rgba(200,205,210,0.8)'; ctx.beginPath(); ctx.ellipse(x + 88, b - 4, 14, 5, 0.2, 0, 7); ctx.fill();
}
function drawLakeChair(x, b) {
  ctx.strokeStyle = 'rgba(150,115,75,0.85)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 10, b); ctx.lineTo(x - 10, b - 34); ctx.moveTo(x + 10, b); ctx.lineTo(x + 10, b - 16);
  ctx.moveTo(x - 12, b - 16); ctx.lineTo(x + 12, b - 16); ctx.moveTo(x - 10, b - 26); ctx.lineTo(x - 10, b - 30);
  ctx.stroke();
  ctx.fillStyle = 'rgba(120,90,60,0.8)'; ctx.fillRect(x - 12, b - 18, 24, 3);
}

/* ══════════════════════════════════════════
   DRAW — in front of the player: a light tint (so you look submerged),
   the surface, ripples, speech bubbles, and the breath meter
══════════════════════════════════════════ */
function drawLakeFront() {
  const wy = waterY(), ox = -camX, s = playerScale();
  if (lakeShape()) {
    ctx.fillStyle = 'rgba(40,130,140,0.16)'; ctx.fill();
    // ripples of light just under the surface
    ctx.save(); lakeShape(); ctx.clip();
    for (let i = 0; i < 14; i++) {
      const x = POOL_X0 + 40 + ((i * 113 + tick * 0.3) % (POOL_X1 - POOL_X0 - 80));
      ctx.strokeStyle = `rgba(160,240,235,${0.12 + 0.08 * Math.sin(tick * 0.04 + i)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ox + x, wy + 14 + (i % 4) * 9); ctx.quadraticCurveTo(ox + x + 10, wy + 11 + (i % 4) * 9, ox + x + 22, wy + 14 + (i % 4) * 9); ctx.stroke();
    }
    ctx.restore();
  }
  // a little light around you when you're deep, so you can see where you're going
  if (lake.under) drawGlow(player.wx - camX, player._py - 30 * s, 90, 0.1 + Math.min(0.15, (player._py - wy) / 4000), [150, 220, 230]);
  // surface line + ripples + splashes
  const x0 = Math.max(POOL_X0, camX - 20), x1 = Math.min(POOL_X1, camX + W + 20);
  if (x1 > x0) {
    ctx.strokeStyle = 'rgba(170,240,235,0.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 6) { const y = wy + Math.sin(tick * 0.05 + x * 0.05) * 0.8; x === x0 ? ctx.moveTo(ox + x, y) : ctx.lineTo(ox + x, y); }
    ctx.stroke();
  }
  cave.ripples.forEach(r => {
    ctx.strokeStyle = `rgba(180,240,240,${r.life * 0.6})`; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.ellipse(ox + r.x, wy, r.r * 2.2, r.r * 0.45, 0, 0, 7); ctx.stroke();
  });
  cave.splashes.forEach(sp => { ctx.fillStyle = `rgba(180,240,240,${sp.life})`; ctx.fillRect(ox + sp.x, sp.y, 2, 2); });

  // speech bubbles down here
  drawTalkBubbles(umber.atLake ? [peri, umber] : [peri]);

  drawBreathMeter();
}
// breath meter: a row of bubbles over your head, popping one by one (the lake and the sea)
function drawBreathMeter() {
  const s = playerScale();
  if ((lake.under && !wearing('helmet')) || lake.breath < 1) {
    const N = 6, cx = player.wx - camX, cy = player._py - 84 * s, low = lake.breath < 0.3;
    const blink = low && Math.floor(tick / 8) % 2 === 0;
    for (let i = 0; i < N; i++) {
      const x = cx + (i - (N - 1) / 2) * 10;
      const fill = Math.max(0, Math.min(1, lake.breath * N - i));
      ctx.strokeStyle = low ? 'rgba(255,170,160,0.85)' : 'rgba(200,245,250,0.8)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, cy, 3.6, 0, 7); ctx.stroke();
      if (fill > 0) {
        ctx.fillStyle = blink ? 'rgba(255,150,140,0.9)' : `rgba(170,235,250,${0.35 + 0.5 * fill})`;
        ctx.beginPath(); ctx.arc(x, cy, 3.6 * fill, 0, 7); ctx.fill();
      }
    }
  }
}
