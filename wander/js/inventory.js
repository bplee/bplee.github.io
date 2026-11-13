/* ══════════════════════════════════════════
   BAG · FRIENDS · QUESTS
   · give(id, from)            — add an item (and remember who gave it)
   · wearing(id) / hasItem(id) — is it on / owned?
   · meet(name, line)          — remember someone you talked to (E)
   · startQuest(id) / completeQuest(id)
   Side panel: I = bag, J = friends, tab switches, arrows choose,
   E / enter toggles, esc closes. The game pauses while it's open.
   A strip at the bottom-left shows what you're wearing.
   Item + character pictures are drawn with the game's own canvas art
   (renderToURL) so everything matches.
══════════════════════════════════════════ */
const ITEMS = {
  blades:    { name: 'rollerblades',          desc: 'zoom. take them off to walk at a gentler pace.',              wearable: true },
  lantern:   { name: 'little lantern',        desc: 'a warm light to carry. fireflies follow it.',                wearable: true },
  feather:   { name: "owl's feather",         desc: 'tucked behind your ear. hold jump while falling to glide.',   wearable: true },
  scarf:     { name: 'a very long scarf',     desc: "keeps the snow off — you won't slow down in it.",             wearable: true },
  peanut:    { name: 'lucky peanut',          desc: 'hold it and the other team fumbles more often.',             wearable: true },
  bracelet:  { name: 'friendship bracelet',   desc: 'your bumps and spikes reach a little further.',              wearable: true },
  chart:     { name: 'star chart',            desc: 'hold it to see your charted constellations in the sky.',     wearable: true },
  shovel:    { name: "nova's shovel",         desc: 'for digging. there is a cave mouth somewhere that needs it.', wearable: true },
  glowstone: { name: 'glowstone',             desc: 'found deep in the cavern. it hums, faintly, and glows teal.', wearable: true },
  button:    { name: "rosco's lucky button",  desc: 'shiny. not yours. rosco is at the bar.',                      wearable: false },
};
const ITEM_ORDER = ['blades', 'lantern', 'feather', 'scarf', 'peanut', 'bracelet', 'chart', 'shovel', 'glowstone', 'button'];

const FRIENDS = {
  'clover':       { kind: 'bunny',    color: '#e8d5c0', species: 'bunny',    where: 'your volleyball partner' },
  'ember':        { kind: 'fox',      color: '#d4905a', species: 'fox',      where: 'setter on the other team' },
  'burr':         { kind: 'hedgehog', color: '#c8b89a', species: 'hedgehog', where: 'hitter on the other team. allegedly cheats.' },
  'pip':          { kind: 'gecko',    color: '#9cc77a', species: 'gecko',    where: 'bartender at the dozy gecko' },
  'rosco':        { kind: 'raccoon',  color: '#9a9aa6', species: 'raccoon',  where: 'on a stool at the bar' },
  'bramble':      { kind: 'badger',   color: '#b8b0a0', species: 'badger',   where: "the dozy gecko's bard" },
  'hazel':        { kind: 'squirrel', color: '#c8905a', species: 'squirrel', where: 'playing cards (badly)' },
  'ottoline':     { kind: 'otter',    color: '#a08060', species: 'otter',    where: 'playing cards (upside down)' },
  'owl':          { kind: 'owl',      color: '#c0a888', species: 'owl',      where: 'the one who told you to wander' },
  'mr. puddleby': { kind: 'toad',     color: '#7aa070', species: 'toad',     where: 'asleep by the fire' },
  'gus':          { kind: 'snail',    color: '#c0b080', species: 'snail',    where: 'crossing the tavern floor' },
  'nana fern':    { kind: 'tortoise', color: '#9ab07a', species: 'tortoise', where: 'knitting on the balcony' },
  'lumen':        { kind: 'moth',     color: '#d8c890', species: '“moth”',   where: 'circling the balcony lamp' },
  'dusk':         { kind: 'bat',      color: '#9088a0', species: 'bat',      where: 'hanging from a rafter' },
  'the ghost':    { kind: 'ghost',    color: '#c8d0e0', species: 'ghost',    where: 'room 2. very apologetic.' },
  'room 3':       { kind: 'door',     color: '#8a7a6a', species: '???',      where: 'hibernating till spring' },
  'nova':         { kind: 'raccoon',  color: '#a0a0b0', species: 'raccoon',  where: 'astronomer at the observatory' },
};

