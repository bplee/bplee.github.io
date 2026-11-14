/* ══════════════════════════════════════════
   THE COURT — sand, chalk lines, net, string lights, bench + spectators, scoreboard
══════════════════════════════════════════ */
const COURT_DEP = 34; // fake depth of the court (perspective)
const SAND = Array.from({ length: 140 }, () => ({ x: COURT_L - 20 + Math.random() * (COURT_R - COURT_L + 40), d: Math.random(), r: 0.6 + Math.random() * 1.2 }));
const LIGHT_POLES = [COURT_L - 45, COURT_R + 35];
const spectators = [
  { kind: 'toad',  x: 2786, color: '#7aa070', hop: 0, hv: 0, s: 0.6 },
  { kind: 'snail', x: 2814, color: '#c0b080', hop: 0, hv: 0, s: 0.7 },
];
const scoreboard = { you: 0, them: 0, flipYou: 0, flipThem: 0 };

function courtPt(x, depth) { // depth 0 = front edge, 1 = back edge
  const gy = COURT_GND();
  return [x - camX + COURT_DEP * depth, gy - COURT_DEP * 0.4 * depth];
}

function drawNet() {
  const sx = NET_X - camX;
  if (sx < -900 || sx > W + 900) return;
  const gy = COURT_GND();
  const flick = 0.85 + Math.sin(tick * 0.19) * 0.06;
  ctx.save();

  // string lights: poles + a sagging wire of warm bulbs, swaying in the wind
  const [p1, p2] = LIGHT_POLES, PH = 190;
  [p1, p2].forEach(px => {
    ctx.fillStyle = '#3a2a1c'; ctx.fillRect(px - camX - 2.5, groundY(px) - PH, 5, PH);
    ctx.fillRect(px - camX - 6, groundY(px) - PH, 12, 4);
  });
  const sway = Math.sin(tick * 0.02) * 4 + weather.wind * 6;
  const wireY = x => { const t = (x - p1) / (p2 - p1); return gy - PH + 4 + Math.sin(t * Math.PI) * (46 + sway * 0.4); };
  ctx.strokeStyle = 'rgba(40,32,24,0.9)'; ctx.lineWidth = 1;
  ctx.beginPath(); for (let x = p1; x <= p2; x += 10) { const y = wireY(x); x === p1 ? ctx.moveTo(x - camX, y) : ctx.lineTo(x - camX, y); } ctx.stroke();
  const BULBS = ['255,200,120', '255,170,110', '250,225,150'];
  for (let i = 1; i < 18; i++) {
    const x = p1 + (p2 - p1) * i / 18, y = wireY(x) + 6;
    const tw = 0.75 + 0.25 * Math.sin(tick * 0.05 + i * 1.7);
    ctx.strokeStyle = 'rgba(40,32,24,0.9)'; ctx.beginPath(); ctx.moveTo(x - camX, y - 6); ctx.lineTo(x - camX, y - 2); ctx.stroke();
    ctx.fillStyle = `rgba(${BULBS[i % 3]},${0.95 * tw * flick})`; ctx.beginPath(); ctx.ellipse(x - camX, y + 1, 2.6, 3.4, 0, 0, 7); ctx.fill();
    drawGlow(x - camX, y + 1, 26, 0.18 * tw * flick, BULBS[i % 3].split(',').map(Number));
  }
  // a soft warm pool on the sand under the lights
  const pool = ctx.createRadialGradient(sx, gy, 20, sx, gy, 420);
  pool.addColorStop(0, `rgba(255,190,120,${0.09 * flick})`); pool.addColorStop(1, 'rgba(255,190,120,0)');
  ctx.fillStyle = pool; ctx.fillRect(sx - 420, gy - 160, 840, 180);

  // sand
  const [fl, fy] = courtPt(COURT_L - 20, 0), [fr] = courtPt(COURT_R + 20, 0);
  const [bl, by] = courtPt(COURT_L - 20, 1), [br] = courtPt(COURT_R + 20, 1);
  const sg = ctx.createLinearGradient(0, by, 0, fy);
  sg.addColorStop(0, 'rgba(190,170,120,0.16)'); sg.addColorStop(1, 'rgba(215,195,140,0.3)');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.moveTo(fl, fy); ctx.lineTo(fr, fy); ctx.lineTo(br, by); ctx.lineTo(bl, by); ctx.closePath(); ctx.fill();
  SAND.forEach(p => { const [x, y] = courtPt(p.x, p.d); ctx.fillStyle = 'rgba(230,210,160,0.25)'; ctx.fillRect(x, y, p.r, p.r); });
  if (weather.snowCover > 0.05) { ctx.fillStyle = `rgba(235,240,248,${weather.snowCover * 0.45})`; ctx.beginPath(); ctx.moveTo(fl, fy); ctx.lineTo(fr, fy); ctx.lineTo(br, by); ctx.lineTo(bl, by); ctx.closePath(); ctx.fill(); }

  // chalk lines: boundary + centre line under the net
  ctx.strokeStyle = 'rgba(245,240,225,0.6)'; ctx.lineWidth = 1.5;
  const c = (x, d) => courtPt(x, d);
  ctx.beginPath();
  ctx.moveTo(...c(COURT_L, 0)); ctx.lineTo(...c(COURT_R, 0)); ctx.lineTo(...c(COURT_R, 1)); ctx.lineTo(...c(COURT_L, 1)); ctx.closePath();
  ctx.moveTo(...c(NET_X, 0)); ctx.lineTo(...c(NET_X, 1));
  ctx.stroke();
  // corner flags
  [[COURT_L, 0], [COURT_R, 0], [COURT_L, 1], [COURT_R, 1]].forEach(([x, d], i) => {
    const [px, py] = c(x, d), fl2 = Math.sin(tick * 0.08 + i) * 2 + weather.wind * 3;
    ctx.strokeStyle = 'rgba(200,190,170,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 18); ctx.stroke();
    ctx.fillStyle = i % 2 ? 'rgba(220,110,90,0.85)' : 'rgba(110,170,210,0.85)';
    ctx.beginPath(); ctx.moveTo(px, py - 18); ctx.lineTo(px + 9 + fl2, py - 15); ctx.lineTo(px, py - 12); ctx.fill();
  });

  // bench + spectators (they hop when someone scores)
  const bx = 2800;
  ctx.fillStyle = '#4a3522'; ctx.fillRect(bx - 32 - camX, groundY(bx) - 16, 64, 4);
  ctx.fillRect(bx - 28 - camX, groundY(bx) - 12, 3, 12); ctx.fillRect(bx + 25 - camX, groundY(bx) - 12, 3, 12);
  spectators.forEach(sp => drawCritter(sp.x - camX, groundY(bx) - 16 + sp.hop, sp.kind, { color: sp.color, scale: sp.s, dir: 1 }));
  // a basket of spare balls
  ctx.fillStyle = '#5a4230'; ctx.fillRect(bx + 44 - camX, groundY(bx + 44) - 14, 20, 14);
  [[48, -16], [56, -17], [52, -22]].forEach(([dx, dy]) => { ctx.fillStyle = 'rgba(225,215,180,0.9)'; ctx.beginPath(); ctx.arc(bx + dx - camX, groundY(bx) + dy, 4.5, 0, 7); ctx.fill(); });

  // scoreboard on a stand, with flip cards
  const sbx = COURT_R + 70 - camX, sby = groundY(COURT_R + 70);
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(sbx - 34, sby - 70, 4, 70); ctx.fillRect(sbx + 30, sby - 70, 4, 70);
  ctx.fillStyle = '#2a1f16'; manualRoundRect(sbx - 44, sby - 112, 88, 50, 4); ctx.fill();
  ctx.strokeStyle = 'rgba(170,135,95,0.7)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(230,205,160,0.7)'; ctx.font = '8px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText('first to ' + POINTS_TO_WIN, sbx, sby - 102);
  [['you', vball.playerScore, scoreboard.flipYou, -20], ['them', vball.enemyScore, scoreboard.flipThem, 20]].forEach(([lbl, n, flip, dx]) => {
    const k = flip > 0 ? Math.abs(Math.cos((1 - flip / 20) * Math.PI)) : 1; // card flips over
    ctx.save(); ctx.translate(sbx + dx, sby - 82); ctx.scale(1, Math.max(0.05, k));
    ctx.fillStyle = 'rgba(235,225,200,0.92)'; ctx.fillRect(-12, -12, 24, 24);
    ctx.fillStyle = '#2a1f16'; ctx.font = 'bold 15px Space Mono, monospace'; ctx.fillText(String(n), 0, 5);
    ctx.restore();
    ctx.fillStyle = 'rgba(230,205,160,0.7)'; ctx.font = '8px Space Mono, monospace'; ctx.fillText(lbl, sbx + dx, sby - 64 + 0);
  });

  // ── the net: two posts in perspective, a mesh band, top tape, antennas ──
  const [nfX, nfY] = c(NET_X, 0), [nbX, nbY] = c(NET_X, 1);
  const top = NET_H, band = 46;
  // back post + guy rope
  ctx.strokeStyle = 'rgba(150,120,85,0.7)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(nbX, nbY); ctx.lineTo(nbX, nbY - top - 6); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,190,170,0.35)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(nbX, nbY - top); ctx.lineTo(nbX + 26, nbY + 2); ctx.stroke();
  // mesh band
  const sag = 2 + Math.sin(tick * 0.03) * 0.6 + Math.abs(weather.wind) * 1.2;
  ctx.strokeStyle = 'rgba(225,215,190,0.35)'; ctx.lineWidth = 0.6;
  for (let i = 0; i <= 6; i++) {
    const t = i / 6, x = nfX + (nbX - nfX) * t, y = nfY + (nbY - nfY) * t;
    ctx.beginPath(); ctx.moveTo(x, y - top); ctx.lineTo(x, y - top + band); ctx.stroke();
  }
  for (let j = 0; j <= band; j += 7) {
    ctx.beginPath(); ctx.moveTo(nfX, nfY - top + j); ctx.quadraticCurveTo((nfX + nbX) / 2, (nfY + nbY) / 2 - top + j + sag, nbX, nbY - top + j); ctx.stroke();
  }
  // bottom cord down to the posts
  ctx.strokeStyle = 'rgba(200,190,170,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(nfX, nfY - top + band); ctx.lineTo(nbX, nbY - top + band); ctx.stroke();
  // top tape
  ctx.strokeStyle = 'rgba(245,240,225,0.95)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(nfX, nfY - top); ctx.quadraticCurveTo((nfX + nbX) / 2, (nfY + nbY) / 2 - top + sag * 0.6, nbX, nbY - top); ctx.stroke();
  // front post (wood, with a cap) + its guy rope
  ctx.fillStyle = '#5a4230'; ctx.fillRect(nfX - 2.5, nfY - top - 8, 5, top + 8);
  ctx.fillStyle = '#7a5a3a'; ctx.fillRect(nfX - 4, nfY - top - 10, 8, 3);
  ctx.strokeStyle = 'rgba(200,190,170,0.45)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(nfX, nfY - top); ctx.lineTo(nfX - 24, nfY + 2); ctx.stroke();
  // antennas (striped)
  [[nfX, nfY], [nbX, nbY]].forEach(([x, y], k) => {
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = i % 2 ? `rgba(240,240,240,${k ? 0.4 : 0.8})` : `rgba(220,80,80,${k ? 0.4 : 0.8})`;
      ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 1, y - top - i * 5); ctx.lineTo(x - 1, y - top - i * 5 - 5); ctx.stroke();
    }
  });
  ctx.restore();
}

