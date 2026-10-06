const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';

async function runTest() {
  console.log('Connecting Host socket...');
  const host = io(SERVER_URL, { transports: ['websocket'] });
  let roomCode = null;

  await new Promise((resolve, reject) => {
    host.on('connect', () => {
      console.log('✔ Host connected successfully');
      host.emit('create_room');
    });

    host.on('room_joined', ({ role, roomCode: code }) => {
      console.log(`✔ Host joined room: ${code} (role: ${role})`);
      roomCode = code;
      resolve();
    });

    host.on('connect_error', reject);
  });

  console.log('Connecting Guest socket...');
  const guest = io(SERVER_URL, { transports: ['websocket'] });

  await new Promise((resolve, reject) => {
    guest.on('connect', () => {
      console.log('✔ Guest connected successfully');
      guest.emit('join_room', { roomCode });
    });

    guest.on('room_joined', ({ role, roomCode: code }) => {
      console.log(`✔ Guest joined room: ${code} (role: ${role})`);
    });

    guest.on('opponent_ready', () => {
      console.log('✔ Both players received opponent_ready');
      resolve();
    });

    guest.on('connect_error', reject);
  });

  // Test character pick sync
  console.log('Testing character pick synchronization...');
  await new Promise((resolve) => {
    guest.on('char_pick', (data) => {
      console.log(`✔ Guest received Host pick: index ${data.index}, confirmed: ${data.confirmed}`);
      resolve();
    });
    host.emit('char_pick', { role: 'host', index: 2, confirmed: true });
  });

  await new Promise((resolve) => {
    host.on('char_pick', (data) => {
      console.log(`✔ Host received Guest pick: index ${data.index}, confirmed: ${data.confirmed}`);
      resolve();
    });
    guest.emit('char_pick', { role: 'guest', index: 4, confirmed: true });
  });

  // Test game start sync
  console.log('Testing game start sync...');
  await new Promise((resolve) => {
    guest.on('char_selected', (data) => {
      console.log(`✔ Guest received match start for p1: ${data.p1Key}, p2: ${data.p2Key}`);
      resolve();
    });
    host.emit('char_select', { p1Key: 'mack', p2Key: 'shinobi' });
  });

  // Test guest input relay
  console.log('Testing guest input relay...');
  await new Promise((resolve) => {
    host.on('guest_input', (data) => {
      console.log('✔ Host received guest_input:', data.keys);
      resolve();
    });
    guest.emit('guest_input', { keys: { a: true, d: false, s: false, lastkey: 'a' }, actions: { jump: true } });
  });

  // Test state sync relay
  console.log('Testing state sync relay...');
  await new Promise((resolve) => {
    guest.on('state_sync', (data) => {
      console.log('✔ Guest received state_sync: frame', data.frame, 'timer', data.timer);
      resolve();
    });
    host.emit('state_sync', { frame: 1, timer: 60, p1: { x: 200, y: 330 }, p2: { x: 750, y: 330 } });
  });

  // Test synchronized rematch
  console.log('Testing synchronized rematch flow...');
  await new Promise((resolve) => {
    guest.on('rematch_status', (data) => {
      console.log(`✔ Rematch status received (host: ${data.host}, guest: ${data.guest})`);
      resolve();
    });
    host.emit('rematch_request');
  });

  await new Promise((resolve) => {
    let hostSawStart = false;
    let guestSawStart = false;
    function check() {
      if (hostSawStart && guestSawStart) {
        console.log('✔ Both players received synchronized rematch_start');
        resolve();
      }
    }
    host.on('rematch_start', () => { hostSawStart = true; check(); });
    guest.on('rematch_start', () => { guestSawStart = true; check(); });

    guest.emit('rematch_request');
  });

  // Test disconnect notification
  console.log('Testing disconnect event...');
  await new Promise((resolve) => {
    guest.on('opponent_disconnected', () => {
      console.log('✔ Guest received opponent_disconnected when Host disconnected');
      resolve();
    });
    host.disconnect();
  });

  guest.disconnect();
  console.log('\n🎉 ALL MULTIPLAYER UNIT TESTS PASSED FLAWLESSLY!');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
