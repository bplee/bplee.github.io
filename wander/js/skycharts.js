/* ══════════════════════════════════════════
   SKY CHARTS — rae's telescope, and the sky roads between telescopes
   · after the bonfire, rae asks if the stars look the same where you're
     from. show her nova's chart and she wishes she had a telescope →
     quest "a telescope for rae": nova has a spare in her crate of spares,
     carry it over on the boat, put it up on the island's point, then chart
     the island's own constellation ("the long wave") with rae watching.
   · SKY ROADS (fast travel): every telescope looks at the same sky, and
     every place has one star sitting right over it (its "home star"). once
     two places are on your chart, look through one telescope, line up the
     other's home star (gold, labeled), press E / enter — and you step along
     its starlight to the other telescope. nova calls it a sky road.
     clouds block it (the weather changes on its own, so: come back later).
     the boat stays wherever it was moored; you can always telescope back.
   · to add a telescope later: push to TELESCOPES (id, scene, x, label, star,
     built, charted, optionally arrive()). travel works between any two that
     are built + charted.
   Everything new (items, quest, achievements) is registered here at load
   time; item art is rendered lazily by ensureArt(), which runs after load.

   ISLAND LAYOUT, left to right (island.js, farm.js; keep organized):
     15160        palm · 15340 bonfire · 15405 palm (hammock's left end)
     15488        the hammock's post (a driftwood post, hammock sags between it and the palm)
     15580        rae's hut (island.js; ~124 wide) and, once built, birch's porch (farm.js)
     15690        palm (left of the farm)
     15712–15935  rae's farm (farm.js): sign 15712, raised beds 15744–15866, shed 15903, barrel 15930
     15960        palm (right of the farm)
     16000        rae's telescope, on the flat sand at the foot of the point
     16030–16300  the rocky point (core.js COAST)
══════════════════════════════════════════ */
const ISLAND_SCOPE_X = 16000;

/* ── registrations ── */
Object.assign(ITEMS, {
  scope: { name: 'a spare telescope', desc: "nova's first telescope. brass, a little dusty, folds up small. it's for rae.", wearable: false },
});
ITEM_ORDER.push('scope');
Object.assign(ITEM_ART, {
  scope: (w, h) => {
    ctx.strokeStyle = 'rgba(120,90,55,0.95)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w / 2, h / 2 + 4); ctx.lineTo(w / 2 - 10, h - 6); ctx.moveTo(w / 2, h / 2 + 4); ctx.lineTo(w / 2 + 10, h - 6); ctx.moveTo(w / 2, h / 2 + 4); ctx.lineTo(w / 2 + 1, h - 4); ctx.stroke();
    drawScopeTube(w / 2, h / 2 + 2, -0.7, 1.05, false);
  },
});
Object.assign(QUESTS, {
  skychart: { giver: 'rae', title: 'a map of the sky', desc: "rae wants to see how the stars look from the mainland. nova, at the observatory on the hill, has a star chart: chart her four constellations through her telescope (that's her quest 'chart the stars'), and she'll give you the chart. then show it to rae." },
  skyscope: { giver: 'rae', title: 'a telescope for rae', desc: "rae has never seen a constellation. ask nova for a spare telescope, bring it over on the boat, put it up on the island's point, and chart rae's sky with her." },
});
Object.assign(ACHIEVEMENTS, {
  twoskies: { name: 'two skies',  desc: "chart the sky over rae's island." },
  skyroad:  { name: 'sky road',   desc: 'step along the starlight from one telescope to another.' },
});

/* ── the island's constellation: a swell rising to a curling crest. the crest star sits over the island ── */
const LONG_WAVE = { name: 'the long wave', cx: 1490, cy: 1135, progress: 0, found: false,
  stars: [[1370, 1200], [1420, 1188], [1465, 1165], [1505, 1132], [1530, 1098], [1560, 1076], [1592, 1084], [1604, 1108], [1588, 1126]],
  lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]] };

/* ── and a second one, further east: rae's dinged old board, with its fin. found from the island telescope only ── */
const RAE_BOARD = { name: "rae's board", cx: 2085, cy: 815, progress: 0, found: false,
  stars: [[2200, 800], [2150, 782], [2090, 774], [2030, 780], [1975, 800], [2030, 826], [2095, 830], [2152, 822], [1985, 858]],
  lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [4, 8], [8, 5]] };
