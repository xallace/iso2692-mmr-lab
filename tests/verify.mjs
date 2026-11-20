/* ==========================================================================
   Analytical Verification Suite — MMR / LMR Bonus Tolerance Lab (ISO 2692)
   Run: node tests/verify.mjs
   ========================================================================== */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ISO2692 = require(path.resolve(__dirname, '..', 'mmr-math.js'));

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log(`  [PASS] ${name}`);
}

console.log('=== 1. DIN EN ISO 2692 MMR Ⓜ, MMVS & Reciprocity Ⓡ ===');

check('Hole Ø10.4 ±0.2 with Ø0.20 Ⓜ: MMS = 10.20, LMS = 10.60, MMVS = 10.00', () => {
  const s = ISO2692.solveMMR({ featureType: 'hole', dMin: 10.20, dMax: 10.60, tPos: 0.20, dAct: 10.20, dx: 0, dy: 0 });
  assert.ok(Math.abs(s.mms - 10.20) < 1e-9);
  assert.ok(Math.abs(s.lms - 10.60) < 1e-9);
  assert.ok(Math.abs(s.mmvs - 10.00) < 1e-9);
  assert.ok(Math.abs(s.bonus) < 1e-9);
});

check('External Pin Ø9.8 ±0.2 with Ø0.20 Ⓜ: MMS = 10.00, LMS = 9.60, MMVS = 10.20', () => {
  const s = ISO2692.solveMMR({ featureType: 'pin', dMin: 9.60, dMax: 10.00, tPos: 0.20, dAct: 9.74, dx: 0.14, dy: 0.12 });
  assert.ok(Math.abs(s.mms - 10.00) < 1e-9);
  assert.ok(Math.abs(s.mmvs - 10.20) < 1e-9);
  assert.ok(Math.abs(s.bonus - 0.26) < 1e-9);
  assert.equal(s.passMMR, true);
  assert.equal(s.gaugeFits, true);
});

check('Scrap Saved by Ⓜ: Hole Ø10.48 offset (0.16, 0.11) fails RFS, passes Ⓜ & clears MMVS', () => {
  const s = ISO2692.solveMMR({ featureType: 'hole', dMin: 10.20, dMax: 10.60, tPos: 0.20, dAct: 10.48, dx: 0.16, dy: 0.11, useMMR: true });
  assert.equal(s.passRFS, false);
  assert.equal(s.passMMR, true);
  assert.equal(s.gaugeFits, true);
  assert.equal(s.scrapSavedByMMR, true);
  assert.ok(Math.abs(s.bonus - 0.28) < 1e-9);
  assert.ok(Math.abs(s.allowedPosDia - 0.48) < 1e-9);
});

check('Zero-Tolerance-at-MMC (Ø0.00 Ⓜ): MMVS === MMS and allowed position === departure from MMS', () => {
  const s = ISO2692.solveMMR({ featureType: 'hole', dMin: 10.00, dMax: 10.60, tPos: 0.00, dAct: 10.44, dx: 0.15, dy: 0.12, useMMR: true });
  assert.ok(Math.abs(s.mmvs - 10.00) < 1e-9);
  assert.ok(Math.abs(s.allowedPosDia - 0.44) < 1e-9);
  assert.equal(s.passMMR, true);
  assert.equal(s.gaugeFits, true);
});

check('MMVS Gauge Boundary Equivalence: passMMR iff gaugeFits (when size in bounds)', () => {
  const sPass = ISO2692.solveMMR({ featureType: 'hole', dMin: 10.20, dMax: 10.60, tPos: 0.20, dAct: 10.40, dx: 0.20, dy: 0, useMMR: true });
  assert.equal(sPass.passMMR, true);
  assert.equal(sPass.gaugeFits, true);
  assert.ok(Math.abs(sPass.gaugeMarginRadial) < 1e-9);

  const sFail = ISO2692.solveMMR({ featureType: 'hole', dMin: 10.20, dMax: 10.60, tPos: 0.20, dAct: 10.40, dx: 0.21, dy: 0, useMMR: true });
  assert.equal(sFail.passMMR, false);
  assert.equal(sFail.gaugeFits, false);
});

check('Reciprocity Ⓜ Ⓡ permits undersized hole Ø10.10 (> MMVS 10.00) when center error ≤ Ø0.10', () => {
  const noR = ISO2692.solveMMR({ featureType: 'hole', dMin: 10.20, dMax: 10.60, tPos: 0.20, dAct: 10.10, dx: 0.03, dy: 0.02, useMMR: true, useRPR: false });
  assert.equal(noR.passMMR, false);
  const withR = ISO2692.solveMMR({ featureType: 'hole', dMin: 10.20, dMax: 10.60, tPos: 0.20, dAct: 10.10, dx: 0.03, dy: 0.02, useMMR: true, useRPR: true });
  assert.equal(withR.passMMR, true);
  assert.equal(withR.gaugeFits, true);
});

