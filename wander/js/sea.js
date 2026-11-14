/* ══════════════════════════════════════════
   THE SEA — wade in and swim (same controls as the lake: hold ↓ to dive,
   hold jump to swim up, the same breath meter; the fishbowl helmet works too).
   · the bay (mainland side): sandy shallows, then a coral shelf with a little
     community on it, and ollie the octopus, who gardens it.
   · the reef city (island side): a big tiered reef stepping down from the
     surf to a sheer drop. the reef crest is what breaks the swell into the
     island's surf. towers of coral lit by glowing polyps, an arch, eels,
     seahorses, jellyfish, turtles, a ray, crabs, and lots of fish — the
     deeper tiers need umber's helmet. shelves of reef jut out over the
     tiers (solid: swim under them, land on them — see shelfCollide), with
     little flats tucked underneath. a big bait ball turns over the city.
     it is a long city, east to west: the crest + night market under the crest shelf, the garden row,
     the arcade and the long hall (market terrace), the schoolyard, and at the far west end the school.
   · the reef school (two stories + a bell tower) sits on the school ledge: miss coralie (a seahorse) and
     her class. quests: the school bell (shelby the hermit crab has moved
     into it, and wants a conch instead) and headcount (nib the octopus is
     hiding under the deep ledge — swim him back to class).
   · both reefs end at a drop into the open sea. a net is strung across each
     drop, and each net's one gap is guarded by a pufferfish: bart on the
     mainland side, his sister bea on the island side. nobody swims through.
══════════════════════════════════════════ */
const SEA_NET_X = 11510, ISLE_NET_X = 13340, REEF_X = 14470;
const CORAL_X0 = 10640, CORAL_X1 = 11480, CITY_X0 = 13370, CITY_X1 = 14560;
const sea = { ripples: [], splashes: [], bubbles: [], fish: [], warnT: 0, puff: { bart: 0, bea: 0 }, swimmers: [] };

const ollie = makeRegular({ name: 'ollie', kind: 'octopus', color: '#d890a8', x: 10980 });
const bart  = makeRegular({ name: 'bart',  kind: 'puffer',  color: '#d8c070', x: SEA_NET_X - 26 });
const bea   = makeRegular({ name: 'bea',   kind: 'puffer',  color: '#9ad0c0', x: ISLE_NET_X + 26 });
const GUARDS = [{ n: bart, netX: SEA_NET_X, side: -1 }, { n: bea, netX: ISLE_NET_X, side: 1 }];
// each guard floats right in the net's gap (gap0..gap1 in drawSeaNet), body centered whether puffed or not.
// drawCritter('puffer') draws the body (r + 4) * scale above the feet, r = 9 + 9 * puffed
const GUARD_K = 1.2, GAP0 = 112, GAP1 = 190;
const guardPuff = g => Math.min(1, sea.puff[g.n.name] / 30);
const guardCY = g => seaY() + (GAP0 + GAP1) / 2 + Math.sin(tick * 0.03 + (g.side > 0 ? 2 : 0)) * (5 - 2.5 * guardPuff(g));   // body center
const guardR = g => (9 + 9 * guardPuff(g) + 2 + 4 * guardPuff(g)) * GUARD_K;                                                     // body + spikes
const guardY = g => guardCY(g) + (13 + 9 * guardPuff(g)) * GUARD_K;                                                               // feet (for drawCritter)
OUT_TALKERS.push({ n: ollie, at: () => [ollie.x, groundY(ollie.x) - 60] });
GUARDS.forEach(g => OUT_TALKERS.push({ n: g.n, at: () => [g.n.x, guardCY(g) - guardR(g) - 8] }));

/* ── coral, built once ── */
const CORAL_COLS = [[230, 120, 140], [240, 170, 110], [170, 130, 220], [120, 200, 190], [240, 210, 120], [250, 140, 100], [140, 170, 240]];
function makeCorals(x0, x1, n, seed, big) {
  return Array.from({ length: n }, (_, i) => {
    const x = x0 + 10 + (i + hash(i * 3.7 + seed) * 0.8) * (x1 - x0 - 20) / n;
    return { x, kind: ['branch', 'brain', 'fan', 'tube', 'branch', 'anemone', 'fan'][Math.floor(hash(i * 1.3 + seed) * 7)],
             s: (0.7 + hash(i * 5.1 + seed) * 0.8) * (big ? 1.35 : 1), col: CORAL_COLS[(i + seed) % CORAL_COLS.length], ph: hash(i + seed) * 6 };
  });
}
const CORALS = makeCorals(CORAL_X0, CORAL_X1, 46, 0).filter(c => Math.abs(c.x - ollie.x) > 30);
const CITY_CORALS = makeCorals(CITY_X0, CITY_X1, 150, 17, true).filter(c => Math.abs(c.x - 13478) > 26 && Math.abs(c.x - 13700) > 30 && !(c.x > 14100 && c.x < 14122));   // room for nib + shelby
const STARS_SEA = [10760, 10890, 11170, 11330, 13400, 13700, 13930, 14120, 14290, 14440].map((x, i) => ({ x, r: 0.4 + i * 0.37, col: ['#e88a70', '#e8b070', '#d870a0', '#e88a70'][i % 4] }));
// the city skyline: coral towers on the tiers + shelves, windows lit by glowing polyps. on: the depth they stand on (else the seabed)
const TOWERS = [
  { x: 13460, on: 440, h: 170, w: 28 }, { x: 13502, on: 440, h: 240, w: 36 },     // far west: up on the high shelf, by the drop
  { x: 13442, h: 70, w: 26 }, { x: 13515, h: 56, w: 22 }, { x: 13385, h: 120, w: 30 },   // little flats under the deep ledge, a tall one by the shaft
  { x: 13640, h: 56, w: 22 }, { x: 13790, h: 60, w: 22 },                           // flats under the school ledge
  { x: 13897, h: 150, w: 24 },                                                      // the schoolyard's lookout tower, at the top of the wall
  { x: 14010, h: 52, w: 22 }, { x: 14064, h: 58, w: 22 },                           // flats under the long hall
  { x: 14100, h: 190, w: 30 },                                                      // the hall's tall neighbor
  { x: 14160, h: 46, w: 20 },                                                       // flats under the arcade
  { x: 14205, h: 210, w: 30 }, { x: 14228, on: 200, h: 90, w: 22 },                  // the market gate, and up on the crest shelf
  { x: 14338, h: 50, w: 20 },                                                       // more flats, under the crest shelf
].map((t, i) => Object.assign(t, { col: CORAL_COLS[(i * 3) % CORAL_COLS.length], eel: i % 3 === 1 }));
const towerBase = t => (t.on != null ? seaY() + t.on : groundY(t.x)) + 4;
const ARCH = { x0: 14255, x1: 14335, on: 200 };   // stands on the crest shelf

/* ── overhangs: solid shelves of reef (depths below the surface). swim under them, land on them, but you
   can't swim up through them (shelfCollide). every one opens to the LEFT — toward the drop — and the
   water between the net and the shelves is a clear shaft from the surface to the very bottom. ── */
const SHELVES = [
  { x0: 13430, x1: 13580, top: 610, bot: 648 },                // the deep ledge, off the second tier: a dark nook under it
  { x0: 13420, x1: 13550, top: 440, bot: 474 },                // the high shelf, stacked on the deep ledge…
  { x0: 13526, x1: 13550, top: 474, bot: 610, pillar: true },  // …on a coral pillar
  { x0: 13590, x1: 13915, top: 400, bot: 438 },                // the school ledge, off the third tier: the school stands on it
  { x0: 13985, x1: 14080, top: 195, bot: 225 },                // the long hall: a roof of reef over the market terrace, on a middle pillar…
  { x0: 14030, x1: 14046, top: 225, bot: 345, pillar: true },  // …so there are two bays, one open each way
  { x0: 14120, x1: 14185, top: 205, bot: 235 },                // the arcade, with its own pillar
  { x0: 14167, x1: 14185, top: 235, bot: 350, pillar: true },
  { x0: 14215, x1: 14400, top: 200, bot: 232 },                // the crest shelf, off the reef crest, over the market
];
const inShelf = (x, d, m) => SHELVES.some(b => x > b.x0 - m && x < b.x1 + m && d > b.top - m && d < b.bot + m);
// coral growing on the shelves (by = the depth it stands on)
const SHELF_CORALS = [
  ...makeCorals(13422, 13495, 6, 31).map(c => Object.assign(c, { by: 440, s: c.s * 0.85 })),
  ...makeCorals(13436, 13520, 5, 43).map(c => Object.assign(c, { by: 610, s: c.s * 0.7 })),
  ...makeCorals(13840, 13880, 3, 61).map(c => Object.assign(c, { by: 400, s: c.s * 0.7 })),
  ...makeCorals(13990, 14076, 6, 53).map(c => Object.assign(c, { by: 195, s: c.s * 0.8 })),
  ...makeCorals(14124, 14182, 4, 71).map(c => Object.assign(c, { by: 205, s: c.s * 0.75 })),
  ...makeCorals(14222, 14250, 2, 83).map(c => Object.assign(c, { by: 200, s: c.s * 0.8 })),
  ...makeCorals(14340, 14396, 3, 89).map(c => Object.assign(c, { by: 200, s: c.s * 0.8 })),
];

