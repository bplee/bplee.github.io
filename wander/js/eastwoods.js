/* ══════════════════════════════════════════
   THE THICK WOODS — on top of the big cliff, past umber's mole hole
   · old trees packed close together, birdhouses hung on wooden posts
   · juniper the bluebird keeps an eye on everyone, from inside her house.
     try to chop a tree (birch's axe) and she pops out of the nearest
     birdhouse and has words — you're not going anywhere until she's done.
     her deal: the storm knocked three birdhouses down — hang them back on
     the empty posts, and the trees the storm brought down are yours to
     chop (birch needs three logs).
   · a rope ladder at the cliff edge: the first time you come up through
     the mole hole you kick it over, and it unrolls down the cliff.

   Also here (used by store.js, beach.js, sea.js, island.js): OUT_SPOTS,
   the list of "what can you press E on outside", and the shared helpers
   for outdoor speech bubbles.
══════════════════════════════════════════ */

/* ── outdoor E targets: each entry returns null or { text, act } ── */
const OUT_SPOTS = [];
const OUT_TALKERS = [];          // { n, at: () => [x, bubbleBottomY] } — bubbles drawn by drawOutBubbles()
function outSpot() {
  if (scene !== 'outside' || player.riding || player.surfing || player.roping) return null;
  for (const f of OUT_SPOTS) { const r = f(); if (r) return r; }
  return null;
}
window.addEventListener('keydown', e => {
  if (e.code !== 'KeyE' || e.repeat || transitioning || !started || scene !== 'outside' || menu.open) return;
  const r = outSpot();
  if (r && r.act) r.act();
});
function updateOutTalkers() { OUT_TALKERS.forEach(t => { if (t.n.bubbleT > 0) t.n.bubbleT--; }); }
function drawOutBubbles() {
  OUT_TALKERS.forEach(t => {
    const n = t.n; if (n.bubbleT <= 0 || !n.bubble) return;
    const [x, y] = t.at();
    if (x - camX < -300 || x - camX > W + 300) return;
    ctx.save(); ctx.globalAlpha = Math.min(1, n.bubbleT / 20); drawBubble(x - camX, y, n.bubble); ctx.restore();
  });
}
const onPlateau = () => scene === 'outside' && player.wx > CLIFF_X + 12 && player.wx < 9600;

/* ══════════════════════════════════════════
   LAYOUT
══════════════════════════════════════════ */
// house: someone lives here · nail: an empty post where a fallen house goes (0..2) · home: juniper's
const EAST_TREES = [
  { x: 7660, s: 1.3 }, { x: 7770, s: 1.0, house: true }, { x: 7860, s: 1.45 }, { x: 7965, s: 1.1, nail: 0 },
  { x: 8070, s: 1.35, house: true, home: true }, { x: 8190, s: 1.0 }, { x: 8280, s: 1.5, house: true },
  { x: 8395, s: 1.15, nail: 1 }, { x: 8500, s: 1.3 }, { x: 8615, s: 1.05, house: true }, { x: 8720, s: 1.4 },
  { x: 8845, s: 1.2, nail: 2 }, { x: 8950, s: 1.0 }, { x: 9065, s: 1.35, house: true }, { x: 9180, s: 1.1 },
  { x: 9300, s: 1.2 }, { x: 9430, s: 0.95 }, { x: 9600, s: 0.85 },
].map((t, i) => Object.assign(t, { s: t.s * 1.75, seed: 20 + i, filled: false }));   // big old trees: these are big woods
// the storm-felled trees, each with a birdhouse lying beside it
const FALLEN = [
  { x: 8120, dir: 1,  len: 170, house: 8340 },     // (each house lies a good step past the snapped crown, clear of the trunk)
  { x: 8560, dir: -1, len: 150, house: 8365 },
  { x: 9010, dir: 1,  len: 160, house: 9215 },
].map(f => Object.assign(f, { cut: false, houseTaken: false }));
const BACK_PINES = Array.from({ length: 46 }, (_, i) => ({ x: 7560 + i * 44 + hash(i * 2.1) * 30, h: 320 + hash(i * 5.3) * 260, w: 40 + hash(i * 1.7) * 32 }));
const FERNS = Array.from({ length: 70 }, (_, i) => ({ x: 7600 + i * 28 + hash(i * 9.1) * 20, s: 1 + hash(i * 4.4) * 1.1 })).filter(f => f.x < 9500);
const HOUSE_Y = s => 64 * s;     // how far up the trunk the birdhouses hang
const HOUSE_K = 2.6;              // birdhouses are drawn this big (big enough for a bird)
const houseX = t => t.x + 3 * t.s;   // the house hangs on the front of the trunk
const holeY = t => groundY(t.x) - HOUSE_Y(t.s) + 20 - 9 * HOUSE_K;   // the round door of a hung house

// talk: you're stuck hearing juniper out · ropeT: 0..1 as the rope ladder unrolls down the cliff
const east = { chop: null, chips: [], birds: [], rope: false, ropeT: 0, ropeShow: 0, hung: 0, talk: false, lockX: 0 };

// out: she's come out of her house (until then nobody sees her) · pop: frames left of popping out of a door
const JUN_POP = 50;
const jun = makeRegular({ name: 'juniper', kind: 'bird', color: '#8aa8d8', x: 8070, y: 0, stage: 0, near: false, cross: false, flying: false, idle: 0, out: false, pop: 0, from: null, scale: 1.3 });
OUT_TALKERS.push({ n: jun, at: () => [jun.x, jun.y - 30] });
const junHome = () => { const t = EAST_TREES.find(t => t.home); return [houseX(t) + 6, groundY(t.x) - HOUSE_Y(t.s) + 20 - 24 * HOUSE_K + 3]; };   // on the roof
jun.y = junHome()[1];

