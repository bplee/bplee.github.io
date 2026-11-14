/* ══════════════════════════════════════════
   MARIGOLD'S GENERAL STORE — next door to the dozy gecko
   A little shopfront with an open counter window. marigold the goose
   sells sailcloth (for birch's boat) and marshmallows (for rae), one gold
   nugget each, plus personal things (boots, umbrella, fins, snorkel, compass,
   charm). gold comes from the old mine under the hill, from nuggets buried
   in the meadows (dig with the shovel), and from spare logs marigold buys.

   · E on the right of the counter talks (quest sales happen in the talk)
   · E on the left, under the wares rack, (or B anywhere near) opens the shop:
     arrows choose, E / enter buys, esc closes; tap a row to buy it.
     The panel pauses the game by borrowing menu.open (see main.js).
   · gear effects live here: updatePlayer / weatherPhysics are wrapped below.
══════════════════════════════════════════ */
const STORE_X = 5010;

const marigold = makeRegular({ name: 'marigold', kind: 'goose', color: '#d8d4c8', x: STORE_X + 10, greeted: false });
OUT_TALKERS.push({ n: marigold, at: () => [marigold.x, groundY(STORE_X) - 118] });

const MARI_FLAVOR = [
  'honk. sorry. that slips out when i\'m concentrating.',
  "string, soap, buttons, lamp oil, and one jar of something nobody's opened in nine years. the jar's not for sale. the jar is a mystery.",
  'rosco comes in every day to look at the buttons. he never buys one. i think he just likes them.',
  "if you're going somewhere far, bring a scarf. i say that to everyone. i'm usually right.",
  'the wares on the left of the window are for sale. boots, an umbrella, fins, a snorkel, a compass, a little clover. stand there and press E. i pretend not to watch.',
  "gold is gold. i also pay a nugget for a spare log, if you've got one. i don't know what i do with them. i have a lot of logs.",
  "the old miners buried a few nuggets in the meadows, so the moles say. bring a shovel. the lumpy bits of ground are the ones to try.",
];
function sell(id, line) {
  stack('gold', -1);
  setTimeout(() => give(id, 'marigold'), 700);
  return line;
}
function talkToMarigold() {
  let line;
  const gold = inv.gold || 0;
  const wantCloth = questState.boat === 'open' && !hasItem('canvas') && !boat.sail;
  const wantMallows = questState.bonfire === 'open' && !hasItem('mallows');
  if (!marigold.greeted) {
    marigold.greeted = true;
    line = "welcome to marigold's! everything you need, and several things you don't. browse, browse.";
  } else if (wantCloth) {
    line = gold ? sell('canvas', "sailcloth? i keep one bolt for emergencies, and a boat is always an emergency. one gold nugget. pleasure doing business!")
                : "sailcloth's one gold nugget, dear. no gold? the old miners left plenty under the hill, so the moles say.";
  } else if (wantMallows) {
    line = gold ? sell('mallows', "marshmallows! for rae? tell her to hold them just above the fire, not in it. everyone puts them in it. one nugget.")
                : "marshmallows are one gold nugget. they're very good marshmallows. i'm not allowed to give them away. i asked myself.";
  } else line = MARI_FLAVOR[marigold.li++ % MARI_FLAVOR.length];
  say(marigold, line, true);
}
const nearShelves = () => scene === 'outside' && !vball.active && player.wx >= STORE_X - 100 && player.wx < STORE_X - 30;
OUT_SPOTS.push(() => {
  if (nearShelves()) return { text: "marigold's wares · press E to shop", act: openShop };
  if (player.wx < STORE_X - 30 || player.wx > STORE_X + 60 || vball.active) return null;
  return { text: marigold.greeted ? 'press E to talk to marigold' : "marigold's general store · press E to talk", act: talkToMarigold };
});
// B opens the shop from anywhere around the store (keyboard shortcut)
window.addEventListener('keydown', e => {
  if (e.code !== 'KeyB' || e.repeat || transitioning || !started || scene !== 'outside' || menu.open || vball.active) return;
  if (Math.abs(player.wx - STORE_X) < 100) openShop();
});

