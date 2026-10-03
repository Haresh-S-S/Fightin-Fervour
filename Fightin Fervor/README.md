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
| **Attack Cooldown** | After every attack finishes, there is a recovery window before the fighter can attack again. Faster characters have shorter cooldowns; heavy/slow characters have longer ones. |
| **Heavy Cooldown** | Always 2× the light cooldown for the same character. |
| **Match Format** | Best of 3 rounds · 60-second timer per round. |

---

## 🧑‍🤝‍🧑 Character Roster

Stats at a glance:

| Character | Health | Damage | Range | Speed | Light CD | Heavy CD | Playstyle |
|-----------|-------:|-------:|------:|------:|---------:|---------:|-----------|
| **Mack** (Samurai) | 150 | 12 | 157 px | 6 | 310 ms | 620 ms | Balanced all-rounder |
| **Ninja Lady** | 140 | 8 | 90 px | 9 | 180 ms | 360 ms | Fastest — hit-and-run rushdown |
| **Shinobi** | 180 | 15 | 110 px | 5 | 380 ms | 760 ms | High damage, punishing commit |
| **Shogun** | 150 | 14 | 120 px | 4 | 450 ms | 900 ms | Slowest — widest reach, space control |
| **Vampire** | 160 | 9 | 115 px | 7 | 260 ms | 520 ms | Nimble mid-ranger |
| **Zombie** | 140 | 6 | 80 px | 8 | 210 ms | 420 ms | Rapid low-damage swarm pressure |
| **Homeless Guy** | 165 | 7 | 85 px | 5 | 360 ms | 720 ms | Tanky with short reach |

> **Light CD** = recovery time after a light attack before you can attack again.  
> **Heavy CD** = recovery time after a heavy attack. Always 2× the light CD.

---

### Detailed Character Profiles

#### ⚔ Mack (Samurai Mack)
- **Health:** 150 · **Damage:** 12 (light) / 18 (heavy)
- **Speed:** 6 · **Range:** 157 px
- **Light CD:** 310 ms · **Heavy CD:** 620 ms
- **Attacks:** 1 light combo attack
- **Best at:** Consistent mid-range pressure. A solid starter character.

---

#### 🥷 Ninja Lady
- **Health:** 140 · **Damage:** 8 (light) / 12 (heavy)
- **Speed:** 9 *(fastest)* · **Range:** 90 px *(shortest)*
- **Light CD:** 180 ms · **Heavy CD:** 360 ms *(fastest recovery)*
- **Attacks:** 2 light combo attacks
- **Best at:** Zipping in, landing fast combos, and retreating before getting hit. Fragile — don't trade hits.

---

#### 🗡 Shinobi
- **Health:** 180 · **Damage:** 15 (light) / 22 (heavy)
- **Speed:** 5 · **Range:** 110 px
- **Light CD:** 380 ms · **Heavy CD:** 760 ms
- **Attacks:** 3 light combo attacks
- **Best at:** Trading hits in your favour. High damage output rewards an aggressive, committed style.

---

#### 🏯 Shogun
- **Health:** 150 · **Damage:** 14 (light) / 21 (heavy)
- **Speed:** 4 *(slowest)* · **Range:** 120 px *(widest)*
- **Light CD:** 450 ms · **Heavy CD:** 900 ms *(slowest recovery)*
- **Attacks:** 3 light combo attacks
- **Best at:** Controlling space. Punish whiffed attacks with heavy hits. Struggles against fast rushdown.

---

#### 🧛 Vampire
- **Health:** 160 · **Damage:** 9 (light) / 13 (heavy)
- **Speed:** 7 · **Range:** 115 px
- **Light CD:** 260 ms · **Heavy CD:** 520 ms
- **Attacks:** 3 light combo attacks
- **Best at:** Mid-range harassment with good mobility. Consistent across all match-ups.

---

#### 🧟 Zombie
- **Health:** 140 · **Damage:** 6 (light) / 9 (heavy)
- **Speed:** 8 · **Range:** 80 px
- **Light CD:** 210 ms · **Heavy CD:** 420 ms
- **Attacks:** 3 light combo attacks
- **Best at:** Relentless pressure — speed and fast recovery compensate for low damage. Must stay close.

---

#### 🍺 Homeless Guy
- **Health:** 165 · **Damage:** 7 (light) / 10 (heavy)
- **Speed:** 5 · **Range:** 85 px
- **Light CD:** 360 ms · **Heavy CD:** 720 ms
- **Attacks:** 2 light combo attacks
- **Best at:** Surviving punishment with above-average health. Unpredictable movement animations can confuse opponents.


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
