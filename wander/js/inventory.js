/* ══════════════════════════════════════════
   BAG · FRIENDS · QUESTS
   · give(id, from)            — add an item (and remember who gave it)
   · wearing(id) / hasItem(id) — is it on / owned?
   · meet(name, line)          — remember someone you talked to (E)
   · startQuest(id) / completeQuest(id)
   Side panel: I = bag, J = friends, tab switches, arrows choose,
   E / enter opens a body slot (or puts on / picks), X takes off,
   esc backs out / closes. The game pauses while it's open.
   The bag is a body (head, neck, two hands, chest, feet: one thing each,
   see BODY SLOTS) plus the spare gear and carried things below it.
   A strip at the bottom shows what you're wearing.
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
  shovel:    { name: 'shovel',                desc: 'for digging. there is a cave mouth somewhere that needs it.', wearable: true },
  glowstone: { name: 'glowstone',             desc: 'found deep in the cavern. it hums, faintly, and glows teal.', wearable: true },
  helmet:    { name: 'fishbowl helmet',       desc: "umber's. a glass bowl with a bellows. wear it to breathe underwater (and sink a little).", wearable: true },
  pickaxe:   { name: 'pickaxe',               desc: 'peri kept it shiny. swing it at the gold in the old mine.',  wearable: true },
  button:    { name: "rosco's lucky button",  desc: 'shiny. not yours. rosco is at the bar.',                      wearable: false },
  gold:      { name: 'a gold nugget',         desc: "from the old mine under the hill. marigold's store takes it.", wearable: false },
  axe:       { name: 'axe',                   desc: "birch's spare. for wood — though the birds will have opinions.", wearable: true },
  surfboard: { name: "rae's spare surfboard", desc: 'wear it in the surf. when a wave reaches you, jump to catch it.', wearable: true },
  shells:    { name: 'shell necklace',        desc: 'from rae. it clicks softly when you walk, like the tide.',    wearable: true },
  birdhouse: { name: 'a fallen birdhouse',    desc: 'knocked out of a tree by the storm. hang it back on an empty nail.', wearable: false },
  wood:      { name: 'a log',                 desc: 'from a tree the storm took. birch needs three for the hull.', wearable: false },
  canvas:    { name: 'a bolt of sailcloth',   desc: "from marigold's store. enough for one very brave sail.",       wearable: false },
  mallows:   { name: 'a bag of marshmallows', desc: 'for rae. she has never had a toasted one.',                   wearable: false },
  conch:     { name: 'a big empty conch',     desc: 'pink inside, spirals the right way. somebody small could live in this.', wearable: false },
  bell:      { name: 'the school bell',       desc: "the reef school's bell. it says 'ding', which means 'morning'.", wearable: false },
  goldstar:  { name: 'a gold star',           desc: "from miss coralie. she only has a few. you've been very good.", wearable: false },
  // marigold's general store (store.js): personal things you can buy
  boots:     { name: 'sturdy boots',         desc: 'stitched tight, soles like bread crusts. you walk about a fifth faster.', wearable: true },
  umbrella:  { name: 'a little umbrella',    desc: 'hold jump in the air to float down slowly. rain and slick ground bother you less.', wearable: true },
  fins:      { name: 'swim fins',            desc: 'much faster in the water. a bit waddly on land.',             wearable: true },
  snorkel:   { name: 'a snorkel',            desc: 'twice the breath underwater. not enough for the deep trench, mind.', wearable: true },
  compass:   { name: 'pocket compass',       desc: 'the needle points toward whoever needs you next. when nobody does, toward buried things.', wearable: true },
  charm:     { name: 'four-leaf charm',      desc: 'tucked in your fur. digging turns up a little extra, now and then.', wearable: true },
  drawing:   { name: "nib's drawing",         desc: 'you, from memory, in squid ink. you have six legs in it. it is perfect.', wearable: false },
};
const ITEM_ORDER = ['blades', 'lantern', 'feather', 'scarf', 'peanut', 'bracelet', 'chart', 'shovel', 'glowstone', 'helmet', 'pickaxe', 'axe', 'surfboard', 'shells',
                    'boots', 'umbrella', 'fins', 'snorkel', 'compass', 'charm', 'button', 'gold', 'birdhouse', 'wood', 'canvas', 'mallows', 'conch', 'bell', 'goldstar', 'drawing'];

const FRIENDS = {
  'clover':       { kind: 'bunny',    color: '#e8d5c0', species: 'bunny',    where: 'your volleyball partner' },
  'ember':        { kind: 'ferret',   color: '#d8c4a4', species: 'ferret',      where: 'setter on the other team' },
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
  'umber':        { kind: 'mole',     color: '#a596a8', species: 'mole',     where: 'a burrow past the old mine' },
  'peri':         { kind: 'crab',     color: '#d8876a', species: 'crab',     where: 'in a teapot at the bottom of the lake' },
  'marigold':     { kind: 'goose',    color: '#d8d4c8', species: 'goose',    where: 'runs the general store by the tavern' },
  'juniper':      { kind: 'bird',     color: '#8aa8d8', species: 'bluebird', where: 'the thick woods. keeps an eye on everyone.' },
  'birch':        { kind: 'beaver',   color: '#a8805a', species: 'beaver',   where: 'building a sailboat on the beach' },
  'ollie':        { kind: 'octopus',  color: '#d890a8', species: 'octopus',  where: 'keeps a garden under the bay' },
  'bea':          { kind: 'puffer',   color: '#9ad0c0', species: 'pufferfish', where: "guards the net under the island's reef city. bart's sister." },
  'bart':         { kind: 'puffer',   color: '#d8c070', species: 'pufferfish', where: 'guards the gap in the net. takes it seriously.' },
  'rae':          { kind: RAE_KIND,   color: '#e09a5c', species: RAE_SPECIES, where: 'surfs off the island across the sea' },
  'miss coralie': { kind: 'seahorse', color: '#e0a878', species: 'seahorse', where: 'teaches at the reef school, on the school ledge' },
  'shelby':       { kind: 'hermit',   color: '#d88068', species: 'hermit crab', where: 'under the school ledge, in whatever fits' },
  'nib':          { kind: 'octopus',  color: '#b8a0e0', species: 'octopus (very small)', where: "miss coralie's class. sits at the front now." },
};

const QUESTS = {
  button: { giver: 'rosco', title: "rosco's lucky button", desc: 'rosco lost his lucky button somewhere up on the balcony.' },
  stars:  { giver: 'nova',  title: 'chart the stars',      desc: "find the four constellations through nova's telescope." },
  shovel: { giver: 'nova',  title: 'the borrowed shovel',  desc: "nova's cousin rosco borrowed her shovel. get it back from him." },
  dig:    { giver: 'nova',  title: 'the glowing cave',     desc: 'dig open the cave mouth at the bottom of the far side of the hill.' },
  report: { giver: 'nova',  title: "what's down there?",   desc: 'explore the cavern, then tell nova what you found.' },
  umber:  { giver: 'umber', title: 'a hello for peri',     desc: "wear umber's helmet, dive to the bottom of the lake, and find peri." },
  peri:   { giver: 'peri',  title: 'a message back',       desc: 'peri kept his chair. go tell umber.' },
  boat:   { giver: 'birch', title: 'a boat for the sea',   desc: "birch needs three logs for the hull and sailcloth for the sail. cloth from marigold's store, by the tavern; logs from the woods." },
  birds:  { giver: 'juniper', title: 'houses for the neighbors', desc: 'the storm knocked three birdhouses out of the trees. hang each one back on an empty nail.' },
  surf:   { giver: 'rae',   title: 'catch a wave',         desc: "paddle out on rae's spare board. jump as a wave reaches you, and ride three to shore." },
  bonfire:{ giver: 'rae',   title: 'something to toast',   desc: "rae has never had a toasted marshmallow. marigold's store sells them." },
  schoolbell: { giver: 'miss coralie', title: 'the school bell', desc: "the reef school's bell rolled off the school ledge. look underneath it." },
  shelby: { giver: 'shelby', title: 'a bigger shell',      desc: "shelby will trade the bell for a proper conch. there's an empty one under the high shelf, sitting on the deep ledge." },
  nib:    { giver: 'miss coralie', title: 'headcount',     desc: "nib is missing. he hides when he's frightened — try the dark nook under the deep ledge, then swim him back to class." },
};
const questState = {}; // id → 'open' | 'done'

const inv = { owned: {}, on: {} };
const met = {};   // name → { gifts: [itemId], last: '' }
const menu = { open: false, tab: 'bag', sel: 0, hover: null, pick: null, pickSel: 0 };
let drag = null;   // a slot / spare tile being dragged (see BAG PANEL)

/* ══════════════════════════════════════════
   BODY SLOTS — six boxes: head, left hand, right hand, neck, chest, feet. One thing in each.
   · every wearable has a KIND (ITEM_KIND, or ITEMS[id].slot from another file):
       head · neck · chest · feet → that box · hand → either hand box
       pocket → no box at all: tucked away, simply toggled on/off (the star chart, the compass…)
     things that aren't wearable (gold, logs, quest things) are just carried.
   · putting something on: a free box of its kind, else it REPLACES what's in that box
     (only that one, which goes back in the bag). nothing ever gets shuffled around by age.
   · give(): a new thing goes on only if its box is free (the helmet always does: you need it
     to dive); otherwise it waits in the bag, with a hint.
   · inv.on stays the truth for "being worn": wearing(), the rest of the game and the tests read
     (and write) it. slotSync() squares slots{} up with it (e.g. after inv.on.x = true).
══════════════════════════════════════════ */
const SLOT_KEYS = ['head', 'neck', 'lhand', 'rhand', 'chest', 'feet'];
const DOLL_ORDER = ['head', 'lhand', 'neck', 'rhand', 'chest', 'feet'];   // the order the panel walks them in
const SLOT_NAME = { head: 'head', neck: 'neck', lhand: 'left arm', rhand: 'right arm', chest: 'chest', feet: 'feet' };
const SLOT_GROUP = { head: ['head'], neck: ['neck'], chest: ['chest'], hand: ['rhand', 'lhand'], feet: ['feet'] };
const KIND_FULL = { head: 'your head is', neck: 'your neck is', chest: 'your back is', hand: 'both arms are', feet: 'your feet are' };
const ITEM_KIND = {
  helmet: 'head', feather: 'head', snorkel: 'head',
  scarf: 'neck', shells: 'neck',
  surfboard: 'chest',                                                     // the board rides on your back
  lantern: 'hand', umbrella: 'hand', glowstone: 'hand', shovel: 'hand', pickaxe: 'hand', axe: 'hand',
  blades: 'feet', boots: 'feet', fins: 'feet',
  chart: 'pocket', compass: 'pocket', peanut: 'pocket', bracelet: 'pocket', charm: 'pocket',
};
// an old save with more on than fits: these get a box first, then bag order
const SLOT_PRIO = ['helmet', 'lantern', 'blades', 'scarf', 'shells', 'surfboard'];
const slots = { head: null, neck: null, lhand: null, rhand: null, chest: null, feet: null };
let slotNotes = [];

