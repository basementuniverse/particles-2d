import { circle, line } from '@basementuniverse/canvas-helpers';
import {
  aabb,
  distance,
  pointInAABB,
  pointInCircle,
  pointInPolygon,
  pointInRectangle,
} from '@basementuniverse/intersection-helpers/2d';
import { vectorAlmostZero } from '@basementuniverse/intersection-helpers/utilities';
import { parseColor } from '@basementuniverse/parsecolor';
import {
  clamp,
  cltRandomInt,
  randomBetween,
  randomIntBetween,
  unlerp,
} from '@basementuniverse/utils';
import { vec2 } from '@basementuniverse/vec';

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

export type RandomRange<T extends number | vec2 = number> = {
  min: T;
  max: T;
};

function isVec2(value: any): value is vec2 {
  return typeof value === 'object' && 'x' in value && 'y' in value;
}

function isRandomRange(value: any): value is RandomRange {
  return typeof value === 'object' && 'min' in value && 'max' in value;
}

function calculateRandomRange<T extends number | vec2 = number>(
  range: RandomRange,
  integer: boolean = false
): T {
  const r = integer ? randomIntBetween : randomBetween;
  if (isVec2(range.min) && isVec2(range.max)) {
    return vec2(r(range.min.x, range.max.x), r(range.min.y, range.max.y)) as T;
  }
  return r(range.min, range.max) as T;
}

export type Color = {
  r: number;
  g: number;
  b: number;
  a?: number;
};

