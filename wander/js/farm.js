/* ══════════════════════════════════════════
   RAE'S FARM — phase 2 of the island (see the layout notes in skycharts.js)
   · after the telescope quest, rae admits she's always wanted to grow something.
     quest "something to grow": marigold sells a packet of rain-pea seeds and a
     sack of real soil (the island is all sand). spread the soil on the strip
     past her hut (15705–15940, between the two palms), plant a seed in each bed,
     and wait. there's nothing to water by hand: every distinct SHOWER (rain or
     thunderstorm) advances every planted bed one stage:
         0 seed → 1 sprout → 2 leafy → 3 ripe (harvest it)
     a shower counts once when the rain blend rises past FARM_WET_ON and
     re-arms only after it dries below FARM_WET_OFF (so a long rain, or rain
     melting into a storm, is still one shower). it counts wherever you are.
     harvesting gives rain peas and saves a seed, so you can replant forever.
   · birch's surprise porch: talk to him on the island a few times, he lets it
     slip and asks you to keep rae busy; talk to her, and a few seconds later
     the porch is up on her hut. rae's reaction follows.
   · a little shed, rain barrel, fence and sign appear with the beds.
   All persistent state lives in `farm` (plain data). Transient visuals: farmFx.
   Hooks: OUT_SPOTS (unshift), shopRows, talkToRae, talkToMarigold, talkToBirch,
   updateWeather (the rain latch), updateSkyCharts (visuals), drawIslandBack.
══════════════════════════════════════════ */
const FARM_PLOTS = [15744, 15784, 15826, 15866];   // raised beds, between the palms at 15690 and 15960
const FARM_WET_ON = 0.45, FARM_WET_OFF = 0.08;
const FARM_DRY_HINT = 60 * 240;                    // frames of no rain (with something growing) before a nudge
const FARM_SHED_X = 15903, FARM_BARREL_X = 15930, FARM_SIGN_X = 15712;
const FARM_X0 = 15705, FARM_X1 = 15940;             // the strip the soil goes on

const farm = {
  rae: 0,                      // 0 unasked · 1 first line said · 2 quest given
  beds: false,                 // soil spread (beds, shed, fence exist)
  plots: [-1, -1, -1, -1],     // per bed: -1 bare soil · 0 seed · 1 sprout · 2 leafy · 3 ripe
  seeds: 0, peas: 0,           // what you carry
  showers: 0, wet: false,      // showers counted · the rain latch (true until it dries)
  dry: 0, hinted: false,       // frames since the last shower (while something's growing) · nudge given
  harvests: 0, fed: 0, li: 0,  // harvests · peas rae has eaten · talk counter
  firstPending: false,         // first harvest not yet reacted to by rae
  birch: 0,                    // talks with birch on the island
  porchT: 0,                   // frames of "keeping rae busy" left (0 = not started)
  porch: 0,                    // 0 none · 1 built · 2 rae exclaimed · 3 reaction told
};
const farmFx = { pop: [0, 0, 0, 0], puffs: [], sparks: [], wet: 0, barrel: 0.25, porchK: undefined, shedK: undefined };