/* ── things that live down there ── */
function addFish(lo, hi, n, seed, homeFn, colFn, schools) {
  for (let i = 0; i < n; i++) {
    const school = i < schools * 8 ? Math.floor(i / 8) : -1;
    const home = homeFn(i, school);
    sea.fish.push({
      lo, hi, school: school >= 0 ? school + seed : -1, x: lo + hash(i * 9.1 + seed) * (hi - lo), d: home, home,
      vx: (hash(i * 6.6 + seed) < 0.5 ? -1 : 1) * (0.4 + hash(i * 3.9 + seed) * 0.4), ph: hash(i + seed) * 6, dart: 0,
      k: school >= 0 ? 0.45 : 0.6 + hash(i * 1.1 + seed) * 0.5, deep: home > 450, tall: school < 0 && hash(i * 2.7 + seed) < 0.3,
      col: colFn(i, school),
    });
  }
}
const FISH_COLS = [[230, 170, 90], [160, 200, 220], [220, 130, 120], [200, 210, 150], [190, 150, 230], [250, 220, 120], [120, 220, 200]];
addFish(10500, SEA_NET_X - 30, 36, 0, (i, s) => s >= 0 ? 70 + s * 45 : 40 + hash(i * 2.2) * 170, (i, s) => s >= 0 ? FISH_COLS[s] : FISH_COLS[i % 5], 3);
addFish(CITY_X0, CITY_X1, 120, 10, (i, s) => s >= 0 ? 80 + s * 100 : 60 + hash(i * 2.2) * 520, (i, s) => s >= 0 ? FISH_COLS[(s + 3) % 7] : FISH_COLS[i % 7], 6);
// drifting and gliding things in the reef city (jellies bob around y0, clear of the shelves)
const CITY_LIFE = [
  ...[[13385, 330], [13480, 525], [13590, 60], [13690, 490], [13800, 230], [13960, 160], [14060, 110], [14170, 120], [14320, 60], [14420, 80], [14230, 120]].map(([x, y0], i) => ({ kind: 'jelly', x, y0, y: y0, ph: i * 1.3, col: [[200, 160, 240], [160, 220, 240], [240, 170, 200]][i % 3] })),
  { kind: 'turtle', x: 13700, y: 140, vx: 0.35 }, { kind: 'turtle', x: 14300, y: 90, vx: -0.25 }, { kind: 'turtle', x: 13950, y: 60, vx: 0.2 },
  { kind: 'ray', x: 14000, y: 105, vx: 0.5, hi: 14180 },
  ...[13380, 13760, 13950, 14110, 14240, 14330, 14480].map((x, i) => ({ kind: 'seahorse', x, ph: i * 2, col: [[240, 190, 90], [240, 140, 150], [150, 210, 190], [220, 180, 240]][i % 4] })),
  ...[13470, 13770, 13940, 14070, 14150, 14400, 14520].map((x, i) => ({ kind: 'crab', x, ph: i * 1.7 })),
  ...[13400, 13720, 13945, 14040, 14172, 14250, 14450].map((x, i) => ({ kind: 'urchin', x, s: 0.8 + (i % 4) * 0.15 })),
];
// the bait ball: one big school of little silver fish, slowly turning over the city. it parts around you
const SWARM = { x: 13740, d: 95, fish: Array.from({ length: 92 }, (_, i) => {
  const a = hash(i * 4.3 + 50) * 6.283, r = 8 + Math.sqrt(hash(i * 7.7 + 50)) * 50;
  return { a, r, x: 13740 + Math.cos(a) * r * 1.5, d: 95 + Math.sin(a) * r * 0.75, ph: hash(i * 2.9 + 50) * 6, k: 0.3 + hash(i * 1.9 + 50) * 0.14, dir: 1 };
}) };

/* ── who's nearby ── */
const underSea = () => scene === 'outside' && player.inWater;
function nearOllie() { return underSea() && Math.abs(player.wx - ollie.x) < 60 && player._py > seaY() + 100; }
function nearGuard() { return underSea() && player._py > seaY() + 40 ? GUARDS.find(g => g.side < 0 ? player.wx > g.netX - 90 && player.wx < g.netX : player.wx < g.netX + 90 && player.wx > g.netX) : null; }

const OLLIE_LINES = [
  "welcome to the reef! wipe your feet. well — you can't really wipe anything down here. welcome anyway!",
  "i garden. that's brain coral, that's fan coral, and that's gerald. gerald is a rock. he's doing his best.",
  "everyone on the reef knows everyone. it's a small reef. everybody knows your business. i love it.",
  "don't mind bart at the net. he's grumpy because he cares. mostly he's grumpy.",
  'i have three hearts. two of them like you already. the third takes a while.',
  "there's a reef across the sea, they say, ten times this one. a whole city. i'm not jealous. i'm a little jealous.",
];
const GUARD_LINES = {
  bart: [
    'halt. HALT. who goes there. …a mouse. halt anyway.',
    "past this net is open water. big currents, bigger fish. nobody goes through. nobody's ALLOWED through. i'm the nobody-allowed-through fish.",
    "i'm not puffed up. this is my regular size. it's the water. it's very cold.",
    "rules are rules. you want to cross the sea, you get a boat. a good one. and a better reason than 'i wanted to see'.",
  ],
  bea: [
    "halt! oh — you're the one who came on the boat. still: halt. it's tradition.",
    "past the net it's straight down. nobody knows how far. i dropped a pebble once. i'm still listening.",
    "the surf up top? that's us. the reef breaks the swell into nice tidy waves. rae thinks they're a gift from the sea. they're a gift from US.",
    "my brother guards the net on the other side. we haven't spoken in years. we wave, though. well. we puff.",
  ],
};
function talkToGuard(g) {
  const n = g.n, L = GUARD_LINES[n.name];
  let line;
  if (n === bart && boat.crossed && n.li >= L.length) line = ["you sailed it? through the storm? …huh. don't tell anyone i said this, but that's brave.", met.bea ? "you met bea? …is she well? does she still puff up when she's nervous? good. good." : 'still not letting you through. but brave.'][n.li++ % 2];
  else if (n === bea && met.bart && n.li >= L.length) line = ["you've met bart? …tell him the net on this side is very well kept. he'll know what i mean.", "he still says 'halt' twice? ha. he always did."][n.li++ % 2];
  else line = L[n.li++ % L.length];
  if (/puffed|nervous/.test(line)) sea.puff[n.name] = 160;
  say(n, line, true);
}

/* ══════════════════════════════════════════
   THE REEF SCHOOL — on the school ledge. miss coralie (a seahorse) and her class.
   · the school bell rolled off the ledge. shelby, a hermit crab underneath, has moved
     into it — he'll swap it for a proper conch (there's one under the high shelf).
   · then: headcount. nib (a very small octopus) is hiding in the dark nook under the
     deep ledge. talk him round, and he follows your path back up to class.
══════════════════════════════════════════ */
const SCHOOL_X = 13660, SCHOOL_D = 400, CORALIE_X = 13742, SHELBY_X = 13700, CONCH_X = 13472, NIB_HIDE_X = 13478, NIB_SEAT_X = 13816;
const coralie = makeRegular({ name: 'miss coralie', kind: 'seahorse', color: '#e0a878', x: CORALIE_X, stage: 0 });
const shelby  = makeRegular({ name: 'shelby', kind: 'hermit', color: '#d88068', x: SHELBY_X, stage: 0, shell: 'bell' });
const nib     = makeRegular({ name: 'nib', kind: 'octopus', color: '#b8a0e0', x: NIB_HIDE_X, d: null, stage: 0, follow: false, home: false, trail: [] });
const theClass = makeRegular({ name: 'the class', x: 13806 });
const nibY = () => nib.d == null ? groundY(nib.x) : seaY() + nib.d;      // his feet (on the seabed while he hides)
// the class, in two rows on coral stools, facing miss coralie. nib's seat stays empty till he's back
const STUDENTS = [
  { x: 13780, kind: 'crab', color: '#e8a080', k: 0.48, back: true }, { x: 13804, kind: 'puffer', color: '#f0d890', k: 0.5, back: true },
  { x: 13830, kind: 'seahorse', color: '#90d0c0', k: 0.55, back: true },
  { x: 13792, kind: 'tortoise', color: '#a8c890', k: 0.5 }, { x: NIB_SEAT_X, nib: true }, { x: 13842, kind: 'fish', color: '#f0b0c0', k: 0.5 },
];
// the schoolyard up on the terrace: kids at play around the gym, swing and slide (just for looks)
const YARD_KIDS = [{ x: 13921, kind: 'crab', color: '#e07a5a', k: 0.42 }, { x: 13950, kind: 'puffer', color: '#9ad0c0', k: 0.42 }, { x: 13969, kind: 'tortoise', color: '#a8c890', k: 0.4 }, { x: 13935, kind: 'octopus', color: '#d890a8', k: 0.4 }];
OUT_TALKERS.push({ n: coralie, at: () => [coralie.x, seaY() + SCHOOL_D - 62] });
OUT_TALKERS.push({ n: shelby, at: () => [shelby.x, groundY(shelby.x) - 34] });
OUT_TALKERS.push({ n: nib, at: () => [nib.x, nibY() - 34] });
OUT_TALKERS.push({ n: theClass, at: () => [theClass.x, seaY() + SCHOOL_D - 40] });

const near = (x, y, rx, ry) => underSea() && Math.abs(player.wx - x) < rx && Math.abs(player._py - y) < ry;
const nearCoralie = () => near(CORALIE_X, seaY() + SCHOOL_D, 40, 60);
const nearShelby  = () => near(shelby.x, groundY(shelby.x), 50, 60);
const nearConch   = () => !sea.conchTaken && near(CONCH_X, seaY() + 610, 40, 50);
const nearNib     = () => !nib.home && near(nib.x, nibY(), 50, 60);
const nearClass   = () => near(13806, seaY() + SCHOOL_D, 40, 60);

const CORALIE_INTRO = [
  "oh! a visitor! class, say hello. … class. CLASS. thank you. i'm miss coralie, and this is the reef school.",
  "we'd start the day properly, but the school bell rolled off the ledge this morning. now nobody knows when anything begins. we've had lunch three times.",
  "would you look for it? it went over the edge and under. everything down here ends up under something, eventually.",
];
const CORALIE_LINES = [
  "today's lesson is currents. tomorrow's lesson is also currents. it's a big subject down here.",
  'the bait ball goes over every morning at recess. the children try to count the fish. nobody has ever finished.',
  "you're welcome to sit in. we have a spare stool. well — it's a rock. we call it a stool.",
  "nib gave you a drawing? he's never given anyone a drawing. that's how you know.",
];
const SHELBY_INTRO = [
  'occupied! this bell is OCCUPIED. it came down off the ledge, it landed on me, i moved in. finders, dwellers. that is the law of the reef.',
  "it's a very good bell. i say 'hello' and the bell says 'hello' back, and that's two of us.",
  "…all right. it's roomy. and LOUD, when the turtles knock. find me a proper shell — a conch — and i'll move out. there's an empty one under the high shelf. nobody lives in it. i checked. i check everything.",
];
const SHELBY_LINES = [
  'the new place has a view. well, it has a hole. through the hole: a view.',
  "if you see the bell, say hello from me. it was a good bell. loud, but good.",
  "there's an upstairs. i don't go up there yet. i'm saving it.",
];
const NIB_LINES = {
  rock: ["…i'm not here. i'm a rock.", "rocks don't talk. …that was a rock noise.", '(a very small octopus, exactly the color of the rock, is watching you very hard.)'],
  follow: ["are we nearly there? we're nearly there. i can tell — it's getting lighter.", "you swim funny. good funny. don't go too fast.", 'i was very brave in there. mostly. some of the time.'],
  home: ['i sit at the front now. it is brighter at the front.', 'when i grow up i want to be a rock. no. a teacher. a rock teacher.', 'i counted the bait ball today. i got to eleven. then they moved.'],
};
const CLASS_LINES = [
  'is it lunch?', 'miss! miss! the mouse has no gills!', 'i can count to eleven. one, two, eleventeen.',
  "we're learning about the surface. it's where the sky starts.", "my mom says hi. she doesn't know you. she says hi anyway.",
];

