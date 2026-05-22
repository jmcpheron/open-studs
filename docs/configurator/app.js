// open-studs configurator — static Three.js viewer plus exportable OpenSCAD
// configs for generating real STLs.
//
// Coordinate convention follows the OpenSCAD source:
//   X = band length        (0 to circumference)
//   Y = band width         (0 to width)
//   Z = band thickness     (0 to thickness; layer N at z = N x 0.2 mm)

import * as THREE from 'three';

const LAYER_HEIGHT = 0.2;
const VIEW_X_OFFSET = 30;

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

let mesh = null;
let presets = [];
let currentConfig = null;
let selectedPreset = null;
let viewStage = 'flat';
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

function disposeObject(object) {
  object.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material && child.material !== material) child.material.dispose();
  });
}

function addGeometry(group, geometry) {
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  const child = new THREE.Mesh(geometry, material);
  child.frustumCulled = false;
  group.add(child);
}

function setPreview(object) {
  if (mesh) {
    scene.remove(mesh);
    disposeObject(mesh);
  }
  mesh = object;
  mesh.frustumCulled = false;
  positionMesh();
  scene.add(mesh);
}

function braceletPreviewLength(config) {
  return config.export.stage === 'latch_only'
    ? config.export.testLength
    : config.band.circumference;
}

function roundedRectShape(length, width, corner) {
  const r = Math.max(0, Math.min(corner, Math.min(length, width) / 2 - 0.01));
  const shape = new THREE.Shape();
  if (r <= 0) {
    shape.moveTo(0, 0);
    shape.lineTo(length, 0);
    shape.lineTo(length, width);
    shape.lineTo(0, width);
    shape.closePath();
    return shape;
  }
  shape.moveTo(r, 0);
  shape.lineTo(length - r, 0);
  shape.absarc(length - r, r, r, -Math.PI / 2, 0, false);
  shape.lineTo(length, width - r);
  shape.absarc(length - r, width - r, r, 0, Math.PI / 2, false);
  shape.lineTo(r, width);
  shape.absarc(r, width - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(0, r);
  shape.absarc(r, r, r, Math.PI, 3 * Math.PI / 2, false);
  shape.closePath();
  return shape;
}

function bandPreviewGeometry(length, width, thickness, corner) {
  const shape = roundedRectShape(length, width, corner ?? 4);
  // 64 curve segments along the length gives smooth bending when the wrist
  // shader bends the band into a ring.
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 12,
  });
  return geometry;
}

function bandReliefEnabled(flexRelief, thickness) {
  if (flexRelief === 'inside_slots' || flexRelief === 'slots') return true;
  if (flexRelief === 'auto') return thickness >= 3.6;
  return false;
}

