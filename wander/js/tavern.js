/* ══════════════════════════════════════════
   THE DOZY GECKO — a small tavern
   Outside: a little building at TAVERN_X with a door you can enter (E).
   Inside: one room (scene === 'tavern', room coords 0..ROOM_W) with a
   balcony floor above the bar, reached by a staircase you walk up.
   The balcony is a one-way platform (see platformCollide in player.js);
   its residents live in tavern_balcony.js.
══════════════════════════════════════════ */
const TAVERN_X    = 4700;   // world x of the front door
const ROOM_W      = 1450;   // interior width
const ROOM_DOOR_X = 70;     // interior x of the exit door

// balcony + stairs, as [roomX, height above the floor]
const BAL_H = 180;
const BAL_X0 = 190, BAL_X1 = 1230;            // balcony floor
const STAIR_SLOPE = 1.3;
const STAIR_X1 = BAL_X1 + BAL_H / STAIR_SLOPE; // bottom of the stairs (≈1368)
const TAVERN_PLAT = [[BAL_X0, BAL_H], [BAL_X1, BAL_H], [STAIR_X1, 0]];

function tavernFloorY() { return H * 0.8; }
function tavernFloorAt() { return tavernFloorY(); }
function tavernPlatformY(x) {
  const P = TAVERN_PLAT;
  if (x < P[0][0] || x > P[P.length - 1][0]) return null;
  for (let i = 0; i < P.length - 1; i++) {
    const [x1, h1] = P[i], [x2, h2] = P[i + 1];
    if (x >= x1 && x <= x2) return tavernFloorY() - (h1 + (h2 - h1) * (x - x1) / (x2 - x1));
  }
  return null;
}
// 0 = ground floor, 1 = up on the balcony
function playerLevel() { return scene === 'tavern' && player._py < tavernFloorY() - 100 ? 1 : 0; }

let outsideReturnX = TAVERN_X;
const chimneySmoke = [];

/* ══════════════════════════════════════════
   DRINKS
══════════════════════════════════════════ */
const DRINKS = [
  { name: 'dandelion fizz',        blurb: 'you feel light as fluff.',          mods: { grav: 0.55 },  fx: 'fluff'   },
  { name: 'thunderbug espresso',   blurb: 'your whiskers are vibrating.',      mods: { speed: 1.7 },  fx: 'zap'     },
  { name: 'moonberry cider',       blurb: 'your legs feel… springier.',        mods: { jump: 1.3 },   fx: 'sparkle' },
  { name: 'pickled cricket brine', blurb: 'an acquired taste. *hic*',          mods: {},              fx: 'hiccup'  },
  { name: 'warm milk',             blurb: 'cozy. that is all it does.',        mods: {},              fx: 'cozy'    },
];
const DRINK_FRAMES = 60 * 60;

player.drink = null; // { d, timer }
const drinkFx = [];  // world/room-space particles around the player

function serveDrink() {
  const options = DRINKS.filter(d => !player.drink || d !== player.drink.d);
  const d = options[Math.floor(Math.random() * options.length)];
  player.drink = { d, timer: DRINK_FRAMES };
  player.mods = Object.assign({ speed: 1, jump: 1, grav: 1 }, d.mods);
  return d;
}

function updateDrink() {
  const dr = player.drink;
  if (dr) {
    if (--dr.timer <= 0) {
      showHint(`the ${dr.d.name} wears off`, 2000);
      player.drink = null;
      player.mods = { speed: 1, jump: 1, grav: 1 };
    } else {
      const px = player.wx, py = player._py - CHAR_H * 0.6;
      switch (dr.d.fx) {
        case 'fluff':   if (tick % 10 === 0) drinkFx.push({ k: 'fluff', x: px + rand(-14, 14), y: py + rand(-10, 20), vy: -0.4, life: 1 }); break;
        case 'zap':     if (Math.abs(player._vx) > 1 && tick % 4 === 0) drinkFx.push({ k: 'zap', x: px - Math.sign(player._vx) * 16, y: py + rand(-20, 20), vy: 0, life: 1 }); break;
        case 'sparkle': if (tick % 6 === 0) drinkFx.push({ k: 'sparkle', x: px + rand(-16, 16), y: py + rand(-24, 24), vy: -0.2, life: 1 }); break;
        case 'cozy':    if (tick % 90 === 0) drinkFx.push({ k: 'heart', x: px + 6, y: py - 26, vy: -0.5, life: 1 }); break;
        case 'hiccup':
          if (player.onGround && Math.random() < 0.012) {
            player.vy = -4.5; player.onGround = false; player.jumpCount = 1;
            drinkFx.push({ k: 'hic', x: px + 10, y: py - 34, vy: -0.6, life: 1 });
          }
          break;
      }
    }
    updateDrinkHud();
  }
  for (let i = drinkFx.length - 1; i >= 0; i--) {
    const f = drinkFx[i];
    f.y += f.vy; f.life -= f.k === 'zap' ? 0.08 : 0.015;
    if (f.life <= 0) drinkFx.splice(i, 1);
  }
}

function updateDrinkHud() {
  const el = document.querySelector('#weather-box .d-label');
  if (!el) return;
  if (!player.drink) { el.textContent = ''; return; }
  if (tick % 30 === 0 || !el.textContent)
    el.textContent = `${player.drink.d.name} · ${Math.ceil(player.drink.timer / 60)}s`;
}

