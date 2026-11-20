/* ==========================================================================
   DIN EN ISO 2692 Analytical MMR / LMR / Virtual Condition Engine
   1) MMR Ⓜ & Reciprocity Ⓡ Solver (Internal Hole & External Pin, MMVS Gauge)
   2) Cylindrical Ø vs. ± Coordinate Square (+57.08% Area & Batch Yield)
   3) LMR Ⓛ Least Material Requirement & Minimum Wall Thickness Solver
   All linear dimensions in millimeters (mm). Dual Browser + Node.js module.
   ========================================================================== */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ISO2692 = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const EPS = 1e-9;

  /* ========================================================================
     1) MMR Ⓜ / VIRTUAL CONDITION (MMVS) & RECIPROCITY Ⓡ SOLVER
     ======================================================================== */

  /**
   * Solve ISO 2692 Maximum Material Requirement for a hole or pin.
   * - Internal (hole): MMS = dMin, LMS = dMax, MMVS = MMS - tPos
   *   Bonus = max(0, dAct - MMS)
   * - External (pin):  MMS = dMax, LMS = dMin, MMVS = MMS + tPos
   *   Bonus = max(0, MMS - dAct)
   * - Reciprocity (Ⓜ Ⓡ): permits actual size to go beyond MMS down/up to MMVS
   *   provided geometric error uses less than tPos (i.e. gauge still fits!).
   */
  function solveMMR(params) {
    const {
      featureType = 'hole', // 'hole' | 'pin'
      dMin = 10.20,
      dMax = 10.60,
      tPos = 0.20,          // stated cylindrical position tolerance Øt (mm)
      dAct = 10.48,         // actual produced diameter (mm)
      dx = 0.16,            // actual center X offset from TED (mm)
      dy = 0.11,            // actual center Y offset from TED (mm)
      useMMR = true,        // Ⓜ modifier active
      useRPR = false        // Ⓡ reciprocity active (requires Ⓜ)
    } = params;

    const isHole = featureType === 'hole';
    const mms = isHole ? dMin : dMax;
    const lms = isHole ? dMax : dMin;
    const sizeTol = dMax - dMin;

    // Maximum Material Virtual Size (MMVS) = fixed functional Go-Gauge diameter
    const mmvs = isHole ? (mms - tPos) : (mms + tPos);

    // Actual radial center error & cylindrical true-position error (Øe = 2 * r)
    const radialErr = Math.hypot(dx, dy);
    const posDiaErr = 2 * radialErr;

    // Departure from MMS (positive when away from MMS toward LMS)
    const departureFromMMS = isHole ? (dAct - mms) : (mms - dAct);

    // Bonus tolerance under Ⓜ (if RPR is active, departure can be negative down to MMVS, trading geom tol for size!)
    let bonus = 0;
    if (useMMR) {
      bonus = useRPR ? departureFromMMS : Math.max(0, departureFromMMS);
    }

    const allowedPosDia = Math.max(0, tPos + bonus);
    const maxPossiblePosDia = tPos + sizeTol; // at LMS

    // Size check (with RPR, the MMS limit relaxes to MMVS while LMS stays fixed!)
    const sizeOkStandard = dAct >= dMin - EPS && dAct <= dMax + EPS;
    const sizeOkRPR = isHole
      ? (dAct >= mmvs - EPS && dAct <= dMax + EPS)
      : (dAct >= dMin - EPS && dAct <= mmvs + EPS);
    const sizeOk = (useMMR && useRPR) ? sizeOkRPR : sizeOkStandard;

    // Geometric position check
    const posOkRFS = posDiaErr <= tPos + EPS;
    const posOkMMR = posDiaErr <= allowedPosDia + EPS;

    const passRFS = sizeOkStandard && posOkRFS;
    const passMMR = sizeOk && posOkMMR;
    const activePass = useMMR ? passMMR : passRFS;

    // Physical Functional Gauge (MMVS) check:
    // For hole: a rigid pin of diameter MMVS at TED (0,0) fits inside circle (dx,dy,R=dAct/2)
    //   iff distance(0, center) + MMVS/2 <= dAct/2  <=>  dAct - 2*r >= MMVS
    // For pin:  a rigid ring of diameter MMVS at TED (0,0) fits over pin (dx,dy,R=dAct/2)
    //   iff distance(0, center) + dAct/2 <= MMVS/2  <=>  dAct + 2*r <= MMVS
    const gaugeMarginRadial = isHole
      ? (dAct * 0.5 - (radialErr + mmvs * 0.5))
      : (mmvs * 0.5 - (radialErr + dAct * 0.5));
    const gaugeFits = gaugeMarginRadial >= -EPS;

    // Scrap saved by Ⓜ: RFS rejects it, yet Ⓜ accepts it (and MMVS functional gauge passes!)
    const scrapSavedByMMR = (!passRFS) && passMMR && gaugeFits;

    return {
      featureType,
      isHole,
      dMin,
      dMax,
      mms,
      lms,
      sizeTol,
      tPos,
      mmvs,
      dAct,
      dx,
      dy,
      radialErr,
      posDiaErr,
      departureFromMMS,
      bonus,
      allowedPosDia,
      maxPossiblePosDia,
      sizeOk,
      posOkRFS,
      posOkMMR,
      passRFS,
      passMMR,
      activePass,
      gaugeMarginRadial,
      gaugeFits,
      scrapSavedByMMR,
      useMMR,
      useRPR
    };
  }

  /* ========================================================================
     2) CYLINDRICAL Ø VS. ± SQUARE ZONE (+57.08% AREA GAIN & SEEDED BATCH)
     ======================================================================== */

  /**
   * Compare a legacy ±halfSide square zone against its circumscribed Ø cylinder zone:
   * - Square: [-halfSide, +halfSide]^2  -> worst-case corner radius = halfSide * sqrt(2)
   * - Equivalent Ø zone with the EXACT SAME worst-case functional corner distance:
   *     diaZone = 2 * halfSide * sqrt(2)
   * - Area gain: (pi/2 - 1) = +57.079632679%
   */
  function solveZoneComparison(params) {
    const {
      halfSide = 0.10, // ±0.10 mm square half-width
      ptX = 0.115,     // interactive test part X (mm)
      ptY = 0.035,     // interactive test part Y (mm)
      batchCount = 240,
      sigma = 0.068    // process std dev (mm)
    } = params;

    const rCircle = halfSide * Math.SQRT2;
    const diaCircle = 2 * rCircle;
    const areaSquare = 4 * halfSide * halfSide;
    const areaCircle = Math.PI * rCircle * rCircle;
    const areaGainPct = ((areaCircle - areaSquare) / areaSquare) * 100; // exact 57.07963...%

    const ptR = Math.hypot(ptX, ptY);
    const ptInSquare = Math.abs(ptX) <= halfSide + EPS && Math.abs(ptY) <= halfSide + EPS;
    const ptInCircle = ptR <= rCircle + EPS;
    const ptInBonusLobe = ptInCircle && !ptInSquare;

    // Deterministic seeded Box-Muller normal batch (reproducible for tests & UI)
    let seed = 26921101;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const gauss = () => {
      const u1 = Math.max(1e-7, rand());
      const u2 = rand();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    };

    const batch = [];
    let countSquare = 0;
    let countCircle = 0;
    let countBonus = 0;
    for (let i = 0; i < batchCount; i++) {
      const x = gauss() * sigma;
      const y = gauss() * sigma;
      const inSq = Math.abs(x) <= halfSide + EPS && Math.abs(y) <= halfSide + EPS;
      const inCi = Math.hypot(x, y) <= rCircle + EPS;
      if (inSq) countSquare++;
      if (inCi) countCircle++;
      if (inCi && !inSq) countBonus++;
      batch.push({ x, y, inSq, inCi, inBonus: inCi && !inSq });
    }

    return {
      halfSide,
      rCircle,
      diaCircle,
      areaSquare,
      areaCircle,
      areaGainPct,
      ptX,
      ptY,
      ptR,
      ptDia: 2 * ptR,
      ptInSquare,
      ptInCircle,
      ptInBonusLobe,
      batch,
      batchCount,
      countSquare,
      countCircle,
      countBonus,
      yieldSquarePct: (countSquare / batchCount) * 100,
      yieldCirclePct: (countCircle / batchCount) * 100
    };
  }

  /* ========================================================================
     3) LMR Ⓛ LEAST MATERIAL REQUIREMENT (MINIMUM WALL THICKNESS)
     ======================================================================== */

  /**
   * Models a circular boss (outer dia dBossAct in [dBossMin..dBossMax], centered at datum)
   * containing a bore (inner dia dHoleAct in [dHoleMin..dHoleMax]) with ⌖ ØtPos Ⓛ.
   * - Hole LMS = dHoleMax (largest hole => thinnest wall!)
   * - Hole LMVS = dHoleMax + tPos (virtual largest swept bore boundary)
   * - Guaranteed minimum wall thickness (assuming concentric boss at D_bossMin):
   *     wGuaranteed = (dBossMin - LMVS) / 2
   * - Under Ⓛ: as actual hole shrinks below dHoleMax, bonus = dHoleMax - dHoleAct
   *     tAllow = tPos + bonus
   * - Actual minimum remaining wall thickness:
   *     wActualMin = (dBossAct - dHoleAct) / 2 - hypot(dx, dy)
   *   Theorem: whenever dBossAct >= dBossMin and 2*hypot(dx,dy) <= tPos + (dHoleMax - dHoleAct),
   *     wActualMin >= wGuaranteed ALWAYS holds!
   */
  function solveLMR(params) {
    const {
      dBossMin = 19.80,
      dBossMax = 20.20,
      dBossAct = 19.90,
      dHoleMin = 10.00,
      dHoleMax = 10.40,
      dHoleAct = 10.10,
      tPos = 0.40,
      dx = 0.24,
      dy = 0.16,
      useLMR = true
    } = params;

    const lmsHole = dHoleMax;
    const lmvsHole = lmsHole + tPos;
    const guaranteedMinWall = (dBossMin - lmvsHole) * 0.5;

    const radialErr = Math.hypot(dx, dy);
    const posDiaErr = 2 * radialErr;
    const bonusLMR = useLMR ? Math.max(0, lmsHole - dHoleAct) : 0;
    const allowedPosDia = tPos + bonusLMR;

    const sizeOk = dHoleAct >= dHoleMin - EPS && dHoleAct <= dHoleMax + EPS;
    const passRFS = sizeOk && (posDiaErr <= tPos + EPS);
    const passLMR = sizeOk && (posDiaErr <= allowedPosDia + EPS);
    const activePass = useLMR ? passLMR : passRFS;

    const actualMinWall = (dBossAct - dHoleAct) * 0.5 - radialErr;
    const wallSafe = actualMinWall >= guaranteedMinWall - EPS;

    return {
      dBossMin,
      dBossMax,
      dBossAct,
      dHoleMin,
      dHoleMax,
      dHoleAct,
      lmsHole,
      lmvsHole,
      tPos,
      dx,
      dy,
      radialErr,
      posDiaErr,
      bonusLMR,
      allowedPosDia,
      guaranteedMinWall,
      actualMinWall,
      wallSafe,
      passRFS,
      passLMR,
      activePass,
      useLMR
    };
  }

  return {
    solveMMR,
    solveZoneComparison,
    solveLMR
  };
}));
