// =========================================================
// FIGHTIN' FERVOR — characterSelect.js
// Supports:
//   CS.show()                    → 2-player, both pick locally
//   CS.showSinglePlayer(diff)    → 1-player, P2 panel = AI reveal
//   CS.showOnline(role)          → Online: Host picks P1, Guest picks P2
// =========================================================

const CS = (() => {
  const charKeys = Object.keys(CHARACTERS);

  let p1Index      = 0;
  let p2Index      = 0;
  let p1Confirmed  = false;
  let p2Confirmed  = false;
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

      // P1 grid
      const card1 = document.createElement('div');
      card1.className = 'cs-card';
      card1.dataset.index = i;
      card1.innerHTML = `<span>${char.displayName}</span>`;
      card1.addEventListener('click', () => {
        if (isOnlineMode && onlinePlayerRole !== 'host') return;
        if (!p1Confirmed) {
          p1Index = i;
          updateHighlight(1);
          updatePreview(1);
          if (isOnlineMode) {
            ONLINE.sendCharPick({ role: 'host', index: p1Index, confirmed: false });
          }
        }
      });
      p1Grid.appendChild(card1);

      // P2 grid (hidden in SP mode)
      if (!isSPMode) {
        const card2 = document.createElement('div');
        card2.className = 'cs-card';
        card2.dataset.index = i;
        card2.innerHTML = `<span>${char.displayName}</span>`;
        card2.addEventListener('click', () => {
          if (isOnlineMode && onlinePlayerRole !== 'guest') return;
          if (!p2Confirmed) {
            p2Index = i;
            updateHighlight(2);
            updatePreview(2);
            if (isOnlineMode) {
              ONLINE.sendCharPick({ role: 'guest', index: p2Index, confirmed: false });
            }
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

    if (!grid) return;
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

    if (!portrait || !nameEl || !statsEl) return;

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

    if (char) {
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
  }

  // ── Confirm a player's selection ───────────────────────────────────
  function confirmPlayer(player) {
    if (player === 1 && !p1Confirmed) {
      p1Confirmed = true;
      p1ReadyEl.style.display = 'block';
      updateHighlight(1);

      if (isOnlineMode) {
        ONLINE.sendCharPick({ role: 'host', index: p1Index, confirmed: true });
      }

      if (isSPMode) {
        // Pick a random AI character (avoid same as player if possible)
        const otherKeys = charKeys.filter((_, i) => i !== p1Index);
        const randomIdx = Math.floor(Math.random() * otherKeys.length);
        const aiKey     = otherKeys[randomIdx];
        p2Index         = charKeys.indexOf(aiKey);

        revealAI();
        setTimeout(startGame, 1500);
        return;
      }
    } else if (player === 2 && !p2Confirmed && !isSPMode) {
      p2Confirmed = true;
      p2ReadyEl.style.display = 'block';
      updateHighlight(2);

      if (isOnlineMode) {
        ONLINE.sendCharPick({ role: 'guest', index: p2Index, confirmed: true });
      }
    }

    // Both players confirmed
    if (p1Confirmed && (isSPMode || p2Confirmed)) {
      if (isOnlineMode) {
        if (onlinePlayerRole === 'host') {
          setTimeout(startGame, 700);
        }
      } else {
        setTimeout(startGame, 700);
      }
    }
  }

  // ── AI reveal animation ──────────────────────────────────────
  function revealAI() {
    const revealEl = p2Name;
    const totalCycles = 18;
    let cycleCount = 0;

    function cycleStep() {
      const rndKey = charKeys[Math.floor(Math.random() * charKeys.length)];
      revealEl.textContent = CHARACTERS[rndKey].displayName;

      cycleCount++;
      if (cycleCount < totalCycles) {
        setTimeout(cycleStep, 40 + cycleCount * 6);
      } else {
        updatePreview(2, true);
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

    if (isOnlineMode) {
      if (onlinePlayerRole === 'host') {
        // Host controls Player 1
        switch (e.key) {
          case 'a': case 'A':
            if (!p1Confirmed) {
              p1Index = (p1Index - 1 + charKeys.length) % charKeys.length;
              updateHighlight(1); updatePreview(1);
              ONLINE.sendCharPick({ role: 'host', index: p1Index, confirmed: false });
            }
            break;
          case 'd': case 'D':
            if (!p1Confirmed) {
              p1Index = (p1Index + 1) % charKeys.length;
              updateHighlight(1); updatePreview(1);
              ONLINE.sendCharPick({ role: 'host', index: p1Index, confirmed: false });
            }
            break;
          case 'e': case 'E':
          case ' ':
          case 'Enter':
            e.preventDefault();
            confirmPlayer(1);
            break;
        }
      } else {
        // Guest controls Player 2
        switch (e.key) {
          case 'a': case 'A':
          case 'j': case 'J':
          case 'ArrowLeft':
            e.preventDefault();
            if (!p2Confirmed) {
              p2Index = (p2Index - 1 + charKeys.length) % charKeys.length;
              updateHighlight(2); updatePreview(2);
              ONLINE.sendCharPick({ role: 'guest', index: p2Index, confirmed: false });
            }
            break;
          case 'd': case 'D':
          case 'l': case 'L':
          case 'ArrowRight':
            e.preventDefault();
            if (!p2Confirmed) {
              p2Index = (p2Index + 1) % charKeys.length;
              updateHighlight(2); updatePreview(2);
              ONLINE.sendCharPick({ role: 'guest', index: p2Index, confirmed: false });
            }
            break;
          case 'e': case 'E':
          case 'u': case 'U':
          case ' ':
          case 'Enter':
            e.preventDefault();
            confirmPlayer(2);
            break;
        }
      }
      return;
    }

    // ── Local 2P and SP keyboard navigation ───────────────────
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
      case 'e': case 'E':
      case ' ':
        e.preventDefault();
        confirmPlayer(1);
        break;

      // P2 navigation (2P mode)
      case 'j': case 'J':
      case 'ArrowLeft':
        e.preventDefault();
        if (!isSPMode && !p2Confirmed) {
          p2Index = (p2Index - 1 + charKeys.length) % charKeys.length;
          updateHighlight(2); updatePreview(2);
        }
        break;
      case 'l': case 'L':
      case 'ArrowRight':
        e.preventDefault();
        if (!isSPMode && !p2Confirmed) {
          p2Index = (p2Index + 1) % charKeys.length;
          updateHighlight(2); updatePreview(2);
        }
        break;
      case 'u': case 'U':
      case 'Enter':
        e.preventDefault();
        if (isSPMode) confirmPlayer(1);
        else          confirmPlayer(2);
        break;
    }
  }

  // ── Show character select (2-player local) ─────────────────
  function show() {
    isSPMode     = false;
    isOnlineMode = false;
    _openScreen();
  }

  // ── Show character select (single-player) ──────────────────
  function showSinglePlayer(difficulty = 'normal') {
    isSPMode     = true;
    isOnlineMode = false;
    spDifficulty = difficulty;
    _openScreen();
  }

  // ── Show character select (online) ─────────────────────────
  function showOnline(role) {
    isSPMode         = false;
    isOnlineMode     = true;
    onlinePlayerRole = role;
    _openScreen();

    // Listen for opponent's character picks
    ONLINE.onCharPick((data) => {
      if (!isOnlineMode) return;
      if (data.role === 'host') {
        p1Index     = data.index;
        p1Confirmed = !!data.confirmed;
        updateHighlight(1);
        updatePreview(1);
        p1ReadyEl.style.display = p1Confirmed ? 'block' : 'none';
      } else if (data.role === 'guest') {
        p2Index     = data.index;
        p2Confirmed = !!data.confirmed;
        updateHighlight(2);
        updatePreview(2);
        p2ReadyEl.style.display = p2Confirmed ? 'block' : 'none';
      }

      if (p1Confirmed && p2Confirmed && onlinePlayerRole === 'host') {
        setTimeout(startGame, 700);
      }
    });
  }

  // ── Guest: start match directly from host's char_selected event ──
  function _guestStartMatch(p1Key, p2Key, mapPath, mapShowShop, mapMusic) {
    overlay.style.display = 'none';
    window.removeEventListener('keydown', onKeyDown);

    if (CHARACTERS[p1Key]) {
      document.getElementById('p1CharName').textContent = CHARACTERS[p1Key].displayName;
      const p1Data = CHARACTERS[p1Key];
      const p1Av = document.getElementById('p1HudAvatar');
      if (p1Av && p1Data.avatarFile) p1Av.src = p1Data.basePath + p1Data.avatarFile;
    }
    if (CHARACTERS[p2Key]) {
      document.getElementById('p2CharName').textContent = CHARACTERS[p2Key].displayName;
      const p2Data = CHARACTERS[p2Key];
      const p2Av = document.getElementById('p2HudAvatar');
      if (p2Av && p2Data.avatarFile) p2Av.src = p2Data.basePath + p2Data.avatarFile;
    }

    if (typeof window.startOnlineMatch === 'function') {
      window.startOnlineMatch(p1Key, p2Key, mapPath, mapShowShop, mapMusic);
    }
  }

  // ── Shared open logic ──────────────────────────────────────
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
    p1ReadyEl.textContent   = '✔ READY!';
    p2ReadyEl.textContent   = '✔ READY!';

    p1Grid.innerHTML = '';
    p2Grid.innerHTML = '';

    if (isSPMode) {
      document.getElementById('csTitle').textContent = 'SELECT YOUR FIGHTER';
      document.getElementById('p1CharName').textContent = 'PLAYER 1';
      p1Label.textContent = '◄ PLAYER 1 ◄';
      p2Label.textContent = '▶ AI OPPONENT ▶';
      p2Panel.classList.add('ai-panel');
      p2Grid.style.opacity      = '0.3';
      p2Grid.style.pointerEvents = 'none';
      updatePreview(2, false);
    } else if (isOnlineMode) {
      if (onlinePlayerRole === 'host') {
        document.getElementById('csTitle').textContent = 'SELECT YOUR FIGHTER (YOU ARE PLAYER 1)';
        p1Label.textContent = '◄ YOU (HOST) ◄';
        p2Label.textContent = '▶ OPPONENT (GUEST) ▶';
        p2Panel.classList.remove('ai-panel');
        p1Grid.style.pointerEvents = '';
        p2Grid.style.pointerEvents = 'none';
      } else {
        document.getElementById('csTitle').textContent = 'SELECT YOUR FIGHTER (YOU ARE PLAYER 2)';
        p1Label.textContent = '◄ OPPONENT (HOST) ◄';
        p2Label.textContent = '▶ YOU (GUEST) ▶';
        p2Panel.classList.remove('ai-panel');
        p1Grid.style.pointerEvents = 'none';
        p2Grid.style.pointerEvents = '';
      }
      p2Grid.style.opacity = '';
    } else {
      document.getElementById('csTitle').textContent = 'SELECT YOUR FIGHTER';
      p1Label.textContent = '◄ PLAYER 1 ◄';
      p2Label.textContent = '▶ PLAYER 2 ▶';
      p2Panel.classList.remove('ai-panel');
      p1Grid.style.pointerEvents  = '';
      p2Grid.style.opacity       = '';
      p2Grid.style.pointerEvents  = '';
    }

    buildGrids();
    updateHighlight(1); updatePreview(1);
    updateHighlight(2); updatePreview(2);

    overlay.style.display = 'flex';
    window.addEventListener('keydown', onKeyDown);
  }

  // ── Hand off to game engine ────────────────────────────────
  function startGame() {
    overlay.style.display = 'none';
    window.removeEventListener('keydown', onKeyDown);

    const p1Key = charKeys[p1Index];
    const p2Key = charKeys[p2Index];

    document.getElementById('p1CharName').textContent = CHARACTERS[p1Key].displayName;
    document.getElementById('p2CharName').textContent =
      isSPMode ? `CPU: ${CHARACTERS[p2Key].displayName}` : CHARACTERS[p2Key].displayName;

    const p1Data = CHARACTERS[p1Key];
    const p2Data = CHARACTERS[p2Key];
    const p1Av = document.getElementById('p1HudAvatar');
    const p2Av = document.getElementById('p2HudAvatar');
    if (p1Av && p1Data.avatarFile) p1Av.src = p1Data.basePath + p1Data.avatarFile;
    if (p2Av && p2Data.avatarFile) p2Av.src = p2Data.basePath + p2Data.avatarFile;

    if (isOnlineMode) {
      const mapPath = (typeof chosenMapPath !== 'undefined' && chosenMapPath) ? chosenMapPath : './images/background.png';
      const mapShop = (typeof chosenMapShowShop !== 'undefined') ? chosenMapShowShop : true;
      const mapMus  = (typeof chosenMapMusic !== 'undefined' && chosenMapMusic) ? chosenMapMusic : './BackgroundMusic/OakForest.m4a';

      if (typeof ONLINE !== 'undefined') {
        ONLINE.sendCharSelect(p1Key, p2Key, mapPath, mapShop, mapMus);
      }
      if (typeof window.startOnlineMatch === 'function') {
        window.startOnlineMatch(p1Key, p2Key, mapPath, mapShop, mapMus);
      }
      return;
    }

    if (typeof MS !== 'undefined') {
      MS.show(p1Key, p2Key, isSPMode ? spDifficulty : null);
    } else if (typeof startMatch === 'function') {
      startMatch(p1Key, p2Key, isSPMode ? spDifficulty : null);
    }
  }

  return { show, showSinglePlayer, showOnline, startOnlineMatch: _guestStartMatch };
})();