function talkCoralie() {
  const n = coralie; let line;
  if (hasItem('bell')) {
    takeItem('bell'); completeQuest('schoolbell'); n.stage = CORALIE_INTRO.length;
    line = "our bell! listen — ding. class, that means it's morning. at last. and this is for you: a gold star. i only have a few, so it means something.";
    setTimeout(() => give('goldstar', 'miss coralie'), 900);
  } else if (n.stage < CORALIE_INTRO.length) {
    line = CORALIE_INTRO[n.stage++];
    if (n.stage === CORALIE_INTRO.length) startQuest('schoolbell');
  } else if (questState.schoolbell === 'open') line = "it went over the edge and under. i'd look myself, but seahorses swim about an inch an hour. we're not built for searching. we're built for waiting.";
  else if (!questState.nib) {
    line = "now. headcount. one, two, three, four, five… five? there should be six. NIB. he'll have wandered off in all the fuss, and now he'll be hiding. he hides when he's frightened. somewhere dark and low, i'd think.";
    startQuest('nib');
  } else if (questState.nib === 'open') line = nib.follow ? "is that — oh, NIB. bring him up onto the ledge, nice and slow. he likes the scenic route." : "nib's an octopus. he'll squeeze into the darkest nook he can find. try under the deep ledge, right down at the bottom.";
  else line = CORALIE_LINES[n.li++ % CORALIE_LINES.length];
  say(n, line, true);
}
function talkShelby() {
  const n = shelby; let line;
  if (n.shell === 'bell' && hasItem('conch')) {
    takeItem('conch'); n.shell = 'conch'; completeQuest('shelby');
    line = "oh. OH. look at the spiral on it. it has an UPSTAIRS. here — the bell's yours. tell the teacher i kept it polished. i didn't. but tell her.";
    setTimeout(() => give('bell', 'shelby'), 900);
  } else if (n.shell === 'bell') {
    if (n.stage < SHELBY_INTRO.length) { line = SHELBY_INTRO[n.stage++]; if (n.stage === SHELBY_INTRO.length) startQuest('shelby'); }
    else line = "a conch. big, pink inside, spirals the right way. it's under the high shelf, sitting on the deep ledge. i'd fetch it myself, but if i leave, someone moves in.";
  } else line = SHELBY_LINES[n.li++ % SHELBY_LINES.length];
  say(n, line, true);
}
function nibFollow() { nib.follow = true; nib.trail = []; if (nib.d == null) nib.d = groundY(nib.x) - seaY(); }
function talkNib() {
  let line;
  if (nib.follow) line = NIB_LINES.follow[nib.li++ % NIB_LINES.follow.length];
  else if (questState.nib === 'open') {
    if (nib.stage === 0) { nib.stage = 1; line = 'miss coralie sent you? …is she cross? the big fish ball went WHOOSH and i went under here, and then it was dark, and all the ways out looked the same.'; }
    else { line = "will you swim me back? stay close. not too fast. i'll follow your bubbles."; nibFollow(); }
  } else line = NIB_LINES.rock[nib.li++ % NIB_LINES.rock.length];
  say(nib, line, true);
}
// nib follows the path you actually swam (never through the rock), a little way behind
function updateNib() {
  const wy = seaY();
  if (nib.home) { nib.x += (NIB_SEAT_X - nib.x) * 0.06; nib.d += (SCHOOL_D - nib.d) * 0.06; return; }
  if (!nib.follow) { if (nib.d == null) nib.x = NIB_HIDE_X + Math.sin(tick * 0.01) * 3; return; }
  const T = nib.trail, last = T[T.length - 1], pd = player._py - wy;
  if (player.inWater && (!last || Math.hypot(last.x - player.wx, last.d - pd) > 5)) T.push({ x: player.wx, d: pd });
  if (T.length > 7) {
    const p = T[0], dx = p.x - nib.x, dd = p.d - nib.d, dist = Math.hypot(dx, dd);
    if (dist < 3) T.shift(); else { const v = Math.min(2.6, dist); nib.x += dx / dist * v; nib.d += dd / dist * v; }
  }
  if (Math.abs(nib.x - NIB_SEAT_X) < 80 && Math.abs(nib.d - SCHOOL_D) < 46) {   // back at school!
    nib.follow = false; nib.home = true; nib.trail = [];
    completeQuest('nib'); achieve('headcount');
    say(nib, "i'm back! miss coralie, i was a rock for a while. — this is for you. it's you. i drew it from memory.", true);
    setTimeout(() => give('drawing', 'nib'), 900);
    setTimeout(() => say(coralie, 'one, two, three, four, five — SIX. everyone. thank you. truly. class, what do we say? …CLASS.'), 4800);
  } else if (!player.inWater || T.length > 500 || Math.hypot(player.wx - nib.x, pd - nib.d) > 520) {
    nib.follow = false; nib.trail = [];   // you went too far: he waits right where he is
    say(nib, "i'll wait here! right here. being brave.");
  }
}

OUT_SPOTS.push(() => {
  if (!underSea()) return null;
  const g = nearGuard();
  if (g && g.n.bubbleT < 200) return { text: `press E to talk to ${g.n.name}`, act: () => talkToGuard(g) };
  if (nearOllie() && ollie.bubbleT < 200) return { text: 'press E to talk to ollie', act: () => say(ollie, OLLIE_LINES[ollie.li++ % OLLIE_LINES.length], true) };
  if (player.wx > CITY_X0 - 40 && player.wx < CITY_X1) {
    if (nearNib() && nib.bubbleT < 200) return { text: met.nib ? 'press E to talk to nib' : 'press E to talk to the rock', act: talkNib };
    if (nearConch()) return { text: 'press E to pick up the big empty shell', act: () => { sea.conchTaken = true; give('conch'); } };
    if (nearShelby() && shelby.bubbleT < 200) return { text: 'press E to talk to shelby', act: talkShelby };
    if (nearCoralie() && coralie.bubbleT < 200) return { text: 'press E to talk to miss coralie', act: talkCoralie };
    if (nearClass() && theClass.bubbleT < 200) return { text: 'press E to say hi to the class', act: () => say(theClass, questState.schoolbell === 'done' || Math.random() < 0.6 ? CLASS_LINES[theClass.li++ % CLASS_LINES.length] : "we've had lunch three times today.") };
    if (player._py > seaY() + 60) return { text: 'the reef city' };
  }
  return null;
});

/* ══════════════════════════════════════════
   UPDATE
══════════════════════════════════════════ */
const GUARD_SHOUTS = ['NOPE. no. absolutely not. back you go.', "hey! HEY! net's there for a reason!", "open water. dangerous. that's the whole speech."];
// keep swimmers out of the open sea: a net + a pufferfish on each side
function seaClamp() {
  if (scene !== 'outside' || player.riding || !player.inWater) { sea.lastX = null; return; }
  shelfCollide();
  GUARDS.forEach(g => {
    const past = g.side < 0 ? player.wx > g.netX - 12 && player.wx < 12600 : player.wx < g.netX + 12 && player.wx > 12600;
    if (!past) return;
    player.wx = g.side < 0 ? g.netX - 12 : g.netX + 12;
    _vx = g.side < 0 ? Math.min(0, _vx) - 0.5 : Math.max(0, _vx) + 0.5;
    if (sea.warnT <= 0) { sea.warnT = 300; sea.puff[g.n.name] = 120; achieve('puffed'); say(g.n, GUARD_SHOUTS[Math.floor(Math.random() * 3)]); }
  });
}

/* ── the shelves are solid: land on top, bump your head underneath, bump the ends from the side.
   resolved against the player's box (feet at _py, ~56s tall, ~10s each side of center), using where
   you were last tick to tell which face you came through. ── */
function shelfCollide() {
  const x0 = player.wx;
  if (x0 < CITY_X0 - 80 || x0 > CITY_X1) { sea.lastX = x0; return; }
  const s = playerScale(), hw = 10 * s, hh = 56 * s, wy = seaY();
  const px = sea.lastX == null || Math.abs(sea.lastX - x0) > 40 ? x0 : sea.lastX, py = player.prevPy;
  for (let pass = 0; pass < 2; pass++) SHELVES.forEach(b => {
    const L = b.x0 - hw, R = b.x1 + hw, T = wy + b.top, B = wy + b.bot + hh, x = player.wx, y = player._py;
    if (x <= L || x >= R || y <= T || y >= B) return;
    if (py <= T + 0.5) { player._py = T; if (player.vy > 0) player.vy = 0; }        // landed on top
    else if (py >= B - 0.5) { player._py = B; if (player.vy < 0) player.vy = 0; }   // head against the underside
    else if (px <= L + 0.5) { player.wx = L; if (_vx > 0) _vx = 0; }
    else if (px >= R - 0.5) { player.wx = R; if (_vx < 0) _vx = 0; }
    else {   // somehow inside (a teleport, a resize): out the shortest way
      const m = Math.min(y - T, B - y, x - L, R - x);
      if (m === y - T) player._py = T; else if (m === B - y) player._py = B; else if (m === x - L) player.wx = L; else player.wx = R;
    }
  });
  // never get wedged between a shelf and a rising seabed: if walking up the floor would push your head into rock, step back
  const g = groundY(player.wx);
  if (player.wx !== px && player._py >= g - 0.5 && groundY(px) > g &&
      SHELVES.some(b => player.wx > b.x0 - hw && player.wx < b.x1 + hw && g > wy + b.top && g - hh < wy + b.bot)) { player.wx = px; _vx = 0; }
  // standing on a shelf (or about to step onto one off the reef wall): the shelf is your floor, so don't let the
  // seabed's slope-sticking (updatePlayer) pull you down into it — a hair of upward speed switches that off
  if (player.vy >= 0 && SHELVES.some(b => player.wx > b.x0 - hw && player.wx < b.x1 + hw && player._py <= wy + b.top + 0.5 && g > wy + b.top && g - player._py < 17)) player.vy = -0.0001;
  // out of air with a shelf overhead: drift out to the nearest open water so you can still get up
  if (lake.surfacing && shelfAbove(player.wx, player._py - hh, hw, wy)) {
    let best = null;
    for (let dx = 8; dx < 500 && best == null; dx += 8) for (const d of [-1, 1]) {
      const x = player.wx + d * dx;
      if (x > CITY_X0 - 25 && x < CITY_X1 && !shelfAbove(x, player._py - hh, hw, wy) && groundY(x) > player._py - 4) { best = d; break; }
    }
    if (best != null) _vx = best * 2.4;
  }
  sea.lastX = player.wx;
}
const shelfAbove = (x, headY, hw, wy) => SHELVES.some(b => x > b.x0 - hw && x < b.x1 + hw && wy + b.bot <= headY + 2);

