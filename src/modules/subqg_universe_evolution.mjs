import { SubQGGenesisEngine } from './subqg_genesis.mjs';

const TWO_PI = 2.0 * Math.PI;

function assertFinite(name, value, { min = -Infinity, max = Infinity } = {}) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be finite and in [${min}, ${max}]`);
  }
}

function assertInteger(name, value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer in [${min}, ${max}]`);
  }
}

function quantile(values, fraction) {
  if (values.length === 0) return 0.0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = Math.max(0, Math.min(sorted.length - 1, fraction * (sorted.length - 1)));
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const blend = position - lower;
  return sorted[lower] * (1.0 - blend) + sorted[upper] * blend;
}

function mean(values) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0.0) / values.length : 0.0;
}

function clamp(value, lower, upper) {
  return Math.max(lower, Math.min(upper, value));
}

function edgeKey(a, b) {
  return `${Math.min(a, b)}_${Math.max(a, b)}`;
}

/**
 * Additive long-duration universe evolution layer for the canonical SubQG Genesis engine.
 *
 * It deliberately does not contain a stellar-evolution, N-body, hydrodynamic, Lambda-CDM,
 * or externally calibrated cosmology model. The only dynamical degrees of freedom are the
 * SubQG phase excitation, its conjugate momentum, the relational graph, and metric feedback.
 * Macroscopic names are assigned after the evolution by invariant signature detectors.
 */
export class SubQGUniverseEvolution {
  constructor({
    stateCount = 320,
    seed = 42,
    epochYears = 1_000_000,
    microStepsPerEpoch = 1,
    observationStride = 10,
    damping = 0.00002,
    activationAmplitude = 1e-8,
    universeMode = 'CONTINUUM_3D',
    genesisOptions = {}
  } = {}) {
    assertInteger('stateCount', stateCount, { min: 32, max: 2000 });
    assertInteger('seed', seed, { min: 0, max: 0xffffffff });
    assertFinite('epochYears', epochYears, { min: 1.0 });
    assertInteger('microStepsPerEpoch', microStepsPerEpoch, { min: 1, max: 1000 });
    assertInteger('observationStride', observationStride, { min: 1, max: 100000 });
    assertFinite('damping', damping, { min: 0.0, max: 1.0 });
    assertFinite('activationAmplitude', activationAmplitude, { min: 0.0, max: 1.0 });
    if (universeMode !== 'CONTINUUM_3D' && universeMode !== 'CRITICAL_FRACTAL') {
      throw new RangeError('universeMode must be CONTINUUM_3D or CRITICAL_FRACTAL');
    }

    this.seed = seed;
    this.epochYears = epochYears;
    this.microStepsPerEpoch = microStepsPerEpoch;
    this.observationStride = observationStride;
    this.damping = damping;
    this.activationAmplitude = activationAmplitude;
    this.universeMode = universeMode;

    this.genesis = new SubQGGenesisEngine({
      stateCount,
      seed,
      universeMode,
      ...genesisOptions
    });

    if (this.genesis.giantComponent.length === 0) {
      throw new Error('SubQG did not nucleate a connected latent sector');
    }

    this.ageYears = 0.0;
    this.epoch = 0;
    this.microTick = 0;
    this.relationalClock = 0;
    this.causalEvents = 0;
    this.activeNodes = new Set();
    this.activeEdges = new Map();
    this.activeTriangles = new Map();
    this.nodeBirthTick = new Int32Array(this.genesis.N).fill(-1);
    this.objectTracks = new Map();
    this.complexTracks = new Map();
    this.objectSerial = 0;
    this.complexSerial = 0;
    this.events = [];
    this.history = [];
    this._lastObservation = null;

    this._initializePreGeometricFluctuation();
    this._recordEvent('FIRST_RELATIONAL_EVENT', {
      node: this.seedNode,
      description: 'A local SubQG phase fluctuation becomes the first actualized relational event.'
    });
    this._recordHistory();
  }

  _initializePreGeometricFluctuation() {
    const candidates = this.genesis.giantComponent;
    let bestNode = candidates[0];
    let bestScore = -Infinity;
    for (const node of candidates) {
      const state = this.genesis.possibilities[node];
      const phaseClosure = state.phases.reduce((sum, phase) => sum + Math.cos(phase), 0.0);
      const score = state.amplitude * (1.0 + this.genesis.adj[node].length) * (4.0 + phaseClosure);
      if (score > bestScore) {
        bestScore = score;
        bestNode = node;
      }
    }

    this.seedNode = bestNode;
    this.genesis.psi.fill(0.0);
    this.genesis.pi.fill(0.0);
    for (const key of this.genesis.logMetric.keys()) this.genesis.logMetric.set(key, 0.0);

    const seedState = this.genesis.possibilities[bestNode];
    const phaseDrive = seedState.phases.reduce((sum, phase, index) =>
      sum + Math.cos((index + 1) * phase), 0.0) / seedState.phases.length;
    this.genesis.psi[bestNode] = 1.05 + 0.15 * phaseDrive;
    this.genesis.pi[bestNode] = 0.12 * Math.sin(seedState.phases[0] - seedState.phases[1]);
    this._activateNode(bestNode);
  }

