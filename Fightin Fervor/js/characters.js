// =========================================================
// CHARACTER REGISTRY
// One entry per playable character: sprite sheets, frame counts,
// attack box, and balance stats all live here in one place.
//
// This will also be what Character Select reads from later —
// building it as a lookup table now means Character Select just
// needs to pick two keys from this object, nothing more.
//
// NOTE ON scale/offset: these are starting-point estimates based on
// each sheet's frame size. Sprite alignment (does the character's feet
// line up with the ground, is it centered) is something you tune by
// eye once you see it running — that's completely normal, not a sign
// something's broken. Nudge the numbers, refresh, repeat.
//
// attackCooldownMs : time after a light attack finishes before the
//                    fighter can attack again (ms). Faster characters
//                    = smaller value; heavier characters = larger.
// heavyCooldownMs  : same concept for heavy attacks (always 2× light).
// =========================================================

const CHARACTERS = {
  mack: {
    displayName: "Mack",
    portraitFile: "Character.png",
    avatarFile: "avatar.png",
    basePath: "./images/samuraiMack/",
    // Scaled up from 2.5 → 3 to match the rest of the cast.
    // renderOffset.y recalculated: imgH≈22px → 122*3 - 150 ≈ 217 (feet on ground).
    // renderOffset.x scaled proportionally: 215 * (3/2.5) = 258.
    scale: 3,
    renderOffset: { x: 258, y: 217 },
    attackBox: { offset: { x: 100, y: 50 }, width: 157, height: 50 },
    // Idle sheet: 1600x200, 8 frames → frameW=200, drawnW=200*3=600
    // Body center = pos.x - 258 + 600*0.5 = pos.x + 42
    // hurtboxOffset.x = 42 - 35 = +7  (center 70px box on body)
    hurtboxOffset: { x: 7, y: 10 },
    hurtboxWidth: 70,
    speed: 6,
    damage: 12,
    maxHealth: 150,
    attackCooldownMs: 310,
    heavyCooldownMs:  620,
    animations: {
      idle:    { file: "Idle.png",                        framesmax: 8 },
      run:     { file: "Run.png",                         framesmax: 8 },
      jump:    { file: "Jump.png",                        framesmax: 2 },
      fall:    { file: "Fall.png",                        framesmax: 2 },
      attack1: { file: "Attack1.png",                     framesmax: 6 },
      takehit: { file: "Take Hit - white silhouette.png", framesmax: 4 },
      death:   { file: "Death.png",                       framesmax: 6 },
      // victory.png: 1800x200, 9 frames (frameW=200, drawnW=600)
      // Matches standard 200px frame width; perfectly aligned with Idle.
      // frameshold=13 → 9 frames * 13 ticks = 117 ticks (~2.0 seconds)
      victory: { file: "victory.png",                     framesmax: 9, frameshold: 13 },
    },
  },

  // Kenji removed from playable roster (not yet polished enough).

  ninjaLady: {
    displayName: "Ninja Lady",
    portraitFile: "Character.png",
    avatarFile: "avatar.png",
    basePath: "./images/ninjaLady/",
    scale: 3,
    renderOffset: { x: 192, y: 230 },
    attackBox: { offset: { x: 90, y: 40 }, width: 90, height: 40 },
    // Idle sheet: 1152x128, 9 frames → frameW=128, drawnW=128*3=384
    // renderOffset.x=192 = drawnW/2 exactly → body center IS at pos.x
    // hurtboxOffset.x = 0 - 35 = -35  (center 70px box on body)
    hurtboxOffset: { x: -35, y: 10 },
    hurtboxWidth: 70,
    speed: 9,
    damage: 8,
    maxHealth: 140,
    attackCooldownMs: 180,
    heavyCooldownMs:  360,
    animations: {
      idle:    { file: "Idle.png",      framesmax: 9  },
      run:     { file: "Run.png",       framesmax: 8  },
      jump:    { file: "Jump.png",      framesmax: 10 },
      // no dedicated fall sheet → engine falls back to 'jump' automatically
      attack1: { file: "Attack_1.png",  framesmax: 6  },
      attack2: { file: "Attack_2.png",  framesmax: 8  },
      takehit: { file: "Hurt.png",      framesmax: 2  },
      death:   { file: "Dead.png",      framesmax: 5  },
      // victory.png: 1152x128, 9 frames (frameW=128, drawnW=384)
      // Matches standard 128px frame width; perfectly aligned with Idle.
      // frameshold=13 → 9 frames * 13 ticks = 117 ticks (~2.0 seconds)
      victory: { file: "victory.png",   framesmax: 9, frameshold: 13 },
    },
  },

  // Knight removed from playable roster (not yet polished enough).

  shinobi: {
    displayName: "Shinobi",
    portraitFile: "Character.png",
    avatarFile: "avatar.png",
    basePath: "./images/shinobi/",
    scale: 3,
    renderOffset: { x: 192, y: 230 },
    attackBox: { offset: { x: 95, y: 40 }, width: 110, height: 50 },
    // Idle sheet: 768x128, 6 frames → frameW=128, drawnW=128*3=384
    // renderOffset.x=192 = drawnW/2 → body center at pos.x
    hurtboxOffset: { x: -35, y: 10 },
    hurtboxWidth: 70,
    speed: 5,
    damage: 12,
    maxHealth: 140,
    attackCooldownMs: 380,
    heavyCooldownMs:  760,
    animations: {
      idle:    { file: "Idle.png",     framesmax: 6  },
      run:     { file: "Run.png",      framesmax: 8  },
      jump:    { file: "Jump.png",     framesmax: 12 },
      attack1: { file: "Attack_1.png", framesmax: 6  },
      attack2: { file: "Attack_2.png", framesmax: 4  },
      attack3: { file: "Attack_3.png", framesmax: 3  },
      takehit: { file: "Hurt.png",     framesmax: 2  },
      death:   { file: "Dead.png",     framesmax: 3  },
      // victory.png: 768x128, 6 frames (frameW=128, drawnW=384)
      // Matches standard 128px frame width; perfectly aligned with Idle.
      // frameshold=20 → 6 frames * 20 ticks = 120 ticks (exactly 2.0 seconds)
      victory: { file: "victory.png",  framesmax: 6, frameshold: 20 },
    },
  },

  shogun: {
    displayName: "Shogun",
    portraitFile: "Character.png",
    avatarFile: "avatar.png",
    basePath: "./images/shogun/",
    scale: 3,
    renderOffset: { x: 192, y: 230 },
    attackBox: { offset: { x: 95, y: 35 }, width: 120, height: 55 },
    // Idle sheet: 640x128, 5 frames → frameW=128, drawnW=128*3=384
    // renderOffset.x=192 = drawnW/2 → body center at pos.x
    hurtboxOffset: { x: -35, y: 10 },
    hurtboxWidth: 70,
    speed: 4,
    damage: 13,
    maxHealth: 150,
    attackCooldownMs: 450,
    heavyCooldownMs:  900,
    animations: {
      idle:    { file: "Idle.png",     framesmax: 5 },
      run:     { file: "Run.png",      framesmax: 8 },
      jump:    { file: "Jump.png",     framesmax: 7 },
      attack1: { file: "Attack_1.png", framesmax: 4 },
      attack2: { file: "Attack_2.png", framesmax: 5 },
      attack3: { file: "Attack_3.png", framesmax: 4 },
      takehit: { file: "Hurt.png",     framesmax: 2 },
      death:   { file: "Dead.png",     framesmax: 6 },
      // victory.png: 900x128, 7 frames (frameW=128.57, drawnW=385.7)
      // Character center ~82px (vs 55px idle) → offsetX override 273 (192 + 81)
      // frameshold=17 → 7 frames * 17 ticks = 119 ticks (~2.0 seconds)
      victory: { file: "victory.png",  framesmax: 7, offsetX: 273, frameshold: 17 },
    },
  },

  vampire: {
    displayName: "Vampire",
    portraitFile: "Character.png",
    avatarFile: "avatar.png",
    basePath: "./images/vampire/",
    scale: 2.5,
    renderOffset: { x: 136, y: 168 },
    attackBox: { offset: { x: 95, y: 40 }, width: 115, height: 50 },
    // Idle sheet: 640x128, 5 frames → frameW=128, drawnW=128*2.5=320
    // Body center = pos.x - 136 + 320*0.5 = pos.x + 24
    // hurtboxOffset.x = 24 - 35 = -11 ≈ -10
    hurtboxOffset: { x: -10, y: 10 },
    hurtboxWidth: 70,
    speed: 7,
    damage: 9,
    maxHealth: 160,
    attackCooldownMs: 260,
    heavyCooldownMs:  520,
    animations: {
      idle:    { file: "Idle.png",     framesmax: 5 },
      run:     { file: "Run.png",      framesmax: 8 },
      jump:    { file: "Jump.png",     framesmax: 7 },
      attack1: { file: "Attack_1.png", framesmax: 5 },
      attack2: { file: "Attack_2.png", framesmax: 3 },
      attack3: { file: "Attack_3.png", framesmax: 4 },
      takehit: { file: "Hurt.png",     framesmax: 1 },
      death:   { file: "Dead.png",     framesmax: 8 },
      // victory.png: 900x128, 7 frames (frameW=128.57, drawnW=321.4)
      // Character center ~84px (vs 54.5px idle) → offsetX override 210 (136 + 74)
      // frameshold=17 → 7 frames * 17 ticks = 119 ticks (~2.0 seconds)
      victory: { file: "victory.png",  framesmax: 7, offsetX: 210, frameshold: 17 },
    },
  },

  zombie: {
    displayName: "Zombie",
    portraitFile: "Character.png",
    avatarFile: "avatar.png",
    basePath: "./images/wildZombie/",
    scale: 4,
    renderOffset: { x: 192, y: 230 },
    attackBox: { offset: { x: 70, y: 40 }, width: 80, height: 40 },
    // Idle sheet: 864x96, 9 frames → frameW=96, drawnW=96*4=384
    // renderOffset.x=192 = drawnW/2 → body center at pos.x
    hurtboxOffset: { x: -35, y: 10 },
    hurtboxWidth: 70,
    speed: 8,
    damage: 6,
    maxHealth: 140,
    attackCooldownMs: 210,
    heavyCooldownMs:  420,
    animations: {
      idle:    { file: "Idle.png",     framesmax: 9 },
      run:     { file: "Run.png",      framesmax: 8 },
      jump:    { file: "Jump.png",     framesmax: 6 },
      attack1: { file: "Attack_1.png", framesmax: 4 },
      attack2: { file: "Attack_2.png", framesmax: 4 },
      attack3: { file: "Attack_3.png", framesmax: 4 },
      takehit: { file: "Hurt.png",     framesmax: 5 },
      death:   { file: "Dead.png",     framesmax: 5 },
      // victory.png: 1056x96, 11 frames (frameW=96, drawnW=384)
      // frameshold=11 → 11 frames * 11 ticks = 121 ticks (~2.0 seconds)
      victory: { file: "victory.png",  framesmax: 11, frameshold: 11 },
    },
  },

  drunk: {
    displayName: "Homeless Guy",
    portraitFile: "Character.png",
    avatarFile: "avatar.png",
    basePath: "./images/homeless/",
    scale: 3,
    renderOffset: { x: 192, y: 230 },
    attackBox: { offset: { x: 70, y: 40 }, width: 85, height: 45 },
    // Idle sheet: 1408x128, 11 frames → frameW=128, drawnW=128*3=384
    // renderOffset.x=192 = drawnW/2 → body center at pos.x
    hurtboxOffset: { x: -35, y: 10 },
    hurtboxWidth: 70,
    speed: 5,
    damage: 9,
    maxHealth: 165,
    attackCooldownMs: 360,
    heavyCooldownMs:  720,
    animations: {
      idle:    { file: "Idle.png",     framesmax: 11 },
      run:     { file: "Run.png",      framesmax: 8  },
      jump:    { file: "Jump.png",     framesmax: 16 },
      attack1: { file: "Attack_1.png", framesmax: 5  },
      attack2: { file: "Attack_2.png", framesmax: 3  },
      takehit: { file: "Hurt.png",     framesmax: 3  },
      death:   { file: "Dead.png",     framesmax: 4  },
      // victory.png: 1664x128, 13 frames (frameW=128, drawnW=384)
      // frameshold=9 → 13 frames * 9 ticks = 117 ticks (~2.0 seconds)
      victory: { file: "victory.png",  framesmax: 13, frameshold: 9 },
    },
  },
};

// Builds a full Fighter() constructor argument object for a given
// character key, at a given starting position/velocity/color.
function buildFighterConfig(key, position, velocity, color) {
  const data = CHARACTERS[key];
  if (!data) {
    throw new Error(`Unknown character key: "${key}"`);
  }

  const sprites = {};
  for (const animName in data.animations) {
    const anim = data.animations[animName];
    sprites[animName] = {
      imagesrc:   data.basePath + anim.file,
      framesmax:  anim.framesmax,
      offsetX:    anim.offsetX,    // optional per-animation horizontal offset override
      frameshold: anim.frameshold, // optional per-animation speed override
    };
  }

  return {
    position,
    velocity,
    color,
    imagesrc: data.basePath + data.animations.idle.file,
    framesmax: data.animations.idle.framesmax,
    scale: data.scale,
    offset: data.renderOffset,
    sprites,
    attackBox: data.attackBox,
    speed: data.speed,
    damage: data.damage,
    maxHealth: data.maxHealth,
    attackCooldownMs: data.attackCooldownMs,
    heavyCooldownMs:  data.heavyCooldownMs,
    hurtboxOffset:    data.hurtboxOffset || { x: 0, y: 0 },
    hurtboxWidth:     data.hurtboxWidth  || 50,
  };
}
