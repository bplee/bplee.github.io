/* ══════════════════════════════════════════
   SAVE — progress lives on this device (localStorage), so closing the tab
   by accident doesn't lose anything.
   · saved every ~5 s of play (only when something changed), and when the
     tab is hidden / closed. loaded once at startup (main.js load handler).
   · SAVE_REG below is the one list of what's saved: { key, get(), set(v) }.
     get() returns plain JSON; set(v) applies it defensively (known ids only,
     type-checked) so missing keys keep their defaults and old saves keep
     working when new state is added. to save something new, add an entry.
   · never saved: weather, dialogue bubbles, particles, mid-ride / mid-surf /
     underwater positions (you come back on the nearest dry ground).
   · every storage access is wrapped: with storage blocked the game just
     runs without saving.
══════════════════════════════════════════ */
const SAVE_KEY = 'wander.save';
const SAVE_VERSION = 1;
const SAVE = { ready: false, off: false, last: null, frames: 0, safe: null, resumed: false };

/* ── storage, wrapped (private mode, blocked site data, quota) ── */
function svStore() { try { return typeof localStorage !== 'undefined' && localStorage ? localStorage : null; } catch (e) { return null; } }
function svRead() { try { const s = svStore(); return s ? s.getItem(SAVE_KEY) : null; } catch (e) { return null; } }
function svWrite(str) { try { const s = svStore(); if (!s) return false; s.setItem(SAVE_KEY, str); return true; } catch (e) { return false; } }
function svClear() { try { const s = svStore(); if (s) s.removeItem(SAVE_KEY); } catch (e) {} }

/* ── small type-checked helpers for set() ── */
const svObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const svNum = v => typeof v === 'number' && isFinite(v);
// copy fields from src onto obj, but only ones obj already has, and only if the type matches
function svCopy(obj, src, fields) {
  if (!svObj(src)) return;
  fields.forEach(f => {
    if (!(f in src)) return;
    const v = src[f], cur = obj[f];
    if (typeof cur === 'number' ? svNum(v) : typeof cur === typeof v && v !== null) obj[f] = v;
  });
}
const svPick = (obj, fields) => { const o = {}; fields.forEach(f => { o[f] = obj[f]; }); return o; };
// apply an array of flags onto a list of objects by index
function svFlags(list, arr, field) { if (Array.isArray(arr)) list.forEach((o, i) => { if (typeof arr[i] === 'boolean') o[field] = arr[i]; }); }
// merge plain saved data into an existing object in place (for whole-object state like farm):
// only keys the object already has (a key that's null/undefined takes any plain value), same types.
// an object that starts out empty is a map (e.g. plots by id): any keys are welcome there.
function svMerge(target, src) {
  if (!svObj(target) || !svObj(src)) return;
  const open = Object.keys(target).length === 0;
  for (const k of Object.keys(src)) {
    if (!open && !(k in target)) continue;
    const v = src[k], cur = target[k];
    if (svObj(cur) && svObj(v)) svMerge(cur, v);
    else if (Array.isArray(cur)) { if (Array.isArray(v)) target[k] = JSON.parse(JSON.stringify(v)); }
    else if (cur === undefined || cur === null) target[k] = v === undefined ? cur : JSON.parse(JSON.stringify(v));
    else if (typeof cur === 'number' ? svNum(v) : typeof cur === typeof v) target[k] = v;
  }
}

