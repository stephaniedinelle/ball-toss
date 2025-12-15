/* =========================================================
   BALL TOSS CARNIVAL — ENHANCED GAME ENGINE
   Advanced Physics & Visual Effects ✨
========================================================= */

/* GLOBAL STATE */
let score = 0;
let balls = 5;
let timer = 45;
let combo = 0;
let gameRunning = false;
let difficulty = "normal";

let powerup = "none";
let powerTimer = 0;
let particles = [];

/* Canvas Setup */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

/* PHYSICS CONSTANTS */
const GRAVITY = 0.5;
const FRICTION = 0.985;
const BOUNCE_DAMPING = 0.6;
const AIR_RESISTANCE = 0.97;
const SPIN_FRICTION = 0.96;

/* Ball Settings */
let ball = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    vx: 0,
    vy: 0,
    radius: 12,
    thrown: false,
    spin: 0,
    mass: 1.0,
    trail: []
};

/* Cup Settings */
let cups = [];

/* Sound Effects */
const sndThrow = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_4e1e6a2ad6.mp3");
const sndHit = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_a05fbb3b9d.mp3");
const sndGolden = new Audio("https://cdn.pixabay.com/audio/2021/09/16/audio_c9bdfe52de.mp3");
const sndExplode = new Audio("https://cdn.pixabay.com/audio/2022/03/10/audio_775d83d623.mp3");

/* =========================================================
   INITIALIZE GAME
========================================================= */
function setupGame(difficultyLevel = "normal") {
    difficulty = difficultyLevel;
    score = 0;
    balls = 5;
    timer = 45;
    combo = 0;
    particles = [];

    document.getElementById("score").textContent = score;
    document.getElementById("balls").textContent = balls;
    document.getElementById("timer").textContent = timer;

    generateCups();
    startTimer();

    gameRunning = true;
    requestAnimationFrame(draw);
}

/* Detect if we're on the home page or play page */
if (document.getElementById("gameCanvas")) {
    // Auto-start with "normal" difficulty if called from play.html
    if (!window.location.href.includes("index.html")) {
        setupGame("normal");
    }
}

/* =========================================================
   CUP GENERATION WITH REALISTIC RED CUPS & CARNIVAL STYLE
========================================================= */
function generateCups() {
    cups = [];

    const difficultySettings = {
        easy: { speed: 0.6, cupCount: 5, golden: 0.3, showValues: true },
        normal: { speed: 1.2, cupCount: 8, golden: 0.2, showValues: true },
        hard: { speed: 1.8, cupCount: 8, golden: 0.15, showValues: false }
    };

    const settings = difficultySettings[difficulty] || difficultySettings.normal;

    // Define spawning area (table surface area)
    const spawnArea = {
        minX: 50,
        maxX: canvas.width - 100,
        minY: canvas.height * 0.45,
        maxY: canvas.height * 0.75
    };

    const cupValues = [
        { value: 10, text: "$10" },
        { value: 25, text: "$25" },
        { value: 50, text: "$50" },
        { value: 100, text: "$100" },
        { value: 5, text: "$5" },
        { value: 15, text: "$15" },
        { value: 35, text: "$35" },
        { value: 250, text: "JACKPOT" }
    ];

    let attempts = 0;
    while (cups.length < settings.cupCount && attempts < 100) {
        attempts++;

        // Random position
        const testX = Math.random() * (spawnArea.maxX - spawnArea.minX) + spawnArea.minX;
        const testY = Math.random() * (spawnArea.maxY - spawnArea.minY) + spawnArea.minY;

        // Check overlap
        let overlap = false;
        for (const other of cups) {
            const dist = Math.hypot(testX - other.x, testY - other.y);
            if (dist < 80) { // Minimum distance between cups
                overlap = true;
                break;
            }
        }

        if (!overlap) {
            // Carnival-style: random rotation
            const randomRotation = (Math.random() - 0.5) * 0.3;

            const i = cups.length;
            const cup = {
                x: testX,
                y: testY,
                width: 55,
                height: 85,
                hit: false,
                golden: Math.random() < settings.golden,
                baseSpeed: settings.speed + Math.random() * 0.4, // Reduced speed for random layout
                direction: Math.random() < 0.5 ? 1 : -1,
                rotation: randomRotation,
                shake: 0,
                dodgeTimer: 0,
                dodgeDirection: 0,
                wobble: Math.random() * Math.PI * 2,
                isInside: false,
                insideTimer: 0,
                value: cupValues[i % cupValues.length].value,
                valueText: cupValues[i % cupValues.length].text,
                showValue: settings.showValues && Math.random() > 0.3
            };
            cups.push(cup);
        }
    }
}

