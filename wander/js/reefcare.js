/* ══════════════════════════════════════════
   OLD RUFFLE — a reef city quest, after the reef school's (sea.js), with rae (island.js)
   · old ruffle is a big old anemone on the roof of the long hall (the sunniest spot in
     the city). flick, a clownfish, lives in her. once the school's three quests are done
     (the bell, shelby's conch, nib's headcount), the next time you're not looking, ruffle
     goes pale and stops waving. flick (and miss coralie, and the compass) point you at rae.
   · rae, on the island, knows the water: the swell's been lazy, the shallows went warm.
     she puts on her own helmet (a glass fishing float in a net of rope), walks into the
     sea, and swims down to the long hall roof. down there she asks for three things:
       1. cold water from the very bottom of the shaft by the net (west, past the school,
          right down where the deep wells up). she gives you a jar for it.
       2. food: ollie, who gardens the bay on the mainland side, makes a coral tonic.
       3. shade: the bait ball follows anything interesting. swim into it, slowly, and
          lead it over the roof; it settles there like a parasol.
     bring the jar and the tonic back to rae. with all three, ruffle comes back to color,
     waves again, flick gives you a pearl, and rae swims home to her island routine.
   Persistent state: `care` (saveRegister 'reefcare'). rae's spot in the reef isn't saved:
   a save made while she's down puts her straight back on the roof.
   Hooks (wrapped from here): updateSea, drawSeaBack, drawCritter ('clownfish'), raeY,
   talkToRae, talkCoralie, compassTarget; OUT_SPOTS (unshift); SHELF_CORALS (room on the roof).
   Edits elsewhere: sea.js (SWARM.steer: the bait ball can be led), island.js (rae.away:
   drawIslandBack doesn't draw her while she's down here).
══════════════════════════════════════════ */
const RUFFLE_X = 14012, RUFFLE_D = 195;            // on the roof of the long hall (sea.js SHELVES: 13985–14080, top 195)
const RAE_REEF_X = 14060;                          // where rae sits, on the same roof
const SHADE_X = RUFFLE_X, SHADE_D = 112;           // where the bait ball parks, over ruffle
const DEEP_X = 13410, DEEP_X0 = 13346, DEEP_X1 = 13428;   // the bottom of the shaft by the net, where the cold wells up
const CURE_FRAMES = 300;
const RAE_DOWN = [[SURF_X1 - 6, 0], [14600, 30], [14430, 104], [14200, 150], [14086, 174], [RAE_REEF_X, RUFFLE_D]];
const RAE_UP = [[14086, 174], [14200, 150], [14430, 104], [14600, 24], [SURF_X1 + 12, 0]];
const CARE_STAGES = ['none', 'sick', 'asked', 'diving', 'cured', 'done'];

const care = {
  stage: 'none',        // none · sick (ruffle pale) · asked (flick sent you to rae) · diving (rae's down here) · cured (rae heading home) · done
  briefed: false,       // rae said what ruffle needs (and gave you the jar)
  cold: false, fed: false, shade: false,   // the three things, delivered
  told: false,          // miss coralie mentioned it
  // transient (not saved)
  path: [], returning: false, rd: 0, cureT: 0, leaveT: 0, lead: false, callT: 0, li: 0, flickLi: 0,
};
const flick = makeRegular({ name: 'flick', kind: 'clownfish', color: '#f08a3a', x: RUFFLE_X, d: RUFFLE_D - 28 });
outTalker(flick, () => [flick.x, seaY() + flick.d + 8, seaY() + flick.d - 14]);

