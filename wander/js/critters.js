/* ══════════════════════════════════════════
   CRITTERS — line-art animals, drawn in the same thin-stroke style as the mouse.
   drawCritter(x, y, kind, opts)
     x, y   : screen position of their feet
     kind   : bunny fox hedgehog gecko raccoon badger squirrel otter owl toad
              snail tortoise moth bat ghost
     opts   : { color:'#rrggbb', dir:±1 (facing), label, scale, sleep, flap }
══════════════════════════════════════════ */
function drawCritter(x, y, kind, o) {
  o = o || {};
  const k = o.scale || 1, d = o.dir || 1;
  const rgb = hexToRgb(o.color || '#c8b89a');
  const line = a => `rgba(${rgb},${a})`;
  const t = tick * 0.05;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k * d, k);       // draw everything facing right; flip for left
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = line(0.8); ctx.fillStyle = line(0.13); ctx.lineWidth = 1.2 / k;

  const E  = (cx, cy, rx, ry, rot) => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, rot || 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
  const L  = (pts) => { ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke(); };
  const eye = (ex, ey, r) => {
    if (o.sleep) { ctx.beginPath(); ctx.arc(ex, ey, (r || 1.8) + 0.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); return; }
    ctx.fillStyle = 'rgba(15,12,12,0.92)'; ctx.beginPath(); ctx.arc(ex, ey, r || 1.8, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,240,0.8)'; ctx.beginPath(); ctx.arc(ex + 0.6, ey - 0.6, (r || 1.8) * 0.4, 0, 7); ctx.fill();
    ctx.fillStyle = line(0.13);
  };
  const blush = (bx, by) => { ctx.fillStyle = 'rgba(200,135,140,0.45)'; ctx.beginPath(); ctx.arc(bx, by, 1.6, 0, 7); ctx.fill(); ctx.fillStyle = line(0.13); };
  const feet = () => { L([[-4, -2], [-5, 0]]); L([[4, -2], [5, 0]]); };

  switch (kind) {
    case 'bunny':
      ctx.save(); ctx.translate(3, -40); ctx.rotate(-0.25 + Math.sin(t * 0.7) * 0.05); E(0, -10, 3.2, 10); ctx.restore();
      ctx.save(); ctx.translate(7, -40); ctx.rotate(0.15 + Math.sin(t * 0.7 + 1) * 0.08); E(0, -10, 3.2, 10); ctx.restore();
      E(0, -14, 10, 13); E(4, -32, 9, 8.5); E(-10, -8, 3, 3);
      eye(8, -33); blush(10, -29); feet(); break;

    case 'fox':
      ctx.beginPath(); ctx.moveTo(-8, -10); ctx.quadraticCurveTo(-26, -16 + Math.sin(t) * 2, -24, -30 + Math.sin(t) * 2); ctx.quadraticCurveTo(-18, -18, -8, -6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(240,235,225,0.5)'; ctx.beginPath(); ctx.arc(-24, -29 + Math.sin(t) * 2, 3, 0, 7); ctx.fill(); ctx.fillStyle = line(0.13);
      E(0, -14, 10, 13);
      L([[-2, -38], [0, -48], [5, -39]]); L([[6, -38], [10, -47], [12, -37]]);
      ctx.beginPath(); ctx.moveTo(-5, -32); ctx.quadraticCurveTo(0, -42, 10, -38); ctx.lineTo(20, -31); ctx.quadraticCurveTo(10, -24, -2, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(20, -31, 1.5, 0, 7); ctx.fill(); ctx.fillStyle = line(0.13);
      eye(9, -34); feet(); break;

    case 'hedgehog':
      for (let i = 0; i < 11; i++) {
        const a = Math.PI * (0.55 + i * 0.075), r1 = 12, r2 = 18 + (i % 2) * 2;
        L([[-2 + Math.cos(a) * r1, -12 - Math.sin(a) * r1 * 0.85], [-2 + Math.cos(a) * r2, -12 - Math.sin(a) * r2 * 0.85]]);
      }
      E(-2, -12, 14, 11);
      ctx.beginPath(); ctx.moveTo(6, -20); ctx.quadraticCurveTo(14, -18, 19, -12); ctx.quadraticCurveTo(12, -6, 6, -6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(19, -12, 1.4, 0, 7); ctx.fill(); ctx.fillStyle = line(0.13);
      eye(11, -15, 1.5); feet(); break;

    case 'gecko':
      ctx.beginPath(); ctx.moveTo(-6, -6); ctx.quadraticCurveTo(-20, -2, -24, -10 + Math.sin(t) * 3); ctx.quadraticCurveTo(-26, -18 + Math.sin(t) * 3, -20, -16 + Math.sin(t) * 3); ctx.stroke();
      E(0, -15, 8, 14); E(5, -33, 11, 7.5, -0.1);
      E(8, -38, 3.5, 3.5); eye(8.5, -38, 2.2);
      L([[10, -29], [15, -30]]);
      ctx.fillStyle = line(0.5); [[-2, -18], [3, -10], [-4, -8], [2, -22]].forEach(([sx, sy]) => { ctx.beginPath(); ctx.arc(sx, sy, 1, 0, 7); ctx.fill(); }); ctx.fillStyle = line(0.13);
      L([[-4, -2], [-6, 0], [-3, 0]]); L([[4, -2], [6, 0], [3, 0]]); break;

    case 'raccoon':
      ctx.beginPath(); ctx.moveTo(-8, -8); ctx.quadraticCurveTo(-24, -10 + Math.sin(t) * 2, -22, -24 + Math.sin(t) * 2); ctx.lineWidth = 6 / k; ctx.strokeStyle = line(0.35); ctx.stroke();
      ctx.lineWidth = 1.2 / k; ctx.strokeStyle = line(0.8);
      for (let i = 0; i < 3; i++) { const p = 0.3 + i * 0.25; const tx = -8 + (-22 + 8) * p, ty = -8 + (-24 + 8) * p + Math.sin(t) * 2 * p; L([[tx - 3, ty - 1], [tx + 3, ty + 1]]); }
      E(0, -14, 10.5, 13); E(-1, -40, 3.2, 3.2); E(9, -40, 3.2, 3.2); E(4, -32, 9.5, 8);
      ctx.strokeStyle = 'rgba(20,18,22,0.75)'; ctx.lineWidth = 3.5 / k; L([[-2, -33], [12, -33]]);
      ctx.lineWidth = 1.2 / k; ctx.strokeStyle = line(0.8);
      eye(8, -33, 1.6); ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(13.5, -30, 1.3, 0, 7); ctx.fill(); ctx.fillStyle = line(0.13);
      feet(); break;

    case 'badger':
      E(0, -14, 12, 13); E(5, -32, 10, 8);
      E(-1, -39, 2.5, 2.5); E(9, -39, 2.5, 2.5);
      ctx.strokeStyle = 'rgba(235,230,215,0.7)'; ctx.lineWidth = 2.5 / k; L([[0, -39], [6, -32], [14, -30]]);
      ctx.lineWidth = 1.2 / k; ctx.strokeStyle = line(0.8);
      eye(9, -33, 1.6); ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(15, -30, 1.4, 0, 7); ctx.fill(); ctx.fillStyle = line(0.13);
      feet(); break;

    case 'squirrel':
      ctx.beginPath(); ctx.moveTo(-6, -6); ctx.bezierCurveTo(-26, -10, -24, -44, -12, -46 + Math.sin(t) * 2); ctx.bezierCurveTo(-4, -46, -6, -34, -12, -34); ctx.stroke();
      ctx.fillStyle = line(0.1); ctx.fill(); ctx.fillStyle = line(0.13);
      E(0, -13, 9, 12); E(4, -30, 8, 7.5);
      L([[0, -36], [-1, -43], [3, -37]]); L([[5, -37], [6, -44], [8, -37]]);
      eye(8, -31); blush(10, -27); feet(); break;

    case 'otter':
      ctx.beginPath(); ctx.moveTo(-8, -4); ctx.quadraticCurveTo(-22, -2, -26, -6 + Math.sin(t) * 1.5); ctx.stroke();
      E(0, -16, 9, 15); E(3, -35, 8.5, 7.5);
      E(-3, -41, 2, 2); E(7, -41, 2, 2);
      eye(7, -36, 1.6); ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(11.5, -33, 1.4, 0, 7); ctx.fill(); ctx.fillStyle = line(0.13);
      ctx.strokeStyle = line(0.4); L([[11, -32], [18, -33]]); L([[11, -31], [18, -29]]); ctx.strokeStyle = line(0.8);
      feet(); break;

    case 'owl':
      E(0, -18, 12, 17);
      L([[-9, -32], [-11, -40], [-4, -34]]); L([[9, -32], [11, -40], [4, -34]]);
      ctx.fillStyle = 'rgba(235,225,200,0.15)'; E(-4.5, -26, 5, 5); E(4.5, -26, 5, 5); ctx.fillStyle = line(0.13);
      eye(-4.5, -26, 2.4); eye(4.5, -26, 2.4);
      ctx.fillStyle = 'rgba(210,170,90,0.85)'; ctx.beginPath(); ctx.moveTo(-1.5, -22); ctx.lineTo(1.5, -22); ctx.lineTo(0, -18); ctx.fill(); ctx.fillStyle = line(0.13);
      ctx.strokeStyle = line(0.4); L([[-11, -20], [-6, -8]]); L([[11, -20], [6, -8]]);
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, -12 + i * 3.5, 3, 0.2, Math.PI - 0.2); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(210,170,90,0.8)'; L([[-4, -1], [-4, 1]]); L([[4, -1], [4, 1]]); break;

    case 'toad':
      E(0, -9, 15, 9); E(-6, -17, 4, 4); E(6, -17, 4, 4);
      eye(-6, -18, 1.8); eye(6, -18, 1.8);
      ctx.beginPath(); ctx.arc(0, -11, 7, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      ctx.fillStyle = line(0.35); [[-8, -6], [9, -8], [3, -4]].forEach(([sx, sy]) => { ctx.beginPath(); ctx.arc(sx, sy, 1.2, 0, 7); ctx.fill(); }); ctx.fillStyle = line(0.13);
      L([[-12, -2], [-16, 0], [-10, 0]]); L([[12, -2], [16, 0], [10, 0]]); break;

    case 'snail':
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, -3, 12, 0); ctx.quadraticCurveTo(16, -4, 14, -8); ctx.lineTo(10, -6); ctx.stroke();
      L([[12, -7], [15, -16]]); L([[13, -7], [19, -14]]);
      ctx.fillStyle = 'rgba(15,12,12,0.9)'; ctx.beginPath(); ctx.arc(15, -16, 1.2, 0, 7); ctx.arc(19, -14, 1.2, 0, 7); ctx.fill(); ctx.fillStyle = line(0.13);
      E(-2, -10, 10, 10);
      ctx.beginPath(); for (let a = 0; a < Math.PI * 4; a += 0.2) { const r = 9 - a * 0.65; ctx.lineTo(-2 + Math.cos(a) * r, -10 + Math.sin(a) * r); } ctx.stroke(); break;

    case 'tortoise':
      ctx.beginPath(); ctx.ellipse(-2, -6, 17, 15, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = line(0.45); L([[-12, -10], [-5, -16], [3, -16], [9, -10]]); L([[-5, -16], [-6, -21]]); L([[3, -16], [4, -21]]); ctx.strokeStyle = line(0.8);
      E(18, -12, 5.5, 4.5); eye(20, -13, 1.4);
      L([[-12, -5], [-13, 0]]); L([[8, -5], [9, 0]]);
      ctx.strokeStyle = 'rgba(220,210,190,0.6)'; ctx.beginPath(); ctx.arc(20, -10, 5.5, 0.2, 1.4); ctx.stroke(); // reading glasses
      break;

    case 'moth': {
      const f = o.flap == null ? Math.abs(Math.sin(tick * 0.4)) : o.flap;
      ctx.save(); ctx.scale(0.35 + f * 0.65, 1);
      ctx.fillStyle = line(0.25);
      E(-6, -4, 7, 5, -0.5); E(6, -4, 7, 5, 0.5); E(-5, 4, 4.5, 3.5, 0.4); E(5, 4, 4.5, 3.5, -0.4);
      ctx.restore();
      ctx.lineWidth = 1.6 / k; L([[0, -6], [0, 6]]); ctx.lineWidth = 1 / k;
      L([[0, -6], [-3, -11]]); L([[0, -6], [3, -11]]); break;
    }

    case 'bat':
      E(0, -8, 5, 7); E(0, -17, 4.5, 4);
      L([[-3, -20], [-4, -25], [-1, -21]]); L([[3, -20], [4, -25], [1, -21]]);
      eye(-1.6, -17, 1); eye(1.6, -17, 1);
      ctx.beginPath(); ctx.moveTo(-4, -12); ctx.quadraticCurveTo(-8, -2, -4, 2); ctx.moveTo(4, -12); ctx.quadraticCurveTo(8, -2, 4, 2); ctx.stroke();
      break;

    case 'ghost':
      ctx.fillStyle = 'rgba(220,228,240,0.18)'; ctx.strokeStyle = 'rgba(220,228,240,0.75)';
      ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-11, -22); ctx.arc(0, -22, 11, Math.PI, 0); ctx.lineTo(11, 0);
      for (let i = 0; i < 4; i++) { const wx = 11 - (i + 1) * 5.5; ctx.quadraticCurveTo(wx + 2.75, -4 + Math.sin(t * 2 + i) * 2, wx, 0); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      eye(-4, -22, 1.8); eye(4, -22, 1.8);
      ctx.beginPath(); ctx.ellipse(0, -15, 2, 2.5, 0, 0, 7); ctx.stroke(); break;

    default:
      E(0, -14, 10, 13); E(3, -32, 9, 8); eye(7, -33); feet();
  }
  ctx.restore();

  if (o.label) {
    ctx.save();
    ctx.font = '8px Space Mono,monospace'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(200,190,170,0.55)';
    ctx.fillText(o.label, x, y - (o.labelY || 54) * k);
    ctx.restore();
  }
}

// which way should a critter face: toward the player if they're close-ish
function faceToward(npcX, fallback) {
  const dx = player.wx - npcX;
  return Math.abs(dx) < 260 ? (dx >= 0 ? 1 : -1) : (fallback || 1);
}
