# Vollständiger Lean-Verifikationsbericht

**Projekt:** Sub Quanten Gravitation  
**Berichtsdatum:** 13. November 2026  
**Geprüfter Quellstand:** `a5702b94af2ca37fbb27ac628f3c1e0d21525844`  
**Ergebnis:** **BESTANDEN**

## 1. Zweck und Prüfumfang

Dieser Bericht dokumentiert die formale Prüfung der im Repository enthaltenen
Lean-Quellen. Geprüft wurden sowohl die zentrale SubQG-Formalisierung als auch
das vollständige Paket der 20 nummerierten Formeln und drei ergänzenden Sätze.

Die Prüfung beantwortet drei getrennte Fragen:

1. Lassen sich alle Deklarationen mit Lean 4 und Mathlib vollständig elaborieren?
2. Kommen die Beweise ohne `sorry`, `admit` oder `sorryAx` aus?
3. Welche Aussagen folgen formal aus den jeweils ausdrücklich angegebenen
   Definitionen und Voraussetzungen?

Lean beweist die logische Korrektheit dieser Folgerungen innerhalb des
formalisierten Modells. Die Prüfung allein beweist nicht, dass sämtliche
Modellannahmen Naturgesetze sind, und ersetzt keine experimentelle Replikation.

## 2. Verwendete Umgebung

| Komponente | Wert |
|---|---|
| Lean | 4.34.1 |
| Plattform | `x86_64-w64-windows-gnu` |
| Lean-Build | `5045d0056413266e57c625dcd7c365b10e377c52` |
| Modus | Release |
| Mathlib-Umgebung | `F:\MathResearchDB_v0_4\lean_cache` |
| Projekt | `H:\Sub-Quanten-Gravitation` |

Die vorhandene Lean-Installation wurde nur als Compiler verwendet. Temporäre
Dateien wurden auf Laufwerk H: angelegt und nach der Prüfung entfernt.

## 3. Geprüfte Dateien

| Datei | Theoreme | Definitionen | Strukturen | SHA-256 |
|---|---:|---:|---:|---|
| `formal/SubQGDerivation.lean` | 34 | 29 | 3 | `690D5C19EC443047724E8283FBAFFDF94914114D90AB751182E685CC07A04377` |
| `docs/SubQG_Formal_Verification_2026-11-11.lean` | 23 | 0 | 0 | `AFAC549278B84251DDDDD7D912E3B2E5C675BAE8C15ED0924B47D771B2FEF3D8` |
| **Gesamt** | **57** | **29** | **3** | — |

Beide Dateien wurden vom Lean-Compiler mit Exitcode `0` abgeschlossen.

## 4. Ergebnisübersicht

| Prüfung | Ergebnis |
|---|---|
| Zentraler formaler SubQG-Kern | BESTANDEN |
| 20 nummerierte Formeln | BESTANDEN |
| 3 ergänzende Formeln | BESTANDEN |
| Suche nach `sorry` | 0 Treffer |
| Suche nach `admit` | 0 Treffer |
| Suche nach `sorryAx` | 0 Treffer |
| Compilerfehler | 0 |
| Abgebrochene Lean-Prüfungen | 0 |

## 5. Die 20 nummerierten Formeln

Alle folgenden Theoreme wurden in
`docs/SubQG_Formal_Verification_2026-11-11.lean` erfolgreich elaboriert.

| Nr. | Lean-Theorem | Formal geprüfter Gegenstand |
|---:|---|---|
| 1 | `formula01_mond_flux` | MOND-Flusszerlegung |
| 2 | `formula02_conductivity_substitution` | Leitfähigkeitssubstitution |
| 3 | `formula03_four_momentum_identity` | Viererimpuls-/Quadratidentität |
| 4 | `formula04_tully_fisher_power` | Tully-Fisher-Potenzrelation |
| 5 | `formula05_metric_contraction` | metrische Kontraktionsidentität |
| 6 | `formula06_lieb_robinson_product` | Lieb-Robinson-Produktrelation |
| 7 | `formula07_landau_identity` | Landau-Ordnungsparameter-Identität |
| 8 | `formula08_horizon_scale` | Horizont-/Beschleunigungsskala |
| 9 | `formula09_page_wootters` | Page-Wootters-Zeitidentität |
| 10 | `formula10_causal_cube` | kubische kausale Ausbreitungsrelation |
| 11 | `formula11_parallelogram` | Parallelogramm-/Spurenidentität |
| 12 | `formula12_newton_counterexample` | Gegenbeispiel zum rein newtonschen Ansatz |
| 13 | `formula13_linear_conductivity_counterexample` | Gegenbeispiel zur linearen Leitfähigkeit |
| 14 | `formula14_edge_screening` | Kanten-Screening-Identität |
| 15 | `formula15_ehrenfest_cancellation` | Ehrenfest-Kürzung im freien Fall |
| 16 | `formula16_weight_inertia` | Proportionalität von Gewicht und Trägheit |
| 17 | `formula17_refractive_invariance` | Brechungsindex-Invarianz |
| 18 | `formula18_orthogonal_decoupling` | orthogonale Multiversum-Entkopplung |
| 19 | `formula19_cross_force_counterexample` | Gegenbeispiel bei unentkoppelter Kreuzkraft |
| 20 | `formula20_transient_tunneling_invariance` | transiente Tunnelkopplungs-Invarianz |