function drawDrinkFx() {
  if (!drinkFx.length) return;
  ctx.save();
  ctx.textAlign = 'center';
  drinkFx.forEach(f => {
    const x = f.x - camX, y = f.y;
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    switch (f.k) {
      case 'fluff':   ctx.fillStyle = 'rgba(245,240,220,0.8)'; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill(); break;
      case 'zap':     ctx.strokeStyle = 'rgba(255,230,120,0.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 4); ctx.lineTo(x + 2, y + 6); ctx.lineTo(x - 2, y + 11); ctx.stroke(); break;
      case 'sparkle': ctx.fillStyle = 'rgba(200,180,255,0.95)'; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 1, y - 1); ctx.lineTo(x + 4, y); ctx.lineTo(x + 1, y + 1); ctx.lineTo(x, y + 4); ctx.lineTo(x - 1, y + 1); ctx.lineTo(x - 4, y); ctx.lineTo(x - 1, y - 1); ctx.fill(); break;
      case 'heart':   ctx.fillStyle = 'rgba(230,140,160,0.9)'; ctx.beginPath(); ctx.arc(x - 2, y - 2, 2.2, 0, 7); ctx.arc(x + 2, y - 2, 2.2, 0, 7); ctx.moveTo(x - 4, y - 1); ctx.lineTo(x, y + 4); ctx.lineTo(x + 4, y - 1); ctx.fill(); break;
      case 'hic':     ctx.fillStyle = 'rgba(220,210,190,0.9)'; ctx.font = '10px Space Mono, monospace'; ctx.fillText('hic!', x, y); break;
    }
  });
  ctx.restore();
}

/* ══════════════════════════════════════════
   REGULARS (ground floor + the owl on the balcony rail)
══════════════════════════════════════════ */
const WEATHER_CHATTER = {
  clear:  'quiet night out there.',
  rain:   'listen to it come down.',
  storm:  'that one rattled the bottles!',
  snow:   "snow's sticking. nobody's going home tonight.",
  fog:    "can't even see the court in this fog.",
  wind:   'hold onto your hats.',
  petals: 'smells like spring when the door opens.',
  stars:  'everybody make a wish!',
  frogs:  '…is that a frog on the window?',
};
const BARTENDER_GREETING = {
  clear:  "evening, little one. first time at the dozy gecko?",
  rain:   "shake off that rain, friend. puddles go by the door.",
  storm:  "get in, get in! close that door before the lightning follows you.",
  snow:   "you've got snow on your ears. come warm up.",
  fog:    "found us in that fog? impressive. most folks walk right past.",
  wind:   "blew in, did you? ha. sit down before you blow back out.",
  petals: "you've got petals in your fur. very fashionable.",
  stars:  "saw the falling stars? wished for a drink, i bet.",
  frogs:  "don't mind the frogs. they come down every so often. great tippers.",
};

function makeRegular(o) {
  const n = Object.assign({ li: 0, bubble: null, bubbleT: 0, y: 0, talkR: 46, level: 0, seed: Math.random() * 10, talks: 0 }, o);
  TALKERS.push(n);   // speech bubbles: talk.js
  // where the bubble hangs, indoors: [x, feet, head] (outdoor + cavern folk set their own)
  n.at = () => { const F = tavernFloorY(), feet = (n === gecko ? F - 22 : F + n.y + (n.bubbleDY || 0)); return [n.x, feet, feet - 50]; };
  return n;
}

const gecko = makeRegular({
  name: 'pip', kind: 'gecko', color: '#9cc77a', x: 430, home: 430, anim: 'wipe', talkR: 130, greeted: false,
});
const owl = makeRegular({ name: 'owl', kind: 'owl', color: '#c0a888', x: 1150, y: -BAL_H - 34, level: 1, talkR: 55, anim: 'bob', giftLine: 2, lines: [
  'oh. you actually went.',
  "nothing was waiting for you. and yet — a tavern. funny how that works.",
  "here. a feather, for the road. hold jump when you fall. you'll see.",
  'i come here for the quiet. the badger does not respect this.',
  'wandering suits you.',
]});
const REGULARS = [
  gecko,
  makeRegular({ name: 'rosco', kind: 'raccoon', color: '#9a9aa6', x: 525, y: -26, anim: 'bob', giftLine: 0, lines: [
    "i lost my lucky button. somewhere up on the balcony. probably. if you find it…",
    'psst. the hedgehog at the court? cheats. probably.',
    "i'm not stealing the peanuts. i'm relocating them.",
    'ever notice the moon out there never changes shape?',
    "found a letter pinned to a tree once. didn't read it. …okay i read it.",
  ]}),
  makeRegular({ name: 'bramble', kind: 'badger', color: '#b8b0a0', x: 650, anim: 'lute', lines: [
    "this one's called 'ode to a damp log'.",
    'requests? i know three songs. they are all the same song.',
    '♪ oh the woods are wide and the night is long ♪',
    'i used to play for the owl. tough crowd.',
  ]}),
  makeRegular({ name: 'hazel', kind: 'squirrel', color: '#c8905a', x: 770, y: -6, anim: 'cards', lines: [
    'go fish.',
    "we're not playing go fish? then what have i been doing.",
    'i bet three acorns. and a button.',
  ]}),
  makeRegular({ name: 'ottoline', kind: 'otter', color: '#a08060', x: 860, y: -6, anim: 'cards', dir: -1, lines: [
    "she's been saying 'go fish' for an hour.",
    "i hold my cards upside down on purpose. it's a strategy.",
    "wanna be dealt in? we don't know the rules either.",
  ]}),
  owl,
  makeRegular({ name: 'mr. puddleby', kind: 'toad', color: '#7aa070', x: 1045, y: -14, anim: 'sleep', lines: [
    'zzz…',
    'zzz… no, the OTHER lily pad… zzz',
    "*snort* …i'm awake. (he is not awake)",
  ]}),
  makeRegular({ name: 'gus', kind: 'snail', color: '#c0b080', x: 160, anim: 'snail', dir: 1, lines: [
    "i'm headed to the fireplace. i left in spring.",
    "don't wait up.",
    'the floor is a lot bigger than it looks.',
    'progress!',
  ]}),
];

