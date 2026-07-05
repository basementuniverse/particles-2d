# API Reference

Complete API documentation for `@basementuniverse/particles-2d`.

## Core Classes

### ParticleSystem

Main container managing all particles and related components.

```typescript
class ParticleSystem {
  particles: Particle[]
  emitters: Emitter[]
  attractors: Attractor[]
  forceFields: ForceField[]
  colliders: Collider[]
  sinks: Sink[]

  get disposed(): boolean  // True when all particles and emitters are finished

  update(dt: number): void
  draw(context: CanvasRenderingContext2D): void
}
```

### Particle

Individual particle with properties and behavior.

```typescript
class Particle {
  constructor(
    position: vec2,
    velocity: vec2,
    size: vec2,
    rotation: number | null,  // null = calculate from velocity
    lifespan: number,         // seconds
    style?: Partial<ParticleStyle> | null,
    options?: Partial<ParticleOptions>
  )

  // Properties
  position: vec2
  velocity: vec2
  size: vec2
  rotation: number | null
  lifespan: number
  age: number                      // Read-only
  disposed: boolean                // Read-only
  normalisedLifeRemaining: number  // Read-only (0-1)

  update(system: ParticleSystem, dt: number): void
  draw(system: ParticleSystem, context: CanvasRenderingContext2D): void
}
```

**ParticleOptions**:
```typescript
{
  // Selective targeting (false = none, true = all, string = specific id, string[] = multiple ids)
  useAttractors: boolean | string | string[]
  useForceFields: boolean | string | string[]
  useColliders: boolean | string | string[]
  useSinks: boolean | string | string[]

  maxSpeed: number  // -1 for unlimited

  // Control default behaviors
  defaultUpdates: 'none' | 'all' | Array<'age' | 'physics' | 'direction' | 'position'>
  defaultDraws: 'none' | 'all' | Array<'transforms' | 'fade' | 'styles'>

  // Custom hooks
  update?: (system: ParticleSystem, dt: number) => void  // bound to particle
  preDraw?: (system: ParticleSystem, context: CanvasRenderingContext2D) => void
  postDraw?: (system: ParticleSystem, context: CanvasRenderingContext2D) => void
}
```

**Default updates**:
- `'age'`: Ages particle and disposes when lifespan reached
- `'physics'`: Applies forces from attractors, force fields, colliders, sinks
- `'direction'`: Calculates rotation from velocity if rotation is null
- `'position'`: Integrates velocity into position

**Default draws**:
- `'transforms'`: Applies translation and rotation transforms
- `'fade'`: Applies fade in/out effects
- `'styles'`: Renders using built-in styles

### Emitter

Generates particles with configurable properties.

```typescript
class Emitter {
  constructor(
    position: vec2,
    size: vec2,           // Particle spawn area size
    lifespan: number,     // -1 for infinite
    options?: Partial<EmitterOptions>
  )

  // Properties
  position: vec2
  size: vec2
  lifespan: number
  age: number                    // Read-only
  totalParticlesEmitted: number  // Read-only
  disposed: boolean              // Read-only

  update(system: ParticleSystem, dt: number): void
}
```

**EmitterOptions**:
```typescript
{
  particles: {
    position: 'uniform' | 'normal' | ((n: number) => vec2)
    speed: number | RandomRange | ((n: number) => number)
    direction: number | RandomRange | ((n: number) => number)  // radians
    size: vec2 | RandomRange<vec2> | ((n: number) => vec2)
    rotation: number | RandomRange | ((n: number) => number) | null
    lifespan: number | RandomRange | ((n: number) => number)  // seconds
    style?: Partial<ParticleStyle> | null
    options?: Partial<ParticleOptions>
  },

  emission: (
    | { type: 'rate', rate: number | RandomRange }              // per second
    | { type: 'burst', n: number | RandomRange, delay?: number } // one-time
    | { type: 'custom', f: () => number }                        // custom function
  )
}
```

### Attractor

Attracts or repels particles within range.

