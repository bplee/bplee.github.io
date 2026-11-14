/* ══════════════════════════════════════════
   THE OBSERVATORY — way up a hill at the east end of the woods
     · the hill is solid ground (part of groundY). It's tall enough that the
       observatory is out of sight from below; the camera climbs with you.
     · its far side drops off a little cliff (double-jumpable) with a cave
       mouth at the bottom — see cavern.js
     · nova, a raccoon astronomer (rosco's cousin), asks you to find the four
       constellations she's charted, and later about the cave
     · the telescope opens a full-screen sky you can pan with the arrow keys;
       the weather gets in the way (clouds, fog, rain on the lens…)
══════════════════════════════════════════ */
const OBS_X   = 6330;  // observatory tower center
const NOVA_X  = 300;   // nova works inside the observatory now (room x, see observatory_inside.js)

// how high the plateau is: always above the top of the screen when you're on the ground
function hillTopPx() { return Math.max(560, H * 0.95); }
// hill profile: [worldX, fraction of the top height, + absolute px]
const HILL_PTS = [
  [5120, 0, 0], [5300, 0.14, 0], [5400, 0.18, 0],          // a gentle start, then a little landing
  [5640, 0.5, 0], [5740, 0.54, 0],                          // steeper, then another landing
  [5980, 0.92, 0], [6060, 1, 0], [6560, 1, 0],              // up to the plateau
  [6700, 0.8, 0], [6850, 0.5, 0], [6960, 0, 170],           // down the far side
  [7060, 0, 130], [7072, 0, 0],                             // …and off a little cliff (double-jump height)
];
function hillH(x) {
  const P = HILL_PTS;
  if (x <= P[0][0] || x >= P[P.length - 1][0]) return 0;
  const top = hillTopPx();
  for (let i = 0; i < P.length - 1; i++) {
    const [x1, f1, a1] = P[i], [x2, f2, a2] = P[i + 1];
    if (x >= x1 && x <= x2) {
      const t = (x - x1) / (x2 - x1);
      return (f1 + (f2 - f1) * t) * top + a1 + (a2 - a1) * t;
    }
  }
  return 0;
}

/* ══════════════════════════════════════════
   NOVA + THE STAR CHART
══════════════════════════════════════════ */
const nova = makeRegular({ name: 'nova', kind: 'raccoon', color: '#a0a0b0', x: NOVA_X, talkR: 50, stage: 0 });
const NOVA_FLAVOR = [
  "the stars don't care where you're going. they just like that you're looking.",
  "i named a comet after my favourite snack. it's called 'peanut'.",
  'rosco says i spend too much time up here. rosco lives in a tavern.',
  "every night the sky is a little different. so are you, probably.",
];

// sky map for the telescope (sky coords)
const SKY_W = 2400, SKY_H = 1400;
const SKY_STARS = Array.from({ length: 480 }, () => ({
  x: Math.random() * SKY_W, y: Math.random() * SKY_H, r: 0.4 + Math.random() * 1.3, ph: Math.random() * 6, sp: 0.5 + Math.random(),
  tint: Math.random() < 0.15 ? (Math.random() < 0.5 ? '255,210,170' : '180,200,255') : '255,252,240',
}));
const CONSTELLATIONS = [
  { name: "the gecko's mug", cx: 500, cy: 400,
    stars: [[460, 360], [540, 360], [545, 440], [455, 440], [548, 378], [578, 398], [548, 420]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6]] },
  { name: 'the big ladle', cx: 1510, cy: 320,
    stars: [[1400, 280], [1450, 300], [1500, 292], [1550, 322], [1562, 372], [1622, 378], [1616, 324]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  { name: 'the sleeping toad', cx: 910, cy: 990,
    stars: [[840, 1000], [880, 962], [940, 962], [980, 1000], [940, 1032], [880, 1032], [868, 940], [952, 940]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 6], [2, 7]] },
  { name: 'a mouse, wandering', cx: 1920, cy: 1045, secret: true,
    stars: [[1840, 1060], [1880, 1030], [1940, 1030], [1980, 1060], [1930, 1082], [1870, 1082], [1862, 1004], [1898, 1000], [2010, 1050], [2050, 1075]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 6], [1, 7], [3, 8], [8, 9]] },
];
CONSTELLATIONS.forEach(c => { c.progress = 0; c.found = false; });

