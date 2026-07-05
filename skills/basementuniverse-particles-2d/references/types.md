# Type Reference

TypeScript type definitions for `@basementuniverse/particles-2d`.

## Basic Types

### vec2
```typescript
type vec2 = { x: number, y: number }
```

### Color
```typescript
type Color = {
  r: number  // 0-255
  g: number  // 0-255
  b: number  // 0-255
  a?: number // 0-1, optional alpha
}
```

Can also use string colors: `'#ff0000'`, `'rgb(255, 0, 0)'`, `'rgba(255, 0, 0, 0.5)'`

### RandomRange
```typescript
type RandomRange<T extends number | vec2 = number> = {
  min: T
  max: T
}

// Examples:
const speedRange: RandomRange = { min: 10, max: 50 }
const sizeRange: RandomRange<vec2> = {
  min: { x: 2, y: 2 },
  max: { x: 10, y: 10 }
}
```

## Particle Types

### ParticleStyle

```typescript
type ParticleStyle = (
  | {
      style: 'dot'
      color: Color | string | Array<Color | string>  // Random selection from array
      glow?: {
        color: Color | string | Array<Color | string>
        amount: number  // Blur radius
      }
    }
  | {
      style: 'radial'
      color: Color | string | Array<Color | string>
    }
  | {
      style: 'line'
      color: Color | string | Array<Color | string>
      rotationOffset?: number  // Radians
      glow?: {
        color: Color | string | Array<Color | string>
        amount: number
      }
    }
  | {
      style: 'image'
      image: HTMLImageElement
      rotationOffset?: number  // Radians
    }
) & {
  fade?: {
    in: number   // Seconds to fade in
    out: number  // Seconds to fade out (from end of life)
  }
  trail?: {
    length: number            // Number of trail segments
    color?: Color | string | Array<Color | string>  // Defaults to particle color
    width?: number            // Base width, defaults to particle size
    widthDecay?: number       // 0-1, how much width decreases along trail (0 = constant, 1 = full decay)
    alphaDecay?: number       // 0-1, how much alpha decreases along trail (0 = constant, 1 = full decay)
    decayTime?: number        // Seconds for time-based fade (default: 0.5)
  }
}
```

### ParticleOptions

```typescript
type ParticleOptions = {
  // Selective targeting
  useAttractors: boolean | string | string[]
  useForceFields: boolean | string | string[]
  useColliders: boolean | string | string[]
  useSinks: boolean | string | string[]

  maxSpeed: number  // -1 for unlimited

  // Default update behaviors
  defaultUpdates: 'none' | 'all' | Array<
    'age' |       // Age particle and dispose when lifespan reached
    'physics' |   // Apply forces from attractors, force fields, etc.
    'direction' | // Calculate rotation from velocity
    'position'    // Integrate velocity into position
  >

  // Default draw behaviors
  defaultDraws: 'none' | 'all' | Array<
    'transforms' | // Apply translation and rotation
    'fade' |       // Apply fade in/out effects
    'styles'       // Render using built-in styles
  >

  // Custom hooks (bound to particle as 'this')
  update?: (system: ParticleSystem, dt: number) => void
  preDraw?: (system: ParticleSystem, context: CanvasRenderingContext2D) => void
  postDraw?: (system: ParticleSystem, context: CanvasRenderingContext2D) => void
}
```

## Emitter Types

### EmitterOptions