function updateCourtDecor() {
  spectators.forEach(sp => { if (sp.hv !== 0 || sp.hop < 0) { sp.hop += sp.hv; sp.hv += 0.4; if (sp.hop >= 0) { sp.hop = 0; sp.hv = 0; } } });
  if (scoreboard.flipYou > 0) scoreboard.flipYou--;
  if (scoreboard.flipThem > 0) scoreboard.flipThem--;
}
function cheer() { spectators.forEach((sp, i) => setTimeout(() => { if (sp.hop === 0) sp.hv = -4.5; }, i * 120)); }

/* ══════════════════════════════════════════
   VOLLEYBALL GAME STATE
   Phases:
   'inactive'       — not in game, animals idle on the court
   'player_serve'   — ball hovers at player back line, player walks/jumps into it
   'enemy_serve'    — hedgehog walks up to the floating ball and serves
   'player_receive' — ball coming to player side, player gets under it (auto-pass)
   'player_pass'    — bunny partner runs under the pass and sets
   'player_spike'   — ball set for the player; double-jump near it to spike
   'enemy_receive'  — hedgehog digs the ball to the ferret
   'enemy_pass'     — ferret sets the hedgehog
   'enemy_spike'    — hedgehog attacks over the net
   'dead'           — ball hit the net, nobody plays it
   'point_scored'   — short pause, then next serve
   'game_over'      — someone won, short celebration, then game ends
══════════════════════════════════════════ */
const BALL_G        = 0.28;
const POINTS_TO_WIN = 5;   // first to 5