/* ══════════════════════════════════════════
   DIALOGUE
══════════════════════════════════════════ */
const JUN_SHOUT = {
  tree: "HEY! hey hey hey. put that DOWN. that is a TREE. trees are where people LIVE!",
  log: "HEY! hold it. that tree fell on somebody's HOUSE. there are rules about this. there aren't, but there should be.",
};
const JUN_INTRO = [
  "sorry. SORRY. i yell when i'm worried. i'm juniper. i keep an eye on things around here. somebody has to.",
  'the storm brought three trees down last week, and three birdhouses came down with them. the wrens are sleeping in a boot. a BOOT.',
  "so here's the deal. the houses are lying in the moss by the fallen trees. carry them back and hang them on the trees with the empty wooden posts (you'll see the outline where each one hung). do that, and the fallen trees are yours.",
];
const JUN_HUNG = [
  "that's the wrens' house! out of the boot at last. they say thank you. they say it very fast.",
  "the finches! they've been sleeping in a hedge all week. you can hear them complaining from here.",
  "and that's everyone home. okay. OKAY. you're all right, for a mouse. the fallen trees are yours. take what you need.",
];
const JUN_FLAVOR = [
  'birch is building a boat? birch is always building something. last year it was a hat. a wooden hat.',
  'i can see the whole woods from up here. you walk very purposefully for someone so small.',
  "if you see the owl, tell her she's not as mysterious as she thinks she is.",
  "the island across the water? i flew halfway there once. the storm turned me around. it turns everyone around.",
];
function talkToJuniper() {
  let line;
  jun.cross = false; jun.idle = 0;
  if (jun.stage >= 1 && jun.stage <= JUN_INTRO.length) {
    line = JUN_INTRO[jun.stage - 1]; jun.stage++;
    if (jun.stage > JUN_INTRO.length) { startQuest('birds'); east.talk = false; }   // she's said her piece: you're free to go
  }
  else if (questState.birds === 'open') line = hasItem('birdhouse')
    ? "careful with that! find a tree with an empty post. you'll see the outline where it goes."
    : ["the houses are lying by the fallen trees. one at a time! houses are delicate. so are wrens.", 'three houses, three empty posts. i counted twice.'][jun.li++ % 2];
  else line = JUN_FLAVOR[jun.li++ % JUN_FLAVOR.length];
  say(jun, line, true);
}
// you swung an axe at a tree: juniper bursts out of the nearest lived-in birdhouse and flies at you
function junWake(why) {
  const t = EAST_TREES.filter(t => t.house || t.filled).reduce((a, b) => Math.abs(b.x - player.wx) < Math.abs(a.x - player.wx) ? b : a);
  Object.assign(jun, { from: t, x: houseX(t), y: holeY(t), out: true, pop: JUN_POP, stage: 1, cross: true, near: false, idle: 0 });
  east.chop = null; east.talk = true; east.lockX = player.wx;
  say(jun, JUN_SHOUT[why]);
}
// she's arrived next to you and her last line has been up long enough to read
const junReady = () => east.talk && jun.pop <= 0 && Math.abs(jun.x - player.wx) < 70 && jun.bubbleT < 60 * 4.5 - 24;

/* ══════════════════════════════════════════
   WHAT'S NEARBY
══════════════════════════════════════════ */
function nearJuniper() {
  if (!onPlateau() || !jun.out || jun.pop > 0) return false;
  return Math.abs(player.wx - jun.x) < (jun.near ? 70 : 50) && player._py - jun.y < 220;
}
function nearStanding() {
  let best = null, bd = 30;
  EAST_TREES.forEach(t => { const d = Math.abs(player.wx - t.x); if (d < bd && player.onGround) { bd = d; best = t; } });
  return best;
}
const nearFallen = () => FALLEN.find(f => !f.cut && player.onGround && player.wx > Math.min(f.x, f.x + f.dir * f.len) && player.wx < Math.max(f.x, f.x + f.dir * f.len) && Math.abs(player.wx - f.house) > 26);
const nearFallenHouse = () => FALLEN.find(f => !f.houseTaken && Math.abs(player.wx - f.house) < 26 && player.onGround);
const nearNail = () => EAST_TREES.find(t => t.nail != null && !t.filled && Math.abs(player.wx - t.x) < 34 && player.onGround);

OUT_SPOTS.push(() => {
  if (east.talk) return junReady() ? { text: 'press E to continue', act: talkToJuniper } : null;   // she has the floor
  if (!onPlateau() || east.chop) return null;
  const junTalk = nearJuniper() && jun.bubbleT < 200 ? { text: 'press E to talk to juniper', act: talkToJuniper } : null;
  if (junTalk && jun.stage <= JUN_INTRO.length) return junTalk;      // she's mid-rant: hear her out first
  const nail = nearNail();
  if (nail && hasItem('birdhouse')) return { text: 'an empty post · press E to hang the birdhouse', act: () => hangHouse(nail) };
  const fh = nearFallenHouse();
  if (fh) {
    if (!questState.birds) return { text: 'a birdhouse, knocked down in the storm. somebody lived in that.' };
    if (hasItem('birdhouse')) return { text: "another fallen house. one at a time: hang the one you're carrying first." };
    return { text: 'press E to pick up the birdhouse', act: () => {
      fh.houseTaken = true; give('birdhouse');
      showHint('now hang it on a tree with an empty post. look for the outline on the trunk.', 3600);
    } };
  }
  const f = nearFallen();
  if (f) {
    if (!hasItem('axe')) return { text: 'a tree the storm brought down. good wood, if you had an axe.' };
    if (jun.stage === 0) return { text: 'a fallen tree · press E to chop', act: () => startChop(f, 'log') };
    if (questState.birds !== 'done') return { text: 'a fallen tree. juniper said: houses first.' };
    return { text: 'a fallen tree · press E to chop', act: () => startChop(f, 'log') };
  }
  if (nail) return { text: questState.birds === 'open' ? 'an empty post. bring a fallen birdhouse here and hang it.' : 'an empty post on the trunk. a birdhouse used to hang here.' };
  const t = nearStanding();
  if (t && hasItem('axe')) {
    if (jun.stage === 0) return { text: 'a big old tree · press E to chop', act: () => startChop(t, 'tree') };
    if (junTalk) return junTalk;
    if (!FALLEN.every(f => f.cut)) return { text: t.house ? 'somebody lives in this tree.' : "a living tree. juniper would never forgive you." };
  }
  return junTalk;
});

