class Sprite
{
    constructor({position, imagesrc, scale = 1, framesmax = 1, offset = {x : 0, y : 0}}) {
        this.position = position
        this.height = 150
        this.width = 50
        this.image = new Image()
        this.image.src = imagesrc
        this.scale = scale
        this.framesmax = framesmax
        this.framescurrent = 0
        this.frameselapsed = 0
        this.frameshold = 5
        this.offset = offset
        this.facing = 'right'
        }
    

    draw()
    {
        // ── Background sprites (no attackBox) are drawn full-canvas ──
        // All backgrounds are different native sizes; we always stretch them
        // to fill 1024×576 so they look correct regardless of source dimensions.
        if (!this.attackBox && this.framesmax === 1) {
            c.drawImage(this.image, 0, 0, canvas.width, canvas.height)
            return
        }

        const frameWidth = this.image.width / this.framesmax
        const drawWidth = frameWidth * this.scale
        const drawX = this.position.x - this.offset.x
        const drawY = this.position.y - this.offset.y

        if (this.facing === 'left') {
            c.save()
            c.scale(-1, 1)
            c.drawImage(
                this.image,
                this.framescurrent * frameWidth,
                0,
                frameWidth,
                this.image.height,
                -drawX - drawWidth,
                drawY,
                drawWidth,
                this.image.height * this.scale)
            c.restore()
        } else {
            c.drawImage(
                this.image,
                this.framescurrent * frameWidth,
                0,
                frameWidth,
                this.image.height,
                drawX,
                drawY,
                drawWidth,
                this.image.height * this.scale)
        }

        // ── Debug: Hurtbox (damageable body area — blue) ──────────
        // Guard: only draw on Fighters (which have attackBox) — not on
        // background/shop Sprites, which would produce floating boxes.
        if (window.showHurtboxes && this.attackBox) {
            const hbX = this.position.x + (this.hurtboxOffset ? this.hurtboxOffset.x : 0)
            const hbY = this.position.y + (this.hurtboxOffset ? this.hurtboxOffset.y : 0)
            const hbW = this.hurtboxWidth || this.width
            c.save()
            c.globalAlpha = 0.35
            c.fillStyle   = '#33bbff'
            c.fillRect(hbX, hbY, hbW, this.height)
            c.globalAlpha = 0.9
            c.strokeStyle = '#33bbff'
            c.lineWidth   = 2
            c.strokeRect(hbX, hbY, hbW, this.height)
            c.restore()
        }

        // ── Debug: Hitbox (attack reach area — orange) ────────────
        // Only Fighters have an attackBox; Sprite base doesn't, so guard it.
        if (window.showHitboxes && this.attackBox) {
            c.save()
            c.globalAlpha = 0.45
            c.fillStyle   = '#ff6622'
            c.fillRect(
                this.attackBox.position.x,
                this.attackBox.position.y,
                this.attackBox.width,
                this.attackBox.height)
            c.globalAlpha = 0.9
            c.strokeStyle = '#ff6622'
            c.lineWidth   = 2
            c.strokeRect(
                this.attackBox.position.x,
                this.attackBox.position.y,
                this.attackBox.width,
                this.attackBox.height)
            c.restore()
        }

        // ── Player indicator arrow (P1 = blue, P2 = red) ─────────
        // Only drawn on Fighter instances (attackBox is defined).
        if (this.attackBox && this.playerLabel) {
            const isP1    = this.playerLabel === 'P1'
            const arrowColor = isP1 ? '#4d9fff' : '#ff4d4d'

            // Center the indicator below the fighter's feet
            const footX = this.position.x + this.width / 2
            const footY = this.position.y + this.height

            // Upward-pointing arrow (drawn below the feet, pointing up)
            const arrowTipY   = footY + 14   // tip of the arrow
            const arrowBaseY  = footY + 30   // base of the arrowhead
            const arrowShaft1 = footY + 26
            const arrowShaft2 = footY + 38

            c.save()
            c.globalAlpha = 0.92
            c.fillStyle   = arrowColor
            c.strokeStyle = 'rgba(0,0,0,0.5)'
            c.lineWidth   = 1.5

            // Arrowhead triangle
            c.beginPath()
            c.moveTo(footX,        arrowTipY)
            c.lineTo(footX - 9,    arrowBaseY)
            c.lineTo(footX + 9,    arrowBaseY)
            c.closePath()
            c.fill()
            c.stroke()

            // Arrow shaft
            c.fillRect(footX - 3.5, arrowShaft1, 7, arrowShaft2 - arrowShaft1)
            c.strokeRect(footX - 3.5, arrowShaft1, 7, arrowShaft2 - arrowShaft1)

            // "P1" / "P2" label below the arrow
            c.globalAlpha = 1
            c.font        = 'bold 11px "Press Start 2P", monospace'
            c.textAlign   = 'center'
            c.textBaseline = 'top'
            // Shadow for readability
            c.fillStyle   = 'rgba(0,0,0,0.7)'
            c.fillText(this.playerLabel, footX + 1, arrowShaft2 + 5)
            c.fillStyle   = arrowColor
            c.fillText(this.playerLabel, footX, arrowShaft2 + 4)

            c.restore()
        }

        // ── Shield indicator (drawn at center of character when blocking) ─
        if (this.attackBox && this.isBlocking) {
            const cx = this.position.x + this.width / 2
            const cy = this.position.y + this.height / 2 - 10

            c.save()

            // Glowing circle behind the shield
            const grd = c.createRadialGradient(cx, cy, 5, cx, cy, 32)
            grd.addColorStop(0, 'rgba(80, 180, 255, 0.55)')
            grd.addColorStop(1, 'rgba(80, 180, 255, 0)')
            c.fillStyle = grd
            c.beginPath()
            c.arc(cx, cy, 32, 0, Math.PI * 2)
            c.fill()

            // Shield emoji / symbol
            c.font         = '32px serif'
            c.textAlign    = 'center'
            c.textBaseline = 'middle'
            c.globalAlpha  = 0.92
            c.fillText('🛡', cx, cy)

            c.restore()
        }
    }
    animateFrames()
    {
        this.frameselapsed++
        if(this.frameselapsed % this.frameshold === 0)
        {
        if(this.framescurrent < this.framesmax - 1)
        {
            this.framescurrent++
        }
        else
        {
            this.framescurrent = 0
        }
        }
    }

