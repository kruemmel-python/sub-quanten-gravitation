import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const paths = {
  html: new URL('../viewer/subqg_universe_explorer.html', import.meta.url),
  css: new URL('../viewer/subqg_universe_explorer.css', import.meta.url),
  client: new URL('../viewer/subqg_universe_explorer.js', import.meta.url),
  worker: new URL('../viewer/subqg_universe_worker.mjs', import.meta.url),
  server: new URL('../viewer/serve_universe_viewer.mjs', import.meta.url),
  pages: new URL('../viewer/pages-index.html', import.meta.url)
};

test('universe explorer exposes the flight and time controls', async () => {
  const html = await readFile(paths.html, 'utf8');
  for (const id of ['universe', 'enterFlight', 'enterImmersive', 'exitImmersive', 'playSimulation', 'ageTimeline', 'targetCatalog', 'flyToTarget', 'toggleCinematic']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /type="module" src="\.\/subqg_universe_explorer\.js"/);
  const pagesIndex = await readFile(paths.pages, 'utf8');
  assert.match(pagesIndex, /\.\/viewer\/subqg_universe_explorer\.html/);
});

test('universe explorer renders canonical engine snapshots instead of a fixed catalogue', async () => {
  const [client, worker] = await Promise.all([
    readFile(paths.client, 'utf8'), readFile(paths.worker, 'utf8')
  ]);
  assert.match(client, /new Worker\('\.\/subqg_universe_worker\.mjs'/);
  assert.match(worker, /SubQGUniverseEvolution/);
  assert.match(worker, /snapshot\(\{ includeGraph: true/);
  assert.match(worker, /universe\.stepEpoch\(\)/);
  assert.match(client, /latestHistory\?\.phaseReleaseEvents/);
});

test('viewer supports free flight, target selection and responsive presentation', async () => {
  const [client, css] = await Promise.all([
    readFile(paths.client, 'utf8'), readFile(paths.css, 'utf8')
  ]);
  for (const control of ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE']) assert.match(client, new RegExp(control));
  assert.match(client, /requestPointerLock/);
  assert.match(client, /function requestFlightPointerLock/);
  assert.match(client, /function enterImmersiveMode/);
  assert.match(client, /function exitImmersiveMode/);
  assert.match(client, /requestFullscreen/);
  assert.match(client, /fullscreenchange/);
  assert.match(client, /direkte Zielklicks bleiben aktiv/);
  assert.match(client, /state\.autopilot/);
  assert.match(client, /function pickTargetAt/);
  assert.match(client, /crosshair \? innerWidth \/ 2 : event\.clientX/);
  assert.match(client, /Ziel erfasst:/);
  assert.match(client, /function buildCinematicField/);
  assert.match(client, /function drawCinematicStructures/);
  assert.match(client, /function drawGalaxyBody/);
  assert.match(client, /function drawStarBody/);
  assert.match(client, /function drawPlanetBody/);
  assert.match(client, /function frameFirstResolvedGalaxy/);
  assert.match(client, /function createNebulaTexture/);
  assert.match(client, /evidenceConfidence\(data, 'galaxy_candidate'\)/);
  assert.match(client, /evidenceConfidence\(data, 'nebula_candidate'\)/);
  assert.match(client, /SUBQG-AUFGELÖST/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /body\.immersive \.topbar/);
});

test('local viewer server restricts files to viewer and source modules', async () => {
  const server = await readFile(paths.server, 'utf8');
  assert.match(server, /allowedRoots = \[resolve\(repositoryRoot, 'viewer'\), resolve\(repositoryRoot, 'src'\)\]/);
  assert.match(server, /if \(!isAllowed\(filePath\)\)/);
  assert.match(server, /Cross-Origin-Opener-Policy/);
});
