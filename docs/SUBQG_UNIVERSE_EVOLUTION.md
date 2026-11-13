# SubQG-Universumsentwicklung

## Ziel

`SubQGUniverseEvolution` entwickelt aus einem prä-geometrischen
SubQG-Möglichkeitssektor eine aktualisierte kausale Raumzeit und lässt darin
Strukturen ausschließlich aus der vorhandenen Phasennetzwerk-Dynamik entstehen.

Die Erweiterung ersetzt oder verändert `SubQGGenesisEngine` nicht. Sie verwendet
deren unveränderte Freiheitsgrade:

- mehrphasige SubQG-Zustände und Überlappungen;
- perkolierendes relationales Netzwerk;
- nichtlineares Anregungsfeld `psi` und konjugierten Impuls `pi`;
- lokale Energie und metrische Rückkopplung;
- endliche Ausbreitung entlang bestehender relationaler Nachbarschaften.

Nicht verwendet werden ΛCDM-Teilchen, N-Body-Modelle, NASA-Sternspuren,
vorgefertigte Planetenbahnen oder externe hydrodynamische Entwicklungsgesetze.

## Entstehung der Raumzeit

Beim Start existiert im aktualisierten Sektor genau ein erstes relationales
Ereignis. Es gibt dort noch keine räumliche Kante, kein Simplex und keine
relationale Uhr. Der vollständige Genesis-Graph ist zu diesem Zeitpunkt nur ein
latenter Möglichkeitssektor.

Eine Kante wird erst aktualisiert, wenn die SubQG-Anregung einen benachbarten
Zustand kausal erreicht. Drei paarweise verbundene Zustände bilden ein
relationales Simplex-Ereignis. Neue Kanten und Simplexe erhöhen die relationale
Uhr. Bereits aktualisierte Knoten, Kanten und Simplexe werden nicht nachträglich
entfernt.

Damit werden räumliches Volumen und Zeit nicht als externe Bühne eingesetzt,
sondern aus der fortschreitenden Aktualisierung des Netzwerks abgeleitet.

## Zwei Milliarden Jahre

Die Methode

```js
universe.evolveToAge(2_000_000_000)
```

führt 2.000 SubQG-Epochen bei der Standardkalibrierung von einer Million Jahren
pro Epoche aus.

Diese Jahre sind ausdrücklich eine **Anzeige- und Vergleichskalibrierung** der
internen relationalen Epochen. Die Dynamik selbst verwendet weder Jahre noch
eine externe kosmologische Expansionsfunktion. Ohne eine zusätzliche
experimentelle Herleitung der Umrechnung darf die Kalibrierung nicht mit einem
bewiesenen absoluten kosmischen Alter verwechselt werden.

## Emergent entstehende Strukturen

Nach jedem Beobachtungsintervall werden ausschließlich relationale Invarianten
ausgewertet:

- lokale Anregungsenergie;
- Phasenkohärenz;
- metrische Kontraktion;
- Phasenstrom;
- nach außen gerichteter Energiefluss;
- Persistenz über mehrere Beobachtungen;
- gebundene relationale Distanz zu anderen Strukturen.

Lokale Maxima der Kompaktheit definieren Anziehungsbecken. Diese Becken werden
nicht im Voraus als Materieobjekte angelegt. Sie sind Resultate der entwickelten
SubQG-Felder.

## Unbekannt bleibt eine gültige Klasse

Jede neue Struktur beginnt als
`UNCLASSIFIED_TRANSIENT_STRUCTURE`. Bleibt sie erhalten, wird sie zunächst
`UNCLASSIFIED_PERSISTENT_STRUCTURE`. Unbekannte Strukturen werden vollständig
archiviert und nicht verworfen.

`analyzeEmergentStructure(id)` erzeugt später aus den gespeicherten Messwerten
mehrere konkurrierende Hypothesen. Der Aufruf verändert weder `psi`, `pi`, die
Metrik noch die relationale Uhr.

Mögliche heutige Deutungen sind:

- `star_candidate` für einen persistenten kohärenten Strahlungskern;
- `planet_candidate` für einen energieärmeren, dauerhaft relational gebundenen
  Körper mit Phasenstrom;
- `nebula_candidate` für ausgedehnte, weniger kohärente Strukturen;
- `galaxy_candidate` für einen persistenten hierarchischen Komplex aus mehreren
  Strahlungs- und Orbitstrukturen;
- `unknown`, wenn keine Hypothese deutlich genug gewinnt.

Die Konfidenzen sind modellinterne Signaturwerte und keine astronomischen
Messwahrscheinlichkeiten.

## Explosive Übergänge

Eine `SUPERNOVA_SIGNATURE` wird nicht über eine importierte
Sternmassen-/Lebensdauerformel ausgelöst. Sie wird registriert, wenn ein zuvor
strahlender, kompakter SubQG-Kern einen hinreichend großen Anteil seiner
gespeicherten Anregungsenergie verliert und gleichzeitig ein starker nach außen
gerichteter Energiefluss gemessen wird.

Die korrekte wissenschaftliche Bezeichnung lautet deshalb zunächst
„Supernova-Kandidat aus einer SubQG-Phasenfreisetzung“.

## API

```js
import {
  SubQGUniverseEvolution,
  evolveCanonicalSubQGUniverse
} from './src/index.mjs';

const universe = new SubQGUniverseEvolution({
  stateCount: 320,
  seed: 42,
  epochYears: 1_000_000,
  observationStride: 20
});

const result = universe.evolveToAge(2_000_000_000);
const objects = universe.objectCatalog();
const complexes = universe.structureCatalog();
const analysis = universe.analyzeEmergentStructure(objects[0].id);
```

