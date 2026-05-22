// open-studs configurator — static Three.js viewer plus exportable OpenSCAD
// configs for generating real STLs.
//
// Coordinate convention follows the OpenSCAD source:
//   X = band length        (0 to circumference)
//   Y = band width         (0 to width)
//   Z = band thickness     (0 to thickness; layer N at z = N x 0.2 mm)

import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

const LAYER_HEIGHT = 0.2;
const VIEW_X_OFFSET = 24;

// --- DOM hooks --------------------------------------------------------------

const canvas = document.getElementById('viewer');
const presetSel = document.getElementById('preset');
const colorBaseEl = document.getElementById('color-base');
const colorTopEl = document.getElementById('color-top');
const swapLayerEl = document.getElementById('swap-layer');
const swapLayerDisplay = document.getElementById('swap-layer-display');
const presetCaption = document.getElementById('preset-caption');
const stageButtons = [...document.querySelectorAll('[data-view-stage]')];
const tabButtons = [...document.querySelectorAll('[data-config-tab]')];
const tabPanels = [...document.querySelectorAll('[data-config-panel]')];
const summaryBand = document.getElementById('summary-band');
const summarySurface = document.getElementById('summary-surface');
const summaryLatch = document.getElementById('summary-latch');
const sourceOutput = document.getElementById('source-output');
const generateSourceBtn = document.getElementById('generate-source');
const downloadJsonBtn = document.getElementById('download-json');
const downloadScadBtn = document.getElementById('download-scad');

const controls = {
  name: document.getElementById('config-name'),
  circumference: document.getElementById('band-circumference'),
  width: document.getElementById('band-width'),
  thickness: document.getElementById('band-thickness'),
  flexRelief: document.getElementById('band-flex-relief'),
  reliefPitch: document.getElementById('band-relief-pitch'),
  reliefWidth: document.getElementById('band-relief-width'),
  mode: document.getElementById('surface-mode'),
  stud: document.getElementById('surface-stud'),
  pattern: document.getElementById('surface-pattern'),
  rows: document.getElementById('surface-rows'),
  studSize: document.getElementById('surface-stud-size'),
  tipRadius: document.getElementById('surface-tip-radius'),
  studSpacing: document.getElementById('surface-stud-spacing'),
  latchType: document.getElementById('latch-type'),
  clearance: document.getElementById('latch-clearance'),
  exportStage: document.getElementById('export-stage'),
  testLength: document.getElementById('export-test-length'),
};

const valueLabels = {
  circumference: document.querySelector('[data-value-for="circumference"]'),
  width: document.querySelector('[data-value-for="width"]'),
  thickness: document.querySelector('[data-value-for="thickness"]'),
  reliefPitch: document.querySelector('[data-value-for="reliefPitch"]'),
  reliefWidth: document.querySelector('[data-value-for="reliefWidth"]'),
  rows: document.querySelector('[data-value-for="rows"]'),
  studSize: document.querySelector('[data-value-for="studSize"]'),
  tipRadius: document.querySelector('[data-value-for="tipRadius"]'),
  studSpacing: document.querySelector('[data-value-for="studSpacing"]'),
  clearance: document.querySelector('[data-value-for="clearance"]'),
  testLength: document.querySelector('[data-value-for="testLength"]'),
};

// --- Three.js scene ---------------------------------------------------------

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0c10);

const camera = new THREE.PerspectiveCamera(
  35, window.innerWidth / window.innerHeight, 1, 1000
);
camera.position.set(0, 30, 130);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
keyLight.position.set(50, 100, 50);
scene.add(keyLight);

// --- shader ----------------------------------------------------------------

const uniforms = {
  uCircum:    { value: 180 },
  uWristR:    { value: 180 / (2 * Math.PI) },
  uBandWidth: { value: 22 },
  uSwapZ:     { value: 7 * LAYER_HEIGHT },
  uViewStage: { value: 1.0 },
  uColorBase: { value: new THREE.Color(0x1a1a1a) },
  uColorTop:  { value: new THREE.Color(0xcc1f1f) },
};

