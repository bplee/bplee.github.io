/* ══════════════════════════════════════════
   MARIGOLD'S GENERAL STORE — next door to the dozy gecko
   A little shopfront with an open counter window. marigold the goose
   sells sailcloth (for birch's boat) and marshmallows (for rae), one gold
   nugget each. gold comes from the old mine under the hill.
══════════════════════════════════════════ */
const STORE_X = 5010;

const marigold = makeRegular({ name: 'marigold', kind: 'goose', color: '#d8d4c8', x: STORE_X + 10, greeted: false });
OUT_TALKERS.push({ n: marigold, at: () => [marigold.x, groundY(STORE_X) - 118] });

const MARI_FLAVOR = [
  'honk. sorry. that slips out when i\'m concentrating.',
  "string, soap, buttons, lamp oil, and one jar of something nobody's opened in nine years. the jar's not for sale. the jar is a mystery.",
  'rosco comes in every day to look at the buttons. he never buys one. i think he just likes them.',
  "if you're going somewhere far, bring a scarf. i say that to everyone. i'm usually right.",
];
function sell(id, line) {
  stack('gold', -1);
  setTimeout(() => give(id, 'marigold'), 700);
  return line;
}
function talkToMarigold() {
  let line;
  const gold = inv.gold || 0;
  const wantCloth = questState.boat === 'open' && !hasItem('canvas') && !boat.sail;
  const wantMallows = questState.bonfire === 'open' && !hasItem('mallows');
  if (!marigold.greeted) {
    marigold.greeted = true;
    line = "welcome to marigold's! everything you need, and several things you don't. browse, browse.";
  } else if (wantCloth) {
    line = gold ? sell('canvas', "sailcloth? i keep one bolt for emergencies, and a boat is always an emergency. one gold nugget. pleasure doing business!")
                : "sailcloth's one gold nugget, dear. no gold? the old miners left plenty under the hill, so the moles say.";
  } else if (wantMallows) {
    line = gold ? sell('mallows', "marshmallows! for rae? tell her to hold them just above the fire, not in it. everyone puts them in it. one nugget.")
                : "marshmallows are one gold nugget. they're very good marshmallows. i'm not allowed to give them away. i asked myself.";
  } else line = MARI_FLAVOR[marigold.li++ % MARI_FLAVOR.length];
  say(marigold, line, true);
}
OUT_SPOTS.push(() => {
  if (Math.abs(player.wx - STORE_X) > 60 || vball.active) return null;
  return { text: marigold.greeted ? 'press E to talk to marigold' : "marigold's general store · press E to talk", act: talkToMarigold };
});