/* ── chopping ── */
function startChop(target, kind) {
  east.chop = { target, kind, t: kind === 'tree' ? 44 : 60 };   // (before you've met juniper, she cuts this short)
  player.facingRight = target.x + (target.len ? target.dir * target.len / 2 : 0) >= player.wx;
}
function hangHouse(t) {
  takeItem('birdhouse');
  t.filled = true; east.hung++;
  for (let i = 0; i < 3; i++) east.birds.push({ x: t.x + rand(-300, 300), y: groundY(t.x) - 500 - rand(0, 100), tx: houseX(t) + (i - 1) * 10, ty: groundY(t.x) - HOUSE_Y(t.s) + 20 - 9 * HOUSE_K, t: 0, d: 40 + i * 20 });
  jun.near = true; jun.idle = 0; jun.out = true;
  say(jun, JUN_HUNG[east.hung - 1], true);
  if (east.hung === 3) completeQuest('birds');
}

/* ── the rope down the cliff (a shortcut, once you've been up top) ── */
const ROPE_TOP_X = CLIFF_X + 40;
const nearRopeTop = () => scene === 'outside' && player.wx > CLIFF_X + 14 && player.wx < CLIFF_X + 70 && player._py < groundY(CLIFF_X + 14) + 6 && player.onGround;
const ropeDown = () => east.rope && east.ropeT >= 1;   // all the way unrolled: climbable
const nearRopeBottom = () => scene === 'outside' && ropeDown() && player.wx > CLIFF_X - 50 && player.wx <= CLIFF_X - 8 && player._py > groundY(CLIFF_X - 1) - 6 && player.onGround;
function ropePopup() {
  if (player.roping) return null;
  if (nearRopeBottom()) return 'a rope ladder up the cliff · press E to climb';
  if (nearRopeTop()) return !east.rope ? 'a rolled-up rope ladder, tied to a root · press E to drop it down the cliff' : ropeDown() ? 'the rope ladder · press E to climb down' : null;
  return null;
}
window.addEventListener('keydown', e => {
  if (e.code !== 'KeyE' || e.repeat || transitioning || !started || scene !== 'outside' || player.roping) return;
  if (nearRopeBottom()) startRope(1);
  else if (nearRopeTop()) {
    if (!east.rope) { east.rope = true; showHint('you kick the rope ladder over the edge. now you can climb the cliff.', 3600); }
    else if (ropeDown()) startRope(-1);
  }
});
function startRope(dir) {
  player.roping = dir; player.wx = CLIFF_X - 9; _vx = 0; player.vy = 0; player.facingRight = true;
  if (dir < 0) player._py = groundY(CLIFF_X + 14) + 60;
}
function updateRope() {
  _vx = 0; player._vx = 0; player.vy = 0; player.onGround = true; player.bumpT = 2;
  player.wx = CLIFF_X - 9;
  player._py -= 3.5 * player.roping;
  if (++player.walkTimer >= 7) { player.walkFrame = (player.walkFrame + 1) % 4; player.walkTimer = 0; }
  const top = groundY(CLIFF_X + 14);
  if (player.roping > 0 && player._py < top + 4) { player.roping = 0; player.wx = CLIFF_X + 30; player._py = groundY(player.wx); player.walkFrame = 0; }
  if (player.roping < 0 && player._py >= groundY(CLIFF_X - 9)) { player._py = groundY(CLIFF_X - 9); player.roping = 0; player.walkFrame = 0; }
}

/* ══════════════════════════════════════════
   UPDATE
══════════════════════════════════════════ */
function updateEastWoods() {
  updateOutTalkers();
  const c = east.chop;
  if (c) {
    c.t--; player.bumpT = 4; _vx = 0;
    if (c.t % 15 === 0) {
      const cx = c.kind === 'tree' ? c.target.x : player.wx + (player.facingRight ? 16 : -16);
      for (let i = 0; i < 5; i++) east.chips.push({ x: cx + rand(-5, 5), y: groundY(cx) - (c.kind === 'tree' ? 30 : 10), vx: rand(-2, 2), vy: rand(-3, -1), life: 1 });
      showHint(['thock.', 'thock. thock.', 'THOCK.', 'thock.'][Math.floor(c.t / 15) % 4], 600);
    }
    if (jun.stage === 0 && c.t === 30) junWake(c.kind);   // a thock or two, and juniper has heard you
    if (east.chop && c.t <= 0) {
      east.chop = null;
      if (c.kind === 'log') { c.target.cut = true; stack('wood', 1); if (!FALLEN.some(f => !f.cut)) showHint("that's the last of the fallen trees.", 2400); }
    }
  }
  for (let i = east.chips.length - 1; i >= 0; i--) {
    const p = east.chips[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= 0.03;
    if (p.life <= 0 || p.y > groundY(p.x)) east.chips.splice(i, 1);
  }
  east.birds.forEach(b => { b.t++; const k = Math.min(1, b.t / (60 + b.d)); b.cx = b.x + (b.tx - b.x) * k; b.cy = b.y + (b.ty - b.y) * k - Math.sin(k * Math.PI) * 40; b.done = k >= 1; });
  for (let i = east.birds.length - 1; i >= 0; i--) if (east.birds[i].done && east.birds[i].t > 200) east.birds.splice(i, 1);

  updateRopeRoll();

  // hearing juniper out: you stay put (no walking, no jumping) and her line stays up until you press E
  if (east.talk) {
    player.inputLock = true; player.wx = east.lockX; _vx = 0; player._vx = 0;
    if (scene === 'outside') { player._py = groundY(player.wx); player.vy = 0; player.onGround = true; }
    player.jumpCount = 0; player.flipActive = false; player.flipRotation = 0;
    player.facingRight = jun.x >= player.wx;
    if (jun.bubbleT < 30) jun.bubbleT = 30;
  }
  // juniper popping out of a birdhouse door: squeezes out, then hops up and away toward you
  if (jun.pop > 0) {
    const t = jun.from, pp = 1 - --jun.pop / JUN_POP;
    jun.scale = 1.3 * Math.min(1, 0.3 + pp * 1.6);
    jun.x = houseX(t) + (pp > 0.5 ? (pp - 0.5) * 30 * Math.sign(player.wx - t.x || 1) : Math.sin(tick * 0.9) * 1.5);
    jun.y = holeY(t) + 10 * jun.scale - (pp > 0.5 ? (pp - 0.5) * 2 * 40 : 0);
    jun.flying = pp > 0.5;
    if (jun.pop === 0) { jun.near = true; jun.scale = 1.3; }
    return;
  }
  // juniper: swoops down to you when she's worked up, flies home once you've wandered off
  if (jun.near) {
    jun.idle++;
    if (!east.talk && (Math.abs(player.wx - jun.x) > 320 || (jun.idle > 60 * 12 && jun.stage > JUN_INTRO.length))) jun.near = false;
  }
  const [hx, hy] = junHome();
  const tx = jun.near ? player.wx + (player.wx < jun.x ? 46 : -46) : hx;
  const ty = jun.near ? Math.min(groundY(tx) - 120, player._py - 120) : hy;
  const dx = tx - jun.x, dy = ty - jun.y;
  jun.flying = Math.hypot(dx, dy) > 3;
  const sp = east.talk ? 0.08 : 0.05;   // she comes at you fast when she's cross
  jun.x += dx * sp; jun.y += dy * sp + (jun.flying ? Math.sin(tick * 0.3) * 0.6 : 0);
}

/* ── the rope ladder unrolling down the cliff (east.rope goes true; east.ropeT runs 0 → 1) ── */
const ROPE_ROLL = 110;   // frames to unroll (~1.8 s)
function updateRopeRoll() {
  if (!east.rope || scene !== 'outside') return;
  if (east.ropeT < 1) {
    if (east.ropeT === 0 && player.wx > CLIFF_X && player.wx < CLIFF_X + 300 && !player.roping) player.facingRight = false;   // look over the edge
    east.ropeT = Math.min(1, east.ropeT + 1 / ROPE_ROLL);
    if (east.ropeT >= 1) east.ropeShow = 70;
  } else if (east.ropeShow > 0) east.ropeShow--;
  // while it rolls (and a moment after), tip the camera down so you can see it reach the bottom
  if ((east.ropeT < 1 || east.ropeShow > 0) && player.wx > CLIFF_X && player.wx < CLIFF_X + 400) {
    const bot = groundY(CLIFF_X - 9), top = groundY(CLIFF_X + 14);
    const want = Math.min(bot + 50 - H, top - 90);
    camY += (want - camY) * 0.3;
  }
}

/* ══════════════════════════════════════════
   DRAW
══════════════════════════════════════════ */
function drawBirdhouse(x, y, k, lived) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-7, -16, 14, 16);
  ctx.strokeStyle = 'rgba(40,28,18,0.7)'; ctx.lineWidth = 0.8; ctx.strokeRect(-7, -16, 14, 16);
  ctx.fillStyle = '#9a4a3a'; ctx.beginPath(); ctx.moveTo(-10, -15); ctx.lineTo(0, -24); ctx.lineTo(10, -15); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(15,10,8,0.95)'; ctx.beginPath(); ctx.arc(0, -9, 2.6, 0, 7); ctx.fill();
  ctx.strokeStyle = '#5a4026'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(4, -4); ctx.stroke();
  if (lived) { ctx.fillStyle = 'rgba(255,200,130,0.35)'; ctx.beginPath(); ctx.arc(0, -9, 1.6, 0, 7); ctx.fill(); }
  ctx.restore();
}

