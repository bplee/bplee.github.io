/* ══════════════════════════════════════════
   TOUCH CONTROLS (phones / tablets)
   Nothing here does anything until the first real touch, so the keyboard
   version is untouched. Controls work by sending the same key events the
   keyboard does, so the game logic doesn't know the difference.

     · right side: a joystick pops up wherever your thumb lands
         left / right = walk, pull down = ↓ (drop through floors, tip the ball)
     · left side: tap = jump (again in the air = double jump / spike),
         hold = keep jump held (glide with the owl's feather)
     · action button (left, above your thumb) = E, labelled for what's nearby
     · telescope: drag to look around, ✕ to step back
     · tapping outside the bag/friends panel closes it
══════════════════════════════════════════ */
const touchUI = {
  joy: null,            // { id, x0, y0, x, y }
  jumpId: null,
  dirs: { left: false, right: false, down: false },
  scope: null,          // { id, x, y } while dragging the telescope view
  rotateDismissed: false,
  frames: [], lastT: 0,
};
const JOY_R = 52;        // joystick radius (screen px)

function synthKey(code, down) {
  window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code, bubbles: true, cancelable: true }));
}
function setDir(name, code, on) {
  if (touchUI.dirs[name] === on) return;
  touchUI.dirs[name] = on;
  synthKey(code, on);
}
function releaseJoystick() {
  setDir('left', 'ArrowLeft', false); setDir('right', 'ArrowRight', false); setDir('down', 'ArrowDown', false);
  touchUI.joy = null;
  const j = document.getElementById('joy'); if (j) j.hidden = true;
}

/* ── turn touch mode on at the first touch ── */
function enableTouch() {
  if (touchMode) return;
  touchMode = true;
  document.body.classList.add('touch');
  document.getElementById('touch').hidden = false;
  // re-word the hint that's on screen right now, if any
  if (hintBox.classList.contains('visible')) hintBox.textContent = touchify(hintBox.textContent);
  if (MOBILE) {
    // Android: go fullscreen + landscape (iPhones don't allow this; "Add to Home Screen" does it there)
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen({ navigationUI: 'hide' })
        .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'))
        .catch(() => {});
    }
  }
  setInterval(updateTouchUI, 100);
  updateTouchUI();
}
window.addEventListener('touchstart', enableTouch, { capture: true, passive: true });

/* ── the action button: what does E do right here? ── */
const VERB = { talk: 'talk', order: 'order', look: 'look', dig: 'dig', nap: 'nap', knock: 'knock',
               head: 'leave', step: 'enter', go: 'enter', climb: 'leave', join: 'join' };
function actionLabel() {
  if (!started || transitioning || menu.open || obs.viewing) return null;
  if (vball.active) return 'leave game';
  if (joinPromptVisible) return 'join game';
  const p = activePopup;
  const m = p && p.match(/press E to ([a-z]+)/);
  if (m) return VERB[m[1]] || m[1];
  if (scene === 'tavern' && nearestTavernTarget()) return 'knock';
  return null;
}

function updateTouchUI() {
  const act = document.getElementById('act');
  const label = actionLabel();
  act.hidden = !label;
  if (label && act.textContent !== label) act.textContent = label;
  document.getElementById('scope-close').hidden = !obs.viewing;
  if (menu.open && touchUI.joy) releaseJoystick();
  updateRotateCard();
}

