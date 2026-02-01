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
   * Should this particle be affected by attractors
   */
  useAttractors: boolean;

  /**
   * Should this particle be affected by force fields
   */
  useForceFields: boolean;

  /**
   * Should this particle be affected by colliders
   */
  useColliders: boolean;

  /**
   * Should this particle be affected by sinks
   */
  useSinks: boolean;

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
  segmentFade?: FadeStyle;
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
  private trailPositions: vec2[] = [];

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

    // Initialize trail positions with current position if trail is enabled
    if (this.style?.trail) {
      this.trailPositions.push(vec2(position));
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
      if (this.options.useAttractors) {
        system.attractors.forEach(attractor => {
          if (!attractor.disposed) {
            attractor.applyForce(this, dt);
          }
        });
      }

      if (this.options.useForceFields) {
        system.forceFields.forEach(forceField => {
          if (!forceField.disposed) {
            forceField.applyForce(this, dt);
          }
        });
      }

      if (this.options.useSinks) {
        system.sinks.forEach(sink => {
          if (!sink.disposed) {
            sink.affect(this, dt);
          }
        });
      }

      if (this.options.useColliders) {
        system.colliders.forEach(collider => {
          collider.handleCollision(this);
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

    // Update trail positions if trail is enabled
    if (this.style?.trail && defaultUpdates.includes('position')) {
      // Only add new position if we've moved far enough from the last position
      const lastPosition = this.trailPositions[this.trailPositions.length - 1];
      if (
        !lastPosition ||
        distance(lastPosition, this.position) >=
          Particle.MINIMUM_TRAIL_MOVEMENT_THRESHOLD
      ) {
        this.trailPositions.push(vec2(this.position));

        // Keep only the most recent positions based on trail length
        while (this.trailPositions.length > this.style.trail.length) {
          this.trailPositions.shift();
        }
      }
    }
  }

  private drawTrail(
    context: CanvasRenderingContext2D,
    particleAlpha: number = 1
  ) {
    if (!this.style?.trail || this.trailPositions.length < 2) {
      return;
    }

    const trail = this.style.trail;
    const segments = this.trailPositions.length - 1;

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

    // Draw trail segments
    const widthDecay = Math.min(1, trail.widthDecay ?? 1);
    for (let i = 0; i < segments; i++) {
      const start = this.trailPositions[i];
      const end = this.trailPositions[i + 1];

      // Calculate width based on decay
      const progress = 1 - i / (segments - 1);
      const decayFactor = 1 - progress * widthDecay;
      const width = baseWidth * decayFactor;

      // Calculate segment alpha based on fade settings
      let alpha = 1;
      if (trail.segmentFade) {
        const fadeIn = trail.segmentFade.in
          ? Math.min(1, 1 - i / trail.segmentFade.in)
          : 1;
        const fadeOut = trail.segmentFade.out
          ? Math.min(1, 1 - (segments - i) / trail.segmentFade.out)
          : 1;
        alpha = Math.min(fadeIn, fadeOut);
      }

      // Draw segment
      context.beginPath();
      context.strokeStyle = trailColor;
      context.lineWidth = width;
      context.globalAlpha = alpha * particleAlpha;
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
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
    public lifespan: number = -1
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
    public lifespan: number = -1
  ) {}

  public get disposed(): boolean {
    return this._disposed;
  }

  public applyForce(particle: Particle, dt: number) {
    particle.velocity = vec2.add(particle.velocity, vec2.scale(this.force, dt));
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
    public lifespan: number = -1
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
    public randomness: number = 0
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