const QUESTS = {
  button: { giver: 'rosco', title: "rosco's lucky button", desc: 'rosco lost his lucky button somewhere up on the balcony.' },
  stars:  { giver: 'nova',  title: 'chart the stars',      desc: "find the four constellations through nova's telescope." },
  shovel: { giver: 'nova',  title: 'the borrowed shovel',  desc: "nova's cousin rosco borrowed her shovel. get it back from him." },
  dig:    { giver: 'nova',  title: 'the glowing cave',     desc: 'dig open the cave mouth at the bottom of the far side of the hill.' },
  report: { giver: 'nova',  title: "what's down there?",   desc: 'explore the cavern, then tell nova what you found.' },
};
const questState = {}; // id → 'open' | 'done'

const inv = { owned: {}, on: {} };
const met = {};   // name → { gifts: [itemId], last: '' }
const menu = { open: false, tab: 'bag', sel: 0, hover: null };

function wearing(id) { return !!(inv.owned[id] && inv.on[id]); }
function hasItem(id) { return !!inv.owned[id]; }

function give(id, from) {
  if (inv.owned[id]) return;
  inv.owned[id] = true;
  inv.on[id] = ITEMS[id].wearable;
  if (from) { meet(from); met[from].gifts.push(id); }
  showHint(`got: ${ITEMS[id].name}  ·  press I to see your bag`, 3200);
  pingPill(); renderMenu(); updateCarryHud();
}
function takeItem(id) { delete inv.owned[id]; delete inv.on[id]; renderMenu(); updateCarryHud(); }

function meet(name, line) {
  if (!FRIENDS[name]) return;
  const first = !met[name];
  const m = met[name] || (met[name] = { gifts: [], last: '' });
  if (line) m.last = line;
  if (first) {
    if (Object.keys(met).length === 1) showHint(`new friend: ${name}  ·  press J to see who you've met`, 3200);
    pingPill();
  }
  renderMenu();
}

function startQuest(id) {
  if (questState[id]) return;
  questState[id] = 'open';
  setTimeout(() => showHint(`new quest: ${QUESTS[id].title}  ·  press J`, 3200), 1800);
  pingPill(); renderMenu();
}
function completeQuest(id) {
  if (questState[id] === 'done') return;
  questState[id] = 'done';
  setTimeout(() => showHint(`quest complete: ${QUESTS[id].title}`, 3000), 1200);
  pingPill(); renderMenu();
}
const openQuests = () => Object.keys(QUESTS).filter(q => questState[q] === 'open');

// rollerblades are an item: the old "hasBlades" flag reads/writes the bag
Object.defineProperty(player, 'hasBlades', {
  get: () => wearing('blades'),
  set: v => { if (v) give('blades'); },
});

/* ══════════════════════════════════════════
   PICTURES — drawn once into data URLs with the game's canvas code
══════════════════════════════════════════ */
function renderToURL(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2;
  const prev = ctx;
  ctx = c.getContext('2d'); ctx.scale(2, 2);
  try { draw(w, h); } finally { ctx = prev; }
  return c.toDataURL();
}

