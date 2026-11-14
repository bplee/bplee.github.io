/* ══════════════════════════════════════════
   SPEECH BUBBLES — shared by every scene
   · say(n, text, byPlayer, opt) opens a bubble on any NPC made by makeRegular.
   · a line you asked for (byPlayer, said while you're close) is HELD: it stays up
     until you dismiss it — E (or tapping the bubble / the action button) continues
     the conversation if there's more (opt.next), otherwise closes it; Esc closes it;
     walking off (or changing scene) closes it too. While it's up, E is the bubble's
     (the prompt over your head steps aside).
   · anything else (idle chatter, shouts, lines said from afar or on a timer) fades
     on its own, after a time that grows with the length of the line.
   · bubbles hang just below the speaker's feet, tail pointing up; they flip above
     when there's no room, keep clear of each other, the mouse's prompt, the hint box
     and the touch button, and always stay on screen.
   Fields on an NPC: bubble (text), bubbleT (frames left; held bubbles don't count
   down), bubbleHeld, bubbleShut (closing: fading out), bubbleAge, bubbleNext.
   n.at() → [x, feetY, headY] in world coords (set by the scene that owns the NPC).
══════════════════════════════════════════ */
const TALKERS = [];                 // every NPC that can talk (makeRegular registers them)
const talk = { cur: null, rects: [] };   // cur: the held bubble (only ever one) · rects: last frame's boxes, for taps
const BUBBLE_FADE = 14;             // frames to fade out
const WALK_AWAY = 140;              // get this far from whoever's talking and their bubble closes…
const WALK_OFF = 70;                // …or walk this far from where you stood (for folk who tag along, and so the
                                    //   next thing you walk up to gets your E)

const speaking = n => !!n.bubble && !n.bubbleShut;          // for mouths, "is anyone talking" checks
const bubbleAge = n => n.bubble ? n.bubbleAge : Infinity;
const talkHeld = () => talk.cur && talk.cur.bubbleHeld ? talk.cur : null;
function talkDist(n) {
  const p = n.at ? n.at() : [n.x, player._py];
  return Math.hypot(player.wx - p[0], (player._py - p[1]) * 0.5);
}
// how long an unprompted line stays up: longer lines get longer (3.5s .. 10s)
const ambientFrames = text => Math.max(210, Math.min(600, 150 + text.length * 4));

// say(): show a speech bubble. byPlayer = you pressed E on them (so you've "met").
// opt.hold: force held (true) or timed (false) · opt.next: E calls this to continue
// (return false from it to say "not yet") · opt.t: frames, for a timed line
function say(n, text, byPlayer, opt) {
  opt = opt || {};
  if (byPlayer) meet(n.name, text);
  const d = talkDist(n);
  const hold = opt.hold != null ? opt.hold : !!byPlayer && d <= WALK_AWAY + 20;
  if (hold && talk.cur && talk.cur !== n) shutBubble(talk.cur);
  if (!hold && talk.cur === n) talk.cur = null;
  Object.assign(n, {
    bubble: text, bubbleHeld: hold, bubbleShut: false, bubbleAge: 0, bubbleScene: scene,
    bubbleNext: hold && opt.next || null, bubbleD0: d, bubbleX0: player.wx,
    bubbleT: hold ? Infinity : (opt.t || ambientFrames(text)),
  });
  if (hold) talk.cur = n;
}
// close a bubble (with a short fade)
function shutBubble(n) {
  if (!n || !n.bubble) return;
  n.bubbleHeld = false; n.bubbleShut = true; n.bubbleNext = null;
  n.bubbleT = Math.min(n.bubbleT, BUBBLE_FADE);
  if (talk.cur === n) talk.cur = null;
}
// E / tap on the held bubble: carry on if there's more, else close it
function advanceTalk() {
  const n = talkHeld(); if (!n) return false;
  if (n.bubbleAge < 6) return true;            // a stray double-press
  const next = n.bubbleNext;
  if (!next) { shutBubble(n); return true; }
  n.bubbleNext = null;
  if (next() === false) n.bubbleNext = next;   // not ready yet: keep waiting
  return true;
}

// once per update (main.js): count down, close on walk-away / scene change
function tickTalk() {
  TALKERS.forEach(n => {
    if (!n.bubble) return;
    if (n.bubbleScene !== scene) { if (talk.cur === n) talk.cur = null; n.bubble = null; n.bubbleHeld = false; return; }
    n.bubbleAge++;
    if (n.bubbleHeld) {
      if (talkDist(n) > Math.max(WALK_AWAY, n.bubbleD0 + 60) || Math.abs(player.wx - n.bubbleX0) > WALK_OFF) shutBubble(n);
      return;
    }
    if (--n.bubbleT <= BUBBLE_FADE) n.bubbleShut = true;
    if (n.bubbleT <= 0) n.bubble = null;
  });
}