/* ── draw: the shopfront ── */
function drawStore() {
  const sx = STORE_X - camX;
  if (sx < -200 || sx > W + 200) return;
  const gy = groundY(STORE_X), flick = 0.85 + Math.sin(tick * 0.19) * 0.05;
  ctx.save();
  const lg = ctx.createRadialGradient(sx, gy, 5, sx, gy, 160);
  lg.addColorStop(0, `rgba(255,190,110,${0.13 * flick})`); lg.addColorStop(1, 'rgba(255,190,110,0)');
  ctx.fillStyle = lg; ctx.fillRect(sx - 170, gy - 120, 340, 140);
  // walls + roof
  ctx.fillStyle = '#2d241c'; ctx.strokeStyle = 'rgba(170,135,95,0.55)'; ctx.lineWidth = 1;
  ctx.fillRect(sx - 95, gy - 150, 190, 150); ctx.strokeRect(sx - 95, gy - 150, 190, 150);
  ctx.strokeStyle = 'rgba(120,95,65,0.3)';
  for (let x = sx - 95; x < sx + 95; x += 14) { ctx.beginPath(); ctx.moveTo(x, gy - 150); ctx.lineTo(x, gy); ctx.stroke(); }
  ctx.fillStyle = '#1e1611'; ctx.strokeStyle = 'rgba(170,135,95,0.65)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(sx - 112, gy - 148); ctx.lineTo(sx - 70, gy - 196); ctx.lineTo(sx + 70, gy - 196); ctx.lineTo(sx + 112, gy - 148); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (weather.snowCover > 0.02) { ctx.strokeStyle = `rgba(235,240,248,${0.3 + weather.snowCover * 0.6})`; ctx.lineWidth = 2 + weather.snowCover * 6; ctx.beginPath(); ctx.moveTo(sx - 110, gy - 150); ctx.lineTo(sx - 70, gy - 198); ctx.lineTo(sx + 70, gy - 198); ctx.lineTo(sx + 110, gy - 150); ctx.stroke(); }
  // sign board
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(sx - 70, gy - 186, 140, 26);
  ctx.strokeStyle = 'rgba(170,135,95,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(sx - 70, gy - 186, 140, 26);
  ctx.fillStyle = 'rgba(230,205,160,0.9)'; ctx.font = '9px Space Mono, monospace'; ctx.textAlign = 'center';
  ctx.fillText("marigold's", sx, gy - 175); ctx.font = '7px Space Mono, monospace'; ctx.fillText('general store', sx, gy - 165);
  // the counter window (marigold leans out of it)
  ctx.fillStyle = `rgba(255,190,110,${0.5 * flick})`; ctx.fillRect(sx - 30, gy - 138, 80, 74);
  // shelves behind her: jars, a bolt of cloth, a bag of marshmallows
  ctx.fillStyle = 'rgba(70,50,32,0.8)'; ctx.fillRect(sx - 30, gy - 118, 80, 2); ctx.fillRect(sx - 30, gy - 96, 80, 2);
  [['rgba(200,160,100,0.8)', -24, 118], ['rgba(140,180,120,0.7)', -14, 118], ['rgba(220,210,190,0.8)', 30, 118], ['rgba(180,120,100,0.75)', 40, 118], ['rgba(230,225,210,0.9)', -24, 96], ['rgba(240,240,250,0.85)', 38, 96]].forEach(([c, dx, dy]) => {
    ctx.fillStyle = c; ctx.fillRect(sx + dx, gy - dy - 9, 7, 9);
  });
  // marigold
  drawCritter(sx + 10, gy - 66, 'goose', { color: marigold.color, dir: faceToward(STORE_X, -1), scale: 1.05 });
  // counter
  ctx.fillStyle = '#4a3420'; ctx.fillRect(sx - 36, gy - 68, 92, 8);
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(sx - 34, gy - 60, 88, 60);
  ctx.strokeStyle = 'rgba(170,135,95,0.4)'; ctx.strokeRect(sx - 34, gy - 60, 88, 60);
  // a little brass bell on the counter
  ctx.fillStyle = 'rgba(220,180,90,0.9)'; ctx.beginPath(); ctx.arc(sx + 44, gy - 70, 3.5, Math.PI, 0); ctx.fill(); ctx.fillRect(sx + 40, gy - 70, 8, 1.5);
  // striped awning over the window
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(230,220,200,0.85)' : 'rgba(170,80,70,0.85)';
    ctx.beginPath(); ctx.moveTo(sx - 40 + i * 14, gy - 152); ctx.lineTo(sx - 26 + i * 14, gy - 152); ctx.lineTo(sx - 26 + i * 14, gy - 144); ctx.arc(sx - 33 + i * 14, gy - 144, 7, 0, Math.PI); ctx.closePath(); ctx.fill();
  }
  // a crate + barrel out front
  ctx.fillStyle = '#4a3622'; ctx.fillRect(sx - 88, gy - 26, 30, 26);
  ctx.strokeStyle = 'rgba(30,20,12,0.6)'; ctx.beginPath(); ctx.moveTo(sx - 88, gy - 26); ctx.lineTo(sx - 58, gy); ctx.moveTo(sx - 58, gy - 26); ctx.lineTo(sx - 88, gy); ctx.stroke();
  ctx.fillStyle = '#3e2c1c'; ctx.beginPath(); ctx.ellipse(sx + 76, gy - 16, 13, 17, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(150,150,160,0.6)'; ctx.beginPath(); ctx.moveTo(sx + 63, gy - 24); ctx.lineTo(sx + 89, gy - 24); ctx.moveTo(sx + 63, gy - 8); ctx.lineTo(sx + 89, gy - 8); ctx.stroke();
  ctx.restore();
}