const ISLAND_CONS = [LONG_WAVE, RAE_BOARD];
const ISLAND_AIM = [1900, 700];   // where the island telescope starts out: east, toward where the island is

/* ── the telescopes. star = its home star (sky coords): the one sitting right overhead ── */
const TELESCOPES = [
  { id: 'observatory', scene: 'observatory', x: OBS_SCOPE_X,    label: 'the observatory', star: [1240, 560],          built: true,  charted: false },
  { id: 'island',      scene: 'outside',     x: ISLAND_SCOPE_X, label: "rae's island",    star: LONG_WAVE.stars[5], built: false, charted: false },
];
const scopeById = id => TELESCOPES.find(t => t.id === id);
function syncTelescopes() {
  scopeById('observatory').charted = questState.stars === 'done';
  scopeById('island').charted = LONG_WAVE.found;
}

const sky = {
  rae: 0, nudge: 0, li: 0, nova: 0, novaRoad: 0,
  step: null,          // the quest: 'ask' (nova) → 'carry' → 'set' (it's up) → 'done'
  raeX: null, linger: 0,
  caption: null, captionT: 0, waitT: 0,
  road: null,          // { t, to } while stepping along the starlight
  sparks: [], beam: 0, sparkScene: null, puff: [],
  hinted: false, trips: 0, boardHint: false,
};

/* ── where are you looking from, and where could you go? ── */
function hereScope() { return TELESCOPES.find(t => t.built && t.scene === scene && Math.abs(player.wx - t.x) < 60) || null; }
function skyRoadsPossible() {   // the roads that would exist if you had the chart
  const here = hereScope();
  if (!here || !here.charted) return [];
  return TELESCOPES.filter(t => t !== here && t.built && t.charted);
}
function skyRoads() { return hasItem('chart') ? skyRoadsPossible() : []; }
const skyClear = () => skyHidden() <= 0.02 && SKY_CLEAR[weather.type];
function aimedRoad() {
  if (!skyClear()) return null;
  return skyRoads().find(t => Math.hypot(t.star[0] - obs.vx, t.star[1] - obs.vy) < 34) || null;
}
function skyRoadLabel() { return sky.road ? null : aimedRoad() ? 'travel' : null; }   // touch action button
function skyCaption(text, frames) { sky.caption = text; sky.captionT = frames || 300; }

/* ══════════════════════════════════════════
   DIALOGUE
══════════════════════════════════════════ */
const RAE_SKY_FLAVOR = [
  "every night i check the wave is still up there. it always is. waves come back. even the star ones.",
  "i tried to name a star after you. then i found the one right over my hut and i got distracted.",
  "i look up now. i still look at waves. but i look up, too.",
];
function raeSkyLine() {
  if (questState.bonfire !== 'done' || surf.toast) return null;
  if (sky.rae === 0) { sky.rae = 1; return "do the stars look the same where you're from? here they look like freckles. nobody ever told me their names. maybe they don't have any."; }
  if (sky.rae === 1) {
    if (!hasItem('chart')) return raeChartAsk();
    sky.rae = 2; showHint("you unroll nova's star chart for rae", 3000);
    if (questState.skychart === 'open') completeQuest('skychart');
    return "wait — is that a map? of the SKY? …that's a ladle. there's a LADLE up there? and a mug, and a toad, asleep? i've looked up every night of my life and never saw any of it. i only ever look at waves.";
  }
  if (sky.rae === 2) {
    sky.rae = 3; sky.step = 'ask'; startQuest('skyscope');
    return "i wish i had a telescope. a little one. i'd put it out on the point, past the last palm, where the sand's flat. does your star person have a spare? i'd trade a shell. a good shell.";
  }
  if (questState.skyscope === 'open') {
    if (sky.step === 'ask')   return "the star person on the hill. tell her i'll take good care of it. i take very good care of things. ask my board.";
    if (sky.step === 'carry') return "is that it?! is that a TELESCOPE? out on the point! past the last palm! go go go";
    if (sky.step === 'set')   return "it's up! look through it! i'll stand right here. i won't touch anything. i might touch one thing.";
  }
  if (questState.skyscope === 'done' && sky.li++ % 2 === 0) return RAE_SKY_FLAVOR[(sky.li >> 1) % RAE_SKY_FLAVOR.length];
  return null;
}

