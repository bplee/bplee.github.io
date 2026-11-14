/* ══════════════════════════════════════════
   THE WOODS — living details for the outdoor world
     · big swaying trees (one with a rope swing)
     · the mouse's home burrow + mailbox, a signpost
     · a pond with lily pads, a frog, moon reflection, rain ripples, ice
     · bouncy glowing mushrooms (jump on them!)
     · fireflies that gather around you if you stand still
     · grass that sways in the wind and parts as you walk through
     · dust puffs when you land, an owl gliding past the moon
══════════════════════════════════════════ */
const HOME_X = 120;
const HOME_K = 2;    // the burrow is drawn at 2× so its door is taller than you
const SIGN_X = 700;
const SHOVEL_X = 340; // a shovel left out by home — enough to dig into the cavern
const POND_X = 1850;

const BIG_TREES = [
  { x: 410,  s: 1.1,  seed: 1 },
  { x: 820,  s: 1.25, seed: 2, swing: true },
  { x: 1230, s: 0.95, seed: 3 },
  { x: 2120, s: 1.05, seed: 4 },
  { x: 2560, s: 1.2,  seed: 5 },
  { x: 4050, s: 1.0,  seed: 6 },
  { x: 4990, s: 1.2,  seed: 7 },
  { x: 5470, s: 1.0,  seed: 9 },
  { x: 5790, s: 1.1,  seed: 10 },
  { x: 7330, s: 1.15, seed: 11 },
  { x: 7560, s: 0.95, seed: 12 },
];

const MUSHROOMS = [
  { x: 520,  s: 1.0,  hue: 'teal', squish: 0, bounced: false },
  { x: 1440, s: 1.15, hue: 'pink', squish: 0, bounced: false },
  { x: 2680, s: 1.0,  hue: 'teal', squish: 0, bounced: false },
];
const mushCapTop = m => groundY(m.x) - 30 * m.s;

// deterministic pseudo-random so grass doesn't reshuffle every frame
const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

const FIREFLIES = Array.from({ length: 80 }, () => {
  let hx; do { hx = Math.random() * WORLD_W; } while (hx > 2820 && hx < 3580);
  return { hx, hy: 15 + Math.random() * 80, ph: Math.random() * 6, sp: 0.4 + Math.random() * 0.6, x: hx, y: 0, pull: 0 };
});

const woods = {
  puffs: [], spores: [], ripples: [], homeSmoke: [],
  idle: 0, prevOnGround: true,
  owl: { t: -1, timer: 60 * 25 },
  ribbit: 0,
};

/* ── physics hook (called from updatePlayer) ── */
function woodsCollide() {
  MUSHROOMS.forEach(m => {
    const top = mushCapTop(m);
    if (player.vy > 0 && Math.abs(player.wx - m.x) < 20 * m.s && player.prevPy <= top + 1 && player._py >= top) {
      player._py = top;
      player.vy = -13.5;
      player.onGround = false;
      player.jumpCount = 1;      // you can still double-jump flip off the bounce
      player.flipActive = false;
      m.squish = 1;
      if (!m.bounced) { m.bounced = true; showHint('boing!', 1000); }
      for (let i = 0; i < 12; i++)
        woods.spores.push({ x: m.x + rand(-16, 16), y: top + rand(-4, 4), vx: rand(-1.2, 1.2), vy: rand(-2.2, -0.4), life: 1, pink: m.hue === 'pink' });
    }
  });
}

function woodsPopup() {
  if (player.wx < HOME_X + 170) return 'home. the kettle is still warm.';
  for (const m of MUSHROOMS) if (!m.bounced && Math.abs(player.wx - m.x) < 60) return 'a springy-looking mushroom… jump on it?';
  if (Math.abs(player.wx - POND_X) < 70) return weather.snowCover > 0.4 ? 'the pond has frozen over.' : 'a little pond. something is croaking.';
  return null;
}

