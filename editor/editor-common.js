// Editor Common
//
// Shared runtime for basementuniverse game component editors. Attaches
// window.EditorCommon. Load it before the editor's own script:
//
//   <script src="e2.min.js"></script>
//   <script src="editor-common.js"></script>
//   <script src="editor.js"></script>
//
// Namespaces are independent - use the ones an editor needs and ignore the
// rest. Nothing here knows anything about a particular editor's document.

(function (window, document) {
  'use strict';

  const VERSION = '0.1.0';

  // ---------------------------------------------------------------------------
  // Utils
  // ---------------------------------------------------------------------------

  /**
   * Resolve a selector, element or nullish value to a single element
   */
  function resolveElement(target, context) {
    if (!target) {
      return null;
    }
    if (typeof target === 'string') {
      return (context || document).querySelector(target);
    }
    return target;
  }

  /**
   * Resolve a selector, element or array of either to an array of elements
   */
  function resolveElements(target, context) {
    if (!target) {
      return [];
    }
    if (typeof target === 'string') {
      return Array.from((context || document).querySelectorAll(target));
    }
    if (Array.isArray(target)) {
      return target.map(t => resolveElement(t, context)).filter(Boolean);
    }
    return [target];
  }

  function isPlainObject(value) {
    return (
      typeof value === 'object' && value !== null && !Array.isArray(value)
    );
  }

  /**
   * Recursively merge source into a copy of target
   *
   * Plain objects are merged key by key; everything else (including arrays)
   * is replaced wholesale. Used to layer stored settings over defaults so
   * that settings added after a save still get their default value.
   */
  function deepMerge(target, source) {
    if (!isPlainObject(source)) {
      return source === undefined ? target : source;
    }

    const result = isPlainObject(target) ? { ...target } : {};
    for (const [key, value] of Object.entries(source)) {
      result[key] = isPlainObject(value) ? deepMerge(result[key], value) : value;
    }

    return result;
  }

  const Utils = {
    element: resolveElement,
    elements: resolveElements,
    isPlainObject,
    deepMerge,

    debounce(fn, wait) {
      let timeoutId = null;
      return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          fn(...args);
        }, wait);
      };
    },

    deepClone(value) {
      return value === undefined ? value : JSON.parse(JSON.stringify(value));
    },

    generateId(prefix = 'id') {
      return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
    },

    /**
     * Format a date as HH:MM:SS, as used in the history view
     */
    formatTime(date) {
      const d = date instanceof Date ? date : new Date(date);
      const pad = n => n.toString().padStart(2, '0');
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
        d.getSeconds()
      )}`;
    },

    /**
     * Toggle the disabled attribute on an element or elements
     */
    setEnabled(target, enabled) {
      for (const element of resolveElements(target)) {
        if (enabled) {
          element.removeAttribute('disabled');
        } else {
          element.setAttribute('disabled', '');
        }
      }
    },

    /**
     * Toggle the .hidden class on an element or elements
     *
     * Requires the corresponding rules in main.css - toolbar and context menu
     * elements need an explicit display value to hide against.
     */
    setVisible(target, visible) {
      for (const element of resolveElements(target)) {
        element.classList.toggle('hidden', !visible);
      }
    },
  };

  // ---------------------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------------------

  // localStorage throws in some privacy modes, so every access is guarded and
  // failure degrades to "no persistence" rather than breaking the editor.

  const Storage = {
    available() {
      try {
        const probe = '__editor_common_probe__';
        window.localStorage.setItem(probe, probe);
        window.localStorage.removeItem(probe);
        return true;
      } catch (error) {
        return false;
      }
    },

    read(key, fallback = null) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (error) {
        console.warn(`Could not read "${key}" from local storage:`, error);
        return fallback;
      }
    },

    write(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn(`Could not write "${key}" to local storage:`, error);
        return false;
      }
    },

    remove(key) {
      try {
        window.localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn(`Could not remove "${key}" from local storage:`, error);
        return false;
      }
    },
  };

  // ---------------------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------------------

  // Every E2 element bar e2-app inherits the theme from it automatically, but
  // only while it carries no explicit theme attribute of its own. Editor markup
  // often hard-codes theme="dark" on dialogs and status bars, which opts them
  // out of inheritance and means each one has to be listed somewhere and kept
  // in sync. We strip those attributes at startup so inheritance does the work.

  /**
   * E2 elements carrying their own theme attribute, which e2-app cannot reach
   */
  function themedE2Elements() {
    return Array.from(document.querySelectorAll('[theme]')).filter(
      element =>
        element.tagName.startsWith('E2-') && element.tagName !== 'E2-APP'
    );
  }

  const Theme = (() => {
    let appElement = null;
    let switchElement = null;
    let changeCallback = null;
    let current = 'dark';

    function releaseInheritors() {
      for (const element of themedE2Elements()) {
        element.removeAttribute('theme');
      }
    }

    function apply() {
      if (appElement) {
        appElement.setAttribute('theme', current);
      }

      // Safety net for anything that still declares its own theme - an element
      // added after initialise(), or one we were told not to release
      for (const element of themedE2Elements()) {
        element.setAttribute('theme', current);
      }

      if (switchElement) {
        switchElement.checked = current === 'dark';
      }
    }

    function set(theme, options = {}) {
      const next = theme === 'light' ? 'light' : 'dark';
      const changed = next !== current;
      current = next;

      apply();

      if (changed && !options.silent) {
        Settings.update({ theme: current }, { silent: true });
        if (changeCallback) {
          changeCallback(current);
        }
      }

      return current;
    }

    /**
     * options:
     *   app             - e2-app element or selector (default 'e2-app')
     *   switchElement   - theme toggle input (default '.theme-switch input')
     *   initial         - 'dark' | 'light' (default 'dark')
     *   releaseInheritors - strip theme attributes from dialogs (default true)
     *   onChange(theme) - called when the user changes the theme
     */
    function initialise(options = {}) {
      appElement = resolveElement(options.app || 'e2-app');
      switchElement = resolveElement(
        options.switchElement === undefined
          ? '.theme-switch input'
          : options.switchElement
      );
      changeCallback = options.onChange || null;
      current = options.initial === 'light' ? 'light' : 'dark';

      if (options.releaseInheritors !== false) {
        releaseInheritors();
      }

      if (switchElement) {
        switchElement.addEventListener('change', event => {
          set(event.target.checked ? 'dark' : 'light');
        });
      }

      apply();

      return current;
    }

    return {
      initialise,
      set,
      get: () => current,
      toggle: () => set(current === 'dark' ? 'light' : 'dark'),
      refresh: apply,
    };
  })();

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  // Owns the editor's settings object: schema-driven editing through an
  // e2-keyvalue-editor, layered over defaults, persisted to local storage.
  //
  // The settings object is mutated in place, so an editor can hold a long-lived
  // reference to it (editorState.settings) and always see current values.

  const Settings = (() => {
    let settings = {};
    let defaults = {};
    let editorElement = null;
    let storageKey = null;
    let exclude = ['theme'];
    let changeCallback = null;
    let initialised = false;

    function editorValue() {
      return Object.fromEntries(
        Object.entries(settings).filter(([key]) => !exclude.includes(key))
      );
    }

    function replaceContents(next) {
      for (const key of Object.keys(settings)) {
        delete settings[key];
      }
      Object.assign(settings, next);
    }

    function persist() {
      if (storageKey) {
        Storage.write(storageKey, settings);
      }
    }

    function handleChange() {
      if (!editorElement) {
        return;
      }

      editorElement.validate();
      if (!editorElement.isValid()) {
        return;
      }

      replaceContents(deepMerge(settings, editorElement.value));
      persist();

      if (changeCallback) {
        changeCallback(settings);
      }
    }

    /**
     * Merge a partial update into the settings, persist and notify
     */
    function update(partial, options = {}) {
      replaceContents(deepMerge(settings, partial));
      persist();

      if (editorElement && !options.silent) {
        editorElement.value = editorValue();
      }

      if (changeCallback && !options.silent) {
        changeCallback(settings);
      }

      return settings;
    }

    /**
     * options:
     *   defaults          - the full default settings object (required)
     *   schema            - JSON schema for the keyvalue editor
     *   editor            - e2-keyvalue-editor element or selector
     *   storageKey        - local storage key; omit to disable persistence
     *   exclude           - keys to keep out of the editor (default ['theme'])
     *   debounce          - ms to debounce editor changes (default 300)
     *   onChange(settings)- called after any change is applied
     *
     * Returns the settings object, which is mutated in place from then on.
     */
    function initialise(options = {}) {
      defaults = options.defaults || {};
      editorElement = resolveElement(options.editor);
      storageKey = options.storageKey || null;
      exclude = options.exclude || ['theme'];
      changeCallback = options.onChange || null;

      const stored = storageKey ? Storage.read(storageKey) : null;
      settings = deepMerge(defaults, stored || {});

      if (editorElement) {
        if (options.schema) {
          editorElement.schema = options.schema;
        }
        editorElement.value = editorValue();

        const wait = options.debounce === undefined ? 300 : options.debounce;
        editorElement.addEventListener(
          'keyvalue-change',
          wait > 0 ? Utils.debounce(handleChange, wait) : handleChange
        );
      }

      initialised = true;

      return settings;
    }

    /**
     * Restore defaults, discarding anything stored
     */
    function reset() {
      replaceContents(Utils.deepClone(defaults));
      persist();

      if (editorElement) {
        editorElement.value = editorValue();
      }

      if (changeCallback) {
        changeCallback(settings);
      }

      return settings;
    }

    return {
      initialise,
      update,
      reset,
      get: () => settings,
      isInitialised: () => initialised,
      clearStored: () => storageKey && Storage.remove(storageKey),
    };
  })();

  // ---------------------------------------------------------------------------
  // Status bar
  // ---------------------------------------------------------------------------

  const StatusBar = (() => {
    const items = {};

    /**
     * options:
     *   items - map of name to e2-status-item element or selector
     */
    function initialise(options = {}) {
      for (const [name, target] of Object.entries(options.items || {})) {
        const element = resolveElement(target);
        if (element) {
          items[name] = element;
        } else {
          console.warn(`Status bar item "${name}" not found`);
        }
      }

      return StatusBar;
    }

    function set(name, value) {
      const element = items[name];
      if (!element) {
        return false;
      }

      element.setAttribute('value', value === null || value === undefined ? '' : String(value));
      return true;
    }

    function update(values) {
      for (const [name, value] of Object.entries(values || {})) {
        set(name, value);
      }
    }

    return {
      initialise,
      set,
      update,
      register: (name, target) => {
        const element = resolveElement(target);
        if (element) {
          items[name] = element;
        }
        return element;
      },
      get: name => items[name] || null,
    };
  })();

  // ---------------------------------------------------------------------------
  // History view
  // ---------------------------------------------------------------------------

  // Renders an array of history snapshots into an e2-list-view. Expects each
  // snapshot to carry { action, date }; anything else on them is ignored.

  const HISTORY_COLUMNS = [
    { id: 'label', label: '#', width: '2em' },
    { id: 'action', label: 'Action' },
    { id: 'date', label: 'Date', width: '55px' },
    { id: 'current', label: 'Current', width: '1em' },
  ];

  const HistoryView = (() => {
    let view = null;
    let selectCallback = null;

    // Selecting an item programmatically makes the list view emit a selection
    // change event, which would otherwise be indistinguishable from the user
    // clicking a row and would call back into jumpTo.
    let suppressSelection = false;

    /**
     * options:
     *   view            - e2-list-view element or selector
     *   columns         - column config (defaults to the standard four)
     *   onSelect(index) - called when the user picks a history entry
     */
    function initialise(options = {}) {
      view = resolveElement(options.view);
      selectCallback = options.onSelect || null;

      if (!view) {
        console.warn('History view element not found');
        return HistoryView;
      }

      view.columns = options.columns || HISTORY_COLUMNS;

      view.addEventListener('listview-selection-change', event => {
        if (suppressSelection || !selectCallback) {
          return;
        }

        const { selectedItems } = event.detail || {};
        if (!selectedItems || selectedItems.length === 0) {
          return;
        }

        const index = parseInt(selectedItems[0].id, 10);
        if (!Number.isNaN(index)) {
          selectCallback(index);
        }
      });

      return HistoryView;
    }

    /**
     * Render snapshots, highlighting currentIndex
     */
    function render(snapshots, currentIndex) {
      if (!view) {
        return;
      }

      const entries = snapshots || [];
      const items = entries.map(({ action, date }, index) => ({
        id: index.toString(),
        label: (index + 1).toString(),
        data: {
          action,
          date: Utils.formatTime(date),
          current: index === currentIndex ? '✅' : '⬛',
        },
      }));

      suppressSelection = true;
      try {
        view.items = items;

        if (currentIndex >= 0 && currentIndex < items.length) {
          view.deselectAll?.();
          view.selectItem?.(currentIndex.toString());
        }
      } catch (error) {
        console.error('Error updating history view:', error);
      } finally {
        suppressSelection = false;
      }
    }

    return {
      initialise,
      render,
      clear: () => render([], -1),
      get element() {
        return view;
      },
    };
  })();

  // ---------------------------------------------------------------------------
  // Canvas host
  // ---------------------------------------------------------------------------

  // Sizes a canvas to fill its container (less an optional margin), keeps a
  // size object in sync, and observes the surrounding panels so the canvas
  // resizes when they are dragged or collapsed.

  const CanvasHost = (() => {
    /**
     * options:
     *   canvas          - canvas element or selector
     *   container       - element the canvas fills (default the canvas parent)
     *   observe         - extra elements to watch for resizes
     *   margin          - number, or a function returning a number
     *   size            - object to write { x, y } into (optional)
     *   contextType     - default '2d'
     *   onResize(size)  - called after every resize
     */
    function initialise(options = {}) {
      const canvas = resolveElement(options.canvas);
      if (!canvas) {
        console.error('Canvas element not found');
        return null;
      }

      const container = resolveElement(options.container) || canvas.parentElement;
      const context = canvas.getContext(options.contextType || '2d');
      const size = options.size || { x: 0, y: 0 };
      const onResize = options.onResize || null;

      const getMargin = () =>
        typeof options.margin === 'function'
          ? options.margin() || 0
          : options.margin || 0;

      function resize() {
        if (!container) {
          return size;
        }

        const rect = container.getBoundingClientRect();
        const margin = getMargin();

        // A margin larger than the container would give a negative size, which
        // throws when assigned to canvas.width
        const width = Math.max(0, Math.floor(rect.width) - margin * 2);
        const height = Math.max(0, Math.floor(rect.height) - margin * 2);

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.style.top = `${margin}px`;
        canvas.style.left = `${margin}px`;

        size.x = width;
        size.y = height;

        if (onResize) {
          onResize(size);
        }

        return size;
      }

      window.addEventListener('resize', resize);

      let observer = null;
      if (window.ResizeObserver) {
        observer = new ResizeObserver(resize);
        const observed = new Set([container, ...resolveElements(options.observe)]);
        for (const element of observed) {
          if (element) {
            observer.observe(element);
          }
        }
      }

      resize();

      return {
        canvas,
        context,
        size,
        resize,
        destroy() {
          window.removeEventListener('resize', resize);
          observer?.disconnect();
        },
      };
    }

    /**
     * Start a requestAnimationFrame loop
     *
     * The callback receives { dt, elapsed, fps, frame }, where dt is in
     * seconds and clamped to maxDelta so that a backgrounded tab doesn't
     * produce a single enormous step.
     *
     * options:
     *   maxDelta      - seconds, default 1/30
     *   onFpsUpdate() - called about once a second with the current fps
     */
    function startRenderLoop(callback, options = {}) {
      const maxDelta = options.maxDelta === undefined ? 1 / 30 : options.maxDelta;
      const onFpsUpdate = options.onFpsUpdate || null;

      let running = true;
      let lastTime = null;
      let elapsed = 0;
      let frame = 0;
      let fps = 0;
      let fpsFrames = 0;
      let fpsElapsed = 0;

      function loop(timestamp) {
        if (!running) {
          return;
        }

        const dt =
          lastTime === null
            ? 0
            : Math.min((timestamp - lastTime) / 1000, maxDelta);
        lastTime = timestamp;
        elapsed += dt;
        frame++;

        fpsFrames++;
        fpsElapsed += dt;
        if (fpsElapsed >= 1) {
          fps = fpsFrames / fpsElapsed;
          fpsFrames = 0;
          fpsElapsed = 0;
          if (onFpsUpdate) {
            onFpsUpdate(fps);
          }
        }

        callback({ dt, elapsed, fps, frame });

        window.requestAnimationFrame(loop);
      }

      window.requestAnimationFrame(loop);

      return {
        stop() {
          running = false;
        },
        get fps() {
          return fps;
        },
      };
    }

    return { initialise, startRenderLoop };
  })();

  // ---------------------------------------------------------------------------
  // History
  // ---------------------------------------------------------------------------

  // A snapshot stack over whatever the document adapter serializes. One
  // snapshot per entry, holding the document state *after* that action - so
  // record() is called once a mutation is complete, never before it.
  //
  // Dirty state is derived by comparing the cursor against the index that was
  // last saved, which means undoing back to the saved state correctly stops
  // reporting the document as modified.

  const History = (() => {
    const snapshots = [];
    let currentIndex = -1;
    let savedIndex = -1;

    let serializeFn = null;
    let deserializeFn = null;
    let changeCallback = null;

    let suspended = false;

    // Interaction coalescing - a drag that emits a change per frame should
    // produce one history entry, not one per frame
    let interactionDebounce = 250;
    let pointerQuietPeriod = 120;
    let pendingAction = null;
    let debounceTimer = null;

    function notify() {
      HistoryView.render(snapshots, currentIndex);
      if (changeCallback) {
        changeCallback();
      }
    }

    /**
     * Run fn with history recording suspended
     *
     * Used while restoring a snapshot, so that editors which record history in
     * response to their own change events don't record the restore itself.
     */
    function suspend(fn) {
      const previous = suspended;
      suspended = true;
      try {
        return fn();
      } finally {
        suspended = previous;
      }
    }

    /**
     * Capture the current document state as a new history entry
     *
     * Call this after the mutation has been applied. Returns false if nothing
     * was recorded.
     */
    function record(action = 'Unknown') {
      if (suspended || !serializeFn) {
        return false;
      }

      const document = serializeFn();
      if (document === null || document === undefined) {
        return false;
      }

      // Recording after an undo discards the redo tail
      if (currentIndex < snapshots.length - 1) {
        snapshots.length = currentIndex + 1;

        // The saved state lived in the part we just discarded, so it is no
        // longer reachable and the document can never be clean again until
        // it is saved afresh
        if (savedIndex > currentIndex) {
          savedIndex = -1;
        }
      }

      snapshots.push({
        action,
        date: new Date(),
        document: Utils.deepClone(document),
      });
      currentIndex = snapshots.length - 1;

      notify();
      return true;
    }

    /**
     * Run fn, then record the result as a history entry
     *
     * If fn returns false the entry is skipped, which gives an action a way to
     * bail out without leaving an empty step in the history.
     */
    function transaction(action, fn) {
      const result = fn ? fn() : undefined;
      if (result !== false) {
        record(action);
      }
      return result;
    }

    function restore(index) {
      const snapshot = snapshots[index];
      if (!snapshot || !deserializeFn) {
        return false;
      }

      suspend(() => deserializeFn(Utils.deepClone(snapshot.document)));
      currentIndex = index;
      notify();
      return true;
    }

    function canUndo() {
      return currentIndex > 0;
    }

    function canRedo() {
      return currentIndex >= 0 && currentIndex < snapshots.length - 1;
    }

    function undo() {
      flushInteraction();
      if (!canUndo()) {
        return false;
      }
      return restore(currentIndex - 1);
    }

    function redo() {
      flushInteraction();
      if (!canRedo()) {
        return false;
      }
      return restore(currentIndex + 1);
    }

    function jumpTo(index) {
      flushInteraction();
      if (index < 0 || index >= snapshots.length || index === currentIndex) {
        return false;
      }
      return restore(index);
    }

    /**
     * Discard all history, optionally recording the current state as the
     * first entry
     */
    function reset(action) {
      clearInteraction();
      snapshots.length = 0;
      currentIndex = -1;
      savedIndex = -1;

      if (action) {
        record(action);
      } else {
        notify();
      }

      return true;
    }

    function markSaved() {
      flushInteraction();
      savedIndex = currentIndex;
      notify();
    }

    function isDirty() {
      return snapshots.length > 0 && savedIndex !== currentIndex;
    }

    // --- Interaction coalescing ---

    function clearInteraction() {
      if (debounceTimer !== null) {
        window.clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      pendingAction = null;
    }

    function flushInteraction() {
      if (!pendingAction) {
        clearInteraction();
        return false;
      }

      const action = pendingAction;
      clearInteraction();
      return record(action);
    }

    function scheduleFlush(delay) {
      if (debounceTimer !== null) {
        window.clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(flushInteraction, delay);
    }

    /**
     * Record an entry for an ongoing interaction, coalescing rapid repeats
     *
     * Call this from a continuous gesture (drag, resize). The entry lands once
     * the gesture has been quiet for interactionDebounce ms, or sooner when
     * handlePointerEnd() fires.
     */
    function queueInteraction(action, options = {}) {
      if (suspended) {
        return false;
      }

      // Keep the most significant label when a gesture mixes several kinds
      if (!pendingAction || options.priority !== false) {
        pendingAction = action;
      }

      scheduleFlush(interactionDebounce);
      return true;
    }

    function handlePointerEnd() {
      if (pendingAction) {
        scheduleFlush(pointerQuietPeriod);
      }
    }

    /**
     * options:
     *   serialize()       - returns the current document state
     *   deserialize(data) - applies a document state
     *   onChange()        - called after any history mutation
     *   interactionDebounce / pointerQuietPeriod - coalescing timings
     *   bindPointerEvents - commit queued interactions on pointerup / blur
     */
    function initialise(options = {}) {
      serializeFn = options.serialize || null;
      deserializeFn = options.deserialize || null;
      changeCallback = options.onChange || null;

      if (options.interactionDebounce !== undefined) {
        interactionDebounce = options.interactionDebounce;
      }
      if (options.pointerQuietPeriod !== undefined) {
        pointerQuietPeriod = options.pointerQuietPeriod;
      }

      if (options.bindPointerEvents) {
        document.addEventListener('pointerup', handlePointerEnd);
        document.addEventListener('pointercancel', handlePointerEnd);
        document.addEventListener('touchend', handlePointerEnd);

        // Fallbacks for when pointerup is missed because focus moved away
        window.addEventListener('blur', flushInteraction);
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            flushInteraction();
          }
        });
      }

      return History;
    }

    return {
      initialise,
      record,
      transaction,
      suspend,
      undo,
      redo,
      jumpTo,
      canUndo,
      canRedo,
      reset,
      markSaved,
      isDirty,
      queueInteraction,
      flushInteraction,
      handlePointerEnd,
      get snapshots() {
        return snapshots;
      },
      get currentIndex() {
        return currentIndex;
      },
      get savedIndex() {
        return savedIndex;
      },
      get length() {
        return snapshots.length;
      },
    };
  })();

  // ---------------------------------------------------------------------------
  // File I/O
  // ---------------------------------------------------------------------------

  // Uses the File System Access API where available, falling back to a hidden
  // file input for opening and a blob download for saving.

  const FileIO = (() => {
    /**
     * Remove a known extension from a filename
     *
     * Checking the configured extensions first matters for compound ones like
     * ".graph.json" - stripping only the last dot segment would leave
     * "my-graph.graph", which then grows another suffix on the next save.
     */
    function stripExtension(filename, extensions) {
      const lower = filename.toLowerCase();

      // Longest first, so ".graph.json" wins over ".json"
      const candidates = [...(extensions || [])].sort(
        (a, b) => b.length - a.length
      );

      for (const extension of candidates) {
        if (extension && lower.endsWith(extension.toLowerCase())) {
          return filename.slice(0, -extension.length);
        }
      }

      return filename.replace(/\.[^.]+$/, '');
    }

    function openWithInput(accept) {
      return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.addEventListener('change', () => {
          resolve(input.files?.[0] || null);
        });

        // A cancelled picker fires no event in most browsers, so the promise
        // simply never settles - acceptable here because the editor stays
        // usable and a later open() starts a fresh input
        input.click();
      });
    }

    function downloadText(filename, text, mimeType = 'application/json') {
      const blob = new Blob([text], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    /**
     * Prompt for a file and return { name, text }, or null if cancelled
     *
     * name has its extension stripped, ready to use as a document name.
     */
    async function openText(options = {}) {
      const extensions = options.extensions || ['.json'];
      const mimeType = options.mimeType || 'application/json';
      const description = options.description || 'Document';

      let file = null;

      try {
        if (window.showOpenFilePicker) {
          const [handle] = await window.showOpenFilePicker({
            types: [{ description, accept: { [mimeType]: extensions } }],
            multiple: false,
          });
          if (!handle) {
            return null;
          }
          file = await handle.getFile();
        } else {
          file = await openWithInput(extensions.join(','));
        }
      } catch (error) {
        // Cancelling the picker throws AbortError
        console.warn('Open cancelled or failed:', error);
        return null;
      }

      if (!file) {
        return null;
      }

      return {
        name: stripExtension(file.name, extensions),
        text: await file.text(),
      };
    }

    /**
     * Prompt for a file and return { name, data }, or null if cancelled
     *
     * Throws if the file is not valid JSON, so callers can report it.
     */
    async function openJSON(options = {}) {
      const result = await openText(options);
      if (!result) {
        return null;
      }

      return { name: result.name, data: JSON.parse(result.text) };
    }

    /**
     * Write text to a file the user chooses. Returns false if cancelled.
     */
    async function saveText(text, options = {}) {
      const extension = options.extension || '.json';
      const mimeType = options.mimeType || 'application/json';
      const description = options.description || 'Document';
      const filename = `${options.name || 'untitled'}${extension}`;

      try {
        if (window.showSaveFilePicker) {
          const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{ description, accept: { [mimeType]: [extension] } }],
          });
          const writable = await handle.createWritable();
          await writable.write(text);
          await writable.close();
          return true;
        }

        downloadText(filename, text, mimeType);
        return true;
      } catch (error) {
        console.warn('Save cancelled or failed:', error);
        return false;
      }
    }

    function saveJSON(data, options = {}) {
      return saveText(JSON.stringify(data, null, 2), options);
    }

    return {
      openText,
      openJSON,
      saveText,
      saveJSON,
      downloadText,
      stripExtension,
    };
  })();

  // ---------------------------------------------------------------------------
  // Document
  // ---------------------------------------------------------------------------

  // The seam between the shared runtime and a particular editor. An editor
  // supplies createNew / serialize / deserialize / validate, and gets new,
  // open, save, the window title and dirty tracking in return.

  const Document = (() => {
    const config = {
      title: 'Editor',
      defaultName: 'untitled',
      extension: '.json',
      description: 'Document',
      mimeType: 'application/json',
    };

    let namePromptElement = null;
    let name = '';
    let loaded = false;

    function toast(kind, message) {
      if (message && window.E2?.Toast?.[kind]) {
        window.E2.Toast[kind](message);
      }
    }

    function updateTitle() {
      document.title = `${config.title} - ${name || 'Untitled'}${
        History.isDirty() ? ' (modified)' : ''
      }`;
    }

    function setName(next) {
      name = next || '';
      updateTitle();
      return name;
    }

    /**
     * Apply a document, reset history around it and mark it as saved
     */
    function load(data, options = {}) {
      const applied = config.deserialize ? config.deserialize(data) : undefined;
      if (applied === false) {
        return false;
      }

      loaded = true;
      History.reset(options.action || config.historyLabels.loaded);
      History.markSaved();
      setName(options.name === undefined ? name : options.name);

      if (config.onLoad) {
        config.onLoad(data);
      }

      return true;
    }

    function createNew() {
      if (!config.createNew) {
        return false;
      }

      if (
        !load(config.createNew(), {
          action: config.historyLabels.created,
          name: '',
        })
      ) {
        return false;
      }

      toast('success', config.messages.created);
      return true;
    }

    async function open() {
      let result;

      try {
        result = await FileIO.openJSON({
          extensions: config.extensions,
          mimeType: config.mimeType,
          description: config.description,
        });
      } catch (error) {
        console.error('Could not parse file:', error);
        toast('error', config.messages.invalid);
        return false;
      }

      if (!result) {
        return false;
      }

      // validate() is expected either to return false or to throw with a
      // message explaining what is wrong with the file
      try {
        if (config.validate && config.validate(result.data) === false) {
          throw new Error('Not a valid document');
        }
      } catch (error) {
        console.error('Invalid document:', error);

        // A validator that throws usually says something more useful than the
        // generic message, so prefer its wording
        toast('error', error.message || config.messages.invalid);
        return false;
      }

      if (!load(result.data, { name: result.name })) {
        toast('error', config.messages.invalid);
        return false;
      }

      toast('success', config.messages.loaded);
      return true;
    }

    async function save() {
      if (!loaded) {
        return false;
      }

      History.flushInteraction();

      if (!name && namePromptElement) {
        const entered = await namePromptElement.show();
        if (!entered) {
          return false;
        }
        setName(entered);
      }

      const data = config.serialize ? config.serialize() : null;
      if (data === null || data === undefined) {
        return false;
      }

      const written = await FileIO.saveJSON(data, {
        name: name || config.defaultName,
        extension: config.extension,
        mimeType: config.mimeType,
        description: config.description,
      });

      if (!written) {
        return false;
      }

      History.markSaved();
      updateTitle();
      toast('success', config.messages.saved);
      return true;
    }

    /**
     * options:
     *   title             - window title prefix
     *   defaultName       - filename used when the document is unnamed
     *   extension         - '.json'
     *   extensions        - accepted extensions when opening
     *   description       - file type description shown in the picker
     *   namePrompt        - e2-prompt element or selector
     *   createNew()       - returns a fresh document
     *   serialize()       - returns the current document
     *   deserialize(data) - applies a document, false to reject
     *   validate(data)    - false or throw to reject a loaded file
     *   onLoad(data)      - called after a successful load
     *   onChange()        - called after any history mutation
     *   messages          - toast text overrides
     *   historyLabels     - history entry labels for new / load
     */
    function initialise(options = {}) {
      Object.assign(config, options);
      config.extensions = options.extensions || [config.extension];
      config.historyLabels = {
        created: `New ${config.title.toLowerCase()}`,
        loaded: `Load ${config.title.toLowerCase()}`,
        ...(options.historyLabels || {}),
      };
      config.messages = {
        created: `New ${config.title.toLowerCase()} created!`,
        loaded: `${config.title} loaded successfully!`,
        saved: `${config.title} saved successfully!`,
        invalid: `That file is not a valid ${config.title.toLowerCase()}`,
        ...(options.messages || {}),
      };

      namePromptElement = resolveElement(options.namePrompt);
      name = options.initialName || '';

      History.initialise({
        serialize: config.serialize,
        deserialize: config.deserialize,
        interactionDebounce: options.interactionDebounce,
        pointerQuietPeriod: options.pointerQuietPeriod,
        bindPointerEvents: options.bindPointerEvents,
        onChange: () => {
          updateTitle();
          if (config.onChange) {
            config.onChange();
          }
        },
      });

      updateTitle();

      return Document;
    }

    return {
      initialise,
      new: createNew,
      open,
      save,
      load,
      updateTitle,
      setName,
      getName: () => name,
      isLoaded: () => loaded,
      isDirty: () => History.isDirty(),
      markSaved: () => History.markSaved(),
      serialize: () => (config.serialize ? config.serialize() : null),
    };
  })();

  // ---------------------------------------------------------------------------
  // Commands
  // ---------------------------------------------------------------------------

  // One declaration per command, carrying everything that used to be spread
  // across four places: the toolbar action switch, the context menu action
  // switch, the enablement pass over toolbar elements, and the keydown block.
  //
  // A command's id is the value of the `action` attribute on the elements that
  // trigger it, so binding is by markup rather than by another lookup table.

  const Commands = (() => {
    const commands = new Map();
    let scopes = {};
    let afterRun = null;
    let keysEnabled = true;

    /**
     * KeyboardEvent.key uses a literal ' ' for the space bar, which is
     * unreadable in a binding string, so 'Space' is accepted as an alias
     */
    function normaliseKey(key) {
      return key === ' ' ? 'space' : key.toLowerCase();
    }

    function parseKey(binding) {
      const parts = binding.split('+').map(part => part.trim().toLowerCase());
      const key = normaliseKey(parts.pop());
      return {
        key,
        ctrl: parts.includes('ctrl'),
        shift: parts.includes('shift'),
        alt: parts.includes('alt'),
        binding,
      };
    }

    function matchesKey(spec, event) {
      return (
        normaliseKey(event.key) === spec.key &&
        event.ctrlKey === spec.ctrl &&
        event.shiftKey === spec.shift &&
        event.altKey === spec.alt
      );
    }

    /**
     * True when the keystroke belongs to whatever the user is typing in
     *
     * Without this an editor-wide Ctrl+V binding fires while the user is
     * pasting text into a property field.
     */
    function isEditingContext(event) {
      const path = event.composedPath ? event.composedPath() : [event.target];
      for (const node of path) {
        if (!node || !node.tagName) {
          continue;
        }
        const tag = node.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
          return true;
        }
        if (node.isContentEditable) {
          return true;
        }
      }
      return false;
    }

    function elementLabel(command) {
      for (const element of command.elements) {
        const label = element.getAttribute?.('label');
        if (label) {
          return label;
        }
      }
      return null;
    }

    function contextFor(command) {
      const scope = command.scope ? scopes[command.scope] : null;
      return scope ? scope() : undefined;
    }

    /**
     * Register a command
     *
     * spec:
     *   id        - matches the `action` attribute of its trigger elements
     *   elements  - selector, element, or array of either
     *   keys      - keyboard bindings, e.g. ['Ctrl+X', 'Delete']
     *   scope     - named scope supplying the context passed to the callbacks
     *   label     - name shown in the shortcuts dialog; defaults to the
     *               `label` attribute of the first bound element
     *   group     - heading to file the command under in that dialog
     *   enabled(ctx) - whether the command can run right now
     *   visible(ctx) - whether its elements should be shown
     *   run(ctx, trigger) - performs the command; trigger is
     *               { element, event } when fired from the DOM
     *
     * A spec with no run() is a decoration: its elements follow enabled and
     * visible but it is never triggered. Useful for separators.
     */
    function register(spec) {
      if (!spec || !spec.id) {
        console.warn('Command registered without an id:', spec);
        return null;
      }

      if (commands.has(spec.id)) {
        console.warn(`Command "${spec.id}" registered more than once`);
      }

      const elements = resolveElements(spec.elements);
      if (spec.elements && elements.length === 0) {
        // Catches an action wired to an id that does not exist in the markup
        console.warn(
          `Command "${spec.id}" matched no elements:`,
          spec.elements
        );
      }

      const command = {
        ...spec,
        elements,
        keys: (spec.keys || []).map(parseKey),
      };

      commands.set(spec.id, command);
      return command;
    }

    function registerAll(specs) {
      for (const spec of specs) {
        register(spec);
      }
      return Commands;
    }

    function isEnabled(id) {
      const command = commands.get(id);
      if (!command) {
        return false;
      }
      return command.enabled ? !!command.enabled(contextFor(command)) : true;
    }

    /**
     * Run a command by id, if it exists and is currently enabled
     *
     * `trigger` carries the element that fired the command, so a command bound
     * to several menu items can read a data attribute to tell them apart.
     */
    async function run(id, trigger) {
      const command = commands.get(id);
      if (!command) {
        console.warn('Unknown command:', id);
        return false;
      }

      if (!command.run) {
        return false;
      }

      const context = contextFor(command);
      if (command.enabled && !command.enabled(context)) {
        return false;
      }

      await command.run(context, trigger);

      if (afterRun) {
        afterRun(id);
      }

      return true;
    }

    /**
     * Re-evaluate every command's predicates and sync its elements
     *
     * Because both the toolbar element and the context menu element for a
     * command are driven from the same predicate, they cannot disagree.
     */
    function refresh() {
      for (const command of commands.values()) {
        if (command.elements.length === 0) {
          continue;
        }

        const context = contextFor(command);

        if (command.enabled) {
          Utils.setEnabled(command.elements, !!command.enabled(context));
        }

        if (command.visible) {
          Utils.setVisible(command.elements, !!command.visible(context));
        }
      }
    }

    function handleKeydown(event) {
      if (!keysEnabled || isEditingContext(event)) {
        return;
      }

      for (const command of commands.values()) {
        for (const spec of command.keys) {
          if (!matchesKey(spec, event)) {
            continue;
          }

          // A disabled command yields the binding to the next one that wants
          // it, which lets a pair like play/pause share a single key
          if (command.enabled && !command.enabled(contextFor(command))) {
            break;
          }

          event.preventDefault();
          run(command.id);
          return;
        }
      }
    }

    /**
     * options:
     *   scopes      - map of scope name to a function returning a context
     *   events      - custom event names to listen for, each with a function
     *                 returning the element that triggered the command
     *   bindKeys    - listen for keyboard shortcuts (default true)
     *   onAfterRun  - called with the command id after a successful run
     */
    function initialise(options = {}) {
      scopes = options.scopes || {};
      afterRun = options.onAfterRun || null;
      keysEnabled = options.bindKeys !== false;

      const events = options.events || {
        'toolbar-button-click': event => event.detail?.button,
        'context-menu-item-click': event => event.detail?.item,
      };

      for (const [name, findElement] of Object.entries(events)) {
        document.addEventListener(name, async event => {
          const element = findElement(event);
          const action = element?.getAttribute?.('action');
          if (action) {
            await run(action, { element, event });
          }
        });
      }

      if (keysEnabled) {
        document.addEventListener('keydown', handleKeydown);
      }

      return Commands;
    }

    return {
      initialise,
      register,
      registerAll,
      run,
      refresh,
      isEnabled,
      has: id => commands.has(id),
      get: id => commands.get(id) || null,
      get size() {
        return commands.size;
      },
      /**
       * Every registered binding, for building a shortcuts dialog
       *
       * The label falls back to the `label` attribute of the first bound
       * element, so a command usually needs no label of its own.
       */
      bindings: () =>
        [...commands.values()]
          .filter(command => command.keys.length > 0)
          .map(command => ({
            id: command.id,
            label: command.label || elementLabel(command) || command.id,
            group: command.group || null,
            keys: command.keys.map(k => k.binding),
          })),
    };
  })();

  // ---------------------------------------------------------------------------
  // Shortcuts
  // ---------------------------------------------------------------------------

  // Renders the keyboard shortcuts dialog from the command registry, so it is
  // always accurate - a command that gains or loses a binding shows up here
  // without anything else being edited.

  const Shortcuts = (() => {
    let dialogElement = null;
    let containerElement = null;

    const KEY_LABELS = {
      arrowup: '↑',
      arrowdown: '↓',
      arrowleft: '←',
      arrowright: '→',
      pageup: 'Page Up',
      pagedown: 'Page Down',
      escape: 'Esc',
      ' ': 'Space',
      space: 'Space',
    };

    function formatKeyPart(part) {
      const lower = part.toLowerCase();
      if (KEY_LABELS[lower]) {
        return KEY_LABELS[lower];
      }
      if (part.length === 1) {
        return part.toUpperCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    }

    function keysElement(binding) {
      const span = document.createElement('span');
      span.className = 'shortcut-combo';

      for (const part of binding.split('+')) {
        const kbd = document.createElement('kbd');
        kbd.textContent = formatKeyPart(part.trim());
        span.appendChild(kbd);
      }

      return span;
    }

    function rowElement(binding) {
      const row = document.createElement('div');
      row.className = 'shortcut-row';

      const label = document.createElement('span');
      label.className = 'shortcut-label';
      label.textContent = binding.label;
      row.appendChild(label);

      const keys = document.createElement('span');
      keys.className = 'shortcut-keys';

      binding.keys.forEach((combo, index) => {
        if (index > 0) {
          const or = document.createElement('span');
          or.className = 'shortcut-or';
          or.textContent = 'or';
          keys.appendChild(or);
        }
        keys.appendChild(keysElement(combo));
      });

      row.appendChild(keys);
      return row;
    }

    /**
     * Rebuild the list from whatever is currently registered
     */
    function render() {
      if (!containerElement) {
        return;
      }

      containerElement.replaceChildren();

      // Group in registration order rather than alphabetically, so the dialog
      // follows the same ordering as the toolbar
      const groups = new Map();
      for (const binding of Commands.bindings()) {
        const name = binding.group || '';
        if (!groups.has(name)) {
          groups.set(name, []);
        }
        groups.get(name).push(binding);
      }

      if (groups.size === 0) {
        const empty = document.createElement('p');
        empty.className = 'shortcut-empty';
        empty.textContent = 'No keyboard shortcuts are defined.';
        containerElement.appendChild(empty);
        return;
      }

      for (const [name, bindings] of groups) {
        const group = document.createElement('div');
        group.className = 'shortcut-group';

        if (name) {
          const heading = document.createElement('h3');
          heading.textContent = name;
          group.appendChild(heading);
        }

        for (const binding of bindings) {
          group.appendChild(rowElement(binding));
        }

        containerElement.appendChild(group);
      }
    }

    function show() {
      render();
      dialogElement?.showModal();
    }

    function close() {
      dialogElement?.close();
    }

    /**
     * options:
     *   dialog      - e2-dialog element or selector
     *   container   - element the list is rendered into
     *   closeButton - optional button that closes the dialog
     */
    function initialise(options = {}) {
      dialogElement = resolveElement(options.dialog);
      containerElement = resolveElement(options.container);

      const closeButton = resolveElement(options.closeButton);
      closeButton?.addEventListener('click', close);

      return Shortcuts;
    }

    return { initialise, render, show, close };
  })();

  // ---------------------------------------------------------------------------
  // Exports
  // ---------------------------------------------------------------------------

  window.EditorCommon = {
    VERSION,
    Utils,
    Storage,
    Theme,
    Settings,
    StatusBar,
    HistoryView,
    CanvasHost,
    History,
    FileIO,
    Document,
    Commands,
    Shortcuts,
  };
})(window, document);
