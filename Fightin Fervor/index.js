// =========================================================
// FIGHTIN' FERVOR — index.js
// Flow: Main Menu → (Difficulty Select → Character Select) or
//                   (Character Select)  → Round Intro → Match
// =========================================================

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width  = 1024;
canvas.height = 576;
c.fillRect(0, 0, canvas.width, canvas.height);

const gravity = 0.7;

// ── Map / stage state (chosen in mapSelect.js) ──────────────
let chosenMapPath     = './images/background.png';
let chosenMapShowShop = true;
let chosenMapMusic    = './BackgroundMusic/OakForest.m4a';

const background = new Sprite({
  position: { x: 0, y: 0 },
  imagesrc: './images/background.png',
});

const shop = new Sprite({
  position: { x: 600, y: 128 },
  imagesrc: './images/shop.png',
  scale: 2.75,
  framesmax: 6,
});

// ── Input state ──────────────────────────────────────────────
// P1: A/D = move, W = jump, Space = light attack, F = heavy, S = block
// P2: ArrowLeft/Right = move, ArrowUp = jump, Enter = light, / = heavy, ArrowDown = block
const keys = {
  a:          { pressed: false },
  d:          { pressed: false },
  w:          { pressed: false },
  s:          { pressed: false },   // P1 block
  f:          { pressed: false },   // P1 heavy attack (tracked for display; actual held state)
  ArrowLeft:  { pressed: false },
  ArrowRight: { pressed: false },
  ArrowUp:    { pressed: false },
  ArrowDown:  { pressed: false },   // P2 block
  Enter:      { pressed: false },   // P2 light attack
  Slash:      { pressed: false },   // P2 heavy attack
};

// ── Live fighter references ──────────────────────────────────
let player = null;
let enemy  = null;

// ── Ghost health bar state ────────────────────────────────────
// Ghost bars trail behind the real bars; animated by GSAP with a delay.
let p1GhostPct = 100;
let p2GhostPct = 100;
let p1GhostTimer = null;
let p2GhostTimer = null;

// ── Combo display timers ─────────────────────────────────────
let p1ComboHideTimer = null;
let p2ComboHideTimer = null;

function updateComboDisplays() {
  if (!player || !enemy) return;
  // Read from displayCombo (persists 90 frames) NOT comboHitsReceived
  // (which resets to 0 immediately on launcher fire)
  _updateSideCombo('p1Combo', enemy.displayCombo,  'p1ComboHideTimer');
  _updateSideCombo('p2Combo', player.displayCombo, 'p2ComboHideTimer');
}

function _updateSideCombo(elId, hits, timerKey) {
  const el = document.getElementById(elId);
  if (!el) return;

  if (hits >= 2) {
    clearTimeout(window[timerKey]);
    const isLauncher = hits >= 4;
    el.textContent = isLauncher ? '🚀 LAUNCH!' : `${hits} HIT COMBO`;

    // Use classList to avoid wiping out position classes
    el.classList.remove('hit-2', 'hit-3', 'hit-launch', 'visible');
    void el.offsetWidth; // force reflow so animation re-triggers
    el.classList.add('visible', isLauncher ? 'hit-launch' : hits === 3 ? 'hit-3' : 'hit-2');

    window[timerKey] = setTimeout(() => {
      el.classList.remove('visible');
    }, isLauncher ? 1800 : 1200);
  }
}

function hideComboDisplays() {
  ['p1Combo', 'p2Combo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('visible');
  });
}

// ── Round / match tracking ───────────────────────────────────
let currentRound = 0;
let p1RoundWins  = 0;
let p2RoundWins  = 0;
const ROUNDS_TO_WIN = 2;

let chosenP1Key   = 'mack';
let chosenP2Key   = 'kenji';

// ── Single-player state ──────────────────────────────────────
let isSinglePlayer   = false;
let aiDifficulty     = 'normal';  // 'normal' | 'hard'

// ── Online multiplayer state ──────────────────────────────────
// isOnline   : true when playing over the network
// onlineRole : 'host' (controls P1/player) | 'guest' (controls P2/enemy)
let isOnline        = false;
let onlineRole      = null;   // 'host' | 'guest'
let onlineFrame     = 0;      // frame counter for input sequencing
let opponentKeys    = {};     // most-recent key state received from opponent
let opponentActions = {};     // one-shot actions received from opponent (buffered until next frame)
let localActions    = {};     // one-shot actions queued from OUR keydown (cleared each frame after send)

// ── Animation loop flag ──────────────────────────────────────
let animating = false;

// ── Pause state ───────────────────────────────────────────────
let isPaused = false;

// ── Debug draw flags (toggled from pause screen) ─────────────
// These are read by Fighter.draw() in classes.js via window.*
window.showHitboxes  = false;
window.showHurtboxes = false;

// ════════════════════════════════════════════════════════════
// GHOST HEALTH BAR HELPERS
// ════════════════════════════════════════════════════════════
function updateGhostHealth(which, newPct) {
  if (which === 'p1') {
    clearTimeout(p1GhostTimer);
    p1GhostTimer = setTimeout(() => {
      gsap.to('#playerGhostHealth', { width: newPct + '%', duration: 0.55, ease: 'power2.inOut' });
      p1GhostPct = newPct;
    }, 420);  // delay before ghost starts draining
  } else {
    clearTimeout(p2GhostTimer);
    p2GhostTimer = setTimeout(() => {
      gsap.to('#enemyGhostHealth', { width: newPct + '%', duration: 0.55, ease: 'power2.inOut' });
      p2GhostPct = newPct;
    }, 420);
  }
}