function addBandReliefSlots(group, config, length) {
  if (!bandReliefEnabled(config.band.flexRelief, config.band.thickness)) return;
  const { thickness, width, reliefPitch, reliefWidth } = config.band;
  const reliefMargin = 25; // matches OPEN_STUDS_LATCH_MARGIN
  const edgeMargin = 2;
  const slotWidthY = Math.max(0, width - 2 * edgeMargin);
  if (slotWidthY <= 0) return;
  const depth = Math.max(0, Math.min(thickness - 0.6, thickness - 1.2));
  if (depth <= 0) return;

  // Physically, relief slots are cut from the underside. We render them as
  // solid boxes that overlap the band on its underside — they're hidden from
  // a pure top-down view but become visible when the camera is angled to see
  // the band's bottom edge. They also appear as darker low-Z bands in the
  // shader's height-based color swap, since they sit at low z values.
  for (let x = reliefMargin; x <= length - reliefMargin + 0.001; x += reliefPitch) {
    const slot = new THREE.BoxGeometry(reliefWidth, slotWidthY, depth);
    slot.translate(x, edgeMargin + slotWidthY / 2, depth / 2 - 0.02);
    addGeometry(group, slot);
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Matches the auto-fit policy in patterns/single_row.scad: pick the spacing
// closest to 12 mm that distributes studs evenly between the two latch margins.
function autoStudSpacing(config, length) {
  if (config.surface.studSpacing) return config.surface.studSpacing;
  const clearance = clamp(config.latch.clearance, 8, length * 0.4);
  const usable = Math.max(12, length - clearance * 2);
  const target = 12;
  const slots = Math.max(1, Math.floor(usable / target));
  return usable / slots;
}

function rowOffsets(width, pattern, rows) {
  // Pattern selection wins over rows for the multi-row patterns; single_row
  // always renders one centerline row regardless of `rows`.
  if (pattern === 'single_row' || rows <= 1) return [width * 0.5];
  const inset = 0.28;
  if (rows === 2 || pattern === 'double_row' || pattern === 'staggered') {
    return [width * (0.5 - inset), width * (0.5 + inset)];
  }
  return [width * 0.24, width * 0.5, width * 0.76];
}

function studPositions(config, length) {
  const width = config.band.width;
  const clearance = clamp(config.latch.clearance, 8, length * 0.4);
  const spacing = autoStudSpacing(config, length);
  const usable = Math.max(0, length - clearance * 2);
  const count = Math.floor(usable / spacing) + 1;

  const rows = rowOffsets(width, config.surface.pattern, config.surface.rows);
  const positions = [];

  for (const [rowIndex, y] of rows.entries()) {
    const stagger = config.surface.pattern === 'staggered' && rowIndex % 2 === 1;
    const rowCount = stagger ? Math.max(1, count - 1) : count;
    const xStart = clearance + (stagger ? spacing / 2 : 0);
    for (let i = 0; i < rowCount; i += 1) {
      positions.push([xStart + i * spacing, y]);
    }
  }

  return positions;
}

// Geometry helpers. All studs put their base at z = thickness (the band's top
// face) and extend in +Z. Dimensions follow the OpenSCAD source in studs/*.scad.

function extrudeShape(shape, height, x, y, z) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 24,
  });
  geometry.translate(x, y, z);
  return geometry;
}

// Three.js CylinderGeometry has its axis along +Y by default. Rotating X by
// π/2 swings the axis to +Z; the base then sits at z=0, top at z=height after
// shifting up by height/2.
function prismGeometry(rBottom, rTop, height, sides, x, y, z, rotZ = 0) {
  const geometry = new THREE.CylinderGeometry(rTop, rBottom, height, sides);
  geometry.rotateX(Math.PI / 2);
  if (rotZ) geometry.rotateZ(rotZ);
  geometry.translate(x, y, z + height / 2);
  return geometry;
}

function pyramidShape(size) {
  // 4-sided prism (cylinder $fn=4) where corners sit at ±size/2.
  return { rBase: (size / 2) * Math.SQRT2, sides: 4, rotZ: Math.PI / 4 };
}

function starShape(size, tipRadius) {
  const outer = size / 2;
  const inner = outer * 0.42;
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  }
  shape.closePath();
  // tipRadius can't be replicated as a true offset without a 2D-CSG library,
  // but pulling the outer points slightly inward softens the tips visually.
  if (tipRadius > 0) {
    const ease = Math.min(1, tipRadius / (outer - inner));
    // rebuild with eased outer radius
    const shape2 = new THREE.Shape();
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? outer - tipRadius * 0.6 * ease : inner;
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) shape2.moveTo(px, py);
      else shape2.lineTo(px, py);
    }
    shape2.closePath();
    return shape2;
  }
  return shape;
}

function heartShape(size) {
  // SCAD recipe: two lobe circles at (±size/4, size/4) of radius size/4, plus
  // a triangle from (-size/2, size/4) to (size/2, size/4) to (0, -size/2).
  const lobeR = size / 4;
  const lobeY = size / 4;
  const lobeX = size / 4;
  const apex = -size / 2;

  // Trace the union as a single closed path: outer-left lobe arc, dip into the
  // cleavage, outer-right lobe arc, then down the two triangle sides.
  const shape = new THREE.Shape();
  // Start at the cleavage top (between the two lobes).
  shape.moveTo(0, lobeY + lobeR * Math.sin(Math.PI / 4)); // a bit above center
  // Top of right lobe, arcing around clockwise.
  shape.absarc(lobeX, lobeY, lobeR, Math.PI / 4, 0, true);
  // Down the right side of the lobe to the lobe's bottom-right edge (y = lobeY).
  shape.absarc(lobeX, lobeY, lobeR, 0, -Math.PI / 2, true);
  // Diagonal down to the apex.
  shape.lineTo(0, apex);
  // Diagonal back up to the left lobe's bottom-left edge.
  shape.lineTo(-lobeX - lobeR, lobeY);
  // Around the bottom and left of the left lobe back to the cleavage.
  shape.absarc(-lobeX, lobeY, lobeR, Math.PI, 3 * Math.PI / 4, true);
  shape.closePath();
  return shape;
}