const vball = {
  active: false,
  phase:  'inactive',
  timer:  0,

  bx: 0, by: 0, bvx: 0, bvy: 0,
  bRadius: 12,
  trail: [],
  floatBaseY: 0,
  lastTouch: null,   // 'player' | 'enemy'

  playerScore: 0,
  enemyScore:  0,
  nextServer: 'enemy',
};

/* ── NPCs ── */
function makeNPC(home, kind, color, name, side) {
  return { x: home, home, kind, color, name, side, hopY: 0, hopV: 0, walk: 0, react: 0, seed: Math.random() * 10 };
}
const partner = makeNPC(3110, 'bunny',    '#e8d5c0', 'clover', 1);
const foxSet  = makeNPC(3290, 'ferret',   '#d8c4a4', 'ember',  -1);   // (still called foxSet: ember used to be a fox)
const hogHit  = makeNPC(3460, 'hedgehog', '#c8b89a', 'burr',   -1);
const NPCS = [partner, foxSet, hogHit];

function moveNPC(n, tx, speed) {
  const dx   = tx - n.x;
  const step = Math.sign(dx) * Math.min(speed, Math.abs(dx));
  n.x += step;
  n.walk += Math.abs(step);
}
// shuffle around home, like someone bouncing on their toes waiting for the ball
function idleNPC(n, speed) {
  const sway = Math.sin(tick * 0.025 + n.seed) * 10 + Math.sin(tick * 0.061 + n.seed * 2) * 4;
  moveNPC(n, n.home + sway, speed || 0.6);
}
function hopNPC(n, v) { if (n.hopY === 0 && n.hopV === 0) n.hopV = v; }
function stepNPC(n) {
  if (n.hopV !== 0 || n.hopY < 0) {
    n.hopY += n.hopV;
    n.hopV += 0.5;
    if (n.hopY >= 0) { n.hopY = 0; n.hopV = 0; }
  }
  n.react = Math.max(0, n.react - 1);
}