function resetGhostBars() {
  clearTimeout(p1GhostTimer);
  clearTimeout(p2GhostTimer);
  gsap.set('#playerGhostHealth', { width: '100%' });
  gsap.set('#enemyGhostHealth',  { width: '100%' });
  p1GhostPct = 100;
  p2GhostPct = 100;
}

// ════════════════════════════════════════════════════════════
// PAUSE / RESUME
// ════════════════════════════════════════════════════════════
const pauseOverlayEl = document.getElementById('pauseOverlay');

function pauseGame() {
  if (!animating || isPaused) return;
  isPaused  = true;
  animating = false;
  clearTimeout(timerID);          // freeze the countdown
  pauseOverlayEl.classList.add('visible');
}

function resumeGame() {
  if (!isPaused) return;
  isPaused  = false;
  animating = true;
  pauseOverlayEl.classList.remove('visible');
  decreaseTimer();                // restart countdown from current value
  requestAnimationFrame(animate); // restart the draw loop
}

// ── Checkbox wiring (done once at startup) ────────────────────
document.getElementById('showHitboxesCheck').addEventListener('change', (e) => {
  window.showHitboxes = e.target.checked;
});
document.getElementById('showHurtboxesCheck').addEventListener('change', (e) => {
  window.showHurtboxes = e.target.checked;
});

// ════════════════════════════════════════════════════════════
// ROUND INTRO  ("Round 1" → "FIGHT!")
// ════════════════════════════════════════════════════════════
function showRoundIntro(roundNumber, callback) {
  const introEl = document.getElementById('roundIntro');
  const textEl  = document.getElementById('roundIntroText');

  introEl.classList.add('visible');
  textEl.classList.remove('pop', 'fight-text');
  textEl.textContent = `ROUND ${roundNumber}`;

  requestAnimationFrame(() => requestAnimationFrame(() => textEl.classList.add('pop')));

  setTimeout(() => {
    textEl.classList.remove('pop', 'fight-text');
    textEl.textContent = 'FIGHT!';
    textEl.classList.add('fight-text');

    requestAnimationFrame(() => requestAnimationFrame(() => textEl.classList.add('pop')));

    setTimeout(() => {
      textEl.classList.remove('pop');
      setTimeout(() => {
        introEl.classList.remove('visible');
        if (callback) callback();
      }, 250);
    }, 900);
  }, 1400);
}

// ════════════════════════════════════════════════════════════
// HUD HELPERS
// ════════════════════════════════════════════════════════════
function refreshWinDots() {
  for (let i = 0; i < ROUNDS_TO_WIN; i++) {
    document.getElementById(`p1Dot${i}`).classList.toggle('earned', i < p1RoundWins);
    document.getElementById(`p2Dot${i}`).classList.toggle('earned', i < p2RoundWins);
  }
}

function hideAllResults() {
  ['displayTie','displayPlayer','displayEnemy','displayMatch'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
}

function showResult(id, text, color) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.style.color = color || 'white';
  el.style.display = 'flex';
}

// ════════════════════════════════════════════════════════════
// ROUND END
// ════════════════════════════════════════════════════════════
function handleRoundEnd() {
  if (!player || !enemy) return;

  animating = false;
  clearTimeout(timerID);

  const winner = getRoundWinner(player, enemy);

  if (winner === 1) {
    p1RoundWins++;
    const msg = isSinglePlayer
      ? `YOU WIN ROUND ${currentRound}!`
      : isOnline && onlineRole === 'host'
        ? `YOU WIN ROUND ${currentRound}!`
        : isOnline && onlineRole === 'guest'
          ? `OPPONENT WINS ROUND ${currentRound}!`
          : `PLAYER 1 WINS ROUND ${currentRound}!`;
    showResult('displayPlayer', msg, '#7c86ff');
  } else if (winner === 2) {
    p2RoundWins++;
    const msg = isSinglePlayer
      ? `AI WINS ROUND ${currentRound}!`
      : isOnline && onlineRole === 'guest'
        ? `YOU WIN ROUND ${currentRound}!`
        : isOnline && onlineRole === 'host'
          ? `OPPONENT WINS ROUND ${currentRound}!`
          : `PLAYER 2 WINS ROUND ${currentRound}!`;
    showResult('displayEnemy', msg, '#ff6b6b');
  } else {
    showResult('displayTie', `ROUND ${currentRound} — TIE!`, 'white');
  }

  refreshWinDots();

  setTimeout(() => {
    hideAllResults();

    if (p1RoundWins >= ROUNDS_TO_WIN) {
      endMatch(1);
    } else if (p2RoundWins >= ROUNDS_TO_WIN) {
      endMatch(2);
    } else if (currentRound >= 3) {
      if      (p1RoundWins > p2RoundWins) endMatch(1);
      else if (p2RoundWins > p1RoundWins) endMatch(2);
      else                                endMatch(0);
    } else {
      startRound(chosenP1Key, chosenP2Key);
    }
  }, 2000);
}

