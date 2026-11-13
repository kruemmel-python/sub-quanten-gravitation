# Aktuelles formales Prüfergebnis

Datum: 13. November 2026<br>
Lean: 4.34.1<br>
Ergebnis: **BESTANDEN**

## Umfang

- `formal/SubQGDerivation.lean`: 34 Theoreme;
- `formal/SubQGUniverseEvolution.lean`: 18 Theoreme;
- `docs/SubQG_Formal_Verification_2026-11-11.lean`: 23 Theoreme;
- gesamt: 75 Theoreme;
- `sorry`, `admit`, `sorryAx`: keine;
- Axiom-Basis: `propext`, `Classical.choice`, `Quot.sound`.

## Begleitprüfungen

- 360 von 360 JavaScript-Tests bestanden;
- 8 von 8 interne Langzeitgates bestanden;
- kanonischer Lauf bis 2.000.000.000 kalibrierte Jahre bestanden.

Ausführliche Berichte:

- [`docs/LEAN_VERIFIKATIONSBERICHT.md`](../docs/LEAN_VERIFIKATIONSBERICHT.md)
- [`docs/SUBQG_UNIVERSE_LEAN_BERICHT.md`](../docs/SUBQG_UNIVERSE_LEAN_BERICHT.md)
- [`docs/SUBQG_UNIVERSE_EVOLUTION.md`](../docs/SUBQG_UNIVERSE_EVOLUTION.md)

Reproduktion:

```powershell
npm run verify:lean
npm test
npm run validation:universe-2gyr
```