const obs = {
  viewing: false, vx: 1200, vy: 700, comet: 0, smoke: [],
};

// only a clear night (or a falling-star night, which is clear too) lets you see anything;
// rain, storms, snow, fog, wind, petals and frogs all bring a deck of cloud over the sky
const SKY_CLEAR = { clear: true, stars: true };
function skyHidden() {
  const a = weather.amt;
  let m = 0;
  for (const k in a) if (!SKY_CLEAR[k]) m = Math.max(m, a[k] || 0);
  return Math.min(1, m);
}
const HIDDEN_LINE = {
  rain:   'rain clouds, all the way across.',
  storm:  'a thunderstorm, end to end.',
  snow:   'heavy snow clouds over everything.',
  fog:    "fog on the glass. you can't see a thing.",
  wind:   'the wind is dragging cloud across the whole sky.',
  petals: 'a petal shower, under a sheet of cloud.',
  frogs:  '…there is a frog sitting on the lens.',
};

function foundCount() { return CONSTELLATIONS.filter(c => c.found).length; }

function talkToNova() {
  const n = foundCount();
  let line;
  if (nova.stage === 0)      { line = "oh! a visitor! i'm nova. rosco's cousin. the clever one."; nova.stage = 1; }
  else if (nova.stage === 1) { line = "i've charted four constellations. can you find them? use the telescope — arrow keys to look around."; nova.stage = 2; startQuest('stars'); }
  else if (n === 4 && nova.stage < 3) { line = "all four! even the mouse. …wait. it looks a lot like you. here — keep my chart."; nova.stage = 3;
                                        completeQuest('stars'); setTimeout(() => give('chart', 'nova'), 800); }
  else if (questState.report === 'open' && caveState.seenPool) {
    line = "a whole LAKE under my hill?? glowing roots? i'm putting it on the map. i'm naming it after you.";
    completeQuest('report');
  }
  else if (!caveState.dug && hasItem('shovel') && !questState.dig && !questState.shovel) {
    line = "see that glow down the far side of the hill? there's a cave. oh — you've got a shovel! go on, dig it open.";
    startQuest('dig');
  }
  else if (!questState.shovel && !hasItem('shovel')) {
    line = "see that glow down the far side of the hill? there's a cave. i'd dig in myself, but my cousin rosco borrowed my shovel. typical.";
    startQuest('shovel');
  }
  else if (questState.dig === 'open') line = 'the cave is at the bottom of the far side, under the little cliff. dig carefully.';
  else if (questState.report === 'open') line = "well? what's down there? go look!";
  else if (skyHidden() > 0.5 && nova.stage >= 2 && Math.random() < 0.6) line = "no stars tonight, not through all that. the weather always turns, though. come back.";
  else if (cloudiness() > 0.6 && Math.random() < 0.5) line = 'clouds. the natural enemy of astronomy. try a nap at the tavern?';
  else if (nova.stage === 2) line = n ? `${n} of 4 so far. ${n === 3 ? "the last one's shy. look low and to the east." : 'keep looking!'}` : 'the telescope is right there. go on!';
  else line = NOVA_FLAVOR[nova.li++ % NOVA_FLAVOR.length];
  say(nova, line, true);
}

function nearScope() { return scene === 'observatory' && Math.abs(player.wx - OBS_SCOPE_X) < 50; }
function nearNova()  { return scene === 'observatory' && Math.abs(player.wx - nova.x) < nova.talkR; }

// outside: the door into the tower
function observatoryPopup() {
  if (nearObsDoor()) return 'the observatory · press E to step inside';
  return null;
}

function openTelescope()  { obs.viewing = true; hideJoinPrompt(); }
function closeTelescope() { obs.viewing = false; }

window.addEventListener('keydown', e => {
  if (e.repeat || transitioning || !started) return;
  if (obs.viewing) {
    if (e.code === 'KeyE' || e.code === 'Escape') closeTelescope();
    return;
  }
  if (e.code !== 'KeyE') return;
  if (scene === 'outside') { if (nearObsDoor()) enterObservatory(); return; }
  if (scene !== 'observatory') return;
  if (nearObsExit()) exitObservatory();
  else if (nearScope()) openTelescope();
  else if (nearNova()) talkToNova();
});

