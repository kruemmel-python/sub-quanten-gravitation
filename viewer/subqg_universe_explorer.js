const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const canvas = $('#universe');
const context = canvas.getContext('2d', { alpha: false });
const worker = new Worker('./subqg_universe_worker.mjs', { type: 'module' });
const MAX_AGE = 2_000_000_000;
const EPOCH_YEARS = 1_000_000;

const dom = {
  intro: $('#intro'), begin: $('#beginExperience'), enterFlight: $('#enterFlight'),
  age: $('#ageValue'), clock: $('#clockValue'), nodes: $('#nodeValue'), engine: $('#engineValue'),
  engineLight: $('#engineLight'), stage: $('#stageValue'), timeline: $('#ageTimeline'),
  play: $('#playSimulation'), reset: $('#resetSimulation'), simulationSpeed: $('#simulationSpeed'),
  flightSpeed: $('#flightSpeed'), flightSpeedValue: $('#flightSpeedValue'), camera: $('#cameraValue'),
  toggleEdges: $('#toggleEdges'), starCount: $('#starCount'), planetCount: $('#planetCount'),
  unknownCount: $('#unknownCount'), complexCount: $('#complexCount'), eventCount: $('#eventCount'),
  objectTitle: $('#objectTitle'), objectSubtitle: $('#objectSubtitle'), objectTag: $('#objectTag'),
  objectMetrics: $('#objectMetrics'), analysisText: $('#analysisText'), flyTo: $('#flyToTarget'),
  nextTarget: $('#nextTarget'), catalog: $('#targetCatalog'), catalogCount: $('#catalogCount'),
  targetLabel: $('#targetLabel'), toast: $('#toast'), rightPanel: $('.right-panel')
};

const state = {
  snapshot: null,
  nodePositions: new Map(),
  objectTargets: [],
  complexTargets: [],
  hitTargets: [],
  hovered: null,
  selected: null,
  requestId: 0,
  busy: true,
  playing: false,
  edgesVisible: true,
  filters: { star: true, planet: true, unknown: true, complex: true, events: true },
  camera: { x: 0, y: 35, z: 760, yaw: 0, pitch: -0.04 },
  keys: new Set(),
  drag: null,
  autopilot: null,
  stars: [],
  lastFrame: performance.now(),
  toastTimer: 0
};