/* ══════════════════════════════════════════
   WHERE YOU ARE — only ever a spot you can stand on
══════════════════════════════════════════ */
// the floor (or platform) height at x in a scene, before the camera — matches floorAt/platformY in player.js
function svBaseY(sc) { return sc === 'outside' ? 0 : sc === 'cavern' ? caveRef() : tavernFloorY(); }
const SV_SCENE_W = sc => sc === 'tavern' ? ROOM_W : sc === 'observatory' ? OBS_ROOM_W : sc === 'cavern' ? CAVE_W : WORLD_W;
// is (scene, x) dry ground you could stand on?
function svDryAt(sc, x) {
  if (!svNum(x) || x < 20 || x > SV_SCENE_W(sc) - 20) return false;
  if (sc === 'outside') return !inSea(x) && !(x > CLIFF_X - 10 && x < CLIFF_X + 16);   // not in the sea, not on the cliff face
  if (sc === 'cavern') return caveFloorY(x) < waterY() - 4;
  return true;
}
// where you're standing right now, if it's somewhere safe to come back to (else null)
function svSafeSpot() {
  const p = player;
  if (transitioning || p.riding || p.surfing || p.roping || p.climbing || p.inWater || lake.under || sky.road) return null;
  if (!p.onGround) return null;
  const sc = scene;
  if (!['outside', 'tavern', 'observatory', 'cavern'].includes(sc)) return null;
  const plat = !!(p.onPlatform && platformY(p.wx) !== null);
  if (!plat && !svDryAt(sc, p.wx)) return null;
  return { scene: sc, x: Math.round(p.wx * 10) / 10, rel: plat ? Math.round((p._py - svBaseY(sc)) * 10) / 10 : null, right: !!p.facingRight };
}
// somewhere sensible when you were saved mid-boat, mid-surf, on a ladder, or swimming
function svFallbackSpot() {
  const p = player, right = !!p.facingRight;
  if (p.riding) return { scene: 'outside', x: boat.side === 'island' ? ISLAND_DOCK_X + 95 : DOCK_X - 110, right };
  if (p.surfing) return { scene: 'outside', x: SURF_X1 + 30, right };
  if (p.roping) return { scene: 'outside', x: CLIFF_X - 30, right };
  if (scene === 'cavern') {
    if (p.climbing) return { scene: 'cavern', x: LADDER_X - 40, right };
    if (!svDryAt('cavern', p.wx)) return { scene: 'cavern', x: Math.abs(p.wx - 1380) < Math.abs(p.wx - 3150) ? 1380 : 3150, right };
    return { scene: 'cavern', x: p.wx, right };
  }
  if (scene === 'outside') {
    if (svDryAt('outside', p.wx)) return { scene: 'outside', x: p.wx, right };
    if (p.wx > CLIFF_X - 10 && p.wx < CLIFF_X + 16) return { scene: 'outside', x: p._py < groundY(CLIFF_X + 14) + 20 ? CLIFF_X + 30 : CLIFF_X - 30, right };
    return { scene: 'outside', x: p.wx < 12400 ? DOCK_X - 110 : ISLAND_DOCK_X + 95, right };   // out of the water: the nearer shore
  }
  return { scene, x: p.wx, right };
}
function svSpot() { return svSafeSpot() || SAVE.safe || svFallbackSpot(); }

function svApplySpot(v) {
  if (!svObj(v) || !['outside', 'tavern', 'observatory', 'cavern'].includes(v.scene) || !svNum(v.x)) return;
  const sc = v.scene;
  let x = Math.max(30, Math.min(SV_SCENE_W(sc) - 30, v.x));
  scene = sc;
  if (!svDryAt(sc, x)) {   // shouldn't happen (we only save dry spots), but never drop you in the water
    if (sc === 'cavern') x = Math.abs(x - 1380) < Math.abs(x - 3150) ? 1380 : 3150;
    else if (sc === 'outside') x = inSea(x) ? (x < 12400 ? DOCK_X - 110 : ISLAND_DOCK_X + 95) : x < CLIFF_X + 3 ? CLIFF_X - 30 : CLIFF_X + 30;
  }
  Object.assign(player, { wx: x, vy: 0, inWater: false, onPlatform: false, climbing: 0, roping: 0, riding: false, surfing: null,
                          jumpCount: 0, flipActive: false, flipRotation: 0, onGround: true, facingRight: v.right !== false });
  _vx = 0; player._vx = 0;
  lake.under = false; lake.surfacing = false; lake.breath = 1;
  player._py = sc === 'outside' ? groundY(x) : sc === 'cavern' ? caveFloorY(x) : tavernFloorY();
  // standing on a platform (the balcony, a cavern ledge): put you back on it if it's still there
  const py = platformY(x);
  if (svNum(v.rel) && py !== null && Math.abs(py - (svBaseY(sc) + v.rel)) < 4) { player._py = py; player.onPlatform = true; }
  player.prevPy = player._py;
  // the camera, the way each scene's own entrance sets it
  if (sc === 'tavern' || sc === 'observatory') {
    const RW = SV_SCENE_W(sc);
    camX = W >= RW ? (RW - W) / 2 : Math.max(0, Math.min(RW - W, x - W * 0.5));
    camY = viewBias();
  } else if (sc === 'cavern') {
    camX = Math.max(0, Math.min(CAVE_W - W, x - W * 0.45));
    camY = player._py - H * 0.58 + viewBias();
  } else {
    camX = Math.max(0, Math.min(WORLD_W - W, x - W * 0.3));
    camY = Math.min(0, player._py - H * 0.55) + viewBias();
  }
  weather.lastCamX = camX;
  SAVE.safe = svSafeSpot();
}