// behind everything in the woods: a wall of dark pines, so it feels thick
function drawEastWoodsBack() {
  if (camX + W < 7500 || camX > 9800) return;
  ctx.save();
  BACK_PINES.forEach(p => {
    const sx = p.x - camX; if (sx < -60 || sx > W + 60) return;
    const gy = groundY(p.x) + 4, sway = Math.sin(tick * 0.01 + p.x) * 1.5 + weather.wind * 2;
    ctx.fillStyle = 'rgba(10,18,14,0.95)'; ctx.fillRect(sx - 3, gy - p.h * 0.3, 6, p.h * 0.3);
    ctx.fillStyle = 'rgba(12,24,17,0.97)';
    for (let k = 0; k < 4; k++) {
      const by = gy - p.h * 0.18 - k * p.h * 0.2, hw = p.w * (1 - k * 0.2);
      ctx.beginPath(); ctx.moveTo(sx - hw, by); ctx.lineTo(sx + hw, by); ctx.lineTo(sx + sway * (k + 1) * 0.3, by - p.h * 0.3); ctx.closePath(); ctx.fill();
    }
  });
  // thick undergrowth between the trunks
  ctx.fillStyle = 'rgba(10,20,13,0.96)';
  for (let x = Math.max(7560, Math.floor((camX - 60) / 34) * 34); x < Math.min(9560, camX + W + 60); x += 34) {
    const h = 50 + hash(x * 0.37) * 60, gy = groundY(x) + 4;
    ctx.beginPath(); ctx.ellipse(x - camX, gy - h * 0.4, 34 + hash(x) * 16, h * 0.75, 0, Math.PI, 0); ctx.fill();
  }
  ctx.restore();
}

