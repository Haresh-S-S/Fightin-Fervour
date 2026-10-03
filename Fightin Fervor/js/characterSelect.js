// =========================================================
// FIGHTIN' FERVOR — characterSelect.js
// Supports two modes:
//   CS.show()                    → 2-player, both pick
//   CS.showSinglePlayer(diff)    → 1-player, P2 panel = AI reveal
// =========================================================

const CS = (() => {
  const charKeys = Object.keys(CHARACTERS);

  let p1Index      = 0;
  let p2Index      = 0;          // resolved randomly for AI or online
  let p1Confirmed  = false;
  let isSPMode     = false;      // single-player mode flag
  let spDifficulty = 'normal';
  let isOnlineMode = false;      // online multiplayer flag
  let onlinePlayerRole = null;   // 'host' | 'guest'

  const overlay    = document.getElementById('charSelectOverlay');
  const p1Grid     = document.getElementById('p1CharGrid');
  const p2Grid     = document.getElementById('p2CharGrid');
  const p1Portrait = document.getElementById('p1Portrait');
  const p2Portrait = document.getElementById('p2Portrait');
  const p1Name     = document.getElementById('p1SelectedName');
  const p2Name     = document.getElementById('p2SelectedName');
  const p1Stats    = document.getElementById('p1Stats');
  const p2Stats    = document.getElementById('p2Stats');
  const p1ReadyEl  = document.getElementById('p1Ready');
  const p2ReadyEl  = document.getElementById('p2Ready');
  const p1Panel    = document.getElementById('cs-p1-panel');
  const p2Panel    = document.getElementById('cs-p2-panel');
  const p1Label    = document.querySelector('.p1-label');
  const p2Label    = document.querySelector('.p2-label');


  // ── Build character grids ───────────────────────────────────
  function buildGrids() {
    charKeys.forEach((key, i) => {
      const char = CHARACTERS[key];

      // P1 grid — always built
      const card1 = document.createElement('div');
      card1.className = 'cs-card';
      card1.dataset.index = i;
      card1.innerHTML = `<span>${char.displayName}</span>`;
      card1.addEventListener('click', () => {
        if (!p1Confirmed) {
          p1Index = i;
          updateHighlight(1);
          updatePreview(1);
        }
      });
      p1Grid.appendChild(card1);

      // P2 grid — only in 2P mode
      if (!isSPMode) {
        const card2 = document.createElement('div');
        card2.className = 'cs-card';
        card2.dataset.index = i;
        card2.innerHTML = `<span>${char.displayName}</span>`;
        card2.addEventListener('click', () => {
          if (!p2Confirmed) {
            p2Index = i;
            updateHighlight(2);
            updatePreview(2);
          }
        });
        p2Grid.appendChild(card2);
      }
    });
  }

  // ── Highlight selected / confirmed card ─────────────────────
  function updateHighlight(player) {
    const grid      = player === 1 ? p1Grid : p2Grid;
    const idx       = player === 1 ? p1Index : p2Index;
    const confirmed = player === 1 ? p1Confirmed : p2Confirmed;

    grid.querySelectorAll('.cs-card').forEach((c, i) => {
      c.classList.remove('selected', 'confirmed');
      if (i === idx) {
        c.classList.add(confirmed ? 'confirmed' : 'selected');
      }
    });
  }

  // ── Update portrait + stat bars ─────────────────────────────
  function updatePreview(player, revealed = true) {
    const idx      = player === 1 ? p1Index : p2Index;
    const key      = charKeys[idx];
    const char     = CHARACTERS[key];
    const portrait = player === 1 ? p1Portrait : p2Portrait;
    const nameEl   = player === 1 ? p1Name     : p2Name;
    const statsEl  = player === 1 ? p1Stats    : p2Stats;

    if (!revealed) {
      // AI "???" state
      portrait.src      = '';
      nameEl.textContent = '???';
      statsEl.innerHTML  = `
        <div class="stat-row"><span class="stat-label">SPEED</span><div class="stat-bar-bg"><div class="stat-bar ai-unknown-bar" style="width:100%"></div></div><span class="stat-val">?</span></div>
        <div class="stat-row"><span class="stat-label">POWER</span><div class="stat-bar-bg"><div class="stat-bar ai-unknown-bar" style="width:100%"></div></div><span class="stat-val">?</span></div>
        <div class="stat-row"><span class="stat-label">HEALTH</span><div class="stat-bar-bg"><div class="stat-bar ai-unknown-bar" style="width:100%"></div></div><span class="stat-val">?</span></div>
      `;
      return;
    }

    portrait.src = char.basePath + (char.portraitFile || char.animations.idle.file);
    nameEl.textContent = char.displayName;

    const speedPct  = Math.round((char.speed     / 10)  * 100);
    const powerPct  = Math.round((char.damage    / 20)  * 100);
    const healthPct = Math.round((char.maxHealth / 150) * 100);

    statsEl.innerHTML = `
      <div class="stat-row">
        <span class="stat-label">SPEED</span>
        <div class="stat-bar-bg"><div class="stat-bar speed-bar" style="width:${speedPct}%"></div></div>
        <span class="stat-val">${char.speed}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">POWER</span>
        <div class="stat-bar-bg"><div class="stat-bar power-bar" style="width:${powerPct}%"></div></div>
        <span class="stat-val">${char.damage}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">HEALTH</span>
        <div class="stat-bar-bg"><div class="stat-bar health-bar" style="width:${healthPct}%"></div></div>
        <span class="stat-val">${char.maxHealth}</span>
      </div>
    `;
  }

  // ── Confirm a player's selection ───────────────────────────────────
  function confirmPlayer(player) {
    if (player === 1 && !p1Confirmed) {
      p1Confirmed = true;
      p1ReadyEl.style.display = 'block';
      updateHighlight(1);

      if (isSPMode) {
        // Pick a random AI character (avoid same as player if possible)
        const otherKeys = charKeys.filter((_, i) => i !== p1Index);
        const randomIdx = Math.floor(Math.random() * otherKeys.length);
        const aiKey     = otherKeys[randomIdx];
        p2Index         = charKeys.indexOf(aiKey);

        // Animate the AI reveal
        revealAI();
        setTimeout(startGame, 1500);
        return;
      }
      // In online mode OR local 2P, fall through to check if both confirmed
    } else if (player === 2 && !p2Confirmed && !isSPMode) {
      p2Confirmed = true;
      p2ReadyEl.style.display = 'block';
      updateHighlight(2);
    }

    if (p1Confirmed && (isSPMode || p2Confirmed)) {
      setTimeout(startGame, 700);
    }
  }

  // ── AI reveal animation ──────────────────────────────────────
  function revealAI() {
    // Slot machine effect: cycle through names before landing
    const revealEl = p2Name;
    const totalCycles = 18;
    let cycleCount = 0;

    function cycleStep() {
      const rndKey = charKeys[Math.floor(Math.random() * charKeys.length)];
      revealEl.textContent = CHARACTERS[rndKey].displayName;

      cycleCount++;
      if (cycleCount < totalCycles) {
        setTimeout(cycleStep, 40 + cycleCount * 6); // slow down over time
      } else {
        // Land on the actual AI character
        updatePreview(2, true);
        // Mark grid cell too
        p2Grid.querySelectorAll('.cs-card').forEach((c, i) => {
          c.classList.toggle('confirmed', i === p2Index);
        });
        p2ReadyEl.style.display = 'block';
        p2ReadyEl.textContent   = '🤖 AI READY!';
      }
    }

    cycleStep();
  }

  // ── Keyboard navigation ─────────────────────────────────────
  function onKeyDown(e) {
    if (overlay.style.display === 'none') return;

    switch (e.key) {
      // P1 navigation
      case 'a': case 'A':
        if (!p1Confirmed) {
          p1Index = (p1Index - 1 + charKeys.length) % charKeys.length;
          updateHighlight(1); updatePreview(1);
        }
        break;
      case 'd': case 'D':
        if (!p1Confirmed) {
          p1Index = (p1Index + 1) % charKeys.length;
          updateHighlight(1); updatePreview(1);
        }
        break;
      case ' ':
        e.preventDefault();
        confirmPlayer(1);
        break;

      // P2 navigation (2P and online mode)
      case 'ArrowLeft':
        e.preventDefault();
        if (!isSPMode && !p2Confirmed) {
          p2Index = (p2Index - 1 + charKeys.length) % charKeys.length;
          updateHighlight(2); updatePreview(2);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (!isSPMode && !p2Confirmed) {
          p2Index = (p2Index + 1) % charKeys.length;
          updateHighlight(2); updatePreview(2);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isSPMode) confirmPlayer(1);   // Enter also confirms P1 in SP
        else          confirmPlayer(2);
        break;
    }
  }

  // ── Show character select (2-player) ──────────────────────────────
  function show() {
    isSPMode     = false;
    isOnlineMode = false;
    _openScreen();
  }

  // ── Show character select (single-player) ────────────────────────
  function showSinglePlayer(difficulty = 'normal') {
    isSPMode     = true;
    isOnlineMode = false;
    spDifficulty = difficulty;
    _openScreen();
  }

  // ── Show character select (online — host picks, guest waits) ──
  function showOnline(role) {
    isSPMode         = false;
    isOnlineMode     = true;
    onlinePlayerRole = role;
    _openScreen();
  }

  // ── Guest: skip character select, start directly ────────────────
  // Called when the server relays the host's char_selected event
  function _guestStartMatch(p1Key, p2Key) {
    overlay.style.display = 'none';
    window.removeEventListener('keydown', onKeyDown);

    document.getElementById('p1CharName').textContent = CHARACTERS[p1Key].displayName;
    document.getElementById('p2CharName').textContent = CHARACTERS[p2Key].displayName;

    // Set HUD avatars
    const p1Data = CHARACTERS[p1Key];
    const p2Data = CHARACTERS[p2Key];
    const p1Av = document.getElementById('p1HudAvatar');
    const p2Av = document.getElementById('p2HudAvatar');
    if (p1Av && p1Data.avatarFile) p1Av.src = p1Data.basePath + p1Data.avatarFile;
    if (p2Av && p2Data.avatarFile) p2Av.src = p2Data.basePath + p2Data.avatarFile;

    // startOnlineMatch is defined in index.js as a global function
    window.startOnlineMatch(p1Key, p2Key);
  }

  // ── Shared open logic ──────────────────────────────────────────
  function _openScreen() {
    if (typeof BGM !== 'undefined') {
      BGM.playMenu();
    }
    p1Confirmed = false;
    p2Confirmed = false;
    p1Index     = 0;
    p2Index     = Math.min(4, charKeys.length - 1);

    p1ReadyEl.style.display = 'none';
    p2ReadyEl.style.display = 'none';
    p2ReadyEl.textContent   = '✔ READY!';

    p1Grid.innerHTML = '';
    p2Grid.innerHTML = '';

    if (isSPMode) {
      // ── Single-player: P2 panel = locked AI panel ───────────────
      document.getElementById('csTitle').textContent = 'SELECT YOUR FIGHTER';
      document.getElementById('p1CharName').textContent = 'PLAYER 1';
      p1Label.textContent = '◄ PLAYER 1 ◄';
      p2Label.textContent = '▶ AI OPPONENT ▶';
      p2Panel.classList.add('ai-panel');
      p2Grid.style.opacity      = '0.3';
      p2Grid.style.pointerEvents = 'none';
      updatePreview(2, false); // show "???"
    } else if (isOnlineMode) {
      // ── Online: host picks BOTH fighters (P1=their char, P2=guest's char) ──
      // Both panels are fully interactive — same as local 2P mode.
      // The host controls P1 in-game; the guest controls P2 in-game.
      document.getElementById('csTitle').textContent = 'SELECT FIGHTERS (HOST PICKS BOTH)';
      p1Label.textContent = '◄ YOUR FIGHTER ◄';
      p2Label.textContent = '▶ GUEST FIGHTER ▶';
      p2Panel.classList.remove('ai-panel');
      p2Grid.style.opacity       = '';
      p2Grid.style.pointerEvents  = '';
    } else {
      // ── Local 2P ───────────────────────────────────────
      document.getElementById('csTitle').textContent = 'SELECT YOUR FIGHTER';
      p1Label.textContent = '◄ PLAYER 1 ◄';
      p2Label.textContent = '▶ PLAYER 2 ▶';
      p2Panel.classList.remove('ai-panel');
      p2Grid.style.opacity       = '';
      p2Grid.style.pointerEvents  = '';
    }

    buildGrids();
    updateHighlight(1); updatePreview(1);
    updateHighlight(2); updatePreview(2);

    overlay.style.display = 'flex';
    window.addEventListener('keydown', onKeyDown);
  }

  // ── Hand off to map select, then to game engine ────────────────────────
  function startGame() {
    overlay.style.display = 'none';
    window.removeEventListener('keydown', onKeyDown);

    const p1Key = charKeys[p1Index];
    const p2Key = charKeys[p2Index];

    document.getElementById('p1CharName').textContent = CHARACTERS[p1Key].displayName;
    document.getElementById('p2CharName').textContent =
      isSPMode ? `CPU: ${CHARACTERS[p2Key].displayName}` : CHARACTERS[p2Key].displayName;

    // Set HUD avatars
    const p1Data = CHARACTERS[p1Key];
    const p2Data = CHARACTERS[p2Key];
    const p1Av = document.getElementById('p1HudAvatar');
    const p2Av = document.getElementById('p2HudAvatar');
    if (p1Av && p1Data.avatarFile) p1Av.src = p1Data.basePath + p1Data.avatarFile;
    if (p2Av && p2Data.avatarFile) p2Av.src = p2Data.basePath + p2Data.avatarFile;

    if (isOnlineMode) {
      // Host picked both characters — send to guest so they can start
      if (typeof ONLINE !== 'undefined') {
        ONLINE.sendCharSelect(p1Key, p2Key);
      }
      // Host starts their own match immediately (skip map select for online for now)
      window.startOnlineMatch(p1Key, p2Key);
      return;
    }

    // Show map select screen, then start match with chosen map
    if (typeof MS !== 'undefined') {
      MS.show(p1Key, p2Key, isSPMode ? spDifficulty : null);
    } else if (typeof startMatch === 'function') {
      startMatch(p1Key, p2Key, isSPMode ? spDifficulty : null);
    }
  }


  // ── Expose public API ──────────────────────────────────────────
  return { show, showSinglePlayer, showOnline, startOnlineMatch: _guestStartMatch };
})();
