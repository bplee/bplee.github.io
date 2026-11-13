/* ══════════════════════════════════════════
   THE DOZY GECKO — THE BALCONY
   A floor above the bar (BAL_H px up), reached by the stairs on the right.
   Same scene as the ground floor; things up here only respond when you're
   up here too (playerLevel() === 1).
     · nana fern (tortoise) rocking + knitting — kick her yarn ball around
     · lumen, a butterfly who insists he's a moth, circling the lamp
     · dusk the bat, hanging upside down from a beam
     · room 2 (politely haunted) and room 3 (hibernating)
     · room 1's bed: nap → time passes, the weather changes
     · rosco's lucky button, under the bookshelf
══════════════════════════════════════════ */
const fern  = makeRegular({ name: 'nana fern', kind: 'tortoise', color: '#9ab07a', x: 980, y: -BAL_H - 12, level: 1, talkR: 55, giftLine: 2, lines: [
  "knitting a scarf for gus. it's very long. he's very slow.",
  'back in my day we walked to this tavern. took eleven years.',
  "here, dear — i made two. one for gus, one for you. it's a bit long.",
  'you remind me of my grandson. he was a pebble. lovely pebble.',
  "pass me that yarn, dear? …oh. you've kicked it.",
]});
const lumen = makeRegular({ name: 'lumen', kind: 'moth', color: '#d8c890', x: 520, y: -BAL_H - 80, level: 1, talkR: 60, lines: [
  "i'm a moth.",
  'no. a moth. the colours are a phase.',
  'this lamp understands me.',
  'have you SEEN the lanterns downstairs? so many. scandalous.',
]});
const dusk  = makeRegular({ name: 'dusk', kind: 'bat', color: '#9088a0', x: 860, y: -BAL_H - 92, level: 1, talkR: 50, bubbleDY: 30, lines: [
  "everything's upside down up here. or is it you?",
  "i'm not sleeping. i'm hanging out.",
  'the moth and i have an arrangement. he gets the lamp, i get the dark.',
  'shh. the ceiling is listening.',
]});
const ghost = makeRegular({ name: 'the ghost', kind: 'ghost', color: '#c8d0e0', x: 620, y: -BAL_H - 6, level: 1, talkR: 0, lines: [
  'oh! sorry! occupied! so sorry!',
  "i'm not haunting, i'm just… staying a while.",
  'could you knock a bit more quietly? you startled me. me!',
]});
const room3 = makeRegular({ name: 'room 3', kind: null, color: '#888888', x: 760, y: -BAL_H - 40, level: 1, talkR: 0, lines: [
  '*snoooooore* (a note on the door: hibernating till spring.)',
  '*snrk* …five more months… *snoooore*',
  '*a single, enormous snore rattles the door*',
]});
const BALCONY_FOLK = [fern, lumen, dusk, ghost, room3];

const doors = { ghostOpen: 0 };
const yarn = { x: 935, vx: 0, rot: 0, wandered: false };
const BUTTON_X = 420;
let napping = false;
const balFx = [];

function balconyTargets() {
  return [
    { x: 290, r: 60, level: 1, popup: 'room 1 · a cozy bed. press E to nap', act: nap },
    { x: 620, r: 34, level: 1, popup: 'room 2 · press E to knock', act: () => { doors.ghostOpen = 240; say(ghost, regularLine(ghost), true); } },
    { x: 760, r: 34, level: 1, popup: 'room 3 · "do not disturb"', act: () => say(room3, regularLine(room3), true) },
    ...[fern, lumen, dusk].map(n => ({ x: n.x, r: n.talkR, level: 1, npc: n, popup: `press E to talk to ${n.name}`, act: () => talkBalcony(n) })),
  ];
}

function talkBalcony(n) {
  const line = regularLine(n);
  say(n, line, true);
  if (n === fern && line.startsWith('here, dear')) setTimeout(() => give('scarf', 'nana fern'), 700);
}

function balconyPopup() {
  if (playerLevel() !== 1) return null;
  if (!hasItem('button') && !quest.buttonReturned && Math.abs(player.wx - BUTTON_X) < 50) return 'something shiny under the bookshelf…';
  return null;
}