/* ── registrations ── */
Object.assign(ITEMS, {
  jar:     { name: "rae's empty jar",     desc: "it used to hold pickled kelp. it's for the cold water at the very bottom of the shaft by the net.", wearable: false },
  coldjar: { name: 'a jar of deep cold',  desc: "water from the very bottom of the reef, where the deep wells up. it's so cold it's almost blue. for rae.", wearable: false },
  tonic:   { name: "ollie's coral tonic", desc: 'brine shrimp, a pinch of kelp, and a secret ingredient (more kelp). for old ruffle.', wearable: false },
  pearl:   { name: 'a little pearl',      desc: "from flick and old ruffle. it was going to be a doorstop. it's yours now.", wearable: false },
});
ITEM_ORDER.push('jar', 'coldjar', 'tonic', 'pearl');
function drawJarArt(w, h, full) {
  const x = w / 2, y = h / 2 + 2;
  if (full) {
    drawGlow(x, y + 4, 20, 0.35, [150, 210, 255]);
    ctx.fillStyle = 'rgba(120,190,240,0.75)'; ctx.fillRect(x - 10, y - 6, 20, 19);
    ctx.strokeStyle = 'rgba(235,250,255,0.9)'; ctx.lineWidth = 1;
    [[-4, 2], [4, 7]].forEach(([dx, dy]) => { ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.moveTo(x + dx - Math.cos(a) * 3, y + dy - Math.sin(a) * 3); ctx.lineTo(x + dx + Math.cos(a) * 3, y + dy + Math.sin(a) * 3); } ctx.stroke(); });
  }
  ctx.strokeStyle = 'rgba(200,230,230,0.9)'; ctx.fillStyle = 'rgba(200,235,235,0.15)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(x - 9, y - 10); ctx.quadraticCurveTo(x - 12, y - 8, x - 11, y - 2); ctx.lineTo(x - 11, y + 12); ctx.quadraticCurveTo(x - 11, y + 15, x - 8, y + 15);
  ctx.lineTo(x + 8, y + 15); ctx.quadraticCurveTo(x + 11, y + 15, x + 11, y + 12); ctx.lineTo(x + 11, y - 2); ctx.quadraticCurveTo(x + 12, y - 8, x + 9, y - 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(200,120,70,0.95)'; ctx.fillRect(x - 10, y - 15, 20, 6);
  ctx.strokeStyle = 'rgba(120,70,40,0.9)'; ctx.lineWidth = 1; ctx.strokeRect(x - 10, y - 15, 20, 6);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(x - 7, y - 4); ctx.lineTo(x - 7, y + 10); ctx.stroke();
}
Object.assign(ITEM_ART, {
  jar: (w, h) => drawJarArt(w, h, false),
  coldjar: (w, h) => drawJarArt(w, h, true),
  tonic: (w, h) => {   // a little stoppered bottle of green-brown goodness, tied with a ribbon of kelp
    const x = w / 2, y = h / 2 + 3;
    ctx.fillStyle = 'rgba(120,150,70,0.9)'; ctx.strokeStyle = 'rgba(200,230,200,0.85)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(x, y + 4, 11, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(200,230,200,0.2)'; ctx.fillRect(x - 4, y - 14, 8, 10); ctx.strokeRect(x - 4, y - 14, 8, 10);
    ctx.fillStyle = 'rgba(190,150,100,0.95)'; ctx.fillRect(x - 5, y - 18, 10, 5);
    ctx.fillStyle = 'rgba(240,170,190,0.9)'; [[-4, 6], [3, 2], [5, 8], [-1, 10]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.4, 0, 7); ctx.fill(); });
    ctx.strokeStyle = 'rgba(70,140,90,0.95)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 5, y - 6); ctx.quadraticCurveTo(x - 14, y - 4, x - 13, y + 4); ctx.moveTo(x + 5, y - 6); ctx.quadraticCurveTo(x + 14, y - 8, x + 15, y - 1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x - 3, y + 1, 6, 3.4, 4.4); ctx.stroke();
  },
  pearl: (w, h) => {   // in a half shell
    const x = w / 2, y = h / 2 + 4;
    ctx.fillStyle = 'rgba(230,190,200,0.95)'; ctx.strokeStyle = 'rgba(160,110,120,0.9)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.quadraticCurveTo(x, y + 18, x + 16, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 5, y + 1); ctx.lineTo(x + i * 2.5, y + 8); ctx.stroke(); }
    drawGlow(x, y - 6, 18, 0.4, [255, 240, 230]);
    const g = ctx.createRadialGradient(x - 3, y - 9, 1, x, y - 6, 9);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#ece6f0'); g.addColorStop(1, '#b8b0c8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 6, 8, 0, 7); ctx.fill();
  },
});
Object.assign(FRIENDS, {
  'flick': { kind: 'clownfish', color: '#f08a3a', species: 'clownfish', where: 'lives in old ruffle, up on the long hall roof' },
});
Object.assign(QUESTS, {
  ruffle: { giver: 'flick', title: 'old ruffle', desc: '' },
});
Object.assign(ACHIEVEMENTS, {
  reefmedic: { name: 'gentle current', desc: 'help rae bring old ruffle back to color.' },
});
// the roof needs room for ruffle and rae: clear the shelf coral just there
for (let i = SHELF_CORALS.length - 1; i >= 0; i--) {
  const c = SHELF_CORALS[i];
  if (c.by === RUFFLE_D && (Math.abs(c.x - RUFFLE_X) < 28 || Math.abs(c.x - RAE_REEF_X) < 14)) SHELF_CORALS.splice(i, 1);
}

