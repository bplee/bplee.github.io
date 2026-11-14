/* ══════════════════════════════════════════
   THE BEACH + BIRCH'S BOAT
   Down the long slope past the thick woods: a beach, and birch the beaver
   building a sailboat to reach the island he can see across the water.
   · talk to him: he gives you his spare axe and asks for three logs (the
     thick woods) and a bolt of sailcloth (marigold's store).
   · bring them and he finishes the boat ("the maybe") and moors it.
   · E by the boat: sail across. the open sea has a storm on it, always.
     the waves calm into surf near the island. he'll ferry you back too.
   Also: the far horizon over the sea, and the storm overlay.
══════════════════════════════════════════ */
const BOAT_BUILD_X = 10230, DOCK_X = 10480, ISLAND_DOCK_X = 14905;
const STORM_X0 = 11750, STORM_X1 = 13450;

const boat = { hull: false, sail: false, launched: false, side: 'beach', x: BOAT_BUILD_X, ride: null, tilt: 0, y: 0, hammer: 0, crossed: false };
const birch = makeRegular({ name: 'birch', kind: 'beaver', color: '#a8805a', x: 10150, stage: 0 });
OUT_TALKERS.push({ n: birch, at: () => [birchX(), birchY() - 66] });
function birchX() { return boat.ride ? boat.x - 40 * boat.ride.dir : boat.side === 'island' ? 15050 : boat.launched ? 10335 : birch.x; }
function birchY() { return boat.ride ? boat.y - 4 : groundY(birchX()); }

/* ── waves ── */
function stormK(x) {
  const a = Math.min(1, Math.max(0, (x - STORM_X0) / 400)), b = Math.min(1, Math.max(0, (STORM_X1 - x) / 400));
  return Math.min(a, b);
}
function waveAmp(x) { return 1.2 + stormK(x) * 20 + (x > SEA_X0 + 500 && x < 14300 ? 3 : 0); }
function waveY(x) {
  const a = waveAmp(x);
  return seaY() + a * (Math.sin(x * 0.016 - tick * 0.045) * 0.7 + Math.sin(x * 0.037 + tick * 0.07) * 0.3);
}

/* ══════════════════════════════════════════
   BIRCH
══════════════════════════════════════════ */
const BIRCH_INTRO = [
  "oh! hello! mind the shavings. i'm birch. that's my boat. well — that's her skeleton. she's coming along.",
  "see the island? way out there, past the storm. i've watched it every evening for three years. tonight i'd like to stand on it.",
  "she needs three good logs for the hull, and a bolt of sailcloth for the sail. the cloth i can't make. marigold sells it, at the store by the tavern.",
  "i'd cut the logs myself, but i'm needed here. holding this plank. it's very important that someone holds this plank. take my spare axe — the woods up the hill are full of trees.",
];
const BIRCH_FLAVOR = [
  "the storm's always out there. that's why nobody's crossed. but she's a good boat. we've talked about it.",
  "i packed sandwiches. they're mostly bread. the filling is also bread.",
  "a beaver's supposed to build dams. i built one once. i felt terrible for the river.",
];
const BIRCH_ISLAND = [
  "i'm going to build rae a porch. she doesn't know yet. it's a surprise porch.",
  "three years i looked at this island. it's even better close up. that almost never happens.",
  "whenever you want to go back, just hop in. the maybe's ready.",
];
function boatNeeds() {
  const n = [], w = inv.wood || 0;
  if (!boat.hull) n.push(w ? `${3 - w} more log${3 - w > 1 ? 's' : ''}` : 'three logs from the woods');
  if (!boat.sail) n.push("the sailcloth from marigold's");
  return n.join(', and ');
}
function talkToBirch() {
  let line;
  if (birch.stage < BIRCH_INTRO.length) {
    line = BIRCH_INTRO[birch.stage++];
    if (birch.stage === BIRCH_INTRO.length) { setTimeout(() => give('axe', 'birch'), 900); startQuest('boat'); }
  } else if (questState.boat === 'open') {
    if ((inv.wood || 0) >= 3 && !boat.hull) {
      stack('wood', -3); boat.hull = true; boat.hammer = 120;
      line = boat.sail ? "the logs! that's everything!" : "three logs! straight grain, hardly a knot. you've got an eye. give me a minute…";
    } else if (hasItem('canvas') && !boat.sail) {
      takeItem('canvas'); boat.sail = true; boat.hammer = 90;
      line = boat.hull ? 'sailcloth! that\'s everything!' : 'sailcloth! oh, she\'ll have a SAIL. now just the logs.';
    } else line = `still need ${boatNeeds()}. no rush. well. a little rush. the island isn't going anywhere, but neither am i.`;
    if (boat.hull && boat.sail) {
      completeQuest('boat');
      setTimeout(() => { boat.launched = true; boat.x = DOCK_X; say(birch, "she's done. i'm calling her the maybe — because maybe we'll make it. hop in whenever you're ready."); }, 2200);
    }
  } else line = (boat.side === 'island' ? BIRCH_ISLAND : BIRCH_FLAVOR)[birch.li++ % 3];
  say(birch, line, true);
}