/* ══════════════════════════════════════════
   UPDATE
══════════════════════════════════════════ */
function updateWoods() {
  const a = weather.amt;
  if (!hasItem('shovel') && Math.abs(player.wx - SHOVEL_X) < 22 && player.onGround) give('shovel');

  // landing puffs (+ a dusty trail on blades)
  const landed = player.onGround && !woods.prevOnGround;
  woods.prevOnGround = player.onGround;
  const kind = weather.snowCover > 0.3 ? 'snow' : (a.rain + a.storm > 0.4 ? 'wet' : 'dust');
  if (landed) for (let i = 0; i < 7; i++)
    woods.puffs.push({ x: player.wx + rand(-8, 8), y: player._py - 2, vx: rand(-1.4, 1.4), vy: rand(-0.9, -0.2), r: rand(2, 4), life: 1, kind });
  if (player.onGround && Math.abs(player._vx) > 3.5 && tick % 5 === 0)
    woods.puffs.push({ x: player.wx - Math.sign(player._vx) * 8, y: player._py - 2, vx: -player._vx * 0.1, vy: -0.3, r: 2, life: 0.7, kind });
  for (let i = woods.puffs.length - 1; i >= 0; i--) {
    const p = woods.puffs[i];
    p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.r += 0.08; p.life -= 0.03;
    if (p.life <= 0) woods.puffs.splice(i, 1);
  }

  // mushrooms spring back
  MUSHROOMS.forEach(m => { m.squish *= 0.85; });
  for (let i = woods.spores.length - 1; i >= 0; i--) {
    const s = woods.spores[i];
    s.x += s.vx + weather.wind * 0.3; s.y += s.vy; s.vy += 0.04; s.life -= 0.015;
    if (s.life <= 0) woods.spores.splice(i, 1);
  }

  // fireflies: wander near home spots, gather round you if you stand still
  woods.idle = (player.onGround && Math.abs(player._vx) < 0.1) ? woods.idle + 1 : 0;
  const t = tick * 0.02;
  FIREFLIES.forEach(f => {
    const homeX = f.hx + Math.sin(t * f.sp + f.ph) * 30;
    const homeY = groundY(f.hx) - f.hy + Math.sin(t * f.sp * 1.3 + f.ph) * 12;
    const near = Math.abs(f.hx - player.wx) < 260;
    f.pull += ((woods.idle > 120 || wearing('lantern')) && near ? 0.004 : -0.01); // they love the lantern
    f.pull = Math.max(0, Math.min(1, f.pull));
    const orbX = player.wx + Math.cos(t * 1.4 + f.ph * 3) * (26 + f.hy * 0.3);
    const orbY = player._py - 40 + Math.sin(t * 1.7 + f.ph * 2) * 22;
    const tx = homeX + (orbX - homeX) * f.pull, ty = homeY + (orbY - homeY) * f.pull;
    if (!f.y) { f.x = tx; f.y = ty; }
    f.x += (tx - f.x) * 0.05; f.y += (ty - f.y) * 0.05;
  });

  // pond: rain ripples + a frog that ribbits now and then
  if (Math.random() < (a.rain + a.storm) * 0.25 && weather.snowCover < 0.4)
    woods.ripples.push({ x: POND_X + rand(-80, 80), y: rand(-4, 4), r: 0.5, life: 1 });
  for (let i = woods.ripples.length - 1; i >= 0; i--) {
    const r = woods.ripples[i]; r.r += 0.35; r.life -= 0.03;
    if (r.life <= 0) woods.ripples.splice(i, 1);
  }
  if (woods.ribbit > 0) woods.ribbit--;
  else if (Math.random() < 0.004 && weather.snowCover < 0.4) woods.ribbit = 80;

  // chimney smoke from home
  if (tick % 18 === 0) woods.homeSmoke.push({ x: HOME_X + 42 * HOME_K, y: groundY(HOME_X) - 80 * HOME_K, r: 4, a: 0.3 });
  for (let i = woods.homeSmoke.length - 1; i >= 0; i--) {
    const s = woods.homeSmoke[i];
    s.y -= 0.45; s.x += 0.12 + weather.wind * 0.5; s.r += 0.07; s.a -= 0.0028;
    if (s.a <= 0) woods.homeSmoke.splice(i, 1);
  }

  // owl flyby across the moon
  const owl = woods.owl;
  if (owl.t >= 0) { owl.t += 0.0025; if (owl.t > 1) { owl.t = -1; owl.timer = Math.floor(rand(50, 90) * 60); } }
  else if (--owl.timer <= 0) owl.t = 0;
}