// what kind of thing it is: a box kind, 'pocket', or null (just carried)
function itemKind(id) { const it = ITEMS[id]; return !it || !it.wearable ? null : it.slot || ITEM_KIND[id] || 'pocket'; }
const isPocket = id => itemKind(id) === 'pocket';
const itemGroups = id => { const k = itemKind(id); return k && k !== 'pocket' ? [k] : []; };
function slotsFor(id) { const k = itemKind(id); return SLOT_GROUP[k] || []; }
const fitsSlot = (id, k) => slotsFor(id).includes(k);
const slotOf = id => SLOT_KEYS.find(k => slots[k] === id) || null;
const slotGroupOf = k => Object.keys(SLOT_GROUP).find(g => SLOT_GROUP[g].includes(k));
// never replaced by something switched on automatically (you'd drown / lose the wave)
function slotKeep(id) { return id === 'helmet' || (id === 'surfboard' && !!(player.surfing || player.inWater)); }
const slotFree = id => slotsFor(id).find(k => !slots[k]) || null;
// the box id would replace when its kind is full: always the first one (hands: the right)
function slotBump(id, auto) { const k = slotsFor(id).find(k => slots[k] && !(auto && slotKeep(slots[k]))); return k || null; }
function slotPut(id, k) {
  const was = slotOf(id); if (was) slots[was] = null;
  slots[k] = id; inv.on[id] = true;
}
function slotFlush() {
  if (!slotNotes.length) return;
  const msg = slotNotes.slice(-2).join('  ·  '); slotNotes = [];
  if (typeof showHint === 'function') showHint(msg, 3600);
}

// square slots up with inv.on: drop stale entries; anything switched on directly (inv.on.x = true)
// takes a free box of its kind, else replaces what's there (never a slotKeep thing).
// opt.displace === false: never replace (it's just switched off). opt.quiet: no hints. → changed?
function slotSync(opt) {
  opt = opt || {};
  let changed = false;
  const seen = {};
  SLOT_KEYS.forEach(k => {
    const id = slots[k];
    if (!id) return;
    if (seen[id] || !wearing(id) || !fitsSlot(id, k)) { slots[k] = null; changed = true; } else seen[id] = true;
  });
  Object.keys(inv.on).filter(id => inv.on[id] && inv.owned[id] && slotsFor(id).length && !seen[id]).forEach(id => {
    changed = true;
    let k = slotFree(id);
    if (!k && opt.displace !== false) {
      k = slotBump(id, true);
      if (k) { inv.on[slots[k]] = false; slotNotes.push(`${ITEMS[slots[k]].name} → back in your bag`); }
    }
    if (k) slotPut(id, k);
    else inv.on[id] = false;
  });
  if (opt.quiet) slotNotes = []; else slotFlush();
  return changed;
}

// put id in box k on purpose. what was there goes back in the bag —
// or, when id came from the other hand, the two hands swap.
function equipAt(id, k) {
  if (!hasItem(id) || !fitsSlot(id, k)) return false;
  slotSync({ quiet: true });
  const from = slotOf(id), old = slots[k];
  if (from !== k) {
    slotPut(id, k);
    if (old) {
      if (from && fitsSlot(old, from)) slotPut(old, from);
      else { inv.on[old] = false; slotNotes.push(`${ITEMS[old].name} → back in your bag`); }
    }
  }
  slotFlush(); renderMenu(); updateCarryHud();
  return true;
}
function unequip(k) {
  const id = slots[k];
  if (id) { slots[k] = null; inv.on[id] = false; }
  renderMenu(); updateCarryHud();
}
// put on (from the bag / the strip): pockets just switch on; else a free box, else replace that box
function wearAuto(id) {
  if (!hasItem(id) || !itemKind(id)) return false;
  if (isPocket(id)) { inv.on[id] = true; renderMenu(); updateCarryHud(); return true; }
  if (slotOf(id)) return true;
  const k = slotFree(id) || slotBump(id, false);
  return k ? equipAt(id, k) : false;
}
// what could go in box k (bag order), then null = "take it off" when something's there
function pickerOptions(k) {
  const opts = ITEM_ORDER.filter(id => hasItem(id) && fitsSlot(id, k));
  return slots[k] ? opts.concat([null]) : opts;
}