/* ── helpers ── */
const schoolDone = () => questState.schoolbell === 'done' && questState.shelby === 'done' && questState.nib === 'done';
const raeArrived = () => care.stage === 'diving' && rae.away && !care.path.length;
const cureReady = () => care.cold && care.fed && care.shade;
// how well ruffle is: 1 healthy, 0 pale; she comes back over CURE_FRAMES
function ruffleHealth() {
  if (care.stage === 'none' || care.stage === 'cured' || care.stage === 'done') return 1;
  return care.cureT ? Math.min(1, care.cureT / CURE_FRAMES) : 0;
}
// what's still missing, in rae's words
function careTodo() {
  const parts = [];
  if (!care.cold) parts.push(hasItem('coldjar') ? 'the cold water you just got' : 'cold water from the very bottom of the shaft by the net, west past the school (fill my jar)');
  if (!care.fed) parts.push(hasItem('tonic') ? "ollie's tonic" : 'something to eat from ollie, who gardens the bay on the mainland side');
  if (!care.shade) parts.push('shade: swim into the bait ball, slow, and lead it over the roof');
  return parts;
}
function careDesc() {
  const Q = QUESTS.ruffle;
  if (care.stage === 'sick' || care.stage === 'asked') Q.desc = "old ruffle, the anemone on the long hall roof, has gone pale and stopped waving. flick says rae, the fox who surfs off the island, knows the water. go and get her.";
  else if (care.stage === 'diving' && !care.briefed) Q.desc = "rae's coming down to the reef in her own helmet. meet her on the long hall roof, by old ruffle.";
  else if (care.stage === 'diving') {
    const t = careTodo();
    Q.desc = t.length ? 'ruffle needs: ' + t.join(' · ') + '. bring things to rae, on the long hall roof.' : 'everything ruffle needs is there. watch her.';
  } else Q.desc = 'old ruffle is waving again. rae swam home to her island.';
}
function careStage(s) { care.stage = s; careDesc(); renderMenu(); }

/* ── rae goes down to the reef, and comes home again ── */
function raeToReef(now) {
  rae.away = true; rae.mode = 'reef'; rae.wave = null; rae.ashore = false;
  if (now) { rae.x = RAE_REEF_X; care.rd = RUFFLE_D; care.path = []; }
  else { care.rd = 0; care.path = RAE_DOWN.map(p => p.slice()); }
}
function raeHome() {
  rae.away = false; rae.mode = 'walk'; rae.x = Math.max(rae.x, SURF_X1 + 12); care.path = []; care.rd = 0; care.returning = false;
  careStage('done');
}
function updateRaeReef() {
  if (!rae.away) return;
  rae.ashore = false; rae.mode = 'reef';
  if (!care.path.length) {
    if (care.returning) raeHome();
    return;
  }
  if (talkHeld() === rae) return;   // she stops to talk
  const [tx, td] = care.path[0], sp = rae.x > SURF_X1 ? 1.6 : 1.3;
  const dx = tx - rae.x, dd = td - care.rd, dist = Math.hypot(dx, dd);
  if (dist <= sp) {
    rae.x = tx; care.rd = td; care.path.shift();
    if (!care.path.length && care.stage === 'diving' && underSea() && Math.abs(player.wx - rae.x) < 400 && !talkHeld())
      say(rae, "made it! hi, ruffle. hi, flick. …oh, she's warm. come here, talk to me.");
  } else { rae.x += dx / dist * sp; care.rd += dd / dist * sp; }
}
const _raeY = raeY;
raeY = function () { return rae.away ? Math.min(groundY(rae.x), seaY() + care.rd) : _raeY(); };

/* ── the bait ball: lead it over the roof ── */
function steerSwarm(x, d, k) {
  const s = SWARM.steer || (SWARM.steer = { x: SWARM.x, d: SWARM.d });
  s.x += (x - s.x) * k; s.d += (d - s.d) * k;
}
function updateCareSwarm() {
  const wy = seaY(), pd = player._py - 30 * playerScale() - wy, px = player.wx;
  const want = care.stage === 'diving' && care.briefed && !care.shade;
  if (care.shade && (care.stage === 'diving' || care.stage === 'cured')) { steerSwarm(SHADE_X, SHADE_D, 0.03); return; }
  if (care.lead) {
    const s = SWARM.steer;
    if (!want || !underSea() || Math.hypot(px - s.x, pd - s.d) > 230) {
      care.lead = false;
      if (want) showHint('the bait ball loses interest and drifts back to its rounds. slower!', 3000);
    } else {
      steerSwarm(Math.max(13450, Math.min(14420, px)), Math.max(45, Math.min(170, pd)), 0.022);
      if (Math.hypot(s.x - SHADE_X, s.d - SHADE_D) < 55) {
        care.lead = false; care.shade = true; careDesc(); renderMenu();
        if (rae.away && !talkHeld()) say(rae, cureReady() ? "LOOK at that. a parasol made of fish. that's everything — now we wait. watch her." : 'LOOK at that. a parasol made of fish. ruffle, you\'re famous.');
      }
      return;
    }
  } else if (want && underSea() && ((px - SWARM.x) / 90) ** 2 + ((pd - SWARM.d) / 50) ** 2 < 1) {
    care.lead = true; steerSwarm(SWARM.x, SWARM.d, 0);
    showHint('the bait ball is following you. lead it to old ruffle, nice and slow.', 3600);
    return;
  }
  if (SWARM.steer) {   // let go: back to its figure-eight
    const t = tick * 0.0035, nx = 13740 + Math.sin(t) * 120, nd = 95 + Math.sin(t * 2) * 28;
    steerSwarm(nx, nd, 0.02);
    if (Math.hypot(SWARM.steer.x - nx, SWARM.steer.d - nd) < 30) SWARM.steer = null;   // (close enough: the fish ease the rest)
  }
}