function seededNoise(index, salt = 0) {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function resize() {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(innerWidth * ratio);
  canvas.height = Math.round(innerHeight * ratio);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  state.stars = Array.from({ length: Math.max(180, Math.floor(innerWidth * innerHeight / 5200)) }, (_, index) => ({
    x: seededNoise(index, 1), y: seededNoise(index, 2), size: .35 + seededNoise(index, 3) * 1.35,
    alpha: .18 + seededNoise(index, 4) * .62
  }));
}

function setEngineStatus(label, mode = 'live') {
  dom.engine.textContent = label;
  dom.engineLight.className = mode;
}

function post(type, payload = {}) {
  state.requestId += 1;
  state.busy = true;
  setEngineStatus(type === 'seek' ? 'BERECHNET ZEITSPRUNG' : 'BERECHNET', 'busy');
  worker.postMessage({ type, requestId: state.requestId, ...payload });
}

function formatAge(years) {
  if (years === 0) return '0 Jahre';
  if (years >= 1_000_000_000) return `${(years / 1_000_000_000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mrd. Jahre`;
  return `${Math.round(years / 1_000_000).toLocaleString('de-DE')} Mio. Jahre`;
}

function stageLabel(stage) {
  return ({
    FIRST_RELATIONAL_EVENT: 'ERSTES EREIGNIS',
    CAUSAL_ACTUALIZATION: 'KAUSALE AKTUALISIERUNG',
    RELATIONAL_SPACETIME: 'RELATIONALE RAUMZEIT',
    EMERGENT_STRUCTURE_ERA: 'EMERGENTE STRUKTUREN'
  })[stage] ?? String(stage).replaceAll('_', ' ');
}

function typeForObject(object) {
  if (object.interpretation === 'star_candidate') return 'star';
  if (object.interpretation === 'planet_candidate') return 'planet';
  return 'unknown';
}

function typeColor(type, alpha = 1) {
  const colors = {
    star: `rgba(255,200,87,${alpha})`, planet: `rgba(80,230,255,${alpha})`,
    unknown: `rgba(179,137,255,${alpha})`, complex: `rgba(255,130,197,${alpha})`,
    event: `rgba(255,85,120,${alpha})`
  };
  return colors[type] ?? `rgba(190,230,242,${alpha})`;
}

function buildWorld(snapshot) {
  state.snapshot = snapshot;
  state.nodePositions.clear();
  const graphNodes = snapshot.graph?.nodes ?? [];
  const maxBirth = Math.max(1, ...graphNodes.map(node => node.bornTick));
  const expansion = Math.max(1, snapshot.actualizedSector.relationalScaleFactor);

  for (const node of graphNodes) {
    const birth = Math.max(0, node.bornTick) / maxBirth;
    const amplitude = Math.min(1.5, Math.hypot(node.psi, node.pi));
    const radius = 36 + birth * (170 + expansion * 11) + amplitude * 42;
    const ripple = 1 + .045 * Math.sin(node.id * 2.399 + birth * 13);
    state.nodePositions.set(node.id, {
      x: node.view.x * radius * ripple,
      y: node.view.y * radius * ripple,
      z: node.view.z * radius * ripple,
      node,
      amplitude
    });
  }

  state.objectTargets = snapshot.objects
    .map(object => ({ kind: 'object', type: typeForObject(object), data: object, position: state.nodePositions.get(object.peakNode) }))
    .filter(target => target.position);
  state.complexTargets = snapshot.structureComplexes
    .map(complex => ({ kind: 'complex', type: 'complex', data: complex, position: state.nodePositions.get(complex.anchorNode) }))
    .filter(target => target.position);

  if (state.selected) {
    const refreshed = [...state.objectTargets, ...state.complexTargets]
      .find(target => target.kind === state.selected.kind && target.data.id === state.selected.data.id);
    state.selected = refreshed ?? null;
  }
  updateHud();
  renderCatalog();
  updateSelectionPanel();
}

function updateHud() {
  const snapshot = state.snapshot;
  if (!snapshot) return;
  dom.age.textContent = formatAge(snapshot.ageYears);
  dom.clock.textContent = snapshot.relationalClock.toLocaleString('de-DE');
  dom.nodes.textContent = `${snapshot.actualizedSector.nodes} / ${snapshot.latentSector.possibilityStates}`;
  dom.stage.textContent = stageLabel(snapshot.stage);
  dom.timeline.value = String(Math.round(snapshot.ageYears / 1_000_000));
  dom.starCount.textContent = snapshot.objects.filter(item => typeForObject(item) === 'star').length;
  dom.planetCount.textContent = snapshot.objects.filter(item => typeForObject(item) === 'planet').length;
  dom.unknownCount.textContent = snapshot.objects.filter(item => typeForObject(item) === 'unknown').length;
  dom.complexCount.textContent = snapshot.structureComplexes.length;
  const latestHistory = snapshot.history.at(-1);
  dom.eventCount.textContent = String(latestHistory?.phaseReleaseEvents ??
    snapshot.events.filter(item => item.type === 'SUPERNOVA_SIGNATURE').length);
}

function targetTitle(target) {
  if (!target) return '';
  const names = {
    star: 'Strahlender Kern', planet: 'Orbital-Kandidat', unknown: 'Unbekannte Struktur', complex: 'Strukturkomplex'
  };
  return `${names[target.type]} · ${target.data.id.replace('subqg-', '')}`;
}

function targetSubtitle(target) {
  if (target.kind === 'complex') {
    return `${target.data.memberCount} Mitglieder · ${target.data.radiantCoreCount} strahlende Kerne · ${target.data.orbitalBodyCount} Orbital-Kandidaten`;
  }
  return `Peak-Knoten ${target.data.peakNode} · entstanden bei ${formatAge(target.data.bornAgeYears)}${target.data.activeAtSnapshot ? ' · aktuell aktiv' : ' · archiviert'}`;
}

function formatScientific(value) {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) > 0 && Math.abs(value) < .001) return value.toExponential(2);
  return value.toLocaleString('de-DE', { maximumFractionDigits: 4 });
}

