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
// P1: A/D = move, W = jump, E = light attack, F = heavy, S = block
// P2: J/L = move, I = jump, U = light attack, H = heavy, K = block
const keys = {
  // P1 keys
  a:          { pressed: false },
  d:          { pressed: false },
  w:          { pressed: false },
  s:          { pressed: false },   // P1 block
  e:          { pressed: false },   // P1 light attack
  f:          { pressed: false },   // P1 heavy attack

  // P2 keys
  j:          { pressed: false },   // P2 move left
  l:          { pressed: false },   // P2 move right
  i:          { pressed: false },   // P2 jump
  k:          { pressed: false },   // P2 block
  u:          { pressed: false },   // P2 light attack
  h:          { pressed: false },   // P2 heavy attack

  // Fallback aliases (legacy arrow keys support)
  ArrowLeft:  { pressed: false },
  ArrowRight: { pressed: false },
  ArrowUp:    { pressed: false },
  ArrowDown:  { pressed: false },
  Enter:      { pressed: false },
  Slash:      { pressed: false },
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
let onlinePendingHit = null;  // pending hit event to broadcast from host
let lastOnlineTick   = 0;     // rate limiter for 60fps in online mode

// ── Animation loop flag ──────────────────────────────────────
let animating = false;
let inDeathOrVictoryPhase = false; // true while death or victory animation plays out
let roundEndHandled       = false; // guards against double round end execution

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
  const imgEl   = document.getElementById('roundIntroImg');
  const textEl  = document.getElementById('roundIntroText');

  // Play Announcer voice for Round 1, Round 2, Round 3
  if (typeof Announcer !== 'undefined') {
    Announcer.playRound(roundNumber);
  }

  // Determine round image based on round number
  let roundImgSrc = './TextEffects/Round-1.png';
  if (roundNumber === 2) roundImgSrc = './TextEffects/Round-2.png';
  else if (roundNumber >= 3) roundImgSrc = './TextEffects/Round-3.png';

  if (imgEl) {
    imgEl.src = roundImgSrc;
    imgEl.className = 'round-intro-img';
  }
  introEl.classList.add('visible');

  // Smooth entrance for Round X
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (imgEl) imgEl.classList.add('pop');
    });
  });

  // After Round display, transition to FIGHT!
  setTimeout(() => {
    if (imgEl) imgEl.classList.add('fade-out');

    setTimeout(() => {
      if (imgEl) {
        imgEl.className = 'round-intro-img';
        imgEl.src = './TextEffects/FIGHT.png';
      }

      if (typeof SFX !== 'undefined' && SFX.whoosh) {
        SFX.whoosh(true);
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (imgEl) imgEl.classList.add('fight-pop');
        });
      });

      // Fade out FIGHT and begin combat
      setTimeout(() => {
        if (imgEl) imgEl.classList.add('fade-out');
        setTimeout(() => {
          introEl.classList.remove('visible');
          if (imgEl) imgEl.className = 'round-intro-img';
          if (callback) callback();
        }, 220);
      }, 950);

    }, 200);

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
  if (roundEndHandled) return;
  roundEndHandled = true;

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

  if (isOnline && onlineRole === 'host') {
    ONLINE.sendStateSync({
      roundEndEvent: {
        winner,
        p1RoundWins,
        p2RoundWins,
        currentRound
      }
    });
  }

  if (isOnline && onlineRole === 'guest') {
    // Guest displays result banner; round/match progression is authoritatively sent by Host
    return;
  }

  setTimeout(() => {
    hideAllResults();

    if (p1RoundWins >= ROUNDS_TO_WIN) {
      if (isOnline && onlineRole === 'host') {
        ONLINE.sendStateSync({ matchEndEvent: { winner: 1 } });
      }
      endMatch(1);
    } else if (p2RoundWins >= ROUNDS_TO_WIN) {
      if (isOnline && onlineRole === 'host') {
        ONLINE.sendStateSync({ matchEndEvent: { winner: 2 } });
      }
      endMatch(2);
    } else if (currentRound >= 3) {
      let mWinner = 0;
      if      (p1RoundWins > p2RoundWins) mWinner = 1;
      else if (p2RoundWins > p1RoundWins) mWinner = 2;
      if (isOnline && onlineRole === 'host') {
        ONLINE.sendStateSync({ matchEndEvent: { winner: mWinner } });
      }
      endMatch(mWinner);
    } else {
      if (isOnline && onlineRole === 'host') {
        ONLINE.sendStateSync({
          startRoundEvent: {
            p1Key: chosenP1Key,
            p2Key: chosenP2Key,
            currentRound: currentRound + 1
          }
        });
      }
      startRound(chosenP1Key, chosenP2Key);
    }
  }, 2000);
}