    update()
    {
        this.draw()
        this.animateFrames()
    }
}

class Fighter extends Sprite
{
    constructor({
        position,
        velocity, 
        color = 'red', 
        imagesrc, scale = 1, 
        framesmax = 1, 
        offset = {x : 0, y : 0}, 
        sprites, 
        attackBox = { offset : {}, width : undefined, height : undefined},
        speed = 5,
        damage = 10,
        maxHealth = 100,
        frameshold = 5,
        attackCooldownMs = 310,   // light attack recovery time in ms
        heavyCooldownMs  = 620,   // heavy attack recovery time in ms
        hurtboxOffset    = { x: 0, y: 0 }, // shifts hurtbox relative to position (visual alignment)
        hurtboxWidth     = 50,             // width of the hurtbox (wider = easier to hit)
    }) {
        super({position,
             imagesrc, 
             scale, 
             framesmax, 
             offset})
        this.position = position
        this.velocity = velocity
        this.height = 150
        this.width = 50
        this.lastkey
        this.attackBox = {
            position : {
                x : this.position.x,
                y : this.position.y
            },
            offset : attackBox.offset,
            width : attackBox.width,
            height : attackBox.height
        }
        this.color = color
        this.isAttacking = false
        this.isHeavyAttacking = false

        // --- Per-character stats ---
        this.speed    = speed
        this.damage   = damage
        this.maxHealth = maxHealth
        this.health   = maxHealth
        // Attack cooldown timers — how long after an attack finishes before
        // the fighter can attack again. Stored in ms; converted to frames
        // at the moment each attack fires (see attack() / heavyAttack()).
        this.attackCooldownMs = attackCooldownMs
        this.heavyCooldownMs  = heavyCooldownMs
        this.framescurrent = 0
        this.frameselapsed = 0
        this.frameshold = frameshold
        this.sprites = sprites
        this.dead = false
        this.isDying = false  // true while death animation is playing
        this.isVictory   = false  // true while victory animation is playing
        this.victoryDone = false  // set when victory animation completes
        this.isGrounded = false

        // ── FEEL SYSTEMS ──────────────────────────────────────────

        this.hitstopFrames = 0
        this.stunFrames = 0

        // ── ANTI-SPAM: Combo counter with diminishing stun ────────
        // comboHitsReceived: gameplay counter that drives stun DR and launcher.
        // displayCombo: separate counter held for 90 frames for the HUD display.
        //   (Needed because comboHitsReceived resets immediately on launcher,
        //    which would hide the "LAUNCH!" text before it could render.)
        this.comboHitsReceived = 0
        this.comboResetTimer   = 0
        this.displayCombo      = 0   // HUD-only — persists longer than gameplay counter
        this.displayComboTimer = 0

        // ── WAKE-UP INVINCIBILITY ─────────────────────────────────
        this.wakeupFrames = 0
        this.inKnockdown  = false

        // ── ATTACK RECOVERY — timestamp-based (no setTimeout race condition) ─────
        // The old frame-counter (attackRecoveryFrames) had a gap: index.js clears
        // isAttacking at the impact frame, but the frame counter wasn't set until the
        // end-of-animation setTimeout fired — leaving a window where both guards were
        // zero and key-spam could trigger extra attacks.
        // These timestamp gates are set at the MOMENT each attack starts, so no gap
        // is possible regardless of when the animation clears isAttacking.
        this.lightAttackUnlockTime = 0   // performance.now() value; 0 = always open
        this.heavyAttackUnlockTime = 0
        // How many light attacks have been thrown in the current chain.
        // Resets to 0 after attackCount hits or on taking damage.
        this.lightChainCount = 0
        // Keep for AI compatibility (ai.js reads attackRecoveryFrames)
        this.attackRecoveryFrames = 0

        // ── SEPARATE KNOCKBACK CHANNEL ────────────────────────────
        // BUG FIX: was 5px for light hits, which sent the enemy ~40px away
        // over 8 recovery frames — out of reach before you could attack again.
        // Now light hits use 2.5px so they push but stay in combo range.
        this.knockbackX = 0

        this.isBlocking    = false
        this.isStaggered   = false
        this.staggerFrames = 0
        this._heavyPending = false

        // ── COUNTER-ATTACK WINDOW ──────────────────────────────────
        // Set on the ATTACKER when their attack is blocked.
        // While > 0, the attacker cannot throw a new attack — giving
        // the defender a punish window before the attacker can act again.
        this.counterWindowFrames = 0

        // ── ATTACK PRIORITY ───────────────────────────────────────
        // Timestamp (performance.now()) set when an attack begins.
        // When both fighters land on the same frame, the one with the
        // earlier timestamp wins — prevents trading / tanking through.
        this.attackStartTime = 0

        // ── HURTBOX OFFSET ────────────────────────────────────────
        // Shifts the collidable hurtbox so it aligns with the visible
        // character sprite. Defined per-character in characters.js.
        this.hurtboxOffset = hurtboxOffset
        this.hurtboxWidth  = hurtboxWidth

        if (this.sprites && this.sprites.jump && !this.sprites.fall) {
            this.sprites.fall = this.sprites.jump
        }

        this.attackCount = 0
        while (this.sprites && this.sprites[`attack${this.attackCount + 1}`]) {
            this.attackCount++
        }
        if (this.attackCount === 0) this.attackCount = 1
        this.attackStage = 1

        for(const sprite in this.sprites)
        {
            sprites[sprite].image = new Image()
            sprites[sprite].image.src = sprites[sprite].imagesrc
        }
    }

