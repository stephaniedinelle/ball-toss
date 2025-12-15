# 🎯 QUICK REFERENCE GUIDE - Ball Toss Carnival Enhanced

## 📊 What Changed At a Glance

### Before & After Comparison

```
BEFORE                                  AFTER
═══════════════════════════════════════════════════════════════════

Pink Rounded Cups                       🔴 RED PLASTIC CUPS
Perfect grid (2×5)                      Single row, carnival-style
No values displayed                     Dollar values on each cup
Flat purple background                  Wood grain table surface
Simple collision detection              Trapezoid cup collision
No table bounce                         Ball bounces realistically
No inside-cup bonus                     +20 bonus for inside hit
Standard layout                         Random rotation per cup
                                        Realistic shading & depth
```

---

## 🎨 Visual Reference

### Cup Appearance

#### **NORMAL RED CUP (Unhit)**
```
     ╱──────╲
    │  $25   │    ← Displays value
    │        │
    │        │    ← Red plastic gradient
    │        │       (Bright → Dark)
     ╲──────╱
    
    Color: #FF6B6B → #9B1D20
    Shape: Tapered (wider top, narrower bottom)
    Rotation: Random ±0.3 radians (carnival style)
```

#### **GOLDEN CUP (Bonus Cup)**
```
     ╱──────╲
    │ BONUS │    ← No $ value shown
    │        │
    │        │    ← Gold gradient
    │        │       (Bright → Dark)
     ╲──────╱
    
    Color: #FFE74C → #FFC700
    Effect: Glowing aura around cup
```

#### **HIT CUP (Scored)**
```
     ╱──────╲
    │        │
    │        │    ← Green gradient
    │        │       (Light → Dark Green)
     ╲──────╝

    Color: #90EE90 → #3B8F3B
    Effect: Indicates successful hit
```

### Table Setup

```
┌─────────────────────────────────────────────────────┐
│                    WALL (Light Gray)                │
├─────────────────────────────────────────────────────┤
│                                                     │
│   🔴   🔴   🔴   🔴   🔴   🔴   🔴   🔴            │
│   $10  $25  $50  $100 $5   $15  $35  $250          │
│   (Slightly rotated, offset)                       │
│                                                     │
│        ●●● (BALL - Purple with spin)               │
│                                                     │
├────────────────────────────────────────────────────┤  ← Table Y = 0.4 × height
│  ─ ─ ─ ─ THROWING LINE ─ ─ ─ ─                     │
│                                                     │
│            (Wood Grain Table Surface)              │
└─────────────────────────────────────────────────────┘
```

---

## 🎮 Gameplay Mechanics

### Scoring Formula

```
NORMAL CUP (Edge):
Points = (10 + CUP_VALUE) + (COMBO × 3) + FORCE_BONUS
Example: $50 cup, 3-combo, force 8:
Points = (10 + 50) + (3 × 3) + 8 = 79

NORMAL CUP (INSIDE) - JACKPOT! 🎉:
Points = (10 + CUP_VALUE) + (COMBO × 3) + FORCE_BONUS + 20
Example: Same cup but inside:
Points = (10 + 50) + (3 × 3) + 8 + 20 = 99

GOLDEN CUP:
Points = 40 + ANGLE_BONUS
Example: Perfect angle:
Points = 40 + 5 = 45

EXPLOSION (Each cup):
Points = 25 per cup hit
```

### Cup Values by Index

```
Position 1: $10
Position 2: $25
Position 3: $50
Position 4: $100    ← Highest single value
Position 5: $5
Position 6: $15
Position 7: $35
Position 8: $250    ← JACKPOT! (Hard mode doesn't show values)
```

### Difficulty Impact

