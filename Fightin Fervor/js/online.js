// =========================================================
// FIGHTIN' FERVOR — js/online.js
// Online multiplayer module — wraps Socket.io
//
// Public API:
//   ONLINE.createRoom()
//   ONLINE.joinRoom(code)
//   ONLINE.sendInput(frame, keysSnapshot, actions)
//   ONLINE.sendCharSelect(p1Key, p2Key)
//   ONLINE.sendRematch()
//   ONLINE.disconnect()
//   ONLINE.onRoomJoined(cb)      cb({ role, roomCode })
//   ONLINE.onRoomNotFound(cb)
//   ONLINE.onRoomFull(cb)
//   ONLINE.onOpponentReady(cb)
//   ONLINE.onOpponentInput(cb)   cb({ frame, keys, actions })
//   ONLINE.onCharSelected(cb)    cb({ p1Key, p2Key })
//   ONLINE.onRematch(cb)
//   ONLINE.onOpponentDisconnected(cb)
//   ONLINE.onConnectError(cb)    cb(errorMessage)
//
// The server URL is auto-detected:
//   • If the page is served via HTTP (not file://), use same origin.
//   • Otherwise fall back to localhost:3000.
// =========================================================

const ONLINE = (() => {
  // ── Server URL detection ──────────────────────────────────────
  const SERVER_URL = (() => {
    if (location.protocol === 'file:') return 'http://localhost:3000';
    return location.origin;
  })();

  let _socket = null;
  let _connectErrorCb = null;

  // ── Safety guard: check that socket.io CDN loaded ─────────────
  function _ioAvailable() {
    if (typeof io === 'undefined') {
      const msg = 'Socket.io failed to load. Check your internet connection.';
      console.error('[ONLINE]', msg);
      if (_connectErrorCb) _connectErrorCb(msg);
      return false;
    }
    return true;
  }

  // Lazy connect — only opens the WebSocket when actually needed
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

    // ── Connection error handling ─────────────────────────────
    _socket.on('connect_error', (err) => {
      const msg = `Cannot reach server at ${SERVER_URL}. Is the relay server running? (${err.message})`;
      console.error('[ONLINE] connect_error:', err);
      if (_connectErrorCb) _connectErrorCb(msg);
    });

    _socket.on('connect_timeout', () => {
      const msg = `Connection timed out. Is the relay server running at port 3000?`;
      console.error('[ONLINE] connect_timeout');
      if (_connectErrorCb) _connectErrorCb(msg);
    });

    return _socket;
  }

  // ── Room management ───────────────────────────────────────────
  function createRoom() {
    const s = _ensureConnected();
    if (!s) return;
    // Wait for connection before emitting (handles cold-start)
    if (s.connected) {
      s.emit('create_room');
    } else {
      s.once('connect', () => s.emit('create_room'));
    }
  }

  function joinRoom(code) {
    const s = _ensureConnected();
    if (!s) return;
    const normalized = code.toUpperCase().trim();
    if (s.connected) {
      s.emit('join_room', { roomCode: normalized });
    } else {
      s.once('connect', () => s.emit('join_room', { roomCode: normalized }));
    }
  }

  // ── In-game communication ─────────────────────────────────────
  function sendInput(frame, keysSnapshot, actions) {
    if (!_socket || !_socket.connected) return;
    _socket.emit('input', { frame, keys: keysSnapshot, actions });
  }

  function sendCharSelect(p1Key, p2Key) {
    if (!_socket || !_socket.connected) return;
    _socket.emit('char_select', { p1Key, p2Key });
  }

  function sendRematch() {
    if (!_socket || !_socket.connected) return;
    _socket.emit('rematch');
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
  function onOpponentInput(cb)        { _on('input',                  cb); }
  function onCharSelected(cb)         { _on('char_selected',          cb); }
  function onRematch(cb)              { _on('rematch',                cb); }
  function onOpponentDisconnected(cb) { _on('opponent_disconnected',  cb); }

  // Connection error is special — stored as a callback, not a socket event
  function onConnectError(cb)         { _connectErrorCb = cb; }

  // ── Public API ────────────────────────────────────────────────
  return {
    createRoom,
    joinRoom,
    sendInput,
    sendCharSelect,
    sendRematch,
    disconnect,
    onRoomJoined,
    onRoomNotFound,
    onRoomFull,
    onOpponentReady,
    onOpponentInput,
    onCharSelected,
    onRematch,
    onOpponentDisconnected,
    onConnectError,
  };
})();