    update()
    {
        this.draw()

        // ── DEATH: highest-priority state, runs instead of everything else ──
        // Once isDying is true, ALL other logic (physics, counters, hitstop)
        // is skipped. Only the death animation advances; when it reaches its
        // last frame this.dead is set so waitForDeathThenEnd() can resolve.
        if (this.isDying) {
            this.frameselapsed++
            if (this.frameselapsed % this.frameshold === 0) {
                if (this.framescurrent < this.sprites.death.framesmax - 1) {
                    this.framescurrent++
                } else {
                    this.dead    = true
                    this.isDying = false
                }
            }
            return  // skip ALL physics, timers, and movement logic
        }

        // ── VICTORY: second-priority state ────────────────────────────────────────────
        // Plays the victory animation smoothly, ensuring it displays for at least 2 seconds (120 frames at 60fps).
        if (this.isVictory) {
            this.frameselapsed++
            const vFramesmax = (this.sprites && this.sprites.victory && this.sprites.victory.framesmax) || this.framesmax
            const vHold = (this.sprites && this.sprites.victory && this.sprites.victory.frameshold) || this.frameshold || 10

            if (this.frameselapsed % vHold === 0) {
                if (this.framescurrent < vFramesmax - 1) {
                    this.framescurrent++
                }
            }

            // Target duration: at least 2 seconds (120 frames at 60fps or 2000ms via performance.now())
            const targetFrames = Math.max(120, vFramesmax * vHold)
            const elapsedMs = (this.victoryStartTime) ? (performance.now() - this.victoryStartTime) : 0

            if (this.frameselapsed >= targetFrames || elapsedMs >= 2000) {
                this.framescurrent = vFramesmax - 1
                this.victoryDone = true
            }
            return  // skip all physics/logic while celebrating
        }

        if (this.hitstopFrames > 0) {
            this.hitstopFrames--
            return
        }

        // Normal animation (non-death, non-hitstop)
        if (!this.dead) {
            this.animateFrames()
        }

        if (this.stunFrames             > 0) this.stunFrames--
        if (this.wakeupFrames           > 0) this.wakeupFrames--
        if (this.attackRecoveryFrames   > 0) this.attackRecoveryFrames--
        if (this.counterWindowFrames    > 0) this.counterWindowFrames--
        if (this.staggerFrames > 0) {
            this.staggerFrames--
            if (this.staggerFrames <= 0) this.isStaggered = false
        }

        // Gameplay combo reset (short — controls stun DR)
        if (this.comboResetTimer > 0) {
            this.comboResetTimer--
            if (this.comboResetTimer <= 0) this.comboHitsReceived = 0
        }

        // Display combo reset (longer — keeps HUD text visible)
        if (this.displayComboTimer > 0) {
            this.displayComboTimer--
            if (this.displayComboTimer <= 0) this.displayCombo = 0
        }

        // knockbackX decays each frame — NOT zeroed by control code in index.js
        if (Math.abs(this.knockbackX) > 0.4) {
            this.position.x += this.knockbackX
            this.knockbackX *= 0.70
        } else {
            this.knockbackX = 0
        }

        // Wake-up from knockdown when grounded
        if (this.inKnockdown && this.isGrounded) {
            this.inKnockdown  = false
            this.wakeupFrames = 22
            this.stunFrames   = 0
        }

        const reach = Math.abs(this.attackBox.offset.x)
        if (this.facing === 'right') {
            this.attackBox.position.x = this.position.x + reach
        } else {
            this.attackBox.position.x = this.position.x - reach - this.attackBox.width
        }
        this.attackBox.position.y = this.position.y + this.attackBox.offset.y

        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        // ── Invisible walls — keep fighter inside the canvas ──────────
        if (this.position.x < 0) this.position.x = 0
        if (this.position.x + this.width > canvas.width) this.position.x = canvas.width - this.width

        if(this.position.y + this.height + this.velocity.y >= (canvas.height - 96))
        {
            this.velocity.y = 0
            this.position.y = 330
            this.isGrounded = true
        }
        else
        {
            this.velocity.y += gravity
        }
    }

