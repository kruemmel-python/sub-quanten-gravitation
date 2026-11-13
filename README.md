# Sub Quanten Gravitation

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![C++17](https://img.shields.io/badge/C%2B%2B-17-00599C.svg)](cpp/)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933.svg)](package.json)
[![Validation](https://img.shields.io/badge/empirical%20gates-G2--G7%20passed-success.svg)](validation/EVIDENCE_GATES.md)

**Sub Quanten Gravitation** ist eine quelloffene C++17-Bibliothek und ein
reproduzierbares Forschungsprojekt für relationale Raumzeit, emergente
Gravitation und Game-Physik. Das Repository bündelt die native Physik-DLL mit
dem vollständigen kanonischen SubQG-FPV6-Forschungskern.

## Kernfunktionen

- native 2D-Rigid-Body-Physik für Windows x64;
- statische, dynamische und kinematische Körper;
- Kreis-, Rechteck-, Polygon-, Kapsel- und Segmentformen;
- Kollisionen, Reibung, Rückprall, Sensoren und Raycasts;
- Gelenke, Motoren, Schlafmodus und Zerstörung;
- Hybrid- und Pure-SubQG-Simulationsmodus;
- relationale Graphgeometrie, Kausalordnung und emergente Raumzeit;
- SubQG-Gravitations-, Kosmologie- und Validierungsmodule;
- C++-Zugriff auf den vollständigen kanonischen Runtime-Kern über
  `CanonicalRuntime`.

Die ausführliche API- und Funktionsdokumentation befindet sich in
[DOKU.md](DOKU.md).

## Empirische Validierung

Das Projekt enthält reproduzierbare Prüfungen für Galaxien, starke Linsen,
lokale Gravitation, Planetephemeriden, den Doppelpulsar,
Gravitationswellen sowie BBN-, DESI-, Planck-, Struktur- und Haufendaten.

Der maschinenlesbare Gesamtprüfer meldet alle für das private Projektziel
definierten Gates G2 bis G7 als bestanden. Die externe Replikation durch eine
unabhängige Forschungsgruppe (G8) ist nicht Bestandteil dieses privaten
Abschlusskriteriums. Das ist keine Behauptung logischer Einzigartigkeit oder
eines wissenschaftlichen Konsenses.

```powershell
npm run validation:empirical-gates
```

Zentrale Resultate:

| Prüfung | Ergebnis |
|---|---:|
| Hierarchischer SPARC-Holdout | `chi2_red = 0.9689`, `p = 0.722` |
| Newton im gleichen SPARC-Protokoll | `p = 1.17e-27` |
| Planck TT/TE/EE, 613 Bandpowers | `p = 0.149` |
| BBN + DESI + Planck gemeinsam | `p = 0.157` |
| SPT-Haufenamplitude | Abweichung `0.045 Sigma` |
| Automatisierte Kernprüfungen | `353/353` bestanden |

Details und Grenzen stehen in
[validation/EVIDENCE_GATES.md](validation/EVIDENCE_GATES.md) und
[validation/COSMOLOGY_VALIDATION.md](validation/COSMOLOGY_VALIDATION.md).

## Installation aus dem Release

1. Das aktuelle Windows-x64-Archiv aus den GitHub Releases herunterladen.
2. Das Archiv in ein beliebiges Verzeichnis auf einem Laufwerk mit genügend
   Speicher entpacken.
3. Header aus `include/` einbinden.
4. Gegen `lib/libsubqg_physics.dll.a` linken.
5. `bin/subqg_physics.dll` neben die Anwendung legen.
6. Für `CanonicalRuntime` die mitgelieferten Verzeichnisse `share/subqg` und
   `runtime/node` unverändert beibehalten.

## Reproduzierbarer Build

Verifizierte Windows-Toolchain:

```powershell
.\build-cpp.ps1 -Configuration Release -Clean `
  -Toolchain "H:\KR-Compiler\KR-Compiler-Windows-x64-v4.3.1\toolchain"
```

Das portable Paket wird unter
`dist/Sub-Quanten-Gravitation-Windows-x64-v1.0.0.zip` erzeugt.

## Minimalbeispiel

```cpp
#include <subqg/physics.hpp>

int main() {
    subqg::World world({0.0, -9.81}, subqg::PhysicsMode::PureSubQG);
    world.createBox(0.0, 0.0, 20.0, 1.0, subqg::BodyType::Static);
    auto& body = world.createBox(0.0, 5.0, 1.0, 1.0);

    for (int frame = 0; frame < 600; ++frame) {
        world.step(1.0 / 60.0);
    }

    return body.position().y < 5.0 ? 0 : 1;
}
```

## Projektstruktur

- `cpp/` – C++-Bibliothek, öffentliche Header, Beispiele und native Tests;
- `src/` – kanonische SubQG-Forschungsmodule;
- `tests/` – automatisierte mathematische und numerische Tests;
- `validation/` – externe Datenquellen, reproduzierbare Skripte und Resultate;
- `formal/` – formale Nachweise;
- `docs/`, `viewer/`, `media/` – ergänzende Dokumentation und Visualisierung;
- `game_physic_engine/` – kanonische JavaScript-Referenzimplementierung.

Der vollständige Lauf mit 57 Lean-Theoremen, allen 20 nummerierten Formeln,
Toolchain-Angaben, Axiom-Basis und Reproduktionsanleitung ist im
[`Lean-Verifikationsbericht`](docs/LEAN_VERIFIKATIONSBERICHT.md) dokumentiert.

## Wissenschaftliche und technische Grenzen

- Die native Game-Physik ist zweidimensional.
- Das veröffentlichte Binärpaket ist für Windows x64 gebaut.
- Die öffentliche native Schnittstelle ist C++17, keine reine C-API.
- Primordiale Größen wie `A_s` und `n_s` werden transparent als
  CMB-kalibrierte Anfangsbedingungen behandelt.
- Unabhängige Replikation und Peer Review bleiben für einen öffentlichen
  wissenschaftlichen Konsens erforderlich.

## Mitwirken und Zitieren

Beiträge sind willkommen. Bitte zuerst
[CONTRIBUTING.md](CONTRIBUTING.md) und [SECURITY.md](SECURITY.md) lesen.
Zitierinformationen stehen in [CITATION.cff](CITATION.cff).

## Lizenz

Der Projektcode steht unter der
[GNU General Public License v3.0](LICENSE). Drittanbieterkomponenten behalten
ihre jeweiligen Hinweise unter `THIRD_PARTY_LICENSES/`.
