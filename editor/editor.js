// Particle System Editor

// -----------------------------------------------------------------------------
// Globals and editor state
// -----------------------------------------------------------------------------

const TITLE = 'Particle System';
const RESIZE_HANDLE_SIZE = 10;

const SETTINGS_STORAGE_KEY = 'basementuniverse:particle-system-editor:settings';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  canvasMargin: 20,
  showGrid: true,
  gridSize: 10,
};

const editorState = {
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
  // Replaced during initialisation by the EditorCommon-owned settings object
  settings: { ...DEFAULT_SETTINGS },
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
      description:
        'How force decreases with distance (0 = linear, 2 = inverse square)',
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
        x: {
          type: 'number',
          title: 'X Force',
          description: 'Horizontal force in pixels/second²',
        },
        y: {
          type: 'number',
          title: 'Y Force',
          description: 'Vertical force in pixels/second²',
        },
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
      enum: [
        'none',
        'wave',
        'vortex',
        'orbital',
        'vectorField',
        'turbulence',
        'drag',
        'boids',
      ],
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
      description:
        'Random direction offset on collision (0 = none, 1 = maximum)',
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
      description:
        'Distance-based effect gradient (higher = stronger at center)',
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
  required: [
    'id',
    'position',
    'range',
    'strength',
    'falloff',
    'mode',
    'lifespan',
  ],
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
  geometry: {
    type: 'rectangle',
    position: { x: 400, y: 550 },
    size: { x: 800, y: 100 },
  },
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

// Canvas helpers library
let CanvasHelpers;

// Canvas-helpers library functions
let drawGrid, drawCircle, drawRectangle, drawLine, drawArrow;

// DOM elements
let app, tree, content, properties, history;
let canvas, context;
let particleOptionsEditor, emissionOptionsEditor, customForceParamsEditor;
let sceneTree, propertiesTitle, propertyEditor, historyView, settingsEditor;
// Toolbar buttons and context menu items are resolved by EditorCommon.Commands
// from the selectors in their command declarations, and status bar items by
// EditorCommon.StatusBar, so neither needs a variable here. The one exception
// is the toggle-elements button, whose label changes with the state.
let toggleElementsToolbarButton;
let settingsDialog, closeSettingsDialogButton;

// Canvas host from EditorCommon, owns sizing and the resize observer
let canvasHost;
let particleOptionsDialog,
  particleOptionsJsonEditor,
  particleOptionsOkButton,
  particleOptionsCancelButton;
let emissionOptionsDialog,
  emissionOptionsJsonEditor,
  emissionOptionsOkButton,
  emissionOptionsCancelButton;
let particleFunctionsDialog,
  particleFunctionsTextareas,
  particleFunctionsCheckboxes,
  particleFunctionsOkButton,
  particleFunctionsCancelButton,
  particleFunctionsStatusBar,
  particleFunctionsStatusItem;
let emissionControlDialog,
  emissionControlTextarea,
  emissionControlCheckbox,
  emissionControlOkButton,
  emissionControlCancelButton,
  emissionControlStatusBar,
  emissionControlStatusItem;
let particleLifecycleDialog,
  particleLifecycleTextareas,
  particleLifecycleCheckboxes,
  particleLifecycleOkButton,
  particleLifecycleCancelButton,
  particleLifecycleStatusBar,
  particleLifecycleStatusItem;
let customForceParamsDialog,
  customForceParamsJsonEditor,
  customForceParamsOkButton,
  customForceParamsCancelButton;
let customForceFunctionDialog,
  customForceFunctionTextarea,
  customForceFunctionCheckbox,
  customForceFunctionOkButton,
  customForceFunctionCancelButton,
  customForceFunctionStatusBar,
  customForceFunctionStatusItem;
let namePrompt, imageIdPrompt;
let imageFileInput;

// -----------------------------------------------------------------------------
// Initialization
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initialiseEditor();
});