const vertexShader = /* glsl */ `
  uniform float uCircum;
  uniform float uWristR;
  uniform float uBandWidth;
  uniform float uViewStage;

  varying float vFlatZ;
  varying vec3 vBentNormal;

  void main() {
    vFlatZ = position.z;

    float halfCirc = uCircum * 0.5;
    float angle = (position.x - halfCirc) / uCircum * 6.28318530718;
    float r = uWristR + position.z;

    vec3 flatPos = vec3(
      position.x - halfCirc,
      position.y - uBandWidth * 0.5,
      position.z
    );

    vec3 bent = vec3(
      r * sin(angle),
      position.y - uBandWidth * 0.5,
      r * cos(angle)
    );

    mat3 bendRot = mat3(
       cos(angle), 0.0, -sin(angle),
       0.0,        1.0,  0.0,
       sin(angle), 0.0,  cos(angle)
    );
    vec3 bentNormal = normalize(bendRot * normal);
    vBentNormal = normalize(mix(normal, bentNormal, uViewStage));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(mix(flatPos, bent, uViewStage), 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorBase;
  uniform vec3 uColorTop;
  uniform float uSwapZ;

  varying float vFlatZ;
  varying vec3 vBentNormal;

  void main() {
    float t = smoothstep(uSwapZ - 0.1, uSwapZ + 0.1, vFlatZ);
    vec3 base = mix(uColorBase, uColorTop, t);

    vec3 lightDir = normalize(vec3(0.4, 0.8, 0.5));
    float diff = max(dot(vBentNormal, lightDir), 0.0);
    vec3 final = base * (0.35 + diff * 0.65);

    gl_FragColor = vec4(final, 1.0);
  }
`;

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader,
  fragmentShader,
  side: THREE.DoubleSide,
});

// --- config state -----------------------------------------------------------

const loader = new STLLoader();
let mesh = null;
let presets = [];
let currentConfig = null;
let selectedPreset = null;
let viewStage = 'wrist';
let sourceDirty = false;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function presetBand(preset) {
  return preset.band ?? {
    circumference: preset.circumference,
    width: preset.width,
    thickness: preset.thickness,
    corner: 4,
    flexRelief: 'none',
  };
}

function presetSurface(preset) {
  return preset.surface ?? {
    mode: preset.mode ?? 'integral',
    stud: preset.stud_module ?? preset.stud ?? 'pyramid',
    pattern: preset.stud_pattern ?? preset.pattern ?? 'single_row',
    rows: preset.stud_rows ?? preset.rows ?? 1,
    studSize: preset.stud_size ?? preset.studSize ?? 6,
    tipRadius: preset.tip_radius ?? preset.tipRadius ?? 0.4,
    studSpacing: preset.stud_spacing ?? preset.studSpacing ?? null,
  };
}

function presetLatch(preset) {
  return preset.latch && typeof preset.latch === 'object'
    ? preset.latch
    : { type: preset.latch ?? 'buckle', clearance: 25 };
}

function presetExport(preset) {
  return preset.export ?? {
    stage: 'print_flat',
    testLength: 70,
    stl: preset.stl,
  };
}

function presetColors(preset) {
  return preset.colors ?? {
    base: preset.colorBase ?? '#1a1a1a',
    top: preset.colorTop ?? '#cc1f1f',
  };
}

function configFromPreset(preset) {
  const band = presetBand(preset);
  const surface = presetSurface(preset);
  const latch = presetLatch(preset);
  const exportCfg = presetExport(preset);

  return {
    schemaVersion: 1,
    name: preset.name ?? 'custom_bracelet',
    label: preset.label ?? 'Custom Bracelet',
    band: {
      circumference: band.circumference ?? 180,
      width: band.width ?? 22,
      thickness: band.thickness ?? 3,
      corner: band.corner ?? 4,
      flexRelief: band.flexRelief ?? 'none',
      reliefPitch: band.reliefPitch ?? 10,
      reliefWidth: band.reliefWidth ?? 1.2,
    },
    surface: {
      mode: surface.mode ?? 'integral',
      stud: surface.stud ?? 'pyramid',
      pattern: surface.pattern ?? 'single_row',
      rows: surface.rows ?? 1,
      studSize: surface.studSize ?? 6,
      tipRadius: surface.tipRadius ?? 0.4,
      studSpacing: surface.studSpacing ?? null,
    },
    latch: {
      type: latch.type ?? 'buckle',
      clearance: latch.clearance ?? 25,
    },
    export: {
      stage: exportCfg.stage ?? 'print_flat',
      testLength: exportCfg.testLength ?? 70,
      stl: exportCfg.stl,
    },
    colors: presetColors(preset),
  };
}

