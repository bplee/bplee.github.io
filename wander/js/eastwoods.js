/* ══════════════════════════════════════════
   THE THICK WOODS — on top of the big cliff, past umber's mole hole
   · old trees packed close together, birdhouses nailed to some of them
   · juniper the bluebird keeps an eye on everyone. try to chop a tree
     (birch's axe) and she'll have words. her deal: the storm knocked three
     birdhouses down — hang them back on their empty nails, and the trees
     the storm brought down are yours to chop (birch needs three logs).
   · a coil of rope at the cliff edge: drop it once and you can climb
     straight up and down the cliff from then on.

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
// house: someone lives here · nail: an empty nail where a fallen house goes (0..2) · home: juniper's
const EAST_TREES = [
  { x: 7660, s: 1.3 }, { x: 7770, s: 1.0, house: true }, { x: 7860, s: 1.45 }, { x: 7965, s: 1.1, nail: 0 },
  { x: 8070, s: 1.35, house: true, home: true }, { x: 8190, s: 1.0 }, { x: 8280, s: 1.5, house: true },
  { x: 8395, s: 1.15, nail: 1 }, { x: 8500, s: 1.3 }, { x: 8615, s: 1.05, house: true }, { x: 8720, s: 1.4 },
  { x: 8845, s: 1.2, nail: 2 }, { x: 8950, s: 1.0 }, { x: 9065, s: 1.35, house: true }, { x: 9180, s: 1.1 },
  { x: 9300, s: 1.2 }, { x: 9430, s: 0.95 }, { x: 9600, s: 0.85 },
].map((t, i) => Object.assign(t, { s: t.s * 1.75, seed: 20 + i, filled: false }));   // big old trees: these are big woods
// the storm-felled trees, each with a birdhouse lying beside it
const FALLEN = [
  { x: 8120, dir: 1,  len: 170, house: 8310 },
  { x: 8560, dir: -1, len: 150, house: 8450 },
  { x: 9010, dir: 1,  len: 160, house: 9200 },
].map(f => Object.assign(f, { cut: false, houseTaken: false }));
const BACK_PINES = Array.from({ length: 46 }, (_, i) => ({ x: 7560 + i * 44 + hash(i * 2.1) * 30, h: 320 + hash(i * 5.3) * 260, w: 40 + hash(i * 1.7) * 32 }));
const FERNS = Array.from({ length: 70 }, (_, i) => ({ x: 7600 + i * 28 + hash(i * 9.1) * 20, s: 1 + hash(i * 4.4) * 1.1 })).filter(f => f.x < 9500);
const HOUSE_Y = s => 64 * s;     // how far up the trunk the birdhouses hang
const HOUSE_K = 2.6;              // birdhouses are drawn this big (big enough for a bird)
const houseX = t => t.x + 3 * t.s;   // the house hangs on the front of the trunk

const east = { chop: null, chips: [], birds: [], rope: false, hung: 0 };

const jun = makeRegular({ name: 'juniper', kind: 'bird', color: '#8aa8d8', x: 8070, y: 0, stage: 0, near: false, cross: false, flying: false, idle: 0 });
OUT_TALKERS.push({ n: jun, at: () => [jun.x, jun.y - 30] });
const junHome = () => { const t = EAST_TREES.find(t => t.home); return [houseX(t) + 6, groundY(t.x) - HOUSE_Y(t.s) + 20 - 24 * HOUSE_K + 3]; };   // on the roof
jun.y = junHome()[1];

/* ══════════════════════════════════════════
   DIALOGUE
══════════════════════════════════════════ */
const JUN_INTRO = [
  "sorry. SORRY. i yell when i'm worried. i'm juniper. i keep an eye on things around here. somebody has to.",
  'last week the storm brought three trees down, and three houses came down with them. the wrens are sleeping in a boot. a BOOT.',
  "so here's my offer. the houses are lying out by the fallen trees. hang them back up (the empty nails are the shiny ones, i polish them) and the fallen trees are yours. all the wood you want.",
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
    if (jun.stage > JUN_INTRO.length) startQuest('birds');
  }
  else if (questState.birds === 'open') line = hasItem('birdhouse')
    ? 'careful with that! find a shiny nail. it has to be a shiny nail.'
    : ["the houses are lying by the fallen trees. one at a time! houses are delicate. so are wrens.", 'three houses, three nails. i counted twice.'][jun.li++ % 2];
  else line = JUN_FLAVOR[jun.li++ % JUN_FLAVOR.length];
  say(jun, line, true);
}