/* ══════════════════════════════════════════
   DRAW — behind the player
══════════════════════════════════════════ */
function drawOwlFlyby() {
  const owl = woods.owl;
  if (owl.t < 0) return;
  const x = -60 + owl.t * (W + 120);
  const y = H * 0.16 + Math.sin(owl.t * Math.PI * 2) * H * 0.03;
  const flap = Math.sin(tick * 0.25);
  ctx.save();
  ctx.fillStyle = 'rgba(8,9,14,0.92)';
  ctx.beginPath(); ctx.ellipse(x, y, 7, 5, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 6, y - 3, 3.5, 0, 7); ctx.fill();
  [-1, 1].forEach(side => {
    ctx.beginPath(); ctx.moveTo(x - 2, y - 1);
    ctx.quadraticCurveTo(x - 6, y - 4 - side * (8 + flap * 7), x - 18, y - side * (2 + flap * 10));
    ctx.quadraticCurveTo(x - 8, y + 1, x - 2, y + 1);
    ctx.fill();
  });
  ctx.restore();
}

function drawBigTree(x, s, seed, swing) {
  const sx = x - camX;
  if (sx < -180 * s || sx > W + 180 * s) return;
  const gy = groundY(x);
  const sway = Math.sin(tick * 0.015 + seed) * (1.5 + Math.abs(weather.wind) * 2) + weather.wind * 3;
  ctx.save();
  // trunk + roots
  ctx.fillStyle = '#271c14';
  ctx.beginPath();
  ctx.moveTo(sx - 10 * s, gy);
  ctx.quadraticCurveTo(sx - 6 * s, gy - 50 * s, sx - 5 * s + sway * 0.2, gy - 105 * s);
  ctx.lineTo(sx + 5 * s + sway * 0.2, gy - 105 * s);
  ctx.quadraticCurveTo(sx + 6 * s, gy - 50 * s, sx + 10 * s, gy);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#271c14'; ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(sx - 8 * s, gy - 4); ctx.quadraticCurveTo(sx - 16 * s, gy - 2, sx - 22 * s, gy + 2);
  ctx.moveTo(sx + 8 * s, gy - 4); ctx.quadraticCurveTo(sx + 16 * s, gy - 1, sx + 20 * s, gy + 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(80,60,40,0.4)'; ctx.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(sx - 3 * s + i * 3 * s, gy - 8); ctx.lineTo(sx - 2 * s + i * 3 * s + sway * 0.1, gy - 90 * s); ctx.stroke(); }
  // branch for the swing
  if (swing) {
    ctx.strokeStyle = '#271c14'; ctx.lineWidth = 4 * s;
    ctx.beginPath(); ctx.moveTo(sx + 2 * s, gy - 88 * s); ctx.quadraticCurveTo(sx + 30 * s, gy - 98 * s, sx + 58 * s + sway * 0.5, gy - 92 * s); ctx.stroke();
  }
  // canopy clusters, each swaying a bit more the higher it is
  const C = [[0, -130, 50, 36], [-34, -112, 36, 28], [36, -114, 38, 30], [-12, -156, 32, 25], [20, -146, 30, 24], [-40, -138, 24, 20]];
  C.forEach(([dx, dy, rx, ry], i) => {
    const k = -dy / 150;
    const cx = sx + dx * s + sway * k * 1.4, cy = gy + dy * s;
    ctx.fillStyle = i % 2 ? '#15251a' : '#182b1c';
    ctx.beginPath(); ctx.ellipse(cx, cy, rx * s, ry * s, 0, 0, 7); ctx.fill();
  });
  // moonlit rim (light comes from the upper right)
  C.forEach(([dx, dy, rx, ry]) => {
    const k = -dy / 150;
    const cx = sx + dx * s + sway * k * 1.4, cy = gy + dy * s;
    ctx.fillStyle = 'rgba(120,160,110,0.12)';
    ctx.beginPath(); ctx.ellipse(cx + rx * s * 0.25, cy - ry * s * 0.3, rx * s * 0.6, ry * s * 0.45, 0, 0, 7); ctx.fill();
    if (weather.snowCover > 0.05) {
      ctx.fillStyle = `rgba(235,240,248,${weather.snowCover * 0.75})`;
      ctx.beginPath(); ctx.ellipse(cx, cy - ry * s * 0.7, rx * s * 0.7, ry * s * 0.3, 0, Math.PI, 0); ctx.fill();
    }
  });
  // rope swing — swings like a pendulum, pushed by the wind
  if (swing) {
    const px = sx + 44 * s + sway * 0.4, py = gy - 94 * s;
    const ang = Math.sin(tick * 0.028) * 0.18 + weather.wind * 0.12;
    const len = 62 * s;
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
    ctx.strokeStyle = 'rgba(190,165,120,0.75)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-9, len); ctx.moveTo(9, 0); ctx.lineTo(9, len); ctx.stroke();
    ctx.fillStyle = '#5a4230'; ctx.fillRect(-13, len, 26, 4);
    ctx.restore();
  }
  ctx.restore();
}

function drawHome() {
  if (HOME_X - camX < -400 || HOME_X - camX > W + 400) return;
  const flick = 0.85 + Math.sin(tick * 0.19) * 0.06 + Math.sin(tick * 0.47) * 0.04;
  ctx.save();
  woods.homeSmoke.forEach(s => { ctx.fillStyle = `rgba(150,150,160,${s.a})`; ctx.beginPath(); ctx.arc(s.x - camX, s.y, s.r, 0, 7); ctx.fill(); });
  // everything below is drawn in "home space": origin at the door step, scaled up
  ctx.translate(HOME_X - camX, groundY(HOME_X)); ctx.scale(HOME_K, HOME_K);
  const sx = 0, gy = 0;
  // chimney pipe
  ctx.fillStyle = '#4a4440'; ctx.fillRect(sx + 38, gy - 78, 8, 30);
  ctx.fillRect(sx + 35, gy - 80, 14, 4);
  // grassy mound
  ctx.fillStyle = '#1c2a14';
  ctx.beginPath(); ctx.ellipse(sx, gy, 85, 62, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = 'rgba(95,140,60,0.6)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(sx, gy, 85, 62, 0, Math.PI, 0); ctx.stroke();
  if (weather.snowCover > 0.05) {
    ctx.strokeStyle = `rgba(235,240,248,${0.3 + weather.snowCover * 0.6})`; ctx.lineWidth = 2 + weather.snowCover * 6;
    ctx.beginPath(); ctx.ellipse(sx, gy, 85, 62, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  }
  // round window
  ctx.fillStyle = `rgba(255,190,110,${0.7 * flick})`; ctx.beginPath(); ctx.arc(sx - 42, gy - 30, 9, 0, 7); ctx.fill();
  ctx.strokeStyle = '#4a3522'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx - 51, gy - 30); ctx.lineTo(sx - 33, gy - 30); ctx.moveTo(sx - 42, gy - 39); ctx.lineTo(sx - 42, gy - 21); ctx.stroke();
  drawGlow(sx - 42, gy - 30, 40, 0.16 * flick);
  // round door
  ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.arc(sx + 4, gy - 4, 22, Math.PI, 0); ctx.lineTo(sx + 26, gy); ctx.lineTo(sx - 18, gy); ctx.fill();
  ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(sx + 4, gy - 4, 22, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(40,25,15,0.5)'; ctx.lineWidth = 0.5;
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(sx + 4 + i * 8, gy); ctx.lineTo(sx + 4 + i * 8, gy - 4 - Math.sqrt(484 - Math.pow(i * 8, 2))); ctx.stroke(); }
  ctx.fillStyle = 'rgba(220,180,110,0.95)'; ctx.beginPath(); ctx.arc(sx + 16, gy - 10, 2, 0, 7); ctx.fill();
  // lantern by the door
  const ly = gy - 40 + Math.sin(tick * 0.03) * 1;
  ctx.strokeStyle = 'rgba(120,95,65,0.8)'; ctx.beginPath(); ctx.moveTo(sx + 30, gy - 30); ctx.lineTo(sx + 36, ly - 12); ctx.stroke();
  ctx.fillStyle = `rgba(255,200,120,${0.95 * flick})`; ctx.beginPath(); ctx.arc(sx + 36, ly - 6, 3.5, 0, 7); ctx.fill();
  drawGlow(sx + 36, ly - 6, 34, 0.25 * flick);
  // doormat
  ctx.fillStyle = 'rgba(140,80,60,0.6)'; ctx.fillRect(sx - 12, gy - 1, 32, 3);
  // mailbox with a little flag
  const mx = sx + 82;
  ctx.fillStyle = '#4a3522'; ctx.fillRect(mx - 1.5, gy - 26, 3, 26);
  ctx.fillStyle = '#6a7a8a'; manualRoundRect(mx - 9, gy - 36, 18, 11, 4); ctx.fill();
  ctx.save(); ctx.translate(mx + 9, gy - 34); ctx.rotate(-0.2 + Math.sin(tick * 0.06) * 0.06 + weather.wind * 0.08);
  ctx.fillStyle = '#4a3522'; ctx.fillRect(0, -9, 1.5, 10); ctx.fillStyle = '#c85050'; ctx.fillRect(1.5, -9, 6, 4);
  ctx.restore();
  ctx.restore();
}

function drawSignpost() {
  const sx = SIGN_X - camX;
  if (sx < -80 || sx > W + 80) return;
  const gy = groundY(SIGN_X);
  ctx.save();
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(sx - 2, gy - 72, 4, 72);
  [['← home', -1, -64], ['court →', 1, -48], ['tavern →', 1, -32]].forEach(([txt, dir, dy], i) => {
    ctx.save();
    ctx.translate(sx, gy + dy);
    ctx.rotate(Math.sin(tick * 0.03 + i * 1.7) * 0.02 + weather.wind * 0.02 * dir);
    const w = 54, x0 = dir > 0 ? 0 : -w;
    ctx.fillStyle = '#4a3522';
    ctx.beginPath();
    if (dir > 0) { ctx.moveTo(x0, -6); ctx.lineTo(x0 + w - 6, -6); ctx.lineTo(x0 + w, 0); ctx.lineTo(x0 + w - 6, 6); ctx.lineTo(x0, 6); }
    else         { ctx.moveTo(x0 + w, -6); ctx.lineTo(x0 + 6, -6); ctx.lineTo(x0, 0); ctx.lineTo(x0 + 6, 6); ctx.lineTo(x0 + w, 6); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(230,205,160,0.85)'; ctx.font = '8px Space Mono, monospace'; ctx.textAlign = 'center';
    ctx.fillText(txt, x0 + w / 2, 3);
    if (weather.snowCover > 0.1) { ctx.fillStyle = `rgba(235,240,248,${weather.snowCover * 0.8})`; ctx.fillRect(x0 + 2, -8, w - 4, 2); }
    ctx.restore();
  });
  ctx.restore();
}

function drawPond() {
  const sx = POND_X - camX;
  if (sx < -160 || sx > W + 160) return;
  const gy = groundY(POND_X) - 3;
  const frozen = weather.snowCover > 0.4;
  ctx.save();
  // water
  const wg = ctx.createLinearGradient(0, gy - 10, 0, gy + 10);
  wg.addColorStop(0, frozen ? 'rgba(170,190,210,0.75)' : 'rgba(20,34,52,0.95)');
  wg.addColorStop(1, frozen ? 'rgba(130,150,175,0.75)' : 'rgba(12,22,34,0.95)');
  ctx.fillStyle = wg; ctx.beginPath(); ctx.ellipse(sx, gy, 96, 10, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(95,140,60,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.ellipse(sx, gy, 96, 10, 0, 0, 7); ctx.clip();
  if (!frozen) {
    // shimmering moon reflection
    for (let i = 0; i < 5; i++) {
      const w = 10 + Math.sin(tick * 0.05 + i * 1.3) * 5;
      ctx.fillStyle = `rgba(221,227,204,${0.25 + 0.15 * Math.sin(tick * 0.08 + i)})`;
      ctx.fillRect(sx + 30 - w / 2 + Math.sin(tick * 0.03 + i) * 2, gy - 6 + i * 2.6, w, 1);
    }
    woods.ripples.forEach(r => {
      ctx.strokeStyle = `rgba(170,190,220,${r.life * 0.6})`; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.ellipse(r.x - camX, gy + r.y, r.r * 2, r.r * 0.5, 0, 0, 7); ctx.stroke();
    });
  } else {
    ctx.strokeStyle = 'rgba(240,245,250,0.5)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(sx - 50, gy - 2); ctx.lineTo(sx - 20, gy + 3); ctx.lineTo(sx + 10, gy - 1); ctx.moveTo(sx + 40, gy + 2); ctx.lineTo(sx + 60, gy - 3); ctx.stroke();
  }
  ctx.restore();
  // lily pads bob
  [[-50, 0], [-8, 3], [52, -1]].forEach(([dx, dy], i) => {
    const bob = frozen ? 0 : Math.sin(tick * 0.04 + i * 2) * 0.8;
    ctx.fillStyle = 'rgba(70,120,60,0.9)';
    ctx.beginPath(); ctx.ellipse(sx + dx, gy + dy + bob, 9, 2.6, 0, 0.3, Math.PI * 2 - 0.3); ctx.lineTo(sx + dx, gy + dy + bob); ctx.fill();
    if (i === 1) { ctx.fillStyle = 'rgba(240,190,210,0.9)'; ctx.beginPath(); ctx.arc(sx + dx + 3, gy + dy + bob - 2, 2.2, 0, 7); ctx.fill(); }
  });
  // the frog on the left lily pad
  if (!frozen) {
    const fb = woods.ribbit > 60 ? -3 : 0;
    drawCritter(sx - 50, gy + fb, 'toad', { color: '#7aa070', scale: 0.5, dir: 1 });
    ctx.textAlign = 'center';
    if (woods.ribbit > 0) {
      ctx.fillStyle = `rgba(200,220,180,${Math.min(1, woods.ribbit / 30)})`; ctx.font = '9px Space Mono, monospace';
      ctx.fillText('ribbit', sx - 50, gy - 18 - (80 - woods.ribbit) * 0.15);
    }
  }
  // cattails at the edges
  [[-100, 1], [-92, 0.8], [96, 1.1], [104, 0.9]].forEach(([dx, h], i) => {
    const sway = Math.sin(tick * 0.03 + i) * 2 + weather.wind * 3;
    ctx.strokeStyle = 'rgba(90,130,60,0.85)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(sx + dx, gy + 2); ctx.quadraticCurveTo(sx + dx, gy - 20 * h, sx + dx + sway, gy - 34 * h); ctx.stroke();
    ctx.fillStyle = 'rgba(110,75,45,0.95)'; ctx.beginPath(); ctx.ellipse(sx + dx + sway, gy - 30 * h, 2, 5, 0, 0, 7); ctx.fill();
  });
  ctx.restore();
}

function drawMushrooms() {
  MUSHROOMS.forEach(m => {
    const sx = m.x - camX;
    if (sx < -60 || sx > W + 60) return;
    const gy = groundY(m.x), s = m.s;
    const pulse = 0.5 + 0.5 * Math.sin(tick * 0.04 + m.x);
    const col = m.hue === 'pink' ? [230, 140, 190] : [120, 220, 210];
    ctx.save();
    drawGlow(sx, gy - 26 * s, 60 * s, 0.12 + 0.08 * pulse, col);
    // stem
    ctx.fillStyle = 'rgba(230,220,200,0.9)';
    ctx.beginPath(); ctx.moveTo(sx - 5 * s, gy); ctx.quadraticCurveTo(sx - 3 * s, gy - 14 * s, sx - 4 * s, gy - 26 * s);
    ctx.lineTo(sx + 4 * s, gy - 26 * s); ctx.quadraticCurveTo(sx + 3 * s, gy - 14 * s, sx + 5 * s, gy); ctx.fill();
    // cap — squashes when bounced on
    const sq = m.squish;
    ctx.translate(sx, gy - 26 * s);
    ctx.scale(1 + sq * 0.25, 1 - sq * 0.45);
    ctx.fillStyle = `rgba(${col.join(',')},${0.75 + 0.2 * pulse})`;
    ctx.beginPath(); ctx.ellipse(0, 0, 22 * s, 16 * s, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,240,0.8)';
    [[-10, -6, 3], [2, -11, 2.5], [11, -5, 2.6], [-2, -4, 1.8]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, 7); ctx.fill(); });
    if (weather.snowCover > 0.05) { ctx.fillStyle = `rgba(240,244,250,${weather.snowCover * 0.8})`; ctx.beginPath(); ctx.ellipse(0, -12 * s, 14 * s, 4 * s, 0, Math.PI, 0); ctx.fill(); }
    ctx.restore();
  });
  woods.spores.forEach(p => {
    ctx.fillStyle = p.pink ? `rgba(240,170,210,${p.life})` : `rgba(160,240,225,${p.life})`;
    ctx.beginPath(); ctx.arc(p.x - camX, p.y, 1.6, 0, 7); ctx.fill();
  });
}

function drawShovelPickup() {
  if (hasItem('shovel')) return;
  const sx = SHOVEL_X - camX; if (sx < -40 || sx > W + 40) return;
  const gy = groundY(SHOVEL_X);
  ctx.save(); ctx.translate(sx, gy + 2); ctx.rotate(0.18);
  ctx.strokeStyle = 'rgba(160,120,75,0.95)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -40); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, -40); ctx.lineTo(6, -40); ctx.stroke();
  ctx.fillStyle = 'rgba(175,182,192,0.9)';
  ctx.beginPath(); ctx.moveTo(-7, -6); ctx.lineTo(7, -6); ctx.lineTo(6, 4); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fill();
  ctx.restore();
  const t = (tick * 0.02) % 1;
  ctx.fillStyle = `rgba(255,235,170,${(1 - t) * 0.8})`; ctx.fillRect(sx + 8 - 0.6, gy - 30 - t * 16, 1.2, 5); ctx.fillRect(sx + 8 - 2.5, gy - 28 - t * 16, 5, 1.2);
  ctx.fillStyle = 'rgba(230,205,160,0.6)'; ctx.font = '8px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText('shovel', sx, gy - 50);
}

// everything in the woods that sits behind the player
function drawWoodsBack() {
  BIG_TREES.forEach(t => drawBigTree(t.x, t.s, t.seed, t.swing));
  drawHome();
  drawShovelPickup();
  drawSignpost();
  drawPond();
  drawMushrooms();
}

/* ══════════════════════════════════════════
   DRAW — in front of the player
══════════════════════════════════════════ */
const GRASS_STEP = 11;
const FLOWER_COLS = ['230,150,180', '240,210,120', '170,190,240', '240,240,230'];

function drawGrass() {
  const a = weather.amt;
  const closed = Math.min(1, (a.rain + a.storm) * 1.2); // flowers close up in the rain
  const i0 = Math.floor((camX - 20) / GRASS_STEP), i1 = Math.ceil((camX + W + 20) / GRASS_STEP);
  const nearPlayer = player._py > groundY(player.wx) - 14;
  const flowers = [];
  ctx.save();
  ctx.strokeStyle = 'rgba(100,150,65,0.75)'; ctx.lineWidth = 1; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = i0; i <= i1; i++) {
    const x = i * GRASS_STEP + hash(i) * 6;
    if (x < 0 || x > WORLD_W || (x > 2840 && x < 3560) || Math.abs(x - POND_X) < 100) continue;
    const gy = groundY(x) + 1, sx = x - camX;
    let bend = Math.sin(tick * 0.03 + x * 0.05) * 0.12 + weather.wind * 0.18;
    const d = x - player.wx;
    if (nearPlayer && Math.abs(d) < 18) bend += Math.sign(d || 1) * 0.7 * (1 - Math.abs(d) / 18);
    for (let b = 0; b < 3; b++) {
      const h = 5 + hash(i * 3 + b) * 8, ang = bend + (b - 1) * 0.3;
      const tx = sx + (b - 1) * 2 + Math.sin(ang) * h, ty = gy - Math.cos(ang) * h;
      ctx.moveTo(sx + (b - 1) * 2, gy);
      ctx.quadraticCurveTo(sx + (b - 1) * 2, gy - h * 0.5, tx, ty);
      if (b === 1 && hash(i * 7) < 0.12) flowers.push([tx, ty, FLOWER_COLS[i % FLOWER_COLS.length]]);
    }
  }
  ctx.stroke();
  flowers.forEach(([x, y, c]) => {
    ctx.fillStyle = `rgba(${c},${0.85 - closed * 0.35})`;
    ctx.beginPath(); ctx.arc(x, y, 2.2 * (1 - closed * 0.55), 0, 7); ctx.fill();
  });
  ctx.restore();
}

function drawFireflies() {
  const a = weather.amt;
  const vis = Math.max(0, 1 - (a.rain * 0.9 + a.storm + a.snow * 0.8 + a.wind * 0.5 + a.fog * 0.3));
  if (vis < 0.02) return;
  ctx.save();
  FIREFLIES.forEach((f, i) => {
    if (QUALITY < 1 && i % 2) return;   // phones: half as many
    const sx = f.x - camX;
    if (sx < -20 || sx > W + 20) return;
    const p = Math.pow(0.5 + 0.5 * Math.sin(tick * 0.06 * f.sp + f.ph * 4), 2);
    const al = vis * (0.25 + 0.75 * p);
    drawGlow(sx, f.y, 12, 0.35 * al, [220, 240, 140]);
    ctx.fillStyle = `rgba(240,250,170,${al})`;
    ctx.beginPath(); ctx.arc(sx, f.y, 1.4, 0, 7); ctx.fill();
  });
  ctx.restore();
}

function drawDust() {
  woods.puffs.forEach(p => {
    const c = p.kind === 'snow' ? '240,244,250' : p.kind === 'wet' ? '160,180,210' : '170,150,120';
    ctx.fillStyle = `rgba(${c},${p.life * 0.35})`;
    ctx.beginPath(); ctx.arc(p.x - camX, p.y, p.r, 0, 7); ctx.fill();
  });
}

/* soft radial glow helper */
function drawGlow(x, y, r, a, rgb) {
  const c = (rgb || [255, 190, 110]).join(',');
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
