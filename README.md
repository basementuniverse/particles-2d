# Game Component: Particle System 2D

A basic particle system component for use in 2d games.

## Installation

```bash
npm install @basementuniverse/particles-2d
```

## How to use

See `/demos` for some examples.

1. Import the component and any other classes you need:

```js
import {
  ParticleSystem,
  Emitter,
  Attractor,
  ForceField,
  Collider,
  Sink,
} from '@basementuniverse/particles-2d';
```

2. Create a `ParticleSystem` instance:

```js
const particleSystem = new ParticleSystem();
```

3. Add emitters, attractors, force fields, and colliders as needed:

```js
particleSystem.emitters.push(
  new Emitter(/* See below for options */)
);

particleSystem.attractors.push(
  new Attractor(/* See below for options */)
);

particleSystem.forceFields.push(
  new ForceField(/* See below for options */)
);

particleSystem.colliders.push(
  new Collider(/* See below for options */)
);

particleSystem.sinks.push(
  new Sink(/* See below for options */)
);
```

4. Update and render the particle system in your game loop:

```js
function update(deltaTime) {
  particleSystem.update(deltaTime);

  // Other game logic...
}

function draw(context) {
  particleSystem.draw(context);

  // Other rendering logic...
}
```

5. The particle system can be removed when all particles and emitters are disposed:

```js
if (particleSystem.disposed) {
  // Clean up resources or remove from game loop...
}
```

## Utility types

#### `vec2`

```ts
{ x: number, y: number }
```

#### `Color`

```ts
{ r: number, g: number, b: number, a?: number }
```

## Emitters

Emitters are responsible for generating and emitting particles.

```ts
new Emitter(
  position: vec2, // { x: number, y: number }
  size: vec2, // { x: number, y: number }
  lifespan: number, // in seconds, use -1 for infinite lifespan
  options?: EmitterOptions // see below...
);
```

### Emitter Options

```js
{
  particles: {
    position
    speed
    direction
    size
    rotation
    lifespan
    style
    options
  },

  emission: {
    type
    rate, n, delay, f // depends on type
  }
}
```

#### `particles.position`

Define the initial position of particles:

