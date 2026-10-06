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

For online multiplayer:
```bash
cd server
npm install
npm start
```
> **Tip:** Running `npm start` in the `server` directory starts the relay server and also serves the game directly at `http://localhost:3000`. You can also run the game on `http://localhost:8000` or any other local port; the client automatically connects to the relay server on port 3000.

---

## 🎮 Controls

### 1 PLAYER (vs AI)

| Action | Key |
|--------|-----|
| Move Left | `A` |
| Move Right | `D` |
| Jump | `W` |
| Block | `S` (hold) |
| Light Attack | `E` |
| Heavy Attack | `F` |
| Pause / Unpause | `P` |
| Rematch (after match ends) | `R` |

> The AI controls Player 2 automatically. Choose **Normal** or **Hard** difficulty before character select.

---

### 2 PLAYER (Local)

| Action | Player 1 | Player 2 |
|--------|----------|----------|
| Move Left | `A` | `J` |
| Move Right | `D` | `L` |
| Jump | `W` | `I` |
| Block | `S` (hold) | `K` (hold) |
| Light Attack | `E` | `U` |
| Heavy Attack | `F` | `H` |
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

## 🧑‍🤝‍🧑 Character Roster & Combat Frame Data

| Character | Health | Normal Attacks / Chain | Normal Dmg | Normal CD | Heavy Attacks / Window | Heavy Dmg | Heavy CD | Range | Speed | Playstyle |
|-----------|:------:|:----------------------:|:----------:|:---------:|:----------------------:|:---------:|:--------:|:-----:|:-----:|:----------|
| **Mack** (Samurai) | 150 | **1 hit** | 12 | 310 ms | **1 hit** | 18 | 620 ms | 157 px | 6 | Balanced mid-range all-rounder |
| **Ninja Lady** | 140 | **2-hit chain** | 8 | 180 ms | **1 hit** | 12 | 360 ms | 90 px | 9 | Ultra-fast rushdown & disengage |
| **Shinobi** | 140 | **3-hit chain** | 12 | 380 ms | **1 hit** | 18 | 760 ms | 110 px | 5 | Balanced high-damage martial artist |
| **Shogun** | 150 | **3-hit chain** | 13 | 450 ms | **1 hit** | 20 | 900 ms | 120 px | 4 | Heavy space controller & punish tank |
| **Vampire** | 160 | **3-hit chain** | 9 | 260 ms | **1 hit** | 14 | 520 ms | 115 px | 7 | Nimble mid-range spacing specialist |
| **Zombie** | 140 | **3-hit chain** | 6 | 210 ms | **1 hit** | 9 | 420 ms | 80 px | 8 | Rapid low-damage swarm brawler |
| **Homeless Guy** (Drunk) | 165 | **2-hit chain** | 9 | 360 ms | **1 hit** | 14 | 720 ms | 85 px | 5 | High-health unpredictable tank |

> **Normal (Light) Attack Rules:**
> - Each character can string up to their designated chain count (`1`, `2`, or `3` attacks) in rhythm.
> - After the chain finishes, the fighter enters recovery for their **Normal CD** before another light attack can be initiated.
>
> **Heavy Attack Rules:**
> - Heavy attack (`F` or `H`) winds up for 120ms and delivers a single crushing strike dealing **1.5× damage**.
> - Executing a heavy attack locks out **both heavy AND light attacks** for the entire **Heavy CD** window (always 2× the normal CD).
> - Heavy attacks crack grounded shields into a 36-frame (~0.6s) Guard Break stagger!

---

### Detailed Character Breakdowns

#### ⚔️ Mack (Samurai Mack)
- **Health:** 150
- **Normal Attacks per Phase:** 1 single strike (12 dmg)
- **Normal Attack Cooldown:** 310 ms
- **Heavy Attack:** 1 strike (18 dmg) with 620 ms cooldown
- **Reach & Speed:** 157 px range (longest single katana reach) · Speed 6
- **Strengths:** Great range and poke timing; consistent mid-range space control.

#### 🥷 Ninja Lady
- **Health:** 140
- **Normal Attacks per Phase:** 2-hit combo string (`Attack_1` → `Attack_2`, 8 dmg per hit)
- **Normal Attack Cooldown:** 180 ms *(fastest recovery in the game)*
- **Heavy Attack:** 1 strike (12 dmg) with 360 ms cooldown
- **Reach & Speed:** 90 px range · Speed 9 *(fastest movement in the game)*
- **Strengths:** Blazing speed, rapid hit-and-run combos. Fragile health requires avoiding trades.

#### 🗡️ Shinobi
- **Health:** 140 *(Rebalanced from 180)*
- **Normal Attacks per Phase:** 3-hit combo string (`Attack_1` → `Attack_2` → `Attack_3`, 12 dmg per hit, rebalanced from 15)
- **Normal Attack Cooldown:** 380 ms
- **Heavy Attack:** 1 strike (18 dmg) with 760 ms cooldown
- **Reach & Speed:** 110 px range · Speed 5
- **Strengths:** Fluid 3-hit light rhythm and strong punishing heavy attack.

