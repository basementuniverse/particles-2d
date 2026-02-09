// Particle System Editor

// -----------------------------------------------------------------------------
// Globals and editor state
// -----------------------------------------------------------------------------

const TITLE = 'Particle System';
const RESIZE_HANDLE_SIZE = 10;

const editorState = {
  dirty: false,
  projectName: '',
  particleSystem: null,
  selectedObjectId: null,
  contextNodeId: null,
  canvasSize: { x: 0, y: 0 },
  mousePosition: { x: 0, y: 0 },
  isDragging: false,
  dragObjectId: null,
  dragStartMousePos: null,
  dragStartObjectPos: null,
  isResizing: false,
  resizeObjectId: null,
  resizeEdge: null,
  resizeStartMousePos: null,
  resizeStartObjectData: null,
  isPlaying: false,
  showElements: true,
  lastFrameTime: 0,
  fpsCounter: 0,
  fpsTime: 0,
  fps: 0,
  history: {
    snapshots: [],
    currentIndex: -1,
  },
  settings: {
    theme: 'dark',
    canvasMargin: 20,
    showGrid: true,
    gridSize: 10,
  },
  // Store object definitions for serialization
  objects: {
    emitters: [],
    attractors: [],
    forceFields: [],
    colliders: [],
    sinks: [],
  },
};

const CANVAS_STYLES = {
  light: {
    background: '#ffffff',
    foreground: '#000000',
    grid: {
      strokeColor: '#00000033',
      lineWidth: 1,
      lineStyle: 'dotted',
    },
    emitterUnselected: {
      fill: true,
      fillColor: '#ff550033',
      stroke: true,
      strokeColor: '#ff5500cc',
      lineWidth: 2,
      lineStyle: 'dotted',
    },
    emitterSelected: {
      fill: true,
      fillColor: '#ff550044',
      stroke: true,
      strokeColor: '#ff5500',
      lineWidth: 2,
    },
    attractorUnselected: {
      fill: false,
      stroke: true,
      strokeColor: '#0078d480',
      lineWidth: 2,
      lineStyle: 'dotted',
    },
    attractorSelected: {
      fill: false,
      stroke: true,
      strokeColor: '#0078d4',
      lineWidth: 2,
    },
    forcefieldUnselected: {
      fill: false,
      stroke: true,
      strokeColor: '#00aa0080',
      lineWidth: 2,
      lineStyle: 'dotted',
    },
    forcefieldSelected: {
      fill: false,
      stroke: true,
      strokeColor: '#00aa00',
      lineWidth: 2,
    },
    colliderUnselected: {
      fill: true,
      fillColor: '#aa000033',
      stroke: true,
      strokeColor: '#aa0000cc',
      lineWidth: 2,
      lineStyle: 'dotted',
    },
    colliderSelected: {
      fill: true,
      fillColor: '#aa000044',
      stroke: true,
      strokeColor: '#aa0000',
      lineWidth: 2,
    },
    sinkUnselected: {
      fill: false,
      stroke: true,
      strokeColor: '#9900cc80',
      lineWidth: 2,
      lineStyle: 'dotted',
    },
    sinkSelected: {
      fill: false,
      stroke: true,
      strokeColor: '#9900cc',
      lineWidth: 2,
    },
    objectLabel: {
      foregroundColour: '#000000',
      backgroundColour: '#00000022',
    },
    noSystemLabel: {
      foregroundColour: '#000000',
      backgroundColour: '#00000022',
    },
  },
  dark: {
    background: '#202020',
    foreground: '#ffffff',
    grid: {
      strokeColor: '#ffffff33',
      lineWidth: 1,
      lineStyle: 'dotted',
    },
    emitterUnselected: {
      fill: true,
      fillColor: '#ff550033',
      stroke: true,
      strokeColor: '#ff5500cc',
      lineWidth: 2,
      lineStyle: 'dotted',
    },
    emitterSelected: {
      fill: true,
      fillColor: '#ff550044',
      stroke: true,
      strokeColor: '#ff5500',
      lineWidth: 2,
    },
    attractorUnselected: {
      fill: false,
      stroke: true,
      strokeColor: '#0078d480',
      lineWidth: 2,
      lineStyle: 'dotted',
    },
    attractorSelected: {
      fill: false,
      stroke: true,
      strokeColor: '#0078d4',
      lineWidth: 2,
    },
    forcefieldUnselected: {
      fill: false,
      stroke: true,
      strokeColor: '#00ff0080',
      lineWidth: 2,
      lineStyle: 'dotted',
    },
    forcefieldSelected: {
      fill: false,
      stroke: true,
      strokeColor: '#00ff00',
      lineWidth: 2,
    },
    colliderUnselected: {
      fill: true,
      fillColor: '#aa000033',
      stroke: true,
      strokeColor: '#aa0000cc',
      lineWidth: 2,
      lineStyle: 'dotted',
    },
    colliderSelected: {
      fill: true,
      fillColor: '#aa000044',
      stroke: true,
      strokeColor: '#aa0000',
      lineWidth: 2,
    },
    sinkUnselected: {
      fill: false,
      stroke: true,
      strokeColor: '#cc00ff80',
      lineWidth: 2,
      lineStyle: 'dotted',
    },
    sinkSelected: {
      fill: false,
      stroke: true,
      strokeColor: '#cc00ff',
      lineWidth: 2,
    },
    objectLabel: {
      foregroundColour: '#ffffff',
      backgroundColour: '#ffffff22',
    },
    noSystemLabel: {
      foregroundColour: '#ffffff',
      backgroundColour: '#ffffff22',
    },
  },
};

const SETTINGS_SCHEMA = {
  type: 'object',
  properties: {
    canvasMargin: { type: 'number', minimum: 0, maximum: 100 },
    showGrid: { type: 'boolean' },
    gridSize: { type: 'number', minimum: 10, maximum: 200 },
  },
  required: ['canvasMargin', 'showGrid', 'gridSize'],
};

// Property editor schemas for each object type
const EMITTER_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', title: 'ID' },
    position: {
      type: 'object',
      title: 'Position',
      properties: {
        x: { type: 'number', title: 'X' },
        y: { type: 'number', title: 'Y' },
      },
    },
    size: {
      type: 'object',
      title: 'Size',
      properties: {
        x: { type: 'number', title: 'Width', minimum: 1 },
        y: { type: 'number', title: 'Height', minimum: 1 },
      },
    },
    lifespan: {
      type: 'number',
      title: 'Lifespan',
      description: 'Lifespan in seconds (-1 for infinite)',
    },
    editParticleOptions: {
      type: 'function',
      title: 'Particle Options',
      description: 'Open JSON editor for particle configuration',
    },
    editParticleFunctions: {
      type: 'function',
      title: 'Particle Functions',
      description: 'Define custom functions for particle generation',
    },
    editEmissionOptions: {
      type: 'function',
      title: 'Emission Options',
      description: 'Open JSON editor for emission configuration',
    },
    editEmissionControl: {
      type: 'function',
      title: 'Emission Control',
      description: 'Define custom emission control function',
    },
    editParticleLifecycle: {
      type: 'function',
      title: 'Particle Lifecycle',
      description: 'Define custom particle update and draw hooks',
    },
  },
  required: ['id', 'position', 'size', 'lifespan'],
};

const ATTRACTOR_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', title: 'ID' },
    position: {
      type: 'object',
      title: 'Position',
      properties: {
        x: { type: 'number', title: 'X' },
        y: { type: 'number', title: 'Y' },
      },
    },
    range: {
      type: 'number',
      title: 'Range',
      minimum: 1,
      description: 'Attraction/repulsion range in pixels',
    },
    force: {
      type: 'number',
      title: 'Force',
      minimum: -10000,
      maximum: 10000,
      description: 'Force strength (positive = attract, negative = repel)',
    },
    falloff: {
      type: 'number',
      title: 'Falloff',
      minimum: 0,
      maximum: 2,
      description: 'How force decreases with distance (0 = linear, 2 = inverse square)',
    },
    lifespan: {
      type: 'number',
      title: 'Lifespan',
      description: 'Lifespan in seconds (-1 for infinite)',
    },
  },
  required: ['id', 'position', 'range', 'force', 'falloff', 'lifespan'],
};

const FORCEFIELD_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', title: 'ID' },
    force: {
      type: 'object',
      title: 'Force Vector',
      properties: {
        x: { type: 'number', title: 'X Force', description: 'Horizontal force in pixels/second²' },
        y: { type: 'number', title: 'Y Force', description: 'Vertical force in pixels/second²' },
      },
    },
    lifespan: {
      type: 'number',
      title: 'Lifespan',
      description: 'Lifespan in seconds (-1 for infinite)',
    },
    customForce: {
      type: 'string',
      title: 'Custom Force',
      enum: ['none', 'wave', 'vortex', 'orbital', 'vectorField', 'turbulence', 'drag', 'boids'],
      description: 'Built-in force field function to apply',
    },
    editCustomForceParams: {
      type: 'function',
      title: 'Custom Force Parameters',
      description: 'Open JSON editor for custom force parameters',
    },
    editCustomForceFunction: {
      type: 'function',
      title: 'Custom Force Function',
      description: 'Define custom force field function',
    },
  },
  required: ['id', 'force', 'lifespan'],
};

const COLLIDER_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', title: 'ID' },
    geometry: {
      type: 'object',
      title: 'Geometry',
      properties: {
        type: {
          type: 'string',
          title: 'Shape',
          enum: ['rectangle', 'circle'],
        },
        position: {
          type: 'object',
          title: 'Position',
          properties: {
            x: { type: 'number', title: 'X' },
            y: { type: 'number', title: 'Y' },
          },
        },
        size: {
          type: 'object',
          title: 'Size',
          properties: {
            x: { type: 'number', title: 'Width', minimum: 1 },
            y: { type: 'number', title: 'Height', minimum: 1 },
          },
        },
        radius: {
          type: 'number',
          title: 'Radius',
          minimum: 1,
        },
        rotation: {
          type: 'number',
          title: 'Rotation',
        },
      },
    },
    restitution: {
      type: 'number',
      title: 'Restitution',
      minimum: 0,
      maximum: 1,
      description: 'Bounciness (0 = no bounce, 1 = perfect bounce)',
    },
    friction: {
      type: 'number',
      title: 'Friction',
      minimum: 0,
      maximum: 1,
      description: 'Surface friction (0 = no friction, 1 = maximum friction)',
    },
    randomness: {
      type: 'number',
      title: 'Randomness',
      minimum: 0,
      maximum: 1,
      description: 'Random direction offset on collision (0 = none, 1 = maximum)',
    },
  },
  required: ['id', 'geometry', 'restitution', 'friction', 'randomness'],
};

const SINK_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', title: 'ID' },
    position: {
      type: 'object',
      title: 'Position',
      properties: {
        x: { type: 'number', title: 'X' },
        y: { type: 'number', title: 'Y' },
      },
    },
    range: {
      type: 'number',
      title: 'Range',
      minimum: 1,
      description: 'Range of effect in pixels',
    },
    strength: {
      type: 'number',
      title: 'Strength',
      minimum: 0,
      description: 'Aging acceleration multiplier',
    },
    falloff: {
      type: 'number',
      title: 'Falloff',
      minimum: 0,
      maximum: 2,
      description: 'Distance-based effect gradient (higher = stronger at center)',
    },
    mode: {
      type: 'string',
      title: 'Mode',
      enum: ['instant', 'fade'],
      description: 'instant = immediate disposal, fade = accelerated aging',
    },
    lifespan: {
      type: 'number',
      title: 'Lifespan',
      description: 'Lifespan in seconds (-1 for infinite)',
    },
  },
  required: ['id', 'position', 'range', 'strength', 'falloff', 'mode', 'lifespan'],
};

// Default object definitions
const DEFAULT_EMITTER = {
  id: '',
  type: 'emitter',
  position: { x: 400, y: 300 },
  size: { x: 100, y: 100 },
  lifespan: -1,
  options: {
    particles: {
      position: 'uniform',
      speed: { min: 50, max: 100 },
      direction: { min: -Math.PI, max: Math.PI },
      size: { x: 10, y: 10 },
      rotation: null,
      lifespan: 3,
      style: {
        style: 'dot',
        color: ['#ff0000', '#00ff00', '#0000ff'],
        fade: { in: 0.2, out: 1 },
      },
      options: {
        useAttractors: true,
        useForceFields: true,
        useColliders: true,
        useSinks: true,
        defaultUpdates: 'all',
        defaultDraws: 'all',
      },
    },
    emission: { type: 'rate', rate: 10 },
  },
};

const DEFAULT_ATTRACTOR = {
  id: '',
  type: 'attractor',
  position: { x: 400, y: 300 },
  range: 150,
  force: 2000,
  falloff: 0.4,
  lifespan: -1,
};

const DEFAULT_FORCEFIELD = {
  id: '',
  type: 'forcefield',
  force: { x: 0, y: 300 },
  lifespan: -1,
  customForce: 'none',
  customForceParams: {},
};

const DEFAULT_COLLIDER = {
  id: '',
  type: 'collider',
  geometry: { type: 'rectangle', position: { x: 400, y: 550 }, size: { x: 800, y: 100 } },
  restitution: 0.4,
  friction: 0.6,
  randomness: 0.2,
};

const DEFAULT_SINK = {
  id: '',
  type: 'sink',
  position: { x: 400, y: 300 },
  range: 100,
  strength: 5,
  falloff: 0.8,
  mode: 'fade',
  lifespan: -1,
};

// Particle System library
let ParticleSystem, Emitter, Attractor, ForceField, Collider, Sink;

// Debug library
let Debug;

// Canvas-helpers library
let drawGrid, drawCircle, drawRectangle, drawLine, drawArrow;

// DOM elements
let app, tree, content, properties, history;
let canvas, context;
let particleOptionsEditor, emissionOptionsEditor, customForceParamsEditor;
let sceneTree, propertiesTitle, propertyEditor, historyView, settingsEditor;
let newToolbarButton, openToolbarButton, saveToolbarButton;
let undoToolbarButton, redoToolbarButton;
let newEmitterToolbarButton, newAttractorToolbarButton, newForceFieldToolbarButton, newColliderToolbarButton, newSinkToolbarButton;
let deleteToolbarButton;
let playToolbarButton, pauseToolbarButton, resetToolbarButton, toggleElementsToolbarButton;
let settingsToolbarButton, themeSwitch;
let statusBar, mouseStatusBarItem, selectedStatusBarItem, particlesStatusBarItem, fpsStatusBarItem;
let settingsDialog, closeSettingsDialogButton;
let particleOptionsDialog, particleOptionsJsonEditor, particleOptionsOkButton, particleOptionsCancelButton;
let emissionOptionsDialog, emissionOptionsJsonEditor, emissionOptionsOkButton, emissionOptionsCancelButton;
let particleFunctionsDialog, particleFunctionsTextareas, particleFunctionsCheckboxes, particleFunctionsOkButton, particleFunctionsCancelButton, particleFunctionsStatusBar, particleFunctionsStatusItem;
let emissionControlDialog, emissionControlTextarea, emissionControlCheckbox, emissionControlOkButton, emissionControlCancelButton, emissionControlStatusBar, emissionControlStatusItem;
let particleLifecycleDialog, particleLifecycleTextareas, particleLifecycleCheckboxes, particleLifecycleOkButton, particleLifecycleCancelButton, particleLifecycleStatusBar, particleLifecycleStatusItem;
let customForceParamsDialog, customForceParamsJsonEditor, customForceParamsOkButton, customForceParamsCancelButton;
let customForceFunctionDialog, customForceFunctionTextarea, customForceFunctionCheckbox, customForceFunctionOkButton, customForceFunctionCancelButton, customForceFunctionStatusBar, customForceFunctionStatusItem;
let newEmitterContextMenuItem, newAttractorContextMenuItem, newForceFieldContextMenuItem, newColliderContextMenuItem, newSinkContextMenuItem;
let deleteContextMenuItem, loadImageContextMenuItem;
let namePrompt, imageIdPrompt;
let imageFileInput;