```
┌─────────────┬────────────┬────────────┬──────────────┐
│ Difficulty  │ Cup Speed  │ Dodging    │ Value Shown  │
├─────────────┼────────────┼────────────┼──────────────┤
│ Easy        │ 0.6 px/fr  │ No         │ Yes          │
│ Normal      │ 1.2 px/fr  │ No         │ Yes          │
│ Hard        │ 1.8 px/fr  │ YES! 🚀    │ No (surprise)│
└─────────────┴────────────┴────────────┴──────────────┘
```

---

## 🔧 Technical Details

### Cup Object Structure

```javascript
{
    x: 150,              // Canvas X position
    y: 210,              // Canvas Y position
    width: 55,           // Cup width (top)
    height: 85,          // Cup height
    hit: false,          // Has it been hit?
    golden: false,       // Bonus cup?
    baseSpeed: 1.2,      // Movement speed
    direction: 1,        // Direction: 1 or -1
    rotation: 0.1,       // ← NEW: Carnival angle
    shake: 0,            // Shake effect timer
    dodgeTimer: 0,       // Dodge behavior timer
    value: 50,           // ← NEW: Dollar value
    valueText: "$50",    // ← NEW: Display text
    showValue: true      // ← NEW: Should display value?
}
```

### Collision Detection (Trapezoid Shape)

```
Top (wider):      [========]
                  │        │
Middle:           │   ●    │  ← Ball position
                  │        │
Bottom (narrow):   \────────/

Formula:
yProgress = (ballY - cupY) / cupHeight
currentWidth = topWidth + (bottomWidth - topWidth) × yProgress
isInsideCup = (ballX > leftBound) && (ballX < rightBound)
```

### Physics Constants

```javascript
GRAVITY = 0.5              // Downward acceleration
AIR_RESISTANCE = 0.97      // 3% drag per frame
BOUNCE_DAMPING = 0.6       // 40% energy lost on bounce
SPIN_FRICTION = 0.96       // 4% spin loss per frame
TABLE_Y = canvas.height × 0.4  // Wood table surface location
```

---

## 📈 Performance Metrics

### Rendering
```
FPS: 60 (requestAnimationFrame)
Draw Order:
1. Background (table/wall)
2. Cups (0-8 per difficulty)
3. Ball trail
4. Ball
5. Particles (auto-cleaned)
6. UI text (score, time, etc)
```

### Memory Management
```
Particles: Auto-cleaned when lifetime expires
Cups: Reused - not recreated (same array)
Ball: Single object, position updated each frame
Max Particles: ~50-100 on screen at once
Cleanup: Every frame via particle.life--
```

### Collision Checks
```
Per Frame:
- Ball vs 8 cups: 8 collision checks
- Ball vs table: 1 boundary check
- Ball vs walls: 3 boundary checks
Total: ~12 checks per frame = negligible
Optimization: Only checks unhit cups
```

---

## 🎵 Audio Features

### Sound Effects

```
📢 sndThrow:   https://cdn.pixabay.com/.../throw
🎯 sndHit:     https://cdn.pixabay.com/.../hit
⭐ sndGolden:  https://cdn.pixabay.com/.../golden
💥 sndExplode: https://cdn.pixabay.com/.../explosion

All wrapped in .catch(() => {}) for safety
✅ Won't crash if browser blocks autoplay
```

---

## 🐛 Known Behaviors & Quirks

### Intended Features
```
✅ Ball stops on table after bouncing
✅ Cups move back and forth (clamped to canvas)
✅ Dodging only on hard mode (intentional difficulty)
✅ Golden cups don't show values (mystery element)
✅ Particles fade out smoothly (no instant removal)
✅ Combo resets if ball falls off screen (punishment)
```

### Edge Cases Handled
```
✅ Audio autoplay blocked (has fallback)
✅ Canvas before DOM ready (checks getElementById)
✅ Rapid fire collisions (one per ball throw)
✅ Ball stuck in cup (bounces out due to negative velocity)
✅ Off-screen particles (cleaned up automatically)
✅ Multiple browser compatibility (Canvas 2D standard)
```

---

## 🚀 Performance Optimization Tips