/* ── sailing ── */
function setSail() {
  const dir = boat.side === 'beach' ? 1 : -1;
  boat.ride = { dir, v: 0, t: 0, said: 0 };
  player.riding = true; player.inWater = false; player.vy = 0; _vx = 0; player.flipActive = false;
  lake.under = false; lake.breath = 1; lake.surfacing = false;
  say(birch, dir > 0 ? "cast off! …that's a sailing word. i read a book." : 'home again! hold on — the storm\'s still there.');
}
const RIDE_LINES = [
  [0.22, 'hold on to something! not me! something sturdier!'],
  [0.45, 'she\'s holding! GOOD boat! good, good boat!'],
  [0.7,  'look — the water\'s calming down. are those… waves? nice ones?'],
];
function updateRide() {
  const r = boat.ride; r.t++;
  const dest = r.dir > 0 ? ISLAND_DOCK_X : DOCK_X, from = r.dir > 0 ? DOCK_X : ISLAND_DOCK_X;
  const left = Math.abs(dest - boat.x);
  r.v = Math.min(5.5, r.v + 0.05, 0.6 + left * 0.02);
  boat.x += r.v * r.dir;
  const prog = Math.abs(boat.x - from) / Math.abs(dest - from);
  if (r.dir > 0 && r.said < RIDE_LINES.length && prog > RIDE_LINES[r.said][0]) say(birch, RIDE_LINES[r.said++][1]);
  _vx = 0; player._vx = 0; player.vy = 0; player.onGround = true; player.walkFrame = 0;
  player.facingRight = r.dir > 0;
  player.wx = boat.x - 8 * r.dir; player._py = boat.y - 4;
  if (left < 1) arrive(r.dir);
}
function arrive(dir) {
  boat.ride = null; player.riding = false;
  boat.side = dir > 0 ? 'island' : 'beach';
  player.wx = dir > 0 ? ISLAND_DOCK_X + 95 : DOCK_X - 110; player._py = groundY(player.wx);
  if (dir > 0 && !boat.crossed) {
    boat.crossed = true; achieve('sailor');
    say(birch, 'we made it. three years of looking at it, and we made it. …oh! someone\'s out there on the water!');
  } else say(birch, dir > 0 ? 'land ho! i love saying that.' : 'home! the woods look small from out there.');
}

OUT_SPOTS.push(() => {
  if (player.wx < 9900 || (player.wx > 10700 && player.wx < 14700)) return null;
  const side = player.wx > 12000 ? 'island' : 'beach';
  const bx = boat.side === side ? (side === 'island' ? ISLAND_DOCK_X : boat.launched ? DOCK_X : BOAT_BUILD_X) : null;
  if (boat.launched && bx !== null && Math.abs(player.wx - bx) < 110 && Math.abs(player.wx - birchX()) > 24)
    return { text: side === 'island' ? "the maybe · press E to sail home" : 'the maybe · press E to set sail', act: setSail };
  if (Math.abs(player.wx - birchX()) < 60 && player.onGround && (side === boat.side || !boat.launched))
    return { text: 'press E to talk to birch', act: talkToBirch };
  if (!boat.launched && Math.abs(player.wx - BOAT_BUILD_X) < 70) return { text: boat.hull ? 'a little boat, nearly done. no sail yet.' : 'the bones of a little boat, up on blocks.' };
  return null;
});