function initialiseEditor() {
  // Check if the Editor Common library is available
  if (!window.EditorCommon) {
    console.error('Editor Common library not found!');
    return;
  }
  const {
    Theme,
    Settings,
    StatusBar,
    HistoryView,
    CanvasHost,
    History,
    Document,
    Commands,
    Shortcuts,
  } = window.EditorCommon;
  console.log('Initializing Particle System Editor...');

  // Check if Particle System library is available
  const PS = window.BasementUniverseParticles2d;
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

  // Check if Canvas Helpers library is available
  CanvasHelpers = window.BasementUniverseCanvasHelpers;
  if (!CanvasHelpers) {
    console.error('Canvas Helpers library not found!');
    return;
  }

  // Check if Debug library is available
  Debug = window.BasementUniverseDebug;
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
    CanvasHelpers.withContext(
      context,
      CanvasHelpers.grid,
      CanvasHelpers.circle,
      CanvasHelpers.rectangle,
      CanvasHelpers.line,
      CanvasHelpers.arrow
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
  toggleElementsToolbarButton = document.getElementById(
    'toggle-elements-toolbar-button'
  );
  settingsDialog = document.getElementById('settings-dialog');
  settingsEditor = document.getElementById('settings-editor');
  closeSettingsDialogButton = document.getElementById(
    'close-settings-dialog-button'
  );
  particleOptionsDialog = document.getElementById('particle-options-dialog');
  particleOptionsJsonEditor = document.getElementById(
    'particle-options-json-editor'
  );
  particleOptionsOkButton = document.getElementById(
    'particle-options-ok-button'
  );
  particleOptionsCancelButton = document.getElementById(
    'particle-options-cancel-button'
  );
  emissionOptionsDialog = document.getElementById('emission-options-dialog');
  emissionOptionsJsonEditor = document.getElementById(
    'emission-options-json-editor'
  );
  emissionOptionsOkButton = document.getElementById(
    'emission-options-ok-button'
  );
  emissionOptionsCancelButton = document.getElementById(
    'emission-options-cancel-button'
  );
  particleFunctionsDialog = document.getElementById(
    'particle-functions-dialog'
  );
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
  particleFunctionsOkButton = document.getElementById(
    'particle-functions-ok-button'
  );
  particleFunctionsCancelButton = document.getElementById(
    'particle-functions-cancel-button'
  );
  particleFunctionsStatusBar = document.getElementById(
    'particle-functions-status-bar'
  );
  particleFunctionsStatusItem = document.getElementById(
    'particle-functions-status-item'
  );
  emissionControlDialog = document.getElementById('emission-control-dialog');
  emissionControlTextarea = document.getElementById('emission-control-code');
  emissionControlCheckbox = document.getElementById('emission-control-enabled');
  emissionControlOkButton = document.getElementById(
    'emission-control-ok-button'
  );
  emissionControlCancelButton = document.getElementById(
    'emission-control-cancel-button'
  );
  emissionControlStatusBar = document.getElementById(
    'emission-control-status-bar'
  );
  emissionControlStatusItem = document.getElementById(
    'emission-control-status-item'
  );
  particleLifecycleDialog = document.getElementById(
    'particle-lifecycle-dialog'
  );
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
  particleLifecycleOkButton = document.getElementById(
    'particle-lifecycle-ok-button'
  );
  particleLifecycleCancelButton = document.getElementById(
    'particle-lifecycle-cancel-button'
  );
  particleLifecycleStatusBar = document.getElementById(
    'particle-lifecycle-status-bar'
  );
  particleLifecycleStatusItem = document.getElementById(
    'particle-lifecycle-status-item'
  );
  customForceParamsDialog = document.getElementById(
    'custom-force-params-dialog'
  );
  customForceParamsJsonEditor = document.getElementById(
    'custom-force-params-json-editor'
  );
  customForceParamsOkButton = document.getElementById(
    'custom-force-params-ok-button'
  );
  customForceParamsCancelButton = document.getElementById(
    'custom-force-params-cancel-button'
  );
  customForceFunctionDialog = document.getElementById(
    'custom-force-function-dialog'
  );
  customForceFunctionTextarea = document.getElementById(
    'custom-force-function-code'
  );
  customForceFunctionCheckbox = document.getElementById(
    'custom-force-function-enabled'
  );
  customForceFunctionOkButton = document.getElementById(
    'custom-force-function-ok-button'
  );
  customForceFunctionCancelButton = document.getElementById(
    'custom-force-function-cancel-button'
  );
  customForceFunctionStatusBar = document.getElementById(
    'custom-force-function-status-bar'
  );
  customForceFunctionStatusItem = document.getElementById(
    'custom-force-function-status-item'
  );
  namePrompt = document.getElementById('name-prompt');
  imageIdPrompt = document.getElementById('image-id-prompt');
  imageFileInput = document.getElementById('image-file-input');

  // Settings, persisted to local storage and merged over the defaults
  editorState.settings = Settings.initialise({
    defaults: DEFAULT_SETTINGS,
    schema: SETTINGS_SCHEMA,
    editor: settingsEditor,
    storageKey: SETTINGS_STORAGE_KEY,
    onChange: () => {
      canvasHost?.resize();
    },
  });

  StatusBar.initialise({
    items: {
      mouse: '#mouse-status',
      selected: '#selected-status',
      particles: '#particles-status',
      fps: '#fps-status',
    },
  });

  HistoryView.initialise({
    view: historyView,
    onSelect: index => History.jumpTo(index),
  });

  Shortcuts.initialise({
    dialog: '#shortcuts-dialog',
    container: '#shortcuts-list',
    closeButton: '#close-shortcuts-dialog-button',
  });

  canvasHost = CanvasHost.initialise({
    canvas,
    container: content,
    observe: [tree, properties, history],
    margin: () => editorState.settings.canvasMargin,
    size: editorState.canvasSize,
  });

  // Theme. Every E2 dialog in the document inherits from e2-app, so the six
  // that used to be listed here no longer need to be
  Theme.initialise({
    app,
    initial: editorState.settings.theme,
  });

  // The document adapter - the single seam between the shared runtime and
  // this editor
  Document.initialise({
    title: TITLE,
    defaultName: 'particle-system',
    extension: '.json',
    description: 'Particle System',
    namePrompt,

    createNew: () => emptyProject(),
    serialize: () => serializeProject(),
    deserialize: data => applyProjectData(data),
    validate: data => isProjectData(data),

    onChange: () => {
      updateStatusBar();
      updateCommands();
    },

    messages: {
      created: 'New particle system created!',
      loaded: 'Particle system loaded successfully!',
      saved: 'Particle system saved successfully!',
      invalid: 'That file is not a valid particle system',
    },
    historyLabels: {
      created: 'New project',
      loaded: 'Project loaded',
    },
  });

  Commands.initialise({
    onAfterRun: () => updateCommands(),
  });
  registerCommands();

  CanvasHost.startRenderLoop(renderFrame, {
    onFpsUpdate: () => updateStatusBar(),
  });

  setupEventListeners();
  updateTitle();
  updateStatusBar();
  updateCommands();

  console.log('Particle System Editor initialised successfully');
}

function setupEventListeners() {
  // Mouse movement tracking
  content.addEventListener('mousemove', e => {
    const rect = content.getBoundingClientRect();
    editorState.mousePosition = {
      x: Math.round(e.clientX - rect.left) - editorState.settings.canvasMargin,
      y: Math.round(e.clientY - rect.top) - editorState.settings.canvasMargin,
    };

    // Handle dragging or resizing
    if (editorState.isDragging) {
      handleMouseDrag(editorState.mousePosition.x, editorState.mousePosition.y);
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
    handleMouseDown(editorState.mousePosition.x, editorState.mousePosition.y);
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

    updateCommands();
  });
  // Tree view selection events
  document.addEventListener('tree-selection-change', e => {
    if (e.target === sceneTree) {
      handleTreeSelection(e);
    }
  });

  // Properties editor changes
  const debouncedHandlePropertyChange = EditorCommon.Utils.debounce(handlePropertyChange, 300);
  propertyEditor.addEventListener(
    'keyvalue-change',
    debouncedHandlePropertyChange
  );

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

        EditorCommon.History.record('Edit Particle Options');
        updatePropertyEditor(obj);
        updateTitle();
      }

      particleOptionsDialog?.close();
      statusBar?.showMessage(
        'Particle options updated successfully',
        'success',
        3000
      );
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
        for (const [key, textarea] of Object.entries(
          particleFunctionsTextareas
        )) {
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
          particleFunctionsStatusBar?.showMessage(
            `Validation errors: ${errors.join(', ')}`,
            'error',
            5000
          );
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

        EditorCommon.History.record('Edit Particle Functions');
        updatePropertyEditor(obj);
        updateTitle();

        particleFunctionsDialog?.close();
        statusBar?.showMessage(
          'Particle functions updated successfully',
          'success',
          3000
        );
      }
    } catch (err) {
      console.error('Error updating particle functions:', err);
      particleFunctionsStatusItem.value = `Error: ${err.message}`;
      particleFunctionsStatusBar?.showMessage(
        `Error: ${err.message}`,
        'error',
        5000
      );
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
          emissionControlStatusBar?.showMessage(
            'Enabled but no code provided',
            'error',
            5000
          );
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
            emissionControlStatusBar?.showMessage(
              `Validation error: ${err.message}`,
              'error',
              5000
            );
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

        EditorCommon.History.record('Edit Emission Control Function');
        updatePropertyEditor(obj);
        updateTitle();

        emissionControlDialog?.close();
      }
    } catch (err) {
      console.error('Error saving emission control function:', err);
      emissionControlStatusItem.value = `Error: ${err.message}`;
      emissionControlStatusBar?.showMessage(
        `Error: ${err.message}`,
        'error',
        5000
      );
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
        for (const [key, textarea] of Object.entries(
          particleLifecycleTextareas
        )) {
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
          particleLifecycleStatusBar?.showMessage(
            `Validation errors: ${errors.join(', ')}`,
            'error',
            5000
          );
          return;
        }

        // Clear any previous error message
        particleLifecycleStatusItem.value = '';

        // Store the function objects in the emitter's custom lifecycle hooks
        obj.customLifecycleHooks = functions;

        // Recreate the emitter with the new functions
        recreateEmitterWithFunctions(obj);

        EditorCommon.History.record('Edit Particle Lifecycle Hooks');
        updatePropertyEditor(obj);
        updateTitle();

        particleLifecycleDialog?.close();
      }
    } catch (err) {
      console.error('Error saving particle lifecycle hooks:', err);
      particleLifecycleStatusItem.value = `Error: ${err.message}`;
      particleLifecycleStatusBar?.showMessage(
        `Error: ${err.message}`,
        'error',
        5000
      );
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
          customForceFunctionStatusBar?.showMessage(
            'Enabled but no code provided',
            'error',
            5000
          );
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
            customForceFunctionStatusBar?.showMessage(
              `Validation error: ${err.message}`,
              'error',
              5000
            );
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

        EditorCommon.History.record('Edit Custom Force Function');
        updatePropertyEditor(obj);
        updateTitle();

        customForceFunctionDialog?.close();
      }
    } catch (err) {
      console.error('Error saving custom force function:', err);
      customForceFunctionStatusItem.value = `Error: ${err.message}`;
      customForceFunctionStatusBar?.showMessage(
        `Error: ${err.message}`,
        'error',
        5000
      );
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

        EditorCommon.History.record('Edit Emission Options');
        updatePropertyEditor(obj);
        updateTitle();
      }

      emissionOptionsDialog?.close();
      statusBar?.showMessage(
        'Emission options updated successfully',
        'success',
        3000
      );
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

        EditorCommon.History.record('Edit Custom Force Parameters');
        updatePropertyEditor(obj);
        updateTitle();
      }

      customForceParamsDialog?.close();
      statusBar?.showMessage(
        'Custom force parameters updated successfully',
        'success',
        3000
      );
    } catch (err) {
      console.error('Invalid JSON:', err);
      alert('Invalid JSON: ' + err.message);
    }
  });

  customForceParamsCancelButton?.addEventListener('click', () => {
    customForceParamsDialog?.close();
  });

  // Image file input handler
  imageFileInput?.addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    await loadImageFile(file);
    imageFileInput.value = ''; // Reset so same file can be loaded again
  });

  // Drag and drop for images
  tree.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  tree.addEventListener('drop', async e => {
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

// -----------------------------------------------------------------------------
// Document adapter
// -----------------------------------------------------------------------------

function emptyProject() {
  return {
    emitters: [],
    attractors: [],
    forceFields: [],
    colliders: [],
    sinks: [],
    images: {},
  };
}

/**
 * Apply project data to the editor
 *
 * Images travel as data URLs, so the HTMLImageElement for each one has to be
 * rebuilt here - that is also why this doubles as the history restore path.
 */
function applyProjectData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Older files nested everything under `objects`
  editorState.objects = data.objects || {
    emitters: data.emitters || [],
    attractors: data.attractors || [],
    forceFields: data.forceFields || [],
    colliders: data.colliders || [],
    sinks: data.sinks || [],
  };

  editorState.images = {};
  for (const [id, imgData] of Object.entries(data.images || {})) {
    const img = new Image();
    img.src = imgData.dataUrl;

    editorState.images[id] = {
      id: imgData.id,
      filename: imgData.filename,
      dataUrl: imgData.dataUrl,
      element: img,
      loaded: true,
    };
  }

  editorState.selectedObjectId = null;
  recreateParticleSystem();
  updateTreeView();
  updatePropertyEditor();
  resetSimulation();

  return true;
}

function isProjectData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid project (not an object)');
  }

  const hasAnyCollection =
    data.objects ||
    data.emitters ||
    data.attractors ||
    data.forceFields ||
    data.colliders ||
    data.sinks;

  if (!hasAnyCollection) {
    throw new Error('Invalid project (no particle system objects)');
  }

  return true;
}