// -----------------------------------------------------------------------------
// Initialization
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initialiseEditor();
});

function initialiseEditor() {
  console.log('Initializing Particle System Editor...');

  // Check if Particle System library is available
  const PS = window.ParticleSystem;
  if (!PS) {
    console.error('Particle System library not found!');
    return;
  }
  ParticleSystem = PS.ParticleSystem;
  Emitter = PS.Emitter;
  Attractor = PS.Attractor;
  ForceField = PS.ForceField;
  Collider = PS.Collider;
  Sink = PS.Sink;

  // Check if Debug library is available
  Debug = window.default;
  if (!Debug) {
    console.error('Debug library not found!');
    return;
  }
  Debug.initialise();

  // Setup canvas
  canvas = document.getElementById('editor-canvas');
  context = canvas.getContext('2d');

  if (!canvas || !context) {
    console.error('Canvas element not found!');
    return;
  }

  // Get canvas-helpers with context attached
  [drawGrid, drawCircle, drawRectangle, drawLine, drawArrow] =
    withContext(context,
      grid,
      circle,
      rectangle,
      line,
      arrow
    );

  // Get DOM elements
  app = document.querySelector('e2-app');
  tree = document.querySelector('aside.tree');
  content = document.querySelector('section.content');
  properties = document.querySelector('aside.properties');
  history = document.querySelector('aside.history');
  sceneTree = document.getElementById('scene-tree');
  propertiesTitle = document.getElementById('properties-title');
  propertyEditor = document.getElementById('property-editor');
  historyView = document.getElementById('history-list');
  newToolbarButton = document.getElementById('new-toolbar-button');
  openToolbarButton = document.getElementById('open-toolbar-button');
  saveToolbarButton = document.getElementById('save-toolbar-button');
  undoToolbarButton = document.getElementById('undo-toolbar-button');
  redoToolbarButton = document.getElementById('redo-toolbar-button');
  newEmitterToolbarButton = document.getElementById('new-emitter-toolbar-button');
  newAttractorToolbarButton = document.getElementById('new-attractor-toolbar-button');
  newForceFieldToolbarButton = document.getElementById('new-forcefield-toolbar-button');
  newColliderToolbarButton = document.getElementById('new-collider-toolbar-button');
  newSinkToolbarButton = document.getElementById('new-sink-toolbar-button');
  deleteToolbarButton = document.getElementById('delete-toolbar-button');
  playToolbarButton = document.getElementById('play-toolbar-button');
  pauseToolbarButton = document.getElementById('pause-toolbar-button');
  resetToolbarButton = document.getElementById('reset-toolbar-button');
  toggleElementsToolbarButton = document.getElementById('toggle-elements-toolbar-button');
  settingsToolbarButton = document.getElementById('settings-toolbar-button');
  themeSwitch = document.querySelector('.theme-switch input');
  statusBar = document.getElementById('status-bar');
  mouseStatusBarItem = document.getElementById('mouse-status');
  selectedStatusBarItem = document.getElementById('selected-status');
  particlesStatusBarItem = document.getElementById('particles-status');
  fpsStatusBarItem = document.getElementById('fps-status');
  settingsDialog = document.getElementById('settings-dialog');
  settingsEditor = document.getElementById('settings-editor');
  closeSettingsDialogButton = document.getElementById('close-settings-dialog-button');
  particleOptionsDialog = document.getElementById('particle-options-dialog');
  particleOptionsJsonEditor = document.getElementById('particle-options-json-editor');
  particleOptionsOkButton = document.getElementById('particle-options-ok-button');
  particleOptionsCancelButton = document.getElementById('particle-options-cancel-button');
  emissionOptionsDialog = document.getElementById('emission-options-dialog');
  emissionOptionsJsonEditor = document.getElementById('emission-options-json-editor');
  emissionOptionsOkButton = document.getElementById('emission-options-ok-button');
  emissionOptionsCancelButton = document.getElementById('emission-options-cancel-button');
  particleFunctionsDialog = document.getElementById('particle-functions-dialog');
  particleFunctionsTextareas = {
    position: document.getElementById('particle-fn-position'),
    speed: document.getElementById('particle-fn-speed'),
    direction: document.getElementById('particle-fn-direction'),
    size: document.getElementById('particle-fn-size'),
    rotation: document.getElementById('particle-fn-rotation'),
    lifespan: document.getElementById('particle-fn-lifespan'),
  };
  particleFunctionsCheckboxes = {
    position: document.getElementById('particle-fn-position-enabled'),
    speed: document.getElementById('particle-fn-speed-enabled'),
    direction: document.getElementById('particle-fn-direction-enabled'),
    size: document.getElementById('particle-fn-size-enabled'),
    rotation: document.getElementById('particle-fn-rotation-enabled'),
    lifespan: document.getElementById('particle-fn-lifespan-enabled'),
  };
  particleFunctionsOkButton = document.getElementById('particle-functions-ok-button');
  particleFunctionsCancelButton = document.getElementById('particle-functions-cancel-button');
  particleFunctionsStatusBar = document.getElementById('particle-functions-status-bar');
  particleFunctionsStatusItem = document.getElementById('particle-functions-status-item');
  emissionControlDialog = document.getElementById('emission-control-dialog');
  emissionControlTextarea = document.getElementById('emission-control-code');
  emissionControlCheckbox = document.getElementById('emission-control-enabled');
  emissionControlOkButton = document.getElementById('emission-control-ok-button');
  emissionControlCancelButton = document.getElementById('emission-control-cancel-button');
  emissionControlStatusBar = document.getElementById('emission-control-status-bar');
  emissionControlStatusItem = document.getElementById('emission-control-status-item');
  particleLifecycleDialog = document.getElementById('particle-lifecycle-dialog');
  particleLifecycleTextareas = {
    update: document.getElementById('particle-lifecycle-update'),
    preDraw: document.getElementById('particle-lifecycle-predraw'),
    postDraw: document.getElementById('particle-lifecycle-postdraw'),
  };
  particleLifecycleCheckboxes = {
    update: document.getElementById('particle-lifecycle-update-enabled'),
    preDraw: document.getElementById('particle-lifecycle-predraw-enabled'),
    postDraw: document.getElementById('particle-lifecycle-postdraw-enabled'),
  };
  particleLifecycleOkButton = document.getElementById('particle-lifecycle-ok-button');
  particleLifecycleCancelButton = document.getElementById('particle-lifecycle-cancel-button');
  particleLifecycleStatusBar = document.getElementById('particle-lifecycle-status-bar');
  particleLifecycleStatusItem = document.getElementById('particle-lifecycle-status-item');
  customForceParamsDialog = document.getElementById('custom-force-params-dialog');
  customForceParamsJsonEditor = document.getElementById('custom-force-params-json-editor');
  customForceParamsOkButton = document.getElementById('custom-force-params-ok-button');
  customForceParamsCancelButton = document.getElementById('custom-force-params-cancel-button');
  customForceFunctionDialog = document.getElementById('custom-force-function-dialog');
  customForceFunctionTextarea = document.getElementById('custom-force-function-code');
  customForceFunctionCheckbox = document.getElementById('custom-force-function-enabled');
  customForceFunctionOkButton = document.getElementById('custom-force-function-ok-button');
  customForceFunctionCancelButton = document.getElementById('custom-force-function-cancel-button');
  customForceFunctionStatusBar = document.getElementById('custom-force-function-status-bar');
  customForceFunctionStatusItem = document.getElementById('custom-force-function-status-item');
  newEmitterContextMenuItem = document.getElementById('new-emitter-context-menu-item');
  newAttractorContextMenuItem = document.getElementById('new-attractor-context-menu-item');
  newForceFieldContextMenuItem = document.getElementById('new-forcefield-context-menu-item');
  newColliderContextMenuItem = document.getElementById('new-collider-context-menu-item');
  newSinkContextMenuItem = document.getElementById('new-sink-context-menu-item');
  deleteContextMenuItem = document.getElementById('delete-context-menu-item');
  loadImageContextMenuItem = document.getElementById('load-image-context-menu-item');
  namePrompt = document.getElementById('name-prompt');
  imageIdPrompt = document.getElementById('image-id-prompt');
  imageFileInput = document.getElementById('image-file-input');

  // Configure history view
  if (historyView) {
    historyView.columns = [
      { id: 'label', label: '#', width: '2em' },
      { id: 'action', label: 'Action' },
      { id: 'date', label: 'Date', width: '55px' },
      { id: 'current', label: 'Current', width: '1em' },
    ];
  }

  // Initialise settings editor
  settingsEditor.value = Object.fromEntries(
    Object.entries(editorState.settings).filter(([key]) => key !== 'theme')
  );
  settingsEditor.schema = SETTINGS_SCHEMA;

  setupCanvas();
  startRenderLoop();
  setupEventListeners();
  updateTitle();
  updateStatusBar();
  updateToolbarButtons();
  themeSwitch.checked = editorState.settings.theme === 'dark';
  app.setAttribute('theme', editorState.settings.theme);
  settingsDialog.setAttribute('theme', editorState.settings.theme);
  particleOptionsDialog.setAttribute('theme', editorState.settings.theme);
  emissionOptionsDialog.setAttribute('theme', editorState.settings.theme);
  particleFunctionsDialog.setAttribute('theme', editorState.settings.theme);
  particleFunctionsStatusBar.setAttribute('theme', editorState.settings.theme);
  customForceParamsDialog.setAttribute('theme', editorState.settings.theme);

  console.log('Particle System Editor initialised successfully');
}

function setupCanvas() {
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Handle canvas resize observer for more responsive updates
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(tree);
    resizeObserver.observe(content);
    resizeObserver.observe(properties);
    resizeObserver.observe(history);
  }
}

function resizeCanvas() {
  const rect = content.getBoundingClientRect();
  canvas.width = Math.floor(rect.width) - editorState.settings.canvasMargin * 2;
  canvas.height = Math.floor(rect.height) - editorState.settings.canvasMargin * 2;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.style.top = `${editorState.settings.canvasMargin}px`;
  canvas.style.left = `${editorState.settings.canvasMargin}px`;
  editorState.canvasSize.x = canvas.width;
  editorState.canvasSize.y = canvas.height;
}