/* ── JOIN PROMPT ── */
let joinPromptVisible = false;
let joinCooldown = 0;

function showJoinPrompt() {
  if (joinPromptVisible || vball.active || joinCooldown > 0) return;
  joinPromptVisible = true;
  showHint('press E to join the volleyball game', 99999);
}
function hideJoinPrompt() {
  if (!joinPromptVisible) return;
  joinPromptVisible = false;
  hintBox.classList.remove('visible');
}

window.addEventListener('keydown', e => {
  if (e.code !== 'KeyE' || e.repeat) return;
  if (vball.active) {
    endVolleyball();
    showHint('left the volleyball game', 1800);
  } else if (joinPromptVisible) {
    hideJoinPrompt();
    startVolleyball();
  }
});

/* ── START / END ── */
function startVolleyball() {
  vball.active = true;
  vball.playerScore = 0;
  vball.enemyScore  = 0;
  vball.nextServer  = 'enemy';
  scoreboard.flipYou = scoreboard.flipThem = 0;
  document.getElementById('score-box').style.display = 'flex';
  updateScoreDisplay();
  meet('clover', "let's win this one! you bump, i set, you spike.");
  meet('ember', 'oh good, fresh competition.');
  meet('burr', "i don't cheat. i just win a lot.");
  player.wx = Math.min(player.wx, NET_X - 80);
  beginNextRally();
}

function endVolleyball() {
  vball.active = false;
  vball.phase  = 'inactive';
  vball.trail  = [];
  document.getElementById('score-box').style.display = 'none';
  hideJoinPrompt();
  joinCooldown = 180;
}

function updateScoreDisplay(scorer) {
  document.getElementById('sb-you').textContent  = vball.playerScore;
  document.getElementById('sb-them').textContent = vball.enemyScore;
  document.getElementById('sb-note').textContent =
    vball.phase === 'game_over' ? 'game!' : `first to ${POINTS_TO_WIN} · ${vball.nextServer === 'player' ? 'your serve' : 'their serve'}`;
  if (scorer) {
    const el = document.getElementById(scorer === 'player' ? 'sb-you' : 'sb-them');
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }
}

/* ── RALLY CONTROL ── */
function beginNextRally() {
  const gY = COURT_GND();
  vball.trail = [];
  vball.lastTouch = null;
  vball.bvx = 0; vball.bvy = 0;
  vball.floatBaseY = gY - 62;
  vball.by = vball.floatBaseY;
  if (vball.nextServer === 'player') {
    vball.phase = 'player_serve';
    vball.timer = 30;
    vball.bx = PLAYER_SERVE_X;
    showHint('walk or jump into the ball to serve', 99999);
  } else {
    vball.phase = 'enemy_serve';
    vball.timer = 50;
    vball.bx = ENEMY_SERVE_X;
    showHint('incoming serve…', 1600);
  }
}