// ════════════════════════════════════════════════════════════
// MATCH END
// ════════════════════════════════════════════════════════════
function endMatch(winner) {
  animating = false;

  let msg, color;
  if (winner === 1) {
    if (isSinglePlayer)                              { msg = 'YOU WIN THE MATCH! 🏆'; }
    else if (isOnline && onlineRole === 'host')      { msg = 'YOU WIN THE MATCH! 🏆'; }
    else if (isOnline && onlineRole === 'guest')     { msg = 'OPPONENT WINS THE MATCH!'; }
    else                                             { msg = 'PLAYER 1 WINS THE MATCH!'; }
    color = '#7c86ff';
  } else if (winner === 2) {
    if (isSinglePlayer)                              { msg = 'AI WINS THE MATCH...'; }
    else if (isOnline && onlineRole === 'guest')     { msg = 'YOU WIN THE MATCH! 🏆'; }
    else if (isOnline && onlineRole === 'host')      { msg = 'OPPONENT WINS THE MATCH!'; }
    else                                             { msg = 'PLAYER 2 WINS THE MATCH!'; }
    color = '#ff6b6b';
  } else {
    msg   = 'DRAW — NO WINNER!';
    color = 'white';
  }

  showResult('displayMatch', msg, color);
  // Show hints after a brief moment
  setTimeout(() => {
    const el = document.getElementById('displayMatch');
    if (el) {
      el.innerHTML =
        `<span style="font-size:1em">${msg}</span>` +
        `<span style="font-size:0.45em;margin-top:10px;opacity:0.85">Press R to rematch</span>` +
        `<span style="font-size:0.38em;margin-top:6px;opacity:0.7">Press M for Main Menu</span>`;
    }
  }, 2000);
}

// ════════════════════════════════════════════════════════════
// START A SINGLE ROUND
// ════════════════════════════════════════════════════════════
function startRound(p1Key, p2Key) {
  currentRound++;
  hideAllResults();

  gsap.set('#playerHealth', { width: '100%' });
  gsap.set('#enemyHealth',  { width: '100%' });
  resetGhostBars();
  hideComboDisplays();

  // Remove low-HP class from bars
  document.getElementById('playerHealth')?.classList.remove('hp-danger');
  document.getElementById('enemyHealth')?.classList.remove('hp-danger');

  // Re-create background sprite from chosen map
  background.image     = new Image();
  background.image.src = chosenMapPath;
  background.position  = { x: 0, y: 0 };
  background.scale     = 1;
  background.framesmax = 1;
  background.framescurrent = 0;
  background.frameselapsed = 0;
  background.offset    = { x: 0, y: 0 };

  player = new Fighter(
    buildFighterConfig(p1Key, { x: 200, y: 0 }, { x: 0, y: 0 }, 'red')
  );
  player.playerLabel = 'P1';
  enemy = new Fighter(
    buildFighterConfig(p2Key, { x: 750, y: 0 }, { x: 0, y: 0 }, 'blue')
  );
  enemy.playerLabel = 'P2';

  Object.values(keys).forEach(k => k.pressed = false);

  // Re-init AI brain each round so it starts fresh
  if (isSinglePlayer) {
    AI.init(aiDifficulty);
  }

  showRoundIntro(currentRound, () => {
    animating = true;
    startTimer();
    requestAnimationFrame(animate);
  });
}

// ════════════════════════════════════════════════════════════
// START A FULL MATCH  (called by characterSelect.js)
// difficulty === null means 2-player mode
// ════════════════════════════════════════════════════════════
function startMatch(p1Key, p2Key, difficulty, mapPath, showShop, musicPath) {
  chosenP1Key       = p1Key;
  chosenP2Key       = p2Key;
  isSinglePlayer    = (difficulty !== null && difficulty !== undefined);
  aiDifficulty      = difficulty || 'normal';
  chosenMapPath     = mapPath    || './images/background.png';
  chosenMapShowShop = (showShop === undefined || showShop === null) ? true : !!showShop;
  chosenMapMusic    = musicPath  || (typeof BGM !== 'undefined' ? BGM.getMusicForMap(chosenMapPath) : './BackgroundMusic/OakForest.m4a');
  currentRound   = 0;
  p1RoundWins    = 0;
  p2RoundWins    = 0;

  if (typeof BGM !== 'undefined') {
    BGM.playStage(chosenMapMusic);
  }

  refreshWinDots();
  startRound(p1Key, p2Key);
}

// ════════════════════════════════════════════════════════════
// HIT PROCESSING  (shared between player→enemy and enemy→player)
// ════════════════════════════════════════════════════════════
function processHit(attacker, target, healthBarId, ghostWhich, isHeavy) {
  const dmg = attacker.damage * (isHeavy ? 1.5 : 1.0);
  const result = target.takehit(Math.round(dmg), attacker, isHeavy);

  // result=0 means target was invincible (wake-up frames) — do nothing
  if (result === 0) {
    attacker.isAttacking = false;
    return;
  }

  const wasBlocked = (result < 0);
  const actualDmg  = Math.abs(result);

  // Attacker hitstop — both freeze together (only if not a launcher, which sets its own)
  if (!target.inKnockdown) {
    attacker.hitstopFrames = isHeavy ? 10 : 6;
  } else {
    // Launcher: attacker gets longer hitstop for drama
    attacker.hitstopFrames = 14;
  }

  // ── Block pushback — shove BOTH fighters apart ────────────
  // This resets the neutral situation after a blocked attack,
  // preventing corner pressure and preventing block-chip infinite.
  if (wasBlocked) {
    const pushDir = attacker.position.x < target.position.x ? 1 : -1;
    attacker.knockbackX = -pushDir * 7;  // attacker pushed back more
    target.knockbackX   =  pushDir * 3;  // defender barely moves

    // ── Counter-attack window — attacker cannot act for ~12 frames ──
    // This gives the defender a brief punish opportunity after blocking.
    attacker.counterWindowFrames = 12;
  }

  // Visual + audio effects
  if (typeof FX !== 'undefined') {
    // Launcher = treat as heavy for effects
    const effectHeavy = isHeavy || target.inKnockdown;
    FX.onHit(attacker, target, actualDmg, effectHeavy, wasBlocked);
    // Launcher gets extra shake
    if (target.inKnockdown) FX.shake(16, 16);
  }

  attacker.isAttacking = false;

  // Health bar update — skip if blocked (no real HP change shown)
  const pct = (target.health / target.maxHealth) * 100;
  gsap.to(`#${healthBarId}`, { width: pct + '%', duration: 0.12 });
  updateGhostHealth(ghostWhich, pct);

  // Flash the health bar on hit
  const barEl = document.getElementById(healthBarId);
  if (barEl && !wasBlocked) {
    barEl.classList.add('hp-hit-flash');
    setTimeout(() => barEl.classList.remove('hp-hit-flash'), 180);
  }

  // Timer danger
  const timerEl = document.getElementById('timer');
  if (timer <= 10) timerEl?.classList.add('timer-danger');
}

