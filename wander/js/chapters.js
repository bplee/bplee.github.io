/* ══════════════════════════════════════════
   CHAPTERS — a title card the first time you reach each part of the story:
   one · the woods (from the start), two · the island (once you're ashore
   there), three · the reef city (once you swim down into it).
   Saved (saveRegister 'chapters') so each card only ever shows once.

   THE CHAPTER MENU (top left) — shows the chapter you're in. click it for
   every chapter you've reached: pick one to play it again from its start,
   and come back to your furthest save whenever you like.
   · its own storage key (CH_KEY), apart from the save: { starts, reached, best, announce }
     starts[i]: the save as it was when chapter i began (chapter one: a blank save)
     best:      your furthest save, put aside while you replay an earlier chapter
                (dropped once the replay gets further than it)
     announce:  show this chapter's card after the reload that jumps you there
   · jumping = write the chosen save as THE save, reload (nothing saved on the way out)
══════════════════════════════════════════ */
const CHAPTERS = [
  { n: 'one',   name: 'the woods',     here: () => true },
  // the moment you step off the boat at rae's island (or wade ashore there)
  { n: 'two',   name: 'the island',    here: () => boat.crossed || (scene === 'outside' && player.wx > SEA_X1 && !player.inWater),
    startHere: () => scene === 'outside' && player.wx > SEA_X1 },
  { n: 'three', name: 'the reef city', here: () => underSea() && player.wx > CITY_X0 && player.wx < CITY_X1 && player._py > seaY() + 150 },
];
const chap = { seen: [], el: null, t: 0, pending: null, open: false, arm: null, sig: '', ui: null };

/* ── the chapter book (its own storage key) ── */
const CH_KEY = 'wander.chapters';
function chLoad() {
  let m = null;
  try { const s = svStore(); m = s ? JSON.parse(s.getItem(CH_KEY) || 'null') : null; } catch (e) { m = null; }
  if (!svObj(m)) m = {};
  return { starts: svObj(m.starts) ? m.starts : {}, reached: svNum(m.reached) ? m.reached : 0,
           best: svObj(m.best) ? m.best : null, announce: svNum(m.announce) ? m.announce : null };
}
const chBook = chLoad();
function chKeep() { try { const s = svStore(); if (!s) return false; s.setItem(CH_KEY, JSON.stringify(chBook)); return true; } catch (e) { return false; } }

// how far along a save is: chapters first, then quests done, quests begun, achievements, things found
function chScore(d) {
  if (!svObj(d)) return 0;
  const q = svObj(d.quests) ? Object.values(d.quests) : [];
  return (d.chapters | 0) * 1e6 + q.filter(v => v === 'done').length * 1e3 + q.length * 100
       + Object.keys(svObj(d.achieved) ? d.achieved : {}).length * 10 + Object.keys(svObj(d.inv) && svObj(d.inv.owned) ? d.inv.owned : {}).length;
}
const chReached = () => Math.max(chap.seen.length, chBook.reached, svObj(chBook.best) ? chBook.best.chapters | 0 : 0);
const chCanJump = i => i === 0 || svObj(chBook.starts[i]);

/* ── the title card ── */
function chCard(i) {
  if (!document.body || !document.createElement) return;
  if (!chap.el) { chap.el = document.createElement('div'); chap.el.id = 'chapter'; document.body.appendChild(chap.el); }
  chap.el.innerHTML = `<div class="ch-n">chapter ${CHAPTERS[i].n}</div><div class="ch-name">${CHAPTERS[i].name}</div>`;
  chap.el.classList.remove('show'); void chap.el.offsetWidth; chap.el.classList.add('show');
  clearTimeout(chap.t); chap.t = setTimeout(() => chap.el.classList.remove('show'), 4200);
}
function showChapter(i) {
  chap.seen[i] = true;
  if (i > 0 && !chBook.starts[i]) chap.pending = i;   // keep this chapter's start (chCapture, once you're somewhere safe)
  chBook.reached = Math.max(chBook.reached, i + 1); chKeep();
  chCard(i);
}
// the start of a chapter is kept as a save you can come back to: only from a safe spot
// (stepping off the boat on the island), or, underwater, from the last dry ground (svSpot falls back to SAVE.safe)
function chCapture() {
  const i = chap.pending;
  if (i === null) return;
  const c = CHAPTERS[i];
  if (c.startHere && !c.startHere()) { chap.pending = null; return; }   // reached it on an old save, somewhere else: no start to keep
  if (!svSafeSpot() && !(underSea() && SAVE.safe)) return;
  chap.pending = null;
  if (chBook.starts[i]) return;
  try { chBook.starts[i] = svBuild(); chKeep(); } catch (e) {}
}

function updateChapters() {
  if (!started || transitioning) return;
  // in story order: a later card waits until the earlier ones have shown
  const i = chap.seen.length;
  if (i < CHAPTERS.length && CHAPTERS[i].here()) showChapter(i);
}
// every frame, in any scene (riding along on saveTick): the card after a jump, a chapter start to keep,
// the furthest save, the menu
function tickChapters() {
  if (!started || transitioning) return;
  if (chBook.announce !== null) { const a = chBook.announce; chBook.announce = null; chKeep(); if (CHAPTERS[a]) chCard(a); }
  chCapture();
  // replaying an earlier chapter and got further than your furthest save? then this is your furthest now
  if (chBook.best && SAVE.frames % 300 === 150) {
    try { if (chScore(svBuild()) > chScore(chBook.best)) { chBook.best = null; chKeep(); } } catch (e) {}
  }
  chRender();
}

