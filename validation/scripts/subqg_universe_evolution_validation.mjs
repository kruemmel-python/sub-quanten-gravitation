import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SubQGUniverseEvolution } from '../../src/modules/subqg_universe_evolution.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(here, '..', 'results', 'subqg_universe_2gyr_validation.json');
const options = {
  stateCount: 320,
  seed: 42,
  epochYears: 1_000_000,
  observationStride: 20,
  microStepsPerEpoch: 1
};

function monotonic(history, field) {
  return history.every((entry, index) => index === 0 || entry[field] >= history[index - 1][field]);
}

function canonicalRun() {
  const universe = new SubQGUniverseEvolution(options);
  const initial = universe.snapshot();
  const final = universe.evolveToAge(2_000_000_000);
  return { universe, initial, final };
}

const first = canonicalRun();
const second = canonicalRun();
const activeObjects = first.final.objects.filter(object => object.activeAtSnapshot);
const unknownObjects = first.final.objects.filter(object => object.interpretation === 'unknown');
const releaseCount = first.final.history.at(-1)?.phaseReleaseEvents ?? 0;

const gates = {
  U1_NO_PREEXISTING_SPACE: {
    passed: first.initial.actualizedSector.nodes === 1 &&
      first.initial.actualizedSector.edges === 0 &&
      first.initial.actualizedSector.simplices === 0 &&
      first.initial.relationalClock === 0,
    measured: first.initial.actualizedSector
  },
  U2_CAUSAL_ACTUALIZATION_MONOTONIC: {
    passed: monotonic(first.final.history, 'activeNodes') &&
      monotonic(first.final.history, 'activeEdges') &&
      monotonic(first.final.history, 'activeSimplices') &&
      monotonic(first.final.history, 'relationalClock'),
    finalClock: first.final.relationalClock
  },
  U3_TWO_BILLION_YEAR_CALIBRATION_REACHED: {
    passed: first.final.ageYears === 2_000_000_000,
    ageYears: first.final.ageYears,
    epochYears: first.final.timeCalibration.epochYears,
    interpretation: first.final.timeCalibration.note
  },
  U4_DETERMINISTIC_REPLAY: {
    passed: JSON.stringify(first.final.history) === JSON.stringify(second.final.history) &&
      JSON.stringify(first.final.objects) === JSON.stringify(second.final.objects) &&
      JSON.stringify(first.final.structureComplexes) === JSON.stringify(second.final.structureComplexes),
    seed: options.seed
  },
  U5_UNKNOWN_STRUCTURES_PRESERVED: {
    passed: unknownObjects.length > 0 &&
      unknownObjects.every(object => object.analysis && Number.isFinite(object.analysis.unknownConfidence)),
    unknownObjects: unknownObjects.length,
    activeObjects: activeObjects.length
  },
  U6_EMERGENT_SIGNATURES_OBSERVED: {
    passed: first.final.objects.some(object => object.interpretation === 'star_candidate') &&
      first.final.objects.some(object => object.interpretation === 'planet_candidate') &&
      releaseCount > 0,
    starCandidates: first.final.objects.filter(object => object.interpretation === 'star_candidate').length,
    planetCandidates: first.final.objects.filter(object => object.interpretation === 'planet_candidate').length,
    phaseReleaseEvents: releaseCount
  },
  U7_SUBQG_ONLY_DYNAMICS: {
    passed: first.final.externalAstrophysicalEvolutionFunctions === false,
    importedDynamics: ['SubQGGenesisEngine'],
    excludedDynamics: ['Lambda-CDM', 'N-body', 'NASA stellar tracks', 'external hydrodynamics']
  },
  U8_NUMERICAL_FINITE_STATE: {
    passed: Number.isFinite(first.final.actualizedSector.excitationEnergy) &&
      first.final.objects.every(object =>
        Number.isFinite(object.totalEnergy) &&
        Number.isFinite(object.compactness) &&
        Number.isFinite(object.meanCoherence)),
    finalExcitationEnergy: first.final.actualizedSector.excitationEnergy
  }
};

const allPassed = Object.values(gates).every(gate => gate.passed);
const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  model: 'SubQG-only relational universe evolution',
  verdict: allPassed ? 'PASS' : 'FAIL',
  allPassed,
  scope: {
    statement: 'Internal model-validation gates; not an empirical proof of cosmological history.',
    dynamics: 'Only the canonical SubQG phase-network and energy-metric feedback are evolved.',
    classification: 'Macroscopic labels are post-hoc hypotheses and do not feed back into dynamics.'
  },
  options,
  gates,
  finalSnapshot: first.final
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

console.log(`SubQG universe evolution validation: ${result.verdict}`);
for (const [name, gate] of Object.entries(gates)) {
  console.log(`${gate.passed ? 'PASS' : 'FAIL'} ${name}`);
}
console.log(`Result: ${outputPath}`);

if (!allPassed) process.exitCode = 1;