```typescript
class Attractor {
  constructor(
    position: vec2,
    range: number,      // Effective radius
    force: number,      // Negative = repel, positive = attract
    falloff: number,    // Distance falloff exponent (1 = linear, 2 = inverse square)
    lifespan: number,   // -1 for infinite
    id?: string         // Optional identifier for selective targeting
  )

  // Properties
  position: vec2
  range: number
  force: number
  falloff: number
  lifespan: number
  age: number          // Read-only
  disposed: boolean    // Read-only
  id?: string

  applyForce(particle: Particle, dt: number): void
  update(dt: number): void
}
```

### ForceField

Applies constant or custom forces to particles.

```typescript
class ForceField {
  constructor(
    force: vec2,                    // Constant force vector (ignored for custom forces)
    lifespan: number,               // -1 for infinite
    customForce?: string | ((system: ParticleSystem, forceField: ForceField, dt: number) => void),
    customForceParams?: Record<string, any>,
    id?: string
  )

  // Properties
  force: vec2
  lifespan: number
  age: number          // Read-only
  disposed: boolean    // Read-only
  customForce?: string | Function
  customForceParams?: Record<string, any>
  id?: string

  applyForce(particle: Particle, system: ParticleSystem, dt: number): void
  update(dt: number): void
}
```

**Built-in custom forces** (see [Built-in Forces](built-in-forces.md) for details):
- `'wave'`: Oscillating perpendicular motion
- `'vortex'`: Spiral motion around a center
- `'orbital'`: Circular orbit around a center
- `'vectorField'`: Noise-based flowing motion
- `'turbulence'`: Random chaotic motion
- `'drag'`: Air resistance/friction
- `'boids'`: Flocking behavior (O(n²), use < 200 particles)

### Collider

Handles particle collisions with geometry.

```typescript
class Collider {
  constructor(
    geometry: ColliderGeometry,
    restitution: number,  // 0-1, bounciness
    friction: number,     // 0-1
    randomness: number,   // 0-1, direction offset on collision
    id?: string
  )

  geometry: ColliderGeometry
  restitution: number
  friction: number
  randomness: number
  id?: string

  handleCollision(particle: Particle): void
}
```

**ColliderGeometry**:
```typescript
type ColliderGeometry = (
  | { type: 'circle', position: vec2, radius: number }
  | { type: 'rectangle', position: vec2, size: vec2, rotation?: number }
  | { type: 'polygon', vertices: vec2[] }
)
```

### Sink

Destroys or fades particles within range.

```typescript
class Sink {
  constructor(
    position: vec2,
    range: number,         // Effective radius
    strength: number,      // Aging acceleration multiplier
    falloff: number,       // Distance-based gradient exponent
    mode: 'instant' | 'fade',  // Instant disposal or gradual fade
    lifespan: number,      // -1 for infinite
    id?: string
  )

  // Properties
  position: vec2
  range: number
  strength: number
  falloff: number
  mode: 'instant' | 'fade'
  lifespan: number
  age: number          // Read-only
  disposed: boolean    // Read-only
  id?: string

  affect(particle: Particle, dt: number): void
  update(dt: number): void
}
```

## Utility Functions

### RandomRange Helper
Used throughout the API for specifying random value ranges:

```typescript
type RandomRange<T = number> = { min: T, max: T }

// Examples:
speed: { min: 50, max: 100 }
size: { min: { x: 2, y: 2 }, max: { x: 10, y: 10 } }
```

## Method Signatures

### ParticleSystem Methods

**update(dt: number)**: Updates all particles, emitters, attractors, force fields, colliders, and sinks. Automatically removes disposed entities.

**draw(context: CanvasRenderingContext2D)**: Renders all active particles.

### Emitter Emission Types

**Rate**: Continuous emission
```typescript
emission: { type: 'rate', rate: 10 }  // 10 particles per second
emission: { type: 'rate', rate: { min: 5, max: 15 } }  // Random rate
```

**Burst**: One-time emission
```typescript
emission: { type: 'burst', n: 50 }  // 50 particles immediately
emission: { type: 'burst', n: 30, delay: 0.5 }  // After 0.5 seconds
```

**Custom**: Function-based
```typescript
emission: {
  type: 'custom',
  f: function() {
    // Return number of particles to emit this frame
    return Math.random() < 0.1 ? 5 : 0;
  }
}
```
