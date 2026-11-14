/* ══════════════════════════════════════════
   BACKGROUND — sky, stars, moon, parallax hills + trees, terrain
══════════════════════════════════════════ */
function drawSky() {
  const grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,    '#05070e');
  grad.addColorStop(0.5,  '#0c1120');
  grad.addColorStop(0.78, '#18203a');
  grad.addColorStop(1,    '#151a28');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);
  // faint glow along the horizon
  const hg = ctx.createRadialGradient(W*0.5, H*BASE_GND, 10, W*0.5, H*BASE_GND, W*0.7);
  hg.addColorStop(0, 'rgba(70,90,130,0.18)'); hg.addColorStop(1, 'rgba(70,90,130,0)');
  ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
}

const STARS = Array.from({length:140}, () => ({
  x: Math.random()*1.2, y: Math.random()*0.62,
  r: 0.4+Math.random()*1.1, a: 0.2+Math.random()*0.6,
  phase: Math.random()*Math.PI*2, speed: 0.5+Math.random()*1.5,
  big: Math.random() < 0.06,
}));
function drawStars() {
  const t = tick * 0.008;
  const shift = camX * 0.01 / W; // the tiniest drift as you walk
  STARS.forEach(s => {
    const x = (((s.x - shift) % 1.2 + 1.2) % 1.2) * W, y = s.y * H;
    const tw = Math.max(0, s.a + 0.25 * Math.sin(t * s.speed + s.phase));
    ctx.fillStyle = `rgba(255,252,235,${tw})`;
    ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI*2); ctx.fill();
    if (s.big) { // little cross sparkle
      ctx.strokeStyle = `rgba(255,252,235,${tw * 0.5})`; ctx.lineWidth = 0.6;
      const l = 3 + 2 * Math.sin(t * s.speed * 2 + s.phase);
      ctx.beginPath(); ctx.moveTo(x - l, y); ctx.lineTo(x + l, y); ctx.moveTo(x, y - l); ctx.lineTo(x, y + l); ctx.stroke();
    }
  });
}

function drawMoon() {
  const mx=W*0.82, my=H*0.12, mr=H*0.048;
  const halo = ctx.createRadialGradient(mx, my, mr*0.8, mx, my, mr*4);
  halo.addColorStop(0, 'rgba(216,223,200,0.16)'); halo.addColorStop(1, 'rgba(216,223,200,0)');
  ctx.fillStyle = halo; ctx.fillRect(mx - mr*4, my - mr*4, mr*8, mr*8);
  // crescent: the moon disc minus an offset disc (no fake "sky colored" circle)
  ctx.save();
  ctx.beginPath(); ctx.arc(mx,my,mr,0,Math.PI*2); ctx.clip();
  ctx.beginPath();
  ctx.rect(mx-mr, my-mr, mr*2, mr*2);
  ctx.arc(mx+mr*0.28, my-mr*0.1, mr*0.86, 0, Math.PI*2, true);
  ctx.fillStyle = '#dde3cc'; ctx.fill();
  // a couple of craters
  ctx.fillStyle = 'rgba(160,170,150,0.35)';
  ctx.beginPath(); ctx.arc(mx-mr*0.62, my+mr*0.15, mr*0.12, 0, 7); ctx.arc(mx-mr*0.45, my+mr*0.55, mr*0.08, 0, 7); ctx.fill();
  ctx.restore();
}

// rolling hill silhouettes, two layers of parallax
function hillY(x, layer) {
  return layer === 0
    ? H*BASE_GND - 70 - Math.sin(x*0.0021)*38 - Math.sin(x*0.0057+1)*18
    : H*BASE_GND - 30 - Math.sin(x*0.0034+2)*26 - Math.sin(x*0.0091)*12;
}
function drawHills() {
  ctx.save(); ctx.translate(0, -(viewBias() + (camY - viewBias()) * 0.3));
  [[0, 0.04, 'rgba(20,28,44,0.9)'], [1, 0.1, 'rgba(16,26,24,0.95)']].forEach(([layer, par, col]) => {
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let sx = 0; sx <= W + 10; sx += 10) ctx.lineTo(sx, hillY(sx + camX*par, layer));
    ctx.lineTo(W, H + 400); ctx.lineTo(0, H + 400); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
  });
  ctx.restore();
}