/* ── the cure ── */
function updateCure() {
  if (care.stage === 'diving' && raeArrived() && cureReady() && !care.cureT) care.cureT = 1;
  if (care.cureT && care.stage === 'diving') {
    care.cureT++;
    if (care.cureT === 120 && !talkHeld()) say(flick, "she's — she's going PINK. she's going pink again!");
    if (care.cureT >= CURE_FRAMES) cureDone();
  }
  if (care.stage === 'cured' && rae.away && !care.returning && talkHeld() !== rae && --care.leaveT <= 0) {
    care.path = RAE_UP.map(p => p.slice()); care.returning = true;
    if (talkHeld() !== flick) say(rae, "see you up top! i'll light the fire. ruffle — keep waving.");
  }
}
function cureDone() {
  care.cureT = 0; careStage('cured'); care.leaveT = 60 * 14;
  completeQuest('ruffle'); achieve('reefmedic');
  say(flick, "she's WAVING! ruffle's waving! at YOU! — here. this is from both of us. it was going to be a doorstop.", Math.abs(player.wx - RUFFLE_X) < 140);
  setTimeout(() => give('pearl', 'flick'), 900);
  setTimeout(() => { if (rae.away && !talkHeld()) say(rae, "look at her go. i've surfed over this reef my whole life and never once looked down. i'm going to look down more."); }, 5200);
}

/* ── flick: around ruffle (pale: close and still; well: loops; cured: zooms) ── */
function updateFlick() {
  const h = ruffleHealth(), t = tick;
  let tx, td;
  if (h < 0.5) { tx = RUFFLE_X - 18 + Math.sin(t * 0.012) * 4; td = RUFFLE_D - 22 + Math.sin(t * 0.02) * 2; }
  else { const f = care.stage === 'cured' ? 0.06 : 0.025; tx = RUFFLE_X + Math.sin(t * f) * 26; td = RUFFLE_D - 34 + Math.sin(t * f * 2) * 10; }
  flick.vx = tx - flick.x; flick.x += (tx - flick.x) * 0.08; flick.d += (td - flick.d) * 0.08;
  // pale ruffle, nobody's asked yet: flick calls out when you're close
  if (care.stage === 'sick' && underSea() && Math.abs(player.wx - RUFFLE_X) < 380 && !talkHeld() && !speaking(flick) && --care.callT <= 0) {
    care.callT = 60 * 9;
    say(flick, ['ruffle? ruffle, wave. please wave.', 'is anybody there? anybody at ALL?', "she's never been this color. she's never been NO color."][care.flickLi++ % 3]);
  }
}

const _updateSea = updateSea;
updateSea = function () {
  updateCareSwarm();   // (before the sea moves the bait ball)
  _updateSea();
  if (care.stage === 'none' && schoolDone() && (!player.inWater || Math.abs(player.wx - RUFFLE_X) > W * 0.6 + 100)) careStage('sick');   // when you're not looking
  updateRaeReef();
  updateCure();
  updateFlick();
};

/* ══════════════════════════════════════════
   DIALOGUE
══════════════════════════════════════════ */
const FLICK_CALM = [
  "this is old ruffle. she's older than the school. she's older than the long hall! she waves at everyone.",
  "i'm flick. i live in ruffle. she lets me. she's very ticklish, but she lets me.",
  'the roof of the long hall gets the most sun in the whole city. ruffle likes sun. i like ruffle.',
];
const FLICK_WAIT = [
  'a fox! in a bubble! ruffle, look, there\'s a fox in a bubble.',
  "rae says ruffle's too warm. i didn't know you could be too warm. i'm going to worry about it now.",
  "i'd help, but if i leave her, she'll worry. we take turns worrying.",
];
const FLICK_WELL = [
  "she waved at me this morning. and this afternoon. she's making up for lost waving.",
  'the bait ball comes by every day now. ruffle waves at it. it waves back. well. it swirls.',
  "you're always welcome on the roof. ruffle says so. well. she waves so.",
];
function talkFlick() {
  let line, more = false;
  if (care.stage === 'none') line = FLICK_CALM[flick.li++ % FLICK_CALM.length];
  else if (care.stage === 'sick') {
    if (!flick.stage) { flick.stage = 1; more = true; line = "please — help! old ruffle's gone all pale. she's not waving. she ALWAYS waves. she waved at a turtle once for a whole afternoon."; }
    else {
      line = "the turtles say there's a fox up top. the one who rides the waves. she knows the water better than anybody. rae! please go and get rae. she's on the island, right above us.";
      flick.stage = 0; startQuest('ruffle'); careStage('asked');
    }
  } else if (care.stage === 'asked') line = "rae! the fox on the island, right up top. she'll know what to do. please hurry. i'm being brave, but my fins aren't.";
  else if (care.stage === 'diving' && !raeArrived()) line = "is she coming? is that her? …that's a turtle. is THAT her?";
  else if (care.stage === 'diving') line = care.cureT ? "shh. she's coming back. i can see it. i can SEE it." : care.shade && flick.li % 2 ? "it's dark and cool and full of fish. ruffle loves it. the fish are a bit rude." : FLICK_WAIT[flick.li++ % FLICK_WAIT.length];
  else line = FLICK_WELL[flick.li++ % FLICK_WELL.length];
  say(flick, line, true, { next: more && talkFlick });
}