// keys: E belongs to the held bubble while it's up (runs before every scene's E handler,
// since this file loads first) · Esc closes it
window.addEventListener('keydown', e => {
  if (e.repeat || !started || transitioning || menu.open || obs.viewing) return;
  if (e.code === 'Escape') { shutBubble(talkHeld()); return; }
  if (e.code !== 'KeyE' || !talkHeld()) return;
  e.stopImmediatePropagation();
  advanceTalk();
});
// a tap (touch.js) or click on a bubble: same as E for the held one; closes a passing one
function tapBubble(clientX, clientY) {
  if (!started || transitioning || menu.open || obs.viewing) return false;
  const gx = clientX / ZOOM, gy = clientY / ZOOM, m = 10;
  const r = talk.rects.find(r => gx > r.x - m && gx < r.x + r.w + m && gy > r.y - m && gy < r.y + r.h + m);
  if (!r) return false;
  if (r.n === talkHeld()) advanceTalk(); else shutBubble(r.n);
  return true;
}
window.addEventListener('load', () => canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') tapBubble(e.clientX, e.clientY); }));

/* ── layout + drawing ── */
function wrapText(text, maxW) {
  const words = text.split(' '), lines = [];
  let cur = '';
  words.forEach(w => {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  });
  if (cur) lines.push(cur);
  return lines;
}
// font scale core.js applies on phones (so sizes below track what's really drawn)
const fontK = () => MOBILE ? Math.max(1, Math.min(1.7, 0.95 / ZOOM)) : 1;
// things a bubble shouldn't cover (you, the prompt over your head, the hint box, the touch button), as rects:
// x on screen, y in world space (the view is translated by -camY)
function bubbleObstacles() {
  const cy = Math.round(camY), out = [], s = playerScale();
  out.push({ x: player.wx - camX - 16 * s, y: player._py - 70 * s, w: 32 * s, h: 70 * s });   // the mouse
  const pb = popupBox();
  if (pb) out.push({ x: pb.x - 4, y: pb.y - 4, w: pb.w + 8, h: pb.h + 8 });
  const dom = id => {
    const el = document.getElementById(id);
    if (!el || el.hidden || (id === 'hint-box' && !el.classList.contains('visible'))) return;
    const b = el.getBoundingClientRect && el.getBoundingClientRect();
    if (b && b.width > 0) out.push({ x: b.left / ZOOM - 6, y: b.top / ZOOM + cy - 6, w: b.width / ZOOM + 12, h: b.height / ZOOM + 12 });
  };
  dom('hint-box');
  if (touchMode) dom('act');
  return out;
}
const hits = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// draw the bubbles of these NPCs (call inside the scene's camY translation)
function drawTalkBubbles(list) {
  const cy = Math.round(camY), k = fontK();
  const FS = MOBILE ? 13 : 11, fs = FS * k, lh = Math.round(fs * 1.4), pad = Math.round(fs * 0.75), gap = Math.round(8 * Math.max(1, k * 0.8));
  const wrapW = Math.min((MOBILE ? 280 : 260) * k, W - 40 - pad * 2);   // narrower (in game px) on an upright phone
  const top = cy + 8, bot = cy + H - 8;
  ctx.save();
  ctx.font = `${FS}px Space Mono, monospace`;
  const items = [];
  list.forEach(n => {
    if (!n.bubble || !n.at) return;
    const [x, feet, head] = n.at(), sx = x - camX;
    if (sx < -200 || sx > W + 200) return;
    const lines = wrapText(n.bubble, wrapW);
    const held = n.bubbleHeld && n === talk.cur;
    const tag = held ? (touchMode ? '' : 'E ') + (n.bubbleNext ? '▸' : '✓') : '';
    const lw = lines.map(l => ctx.measureText(l).width);
    let tagW = 0, extra = 0;
    if (tag) {
      ctx.font = `bold ${FS - 1}px Space Mono, monospace`; tagW = ctx.measureText(tag).width; ctx.font = `${FS}px Space Mono, monospace`;
      if (lw[lw.length - 1] + tagW + pad > wrapW) extra = lh * 0.85; else lw[lw.length - 1] += tagW + pad;
    }
    const bw = Math.ceil(Math.max(...lw) + pad * 2), bh = Math.round(lines.length * lh + extra + pad * 2 - lh * 0.25);
    // below the feet; flip above the head if it'd run off the bottom
    let by = feet + gap;
    if (by + bh > bot) by = head - gap - bh;
    by = Math.max(top, Math.min(bot - bh, by));
    const bx = Math.max(8, Math.min(W - bw - 8, sx - bw / 2));
    items.push({ n, sx, feet, head, lines, tag, extra, held, x: bx, y: by, w: bw, h: bh });
  });
  // keep clear of each other (the held one gets first pick) and of the prompt/hint/button
  items.sort((a, b) => (b.held - a.held) || (a.n.bubbleAge - b.n.bubbleAge));
  const placed = bubbleObstacles();
  items.forEach(it => {
    const fits = r => r.y >= top && r.y + r.h <= bot && r.x >= 4 && r.x + r.w <= W - 4 && !placed.some(p => hits(r, p));
    let best = it;
    if (!fits(it)) {
      const cands = [];
      placed.forEach(p => {
        cands.push({ x: it.x, y: p.y + p.h + 6 }, { x: it.x, y: p.y - it.h - 6 }, { x: p.x + p.w + 6, y: it.y }, { x: p.x - it.w - 6, y: it.y });
      });
      cands.push({ x: it.x, y: it.head - gap - it.h }, { x: it.x, y: it.feet + gap });
      let bd = Infinity;
      cands.forEach(c => {
        const r = { x: c.x, y: c.y, w: it.w, h: it.h };
        const d = Math.abs(c.x - it.x) + Math.abs(c.y - it.y) * (c.y < it.y ? 4 : 2);   // sideways first; up (over the speakers) last
        if (d < bd && fits(r)) { bd = d; best = r; }
      });
    }
    // ease into place (so a bubble glides out of the way rather than jumping)
    const n = it.n;
    if (n.bubbleAge < 2 || n._bx == null || Math.abs(n._bx - best.x) + Math.abs(n._by - best.y) > 400) { n._bx = best.x; n._by = best.y; }
    else { n._bx += (best.x - n._bx) * 0.3; n._by += (best.y - n._by) * 0.3; }
    it.x = n._bx; it.y = n._by;
    placed.push({ x: best.x, y: best.y, w: it.w, h: it.h });
  });
  // draw
  talk.rects = [];
  ctx.font = `${FS}px Space Mono, monospace`;
  items.forEach(it => {
    const n = it.n, a = n.bubbleHeld ? 1 : Math.min(1, n.bubbleT / BUBBLE_FADE);
    const fadeIn = Math.min(1, (n.bubbleAge + 1) / 6);
    ctx.globalAlpha = a * fadeIn;
    const { x, y, w, h } = it;
    ctx.fillStyle = 'rgba(245,235,215,0.95)'; ctx.strokeStyle = it.held ? 'rgba(150,110,60,0.85)' : 'rgba(120,95,65,0.6)'; ctx.lineWidth = it.held ? 1.5 : 1;
    manualRoundRect(x, y, w, h, 7); ctx.fill(); ctx.stroke();
    // the tail points at the speaker: up at the feet when the box hangs below, down at the head when above
    const tx = Math.max(x + 10, Math.min(x + w - 10, it.sx)), tl = 7;
    ctx.beginPath();
    if (y >= it.feet - 4) { ctx.moveTo(tx - 5, y + 0.5); ctx.lineTo(tx, y - tl); ctx.lineTo(tx + 5, y + 0.5); }
    else if (y + h <= it.head + 4) { ctx.moveTo(tx - 5, y + h - 0.5); ctx.lineTo(tx, y + h + tl); ctx.lineTo(tx + 5, y + h - 0.5); }
    ctx.fill();
    ctx.fillStyle = 'rgba(50,38,28,0.95)'; ctx.textAlign = 'left';
    const base = i => y + pad + fs * 0.8 + i * lh;
    it.lines.forEach((l, i) => ctx.fillText(l, x + pad, base(i)));
    if (it.tag) {   // "E ▸" (more to come) or "E ✓" (that's all), bottom right, once you've had a moment to read
      ctx.globalAlpha = a * Math.min(1, Math.max(0, (n.bubbleAge - 10) / 12)) * (0.8 + 0.2 * Math.sin(tick * 0.08));
      ctx.font = `bold ${FS - 1}px Space Mono, monospace`; ctx.fillStyle = 'rgba(160,90,30,1)'; ctx.textAlign = 'right';
      ctx.fillText(it.tag, x + w - pad, base(it.lines.length - 1) + (it.extra ? lh * 0.85 : 0));
      ctx.font = `${FS}px Space Mono, monospace`;
    }
    talk.rects.push({ n, x, y: y - cy, w, h });
  });
  ctx.restore();
}
