// =========================================================
// FIGHTIN' FERVOR — js/online.js
// Online multiplayer client module — Socket.io wrapper
// =========================================================

const ONLINE = (() => {
  // ── Auto-detect Socket.io relay server URL ──────────────────
  const SERVER_URL = (() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('server')) return urlParams.get('server');
    } catch (e) {}

    if (location.protocol === 'file:') return 'http://localhost:3000';
    if (location.port === '3000') return location.origin;
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      return `http://${location.hostname}:3000`;
    }
    return location.origin;
  })();

  let _socket = null;
  let _connectErrorCb = null;

  // ── Guard: ensure socket.io is loaded ────────────────────────
  function _ioAvailable() {
    if (typeof io === 'undefined') {
      const msg = 'Socket.io client failed to load.';
      console.error('[ONLINE]', msg);
      if (_connectErrorCb) _connectErrorCb(msg);
      return false;
    }
    return true;
  }

  function _ensureConnected() {
    if (!_ioAvailable()) return null;
    if (_socket && _socket.connected) return _socket;
    if (_socket) {
      _socket.connect();
      return _socket;
    }

    _socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 8000,
    });

    _socket.on('connect_error', (err) => {
      const msg = `Cannot reach server at ${SERVER_URL}. Is the relay server running? (${err.message})`;
      console.error('[ONLINE] connect_error:', err);
      if (_connectErrorCb) _connectErrorCb(msg);
    });

    _socket.on('connect_timeout', () => {
      const msg = `Connection timed out connecting to ${SERVER_URL}.`;
      console.error('[ONLINE] connect_timeout');
      if (_connectErrorCb) _connectErrorCb(msg);
    });

    return _socket;
  }

  // ── Room management ───────────────────────────────────────────
  function createRoom() {
    const s = _ensureConnected();
    if (!s) return;
    if (s.connected) {
      s.emit('create_room');
    } else {
      s.once('connect', () => s.emit('create_room'));
    }
  }

  function joinRoom(code) {
    const s = _ensureConnected();
    if (!s) return;
    const normalized = String(code).toUpperCase().trim();
    if (s.connected) {
      s.emit('join_room', { roomCode: normalized });
    } else {
      s.once('connect', () => s.emit('join_room', { roomCode: normalized }));
    }
  }

  // ── Character Selection ───────────────────────────────────────
  function sendCharPick(data) {
    if (!_socket || !_socket.connected) return;
    _socket.emit('char_pick', data);
  }

  function sendCharSelect(p1Key, p2Key, mapPath, mapShowShop, mapMusic) {
    if (!_socket || !_socket.connected) return;
    _socket.emit('char_select', { p1Key, p2Key, mapPath, mapShowShop, mapMusic });
  }

  // ── In-Game Communication ─────────────────────────────────────
  // Guest sending input state to host
  function sendGuestInput(data) {
    if (!_socket || !_socket.connected) return;
    _socket.emit('guest_input', data);
  }

  // Legacy input send
  function sendInput(frame, keysSnapshot, actions) {
    if (!_socket || !_socket.connected) return;
    _socket.emit('input', { frame, keys: keysSnapshot, actions });
  }

  // Host broadcasting authoritative snapshot to guest
  function sendStateSync(snapshot) {
    if (!_socket || !_socket.connected) return;
    _socket.emit('state_sync', snapshot);
  }

  // Rematch request
  function sendRematch() {
    if (!_socket || !_socket.connected) return;
    _socket.emit('rematch_request');
  }

  function disconnect() {
    if (_socket) {
      _socket.disconnect();
      _socket = null;
    }
  }

  // ── Event subscriptions ───────────────────────────────────────
  function _on(event, cb) {
    const s = _ensureConnected();
    if (!s) return;
    s.off(event);
    if (cb) s.on(event, cb);
  }

  function onRoomJoined(cb)           { _on('room_joined',            cb); }
  function onRoomNotFound(cb)         { _on('room_not_found',         cb); }
  function onRoomFull(cb)             { _on('room_full',              cb); }
  function onOpponentReady(cb)        { _on('opponent_ready',         cb); }
  function onCharPick(cb)             { _on('char_pick',              cb); }
  function onCharSelected(cb)         { _on('char_selected',          cb); }
  function onGuestInput(cb)           { _on('guest_input',            cb); }
  function onOpponentInput(cb)        { _on('input',                  cb); }
  function onStateSync(cb)            { _on('state_sync',             cb); }
  function onRematchStatus(cb)        { _on('rematch_status',         cb); }
  function onRematchStart(cb)         { _on('rematch_start',          cb); }
  function onRematch(cb)              { _on('rematch',                cb); }
  function onOpponentDisconnected(cb) { _on('opponent_disconnected',  cb); }
  function onConnectError(cb)         { _connectErrorCb = cb; }

  return {
    createRoom,
    joinRoom,
    sendCharPick,
    sendCharSelect,
    sendGuestInput,
    sendInput,
    sendStateSync,
    sendRematch,
    disconnect,
    onRoomJoined,
    onRoomNotFound,
    onRoomFull,
    onOpponentReady,
    onCharPick,
    onCharSelected,
    onGuestInput,
    onOpponentInput,
    onStateSync,
    onRematchStatus,
    onRematchStart,
    onRematch,
    onOpponentDisconnected,
    onConnectError,
  };
})();
