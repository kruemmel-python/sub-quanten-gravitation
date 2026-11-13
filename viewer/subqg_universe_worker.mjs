import { SubQGUniverseEvolution } from '../src/modules/subqg_universe_evolution.mjs';

const MAX_AGE_YEARS = 2_000_000_000;
const DEFAULT_OPTIONS = Object.freeze({
  stateCount: 320,
  seed: 42,
  epochYears: 1_000_000,
  observationStride: 20,
  microStepsPerEpoch: 1
});

let universe = null;
let options = { ...DEFAULT_OPTIONS };

function createUniverse(overrides = {}) {
  options = { ...DEFAULT_OPTIONS, ...overrides };
  universe = new SubQGUniverseEvolution(options);
}

function snapshot() {
  return universe.snapshot({ includeGraph: true, recentEventLimit: 100 });
}

function sendSnapshot(requestId, reason = 'update') {
  self.postMessage({ type: 'snapshot', requestId, reason, snapshot: snapshot() });
}

function evolveEpochs(count, requestId) {
  const remaining = Math.max(0, Math.floor((MAX_AGE_YEARS - universe.ageYears) / universe.epochYears));
  const steps = Math.min(Math.max(0, Math.trunc(count)), remaining);
  for (let index = 0; index < steps; index++) universe.stepEpoch();
  sendSnapshot(requestId, 'advance');
}

function seekAge(targetAgeYears, requestId) {
  const clamped = Math.max(0, Math.min(MAX_AGE_YEARS, Number(targetAgeYears) || 0));
  const targetEpoch = Math.round(clamped / options.epochYears);
  const currentEpoch = universe.epoch;
  if (targetEpoch < currentEpoch) createUniverse(options);

  const steps = targetEpoch - universe.epoch;
  for (let index = 0; index < steps; index++) {
    universe.stepEpoch();
    if ((index + 1) % 100 === 0) {
      self.postMessage({
        type: 'progress',
        requestId,
        completed: index + 1,
        total: steps,
        ageYears: universe.ageYears
      });
    }
  }
  sendSnapshot(requestId, 'seek');
}

self.addEventListener('message', event => {
  const message = event.data ?? {};
  const requestId = message.requestId ?? 0;
  try {
    if (message.type === 'init') {
      createUniverse(message.options);
      sendSnapshot(requestId, 'init');
      return;
    }
    if (!universe) createUniverse();
    if (message.type === 'advance') {
      evolveEpochs(message.epochs ?? 1, requestId);
      return;
    }
    if (message.type === 'seek') {
      seekAge(message.targetAgeYears, requestId);
      return;
    }
    if (message.type === 'reset') {
      createUniverse(message.options ?? options);
      sendSnapshot(requestId, 'reset');
      return;
    }
    if (message.type === 'snapshot') sendSnapshot(requestId, 'snapshot');
  } catch (error) {
    self.postMessage({
      type: 'error',
      requestId,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});