/* =========================================================
   PARTICLE SYSTEM FOR EFFECTS
========================================================= */
class Particle {
    constructor(x, y, vx, vy, life = 30, type = "sparkle") {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.type = type;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3; // gravity
        this.vx *= 0.98; // air resistance
        this.life--;
    }

    draw(ctx) {
        const opacity = this.life / this.maxLife;
        ctx.globalAlpha = opacity;

        if (this.type === "sparkle") {
            ctx.fillStyle = "#FFD700";
            ctx.fillRect(this.x - 3, this.y - 3, 6, 6);
        } else if (this.type === "explosion") {
            ctx.fillStyle = "#FF6B9D";
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4 * opacity, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === "trail") {
            ctx.fillStyle = "#9D5FDD";
            ctx.beginPath();
            ctx.arc(this.x, this.y, 5 * opacity, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }
}

function addParticles(x, y, count = 8, type = "sparkle") {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 2 + Math.random() * 3;
        particles.push(new Particle(
            x + (Math.random() - 0.5) * 10,
            y + (Math.random() - 0.5) * 10,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            25 + Math.random() * 15,
            type
        ));
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => p.draw(ctx));
}

/* =========================================================
   TIMER SYSTEM
========================================================= */
function startTimer() {
    let timerInterval = setInterval(() => {
        if (!gameRunning) {
            clearInterval(timerInterval);
            return;
        }

        timer--;
        document.getElementById("timer").textContent = timer;

        if (timer <= 0 || balls <= 0) {
            endGame();
            clearInterval(timerInterval);
        }
    }, 1000);
}

/* =========================================================
   DRAW EVERYTHING
========================================================= */
function draw() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid for reference
    drawBackground();

    drawCups();
    drawBallTrail();
    drawBall();
    drawParticles();

    updateBall();
    updateParticles();

    requestAnimationFrame(draw);
}

/* =========================================================
   BACKGROUND WITH CARNIVAL TABLE SETUP
========================================================= */
function drawBackground() {
    // Wall background
    ctx.fillStyle = "#e8e8e8";
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);

    // Table surface (carnival style)
    const tableGradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
    tableGradient.addColorStop(0, "#8B4513"); // Brown wood
    tableGradient.addColorStop(0.5, "#6B3410");
    tableGradient.addColorStop(1, "#5A2D0C");
    ctx.fillStyle = tableGradient;
    ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);

    // Subtle wood grain
    ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
        const y = canvas.height * 0.4 + i * (canvas.height * 0.6 / 20);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Light reflection on table
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, canvas.height * 0.5, canvas.width * 0.4, canvas.height * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Carnival theme: Decorative dashed line marking throwing area
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 45);
    ctx.lineTo(canvas.width, canvas.height - 45);
    ctx.stroke();
    ctx.setLineDash([]);

    // Text for throwing area
    ctx.fillStyle = "rgba(100, 100, 100, 0.4)";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("← THROW FROM HERE →", canvas.width / 2, canvas.height - 20);
}