/* ══════════════════════════════════════════
   UPDATE
══════════════════════════════════════════ */
// outside: just the stove-pipe smoke (nova + the telescope are inside, see observatory_inside.js)
function updateObservatory() {
  if (tick % 22 === 0) obs.smoke.push({ x: OBS_X - 56, y: groundY(OBS_X) - 172, r: 3, a: 0.25 });
  for (let i = obs.smoke.length - 1; i >= 0; i--) {
    const s = obs.smoke[i]; s.y -= 0.4; s.x += 0.1 + weather.wind * 0.5; s.r += 0.06; s.a -= 0.003;
    if (s.a <= 0) obs.smoke.splice(i, 1);
  }
}

function updateTelescope() {
  const sp = 6;
  if (keys['ArrowLeft']  || keys['KeyA']) obs.vx -= sp;
  if (keys['ArrowRight'] || keys['KeyD']) obs.vx += sp;
  if (keys['ArrowUp']    || keys['KeyW']) obs.vy -= sp;
  if (keys['ArrowDown']  || keys['KeyS']) obs.vy += sp;
  obs.vx = Math.max(0, Math.min(SKY_W, obs.vx));
  obs.vy = Math.max(0, Math.min(SKY_H, obs.vy));
  obs.comet = (obs.comet + 0.6) % (SKY_W + 400);

  const hidden = skyHidden();
  // bad weather: nothing to see, so nothing to chart
  const seeing = (hidden > 0.02 || !SKY_CLEAR[weather.type]) ? 0 : 1 - cloudiness() * 0.85;
  CONSTELLATIONS.forEach(c => {
    if (c.found) return;
    const d = Math.hypot(c.cx - obs.vx, c.cy - obs.vy);
    if (d < 110) c.progress += seeing / 50; else c.progress = Math.max(0, c.progress - 0.02);
    if (c.progress >= 1) {
      c.found = true;
      notify('found', `${c.name}  (${foundCount()}/4)`, null, 'a constellation');
      if (foundCount() === 4) achieve('stargazer');
    }
  });
}

/* ══════════════════════════════════════════
   DRAW — the hill + observatory (behind the player)
══════════════════════════════════════════ */
function drawHill() {
  // a little sign at the foot of the hill
  const sx = 5165 - camX, gy = groundY(5165);
  if (sx < -60 || sx > W + 60) return;
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(sx - 1.5, gy - 40, 3, 40); ctx.fillRect(sx - 32, gy - 46, 64, 14);
  ctx.fillStyle = 'rgba(230,205,160,0.85)'; ctx.font = '8px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText('observatory ↑', sx, gy - 36);
}