function setupEventListeners() {
  // Theme switch toggle
  themeSwitch.addEventListener('change', e => {
    if (e.target.checked) {
      editorState.settings.theme = 'dark';
    } else {
      editorState.settings.theme = 'light';
    }
    app.setAttribute('theme', editorState.settings.theme);
    settingsDialog.setAttribute('theme', editorState.settings.theme);
    particleOptionsDialog.setAttribute('theme', editorState.settings.theme);
    emissionOptionsDialog.setAttribute('theme', editorState.settings.theme);
    customForceParamsDialog.setAttribute('theme', editorState.settings.theme);
  });

  // Mouse movement tracking
  content.addEventListener('mousemove', e => {
    const rect = content.getBoundingClientRect();
    editorState.mousePosition = {
      x: Math.round(e.clientX - rect.left) - editorState.settings.canvasMargin,
      y: Math.round(e.clientY - rect.top) - editorState.settings.canvasMargin,
    };

    // Handle dragging or resizing
    if (editorState.isDragging) {
      handleMouseDrag(
        editorState.mousePosition.x,
        editorState.mousePosition.y
      );
    } else if (editorState.isResizing) {
      handleMouseResize(
        editorState.mousePosition.x,
        editorState.mousePosition.y
      );
    } else {
      // Update cursor based on hover
      // If no particle system, always show default cursor
      if (!editorState.particleSystem) {
        canvas.style.cursor = 'default';
      } else {
        const hoveredObjectId = findObjectAtPosition(
          editorState.mousePosition.x,
          editorState.mousePosition.y
        );

        // Check if hovering over selected object's border (for resize)
        if (
          editorState.selectedObjectId &&
          hoveredObjectId === editorState.selectedObjectId
        ) {
          const resizeEdge = detectResizeEdge(
            hoveredObjectId,
            editorState.mousePosition.x,
            editorState.mousePosition.y
          );
          if (resizeEdge) {
            canvas.style.cursor = getResizeCursor(resizeEdge);
          } else {
            canvas.style.cursor = 'move';
          }
        } else if (hoveredObjectId) {
          canvas.style.cursor = 'move';
        } else {
          canvas.style.cursor = 'default';
        }
      }
    }

    updateStatusBar();
  });

  // Content area click for selection
  content.addEventListener('click', e => {
    if (!editorState.isDragging) {
      handleContentAreaClick(
        editorState.mousePosition.x,
        editorState.mousePosition.y
      );
    }
  });

  // Mouse down for starting drag
  content.addEventListener('mousedown', e => {
    if (e.button !== 0) return; // Only left mouse button
    handleMouseDown(
      editorState.mousePosition.x,
      editorState.mousePosition.y
    );
  });

  // Mouse up for ending drag
  content.addEventListener('mouseup', e => {
    if (e.button !== 0) return; // Only left mouse button
    handleMouseUp();
  });

  // Mouse leave to cancel drag or resize
  content.addEventListener('mouseleave', e => {
    if (editorState.isDragging || editorState.isResizing) {
      handleMouseUp();
    }
  });

  // Keyboard events
  document.addEventListener('keydown', e => {
    // Don't handle shortcuts if user is typing in an input or textarea
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'INPUT' ||
      activeElement.isContentEditable
    )) {
      return;
    }

    // Delete
    if (e.key === 'Delete' && editorState.selectedObjectId) {
      e.preventDefault();
      deleteObject(editorState.selectedObjectId);
    }

    // Undo
    if (e.ctrlKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }

    // Redo
    if (
      (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z') ||
      (e.ctrlKey && e.key.toLowerCase() === 'y')
    ) {
      e.preventDefault();
      redo();
    }

    // Play/Pause with Space
    if (e.key === ' ') {
      e.preventDefault();
      if (editorState.isPlaying) {
        pauseSimulation();
      } else {
        playSimulation();
      }
    }
  });

  // Toolbar button events
  document.addEventListener('toolbar-button-click', async e => {
    await handleToolbarAction(e.detail.button.getAttribute('action'));
  });

  // Context menu events
  document.addEventListener('context-menu-show', e => {
    const { componentContext } = e.detail;

    if (componentContext?.componentType === 'tree-view') {
      // Context menu shown from tree-view
      let node = null;
      const treeContext = componentContext;

      if (treeContext.item) {
        node = treeContext.item.data;
      }

      editorState.contextNodeId = node?.id || null;
      console.log(editorState.contextNodeId);
    } else {
      // Context menu shown from canvas - check what's at mouse position
      const hoveredObjectId = findObjectAtPosition(
        editorState.mousePosition.x,
        editorState.mousePosition.y
      );
      editorState.contextNodeId = hoveredObjectId;
    }

    updateContextMenuButtons();
  });
  document.addEventListener('context-menu-item-click', e => {
    handleContextMenuAction(e.detail.item.getAttribute('action'));
  });

  // Tree view selection events
  document.addEventListener('tree-selection-change', e => {
    if (e.target === sceneTree) {
      handleTreeSelection(e);
    }
  });

  // History view selection events
  document.addEventListener('listview-selection-change', e => {
    if (e.target === historyView) {
      handleHistorySelection(e);
    }
  });

  // Properties editor changes
  const debouncedHandlePropertyChange = debounce(handlePropertyChange, 300);
  propertyEditor.addEventListener('keyvalue-change', debouncedHandlePropertyChange);

  // Settings editor changes
  const debouncedHandleSettingsChange = debounce(handleSettingsChange, 300);
  settingsEditor.addEventListener('keyvalue-change', debouncedHandleSettingsChange);

  // Close settings dialog
  closeSettingsDialogButton?.addEventListener('click', e => {
    settingsDialog?.close();
  });

  // Particle options dialog handlers
  particleOptionsOkButton?.addEventListener('click', () => {
    try {
      const particleOptions = particleOptionsEditor.get();

      // Update the emitter's options.particles
      const obj = findObjectById(editorState.selectedObjectId);
      if (obj && obj.type === 'emitter') {
        obj.options.particles = particleOptions;

        // Recreate the emitter with all custom functions applied
        recreateEmitterWithFunctions(obj);

        takeSnapshot('Edit Particle Options');
        updatePropertyEditor(obj);
        editorState.dirty = true;
        updateTitle();
      }

      particleOptionsDialog?.close();
      statusBar?.showMessage('Particle options updated successfully', 'success', 3000);
    } catch (err) {
      console.error('Invalid JSON:', err);
      alert('Invalid JSON: ' + err.message);
    }
  });

  particleOptionsCancelButton?.addEventListener('click', () => {
    particleOptionsDialog?.close();
  });

  // Particle functions dialog handlers
  particleFunctionsOkButton?.addEventListener('click', () => {
    try {
      const obj = findObjectById(editorState.selectedObjectId);
      if (obj && obj.type === 'emitter') {
        const functions = {};
        const errors = [];

        // Try to compile each enabled function
        for (const [key, textarea] of Object.entries(particleFunctionsTextareas)) {
          const checkbox = particleFunctionsCheckboxes[key];
          const enabled = checkbox?.checked || false;
          const code = textarea.value.trim();

          if (enabled && code) {
            try {
              // Validate the function syntax by creating it (only with 'n' parameter)
              const fn = new Function('n', code);
              // Store as object with enabled flag and code
              functions[key] = { enabled: true, code: code };
            } catch (err) {
              errors.push(`${key}: ${err.message}`);
            }
          } else if (enabled && !code) {
            errors.push(`${key}: enabled but no code provided`);
          } else {
            // Store disabled state to preserve the code
            functions[key] = { enabled: false, code: code };
          }
        }

        if (errors.length > 0) {
          particleFunctionsStatusItem.value = `Validation errors: ${errors.join(', ')}`;
          particleFunctionsStatusBar?.showMessage(`Validation errors: ${errors.join(', ')}`, 'error', 5000);
          return;
        }

        // Clear any previous error message
        particleFunctionsStatusItem.value = '';

        // Store the function objects in the emitter's custom functions
        if (!obj.customFunctions) {
          obj.customFunctions = {};
        }
        obj.customFunctions = functions;

        // Recreate the emitter with the new functions
        recreateEmitterWithFunctions(obj);

        takeSnapshot('Edit Particle Functions');
        updatePropertyEditor(obj);
        editorState.dirty = true;
        updateTitle();

        particleFunctionsDialog?.close();
        statusBar?.showMessage('Particle functions updated successfully', 'success', 3000);
      }
    } catch (err) {
      console.error('Error updating particle functions:', err);
      particleFunctionsStatusItem.value = `Error: ${err.message}`;
      particleFunctionsStatusBar?.showMessage(`Error: ${err.message}`, 'error', 5000);
    }
  });

  particleFunctionsCancelButton?.addEventListener('click', () => {
    particleFunctionsDialog?.close();
  });

  // Emission control dialog handlers
  emissionControlOkButton?.addEventListener('click', () => {
    try {
      const obj = findObjectById(editorState.selectedObjectId);
      if (obj && obj.type === 'emitter') {
        const enabled = emissionControlCheckbox?.checked || false;
        const code = emissionControlTextarea.value.trim();

        if (enabled && !code) {
          emissionControlStatusItem.value = 'Enabled but no code provided';
          emissionControlStatusBar?.showMessage('Enabled but no code provided', 'error', 5000);
          return;
        }

        if (enabled && code) {
          try {
            // Validate the function syntax
            const fn = new Function(code);
            // Store as object with enabled flag and code
            obj.customEmissionFunction = { enabled: true, code: code };
          } catch (err) {
            emissionControlStatusItem.value = `Validation error: ${err.message}`;
            emissionControlStatusBar?.showMessage(`Validation error: ${err.message}`, 'error', 5000);
            return;
          }
        } else {
          // Store disabled state to preserve the code
          obj.customEmissionFunction = { enabled: false, code: code };
        }

        // Clear any previous error message
        emissionControlStatusItem.value = '';

        // Recreate the emitter with the new function
        recreateEmitterWithFunctions(obj);

        takeSnapshot('Edit Emission Control Function');
        updatePropertyEditor(obj);
        editorState.dirty = true;
        updateTitle();

        emissionControlDialog?.close();
      }
    } catch (err) {
      console.error('Error saving emission control function:', err);
      emissionControlStatusItem.value = `Error: ${err.message}`;
      emissionControlStatusBar?.showMessage(`Error: ${err.message}`, 'error', 5000);
    }
  });

  emissionControlCancelButton?.addEventListener('click', () => {
    emissionControlDialog?.close();
  });

  // Particle lifecycle dialog handlers
  particleLifecycleOkButton?.addEventListener('click', () => {
    try {
      const obj = findObjectById(editorState.selectedObjectId);
      if (obj && obj.type === 'emitter') {
        const functions = {};
        const errors = [];

        // Try to compile each enabled function
        for (const [key, textarea] of Object.entries(particleLifecycleTextareas)) {
          const checkbox = particleLifecycleCheckboxes[key];
          const enabled = checkbox?.checked || false;
          const code = textarea.value.trim();

          if (enabled && code) {
            try {
              // Validate the function syntax (parameters depend on the function type)
              let fn;
              if (key === 'update') {
                fn = new Function('system', 'dt', code);
              } else if (key === 'preDraw' || key === 'postDraw') {
                fn = new Function('system', 'context', code);
              }
              // Store as object with enabled flag and code
              functions[key] = { enabled: true, code: code };
            } catch (err) {
              errors.push(`${key}: ${err.message}`);
            }
          } else if (enabled && !code) {
            errors.push(`${key}: enabled but no code provided`);
          } else {
            // Store disabled state to preserve the code
            functions[key] = { enabled: false, code: code };
          }
        }

        if (errors.length > 0) {
          particleLifecycleStatusItem.value = `Validation errors: ${errors.join(', ')}`;
          particleLifecycleStatusBar?.showMessage(`Validation errors: ${errors.join(', ')}`, 'error', 5000);
          return;
        }

        // Clear any previous error message
        particleLifecycleStatusItem.value = '';

        // Store the function objects in the emitter's custom lifecycle hooks
        obj.customLifecycleHooks = functions;

        // Recreate the emitter with the new functions
        recreateEmitterWithFunctions(obj);

        takeSnapshot('Edit Particle Lifecycle Hooks');
        updatePropertyEditor(obj);
        editorState.dirty = true;
        updateTitle();

        particleLifecycleDialog?.close();
      }
    } catch (err) {
      console.error('Error saving particle lifecycle hooks:', err);
      particleLifecycleStatusItem.value = `Error: ${err.message}`;
      particleLifecycleStatusBar?.showMessage(`Error: ${err.message}`, 'error', 5000);
    }
  });

  particleLifecycleCancelButton?.addEventListener('click', () => {
    particleLifecycleDialog?.close();
  });

  // Custom force function dialog handlers
  customForceFunctionOkButton?.addEventListener('click', () => {
    try {
      const obj = findObjectById(editorState.selectedObjectId);
      if (obj && obj.type === 'forcefield') {
        const enabled = customForceFunctionCheckbox?.checked || false;
        const code = customForceFunctionTextarea.value.trim();

        if (enabled && !code) {
          customForceFunctionStatusItem.value = 'Enabled but no code provided';
          customForceFunctionStatusBar?.showMessage('Enabled but no code provided', 'error', 5000);
          return;
        }

        if (enabled && code) {
          try {
            // Validate the function syntax
            const fn = new Function('system', 'forceField', 'dt', code);
            // Store as object with enabled flag and code
            obj.customForceFunction = { enabled: true, code: code };
          } catch (err) {
            customForceFunctionStatusItem.value = `Validation error: ${err.message}`;
            customForceFunctionStatusBar?.showMessage(`Validation error: ${err.message}`, 'error', 5000);
            return;
          }
        } else {
          // Store disabled state to preserve the code
          obj.customForceFunction = { enabled: false, code: code };
        }

        // Clear any previous error message
        customForceFunctionStatusItem.value = '';

        // Recreate the force field with the new function
        recreateForceFieldWithFunction(obj);

        takeSnapshot('Edit Custom Force Function');
        updatePropertyEditor(obj);
        editorState.dirty = true;
        updateTitle();

        customForceFunctionDialog?.close();
      }
    } catch (err) {
      console.error('Error saving custom force function:', err);
      customForceFunctionStatusItem.value = `Error: ${err.message}`;
      customForceFunctionStatusBar?.showMessage(`Error: ${err.message}`, 'error', 5000);
    }
  });

  customForceFunctionCancelButton?.addEventListener('click', () => {
    customForceFunctionDialog?.close();
  });

  // Emission options dialog handlers
  emissionOptionsOkButton?.addEventListener('click', () => {
    try {
      const emissionOptions = emissionOptionsEditor.get();

      // Update the emitter's options.emission
      const obj = findObjectById(editorState.selectedObjectId);
      if (obj && obj.type === 'emitter') {
        obj.options.emission = emissionOptions;

        // Recreate the emitter with all custom functions applied
        recreateEmitterWithFunctions(obj);

        takeSnapshot('Edit Emission Options');
        updatePropertyEditor(obj);
        editorState.dirty = true;
        updateTitle();
      }

      emissionOptionsDialog?.close();
      statusBar?.showMessage('Emission options updated successfully', 'success', 3000);
    } catch (err) {
      console.error('Invalid JSON:', err);
      alert('Invalid JSON: ' + err.message);
    }
  });

  emissionOptionsCancelButton?.addEventListener('click', () => {
    emissionOptionsDialog?.close();
  });

  // Custom force params dialog handlers
  customForceParamsOkButton?.addEventListener('click', () => {
    try {
      const customForceParams = customForceParamsEditor.get();

      // Update the forcefield's customForceParams
      const obj = findObjectById(editorState.selectedObjectId);
      if (obj && obj.type === 'forcefield') {
        obj.customForceParams = customForceParams;

        // Update the particle system object immediately
        const psObject = findParticleSystemObject(obj.id);
        if (psObject) {
          psObject.customForceParams = customForceParams;
        }

        takeSnapshot('Edit Custom Force Parameters');
        updatePropertyEditor(obj);
        editorState.dirty = true;
        updateTitle();
      }

      customForceParamsDialog?.close();
      statusBar?.showMessage('Custom force parameters updated successfully', 'success', 3000);
    } catch (err) {
      console.error('Invalid JSON:', err);
      alert('Invalid JSON: ' + err.message);
    }
  });

  customForceParamsCancelButton?.addEventListener('click', () => {
    customForceParamsDialog?.close();
  });

  // Image file input handler
  imageFileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await loadImageFile(file);
    imageFileInput.value = ''; // Reset so same file can be loaded again
  });

  // Drag and drop for images
  tree.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  tree.addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    for (const file of files) {
      await loadImageFile(file);
    }
  });
}

// -----------------------------------------------------------------------------
// Event handlers
// -----------------------------------------------------------------------------

async function handleToolbarAction(action) {
  console.log('Toolbar action:', action);

  switch (action) {
    case 'new':
      newProject();
      break;
    case 'open':
      openProject();
      break;
    case 'save':
      await saveProject();
      break;
    case 'undo':
      undo();
      break;
    case 'redo':
      redo();
      break;
    case 'new-emitter':
      createEmitter();
      break;
    case 'new-attractor':
      createAttractor();
      break;
    case 'new-forcefield':
      createForceField();
      break;
    case 'new-collider':
      createCollider();
      break;
    case 'new-sink':
      createSink();
      break;
    case 'delete':
      if (editorState.selectedObjectId) {
        deleteObject(editorState.selectedObjectId);
      }
      break;
    case 'play':
      playSimulation();
      break;
    case 'pause':
      pauseSimulation();
      break;
    case 'reset':
      resetSimulation();
      break;
    case 'toggle-elements':
      toggleElementsVisibility();
      break;
    case 'settings':
      settingsDialog?.showModal();
      break;
    default:
      console.warn('Unknown toolbar action:', action);
  }
}

function handleContextMenuAction(action) {
  console.log('Context menu action:', action);

  switch (action) {
    case 'new-emitter-context':
      createEmitter(editorState.mousePosition);
      break;
    case 'new-attractor-context':
      createAttractor(editorState.mousePosition);
      break;
    case 'new-forcefield-context':
      createForceField();
      break;
    case 'new-collider-context':
      createCollider(editorState.mousePosition);
      break;
    case 'new-sink-context':
      createSink(editorState.mousePosition);
      break;
    case 'load-image-context':
      imageFileInput?.click();
      break;
    case 'delete-context':
      if (editorState.contextNodeId) {
        const obj = findObjectById(editorState.contextNodeId);
        if (obj?.type === 'image') {
          deleteImage(obj.id);
        } else {
          deleteObject(editorState.contextNodeId);
        }
      }
      break;
    default:
      console.warn('Unknown context menu action:', action);
  }
}