// ════════════════════════════════════════════════════════════
// MAIN ANIMATION LOOP
// ════════════════════════════════════════════════════════════
function animate() {
  if (!animating) return;
  requestAnimationFrame(animate);

  c.fillStyle = 'black';
  c.fillRect(0, 0, canvas.width, canvas.height);
  background.update();
  if (chosenMapShowShop) shop.update();
  c.fillStyle = 'rgba(255,255,255,0.15)';
  c.fillRect(0, 0, canvas.width, canvas.height);

  // Visual effects drawn on top of background, below fighters
  if (typeof FX !== 'undefined') FX.update(c, player, enemy);

  // Update combo displays based on live fighter state
  updateComboDisplays();

  // Facing direction
  if (player.position.x < enemy.position.x) {
    player.facing = 'right';
    enemy.facing  = 'left';
  } else {
    player.facing = 'left';
    enemy.facing  = 'right';
  }

  player.update();
  enemy.update();

  // Reset CONTROL velocity — separate from knockbackX
  player.velocity.x = 0;
  enemy.velocity.x  = 0;

  // ── Determine local vs remote fighter references ───────────
  // In online mode:
  //   host  → controls player (P1), opponent drives enemy (P2)
  //   guest → controls enemy  (P2), opponent drives player (P1)
  const localFighter  = isOnline && onlineRole === 'guest' ? enemy  : player;
  const remoteFighter = isOnline && onlineRole === 'guest' ? player : enemy;

  // ── Local player movement ─────────────────────────────────
  // Key mappings:
  //   Online host  → same as local P1 (WASD + Space/F/S)
  //   Online guest → reuse P1 keys for their own fighter
  //   Local 2P     → same as before (WASD for P1, Arrows for P2)
  const lk = isOnline
    ? { left: keys.a, right: keys.d, block: keys.s }  // guest reuses P1 keys
    : (onlineRole === 'host' || !isOnline)
      ? { left: keys.a, right: keys.d, block: keys.s }
      : { left: keys.a, right: keys.d, block: keys.s };

  if (!localFighter.stunFrames && !localFighter.isStaggered) {
    if (keys.s.pressed && localFighter.isGrounded && !localFighter.isAttacking) {
      localFighter.startBlock();
    } else {
      localFighter.stopBlock();
      if (keys.a.pressed && localFighter.lastkey === 'a') {
        localFighter.velocity.x = -localFighter.speed;
        localFighter.switchSprite('run');
      } else if (keys.d.pressed && localFighter.lastkey === 'd') {
        localFighter.velocity.x = localFighter.speed;
        localFighter.switchSprite('run');
      } else {
        localFighter.switchSprite('idle');
      }
    }
  } else {
    localFighter.stopBlock();
  }
  if      (localFighter.velocity.y < 0 && !isMidTakehit(localFighter)) localFighter.switchSprite('jump');
  else if (localFighter.velocity.y > 0 && !isMidTakehit(localFighter)) localFighter.switchSprite('fall');

  // ── Send local inputs to server (online mode) ─────────────
  if (isOnline) {
    const keysSnapshot = {
      a: keys.a.pressed, d: keys.d.pressed, s: keys.s.pressed,
    };
    // Send OUR key state + any queued one-shot actions (jump/attack/heavy)
    ONLINE.sendInput(onlineFrame++, keysSnapshot, { ...localActions });
    localActions = {};  // clear after sending

    // Apply received opponent inputs to the remote fighter
    if (!remoteFighter.stunFrames && !remoteFighter.isStaggered) {
      if (opponentKeys.s && remoteFighter.isGrounded && !remoteFighter.isAttacking) {
        remoteFighter.startBlock();
      } else {
        remoteFighter.stopBlock();
        if (opponentKeys.a && remoteFighter.lastkey === 'a') {
          remoteFighter.velocity.x = -remoteFighter.speed;
          remoteFighter.switchSprite('run');
        } else if (opponentKeys.d && remoteFighter.lastkey === 'd') {
          remoteFighter.velocity.x = remoteFighter.speed;
          remoteFighter.switchSprite('run');
        } else {
          remoteFighter.switchSprite('idle');
        }
      }
    } else {
      remoteFighter.stopBlock();
    }

    // Apply one-shot actions buffered from opponent input events
    if (opponentActions.jump)       { remoteFighter.jump();        }
    if (opponentActions.attack)     { remoteFighter.attack();      }
    if (opponentActions.heavy)      { remoteFighter.heavyAttack(); }
    // Clear consumed one-shot actions
    opponentActions = {};

    if (remoteFighter.velocity.y < 0 && !isMidTakehit(remoteFighter)) remoteFighter.switchSprite('jump');
    else if (remoteFighter.velocity.y > 0 && !isMidTakehit(remoteFighter)) remoteFighter.switchSprite('fall');

  } else if (isSinglePlayer) {
    // ── AI movement ────────────────────────────────────────
    AI.tick(enemy, player);
    if (enemy.velocity.y < 0 && !isMidTakehit(enemy)) enemy.switchSprite('jump');
    else if (enemy.velocity.y > 0 && !isMidTakehit(enemy)) enemy.switchSprite('fall');

  } else {
    // ── Local 2P movement ─────────────────────────────────
    if (!enemy.stunFrames && !enemy.isStaggered) {
      if (keys.ArrowDown.pressed && enemy.isGrounded && !enemy.isAttacking) {
        enemy.startBlock();
      } else {
        enemy.stopBlock();
        if (keys.ArrowLeft.pressed && enemy.lastkey === 'ArrowLeft') {
          enemy.velocity.x = -enemy.speed;
          enemy.switchSprite('run');
        } else if (keys.ArrowRight.pressed && enemy.lastkey === 'ArrowRight') {
          enemy.velocity.x = enemy.speed;
          enemy.switchSprite('run');
        } else {
          enemy.switchSprite('idle');
        }
      }
    } else {
      enemy.stopBlock();
    }
    if (enemy.velocity.y < 0 && !isMidTakehit(enemy)) enemy.switchSprite('jump');
    else if (enemy.velocity.y > 0 && !isMidTakehit(enemy)) enemy.switchSprite('fall');
  }

  // ── Collision: priority system — prevents trading ────────────────────
  // If both fighters land on the same impact frame, only the one who
  // started their attack FIRST (earlier attackStartTime) connects.
  // The later attacker’s hit is suppressed for this frame.
  const p1WouldHit = player.isAttacking &&
    player.framescurrent === player.attackImpactFrame &&
    rectangularCollision({ rectangle1: player, rectangle2: enemy });
  const p2WouldHit = enemy.isAttacking &&
    enemy.framescurrent === enemy.attackImpactFrame &&
    rectangularCollision({ rectangle1: enemy, rectangle2: player });

  if (p1WouldHit && p2WouldHit) {
    // Simultaneous hit — earlier attacker wins
    if (player.attackStartTime <= enemy.attackStartTime) {
      processHit(player, enemy, 'enemyHealth', 'p2', player.isHeavyAttacking);
    } else {
      processHit(enemy, player, 'playerHealth', 'p1', enemy.isHeavyAttacking);
    }
  } else {
    if (p1WouldHit) processHit(player, enemy, 'enemyHealth', 'p2', player.isHeavyAttacking);
    if (p2WouldHit) processHit(enemy, player, 'playerHealth', 'p1', enemy.isHeavyAttacking);
  }

  // Clear impact-frame flag after processing (whether hit landed or not)
  if (player.isAttacking && player.framescurrent === player.attackImpactFrame) {
    player.isAttacking = false;
  }
  if (enemy.isAttacking && enemy.framescurrent === enemy.attackImpactFrame) {
    enemy.isAttacking = false;
  }

  // ── Round end check — wait for death animation before result ──
  if ((enemy.health <= 0 || player.health <= 0) && animating) {
    animating = false;
    clearTimeout(timerID);
    waitForDeathThenEnd();
  }
} // end animate()

