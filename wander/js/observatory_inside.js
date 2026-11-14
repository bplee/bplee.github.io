/* ══════════════════════════════════════════
   INSIDE THE OBSERVATORY (scene === 'observatory')
   A round stone room under the dome. The slit in the dome shows the real
   sky/weather; the big brass telescope points up through it — press E at
   it to look (the telescope view lives in observatory.js). Nova works at
   her desk; there's an orrery, a globe, and a wall chart that fills in as
   you find constellations. Room coords 0..OBS_ROOM_W, floor = tavernFloorY().
══════════════════════════════════════════ */
const OBS_ROOM_W  = 1000;
const OBS_EXIT_X  = 70;
const OBS_SCOPE_X = 590;
const OBS_DOOR_X  = () => OBS_X - 22;   // the door on the outside of the tower

let obsReturnX = 0;
const obsIn = { steam: [] };

function nearObsDoor()  { return scene === 'outside' && Math.abs(player.wx - OBS_DOOR_X()) < 30; }
function nearObsExit()  { return scene === 'observatory' && Math.abs(player.wx - OBS_EXIT_X) < 40; }

function enterObservatory() {
  fadeTransition(() => {
    scene = 'observatory';
    obsReturnX = player.wx;
    player.wx = OBS_EXIT_X + 50; player._py = tavernFloorY(); player.vy = 0; _vx = 0;
    player.onPlatform = false; player.facingRight = true;
    camX = W >= OBS_ROOM_W ? (OBS_ROOM_W - W) / 2 : 0;
    if (nova.stage === 0 && nova.bubbleT <= 0) say(nova, 'oh! come in, come in. mind the cables.');
  });
}
function exitObservatory() {
  fadeTransition(() => {
    scene = 'outside';
    player.wx = obsReturnX || OBS_DOOR_X(); player._py = groundY(player.wx); player.vy = 0; _vx = 0;
    player.onPlatform = false;
    camX = Math.max(0, Math.min(WORLD_W - W, player.wx - W * 0.3));
    weather.lastCamX = camX;
  });
}

function obsInteriorPopup() {
  if (nearObsExit()) return 'press E to head back out';
  if (nearScope()) return 'press E to look through the telescope';
  if (nearNova() && nova.bubbleT <= 0) return 'press E to talk to nova';
  return null;
}

function updateObsInterior() {
  if (nova.bubbleT > 0) nova.bubbleT--;
  nova.x = NOVA_X + Math.sin(tick * 0.006) * 14;       // pacing by her desk
  if (tick % 700 === 0 && nova.bubbleT === 0 && Math.abs(player.wx - nova.x) > 80) {
    say(nova, ['hmm…', 'fascinating.', 'is that a new one? no. a moth.', '*scribbles notes*'][Math.floor(Math.random() * 4)]);
    nova.bubbleT = 150;
  }
  const F = tavernFloorY();
  if (tick % 26 === 0) obsIn.steam.push({ x: 286 + rand(-2, 2), y: F - 64, a: 0.35, r: 2 });   // her tea
  for (let i = obsIn.steam.length - 1; i >= 0; i--) {
    const s = obsIn.steam[i]; s.y -= 0.35; s.x += Math.sin(tick * 0.05 + i) * 0.15; s.r += 0.04; s.a -= 0.005;
    if (s.a <= 0) obsIn.steam.splice(i, 1);
  }
}

/* ── DRAW ── */
function obsDomeY(x, F) { // height of the dome's inner surface at room x
  const WALL = 200, RX = OBS_ROOM_W / 2, RY = 300, t = (x - RX) / RX;
  return F - WALL - RY * Math.sqrt(Math.max(0, 1 - t * t));
}