/* ══════════════════════════════════════════
   UPDATE
══════════════════════════════════════════ */
const storm = { flash: 0, bolt: null };
function updateBeach() {
  if (!boat.launched) boat.x = BOAT_BUILD_X;
  else if (!boat.ride) boat.x = boat.side === 'island' ? ISLAND_DOCK_X : DOCK_X;
  boat.y = boat.launched ? waveY(boat.x) + 2 : groundY(BOAT_BUILD_X) - 14;
  const want = boat.launched ? Math.atan2(waveY(boat.x + 30) - waveY(boat.x - 30), 60) : 0;
  boat.tilt += (want - boat.tilt) * 0.1;
  if (boat.hammer > 0) boat.hammer--;
  if (!boat.launched) birch.x = 10150 + Math.sin(tick * 0.006) * 12;
  // the storm: lightning whenever it's on screen
  const k = stormK(camX + W / 2);
  storm.flash *= 0.88;
  if (k > 0.3 && Math.random() < 0.006 * k) { storm.flash = 1; storm.bolt = { x: rand(0.1, 0.9) * W, seed: Math.random() * 100 }; }
}

/* ══════════════════════════════════════════
   DRAW
══════════════════════════════════════════ */
// the sea, far off: covers the hills behind the beach and the island (screen space)
function drawSeaHorizon() {
  const sx0 = 9800 - camX * 1;
  if (sx0 > W) return;
  const off = -(viewBias() + (camY - viewBias()) * 0.3);
  const yTop = Math.max(0, H * BASE_GND - 170 + off), yH = H * BASE_GND - 46 + off;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#05070e'); g.addColorStop(0.5, '#0c1120'); g.addColorStop(0.78, '#18203a'); g.addColorStop(1, '#151a28');
  const fade = 220, x0 = Math.max(0, sx0);
  ctx.save();
  for (let i = 0; i < 8; i++) {          // soften the edge where the hills give way to sea
    const a = sx0 + i * fade / 8; if (a + fade / 8 < 0) continue;
    ctx.globalAlpha = (i + 1) / 9; ctx.fillStyle = g; ctx.fillRect(a, yTop, fade / 8 + 1, H - yTop);
  }
  ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(Math.max(0, sx0 + fade), yTop, W, H - yTop);
  // a glow along the horizon
  const hg = ctx.createLinearGradient(0, yH - 30, 0, yH + 4);
  hg.addColorStop(0, 'rgba(70,90,130,0)'); hg.addColorStop(1, 'rgba(70,90,130,0.25)');
  ctx.fillStyle = hg; ctx.fillRect(x0, yH - 30, W, 34);
  const sg = ctx.createLinearGradient(0, yH, 0, H);
  sg.addColorStop(0, '#16223a'); sg.addColorStop(0.2, '#0d1628'); sg.addColorStop(1, '#070c18');
  ctx.fillStyle = sg; ctx.fillRect(x0, yH, W, H - yH + 600);
  ctx.strokeStyle = 'rgba(150,170,210,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, yH); ctx.lineTo(W, yH); ctx.stroke();
  // the moon's path on the water
  const mx = W * 0.82;
  if (mx > x0) for (let i = 0; i < 26; i++) {
    const y = yH + 4 + i * i * 0.6, w = (6 + i * 1.6) * (0.6 + 0.4 * Math.sin(tick * 0.05 + i * 1.7));
    ctx.fillStyle = `rgba(220,226,200,${0.32 - i * 0.01})`; ctx.fillRect(mx - w / 2 + Math.sin(tick * 0.02 + i) * 4, y, w, 1.4);
  }
  // the island, a dark lump on the horizon (seen from the mainland)
  const ix = (14000 - camX) * 0.12 + W * 0.55;
  if (camX < 13000 && ix > x0 - 60) {
    ctx.fillStyle = 'rgba(14,20,26,0.95)';
    ctx.beginPath(); ctx.moveTo(ix - 70, yH + 1); ctx.quadraticCurveTo(ix - 30, yH - 16, ix, yH - 18); ctx.quadraticCurveTo(ix + 40, yH - 14, ix + 80, yH + 1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(14,20,26,0.95)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ix - 4, yH - 17); ctx.quadraticCurveTo(ix - 2, yH - 30, ix + 3, yH - 38); ctx.stroke();
    [-1, 1, 0.3].forEach(d => { ctx.beginPath(); ctx.moveTo(ix + 3, yH - 38); ctx.quadraticCurveTo(ix + 3 + d * 8, yH - 42, ix + 3 + d * 14, yH - 34); ctx.stroke(); });
    if (stormK(camX + W / 2) < 0.2) {          // the storm between you and it, always there
      ctx.fillStyle = 'rgba(30,34,46,0.8)';
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(ix - 160 + i * 34, yH - 40 - (i % 2) * 8, 34, 16, 0, 0, 7); ctx.fill(); }
      if (Math.sin(tick * 0.013) > 0.995) { ctx.fillStyle = 'rgba(220,225,255,0.5)'; ctx.fillRect(ix - 120, yH - 30, 1.5, 28); }
    }
  }
  ctx.restore();
}

