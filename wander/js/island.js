/* ══════════════════════════════════════════
   THE ISLAND — across the stormy sea, where the chop turns into long,
   gentle surf. rae (a fox, see RAE_KIND in critters.js) surfs here alone.
   · surfing: wear rae's spare board, swim out past the foam, and press
     jump when a wave reaches you. you ride it in to the beach.
   · quests: "catch a wave" (ride three), then "something to toast"
     (marshmallows from marigold's, back on the mainland).
   · palms, rae's driftwood hut, and the bonfire she lights every night.
══════════════════════════════════════════ */
const SURF_X1 = 14935, SURF_X0 = REEF_X - 210, SURF_TAKEOFF = REEF_X - 110, RAE_BEACH_X = 15240, BONFIRE_X = 15340, HUT_X = 15600;
const PALMS = [{ x: 15160, s: 1 }, { x: 15470, s: 1.2 }, { x: 15800, s: 0.95 }, { x: 15960, s: 1.1 }];

const surf = { waves: [], next: 60, rides: 0, sparks: [], toast: 0, spray: [], swash: [], set: 0 };
const rae = makeRegular({ name: 'rae', kind: RAE_KIND, color: '#e09a5c', x: SURF_TAKEOFF, stage: 0, mode: 'wait', wave: null, ashore: false });
OUT_TALKERS.push({ n: rae, at: () => [rae.x, raeY() - 64] });

/* ── surfing ── */
function surfWaveAt(x) { return surf.waves.find(w => Math.abs(w.x - x) < 34 && w.h > 8); }
function trySurfJump() {
  if (!wearing('surfboard') || !player.inWater || player.wx < SURF_X0 + 40 || player.wx > SURF_X1 - 30) return false;
  if (player._py - seaY() > 60) return false;
  const w = surfWaveAt(player.wx);
  if (!w) return false;
  player.surfing = w; w.rider = true;
  player.inWater = false; lake.under = false; player.flipActive = false;
  splashAt(player.wx, 8);
  return true;
}
function updateSurf() {
  const w = player.surfing;
  _vx = 0; player._vx = 0; player.vy = 0; player.onGround = true; player.walkFrame = 0; player.facingRight = true;
  player.wx = w.x - 6; player._py = seaY() - w.h + 3;
  if (w.x >= SURF_X1 - 4) {
    player.surfing = null; w.rider = false;
    player.wx = SURF_X1 + 30; player._py = groundY(player.wx); player.vy = -3; player.onGround = false;
    surf.rides++;
    if (questState.surf === 'open') {
      const n = surf.rides;
      say(rae, ["ONE! that's one! that's a real one!", "TWO! okay, you're getting it. i'm not even surprised. i'm a little surprised.", 'THREE! you did it! come here, come here!'][Math.min(2, n - 1)], true);
      if (n >= 3) { completeQuest('surf'); achieve('surfer'); }
    } else if (Math.random() < 0.5) say(rae, ['nice one!', 'look at you go!', "that's the stuff!"][Math.floor(Math.random() * 3)]);
  }
}