// ════════════════════════════════════════════════════════════
// HELPERS FOR animate()
// ════════════════════════════════════════════════════════════

// Returns true while a fighter is mid-takehit animation (not on last frame).
// Used to prevent the jump/fall sprite override that causes the ninja lady
// "backflip" visual bug when she gets launched during a takehit.
function isMidTakehit(fighter) {
  return fighter.sprites &&
    fighter.image === fighter.sprites.takehit.image &&
    fighter.framescurrent < fighter.sprites.takehit.framesmax - 1;
}

// ════════════════════════════════════════════════════════════
// DEATH → VICTORY → RESULT  (3-phase sequence)
// ════════════════════════════════════════════════════════════

// Phase 1: Wait for all death animations to finish.
// Once done, call phase 2 (victory) unless it's a tie.
function waitForDeathThenEnd() {
  const p1Dead = player && player.health <= 0;
  const p2Dead = enemy  && enemy.health  <= 0;

  const dying   = [];
  if (p1Dead) dying.push(player);
  if (p2Dead) dying.push(enemy);
  const allDone = dying.length > 0 && dying.every(f => f.dead);

  if (!allDone) {
    // Keep drawing while death animation plays out
    _drawFrame();
    requestAnimationFrame(waitForDeathThenEnd);
  } else {
    // Small pause after death, then start victory phase
    setTimeout(startVictoryPhase, 300);
  }
}

// Phase 2: Trigger victory animation on the winning fighter (if any).
// Then wait for that animation to finish before showing the result.
function startVictoryPhase() {
  const p1Dead = player && player.health <= 0;
  const p2Dead = enemy  && enemy.health  <= 0;

  // Determine winner (same logic as handleRoundEnd, but without modifying wins yet)
  let winnerFighter = null;
  if (!p1Dead && p2Dead)  winnerFighter = player;  // P1 wins
  else if (p1Dead && !p2Dead) winnerFighter = enemy;   // P2 wins
  else if (player && enemy) {
    if (player.health > enemy.health) winnerFighter = player;
    else if (enemy.health > player.health) winnerFighter = enemy;
  }
  // tie: no winner, skip victory animation

  if (winnerFighter && winnerFighter.sprites && winnerFighter.sprites.victory) {
    winnerFighter.forceVictory();
    waitForVictoryThenResult();
  } else {
    // No winner or no victory sprite — go straight to result
    setTimeout(handleRoundEnd, 200);
  }
}