const quest = { buttonReturned: false };

function regularLine(n) {
  if (n.name === 'mr. puddleby' && weather.type === 'frogs') return 'zzz… family is visiting… zzz';
  if (n.name === 'rosco') {
    if (hasItem('button') && !quest.buttonReturned) {
      quest.buttonReturned = true;
      takeItem('button');
      completeQuest('button');
      setTimeout(() => give('peanut', 'rosco'), 600);
      return 'MY BUTTON! you absolute legend. here — my finest peanut.';
    }
    if (questState.shovel === 'open') {
      completeQuest('shovel'); startQuest('dig');
      if (hasItem('shovel')) return "you found a shovel already? then nova's stays in my coat. it's very cosy in there.";
      setTimeout(() => give('shovel', 'rosco'), 600);
      return "nova's shovel? …fine. it was in my coat the whole time. don't tell her i used it for snacks.";
    }
    if (n.li === 0 && !quest.buttonReturned) startQuest('button');
    if (quest.buttonReturned && n.li === 0) n.li = 1; // skip the "lost it" line once solved
    if (quest.buttonReturned && Math.random() < 0.3) return 'feeling lucky tonight. thanks to you.';
  }
  if (n === owl && n.li === 2) setTimeout(() => give('feather', 'owl'), 600);
  const line = n.lines[n.li % n.lines.length];
  n.li++;
  return line;
}

function talkToGecko() {
  if (!gecko.greeted) {
    gecko.greeted = true;
    say(gecko, BARTENDER_GREETING[weather.type] + ' press E again for a drink.', true, { next: talkToGecko });
    return;
  }
  const d = serveDrink();
  if (!hasItem('lantern')) {
    say(gecko, `one ${d.name}. and take this little lantern — it's dark out there.`, true);
    setTimeout(() => give('lantern', 'pip'), 900);
  } else {
    say(gecko, `one ${d.name}, coming up. ${Math.random() < 0.3 ? WEATHER_CHATTER[weather.type] : ''}`.trim(), true);
  }
  showHint(`${d.name} — ${d.blurb}`, 3200);
}

/* ── everything you can press E on inside, on both levels ── */
function tavernTargets() {
  const t = [];
  t.push({ x: ROOM_DOOR_X, r: 40, level: 0, popup: 'press E to head back out', act: exitTavern });
  REGULARS.forEach(n => t.push({
    x: n.x, r: n.talkR, level: n.level, npc: n,
    penalty: n === gecko ? 45 : 0, // pip's reach covers the bar, so whoever you're next to wins
    popup: n === gecko ? (gecko.greeted ? 'press E to order a drink' : 'press E to talk to pip') : `press E to talk to ${n.name}`,
    act: () => n === gecko ? talkToGecko() : say(n, regularLine(n), true),
  }));
  return t.concat(balconyTargets());
}
function nearestTavernTarget() {
  const lvl = playerLevel();
  let best = null, bd = Infinity;
  tavernTargets().forEach(t => {
    if (t.level !== lvl) return;
    const d = Math.abs(player.wx - t.x) + (t.penalty || 0);
    if (d < t.r && d < bd) { bd = d; best = t; }
  });
  return best;
}

/* ── ENTER / EXIT ── */
function nearTavernDoor() { return scene === 'outside' && !vball.active && Math.abs(player.wx - TAVERN_X) < 40; }

function enterTavern() {
  fadeTransition(() => {
    scene = 'tavern';
    outsideReturnX = player.wx;
    player.wx = ROOM_DOOR_X + 50; player._py = tavernFloorY(); player.vy = 0; _vx = 0;
    player.onPlatform = false; player.facingRight = true;
    camX = W >= ROOM_W ? (ROOM_W - W) / 2 : 0;
    if (!gecko.greeted) say(gecko, 'well hello there!');
    showHint('the dozy gecko · warm in here', 2500);
  });
}
function exitTavern() {
  fadeTransition(() => {
    scene = 'outside';
    player.wx = outsideReturnX; player._py = groundY(player.wx); player.vy = 0; _vx = 0;
    player.onPlatform = false;
    camX = Math.max(0, Math.min(WORLD_W - W, player.wx - W * 0.3));
    weather.lastCamX = camX;
  });
}