/* ── SCORE POINT ── */
function scorePoint(winner, msg) {
  if (vball.phase === 'point_scored' || vball.phase === 'game_over') return;
  if (winner === 'player') { vball.playerScore++; vball.nextServer = 'player'; scoreboard.flipYou = 20; }
  else                     { vball.enemyScore++;  vball.nextServer = 'enemy';  scoreboard.flipThem = 20; }
  vball.bvx = 0; vball.bvy = 0;
  cheer();

  if (Math.max(vball.playerScore, vball.enemyScore) >= POINTS_TO_WIN) {
    const won = vball.playerScore > vball.enemyScore;
    vball.phase = 'game_over';
    vball.timer = 240;
    updateScoreDisplay(winner);
    showHint(won ? `you win ${vball.playerScore}–${vball.enemyScore}!`
                 : `they win ${vball.enemyScore}–${vball.playerScore}. good game`, 4000);
    if (won) { setTimeout(() => give('bracelet', 'clover'), 1500); achieve('champ'); }
    return;
  }
  vball.phase = 'point_scored';
  vball.timer = 100;
  updateScoreDisplay(winner);
  showHint(msg + (winner === 'player' ? '  +1 you' : '  +1 them'), 2000);
}

/* ── BALL HELPERS ── */
// Exact launch for the discrete integrator used in updateBall:
// after T steps, y = y1 + T*vy + g*T*(T-1)/2
function launchTo(x2, y2, T) {
  vball.bvx = (x2 - vball.bx) / T;
  vball.bvy = (y2 - vball.by - BALL_G * T * (T - 1) / 2) / T;
}

function pathClearsNet() {
  const gY = COURT_GND(), netTop = gY - NET_H;
  let x = vball.bx, y = vball.by, vx = vball.bvx, vy = vball.bvy;
  for (let i = 0; i < 400; i++) {
    const px = x;
    x += vx; y += vy; vy += BALL_G; vx += windAccel();
    if ((px < NET_X) !== (x < NET_X)) return y < netTop - vball.bRadius * 0.5;
    if (y >= gY) return true;
  }
  return true;
}

// Aim at a target on the other side; adds arc until the ball clears the net.
function launchOverNet(x2, y2, T) {
  for (let t = T; t < T + 120; t += 2) {
    launchTo(x2, y2, t);
    if (pathClearsNet()) return;
  }
}

// Where will the ball be (x) when it comes down through height targetY?
function predictX(targetY) {
  let x = vball.bx, y = vball.by, vx = vball.bvx, vy = vball.bvy;
  for (let i = 0; i < 400; i++) {
    if (vy > 0 && y >= targetY) return x;
    x += vx; y += vy; vy += BALL_G; vx += windAccel();
  }
  return x;
}

/* ── BALL PHYSICS ── */
function updateBall() {
  if (vball.phase === 'player_serve' || vball.phase === 'enemy_serve') {
    vball.by = vball.floatBaseY + Math.sin(tick * 0.05) * 4;
    vball.trail = [];
    return;
  }
  if (vball.phase === 'point_scored' || vball.phase === 'game_over') return;

  vball.trail.push({ x: vball.bx, y: vball.by });
  if (vball.trail.length > 12) vball.trail.shift();

  const prevX = vball.bx;
  vball.bx  += vball.bvx;
  vball.by  += vball.bvy;
  vball.bvy += BALL_G;
  vball.bvx += windAccel(); // the wind pushes the ball around

  const gY = COURT_GND();

  // Net — detect the crossing so fast balls can't tunnel through
  if ((prevX < NET_X) !== (vball.bx < NET_X) && vball.by > gY - NET_H) {
    const fromLeft = prevX < NET_X;
    vball.bx  = NET_X + (fromLeft ? -1 : 1) * vball.bRadius * 0.6;
    vball.bvx = (fromLeft ? -1 : 1) * Math.max(0.5, Math.abs(vball.bvx) * 0.25);
    vball.bvy *= 0.4;
    vball.phase = 'dead';
    showHint('into the net!', 1200);
  }

  // Ground
  if (vball.by >= gY - vball.bRadius) {
    vball.by = gY - vball.bRadius;
    const x = vball.bx;
    if (x >= COURT_L && x < NET_X)       scorePoint('enemy',  vball.phase === 'dead' ? 'into the net' : 'it dropped on your side');
    else if (x >= NET_X && x <= COURT_R) scorePoint('player', vball.phase === 'dead' ? 'they hit the net' : 'it landed on their side!');
    else if (vball.lastTouch === 'player') scorePoint('enemy', 'out of bounds');
    else                                   scorePoint('player', 'their ball went out!');
  }
}