function updateSea() {
  if (sea.warnT > 0) sea.warnT--;
  for (const k in sea.puff) if (sea.puff[k] > 0) sea.puff[k]--;
  if (lake.deepHintT > 0 && scene === 'outside') lake.deepHintT--;
  const g = nearGuard();
  if (g && sea.puff[g.n.name] < 40 && Math.abs(_vx) > 1.5 && Math.abs(player.wx - g.netX) < 60) { sea.puff[g.n.name] = 120; achieve('puffed'); }
  ollie.x = 10980 + Math.sin(tick * 0.008) * 24;
  GUARDS.forEach(q => q.n.x = q.netX + 7 + Math.sin(tick * 0.02 + q.side) * 2);   // right in the hole (the net is 14 wide)
  const wy = seaY(), s = playerScale();
  if (lake.under && scene === 'outside' && tick % 24 === 0) puffBubbles(1);
  const nearCity = camX + W > CITY_X0 - 200 && camX < CITY_X1 + 200, nearBay = camX + W > CORAL_X0 && camX < CORAL_X1 + 200;
  if (Math.random() < 0.04 && nearBay) { const x = rand(CORAL_X0, CORAL_X1); sea.bubbles.push({ x, y: groundY(x) - 6, r: rand(1, 2.5), ph: rand(0, 6) }); }
  if (Math.random() < 0.08 && nearCity) { const t = TOWERS[Math.floor(Math.random() * TOWERS.length)]; sea.bubbles.push({ x: t.x + rand(-6, 6), y: towerBase(t) - t.h, r: rand(1, 2.5), ph: rand(0, 6) }); }
  for (let i = sea.bubbles.length - 1; i >= 0; i--) {
    const b = sea.bubbles[i]; b.y -= 0.6 + b.r * 0.25; b.ph += 0.1; b.x += Math.sin(b.ph) * 0.3;
    if (b.y <= wy) { sea.bubbles.splice(i, 1); if (Math.random() < 0.3) sea.ripples.push({ x: b.x, r: 1, life: 0.6 }); }
    else if (b.x > CITY_X0 && b.x < CITY_X1 && inShelf(b.x, b.y - wy, 0)) sea.bubbles.splice(i, 1);   // caught under a shelf
  }
  for (let i = sea.ripples.length - 1; i >= 0; i--) { const r = sea.ripples[i]; r.r += 0.4; r.life -= 0.02; if (r.life <= 0) sea.ripples.splice(i, 1); }
  for (let i = sea.splashes.length - 1; i >= 0; i--) { const p = sea.splashes[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= 0.04; if (p.life <= 0) sea.splashes.splice(i, 1); }
  // fish: schools swim together, everyone scatters if you swim close
  const pcx = player.wx, pcy = player._py - 30 * s, lead = {};
  sea.fish.forEach(f => {
    if (f.x < camX - 900 || f.x > camX + W + 900) return;   // only the fish nearby
    f.ph += 0.03; f.dart *= 0.95;
    if (f.school >= 0 && lead[f.school]) { const L = lead[f.school]; f.vx += (L.vx - f.vx) * 0.05; f.x += (L.x + ((f.ph * 10) % 30) - 15 - f.x) * 0.01; }
    else if (f.school >= 0) lead[f.school] = f;
    const city = f.lo >= CITY_X0, nx = f.x + f.vx * (1 + f.dart * 2);
    if (city && inShelf(nx, f.d, 8)) f.vx = -f.vx; else f.x = nx;           // turn back at the shelves…
    const floorD = groundY(f.x) - wy - 12;
    const want = Math.max(16, Math.min(floorD, f.home + Math.sin(f.ph) * 14)), nd = f.d + (want - f.d) * 0.05;
    if (!city || !inShelf(f.x, nd, 8)) f.d = nd;                             // …and don't swim up or down into them
    if (city && inShelf(f.x, f.d, 8)) { const b = SHELVES.find(b => f.x > b.x0 - 8 && f.x < b.x1 + 8 && f.d > b.top - 8 && f.d < b.bot + 8); f.d = f.d < (b.top + b.bot) / 2 ? b.top - 9 : b.bot + 9; }
    if (f.x < f.lo || f.x > f.hi || floorD < 20) { f.vx = -f.vx; f.x += f.vx * 3; }
    if (player.inWater) { const dx = f.x - pcx, dy = wy + f.d - pcy; if (dx * dx + dy * dy < 70 * 70) { f.vx = Math.sign(dx || 1) * Math.abs(f.vx); f.dart = 1; } }
  });
  if (nearCity) CITY_LIFE.forEach(c => {
    if (c.vx) { c.x += c.vx; if (c.x < CITY_X0 + 20 || c.x > (c.hi || CITY_X1 - 20)) c.vx = -c.vx; }
    if (c.kind === 'jelly') { c.ph += 0.03; c.y = c.y0 + Math.sin(c.ph * 0.5) * 22; }
  });
  updateNib();
  // the bait ball: turns slowly in a figure-eight over the city; the fish make room around you
  if (nearCity) {
    const t = tick * 0.0035, pd = player._py - 30 * s - wy, px = player.wx;
    SWARM.x = 13740 + Math.sin(t) * 120; SWARM.d = 95 + Math.sin(t * 2) * 28;
    SWARM.fish.forEach(f => {
      f.a += f.r < 30 ? 0.016 : 0.011;
      let tx = SWARM.x + Math.cos(f.a) * f.r * 1.5, td = SWARM.d + Math.sin(f.a) * f.r * 0.75 + Math.sin(tick * 0.05 + f.ph) * 2;
      if (player.inWater) { const dx = tx - px, dy = td - pd, dd = Math.hypot(dx, dy); if (dd < 78) { const k = (78 - dd) / (dd || 1); tx += dx * k; td += dy * k; } }
      const ox = f.x; f.x += (tx - f.x) * 0.08; f.d += (td - f.d) * 0.08;
      if (Math.abs(f.x - ox) > 0.04) f.dir = f.x > ox ? 1 : -1;
    });
  }
}

/* ══════════════════════════════════════════
   DRAW
══════════════════════════════════════════ */
function seaShape(top) {
  const x0 = Math.max(SEA_X0, camX - 20), x1 = Math.min(SEA_X1, camX + W + 20), ox = -camX;
  if (x1 <= x0) return false;
  ctx.beginPath(); ctx.moveTo(ox + x0, top(x0));
  for (let x = x0; x <= x1; x += 8) ctx.lineTo(ox + x, top(x));
  ctx.lineTo(ox + x1, top(x1));
  for (let x = x1; x >= x0; x -= 8) ctx.lineTo(ox + x, Math.max(top(x), groundY(x)));
  ctx.lineTo(ox + x0, Math.max(top(x0), groundY(x0)));
  ctx.closePath();
  return true;
}
function drawSeaBack() {
  const wy = seaY(), ox = -camX;
  if (!seaShape(waveY)) return;
  const g = ctx.createLinearGradient(0, wy, 0, wy + 1200);
  g.addColorStop(0, 'rgba(26,70,100,0.88)'); g.addColorStop(0.2, 'rgba(14,44,72,0.93)'); g.addColorStop(1, 'rgba(3,8,20,0.98)');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); seaShape(waveY); ctx.clip();
  // moonlight falling through the water
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(camX / 300) * 300 + i * 300 - 600 + Math.sin(tick * 0.004 + i) * 30;
    const lg = ctx.createLinearGradient(0, wy, 0, wy + 360);
    lg.addColorStop(0, 'rgba(160,210,230,0.07)'); lg.addColorStop(1, 'rgba(160,210,230,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(ox + x, wy); ctx.lineTo(ox + x + 50, wy); ctx.lineTo(ox + x + 140, wy + 360); ctx.lineTo(ox + x + 40, wy + 360); ctx.closePath(); ctx.fill();
  }
  // the deep past each net: darkness
  [[SEA_NET_X, 1], [ISLE_NET_X, -1]].forEach(([nx, d]) => {
    if (nx - camX < -500 || nx - camX > W + 500) return;
    const dg = ctx.createLinearGradient(ox + nx, 0, ox + nx + 400 * d, 0);
    dg.addColorStop(0, 'rgba(2,6,14,0)'); dg.addColorStop(1, 'rgba(2,6,14,0.55)');
    ctx.fillStyle = dg; ctx.fillRect(d > 0 ? ox + nx : -10, wy, d > 0 ? W - ox - nx + 40 : ox + nx + 10, 1600);
  });
  if (camX + W > CORAL_X0 - 50 && camX < SEA_NET_X + 200) {
    drawCorals(CORALS);
    drawCritter(ox + ollie.x, groundY(ollie.x) + 1, 'octopus', { color: ollie.color, scale: 1.4, dir: faceToward(ollie.x, 1) });
    drawReefSign(10700, 'the reef');
  }
  if (camX + W > CITY_X0 - 100 && camX < CITY_X1 + 100) drawReefCity();
  GUARDS.forEach(q => {
    if (q.netX - camX < -100 || q.netX - camX > W + 100) return;
    drawSeaNet(q.netX, q.side);
    drawCritter(ox + q.n.x, guardY(q), 'puffer', { color: q.n.color, scale: GUARD_K, dir: faceToward(q.n.x, q.side), puffed: Math.min(1, sea.puff[q.n.name] / 30) });
  });
  sea.fish.forEach(f => { const x = ox + f.x, y = wy + f.d; if (x > -30 && x < W + 30) f.tall ? drawAngelfish(x, y, f) : drawFish(x, y, f); });
  if (camX + W > CITY_X0 - 100 && camX < CITY_X1 + 100) { drawSwarm(); drawCityShelves(); drawSchoolAndClass(); }
  ctx.strokeStyle = 'rgba(200,240,250,0.55)'; ctx.lineWidth = 0.8;
  sea.bubbles.forEach(b => { ctx.beginPath(); ctx.arc(ox + b.x, b.y, b.r, 0, 7); ctx.stroke(); });
  ctx.restore();
}
function drawReefSign(x, text) {
  const sx = x - camX, sb = groundY(x);
  ctx.fillStyle = '#4a4a40'; ctx.fillRect(sx - 1.5, sb - 40, 3, 40); ctx.fillRect(sx - 30, sb - 52, 60, 16);
  ctx.fillStyle = 'rgba(220,230,210,0.8)'; ctx.font = '8px Space Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText(text, sx, sb - 41);
}