/* ── draw: the shopfront ── */
function drawStoreFront() {
  const sx = STORE_X - camX;
  if (sx < -200 || sx > W + 200) return;
  const gy = groundY(STORE_X), flick = 0.85 + Math.sin(tick * 0.19) * 0.05;
  ctx.save();
  const lg = ctx.createRadialGradient(sx, gy, 5, sx, gy, 160);
  lg.addColorStop(0, `rgba(255,190,110,${0.13 * flick})`); lg.addColorStop(1, 'rgba(255,190,110,0)');
  ctx.fillStyle = lg; ctx.fillRect(sx - 170, gy - 120, 340, 140);
  // walls + roof
  ctx.fillStyle = '#2d241c'; ctx.strokeStyle = 'rgba(170,135,95,0.55)'; ctx.lineWidth = 1;
  ctx.fillRect(sx - 95, gy - 150, 190, 150); ctx.strokeRect(sx - 95, gy - 150, 190, 150);
  ctx.strokeStyle = 'rgba(120,95,65,0.3)';
  for (let x = sx - 95; x < sx + 95; x += 14) { ctx.beginPath(); ctx.moveTo(x, gy - 150); ctx.lineTo(x, gy); ctx.stroke(); }
  ctx.fillStyle = '#1e1611'; ctx.strokeStyle = 'rgba(170,135,95,0.65)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(sx - 112, gy - 148); ctx.lineTo(sx - 70, gy - 196); ctx.lineTo(sx + 70, gy - 196); ctx.lineTo(sx + 112, gy - 148); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (weather.snowCover > 0.02) { ctx.strokeStyle = `rgba(235,240,248,${0.3 + weather.snowCover * 0.6})`; ctx.lineWidth = 2 + weather.snowCover * 6; ctx.beginPath(); ctx.moveTo(sx - 110, gy - 150); ctx.lineTo(sx - 70, gy - 198); ctx.lineTo(sx + 70, gy - 198); ctx.lineTo(sx + 110, gy - 150); ctx.stroke(); }
  // sign board
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(sx - 70, gy - 186, 140, 26);
  ctx.strokeStyle = 'rgba(170,135,95,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(sx - 70, gy - 186, 140, 26);
  ctx.fillStyle = 'rgba(230,205,160,0.9)'; ctx.font = '9px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText("marigold's", sx, gy - 175); ctx.font = '7px Space Mono, monospace'; ctx.fillText('general store', sx, gy - 165);
  // the counter window (marigold leans out of it)
  ctx.fillStyle = `rgba(255,190,110,${0.5 * flick})`; ctx.fillRect(sx - 30, gy - 138, 80, 74);
  // shelves behind her: jars, a bolt of cloth, a bag of marshmallows
  ctx.fillStyle = 'rgba(70,50,32,0.8)'; ctx.fillRect(sx - 30, gy - 118, 80, 2); ctx.fillRect(sx - 30, gy - 96, 80, 2);
  [['rgba(200,160,100,0.8)', -24, 118], ['rgba(140,180,120,0.7)', -14, 118], ['rgba(220,210,190,0.8)', 30, 118], ['rgba(180,120,100,0.75)', 40, 118], ['rgba(230,225,210,0.9)', -24, 96], ['rgba(240,240,250,0.85)', 38, 96]].forEach(([c, dx, dy]) => {
    ctx.fillStyle = c; ctx.fillRect(sx + dx, gy - dy - 9, 7, 9);
  });
  // the wares rack on the wall, left of the window: the six personal things, small
  ctx.fillStyle = 'rgba(74,52,32,0.9)'; ctx.fillRect(sx - 92, gy - 136, 60, 54);
  ctx.strokeStyle = 'rgba(170,135,95,0.5)'; ctx.strokeRect(sx - 92, gy - 136, 60, 54);
  ['boots', 'umbrella', 'fins', 'snorkel', 'compass', 'charm'].forEach((id, i) => {
    const k = 0.42, x = sx - 90 + (i % 3) * 19.5, y = gy - 134 + Math.floor(i / 3) * 26;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ITEM_ART[id](48, 48); ctx.restore();
  });
  // marigold
  drawCritter(sx + 10, gy - 66, 'goose', { color: marigold.color, dir: faceToward(STORE_X, -1), scale: 1.05 });
  // counter
  ctx.fillStyle = '#4a3420'; ctx.fillRect(sx - 36, gy - 68, 92, 8);
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(sx - 34, gy - 60, 88, 60);
  ctx.strokeStyle = 'rgba(170,135,95,0.4)'; ctx.strokeRect(sx - 34, gy - 60, 88, 60);
  // a little brass bell on the counter
  ctx.fillStyle = 'rgba(220,180,90,0.9)'; ctx.beginPath(); ctx.arc(sx + 44, gy - 70, 3.5, Math.PI, 0); ctx.fill(); ctx.fillRect(sx + 40, gy - 70, 8, 1.5);
  // striped awning over the window
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(230,220,200,0.85)' : 'rgba(170,80,70,0.85)';
    ctx.beginPath(); ctx.moveTo(sx - 40 + i * 14, gy - 152); ctx.lineTo(sx - 26 + i * 14, gy - 152); ctx.lineTo(sx - 26 + i * 14, gy - 144); ctx.arc(sx - 33 + i * 14, gy - 144, 7, 0, Math.PI); ctx.closePath(); ctx.fill();
  }
  // a crate + barrel out front
  ctx.fillStyle = '#4a3622'; ctx.fillRect(sx - 88, gy - 26, 30, 26);
  ctx.strokeStyle = 'rgba(30,20,12,0.6)'; ctx.beginPath(); ctx.moveTo(sx - 88, gy - 26); ctx.lineTo(sx - 58, gy); ctx.moveTo(sx - 58, gy - 26); ctx.lineTo(sx - 88, gy); ctx.stroke();
  ctx.fillStyle = '#3e2c1c'; ctx.beginPath(); ctx.ellipse(sx + 76, gy - 16, 13, 17, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(150,150,160,0.6)'; ctx.beginPath(); ctx.moveTo(sx + 63, gy - 24); ctx.lineTo(sx + 89, gy - 24); ctx.moveTo(sx + 63, gy - 8); ctx.lineTo(sx + 89, gy - 8); ctx.stroke();
  ctx.restore();
}