/* ── PLAYER ACTIONS ── */
// does the ball overlap the mouse's body (plus some forgiveness)?
function ballTouchesPlayer(pad) {
  const b = playerBox(), r = vball.bRadius + pad;
  return Math.abs(vball.bx - b.cx) < b.half + r && vball.by > b.top - r && vball.by < b.bottom + r;
}
// distance from the ball to the mouse's raised hands
function ballToHands() {
  const b = playerBox();
  return Math.hypot(vball.bx - (player.wx + (player.facingRight ? 4 : -4) * b.s), vball.by - (b.top - 2 * b.s));
}
const reachBonus = () => wearing('bracelet') ? 10 : 0;

function playerContactServeBall() {
  if (vball.timer > 0 || !ballTouchesPlayer(6)) return;
  player.bumpT = 12;

  const gY = COURT_GND();
  vball.lastTouch = 'player';
  launchOverNet(NET_X + 90 + Math.random() * 200, gY - vball.bRadius, 72);
  vball.phase = 'enemy_receive';
  hogHit.react = 14;
  showHint('nice serve!', 1200);
}

// Auto-pass when the ball comes down near the player (forgiving)
function tryPlayerReceive() {
  if (vball.bx >= NET_X) return;
  // the ball touches you (anywhere — head, arms, a jump into it), or drops just beside you
  const touching = ballTouchesPlayer(14 + reachBonus());
  const b = playerBox();
  const nearDrop = vball.bvy > 0 && vball.by > b.top && Math.abs(vball.bx - player.wx) < b.half + vball.bRadius + 26 + reachBonus();
  if (!touching && !nearDrop) return;

  player.bumpT = 14;
  const gY = COURT_GND();
  vball.lastTouch = 'player';
  launchTo(partner.home + (Math.random() - 0.5) * 50, gY - 70, 50);
  vball.phase = 'player_pass';
  showHint('good pass! clover has it…', 1600);
}

function partnerSet() {
  const gY   = COURT_GND();
  // set toward wherever the player is standing (within reason)
  const setX = Math.max(COURT_L + 60, Math.min(NET_X - 50, 3060 + (player.wx - 3060) * 0.5));
  vball.lastTouch = 'player';
  launchTo(setX, gY - NET_H - 40, 46); // set height suits the mouse's reach
  hopNPC(partner, -4);
  vball.phase = 'player_spike';
  showHint('jump into the set to spike it  ·  hold ↓ to tip', 99999);
}

// Called on a mid-air jump press. Returns true if the ball was hit.
// Called on a mid-air jump press (longer reach) or automatically when the ball meets your hands.
function attemptSpike(auto) {
  if (vball.phase !== 'player_spike') return false;
  const reach = (auto ? 20 + vball.bRadius : 72) + reachBonus();
  if (ballToHands() > reach) return false;

  const gY  = COURT_GND();
  const tip = keys['ArrowDown'] || keys['KeyS'];
  vball.lastTouch = 'player';
  if (tip) launchOverNet(NET_X + 35 + Math.random() * 45, gY - vball.bRadius, 34);
  else     launchOverNet(NET_X + 110 + Math.random() * 190, gY - vball.bRadius, 22);
  player.flipActive    = true;
  player.flipRotation  = 0;
  player.flipDirection = 1;
  player.jumpCount     = 2;
  player.bumpT         = 10;
  vball.phase = 'enemy_receive';
  hogHit.react = tip ? 6 : 10;
  showHint(tip ? 'tip!' : 'spike!', 900);
  return true;
}

// the set lands on you while you're standing: pop it over gently instead of letting it pass through you
function freeBall() {
  const gY = COURT_GND();
  vball.lastTouch = 'player';
  player.bumpT = 14;
  launchOverNet(NET_X + 60 + Math.random() * 120, gY - vball.bRadius, 48);
  vball.phase = 'enemy_receive';
  hogHit.react = 4;
  showHint('a little bump over. (jump into the set to spike!)', 1800);
}

