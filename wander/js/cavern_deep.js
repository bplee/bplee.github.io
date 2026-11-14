/* ══════════════════════════════════════════
   THE FAR SIDE OF THE LAKE
   · the old mine: timber props, rails, a forgotten cart, and seams of gold
     in the walls. with a pickaxe (peri has one) press E at a seam to mine it.
   · umber's burrow: an old mole who dug all these tunnels so he'd never
     bump into anyone. he has things to say about loneliness, and a
     fishbowl helmet that lets you breathe underwater.
   · a ladder up a long shaft that comes out of a mole hole on the surface,
     just past the cave mouth. once it's open you can climb down it too.
══════════════════════════════════════════ */
const MINE_X0 = 3140, MINE_X1 = 3900, BURROW_DOOR_X = 3935;
const LADDER_X = 4570, LADDER_TOP = -460;     // relative to caveRef(), like everything in the cave
const MOLEHOLE_X = 7480;                      // outside, where the ladder comes up

const GOLD_VEINS = [
  { x: 3230, y: 640 }, { x: 3345, y: 520 }, { x: 3520, y: 632 }, { x: 3700, y: 626 }, { x: 3800, y: 640 },
].map(v => Object.assign(v, { left: true, hits: 0 }));
const deep = { mining: null, chips: [], smoke: [], noteSeen: false };

const umber = makeRegular({ name: 'umber', kind: 'mole', color: '#a596a8', x: 4150, talkR: 60, stage: 0, endStage: 0, atLake: false });

/* ── who/what is nearby ── */
function onFarFloor() { return player._py > caveRef() + 600 && player._py < caveRef() + 710; }
function nearVein() {
  if (scene !== 'cavern' || player.inWater) return null;
  const R = caveRef();
  return GOLD_VEINS.find(v => v.left && Math.abs(player.wx - v.x) < 34 && player._py > R + v.y + 20 && player._py < R + v.y + 100) || null;
}
function nearUmber() {
  if (scene !== 'cavern') return false;
  if (umber.atLake) return player.inWater && Math.abs(player.wx - UMBER_LAKE_X) < 60 && player._py > waterY() + 700 && !nearPeri();
  return Math.abs(player.wx - umber.x) < umber.talkR && onFarFloor();
}
function nearLadder() { return scene === 'cavern' && !player.climbing && Math.abs(player.wx - LADDER_X) < 32 && onFarFloor(); }
function nearNote()   { return scene === 'cavern' && umber.atLake && Math.abs(player.wx - 4190) < 40 && onFarFloor(); }
function nearMoleHole() { return scene === 'outside' && Math.abs(player.wx - MOLEHOLE_X) < 34 && player.onGround; }

function deepPopup() {
  if (deep.mining) return null;
  if (nearLadder()) return 'press E to climb the ladder';
  if (nearUmber() && umber.bubbleT <= 0) return 'press E to talk to umber';
  if (nearNote()) return 'a note on the table: "gone visiting. back for supper. — u."';
  const v = nearVein();
  if (v) return hasItem('pickaxe') ? 'a seam of gold · press E to mine it' : "a seam of gold in the rock. you'd need a pickaxe…";
  if (scene === 'cavern' && Math.abs(player.wx - MINE_X0 - 30) < 50 && onFarFloor() && !hasItem('pickaxe')) return 'the old mine. the miners left in a hurry.';
  return null;
}
function moleHolePopup() {
  if (!nearMoleHole()) return null;
  return caveState.moleHole ? 'a mole hole · press E to climb down' : 'a molehill. something lives under here.';
}
function cliffPopup() {
  if (east.rope) return null;   // the rope ladder's there now
  if (scene === 'outside' && player.wx > CLIFF_X - 40 && player.wx < CLIFF_X && player._py > groundY(CLIFF_X + 14) + 40)
    return 'a sheer cliff. no way up from here…';
  return null;
}

function deepAction() {
  if (deep.mining) return true;
  if (nearLadder()) { startClimb(1); return true; }
  if (nearUmber()) { talkToUmber(); return true; }
  const v = nearVein();
  if (v && hasItem('pickaxe')) {
    deep.mining = { v, t: 54 };
    player.facingRight = true;
    return true;
  }
  return false;
}
window.addEventListener('keydown', e => {
  if (e.code !== 'KeyE' || e.repeat || transitioning || !started) return;
  if (scene === 'outside' && nearMoleHole() && caveState.moleHole) enterMoleHole();
});