// Phase 3: Keep rendering until the winner's victory animation completes.
function waitForVictoryThenResult() {
  const p1Dead = player && player.health <= 0;
  const p2Dead = enemy  && enemy.health  <= 0;

  const winnerFighter = (!p1Dead && p2Dead) ? player :
                        (p1Dead && !p2Dead) ? enemy  :
                        (player && enemy && player.health > enemy.health) ? player :
                        (player && enemy && enemy.health > player.health) ? enemy : null;

  const victoryDone = !winnerFighter || winnerFighter.victoryDone;

  if (!victoryDone) {
    _drawFrame();
    requestAnimationFrame(waitForVictoryThenResult);
  } else {
    // Victory animation finished — brief pause then show result
    setTimeout(handleRoundEnd, 400);
  }
}

// Shared canvas render for the post-fight waiting phases
function _drawFrame() {
  c.fillStyle = 'black';
  c.fillRect(0, 0, canvas.width, canvas.height);
  background.update();
  if (chosenMapShowShop) shop.update();
  c.fillStyle = 'rgba(255,255,255,0.15)';
  c.fillRect(0, 0, canvas.width, canvas.height);
  if (typeof FX !== 'undefined') FX.update(c, player, enemy);
  player.update();
  enemy.update();
}

// ════════════════════════════════════════════════════════════
// KEYBOARD INPUT
// P1: WASD move, W jump, Space light, F heavy, S block
// P2: Arrows move, ArrowUp jump, Enter light, / heavy, ArrowDown block
// ════════════════════════════════════════════════════════════
window.addEventListener('keydown', (event) => {
  if (event.repeat) return;

  // ── P = Pause / Resume ────────────────────────────────────
  if (event.key === 'p' || event.key === 'P') {
    // Only active during a live match (player & enemy exist)
    if (player && enemy) {
      if (isPaused) resumeGame();
      else if (animating) pauseGame();
    }
    return;
  }

  // Rematch from match-over screen
  if (event.key === 'r' || event.key === 'R') {
    const matchEl = document.getElementById('displayMatch');
    if (matchEl.style.display === 'flex') {
      hideAllResults();
      if (isOnline) {
        ONLINE.sendRematch();
        // Wait for opponent's rematch echo (handled in onRematch listener)
      } else if (isSinglePlayer) {
        if (typeof BGM !== 'undefined') BGM.playMenu();
        showDifficultySelect();
      } else {
        if (typeof BGM !== 'undefined') BGM.playMenu();
        CS.show();
      }
      return;
    }
  }

  // Main menu from match-over screen
  if (event.key === 'm' || event.key === 'M') {
    const matchEl = document.getElementById('displayMatch');
    if (matchEl && matchEl.style.display === 'flex') {
      hideAllResults();
      isOnline   = false;
      onlineRole = null;
      isSinglePlayer = false;
      document.getElementById('onlineHudBadge').style.display = 'none';
      mainMenu.style.display = 'flex';
      if (typeof BGM !== 'undefined') BGM.playMenu();
      return;
    }
  }

  if (!player || !enemy || !animating) return;

  // In online mode, each player only controls their own fighter.
  // Guest uses WASD/Space/F/S keys mapped to the enemy fighter.
  const localFighter = isOnline && onlineRole === 'guest' ? enemy : player;

  // ── Local fighter control ──────────────────────────────
  if (!localFighter.dead) {
    switch (event.key) {
      case 'd': keys.d.pressed = true; localFighter.lastkey = 'd'; break;
      case 'a': keys.a.pressed = true; localFighter.lastkey = 'a'; break;
      case 'w':
        localFighter.jump();
        if (isOnline) localActions.jump = true;
        break;
      case 's': keys.s.pressed = true; break;
      case ' ':
        localFighter.attack();
        if (isOnline) localActions.attack = true;
        break;
      case 'f': case 'F':
        localFighter.heavyAttack();
        if (isOnline) localActions.heavy = true;
        break;
    }
  }

  // ── Player 2 (local 2P only) ───────────────────────────
  if (!isOnline && !isSinglePlayer && !enemy.dead) {
    switch (event.key) {
      case 'ArrowRight': keys.ArrowRight.pressed = true; enemy.lastkey = 'ArrowRight'; break;
      case 'ArrowLeft':  keys.ArrowLeft.pressed  = true; enemy.lastkey = 'ArrowLeft';  break;
      case 'ArrowUp':    enemy.jump(); break;
      case 'ArrowDown':  keys.ArrowDown.pressed = true; break;
      case 'Enter':      enemy.attack(); break;
      case '/':          enemy.heavyAttack(); break;
    }
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'd': keys.d.pressed = false; break;
    case 'a': keys.a.pressed = false; break;
    case 's': keys.s.pressed = false; player?.stopBlock(); break;
    case 'ArrowRight': keys.ArrowRight.pressed = false; break;
    case 'ArrowLeft':  keys.ArrowLeft.pressed  = false; break;
    case 'ArrowDown':  keys.ArrowDown.pressed  = false; enemy?.stopBlock(); break;
  }
});

// ════════════════════════════════════════════════════════════
// DIFFICULTY SELECT SCREEN
// ════════════════════════════════════════════════════════════
function showDifficultySelect() {
    if (typeof BGM !== 'undefined') BGM.playMenu();
    document.getElementById('difficultySelect').style.display = 'flex';
}

function hideDifficultySelect() {
  document.getElementById('difficultySelect').style.display = 'none';
}

document.getElementById('diffNormalBtn').addEventListener('click', () => {
  hideDifficultySelect();
  CS.showSinglePlayer('normal');
});

