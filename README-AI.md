# Particle System 2D - AI Reference

## Core Classes

### ParticleSystem
Main container managing particles, emitters, attractors, forcefields, and colliders.
```typescript
class ParticleSystem {
  particles: Particle[]
  emitters: Emitter[]
  attractors: Attractor[]
  forceFields: ForceField[]
  colliders: Collider[]
  sinks: Sink[]

  update(dt: number): void
  draw(context: CanvasRenderingContext2D): void
}
```

### Particle
Individual particle with position, velocity, size, rotation, lifespan.
```typescript
class Particle {
  constructor(
    position: vec2,
    velocity: vec2,
    size: vec2,
    rotation: number | null,
    lifespan: number,
    style?: Partial<ParticleStyle> | null,
    options?: Partial<ParticleOptions>
  )

  age: number
  disposed: boolean
  normalisedLifeRemaining: number
  update(system: ParticleSystem, dt: number): void
  draw(system: ParticleSystem, context: CanvasRenderingContext2D): void
}
```

### Emitter
Generates particles at specified rate/burst with configurable properties.
```typescript
class Emitter {
  constructor(
    position: vec2,
    size: vec2,
    lifespan: number,  // -1 for infinite
    options?: Partial<EmitterOptions>
  )

  age: number
  totalParticlesEmitted: number
  disposed: boolean
  update(system: ParticleSystem, dt: number): void
}
```

### Attractor
Attracts or repels particles within range with falloff.
```typescript
class Attractor {
  constructor(
    position: vec2,
    range: number,
    force: number,  // negative = repel, positive = attract
    falloff: number,
    lifespan: number  // -1 for infinite
  )

  age: number
  disposed: boolean
  applyForce(particle: Particle, dt: number): void
  update(dt: number): void
}
```

### ForceField
Applies constant force vector to all particles.
```typescript
class ForceField {
  constructor(
    force: vec2,
    lifespan: number  // -1 for infinite
  )

  age: number
  disposed: boolean
  applyForce(particle: Particle, dt: number): void
  update(dt: number): void
}
```

### Collider
Handles particle collisions with various geometries.
```typescript
class Collider {
  constructor(
    geometry: ColliderGeometry,
    restitution: number,  // 0-1, bounciness
    friction: number,     // 0-1
    randomness: number    // 0-1, direction offset on collision
  )

  handleCollision(particle: Particle): void
}
```

### Sink
Destroys or fades out particles within range using age acceleration.
```typescript
class Sink {
  constructor(
    position: vec2,
    range: number,
    strength: number,  // aging acceleration multiplier
    falloff: number,   // distance-based gradient
    mode: 'instant' | 'fade',  // instant disposal or gradual fade
    lifespan: number  // -1 for infinite
  )

  age: number
  disposed: boolean
  affect(particle: Particle, dt: number): void
  update(dt: number): void
}
```

## Type Definitions

### vec2
```typescript
type vec2 = { x: number, y: number }
```

### Color
```typescript
type Color = { r: number, g: number, b: number, a?: number }
```

### RandomRange
```typescript
type RandomRange<T extends number | vec2 = number> = { min: T, max: T }
```

### ParticleStyle
```typescript
type ParticleStyle = (
  | {
      style: 'dot'
      color: Color | string | Array<Color | string>
      glow?: { color: Color | string | Array<Color | string>, amount: number }
    }
  | {
      style: 'radial'
      color: Color | string | Array<Color | string>
    }
  | {
      style: 'line'
      color: Color | string | Array<Color | string>
      rotationOffset?: number
      glow?: { color: Color | string | Array<Color | string>, amount: number }
    }
  | {
      style: 'image'
      image: HTMLImageElement
      rotationOffset?: number
    }
) & {
  fade?: { in: number, out: number }  // seconds
  trail?: {
    length: number
    color?: Color | string | Array<Color | string>
    width?: number
    widthDecay?: number  // 0=no decay, 1=full decay, negative=grow
    segmentFade?: { in: number, out: number }  // number of segments
  }
}
```

### ParticleOptions
```typescript
type ParticleOptions = {
  useAttractors: boolean
  useForceFields: boolean
  useColliders: boolean
  useSinks: boolean
  defaultUpdates: 'none' | 'all' | Array<'age' | 'physics' | 'direction' | 'position'>
  update?: (system: ParticleSystem, dt: number) => void
  defaultDraws: 'none' | 'all' | Array<'transforms' | 'fade' | 'styles'>
  preDraw?: (system: ParticleSystem, context: CanvasRenderingContext2D) => void
  postDraw?: (system: ParticleSystem, context: CanvasRenderingContext2D) => void
}
```