    // ── Force the fighter into the dying state (called when health ≤0) ────
    // This is the ONLY path into the death animation and cannot be interrupted.
    // Clears all pending flags so no lingering setTimeout can override it.
    forceDeath()
    {
        if (this.isDying || this.dead) return  // already dying, don't restart
        this.isDying            = true
        this.dead               = false
        // Kill all pending attack/stun state immediately
        this.isAttacking        = false
        this.isHeavyAttacking   = false
        this._heavyPending      = false
        this.hitstopFrames      = 0   // clear hitstop so death plays at normal speed
        this.stunFrames         = 0
        this.staggerFrames      = 0
        this.isStaggered        = false
        this.isBlocking         = false
        this.velocity.x         = 0
        this.velocity.y         = 0
        // Switch to death sprite
        this.image              = this.sprites.death.image
        this.framesmax          = this.sprites.death.framesmax
        this.framescurrent      = 0
        this.frameselapsed      = 0
    }

    // ── Force the fighter into the victory pose (called after opponent is dead) ─
    // Plays the victory animation once, then holds on the last frame.
    forceVictory()
    {
        if (!this.sprites || !this.sprites.victory) return  // no victory anim defined
        if (this.isVictory) return  // already in victory state
        this.isVictory          = true
        this.victoryDone        = false
        // Clear all action state
        this.isAttacking        = false
        this.isHeavyAttacking   = false
        this._heavyPending      = false
        this.hitstopFrames      = 0
        this.stunFrames         = 0
        this.staggerFrames      = 0
        this.isStaggered        = false
        this.isBlocking         = false
        this.velocity.x         = 0
        this.velocity.y         = 0
        // Save the original offset so we could restore it later if needed
        this._defaultOffsetX    = this.offset.x
        // Apply per-animation offset override if defined (victory frame is narrower)
        const vOffX = this.sprites.victory.offsetX
        if (vOffX !== undefined && vOffX !== null) {
            this.offset = { x: vOffX, y: this.offset.y }
        }
        // Switch to victory sprite
        this.image              = this.sprites.victory.image
        this.framesmax          = this.sprites.victory.framesmax
        this.framescurrent      = 0
        this.frameselapsed      = 0
        if (this.sprites.victory.frameshold) {
            this.frameshold     = this.sprites.victory.frameshold
        }
        this.victoryStartTime   = performance.now()
    }