/* ── umber ── */
const UMBER_INTRO = [
  "hm? footsteps. small ones. nobody comes down this far… well, sit, if you like. not that chair.",
  "i dug every one of these tunnels myself. forty years of digging. do you know what i found? more dirt. and quiet. i used to think quiet was the same thing as peace.",
  "that other chair was for peri. a crab, at the bottom of the lake. every evening i'd swim down and we'd watch the light come through the water and argue about whether it was stars.",
  "then my lungs got old. i told myself i'd go next week. then next month. then it had been so long that going felt stranger than staying away. that's how lonely gets you. not all at once. one 'next week' at a time.",
  "i built this, back then. a fishbowl with a bellows. it breathes for you. …would you go down and see her? you needn't say it's from me. just see if she's all right.",
];
const UMBER_END = [
  "she said that? she kept the chair. …give me a moment.",
  "funny. i was so sure she'd stopped thinking about me that i never once checked. lonely's a liar like that. it tells you the door's locked, so you never try the handle.",
  "well. there's a spare helmet under the bed somewhere. and i ought to bake something. it's rude to turn up empty-handed after eleven years.",
];
const UMBER_FLAVOR = [
  "the miners left in a hurry. something about the lake 'looking at them'. that was probably peri.",
  "i can't see much, but i know everyone by their footsteps. you walk like you're about to find something.",
  "the ladder goes up to my old front door. i stopped using it. the sky's very big. it makes a mole feel small.",
  "people say moles like being alone. people say a lot of things about moles.",
];
function talkToUmber() {
  let line;
  if (umber.atLake) line = ["she's named every fish down here. one of them's called umber. very handsome fish.", "we're putting a little window in the teapot. for the evenings. for the stars that aren't stars."][umber.li++ % 2];
  else if (questState.peri === 'open') {
    line = UMBER_END[umber.endStage++];
    if (umber.endStage === UMBER_END.length) completeQuest('peri');
  }
  else if (umber.stage < UMBER_INTRO.length) {
    line = UMBER_INTRO[umber.stage++];
    if (umber.stage === UMBER_INTRO.length) { setTimeout(() => give('helmet', 'umber'), 900); startQuest('umber'); }
  }
  else if (questState.umber === 'open') line = Math.random() < 0.5
    ? "she lives in a teapot, at the very bottom. it's a long story, and she tells it better than i do."
    : "put the helmet on and hold ↓. it does the breathing. you do the swimming. and… thank you.";
  else if (questState.peri === 'done') line = "off soon. i can't find my good scarf. i think i'm stalling. i'm definitely stalling.";
  else line = UMBER_FLAVOR[umber.li++ % UMBER_FLAVOR.length];
  say(umber, line, true);
}

/* ── gold ── */
function addGold() {
  stack('gold', 1);
  if (GOLD_VEINS.every(v => !v.left)) achieve('prospector');
}

/* ── the ladder ── */
function startClimb(dir) {
  player.climbing = dir; player.wx = LADDER_X; _vx = 0; player.vy = 0;
  player.onPlatform = false; player.inWater = false;
}
// called from updatePlayer instead of the normal physics while you're on the ladder
function updateClimb() {
  const R = caveRef();
  _vx = 0; player._vx = 0; player.vy = 0;
  player.onGround = true; player.bumpT = 2;         // arms up, legs stepping
  player.wx = LADDER_X;
  player._py -= 5 * player.climbing;
  if (++player.walkTimer >= 7) { player.walkFrame = (player.walkFrame + 1) % 4; player.walkTimer = 0; }
  if (player.climbing > 0 && player._py < R + LADDER_TOP + 80 && !transitioning) climbOut();
  if (player.climbing < 0 && player._py >= caveFloorY(LADDER_X)) {
    player._py = caveFloorY(LADDER_X); player.climbing = 0; player.walkFrame = 0;
  }
}
function climbOut() {
  fadeTransition(() => {
    scene = 'outside'; player.climbing = 0;
    player.wx = MOLEHOLE_X + 30; player._py = groundY(player.wx); player.vy = 0; _vx = 0;
    player.onPlatform = false; player.inWater = false; player.facingRight = true;
    camX = Math.max(0, Math.min(WORLD_W - W, player.wx - W * 0.3)); camY = 0;
    weather.lastCamX = camX;
    if (!caveState.moleHole) { showHint('you pop out of a mole hole on top of the big cliff. you tie off a rope ladder down the cliff, for next time.', 4200); achieve('longway'); }
    east.rope = true;   // a shortcut back up, from now on
    caveState.moleHole = true;
  });
}
function enterMoleHole() {
  fadeTransition(() => {
    scene = 'cavern';
    startClimb(-1);
    player._py = caveRef() + LADDER_TOP + 90;
    camX = Math.max(0, Math.min(CAVE_W - W, player.wx - W * 0.45)); camY = player._py - H * 0.58;
    caveState.entered = true;
  });
}

/* ══════════════════════════════════════════
   UPDATE
══════════════════════════════════════════ */
function updateDeep() {
  const R = caveRef();
  if (umber.bubbleT > 0) umber.bubbleT--;
  if (!umber.atLake) umber.x = 4150 + Math.sin(tick * 0.004) * 30;      // pottering between chair and stove
  // after the last talk, umber heads down to the lake once you've wandered off
  if (questState.peri === 'done' && !umber.atLake && Math.abs(player.wx - 4150) > 900) umber.atLake = true;
  // mining
  const m = deep.mining;
  if (m) {
    m.t--; player.bumpT = 4; _vx = 0;
    if (m.t % 18 === 0) {
      for (let i = 0; i < 6; i++) deep.chips.push({ x: m.v.x + rand(-6, 6), y: R + m.v.y + rand(-4, 4), vx: rand(-2, 2), vy: rand(-3, -0.5), life: 1, gold: Math.random() < 0.4 });
      showHint(['clink.', 'clink. clink.', 'CLONK.'][Math.min(2, ++m.v.hits - 1)], 700);
    }
    if (m.t <= 0) { m.v.left = false; deep.mining = null; addGold(); }
  }
  for (let i = deep.chips.length - 1; i >= 0; i--) {
    const c = deep.chips[i]; c.x += c.vx; c.y += c.vy; c.vy += 0.25; c.life -= 0.025;
    if (c.life <= 0 || c.y > caveFloorY(c.x)) deep.chips.splice(i, 1);
  }
  // stove smoke drifting up the pipe
  if (tick % 30 === 0) deep.smoke.push({ x: 4362 + rand(-4, 4), y: R + 700 - 60, a: 0.2, r: 2 });
  for (let i = deep.smoke.length - 1; i >= 0; i--) { const s = deep.smoke[i]; s.y -= 0.3; s.r += 0.05; s.a -= 0.004; if (s.a <= 0) deep.smoke.splice(i, 1); }
}