window.addEventListener('keydown', e => {
  if (e.code !== 'KeyE' || e.repeat || transitioning || !started) return;
  if (scene === 'outside') {
    if (nearTavernDoor()) enterTavern();
    return;
  }
  if (scene !== 'tavern') return;   // the cavern + observatory handle their own E
  const t = nearestTavernTarget();
  if (t) t.act();
});

/* ── popup text while inside ── */
function tavernPopup() {
  const balPop = balconyPopup();
  if (balPop) return balPop;
  const t = nearestTavernTarget();
  if (t) return t.popup;
  if (playerLevel() === 0 && Math.abs(player.wx - STAIR_X1) < 40) return 'stairs ↑ the balcony';
  return null;
}

/* ══════════════════════════════════════════
   UPDATE
══════════════════════════════════════════ */
const roomFx = []; // music notes, zzz's, embers

function updateTavernExterior() {
  // chimney smoke drifts with the wind
  if (tick % 14 === 0) chimneySmoke.push({ x: TAVERN_X + 82, y: groundY(TAVERN_X) - 302, r: 4, a: 0.35 });
  for (let i = chimneySmoke.length - 1; i >= 0; i--) {
    const s = chimneySmoke[i];
    s.y -= 0.5; s.x += 0.15 + weather.wind * 0.6; s.r += 0.08; s.a -= 0.0025;
    if (s.a <= 0) chimneySmoke.splice(i, 1);
  }
}

function updateTavernInterior() {
  // bartender potters back and forth behind the bar
  gecko.x = gecko.home + Math.sin(tick * 0.008) * 70;

  REGULARS.forEach(n => {
    if (n.anim === 'snail') {
      n.x += 0.06 * n.dir;
      if (n.x > 1000 || n.x < 140) n.dir *= -1;
    }
  });
  updateBalcony();

  // ambient chatter so the room feels alive
  if (tick % 480 === 0) {
    const idle = REGULARS.concat(fern, lumen, dusk).filter(n => n !== gecko && !n.bubble && Math.abs(n.x - player.wx) > 60);
    if (idle.length) {
      const n = idle[Math.floor(Math.random() * idle.length)];
      // random line, but never one that comes with a gift (those are for when you talk to them)
      const pool = n.lines.filter((l, i) => i !== n.giftLine);
      say(n, Math.random() < 0.4 ? WEATHER_CHATTER[weather.type] : pool[Math.floor(Math.random() * pool.length)]);
    }
  }

  const F = tavernFloorY();
  if (tick % 40 === 0) roomFx.push({ k: 'note', x: 650 + rand(-6, 14), y: F - 50, vx: rand(-0.3, 0.3), vy: -0.6, life: 1, ch: Math.random() < 0.5 ? '♪' : '♫' });
  if (tick % 70 === 0) roomFx.push({ k: 'z', x: 1052, y: F - 52, vx: 0.25, vy: -0.4, life: 1, ch: 'z' });
  if (Math.random() < 0.15) roomFx.push({ k: 'ember', x: 1120 + rand(-18, 18), y: F - 20, vx: rand(-0.2, 0.2), vy: rand(-1.2, -0.6), life: 0.8 });
  for (let i = roomFx.length - 1; i >= 0; i--) {
    const f = roomFx[i];
    f.x += f.vx + (f.k === 'note' ? Math.sin(tick * 0.05 + i) * 0.2 : 0);
    f.y += f.vy; f.life -= f.k === 'ember' ? 0.02 : 0.008;
    if (f.life <= 0) roomFx.splice(i, 1);
  }
}