/* ── rae ── */
const RAE_INTRO = [
  "whoa — a BOAT! nobody's ever made it through the storm. hi! i'm rae! did you see that last wave? tell me you saw that last wave.",
  "i've surfed here my whole life. just me and the waves. they're good company. they always come back. that's the best thing about waves.",
  'hey — you wanna try? i have a spare board. it\'s a little dinged. it has character.',
];
const RAE_FLAVOR = [
  "the storm out there is always there. it's why nobody comes. it's also why the waves are so good. i think about that a lot.",
  'birch keeps measuring my hut. i think he\'s planning something.',
  'do the stars look the same where you\'re from? here they look like freckles.',
  "come surf whenever! the waves don't mind who rides them.",
];
function talkToRae() {
  let line;
  if (rae.stage < RAE_INTRO.length) {
    line = RAE_INTRO[rae.stage++];
    if (rae.stage === RAE_INTRO.length) { setTimeout(() => give('surfboard', 'rae'), 900); startQuest('surf'); }
  } else if (questState.surf === 'open') {
    line = surf.rides ? `that's ${surf.rides}! ${3 - surf.rides} more!`
      : ['paddle out past the foam and wait. when a wave lifts you up, JUMP. then just… stay on. staying on is most of it.', "the board's on your back? good. into the water! the water's the important part."][rae.li++ % 2];
  } else if (!questState.bonfire) {
    line = "hey, can i ask a weird thing? birch says on the mainland there's a thing called a marshmallow. you hold it over a fire and it goes golden. i've lit a fire every night for years, and never had anything to toast.";
    startQuest('bonfire');
  } else if (questState.bonfire === 'open') {
    if (hasItem('mallows')) {
      takeItem('mallows'); completeQuest('bonfire'); surf.toast = 1;
      line = 'is that… are those…? okay. OKAY. over to the fire. you hold it above, not in. birch was very clear about that.';
    } else line = "a marshmallow. golden brown. i think about it a lot now. marigold's store, birch says. by a tavern? what's a tavern?";
  } else line = RAE_FLAVOR[rae.li++ % RAE_FLAVOR.length];
  say(rae, line, true);
}
function raeY() {
  if (rae.mode === 'ride' && rae.wave) return seaY() - rae.wave.h + 3;
  if (rae.x < SURF_X1 && rae.mode !== 'ashore') return seaY() + 5;
  return groundY(rae.x);
}

OUT_SPOTS.push(() => {
  if (player.wx < 14400) return null;
  if (rae.ashore && Math.abs(player.wx - rae.x) < 50 && player.onGround && rae.bubbleT < 200) return { text: 'press E to talk to rae', act: talkToRae };
  if (Math.abs(player.wx - BONFIRE_X) < 40) return { text: surf.toast ? 'toasting…' : "rae's bonfire. she lights it every night, just in case." };
  if (Math.abs(player.wx - HUT_X) < 50) return { text: "rae's hut. there's a hammock, and a shelf of very good shells." };
  if (player.inWater && player.wx < SURF_X1 && !wearing('surfboard')) return { text: hasItem('surfboard') ? 'put the surfboard on (I) to catch a wave' : 'long, gentle waves. perfect for surfing, if you had a board.' };
  if (player.inWater && player.wx < SURF_X1 && surfWaveAt(player.wx)) return { text: 'a wave! jump to catch it' };
  return null;
});