/* =========================================================
   DRAW REALISTIC RED PLASTIC CUPS (CARNIVAL STYLE)
========================================================= */
function drawCups() {
    cups.forEach(cup => {
        // Update shake
        if (cup.shake > 0) cup.shake--;

        let shakeX = cup.shake > 0 ? (Math.random() - 0.5) * 5 : 0;
        let shakeY = cup.shake > 0 ? (Math.random() - 0.5) * 3 : 0;

        // Smart cup behavior - dodge if ball is coming
        if (ball.thrown && !cup.hit) {
            const distToBall = Math.hypot(
                cup.x + cup.width / 2 - ball.x,
                cup.y + cup.height / 2 - ball.y
            );

            // Dodging behavior on hard difficulty
            if (difficulty === "hard" && distToBall < 120) {
                cup.dodgeTimer = 8;
                cup.dodgeDirection = ball.x < cup.x + cup.width / 2 ? -1 : 1;
            }
        }

        if (cup.dodgeTimer > 0) {
            cup.dodgeTimer--;
        }

        // Movement with slight wobble
        let speed = powerup === "slow" ? cup.baseSpeed * 0.4 : cup.baseSpeed;
        let dodgeBoost = cup.dodgeTimer > 0 ? cup.dodgeDirection * 2.5 : 0;

        cup.x += (speed * cup.direction + dodgeBoost) * 0.5;
        cup.wobble += 0.02;

        // Boundary bounce
        if (cup.x < 20) {
            cup.x = 20;
            cup.direction = 1;
        }
        if (cup.x + cup.width > canvas.width - 20) {
            cup.x = canvas.width - 20 - cup.width;
            cup.direction = -1;
        }

        // Draw cup with full transforms and realistic 3D effect
        const finalX = cup.x + shakeX;
        const finalY = cup.y + shakeY;

        ctx.save();
        ctx.translate(finalX + cup.width / 2, finalY + cup.height / 2);

        // Apply rotation
        ctx.rotate(cup.rotation);

        if (cup.shake > 0) {
            ctx.rotate((Math.random() - 0.5) * 0.08);
        }

        ctx.translate(-(cup.width / 2), -(cup.height / 2));

        // Draw realistic red plastic cup (wider at top, narrower at bottom)
        drawRedPlasticCup(ctx, cup);

        ctx.restore();
    });
}

/* =========================================================
   REALISTIC RED PLASTIC CUP DRAWING
========================================================= */
function drawRedPlasticCup(ctx, cup) {
    const w = cup.width;
    const h = cup.height;
    const topWidth = w;
    const bottomWidth = w * 0.65; // Narrower at bottom
    const rimHeight = h * 0.12;

    // Draw table shadow if cup is not hit
    if (!cup.hit) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.beginPath();
        ctx.ellipse(w / 2, h + 3, w / 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Main cup body (tapered shape - trapezoid)
    const gradient = ctx.createLinearGradient(0, 0, w, h);

    if (cup.hit) {
        // Green when hit
        gradient.addColorStop(0, "#90EE90");
        gradient.addColorStop(0.4, "#5DCE5D");
        gradient.addColorStop(1, "#3B8F3B");
    } else if (cup.golden) {
        // Golden cup
        gradient.addColorStop(0, "#FFE74C");
        gradient.addColorStop(0.5, "#FFD700");
        gradient.addColorStop(1, "#FFC700");
    } else {
        // Realistic red plastic cup
        gradient.addColorStop(0, "#FF6B6B");  // Bright red top (light reflection)
        gradient.addColorStop(0.3, "#E63946"); // Medium red
        gradient.addColorStop(0.7, "#CC2936"); // Darker red
        gradient.addColorStop(1, "#9B1D20");   // Dark red bottom
    }

    ctx.fillStyle = gradient;

    // Draw trapezoid (cup body)
    ctx.beginPath();
    ctx.moveTo((w - topWidth) / 2, 0);
    ctx.lineTo((w + topWidth) / 2, 0);
    ctx.lineTo((w + bottomWidth) / 2, h);
    ctx.lineTo((w - bottomWidth) / 2, h);
    ctx.closePath();
    ctx.fill();

    // Cup rim (darker line)
    ctx.strokeStyle = cup.hit ? "#2d6e2d" : cup.golden ? "#CC9800" : "#7a1818";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo((w - topWidth) / 2, 0);
    ctx.lineTo((w + topWidth) / 2, 0);
    ctx.stroke();

    // Cup outline
    ctx.strokeStyle = cup.hit ? "#2d6e2d" : cup.golden ? "#AA8800" : "#5a1018";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo((w - topWidth) / 2, 0);
    ctx.lineTo((w + topWidth) / 2, 0);
    ctx.lineTo((w + bottomWidth) / 2, h);
    ctx.lineTo((w - bottomWidth) / 2, h);
    ctx.closePath();
    ctx.stroke();

    // Cup interior highlight (subtle white area showing depth)
    if (!cup.hit) {
        const highlightGradient = ctx.createLinearGradient(0, 0, w * 0.3, h);
        highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
        highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0.02)");
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.moveTo((w - topWidth) / 2 + 3, 2);
        ctx.lineTo((w - topWidth) / 2 + w * 0.25, h - 3);
        ctx.lineTo((w - topWidth) / 2 + 8, h - 3);
        ctx.closePath();
        ctx.fill();
    }

    // Golden glow for special cups
    if (cup.golden && !cup.hit) {
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 12;
        ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo((w - topWidth) / 2, 0);
        ctx.lineTo((w + topWidth) / 2, 0);
        ctx.lineTo((w + bottomWidth) / 2, h);
        ctx.lineTo((w - bottomWidth) / 2, h);
        ctx.closePath();
        ctx.stroke();
        ctx.shadowColor = "transparent";
    }

    // Draw cup value text if shown
    if (cup.showValue && !cup.hit) {
        ctx.save();
        ctx.fillStyle = "white";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 2;
        ctx.fillText(cup.valueText, w / 2, h * 0.55);
        ctx.restore();
    }

    // Draw table/surface line under cups
    ctx.strokeStyle = "rgba(100, 100, 100, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, h + 8);
    ctx.lineTo(canvas.width, h + 8);
    ctx.stroke();
    ctx.setLineDash([]);
}