/* ══════════════════════════════════════════
   THE SHOP — wares, buying, selling spare logs
══════════════════════════════════════════ */
const WARES = [
  { id: 'boots',    price: 3, say: "boots! good ones. the soles are bread crusts, nearly. you'll feel quicker, dear." },
  { id: 'umbrella', price: 3, say: "it keeps the drizzle off, and if you hold jump in the air, it catches you. gently. i tested it on a cat." },
  { id: 'fins',     price: 2, say: "for the lake and the sea. you'll waddle on land. everyone does. nobody minds." },
  { id: 'snorkel',  price: 2, say: "twice the breath, near enough. the deep trench still wants a proper helmet. i don't make the rules. the trench does." },
  { id: 'compass',  price: 2, say: "the needle points to whoever's waiting on you. if nobody is, it points to buried things. it's an honest compass." },
  { id: 'charm',    price: 1, say: "a four-leaf clover, pressed and pinned. dig with it on and the ground sometimes gives a little extra." },
];
const shop = { open: false, sel: 0, line: '', el: null };

// spare logs: all of them once the hull is built, otherwise whatever's over the three birch needs
const spareLogs = () => Math.max(0, (inv.wood || 0) - (boat.hull ? 0 : 3));
const wantsCloth   = () => questState.boat === 'open' && !hasItem('canvas') && !boat.sail;
const wantsMallows = () => questState.bonfire === 'open' && !hasItem('mallows');
function shopRows() {
  const rows = [];
  if (wantsCloth())   rows.push({ kind: 'quest', id: 'canvas',  price: 1 });
  if (wantsMallows()) rows.push({ kind: 'quest', id: 'mallows', price: 1 });
  WARES.forEach(w => rows.push({ kind: 'ware', id: w.id, price: w.price, say: w.say }));
  if (spareLogs() > 0) rows.push({ kind: 'sell', id: 'wood', price: 1 });
  return rows;
}