/* ── PARTNER (bunny) ── */
function updatePartner() {
  const gY   = COURT_GND();
  const minX = COURT_L + 30, maxX = NET_X - 22;
  const clampP = x => Math.max(minX, Math.min(maxX, x));

  switch (vball.phase) {
    case 'player_pass': {
      // run under the pass
      moveNPC(partner, clampP(predictX(gY - 60)), 2.6);
      if (vball.bvy > 0 && vball.by >= gY - 75 && Math.abs(vball.bx - partner.x) < 28) partnerSet();
      break;
    }
    case 'player_spike':
      // step toward the net, out of the hitter's way
      moveNPC(partner, clampP(partner.home + 12), 1.4);
      break;
    case 'player_receive': {
      // lean toward where the ball is coming down, ready to chase the pass
      const land = predictX(gY);
      const tx = partner.home + Math.max(-30, Math.min(30, (land - partner.home) * 0.2));
      moveNPC(partner, clampP(tx), 1.2);
      break;
    }
    case 'enemy_receive':
    case 'enemy_pass':
    case 'enemy_spike':
      // track the ball on the far side a little
      moveNPC(partner, clampP(partner.home + Math.max(-20, Math.min(10, (vball.bx - NET_X) * -0.1))), 0.9);
      break;
    case 'game_over':
      idleNPC(partner);
      if (vball.playerScore > vball.enemyScore && tick % 40 === 0) hopNPC(partner, -5);
      break;
    default:
      idleNPC(partner, 1.2);
  }
}

/* ── ENEMIES (ferret setter + hedgehog hitter) ── */
function updateEnemies() {
  const gY   = COURT_GND();
  const minX = NET_X + 22, maxX = COURT_R + 30;
  const clampE = x => Math.max(minX, Math.min(maxX, x));

  switch (vball.phase) {
    case 'enemy_serve': {
      idleNPC(foxSet);
      if (vball.timer > 0) { moveNPC(hogHit, ENEMY_SERVE_X + 60, 1.5); break; }
      moveNPC(hogHit, vball.bx + 8, 2.2);
      if (hogHit.x <= vball.bx + 12) {
        vball.lastTouch = 'enemy';
        hopNPC(hogHit, -4);
        launchOverNet(NET_X - 80 - Math.random() * 200, gY - vball.bRadius, 72);
        vball.phase = 'player_receive';
        showHint('incoming! get under the ball', 2000);
      }
      break;
    }
    case 'enemy_receive': {
      idleNPC(foxSet, 1.0);
      if (hogHit.react > 0) break;
      // smart enough to let a ball sail out
      if (predictX(gY) > COURT_R + 8) { moveNPC(hogHit, hogHit.home, 1.5); break; }
      moveNPC(hogHit, clampE(predictX(gY - 40)), 2.7);
      if (vball.bx > NET_X && vball.bvy > 0 && vball.by >= gY - 60 && Math.abs(vball.bx - hogHit.x) < 32) {
        vball.lastTouch = 'enemy';
        launchTo(foxSet.home + (Math.random() - 0.5) * 40, gY - 70, 50);
        hopNPC(hogHit, -3);
        vball.phase = 'enemy_pass';
        showHint('burr digs it…', 1000);
      }
      break;
    }
    case 'enemy_pass': {
      moveNPC(foxSet, clampE(predictX(gY - 60)), 2.6);
      moveNPC(hogHit, hogHit.home - 30, 1.4); // hitter backs off to approach
      if (vball.bvy > 0 && vball.by >= gY - 75 && Math.abs(vball.bx - foxSet.x) < 28) {
        vball.lastTouch = 'enemy';
        launchTo(NET_X + 55 + Math.random() * 35, gY - NET_H - 45, 46);
        hopNPC(foxSet, -4);
        vball.phase = 'enemy_spike';
        showHint('ember sets…', 900);
      }
      break;
    }
    case 'enemy_spike': {
      idleNPC(foxSet, 1.0);
      const hitY = gY - NET_H - 30;
      moveNPC(hogHit, clampE(predictX(hitY) + 6), 3.0);
      if (vball.bvy > 0 && vball.by >= hitY && Math.abs(vball.bx - hogHit.x) < 34) {
        vball.lastTouch = 'enemy';
        hopNPC(hogHit, -6);
        const fumble = wearing('peanut') ? 0.22 : 0.08; // the lucky peanut makes them nervous
        if (Math.random() < fumble) launchTo(NET_X - 10, gY - NET_H * 0.5, 14); // whoops
        else launchOverNet(NET_X - 60 - Math.random() * 230, gY - vball.bRadius, 26);
        vball.phase = 'player_receive';
        showHint('burr spikes it!', 1200);
      }
      break;
    }
    case 'point_scored':
      idleNPC(foxSet, 1.2);
      if (vball.nextServer === 'enemy') moveNPC(hogHit, ENEMY_SERVE_X + 60, 1.2);
      else idleNPC(hogHit, 1.2);
      break;
    case 'game_over':
      idleNPC(foxSet); idleNPC(hogHit);
      if (vball.enemyScore > vball.playerScore && tick % 40 === 0) { hopNPC(foxSet, -5); hopNPC(hogHit, -5); }
      break;
    default:
      idleNPC(foxSet, 1.2);
      idleNPC(hogHit, 1.4);
  }
}

