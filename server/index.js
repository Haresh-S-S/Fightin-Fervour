// =========================================================
// FIGHTIN' FERVOR — server/index.js
// Socket.io relay server for online multiplayer
// =========================================================

const express    = require('express');
const http       = require('http');
const path       = require('path');
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

// Serve game static assets if opened directly at http://localhost:3000
const staticDir = path.join(__dirname, '..', 'Fightin Fervor');
app.use(express.static(staticDir));

// Health check endpoint (Railway / Render need this)
app.get('/health', (req, res) => res.json({ status: 'ok', rooms: rooms.size }));

// rooms: Map<string, { host: string, guest: string|null, hostRematch: boolean, guestRematch: boolean }>
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

io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ── Create room ──────────────────────────────────────────────
  socket.on('create_room', () => {
    const code = generateCode();
    rooms.set(code, {
      host: socket.id,
      guest: null,
      hostRematch: false,
      guestRematch: false,
    });
    socket.join(code);
    socket.roomCode = code;
    socket.role     = 'host';
    socket.emit('room_joined', { role: 'host', roomCode: code });
    console.log(`[room] ${code} created by ${socket.id}`);
  });

  // ── Join room ────────────────────────────────────────────────
  socket.on('join_room', ({ roomCode }) => {
    if (!roomCode) {
      socket.emit('room_not_found', { roomCode: '' });
      return;
    }
    const code = String(roomCode).toUpperCase().trim();
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

  // ── Character selection pick updates (real-time hover/lock-in) ──
  socket.on('char_pick', (data) => {
    const code = socket.roomCode;
    if (!code) return;
    socket.to(code).emit('char_pick', data);
  });

  // ── Character selection complete (host sends after both choose) ──
  socket.on('char_select', (data) => {
    const code = socket.roomCode;
    if (!code) return;
    socket.to(code).emit('char_selected', data);
  });

  // ── Guest inputs sent to host (authoritative simulation) ───
  socket.on('guest_input', (data) => {
    const code = socket.roomCode;
    if (!code) return;
    socket.to(code).emit('guest_input', data);
  });

  // Legacy input relay alias
  socket.on('input', (data) => {
    const code = socket.roomCode;
    if (!code) return;
    socket.to(code).emit('input', data);
  });

  // ── Host authoritative state broadcast ─────────────────────
  socket.on('state_sync', (data) => {
    const code = socket.roomCode;
    if (!code) return;
    socket.to(code).emit('state_sync', data);
  });

  // ── Rematch request handling ───────────────────────────────
  socket.on('rematch_request', () => {
    const code = socket.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    if (socket.role === 'host')  room.hostRematch = true;
    if (socket.role === 'guest') room.guestRematch = true;

    io.to(code).emit('rematch_status', {
      host: !!room.hostRematch,
      guest: !!room.guestRematch,
    });

    if (room.hostRematch && room.guestRematch) {
      room.hostRematch  = false;
      room.guestRematch = false;
      io.to(code).emit('rematch_start');
    }
  });

  // Legacy rematch alias
  socket.on('rematch', () => {
    const code = socket.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    if (socket.role === 'host')  room.hostRematch = true;
    if (socket.role === 'guest') room.guestRematch = true;

    io.to(code).emit('rematch_status', {
      host: !!room.hostRematch,
      guest: !!room.guestRematch,
    });

    if (room.hostRematch && room.guestRematch) {
      room.hostRematch  = false;
      room.guestRematch = false;
      io.to(code).emit('rematch_start');
    }
  });

  // ── Disconnect ─────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    const code = socket.roomCode;
    if (!code) return;

    const room = rooms.get(code);
    if (room) {
      socket.to(code).emit('opponent_disconnected');
      rooms.delete(code);
      console.log(`[room] ${code} deleted`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🥊 Fightin' Fervor relay server running on port ${PORT}`);
});