/* ══════════════════════════════════════════
   DRAW (inside the camera translate, behind the player)
══════════════════════════════════════════ */
function drawDeep() {
  const R = caveRef(), ox = -camX, F = R + 700;
  if (camX + W < MINE_X0 - 100) return;
  const flick = 0.85 + Math.sin(tick * 0.21) * 0.05 + Math.sin(tick * 0.53) * 0.04;
  ctx.save();
  ctx.lineCap = 'round';

  // ── the mine ──
  // rails
  ctx.strokeStyle = 'rgba(60,45,30,0.9)'; ctx.lineWidth = 3;
  for (let x = MINE_X0 + 20; x < MINE_X1; x += 22) { ctx.beginPath(); ctx.moveTo(ox + x, caveFloorY(x) - 1); ctx.lineTo(ox + x + 8, caveFloorY(x) - 1); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(140,140,150,0.6)'; ctx.lineWidth = 1.2;
  [-3, 0].forEach(dy => { ctx.beginPath(); for (let x = MINE_X0 + 20; x < MINE_X1; x += 20) { const y = caveFloorY(x) - 3 + dy; x === MINE_X0 + 20 ? ctx.moveTo(ox + x, y) : ctx.lineTo(ox + x, y); } ctx.stroke(); });
  // gold seams in the back wall
  GOLD_VEINS.forEach((v, i) => {
    const x = ox + v.x, y = R + v.y;
    ctx.fillStyle = 'rgba(40,32,24,0.9)'; ctx.beginPath(); ctx.ellipse(x, y, 16, 11, 0.3, 0, 7); ctx.fill();
    if (!v.left) { ctx.fillStyle = 'rgba(15,12,10,0.9)'; ctx.beginPath(); ctx.ellipse(x, y, 9, 6, 0.3, 0, 7); ctx.fill(); return; }
    const p = 0.6 + 0.4 * Math.sin(tick * 0.07 + i * 2);
    drawGlow(x, y, 26, 0.12 * p, [255, 210, 110]);
    ctx.fillStyle = `rgba(240,200,90,${0.7 + 0.3 * p})`;
    [[-8, -2, 2.2], [-2, 3, 1.6], [4, -4, 2.6], [9, 1, 1.4], [0, -7, 1.2], [-6, 5, 1.2]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, 7); ctx.fill(); });
    if (Math.sin(tick * 0.05 + i * 3) > 0.96) {   // a glint
      ctx.strokeStyle = 'rgba(255,245,200,0.9)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 4, y - 10); ctx.lineTo(x + 4, y + 2); ctx.moveTo(x - 2, y - 4); ctx.lineTo(x + 10, y - 4); ctx.stroke();
    }
  });
  // timber props
  for (let x = MINE_X0 + 10; x < MINE_X1 - 100; x += 170) {
    const top = caveCeilY(x) + 4, b = caveFloorY(x);
    ctx.fillStyle = '#4a3420';
    ctx.fillRect(ox + x - 4, top, 8, b - top); ctx.fillRect(ox + x + 72, top, 8, caveFloorY(x + 76) - top);
    ctx.fillStyle = '#5a4026'; ctx.fillRect(ox + x - 8, top - 2, 92, 9);
    ctx.strokeStyle = 'rgba(25,18,10,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox + x - 2, top + 30); ctx.lineTo(ox + x - 2, b - 10); ctx.stroke();
  }
  // entrance sign
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(ox + MINE_X0 + 40, F - 44, 3, 44); ctx.fillRect(ox + MINE_X0 + 8, F - 58, 68, 16);
  ctx.fillStyle = 'rgba(230,205,160,0.85)'; ctx.font = '8px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText('the old mine', ox + MINE_X0 + 42, F - 47);
  // the forgotten cart
  const cx = ox + 3600, cb = caveFloorY(3600) - 4;
  ctx.fillStyle = '#3c3a3e'; ctx.beginPath(); ctx.moveTo(cx - 24, cb - 28); ctx.lineTo(cx + 24, cb - 28); ctx.lineTo(cx + 19, cb - 6); ctx.lineTo(cx - 19, cb - 6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(120,115,125,0.7)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#5a5048'; [[-10, -32, 7], [2, -34, 8], [12, -31, 6]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(cx + dx, cb + dy, r, 0, 7); ctx.fill(); });
  ctx.fillStyle = 'rgba(240,200,90,0.8)'; ctx.beginPath(); ctx.arc(cx + 4, cb - 38, 1.6, 0, 7); ctx.fill();
  ctx.fillStyle = '#222'; [-12, 12].forEach(dx => { ctx.beginPath(); ctx.arc(cx + dx, cb - 4, 5, 0, 7); ctx.fill(); });
  // lanterns on the props
  [3430, 3610].forEach((x, i) => {
    const top = caveCeilY(x) + 8, sw = Math.sin(tick * 0.03 + i) * 0.12;
    ctx.save(); ctx.translate(ox + x, top); ctx.rotate(sw);
    ctx.strokeStyle = 'rgba(120,95,65,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.stroke();
    ctx.fillStyle = `rgba(255,200,120,${0.95 * flick})`; ctx.beginPath(); ctx.arc(0, 28, 4.5, 0, 7); ctx.fill();
    drawGlow(0, 28, 110, 0.22 * flick);
    ctx.restore();
  });

  // ── umber's burrow: a proper den dug into the earth ──
  const D = ox + BURROW_DOOR_X;
  drawDen(ox, F, flick);
  drawGlow(ox + 4180, F - 90, 300, 0.2 * flick);           // warm all through
  // round doorway (the door itself swung open against the wall)
  ctx.strokeStyle = '#5a4026'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(D - 30, F); ctx.lineTo(D - 30, F - 70); ctx.arc(D, F - 70, 30, Math.PI, 0); ctx.lineTo(D + 30, F); ctx.stroke();
  ctx.fillStyle = '#6a4a2c'; ctx.beginPath(); ctx.ellipse(D + 44, F - 50, 8, 48, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(210,180,90,0.9)'; ctx.beginPath(); ctx.arc(D + 46, F - 50, 2, 0, 7); ctx.fill();
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(D - 28, F - 132, 56, 26);
  ctx.fillStyle = 'rgba(230,205,160,0.85)'; ctx.font = '8px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText("umber's", D, F - 121); ctx.fillText('(knock)', D, F - 112);
  // rug
  ctx.fillStyle = 'rgba(150,70,60,0.55)'; ctx.beginPath(); ctx.ellipse(ox + 4170, F - 1, 120, 6, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(220,170,110,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(ox + 4170, F - 1, 100, 4, 0, 0, 7); ctx.stroke();
  // shelves dug into the wall, with jars (one full of glow-worms) and books
  ctx.fillStyle = 'rgba(20,12,8,0.55)'; manualRoundRect(ox + 3984, F - 176, 122, 80, 14); ctx.fill();
  [F - 150, F - 110].forEach((y, r) => {
    ctx.fillStyle = '#5a4026'; ctx.fillRect(ox + 3990, y, 110, 4);
    for (let j = 0; j < 4; j++) {
      const jx = ox + 4002 + j * 26, glow = r === 0 && j === 2;
      if (r === 1 && j === 3) {   // a row of books instead
        ['#7a4a40', '#4a6a5a', '#8a7a50', '#5a4a6a'].forEach((c, k) => { ctx.fillStyle = c; ctx.fillRect(jx - 4 + k * 5, y - 15 + (k % 2) * 2, 4, 15 - (k % 2) * 2); });
        continue;
      }
      ctx.fillStyle = glow ? 'rgba(140,230,255,0.5)' : ['rgba(180,140,90,0.6)', 'rgba(140,170,110,0.55)', 'rgba(200,190,170,0.5)', 'rgba(170,110,90,0.6)'][(j + r) % 4];
      ctx.fillRect(jx, y - 16, 12, 16);
      ctx.fillStyle = 'rgba(90,65,40,0.9)'; ctx.fillRect(jx - 1, y - 18, 14, 3);
      if (glow) drawGlow(jx + 6, y - 8, 24, 0.3 + 0.1 * Math.sin(tick * 0.05), [140, 230, 255]);
    }
  });
  // a rag rug, round, in rings
  ['rgba(150,70,60,0.6)', 'rgba(190,150,90,0.55)', 'rgba(110,120,90,0.55)'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(ox + 4170, F - 1, 120 - i * 30, 6 - i * 1.4, 0, 0, 7); ctx.fill(); });
  // an embroidered sampler
  ctx.fillStyle = '#5a4026'; ctx.fillRect(ox + 4118, F - 178, 64, 40);
  ctx.fillStyle = 'rgba(230,220,195,0.92)'; ctx.fillRect(ox + 4122, F - 174, 56, 32);
  ctx.fillStyle = 'rgba(160,70,70,0.85)'; ctx.font = '7px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText('home', ox + 4150, F - 162); ctx.fillText('sweet hole', ox + 4150, F - 152);
  ctx.strokeStyle = 'rgba(90,130,90,0.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(ox + 4126, F - 147); for (let i = 0; i < 12; i++) ctx.lineTo(ox + 4126 + i * 4.5, F - 147 + (i % 2) * 2); ctx.stroke();
  // a picture on the wall: a mole and a crab, drawn by a mole
  ctx.fillStyle = '#5a4026'; ctx.fillRect(ox + 4224, F - 168, 50, 40);
  ctx.fillStyle = 'rgba(225,215,185,0.9)'; ctx.fillRect(ox + 4228, F - 164, 42, 32);
  ctx.strokeStyle = 'rgba(80,60,60,0.8)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(ox + 4240, F - 142, 6, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(ox + 4258, F - 140, 7, 4, 0, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox + 4251, F - 143); ctx.lineTo(ox + 4248, F - 147); ctx.moveTo(ox + 4265, F - 143); ctx.lineTo(ox + 4268, F - 147); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,120,130,0.8)'; ctx.beginPath(); ctx.arc(ox + 4249, F - 154, 2.5, 0, 7); ctx.stroke();
  // armchair
  ctx.fillStyle = '#6a3a34';
  ctx.beginPath(); ctx.moveTo(ox + 4050, F); ctx.lineTo(ox + 4050, F - 58); ctx.quadraticCurveTo(ox + 4072, F - 70, ox + 4094, F - 58); ctx.lineTo(ox + 4094, F); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7a4640'; ctx.fillRect(ox + 4044, F - 30, 56, 16); ctx.fillRect(ox + 4042, F - 40, 10, 26); ctx.fillRect(ox + 4092, F - 40, 10, 26);
  // the little table: one cup, one candle (or a note, once he's gone visiting)
  ctx.fillStyle = '#5a4026'; ctx.fillRect(ox + 4166, F - 34, 48, 4); ctx.fillRect(ox + 4170, F - 30, 3, 30); ctx.fillRect(ox + 4206, F - 30, 3, 30);
  ctx.fillStyle = 'rgba(220,215,200,0.9)'; ctx.fillRect(ox + 4176, F - 42, 9, 8);
  ctx.strokeStyle = 'rgba(220,215,200,0.9)'; ctx.beginPath(); ctx.arc(ox + 4187, F - 38, 2.5, -1.3, 1.3); ctx.stroke();
  if (umber.atLake) { ctx.fillStyle = 'rgba(235,225,200,0.95)'; ctx.save(); ctx.translate(ox + 4198, F - 36); ctx.rotate(-0.15); ctx.fillRect(-6, -3, 13, 4); ctx.restore(); }
  else {
    ctx.fillStyle = 'rgba(235,225,200,0.9)'; ctx.fillRect(ox + 4198, F - 46, 4, 12);
    ctx.fillStyle = `rgba(255,210,130,${flick})`; ctx.beginPath(); ctx.ellipse(ox + 4200, F - 49, 2, 3.5, 0, 0, 7); ctx.fill();
    drawGlow(ox + 4200, F - 49, 40, 0.3 * flick);
  }
  // the second chair, which nobody has sat in for a long time (cobwebs)
  ctx.strokeStyle = 'rgba(150,115,75,0.75)'; ctx.lineWidth = 2;
  const c2 = ox + 4250;
  ctx.beginPath(); ctx.moveTo(c2 + 10, F); ctx.lineTo(c2 + 10, F - 44); ctx.moveTo(c2 - 10, F); ctx.lineTo(c2 - 10, F - 20); ctx.moveTo(c2 - 12, F - 20); ctx.lineTo(c2 + 12, F - 20); ctx.stroke();
  ctx.strokeStyle = 'rgba(220,220,230,0.25)'; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(c2 + 10, F - 44); ctx.lineTo(c2 - 4, F - 20); ctx.moveTo(c2 + 10, F - 34); ctx.lineTo(c2, F - 20); ctx.moveTo(c2 + 10, F - 28); ctx.quadraticCurveTo(c2 + 3, F - 30, c2 + 1, F - 20); ctx.stroke();
  // the hearth, dug into the wall: a stone arch, a fire, a kettle on a hook
  const hx = ox + 4362;
  ctx.fillStyle = 'rgba(20,12,8,0.5)'; ctx.fillRect(hx - 12, caveCeilY(4362), 24, F - 96 - caveCeilY(4362));   // the flue
  ctx.fillStyle = '#18100c'; ctx.beginPath(); ctx.moveTo(hx - 30, F); ctx.lineTo(hx - 30, F - 44); ctx.arc(hx, F - 44, 30, Math.PI, 0); ctx.lineTo(hx + 30, F); ctx.closePath(); ctx.fill();
  for (let i = 0; i <= 10; i++) {   // the stones around it
    const a = Math.PI + i * Math.PI / 10, r = 36;
    ctx.fillStyle = i % 2 ? '#6a625a' : '#5a524c'; ctx.beginPath(); ctx.ellipse(hx + Math.cos(a) * r, F - 44 + Math.sin(a) * r, 8, 6, a, 0, 7); ctx.fill();
  }
  [[-36, -20], [-36, -6], [36, -20], [36, -6]].forEach(([dx, dy], i) => { ctx.fillStyle = i % 2 ? '#5a524c' : '#6a625a'; ctx.beginPath(); ctx.ellipse(hx + dx, F + dy, 7, 7, 0, 0, 7); ctx.fill(); });
  ctx.fillStyle = '#4a3420'; ctx.fillRect(hx - 46, F - 86, 92, 6);                                  // mantel
  ctx.fillStyle = 'rgba(235,225,200,0.9)'; ctx.fillRect(hx - 36, F - 98, 4, 12);
  ctx.fillStyle = `rgba(255,210,130,${flick})`; ctx.beginPath(); ctx.ellipse(hx - 34, F - 101, 1.8, 3, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(200,190,170,0.8)'; ctx.beginPath(); ctx.arc(hx + 22, F - 94, 7, 0, 7); ctx.fill();   // a little clock
  ctx.strokeStyle = 'rgba(60,40,30,0.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx + 22, F - 94); ctx.lineTo(hx + 22, F - 99); ctx.moveTo(hx + 22, F - 94); ctx.lineTo(hx + 25, F - 93); ctx.stroke();
  // the fire
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(hx - 16, F - 8, 32, 6);
  [[0, 22, 'rgba(255,140,60,0.85)'], [4, 14, 'rgba(255,200,90,0.9)'], [-4, 9, 'rgba(255,240,180,0.9)']].forEach(([dx, h, c], i) => {
    const hh = h * flick + Math.sin(tick * 0.4 + i) * 2;
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(hx + dx - 9, F - 6); ctx.quadraticCurveTo(hx + dx - 5, F - 6 - hh * 0.6, hx + dx, F - 6 - hh); ctx.quadraticCurveTo(hx + dx + 5, F - 6 - hh * 0.6, hx + dx + 9, F - 6); ctx.fill();
  });
  drawGlow(hx, F - 20, 90, 0.35 * flick, [255, 150, 70]);
  ctx.strokeStyle = 'rgba(60,50,45,0.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx + 8, F - 74); ctx.lineTo(hx + 8, F - 44); ctx.stroke();
  ctx.fillStyle = '#2a2626'; ctx.beginPath(); ctx.ellipse(hx + 8, F - 36, 9, 8, 0, 0, 7); ctx.fill(); ctx.fillRect(hx + 15, F - 40, 6, 2);   // kettle
  deep.smoke.forEach(s => { ctx.fillStyle = `rgba(160,150,140,${s.a})`; ctx.beginPath(); ctx.arc(ox + s.x, s.y, s.r, 0, 7); ctx.fill(); });
  // the bed, in its own little nook
  const bx = ox + 4437;
  ctx.fillStyle = 'rgba(20,12,8,0.55)'; ctx.beginPath(); ctx.moveTo(bx - 32, F); ctx.lineTo(bx - 32, F - 40); ctx.quadraticCurveTo(bx - 32, F - 76, bx, F - 76); ctx.quadraticCurveTo(bx + 32, F - 76, bx + 32, F - 40); ctx.lineTo(bx + 32, F); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a4026'; ctx.fillRect(bx - 30, F - 16, 60, 14);
  const Q = ['#8a5a50', '#6a7a5a', '#9a8a5a', '#5a6a7a', '#8a6a7a', '#7a5a40'];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = Q[(i + j * 3) % 6]; ctx.fillRect(bx - 22 + i * 8.5, F - 26 + j * 5, 8.5, 5); }
  ctx.fillStyle = 'rgba(225,215,195,0.9)'; ctx.beginPath(); ctx.ellipse(bx - 22, F - 28, 9, 5, 0, 0, 7); ctx.fill();
  // hanging lamp
  const lt = caveCeilY(4170);
  ctx.strokeStyle = 'rgba(120,95,65,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ox + 4170, lt); ctx.lineTo(ox + 4170, lt + 40); ctx.stroke();
  ctx.fillStyle = '#4a3522'; ctx.beginPath(); ctx.moveTo(ox + 4160, lt + 48); ctx.lineTo(ox + 4180, lt + 48); ctx.lineTo(ox + 4174, lt + 40); ctx.lineTo(ox + 4166, lt + 40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = `rgba(255,205,130,${0.9 * flick})`; ctx.beginPath(); ctx.arc(ox + 4170, lt + 51, 3.5, 0, 7); ctx.fill();

  // ── the ladder shaft, with moonlight from the top ──
  const lg = ctx.createLinearGradient(0, R + LADDER_TOP, 0, F);
  lg.addColorStop(0, 'rgba(150,170,220,0.35)'); lg.addColorStop(1, 'rgba(150,170,220,0)');
  ctx.fillStyle = lg; ctx.fillRect(ox + 4540, R + LADDER_TOP, 60, F - R - LADDER_TOP);
  ctx.strokeStyle = '#6a4a2c'; ctx.lineWidth = 3;
  [-11, 11].forEach(dx => { ctx.beginPath(); ctx.moveTo(ox + LADDER_X + dx, F); ctx.lineTo(ox + LADDER_X + dx, R + LADDER_TOP - 10); ctx.stroke(); });
  ctx.lineWidth = 2;
  for (let y = F - 14; y > R + LADDER_TOP; y -= 20) { ctx.beginPath(); ctx.moveTo(ox + LADDER_X - 11, y); ctx.lineTo(ox + LADDER_X + 11, y); ctx.stroke(); }
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(ox + LADDER_X + 62, F - 40, 3, 40); ctx.fillRect(ox + LADDER_X + 32, F - 54, 64, 16);
  ctx.fillStyle = 'rgba(230,205,160,0.85)'; ctx.font = '8px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText('up ↑ the long way', ox + LADDER_X + 64, F - 43);

  // umber himself (when he's home)
  if (!umber.atLake) drawCritter(ox + umber.x, F, 'mole', { color: umber.color, dir: faceToward(umber.x, -1), scale: 1.5 });
  // chips from mining
  deep.chips.forEach(c => { ctx.fillStyle = c.gold ? `rgba(240,200,90,${c.life})` : `rgba(120,105,90,${c.life})`; ctx.fillRect(ox + c.x, c.y, 2.5, 2.5); });
  ctx.restore();
}

// the den itself: packed warm earth, a timber frame, roots through the ceiling, a plank floor
function drawDen(ox, F, flick) {
  const X0 = 3950, X1 = 4505, PX = 4468;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ox + X0, F); ctx.lineTo(ox + X0, F - 70);
  ctx.quadraticCurveTo(ox + X0, caveCeilY(X0 + 40) + 14, ox + X0 + 40, caveCeilY(X0 + 40) + 14);
  for (let x = X0 + 60; x <= X1 - 40; x += 20) ctx.lineTo(ox + x, caveCeilY(x) + 14 + Math.sin(x * 0.05) * 3);
  ctx.quadraticCurveTo(ox + X1, caveCeilY(X1 - 40) + 14, ox + X1, F - 110);
  ctx.lineTo(ox + X1, F - 96); ctx.quadraticCurveTo(ox + PX, F - 96, ox + PX, F - 60); ctx.lineTo(ox + PX, F);   // the passage out to the ladder
  ctx.closePath();
  const g = ctx.createLinearGradient(0, F - 400, 0, F);
  g.addColorStop(0, '#2e1e14'); g.addColorStop(0.5, '#3e2a1c'); g.addColorStop(1, '#4a3222');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(20,12,8,0.8)'; ctx.lineWidth = 6; ctx.stroke();
  ctx.clip();
  // packed-earth strata + pebbles
  ctx.strokeStyle = 'rgba(90,64,42,0.35)'; ctx.lineWidth = 1;
  for (let y = F - 380; y < F - 10; y += 26) { ctx.beginPath(); for (let x = X0; x <= X1; x += 18) { const yy = y + Math.sin(x * 0.03 + y) * 3; x === X0 ? ctx.moveTo(ox + x, yy) : ctx.lineTo(ox + x, yy); } ctx.stroke(); }
  ctx.fillStyle = 'rgba(120,100,80,0.35)';
  for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.ellipse(ox + X0 + hash(i * 3.3) * (X1 - X0), F - 30 - hash(i * 7.1) * 350, 2 + hash(i) * 3, 1.5 + hash(i) * 2, 0, 0, 7); ctx.fill(); }
  // timber ribs holding the roof up
  ctx.strokeStyle = '#4a3420'; ctx.lineWidth = 10;
  [4000, 4290].forEach(x => {
    const top = caveCeilY(x + 60) + 26;
    ctx.beginPath(); ctx.moveTo(ox + x, F); ctx.lineTo(ox + x, top + 40); ctx.quadraticCurveTo(ox + x, top, ox + x + 60, top); ctx.lineTo(ox + x + 120, top); ctx.stroke();
  });
  ctx.strokeStyle = 'rgba(30,20,12,0.5)'; ctx.lineWidth = 1;
  [4000, 4290].forEach(x => { ctx.beginPath(); ctx.moveTo(ox + x - 2, F); ctx.lineTo(ox + x - 2, caveCeilY(x) + 80); ctx.stroke(); });
  // roots poking through the ceiling
  ctx.strokeStyle = 'rgba(150,115,80,0.6)'; ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const x = X0 + 30 + i * 33 + hash(i * 2.9) * 14, top = caveCeilY(x) + 12, len = 20 + hash(i * 4.1) * 60, sw = Math.sin(tick * 0.01 + i) * 2;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox + x, top); ctx.quadraticCurveTo(ox + x - 6, top + len * 0.5, ox + x + sw, top + len); ctx.stroke();
    ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(ox + x - 3, top + len * 0.5); ctx.lineTo(ox + x - 10, top + len * 0.7); ctx.stroke();
  }
  // a dried-herb bunch and a string of little lights along the beam
  ctx.strokeStyle = 'rgba(200,180,120,0.6)'; ctx.lineWidth = 0.8;
  const by = caveCeilY(4170) + 30;
  ctx.beginPath(); ctx.moveTo(ox + 4040, by + 4); ctx.quadraticCurveTo(ox + 4170, by + 34, ox + 4300, by + 4); ctx.stroke();
  for (let i = 1; i < 10; i++) { const t = i / 10, x = 4040 + 260 * t, y = by + 4 + Math.sin(t * Math.PI) * 15; ctx.fillStyle = `rgba(255,${200 + (i % 3) * 15},130,${0.7 + 0.3 * Math.sin(tick * 0.05 + i)})`; ctx.beginPath(); ctx.arc(ox + x, y + 3, 2, 0, 7); ctx.fill(); }
  // plank floor
  ctx.fillStyle = '#5a4026'; ctx.fillRect(ox + X0, F - 5, X1 - X0, 5);
  ctx.strokeStyle = 'rgba(30,20,12,0.6)'; ctx.lineWidth = 1;
  for (let x = X0 + 30; x < X1; x += 46) { ctx.beginPath(); ctx.moveTo(ox + x, F - 5); ctx.lineTo(ox + x, F); ctx.stroke(); }
  ctx.restore();
  // a timber frame around the passage to the ladder, and a coat peg by the front door with his scarf
  ctx.strokeStyle = '#5a4026'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(ox + PX, F); ctx.lineTo(ox + PX, F - 62); ctx.quadraticCurveTo(ox + PX, F - 96, ox + X1 + 4, F - 96); ctx.stroke();
  ctx.fillStyle = '#5a4026'; ctx.fillRect(ox + 3996, F - 92, 8, 4);
  ctx.strokeStyle = 'rgba(170,120,80,0.85)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(ox + 4000, F - 88); ctx.quadraticCurveTo(ox + 3996, F - 60, ox + 4004, F - 44); ctx.stroke();
  ctx.fillStyle = 'rgba(120,90,60,0.7)'; ctx.fillRect(ox + 3954, F - 3, 40, 3);   // doormat
}

