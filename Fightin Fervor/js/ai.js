// =========================================================
// FIGHTIN' FERVOR — ai.js
// Reactive AI brain for Single Player mode.
//
// Architecture:
//   - `currentDir`       → -1 (left), 0 (stop), +1 (right), smooth movement
//   - `thinkTimer`       → how often the AI re-evaluates its strategy
//   - `attackCooldownMs` → minimum gap between AI attack attempts
//                          FIX: stops AI from instantly re-attacking after
//                          each recovery window, which felt like spam
//
// Call AI.init(difficulty) before each round.
// Call AI.tick(aiEnemy, humanPlayer) every animation frame.
// =========================================================

const AI = (() => {

  const PROFILES = {
    normal: {
      thinkMs:           600,   // how often to re-evaluate strategy
      attackRangePx:     160,
      retreatOnLowHP:    false,
      lowHPThreshold:    0.30,
      jumpChancePerSec:  0.2,
      aggressionFactor:  0.75,
      heavyAttackChance: 0.18,
      // BUG FIX: add minimum ms between attack attempts.
      // Previously AI called attack() every frame it was in range (attack()
      // returned early due to isAttacking/recovery, but the AI had no concept
      // of "waiting after an attack"). This makes AI feel human-paced.
      minAttackIntervalMs: 620,   // ~0.62s between attacks on normal
    },
    hard: {
      thinkMs:           220,
      attackRangePx:     200,
      retreatOnLowHP:    true,
      lowHPThreshold:    0.30,
      jumpChancePerSec:  0.6,
      aggressionFactor:  0.92,
      heavyAttackChance: 0.35,
      minAttackIntervalMs: 380,  // faster on hard but still has gaps
    },
  };

  let profile         = PROFILES.normal;
  let currentDir      = 0;
  let isRetreating    = false;
  let useHeavy        = false;
  let thinkTimer      = 0;
  let lastTime        = 0;
  // Track last time AI successfully fired an attack (not just attempted)
  let lastAttackTime  = 0;

  function init(difficulty = 'normal') {
    profile        = PROFILES[difficulty] || PROFILES.normal;
    currentDir     = 0;
    isRetreating   = false;
    useHeavy       = false;
    thinkTimer     = 0;
    lastAttackTime = 0;
    lastTime       = performance.now();
  }

  function tick(ai, human) {
    if (!ai || !human || ai.dead || !animating) return;

    const now = performance.now();
    const dt  = Math.min(now - lastTime, 100);
    lastTime  = now;

    thinkTimer -= dt;
    if (thinkTimer <= 0) {
      thinkTimer = profile.thinkMs * (0.7 + Math.random() * 0.6);
      _decideStrategy(ai, human, dt);
    }

    _applyDir(ai, human, now);
  }

  function _decideStrategy(ai, human, dt) {
    const dist        = Math.abs(human.position.x - ai.position.x);
    const aiIsOnRight = ai.position.x > human.position.x;
    const aiHPRatio   = ai.health / ai.maxHealth;

    if (profile.retreatOnLowHP && aiHPRatio < profile.lowHPThreshold) {
      isRetreating = true;
      currentDir   = aiIsOnRight ? 1 : -1;
      return;
    }
    isRetreating = false;

    const jumpP = 1 - Math.pow(1 - profile.jumpChancePerSec, profile.thinkMs / 1000);
    if (Math.random() < jumpP) {
      ai.jump();
    }

    if (dist <= profile.attackRangePx) {
      currentDir = 0;
      useHeavy   = Math.random() < (profile.heavyAttackChance || 0.25);
      return;
    }

    currentDir = Math.random() < profile.aggressionFactor
      ? (aiIsOnRight ? -1 : 1)
      : 0;
  }

  function _applyDir(ai, human, now) {
    const dist = Math.abs(human.position.x - ai.position.x);

    if (currentDir !== 0) {
      ai.velocity.x = currentDir * ai.speed;
      ai.switchSprite('run');
      ai.stopBlock && ai.stopBlock();

      if (isRetreating && dist <= profile.attackRangePx * 0.5 && !ai.isAttacking) {
        _tryAttack(ai, false, now);
      }
    } else {
      ai.velocity.x = 0;

      if (dist <= profile.attackRangePx && !ai.stunFrames && !ai.isStaggered) {
        ai.stopBlock && ai.stopBlock();
        _tryAttack(ai, useHeavy, now);
      } else if (!ai.isAttacking) {
        ai.switchSprite('idle');
      }
    }
  }

  // Wrapper that enforces the minimum attack interval.
  // This is the core AI spam fix — without this, the AI re-attacks
  // the instant its recovery frames expire (every ~400-500ms).
  // With this, it respects a human-feeling gap between swings.
  function _tryAttack(ai, heavy, now) {
    if (now - lastAttackTime < profile.minAttackIntervalMs) return;
    if (ai.isAttacking || ai.attackRecoveryFrames > 0) return;

    if (heavy && typeof ai.heavyAttack === 'function') {
      ai.heavyAttack();
      useHeavy = false;
    } else {
      ai.attack();
    }
    lastAttackTime = now;
  }

  return { init, tick };
})();