function handleContentAreaClick(x, y) {
  if (!editorState.particleSystem) return;

  // Find the object at the clicked position
  const clickedObjectId = findObjectAtPosition(x, y);
  if (clickedObjectId) {
    console.log('Object selected:', clickedObjectId);
    editorState.selectedObjectId = clickedObjectId;
    syncTreeViewSelection(clickedObjectId);
    updatePropertyEditor();
    updateStatusBar();
    updateToolbarButtons();
  } else {
    console.log('No object at clicked position');
    editorState.selectedObjectId = null;
    sceneTree.clearSelection();
    updatePropertyEditor();
    updateStatusBar();
    updateToolbarButtons();
    // Update cursor immediately when deselecting
    const hoveredObjectId = findObjectAtPosition(x, y);
    canvas.style.cursor = hoveredObjectId ? 'move' : 'default';
  }
}

function handleMouseDown(x, y) {
  if (!editorState.particleSystem) return;

  // Find the object at the mouse position
  const objectId = findObjectAtPosition(x, y);
  if (objectId) {
    const obj = findObjectById(objectId);
    if (obj) {
      // Check if clicking on selected object's border (resize takes priority)
      if (objectId === editorState.selectedObjectId) {
        const resizeEdge = detectResizeEdge(objectId, x, y);
        if (resizeEdge) {
          // Start resizing
          editorState.isResizing = true;
          editorState.resizeObjectId = objectId;
          editorState.resizeEdge = resizeEdge;
          editorState.resizeStartMousePos = { x, y };
          editorState.resizeStartObjectData = getObjectResizeData(obj);
          canvas.style.cursor = getResizeCursor(resizeEdge);
          return;
        }
      }

      // Start dragging
      editorState.isDragging = true;
      editorState.dragObjectId = objectId;
      editorState.dragStartMousePos = { x, y };
      editorState.dragStartObjectPos = getObjectPosition(obj);
      canvas.style.cursor = 'move';

      // Select the object if not already selected
      if (editorState.selectedObjectId !== objectId) {
        editorState.selectedObjectId = objectId;
        syncTreeViewSelection(objectId);
        updatePropertyEditor();
        updateStatusBar();
        updateToolbarButtons();
      }
    }
  }
}

function handleMouseDrag(x, y) {
  if (!editorState.isDragging || !editorState.dragObjectId) return;

  const obj = findObjectById(editorState.dragObjectId);
  if (!obj) return;

  // Calculate new position
  const dx = x - editorState.dragStartMousePos.x;
  const dy = y - editorState.dragStartMousePos.y;
  const newPos = {
    x: editorState.dragStartObjectPos.x + dx,
    y: editorState.dragStartObjectPos.y + dy,
  };

  // Update object position
  setObjectPosition(obj, newPos);

  // Update the particle system object
  const psObject = findParticleSystemObject(obj.id);
  if (psObject) {
    updateParticleSystemObjectPosition(psObject, obj);
  }

  updatePropertyEditor();
}

function handleMouseResize(x, y) {
  if (!editorState.isResizing || !editorState.resizeObjectId) return;

  const obj = findObjectById(editorState.resizeObjectId);
  if (!obj) return;

  const dx = x - editorState.resizeStartMousePos.x;
  const dy = y - editorState.resizeStartMousePos.y;
  const edge = editorState.resizeEdge;

  // Apply resize based on object type and edge
  switch (obj.type) {
    case 'emitter':
      resizeEmitter(obj, edge, dx, dy);
      break;
    case 'attractor':
      resizeAttractor(obj, edge, dx, dy);
      break;
    case 'sink':
      resizeSink(obj, edge, dx, dy);
      break;
    case 'collider':
      if (obj.geometry.type === 'rectangle') {
        resizeRectangleCollider(obj, edge, dx, dy);
      } else if (obj.geometry.type === 'circle') {
        resizeCircleCollider(obj, edge, dx, dy);
      }
      break;
  }

  // Update the particle system object
  const psObject = findParticleSystemObject(obj.id);
  if (psObject) {
    updateParticleSystemObject(psObject, obj);
  }

  updatePropertyEditor();
}

function resizeEmitter(obj, edge, dx, dy) {
  const startData = editorState.resizeStartObjectData;
  const minSize = 20;

  switch (edge) {
    case 'n':
      obj.size.y = Math.max(minSize, startData.size.y - dy * 2);
      break;
    case 's':
      obj.size.y = Math.max(minSize, startData.size.y + dy * 2);
      break;
    case 'e':
      obj.size.x = Math.max(minSize, startData.size.x + dx * 2);
      break;
    case 'w':
      obj.size.x = Math.max(minSize, startData.size.x - dx * 2);
      break;
    case 'ne':
      obj.size.y = Math.max(minSize, startData.size.y - dy * 2);
      obj.size.x = Math.max(minSize, startData.size.x + dx * 2);
      break;
    case 'nw':
      obj.size.y = Math.max(minSize, startData.size.y - dy * 2);
      obj.size.x = Math.max(minSize, startData.size.x - dx * 2);
      break;
    case 'se':
      obj.size.y = Math.max(minSize, startData.size.y + dy * 2);
      obj.size.x = Math.max(minSize, startData.size.x + dx * 2);
      break;
    case 'sw':
      obj.size.y = Math.max(minSize, startData.size.y + dy * 2);
      obj.size.x = Math.max(minSize, startData.size.x - dx * 2);
      break;
  }
}

function resizeAttractor(obj, edge, dx, dy) {
  const startData = editorState.resizeStartObjectData;
  const minRange = 10;

  // Calculate radial distance change based on edge direction
  let delta = 0;
  switch (edge) {
    case 'n':
      delta = -dy;
      break;
    case 's':
      delta = dy;
      break;
    case 'e':
      delta = dx;
      break;
    case 'w':
      delta = -dx;
      break;
    case 'ne':
    case 'se':
    case 'sw':
    case 'nw':
      // For diagonal directions, use average of both components
      delta = (Math.abs(dx) + Math.abs(dy)) / 2;
      // Determine sign based on whether we're moving outward or inward
      const outward = (edge === 'ne' && (dx > 0 || dy < 0)) ||
                      (edge === 'se' && (dx > 0 || dy > 0)) ||
                      (edge === 'sw' && (dx < 0 || dy > 0)) ||
                      (edge === 'nw' && (dx < 0 || dy < 0));
      delta = outward ? delta : -delta;
      break;
  }

  obj.range = Math.max(minRange, startData.range + delta);
}

function resizeSink(obj, edge, dx, dy) {
  const startData = editorState.resizeStartObjectData;
  const minRange = 10;

  // Calculate radial distance change based on edge direction
  let delta = 0;
  switch (edge) {
    case 'n':
      delta = -dy;
      break;
    case 's':
      delta = dy;
      break;
    case 'e':
      delta = dx;
      break;
    case 'w':
      delta = -dx;
      break;
    case 'ne':
    case 'se':
    case 'sw':
    case 'nw':
      // For diagonal directions, use average of both components
      delta = (Math.abs(dx) + Math.abs(dy)) / 2;
      // Determine sign based on whether we're moving outward or inward
      const outward = (edge === 'ne' && (dx > 0 || dy < 0)) ||
                      (edge === 'se' && (dx > 0 || dy > 0)) ||
                      (edge === 'sw' && (dx < 0 || dy > 0)) ||
                      (edge === 'nw' && (dx < 0 || dy < 0));
      delta = outward ? delta : -delta;
      break;
  }

  obj.range = Math.max(minRange, startData.range + delta);
}

function resizeRectangleCollider(obj, edge, dx, dy) {
  const startData = editorState.resizeStartObjectData;
  const minSize = 20;

  switch (edge) {
    case 'n':
      obj.geometry.size.y = Math.max(minSize, startData.size.y - dy * 2);
      break;
    case 's':
      obj.geometry.size.y = Math.max(minSize, startData.size.y + dy * 2);
      break;
    case 'e':
      obj.geometry.size.x = Math.max(minSize, startData.size.x + dx * 2);
      break;
    case 'w':
      obj.geometry.size.x = Math.max(minSize, startData.size.x - dx * 2);
      break;
    case 'ne':
      obj.geometry.size.y = Math.max(minSize, startData.size.y - dy * 2);
      obj.geometry.size.x = Math.max(minSize, startData.size.x + dx * 2);
      break;
    case 'nw':
      obj.geometry.size.y = Math.max(minSize, startData.size.y - dy * 2);
      obj.geometry.size.x = Math.max(minSize, startData.size.x - dx * 2);
      break;
    case 'se':
      obj.geometry.size.y = Math.max(minSize, startData.size.y + dy * 2);
      obj.geometry.size.x = Math.max(minSize, startData.size.x + dx * 2);
      break;
    case 'sw':
      obj.geometry.size.y = Math.max(minSize, startData.size.y + dy * 2);
      obj.geometry.size.x = Math.max(minSize, startData.size.x - dx * 2);
      break;
  }
}

function resizeCircleCollider(obj, edge, dx, dy) {
  const startData = editorState.resizeStartObjectData;
  const minRadius = 10;
  const avgDelta = (dx + dy) / 2;
  obj.geometry.radius = Math.max(minRadius, startData.radius + avgDelta);
}

function detectResizeEdge(objectId, x, y) {
  const obj = findObjectById(objectId);
  if (!obj) return null;

  const threshold = RESIZE_HANDLE_SIZE;

  switch (obj.type) {
    case 'emitter': {
      const halfSize = { x: obj.size.x / 2, y: obj.size.y / 2 };
      const bounds = {
        left: obj.position.x - halfSize.x,
        right: obj.position.x + halfSize.x,
        top: obj.position.y - halfSize.y,
        bottom: obj.position.y + halfSize.y,
      };
      return detectRectangleEdge(x, y, bounds, threshold);
    }
    case 'attractor': {
      const dx = x - obj.position.x;
      const dy = y - obj.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (Math.abs(dist - obj.range) <= threshold) {
        // Calculate angle to determine cursor direction
        const angle = Math.atan2(dy, dx);
        const PI = Math.PI;

        // Map angle to 8 directions (n, ne, e, se, s, sw, w, nw)
        if (angle >= -PI / 8 && angle < PI / 8) return 'e';
        if (angle >= PI / 8 && angle < 3 * PI / 8) return 'se';
        if (angle >= 3 * PI / 8 && angle < 5 * PI / 8) return 's';
        if (angle >= 5 * PI / 8 && angle < 7 * PI / 8) return 'sw';
        if (angle >= 7 * PI / 8 || angle < -7 * PI / 8) return 'w';
        if (angle >= -7 * PI / 8 && angle < -5 * PI / 8) return 'nw';
        if (angle >= -5 * PI / 8 && angle < -3 * PI / 8) return 'n';
        if (angle >= -3 * PI / 8 && angle < -PI / 8) return 'ne';
      }
      return null;
    }
    case 'sink': {
      const dx = x - obj.position.x;
      const dy = y - obj.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (Math.abs(dist - obj.range) <= threshold) {
        // Calculate angle to determine cursor direction
        const angle = Math.atan2(dy, dx);
        const PI = Math.PI;

        // Map angle to 8 directions (n, ne, e, se, s, sw, w, nw)
        if (angle >= -PI / 8 && angle < PI / 8) return 'e';
        if (angle >= PI / 8 && angle < 3 * PI / 8) return 'se';
        if (angle >= 3 * PI / 8 && angle < 5 * PI / 8) return 's';
        if (angle >= 5 * PI / 8 && angle < 7 * PI / 8) return 'sw';
        if (angle >= 7 * PI / 8 || angle < -7 * PI / 8) return 'w';
        if (angle >= -7 * PI / 8 && angle < -5 * PI / 8) return 'nw';
        if (angle >= -5 * PI / 8 && angle < -3 * PI / 8) return 'n';
        if (angle >= -3 * PI / 8 && angle < -PI / 8) return 'ne';
      }
      return null;
    }
    case 'collider': {
      if (obj.geometry.type === 'rectangle') {
        const halfSize = { x: obj.geometry.size.x / 2, y: obj.geometry.size.y / 2 };
        const bounds = {
          left: obj.geometry.position.x - halfSize.x,
          right: obj.geometry.position.x + halfSize.x,
          top: obj.geometry.position.y - halfSize.y,
          bottom: obj.geometry.position.y + halfSize.y,
        };
        return detectRectangleEdge(x, y, bounds, threshold);
      } else if (obj.geometry.type === 'circle') {
        const dx = x - obj.geometry.position.x;
        const dy = y - obj.geometry.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (Math.abs(dist - obj.geometry.radius) <= threshold) {
          // Calculate angle to determine cursor direction
          const angle = Math.atan2(dy, dx);
          const PI = Math.PI;

          // Map angle to 8 directions (n, ne, e, se, s, sw, w, nw)
          if (angle >= -PI / 8 && angle < PI / 8) return 'e';
          if (angle >= PI / 8 && angle < 3 * PI / 8) return 'se';
          if (angle >= 3 * PI / 8 && angle < 5 * PI / 8) return 's';
          if (angle >= 5 * PI / 8 && angle < 7 * PI / 8) return 'sw';
          if (angle >= 7 * PI / 8 || angle < -7 * PI / 8) return 'w';
          if (angle >= -7 * PI / 8 && angle < -5 * PI / 8) return 'nw';
          if (angle >= -5 * PI / 8 && angle < -3 * PI / 8) return 'n';
          if (angle >= -3 * PI / 8 && angle < -PI / 8) return 'ne';
        }
      }
      return null;
    }
    default:
      return null;
  }
}

function detectRectangleEdge(x, y, bounds, threshold) {
  const nearLeft = Math.abs(x - bounds.left) <= threshold;
  const nearRight = Math.abs(x - bounds.right) <= threshold;
  const nearTop = Math.abs(y - bounds.top) <= threshold;
  const nearBottom = Math.abs(y - bounds.bottom) <= threshold;

  const inHorizontal = x >= bounds.left - threshold && x <= bounds.right + threshold;
  const inVertical = y >= bounds.top - threshold && y <= bounds.bottom + threshold;

  // Check corners first
  if (nearTop && nearLeft && inHorizontal && inVertical) return 'nw';
  if (nearTop && nearRight && inHorizontal && inVertical) return 'ne';
  if (nearBottom && nearLeft && inHorizontal && inVertical) return 'sw';
  if (nearBottom && nearRight && inHorizontal && inVertical) return 'se';

  // Check edges
  if (nearTop && inHorizontal) return 'n';
  if (nearBottom && inHorizontal) return 's';
  if (nearLeft && inVertical) return 'w';
  if (nearRight && inVertical) return 'e';

  return null;
}

function getResizeCursor(edge) {
  const cursors = {
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    ne: 'nesw-resize',
    sw: 'nesw-resize',
    nw: 'nwse-resize',
    se: 'nwse-resize',
  };
  return cursors[edge] || 'default';
}

function getObjectResizeData(obj) {
  switch (obj.type) {
    case 'emitter':
      return { size: { ...obj.size } };
    case 'attractor':
      return { range: obj.range };
    case 'sink':
      return { range: obj.range };
    case 'collider':
      if (obj.geometry.type === 'rectangle') {
        return { size: { ...obj.geometry.size } };
      } else if (obj.geometry.type === 'circle') {
        return { radius: obj.geometry.radius };
      }
      return {};
    default:
      return {};
  }
}

