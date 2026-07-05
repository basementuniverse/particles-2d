# Usage Examples

Common patterns and recipes for `@basementuniverse/particles-2d`.

## Basic Setup

### Minimal Example
```typescript
import { ParticleSystem, Emitter } from '@basementuniverse/particles-2d';

// Create system
const system = new ParticleSystem();

// Add simple emitter
system.emitters.push(new Emitter(
  { x: 400, y: 300 },  // Center of screen
  { x: 0, y: 0 },      // Point source
  -1                   // Infinite lifespan
));

// Game loop
function gameLoop(deltaTime) {
  system.update(deltaTime);

  context.clearRect(0, 0, canvas.width, canvas.height);
  system.draw(context);

  requestAnimationFrame(gameLoop);
}
```

## Particle Effects

### Explosion
```typescript
function createExplosion(position) {
  system.emitters.push(new Emitter(
    position,
    { x: 0, y: 0 },  // Point source
    -1,
    {
      particles: {
        position: 'uniform',
        speed: { min: 100, max: 300 },
        direction: { min: 0, max: Math.PI * 2 },  // All directions
        size: { min: { x: 3, y: 3 }, max: { x: 8, y: 8 } },
        rotation: null,
        lifespan: { min: 0.3, max: 1.0 },
        style: {
          style: 'dot',
          color: ['#ff4400', '#ff8800', '#ffcc00', '#ffffff'],
          glow: {
            color: '#ff8800',
            amount: 10
          },
          fade: { in: 0, out: 0.3 }
        }
      },
      emission: {
        type: 'burst',
        n: 60
      }
    }
  ));
}
```

### Fire
```typescript
function createFire(position) {
  system.emitters.push(new Emitter(
    position,
    { x: 20, y: 5 },  // Wide, flat emitter
    -1,
    {
      particles: {
        position: 'normal',  // Concentrated in center
        speed: { min: 20, max: 60 },
        direction: { min: -Math.PI * 0.6, max: -Math.PI * 0.4 },  // Upward
        size: { min: { x: 4, y: 4 }, max: { x: 12, y: 12 } },
        rotation: null,
        lifespan: { min: 0.5, max: 1.5 },
        style: {
          style: 'radial',  // Soft gradient
          color: ['#ff3300', '#ff6600', '#ff9900', '#ffcc00'],
          fade: { in: 0.1, out: 0.5 }
        },
        options: {
          useForceFields: 'fire-updraft'  // Only affected by specific force
        }
      },
      emission: {
        type: 'rate',
        rate: 30
      }
    }
  ));

  // Add upward force for rising smoke/flames
  system.forceFields.push(new ForceField(
    { x: 0, y: -50 },  // Upward
    -1,
    null,
    null,
    'fire-updraft'
  ));
}
```

### Smoke Trail
```typescript
function createSmokeEmitter(position) {
  return new Emitter(
    position,
    { x: 5, y: 5 },
    -1,
    {
      particles: {
        position: 'normal',
        speed: { min: 10, max: 30 },
        direction: { min: Math.PI * 1.4, max: Math.PI * 1.6 },  // Mostly upward
        size: { min: { x: 8, y: 8 }, max: { x: 20, y: 20 } },
        rotation: null,
        lifespan: { min: 2, max: 3 },
        style: {
          style: 'radial',
          color: [
            { r: 100, g: 100, b: 100, a: 0.5 },
            { r: 120, g: 120, b: 120, a: 0.4 }
          ],
          fade: { in: 0.2, out: 1.0 }
        }
      },
      emission: {
        type: 'rate',
        rate: 15
      }
    }
  );
}
```

### Sparkles
```typescript
function createSparkles(position, duration = 2) {
  system.emitters.push(new Emitter(
    position,
    { x: 30, y: 30 },
    duration,
    {
      particles: {
        position: 'uniform',
        speed: { min: 5, max: 30 },
        direction: { min: 0, max: Math.PI * 2 },
        size: { x: 2, y: 2 },
        rotation: null,
        lifespan: { min: 0.5, max: 1.5 },
        style: {
          style: 'dot',
          color: ['#ffff00', '#ffffff', '#ffcc00'],
          glow: {
            color: '#ffff88',
            amount: 5
          },
          fade: { in: 0, out: 0.3 }
        }
      },
      emission: {
        type: 'rate',
        rate: 20
      }
    }
  ));

  // Add turbulence for twinkling effect
  system.forceFields.push(new ForceField(
    { x: 0, y: 0 },
    duration,
    'turbulence',
    { strength: 50, frequency: 20 }
  ));
}
```