// rae, on the island: flick sent you
const RAE_ASKED = [
  "old ruffle? on the long hall roof? pale, and not waving? …oh no. that's the water. the swell's been lazy all week, and lazy water goes warm, and an anemone hates a warm bath.",
  "okay. OKAY. i'm coming down. i've got a helmet! i made it: a glass float off an old fishing net, and a LOT of rope. meet me on the roof of the long hall.",
];
const _talkToRaeCare = talkToRae;
talkToRae = function () {
  if (care.stage === 'asked' && rae.stage >= RAE_INTRO.length && !surf.toast) {
    say(rae, RAE_ASKED[0], true, { next: () => { say(rae, RAE_ASKED[1], true); careStage('diving'); raeToReef(false); } });
    return;
  }
  _talkToRaeCare();
};

// rae, down in the reef
const RAE_BRIEF = [
  "oh, ruffle. you poor old thing. …feel that? the water up here's like a bath. she's cooking. and she's hungry, and the sun won't leave her alone.",
  "she needs three things. one: cold water from the very bottom. the deep wells up at the foot of the shaft by the net — west, past the school, all the way down. here, take my jar. it's birch's. don't tell birch.",
  "two: food. ollie, the octopus who gardens the bay over on the mainland side. birch says he has a cure for everything. three: shade. the bait ball follows anything interesting. swim into the middle of it, slow, and lead it over here.",
];
const RAE_REEF = [
  "i've surfed over this city my whole life. i never knew it had a ROOF.",
  "this helmet fogs up when i'm excited. i'm excited a lot. it's very foggy.",
  "flick's been telling me everyone's names. i've forgotten all of them. i'm nodding a lot.",
];
function talkRaeReef() {
  const lines = [];
  if (care.stage === 'cured') lines.push("she's waving at me. i'm waving back. we could be here all day. …i'm heading up soon. come by the fire.");
  else if (!raeArrived()) lines.push("on my way! the long hall roof, right? which one's the long hall? …oh. the long one.");
  else if (!care.briefed) {
    lines.push(...RAE_BRIEF); care.briefed = true; careDesc();
    setTimeout(() => give('jar', 'rae'), 900);
  } else if (care.cureT) lines.push("shh. watch her. …she's coming back.");
  else {
    if (hasItem('coldjar')) { takeItem('coldjar'); care.cold = true; lines.push('the cold! pour it slow… there. feel that? that\'s the deep, saying hello.'); }
    if (hasItem('tonic')) { takeItem('tonic'); care.fed = true; lines.push("ollie's tonic? what's in it? …kelp. it smells like kelp. she's eating it! she's EATING it."); }
    const t = careTodo();
    if (lines.length) careDesc();
    if (!t.length) lines.push("that's everything. now we wait. …watch her.");
    else if (lines.length || care.li++ % 3 !== 2) lines.push(`${['', 'one more thing', 'two more things', 'three things'][t.length]}: ${t.length > 1 ? t.slice(0, -1).join('; ') + '; and ' + t[t.length - 1] : t[0]}.`);
    else lines.push(RAE_REEF[(care.li / 3 | 0) % RAE_REEF.length]);
  }
  const chain = i => say(rae, lines[i], true, { next: i + 1 < lines.length && (() => chain(i + 1)) });
  chain(0);
}

// ollie, in the bay: the tonic
function talkOllieCare() {
  if (hasItem('tonic')) { say(ollie, "take it to her! tell her it's from ollie. she won't know who that is. tell her anyway.", true); return; }
  say(ollie, "a pale anemone? in the big reef city? oh, the poor dear. she's cooking. it happens when the swell goes lazy.", true, {
    next: () => { say(ollie, 'here — my coral tonic. brine shrimp, a pinch of kelp, and a secret ingredient. …the secret is more kelp. gerald helped. gerald is a rock.', true); setTimeout(() => give('tonic', 'ollie'), 900); },
  });
}

// miss coralie: points you up to the roof, once
const _talkCoralieCare = talkCoralie;
talkCoralie = function () {
  if (care.stage === 'sick' && !care.told && !hasItem('bell')) {
    care.told = true;
    say(coralie, "oh — before you go. flick came by in tears. old ruffle, the anemone on the roof of the long hall, has gone pale. would you look in on them? it's just east of the schoolyard.", true);
    return;
  }
  _talkCoralieCare();
};