    jump()
    {
        if (this.dead || this.isDying || !this.isGrounded || this.stunFrames > 0 || this.isStaggered) return
        this.velocity.y = -20
        this.isGrounded = false
        this.isBlocking = false
    }

    // ── Light Attack ─────────────────────────────────────────────
    // Allows up to this.attackCount (e.g. 3) hits per cooldown window.
    // After the final hit in the chain, lightAttackUnlockTime is set and
    // no more light attacks are possible until it expires.
    attack()
    {
        const now = performance.now()
        if (this.isAttacking || this.dead || this.isDying || this.stunFrames > 0 ||
            this.isStaggered || this._heavyPending) return
        // Timestamp gate — immune to the isAttacking gap created by index.js
        if (now < this.lightAttackUnlockTime) return
        // Counter-window gate — cannot attack immediately after being blocked
        if (this.counterWindowFrames > 0) return

        this.attackStartTime = now  // stamp for priority resolution

        this.isBlocking = false

        const attackName = `attack${this.attackStage}`
        this.switchSprite(attackName)
        this.isAttacking = true
        this.isHeavyAttacking = false

        this.attackImpactFrame = Math.floor(this.sprites[attackName].framesmax / 2)
        this.attackStage = this.attackStage < this.attackCount ? this.attackStage + 1 : 1

        const framesInAttack = this.sprites[attackName].framesmax
        const msPerFrame = this.frameshold * (1000 / 60)
        const attackDuration = framesInAttack * msPerFrame

        if (typeof SFX !== 'undefined') SFX.whoosh(false)

        // ── Chain tracking ────────────────────────────────────────
        // Count this hit. If we've reached the chain limit, lock out
        // light attacks for the cooldown period AFTER the animation ends.
        this.lightChainCount++
        if (this.lightChainCount >= this.attackCount) {
            this.lightChainCount = 0
            this.lightAttackUnlockTime = now + attackDuration + this.attackCooldownMs
        }

        setTimeout(() => {
            this.isAttacking = false
            // Keep frame counter alive for AI compatibility (ai.js checks it)
            this.attackRecoveryFrames = Math.round(this.attackCooldownMs / (1000 / 60))
        }, attackDuration)
    }