// no chart yet: rae points you at nova (a small quest), then keeps track of how far you've got
function raeChartAsk() {
  if (!questState.skychart) {
    startQuest('skychart');
    return "birch says on the mainland someone draws lines between the stars. her name's nova, and she lives in an observatory up on the hill, with a telescope. she has a star chart. maybe she'd show you? i'd draw lines between waves, but they won't hold still.";
  }
  const n = foundCount();
  if (!met.nova && !questState.stars) return "nova. the observatory, on the hill. she's the one who charts the stars. tell her a fox on an island sent you. she'll think it's a joke. it's not a joke.";
  if (questState.stars === 'done') return "she gave you the chart, didn't she? i can tell, you've got a chart sort of face. show me! hold it up, i won't touch it. i might touch it.";
  return `that's ${n} of nova's four constellations so far, you said? that's ${n} more than i've ever seen. the chart's the prize. find the rest through her telescope, then come show me.`;
}
function novaSkyLine() {
  if (questState.skyscope === 'open' && sky.step === 'ask') {
    if (!sky.nova) { sky.nova = 1; return "someone lives on the ISLAND? past the storm? and she wants to see the stars? …that's the best thing i've heard all year. i have a spare. somewhere."; }
    sky.step = 'carry'; setTimeout(() => give('scope', 'nova'), 900);
    return "*rummage* not that crate. not that one. — here! my very first telescope. it's small, but it's honest. tell her the lens likes a soft cloth and a kind word.";
  }
  if (sky.step === 'carry' && hasItem('scope') && Math.random() < 0.5) return "careful with it on the boat. it's never been to sea. neither have i, come to think of it.";
  if (LONG_WAVE.found && !sky.novaRoad) {
    sky.novaRoad = 1;
    return "you charted rae's sky? then you've got two home stars on one chart. every place has a star right over it — find another place's star in a telescope and you can walk along its light. i call it a sky road. i've only ever had the one end.";
  }
  return null;
}

/* ══════════════════════════════════════════
   THE ISLAND TELESCOPE (outside)
══════════════════════════════════════════ */
function setUpScope() {
  takeItem('scope');
  scopeById('island').built = true; sky.step = 'set';
  for (let i = 0; i < 18; i++) sky.puff.push({ x: ISLAND_SCOPE_X + rand(-16, 16), y: groundY(ISLAND_SCOPE_X) - 2, vx: rand(-0.8, 0.8), vy: rand(-1.2, -0.3), life: 1 });
  say(rae, "it's UP! it's so shiny. okay. okay. you look first. you know what you're looking for.", true);
}
function lookIsland() {
  if (obs.viewing || transitioning) return;
  if (!LONG_WAVE.found) {
    obs.vx = ISLAND_AIM[0]; obs.vy = ISLAND_AIM[1];   // rae's pointed it out east, a little high
    skyCaption("rae, right beside you: 'can you see anything? don't tell me. tell me.'", 280);
  } else {
    obs.vx = LONG_WAVE.stars[5][0]; obs.vy = LONG_WAVE.stars[5][1];   // straight up: the island's own star
    if (!RAE_BOARD.found && !sky.boardHint) { sky.boardHint = true; skyCaption("rae: 'there's more out east, i can feel it. i'm very good at feeling things i can't see yet.'", 340); }
  }
  sky.waitT = 0;
  openTelescope();
}

OUT_SPOTS.push(() => {
  // the point
  if (Math.abs(player.wx - ISLAND_SCOPE_X) < 50) {
    if (scopeById('island').built)
      return { text: skyHidden() > 0.5 ? 'press E to look through the telescope (clouded over)' : 'press E to look through the telescope', act: lookIsland };
    if (hasItem('scope')) return { text: 'press E to put up the telescope', act: setUpScope };
    if (questState.skyscope === 'open') return { text: "a circle in the sand, drawn with a stick. rae's saving the spot." };
    return { text: 'the point. flat sand, the whole sky, and nothing in the way.' };
  }
  // an empty mooring: say where the boat went, and how else to get home
  if (boat.launched && !boat.ride) {
    if (boat.side === 'island' && Math.abs(player.wx - DOCK_X) < 90 && player.wx < 11000)
      return { text: "the maybe is moored over at the island, with birch." + (scopeById('island').charted ? ' (the telescopes are quicker.)' : '') };
    if (boat.side === 'beach' && Math.abs(player.wx - ISLAND_DOCK_X) < 90)
      return { text: "the maybe is back on the mainland. rae's telescope is the quick way home." };
  }
  return null;
});

