/* ══════════════════════════════════════════
   PLAYER
══════════════════════════════════════════ */
const player = {
  wx: 140,
  _py: 0,
  _vx: 0,
  vy: 0,
  onGround: false,
  hasBlades: false,
  walkFrame: 0,
  walkTimer: 0,
  facingRight: true,
  isDucking: false,
  jumpCount: 0,
  flipActive: false,
  flipRotation: 0,
  flipDirection: 1,
  // multipliers changed by tavern drinks (see tavern.js)
  mods: { speed: 1, jump: 1, grav: 1 },
};
player._py = 0;

const WALK_SPEED     = 2;
const BLADE_SPEED    = 5;
const BLADE_FRICTION = 0.95;
const JUMP_FORCE     = -10;
const GRAVITY        = 0.45;
const CHAR_H         = 48;

/* ══════════════════════════════════════════
   PLAYER DRAWING
══════════════════════════════════════════ */
function drawPlayer() {
  const s  = playerScale();
  const sx = player.wx - camX;
  const sy = player._py - 14*s;   // legs reach 14s below the hips' origin — lift so the feet touch the ground

  const BODY_W = 11*s, BODY_H = 17*s;
  const SHOULDER_X = BODY_W*0.92, SHOULDER_Y = -28*s;
  const HIP_X = BODY_W*0.3, HIP_Y = -4*s;

  const frame    = player.onGround ? player.walkFrame : 2;
  const legSwing = [0,18,0,-18][frame]*(Math.PI/180);
  const armSwing = [0,-15,0,15][frame]*(Math.PI/180);
  const bodyBob  = player.onGround ? [0,-1,0,1][frame] : 0;

  const lx1=Math.sin(legSwing)*12*s,  ly1=Math.cos(legSwing)*18*s;
  const lx2=Math.sin(-legSwing)*12*s, ly2=Math.cos(-legSwing)*18*s;
  let ax1=Math.sin(armSwing)*14*s,  ay1=-Math.cos(armSwing)*8*s+2*s;
  let ax2=Math.sin(-armSwing)*14*s, ay2=-Math.cos(-armSwing)*8*s+2*s;
  if (player.bumpT > 0) { ax1 = 2*s; ay1 = -15*s; ax2 = 4*s; ay2 = -16*s; } // arms up to meet the ball

  ctx.save();
  const rotation   = player.flipActive ? player.flipDirection*player.flipRotation : 0;
  const rotOriginY = -18*s;
  ctx.translate(sx, sy+bodyBob+rotOriginY);
  ctx.rotate(rotation);
  ctx.translate(0,-rotOriginY);
  if (!player.facingRight) ctx.scale(-1,1);
  ctx.lineCap='round'; ctx.lineJoin='round';

  if (player.hasBlades && Math.abs(player._vx)>3) {
    ctx.strokeStyle='rgba(126,190,154,0.22)'; ctx.lineWidth=1;
    [[-28,-20,-50,-18],[-28,-30,-46,-30],[-28,-40,-44,-42]].forEach(([x1,y1,x2,y2])=>{
      ctx.beginPath(); ctx.moveTo(x1*s,y1*s); ctx.lineTo(x2*s,y2*s); ctx.stroke();
    });
  }

  const ss=(a,w)=>{ ctx.strokeStyle=`rgba(200,185,170,${a})`; ctx.lineWidth=w||1.2; };

  ss(0.75,1.1);
  ctx.beginPath(); ctx.moveTo(-HIP_X,HIP_Y); ctx.lineTo(-HIP_X+lx1,HIP_Y+ly1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( HIP_X,HIP_Y); ctx.lineTo( HIP_X+lx2,HIP_Y+ly2); ctx.stroke();

  if (player.hasBlades) {
    drawRollerblade(-4*s+lx1,-6*s+ly1,s*0.6);
    drawRollerblade( 4*s+lx2,-6*s+ly2,s*0.6);
  }

  ss(0.82);
  ctx.beginPath(); ctx.ellipse(0,-18*s,BODY_W,BODY_H,0.12,0,Math.PI*2); ctx.stroke();

  ss(0.7,1.0);
  ctx.beginPath(); ctx.moveTo(-SHOULDER_X,SHOULDER_Y); ctx.lineTo(-SHOULDER_X+ax1,SHOULDER_Y+ay1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( SHOULDER_X,SHOULDER_Y); ctx.lineTo( SHOULDER_X+ax2,SHOULDER_Y+ay2); ctx.stroke();
  drawWornItems(s, -SHOULDER_X+ax1, SHOULDER_Y+ay1, SHOULDER_X+ax2, SHOULDER_Y+ay2);

  ss(0.88);
  ctx.beginPath(); ctx.ellipse(2*s,-40*s,12*s,11*s,0,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(-6*s,-50*s,6*s,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc( 8*s,-52*s,6*s,0,Math.PI*2); ctx.stroke();
  ctx.strokeStyle='rgba(200,135,140,0.35)'; ctx.lineWidth=0.7;
  ctx.beginPath(); ctx.arc(-6*s,-50*s,3.5*s,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc( 8*s,-52*s,3.5*s,0,Math.PI*2); ctx.stroke();

  ss(0.85,1.0);
  ctx.beginPath(); ctx.arc(7*s,-42*s,3*s,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle='rgba(15,12,12,0.92)'; ctx.beginPath(); ctx.arc(7*s,-42*s,1.8*s,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,240,0.82)'; ctx.beginPath(); ctx.arc(8*s,-43*s,0.8*s,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(200,135,140,0.55)'; ctx.beginPath(); ctx.arc(13*s,-39*s,1.5*s,0,Math.PI*2); ctx.fill();

  ctx.strokeStyle='rgba(220,210,200,0.4)'; ctx.lineWidth=0.6;
  [[13,-38,26,-36],[13,-40,26,-40],[13,-42,26,-45]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath(); ctx.moveTo(x1*s,y1*s); ctx.lineTo(x2*s,y2*s); ctx.stroke();
  });
  ctx.strokeStyle='rgba(185,165,150,0.5)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(-12*s,-10*s); ctx.bezierCurveTo(-28*s,-4*s,-34*s,6*s,-24*s,12*s); ctx.stroke();

  ctx.restore();
}

/* ══════════════════════════════════════════
   PHYSICS UPDATE
══════════════════════════════════════════ */
let _vx = 0;

// Ground height under the player in the current scene
function floorAt(x) {
  if (scene === 'tavern') return tavernFloorAt(x);
  if (scene === 'cavern') return caveFloorY(x);
  return groundY(x);
}

/* ── one-way platforms: the observatory hill outside, the balcony + stairs in the tavern ──
   land on them from above, walk along/up them, jump up through them, ↓ drops through */
function platformY(x) {
  if (scene === 'tavern') return tavernPlatformY(x);
  if (scene === 'cavern') return cavePlatformY(x);
  return null;
}

function platformCollide() {
  if (player.dropT > 0) { player.dropT--; player.onPlatform = false; return; }
  const py = platformY(player.wx);
  if (py === null) { player.onPlatform = false; return; }
  // walking along the floor into the bottom step counts as stepping onto it
  const tol = (player.onGround && !player.onPlatform) ? 9 : 2;
  const landing  = player.vy >= 0 && player.prevPy <= py + tol && player._py >= py - 0.01;
  const sticking = player.onPlatform && player.vy >= 0 && Math.abs(player._py - py) < 16;
  if (landing || sticking) {
    if (!player.onPlatform) { player.jumpCount = 0; player.flipActive = false; player.flipRotation = 0; }
    player._py = py; player.vy = 0;
    player.onGround = true; player.onPlatform = true;
  } else {
    player.onPlatform = false;
  }
}
window.addEventListener('keydown', e => {
  if ((e.code === 'ArrowDown' || e.code === 'KeyS') && !e.repeat && !obs.viewing && player.onPlatform) {
    player.dropT = 12; player.onPlatform = false; player.onGround = false; // hop down through the floor
  }
});

// how big the mouse is on screen (it scales with the window), and its body box
// the mouse's size: fixed on phones (the world is scaled to fit there), a little under the old size on computers
function playerScale() { return MOBILE ? 0.8 : Math.min(W, H) * 0.0012; }
function playerBox() {
  const s = playerScale();
  return { s, top: player._py - 72 * s, bottom: player._py, half: 12 * s, cx: player.wx };
}

function updatePlayer() {
  const outside = scene === 'outside';
  const wasOnGround = player.onGround;
  player.prevPy = player._py;
  let goRight = keys['ArrowRight'] || keys['KeyD'];
  let goLeft  = keys['ArrowLeft']  || keys['KeyA'];
  // after changing scenes, ignore a held direction until it's released
  // (otherwise holding → up the stairs walks you straight back down them)
  if (player.inputLock) {
    if (!goRight && !goLeft) player.inputLock = false;
    goRight = goLeft = false;
  }

  // weather only matters outdoors
  const wx = outside ? weatherPhysics() : { speed: 1, slip: 0, wind: 0 };

  const snowSlow = wearing('scarf') ? 1 : wx.speed; // the scarf keeps you cozy in the snow
  const spd   = (player.hasBlades ? BLADE_SPEED : WALK_SPEED) * player.mods.speed * snowSlow;
  const accel = player.hasBlades ? 0.7 : 0.5;
  let friction = player.isDucking ? 0.98 : (player.hasBlades ? BLADE_FRICTION : 0.9);
  friction += (0.99 - friction) * wx.slip; // wet / snowy ground is slippery

  let minX = 20, maxX = WORLD_W - 20;
  if (scene === 'tavern')      { minX = 30; maxX = ROOM_W - 30; }
  else if (scene === 'cavern') { minX = 20; maxX = CAVE_W - 20; }
  else if (vball.active){ minX = COURT_L - 120; maxX = NET_X - 30; } // stay on your side

  if (goRight)     { _vx=Math.min(_vx+accel,spd);  player.facingRight=true; }
  else if (goLeft) { _vx=Math.max(_vx-accel,-spd); player.facingRight=false; }
  else { _vx*=friction; if(Math.abs(_vx)<0.05) _vx=0; }

  // wind shoves you, more so when you're in the air
  _vx += wx.wind * (player.onGround ? 0.012 : 0.04);

  if (outside && player.onGround) {
    for (const seg of TERRAIN) {
      if (player.wx>=seg.x1 && player.wx<=seg.x2) {
        const slope=(seg.y2-seg.y1)/(seg.x2-seg.x1);
        if (slope>0) _vx+=slope*0.5;
        break;
      }
    }
  }

  player._vx = _vx;

  // Log horizontal block
  if (outside) OBJECTS.filter(o=>o.type==='log').forEach(log => {
    const margin=10;
    if (player.wx>log.wx-log.w/2-margin && player.wx<log.wx+log.w/2+margin) {
      if (player._py>groundY(log.wx)-log.h && player.vy>=0) {
        player.wx=(player.wx>log.wx)?log.wx+log.w/2+margin:log.wx-log.w/2-margin;
        _vx=0;
      }
    }
  });

  player.wx = Math.max(minX, Math.min(maxX, player.wx+_vx));
  if (player.wx === minX || player.wx === maxX) _vx = 0;
  player._py += player.vy;
  player.vy  += GRAVITY * player.mods.grav;
  // owl's feather: hold jump while falling to glide
  if (wearing('feather') && player.vy > 1.6 && (keys['Space'] || keys['ArrowUp'] || keys['KeyW'])) {
    player.vy = 1.6;
    if (tick % 8 === 0) drinkFx.push({ k: 'fluff', x: player.wx + rand(-10, 10), y: player._py - 10, vy: 0.3, life: 0.7 });
  }
  if (player.bumpT > 0) player.bumpT--;
  if (scene === 'cavern') caveWater();   // swimming in the underground pool

  const gY = floorAt(player.wx);
  // stick to the floor when walking down slopes/stairs instead of launching off them
  const stick = wasOnGround && !player.onPlatform && player.vy >= 0 && gY - player._py < 16;
  const floating = player.inWater && player.vy < 0;   // buoyancy lifts you off the pool floor
  if ((player._py >= gY || stick) && !floating) {
    player._py = gY;
    player.vy  = 0;
    if (!player.onGround) {
      player.onGround=true; player.jumpCount=0;
      player.flipActive=false; player.flipRotation=0;
    }
  } else {
    player.onGround=false;
  }

  // Log top
  if (outside) OBJECTS.filter(o=>o.type==='log').forEach(log => {
    const logTop=groundY(log.wx)-log.h;
    if (player.wx>log.wx-log.w/2 && player.wx<log.wx+log.w/2) {
      if (player._py>=logTop && player._py<=logTop+12 && player.vy>=0) {
        player._py=logTop; player.vy=0; player.onGround=true;
      }
    }
  });

  if (outside) woodsCollide();   // bouncy mushrooms
  platformCollide();               // the tavern balcony, cavern ledges
  if (scene === 'cavern') caveCeiling(); // don't jump through the rock

  // walk animation
  if (player.onGround && Math.abs(_vx) > 0.3) {
    player.walkTimer++;
    if (player.walkTimer >= (player.hasBlades ? 4 : 8)) { player.walkFrame=(player.walkFrame+1)%4; player.walkTimer=0; }
  } else { player.walkFrame=0; player.walkTimer=0; }

  if (player.flipActive) {
    player.flipRotation+=0.12;
    if (player.flipRotation>=Math.PI*2) player.flipRotation-=Math.PI*2;
  }

  // Blades pickup
  if (outside) OBJECTS.filter(o=>o.type==='blades'&&!o.collected).forEach(b=>{
    if (Math.abs(player.wx-b.wx)<30 && player.onGround) {
      b.collected=true; player.hasBlades=true;
      showHint('rollerblades equipped — feel the speed',2800);
    }
  });
}

/* ── things you're wearing / holding (see inventory.js), drawn in the mouse's local space ── */
function drawWornItems(s, bhx, bhy, fhx, fhy) {
  ctx.save();
  ctx.lineCap = 'round';
  // scarf: wraps the neck, the long end streams behind in the wind
  if (wearing('scarf')) {
    ctx.strokeStyle = 'rgba(200,110,120,0.85)'; ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.ellipse(2 * s, -30 * s, 9 * s, 2.5 * s, 0, 0, Math.PI * 2); ctx.stroke();
    const flow = Math.sin(tick * 0.15) * 3 * s, wind = (player.facingRight ? -1 : 1) * weather.wind * 4 * s;
    const trail = Math.min(18, Math.abs(player._vx) * 5) * s;
    ctx.beginPath(); ctx.moveTo(-5 * s, -29 * s);
    ctx.quadraticCurveTo(-12 * s - trail * 0.5, -26 * s + flow, -16 * s - trail + wind, -18 * s + flow * 1.4);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(240,210,210,0.6)'; ctx.lineWidth = 1 * s;
    ctx.beginPath(); ctx.moveTo(-1 * s, -31 * s); ctx.lineTo(-1 * s, -28 * s); ctx.moveTo(5 * s, -31 * s); ctx.lineTo(5 * s, -28 * s); ctx.stroke();
  }
  // owl's feather behind the ear
  if (wearing('feather')) {
    ctx.save(); ctx.translate(-4 * s, -54 * s); ctx.rotate(-0.6 + Math.sin(tick * 0.05) * 0.06);
    ctx.fillStyle = 'rgba(210,190,150,0.55)'; ctx.strokeStyle = 'rgba(230,215,180,0.9)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.ellipse(0, -6 * s, 2.4 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 1 * s); ctx.lineTo(0, -12 * s); ctx.stroke();
    ctx.restore();
  }
  // friendship bracelet on the back wrist
  if (wearing('bracelet')) {
    ctx.strokeStyle = 'rgba(150,200,230,0.9)'; ctx.lineWidth = 1.6 * s;
    ctx.beginPath(); ctx.arc(bhx, bhy, 2 * s, 0, Math.PI * 2); ctx.stroke();
  }
  // lucky peanut in the back hand
  if (wearing('peanut')) {
    ctx.fillStyle = 'rgba(200,160,100,0.9)';
    ctx.beginPath(); ctx.ellipse(bhx, bhy + 2 * s, 2 * s, 3.4 * s, 0.3, 0, Math.PI * 2); ctx.fill();
  }
  // star chart rolled up under the arm
  if (wearing('chart')) {
    ctx.save(); ctx.translate(-8 * s, -20 * s); ctx.rotate(0.5);
    ctx.fillStyle = 'rgba(220,210,180,0.85)'; ctx.fillRect(-2 * s, -8 * s, 4 * s, 16 * s);
    ctx.fillStyle = 'rgba(80,100,160,0.8)'; ctx.fillRect(-2 * s, -3 * s, 4 * s, 1.5 * s);
    ctx.restore();
  }
  // shovel slung across the back
  if (wearing('shovel')) {
    ctx.save(); ctx.translate(-8 * s, -22 * s); ctx.rotate(-0.5);
    ctx.strokeStyle = 'rgba(150,115,75,0.95)'; ctx.lineWidth = 1.8 * s;
    ctx.beginPath(); ctx.moveTo(0, 14 * s); ctx.lineTo(0, -16 * s); ctx.stroke();
    ctx.fillStyle = 'rgba(170,175,185,0.9)';
    ctx.beginPath(); ctx.moveTo(-4 * s, -16 * s); ctx.lineTo(4 * s, -16 * s); ctx.lineTo(3 * s, -25 * s); ctx.quadraticCurveTo(0, -29 * s, -3 * s, -25 * s); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // glowstone pendant
  if (wearing('glowstone')) {
    const p = 0.75 + 0.25 * Math.sin(tick * 0.05);
    const g = ctx.createRadialGradient(3 * s, -25 * s, 1, 3 * s, -25 * s, 40 * s);
    g.addColorStop(0, `rgba(120,230,220,${0.25 * p})`); g.addColorStop(1, 'rgba(120,230,220,0)');
    ctx.fillStyle = g; ctx.fillRect(-40 * s, -65 * s, 80 * s, 80 * s);
    ctx.fillStyle = `rgba(150,240,230,${0.9 * p})`;
    ctx.beginPath(); ctx.moveTo(3 * s, -28 * s); ctx.lineTo(5.5 * s, -25 * s); ctx.lineTo(3 * s, -21 * s); ctx.lineTo(0.5 * s, -25 * s); ctx.closePath(); ctx.fill();
  }
  // lantern swinging from the front hand
  if (wearing('lantern')) {
    const sw = Math.sin(tick * 0.08) * 0.25 - player._vx * 0.06;
    ctx.save(); ctx.translate(fhx, fhy); ctx.rotate(sw);
    ctx.strokeStyle = 'rgba(160,130,90,0.9)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 5 * s); ctx.stroke();
    const flick = 0.85 + Math.sin(tick * 0.23) * 0.08;
    const g = ctx.createRadialGradient(0, 10 * s, 1, 0, 10 * s, 70 * s);
    g.addColorStop(0, `rgba(255,200,120,${0.28 * flick})`); g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g; ctx.fillRect(-70 * s, -60 * s, 140 * s, 140 * s);
    ctx.fillStyle = '#5a4230'; ctx.fillRect(-3.5 * s, 5 * s, 7 * s, 2 * s); ctx.fillRect(-3.5 * s, 14 * s, 7 * s, 2 * s);
    ctx.fillStyle = `rgba(255,205,130,${0.95 * flick})`; ctx.fillRect(-2.8 * s, 7 * s, 5.6 * s, 7 * s);
    ctx.restore();
  }
  ctx.restore();
}