#### 🏯 Shogun
- **Health:** 150
- **Normal Attacks per Phase:** 3-hit combo string (`Attack_1` → `Attack_2` → `Attack_3`, 13 dmg per hit, rebalanced from 14)
- **Normal Attack Cooldown:** 450 ms *(longest light recovery)*
- **Heavy Attack:** 1 strike (20 dmg) with 900 ms cooldown
- **Reach & Speed:** 120 px range · Speed 4 *(slowest movement)*
- **Strengths:** Huge reach and highest single-hit heavy damage. Punishes whiffed attacks heavily.

#### 🧛 Vampire
- **Health:** 160
- **Normal Attacks per Phase:** 3-hit combo string (`Attack_1` → `Attack_2` → `Attack_3`, 9 dmg per hit)
- **Normal Attack Cooldown:** 260 ms
- **Heavy Attack:** 1 strike (14 dmg) with 520 ms cooldown
- **Reach & Speed:** 115 px range · Speed 7
- **Strengths:** High mobility, generous reach, and balanced damage output.

#### 🧟 Zombie
- **Health:** 140
- **Normal Attacks per Phase:** 3-hit combo string (`Attack_1` → `Attack_2` → `Attack_3`, 6 dmg per hit)
- **Normal Attack Cooldown:** 210 ms
- **Heavy Attack:** 1 strike (9 dmg) with 420 ms cooldown
- **Reach & Speed:** 80 px range · Speed 8
- **Strengths:** Rapid close-quarters swarming with short recovery times.

#### 🍺 Homeless Guy (Drunk)
- **Health:** 165 *(highest health in the roster)*
- **Normal Attacks per Phase:** 2-hit combo string (`Attack_1` → `Attack_2`, 9 dmg per hit, rebalanced from 7)
- **Normal Attack Cooldown:** 360 ms
- **Heavy Attack:** 1 strike (14 dmg) with 720 ms cooldown
- **Reach & Speed:** 85 px range · Speed 5
- **Strengths:** Substantial durability and deceptive, erratic swing animations.

---

## 🗺️ Arenas / Battlegrounds

- **The Shop** (features interactive background NPC shopkeeper)
- **Ancient Temple**
- **Crystal Cave**
- **Dark Caves**
- **Green Forest**
- **Oak Forest**
- **Sunset Mountain**
- **Trees Night**
- **Terrace**
- **Throne Room**

---

## 🌐 How to Publish This Game on the Internet

### Option 1: Deploying to Netlify (Free Static Hosting)

The game client (`Fightin Fervor/`) is a pure web frontend (HTML5, Vanilla JavaScript, CSS, audio, and sprites). You can host it on Netlify in under 2 minutes:

#### Method A: Drag-and-Drop Deploy (No Command Line Needed)
1. Sign up or log in at [netlify.com](https://www.netlify.com).
2. Go to the **Sites** tab and look for the section **"Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"**.
3. Drag the **`Fightin Fervor`** folder from your computer and drop it into the Netlify dashboard.
4. Netlify will deploy it instantly and provide you with a live URL (e.g. `https://peaceful-fighter-1234.netlify.app`).

#### Method B: Deploy from GitHub / Git
1. Push your repository to GitHub.
2. In Netlify, click **"Add new site" → "Import an existing project" → GitHub**.
3. Select this repository.
4. Set the build configuration:
   - **Base directory:** *(leave blank or set to `.`)*
   - **Build command:** *(leave blank — no build step required)*
   - **Publish directory:** `Fightin Fervor`
5. Click **Deploy Site**. Netlify will build and deploy your game automatically on every push!

> **Note on Multiplayer with Netlify:**  
> Single-player (vs AI) and Local 2-Player will work immediately on Netlify. However, real-time online multiplayer requires a WebSocket connection to the Node.js server. See Option 2 below to host the multiplayer relay server.

---

### Option 2: Deploying Online Multiplayer Server (Free on Render or Railway)

To enable online multiplayer across the public internet:

#### Deploying on Render (Free Web Service)
1. Sign up at [render.com](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Fill in the settings:
   - **Name:** `fightin-fervor-server`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. Click **Create Web Service**. Render will assign a public HTTPS URL (e.g., `https://fightin-fervor-server.onrender.com`).
6. Because the server already serves static assets on port 3000, **Render can host BOTH the multiplayer server AND the game itself at that single URL!**

#### Connecting the Netlify Client to Your Remote Multiplayer Server
If you deployed the frontend on Netlify and the server on Render:
1. Open `Fightin Fervor/js/online.js`.
2. Notice the auto-detect fallback list in `_serverUrl`:
   ```javascript
   const REMOTE_SERVER = 'https://fightin-fervor-server.onrender.com'; // Replace with your Render URL
   ```
   Or set `window.MULTIPLAYER_SERVER_URL = 'https://your-server.onrender.com'` in `index.html`.
3. Your Netlify game will now connect live to your Render multiplayer server!

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
│   │   ├── characterSelect.js  # Interactive character selection logic
│   │   ├── mapSelect.js        # Map/arena selection screen
│   │   ├── ai.js               # AI brain (Normal / Hard profiles)
│   │   ├── sfx.js              # Web Audio sound effects
│   │   ├── effects.js          # Hit particles, damage text, screen shake
│   │   ├── online.js           # Socket.io online multiplayer client
│   │   └── utils.js            # Collisions, timers, win state
│   └── images/                 # Sprites, animations, and map backgrounds
└── server/                     # Multiplayer Node.js socket server & static host
```