Die Komfortfunktion führt denselben kanonischen Lauf aus:

```js
const result = evolveCanonicalSubQGUniverse({
  targetAgeYears: 2_000_000_000
});
```

## Reproduzierbare Validierung

```powershell
npm run validation:universe-2gyr
node --test tests/universe_evolution.test.mjs
```

Das Validierungsergebnis wird nach
`validation/results/subqg_universe_2gyr_validation.json` geschrieben. Die Gates
prüfen den raumlosen Anfangszustand, monotone Kausalaktualisierung,
deterministische Wiederholung, den Zwei-Milliarden-Jahre-Lauf, den Erhalt
unbekannter Strukturen, emergente Signaturen und numerisch endliche Zustände.

## Interaktiver Webviewer

Der `SubQG Universe Explorer` führt dieselbe Engine direkt im Browser in einem
separaten Module-Worker aus. Dadurch bleiben Navigation und Darstellung auch
während längerer Entwicklungsschritte bedienbar.

Öffentliche Webversion:
[SubQG Universe Explorer](https://kruemmel-python.github.io/sub-quanten-gravitation/)

```powershell
npm run viewer:universe
```

Aufruf:
`http://127.0.0.1:4173/viewer/subqg_universe_explorer.html`

Bedienung:

- `W`, `A`, `S`, `D` für Vorwärts-, Rückwärts- und Seitenflug;
- `Q` und `E` für Ab- und Aufstieg, Umschalt für den Boost;
- Mausbewegung nach Aktivierung der Flugsteuerung für die Blickrichtung;
- Linksklick auf einen Markierungsring im normalen Modus oder Linksklick auf
  das Ziel unter dem Fadenkreuz im Flugmodus zur Zielerfassung;
- Zeitleiste, Wiedergabe und Simulationsgeschwindigkeit für 0 bis zwei
  Milliarden Anzeigejahre;
- Anklicken oder Katalogauswahl für Rohmesswerte und konkurrierende
  Signaturhypothesen;
- „Ziel anfliegen“ für einen sanften visuellen Autopiloten.

### Mathematische Bindung der filmischen Ansicht

Die KOSMOS-Ansicht ist keine unabhängige Animation. Sie setzt ausschließlich
bereits berechnete SubQG-Größen deterministisch in Darstellungseigenschaften
um:

| SubQG-Messwert | Darstellung |
|---|---|
| Gesamtenergie und Mitgliederzahl | sichtbare Ausdehnung und Partikeldichte |
| Kohärenz und Kontraktion | Scheibendicke, Bündelung und Spiralordnung |
| Nebel-Hypothese, Knotenzahl und auswärts gerichteter Fluss | Stärke und Ausdehnung diffuser Felder |
| Galaxien-Hypothese | Stärke geordneter Spiralanteile |
| persistenter strahlender Kern | Leuchtkern und Korona |
| Phasenfreisetzungsereignis | expandierender Signaturring |

Jedes unbekannte Einzelobjekt wird außerdem mit seinen tatsächlich zum
SubQG-Becken gehörenden Knoten und deren Ansichtskoordinaten als eigener
relationaler Fingerabdruck gezeichnet. Es gibt daher kein wiederverwendetes
„Unbekannt“-Modell. Die sichtbare Individualität stammt aus dem jeweiligen
Zustand; lediglich Farbe, Leuchteffekt und Linienbreite sind rückwirkungsfreie
visuelle Kodierungen der zugehörigen Messwerte.

Farbe und Animationsphase sind visuelle Kodierungen, keine zusätzlich
behaupteten Observablen. Der Schalter `NETZ` blendet die zugrunde liegenden
relationalen Verbindungen ein; `KOSMOS` schaltet die Morphologie aus und ein.

Unbekannte Strukturen werden fortlaufend analysiert. Einzelobjekte erhalten
Rangwerte für Kern-, Orbital- und Nebelhypothesen; gebundene Komplexe werden
als Galaxien- und Nebelhypothese verglichen. Der Viewer zeigt die Rangfolge und
Konfidenz. Die Bezeichnung `SUBQG-AUFGELÖST` erscheint nur, wenn die in der
Engine definierte absolute Schwelle und der Abstand zur zweitbesten Hypothese
erfüllt sind. Andernfalls bleibt das Objekt trotz sichtbarer morphologischer
Hinweise ausdrücklich `UNAUFGELÖST`.

Die Engine liefert ausschließlich relationale Knoten, Kanten, Simplizes,
Messwerte und die mit `visual_embedding_only_not_physical_input` markierten
Ansichtskoordinaten. Der Viewer ergänzt keine Kräfte, Objektbahnen oder
astronomischen Entwicklungsgesetze. Seine räumliche Tiefendarstellung ist eine
Navigation durch diese visuelle Einbettung und kein zusätzlicher Bestandteil
der SubQG-Wirkung.

## Wissenschaftliche Grenze

Die Simulation zeigt, welche hierarchischen Strukturen aus der implementierten
SubQG-Wirkung und ihren Parametern entstehen. Eine Ähnlichkeit mit Sternen,
Planeten, Nebeln oder Galaxien ist zunächst eine zu prüfende Interpretation.
Eine belastbare Identifikation erfordert zusätzliche, unabhängig testbare
Vorhersagen für Spektren, Dynamik, Lensing und andere Observablen.
