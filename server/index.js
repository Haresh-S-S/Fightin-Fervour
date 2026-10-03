// =========================================================
// FIGHTIN' FERVOR — server/index.js
// Socket.io relay server for online multiplayer
//
// Protocol:
//   create_room   → { roomCode }         (host creates)
//   join_room     → { roomCode }         (guest joins)
//   room_joined   ← { role:'host'|'guest', roomCode }
//   room_full     ← { roomCode }         (rejected)
//   room_not_found← { roomCode }
//   opponent_ready← {}                   (both connected)
//   char_select   → { p1Key, p2Key }     (host sends after both pick)
//   char_selected ← { p1Key, p2Key }     (relayed to guest)
//   input         → { frame, keys }      (sent every frame)
//   input         ← { frame, keys }      (relayed from opponent)
//   opponent_disconnected ← {}
//   rematch       → {}                   (either player)
//   rematch       ← {}                   (relayed to opponent)
// =========================================================

const express   = require('express');
const http      = require('http');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// rooms: { [code]: { host: socketId, guest: socketId|null } }
const rooms = new Map();

// Generate a random 4-char room code (uppercase letters)
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';  // no I/O to avoid confusion
  let code;
  do {
    code = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

// Health check endpoint (Railway / Render need this)
app.get('/', (req, res) => res.json({ status: 'ok', rooms: rooms.size }));

io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ── Create room ──────────────────────────────────────────────
  socket.on('create_room', () => {
    const code = generateCode();
    rooms.set(code, { host: socket.id, guest: null });
    socket.join(code);
    socket.roomCode = code;
    socket.role     = 'host';
    socket.emit('room_joined', { role: 'host', roomCode: code });
    console.log(`[room] ${code} created by ${socket.id}`);
  });

  // ── Join room ────────────────────────────────────────────────
  socket.on('join_room', ({ roomCode }) => {
    const code = roomCode.toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('room_not_found', { roomCode: code });
      return;
    }
    if (room.guest) {
      socket.emit('room_full', { roomCode: code });
      return;
    }

    room.guest    = socket.id;
    socket.join(code);
    socket.roomCode = code;
    socket.role     = 'guest';

    socket.emit('room_joined', { role: 'guest', roomCode: code });

    // Notify both players they are connected
    io.to(code).emit('opponent_ready');
    console.log(`[room] ${code} — guest joined: ${socket.id}`);
  });

  // ── Character selection sync (host sends after both choose) ──
  socket.on('char_select', (data) => {
    const code = socket.roomCode;
    if (!code) return;
    // Relay to the other player in the room
    socket.to(code).emit('char_selected', data);
  });

  // ── Input relay (called every frame) ─────────────────────────
  socket.on('input', (data) => {
    const code = socket.roomCode;
    if (!code) return;
    socket.to(code).emit('input', data);
  });

  // ── Rematch request ──────────────────────────────────────────
  socket.on('rematch', () => {
    const code = socket.roomCode;
    if (!code) return;
    socket.to(code).emit('rematch');
  });

  // ── Disconnect ───────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    const code = socket.roomCode;
    if (!code) return;

    const room = rooms.get(code);
    if (room) {
      // Notify remaining player
      socket.to(code).emit('opponent_disconnected');
      rooms.delete(code);
      console.log(`[room] ${code} deleted`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🥊 Fightin' Fervor relay server running on port ${PORT}`);
});