// in front of the player: umber's speech bubble at home
function drawDeepFront() {
  if (umber.atLake || umber.bubbleT <= 0 || !umber.bubble) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, umber.bubbleT / 20);
  drawBubble(umber.x - camX, caveRef() + 700 - 66, umber.bubble);
  ctx.restore();
}

// a glass fishbowl helmet with a little brass collar and bellows reed, centered on a head
function drawHelmetOn(x, y, k) {
  ctx.save();
  ctx.fillStyle = 'rgba(190,230,240,0.12)'; ctx.strokeStyle = 'rgba(200,240,250,0.7)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y, 17 * k, 0, 7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x, y, 13 * k, -2.4, -1.6); ctx.stroke();
  ctx.fillStyle = 'rgba(190,150,80,0.9)'; ctx.fillRect(x - 11 * k, y + 13 * k, 22 * k, 4 * k);
  ctx.strokeStyle = 'rgba(150,120,70,0.9)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x - 12 * k, y + 14 * k); ctx.quadraticCurveTo(x - 22 * k, y + 10 * k, x - 20 * k, y - 18 * k); ctx.stroke();
  ctx.restore();
}

/* ══════════════════════════════════════════
   OUTSIDE — the molehill / mole hole past the cave mouth
══════════════════════════════════════════ */
function drawMoleHole() {
  const sx = MOLEHOLE_X - camX;
  if (sx < -100 || sx > W + 100) return;
  const gy = groundY(MOLEHOLE_X);
  ctx.save();
  ctx.fillStyle = '#3a2a1a';
  const top = caveState.moleHole ? 30 : 40;
  ctx.beginPath(); ctx.moveTo(sx - 48, gy + 2); ctx.bezierCurveTo(sx - 30, gy - top, sx + 30, gy - top, sx + 48, gy + 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(120,95,65,0.5)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(110,85,55,0.7)';
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(sx - 30 + i * 7.5, gy - 6 - (i % 3) * 6, 1.8, 0, 7); ctx.fill(); }
  if (caveState.moleHole) {
    drawGlow(sx, gy - 22, 34, 0.16, [255, 200, 130]);   // umber's lamplight, far below
    ctx.fillStyle = '#050608'; ctx.beginPath(); ctx.ellipse(sx, gy - 22, 18, 7, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#7a5634'; ctx.lineWidth = 2.5;     // the top of the ladder poking out
    [-8, 8].forEach(dx => { ctx.beginPath(); ctx.moveTo(sx + dx, gy - 20); ctx.lineTo(sx + dx, gy - 44); ctx.stroke(); });
    ctx.lineWidth = 1.6;
    [-36, -28].forEach(y => { ctx.beginPath(); ctx.moveTo(sx - 8, gy + y); ctx.lineTo(sx + 8, gy + y); ctx.stroke(); });
  }
  ctx.restore();
}

// the big cliff past the cave mouth: a rock face drawn over the terrain's edge
const CLIFF_JAGS = Array.from({ length: 40 }, (_, i) => 4 + hash(i * 7.7) * 12);
function drawCliff() {
  const sx = CLIFF_X - camX;
  if (sx < -120 || sx > W + 120) return;
  const bot = groundY(CLIFF_X - 1) + 2, top = groundY(CLIFF_X + 14), hgt = bot - top, n = CLIFF_JAGS.length;
  ctx.save();
  const g = ctx.createLinearGradient(sx - 16, 0, sx + 70, 0);
  g.addColorStop(0, '#2a2620'); g.addColorStop(0.5, '#211d18'); g.addColorStop(1, 'rgba(26,30,20,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(sx + 70, bot); ctx.lineTo(sx, bot);
  for (let i = 0; i <= n; i++) ctx.lineTo(sx - (i % n ? CLIFF_JAGS[i % n] : 0) + 6, bot - hgt * i / n);
  ctx.lineTo(sx + 70, top); ctx.closePath(); ctx.fill();
  // strata + cracks
  ctx.strokeStyle = 'rgba(120,105,85,0.28)'; ctx.lineWidth = 1;
  for (let i = 2; i < n; i += 3) {
    const y = bot - hgt * i / n, x0 = sx - CLIFF_JAGS[i] + 8;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 26 + CLIFF_JAGS[(i + 3) % n] * 2, y + 3); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(10,8,6,0.5)';
  [[0.2, 0.32], [0.55, 0.7], [0.78, 0.86]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(sx + 4, bot - hgt * a); ctx.lineTo(sx + 12, bot - hgt * (a + b) / 2); ctx.lineTo(sx + 6, bot - hgt * b); ctx.stroke(); });
  // ivy hanging from the lip
  ctx.strokeStyle = 'rgba(80,120,60,0.75)'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const x = sx + 2 + i * 7, len = 30 + hash(i * 3.3) * 90, sw = Math.sin(tick * 0.02 + i) * 3 + weather.wind * 4;
    ctx.beginPath(); ctx.moveTo(x, top + 2); ctx.quadraticCurveTo(x - 6 + sw * 0.4, top + len * 0.6, x - 4 + sw, top + len); ctx.stroke();
    ctx.fillStyle = 'rgba(90,140,70,0.7)';
    for (let k = 0.3; k < 1; k += 0.25) { ctx.beginPath(); ctx.ellipse(x - 4 + sw * k, top + len * k, 2.5, 1.5, 0.6, 0, 7); ctx.fill(); }
  }
  // a few pebbles fallen at the foot
  ctx.fillStyle = 'rgba(110,100,85,0.6)';
  [[-14, 3], [-26, 2], [-8, 2.5], [-40, 1.8]].forEach(([dx, r]) => { ctx.beginPath(); ctx.ellipse(sx + dx, bot - 2, r * 1.4, r, 0, 0, 7); ctx.fill(); });
  ctx.restore();
}
