// --- NEON ENDEAVOR - GAME CODE ---

// ==========================================
// 1. AUDIO SYNTHESIZER (Web Audio API)
// ==========================================
class SoundSynth {
    constructor() {
        this.ctx = null;
        this.masterVolume = null;
        this.bgmInterval = null;
        this.bgmSequence = [
            { note: "A1", type: "bass" }, { note: "A1", type: "bass" }, 
            { note: "C2", type: "bass" }, { note: "G1", type: "bass" },
            { note: "A1", type: "bass" }, { note: "A1", type: "bass" }, 
            { note: "E2", type: "bass" }, { note: "D2", type: "bass" }
        ];
        this.bgmIndex = 0;
        this.isBGMPlaying = false;
        
        // Frequencies for notes
        this.notes = {
            "A1": 55.00, "G1": 49.00, "C2": 65.41, "D2": 73.42, "E2": 82.41,
            "A4": 440.00, "B4": 493.88, "C5": 523.25, "E5": 659.25, "G5": 783.99, "A5": 880.00
        };
    }

    init() {
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterVolume = this.ctx.createGain();
        this.masterVolume.gain.setValueAtTime(0.3, this.ctx.currentTime);
        this.masterVolume.connect(this.ctx.destination);
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playChime() {
        if (!this.ctx) return;
        this.resume();
        
        const now = this.ctx.currentTime;
        const playTone = (freq, time, duration) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            
            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
            
            osc.connect(gain);
            gain.connect(this.masterVolume);
            osc.start(time);
            osc.stop(time + duration);
        };

        // Play a quick upbeat major arpeggio
        playTone(this.notes["C5"], now, 0.15);
        playTone(this.notes["E5"], now + 0.06, 0.15);
        playTone(this.notes["G5"], now + 0.12, 0.25);
        playTone(this.notes["A5"], now + 0.18, 0.35);
    }

    playBuzzer() {
        if (!this.ctx) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        // Low annoying buzz frequency
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.3);
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.connect(gain);
        gain.connect(this.masterVolume);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playCrash() {
        if (!this.ctx) return;
        this.resume();

        const now = this.ctx.currentTime;
        
        // Low rumble generator using triangle oscillator
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);

        // Noise buffer generation for the explosion crackle
        const bufferSize = this.ctx.sampleRate * 0.6; // 0.6 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(400, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(10, now + 0.6);
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        // Connect noise
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterVolume);
        
        // Connect rumble
        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(now);
        osc.stop(now + 0.6);
        noise.start(now);
        noise.stop(now + 0.6);
    }

    playWarning() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(550, now + 0.1);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        osc.connect(gain);
        gain.connect(this.masterVolume);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    startBGM() {
        if (this.isBGMPlaying) return;
        this.init();
        this.resume();
        this.isBGMPlaying = true;
        this.bgmIndex = 0;
        
        const tempo = 120; // BPM
        const stepTime = 60 / tempo / 2; // 8th notes
        
        const playStep = () => {
            if (!this.isBGMPlaying) return;
            const now = this.ctx.currentTime;
            
            // Bassline
            const item = this.bgmSequence[this.bgmIndex];
            const freq = this.notes[item.note];
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 0.95);
            
            osc.connect(gain);
            gain.connect(this.masterVolume);
            osc.start(now);
            osc.stop(now + stepTime);

            // Synthesized hi-hat/noise burst on odd beats
            if (this.bgmIndex % 2 === 1) {
                const hatSize = this.ctx.sampleRate * 0.03;
                const hatBuffer = this.ctx.createBuffer(1, hatSize, this.ctx.sampleRate);
                const hatData = hatBuffer.getChannelData(0);
                for (let i = 0; i < hatSize; i++) {
                    hatData[i] = Math.random() * 2 - 1;
                }
                const hatSource = this.ctx.createBufferSource();
                hatSource.buffer = hatBuffer;
                
                const hatFilter = this.ctx.createBiquadFilter();
                hatFilter.type = 'highpass';
                hatFilter.frequency.setValueAtTime(8000, now);
                
                const hatGain = this.ctx.createGain();
                hatGain.gain.setValueAtTime(0.02, now);
                hatGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
                
                hatSource.connect(hatFilter);
                hatFilter.connect(hatGain);
                hatGain.connect(this.masterVolume);
                hatSource.start(now);
                hatSource.stop(now + 0.04);
            }

            // Simple ambient melody pattern
            if (this.bgmIndex === 0 && Math.random() > 0.4) {
                const melNotes = ["A4", "C5", "E5", "G5"];
                const melNote = melNotes[Math.floor(Math.random() * melNotes.length)];
                const melFreq = this.notes[melNote];
                
                const melOsc = this.ctx.createOscillator();
                const melGain = this.ctx.createGain();
                melOsc.type = 'sine';
                melOsc.frequency.setValueAtTime(melFreq, now);
                
                melGain.gain.setValueAtTime(0.03, now);
                melGain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 4);
                
                melOsc.connect(melGain);
                melGain.connect(this.masterVolume);
                melOsc.start(now);
                melOsc.stop(now + stepTime * 4);
            }

            this.bgmIndex = (this.bgmIndex + 1) % this.bgmSequence.length;
        };

        // Run the step loop
        this.bgmInterval = setInterval(playStep, stepTime * 1000);
    }

    stopBGM() {
        this.isBGMPlaying = false;
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }
}

const sound = new SoundSynth();

// ==========================================
// 2. ENGINE CONSTANTS & MATHEMATICS
// ==========================================
const ROAD_SEGMENT_LENGTH = 200; // length of each segment
const ROAD_WIDTH = 2000;         // width of road in 3D units
const CAMERA_HEIGHT = 1000;      // camera height above road
const CAMERA_DEPTH = 0.8;        // perspective factor (focal length)
const DRAW_DISTANCE = 300;       // number of segments to draw
const FIELD_OF_VIEW = 100;

// Shapes list
const TARGET_SHAPES = ['octopus', 'fish', 'star'];
const TARGET_COLORS = [
    { name: 'green', code: '#39ff14', shadow: 'rgba(57, 255, 20, 0.8)' },
    { name: 'pink', code: '#ff007f', shadow: 'rgba(255, 0, 127, 0.8)' },
    { name: 'blue', code: '#00f0ff', shadow: 'rgba(0, 240, 255, 0.8)' },
    { name: 'yellow', code: '#ffe600', shadow: 'rgba(255, 230, 0, 0.8)' }
];

// Helper to project 3D coordinates to 2D Screen
function project(point, cameraX, cameraY, cameraZ, canvasWidth, canvasHeight) {
    const transX = point.x - cameraX;
    const transY = point.y - cameraY;
    const transZ = point.z - cameraZ;
    
    if (transZ <= 0) return null; // behind camera
    
    const scale = CAMERA_DEPTH / transZ;
    
    return {
        x: Math.round((canvasWidth / 2) + (scale * transX * canvasWidth / 2)),
        y: Math.round((canvasHeight / 2) - (scale * transY * canvasHeight / 2)),
        w: Math.round(scale * ROAD_WIDTH * canvasWidth / 2)
    };
}

// Draw polygon helper
function drawPolygon(ctx, x1, y1, w1, x2, y2, w2, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1 - w1, y1);
    ctx.lineTo(x2 - w2, y2);
    ctx.lineTo(x2 + w2, y2);
    ctx.lineTo(x1 + w1, y1);
    ctx.closePath();
    ctx.fill();
}