// pure: a plain { id: bool } "on" map (e.g. a v1 save, where anything could be on at once) → slots,
// without pushing anything out: most useful things first (SLOT_PRIO), then bag order; whatever
// doesn't fit is switched off. start: slots already taken. → { slots, on }
function slotsFromOn(on, owned, start) {
  const out = {}, newOn = Object.assign({}, on);
  SLOT_KEYS.forEach(k => { out[k] = start && typeof start[k] === 'string' ? start[k] : null; });
  const placed = new Set(SLOT_KEYS.map(k => out[k]).filter(Boolean));
  const rank = id => { const p = SLOT_PRIO.indexOf(id); if (p >= 0) return p; const o = ITEM_ORDER.indexOf(id); return 100 + (o < 0 ? 999 : o); };
  Object.keys(on || {}).filter(id => on[id] === true && owned && owned[id] === true && slotsFor(id).length && !placed.has(id))
    .sort((a, b) => rank(a) - rank(b))
    .forEach(id => { const k = slotsFor(id).find(s => !out[s]); if (k) out[k] = id; else newOn[id] = false; });
  return { slots: out, on: newOn };
}
// after loading (save.js): saved slots where they're still valid, then fit in anything else that's on
function slotLoad(saved) {
  const start = {};
  SLOT_KEYS.forEach(k => {
    slots[k] = null;
    const id = saved && typeof saved === 'object' ? saved[k] : null;
    if (typeof id === 'string' && wearing(id) && fitsSlot(id, k) && !Object.values(start).includes(id)) start[k] = id;
  });
  const r = slotsFromOn(inv.on, inv.owned, start);
  Object.assign(slots, r.slots);
  Object.keys(r.on).forEach(id => { if (r.on[id] === false && inv.on[id]) inv.on[id] = false; });
}

/* ══════════════════════════════════════════
   NOTIFICATIONS — small toasts at the top of the screen for items, friends,
   quests, constellations and achievements, so you notice them even if you
   skip through the dialogue.   notify(kind, title, img, sub)
══════════════════════════════════════════ */
const ACHIEVEMENTS = {
  champ:      { name: 'volleyball champion', desc: 'win a game of volleyball.' },
  stargazer:  { name: 'stargazer',           desc: 'chart all four constellations.' },
  social:     { name: 'social butterfly',    desc: 'make ten friends.' },
  breathless: { name: 'out of breath',       desc: 'run out of air in the lake.' },
  diver:      { name: 'deep diver',          desc: 'touch the very bottom of the lake.' },
  prospector: { name: 'prospector',          desc: 'mine every seam in the old mine.' },
  gonefirst:  { name: 'you go first',        desc: 'bring umber and peri back together.' },
  longway:    { name: 'the long way up',     desc: "climb umber's ladder to the top of the cliff." },
  sailor:     { name: 'across the sea',      desc: "sail birch's boat through the storm." },
  surfer:     { name: 'hang ten',            desc: 'ride three waves to shore.' },
  puffed:     { name: 'very alarming',       desc: 'startle bart until he puffs up.' },
  toasty:     { name: 'golden brown',        desc: 'toast a marshmallow with rae.' },
  shopper:    { name: 'a regular',          desc: "buy something at marigold's general store." },
  allwares:   { name: 'one of everything',  desc: "own every personal item marigold sells." },
  treasure:   { name: 'x marks the spot',   desc: 'dig up every buried nugget in the meadows.' },
  headcount:  { name: 'everyone accounted for', desc: "bring nib back to miss coralie's class." },
};
const achieved = {};
function achieve(id) {
  if (achieved[id]) return;
  achieved[id] = true;
  ensureArt();
  notify('achievement', ACHIEVEMENTS[id].name, ART.medal, ACHIEVEMENTS[id].desc);
  renderMenu();
}
const KIND_LABEL = { item: 'got', friend: 'new friend', quest: 'new quest', done: 'quest complete', found: 'found', achievement: 'achievement' };
function notify(kind, title, img, sub) {
  const box = document.getElementById('toasts');
  if (!box || !box.appendChild) return;
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.innerHTML = `${img ? `<img src="${img}" alt="">` : '<span class="t-dot"></span>'}<div>`
    + `<div class="t-kind">${esc(KIND_LABEL[kind] || kind)}</div><div class="t-title">${esc(title)}</div>`
    + `${sub ? `<div class="t-sub">${esc(touchify(sub))}</div>` : ''}</div>`;
  box.appendChild(el);
  while (box.children.length > 4) box.removeChild(box.firstChild);
  setTimeout(() => el.classList.add('in'), 30);
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 450); }, 4600);
}

function wearing(id) { return !!(inv.owned[id] && inv.on[id]); }
function hasItem(id) { return !!inv.owned[id]; }

function give(id, from) {
  if (inv.owned[id]) return;
  inv.owned[id] = true;
  inv.on[id] = ITEMS[id].wearable;
  // it goes on if its box is free (pockets always; the helmet always: you need it to dive). else it waits in the bag
  if (slotsFor(id).length && !slotFree(id) && id !== 'helmet') {
    inv.on[id] = false;
    setTimeout(() => showHint(`${ITEMS[id].name} is in your bag: ${KIND_FULL[itemKind(id)]} full. swap it in from the bag (I)`, 4200), 1200);
  }
  if (ITEMS[id].wearable) slotSync();
  if (from) { meet(from); met[from].gifts.push(id); }
  ensureArt();
  const firstItem = Object.keys(inv.owned).length === 1;
  notify('item', ITEMS[id].name, ART.items[id], firstItem ? 'press I to see your bag' : from ? `from ${from}` : '');
  pingPill(); renderMenu(); updateCarryHud();
}
// items you can have several of (gold, logs): the name shows the count
const STACK_NAMES = { gold: ['a gold nugget', n => `gold nuggets ×${n}`], wood: ['a log', n => `logs ×${n}`] };
function stack(id, d, from) {
  inv[id] = Math.max(0, (inv[id] || 0) + d);
  ITEMS[id].name = inv[id] === 1 ? STACK_NAMES[id][0] : STACK_NAMES[id][1](inv[id]);
  if (!inv[id]) { takeItem(id); return; }
  if (!hasItem(id)) { give(id, from); return; }
  ensureArt();
  if (d > 0) notify('item', ITEMS[id].name, ART.items[id]);
  renderMenu(); updateCarryHud();
}
function takeItem(id) { delete inv.owned[id]; delete inv.on[id]; slotSync({ quiet: true }); renderMenu(); updateCarryHud(); }

function meet(name, line) {
  if (!FRIENDS[name]) return;
  const first = !met[name];
  const m = met[name] || (met[name] = { gifts: [], last: '' });
  if (line) m.last = line;
  if (first) {
    ensureArt();
    const n = Object.keys(met).length;
    notify('friend', name, ART.faces[name], n === 1 ? "press J to see who you've met" : FRIENDS[name].where);
    if (n >= 10) achieve('social');
    pingPill();
  }
  renderMenu();
}

