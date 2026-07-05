---
name: basementuniverse-particles-2d
description: >
  A comprehensive 2D particle system library for creating visual effects in games and animations. Use this skill when implementing particle effects, emitters, attractors, force fields, colliders, sinks, or any particle-based visual systems in 2D games or canvas applications.
---

# Basement Universe Particles 2D

Use this skill when working with `@basementuniverse/particles-2d`, a feature-rich particle system library for 2D games and visual effects.

## When to Use This Skill

- Implementing particle effects (explosions, fire, smoke, sparkles, etc.)
- Creating emitter systems that spawn particles
- Adding forces that affect particle behavior (attractors, repellers, force fields)
- Implementing particle collisions with geometry
- Creating particle sinks (areas that destroy particles)
- Building complex particle animations with trails, glows, and fading
- Designing flocking/swarm behaviors with particles
- Implementing physics-based particle simulations

## Core Concepts

The particle system is built around several key components:

### ParticleSystem
The main container that manages all particles and their interactions. It holds references to:
- `particles`: Individual particle instances
- `emitters`: Objects that generate new particles
- `attractors`: Forces that attract or repel particles
- `forceFields`: Apply various forces (gravity, wind, custom effects)
- `colliders`: Handle particle collisions with geometry
- `sinks`: Remove or fade particles in specific areas

### Particle
Individual units with position, velocity, size, rotation, age, and visual style. Particles can:
- Have custom update and rendering logic
- Use built-in styles (dot, radial, line, image)
- Display trails, glows, and fade effects
- Be selectively affected by specific forces/colliders using IDs

### Emitter
Generates particles with configurable properties. Supports:
- Rate-based emission (continuous particle spawning)
- Burst emission (one-time particle explosions)
- Custom emission patterns
- Randomized or function-based particle properties

### Forces and Effects
- **Attractors**: Pull/push particles with distance-based falloff
- **ForceFields**: Apply constant or custom forces (including built-in effects like vortex, wave, boids)
- **Colliders**: Handle particle collisions with circles, rectangles, polygons
- **Sinks**: Remove particles instantly or fade them out in an area

## Common Patterns

### Basic Setup
```typescript
import { ParticleSystem, Emitter } from '@basementuniverse/particles-2d';

const system = new ParticleSystem();

// Add an emitter
system.emitters.push(new Emitter(
  { x: 100, y: 100 }, // position
  { x: 50, y: 50 },   // size
  -1,                 // lifespan (-1 = infinite)
  { /* options */ }
));

// Game loop
function update(deltaTime) {
  system.update(deltaTime);
}

function draw(context) {
  system.draw(context);
}
```

### Selective Targeting
Use the `id` parameter and particle options to control which forces affect which particles:

```typescript
// Create an attractor with an ID
system.attractors.push(new Attractor(
  { x: 200, y: 200 },
  100,    // range
  5,      // force
  1,      // falloff
  -1,     // lifespan
  'center-pull' // id
));

// Particle only affected by specific attractor
new Particle(
  position, velocity, size, rotation, lifespan,
  style,
  {
    useAttractors: 'center-pull', // Only use this specific attractor
    useForceFields: false,        // Ignore all force fields
  }
);
```

### Custom Update/Render Logic
Particles support custom behaviors while still using default physics:

```typescript
{
  particles: {
    // ... other config
    options: {
      defaultUpdates: ['age', 'physics'], // Use some defaults
      update: function(system, dt) {
        // Custom logic (this = particle)
        // e.g., change color over time
      },
      defaultDraws: 'all', // Use all default rendering
      postDraw: function(system, context) {
        // Custom rendering after default
      }
    }
  }
}
```

## Performance Considerations

- **Boids force**: O(n²) complexity, only use with < 200 particles
- **Particle count**: Modern browsers handle thousands of simple particles, but complex styles/trails reduce performance
- **Trail segments**: Longer trails increase draw calls
- **Selective targeting**: Use particle options to reduce unnecessary force calculations
- The `disposed` property on ParticleSystem returns true when all particles and emitters are finished, useful for cleanup

## Visual Styles

Particles support several built-in rendering styles:
- **dot**: Simple filled circle with optional glow
- **radial**: Radial gradient from solid to transparent
- **line**: Line segment with configurable rotation and glow
- **image**: Custom image rendering with rotation

All styles support:
- **fade**: Fade in/out based on particle age
- **trail**: Motion trails with configurable length, width/alpha decay, and colors

## References

- [API Reference](references/api.md) - Complete API documentation for all classes
- [Type Reference](references/types.md) - TypeScript type definitions
- [Built-in Forces](references/built-in-forces.md) - Documentation for ForceField custom force functions
- [Examples](references/examples.md) - Common usage patterns and recipes

## Quick Reference

### Creating a Simple Effect
```typescript
// Explosion effect
system.emitters.push(new Emitter(
  explosionPosition,
  { x: 0, y: 0 },
  -1,
  {
    particles: {
      position: 'uniform',
      speed: { min: 50, max: 150 },
      direction: { min: 0, max: Math.PI * 2 },
      size: { min: { x: 2, y: 2 }, max: { x: 8, y: 8 } },
      rotation: null,
      lifespan: { min: 0.5, max: 1.5 },
      style: {
        style: 'dot',
        color: ['#ff6600', '#ff9900', '#ffcc00'],
        fade: { in: 0, out: 0.3 }
      }
    },
    emission: {
      type: 'burst',
      n: 50,
      delay: 0
    }
  }
));
```

### Adding Gravity
```typescript
system.forceFields.push(new ForceField(
  { x: 0, y: 100 }, // downward force
  -1 // infinite lifespan
));
```

### Creating a Vortex
```typescript
system.forceFields.push(new ForceField(
  { x: 0, y: 0 }, // force vector (unused for custom forces)
  -1,
  'vortex',
  {
    center: { x: 200, y: 200 },
    strength: 50,
    range: 150,
    clockwise: true
  }
));
```