    // ── Heavy Attack ─────────────────────────────────────────────
    // Only 1 heavy attack per heavyCooldownMs window.
    // Also blocks light attacks for the same duration so the player
    // can't immediately light-spam after a heavy.
    heavyAttack()
    {
        const now = performance.now()
        if (this.isAttacking || this.dead || this.isDying || this.stunFrames > 0 ||
            this.isStaggered || this._heavyPending) return
        // Timestamp gate — prevents chained heavies while cooldown is active
        if (now < this.heavyAttackUnlockTime) return
        // Counter-window gate — cannot attack immediately after being blocked
        if (this.counterWindowFrames > 0) return

        this.isBlocking = false
        // Reset light chain — heavy overrides light rhythm
        this.lightChainCount = 0

        this._heavyPending = true
        if (typeof SFX !== 'undefined') SFX.whoosh(true)

        const WINDUP_MS = 120
        setTimeout(() => {
            this._heavyPending = false
            if (this.dead || this.isDying || this.stunFrames > 0) return

            // Stamp attack time AFTER windup — a light attack thrown during
            // the windup will have an earlier timestamp and win priority.
            this.attackStartTime = performance.now()

            const attackName = `attack${this.attackCount}`
            this.switchSprite(attackName)
            this.isAttacking      = true
            this.isHeavyAttacking = true
            this.attackImpactFrame = Math.floor(this.sprites[attackName].framesmax / 2)

            const framesInAttack = this.sprites[attackName].framesmax
            const msPerFrame     = this.frameshold * (1000 / 60)
            const attackDuration = framesInAttack * msPerFrame + 80

            // Lock both heavy AND light attacks for the full heavy cooldown window.
            // Set from NOW so the lockout covers the attack animation + cooldown.
            const unlockAt = performance.now() + attackDuration + this.heavyCooldownMs
            this.heavyAttackUnlockTime = unlockAt
            this.lightAttackUnlockTime = unlockAt  // block light-spam after a heavy too

            setTimeout(() => {
                this.isAttacking      = false
                this.isHeavyAttacking = false
                // Keep frame counter alive for AI compatibility
                this.attackRecoveryFrames = Math.round(this.heavyCooldownMs / (1000 / 60))
            }, attackDuration)
        }, WINDUP_MS)
    }

    // ── Block ─────────────────────────────────────────────────────
    startBlock()
    {
        if (this.dead || this.isDying || this.isAttacking || this.stunFrames > 0 || !this.isGrounded) return
        this.isBlocking = true
        this.switchSprite('idle')
    }

    stopBlock()
    {
        this.isBlocking = false
    }

    // ── Take Hit ──────────────────────────────────────────────────
    // Returns: positive number = damage dealt
    //          negative number = blocked (chip damage)
    //          0               = invincible (wake-up frames, no effect)
    takehit(damage = 10, attacker = null, heavy = false)
    {
        if (this.wakeupFrames > 0) return 0
        if (this.isDying || this.dead) return 0  // already dead, ignore hit

        // ── Block ────────────────────────────────────────────────
        if (this.isBlocking && this.isGrounded) {
            if (heavy) {
                this.isBlocking    = false
                this.isStaggered   = true
                this.staggerFrames = 36
                if (typeof SFX !== 'undefined') SFX.guardBreak()
                const chipDamage = Math.max(1, Math.ceil(damage * 0.15))
                this.health = Math.max(0, this.health - chipDamage)
                if (this.health <= 0) {
                    this.forceDeath()
                    if (typeof SFX !== 'undefined') SFX.ko()
                } else {
                    this.switchSprite('takehit')
                }
                return chipDamage
            } else {
                if (typeof SFX !== 'undefined') SFX.block()
                const chipDamage = Math.max(1, Math.ceil(damage * 0.12))
                this.health = Math.max(0, this.health - chipDamage)
                if (this.health <= 0) {
                    this.forceDeath()
                    if (typeof SFX !== 'undefined') SFX.ko()
                } else {
                    // still alive after chip — stay in block
                }
                return -chipDamage
            }
        }

        // ── Damage ───────────────────────────────────────────────
        this.health = Math.max(0, this.health - damage)

        // Getting hit interrupts the attacker's light chain — prevents
        // bridging 3+ hits across a stun window by mashing through recovery.
        this.lightChainCount = 0

        // ── Combo counter ─────────────────────────────────────────
        this.comboHitsReceived++
        // BUG FIX: was 50 frames (~0.83s). With light attack duration ~400ms
        // + 4 frame recovery (~67ms) = ~467ms per hit, chain resets were
        // happening before the player could land hit 4. Increased to 90 frames (~1.5s).
        this.comboResetTimer = 90

        // displayCombo is the HUD counter — persists 90 frames after last hit
        // so "LAUNCH!" stays visible even after comboHitsReceived resets to 0.
        this.displayCombo = this.comboHitsReceived
        this.displayComboTimer = 90

        // Diminishing stun returns:
        //   Hit 1: 100%  (14f light / 28f heavy)
        //   Hit 2:  65%  (9f  / 18f)
        //   Hit 3:  30%  (4f  / 8f)
        //   Hit 4+: → LAUNCHER (no stun)
        const baseStun = heavy ? 28 : 14
        const stunPct  = Math.max(0, 1 - (this.comboHitsReceived - 1) * 0.35)
        this.stunFrames = Math.round(baseStun * stunPct)

        // ── Launcher on 4th+ hit ──────────────────────────────────
        if (this.comboHitsReceived >= 4) {
            this.stunFrames = 0
            this.inKnockdown = true
            this.isGrounded  = false
            this.velocity.y  = -10
            const dir = attacker ? (attacker.position.x < this.position.x ? 1 : -1) : 1
            this.knockbackX  = dir * 14
            this.hitstopFrames = 14
            // BUG FIX: don't reset comboHitsReceived until displayComboTimer expires,
            // so the "LAUNCH!" text stays visible on screen.
            // Reset gameplay counter so next combo starts fresh.
            this.comboHitsReceived = 0
            this.comboResetTimer   = 0
            if (typeof SFX !== 'undefined') SFX.heavyHit()
        } else {
            // ── Normal knockback ─────────────────────────────────
            if (attacker) {
                // BUG FIX: was 5px for light — pushes enemy ~40px before next attack,
                // making follow-up impossible. Reduced to 2.5px for light hits so
                // combo range is maintained. Heavy stays at 9px (one-two then gap).
                const kbForce = heavy ? 9 : 2.5
                const dir = attacker.position.x < this.position.x ? 1 : -1
                this.knockbackX = dir * kbForce
                if (heavy && this.isGrounded) {
                    this.velocity.y = -5
                    this.isGrounded = false
                }
            }
            this.hitstopFrames = heavy ? 10 : 6
        }

        // ── Animation ────────────────────────────────────────────
        if(this.health <= 0)
        {
            this.forceDeath()
            if (typeof SFX !== 'undefined') SFX.ko()
        }
        else
        {
            this.switchSprite('takehit')
            if (typeof SFX !== 'undefined') {
                if (this.inKnockdown) { /* already played heavyHit above */ }
                else if (heavy) SFX.heavyHit()
                else            SFX.punch()
            }
        }

        return damage
    }