function startQuest(id) {
  if (questState[id]) return;
  questState[id] = 'open';
  ensureArt();
  setTimeout(() => notify('quest', QUESTS[id].title, ART.faces[QUESTS[id].giver], 'press J to see your quests'), 500);
  pingPill(); renderMenu();
}
function completeQuest(id) {
  if (questState[id] === 'done') return;
  questState[id] = 'done';
  ensureArt();
  setTimeout(() => notify('done', QUESTS[id].title, ART.faces[QUESTS[id].giver]), 300);
  if (id === 'peri') achieve('gonefirst');
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
  helmet: (w, h) => { drawHelmetOn(w / 2 + 2, h / 2 - 2, 1.2); },
  pickaxe: (w, h) => {
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(0.6);
    ctx.strokeStyle = 'rgba(160,120,75,0.95)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(0, -14); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,195,205,0.95)'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(-15, -8); ctx.quadraticCurveTo(0, -20, 15, -8); ctx.stroke();
    ctx.restore();
  },
  gold: (w, h) => {
    drawGlow(w / 2, h / 2, 20, 0.3, [255, 210, 110]);
    ctx.fillStyle = 'rgba(235,195,85,0.95)'; ctx.strokeStyle = 'rgba(170,130,50,0.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(w / 2 - 11, h / 2 + 4); ctx.lineTo(w / 2 - 6, h / 2 - 8); ctx.lineTo(w / 2 + 5, h / 2 - 10); ctx.lineTo(w / 2 + 12, h / 2 - 1); ctx.lineTo(w / 2 + 7, h / 2 + 9); ctx.lineTo(w / 2 - 5, h / 2 + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,245,200,0.8)'; ctx.beginPath(); ctx.arc(w / 2 - 2, h / 2 - 4, 2, 0, 7); ctx.fill();
  },
  axe: (w, h) => {
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(0.5);
    ctx.strokeStyle = 'rgba(160,120,75,0.95)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(0, -16); ctx.stroke();
    ctx.fillStyle = 'rgba(185,190,200,0.95)';
    ctx.beginPath(); ctx.moveTo(-1, -16); ctx.lineTo(-12, -20); ctx.quadraticCurveTo(-16, -10, -12, -2); ctx.lineTo(-1, -7); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  surfboard: (w, h) => {
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(0.7);
    ctx.fillStyle = 'rgba(240,220,170,0.95)'; ctx.strokeStyle = 'rgba(170,140,100,0.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 20, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,150,180,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 18); ctx.stroke();
    ctx.restore();
  },
  shells: (w, h) => {
    ctx.strokeStyle = 'rgba(200,190,170,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(w / 2, h / 2 - 8, 14, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    [['#f0c8b8', -10, 2], ['#f0e0c0', -4, 5], ['#e8b0b8', 3, 6], ['#f0d8a8', 9, 3]].forEach(([c, dx, dy]) => {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(w / 2 + dx, h / 2 + dy - 4); ctx.lineTo(w / 2 + dx + 4, h / 2 + dy + 3); ctx.lineTo(w / 2 + dx - 4, h / 2 + dy + 3); ctx.closePath(); ctx.fill();
    });
  },
  birdhouse: (w, h) => { drawBirdhouse(w / 2, h / 2 + 12, 1.3, 0); },
  wood: (w, h) => {
    ctx.fillStyle = '#6a4a2c'; ctx.fillRect(w / 2 - 16, h / 2 - 6, 30, 14);
    ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.ellipse(w / 2 + 14, h / 2 + 1, 5, 7, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(120,85,50,0.9)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(w / 2 + 14, h / 2 + 1, 2.5, 3.5, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,28,18,0.6)'; ctx.beginPath(); ctx.moveTo(w / 2 - 12, h / 2 - 1); ctx.lineTo(w / 2 + 6, h / 2 - 1); ctx.moveTo(w / 2 - 8, h / 2 + 4); ctx.lineTo(w / 2 + 8, h / 2 + 4); ctx.stroke();
  },
  canvas: (w, h) => {
    ctx.fillStyle = 'rgba(235,228,205,0.95)'; ctx.strokeStyle = 'rgba(170,160,130,0.9)'; ctx.lineWidth = 1;
    ctx.fillRect(w / 2 - 14, h / 2 - 9, 28, 18); ctx.strokeRect(w / 2 - 14, h / 2 - 9, 28, 18);
    ctx.beginPath(); ctx.ellipse(w / 2 + 14, h / 2, 4, 9, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(180,90,80,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(w / 2 - 4, h / 2 - 9); ctx.lineTo(w / 2 - 4, h / 2 + 9); ctx.stroke();
  },
  mallows: (w, h) => {
    ctx.fillStyle = 'rgba(200,215,235,0.35)'; ctx.strokeStyle = 'rgba(200,215,235,0.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(w / 2 - 12, h / 2 - 12); ctx.lineTo(w / 2 + 12, h / 2 - 12); ctx.lineTo(w / 2 + 13, h / 2 + 14); ctx.lineTo(w / 2 - 13, h / 2 + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(250,245,240,0.95)';
    [[-6, 6], [5, 7], [0, -1], [-5, -5], [6, -4]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.ellipse(w / 2 + dx, h / 2 + dy, 4.5, 3.5, 0, 0, 7); ctx.fill(); });
    ctx.fillStyle = 'rgba(200,110,120,0.9)'; ctx.fillRect(w / 2 - 12, h / 2 - 14, 24, 3);
  },
  conch: (w, h) => { drawConch(w / 2 - 1, h / 2 + 12, 1.35); },
  bell: (w, h) => { drawSchoolBell(w / 2, h / 2 + 1, 1.25); },
  goldstar: (w, h) => {
    drawGlow(w / 2, h / 2, 22, 0.35, [255, 215, 110]);
    ctx.fillStyle = 'rgba(240,200,80,0.97)'; ctx.strokeStyle = 'rgba(170,130,40,0.9)'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 6.5 : 15, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(w / 2 + Math.cos(a) * r, h / 2 + 1 + Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(15,12,12,0.85)'; ctx.beginPath(); ctx.arc(w / 2 - 3, h / 2, 1.2, 0, 7); ctx.arc(w / 2 + 3, h / 2, 1.2, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(15,12,12,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(w / 2, h / 2 + 3, 2.5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  },
  boots: (w, h) => {
    const boot = (x, f) => {
      ctx.save(); ctx.translate(x, 24); ctx.scale(f, 1);
      ctx.fillStyle = '#7a5434'; ctx.strokeStyle = 'rgba(40,26,14,0.9)'; ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-5, -14); ctx.lineTo(5, -14); ctx.lineTo(5, 3); ctx.quadraticCurveTo(14, 4, 14, 11); ctx.lineTo(14, 14); ctx.lineTo(-5, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3e2a18'; ctx.fillRect(-5, 11, 19, 3);
      ctx.strokeStyle = 'rgba(230,205,160,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5, -10); ctx.lineTo(5, -10); ctx.moveTo(-5, -5); ctx.lineTo(5, -5); ctx.stroke();
      ctx.restore();
    };
    boot(10, 1); boot(36, -1);
  },
  umbrella: (w, h) => {
    ctx.lineJoin = 'round';
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(235,225,205,0.95)' : 'rgba(190,85,80,0.95)';
      const a0 = Math.PI + i * Math.PI / 4, a1 = a0 + Math.PI / 4;
      ctx.beginPath(); ctx.moveTo(24, 26); ctx.arc(24, 26, 19, a0, a1); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(60,40,30,0.8)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(24, 26, 19, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,115,75,0.95)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(24, 26); ctx.lineTo(24, 40); ctx.arc(21, 40, 3, 0, Math.PI / 2 + 0.4); ctx.stroke();
  },
  fins: (w, h) => {
    const fin = (x, f) => {
      ctx.save(); ctx.translate(x, 24); ctx.scale(f, 1);
      ctx.fillStyle = 'rgba(80,175,170,0.95)'; ctx.strokeStyle = 'rgba(30,80,80,0.9)'; ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-4, -14); ctx.lineTo(3, -14); ctx.lineTo(4, -2); ctx.lineTo(13, 14); ctx.quadraticCurveTo(0, 20, -12, 14); ctx.lineTo(-4, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(30,80,80,0.55)'; ctx.lineWidth = 0.9;
      [-6, 0, 6].forEach(d => { ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(d + 1, 15); ctx.stroke(); });
      ctx.restore();
    };
    fin(15, 1); fin(34, 1);
  },
  snorkel: (w, h) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(235,150,70,0.97)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(32, 6); ctx.lineTo(32, 28); ctx.quadraticCurveTo(32, 38, 22, 38); ctx.stroke();
    ctx.fillStyle = 'rgba(235,150,70,0.97)'; ctx.fillRect(29, 3, 6, 5);
    ctx.fillStyle = 'rgba(40,30,28,0.95)'; ctx.fillRect(17, 35, 9, 6);
    ctx.fillStyle = 'rgba(150,215,230,0.45)'; ctx.strokeStyle = 'rgba(210,225,230,0.95)'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.ellipse(14, 18, 8, 6, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(210,225,230,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(22, 17); ctx.lineTo(30, 14); ctx.stroke();
  },
  compass: (w, h) => {
    ctx.fillStyle = 'rgba(205,165,80,0.97)'; ctx.strokeStyle = 'rgba(120,85,30,0.95)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(24, 26, 15, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillRect(21, 7, 6, 5); ctx.strokeRect(21, 7, 6, 5);
    ctx.fillStyle = 'rgba(245,235,205,0.97)'; ctx.beginPath(); ctx.arc(24, 26, 11.5, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(120,85,30,0.6)'; ctx.lineWidth = 0.9;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(24 + Math.cos(a) * 9, 26 + Math.sin(a) * 9); ctx.lineTo(24 + Math.cos(a) * 11, 26 + Math.sin(a) * 11); ctx.stroke(); }
    ctx.save(); ctx.translate(24, 26); ctx.rotate(0.6);
    ctx.fillStyle = 'rgba(190,70,65,0.97)'; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(3, 0); ctx.lineTo(-3, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(70,75,95,0.9)'; ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(3, 0); ctx.lineTo(-3, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  charm: (w, h) => {
    drawGlow(24, 24, 22, 0.25, [140, 230, 150]);
    ctx.fillStyle = 'rgba(100,185,105,0.97)'; ctx.strokeStyle = 'rgba(40,100,50,0.9)'; ctx.lineWidth = 1.2;
    [[-6.5, 0], [6.5, 0], [0, -6.5], [0, 6.5]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(24 + dx, 22 + dy, 6.5, 0, 7); ctx.fill(); ctx.stroke(); });
    ctx.fillStyle = 'rgba(100,185,105,0.97)'; ctx.beginPath(); ctx.arc(24, 22, 5, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(40,100,50,0.95)'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(24, 24); ctx.quadraticCurveTo(25, 36, 30, 42); ctx.stroke();
  },
  drawing: (w, h) => {
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-0.08);
    ctx.fillStyle = 'rgba(232,224,200,0.97)'; ctx.fillRect(-15, -17, 30, 34);
    ctx.strokeStyle = 'rgba(70,60,110,0.85)'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, -2, 6, 0, 7); ctx.arc(-4, -8, 2.5, 0, 7); ctx.moveTo(6.5, -10); ctx.arc(4, -10, 2.5, 0, 7); ctx.stroke();   // you: a round mouse…
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-5 + i * 2, 3); ctx.lineTo(-8 + i * 3.2, 12); ctx.stroke(); }                     // …with six legs
    ctx.fillStyle = 'rgba(70,60,110,0.9)'; ctx.beginPath(); ctx.arc(1.5, -3, 0.9, 0, 7); ctx.fill();
    ctx.restore();
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
  const scale = { snail: 1.7, toad: 1.6, hedgehog: 1.4, tortoise: 1.25, owl: 1.45, mole: 1.5, crab: 1.6, bird: 2.4, goose: 1.05, puffer: 2, octopus: 1.6, beaver: 1.1 }[f.kind] || 1.15;
  drawCritter(w / 2, h - 6, f.kind, { color: f.color, scale, dir: 1 });
}

const ART = { items: {}, faces: {} };
function ensureArt() {
  if (ART.ready) return;
  ART.ready = true;
  ITEM_ORDER.forEach(id => ART.items[id] = renderToURL(48, 48, ITEM_ART[id]));
  Object.keys(FRIENDS).forEach(n => ART.faces[n] = renderToURL(64, 72, (w, h) => drawPortrait(n, w, h)));
  ART.medal = renderToURL(48, 48, (w, h) => {
    ctx.fillStyle = 'rgba(200,110,120,0.9)'; ctx.beginPath(); ctx.moveTo(w / 2 - 9, 6); ctx.lineTo(w / 2 - 2, 24); ctx.lineTo(w / 2 - 12, 22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(120,160,210,0.9)'; ctx.beginPath(); ctx.moveTo(w / 2 + 9, 6); ctx.lineTo(w / 2 + 2, 24); ctx.lineTo(w / 2 + 12, 22); ctx.closePath(); ctx.fill();
    drawGlow(w / 2, h / 2 + 6, 22, 0.35, [255, 210, 110]);
    ctx.fillStyle = 'rgba(235,195,85,0.95)'; ctx.strokeStyle = 'rgba(170,130,50,0.9)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(w / 2, h / 2 + 6, 11, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,245,210,0.95)'; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.6 : 6, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(w / 2 + Math.cos(a) * r, h / 2 + 6 + Math.sin(a) * r); }
    ctx.fill();
  });
}

/* ══════════════════════════════════════════
   HUD — the six body boxes + everything else you own, bottom center
══════════════════════════════════════════ */
const HUD_ORDER = ['head', 'neck', 'chest', 'lhand', 'rhand', 'feet'];   // the HUD's boxes, left to right
function updateCarryHud() {
  const el = document.getElementById('worn');
  if (!el) return;
  ensureArt();
  slotSync();
  // six fixed boxes, labeled beneath (click one: take it off, or pick something for it);
  // then, to the side, the pocket things + spare gear + carried things (click: on/off)
  const worn = SLOT_KEYS.map(k => slots[k]).filter(Boolean);
  const side = ITEM_ORDER.filter(id => hasItem(id) && !worn.includes(id));
  el.hidden = !worn.length && !side.length;
  const lbl = { head: 'head', neck: 'neck', chest: 'chest', lhand: 'arm', rhand: 'arm', feet: 'feet' };
  el.innerHTML = `<div class="w-body">${HUD_ORDER.map(k => {
    const id = slots[k], tip = id ? `${SLOT_NAME[k]}: ${ITEMS[id].name}` : `${SLOT_NAME[k]}: empty`;
    return `<div class="w-slot" data-slot="${k}" title="${esc(tip)}"><div class="w-box${id ? '' : ' empty'}">${id ? `<img src="${ART.items[id]}" alt="${esc(tip)}">` : ''}</div><span class="w-lbl">${lbl[k]}</span></div>`;
  }).join('')}</div><div class="w-side">${side.map(id => {
    const it = ITEMS[id], on = it.wearable ? wearing(id) : true;
    const tip = it.wearable ? `${it.name} — ${on ? 'on' : 'off'}` : `${it.name} (carried)`;
    return `<img src="${ART.items[id]}" class="${on ? 'on' : 'off'}${it.wearable ? '' : ' carried'}" alt="${esc(tip)}" title="${esc(tip)}" data-id="${id}">`;
  }).join('')}</div>`;
}

/* ══════════════════════════════════════════
   SIDE PANEL
══════════════════════════════════════════ */
function openMenu(tab) {
  ensureArt();
  menu.open = true; menu.tab = tab; menu.sel = 0; menu.hover = null; menu.reset = false; menu.pick = null;
  document.getElementById('menu').hidden = false;
  document.getElementById('menu-pill').hidden = true;
  Object.keys(keys).forEach(k => keys[k] = false); // don't keep walking when it closes
  renderMenu();
}
function closeMenu() {
  menu.open = false; menu.pick = null; dragCancel();
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

// on ↔ off (the strip at the bottom; old callers). putting on finds it a slot (see wearAuto)
function toggleItem(id) {
  if (!ITEMS[id].wearable) { showHint(`${ITEMS[id].name} — ${ITEMS[id].desc}`, 2500); return; }
  if (isPocket(id)) { inv.on[id] = !inv.on[id]; renderMenu(); updateCarryHud(); return; }
  slotSync({ quiet: true });
  const k = slotOf(id);
  if (k) unequip(k); else if (!wearAuto(id)) { inv.on[id] = false; renderMenu(); updateCarryHud(); }
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

function achievementList() {
  const ids = Object.keys(ACHIEVEMENTS), got = ids.filter(a => achieved[a]).length;
  return `<div class="m-sub">achievements · ${got}/${ids.length}</div><div class="m-ach">${ids.map(a => achieved[a]
    ? `<div class="m-ach-row on" title="${esc(ACHIEVEMENTS[a].desc)}"><img src="${ART.medal}" alt=""><div><div class="m-name">${esc(ACHIEVEMENTS[a].name)}</div><div class="m-desc">${esc(ACHIEVEMENTS[a].desc)}</div></div></div>`
    : '<div class="m-ach-row"><span class="m-ach-lock"></span><div class="m-name">???</div></div>').join('')}</div>`;
}

function renderMenu() {
  const body = document.getElementById('menu-body');
  if (!body) return;
  if (drag && drag.live) { drag.dirty = true; return; }   // (re-rendering mid-drag would pull the tile out from under your finger)
  slotSync();
  document.querySelectorAll('#menu-tabs button[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === menu.tab));
  if (!menu.open) return;
  ensureArt();

  setFoot();
  if (menu.tab === 'bag') {
    if (!ownedList().length) { body.innerHTML = '<p class="m-empty">your bag is empty. go wander.</p>' + startOverRow(); return; }
    body.innerHTML = bagHTML() + achievementList() + startOverRow();
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
        ${doneN ? `<p class="m-empty">${doneN} done.</p>` : ''}` : ''}${startOverRow()}`;
  }
}

// start over (save.js): wipes the progress saved on this device, with a confirm step
function startOverRow() {
  if (typeof startOver !== 'function') return '';
  return menu.reset
    ? `<div class="m-reset ask"><div class="m-desc">forget everything — your bag, your friends, every quest — and start again from the beginning?</div>
         <div class="m-reset-btns"><button class="m-reset-yes" tabindex="-1">yes, start over</button><button class="m-reset-no" tabindex="-1">keep playing</button></div></div>`
    : '<div class="m-reset"><button class="m-reset-ask" tabindex="-1">start over…</button></div>';
}

function gridMove(dx, dy, n) {
  const cols = menu.tab === 'bag' ? 4 : 5;
  let i = menu.sel + dx + dy * cols;
  if (i < 0 || i >= n) i = Math.max(0, Math.min(n - 1, i));
  menu.sel = i; menu.hover = null;
}

/* ══════════════════════════════════════════
   BAG PANEL — the body (six slots), then spare gear, then carried things.
   menu.sel walks bagCells(): the six slots (DOLL_ORDER), the spare gear, the carried things.
   Picking a slot (click / tap / E) opens its picker right under the body:
   everything you own that fits there, plus "take off". Or drag: a spare
   thing onto a slot, a slot onto another slot (swap), a slot off the body
   (take off). Touch: hold a moment, then drag.
══════════════════════════════════════════ */
const BAG_COLS = 4;
function bagLists() {
  const own = ownedList();
  return { pockets: own.filter(isPocket), spare: own.filter(id => slotsFor(id).length && !wearing(id)), carried: own.filter(id => !ITEMS[id].wearable) };
}
function bagCells() {
  const { pockets, spare, carried } = bagLists();
  return DOLL_ORDER.map(k => ({ slot: k })).concat(pockets.map(id => ({ id, pocket: true })), spare.map(id => ({ id, spare: true })), carried.map(id => ({ id })));
}
const kb = (key, tap) => touchMode ? tap : key;

function slotHTML(k, i) {
  const id = slots[k], n = pickerOptions(k).filter(Boolean).length;
  const cls = ['m-slot', 's-' + k, id ? 'filled' : 'empty', i === menu.sel && !menu.pick ? 'sel' : '', menu.pick === k ? 'open' : '', n ? '' : 'none'].filter(Boolean).join(' ');
  const tip = id ? `${SLOT_NAME[k]}: ${ITEMS[id].name}` : `${SLOT_NAME[k]}: empty`;
  return `<button class="${cls}" data-slot="${k}" data-i="${i}"${id ? ` data-drag="${id}"` : ''} title="${esc(tip)}" tabindex="-1">`
    + (id ? `<img src="${ART.items[id]}" alt="">` : `<span class="m-slot-plus">${n ? '+' : ''}</span>`)
    + `<span class="m-slot-lbl">${SLOT_NAME[k]}</span></button>`;
}
function pickHTML(k) {
  const opts = pickerOptions(k);
  menu.pickSel = Math.max(0, Math.min(opts.length - 1, menu.pickSel));
  return `<div class="m-pick"><div class="m-pick-head"><span>${esc(SLOT_NAME[k])} · ${opts.length ? 'pick one' : 'nothing fits here yet'}</span>`
    + `<button class="m-pick-x" tabindex="-1" aria-label="close">×</button></div>`
    + (opts.length ? `<div class="m-grid">${opts.map((id, j) => {
      if (!id) return `<button class="m-tile m-opt m-opt-none${j === menu.pickSel ? ' sel' : ''}" data-opt="" data-j="${j}" tabindex="-1"><span class="m-none-ic"></span><span>take off</span></button>`;
      const where = slotOf(id);
      return `<button class="m-tile m-opt${j === menu.pickSel ? ' sel' : ''}${where === k ? ' cur on' : ''}" data-opt="${id}" data-j="${j}" tabindex="-1">`
        + `<img src="${ART.items[id]}" alt=""><span>${esc(ITEMS[id].name)}</span>${where && where !== k ? `<i>${esc(SLOT_NAME[where])}</i>` : ''}</button>`;
    }).join('')}</div>` : `<p class="m-empty">nothing you own goes on your ${esc(SLOT_NAME[k])}. keep wandering.</p>`)
    + '</div>';
}
function tilesHTML(ids, start, spare, pocket) {
  return `<div class="m-grid">${ids.map((id, j) => `
        <button class="m-tile${start + j === menu.sel && !menu.pick ? ' sel' : ''}${pocket && wearing(id) ? ' on' : ''}" data-id="${id}" data-i="${start + j}"${spare ? ` data-drag="${id}"` : ''} tabindex="-1">
          <img src="${ART.items[id]}" alt=""><span>${esc(ITEMS[id].name)}</span></button>`).join('')}</div>`;
}
// the card under it all: whatever's highlighted
function bagCard(cell) {
  let id = null, state = '', note = '';
  const group = k => SLOT_GROUP[slotGroupOf(k)] || [k];
  if (menu.pick) {
    const k = menu.pick, opt = pickerOptions(k)[menu.pickSel];
    if (opt === null) return `<div class="m-card"><div class="m-name">take it off</div><div class="m-desc">${esc(ITEMS[slots[k]].name)} goes back in your bag. your ${esc(SLOT_NAME[k])} is free.</div></div>`;
    if (!opt) return '';
    id = opt;
    const where = slotOf(id);
    state = where === k ? `<div class="m-state on">on your ${esc(SLOT_NAME[k])}</div>`
      : where ? `<div class="m-state">on your ${esc(SLOT_NAME[where])} · ${kb('E', 'tap')} to move it here</div>`
      : `<div class="m-state">in your bag · ${kb('E', 'tap')} to put it here</div>`;
  } else if (cell && cell.slot) {
    const k = cell.slot;
    id = slots[k];
    if (!id) {
      const n = pickerOptions(k).length;
      return `<div class="m-card"><div class="m-name">${esc(SLOT_NAME[k])} · empty</div><div class="m-desc">${n
        ? `${n} thing${n > 1 ? 's' : ''} you own could go here. ${kb('E', 'tap')} to choose.`
        : `nothing you own goes here yet.`}</div></div>`;
    }
    state = `<div class="m-state on">on your ${esc(SLOT_NAME[k])} · ${kb('E to swap · X to take off', 'tap to swap or take off')}</div>`;
  } else if (cell) {
    id = cell.id;
    const it = ITEMS[id];
    if (cell.pocket) {
      state = wearing(id) ? `<div class="m-state on">on · ${kb('E', 'tap')} to put it away</div>` : `<div class="m-state">put away · ${kb('E', 'tap')} to use it</div>`;
      note = '<div class="m-fits">a pocket thing: needs no hand or slot</div>';
    } else if (it.wearable) {
      const where = slotsFor(id), groups = itemGroups(id).map(g => g === 'hand' ? 'either arm' : g === 'chest' ? 'your back' : g).join(' or ');
      const out = where.every(k => slots[k]) && slots[slotBump(id, false)];
      state = `<div class="m-state">in your bag · ${kb('E', 'tap')} to put on</div>`;
      note = `<div class="m-fits">goes on: ${esc(groups)}${out ? ` · swaps out ${esc(ITEMS[out].name)}` : ''}</div>`;
    } else state = '<div class="m-state">carried</div>';
  }
  if (!id) return '';
  const it = ITEMS[id], from = giverOf(id);
  return `<div class="m-card">
        <div class="m-card-head"><img src="${ART.items[id]}" alt=""><div><div class="m-name">${esc(it.name)}</div>${state}</div></div>
        <div class="m-desc">${esc(it.desc)}</div>${note}
        ${from ? `<div class="m-from"><img src="${ART.faces[from]}" alt="">from ${esc(from)}</div>` : ''}
      </div>`;
}
function bagHTML() {
  const { pockets, spare, carried } = bagLists(), cells = bagCells(), D = DOLL_ORDER.length;
  menu.sel = Math.max(0, Math.min(cells.length - 1, menu.sel));
  if (menu.pick && !SLOT_KEYS.includes(menu.pick)) menu.pick = null;
  const worn = SLOT_KEYS.filter(k => slots[k]).length;
  return `<div class="m-sub">wearing · ${worn} of ${SLOT_KEYS.length}</div>
    <div class="m-doll">${DOLL_ORDER.map((k, i) => slotHTML(k, i)).join('')}</div>
    ${menu.pick ? pickHTML(menu.pick) : ''}
    ${bagCard(cells[menu.sel])}
    ${pockets.length ? `<div class="m-sub">pockets · ${kb('E', 'tap')} to switch on / off</div>${tilesHTML(pockets, D, false, true)}` : ''}
    ${spare.length ? `<div class="m-sub">spare gear</div>${tilesHTML(spare, D + pockets.length, true)}` : ''}
    ${carried.length ? `<div class="m-sub">carried</div>${tilesHTML(carried, D + pockets.length + spare.length, false)}` : ''}`;
}
function setFoot() {
  const f = document.querySelector && document.querySelector('#menu .m-foot');
  if (!f) return;
  f.textContent = menu.tab !== 'bag' ? 'arrows choose · tab switches · esc closes'
    : menu.pick ? 'arrows choose · E put it here · X take off · esc back'
    : 'arrows choose · E open / put on · X take off · esc closes';
}

// arrows in the bag: around the body, then down into the grids (4 across), and back up
const DOLL_NAV = {   // [left, right, up, down]
  head:  ['lhand', 'rhand', null,    'neck'],
  lhand: [null,    'neck',  'head',  'feet'],
  neck:  ['lhand', 'rhand', 'head',  'chest'],
  rhand: ['neck',  null,    'head',  'feet'],
  chest: ['lhand', 'rhand', 'neck',  'feet'],
  feet:  ['lhand', 'rhand', 'chest', '+grid'],
};
function bagMove(dir) {
  const { pockets, spare, carried } = bagLists(), D = DOLL_ORDER.length;
  const cells = bagCells(), cur = cells[menu.sel];
  const d = ['left', 'right', 'up', 'down'].indexOf(dir);
  if (cur && cur.slot) {
    const to = DOLL_NAV[cur.slot][d];
    if (to === '+grid') { if (cells.length > D) menu.sel = D; }
    else if (to) menu.sel = DOLL_ORDER.indexOf(to);
    return;
  }
  // in the grids: pockets (from D), spare, then carried, each its own rows
  const secs = [[D, pockets.length], [D + pockets.length, spare.length], [D + pockets.length + spare.length, carried.length]].filter(s => s[1]);
  const si = secs.findIndex(([s0, n]) => menu.sel >= s0 && menu.sel < s0 + n);
  if (si < 0) { menu.sel = 0; return; }
  const [s0, n] = secs[si], i = menu.sel - s0, col = i % BAG_COLS, row = Math.floor(i / BAG_COLS), lastRow = Math.floor((n - 1) / BAG_COLS);
  if (dir === 'left') menu.sel = Math.max(D, menu.sel - 1);
  else if (dir === 'right') menu.sel = Math.min(cells.length - 1, menu.sel + 1);
  else if (dir === 'up') {
    if (row > 0) menu.sel -= BAG_COLS;
    else if (si > 0) { const [p0, pn] = secs[si - 1]; menu.sel = p0 + Math.min(pn - 1, Math.floor((pn - 1) / BAG_COLS) * BAG_COLS + col); }
    else menu.sel = DOLL_ORDER.indexOf('feet');
  } else {
    if (row < lastRow) menu.sel = s0 + Math.min(n - 1, i + BAG_COLS);
    else if (si < secs.length - 1) { const [q0, qn] = secs[si + 1]; menu.sel = q0 + Math.min(qn - 1, col); }
  }
}
function pickMove(dir) {
  const n = pickerOptions(menu.pick).length;
  const d = { left: -1, right: 1, up: -BAG_COLS, down: BAG_COLS }[dir];
  menu.pickSel = Math.max(0, Math.min(n - 1, menu.pickSel + d));
}
function openPick(k) {
  menu.pick = k; menu.sel = DOLL_ORDER.indexOf(k);
  const opts = pickerOptions(k);
  menu.pickSel = Math.max(0, opts.indexOf(slots[k]));
}
// choose in the open picker: an item → it goes here; null → empty the slot
function pickChoose(opt) {
  const k = menu.pick;
  if (!k) return;
  menu.pick = null;
  if (opt) equipAt(opt, k); else unequip(k);
}
// E on whatever's highlighted
function bagActivate() {
  const cell = bagCells()[menu.sel];
  if (!cell) return;
  if (cell.slot) { if (menu.pick === cell.slot) menu.pick = null; else openPick(cell.slot); return; }
  if (cell.pocket) { toggleItem(cell.id); return; }
  if (cell.spare) { wearAuto(cell.id); return; }
  showHint(`${ITEMS[cell.id].name} — ${ITEMS[cell.id].desc}`, 2500);
}
function bagKey(c, e) {
  const dir = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' }[c];
  const act = !e.repeat && (c === 'KeyE' || c === 'Enter' || c === 'Space');
  const off = !e.repeat && (c === 'KeyX' || c === 'Backspace' || c === 'Delete');
  if (menu.pick) {
    if (dir) pickMove(dir);
    else if (act) pickChoose(pickerOptions(menu.pick)[menu.pickSel]);
    else if (off) { const k = menu.pick; menu.pick = null; unequip(k); }
    return;
  }
  if (dir) bagMove(dir);
  else if (act) bagActivate();
  else if (off) { const cell = bagCells()[menu.sel]; if (cell && cell.slot && slots[cell.slot]) unequip(cell.slot); }
}

/* ── dragging (mouse: press + move · touch: hold a moment, then move) ── */
function dragGhost() { let g = document.getElementById('drag-ghost'); if (!g) { g = document.createElement('img'); g.id = 'drag-ghost'; g.alt = ''; document.body.appendChild(g); } return g; }
function dragMarks(over) {
  document.querySelectorAll('#menu-body .m-slot').forEach(el => {
    const k = el.dataset.slot, can = !!(drag && drag.live && fitsSlot(drag.id, k));
    el.classList.toggle('can-drop', can);
    el.classList.toggle('drop-over', can && k === over);
  });
  const m = document.getElementById('menu');
  if (m) m.classList.toggle('dragging', !!(drag && drag.live));
}
function dragGo() {
  if (!drag || drag.live) return;
  drag.live = true; clearTimeout(drag.timer);
  const g = dragGhost(); g.src = ART.items[drag.id]; g.hidden = false;
  g.style.left = drag.x + 'px'; g.style.top = drag.y + 'px';
  if (drag.touch && navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
  dragMarks(null);
}
const slotUnder = (x, y) => { const el = document.elementFromPoint && document.elementFromPoint(x, y); return el && el.closest ? el : null; };
function dragMove(x, y) {
  drag.x = x; drag.y = y;
  const g = dragGhost(); g.style.left = x + 'px'; g.style.top = y + 'px';
  const el = slotUnder(x, y), s = el && el.closest('.m-slot');
  dragMarks(s ? s.dataset.slot : null);
}
function dragCancel() {
  if (!drag) return;
  clearTimeout(drag.timer);
  const was = drag; drag = null;
  const g = document.getElementById('drag-ghost'); if (g) g.hidden = true;
  dragMarks(null);
  if (was.dirty) renderMenu();
}
// let go: on a slot it fits → there · a slot let go off the body → back in the bag · else nothing
function dragDrop(x, y) {
  const d = drag;
  if (!d || !d.live) { dragCancel(); return; }
  menu.noClick = Date.now() + 400;   // the click that follows the drop isn't a click
  const el = slotUnder(x, y), s = el && el.closest('.m-slot'), onBody = el && el.closest('.m-doll');
  dragCancel();
  if (s && s.dataset.slot === d.from) { openPick(d.from); renderMenu(); }   // let go where it started: show what else could go there
  else if (s && fitsSlot(d.id, s.dataset.slot)) { menu.pick = null; menu.sel = DOLL_ORDER.indexOf(s.dataset.slot); equipAt(d.id, s.dataset.slot); }
  else if (d.from && !onBody) { menu.pick = null; unequip(d.from); }
  else renderMenu();
}

// capture phase so nothing else (jumping, talking) sees keys while the panel is open
window.addEventListener('keydown', e => {
  if (!started) return;
  const c = e.code;
  // marigold's shop panel (store.js) takes over the keys while it is open
  if (typeof shop !== 'undefined' && shop.open) { e.preventDefault(); e.stopImmediatePropagation(); shopKey(e); return; }
  if (!menu.open) {
    if (transitioning || obs.viewing) return;
    if (c === 'KeyI' || c === 'Tab') { e.preventDefault(); openMenu('bag'); e.stopImmediatePropagation(); }
    else if (c === 'KeyJ')          { openMenu('friends'); e.stopImmediatePropagation(); }
    return;
  }
  e.preventDefault(); e.stopImmediatePropagation();
  if (c === 'Escape' && drag) { dragCancel(); return; }
  if (c === 'Escape' && menu.pick) { if (!e.repeat) { menu.pick = null; renderMenu(); } return; }   // esc: out of the picker first
  if (c === 'Escape' || (c === 'KeyI' && menu.tab === 'bag') || (c === 'KeyJ' && menu.tab === 'friends')) { if (!e.repeat) closeMenu(); return; }
  if (c === 'KeyI' || c === 'KeyJ' || c === 'Tab') { if (e.repeat) return; menu.tab = c === 'KeyI' ? 'bag' : c === 'KeyJ' ? 'friends' : (menu.tab === 'bag' ? 'friends' : 'bag'); menu.sel = 0; menu.hover = null; menu.pick = null; renderMenu(); return; }
  if (menu.tab === 'bag') { bagKey(c, e); renderMenu(); return; }
  const n = friendList().length;
  if (c === 'ArrowLeft'  || c === 'KeyA') gridMove(-1, 0, n);
  if (c === 'ArrowRight' || c === 'KeyD') gridMove(1, 0, n);
  if (c === 'ArrowUp'    || c === 'KeyW') gridMove(0, -1, n);
  if (c === 'ArrowDown'  || c === 'KeyS') gridMove(0, 1, n);
  renderMenu();
}, true);

window.addEventListener('load', () => {
  // clicking a button shouldn't leave it focused (space would "click" it again)
  document.addEventListener('mouseup', () => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); });
  document.querySelectorAll('#menu-tabs button[data-tab]').forEach(b => b.addEventListener('click', () => { menu.tab = b.dataset.tab; menu.sel = 0; menu.hover = null; menu.pick = null; renderMenu(); }));
  document.getElementById('menu-close').addEventListener('click', closeMenu);
  // the pill is two halves: "bag" opens the bag, "friends" opens friends
  document.getElementById('menu-pill').addEventListener('click', e => {
    const half = e.target && e.target.closest && e.target.closest('[data-tab]');
    const tab = half ? half.dataset.tab : 'bag';
    if (menu.open && menu.tab === tab) closeMenu(); else openMenu(tab);
  });
  const body = document.getElementById('menu-body');
  body.addEventListener('click', e => {
    if (menu.noClick && Date.now() < menu.noClick) return;   // (the end of a drag)
    const s = e.target.closest('.m-slot');
    if (s) { if (menu.pick === s.dataset.slot) menu.pick = null; else openPick(s.dataset.slot); renderMenu(); return; }
    if (e.target.closest('.m-pick-x')) { menu.pick = null; renderMenu(); return; }
    const o = e.target.closest('.m-opt'); if (o) { pickChoose(o.dataset.opt || null); renderMenu(); return; }
    const t = e.target.closest('.m-tile');
    if (t) {
      menu.sel = +t.dataset.i; menu.pick = null;
      if (isPocket(t.dataset.id)) toggleItem(t.dataset.id); else if (ITEMS[t.dataset.id].wearable) wearAuto(t.dataset.id); else showHint(`${ITEMS[t.dataset.id].name} — ${ITEMS[t.dataset.id].desc}`, 2500);
      renderMenu(); return;
    }
    const f = e.target.closest('.m-face'); if (f) { menu.sel = +f.dataset.i; menu.hover = null; renderMenu(); return; }
    if (e.target.closest('.m-reset-ask')) { menu.reset = true; renderMenu(); return; }
    if (e.target.closest('.m-reset-no')) { menu.reset = false; renderMenu(); return; }
    if (e.target.closest('.m-reset-yes') && typeof startOver === 'function') startOver();
  });
  // drag a slot's thing (or a spare one) onto a slot; touch waits for a short hold so the panel still scrolls
  body.addEventListener('pointerdown', e => {
    if (e.button > 0 || drag) return;
    const src = e.target.closest && e.target.closest('[data-drag]');
    if (!src || !ITEMS[src.dataset.drag]) return;
    drag = { id: src.dataset.drag, from: src.dataset.slot || null, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY,
             pid: e.pointerId, touch: e.pointerType !== 'mouse', live: false };
    if (drag.touch) drag.timer = setTimeout(dragGo, 280);
  });
  window.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.pid) return;
    if (!drag.live) {
      const far = Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0);
      if (drag.touch) { if (far > 10) dragCancel(); return; }   // moved before the hold: it's a scroll
      if (far < 6) return;
      drag.x = e.clientX; drag.y = e.clientY; dragGo();
    }
    dragMove(e.clientX, e.clientY);
  });
  window.addEventListener('pointerup', e => { if (drag && e.pointerId === drag.pid) dragDrop(e.clientX, e.clientY); });
  window.addEventListener('pointercancel', e => { if (drag && e.pointerId === drag.pid) dragCancel(); });
  // while a touch drag is live, the panel mustn't scroll under it
  document.addEventListener('touchmove', e => { if (drag && drag.live && e.cancelable) e.preventDefault(); }, { passive: false });
  // hovering a face shows their card
  body.addEventListener('mouseover', e => {
    const f = e.target.closest('.m-face');
    if (f && menu.hover !== f.dataset.name) { menu.hover = f.dataset.name; renderMenu(); }
  });
  // click/tap an item in the strip to put it on / take it off
  document.getElementById('worn').addEventListener('click', e => {
    const box = e.target.closest('.w-slot');
    if (box) { const k = box.dataset.slot; if (slots[k]) unequip(k); else { openMenu('bag'); openPick(k); renderMenu(); } return; }
    const img = e.target.closest('img[data-id]'); if (img && ITEMS[img.dataset.id].wearable) toggleItem(img.dataset.id);
  });
  pingPill(); updateCarryHud();
});
// inv.on can be switched by anything, any time (inv.on.x = true): square the boxes up a few times a second
setInterval(() => { if (slotSync()) { renderMenu(); updateCarryHud(); } }, 250);