// the storm-felled trees, lying in the moss (drawn in front of the standing trunks so they read):
// a thick trunk from the upturned root plate (at f.x) to the snapped crown end (f.x + dir*len);
// once cut, a big stump with sawdust and a few split rounds. then the birdhouses lying past each crown.
const FALLEN_R0 = 21, FALLEN_R1 = 11;    // trunk radius at the base and at the snapped end
function drawFallenStump(f, sx0) {
  const d = f.dir, gy = groundY(f.x), h = 34, r = 24;
  // sawdust spread around the base
  ctx.fillStyle = 'rgba(196,164,118,0.55)';
  ctx.beginPath(); ctx.ellipse(sx0 + d * 24, gy + 1, 60, 6, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = 'rgba(214,186,140,0.8)';
  for (let i = 0; i < 26; i++) { const ox = (hash(f.x + i * 3.7) - 0.3) * 120 * d; ctx.fillRect(sx0 + ox, gy - 1 - hash(i * 7.3 + f.x) * 3, 2.2, 1.6); }
  // roots flaring into the ground
  ctx.strokeStyle = '#3a2a1c'; ctx.lineCap = 'round';
  [[-1, 7], [1, 7], [-1, 4], [1, 4]].forEach(([sd, lw], i) => {
    ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(sx0 + sd * (r - 6), gy - 6 - i * 2);
    ctx.quadraticCurveTo(sx0 + sd * (r + 6 + i * 3), gy - 2, sx0 + sd * (r + 14 + i * 5), gy + 3); ctx.stroke();
  });
  // the stump: bark sides, lit on the moon side
  const top = gy - h;
  ctx.fillStyle = '#3e2d1f';
  ctx.beginPath(); ctx.moveTo(sx0 - r - 3, gy + 2); ctx.lineTo(sx0 - r, top); ctx.lineTo(sx0 + r, top); ctx.lineTo(sx0 + r + 3, gy + 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(20,14,9,0.7)'; ctx.lineWidth = 1.2;
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(sx0 + i * 7, top + 4); ctx.lineTo(sx0 + i * 7.6 + hash(i + f.x) * 2, gy); ctx.stroke(); }
  ctx.fillStyle = 'rgba(180,185,170,0.18)'; ctx.fillRect(sx0 + r - 6, top + 2, 6, h - 2);
  // the fresh-cut face, with rings
  ctx.fillStyle = '#c4a072'; ctx.beginPath(); ctx.ellipse(sx0, top, r, 7, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(120,86,52,0.7)'; ctx.lineWidth = 0.9;
  [18, 12, 6].forEach(k => { ctx.beginPath(); ctx.ellipse(sx0 + 1, top, k, k * 0.3, 0, 0, 7); ctx.stroke(); });
  ctx.strokeStyle = '#4a3624'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(sx0, top, r, 7, 0, 0, 7); ctx.stroke();
  // a few split rounds lying beside it
  [[58, 15, 0.9], [92, 13, 0.75], [120, 12, 0.85]].forEach(([dx, rr, sq]) => {
    const x = sx0 + d * dx, y = groundY(f.x + d * dx) - rr * 0.9;
    ctx.fillStyle = '#3e2d1f'; ctx.fillRect(x - rr * sq - 8, y - rr, 16, rr * 2);
    ctx.fillStyle = '#c4a072'; ctx.beginPath(); ctx.ellipse(x + rr * 0.15, y, rr * sq * 0.45, rr, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(120,86,52,0.7)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(x + rr * 0.15, y, rr * sq * 0.22, rr * 0.5, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,195,180,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - rr * sq - 8, y - rr); ctx.lineTo(x, y - rr); ctx.stroke();
  });
}
function drawFallen() {
  FALLEN.forEach(f => {
    const d = f.dir, x0 = f.x, x1 = f.x + d * f.len, sx0 = x0 - camX, sx1 = x1 - camX;
    if (Math.max(sx0, sx1) < -120 || Math.min(sx0, sx1) > W + 120) return;
    if (f.cut) { drawFallenStump(f, sx0); return; }
    const R0 = FALLEN_R0, R1 = FALLEN_R1;
    const y0 = groundY(x0) - R0 - 1, y1 = groundY(x1) - R1;
    const at = t => [sx0 + (sx1 - sx0) * t, y0 + (y1 - y0) * t, R0 + (R1 - R0) * t];   // centerline + radius along the trunk
    // a soft shadow on the ground under it
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse((sx0 + sx1) / 2, (groundY(x0) + groundY(x1)) / 2 + 2, Math.abs(sx1 - sx0) / 2 + 20, 7, 0, 0, 7); ctx.fill();
    // the pit the roots tore out of
    ctx.fillStyle = 'rgba(14,10,7,0.9)';
    ctx.beginPath(); ctx.ellipse(sx0 - d * 14, groundY(x0 - d * 14) + 2, 26, 6, 0, 0, 7); ctx.fill();
    // the upturned root plate: a ragged disc of roots + dirt torn up and standing behind the base
    const px = sx0 - d * 10, py = groundY(x0) - R0 - 22, prx = 24, pry = 52, tilt = -d * 0.12;
    const rim = a => 1 + Math.sin(a * 5 + f.x) * 0.09 + Math.sin(a * 11 + f.x * 0.3) * 0.05;   // lumpy edge
    const plateAt = (a, k) => { const r = rim(a) * k; const cx = Math.cos(a) * prx * r, cy = Math.sin(a) * pry * r; return [px + cx * Math.cos(tilt) - cy * Math.sin(tilt), py + cx * Math.sin(tilt) + cy * Math.cos(tilt)]; };
    ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) {      // roots poking out all round the edge
      const a = i / 16 * Math.PI * 2 + hash(i + f.x) * 0.3, [rx, ry] = plateAt(a, 0.92), len = 12 + hash(i * 3.1 + f.x) * 26;
      if (Math.sin(a) > 0.35) continue;     // (the bottom ones are still in the ground)
      const ex = rx + Math.cos(a) * len * 0.8 - d * 6, ey = ry + Math.sin(a) * len * 0.6;
      ctx.strokeStyle = i % 3 ? '#3a2a1c' : '#4a3826'; ctx.lineWidth = 4.5 - hash(i * 1.9 + f.x) * 2.5;
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.quadraticCurveTo(rx + Math.cos(a) * len * 0.5, ry + Math.sin(a) * len * 0.2 + 4, ex, ey); ctx.stroke();
      ctx.strokeStyle = 'rgba(58,42,28,0.8)'; ctx.lineWidth = 1;      // hair roots
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.cos(a + 0.6) * 9, ey + Math.sin(a + 0.6) * 6 + 4); ctx.stroke();
    }
    ctx.fillStyle = '#3d2c1c';
    ctx.beginPath(); for (let i = 0; i <= 28; i++) { const [x, y] = plateAt(i / 28 * Math.PI * 2, 1); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.fill();
    for (let i = 0; i < 14; i++) {      // clods of dirt + root ends on its face
      const [cx, cy] = plateAt(hash(i * 5.7 + f.x) * 6.28, 0.15 + hash(i * 2.9 + f.x) * 0.7);
      ctx.fillStyle = i % 4 ? '#55402b' : '#2a1e14';
      ctx.beginPath(); ctx.ellipse(cx, cy, 3 + hash(i * 1.7) * 5, 2.5 + hash(i * 1.3) * 3.5, 0, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#7a6a56';   // pebbles caught in the roots
    for (let i = 0; i < 6; i++) { const [cx, cy] = plateAt(hash(i * 8.3 + f.x) * 6.28, 0.2 + hash(i * 6.1 + f.x) * 0.6); ctx.beginPath(); ctx.ellipse(cx, cy, 2.4, 1.8, 0, 0, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(190,195,175,0.4)'; ctx.lineWidth = 2;    // moonlight on its upper rim
    ctx.beginPath(); for (let i = 0; i <= 10; i++) { const [x, y] = plateAt(-Math.PI * 0.9 + i / 10 * Math.PI * 0.75, 1); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    // broken branch stubs jutting up off the trunk: tapered, with pale snapped tips
    const stubs = [[0.3, -1.05, 34, 9], [0.52, -0.7, 44, 8], [0.7, -1.3, 28, 6.5], [0.86, -0.5, 30, 5]];
    stubs.forEach(([t, ang, len, lw], i) => {
      const [bx, by0, r] = at(t), by = by0 - r * 0.5;
      const dx = Math.cos(ang) * d, dy = Math.sin(ang), L = len * (0.8 + hash(i + f.x) * 0.4), nx = -dy, ny = dx;
      const ex = bx + dx * L, ey = by + dy * L, w0 = lw / 2, w1 = lw * 0.22;
      ctx.fillStyle = '#3a2a1c';
      ctx.beginPath(); ctx.moveTo(bx + nx * w0, by + ny * w0); ctx.lineTo(ex + nx * w1, ey + ny * w1); ctx.lineTo(ex - nx * w1, ey - ny * w1); ctx.lineTo(bx - nx * w0, by - ny * w0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b8966a';     // the splintered, pale snapped end
      ctx.beginPath(); ctx.moveTo(ex + nx * w1, ey + ny * w1); ctx.lineTo(ex + dx * 6 + nx * w1 * 0.3, ey + dy * 6); ctx.lineTo(ex + dx * 2, ey + dy * 2); ctx.lineTo(ex + dx * 5 - nx * w1, ey + dy * 5 - ny * w1); ctx.lineTo(ex - nx * w1, ey - ny * w1); ctx.closePath(); ctx.fill();
      if (i === 1) {   // one still has a dead twig on it
        const tx = bx + dx * L * 0.55, ty = by + dy * L * 0.55;
        ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + d * 16, ty - 12); ctx.lineTo(tx + d * 22, ty - 14); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(190,195,175,0.38)'; ctx.lineWidth = 1.2;   // moonlit edge
      const sgn = d > 0 ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(bx + nx * w0 * sgn, by + ny * w0 * sgn); ctx.lineTo(ex + nx * w1 * sgn, ey + ny * w1 * sgn); ctx.stroke();
    });
    // the trunk itself: a tapered log
    const N = 12, top = [], bot = [];
    for (let i = 0; i <= N; i++) { const [cx, cy, r] = at(i / N); top.push([cx, cy - r]); bot.push([cx, cy + r]); }
    ctx.fillStyle = '#3e2d1f';
    ctx.beginPath(); top.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    // the snapped crown end: jagged splinters
    const [ex, ey, er] = at(1);
    ctx.lineTo(ex + d * 10, ey - er * 0.5); ctx.lineTo(ex + d * 3, ey - er * 0.1); ctx.lineTo(ex + d * 14, ey + er * 0.2); ctx.lineTo(ex + d * 2, ey + er * 0.6);
    for (let i = N; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
    ctx.closePath(); ctx.fill();
    // underside in shadow
    ctx.fillStyle = 'rgba(12,8,5,0.45)';
    ctx.beginPath(); for (let i = 0; i <= N; i++) { const [cx, cy, r] = at(i / N); i ? ctx.lineTo(cx, cy + r * 0.25) : ctx.moveTo(cx, cy + r * 0.25); }
    for (let i = N; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath(); ctx.fill();
    // bark: long furrows and short cracks
    ctx.strokeStyle = 'rgba(18,12,8,0.6)'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
    [-0.55, -0.1, 0.35].forEach(k => { ctx.beginPath(); for (let i = 0; i <= N; i++) { const [cx, cy, r] = at(i / N); const y = cy + r * k + Math.sin(i * 1.7 + f.x) * 1.2; i ? ctx.lineTo(cx, y) : ctx.moveTo(cx, y); } ctx.stroke(); });
    for (let i = 0; i < 16; i++) {
      const t = 0.04 + i / 17, [cx, cy, r] = at(t), k = (hash(i * 4.1 + f.x) - 0.5) * 1.4;
      ctx.beginPath(); ctx.moveTo(cx, cy + r * k); ctx.lineTo(cx + d * (6 + hash(i) * 6), cy + r * k + 1); ctx.stroke();
    }
    // moonlight along the top of the log
    ctx.strokeStyle = 'rgba(176,182,166,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); top.forEach(([x, y], i) => i ? ctx.lineTo(x, y + 1) : ctx.moveTo(x, y + 1)); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,150,130,0.18)'; ctx.lineWidth = 4;
    ctx.beginPath(); for (let i = 0; i <= N; i++) { const [cx, cy, r] = at(i / N); i ? ctx.lineTo(cx, cy - r * 0.62) : ctx.moveTo(cx, cy - r * 0.62); } ctx.stroke();
    // the base end: a torn, pale face where it met the roots
    ctx.fillStyle = '#5a4430'; ctx.beginPath(); ctx.ellipse(sx0 - d * 2, y0, 5, R0, 0, 0, 7); ctx.fill();
    // pale splinters at the snapped end
    ctx.strokeStyle = '#b8966a'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(ex, ey - er * 0.6); ctx.lineTo(ex + d * 10, ey - er * 0.5); ctx.moveTo(ex, ey + er * 0.1); ctx.lineTo(ex + d * 14, ey + er * 0.2); ctx.moveTo(ex, ey + er * 0.5); ctx.lineTo(ex + d * 6, ey + er * 0.55); ctx.stroke();
    // moss on top, a fern at its foot
    for (let i = 0; i < 7; i++) {
      const t = 0.08 + i * 0.12 + hash(i + f.x) * 0.05, [cx, cy, r] = at(t), w = 8 + hash(i * 2.2 + f.x) * 9;
      ctx.fillStyle = 'rgba(78,118,58,0.85)'; ctx.beginPath(); ctx.ellipse(cx, cy - r + 1.5, w, 3.2, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(140,175,100,0.45)'; ctx.beginPath(); ctx.ellipse(cx - 2, cy - r + 0.5, w * 0.5, 1.4, 0, Math.PI, 0); ctx.fill();
      if (i % 3 === 1) { ctx.fillStyle = 'rgba(70,108,52,0.7)'; ctx.beginPath(); ctx.ellipse(cx + 3, cy - r * 0.2, 4, 5, 0, 0, 7); ctx.fill(); }
    }
    // a couple of pale mushrooms on the shady side
    [[0.42, 0], [0.47, 1]].forEach(([t, k]) => {
      const [cx, cy, r] = at(t), mx = cx + k * 7 * d, my = cy + r * 0.2;
      ctx.fillStyle = '#c8bca0'; ctx.fillRect(mx - 0.8, my, 1.6, 4);
      ctx.beginPath(); ctx.ellipse(mx, my, 3.5 - k, 1.8, 0, Math.PI, 0); ctx.fill();
    });
  });
  // birdhouses still lying where they fell (past each crown, clear of the trunk)
  FALLEN.forEach(f => {
    if (f.houseTaken) return;
    const sx = f.house - camX; if (sx < -40 || sx > W + 40) return;
    ctx.save(); ctx.translate(sx, groundY(f.house) + 4); ctx.rotate(f.dir * 0.4); drawBirdhouse(0, 0, HOUSE_K * 0.9, false); ctx.restore();
  });
}

// the wooden post a birdhouse hangs on: a plank fixed to the trunk, a shelf to sit on, a brace under it
function drawHousePost(x, by, k, empty) {
  ctx.save(); ctx.translate(x, by); ctx.scale(k, k);
  ctx.fillStyle = empty ? '#a8865a' : '#7e6040';
  ctx.fillRect(-3, -27, 6, 33);                                   // the upright plank
  ctx.fillRect(-10, 0, 20, 2.4);                                  // the shelf
  ctx.strokeStyle = empty ? '#a8865a' : '#7e6040'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-1, 5.5); ctx.lineTo(-7.5, 1.5); ctx.moveTo(1, 5.5); ctx.lineTo(7.5, 1.5); ctx.stroke();   // braces
  ctx.strokeStyle = 'rgba(40,28,18,0.6)'; ctx.lineWidth = 0.5; ctx.strokeRect(-3, -27, 6, 33); ctx.strokeRect(-10, 0, 20, 2.4);
  ctx.fillStyle = 'rgba(30,24,20,0.9)';                            // nail heads + the peg the house hooks onto
  [[0, -24], [0, 3.5]].forEach(([px, py]) => { ctx.beginPath(); ctx.arc(px, py, 0.7, 0, 7); ctx.fill(); });
  if (empty) { ctx.fillStyle = '#d8c8a8'; ctx.fillRect(-0.9, -21, 1.8, 3.6); }
  ctx.restore();
}
// a dashed outline of the house that used to hang on an empty post
function drawHouseGhost(x, by, k, a) {
  ctx.save(); ctx.translate(x, by); ctx.scale(k, k);
  ctx.strokeStyle = `rgba(240,230,205,${a})`; ctx.lineWidth = 1 / k * 1.6; ctx.setLineDash([2.2, 1.6]);
  ctx.beginPath(); ctx.rect(-7, -16, 14, 16); ctx.moveTo(-10, -15); ctx.lineTo(0, -24); ctx.lineTo(10, -15); ctx.stroke();
  ctx.setLineDash([]); ctx.beginPath(); ctx.arc(0, -9, 2.6, 0, 7); ctx.stroke();
  ctx.restore();
}

// the big trees themselves (drawn with the woods' own tree), plus their houses + empty posts
function drawEastTrees() {
  if (camX + W < 7500 || camX > 9900) return;
  EAST_TREES.forEach(t => { if (t.x - camX > -320 && t.x - camX < W + 320) drawBigTree(t.x, t.s, t.seed); });
  EAST_TREES.forEach(t => {
    if (t.x - camX < -200 || t.x - camX > W + 200) return;
    const hx = houseX(t) - camX, hy = groundY(t.x) - HOUSE_Y(t.s);
    if (t.house || t.filled) {
      drawHousePost(hx, hy + 20, HOUSE_K, false);
      drawBirdhouse(hx, hy + 20, HOUSE_K, true);
      if (Math.sin(tick * 0.01 + t.x) > 0.6) drawCritter(hx + 3, hy + 20 - 4 * HOUSE_K + 2, 'bird', { color: ['#c8a888', '#a8b890', '#d8b070'][t.seed % 3], scale: 0.7, dir: 1 });   // someone on the porch
    } else if (t.nail != null) {      // an empty post, with the outline of the house that belongs there
      const pulse = 0.5 + 0.5 * Math.sin(tick * 0.09 + t.x), carrying = hasItem('birdhouse');
      if (carrying) drawGlow(hx, hy + 20 - 12 * HOUSE_K, 75, 0.16 + 0.22 * pulse, [255, 220, 150]);
      drawHousePost(hx, hy + 20, HOUSE_K, true);
      drawHouseGhost(hx, hy + 20, HOUSE_K, carrying ? 0.55 + 0.4 * pulse : 0.4);
    }
  });
  drawFallen();
  // birds flying home to the houses you hung
  east.birds.forEach(b => {
    if (b.cx == null) return;
    if (b.done) return;
    drawCritter(b.cx - camX, b.cy, 'bird', { color: '#c8a888', scale: 0.6, fly: true, dir: b.tx > b.x ? 1 : -1 });
  });
  // the rope (coiled at the top, or hanging down the cliff)
  const rx = ROPE_TOP_X - camX, top = groundY(CLIFF_X + 14);
  if (rx > -100 && rx < W + 100) {
    ctx.strokeStyle = 'rgba(200,175,130,0.85)'; ctx.lineWidth = 2;
    if (!east.rope) { for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(rx, groundY(ROPE_TOP_X) - 4 - i * 2.5, 9, 3, 0, 0, 7); ctx.stroke(); } }
    else {
      const bx = CLIFF_X - 9 - camX, bot = groundY(CLIFF_X - 9);
      const end = top + (bot - 2 - top) * ropeP(east.ropeT);     // how far down it has unrolled (the bundle: drawRopeRoll)
      const sway = y => ropeSway(y, top, bot);
      ctx.beginPath(); ctx.moveTo(rx, groundY(ROPE_TOP_X) - 3); ctx.lineTo(CLIFF_X + 4 - camX, top); ctx.stroke();
      [-8, 8].forEach(d => { ctx.beginPath(); for (let y = top; ; y += 12) { const yy = Math.min(y, end), x = bx + d + sway(yy); y === top ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); if (yy >= end) break; } ctx.stroke(); });
      ctx.strokeStyle = '#7a5634'; ctx.lineWidth = 2.5;
      for (let y = top + 14; y < Math.min(end, bot - 4); y += 18) { ctx.beginPath(); ctx.moveTo(bx - 8 + sway(y), y); ctx.lineTo(bx + 8 + sway(y), y); ctx.stroke(); }   // rungs
    }
  }
  // juniper
  if (jun.out) {      // (until you've woken her she stays inside her house)
    const sx = jun.x - camX;
    if (jun.pop > JUN_POP - 14 && jun.from) {     // a burst at the door as she bursts out
      const k = (JUN_POP - jun.pop) / 14, hx = houseX(jun.from) - camX, hy = holeY(jun.from);
      ctx.strokeStyle = `rgba(200,220,255,${0.8 * (1 - k)})`; ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.3; ctx.beginPath(); ctx.moveTo(hx + Math.cos(a) * (8 + k * 10), hy + Math.sin(a) * (8 + k * 10)); ctx.lineTo(hx + Math.cos(a) * (14 + k * 22), hy + Math.sin(a) * (14 + k * 22)); ctx.stroke(); }
    }
    if (sx > -40 && sx < W + 40) {
      const dir = jun.pop > 0 ? Math.sign(player.wx - jun.x || 1) : jun.flying ? (jun.x < (jun.near ? player.wx : junHome()[0]) ? 1 : -1) : faceToward(jun.x, -1);
      drawCritter(sx, jun.y, 'bird', { color: jun.color, scale: jun.scale, fly: jun.flying, cross: jun.cross, dir });
      if (jun.pop > 0) {   // a big "!" over her head as she bursts out
        ctx.fillStyle = 'rgba(255,225,140,0.95)'; ctx.font = 'bold 18px Space Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText('!', sx - dir * 16 * jun.scale, jun.y - 22 * jun.scale); ctx.textAlign = 'left';
      }
    }
  }
  // wood chips
  east.chips.forEach(c => { ctx.fillStyle = `rgba(190,150,100,${c.life})`; ctx.fillRect(c.x - camX, c.y, 2.5, 2); });
}

// the rolled-up rope ladder tumbling down the cliff (drawn in front, so the cliff's jagged face can't hide it)
function drawRopeRoll() {
  const u = east.ropeT;
  if (!east.rope || u >= 1 || scene !== 'outside') return;
  const bx = CLIFF_X - 9 - camX; if (bx < -60 || bx > W + 60) return;
  const top = groundY(CLIFF_X + 14), bot = groundY(CLIFF_X - 9), p = ropeP(u), end = top + (bot - 2 - top) * p;
  const r = 5 + 11 * (1 - p), cx = bx + ropeSway(end, top, bot), cy = end + r - 2, spin = p * 40;
  ctx.save();
  ctx.fillStyle = '#9a7a4e'; ctx.strokeStyle = 'rgba(60,40,22,0.9)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(cx, cy, 16, r, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { const a = spin + i * Math.PI / 2, yy = cy + Math.sin(a) * r * 0.8; if (Math.cos(a) > 0) { ctx.beginPath(); ctx.moveTo(cx - 14, yy); ctx.lineTo(cx + 14, yy); ctx.stroke(); } }   // rungs rolling round
  ctx.strokeStyle = 'rgba(220,195,150,0.9)'; ctx.lineWidth = 1.5;
  [-14, 14].forEach(d => { ctx.beginPath(); ctx.ellipse(cx + d, cy, 2.2, r, 0, 0, 7); ctx.stroke(); });   // the coiled side ropes
  if (u > 0.05) { ctx.fillStyle = 'rgba(150,135,110,0.6)'; for (let i = 0; i < 3; i++) ctx.fillRect(cx + Math.sin(tick * 0.7 + i * 2) * 14, cy - r - 4 - ((tick * 3 + i * 9) % 22), 2, 2); }   // grit knocked loose
  ctx.restore();
}
const ropeP = u => u * u * (3 - 2 * u) * 0.25 + u * u * 0.75;      // starts slow, picks up speed as it falls
function ropeSway(y, top, bot) {
  const wob = east.ropeShow > 0 ? Math.sin(east.ropeShow * 0.35) * 5 * east.ropeShow / 70 : 0;   // a shake as it lands
  return (Math.sin(tick * 0.02 + y * 0.01) * 2 + weather.wind * 3 + wob) * (y - top) / (bot - top);
}

// in front of the player: ferns, and the gloom of a thick canopy overhead
function drawEastWoodsFront() {
  drawRopeRoll();
  if (camX + W < 7500 || camX > 9900) return;
  ctx.save();
  FERNS.forEach((f, i) => {
    const sx = f.x - camX; if (sx < -30 || sx > W + 30) return;
    const gy = groundY(f.x) + 2, sw = Math.sin(tick * 0.03 + i) * 0.1 + weather.wind * 0.15;
    const d = f.x - player.wx, part = Math.abs(d) < 20 && player.onGround ? Math.sign(d || 1) * 0.5 * (1 - Math.abs(d) / 20) : 0;
    ctx.strokeStyle = 'rgba(50,90,50,0.85)'; ctx.lineWidth = 1.2;
    for (let k = -2; k <= 2; k++) {
      const a = k * 0.45 + sw + part, l = 16 * f.s * (1 - Math.abs(k) * 0.15);
      ctx.beginPath(); ctx.moveTo(sx, gy); ctx.quadraticCurveTo(sx + Math.sin(a) * l * 0.6, gy - l * 0.8, sx + Math.sin(a) * l, gy - Math.cos(a) * l * 0.7); ctx.stroke();
    }
  });
  ctx.restore();
}
function drawEastGloom() {
  const mid = camX + W / 2;
  const k = Math.max(0, Math.min(1, (mid - 7550) / 250, (9500 - mid) / 300));
  if (k <= 0) return;
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.6);
  g.addColorStop(0, `rgba(4,10,6,${0.75 * k})`); g.addColorStop(1, 'rgba(4,10,6,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.6);
  // a few leaves drifting down through the canopy
  ctx.fillStyle = `rgba(90,130,70,${0.5 * k})`;
  for (let i = 0; i < 10; i++) {
    const x = ((i * 173 + tick * (0.3 + (i % 3) * 0.1) + weather.wind * tick * 0.3) % (W + 40)) - 20, y = ((i * 97 + tick * 0.6) % (H * 0.9));
    ctx.beginPath(); ctx.ellipse(x + Math.sin(tick * 0.03 + i) * 8, y, 2.5, 1.2, tick * 0.02 + i, 0, 7); ctx.fill();
  }
}
