// =========================================================
// FIGHTIN' FERVOR — utils.js
// Collision detection, timer, round/match win logic.
// =========================================================

function rectangularCollision({ rectangle1, rectangle2 }) {
  // Apply per-character hurtbox offset so collisions match the visible sprite body
  const hbOffX = rectangle2.hurtboxOffset ? rectangle2.hurtboxOffset.x : 0;
  const hbOffY = rectangle2.hurtboxOffset ? rectangle2.hurtboxOffset.y : 0;
  const hbW    = rectangle2.hurtboxWidth  || rectangle2.width;
  const hbH    = rectangle2.height;
  const r2x = rectangle2.position.x + hbOffX;
  const r2y = rectangle2.position.y + hbOffY;
  return (
    (rectangle1.attackBox.position.x + rectangle1.attackBox.width  >= r2x) &&
    (rectangle1.attackBox.position.x  <= r2x + hbW) &&
    (rectangle1.attackBox.position.y + rectangle1.attackBox.height >= r2y) &&
    (rectangle1.attackBox.position.y  <= r2y + hbH)
  );
}

// ── Timer ───────────────────────────────────────────────────
let timer   = 60;
let timerID = null;

function startTimer() {
  clearTimeout(timerID);
  timer = 60;
  const timerEl = document.querySelector('#timer');
  timerEl.innerHTML = timer;
  timerEl.classList.remove('timer-danger');
  decreaseTimer();
}

function decreaseTimer() {
  if (timer > 0) {
    timerID = setTimeout(decreaseTimer, 1000);
    timer--;
    document.querySelector('#timer').innerHTML = timer;
  }
  if (timer === 0) {
    endRound();
  }
}

// ── Round system ─────────────────────────────────────────────
// Managed by index.js — these are set there so utils.js can call back.
// (Avoids circular dep; index.js assigns window.player / window.enemy.)
function endRound() {
  clearTimeout(timerID);
  if (typeof handleRoundEnd === 'function') handleRoundEnd();
}

// ── Determine round winner ───────────────────────────────────
// Returns 1 (player wins), 2 (enemy wins), or 0 (tie).
function getRoundWinner(player, enemy) {
  if (player.health > enemy.health)  return 1;
  if (enemy.health  > player.health) return 2;
  return 0;
}