/* =========================================================
   DRAW BALL WITH ROTATION & TRAIL
========================================================= */
function drawBallTrail() {
    if (ball.trail.length > 1) {
        for (let i = 0; i < ball.trail.length - 1; i++) {
            const opacity = i / ball.trail.length;
            ctx.globalAlpha = opacity * 0.3;
            ctx.fillStyle = "#9D5FDD";
            ctx.beginPath();
            ctx.arc(ball.trail[i].x, ball.trail[i].y, ball.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

function drawBall() {
    ctx.save();
    ctx.translate(ball.x, ball.y);

    // Rotation effect
    if (Math.abs(ball.spin) > 0.01) {
        ctx.rotate(ball.spin);
    }

    // Ball body with gradient
    const ballGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, ball.radius);
    ballGradient.addColorStop(0, "#b89dff");
    ballGradient.addColorStop(0.7, "#6a5acd");
    ballGradient.addColorStop(1, "#4a3a9d");

    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ballGradient;
    ctx.fill();

    // Ball outline
    ctx.strokeStyle = "#3a2a7d";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Spin indicator lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * ball.radius * 0.6, Math.sin(angle) * ball.radius * 0.6);
        ctx.stroke();
    }

    ctx.restore();
}

function addBallTrail() {
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 15) {
        ball.trail.shift();
    }
}