// sand over the terrain: the mainland beach, the sea floor, the island (world space)
function drawSand() {
  const x0 = Math.max(9950, camX - 20), x1 = Math.min(WORLD_W, camX + W + 20);
  if (x1 <= x0) return;
  const bottom = Math.max(H + Math.abs(camY), camY + H) + 60;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x0 - camX, bottom);
  for (let x = x0; x <= x1; x += 6) ctx.lineTo(x - camX, groundY(x) - 1);
  ctx.lineTo(x1 - camX, groundY(x1) - 1); ctx.lineTo(x1 - camX, bottom); ctx.closePath();
  const sg = ctx.createLinearGradient(0, seaY() - 60, 0, seaY() + 300);
  sg.addColorStop(0, '#4a4232'); sg.addColorStop(0.2, '#3a3428'); sg.addColorStop(1, '#141820');
  // fade from grass to sand at the bottom of the slope: the sand fades in, strip by strip
  ctx.save(); ctx.clip();
  ctx.fillStyle = sg;
  for (let x = 9950; x < 10120; x += 10) {
    if (x + 10 < camX - 20 || x > camX + W + 20) continue;
    ctx.globalAlpha = Math.min(1, (x - 9950 + 10) / 170); ctx.fillRect(x - camX, 0, 10.5, bottom);
  }
  ctx.globalAlpha = 1; ctx.fillRect(10120 - camX, 0, Math.max(0, W + camX - 10100), bottom);
  ctx.restore();
  // the edge: pale where it's dry
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 6) { const y = groundY(x); x === x0 ? ctx.moveTo(x - camX, y) : ctx.lineTo(x - camX, y); }
  ctx.strokeStyle = 'rgba(170,155,120,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
  // the drop-off into the deep: bare rock
  const dx = 11540 - camX;
  if (dx > -80 && dx < W + 80) {
    ctx.fillStyle = '#1a1c22';
    ctx.beginPath(); ctx.moveTo(dx - 10, groundY(11530)); for (let y = 0; y < 1200; y += 40) ctx.lineTo(dx + 40 + Math.sin(y * 0.05) * 14, groundY(11530) + y); ctx.lineTo(dx + 60, groundY(11530) + 1300); ctx.lineTo(dx - 10, groundY(11530) + 1300); ctx.closePath(); ctx.fill();
  }
  // the island's drop-off below the reef city
  const ix = ISLE_NET_X - camX;
  if (ix > -80 && ix < W + 80) {
    const g0 = groundY(ISLE_NET_X - 10);
    ctx.fillStyle = '#1a1c22';
    ctx.beginPath(); ctx.moveTo(ix + 10, g0); for (let y = 0; y < 1000; y += 40) ctx.lineTo(ix - 30 - Math.sin(y * 0.05) * 14, g0 + y); ctx.lineTo(ix - 60, g0 + 1100); ctx.lineTo(ix + 10, g0 + 1100); ctx.closePath(); ctx.fill();
  }
  // the rocky point at the end of the island
  const rx = 16100 - camX;
  if (rx < W + 50) {
    ctx.fillStyle = '#26262c';
    const g0 = groundY(16100);
    ctx.beginPath(); ctx.moveTo(rx - 30, groundY(16070) + 2);
    [[0, -8], [40, -40], [80, -110], [130, -150], [200, -170], [260, -190]].forEach(([dx2, dy]) => ctx.lineTo(rx + dx2, g0 + dy));
    ctx.lineTo(rx + 300, bottom); ctx.lineTo(rx + 160, bottom); ctx.lineTo(rx + 40, g0 + 40); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,120,130,0.35)'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.restore();
}