function lightningShape(size) {
  const s = size / 2;
  const points = [
    [-0.15 * s,  1.00 * s],
    [ 0.55 * s,  0.10 * s],
    [ 0.05 * s,  0.10 * s],
    [ 0.45 * s, -1.00 * s],
    [-0.35 * s, -0.10 * s],
    [ 0.10 * s, -0.10 * s],
  ];
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (const p of points.slice(1)) shape.lineTo(p[0], p[1]);
  shape.closePath();
  return shape;
}

function washerShape(size) {
  const outer = size / 2;
  const inner = size * 0.30;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return shape;
}

function studGeometry(stud, size, thickness, x, y, tipRadius) {
  const topZ = thickness;
  let geometry;

  switch (stud) {
    case 'pyramid': {
      const { rBase, sides, rotZ } = pyramidShape(size);
      const rTop = tipRadius > 0 ? tipRadius * Math.SQRT2 : 0.001;
      return prismGeometry(rBase, rTop, size, sides, x, y, topZ, rotZ);
    }
    case 'flat_pyramid': {
      const { rBase, sides, rotZ } = pyramidShape(size);
      const rTop = tipRadius > 0 ? tipRadius * Math.SQRT2 : 0.001;
      return prismGeometry(rBase, rTop, size * 0.4, sides, x, y, topZ, rotZ);
    }
    case 'dome':
      geometry = new THREE.SphereGeometry(
        size / 2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2,
      );
      // Default Three sphere: theta opens from +Y axis. We want the dome's
      // pole pointing +Z, so rotate -π/2 around X.
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(x, y, topZ);
      return geometry;
    case 'cone_spike': {
      const rTop = Math.max(tipRadius, 0.001);
      return prismGeometry(size / 2, rTop, size * 1.2, 32, x, y, topZ);
    }
    case 'long_spike': {
      const rTop = Math.max(tipRadius, 0.001);
      return prismGeometry(size / 2, rTop, size * 2.5, 32, x, y, topZ);
    }
    case 'diamond': {
      // Bipyramid: two 4-sided pyramids base-to-base. Build with LatheGeometry
      // for a clean axisymmetric profile, then rotateZ to align corners.
      const h = size * 1.4;
      const baseR = (size / 2) * Math.SQRT2;
      const tipR = tipRadius > 0 ? tipRadius * Math.SQRT2 : 0.001;
      const profile = [
        new THREE.Vector2(tipR, 0),
        new THREE.Vector2(baseR, h / 2),
        new THREE.Vector2(tipR, h),
      ];
      geometry = new THREE.LatheGeometry(profile, 4, 0, Math.PI * 2);
      geometry.rotateZ(Math.PI / 4);
      // Lathe axis is +Y; we want +Z.
      geometry.rotateX(Math.PI / 2);
      geometry.translate(x, y, topZ);
      return geometry;
    }
    case 'screw_head': {
      // Squat cylinder. Slot is faked as a thin dark notch — but since we
      // use one shared shader, the slot reads better as a small negative
      // box that doesn't actually subtract. For preview clarity, render
      // the head solid; the user can tell it's a screw head from context.
      const h = size * 0.25;
      const head = prismGeometry(size / 2, size / 2, h, 32, x, y, topZ);
      // No CSG; return just the head. The flat top reads as a screw head.
      return head;
    }
    case 'rivet': {
      // Short cylinder body (0.6 * h) capped by a flattened hemisphere (0.4*h).
      const h = size * 0.4;
      const cylH = h * 0.6;
      const domeH = h * 0.4;
      const body = prismGeometry(size / 2, size / 2, cylH, 32, x, y, topZ);
      const dome = new THREE.SphereGeometry(
        size / 2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2,
      );
      dome.rotateX(-Math.PI / 2);
      // Scale Z to flatten the hemisphere to the requested dome height.
      dome.scale(1, 1, domeH / (size / 2));
      dome.translate(x, y, topZ + cylH);
      // Merge: just return as a group via a small helper. Simpler: return
      // both as a BufferGeometry merge isn't built in, so attach the dome
      // as a second mesh in addStudPreview. For now, return the body and
      // expect the caller to handle multi-piece studs.
      return { multi: [body, dome] };
    }
    case 'hex_bolt': {
      const r = size / Math.sqrt(3);
      const h = size * 0.5;
      // Hex with flats on ±x: cylinder $fn=6 rotated by 30°.
      return prismGeometry(r, r, h, 6, x, y, topZ, Math.PI / 6);
    }
    case 'washer':
      return extrudeShape(washerShape(size), size * 0.25, x, y, topZ);
    case 'star':
      return extrudeShape(starShape(size, tipRadius), size * 0.35, x, y, topZ);
    case 'heart':
      return extrudeShape(heartShape(size), size * 0.35, x, y, topZ);
    case 'lightning':
      return extrudeShape(lightningShape(size), size * 0.35, x, y, topZ);
    default:
      // Fall back to pyramid.
      return studGeometry('pyramid', size, thickness, x, y, tipRadius);
  }
}