document.getElementById('diffHardBtn').addEventListener('click', () => {
  hideDifficultySelect();
  CS.showSinglePlayer('hard');
});

// ════════════════════════════════════════════════════════════
// MAIN MENU BUTTONS + KEYBOARD NAV
// ════════════════════════════════════════════════════════════
const mainMenu       = document.getElementById('mainMenu');
const localPlayerBtn = document.getElementById('localPlayerButton');
const singlePlayerBtn= document.getElementById('singlePlayerButton');
const onlineBtn      = document.getElementById('onlineButton');

// ── Text menu-item cursor navigation ───────────────────────
const MENU_ACTIONS = ['2p', '1p', 'online'];
let menuCursor = 0;

function updateMenuCursor() {
  document.querySelectorAll('.menu-item').forEach((el, i) => {
    el.classList.toggle('menu-item-active', i === menuCursor);
    el.textContent = (i === menuCursor ? '▶ ' : '    ') + [
      'LOCAL 2 PLAYER',
      'SINGLEPLAYER (VS AI)',
      'MULTIPLAYER'
    ][i];
  });
}

function triggerMenuAction(action) {
  mainMenu.style.display = 'none';
  if      (action === '2p')     CS.show();
  else if (action === '1p')     showDifficultySelect();
  else if (action === 'online') showOnlineMenu();
}

// Click wiring for text menu items
document.querySelectorAll('.menu-item').forEach((el, i) => {
  el.addEventListener('click', () => {
    menuCursor = i;
    updateMenuCursor();
    triggerMenuAction(MENU_ACTIONS[i]);
  });
});

// Keyboard navigation — active only when main menu is visible
function onMainMenuKey(e) {
  if (mainMenu.style.display === 'none') return;
  switch (e.key) {
    case 'ArrowUp':   case 'w': case 'W':
      e.preventDefault();
      menuCursor = (menuCursor - 1 + MENU_ACTIONS.length) % MENU_ACTIONS.length;
      updateMenuCursor();
      break;
    case 'ArrowDown': case 's': case 'S':
      e.preventDefault();
      menuCursor = (menuCursor + 1) % MENU_ACTIONS.length;
      updateMenuCursor();
      break;
    case 'Enter': case ' ':
      e.preventDefault();
      triggerMenuAction(MENU_ACTIONS[menuCursor]);
      break;
  }
}
window.addEventListener('keydown', onMainMenuKey);

// Init cursor display on load
updateMenuCursor();

// Legacy hidden button wiring (used by existing event references)
singlePlayerBtn.addEventListener('click', () => {
  mainMenu.style.display = 'none';
  showDifficultySelect();
});

localPlayerBtn.addEventListener('click', () => {
  mainMenu.style.display = 'none';
  CS.show();
});

// ════════════════════════════════════════════════════════════
// ONLINE LOBBY UI
// ════════════════════════════════════════════════════════════
const onlineMenu      = document.getElementById('onlineMenu');
const onlineLobbyStep = document.getElementById('onlineLobbyStep');
const onlineWaitStep  = document.getElementById('onlineWaitStep');
const onlineStatus    = document.getElementById('onlineStatus');
const roomCodeInput   = document.getElementById('roomCodeInput');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const onlineWaitTitle = document.getElementById('onlineWaitTitle');
const onlineHudBadge  = document.getElementById('onlineHudBadge');

function setOnlineStatus(msg, type) {
  onlineStatus.textContent = msg;
  onlineStatus.className = 'online-status' + (type ? ' status-' + type : '');
}

function showOnlineMenu() {
  onlineMenu.classList.add('visible');
  onlineLobbyStep.style.display = '';
  onlineWaitStep.style.display  = 'none';
  setOnlineStatus('');
  roomCodeInput.value = '';
}

function hideOnlineMenu() {
  onlineMenu.classList.remove('visible');
}

function showOnlineWaiting(title, code) {
  onlineLobbyStep.style.display = 'none';
  onlineWaitStep.style.display  = '';
  onlineWaitTitle.textContent   = title;
  roomCodeDisplay.textContent   = code || '';
  document.getElementById('onlineWaitMsg').textContent = code
    ? 'Share this code with your opponent'
    : 'Connecting to room…';
}