function numberValue(control) {
  return Number(control.value);
}

function configFromControls() {
  const spacing = numberValue(controls.studSpacing);

  return {
    ...clone(currentConfig ?? configFromPreset({})),
    name: controls.name.value || 'custom_bracelet',
    label: controls.name.value || 'Custom Bracelet',
    band: {
      circumference: numberValue(controls.circumference),
      width: numberValue(controls.width),
      thickness: numberValue(controls.thickness),
      corner: currentConfig?.band?.corner ?? 4,
      flexRelief: controls.flexRelief.value,
      reliefPitch: numberValue(controls.reliefPitch),
      reliefWidth: numberValue(controls.reliefWidth),
    },
    surface: {
      mode: controls.mode.value,
      stud: controls.stud.value,
      pattern: controls.pattern.value,
      rows: numberValue(controls.rows),
      studSize: numberValue(controls.studSize),
      tipRadius: numberValue(controls.tipRadius),
      studSpacing: spacing === 0 ? null : spacing,
    },
    latch: {
      type: controls.latchType.value,
      clearance: numberValue(controls.clearance),
    },
    export: {
      stage: controls.exportStage.value,
      testLength: numberValue(controls.testLength),
      stl: currentConfig?.export?.stl,
    },
    colors: {
      base: colorBaseEl.value,
      top: colorTopEl.value,
    },
  };
}

function applyConfigToControls(config) {
  controls.name.value = config.name;
  controls.circumference.value = config.band.circumference;
  controls.width.value = config.band.width;
  controls.thickness.value = config.band.thickness;
  controls.flexRelief.value = config.band.flexRelief;
  controls.reliefPitch.value = config.band.reliefPitch;
  controls.reliefWidth.value = config.band.reliefWidth;
  controls.mode.value = config.surface.mode;
  controls.stud.value = config.surface.stud;
  controls.pattern.value = config.surface.pattern;
  controls.rows.value = config.surface.rows;
  controls.studSize.value = config.surface.studSize;
  controls.tipRadius.value = config.surface.tipRadius;
  controls.studSpacing.value = config.surface.studSpacing ?? 0;
  controls.latchType.value = config.latch.type;
  controls.clearance.value = config.latch.clearance;
  controls.exportStage.value = config.export.stage;
  controls.testLength.value = config.export.testLength;
  colorBaseEl.value = config.colors.base;
  colorTopEl.value = config.colors.top;
}

function labelize(value) {
  return String(value).replaceAll('_', ' ');
}

function isCompactViewport() {
  return window.innerWidth < 700;
}

function positionMesh() {
  if (!mesh) return;
  mesh.position.x = isCompactViewport() ? 0 : VIEW_X_OFFSET;
  mesh.position.y = isCompactViewport() ? 48 : 0;
}

function formatMm(value) {
  return `${Number(value).toFixed(Number.isInteger(Number(value)) ? 0 : 1)} mm`;
}

function updateValueLabels(config) {
  valueLabels.circumference.textContent = formatMm(config.band.circumference);
  valueLabels.width.textContent = formatMm(config.band.width);
  valueLabels.thickness.textContent = formatMm(config.band.thickness);
  valueLabels.reliefPitch.textContent = formatMm(config.band.reliefPitch);
  valueLabels.reliefWidth.textContent = formatMm(config.band.reliefWidth);
  valueLabels.rows.textContent = String(config.surface.rows);
  valueLabels.studSize.textContent = formatMm(config.surface.studSize);
  valueLabels.tipRadius.textContent = formatMm(config.surface.tipRadius);
  valueLabels.studSpacing.textContent = config.surface.studSpacing ? formatMm(config.surface.studSpacing) : 'Auto';
  valueLabels.clearance.textContent = formatMm(config.latch.clearance);
  valueLabels.testLength.textContent = formatMm(config.export.testLength);
}