function addStudOrMulti(group, geom) {
  if (geom && geom.multi) {
    for (const piece of geom.multi) addGeometry(group, piece);
  } else if (geom) {
    addGeometry(group, geom);
  }
}

function addStudPreview(group, config, length) {
  if (config.export.stage === 'band_only' || config.export.stage === 'latch_only') return;

  const size = config.surface.studSize;
  const tipRadius = config.surface.tipRadius ?? 0;
  const thickness = config.band.thickness;

  for (const [x, y] of studPositions(config, length)) {
    if (config.surface.mode === 'bare_with_holes') {
      // A tall thin cylinder spanning the band reads as a through-hole.
      const holeD = Math.min(3, size * 0.5);
      const hole = new THREE.CylinderGeometry(holeD / 2, holeD / 2, thickness + 1, 24);
      hole.rotateX(Math.PI / 2);
      hole.translate(x, y, thickness / 2);
      addGeometry(group, hole);
    } else if (config.surface.mode === 'modular') {
      // Socket: a recessed disk with a rim that reads as a press-fit cavity.
      const socketD = size * 0.55;
      const socketH = Math.min(thickness, 1.5);
      // Sunk disk slightly below band top.
      const cavity = new THREE.CylinderGeometry(socketD / 2, socketD / 2, socketH, 24);
      cavity.rotateX(Math.PI / 2);
      cavity.translate(x, y, thickness - socketH / 2);
      addGeometry(group, cavity);
      // Rim ring that reads as the socket opening.
      const rim = washerShape(size * 0.7);
      addGeometry(group, extrudeShape(rim, 0.3, x, y, thickness - 0.05));
    } else {
      addStudOrMulti(group, studGeometry(
        config.surface.stud, size, thickness, x, y, tipRadius,
      ));
    }
  }
}

// --- Latches ---------------------------------------------------------------

function circleHole(cx, cy, r) {
  const p = new THREE.Path();
  p.absarc(cx, cy, r, 0, Math.PI * 2, true);
  return p;
}

function roundedRectHole(x, y, length, width, r) {
  const rr = Math.min(r, Math.min(length, width) / 2 - 0.01);
  const p = new THREE.Path();
  p.moveTo(x + rr, y);
  p.absarc(x + rr, y + rr, rr, -Math.PI / 2, Math.PI, true);
  p.lineTo(x, y + width - rr);
  p.absarc(x + rr, y + width - rr, rr, Math.PI, Math.PI / 2, true);
  p.lineTo(x + length - rr, y + width);
  p.absarc(x + length - rr, y + width - rr, rr, Math.PI / 2, 0, true);
  p.lineTo(x + length, y + rr);
  p.absarc(x + length - rr, y + rr, rr, 0, -Math.PI / 2, true);
  p.closePath();
  return p;
}

function tabShape(length, width, corner, holes) {
  const shape = roundedRectShape(length, width, corner);
  if (holes) for (const h of holes) shape.holes.push(h);
  return shape;
}

function flaredPostGeometry(group, x, y, baseZ, shaftD, shaftH, headR1, headR2, headH, baseD) {
  if (baseD) {
    // Flange disk at base.
    addGeometry(group, prismGeometry(baseD / 2, baseD / 2, 0.6, 28, x, y, baseZ));
  }
  // Shaft.
  addGeometry(group, prismGeometry(shaftD / 2, shaftD / 2, shaftH, 28, x, y, baseZ + (baseD ? 0 : 0)));
  // Flared head.
  addGeometry(group, prismGeometry(headR1, headR2, headH, 28, x, y, baseZ + shaftH));
}