function drawObsInterior() {
  const F = tavernFloorY(), ox = -camX;
  const WALL = 200, RX = OBS_ROOM_W / 2, RY = 300, cx = ox + RX, base = F - WALL;
  const flick = 0.85 + Math.sin(tick * 0.21) * 0.05 + Math.sin(tick * 0.53) * 0.04;
  const slitX = RX + 150, slitW = 52;

  ctx.fillStyle = '#07080c'; ctx.fillRect(-10, Math.min(0, camY) - 50, W + 20, H + Math.abs(camY) + 100);

  // the dome (inside), with the open slit showing the sky
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, base, RX, RY, 0, Math.PI, 0); ctx.closePath();
  const dg = ctx.createLinearGradient(0, base - RY, 0, base);
  dg.addColorStop(0, '#12151d'); dg.addColorStop(1, '#1d212b');
  ctx.fillStyle = dg; ctx.fill();
  ctx.clip();
  drawWeatherWindow(ox + slitX - slitW / 2, base - RY - 10, slitW, RY + 10);
  ctx.strokeStyle = 'rgba(120,130,150,0.35)'; ctx.lineWidth = 1.5;
  for (let k = 1; k <= 6; k++) { ctx.beginPath(); ctx.ellipse(cx, base, RX * k / 6.5, RY, 0, Math.PI, 0); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(cx, base, RX, RY * 0.55, 0, Math.PI, 0); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#3a3f4a'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(ox + slitX - slitW / 2, obsDomeY(slitX - slitW / 2, F)); ctx.lineTo(ox + slitX - slitW / 2, base);
  ctx.moveTo(ox + slitX + slitW / 2, obsDomeY(slitX + slitW / 2, F)); ctx.lineTo(ox + slitX + slitW / 2, base); ctx.stroke();
  ctx.strokeStyle = 'rgba(150,160,180,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx, base, RX, RY, 0, Math.PI, 0); ctx.stroke();

  // stone walls
  const wg = ctx.createLinearGradient(0, base, 0, F);
  wg.addColorStop(0, '#24212a'); wg.addColorStop(1, '#2c2730');
  ctx.fillStyle = wg; ctx.fillRect(ox, base, OBS_ROOM_W, WALL);
  ctx.strokeStyle = 'rgba(80,74,86,0.45)'; ctx.lineWidth = 1;
  for (let y = base + 20, row = 0; y < F; y += 20, row++) {
    ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + OBS_ROOM_W, y); ctx.stroke();
    for (let x = (row % 2) * 30; x < OBS_ROOM_W; x += 60) { ctx.beginPath(); ctx.moveTo(ox + x, y - 20); ctx.lineTo(ox + x, y); ctx.stroke(); }
  }
  ctx.fillStyle = '#3a3440'; ctx.fillRect(ox, base - 6, OBS_ROOM_W, 8);   // ring where the dome sits

  // moonlight falling through the slit
  const beam = ctx.createLinearGradient(0, base - RY * 0.5, 0, F);
  beam.addColorStop(0, `rgba(180,200,255,${0.09 * (1 - cloudiness() * 0.7)})`); beam.addColorStop(1, 'rgba(180,200,255,0)');
  ctx.fillStyle = beam;
  ctx.beginPath(); ctx.moveTo(ox + slitX - slitW / 2, base - RY * 0.5); ctx.lineTo(ox + slitX + slitW / 2, base - RY * 0.5);
  ctx.lineTo(ox + slitX + 110, F); ctx.lineTo(ox + slitX - 140, F); ctx.closePath(); ctx.fill();

  // floor
  ctx.fillStyle = '#201a17'; ctx.fillRect(ox, F, OBS_ROOM_W, H - F + Math.abs(camY) + 40);
  ctx.strokeStyle = 'rgba(150,115,80,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(ox, F); ctx.lineTo(ox + OBS_ROOM_W, F); ctx.stroke();
  ctx.fillStyle = 'rgba(70,60,110,0.35)'; ctx.beginPath(); ctx.ellipse(ox + OBS_SCOPE_X, F + 4, 120, 8, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(200,180,120,0.3)'; ctx.beginPath(); ctx.ellipse(ox + OBS_SCOPE_X, F + 4, 104, 6, 0, 0, 7); ctx.stroke();

  // exit door
  const nd = nearObsExit();
  ctx.fillStyle = '#3a2a1c'; ctx.beginPath(); ctx.moveTo(ox + OBS_EXIT_X - 24, F); ctx.lineTo(ox + OBS_EXIT_X - 24, F - 60);
  ctx.arc(ox + OBS_EXIT_X, F - 60, 24, Math.PI, 0); ctx.lineTo(ox + OBS_EXIT_X + 24, F); ctx.fill();
  ctx.strokeStyle = nd ? 'rgba(255,200,130,0.9)' : 'rgba(170,135,95,0.7)'; ctx.lineWidth = nd ? 2 : 1.2; ctx.stroke();
  ctx.fillStyle = 'rgba(220,180,110,0.9)'; ctx.beginPath(); ctx.arc(ox + OBS_EXIT_X + 14, F - 38, 2.2, 0, 7); ctx.fill();

  // wall chart: the constellations, brighter once you've found them
  const chx = ox + 380, chy = F - 186, chw = 150, chh = 92;
  ctx.fillStyle = 'rgba(225,215,185,0.9)'; ctx.fillRect(chx, chy, chw, chh);
  ctx.strokeStyle = 'rgba(120,95,65,0.8)'; ctx.lineWidth = 2; ctx.strokeRect(chx, chy, chw, chh);
  CONSTELLATIONS.forEach((c, i) => {
    const px = chx + 22 + (i % 2) * 74, py = chy + 22 + Math.floor(i / 2) * 44, k = 0.32;
    const pt = ([x, y]) => [px + (x - c.cx) * k + 16, py + (y - c.cy) * k + 10];
    ctx.strokeStyle = c.found ? 'rgba(40,60,120,0.8)' : 'rgba(40,60,120,0.12)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); c.lines.forEach(([a, b]) => { ctx.moveTo(...pt(c.stars[a])); ctx.lineTo(...pt(c.stars[b])); }); ctx.stroke();
    ctx.fillStyle = c.found ? 'rgba(30,50,110,0.95)' : 'rgba(30,50,110,0.3)';
    c.stars.forEach(s => { const [x, y] = pt(s); ctx.beginPath(); ctx.arc(x, y, 1.3, 0, 7); ctx.fill(); });
  });
  ctx.fillStyle = 'rgba(60,45,30,0.8)'; ctx.font = '7px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`charted ${foundCount()}/4`, chx + chw / 2, chy + chh - 4);

  // nova's desk: lamp, papers, a mug of tea, a stack of books
  ctx.fillStyle = '#4a3522'; ctx.fillRect(ox + 200, F - 52, 130, 7); ctx.fillRect(ox + 206, F - 45, 6, 45); ctx.fillRect(ox + 318, F - 45, 6, 45);
  ctx.fillStyle = 'rgba(235,228,210,0.85)'; ctx.save(); ctx.translate(ox + 240, F - 54); ctx.rotate(-0.08); ctx.fillRect(-14, -3, 28, 3); ctx.restore();
  ctx.fillRect(ox + 228, F - 56, 22, 2);
  ['#7a5a8a', '#5a7a6a', '#a06050'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(ox + 300, F - 58 - i * 5, 22 - i * 3, 5); });
  ctx.fillStyle = 'rgba(220,200,160,0.9)'; ctx.fillRect(ox + 280, F - 62, 10, 10);
  obsIn.steam.forEach(s => { ctx.fillStyle = `rgba(220,220,230,${s.a})`; ctx.beginPath(); ctx.arc(ox + s.x, s.y, s.r, 0, 7); ctx.fill(); });
  ctx.strokeStyle = 'rgba(120,95,65,0.9)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ox + 214, F - 52); ctx.lineTo(ox + 214, F - 86); ctx.lineTo(ox + 230, F - 96); ctx.stroke();
  ctx.fillStyle = `rgba(255,205,130,${0.95 * flick})`; ctx.beginPath(); ctx.arc(ox + 232, F - 92, 4, 0, 7); ctx.fill();
  drawLanternGlow(ox + 232, F - 90, 130, 0.22 * flick);

  // nova
  const ny = F + Math.sin(tick * 0.04) * 0.8, ndir = faceToward(nova.x, 1);
  drawCritter(ox + nova.x, ny, 'raccoon', { color: nova.color, dir: ndir, label: 'nova' });
  ctx.fillStyle = 'rgba(230,220,195,0.9)'; ctx.fillRect(ox + nova.x + 8 * ndir - 4, ny - 24, 9, 11);
  ctx.strokeStyle = 'rgba(200,170,90,0.9)'; ctx.lineWidth = 1;
  const pw = Math.sin(tick * 0.3) * 2;
  ctx.beginPath(); ctx.moveTo(ox + nova.x + 10 * ndir + pw, ny - 20); ctx.lineTo(ox + nova.x + 16 * ndir + pw, ny - 28); ctx.stroke();

  // the big telescope, pointing up through the slit
  const near = nearScope();
  const sx = ox + OBS_SCOPE_X, my = F - 118;
  ctx.fillStyle = '#3a3440'; ctx.beginPath(); ctx.moveTo(sx - 34, F); ctx.lineTo(sx - 18, F - 22); ctx.lineTo(sx + 18, F - 22); ctx.lineTo(sx + 34, F); ctx.fill();
  ctx.fillStyle = '#4a4452'; ctx.fillRect(sx - 7, my, 14, F - 22 - my);
  ctx.fillStyle = '#5a5262'; ctx.fillRect(sx - 14, my - 8, 28, 12);
  const tx = ox + slitX, ty = base - RY * 0.62;
  const ang = Math.atan2(ty - my, tx - sx) + Math.sin(tick * 0.004) * 0.02;
  const len = Math.hypot(tx - sx, ty - my) * 0.92;
  ctx.save(); ctx.translate(sx, my - 2); ctx.rotate(ang);
  const tg = ctx.createLinearGradient(0, -14, 0, 14);
  tg.addColorStop(0, near ? '#e8c27a' : '#c89e58'); tg.addColorStop(0.5, near ? '#f4d896' : '#dcb46c'); tg.addColorStop(1, near ? '#b88e4a' : '#9a763c');
  ctx.fillStyle = tg; ctx.fillRect(-len * 0.28, -12, len, 24);
  ctx.fillStyle = '#8a6a3a'; ctx.fillRect(len * 0.72 - 8, -15, 10, 30); ctx.fillRect(-len * 0.28 + len * 0.3, -14, 8, 28);
  ctx.fillStyle = '#2a2420'; ctx.fillRect(-len * 0.28 - 14, -5, 16, 10);       // eyepiece
  ctx.restore();
  if (near) drawGlow(sx, my, 90, 0.12, [255, 230, 160]);

  // orrery: little planets going round a glowing sun
  const orx = ox + 840, ory = F - 118;
  ctx.strokeStyle = 'rgba(160,130,90,0.9)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(orx, F); ctx.lineTo(orx, ory); ctx.moveTo(orx - 22, F); ctx.lineTo(orx + 22, F); ctx.stroke();
  drawGlow(orx, ory, 34, 0.35 * flick, [255, 210, 120]);
  ctx.fillStyle = 'rgba(255,215,130,0.95)'; ctx.beginPath(); ctx.arc(orx, ory, 6, 0, 7); ctx.fill();
  [[20, 0.03, '#a0b8e0', 2.5], [34, 0.018, '#d88aa0', 3.5], [48, 0.011, '#b08ac0', 4.5]].forEach(([r, sp, c, pr], i) => {
    ctx.strokeStyle = 'rgba(200,180,140,0.35)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.ellipse(orx, ory, r, r * 0.35, 0, 0, 7); ctx.stroke();
    const a = tick * sp + i * 2;
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(orx + Math.cos(a) * r, ory + Math.sin(a) * r * 0.35, pr, 0, 7); ctx.fill();
  });

  // a globe on a stand
  const gx = ox + 935, gy = F - 60;
  ctx.strokeStyle = 'rgba(160,130,90,0.9)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(gx, F); ctx.lineTo(gx, gy + 16); ctx.moveTo(gx - 14, F); ctx.lineTo(gx + 14, F); ctx.stroke();
  ctx.fillStyle = '#3a5a7a'; ctx.beginPath(); ctx.arc(gx, gy, 15, 0, 7); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(gx, gy, 15, 0, 7); ctx.clip();
  ctx.fillStyle = '#6a8a5a';
  for (let i = 0; i < 3; i++) { const x = gx - 20 + ((tick * 0.2 + i * 18) % 40); ctx.beginPath(); ctx.ellipse(x, gy - 4 + i * 5, 6, 3.5, 0.4, 0, 7); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(200,170,110,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(gx, gy, 18, -1.2, 1.2); ctx.stroke();

  // vignette
  const v = ctx.createRadialGradient(cx, F - 120, 120, cx, F - 120, Math.max(W, H) * 0.7);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = v; ctx.fillRect(-10, Math.min(0, camY) - 50, W + 20, H + Math.abs(camY) + 100);
}

// nova's speech bubble, in front
function drawObsInteriorFront() {
  if (nova.bubbleT > 0 && nova.bubble) {
    ctx.save(); ctx.globalAlpha = Math.min(1, nova.bubbleT / 20);
    drawBubble(nova.x - camX, tavernFloorY() - 62, nova.bubble);
    ctx.restore();
  }
}
