# Built-in Force Field Functions

Documentation for the built-in custom force functions available in `ForceField`.

## Overview

ForceField supports custom force functions that can create complex particle behaviors. You can either provide your own function or use one of the built-in force functions by name.

Usage:
```typescript
new ForceField(
  { x: 0, y: 0 },  // force vector (ignored for custom forces)
  -1,              // lifespan
  'forceName',     // Built-in force name
  { /* params */ } // Force-specific parameters
)
```

## Available Forces

### wave

Creates oscillating perpendicular motion, causing particles to wave back and forth.

**Parameters**:
```typescript
{
  frequency?: number  // Oscillations per second (default: 1)
  amplitude?: number  // Oscillation strength (default: 50)
}
```

**Example**:
```typescript
system.forceFields.push(new ForceField(
  { x: 100, y: 0 },  // Base forward motion
  -1,
  'wave',
  {
    frequency: 2,
    amplitude: 30
  }
));
```

**Use cases**: Wavy trails, serpentine motion, ribbon effects

---

### vortex

Creates spiral motion around a center point, pulling particles into a swirling pattern.

**Parameters**:
```typescript
{
  center: vec2        // Center of vortex (required)
  strength?: number   // Force strength (default: 1)
  range?: number      // Effective radius (default: 100)
  clockwise?: boolean // Rotation direction (default: false)
}
```

**Example**:
```typescript
system.forceFields.push(new ForceField(
  { x: 0, y: 0 },
  -1,
  'vortex',
  {
    center: { x: 400, y: 300 },
    strength: 50,
    range: 200,
    clockwise: true
  }
));
```

**Use cases**: Whirlpools, tornadoes, spiraling effects, drain animations

---

### orbital

Creates circular orbital motion around a center point, making particles orbit like satellites.

**Parameters**:
```typescript
{
  center: vec2        // Center of orbit (required)
  strength?: number   // Orbital force strength (default: 1)
  range?: number      // Effective radius (default: 100)
}
```

**Example**:
```typescript
system.forceFields.push(new ForceField(
  { x: 0, y: 0 },
  -1,
  'orbital',
  {
    center: { x: 300, y: 300 },
    strength: 80,
    range: 150
  }
));
```

**Use cases**: Planetary systems, circular force fields, ringed effects

---

### vectorField

Creates complex, flowing motion patterns using noise functions. Produces organic, natural-looking movement.

**Parameters**:
```typescript
{
  noise: (x: number, y: number, z: number) => number  // Required, returns -1 to 1
  noiseScale?: number    // Feature size (default: 0.01)
                         // Smaller = larger, smoother features
                         // Larger = smaller, more chaotic features
  timeScale?: number     // Animation speed (default: 0.1)
  forceAmount?: number   // Force magnitude (default: 100)
}
```

**Example**:
```typescript
// Using simplex or perlin noise (not included, use external library)
import { createNoise3D } from 'simplex-noise';
const noise3D = createNoise3D();

system.forceFields.push(new ForceField(
  { x: 0, y: 0 },
  -1,
  'vectorField',
  {
    noise: noise3D,
    noiseScale: 0.005,  // Large, flowing patterns
    timeScale: 0.2,     // Medium animation speed
    forceAmount: 150
  }
));
```

**Use cases**: Wind effects, flowing water, smoke simulation, organic movement patterns

**Note**: Requires a 3D noise function. Popular libraries: `simplex-noise`, `perlin-noise`. The z-dimension is used for time-based animation.

---

### turbulence

Creates random, chaotic motion using pseudo-random forces.

**Parameters**:
```typescript
{
  strength?: number   // Force magnitude (default: 100)
  frequency?: number  // Rate of change (default: 10)
                      // Higher = more rapid direction changes
}
```

**Example**:
```typescript
system.forceFields.push(new ForceField(
  { x: 0, y: 0 },
  -1,
  'turbulence',
  {
    strength: 80,
    frequency: 15
  }
));
```

**Use cases**: Jittery effects, sparkles, chaotic motion, electrical discharges

---

### drag

Simulates air resistance or friction, slowing particles over time.