/* ══════════════════════════════════════════
   UPDATE
══════════════════════════════════════════ */
function updateIsland() {
  // waves: the swell rises out over the reef city, builds as it feels the crest, steepens, curls,
  // throws its lip just past the crest, and then rolls the rest of the way in as a tumbling wall
  // of whitewash that shrinks as it goes and runs up the sand. they come in sets — a few big ones,
  // then a lull. bigger waves feel the bottom sooner and break a little farther out.
  if (--surf.next <= 0) {
    surf.set = (surf.set + 1) % 5;
    const size = surf.set < 3 ? 0.95 + Math.random() * 0.35 : 0.7 + Math.random() * 0.2;
    surf.waves.push({ x: SURF_X0, bx: REEF_X + 50 - (size - 0.7) * 70, size, h: 3, peak: 3, lip: 0, broken: false, foam: 0, rider: false, ph: Math.random() * 6 });
    surf.next = surf.set < 3 ? 170 + Math.floor(Math.random() * 40) : 320 + Math.floor(Math.random() * 80);
  }
  for (let i = surf.waves.length - 1; i >= 0; i--) {
    const w = surf.waves[i];
    if (!w.bx) w.bx = REEF_X + 30;
    w.x += w.broken ? 1.25 + w.size * 0.45 - Math.max(0, w.x - SURF_X1 + 120) * 0.003 : 1.4 + w.size * 0.55;
    if (!w.broken) {
      const q = Math.max(0, (w.x - SURF_X0) / (w.bx - SURF_X0));
      w.h = w.peak = 3 + w.size * 46 * Math.pow(Math.min(1, q), 1.7);
      w.lip = Math.max(0, Math.min(1, (q - 0.72) / 0.28));
      if (w.lip > 0.5 && Math.random() < 0.8) for (let k = 0; k < 2; k++) surf.spray.push({ x: w.x + 10 + w.lip * 12, y: seaY() - w.h - 2, vx: rand(0.8, 2.8), vy: rand(-2.4, -0.6), life: 1 });
      if (q >= 1) {                                          // the lip pitches over: the wave breaks
        w.broken = true;
        for (let k = 0; k < 26; k++) surf.spray.push({ x: w.x + rand(0, 30), y: seaY() - w.h * rand(0.2, 1), vx: rand(0.5, 3.2), vy: rand(-4, -1), life: 1 });
      }
    } else {
      // a rolling wall of foam: collapses fast from the break, then shrinks steadily toward the sand
      const k = Math.max(0, Math.min(1, (w.x - w.bx) / (SURF_X1 - w.bx)));
      const wall = Math.max(5, w.size * (26 - 17 * k));
      w.h += (wall - w.h) * (w.h > wall + 6 ? 0.06 : 0.1);
      w.lip = Math.max(0, w.lip - 0.04);
      w.foam = Math.min(1, w.foam + 0.06);
      if (Math.random() < 0.35 * (1 - k)) surf.spray.push({ x: w.x + rand(4, 18), y: seaY() - w.h * rand(0.6, 1.1), vx: rand(0.6, 2), vy: rand(-1.8, -0.4), life: 0.8 });
    }
    if (w.x > SURF_X1 + 4 && !w.rider) {
      surf.swash.push({ t: 0, reach: 40 + w.size * 70 });
      surf.waves.splice(i, 1);
    }
  }
  for (let i = surf.spray.length - 1; i >= 0; i--) { const p = surf.spray[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.03; if (p.life <= 0 || p.y > seaY() + 4) surf.spray.splice(i, 1); }
  for (let i = surf.swash.length - 1; i >= 0; i--) { if (++surf.swash[i].t > 150) surf.swash.splice(i, 1); }
  if (player.surfing) { /* updateSurf runs from updatePlayer */ }
  // rae: surfs until you arrive, then comes ashore to say hi. she paddles out again whenever you're surfing.
  const wantSea = !boat.crossed || (rae.stage >= RAE_INTRO.length && (player.inWater || player.surfing) && player.wx < SURF_X1 + 20 && !surf.toast);
  if (rae.mode === 'ride') {
    if (!rae.wave || rae.wave.x >= SURF_X1 - 30) { rae.mode = wantSea ? 'paddle' : 'walk'; rae.wave = null; }
    else rae.x = rae.wave.x + 14;
  } else if (rae.mode === 'paddle') {
    rae.x -= 1.3; if (rae.x < SURF_TAKEOFF) rae.mode = 'wait';
    if (!wantSea) rae.mode = 'walk';
  } else if (rae.mode === 'wait') {
    const w = surf.waves.find(w => Math.abs(w.x - rae.x) < 4 && !w.rider);
    if (w) { rae.mode = 'ride'; rae.wave = w; }
    if (!wantSea && !w) rae.mode = 'walk';
  } else if (rae.mode === 'walk') {
    rae.x += Math.sign(RAE_BEACH_X - rae.x) * (rae.x < SURF_X1 ? 2.6 : 1.6);   // quick paddle in, then a stroll
    if (Math.abs(rae.x - RAE_BEACH_X) < 2) { rae.mode = 'ashore'; rae.x = RAE_BEACH_X; }
  } else if (rae.mode === 'ashore' && wantSea) { rae.mode = 'out'; }
  else if (rae.mode === 'out') { rae.x -= 1.8; if (rae.x < SURF_X1 - 10) rae.mode = 'paddle'; }
  rae.ashore = rae.mode === 'ashore';
  if (rae.mode === 'ashore' && !wantSea) rae.x = RAE_BEACH_X + Math.sin(tick * 0.01) * 6;
  // toasting a marshmallow
  if (surf.toast) {
    surf.toast++;
    if (surf.toast === 300) {
      say(rae, "…oh. oh, that's the best thing i've ever eaten. here — i made this a while ago, for whoever came. you came.", true);
      setTimeout(() => give('shells', 'rae'), 1200); achieve('toasty');
    }
    if (surf.toast > 360) surf.toast = 0;
  }
  if (Math.random() < 0.4 && Math.abs(BONFIRE_X - camX - W / 2) < W) surf.sparks.push({ x: BONFIRE_X + rand(-6, 6), y: groundY(BONFIRE_X) - 14, vx: rand(-0.3, 0.3) + weather.wind * 0.2, vy: rand(-1.4, -0.6), life: 1 });
  for (let i = surf.sparks.length - 1; i >= 0; i--) { const p = surf.sparks[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.02; if (p.life <= 0) surf.sparks.splice(i, 1); }
}

/* ══════════════════════════════════════════
   DRAW
══════════════════════════════════════════ */
function drawPalm(x, s) {
  const sx = x - camX, gy = groundY(x), sw = Math.sin(tick * 0.015 + x) * 3 + weather.wind * 5;
  ctx.strokeStyle = '#3a2c20'; ctx.lineWidth = 7 * s; ctx.lineCap = 'round';
  const tx = sx + 26 * s + sw, ty = gy - 150 * s;
  ctx.beginPath(); ctx.moveTo(sx, gy); ctx.quadraticCurveTo(sx + 2 * s, gy - 90 * s, tx, ty); ctx.stroke();
  ctx.strokeStyle = 'rgba(80,62,44,0.6)'; ctx.lineWidth = 1;
  for (let i = 1; i < 9; i++) { const t = i / 9, px = sx + (tx - sx) * t * t, py = gy + (ty - gy) * t; ctx.beginPath(); ctx.moveTo(px - 3 * s, py); ctx.lineTo(px + 3 * s, py - 2); ctx.stroke(); }
  ctx.strokeStyle = '#1c3020'; ctx.lineWidth = 3 * s;
  [[-1, 0.2], [-0.6, -0.4], [0, -0.7], [0.6, -0.4], [1, 0.2], [0.3, 0.5], [-0.3, 0.5]].forEach(([dx, dy], i) => {
    const ex = tx + dx * 60 * s + sw * 0.6, ey = ty + dy * 26 * s + 22 * s;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + dx * 34 * s, ty + dy * 40 * s - 14 * s, ex, ey); ctx.stroke();
  });
  ctx.fillStyle = '#4a3a24'; [[-4, 6], [4, 7], [0, 10]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(tx + dx * s, ty + dy * s, 4 * s, 0, 7); ctx.fill(); });
}
function drawWave(w) {
  const sx = w.x - camX, wy = seaY(), h = w.h, S = w.size;
  if (sx < -160 || sx > W + 120 || h < 2) return;
  const back = 80 + S * 60, lip = w.lip, over = lip * 16 * S;
  // the body: a long gentle back, a steep (sometimes hollow) face
  const g = ctx.createLinearGradient(0, wy - h, 0, wy + 4);
  g.addColorStop(0, 'rgba(70,160,175,0.95)'); g.addColorStop(0.45, 'rgba(36,104,130,0.95)'); g.addColorStop(1, 'rgba(22,66,96,0.9)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(sx - back, wy + 2);
  ctx.bezierCurveTo(sx - back * 0.5, wy + 1, sx - back * 0.25, wy - h * 0.75, sx - 4, wy - h);       // the back
  ctx.quadraticCurveTo(sx + 6 + over * 0.6, wy - h - 3, sx + 6 + over, wy - h + 6 + lip * 8);          // over the top, out to the lip
  ctx.quadraticCurveTo(sx + 2 + over * 0.3, wy - h * 0.55, sx + 12 + (1 - lip) * 14, wy + 2);         // down the face
  ctx.closePath(); ctx.fill();
  // the hollow under the lip (the barrel)
  if (lip > 0.25 && !w.broken) {
    ctx.fillStyle = `rgba(10,30,50,${0.5 * lip})`;
    ctx.beginPath(); ctx.ellipse(sx + 6 + over * 0.5, wy - h * 0.45, 4 + over * 0.35, h * 0.32, 0.2, 0, 7); ctx.fill();
  }
  // light on the face, streaks on the back
  ctx.strokeStyle = 'rgba(170,230,235,0.35)'; ctx.lineWidth = 1;
  for (let k = 0; k < 3; k++) {
    const y = wy - h * (0.3 + k * 0.2);
    ctx.beginPath(); ctx.moveTo(sx - back * (0.35 - k * 0.08), y + h * 0.15); ctx.quadraticCurveTo(sx - back * 0.12, y - 2 + Math.sin(tick * 0.1 + k + w.ph) * 1.5, sx - 2, y + 2); ctx.stroke();
  }
  // the white lip feathering off the crest
  ctx.strokeStyle = `rgba(240,248,250,${0.45 + lip * 0.5})`; ctx.lineWidth = 2 + lip * 2;
  ctx.beginPath(); ctx.moveTo(sx - 26 * S, wy - h * 0.86); ctx.quadraticCurveTo(sx + over * 0.4, wy - h - 4, sx + 6 + over, wy - h + 6 + lip * 8); ctx.stroke();
  // broken: a tumbling wall of whitewash rolling in front, churned foam trailing behind
  if (w.broken) {
    const f = w.foam, wall = Math.max(h, 6), fw = 26 + 30 * S;
    // the churned wake: patchy foam lying on the water behind the wall
    for (let k = 0; k < 16; k++) {
      const fx = sx - 18 - k * 11 - hash(k * 2.3 + w.ph) * 6 + Math.sin(tick * 0.04 + k) * 2;
      ctx.fillStyle = `rgba(225,238,242,${0.4 * f * (1 - k / 16)})`;
      ctx.beginPath(); ctx.ellipse(fx, wy - 0.5 + hash(k * 5.1) * 1.5, 7 - k * 0.3, 1.6, 0, 0, 7); ctx.fill();
    }
    // the wall itself: a stack of tumbling blobs from the waterline up to the crest
    const n = 34;
    for (let k = 0; k < n; k++) {
      const r = hash(k * 1.37 + w.ph), t = Math.floor(tick / 5);
      const fx = sx - fw * 0.7 + r * fw + Math.sin(tick * 0.25 + k * 1.7 + w.ph) * 2.5;
      const up = hash(k + t * 0.61) * (0.35 + 0.65 * (1 - Math.abs(r - 0.6)));
      const fy = wy + 1 - wall * up - 1;
      ctx.fillStyle = `rgba(${236 + 10 * hash(k * 9.1)},247,250,${(0.55 + 0.35 * hash(k * 3.1 + t)) * f})`;
      ctx.beginPath(); ctx.arc(fx, fy, (2 + hash(k * 7.7) * 3.5) * Math.min(1.3, 0.6 + wall / 20), 0, 7); ctx.fill();
    }
    // a bright frothy cap rolling over the front
    ctx.strokeStyle = `rgba(250,253,255,${0.8 * f})`; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(sx - fw * 0.6, wy - wall * 0.55);
    ctx.quadraticCurveTo(sx, wy - wall - 3 + Math.sin(tick * 0.3 + w.ph) * 1.5, sx + fw * 0.35, wy - wall * 0.2); ctx.stroke();
    // the leading edge: a thin line of fizz pushed out ahead
    ctx.fillStyle = `rgba(240,248,250,${0.5 * f})`;
    ctx.beginPath(); ctx.ellipse(sx + fw * 0.35 + 6, wy, 9, 1.4, 0, 0, 7); ctx.fill();
  }
}
// spray thrown off the lips, and the swash running up the sand and back
function drawSurfSpray() {
  const ox = -camX;
  surf.spray.forEach(p => { ctx.fillStyle = `rgba(240,248,250,${p.life * 0.85})`; ctx.fillRect(ox + p.x, p.y, 2, 2); });
  surf.swash.forEach(sw => {
    const k = sw.t / 150, up = Math.sin(Math.min(1, k * 1.6) * Math.PI / 2) * (k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4 * 0.9);
    const x0 = SURF_X1 - 30, x1 = x0 + sw.reach * up;
    if (x1 - camX < -20 || x0 - camX > W + 20) return;
    ctx.fillStyle = `rgba(200,225,235,${0.35 * (1 - k)})`;
    ctx.beginPath(); ctx.moveTo(ox + x0, groundY(x0) - 1);
    for (let x = x0; x <= x1; x += 6) ctx.lineTo(ox + x, groundY(x) - 2.5);
    for (let x = x1; x >= x0; x -= 6) ctx.lineTo(ox + x, groundY(x) + 0.5);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(240,248,250,${0.7 * (1 - k)})`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(ox + x1, groundY(x1) - 1.5, 2, 0, 7); ctx.stroke();
  });
}
function drawSurfboardAt(x, y, k) {
  ctx.fillStyle = 'rgba(240,220,170,0.95)'; ctx.strokeStyle = 'rgba(170,140,100,0.9)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(x, y, 24 * k, 3.5 * k, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(80,150,180,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 20 * k, y); ctx.lineTo(x + 20 * k, y); ctx.stroke();
}

// behind the player
function drawIslandBack() {
  if (camX + W < SURF_X0 - 180) return;
  const ox = -camX;
  ctx.save();
  // rae's hut: driftwood walls, a thatch of palm leaves, a hammock
  const hx = ox + HUT_X, hg = groundY(HUT_X);
  ctx.fillStyle = '#4a3c2c'; ctx.fillRect(hx - 50, hg - 70, 100, 70);
  ctx.strokeStyle = 'rgba(150,130,100,0.4)'; ctx.lineWidth = 1;
  for (let y = hg - 64; y < hg; y += 9) { ctx.beginPath(); ctx.moveTo(hx - 50, y); ctx.lineTo(hx + 50, y + (y % 2)); ctx.stroke(); }
  ctx.fillStyle = '#2a2014'; ctx.fillRect(hx - 14, hg - 46, 28, 46);
  ctx.fillStyle = 'rgba(255,200,130,0.4)'; ctx.fillRect(hx + 22, hg - 50, 16, 14);
  ctx.fillStyle = '#4a5a30';
  ctx.beginPath(); ctx.moveTo(hx - 70, hg - 64); ctx.lineTo(hx, hg - 112); ctx.lineTo(hx + 70, hg - 64); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(30,40,20,0.6)';
  for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(hx, hg - 110); ctx.lineTo(hx + i * 11, hg - 62); ctx.stroke(); }
  // a hammock strung to the palm
  ctx.strokeStyle = 'rgba(220,200,160,0.75)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(hx + 50, hg - 44); ctx.quadraticCurveTo(hx + 110, hg - 6 + Math.sin(tick * 0.03) * 3, ox + 15800 - 2, groundY(15800) - 46); ctx.stroke();
  // palms
  PALMS.forEach(p => { if (p.x - camX > -150 && p.x - camX < W + 150) drawPalm(p.x, p.s); });
  // rae's board stuck in the sand when she's ashore
  if (rae.ashore) {
    ctx.save(); ctx.translate(ox + RAE_BEACH_X - 30, groundY(RAE_BEACH_X - 30)); ctx.rotate(-0.15);
    ctx.fillStyle = 'rgba(230,140,90,0.95)'; ctx.beginPath(); ctx.ellipse(0, -26, 6, 28, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(250,240,220,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(0, 0); ctx.stroke(); ctx.restore();
  }
  // the bonfire
  const bx = ox + BONFIRE_X, bg = groundY(BONFIRE_X), fl = 0.8 + Math.sin(tick * 0.3) * 0.1 + Math.sin(tick * 0.71) * 0.08;
  drawGlow(bx, bg - 14, 200, 0.22 * fl, [255, 160, 80]);
  ctx.fillStyle = '#5a5048'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(bx - 18 + i * 6, bg - 2, 4, 3, 0, 0, 7); ctx.fill(); }
  ctx.strokeStyle = '#4a3420'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(bx - 14, bg - 2); ctx.lineTo(bx + 10, bg - 14); ctx.moveTo(bx + 14, bg - 2); ctx.lineTo(bx - 10, bg - 14); ctx.stroke();
  [[0, 24, 'rgba(255,140,60,0.85)'], [3, 16, 'rgba(255,200,90,0.9)'], [-3, 10, 'rgba(255,240,180,0.9)']].forEach(([dx, h, c], i) => {
    ctx.fillStyle = c; const hh = h * fl + Math.sin(tick * 0.4 + i) * 3;
    ctx.beginPath(); ctx.moveTo(bx + dx - 9 + i * 2, bg - 6); ctx.quadraticCurveTo(bx + dx - 6, bg - 6 - hh * 0.6, bx + dx + Math.sin(tick * 0.2 + i) * 2, bg - 6 - hh); ctx.quadraticCurveTo(bx + dx + 6, bg - 6 - hh * 0.6, bx + dx + 9 - i * 2, bg - 6); ctx.closePath(); ctx.fill();
  });
  surf.sparks.forEach(p => { ctx.fillStyle = `rgba(255,190,100,${p.life})`; ctx.fillRect(ox + p.x, p.y, 1.6, 1.6); });
  // dune grass
  ctx.strokeStyle = 'rgba(120,140,80,0.7)'; ctx.lineWidth = 1;
  for (let x = 15060; x < 16080; x += 37) {
    if (x - camX < -20 || x - camX > W + 20 || Math.abs(x - BONFIRE_X) < 40 || Math.abs(x - HUT_X) < 60) continue;
    const g = groundY(x), sw = Math.sin(tick * 0.03 + x) * 2 + weather.wind * 3;
    for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(ox + x + k * 3, g); ctx.quadraticCurveTo(ox + x + k * 4, g - 8, ox + x + k * 6 + sw, g - 14 - hash(x + k) * 6); ctx.stroke(); }
  }
  // the waves, and rae on them
  surf.waves.forEach(drawWave);
  drawSurfSpray();
  const ry = raeY();
  if (rae.x - camX > -60 && rae.x - camX < W + 60) {
    const inSurf = rae.mode !== 'ashore' && rae.mode !== 'walk' && rae.x < SURF_X1;
    if (inSurf) drawSurfboardAt(ox + rae.x, ry + 1, 0.9);
    if (rae.mode === 'paddle' || rae.mode === 'wait') {       // lying on her board, bobbing
      ctx.save(); ctx.translate(ox + rae.x, ry - 2 + Math.sin(tick * 0.05) * 1.5); ctx.rotate(Math.PI / 2 * (rae.mode === 'paddle' ? -0.9 : -0.75));
      drawCritter(0, 0, rae.kind, { color: rae.color, dir: 1, scale: 0.8 }); ctx.restore();
    } else drawCritter(ox + rae.x, ry, rae.kind, { color: rae.color, dir: rae.mode === 'ride' ? 1 : faceToward(rae.x, -1), scale: 1.05 });
    // toasting: a stick held out over the fire with a marshmallow going golden
    if (surf.toast) {
      const k = Math.min(1, surf.toast / 260);
      ctx.strokeStyle = 'rgba(120,90,60,0.9)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ox + rae.x + 10, ry - 22); ctx.lineTo(bx - 4, bg - 34); ctx.stroke();
      ctx.fillStyle = `rgb(${250 - k * 40},${245 - k * 95},${235 - k * 170})`; ctx.beginPath(); ctx.ellipse(bx - 3, bg - 35, 4, 3, 0, 0, 7); ctx.fill();
    }
  }
  // you, on your board
  if (player.surfing) drawSurfboardAt(player.wx - camX, player._py + 1, 1);
  else if (wearing('surfboard') && player.inWater && player.wx > SURF_X0 - 20 && player.wx < SURF_X1) drawSurfboardAt(player.wx - camX + 4, Math.max(seaY() + 2, player._py - 10), 0.9);
  ctx.restore();
}
