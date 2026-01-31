import { vec2 } from '@basementuniverse/vec';
export type RandomRange<T extends number | vec2 = number> = {
    min: T;
    max: T;
};
export type Color = {
    r: number;
    g: number;
    b: number;
    a?: number;
};
export declare class ParticleSystem {
    particles: Particle[];
    emitters: Emitter[];
    attractors: Attractor[];
    forceFields: ForceField[];
    colliders: Collider[];
    sinks: Sink[];
    update(dt: number): void;
    draw(context: CanvasRenderingContext2D): void;
}
declare const PARTICLE_DEFAULT_UPDATE_TYPES: string[];
type ParticleDefaultUpdateTypes = (typeof PARTICLE_DEFAULT_UPDATE_TYPES)[number][];
declare const PARTICLE_DEFAULT_DRAW_TYPES: string[];
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
    postDraw?: (system: ParticleSystem, context: CanvasRenderingContext2D) => void;
};
type GlowStyle = {
    color: Color | string | Color[] | string[];
    amount: number;
};
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
export type ParticleStyle = ({
    style: 'dot';
    color: Color | string | Color[] | string[];
    glow?: GlowStyle;
} | {
    style: 'radial';
    color: Color | string | Color[] | string[];
} | {
    style: 'line';
    color: Color | string | Color[] | string[];
    rotationOffset?: number;
    glow?: GlowStyle;
} | {
    style: 'image';
    image: HTMLImageElement;
    rotationOffset?: number;
}) & {
    fade?: FadeStyle;
    trail?: TrailStyle;
};
export declare class Particle {
    /**
     * Initial position of the particle
     */
    position: vec2;
    /**
     * Initial velocity of the particle
     */
    velocity: vec2;
    /**
     * Size of the particle. This is used differently based on the style:
     *
     * - 'dot' style: we use the maximum of x and y as the radius
     * - 'line' style: x is the length of the line, y is the line width
     * - 'radial' style: we use the maximum of x and y as the radius
     * - 'image' style: x and y are the width and height of the image
     */
    size: vec2;
    /**
     * Rotation of the particle in radians
     *
     * _(Note: not used for 'dot' and 'radial' styles)_
     *
     * If this is null, we calculate rotation based on velocity
     */
    rotation: number | null;
    /**
     * Lifespan of the particle in seconds
     */
    lifespan: number;
    private static readonly MINIMUM_TRAIL_MOVEMENT_THRESHOLD;
    age: number;
    style: ParticleStyle | null;
    private actualRotation;
    private actualColor;
    private actualColorTransparent;
    private actualGlowColor;
    private options;
    private _disposed;
    private trailPositions;
    constructor(
    /**
     * Initial position of the particle
     */
    position: vec2, 
    /**
     * Initial velocity of the particle
     */
    velocity: vec2, 
    /**
     * Size of the particle. This is used differently based on the style:
     *
     * - 'dot' style: we use the maximum of x and y as the radius
     * - 'line' style: x is the length of the line, y is the line width
     * - 'radial' style: we use the maximum of x and y as the radius
     * - 'image' style: x and y are the width and height of the image
     */
    size: vec2, 
    /**
     * Rotation of the particle in radians
     *
     * _(Note: not used for 'dot' and 'radial' styles)_
     *
     * If this is null, we calculate rotation based on velocity
     */
    rotation?: number | null, 
    /**
     * Lifespan of the particle in seconds
     */
    lifespan?: number, 
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
    options?: Partial<ParticleOptions>);
    get disposed(): boolean;
    get normalisedLifeRemaining(): number;
    update(system: ParticleSystem, dt: number): void;
    private drawTrail;
    draw(system: ParticleSystem, context: CanvasRenderingContext2D): void;
}
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
    emission: {
        type: 'rate';
        rate: number | RandomRange;
    } | {
        type: 'burst';
        n: number | RandomRange;
        delay?: number;
    } | {
        type: 'custom';
        f: () => number;
    };
};
export declare class Emitter {
    position: vec2;
    size: vec2;
    lifespan: number;
    private static readonly RANDOM_RATE_CHANGE_INTERVAL;
    age: number;
    totalParticlesEmitted: number;
    private options;
    private _disposed;
    private currentRate;
    private lastRateChange;
    private particlesToEmit;
    constructor(position: vec2, size?: vec2, lifespan?: number, options?: Partial<EmitterOptions>);
    get disposed(): boolean;
    update(system: ParticleSystem, dt: number): void;
    private emitParticles;
    private createParticle;
}
export declare class Attractor {
    position: vec2;
    range: number;
    force: number;
    falloff: number;
    lifespan: number;
    age: number;
    private _disposed;
    constructor(position: vec2, range?: number, force?: number, falloff?: number, lifespan?: number);
    get disposed(): boolean;
    applyForce(particle: Particle, dt: number): void;
    update(dt: number): void;
}
export declare class ForceField {
    force: vec2;
    lifespan: number;
    age: number;
    private _disposed;
    constructor(force?: vec2, lifespan?: number);
    get disposed(): boolean;
    applyForce(particle: Particle, dt: number): void;
    update(dt: number): void;
}
export declare class Sink {
    position: vec2;
    range: number;
    strength: number;
    falloff: number;
    mode: 'instant' | 'fade';
    lifespan: number;
    age: number;
    private _disposed;
    constructor(position: vec2, range?: number, strength?: number, falloff?: number, mode?: 'instant' | 'fade', lifespan?: number);
    get disposed(): boolean;
    affect(particle: Particle, dt: number): void;
    update(dt: number): void;
}
export type ColliderGeometry = {
    type: 'circle';
    position: vec2;
    radius: number;
} | {
    type: 'rectangle';
    position: vec2;
    size: vec2;
    rotation?: number;
} | {
    type: 'polygon';
    vertices: vec2[];
};
export declare class Collider {
    geometry: ColliderGeometry;
    restitution: number;
    friction: number;
    randomness: number;
    constructor(geometry: ColliderGeometry, restitution?: number, friction?: number, randomness?: number);
    handleCollision(particle: Particle): void;
}
export {};
