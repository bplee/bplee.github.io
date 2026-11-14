/* ══════════════════════════════════════════
   UPDATE (one fixed 60Hz step)
══════════════════════════════════════════ */
function update() {
  if (transitioning || menu.open) return;   // the bag/friends panel pauses the game
  if (obs.viewing) { updateWeather(); updateTelescope(); return; } // looking through the telescope
  updateWeather();
  updateDrink();
  updatePlayer();

  if (scene === 'outside') {
    // Show the join prompt near the court, then start on E
    if (!vball.active && player.wx > COURT_L - 180 && player.wx < NET_X - 40) showJoinPrompt();
    else hideJoinPrompt();
    updateVolleyball();
    updateTavernExterior();
    updateWoods();
    updateObservatory();
    updateCaveMouth();
  } else if (scene === 'tavern') {
    updateTavernInterior();
  } else if (scene === 'observatory') {
    updateObsInterior();
  } else {
    updateCavern();
  }

  checkProximity();
  updateCamera();
}

/* ══════════════════════════════════════════
   DRAW
══════════════════════════════════════════ */
function draw() {
  ctx.clearRect(0,0,W,H);
  if (scene === 'tavern') {
    ctx.fillStyle = '#0a0c0f'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(0, -Math.round(camY));   // camY is 0 except on an upright phone
    drawTavernInterior();
    drawPlayer();
    drawDrinkFx();
    drawTavernOverlay();
    drawPopup();
    ctx.restore();
    return;
  }
  if (scene === 'observatory') {
    ctx.save(); ctx.translate(0, -Math.round(camY));
    drawObsInterior();
    drawPlayer();
    drawDrinkFx();
    drawObsInteriorFront();
    drawPopup();
    ctx.restore();
    drawTelescopeView();
    return;
  }
  if (scene === 'cavern') {
    ctx.save(); ctx.translate(0, -Math.round(camY));
    drawCavern();
    drawPlayer();
    drawCaveWater();     // in front of you, so you look submerged
    drawDrinkFx();
    drawPopup();
    ctx.restore();
    return;
  }
  // ── sky (screen space) ──
  drawSky();
  drawStars();
  drawChartSky();
  drawShootingStars();
  drawMoon();
  drawOwlFlyby();
  drawClouds();
  drawHills();
  drawBgTrees();
  // ── the world (follows the vertical camera) ──
  ctx.save(); ctx.translate(0, -Math.round(camY));
  drawTerrain();
  drawSnowCover();
  drawWoodsBack();
  drawNet();
  drawObjects();
  drawTavernExterior();
  drawObservatoryBack();
  drawCaveMouth();
  drawNPCs();
  drawLandingMarker();
  drawBall();
  drawFrogs();
  drawPlayer();
  drawGrass();
  drawDust();
  drawFireflies();
  drawDrinkFx();
  drawObservatoryFront();
  drawPopup();
  ctx.restore();
  // ── in front of everything (screen space) ──
  drawWeatherFront();
  drawTelescopeView();
}

/* ══════════════════════════════════════════
   MAIN LOOP
══════════════════════════════════════════ */
// Fixed 60Hz simulation step so the game runs the same speed on 60/120/144Hz displays
let started = false;
const STEP_MS = 1000 / 60;
let lastTime = null, acc = 0;
function loop(now) {
  if (lastTime === null) lastTime = now;
  acc += Math.min(100, now - lastTime); // cap so a backgrounded tab doesn't fast-forward
  lastTime = now;
  while (acc >= STEP_MS) {
    if (started) update();
    tick++;
    acc -= STEP_MS;
  }
  draw();
  requestAnimationFrame(loop);
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
const fadeEl = document.getElementById('fade');
window.addEventListener('load', () => {
  player._py = groundY(player.wx);
  initWeather();
  requestAnimationFrame(loop);
  setTimeout(() => {
    fadeEl.style.opacity='0';
    setTimeout(() => {
      fadeEl.style.display='none';
      started=true;
      showHint('arrow keys or wasd to move · space to jump',4000);
    },1300);
  },200);
});