Zusätzlich bestanden:

- `extra_binomial` – binomische Identität;
- `extra_graph_dispersion` – Graphdispersionsrelation;
- `extra_mond_crossover` – MOND-Crossover-Relation.

Die Gegenbeispiele 12, 13 und 19 sind bewusst Teil der formalen Suite. Ihr
Bestehen bedeutet, dass Lean die behauptete Existenz beziehungsweise die
angegebene Widerlegung formal bestätigt; es bedeutet nicht, dass der jeweils
widerlegte Ansatz gültig wäre.

## 6. Formaler SubQG-Kern

### 6.1 Variationelle Kantenwirkung

Formalisiert sind ein endlicher gewichteter Graph, die quadratische
Kantenwirkung, ihre erste Variation und der quadratische Restterm. Bewiesen
wurden insbesondere:

- `edgeAction_along_variation` – exakte Entwicklung von `S(x + t h)`;
- `stationary_action_expansion` – Wirkung um einen stationären Punkt;
- `quadraticRemainder_nonneg` – Nichtnegativität des Restterms unter den
  angegebenen Vorzeichenannahmen;
- `stationary_is_global_minimum` – globale Minimalität stationärer Lösungen;
- `stationary_energy_balance` – exakte stationäre Energiebilanz.

Die Minimalsätze setzen unter anderem nichtnegative Kopplungsgewichte sowie die
in der Datei angegebenen Bedingungen an Anker- und Glättungsparameter voraus.

### 6.2 Metrische Kraft und freier Fall

Die Formalisierung verbindet Kantenkonfiguration, Knotenpotential,
Objektnorm, metrische Kraft, Trägheitsmasse und diskrete Bewegung. Geprüft sind:

- `metricForce_constant_gradient`;
- `constant_metric_gradient_gives_universal_acceleration`;
- `universal_free_fall_eotvos_zero`;
- `holding_force_is_mass_proportional`;
- `motionStep_velocity` und `motionStep_position`;
- `universal_free_fall_step`.

Der exakte Eötvös-Wert null folgt modellintern unter der sichtbaren Annahme
eines gemeinsamen, konstanten und nichtverschwindenden metrischen Gradienten
über den betrachteten Paketträgern sowie nichtverschwindender Objektnormen.

### 6.3 Glatter Glitch und kompakter Träger

Für die zeitabhängige Glitch-Brücke wurden Glattheit, Träger und Mittelwert
formal geprüft:

- `bumpGlue_contDiff` und `smoothGlitchBump_contDiff` – beliebige
  Differenzierbarkeitsordnung einschließlich `C∞`;
- `bumpGlue_zero_of_not_mem` und `smoothGlitchBump_outside` – exaktes
  Verschwinden außerhalb des Fensters;
- `compactGlitchBump_outside` und `compactGlitchBump_at_center`;
- `overlapWeight_nonneg` und `overlapWeight_at_center`;
- `bridge_closed_outside` und `crossMetricSource_outside`.

### 6.4 Symmetrische Tunnelkopplung und Energiebilanz

Formal geprüft wurden:

- Symmetrie des reellen Überlapps;
- exakte Aufhebung der symmetrischen Kreuzterme in der momentanen
  Gesamtnormrate;
- Normratenerhaltung, sofern die ungekoppelten Sektoren ihre Norm erhalten;
- exakte Änderung der Blockkopplungsenergie;
- gemeinsame Energievariation einschließlich metrischer Rückkopplung.

Zentrale Theoreme sind
`symmetric_coupling_preserves_total_norm_rate`,
`total_norm_rate_zero_of_symmetric_coupling`,
`blockCouplingEnergy_parameter_change` und
`joint_energy_variation_with_metric_feedback`.