**Parameters**:
```typescript
{
  coefficient?: number  // Drag amount (default: 0.5)
                        // 0 = no drag
                        // 1 = strong drag
                        // >1 = very strong drag
}
```

**Example**:
```typescript
system.forceFields.push(new ForceField(
  { x: 0, y: 0 },
  -1,
  'drag',
  {
    coefficient: 0.8
  }
));
```

**Use cases**: Slowing projectiles, underwater effects, friction simulation, energy loss

---

### boids

Implements flocking behavior with separation, alignment, and cohesion rules. Creates emergent swarm-like motion.

**Parameters**:
```typescript
{
  separationDistance?: number  // Personal space radius (default: 25)
  alignmentDistance?: number   // Alignment detection range (default: 50)
  cohesionDistance?: number    // Group attraction range (default: 50)
  separationWeight?: number    // Avoidance strength (default: 1.5)
  alignmentWeight?: number     // Heading match strength (default: 1.0)
  cohesionWeight?: number      // Group attraction strength (default: 1.0)
}
```

**Example**:
```typescript
system.forceFields.push(new ForceField(
  { x: 0, y: 0 },
  -1,
  'boids',
  {
    separationDistance: 20,
    alignmentDistance: 60,
    cohesionDistance: 60,
    separationWeight: 2.0,
    alignmentWeight: 1.0,
    cohesionWeight: 0.8
  }
));
```

**Use cases**: Flocking birds, schooling fish, swarm behavior, crowd simulation

**⚠️ Performance Warning**: This force has O(n²) complexity (checks every particle against every other). Only use with relatively small particle counts (recommended: < 200 particles). For larger systems, consider implementing spatial optimization or use a different approach.

## Creating Custom Forces

You can also provide your own custom force function:

```typescript
function myCustomForce(
  this: Particle,  // Bound to the affected particle
  system: ParticleSystem,
  forceField: ForceField,
  dt: number
): void {
  // Access particle properties via 'this'
  // Modify this.velocity to apply force

  // Example: Attract particles to mouse position
  const mousePos = forceField.customForceParams?.mousePos;
  if (mousePos) {
    const direction = vec2.sub(mousePos, this.position);
    const force = vec2.scale(vec2.nor(direction), 100);
    this.velocity = vec2.add(this.velocity, vec2.scale(force, dt));
  }
}

system.forceFields.push(new ForceField(
  { x: 0, y: 0 },
  -1,
  myCustomForce,
  { mousePos: { x: 0, y: 0 } }  // Updated elsewhere
));
```

## Combining Forces

Multiple force fields can be active simultaneously. They're applied in order:

```typescript
// Gravity + drag = realistic projectile motion
system.forceFields.push(new ForceField({ x: 0, y: 200 }, -1));  // Gravity
system.forceFields.push(new ForceField({ x: 0, y: 0 }, -1, 'drag', { coefficient: 0.3 }));

// Wind + turbulence = gusty wind
system.forceFields.push(new ForceField({ x: 50, y: 0 }, -1));  // Base wind
system.forceFields.push(new ForceField({ x: 0, y: 0 }, -1, 'turbulence', { strength: 30 }));

// Vortex + orbital = stable spiral
system.forceFields.push(new ForceField({ x: 0, y: 0 }, -1, 'vortex', { /* ... */ }));
system.forceFields.push(new ForceField({ x: 0, y: 0 }, -1, 'orbital', { /* ... */ }));
```

## Performance Tips

1. **Minimize force fields**: Each active force field is checked for every particle every frame
2. **Use selective targeting**: Set particle options to only check specific force fields by ID
3. **Avoid boids for large systems**: O(n²) complexity makes it expensive with many particles
4. **Consider range**: For forces like vortex/orbital, particles outside the range are skipped
5. **Dispose when done**: Set a lifespan so force fields clean up automatically

```typescript
// Selective targeting example
const windField = new ForceField(
  { x: 100, y: 0 },
  -1,
  null,
  null,
  'wind-force'  // ID
);
system.forceFields.push(windField);

// Particle only affected by this specific force
new Particle(
  pos, vel, size, rot, life,
  style,
  { useForceFields: 'wind-force' }  // Only check this ID
);
```
