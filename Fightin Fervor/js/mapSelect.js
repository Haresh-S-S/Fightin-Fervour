// =========================================================
// FIGHTIN' FERVOR — mapSelect.js
// Map selection screen shown after character select.
//
// P1 navigates with A/D keys, confirms with SPACE.
// P2 navigates with ArrowLeft/Right, confirms with Enter.
// If both players pick DIFFERENT maps, one is chosen at random.
// =========================================================

const MS = (() => {
  // ── Map registry ────────────────────────────────────────────
  const MAPS = [
    {
      name:     'The Shop',
      file:     './images/background.png',
      showShop: true,
    },
    {
      name:     'Ancient Temple',
      file:     './images/Backgrounds/AncientTemple.png',
      showShop: false,
    },
    {
      name:     'Crystal Cave',
      file:     './images/Backgrounds/CrystalCave.png',
      showShop: false,
    },
    {
      name:     'Dark Caves',
      file:     './images/Backgrounds/DarkCaves.png',
      showShop: false,
    },
    {
      name:     'Green Forest',
      file:     './images/Backgrounds/GreenForest.png',
      showShop: false,
    },
    {
      name:     'Oak Forest',
      file:     './images/Backgrounds/OakForest.png',
      showShop: false,
    },
    {
      name:     'Sunset Mountain',
      file:     './images/Backgrounds/SunsetMountain.png',
      showShop: false,
    },
    {
      name:     'Trees Night',
      file:     './images/Backgrounds/TreesNight.png',
      showShop: false,
    },
    {
      name:     'Terrace',
      file:     './images/Backgrounds/terrace.png',
      showShop: false,
    },
    {
      name:     'Throne Room',
      file:     './images/Backgrounds/throne room.png',
      showShop: false,
    },
  ];

  // ── Internal state ───────────────────────────────────────────
  let p1MapIndex = 0;
  let p2MapIndex = 0;
  let p1Confirmed = false;
  let p2Confirmed = false;
  let isSPMode    = false;   // single-player: only P1 picks

  // Saved args for after both confirm
  let _p1Key, _p2Key, _difficulty;

  // ── DOM refs ────────────────────────────────────────────────
  const overlay      = document.getElementById('mapSelectOverlay');
  const grid         = document.getElementById('msGrid');
  const previewImg   = document.getElementById('msPreview');
  const previewName  = document.getElementById('msPreviewName');
  const p1PickEl     = document.getElementById('msP1Pick');
  const p2PickEl     = document.getElementById('msP2Pick');
  const p1ReadyEl    = document.getElementById('msP1Ready');
  const p2ReadyEl    = document.getElementById('msP2Ready');
  const p1Label      = document.getElementById('msP1Label');
  const p2Label      = document.getElementById('msP2Label');

  // ── Build the map card grid ──────────────────────────────────
  function buildGrid() {
    grid.innerHTML = '';
    MAPS.forEach((map, i) => {
      const card = document.createElement('div');
      card.className = 'ms-card';
      card.dataset.index = i;

      const thumb = document.createElement('img');
      thumb.src = map.file;
      thumb.className = 'ms-thumb';
      thumb.draggable = false;

      const label = document.createElement('div');
      label.className = 'ms-card-name';
      label.textContent = map.name;

      card.appendChild(thumb);
      card.appendChild(label);

      card.addEventListener('click', () => {
        // Click counts as P1 hover + confirm
        if (!p1Confirmed) {
          p1MapIndex = i;
          p2MapIndex = i;  // keep them in sync on click
          updateHighlights();
          updatePreview(i);
          confirmMap(1);
          if (!isSPMode) confirmMap(2);
        }
      });

      card.addEventListener('mouseenter', () => {
        if (!p1Confirmed) {
          updatePreview(i);
        }
      });

      grid.appendChild(card);
    });
  }

  // ── Update the highlighted cards ────────────────────────────
  function updateHighlights() {
    const cards = grid.querySelectorAll('.ms-card');
    cards.forEach((card, i) => {
      card.classList.remove('ms-p1-hover', 'ms-p2-hover', 'ms-p1-confirmed', 'ms-p2-confirmed', 'ms-both');

      const isP1 = i === p1MapIndex;
      const isP2 = !isSPMode && i === p2MapIndex;

      if (isP1 && isP2) {
        card.classList.add('ms-both');
      } else {
        if (isP1) card.classList.add(p1Confirmed ? 'ms-p1-confirmed' : 'ms-p1-hover');
        if (isP2) card.classList.add(p2Confirmed ? 'ms-p2-confirmed' : 'ms-p2-hover');
      }
    });
  }

  // ── Update the large center preview ──────────────────────────
  function updatePreview(index) {
    const map = MAPS[index];
    if (!map) return;
    previewImg.src   = map.file;
    previewName.textContent = map.name;
  }

  // ── Update the "P1 pick" / "P2 pick" labels ─────────────────
  function updatePickLabels() {
    p1PickEl.textContent = `P1: ${MAPS[p1MapIndex].name}`;
    if (!isSPMode) {
      p2PickEl.textContent = `P2: ${MAPS[p2MapIndex].name}`;
    }
  }

  // ── Confirm a player's map choice ────────────────────────────
  function confirmMap(player) {
    if (player === 1 && !p1Confirmed) {
      p1Confirmed = true;
      p1ReadyEl.style.display = 'block';
      updateHighlights();
    }
    if (player === 2 && !p2Confirmed && !isSPMode) {
      p2Confirmed = true;
      p2ReadyEl.style.display = 'block';
      updateHighlights();
    }

    // Both confirmed (or SP confirmed) → pick map and start
    const bothDone = isSPMode ? p1Confirmed : (p1Confirmed && p2Confirmed);
    if (bothDone) {
      // Resolve map: if both picked same → use it. Different → random between the two.
      let chosenIndex;
      if (isSPMode || p1MapIndex === p2MapIndex) {
        chosenIndex = p1MapIndex;
      } else {
        chosenIndex = Math.random() < 0.5 ? p1MapIndex : p2MapIndex;
      }
      const chosen = MAPS[chosenIndex];

      // Brief flash before hiding
      setTimeout(() => {
        close();
        if (typeof startMatch === 'function') {
          startMatch(_p1Key, _p2Key, _difficulty, chosen.file, chosen.showShop);
        }
      }, 500);
    }
  }

  // ── Keyboard handler ─────────────────────────────────────────
  function onKeyDown(e) {
    if (!overlay || overlay.style.display === 'none') return;

    switch (e.key) {
      // P1: A/D to browse, Space to confirm
      case 'a': case 'A':
        if (!p1Confirmed) {
          p1MapIndex = (p1MapIndex - 1 + MAPS.length) % MAPS.length;
          updateHighlights();
          updatePreview(p1MapIndex);
          updatePickLabels();
        }
        break;
      case 'd': case 'D':
        if (!p1Confirmed) {
          p1MapIndex = (p1MapIndex + 1) % MAPS.length;
          updateHighlights();
          updatePreview(p1MapIndex);
          updatePickLabels();
        }
        break;
      case ' ':
        e.preventDefault();
        confirmMap(1);
        if (isSPMode) confirmMap(2); // SP: space confirms for both
        break;

      // P2: ArrowLeft/Right to browse, Enter to confirm
      case 'ArrowLeft':
        e.preventDefault();
        if (!isSPMode && !p2Confirmed) {
          p2MapIndex = (p2MapIndex - 1 + MAPS.length) % MAPS.length;
          updateHighlights();
          updatePickLabels();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (!isSPMode && !p2Confirmed) {
          p2MapIndex = (p2MapIndex + 1) % MAPS.length;
          updateHighlights();
          updatePickLabels();
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (isSPMode) {
          confirmMap(1);
        } else {
          confirmMap(2);
        }
        break;
    }
  }

  // ── Public: open the map select screen ───────────────────────
  function show(p1Key, p2Key, difficulty) {
    _p1Key      = p1Key;
    _p2Key      = p2Key;
    _difficulty = difficulty;
    isSPMode    = (difficulty !== null && difficulty !== undefined);

    p1MapIndex  = 0;
    p2MapIndex  = 0;
    p1Confirmed = false;
    p2Confirmed = false;

    p1ReadyEl.style.display = 'none';
    p2ReadyEl.style.display = 'none';

    // Update mode labels
    if (isSPMode) {
      p1Label.textContent = '◄ PLAYER 1 ◄';
      p2Label.style.display = 'none';
      p2PickEl.style.display = 'none';
    } else {
      p1Label.textContent = '◄ P1: A/D + SPACE ◄';
      p2Label.textContent = '▶ P2: ◀▶ + ENTER ▶';
      p2Label.style.display = '';
      p2PickEl.style.display = '';
    }

    buildGrid();
    updateHighlights();
    updatePreview(0);
    updatePickLabels();

    overlay.style.display = 'flex';
    window.addEventListener('keydown', onKeyDown);
  }

  // ── Close the overlay ─────────────────────────────────────────
  function close() {
    overlay.style.display = 'none';
    window.removeEventListener('keydown', onKeyDown);
  }

  return { show };
})();
