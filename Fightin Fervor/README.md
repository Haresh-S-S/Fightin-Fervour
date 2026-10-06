# ⚔️ FIGHTIN' FERVOR

A 2D browser fighting game with 7 playable characters, single-player AI, and local 2-player modes.

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
| **Attack Cooldown** | After every attack finishes, there is a recovery window before the fighter can attack again. Faster characters have shorter cooldowns; heavy/slow characters have longer ones. |
| **Heavy Cooldown** | Always 2× the light cooldown for the same character. |
| **Match Format** | Best of 3 rounds · 60-second timer per round. |

---

## 🧑‍🤝‍🧑 Character Roster

Stats at a glance:

| Character | Health | Normal Attacks / Chain | Normal Dmg | Normal CD | Heavy Attacks / Window | Heavy Dmg | Heavy CD | Range | Speed | Playstyle |
|-----------|:------:|:----------------------:|:----------:|:---------:|:----------------------:|:---------:|:--------:|:-----:|:-----:|:----------|
| **Mack** (Samurai) | 150 | **1 hit** | 12 | 310 ms | **1 hit** | 18 | 620 ms | 157 px | 6 | Balanced all-rounder |
| **Ninja Lady** | 140 | **2-hit chain** | 8 | 180 ms | **1 hit** | 12 | 360 ms | 90 px | 9 | Fastest — hit-and-run rushdown |
| **Shinobi** | 140 | **3-hit chain** | 12 | 380 ms | **1 hit** | 18 | 760 ms | 110 px | 5 | Balanced high-damage martial artist |
| **Shogun** | 150 | **3-hit chain** | 13 | 450 ms | **1 hit** | 20 | 900 ms | 120 px | 4 | Slowest — widest reach, space control |
| **Vampire** | 160 | **3-hit chain** | 9 | 260 ms | **1 hit** | 14 | 520 ms | 115 px | 7 | Nimble mid-ranger |
| **Zombie** | 140 | **3-hit chain** | 6 | 210 ms | **1 hit** | 9 | 420 ms | 80 px | 8 | Rapid low-damage swarm pressure |
| **Homeless Guy** (Drunk) | 165 | **2-hit chain** | 9 | 360 ms | **1 hit** | 14 | 720 ms | 85 px | 5 | Tanky with short reach |

> **Light CD** = recovery time after completing a normal attack chain before you can attack again.  
> **Heavy CD** = lockout recovery time after a heavy attack. Always 2× the light CD.

---

### Detailed Character Profiles

#### ⚔ Mack (Samurai Mack)
- **Health:** 150 · **Damage:** 12 (light) / 18 (heavy)
- **Speed:** 6 · **Range:** 157 px
- **Light CD:** 310 ms · **Heavy CD:** 620 ms
- **Attacks:** 1 light attack per chain
- **Best at:** Consistent mid-range pressure. A solid starter character.

---

#### 🥷 Ninja Lady
- **Health:** 140 · **Damage:** 8 (light) / 12 (heavy)
- **Speed:** 9 *(fastest)* · **Range:** 90 px *(shortest)*
- **Light CD:** 180 ms · **Heavy CD:** 360 ms *(fastest recovery)*
- **Attacks:** 2 light combo attacks (`Attack_1` → `Attack_2`)
- **Best at:** Zipping in, landing fast combos, and retreating before getting hit. Fragile — don't trade hits.

---

#### 🗡 Shinobi
- **Health:** 140 *(Rebalanced from 180)* · **Damage:** 12 (light, rebalanced from 15) / 18 (heavy)
- **Speed:** 5 · **Range:** 110 px
- **Light CD:** 380 ms · **Heavy CD:** 760 ms
- **Attacks:** 3 light combo attacks (`Attack_1` → `Attack_2` → `Attack_3`)
- **Best at:** Fluid combos and rewarding timing.

---

#### 🏯 Shogun
- **Health:** 150 · **Damage:** 13 (light, rebalanced from 14) / 20 (heavy)
- **Speed:** 4 *(slowest)* · **Range:** 120 px *(widest)*
- **Light CD:** 450 ms · **Heavy CD:** 900 ms *(slowest recovery)*
- **Attacks:** 3 light combo attacks (`Attack_1` → `Attack_2` → `Attack_3`)
- **Best at:** Controlling space. Punish whiffed attacks with heavy hits. Struggles against fast rushdown.