function nap() {
  if (napping) return;
  napping = true;
  transitioning = true;
  const fade = document.getElementById('fade');
  fade.style.transition = 'opacity 0.9s ease';
  fade.style.display = 'block';
  showHint('zzz…', 1800);
  requestAnimationFrame(() => { fade.style.opacity = '1'; });
  setTimeout(() => {
    // time passes: new weather, already fully set in
    const next = pickWeather();
    setWeather(next);
    for (const k in weather.amt) weather.amt[k] = k === next ? 1 : 0;
    weather.wind = weather.windTarget;
    weather.snowCover = next === 'snow' ? 0.7 : 0;
    if (player.drink) { player.drink = null; player.mods = { speed: 1, jump: 1, grav: 1 }; updateDrinkHud(); }
    fade.style.opacity = '0';
    setTimeout(() => {
      fade.style.display = 'none'; transitioning = false; napping = false;
      showHint(`you nap. you wake up to: ${WEATHER_TYPES[next].label}`, 3500);
    }, 950);
  }, 2200);
}

/* ── UPDATE ── */
function updateBalcony() {
  const B = tavernFloorY() - BAL_H;
  BALCONY_FOLK.forEach(n => { if (n.bubbleT > 0) n.bubbleT--; });
  if (doors.ghostOpen > 0) doors.ghostOpen--;

  // the moth circles the lamp
  lumen.x = 520 + Math.cos(tick * 0.045) * 30 + Math.sin(tick * 0.13) * 8;
  lumen.y = -BAL_H - 82 + Math.sin(tick * 0.07) * 14;

  const up = playerLevel() === 1 && player.onPlatform;
  if (up && !hasItem('button') && !quest.buttonReturned && Math.abs(player.wx - BUTTON_X) < 14) {
    give('button');
    showHint('you found a lucky button! rosco will want this back.', 3000);
  }

  // kick the yarn
  if (up && Math.abs(player.wx - yarn.x) < 14 && Math.abs(player._vx) > 0.3 &&
      Math.sign(player._vx) === Math.sign(yarn.x - player.wx || player._vx)) yarn.vx = player._vx * 1.6;
  yarn.x += yarn.vx; yarn.rot += yarn.vx / 7; yarn.vx *= 0.985;
  if (Math.abs(yarn.vx) < 0.02) yarn.vx = 0;
  if (yarn.x < BAL_X0 + 12) { yarn.x = BAL_X0 + 12; yarn.vx *= -0.6; }
  if (yarn.x > BAL_X1 - 12) { yarn.x = BAL_X1 - 12; yarn.vx *= -0.6; }
  if (Math.abs(yarn.x - fern.x) > 260 && !yarn.wandered && fern.bubbleT === 0) {
    yarn.wandered = true;
    say(fern, 'my yarn! …oh, let it roam. it always comes back.');
  }
  if (Math.abs(yarn.x - fern.x) < 120) yarn.wandered = false;

  if (tick % 90 === 0)  balFx.push({ ch: 'z', x: 760 + rand(-6, 6), y: B - 70, vx: 0.2, vy: -0.4, life: 1 });
  if (tick % 120 === 0) balFx.push({ ch: 'Z', x: 760 + rand(-6, 6), y: B - 80, vx: 0.3, vy: -0.5, life: 1 });
  if (!hasItem('button') && !quest.buttonReturned && tick % 25 === 0)
    balFx.push({ spark: true, x: BUTTON_X + rand(-6, 6), y: B - 6 + rand(-4, 2), vx: 0, vy: -0.15, life: 0.8 });
  for (let i = balFx.length - 1; i >= 0; i--) {
    const f = balFx[i]; f.x += f.vx; f.y += f.vy; f.life -= 0.008;
    if (f.life <= 0) balFx.splice(i, 1);
  }
}