// mid-distance trees (parallax 0.2): a mix of round trees and pines that sway a little
const BG_TREES = Array.from({length:40}, (_,i) => ({
  lx: i*75 + Math.random()*50, h: 55+Math.random()*75, w: 18+Math.random()*22,
  pine: Math.random() < 0.45, ph: Math.random()*6,
}));
function drawBgTrees() {
  ctx.save(); ctx.translate(0, -(viewBias() + (camY - viewBias()) * 0.4));
  drawBgTreesInner();
  ctx.restore();
}
function drawBgTreesInner() {
  const sway0 = Math.abs(weather.wind) * 1.5 + 0.6;
  BG_TREES.forEach(t => {
    const sx = t.lx - camX*0.2;
    if (sx < -60 || sx > W+60) return;
    const gY = H*BASE_GND + 4;
    const sway = Math.sin(tick*0.012 + t.ph) * sway0 + weather.wind * 2;
    ctx.fillStyle = 'rgba(22,34,22,0.85)';
    ctx.fillRect(sx - t.w*0.07, gY - t.h*0.45, t.w*0.14, t.h*0.45);
    if (t.pine) {
      ctx.fillStyle = 'rgba(18,34,24,0.9)';
      for (let k = 0; k < 3; k++) {
        const by = gY - t.h*0.25 - k*t.h*0.22, hw = t.w*(0.75 - k*0.18);
        ctx.beginPath(); ctx.moveTo(sx - hw, by); ctx.lineTo(sx + hw, by); ctx.lineTo(sx + sway*(k+1)*0.4, by - t.h*0.4); ctx.closePath(); ctx.fill();
      }
    } else {
      ctx.fillStyle = 'rgba(22,38,20,0.85)';
      ctx.beginPath(); ctx.ellipse(sx + sway*0.6, gY - t.h*0.62, t.w*0.55, t.h*0.42, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(30,48,26,0.5)';
      ctx.beginPath(); ctx.ellipse(sx + sway - t.w*0.12, gY - t.h*0.72, t.w*0.3, t.h*0.22, 0, 0, Math.PI*2); ctx.fill();
    }
  });
}

// pebbles + soil specks (fixed in the world)
const PEBBLES = Array.from({length:700}, () => ({ x: Math.random()*WORLD_W, d: 6 + Math.random()*120, r: 0.8 + Math.random()*1.8, a: 0.1 + Math.random()*0.2 }));

// the ground line across the visible part of the world (includes the hill)
function groundPath(step) {
  const x0 = Math.max(0, camX - 20), x1 = Math.min(WORLD_W, camX + W + 20);
  const pts = [];
  for (let x = x0; x <= x1; x += step) pts.push([x, groundY(x)]);
  pts.push([x1, groundY(x1)]);
  return pts;
}

function drawTerrain() {
  ctx.save();
  const pts = groundPath(6);
  const bottom = Math.max(H + Math.abs(camY), camY + H) + 40;
  ctx.beginPath();
  ctx.moveTo(pts[0][0] - camX, bottom);
  pts.forEach(([x, y]) => ctx.lineTo(x - camX, y));
  ctx.lineTo(pts[pts.length - 1][0] - camX, bottom);
  ctx.closePath();
  const gf = ctx.createLinearGradient(0, H*BASE_GND - 80, 0, H);
  gf.addColorStop(0,'#223018'); gf.addColorStop(0.25,'#172010'); gf.addColorStop(1,'#0a0f07');
  ctx.fillStyle = '#121a0c'; ctx.fill();          // deep soil (the hill can be very tall)
  ctx.fillStyle = gf; ctx.fill();

  PEBBLES.forEach(p => {
    const sx = p.x - camX; if (sx < -5 || sx > W+5) return;
    ctx.fillStyle = `rgba(150,140,110,${p.a})`;
    ctx.beginPath(); ctx.ellipse(sx, groundY(p.x) + p.d, p.r*1.4, p.r, 0, 0, 7); ctx.fill();
  });

  // grassy top edge: a bright line with a soft darker band under it
  ctx.beginPath();
  pts.forEach(([x, y], i) => i ? ctx.lineTo(x - camX, y) : ctx.moveTo(x - camX, y));
  ctx.strokeStyle='rgba(30,50,22,0.9)'; ctx.lineWidth=7; ctx.lineJoin='round'; ctx.stroke();
  ctx.strokeStyle='rgba(95,140,60,0.65)'; ctx.lineWidth=2; ctx.stroke();
  ctx.restore();
}

/* ══════════════════════════════════════════
   OBJECTS
══════════════════════════════════════════ */
function hexToRgb(hex) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

function manualRoundRect(x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}


function drawRollerblade(x, y, s = 1, color = '#7ebe9a') {
    ctx.save();
    ctx.translate(x, y);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 1.1 * s;

    ctx.strokeStyle = GLOW;
    ctx.fillStyle = GLOW_FILL;
    ctx.shadowColor = GLOW;
    ctx.shadowBlur = GLOW_BLUR * s;

    // ---------- Boot ----------
    ctx.beginPath();

    // Back of cuff
    ctx.moveTo(-7*s, -11*s);

    // Top of cuff
    ctx.lineTo(2*s, -11*s);

    // Front of cuff
    ctx.lineTo(2*s, -6*s);

    // Front of boot
    ctx.quadraticCurveTo(
        5*s, -1*s,
        11*s, 2*s
    );

    // Toe
    ctx.quadraticCurveTo(
        15*s, 3*s,
        14*s, 9*s
    );

    // Sole
    ctx.lineTo(-8*s, 9*s);

    // Heel
    ctx.quadraticCurveTo(
        -10*s, 3*s,
        -8*s, -4*s
    );

    // Close back to cuff
    ctx.quadraticCurveTo(
        -7*s, -8*s,
        -7*s, -14*s
    );

    ctx.stroke();

    // ---------- Ankle curve ----------
    ctx.beginPath();
    ctx.moveTo(-5*s,-2*s);

    ctx.quadraticCurveTo(
        -1*s,0*s,
        1*s,-6*s
    );

    ctx.quadraticCurveTo(
        2*s,-8*s,
        4*s,-6*s
    );

    ctx.stroke();

    // ---------- Lace hole ----------
    ctx.beginPath();
    ctx.arc(-1.5*s,-1.5*s,0.8*s,0,Math.PI*2);
    ctx.fillStyle = color;
    ctx.fill();

    // ---------- Frame ----------
    ctx.beginPath();
    ctx.moveTo(-9*s,11*s);
    ctx.lineTo(13*s,11*s);
    ctx.stroke();

    // ---------- Wheel Supports ----------
    [-6,0,6,12].forEach(px=>{
        ctx.beginPath();
        ctx.moveTo(px*s,11*s);
        ctx.lineTo(px*s,13*s);
        ctx.stroke();
    });

    // ---------- Wheels ----------
    [-6,0,6,12].forEach(px=>{
        ctx.beginPath();
        ctx.arc(px*s,15*s,2.6*s,0,Math.PI*2);
        ctx.stroke();
    });

    ctx.restore();
}
const GLOW = '#7ebe9a';
const GLOW_FILL = 'rgba(126,190,154,0.18)';
const GLOW_BLUR = 8;

function drawObjects() {
  OBJECTS.forEach(obj => {
    const sx = obj.wx - camX;
    const sy = groundY(obj.wx);
    if (sx < -250 || sx > W+250) return;
    ctx.save();

    if (obj.type === 'log') {
      const cy = sy - obj.h*0.5;
      // body
      ctx.strokeStyle='rgba(160,130,90,0.85)'; ctx.fillStyle='rgba(92,68,42,0.9)';
      ctx.lineWidth=1.5; ctx.lineCap='round';
      ctx.beginPath(); ctx.ellipse(sx,cy,obj.w*0.5,obj.h*0.5,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
      // bark grain
      ctx.strokeStyle='rgba(60,42,24,0.5)'; ctx.lineWidth=0.8;
      for (let i=-1;i<=1;i++) {
        ctx.beginPath(); ctx.moveTo(sx+i*10,sy-obj.h*0.15);
        ctx.bezierCurveTo(sx+i*10-4,sy-obj.h*0.5,sx+i*10+4,sy-obj.h*0.85,sx+i*10,sy-obj.h); ctx.stroke();
      }
      // cut end with rings
      ctx.fillStyle='rgba(190,160,115,0.9)';
      ctx.beginPath(); ctx.ellipse(sx+obj.w*0.42,cy,5,obj.h*0.45,0,0,7); ctx.fill();
      ctx.strokeStyle='rgba(120,90,55,0.7)'; ctx.lineWidth=0.6;
      ctx.beginPath(); ctx.ellipse(sx+obj.w*0.42,cy,3,obj.h*0.28,0,0,7); ctx.ellipse(sx+obj.w*0.42,cy,1.4,obj.h*0.12,0,0,7); ctx.stroke();
      // moss on top
      ctx.fillStyle='rgba(90,140,60,0.75)';
      for (let i=0;i<5;i++) { ctx.beginPath(); ctx.arc(sx-14+i*6, sy-obj.h+1+Math.sin(i*2)*1, 3.2, Math.PI, 0); ctx.fill(); }
      // tiny mushrooms on the side
      [[-12,-6],[-6,-3]].forEach(([dx,dy],i) => {
        ctx.fillStyle='rgba(230,220,200,0.85)'; ctx.fillRect(sx+dx-0.6, sy+dy-4, 1.2, 4);
        ctx.fillStyle= i ? 'rgba(220,120,90,0.9)' : 'rgba(210,180,120,0.9)';
        ctx.beginPath(); ctx.ellipse(sx+dx, sy+dy-4, 2.6, 1.6, 0, Math.PI, 0); ctx.fill();
      });
      // a beetle trundling along the top
      const bx = sx + Math.sin(tick*0.006)*14;
      ctx.fillStyle='rgba(40,60,80,0.95)'; ctx.beginPath(); ctx.ellipse(bx, sy-obj.h-2, 2.6, 1.8, 0, 0, 7); ctx.fill();
      ctx.strokeStyle='rgba(40,60,80,0.8)'; ctx.lineWidth=0.5;
      const leg = Math.sin(tick*0.4)*0.8;
      ctx.beginPath(); ctx.moveTo(bx-2, sy-obj.h-1); ctx.lineTo(bx-3, sy-obj.h+leg); ctx.moveTo(bx+2, sy-obj.h-1); ctx.lineTo(bx+3, sy-obj.h-leg); ctx.stroke();
    }

    else if (obj.type === 'blades' && !obj.collected) {
      const hover = Math.sin(tick*0.05)*3;
      // soft glow pool on the ground
      const g = ctx.createRadialGradient(sx, sy-2, 2, sx, sy-2, 40);
      g.addColorStop(0, `rgba(126,190,154,${0.18 + 0.06*Math.sin(tick*0.05)})`); g.addColorStop(1, 'rgba(126,190,154,0)');
      ctx.fillStyle = g; ctx.fillRect(sx-40, sy-30, 80, 34);
      drawRollerblade(sx-20,sy-16+hover,0.8);
      drawRollerblade(sx+4, sy-16-hover*0.6,0.8);
      // sparkles
      for (let i=0;i<3;i++) {
        const t = (tick*0.02 + i/3) % 1;
        ctx.fillStyle = `rgba(190,240,210,${(1-t)*0.8})`;
        const kx = sx - 20 + i*20 + Math.sin(i*5)*6, ky = sy - 20 - t*24;
        ctx.fillRect(kx - 0.6, ky - 3, 1.2, 6); ctx.fillRect(kx - 3, ky - 0.6, 6, 1.2);
      }
      ctx.font='10px Space Mono,monospace'; ctx.fillStyle='rgba(126,190,154,0.7)';
      ctx.textAlign='center'; ctx.fillText('rollerblades',sx,sy-44);
    }

    else if (obj.type === 'letter') {
      drawBigTree(obj.wx, 1.15, 0);
      // the letter flutters in the wind
      ctx.save();
      ctx.translate(sx, sy-107);
      ctx.rotate(Math.sin(tick*0.07)*0.05 + weather.wind*0.08);
      ctx.fillStyle='rgba(230,220,195,0.95)'; ctx.strokeStyle='rgba(160,140,100,0.8)'; ctx.lineWidth=1;
      manualRoundRect(-14,2,28,20,2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14,2); ctx.lineTo(0,12); ctx.lineTo(14,2); ctx.stroke();
      ctx.fillStyle='rgba(200,80,80,0.85)'; ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  });
}

/* ══════════════════════════════════════════
   POPUP
══════════════════════════════════════════ */
let activePopup = null;
const POPUP_TRIGGERS = {
  log:    { dist: 80,  text:'a fallen log. might have to jump over this.' },
  blades: { dist: 50,  text:'rollerblades! walk over them to pick up.' },
  letter: { dist: 70,  text:'a letter, pinned to a tree. it smells like old wood.' },
};

function checkProximity() {
  if (scene === 'tavern') { activePopup = tavernPopup(); return; }
  if (scene === 'cavern') { activePopup = cavernPopup(); return; }
  if (scene === 'observatory') { activePopup = obsInteriorPopup(); return; }
  if (vball.active) { activePopup = null; return; }
  if (nearTavernDoor()) { activePopup = 'the dozy gecko · press E to step inside'; return; }
  const cp = caveMouthPopup() || moleHolePopup() || ropePopup() || cliffPopup(); if (cp) { activePopup = cp; return; }
  const os = outSpot(); if (os) { activePopup = os.text; return; }   // the store, the far woods, the beach, the sea, the island
  const op = observatoryPopup(); if (op) { activePopup = op; return; }
  let nearest=null, nearDist=Infinity;
  OBJECTS.forEach(obj => {
    if (obj.type==='blades' && obj.collected) return;
    const trig = POPUP_TRIGGERS[obj.type]; if (!trig) return;
    const dist = Math.abs(player.wx - obj.wx);
    if (dist < trig.dist && dist < nearDist) { nearDist=dist; nearest=trig; }
  });
  if (!nearest) { const wp = woodsPopup(); if (wp) nearest = { text: wp }; }
  // volleyball approach
  if (!nearest && Math.abs(player.wx - NET_X) < 250 && player.wx < NET_X) {
    nearest = { text:'a volleyball court. three animals waiting for a fourth…' };
  }
  activePopup = nearest ? nearest.text : null;
}

// where the prompt over your head goes (world coords: drawn inside the camY translation).
// none while someone's speech bubble is waiting on you: E belongs to that (talk.js)
function popupBox() {
  if (!activePopup || talkHeld()) return null;
  // on touch screens the action button does what E does, so the popup just names the thing
  const text = touchMode ? activePopup.replace(/(^|· )press E to /, '$1').replace(/^(.)/, c => c) : activePopup;
  const sx = player.wx - camX;
  const sy = player._py - 76 * playerScale();
  const PAD=10, FONT=13;
  ctx.font=`${FONT}px Space Mono,monospace`;
  const tw=ctx.measureText(text).width;
  const bw=tw+PAD*2, bh=FONT+PAD*2;
  return { text, x: Math.max(10,Math.min(W-bw-10,sx-bw/2)), y: sy-bh-8, w: bw, h: bh, PAD, FONT };
}
function drawPopup() {
  const b = popupBox(); if (!b) return;
  const { text, x: bx, y: by, w: bw, h: bh, PAD, FONT } = b;
  ctx.font=`${FONT}px Space Mono,monospace`;
  ctx.save();
  ctx.fillStyle='rgba(20,24,32,0.78)'; ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=0.5;
  manualRoundRect(bx,by,bw,bh,6); ctx.fill(); ctx.stroke();
  ctx.fillStyle='rgba(200,195,185,0.9)'; ctx.textAlign='left';
  ctx.fillText(text,bx+PAD,by+PAD+FONT*0.85);
  ctx.restore();
}