function shopBuy(i) {
  const r = shopRows()[i]; if (!r) return;
  shop.sel = i;
  const gold = inv.gold || 0;
  if (r.kind === 'sell') {
    stack('wood', -1); stack('gold', 1);
    shop.line = "a log! lovely. one gold nugget. i'll think of something to do with it.";
  } else if (hasItem(r.id)) {
    shop.line = "you've already got that one, dear. one is plenty.";
  } else if (gold < r.price) {
    shop.line = `that's ${r.price} gold nugget${r.price > 1 ? 's' : ''}, dear, and you've got ${gold}. ${gold ? 'nearly!' : 'the old mine, or a good shovel, might help.'}`;
  } else {
    stack('gold', -r.price);
    give(r.id, 'marigold');
    shop.line = r.say || (r.id === 'canvas' ? 'sailcloth! for the boat. pleasure doing business.' : 'marshmallows! hold them just above the fire, not in it.');
    achieve('shopper');
    if (WARES.every(w => hasItem(w.id))) achieve('allwares');
  }
  renderShop();
}

function shopElement() {
  if (shop.el) return shop.el;
  const el = document.createElement('div');
  el.id = 'shop';
  el.style.cssText = "position:fixed;top:0;right:0;bottom:0;width:min(340px,92vw);z-index:95;display:flex;flex-direction:column;overflow-y:auto;"
    + "font-family:'Space Mono',monospace;color:rgba(235,228,214,0.9);background:rgba(16,18,24,0.94);border-left:0.5px solid rgba(255,255,255,0.1);box-sizing:border-box;padding:16px;";
  el.addEventListener('click', e => {
    if (e.target.closest && e.target.closest('[data-close]')) { closeShop(); return; }
    const row = e.target.closest && e.target.closest('[data-i]');
    if (row) shopBuy(+row.dataset.i);       // tap a row to buy it
  });
  if (document.body && document.body.appendChild) document.body.appendChild(el);
  return shop.el = el;
}

function renderShop() {
  const el = shopElement();
  ensureArt();
  const rows = shopRows();
  shop.sel = Math.max(0, Math.min(rows.length - 1, shop.sel));
  const gold = inv.gold || 0;
  const row = (r, i) => {
    const it = ITEMS[r.id], owned = r.kind === 'ware' && hasItem(r.id);
    const nm = r.kind === 'sell' ? 'sell a spare log' : r.kind === 'quest' ? (r.id === 'canvas' ? 'a bolt of sailcloth' : 'marshmallows') : it.name;
    const ds = r.kind === 'sell' ? `${spareLogs()} to spare` : it.desc;
    const price = owned ? 'yours' : r.kind === 'sell' ? '+◆ 1' : `◆ ${r.price}`;
    const afford = r.kind === 'sell' || owned || gold >= r.price;
    return `<div data-i="${i}" style="display:flex;gap:10px;align-items:center;padding:8px 10px;margin-bottom:6px;border-radius:10px;cursor:pointer;`
      + `background:rgba(255,255,255,${i === shop.sel ? 0.08 : 0.03});border:0.5px solid ${i === shop.sel ? 'rgba(255,216,144,0.5)' : 'rgba(255,255,255,0.08)'};${owned ? 'opacity:0.55;' : ''}">`
      + `<img src="${ART.items[r.id]}" alt="" style="width:40px;height:40px;flex:none">`
      + `<div style="flex:1;min-width:0"><div class="m-name">${esc(nm)}</div><div class="m-desc" style="margin-top:2px">${esc(ds)}</div></div>`
      + `<div style="flex:none;font-size:12px;color:${afford ? '#ffd890' : 'rgba(220,212,196,0.35)'}">${price}</div></div>`;
  };
  el.innerHTML = `<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px">`
    + `<div style="font-size:13px;letter-spacing:0.06em;color:rgba(250,240,220,0.95)">marigold's general store</div>`
    + `<button data-close="1" tabindex="-1" aria-label="close" style="font:inherit;font-size:18px;color:rgba(235,228,214,0.6);background:none;border:none;cursor:pointer;padding:0 4px">×</button></div>`
    + `<div style="font-size:11px;color:#ffd890;margin-bottom:8px">gold nuggets: ${gold}</div>`
    + `<div style="font-size:11px;line-height:1.5;font-style:italic;color:rgba(220,212,196,0.75);margin-bottom:12px;min-height:3em">${esc(shop.line)}</div>`
    + rows.map(row).join('')
    + `<div style="margin-top:auto;padding-top:10px;font-size:10px;color:rgba(220,212,196,0.45)">arrows choose · E buys · esc closes<br>tap a row to buy it</div>`;
}

