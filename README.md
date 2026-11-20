# MMR / LMR Bonus Tolerance Lab · DIN EN ISO 2692

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-d94426?style=for-the-badge&logo=github)](https://xallace.github.io/iso2692-mmr-lab/)
[![License: MIT](https://img.shields.io/badge/License-MIT-047857?style=for-the-badge)](LICENSE)
[![Standards Verified](https://img.shields.io/badge/ISO_2692-14_Analytical_Checks-181715?style=for-the-badge)](#verification)

Interactive standalone **1967 Book-Plate** lab for **DIN EN ISO 2692** (Maximum Material Requirement `Ⓜ`, Least Material Requirement `Ⓛ`, Reciprocity `Ⓡ`, and Virtual Condition `MMVS`/`LMVS`), demonstrating how `Ⓜ` and cylindrical `Ø` position zones eliminate unnecessary scrap while mathematically guaranteeing assembly.

## Four Interactive Modules

1. **MMR `Ⓜ` & Functional Gauge (`MMVS`):** Drag a clearance hole or mating pin live on the plate, watch bonus tolerance grow as actual diameter departs from `MMS`, test **Zero-Tolerance-at-MMC (`Ø0.00 Ⓜ`)** and **Reciprocity (`Ⓜ Ⓡ`)**, and see exact Go-Gauge clearance (`MMVS`) alongside the ISO 2692 Size-vs.-Position trapezoid ramp.
2. **Cylindrical `Ø` vs. `±` Square (`+57.08%` Area Gain):** Proves mathematically and visually with a 240-part simulated batch why cylindrical true position awards **+57.08% more usable tolerance area** in the four crescent bonus lobes at identical worst-case radial clearance.
3. **LMR `Ⓛ` (Minimum Wall Thickness):** Interactive circular boss + bore inspection plate proving how Least Material Requirement protects thin walls (`w_min ≥ w_guaranteed`) while awarding bonus position tolerance when a bore is drilled undersize.
4. **ISO 2692 Rules & Formula Sheet:** Clear decision guide on when to specify `Ⓜ`, `Ⓛ`, or no modifier (RFS for bearing seats & gear centers).

## Running Standalone
Open [`index.html`](index.html) directly in any modern browser (`file://` or HTTP) — zero build steps and zero external runtime dependencies.

## Verification
```bash
node tests/verify.mjs
```

## License
Licensed under the **MIT License** ([LICENSE](LICENSE)).
