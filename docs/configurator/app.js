// open-studs configurator — static Three.js viewer for baked OpenSCAD STLs.
//
// Coordinate convention follows the OpenSCAD source:
//   X = band length        (0 to circumference)
//   Y = band width         (0 to width)
//   Z = band thickness     (0 to thickness; layer N at z = N × 0.2 mm)
//
// The vertex shader wraps the flat band around the world Y axis so X
// becomes angle and Z becomes radial distance from the wrist axis. A
// filament swap at layer N (= z = N × 0.2) shows up as a radial swap
// between the inner-wrist surface and the outer visible surface.

import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

const LAYER_HEIGHT = 0.2;  // mm per print layer
const VIEW_X_OFFSET = 24;  // keeps the model clear of the control panel

// --- DOM hooks --------------------------------------------------------------

const canvas = document.getElementById('viewer');
const presetSel = document.getElementById('preset');
const colorBaseEl = document.getElementById('color-base');
const colorTopEl = document.getElementById('color-top');
const swapLayerEl = document.getElementById('swap-layer');
const swapLayerDisplay = document.getElementById('swap-layer-display');
const presetCaption = document.getElementById('preset-caption');
const stageButtons = [...document.querySelectorAll('[data-view-stage]')];
const summaryBand = document.getElementById('summary-band');
const summarySurface = document.getElementById('summary-surface');
const summaryLatch = document.getElementById('summary-latch');

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

// gentle accent lights, mostly for color richness; main lighting is in shader
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
keyLight.position.set(50, 100, 50);
scene.add(keyLight);

// --- shader -----------------------------------------------------------------

const uniforms = {
  uCircum:    { value: 180 },
  uWristR:    { value: 180 / (2 * Math.PI) },  // inner radius matches preset circumference
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

    // wrap X around the world Y axis; center the band on angle = 0 at x = circumference/2
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

    // rotate the original normal by the bend (rotation around Y by angle)
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
    // smooth color transition across a single layer's worth of z
    float t = smoothstep(uSwapZ - 0.1, uSwapZ + 0.1, vFlatZ);
    vec3 base = mix(uColorBase, uColorTop, t);

    // simple Lambert + ambient
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

// --- preset loading ---------------------------------------------------------

const loader = new STLLoader();
let mesh = null;
let presets = [];
let viewStage = 'wrist';

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
    stl: preset.stl,
  };
}

function presetColors(preset) {
  return preset.colors ?? {
    base: preset.colorBase,
    top: preset.colorTop,
  };
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

function updateSummary(preset) {
  const band = presetBand(preset);
  const surface = presetSurface(preset);
  const latch = presetLatch(preset);

  summaryBand.textContent =
    `${band.circumference} x ${band.width} x ${band.thickness} mm` +
    (band.flexRelief && band.flexRelief !== 'none' ? `, ${labelize(band.flexRelief)}` : '');
  summarySurface.textContent =
    `${labelize(surface.stud)} / ${labelize(surface.pattern)} / ${surface.rows} row${surface.rows === 1 ? '' : 's'}`;
  summaryLatch.textContent = labelize(latch.type);
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

async function loadPresets() {
  const res = await fetch('presets.json');
  presets = await res.json();
  for (const p of presets) {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.label;
    presetSel.appendChild(opt);
  }
  // load the first preset by default
  if (presets.length) await selectPreset(presets[0].name);
}

async function selectPreset(name) {
  const preset = presets.find(p => p.name === name);
  if (!preset) return;

  const band = presetBand(preset);
  const exportCfg = presetExport(preset);
  const colors = presetColors(preset);

  presetCaption.textContent = preset.caption || '';
  updateSummary(preset);
  colorBaseEl.value = colors.base;
  colorTopEl.value = colors.top;

  uniforms.uCircum.value = band.circumference;
  uniforms.uWristR.value = band.circumference / (2 * Math.PI);
  uniforms.uBandWidth.value = band.width;
  uniforms.uColorBase.value.set(colors.base);
  uniforms.uColorTop.value.set(colors.top);

  // re-cap the layer slider to this preset's thickness
  const maxLayers = Math.round(band.thickness / LAYER_HEIGHT);
  swapLayerEl.max = maxLayers;
  const defaultLayer = Math.round(maxLayers * 0.5);
  swapLayerEl.value = defaultLayer;
  swapLayerDisplay.textContent = defaultLayer;
  uniforms.uSwapZ.value = defaultLayer * LAYER_HEIGHT;

  // load STL
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
  } catch (err) {
    console.error(`Failed to load STL ${exportCfg.stl}:`, err);
    presetCaption.textContent =
      `STL not yet rendered for "${preset.label}". CI bakes presets on push; check back in a minute.`;
  }
}

// --- UI handlers ------------------------------------------------------------

presetSel.addEventListener('change', e => selectPreset(e.target.value));

for (const button of stageButtons) {
  button.addEventListener('click', () => setViewStage(button.dataset.viewStage));
}

colorBaseEl.addEventListener('input', e => {
  uniforms.uColorBase.value.set(e.target.value);
});

colorTopEl.addEventListener('input', e => {
  uniforms.uColorTop.value.set(e.target.value);
});

swapLayerEl.addEventListener('input', e => {
  const layer = Number(e.target.value);
  swapLayerDisplay.textContent = layer;
  uniforms.uSwapZ.value = layer * LAYER_HEIGHT;
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
setViewStage(viewStage);
animate();