function updateSummary(config) {
  summaryBand.textContent =
    `${config.band.circumference} x ${config.band.width} x ${config.band.thickness} mm` +
    (config.band.flexRelief !== 'none' ? `, ${labelize(config.band.flexRelief)}` : '');
  summarySurface.textContent =
    `${labelize(config.surface.stud)} / ${labelize(config.surface.pattern)} / ` +
    `${config.surface.rows} row${config.surface.rows === 1 ? '' : 's'}`;
  summaryLatch.textContent = labelize(config.latch.type);
}

function updateUniforms(config) {
  uniforms.uCircum.value = config.band.circumference;
  uniforms.uWristR.value = config.band.circumference / (2 * Math.PI);
  uniforms.uBandWidth.value = config.band.width;
  uniforms.uColorBase.value.set(config.colors.base);
  uniforms.uColorTop.value.set(config.colors.top);

  const maxLayers = Math.max(1, Math.round(config.band.thickness / LAYER_HEIGHT));
  swapLayerEl.max = maxLayers;
  if (Number(swapLayerEl.value) > maxLayers) {
    swapLayerEl.value = maxLayers;
  }
  swapLayerDisplay.textContent = swapLayerEl.value;
  uniforms.uSwapZ.value = Number(swapLayerEl.value) * LAYER_HEIGHT;
}

function scadString(value) {
  return `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function scadNumber(value) {
  return Number(value).toFixed(3).replace(/\.?0+$/, '');
}

function scadOptionalNumber(value) {
  return value === null || value === undefined ? 'undef' : scadNumber(value);
}

function generateScad(config) {
  return `// Generated by open-studs configurator.
// Save near bracelet.scad or adjust the use path.

use <bracelet.scad>

bracelet_from_config(
    band = band_config(
        circumference = ${scadNumber(config.band.circumference)},
        width = ${scadNumber(config.band.width)},
        thickness = ${scadNumber(config.band.thickness)},
        corner = ${scadNumber(config.band.corner)},
        flex_relief = ${scadString(config.band.flexRelief)},
        relief_pitch = ${scadNumber(config.band.reliefPitch)},
        relief_width = ${scadNumber(config.band.reliefWidth)}
    ),
    surface = surface_config(
        mode = ${scadString(config.surface.mode)},
        stud_module = ${scadString(config.surface.stud)},
        stud_pattern = ${scadString(config.surface.pattern)},
        stud_rows = ${scadNumber(config.surface.rows)},
        stud_size = ${scadNumber(config.surface.studSize)},
        tip_radius = ${scadNumber(config.surface.tipRadius)},
        stud_spacing = ${scadOptionalNumber(config.surface.studSpacing)}
    ),
    latch = latch_config(
        type = ${scadString(config.latch.type)},
        clearance = ${scadNumber(config.latch.clearance)}
    ),
    export = export_config(
        stage = ${scadString(config.export.stage)},
        test_length = ${scadNumber(config.export.testLength)}
    )
);
`;
}

function exportConfig(config) {
  const clean = clone(config);
  delete clean.export.stl;
  return clean;
}

function setSource(config) {
  sourceOutput.value = generateScad(config);
  sourceDirty = false;
}

function syncFromControls({ refreshSource = true } = {}) {
  currentConfig = configFromControls();
  updateSummary(currentConfig);
  updateValueLabels(currentConfig);
  updateUniforms(currentConfig);
  presetCaption.textContent = selectedPreset
    ? `${selectedPreset.label} preview / custom source`
    : 'Custom source';

  sourceDirty = true;
  if (refreshSource) {
    setSource(currentConfig);
  }
}

function setActiveTab(tabName) {
  for (const button of tabButtons) {
    button.classList.toggle('active', button.dataset.configTab === tabName);
  }
  for (const panel of tabPanels) {
    panel.classList.toggle('active', panel.dataset.configPanel === tabName);
  }
}

function setViewStage(stage) {
  viewStage = stage;
  uniforms.uViewStage.value = stage === 'flat' ? 0.0 : 1.0;

  for (const button of stageButtons) {
    button.classList.toggle('active', button.dataset.viewStage === stage);
  }

  if (stage === 'flat') {
    camera.position.set(0, -90, isCompactViewport() ? 360 : 270);
  } else {
    camera.position.set(0, 36, isCompactViewport() ? 260 : 180);
  }
  camera.lookAt(0, 0, 0);
  positionMesh();
}

function filenameBase(config) {
  return `${config.name || 'custom_bracelet'}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'custom_bracelet';
}