function drawCorals(list) {
  const ox = -camX;
  ctx.save(); ctx.lineCap = 'round';
  list.forEach(c => {
    const x = ox + c.x; if (x < -70 || x > W + 70) return;
    const b = (c.by != null ? seaY() + c.by : groundY(c.x)) + 2, [r, g, bl] = c.col, s = c.s, sw = Math.sin(tick * 0.02 + c.ph) * 3;
    ctx.strokeStyle = `rgba(${r},${g},${bl},0.75)`; ctx.fillStyle = `rgba(${r},${g},${bl},0.45)`; ctx.lineWidth = 3 * s;
    if (c.kind === 'branch') {
      const br = (x0, y0, a, l, d) => { if (d > 3) return; const x1 = x0 + Math.sin(a) * l, y1 = y0 - Math.cos(a) * l; ctx.lineWidth = (3.5 - d) * s; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); br(x1, y1, a - 0.5, l * 0.7, d + 1); br(x1, y1, a + 0.45, l * 0.7, d + 1); };
      br(x, b, sw * 0.03, 16 * s, 0);
    } else if (c.kind === 'brain') {
      ctx.beginPath(); ctx.ellipse(x, b - 2, 15 * s, 11 * s, 0, Math.PI, 0); ctx.fill();
      ctx.lineWidth = 1; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(x + i * 5 * s, b - 4 * s, 4 * s, Math.PI, 0); ctx.stroke(); }
    } else if (c.kind === 'fan') {
      ctx.lineWidth = 1;
      for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x, b); ctx.quadraticCurveTo(x + i * 4 * s, b - 20 * s, x + i * 6 * s + sw, b - 34 * s); ctx.stroke(); }
      ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.moveTo(x, b); ctx.arc(x + sw * 0.5, b, 34 * s, -Math.PI * 0.8, -Math.PI * 0.2); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    } else if (c.kind === 'tube') {
      [[-6, 22], [0, 30], [6, 18]].forEach(([dx, h]) => { ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(x + dx * s, b); ctx.lineTo(x + dx * s + sw * 0.3, b - h * s); ctx.stroke(); ctx.fillStyle = 'rgba(20,10,20,0.6)'; ctx.beginPath(); ctx.arc(x + dx * s + sw * 0.3, b - h * s, 1.8 * s, 0, 7); ctx.fill(); });
    } else {   // anemone, with a little clownfish
      ctx.lineWidth = 1.5 * s;
      for (let i = -5; i <= 5; i++) { const a = i * 0.18 + Math.sin(tick * 0.05 + i + c.ph) * 0.15; ctx.beginPath(); ctx.moveTo(x + i * s, b - 4); ctx.lineTo(x + i * s + Math.sin(a) * 14 * s, b - 4 - Math.cos(a) * 14 * s); ctx.stroke(); }
      const cx = x + Math.sin(tick * 0.04 + c.ph) * 10, cy = b - 16 * s + Math.cos(tick * 0.05 + c.ph) * 3;
      ctx.fillStyle = 'rgba(240,140,60,0.9)'; ctx.beginPath(); ctx.ellipse(cx, cy, 4, 2.4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(250,250,250,0.9)'; ctx.fillRect(cx - 0.6, cy - 2.4, 1.2, 4.8);
    }
  });
  STARS_SEA.forEach(st => {
    const x = ox + st.x, y = groundY(st.x) - 2; if (x < -20 || x > W + 20) return;
    ctx.fillStyle = st.col; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.5 : 7, a = st.r + i * Math.PI / 5; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6); }
    ctx.closePath(); ctx.fill();
  });
  ctx.restore();
}

// the reef city: towers, an arch, glowing windows, and everyone who lives there
function drawReefCity() {
  const ox = -camX, wy = seaY();
  ctx.save(); ctx.lineCap = 'round';
  // a soft glow over the whole city
  drawGlow(ox + 13850, wy + 400, 520, 0.08, [120, 200, 220]); drawGlow(ox + 14200, wy + 300, 380, 0.06, [120, 200, 220]);
  // towers
  TOWERS.forEach((t, i) => {
    const x = ox + t.x; if (x < -80 || x > W + 80) return;
    const b = towerBase(t), [r, g, bl] = t.col, sw = Math.sin(tick * 0.01 + i) * 2;
    ctx.fillStyle = `rgba(${r * 0.55 | 0},${g * 0.55 | 0},${bl * 0.6 | 0},0.92)`;
    ctx.beginPath(); ctx.moveTo(x - t.w / 2, b); ctx.quadraticCurveTo(x - t.w * 0.42, b - t.h * 0.6, x - t.w * 0.3 + sw, b - t.h);
    ctx.quadraticCurveTo(x + sw, b - t.h - t.w * 0.5, x + t.w * 0.3 + sw, b - t.h); ctx.quadraticCurveTo(x + t.w * 0.42, b - t.h * 0.6, x + t.w / 2, b); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(${r},${g},${bl},0.5)`; ctx.lineWidth = 1.2; ctx.stroke();
    // little side spires
    ctx.strokeStyle = `rgba(${r},${g},${bl},0.7)`; ctx.lineWidth = 4;
    [[-1, 0.45], [1, 0.62], [-1, 0.78]].forEach(([d, f]) => { const y = b - t.h * f; ctx.beginPath(); ctx.moveTo(x + d * t.w * 0.35, y); ctx.quadraticCurveTo(x + d * t.w * 0.75, y - 4, x + d * t.w * 0.8 + sw, y - 22); ctx.stroke(); });
    // glowing windows: polyps peeking out
    for (let k = 0; k < Math.floor(t.h / 34); k++) {
      const wx = x + (k % 2 ? 6 : -6) + sw * (k / 8), wyy = b - 22 - k * 30, on = 0.5 + 0.5 * Math.sin(tick * 0.03 + k * 1.7 + i);
      ctx.fillStyle = 'rgba(8,10,20,0.85)'; ctx.beginPath(); ctx.ellipse(wx, wyy, 4.5, 6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(190,250,230,${0.35 + 0.55 * on})`; ctx.beginPath(); ctx.arc(wx, wyy + 1, 2, 0, 7); ctx.fill();
      drawGlow(wx, wyy, 14, 0.25 * on, [160, 250, 220]);
    }
    // an eel living in a hole near the top
    if (t.eel) {
      const ey = b - t.h * 0.7, out = 10 + Math.max(0, Math.sin(tick * 0.02 + i)) * 18;
      ctx.fillStyle = 'rgba(8,10,20,0.9)'; ctx.beginPath(); ctx.ellipse(x + t.w * 0.3, ey, 6, 7, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(150,180,90,0.9)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x + t.w * 0.3, ey); ctx.quadraticCurveTo(x + t.w * 0.3 + out * 0.6, ey - 6 + Math.sin(tick * 0.08) * 3, x + t.w * 0.3 + out, ey - 2); ctx.stroke();
      ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(x + t.w * 0.3 + out - 2, ey - 4, 1.2, 0, 7); ctx.fill();
    }
  });
  // the arch
  const ax0 = ox + ARCH.x0, ax1 = ox + ARCH.x1;
  if (ax1 > -60 && ax0 < W + 60) {
    const b0 = (ARCH.on != null ? wy + ARCH.on : groundY(ARCH.x0)) + 4, b1 = (ARCH.on != null ? wy + ARCH.on : groundY(ARCH.x1)) + 4, top = Math.min(b0, b1) - 110;
    ctx.strokeStyle = 'rgba(150,100,140,0.9)'; ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(ax0, b0); ctx.bezierCurveTo(ax0 - 6, top, ax1 + 6, top, ax1, b1); ctx.stroke();
    ctx.strokeStyle = 'rgba(220,160,200,0.4)'; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 1; i < 8; i++) { const t = i / 8, x = ax0 + (ax1 - ax0) * t, y = top + 24 + Math.pow(2 * t - 1, 2) * 70; drawGlow(x, y, 10, 0.3, [240, 200, 255]); }
  }
  drawCityDistricts();
  drawCorals(CITY_CORALS);
  // seahorses on the coral, crabs + urchins on the tiers
  CITY_LIFE.forEach(c => {
    const x = ox + c.x; if (x < -60 || x > W + 60) return;
    const b = groundY(c.x);
    if (c.kind === 'seahorse') drawSeahorse(x + 14, b - 46 + Math.sin(tick * 0.04 + c.ph) * 4, c.col);
    else if (c.kind === 'crab') drawCritter(x + Math.sin(tick * 0.01 + c.ph) * 20, b + 1, 'crab', { color: '#e07a5a', scale: 0.55 });
    else if (c.kind === 'urchin') {
      ctx.strokeStyle = 'rgba(60,40,80,0.95)'; ctx.lineWidth = 1;
      for (let i = 0; i < 16; i++) { const a = Math.PI + i * Math.PI / 15; ctx.beginPath(); ctx.moveTo(x, b - 4); ctx.lineTo(x + Math.cos(a) * 12 * c.s, b - 4 + Math.sin(a) * 12 * c.s); ctx.stroke(); }
      ctx.fillStyle = 'rgba(70,40,90,0.95)'; ctx.beginPath(); ctx.arc(x, b - 4, 5 * c.s, Math.PI, 0); ctx.fill();
    }
  });
  // the swimmers: turtles, a ray, jellyfish
  CITY_LIFE.forEach(c => {
    const x = ox + c.x; if (x < -80 || x > W + 80) return;
    const y = wy + c.y;
    if (c.kind === 'turtle') drawTurtle(x, y + Math.sin(tick * 0.02 + c.x) * 6, Math.sign(c.vx));
    else if (c.kind === 'ray') drawRay(x, y + Math.sin(tick * 0.015) * 14, Math.sign(c.vx));
    else if (c.kind === 'jelly') drawJelly(x + Math.sin(c.ph * 0.7) * 10, y, c.col, c.ph);
  });
  drawReefSign(CITY_X1 - 40, 'the reef city'); drawReefSign(14345, 'school  <<');
  // the reef crest, where the surf begins
  for (let i = 0; i < 10; i++) {
    const x = REEF_X - 70 + i * 16, b = groundY(x);
    ctx.fillStyle = `rgba(${[150, 130, 170][i % 3]},${[120, 110, 120][i % 3]},${[110, 120, 140][i % 3]},0.85)`;
    ctx.beginPath(); ctx.ellipse(ox + x, b - 4, 12, 14 + (i % 3) * 7, 0, Math.PI, 0); ctx.fill();
  }
  ctx.restore();
}