// -----------------------------------------------------------------------------
// Commands
// -----------------------------------------------------------------------------

// Object types that can be created, with the factory each one uses. The
// context menu variants pass the right-click position so the new object lands
// under the cursor.
const CREATABLE_OBJECTS = [
  ['emitter', 'Emitter', position => createEmitter(position)],
  ['attractor', 'Attractor', position => createAttractor(position)],
  ['forcefield', 'Force field', () => createForceField()],
  ['collider', 'Collider', position => createCollider(position)],
  ['sink', 'Sink', position => createSink(position)],
];

function registerCommands() {
  const { Commands, Document, History, Shortcuts } = EditorCommon;

  const hasProject = () => !!editorState.particleSystem;
  const hasSelection = () => !!editorState.selectedObjectId;

  Commands.registerAll([
    // --- Document ---
    {
      id: 'new',
      elements: '#new-toolbar-button',
      group: 'File',
      run: () => Document.new(),
    },
    {
      id: 'open',
      elements: '#open-toolbar-button',
      group: 'File',
      run: () => Document.open(),
    },
    {
      id: 'save',
      elements: '#save-toolbar-button',
      group: 'File',
      enabled: hasProject,
      run: () => Document.save(),
    },

    // --- History ---
    {
      id: 'undo',
      elements: '#undo-toolbar-button',
      keys: ['Ctrl+Z'],
      group: 'History',
      enabled: () => History.canUndo(),
      run: () => History.undo(),
    },
    {
      id: 'redo',
      elements: '#redo-toolbar-button',
      keys: ['Ctrl+Shift+Z', 'Ctrl+Y'],
      group: 'History',
      enabled: () => History.canRedo(),
      run: () => History.redo(),
    },

    // --- The create menu itself; its items carry the individual commands ---
    {
      id: 'create-menu',
      elements: '#create-toolbar-menu',
      enabled: hasProject,
    },

    // --- Delete ---
    {
      id: 'delete',
      label: 'Delete object',
      elements: '#delete-toolbar-button',
      keys: ['Delete'],
      group: 'Edit',
      enabled: hasSelection,
      run: () => deleteObject(editorState.selectedObjectId),
    },
    {
      id: 'delete-context',
      elements: '#delete-context-menu-item',
      enabled: () => {
        const obj = findObjectById(editorState.contextNodeId);
        return !!editorState.contextNodeId && !!obj;
      },
      run: () => {
        const obj = findObjectById(editorState.contextNodeId);
        if (obj?.type === 'image') {
          deleteImage(obj.id);
        } else {
          deleteObject(editorState.contextNodeId);
        }
      },
    },
    {
      id: 'load-image-context',
      elements: '#load-image-context-menu-item',
      enabled: hasProject,
      run: () => imageFileInput?.click(),
    },

    // --- Simulation transport ---
    {
      id: 'play',
      elements: '#play-toolbar-button',
      keys: ['Space'],
      group: 'Simulation',
      enabled: () => hasProject() && !editorState.isPlaying,
      run: () => playSimulation(),
    },
    {
      id: 'pause',
      elements: '#pause-toolbar-button',
      keys: ['Space'],
      group: 'Simulation',
      enabled: () => hasProject() && editorState.isPlaying,
      run: () => pauseSimulation(),
    },
    {
      id: 'reset',
      elements: '#reset-toolbar-button',
      enabled: hasProject,
      run: () => resetSimulation(),
    },
    {
      id: 'toggle-elements',
      label: 'Show/hide elements',
      elements: '#toggle-elements-toolbar-button',
      enabled: hasProject,
      run: () => toggleElementsVisibility(),
    },

    // --- Dialogs ---
    {
      id: 'settings',
      elements: '#settings-toolbar-button',
      run: () => settingsDialog?.showModal(),
    },
    {
      id: 'shortcuts',
      elements: '#shortcuts-button',
      run: () => Shortcuts.show(),
    },
  ]);

  // Object creation, registered once per type in both toolbar and context
  // menu forms. The context form drops the object at the click position.
  for (const [type, label, create] of CREATABLE_OBJECTS) {
    Commands.register({
      id: `new-${type}`,
      label: `New ${label.toLowerCase()}`,
      elements: `#new-${type}-toolbar-menu-item`,
      enabled: hasProject,
      run: () => create(undefined),
    });

    Commands.register({
      id: `new-${type}-context`,
      elements: `#new-${type}-context-menu-item`,
      enabled: hasProject,
      run: () => create(editorState.mousePosition),
    });
  }
}