```typescript
type EmitterOptions = {
  particles: {
    // Position distribution
    position: (
      | 'uniform'  // Uniform distribution in emitter area
      | 'normal'   // Normal (gaussian) distribution
      | ((n: number) => vec2)  // Custom function, n = particle index
    )

    // Initial speed
    speed: (
      | number
      | RandomRange
      | ((n: number) => number)
    )

    // Initial direction (radians, 0 = right)
    direction: (
      | number
      | RandomRange
      | ((n: number) => number)
    )

    // Particle size
    size: (
      | vec2
      | RandomRange<vec2>
      | ((n: number) => vec2)
    )

    // Particle rotation (radians, null = calculate from velocity)
    rotation: (
      | number
      | RandomRange
      | ((n: number) => number)
      | null
    )

    // Particle lifespan (seconds)
    lifespan: (
      | number
      | RandomRange
      | ((n: number) => number)
    )

    style?: Partial<ParticleStyle> | null
    options?: Partial<ParticleOptions>
  }

  emission: (
    | {
        type: 'rate'
        rate: number | RandomRange  // Particles per second
      }
    | {
        type: 'burst'
        n: number | RandomRange     // Total particles to emit
        delay?: number              // Delay before burst (seconds)
      }
    | {
        type: 'custom'
        f: () => number             // Function returning particles to emit this update
      }
  )
}
```

## Collider Types

### ColliderGeometry

```typescript
type ColliderGeometry = (
  | {
      type: 'circle'
      position: vec2
      radius: number
    }
  | {
      type: 'rectangle'
      position: vec2    // Center position
      size: vec2
      rotation?: number // Radians
    }
  | {
      type: 'polygon'
      vertices: vec2[]  // Array of vertices
    }
)
```

## Force Field Types

### Custom Force Function

```typescript
type CustomForceFunction = (
  this: Particle,
  system: ParticleSystem,
  forceField: ForceField,
  dt: number
) => void
```

Custom force functions are bound to the particle they're affecting, so `this` refers to the particle.

### Built-in Force Parameters

**Wave**:
```typescript
{
  frequency?: number  // Oscillations per second (default: 1)
  amplitude?: number  // Oscillation strength (default: 50)
}
```

**Vortex**:
```typescript
{
  center: vec2        // Center of vortex (required)
  strength?: number   // Force strength (default: 1)
  range?: number      // Effective radius (default: 100)
  clockwise?: boolean // Direction (default: false)
}
```

**Orbital**:
```typescript
{
  center: vec2        // Center of orbit (required)
  strength?: number   // Force strength (default: 1)
  range?: number      // Effective radius (default: 100)
}
```

**Vector Field**:
```typescript
{
  noise: (x: number, y: number, z: number) => number  // Required, returns -1 to 1
  noiseScale?: number    // Feature size (default: 0.01, smaller = larger features)
  timeScale?: number     // Animation speed (default: 0.1)
  forceAmount?: number   // Force magnitude (default: 100)
}
```

**Turbulence**:
```typescript
{
  strength?: number   // Force magnitude (default: 100)
  frequency?: number  // Change rate (default: 10)
}
```

**Drag**:
```typescript
{
  coefficient?: number  // Drag amount, 0-1+ (default: 0.5)
}
```

**Boids**:
```typescript
{
  separationDistance?: number  // Avoidance range (default: 25)
  alignmentDistance?: number   // Alignment range (default: 50)
  cohesionDistance?: number    // Cohesion range (default: 50)
  separationWeight?: number    // Separation strength (default: 1.5)
  alignmentWeight?: number     // Alignment strength (default: 1.0)
  cohesionWeight?: number      // Cohesion strength (default: 1.0)
}
```

## Sink Types

### Sink Mode

```typescript
type SinkMode = 'instant' | 'fade'

// 'instant': Immediately sets particle.age = particle.lifespan
// 'fade': Gradually accelerates particle aging based on distance
```

## Default Values

For reference, these are the default values used by the library:

```typescript
// Default Particle Options
{
  useAttractors: true,
  useForceFields: true,
  useColliders: true,
  useSinks: true,
  maxSpeed: -1,
  defaultUpdates: 'all',
  defaultDraws: 'all',
}

// Default Particle Style
{
  style: 'dot',
  color: 'white',
}

// Default Emitter Options
{
  particles: {
    position: 'uniform',
    speed: 0,
    direction: 0,
    size: { x: 1, y: 1 },
    rotation: null,
    lifespan: 1,
    style: { style: 'dot', color: 'white' },
    options: { /* see above */ },
  },
  emission: {
    type: 'rate',
    rate: 1,
  },
}
```