// the compass points at whoever's waiting
function careCompass() {
  if (care.stage === 'asked') return rae.x;
  if (care.stage !== 'diving' || !care.briefed) return RUFFLE_X;
  if (hasItem('jar')) return DEEP_X;
  if (!care.fed && !hasItem('tonic')) return ollie.x;
  if (!care.shade) return SWARM.x;
  return RUFFLE_X;
}
const _compassTargetCare = compassTarget;
compassTarget = function () { return openQuests()[0] === 'ruffle' ? careCompass() : _compassTargetCare(); };

OUT_SPOTS.unshift(() => {
  if (scene !== 'outside') return null;
  if (rae.away) {   // rae, in her helmet (on the sand or in the sea)
    const byRae = Math.abs(player.wx - rae.x) < 50 && Math.abs(player._py - raeY()) < 70 && (underSea() || player.onGround);
    const byRuffle = near(RUFFLE_X, seaY() + RUFFLE_D, 45, 60) && Math.abs(player.wx - RUFFLE_X) < Math.abs(player.wx - rae.x);
    if (byRae && !byRuffle) return { text: 'press E to talk to rae', act: talkRaeReef };
  }
  if (!underSea()) return null;
  if (near(RUFFLE_X, seaY() + RUFFLE_D, 45, 60)) return { text: met.flick ? 'press E to talk to flick' : 'press E to talk to the little clownfish', act: talkFlick };
  if (nearOllie() && care.stage === 'diving' && care.briefed && !care.fed) return { text: 'press E to talk to ollie', act: talkOllieCare };
  if (player.wx > DEEP_X0 && player.wx < DEEP_X1 && player._py > groundY(player.wx) - 80) {
    if (hasItem('jar')) return { text: "press E to fill rae's jar with the cold from the deep", act: () => { takeItem('jar'); give('coldjar'); careDesc(); showHint('brr. bring it back to rae, on the long hall roof.', 3200); } };
    return { text: 'cold water wells up from the deep here. brr.' };
  }
  return null;
});