function updateSelectionPanel() {
  const target = state.selected;
  if (!target) {
    dom.objectTitle.textContent = 'Kein Ziel gewählt';
    dom.objectSubtitle.textContent = 'Klicke auf eine markierte Struktur oder wähle ein Ziel aus dem Katalog.';
    dom.objectTag.className = 'tag neutral';
    dom.objectTag.textContent = 'BEREIT';
    dom.objectMetrics.className = 'metric-list empty';
    [...dom.objectMetrics.querySelectorAll('strong')].forEach(node => { node.textContent = '—'; });
    dom.analysisText.textContent = 'Die Klassifikation wird erst nach der Dynamik gebildet und verändert den SubQG-Zustand nicht.';
    dom.flyTo.disabled = true;
    return;
  }

  dom.objectTitle.textContent = targetTitle(target);
  dom.objectSubtitle.textContent = targetSubtitle(target);
  dom.objectTag.className = `tag ${target.type}`;
  dom.objectTag.textContent = target.type === 'unknown' ? 'UNAUFGELÖST' : 'KANDIDAT';
  dom.objectMetrics.className = 'metric-list';
  const values = target.kind === 'complex'
    ? [target.data.totalEnergy, target.data.meanCoherence, target.data.meanContraction, target.data.persistence]
    : [target.data.totalEnergy, target.data.meanCoherence, target.data.meanContraction, target.data.persistence];
  [...dom.objectMetrics.querySelectorAll('strong')].forEach((node, index) => { node.textContent = formatScientific(values[index]); });

  const candidates = target.data.analysis?.candidates ?? [];
  dom.analysisText.textContent = candidates.length
    ? candidates.slice(0, 3).map(candidate => `${candidate.interpretation.replaceAll('_', ' ')} ${(candidate.confidence * 100).toFixed(0)} %`).join(' · ')
    : 'Noch keine belastbare Signaturhypothese. Das Objekt bleibt im neutralen Archiv erhalten.';
  dom.flyTo.disabled = false;
  dom.rightPanel.classList.add('mobile-open');
  $$('.catalog-item').forEach(item => item.classList.toggle('selected', item.dataset.id === target.data.id));
}

function visibleTargets() {
  return [...state.objectTargets, ...state.complexTargets]
    .filter(target => state.filters[target.type])
    .sort((a, b) => Number(b.data.activeAtSnapshot) - Number(a.data.activeAtSnapshot) || (b.data.persistence ?? 0) - (a.data.persistence ?? 0));
}

function renderCatalog() {
  const targets = visibleTargets().slice(0, 40);
  dom.catalog.replaceChildren();
  dom.catalogCount.textContent = String(targets.length);
  for (const target of targets) {
    const button = document.createElement('button');
    button.className = 'catalog-item';
    button.dataset.id = target.data.id;
    button.style.color = typeColor(target.type);
    const dot = document.createElement('i');
    const text = document.createElement('span');
    const title = document.createElement('strong');
    const subtitle = document.createElement('small');
    const age = document.createElement('em');
    title.textContent = targetTitle(target);
    subtitle.textContent = target.kind === 'complex' ? `${target.data.memberCount} Mitglieder` : `Knoten ${target.data.peakNode} · P ${target.data.persistence}`;
    age.textContent = target.data.activeAtSnapshot ? 'AKTIV' : 'ARCHIV';
    text.append(title, subtitle);
    button.append(dot, text, age);
    button.addEventListener('click', () => selectTarget(target));
    dom.catalog.append(button);
  }
}

function selectTarget(target) {
  state.selected = target;
  updateSelectionPanel();
}

function pickTargetAt(screenX, screenY, { crosshair = false } = {}) {
  const tolerance = crosshair ? 58 : 24;
  return state.hitTargets
    .map(hit => ({
      ...hit,
      distance: Math.hypot(hit.x - screenX, hit.y - screenY)
    }))
    .filter(hit => hit.distance <= Math.max(tolerance, hit.radius + 8))
    .sort((a, b) => a.distance - b.distance || a.depth - b.depth)[0] ?? null;
}