- `'uniform'`: particles will be uniformly distributed within the emitter's area as defined by its `position` (this is the center) and `size`
- `'normal'`: particles will be normally distributed within the emitter's area, i.e. more particles will be generated near the center of the emitter and fewer towards the edges
- `(n: number) => vec2`: a function that returns a position for each particle, where `n` is the index of the particle being emitted (maybe useful if we're emitting multiple particles in a single frame)

#### `particles.speed`

Define the initial speed of particles:

- `number`: a constant speed for all particles
- `{ min: number, max: number }`: a range of speeds for particles, each particle will have a random speed within this range
- `(n: number) => number`: a function that returns a speed for each particle, where `n` is the index of the particle being emitted

#### `particles.direction`

Define the initial direction of particles in radians (0 is right):

- `number`: a constant direction for all particles
- `{ min: number, max: number }`: a range of directions for particles, each particle will have a random direction within this range
- `(n: number) => number`: a function that returns a direction for each particle, where `n` is the index of the particle being emitted

#### `particles.size`

Define the initial size of particles:

- `{ x: number, y: number }`: a constant size for all particles
- `{ min: { x, y }, max: { x, y } }`: a range of sizes for particles, each particle will have a random size within this range
- `(n: number) => { x: number, y: number }`: a function that returns a size for each particle, where `n` is the index of the particle being emitted

#### `particles.rotation`

Define the initial rotation of particles in radians (0 is right):

- `null`: rotation will be calculated based on the particle's velocity
- `number`: a constant rotation for all particles
- `{ min: number, max: number }`: a range of rotations for particles, each particle will have a random rotation within this range
- `(n: number) => number`: a function that returns a rotation for each particle, where `n` is the index of the particle being emitted

#### `particles.lifespan`

Define the lifespan of particles in seconds:

- `number`: a constant lifespan for all particles
- `{ min: number, max: number }`: a range of lifespans for particles, each particle will have a random lifespan within this range
- `(n: number) => number`: a function that returns a lifespan for each particle, where `n` is the index of the particle being emitted

#### `particles.style`

There are a few default "built-in" styles:

```ts
{
  // the size of the dot will be max(size.x, size.y)
  style: 'dot';
  color: Color | string | Color[] | string[]; // fixed or random color
  glow?: {
    color: Color | string | Color[] | string[];
    amount: number;
  };
  fade?: {
    in: number; // fade in duration in seconds
    out: number; // fade out duration in seconds
  };
}
```

```ts
{
  // the size of the radial gradient will be max(size.x, size.y)
  style: 'radial';
  color: Color | string | Color[] | string[]; // fixed or random color
  fade?: {
    in: number; // fade in duration in seconds
    out: number; // fade out duration in seconds
  };
}
```

```ts
{
  // the length of the line will be size.x, and the width will be size.y
  style: 'line';
  color: Color | string | Color[] | string[];
  rotationOffset?: number; // how much to offset the particle's rotation in radians
  glow?: {
    color: Color | string | Color[] | string[];
    amount: number;
  };
  fade?: {
    in: number; // fade in duration in seconds
    out: number; // fade out duration in seconds
  };
}
```

```ts
{
  // the size of the image is defined by size.x and size.y
  style: 'image';
  image: HTMLImageElement; // the image to render
  rotationOffset?: number; // how much to offset the particle's rotation in radians
  fade?: {
    in: number; // fade in duration in seconds
    out: number; // fade out duration in seconds
  };
}
```

#### `particles.style.trail`

Particles can optionally have a trail effect.

```ts
{
  // the size of the image is defined by size.x and size.y
  style: '...';
  // other style options (see above)...
  trail: {
    length: number; // how many trail segments to keep
    color?: Color | string | Color[] | string[]; // fixed or random color for the trail, if not provided we use the particle's color
    width?: number; // width of the trail segments, if not provided we use the particle's size
    widthDecay?: number; // how much to decay the width of the trail segments, 0 means no decay, 1 means full decay (the trail will disappear over its length), negative numbers cause the trail to grow wider over its length
    segmentFade?: {
      in: number; // how many segments to fade in at the start of the trail
      out: number; // how many segments to fade out at the end of the trail
    };
  }
}
```

#### `particles.options`

```ts
{
  useAttractors: boolean | string | string[]; // which attractors should affect these particles
  useForceFields: boolean | string | string[]; // which force fields should affect these particles
  useColliders: boolean | string | string[]; // which colliders should affect these particles
  useSinks: boolean | string | string[]; // which sinks should affect these particles
  maxSpeed: number; // maximum speed (velocity magnitude) for particles, use -1 for no limit

  defaultUpdates: 'none' | 'all' | ParticleDefaultUpdateTypes;
  update?: (system: ParticleSystem, dt: number) => void;

  defaultDraws: 'none' | 'all' | ParticleDefaultDrawTypes;
  preDraw?: (system: ParticleSystem, context: CanvasRenderingContext2D) => void;
  postDraw?: (system: ParticleSystem, context: CanvasRenderingContext2D) => void;
}
```

For `useAttractors`, `useForceFields`, `useColliders`, and `useSinks`:
- `false`: particles are not affected by any of these elements
- `true`: particles are affected by all of these elements
- `'id'`: particles are affected only by the element with this specific id
- `['id1', 'id2', ...]`: particles are affected only by elements with these ids

Default update types:
- `age`: update the age of particles and handle disposal
- `physics`: update the velocity of particles based on forces, collisions, etc.
- `direction`: update the direction of particles based on their velocity
- `position`: integrate the position of particles based on their velocity

Default draw types:
- `transforms`: apply transformations like translation and rotation
- `fade`: apply fade in/out effects to particles
- `styles`: render the particle's style (dot, radial, line, image)

#### `emission`

Various particle emission types are available:

```ts
{
  // emit some number of particles per second
  type: 'rate';
  rate: number | { min: number, max: number };
}
```

If rate is a random range, the rate will be updated every second.

```ts
{
  // emit some number of particles immediately and then automatically dispose the emitter
  type: 'burst';
  n: number | { min: number, max: number };
  delay?: number; // optional delay in seconds before emitting
}
```

```ts
{
  // custom function, this will be called every frame and should return the number of particles to emit
  type: 'custom';
  f: () => number;
}
```

## Attractors

Attractors can attract or repel particles in range of the attractor.

```ts
new Attractor(
  position: vec2, // { x: number, y: number }
  range: number,
  force: number, // negative for repulsion, positive for attraction
  falloff: number,
  lifespan: number, // use -1 for infinite lifespan
  id?: string // optional unique identifier for selective particle targeting
);
```

## Force Fields

Force fields apply a force to all particles.

```ts
new ForceField(
  force: vec2, // { x: number, y: number }
  lifespan: number, // use -1 for infinite lifespan
  customForce?: string | ((system: ParticleSystem, forceField: ForceField, dt: number) => void), // optional built-in name or custom force function
  customForceParams?: Record<string, any>, // optional parameters for built-in or custom force functions
  id?: string // optional unique identifier for selective particle targeting
);
```

### Built-in Force Functions

You can use built-in force functions by passing their name as a string to `customForce`:

#### `wave`

Creates a wave effect, causing particles to oscillate back and forth perpendicular to the force field's force direction.

Parameters:
- `frequency` (number, default: 1): Controls how many oscillations occur per second
- `amplitude` (number, default: 50): Controls how far particles are pushed from side to side

Example:

```ts
system.forceFields.push(new ForceField(
  { x: 0, y: 0 },  // not used with built-in function
  -1,              // lifespan
  'wave',          // built-in function name
  {
    frequency: 2,
    amplitude: 100
  }
));
```

#### `vortex`

Creates a vortex effect, causing particles to spiral around a center point.

Parameters:
- `center` (vec2, required): The center point of the vortex
- `strength` (number, default: 1): Controls how strongly particles are pulled into the vortex
- `range` (number, default: 100): Controls how far from the center the vortex effect is applied
- `clockwise` (boolean, default: false): If true, particles spiral clockwise

Example:

```ts
system.forceFields.push(new ForceField(
  { x: 0, y: 0 },  // not used with built-in function
  -1,              // lifespan
  'vortex',        // built-in function name
  {
    center: { x: 400, y: 300 },
    strength: 500,
    range: 200,
    clockwise: false
  },
  'my-vortex'     // optional id
));
```

#### `orbital`

Creates an orbital effect, causing particles to orbit around a center point in a circular path.

Parameters:
- `center` (vec2, required): The center point of the orbital effect
- `strength` (number, default: 1): Controls how strongly particles are pulled into orbit
- `range` (number, default: 100): Controls how far from the center the orbital effect is applied

Example:

```ts
system.forceFields.push(new ForceField(
  { x: 0, y: 0 },
  -1,
  'orbital',
  {
    center: { x: 400, y: 300 },
    strength: 1000,
    range: 150
  }
));
```

#### `vectorField`

Creates a vector field effect using noise to create complex, flowing motion patterns.

Parameters:
- `noise` (function, required): A noise function with signature `(x: number, y: number, z: number) => number` that returns values in range [-1, 1]
- `noiseScale` (number, default: 0.01): Controls the size of noise features
  - Smaller values = larger, smoother features
  - Larger values = smaller, more chaotic features
- `timeScale` (number, default: 0.1): Controls how quickly the field changes over time
- `forceAmount` (number, default: 100): Controls how strongly particles are affected

Example:

```ts
// Assuming you have a simplex noise library
import { createNoise3D } from 'simplex-noise';
const noise3D = createNoise3D();

system.forceFields.push(new ForceField(
  { x: 0, y: 0 },
  -1,
  'vectorField',
  {
    noise: noise3D,
    noiseScale: 0.005,
    timeScale: 0.2,
    forceAmount: 150
  }
));
```

#### `turbulence`

Creates a turbulence effect using random forces to create chaotic, jittery motion.

Parameters:
- `strength` (number, default: 100): Controls how strongly particles are affected
- `frequency` (number, default: 10): Controls how often the random force changes
  - Higher values = more rapid changes in direction
  - Lower values = slower, more flowing changes

Example:

```ts
system.forceFields.push(new ForceField(
  { x: 0, y: 0 },
  -1,
  'turbulence',
  {
    strength: 150,
    frequency: 20
  }
));
```

#### `drag`

Creates a drag effect, simulating air resistance or friction that slows particles over time.

Parameters:
- `coefficient` (number, default: 0.5): Controls how much drag is applied
  - 0 = no drag
  - 1 = maximum drag (particles slow to a stop quickly)
  - Higher values = even stronger drag

Example:

```ts
system.forceFields.push(new ForceField(
  { x: 0, y: 0 },
  -1,
  'drag',
  {
    coefficient: 0.8
  }
));
```

#### `boids`

Implements boids flocking behavior, causing particles to exhibit emergent group dynamics with three classic rules:
- **Separation**: avoid crowding neighbors
- **Alignment**: steer towards average heading of neighbors
- **Cohesion**: steer towards average position of neighbors

Parameters:
- `separationDistance` (number, default: 25): How close is too close
- `alignmentDistance` (number, default: 50): Range for alignment behavior
- `cohesionDistance` (number, default: 50): Range for cohesion behavior
- `separationWeight` (number, default: 1.5): Strength of separation force
- `alignmentWeight` (number, default: 1.0): Strength of alignment force
- `cohesionWeight` (number, default: 1.0): Strength of cohesion force

**⚠️ Performance Warning**: This force function checks each particle against all others in the system, resulting in O(n²) complexity. Only use with relatively small particle counts (recommended: < 200 particles). For larger systems, consider implementing custom boids behavior with spatial optimization.

Example:

```ts
system.forceFields.push(new ForceField(
  { x: 0, y: 0 },
  -1,
  'boids',
  {
    separationDistance: 30,
    alignmentDistance: 60,
    cohesionDistance: 60,
    separationWeight: 2.0,
    alignmentWeight: 1.0,
    cohesionWeight: 0.8
  }
));
```

### Custom Force Function

You can optionally provide a custom function to apply forces to particles. This function is called for each particle affected by the force field:

- The function is bound to the current particle, so `this` refers to the particle
- Parameters:
  - `system`: The particle system
  - `forceField`: The force field instance
  - `dt`: Delta time in seconds

Example:

```ts
// Vortex force field that rotates particles around a point
system.forceFields.push(new ForceField(
  { x: 0, y: 0 },  // force vector (not used with custom function)
  -1,              // lifespan
  function(system, forceField, dt) {
    // 'this' is the current particle
    const center = { x: 400, y: 300 };
    const toCenter = { x: center.x - this.position.x, y: center.y - this.position.y };
    const distance = Math.sqrt(toCenter.x * toCenter.x + toCenter.y * toCenter.y);

    if (distance > 0) {
      // Apply tangential force for vortex effect
      const tangent = { x: -toCenter.y, y: toCenter.x };
      const strength = 500 / distance;
      this.velocity.x += tangent.x * strength * dt;
      this.velocity.y += tangent.y * strength * dt;
    }
  },
  'vortex'  // optional id
));
```

## Colliders

Colliders are used for detecting and handling collisions with particles.

```ts
new Collider(
  geometry, // see below...
  restitution: number, // how bouncy the collider is, 0 is no bounce, 1 is full bounce
  friction: number, // how much friction the collider has, 0 is no friction,  1 is full friction
  randomness: number, // how much to randomly offset the direction of particles when they collide, 0 is no randomness, 1 is full randomness (the particle will be offset randomly +/- PI radians)
  id?: string // optional unique identifier for selective particle targeting
);
```

### Collider Geometry

Collider geometry can be defined in various ways:

```ts
{
  type: 'circle';
  position: vec2; // { x: number, y: number }
  radius: number;
}
```

```ts
{
  type: 'rectangle';
  position: vec2; // { x: number, y: number }
  size: vec2; // { x: number, y: number }
  rotation?: number; // optional rotation in radians
}
```

```ts
{
  type: 'polygon';
  vertices: vec2[]; // array of vertices defining the polygon
}
```

## Sinks

Sinks destroy or fade out particles within range of the sink.

```ts
new Sink(
  position: vec2, // { x: number, y: number }
  range: number, // range of effect
  strength: number, // how fast to accelerate particle aging (multiplier)
  falloff: number, // distance-based effect gradient (higher = stronger at center)
  mode: 'instant' | 'fade', // 'instant' destroys immediately, 'fade' accelerates aging
  lifespan: number, // use -1 for infinite lifespan
  id?: string // optional unique identifier for selective particle targeting
);
```

Sinks use age acceleration to destroy particles:

- **'instant' mode**: particles are immediately disposed when they enter the sink's range
- **'fade' mode**: particles age faster within the sink's range, causing them to naturally reach their lifespan and trigger any configured fade-out effects

The `strength` parameter determines how much faster particles age (e.g., `strength = 5` means particles age 5x faster). The `falloff` parameter creates a distance-based gradient, making the effect stronger near the center of the sink.

### Example Use Cases

```ts
// Gradual fade sink (respects particle fade settings)
system.sinks.push(new Sink(
  { x: 750, y: 50 },  // position at HUD element
  60,                  // range
  5,                   // 5x aging acceleration
  0.8,                 // gentle falloff
  'fade',              // respect fade-out settings
  3                    // dispose sink after 3 seconds
));

// Instant destruction sink
system.sinks.push(new Sink(
  { x: 400, y: 300 },
  40,
  Infinity,            // not used in instant mode
  1,
  'instant',           // particles vanish immediately
  -1                   // permanent
));
```