/* ══════════════════════════════════════════
   TRAVEL — stepping along the starlight
══════════════════════════════════════════ */
// E / enter while looking through a telescope (called from observatory.js). true = handled.
function skyRoadGo() {
  if (sky.road) return true;
  const to = aimedRoad();
  if (!to) return false;
  sky.road = { t: 0, to };
  return true;
}
function travelTo(t) {
  obs.viewing = false; sky.road = null;
  player.inWater = false; lake.under = false; lake.breath = 1; player.vy = 0; _vx = 0; player._vx = 0; player.onPlatform = false;
  player.wx = t.x - 46; player.facingRight = true;
  if (t.arrive) t.arrive();
  else if (t.scene === 'observatory') {
    if (scene !== 'observatory') obsReturnX = OBS_DOOR_X();   // the door is the way out
    scene = 'observatory'; player._py = tavernFloorY();
    camX = W >= OBS_ROOM_W ? (OBS_ROOM_W - W) / 2 : Math.max(0, Math.min(OBS_ROOM_W - W, player.wx - W * 0.5));
  } else {
    scene = t.scene; player._py = groundY(player.wx);
    camX = Math.max(0, Math.min(WORLD_W - W, player.wx - W * 0.3));
    camY = Math.min(0, player._py - H * 0.55) + viewBias();
    weather.lastCamX = camX;
  }
  // the arrival sparkle: a column of starlight, and sparks settling around you
  sky.beam = 1; sky.sparkScene = scene;
  for (let i = 0; i < 46; i++) sky.sparks.push({ x: player.wx + rand(-30, 30), y: player._py - rand(0, 90), vx: rand(-1.4, 1.4), vy: rand(-1.6, 0.4), life: rand(0.7, 1.2) });
  sky.trips++;
  achieve('skyroad');
  setTimeout(() => {
    if (t.id === 'observatory' && sky.trips <= 2) say(nova, "…did you just come out of my telescope? i KNEW it. i knew it worked. i'm writing this down.");
    if (t.id === 'island' && rae.ashore) say(rae, sky.trips <= 2 ? "WHOA. where did you — the telescope? you came out of the TELESCOPE?" : 'welcome back, star walker!');
  }, 500);
}

/* ══════════════════════════════════════════
   UPDATE
══════════════════════════════════════════ */
// every frame you're looking through a telescope (from updateTelescope)
function updateSkyExtras(seeing) {
  syncTelescopes();
  if (sky.captionT > 0) sky.captionT--;
  const here = hereScope();
  // the island's own constellations can only be charted from the island (from the mainland the long wave sits
  // low, down behind the storm, and the board is out past the edge of the view)
  if (here && here.id === 'island') ISLAND_CONS.forEach(C => {
    if (C.found) return;
    const d = Math.hypot(C.cx - obs.vx, C.cy - obs.vy);
    if (d < 110) C.progress += seeing / 50; else C.progress = Math.max(0, C.progress - 0.02);
    if (C === LONG_WAVE && seeing && ++sky.waitT === 420 && d > 110) skyCaption("rae: 'try down low, toward the water. that's where i'd hide, if i were stars.'", 320);
    if (C.progress >= 1) {
      C.found = true; syncTelescopes();
      notify('found', C.name, null, "the sky over rae's island");
      if (C === LONG_WAVE) {
        sky.step = 'done'; sky.linger = 60 * 25;
        skyCaption("rae: 'a WAVE! i KNEW it. it's breaking, look — and the bright one on the crest? that's right over my hut. every night.'", 520);
        completeQuest('skyscope'); achieve('twoskies');
        ITEMS.chart.name = 'star chart (two skies)';
        ITEMS.chart.desc = "nova's chart, plus a page for rae's island sky. hold it to see your constellations up above.";
        setTimeout(() => { ensureArt(); notify('item', "a new page for your star chart", ART.items.chart, 'from rae'); renderMenu(); updateCarryHud(); }, 1600);
      } else {
        sky.linger = Math.max(sky.linger, 60 * 20);
        skyCaption("rae: 'that's my BOARD. the dinged one, with the fin. the sky has a dinged board. i feel so seen. i feel seen by a SKY.'", 520);
        if (rae.ashore) setTimeout(() => say(rae, "i'm going to tell the waves. they'll be so jealous. they don't have a constellation. they have me.", false), 2400);
      }
    }
  });
  // first look through a telescope on the sky road: say how it works
  if (!sky.hinted && skyRoads().length && skyClear() && LONG_WAVE.found && sky.captionT < 200) {
    sky.hinted = true;
    showHint('every telescope sees the same sky. line up the gold star over another telescope, then press E to step along its light', 7000);
  }
  // stepping along the starlight: the view glides onto the star, flares, and you're there
  if (sky.road) {
    const r = sky.road; r.t++;
    obs.vx += (r.to.star[0] - obs.vx) * 0.12; obs.vy += (r.to.star[1] - obs.vy) * 0.12;
    if (r.t === 70) fadeTransition(() => travelTo(r.to));
  }
}