// ════════════════════════════════════════════════════════════
// MATCH END
// ════════════════════════════════════════════════════════════
function endMatch(winner) {
  animating = false;

  // Play Announcer voice for match victory / defeat
  if (typeof Announcer !== 'undefined') {
    Announcer.playMatchEnd(winner, isSinglePlayer, isOnline, onlineRole);
  }

  // Determine winner image and fallback info
  let winnerImgSrc = null;
  let msg = '';
  let color = 'white';

  if (winner === 1) {
    if (!isSinglePlayer && !isOnline) {
      // 2 Player Local: Player 1 wins
      winnerImgSrc = './TextEffects/Player-1-Wins.png';
      msg = 'PLAYER 1 WINS THE MATCH!';
      color = '#7c86ff';
    } else if (isSinglePlayer) {
      // Singleplayer: Human player (P1) wins
      winnerImgSrc = './TextEffects/YOU-WON.png';
      msg = 'YOU WIN THE MATCH! 🏆';
      color = '#7c86ff';
    } else if (isOnline && onlineRole === 'host') {
      // Online Host (P1) wins
      winnerImgSrc = './TextEffects/YOU-WON.png';
      msg = 'YOU WIN THE MATCH! 🏆';
      color = '#7c86ff';
    } else if (isOnline && onlineRole === 'guest') {
      // Online Guest (P2) loses
      winnerImgSrc = './TextEffects/YOU-LOSE.png';
      msg = 'OPPONENT WINS THE MATCH!';
      color = '#ff6b6b';
    }
  } else if (winner === 2) {
    if (!isSinglePlayer && !isOnline) {
      // 2 Player Local: Player 2 wins
      winnerImgSrc = './TextEffects/Player-2.png';
      msg = 'PLAYER 2 WINS THE MATCH!';
      color = '#ff6b6b';
    } else if (isSinglePlayer) {
      // Singleplayer: AI wins -> human player loses
      winnerImgSrc = './TextEffects/YOU-LOSE.png';
      msg = 'AI WINS THE MATCH...';
      color = '#ff6b6b';
    } else if (isOnline && onlineRole === 'guest') {
      // Online Guest (P2) wins
      winnerImgSrc = './TextEffects/YOU-WON.png';
      msg = 'YOU WIN THE MATCH! 🏆';
      color = '#7c86ff';
    } else if (isOnline && onlineRole === 'host') {
      // Online Host (P1) loses
      winnerImgSrc = './TextEffects/YOU-LOSE.png';
      msg = 'OPPONENT WINS THE MATCH!';
      color = '#ff6b6b';
    }
  } else {
    // Draw / Tie
    msg   = 'DRAW — NO WINNER!';
    color = 'white';
  }

  const matchEl  = document.getElementById('displayMatch');
  const imgEl    = document.getElementById('matchWinnerImg');
  const textEl   = document.getElementById('matchWinnerText');
  const hintsEl  = document.getElementById('matchHints');

  matchEl.style.display = 'flex';
  if (hintsEl) hintsEl.classList.remove('visible');

  if (winnerImgSrc && imgEl) {
    imgEl.src = winnerImgSrc;
    imgEl.style.display = 'block';
    imgEl.className = 'match-winner-img';
    if (textEl) textEl.style.display = 'none';

    // Smooth pop entrance
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        imgEl.classList.add('pop');
      });
    });
  } else {
    if (imgEl) imgEl.style.display = 'none';
    if (textEl) {
      textEl.textContent = msg;
      textEl.style.color = color;
      textEl.style.display = 'block';
    }
  }

  // Smooth appearance of rematch / menu hints after a brief moment
  setTimeout(() => {
    if (hintsEl) hintsEl.classList.add('visible');
  }, 1200);
}

