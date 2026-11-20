/* ==========================================================================
   MMR / LMR BONUS TOLERANCE LAB · Interactive Controller (English Only)
   DIN EN ISO 2692
   ========================================================================== */

(function () {
  'use strict';

  const ISO2692 = window.ISO2692;
  const Draw = window.MMRDraw;
  const $ = (id) => document.getElementById(id);

  const TOUR_STEPS = [
    {
      tab: 'mmr',
      preset: 'scrap-saved',
      title: 'Stop 1 · How Ⓜ Rescues Good Parts from Unnecessary Scrap',
      body: 'This clearance hole was drilled at Ø10.48 mm (+0.28 mm above MMS) with center error Ø0.388 mm. Without Ⓜ, QA rejects it (Ø0.388 > Ø0.200). Yet look at the blue Ø10.00 Go-Gauge pin: it still clears with +0.092 mm to spare! With Ⓜ, the +0.28 mm bonus expands the allowed zone to Ø0.480 mm — PASS!'
    },
    {
      tab: 'mmr',
      preset: 'zero-mmc',
      title: 'Stop 2 · Zero-Tolerance-at-MMC (⌖ Ø0.00 Ⓜ)',
      body: 'Set t_pos = Ø0.00 Ⓜ and MMS = Ø10.00 mm (the exact bolt size!). Now 100% of the size tolerance becomes dynamic bonus position tolerance — eliminating arbitrary splits between size and position while keeping the exact same Ø10.00 MMVS Go-Gauge.'
    },
    {
      tab: 'zones',
      title: 'Stop 3 · Cylindrical ⌖ Ø Unlocks +57.08% Free Area Over ± Squares',
      body: 'Look at the blue crescent bonus lobes outside the square ±0.10 box: all parts inside those lobes have the exact same worst-case corner clearance as the square corners, yet legacy ± rejects them. Switching to ⌖ Ø rescues dozens of valid parts per batch.'
    },
    {
      tab: 'lmr',
      title: 'Stop 4 · Least Material Requirement Ⓛ (Minimum Wall Protection)',
      body: 'When wall burst strength matters instead of bolt clearance, Ⓛ reverses the logic: drilling a smaller hole leaves more metal in the boss wall, awarding free bonus position tolerance while guaranteeing minimum wall thickness never drops below (D_min − LMVS) / 2.'
    }
  ];

  const state = {
    tab: 'mmr',
    mmr: {
      featureType: 'hole',
      dMin: 10.20,
      dMax: 10.60,
      tPos: 0.20,
      dAct: 10.48,
      dx: 0.16,
      dy: 0.11,
      useMMR: true,
      useRPR: false
    },
    zones: {
      halfSide: 0.10,
      sigma: 0.068,
      ptX: 0.115,
      ptY: 0.035
    },
    lmr: {
      dBossMin: 19.80,
      dBossMax: 20.20,
      dBossAct: 19.90,
      dHoleMin: 10.00,
      dHoleMax: 10.40,
      dHoleAct: 10.10,
      tPos: 0.40,
      dx: 0.24,
      dy: 0.16,
      useLMR: true
    },
    mmrHit: null,
    zoneHit: null,
    tourActive: false,
    tourStep: 0
  };

  /* ---------------- TAB 1: MMR Ⓜ & FUNCTIONAL GAUGE ---------------- */
  function applyMMRPreset(name) {
    document.querySelectorAll('#mmr-presets .preset-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mpre === name);
    });

    if (name === 'scrap-saved') {
      Object.assign(state.mmr, {
        featureType: 'hole', dMin: 10.20, dMax: 10.60, tPos: 0.20,
        dAct: 10.48, dx: 0.16, dy: 0.11, useMMR: true, useRPR: false
      });
    } else if (name === 'zero-mmc') {
      Object.assign(state.mmr, {
        featureType: 'hole', dMin: 10.00, dMax: 10.60, tPos: 0.00,
        dAct: 10.44, dx: 0.15, dy: 0.12, useMMR: true, useRPR: false
      });
    } else if (name === 'at-mms') {
      Object.assign(state.mmr, {
        featureType: 'hole', dMin: 10.20, dMax: 10.60, tPos: 0.20,
        dAct: 10.20, dx: 0.07, dy: 0.05, useMMR: true, useRPR: false
      });
    } else if (name === 'reciprocity') {
      Object.assign(state.mmr, {
        featureType: 'hole', dMin: 10.20, dMax: 10.60, tPos: 0.20,
        dAct: 10.10, dx: 0.03, dy: 0.02, useMMR: true, useRPR: true
      });
    } else if (name === 'pin-fit') {
      Object.assign(state.mmr, {
        featureType: 'pin', dMin: 9.60, dMax: 10.00, tPos: 0.20,
        dAct: 9.74, dx: 0.14, dy: 0.12, useMMR: true, useRPR: false
      });
    }

    syncMMRSliders();
    updateMMRTab();
  }

  function syncMMRSliders() {
    const m = state.mmr;
    const isHole = m.featureType === 'hole';
    $('btn-feat-hole').classList.toggle('active', isHole);
    $('btn-feat-hole').classList.toggle('vermilion', isHole);
    $('btn-feat-pin').classList.toggle('active', !isHole);
    $('btn-feat-pin').classList.toggle('vermilion', !isHole);

    $('lbl-dact').textContent = isHole
      ? `Actual Hole Diameter (${m.dMin.toFixed(2)}..${m.dMax.toFixed(2)})`
      : `Actual Pin Diameter (${m.dMin.toFixed(2)}..${m.dMax.toFixed(2)})`;
    $('sl-dact').min = (isHole ? m.dMin - 0.25 : m.dMin - 0.10).toFixed(2);
    $('sl-dact').max = (isHole ? m.dMax + 0.10 : m.dMax + 0.25).toFixed(2);
    $('sl-dact').value = m.dAct.toFixed(2);
    $('sl-tpos').value = m.tPos.toFixed(2);
    $('sl-dx').value = m.dx.toFixed(2);
    $('sl-dy').value = m.dy.toFixed(2);
    $('chk-rpr').checked = m.useRPR;
  }

  function updateMMRTab() {
    const sol = ISO2692.solveMMR(state.mmr);

    $('val-dact').textContent = `Ø${sol.dAct.toFixed(2)} mm`;
    $('val-tpos').textContent = `Ø${sol.tPos.toFixed(2)} mm`;
    $('val-dx').textContent = `${sol.dx >= 0 ? '+' : ''}${sol.dx.toFixed(2)} mm`;
    $('val-dy').textContent = `${sol.dy >= 0 ? '+' : ''}${sol.dy.toFixed(2)} mm`;

    const modStr = sol.useMMR ? (sol.useRPR ? ' Ⓜ Ⓡ' : ' Ⓜ') : '';
    $('mmr-fcf-display').textContent = `| ⌖ | Ø${sol.tPos.toFixed(2)}${modStr} | A | B | C |`;
    $('btn-toggle-m').setAttribute('aria-pressed', String(sol.useMMR));
    $('ui-btn-m-label').textContent = sol.useMMR ? 'Ⓜ MMR Active' : 'Add Ⓜ MMR';
    $('mmr-master-box').classList.toggle('active-m', sol.useMMR);
    $('mmr-explain').textContent = sol.useMMR
      ? `Maximum Material Requirement active: departure from MMS (Ø${sol.mms.toFixed(2)}) unlocks ${sol.bonus >= 0 ? '+' : ''}${sol.bonus.toFixed(3)} mm bonus tolerance, expanding the allowed zone to Ø${sol.allowedPosDia.toFixed(3)} mm while locking the fixed Ø${sol.mmvs.toFixed(2)} Go-Gauge.`
      : `Regardless of Feature Size (RFS / no modifier): position zone stays rigidly fixed at Ø${sol.tPos.toFixed(3)} mm even when actual clearance is generous.`;

    // Verdicts
    $('mmr-v-rfs').className = `verdict-cell ${sol.passRFS ? 'pass' : 'fail'}`;
    $('mmr-rfs-val').textContent = sol.passRFS ? 'PASS' : 'REJECT';
    $('mmr-rfs-sub').textContent = `Ø${sol.posDiaErr.toFixed(3)} ${sol.posOkRFS ? '≤' : '>'} Ø${sol.tPos.toFixed(3)} fixed`;

    $('mmr-v-mmr').className = `verdict-cell ${sol.passMMR ? 'pass' : 'fail'}`;
    $('mmr-mmr-val').textContent = sol.passMMR ? 'PASS' : 'REJECT';
    $('mmr-mmr-sub').textContent = `Ø${sol.posDiaErr.toFixed(3)} ${sol.posOkMMR ? '≤' : '>'} Ø${sol.allowedPosDia.toFixed(3)} (${sol.bonus >= 0 ? '+' : ''}${sol.bonus.toFixed(3)} bonus)`;

    const gCell = $('mmr-v-gauge');
    if (sol.scrapSavedByMMR && sol.useMMR) {
      gCell.className = 'verdict-cell paradox';
      $('mmr-gauge-val').textContent = 'SCRAP SAVED!';
      $('mmr-gauge-sub').textContent = `Ø${sol.mmvs.toFixed(2)} MMVS gauge clears (+${sol.gaugeMarginRadial.toFixed(3)} mm)`;
    } else if (sol.gaugeFits && sol.activePass) {
      gCell.className = 'verdict-cell pass';
      $('mmr-gauge-val').textContent = 'GAUGE CLEAR';
      $('mmr-gauge-sub').textContent = `MMVS Ø${sol.mmvs.toFixed(2)} fits (+${sol.gaugeMarginRadial.toFixed(3)} mm)`;
    } else {
      gCell.className = 'verdict-cell fail';
      $('mmr-gauge-val').textContent = sol.gaugeFits ? 'RFS REJECT' : 'GAUGE CLASH!';
      $('mmr-gauge-sub').textContent = sol.gaugeFits
        ? 'Toggle Ⓜ ON to accept this working part!'
        : `Interferes with MMVS Ø${sol.mmvs.toFixed(2)} by ${sol.gaugeMarginRadial.toFixed(3)} mm`;
    }

    $('mmr-telemetry').innerHTML = `
      <tr><th>MMS / LMS</th><td>Ø${sol.mms.toFixed(2)} / Ø${sol.lms.toFixed(2)} mm</td></tr>
      <tr><th>MMVS (Go-Gauge ${sol.isHole ? 'Pin' : 'Ring'})</th><td class="tag-blue">Ø${sol.mmvs.toFixed(3)} mm</td></tr>
      <tr><th>Actual Size d_act</th><td class="${sol.sizeOk ? 'tag-pass' : 'tag-fail'}">Ø${sol.dAct.toFixed(2)} mm (${sol.sizeOk ? 'OK' : 'OUT'})</td></tr>
      <tr><th>Bonus Tolerance (from MMS)</th><td class="tag-pass">${sol.bonus >= 0 ? '+' : ''}${sol.bonus.toFixed(3)} mm</td></tr>
      <tr><th>Allowed Position Ø_allow</th><td class="tag-blue">Ø${sol.allowedPosDia.toFixed(3)} mm</td></tr>
      <tr><th>Actual True Position Øe</th><td class="${sol.activePass ? 'tag-pass' : 'tag-fail'}">Ø${sol.posDiaErr.toFixed(3)} mm</td></tr>
      <tr><th>MMVS Radial Clearance</th><td class="${sol.gaugeFits ? 'tag-pass' : 'tag-fail'}">${sol.gaugeMarginRadial >= 0 ? '+' : ''}${sol.gaugeMarginRadial.toFixed(3)} mm</td></tr>
    `;

    state.mmrHit = Draw.drawMMRPlate($('canvas-mmr'), sol);
    Draw.drawBonusChart($('canvas-bonus'), sol);
  }

  /* ---------------- TAB 2: Ø VS ± SQUARE (+57.08%) ---------------- */
  function updateZonesTab() {
    const zSol = ISO2692.solveZoneComparison(state.zones);

    $('val-zside').textContent = `±${zSol.halfSide.toFixed(2)} mm`;
    $('val-zsig').textContent = `${state.zones.sigma.toFixed(3)} mm`;
    $('val-zptx').textContent = `${zSol.ptX >= 0 ? '+' : ''}${zSol.ptX.toFixed(3)} mm`;
    $('val-zpty').textContent = `${zSol.ptY >= 0 ? '+' : ''}${zSol.ptY.toFixed(3)} mm`;

    $('z-sq-yield').textContent = `${zSol.yieldSquarePct.toFixed(1)}%`;
    $('z-sq-sub').textContent = `${zSol.countSquare} / ${zSol.batchCount} parts pass ±${zSol.halfSide.toFixed(2)}`;
    $('z-ci-yield').textContent = `${zSol.yieldCirclePct.toFixed(1)}%`;
    $('z-ci-sub').textContent = `+${zSol.countBonus} valid parts rescued in bonus lobes`;

    $('zones-telemetry').innerHTML = `
      <tr><th>Legacy ± Square Zone</th><td>±${zSol.halfSide.toFixed(2)} mm (A = ${zSol.areaSquare.toFixed(4)} mm²)</td></tr>
      <tr><th>Equivalent Ø Cylindrical Zone</th><td class="tag-blue">Ø${zSol.diaCircle.toFixed(3)} mm (A = ${zSol.areaCircle.toFixed(4)} mm²)</td></tr>
      <tr><th>Exact Area Gain (π/2 − 1)</th><td class="tag-pass">+${zSol.areaGainPct.toFixed(2)}%</td></tr>
      <tr><th>Test Part Radial Error</th><td>r = ${zSol.ptR.toFixed(3)} mm (Ø${zSol.ptDia.toFixed(3)})</td></tr>
      <tr><th>Verdict under ± Square</th><td class="${zSol.ptInSquare ? 'tag-pass' : 'tag-fail'}">${zSol.ptInSquare ? 'PASS' : 'REJECT'}</td></tr>
      <tr><th>Verdict under ⌖ Ø Cylinder</th><td class="${zSol.ptInCircle ? 'tag-pass' : 'tag-fail'}">${zSol.ptInCircle ? 'PASS' : 'REJECT'}</td></tr>
    `;

    state.zoneHit = Draw.drawZoneComparePlate($('canvas-zones'), zSol);
  }

  /* ---------------- TAB 3: LMR Ⓛ MINIMUM WALL ---------------- */
  function updateLMRTab() {
    const lSol = ISO2692.solveLMR(state.lmr);

    $('val-lh').textContent = `Ø${lSol.dHoleAct.toFixed(2)} mm`;
    $('val-lb').textContent = `Ø${lSol.dBossAct.toFixed(2)} mm`;
    $('val-ldx').textContent = `${lSol.dx >= 0 ? '+' : ''}${lSol.dx.toFixed(2)} mm`;
    $('val-ldy').textContent = `${lSol.dy >= 0 ? '+' : ''}${lSol.dy.toFixed(2)} mm`;

    $('lmr-v-wall').className = `verdict-cell ${lSol.wallSafe ? 'pass' : 'fail'}`;
    $('lmr-wall-val').textContent = `${lSol.actualMinWall.toFixed(2)} mm`;
    $('lmr-wall-sub').textContent = `Guaranteed floor ≥ ${lSol.guaranteedMinWall.toFixed(2)} mm`;

    $('lmr-v-pos').className = 'verdict-cell info';
    $('lmr-allow-val').textContent = `Ø${lSol.allowedPosDia.toFixed(3)}`;
    $('lmr-allow-sub').textContent = `t = ${lSol.tPos.toFixed(2)} + ${lSol.bonusLMR.toFixed(2)} Ⓛ bonus`;

    $('lmr-v-verdict').className = `verdict-cell ${lSol.activePass ? 'pass' : 'fail'}`;
    $('lmr-verdict-val').textContent = lSol.activePass ? 'PASS' : 'REJECT';
    $('lmr-verdict-sub').textContent = `Actual Øe = ${lSol.posDiaErr.toFixed(3)} mm`;

    $('lmr-telemetry').innerHTML = `
      <tr><th>Hole LMS (Largest Bore)</th><td>Ø${lSol.lmsHole.toFixed(2)} mm</td></tr>
      <tr><th>Hole LMVS (LMS + t_pos)</th><td class="tag-blue">Ø${lSol.lmvsHole.toFixed(2)} mm</td></tr>
      <tr><th>Guaranteed Min Wall</th><td class="tag-blue">${lSol.guaranteedMinWall.toFixed(3)} mm</td></tr>
      <tr><th>Actual Min Wall Thickness</th><td class="${lSol.wallSafe ? 'tag-pass' : 'tag-fail'}">${lSol.actualMinWall.toFixed(3)} mm</td></tr>
      <tr><th>LMR Bonus (LMS − d_act)</th><td class="tag-pass">+${lSol.bonusLMR.toFixed(3)} mm</td></tr>
      <tr><th>Allowed vs. Actual Position</th><td class="${lSol.activePass ? 'tag-pass' : 'tag-fail'}">Ø${lSol.posDiaErr.toFixed(3)} / Ø${lSol.allowedPosDia.toFixed(3)}</td></tr>
    `;

    Draw.drawLMRPlate($('canvas-lmr'), lSol);
  }

  /* ---------------- TABS, DRAGGING & GUIDED TOUR ---------------- */
  function setTab(tabName) {
    state.tab = tabName;
    document.querySelectorAll('.tab-btn').forEach(b => {
      const act = b.dataset.tab === tabName;
      b.classList.toggle('active', act);
      b.setAttribute('aria-selected', String(act));
    });
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${tabName}`));
    if (tabName === 'mmr') updateMMRTab();
    else if (tabName === 'zones') updateZonesTab();
    else if (tabName === 'lmr') updateLMRTab();
  }

  function renderTourStep() {
    const step = TOUR_STEPS[state.tourStep];
    $('tour-step-badge').textContent = `Stop ${state.tourStep + 1} / ${TOUR_STEPS.length}`;
    $('tour-title').textContent = step.title;
    $('tour-body').textContent = step.body;
    $('btn-tour-prev').disabled = state.tourStep === 0;
    $('btn-tour-next').textContent = state.tourStep === TOUR_STEPS.length - 1 ? 'Finish ✓' : 'Next →';
    if (step.tab) setTab(step.tab);
    if (step.preset) applyMMRPreset(step.preset);
  }

  function bindCanvasDragging() {
    // Drag on Tab 1 right-hand target circle to set (dx, dy)
    const c1 = $('canvas-mmr');
    let drag1 = false;
    const move1 = (e) => {
      if (!drag1 || !state.mmrHit) return;
      const r = c1.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const dx = Math.max(-0.35, Math.min(0.35, (x - state.mmrHit.rightCx) / state.mmrHit.zScale));
      const dy = Math.max(-0.35, Math.min(0.35, -(y - state.mmrHit.cy) / state.mmrHit.zScale));
      state.mmr.dx = Math.round(dx * 100) / 100;
      state.mmr.dy = Math.round(dy * 100) / 100;
      $('sl-dx').value = state.mmr.dx;
      $('sl-dy').value = state.mmr.dy;
      updateMMRTab();
    };
    c1.addEventListener('pointerdown', e => { drag1 = true; c1.setPointerCapture(e.pointerId); move1(e); });
    c1.addEventListener('pointermove', move1);
    c1.addEventListener('pointerup', () => { drag1 = false; });
    c1.addEventListener('pointercancel', () => { drag1 = false; });

    // Drag on Tab 2 zone comparison canvas
    const c2 = $('canvas-zones');
    let drag2 = false;
    const move2 = (e) => {
      if (!drag2 || !state.zoneHit) return;
      const r = c2.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const px = Math.max(-0.22, Math.min(0.22, (x - state.zoneHit.cx) / state.zoneHit.scale));
      const py = Math.max(-0.22, Math.min(0.22, -(y - state.zoneHit.cy) / state.zoneHit.scale));
      state.zones.ptX = Math.round(px * 200) / 200;
      state.zones.ptY = Math.round(py * 200) / 200;
      $('sl-zptx').value = state.zones.ptX;
      $('sl-zpty').value = state.zones.ptY;
      updateZonesTab();
    };
    c2.addEventListener('pointerdown', e => { drag2 = true; c2.setPointerCapture(e.pointerId); move2(e); });
    c2.addEventListener('pointermove', move2);
    c2.addEventListener('pointerup', () => { drag2 = false; });
    c2.addEventListener('pointercancel', () => { drag2 = false; });
  }

  function bindEvents() {
    document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

    // Tab 1
    $('btn-toggle-m').addEventListener('click', () => {
      state.mmr.useMMR = !state.mmr.useMMR;
      if (!state.mmr.useMMR) { state.mmr.useRPR = false; $('chk-rpr').checked = false; }
      updateMMRTab();
    });
    $('btn-feat-hole').addEventListener('click', () => applyMMRPreset('scrap-saved'));
    $('btn-feat-pin').addEventListener('click', () => applyMMRPreset('pin-fit'));
    document.querySelectorAll('#mmr-presets .preset-btn').forEach(b => {
      b.addEventListener('click', () => applyMMRPreset(b.dataset.mpre));
    });
    $('sl-dact').addEventListener('input', e => { state.mmr.dAct = Number(e.target.value); updateMMRTab(); });
    $('sl-tpos').addEventListener('input', e => { state.mmr.tPos = Number(e.target.value); updateMMRTab(); });
    $('sl-dx').addEventListener('input', e => { state.mmr.dx = Number(e.target.value); updateMMRTab(); });
    $('sl-dy').addEventListener('input', e => { state.mmr.dy = Number(e.target.value); updateMMRTab(); });
    $('chk-rpr').addEventListener('change', e => {
      state.mmr.useRPR = e.target.checked;
      if (state.mmr.useRPR) state.mmr.useMMR = true;
      updateMMRTab();
    });

    // Tab 2
    $('sl-zside').addEventListener('input', e => { state.zones.halfSide = Number(e.target.value); updateZonesTab(); });
    $('sl-zsig').addEventListener('input', e => { state.zones.sigma = Number(e.target.value); updateZonesTab(); });
    $('sl-zptx').addEventListener('input', e => { state.zones.ptX = Number(e.target.value); updateZonesTab(); });
    $('sl-zpty').addEventListener('input', e => { state.zones.ptY = Number(e.target.value); updateZonesTab(); });

    // Tab 3
    $('chk-use-lmr').addEventListener('change', e => { state.lmr.useLMR = e.target.checked; updateLMRTab(); });
    $('sl-lh').addEventListener('input', e => { state.lmr.dHoleAct = Number(e.target.value); updateLMRTab(); });
    $('sl-lb').addEventListener('input', e => { state.lmr.dBossAct = Number(e.target.value); updateLMRTab(); });
    $('sl-ldx').addEventListener('input', e => { state.lmr.dx = Number(e.target.value); updateLMRTab(); });
    $('sl-ldy').addEventListener('input', e => { state.lmr.dy = Number(e.target.value); updateLMRTab(); });

    // Tour
    $('btn-tour').addEventListener('click', () => {
      state.tourActive = true; state.tourStep = 0;
      $('tour-banner').classList.remove('hidden');
      renderTourStep();
    });
    $('btn-tour-prev').addEventListener('click', () => { if (state.tourStep > 0) { state.tourStep--; renderTourStep(); } });
    $('btn-tour-next').addEventListener('click', () => {
      if (state.tourStep < TOUR_STEPS.length - 1) { state.tourStep++; renderTourStep(); }
      else { state.tourActive = false; $('tour-banner').classList.add('hidden'); }
    });
    $('btn-tour-close').addEventListener('click', () => {
      state.tourActive = false; $('tour-banner').classList.add('hidden');
    });

    window.addEventListener('resize', () => {
      if (state.tab === 'mmr') updateMMRTab();
      else if (state.tab === 'zones') updateZonesTab();
      else if (state.tab === 'lmr') updateLMRTab();
    });
  }

  bindEvents();
  bindCanvasDragging();
  applyMMRPreset('scrap-saved');
})();