// every normal frame, any scene (from main.js update)
function updateSkyCharts() {
  syncTelescopes();
  if (sky.beam > 0) sky.beam = Math.max(0, sky.beam - 0.012);
  for (let i = sky.sparks.length - 1; i >= 0; i--) {
    const p = sky.sparks[i]; p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy = p.vy * 0.97 + 0.02; p.life -= 0.012;
    if (p.life <= 0) sky.sparks.splice(i, 1);
  }
  for (let i = sky.puff.length - 1; i >= 0; i--) { const p = sky.puff[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.025; if (p.life <= 0) sky.puff.splice(i, 1); }
  if (scene !== 'outside') return;
  // rae comes over to watch while the telescope is new, then wanders home
  if (sky.linger > 0 && Math.abs(player.wx - ISLAND_SCOPE_X) > 500) sky.linger--;
  const want = rae.ashore && (sky.step === 'set' || sky.linger > 0);
  if (!rae.ashore) { sky.raeX = null; return; }
  if (want || sky.raeX !== null) {
    if (sky.raeX === null) sky.raeX = rae.x;
    const target = want ? ISLAND_SCOPE_X - 72 : rae.x;   // (rae.x is her spot by the bonfire, set by updateIsland)
    sky.raeX += Math.max(-1.6, Math.min(1.6, target - sky.raeX));
    if (!want && Math.abs(target - sky.raeX) < 2) sky.raeX = null;
    else rae.x = sky.raeX;
  }
}

/* ══════════════════════════════════════════
   DRAW
══════════════════════════════════════════ */
// a little brass telescope tube at (x, y) = its pivot, angled ang, scaled k
function drawScopeTube(x, y, ang, k, glow) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(k, k);
  const g = ctx.createLinearGradient(0, -5, 0, 5);
  g.addColorStop(0, glow ? '#f4d896' : '#dcb46c'); g.addColorStop(0.5, glow ? '#ffe8b0' : '#e8c27a'); g.addColorStop(1, '#9a763c');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-12, -3); ctx.lineTo(22, -5); ctx.lineTo(22, 5); ctx.lineTo(-12, 3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8a6a3a'; ctx.fillRect(20, -6, 5, 12); ctx.fillRect(2, -5, 3, 10);
  ctx.fillStyle = '#2a2420'; ctx.fillRect(-17, -2, 6, 4);
  ctx.fillStyle = 'rgba(180,210,255,0.5)'; ctx.fillRect(24.5, -4, 1.2, 8);
  ctx.restore();
}

// outside, behind the player: the telescope on the point (or rae's circle in the sand)
function drawSkyChartsWorld() {
  const sx = ISLAND_SCOPE_X - camX;
  if (sx < -80 || sx > W + 80) return;
  const gy = groundY(ISLAND_SCOPE_X);
  ctx.save();
  if (scopeById('island').built) {
    const near = scene === "outside" && Math.abs(player.wx - ISLAND_SCOPE_X) < 50, py = gy - 38;
    ctx.strokeStyle = '#5a4026'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, py); ctx.lineTo(sx - 16, gy); ctx.moveTo(sx, py); ctx.lineTo(sx + 15, gy); ctx.moveTo(sx, py); ctx.lineTo(sx + 2, gy + 2); ctx.stroke();
    ctx.fillStyle = '#6a4c2c'; ctx.beginPath(); ctx.arc(sx, py, 2.5, 0, 7); ctx.fill();
    drawScopeTube(sx, py - 2, -2.35, 1.45, near);   // pointing up over the sea
    if (near) drawGlow(sx - 10, py - 14, 50, 0.14, [255, 230, 160]);
    else drawGlow(sx - 16, py - 22, 14, 0.12 + 0.06 * Math.sin(tick * 0.05), [255, 230, 170]);
  } else if (questState.skyscope === 'open') {
    ctx.strokeStyle = 'rgba(120,100,70,0.6)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.ellipse(sx, gy + 1, 20, 4, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#5a4026'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx + 26, gy); ctx.lineTo(sx + 30, gy - 22); ctx.stroke();
  }
  sky.puff.forEach(p => { ctx.fillStyle = `rgba(220,205,170,${p.life * 0.6})`; ctx.beginPath(); ctx.arc(p.x - camX, p.y, 2 + (1 - p.life) * 3, 0, 7); ctx.fill(); });
  ctx.restore();
}

