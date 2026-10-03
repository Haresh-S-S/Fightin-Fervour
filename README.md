# ⚔️ FIGHTIN' FERVOUR

A feature-packed 2D browser fighting game featuring 7 distinct playable characters, custom victory animations, multiple arena battlegrounds, single-player AI (Normal & Hard), local 2-player mode, and online multiplayer.

---

## 🚀 How to Run Locally

You can run Fightin' Fervour using any local HTTP server:

```bash
# Option 1: Using Python
cd "Fightin Fervor"
python -m http.server 8000

# Option 2: Using Node (npx serve or http-server)
cd "Fightin Fervor"
npx serve .
```

Then open `http://localhost:8000` in your web browser.

For online multiplayer, run the socket relay server:
```bash
cd server
npm install
npm start
```

---

## 🎮 Controls

### 1 PLAYER (vs AI)

| Action | Key |
|--------|-----|
| Move Left | `A` |
| Move Right | `D` |
| Jump | `W` |
| Block | `S` (hold) |
| Light Attack | `SPACE` |
| Heavy Attack | `F` |
| Pause / Unpause | `P` |
| Rematch (after match ends) | `R` |

> The AI controls Player 2 automatically. Choose **Normal** or **Hard** difficulty before character select.

---

### 2 PLAYER (Local)

| Action | Player 1 | Player 2 |
|--------|----------|----------|
| Move Left | `A` | `← Arrow Left` |
| Move Right | `D` | `→ Arrow Right` |
| Jump | `W` | `↑ Arrow Up` |
| Block | `S` (hold) | `↓ Arrow Down` (hold) |
| Light Attack | `SPACE` | `Enter` |
| Heavy Attack | `F` | `/` |
| Pause / Unpause | `P` | `P` |
| Rematch (after match ends) | `R` | `R` |

---

## ⚔️ Combat System

| Mechanic | Description |
|----------|-------------|
| **Light Attack** | Fast, lower damage. Chains into combos. |
| **Heavy Attack** | Slow startup (120ms windup), 1.5× damage, breaks blocks. |
| **Block** | Reduces all damage to 12% chip. Hold while grounded. |
| **Guard Break** | Heavy attack on a blocking opponent staggers them for ~0.6s. |
| **Combo** | Land 4 hits in a row for a **LAUNCHER** — sends enemy airborne! |
| **Diminishing Returns** | Each hit in a combo deals less stun (hit 1: 100% → hit 3: 30%). |
| **Attack Cooldown** | Recovery window before the fighter can attack again. |
| **Heavy Cooldown** | Always 2× the light cooldown for the same character. |
| **Match Format** | Best of 3 rounds · 60-second timer per round. |
| **Victory Celebration** | Smooth 2-second custom victory animation sequence upon winning. |

---

## 🧑‍🤝‍🧑 Character Roster

| Character | Health | Damage | Range | Speed | Light CD | Heavy CD | Playstyle |
|-----------|-------:|-------:|------:|------:|---------:|---------:|-----------|
| **Mack** (Samurai) | 150 | 12 | 157 px | 6 | 310 ms | 620 ms | Balanced all-rounder |
| **Ninja Lady** | 140 | 8 | 90 px | 9 | 180 ms | 360 ms | Fastest — hit-and-run rushdown |
| **Shinobi** | 180 | 15 | 110 px | 5 | 380 ms | 760 ms | High damage, punishing commit |
| **Shogun** | 150 | 14 | 120 px | 4 | 450 ms | 900 ms | Widest reach, space control |
| **Vampire** | 160 | 9 | 115 px | 7 | 260 ms | 520 ms | Nimble mid-ranger |
| **Zombie** | 140 | 6 | 80 px | 8 | 210 ms | 420 ms | Rapid swarm pressure |
| **Homeless Guy** | 165 | 7 | 85 px | 5 | 360 ms | 720 ms | High durability brawler |

---

## 🗺️ Arenas / Battlegrounds

- The Shop
- Ancient Temple
- Crystal Cave
- Dark Caves
- Green Forest
- Oak Forest
- Sunset Mountain
- Trees Night
- **Terrace**
- **Throne Room**

---

## 📁 Project Structure

```
Fightin_Fervor/
├── Fightin Fervor/
│   ├── index.html              # Game shell, HUD, overlays
│   ├── index.js                # Main game loop, input, round/match flow
│   ├── style.css               # Visual styling, HUD, animations
│   ├── js/
│   │   ├── classes.js          # Sprite & Fighter engine (physics, combat, victory timing)
│   │   ├── characters.js       # Character registry, stats, and victory animations
│   │   ├── characterSelect.js  # Character selection screen logic
│   │   ├── mapSelect.js        # Map/arena selection screen
│   │   ├── ai.js               # AI brain (Normal / Hard profiles)
│   │   ├── sfx.js              # Web Audio sound effects
│   │   ├── effects.js          # Hit particles, damage text, screen shake
│   │   ├── online.js           # Socket.io online multiplayer client
│   │   └── utils.js            # Collisions, timers, win state
│   └── images/                 # Sprites, animations, and map backgrounds
└── server/                     # Multiplayer Node.js socket server
```