/* ══════════════════════════════════════════
   THE REGISTRY — everything that's saved, in the order it's applied
   (scene + position last: they depend on the rest)
══════════════════════════════════════════ */
const SV_TALK_FIELDS = ['li', 'stage', 'endStage', 'greeted', 'shell', 'atLake'];   // per-NPC progress (makeRegular objects)
const svTalkerKeys = () => { const seen = {}; return TALKERS.map(n => { const k = n.name + (seen[n.name] ? '#' + seen[n.name] : ''); seen[n.name] = (seen[n.name] || 0) + 1; return k; }); };
const SV_SKY_FIELDS = ['rae', 'nudge', 'li', 'nova', 'novaRoad', 'hinted', 'trips'];
const SV_SKY_STEPS = [null, 'ask', 'carry', 'set', 'done'];

const SAVE_REG = [
  { key: 'inv',
    get: () => { const o = { owned: { ...inv.owned }, on: { ...inv.on }, stacks: {} };
                 for (const k in inv) if (svNum(inv[k])) o.stacks[k] = inv[k]; return o; },
    set: v => {
      if (!svObj(v)) return;
      if (svObj(v.owned)) for (const id in v.owned) if (ITEMS[id] && v.owned[id] === true) inv.owned[id] = true;
      if (svObj(v.on)) for (const id in v.on) if (inv.owned[id] && typeof v.on[id] === 'boolean') inv.on[id] = v.on[id] && !!ITEMS[id].wearable;
      if (svObj(v.stacks)) for (const id in v.stacks) if (ITEMS[id] && svNum(v.stacks[id]) && v.stacks[id] >= 0) inv[id] = Math.floor(v.stacks[id]);
      // stack names ("gold nuggets ×3")
      for (const id in STACK_NAMES) if (inv[id]) ITEMS[id].name = inv[id] === 1 ? STACK_NAMES[id][0] : STACK_NAMES[id][1](inv[id]);
    } },
  { key: 'met', get: () => met,
    set: v => { if (!svObj(v)) return;
      for (const n in v) if (FRIENDS[n] && svObj(v[n]))
        met[n] = { gifts: Array.isArray(v[n].gifts) ? v[n].gifts.filter(g => typeof g === 'string' && ITEMS[g]) : [], last: typeof v[n].last === 'string' ? v[n].last : '' };
    } },
  { key: 'quests', get: () => questState,
    set: v => { if (svObj(v)) for (const q in v) if (QUESTS[q] && (v[q] === 'open' || v[q] === 'done')) questState[q] = v[q]; } },
  { key: 'achieved', get: () => achieved,
    set: v => { if (svObj(v)) for (const a in v) if (ACHIEVEMENTS[a] && v[a] === true) achieved[a] = true; } },
  // every NPC's dialogue counters + stages, by name
  { key: 'talkers',
    get: () => { const o = {}, ks = svTalkerKeys(); TALKERS.forEach((n, i) => { const f = {}; SV_TALK_FIELDS.forEach(k => { if (k in n) f[k] = n[k]; }); o[ks[i]] = f; }); return o; },
    set: v => { if (!svObj(v)) return; const ks = svTalkerKeys(); TALKERS.forEach((n, i) => svCopy(n, v[ks[i]], SV_TALK_FIELDS.filter(k => k in n))); } },
  { key: 'tavern', get: () => ({ quest: svPick(quest, ['buttonReturned']), outsideReturnX, obsReturnX }),
    set: v => { if (!svObj(v)) return; svCopy(quest, v.quest, ['buttonReturned']);
      if (svNum(v.outsideReturnX)) outsideReturnX = v.outsideReturnX; if (svNum(v.obsReturnX)) obsReturnX = v.obsReturnX; } },
  { key: 'blades', get: () => OBJECTS.filter(o => o.type === 'blades').map(o => !!o.collected),
    set: v => svFlags(OBJECTS.filter(o => o.type === 'blades'), v, 'collected') },
  { key: 'stars', get: () => ({ c: CONSTELLATIONS.map(c => [c.found, Math.round(c.progress * 1000) / 1000]) }),
    set: v => { if (svObj(v) && Array.isArray(v.c)) CONSTELLATIONS.forEach((c, i) => { const s = v.c[i];
      if (Array.isArray(s)) { if (typeof s[0] === 'boolean') c.found = s[0]; if (svNum(s[1])) c.progress = Math.max(0, Math.min(1, s[1])); } }); } },
  { key: 'cave', get: () => svPick(caveState, ['dug', 'seenPool', 'entered', 'moleHole']),
    set: v => { if (!svObj(v)) return; ['dug', 'seenPool', 'entered', 'moleHole'].forEach(k => { if (typeof v[k] === 'boolean') caveState[k] = v[k]; }); } },
  { key: 'lake', get: () => svPick(lake, ['periStage', 'taught']), set: v => svCopy(lake, v, ['periStage', 'taught']) },
  { key: 'deep', get: () => ({ veins: GOLD_VEINS.map(g => g.left), noteSeen: deep.noteSeen }),
    set: v => { if (!svObj(v)) return; svFlags(GOLD_VEINS, v.veins, 'left'); svCopy(deep, v, ['noteSeen']); } },
  { key: 'east',
    get: () => ({ rope: east.rope, hung: east.hung, cut: FALLEN.map(f => f.cut), taken: FALLEN.map(f => f.houseTaken),
                  filled: EAST_TREES.map(t => t.filled), jun: svPick(jun, ['out']) }),
    set: v => {
      if (!svObj(v)) return;
      svCopy(east, v, ['rope', 'hung']);
      east.ropeT = east.rope ? 1 : 0; east.ropeShow = 0; east.talk = false; east.chop = null;
      svFlags(FALLEN, v.cut, 'cut'); svFlags(FALLEN, v.taken, 'houseTaken'); svFlags(EAST_TREES, v.filled, 'filled');
      svCopy(jun, v.jun, ['out']);
      // juniper starts at home on her roof (mid-rant? she'll svPick it up when you talk to her)
      const [hx, hy] = junHome(); Object.assign(jun, { x: hx, y: hy, near: false, cross: false, flying: false, pop: 0, idle: 0, scale: 1.3 });
    } },
  { key: 'store', get: () => ({ dug: DIG_SPOTS.map(d => d.dug) }), set: v => { if (svObj(v)) svFlags(DIG_SPOTS, v.dug, 'dug'); } },
  { key: 'boat', get: () => svPick(boat, ['hull', 'sail', 'launched', 'side', 'crossed']),
    set: v => {
      if (!svObj(v)) return;
      svCopy(boat, v, ['hull', 'sail', 'launched', 'crossed']);
      if (v.side === 'beach' || v.side === 'island') boat.side = v.side;
      if (boat.side === 'island') boat.launched = true;
      boat.ride = null; boat.hammer = 0; boat.tilt = 0;
      boat.x = !boat.launched ? BOAT_BUILD_X : boat.side === 'island' ? ISLAND_DOCK_X : DOCK_X;
    } },
  { key: 'surf', get: () => ({ rides: surf.rides, toasting: surf.toast > 0 }),
    set: v => { if (!svObj(v)) return; svCopy(surf, v, ['rides']); if (v.toasting === true && !achieved.toasty) surf.toast = 1; } },   // the marshmallow, again from the top
  { key: 'reef', get: () => ({ conchTaken: !!sea.conchTaken, nib: { home: nib.home, x: nib.x, d: nib.d } }),
    set: v => {
      if (!svObj(v)) return;
      if (typeof v.conchTaken === 'boolean') sea.conchTaken = v.conchTaken;
      const n = v.nib; nib.follow = false; nib.trail = [];
      if (!svObj(n)) return;
      if (n.home === true) { nib.home = true; nib.x = NIB_SEAT_X; nib.d = SCHOOL_D; }
      else if (svNum(n.x) && svNum(n.d)) { nib.x = n.x; nib.d = n.d; }   // he waits where you left him
    } },
  { key: 'sky',
    get: () => ({ ...svPick(sky, SV_SKY_FIELDS), step: sky.step, wave: [LONG_WAVE.found, Math.round(LONG_WAVE.progress * 1000) / 1000],
                  built: TELESCOPES.reduce((o, t) => (o[t.id] = t.built, o), {}) }),
    set: v => {
      if (!svObj(v)) return;
      svCopy(sky, v, SV_SKY_FIELDS);
      if (SV_SKY_STEPS.includes(v.step)) sky.step = v.step;
      if (Array.isArray(v.wave)) { if (typeof v.wave[0] === 'boolean') LONG_WAVE.found = v.wave[0]; if (svNum(v.wave[1])) LONG_WAVE.progress = Math.max(0, Math.min(1, v.wave[1])); }
      if (svObj(v.built)) TELESCOPES.forEach(t => { if (typeof v.built[t.id] === 'boolean') t.built = v.built[t.id]; });
      syncTelescopes();
      if (LONG_WAVE.found) {   // the chart's second page (skycharts.js renames it when the long wave is found)
        ITEMS.chart.name = 'star chart (two skies)';
        ITEMS.chart.desc = "nova's chart, plus a page for rae's island sky. hold it to see your constellations up above.";
      }
    } },
  // rae's island farm (farm.js), if it's there: one plain object, merged in place
  { key: 'farm',
    get: () => typeof farm !== 'undefined' && svObj(farm) ? JSON.parse(JSON.stringify(farm)) : undefined,
    set: v => { if (typeof farm === 'undefined') return; svMerge(farm, v); if (typeof farmAfterLoad === 'function') farmAfterLoad(); } },   // farmAfterLoad (farm.js, optional): re-derive item names etc.
  // and last: where you are
  { key: 'pos', get: () => svSpot(), set: v => svApplySpot(v) },
];