console.log('\n=== 2. Cylindrical Ø vs. ± Coordinate Square (+57.08% Area Theorem) ===');

check('Exact Area Gain = (π/2 − 1) × 100% = +57.0796%', () => {
  const z = ISO2692.solveZoneComparison({ halfSide: 0.10 });
  const expected = (Math.PI / 2 - 1) * 100;
  assert.ok(Math.abs(z.areaGainPct - expected) < 1e-9);
  assert.ok(Math.abs(z.diaCircle - 0.20 * Math.SQRT2) < 1e-9);
});

check('Point (0.115, 0.035) sits inside the blue crescent bonus lobe (Ø PASS / ± REJECT)', () => {
  const z = ISO2692.solveZoneComparison({ halfSide: 0.10, ptX: 0.115, ptY: 0.035 });
  assert.equal(z.ptInSquare, false);
  assert.equal(z.ptInCircle, true);
  assert.equal(z.ptInBonusLobe, true);
});

check('240-part batch yields strictly more passing parts under ⌖ Ø than ± square', () => {
  const z = ISO2692.solveZoneComparison({ halfSide: 0.10, sigma: 0.068, batchCount: 240 });
  assert.ok(z.countCircle > z.countSquare);
  assert.equal(z.countCircle - z.countSquare, z.countBonus);
  assert.ok(z.countBonus > 10);
});

console.log('\n=== 3. Least Material Requirement Ⓛ (Minimum Wall Thickness Theorem) ===');

check('Hole LMS = 10.40, tPos = 0.40 => LMVS = 10.80, Guaranteed Min Wall = (19.80 - 10.80)/2 = 4.50 mm', () => {
  const l = ISO2692.solveLMR({ dBossMin: 19.80, dHoleMax: 10.40, tPos: 0.40, dHoleAct: 10.10, dx: 0.24, dy: 0.16, useLMR: true });
  assert.ok(Math.abs(l.lmvsHole - 10.80) < 1e-9);
  assert.ok(Math.abs(l.guaranteedMinWall - 4.50) < 1e-9);
  assert.ok(Math.abs(l.bonusLMR - 0.30) < 1e-9);
  assert.ok(Math.abs(l.allowedPosDia - 0.70) < 1e-9);
});

check('Undersized hole Ø10.10 offset (0.24, 0.16) fails RFS, passes Ⓛ, and protects min wall ≥ 4.50 mm', () => {
  const l = ISO2692.solveLMR({ dBossMin: 19.80, dBossAct: 19.80, dHoleMin: 10.00, dHoleMax: 10.40, dHoleAct: 10.10, tPos: 0.40, dx: 0.24, dy: 0.16, useLMR: true });
  assert.equal(l.passRFS, false);
  assert.equal(l.passLMR, true);
  assert.equal(l.wallSafe, true);
  assert.ok(l.actualMinWall >= l.guaranteedMinWall - 1e-9);
});

check('LMR Wall Protection Theorem: at exact boundary e_pos = t_allow_LMR & D = D_min, actualMinWall === guaranteedMinWall', () => {
  // dHoleAct = 10.00 => bonus = 0.40 => allowed = 0.80 => max radial shift = 0.40
  const l = ISO2692.solveLMR({ dBossMin: 19.80, dBossAct: 19.80, dHoleMin: 10.00, dHoleMax: 10.40, dHoleAct: 10.00, tPos: 0.40, dx: 0.40, dy: 0, useLMR: true });
  assert.equal(l.passLMR, true);
  assert.ok(Math.abs(l.actualMinWall - l.guaranteedMinWall) < 1e-9);
});

check('Violating LMR position limit breaches guaranteed minimum wall thickness', () => {
  const l = ISO2692.solveLMR({ dBossMin: 19.80, dBossAct: 19.80, dHoleMin: 10.00, dHoleMax: 10.40, dHoleAct: 10.00, tPos: 0.40, dx: 0.45, dy: 0, useLMR: true });
  assert.equal(l.passLMR, false);
  assert.equal(l.wallSafe, false);
});

check('Disabling Ⓛ sets bonusLMR = 0 and reverts allowed position to fixed tPos', () => {
  const l = ISO2692.solveLMR({ dHoleAct: 10.10, tPos: 0.40, dx: 0.24, dy: 0.16, useLMR: false });
  assert.equal(l.bonusLMR, 0);
  assert.equal(l.allowedPosDia, 0.40);
  assert.equal(l.activePass, false);
});

console.log(`\nALL ${passed} ANALYTICAL CHECKS PASSED.`);