// Register ONLINE event listeners (set up once)
function setupOnlineListeners() {
  // ── Connection error ─ show in status field ────────────────
  ONLINE.onConnectError((msg) => {
    // If we're still on the lobby step, show the error there
    if (onlineLobbyStep.style.display !== 'none') {
      setOnlineStatus(msg, 'error');
    } else {
      // If we're on the waiting step, go back and show error
      onlineWaitStep.style.display  = 'none';
      onlineLobbyStep.style.display = '';
      setOnlineStatus(msg, 'error');
    }
  });

  ONLINE.onRoomJoined(({ role, roomCode }) => {
    onlineRole = role;
    if (role === 'host') {
      showOnlineWaiting('🥊 ROOM CREATED — YOU ARE HOST', roomCode);
    } else {
      showOnlineWaiting('✔ JOINED ROOM', roomCode);
      document.getElementById('onlineWaitMsg').textContent = 'Waiting for host to start…';
    }
  });

  ONLINE.onRoomNotFound(() => {
    setOnlineStatus('Room not found. Check the code and try again.', 'error');
  });

  ONLINE.onRoomFull(() => {
    setOnlineStatus('Room is full — game already in progress.', 'error');
  });

  ONLINE.onOpponentReady(() => {
    // Both players connected — go to character select
    hideOnlineMenu();
    isOnline = true;
    CS.showOnline(onlineRole);
  });

  ONLINE.onCharSelected(({ p1Key, p2Key }) => {
    // Guest receives char selection from host
    hideOnlineMenu();
    CS.startOnlineMatch(p1Key, p2Key);
  });

  ONLINE.onOpponentInput(({ frame, keys: oppKeys, actions: oppActions }) => {
    // Buffer the opponent's input state for next animate() tick
    opponentKeys = oppKeys || {};
    // Merge one-shot actions (don't overwrite — OR them together)
    if (oppActions) {
      if (oppActions.jump)   opponentActions.jump   = true;
      if (oppActions.attack) opponentActions.attack  = true;
      if (oppActions.heavy)  opponentActions.heavy   = true;
    }
    // Also update lastkey for movement
    if (oppKeys && oppKeys.a) {
      const rf = onlineRole === 'guest' ? player : enemy;
      if (rf) rf.lastkey = 'a';
    }
    if (oppKeys && oppKeys.d) {
      const rf = onlineRole === 'guest' ? player : enemy;
      if (rf) rf.lastkey = 'd';
    }
  });

  ONLINE.onRematch(() => {
    hideAllResults();
    document.getElementById('disconnectOverlay').classList.remove('visible');
    // Reset and start a new match with the same characters
    startOnlineMatch(chosenP1Key, chosenP2Key);
  });

  ONLINE.onOpponentDisconnected(() => {
    animating = false;
    document.getElementById('disconnectOverlay').classList.add('visible');
  });
}


// Wire up Create Room button
document.getElementById('createRoomBtn').addEventListener('click', () => {
  setOnlineStatus('Creating room…');
  setupOnlineListeners();
  ONLINE.createRoom();
});

// Wire up Join Room button
document.getElementById('joinRoomBtn').addEventListener('click', () => {
  const code = roomCodeInput.value.trim().toUpperCase();
  if (code.length !== 4) {
    setOnlineStatus('Enter a 4-letter room code.', 'error');
    return;
  }
  setOnlineStatus('Joining room…');
  setupOnlineListeners();
  ONLINE.joinRoom(code);
});

// Room code input — allow Enter key to join
roomCodeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('joinRoomBtn').click();
});

// Force uppercase as user types
roomCodeInput.addEventListener('input', () => {
  roomCodeInput.value = roomCodeInput.value.toUpperCase();
});

// Back buttons
document.getElementById('onlineBackBtn').addEventListener('click', () => {
  ONLINE.disconnect();
  hideOnlineMenu();
  mainMenu.style.display = 'flex';
  if (typeof BGM !== 'undefined') BGM.playMenu();
});

document.getElementById('onlineWaitBackBtn').addEventListener('click', () => {
  ONLINE.disconnect();
  hideOnlineMenu();
  mainMenu.style.display = 'flex';
  if (typeof BGM !== 'undefined') BGM.playMenu();
});

// Disconnect overlay OK button
document.getElementById('disconnectOkBtn').addEventListener('click', () => {
  document.getElementById('disconnectOverlay').classList.remove('visible');
  isOnline   = false;
  onlineRole = null;
  ONLINE.disconnect();
  hideAllResults();
  mainMenu.style.display = 'flex';
  if (typeof BGM !== 'undefined') BGM.playMenu();
});

// Trigger online menu from main menu
onlineBtn.addEventListener('click', () => {
  mainMenu.style.display = 'none';
  showOnlineMenu();
});

// ════════════════════════════════════════════════════════════
// START ONLINE MATCH  (called after both chars are known)
// ════════════════════════════════════════════════════════════
function startOnlineMatch(p1Key, p2Key) {
  chosenP1Key    = p1Key;
  chosenP2Key    = p2Key;
  isSinglePlayer = false;
  isOnline       = true;
  chosenMapMusic = typeof BGM !== 'undefined' ? BGM.getMusicForMap(chosenMapPath) : './BackgroundMusic/OakForest.m4a';
  currentRound   = 0;
  p1RoundWins    = 0;
  p2RoundWins    = 0;
  onlineFrame    = 0;
  opponentKeys    = {};
  opponentActions = {};
  localActions    = {};

  if (typeof BGM !== 'undefined') {
    BGM.playStage(chosenMapMusic);
  }

  // Show online role in HUD badge
  onlineHudBadge.style.display = 'block';
  onlineHudBadge.textContent   = `🌐 ONLINE · ${onlineRole.toUpperCase()}`;

  // Update HUD controls hint
  const p1ctrl = document.querySelector('.p1-controls');
  const p2ctrl = document.querySelector('.p2-controls');
  if (onlineRole === 'host') {
    if (p1ctrl) p1ctrl.textContent = 'YOU (HOST) — SPACE=Light  F=Heavy  S=Block';
    if (p2ctrl) p2ctrl.textContent = 'OPPONENT';
  } else {
    if (p1ctrl) p1ctrl.textContent = 'OPPONENT';
    if (p2ctrl) p2ctrl.textContent = 'YOU (GUEST) — SPACE=Light  F=Heavy  S=Block';
  }

  refreshWinDots();
  startRound(p1Key, p2Key);
}
// Expose globally so characterSelect.js can call it
window.startOnlineMatch = startOnlineMatch;

// Music toggle UI and shortcut wiring
const bgmBtn = document.getElementById('bgmToggleBtn');
if (bgmBtn) {
  bgmBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof BGM !== 'undefined') BGM.toggleMute();
  });
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'p' || e.key === 'P') {
    if (typeof BGM !== 'undefined') BGM.toggleMute();
  }
});