/* ── the touch layer: joystick on the right, jump on the left ── */
function onDown(e) {
  if (e.pointerType === 'mouse') return;
  e.preventDefault();
  enableTouch();
  const x = e.clientX, y = e.clientY;
  if (menu.open) { closeMenu(); return; }
  if (obs.viewing) { touchUI.scope = { id: e.pointerId, x, y }; return; }
  if (x > window.innerWidth / 2) {
    if (touchUI.joy) return;
    touchUI.joy = { id: e.pointerId, x0: x, y0: y, x, y };
    const j = document.getElementById('joy');
    j.hidden = false; j.style.left = x + 'px'; j.style.top = y + 'px';
    moveKnob(0, 0);
  } else {
    if (touchUI.jumpId !== null) return;
    touchUI.jumpId = e.pointerId;
    synthKey('Space', true);
  }
}
function moveKnob(dx, dy) {
  document.getElementById('joy-knob').style.transform = `translate(${dx}px, ${dy}px)`;
}
function onMove(e) {
  if (e.pointerType === 'mouse') return;
  const x = e.clientX, y = e.clientY;
  if (touchUI.scope && e.pointerId === touchUI.scope.id) {
    obs.vx = Math.max(0, Math.min(SKY_W, obs.vx - (x - touchUI.scope.x) / ZOOM));
    obs.vy = Math.max(0, Math.min(SKY_H, obs.vy - (y - touchUI.scope.y) / ZOOM));
    touchUI.scope.x = x; touchUI.scope.y = y;
    return;
  }
  const j = touchUI.joy;
  if (!j || e.pointerId !== j.id) return;
  // the base stays where your thumb first landed; the knob just stops at the rim
  const dx = x - j.x0, dy = y - j.y0;
  const d = Math.hypot(dx, dy), k = d > JOY_R ? JOY_R / d : 1;
  moveKnob(dx * k, dy * k);
  setDir('right', 'ArrowRight', dx > 14);
  setDir('left',  'ArrowLeft',  dx < -14);
  setDir('down',  'ArrowDown',  dy > 30 && dy > Math.abs(dx) * 0.8);
}
function onUp(e) {
  if (e.pointerType === 'mouse') return;
  if (touchUI.scope && e.pointerId === touchUI.scope.id) touchUI.scope = null;
  if (touchUI.joy && e.pointerId === touchUI.joy.id) releaseJoystick();
  if (touchUI.jumpId === e.pointerId) { touchUI.jumpId = null; synthKey('Space', false); }
}

/* ── upright phone: a gentle one-time tip that sideways works too (no blocking card) ── */
function updateRotateCard() {
  if (touchUI.rotateTipped || !MOBILE || !touchMode || !started || window.innerHeight <= window.innerWidth) return;
  touchUI.rotateTipped = true;
  setTimeout(() => showHint('tip: wander also works with your phone turned sideways', 4000), 4500);
}

/* ── phones: keep frames smooth — if they drag, turn effects down further ── */
function watchFrames(t) {
  if (touchUI.lastT) {
    touchUI.frames.push(t - touchUI.lastT);
    if (touchUI.frames.length > 180) {
      const avg = touchUI.frames.reduce((a, b) => a + b, 0) / touchUI.frames.length;
      touchUI.frames.length = 0;
      if (avg > 24 && QUALITY > 0.35) { QUALITY = 0.35; resize(); }
    }
  }
  touchUI.lastT = t;
  if (QUALITY > 0.35) requestAnimationFrame(watchFrames);
}

window.addEventListener('load', () => {
  const layer = document.getElementById('touch');
  layer.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  const tapKey = code => e => { e.preventDefault(); e.stopPropagation(); synthKey(code, true); synthKey(code, false); };
  document.getElementById('act').addEventListener('pointerdown', tapKey('KeyE'));
  document.getElementById('scope-close').addEventListener('pointerdown', tapKey('KeyE'));
  window.addEventListener('resize', updateRotateCard);
  window.addEventListener('blur', () => { releaseJoystick(); if (touchUI.jumpId !== null) { touchUI.jumpId = null; synthKey('Space', false); } });

  if (MOBILE) {
    // no pinch-zoom / double-tap zoom / long-press menus in the game
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault());
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('touchmove', e => {
      if (e.touches.length > 1 || !e.target.closest('#menu-body')) e.preventDefault();
    }, { passive: false });
    requestAnimationFrame(watchFrames);
  }
});