### Rain
```typescript
function setupRain() {
  system.emitters.push(new Emitter(
    { x: canvas.width / 2, y: -10 },
    { x: canvas.width, y: 0 },  // Wide horizontal emitter above screen
    -1,
    {
      particles: {
        position: 'uniform',
        speed: { min: 300, max: 400 },
        direction: Math.PI * 0.5,  // Straight down
        size: { x: 1, y: 8 },  // Thin line
        rotation: Math.PI * 0.5,
        lifespan: 3,
        style: {
          style: 'line',
          color: 'rgba(150, 180, 255, 0.6)',
          fade: { in: 0, out: 0.1 }
        }
      },
      emission: {
        type: 'rate',
        rate: 100
      }
    }
  ));

  // Add gravity
  system.forceFields.push(new ForceField({ x: 0, y: 200 }, -1));

  // Add wind
  system.forceFields.push(new ForceField({ x: 50, y: 0 }, -1));
}
```

## Interactive Effects

### Mouse Attractor
```typescript
let mousePos = { x: 0, y: 0 };

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;
});

// Update attractor position each frame
function update(dt) {
  if (system.attractors.length === 0) {
    system.attractors.push(new Attractor(
      mousePos,
      150,   // range
      100,   // force
      1,     // falloff
      -1     // infinite lifespan
    ));
  } else {
    system.attractors[0].position = mousePos;
  }

  system.update(dt);
}
```

### Click to Burst
```typescript
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickPos = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };

  createExplosion(clickPos);  // Using explosion from earlier example
});
```

## Advanced Patterns

### Projectile with Trail
```typescript
function createProjectile(start, target) {
  const direction = vec2.nor(vec2.sub(target, start));
  const speed = 500;

  // Create moving emitter (emitter will follow projectile)
  const emitter = new Emitter(
    start,
    { x: 0, y: 0 },
    3,  // Projectile lifetime
    {
      particles: {
        position: 'uniform',
        speed: { min: 5, max: 20 },
        direction: { min: 0, max: Math.PI * 2 },
        size: { x: 3, y: 3 },
        rotation: null,
        lifespan: 0.5,
        style: {
          style: 'dot',
          color: '#00ffff',
          glow: { color: '#00ffff', amount: 8 },
          fade: { in: 0, out: 0.3 }
        }
      },
      emission: {
        type: 'rate',
        rate: 50
      }
    }
  );

  system.emitters.push(emitter);

  // Move emitter each frame
  const startTime = Date.now();
  const updateInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed >= 3 || emitter.disposed) {
      clearInterval(updateInterval);
      return;
    }

    emitter.position = vec2.add(
      start,
      vec2.scale(direction, speed * elapsed)
    );
  }, 16);
}
```

### Fountain
```typescript
function createFountain(position) {
  system.emitters.push(new Emitter(
    position,
    { x: 10, y: 0 },
    -1,
    {
      particles: {
        position: 'normal',
        speed: { min: 200, max: 300 },
        direction: { min: -Math.PI * 0.6, max: -Math.PI * 0.4 },  // Upward arc
        size: { x: 4, y: 4 },
        rotation: null,
        lifespan: { min: 1.5, max: 2.5 },
        style: {
          style: 'dot',
          color: '#4499ff',
          fade: { in: 0, out: 0.2 }
        }
      },
      emission: {
        type: 'rate',
        rate: 30
      }
    }
  ));

  // Gravity pulls particles down
  system.forceFields.push(new ForceField({ x: 0, y: 400 }, -1));

  // Ground collider
  system.colliders.push(new Collider(
    {
      type: 'rectangle',
      position: { x: 400, y: 550 },
      size: { x: 800, y: 100 }
    },
    0.3,  // Some bounce
    0.8,  // High friction
    0.1   // Slight randomness
  ));
}
```