function colorToString(color: Color): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a ?? 1})`;
}

function isColorObject(color: Color | string): color is Color {
  return (
    typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color
  );
}

function prepareColor(color: Color | string | Color[] | string[]): string {
  if (Array.isArray(color)) {
    return prepareColor(color[randomIntBetween(0, color.length - 1)]);
  }
  if (isColorObject(color)) {
    return colorToString(color);
  }
  return color;
}

function makeTransparent(color: Color | string): Color {
  if (isColorObject(color)) {
    return { ...color, a: 0 };
  }
  const parsed = parseColor(color);
  return { ...parsed, a: 0 };
}

/**
 * Check if a particle should be affected by an element based on the use setting
 * @param useSetting - The particle's use setting (boolean, string, or string[])
 * @param elementId - The optional id of the element
 * @returns true if the particle should be affected by this element
 */
function shouldUseElement(
  useSetting: boolean | string | string[],
  elementId?: string
): boolean {
  // false means don't use any
  if (useSetting === false) {
    return false;
  }

  // true means use all
  if (useSetting === true) {
    return true;
  }

  // string or string[] means use specific ids
  if (typeof useSetting === 'string') {
    return elementId === useSetting;
  }

  // Array of strings
  if (Array.isArray(useSetting)) {
    return elementId !== undefined && useSetting.includes(elementId);
  }

  return false;
}

// -----------------------------------------------------------------------------
// Particle System
// -----------------------------------------------------------------------------

export class ParticleSystem {
  public particles: Particle[] = [];
  public emitters: Emitter[] = [];
  public attractors: Attractor[] = [];
  public forceFields: ForceField[] = [];
  public colliders: Collider[] = [];
  public sinks: Sink[] = [];

  public get disposed(): boolean {
    return (
      (this.particles.length === 0 ||
        this.particles.every(particle => particle.disposed)) &&
      (this.emitters.length === 0 ||
        this.emitters.every(emitter => emitter.disposed))
    );
  }

  public update(dt: number) {
    // Update particles
    this.particles.forEach(particle => {
      if (!particle.disposed) {
        particle.update(this, dt);
      }
    });
    this.particles = this.particles.filter(particle => !particle.disposed);

    // Update emitters
    this.emitters.forEach(emitter => {
      if (!emitter.disposed) {
        emitter.update(this, dt);
      }
    });
    this.emitters = this.emitters.filter(emitter => !emitter.disposed);

    // Update attractors
    this.attractors.forEach(attractor => {
      if (!attractor.disposed) {
        attractor.update(dt);
      }
    });
    this.attractors = this.attractors.filter(attractor => !attractor.disposed);

    // Update force fields
    this.forceFields.forEach(forceField => {
      if (!forceField.disposed) {
        forceField.update(dt);
      }
    });
    this.forceFields = this.forceFields.filter(
      forceField => !forceField.disposed
    );

    // Update sinks
    this.sinks.forEach(sink => {
      if (!sink.disposed) {
        sink.update(dt);
      }
    });
    this.sinks = this.sinks.filter(sink => !sink.disposed);
  }

  public draw(context: CanvasRenderingContext2D) {
    this.particles.forEach(particle => {
      if (!particle.disposed) {
        particle.draw(this, context);
      }
    });
  }
}

// -----------------------------------------------------------------------------
// Particles
// -----------------------------------------------------------------------------

const PARTICLE_DEFAULT_UPDATE_TYPES = [
  'age',
  'physics',
  'direction',
  'position',
];

type ParticleDefaultUpdateTypes =
  (typeof PARTICLE_DEFAULT_UPDATE_TYPES)[number][];

const PARTICLE_DEFAULT_DRAW_TYPES = ['transforms', 'fade', 'styles'];

type ParticleDefaultDrawTypes = (typeof PARTICLE_DEFAULT_DRAW_TYPES)[number][];

export type ParticleOptions = {
  /**
   * Should this particle be affected by attractors.
   * - false: not affected by any attractors
   * - true: affected by all attractors
   * - string: affected by attractor with this id
   * - string[]: affected by attractors with these ids
   */
  useAttractors: boolean | string | string[];

  /**
   * Should this particle be affected by force fields.
   * - false: not affected by any force fields
   * - true: affected by all force fields
   * - string: affected by force field with this id
   * - string[]: affected by force fields with these ids
   */
  useForceFields: boolean | string | string[];

  /**
   * Should this particle be affected by colliders.
   * - false: not affected by any colliders
   * - true: affected by all colliders
   * - string: affected by collider with this id
   * - string[]: affected by colliders with these ids
   */
  useColliders: boolean | string | string[];

  /**
   * Should this particle be affected by sinks.
   * - false: not affected by any sinks
   * - true: affected by all sinks
   * - string: affected by sink with this id
   * - string[]: affected by sinks with these ids
   */
  useSinks: boolean | string | string[];

  /**
   * Maximum speed (velocity magnitude) for this particle. Use -1 for no limit.
   */
  maxSpeed: number;

  /**
   * What kind of default update logic to apply. This can be 'all', 'none', or
   * an array of specific updates to apply:
   *
   * - 'none': no default update, only custom updates will be applied
   * - 'all': apply all updates, including custom updates if provided
   * - 'age': apply age updates and dispose when lifespan is reached
   * - 'physics': apply physics updates (attractors, force fields, colliders)
   * - 'direction': apply direction updates (calculate rotation based on
   *   velocity)
   * - 'position': apply position updates (integrate velocity over time)
   */
  defaultUpdates: 'none' | 'all' | ParticleDefaultUpdateTypes;
  update?: (system: ParticleSystem, dt: number) => void;

  /**
   * What kind of default rendering logic to apply. This can be 'all', 'none',
   * or an array of specific draws to apply:
   *
   * - 'none': no default rendering, only custom rendering will be applied
   * - 'all': apply all rendering logic, including custom rendering if provided
   * - 'transforms': apply basic translation transform, and rotation transform
   *   if using 'image' style
   * - 'fade': apply fade in/out effects based on particle age
   * - 'styles': render particles using one of the default styles (e.g. 'dot',
   *   'line', etc.)
   */
  defaultDraws: 'none' | 'all' | ParticleDefaultDrawTypes;

  /**
   * Called before default style rendering, useful for setting context state
   * (e.g. shadow, global alpha, etc.) before drawing particles
   */
  preDraw?: (system: ParticleSystem, context: CanvasRenderingContext2D) => void;

  /**
   * Called after default style rendering, useful for rendering additional
   * effects or overlays after default styles have been drawn
   */
  postDraw?: (
    system: ParticleSystem,
    context: CanvasRenderingContext2D
  ) => void;
};

const DEFAULT_PARTICLE_OPTIONS: ParticleOptions = {
  useAttractors: true,
  useForceFields: true,
  useColliders: true,
  useSinks: true,
  maxSpeed: -1,
  defaultUpdates: 'all',
  defaultDraws: 'all',
};

function prepareDefaultUpdates(
  defaultUpdates: ParticleOptions['defaultUpdates']
): ParticleDefaultUpdateTypes {
  if (!Array.isArray(defaultUpdates)) {
    return defaultUpdates === 'all' ? [...PARTICLE_DEFAULT_UPDATE_TYPES] : [];
  }
  return defaultUpdates.filter(update =>
    PARTICLE_DEFAULT_UPDATE_TYPES.includes(update)
  );
}

function prepareDefaultDraws(
  defaultDraws: ParticleOptions['defaultDraws']
): ParticleDefaultDrawTypes {
  if (!Array.isArray(defaultDraws)) {
    return defaultDraws === 'all' ? [...PARTICLE_DEFAULT_DRAW_TYPES] : [];
  }
  return defaultDraws.filter(draw =>
    PARTICLE_DEFAULT_DRAW_TYPES.includes(draw)
  );
}

type GlowStyle = {
  color: Color | string | Color[] | string[];
  amount: number;
};

function prepareGlow(
  context: CanvasRenderingContext2D,
  glow: GlowStyle,
  actualColor: string = 'white'
) {
  context.shadowColor = actualColor;
  context.shadowBlur = glow.amount;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
}

type FadeStyle = {
  in: number;
  out: number;
};

type TrailStyle = {
  length: number;
  color?: Color | string | Color[] | string[];
  width?: number;
  widthDecay?: number;
  alphaDecay?: number;

  /**
   * How quickly trail segments fade out (in seconds). When a particle stops,
   * the trail will continue to fade based on this value.
   * Lower values = faster fade.
   * Default: 0.5 seconds
   */
  decayTime?: number;
};

export type ParticleStyle = (
  | {
      style: 'dot';
      color: Color | string | Color[] | string[];
      glow?: GlowStyle;
    }
  | {
      style: 'radial';
      color: Color | string | Color[] | string[];
    }
  | {
      style: 'line';
      color: Color | string | Color[] | string[];
      rotationOffset?: number;
      glow?: GlowStyle;
    }
  | {
      style: 'image';
      image: HTMLImageElement;
      rotationOffset?: number;
    }
) & {
  fade?: FadeStyle;
  trail?: TrailStyle;
};

const DEFAULT_PARTICLE_STYLE: ParticleStyle = {
  style: 'dot',
  color: 'white',
};

export class Particle {
  private static readonly MINIMUM_TRAIL_MOVEMENT_THRESHOLD = 5;

  public age: number = 0;
  public style: ParticleStyle | null = null;
  private actualRotation: number = 0;
  private actualColor: string = '#fff';
  private actualColorTransparent: string = '#fff0';
  private actualGlowColor: string = '#fff';
  private options: ParticleOptions;
  private _disposed: boolean = false;
  private trailSegments: Array<{
    position: vec2;
    age: number; // Time since this segment was created
    speed: number; // Speed at creation (for width calculations)
  }> = [];

  public constructor(
    /**
     * Initial position of the particle
     */
    public position: vec2,

    /**
     * Initial velocity of the particle
     */
    public velocity: vec2,

    /**
     * Size of the particle. This is used differently based on the style:
     *
     * - 'dot' style: we use the maximum of x and y as the radius
     * - 'line' style: x is the length of the line, y is the line width
     * - 'radial' style: we use the maximum of x and y as the radius
     * - 'image' style: x and y are the width and height of the image
     */
    public size: vec2,

    /**
     * Rotation of the particle in radians
     *
     * _(Note: not used for 'dot' and 'radial' styles)_
     *
     * If this is null, we calculate rotation based on velocity
     */
    public rotation: number | null = null,

    /**
     * Lifespan of the particle in seconds
     */
    public lifespan: number = 1,

    /**
     * Style options for the particle. This can be used to define a default
     * rendering style and associated settings for the style
     *
     * The style can be one of:
     *
     * - 'dot': a simple dot with a color and optional glow
     * - 'radial': a radial gradient with a color that fades to transparent
     * - 'line': a line segment with a color, optional glow, and optional
     *   rotation (the rotation can be relative or absolute)
     * - 'image': an image with an optional rotation (the rotation can be
     *   relative or absolute)
     *
     * If this is null, the particle will use the custom rendering hook if
     * provided, or it will be invisible if no custom rendering is provided
     *
     * Omit this field or set it to undefined to use the default style
     */
    style?: Partial<ParticleStyle> | null,

    /**
     * Provide custom update logic and rendering logic here
     */
    options?: Partial<ParticleOptions>
  ) {
    if (style !== null) {
      this.style = Object.assign({}, DEFAULT_PARTICLE_STYLE, style ?? {});
    }
    this.options = Object.assign({}, DEFAULT_PARTICLE_OPTIONS, options ?? {});

    // Prepare colors
    if (this.style && 'color' in this.style) {
      this.actualColor = prepareColor(this.style.color);
      this.actualColorTransparent = colorToString(
        makeTransparent(this.actualColor)
      );
      if ('glow' in this.style) {
        this.actualGlowColor = prepareColor(this.style.glow?.color ?? 'white');
      }
    }

    // Initialize trail segments with current position if trail is enabled
    if (this.style?.trail) {
      this.trailSegments.push({
        position: vec2(position),
        age: 0,
        speed: vec2.len(velocity),
      });
    }
  }

  public get disposed(): boolean {
    return this._disposed;
  }

  public get normalisedLifeRemaining(): number {
    if (this.lifespan <= 0) {
      return 0;
    }
    return unlerp(this.age, 0, this.lifespan);
  }

  public update(system: ParticleSystem, dt: number) {
    const defaultUpdates = prepareDefaultUpdates(this.options.defaultUpdates);

    // Optionally handle particle lifespan
    if (defaultUpdates.includes('age')) {
      this.age += dt;

      // Dispose the particle when its lifespan is reached
      if (this.age >= this.lifespan) {
        this._disposed = true;
      }
    }

    // Optionally handle particle physics, i.e. forces from attractors, force
    // fields, colliders, and sinks
    if (defaultUpdates.includes('physics')) {
      if (this.options.useAttractors !== false) {
        system.attractors.forEach(attractor => {
          if (
            !attractor.disposed &&
            shouldUseElement(this.options.useAttractors, attractor.id)
          ) {
            attractor.applyForce(this, dt);
          }
        });
      }

      if (this.options.useForceFields !== false) {
        system.forceFields.forEach(forceField => {
          if (
            !forceField.disposed &&
            shouldUseElement(this.options.useForceFields, forceField.id)
          ) {
            forceField.applyForce(this, system, dt);
          }
        });
      }

      if (this.options.useSinks !== false) {
        system.sinks.forEach(sink => {
          if (
            !sink.disposed &&
            shouldUseElement(this.options.useSinks, sink.id)
          ) {
            sink.affect(this, dt);
          }
        });
      }

      if (this.options.useColliders !== false) {
        system.colliders.forEach(collider => {
          if (shouldUseElement(this.options.useColliders, collider.id)) {
            collider.handleCollision(this);
          }
        });
      }

      // Cap velocity to maxSpeed if specified
      if (this.options.maxSpeed > 0) {
        const speed = vec2.len(this.velocity);
        if (speed > this.options.maxSpeed) {
          this.velocity = vec2.scale(
            vec2.nor(this.velocity),
            this.options.maxSpeed
          );
        }
      }
    }

    // Call custom update hook if provided
    if (this.options.update) {
      this.options.update.bind(this)(system, dt);
    }

    // Update rotation and, if configured, calculate rotation based on velocity
    this.actualRotation = this.rotation ?? 0;
    if (defaultUpdates.includes('direction') && this.rotation === null) {
      this.actualRotation = vec2.rad(this.velocity);
    }

    // Optionally handle position integration over time
    if (defaultUpdates.includes('position')) {
      this.position = vec2.add(this.position, vec2.scale(this.velocity, dt));
    }

    // Update trail segments if trail is enabled
    if (this.style?.trail) {
      const decayTime = this.style.trail.decayTime ?? 0.5;

      // Age all existing segments
      for (let i = 0; i < this.trailSegments.length; i++) {
        this.trailSegments[i].age += dt;
      }

      // Remove segments that are too old
      this.trailSegments = this.trailSegments.filter(
        segment => segment.age < decayTime
      );

      // Add new segment if we've moved enough (only during position updates)
      if (defaultUpdates.includes('position')) {
        const lastSegment = this.trailSegments[this.trailSegments.length - 1];
        if (
          !lastSegment ||
          distance(lastSegment.position, this.position) >=
            Particle.MINIMUM_TRAIL_MOVEMENT_THRESHOLD
        ) {
          // Keep only the most recent positions based on trail length
          if (this.trailSegments.length >= this.style.trail.length) {
            this.trailSegments.shift();
          }

          this.trailSegments.push({
            position: vec2(this.position),
            age: 0,
            speed: vec2.len(this.velocity),
          });
        }
      }
    }
  }

  private drawTrail(
    context: CanvasRenderingContext2D,
    particleAlpha: number = 1
  ) {
    if (!this.style?.trail || this.trailSegments.length < 2) {
      return;
    }

    const trail = this.style.trail;
    const decayTime = trail.decayTime ?? 0.5;

    // Determine trail color
    const trailColor = trail.color
      ? prepareColor(trail.color)
      : this.style.style !== 'image' && 'color' in this.style
        ? this.actualColor
        : null;

    if (!trailColor) {
      return; // No valid color available
    }

    // Determine base width
    const baseWidth =
      trail.width ??
      (this.style.style === 'line'
        ? this.size.y
        : Math.max(this.size.x, this.size.y));

    context.save();
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // Draw trail segments with time-based and position-based fading
    const widthDecay = Math.min(1, trail.widthDecay ?? 1);
    const segmentCount = this.trailSegments.length - 1;

    for (let i = 0; i < segmentCount; i++) {
      const start = this.trailSegments[i];
      const end = this.trailSegments[i + 1];

      // Calculate progress along trail (0 = oldest, 1 = newest)
      const progress = i / segmentCount;

      // Calculate time-based fade (older segments fade out based on age)
      const timeFade = Math.max(0, 1 - start.age / decayTime);

      // Calculate position-based alpha fade (consistent with width decay)
      const alphaDecay = Math.min(1, trail.alphaDecay ?? 1);
      const alphaDecayFactor = 1 - (1 - progress) * alphaDecay;

      // Combine fades
      const alpha = timeFade * alphaDecayFactor * particleAlpha;

      // Skip nearly invisible segments for performance
      if (alpha <= 0.01) {
        continue;
      }

      // Calculate width based on decay (newest segments should be fullest)
      const decayFactor = 1 - (1 - progress) * widthDecay;
      const width = baseWidth * decayFactor;

      // Draw segment
      context.beginPath();
      context.strokeStyle = trailColor;
      context.lineWidth = width;
      context.globalAlpha = alpha;
      context.moveTo(start.position.x, start.position.y);
      context.lineTo(end.position.x, end.position.y);
      context.stroke();
    }

    context.restore();
  }

  public draw(system: ParticleSystem, context: CanvasRenderingContext2D) {
    const defaultDraws = prepareDefaultDraws(this.options.defaultDraws);

    context.save();

    // Optionally handle fade in/out effects
    let fadeAlpha = 1;
    if (defaultDraws.includes('fade') && this.style?.fade) {
      const fadeIn =
        this.style.fade.in === 0
          ? 1
          : clamp(unlerp(0, this.style.fade.in, this.age), 0, 1);
      const fadeOut =
        this.style.fade.out === 0
          ? 1
          : clamp(
              unlerp(
                this.lifespan,
                this.lifespan - this.style.fade.out,
                this.age
              ),
              0,
              1
            );
      fadeAlpha = clamp(fadeIn * fadeOut, 0, 1);
    }

    // Draw trail before applying particle transforms
    if (defaultDraws.includes('styles') && this.style?.trail) {
      this.drawTrail(context, fadeAlpha);
    }

    // Optionally apply transforms
    if (defaultDraws.includes('transforms')) {
      context.translate(this.position.x, this.position.y);
    }

    context.globalAlpha = fadeAlpha;

    // Call custom pre-draw hook if provided
    if (this.options.preDraw) {
      this.options.preDraw.bind(this)(system, context);
    }

    // Optionally render one of the default styles if configured
    if (defaultDraws.includes('styles') && this.style !== null) {
      switch (this.style.style) {
        case 'dot':
          // Dot style renders a circle with a fill color
          if (this.style.glow) {
            prepareGlow(context, this.style.glow, this.actualGlowColor);
          }
          circle(context, vec2(), Math.max(this.size.x, this.size.y) / 2, {
            fill: true,
            fillColor: this.actualColor,
            stroke: false,
          });
          break;

        case 'radial':
          // Radial style renders a radial gradient circle
          const size = Math.max(this.size.x, this.size.y) / 2;
          const gradient = context.createRadialGradient(0, 0, 0, 0, 0, size);
          const startColor = this.actualColor;
          const endColor = this.actualColorTransparent;
          gradient.addColorStop(0, startColor);
          gradient.addColorStop(1, endColor);
          context.fillStyle = gradient;
          context.beginPath();
          context.arc(0, 0, size, 0, Math.PI * 2);
          context.fill();
          context.closePath();
          break;

        case 'line':
          // Line style renders a line segment with a stroke color
          if (this.style.glow) {
            prepareGlow(context, this.style.glow, this.actualGlowColor);
          }
          const angle =
            (this.actualRotation ?? 0) + (this.style.rotationOffset ?? 0);
          const length = this.size.x;
          const lineWidth = this.size.y;
          const vector = vec2.rot(vec2(length, 0), angle);
          line(context, vec2.scale(vector, -0.5), vec2.scale(vector, 0.5), {
            lineWidth,
            strokeColor: this.actualColor,
          });
          break;

        case 'image':
          // Image style renders an image with optional rotation
          if (defaultDraws.includes('transforms')) {
            const angle =
              (this.actualRotation ?? 0) + (this.style.rotationOffset ?? 0);
            context.rotate(angle);
          }
          context.drawImage(
            this.style.image,
            -this.size.x / 2,
            -this.size.y / 2,
            this.size.x,
            this.size.y
          );
          break;
      }
    }

    // Call custom post-draw hook if provided
    if (this.options.postDraw) {
      this.options.postDraw.bind(this)(system, context);
    }

    context.restore();
  }
}

// -----------------------------------------------------------------------------
// Emitters
// -----------------------------------------------------------------------------

export type EmitterOptions = {
  /**
   * Particle definition. Defines the type of particles emitted by the emitter
   */
  particles: {
    /**
     * How to distribute initial particle positions within the emitter area:
     *
     * - 'uniform': uniform distribution within the area
     * - 'normal': normal distribution from the center of the emitter area
     * - a custom function which takes the number of particles emitted so far in
     *   the current round of emission and returns a position vector
     */
    position: 'uniform' | 'normal' | ((n: number) => vec2);

    /**
     * The initial speed of new particles. This affects the initial velocity
     * applied to each particle
     *
     * This can be one of:
     *
     * - a fixed speed
     * - a range of random speeds (min and max)
     * - a custom function which takes the number of particles emitted so far in
     *   the current round of emission and returns a speed value
     */
    speed: number | RandomRange | ((n: number) => number);

    /**
     * The initial direction of new particles. This affects the initial velocity
     * applied to each particle
     *
     * This can be one of:
     *
     * - a fixed angle in radians
     * - a range of random angles (min and max)
     * - a custom function which takes the number of particles emitted so far in
     *   the current round of emission and returns a direction value in radians
     */
    direction: number | RandomRange | ((n: number) => number);

    /**
     * The initial size of new particles. This can be one of:
     *
     * - a fixed size vector (x, y)
     * - a range of random sizes (min and max)
     * - a custom function which takes the number of particles emitted so far in
     *   the current round of emission and returns a size vector (x, y)
     */
    size: vec2 | RandomRange | ((n: number) => vec2);

    /**
     * The initial rotation of new particles in radians. This can be one of:
     *
     * - a fixed rotation in radians
     * - a range of random rotations (min and max)
     * - a custom function which takes the number of particles emitted so far in
     *   the current round of emission and returns a rotation value in radians
     * - null, meaning the particles' rotation will be calculated based on their
     *   velocity vector
     */
    rotation: number | RandomRange | ((n: number) => number) | null;

    /**
     * The lifespan of new particles in seconds. This can be one of:
     *
     * - a fixed lifespan in seconds
     * - a range of random lifespans (min and max)
     * - a custom function which takes the number of particles emitted so far in
     *   the current round of emission and returns a lifespan value in seconds
     */
    lifespan: number | RandomRange | ((n: number) => number);

    /**
     * The style options for new particles
     */
    style?: Partial<ParticleStyle> | null;

    /**
     * Additional options for the particle, such as custom update logic or
     * rendering logic
     */
    options?: Partial<ParticleOptions>;
  };

  /**
   * Controls the rate at which particles are emitted. This can be one of:
   *
   * - 'rate': emit some number of particles per second
   * - 'burst': emit a random number of particles at once
   * - 'custom': provide a custom function which returns the number of particles
   *   to emit on each update
   */
  emission:
    | {
        type: 'rate';
        rate: number | RandomRange;
      }
    | {
        type: 'burst';
        n: number | RandomRange;
        delay?: number;
      }
    | {
        type: 'custom';
        f: () => number;
      };
};

const DEFAULT_EMITTER_OPTIONS: EmitterOptions = {
  particles: {
    position: 'uniform',
    speed: 0,
    direction: 0,
    size: vec2(1),
    rotation: null,
    lifespan: 1,
    style: DEFAULT_PARTICLE_STYLE,
    options: DEFAULT_PARTICLE_OPTIONS,
  },
  emission: {
    type: 'rate',
    rate: 1,
  },
};

export class Emitter {
  private static readonly RANDOM_RATE_CHANGE_INTERVAL = 1;

  public age: number = 0;
  public totalParticlesEmitted: number = 0;
  private options: EmitterOptions;
  private _disposed: boolean = false;
  private currentRate: number = 0;
  private lastRateChange: number = 0;
  private particlesToEmit: number = 0;

  public constructor(
    public position: vec2,
    public size: vec2 = vec2(0, 0),
    public lifespan: number = -1,
    options?: Partial<EmitterOptions>
  ) {
    this.options = Object.assign({}, DEFAULT_EMITTER_OPTIONS, options ?? {});
  }

  public get disposed(): boolean {
    return this._disposed;
  }

  public update(system: ParticleSystem, dt: number) {
    // Handle emitter aging and dispose if we've reached the lifespan
    this.age += dt;
    if (this.lifespan !== -1 && this.age >= this.lifespan) {
      this._disposed = true;
      return;
    }

    // Handle particle emission based on the type of emission configured
    switch (this.options.emission.type) {
      case 'rate':
        // Rate mode emits particles continuously at a specified rate
        // Handle random rate changes
        this.lastRateChange += dt;
        if (
          this.currentRate <= 0 ||
          this.lastRateChange >= Emitter.RANDOM_RATE_CHANGE_INTERVAL
        ) {
          this.lastRateChange = 0;

          // The actual emission rate can be a fixed value or a random range
          this.currentRate = isRandomRange(this.options.emission.rate)
            ? calculateRandomRange(this.options.emission.rate)
            : this.options.emission.rate;
        }

        // Accumulate a fractional number of particles to emit
        this.particlesToEmit += this.currentRate * dt;

        // Emit particles if we have enough to emit
        if (this.particlesToEmit >= 1) {
          // Get the whole number of particles to emit
          const n = Math.floor(this.particlesToEmit);

          // Subtract the number of particles, keeping the remainder
          this.particlesToEmit -= n;

          // Emit the particles
          this.emitParticles(system, n);
          this.totalParticlesEmitted += n;
        }
        break;

      case 'burst':
        // Burst mode emits a fixed or random number of particles at once (or
        // after a delay) and then immediately disposes the emitter
        if (
          !this.options.emission.delay ||
          this.age >= this.options.emission.delay
        ) {
          // The number of particles to emit can be a fixed value or a random
          // range
          const n = isRandomRange(this.options.emission.n)
            ? calculateRandomRange(this.options.emission.n, true)
            : Math.ceil(this.options.emission.n);
          if (n > 0) {
            this.emitParticles(system, n);
            this.totalParticlesEmitted += n;

            // Keep trying to emit until we've emitted at least one particle
            this._disposed = true;
          }
        }
        break;

      case 'custom':
        // Custom mode allows for a custom function to determine how many
        // particles to emit on each update
        const n = Math.ceil(this.options.emission.f.bind(this)());
        if (n > 0) {
          this.emitParticles(system, n);
          this.totalParticlesEmitted += n;
        }
        break;
    }
  }

  private emitParticles(system: ParticleSystem, n: number) {
    for (let i = 0; i < n; i++) {
      const particle = this.createParticle(system, i);
      if (particle) {
        system.particles.push(particle);
      }
    }
  }

  private createParticle(system: ParticleSystem, n: number): Particle {
    // Generate position
    let position: vec2;
    if (vectorAlmostZero(this.size)) {
      // Emitter size is zero, so use the exact emitter position
      position = vec2(this.position);
    } else {
      switch (this.options.particles.position) {
        case 'uniform':
          // Uniform distribution within the emitter area
          position = vec2(
            randomIntBetween(
              this.position.x - this.size.x / 2,
              this.position.x + this.size.x / 2
            ),
            randomIntBetween(
              this.position.y - this.size.y / 2,
              this.position.y + this.size.y / 2
            )
          );
          break;

        case 'normal':
          // Normal distribution from the center of the emitter area
          position = vec2(
            cltRandomInt(
              this.position.x - this.size.x / 2,
              this.position.x + this.size.x / 2
            ),
            cltRandomInt(
              this.position.y - this.size.y / 2,
              this.position.y + this.size.y / 2
            )
          );
          break;

        default:
          if (typeof this.options.particles.position === 'function') {
            // Custom position function
            position = this.options.particles.position.bind(this)(n);
          } else {
            // Something went wrong, fall back to emitter position
            position = vec2(this.position);
          }
      }
    }

    // Generate velocity
    let speed: number;
    if (typeof this.options.particles.speed === 'function') {
      // Custom speed function
      speed = this.options.particles.speed.bind(this)(n);
    } else if (isRandomRange(this.options.particles.speed)) {
      // Random speed range
      speed = calculateRandomRange(this.options.particles.speed, true);
    } else {
      // Fixed speed
      speed = this.options.particles.speed;
    }
    let direction: number;
    if (typeof this.options.particles.direction === 'function') {
      // Custom direction function
      direction = this.options.particles.direction.bind(this)(n);
    } else if (isRandomRange(this.options.particles.direction)) {
      // Random direction range
      direction = calculateRandomRange(this.options.particles.direction);
    } else {
      // Fixed direction
      direction = this.options.particles.direction;
    }
    const velocity = vec2.rot(vec2(speed, 0), direction);

    // Generate size
    let size: vec2;
    if (typeof this.options.particles.size === 'function') {
      // Custom size function
      size = this.options.particles.size.bind(this)(n);
    } else if (isRandomRange(this.options.particles.size)) {
      // Random size range
      size = calculateRandomRange(this.options.particles.size);
    } else {
      // Fixed size
      size = this.options.particles.size;
    }

    // Generate rotation
    let rotation: number | null;
    if (this.options.particles.rotation === null) {
      rotation = null;
    } else if (typeof this.options.particles.rotation === 'function') {
      // Custom rotation function
      rotation = this.options.particles.rotation.bind(this)(n);
    } else if (isRandomRange(this.options.particles.rotation)) {
      // Random rotation range
      rotation = calculateRandomRange<number>(this.options.particles.rotation);
    } else {
      // Fixed rotation
      rotation = this.options.particles.rotation;
    }

    // Generate lifespan
    let lifespan: number;
    if (typeof this.options.particles.lifespan === 'function') {
      // Custom lifespan function
      lifespan = this.options.particles.lifespan.bind(this)(n);
    } else if (isRandomRange(this.options.particles.lifespan)) {
      // Random lifespan range
      lifespan = calculateRandomRange<number>(this.options.particles.lifespan);
    } else {
      // Fixed lifespan
      lifespan = this.options.particles.lifespan;
    }

    return new Particle(
      position,
      velocity,
      size,
      rotation,
      lifespan,
      this.options.particles.style,
      this.options.particles.options
    );
  }
}

// -----------------------------------------------------------------------------
// Attractors
// -----------------------------------------------------------------------------

export class Attractor {
  public age: number = 0;
  private _disposed: boolean = false;

  public constructor(
    public position: vec2,
    public range: number = 100,
    public force: number = 1,
    public falloff: number = 1,
    public lifespan: number = -1,
    public id?: string
  ) {}

  public get disposed(): boolean {
    return this._disposed;
  }

  public applyForce(particle: Particle, dt: number) {
    // Calculate distance to the particle
    const d = distance(this.position, particle.position);
    if (d > this.range) {
      return; // Particle is out of range
    }

    // Prevent divide-by-zero with a small minimum distance
    const minDistance = 1;
    const safeDistance = Math.max(d, minDistance);

    // Calculate direction vector from particle to attractor
    const direction = vec2.sub(this.position, particle.position);
    const normalizedDirection = vec2.nor(direction);

    // Use configurable falloff instead of fixed inverse square law
    // Higher falloff values create steeper gradients (stronger close-range effects)
    // Lower falloff values create gentler gradients (more uniform force fields)
    const distanceFactor = 1 / Math.pow(safeDistance, this.falloff);

    // Apply smooth range falloff at the boundary
    const rangeFactor = d / this.range;
    const rangeFalloff = Math.max(0, 1 - rangeFactor * rangeFactor);

    // Calculate final force vector
    const finalForceStrength = this.force * distanceFactor * rangeFalloff;
    const forceVector = vec2.scale(normalizedDirection, finalForceStrength);

    // Apply the force to the particle's velocity
    particle.velocity = vec2.add(
      particle.velocity,
      vec2.scale(forceVector, dt)
    );
  }

  public update(dt: number) {
    this.age += dt;

    // Dispose the attractor when its lifespan is reached
    if (this.lifespan !== -1 && this.age >= this.lifespan) {
      this._disposed = true;
    }
  }
}

// -----------------------------------------------------------------------------
// Forcefields
// -----------------------------------------------------------------------------

export class ForceField {
  public age: number = 0;
  private _disposed: boolean = false;

  public constructor(
    public force: vec2 = vec2(0, 0),
    public lifespan: number = -1,
    public customForce?:
      | keyof typeof ForceFieldForces
      | ((system: ParticleSystem, forceField: ForceField, dt: number) => void),
    public customForceParams?: Record<string, any>,
    public id?: string
  ) {}

  public get disposed(): boolean {
    return this._disposed;
  }

  public applyForce(particle: Particle, system: ParticleSystem, dt: number) {
    // If a custom force function is provided, use it instead of the default
    if (this.customForce) {
      if (typeof this.customForce === 'string') {
        ForceFieldForces[this.customForce].bind(particle)(system, this, dt);
      } else if (typeof this.customForce === 'function') {
        this.customForce.bind(particle)(system, this, dt);
      }
    } else {
      // Default behavior: apply the force vector
      particle.velocity = vec2.add(
        particle.velocity,
        vec2.scale(this.force, dt)
      );
    }
  }

  public update(dt: number) {
    this.age += dt;

    // Dispose the force field when its lifespan is reached
    if (this.lifespan !== -1 && this.age >= this.lifespan) {
      this._disposed = true;
    }
  }
}

// -----------------------------------------------------------------------------
// Sinks
// -----------------------------------------------------------------------------

export class Sink {
  public age: number = 0;
  private _disposed: boolean = false;

  public constructor(
    public position: vec2,
    public range: number = 50,
    public strength: number = 1,
    public falloff: number = 1,
    public mode: 'instant' | 'fade' = 'fade',
    public lifespan: number = -1,
    public id?: string
  ) {}

  public get disposed(): boolean {
    return this._disposed;
  }

  public affect(particle: Particle, dt: number) {
    // Calculate distance to the particle
    const d = distance(this.position, particle.position);
    if (d > this.range) {
      return; // Particle is out of range
    }

    // Instant mode: immediately set particle age to its lifespan
    if (this.mode === 'instant') {
      particle.age = particle.lifespan;
      return;
    }

    // Fade mode: accelerate particle aging based on strength and falloff
    // Prevent divide-by-zero with a small minimum distance
    const minDistance = 1;
    const safeDistance = Math.max(d, minDistance);

    // Use configurable falloff to create distance-based effect gradient
    // Higher falloff values create steeper gradients (stronger at center)
    // Lower falloff values create gentler gradients (more uniform effect)
    const distanceFactor = 1 / Math.pow(safeDistance, this.falloff);

    // Apply smooth range falloff at the boundary
    const rangeFactor = d / this.range;
    const rangeFalloff = Math.max(0, 1 - rangeFactor * rangeFactor);

    // Calculate final aging multiplier
    const agingMultiplier = this.strength * distanceFactor * rangeFalloff;

    // Accelerate particle aging
    particle.age += agingMultiplier * dt;
  }

  public update(dt: number) {
    this.age += dt;

    // Dispose the sink when its lifespan is reached
    if (this.lifespan !== -1 && this.age >= this.lifespan) {
      this._disposed = true;
    }
  }
}

// -----------------------------------------------------------------------------
// Colliders
// -----------------------------------------------------------------------------

export type ColliderGeometry =
  | {
      type: 'circle';
      position: vec2;
      radius: number;
    }
  | {
      type: 'rectangle';
      position: vec2;
      size: vec2;
      rotation?: number;
    }
  | {
      type: 'polygon';
      vertices: vec2[];
    };

export class Collider {
  public constructor(
    public geometry: ColliderGeometry,
    public restitution: number = 0.5,
    public friction: number = 0.5,
    public randomness: number = 0,
    public id?: string
  ) {}

  public handleCollision(particle: Particle) {
    // Broad phase: first check if the point is in the collider's AABB
    const geometryAABB = aabb(this.geometry);
    if (geometryAABB === null) {
      return; // Invalid polygon
    }
    if (!pointInAABB(particle.position, geometryAABB)) {
      return; // Particle is outside the collider's AABB
    }

    // Narrow phase: check if the particle collides with the collider geometry
    let collisionResult: {
      intersects: boolean;
      closestPoint: vec2;
      distance: number;
      normal?: vec2;
    } | null;
    switch (this.geometry.type) {
      case 'circle':
        collisionResult = pointInCircle(particle.position, {
          position: this.geometry.position,
          radius: this.geometry.radius,
        });
        break;

      case 'rectangle':
        collisionResult = pointInRectangle(particle.position, {
          position: this.geometry.position,
          size: this.geometry.size,
          rotation: this.geometry.rotation ?? 0,
        });
        break;

      case 'polygon':
        collisionResult = pointInPolygon(particle.position, {
          vertices: this.geometry.vertices,
        });
        break;
    }
    if (collisionResult === null || !collisionResult.intersects) {
      return; // Invalid polygon or no intersection
    }

    // Handle the collision
    // The collider has a friction value which is used to reduce the particle's
    // velocity after the collision
    // The collider has a restitution value which is used to bounce the particle
    // off the collider surface
    const normal = collisionResult.normal ?? vec2(0, 0);
    const relativeVelocity = vec2.sub(particle.velocity, vec2(0, 0));
    const velocityAlongNormal = vec2.dot(relativeVelocity, normal);
    if (velocityAlongNormal > 0) {
      return; // Particle is moving away from the collider, no collision
    }

    // Calculate the impulse to apply to the particle
    const impulseMagnitude = -(1 + this.restitution) * velocityAlongNormal;
    const impulse = vec2.scale(normal, impulseMagnitude);

    // Apply the impulse to the particle's velocity
    particle.velocity = vec2.add(particle.velocity, impulse);

    // Apply randomness to the particle's velocity
    if (this.randomness > 0) {
      // Get a random angle between -PI and PI, scaled by randomness
      const randomAngle = randomBetween(
        -Math.PI * this.randomness,
        Math.PI * this.randomness
      );
      particle.velocity = vec2.rot(particle.velocity, randomAngle);
    }

    // Apply friction to the particle's velocity
    const frictionImpulse = vec2.scale(
      vec2.sub(relativeVelocity, vec2.scale(normal, velocityAlongNormal)),
      -this.friction
    );
    particle.velocity = vec2.add(particle.velocity, frictionImpulse);
  }
}

// -----------------------------------------------------------------------------
// Built-in force-field custom force functions
// -----------------------------------------------------------------------------

export const ForceFieldForces: Record<
  string,
  (
    this: Particle,
    system: ParticleSystem,
    forceField: ForceField,
    dt: number
  ) => void
> = {
  /**
   * Built-in force-field function that creates a wave effect, causing particles
   * to oscillate back and forth perpendicular to the force-field's force
   * direction.
   *
   * The frequency and amplitude of the wave can be configured via the force
   * field's customForceParams:
   *
   * - frequency: controls how many oscillations occur per second (default: 1)
   * - amplitude: controls how far particles are pushed from side to side (default: 50)
   */
  wave: function (this: Particle, _system, forceField, dt) {
    const frequency = forceField.customForceParams?.frequency ?? 1;
    const amplitude = forceField.customForceParams?.amplitude ?? 50;

    // Calculate perpendicular direction to the force field's force vector
    const forceDirection = vec2.nor(forceField.force);
    const perpendicularDirection = vec2.rotf(forceDirection, 1);

    // Calculate wave offset based on time and frequency
    const time = forceField.age;
    const waveOffset = Math.sin(time * frequency * 2 * Math.PI) * amplitude;

    // Apply the wave force to the particle's velocity
    this.velocity = vec2.add(
      this.velocity,
      vec2.scale(perpendicularDirection, waveOffset * dt)
    );
  },

  /**
   * Built-in force-field function that creates a vortex effect, causing
   * particles to spiral around a center point.
   *
   * The center point, strength and range of the vortex can be configured via
   * the force field's customForceParams:
   *
   * - center: the center point of the vortex (ignore this force if undefined)
   * - strength: controls how strongly particles are pulled into the vortex
   * - range: controls how far from the center the vortex effect is applied
   * - clockwise: if true, particles will spiral clockwise
   */
  vortex: function (this: Particle, _system, forceField, dt) {
    const center = forceField.customForceParams?.center;
    if (!center || !isVec2(center)) {
      return; // No center defined, or center is not a vec2
    }

    const strength = forceField.customForceParams?.strength ?? 1;
    const range = forceField.customForceParams?.range ?? 100;

    // Calculate distance to the particle
    const d = distance(center, this.position);
    if (d > range) {
      return; // Particle is out of range
    }

    // Calculate direction vector from particle to force field center
    const direction = vec2.sub(this.position, center);
    const normalizedDirection = vec2.nor(direction);

    // Calculate perpendicular direction for vortex effect
    const perpendicularDirection = forceField.customForceParams?.clockwise
      ? vec2.rotf(normalizedDirection, 1)
      : vec2.rotf(normalizedDirection, -1);

    // Use inverse distance falloff for stronger effect closer to the center
    const distanceFactor = 1 / Math.max(d, 1); // Prevent divide-by-zero

    // Calculate final force vector
    const finalForceStrength = strength * distanceFactor;
    const forceVector = vec2.scale(perpendicularDirection, finalForceStrength);

    // Apply the force to the particle's velocity
    this.velocity = vec2.add(this.velocity, vec2.scale(forceVector, dt));
  },

  /**
   * Built-in force-field function that creates an orbital effect, causing
   * particles to orbit around a center point in a more circular path.
   *
   * The center point, strength and range of the orbital effect can be
   * configured via the force field's customForceParams:
   *
   * - center: the center point of the orbital effect (ignore this force if
   *   undefined)
   * - strength: controls how strongly particles are pulled into orbit
   * - range: controls how far from the center the orbital effect is applied
   */
  orbital: function (this: Particle, _system, forceField, dt) {
    const center = forceField.customForceParams?.center;
    if (!center || !isVec2(center)) {
      return; // No center defined, or center is not a vec2
    }

    const strength = forceField.customForceParams?.strength ?? 1;
    const range = forceField.customForceParams?.range ?? 100;

    // Calculate distance to the particle
    const d = distance(center, this.position);
    if (d > range) {
      return; // Particle is out of range
    }

    // Calculate direction vector from particle to force field center
    const direction = vec2.sub(center, this.position);
    const normalizedDirection = vec2.nor(direction);

    // Use inverse distance falloff for stronger effect closer to the center
    const distanceFactor = 1 / Math.max(d, 1); // Prevent divide-by-zero

    // Calculate final force vector
    const finalForceStrength = strength * distanceFactor;
    const forceVector = vec2.scale(normalizedDirection, finalForceStrength);

    // Apply the force to the particle's velocity
    this.velocity = vec2.add(this.velocity, vec2.scale(forceVector, dt));
  },

  /**
   * Built-in force-field function that creates a vector field effect using
   * noise to create complex, flowing motion patterns.
   *
   * The vector field parameters can be configured via the force field's
   * customForceParams:
   *
   * - noise: a noise function with signature:
   *   `(x: number, y: number, z: number) => number`
   *   (returns value in range [-1, 1])
   * - noiseScale: controls the size of noise features (default: 0.01)
   *   - smaller values = larger, smoother features
   *   - larger values = smaller, more chaotic features
   * - timeScale: controls how quickly the field changes over time (default: 0.1)
   *   - represents the speed of movement through the z-dimension of noise
   * - forceAmount: controls how strongly particles are affected (default: 100)
   */
  vectorField: function (this: Particle, system, forceField, dt) {
    const noise = forceField.customForceParams?.noise;
    if (!noise || typeof noise !== 'function') {
      return; // No noise function defined
    }

    const noiseScale = forceField.customForceParams?.noiseScale ?? 0.01;
    const timeScale = forceField.customForceParams?.timeScale ?? 0.1;
    const forceAmount = forceField.customForceParams?.forceAmount ?? 100;

    // Sample noise at particle position for x and y components of the force
    // Use the force field's age to animate the field over time
    const time = forceField.age * timeScale;

    // Sample noise twice with slight offset to get independent x and y values
    const noiseX = noise(
      this.position.x * noiseScale,
      this.position.y * noiseScale,
      time
    );
    const noiseY = noise(
      this.position.x * noiseScale + 1000, // Offset to decorrelate x and y
      this.position.y * noiseScale + 1000,
      time
    );

    // Convert noise values (in range [-1, 1]) to force vector
    const forceVector = vec2(noiseX * forceAmount, noiseY * forceAmount);

    // Apply the force to the particle's velocity
    this.velocity = vec2.add(this.velocity, vec2.scale(forceVector, dt));
  },

  /**
   * Built-in force-field function that creates a turbulence effect using
   * random forces to create chaotic, jittery motion.
   *
   * The turbulence parameters can be configured via the force field's
   * customForceParams:
   *
   * - strength: controls how strongly particles are affected (default: 100)
   * - frequency: controls how often the random force changes (default: 10)
   *   - higher values = more rapid changes in direction
   *   - lower values = slower, more flowing changes
   */
  turbulence: function (this: Particle, _system, forceField, dt) {
    const strength = forceField.customForceParams?.strength ?? 100;
    const frequency = forceField.customForceParams?.frequency ?? 10;

    // Use time and frequency to create variation
    const time = forceField.age * frequency;

    // Create pseudo-random but smooth values based on time and particle position
    // This ensures turbulence is consistent for a given particle at a given time
    const seed = this.position.x * 12.9898 + this.position.y * 78.233 + time;
    const randomX = Math.abs(Math.sin(seed) * 43758.5453) % 1;
    const randomY = Math.abs(Math.sin(seed + 1) * 43758.5453) % 1;

    // Convert to range [-1, 1]
    const forceX = (randomX * 2 - 1) * strength;
    const forceY = (randomY * 2 - 1) * strength;

    const forceVector = vec2(forceX, forceY);

    // Apply the force to the particle's velocity
    this.velocity = vec2.add(this.velocity, vec2.scale(forceVector, dt));
  },

  /**
   * Built-in force-field function that creates a drag effect, simulating
   * air resistance or friction that slows particles over time.
   *
   * The drag parameters can be configured via the force field's
   * customForceParams:
   *
   * - coefficient: controls how much drag is applied (default: 0.5)
   *   - 0 = no drag
   *   - 1 = maximum drag (particles slow to a stop quickly)
   *   - higher values = even stronger drag
   */
  drag: function (this: Particle, _system, forceField, dt) {
    const coefficient = forceField.customForceParams?.coefficient ?? 0.5;

    // Apply drag force proportional to velocity (opposite direction)
    // F_drag = -coefficient * velocity
    const dragForce = vec2.scale(this.velocity, -coefficient);

    // Apply the force to the particle's velocity
    this.velocity = vec2.add(this.velocity, vec2.scale(dragForce, dt));
  },

  /**
   * Built-in force-field function that implements boids flocking behavior,
   * causing particles to exhibit emergent group dynamics.
   *
   * Implements three classic boids rules:
   * - Separation: avoid crowding neighbors
   * - Alignment: steer towards average heading of neighbors
   * - Cohesion: steer towards average position of neighbors
   *
   * The boids parameters can be configured via the force field's
   * customForceParams:
   *
   * - separationDistance: how close is too close (default: 25)
   * - alignmentDistance: range for alignment behavior (default: 50)
   * - cohesionDistance: range for cohesion behavior (default: 50)
   * - separationWeight: strength of separation force (default: 1.5)
   * - alignmentWeight: strength of alignment force (default: 1.0)
   * - cohesionWeight: strength of cohesion force (default: 1.0)
   *
   * WARNING: This force function checks each particle against all others in
   * the system, resulting in O(n²) complexity. Only use with relatively small
   * particle counts (recommended: < 200 particles). For larger systems,
   * consider implementing custom boids behavior with spatial optimization.
   */
  boids: function (this: Particle, system, forceField, dt) {
    const separationDistance =
      forceField.customForceParams?.separationDistance ?? 25;
    const alignmentDistance =
      forceField.customForceParams?.alignmentDistance ?? 50;
    const cohesionDistance =
      forceField.customForceParams?.cohesionDistance ?? 50;
    const separationWeight =
      forceField.customForceParams?.separationWeight ?? 1.5;
    const alignmentWeight =
      forceField.customForceParams?.alignmentWeight ?? 1.0;
    const cohesionWeight = forceField.customForceParams?.cohesionWeight ?? 1.0;

    let separationForce = vec2(0, 0);
    let alignmentForce = vec2(0, 0);
    let cohesionForce = vec2(0, 0);

    let separationCount = 0;
    let alignmentCount = 0;
    let cohesionCount = 0;

    // Check all other particles
    for (const other of system.particles) {
      if (other === this || other.disposed) {
        continue;
      }

      const d = distance(this.position, other.position);

      // Separation: avoid crowding neighbors
      if (d < separationDistance && d > 0) {
        const diff = vec2.sub(this.position, other.position);
        const normalized = vec2.nor(diff);
        // Weight by distance (closer = stronger force)
        const weighted = vec2.scale(normalized, 1 / d);
        separationForce = vec2.add(separationForce, weighted);
        separationCount++;
      }

      // Alignment: steer towards average heading of neighbors
      if (d < alignmentDistance) {
        alignmentForce = vec2.add(alignmentForce, other.velocity);
        alignmentCount++;
      }

      // Cohesion: steer towards average position of neighbors
      if (d < cohesionDistance) {
        cohesionForce = vec2.add(cohesionForce, other.position);
        cohesionCount++;
      }
    }

    // Calculate average forces
    if (separationCount > 0) {
      separationForce = vec2.scale(vec2.nor(separationForce), separationWeight);
    }

    if (alignmentCount > 0) {
      alignmentForce = vec2.scale(alignmentForce, 1 / alignmentCount);
      // Steer towards average velocity
      alignmentForce = vec2.sub(alignmentForce, this.velocity);
      alignmentForce = vec2.scale(vec2.nor(alignmentForce), alignmentWeight);
    }

    if (cohesionCount > 0) {
      cohesionForce = vec2.scale(cohesionForce, 1 / cohesionCount);
      // Steer towards average position
      cohesionForce = vec2.sub(cohesionForce, this.position);
      cohesionForce = vec2.scale(vec2.nor(cohesionForce), cohesionWeight);
    }

    // Combine all forces
    let totalForce = vec2.add(separationForce, alignmentForce);
    totalForce = vec2.add(totalForce, cohesionForce);

    // Apply the force to the particle's velocity
    this.velocity = vec2.add(this.velocity, vec2.scale(totalForce, dt));
  },
};
