/* ══════════════════════════════════════════
   CHAPTERS — a title card the first time you reach each part of the story:
   one · the woods (from the start), two · the island (once you're ashore
   there), three · the reef city (once you swim down into it).
   Saved (saveRegister 'chapters') so each card only ever shows once.
══════════════════════════════════════════ */
const CHAPTERS = [
  { n: 'one',   name: 'the woods',     here: () => true },
  { n: 'two',   name: 'the island',    here: () => scene === 'outside' && player.wx > SEA_X1 && !player.inWater },
  { n: 'three', name: 'the reef city', here: () => underSea() && player.wx > CITY_X0 && player.wx < CITY_X1 && player._py > seaY() + 150 },
];
const chap = { seen: [], el: null, t: 0 };

function showChapter(i) {
  chap.seen[i] = true;
  if (!document.body || !document.createElement) return;
  if (!chap.el) { chap.el = document.createElement('div'); chap.el.id = 'chapter'; document.body.appendChild(chap.el); }
  chap.el.innerHTML = `<div class="ch-n">chapter ${CHAPTERS[i].n}</div><div class="ch-name">${CHAPTERS[i].name}</div>`;
  chap.el.classList.remove('show'); void chap.el.offsetWidth; chap.el.classList.add('show');
  clearTimeout(chap.t); chap.t = setTimeout(() => chap.el.classList.remove('show'), 4200);
}
function updateChapters() {
  if (!started || transitioning) return;
  // in story order: a later card waits until the earlier ones have shown
  const i = chap.seen.length;
  if (i < CHAPTERS.length && CHAPTERS[i].here()) showChapter(i);
}

const _updateIslandCh = updateIsland;
updateIsland = function () { _updateIslandCh(); updateChapters(); };

saveRegister({
  key: 'chapters',
  get: () => chap.seen.length,
  set: v => { if (typeof v === 'number') chap.seen = Array.from({ length: Math.max(0, Math.min(CHAPTERS.length, v | 0)) }, () => true); },
});