// ════════════════════════════════════════════════════════════
// START A SINGLE ROUND
// ════════════════════════════════════════════════════════════
function startRound(p1Key, p2Key) {
  currentRound++;
  inDeathOrVictoryPhase = false;
  roundEndHandled       = false;
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
    if (!isOnline || onlineRole === 'host') {
      startTimer();
    }
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
  currentRound          = 0;
  p1RoundWins           = 0;
  p2RoundWins           = 0;
  inDeathOrVictoryPhase = false;
  roundEndHandled       = false;

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

  if (isOnline) {
    onlinePendingHit = {
      attacker: attacker === player ? 'p1' : 'p2',
      target:   target === player   ? 'p1' : 'p2',
      dmg: actualDmg,
      isHeavy: isHeavy,
      wasBlocked: wasBlocked,
      inKnockdown: !!target.inKnockdown,
      targetHealth: target.health,
      attackerHealth: attacker.health,
      hitstopFrames: isHeavy ? 10 : 6,
    };
  }

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

// ── Host State Sync Broadcast ────────────────────────────────
function sendHostStateSnapshot() {
  if (!isOnline || onlineRole !== 'host' || !player || !enemy) return;
  ONLINE.sendStateSync({
    frame: onlineFrame++,
    timer: timer,
    p1: {
      x: Math.round(player.position.x),
      y: Math.round(player.position.y),
      vx: Math.round(player.velocity.x),
      vy: Math.round(player.velocity.y),
      h: player.health,
      f: player.facing,
      b: player.isBlocking,
      att: player.isAttacking,
      hvy: player.isHeavyAttacking,
      anim: getFighterSprite(player),
      fr: player.framescurrent,
      dead: player.dead,
      dying: player.isDying,
      vic: player.isVictory
    },
    p2: {
      x: Math.round(enemy.position.x),
      y: Math.round(enemy.position.y),
      vx: Math.round(enemy.velocity.x),
      vy: Math.round(enemy.velocity.y),
      h: enemy.health,
      f: enemy.facing,
      b: enemy.isBlocking,
      att: enemy.isAttacking,
      hvy: enemy.isHeavyAttacking,
      anim: getFighterSprite(enemy),
      fr: enemy.framescurrent,
      dead: enemy.dead,
      dying: enemy.isDying,
      vic: enemy.isVictory
    },
    hit: onlinePendingHit
  });
  onlinePendingHit = null;
}

// ── Shared Transition into Death & Victory Sequence ───────────
function triggerDeathAndVictorySequence() {
  if (inDeathOrVictoryPhase) return;
  inDeathOrVictoryPhase = true;
  animating = false;
  clearTimeout(timerID);

  Object.values(keys).forEach(k => k.pressed = false);
  localActions    = {};
  opponentActions = {};

  if (player) {
    player.isAttacking      = false;
    player.isHeavyAttacking = false;
    if (player.health <= 0 && !player.isDying && !player.dead) {
      player.forceDeath();
    }
  }
  if (enemy) {
    enemy.isAttacking      = false;
    enemy.isHeavyAttacking = false;
    if (enemy.health <= 0 && !enemy.isDying && !enemy.dead) {
      enemy.forceDeath();
    }
  }

  waitForDeathThenEnd();
}

// ════════════════════════════════════════════════════════════
// MAIN ANIMATION LOOP
// ════════════════════════════════════════════════════════════
function animate() {
  if (!animating) return;
  requestAnimationFrame(animate);

  // Rate limiter for online mode to prevent high-refresh monitor desync
  if (isOnline) {
    const now = performance.now();
    if (now - lastOnlineTick < 14) return;
    lastOnlineTick = now;
  }

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
  const localFighter  = isOnline && onlineRole === 'guest' ? enemy  : player;
  const remoteFighter = isOnline && onlineRole === 'guest' ? player : enemy;

  // ── Local player movement ─────────────────────────────────
  if (!localFighter.stunFrames && !localFighter.isStaggered && !localFighter.dead && !localFighter.isDying && !localFighter.isVictory && !inDeathOrVictoryPhase) {
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

  if (isOnline) {
    if (onlineRole === 'host') {
      // ── Host authority: apply guest inputs to enemy ─────────────
      if (!enemy.stunFrames && !enemy.isStaggered && !enemy.dead && !enemy.isDying && !enemy.isVictory && !inDeathOrVictoryPhase) {
        if (opponentKeys.s && enemy.isGrounded && !enemy.isAttacking) {
          enemy.startBlock();
        } else {
          enemy.stopBlock();
          if (opponentKeys.a && opponentKeys.lastkey === 'a') {
            enemy.velocity.x = -enemy.speed;
            enemy.switchSprite('run');
          } else if (opponentKeys.d && opponentKeys.lastkey === 'd') {
            enemy.velocity.x = enemy.speed;
            enemy.switchSprite('run');
          } else {
            enemy.switchSprite('idle');
          }
        }
      } else {
        enemy.stopBlock();
      }

      if (!inDeathOrVictoryPhase && !enemy.dead && !enemy.isDying && !enemy.isVictory && enemy.health > 0 && player.health > 0) {
        if (opponentActions.jump)   enemy.jump();
        if (opponentActions.attack) enemy.attack();
        if (opponentActions.heavy)  enemy.heavyAttack();
      }
      opponentActions = {};

      if (enemy.velocity.y < 0 && !isMidTakehit(enemy)) enemy.switchSprite('jump');
      else if (enemy.velocity.y > 0 && !isMidTakehit(enemy)) enemy.switchSprite('fall');

      // ── Host collision detection ────────────────────────────────
      const p1WouldHit = player.isAttacking &&
        player.framescurrent === player.attackImpactFrame &&
        rectangularCollision({ rectangle1: player, rectangle2: enemy });
      const p2WouldHit = enemy.isAttacking &&
        enemy.framescurrent === enemy.attackImpactFrame &&
        rectangularCollision({ rectangle1: enemy, rectangle2: player });

      if (p1WouldHit && p2WouldHit) {
        if (player.attackStartTime <= enemy.attackStartTime) {
          processHit(player, enemy, 'enemyHealth', 'p2', player.isHeavyAttacking);
        } else {
          processHit(enemy, player, 'playerHealth', 'p1', enemy.isHeavyAttacking);
        }
      } else {
        if (p1WouldHit) processHit(player, enemy, 'enemyHealth', 'p2', player.isHeavyAttacking);
        if (p2WouldHit) processHit(enemy, player, 'playerHealth', 'p1', enemy.isHeavyAttacking);
      }

      if (player.isAttacking && player.framescurrent === player.attackImpactFrame) {
        player.isAttacking = false;
      }
      if (enemy.isAttacking && enemy.framescurrent === enemy.attackImpactFrame) {
        enemy.isAttacking = false;
      }

      // Broadcast authoritative state to guest
      sendHostStateSnapshot();

      // Host round end check
      if ((enemy.health <= 0 || player.health <= 0) && animating) {
        triggerDeathAndVictorySequence();
      }

    } else {
      // ── Guest role: send local inputs to host ──────────────────
      const canAct = !inDeathOrVictoryPhase &&
                     enemy.health > 0 && player.health > 0 &&
                     !enemy.isVictory && !player.isVictory &&
                     !enemy.isDying && !player.isDying &&
                     !enemy.dead && !player.dead;
      if (!canAct) {
        localActions = {};
      }
      ONLINE.sendGuestInput({
        keys: {
          a: canAct ? keys.a.pressed : false,
          d: canAct ? keys.d.pressed : false,
          s: canAct ? keys.s.pressed : false,
          lastkey: enemy.lastkey
        },
        actions: { ...localActions }
      });
      localActions = {};

      if (enemy.isAttacking && enemy.framescurrent === enemy.attackImpactFrame) {
        enemy.isAttacking = false;
      }
      if (player.isAttacking && player.framescurrent === player.attackImpactFrame) {
        player.isAttacking = false;
      }

      // Guest round end check
      if ((enemy.health <= 0 || player.health <= 0) && animating) {
        triggerDeathAndVictorySequence();
      }
    }

  } else if (isSinglePlayer) {
    // ── AI movement ────────────────────────────────────────
    AI.tick(enemy, player);
    if (enemy.velocity.y < 0 && !isMidTakehit(enemy)) enemy.switchSprite('jump');
    else if (enemy.velocity.y > 0 && !isMidTakehit(enemy)) enemy.switchSprite('fall');

    // ── Collision: priority system ─────────────────────────
    const p1WouldHit = player.isAttacking &&
      player.framescurrent === player.attackImpactFrame &&
      rectangularCollision({ rectangle1: player, rectangle2: enemy });
    const p2WouldHit = enemy.isAttacking &&
      enemy.framescurrent === enemy.attackImpactFrame &&
      rectangularCollision({ rectangle1: enemy, rectangle2: player });

    if (p1WouldHit && p2WouldHit) {
      if (player.attackStartTime <= enemy.attackStartTime) {
        processHit(player, enemy, 'enemyHealth', 'p2', player.isHeavyAttacking);
      } else {
        processHit(enemy, player, 'playerHealth', 'p1', enemy.isHeavyAttacking);
      }
    } else {
      if (p1WouldHit) processHit(player, enemy, 'enemyHealth', 'p2', player.isHeavyAttacking);
      if (p2WouldHit) processHit(enemy, player, 'playerHealth', 'p1', enemy.isHeavyAttacking);
    }

    if (player.isAttacking && player.framescurrent === player.attackImpactFrame) {
      player.isAttacking = false;
    }
    if (enemy.isAttacking && enemy.framescurrent === enemy.attackImpactFrame) {
      enemy.isAttacking = false;
    }

    if ((enemy.health <= 0 || player.health <= 0) && animating) {
      animating = false;
      clearTimeout(timerID);
      waitForDeathThenEnd();
    }

  } else {
    // ── Local 2P movement ─────────────────────────────────
    if (!enemy.stunFrames && !enemy.isStaggered) {
      if ((keys.k.pressed || keys.ArrowDown.pressed) && enemy.isGrounded && !enemy.isAttacking) {
        enemy.startBlock();
      } else {
        enemy.stopBlock();
        if ((keys.j.pressed || keys.ArrowLeft.pressed) && (enemy.lastkey === 'j' || enemy.lastkey === 'ArrowLeft')) {
          enemy.velocity.x = -enemy.speed;
          enemy.switchSprite('run');
        } else if ((keys.l.pressed || keys.ArrowRight.pressed) && (enemy.lastkey === 'l' || enemy.lastkey === 'ArrowRight')) {
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

    // ── Collision: priority system ─────────────────────────
    const p1WouldHit = player.isAttacking &&
      player.framescurrent === player.attackImpactFrame &&
      rectangularCollision({ rectangle1: player, rectangle2: enemy });
    const p2WouldHit = enemy.isAttacking &&
      enemy.framescurrent === enemy.attackImpactFrame &&
      rectangularCollision({ rectangle1: enemy, rectangle2: player });

    if (p1WouldHit && p2WouldHit) {
      if (player.attackStartTime <= enemy.attackStartTime) {
        processHit(player, enemy, 'enemyHealth', 'p2', player.isHeavyAttacking);
      } else {
        processHit(enemy, player, 'playerHealth', 'p1', enemy.isHeavyAttacking);
      }
    } else {
      if (p1WouldHit) processHit(player, enemy, 'enemyHealth', 'p2', player.isHeavyAttacking);
      if (p2WouldHit) processHit(enemy, player, 'playerHealth', 'p1', enemy.isHeavyAttacking);
    }

    if (player.isAttacking && player.framescurrent === player.attackImpactFrame) {
      player.isAttacking = false;
    }
    if (enemy.isAttacking && enemy.framescurrent === enemy.attackImpactFrame) {
      enemy.isAttacking = false;
    }

    if ((enemy.health <= 0 || player.health <= 0) && animating) {
      animating = false;
      clearTimeout(timerID);
      waitForDeathThenEnd();
    }
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

function getFighterSprite(fighter) {
  if (!fighter || !fighter.sprites) return 'idle';
  for (const name in fighter.sprites) {
    if (fighter.sprites[name] && fighter.image === fighter.sprites[name].image) {
      return name;
    }
  }
  return 'idle';
}

function applyRemoteHit(hit) {
  if (!hit) return;
  const attacker = hit.attacker === 'p1' ? player : enemy;
  const target   = hit.target === 'p1'   ? player : enemy;
  if (!attacker || !target) return;

  if (typeof FX !== 'undefined') {
    const effectHeavy = hit.isHeavy || hit.inKnockdown;
    FX.onHit(attacker, target, hit.dmg, effectHeavy, hit.wasBlocked);
    if (hit.inKnockdown) FX.shake(16, 16);
  }

  attacker.hitstopFrames = hit.hitstopFrames || (hit.isHeavy ? 10 : 6);

  if (hit.target === 'p1') {
    player.health = hit.targetHealth;
    const pct = (player.health / player.maxHealth) * 100;
    gsap.to('#playerHealth', { width: pct + '%', duration: 0.12 });
    updateGhostHealth('p1', pct);
    const barEl = document.getElementById('playerHealth');
    if (barEl && !hit.wasBlocked) {
      barEl.classList.add('hp-hit-flash');
      setTimeout(() => barEl.classList.remove('hp-hit-flash'), 180);
    }
  } else {
    enemy.health = hit.targetHealth;
    const pct = (enemy.health / enemy.maxHealth) * 100;
    gsap.to('#enemyHealth', { width: pct + '%', duration: 0.12 });
    updateGhostHealth('p2', pct);
    const barEl = document.getElementById('enemyHealth');
    if (barEl && !hit.wasBlocked) {
      barEl.classList.add('hp-hit-flash');
      setTimeout(() => barEl.classList.remove('hp-hit-flash'), 180);
    }
  }
}

function handleGuestStateSync(state) {
  if (!state) return;

  if (state.roundEndEvent) {
    const ev = state.roundEndEvent;
    p1RoundWins     = ev.p1RoundWins;
    p2RoundWins     = ev.p2RoundWins;
    currentRound    = ev.currentRound;
    animating       = false;
    clearTimeout(timerID);
    roundEndHandled = true;
    if (ev.winner === 1) {
      showResult('displayPlayer', `OPPONENT WINS ROUND ${currentRound}!`, '#7c86ff');
    } else if (ev.winner === 2) {
      showResult('displayEnemy', `YOU WIN ROUND ${currentRound}!`, '#ff6b6b');
    } else {
      showResult('displayTie', `ROUND ${currentRound} — TIE!`, 'white');
    }
    refreshWinDots();
    return;
  }

  if (state.startRoundEvent) {
    hideAllResults();
    startRound(state.startRoundEvent.p1Key, state.startRoundEvent.p2Key);
    return;
  }

  if (state.matchEndEvent) {
    hideAllResults();
    endMatch(state.matchEndEvent.winner);
    return;
  }

  if (!player || !enemy) return;

  // 1. Host (player) sync
  if (state.p1) {
    const p1 = state.p1;
    const dx = p1.x - player.position.x;
    if (Math.abs(dx) > 35) {
      player.position.x = p1.x;
    } else {
      player.position.x += dx * 0.45;
    }
    player.position.y = p1.y;
    player.velocity.x = p1.vx;
    player.velocity.y = p1.vy;
    player.facing     = p1.f;
    player.health     = p1.h;

    if (p1.vic) {
      if (!player.isVictory) player.forceVictory();
      if (typeof p1.fr === 'number') player.framescurrent = p1.fr;
    } else if (p1.dying) {
      if (!player.isDying && !player.dead) player.forceDeath();
      if (typeof p1.fr === 'number') player.framescurrent = p1.fr;
    } else if (p1.anim && getFighterSprite(player) !== p1.anim && !player.isVictory && !player.isDying && !player.dead) {
      player.switchSprite(p1.anim);
      if (typeof p1.fr === 'number') player.framescurrent = p1.fr;
    }
    if (p1.dead) {
      player.dead    = true;
      player.isDying = false;
    }
  }

  // 2. Guest local fighter (enemy) sync
  if (state.p2) {
    const p2 = state.p2;
    const dx = p2.x - enemy.position.x;
    if (Math.abs(dx) > 40) {
      enemy.position.x = p2.x;
    } else if (Math.abs(dx) > 6) {
      enemy.position.x += dx * 0.2;
    }
    if (p2.dying || enemy.inKnockdown) {
      enemy.position.y = p2.y;
    }
    enemy.health = p2.h;

    if (p2.vic) {
      if (!enemy.isVictory) enemy.forceVictory();
      if (typeof p2.fr === 'number') enemy.framescurrent = p2.fr;
    } else if (p2.dying) {
      if (!enemy.isDying && !enemy.dead) enemy.forceDeath();
      if (typeof p2.fr === 'number') enemy.framescurrent = p2.fr;
    } else if (p2.anim && getFighterSprite(enemy) !== p2.anim && !enemy.isVictory && !enemy.isDying && !enemy.dead) {
      enemy.switchSprite(p2.anim);
      if (typeof p2.fr === 'number') enemy.framescurrent = p2.fr;
    }
    if (p2.dead) {
      enemy.dead    = true;
      enemy.isDying = false;
    }
  }

  // 3. Health bars update
  const p1Pct = (player.health / player.maxHealth) * 100;
  const p2Pct = (enemy.health  / enemy.maxHealth)  * 100;
  gsap.set('#playerHealth', { width: p1Pct + '%' });
  gsap.set('#enemyHealth',  { width: p2Pct + '%' });

  // 4. Timer sync
  const timerEl = document.querySelector('#timer');
  if (timerEl && typeof state.timer === 'number') {
    timer = state.timer;
    timerEl.innerHTML = state.timer;
    if (state.timer <= 10) timerEl.classList.add('timer-danger');
    else timerEl.classList.remove('timer-danger');
  }

  // 5. Hit processing on guest
  if (state.hit) {
    applyRemoteHit(state.hit);
  }

  // 6. Transition to death & victory sequence on Guest if not already active
  const roundEnded = (player.health <= 0 || enemy.health <= 0) ||
                     (state.p1 && (state.p1.dying || state.p1.dead || state.p1.vic)) ||
                     (state.p2 && (state.p2.dying || state.p2.dead || state.p2.vic));
  if (roundEnded && !inDeathOrVictoryPhase) {
    triggerDeathAndVictorySequence();
  }
}

function setRematchStatusText(requested) {
  let el = document.getElementById('onlineRematchHint');
  if (!el) {
    el = document.createElement('div');
    el.id = 'onlineRematchHint';
    el.style.cssText = 'color: #ffd700; font-weight: bold; margin-top: 8px; font-size: 15px; text-shadow: 0 0 8px rgba(255,215,0,0.6);';
    document.getElementById('matchHints')?.appendChild(el);
  }
  if (requested) {
    el.textContent = '✔ REMATCH REQUESTED (WAITING FOR OPPONENT...)';
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
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

  if (isOnline && onlineRole === 'host') {
    const now = performance.now();
    if (now - lastOnlineTick >= 14) {
      lastOnlineTick = now;
      sendHostStateSnapshot();
    }
  }
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
    // Disable pause during online multiplayer to prevent desync
    if (isOnline) return;

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
    if (matchEl && matchEl.style.display === 'flex') {
      if (isOnline) {
        ONLINE.sendRematch();
        setRematchStatusText(true);
        return;
      }
      if (typeof Announcer !== 'undefined') Announcer.stop();
      hideAllResults();
      if (isSinglePlayer) {
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
      if (typeof Announcer !== 'undefined') Announcer.stop();
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

  if (!player || !enemy || !animating || inDeathOrVictoryPhase) return;
  if (player.health <= 0 || enemy.health <= 0 || player.dead || player.isDying || player.isVictory || enemy.dead || enemy.isDying || enemy.isVictory) return;

  // In online mode, each player only controls their own fighter.
  // Guest uses WASD/Space/F/S keys mapped to the enemy fighter.
  const localFighter = isOnline && onlineRole === 'guest' ? enemy : player;

  // ── Local fighter control ──────────────────────────────
  if (!localFighter.dead && !localFighter.isDying && !localFighter.isVictory) {
    switch (event.key) {
      case 'd': case 'D': keys.d.pressed = true; localFighter.lastkey = 'd'; break;
      case 'a': case 'A': keys.a.pressed = true; localFighter.lastkey = 'a'; break;
      case 'w': case 'W':
        localFighter.jump();
        if (isOnline) localActions.jump = true;
        break;
      case 's': case 'S': keys.s.pressed = true; break;
      case 'e': case 'E':
      case ' ': // legacy alias
        localFighter.attack();
        if (isOnline) localActions.attack = true;
        break;
      case 'f': case 'F':
        localFighter.heavyAttack();
        if (isOnline) localActions.heavy = true;
        break;
    }
  }

  // ── Player 2 (local 2P only: IJKLUH) ─────────────────────
  if (!isOnline && !isSinglePlayer && !enemy.dead && !enemy.isDying && !enemy.isVictory) {
    switch (event.key) {
      case 'l': case 'L':
      case 'ArrowRight':
        keys.l.pressed = true;
        keys.ArrowRight.pressed = true;
        enemy.lastkey = 'l';
        break;
      case 'j': case 'J':
      case 'ArrowLeft':
        keys.j.pressed = true;
        keys.ArrowLeft.pressed = true;
        enemy.lastkey = 'j';
        break;
      case 'i': case 'I':
      case 'ArrowUp':
        enemy.jump();
        break;
      case 'k': case 'K':
      case 'ArrowDown':
        keys.k.pressed = true;
        keys.ArrowDown.pressed = true;
        break;
      case 'u': case 'U':
      case 'Enter':
        enemy.attack();
        break;
      case 'h': case 'H':
      case '/':
        enemy.heavyAttack();
        break;
    }
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    // P1
    case 'd': case 'D': keys.d.pressed = false; break;
    case 'a': case 'A': keys.a.pressed = false; break;
    case 's': case 'S':
      keys.s.pressed = false;
      if (isOnline && onlineRole === 'guest') {
        enemy?.stopBlock();
      } else {
        player?.stopBlock();
      }
      break;

    // P2
    case 'l': case 'L':
    case 'ArrowRight':
      keys.l.pressed = false;
      keys.ArrowRight.pressed = false;
      break;
    case 'j': case 'J':
    case 'ArrowLeft':
      keys.j.pressed = false;
      keys.ArrowLeft.pressed = false;
      break;
    case 'k': case 'K':
    case 'ArrowDown':
      keys.k.pressed = false;
      keys.ArrowDown.pressed = false;
      enemy?.stopBlock();
      break;
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
const MENU_ACTIONS = ['2p', '1p', 'online', 'tutorial'];
let menuCursor = 0;

function updateMenuCursor() {
  document.querySelectorAll('.menu-item').forEach((el, i) => {
    el.classList.toggle('menu-item-active', i === menuCursor);
    el.textContent = (i === menuCursor ? '▶ ' : '    ') + [
      'LOCAL 2 PLAYER',
      'SINGLEPLAYER (VS AI)',
      'MULTIPLAYER',
      'TUTORIAL / HOW TO PLAY'
    ][i];
  });
}

function triggerMenuAction(action) {
  mainMenu.style.display = 'none';
  if      (action === '2p')       CS.show();
  else if (action === '1p')       showDifficultySelect();
  else if (action === 'online')   showOnlineMenu();
  else if (action === 'tutorial') showTutorial();
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
// TUTORIAL / HOW TO PLAY OVERLAY
// ════════════════════════════════════════════════════════════
const tutorialOverlay = document.getElementById('tutorialOverlay');
const tutTabSingle    = document.getElementById('tutTabSingle');
const tutTabMulti     = document.getElementById('tutTabMulti');
const tutPanelSingle  = document.getElementById('tutPanelSingle');
const tutPanelMulti   = document.getElementById('tutPanelMulti');
const tutBackBtn      = document.getElementById('tutorialBackBtn');

function setTutorialTab(tab) {
  if (tutTabSingle) tutTabSingle.classList.toggle('active', tab === 'single');
  if (tutTabMulti)  tutTabMulti.classList.toggle('active', tab === 'multi');
  if (tutPanelSingle) tutPanelSingle.style.display = (tab === 'single') ? 'block' : 'none';
  if (tutPanelMulti)  tutPanelMulti.style.display  = (tab === 'multi') ? 'block' : 'none';
}

function showTutorial() {
  if (typeof BGM !== 'undefined') BGM.playMenu();
  setTutorialTab('single');
  if (tutorialOverlay) tutorialOverlay.style.display = 'flex';
}

function hideTutorial() {
  if (tutorialOverlay) tutorialOverlay.style.display = 'none';
  mainMenu.style.display = 'flex';
  if (typeof BGM !== 'undefined') BGM.playMenu();
}

if (tutTabSingle) tutTabSingle.addEventListener('click', () => setTutorialTab('single'));
if (tutTabMulti)  tutTabMulti.addEventListener('click', () => setTutorialTab('multi'));
if (tutBackBtn)   tutBackBtn.addEventListener('click', hideTutorial);

// Keyboard navigation while tutorial is open
window.addEventListener('keydown', (e) => {
  if (tutorialOverlay && tutorialOverlay.style.display === 'flex') {
    if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      hideTutorial();
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === '1') {
      e.preventDefault();
      setTutorialTab('single');
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === '2') {
      e.preventDefault();
      setTutorialTab('multi');
    }
  }
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
    if (onlineLobbyStep.style.display !== 'none') {
      setOnlineStatus(msg, 'error');
    } else {
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

  ONLINE.onCharSelected(({ p1Key, p2Key, mapPath, mapShowShop, mapMusic }) => {
    // Guest receives char selection and map from host
    hideOnlineMenu();
    CS.startOnlineMatch(p1Key, p2Key, mapPath, mapShowShop, mapMusic);
  });

  // Host receives inputs from guest
  ONLINE.onGuestInput((data) => {
    if (!data) return;
    opponentKeys = data.keys || {};
    if (data.actions) {
      if (data.actions.jump)   opponentActions.jump   = true;
      if (data.actions.attack) opponentActions.attack  = true;
      if (data.actions.heavy)  opponentActions.heavy   = true;
    }
  });

  // Legacy opponent input alias
  ONLINE.onOpponentInput((data) => {
    if (!data) return;
    opponentKeys = data.keys || {};
    if (data.actions) {
      if (data.actions.jump)   opponentActions.jump   = true;
      if (data.actions.attack) opponentActions.attack  = true;
      if (data.actions.heavy)  opponentActions.heavy   = true;
    }
  });

  // Guest receives authoritative state from host
  ONLINE.onStateSync((state) => {
    if (!isOnline || onlineRole !== 'guest') return;
    handleGuestStateSync(state);
  });

  // Rematch status notification
  ONLINE.onRematchStatus(({ host, guest }) => {
    if (!isOnline) return;
    let hint = '';
    if (onlineRole === 'host') {
      if (host && !guest) hint = '✔ WAITING FOR GUEST TO ACCEPT REMATCH... (1/2)';
      else if (!host && guest) hint = '🥊 GUEST WANTS A REMATCH! Press R to Accept! (1/2)';
    } else {
      if (guest && !host) hint = '✔ WAITING FOR HOST TO ACCEPT REMATCH... (1/2)';
      else if (!guest && host) hint = '🥊 HOST WANTS A REMATCH! Press R to Accept! (1/2)';
    }
    setRematchStatusText(!!hint);
    const el = document.getElementById('onlineRematchHint');
    if (el && hint) el.textContent = hint;
  });

  // Synchronized rematch start for both clients
  ONLINE.onRematchStart(() => {
    if (typeof Announcer !== 'undefined') Announcer.stop();
    hideAllResults();
    setRematchStatusText(false);
    document.getElementById('disconnectOverlay').classList.remove('visible');
    startOnlineMatch(chosenP1Key, chosenP2Key, chosenMapPath, chosenMapShowShop, chosenMapMusic);
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
  if (typeof Announcer !== 'undefined') Announcer.stop();
  ONLINE.disconnect();
  hideOnlineMenu();
  mainMenu.style.display = 'flex';
  if (typeof BGM !== 'undefined') BGM.playMenu();
});

document.getElementById('onlineWaitBackBtn').addEventListener('click', () => {
  if (typeof Announcer !== 'undefined') Announcer.stop();
  ONLINE.disconnect();
  hideOnlineMenu();
  mainMenu.style.display = 'flex';
  if (typeof BGM !== 'undefined') BGM.playMenu();
});

// Disconnect overlay OK button
document.getElementById('disconnectOkBtn').addEventListener('click', () => {
  if (typeof Announcer !== 'undefined') Announcer.stop();
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
function startOnlineMatch(p1Key, p2Key, mapPath, showShop, musicPath) {
  chosenP1Key       = p1Key;
  chosenP2Key       = p2Key;
  isSinglePlayer    = false;
  isOnline          = true;
  chosenMapPath     = mapPath    || './images/background.png';
  chosenMapShowShop = (showShop === undefined || showShop === null) ? true : !!showShop;
  chosenMapMusic    = musicPath  || (typeof BGM !== 'undefined' ? BGM.getMusicForMap(chosenMapPath) : './BackgroundMusic/OakForest.m4a');
  currentRound          = 0;
  p1RoundWins           = 0;
  p2RoundWins           = 0;
  onlineFrame           = 0;
  opponentKeys          = {};
  opponentActions       = {};
  localActions          = {};
  onlinePendingHit      = null;
  inDeathOrVictoryPhase = false;
  roundEndHandled       = false;
  setRematchStatusText(false);

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
    if (p1ctrl) p1ctrl.textContent = 'YOU (HOST) — E=Light  F=Heavy  S=Block';
    if (p2ctrl) p2ctrl.textContent = 'OPPONENT';
  } else {
    if (p1ctrl) p1ctrl.textContent = 'OPPONENT';
    if (p2ctrl) p2ctrl.textContent = 'YOU (GUEST) — E=Light  F=Heavy  S=Block';
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