function drawObservatory() {
  const sx = OBS_X - camX;
  if (sx < -260 || sx > W + 260) return;
  const base = groundY(OBS_X);
  const flick = 0.85 + Math.sin(tick * 0.2) * 0.05 + Math.sin(tick * 0.47) * 0.04;
  const TW = 75, TH = 140, DR = 82;   // tower half-width, tower height, dome radius
  const top = base - TH;
  ctx.save();

  obs.smoke.forEach(s => { ctx.fillStyle = `rgba(150,150,160,${s.a})`; ctx.beginPath(); ctx.arc(s.x - camX, s.y, s.r, 0, 7); ctx.fill(); });

  // stove pipe, then the tower (stone blocks)
  ctx.fillStyle = '#4a4440'; ctx.fillRect(sx - 62, top - 32, 12, 40); ctx.fillRect(sx - 65, top - 35, 18, 5);
  ctx.fillStyle = '#2a2622'; ctx.fillRect(sx - TW, top, TW * 2, TH);
  ctx.strokeStyle = 'rgba(150,140,120,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(sx - TW, top, TW * 2, TH);
  ctx.strokeStyle = 'rgba(90,85,75,0.4)';
  for (let y = top + 16, row = 0; y < base; y += 16, row++) {
    ctx.beginPath(); ctx.moveTo(sx - TW, y); ctx.lineTo(sx + TW, y); ctx.stroke();
    for (let x = -TW + (row % 2) * 15; x < TW; x += 30) { ctx.beginPath(); ctx.moveTo(sx + x, y - 16); ctx.lineTo(sx + x, y); ctx.stroke(); }
  }
  // a little balcony ring at the top of the tower
  ctx.fillStyle = '#3a3430'; ctx.fillRect(sx - TW - 8, top - 6, TW * 2 + 16, 8);
  ctx.strokeStyle = 'rgba(170,160,140,0.6)';
  for (let x = -TW - 6; x <= TW + 6; x += 12) { ctx.beginPath(); ctx.moveTo(sx + x, top - 6); ctx.lineTo(sx + x, top - 20); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(sx - TW - 8, top - 20); ctx.lineTo(sx + TW + 8, top - 20); ctx.stroke();

  // dome — the slit drifts as the dome slowly turns, the big telescope inside sweeps with it
  const dy = top - 6, slit = Math.sin(tick * 0.003) * 38;
  const dg = ctx.createLinearGradient(sx - DR, 0, sx + DR, 0);
  dg.addColorStop(0, '#4a5460'); dg.addColorStop(0.65, '#6a7684'); dg.addColorStop(1, '#4e5866');
  ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(sx, dy, DR, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(150,165,180,0.45)';
  for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(sx, dy, Math.abs(k) * 13 + 1, DR, 0, Math.PI, 0); ctx.stroke(); }
  ctx.save(); ctx.beginPath(); ctx.arc(sx, dy, DR, Math.PI, 0); ctx.clip();
  ctx.fillStyle = '#0b0d14'; ctx.fillRect(sx + slit - 13, dy - DR - 4, 26, DR + 4);
  ctx.restore();
  ctx.save(); ctx.translate(sx + slit, dy - 30); ctx.rotate(-1.05 + Math.sin(tick * 0.004) * 0.12);
  ctx.fillStyle = '#b08848'; ctx.fillRect(-10, -7, 92, 14); ctx.fillStyle = '#d8b068'; ctx.fillRect(76, -9, 12, 18);
  ctx.fillStyle = '#8a6a3a'; ctx.fillRect(10, -8, 6, 16);
  ctx.restore();
  if (weather.snowCover > 0.05) {
    ctx.strokeStyle = `rgba(235,240,248,${0.3 + weather.snowCover * 0.6})`; ctx.lineWidth = 3 + weather.snowCover * 7;
    ctx.beginPath(); ctx.arc(sx, dy, DR, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  }
  // weather vane, spinning with the wind
  ctx.strokeStyle = 'rgba(200,180,120,0.9)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(sx, dy - DR); ctx.lineTo(sx, dy - DR - 26); ctx.stroke();
  const vane = Math.cos(tick * (0.01 + Math.abs(weather.wind) * 0.04)) * 14;
  ctx.beginPath(); ctx.moveTo(sx - vane, dy - DR - 22); ctx.lineTo(sx + vane, dy - DR - 22); ctx.stroke();
  ctx.fillStyle = 'rgba(200,180,120,0.9)'; ctx.beginPath(); ctx.moveTo(sx + vane, dy - DR - 22); ctx.lineTo(sx + vane - Math.sign(vane || 1) * 6, dy - DR - 26); ctx.lineTo(sx + vane - Math.sign(vane || 1) * 6, dy - DR - 18); ctx.fill();
  ctx.beginPath(); ctx.arc(sx, dy - DR - 28, 2.5, 0, 7); ctx.fill();

  // arched door with warm light, round windows
  ctx.fillStyle = '#3a2a1c'; ctx.beginPath(); ctx.moveTo(sx - 42, base); ctx.lineTo(sx - 42, base - 62); ctx.arc(sx - 22, base - 62, 20, Math.PI, 0); ctx.lineTo(sx - 2, base); ctx.fill();
  ctx.strokeStyle = 'rgba(120,95,65,0.9)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(220,180,110,0.9)'; ctx.beginPath(); ctx.arc(sx - 9, base - 40, 2.2, 0, 7); ctx.fill();
  ctx.fillStyle = `rgba(255,190,110,${0.18 * flick})`; ctx.fillRect(sx - 42, base - 2, 40, 2);
  [[sx + 36, base - 80, 15], [sx + 36, base - 30, 10]].forEach(([wx, wy, r]) => {
    ctx.fillStyle = `rgba(255,190,110,${0.6 * flick})`; ctx.beginPath(); ctx.arc(wx, wy, r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#4a3522'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(wx - r, wy); ctx.lineTo(wx + r, wy); ctx.moveTo(wx, wy - r); ctx.lineTo(wx, wy + r); ctx.stroke();
    drawGlow(wx, wy, r * 4, 0.14 * flick);
  });
  // lamp by the door
  ctx.fillStyle = `rgba(255,200,120,${0.95 * flick})`; ctx.beginPath(); ctx.arc(sx - 54, base - 60, 4, 0, 7); ctx.fill();
  drawGlow(sx - 54, base - 60, 40, 0.25 * flick);
  ctx.fillStyle = 'rgba(230,205,160,0.6)'; ctx.font = '9px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText('observatory', sx, top + 22);

  // the door glows when you're close enough to go in
  if (nearObsDoor()) { ctx.strokeStyle = 'rgba(255,200,130,0.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx - 42, base); ctx.lineTo(sx - 42, base - 62); ctx.arc(sx - 22, base - 62, 20, Math.PI, 0); ctx.lineTo(sx - 2, base); ctx.stroke(); }
  ctx.restore();
}

function drawObservatoryBack() { drawHill(); drawObservatory(); }

function drawObservatoryFront() {}   // (nova's bubble is drawn inside now)

/* ══════════════════════════════════════════
   DRAW — looking through the telescope
══════════════════════════════════════════ */
function drawTelescopeView() {
  if (!obs.viewing) return;
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.42;
  const ox = cx - obs.vx, oy = cy - obs.vy; // sky → screen
  const a = weather.amt;

  ctx.save();
  ctx.fillStyle = '#030406'; ctx.fillRect(0, 0, W, H);
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();

  const sg = ctx.createRadialGradient(cx, cy, 10, cx, cy, R);
  sg.addColorStop(0, '#101a33'); sg.addColorStop(1, '#060912');
  ctx.fillStyle = sg; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

  // in bad weather the clouds take over completely: no stars, no constellations, no lines
  const hid = skyHidden();
  const starA = Math.max(0, Math.min(1, 1 - hid * 2));
  const cloudA = Math.max(0, Math.min(1, hid * 2));
  if (starA > 0) {
  ctx.save(); ctx.globalAlpha = starA;
  // milky band
  const mg = ctx.createLinearGradient(ox + 0, oy + 1400, ox + 2400, oy + 0);
  mg.addColorStop(0.35, 'rgba(160,170,220,0)'); mg.addColorStop(0.5, 'rgba(160,170,220,0.08)'); mg.addColorStop(0.65, 'rgba(160,170,220,0)');
  ctx.fillStyle = mg; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

  const t = tick * 0.02;
  SKY_STARS.forEach(s => {
    const x = ox + s.x, y = oy + s.y;
    if (Math.abs(x - cx) > R + 4 || Math.abs(y - cy) > R + 4) return;
    ctx.fillStyle = `rgba(${s.tint},${0.45 + 0.35 * Math.sin(t * s.sp + s.ph)})`;
    ctx.beginPath(); ctx.arc(x, y, s.r, 0, 7); ctx.fill();
  });

  // constellations: brighter stars always; lines fade in as you study them
  CONSTELLATIONS.forEach(con => {
    const la = con.found ? 0.65 : con.progress * 0.5;
    if (la > 0.01) {
      ctx.strokeStyle = `rgba(180,210,255,${la})`; ctx.lineWidth = 1;
      ctx.beginPath(); con.lines.forEach(([i, j]) => { ctx.moveTo(ox + con.stars[i][0], oy + con.stars[i][1]); ctx.lineTo(ox + con.stars[j][0], oy + con.stars[j][1]); }); ctx.stroke();
    }
    con.stars.forEach(([x, y], i) => {
      const tw = 0.75 + 0.25 * Math.sin(t * 1.3 + i);
      drawGlow(ox + x, oy + y, 9, 0.35 * tw, [220, 230, 255]);
      ctx.fillStyle = `rgba(245,248,255,${tw})`; ctx.beginPath(); ctx.arc(ox + x, oy + y, 2, 0, 7); ctx.fill();
    });
    if (con.found) {
      ctx.fillStyle = 'rgba(200,220,255,0.75)'; ctx.font = '11px Space Mono, monospace'; ctx.textAlign = 'center';
      ctx.fillText(con.name, ox + con.cx, oy + con.cy + 70);
    }
  });

  // a ringed planet ("plum"), the comet "peanut", and the moon with a tiny flag on it
  const px = ox + 1150, py = oy + 650;
  ctx.fillStyle = '#b08ac0'; ctx.beginPath(); ctx.arc(px, py, 20, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(90,60,110,0.6)'; ctx.beginPath(); ctx.arc(px + 6, py + 4, 20, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(230,210,170,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, py, 36, 8, -0.3, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(200,190,220,0.5)'; ctx.font = '10px Space Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('plum', px, py + 40);
  const kx = ox + obs.comet - 200, ky = oy + 1250 - obs.comet * 0.35;
  const kg = ctx.createLinearGradient(kx, ky, kx - 90, ky + 32);
  kg.addColorStop(0, 'rgba(220,240,255,0.9)'); kg.addColorStop(1, 'rgba(220,240,255,0)');
  ctx.strokeStyle = kg; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx - 90, ky + 32); ctx.stroke();
  ctx.fillStyle = '#eef6ff'; ctx.beginPath(); ctx.arc(kx, ky, 3, 0, 7); ctx.fill();
  const mx = ox + 2150, my = oy + 230;
  ctx.save(); ctx.beginPath(); ctx.arc(mx, my, 70, 0, 7); ctx.clip();
  ctx.fillStyle = '#dde3cc'; ctx.fillRect(mx - 70, my - 70, 140, 140);
  ctx.fillStyle = 'rgba(160,170,150,0.45)';
  [[-20, -10, 12], [18, 20, 9], [25, -30, 6], [-35, 30, 7]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(mx + x, my + y, r, 0, 7); ctx.fill(); });
  ctx.restore();
  ctx.strokeStyle = 'rgba(80,70,60,0.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mx + 5, my - 68); ctx.lineTo(mx + 5, my - 84); ctx.stroke();
  ctx.fillStyle = '#c85050'; ctx.fillRect(mx + 5, my - 84, 9, 6);

  ctx.restore();
  }

  // bad weather: layers of night cloud, faintly lit by the moon behind them
  if (cloudA > 0) drawScopeClouds(cx, cy, R, ox, oy, cloudA);
  if (a.rain + a.storm > 0.05) {
    ctx.fillStyle = `rgba(190,210,235,${0.35 * Math.min(1, a.rain + a.storm)})`;
    for (let i = 0; i < 14; i++) { const dx = Math.sin(i * 12.9) * R * 0.8, dy = Math.cos(i * 7.3) * R * 0.8; ctx.beginPath(); ctx.ellipse(cx + dx, cy + dy, 4, 5, 0, 0, 7); ctx.fill(); }
  }
  if (a.snow > 0.05) {
    ctx.fillStyle = `rgba(232,238,248,${0.6 * a.snow})`;
    for (let i = 0; i < 30; i++) { const fx = cx + Math.sin(i * 3.1 + tick * 0.01) * R, fy = cy - R + ((i * 47 + tick * 1.5) % (R * 2)); ctx.beginPath(); ctx.ellipse(fx, fy, 3.4, 3, 0, 0, 7); ctx.fill(); }
  }
  if (weather.flash > 0.02) { ctx.fillStyle = `rgba(220,228,255,${weather.flash * 0.6})`; ctx.fillRect(cx - R, cy - R, R * 2, R * 2); }

  // lens vignette + crosshair
  const vg = ctx.createRadialGradient(cx, cy, R * 0.75, cx, cy, R);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.75)');
  ctx.fillStyle = vg; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  ctx.strokeStyle = 'rgba(200,220,255,0.18)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 14, cy); ctx.lineTo(cx - 4, cy); ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + 14, cy);
  ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy - 4); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 14); ctx.stroke();
  ctx.restore();

  // brass rim + HUD
  ctx.save();
  ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(cx, cy, R + 5, 0, 7); ctx.stroke();
  ctx.strokeStyle = '#d8b068'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R + 10, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(220,210,190,0.7)'; ctx.font = '12px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText(touchMode ? `drag to look around · charted ${foundCount()}/4` : `arrow keys to look around · E to step back · charted ${foundCount()}/4`, cx, Math.min(H - 16, cy + R + 34));
  if (hid > 0.5 && HIDDEN_LINE[weather.type]) ctx.fillText(HIDDEN_LINE[weather.type], cx, Math.max(20, cy - R - 22));
  ctx.restore();
  if (cloudA > 0.5) drawCloudyMessage(cx, cy, R, (cloudA - 0.5) * 2);
}