// the shelves: dark reef rock, crusted with coral on top, glowing polyps + drips underneath
function drawCityShelves() {
  const ox = -camX, wy = seaY();
  ctx.save(); ctx.lineCap = 'round';
  SHELVES.slice().sort((a, b) => !!b.pillar - !!a.pillar).forEach((b, si) => {
    const x0 = ox + b.x0, x1 = ox + b.x1, T = wy + b.top, B = wy + b.bot;
    if (x1 < -60 || x0 > W + 60) return;
    ctx.fillStyle = '#17191f'; ctx.strokeStyle = 'rgba(120,110,140,0.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (b.pillar) {
      ctx.moveTo(x0, T - 4);
      for (let y = T; y <= B; y += 10) ctx.lineTo(x0 + Math.sin(y * 0.13) * 2.5, y);
      ctx.lineTo(x1 + 6, B + 4); ctx.lineTo(x1 + 6, T - 4);
    } else {
      const ext = x1 + 24;   // runs on into the reef wall
      ctx.moveTo(ext, T + 2);
      for (let x = x1; x > x0 + 10; x -= 8) ctx.lineTo(x, T + Math.sin(x * 0.21 + si) * 2.2 - Math.abs(Math.sin(x * 0.07)) * 2);
      ctx.quadraticCurveTo(x0 - 6, T, x0 - 4, (T + B) / 2);
      ctx.quadraticCurveTo(x0 - 2, B + 4, x0 + 12, B);
      for (let x = x0 + 12; x < x1; x += 8) ctx.lineTo(x, B + Math.abs(Math.sin(x * 0.09 + si)) * 5);
      ctx.lineTo(ext, B + 2);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (b.pillar) return;
    // coral crust along the top
    for (let x = b.x0 + 6; x < b.x1; x += 9) {
      const sx = ox + x; if (sx < -10 || sx > W + 10) continue;
      const [r, g, bl] = CORAL_COLS[Math.floor(hash(x * 0.37) * 7)], h = 3 + hash(x * 1.3) * 5;
      ctx.fillStyle = `rgba(${r},${g},${bl},0.55)`; ctx.beginPath(); ctx.ellipse(sx, T + 1, 4, h, 0, Math.PI, 0); ctx.fill();
    }
    // underneath: sponges hanging down, and polyps that glow so you can find your way
    for (let x = b.x0 + 14; x < b.x1 - 4; x += 17) {
      const sx = ox + x; if (sx < -20 || sx > W + 20) continue;
      const by = B + Math.abs(Math.sin(x * 0.09 + si)) * 5, len = 5 + hash(x * 2.1) * 12, sw = Math.sin(tick * 0.03 + x) * 1.5;
      ctx.strokeStyle = 'rgba(150,110,160,0.6)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(sx, by - 2); ctx.quadraticCurveTo(sx + sw, by + len * 0.6, sx + sw * 1.5, by + len); ctx.stroke();
      if (hash(x * 0.71) < 0.55) {
        const on = 0.55 + 0.45 * Math.sin(tick * 0.04 + x);
        drawGlow(sx + 6, by + 1, 13, 0.3 * on, [150, 240, 220]);
        ctx.fillStyle = `rgba(180,250,230,${0.5 + 0.4 * on})`; ctx.beginPath(); ctx.arc(sx + 6, by + 1, 1.6, 0, 7); ctx.fill();
      }
    }
  });
  ctx.restore();
  drawCorals(SHELF_CORALS);
  // the big empty conch, under the high shelf
  if (!sea.conchTaken && Math.abs(CONCH_X - camX - W / 2) < W) drawConch(ox + CONCH_X, wy + 610, 1, true);
}