### Vortex Effect
```typescript
function createVortex(center, duration = 5) {
  // Spawn particles around the vortex
  system.emitters.push(new Emitter(
    center,
    { x: 200, y: 200 },
    duration,
    {
      particles: {
        position: 'uniform',
        speed: { min: 20, max: 50 },
        direction: { min: 0, max: Math.PI * 2 },
        size: { x: 3, y: 3 },
        rotation: null,
        lifespan: { min: 2, max: 4 },
        style: {
          style: 'dot',
          color: ['#ff00ff', '#00ffff', '#ffff00'],
          trail: {
            length: 10,
            widthDecay: 0.8,
            alphaDecay: 0.9,
            decayTime: 0.3
          },
          fade: { in: 0.1, out: 0.5 }
        }
      },
      emission: {
        type: 'rate',
        rate: 40
      }
    }
  ));

  // Add vortex force
  system.forceFields.push(new ForceField(
    { x: 0, y: 0 },
    duration,
    'vortex',
    {
      center: center,
      strength: 100,
      range: 200,
      clockwise: true
    }
  ));

  // Add sink at center to remove particles
  system.sinks.push(new Sink(
    center,
    30,      // small range
    2,       // strength
    1,       // falloff
    'fade',  // gradual removal
    duration
  ));
}
```

### Flocking Birds
```typescript
function createFlockingParticles() {
  // Spawn initial flock
  for (let i = 0; i < 50; i++) {
    const particle = new Particle(
      {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height
      },
      {
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50
      },
      { x: 6, y: 3 },  // Small ellipse shape
      null,  // Rotation from velocity
      -1,    // Infinite life
      {
        style: 'line',
        color: '#ffffff',
        rotationOffset: -Math.PI / 2  // Point line forward
      },
      {
        maxSpeed: 150,
        useForceFields: 'boids-only'
      }
    );
    system.particles.push(particle);
  }

  // Add boids behavior
  system.forceFields.push(new ForceField(
    { x: 0, y: 0 },
    -1,
    'boids',
    {
      separationDistance: 30,
      alignmentDistance: 60,
      cohesionDistance: 60,
      separationWeight: 1.8,
      alignmentWeight: 1.2,
      cohesionWeight: 1.0
    },
    'boids-only'
  ));

  // Gentle drag to prevent runaway speeds
  system.forceFields.push(new ForceField(
    { x: 0, y: 0 },
    -1,
    'drag',
    { coefficient: 0.2 },
    'boids-only'
  ));
}
```

## Performance Patterns

### Limited Particle Pool
```typescript
const MAX_PARTICLES = 1000;

function safeAddEmitter(emitter) {
  // Check if adding emitter would exceed particle limit
  if (system.particles.length < MAX_PARTICLES) {
    system.emitters.push(emitter);
  }
}

// Or limit in update loop
function update(dt) {
  // Remove oldest particles if over limit
  while (system.particles.length > MAX_PARTICLES) {
    system.particles[0].age = system.particles[0].lifespan;
  }

  system.update(dt);
}
```

### Cleanup Completed Effects
```typescript
function update(dt) {
  system.update(dt);

  // Remove completed particle systems
  if (system.disposed) {
    // All particles and emitters are done
    // Safe to remove this system or reinitialize
    system.particles = [];
    system.emitters = [];
    system.attractors = [];
    system.forceFields = [];
    system.colliders = [];
    system.sinks = [];
  }
}
```

### Selective Force Application
```typescript
// Heavy particles unaffected by wind
const heavyParticle = new Particle(
  pos, vel, size, rot, life,
  style,
  {
    useForceFields: false,  // Ignore all force fields
    useAttractors: true     // But still affected by attractors
  }
);

// Light particles affected by wind
const lightParticle = new Particle(
  pos, vel, size, rot, life,
  style,
  {
    useForceFields: 'wind',  // Only affected by wind force field
    useAttractors: true
  }
);

system.forceFields.push(new ForceField(
  { x: 100, y: 0 },
  -1,
  null,
  null,
  'wind'  // ID for selective targeting
));
```