---

#### 🧛 Vampire
- **Health:** 160 · **Damage:** 9 (light) / 14 (heavy)
- **Speed:** 7 · **Range:** 115 px
- **Light CD:** 260 ms · **Heavy CD:** 520 ms
- **Attacks:** 3 light combo attacks (`Attack_1` → `Attack_2` → `Attack_3`)
- **Best at:** Mid-range harassment with good mobility. Consistent across all match-ups.

---

#### 🧟 Zombie
- **Health:** 140 · **Damage:** 6 (light) / 9 (heavy)
- **Speed:** 8 · **Range:** 80 px
- **Light CD:** 210 ms · **Heavy CD:** 420 ms
- **Attacks:** 3 light combo attacks (`Attack_1` → `Attack_2` → `Attack_3`)
- **Best at:** Relentless pressure — speed and fast recovery compensate for low damage. Must stay close.

---

#### 🍺 Homeless Guy
- **Health:** 165 · **Damage:** 9 (light, rebalanced from 7) / 14 (heavy)
- **Speed:** 5 · **Range:** 85 px
- **Light CD:** 360 ms · **Heavy CD:** 720 ms
- **Attacks:** 2 light combo attacks (`Attack_1` → `Attack_2`)
- **Best at:** Surviving punishment with high health and erratic attack animations.


---

## 🛠️ Debug Options (Pause Screen)

Press **P** during a match to open the pause screen, which includes:

| Option | Colour | Shows |
|--------|--------|-------|
| **Show Hitboxes** | 🟠 Orange | The attack reach rectangle — the area that deals damage when attacking |
| **Show Hurtboxes** | 🔵 Blue | The body rectangle — the area that can receive damage |

Toggles persist across rounds until turned off.

---

## 🎵 Background Music (BGM)

The game features dynamic, looped soundtrack integration across all screens and battle arenas:

| Screen / Stage | Music Track | File |
|----------------|-------------|------|
| **Title Screen & Main Menu** | Menu Theme | `menu.m4a` |
| **Character Select** | Menu Theme | `menu.m4a` |
| **Map Select** | Menu Theme | `menu.m4a` |
| **Ancient Temple** | Ancient Temple Theme | `AncientTemple.m4a` |
| **Crystal Cave** | Crystal Cave Theme | `CrystalCave.m4a` |
| **Dark Caves** | Dark Caves Theme | `DarkCaves.m4a` |
| **Green Forest** | Green Forest Theme | `GreenForest.m4a` |
| **Oak Forest / The Shop** | Oak Forest Theme | `OakForest.m4a` |
| **Sunset Mountain** | Sunset Mountain Theme | `SunsetMountain.m4a` |
| **Trees Night** | Trees Night Theme | `TreesNight.m4a` |
| **Terrace** | Terrace Theme | `terrace.m4a` |
| **Throne Room** | Throne Room Theme | `throneroom.m4a` |

- **Music Toggle**: Press `O` or click the `🔊 MUSIC ON/OFF` button in the lower right corner to toggle mute at any time.
- **Autoplay Compliance**: Music automatically unlocks and begins playing on the user's first interaction.

---

## 📁 Project Structure

```
Fightin Fervor/
├── index.html              # Game shell, HUD, overlays
├── index.js                # Main game loop, input, round/match flow
├── style.css               # All visual styling and animations
├── BackgroundMusic/        # Looped background music for menus and stages (.m4a)
├── js/
│   ├── classes.js          # Sprite + Fighter class (physics, combat)
│   ├── characters.js       # Character registry and stat definitions
│   ├── characterSelect.js  # Character select screen
│   ├── mapSelect.js        # Stage selection screen with previews
│   ├── music.js            # Background Music Manager (BGM)
│   ├── ai.js               # AI brain (Normal / Hard profiles)
│   ├── sfx.js              # Procedural Web Audio sound effects
│   ├── effects.js          # Particles, screen shake, damage numbers
│   ├── online.js           # Socket.io online multiplayer wrapper
│   └── utils.js            # Collision detection, timer, win logic
└── images/                 # Sprite sheets and stage backgrounds
```