const ITEM_ART = {
  blades: (w, h) => { drawRollerblade(w / 2 - 2, h / 2 - 4, 1.35); },
  lantern: (w, h) => {
    drawGlow(w / 2, h / 2 + 4, 22, 0.45);
    ctx.strokeStyle = 'rgba(160,130,90,0.95)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(w / 2, h / 2 - 12, 5, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#5a4230'; ctx.fillRect(w / 2 - 8, h / 2 - 9, 16, 4); ctx.fillRect(w / 2 - 8, h / 2 + 13, 16, 4);
    ctx.fillStyle = 'rgba(255,205,130,0.95)'; ctx.fillRect(w / 2 - 6, h / 2 - 5, 12, 18);
    ctx.strokeStyle = 'rgba(90,65,40,0.9)'; ctx.lineWidth = 1; ctx.strokeRect(w / 2 - 6, h / 2 - 5, 12, 18);
  },
  feather: (w, h) => {
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-0.6);
    ctx.fillStyle = 'rgba(210,190,150,0.6)'; ctx.strokeStyle = 'rgba(235,220,185,0.95)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, -2, 6, 16, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(0, -17); ctx.stroke();
    for (let i = -10; i < 12; i += 4) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(-5, i - 3); ctx.moveTo(0, i); ctx.lineTo(5, i - 3); ctx.stroke(); }
    ctx.restore();
  },
  scarf: (w, h) => {
    ctx.strokeStyle = 'rgba(200,110,120,0.95)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(10, 14); ctx.bezierCurveTo(30, 6, 18, 28, 36, 24); ctx.lineTo(38, 38); ctx.stroke();
    ctx.strokeStyle = 'rgba(245,215,215,0.7)'; ctx.lineWidth = 1.5;
    [[16, 12], [24, 15], [33, 23], [37, 31]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x - 2, y - 3); ctx.lineTo(x + 2, y + 3); ctx.stroke(); });
    ctx.strokeStyle = 'rgba(200,110,120,0.9)'; ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(38 + i * 1.5, 40); ctx.lineTo(38 + i * 2, 45); ctx.stroke(); }
  },
  peanut: (w, h) => {
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(0.5);
    ctx.fillStyle = 'rgba(205,165,110,0.95)'; ctx.strokeStyle = 'rgba(150,110,65,0.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, -7, 8, 9, 0, 0, 7); ctx.ellipse(0, 8, 8.5, 9.5, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -7, 8, 9, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.fillStyle = 'rgba(150,110,65,0.5)';
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(-4 + (i % 3) * 4, -10 + Math.floor(i / 3) * 8, 0.9, 0, 7); ctx.fill(); }
    ctx.restore();
  },
  bracelet: (w, h) => {
    const C = ['#9ccbe8', '#e8b0c0', '#f0d890', '#a8d8b0'];
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      ctx.fillStyle = C[i % 4]; ctx.beginPath(); ctx.arc(w / 2 + Math.cos(a) * 13, h / 2 + Math.sin(a) * 9, 3.2, 0, 7); ctx.fill();
    }
  },
  chart: (w, h) => {
    ctx.fillStyle = 'rgba(225,215,185,0.95)'; ctx.fillRect(8, 10, 32, 28);
    ctx.fillStyle = 'rgba(190,175,140,1)'; ctx.fillRect(6, 8, 4, 32); ctx.fillRect(38, 8, 4, 32);
    ctx.strokeStyle = 'rgba(60,80,140,0.8)'; ctx.lineWidth = 0.9;
    const P = [[14, 18], [20, 15], [26, 20], [32, 17], [30, 30], [18, 30]];
    ctx.beginPath(); P.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    ctx.fillStyle = 'rgba(40,60,120,0.9)'; P.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 1.4, 0, 7); ctx.fill(); });
  },
  shovel: (w, h) => {
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(0.7);
    ctx.strokeStyle = 'rgba(160,120,75,0.95)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, 6); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, -20); ctx.lineTo(5, -20); ctx.stroke();
    ctx.fillStyle = 'rgba(175,182,192,0.95)';
    ctx.beginPath(); ctx.moveTo(-7, 6); ctx.lineTo(7, 6); ctx.lineTo(6, 16); ctx.quadraticCurveTo(0, 23, -6, 16); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  glowstone: (w, h) => {
    drawGlow(w / 2, h / 2, 22, 0.55, [120, 230, 220]);
    ctx.fillStyle = 'rgba(160,245,235,0.95)'; ctx.strokeStyle = 'rgba(220,255,250,0.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(w / 2, h / 2 - 13); ctx.lineTo(w / 2 + 9, h / 2 - 2); ctx.lineTo(w / 2 + 5, h / 2 + 11); ctx.lineTo(w / 2 - 5, h / 2 + 11); ctx.lineTo(w / 2 - 9, h / 2 - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w / 2, h / 2 - 13); ctx.lineTo(w / 2, h / 2 + 11); ctx.stroke();
  },
  button: (w, h) => {
    ctx.fillStyle = 'rgba(210,175,95,0.95)'; ctx.beginPath(); ctx.arc(w / 2, h / 2, 13, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(150,115,55,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(w / 2, h / 2, 9.5, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(110,80,35,0.9)';
    [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(w / 2 + dx, h / 2 + dy, 1.6, 0, 7); ctx.fill(); });
  },
};

function drawPortrait(name, w, h) {
  const f = FRIENDS[name];
  if (f.kind === 'door') { // whoever is in room 3: just their door, snoring
    ctx.fillStyle = '#3a2a1c'; ctx.fillRect(w / 2 - 14, h - 52, 28, 46);
    ctx.strokeStyle = 'rgba(170,135,95,0.8)'; ctx.lineWidth = 1; ctx.strokeRect(w / 2 - 10, h - 48, 20, 16); ctx.strokeRect(w / 2 - 10, h - 28, 20, 16);
    ctx.fillStyle = 'rgba(230,215,180,0.85)'; ctx.font = '10px Space Mono, monospace'; ctx.textAlign = 'center';
    ctx.fillText('z', w / 2 + 18, h - 50); ctx.fillText('Z', w / 2 + 24, h - 60);
    return;
  }
  if (f.kind === 'bat')  { ctx.save(); ctx.translate(w / 2, 10); ctx.rotate(Math.PI); drawCritter(0, 0, 'bat', { color: f.color, scale: 1.7 }); ctx.restore(); return; }
  if (f.kind === 'moth') { drawCritter(w / 2, h / 2, 'moth', { color: f.color, scale: 2.2, flap: 1 }); return; }
  const scale = { snail: 1.7, toad: 1.6, hedgehog: 1.4, tortoise: 1.25, owl: 1.45 }[f.kind] || 1.15;
  drawCritter(w / 2, h - 6, f.kind, { color: f.color, scale, dir: 1 });
}

const ART = { items: {}, faces: {} };
function ensureArt() {
  if (ART.ready) return;
  ART.ready = true;
  ITEM_ORDER.forEach(id => ART.items[id] = renderToURL(48, 48, ITEM_ART[id]));
  Object.keys(FRIENDS).forEach(n => ART.faces[n] = renderToURL(64, 72, (w, h) => drawPortrait(n, w, h)));
}

/* ══════════════════════════════════════════
   HUD — what you're wearing, bottom-left
══════════════════════════════════════════ */
function updateCarryHud() {
  const el = document.getElementById('worn');
  if (!el) return;
  ensureArt();
  const on = ITEM_ORDER.filter(id => wearing(id) || (id === 'button' && hasItem(id)));
  el.hidden = !on.length;
  el.innerHTML = on.map(id => `<img src="${ART.items[id]}" alt="${esc(ITEMS[id].name)}" title="${esc(ITEMS[id].name)}" data-id="${id}">`).join('');
}

/* ══════════════════════════════════════════
   SIDE PANEL
══════════════════════════════════════════ */
function openMenu(tab) {
  ensureArt();
  menu.open = true; menu.tab = tab; menu.sel = 0; menu.hover = null;
  document.getElementById('menu').hidden = false;
  document.getElementById('menu-pill').hidden = true;
  Object.keys(keys).forEach(k => keys[k] = false); // don't keep walking when it closes
  renderMenu();
}
function closeMenu() {
  menu.open = false;
  document.getElementById('menu').hidden = true;
  document.getElementById('menu-pill').hidden = false;
}
function pingPill() {
  const pill = document.getElementById('menu-pill');
  if (pill) { pill.classList.remove('ping'); void pill.offsetWidth; pill.classList.add('ping'); }
  const qn = openQuests().length, badge = document.getElementById('pill-quests');
  if (badge) { badge.textContent = qn ? `${qn} quest${qn > 1 ? 's' : ''}` : ''; badge.hidden = !qn; }
}

function ownedList() { return ITEM_ORDER.filter(id => inv.owned[id]); }
function friendList() { return Object.keys(FRIENDS); }

function toggleItem(id) {
  if (!ITEMS[id].wearable) { showHint(`${ITEMS[id].name} — ${ITEMS[id].desc}`, 2500); return; }
  inv.on[id] = !inv.on[id];
  renderMenu(); updateCarryHud();
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const giverOf = id => Object.keys(met).find(n => met[n].gifts.includes(id));

function friendCard(n) {
  const f = FRIENDS[n], m = met[n];
  if (!m) return '<div class="m-card m-card-empty">someone you haven’t met yet. keep wandering.</div>';
  const qs = Object.keys(QUESTS).filter(q => QUESTS[q].giver === n && questState[q]);
  return `<div class="m-card">
    <div class="m-card-head"><img src="${ART.faces[n]}" alt=""><div><div class="m-name">${esc(n)}</div><div class="m-species">${esc(f.species)} · ${esc(f.where)}</div></div></div>
    ${m.last ? `<div class="m-quote">“${esc(m.last)}”</div>` : ''}
    ${m.gifts.length ? `<div class="m-sub">gave you</div><div class="m-gifts">${m.gifts.map(g => `<span class="m-gift"><img src="${ART.items[g]}" alt="">${esc(ITEMS[g].name)}</span>`).join('')}</div>` : ''}
    ${qs.length ? `<div class="m-sub">quests</div>${qs.map(q => `<div class="m-quest ${questState[q]}">${questState[q] === 'done' ? '✓ ' : ''}${esc(QUESTS[q].title)}</div>`).join('')}` : ''}
  </div>`;
}

function renderMenu() {
  const body = document.getElementById('menu-body');
  if (!body) return;
  document.querySelectorAll('#menu-tabs button[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === menu.tab));
  if (!menu.open) return;
  ensureArt();

  if (menu.tab === 'bag') {
    const list = ownedList();
    if (!list.length) { body.innerHTML = '<p class="m-empty">your bag is empty. go wander.</p>'; return; }
    menu.sel = Math.max(0, Math.min(list.length - 1, menu.sel));
    const id = list[menu.sel], it = ITEMS[id], from = giverOf(id);
    body.innerHTML = `<div class="m-grid">${list.map((iid, i) => `
        <button class="m-tile${i === menu.sel ? ' sel' : ''}${wearing(iid) ? ' on' : ''}" data-id="${iid}" data-i="${i}" tabindex="-1">
          <img src="${ART.items[iid]}" alt=""><span>${esc(ITEMS[iid].name)}</span></button>`).join('')}</div>
      <div class="m-card">
        <div class="m-card-head"><img src="${ART.items[id]}" alt=""><div><div class="m-name">${esc(it.name)}</div>
          ${it.wearable ? `<div class="m-state ${wearing(id) ? 'on' : ''}">${wearing(id) ? 'wearing · E to take off' : 'in your bag · E to put on'}</div>` : '<div class="m-state">carried</div>'}</div></div>
        <div class="m-desc">${esc(it.desc)}</div>
        ${from ? `<div class="m-from"><img src="${ART.faces[from]}" alt="">from ${esc(from)}</div>` : ''}
      </div>`;
  } else {
    const names = friendList();
    const oq = openQuests(), doneN = Object.keys(questState).filter(q => questState[q] === 'done').length;
    menu.sel = Math.max(0, Math.min(names.length - 1, menu.sel));
    const shown = menu.hover || names[menu.sel];
    body.innerHTML = `
      <div class="m-sub">friends · ${Object.keys(met).length} of ${names.length}${oq.length ? ` · <span class="m-qcount">${oq.length} open quest${oq.length > 1 ? 's' : ''}</span>` : ''}</div>
      <div class="m-grid faces">${names.map((n, i) => {
        const isMet = !!met[n], hasQ = oq.some(q => QUESTS[q].giver === n);
        return `<button class="m-face${isMet ? '' : ' unmet'}${hasQ ? ' quest' : ''}${n === shown ? ' sel' : ''}" data-name="${esc(n)}" data-i="${i}" tabindex="-1">
          ${isMet ? `<img src="${ART.faces[n]}" alt="${esc(n)}">` : '<span class="q">?</span>'}${hasQ ? '<b>!</b>' : ''}</button>`;
      }).join('')}</div>
      ${friendCard(shown)}
      ${oq.length || doneN ? `<div class="m-sub">open quests</div>${oq.map(q => `<div class="m-qrow"><img src="${ART.faces[QUESTS[q].giver]}" alt=""><div><div class="m-name">${esc(QUESTS[q].title)}</div><div class="m-desc">${esc(QUESTS[q].desc)}</div></div></div>`).join('') || '<p class="m-empty">none right now.</p>'}
        ${doneN ? `<p class="m-empty">${doneN} done.</p>` : ''}` : ''}`;
  }
}

function gridMove(dx, dy, n) {
  const cols = menu.tab === 'bag' ? 4 : 5;
  let i = menu.sel + dx + dy * cols;
  if (i < 0 || i >= n) i = Math.max(0, Math.min(n - 1, i));
  menu.sel = i; menu.hover = null;
}

// capture phase so nothing else (jumping, talking) sees keys while the panel is open
window.addEventListener('keydown', e => {
  if (!started) return;
  const c = e.code;
  if (!menu.open) {
    if (transitioning || obs.viewing) return;
    if (c === 'KeyI' || c === 'Tab') { e.preventDefault(); openMenu('bag'); e.stopImmediatePropagation(); }
    else if (c === 'KeyJ')          { openMenu('friends'); e.stopImmediatePropagation(); }
    return;
  }
  e.preventDefault(); e.stopImmediatePropagation();
  if (c === 'Escape' || (c === 'KeyI' && menu.tab === 'bag') || (c === 'KeyJ' && menu.tab === 'friends')) { if (!e.repeat) closeMenu(); return; }
  if (c === 'KeyI' || c === 'KeyJ' || c === 'Tab') { if (e.repeat) return; menu.tab = c === 'KeyI' ? 'bag' : c === 'KeyJ' ? 'friends' : (menu.tab === 'bag' ? 'friends' : 'bag'); menu.sel = 0; menu.hover = null; renderMenu(); return; }
  const n = menu.tab === 'bag' ? ownedList().length : friendList().length;
  if (c === 'ArrowLeft'  || c === 'KeyA') gridMove(-1, 0, n);
  if (c === 'ArrowRight' || c === 'KeyD') gridMove(1, 0, n);
  if (c === 'ArrowUp'    || c === 'KeyW') gridMove(0, -1, n);
  if (c === 'ArrowDown'  || c === 'KeyS') gridMove(0, 1, n);
  if (menu.tab === 'bag' && !e.repeat && (c === 'KeyE' || c === 'Enter' || c === 'Space')) { const id = ownedList()[menu.sel]; if (id) toggleItem(id); }
  renderMenu();
}, true);

window.addEventListener('load', () => {
  // clicking a button shouldn't leave it focused (space would "click" it again)
  document.addEventListener('mouseup', () => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); });
  document.querySelectorAll('#menu-tabs button[data-tab]').forEach(b => b.addEventListener('click', () => { menu.tab = b.dataset.tab; menu.sel = 0; menu.hover = null; renderMenu(); }));
  document.getElementById('menu-close').addEventListener('click', closeMenu);
  document.getElementById('menu-pill').addEventListener('click', () => menu.open ? closeMenu() : openMenu('bag'));
  const body = document.getElementById('menu-body');
  body.addEventListener('click', e => {
    const t = e.target.closest('.m-tile'); if (t) { menu.sel = +t.dataset.i; toggleItem(t.dataset.id); return; }
    const f = e.target.closest('.m-face'); if (f) { menu.sel = +f.dataset.i; menu.hover = null; renderMenu(); }
  });
  // hovering a face shows their card
  body.addEventListener('mouseover', e => {
    const f = e.target.closest('.m-face');
    if (f && menu.hover !== f.dataset.name) { menu.hover = f.dataset.name; renderMenu(); }
  });
  // click a worn item in the strip to take it off
  document.getElementById('worn').addEventListener('click', e => {
    const img = e.target.closest('img'); if (img && ITEMS[img.dataset.id].wearable) toggleItem(img.dataset.id);
  });
  pingPill(); updateCarryHud();
});