// inside the observatory: nova's crate of spares (the little telescope pokes out until she gives it to you)
function drawSkyChartsInterior() {
  const F = tavernFloorY(), x = 470 - camX;
  ctx.save();
  if (!hasItem('scope') && sky.step !== 'set' && sky.step !== 'done') drawScopeTube(x - 4, F - 30, -2.2, 1, false);
  ctx.fillStyle = '#5a4026'; ctx.fillRect(x - 24, F - 28, 48, 28);
  ctx.strokeStyle = 'rgba(160,125,80,0.7)'; ctx.lineWidth = 1;
  for (let y = F - 21; y < F; y += 7) { ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.lineTo(x + 24, y); ctx.stroke(); }
  ctx.strokeRect(x - 24, F - 28, 48, 28);
  ctx.fillStyle = 'rgba(230,210,170,0.6)'; ctx.font = '7px Space Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('SPARES', x, F - 12);
  ctx.restore();
}

// the arrival: a column of starlight fading, and sparks drifting down around you
function drawSkyRoadSparkle() {
  if (sky.sparkScene !== scene || (!sky.beam && !sky.sparks.length)) return;
  ctx.save();
  if (sky.beam > 0) {
    const bx = player.wx - camX, top = camY - 20, bot = player._py + 4, k = sky.beam;
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(0.7, `rgba(255,240,200,${0.22 * k})`); g.addColorStop(1, `rgba(255,248,225,${0.5 * k})`);
    ctx.fillStyle = g; ctx.fillRect(bx - 16 * k - 4, top, (16 * k + 4) * 2, bot - top);
    drawGlow(bx, player._py - 20, 70, 0.35 * k, [255, 235, 180]);
  }
  sky.sparks.forEach(p => {
    const tw = 0.6 + 0.4 * Math.sin(tick * 0.3 + p.x), a = Math.min(1, p.life) * tw, x = p.x - camX, r = 1.6 + p.life;
    ctx.fillStyle = `rgba(255,236,180,${a})`;
    ctx.beginPath(); ctx.moveTo(x, p.y - r * 2); ctx.lineTo(x + r * 0.5, p.y); ctx.lineTo(x, p.y + r * 2); ctx.lineTo(x - r * 0.5, p.y); ctx.closePath(); ctx.fill();
    ctx.fillRect(x - r * 1.6, p.y - 0.4, r * 3.2, 0.8);
  });
  ctx.restore();
}

// a four-pointed gold star (home stars), in screen coords
function drawHomeStar(x, y, s, a) {
  drawGlow(x, y, 22 * s, 0.45 * a, [255, 220, 140]);
  ctx.fillStyle = `rgba(255,236,170,${a})`;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const r = i % 2 ? 2 * s : 9 * s, an = -Math.PI / 2 + i * Math.PI / 4; ctx.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); }
  ctx.closePath(); ctx.fill();
}