function obsHash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

// one cloud: a row of round puffs on a flat base
function scopePuff(x, y, w, h, seed) {
  ctx.beginPath();
  ctx.ellipse(x, y + h * 0.16, w * 0.92, h * 0.34, 0, 0, 7);
  const m = 6;
  for (let j = 0; j < m; j++) {
    const f = j / (m - 1), arch = Math.sin(Math.PI * f);
    const r = h * (0.38 + 0.42 * arch) * (0.8 + obsHash(seed + j * 3.7) * 0.4);
    const px = x + (f * 2 - 1) * w * 0.78, py = y - arch * h * 0.32;
    ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, 7);
  }
  ctx.fill();
}

// the telescope view in bad weather: a slow, layered night cloud deck (drawn inside the lens clip)
function drawScopeClouds(cx, cy, R, ox, oy, k) {
  const a = weather.amt;
  const tone = 1 + (a.snow || 0) * 0.22 + (a.fog || 0) * 0.15 - (a.storm || 0) * 0.3;
  const col = (r, g, b, al) => `rgba(${Math.round(r * tone)},${Math.round(g * tone)},${Math.round(b * tone)},${al})`;
  const mx = ox + 2150, my = oy + 230;   // the moon, somewhere up behind all this
  const wind = weather.wind || 0;
  const drift = (0.15 + Math.min(2, Math.abs(wind)) * 0.35) * (wind < 0 ? -1 : 1);

  ctx.save();
  ctx.globalAlpha = k;
  const bg = ctx.createLinearGradient(cx, cy - R, cx, cy + R);
  bg.addColorStop(0, col(30, 35, 48, 1)); bg.addColorStop(1, col(14, 17, 25, 1));
  ctx.fillStyle = bg; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  // the moon's glow, smeared through the deck
  const glow = ctx.createRadialGradient(mx, my, 0, mx, my, R * 2.4);
  glow.addColorStop(0, 'rgba(200,208,220,0.30)'); glow.addColorStop(0.35, 'rgba(130,142,165,0.12)'); glow.addColorStop(1, 'rgba(130,142,165,0)');
  ctx.fillStyle = glow; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

  const spanX = R * 4.6, spanY = R * 3.4;
  for (let L = 0; L < 4; L++) {               // far → near: nearer layers are bigger, quicker, darker
    const depth = 0.25 + L * 0.25, speed = drift * (0.4 + L * 0.45);
    for (let i = 0; i < 7; i++) {
      const seed = L * 53 + i * 11;
      let x = obsHash(seed) * spanX + tick * speed - obs.vx * depth * 0.5;
      let y = obsHash(seed + 1) * spanY - obs.vy * depth * 0.35 + Math.sin(tick * 0.004 + seed) * 6;
      x = ((x % spanX) + spanX) % spanX + cx - spanX / 2;
      y = ((y % spanY) + spanY) % spanY + cy - spanY / 2;
      const w = R * (0.3 + obsHash(seed + 2) * 0.3) * (0.8 + L * 0.22), h = w * (0.38 + obsHash(seed + 3) * 0.14);
      if (x + w * 1.1 < cx - R || x - w * 1.1 > cx + R || y + h * 1.1 < cy - R || y - h * 1.3 > cy + R) continue;
      // moonlight: always a faint wash from up and to the right, stronger close to where the moon hides
      const dx = mx - x, dy = my - y, dl = Math.hypot(dx, dy) || 1;
      const near = Math.max(0, 1 - dl / (R * 3.4));
      const lit = 0.3 + 0.7 * near;
      let lx = 0.45 * (1 - near) + (dx / dl) * near, ly = -0.9 * (1 - near) + (dy / dl) * near;
      const ll = Math.hypot(lx, ly) || 1; lx /= ll; ly /= ll;
      // a soft shadow underneath, a moonlit rim on the side facing the moon, then the body over both
      ctx.fillStyle = col(8, 10, 16, 0.35);
      scopePuff(x - lx * h * 0.22, y - ly * h * 0.22 + h * 0.08, w * 1.02, h, seed);
      ctx.fillStyle = col(140 + 60 * lit, 150 + 60 * lit, 175 + 50 * lit, 0.06 + 0.22 * lit);
      scopePuff(x + lx * h * 0.14, y + ly * h * 0.14, w, h, seed);
      const shade = 44 - L * 6 + lit * 18;
      ctx.fillStyle = col(shade, shade + 5, shade + 18, 0.94);
      scopePuff(x - lx * h * 0.04, y - ly * h * 0.04, w * 0.99, h * 0.97, seed);
    }
  }
  if (a.fog > 0.02) {                          // fog: everything goes soft and milky
    const fg = ctx.createLinearGradient(cx, cy - R, cx, cy + R);
    fg.addColorStop(0, `rgba(120,128,142,${0.35 * a.fog})`); fg.addColorStop(1, `rgba(150,158,170,${0.55 * a.fog})`);
    ctx.fillStyle = fg; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  }
  ctx.restore();
}

