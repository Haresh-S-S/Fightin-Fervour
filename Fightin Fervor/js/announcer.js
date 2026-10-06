// =========================================================
// FIGHTIN' FERVOR — js/announcer.js
// Announcer Voice System
// Manages announcer voice clips for round announcements,
// match victories, and welcome greetings.
// =========================================================

const Announcer = (() => {
  const SOUND_PATHS = {
    round1:      './Announcer/Round1.mp3',
    round2:      './Announcer/Round2.mp3',
    round3:      './Announcer/Round3.mp3',
    player1Wins: './Announcer/Player1wins.mp3',
    player2Wins: './Announcer/Player2wins.mp3',
    youWon:      './Announcer/you_won.mp3',
    youLose:     './Announcer/you_lose.mp3',
    welcome:     './Announcer/WelcomeToFightinFervor.mp3',
  };

  const audioCache = {};
  let currentAudio = null;
  let hasWelcomed = false;

  // Pre-instantiate and preload audio clips
  Object.keys(SOUND_PATHS).forEach((key) => {
    try {
      const audio = new Audio(SOUND_PATHS[key]);
      audio.preload = 'auto';
      audioCache[key] = audio;
    } catch (e) {
      console.warn('[Announcer] Could not preload sound:', key, e);
    }
  });

  // Stop any ongoing voice line
  function stop() {
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch (e) {
        // ignore pause errors
      }
      currentAudio = null;
    }
  }

  // Play a specific sound key
  function play(key, volume = 0.95) {
    stop();

    const audio = audioCache[key] || new Audio(SOUND_PATHS[key]);
    if (!audio) return;

    try {
      audio.currentTime = 0;
      audio.volume = Math.max(0, Math.min(1, volume));
      currentAudio = audio;

      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((err) => {
          // Autoplay blocked prior to user interaction
          console.warn('[Announcer] Playback prevented for:', key, err);
        });
      }
    } catch (err) {
      console.warn('[Announcer] Play exception:', key, err);
    }
    return audio;
  }

  // Announce Round 1, Round 2, Round 3
  function playRound(roundNumber) {
    if (roundNumber === 1) return play('round1');
    if (roundNumber === 2) return play('round2');
    if (roundNumber === 3) return play('round3');
    return play('round3'); // fallback if overtime
  }

  // Announce match conclusion based on game mode & outcome
  function playMatchEnd(winner, isSinglePlayer, isOnline, onlineRole) {
    if (winner === 0) return; // Draw / Tie

    if (!isSinglePlayer && !isOnline) {
      // 2 Player Local Match
      if (winner === 1) play('player1Wins');
      else if (winner === 2) play('player2Wins');
    } else if (isSinglePlayer) {
      // Singleplayer (vs AI): player 1 is the human
      if (winner === 1) play('youWon');
      else if (winner === 2) play('youLose');
    } else if (isOnline) {
      // Multiplayer: host is player 1, guest is player 2
      const hostWon = winner === 1;
      const guestWon = winner === 2;
      const localWon = (onlineRole === 'host' && hostWon) || (onlineRole === 'guest' && guestWon);

      if (localWon) play('youWon');
      else play('youLose');
    }
  }

  // Play welcome announcement once on first interaction
  function playWelcome() {
    if (hasWelcomed) return;
    hasWelcomed = true;
    play('welcome', 0.9);
  }

  // Listen for first interaction to unlock/trigger welcome if on title screen
  function initInteractionListener() {
    const triggerWelcomeOnFirstGesture = () => {
      window.removeEventListener('click', triggerWelcomeOnFirstGesture);
      window.removeEventListener('keydown', triggerWelcomeOnFirstGesture);
      window.removeEventListener('touchstart', triggerWelcomeOnFirstGesture);

      const menu = document.getElementById('mainMenu');
      if (menu && menu.style.display !== 'none') {
        playWelcome();
      }
    };

    window.addEventListener('click', triggerWelcomeOnFirstGesture, { passive: true });
    window.addEventListener('keydown', triggerWelcomeOnFirstGesture, { passive: true });
    window.addEventListener('touchstart', triggerWelcomeOnFirstGesture, { passive: true });
  }

  if (typeof window !== 'undefined') {
    initInteractionListener();
  }

  return {
    play,
    playRound,
    playMatchEnd,
    playWelcome,
    stop,
    SOUND_PATHS
  };
})();