const _updateIslandCh = updateIsland;
updateIsland = function () { _updateIslandCh(); updateChapters(); };
const _saveTickCh = saveTick;
saveTick = function () { _saveTickCh(); tickChapters(); };

saveRegister({
  key: 'chapters',
  get: () => chap.seen.length,
  set: v => { if (typeof v === 'number') chap.seen = Array.from({ length: Math.max(0, Math.min(CHAPTERS.length, v | 0)) }, () => true); },
});

/* ══════════════════════════════════════════
   JUMPING AROUND THE STORY
══════════════════════════════════════════ */
// write `data` as the save (null: a blank one) and reload into it
function chJump(data, announce) {
  if (!svStore()) return false;
  SAVE.off = true;   // nothing gets saved on the way out
  chBook.announce = announce;
  if (!chKeep()) { SAVE.off = false; return false; }
  if (data) svWrite(JSON.stringify({ v: SAVE_VERSION, t: Date.now(), data })); else svClear();
  try { location.reload(); } catch (e) {}
  return true;
}
// play chapter i again from its start. your furthest save is put aside first (if this is it).
function startChapter(i) {
  if (!CHAPTERS[i] || i >= chReached() || !chCanJump(i)) return false;
  try {
    const cur = svBuild();
    if (!chBook.best || chScore(cur) > chScore(chBook.best)) chBook.best = cur;
  } catch (e) {}
  return chJump(i === 0 ? null : chBook.starts[i], i);
}
// back to your furthest save
function returnToBest() {
  if (!chBook.best) return false;
  const d = chBook.best; chBook.best = null;
  return chJump(d, null);
}

// start over (the bag's button) starts the chapter book over too
if (typeof startOver === 'function') {
  const _startOverCh = startOver;
  startOver = function () { try { const s = svStore(); if (s) s.removeItem(CH_KEY); } catch (e) {} _startOverCh(); };
}

/* ══════════════════════════════════════════
   THE MENU (top left)
══════════════════════════════════════════ */
function chEnsureUI() {
  if (chap.ui || !document.body || !document.createElement) return chap.ui;
  const box = document.createElement('div'); box.id = 'chapters';
  document.body.appendChild(box);
  box.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target.closest('[data-ch]') : null;
    if (!t) return;
    e.stopPropagation();
    const a = t.getAttribute('data-ch');
    if (a === 'toggle') { chap.open = !chap.open; chap.arm = null; }
    else if (a === 'no') chap.arm = null;
    else if (a === 'best') { if (chap.arm === 'best') returnToBest(); else chap.arm = 'best'; }
    else if (a === 'yes') { if (chap.arm === 'best') returnToBest(); else if (typeof chap.arm === 'number') startChapter(chap.arm); }
    else if (/^\d+$/.test(a)) { const i = +a; if (chap.arm === i) startChapter(i); else if (chCanJump(i)) chap.arm = i; }
    if (t.blur) t.blur();
    chRender(true);
  });
  // a click anywhere else closes it
  document.addEventListener('pointerdown', e => {
    if (!chap.open || (e.target && e.target.closest && e.target.closest('#chapters'))) return;
    chap.open = false; chap.arm = null; chRender(true);
  }, true);
  return (chap.ui = box);
}

function chRender(force) {
  const n = chap.seen.length, R = chReached(), best = chBook.best;
  const sig = [n, R, best ? chScore(best) : 0, chap.open, chap.arm, Object.keys(chBook.starts).join(',')].join('|');
  if (!force && sig === chap.sig) return;
  chap.sig = sig;
  const box = chEnsureUI();
  if (!box) return;
  box.hidden = n === 0;
  if (!n) return;
  const cur = CHAPTERS[n - 1];
  let h = `<div class="ch-pill" data-ch="toggle">chapter ${cur.n}<span class="ch-pname"> · ${cur.name}</span> <span class="ch-caret">${chap.open ? '▴' : '▾'}</span></div>`;
  if (chap.open) {
    h += '<div class="ch-list">';
    for (let i = 0; i < Math.min(R, CHAPTERS.length); i++) {
      const c = CHAPTERS[i], here = i === n - 1, can = chCanJump(i);
      if (chap.arm === i) {
        h += `<div class="ch-row ch-ask"><span>start chapter ${c.n} over?</span>`
           + `<span class="ch-btns"><button data-ch="yes" tabindex="-1">yes</button><button data-ch="no" tabindex="-1">no</button></span></div>`;
        continue;
      }
      h += `<button class="ch-row${here ? ' ch-here' : ''}${can ? '' : ' ch-off'}" data-ch="${i}" tabindex="-1">`
         + `<span class="ch-num">${c.n}</span><span class="ch-name">${c.name}</span>`
         + `<span class="ch-tag">${here ? 'you are here' : can ? 'start over' : 'no save from its start'}</span></button>`;
    }
    h += '<div class="ch-sep"></div>';
    if (best) {
      const bc = CHAPTERS[Math.max(0, Math.min(CHAPTERS.length, best.chapters | 0) - 1)];
      h += chap.arm === 'best'
        ? `<div class="ch-row ch-ask"><span>back to your furthest save?</span><span class="ch-btns"><button data-ch="yes" tabindex="-1">yes</button><button data-ch="no" tabindex="-1">no</button></span></div>`
        : `<button class="ch-row ch-best" data-ch="best" tabindex="-1"><span class="ch-num">↩</span><span class="ch-name">your furthest save</span><span class="ch-tag">chapter ${bc.n}</span></button>`;
    } else {
      h += `<div class="ch-row ch-note"><span class="ch-num">✓</span><span class="ch-name">this is your furthest save</span></div>`;
    }
    h += '</div>';
  }
  box.innerHTML = h;
  box.classList.toggle('open', chap.open);
}