// a clear "come back later" card in the middle of the lens
function drawCloudyMessage(cx, cy, R, k) {
  ctx.save();
  ctx.globalAlpha = k;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const big = Math.max(15, Math.min(22, R * 0.07)), small = Math.max(11, Math.min(14, R * 0.045));
  const bw = Math.min(R * 1.7, 380), bh = big + small * 2 + 30;
  // a soft oval of shadow behind the words (squashed circle, so it has no hard edges)
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1, bh / bw * 1.3);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, bw * 0.62);
  g.addColorStop(0, 'rgba(6,8,14,0.62)'); g.addColorStop(0.6, 'rgba(6,8,14,0.35)'); g.addColorStop(1, 'rgba(6,8,14,0)');
  ctx.fillStyle = g; ctx.fillRect(-bw, -bw, bw * 2, bw * 2);
  ctx.restore();
  ctx.fillStyle = 'rgba(236,232,220,0.95)'; ctx.font = `${big}px Space Mono, monospace`;
  ctx.fillText('too cloudy tonight', cx, cy - small * 0.9);
  ctx.fillStyle = 'rgba(205,212,228,0.85)'; ctx.font = `${small}px Space Mono, monospace`;
  ctx.fillText('no stars to see. come back when the sky clears.', cx, cy + big * 0.75);
  ctx.restore();
}

// with nova's star chart in hand, your charted constellations show up faintly in the real sky
function drawChartSky() {
  if (!wearing('chart')) return;
  ctx.save();
  CONSTELLATIONS.forEach((con, ci) => {
    if (!con.found) return;
    const ox = W * (0.08 + ci * 0.22), oy = H * (0.1 + (ci % 2) * 0.14), k = 0.45;
    const p = ([x, y]) => [ox + (x - con.cx) * k, oy + (y - con.cy) * k];
    ctx.strokeStyle = 'rgba(180,210,255,0.22)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); con.lines.forEach(([i, j]) => { ctx.moveTo(...p(con.stars[i])); ctx.lineTo(...p(con.stars[j])); }); ctx.stroke();
    con.stars.forEach(st => { const [x, y] = p(st); ctx.fillStyle = 'rgba(240,245,255,0.8)'; ctx.beginPath(); ctx.arc(x, y, 1.4, 0, 7); ctx.fill(); });
    ctx.fillStyle = 'rgba(200,220,255,0.35)'; ctx.font = '9px Space Mono, monospace'; ctx.textAlign = 'center';
    ctx.fillText(con.name, ox, oy + 40);
  });
  ctx.restore();
}