function cameraBasis() {
  const cosPitch = Math.cos(state.camera.pitch);
  const forward = {
    x: Math.sin(state.camera.yaw) * cosPitch,
    y: Math.sin(state.camera.pitch),
    z: -Math.cos(state.camera.yaw) * cosPitch
  };
  const right = { x: Math.cos(state.camera.yaw), y: 0, z: Math.sin(state.camera.yaw) };
  const up = {
    x: -Math.sin(state.camera.yaw) * Math.sin(state.camera.pitch),
    y: Math.cos(state.camera.pitch),
    z: Math.cos(state.camera.yaw) * Math.sin(state.camera.pitch)
  };
  return { forward, right, up };
}

function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
function subtract(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
function length(vector) { return Math.hypot(vector.x, vector.y, vector.z); }

function project(position) {
  const basis = cameraBasis();
  const relative = subtract(position, state.camera);
  const depth = dot(relative, basis.forward);
  if (depth <= 2) return null;
  const focal = Math.min(innerWidth, innerHeight) * .82;
  return {
    x: innerWidth / 2 + dot(relative, basis.right) * focal / depth,
    y: innerHeight / 2 - dot(relative, basis.up) * focal / depth,
    depth,
    scale: focal / depth
  };
}

function drawBackground(time) {
  const gradient = context.createRadialGradient(innerWidth * .52, innerHeight * .46, 10, innerWidth * .5, innerHeight * .5, Math.max(innerWidth, innerHeight) * .75);
  gradient.addColorStop(0, '#07131d');
  gradient.addColorStop(.45, '#030910');
  gradient.addColorStop(1, '#010204');
  context.fillStyle = gradient;
  context.fillRect(0, 0, innerWidth, innerHeight);

  context.save();
  for (let index = 0; index < state.stars.length; index++) {
    const star = state.stars[index];
    const x = ((star.x * innerWidth + state.camera.yaw * 45) % innerWidth + innerWidth) % innerWidth;
    const y = ((star.y * innerHeight - state.camera.pitch * 45) % innerHeight + innerHeight) % innerHeight;
    context.globalAlpha = star.alpha * (.78 + .22 * Math.sin(time * .001 + index));
    context.fillStyle = index % 19 === 0 ? '#9aefff' : '#d5e6ed';
    context.fillRect(x, y, star.size, star.size);
  }
  context.restore();
}

function drawGraph(time) {
  const snapshot = state.snapshot;
  if (!snapshot?.graph) return;
  const projected = new Map();
  for (const [id, position] of state.nodePositions) {
    const point = project(position);
    if (point && point.x > -80 && point.x < innerWidth + 80 && point.y > -80 && point.y < innerHeight + 80) projected.set(id, point);
  }

  context.save();
  context.globalCompositeOperation = 'lighter';
  if (state.edgesVisible) {
    context.lineWidth = .45;
    for (const edge of snapshot.graph.edges) {
      const a = projected.get(edge.a);
      const b = projected.get(edge.b);
      if (!a || !b) continue;
      const alpha = Math.min(.19, 42 / Math.max(60, (a.depth + b.depth) / 2));
      context.strokeStyle = `rgba(82,181,207,${alpha})`;
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.stroke();
    }
  }

  const objectAtNode = new Map(state.objectTargets.map(target => [target.data.peakNode, target]));
  const nodes = [...projected.entries()].sort((a, b) => b[1].depth - a[1].depth);
  for (const [id, point] of nodes) {
    const position = state.nodePositions.get(id);
    const target = objectAtNode.get(id);
    const radius = Math.max(.7, Math.min(3.3, .6 + position.amplitude * 1.6 + point.scale * .8));
    context.globalAlpha = Math.min(1, .28 + position.amplitude * .75);
    context.fillStyle = target && state.filters[target.type] ? typeColor(target.type) : '#8bd5e6';
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();

  drawTargets(projected, time);
}

function drawTargets(projected, time) {
  state.hitTargets = [];
  const targets = visibleTargets();
  for (const target of targets) {
    const nodeId = target.kind === 'complex' ? target.data.anchorNode : target.data.peakNode;
    const point = projected.get(nodeId);
    if (!point) continue;
    const pulse = .5 + .5 * Math.sin(time * .0022 + nodeId);
    const base = target.kind === 'complex' ? 13 : target.type === 'star' ? 8 : 6;
    const radius = Math.max(5, Math.min(22, base + pulse * 3 + point.scale * 2));
    context.save();
    context.strokeStyle = typeColor(target.type, .35 + pulse * .3);
    const emphasized = target === state.selected || target === state.hovered;
    context.lineWidth = target === state.selected ? 1.8 : target === state.hovered ? 1.35 : .8;
    if (emphasized) context.shadowColor = typeColor(target.type, .8);
    if (emphasized) context.shadowBlur = 12;
    context.setLineDash(target.kind === 'complex' ? [3, 4] : []);
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.stroke();
    if (target.type === 'star') {
      const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 2.4);
      glow.addColorStop(0, typeColor('star', .38));
      glow.addColorStop(1, typeColor('star', 0));
      context.fillStyle = glow;
      context.beginPath(); context.arc(point.x, point.y, radius * 2.4, 0, Math.PI * 2); context.fill();
    }
    context.restore();
    state.hitTargets.push({ target, x: point.x, y: point.y, radius: Math.max(12, radius), depth: point.depth });
  }

  if (state.filters.events && state.snapshot) {
    const releaseCount = state.snapshot.events.filter(event => event.type === 'SUPERNOVA_SIGNATURE').length;
    if (releaseCount > 0) {
      const recentStars = state.objectTargets.filter(target => target.type === 'star').slice(-Math.min(5, releaseCount));
      for (const target of recentStars) {
        const point = projected.get(target.data.peakNode);
        if (!point) continue;
        const ring = 12 + ((time * .035 + target.data.peakNode) % 34);
        context.strokeStyle = typeColor('event', Math.max(0, .5 - ring / 75));
        context.lineWidth = 1;
        context.beginPath(); context.arc(point.x, point.y, ring, 0, Math.PI * 2); context.stroke();
      }
    }
  }

  if (state.selected) {
    const hit = state.hitTargets.find(item => item.target.kind === state.selected.kind && item.target.data.id === state.selected.data.id);
    if (hit) {
      dom.targetLabel.hidden = false;
      dom.targetLabel.style.left = `${hit.x}px`;
      dom.targetLabel.style.top = `${hit.y}px`;
      dom.targetLabel.textContent = `${targetTitle(state.selected)} · ${Math.round(hit.depth)} VE`;
    } else dom.targetLabel.hidden = true;
  } else dom.targetLabel.hidden = true;
}

function updateCamera(deltaSeconds) {
  const camera = state.camera;
  if (state.autopilot) {
    const target = state.autopilot.target.position;
    const toTarget = subtract(target, camera);
    const distance = length(toTarget);
    if (distance < state.autopilot.stopDistance + 2) {
      state.autopilot = null;
      showToast('Ziel erreicht · freie Flugsteuerung aktiv');
    } else {
      const direction = { x: toTarget.x / distance, y: toTarget.y / distance, z: toTarget.z / distance };
      const step = Math.min(distance - state.autopilot.stopDistance, deltaSeconds * Math.max(45, distance * .7));
      camera.x += direction.x * step;
      camera.y += direction.y * step;
      camera.z += direction.z * step;
      const desiredYaw = Math.atan2(direction.x, -direction.z);
      const desiredPitch = Math.asin(Math.max(-1, Math.min(1, direction.y)));
      camera.yaw += Math.atan2(Math.sin(desiredYaw - camera.yaw), Math.cos(desiredYaw - camera.yaw)) * Math.min(1, deltaSeconds * 4);
      camera.pitch += (desiredPitch - camera.pitch) * Math.min(1, deltaSeconds * 4);
    }
  }

  const basis = cameraBasis();
  const speedMultiplier = Number(dom.flightSpeed.value) * (state.keys.has('ShiftLeft') || state.keys.has('ShiftRight') ? 3.2 : 1);
  const speed = 95 * speedMultiplier * deltaSeconds;
  const direction = { x: 0, y: 0, z: 0 };
  if (state.keys.has('KeyW')) Object.assign(direction, { x: direction.x + basis.forward.x, y: direction.y + basis.forward.y, z: direction.z + basis.forward.z });
  if (state.keys.has('KeyS')) Object.assign(direction, { x: direction.x - basis.forward.x, y: direction.y - basis.forward.y, z: direction.z - basis.forward.z });
  if (state.keys.has('KeyD')) Object.assign(direction, { x: direction.x + basis.right.x, y: direction.y + basis.right.y, z: direction.z + basis.right.z });
  if (state.keys.has('KeyA')) Object.assign(direction, { x: direction.x - basis.right.x, y: direction.y - basis.right.y, z: direction.z - basis.right.z });
  if (state.keys.has('KeyE')) direction.y += 1;
  if (state.keys.has('KeyQ')) direction.y -= 1;
  const magnitude = length(direction);
  if (magnitude > 0) {
    state.autopilot = null;
    camera.x += direction.x / magnitude * speed;
    camera.y += direction.y / magnitude * speed;
    camera.z += direction.z / magnitude * speed;
  }
  dom.camera.textContent = `X ${camera.x.toFixed(0)} · Y ${camera.y.toFixed(0)} · Z ${camera.z.toFixed(0)}`;
}

function animate(time) {
  const delta = Math.min(.05, (time - state.lastFrame) / 1000);
  state.lastFrame = time;
  updateCamera(delta);
  drawBackground(time);
  drawGraph(time);
  requestAnimationFrame(animate);
}

function scheduleAdvance() {
  if (!state.playing || state.busy || !state.snapshot) return;
  if (state.snapshot.ageYears >= MAX_AGE) {
    setPlaying(false);
    showToast('Zwei Milliarden Anzeigejahre erreicht');
    return;
  }
  const epochs = Number(dom.simulationSpeed.value);
  setTimeout(() => {
    if (state.playing && !state.busy) post('advance', { epochs });
  }, 55);
}

function setPlaying(value) {
  state.playing = value;
  dom.play.textContent = value ? 'Ⅱ' : '▶';
  dom.play.title = value ? 'Simulation pausieren' : 'Simulation starten';
  if (value) scheduleAdvance();
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add('visible');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => dom.toast.classList.remove('visible'), 2200);
}