/* ── PER-STEP VOLLEYBALL UPDATE ── */
function updateVolleyball() {
  joinCooldown = Math.max(0, joinCooldown - 1);
  if (!vball.active) {
    NPCS.forEach(n => { idleNPC(n, 1.0); stepNPC(n); });
    return;
  }
  vball.timer = Math.max(0, vball.timer - 1);

  if (vball.phase === 'game_over' && vball.timer === 0) { endVolleyball(); return; }
  if (vball.phase === 'point_scored' && vball.timer === 0) beginNextRally();
  if (vball.phase === 'player_serve')   playerContactServeBall();
  if (vball.phase === 'player_receive') tryPlayerReceive();
  if (vball.phase === 'player_spike') {
    if (!player.onGround) attemptSpike(true);
    else if (vball.bvy > 0 && ballTouchesPlayer(4)) freeBall();
  }

  updateBall();
  updateCourtDecor();
  updatePartner();
  updateEnemies();
  NPCS.forEach(stepNPC);
}

/* ══════════════════════════════════════════
   DRAW VOLLEYBALL ELEMENTS
══════════════════════════════════════════ */
function drawLandingMarker() {
  if (!vball.active || vball.phase !== 'player_receive') return;
  const gY = COURT_GND();
  const x  = predictX(gY - vball.bRadius);
  if (x >= NET_X) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(220,210,170,0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.ellipse(x - camX, gY, 16, 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBall() {
  if (!vball.active) return;
  const bsx = vball.bx - camX;
  const bsy = vball.by;

  // shadow on ground
  const gY = COURT_GND();
  const shadowScale = Math.max(0.2, 1 - (gY - vball.by) / 300);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(bsx, gY, vball.bRadius*shadowScale*1.5, vball.bRadius*shadowScale*0.4, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  // trail
  vball.trail.forEach((p,i) => {
    const alpha = (i / vball.trail.length) * 0.3;
    const r = vball.bRadius * (i/vball.trail.length) * 0.7;
    ctx.beginPath();
    ctx.arc(p.x - camX, p.y, r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(220,210,170,${alpha})`;
    ctx.fill();
  });

  // ball
  ctx.save();
  const ballGrad = ctx.createRadialGradient(bsx-3, bsy-4, 1, bsx, bsy, vball.bRadius);
  ballGrad.addColorStop(0,   'rgba(240,235,210,0.95)');
  ballGrad.addColorStop(0.6, 'rgba(210,195,155,0.9)');
  ballGrad.addColorStop(1,   'rgba(180,160,110,0.85)');
  ctx.fillStyle = ballGrad;
  ctx.beginPath(); ctx.arc(bsx, bsy, vball.bRadius, 0, Math.PI*2); ctx.fill();
  // seam lines
  ctx.strokeStyle = 'rgba(150,130,90,0.5)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(bsx, bsy, vball.bRadius, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bsx-vball.bRadius, bsy); ctx.lineTo(bsx+vball.bRadius, bsy); ctx.stroke();
  ctx.beginPath();
  ctx.arc(bsx, bsy, vball.bRadius*0.6, -Math.PI*0.15, Math.PI*1.15); ctx.stroke();
  ctx.restore();
}

function drawNPCs() {
  const gY = COURT_GND();
  NPCS.forEach(n => {
    const sx = n.x - camX;
    if (sx < -60 || sx > W + 60) return;
    const bob = Math.abs(Math.sin(n.walk * 0.18)) * 2.5;
    const dir = vball.active ? (vball.bx >= n.x ? 1 : -1) : n.side;
    drawCritter(sx, gY + n.hopY - bob, n.kind, { color: n.color, dir, label: n.name, labelY: n.kind === 'hedgehog' ? 34 : n.kind === 'bunny' ? 64 : 54 });
  });
}
