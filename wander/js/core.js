/* ══════════════════════════════════════════
   CANVAS + RESIZE
══════════════════════════════════════════ */
const canvas = document.getElementById('c');
let ctx = canvas.getContext('2d'); // `let` so icons/portraits can be drawn offscreen with the same code (renderToURL)
let W, H;
let tick = 0; // fixed-step counter (60 per second regardless of display refresh rate)

/* Phones / tablets (a finger is the main pointer). Everything phone-specific is gated on this,
   so on a computer the game behaves exactly as before: ZOOM = 1, DPR = 1, W/H = window size. */
const MOBILE = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
const MOBILE_LAYOUT_H = 560;   // on a phone, lay the world out as if the screen were at least this tall
let ZOOM = 1, DPR = 1;
let QUALITY = MOBILE ? 0.55 : 1; // fewer particles/glows on phones (touch.js may lower it further)

function resize() {
  const vw = window.innerWidth, vh = window.innerHeight;
  if (!MOBILE) {
    W = canvas.width  = vw;
    H = canvas.height = vh;
    return;
  }
  // phone: W/H are "game pixels"; the canvas is scaled to fit and drawn at device resolution
  ZOOM = Math.min(1, vh / MOBILE_LAYOUT_H);
  DPR  = Math.min(2, window.devicePixelRatio || 1) * (QUALITY < 0.45 ? 0.75 : 1);
  W = Math.round(vw / ZOOM); H = Math.round(vh / ZOOM);
  canvas.width  = Math.round(vw * DPR); canvas.height = Math.round(vh * DPR);
  canvas.style.width = vw + 'px'; canvas.style.height = vh + 'px';
  ctx.setTransform(DPR * ZOOM, 0, 0, DPR * ZOOM, 0, 0);
}
resize();

// phone only: canvas text is drawn in game pixels, which shrink on a small screen — scale fonts back up
if (MOBILE) {
  const proto = CanvasRenderingContext2D.prototype;
  const fontDesc = Object.getOwnPropertyDescriptor(proto, 'font');
  if (fontDesc && fontDesc.set) {
    Object.defineProperty(proto, 'font', {
      get() { return fontDesc.get.call(this); },
      set(v) {
        const k = Math.min(1.7, 0.95 / ZOOM);
        fontDesc.set.call(this, k > 1 ? String(v).replace(/(\d+(?:\.\d+)?)px/, (m, n) => (n * k).toFixed(1) + 'px') : v);
      },
    });
  }
}
window.addEventListener('resize', resize);

/* ══════════════════════════════════════════
   WORLD
══════════════════════════════════════════ */
const WORLD_W  = 7700;
const BASE_GND = 0.78;

const TERRAIN = [
  { x1:    0, y1:   0, x2:  600, y2:   0 },
  { x1:  600, y1:   0, x2:  900, y2:-100 },
  { x1:  900, y1:-100, x2: 1100, y2:-100 },
  { x1: 1100, y1:-100, x2: 1300, y2:   0 },
  { x1: 1300, y1:   0, x2: 2000, y2:   0 },
  { x1: 2000, y1:   0, x2: 2300, y2: -60 },
  { x1: 2300, y1: -60, x2: 2500, y2: -60 },
  { x1: 2500, y1: -60, x2: 2800, y2:  20 },
  { x1: 2800, y1:  20, x2: 3600, y2:  20 },
  { x1: 3600, y1:  20, x2: 3900, y2:   0 },
  { x1: 3900, y1:   0, x2:WORLD_W,y2:  0 },
];

// ground height at a world x (screen-space y, before the vertical camera). Includes the observatory hill.
function groundY(worldX) {
  let y = H * BASE_GND;
  for (const seg of TERRAIN) {
    if (worldX >= seg.x1 && worldX <= seg.x2) {
      const t = (worldX - seg.x1) / (seg.x2 - seg.x1);
      y += seg.y1 + (seg.y2 - seg.y1) * t;
      break;
    }
  }
  return y - hillH(worldX);
}

/* ══════════════════════════════════════════
   VOLLEYBALL COURT CONSTANTS
   Net is at world x=3200, court spans 2900-3500
   Left side: 2900-3200 (player side)
   Right side: 3200-3500 (enemy side)
══════════════════════════════════════════ */
const NET_X     = 3200;
const COURT_L   = 2850;  // left edge of player side
const COURT_R   = 3550;  // right edge of enemy side
const NET_H     = 110;
const COURT_GND = () => groundY(NET_X);

// Serve positions
const PLAYER_SERVE_X = 2900; // player back line for serve
const ENEMY_SERVE_X  = 3500; // enemy back line for serve

/* ══════════════════════════════════════════
   OBJECTS
══════════════════════════════════════════ */
/* Which scene we're in: 'outside' (the woods) or 'tavern' (interior) */
let scene = 'outside';
let transitioning = false;