### 6.5 Verankerte metrische Hesse-Matrix

`anchored_metric_hessian_lower_bound` beweist die untere Schranke des
quadratischen metrischen Sektors. Aus einem strikt positiven Anker folgt mit
`positive_anchor_excludes_zero_metric_mode`, dass kein nichttrivialer Nullmodus
in diesem verankerten Sektor existiert.

### 6.6 Linearisiertes Spin-2- und Lensing-Segment

Die statische Staub-Closure wurde algebraisch formalisiert. Geprüft sind:

- Zeit- und Raumkomponenten nach Spurumkehr;
- No-Slip-Gleichheit der metrischen Potentiale;
- `gamma = 1` für `U ≠ 0`;
- volle Lensing-Stärke der Gamma-eins-Closure.

Zugehörige Sätze sind `static_dust_time_perturbation`,
`static_dust_spatial_perturbation`,
`linearized_spin_two_static_dust_no_slip`,
`linearized_spin_two_static_dust_gamma_one` und
`gamma_one_full_lensing_strength`.

## 7. Vertrauensbasis und Axiome

Die `#print axioms`-Ausgabe meldet für die zentralen Sätze ausschließlich:

- `propext` – propositionale Extensionalität;
- `Classical.choice` – klassische Auswahl;
- `Quot.sound` – Quotientengleichheit.

Dies sind übliche Bestandteile der Lean-/Mathlib-Vertrauensbasis. Es wurden
keine projektspezifischen physikalischen Resultate als zusätzliche Axiome
eingeschleust und keine unbewiesenen Platzhalter akzeptiert.

Die technische Vertrauenskette umfasst damit:

1. den Lean-4-Kernel;
2. die verwendete Mathlib-Version und deren kompilierte Abhängigkeiten;
3. die zwei im Repository versionierten Lean-Quelldateien;
4. die Korrektheit der ausdrücklich gesetzten Definitionen und Voraussetzungen.

## 8. Reproduzierbarkeit

### 8.1 Zentralen Kern prüfen

Im Projektverzeichnis:

```powershell
npm run verify:lean
```

Das Skript `formal/verify.ps1` setzt den Mathlib-Suchpfad, startet Lean und
bricht bei Compilerfehlern oder gemeldeten Beweisabkürzungen ab.

### 8.2 Formeldatei prüfen

Mit derselben `LEAN_PATH`-Umgebung:

```powershell
lean docs/SubQG_Formal_Verification_2026-11-11.lean
```

### 8.3 Beweisabkürzungen ausschließen

```powershell
rg -n -i '\b(sorry|admit|sorryAx)\b' `
  formal/SubQGDerivation.lean `
  docs/SubQG_Formal_Verification_2026-11-11.lean
```

Für den dokumentierten Lauf lieferte die Suche keine Treffer.

## 9. Aussagekraft und Grenzen

Der bestandene Lauf beweist:

- Die 57 Theoreme sind für Lean 4 typkorrekt und kernelgeprüft.
- Die angegebenen Schlussfolgerungen folgen aus den formalisierten Prämissen.
- Die Beweise enthalten keine zugelassenen Lückenmarker.
- Die 20 Formelprüfungen und drei Zusatzprüfungen sind vollständig
  kompilierbar.

Der Lauf beweist für sich allein nicht:

- dass jede Modellprämisse empirisch wahr ist;
- dass die gesamte JavaScript- oder C++-Implementierung semantisch äquivalent
  zu jeder Lean-Definition ist;
- dass numerische Rundungs-, Diskretisierungs- oder Integrationsfehler formal
  ausgeschlossen sind;
- dass offene Mikro-zu-Spin-2-Brücken ohne zusätzliche Voraussetzungen
  geschlossen sind;
- dass ein mathematisch konsistentes Modell bereits eine experimentell
  bestätigte neue fundamentale Naturtheorie darstellt.

Numerische Tests, empirische Gates und Lean-Beweise ergänzen einander, prüfen
aber unterschiedliche Ebenen.

## 10. Schlussfolgerung

Die vollständige im Repository vorhandene Lean-Suite ist für den angegebenen
Quellstand **bestanden**. Beide Lean-Dateien kompilieren ohne Fehler. Insgesamt
wurden 57 Theoreme geprüft, darunter alle 20 nummerierten SubQG-Formeln und drei
ergänzende Formeln. Es wurden keine Vorkommen von `sorry`, `admit` oder
`sorryAx` gefunden. Die ausgegebene Axiom-Basis beschränkt sich auf die
übliche Lean-/Mathlib-Vertrauensgrundlage.

