// =========================================================
// FIGHTIN' FERVOR — music.js
// Background Music (BGM) Manager
//
// Features:
// - Seamless menu music across Title Screen, Main Menu,
//   Character Select, and Map Select.
// - Per-stage combat music for all 10 battle arenas:
//     • Dark Caves       -> DarkCaves.m4a
//     • Ancient Temple   -> AncientTemple.m4a
//     • Crystal Cave     -> CrystalCave.m4a
//     • Green Forest     -> GreenForest.m4a
//     • Oak Forest       -> OakForest.m4a
//     • The Shop         -> OakForest.m4a
//     • Sunset Mountain  -> SunsetMountain.m4a
//     • Trees Night      -> TreesNight.m4a
//     • Terrace          -> terrace.m4a
//     • Throne Room      -> throneroom.m4a
// - Smooth volume cross-fades between tracks.
// - Handles modern browser autoplay policy auto-unlock on first user interaction.
// - UI mute button and persistent mute state in localStorage.
// =========================================================

const BGM = (() => {
  const MENU_TRACK = './BackgroundMusic/menu.m4a';

  const STAGE_TRACKS = {
    // Map names
    'The Shop':        './BackgroundMusic/OakForest.m4a',
    'Ancient Temple':  './BackgroundMusic/AncientTemple.m4a',
    'Crystal Cave':    './BackgroundMusic/CrystalCave.m4a',
    'Dark Caves':      './BackgroundMusic/DarkCaves.m4a',
    'Green Forest':    './BackgroundMusic/GreenForest.m4a',
    'Oak Forest':      './BackgroundMusic/OakForest.m4a',
    'Sunset Mountain': './BackgroundMusic/SunsetMountain.m4a',
    'Trees Night':     './BackgroundMusic/TreesNight.m4a',
    'Terrace':         './BackgroundMusic/terrace.m4a',
    'Throne Room':     './BackgroundMusic/throneroom.m4a',

    // Stage image files
    './images/background.png':                './BackgroundMusic/OakForest.m4a',
    './images/Backgrounds/AncientTemple.png':  './BackgroundMusic/AncientTemple.m4a',
    './images/Backgrounds/CrystalCave.png':    './BackgroundMusic/CrystalCave.m4a',
    './images/Backgrounds/DarkCaves.png':      './BackgroundMusic/DarkCaves.m4a',
    './images/Backgrounds/GreenForest.png':    './BackgroundMusic/GreenForest.m4a',
    './images/Backgrounds/OakForest.png':      './BackgroundMusic/OakForest.m4a',
    './images/Backgrounds/SunsetMountain.png': './BackgroundMusic/SunsetMountain.m4a',
    './images/Backgrounds/TreesNight.png':     './BackgroundMusic/TreesNight.m4a',
    './images/Backgrounds/terrace.png':        './BackgroundMusic/terrace.m4a',
    './images/Backgrounds/throne room.png':    './BackgroundMusic/throneroom.m4a',
  };

  let currentAudio = null;
  let currentTrack = null;
  const targetVolume = 0.38;
  let isMuted = localStorage.getItem('ff_bgm_muted') === 'true';
  let isUnlocked = false;
  let pendingTrack = null;
  let fadeTimer = null;

  // Resolve map identifier or file to audio file path
  function resolveTrack(id) {
    if (!id || typeof id !== 'string') return MENU_TRACK;
    if (id === 'menu' || id.toLowerCase().includes('menu')) return MENU_TRACK;

    // Direct dictionary lookup
    if (STAGE_TRACKS[id]) return STAGE_TRACKS[id];

    // If it already points to a sound file
    if (id.endsWith('.m4a') || id.endsWith('.mp3')) {
      if (id.startsWith('./') || id.startsWith('/') || id.startsWith('BackgroundMusic')) {
        return id.startsWith('./') ? id : './' + id;
      }
      return './BackgroundMusic/' + id;
    }

    // Normalised search
    const cleanId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, track] of Object.entries(STAGE_TRACKS)) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey.includes(cleanId) || cleanId.includes(cleanKey)) {
        return track;
      }
    }

    return './BackgroundMusic/OakForest.m4a';
  }

  // Play audio track with cross-fade
  function play(trackId) {
    const resolved = resolveTrack(trackId);

    // If already playing this exact track and not paused, keep playing
    if (currentTrack === resolved && currentAudio && !currentAudio.paused) {
      return;
    }

    pendingTrack = resolved;
    const effectiveVol = isMuted ? 0 : targetVolume;

    // Fade out previous track
    if (currentAudio) {
      const prevAudio = currentAudio;
      clearInterval(fadeTimer);
      const step = (prevAudio.volume || targetVolume) / 8;
      const fader = setInterval(() => {
        if (prevAudio.volume > step) {
          prevAudio.volume = Math.max(0, prevAudio.volume - step);
        } else {
          clearInterval(fader);
          prevAudio.pause();
          prevAudio.src = '';
        }
      }, 35);
    }

    const audio = new Audio(resolved);
    audio.loop = true;
    audio.volume = 0;
    currentAudio = audio;
    currentTrack = resolved;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isUnlocked = true;
          clearInterval(fadeTimer);
          if (effectiveVol > 0) {
            let vol = 0;
            fadeTimer = setInterval(() => {
              vol = Math.min(effectiveVol, vol + effectiveVol / 8);
              if (currentAudio === audio) audio.volume = vol;
              if (vol >= effectiveVol) clearInterval(fadeTimer);
            }, 35);
          } else {
            audio.volume = 0;
          }
        })
        .catch(() => {
          // Autoplay blocked by browser policy; wait for first user gesture
          _setupAutoUnlock();
        });
    }
  }

  function playMenu() {
    play(MENU_TRACK);
  }

  function playStage(mapOrTrack) {
    play(mapOrTrack);
  }

  function stop() {
    clearInterval(fadeTimer);
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    currentTrack = null;
    pendingTrack = null;
  }

  function setMuted(muted) {
    isMuted = !!muted;
    localStorage.setItem('ff_bgm_muted', isMuted ? 'true' : 'false');
    if (currentAudio) {
      currentAudio.volume = isMuted ? 0 : targetVolume;
    }
    _updateUiButton();
  }

  function toggleMute() {
    setMuted(!isMuted);
    return isMuted;
  }

  function unlock() {
    if (isUnlocked) return;
    isUnlocked = true;
    if (pendingTrack || currentTrack) {
      play(pendingTrack || currentTrack);
    } else {
      playMenu();
    }
  }

  function _setupAutoUnlock() {
    const handler = () => {
      unlock();
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
      window.removeEventListener('touchstart', handler);
    };
    window.addEventListener('click', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    window.addEventListener('touchstart', handler, { once: true });
  }

  function _updateUiButton() {
    const btn = document.getElementById('bgmToggleBtn');
    if (btn) {
      btn.innerHTML = isMuted
        ? '<span class="bgm-icon">🔇</span><span>MUSIC OFF</span>'
        : '<span class="bgm-icon">🔊</span><span>MUSIC ON</span>';
      btn.title = isMuted ? 'Unmute Background Music (P)' : 'Mute Background Music (P)';
      btn.classList.toggle('muted', isMuted);
    }
  }

  function init() {
    _updateUiButton();
    _setupAutoUnlock();
    playMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    play,
    playMenu,
    playStage,
    stop,
    toggleMute,
    setMuted,
    isMuted: () => isMuted,
    getMusicForMap: resolveTrack,
    unlock,
    init,
  };
})();