// the school, the class, miss coralie, shelby (in his bell, or his new conch), and nib
function drawSchoolAndClass() {
  const ox = -camX, wy = seaY(), ly = wy + SCHOOL_D;
  if (Math.abs(13760 - camX - W / 2) < W / 2 + 260) {
    drawSchool(ox + SCHOOL_X, ly);
    // the back row sits on a coral bench
    ctx.fillStyle = 'rgba(190,140,150,0.75)'; ctx.fillRect(ox + 13770, ly - 13, 72, 4); ctx.fillRect(ox + 13772, ly - 10, 4, 10); ctx.fillRect(ox + 13836, ly - 10, 4, 10);
    STUDENTS.forEach((st, i) => {
      const x = ox + st.x, y = (st.back ? ly - 13 : ly) + Math.sin(tick * 0.05 + i * 1.7) * (st.kind === 'puffer' || st.kind === 'fish' ? 1.5 : 0);
      if (!st.back) { ctx.fillStyle = 'rgba(200,150,120,0.7)'; ctx.beginPath(); ctx.ellipse(x, ly - 2, 7, 3, 0, 0, 7); ctx.fill(); }
      if (st.nib) return;                       // nib's own stool (he's drawn below)
      if (st.kind === 'fish') drawFish(x, y - 9, { k: 0.8, vx: 1, ph: i, col: [240, 176, 192] });
      else drawCritter(x, y, st.kind, { color: st.color, scale: st.k, dir: 1 });
    });
    drawCritter(ox + coralie.x, ly + 1 + Math.sin(tick * 0.03) * 1.5, 'seahorse', { color: coralie.color, scale: 1.25, dir: faceToward(coralie.x, 1), specs: true, talking: coralie.bubbleT > 0 });
  }
  if (Math.abs(shelby.x - camX - W / 2) < W) {
    const sx = shelby.x + Math.sin(tick * 0.008) * 3;
    drawCritter(ox + sx, groundY(sx) + 1, 'hermit', { color: shelby.color, scale: 1.1, dir: faceToward(shelby.x, 1), shell: shelby.shell, talking: shelby.bubbleT > 0 });
  }
  if (Math.abs(nib.x - camX - W / 2) < W) {
    const hiding = !nib.follow && !nib.home && nib.d == null, y = nibY() + 1 + (nib.follow ? Math.sin(tick * 0.08) * 2 : 0);
    drawGlow(ox + nib.x, y - 12, 30, hiding ? 0.08 : 0.12, [200, 170, 250]);
    drawCritter(ox + nib.x, y, 'octopus', { color: hiding && !met.nib ? '#8c88a0' : nib.color, scale: nib.home ? 0.6 : 0.75, dir: nib.home ? 1 : faceToward(nib.x, 1) });
  }
}
function drawSchool(x, b) {
  ctx.save(); ctx.lineCap = 'round';
  drawGlow(x, b - 80, 170, 0.14, [255, 210, 160]);
  const wall = 'rgba(176,120,112,0.96)', wallLine = 'rgba(240,190,170,0.5)', shell = 'rgba(232,206,170,0.96)', shellLine = 'rgba(160,120,90,0.8)';
  // the annex wing on the yard side: the library, a lower dome of brain coral
  ctx.fillStyle = 'rgba(160,108,112,0.96)'; ctx.strokeStyle = wallLine; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x + 50, b); ctx.lineTo(x + 50, b - 34); ctx.quadraticCurveTo(x + 66, b - 62, x + 84, b - 34); ctx.lineTo(x + 84, b); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(30,20,22,0.95)'; ctx.beginPath(); ctx.arc(x + 67, b - 34, 7, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,205,140,0.6)'; ctx.beginPath(); ctx.arc(x + 67, b - 34, 5, 0, 7); ctx.fill(); drawGlow(x + 67, b - 34, 16, 0.25, [255, 200, 130]);
  // ground floor: a wide rounded block of brain coral
  ctx.fillStyle = wall; ctx.strokeStyle = wallLine;
  ctx.beginPath(); ctx.moveTo(x - 58, b); ctx.lineTo(x - 58, b - 64); ctx.quadraticCurveTo(x - 58, b - 72, x - 50, b - 72); ctx.lineTo(x + 50, b - 72); ctx.quadraticCurveTo(x + 58, b - 72, x + 58, b - 64); ctx.lineTo(x + 58, b); ctx.closePath(); ctx.fill(); ctx.stroke();
  // second floor, a little narrower, with a balcony rail between
  ctx.fillStyle = 'rgba(190,134,122,0.96)';
  ctx.beginPath(); ctx.moveTo(x - 44, b - 72); ctx.lineTo(x - 44, b - 126); ctx.quadraticCurveTo(x - 44, b - 134, x - 36, b - 134); ctx.lineTo(x + 36, b - 134); ctx.quadraticCurveTo(x + 44, b - 134, x + 44, b - 126); ctx.lineTo(x + 44, b - 72); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,70,70,0.35)'; ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) { const yy = b - 6 - i * 10.5, w = yy < b - 72 ? 42 : 56; ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.quadraticCurveTo(x, yy - 4 + (i % 2 ? 4 : -4), x + w, yy); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(232,206,170,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 50, b - 75); ctx.lineTo(x + 50, b - 75); ctx.stroke();
  for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(x + i * 9.5, b - 75); ctx.lineTo(x + i * 9.5, b - 84); ctx.stroke(); }
  // roof: a big scallop shell
  ctx.fillStyle = shell; ctx.strokeStyle = shellLine; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(x - 52, b - 128); ctx.quadraticCurveTo(x - 40, b - 170, x, b - 174); ctx.quadraticCurveTo(x + 40, b - 170, x + 52, b - 128); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * 3, b - 172); ctx.lineTo(x + i * 12, b - 130); ctx.stroke(); }
  // the bell tower: a belfry on the ridge, with the bell back in it once it's found
  ctx.strokeStyle = shell; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x - 11, b - 172); ctx.lineTo(x - 11, b - 196); ctx.moveTo(x + 11, b - 172); ctx.lineTo(x + 11, b - 196); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, b - 196, 11, Math.PI, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, b - 207); ctx.lineTo(x, b - 218); ctx.stroke();
  const fl = Math.sin(tick * 0.07) * 2; ctx.fillStyle = 'rgba(240,140,120,0.95)'; ctx.beginPath(); ctx.moveTo(x, b - 218); ctx.lineTo(x + 12 + fl, b - 214); ctx.lineTo(x, b - 210); ctx.closePath(); ctx.fill();
  if (questState.schoolbell === 'done') drawSchoolBell(x + Math.sin(tick * 0.05) * 1.2, b - 190, 0.7);
  else { ctx.strokeStyle = 'rgba(200,180,150,0.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, b - 205); ctx.lineTo(x, b - 186); ctx.stroke(); }
  // the big door, with steps
  ctx.fillStyle = 'rgba(30,20,22,0.95)'; ctx.beginPath(); ctx.moveTo(x - 12, b); ctx.lineTo(x - 12, b - 26); ctx.arc(x, b - 26, 12, Math.PI, 0); ctx.lineTo(x + 12, b); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,130,0.45)'; ctx.beginPath(); ctx.moveTo(x - 9, b); ctx.lineTo(x - 9, b - 25); ctx.arc(x, b - 25, 9, Math.PI, 0); ctx.lineTo(x + 9, b); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(200,150,140,0.9)'; ctx.fillRect(x - 18, b - 3, 36, 3); ctx.fillRect(x - 15, b - 6, 30, 3);
  // windows, lamplit: two on the ground floor, three up above
  [[-36, 40], [36, 40], [-26, 100], [0, 100], [26, 100]].forEach(([dx, h]) => {
    ctx.fillStyle = 'rgba(30,20,22,0.95)'; ctx.beginPath(); ctx.arc(x + dx, b - h, 6, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,205,140,0.62)'; ctx.beginPath(); ctx.arc(x + dx, b - h, 4.2, 0, 7); ctx.fill(); drawGlow(x + dx, b - h, 15, 0.26, [255, 200, 130]);
  });
  // the sign
  ctx.fillStyle = 'rgba(214,196,150,0.95)'; ctx.fillRect(x - 27, b - 62, 54, 13);
  ctx.fillStyle = 'rgba(60,40,30,0.95)'; ctx.font = '7px Space Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('reef school', x, b - 52);
  ctx.restore();
}
// the reef city's districts, between the school and the crest: the schoolyard (gym, swing, slide), little coral houses,
// the long hall and arcade (lamps + flats), the garden row, and the night market under the crest shelf
const HOUSES = [[13392, 24, 40, 1], [13740, 22, 34, 3], [13810, 22, 34, 0], [13926, 26, 40, 2], [14000, 22, 36, 4], [14064, 22, 36, 0], [14150, 22, 34, 5], [14102, 20, 30, 6], [14202, 24, 42, 1], [14290, 22, 36, 2], [14325, 22, 34, 3]];
const STALLS = [14240, 14268, 14306, 14352, 14378];
function drawCityDistricts() {
  const ox = -camX, wy = seaY(), on = x => x + ox > -80 && x + ox < W + 80;
  ctx.save(); ctx.lineCap = 'round';
  // coral houses: little domes with a lit window and a door
  HOUSES.forEach(([hx, w, h, ci], i) => {
    if (!on(hx)) return;
    const x = ox + hx, b = groundY(hx) + 2, [r, g, bl] = CORAL_COLS[ci];
    ctx.fillStyle = `rgba(${r * 0.5 | 0},${g * 0.5 | 0},${bl * 0.55 | 0},0.95)`; ctx.strokeStyle = `rgba(${r},${g},${bl},0.55)`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - w / 2, b); ctx.lineTo(x - w / 2, b - h * 0.55); ctx.quadraticCurveTo(x - w / 2, b - h, x, b - h); ctx.quadraticCurveTo(x + w / 2, b - h, x + w / 2, b - h * 0.55); ctx.lineTo(x + w / 2, b); ctx.closePath(); ctx.fill(); ctx.stroke();
    const lit = 0.55 + 0.4 * Math.sin(tick * 0.03 + i * 2.1);
    ctx.fillStyle = `rgba(255,214,150,${0.45 + 0.4 * lit})`; ctx.beginPath(); ctx.arc(x - w * 0.12, b - h * 0.62, 2.8, 0, 7); ctx.fill(); drawGlow(x - w * 0.12, b - h * 0.62, 11, 0.22 * lit, [255, 205, 140]);
    ctx.fillStyle = 'rgba(20,12,16,0.9)'; ctx.beginPath(); ctx.moveTo(x + w * 0.1, b); ctx.lineTo(x + w * 0.1, b - h * 0.3); ctx.arc(x + w * 0.22, b - h * 0.3, w * 0.12, Math.PI, 0); ctx.lineTo(x + w * 0.34, b); ctx.closePath(); ctx.fill();
  });
  // the schoolyard on the terrace: a jungle gym, a kelp swing, a slide, and the kids
  if (on(13960) || on(13920)) {
    const gb = groundY(13950) + 2, gx = ox + 13921;
    ctx.strokeStyle = 'rgba(210,150,160,0.9)'; ctx.lineWidth = 3;   // jungle gym
    ctx.beginPath(); ctx.moveTo(gx - 14, gb); ctx.lineTo(gx - 8, gb - 30); ctx.lineTo(gx - 2, gb); ctx.moveTo(gx + 2, gb); ctx.lineTo(gx + 8, gb - 30); ctx.lineTo(gx + 14, gb); ctx.moveTo(gx - 8, gb - 30); ctx.lineTo(gx + 8, gb - 30); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(gx - 11, gb - 18); ctx.lineTo(gx + 11, gb - 18); ctx.stroke();
    const sx = ox + 13950, sa = Math.sin(tick * 0.04) * 0.35;   // swing
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(210,150,160,0.9)'; ctx.beginPath(); ctx.moveTo(sx - 12, gb); ctx.lineTo(sx - 12, gb - 44); ctx.lineTo(sx + 12, gb - 44); ctx.lineTo(sx + 12, gb); ctx.stroke();
    const px = sx + Math.sin(sa) * 24, py = gb - 44 + Math.cos(sa) * 24;
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(150,200,140,0.9)'; ctx.beginPath(); ctx.moveTo(sx - 3, gb - 44); ctx.lineTo(px - 4, py); ctx.moveTo(sx + 3, gb - 44); ctx.lineTo(px + 4, py); ctx.stroke();
    ctx.fillStyle = 'rgba(232,206,170,0.95)'; ctx.fillRect(px - 6, py, 12, 3);
    ctx.strokeStyle = 'rgba(232,200,170,0.9)'; ctx.lineWidth = 4;   // slide
    const lb = ox + 13972; ctx.beginPath(); ctx.moveTo(lb, gb - 34); ctx.quadraticCurveTo(lb + 12, gb - 14, lb + 18, gb - 3); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lb - 3, gb - 36); ctx.lineTo(lb - 3, gb); ctx.stroke();
    YARD_KIDS.forEach((k, i) => drawCritter(ox + k.x, groundY(k.x) + 1 - Math.max(0, Math.sin(tick * 0.08 + i * 2)) * 4, k.kind, { color: k.color, scale: k.k, dir: i % 2 ? -1 : 1 }));
    drawFish(px, py - 8, { k: 0.5, vx: 1, ph: 1, col: [240, 176, 192] });
  }
  // the long hall + arcade: lamps of polyps along the roofs
  [[13990, 14078, 225], [14124, 14182, 235]].forEach(([a, b2, bot]) => {
    for (let hx = a + 10; hx < b2; hx += 22) {
      if (!on(hx)) continue;
      const on2 = 0.5 + 0.5 * Math.sin(tick * 0.035 + hx), gb = groundY(hx);
      ctx.strokeStyle = 'rgba(120,100,120,0.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ox + hx, wy + bot + 4); ctx.lineTo(ox + hx, wy + bot + 16); ctx.stroke();
      drawGlow(ox + hx, wy + bot + 18, 12, 0.3 * on2 + 0.1, [255, 220, 150]);
      ctx.fillStyle = 'rgba(255,230,170,0.85)'; ctx.beginPath(); ctx.arc(ox + hx, wy + bot + 18, 2.2, 0, 7); ctx.fill();
    }
  });
  // the garden row: fence, kelp lanterns, flower beds
  for (let gx0 = 14100; gx0 < 14214; gx0 += 7) {
    if (!on(gx0)) continue;
    const gb = groundY(gx0) + 2, x = ox + gx0, k = Math.floor(gx0 / 7);
    ctx.strokeStyle = 'rgba(200,170,140,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, gb); ctx.lineTo(x, gb - 11); ctx.stroke();
    if (k % 3 === 0) {
      const [r, g, bl] = CORAL_COLS[k % 7], sw = Math.sin(tick * 0.04 + k) * 1.5;
      ctx.fillStyle = `rgba(${r},${g},${bl},0.9)`; ctx.beginPath(); ctx.arc(x + 3 + sw, gb - 18, 3.2, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(90,170,120,0.85)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 3, gb); ctx.quadraticCurveTo(x + 3 + sw, gb - 9, x + 3 + sw, gb - 16); ctx.stroke();
    }
    if (k % 6 === 0) { const lp = 0.55 + 0.45 * Math.sin(tick * 0.04 + k); ctx.strokeStyle = 'rgba(90,150,110,0.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, gb); ctx.lineTo(x, gb - 30); ctx.stroke(); drawGlow(x, gb - 32, 14, 0.3 * lp, [190, 255, 200]); ctx.fillStyle = 'rgba(200,255,210,0.9)'; ctx.beginPath(); ctx.arc(x, gb - 32, 2, 0, 7); ctx.fill(); }
  }
  ctx.strokeStyle = 'rgba(200,170,140,0.6)'; ctx.lineWidth = 1;
  if (on(14100) || on(14214)) { const gb = groundY(14150) + 2; ctx.beginPath(); ctx.moveTo(ox + 14100, gb - 8); ctx.lineTo(ox + 14214, gb - 8); ctx.stroke(); }
  // the night market under the crest shelf: little stalls with striped awnings, goods, and lanterns
  STALLS.forEach((sx0, i) => {
    if (!on(sx0)) return;
    const x = ox + sx0, gb = groundY(sx0) + 2, [r, g, bl] = CORAL_COLS[(i * 2 + 1) % 7], lp = 0.6 + 0.4 * Math.sin(tick * 0.04 + i * 1.9);
    ctx.fillStyle = 'rgba(90,60,70,0.95)'; ctx.fillRect(x - 11, gb - 10, 22, 10);
    ctx.strokeStyle = 'rgba(160,130,120,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 11, gb); ctx.lineTo(x - 11, gb - 30); ctx.moveTo(x + 11, gb); ctx.lineTo(x + 11, gb - 30); ctx.stroke();
    for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? 'rgba(240,230,210,0.9)' : `rgba(${r},${g},${bl},0.92)`; ctx.beginPath(); ctx.moveTo(x - 13 + k * 6.5, gb - 31); ctx.lineTo(x - 13 + (k + 1) * 6.5, gb - 31); ctx.lineTo(x - 11 + (k + 1) * 5.5, gb - 24); ctx.lineTo(x - 11 + k * 5.5, gb - 24); ctx.closePath(); ctx.fill(); }
    for (let k = 0; k < 3; k++) { const [r2, g2, b2] = CORAL_COLS[(i + k * 2) % 7]; ctx.fillStyle = `rgba(${r2},${g2},${b2},0.9)`; ctx.beginPath(); ctx.arc(x - 6 + k * 6, gb - 12.5, 2.6, 0, 7); ctx.fill(); }
    drawGlow(x, gb - 20, 20, 0.25 * lp, [255, 210, 140]); ctx.fillStyle = 'rgba(255,225,160,0.9)'; ctx.beginPath(); ctx.arc(x, gb - 22, 2, 0, 7); ctx.fill();
  });
  ctx.restore();
}
// a brass bell, upright (the belfry, the bag)
function drawSchoolBell(x, y, k) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(226,186,92,0.97)'; ctx.strokeStyle = 'rgba(150,110,40,0.95)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-6, -12); ctx.quadraticCurveTo(-7, -2, -12, 8); ctx.quadraticCurveTo(0, 12, 12, 8); ctx.quadraticCurveTo(7, -2, 6, -12); ctx.quadraticCurveTo(0, -18, -6, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -17, 3, 0, 7); ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,190,0.7)'; ctx.beginPath(); ctx.ellipse(-4, -3, 1.6, 5, 0.2, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(120,85,30,0.95)'; ctx.beginPath(); ctx.arc(0, 11, 2.6, 0, 7); ctx.fill();
  ctx.restore();
}
// a big spiral conch (on the shelf, in the bag)
function drawConch(x, b, k, glint) {
  ctx.save(); ctx.translate(x, b); ctx.scale(k, k);
  if (glint) drawGlow(0, -8, 26, 0.18 + 0.08 * Math.sin(tick * 0.05), [255, 200, 210]);
  ctx.fillStyle = 'rgba(236,200,176,0.97)'; ctx.strokeStyle = 'rgba(170,120,100,0.95)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-16, -6); ctx.quadraticCurveTo(-10, -20, 4, -18); ctx.quadraticCurveTo(14, -16, 16, -8); ctx.quadraticCurveTo(10, -1, -2, 0); ctx.quadraticCurveTo(-14, 0, -16, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
  [[-8, -17], [-2, -20], [4, -20]].forEach(([sx, sy]) => { ctx.beginPath(); ctx.moveTo(sx - 2, sy + 2); ctx.lineTo(sx, sy - 3); ctx.lineTo(sx + 2, sy + 2); ctx.fill(); ctx.stroke(); });
  ctx.beginPath(); ctx.moveTo(-10, -12); ctx.quadraticCurveTo(-4, -8, 2, -14); ctx.moveTo(-14, -8); ctx.quadraticCurveTo(-6, -3, 6, -10); ctx.stroke();
  ctx.fillStyle = 'rgba(240,150,160,0.85)'; ctx.beginPath(); ctx.ellipse(11, -7, 5, 4, -0.4, 0, 7); ctx.fill();
  ctx.restore();
}
// the bait ball: dozens of little silver fish, shimmering as they turn
function drawSwarm() {
  const ox = -camX, wy = seaY();
  if (SWARM.x - camX < -200 || SWARM.x - camX > W + 200) return;
  SWARM.fish.forEach(f => {
    const x = ox + f.x, y = wy + f.d, k = f.k, d = f.dir, sh = 0.5 + 0.5 * Math.sin(tick * 0.09 + f.ph + f.a * 2);
    ctx.fillStyle = `rgba(${150 + 90 * sh | 0},${185 + 60 * sh | 0},${205 + 45 * sh | 0},0.85)`;
    ctx.beginPath(); ctx.ellipse(x, y, 13 * k, 4 * k, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - d * 11 * k, y); ctx.lineTo(x - d * 18 * k, y - 4 * k); ctx.lineTo(x - d * 18 * k, y + 4 * k); ctx.closePath(); ctx.fill();
  });
}