/* ── after loading: put people where their progress says they'd be ── */
function svSettle() {
  if (inv.owned.blades) OBJECTS.forEach(o => { if (o.type === 'blades') o.collected = true; });
  // rae: on the beach once you've crossed (she paddles out again when you surf), else surfing
  rae.wave = null;
  if (boat.crossed) Object.assign(rae, { mode: 'ashore', x: RAE_BEACH_X, ashore: true });
  else Object.assign(rae, { mode: 'wait', x: SURF_TAKEOFF, ashore: false });
  sky.raeX = null; sky.road = null;
  // gifts that were on their way when the tab closed (a backstop for svFlushGifts)
  if (boat.hull && boat.sail && questState.boat === 'done' && !boat.launched) { boat.launched = true; boat.x = DOCK_X; }
  if (achieved.toasty && !hasItem('shells')) svGive('shells', 'rae');
}
function svGive(id, from) { if (inv.owned[id] || !ITEMS[id]) return; inv.owned[id] = true; inv.on[id] = !!ITEMS[id].wearable; if (from && met[from] && !met[from].gifts.includes(id)) met[from].gifts.push(id); }

/* ══════════════════════════════════════════
   GIFTS IN THE MAIL — many gifts arrive a beat after the line that gives
   them (setTimeout(() => give(...))). if the tab closes in that beat the
   gift would be lost, so: track those timers, don't autosave while one is
   pending, and when the page is going away, hand them over right now.
══════════════════════════════════════════ */
const svPendingGifts = new Set();
(function wrapTimers() {
  const st = window.setTimeout;
  if (typeof st !== 'function') return;
  const GIFT = /\bgive\(|launched\s*=\s*true/;
  window.setTimeout = function (f, ms, ...args) {
    if (typeof f !== 'function' || !GIFT.test(String(f))) return st.call(window, f, ms, ...args);
    const rec = { run() { if (rec.done) return; rec.done = true; svPendingGifts.delete(rec); f(...args); } };
    svPendingGifts.add(rec);
    return st.call(window, () => rec.run(), ms);
  };
})();
function svFlushGifts() { [...svPendingGifts].forEach(r => { try { r.run(); } catch (e) {} }); }

/* ══════════════════════════════════════════
   SAVE / LOAD
══════════════════════════════════════════ */
function svBuild() {
  const data = {};
  SAVE_REG.forEach(e => {
    try { const v = e.get(); if (v !== undefined) data[e.key] = JSON.parse(JSON.stringify(v)); } catch (err) {}   // one bad entry doesn't sink the rest
  });
  return data;
}
// why: 'tick' (autosave) | 'leave' (tab hidden / closing) | 'manual'
function saveGame(why) {
  if (!SAVE.ready || SAVE.off) return false;
  try {
    if (why === 'leave') svFlushGifts();
    else if (svPendingGifts.size) return false;          // a gift is on its way: next time
    const data = svBuild(), body = JSON.stringify(data);
    if (body === SAVE.last) return true;               // nothing changed
    if (svWrite(JSON.stringify({ v: SAVE_VERSION, t: Date.now(), data }))) { SAVE.last = body; return true; }
  } catch (e) {}
  return false;
}
// read + check the save: null if missing, corrupt, or from another version
function svReadSave() {
  const raw = svRead();
  if (typeof raw !== 'string' || !raw) return null;
  let s; try { s = JSON.parse(raw); } catch (e) { return null; }
  if (!svObj(s) || !svObj(s.data)) return null;
  if (s.v !== SAVE_VERSION) return svMigrate(s);
  return s.data;
}
function svMigrate(s) { return null; }   // (no older versions yet: a mismatched save is ignored)

// called once from main.js's load handler, before the game starts
function loadSave() {
  if (SAVE.ready) return;
  SAVE.ready = true;
  const data = svReadSave();
  if (data) {
    SAVE_REG.forEach(e => { if (e.key in data) { try { e.set(data[e.key]); } catch (err) {} } });
    try { svSettle(); } catch (err) {}
    SAVE.resumed = Object.keys(data.quests || {}).length + Object.keys(data.met || {}).length + Object.keys((data.inv || {}).owned || {}).length > 0;
    try { renderMenu(); pingPill(); updateCarryHud(); } catch (err) {}
    if (SAVE.resumed) setTimeout(() => showHint('welcome back. right where you left off.', 3200), 1600);
  }
  try { SAVE.last = JSON.stringify(svBuild()); } catch (e) {}
}

// called every normal frame (main.js update): remember the last safe spot, autosave every ~5 s
function saveTick() {
  if (!SAVE.ready) return;
  SAVE.frames++;
  if (SAVE.frames % 20 === 0) { const s = svSafeSpot(); if (s) SAVE.safe = s; }
  if (SAVE.frames % 300 === 0) saveGame('tick');
}

// start over: wipe the save and reload (nothing gets saved on the way out)
function startOver() {
  SAVE.off = true;
  svClear();
  try { location.reload(); } catch (e) {}
}

window.addEventListener('pagehide', () => saveGame('leave'));
window.addEventListener('beforeunload', () => saveGame('leave'));
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame('leave'); });