function handleMouseUp() {
  if (editorState.isDragging) {
    // Check if position actually changed
    const obj = findObjectById(editorState.dragObjectId);
    if (obj) {
      const currentPos = getObjectPosition(obj);
      const moved =
        currentPos.x !== editorState.dragStartObjectPos.x ||
        currentPos.y !== editorState.dragStartObjectPos.y;

      if (moved) {
        // Only take snapshot if object was actually moved
        takeSnapshot(`Move ${obj.type}`);
        editorState.dirty = true;
        updateTitle();
      }
    }

    // Reset drag state
    editorState.isDragging = false;
    editorState.dragObjectId = null;
    editorState.dragStartMousePos = null;
    editorState.dragStartObjectPos = null;
  }

  if (editorState.isResizing) {
    // Check if size actually changed
    const obj = findObjectById(editorState.resizeObjectId);
    if (obj) {
      const currentData = getObjectResizeData(obj);
      const changed = JSON.stringify(currentData) !== JSON.stringify(editorState.resizeStartObjectData);

      if (changed) {
        // Only take snapshot if object was actually resized
        takeSnapshot(`Resize ${obj.type}`);
        editorState.dirty = true;
        updateTitle();
      }
    }

    // Reset resize state
    editorState.isResizing = false;
    editorState.resizeObjectId = null;
    editorState.resizeEdge = null;
    editorState.resizeStartMousePos = null;
    editorState.resizeStartObjectData = null;
  }

  // Reset cursor
  if (!editorState.isDragging && !editorState.isResizing) {
    if (!editorState.particleSystem) {
      canvas.style.cursor = 'default';
    } else {
      const hoveredObjectId = findObjectAtPosition(
        editorState.mousePosition.x,
        editorState.mousePosition.y
      );
      if (hoveredObjectId === editorState.selectedObjectId) {
        const resizeEdge = detectResizeEdge(
          hoveredObjectId,
          editorState.mousePosition.x,
          editorState.mousePosition.y
        );
        canvas.style.cursor = resizeEdge ? getResizeCursor(resizeEdge) : 'move';
      } else if (hoveredObjectId) {
        canvas.style.cursor = 'move';
      } else {
        canvas.style.cursor = 'default';
      }
    }
  }
}

function handleTreeSelection(event) {
  console.log('Tree selection changed:', event.detail);

  const { selectedItems } = event.detail;
  if (selectedItems && selectedItems.length > 0) {
    const selectedItem = selectedItems[0];
    const objectId = selectedItem.id;
    console.log('Selected object:', objectId);
    editorState.selectedObjectId = objectId;
    updatePropertyEditor();
    updateStatusBar();
    updateToolbarButtons();
  } else {
    console.log('No object selected in tree view');
    editorState.selectedObjectId = null;
    updatePropertyEditor();
    updateStatusBar();
    updateToolbarButtons();
  }
}

function handleHistorySelection(event) {
  console.log('History selection changed:', event.detail);

  const { selectedItems } = event.detail;
  if (selectedItems && selectedItems.length > 0) {
    const selectedItem = selectedItems[0];
    const historyIndex = parseInt(selectedItem.id, 10);
    console.log('Selected history index:', historyIndex);
    jumpToHistoryIndex(historyIndex);
  }
}

function handlePropertyChange(event) {
  console.log('Property changed:', event.detail);

  if (!propertyEditor.objectId) return;

  propertyEditor.validate();
  if (propertyEditor.isValid()) {
    // Unflatten the editor value back to the original structure
    const obj = findObjectById(propertyEditor.objectId);
    if (obj) {
      const unflattenedValue = unflattenObjectFromEditor(propertyEditor.value, obj.type);
      updateObjectProperties(
        propertyEditor.objectId,
        unflattenedValue,
        event.detail.path.join('.')
      );
    }
  }
}

function handleSettingsChange(event) {
  console.log('Settings changed:', event.detail);

  settingsEditor.validate();
  if (settingsEditor.isValid()) {
    editorState.settings = {
      ...editorState.settings,
      ...settingsEditor.value,
    };
    resizeCanvas();
  }
}

// -----------------------------------------------------------------------------
// Project management
// -----------------------------------------------------------------------------

function newProject() {
  // Clear history first
  editorState.history = {
    snapshots: [],
    currentIndex: -1,
  };

  editorState.projectName = 'Untitled';
  editorState.particleSystem = new window.ParticleSystem();
  editorState.objects = {
    emitters: [],
    attractors: [],
    forceFields: [],
    colliders: [],
    sinks: [],
  };
  editorState.images = {};
  editorState.selectedObjectId = null;
  editorState.dirty = false;

  // Create initial snapshot
  takeSnapshot('New project');

  updateTreeView();
  updatePropertyEditor();
  updateHistoryView();
  updateToolbarButtons();
  updateTitle();
  resetSimulation();

  console.log('New project created');
}

function openProject() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      loadProjectData(data);
      editorState.projectName = file.name.replace('.json', '');
      editorState.dirty = false;
      updateTitle();
      console.log('Project loaded:', file.name);
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Error loading project: ' + error.message);
    }
  };
  input.click();
}