/* ══════════════════════════════════════════
   WHAT'S NEARBY
══════════════════════════════════════════ */
function nearJuniper() {
  if (!onPlateau() || jun.stage === 0) return false;
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
  if (!onPlateau() || east.chop) return null;
  const junTalk = nearJuniper() && jun.bubbleT < 200 ? { text: 'press E to talk to juniper', act: talkToJuniper } : null;
  if (junTalk && jun.stage <= JUN_INTRO.length) return junTalk;      // she's mid-rant: hear her out first
  const nail = nearNail();
  if (nail && hasItem('birdhouse')) return { text: 'an empty nail, polished · press E to hang the birdhouse', act: () => hangHouse(nail) };
  const fh = nearFallenHouse();
  if (fh) {
    if (jun.stage === 0 || !questState.birds) return { text: 'a birdhouse, lying in the moss. somebody lived in that.' };
    if (hasItem('birdhouse')) return { text: "another fallen house. one at a time — you're already carrying one." };
    return { text: 'press E to pick up the birdhouse', act: () => { fh.houseTaken = true; give('birdhouse'); } };
  }
  const f = nearFallen();
  if (f) {
    if (!hasItem('axe')) return { text: 'a tree the storm brought down. good wood, if you had an axe.' };
    if (jun.stage === 0) return { text: 'a fallen tree · press E to chop', act: () => startChop(f, 'log') };
    if (questState.birds !== 'done') return { text: 'a fallen tree. juniper said: houses first.' };
    return { text: 'a fallen tree · press E to chop', act: () => startChop(f, 'log') };
  }
  if (nail) return { text: 'an empty nail, polished till it shines. a house used to hang here.' };
  const t = nearStanding();
  if (t && hasItem('axe')) {
    if (jun.stage === 0) return { text: 'a big old tree · press E to chop', act: () => startChop(t, 'tree') };
    if (junTalk) return junTalk;
    return { text: t.house ? 'somebody lives in this tree.' : "a living tree. juniper would never forgive you." };
  }
  return junTalk;
});

/* ── chopping ── */
function startChop(target, kind) {
  east.chop = { target, kind, t: kind === 'tree' ? 44 : 60 };
  player.facingRight = target.x + (target.len ? target.dir * target.len / 2 : 0) >= player.wx;
}
function hangHouse(t) {
  takeItem('birdhouse');
  t.filled = true; east.hung++;
  for (let i = 0; i < 3; i++) east.birds.push({ x: t.x + rand(-300, 300), y: groundY(t.x) - 500 - rand(0, 100), tx: houseX(t) + (i - 1) * 10, ty: groundY(t.x) - HOUSE_Y(t.s) + 20 - 9 * HOUSE_K, t: 0, d: 40 + i * 20 });
  jun.near = true; jun.idle = 0;
  say(jun, JUN_HUNG[east.hung - 1], true);
  if (east.hung === 3) completeQuest('birds');
}