/* ── registrations ── */
Object.assign(ITEMS, {
  seeds: { name: 'a packet of rain-pea seeds', desc: "they grow when it rains. that's the whole instruction on the packet.", wearable: false },
  soil:  { name: 'a sack of dark soil',        desc: "real soil, for an island made of sand. spread it on the strip past rae's hut.", wearable: false },
  peas:  { name: 'rain peas',                  desc: 'small, sweet, and a little proud of themselves. rae grew these. you helped. the rain did most of it.', wearable: false },
});
ITEM_ORDER.push('seeds', 'soil', 'peas');
Object.assign(ITEM_ART, {
  seeds: (w, h) => {
    ctx.fillStyle = '#d9c28a'; ctx.strokeStyle = 'rgba(120,90,50,0.9)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(w / 2 - 12, h / 2 - 14); ctx.lineTo(w / 2 + 12, h / 2 - 14); ctx.lineTo(w / 2 + 13, h / 2 + 15); ctx.lineTo(w / 2 - 13, h / 2 + 15); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6fa24c'; ctx.beginPath(); ctx.ellipse(w / 2 - 3, h / 2 - 2, 5, 2.4, -0.6, 0, 7); ctx.ellipse(w / 2 + 3, h / 2 - 5, 5, 2.4, 0.6, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3f6b36'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(w / 2, h / 2 + 7); ctx.lineTo(w / 2, h / 2 - 3); ctx.stroke();
    ctx.fillStyle = 'rgba(120,90,50,0.9)'; [[-6, 11], [0, 12], [6, 11]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(w / 2 + dx, h / 2 + dy, 1.4, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#c9ae72'; ctx.fillRect(w / 2 - 12, h / 2 - 14, 24, 3);
  },
  soil: (w, h) => {
    ctx.fillStyle = '#7a5a3a'; ctx.strokeStyle = 'rgba(60,40,24,0.9)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(w / 2 - 14, h / 2 + 15); ctx.quadraticCurveTo(w / 2 - 19, h / 2 - 2, w / 2 - 9, h / 2 - 10); ctx.lineTo(w / 2 + 9, h / 2 - 10); ctx.quadraticCurveTo(w / 2 + 19, h / 2 - 2, w / 2 + 14, h / 2 + 15); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a3420'; ctx.beginPath(); ctx.ellipse(w / 2, h / 2 - 11, 11, 4, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#2a1c10'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(w / 2 - 8, h / 2 - 7); ctx.lineTo(w / 2 + 8, h / 2 - 7); ctx.stroke();
    ctx.fillStyle = '#4a3420'; [[-3, -16], [3, -18], [0, -20]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(w / 2 + dx, h / 2 + dy + 6, 2, 0, 7); ctx.fill(); });
    ctx.strokeStyle = 'rgba(200,170,120,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w / 2 - 10, h / 2 + 4); ctx.lineTo(w / 2 + 10, h / 2 + 7); ctx.stroke();
  },
  peas: (w, h) => {
    [[-6, 2, -0.5], [5, -3, 0.35]].forEach(([dx, dy, a]) => {
      ctx.save(); ctx.translate(w / 2 + dx, h / 2 + dy); ctx.rotate(a);
      ctx.fillStyle = '#a9d36e'; ctx.strokeStyle = '#4f7a3c'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.ellipse(0, 0, 6, 16, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d4eb9a'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(0, i * 7, 3, 0, 7); ctx.fill(); }
      ctx.restore();
    });
    ctx.strokeStyle = '#3f6b36'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(w / 2 - 6, h / 2 - 14); ctx.quadraticCurveTo(w / 2 - 2, h / 2 - 20, w / 2 + 2, h / 2 - 17); ctx.stroke();
  },
});
Object.assign(QUESTS, {
  farm: { giver: 'rae', title: 'something to grow', desc: "rae's island is all sand and rain. get a packet of seeds and a sack of soil from marigold's, spread the soil on the strip past rae's hut, plant the seeds, and wait for the rain." },
});
Object.assign(ACHIEVEMENTS, {
  greenthumb:  { name: 'green thumbs',   desc: "harvest something that grew on rae's island." },
  surpriseporch: { name: 'surprise porch', desc: 'help birch build rae a porch without ruining it.' },
});

/* ── helpers ── */
const farmNear = x => scene === 'outside' && Math.abs(player.wx - x) < 20 && player.onGround;
const plotNear = () => FARM_PLOTS.findIndex(farmNear);
const farmWanted = () => ({
  soil:  farm.rae >= 2 && !farm.beds && !hasItem('soil'),
  seeds: farm.rae >= 2 && farm.seeds === 0 && farm.plots.every(p => p < 0),
});
const growing = () => farm.plots.some(p => p >= 0 && p < 3);
function raeReact(text) { if (rae.ashore && Math.abs(player.wx - rae.x) < 520 && !talkHeld()) say(rae, text, false); }
// the bag shows how many seeds / peas you have in the item names
function farmNames() {
  ITEMS.seeds.name = farm.seeds > 1 ? `rain-pea seeds ×${farm.seeds}` : farm.seeds === 1 ? 'a rain-pea seed' : 'a packet of rain-pea seeds';
  ITEMS.peas.name = farm.peas > 1 ? `rain peas ×${farm.peas}` : 'a rain pea';
}
function farmAfterLoad() { farmNames(); }   // called by save.js after it restores `farm`
function setSeeds(n) {
  farm.seeds = Math.max(0, n);
  farmNames();
  if (!farm.seeds) takeItem('seeds'); else if (!hasItem('seeds')) give('seeds');
  else { renderMenu(); updateCarryHud(); }
}
function setPeas(d) {
  farm.peas = Math.max(0, farm.peas + d);
  farmNames();
  if (!farm.peas) takeItem('peas'); else if (!hasItem('peas')) give('peas', 'rae');
  else { ensureArt(); if (d > 0) notify('item', ITEMS.peas.name, ART.items.peas); renderMenu(); updateCarryHud(); }
}
function farmPuff(x, y, n, dark) {
  for (let i = 0; i < n; i++) farmFx.puffs.push({ x: x + rand(-14, 14), y: y - rand(0, 6), vx: rand(-0.7, 0.7), vy: rand(-1.3, -0.3), life: 1, dark });
}
function farmSpark(x, y, n) {
  for (let i = 0; i < n; i++) farmFx.sparks.push({ x: x + rand(-8, 8), y: y - rand(4, 30), vy: rand(-0.7, -0.2), life: rand(0.7, 1.1) });
}

/* ══════════════════════════════════════════
   THE RAIN LATCH — a shower counts once
══════════════════════════════════════════ */
function farmShower() {
  farm.showers++; farm.dry = 0; farm.hinted = false;
  let any = false;
  farm.plots.forEach((p, i) => {
    if (p >= 0 && p < 3) { farm.plots[i] = p + 1; farmFx.pop[i] = 1; any = true; farmSpark(FARM_PLOTS[i], groundY(FARM_PLOTS[i]), 6); }
  });
  if (any && scene === 'outside' && player.wx > 14900)
    showHint(farm.plots.some(p => p === 3) ? "the rain sank in. something's ready out on rae's strip." : 'the rain sank in. something stirred in the beds.', 3600);
}
function farmRain() {
  const a = weather.amt, wet = Math.min(1, (a.rain || 0) + (a.storm || 0));
  farmFx.wet = wet;
  if (!farm.wet && wet >= FARM_WET_ON) { farm.wet = true; farmShower(); }
  else if (farm.wet && wet < FARM_WET_OFF) farm.wet = false;
  if (!farm.wet && growing()) {
    if (++farm.dry >= FARM_DRY_HINT && !farm.hinted && scene === 'outside' && player.wx > 14900) {
      farm.hinted = true;
      showHint("it hasn't rained in a bit. nothing to do but wait. rae is very good at waiting.", 5200);
    }
  }
}
const _updateWeather = updateWeather;
updateWeather = function () { _updateWeather(); farmRain(); };

/* ══════════════════════════════════════════
   THINGS YOU DO
══════════════════════════════════════════ */
function spreadSoil() {
  takeItem('soil'); farm.beds = true; farm.plots = [-1, -1, -1, -1];
  FARM_PLOTS.forEach(x => farmPuff(x, groundY(x), 8, true));
  showHint('four beds of real soil, on an island of sand', 3400);
  setTimeout(() => raeReact("those are BEDS. i've slept in a hammock my whole life and the peas get beds before i do. …i'm fine with that. also there's a shed now? i found driftwood. i didn't ask the shed."), 2200);
}
function plantAt(i) {
  farm.plots[i] = 0; farm.dry = 0; farm.hinted = false;
  setSeeds(farm.seeds - 1);
  farmPuff(FARM_PLOTS[i], groundY(FARM_PLOTS[i]), 5, true);
  if (!farm.plots.some((p, j) => j !== i && p >= 0) && farm.harvests === 0) showHint("planted. nothing to water by hand: it grows when it rains", 4200);
}
const RAE_HARVEST = [
  "peas! look at them. little green rafts. …is it weird that i want to name one?",
  "another one! the rain does all the work and we take all the credit. it's fine. the rain doesn't mind.",
  "that's the good kind of heavy. a pod full of tomorrow.",
];
function harvestAt(i) {
  farm.plots[i] = -1; farm.harvests++;
  setPeas(2); setSeeds(farm.seeds + 1);   // two peas, and one saved for next time
  farmPuff(FARM_PLOTS[i], groundY(FARM_PLOTS[i]) - 10, 7, false); farmSpark(FARM_PLOTS[i], groundY(FARM_PLOTS[i]), 8);
  if (farm.harvests === 1) {
    completeQuest('farm'); achieve('greenthumb');
    if (rae.ashore && Math.abs(player.wx - rae.x) < 520) { farm.firstPending = false; raeReact("…is that a PEA? that came out of the ground? i did that? we did that? the rain did that? okay. everybody did that. it's the best day i've had on this island, and i've had a wave with a hat in it."); }
    else farm.firstPending = true;
  } else raeReact(RAE_HARVEST[farm.harvests % RAE_HARVEST.length]);
}
function stageLabel(s) {
  return ['a seed, tucked in. waiting on rain.', 'a sprout. very small, very green. waiting on rain.', 'leafy, and getting bossy about it. one more shower.'][s];
}
OUT_SPOTS.unshift(() => {
  if (scene !== 'outside' || player.wx < 15500 || player.wx > 15990) return null;
  if (rae.ashore && Math.abs(player.wx - rae.x) < 45) return null;   // (rae's E comes first when she's standing right here)
  if (farm.porch >= 1 && Math.abs(player.wx - HUT_X) < 55) return { text: "rae's hut. there's a porch now, with a chair and a lantern and a great many feelings." };
  if (!farm.beds) {
    if (player.wx > FARM_X0 && player.wx < FARM_X1) {
      if (hasItem('soil')) return { text: 'press E to spread the soil', act: spreadSoil };
      if (questState.farm === 'open') return { text: "rae's saving this strip. it wants soil, and seeds. marigold's has both." };
    }
    return null;
  }
  if (Math.abs(player.wx - FARM_SHED_X) < 18) return { text: "a shed. rae built it from driftwood and confidence. there's a rake in there. she doesn't know what it's for." };
  if (Math.abs(player.wx - FARM_BARREL_X) < 12) return { text: 'a rain barrel. it fills when it rains. so does everything else, to be fair.' };
  if (Math.abs(player.wx - FARM_SIGN_X) < 14) return { text: 'a little sign: "peas". under it, smaller: "(hopefully)".' };
  const i = plotNear();
  if (i < 0) return null;
  const s = farm.plots[i];
  if (s === 3) return { text: 'press E to pick the peas', act: () => harvestAt(i) };
  if (s >= 0) return { text: stageLabel(s) };
  if (hasItem('seeds')) return { text: 'press E to plant a seed', act: () => plantAt(i) };
  return { text: 'a bed of dark soil. it wants a seed.' };
});

/* ══════════════════════════════════════════
   THE PORCH
══════════════════════════════════════════ */
function raeKeepBusy() { return farm.birch >= 3 && farm.porch === 0 && questState.bonfire === 'done'; }
function buildPorch() {
  farm.porch = 1; farm.porchT = 0; farmFx.porchK = 0;
  for (let i = 0; i < 26; i++) farmPuff(HUT_X + rand(-40, 40), groundY(HUT_X), 1, false);
  showHint('tap tap tap… something new at rae\'s hut', 4200);
}

/* ══════════════════════════════════════════
   DIALOGUE — rae, marigold, birch (wrapping their talk functions)
══════════════════════════════════════════ */
function raePorchLines() {
  if (farm.porch === 1 || farm.porch === 2) {
    farm.porch = 3; achieve('surpriseporch');
    return ["…wait. why does my hut have a PORCH. who put a porch on my hut? i was gone for ten minutes. you were talking about buttons.",
      "it has a floor. and a lantern! and a chair. …birch. it's birch. nobody else measures things like that. i'm going to sit on it for a week. i'm going to sit on it so hard."];
  }
  return null;
}
function raeFarmLine() {
  const g = growing(), ripe = farm.plots.some(p => p === 3), top = Math.max(-1, ...farm.plots);
  if (farm.rae === 0 && questState.skyscope === 'done') {
    farm.rae = 1;
    return ["can i tell you a thing? since the telescope i keep looking up. but then i look down, and it's all sand. i've always wanted to grow something. just one something."];
  }
  if (farm.rae === 1) { farm.rae = 2; startQuest('farm'); return ["birch says the mainland has seeds, and dirt in sacks, from a store. the island's only got sand and rain. …the rain's reliable, at least. maybe that's enough? marigold's, by the tavern. tell her it's for peas. i've decided on peas. they sound like a thing that would like rain."]; }
  if (farm.rae < 2) return null;
  if (farm.firstPending) { farm.firstPending = false; return ["is that a PEA?! that came out of the ground? i did that? we did that? the rain did that? okay. everyone did that. best day on this island, and i've had a wave with a hat in it."]; }
  if (farm.peas > 0 && farm.harvests > 0) {
    setPeas(-1); farm.fed++;
    return [["…can i have one? i'll have one. oh. oh, it's SWEET. it tastes like the rain smells.", "just one! okay, one more. no — one. i'm being very disciplined.", "i keep thinking about the first pea. i ate the first pea. it was a good pea. a good, brave pea."][Math.min(2, farm.fed - 1)]];
  }
  if (questState.farm === 'open' && !farm.beds) {
    const s = hasItem('soil'), p = hasItem('seeds');
    if (s && p) return ["spread the soil first, out on the strip past my hut. then plant. in that order. i asked a crab."];
    if (s) return ["real soil! put it down on the strip past my hut, between the palms. i've been guarding the spot from crabs. the crabs are unconvinced."];
    if (p) return ["seeds! now the soil. no soil, no peas. i think that's the whole rule of peas."];
    return ["seeds and a sack of soil, from marigold's. one gold nugget each, i think. i don't know what a nugget is. i have shells."];
  }
  if (farm.beds && farm.plots.every(p => p < 0) && farm.seeds === 0 && farm.harvests === 0) return ["the beds are ready. now we need seeds. marigold's, remember? i'd go myself but there's a storm in the way. it's a very good storm."];
  if (farm.beds && farm.plots.every(p => p < 0) && farm.harvests === 0) return ["a seed in each bed. then we wait for rain. i'm very good at waiting. ask the waves."];
  if (g || ripe) {
    if (ripe) return ["they're READY. pick them! gently. like a wave you respect."];
    if (farm.dry > 60 * 60) return ["it hasn't rained in a bit. i've been asking nicely. i don't know who i'm asking."];
    return [["nothing yet. it's okay. seeds are shy.", "it's UP. it's a sprout. it's very small and very green and i love it.", "it's getting leafy. it's being bossy about it. one more rain, i think."][Math.max(0, Math.min(2, top))]];
  }
  if (farm.harvests > 0) return [["plant them again! the rain doesn't mind who it grows.", "the strip looks so good. a farm! i have a farm. i say it out loud sometimes. to the hammock."][Math.floor(Math.random() * 2)]];
  return null;
}
const _talkToRae = talkToRae;
talkToRae = function () {
  // the porch comes first, then the farm; anything else falls through to her usual lines
  const busy = questState.bonfire === 'done' && !surf.toast && questState.skyscope !== 'open';
  let lines = null;
  if (busy && farm.porch >= 1 && farm.porch < 3) lines = raePorchLines();
  else if (busy && raeKeepBusy() && !farm.porchT) {
    farm.porchT = 60 * 7;
    lines = ["oh, hi! you're standing very still. are you guarding something? i love it when people guard things. tell me about the mainland. any of it. start with the buttons."];
  } else if (busy && farm.porchT > 0) lines = ["keep going! the buttons! i want to know how many buttons there are. i have only ever had one button and it was a limpet."];
  else if (questState.skyscope === 'done' && !surf.toast && (questState.farm !== 'done' || farm.peas > 0 || farm.firstPending || farm.li++ % 2 === 0)) lines = raeFarmLine();
  if (!lines) { _talkToRae(); return; }
  const rest = lines.slice(1);
  say(rae, lines[0], true, { next: rest.length ? () => say(rae, rest[0], true) : farm.rae === 1 && (() => talkToRae()) });
};

const _talkToMarigold = talkToMarigold;
talkToMarigold = function () {
  const w = farmWanted();
  if (!marigold.greeted || !(w.soil || w.seeds)) { _talkToMarigold(); return; }
  const gold = inv.gold || 0;
  let line, more = false;
  if (w.soil) {
    line = gold ? sell('soil', "soil! a whole sack of the dark, crumbly kind. sand's no good for growing, dear, it just lets things go. one nugget. it's heavier than it looks. i'd know. i carried it.")
                : "soil's one gold nugget, dear. for rae's island? she'll want it. the old miners left plenty of gold under the hill, so the moles say.";
    more = !!gold && !hasItem('seeds') && farm.seeds === 0;
  } else line = gold ? sell('seeds', "rain peas! the packet says they grow when it rains. that's the whole instruction. one nugget. i'd say good luck but i think the rain's in charge.")
                     : "seeds are one gold nugget, dear. the shovel finds a few, in the meadows. and the old mine finds the rest.";
  say(marigold, line, true, { next: more && (() => { say(marigold, "and seeds, of course, for the soil to have something to do. one more nugget, if you've got it.", true); }) });
};

const _shopRows = shopRows;
shopRows = function () {
  const rows = _shopRows(), w = farmWanted(), mine = [];
  if (w.soil) mine.push({ kind: 'ware', id: 'soil', price: 1, say: "soil! the dark, crumbly kind. sand lets things go, dear. soil holds on. it's carried a lot." });
  if (w.seeds) mine.push({ kind: 'ware', id: 'seeds', price: 1, say: "rain peas. they grow when it rains. that's the whole instruction, and honestly, that's most of gardening." });
  return mine.concat(rows);
};

const _talkToBirch = talkToBirch;
const BIRCH_PORCH = [
  "she's sat on it every evening. she thinks i don't see. i see. i'm a beaver. we see everything. mostly sticks.",
  "a porch is just a floor that believes in itself. that's what my grandmother said. she was also a beaver.",
  "whenever you want to go back, hop in. the maybe's ready. i'll be here, admiring the porch from a distance.",
];
talkToBirch = function () {
  if (boat.side === 'island' && !boat.ride && birch.stage >= BIRCH_INTRO.length && boat.crossed) {
    farm.birch++;
    if (farm.birch === 3 && farm.porch === 0) {
      say(birch, "psst. okay. the porch is happening. today. i need rae busy for a little while, so go talk to her. about anything. waves. buttons. do not look at her hut. i can tell you're going to look at her hut.", true);
      return;
    }
    if (farm.porch >= 1) { say(birch, BIRCH_PORCH[farm.birch % 3], true); return; }
  }
  _talkToBirch();
};

/* ══════════════════════════════════════════
   UPDATE
══════════════════════════════════════════ */
const _updateSkyCharts = updateSkyCharts;
updateSkyCharts = function () {
  _updateSkyCharts();
  // a bought packet opens into four seeds
  if (hasItem('seeds') && farm.seeds === 0) setSeeds(4);
  // keeping rae busy → the porch goes up while you're on the island
  if (farm.porchT > 0 && scene === 'outside' && player.wx > 14900 && --farm.porchT === 0) buildPorch();
  // rae notices the porch on her own if you're near
  if (farm.porch === 1 && rae.ashore && scene === 'outside' && Math.abs(player.wx - rae.x) < 380 && Math.abs(player.wx - HUT_X) < 700) {
    farmFx.notice = (farmFx.notice || 0) + 1;
    if (farmFx.notice > 150) { farm.porch = 2; say(rae, "…is that a PORCH? on my hut? who — when — i was right here!", false); }
  }
  // transient visuals
  for (let i = 0; i < 4; i++) if (farmFx.pop[i] > 0) farmFx.pop[i] = Math.max(0, farmFx.pop[i] - 0.025);
  if (farmFx.porchK !== undefined && farmFx.porchK < 1) farmFx.porchK = Math.min(1, farmFx.porchK + 0.012);
  farmFx.barrel += ((farm.wet ? 1 : 0) * 0.0009 - 0.00006) * (farmFx.barrel < 0.95 ? 1 : 0.2); farmFx.barrel = Math.max(0.2, Math.min(1, farmFx.barrel));
  for (let i = farmFx.puffs.length - 1; i >= 0; i--) { const p = farmFx.puffs[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.life -= 0.03; if (p.life <= 0) farmFx.puffs.splice(i, 1); }
  for (let i = farmFx.sparks.length - 1; i >= 0; i--) { const p = farmFx.sparks[i]; p.y += p.vy; p.life -= 0.012; if (p.life <= 0) farmFx.sparks.splice(i, 1); }
};

/* ══════════════════════════════════════════
   DRAW
══════════════════════════════════════════ */
function drawPeaPlant(x, gy, s, i) {
  const wetK = farmFx.wet, sway = Math.sin(tick * 0.03 + x) * 1.1 + weather.wind * 1.4;
  const pop = farmFx.pop[i] || 0, sc = 1 + 0.28 * Math.sin(pop * Math.PI);
  ctx.save(); ctx.translate(x, gy); ctx.scale(sc, sc);
  const G1 = '#3f6b36', G2 = '#6fa24c', G3 = '#9bc86a';
  const leaf = (lx, ly, rx, ry, a, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(lx, ly, rx, ry, a, 0, 7); ctx.fill(); };
  if (s === 0) {
    ctx.fillStyle = '#c9b48a'; ctx.beginPath(); ctx.ellipse(0, -3.5, 2.2, 1.5, 0.3, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(8, -1); ctx.lineTo(8, -11); ctx.stroke();   // a marker stick
    ctx.fillStyle = '#d9c28a'; ctx.fillRect(5.5, -14, 5, 4);
  } else {
    const h = s === 1 ? 10 : s === 2 ? 22 : 29, sx = sway * h / 30;
    if (s >= 2) {   // a stake and twine
      ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-5 + sway * 0.2, -h - 6); ctx.stroke();
      ctx.strokeStyle = 'rgba(220,205,170,0.6)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-5, -h * 0.5); ctx.lineTo(sx, -h * 0.55); ctx.moveTo(-5, -h * 0.85); ctx.lineTo(sx, -h * 0.9); ctx.stroke();
    }
    ctx.strokeStyle = G1; ctx.lineWidth = s === 1 ? 1.6 : 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -1); ctx.quadraticCurveTo(sx * 0.3 + 1, -h * 0.5, sx, -h); ctx.stroke();
    if (s === 1) { leaf(sx - 3.5, -h + 1, 4.2, 2.1, -0.5, G2); leaf(sx + 3.5, -h - 1, 4.2, 2.1, 0.5, G3); }
    else {
      const n = s === 2 ? 3 : 4;
      for (let k = 0; k < n; k++) {
        const t = (k + 1) / (n + 0.3), ly = -h * t, lx = sx * t, d = k % 2 ? 1 : -1;
        leaf(lx + d * 5, ly + 1, 5.2, 2.5, d * -0.45, k % 2 ? G3 : G2);
        leaf(lx - d * 4, ly - 3, 4.4, 2.1, d * 0.4, G2);
      }
      leaf(sx, -h - 2, 3.4, 2, 1.2, G3);
      ctx.strokeStyle = G2; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(sx, -h); ctx.quadraticCurveTo(sx + 4, -h - 7, sx + 7, -h - 3); ctx.stroke();   // a curling tendril
    }
    if (s === 3) {
      // pods hanging off the stems, a few white-pink blossoms, and a quiet shimmer: ready
      [[0.45, -1], [0.62, 1], [0.8, -1]].forEach(([t, d], k) => {
        const px = sx * t + d * 6, py = -h * t + 2;
        ctx.save(); ctx.translate(px, py); ctx.rotate(d * 0.25 + Math.sin(tick * 0.04 + k) * 0.05);
        ctx.fillStyle = '#a9d36e'; ctx.strokeStyle = '#4f7a3c'; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.ellipse(0, 4, 2.6, 6.5, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#d4eb9a'; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.arc(0, 1 + q * 3, 1.1, 0, 7); ctx.fill(); }
        ctx.restore();
      });
      ctx.fillStyle = '#f6e8f0'; [[sx + 2, -h - 3], [sx - 3, -h + 1]].forEach(([fx, fy]) => { ctx.beginPath(); ctx.arc(fx, fy, 1.8, 0, 7); ctx.fill(); });
      drawGlow(sx * 0.5, -h * 0.55, 20, 0.1 + 0.07 * Math.sin(tick * 0.07 + x), [210, 240, 150]);
    }
  }
  ctx.restore();
}

function drawFarmPorch(hx, hg, k) {
  const e = 1 - Math.pow(1 - k, 3);   // eased reveal
  const W2 = (HUT_HW + 16) * e, post = (HUT_H - 22) * e, pe = HUT_HW + 14;   // (sized to the hut: island.js HUT_HW / HUT_H)
  const ey = hg - HUT_H + 8;                                                   // the hut's thatch eave; the awning tucks in just below
  ctx.save();
  // the deck
  ctx.fillStyle = '#7a5a3a'; ctx.fillRect(hx - W2, hg - 7, W2 * 2, 7);
  ctx.fillStyle = '#5a4026'; ctx.fillRect(hx - W2, hg - 2, W2 * 2, 2);
  ctx.strokeStyle = 'rgba(40,26,14,0.55)'; ctx.lineWidth = 1;
  for (let x = -W2 + 11; x < W2; x += 11) { ctx.beginPath(); ctx.moveTo(hx + x, hg - 7); ctx.lineTo(hx + x, hg - 2); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(210,180,130,0.35)'; ctx.beginPath(); ctx.moveTo(hx - W2, hg - 6.5); ctx.lineTo(hx + W2, hg - 6.5); ctx.stroke();
  // a step down on the right
  if (e > 0.6) { ctx.fillStyle = '#6a4c2c'; ctx.fillRect(hx + pe + 2, hg - 3.5, 9, 3.5); }
  if (e > 0.25) {
    // posts and a thatch lean-to awning below the roof edge
    ctx.fillStyle = '#5a4026'; ctx.fillRect(hx - pe - 2, hg - 7 - post, 4, post); ctx.fillRect(hx + pe - 2, hg - 7 - post, 4, post);
    if (e > 0.7) {
      ctx.fillStyle = '#4a5a30';
      ctx.beginPath(); ctx.moveTo(hx - pe - 10, ey); ctx.lineTo(hx + pe + 10, ey); ctx.lineTo(hx + pe + 4, ey + 12); ctx.lineTo(hx - pe - 4, ey + 12); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(30,40,20,0.6)'; ctx.lineWidth = 1;
      for (let i = -7; i <= 7; i++) { ctx.beginPath(); ctx.moveTo(hx + i * 11, ey); ctx.lineTo(hx + i * 11 + i * 0.4, ey + 12); ctx.stroke(); }
      ctx.fillStyle = '#5a4026'; ctx.fillRect(hx - pe - 2, ey + 12, pe * 2 + 4, 3);
      // low rails, open at the door
      ctx.strokeStyle = '#6a4c2c'; ctx.lineWidth = 2;
      [[-pe + 2, -24], [26, pe - 2]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(hx + a, hg - 22); ctx.lineTo(hx + b, hg - 22); ctx.stroke(); });
      ctx.lineWidth = 1.2; for (let x = -pe + 8; x <= pe - 8; x += 8) { if (x > -24 && x < 26) continue; ctx.beginPath(); ctx.moveTo(hx + x, hg - 22); ctx.lineTo(hx + x, hg - 7); ctx.stroke(); }
      // a lantern, a doormat, and a chair that's been sat in
      ctx.strokeStyle = 'rgba(160,130,90,0.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx - 42, ey + 14); ctx.lineTo(hx - 42, hg - 47); ctx.stroke();
      ctx.fillStyle = '#4a3420'; ctx.fillRect(hx - 45, hg - 47, 6, 2); ctx.fillRect(hx - 45, hg - 37, 6, 2);
      const fl = 0.85 + Math.sin(tick * 0.11) * 0.08;
      ctx.fillStyle = `rgba(255,205,130,${0.9 * fl})`; ctx.fillRect(hx - 44, hg - 45, 4, 8);
      drawGlow(hx - 42, hg - 41, 52, 0.2 * fl, [255, 190, 110]);
      ctx.fillStyle = '#9a6a4a'; ctx.fillRect(hx - 14, hg - 9, 28, 2);
      ctx.strokeStyle = '#6a4c2c'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(hx + 52, hg - 7); ctx.lineTo(hx + 52, hg - 16); ctx.lineTo(hx + 64, hg - 16); ctx.lineTo(hx + 64, hg - 7); ctx.moveTo(hx + 52, hg - 16); ctx.lineTo(hx + 51, hg - 31); ctx.stroke();
      ctx.fillStyle = 'rgba(210,90,70,0.8)'; ctx.fillRect(hx + 52, hg - 18, 12, 2.5);   // a cushion
    }
  }
  ctx.restore();
}

function drawFarmShed(sx, gy, k) {
  // a little driftwood shed with a lean-to roof, a rake, a bucket
  ctx.save();
  ctx.fillStyle = '#4a3c2c'; ctx.fillRect(sx - 14, gy - 32, 28, 32);
  ctx.strokeStyle = 'rgba(150,130,100,0.4)'; ctx.lineWidth = 1;
  for (let y = gy - 27; y < gy; y += 7) { ctx.beginPath(); ctx.moveTo(sx - 14, y); ctx.lineTo(sx + 14, y + (y % 2)); ctx.stroke(); }
  ctx.fillStyle = '#2a2014'; ctx.fillRect(sx - 5, gy - 22, 10, 22);
  ctx.fillStyle = 'rgba(255,200,130,0.4)'; ctx.fillRect(sx + 7, gy - 26, 5, 5);
  ctx.fillStyle = '#4a5a30';
  ctx.beginPath(); ctx.moveTo(sx - 19, gy - 31); ctx.lineTo(sx + 17, gy - 40); ctx.lineTo(sx + 19, gy - 30); ctx.lineTo(sx - 17, gy - 29); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(30,40,20,0.6)'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(sx + i * 5, gy - 36 + i * -0.4); ctx.lineTo(sx + i * 5, gy - 30); ctx.stroke(); }
  ctx.strokeStyle = '#6a4c2c'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(sx - 18, gy); ctx.lineTo(sx - 15, gy - 26); ctx.stroke();   // the rake
  ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx - 19, gy - 27); ctx.lineTo(sx - 12, gy - 28); ctx.stroke();
  ctx.restore();
}
function drawFarmBarrel(bx, gy) {
  ctx.save();
  ctx.fillStyle = '#5a4026'; ctx.beginPath(); ctx.moveTo(bx - 7, gy); ctx.lineTo(bx - 8, gy - 20); ctx.lineTo(bx + 8, gy - 20); ctx.lineTo(bx + 7, gy); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(30,20,10,0.8)'; ctx.lineWidth = 1.4; [-14, -5].forEach(y => { ctx.beginPath(); ctx.moveTo(bx - 8, gy + y); ctx.lineTo(bx + 8, gy + y); ctx.stroke(); });
  const lv = farmFx.barrel;
  ctx.fillStyle = '#3a2a1c'; ctx.beginPath(); ctx.ellipse(bx, gy - 20, 8, 2.4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(110,170,200,0.85)'; ctx.beginPath(); ctx.ellipse(bx, gy - 20 - (1 - lv) * 3.5 + 0.5, 6.5, 1.6, 0, 0, 7); ctx.fill();
  ctx.restore();
}

function drawFarm() {
  if (scene !== 'outside' || camX + W < 15500 || camX > 16050) return;
  const ox = -camX;
  ctx.save();
  // the porch, on the hut
  if (farm.porch >= 1) {
    if (farmFx.porchK === undefined) farmFx.porchK = 1;
    drawFarmPorch(ox + HUT_X, groundY(HUT_X), farmFx.porchK);
  }
  if (farm.beds) {
    const wet = farmFx.wet;
    const sg = groundY(FARM_SIGN_X);
    ctx.strokeStyle = '#5a4026'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox + FARM_SIGN_X, sg); ctx.lineTo(ox + FARM_SIGN_X, sg - 24); ctx.stroke();
    ctx.fillStyle = '#9a7a52'; ctx.fillRect(ox + FARM_SIGN_X - 11, sg - 30, 22, 11);
    ctx.fillStyle = '#3a2a1c'; ctx.font = '7px Space Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('peas', ox + FARM_SIGN_X, sg - 22);
    drawFarmShed(ox + FARM_SHED_X, groundY(FARM_SHED_X));
    drawFarmBarrel(ox + FARM_BARREL_X, groundY(FARM_BARREL_X));
    // the beds: raised boxes of driftwood planks, tilled dark soil heaped inside (darker when wet), then whatever's growing
    FARM_PLOTS.forEach((px, i) => {
      const gy = groundY(px), x = ox + px, s = farm.plots[i], BW = 18, top = gy - 9;
      const soil = wet > 0.3 ? '#2e2016' : '#4a3420', soil2 = wet > 0.3 ? '#241810' : '#3a2814', soil3 = wet > 0.3 ? '#3a2a1c' : '#5e4630';
      // the far plank, behind the soil
      ctx.fillStyle = '#6a4c2c'; ctx.fillRect(x - BW, gy - 13, BW * 2, 4);
      // the soil: a low mound above the rim, with furrows running along it and some crumbs
      ctx.fillStyle = soil; ctx.beginPath(); ctx.moveTo(x - BW + 1, top + 1); ctx.quadraticCurveTo(x, top - 7, x + BW - 1, top + 1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = soil2; ctx.lineWidth = 1.2;
      for (let r = 0; r < 3; r++) { const yy = top - r * 1.8; ctx.beginPath(); ctx.moveTo(x - BW + 3 + r * 2, yy); ctx.quadraticCurveTo(x, yy - 1.5, x + BW - 3 - r * 2, yy); ctx.stroke(); }
      ctx.fillStyle = soil3; for (let c = 0; c < 9; c++) { const cx = x - BW + 4 + hash(px + c * 1.7) * (BW * 2 - 8), cy = top - 1 - hash(px * 0.3 + c * 3.1) * 3.4; ctx.fillRect(cx, cy, 1.4, 1); }
      // the front plank, with grain and a nail at each end, and a corner post at each side
      ctx.fillStyle = '#7a5a36'; ctx.fillRect(x - BW, top + 1, BW * 2, 8);
      ctx.fillStyle = '#6a4c2c'; ctx.fillRect(x - BW, top + 5, BW * 2, 4);
      ctx.strokeStyle = 'rgba(40,26,14,0.55)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x - BW, top + 5); ctx.lineTo(x + BW, top + 5); ctx.moveTo(x - BW + 6, top + 3); ctx.lineTo(x - 2, top + 3.4); ctx.moveTo(x + 4, top + 7.5); ctx.lineTo(x + BW - 5, top + 7); ctx.stroke();
      ctx.fillStyle = '#4a3420'; ctx.fillRect(x - BW - 2, gy - 15, 3.5, 15); ctx.fillRect(x + BW - 1.5, gy - 15, 3.5, 15);
      ctx.fillStyle = 'rgba(210,190,150,0.7)'; ctx.fillRect(x - BW + 3, top + 3, 1.2, 1.2); ctx.fillRect(x + BW - 4, top + 3, 1.2, 1.2);
      if (wet > 0.2) {   // raindrops ringing on the soil
        for (let r = 0; r < 2; r++) {
          const ph = (tick * 0.04 + i * 0.37 + r * 0.5) % 1;
          ctx.strokeStyle = `rgba(190,215,230,${(1 - ph) * 0.55 * wet})`; ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.ellipse(x + (r ? 7 : -6), top - 1, 1 + ph * 4, 0.5 + ph * 1.2, 0, 0, 7); ctx.stroke();
        }
      }
      if (s >= 0) drawPeaPlant(x, top - 2, s, i);
    });
  }
  farmFx.puffs.forEach(p => { ctx.fillStyle = p.dark ? `rgba(70,50,32,${p.life * 0.8})` : `rgba(225,210,175,${p.life * 0.6})`; ctx.beginPath(); ctx.arc(ox + p.x, p.y, 1.6 + (1 - p.life) * 2.6, 0, 7); ctx.fill(); });
  farmFx.sparks.forEach(p => {
    const a = Math.min(1, p.life) * (0.6 + 0.4 * Math.sin(tick * 0.3 + p.x)), x = ox + p.x;
    ctx.fillStyle = `rgba(215,240,150,${a})`; ctx.fillRect(x - 0.6, p.y - 2, 1.2, 4); ctx.fillRect(x - 2, p.y - 0.6, 4, 1.2);
  });
  ctx.restore();
}
const _drawIslandBack = drawIslandBack;
drawIslandBack = function () { _drawIslandBack(); drawFarm(); };
