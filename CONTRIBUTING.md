# Mitwirken

Vielen Dank für das Interesse an Sub Quanten Gravitation.

## Entwicklungsablauf

1. Ein Issue mit Problem, Motivation und gewünschtem Verhalten eröffnen.
2. Einen fokussierten Branch erstellen.
3. Änderungen mit Tests und Dokumentation ergänzen.
4. Vor einem Pull Request mindestens `npm test` ausführen.
5. Für Änderungen an empirischen Aussagen zusätzlich die betroffenen
   `validation:*`-Skripte ausführen und Resultate vollständig berichten.

## Wissenschaftliche Beiträge

- Datenquellen müssen Primärquellen, Version und Prüfsumme nennen.
- Trainings-, Holdout- und Testdaten müssen klar getrennt bleiben.
- Negative Ergebnisse und Einschränkungen dürfen nicht entfernt werden.
- Vergleichsmodelle müssen dieselben Daten und Nuisanceparameter erhalten.
- Neue Modellparameter müssen vor der Testauswertung deklariert werden.

## Code-Stil

- JavaScript verwendet ECMAScript-Module.
- Die native API bleibt mit C++17 kompatibel.
- Öffentliche API-Änderungen benötigen Tests und einen Changelog-Eintrag.
- Große externe Rohdaten gehören nicht in Git; Abrufskripte und Hashes schon.

Mit einem Beitrag wird bestätigt, dass der eingereichte Code unter GPL-3.0
veröffentlicht werden darf.