  _activateNode(node) {
    if (this.activeNodes.has(node)) return false;
    this.activeNodes.add(node);
    this.nodeBirthTick[node] = this.microTick;
    this.causalEvents++;

    const state = this.genesis.possibilities[node];
    if (node !== this.seedNode && Math.abs(this.genesis.psi[node]) + Math.abs(this.genesis.pi[node]) < 1e-14) {
      const phaseSeed = state.phases.reduce((sum, phase, index) =>
        sum + Math.sin((index + 1) * phase + 0.013 * this.seed), 0.0) / state.phases.length;
      this.genesis.psi[node] = 1e-5 * phaseSeed;
      this.genesis.pi[node] = 1e-5 * Math.cos(state.phases[0] - state.phases[2]);
    }
    return true;
  }

  _actualizeCausalFront() {
    const newlyActive = [];
    for (const node of this.genesis.giantComponent) {
      if (this.activeNodes.has(node)) continue;
      const touchesActualizedSector = this.genesis.adj[node].some(neighbor => this.activeNodes.has(neighbor));
      if (!touchesActualizedSector) continue;
      const amplitude = Math.hypot(this.genesis.psi[node], this.genesis.pi[node]);
      if (amplitude >= this.activationAmplitude) newlyActive.push(node);
    }

    for (const node of newlyActive) this._activateNode(node);

    let newEdges = 0;
    for (const node of this.activeNodes) {
      for (const neighbor of this.genesis.adj[node]) {
        if (node >= neighbor || !this.activeNodes.has(neighbor)) continue;
        const key = edgeKey(node, neighbor);
        if (!this.activeEdges.has(key)) {
          this.activeEdges.set(key, { a: node, b: neighbor, bornTick: this.microTick });
          newEdges++;
        }
      }
    }

    let newTriangles = 0;
    for (const node of newlyActive) {
      const neighbors = this.genesis.adj[node]
        .filter(neighbor => this.activeNodes.has(neighbor));
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          const a = neighbors[i];
          const b = neighbors[j];
          if (!this.genesis.adj[a].includes(b)) continue;
          const nodes = [a, b, node].sort((x, y) => x - y);
          const key = nodes.join('_');
          if (!this.activeTriangles.has(key)) {
            this.activeTriangles.set(key, { nodes, bornTick: this.microTick });
            newTriangles++;
          }
        }
      }
    }

    if (newEdges > 0 || newTriangles > 0) {
      this.relationalClock += newEdges + newTriangles;
      this.causalEvents += newEdges + newTriangles;
    }

    if (newlyActive.length > 0) {
      this._recordEvent('CAUSAL_FRONT_ADVANCE', {
        nodesActualized: newlyActive.length,
        edgesActualized: newEdges,
        simplicesActualized: newTriangles
      });
    }
  }

  _recordEvent(type, payload = {}) {
    this.events.push({
      id: `event-${this.events.length + 1}`,
      type,
      ageYears: this.ageYears,
      epoch: this.epoch,
      relationalClock: this.relationalClock,
      ...payload
    });
  }

  _nodeObservables() {
    const observables = new Map();
    for (const node of this.activeNodes) {
      const neighbors = this.genesis.adj[node].filter(neighbor => this.activeNodes.has(neighbor));
      const ownPhase = Math.atan2(this.genesis.pi[node], this.genesis.psi[node]);
      let gradientEnergy = 0.0;
      let contraction = 0.0;
      let coherence = 0.0;
      let phaseCurrent = 0.0;
      let flux = 0.0;

      for (const neighbor of neighbors) {
        const key = edgeKey(node, neighbor);
        const weight = this.genesis.bondWeights.get(key) ?? 1.0;
        const length = this.genesis.getEdgeLength(node, neighbor);
        const delta = this.genesis.psi[neighbor] - this.genesis.psi[node];
        gradientEnergy += 0.25 * (weight / (length * length)) * delta * delta;
        contraction += Math.max(0.0, 1.0 - length);
        const neighborPhase = Math.atan2(this.genesis.pi[neighbor], this.genesis.psi[neighbor]);
        coherence += 0.5 * (1.0 + Math.cos(ownPhase - neighborPhase));
        phaseCurrent += this.genesis.psi[node] * this.genesis.pi[neighbor] -
          this.genesis.pi[node] * this.genesis.psi[neighbor];
        flux += Math.abs((weight / Math.max(length, 1e-12)) * delta *
          (this.genesis.pi[node] + this.genesis.pi[neighbor]) * 0.5);
      }

      const degree = Math.max(1, neighbors.length);
      const kinetic = 0.5 * this.genesis.pi[node] * this.genesis.pi[node];
      const potential = this.genesis._evalVNL(this.genesis.psi[node]).V;
      const energy = Math.max(0.0, kinetic + potential + gradientEnergy);
      const meanContraction = contraction / degree;
      const meanCoherence = neighbors.length > 0 ? coherence / neighbors.length : 1.0;
      const currentDensity = Math.abs(phaseCurrent) / degree;
      const outwardFlux = flux / degree;
      const compactness = energy * (1.0 + 4.0 * meanContraction) *
        (0.25 + 0.75 * meanCoherence);

      observables.set(node, {
        node,
        energy,
        kinetic,
        potential,
        gradientEnergy,
        contraction: meanContraction,
        coherence: meanCoherence,
        phaseCurrent: currentDensity,
        outwardFlux,
        compactness
      });
    }
    return observables;
  }

  _gradientBasins(observables) {
    if (observables.size === 0) return [];
    const compactnessValues = [...observables.values()].map(item => item.compactness);
    const minimumPeak = quantile(compactnessValues, 0.62);
    const rootCache = new Map();

    const findRoot = start => {
      if (rootCache.has(start)) return rootCache.get(start);
      const path = [];
      const seen = new Set();
      let current = start;
      while (!seen.has(current)) {
        seen.add(current);
        path.push(current);
        const currentValue = observables.get(current)?.compactness ?? -Infinity;
        let next = current;
        let nextValue = currentValue;
        for (const neighbor of this.genesis.adj[current]) {
          const neighborValue = observables.get(neighbor)?.compactness;
          if (neighborValue === undefined) continue;
          if (neighborValue > nextValue + 1e-15 ||
              (Math.abs(neighborValue - nextValue) <= 1e-15 && neighbor < next)) {
            next = neighbor;
            nextValue = neighborValue;
          }
        }
        if (next === current) break;
        current = next;
      }
      for (const node of path) rootCache.set(node, current);
      return current;
    };

    const byRoot = new Map();
    for (const node of observables.keys()) {
      const root = findRoot(node);
      if (!byRoot.has(root)) byRoot.set(root, []);
      byRoot.get(root).push(node);
    }

    const basins = [];
    for (const [peakNode, nodes] of byRoot) {
      const peak = observables.get(peakNode);
      if (!peak || peak.compactness < minimumPeak) continue;
      const values = nodes.map(node => observables.get(node));
      const totalEnergy = values.reduce((sum, item) => sum + item.energy, 0.0);
      const totalCurrent = values.reduce((sum, item) => sum + item.phaseCurrent, 0.0);
      const totalFlux = values.reduce((sum, item) => sum + item.outwardFlux, 0.0);
      basins.push({
        peakNode,
        nodes: [...nodes].sort((a, b) => a - b),
        nodeCount: nodes.length,
        totalEnergy,
        peakEnergy: peak.energy,
        peakCompactness: peak.compactness,
        meanContraction: mean(values.map(item => item.contraction)),
        meanCoherence: mean(values.map(item => item.coherence)),
        phaseCurrent: totalCurrent / Math.max(1, nodes.length),
        outwardFlux: totalFlux / Math.max(1, nodes.length)
      });
    }
    return basins.sort((a, b) => b.totalEnergy - a.totalEnergy || a.peakNode - b.peakNode);
  }

  _hopDistance(source, target, limit = 64) {
    if (source === target) return 0;
    const distance = new Int32Array(this.genesis.N).fill(-1);
    distance[source] = 0;
    const queue = [source];
    for (let head = 0; head < queue.length; head++) {
      const node = queue[head];
      if (distance[node] >= limit) continue;
      for (const neighbor of this.genesis.adj[node]) {
        if (!this.activeNodes.has(neighbor) || distance[neighbor] >= 0) continue;
        distance[neighbor] = distance[node] + 1;
        if (neighbor === target) return distance[neighbor];
        queue.push(neighbor);
      }
    }
    return Infinity;
  }

  _shortestActivePath(source, target, limit = 64) {
    if (!this.activeNodes.has(source) || !this.activeNodes.has(target)) {
      return { connected: false, hops: null, nodes: [] };
    }
    if (source === target) return { connected: true, hops: 0, nodes: [source] };
    const distance = new Int32Array(this.genesis.N).fill(-1);
    const previous = new Int32Array(this.genesis.N).fill(-1);
    distance[source] = 0;
    const queue = [source];
    for (let head = 0; head < queue.length; head++) {
      const node = queue[head];
      if (distance[node] >= limit) continue;
      for (const neighbor of this.genesis.adj[node]) {
        if (!this.activeNodes.has(neighbor) || distance[neighbor] >= 0) continue;
        distance[neighbor] = distance[node] + 1;
        previous[neighbor] = node;
        if (neighbor === target) {
          const nodes = [target];
          for (let current = target; current !== source;) {
            current = previous[current];
            nodes.push(current);
          }
          nodes.reverse();
          return { connected: true, hops: distance[target], nodes };
        }
        queue.push(neighbor);
      }
    }
    return { connected: false, hops: null, nodes: [] };
  }

  _observeEmergentStructures() {
    const observables = this._nodeObservables();
    const basins = this._gradientBasins(observables);
    const basinEnergies = basins.map(basin => basin.totalEnergy);
    const currents = basins.map(basin => basin.phaseCurrent);
    const radiantThreshold = quantile(basinEnergies, 0.82);
    const currentThreshold = quantile(currents, 0.45);
    const seen = new Set();

    for (const basin of basins) {
      const key = `peak-${basin.peakNode}`;
      let track = this.objectTracks.get(key);
      if (!track) {
        track = {
          id: `subqg-object-${++this.objectSerial}`,
          key,
          peakNode: basin.peakNode,
          bornAgeYears: this.ageYears,
          bornEpoch: this.epoch,
          lastSeenAgeYears: this.ageYears,
          persistence: 0,
          classification: 'UNCLASSIFIED_TRANSIENT_STRUCTURE',
          interpretation: 'unknown',
          energyHistory: [],
          distanceHistory: [],
          releaseEvents: 0
        };
        this.objectTracks.set(key, track);
        this._recordEvent('CONDENSATE_BIRTH', { objectId: track.id, peakNode: basin.peakNode });
      }

      seen.add(key);
      track.persistence++;
      track.lastSeenAgeYears = this.ageYears;
      track.nodes = basin.nodes;
      track.nodeCount = basin.nodeCount;
      track.totalEnergy = basin.totalEnergy;
      track.peakEnergy = basin.peakEnergy;
      track.compactness = basin.peakCompactness;
      track.meanContraction = basin.meanContraction;
      track.meanCoherence = basin.meanCoherence;
      track.phaseCurrent = basin.phaseCurrent;
      track.outwardFlux = basin.outwardFlux;
      track.energyHistory.push(basin.totalEnergy);
      if (track.energyHistory.length > 16) track.energyHistory.shift();

      const previousClassification = track.classification;
      if (track.persistence >= 3 && basin.totalEnergy >= radiantThreshold &&
          basin.meanCoherence >= 0.45 && basin.nodeCount >= 2) {
        track.classification = 'EMERGENT_RADIANT_CORE';
        track.interpretation = 'star_candidate';
      } else if (track.persistence >= 2 && track.classification !== 'EMERGENT_ORBITAL_BODY') {
        track.classification = 'UNCLASSIFIED_PERSISTENT_STRUCTURE';
        track.interpretation = 'unknown';
      }

      if (previousClassification !== 'EMERGENT_RADIANT_CORE' &&
          track.classification === 'EMERGENT_RADIANT_CORE') {
        track.radiantFormation = {
          energy: track.totalEnergy,
          radiantThreshold,
          coherence: track.meanCoherence,
          requiredCoherence: 0.45,
          nodeCount: track.nodeCount,
          requiredNodeCount: 2,
          persistence: track.persistence,
          requiredPersistence: 3
        };
        this._recordEvent('RADIANT_CORE_IGNITION', {
          objectId: track.id,
          peakNode: track.peakNode,
          energy: track.totalEnergy
        });
      }
    }

    const radiantCores = [...this.objectTracks.values()]
      .filter(track => seen.has(track.key) && track.classification === 'EMERGENT_RADIANT_CORE')
      .sort((a, b) => b.totalEnergy - a.totalEnergy);

    for (const track of this.objectTracks.values()) {
      if (!seen.has(track.key) || track.classification === 'EMERGENT_RADIANT_CORE' ||
          track.persistence < 4 || radiantCores.length === 0) continue;
      let host = null;
      let hostDistance = Infinity;
      for (const core of radiantCores) {
        const distance = this._hopDistance(track.peakNode, core.peakNode);
        if (distance < hostDistance) {
          hostDistance = distance;
          host = core;
        }
      }
      if (!host || !Number.isFinite(hostDistance)) continue;
      const energyRatio = track.totalEnergy / Math.max(host.totalEnergy, 1e-30);
      track.distanceHistory.push(hostDistance);
      if (track.distanceHistory.length > 12) track.distanceHistory.shift();
      const distanceSpread = track.distanceHistory.length > 1
        ? Math.max(...track.distanceHistory) - Math.min(...track.distanceHistory)
        : Infinity;
      if (hostDistance >= 1 && hostDistance <= 12 && energyRatio > 0.001 && energyRatio < 0.55 &&
          track.phaseCurrent >= 0.25 * currentThreshold && distanceSpread <= 2) {
        const wasOrbital = track.classification === 'EMERGENT_ORBITAL_BODY';
        track.classification = 'EMERGENT_ORBITAL_BODY';
        track.interpretation = 'planet_candidate';
        track.hostObjectId = host.id;
        track.hostDistance = hostDistance;
        track.orbitalFormation = {
          hostObjectId: host.id,
          hostDistance,
          energyRatio,
          minimumEnergyRatio: 0.001,
          maximumEnergyRatio: 0.55,
          phaseCurrent: track.phaseCurrent,
          currentThreshold: 0.25 * currentThreshold,
          distanceSpread,
          maximumDistanceSpread: 2,
          requiredPersistence: 4
        };
        if (!wasOrbital) {
          this._recordEvent('ORBITAL_BINDING_DETECTED', {
            objectId: track.id,
            hostObjectId: host.id,
            relationalDistance: hostDistance,
            energyRatio
          });
        }
      }
    }

    const fluxThreshold = quantile(basins.map(basin => basin.outwardFlux), 0.80);
    for (const track of this.objectTracks.values()) {
      if (!seen.has(track.key) || track.energyHistory.length < 4) continue;
      const priorPeak = Math.max(...track.energyHistory.slice(0, -1));
      const releaseFraction = priorPeak > 1e-20
        ? (priorPeak - track.totalEnergy) / priorPeak
        : 0.0;
      if ((track.classification === 'EMERGENT_RADIANT_CORE' || track.interpretation === 'star_candidate') &&
          releaseFraction >= 0.22 && track.outwardFlux >= fluxThreshold &&
          this.ageYears - (track.lastReleaseAgeYears ?? -Infinity) >= 5 * this.epochYears * this.observationStride) {
        track.releaseEvents++;
        track.lastReleaseAgeYears = this.ageYears;
        this._recordEvent('SUPERNOVA_SIGNATURE', {
          objectId: track.id,
          peakNode: track.peakNode,
          releasedFraction: releaseFraction,
          outwardFlux: track.outwardFlux,
          interpretation: 'supernova_candidate_from_subqg_phase_release'
        });
      }
    }

    this._observeStructureComplexes(seen);

    this._lastObservation = { observables, basins };
  }

  _observeStructureComplexes(seenObjectKeys) {
    const objects = [...this.objectTracks.values()]
      .filter(track => seenObjectKeys.has(track.key) && track.persistence >= 2);
    const adjacency = new Map(objects.map(object => [object.id, []]));
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const distance = this._hopDistance(objects[i].peakNode, objects[j].peakNode, 10);
        if (distance <= 8) {
          adjacency.get(objects[i].id).push(objects[j].id);
          adjacency.get(objects[j].id).push(objects[i].id);
        }
      }
    }

    const byId = new Map(objects.map(object => [object.id, object]));
    const visited = new Set();
    for (const object of objects) {
      if (visited.has(object.id)) continue;
      const component = [object.id];
      visited.add(object.id);
      for (let head = 0; head < component.length; head++) {
        for (const neighbor of adjacency.get(component[head])) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            component.push(neighbor);
          }
        }
      }
      if (component.length < 2) continue;

      const members = component.map(id => byId.get(id));
      const anchorNode = Math.min(...members.map(member => member.peakNode));
      const key = `anchor-${anchorNode}`;
      let complex = this.complexTracks.get(key);
      if (!complex) {
        complex = {
          id: `subqg-complex-${++this.complexSerial}`,
          key,
          anchorNode,
          bornAgeYears: this.ageYears,
          persistence: 0,
          classification: 'UNCLASSIFIED_STRUCTURE_COMPLEX',
          interpretation: 'unknown'
        };
        this.complexTracks.set(key, complex);
        this._recordEvent('STRUCTURE_COMPLEX_DISCOVERED', {
          complexId: complex.id,
          anchorNode
        });
      }

      complex.persistence++;
      complex.lastSeenAgeYears = this.ageYears;
      complex.memberObjectIds = members.map(member => member.id).sort();
      complex.memberCount = members.length;
      complex.totalEnergy = members.reduce((sum, member) => sum + member.totalEnergy, 0.0);
      complex.meanCoherence = mean(members.map(member => member.meanCoherence));
      complex.meanContraction = mean(members.map(member => member.meanContraction));
      complex.radiantCoreCount = members.filter(member =>
        member.classification === 'EMERGENT_RADIANT_CORE').length;
      complex.orbitalBodyCount = members.filter(member =>
        member.classification === 'EMERGENT_ORBITAL_BODY').length;
      complex.unclassifiedCount = members.filter(member =>
        member.interpretation === 'unknown').length;

      const analysis = this._analyzeComplexEvidence(complex);
      complex.analysis = analysis;
      complex.classification = analysis.status === 'RESOLVED'
        ? analysis.candidates[0].classification
        : 'UNCLASSIFIED_STRUCTURE_COMPLEX';
      complex.interpretation = analysis.status === 'RESOLVED'
        ? analysis.candidates[0].interpretation
        : 'unknown';
    }
  }

  _analyzeObjectEvidence(track) {
    const activeObjects = [...this.objectTracks.values()]
      .filter(candidate => candidate.lastSeenAgeYears === this.ageYears && candidate.persistence >= 2);
    const energies = activeObjects.map(candidate => candidate.totalEnergy ?? 0.0);
    const energyRank = energies.length > 1
      ? energies.filter(value => value <= (track.totalEnergy ?? 0.0)).length / energies.length
      : 0.5;
    const persistenceScore = clamp(track.persistence / 8.0, 0.0, 1.0);
    const candidates = [];

    const starScore = clamp(
      0.35 * energyRank + 0.25 * (track.meanCoherence ?? 0.0) +
      0.20 * clamp((track.meanContraction ?? 0.0) * 4.0, 0.0, 1.0) +
      0.20 * persistenceScore,
      0.0,
      1.0
    );
    if (starScore >= 0.35) {
      candidates.push({
        interpretation: 'star_candidate',
        classification: 'EMERGENT_RADIANT_CORE',
        confidence: starScore,
        basis: 'persistent high-energy coherent contracted core'
      });
    }

    if (track.hostObjectId) {
      const planetScore = clamp(
        0.45 + 0.20 * persistenceScore +
        0.20 * clamp((track.phaseCurrent ?? 0.0) * 100.0, 0.0, 1.0) +
        0.15 * clamp(1.0 - (track.hostDistance ?? 12) / 12.0, 0.0, 1.0),
        0.0,
        1.0
      );
      candidates.push({
        interpretation: 'planet_candidate',
        classification: 'EMERGENT_ORBITAL_BODY',
        confidence: planetScore,
        basis: 'persistent lower-energy body with bounded relational distance and phase current'
      });
    }

    const nebulaScore = clamp(
      0.30 * clamp((track.nodeCount ?? 0) / 12.0, 0.0, 1.0) +
      0.30 * (1.0 - (track.meanCoherence ?? 1.0)) +
      0.20 * clamp((track.outwardFlux ?? 0.0) * 100.0, 0.0, 1.0) +
      0.20 * persistenceScore,
      0.0,
      1.0
    );
    if (nebulaScore >= 0.35) {
      candidates.push({
        interpretation: 'nebula_candidate',
        classification: 'EMERGENT_DIFFUSE_CLOUD',
        confidence: nebulaScore,
        basis: 'extended persistent low-coherence energy distribution'
      });
    }

    candidates.sort((a, b) => b.confidence - a.confidence);
    const top = candidates[0]?.confidence ?? 0.0;
    const runnerUp = candidates[1]?.confidence ?? 0.0;
    const status = top >= 0.72 && top - runnerUp >= 0.12 ? 'RESOLVED' : 'UNRESOLVED';
    return {
      status,
      candidates,
      unknownConfidence: clamp(1.0 - top, 0.0, 1.0),
      evidence: {
        energyRank,
        persistence: track.persistence,
        nodeCount: track.nodeCount ?? 0,
        coherence: track.meanCoherence ?? 0.0,
        contraction: track.meanContraction ?? 0.0,
        phaseCurrent: track.phaseCurrent ?? 0.0,
        outwardFlux: track.outwardFlux ?? 0.0,
        hostObjectId: track.hostObjectId ?? null
      }
    };
  }

  _analyzeComplexEvidence(complex) {
    const persistenceScore = clamp(complex.persistence / 6.0, 0.0, 1.0);
    const galaxyScore = clamp(
      0.15 * clamp(complex.memberCount / 8.0, 0.0, 1.0) +
      0.30 * clamp(complex.radiantCoreCount / 2.0, 0.0, 1.0) +
      0.25 * clamp(complex.orbitalBodyCount / 3.0, 0.0, 1.0) +
      0.15 * complex.meanCoherence + 0.15 * persistenceScore,
      0.0,
      1.0
    );
    const nebulaScore = clamp(
      0.25 * clamp(complex.memberCount / 6.0, 0.0, 1.0) +
      0.30 * (1.0 - complex.meanCoherence) +
      0.20 * clamp(complex.unclassifiedCount / Math.max(1, complex.memberCount), 0.0, 1.0) +
      0.25 * persistenceScore,
      0.0,
      1.0
    );
    const candidates = [
      {
        interpretation: 'galaxy_candidate',
        classification: 'EMERGENT_GALACTIC_COMPLEX',
        confidence: galaxyScore,
        basis: 'persistent bound hierarchy containing multiple radiant and orbital structures'
      },
      {
        interpretation: 'nebula_candidate',
        classification: 'EMERGENT_NEBULAR_COMPLEX',
        confidence: nebulaScore,
        basis: 'persistent extended complex dominated by diffuse unclassified structures'
      }
    ].sort((a, b) => b.confidence - a.confidence);
    const status = candidates[0].confidence >= 0.74 &&
      candidates[0].confidence - candidates[1].confidence >= 0.12
      ? 'RESOLVED'
      : 'UNRESOLVED';
    return {
      status,
      candidates,
      unknownConfidence: clamp(1.0 - candidates[0].confidence, 0.0, 1.0),
      evidence: {
        memberCount: complex.memberCount,
        radiantCoreCount: complex.radiantCoreCount,
        orbitalBodyCount: complex.orbitalBodyCount,
        unclassifiedCount: complex.unclassifiedCount,
        meanCoherence: complex.meanCoherence,
        meanContraction: complex.meanContraction,
        persistence: complex.persistence
      }
    };
  }

  analyzeEmergentStructure(id) {
    const object = [...this.objectTracks.values()].find(track => track.id === id);
    if (object) return { id, kind: 'object', ...this._analyzeObjectEvidence(object) };
    const complex = [...this.complexTracks.values()].find(track => track.id === id);
    if (complex) return { id, kind: 'complex', ...this._analyzeComplexEvidence(complex) };
    throw new RangeError(`Unknown emergent structure: ${id}`);
  }

  _objectFormationDiagnostic(track) {
    const objectActive = track.lastSeenAgeYears === this.ageYears;
    const networkNodeActive = this.activeNodes.has(track.peakNode);
    const directNeighbors = networkNodeActive
      ? this.genesis.adj[track.peakNode].filter(node => this.activeNodes.has(node)).sort((a, b) => a - b)
      : [];
    const seedPath = networkNodeActive
      ? this._shortestActivePath(track.peakNode, this.seedNode, this.genesis.N)
      : { connected: false, hops: null, nodes: [] };
    const host = track.hostObjectId
      ? [...this.objectTracks.values()].find(candidate => candidate.id === track.hostObjectId)
      : null;
    const hostPath = host && networkNodeActive
      ? this._shortestActivePath(track.peakNode, host.peakNode, this.genesis.N)
      : { connected: false, hops: null, nodes: [] };
    const containingComplexIds = [...this.complexTracks.values()]
      .filter(complex => (complex.memberObjectIds ?? []).includes(track.id))
      .map(complex => complex.id)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const mechanism = track.hostObjectId
      ? 'Ein persistentes, energieärmeres Gradientenbecken hielt einen begrenzten relationalen Abstand zu einem strahlenden Kern und trug einen Phasenstrom.'
      : track.classification === 'EMERGENT_RADIANT_CORE'
        ? 'Ein lokales Maximum der SubQG-Kompaktheit blieb kohärent, kontrahiert und energiereich über mehrere Beobachtungen bestehen.'
        : 'Ein lokales Maximum der SubQG-Kompaktheit bildete ein persistentes Gradientenbecken; seine makroskopische Deutung bleibt offen.';
    return {
      source: 'measured_from_subqg_phase_network',
      mechanism,
      basinRule: 'Gradientenfluss zu einem lokalen Kompaktheitsmaximum oberhalb des 62%-Quantils',
      radiantTrigger: track.radiantFormation ?? null,
      orbitalTrigger: track.orbitalFormation ?? null,
      network: {
        objectActive,
        networkNodeActive,
        peakNode: track.peakNode,
        directDegree: directNeighbors.length,
        directNeighbors,
        connectedToGenesis: seedPath.connected,
        genesisHops: seedPath.hops,
        genesisPath: seedPath.nodes,
        hostObjectId: host?.id ?? null,
        hostPeakNode: host?.peakNode ?? null,
        connectedToHost: hostPath.connected,
        hostHops: hostPath.hops,
        hostPath: hostPath.nodes,
        containingComplexIds
      }
    };
  }

  _complexFormationDiagnostic(complex) {
    const members = (complex.memberObjectIds ?? [])
      .map(id => [...this.objectTracks.values()].find(track => track.id === id))
      .filter(Boolean);
    const memberPaths = members.map(member => ({
      objectId: member.id,
      peakNode: member.peakNode,
      ...this._shortestActivePath(complex.anchorNode, member.peakNode, this.genesis.N)
    }));
    const persistenceScore = clamp(complex.persistence / 6.0, 0.0, 1.0);
    const scoreComponents = {
      membership: 0.15 * clamp(complex.memberCount / 8.0, 0.0, 1.0),
      radiantCores: 0.30 * clamp(complex.radiantCoreCount / 2.0, 0.0, 1.0),
      orbitalBodies: 0.25 * clamp(complex.orbitalBodyCount / 3.0, 0.0, 1.0),
      coherence: 0.15 * complex.meanCoherence,
      persistence: 0.15 * persistenceScore
    };
    return {
      source: 'measured_from_subqg_phase_network',
      mechanism: 'Persistente Objektbecken bildeten im aktualisierten Phasennetz eine gemeinsame relationale Komponente; erst danach wurde die Galaxien-Hypothese bewertet.',
      groupingRule: 'Objekte gehören zum selben Komplex, wenn ihre Peak-Knoten über höchstens 8 aktive Netz-Hops gekoppelt sind.',
      galaxyScoreComponents: scoreComponents,
      galaxyScore: Object.values(scoreComponents).reduce((sum, value) => sum + value, 0.0),
      network: {
        anchorNode: complex.anchorNode,
        memberPaths,
        allMembersConnected: memberPaths.length > 0 && memberPaths.every(path => path.connected),
        maximumMemberHops: memberPaths.reduce((maximum, path) => Math.max(maximum, path.hops ?? 0), 0)
      }
    };
  }

  _totalExcitationEnergy() {
    let total = 0.0;
    const observables = this._nodeObservables();
    for (const item of observables.values()) total += item.energy;
    return total;
  }

  _stage() {
    const fraction = this.activeNodes.size / Math.max(1, this.genesis.giantComponent.length);
    const persistent = [...this.objectTracks.values()].filter(track =>
      track.persistence >= 2 && track.lastSeenAgeYears === this.ageYears).length;
    if (this.activeEdges.size === 0) return 'FIRST_RELATIONAL_EVENT';
    if (fraction < 0.15) return 'SPACETIME_NUCLEATION';
    if (fraction < 0.80) return 'CAUSAL_VOLUME_GROWTH';
    if (persistent === 0) return 'FIELD_DIFFERENTIATION';
    return 'EMERGENT_STRUCTURE_ERA';
  }

  _recordHistory() {
    const activeFraction = this.activeNodes.size / Math.max(1, this.genesis.giantComponent.length);
    const scaleFactor = Math.pow(
      Math.max(1.0, this.activeNodes.size),
      1.0 / Math.max(1.0, this.genesis.emergentDimension)
    );
    const activeTracks = [...this.objectTracks.values()]
      .filter(track => track.lastSeenAgeYears === this.ageYears && track.persistence >= 2);
    const entry = {
      ageYears: this.ageYears,
      epoch: this.epoch,
      relationalClock: this.relationalClock,
      causalEvents: this.causalEvents,
      stage: this._stage(),
      activeNodes: this.activeNodes.size,
      activeEdges: this.activeEdges.size,
      activeSimplices: this.activeTriangles.size,
      activeFraction,
      relationalScaleFactor: scaleFactor,
      excitationEnergy: this._totalExcitationEnergy(),
      persistentObjects: activeTracks.length,
      radiantCores: activeTracks.filter(track => track.classification === 'EMERGENT_RADIANT_CORE').length,
      orbitalBodies: activeTracks.filter(track => track.classification === 'EMERGENT_ORBITAL_BODY').length,
      phaseReleaseEvents: this.events.filter(event => event.type === 'SUPERNOVA_SIGNATURE').length
    };
    this.history.push(entry);
    return entry;
  }

  stepEpoch() {
    for (let step = 0; step < this.microStepsPerEpoch; step++) {
      this.genesis.stepGenesis({ damping: this.damping, updateMetric: true });
      this.microTick++;
      this._actualizeCausalFront();
    }
    this.epoch++;
    this.ageYears += this.epochYears;

    if (this.epoch % this.observationStride === 0) {
      this._observeEmergentStructures();
      return this._recordHistory();
    }
    return null;
  }

  evolveToAge(targetAgeYears, { onObservation = null } = {}) {
    assertFinite('targetAgeYears', targetAgeYears, { min: this.ageYears });
    if (onObservation !== null && typeof onObservation !== 'function') {
      throw new TypeError('onObservation must be a function or null');
    }
    const remaining = targetAgeYears - this.ageYears;
    const exactEpochs = remaining / this.epochYears;
    const epochs = Math.round(exactEpochs);
    if (Math.abs(exactEpochs - epochs) > 1e-10) {
      throw new RangeError('targetAgeYears must be reachable with the configured epochYears');
    }
    for (let index = 0; index < epochs; index++) {
      const observation = this.stepEpoch();
      if (observation && onObservation) onObservation(observation, this);
    }
    return this.snapshot();
  }

  objectCatalog({ includeTransient = false } = {}) {
    return [...this.objectTracks.values()]
      .filter(track => includeTransient || track.persistence >= 2)
      .map(track => ({
        id: track.id,
        classification: track.classification,
        interpretation: track.interpretation,
        peakNode: track.peakNode,
        nodes: [...(track.nodes ?? [])],
        nodeCount: track.nodeCount ?? 0,
        bornAgeYears: track.bornAgeYears,
        lastSeenAgeYears: track.lastSeenAgeYears,
        activeAtSnapshot: track.lastSeenAgeYears === this.ageYears,
        persistence: track.persistence,
        totalEnergy: track.totalEnergy ?? 0.0,
        compactness: track.compactness ?? 0.0,
        meanContraction: track.meanContraction ?? 0.0,
        meanCoherence: track.meanCoherence ?? 0.0,
        phaseCurrent: track.phaseCurrent ?? 0.0,
        outwardFlux: track.outwardFlux ?? 0.0,
        hostObjectId: track.hostObjectId ?? null,
        hostDistance: track.hostDistance ?? null,
        releaseEvents: track.releaseEvents,
        analysis: this._analyzeObjectEvidence(track),
        formation: this._objectFormationDiagnostic(track)
      }))
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }

  structureCatalog({ includeUnresolved = true } = {}) {
    return [...this.complexTracks.values()]
      .filter(complex => complex.persistence >= 1 &&
        (includeUnresolved || complex.analysis?.status === 'RESOLVED'))
      .map(complex => ({
        id: complex.id,
        classification: complex.classification,
        interpretation: complex.interpretation,
        anchorNode: complex.anchorNode,
        bornAgeYears: complex.bornAgeYears,
        lastSeenAgeYears: complex.lastSeenAgeYears,
        activeAtSnapshot: complex.lastSeenAgeYears === this.ageYears,
        persistence: complex.persistence,
        memberObjectIds: [...(complex.memberObjectIds ?? [])],
        memberCount: complex.memberCount ?? 0,
        totalEnergy: complex.totalEnergy ?? 0.0,
        radiantCoreCount: complex.radiantCoreCount ?? 0,
        orbitalBodyCount: complex.orbitalBodyCount ?? 0,
        unclassifiedCount: complex.unclassifiedCount ?? 0,
        meanCoherence: complex.meanCoherence ?? 0.0,
        meanContraction: complex.meanContraction ?? 0.0,
        analysis: complex.analysis ?? this._analyzeComplexEvidence(complex),
        formation: this._complexFormationDiagnostic(complex)
      }))
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }

  _viewCoordinate(node) {
    const state = this.genesis.possibilities[node];
    const radius = 1.0 + 0.35 * state.amplitude;
    const azimuth = (state.phases[0] - state.phases[1] + TWO_PI) % TWO_PI;
    const elevation = clamp(0.5 * (state.phases[2] - state.phases[3]), -Math.PI / 2, Math.PI / 2);
    return {
      x: radius * Math.cos(elevation) * Math.cos(azimuth),
      y: radius * Math.sin(elevation),
      z: radius * Math.cos(elevation) * Math.sin(azimuth),
      role: 'visual_embedding_only_not_physical_input'
    };
  }

  snapshot({ includeGraph = false, recentEventLimit = 100 } = {}) {
    assertInteger('recentEventLimit', recentEventLimit, { min: 0, max: 100000 });
    if (this.history.length === 0) this._recordHistory();
    const currentActiveFraction = this.activeNodes.size /
      Math.max(1, this.genesis.giantComponent.length);
    const currentScaleFactor = Math.pow(
      Math.max(1.0, this.activeNodes.size),
      1.0 / Math.max(1.0, this.genesis.emergentDimension)
    );
    const currentEnergy = this._totalExcitationEnergy();
    const result = {
      model: 'SubQG-only relational universe evolution',
      externalAstrophysicalEvolutionFunctions: false,
      timeCalibration: {
        epochYears: this.epochYears,
        note: 'Years are an explicit display calibration of the internal relational epoch; dynamics use only SubQG ticks.'
      },
      seed: this.seed,
      universeMode: this.universeMode,
      ageYears: this.ageYears,
      epoch: this.epoch,
      microTick: this.microTick,
      relationalClock: this.relationalClock,
      stage: this._stage(),
      latentSector: {
        possibilityStates: this.genesis.N,
        giantComponentNodes: this.genesis.giantComponent.length,
        latentEdges: this.genesis.edgeKeys.length,
        emergentDimension: this.genesis.emergentDimension,
        lambdaRatio: this.genesis.lambdaRatio
      },
      actualizedSector: {
        nodes: this.activeNodes.size,
        edges: this.activeEdges.size,
        simplices: this.activeTriangles.size,
        activeFraction: currentActiveFraction,
        relationalScaleFactor: currentScaleFactor,
        causalEvents: this.causalEvents,
        excitationEnergy: currentEnergy
      },
      objects: this.objectCatalog(),
      structureComplexes: this.structureCatalog(),
      events: this.events.slice(-recentEventLimit),
      history: this.history.map(entry => ({ ...entry }))
    };

    if (includeGraph) {
      result.graph = {
        nodes: [...this.activeNodes].sort((a, b) => a - b).map(node => ({
          id: node,
          bornTick: this.nodeBirthTick[node],
          psi: this.genesis.psi[node],
          pi: this.genesis.pi[node],
          view: this._viewCoordinate(node)
        })),
        edges: [...this.activeEdges.values()].map(edge => ({
          ...edge,
          length: this.genesis.getEdgeLength(edge.a, edge.b)
        })),
        simplices: [...this.activeTriangles.values()].map(simplex => ({ ...simplex }))
      };
    }
    return result;
  }
}

export function evolveCanonicalSubQGUniverse({
  targetAgeYears = 2_000_000_000,
  ...options
} = {}) {
  const universe = new SubQGUniverseEvolution(options);
  return universe.evolveToAge(targetAgeYears);
}