const SHOP_HELLO = ["come in, come in. everything on this side is for sale. the jar is not.", "ah, a customer. or a browser. both are welcome."];
function openShop() {
  if (shop.open) return;
  shop.open = true; shop.sel = 0;
  shop.line = SHOP_HELLO[marigold.li++ % SHOP_HELLO.length];
  marigold.greeted = true;
  Object.keys(keys).forEach(k => keys[k] = false);
  menu.open = true;                       // pauses update() (main.js) and the E-key spots
  renderShop();
  shopElement().hidden = false;
}
function closeShop() {
  if (!shop.open) return;
  shop.open = false; menu.open = false;
  if (shop.el) shop.el.hidden = true;
}
// anything that closes "the menu" (a tap outside, esc) closes the shop
const _closeMenu = closeMenu;
closeMenu = function () { if (shop.open) closeShop(); else _closeMenu(); };
function shopKey(e) {
  const c = e.code, n = shopRows().length;
  if (c === 'Escape' || c === 'KeyB') { if (!e.repeat) closeShop(); return; }
  if (c === 'ArrowUp' || c === 'KeyW' || c === 'ArrowLeft' || c === 'KeyA') shop.sel = (shop.sel + n - 1) % n;
  else if (c === 'ArrowDown' || c === 'KeyS' || c === 'ArrowRight' || c === 'KeyD') shop.sel = (shop.sel + 1) % n;
  else if (!e.repeat && (c === 'KeyE' || c === 'Enter' || c === 'Space')) { shopBuy(shop.sel); return; }
  renderShop();
}