/* ── the rope down the cliff (a shortcut, once you've been up top) ── */
const ROPE_TOP_X = CLIFF_X + 40;
const nearRopeTop = () => scene === 'outside' && player.wx > CLIFF_X + 14 && player.wx < CLIFF_X + 70 && player._py < groundY(CLIFF_X + 14) + 6 && player.onGround;
const nearRopeBottom = () => scene === 'outside' && east.rope && player.wx > CLIFF_X - 50 && player.wx <= CLIFF_X - 8 && player._py > groundY(CLIFF_X - 1) - 6 && player.onGround;
function ropePopup() {
  if (player.roping) return null;
  if (nearRopeBottom()) return 'a rope ladder up the cliff · press E to climb';
  if (nearRopeTop()) return east.rope ? 'the rope ladder · press E to climb down' : 'a coil of rope ladder, tied to a root · press E to drop it down the cliff';
  return null;
}
window.addEventListener('keydown', e => {
  if (e.code !== 'KeyE' || e.repeat || transitioning || !started || scene !== 'outside' || player.roping) return;
  if (nearRopeBottom()) startRope(1);
  else if (nearRopeTop()) {
    if (!east.rope) { east.rope = true; showHint('the rope uncoils all the way down. a shortcut, from now on.', 3000); }
    else startRope(-1);
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
    if (c.kind === 'tree' && c.t === 20) {       // juniper has seen you
      jun.stage = 1; jun.near = true; jun.cross = true;
      say(jun, "HEY! hey hey hey. put that DOWN. that is a TREE. trees are where people LIVE!");
    }
    if (c.kind === 'log' && jun.stage === 0 && c.t === 30) {
      jun.stage = 1; jun.near = true; jun.cross = true; east.chop = null;
      say(jun, "HEY! hey. hold it. that tree fell on somebody's HOUSE. there are rules about this. there aren't, but there should be.");
    }
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

  // juniper: swoops down to you when she's worked up, flies home once you've wandered off
  if (jun.near) {
    jun.idle++;
    if (Math.abs(player.wx - jun.x) > 320 || (jun.idle > 60 * 12 && jun.stage > JUN_INTRO.length)) jun.near = false;
  }
  const [hx, hy] = junHome();
  const tx = jun.near ? player.wx + (player.wx < jun.x ? 46 : -46) : hx;
  const ty = jun.near ? Math.min(groundY(tx) - 120, player._py - 120) : hy;
  const dx = tx - jun.x, dy = ty - jun.y;
  jun.flying = Math.hypot(dx, dy) > 3;
  jun.x += dx * 0.05; jun.y += dy * 0.05 + (jun.flying ? Math.sin(tick * 0.3) * 0.6 : 0);
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
  // the fallen trees, lying in the moss
  FALLEN.forEach(f => {
    const x0 = f.x, x1 = f.x + f.dir * f.len, sx0 = x0 - camX, sx1 = x1 - camX;
    if (Math.max(sx0, sx1) < -80 || Math.min(sx0, sx1) > W + 80) return;
    const y0 = groundY(x0) - 10, y1 = groundY(x1) - 8;
    if (f.cut) {   // just a stump and some sawdust
      ctx.fillStyle = '#3a2a1c'; ctx.fillRect(sx0 - 12, y0 - 2, 24, 12);
      ctx.fillStyle = '#b89068'; ctx.beginPath(); ctx.ellipse(sx0, y0 - 2, 12, 4, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(110,80,50,0.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(sx0, y0 - 2, 6, 2, 0, 0, 7); ctx.stroke();
      return;
    }
    // root plate standing up at the base
    ctx.fillStyle = '#2a1e14'; ctx.beginPath(); ctx.ellipse(sx0 - f.dir * 4, y0 - 6, 10, 26, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(70,50,32,0.8)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(sx0 - f.dir * 4, y0 - 6); ctx.lineTo(sx0 - f.dir * (14 + hash(i + f.x) * 10), y0 - 30 + i * 10); ctx.stroke(); }
    // the trunk
    ctx.strokeStyle = '#33251a'; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx0, y0); ctx.lineTo(sx1, y1); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,70,48,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx0, y0 - 4); ctx.lineTo(sx1, y1 - 4); ctx.stroke();
    // dead branches + a bit of moss
    ctx.strokeStyle = '#2e2117'; ctx.lineWidth = 3;
    for (let i = 1; i < 5; i++) {
      const bx = sx0 + (sx1 - sx0) * i / 5, by = y0 + (y1 - y0) * i / 5;
      ctx.beginPath(); ctx.moveTo(bx, by - 4); ctx.lineTo(bx + f.dir * 14, by - 24 - hash(i * f.x) * 12); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(80,120,60,0.6)';
    for (let i = 0; i < 6; i++) { const bx = sx0 + (sx1 - sx0) * (0.15 + i * 0.14); ctx.beginPath(); ctx.ellipse(bx, y0 + (y1 - y0) * (0.15 + i * 0.14) - 7, 5, 2, 0, Math.PI, 0); ctx.fill(); }
  });
  // birdhouses still lying where they fell
  FALLEN.forEach(f => {
    if (f.houseTaken) return;
    const sx = f.house - camX; if (sx < -40 || sx > W + 40) return;
    ctx.save(); ctx.translate(sx, groundY(f.house) + 4); ctx.rotate(f.dir * 0.4); drawBirdhouse(0, 0, HOUSE_K * 0.9, false); ctx.restore();
  });
  ctx.restore();
}

// the big trees themselves (drawn with the woods' own tree), plus their houses + nails
function drawEastTrees() {
  if (camX + W < 7500 || camX > 9900) return;
  EAST_TREES.forEach(t => { if (t.x - camX > -320 && t.x - camX < W + 320) drawBigTree(t.x, t.s, t.seed); });
  EAST_TREES.forEach(t => {
    if (t.x - camX < -200 || t.x - camX > W + 200) return;
    const hx = houseX(t) - camX, hy = groundY(t.x) - HOUSE_Y(t.s);
    if (t.house || t.filled) {
      drawBirdhouse(hx, hy + 20, HOUSE_K, true);
      if (Math.sin(tick * 0.01 + t.x) > 0.6) drawCritter(hx + 3, hy + 20 - 4 * HOUSE_K + 2, 'bird', { color: ['#c8a888', '#a8b890', '#d8b070'][t.seed % 3], scale: 0.7, dir: 1 });   // someone on the porch
    } else if (t.nail != null) {
      const shine = 0.6 + 0.4 * Math.sin(tick * 0.08 + t.x);
      ctx.fillStyle = `rgba(230,230,240,${shine})`; ctx.beginPath(); ctx.arc(hx, hy - 20, 2.6, 0, 7); ctx.fill();
      drawGlow(hx, hy - 20, 14, 0.3 * shine, [230, 230, 240]);
    }
  });
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
      const bx = CLIFF_X - 9 - camX, bot = groundY(CLIFF_X - 9), sway = y => Math.sin(tick * 0.02 + y * 0.01) * 2 * (y - top) / (bot - top) + weather.wind * 3 * (y - top) / (bot - top);
      ctx.beginPath(); ctx.moveTo(rx, groundY(ROPE_TOP_X) - 3); ctx.lineTo(CLIFF_X + 4 - camX, top); ctx.stroke();
      [-8, 8].forEach(d => { ctx.beginPath(); for (let y = top; y <= bot - 2; y += 12) { const x = bx + d + sway(y); y === top ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); });
      ctx.strokeStyle = '#7a5634'; ctx.lineWidth = 2.5;
      for (let y = top + 14; y < bot - 4; y += 18) { ctx.beginPath(); ctx.moveTo(bx - 8 + sway(y), y); ctx.lineTo(bx + 8 + sway(y), y); ctx.stroke(); }   // rungs
    }
  }
  // juniper
  if (jun.stage > 0 || Math.abs(jun.x - camX - W / 2) < W) {
    const sx = jun.x - camX;
    if (sx > -40 && sx < W + 40) drawCritter(sx, jun.y, 'bird', { color: jun.color, scale: 1.3, fly: jun.flying, cross: jun.cross, dir: jun.flying ? (jun.x < (jun.near ? player.wx : junHome()[0]) ? 1 : -1) : faceToward(jun.x, -1) });
  }
  // wood chips
  east.chips.forEach(c => { ctx.fillStyle = `rgba(190,150,100,${c.life})`; ctx.fillRect(c.x - camX, c.y, 2.5, 2); });
}

// in front of the player: ferns, and the gloom of a thick canopy overhead
function drawEastWoodsFront() {
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