// inside the telescope lens (clipped, faded with the stars): the long wave + home stars
function drawSkyExtras(ox, oy, t) {
  const here = hereScope();
  ISLAND_CONS.forEach(C => {
    if (!(C.found || (here && here.id === 'island'))) return;
    const la = C.found ? 0.65 : C.progress * 0.5;
    if (la > 0.01) {
      ctx.strokeStyle = `rgba(180,225,255,${la})`; ctx.lineWidth = 1;
      ctx.beginPath(); C.lines.forEach(([i, j]) => { ctx.moveTo(ox + C.stars[i][0], oy + C.stars[i][1]); ctx.lineTo(ox + C.stars[j][0], oy + C.stars[j][1]); }); ctx.stroke();
    }
    C.stars.forEach(([x, y], i) => {
      if (C === LONG_WAVE && i === 5 && C.found && skyRoads().length) return;   // drawn gold below
      const tw = 0.75 + 0.25 * Math.sin(t * 1.3 + i * 1.7);
      drawGlow(ox + x, oy + y, 9, 0.35 * tw, [220, 235, 255]);
      ctx.fillStyle = `rgba(245,250,255,${tw})`; ctx.beginPath(); ctx.arc(ox + x, oy + y, 2, 0, 7); ctx.fill();
    });
    if (C.found) { ctx.fillStyle = 'rgba(200,225,255,0.75)'; ctx.font = '11px Space Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText(C.name, ox + C.cx, oy + C.cy + (C === LONG_WAVE ? 80 : 62)); }
  });
  // the sky road: every charted telescope's home star, in gold
  const roads = skyRoads();
  if (!roads.length) return;
  [here, ...roads].forEach(tl => {
    const x = ox + tl.star[0], y = oy + tl.star[1], tw = 0.8 + 0.2 * Math.sin(t * 2 + tl.star[0]);
    drawHomeStar(x, y, tl === here ? 0.8 : 1 + 0.12 * Math.sin(t * 3), tl === here ? 0.6 : tw);
    ctx.fillStyle = tl === here ? 'rgba(255,230,170,0.5)' : 'rgba(255,230,170,0.9)'; ctx.font = '11px Space Mono, monospace'; ctx.textAlign = 'center';
    ctx.fillText(tl === here ? 'right overhead' : tl.label, x, y - 18);
  });
}

// on top of the lens: arrows toward other telescopes' stars, the travel prompt, rae's words, the starlight rush
function drawSkyExtrasHud(cx, cy, R, ox, oy) {
  ctx.save();
  ctx.textAlign = 'center'; ctx.font = '12px Space Mono, monospace';
  const roads = skyRoads();
  if (!roads.length && skyRoadsPossible().length && !sky.road) {   // a sky road is here, but there's no chart to read it by
    ctx.fillStyle = 'rgba(236,224,190,0.85)';
    ctx.fillText("there's a sky road here, but you need nova's star chart to find it.", cx, cy + R * 0.62);
    ctx.font = '10px Space Mono, monospace'; ctx.fillStyle = 'rgba(236,224,190,0.6)';
    ctx.fillText('nova, at the observatory on the hill, gives it for charting her four constellations.', cx, cy + R * 0.62 + 16);
  }
  if (roads.length && !sky.road) {
    if (!skyClear()) {
      ctx.fillStyle = 'rgba(236,224,190,0.85)';
      ctx.fillText('no sky roads through this. come back when the sky clears.', cx, cy + R * 0.62);
    } else {
      roads.forEach(tl => {
        const dx = ox + tl.star[0] - cx, dy = oy + tl.star[1] - cy, d = Math.hypot(dx, dy);
        if (d < R - 24) return;
        // off the edge of the lens: a little gold arrow on the rim pointing at it
        const ux = dx / d, uy = dy / d, ax = cx + ux * (R - 18), ay = cy + uy * (R - 18);
        ctx.fillStyle = 'rgba(255,225,150,0.9)';
        ctx.beginPath(); ctx.moveTo(ax + ux * 9, ay + uy * 9); ctx.lineTo(ax - uy * 6 - ux * 3, ay + ux * 6 - uy * 3); ctx.lineTo(ax + uy * 6 - ux * 3, ay - ux * 6 - uy * 3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,230,170,0.85)'; ctx.font = '10px Space Mono, monospace';
        ctx.fillText(tl.label, ax - ux * 26, ay - uy * 26 + 4);
      });
      const to = aimedRoad();
      if (to) {
        const msg = touchMode ? `tap travel to step along the starlight → ${to.label}` : `press E to step along the starlight → ${to.label}`;
        ctx.font = '13px Space Mono, monospace';
        const w = ctx.measureText(msg).width + 28;
        ctx.fillStyle = 'rgba(10,12,20,0.7)'; ctx.fillRect(cx - w / 2, cy + R * 0.6 - 17, w, 26);
        ctx.fillStyle = `rgba(255,232,170,${0.8 + 0.2 * Math.sin(tick * 0.12)})`;
        ctx.fillText(msg, cx, cy + R * 0.6);
      }
    }
  }
  // what rae is saying, beside you
  if (sky.captionT > 0 && sky.caption && !sky.road) {
    ctx.globalAlpha = Math.min(1, sky.captionT / 30);
    ctx.font = '13px Space Mono, monospace'; ctx.fillStyle = 'rgba(250,215,175,0.95)';
    ctx.fillText(sky.caption, cx, Math.max(22, cy - R - 22));
    ctx.globalAlpha = 1;
  }
  // stepping along the starlight: streaks rush out of the star, then everything goes bright
  if (sky.road) {
    const r = sky.road, k = Math.min(1, r.t / 70);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
    for (let i = 0; i < 70; i++) {
      const an = i * 2.39996, sp = 0.5 + hash(i * 1.7) * 0.8, ux = Math.cos(an), uy = Math.sin(an);
      const d = (hash(i * 3.1) * R + r.t * r.t * 0.12 * sp) % R, len = 6 + k * 70 * sp;
      ctx.strokeStyle = `rgba(255,${Math.round(225 + 25 * hash(i))},${Math.round(170 + 70 * hash(i * 2))},${0.25 + 0.6 * k})`; ctx.lineWidth = 1 + k * 1.5;
      ctx.beginPath(); ctx.moveTo(cx + ux * d, cy + uy * d); ctx.lineTo(cx + ux * (d + len), cy + uy * (d + len)); ctx.stroke();
    }
    drawGlow(cx, cy, 30 + k * R, 0.3 + k * 0.6, [255, 236, 190]);
    if (k > 0.55) { ctx.fillStyle = `rgba(255,250,235,${(k - 0.55) / 0.45 * 0.9})`; ctx.fillRect(cx - R, cy - R, R * 2, R * 2); }
  }
  ctx.restore();
}

// the HUD line under the lens, while looking from rae's telescope
function skyScopeHud() {
  const here = hereScope();
  if (!here || here.id !== 'island') return null;
  return (touchMode ? 'drag to look around' : 'arrow keys to look around · E to step back') + (ISLAND_CONS.some(c => c.found) ? ' · charted: ' + ISLAND_CONS.filter(c => c.found).map(c => c.name).join(', ') : ' · rae is watching');
}

// outside, holding the chart: the island's page shows up in the real sky too
function drawChartSkyExtras() {
  if (!wearing('chart')) return;
  const found = ISLAND_CONS.filter(c => c.found);
  if (!found.length) return;
  ctx.save();
  found.forEach(C => {
    const ox = W * 0.92 - (C === RAE_BOARD ? 70 : 0), oy = H * 0.26 + (C === RAE_BOARD ? 100 : 0), k = 0.45;
    const p = ([x, y]) => [ox + (x - C.cx) * k, oy + (y - C.cy) * k];
    ctx.strokeStyle = 'rgba(180,225,255,0.22)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); C.lines.forEach(([i, j]) => { ctx.moveTo(...p(C.stars[i])); ctx.lineTo(...p(C.stars[j])); }); ctx.stroke();
    C.stars.forEach((st, i) => { const [x, y] = p(st), top = C === LONG_WAVE && i === 5; ctx.fillStyle = top ? 'rgba(255,230,160,0.9)' : 'rgba(240,245,255,0.8)'; ctx.beginPath(); ctx.arc(x, y, top ? 2 : 1.4, 0, 7); ctx.fill(); });
    ctx.fillStyle = 'rgba(200,220,255,0.35)'; ctx.font = '9px Space Mono, monospace'; ctx.textAlign = 'center';
    ctx.fillText(C.name, ox, oy + (C === LONG_WAVE ? 46 : 36));
  });
  ctx.restore();
}

/* ── saving: the board's progress (save.js has no idea; see SAVE_EXTRA there). old saves just don't have the key ── */
(window.SAVE_EXTRA = window.SAVE_EXTRA || []).push({
  key: 'board',
  get: () => ({ found: RAE_BOARD.found, progress: Math.round(RAE_BOARD.progress * 1000) / 1000, hint: !!sky.boardHint }),
  set: v => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return;
    if (typeof v.found === 'boolean') RAE_BOARD.found = v.found;
    if (typeof v.progress === 'number' && isFinite(v.progress)) RAE_BOARD.progress = Math.max(0, Math.min(1, v.progress));
    if (typeof v.hint === 'boolean') sky.boardHint = v.hint;
  },
});
