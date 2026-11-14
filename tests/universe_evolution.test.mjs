import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SubQGUniverseEvolution,
  evolveCanonicalSubQGUniverse
} from '../src/modules/subqg_universe_evolution.mjs';

test('universe begins with one relational event and no pre-existing spatial edges', () => {
  const universe = new SubQGUniverseEvolution({ stateCount: 96, seed: 17 });
  const snapshot = universe.snapshot({ includeGraph: true });

  assert.equal(snapshot.ageYears, 0);
  assert.equal(snapshot.relationalClock, 0);
  assert.equal(snapshot.actualizedSector.nodes, 1);
  assert.equal(snapshot.actualizedSector.edges, 0);
  assert.equal(snapshot.actualizedSector.simplices, 0);
  assert.equal(snapshot.stage, 'FIRST_RELATIONAL_EVENT');
  assert.equal(snapshot.graph.nodes[0].view.role, 'visual_embedding_only_not_physical_input');
  assert.equal(snapshot.externalAstrophysicalEvolutionFunctions, false);
});

test('causal actualization and relational clock are monotonic', () => {
  const universe = new SubQGUniverseEvolution({
    stateCount: 112,
    seed: 23,
    epochYears: 1_000_000,
    observationStride: 5
  });
  let previousNodes = universe.activeNodes.size;
  let previousEdges = universe.activeEdges.size;
  let previousClock = universe.relationalClock;

  for (let epoch = 0; epoch < 80; epoch++) {
    universe.stepEpoch();
    assert(universe.activeNodes.size >= previousNodes);
    assert(universe.activeEdges.size >= previousEdges);
    assert(universe.relationalClock >= previousClock);
    previousNodes = universe.activeNodes.size;
    previousEdges = universe.activeEdges.size;
    previousClock = universe.relationalClock;
  }
  assert(universe.activeNodes.size > 1);
  assert(universe.activeEdges.size > 0);
  assert(universe.relationalClock > 0);
});

test('same SubQG seed produces identical emergent universe history', () => {
  const options = {
    stateCount: 128,
    seed: 91,
    epochYears: 2_000_000,
    observationStride: 10
  };
  const first = new SubQGUniverseEvolution(options);
  const second = new SubQGUniverseEvolution(options);
  const firstSnapshot = first.evolveToAge(200_000_000);
  const secondSnapshot = second.evolveToAge(200_000_000);

  assert.deepEqual(firstSnapshot.history, secondSnapshot.history);
  assert.deepEqual(firstSnapshot.objects, secondSnapshot.objects);
  assert.deepEqual(firstSnapshot.structureComplexes, secondSnapshot.structureComplexes);
  assert.deepEqual(firstSnapshot.events, secondSnapshot.events);
});

test('unknown structures remain archived and can be analyzed without changing dynamics', () => {
  const universe = new SubQGUniverseEvolution({
    stateCount: 160,
    seed: 42,
    epochYears: 1_000_000,
    observationStride: 10
  });
  const snapshot = universe.evolveToAge(200_000_000);
  const unknown = snapshot.objects.find(object => object.interpretation === 'unknown');
  assert(unknown, 'At least one persistent structure must remain explicitly unknown');

  const beforePsi = [...universe.genesis.psi];
  const beforePi = [...universe.genesis.pi];
  const beforeClock = universe.relationalClock;
  const analysis = universe.analyzeEmergentStructure(unknown.id);

  assert.equal(analysis.kind, 'object');
  assert.equal(analysis.status, 'UNRESOLVED');
  assert(Array.isArray(analysis.candidates));
  assert.deepEqual([...universe.genesis.psi], beforePsi);
  assert.deepEqual([...universe.genesis.pi], beforePi);
  assert.equal(universe.relationalClock, beforeClock);
});

test('multi-scale complexes retain competing galaxy, nebula, and unknown interpretations', () => {
  const universe = new SubQGUniverseEvolution({
    stateCount: 160,
    seed: 42,
    epochYears: 1_000_000,
    observationStride: 10
  });
  const snapshot = universe.evolveToAge(250_000_000);
  assert(snapshot.structureComplexes.length > 0);

  const complex = snapshot.structureComplexes[0];
  const interpretations = complex.analysis.candidates.map(candidate => candidate.interpretation);
  assert(interpretations.includes('galaxy_candidate'));
  assert(interpretations.includes('nebula_candidate'));
  assert(Number.isFinite(complex.analysis.unknownConfidence));
  assert.equal(complex.formation.source, 'measured_from_subqg_phase_network');
  assert.equal(complex.formation.network.allMembersConnected, true);
  assert(complex.formation.network.memberPaths.every(path => path.nodes.length > 0));
  assert(Number.isFinite(complex.formation.galaxyScore));
});

test('planet candidates expose their actual SubQG host path and formation trigger', () => {
  const universe = new SubQGUniverseEvolution({
    stateCount: 160,
    seed: 42,
    epochYears: 1_000_000,
    observationStride: 20
  });
  const snapshot = universe.evolveToAge(2_000_000_000);
  const planet = snapshot.objects.find(object => object.interpretation === 'planet_candidate');
  assert(planet, 'A canonical planet candidate must be available');
  assert(planet.formation.orbitalTrigger);
  assert.equal(planet.formation.network.networkNodeActive, true);
  assert.equal(planet.formation.network.connectedToHost, true);
  assert.equal(planet.formation.network.hostHops, planet.hostDistance);
  assert.equal(planet.formation.network.hostPath[0], planet.peakNode);
  assert(planet.formation.network.hostPath.length > 1);
  assert(planet.formation.network.containingComplexIds.length > 0);
});

test('canonical SubQG universe reaches two billion calibrated years stably', () => {
  const snapshot = evolveCanonicalSubQGUniverse({
    targetAgeYears: 2_000_000_000,
    stateCount: 160,
    seed: 42,
    epochYears: 1_000_000,
    observationStride: 20
  });

  assert.equal(snapshot.ageYears, 2_000_000_000);
  assert.equal(snapshot.stage, 'EMERGENT_STRUCTURE_ERA');
  assert.equal(snapshot.actualizedSector.activeFraction, 1);
  assert(snapshot.actualizedSector.nodes > 100);
  assert(snapshot.actualizedSector.edges > 100);
  assert(snapshot.actualizedSector.simplices > 0);
  assert(snapshot.objects.length > 0);
  assert(snapshot.objects.some(object => object.interpretation === 'unknown'));
  assert(snapshot.objects.some(object => object.interpretation === 'star_candidate'));
  assert(snapshot.objects.some(object => object.interpretation === 'planet_candidate'));
  assert(snapshot.history.some(entry => entry.phaseReleaseEvents > 0));
  assert(Number.isFinite(snapshot.actualizedSector.excitationEnergy));
});

test('invalid universe evolution parameters are rejected', () => {
  assert.throws(() => new SubQGUniverseEvolution({ stateCount: 4 }), /stateCount/);
  assert.throws(() => new SubQGUniverseEvolution({ epochYears: 0 }), /epochYears/);
  assert.throws(() => new SubQGUniverseEvolution({ universeMode: 'NASA_LCDM' }), /universeMode/);

  const universe = new SubQGUniverseEvolution({ stateCount: 64, epochYears: 10 });
  assert.throws(() => universe.evolveToAge(15), /reachable/);
  assert.throws(() => universe.analyzeEmergentStructure('does-not-exist'), /Unknown emergent structure/);
});