/* ══════════════════════════════════════════
   DRAW — EXTERIOR
══════════════════════════════════════════ */
function drawTavernExterior() {
  const sx = TAVERN_X - camX;
  if (sx < -300 || sx > W + 300) return;
  const gy = groundY(TAVERN_X);
  const flick = 0.85 + Math.sin(tick * 0.21) * 0.05 + Math.sin(tick * 0.53) * 0.04;
  ctx.save();

  // smoke (behind)
  chimneySmoke.forEach(s => {
    ctx.fillStyle = `rgba(150,150,160,${s.a})`;
    ctx.beginPath(); ctx.arc(s.x - camX, s.y, s.r, 0, 7); ctx.fill();
  });

  // warm light spilling on the ground
  const lg = ctx.createRadialGradient(sx, gy, 5, sx, gy, 220);
  lg.addColorStop(0, `rgba(255,180,100,${0.16 * flick})`); lg.addColorStop(1, 'rgba(255,180,100,0)');
  ctx.fillStyle = lg; ctx.fillRect(sx - 230, gy - 120, 460, 140);

  // chimney
  ctx.fillStyle = '#2a201a'; ctx.strokeStyle = 'rgba(160,130,95,0.5)'; ctx.lineWidth = 1;
  ctx.fillRect(sx + 70, gy - 302, 26, 45); ctx.strokeRect(sx + 70, gy - 302, 26, 45);

  // walls (two storeys)
  ctx.fillStyle = '#2b2119'; ctx.strokeStyle = 'rgba(170,135,95,0.6)';
  ctx.fillRect(sx - 140, gy - 230, 280, 230); ctx.strokeRect(sx - 140, gy - 230, 280, 230);
  ctx.strokeStyle = 'rgba(120,95,65,0.35)';
  for (let y = gy - 215; y < gy; y += 15) { ctx.beginPath(); ctx.moveTo(sx - 140, y); ctx.lineTo(sx + 140, y); ctx.stroke(); }
  // floor trim between storeys
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(sx - 146, gy - 150, 292, 7);

  // upstairs: a round window + a small square one
  ctx.fillStyle = `rgba(255,185,105,${0.45 * flick})`;
  ctx.beginPath(); ctx.arc(sx + 70, gy - 190, 17, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(90,65,40,0.9)'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx + 53, gy - 190); ctx.lineTo(sx + 87, gy - 190); ctx.moveTo(sx + 70, gy - 207); ctx.lineTo(sx + 70, gy - 173); ctx.stroke();
  const upLit = 0.35 + 0.15 * Math.sin(tick * 0.004); // someone's reading lamp
  ctx.fillStyle = `rgba(255,185,105,${upLit * flick})`; ctx.fillRect(sx - 100, gy - 205, 34, 30);
  ctx.strokeStyle = 'rgba(90,65,40,0.9)'; ctx.lineWidth = 2; ctx.strokeRect(sx - 100, gy - 205, 34, 30);
  ctx.beginPath(); ctx.moveTo(sx - 83, gy - 205); ctx.lineTo(sx - 83, gy - 175); ctx.stroke();
  // a little flower box under it
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(sx - 104, gy - 175, 42, 6);
  [[-98, '#d88aa0'], [-88, '#e0c070'], [-78, '#a0b8e0'], [-70, '#d88aa0']].forEach(([fx, c], i) => {
    const sway = Math.sin(tick * 0.05 + i) * 1.5 + weather.wind * 2;
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(sx + fx + sway, gy - 179, 2.4, 0, 7); ctx.fill();
  });

  // roof
  ctx.fillStyle = '#1e1611'; ctx.strokeStyle = 'rgba(170,135,95,0.65)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(sx - 165, gy - 228); ctx.lineTo(sx, gy - 312); ctx.lineTo(sx + 165, gy - 228); ctx.closePath();
  ctx.fill(); ctx.stroke();
  if (weather.snowCover > 0.02) {
    ctx.strokeStyle = `rgba(235,240,248,${0.3 + weather.snowCover * 0.6})`; ctx.lineWidth = 2 + weather.snowCover * 7;
    ctx.beginPath(); ctx.moveTo(sx - 163, gy - 230); ctx.lineTo(sx, gy - 314); ctx.lineTo(sx + 163, gy - 230); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 70, gy - 304); ctx.lineTo(sx + 96, gy - 304); ctx.stroke();
  }

  // windows (with a silhouette wandering past the left one)
  [[sx - 110, gy - 115], [sx + 62, gy - 115]].forEach(([wx, wy], i) => {
    ctx.fillStyle = `rgba(255,185,105,${0.55 * flick})`;
    ctx.fillRect(wx, wy, 48, 38);
    if (i === 0) {
      const shx = wx + 24 + Math.sin(tick * 0.008) * 18;
      ctx.fillStyle = 'rgba(40,25,15,0.55)';
      ctx.beginPath(); ctx.ellipse(shx, wy + 30, 8, 10, 0, 0, 7); ctx.ellipse(shx, wy + 16, 6, 6, 0, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(90,65,40,0.9)'; ctx.lineWidth = 2;
    ctx.strokeRect(wx, wy, 48, 38);
    ctx.beginPath(); ctx.moveTo(wx + 24, wy); ctx.lineTo(wx + 24, wy + 38); ctx.moveTo(wx, wy + 19); ctx.lineTo(wx + 48, wy + 19); ctx.stroke();
    if (weather.snowCover > 0.05) { ctx.fillStyle = `rgba(235,240,248,${weather.snowCover * 0.8})`; ctx.fillRect(wx - 2, wy + 38, 52, 2 + weather.snowCover * 3); }
  });

  // door
  const near = nearTavernDoor();
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(sx - 20, gy - 62, 40, 62);
  ctx.strokeStyle = near ? 'rgba(255,200,130,0.9)' : 'rgba(170,135,95,0.7)'; ctx.lineWidth = near ? 2 : 1.2;
  ctx.strokeRect(sx - 20, gy - 62, 40, 62);
  ctx.fillStyle = 'rgba(220,180,110,0.9)'; ctx.beginPath(); ctx.arc(sx + 12, gy - 30, 2, 0, 7); ctx.fill();

  // lantern by the door
  ctx.fillStyle = `rgba(255,200,120,${0.9 * flick})`; ctx.beginPath(); ctx.arc(sx + 32, gy - 70, 4, 0, 7); ctx.fill();
  const lan = ctx.createRadialGradient(sx + 32, gy - 70, 1, sx + 32, gy - 70, 30);
  lan.addColorStop(0, `rgba(255,200,120,${0.35 * flick})`); lan.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = lan; ctx.fillRect(sx, gy - 100, 64, 60);

  // hanging sign, swings in the wind
  ctx.strokeStyle = 'rgba(170,135,95,0.8)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(sx - 140, gy - 98); ctx.lineTo(sx - 190, gy - 98); ctx.stroke();
  ctx.translate(sx - 175, gy - 98);
  ctx.rotate(Math.sin(tick * 0.05) * 0.04 + weather.wind * 0.12);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-14, 10); ctx.moveTo(14, 0); ctx.lineTo(14, 10); ctx.stroke();
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(-36, 10, 72, 34); ctx.strokeRect(-36, 10, 72, 34);
  ctx.fillStyle = 'rgba(230,205,160,0.9)'; ctx.font = '8px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText('the dozy', 0, 23); ctx.fillText('gecko', 0, 36);

  ctx.restore();
}

/* ══════════════════════════════════════════
   DRAW — INTERIOR
══════════════════════════════════════════ */
function drawLanternGlow(x, y, r, a) {
  const g = ctx.createRadialGradient(x, y, 2, x, y, r);
  g.addColorStop(0, `rgba(255,190,110,${a})`); g.addColorStop(1, 'rgba(255,190,110,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function hangingLantern(x, topY, y, flick, r) {
  ctx.strokeStyle = 'rgba(90,68,45,0.8)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, topY); ctx.lineTo(x, y - 6); ctx.stroke();
  ctx.fillStyle = '#4a3522'; ctx.fillRect(x - 4, y - 8, 8, 3);
  ctx.fillStyle = `rgba(255,200,120,${0.9 * flick})`; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill();
  drawLanternGlow(x, y, r || 110, 0.12 * flick);
}

function drawTavernInterior() {
  const F = tavernFloorY(), B = F - BAL_H;
  const ox = -camX; // room → screen
  const flick = 0.85 + Math.sin(tick * 0.21) * 0.05 + Math.sin(tick * 0.53) * 0.04;

  ctx.fillStyle = '#0a0c0f'; ctx.fillRect(0, 0, W, H);

  // back wall
  const wg = ctx.createLinearGradient(0, 0, 0, F);
  wg.addColorStop(0, '#1d1510'); wg.addColorStop(1, '#2e2218');
  ctx.fillStyle = wg; ctx.fillRect(ox, 0, ROOM_W, F);
  ctx.strokeStyle = 'rgba(90,68,45,0.35)'; ctx.lineWidth = 1;
  for (let x = 0; x <= ROOM_W; x += 60) { ctx.beginPath(); ctx.moveTo(ox + x, 0); ctx.lineTo(ox + x, F); ctx.stroke(); }
  // roof beams
  ctx.fillStyle = '#18110c'; ctx.fillRect(ox, B - 128, ROOM_W, 12);
  for (let x = 60; x < ROOM_W; x += 240) { ctx.fillRect(ox + x, 0, 10, B - 118); }

  // floor
  ctx.fillStyle = '#20160f'; ctx.fillRect(ox, F, ROOM_W, H - F + Math.max(0, camY) + 20);
  ctx.strokeStyle = 'rgba(150,115,80,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(ox, F); ctx.lineTo(ox + ROOM_W, F); ctx.stroke();
  ctx.strokeStyle = 'rgba(90,68,45,0.3)'; ctx.lineWidth = 1;
  for (let y = F + 14; y < H + Math.max(0, camY); y += 14) { ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + ROOM_W, y); ctx.stroke(); }

  // windows: one by the door downstairs, one up high over the stairs
  [[115, F - 150, 70, 60], [1270, B - 100, 74, 64]].forEach(([x, y, w, h]) => {
    drawWeatherWindow(ox + x, y, w, h);
    ctx.strokeStyle = '#4a3522'; ctx.lineWidth = 4; ctx.strokeRect(ox + x, y, w, h);
    ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(ox + x + w / 2, y); ctx.lineTo(ox + x + w / 2, y + h); ctx.moveTo(ox + x, y + h / 2); ctx.lineTo(ox + x + w, y + h / 2); ctx.stroke();
  });

  // exit door
  const nearDoor = playerLevel() === 0 && Math.abs(player.wx - ROOM_DOOR_X) < 40;
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(ox + ROOM_DOOR_X - 24, F - 74, 48, 74);
  ctx.strokeStyle = nearDoor ? 'rgba(255,200,130,0.9)' : 'rgba(170,135,95,0.7)'; ctx.lineWidth = nearDoor ? 2 : 1.2;
  ctx.strokeRect(ox + ROOM_DOOR_X - 24, F - 74, 48, 74);
  ctx.fillStyle = 'rgba(220,180,110,0.9)'; ctx.beginPath(); ctx.arc(ox + ROOM_DOOR_X + 14, F - 36, 2.2, 0, 7); ctx.fill();
  if (weather.flash > 0.05) { ctx.fillStyle = `rgba(220,228,255,${weather.flash * 0.6})`; ctx.fillRect(ox + ROOM_DOOR_X - 24, F - 2, 48, 2); }

  // shelf of bottles behind the bar
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(ox + 320, F - 150, 230, 6); ctx.fillRect(ox + 320, F - 112, 230, 6);
  const BOTTLE_COLORS = ['#7aa070', '#b06070', '#c0a050', '#6080b0', '#a070b0', '#70b0a0'];
  for (let i = 0; i < 11; i++) {
    const c = BOTTLE_COLORS[i % BOTTLE_COLORS.length];
    const bx = ox + 332 + i * 20, rattle = weather.flash > 0.5 ? rand(-1, 1) : 0;
    [[F - 150, 18], [F - 112, 14]].forEach(([sy, h], j) => {
      if ((i + j) % 3 === 2) return;
      ctx.fillStyle = c + 'aa'; ctx.fillRect(bx + rattle, sy - h, 8, h);
      ctx.fillRect(bx + 2.5 + rattle, sy - h - 5, 3, 5);
    });
  }

  // fireplace
  const fx = ox + 1120;
  ctx.fillStyle = '#2a2420'; ctx.fillRect(fx - 50, F - 110, 100, 110);
  ctx.strokeStyle = 'rgba(140,130,120,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(fx - 50, F - 110, 100, 110);
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(fx - 56, F - 116, 112, 8); // mantel
  ctx.fillStyle = '#0e0a08'; ctx.beginPath(); ctx.moveTo(fx - 32, F); ctx.lineTo(fx - 32, F - 50); ctx.arc(fx, F - 50, 32, Math.PI, 0); ctx.lineTo(fx + 32, F); ctx.fill();
  for (let i = 0; i < 5; i++) {
    const fh = 18 + Math.sin(tick * 0.2 + i * 1.7) * 6 + Math.sin(tick * 0.47 + i) * 4;
    ctx.fillStyle = i % 2 ? 'rgba(255,170,60,0.85)' : 'rgba(255,110,40,0.8)';
    ctx.beginPath(); ctx.ellipse(fx - 16 + i * 8, F - 6 - fh / 2, 5, fh / 2, 0, 0, 7); ctx.fill();
  }
  drawLanternGlow(fx, F - 30, 220, 0.22 * flick);

  // armchair for the toad
  ctx.fillStyle = '#4a2a28'; manualRoundRect(ox + 1020, F - 34, 52, 34, 6); ctx.fill();
  manualRoundRect(ox + 1016, F - 52, 12, 52, 5); ctx.fill();

  // card table
  ctx.fillStyle = '#4a3522'; ctx.fillRect(ox + 780, F - 34, 60, 6); ctx.fillRect(ox + 806, F - 28, 8, 28);
  for (let i = 0; i < 3; i++) {
    const flip = Math.sin(tick * 0.03 + i * 2) > 0.7 ? -4 : 0;
    ctx.fillStyle = 'rgba(240,235,220,0.9)'; ctx.fillRect(ox + 792 + i * 12, F - 38 + flip, 8, 4);
  }

  // bard's rug
  ctx.fillStyle = 'rgba(140,60,60,0.35)'; ctx.beginPath(); ctx.ellipse(ox + 650, F + 4, 40, 6, 0, 0, 7); ctx.fill();

  // the balcony level (its back wall dressing + residents) — behind the slab and the player
  drawBalconyBack(ox, F, flick);

  // balcony slab + support posts
  ctx.fillStyle = '#2a1d14';
  [BAL_X0 + 8, 600, 940].forEach(x => ctx.fillRect(ox + x - 4, B + 12, 8, BAL_H - 12));
  ctx.fillStyle = '#4a3522'; ctx.fillRect(ox + BAL_X0, B, BAL_X1 - BAL_X0 + 4, 6);
  ctx.fillStyle = '#33241a'; ctx.fillRect(ox + BAL_X0, B + 6, BAL_X1 - BAL_X0 + 4, 9);
  ctx.strokeStyle = 'rgba(20,14,9,0.6)'; ctx.lineWidth = 1;
  for (let x = BAL_X0 + 40; x < BAL_X1; x += 40) { ctx.beginPath(); ctx.moveTo(ox + x, B + 6); ctx.lineTo(ox + x, B + 15); ctx.stroke(); }

  // lanterns under the balcony (warm pools over the bar and tables)
  [430, 760, 1000].forEach((x, i) => hangingLantern(ox + x, B + 15, B + 42 + Math.sin(tick * 0.02 + i) * 1.5, flick, 120));

  drawStaircase(ox, F);

  // regulars (gecko first so the counter hides his lower half)
  drawRegular(gecko, ox, F);

  // bar counter
  // (kept low so you can see pip behind it)
  ctx.fillStyle = '#4a3522'; ctx.fillRect(ox + 300, F - 42, 270, 42);
  ctx.fillStyle = '#5a4230'; ctx.fillRect(ox + 294, F - 48, 282, 8);
  ctx.strokeStyle = 'rgba(30,20,12,0.5)'; ctx.lineWidth = 1;
  for (let x = 330; x < 570; x += 45) { ctx.beginPath(); ctx.moveTo(ox + x, F - 40); ctx.lineTo(ox + x, F); ctx.stroke(); }
  if (player.drink) { ctx.fillStyle = 'rgba(220,200,160,0.85)'; ctx.fillRect(ox + 548, F - 60, 10, 12); }

  // stools
  [360, 525].forEach(x => {
    ctx.fillStyle = '#3a2a1c'; ctx.fillRect(ox + x - 12, F - 28, 24, 5);
    ctx.fillRect(ox + x - 2, F - 24, 4, 24);
  });

  REGULARS.forEach(n => { if (n !== gecko && n !== owl) drawRegular(n, ox, F); });

  // room fx
  ctx.save(); ctx.textAlign = 'center';
  roomFx.forEach(f => {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    if (f.k === 'ember') { ctx.fillStyle = 'rgba(255,160,60,0.9)'; ctx.fillRect(ox + f.x, f.y, 1.5, 1.5); }
    else { ctx.fillStyle = 'rgba(230,215,180,0.8)'; ctx.font = f.k === 'z' ? '10px Space Mono, monospace' : '12px serif'; ctx.fillText(f.ch, ox + f.x, f.y); }
  });
  ctx.restore();
}

// staircase: rises from STAIR_X1 (bottom, right) up-left to the balcony at BAL_X1
function drawStaircase(ox, F) {
  const run = 20, rise = run * STAIR_SLOPE;
  const n = Math.ceil((STAIR_X1 - BAL_X1) / run);
  ctx.fillStyle = '#261a12';
  ctx.beginPath(); ctx.moveTo(ox + STAIR_X1, F); ctx.lineTo(ox + BAL_X1, F - BAL_H); ctx.lineTo(ox + BAL_X1, F); ctx.closePath(); ctx.fill();
  for (let i = 0; i < n; i++) {
    const x = ox + STAIR_X1 - (i + 1) * run, y = F - (i + 0.5) * rise;
    ctx.fillStyle = '#4a3522'; ctx.fillRect(x, y, run, 4);
    ctx.fillStyle = '#332419'; ctx.fillRect(x, y + 4, run, Math.min(rise, F - y) - 4);
  }
  ctx.fillStyle = 'rgba(230,205,160,0.5)'; ctx.font = '9px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText('balcony ↑', ox + STAIR_X1 + 18, F - 50);
}

// railings go in front of the player so you're "behind" them up on the balcony
function drawRailings(ox, F) {
  const B = F - BAL_H, top = B - 32;
  ctx.save();
  ctx.strokeStyle = 'rgba(120,90,60,0.95)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ox + BAL_X0, top); ctx.lineTo(ox + BAL_X1, top); ctx.stroke();
  ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(120,90,60,0.8)';
  for (let x = BAL_X0; x <= BAL_X1; x += 22) { ctx.beginPath(); ctx.moveTo(ox + x, B); ctx.lineTo(ox + x, top); ctx.stroke(); }
  // stair handrail
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(120,90,60,0.95)';
  ctx.beginPath(); ctx.moveTo(ox + BAL_X1, top); ctx.lineTo(ox + STAIR_X1, F - 32); ctx.stroke();
  ctx.lineWidth = 1.2;
  for (let x = BAL_X1 + 20; x < STAIR_X1; x += 26) {
    const y = F - (STAIR_X1 - x) * STAIR_SLOPE;
    ctx.beginPath(); ctx.moveTo(ox + x, y); ctx.lineTo(ox + x, y - 32); ctx.stroke();
  }
  ctx.fillStyle = '#4a3522'; ctx.fillRect(ox + STAIR_X1 - 3, F - 40, 7, 40);
  ctx.restore();
}

function drawRegular(n, ox, F) {
  const sx = ox + n.x;
  if (sx < -80 || sx > W + 80) return;
  let bob = Math.sin(tick * 0.04 + n.seed) * 1;
  if (n.anim === 'lute')  bob = Math.abs(Math.sin(tick * 0.12)) * -2;
  if (n.anim === 'sleep') bob = Math.sin(tick * 0.02) * 1.5;
  const gy = n === gecko ? F - 40 : F + n.y + bob; // pip stands on a crate behind the bar
  const dir = n.anim === 'snail' ? n.dir : (n.dir || faceToward(n.x));
  const opts = { color: n.color, dir, label: n.name, sleep: n.anim === 'sleep',
                 labelY: n.kind === 'snail' ? 26 : n.kind === 'toad' ? 30 : n.kind === 'hedgehog' ? 32 : 54 };
  drawCritter(sx, gy, n.kind, opts);
  if (n.anim === 'lute') {
    ctx.save(); ctx.strokeStyle = 'rgba(200,150,90,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(sx + 8 * dir, gy - 12, 6, 4, -0.5 * dir, 0, 7); ctx.moveTo(sx + 12 * dir, gy - 15); ctx.lineTo(sx + 22 * dir, gy - 26); ctx.stroke();
    ctx.restore();
  }
  if (n.anim === 'cards') {
    ctx.save(); ctx.fillStyle = 'rgba(240,235,220,0.85)';
    ctx.translate(sx + 9 * dir, gy - 20); ctx.rotate(0.3 * dir); ctx.fillRect(-3, -4, 6, 8); ctx.rotate(-0.25 * dir); ctx.fillRect(-1, -5, 6, 8);
    ctx.restore();
  }
  if (n.anim === 'wipe') { // pip polishing a glass
    const wx = sx + 12 + Math.sin(tick * 0.15) * 3;
    ctx.save(); ctx.fillStyle = 'rgba(200,220,230,0.6)'; ctx.fillRect(wx, gy - 22, 6, 9);
    ctx.fillStyle = 'rgba(230,225,210,0.8)'; ctx.fillRect(wx - 2 + Math.sin(tick * 0.3) * 2, gy - 18, 10, 3);
    ctx.restore();
  }
}

// in front of the player: railings, vignette, speech bubbles
function drawTavernOverlay() {
  const F = tavernFloorY();
  drawRailings(-camX, F);
  drawRegular(owl, -camX, F); // perched on the rail
  const v = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.3, W / 2, H * 0.55, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);

  drawTalkBubbles(REGULARS.concat(BALCONY_FOLK));
}