function latch_buckle(group, config, length) {
  const { width, thickness } = config.band;
  // Left: rectangular frame extending into -X by 12mm.
  const frameL = 12;
  const frameW = width + 4;
  const wall = 2.5;
  const outerFrame = roundedRectShape(frameL, frameW, 0);
  // Inner cutout — punched all the way through.
  outerFrame.holes.push(roundedRectHole(wall, wall, frameL - 2 * wall, frameW - 2 * wall, 0));
  addGeometry(group, extrudeShape(outerFrame, thickness, -frameL, -2, 0));
  // Pin running across Y at the center, halfway up the band thickness.
  const pinGeom = new THREE.CylinderGeometry(1.6, 1.6, frameW, 24);
  // CylinderGeometry axis is +Y by default, which is what we want.
  pinGeom.translate(-frameL / 2, -2 + frameW / 2, thickness / 2);
  addGeometry(group, pinGeom);

  // Right: tongue extending +X by 35mm with 5 holes.
  const tongueL = 35;
  const tongueW = width * 0.7;
  const tongueHoles = [];
  for (let i = 0; i < 5; i += 1) {
    tongueHoles.push(circleHole(10 + i * 5, tongueW / 2, 3.5 / 2));
  }
  const tongue = tabShape(tongueL, tongueW, 3, tongueHoles);
  addGeometry(group, extrudeShape(tongue, thickness, length, (width - tongueW) / 2, 0));
}

function latch_snap(group, config, length) {
  const { width, thickness } = config.band;
  const tabL = 14;
  const tabW = width * 0.7;
  const pegD = 4;
  const pegH = 2.5;
  const pegHeadR = 2.6;

  // Left tab extending into -X.
  addGeometry(group, extrudeShape(
    tabShape(tabL, tabW, 3),
    thickness,
    -tabL, (width - tabW) / 2, 0,
  ));
  // Peg on top.
  addGeometry(group, prismGeometry(
    pegD / 2, pegD / 2, pegH * 0.7, 24,
    -tabL * 0.65, width / 2, thickness,
  ));
  addGeometry(group, prismGeometry(
    pegD / 2, pegHeadR, pegH * 0.3, 24,
    -tabL * 0.65, width / 2, thickness + pegH * 0.7,
  ));

  // Right tab extending +X; socket cavity is in the underside (not rendered).
  addGeometry(group, extrudeShape(
    tabShape(tabL, tabW, 3),
    thickness,
    length, (width - tabW) / 2, 0,
  ));
}

function latch_loop_post(group, config, length) {
  const { width, thickness } = config.band;
  // Left: T-post on top of the band at x=0.
  const postD = 5;
  const postH = 7;
  const headR = 4;
  addGeometry(group, prismGeometry(postD / 2, postD / 2, postH - 1.2, 24, 0, width / 2, thickness));
  addGeometry(group, prismGeometry(postD / 2, headR, 1.2, 24, 0, width / 2, thickness + postH - 1.2));

  // Right: loop frame extending +X by 18mm with an inner rounded cutout.
  const frameL = 18;
  const frameW = width * 0.8;
  const innerL = 10;
  const innerW = 8;
  const frameShape = tabShape(frameL, frameW, 3, [
    roundedRectHole((frameL - innerL) / 2, (frameW - innerW) / 2, innerL, innerW, 1.5),
  ]);
  addGeometry(group, extrudeShape(frameShape, thickness, length, (width - frameW) / 2, 0));
}