// the beach things: driftwood, birch's workshop, the boat (behind the player)
function drawBeachBack() {
  if (camX + W < 9900) return;
  ctx.save();
  const ox = -camX;
  // driftwood + shells
  [[10060, 0.2], [10600, -0.1]].forEach(([x, r]) => {
    if (x > 10400) return;
    ctx.save(); ctx.translate(ox + x, groundY(x) - 3); ctx.rotate(r);
    ctx.strokeStyle = 'rgba(170,160,140,0.75)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.moveTo(10, 0); ctx.lineTo(22, -10); ctx.stroke(); ctx.restore();
  });
  [[10110, '#e8c8b8'], [10285, '#f0e0c8'], [10340, '#e8b8b0']].forEach(([x, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(ox + x, groundY(x) - 1, 3, 2, 0, Math.PI, 0); ctx.fill(); });
  // birch's workshop: a lantern on a pole, a sawhorse, planks
  const lx = ox + 10080, lg = groundY(10080), flick = 0.85 + Math.sin(tick * 0.2) * 0.06;
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(lx - 2, lg - 70, 4, 70); ctx.fillRect(lx - 2, lg - 70, 16, 3);
  ctx.fillStyle = `rgba(255,200,120,${0.95 * flick})`; ctx.beginPath(); ctx.arc(lx + 12, lg - 60, 4, 0, 7); ctx.fill();
  drawGlow(lx + 12, lg - 60, 140, 0.2 * flick);
  const shx = ox + 10300, shy = groundY(10300);
  ctx.strokeStyle = '#5a4026'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(shx - 14, shy); ctx.lineTo(shx - 4, shy - 22); ctx.lineTo(shx + 6, shy); ctx.moveTo(shx - 18, shy - 22); ctx.lineTo(shx + 30, shy - 22); ctx.stroke();
  if (!boat.hull) { ctx.fillStyle = '#7a5a3a'; ctx.fillRect(ox + 10120, groundY(10120) - 6, 50, 5); ctx.fillRect(ox + 10124, groundY(10120) - 11, 44, 5); }
  // the boat, building or afloat
  drawBoatBack();
  // birch (when he's not in the boat)
  if (!boat.ride) {
    const bx = birchX(), wk = !boat.launched && (boat.hammer > 0 || birch.stage === 0 || Math.sin(tick * 0.01) > 0.3);
    drawCritter(bx - camX, groundY(bx), 'beaver', { color: birch.color, dir: wk && !boat.launched ? 1 : faceToward(bx, 1), working: wk, scale: 1.1 });
  }
  // sawdust while he works
  if (boat.hammer > 0 && tick % 6 === 0) east.chips.push({ x: BOAT_BUILD_X + rand(-40, 40), y: groundY(BOAT_BUILD_X) - 30, vx: rand(-1.5, 1.5), vy: rand(-2.5, -0.5), life: 1 });
  ctx.restore();
}

function hullPath(L, Hh) {
  ctx.beginPath();
  ctx.moveTo(-L * 0.5, -Hh); ctx.lineTo(L * 0.58, -Hh - 4);
  ctx.quadraticCurveTo(L * 0.5, 0, L * 0.25, 4); ctx.lineTo(-L * 0.38, 4);
  ctx.quadraticCurveTo(-L * 0.52, 0, -L * 0.5, -Hh); ctx.closePath();
}
function drawBoatBack() {
  const sx = boat.x - camX; if (sx < -200 || sx > W + 200) return;
  const L = 120, Hh = 20, dir = boat.ride ? boat.ride.dir : boat.side === 'island' ? -1 : 1;
  ctx.save(); ctx.translate(sx, boat.y); ctx.rotate(boat.tilt); ctx.scale(dir, 1);
  if (!boat.launched) {   // up on blocks
    ctx.fillStyle = '#3a2a1c'; ctx.fillRect(-40, 4, 18, 12); ctx.fillRect(24, 4, 18, 12);
  }
  // mast + sail
  if (boat.sail) {
    const k = stormK(boat.x), billow = 10 + Math.sin(tick * 0.08) * 3 + k * 6 + (boat.ride ? 6 : 0);
    ctx.strokeStyle = '#5a4026'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -Hh); ctx.lineTo(0, -Hh - 110); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -Hh - 14); ctx.lineTo(-48, -Hh - 14); ctx.stroke();
    ctx.fillStyle = 'rgba(232,224,200,0.92)'; ctx.strokeStyle = 'rgba(170,160,130,0.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(2, -Hh - 106); ctx.quadraticCurveTo(-20 + billow * 0.4, -Hh - 60, -46, -Hh - 16); ctx.lineTo(2, -Hh - 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -Hh - 100); ctx.quadraticCurveTo(26 + billow, -Hh - 60, 6, -Hh - 18); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(180,90,80,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-22, -Hh - 54); ctx.lineTo(-20, -Hh - 18); ctx.stroke();
    const fl = Math.sin(tick * 0.2) * 3;
    ctx.fillStyle = 'rgba(200,110,120,0.9)'; ctx.beginPath(); ctx.moveTo(0, -Hh - 110); ctx.lineTo(-16, -Hh - 106 + fl); ctx.lineTo(0, -Hh - 102); ctx.closePath(); ctx.fill();
  }
  if (!boat.hull) {     // just the keel and ribs
    ctx.strokeStyle = '#6a4a2c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-L * 0.42, 4); ctx.lineTo(L * 0.3, 4); ctx.quadraticCurveTo(L * 0.5, 0, L * 0.58, -Hh - 4); ctx.stroke();
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { const x = i * 20; ctx.beginPath(); ctx.moveTo(x - 4, -Hh + 2); ctx.quadraticCurveTo(x, 6, x + 4, -Hh + 2); ctx.stroke(); }
    ctx.restore(); return;
  }
  // inside of the hull (behind whoever's sitting in it)
  ctx.fillStyle = '#2e2117'; hullPath(L, Hh); ctx.fill();
  // birch, at the tiller, while sailing
  if (boat.ride) { ctx.scale(dir, 1); drawCritter(-40 * dir, -4, 'beaver', { color: birch.color, dir: dir, scale: 1 }); }
  ctx.restore();
}
// the near side of the hull, in front of the passenger
function drawBoatFront() {
  if (!boat.hull) return;
  const sx = boat.x - camX; if (sx < -200 || sx > W + 200) return;
  const L = 120, Hh = 20, dir = boat.ride ? boat.ride.dir : boat.side === 'island' ? -1 : 1;
  ctx.save(); ctx.translate(sx, boat.y); ctx.rotate(boat.tilt); ctx.scale(dir, 1);
  ctx.save(); ctx.beginPath(); ctx.rect(-L, -Hh * 0.55, L * 2, 40); ctx.clip();
  ctx.fillStyle = '#6a4a2c'; hullPath(L, Hh); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(40,28,18,0.6)'; ctx.lineWidth = 1;
  for (let y = -Hh * 0.55 + 6; y < 4; y += 6) { ctx.beginPath(); ctx.moveTo(-L * 0.48, y); ctx.lineTo(L * 0.45, y - 2); ctx.stroke(); }
  ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-L * 0.5, -Hh * 0.55); ctx.lineTo(L * 0.55, -Hh * 0.55 - 3); ctx.stroke();
  ctx.scale(dir, 1);
  ctx.fillStyle = 'rgba(230,210,170,0.8)'; ctx.font = 'italic 8px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText('the maybe', dir * 30, -1);
  ctx.restore();
}