const OBJECTS = [
  { type:'log',    wx: 980, w:40, h:28 },
  { type:'blades', wx:1600, w:36, h:18, collected:false },
  { type:'letter', wx:3700 },
];

/* ══════════════════════════════════════════
   INPUT
══════════════════════════════════════════ */
const keys = {};
const SCROLL_KEYS = new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
window.addEventListener('keydown', e => {
  if (SCROLL_KEYS.has(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (e.repeat || transitioning || obs.viewing) return; // holding a key shouldn't auto-fire jumps/flips
  if (e.code === 'ArrowDown' || e.code === 'KeyS') player.isDucking = true;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') tryJump();
});

function tryJump() {
  if (player.inWater) { swimStroke(); return; }   // in the cavern pool: kick upward
  if (player.onGround) {
    player.vy = JUMP_FORCE * player.mods.jump;
    player.onGround = false;
    player.jumpCount = 1;
    player.flipActive = false;
    player.flipRotation = 0;
    return;
  }
  // In volleyball mode, a mid-air press near the set ball = spike
  if (vball.active && vball.phase === 'player_spike' && attemptSpike()) return;
  if (player.jumpCount === 1) {
    const baseDir = player.facingRight ? 1 : -1; // clockwise when facing right, counter-clockwise when left
    player.flipDirection = (keys['ArrowDown'] || keys['KeyS']) ? baseDir : -baseDir;
    player.vy = JUMP_FORCE * 0.8 * player.mods.jump;
    player.jumpCount = 2;
    player.flipActive = true;
    player.flipRotation = 0;
  }
}
window.addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') player.isDucking = false;
});

/* ══════════════════════════════════════════
   CAMERA
══════════════════════════════════════════ */
let camX = 0;
let camY = 0;   // vertical camera: negative = looking up (the hill), positive = looking down (the cavern)
// phones: sit the world higher so the bottom of the screen is free for hints + controls
// (upright: ground ~62% down instead of 78%; sideways: ~71% down). Computers: unchanged.
function isPortrait() { return MOBILE && window.innerHeight > window.innerWidth; }
function viewBias() { return !MOBILE ? 0 : isPortrait() ? H * 0.16 : H * 0.07; }
function updateCamera() {
  if (scene === 'tavern') {
    // room fits on screen → center it; otherwise follow the player
    const target = W >= ROOM_W ? (ROOM_W - W) / 2 : Math.max(0, Math.min(ROOM_W - W, player.wx - W * 0.5));
    camX += (target - camX) * 0.15;
    camY += (viewBias() - camY) * 0.2;
    return;
  }
  if (scene === 'cavern') {
    const tx = Math.max(0, Math.min(CAVE_W - W, player.wx - W * 0.45));
    camX += (tx - camX) * 0.1;
    camY += ((player._py - H * 0.58 + viewBias()) - camY) * 0.08;
    return;
  }
  // only look up once you climb past the middle of the screen
  const ty = Math.min(0, player._py - H * 0.55) + viewBias();
  camY += (ty - camY) * 0.08;
  // During volleyball keep the whole court framed, nudged by the player
  const target = vball.active
    ? NET_X - W * 0.5 + (player.wx - (NET_X - 150)) * 0.25
    : player.wx - W * 0.3;
  camX += (target - camX) * 0.08;
  camX = Math.max(0, Math.min(WORLD_W - W, camX));
}

/* ══════════════════════════════════════════
   HINT + SCENE FADE
══════════════════════════════════════════ */
const hintBox = document.getElementById('hint-box');
let hintTimer = null;
// on a touch screen, keyboard instructions become touch instructions
function touchify(text) {
  if (!touchMode) return text;
  return String(text)
    .replace('arrow keys or wasd to move · space to jump', 'right thumb to move · tap the left side to jump')
    .replace(/press E to /g, 'tap the button to ')
    .replace(/press I to see your bag/g, 'tap bag to see it')
    .replace(/press J to see who you've met/g, 'tap friends to see them')
    .replace(/press J/g, 'tap friends')
    .replace('jump into the set to spike it  ·  hold ↓ to tip', 'jump into the set to spike it  ·  pull down to tip');
}
let touchMode = false;   // becomes true on the first real touch (touch.js)

function showHint(text,ms) {
  text = touchify(text);
  hintBox.textContent=text; hintBox.classList.add('visible');
  clearTimeout(hintTimer);
  hintTimer=setTimeout(()=>hintBox.classList.remove('visible'),ms||3000);
}

// Quick fade to black, run fn (e.g. swap scenes), fade back in
function fadeTransition(fn) {
  const fade = document.getElementById('fade');
  transitioning = true;
  fade.style.transition = 'opacity 0.3s ease';
  fade.style.display = 'block';
  requestAnimationFrame(() => { fade.style.opacity = '1'; });
  setTimeout(() => {
    fn();
    player.inputLock = true;
    fade.style.opacity = '0';
    setTimeout(() => { fade.style.display = 'none'; transitioning = false; }, 320);
  }, 320);
}
