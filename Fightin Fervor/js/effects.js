// =========================================================
// FIGHTIN' FERVOR — effects.js
// All canvas/DOM visual juice:
//   - Hit spark particles
//   - Screen shake
//   - Floating damage numbers
//   - Hit flash (white overlay on struck fighter)
//   - Impact ring (expanding circle on heavy hit)
// =========================================================

const FX = (() => {

  // ── Particle pool ─────────────────────────────────────
  const particles = [];

  // Spawn spark particles at a world-space hit point
  function spawnSparks(x, y, count = 6, heavy = false) {
    const colors = heavy
      ? ['#ff6600', '#ff9900', '#ffcc00', '#ffffff']
      : ['#ffffff', '#ffeeaa', '#ffcc44'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = heavy
        ? 3 + Math.random() * 6
        : 2 + Math.random() * 4;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (heavy ? 2 : 1),  // slight upward bias
        life: 1,
        decay: heavy ? 0.04 + Math.random() * 0.03 : 0.07 + Math.random() * 0.05,
        size: heavy ? 3 + Math.random() * 4 : 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        heavy,  // store so updateParticles can read it
      });
    }
  }

  // Update + draw all particles (call every frame with the canvas context)
  function updateParticles(ctx) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   += 0.25;   // gravity
      p.vx   *= 0.88;   // friction
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = p.heavy ? 8 : 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Impact rings ──────────────────────────────────────
  const rings = [];

  function spawnRing(x, y) {
    rings.push({ x, y, r: 4, maxR: 42, life: 1 });
  }

  function updateRings(ctx) {
    for (let i = rings.length - 1; i >= 0; i--) {
      const ring = rings[i];
      ring.r    += (ring.maxR - ring.r) * 0.22;
      ring.life -= 0.08;

      if (ring.life <= 0) { rings.splice(i, 1); continue; }

      ctx.save();
      ctx.globalAlpha   = ring.life * 0.8;
      ctx.strokeStyle   = '#ffcc00';
      ctx.shadowColor   = '#ff8800';
      ctx.shadowBlur    = 12;
      ctx.lineWidth     = 2.5 * ring.life;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Screen shake ──────────────────────────────────────
  let shakeFrames = 0;
  let shakeMag    = 0;
  const gameContainer = document.getElementById('gameContainer');

  function shake(magnitude = 8, frames = 10) {
    shakeMag    = magnitude;
    shakeFrames = frames;
  }

  function updateShake() {
    if (shakeFrames <= 0) {
      gameContainer.style.transform = '';
      return;
    }
    shakeFrames--;
    const intensity = (shakeFrames / 10) * shakeMag;
    const dx = (Math.random() - 0.5) * intensity * 2;
    const dy = (Math.random() - 0.5) * intensity * 2;
    gameContainer.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  // ── Floating damage numbers ───────────────────────────
  // Rendered as DOM elements (canvas text gets buried under sprites)
  const damageNumbers = [];

  function spawnDamageNumber(worldX, worldY, amount, heavy = false, blocked = false) {
    const el = document.createElement('div');
    el.className  = 'dmg-popup' + (heavy ? ' dmg-heavy' : '') + (blocked ? ' dmg-blocked' : '');
    el.textContent = blocked ? `BLOCK` : `-${amount}`;

    // Convert world coords to CSS (gameContainer is 1024×576, same as canvas)
    el.style.left = `${worldX}px`;
    el.style.top  = `${worldY - 60}px`;
    gameContainer.appendChild(el);

    const obj = { el, life: 1, vy: -1.2, y: worldY - 60 };
    damageNumbers.push(obj);
  }

  function updateDamageNumbers() {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
      const d = damageNumbers[i];
      d.life -= 0.025;
      d.y    += d.vy;
      d.vy   *= 0.94;

      if (d.life <= 0) {
        d.el.remove();
        damageNumbers.splice(i, 1);
        continue;
      }
      d.el.style.top     = `${d.y}px`;
      d.el.style.opacity = d.life;
    }
  }

  // ── Hit flash overlay ─────────────────────────────────
  // We draw a white rect over the canvas at the fighter's position for 1 frame
  let hitFlashes = [];

  function spawnHitFlash(fighter) {
    hitFlashes.push({ fighter, frames: 2 });
  }

  function updateHitFlash(ctx) {
    for (let i = hitFlashes.length - 1; i >= 0; i--) {
      const f = hitFlashes[i];
      f.frames--;
      if (f.frames <= 0) { hitFlashes.splice(i, 1); continue; }

      const fw = f.fighter;
      // Draw a white overlay in screen-space using the fighter's world position.
      // The fighter's drawn region is: (position - offset) for top-left corner.
      const drawW = (fw.image.width / fw.framesmax) * fw.scale;
      const drawH = fw.image.height * fw.scale;
      const drawX = fw.position.x - fw.offset.x;
      const drawY = fw.position.y - fw.offset.y;
      ctx.save();
      ctx.globalAlpha    = 0.5;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle      = 'white';
      ctx.fillRect(drawX, drawY, drawW, drawH);
      ctx.restore();
    }
  }

  // ── Low-HP health bar pulse ───────────────────────────
  // Adds/removes CSS class on HUD elements
  function updateLowHPWarning(player, enemy) {
    const p1bar = document.getElementById('playerHealth');
    const p2bar = document.getElementById('enemyHealth');
    const p1ghost = document.getElementById('playerGhostHealth');
    const p2ghost = document.getElementById('enemyGhostHealth');

    const p1ratio = player ? player.health / player.maxHealth : 1;
    const p2ratio = enemy  ? enemy.health  / enemy.maxHealth  : 1;

    p1bar?.classList.toggle('hp-danger', p1ratio < 0.25 && p1ratio > 0);
    p2bar?.classList.toggle('hp-danger', p2ratio < 0.25 && p2ratio > 0);
    p1ghost?.classList.toggle('hp-danger-ghost', p1ratio < 0.25 && p1ratio > 0);
    p2ghost?.classList.toggle('hp-danger-ghost', p2ratio < 0.25 && p2ratio > 0);
  }

  // ── Master update — call once per frame after canvas clear ──
  function update(ctx, player, enemy) {
    updateParticles(ctx);
    updateRings(ctx);
    updateHitFlash(ctx);
    updateShake();
    updateDamageNumbers();
    if (player && enemy) updateLowHPWarning(player, enemy);
  }

  // ── Hit event — called from index.js on successful hit ───
  // attacker = Fighter who landed hit, target = Fighter who got hit
  function onHit(attacker, target, damageDealt, heavy = false, blocked = false) {
    // Hit contact point — midway of attacker's attack box
    const hitX = attacker.attackBox.position.x + attacker.attackBox.width  * 0.5;
    const hitY = attacker.attackBox.position.y + attacker.attackBox.height * 0.5;

    if (!blocked) {
      spawnSparks(hitX, hitY, heavy ? 12 : 5, heavy);
      if (heavy) spawnRing(hitX, hitY);
      spawnHitFlash(target);
      if (heavy) shake(10, 12);
      else       shake(4,  6);
    } else {
      // Block visual — small sparks in a different colour
      spawnSparks(hitX, hitY, 3, false);
    }

    spawnDamageNumber(target.position.x + 20, target.position.y, damageDealt, heavy, blocked);
  }

  return { update, onHit, shake, spawnSparks, spawnRing };
})();
