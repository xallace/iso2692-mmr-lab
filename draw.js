/* ==========================================================================
   DIN EN ISO 2692 Technical Plate Renderer (1967 Book-Plate Aesthetic)
   1) MMR Ⓜ Functional Gauge (MMVS) & Live Hole/Pin Playground + Bonus Ramp
   2) Cylindrical Ø vs. ± Square (+57.08% Area & 240-Part Batch Scatter)
   3) LMR Ⓛ Boss Minimum-Wall-Thickness Inspection Plate
   ========================================================================== */

(function () {
  'use strict';

  const C = {
    paper: '#0a101a',
    warm: '#0e141e',
    grid: '#151b26',
    ink: '#e9edf5',
    muted: '#95a0b4',
    rule: '#29303c',
    ruleSoft: '#181e29',
    green: '#58b691',
    greenFill: 'rgba(88, 182, 145, 0.14)',
    blue: '#56a8e4',
    blueFill: 'rgba(86, 168, 228, 0.13)',
    amber: '#ed864b',
    amberFill: 'rgba(237, 134, 75, 0.14)',
    red: '#ff7d61',
    redFill: 'rgba(255, 125, 97, 0.14)'
  };

  function setupCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(300, Math.round(rect.width));
    const h = Math.max(150, Math.round(rect.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  function drawArrow(ctx, x1, y1, x2, y2, color, head = 6) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - 0.34), y2 - head * Math.sin(ang - 0.34));
    ctx.lineTo(x2 - head * Math.cos(ang + 0.34), y2 - head * Math.sin(ang + 0.34));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawDoubleArrow(ctx, x1, y1, x2, y2, color, head = 5.5) {
    drawArrow(ctx, x1, y1, x2, y2, color, head);
    drawArrow(ctx, x2, y2, x1, y1, color, head);
  }

  /* ========================================================================
     1) PLATE I: MMR Ⓜ INTERACTIVE FUNCTIONAL GAUGE + TOLERANCE ZONE
     ======================================================================== */
  function drawMMRPlate(canvas, sol) {
    const { ctx, w, h } = setupCanvas(canvas);

    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = C.ruleSoft;
    ctx.lineWidth = 1;
    ctx.strokeRect(10.5, 10.5, w - 21, h - 21);

    // Split canvas: Left = Physical Feature + MMVS Go-Gauge (magnified clearance!),
    // Right = True-Position Center Target (RFS circle vs. Expanded Ⓜ Bonus circle!)
    const leftCx = w * 0.30;
    const rightCx = w * 0.74;
    const cy = h * 0.54;

    // Divider hairline
    ctx.save();
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 0.9;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(w * 0.53, 24);
    ctx.lineTo(w * 0.53, h - 24);
    ctx.stroke();
    ctx.restore();

    // ---- LEFT HALF: PHYSICAL FEATURE & FIXED MMVS FUNCTIONAL GO-GAUGE ----
    // Exaggerate clearance/offset relative to MMVS so ±0.3 mm is clearly visible on a Ø10 mm feature
    const baseR = Math.min(w * 0.145, h * 0.28, 94);
    const pxPerMm = 72; // exaggerated radial deviation scale around MMVS

    // Crosshairs at TED (0,0)
    ctx.save();
    ctx.strokeStyle = 'rgba(233, 237, 245, 0.24)';
    ctx.lineWidth = 0.9;
    ctx.setLineDash([10, 4, 2, 4]);
    ctx.beginPath();
    ctx.moveTo(leftCx - baseR - 36, cy); ctx.lineTo(leftCx + baseR + 36, cy);
    ctx.moveTo(leftCx, cy - baseR - 30); ctx.lineTo(leftCx, cy + baseR + 30);
    ctx.stroke();
    ctx.restore();

    const rMMVS = baseR;
    const rAct = Math.max(18, baseR + (sol.dAct - sol.mmvs) * 0.5 * pxPerMm);
    const featCx = leftCx + sol.dx * pxPerMm;
    const featCy = cy - sol.dy * pxPerMm;

    if (sol.isHole) {
      // Plate material surrounding hole
      ctx.save();
      ctx.fillStyle = C.warm;
      ctx.strokeStyle = C.rule;
      ctx.lineWidth = 1;
      const box = baseR + 42;
      ctx.fillRect(leftCx - box, cy - box + 8, box * 2, (box - 8) * 2);
      ctx.strokeRect(leftCx - box, cy - box + 8, box * 2, (box - 8) * 2);

      // Actual Drilled Hole (white cutout shifted by dx, dy)
      ctx.beginPath();
      ctx.arc(featCx, featCy, rAct, 0, Math.PI * 2);
      ctx.fillStyle = C.paper;
      ctx.fill();
      ctx.strokeStyle = sol.activePass ? C.ink : C.red;
      ctx.lineWidth = 2.1;
      ctx.stroke();

      // Fixed Functional Go-Gauge Pin (MMVS) centered at TED (leftCx, cy)
      ctx.beginPath();
      ctx.arc(leftCx, cy, rMMVS, 0, Math.PI * 2);
      ctx.fillStyle = sol.gaugeFits ? C.blueFill : C.redFill;
      ctx.fill();
      ctx.strokeStyle = sol.gaugeFits ? C.blue : C.red;
      ctx.lineWidth = 1.9;
      ctx.setLineDash([6, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else {
      // External Pin inside Fixed Functional Go-Gauge Ring (MMVS)
      ctx.save();
      ctx.beginPath();
      ctx.arc(leftCx, cy, rMMVS, 0, Math.PI * 2);
      ctx.fillStyle = sol.gaugeFits ? C.blueFill : C.redFill;
      ctx.fill();
      ctx.strokeStyle = sol.gaugeFits ? C.blue : C.red;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Actual Pin shifted by dx, dy
      ctx.beginPath();
      ctx.arc(featCx, featCy, rAct, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(21, 27, 38, 0.92)';
      ctx.fill();
      ctx.strokeStyle = sol.activePass ? C.ink : C.red;
      ctx.lineWidth = 2.1;
      ctx.stroke();
      ctx.restore();
    }

    // Center marker of actual feature
    ctx.save();
    ctx.fillStyle = sol.activePass ? C.green : C.red;
    ctx.beginPath();
    ctx.arc(featCx, featCy, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Left panel labels
    ctx.save();
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'center';
    ctx.fillText(
      sol.isHole ? `HOLE Ø${sol.dAct.toFixed(2)} + GO-GAUGE PIN Ø${sol.mmvs.toFixed(2)}` : `PIN Ø${sol.dAct.toFixed(2)} + GO-GAUGE RING Ø${sol.mmvs.toFixed(2)}`,
      leftCx, 34
    );
    ctx.font = '600 9.5px "JetBrains Mono", monospace';
    ctx.fillStyle = sol.gaugeFits ? C.blue : C.red;
    ctx.fillText(
      sol.gaugeFits
        ? `MMVS GAUGE CLEAR (+${sol.gaugeMarginRadial.toFixed(3)} mm radial)`
        : `MMVS GAUGE CLASH (${sol.gaugeMarginRadial.toFixed(3)} mm)`,
      leftCx, h - 18
    );
    ctx.restore();

    // ---- RIGHT HALF: TRUE-POSITION ZONE TARGET (RFS vs. Ⓜ BONUS CIRCLE) ----
    const maxZoneR = Math.max(0.25, sol.maxPossiblePosDia * 0.55);
    const targetMaxPx = Math.min(w * 0.17, h * 0.34, 108);
    const zScale = targetMaxPx / maxZoneR;

    // Crosshairs
    ctx.save();
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(rightCx - targetMaxPx - 14, cy); ctx.lineTo(rightCx + targetMaxPx + 14, cy);
    ctx.moveTo(rightCx, cy - targetMaxPx - 14); ctx.lineTo(rightCx, cy + targetMaxPx + 14);
    ctx.stroke();

    // Max possible zone at LMS (subtle outer reference ring)
    const rMaxPx = (sol.maxPossiblePosDia * 0.5) * zScale;
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.arc(rightCx, cy, rMaxPx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Active Allowed Zone under Ⓜ (expanded emerald bonus ring!)
    const rAllowPx = Math.max(2, (sol.allowedPosDia * 0.5) * zScale);
    if (sol.useMMR && sol.allowedPosDia > sol.tPos + 1e-6) {
      ctx.beginPath();
      ctx.arc(rightCx, cy, rAllowPx, 0, Math.PI * 2);
      ctx.fillStyle = C.greenFill;
      ctx.fill();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Stated RFS Zone (Øt_pos)
    const rRfsPx = Math.max(2, (sol.tPos * 0.5) * zScale);
    ctx.beginPath();
    ctx.arc(rightCx, cy, rRfsPx, 0, Math.PI * 2);
    ctx.fillStyle = sol.useMMR ? 'rgba(86, 168, 228, 0.12)' : C.amberFill;
    ctx.fill();
    ctx.strokeStyle = sol.useMMR ? C.blue : C.amber;
    ctx.lineWidth = 1.7;
    ctx.stroke();

    // Actual Center Point (draggable!)
    const ptx = rightCx + sol.dx * zScale;
    const pty = cy - sol.dy * zScale;
    drawArrow(ctx, rightCx, cy, ptx, pty, sol.activePass ? C.green : C.red, 5.5);
    ctx.fillStyle = sol.activePass ? C.green : C.red;
    ctx.beginPath();
    ctx.arc(ptx, pty, 5.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.paper;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Right panel labels
    ctx.font = '700 10.5px "JetBrains Mono", monospace';
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'center';
    ctx.fillText(
      sol.useMMR ? `ALLOWED ZONE Ø${sol.allowedPosDia.toFixed(3)} (t + BONUS)` : `RFS ZONE Ø${sol.tPos.toFixed(3)} (NO BONUS)`,
      rightCx, 34
    );
    ctx.font = '600 9.5px "JetBrains Mono", monospace';
    ctx.fillStyle = sol.activePass ? C.green : C.red;
    ctx.fillText(
      `Actual Øe = ${sol.posDiaErr.toFixed(3)} mm · Drag dot to move center`,
      rightCx, h - 18
    );
    ctx.restore();

    // Return hit-test metadata for canvas dragging!
    return { rightCx, cy, zScale };
  }

  /* ========================================================================
     1B) BONUS TOLERANCE RAMP CHART (SIZE vs. ALLOWED POSITION Ø)
     ======================================================================== */
  function drawBonusChart(canvas, sol) {
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, w, h);

    const pad = { l: 58, r: 26, t: 22, b: 26 };
    const pw = w - pad.l - pad.r;
    const ph = h - pad.t - pad.b;

    const xMin = Math.min(sol.dMin, sol.mmvs) - 0.05;
    const xMax = Math.max(sol.dMax, sol.mmvs) + 0.05;
    const yMax = Math.max(0.25, sol.maxPossiblePosDia * 1.18);

    const xOf = (d) => pad.l + ((d - xMin) / (xMax - xMin)) * pw;
    const yOf = (t) => pad.t + ph * (1 - t / yMax);

    // Shaded MMR Allowed Trapezoid
    ctx.save();
    ctx.beginPath();
    if (sol.isHole) {
      const startX = sol.useRPR ? sol.mmvs : sol.mms;
      const startY = sol.useRPR ? 0 : sol.tPos;
      ctx.moveTo(xOf(startX), yOf(0));
      ctx.lineTo(xOf(startX), yOf(startY));
      ctx.lineTo(xOf(sol.lms), yOf(sol.maxPossiblePosDia));
      ctx.lineTo(xOf(sol.lms), yOf(0));
    } else {
      const endX = sol.useRPR ? sol.mmvs : sol.mms;
      const endY = sol.useRPR ? 0 : sol.tPos;
      ctx.moveTo(xOf(sol.lms), yOf(0));
      ctx.lineTo(xOf(sol.lms), yOf(sol.maxPossiblePosDia));
      ctx.lineTo(xOf(endX), yOf(endY));
      ctx.lineTo(xOf(endX), yOf(0));
    }
    ctx.closePath();
    ctx.fillStyle = sol.useMMR ? C.greenFill : 'rgba(233, 237, 245,0.04)';
    ctx.fill();
    ctx.strokeStyle = sol.useMMR ? C.green : C.rule;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // RFS Flat Rectangle
    ctx.fillStyle = C.blueFill;
    ctx.fillRect(xOf(sol.dMin), yOf(sol.tPos), xOf(sol.dMax) - xOf(sol.dMin), yOf(0) - yOf(sol.tPos));
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(xOf(sol.dMin), yOf(sol.tPos), xOf(sol.dMax) - xOf(sol.dMin), yOf(0) - yOf(sol.tPos));
    ctx.setLineDash([]);
    ctx.restore();

    // Current Part Operating Point (dAct, posDiaErr)
    const px = xOf(sol.dAct);
    const py = yOf(Math.min(yMax, sol.posDiaErr));
    ctx.save();
    ctx.strokeStyle = 'rgba(233, 237, 245,0.3)';
    ctx.lineWidth = 0.9;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(px, yOf(0)); ctx.lineTo(px, py);
    ctx.moveTo(pad.l, py); ctx.lineTo(px, py);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = sol.activePass ? C.green : C.red;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.paper;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();

    // Frame & labels
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 1;
    ctx.strokeRect(pad.l, pad.t, pw, ph);

    ctx.fillStyle = C.muted;
    ctx.font = '500 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Ø${yMax.toFixed(2)}`, pad.l - 6, pad.t + 6);
    ctx.fillText(`Ø${sol.tPos.toFixed(2)}`, pad.l - 6, yOf(sol.tPos) + 3);
    ctx.fillText('0.00', pad.l - 6, yOf(0) + 3);

    ctx.textAlign = 'center';
    ctx.fillText(`MMS ${sol.mms.toFixed(2)}`, xOf(sol.mms), h - 8);
    ctx.fillText(`LMS ${sol.lms.toFixed(2)}`, xOf(sol.lms), h - 8);
    ctx.textAlign = 'left';
    ctx.fillStyle = C.green;
    ctx.fillText('▲ Allowed Øt with Ⓜ Bonus', pad.l + 6, pad.t - 7);
    ctx.fillStyle = C.blue;
    ctx.fillText('-- Fixed Øt (RFS)', pad.l + 175, pad.t - 7);
  }

  /* ========================================================================
     2) PLATE II: CYLINDRICAL Ø VS. ± SQUARE (+57.08% AREA & BATCH SCATTER)
     ======================================================================== */
  function drawZoneComparePlate(canvas, zSol) {
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = C.ruleSoft;
    ctx.lineWidth = 1;
    ctx.strokeRect(10.5, 10.5, w - 21, h - 21);

    const cx = w * 0.5;
    const cy = h * 0.53;
    const rPx = Math.min(w, h) * 0.33;
    const scale = rPx / zSol.rCircle;
    const halfPx = zSol.halfSide * scale;

    // Drafting axes
    ctx.save();
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - rPx - 44, cy); ctx.lineTo(cx + rPx + 44, cy);
    ctx.moveTo(cx, cy - rPx - 36); ctx.lineTo(cx, cy + rPx + 36);
    ctx.stroke();

    // Circumscribed Cylindrical Ø Zone (Blue Bonus Lobes!)
    ctx.beginPath();
    ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
    ctx.fillStyle = C.blueFill;
    ctx.fill();
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inscribed ± Square Zone
    ctx.fillStyle = C.paper;
    ctx.fillRect(cx - halfPx, cy - halfPx, halfPx * 2, halfPx * 2);
    ctx.fillStyle = C.greenFill;
    ctx.fillRect(cx - halfPx, cy - halfPx, halfPx * 2, halfPx * 2);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.75;
    ctx.strokeRect(cx - halfPx, cy - halfPx, halfPx * 2, halfPx * 2);

    // Diagonal proof line (corner radius = a * sqrt(2))
    ctx.strokeStyle = C.amber;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + halfPx, cy - halfPx);
    ctx.stroke();
    ctx.setLineDash([]);

    // Batch Scatter Dots (240 simulated parts)
    zSol.batch.forEach(p => {
      const px = cx + p.x * scale;
      const py = cy - p.y * scale;
      if (Math.hypot(px - cx, py - cy) > rPx + 42) return;
      ctx.fillStyle = p.inSq
        ? 'rgba(88, 182, 145, 0.55)'
        : p.inBonus
          ? 'rgba(86, 168, 228, 0.90)'
          : 'rgba(255, 125, 97, 0.42)';
      ctx.beginPath();
      ctx.arc(px, py, p.inBonus ? 3.2 : 2.3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Interactive Test Point (ptX, ptY)
    const tx = cx + zSol.ptX * scale;
    const ty = cy - zSol.ptY * scale;
    drawArrow(ctx, cx, cy, tx, ty, zSol.ptInCircle ? C.blue : C.red, 5.5);
    ctx.fillStyle = zSol.ptInSquare ? C.green : zSol.ptInBonusLobe ? C.blue : C.red;
    ctx.beginPath();
    ctx.arc(tx, ty, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.paper;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Bonus Lobe Annotation
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillStyle = C.blue;
    ctx.textAlign = 'center';
    ctx.fillText('+57.1% BONUS AREA', cx, cy - halfPx - (rPx - halfPx) * 0.45 + 3);

    // Corner Callouts
    ctx.textAlign = 'left';
    ctx.fillStyle = C.ink;
    ctx.fillText(`Square: ±${zSol.halfSide.toFixed(2)} mm (A = ${zSol.areaSquare.toFixed(4)} mm²)`, 22, 32);
    ctx.fillStyle = C.blue;
    ctx.fillText(`Cylinder: Ø${zSol.diaCircle.toFixed(3)} mm (A = ${zSol.areaCircle.toFixed(4)} mm²)`, 22, 48);

    ctx.textAlign = 'right';
    ctx.fillStyle = zSol.ptInBonusLobe ? C.blue : zSol.ptInSquare ? C.green : C.red;
    ctx.fillText(
      zSol.ptInBonusLobe
        ? 'TEST PART: IN BONUS LOBE (Ø PASS / ± REJECT!)'
        : zSol.ptInSquare
          ? 'TEST PART: INSIDE BOTH ± AND Ø'
          : 'TEST PART: OUTSIDE BOTH ZONES',
      w - 22, 32
    );
    ctx.restore();

    return { cx, cy, scale };
  }

  /* ========================================================================
     3) PLATE III: LMR Ⓛ MINIMUM WALL THICKNESS PLATE
     ======================================================================== */
  function drawLMRPlate(canvas, lSol) {
    const { ctx, w, h } = setupCanvas(canvas);
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = C.ruleSoft;
    ctx.lineWidth = 1;
    ctx.strokeRect(10.5, 10.5, w - 21, h - 21);

    const cx = w * 0.5;
    const cy = h * 0.53;
    const pxPerMm = Math.min(w, h) / 28; // Ø20 mm boss -> ~160 px radius? Wait: 20 mm * pxPerMm/2
    const scale = Math.min(w * 0.35, h * 0.37) / (lSol.dBossMax * 0.5);

    // Amplify center shift slightly for visual clarity while showing exact true wall dimension!
    const visShiftMult = 2.6;
    const rBoss = (lSol.dBossAct * 0.5) * scale;
    const rHole = (lSol.dHoleAct * 0.5) * scale;
    const rLMVS = (lSol.lmvsHole * 0.5) * scale;

    const hx = cx + lSol.dx * scale * visShiftMult;
    const hy = cy - lSol.dy * scale * visShiftMult;

    // Crosshairs
    ctx.save();
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(cx - rBoss - 30, cy); ctx.lineTo(cx + rBoss + 30, cy);
    ctx.moveTo(cx, cy - rBoss - 24); ctx.lineTo(cx, cy + rBoss + 24);
    ctx.stroke();

    // Solid Circular Boss
    ctx.beginPath();
    ctx.arc(cx, cy, rBoss, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(21, 27, 38, 0.92)';
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.stroke();

    // LMVS Virtual Boundary (Dashed Cobalt — hole must stay inside this to guarantee min wall!)
    ctx.beginPath();
    ctx.arc(cx, cy, rLMVS, 0, Math.PI * 2);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Actual Drilled Bore (White Cutout shifted by dx, dy)
    ctx.beginPath();
    ctx.arc(hx, hy, rHole, 0, Math.PI * 2);
    ctx.fillStyle = C.paper;
    ctx.fill();
    ctx.strokeStyle = lSol.activePass ? C.ink : C.red;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Thinnest Wall Sector Caliper Arrow!
    const dirAng = (Math.hypot(lSol.dx, lSol.dy) > 1e-6) ? Math.atan2(-lSol.dy, lSol.dx) : 0;
    const wInX = hx + Math.cos(dirAng) * rHole;
    const wInY = hy + Math.sin(dirAng) * rHole;
    const wOutX = cx + Math.cos(dirAng) * rBoss;
    const wOutY = cy + Math.sin(dirAng) * rBoss;
    const wCol = lSol.wallSafe ? C.green : C.red;
    drawDoubleArrow(ctx, wInX, wInY, wOutX, wOutY, wCol, 5.5);

    // Wall Label
    const mx = (wInX + wOutX) * 0.5 + Math.cos(dirAng) * 34;
    const my = (wInY + wOutY) * 0.5 + Math.sin(dirAng) * 26;
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillStyle = wCol;
    ctx.textAlign = 'center';
    ctx.fillText(`w_min = ${lSol.actualMinWall.toFixed(2)} mm`, Math.max(85, Math.min(w - 85, mx)), Math.max(66, Math.min(h - 32, my)));

    // Header text
    ctx.textAlign = 'left';
    ctx.fillStyle = C.ink;
    ctx.font = '700 11.5px "JetBrains Mono", monospace';
    ctx.fillText(`BOSS Ø${lSol.dBossAct.toFixed(2)} · HOLE Ø${lSol.dHoleAct.toFixed(2)} · | ⌖ | Ø${lSol.tPos.toFixed(2)}${lSol.useLMR ? ' Ⓛ' : ''} | A |`, 22, 32);
    ctx.font = '500 10px "Inter", sans-serif';
    ctx.fillStyle = C.muted;
    ctx.fillText(`LMVS Boundary = Ø${lSol.lmvsHole.toFixed(2)} mm · Guaranteed Min. Wall = ${lSol.guaranteedMinWall.toFixed(2)} mm`, 22, 48);
    ctx.restore();
  }

  window.MMRDraw = {
    drawMMRPlate,
    drawBonusChart,
    drawZoneComparePlate,
    drawLMRPlate
  };
})();