    switchSprite(sprite)
    {
    // Dying or dead — no sprite changes allowed whatsoever.
    // forceDeath() is the only valid path into the death animation.
    if (this.isDying || this.dead) return

    if(this.image === this.sprites.death.image)
    {
        if(this.framescurrent === this.sprites.death.framesmax - 1)
        {
            this.dead = true
        }
            return
    }

    if(
        sprite !== this.currentAttackName &&
        this.currentAttackName &&
        this.image === this.sprites[this.currentAttackName].image &&
        this.framescurrent < this.sprites[this.currentAttackName].framesmax - 1
    )
        { 
            return
        }

    if(
        this.image === this.sprites.takehit.image &&
        this.framescurrent < this.sprites.takehit.framesmax - 1
    )
        { 
            return
        }

    switch (sprite) {
        case 'idle':
            if(this.image !== this.sprites.idle.image)
            {
            this.image = this.sprites.idle.image
            this.framesmax = this.sprites.idle.framesmax
            this.framescurrent = 0
            }
            break;
        case 'run':
            if(this.image !== this.sprites.run.image)
            {
            this.image = this.sprites.run.image
            this.framesmax = this.sprites.run.framesmax
            this.framescurrent = 0
            }
            break;
        case 'jump':
            if(this.image !== this.sprites.jump.image)
            {
            this.image = this.sprites.jump.image
            this.framesmax = this.sprites.jump.framesmax
            this.framescurrent = 0
            }
            break;
        case 'fall':
            if(this.image !== this.sprites.fall.image)
            {
            this.image = this.sprites.fall.image
            this.framesmax = this.sprites.fall.framesmax
            this.framescurrent = 0             
            }
            break;
        case 'takehit':
            if(this.image !== this.sprites.takehit.image)
            {
            this.image = this.sprites.takehit.image
            this.framesmax = this.sprites.takehit.framesmax
            this.framescurrent = 0             
            }
            break;
        case 'death':
            if(this.image !== this.sprites.death.image)
            {
            this.image = this.sprites.death.image
            this.framesmax = this.sprites.death.framesmax
            this.framescurrent = 0             
            }
            break;
        default:
            if(this.sprites[sprite] && this.image !== this.sprites[sprite].image)
            {
            this.image = this.sprites[sprite].image
            this.framesmax = this.sprites[sprite].framesmax
            this.framescurrent = 0
            this.currentAttackName = sprite
            }
            break;
        }
        
    }
}