// screen space, in front of everything: the storm out at sea
function drawStorm() {
  const k = stormK(camX + W / 2);
  if (k <= 0.01 && storm.flash < 0.02) return;
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, `rgba(8,10,16,${0.75 * k})`); g.addColorStop(0.5, `rgba(14,18,28,${0.4 * k})`); g.addColorStop(1, `rgba(8,12,20,${0.3 * k})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // heavy clouds
  ctx.fillStyle = `rgba(26,30,40,${0.85 * k})`;
  for (let i = 0; i < 9; i++) { const x = ((i * 190 - camX * 0.3 - tick * 0.6) % (W + 300) + W + 300) % (W + 300) - 150; ctx.beginPath(); ctx.ellipse(x, 20 + (i % 3) * 22, 120, 40, 0, 0, 7); ctx.fill(); }
  // rain, slanting hard
  ctx.strokeStyle = `rgba(170,190,220,${0.35 * k})`; ctx.lineWidth = 1;
  ctx.beginPath();
  const n = Math.floor(160 * k * QUALITY);
  for (let i = 0; i < n; i++) {
    const x = (hash(i * 3.1) * (W + 200) + tick * 9 + i * 7) % (W + 200) - 100, y = (hash(i * 7.7) * H + tick * 22) % H;
    ctx.moveTo(x, y); ctx.lineTo(x - 9, y + 20);
  }
  ctx.stroke();
  if (storm.flash > 0.02) {
    ctx.fillStyle = `rgba(220,228,255,${0.35 * storm.flash})`; ctx.fillRect(0, 0, W, H);
    if (storm.bolt && storm.flash > 0.4) {
      ctx.strokeStyle = `rgba(240,245,255,${storm.flash})`; ctx.lineWidth = 2;
      let x = storm.bolt.x, y = 0; ctx.beginPath(); ctx.moveTo(x, y);
      for (let i = 0; i < 9; i++) { x += (hash(storm.bolt.seed + i) - 0.5) * 50; y += H * 0.07; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }
  ctx.restore();
}