### If you want to optimize further:

```javascript
// Use requestAnimationFrame (already done) ✅
requestAnimationFrame(draw);

// Limit particle count
if (particles.length > 100) particles.shift();

// Cache gradient creation (optional)
const cupGradient = ctx.createLinearGradient(0, 0, w, h);

// Only draw on-screen objects (for future expansion)
if (cup.x + cup.width > 0 && cup.x < canvas.width) {
    drawCup(cup);
}
```

---

## 🎓 Code Architecture

### Main Game Flow

```
START
  │
  ├─ setupGame(difficulty)
  │   └─ generateCups()
  │   └─ startTimer()
  │   └─ requestAnimationFrame(draw)
  │
  ├─ draw() [Repeats 60/sec]
  │   ├─ drawBackground()
  │   ├─ drawCups()
  │   ├─ drawBall()
  │   ├─ drawParticles()
  │   ├─ updateBall()
  │   │   ├─ updatePhysics()
  │   │   ├─ checkCollision() [×8]
  │   │   ├─ handleCupHit()
  │   │   │   ├─ updateScore()
  │   │   │   ├─ playSound()
  │   │   │   └─ addParticles()
  │   │   └─ resetBall() [if off-screen]
  │   └─ updateParticles()
  │
  ├─ Mouse Events
  │   ├─ mousedown → dragging = true
  │   ├─ mousemove → dragEnd update
  │   └─ mouseup → throwBall()
  │
  ├─ Timer
  │   └─ Every 1 second: timer--, check end condition
  │
  └─ END GAME
      └─ endGame()
          ├─ saveHighScore()
          └─ showGameOver()
```

---

## 📝 File Structure

```
Ball Toss Game/
├── index.html              [Menu page]
├── play.html               [Main game]
├── leaderboard.html        [High scores]
├── instructions.html       [How to play]
├── js/
│   └── game.js            [648 lines - CORE ENGINE]
├── css/
│   └── style.css          [259 lines - UI styling]
├── README.md              [Overview]
├── IMPROVEMENTS.md        [Feature list]
├── RESTORATION_DETAILS.md [What was missing]
└── CODE_SUMMARY.md        [This guide]
```

---

## ✨ Special Features Summary

| Feature | Implementation | Benefit |
|---------|-----------------|---------|
| **Red Plastic Cups** | Trapezoid gradient fill | Realistic carnival appearance |
| **Cup Values** | $5-$250 + JACKPOT | Dynamic scoring, replayability |
| **Carnival Layout** | Random rotation/offset | Unique each game, more challenging |
| **Inside Cup Detection** | Interpolated trapezoid collision | Bonus scoring, skill-based gameplay |
| **Table Bounce** | Y-collision at height 0.4 | Physics feel alive and responsive |
| **Wood Grain Table** | Gradient + line pattern | Immersive carnival setting |
| **Particle Effects** | 50-100 particles on-screen | Visual feedback for actions |
| **Audio Safety** | .catch() error handling | No crashes on autoplay block |
| **Difficulty Scaling** | Speed/dodging/cup count | Progressive challenge |

---

## 🎯 Next Development Ideas

```
Priority 1 (Easy):
- [ ] Sound volume slider
- [ ] Different cup colors/themes
- [ ] Leaderboard with names

Priority 2 (Medium):
- [ ] Touch/mobile controls
- [ ] Cup wiggle animation
- [ ] Ball trail customization
- [ ] Background music option

Priority 3 (Advanced):
- [ ] Multiplayer mode (turn-based)
- [ ] Special cup types (bouncy, slow, etc)
- [ ] Power-up visual indicators
- [ ] Unlock system/achievements
- [ ] Physics friction/spin tuning
```

---

**Last Updated**: December 5, 2025  
**Version**: 2.5 - Carnival Edition  
**Status**: ✅ Production Ready

Enjoy your enhanced Ball Toss Carnival! 🎪🎯🎉