function requestFlightPointerLock() {
  try {
    const request = canvas.requestPointerLock();
    if (request && typeof request.catch === 'function') {
      request.catch(() => showToast('Der Browser blockiert den Flugmodus · direkte Zielklicks bleiben aktiv'));
    }
  } catch {
    showToast('Der Browser blockiert den Flugmodus · direkte Zielklicks bleiben aktiv');
  }
}

worker.addEventListener('message', event => {
  const message = event.data ?? {};
  if (message.type === 'snapshot') {
    state.busy = false;
    setEngineStatus('LIVE · DETERMINISTISCH', 'live');
    buildWorld(message.snapshot);
    scheduleAdvance();
    return;
  }
  if (message.type === 'progress') {
    setEngineStatus(`${Math.round(message.completed / Math.max(1, message.total) * 100)} %`, 'busy');
    return;
  }
  if (message.type === 'error') {
    state.busy = false;
    setPlaying(false);
    setEngineStatus('FEHLER', '');
    showToast(`Engine: ${message.message}`);
  }
});

worker.addEventListener('error', event => {
  state.busy = false;
  setEngineStatus('WORKER-FEHLER', '');
  showToast(event.message || 'Die Simulations-Engine konnte nicht gestartet werden.');
});

dom.begin.addEventListener('click', () => {
  dom.intro.classList.add('hidden');
  showToast('Genesis geladen · starte die Zeit oder fliege frei');
});
dom.enterFlight.addEventListener('click', requestFlightPointerLock);
dom.play.addEventListener('click', () => setPlaying(!state.playing));
dom.reset.addEventListener('click', () => {
  setPlaying(false);
  state.selected = null;
  state.camera = { x: 0, y: 35, z: 760, yaw: 0, pitch: -0.04 };
  post('reset');
});
dom.timeline.addEventListener('change', () => {
  setPlaying(false);
  post('seek', { targetAgeYears: Number(dom.timeline.value) * 1_000_000 });
});
dom.timeline.addEventListener('input', () => { dom.age.textContent = formatAge(Number(dom.timeline.value) * 1_000_000); });
dom.flightSpeed.addEventListener('input', () => { dom.flightSpeedValue.textContent = `${Number(dom.flightSpeed.value).toFixed(2).replace(/0$/, '')}×`; });
dom.toggleEdges.addEventListener('click', () => {
  state.edgesVisible = !state.edgesVisible;
  dom.toggleEdges.classList.toggle('active', state.edgesVisible);
});