### EmitterOptions
```typescript
type EmitterOptions = {
  particles: {
    position: 'uniform' | 'normal' | ((n: number) => vec2)
    speed: number | RandomRange | ((n: number) => number)
    direction: number | RandomRange | ((n: number) => number)  // radians
    size: vec2 | RandomRange<vec2> | ((n: number) => vec2)
    rotation: number | RandomRange | ((n: number) => number) | null  // radians, null = auto-calculate from velocity
    lifespan: number | RandomRange | ((n: number) => number)  // seconds
    style?: Partial<ParticleStyle> | null
    options?: Partial<ParticleOptions>
  }
  emission:
    | { type: 'rate', rate: number | RandomRange }  // particles per second
    | { type: 'burst', n: number | RandomRange, delay?: number }  // one-time emission
    | { type: 'custom', f: () => number }  // custom emission logic
}
```

### ColliderGeometry
```typescript
type ColliderGeometry =
  | { type: 'circle', position: vec2, radius: number }
  | { type: 'rectangle', position: vec2, size: vec2, rotation?: number }
  | { type: 'polygon', vertices: vec2[] }
```

## Usage Pattern

```typescript
// Initialize system
const system = new ParticleSystem();

// Add emitter
system.emitters.push(new Emitter(
  { x: 400, y: 400 },  // position
  { x: 100, y: 100 },  // size
  -1,                  // lifespan (-1 = infinite)
  {
    particles: {
      position: 'uniform',
      speed: { min: 50, max: 100 },
      direction: { min: -Math.PI, max: Math.PI },
      size: { x: 30, y: 30 },
      rotation: null,
      lifespan: 5,
      style: {
        style: 'dot',
        color: ['#ff0000', '#00ff00', '#0000ff'],
        fade: { in: 0.5, out: 2 },
        trail: { length: 10, widthDecay: 1 }
      }
    },
    emission: { type: 'rate', rate: 10 }
  }
));

// Add attractor
system.attractors.push(new Attractor(
  { x: 500, y: 300 },  // position
  150,                 // range
  2000,                // force
  0.4,                 // falloff
  -1                   // lifespan
));

// Add force field
system.forceFields.push(new ForceField(
  { x: 0, y: 300 },   // force vector
  -1                  // lifespan
));

// Add collider
system.colliders.push(new Collider(
  { type: 'rectangle', position: { x: 400, y: 550 }, size: { x: 800, y: 100 } },
  0.4,  // restitution
  0.6,  // friction
  0.2   // randomness
));

// Add sink
system.sinks.push(new Sink(
  { x: 750, y: 50 },  // position
  60,                 // range
  5,                  // strength (5x aging)
  0.8,                // falloff
  'fade',             // mode
  -1                  // lifespan
));

// Game loop
function loop() {
  const dt = 1 / 60;
  system.update(dt);
  context.clearRect(0, 0, width, height);
  system.draw(context);
  requestAnimationFrame(loop);
}
```

## Key Behaviors

- Particles auto-dispose when age >= lifespan
- Emitters auto-dispose when age >= lifespan (if not -1)
- Attractors/ForceFields/Sinks auto-dispose when age >= lifespan (if not -1)
- Burst emitters auto-dispose after emission
- Rotation null = auto-calculate from velocity vector
- Colors can be single value or array (random selection)
- RandomRange values recalculated per particle
- Function parameters receive emission index n
- defaultUpdates 'all' = ['age', 'physics', 'direction', 'position']
- defaultDraws 'all' = ['transforms', 'fade', 'styles']
- Trail requires 'position' in defaultUpdates
- Particle size.x = width/length, size.y = height/line-width
- Direction 0 = right, increases counter-clockwise (radians)
- Force field force applied every frame: velocity += force * dt
- Attractor force decreases with distance^falloff
- Collider randomness: ±randomness * Math.PI offset on bounce
- Sink 'instant' mode: immediately sets particle.age = particle.lifespan
- Sink 'fade' mode: accelerates aging by strength * distanceFactor * rangeFalloff
- Sink effect stronger at center (controlled by falloff parameter)