/* =========================================================
   ENHANCED PHYSICS: BALL MOVEMENT WITH IMPROVED BOUNCING
========================================================= */
function updateBall() {
    if (!ball.thrown) return;

    // Add trail
    if (ball.trail.length === 0 ||
        Math.hypot(ball.x - ball.trail[ball.trail.length - 1].x,
            ball.y - ball.trail[ball.trail.length - 1].y) > 3) {
        addBallTrail();
    }

    // Apply gravity (more pronounced for realistic fall)
    ball.vy += GRAVITY;

    // Apply air resistance (makes ball slow down naturally)
    ball.vx *= AIR_RESISTANCE;
    ball.vy *= AIR_RESISTANCE;

    // Update position
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Update spin
    ball.spin += ball.vx * 0.02;
    ball.spin *= SPIN_FRICTION;

    // Canvas boundary collision (bounce with energy loss)
    if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx *= -BOUNCE_DAMPING;
        addParticles(ball.x, ball.y, 4, "trail");
    }
    if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.vx *= -BOUNCE_DAMPING;
        addParticles(ball.x, ball.y, 4, "trail");
    }
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy *= -BOUNCE_DAMPING;
        addParticles(ball.x, ball.y, 4, "trail");
    }

    // Table collision (bouncy surface)
    const tableY = canvas.height * 0.4;
    if (ball.y + ball.radius > tableY &&
        ball.y - ball.radius < tableY + 30 &&
        ball.vy > 0.5) {
        // Ball bouncing on table
        ball.y = tableY - ball.radius;
        ball.vy *= -BOUNCE_DAMPING;
        addParticles(ball.x, ball.y, 6, "trail");
    }

    // Cup collision detection (circle-to-trapezoid)
    cups.forEach(cup => {
        if (!cup.hit) {
            const collision = checkCollision(ball, cup);
            if (collision.hit) {
                handleCupHit(cup, ball, collision);
            }
        }
    });

    // Reset if ball falls off screen
    if (ball.y > canvas.height + 50) {
        resetBall();
        combo = 0;
    }
}

/* =========================================================
   IMPROVED COLLISION DETECTION FOR CUP INSERTION
========================================================= */
function checkCollision(ball, cup) {
    // Check if ball is inside the cup (more realistic than simple AABB)
    // Cup is wider at top, narrower at bottom (trapezoid)

    const topWidth = cup.width;
    const bottomWidth = cup.width * 0.65;
    const cupHeight = cup.height;

    // Calculate cup boundaries with trapezoid shape
    const cupCenterX = cup.x + cup.width / 2;
    const cupTopLeft = cup.x + (cup.width - topWidth) / 2;
    const cupTopRight = cup.x + (cup.width + topWidth) / 2;
    const cupBottomLeft = cup.x + (cup.width - bottomWidth) / 2;
    const cupBottomRight = cup.x + (cup.width + bottomWidth) / 2;

    // Check if ball center is within Y bounds
    if (ball.y >= cup.y && ball.y <= cup.y + cupHeight) {
        // Calculate the interpolated cup width at ball's Y position
        const yProgress = (ball.y - cup.y) / cupHeight;
        const currentTopWidth = topWidth + (bottomWidth - topWidth) * yProgress;
        const currentLeftX = cup.x + (cup.width - currentTopWidth) / 2;
        const currentRightX = cup.x + (cup.width + currentTopWidth) / 2;

        // Check if ball center is within X bounds at this Y level
        const ballCenterX = ball.x;

        if (ballCenterX >= currentLeftX - ball.radius &&
            ballCenterX <= currentRightX + ball.radius) {

            // Ball is in contact with cup
            // Calculate distance to cup edges for proper collision normal
            const distToLeft = Math.abs(ballCenterX - currentLeftX);
            const distToRight = Math.abs(ballCenterX - currentRightX);
            const distToTop = Math.abs(ball.y - cup.y);
            const distToBottom = Math.abs(ball.y - (cup.y + cupHeight));

            const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

            let normalX = 0, normalY = 0;
            if (minDist === distToLeft) normalX = -1;
            else if (minDist === distToRight) normalX = 1;
            else if (minDist === distToTop) normalY = -1;
            else normalY = 1;

            return {
                hit: true,
                distance: 0,
                normalX: normalX,
                normalY: normalY,
                impactX: ballCenterX,
                impactY: ball.y,
                isInsideCup: ball.y > cup.y + cupHeight * 0.3 &&
                    ballCenterX > currentLeftX &&
                    ballCenterX < currentRightX
            };
        }
    }

    // Edge collision for ball hitting cup from outside
    const closestX = Math.max(cup.x, Math.min(ball.x, cup.x + cup.width));
    const closestY = Math.max(cup.y, Math.min(ball.y, cup.y + cupHeight));

    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const distance = Math.hypot(dx, dy);

    if (distance < ball.radius) {
        return {
            hit: true,
            distance: distance,
            normalX: dx / distance || 0,
            normalY: dy / distance || 0,
            impactX: closestX,
            impactY: closestY,
            isInsideCup: false
        };
    }

    return { hit: false };
}