/* ══════════════════════════════════════════
   BURIED NUGGETS — a second source of gold (needs the shovel)
══════════════════════════════════════════ */
const DIG_SPOTS = [560, 980, 1450, 2100, 2550, 4300, 5560, 5980, 6620, 6960].map((x, i) => ({ x, i, dug: false }));
const digSpotNear = () => DIG_SPOTS.find(d => !d.dug && Math.abs(player.wx - d.x) < 34);
OUT_SPOTS.push(() => {
  if (vball.active || !player.onGround) return null;
  const d = digSpotNear(); if (!d) return null;
  return hasItem('shovel') ? { text: 'loose earth, and a glint · press E to dig', act: () => digSpot(d) }
                           : { text: 'the earth is loose here. a shovel would help…', act: null };
});
function digSpot(d) {
  if (d.dug) return;
  d.dug = true;
  const n = 1 + (wearing('charm') && d.i % 3 === 0 ? 1 : 0);   // the clover charm: every third spot has a little extra
  stack('gold', n);
  for (let k = 0; k < 8; k++) drinkFx.push({ k: 'sparkle', x: d.x + rand(-14, 14), y: groundY(d.x) - rand(4, 26), vy: -0.4, life: 1 });
  showHint(n > 1 ? 'two nuggets! the clover was right.' : 'a gold nugget, buried by someone long ago.', 2400);
  if (DIG_SPOTS.every(s => s.dug)) achieve('treasure');
}
function drawDigSpots() {
  DIG_SPOTS.forEach(d => {
    const sx = d.x - camX; if (d.dug || sx < -40 || sx > W + 40) return;
    const gy = groundY(d.x);
    ctx.fillStyle = 'rgba(70,52,36,0.95)'; ctx.beginPath(); ctx.ellipse(sx, gy, 15, 5, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = `rgba(255,220,120,${0.35 + 0.35 * Math.sin(tick * 0.07 + d.i)})`; ctx.fillRect(sx - 1, gy - 8, 2, 2); ctx.fillRect(sx + 3, gy - 5, 1.5, 1.5);
  });
}
function drawStore() { drawDigSpots(); drawStoreFront(); }

/* ══════════════════════════════════════════
   GEAR EFFECTS
   updatePlayer is wrapped: boots / fins nudge player.mods.speed for the step
   (restored after, so tavern drinks stay in charge), the umbrella caps the fall
   speed, fins speed up swimming, the snorkel halves the breath drain.
══════════════════════════════════════════ */
const BOOT_SPEED = 1.2, FIN_SWIM = 1.6, FIN_LAND = 0.9, UMB_FALL = 1.0, SNORKEL_SAVE = 0.5;
const _updatePlayer = updatePlayer;
updatePlayer = function () {
  const m = player.mods, speed0 = m.speed, breath0 = lake.breath;
  if (wearing('boots')) m.speed *= BOOT_SPEED;
  if (wearing('fins')) m.speed *= player.inWater ? FIN_SWIM : FIN_LAND;
  _updatePlayer();
  m.speed = speed0;
  // snorkel: only gets back what this step drained underwater (the deep trench still wants the helmet)
  if (wearing('snorkel') && lake.under && !wearing('helmet') && lake.breath < breath0 && !lake.surfacing)
    lake.breath += (breath0 - lake.breath) * SNORKEL_SAVE;
  // fins: stronger strokes up and down too
  if (wearing('fins') && player.inWater && !lake.strokeT) player.vy *= 1.15;
  // umbrella: hold jump while falling in open air to float down
  player.umbrellaOpen = false;
  if (wearing('umbrella') && !player.inWater && !player.onGround && player.vy > UMB_FALL && !player.climbing && !player.roping && !player.riding && !player.surfing
      && (keys['Space'] || keys['ArrowUp'] || keys['KeyW'])) {
    player.vy = UMB_FALL; player.umbrellaOpen = true;
  }
};
// the umbrella keeps the wet off: rain, storms and snow make the ground less slippery
const _weatherPhysics = weatherPhysics;
weatherPhysics = function () {
  const r = _weatherPhysics();
  if (wearing('umbrella')) r.slip *= 0.4;
  return r;
};

/* ── compass: where's the next thing? (world x, or null) ── */
function compassTarget() {
  const q = openQuests()[0];
  switch (q) {
    case 'button': case 'shovel': return TAVERN_X;
    case 'stars': case 'report': return OBS_X;
    case 'dig': case 'umber': case 'peri': return CAVE_X;
    case 'boat': {
      if (!boat.hull && (inv.wood || 0) < 3) { const f = FALLEN.find(f => !f.cut); return f ? f.x : BOAT_BUILD_X; }
      if (!boat.hull) return BOAT_BUILD_X;
      return !hasItem('canvas') && !boat.sail ? STORE_X : BOAT_BUILD_X;
    }
    case 'birds': return jun.x;
    case 'surf': return RAE_BEACH_X;
    case 'bonfire': return hasItem('mallows') ? BONFIRE_X : STORE_X;
    case 'schoolbell': case 'shelby': case 'nib': return SCHOOL_X;
  }
  const d = DIG_SPOTS.filter(d => !d.dug).sort((a, b) => Math.abs(a.x - player.wx) - Math.abs(b.x - player.wx))[0];
  return d ? d.x : null;
}

/* ── drawn on the mouse (called from drawWornItems in player.js, mouse-local space) ── */
function drawShopGear(s, bhx, bhy, fhx, fhy) {
  const frame = player.onGround ? player.walkFrame : 2, sw = [0, 18, 0, -18][frame] * Math.PI / 180;
  const feet = [[-1, sw], [1, -sw]].map(([sd, a]) => [sd * 11 * s * 0.3 + Math.sin(a) * 12 * s, -4 * s + Math.cos(a) * 18 * s]);
  // boots: dark caps over the feet · fins: long flippers
  if (wearing('boots')) feet.forEach(([x, y]) => {
    ctx.fillStyle = '#7a5434'; ctx.strokeStyle = 'rgba(40,26,14,0.9)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x - 2.4 * s, y - 7 * s); ctx.lineTo(x + 2.4 * s, y - 7 * s); ctx.lineTo(x + 2.4 * s, y - 1 * s); ctx.lineTo(x + 6.5 * s, y - 1 * s); ctx.lineTo(x + 6.5 * s, y + 2 * s); ctx.lineTo(x - 2.4 * s, y + 2 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
  });
  if (wearing('fins')) feet.forEach(([x, y]) => {
    const flap = player.inWater ? Math.sin(tick * 0.25 + x) * 2 * s : 0;
    ctx.fillStyle = 'rgba(80,175,170,0.92)'; ctx.strokeStyle = 'rgba(30,80,80,0.9)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x - 1 * s, y - 2 * s); ctx.lineTo(x + 14 * s, y + 1 * s + flap); ctx.lineTo(x + 14 * s, y + 5 * s + flap); ctx.lineTo(x - 1 * s, y + 2 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
  });
  // snorkel: a mask over the eye and a tube curling up behind the ear
  if (wearing('snorkel')) {
    ctx.strokeStyle = 'rgba(210,225,230,0.9)'; ctx.lineWidth = 1 * s;
    ctx.fillStyle = 'rgba(150,215,230,0.3)';
    ctx.beginPath(); ctx.ellipse(7 * s, -42 * s, 4.6 * s, 3.8 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2.4 * s, -42 * s); ctx.lineTo(-10 * s, -45 * s); ctx.stroke();
    ctx.strokeStyle = 'rgba(235,150,70,0.97)'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(12 * s, -37 * s); ctx.quadraticCurveTo(3 * s, -34 * s, -3 * s, -48 * s); ctx.lineTo(-3 * s, -66 * s); ctx.stroke();
  }
  // clover charm pinned to the chest
  if (wearing('charm')) {
    ctx.fillStyle = 'rgba(100,185,105,0.97)';
    [[-1.4, 0], [1.4, 0], [0, -1.4], [0, 1.4]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc((-1 + dx) * s, (-20 + dy) * s, 1.5 * s, 0, Math.PI * 2); ctx.fill(); });
  }
  // compass in the front hand: the needle turns toward the next open quest
  if (wearing('compass')) {
    const t = scene === 'outside' ? compassTarget() : null;
    const dxw = t === null ? 0 : t - player.wx, face = player.facingRight ? 1 : -1;   // the mouse is mirrored when facing left
    const ang = t === null || Math.abs(dxw) < 90 ? tick * 0.04 : (dxw * face > 0 ? 0 : Math.PI) + Math.sin(tick * 0.1) * 0.12;
    ctx.save(); ctx.translate(fhx, fhy + 5 * s);
    ctx.fillStyle = 'rgba(205,165,80,0.97)'; ctx.strokeStyle = 'rgba(120,85,30,0.95)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(0, 0, 4.2 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(245,235,205,0.95)'; ctx.beginPath(); ctx.arc(0, 0, 3.2 * s, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(ang);
    ctx.fillStyle = 'rgba(190,70,65,0.97)'; ctx.beginPath(); ctx.moveTo(3 * s, 0); ctx.lineTo(0, -0.9 * s); ctx.lineTo(0, 0.9 * s); ctx.fill();
    ctx.fillStyle = 'rgba(70,75,95,0.9)'; ctx.beginPath(); ctx.moveTo(-3 * s, 0); ctx.lineTo(0, -0.9 * s); ctx.lineTo(0, 0.9 * s); ctx.fill();
    ctx.restore();
  }
  // umbrella: open over your head while floating down, otherwise closed in the back hand
  if (wearing('umbrella')) {
    if (player.umbrellaOpen) {
      ctx.save(); ctx.translate(2 * s, -66 * s);
      ctx.strokeStyle = 'rgba(150,115,75,0.95)'; ctx.lineWidth = 1.3 * s; ctx.beginPath(); ctx.moveTo(0, 14 * s); ctx.lineTo(0, 0); ctx.stroke();
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(235,225,205,0.95)' : 'rgba(190,85,80,0.95)';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 22 * s, Math.PI + i * Math.PI / 4, Math.PI + (i + 1) * Math.PI / 4); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    } else {
      ctx.save(); ctx.translate(bhx, bhy + 1 * s); ctx.rotate(0.5);
      ctx.strokeStyle = 'rgba(150,115,75,0.95)'; ctx.lineWidth = 1.3 * s; ctx.beginPath(); ctx.moveTo(0, 5 * s); ctx.lineTo(0, -5 * s); ctx.stroke();
      ctx.fillStyle = 'rgba(190,85,80,0.95)'; ctx.beginPath(); ctx.moveTo(0, -18 * s); ctx.lineTo(2.6 * s, -4 * s); ctx.lineTo(-2.6 * s, -4 * s); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
}