/* ── DRAW (behind the balcony railing) ── */
function drawBalconyBack(ox, F, flick) {
  const B = F - BAL_H;

  // a rug along the balcony
  ctx.fillStyle = 'rgba(110,70,90,0.3)'; ctx.fillRect(ox + 420, B - 3, 560, 3);

  // bed nook (room 1)
  ctx.fillStyle = '#18110c'; ctx.fillRect(ox + 225, B - 105, 130, 105);
  ctx.strokeStyle = '#4a3522'; ctx.lineWidth = 3; ctx.strokeRect(ox + 225, B - 105, 130, 105);
  ctx.fillStyle = '#5a3a2a'; ctx.fillRect(ox + 235, B - 30, 110, 18); ctx.fillRect(ox + 235, B - 48, 8, 48); ctx.fillRect(ox + 337, B - 38, 8, 38);
  ctx.fillStyle = '#6a7aa0'; manualRoundRect(ox + 245, B - 40, 94, 12, 5); ctx.fill();
  ctx.fillStyle = 'rgba(240,230,210,0.9)'; manualRoundRect(ox + 245, B - 46, 24, 9, 4); ctx.fill();
  ctx.fillStyle = 'rgba(200,120,120,0.6)';
  for (let i = 0; i < 5; i++) ctx.fillRect(ox + 274 + i * 13, B - 38, 6, 6);
  ctx.fillStyle = 'rgba(230,205,160,0.6)'; ctx.font = '9px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText('room 1 · yours?', ox + 290, B - 112);
  ctx.fillStyle = 'rgba(240,230,210,0.9)'; ctx.fillRect(ox + 350, B - 22, 4, 10);
  ctx.fillStyle = `rgba(255,200,110,${0.9 * flick})`; ctx.beginPath(); ctx.ellipse(ox + 352, B - 25, 2, 4, 0, 0, 7); ctx.fill();
  drawLanternGlow(ox + 352, B - 25, 50, 0.2 * flick);

  // bookshelf
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(ox + 375, B - 100, 90, 100);
  const SPINES = ['#7a5a8a', '#5a7a6a', '#a06050', '#c0a060', '#507090', '#8a8a6a'];
  for (let s = 0; s < 3; s++) {
    ctx.fillStyle = '#2a1e14'; ctx.fillRect(ox + 379, B - 96 + s * 32, 82, 27);
    for (let b = 0; b < 8; b++) {
      const h = 16 + ((b * 7 + s * 3) % 9);
      ctx.fillStyle = SPINES[(b + s) % SPINES.length];
      ctx.fillRect(ox + 381 + b * 10, B - 69 + s * 32 - h, 8, h);
    }
  }

  // doors 2 + 3
  [[620, '2', 'haunted (politely)'], [760, '3', 'do not disturb']].forEach(([dx, num, note]) => {
    const isGhost = num === '2', open = isGhost && doors.ghostOpen > 0;
    const shake = !isGhost && tick % 120 < 12 ? Math.sin(tick * 2) * 1.2 : 0;
    const x = ox + dx - 24 + shake;
    ctx.fillStyle = '#0c0907'; ctx.fillRect(ox + dx - 24, B - 80, 48, 80);
    if (open) {
      ctx.fillStyle = 'rgba(180,200,230,0.08)'; ctx.fillRect(ox + dx - 24, B - 80, 48, 80);
      ctx.fillStyle = '#3a2a1c'; ctx.fillRect(ox + dx - 30, B - 80, 8, 80);
    } else {
      ctx.fillStyle = '#3a2a1c'; ctx.fillRect(x, B - 80, 48, 80);
      ctx.strokeStyle = 'rgba(170,135,95,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(x + 6, B - 72, 36, 30); ctx.strokeRect(x + 6, B - 36, 36, 30);
      ctx.fillStyle = 'rgba(220,180,110,0.9)'; ctx.beginPath(); ctx.arc(x + 40, B - 40, 2, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = '#4a3522'; ctx.lineWidth = 3; ctx.strokeRect(ox + dx - 24, B - 80, 48, 80);
    ctx.fillStyle = 'rgba(220,190,130,0.85)'; ctx.font = '10px Space Mono, monospace'; ctx.textAlign = 'center';
    ctx.fillText(num, ox + dx, B - 86);
    ctx.fillStyle = 'rgba(230,205,160,0.5)'; ctx.font = '8px Space Mono, monospace';
    ctx.fillText(note, ox + dx, B - 98);
  });
  if (doors.ghostOpen > 0) {
    const a = Math.min(1, doors.ghostOpen / 30, (240 - doors.ghostOpen) / 15);
    ctx.save(); ctx.globalAlpha = a * (0.75 + Math.sin(tick * 0.1) * 0.15);
    drawCritter(ox + 620, B - 6 + Math.sin(tick * 0.08) * 3, 'ghost', { color: '#c8d0e0', dir: faceToward(620) });
    ctx.restore();
  }

  // small window on the balcony level
  drawWeatherWindow(ox + 1040, B - 100, 60, 56);
  ctx.strokeStyle = '#4a3522'; ctx.lineWidth = 4; ctx.strokeRect(ox + 1040, B - 100, 60, 56);

  // lamps hanging from the beam (lumen's is the first)
  [520, 900, 1180].forEach((x, i) => hangingLantern(ox + x, B - 116, B - 90 + Math.sin(tick * 0.03 + i) * 1.5, flick, 120));

  // fern's rocking chair + fern, rocking together
  const rock = Math.sin(tick * 0.035) * 0.08;
  ctx.save(); ctx.translate(ox + fern.x, B); ctx.rotate(rock);
  ctx.strokeStyle = '#5a4230'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, -60, 64, Math.PI * 0.38, Math.PI * 0.62); ctx.stroke();
  ctx.fillStyle = '#4a3522'; ctx.fillRect(-22, -14, 44, 6); ctx.fillRect(-26, -58, 6, 50); ctx.fillRect(-22, -14, 4, 12); ctx.fillRect(16, -14, 4, 12);
  drawCritter(0, -12, 'tortoise', { color: fern.color, dir: 1, label: fern.name, labelY: 30 });
  const k = Math.sin(tick * 0.25) * 3;
  ctx.strokeStyle = 'rgba(210,200,180,0.9)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(14, -30 + k); ctx.lineTo(22, -20); ctx.moveTo(26, -30 - k); ctx.lineTo(18, -20); ctx.stroke();
  ctx.fillStyle = 'rgba(200,110,120,0.85)'; ctx.fillRect(16, -20, 8, 10);
  ctx.restore();
  ctx.strokeStyle = 'rgba(200,110,120,0.7)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ox + fern.x + 20, B - 16);
  ctx.quadraticCurveTo((ox + fern.x + ox + yarn.x) / 2, B + 2, ox + yarn.x, B - 7); ctx.stroke();
  ctx.save(); ctx.translate(ox + yarn.x, B - 7); ctx.rotate(yarn.rot);
  ctx.fillStyle = '#c86e78'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,200,200,0.6)'; ctx.beginPath(); ctx.arc(0, 0, 4.5, 0.3, 2.6); ctx.moveTo(-6, -2); ctx.lineTo(6, 3); ctx.stroke();
  ctx.restore();

  // the bat, upside down from the beam
  ctx.save(); ctx.translate(ox + dusk.x, B - 116); ctx.rotate(Math.PI + Math.sin(tick * 0.02) * 0.08);
  drawCritter(0, 0, 'bat', { color: dusk.color });
  ctx.restore();
  ctx.fillStyle = 'rgba(200,190,170,0.5)'; ctx.font = '8px Space Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText('dusk', ox + dusk.x, B - 64);

  // the "moth"
  drawCritter(ox + lumen.x, F + lumen.y, 'moth', { color: lumen.color, scale: 1.1 });
  ctx.fillStyle = 'rgba(200,190,170,0.5)'; ctx.font = '8px Space Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText('lumen (a moth)', ox + lumen.x, F + lumen.y - 16);

  // zzz from room 3, sparkle on the button
  ctx.save(); ctx.textAlign = 'center';
  balFx.forEach(f => {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    if (f.spark) { ctx.fillStyle = 'rgba(255,230,150,0.95)'; ctx.fillRect(ox + f.x - 0.75, f.y - 2.5, 1.5, 5); ctx.fillRect(ox + f.x - 2.5, f.y - 0.75, 5, 1.5); }
    else { ctx.fillStyle = 'rgba(230,215,180,0.8)'; ctx.font = '10px Space Mono, monospace'; ctx.fillText(f.ch, ox + f.x, f.y); }
  });
  ctx.restore();
  if (!hasItem('button') && !quest.buttonReturned) {
    ctx.fillStyle = 'rgba(200,170,90,0.9)'; ctx.beginPath(); ctx.arc(ox + BUTTON_X, B - 3, 3, 0, 7); ctx.fill();
  }
}