function downloadText(filename, mimeType, text) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function loadPresetStl(preset, config) {
  const exportCfg = presetExport(preset);
  if (!exportCfg.stl) return;

  try {
    const geometry = await new Promise((resolve, reject) => {
      loader.load(exportCfg.stl, resolve, undefined, reject);
    });
    if (!geometry.attributes.normal) geometry.computeVertexNormals();

    if (mesh) {
      scene.remove(mesh);
      mesh.geometry.dispose();
    }
    mesh = new THREE.Mesh(geometry, material);
    positionMesh();
    mesh.frustumCulled = false;
    scene.add(mesh);
    currentConfig.export.stl = exportCfg.stl;
    presetCaption.textContent = config.caption ?? preset.caption ?? preset.label;
  } catch (err) {
    console.error(`Failed to load STL ${exportCfg.stl}:`, err);
    presetCaption.textContent = `${preset.label} STL unavailable`;
  }
}

async function selectPreset(name) {
  const preset = presets.find(p => p.name === name);
  if (!preset) return;

  selectedPreset = preset;
  currentConfig = configFromPreset(preset);
  applyConfigToControls(currentConfig);
  updateSummary(currentConfig);
  updateValueLabels(currentConfig);
  updateUniforms(currentConfig);
  setSource(currentConfig);

  const defaultLayer = Math.round(Math.round(currentConfig.band.thickness / LAYER_HEIGHT) * 0.5);
  swapLayerEl.value = defaultLayer;
  swapLayerDisplay.textContent = defaultLayer;
  uniforms.uSwapZ.value = defaultLayer * LAYER_HEIGHT;

  await loadPresetStl(preset, currentConfig);
}

async function loadPresets() {
  const res = await fetch('presets.json');
  presets = await res.json();
  for (const p of presets) {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.label;
    presetSel.appendChild(opt);
  }
  if (presets.length) await selectPreset(presets[0].name);
}

// --- UI handlers ------------------------------------------------------------

presetSel.addEventListener('change', e => selectPreset(e.target.value));

for (const button of tabButtons) {
  button.addEventListener('click', () => setActiveTab(button.dataset.configTab));
}

for (const button of stageButtons) {
  button.addEventListener('click', () => setViewStage(button.dataset.viewStage));
}

for (const control of Object.values(controls)) {
  control.addEventListener('input', () => syncFromControls());
  control.addEventListener('change', () => syncFromControls());
}

colorBaseEl.addEventListener('input', () => syncFromControls());
colorTopEl.addEventListener('input', () => syncFromControls());

swapLayerEl.addEventListener('input', e => {
  const layer = Number(e.target.value);
  swapLayerDisplay.textContent = layer;
  uniforms.uSwapZ.value = layer * LAYER_HEIGHT;
});

generateSourceBtn.addEventListener('click', () => {
  syncFromControls({ refreshSource: true });
});

downloadJsonBtn.addEventListener('click', () => {
  if (sourceDirty) syncFromControls({ refreshSource: true });
  const base = filenameBase(currentConfig);
  downloadText(
    `${base}.json`,
    'application/json',
    `${JSON.stringify(exportConfig(currentConfig), null, 2)}\n`
  );
});

downloadScadBtn.addEventListener('click', () => {
  if (sourceDirty) syncFromControls({ refreshSource: true });
  downloadText(`${filenameBase(currentConfig)}.scad`, 'text/plain', sourceOutput.value);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  setViewStage(viewStage);
});

// --- animation loop ---------------------------------------------------------

function animate() {
  requestAnimationFrame(animate);
  if (mesh && viewStage === 'wrist') {
    mesh.rotation.y += 0.005;
  } else if (mesh) {
    mesh.rotation.set(0, 0, 0);
  }
  renderer.render(scene, camera);
}

loadPresets();
setActiveTab('band');
setViewStage(viewStage);
animate();