/* =========================================================
   CUP HIT HANDLER (SCORING + EFFECTS + CUP VALUE BONUS)
========================================================= */
function handleCupHit(cup, ball, collision) {
    cup.hit = true;
    cup.shake = 15;

    // Calculate bonus points based on impact velocity and cup value
    const impactForce = Math.hypot(ball.vx, ball.vy);
    const angleBonus = Math.abs(ball.vy / (Math.hypot(ball.vx, ball.vy) + 0.1)) * 5;

    let points = 0;
    let hitType = "normal";

    // Base points vary by cup type and value
    if (cup.golden) {
        points = 40 + Math.floor(angleBonus);
        hitType = "golden";
    } else {
        // Bonus for hitting inside cup vs edge
        const insideCupBonus = collision.isInsideCup ? 20 : 0;
        points = (10 + cup.value) + combo * 3 + Math.floor(impactForce) + insideCupBonus;
        hitType = collision.isInsideCup ? "inside" : "edge";
    }

    // Update score
    score += points;
    combo++;
    document.getElementById("score").textContent = score;

    // Show combo popup with cup value info
    const popupText = collision.isInsideCup ?
        `+${points} JACKPOT! (x${combo})` :
        `+${points} (x${combo})`;
    showComboPopup(cup.x + cup.width / 2, cup.y - 30, popupText);

    // Play sound based on hit type
    if (cup.golden) {
        sndGolden.play().catch(() => { });
        addParticles(cup.x + cup.width / 2, cup.y + cup.height / 2, 15, "sparkle");
        if (Math.random() < 0.6) activatePower("slow");
    } else if (collision.isInsideCup) {
        // Special sound and effect for landing inside cup
        sndGolden.play().catch(() => { }); // Use golden sound for inside cup
        addParticles(cup.x + cup.width / 2, cup.y + cup.height * 0.6, 18, "sparkle");
        if (Math.random() < 0.4) activatePower("slow");
    } else {
        sndHit.play().catch(() => { });
        addParticles(cup.x + cup.width / 2, cup.y + cup.height / 2, 10, "explosion");
        if (Math.random() < 0.12) activatePower("explode");
    }

    // Explode if power is active
    if (powerup === "explode") {
        sndExplode.play().catch(() => { });
        explodeArea(cup.x + cup.width / 2, cup.y + cup.height / 2);
        addParticles(cup.x + cup.width / 2, cup.y + cup.height / 2, 25, "explosion");
    }

    // Apply collision response with damping
    ball.vx *= -0.25;
    ball.vy *= -0.4;
}

/* =========================================================
   IMPROVED COMBO DISPLAY
========================================================= */
function showComboPopup(x, y, text) {
    const popup = document.createElement("div");
    popup.className = "combo-popup";
    popup.style.left = x + "px";
    popup.style.top = y + "px";
    popup.style.position = "absolute";
    popup.style.fontSize = "18px";
    popup.style.fontWeight = "bold";
    popup.style.color = "#FF1493";
    popup.style.pointerEvents = "none";
    popup.style.zIndex = "100";
    popup.style.whiteSpace = "nowrap";
    popup.textContent = text;

    const gameContainer = document.querySelector(".game-card") || canvas.parentElement;
    gameContainer.appendChild(popup);

    setTimeout(() => popup.remove(), 900);
}

/* =========================================================
   EXPLOSION POWERUP (CHAIN REACTION)
========================================================= */
function explodeArea(x, y) {
    const explosionRadius = 150;
    let hitCount = 0;

    cups.forEach(cup => {
        if (!cup.hit) {
            const dist = Math.hypot(
                cup.x + cup.width / 2 - x,
                cup.y + cup.height / 2 - y
            );

            if (dist < explosionRadius) {
                cup.hit = true;
                cup.shake = 15;
                score += 25;
                hitCount++;

                addParticles(
                    cup.x + cup.width / 2,
                    cup.y + cup.height / 2,
                    10,
                    "explosion"
                );
            }
        }
    });

    document.getElementById("score").textContent = score;

    // Show explosion animation
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(255, 100, 150, 0.3)";
    ctx.beginPath();
    ctx.arc(x, y, explosionRadius, 0, Math.PI * 2);
    ctx.fill();
}