/**
 * Re-evaluate every command's enabled and visible state
 */
function updateCommands() {
  EditorCommon.Commands.refresh();

  // The toggle button's label reflects what it will do next
  if (toggleElementsToolbarButton) {
    toggleElementsToolbarButton.label = editorState.showElements
      ? 'Hide Elements'
      : 'Show Elements';
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
    updateCommands();
  } else {
    console.log('No object at clicked position');
    editorState.selectedObjectId = null;
    sceneTree.clearSelection();
    updatePropertyEditor();
    updateStatusBar();
    updateCommands();
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
        updateCommands();
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
      const outward =
        (edge === 'ne' && (dx > 0 || dy < 0)) ||
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
      const outward =
        (edge === 'ne' && (dx > 0 || dy < 0)) ||
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
        if (angle >= PI / 8 && angle < (3 * PI) / 8) return 'se';
        if (angle >= (3 * PI) / 8 && angle < (5 * PI) / 8) return 's';
        if (angle >= (5 * PI) / 8 && angle < (7 * PI) / 8) return 'sw';
        if (angle >= (7 * PI) / 8 || angle < (-7 * PI) / 8) return 'w';
        if (angle >= (-7 * PI) / 8 && angle < (-5 * PI) / 8) return 'nw';
        if (angle >= (-5 * PI) / 8 && angle < (-3 * PI) / 8) return 'n';
        if (angle >= (-3 * PI) / 8 && angle < -PI / 8) return 'ne';
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
        if (angle >= PI / 8 && angle < (3 * PI) / 8) return 'se';
        if (angle >= (3 * PI) / 8 && angle < (5 * PI) / 8) return 's';
        if (angle >= (5 * PI) / 8 && angle < (7 * PI) / 8) return 'sw';
        if (angle >= (7 * PI) / 8 || angle < (-7 * PI) / 8) return 'w';
        if (angle >= (-7 * PI) / 8 && angle < (-5 * PI) / 8) return 'nw';
        if (angle >= (-5 * PI) / 8 && angle < (-3 * PI) / 8) return 'n';
        if (angle >= (-3 * PI) / 8 && angle < -PI / 8) return 'ne';
      }
      return null;
    }
    case 'collider': {
      if (obj.geometry.type === 'rectangle') {
        const halfSize = {
          x: obj.geometry.size.x / 2,
          y: obj.geometry.size.y / 2,
        };
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
          if (angle >= PI / 8 && angle < (3 * PI) / 8) return 'se';
          if (angle >= (3 * PI) / 8 && angle < (5 * PI) / 8) return 's';
          if (angle >= (5 * PI) / 8 && angle < (7 * PI) / 8) return 'sw';
          if (angle >= (7 * PI) / 8 || angle < (-7 * PI) / 8) return 'w';
          if (angle >= (-7 * PI) / 8 && angle < (-5 * PI) / 8) return 'nw';
          if (angle >= (-5 * PI) / 8 && angle < (-3 * PI) / 8) return 'n';
          if (angle >= (-3 * PI) / 8 && angle < -PI / 8) return 'ne';
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

  const inHorizontal =
    x >= bounds.left - threshold && x <= bounds.right + threshold;
  const inVertical =
    y >= bounds.top - threshold && y <= bounds.bottom + threshold;

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
        EditorCommon.History.record(`Move ${obj.type}`);
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
      const changed =
        JSON.stringify(currentData) !==
        JSON.stringify(editorState.resizeStartObjectData);

      if (changed) {
        // Only take snapshot if object was actually resized
        EditorCommon.History.record(`Resize ${obj.type}`);
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
    updateCommands();
  } else {
    console.log('No object selected in tree view');
    editorState.selectedObjectId = null;
    updatePropertyEditor();
    updateStatusBar();
    updateCommands();
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
      const unflattenedValue = unflattenObjectFromEditor(
        propertyEditor.value,
        obj.type
      );
      updateObjectProperties(
        propertyEditor.objectId,
        unflattenedValue,
        event.detail.path.join('.')
      );
    }
  }
}