function drawSeahorse(x, y, col) {
  const [r, g, b] = col;
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = `rgba(${r},${g},${b},0.95)`; ctx.fillStyle = `rgba(${r},${g},${b},0.5)`; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(6, -4, 3, 4); ctx.quadraticCurveTo(0, 12, 4, 16); ctx.arc(6, 16, 2.5, Math.PI, Math.PI * 2.6); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(1, -2, 4, 7, 0.2, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(1, -12, 3.5, 3, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, -12); ctx.lineTo(9, -11); ctx.stroke();
  ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(2, -13, 0.9, 0, 7); ctx.fill();
  ctx.restore();
}
function drawJelly(x, y, col, ph) {
  const [r, g, b] = col, p = Math.sin(ph * 3) * 0.15;
  drawGlow(x, y, 26, 0.2, col);
  ctx.fillStyle = `rgba(${r},${g},${b},0.35)`; ctx.strokeStyle = `rgba(${r},${g},${b},0.85)`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(x, y, 10 * (1 + p), 8 * (1 - p), 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(x + i * 2.6, y); ctx.quadraticCurveTo(x + i * 3 + Math.sin(tick * 0.06 + i) * 4, y + 12, x + i * 2 + Math.sin(tick * 0.05 + i) * 5, y + 24); ctx.stroke(); }
}
function drawTurtle(x, y, d) {
  ctx.save(); ctx.translate(x, y); ctx.scale(d || 1, 1);
  const f = Math.sin(tick * 0.06) * 0.5;
  ctx.fillStyle = 'rgba(120,150,100,0.8)';
  [[10, 5, f], [-10, 5, -f], [12, -5, -f], [-12, -5, f]].forEach(([dx, dy, a]) => { ctx.save(); ctx.translate(dx, dy); ctx.rotate(a + (dx > 0 ? 0.6 : -0.6)); ctx.beginPath(); ctx.ellipse(0, 0, 9, 3.5, 0, 0, 7); ctx.fill(); ctx.restore(); });
  ctx.fillStyle = 'rgba(110,130,80,0.95)'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 11, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(180,200,140,0.5)'; ctx.lineWidth = 1; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(i * 8, 0, 4, 6, 0, 0, 7); ctx.stroke(); }
  ctx.fillStyle = 'rgba(140,165,110,0.95)'; ctx.beginPath(); ctx.ellipse(22, -1, 6, 4.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(24, -2, 1, 0, 7); ctx.fill();
  ctx.restore();
}
function drawRay(x, y, d) {
  ctx.save(); ctx.translate(x, y); ctx.scale(d || 1, 1);
  const f = Math.sin(tick * 0.05) * 10;
  ctx.fillStyle = 'rgba(60,70,100,0.85)'; ctx.strokeStyle = 'rgba(150,170,210,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(24, 0); ctx.quadraticCurveTo(4, -6, -6, -30 - f); ctx.quadraticCurveTo(-8, -6, -22, 0); ctx.quadraticCurveTo(-8, 6, -6, 30 + f); ctx.quadraticCurveTo(4, 6, 24, 0); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-50, 2 + Math.sin(tick * 0.07) * 3); ctx.stroke();
  ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(16, -2, 1.2, 0, 7); ctx.fill();
  ctx.restore();
}
function drawAngelfish(x, y, f) {
  const k = f.k * 1.2, dir = Math.sign(f.vx) || 1, [r, g, b] = f.col;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.fillStyle = `rgba(${r},${g},${b},0.6)`; ctx.strokeStyle = `rgba(${r},${g},${b},0.95)`; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(8 * k, 0); ctx.quadraticCurveTo(0, -14 * k, -6 * k, -12 * k); ctx.lineTo(-4 * k, 0); ctx.lineTo(-6 * k, 12 * k); ctx.quadraticCurveTo(0, 14 * k, 8 * k, 0); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(30,30,40,0.5)'; ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.moveTo(1 * k, -8 * k); ctx.lineTo(1 * k, 8 * k); ctx.stroke();
  ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(5 * k, -1.5 * k, 1 * k, 0, 7); ctx.fill();
  ctx.restore();
}

// a net strung down across the drop, with one gap (guarded). side: which way the swimmer comes from (-1 = from the left)
function drawSeaNet(nx, side) {
  const ox = -camX, x = ox + nx, top = seaY(), bot = top + 1300, gap0 = top + 112, gap1 = top + 190;
  ctx.save();
  for (let i = -1; i <= 1; i++) { ctx.fillStyle = i ? 'rgba(220,120,90,0.9)' : 'rgba(240,220,180,0.9)'; ctx.beginPath(); ctx.arc(x + 7 + i * 7, waveY(nx) - 2, 5, 0, 7); ctx.fill(); }
  ctx.strokeStyle = 'rgba(200,190,160,0.45)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, gap0); ctx.moveTo(x, gap1); ctx.lineTo(x, bot);
  ctx.moveTo(x + 14, top); ctx.lineTo(x + 14, gap0); ctx.moveTo(x + 14, gap1); ctx.lineTo(x + 14, bot);
  for (let y = top + 8; y < bot; y += 12) {
    if (y > gap0 - 6 && y < gap1 + 6) continue;
    const sw = Math.sin(tick * 0.02 + y * 0.03) * 2;
    ctx.moveTo(x + sw, y); ctx.lineTo(x + 14 + sw, y + 12); ctx.moveTo(x + 14 + sw, y); ctx.lineTo(x + sw, y + 12);
  }
  ctx.stroke();
  const sx = side < 0 ? x - 40 : x + 2;
  ctx.fillStyle = 'rgba(210,190,120,0.85)'; ctx.fillRect(sx, gap0 - 22, 54, 14);
  ctx.fillStyle = 'rgba(40,30,20,0.9)'; ctx.font = '7px Space Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('NO ENTRY', sx + 27, gap0 - 12);
  ctx.restore();
}

// in front of the player: a blue tint underwater, the surface, foam, ripples, bubbles, the breath meter
function drawSeaFront() {
  const wy = seaY(), ox = -camX, s = playerScale();
  if (!seaShape(waveY)) return;
  ctx.fillStyle = 'rgba(40,110,150,0.16)'; ctx.fill();
  if (lake.under && scene === 'outside') drawGlow(player.wx - camX, player._py - 30 * s, 90, 0.1 + Math.min(0.12, (player._py - wy) / 3000), [150, 210, 230]);
  const x0 = Math.max(SEA_X0, camX - 20), x1 = Math.min(SEA_X1, camX + W + 20);
  ctx.strokeStyle = 'rgba(170,220,240,0.55)'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 6) { const y = waveY(x); x === x0 ? ctx.moveTo(ox + x, y) : ctx.lineTo(ox + x, y); }
  ctx.stroke();
  // whitecaps out in the storm; foam where the water meets the beach
  for (let x = Math.ceil(x0 / 40) * 40; x <= x1; x += 40) {
    const k = stormK(x);
    if (k > 0.2) {
      const y = waveY(x), crest = waveY(x - 6) > y && waveY(x + 6) > y;
      if (crest) { ctx.fillStyle = `rgba(230,240,250,${0.6 * k})`; ctx.beginPath(); ctx.ellipse(ox + x, y, 12, 2.5, 0, 0, 7); ctx.fill(); }
    }
  }
  const x = 10420 + Math.sin(tick * 0.03) * 10;
  if (x > camX - 40 && x < camX + W + 40) {
    ctx.fillStyle = 'rgba(230,240,245,0.45)';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(ox + x - 14 + i * 7, wy - 1, 4, 1.4, 0, 0, 7); ctx.fill(); }
  }
  sea.ripples.forEach(r => { ctx.strokeStyle = `rgba(180,230,240,${r.life * 0.6})`; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(ox + r.x, wy, r.r * 2.2, r.r * 0.45, 0, 0, 7); ctx.stroke(); });
  sea.splashes.forEach(p => { ctx.fillStyle = `rgba(190,235,245,${p.life})`; ctx.fillRect(ox + p.x, p.y, 2, 2); });
  if (scene === 'outside') drawBreathMeter();
}