function latch_keyhole(group, config, length, params) {
  const { width, thickness } = config.band;
  const {
    postInset, shaftD, headD, shaftH, headH, baseD,
    tabL, tabFr, entryD, captureD, throatW, entryX, captureX,
    reliefD, // optional: loop_post_v2 has relief holes
  } = params;

  // Left: mushroom post on top of band, inboard by postInset.
  addGeometry(group, prismGeometry(baseD / 2, baseD / 2, 0.6, 36, postInset, width / 2, thickness));
  addGeometry(group, prismGeometry(shaftD / 2, shaftD / 2, shaftH, 36, postInset, width / 2, thickness));
  addGeometry(group, prismGeometry(shaftD / 2, headD / 2, headH, 36, postInset, width / 2, thickness + shaftH));

  // Right: keyhole tab.
  const tabW = Math.min(width * tabFr, width - 4);
  const cy = tabW / 2; // center of the tab in its own local Y
  // Both holes plus throat (rectangular slot connecting them).
  const holes = [
    circleHole(entryX, cy, entryD / 2),
    circleHole(captureX, cy, captureD / 2),
    roundedRectHole(
      Math.min(entryX, captureX),
      cy - throatW / 2,
      Math.abs(entryX - captureX),
      throatW,
      0.1,
    ),
  ];
  if (reliefD) {
    for (const side of [-1, 1]) {
      holes.push(circleHole(captureX - 3.2, cy + side * (captureD / 2 + 2.5), reliefD / 2));
    }
  }
  const shape = tabShape(tabL, tabW, 3, holes);
  addGeometry(group, extrudeShape(shape, thickness, length, (width - tabW) / 2, 0));
}

function latch_loop_post_v2(group, config, length) {
  return latch_keyhole(group, config, length, {
    postInset: 8,
    shaftD: 4.6, headD: 8.4, shaftH: 3.0, headH: 1.5, baseD: 9.0,
    tabL: 34, tabFr: 0.74,
    entryD: 9.6, captureD: 5.6, throatW: 5.2,
    entryX: 23, captureX: 10.5,
    reliefD: 2.2,
  });
}

function latch_mushroom_keyhole(group, config, length) {
  return latch_keyhole(group, config, length, {
    postInset: 8,
    shaftD: 4.8, headD: 8.2, shaftH: 3.4, headH: 1.6, baseD: 8.8,
    tabL: 36, tabFr: 0.68,
    entryD: 9.4, captureD: 5.4, throatW: 5.1,
    entryX: 25, captureX: 12,
  });
}

function latch_ladder_strap(group, config, length) {
  const { width, thickness } = config.band;
  // Left: low catch block sitting on top of the band, inboard by 8mm.
  const catchL = 5;
  const catchH = 2.4;
  const slotW = 10.8;
  const catchW = Math.min(slotW - 1.0, width - 6);
  const catchShape = roundedRectShape(catchL, catchW, 1.4);
  addGeometry(group, extrudeShape(
    catchShape, catchH,
    8 - catchL / 2, (width - catchW) / 2, thickness,
  ));

  // Right: ladder tab with 6 slots.
  const tabL = 48;
  const tabW = Math.min(width * 0.58, width - 5);
  const tabSlotW = Math.min(slotW, tabW - 2.2);
  const slots = [];
  for (let i = 0; i < 6; i += 1) {
    const sx = 9 + i * 6.2 - catchL / 2;
    slots.push(roundedRectHole(sx, (tabW - tabSlotW) / 2, catchL, tabSlotW, 1.2));
  }
  addGeometry(group, extrudeShape(
    tabShape(tabL, tabW, 3, slots),
    thickness, length, (width - tabW) / 2, 0,
  ));
}

function latch_friction_overlap(group, config, length) {
  // No hardware; the band itself tapers at both ends. Render as two short
  // wedge boxes that read as the thinning zone.
  const { width, thickness } = config.band;
  const taperL = 18;
  const tipZ = thickness * 0.6;
  // Approximate the taper with a trapezoidal wedge: a low box at each end.
  // We can't true-taper a BoxGeometry without a custom shape, but a low
  // overlay reads as the thinning.
  for (const xEdge of [0, length]) {
    const wedge = new THREE.BoxGeometry(taperL, width - 2, thickness - tipZ);
    const dir = xEdge === 0 ? 1 : -1;
    wedge.translate(xEdge + dir * taperL / 2, width / 2, thickness - (thickness - tipZ) / 2 + 0.05);
    addGeometry(group, wedge);
  }
}