function serializeProject() {
  // Serialize images with their data URLs
  const serializedImages = {};
  for (const [id, img] of Object.entries(editorState.images)) {
    serializedImages[id] = {
      id: img.id,
      filename: img.filename,
      dataUrl: img.dataUrl,
    };
  }

  return {
    name: EditorCommon.Document.getName(),
    emitters: editorState.objects.emitters,
    attractors: editorState.objects.attractors,
    forceFields: editorState.objects.forceFields,
    colliders: editorState.objects.colliders,
    sinks: editorState.objects.sinks,
    images: serializedImages,
  };
}

function recreateParticleSystem() {
  editorState.particleSystem = new ParticleSystem();

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
            console.error(
              `Error creating ${key} function for emitter ${def.id}:`,
              err
            );
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
          console.error(
            `Error creating emission control function for emitter ${def.id}:`,
            err
          );
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
            console.error(
              `Error creating ${key} lifecycle hook for emitter ${def.id}:`,
              err
            );
          }
        }
      }
    }

    // Convert image IDs to HTMLImageElements
    if (clonedOptions?.particles?.style?.style === 'image') {
      const imageId = clonedOptions.particles.style.image;
      if (typeof imageId === 'string' && editorState.images[imageId]) {
        clonedOptions.particles.style.image =
          editorState.images[imageId].element;
      } else if (typeof imageId === 'string') {
        console.warn(`Image ID "${imageId}" not found in loaded images`);
        // Keep the string ID, but particle won't render properly
      }
    }

    const emitter = new Emitter(
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
    const attractor = new Attractor(
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
    const customForce =
      def.customForce === 'none' ? undefined : def.customForce;

    const forceField = new ForceField(
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
          console.error(
            `Error creating custom force function for forcefield ${def.id}:`,
            err
          );
        }
      }
    }

    editorState.particleSystem.forceFields.push(forceField);
  }

  // Recreate colliders
  for (const def of editorState.objects.colliders) {
    const collider = new Collider(
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
    const sink = new Sink(
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

  const emitter = new Emitter(
    def.position,
    def.size,
    def.lifespan,
    def.options
  );
  emitter._id = def.id;

  editorState.particleSystem.emitters.push(emitter);
  editorState.objects.emitters.push(def);

  EditorCommon.History.record('Create emitter');
  updateTreeView();
  updateCommands();
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

  const attractor = new Attractor(
    def.position,
    def.range,
    def.force,
    def.falloff,
    def.lifespan,
    def.id
  );

  editorState.particleSystem.attractors.push(attractor);
  editorState.objects.attractors.push(def);

  EditorCommon.History.record('Create attractor');
  updateTreeView();
  updateCommands();
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

  const forceField = new ForceField(
    def.force,
    def.lifespan,
    customForce,
    def.customForceParams,
    def.id
  );

  editorState.particleSystem.forceFields.push(forceField);
  editorState.objects.forceFields.push(def);

  EditorCommon.History.record('Create force field');
  updateTreeView();
  updateCommands();
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

  const collider = new Collider(
    def.geometry,
    def.restitution,
    def.friction,
    def.randomness,
    def.id
  );

  editorState.particleSystem.colliders.push(collider);
  editorState.objects.colliders.push(def);

  EditorCommon.History.record('Create collider');
  updateTreeView();
  updateCommands();
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

  const sink = new Sink(
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

  EditorCommon.History.record('Create sink');
  updateTreeView();
  updateCommands();
  updateTitle();

  console.log('Sink created:', def.id);
}

function deleteObject(id) {
  const obj = findObjectById(id);
  if (!obj) return;

  // Remove from particle system
  switch (obj.type) {
    case 'emitter':
      editorState.particleSystem.emitters =
        editorState.particleSystem.emitters.filter(e => e._id !== id);
      editorState.objects.emitters = editorState.objects.emitters.filter(
        e => e.id !== id
      );
      break;
    case 'attractor':
      editorState.particleSystem.attractors =
        editorState.particleSystem.attractors.filter(a => a.id !== id);
      editorState.objects.attractors = editorState.objects.attractors.filter(
        a => a.id !== id
      );
      break;
    case 'forcefield':
      editorState.particleSystem.forceFields =
        editorState.particleSystem.forceFields.filter(f => f.id !== id);
      editorState.objects.forceFields = editorState.objects.forceFields.filter(
        f => f.id !== id
      );
      break;
    case 'collider':
      editorState.particleSystem.colliders =
        editorState.particleSystem.colliders.filter(c => c.id !== id);
      editorState.objects.colliders = editorState.objects.colliders.filter(
        c => c.id !== id
      );
      break;
    case 'sink':
      editorState.particleSystem.sinks =
        editorState.particleSystem.sinks.filter(s => s.id !== id);
      editorState.objects.sinks = editorState.objects.sinks.filter(
        s => s.id !== id
      );
      break;
  }

  if (editorState.selectedObjectId === id) {
    editorState.selectedObjectId = null;
  }

  EditorCommon.History.record(`Delete ${obj.type}`);
  updateTreeView();
  updatePropertyEditor();
  updateCommands();
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
    reader.onload = async e => {
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
          alert(
            `An image with ID "${imageId}" already exists. Please choose a different ID.`
          );
          resolve();
          return;
        }

        // Store image
        editorState.images[imageId] = {
          id: imageId,
          filename: file.name,
          dataUrl: dataUrl,
          element: img,
          loaded: true,
        };

        EditorCommon.History.record(`Load image: ${imageId}`);
        updateTreeView();
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
    if (
      !confirm(`This image is used in emitters: ${emitterIds}. Delete anyway?`)
    ) {
      return;
    }
  }

  delete editorState.images[imageId];

  EditorCommon.History.record(`Delete image: ${imageId}`);
  updateTreeView();
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

  EditorCommon.History.record(`Update ${obj.type}`);
  updateTitle();

  console.log('Object properties updated:', id);
}

function updateParticleSystemObject(psObject, def) {
  switch (def.type) {
    case 'emitter':
      // Recreate emitter with new values
      const emitterIndex = editorState.particleSystem.emitters.findIndex(
        e => e._id === def.id
      );
      if (emitterIndex >= 0) {
        const newEmitter = new Emitter(
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
      psObject.customForce =
        def.customForce === 'none' ? undefined : def.customForce;
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

// -----------------------------------------------------------------------------
// Simulation control
// -----------------------------------------------------------------------------

function playSimulation() {
  editorState.isPlaying = true;
  updateCommands();
}

function pauseSimulation() {
  editorState.isPlaying = false;
  updateCommands();
}

function resetSimulation() {
  editorState.isPlaying = false;
  recreateParticleSystem();
  updateCommands();
}

function toggleElementsVisibility() {
  editorState.showElements = !editorState.showElements;
  updateCommands();
  render();
}

// -----------------------------------------------------------------------------
// UI updates
// -----------------------------------------------------------------------------

function updateTitle() {
  EditorCommon.Document.updateTitle();
}

function updateStatusBar() {
  const { StatusBar } = EditorCommon;

  StatusBar.set(
    'mouse',
    `(${editorState.mousePosition.x}, ${editorState.mousePosition.y})`
  );

  const obj = editorState.selectedObjectId
    ? findObjectById(editorState.selectedObjectId)
    : null;

  StatusBar.set(
    'selected',
    editorState.selectedObjectId
      ? obj
        ? `${obj.type} (${obj.id})`
        : 'Unknown'
      : 'None'
  );

  StatusBar.set(
    'particles',
    editorState.particleSystem
      ? editorState.particleSystem.particles.length
      : 0
  );
  StatusBar.set('fps', Math.round(editorState.fps));
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
        flattenedValue.editParticleOptions = function () {
          openParticleOptionsDialog(obj);
        };
        flattenedValue.editParticleFunctions = function () {
          openParticleFunctionsDialog(obj);
        };
        flattenedValue.editEmissionOptions = function () {
          openEmissionOptionsDialog(obj);
        };
        flattenedValue.editEmissionControl = function () {
          openEmissionControlDialog(obj);
        };
        flattenedValue.editParticleLifecycle = function () {
          openParticleLifecycleDialog(obj);
        };
      }

      // Add button function for forcefields to open custom force params editor
      if (obj.type === 'forcefield') {
        flattenedValue.editCustomForceParams = function () {
          openCustomForceParamsDialog(obj);
        };
        flattenedValue.editCustomForceFunction = function () {
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

function syncTreeViewSelection(id) {
  if (!sceneTree) return;
  sceneTree.clearSelection();
  sceneTree.selectItem(id);
}

// -----------------------------------------------------------------------------
// Render loop
// -----------------------------------------------------------------------------

/**
 * One frame: advance the simulation when playing, then draw
 *
 * dt clamping and the FPS counter come from CanvasHost.startRenderLoop
 */
function renderFrame({ dt, fps }) {
  editorState.fps = fps;

  if (editorState.isPlaying && editorState.particleSystem) {
    editorState.particleSystem.update(dt);
    updateStatusBar();
  }

  render();
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
    context.fillText(
      'No particle system loaded',
      canvas.width / 2,
      canvas.height / 2
    );
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
        },
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
      drawEmitter(
        def,
        isSelected ? styles.emitterSelected : styles.emitterUnselected
      );
    }

    // Draw attractors
    for (const def of editorState.objects.attractors) {
      const isSelected = def.id === editorState.selectedObjectId;
      drawAttractor(
        def,
        isSelected ? styles.attractorSelected : styles.attractorUnselected
      );
    }

    // Draw force fields
    for (const def of editorState.objects.forceFields) {
      const isSelected = def.id === editorState.selectedObjectId;
      drawForceField(
        def,
        isSelected ? styles.forcefieldSelected : styles.forcefieldUnselected
      );
    }

    // Draw colliders
    for (const def of editorState.objects.colliders) {
      const isSelected = def.id === editorState.selectedObjectId;
      drawCollider(
        def,
        isSelected ? styles.colliderSelected : styles.colliderUnselected
      );
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
  drawRectangle(def.position, def.size, {
    ...style,
    rectangleAnchor: 'center',
  });

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
      drawRectangle(def.geometry.position, def.geometry.size, {
        ...style,
        rectangleAnchor: 'center',
      });
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
      const halfSize = {
        x: def.geometry.size.x / 2,
        y: def.geometry.size.y / 2,
      };
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



function openParticleOptionsDialog(emitter) {
  if (!emitter || !particleOptionsDialog || !particleOptionsJsonEditor) return;

  // Get the current particle options
  const particleOptions = emitter.options?.particles || {};

  // Clear any existing editor and create new JSONEditor instance
  particleOptionsJsonEditor.innerHTML = '';
  particleOptionsEditor = new JSONEditor(particleOptionsJsonEditor, {
    mode: 'code',
    modes: ['code', 'tree'],
    indentation: 2,
  });
  particleOptionsEditor.set(particleOptions);

  // Open the dialog
  particleOptionsDialog.showModal();
}
function openEmissionOptionsDialog(emitter) {
  if (!emitter || !emissionOptionsDialog || !emissionOptionsJsonEditor) return;

  // Get the current emission options
  const emissionOptions = emitter.options?.emission || {
    type: 'rate',
    rate: 10,
  };

  // Clear any existing editor and create new JSONEditor instance
  emissionOptionsJsonEditor.innerHTML = '';
  emissionOptionsEditor = new JSONEditor(emissionOptionsJsonEditor, {
    mode: 'code',
    modes: ['code', 'tree'],
    indentation: 2,
  });
  emissionOptionsEditor.set(emissionOptions);

  // Open the dialog
  emissionOptionsDialog.showModal();
}

function openParticleFunctionsDialog(emitter) {
  if (!emitter || !particleFunctionsDialog || !particleFunctionsTextareas)
    return;

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

    for (const [key, fnData] of Object.entries(
      emitterObj.customLifecycleHooks
    )) {
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
  const emitterIndex = editorState.particleSystem.emitters.findIndex(
    e => e._id === emitterObj.id
  );
  if (emitterIndex >= 0) {
    const newEmitter = new Emitter(
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
  if (!forcefield || !customForceParamsDialog || !customForceParamsJsonEditor)
    return;

  // Get the current custom force parameters
  const customForceParams = forcefield.customForceParams || {};

  // Clear any existing editor and create new JSONEditor instance
  customForceParamsJsonEditor.innerHTML = '';
  customForceParamsEditor = new JSONEditor(customForceParamsJsonEditor, {
    mode: 'code',
    modes: ['code', 'tree'],
    indentation: 2,
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
  if (!emitter || !particleLifecycleDialog || !particleLifecycleTextareas)
    return;

  // Clear any previous status message
  if (particleLifecycleStatusItem) {
    particleLifecycleStatusItem.value = '';
  }

  // Get the current custom lifecycle hooks
  const customHooks = emitter.customLifecycleHooks || {};

  // Default function templates
  const templates = {
    update: '// Custom update logic\n// this.velocity.x += 10 * dt;',
    preDraw:
      '// Set context state\n// context.shadowColor = "black";\n// context.shadowBlur = 10;',
    postDraw:
      '// Draw additional effects\n// context.fillStyle = "white";\n// context.fillText("!", 0, 0);',
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
  if (!forcefield || !customForceFunctionDialog || !customForceFunctionTextarea)
    return;

  // Clear any previous status message
  if (customForceFunctionStatusItem) {
    customForceFunctionStatusItem.value = '';
  }

  // Get the current custom force function
  const fnData = forcefield.customForceFunction;

  // Default template
  const template =
    '// Apply custom force to this particle\n// this.velocity.x += 10 * dt;\n// this.velocity.y += 10 * dt;';

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