$$('[data-filter]').forEach(input => input.addEventListener('change', () => {
  state.filters[input.dataset.filter] = input.checked;
  renderCatalog();
}));

dom.flyTo.addEventListener('click', () => {
  if (!state.selected) return;
  state.autopilot = { target: state.selected, stopDistance: state.selected.kind === 'complex' ? 90 : 52 };
  showToast(`Autopilot: ${targetTitle(state.selected)}`);
});
dom.nextTarget.addEventListener('click', () => {
  const targets = visibleTargets();
  if (!targets.length) return;
  const index = state.selected ? targets.findIndex(target => target.data.id === state.selected.data.id) : -1;
  selectTarget(targets[(index + 1) % targets.length]);
});

canvas.addEventListener('click', event => {
  const crosshair = document.pointerLockElement === canvas;
  const screenX = crosshair ? innerWidth / 2 : event.clientX;
  const screenY = crosshair ? innerHeight / 2 : event.clientY;
  const hit = pickTargetAt(screenX, screenY, { crosshair });
  if (hit) {
    selectTarget(hit.target);
    showToast(`Ziel erfasst: ${targetTitle(hit.target)}`);
  } else if (crosshair) {
    showToast('Kein Ziel im Fadenkreuz · richte es auf einen Markierungsring');
  }
});
canvas.addEventListener('dblclick', requestFlightPointerLock);
canvas.addEventListener('pointerdown', event => { if (document.pointerLockElement !== canvas) state.drag = { x: event.clientX, y: event.clientY }; });
window.addEventListener('pointerup', () => { state.drag = null; });
window.addEventListener('pointermove', event => {
  let movementX = event.movementX;
  let movementY = event.movementY;
  if (document.pointerLockElement !== canvas) {
    if (!state.drag) {
      const hit = pickTargetAt(event.clientX, event.clientY);
      state.hovered = hit?.target ?? null;
      canvas.style.cursor = hit ? 'pointer' : 'crosshair';
      return;
    }
    movementX = event.clientX - state.drag.x;
    movementY = event.clientY - state.drag.y;
    state.drag = { x: event.clientX, y: event.clientY };
  }
  state.autopilot = null;
  state.camera.yaw += movementX * .0022;
  state.camera.pitch = Math.max(-1.48, Math.min(1.48, state.camera.pitch - movementY * .0022));
});
canvas.addEventListener('pointerleave', () => {
  state.hovered = null;
  canvas.style.cursor = 'crosshair';
});
canvas.addEventListener('wheel', event => {
  event.preventDefault();
  const next = Math.max(.25, Math.min(4, Number(dom.flightSpeed.value) - Math.sign(event.deltaY) * .25));
  dom.flightSpeed.value = String(next);
  dom.flightSpeed.dispatchEvent(new Event('input'));
}, { passive: false });

window.addEventListener('keydown', event => {
  if (/^(Key[WASDQE]|ShiftLeft|ShiftRight)$/.test(event.code)) {
    event.preventDefault();
    state.keys.add(event.code);
  }
  if (event.code === 'Space' && event.target === document.body) {
    event.preventDefault();
    setPlaying(!state.playing);
  }
});
window.addEventListener('keyup', event => state.keys.delete(event.code));
window.addEventListener('blur', () => state.keys.clear());
document.addEventListener('pointerlockchange', () => {
  const active = document.pointerLockElement === canvas;
  state.hovered = null;
  dom.enterFlight.textContent = active ? 'Flugsteuerung aktiv · ESC zum Lösen' : '⌖ Flugsteuerung aktivieren';
  if (active) showToast('Flugmodus: Linksklick erfasst das Ziel im Fadenkreuz');
});
window.addEventListener('resize', resize);

resize();
requestAnimationFrame(animate);
post('init');