async function saveProject() {
  // Prompt for name if the project is still "Untitled"
  if (!editorState.projectName || editorState.projectName === 'Untitled') {
    editorState.projectName = await namePrompt.show();
    // If user cancelled the prompt, abort the save operation
    if (!editorState.projectName) {
      return;
    }
    updateTitle();
  }

  const data = serializeProject();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${editorState.projectName || 'particle-system'}.json`;
  a.click();
  URL.revokeObjectURL(url);
  editorState.dirty = false;
  updateTitle();
  console.log('Project saved');
}

function serializeProject() {
  // Serialize images with their data URLs
  const serializedImages = {};
  for (const [id, img] of Object.entries(editorState.images)) {
    serializedImages[id] = {
      id: img.id,
      filename: img.filename,
      dataUrl: img.dataUrl
    };
  }

  return {
    name: editorState.projectName,
    emitters: editorState.objects.emitters,
    attractors: editorState.objects.attractors,
    forceFields: editorState.objects.forceFields,
    colliders: editorState.objects.colliders,
    sinks: editorState.objects.sinks,
    images: serializedImages,
  };
}

function loadProjectData(data) {
  editorState.projectName = data.name || 'Untitled';

  // Handle both new format (flat) and old format (nested in objects)
  if (data.objects) {
    // Old format with nested objects
    editorState.objects = data.objects;
  } else {
    // New flat format
    editorState.objects = {
      emitters: data.emitters || [],
      attractors: data.attractors || [],
      forceFields: data.forceFields || [],
      colliders: data.colliders || [],
      sinks: data.sinks || [],
    };
  }

  // Load images
  editorState.images = {};
  if (data.images) {
    for (const [id, imgData] of Object.entries(data.images)) {
      const img = new Image();
      img.src = imgData.dataUrl;

      editorState.images[id] = {
        id: imgData.id,
        filename: imgData.filename,
        dataUrl: imgData.dataUrl,
        element: img,
        loaded: true
      };
    }
  }

  // Recreate particle system from data
  recreateParticleSystem();

  // Reset history
  editorState.history = {
    snapshots: [],
    currentIndex: -1,
  };

  // Create initial snapshot
  takeSnapshot('Project loaded');

  updateTreeView();
  updatePropertyEditor();
  updateHistoryView();
  updateToolbarButtons();
  resetSimulation();
}

function recreateParticleSystem() {
  editorState.particleSystem = new window.ParticleSystem();

  // Recreate emitters
  for (const def of editorState.objects.emitters) {
    // Ensure particle options exist for backward compatibility
    if (def.options?.particles && !def.options.particles.options) {
      def.options.particles.options = {
        useAttractors: true,
        useForceFields: true,
        useColliders: true,
        useSinks: true,
        defaultUpdates: 'all',
        defaultDraws: 'all',
      };
    }

    // Deep clone the options to avoid modifying the original
    const clonedOptions = JSON.parse(JSON.stringify(def.options));

    // Convert particle generation function strings to actual functions
    if (def.customFunctions) {
      for (const [key, fnData] of Object.entries(def.customFunctions)) {
        // Handle both old format (string) and new format (object)
        let code = null;
        let enabled = false;

        if (typeof fnData === 'string') {
          // Old format: just a string
          code = fnData;
          enabled = true;
        } else if (fnData && typeof fnData === 'object') {
          // New format: { enabled, code }
          code = fnData.code;
          enabled = fnData.enabled;
        }

        if (enabled && code) {
          try {
            // Create the function with only 'n' parameter
            const fn = new Function('n', code);
            clonedOptions.particles[key] = fn;
          } catch (err) {
            console.error(`Error creating ${key} function for emitter ${def.id}:`, err);
          }
        }
      }
    }

    // Convert custom emission control function
    if (def.customEmissionFunction) {
      const fnData = def.customEmissionFunction;
      let code = null;
      let enabled = false;

      if (typeof fnData === 'string') {
        code = fnData;
        enabled = true;
      } else if (fnData && typeof fnData === 'object') {
        code = fnData.code;
        enabled = fnData.enabled;
      }

      if (enabled && code) {
        try {
          const fn = new Function(code);
          clonedOptions.emission.f = fn;
          clonedOptions.emission.type = 'custom';
        } catch (err) {
          console.error(`Error creating emission control function for emitter ${def.id}:`, err);
        }
      }
    }

    // Convert particle lifecycle hooks
    if (def.customLifecycleHooks) {
      if (!clonedOptions.particles.options) {
        clonedOptions.particles.options = {};
      }

      for (const [key, fnData] of Object.entries(def.customLifecycleHooks)) {
        let code = null;
        let enabled = false;

        if (typeof fnData === 'string') {
          code = fnData;
          enabled = true;
        } else if (fnData && typeof fnData === 'object') {
          code = fnData.code;
          enabled = fnData.enabled;
        }

        if (enabled && code) {
          try {
            let fn;
            if (key === 'update') {
              fn = new Function('system', 'dt', code);
            } else if (key === 'preDraw' || key === 'postDraw') {
              fn = new Function('system', 'context', code);
            }
            clonedOptions.particles.options[key] = fn;
          } catch (err) {
            console.error(`Error creating ${key} lifecycle hook for emitter ${def.id}:`, err);
          }
        }
      }
    }

    // Convert image IDs to HTMLImageElements
    if (clonedOptions?.particles?.style?.style === 'image') {
      const imageId = clonedOptions.particles.style.image;
      if (typeof imageId === 'string' && editorState.images[imageId]) {
        clonedOptions.particles.style.image = editorState.images[imageId].element;
      } else if (typeof imageId === 'string') {
        console.warn(`Image ID "${imageId}" not found in loaded images`);
        // Keep the string ID, but particle won't render properly
      }
    }

    const emitter = new window.Emitter(
      def.position,
      def.size,
      def.lifespan,
      clonedOptions
    );
    emitter._id = def.id;
    editorState.particleSystem.emitters.push(emitter);
  }

  // Recreate attractors
  for (const def of editorState.objects.attractors) {
    const attractor = new window.Attractor(
      def.position,
      def.range,
      def.force,
      def.falloff,
      def.lifespan,
      def.id
    );
    editorState.particleSystem.attractors.push(attractor);
  }

  // Recreate force fields
  for (const def of editorState.objects.forceFields) {
    // Convert customForce 'none' to undefined for the constructor
    const customForce = def.customForce === 'none' ? undefined : def.customForce;

    const forceField = new window.ForceField(
      def.force,
      def.lifespan,
      customForce,
      def.customForceParams,
      def.id
    );

    // Apply custom force function if defined
    if (def.customForceFunction) {
      const fnData = def.customForceFunction;
      let code = null;
      let enabled = false;

      if (typeof fnData === 'string') {
        code = fnData;
        enabled = true;
      } else if (fnData && typeof fnData === 'object') {
        code = fnData.code;
        enabled = fnData.enabled;
      }

      if (enabled && code) {
        try {
          const fn = new Function('system', 'forceField', 'dt', code);
          forceField.customForce = fn;
        } catch (err) {
          console.error(`Error creating custom force function for forcefield ${def.id}:`, err);
        }
      }
    }

    editorState.particleSystem.forceFields.push(forceField);
  }

  // Recreate colliders
  for (const def of editorState.objects.colliders) {
    const collider = new window.Collider(
      def.geometry,
      def.restitution,
      def.friction,
      def.randomness,
      def.id
    );
    editorState.particleSystem.colliders.push(collider);
  }

  // Recreate sinks
  for (const def of editorState.objects.sinks) {
    const sink = new window.Sink(
      def.position,
      def.range,
      def.strength,
      def.falloff,
      def.mode,
      def.lifespan,
      def.id
    );
    editorState.particleSystem.sinks.push(sink);
  }
}

// -----------------------------------------------------------------------------
// Object creation
// -----------------------------------------------------------------------------

function createEmitter(position) {
  const def = {
    ...JSON.parse(JSON.stringify(DEFAULT_EMITTER)),
    id: generateId('emitter'),
  };

  // Use provided position or default
  if (position) {
    def.position = { x: position.x, y: position.y };
  }

  const emitter = new window.Emitter(
    def.position,
    def.size,
    def.lifespan,
    def.options
  );
  emitter._id = def.id;

  editorState.particleSystem.emitters.push(emitter);
  editorState.objects.emitters.push(def);

  takeSnapshot('Create emitter');
  updateTreeView();
  updateToolbarButtons();
  editorState.dirty = true;
  updateTitle();

  console.log('Emitter created:', def.id);
}

function createAttractor(position) {
  const def = {
    ...JSON.parse(JSON.stringify(DEFAULT_ATTRACTOR)),
    id: generateId('attractor'),
  };

  // Use provided position or default
  if (position) {
    def.position = { x: position.x, y: position.y };
  }

  const attractor = new window.Attractor(
    def.position,
    def.range,
    def.force,
    def.falloff,
    def.lifespan,
    def.id
  );

  editorState.particleSystem.attractors.push(attractor);
  editorState.objects.attractors.push(def);

  takeSnapshot('Create attractor');
  updateTreeView();
  updateToolbarButtons();
  editorState.dirty = true;
  updateTitle();

  console.log('Attractor created:', def.id);
}

function createForceField() {
  const def = {
    ...JSON.parse(JSON.stringify(DEFAULT_FORCEFIELD)),
    id: generateId('forcefield'),
  };

  // Convert customForce 'none' to undefined for the constructor
  const customForce = def.customForce === 'none' ? undefined : def.customForce;

  const forceField = new window.ForceField(
    def.force,
    def.lifespan,
    customForce,
    def.customForceParams,
    def.id
  );

  editorState.particleSystem.forceFields.push(forceField);
  editorState.objects.forceFields.push(def);

  takeSnapshot('Create force field');
  updateTreeView();
  updateToolbarButtons();
  editorState.dirty = true;
  updateTitle();

  console.log('Force field created:', def.id);
}

function createCollider(position) {
  const def = {
    ...JSON.parse(JSON.stringify(DEFAULT_COLLIDER)),
    id: generateId('collider'),
  };

  // Use provided position or default
  if (position) {
    def.geometry.position = { x: position.x, y: position.y };
  }

  const collider = new window.Collider(
    def.geometry,
    def.restitution,
    def.friction,
    def.randomness,
    def.id
  );

  editorState.particleSystem.colliders.push(collider);
  editorState.objects.colliders.push(def);

  takeSnapshot('Create collider');
  updateTreeView();
  updateToolbarButtons();
  editorState.dirty = true;
  updateTitle();

  console.log('Collider created:', def.id);
}

function createSink(position) {
  const def = {
    ...JSON.parse(JSON.stringify(DEFAULT_SINK)),
    id: generateId('sink'),
  };

  // Use provided position or default
  if (position) {
    def.position = { x: position.x, y: position.y };
  }

  const sink = new window.Sink(
    def.position,
    def.range,
    def.strength,
    def.falloff,
    def.mode,
    def.lifespan,
    def.id
  );

  editorState.particleSystem.sinks.push(sink);
  editorState.objects.sinks.push(def);

  takeSnapshot('Create sink');
  updateTreeView();
  updateToolbarButtons();
  editorState.dirty = true;
  updateTitle();

  console.log('Sink created:', def.id);
}

function deleteObject(id) {
  const obj = findObjectById(id);
  if (!obj) return;

  // Remove from particle system
  switch (obj.type) {
    case 'emitter':
      editorState.particleSystem.emitters = editorState.particleSystem.emitters.filter(
        e => e._id !== id
      );
      editorState.objects.emitters = editorState.objects.emitters.filter(
        e => e.id !== id
      );
      break;
    case 'attractor':
      editorState.particleSystem.attractors = editorState.particleSystem.attractors.filter(
        a => a.id !== id
      );
      editorState.objects.attractors = editorState.objects.attractors.filter(
        a => a.id !== id
      );
      break;
    case 'forcefield':
      editorState.particleSystem.forceFields = editorState.particleSystem.forceFields.filter(
        f => f.id !== id
      );
      editorState.objects.forceFields = editorState.objects.forceFields.filter(
        f => f.id !== id
      );
      break;
    case 'collider':
      editorState.particleSystem.colliders = editorState.particleSystem.colliders.filter(
        c => c.id !== id
      );
      editorState.objects.colliders = editorState.objects.colliders.filter(
        c => c.id !== id
      );
      break;
    case 'sink':
      editorState.particleSystem.sinks = editorState.particleSystem.sinks.filter(
        s => s.id !== id
      );
      editorState.objects.sinks = editorState.objects.sinks.filter(
        s => s.id !== id
      );
      break;
  }

  if (editorState.selectedObjectId === id) {
    editorState.selectedObjectId = null;
  }

  takeSnapshot(`Delete ${obj.type}`);
  updateTreeView();
  updatePropertyEditor();
  updateToolbarButtons();
  editorState.dirty = true;
  updateTitle();

  console.log('Object deleted:', id);
}

// -----------------------------------------------------------------------------
// Image management
// -----------------------------------------------------------------------------

async function loadImageFile(file) {
  console.log('Loading image file:', file.name);

  // Read file as data URL
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = async (e) => {
      const dataUrl = e.target.result;

      // Create image element
      const img = new Image();
      img.onload = async () => {
        // Prompt for image ID
        const result = await imageIdPrompt.show();
        if (!result) {
          resolve();
          return;
        }

        const imageId = result.trim();
        if (!imageId) {
          alert('Image ID cannot be empty');
          resolve();
          return;
        }

        // Check for duplicate ID
        if (editorState.images[imageId]) {
          alert(`An image with ID "${imageId}" already exists. Please choose a different ID.`);
          resolve();
          return;
        }

        // Store image
        editorState.images[imageId] = {
          id: imageId,
          filename: file.name,
          dataUrl: dataUrl,
          element: img,
          loaded: true
        };

        takeSnapshot(`Load image: ${imageId}`);
        updateTreeView();
        editorState.dirty = true;
        updateTitle();

        console.log('Image loaded:', imageId);
        resolve();
      };

      img.onerror = () => {
        alert('Failed to load image');
        reject(new Error('Failed to load image'));
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      alert('Failed to read file');
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

function deleteImage(imageId) {
  if (!editorState.images[imageId]) return;

  // Check if image is used in any emitter
  const usedInEmitters = editorState.objects.emitters.filter(emitter => {
    const style = emitter.options?.particles?.style;
    return style?.style === 'image' && style?.image === imageId;
  });

  if (usedInEmitters.length > 0) {
    const emitterIds = usedInEmitters.map(e => e.id).join(', ');
    if (!confirm(`This image is used in emitters: ${emitterIds}. Delete anyway?`)) {
      return;
    }
  }

  delete editorState.images[imageId];

  takeSnapshot(`Delete image: ${imageId}`);
  updateTreeView();
  editorState.dirty = true;
  updateTitle();

  console.log('Image deleted:', imageId);
}

// -----------------------------------------------------------------------------
// Object property updates
// -----------------------------------------------------------------------------

function updateObjectProperties(id, newValues, path) {
  const obj = findObjectById(id);
  if (!obj) return;

  // Update the definition object
  Object.assign(obj, newValues);

  // Update the actual particle system object
  const psObject = findParticleSystemObject(id);
  if (psObject) {
    updateParticleSystemObject(psObject, obj);
  }

  takeSnapshot(`Update ${obj.type}`);
  editorState.dirty = true;
  updateTitle();

  console.log('Object properties updated:', id);
}

function updateParticleSystemObject(psObject, def) {
  switch (def.type) {
    case 'emitter':
      // Recreate emitter with new values
      const emitterIndex = editorState.particleSystem.emitters.findIndex(e => e._id === def.id);
      if (emitterIndex >= 0) {
        const newEmitter = new window.Emitter(
          def.position,
          def.size,
          def.lifespan,
          def.options
        );
        newEmitter._id = def.id;
        editorState.particleSystem.emitters[emitterIndex] = newEmitter;
      }
      break;
    case 'attractor':
      psObject.position = def.position;
      psObject.range = def.range;
      psObject.force = def.force;
      psObject.falloff = def.falloff;
      psObject.lifespan = def.lifespan;
      break;
    case 'sink':
      psObject.position = def.position;
      psObject.range = def.range;
      psObject.strength = def.strength;
      psObject.falloff = def.falloff;
      psObject.mode = def.mode;
      psObject.lifespan = def.lifespan;
      break;
    case 'forcefield':
      psObject.force = def.force;
      psObject.lifespan = def.lifespan;
      // Convert customForce 'none' to undefined
      psObject.customForce = def.customForce === 'none' ? undefined : def.customForce;
      psObject.customForceParams = def.customForceParams;
      break;
    case 'collider':
      psObject.geometry = def.geometry;
      psObject.restitution = def.restitution;
      psObject.friction = def.friction;
      psObject.randomness = def.randomness;
      break;
  }
}

// -----------------------------------------------------------------------------
// History/Undo/Redo
// -----------------------------------------------------------------------------

function takeSnapshot(action) {
  // Serialize images for snapshot (without HTMLImageElement, just metadata)
  const serializedImages = {};
  for (const [id, img] of Object.entries(editorState.images)) {
    serializedImages[id] = {
      id: img.id,
      filename: img.filename,
      dataUrl: img.dataUrl,
      loaded: img.loaded
    };
  }

  const snapshot = {
    action,
    date: new Date(),
    state: JSON.parse(JSON.stringify({
      objects: editorState.objects,
    })),
    images: serializedImages,
  };

  // Remove any snapshots after current index
  if (editorState.history.currentIndex < editorState.history.snapshots.length - 1) {
    editorState.history.snapshots = editorState.history.snapshots.slice(
      0,
      editorState.history.currentIndex + 1
    );
  }

  editorState.history.snapshots.push(snapshot);
  editorState.history.currentIndex = editorState.history.snapshots.length - 1;

  updateHistoryView();
  updateToolbarButtons();
}

function undo() {
  if (!canUndo()) return;

  editorState.history.currentIndex--;
  restoreSnapshot(editorState.history.snapshots[editorState.history.currentIndex]);
  updateHistoryView();
  updateToolbarButtons();

  console.log('Undo');
}

function redo() {
  if (!canRedo()) return;

  editorState.history.currentIndex++;
  restoreSnapshot(editorState.history.snapshots[editorState.history.currentIndex]);
  updateHistoryView();
  updateToolbarButtons();

  console.log('Redo');
}

function canUndo() {
  return editorState.history.currentIndex > 0;
}

function canRedo() {
  return editorState.history.currentIndex < editorState.history.snapshots.length - 1;
}

function jumpToHistoryIndex(index) {
  if (index < 0 || index >= editorState.history.snapshots.length) return;

  editorState.history.currentIndex = index;
  restoreSnapshot(editorState.history.snapshots[index]);
  updateHistoryView();
  updateToolbarButtons();

  console.log('Jumped to history index:', index);
}

function restoreSnapshot(snapshot) {
  editorState.objects = JSON.parse(JSON.stringify(snapshot.state.objects));

  // Restore images
  editorState.images = {};
  if (snapshot.images) {
    for (const [id, imgData] of Object.entries(snapshot.images)) {
      const img = new Image();
      img.src = imgData.dataUrl;

      editorState.images[id] = {
        id: imgData.id,
        filename: imgData.filename,
        dataUrl: imgData.dataUrl,
        element: img,
        loaded: imgData.loaded
      };
    }
  }

  recreateParticleSystem();
  updateTreeView();
  updatePropertyEditor();
  editorState.dirty = true;
  updateTitle();
}

// -----------------------------------------------------------------------------
// Simulation control
// -----------------------------------------------------------------------------

function playSimulation() {
  editorState.isPlaying = true;
  editorState.lastFrameTime = performance.now();
  playToolbarButton.setAttribute('disabled', '');
  pauseToolbarButton.removeAttribute('disabled');
  console.log('Simulation playing');
}

function pauseSimulation() {
  editorState.isPlaying = false;
  playToolbarButton.removeAttribute('disabled');
  pauseToolbarButton.setAttribute('disabled', '');
  console.log('Simulation paused');
}

function resetSimulation() {
  editorState.isPlaying = false;
  recreateParticleSystem();
  editorState.lastFrameTime = performance.now();
  playToolbarButton.removeAttribute('disabled');
  pauseToolbarButton.setAttribute('disabled', '');
  console.log('Simulation reset');
}

function toggleElementsVisibility() {
  editorState.showElements = !editorState.showElements;
  updateToolbarButtons();
  render();
  console.log('Elements visibility:', editorState.showElements);
}

// -----------------------------------------------------------------------------
// UI updates
// -----------------------------------------------------------------------------

function updateTitle() {
  document.title = `${TITLE} - ${editorState.projectName || 'Untitled'}${
    editorState.dirty ? ' (modified)' : ''
  }`;
}

function updateStatusBar() {
  if (!statusBar) return;

  // Update mouse position
  if (mouseStatusBarItem) {
    mouseStatusBarItem.setAttribute(
      'value',
      `(${editorState.mousePosition.x}, ${editorState.mousePosition.y})`
    );
  }

  // Update selection info
  if (selectedStatusBarItem) {
    if (editorState.selectedObjectId) {
      const obj = findObjectById(editorState.selectedObjectId);
      selectedStatusBarItem.setAttribute('value', obj ? `${obj.type} (${obj.id})` : 'Unknown');
    } else {
      selectedStatusBarItem.setAttribute('value', 'None');
    }
  }

  // Update particles count
  if (particlesStatusBarItem && editorState.particleSystem) {
    particlesStatusBarItem.setAttribute(
      'value',
      editorState.particleSystem.particles.length.toString()
    );
  }

  // Update FPS
  if (fpsStatusBarItem) {
    fpsStatusBarItem.setAttribute('value', Math.round(editorState.fps).toString());
  }
}

function flattenObjectForEditor(obj) {
  const flattened = JSON.parse(JSON.stringify(obj));

  // Remove the type field as it's not editable and shown in the title
  delete flattened.type;

  // For emitters, remove the options field since we'll edit it via JSON editor
  if (obj.type === 'emitter' && obj.options) {
    delete flattened.options;
  }

  return flattened;
}

function unflattenObjectFromEditor(flatObj, objectType) {
  const unflattened = JSON.parse(JSON.stringify(flatObj));

  // No special unflattening needed for emitters anymore
  // The options field is edited via JSON editor

  return unflattened;
}

function updateTreeView() {
  if (!sceneTree) return;

  try {
    const items = [];

    // Add emitters
    if (editorState.objects.emitters.length > 0) {
      items.push({
        id: '_emitters',
        label: 'Emitters',
        icon: '💥',
        expanded: true,
        children: editorState.objects.emitters.map(e => ({
          id: e.id,
          label: e.id,
          icon: '💥',
          data: e,
        })),
      });
    }

    // Add attractors
    if (editorState.objects.attractors.length > 0) {
      items.push({
        id: '_attractors',
        label: 'Attractors',
        icon: '🧲',
        expanded: true,
        children: editorState.objects.attractors.map(a => ({
          id: a.id,
          label: a.id,
          icon: '🧲',
          data: a,
        })),
      });
    }

    // Add force fields
    if (editorState.objects.forceFields.length > 0) {
      items.push({
        id: '_forcefields',
        label: 'Force Fields',
        icon: '➡️',
        expanded: true,
        children: editorState.objects.forceFields.map(f => ({
          id: f.id,
          label: f.id,
          icon: '➡️',
          data: f,
        })),
      });
    }

    // Add colliders
    if (editorState.objects.colliders.length > 0) {
      items.push({
        id: '_colliders',
        label: 'Colliders',
        icon: '⬜',
        expanded: true,
        children: editorState.objects.colliders.map(c => ({
          id: c.id,
          label: c.id,
          icon: '⬜',
          data: c,
        })),
      });
    }

    // Add sinks
    if (editorState.objects.sinks.length > 0) {
      items.push({
        id: '_sinks',
        label: 'Sinks',
        icon: '🕳️',
        expanded: true,
        children: editorState.objects.sinks.map(s => ({
          id: s.id,
          label: s.id,
          icon: '🕳️',
          data: s,
        })),
      });
    }

    // Add images
    const imageIds = Object.keys(editorState.images);
    items.push({
      id: '_images',
      label: 'Images',
      icon: '🖼️',
      expanded: true,
      children: imageIds.map(id => {
        const img = editorState.images[id];
        return {
          id: `image_${id}`,
          label: `${id} (${img.filename})`,
          icon: img.loaded ? '🖼️' : '❌',
          data: { type: 'image', id: id, ...img },
        };
      }),
    });

    sceneTree.items = items;
  } catch (error) {
    console.error('Error updating tree view:', error);
  }
}

function updatePropertyEditor() {
  if (!propertyEditor) return;

  if (!editorState.selectedObjectId) {
    propertyEditor.value = {};
    propertyEditor.schema = undefined;
    propertyEditor.objectId = null;
    propertiesTitle.innerText = 'Properties';
    return;
  }

  try {
    const obj = findObjectById(editorState.selectedObjectId);
    if (obj) {
      // Flatten the object for the property editor (supports max 1 level of nesting)
      const flattenedValue = flattenObjectForEditor(obj);

      // Add button functions for emitters to open particle and emission options editors
      if (obj.type === 'emitter') {
        flattenedValue.editParticleOptions = function() {
          openParticleOptionsDialog(obj);
        };
        flattenedValue.editParticleFunctions = function() {
          openParticleFunctionsDialog(obj);
        };
        flattenedValue.editEmissionOptions = function() {
          openEmissionOptionsDialog(obj);
        };
        flattenedValue.editEmissionControl = function() {
          openEmissionControlDialog(obj);
        };
        flattenedValue.editParticleLifecycle = function() {
          openParticleLifecycleDialog(obj);
        };
      }

      // Add button function for forcefields to open custom force params editor
      if (obj.type === 'forcefield') {
        flattenedValue.editCustomForceParams = function() {
          openCustomForceParamsDialog(obj);
        };
        flattenedValue.editCustomForceFunction = function() {
          openCustomForceFunctionDialog(obj);
        };
      }

      propertyEditor.value = flattenedValue;
      propertyEditor.objectId = obj.id;
      propertiesTitle.innerText = `${capitalize(obj.type)} Properties`;

      // Set appropriate schema based on object type
      switch (obj.type) {
        case 'emitter':
          propertyEditor.schema = EMITTER_SCHEMA;
          break;
        case 'attractor':
          propertyEditor.schema = ATTRACTOR_SCHEMA;
          break;
        case 'forcefield':
          propertyEditor.schema = FORCEFIELD_SCHEMA;
          break;
        case 'collider':
          propertyEditor.schema = COLLIDER_SCHEMA;
          break;
        case 'sink':
          propertyEditor.schema = SINK_SCHEMA;
          break;
        default:
          propertyEditor.schema = undefined;
      }
    }
  } catch (error) {
    console.error('Error updating property editor:', error);
  }
}

function updateHistoryView() {
  if (!historyView) return;

  try {
    const { history } = editorState;

    const items = history.snapshots.map(({ action, date }, index) => ({
      id: index.toString(),
      label: (index + 1).toString(),
      data: {
        action,
        date: formatDateForHistoryView(date),
        current: index === history.currentIndex ? '✅' : '⬛',
      },
    }));

    historyView.items = items;

    if (history.currentIndex >= 0 && history.currentIndex < items.length) {
      historyView.deselectAll();
      historyView.selectItem(history.currentIndex.toString());
    }
  } catch (error) {
    console.error('Error updating history view:', error);
  }
}

function updateToolbarButtons() {
  // Save button disabled when no project exists
  if (editorState.particleSystem) {
    saveToolbarButton?.removeAttribute('disabled');
  } else {
    saveToolbarButton?.setAttribute('disabled', '');
  }

  // Create object buttons disabled when no project exists
  if (editorState.particleSystem) {
    newEmitterToolbarButton?.removeAttribute('disabled');
    newAttractorToolbarButton?.removeAttribute('disabled');
    newForceFieldToolbarButton?.removeAttribute('disabled');
    newColliderToolbarButton?.removeAttribute('disabled');
    newSinkToolbarButton?.removeAttribute('disabled');
  } else {
    newEmitterToolbarButton?.setAttribute('disabled', '');
    newAttractorToolbarButton?.setAttribute('disabled', '');
    newForceFieldToolbarButton?.setAttribute('disabled', '');
    newColliderToolbarButton?.setAttribute('disabled', '');
    newSinkToolbarButton?.setAttribute('disabled', '');
  }

  // Delete button enabled when object selected
  if (editorState.selectedObjectId) {
    deleteToolbarButton?.removeAttribute('disabled');
  } else {
    deleteToolbarButton?.setAttribute('disabled', '');
  }

  // Play/Reset buttons disabled when no project exists
  if (editorState.particleSystem) {
    playToolbarButton?.removeAttribute('disabled');
    resetToolbarButton?.removeAttribute('disabled');
  } else {
    playToolbarButton?.setAttribute('disabled', '');
    pauseToolbarButton?.setAttribute('disabled', '');
    resetToolbarButton?.setAttribute('disabled', '');
  }

  // Toggle elements button
  if (editorState.particleSystem) {
    toggleElementsToolbarButton?.removeAttribute('disabled');
    if (toggleElementsToolbarButton) {
      toggleElementsToolbarButton.label = editorState.showElements ? 'Hide Elements' : 'Show Elements';
    }
  } else {
    toggleElementsToolbarButton?.setAttribute('disabled', '');
  }

  // Undo/redo buttons
  if (canUndo()) {
    undoToolbarButton?.removeAttribute('disabled');
  } else {
    undoToolbarButton?.setAttribute('disabled', '');
  }
  if (canRedo()) {
    redoToolbarButton?.removeAttribute('disabled');
  } else {
    redoToolbarButton?.setAttribute('disabled', '');
  }
}

function updateContextMenuButtons() {
  // Create object context menu items disabled when no project exists
  if (editorState.particleSystem) {
    newEmitterContextMenuItem?.removeAttribute('disabled');
    newAttractorContextMenuItem?.removeAttribute('disabled');
    newForceFieldContextMenuItem?.removeAttribute('disabled');
    newColliderContextMenuItem?.removeAttribute('disabled');
    newSinkContextMenuItem?.removeAttribute('disabled');
    loadImageContextMenuItem?.removeAttribute('disabled');
  } else {
    newEmitterContextMenuItem?.setAttribute('disabled', '');
    newAttractorContextMenuItem?.setAttribute('disabled', '');
    newForceFieldContextMenuItem?.setAttribute('disabled', '');
    newColliderContextMenuItem?.setAttribute('disabled', '');
    newSinkContextMenuItem?.setAttribute('disabled', '');
    loadImageContextMenuItem?.setAttribute('disabled', '');
  }

  // Check if context is on Images section or an image item
  const obj = findObjectById(editorState.contextNodeId);
  const isImageItem = obj?.type === 'image';

  // Delete context menu item enabled when an object or image is selected
  if (editorState.contextNodeId && (obj || isImageItem)) {
    deleteContextMenuItem?.removeAttribute('disabled');
  } else {
    deleteContextMenuItem?.setAttribute('disabled', '');
  }
}

function syncTreeViewSelection(id) {
  if (!sceneTree) return;
  sceneTree.clearSelection();
  sceneTree.selectItem(id);
}

// -----------------------------------------------------------------------------
// Render loop
// -----------------------------------------------------------------------------

function startRenderLoop() {
  requestAnimationFrame(renderLoop);
}

function renderLoop(timestamp) {
  // Calculate delta time
  const dt = Math.min((timestamp - editorState.lastFrameTime) / 1000, 1 / 30);
  editorState.lastFrameTime = timestamp;

  // Update FPS counter
  editorState.fpsCounter++;
  editorState.fpsTime += dt;
  if (editorState.fpsTime >= 1) {
    editorState.fps = editorState.fpsCounter / editorState.fpsTime;
    editorState.fpsCounter = 0;
    editorState.fpsTime = 0;
    updateStatusBar();
  }

  // Update particle system if playing
  if (editorState.isPlaying && editorState.particleSystem) {
    editorState.particleSystem.update(dt);
    updateStatusBar();
  }

  // Render
  render();

  requestAnimationFrame(renderLoop);
}

function render() {
  if (!context) return;

  const styles = CANVAS_STYLES[editorState.settings.theme];

  // Clear canvas
  context.fillStyle = styles.background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Show message when no particle system is loaded
  if (!editorState.particleSystem) {
    context.fillStyle = '#666';
    context.font = '16px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('No particle system loaded', canvas.width / 2, canvas.height / 2);
    return;
  }

  // Draw grid
  if (editorState.settings.showGrid) {
    drawGrid(
      { x: 0, y: 0 },
      { x: canvas.width, y: canvas.height },
      {
        ...styles.grid,
        grid: {
          cellSize: editorState.settings.gridSize,
        }
      }
    );
  }

  // Draw particle system
  if (editorState.particleSystem) {
    editorState.particleSystem.draw(context);
  }

  // Draw elements (emitters, attractors, force fields, colliders)
  if (editorState.showElements) {
    // Draw emitters
    for (const def of editorState.objects.emitters) {
      const isSelected = def.id === editorState.selectedObjectId;
      drawEmitter(def, isSelected ? styles.emitterSelected : styles.emitterUnselected);
    }

    // Draw attractors
    for (const def of editorState.objects.attractors) {
      const isSelected = def.id === editorState.selectedObjectId;
      drawAttractor(def, isSelected ? styles.attractorSelected : styles.attractorUnselected);
    }

    // Draw force fields
    for (const def of editorState.objects.forceFields) {
      const isSelected = def.id === editorState.selectedObjectId;
      drawForceField(def, isSelected ? styles.forcefieldSelected : styles.forcefieldUnselected);
    }

    // Draw colliders
    for (const def of editorState.objects.colliders) {
      const isSelected = def.id === editorState.selectedObjectId;
      drawCollider(def, isSelected ? styles.colliderSelected : styles.colliderUnselected);
    }

    // Draw sinks
    for (const def of editorState.objects.sinks) {
      const isSelected = def.id === editorState.selectedObjectId;
      drawSink(def, isSelected ? styles.sinkSelected : styles.sinkUnselected);
    }
  }

  // Update debug display
  Debug.draw(context);
}

function drawEmitter(def, style) {
  drawRectangle(def.position, def.size, { ...style, rectangleAnchor: 'center' });

  // Draw label
  Debug.marker(
    `${def.id}-label`,
    def.id,
    {
      x: def.position.x,
      y: def.position.y - def.size.y / 2 - 20,
    },
    {
      showMarker: false,
      showLabel: false,
      font: '12px sans-serif',
      labelOffset: { x: -def.size.x / 2, y: 0 },
      ...CANVAS_STYLES[editorState.settings.theme].objectLabel,
    }
  );
}

function drawAttractor(def, style) {
  drawCircle(def.position, def.range, style);

  // Draw center point
  drawCircle(def.position, 5, { fill: true, fillColor: style.strokeColor });

  // Draw label
  Debug.marker(
    `${def.id}-label`,
    def.id,
    {
      x: def.position.x + def.range + 10,
      y: def.position.y - 10,
    },
    {
      showMarker: false,
      showLabel: false,
      font: '12px sans-serif',
      labelOffset: { x: 0, y: 0 },
      ...CANVAS_STYLES[editorState.settings.theme].objectLabel,
    }
  );
}

function drawForceField(def, style) {
  // Draw arrow representing force
  const start = { x: canvas.width / 2, y: canvas.height / 2 };
  const scale = 0.2;
  const end = {
    x: start.x + def.force.x * scale,
    y: start.y + def.force.y * scale,
  };

  drawArrow(start, end, { ...style, arrow: { size: 10 } });

  // Draw label
  Debug.marker(
    `${def.id}-label`,
    def.id,
    {
      x: end.x + 10,
      y: end.y,
    },
    {
      showMarker: false,
      showLabel: false,
      font: '12px sans-serif',
      labelOffset: { x: 0, y: 0 },
      ...CANVAS_STYLES[editorState.settings.theme].objectLabel,
    }
  );
}

function drawCollider(def, style) {
  switch (def.geometry.type) {
    case 'circle':
      drawCircle(def.geometry.position, def.geometry.radius, style);
      break;
    case 'rectangle':
      drawRectangle(def.geometry.position, def.geometry.size, { ...style, rectangleAnchor: 'center' });
      break;
    case 'polygon':
      // Draw polygon
      context.beginPath();
      context.moveTo(def.geometry.vertices[0].x, def.geometry.vertices[0].y);
      for (let i = 1; i < def.geometry.vertices.length; i++) {
        context.lineTo(def.geometry.vertices[i].x, def.geometry.vertices[i].y);
      }
      context.closePath();
      context.strokeStyle = style.strokeColor;
      context.lineWidth = style.lineWidth;
      context.stroke();
      break;
  }

  // Draw label
  const pos = def.geometry.position || def.geometry.vertices[0];
  Debug.marker(
    `${def.id}-label`,
    def.id,
    {
      x: pos.x + 5,
      y: pos.y - 5,
    },
    {
      showMarker: false,
      showLabel: false,
      font: '12px sans-serif',
      labelOffset: { x: 0, y: 0 },
      ...CANVAS_STYLES[editorState.settings.theme].objectLabel,
    }
  );
}

function drawSink(def, style) {
  drawCircle(def.position, def.range, style);

  // Draw center point
  drawCircle(def.position, 5, { fill: true, fillColor: style.strokeColor });

  // Draw label
  Debug.marker(
    `${def.id}-label`,
    def.id,
    {
      x: def.position.x + def.range + 10,
      y: def.position.y - 10,
    },
    {
      showMarker: false,
      showLabel: false,
      font: '12px sans-serif',
      labelOffset: { x: 0, y: 0 },
      ...CANVAS_STYLES[editorState.settings.theme].objectLabel,
    }
  );
}

// -----------------------------------------------------------------------------
// Utility functions
// -----------------------------------------------------------------------------

function findObjectById(id) {
  for (const emitter of editorState.objects.emitters) {
    if (emitter.id === id) return emitter;
  }
  for (const attractor of editorState.objects.attractors) {
    if (attractor.id === id) return attractor;
  }
  for (const forceField of editorState.objects.forceFields) {
    if (forceField.id === id) return forceField;
  }
  for (const collider of editorState.objects.colliders) {
    if (collider.id === id) return collider;
  }
  for (const sink of editorState.objects.sinks) {
    if (sink.id === id) return sink;
  }
  return null;
}

function findParticleSystemObject(id) {
  for (const emitter of editorState.particleSystem.emitters) {
    if (emitter._id === id) return emitter;
  }
  for (const attractor of editorState.particleSystem.attractors) {
    if (attractor.id === id) return attractor;
  }
  for (const forceField of editorState.particleSystem.forceFields) {
    if (forceField.id === id) return forceField;
  }
  for (const collider of editorState.particleSystem.colliders) {
    if (collider.id === id) return collider;
  }
  for (const sink of editorState.particleSystem.sinks) {
    if (sink.id === id) return sink;
  }
  return null;
}

function getObjectPosition(obj) {
  switch (obj.type) {
    case 'emitter':
    case 'attractor':
    case 'sink':
      return { ...obj.position };
    case 'forcefield':
      // Force fields don't have a position, return canvas center
      return { x: canvas.width / 2, y: canvas.height / 2 };
    case 'collider':
      if (obj.geometry.type === 'polygon') {
        // For polygons, use the first vertex as reference
        return { ...obj.geometry.vertices[0] };
      }
      return { ...obj.geometry.position };
    default:
      return { x: 0, y: 0 };
  }
}

function setObjectPosition(obj, pos) {
  switch (obj.type) {
    case 'emitter':
    case 'attractor':
    case 'sink':
      obj.position = { ...pos };
      break;
    case 'forcefield':
      // Force fields can't be moved (they affect the whole canvas)
      break;
    case 'collider':
      if (obj.geometry.type === 'polygon') {
        // For polygons, move all vertices by the delta
        const oldPos = obj.geometry.vertices[0];
        const dx = pos.x - oldPos.x;
        const dy = pos.y - oldPos.y;
        obj.geometry.vertices = obj.geometry.vertices.map(v => ({
          x: v.x + dx,
          y: v.y + dy,
        }));
      } else {
        obj.geometry.position = { ...pos };
      }
      break;
  }
}

function updateParticleSystemObjectPosition(psObject, def) {
  switch (def.type) {
    case 'emitter':
      psObject.position = def.position;
      break;
    case 'attractor':
      psObject.position = def.position;
      break;
    case 'sink':
      psObject.position = def.position;
      break;
    case 'forcefield':
      // Force fields don't have positions
      break;
    case 'collider':
      psObject.geometry = def.geometry;
      break;
  }
}

function findObjectAtPosition(x, y) {
  // Check emitters
  for (const def of editorState.objects.emitters) {
    const halfSize = { x: def.size.x / 2, y: def.size.y / 2 };
    if (
      x >= def.position.x - halfSize.x &&
      x <= def.position.x + halfSize.x &&
      y >= def.position.y - halfSize.y &&
      y <= def.position.y + halfSize.y
    ) {
      return def.id;
    }
  }

  // Check attractors
  for (const def of editorState.objects.attractors) {
    const dx = x - def.position.x;
    const dy = y - def.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= def.range) {
      return def.id;
    }
  }

  // Check sinks
  for (const def of editorState.objects.sinks) {
    const dx = x - def.position.x;
    const dy = y - def.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= def.range) {
      return def.id;
    }
  }

  // Check colliders
  for (const def of editorState.objects.colliders) {
    if (def.geometry.type === 'rectangle') {
      const halfSize = { x: def.geometry.size.x / 2, y: def.geometry.size.y / 2 };
      if (
        x >= def.geometry.position.x - halfSize.x &&
        x <= def.geometry.position.x + halfSize.x &&
        y >= def.geometry.position.y - halfSize.y &&
        y <= def.geometry.position.y + halfSize.y
      ) {
        return def.id;
      }
    } else if (def.geometry.type === 'circle') {
      const dx = x - def.geometry.position.x;
      const dy = y - def.geometry.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= def.geometry.radius) {
        return def.id;
      }
    }
  }

  return null;
}

function generateId(type) {
  const existing = [];
  switch (type) {
    case 'emitter':
      existing.push(...editorState.objects.emitters.map(e => e.id));
      break;
    case 'attractor':
      existing.push(...editorState.objects.attractors.map(a => a.id));
      break;
    case 'forcefield':
      existing.push(...editorState.objects.forceFields.map(f => f.id));
      break;
    case 'collider':
      existing.push(...editorState.objects.colliders.map(c => c.id));
      break;
    case 'sink':
      existing.push(...editorState.objects.sinks.map(s => s.id));
      break;
  }

  let counter = 1;
  let id = `${type}-${counter}`;
  while (existing.includes(id)) {
    counter++;
    id = `${type}-${counter}`;
  }
  return id;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDateForHistoryView(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function openParticleOptionsDialog(emitter) {
  if (!emitter || !particleOptionsDialog || !particleOptionsJsonEditor) return;

  // Get the current particle options
  const particleOptions = emitter.options?.particles || {};

  // Clear any existing editor and create new JSONEditor instance
  particleOptionsJsonEditor.innerHTML = '';
  particleOptionsEditor = new JSONEditor(particleOptionsJsonEditor, {
    mode: 'code',
    modes: ['code', 'tree'],
    indentation: 2
  });
  particleOptionsEditor.set(particleOptions);

  // Open the dialog
  particleOptionsDialog.showModal();
}
function openEmissionOptionsDialog(emitter) {
  if (!emitter || !emissionOptionsDialog || !emissionOptionsJsonEditor) return;

  // Get the current emission options
  const emissionOptions = emitter.options?.emission || { type: 'rate', rate: 10 };

  // Clear any existing editor and create new JSONEditor instance
  emissionOptionsJsonEditor.innerHTML = '';
  emissionOptionsEditor = new JSONEditor(emissionOptionsJsonEditor, {
    mode: 'code',
    modes: ['code', 'tree'],
    indentation: 2
  });
  emissionOptionsEditor.set(emissionOptions);

  // Open the dialog
  emissionOptionsDialog.showModal();
}

function openParticleFunctionsDialog(emitter) {
  if (!emitter || !particleFunctionsDialog || !particleFunctionsTextareas) return;

  // Clear any previous status message
  if (particleFunctionsStatusItem) {
    particleFunctionsStatusItem.value = '';
  }

  // Get the current custom functions
  const customFunctions = emitter.customFunctions || {};

  // Default function templates (used when no saved function exists)
  const templates = {
    position: 'return { x: 0, y: 0 };',
    speed: 'return 100;',
    direction: 'return 0;',
    size: 'return { x: 10, y: 10 };',
    rotation: 'return 0;',
    lifespan: 'return 3;',
  };

  // Populate textareas and checkboxes
  for (const [key, textarea] of Object.entries(particleFunctionsTextareas)) {
    const checkbox = particleFunctionsCheckboxes[key];
    const fnData = customFunctions[key];

    // Handle both old format (string) and new format (object)
    if (typeof fnData === 'string') {
      // Old format: just a string
      textarea.value = fnData;
      checkbox.checked = true;
    } else if (fnData && typeof fnData === 'object') {
      // New format: { enabled, code }
      textarea.value = fnData.code || templates[key];
      checkbox.checked = fnData.enabled || false;
    } else {
      // No saved function
      textarea.value = templates[key];
      checkbox.checked = false;
    }

    // Enable/disable textarea based on checkbox
    textarea.disabled = !checkbox.checked;
  }

  // Add event listeners for checkboxes to enable/disable textareas
  for (const [key, checkbox] of Object.entries(particleFunctionsCheckboxes)) {
    checkbox.onchange = () => {
      particleFunctionsTextareas[key].disabled = !checkbox.checked;
    };
  }

  // Open the dialog
  particleFunctionsDialog.showModal();
}

function recreateEmitterWithFunctions(emitterObj) {
  if (!emitterObj || emitterObj.type !== 'emitter') return;

  const psObject = findParticleSystemObject(emitterObj.id);
  if (!psObject) return;

  // Clone options to avoid modifying the definition
  const clonedOptions = JSON.parse(JSON.stringify(emitterObj.options));

  // Convert particle generation function strings to actual functions
  if (emitterObj.customFunctions) {
    for (const [key, fnData] of Object.entries(emitterObj.customFunctions)) {
      // Handle both old format (string) and new format (object)
      let code = null;
      let enabled = false;

      if (typeof fnData === 'string') {
        // Old format: just a string
        code = fnData;
        enabled = true;
      } else if (fnData && typeof fnData === 'object') {
        // New format: { enabled, code }
        code = fnData.code;
        enabled = fnData.enabled;
      }

      if (enabled && code) {
        try {
          // Create the function with only 'n' parameter
          // The function body is the stored string
          const fn = new Function('n', code);
          clonedOptions.particles[key] = fn;
        } catch (err) {
          console.error(`Error creating ${key} function:`, err);
        }
      }
    }
  }

  // Handle custom emission control function
  if (emitterObj.customEmissionFunction) {
    const fnData = emitterObj.customEmissionFunction;
    let code = null;
    let enabled = false;

    if (typeof fnData === 'string') {
      code = fnData;
      enabled = true;
    } else if (fnData && typeof fnData === 'object') {
      code = fnData.code;
      enabled = fnData.enabled;
    }

    if (enabled && code) {
      try {
        const fn = new Function(code);
        clonedOptions.emission.f = fn;
        clonedOptions.emission.type = 'custom';
      } catch (err) {
        console.error('Error creating emission control function:', err);
      }
    }
  }

  // Handle particle lifecycle hooks
  if (emitterObj.customLifecycleHooks) {
    if (!clonedOptions.particles.options) {
      clonedOptions.particles.options = {};
    }

    for (const [key, fnData] of Object.entries(emitterObj.customLifecycleHooks)) {
      let code = null;
      let enabled = false;

      if (typeof fnData === 'string') {
        code = fnData;
        enabled = true;
      } else if (fnData && typeof fnData === 'object') {
        code = fnData.code;
        enabled = fnData.enabled;
      }

      if (enabled && code) {
        try {
          let fn;
          if (key === 'update') {
            fn = new Function('system', 'dt', code);
          } else if (key === 'preDraw' || key === 'postDraw') {
            fn = new Function('system', 'context', code);
          }
          clonedOptions.particles.options[key] = fn;
        } catch (err) {
          console.error(`Error creating ${key} lifecycle hook:`, err);
        }
      }
    }
  }

  // Convert image IDs to HTMLImageElements
  if (clonedOptions?.particles?.style?.style === 'image') {
    const imageId = clonedOptions.particles.style.image;
    if (typeof imageId === 'string' && editorState.images[imageId]) {
      clonedOptions.particles.style.image = editorState.images[imageId].element;
    }
  }

  // Recreate the emitter with converted options
  const emitterIndex = editorState.particleSystem.emitters.findIndex(e => e._id === emitterObj.id);
  if (emitterIndex >= 0) {
    const newEmitter = new window.Emitter(
      emitterObj.position,
      emitterObj.size,
      emitterObj.lifespan,
      clonedOptions
    );
    newEmitter._id = emitterObj.id;
    editorState.particleSystem.emitters[emitterIndex] = newEmitter;
  }
}

function recreateForceFieldWithFunction(forcefieldObj) {
  if (!forcefieldObj || forcefieldObj.type !== 'forcefield') return;

  const psObject = findParticleSystemObject(forcefieldObj.id);
  if (!psObject) return;

  // Get the custom force function
  const fnData = forcefieldObj.customForceFunction;
  
  // Handle both old format (string) and new format (object)
  let code = null;
  let enabled = false;

  if (typeof fnData === 'string') {
    code = fnData;
    enabled = true;
  } else if (fnData && typeof fnData === 'object') {
    code = fnData.code;
    enabled = fnData.enabled;
  }

  // If enabled and has code, set the custom force function
  if (enabled && code) {
    try {
      const fn = new Function('system', 'forceField', 'dt', code);
      psObject.customForce = fn;
    } catch (err) {
      console.error('Error creating custom force function:', err);
    }
  } else {
    // Remove custom force if disabled
    delete psObject.customForce;
  }
}

function openCustomForceParamsDialog(forcefield) {
  if (!forcefield || !customForceParamsDialog || !customForceParamsJsonEditor) return;

  // Get the current custom force parameters
  const customForceParams = forcefield.customForceParams || {};

  // Clear any existing editor and create new JSONEditor instance
  customForceParamsJsonEditor.innerHTML = '';
  customForceParamsEditor = new JSONEditor(customForceParamsJsonEditor, {
    mode: 'code',
    modes: ['code', 'tree'],
    indentation: 2
  });
  customForceParamsEditor.set(customForceParams);

  // Open the dialog
  customForceParamsDialog.showModal();
}
function openEmissionControlDialog(emitter) {
  if (!emitter || !emissionControlDialog || !emissionControlTextarea) return;

  // Clear any previous status message
  if (emissionControlStatusItem) {
    emissionControlStatusItem.value = '';
  }

  // Get the current custom emission function
  const fnData = emitter.customEmissionFunction;

  // Default template
  const template = 'return 1;';

  // Handle both old format (string) and new format (object)
  if (typeof fnData === 'string') {
    emissionControlTextarea.value = fnData;
    emissionControlCheckbox.checked = true;
  } else if (fnData && typeof fnData === 'object') {
    emissionControlTextarea.value = fnData.code || template;
    emissionControlCheckbox.checked = fnData.enabled || false;
  } else {
    emissionControlTextarea.value = template;
    emissionControlCheckbox.checked = false;
  }

  // Enable/disable textarea based on checkbox
  emissionControlTextarea.disabled = !emissionControlCheckbox.checked;

  // Add event listener for checkbox
  emissionControlCheckbox.onchange = () => {
    emissionControlTextarea.disabled = !emissionControlCheckbox.checked;
  };

  // Open the dialog
  emissionControlDialog.showModal();
}

function openParticleLifecycleDialog(emitter) {
  if (!emitter || !particleLifecycleDialog || !particleLifecycleTextareas) return;

  // Clear any previous status message
  if (particleLifecycleStatusItem) {
    particleLifecycleStatusItem.value = '';
  }

  // Get the current custom lifecycle hooks
  const customHooks = emitter.customLifecycleHooks || {};

  // Default function templates
  const templates = {
    update: '// Custom update logic\n// this.velocity.x += 10 * dt;',
    preDraw: '// Set context state\n// context.shadowColor = "black";\n// context.shadowBlur = 10;',
    postDraw: '// Draw additional effects\n// context.fillStyle = "white";\n// context.fillText("!", 0, 0);',
  };

  // Populate textareas and checkboxes
  for (const [key, textarea] of Object.entries(particleLifecycleTextareas)) {
    const checkbox = particleLifecycleCheckboxes[key];
    const fnData = customHooks[key];

    // Handle both old format (string) and new format (object)
    if (typeof fnData === 'string') {
      textarea.value = fnData;
      checkbox.checked = true;
    } else if (fnData && typeof fnData === 'object') {
      textarea.value = fnData.code || templates[key];
      checkbox.checked = fnData.enabled || false;
    } else {
      textarea.value = templates[key];
      checkbox.checked = false;
    }

    // Enable/disable textarea based on checkbox
    textarea.disabled = !checkbox.checked;
  }

  // Add event listeners for checkboxes
  for (const [key, checkbox] of Object.entries(particleLifecycleCheckboxes)) {
    checkbox.onchange = () => {
      particleLifecycleTextareas[key].disabled = !checkbox.checked;
    };
  }

  // Open the dialog
  particleLifecycleDialog.showModal();
}

function openCustomForceFunctionDialog(forcefield) {
  if (!forcefield || !customForceFunctionDialog || !customForceFunctionTextarea) return;

  // Clear any previous status message
  if (customForceFunctionStatusItem) {
    customForceFunctionStatusItem.value = '';
  }

  // Get the current custom force function
  const fnData = forcefield.customForceFunction;

  // Default template
  const template = '// Apply custom force to this particle\n// this.velocity.x += 10 * dt;\n// this.velocity.y += 10 * dt;';

  // Handle both old format (string) and new format (object)
  if (typeof fnData === 'string') {
    customForceFunctionTextarea.value = fnData;
    customForceFunctionCheckbox.checked = true;
  } else if (fnData && typeof fnData === 'object') {
    customForceFunctionTextarea.value = fnData.code || template;
    customForceFunctionCheckbox.checked = fnData.enabled || false;
  } else {
    customForceFunctionTextarea.value = template;
    customForceFunctionCheckbox.checked = false;
  }

  // Enable/disable textarea based on checkbox
  customForceFunctionTextarea.disabled = !customForceFunctionCheckbox.checked;

  // Add event listener for checkbox
  customForceFunctionCheckbox.onchange = () => {
    customForceFunctionTextarea.disabled = !customForceFunctionCheckbox.checked;
  };

  // Open the dialog
  customForceFunctionDialog.showModal();
}