/* =========================================================
   RESET BALL
========================================================= */
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 30;
    ball.vx = 0;
    ball.vy = 0;
    ball.thrown = false;
    ball.spin = 0;
    ball.trail = [];
}

/* =========================================================
   MOUSE CONTROLS (DRAG-TO-THROW WITH PREVIEW)
========================================================= */
let dragging = false;
let dragStart = { x: 0, y: 0 };
let dragEnd = { x: 0, y: 0 };

canvas.addEventListener("mousedown", e => {
    if (!gameRunning || ball.thrown) return;

    dragging = true;
    const rect = canvas.getBoundingClientRect();
    dragStart.x = e.clientX - rect.left;
    dragStart.y = e.clientY - rect.top;
});

canvas.addEventListener("mousemove", e => {
    if (!dragging) return;

    const rect = canvas.getBoundingClientRect();
    dragEnd.x = e.clientX - rect.left;
    dragEnd.y = e.clientY - rect.top;

    // Visual preview (drawn in next frame)
});

canvas.addEventListener("mouseup", e => {
    if (!dragging) return;

    dragging = false;
    const rect = canvas.getBoundingClientRect();
    dragEnd.x = e.clientX - rect.left;
    dragEnd.y = e.clientY - rect.top;

    throwBall(dragStart, dragEnd);
});

/* =========================================================
   THROW BALL (PHYSICS-BASED)
========================================================= */
function throwBall(start, end) {
    if (balls <= 0 || ball.thrown) return;

    balls--;
    document.getElementById("balls").textContent = balls;

    try {
        sndThrow.play().catch(() => { }); // Handle autoplay restrictions
    } catch (e) { }

    // Calculate velocity
    const velocityFactor = 0.15;
    ball.vx = (start.x - end.x) * velocityFactor;
    ball.vy = (start.y - end.y) * velocityFactor;

    // Add spin based on drag angle
    ball.spin = (start.x - end.x) * 0.01;

    ball.thrown = true;
}

/* =========================================================
   POWERUP SYSTEM
========================================================= */
function activatePower(type) {
    powerup = type;
    powerTimer = 5;
    document.getElementById("power").textContent = type.toUpperCase();

    const t = setInterval(() => {
        powerTimer--;
        document.getElementById("power").textContent =
            powerTimer > 0 ? type.toUpperCase() : "None";

        if (powerTimer <= 0) {
            clearInterval(t);
            powerup = "none";
        }
    }, 1000);
}

/* =========================================================
   END GAME
========================================================= */
function endGame() {
    gameRunning = false;

    document.getElementById("finalScore").textContent = score;

    saveHighScore(score);

    const gameOverMsg = document.getElementById("gameOverMsg");
    if (gameOverMsg) {
        gameOverMsg.classList.remove("hidden");
    } else {
        // Fallback for index.html
        const gameOver = document.getElementById("gameOver");
        if (gameOver) {
            gameOver.classList.remove("hidden");
        }
    }
}

/* =========================================================
   SAVE SCORE TO LEADERBOARD
========================================================= */
function saveHighScore(value) {
    let scores = JSON.parse(localStorage.getItem("ballTossScores") || "[]");

    scores.push(value);
    scores.sort((a, b) => b - a);
    scores = scores.slice(0, 10);

    localStorage.setItem("ballTossScores", JSON.stringify(scores));
}

/* =========================================================
   START GAME HANDLER
========================================================= */
function startGame(difficultyLevel) {
    const menu = document.getElementById("menu");
    const gameUI = document.getElementById("gameUI");

    if (menu) menu.classList.add("hidden");
    if (gameUI) gameUI.classList.remove("hidden");

    setupGame(difficultyLevel);
}