function latch_magnetic(group, config, length) {
  const { width, thickness } = config.band;
  const puckR = 5.5;
  const puckH = 2.6;
  const puckInset = 8;
  const magnetD = 6.3;
  const magnetT = 2.1;
  for (const xCenter of [puckInset, length - puckInset]) {
    addGeometry(group, prismGeometry(puckR, puckR, puckH, 36, xCenter, width / 2, thickness));
    // Magnet pocket reads as a small dark disk inset into the puck top.
    const pocketShape = new THREE.Shape();
    pocketShape.absarc(0, 0, magnetD / 2, 0, Math.PI * 2, false);
    addGeometry(group, extrudeShape(
      pocketShape, 0.4,
      xCenter, width / 2,
      thickness + puckH - magnetT - 0.05,
    ));
  }
}

function addLatchPreview(group, config, length) {
  if (
    config.export.stage === 'band_only' ||
    config.export.stage === 'surface_only' ||
    config.latch.type === 'none'
  ) return;

  switch (config.latch.type) {
    case 'buckle':           return latch_buckle(group, config, length);
    case 'snap':             return latch_snap(group, config, length);
    case 'loop_post':        return latch_loop_post(group, config, length);
    case 'loop_post_v2':     return latch_loop_post_v2(group, config, length);
    case 'mushroom_keyhole': return latch_mushroom_keyhole(group, config, length);
    case 'ladder_strap':     return latch_ladder_strap(group, config, length);
    case 'friction_overlap': return latch_friction_overlap(group, config, length);
    case 'magnetic':         return latch_magnetic(group, config, length);
    default: return;
  }
}

function buildPreview(config) {
  const group = new THREE.Group();
  const length = braceletPreviewLength(config);

  if (config.export.stage !== 'surface_only') {
    addGeometry(group, bandPreviewGeometry(
      length, config.band.width, config.band.thickness, config.band.corner,
    ));
    addBandReliefSlots(group, config, length);
  }

  addStudPreview(group, config, length);
  addLatchPreview(group, config, length);
  return group;
}

function rebuildPreview(config) {
  setPreview(buildPreview(config));
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
// The downloaded .scad is self-contained — the bracelet library is bundled in
// at download time, so opening it in OpenSCAD renders without any setup.

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
  rebuildPreview(currentConfig);
  setViewStage(viewStage);
  presetCaption.textContent = selectedPreset
    ? `${selectedPreset.label} live preview / custom source`
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
    // 3/4 isometric-ish view of the band laid flat on the print bed (XY).
    // Distance scales with band length so the whole bracelet — including
    // ~50 mm of latch hardware at either end — fits in the viewport.
    const reach = ((currentConfig?.band?.circumference ?? 180) + 100) * 1.6;
    camera.position.set(0, reach * 0.35, isCompactViewport() ? reach * 1.3 : reach * 0.95);
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

async function selectPreset(name) {
  const preset = presets.find(p => p.name === name);
  if (!preset) return;

  selectedPreset = preset;
  currentConfig = configFromPreset(preset);
  applyConfigToControls(currentConfig);
  const defaultLayer = Math.round(Math.round(currentConfig.band.thickness / LAYER_HEIGHT) * 0.5);
  swapLayerEl.value = defaultLayer;
  swapLayerDisplay.textContent = defaultLayer;
  uniforms.uSwapZ.value = defaultLayer * LAYER_HEIGHT;

  updateSummary(currentConfig);
  updateValueLabels(currentConfig);
  updateUniforms(currentConfig);
  rebuildPreview(currentConfig);
  setViewStage(viewStage);
  setSource(currentConfig);
  presetCaption.textContent = `${preset.label} live preview / generated source`;
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

// Cache the bundled library so repeat downloads don't re-fetch.
let scadBundleCache = null;

async function fetchScadBundle() {
  if (scadBundleCache !== null) return scadBundleCache;
  const res = await fetch('bracelet_bundled.scad');
  if (!res.ok) throw new Error(`bundle fetch failed: ${res.status}`);
  scadBundleCache = await res.text();
  return scadBundleCache;
}

downloadScadBtn.addEventListener('click', async () => {
  if (sourceDirty) syncFromControls({ refreshSource: true });
  try {
    const bundle = await fetchScadBundle();
    const combined = `${bundle}\n// ===== user configuration =====\n${sourceOutput.value}`;
    downloadText(`${filenameBase(currentConfig)}.scad`, 'text/plain', combined);
  } catch (err) {
    console.error('Failed to fetch bundled SCAD library:', err);
    // Fall back to config-only download so the user still gets *something*.
    downloadText(`${filenameBase(currentConfig)}.scad`, 'text/plain', sourceOutput.value);
  }
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