// ==========================================
// 3. GAME MAIN MODULE
// ==========================================
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Handle responsive resize
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
        
        // Screens
        this.startMenu = document.getElementById('start-menu');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.hud = document.getElementById('hud');
        this.touchControls = document.getElementById('touch-controls');
        
        // HUD elements
        this.hudScore = document.getElementById('hud-score');
        this.hudSpeed = document.getElementById('hud-speed');
        this.hudSyncBar = document.getElementById('hud-sync-bar');
        this.hudSyncCombo = document.getElementById('hud-sync-combo');
        this.hudEnergyBar = document.getElementById('hud-energy-bar');
        this.hudTargetInstruction = document.getElementById('target-instruction');
        
        // Sound toggle/calibrator popup
        this.calibrationPopup = document.getElementById('calibration-popup');
        
        // Buttons
        document.getElementById('btn-play-gyro').addEventListener('click', () => this.initGame(true));
        document.getElementById('btn-play-touch').addEventListener('click', () => this.initGame(false));
        document.getElementById('btn-retry').addEventListener('click', () => this.initGame(this.gyroEnabled));
        document.getElementById('btn-quit').addEventListener('click', () => this.quitToMenu());
        
        // Game state variables
        this.isRunning = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('neon_high_score') || '0');
        this.energy = 100; // acts as health/shield
        this.combo = 0;
        
        // Player state
        this.playerX = 0; // -1 to 1 (left to right edge of the road)
        this.playerZ = 0; // distance along track
        this.speed = 0;
        this.maxSpeed = 120; // DDA scaled
        this.steerInput = 0; // input value from keyboard/touch
        this.shipRotation = 0;
        
        // Camera / World state
        this.roadSegments = [];
        this.trackLength = 0;
        this.obstacles = [];
        this.targets = [];
        this.particles = [];
        
        // Screen flash overlays
        this.screenFlashType = null; // 'success' or 'damage'
        this.screenFlashTimer = 0;
        this.cameraShake = 0;
        
        // DDA (Dynamic Difficulty) System
        this.currentLevel = 1;
        this.steeringAccuracy = 1.0; // sliding average of distance-from-center
        this.targetHitsCount = 0;
        this.targetSpawnsCount = 0;
        this.targetErrorsCount = 0;
        this.obstacleCollisionsCount = 0;
        
        // Go/No-Go configuration
        this.currentTargetRule = { shape: 'octopus', color: TARGET_COLORS[0] }; // shape & color
        this.targetInstructionTimer = 0;
        this.targetInstructionDuration = 18000; // change rule every 18 seconds
        
        // Target spawning state
        this.targetSpawnTimer = 0;
        this.dynamicSwitchingEnabled = true;
        
        // Controller setup
        this.gyroEnabled = false;
        this.gyroCalibratedGamma = 0;
        this.gyroCurrentGamma = 0;
        this.touchStartX = 0;
        this.touchCurrentX = 0;
        this.isSteerTouching = false;
        
        this.setupKeyboardInput();
        this.setupTouchInput();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // ==========================================
    // INPUT HANDLING
    // ==========================================
    setupKeyboardInput() {
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Tap action (Spacebar or KeyJ)
            if ((e.code === 'Space' || e.code === 'KeyJ') && this.isRunning) {
                e.preventDefault();
                this.triggerTargetAction();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    setupTouchInput() {
        const steerZone = document.getElementById('touch-steer-zone');
        const actionZone = document.getElementById('touch-action-zone');
        const steerHandle = document.getElementById('touch-steer-handle');

        // Steering area touches
        steerZone.addEventListener('touchstart', (e) => {
            if (!this.isRunning || this.gyroEnabled) return;
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchCurrentX = touch.clientX;
            this.isSteerTouching = true;
            this.steerTouchId = touch.identifier; // track touch by unique identifier
            
            // Position the visual steering handle
            steerHandle.classList.remove('hidden');
            this.updateTouchHandlePosition(touch.clientX);
        }, { passive: true });

        steerZone.addEventListener('touchmove', (e) => {
            if (!this.isSteerTouching) return;
            // Find active touch matching our identifier
            let activeTouch = null;
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === this.steerTouchId) {
                    activeTouch = e.touches[i];
                    break;
                }
            }
            if (activeTouch) {
                this.touchCurrentX = activeTouch.clientX;
                this.updateTouchHandlePosition(activeTouch.clientX);
            }
        }, { passive: true });

        const endSteer = () => {
            this.isSteerTouching = false;
            this.steerInput = 0;
            steerHandle.classList.add('hidden');
        };
        steerZone.addEventListener('touchend', endSteer, { passive: true });
        steerZone.addEventListener('touchcancel', endSteer, { passive: true });

        // Tapping/shooting action area touch
        actionZone.addEventListener('touchstart', (e) => {
            if (!this.isRunning) return;
            e.preventDefault();
            this.triggerTargetAction();
        });

        // Desktop mouse click support on the target button/zone
        actionZone.addEventListener('mousedown', (e) => {
            if (!this.isRunning) return;
            if (e.button !== 0) return; // only left click
            e.preventDefault();
            this.triggerTargetAction();
        });
    }

    updateTouchHandlePosition(clientX) {
        const steerZone = document.getElementById('touch-steer-zone');
        const rect = steerZone.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        
        // Calculate steer input based on drag distance from touch start
        // Max drag is 80px in either direction
        const maxDrag = 80;
        let delta = clientX - this.touchStartX;
        delta = Math.max(-maxDrag, Math.min(maxDrag, delta));
        
        // Map to -1 to 1 steering input
        this.steerInput = delta / maxDrag;
        
        // Move the visual handle
        const handle = document.getElementById('touch-steer-handle');
        handle.style.transform = `translateX(${delta}px)`;
    }

    setupGyroscope() {
        return new Promise((resolve) => {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                // iOS request permissions
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            this.enableGyroEvents(resolve);
                        } else {
                            alert("Gyroscope permission denied. Falling back to touch controls.");
                            resolve(false);
                        }
                    })
                    .catch(err => {
                        console.error("DeviceOrientation permission error:", err);
                        resolve(false);
                    });
            } else {
                // Non-iOS or older browser (Android/Desktop)
                this.enableGyroEvents(resolve);
            }
        });
    }

    enableGyroEvents(resolve) {
        let firstEventReceived = false;
        
        const orientationHandler = (e) => {
            if (e.gamma === null) {
                // Device reports event but lacks physical sensors (like desktop browser)
                window.removeEventListener('deviceorientation', orientationHandler);
                resolve(false);
                return;
            }
            
            if (!firstEventReceived) {
                firstEventReceived = true;
                this.gyroCalibratedGamma = e.gamma; // set initial baseline
                window.removeEventListener('deviceorientation', orientationHandler);
                
                // Re-add long running listener
                window.addEventListener('deviceorientation', (event) => {
                    if (this.isRunning && this.gyroEnabled) {
                        this.gyroCurrentGamma = event.gamma;
                    }
                });
                resolve(true);
            }
        };

        window.addEventListener('deviceorientation', orientationHandler);

        // Safety timeout (if no orientation event fires within 1 second, resolve false)
        setTimeout(() => {
            if (!firstEventReceived) {
                window.removeEventListener('deviceorientation', orientationHandler);
                resolve(false);
            }
        }, 1000);
    }

    // ==========================================
    // ROAD GENERATION & MAP CREATION
    // ==========================================
    generateRoad() {
        this.roadSegments = [];
        let segmentsCount = 2000;
        
        // Define track blocks (straight, curves)
        let z = 0;
        
        const addSegment = (curve, y) => {
            this.roadSegments.push({
                index: this.roadSegments.length,
                p1: { x: 0, y: y, z: z },
                p2: { x: 0, y: y, z: z + ROAD_SEGMENT_LENGTH },
                curve: curve,
                color: Math.floor(z / (ROAD_SEGMENT_LENGTH * 3)) % 2 === 0 ? '#0b0c1e' : '#040510' // Alternating dark colors
            });
            z += ROAD_SEGMENT_LENGTH;
        };

        const addRoadSection = (len, curve, yDelta) => {
            let startY = this.roadSegments.length > 0 ? this.roadSegments[this.roadSegments.length - 1].p2.y : 0;
            for (let i = 0; i < len; i++) {
                // Ease in-out road curve & height
                let t = i / len;
                let c = curve * Math.sin(t * Math.PI);
                let y = startY + yDelta * Math.sin(t * (Math.PI / 2));
                addSegment(c, y);
            }
        };

        // Building the track procedurally
        while (this.roadSegments.length < segmentsCount) {
            addRoadSection(50, 0, 0); // straight
            addRoadSection(40, 2, 200); // curve right & hill
            addRoadSection(60, -3, -100); // curve left & downhill
            addRoadSection(40, 1, 0);
            addRoadSection(80, -4, 300); // sharp curve left
            addRoadSection(30, 0, -400); // hill descent
            addRoadSection(50, 4, 100); // sharp curve right
        }
        
        this.trackLength = this.roadSegments.length * ROAD_SEGMENT_LENGTH;
        
        // Spawn Obstacles & Targets on the segments
        this.spawnObjects();
    }

    spawnObjects() {
        this.obstacles = [];
        this.targets = []; // Spawned dynamically on time intervals
        this.gates = [];   // Collectible steering gates
        
        // 1. Spawn single Gates procedurally
        // Spawn a gate every 20 segments.
        for (let i = 100; i < this.roadSegments.length - 50; i += 20) {
            let segment = this.roadSegments[i];
            if (!segment) continue;

            // Determine gate position (left, center, right)
            let gateX = 0;
            if (segment.curve > 1.0) {
                gateX = 0.6; // right on curves
            } else if (segment.curve < -1.0) {
                gateX = -0.6; // left on curves
            } else {
                // Randomize center, left, right on straights
                let r = Math.random();
                if (r < 0.33) {
                    gateX = -0.6;
                } else if (r < 0.66) {
                    gateX = 0.6;
                } else {
                    gateX = 0.0;
                }
            }

            this.gates.push({
                segmentIndex: segment.index,
                x: gateX * (ROAD_WIDTH / 2),
                y: segment.p1.y,
                z: segment.p1.z,
                scale: 220,
                collected: false,
                missed: false
            });
        }

        // 2. Spawn Obstacles
        // Start spawning after index 120, spacing by 30 segments
        for (let i = 120; i < this.roadSegments.length - 50; i += 30) {
            let skipFactor = Math.floor(Math.random() * 3);
            i += skipFactor * 10;
            if (i >= this.roadSegments.length - 50) break;

            const segment = this.roadSegments[i];

            // Check if a gate exists on or near this segment
            let nearbyGate = this.gates.find(g => Math.abs(g.segmentIndex - i) <= 2);
            let sideX = (Math.random() * 1.4) - 0.7;

            if (nearbyGate) {
                // There is a gate nearby! Place the obstacle on the OPPOSITE side
                let gateRoadX = nearbyGate.x / (ROAD_WIDTH / 2);
                if (gateRoadX === 0) {
                    sideX = Math.random() > 0.5 ? -0.75 : 0.75;
                } else {
                    sideX = -gateRoadX * 0.8;
                }
            }

            if (Math.random() > 0.4) {
                this.obstacles.push({
                    segmentIndex: i,
                    x: sideX * (ROAD_WIDTH / 2),
                    y: segment.p1.y,
                    z: segment.p1.z,
                    scale: 300,
                    collided: false
                });
            }
        }
    }

    spawnDynamicTarget() {
        this.targetSpawnsCount++;
        // Spawn target directly in foreground depth (~800 units ahead)
        let direction = Math.random() > 0.5 ? 1 : -1; // 1 = Left to Right, -1 = Right to Left
        let startX = -direction * (ROAD_WIDTH * 0.95); // Spawn off-screen on the side
        let targetX = direction * (ROAD_WIDTH * 0.95);
        
        let targetZ = this.playerZ + 800;
        let segIndex = Math.floor(targetZ / ROAD_SEGMENT_LENGTH);
        let segment = this.roadSegments[segIndex % this.roadSegments.length];
        let targetY = (segment ? segment.p1.y : 0) + 220; // Lower baseline so jump looks natural in front of ship

        const shape = TARGET_SHAPES[Math.floor(Math.random() * TARGET_SHAPES.length)];
        const color = TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)];
        
        // Adjusted crossing duration (1.6s down to 1.2s based on level)
        let crossDuration = 1.7 - (this.currentLevel * 0.1);
        let vx = (targetX - startX) / crossDuration;
        
        this.targets.push({
            id: Math.random(),
            x: startX,
            y: targetY,
            baseY: targetY,
            z: targetZ,
            vx: vx,
            shape: shape,
            color: color,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 0.05,
            direction: direction,
            collected: false,
            missed: false,
            activeTime: 0,
            totalActiveDuration: crossDuration
        });
    }

    // ==========================================
    // GAMEPLAY LOGIC AND DDA
    // ==========================================
    initGame(useGyro) {
        sound.init();
        
        if (useGyro) {
            // Show calibrator dialog
            this.calibrationPopup.classList.remove('hidden');
            
            this.setupGyroscope().then((success) => {
                this.calibrationPopup.classList.add('hidden');
                if (success) {
                    this.gyroEnabled = true;
                    this.startGame();
                } else {
                    this.gyroEnabled = false;
                    alert("Gyroscope sensor could not be started or is not supported. Falling back to Touch/Keyboard mode.");
                    this.startGame();
                }
            });
        } else {
            this.gyroEnabled = false;
            this.startGame();
        }
    }

    startGame() {
        this.isRunning = true;
        this.score = 0;
        this.energy = 100;
        this.combo = 0;
        this.speed = 0;
        this.playerX = 0;
        this.playerZ = 0;
        this.currentLevel = 1;
        this.cameraShake = 0;
        
        // Reset dynamic target spawn timer
        this.targetSpawnTimer = 0;
        this.dynamicSwitchingEnabled = document.getElementById('toggle-dynamic-switching').checked;
        
        // Reset statistics
        this.targetHitsCount = 0;
        this.targetSpawnsCount = 0;
        this.targetErrorsCount = 0;
        this.targetOmissionMissesCount = 0;
        this.obstacleCollisionsCount = 0;
        this.steeringAccuracy = 1.0;
        this.gates = [];
        
        this.generateRoad();
        
        // Set first instruction rule
        this.changeTargetInstruction();
        
        // Hide screens, show HUD and touch controls
        this.startMenu.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        this.touchControls.classList.remove('hidden');
        
        sound.startBGM();
        
        // Start main loop
        requestAnimationFrame(() => this.loop());
    }

    quitToMenu() {
        this.isRunning = false;
        sound.stopBGM();
        this.gameOverScreen.classList.add('hidden');
        this.hud.classList.add('hidden');
        this.touchControls.classList.add('hidden');
        this.startMenu.classList.remove('hidden');
    }

    changeTargetInstruction() {
        // Pick random shape and color
        const shape = TARGET_SHAPES[Math.floor(Math.random() * TARGET_SHAPES.length)];
        const color = TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)];
        
        this.currentTargetRule = { shape: shape, color: color };
        this.targetInstructionTimer = Date.now();
        
        // Pluralize creature names properly
        let shapePlural = shape.toUpperCase();
        if (shape === 'octopus') {
            shapePlural = 'OCTOPUSES';
        } else if (shape === 'fish') {
            shapePlural = 'FISH';
        } else if (shape === 'star') {
            shapePlural = 'STARS';
        }
        const colStr = color.name.toUpperCase();
        
        this.hudTargetInstruction.textContent = `TAP ${colStr} ${shapePlural} ONLY!`;
        this.hudTargetInstruction.style.color = color.code;
        
        // Pulsate/glow with correct target color
        const targetBox = document.querySelector('.target-instruction-box');
        targetBox.style.borderColor = color.code;
        targetBox.style.boxShadow = `0 0 20px ${color.shadow}`;
        
        // Play notification warning chime
        sound.playWarning();
    }

    triggerTargetAction() {
        // Player triggers tap action: Search for any active crossing target
        let hitTarget = null;
        
        for (let target of this.targets) {
            if (!target.collected && !target.missed) {
                hitTarget = target;
                break; // Tap checks the currently active crossing target
            }
        }
        
        if (hitTarget) {
            // Evaluate target match
            const isMatch = (hitTarget.shape === this.currentTargetRule.shape && 
                             hitTarget.color.name === this.currentTargetRule.color.name);
            
            hitTarget.collected = true;
            this.createExplosion(hitTarget.x, hitTarget.y, hitTarget.z, hitTarget.color.code);
            
            if (isMatch) {
                // Correct target hit! (Go success)
                this.targetHitsCount++;
                this.combo++;
                this.score += 500 * this.combo;
                this.energy = Math.min(100, this.energy + 6);
                sound.playChime();
                this.triggerFlash('success');
            } else {
                // Mistake hit! (No-Go commission error)
                this.targetErrorsCount++;
                this.combo = 0;
                this.energy = Math.max(0, this.energy - 15);
                sound.playBuzzer();
                this.triggerFlash('damage');
                this.cameraShake = 15;
            }
        } else {
            // Screen tapped with no targets in sight - penalty to prevent spamming
            this.combo = 0;
            sound.playBuzzer();
            this.score = Math.max(0, this.score - 100);
            this.triggerFlash('damage');
        }
    }

    triggerFlash(type) {
        this.screenFlashType = type;
        this.screenFlashTimer = 10; // frames to flash
        
        const container = document.getElementById('game-container');
        if (type === 'damage') {
            container.classList.add('damage-flash');
            setTimeout(() => container.classList.remove('damage-flash'), 200);
        } else if (type === 'success') {
            container.classList.add('success-flash');
            setTimeout(() => container.classList.remove('success-flash'), 200);
        } else if (type === 'gate') {
            container.classList.add('gate-flash');
            setTimeout(() => container.classList.remove('gate-flash'), 200);
        }
    }

    createExplosion(x, y, z, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                z: z,
                vx: (Math.random() - 0.5) * 500,
                vy: (Math.random() - 0.5) * 500,
                vz: (Math.random() - 0.5) * 500,
                life: 1.0,
                decay: 0.03 + Math.random() * 0.03,
                color: color
            });
        }
    }

    // Dynamic Difficulty Adjustment logic called every frame or interval
    applyDDA() {
        // Adjust Max Speed and obstacle parameters based on Level
        this.maxSpeed = 100 + (this.currentLevel * 20); // Levels 1-5 maps 120km/h - 200km/h
        
        // Check performance score every 6 seconds
        if (!this.lastDDAAdjust) this.lastDDAAdjust = Date.now();
        if (Date.now() - this.lastDDAAdjust > 6000) {
            this.lastDDAAdjust = Date.now();
            
            // Calculate accuracy
            // Target Accuracy = Hit Target ratio - errors
            
            // Average centering accuracy
            let steeringPerformance = Math.max(0, 1 - (Math.abs(this.playerX) / 1.5));
            this.steeringAccuracy = (this.steeringAccuracy * 0.7) + (steeringPerformance * 0.3); // rolling average
            
            let hitPerformance = 0.5;
            let correctPossible = this.targetHitsCount + this.targetOmissionMissesCount;
            if (correctPossible > 0) {
                let hitRatio = this.targetHitsCount / correctPossible;
                let errorDeduction = (this.targetErrorsCount * 0.05);
                hitPerformance = Math.max(0, hitRatio - errorDeduction);
            } else {
                hitPerformance = 1.0;
            }
            
            // Overall score is weighted: 40% Steering, 60% Target Task
            let overallScore = (this.steeringAccuracy * 0.4) + (hitPerformance * 0.6);
            
            if (overallScore > 0.8 && this.currentLevel < 5) {
                this.currentLevel++;
                this.triggerFlash('success');
            } else if (overallScore < 0.45 && this.currentLevel > 1) {
                this.currentLevel--;
                this.triggerFlash('damage');
            }
        }
    }

    // ==========================================
    // UPDATER AND physics
    // ==========================================
    update(dt) {
        if (!this.isRunning) return;
        
        // 1. Process target rule rotation
        if (this.dynamicSwitchingEnabled && Date.now() - this.targetInstructionTimer > this.targetInstructionDuration) {
            this.changeTargetInstruction();
        }

        // 2. Adjust steering position from input
        let currentSteerRate = 0.035;
        
        // Keyboard controls
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.steerInput = -1.0;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.steerInput = 1.0;
        } else if (!this.isSteerTouching && !this.gyroEnabled) {
            this.steerInput = 0;
        }

        // Gyro controls (tilt device left/right)
        if (this.gyroEnabled) {
            // Compare gamma against calibration value
            let diff = this.gyroCurrentGamma - this.gyroCalibratedGamma;
            // Map tilt angle of -20 to +20 degrees to steer range -1.0 to 1.0
            const maxTilt = 18;
            let targetInput = diff / maxTilt;
            targetInput = Math.max(-1.0, Math.min(1.0, targetInput));
            
            // Smooth input filtering (LERP)
            this.steerInput = this.steerInput * 0.7 + targetInput * 0.3;
        }

        // Apply steering to player position
        // Ship banking rotation visual effect
        this.shipRotation = this.shipRotation * 0.8 + (this.steerInput * 0.25) * 0.2;
        this.playerX += this.steerInput * currentSteerRate * (this.speed / this.maxSpeed + 0.3);
        
        // Clamp player X to road boundaries (with some off-road leeway)
        this.playerX = Math.max(-1.8, Math.min(1.8, this.playerX));

        // 3. Off-road slowdown
        let isOnRoad = Math.abs(this.playerX) <= 1.0;
        let currentMaxSpeed = this.maxSpeed;
        if (!isOnRoad) {
            currentMaxSpeed = this.maxSpeed * 0.45; // Slow down to 45% speed when off-road
        }

        // 4. Update vehicle Speed
        if (this.speed < currentMaxSpeed) {
            this.speed += 2.0; // Accelerate
        } else {
            this.speed -= 1.5; // Decelerate to max
        }
        
        // Hard clamp speed
        this.speed = Math.max(0, Math.min(currentMaxSpeed, this.speed));

        // 5. Advance camera along Z axis based on Speed
        this.playerZ += this.speed * 8 * dt; // speed multiplier

        // Keep playerZ looping around if we reach the end of the track
        if (this.playerZ >= this.trackLength) {
            this.playerZ -= this.trackLength;
            // Reset object states for next lap
            this.obstacles.forEach(o => o.collided = false);
            this.gates.forEach(g => {
                g.collected = false;
                g.missed = false;
            });
            this.targets = []; // Clear active crossing targets
        }

        // 6. Update & Check Steering Gate Collections
        for (let gate of this.gates) {
            let zDiff = gate.z - this.playerZ;
            
            // Resolve the gate the instant it crosses the bottom of the screen (zDiff <= 550)
            if (zDiff <= 550 && !gate.collected && !gate.missed) {
                let gateRoadX = gate.x / (ROAD_WIDTH / 2);
                let xDiff = Math.abs(this.playerX - gateRoadX);
                
                if (xDiff < 0.60) {
                    // Collected!
                    gate.collected = true;
                    this.score += Math.round(250 * (1 + this.combo * 0.05));
                    this.combo = Math.min(100, this.combo + 1);
                    this.energy = Math.min(100, this.energy + 3.5);
                    this.steeringAccuracy = this.steeringAccuracy * 0.85 + 0.15; // Rolling sync average up
                    
                    // Create collection particles (purple burst)
                    this.createExplosion(gate.x, gate.y + 40, gate.z, '#d800ff');
                    sound.playChime();
                    this.triggerFlash('gate'); // Special purple flash feedback!
                } else {
                    // Missed!
                    gate.missed = true;
                    this.combo = 0; // Break combo
                    this.energy = Math.max(0, this.energy - 4.5); // Lose some energy
                    this.steeringAccuracy = this.steeringAccuracy * 0.85; // Rolling sync average down
                    this.triggerFlash('damage');
                }
            }
        }

        // Decelerate off-road
        if (!isOnRoad) {
            this.combo = 0; // Off-road breaks combo
        }

        // 7. Check Obstacle Collisions
        for (let obstacle of this.obstacles) {
            // Collision zone is when Z matches and X coordinates align
            let zDiff = obstacle.z - this.playerZ;
            if (zDiff > -50 && zDiff < 250 && !obstacle.collided) {
                // We are in collision depth range, check X position overlap
                let obstacleRoadX = obstacle.x / (ROAD_WIDTH / 2); // normalize obstacle X relative to half road width
                let xDiff = Math.abs(this.playerX - obstacleRoadX);
                
                if (xDiff < 0.35) {
                    // CRASH!
                    obstacle.collided = true;
                    this.speed = 10; // Drop speed immediately
                    this.energy = Math.max(0, this.energy - 20); // Lose energy
                    this.combo = 0;
                    this.cameraShake = 25; // Trigger heavy screen shake
                    this.obstacleCollisionsCount++;
                    sound.playCrash();
                    this.triggerFlash('damage');
                }
            }
        }

        // 8. Dynamic Target Spawner Timer
        this.targetSpawnTimer += dt;
        let spawnInterval = 4.0 - (this.currentLevel * 0.45); // Spawn every 3.5s down to 1.8s
        if (this.targetSpawnTimer > spawnInterval) {
            this.targetSpawnTimer = 0;
            this.spawnDynamicTarget();
        }

        const isTargetMatch = (target) => (target.shape === this.currentTargetRule.shape && 
                                           target.color.name === this.currentTargetRule.color.name);

        // Update target crossing position, parabolic arc height & check omission error misses
        for (let i = this.targets.length - 1; i >= 0; i--) {
            let target = this.targets[i];
            
            // Lock target Z depth to foreground distance in front of player
            target.z = this.playerZ + 800;
            target.x += target.vx * dt;
            target.activeTime += dt;
            
            // Parabolic leap: target rises high in the center of the screen
            let progress = Math.min(1.0, target.activeTime / target.totalActiveDuration);
            target.y = target.baseY + Math.sin(progress * Math.PI) * 750; // high arch peak height
            
            // Sway rotation visual effect
            target.rotation = Math.sin(target.activeTime * 4.5) * 0.15;

            // Check if target completed its crossing duration
            if (target.activeTime >= target.totalActiveDuration) {
                if (!target.missed && !target.collected) {
                    target.missed = true;
                    
                    // If it was a matching target (Go condition) and we missed it, that's an omission error!
                    if (isTargetMatch(target)) {
                        this.targetOmissionMissesCount++;
                        this.energy = Math.max(0, this.energy - 12);
                        this.combo = 0;
                        sound.playWarning(); // warning chirp
                        this.triggerFlash('damage');
                    }
                }
                
                // Cleanup finished target after a brief delay
                if (target.activeTime > target.totalActiveDuration + 0.4) {
                    this.targets.splice(i, 1);
                }
            }
        }

        // 9. Update particles life
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;
            p.life -= p.decay;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 10. Update camera shake decay
        if (this.cameraShake > 0) {
            this.cameraShake -= 0.8;
        }

        // 11. Apply Dynamic Difficulty updates
        this.applyDDA();

        // 12. Check Game Over (Energy depletes to 0)
        if (this.energy <= 0) {
            this.endGame();
        }
    }

    endGame() {
        this.isRunning = false;
        sound.stopBGM();
        
        // Show Game Over UI
        this.hud.classList.add('hidden');
        this.touchControls.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        
        // Set stats
        document.getElementById('final-score').textContent = Math.round(this.score).toLocaleString();
        
        // Sync accuracy formatting
        let syncAccuracyPercent = Math.round(this.steeringAccuracy * 100);
        document.getElementById('stat-sync').textContent = `${syncAccuracyPercent}%`;
        
        // Target hits vs target total matching spawned
        let correctMatchesCount = this.targetHitsCount + this.targetOmissionMissesCount;
        document.getElementById('stat-hits').textContent = `${this.targetHitsCount} / ${correctMatchesCount}`;
        
        document.getElementById('stat-errors').textContent = this.targetErrorsCount;
        document.getElementById('stat-collisions').textContent = this.obstacleCollisionsCount;
        document.getElementById('stat-level').textContent = `LEVEL ${this.currentLevel}`;
        
        // Save highscore
        const highscoreBadge = document.getElementById('new-high-score');
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('neon_high_score', this.highScore.toString());
            highscoreBadge.classList.remove('hidden');
        } else {
            highscoreBadge.classList.add('hidden');
        }
    }

    // ==========================================
    // RENDER FUNCTIONS (CANVAS PSEUDO-3D)
    // ==========================================
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Save context for camera shake
        ctx.save();
        if (this.cameraShake > 0) {
            let dx = (Math.random() - 0.5) * this.cameraShake;
            let dy = (Math.random() - 0.5) * this.cameraShake;
            ctx.translate(dx, dy);
        }

        // 1. Draw Starfield Sky background
        ctx.fillStyle = '#020208';
        ctx.fillRect(0, 0, width, height);
        
        this.drawBackgroundGrid(ctx, width, height);

        // Find starting road segment index based on camera depth
        let startSegIndex = Math.floor(this.playerZ / ROAD_SEGMENT_LENGTH);
        let playerSegment = this.roadSegments[startSegIndex % this.roadSegments.length];
        
        // Determine curving amount of active segment to tilt camera
        let percent = (this.playerZ % ROAD_SEGMENT_LENGTH) / ROAD_SEGMENT_LENGTH;
        let playerProjectedY = playerSegment.p1.y + percent * (playerSegment.p2.y - playerSegment.p1.y);
        
        let cameraX = this.playerX * ROAD_WIDTH / 2;
        let cameraY = playerProjectedY + CAMERA_HEIGHT;
        let cameraZ = this.playerZ;
        
        // Track visual curve offsets
        let dx = -(playerSegment.curve * percent);
        let x = 0;

        let maxDraw = Math.min(this.roadSegments.length, startSegIndex + DRAW_DISTANCE);
        
        // Pre-project all visible segments (front to back or back to front)
        let projectedSegments = [];
        
        for (let i = startSegIndex; i < maxDraw; i++) {
            let seg = this.roadSegments[i % this.roadSegments.length];
            
            // Loop adjustment in case we wrapped around
            let zOffset = (i >= this.roadSegments.length) ? this.trackLength : 0;
            
            let p1_3d = { x: seg.p1.x + x, y: seg.p1.y, z: seg.p1.z + zOffset };
            let p2_3d = { x: seg.p2.x + x + dx, y: seg.p2.y, z: seg.p2.z + zOffset };
            
            let p1_2d = project(p1_3d, cameraX - x, cameraY, cameraZ, width, height);
            let p2_2d = project(p2_3d, cameraX - x - dx, cameraY, cameraZ, width, height);
            
            // Apply road curvature scaling
            x += dx;
            dx += seg.curve;
            
            projectedSegments.push({
                segmentIndex: seg.index,
                p1: p1_2d,
                p2: p2_2d,
                color: seg.color,
                curve: seg.curve
            });
        }

        // 2. Render Road segments (draw back to front)
        for (let i = projectedSegments.length - 2; i >= 0; i--) {
            let s1 = projectedSegments[i];
            let s2 = projectedSegments[i + 1];
            
            if (!s1.p1 || !s2.p1) continue; // Behind camera clipping
            
            // Drawing the road surface with solid, high contrast colors
            let color = s1.color;
            let roadCenterColor = '#00f0ff';
            
            // Rumble strips (shoulders) colors
            let rumbleColor = (s1.segmentIndex % 3 === 0) ? '#ff007f' : '#ffffff';
            let sideWidth = s1.p1.w * 0.1;
            
            // Draw Main Road Surface (opaque fill)
            drawPolygon(ctx, s1.p1.x, s1.p1.y, s1.p1.w, s2.p1.x, s2.p1.y, s2.p1.w, color);
            
            // Draw glowing solid neon cyan border lines on edges of the road
            let edgeLineWidth1 = s1.p1.w * 0.035;
            let edgeLineWidth2 = s2.p1.w * 0.035;
            drawPolygon(ctx, s1.p1.x - s1.p1.w, s1.p1.y, edgeLineWidth1, s2.p1.x - s2.p1.w, s2.p1.y, edgeLineWidth2, '#00f0ff');
            drawPolygon(ctx, s1.p1.x + s1.p1.w, s1.p1.y, edgeLineWidth1, s2.p1.x + s2.p1.w, s2.p1.y, edgeLineWidth2, '#00f0ff');
            
            // Draw Left & Right Rumble Strips
            drawPolygon(ctx, s1.p1.x - s1.p1.w - sideWidth/2 - edgeLineWidth1, s1.p1.y, sideWidth, s2.p1.x - s2.p1.w - sideWidth/2 - edgeLineWidth2, s2.p1.y, sideWidth, rumbleColor);
            drawPolygon(ctx, s1.p1.x + s1.p1.w + sideWidth/2 + edgeLineWidth1, s1.p1.y, sideWidth, s2.p1.x + s2.p1.w + sideWidth/2 + edgeLineWidth2, s2.p1.y, sideWidth, rumbleColor);
            
            // Draw Road Center Lane Indicator Strip (Glowing Cyan)
            let centerWidth1 = s1.p1.w * 0.02;
            let centerWidth2 = s2.p1.w * 0.02;
            if (s1.segmentIndex % 4 < 2) {
                drawPolygon(ctx, s1.p1.x, s1.p1.y, centerWidth1, s2.p1.x, s2.p1.y, centerWidth2, roadCenterColor);
            }
        }

        // 3. Draw Objects (Obstacles and Targets) standing/floating on the road
        // Back to front rendering
        let visibleObjects = [];
        
        // Find visible obstacles
        for (let o of this.obstacles) {
            if (o.segmentIndex >= startSegIndex && o.segmentIndex < maxDraw) {
                visibleObjects.push({ type: 'obstacle', data: o });
            }
        }
        
        // Find visible targets
        for (let t of this.targets) {
            if (!t.collected) {
                visibleObjects.push({ type: 'target', data: t });
            }
        }
        
        // Find visible gates
        for (let g of this.gates) {
            if (g.segmentIndex >= startSegIndex && g.segmentIndex < maxDraw && !g.collected && !g.missed) {
                visibleObjects.push({ type: 'gate', data: g });
            }
        }

        // Sort by Z index (descending - back to front)
        visibleObjects.sort((a, b) => b.data.z - a.data.z);

        // Render sorted objects
        for (let obj of visibleObjects) {
            if (obj.type === 'obstacle') {
                this.drawObstacle(ctx, obj.data, cameraX, cameraY, cameraZ, width, height);
            } else if (obj.type === 'target') {
                this.drawTarget(ctx, obj.data, cameraX, cameraY, cameraZ, width, height);
            } else if (obj.type === 'gate') {
                this.drawGate(ctx, obj.data, cameraX, cameraY, cameraZ, width, height);
            }
        }

        // 4. Render Particles
        for (let p of this.particles) {
            this.drawParticle(ctx, p, cameraX, cameraY, cameraZ, width, height);
        }

        // Restore camera state
        ctx.restore();

        // 5. Draw Player Hovercraft (A cool futuristic wireframe neon spaceship at the bottom)
        this.drawPlayerShip(ctx, width, height);

        // 6. Update UI HUD elements
        this.updateHUD();
    }

    drawBackgroundGrid(ctx, width, height) {
        // Futuristic grid background lines scrolling backwards
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
        ctx.lineWidth = 1;
        
        // Horizontal lines scrolling towards screen
        let scrollY = (this.playerZ * 0.15) % 60;
        for (let y = height / 2; y < height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y + scrollY);
            ctx.lineTo(width, y + scrollY);
            ctx.stroke();
        }
        
        // Perspective vertical lines converging at the horizon
        let horizonY = height / 2 - 20;
        let cols = 30;
        for (let i = 0; i <= cols; i++) {
            let xHorizon = width / 2;
            let xBase = (width / cols) * i;
            
            ctx.beginPath();
            ctx.moveTo(xHorizon, horizonY);
            ctx.lineTo(xBase, height);
            ctx.stroke();
        }

        // Draw neon space horizon line
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(width, horizonY);
        ctx.stroke();
        
        // Draw starry space sky
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 40; i++) {
            let starX = (Math.sin(i * 123.4) * 0.5 + 0.5) * width;
            let starY = (Math.cos(i * 567.8) * 0.5 + 0.5) * (height / 2);
            ctx.fillRect(starX, starY, 1.5, 1.5);
        }
    }

    drawPlayerShip(ctx, width, height) {
        // Player ship sits at the bottom center of the screen
        let shipX = width / 2;
        let shipY = height - 120;
        let shipWidth = 90;
        let shipHeight = 45;
        
        // Sway ship slightly left and right as it steers
        let tilt = this.shipRotation * 1.5;
        
        ctx.save();
        ctx.translate(shipX, shipY);
        ctx.rotate(tilt);
        
        // Shadow glow effect
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#00f0ff';
        
        // Sleek Opaque Neon Hovercraft ship polygon (solid fill to occlude road lines)
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#060618'; // Opaque dark filled body
        
        ctx.beginPath();
        ctx.moveTo(0, -shipHeight); // nose
        ctx.lineTo(shipWidth / 3, -shipHeight * 0.2); // inner joint
        ctx.lineTo(shipWidth / 2, shipHeight * 0.2); // wingtip right
        ctx.lineTo(shipWidth / 2.5, shipHeight * 0.8); // wing back
        ctx.lineTo(shipWidth / 6, shipHeight * 0.5); // thruster right
        ctx.lineTo(-shipWidth / 6, shipHeight * 0.5); // thruster left
        ctx.lineTo(-shipWidth / 2.5, shipHeight * 0.8); // wing back
        ctx.lineTo(-shipWidth / 2, shipHeight * 0.2); // wingtip left
        ctx.lineTo(-shipWidth / 3, -shipHeight * 0.2); // inner joint
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw engine jet flame (pulsating with speed)
        if (this.speed > 5) {
            let engineHeight = 15 + Math.random() * 20 * (this.speed / this.maxSpeed);
            ctx.shadowColor = '#ff007f';
            ctx.strokeStyle = '#ff007f';
            ctx.fillStyle = 'rgba(255, 0, 127, 0.4)';
            ctx.beginPath();
            ctx.moveTo(-12, shipHeight * 0.5);
            ctx.lineTo(0, shipHeight * 0.5 + engineHeight);
            ctx.lineTo(12, shipHeight * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Draw pilot cabin canopy (solid filled pink)
        ctx.shadowColor = '#ff007f';
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 0, 127, 0.35)';
        ctx.beginPath();
        ctx.moveTo(0, -shipHeight * 0.6);
        ctx.lineTo(8, -shipHeight * 0.1);
        ctx.lineTo(4, shipHeight * 0.2);
        ctx.lineTo(-4, shipHeight * 0.2);
        ctx.lineTo(-8, -shipHeight * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    drawObstacle(ctx, obs, cameraX, cameraY, cameraZ, width, height) {
        // Project 3D obstacle point to 2D
        let p_3d = { x: obs.x, y: obs.y, z: obs.z };
        let p_2d = project(p_3d, cameraX, cameraY, cameraZ, width, height);
        
        if (!p_2d) return;

        let scale = p_2d.w / ROAD_WIDTH;
        let obsSize = obs.scale * scale;
        if (obsSize <= 1) return;
        
        // Draw Obstacle (Glowing Spiky Solid warning cone)
        ctx.save();
        ctx.translate(p_2d.x, p_2d.y);
        
        ctx.shadowBlur = obs.collided ? 4 : 15;
        ctx.shadowColor = obs.collided ? '#444444' : '#ff3300';
        ctx.strokeStyle = obs.collided ? '#444444' : '#ffffff';
        ctx.lineWidth = 3;
        
        // Base triangle hazard cone path
        ctx.beginPath();
        ctx.moveTo(-obsSize / 2, 0);
        ctx.lineTo(0, -obsSize * 0.95);
        ctx.lineTo(obsSize / 2, 0);
        ctx.closePath();
        
        ctx.fillStyle = obs.collided ? '#222222' : '#e60000'; // solid red fill
        ctx.fill();

        // Draw yellow hazard warning stripes if not collided (using clipping)
        if (!obs.collided) {
            ctx.save();
            ctx.clip(); // clip pattern to cone boundary
            
            ctx.strokeStyle = '#ffe600'; // warning yellow stripes
            ctx.lineWidth = obsSize * 0.085;
            
            // Draw diagonal stripes across the cone
            for (let offset = -obsSize; offset < obsSize; offset += obsSize * 0.28) {
                ctx.beginPath();
                ctx.moveTo(offset, 0);
                ctx.lineTo(offset + obsSize * 0.25, -obsSize * 1.1);
                ctx.stroke();
            }
            ctx.restore();
        }
        
        ctx.stroke();

        // Draw alert exclamation sign (!) inside barrier if active
        if (!obs.collided) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-obsSize * 0.03, -obsSize * 0.5, obsSize * 0.06, obsSize * 0.22);
            ctx.beginPath();
            ctx.arc(0, -obsSize * 0.18, obsSize * 0.04, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawTarget(ctx, target, cameraX, cameraY, cameraZ, width, height) {
        let p_2d = project({ x: target.x, y: target.y, z: target.z }, cameraX, cameraY, cameraZ, width, height);
        
        if (!p_2d) return;

        let scale = p_2d.w / ROAD_WIDTH;
        let size = 180 * scale; // target base size
        if (size <= 1.5) return;

        ctx.save();
        ctx.translate(p_2d.x, p_2d.y);

        // --- DRAW GLOWING TARGET AIMING RING (RETICLE) ---
        // Only draw around matching target (Go target) that is not collected
        const isMatch = (target.shape === this.currentTargetRule.shape && 
                         target.color.name === this.currentTargetRule.color.name);
                         
        if (isMatch && !target.collected && !target.missed) {
            ctx.save();
            ctx.strokeStyle = '#39ff14'; // neon green
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(57, 255, 20, 0.9)';
            
            // Pulsating ring effect
            let pulse = 1.0 + Math.sin(Date.now() / 130) * 0.06;
            let ringRadius = size * 0.72 * pulse;
            
            // Outer dashed circle
            ctx.beginPath();
            ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            ctx.setLineDash([ringRadius * 0.25, ringRadius * 0.12]);
            ctx.stroke();
            
            // Reticle crosshair ticks
            ctx.setLineDash([]); // reset dash
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            // Top tick
            ctx.moveTo(0, -ringRadius - 5); ctx.lineTo(0, -ringRadius + 8);
            // Bottom tick
            ctx.moveTo(0, ringRadius + 5); ctx.lineTo(0, ringRadius - 8);
            // Left tick
            ctx.moveTo(-ringRadius - 5, 0); ctx.lineTo(-ringRadius + 8, 0);
            // Right tick
            ctx.moveTo(ringRadius + 5, 0); ctx.lineTo(ringRadius - 8, 0);
            ctx.stroke();
            ctx.restore();
        }

        // Apply visual tilt/sway rotation
        ctx.rotate(target.rotation);

        // Styling for creature drawing
        ctx.shadowBlur = 12;
        ctx.shadowColor = target.color.shadow;
        ctx.strokeStyle = '#ffffff'; // White bold border to stand out
        ctx.lineWidth = 2.5;
        ctx.fillStyle = target.color.code; // Solid color fill
        
        if (target.shape === 'octopus') {
            // Draw Octopus (Tako) Creature
            let headRadius = size * 0.38;
            
            // Draw head (solid filled)
            ctx.beginPath();
            ctx.arc(0, -size * 0.1, headRadius, Math.PI, 0, false); // top dome
            ctx.lineTo(headRadius, size * 0.15); // right side down
            ctx.quadraticCurveTo(0, size * 0.28, -headRadius, size * 0.15); // bottom curve
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Draw big eyes
            let eyeOffsetX = headRadius * 0.4;
            let eyeRadius = headRadius * 0.25;
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-eyeOffsetX, -size * 0.1, eyeRadius, 0, Math.PI * 2);
            ctx.arc(eyeOffsetX, -size * 0.1, eyeRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Pupils
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-eyeOffsetX, -size * 0.1, eyeRadius * 0.5, 0, Math.PI * 2);
            ctx.arc(eyeOffsetX, -size * 0.1, eyeRadius * 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw tentacles dangling and swaying
            ctx.fillStyle = target.color.code;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            
            // Draw 4 tentacles splayed out
            for (let k = 0; k < 4; k++) {
                let tentX = -headRadius * 0.65 + k * (headRadius * 0.45);
                let timeOffset = target.activeTime * 10 + k * 0.8;
                let sway = Math.sin(timeOffset) * (size * 0.12);
                
                ctx.beginPath();
                ctx.moveTo(tentX, size * 0.15);
                // Draw wavy Bezier curve for tentacle
                ctx.quadraticCurveTo(
                    tentX + sway, size * 0.35, 
                    tentX + sway * 0.5, size * 0.5
                );
                ctx.lineTo(tentX + sway * 0.5 - 4, size * 0.5); // end tip width
                ctx.quadraticCurveTo(
                    tentX + sway - 4, size * 0.35,
                    tentX - 4, size * 0.15
                );
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        } else if (target.shape === 'fish') {
            // Draw Fish Creature
            ctx.beginPath();
            // Fish body diamond/oval shape
            ctx.moveTo(-size * 0.5, 0); // nose
            ctx.quadraticCurveTo(-size * 0.1, -size * 0.35, size * 0.25, 0); // top back
            ctx.lineTo(size * 0.42, -size * 0.22); // tail top fin
            ctx.lineTo(size * 0.35, 0); // tail center indent
            ctx.lineTo(size * 0.42, size * 0.22); // tail bottom fin
            ctx.lineTo(size * 0.25, 0); // tail base bottom
            ctx.quadraticCurveTo(-size * 0.1, size * 0.35, -size * 0.5, 0); // belly
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Draw fish eye
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-size * 0.25, -size * 0.05, size * 0.07, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-size * 0.25, -size * 0.05, size * 0.035, 0, Math.PI * 2);
            ctx.fill();
        } else if (target.shape === 'star') {
            // Draw 5-pointed Star Creature
            ctx.beginPath();
            let rot = Math.PI / 2 * 3;
            let step = Math.PI / 5;
            let cx = 0, cy = 0;
            let outerRadius = size * 0.46;
            let innerRadius = size * 0.2;
            
            ctx.moveTo(cx, cy - outerRadius);
            for (let k = 0; k < 5; k++) {
                let x1 = cx + Math.cos(rot) * outerRadius;
                let y1 = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x1, y1);
                rot += step;
                
                let x2 = cx + Math.cos(rot) * innerRadius;
                let y2 = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x2, y2);
                rot += step;
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Draw small cute eyes in center of the star to give it creature life
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-size * 0.08, -size * 0.04, size * 0.05, 0, Math.PI * 2);
            ctx.arc(size * 0.08, -size * 0.04, size * 0.05, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-size * 0.08, -size * 0.04, size * 0.025, 0, Math.PI * 2);
            ctx.arc(size * 0.08, -size * 0.04, size * 0.025, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawGate(ctx, gate, cameraX, cameraY, cameraZ, width, height) {
        let p_2d = project({ x: gate.x, y: gate.y + 40, z: gate.z }, cameraX, cameraY, cameraZ, width, height);
        if (!p_2d) return;

        let scale = p_2d.w / ROAD_WIDTH;
        let size = gate.scale * scale;
        if (size <= 1.5) return;

        ctx.save();
        ctx.translate(p_2d.x, p_2d.y);

        // Sway/float animation vertically
        let floatOffset = Math.sin(Date.now() / 200 + gate.z * 0.01) * (size * 0.12);
        ctx.translate(0, floatOffset);

        // 1. Draw glowing base ring (oval)
        ctx.strokeStyle = '#da70d6'; // orchid/purple
        ctx.fillStyle = 'rgba(218, 112, 214, 0.12)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(218, 112, 214, 0.8)';
        ctx.beginPath();
        ctx.ellipse(0, size * 0.4, size * 0.45, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 2. Draw glowing pyramid / triangle
        ctx.fillStyle = '#ba55d3'; // medium orchid
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.5); // top vertex
        ctx.lineTo(-size * 0.35, size * 0.3); // bottom left
        ctx.lineTo(size * 0.35, size * 0.3); // bottom right
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw an inner light line/triangle for 3D neon look
        ctx.strokeStyle = '#d800ff'; // bright neon magenta/purple
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.3);
        ctx.lineTo(-size * 0.18, size * 0.2);
        ctx.lineTo(size * 0.18, size * 0.2);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }

    drawParticle(ctx, p, cameraX, cameraY, cameraZ, width, height) {
        let p_2d = project(p, cameraX, cameraY, cameraZ, width, height);
        if (!p_2d) return;

        let scale = p_2d.w / ROAD_WIDTH;
        let size = 150 * scale * p.life;
        if (size <= 0.5) return;

        ctx.fillStyle = p.color;
        ctx.fillRect(p_2d.x - size/2, p_2d.y - size/2, size, size);
    }

    // ==========================================
    // HUD & DATA METRICS SYNCRONIZER
    // ==========================================
    updateHUD() {
        // Formatted Score string
        let scoreStr = Math.round(this.score).toString().padStart(6, '0');
        this.hudScore.textContent = scoreStr;
        
        // Speed conversion
        let speedKMH = Math.round(this.speed * 1.5);
        this.hudSpeed.textContent = `${speedKMH} KM/H`;
        
        // Sync indicator (steering gates rolling average)
        let syncWidthPercent = Math.max(0, Math.min(100, Math.round(this.steeringAccuracy * 100)));
        this.hudSyncBar.style.width = `${syncWidthPercent}%`;
        
        // Combo text
        this.hudSyncCombo.textContent = `SYNC LEVEL ${this.currentLevel} | COMBO x${Math.floor(this.combo)}`;
        
        // Energy/HP bar
        this.hudEnergyBar.style.width = `${this.energy}%`;
        
        // Energy styling transitions (Green to red depending on danger)
        if (this.energy > 50) {
            this.hudEnergyBar.style.background = 'linear-gradient(90deg, #ff007f, #39ff14)';
        } else if (this.energy > 25) {
            this.hudEnergyBar.style.background = 'linear-gradient(90deg, #ffe600, #ff007f)';
        } else {
            this.hudEnergyBar.style.background = '#ff007f';
            // Pulsate the low energy warning glow
            if (Math.sin(Date.now() / 100) > 0) {
                this.hudEnergyBar.style.boxShadow = '0 0 15px #ff007f';
            } else {
                this.hudEnergyBar.style.boxShadow = '0 0 2px #ff007f';
            }
        }
    }

    // ==========================================
    // MAIN LOOP
    // ==========================================
    loop() {
        if (!this.isRunning) return;
        
        // Delta time computation
        let now = Date.now();
        if (!this.lastTime) this.lastTime = now;
        let dt = (now - this.lastTime) / 1000;
        
        // Bound dt to prevent huge skips during frames tab-out
        if (dt > 0.1) dt = 0.1;
        
        this.lastTime = now;
        
        this.update(dt);
        this.render();
        
        requestAnimationFrame(() => this.loop());
    }
}

// Instantiate game after script finishes loading
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
