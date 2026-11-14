# Lean-Analyse der SubQG-Universumsentwicklung

**Datum:** 14. November 2026<br>
**Lean:** 4.34.1, `x86_64-w64-windows-gnu`, Release<br>
**Mathlib-Umgebung:** `F:\MathResearchDB_v0_4\lean_cache`<br>
**Ergebnis:** **BESTANDEN**

## Gegenstand

Dieser Bericht bewertet die formale Begleitdatei
`formal/SubQGUniverseEvolution.lean` zur neuen additiven
`SubQGUniverseEvolution`-Implementierung.

Die Lean-Datei formalisiert bewusst keine astronomischen Namen als
Fundamentalobjekte. „Stern“, „Planet“, „Nebel“, „Galaxie“ und „Supernova“ sind
im Programm nachträgliche Interpretationskandidaten. Formal geprüft werden die
strukturellen Garantien, die unabhängig von diesen Namen gelten müssen.

## Prüfergebnis

| Eigenschaft | Ergebnis |
|---|---|
| Lean-Kompilierung | BESTANDEN |
| Theoreme | 22 |
| Definitionen | 6 |
| Strukturen | 6 |
| Induktive Klassifikationstypen | 1 |
| `sorry` | 0 |
| `admit` | 0 |
| `sorryAx` | 0 |
| Compilerfehler | 0 |
| SHA-256 der Lean-Datei | `E1B7A246E1C67538C11397708A59DE741F7EF3E5D09E72746A7BD4AF00017F5F` |

## Formal geprüfte Aussagen

### 1. Raumloser Anfang

`initialState` enthält genau ein erstes relationales Ereignis, aber keine
räumliche Kante, kein Simplex und keinen Fortschritt der relationalen Uhr.

Geprüfte Sätze:

- `initial_has_one_event`;
- `initial_has_no_spatial_edges`;
- `initial_has_no_simplices`;
- `initial_clock_is_zero`.

Damit wird im formalen Modell kein fertiger Raum als Anfangsbedingung
vorausgesetzt.

### 2. Monotone kausale Aktualisierung

`CausalExtension before after` verlangt, dass Knoten, Kanten und Simplexe nur
hinzukommen und dass relationale Uhr sowie Epoche nicht rückwärts laufen.

Geprüfte Sätze:

- `causal_nodes_monotone`;
- `causal_edges_monotone`;
- `causal_simplices_monotone`;
- `relational_clock_monotone`;
- `causal_extension_transitive`.

Die Transitivität zeigt: Wenn jeder einzelne Schritt gültig ist, bleibt auch
eine beliebig zusammengesetzte Entwicklung eine append-only kausale
Erweiterung.

### 3. Konstruktive Aktualisierung

`actualize` vereinigt den bisherigen Zustand mit neu aktualisierten Knoten,
Kanten und Simplizes. Die Uhr wächst exakt um die Anzahl neu gemeldeter Kanten
und Simplizes.

Geprüfte Sätze:

- `actualize_is_causal_extension`;
- `actualization_clock_increment`;
- `nonempty_new_relation_advances_clock`.

Insbesondere ist formal bewiesen: Enthält ein Schritt mindestens eine neue
Kante oder ein neues Simplex, steigt die relationale Uhr strikt.

### 4. Zwei-Milliarden-Jahre-Anzeige

`calibratedAge yearsPerEpoch epoch` ist ausdrücklich eine Anzeigeabbildung und
kein Bestandteil der SubQG-Zustandsdynamik.

Geprüfte Sätze:

- `calibrated_age_monotone`;
- `two_billion_year_display_calibration`.

Lean bestätigt exakt:

```text
1.000.000 Jahre/Epoche × 2.000 Epochen = 2.000.000.000 Jahre
```

Dies beweist die korrekte Kalibrierungsarithmetik, nicht die empirische
Herleitung der Umrechnung zwischen SubQG-Epoche und SI-Jahr.

### 5. Unbekannte Strukturen sind zulässig

Der induktive Typ `Interpretation` enthält ausdrücklich `unknown` neben
Kandidaten für Strahlungskern, Orbitkörper, diffuse Wolke, galaktischen Komplex
und Phasenfreisetzung.

`unknown_is_a_valid_unresolved_result` beweist, dass eine Analyse ohne
erzwungene Auflösung ein gültiges Resultat ist. Das Modell muss eine neue
Struktur daher nicht voreilig einer bekannten astronomischen Klasse zuordnen.