/* ══════════════════════════════════════════
   DRAW
══════════════════════════════════════════ */
// a clownfish (drawCritter kind 'clownfish': feet at y, like everyone else)
function drawClownfish(x, y, k, dir) {
  const wg = Math.sin(tick * 0.25) * 1.2;
  ctx.save(); ctx.translate(x, y); ctx.scale(k * dir, k); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(240,128,48,0.97)'; ctx.strokeStyle = 'rgba(40,20,12,0.85)'; ctx.lineWidth = 1.1 / k;
  ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-18, -7 + wg); ctx.quadraticCurveTo(-15, 0, -18, 7 + wg); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-7, -5); ctx.quadraticCurveTo(-1, -13, 6, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
  const body = () => { ctx.beginPath(); ctx.ellipse(0, 0, 12, 7.5, 0, 0, 7); };
  body(); ctx.fill();
  ctx.save(); body(); ctx.clip();
  [[6.5, 3], [-1, 3.4], [-8.5, 2.4]].forEach(([bx, bw]) => {
    ctx.fillStyle = 'rgba(252,250,245,0.97)'; ctx.fillRect(bx - bw / 2, -9, bw, 18);
    ctx.strokeStyle = 'rgba(30,18,12,0.75)'; ctx.lineWidth = 0.8 / k; ctx.strokeRect(bx - bw / 2, -9, bw, 18);
  });
  ctx.restore();
  ctx.strokeStyle = 'rgba(40,20,12,0.85)'; ctx.lineWidth = 1.1 / k; body(); ctx.stroke();
  ctx.fillStyle = 'rgba(250,160,80,0.95)'; ctx.beginPath(); ctx.ellipse(2, 3.5, 3.6, 2, 0.6 + wg * 0.1, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(15,12,12,0.95)'; ctx.beginPath(); ctx.arc(8.6, -1.6, 1.7, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,240,0.85)'; ctx.beginPath(); ctx.arc(9.1, -2.2, 0.6, 0, 7); ctx.fill();
  ctx.restore();
}
const _drawCritterCare = drawCritter;
drawCritter = function (x, y, kind, o) {
  if (kind !== 'clownfish') return _drawCritterCare(x, y, kind, o);
  o = o || {}; const k = (o.scale || 1) * 1.3;
  drawClownfish(x, y - 10 * k, k, o.dir || 1);
};

// rae's own helmet: a sea-glass fishing float, netted in rope, with its cork still in the top
function drawRaeHelmet(x, y, k) {
  ctx.save(); ctx.lineCap = 'round';
  const R = 18 * k;
  ctx.fillStyle = 'rgba(140,215,170,0.1)'; ctx.strokeStyle = 'rgba(170,235,195,0.8)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.clip();
  ctx.strokeStyle = 'rgba(215,180,120,0.42)'; ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(x + i * 15 * k - R, y - R); ctx.lineTo(x + i * 15 * k + R, y + R); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + i * 15 * k + R, y - R); ctx.lineTo(x + i * 15 * k - R, y + R); ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, R - 4 * k, -2.5, -1.7); ctx.stroke();
  ctx.fillStyle = 'rgba(200,150,90,0.98)'; ctx.strokeStyle = 'rgba(120,85,45,0.9)'; ctx.lineWidth = 1;   // the cork
  ctx.beginPath(); ctx.ellipse(x, y - R - 1 * k, 4 * k, 3 * k, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(205,165,105,0.98)';   // a rope collar
  ctx.beginPath(); ctx.ellipse(x, y + R - 2 * k, 13 * k, 3.6 * k, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,85,45,0.7)';
  for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(x + i * 2.3 * k - 1, y + R - 5 * k); ctx.lineTo(x + i * 2.3 * k + 1, y + R + 1 * k); ctx.stroke(); }
  ctx.restore();
}
function drawCareRae() {
  if (!rae.away) return;
  const sx = rae.x - camX; if (sx < -80 || sx > W + 80) return;
  const y = raeY(), k = 1, wet = rae.x < SURF_X1 && care.rd > 4;
  let hx, hy;
  if (wet && care.path.length) {   // swimming: stretched out along the way she's going
    const [tx, td] = care.path[0], d = tx < rae.x ? -1 : 1, down = Math.max(-0.5, Math.min(0.5, (td - care.rd) / 80));
    const a = d * (Math.PI / 2 * 0.78) + d * down * 0.6, kick = Math.sin(tick * 0.2) * 0.04;
    ctx.save(); ctx.translate(sx, y - 14); ctx.rotate(a + kick);
    drawCritter(0, 0, rae.kind, { color: rae.color, dir: d, scale: 0.95 });
    const px = 8 * 0.95 * d, py = -35 * 0.95;
    drawRaeHelmet(px, py, 0.95);
    ctx.restore();
    hx = sx + px * Math.cos(a) - py * Math.sin(a); hy = y - 14 + px * Math.sin(a) + py * Math.cos(a);
  } else {
    const d = care.path.length ? (care.path[0][0] < rae.x ? -1 : 1) : faceToward(rae.x, -1), bob = wet ? Math.sin(tick * 0.04) * 1.5 : 0;
    drawCritter(sx, y + bob, rae.kind, { color: rae.color, dir: d, scale: k, talking: speaking(rae) });
    hx = sx + 8 * k * d; hy = y + bob - 35 * k;
    drawRaeHelmet(hx, hy, k);
  }
  if (wet) {   // a trickle of bubbles from the cork
    ctx.strokeStyle = 'rgba(200,240,250,0.6)'; ctx.lineWidth = 0.8;
    for (let i = 0; i < 4; i++) {
      const f = ((tick * 0.7 + i * 22) % 88) / 88, by = hy - 20 - f * 70, bx = hx + Math.sin(tick * 0.08 + i * 2) * 3;
      ctx.globalAlpha = 1 - f; ctx.beginPath(); ctx.arc(bx, by, 1.2 + i * 0.4, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

// old ruffle: a big old anemone. pale and drooping when she's sick, pink and waving when she's well
function drawRuffle() {
  const sx = RUFFLE_X - camX; if (sx < -120 || sx > W + 120) return;
  const b = seaY() + RUFFLE_D + 1, h = ruffleHealth();
  const mix = (a, c) => a.map((v, i) => Math.round(v + (c[i] - v) * h)).join(',');
  const stem = mix([168, 162, 156], [176, 70, 112]), arm = mix([200, 196, 190], [222, 100, 160]), tip = mix([228, 226, 220], [255, 208, 120]);
  if (h > 0.05) drawGlow(sx, b - 26, 60, 0.22 * h, [255, 140, 190]);
  ctx.save(); ctx.lineCap = 'round';
  ctx.fillStyle = `rgba(${stem},0.95)`;
  ctx.beginPath(); ctx.moveTo(sx - 13, b); ctx.quadraticCurveTo(sx - 15, b - 9, sx - 10, b - 14); ctx.lineTo(sx + 10, b - 14); ctx.quadraticCurveTo(sx + 15, b - 9, sx + 13, b); ctx.closePath(); ctx.fill();
  const wave = care.stage === 'cured' || care.stage === 'done' ? Math.sin(tick * 0.05) * 0.22 : 0, n = 24;
  for (let pass = 0; pass < 2; pass++) for (let i = pass; i < n; i += 2) {
    const u = i / (n - 1) - 0.5, L = (30 + hash(i * 3.3 + 7) * 14) * (0.8 + 0.2 * h), sp = 0.3 + 0.7 * h;
    const a = u * 2.5 * (1 + 0.35 * (1 - h)) + Math.sin(tick * 0.035 * sp + i * 0.7) * (0.05 + 0.18 * h) + wave;
    const bx = sx + u * 18, by = b - 13, droop = (1 - h) * L;
    const tx = bx + Math.sin(a) * L * (1 - 0.15 * (1 - h)), ty = Math.min(b - 3, by - Math.cos(a) * L + droop * (0.3 + 0.6 * Math.abs(Math.sin(a))));   // limp, flopped over, but not through the roof
    const cx = bx + Math.sin(a) * L * 0.45, cy = by - Math.cos(a) * L * 0.65;
    ctx.strokeStyle = `rgba(${arm},${pass ? 0.95 : 0.65})`; ctx.lineWidth = pass ? 3.8 : 3.4;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(cx, cy, tx, ty); ctx.stroke();
    ctx.fillStyle = `rgba(${tip},0.95)`; ctx.beginPath(); ctx.arc(tx, ty, 2.4, 0, 7); ctx.fill();
    if (h > 0.4 && pass) drawGlow(tx, ty, 8, 0.25 * h, [255, 200, 130]);
  }
  // sparkles while she comes back
  if (care.cureT) for (let i = 0; i < 6; i++) {
    const f = ((tick * 0.6 + i * 17) % 60) / 60, px = sx + Math.sin(i * 2.3 + tick * 0.01) * 28, py = b - 20 - f * 50;
    drawGlow(px, py, 6, 0.6 * (1 - f), [255, 220, 240]);
  }
  ctx.restore();
}
// where the deep wells up: a crack at the bottom of the shaft, with cold shimmering out of it
function drawDeepCold() {
  const sx = DEEP_X - camX; if (sx < -80 || sx > W + 80) return;
  const gy = groundY(DEEP_X), want = hasItem('jar');
  drawGlow(sx, gy - 10, want ? 60 : 40, want ? 0.3 + 0.08 * Math.sin(tick * 0.06) : 0.14, [150, 205, 255]);
  ctx.save();
  const col = ctx.createLinearGradient(0, gy, 0, gy - 180);   // a column of cold, shimmering up out of the crack
  col.addColorStop(0, `rgba(170,220,255,${want ? 0.32 : 0.2})`); col.addColorStop(1, 'rgba(170,220,255,0)');
  const sw = Math.sin(tick * 0.02) * 4;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(sx - 14, gy - 2); ctx.quadraticCurveTo(sx - 20 + sw, gy - 90, sx - 26 + sw, gy - 180); ctx.lineTo(sx + 26 + sw, gy - 180); ctx.quadraticCurveTo(sx + 20 + sw, gy - 90, sx + 14, gy - 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(4,8,18,0.9)'; ctx.beginPath(); ctx.ellipse(sx, gy - 1, 16, 4, 0, 0, 7); ctx.fill();
  ctx.lineCap = 'round'; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const f = ((tick * 0.5 + i * 23) % 180) / 180, y = gy - 4 - f * 170, x = sx - 14 + i * 4 + Math.sin(tick * 0.03 + i) * 6;
    ctx.strokeStyle = `rgba(205,240,255,${(want ? 0.95 : 0.7) * (1 - f)})`;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 5, y - 7, x, y - 14); ctx.stroke();
    if (i % 2) { ctx.fillStyle = `rgba(230,248,255,${0.8 * (1 - f)})`; ctx.beginPath(); ctx.arc(x + 6, y - 20, 1.3, 0, 7); ctx.fill(); }
  }
  ctx.restore();
}
function drawReefCare() {
  if (camX + W > CITY_X0 - 120 && camX < CITY_X1 + 120) {
    drawDeepCold();
    drawRuffle();
    if (Math.abs(flick.x - camX - W / 2) < W) drawCritter(flick.x - camX, seaY() + flick.d + 7, 'clownfish', { scale: 0.62, dir: Math.abs(flick.vx || 0) > 0.05 ? Math.sign(flick.vx) : faceToward(flick.x, 1) });
  }
  drawCareRae();
}
const _drawSeaBackCare = drawSeaBack;
drawSeaBack = function () { _drawSeaBackCare(); drawReefCare(); };

/* ══════════════════════════════════════════
   SAVE
══════════════════════════════════════════ */
saveRegister({
  key: 'reefcare',
  get: () => ({ stage: care.stage, briefed: care.briefed, cold: care.cold, fed: care.fed, shade: care.shade, told: care.told }),
  set: v => {
    if (!svObj(v)) return;
    ['briefed', 'cold', 'fed', 'shade', 'told'].forEach(f => { if (typeof v[f] === 'boolean') care[f] = v[f]; });
    let s = CARE_STAGES.includes(v.stage) ? v.stage : 'none';
    if (s === 'cured') s = 'done';   // she'd already swum home
    care.stage = s; care.cureT = 0; care.lead = false; care.path = []; care.returning = false;
    if (s === 'diving') { raeToReef(true); if (care.shade) SWARM.steer = { x: SHADE_X, d: SHADE_D }; }
    careDesc();
  },
});
// save.js puts rae back on her beach after loading (svSettle): if she was down in the reef, she's still there
const _svSettleCare = svSettle;
svSettle = function () { _svSettleCare(); if (care.stage === 'diving') raeToReef(true); };
careDesc();