### 6. Analyse verändert die Physik nicht

`Observation` trennt drei Ebenen:

1. den physikalischen relationalen Zustand;
2. den Fingerabdruck der Rohmessung;
3. die austauschbare nachträgliche Analyse.

Geprüfte Sätze:

- `reanalysis_preserves_physical_state`;
- `reanalysis_preserves_raw_evidence`;
- `competing_interpretations_do_not_change_dynamics`.

Damit ist formal bewiesen: Ob dieselbe Struktur später als mögliche Galaxie,
als möglicher Nebel oder weiterhin als unbekannt bewertet wird, verändert
weder den gespeicherten SubQG-Zustand noch seine Rohdaten.

### 7. Entdeckungen bleiben archiviert

Geprüfte Sätze:

- `prior_discoveries_remain_in_archive`;
- `new_discovery_is_archived`.

Das Anhängen einer neuen Beobachtung entfernt keine frühere Entdeckung. Dadurch
können heute unbekannte Strukturen später mit verbesserten Analysekriterien
erneut untersucht werden.

### 8. Archivstatus und Netzpfade

`archived_signature_preserves_actualized_node` beweist: Wenn der Peak-Knoten
einer später archivierten Struktursignatur bereits aktualisiert war, bleibt er
unter jeder `CausalExtension` aktualisiert. „Archiviert“ ist daher formal keine
Aussage über eine Trennung vom SubQG-Netz.

`NetworkPathDiagnostic` trennt den überprüften Netzpfad von der visuellen
3D-Einbettung. Der Satz
`network_path_diagnostic_connects_recorded_endpoints` beweist, dass ein gültiger
Diagnoseeintrag tatsächlich eine Knotenliste mit dem gemeldeten Start- und
Endknoten enthält. Dieser Satz hängt laut `#print axioms` von keinen Axiomen ab.

## Axiom-Auswertung

`#print axioms` meldete ausschließlich Teilmengen der üblichen
Lean-/Mathlib-Vertrauensbasis:

- `propext`;
- `Classical.choice`;
- `Quot.sound`.

Kein geprüfter Satz hängt von `sorryAx` oder einem projektspezifisch eingeführten
Naturgesetz-Axiom ab.

## Numerische Gegenprüfung

Die formalen Invarianten werden durch die JavaScript-Tests und den kanonischen
Langzeitlauf ergänzt:

- 365 von 365 Projekttests bestanden, einschließlich vier Viewer-Vertragstests;
- 8 von 8 Universums-Unit-Tests bestanden;
- 8 von 8 Langzeit-Validierungsgates bestanden;
- 320 latente SubQG-Zustände, davon 311 im aktualisierten Hauptsektor;
- 905 aktualisierte Kanten und 720 Simplexe;
- relationale Uhr: 1.625;
- 172 archivierte Einzelstrukturen, davon 64 weiterhin unbekannt;
- 23 mehrskalige Strukturkomplexe;
- 13 Strahlungskern-, 95 Orbitkörper- und 19 Phasenfreisetzungs-Signaturen.

Die letztgenannten Werte sind modellinterne Kandidatensignaturen. Sie bedeuten
nicht, dass bereits 13 reale Sterne, 95 reale Planeten oder 19 reale Supernovae
empirisch nachgewiesen wurden.

## Reproduktion

```powershell
npm run verify:lean
npm test
npm run validation:universe-2gyr
```

Das Lean-Skript prüft nun verpflichtend:

1. `formal/SubQGDerivation.lean`;
2. `formal/SubQGUniverseEvolution.lean`;
3. `docs/SubQG_Formal_Verification_2026-11-11.lean`.

## Schlussfolgerung

Die neuen strukturellen Invarianten der SubQG-Universumsentwicklung sind für
Lean 4 formal bestanden. Besonders relevant sind die append-only Entstehung
relationaler Raumzeit, die monotone Uhr, der korrekte raumlose Anfang und die
kernelgeprüfte Trennung zwischen Dynamik und später Interpretation. Unbekannte
Strukturen dürfen dauerhaft unbekannt bleiben und können erneut analysiert
werden, ohne ihre Entstehungsgeschichte umzuschreiben. Zusätzlich ist nun
formal festgehalten, dass ein archiviertes Makrolabel keinen aktualisierten
SubQG-Knoten entfernt und dass ausgegebene Netzpfade ihre Endpunkte bezeugen.
