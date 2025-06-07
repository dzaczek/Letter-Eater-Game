class Game {
    constructor() {
        // Initialize basic properties first
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.powerups = [];
        this.activeEffects = new Map();
        this.isInitialized = false;
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initialize all game states with default values
        this.initializeGameStates();
        
        // Create audio manager instance
        this.audioManager = new AudioManager();
        
        // Add gyroscope support properties
        this.gyroscopeEnabled = false;
        this.gyroscopeData = { x: 0, y: 0 };
        this.lastGyroscopeUpdate = 0;
        this.gyroscopeSensitivity = 0.5; // Adjust this value to control movement sensitivity
        
        // Start initialization process
        this.startInitialization();
    }

    initializeGameStates() {
        // Game world settings
        this.worldSize = gameConfig.world.size;
        this.camera = { x: 0, y: 0 };
        
        // Initialize all state objects with default values
        this.absorptionState = {
            active: false,
            startTime: 0,
            target: null,
            particles: [],
            pulseScale: 1.0,
            maxLife: gameConfig.absorption.particleLife
        };

        this.absorptionConfig = gameConfig.absorption;
        this.densityConfig = { value: gameConfig.player.density, maxSpeed: gameConfig.physics.maxSpeed };
        this.physicsConfig = gameConfig.physics;
        
        // Player configuration
        this.player = {
            x: this.worldSize / 2,
            y: this.worldSize / 2,
            radius: gameConfig.player.baseRadius,
            baseRadius: gameConfig.player.baseRadius,
            speed: gameConfig.physics.maxSpeed,
            color: gameConfig.player.color,
            mass: gameConfig.player.baseMass,
            density: gameConfig.player.density,
            velocity: { x: 0, y: 0 },
            targetVelocity: { x: 0, y: 0 }
        };
        
        // Game objects
        this.food = [];
        this.powerupItems = [];
        
        // Arrows configuration
        this.arrows = {
            green: { x: 0, y: 0, angle: 0, visible: false },
            red: { x: 0, y: 0, angle: 0, visible: false }
        };
        
        // Opponent configuration
        this.opponentConfig = {
            baseSpeed: gameConfig.physics.maxSpeed,
            minSpeed: gameConfig.physics.minSpeed,
            updateInterval: gameConfig.opponents.updateInterval,
            respawnInterval: gameConfig.opponents.respawnInterval,
            maxOpponents: gameConfig.opponents.maxCount,
            visionRange: gameConfig.opponents.visionRange,
            sizeRange: gameConfig.opponents.sizeRange,
            iqRange: gameConfig.opponents.iqRange,
            decisionDelay: gameConfig.opponents.decisionDelay,
            escapeThreshold: gameConfig.opponents.escapeThreshold,
            huntThreshold: gameConfig.opponents.huntThreshold,
            growthRate: gameConfig.opponents.growthRate,
            maxGrowth: gameConfig.opponents.maxGrowth,
            massTransfer: gameConfig.opponents.massTransfer,
            smoothFactor: gameConfig.physics.smoothFactor
        };

        // Growth configuration
        this.growthConfig = {
            baseGrowth: gameConfig.growth.baseGrowth,
            opponentGrowth: gameConfig.growth.opponentGrowth,
            maxGrowth: gameConfig.growth.maxGrowth,
            growthSpeed: gameConfig.growth.growthSpeed,
            currentSize: 1.0,
            targetSize: 1.0,
            massTransfer: gameConfig.growth.massTransfer
        };

        // Opponent movement properties
        this.opponents = [];
        this.lastOpponentUpdate = 0;
        this.lastOpponentSpawn = 0;
        
        // Particle system
        this.particles = [];
        this.particleConfig = gameConfig.particles;
        
        // Movement configuration
        this.movementConfig = {
            perimeterOffset: gameConfig.movement.perimeterOffset,
            maxSpeed: gameConfig.physics.maxSpeed,
            minSpeed: gameConfig.physics.minSpeed,
            acceleration: gameConfig.physics.maxAcceleration,
            deceleration: gameConfig.physics.maxDeceleration
        };

        // Mouse position tracking
        this.mousePosition = {
            x: 0,
            y: 0,
            isInPerimeter: true
        };

        // Movement state
        this.movementState = {
            speed: 0,
            targetSpeed: 0,
            direction: { x: 0, y: 0 }
        };

        // Make game instance globally accessible
        window.game = this;

        // Add logging function
        this.logPlayerStats = (event = 'Initial') => {
            const mass = this.player.mass;
            const actualMass = mass * this.densityConfig.value;
            const speed = this.player.speed;
            console.log(`\n=== Player Stats (${event}) ===`);
            console.log(`Radius: ${this.player.radius.toFixed(2)}`);
            console.log(`Mass: ${mass.toFixed(2)}`);
            console.log(`Density: ${this.densityConfig.value}`);
            console.log(`Actual Mass (mass * density): ${actualMass.toFixed(2)}`);
            console.log(`Speed: ${speed.toFixed(2)}`);
            console.log(`Speed Calculation: ${this.physicsConfig.maxSpeed} * exp(-${this.physicsConfig.massFactor} * ln(${actualMass.toFixed(2)})) = ${speed.toFixed(2)}`);
            console.log('========================\n');
        };

        // Log initial stats
        this.logPlayerStats();
    }

    async startInitialization() {
        try {
            // Wait for audio manager initialization
            await this.audioManager.initialize();
            
            // Now that audio manager is initialized, show language selection
            await this.showLanguageSelection();
        } catch (error) {
            console.error('Failed to initialize game:', error);
            alert('Failed to initialize game. Please refresh the page and try again.');
        }
    }

    async showLanguageSelection() {
        // Double check that audio manager is initialized
        if (!this.audioManager || !this.audioManager.isInitialized) {
            console.error('AudioManager not properly initialized');
            return;
        }

        const languages = window.languageConfig.getSupportedLanguages();
        if (!languages) {
            console.error('No supported languages available');
            return;
        }
        
        // Create language selection modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
        `;

        const title = document.createElement('h2');
        title.textContent = window.languageConfig.getText('selectLanguage');
        content.appendChild(title);

        const languageGrid = document.createElement('div');
        languageGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin: 1rem 0;
        `;

        // Define the order of languages
        const languageOrder = ['pl', 'en', 'de', 'fr', 'uk', 'es', 'it', 'ru', 'ja', 'zh', 'ko'];
        
        // Create buttons in specified order
        for (const langCode of languageOrder) {
            const lang = languages[langCode];
            if (!lang) continue; // Skip if language not found

            const button = document.createElement('button');
            button.textContent = lang.name;
            button.style.cssText = `
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 5px;
                background: #3498db;
                color: white;
                cursor: pointer;
                transition: background 0.3s;
            `;
            button.onmouseover = () => button.style.background = '#2980b9';
            button.onmouseout = () => button.style.background = '#3498db';
            
            button.onclick = async () => {
                try {
                    await this.audioManager.setLanguage(langCode);
                    modal.remove();
                    // Start game after language selection
                    await this.startGame();
                } catch (error) {
                    console.error('Failed to set language:', error);
                    alert('Failed to set language. Please try again.');
                }
            };
            
            languageGrid.appendChild(button);
        }

        content.appendChild(languageGrid);
        modal.appendChild(content);
        document.body.appendChild(modal);
    }

    async startGame() {
        if (!this.isInitialized) {
            // Initialize game objects
            this.init();
            this.setupEventListeners();
            
            // Mark as initialized
            this.isInitialized = true;
        }
        
        // Start the game loop
        this.gameLoop();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        // Generate initial food
        for (let i = 0; i < 100; i++) {
            this.spawnFood();
        }
        
        // Generate initial powerups
        for (let i = 0; i < 5; i++) {
            this.spawnPowerup();
        }

        // Initialize opponents
        this.generateOpponents();
        
        // Start opponent update interval
        setInterval(() => this.updateOpponentTargets(), this.opponentConfig.updateInterval);
        setInterval(() => this.spawnNewOpponent(), this.opponentConfig.respawnInterval);
    }

    setupEventListeners() {
        // Mouse movement for player control
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePosition.x = e.clientX - rect.left + this.camera.x;
            this.mousePosition.y = e.clientY - rect.top + this.camera.y;
        });

        // Handle mouse leaving the canvas
        this.canvas.addEventListener('mouseleave', () => {
            this.mousePosition.isInPerimeter = true;
            this.movementState.targetSpeed = 0;
        });

        // Handle mouse entering the canvas
        this.canvas.addEventListener('mouseenter', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePosition.x = e.clientX - rect.left + this.camera.x;
            this.mousePosition.y = e.clientY - rect.top + this.camera.y;
        });
    }

    spawnFood() {
        const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
        this.food.push({
            x: Math.random() * this.worldSize,
            y: Math.random() * this.worldSize,
            radius: gameConfig.food.radius,
            letter: letter,
            isHexagon: Math.random() > 0.5
        });
    }

    spawnPowerup() {
        const types = Object.keys(gameConfig.powerups.types);
        const type = types[Math.floor(Math.random() * types.length)];
        this.powerupItems.push({
            x: Math.random() * this.worldSize,
            y: Math.random() * this.worldSize,
            radius: gameConfig.powerups.radius,
            type: type,
            color: gameConfig.powerups.types[type].color
        });
    }

    getPowerupColor(type) {
        return gameConfig.powerups.types[type].color;
    }

    updateCamera() {
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;
    }

    generateOpponents() {
        // Clear existing opponents
        this.opponents = [];
        
        // Generate initial opponents
        for (let i = 0; i < this.opponentConfig.maxOpponents; i++) {
            this.createOpponent();
        }
    }

    createOpponent() {
        const size = Math.random() * 
            (this.opponentConfig.sizeRange.max - this.opponentConfig.sizeRange.min) + 
            this.opponentConfig.sizeRange.min;
        
        const iq = Math.random() * 
            (this.opponentConfig.iqRange.max - this.opponentConfig.iqRange.min) + 
            this.opponentConfig.iqRange.min;

        const mass = size * size;
        const speed = this.calculateSpeed(mass);

        return {
            x: Math.random() * this.worldSize,
            y: Math.random() * this.worldSize,
            radius: size,
            mass: mass,
            letter: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            speed: speed,
            velocity: { x: 0, y: 0 },  // Add velocity for smooth movement
            targetVelocity: { x: 0, y: 0 },  // Target velocity for smooth acceleration
            lastUpdate: 0,
            target: null,
            iq: iq,
            decisionDelay: this.opponentConfig.decisionDelay.max - 
                (iq * (this.opponentConfig.decisionDelay.max - this.opponentConfig.decisionDelay.min)),
            size: 1.0,
            targetSize: 1.0,
            lastDecision: 0,
            state: 'wander',
            density: this.densityConfig.value
        };
    }

    calculateSpeed(mass) {
        // Ensure mass is a finite number
        if (!isFinite(mass) || mass <= 0) {
            console.warn('Invalid mass detected:', mass, 'using base mass instead');
            mass = this.physicsConfig.baseMass;
        }

        const actualMass = mass * this.densityConfig.value;
        // Modified speed calculation for gentler speed reduction
        const speed = Math.max(
            this.physicsConfig.minSpeed,
            this.physicsConfig.maxSpeed * Math.exp(-this.physicsConfig.massFactor * Math.log(actualMass + 1))
        );
        
        console.log(`\nSpeed Calculation Details:`);
        console.log(`Input Mass: ${mass.toFixed(2)}`);
        console.log(`Density: ${this.densityConfig.value}`);
        console.log(`Actual Mass: ${actualMass.toFixed(2)}`);
        console.log(`Speed Formula: ${this.physicsConfig.maxSpeed} * exp(-${this.physicsConfig.massFactor} * ln(${actualMass.toFixed(2)} + 1))`);
        console.log(`Resulting Speed: ${speed.toFixed(2)}\n`);
        
        return speed;
    }

    updateOpponentTargets() {
        const now = Date.now();
        this.opponents.forEach(opp => {
            // Only update target if enough time has passed
            if (now - opp.lastDecision < opp.decisionDelay) {
                return;
            }

            // Find nearest target within vision range
            let nearestTarget = null;
            let nearestDistance = Infinity;
            let targetType = null;

            // Check food
            this.food.forEach(food => {
                const dx = food.x - opp.x;
                const dy = food.y - opp.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.opponentConfig.visionRange && distance < nearestDistance) {
                    nearestTarget = food;
                    nearestDistance = distance;
                    targetType = 'food';
                }
            });

            // Check other opponents (only if they're smaller)
            this.opponents.forEach(otherOpp => {
                if (otherOpp === opp) return;
                
                const dx = otherOpp.x - opp.x;
                const dy = otherOpp.y - opp.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.opponentConfig.visionRange && 
                    distance < nearestDistance && 
                    otherOpp.radius < opp.radius * 0.9) { // 10% smaller to be considered prey
                    nearestTarget = otherOpp;
                    nearestDistance = distance;
                    targetType = 'opponent';
                }
            });

            // Check player (only if player is smaller)
            const dx = this.player.x - opp.x;
            const dy = this.player.y - opp.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.opponentConfig.visionRange && 
                distance < nearestDistance && 
                this.player.radius < opp.radius * 0.9) {
                nearestTarget = this.player;
                nearestDistance = distance;
                targetType = 'player';
            }

            // Update opponent target
            if (nearestTarget) {
                opp.target = nearestTarget;
                opp.targetType = targetType;
                opp.lastDecision = now;
            } else {
                // If no target found, move randomly
                const angle = Math.random() * Math.PI * 2;
                opp.target = {
                    x: opp.x + Math.cos(angle) * 100,
                    y: opp.y + Math.sin(angle) * 100
                };
                opp.targetType = 'random';
                opp.lastDecision = now;
            }
        });
    }

    spawnNewOpponent() {
        if (this.opponents.length < this.opponentConfig.maxOpponents) {
            this.opponents.push(this.createOpponent());
        }
    }

    updateOpponentPositions() {
        this.opponents.forEach(opp => {
            if (!opp.target) return;

            // Calculate direction to target
            const dx = opp.target.x - opp.x;
            const dy = opp.target.y - opp.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                // Calculate target velocity
                const targetSpeed = opp.speed;
                opp.targetVelocity = {
                    x: (dx / distance) * targetSpeed,
                    y: (dy / distance) * targetSpeed
                };

                // Smoothly adjust current velocity towards target velocity
                opp.velocity.x += (opp.targetVelocity.x - opp.velocity.x) * this.opponentConfig.smoothFactor;
                opp.velocity.y += (opp.targetVelocity.y - opp.velocity.y) * this.opponentConfig.smoothFactor;

                // Apply velocity to position
                opp.x += opp.velocity.x;
                opp.y += opp.velocity.y;

                // Add some randomness to movement based on IQ
                const randomFactor = (1 - opp.iq) * 0.1;
                opp.x += (Math.random() - 0.5) * randomFactor * opp.speed;
                opp.y += (Math.random() - 0.5) * randomFactor * opp.speed;
            }

            // Keep opponents within world bounds
            opp.x = Math.max(0, Math.min(this.worldSize, opp.x));
            opp.y = Math.max(0, Math.min(this.worldSize, opp.y));
        });
    }

    checkOpponentCollisions() {
        // Create a copy of opponents array to avoid modification during iteration
        const opponentsCopy = [...this.opponents];
        
        for (let i = 0; i < opponentsCopy.length; i++) {
            const opp1 = opponentsCopy[i];
            if (!opp1) continue; // Skip if opponent was already eaten
            
            for (let j = i + 1; j < opponentsCopy.length; j++) {
                const opp2 = opponentsCopy[j];
                if (!opp2) continue; // Skip if opponent was already eaten

                // Calculate actual sizes including growth
                const size1 = opp1.radius * opp1.size;
                const size2 = opp2.radius * opp2.size;

                // Calculate distance between centers
                const dx = opp2.x - opp1.x;
                const dy = opp2.y - opp1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Check if opponents are colliding
                if (distance < (size1 + size2) / 2) {
                    // Determine which opponent is larger (with 10% threshold)
                    if (size1 > size2 * 1.1) { // Opponent 1 is significantly larger
                        this.handleOpponentEat(opp1, opp2);
                        opponentsCopy[j] = null; // Mark as eaten
                        break; // Opponent 1 can't eat more than one opponent at once
                    } else if (size2 > size1 * 1.1) { // Opponent 2 is significantly larger
                        this.handleOpponentEat(opp2, opp1);
                        opponentsCopy[i] = null; // Mark as eaten
                        break; // Exit inner loop as opponent 1 is eaten
                    }
                }
            }
        }

        // Filter out eaten opponents
        this.opponents = this.opponents.filter(opp => 
            !opponentsCopy.includes(null) || opponentsCopy.indexOf(opp) === -1 || opponentsCopy[opponentsCopy.indexOf(opp)] !== null
        );
    }

    handleOpponentEat(predator, prey) {
        // Limit growth to prevent excessive size increase
        const maxGrowthPerEat = 0.3; // Maximum 30% growth per eat
        
        // Calculate growth based on prey size relative to predator
        const relativeSize = (prey.radius * prey.size) / (predator.radius * predator.size);
        const growthAmount = Math.min(
            this.opponentConfig.growthRate * relativeSize,
            maxGrowthPerEat
        );
        
        // Update predator's target size with a cap
        predator.targetSize = Math.min(
            predator.targetSize * (1 + growthAmount),
            this.opponentConfig.maxGrowth
        );

        // Update predator's mass with a cap
        const massGain = prey.mass * this.opponentConfig.massTransfer;
        predator.mass = Math.min(
            predator.mass + massGain,
            predator.mass * (1 + maxGrowthPerEat)
        );
        
        // Update radius based on new mass
        predator.radius = Math.sqrt(predator.mass);

        // Create particles for visual feedback (with limited count)
        const particleCount = Math.min(
            Math.max(5, Math.floor(prey.radius * prey.size / 2)),
            20 // Maximum particles
        );
        this.createParticles(
            prey.x,
            prey.y,
            prey.radius * prey.size,
            particleCount,
            prey.color,
            predator.color
        );

        // Update predator's speed based on new mass
        predator.speed = this.calculateSpeed(predator.mass);

        // Update predator's state and last eaten position
        predator.state = 'growing';
        predator.lastEatenPosition = { x: prey.x, y: prey.y };
        predator.lastEatenTime = Date.now();

        // Respawn the eaten opponent with a small delay
        setTimeout(() => this.respawnOpponent(prey), 100);
    }

    createParticles(x, y, radius, count, color1, color2 = null) {
        const baseParticleSize = this.particleConfig.baseParticleSize;
        const baseParticleSpeed = this.particleConfig.baseParticleSpeed;
        const lifetime = this.particleConfig.particleLifetime;

        // Scale particle count with object size
        const particleCount = Math.min(
            count,
            Math.max(5, Math.floor(radius / 2))
        );

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = baseParticleSpeed * (0.5 + Math.random() * 0.5);
            const size = baseParticleSize * (0.5 + Math.random() * 0.5);
            
            // Alternate between colors if color2 is provided
            const particleColor = color2 && i % 2 === 0 ? color2 : color1;

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: size,
                color: particleColor,
                alpha: 1,
                lifetime: lifetime,
                maxLifetime: lifetime
            });
        }
    }

    respawnOpponent(opponent) {
        // Reset opponent properties
        opponent.x = Math.random() * this.worldSize;
        opponent.y = Math.random() * this.worldSize;
        opponent.radius = Math.random() * 
            (this.opponentConfig.sizeRange.max - this.opponentConfig.sizeRange.min) + 
            this.opponentConfig.sizeRange.min;
        opponent.mass = opponent.radius * opponent.radius;
        opponent.speed = this.calculateSpeed(opponent.mass);
        opponent.size = 1.0;
        opponent.targetSize = 1.0;
        opponent.letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        opponent.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
        opponent.state = 'wander';
        opponent.lastDecision = 0;
    }

    updateOpponentAI(opponent, deltaTime) {
        const now = Date.now();
        if (now - opponent.lastDecision < opponent.decisionDelay) {
            return;
        }
        opponent.lastDecision = now;

        // Find nearby objects within vision range
        const nearbyObjects = this.findNearbyObjects(opponent);
        const nearestDanger = this.findNearestDanger(opponent, nearbyObjects);
        const nearestPrey = this.findNearestPrey(opponent, nearbyObjects);
        const nearestFood = this.findNearestFood(opponent, nearbyObjects);

        // Update opponent state based on situation and IQ
        this.updateOpponentState(opponent, nearestDanger, nearestPrey, nearestFood);

        // Execute behavior based on state
        switch (opponent.state) {
            case 'escape':
                if (nearestDanger) {
                    // Escape with increased speed
                    const escapeSpeed = opponent.speed * 1.5;
                    this.moveAwayFrom(opponent, nearestDanger, escapeSpeed);
                    
                    // Look for safe spots while escaping
                    if (nearestFood && !this.isInDangerZone(opponent, nearestFood, nearestDanger)) {
                        this.moveTowards(opponent, nearestFood, opponent.speed * 0.8);
                    }
                } else {
                    // If no immediate danger, transition to wander
                    opponent.state = 'wander';
                }
                break;

            case 'hunt':
                if (nearestPrey) {
                    // Hunt with increased speed based on IQ
                    const huntSpeed = opponent.speed * (1 + opponent.iq * 0.2);
                    this.moveTowards(opponent, nearestPrey, huntSpeed);
                    
                    // If prey is too far, look for closer food
                    if (this.getDistance(opponent, nearestPrey) > this.opponentConfig.visionRange * 0.7 && nearestFood) {
                        this.moveTowards(opponent, nearestFood, opponent.speed);
                    }
                } else if (nearestFood) {
                    // If no prey, go for food
                    this.moveTowards(opponent, nearestFood, opponent.speed);
                } else {
                    opponent.state = 'wander';
                }
                break;

            case 'wander':
                if (nearestDanger) {
                    // Check if we can escape
                    if (opponent.radius * opponent.size < nearestDanger.radius * nearestDanger.size * 0.9) {
                        opponent.state = 'escape';
                    } else if (opponent.radius * opponent.size > nearestDanger.radius * nearestDanger.size * 1.1) {
                        // If we're bigger, consider hunting
                        opponent.state = 'hunt';
                    }
                } else if (nearestPrey) {
                    // If we see prey and we're bigger, start hunting
                    if (opponent.radius * opponent.size > nearestPrey.radius * nearestPrey.size * 1.1) {
                        opponent.state = 'hunt';
                    }
                } else {
                    // Normal wandering behavior
                    this.wanderBehavior(opponent);
                }
                break;

            case 'growing':
                // After eating, move away from the eating spot
                if (opponent.lastEatenPosition) {
                    this.moveAwayFrom(opponent, opponent.lastEatenPosition, opponent.speed * 0.7);
                    // Clear last eaten position after some time
                    if (now - opponent.lastEatenTime > 2000) {
                        opponent.lastEatenPosition = null;
                        opponent.state = 'wander';
                    }
                } else {
                    opponent.state = 'wander';
                }
                break;
        }

        // Update opponent size
        this.updateOpponentSize(opponent);
    }

    findNearestPrey(opponent, nearbyObjects) {
        const opponentSize = opponent.radius * opponent.size;
        return nearbyObjects
            .filter(obj => {
                const objSize = obj.radius * (obj.size || 1);
                return objSize < opponentSize * this.opponentConfig.huntThreshold;
            })
            .sort((a, b) => {
                const distA = this.getDistance(opponent, a);
                const distB = this.getDistance(opponent, b);
                return distA - distB;
            })[0];
    }

    findNearestDanger(opponent, nearbyObjects) {
        const opponentSize = opponent.radius * opponent.size;
        return nearbyObjects
            .filter(obj => {
                const objSize = obj.radius * (obj.size || 1);
                return objSize > opponentSize * this.opponentConfig.escapeThreshold;
            })
            .sort((a, b) => {
                const distA = this.getDistance(opponent, a);
                const distB = this.getDistance(opponent, b);
                return distA - distB;
            })[0];
    }

    findNearestFood(opponent, nearbyObjects) {
        return nearbyObjects
            .filter(obj => obj.radius < opponent.radius * 0.5) // Only consider food smaller than half our size
            .sort((a, b) => {
                const distA = this.getDistance(opponent, a);
                const distB = this.getDistance(opponent, b);
                return distA - distB;
            })[0];
    }

    isInDangerZone(opponent, target, danger) {
        if (!danger) return false;
        
        const targetToDanger = this.getDistance(target, danger);
        const opponentToDanger = this.getDistance(opponent, danger);
        
        // Consider it dangerous if the target is closer to danger than we are
        return targetToDanger < opponentToDanger;
    }

    updateOpponentState(opponent, nearestDanger, nearestPrey, nearestFood) {
        const opponentSize = opponent.radius * opponent.size;
        
        // Check for immediate danger
        if (nearestDanger) {
            const dangerSize = nearestDanger.radius * (nearestDanger.size || 1);
            if (dangerSize > opponentSize * this.opponentConfig.escapeThreshold) {
                opponent.state = 'escape';
                return;
            }
        }

        // Check for hunting opportunities
        if (nearestPrey) {
            const preySize = nearestPrey.radius * (nearestPrey.size || 1);
            if (opponentSize > preySize * this.opponentConfig.huntThreshold) {
                // Higher IQ opponents are more aggressive
                if (Math.random() < opponent.iq * 0.8) {
                    opponent.state = 'hunt';
                    return;
                }
            }
        }

        // If we just ate and are in growing state, stay there
        if (opponent.state === 'growing' && opponent.lastEatenPosition) {
            return;
        }

        // Default to wander if no other state is appropriate
        if (opponent.state !== 'wander') {
            opponent.state = 'wander';
        }
    }

    moveAwayFrom(opponent, target, speed) {
        const dx = opponent.x - target.x;
        const dy = opponent.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Move away from target
            opponent.x += (dx / distance) * speed;
            opponent.y += (dy / distance) * speed;
            
            // Add some randomness to escape movement
            opponent.x += (Math.random() - 0.5) * speed * 0.2;
            opponent.y += (Math.random() - 0.5) * speed * 0.2;
        }
        
        // Keep within world bounds
        opponent.x = Math.max(0, Math.min(this.worldSize, opponent.x));
        opponent.y = Math.max(0, Math.min(this.worldSize, opponent.y));
    }

    moveTowards(opponent, target, speed) {
        const dx = target.x - opponent.x;
        const dy = target.y - opponent.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Move towards target with some prediction
            const predictionFactor = opponent.iq * 0.2; // Smarter opponents predict movement better
            const targetSpeed = target.speed || 0;
            const predictedX = target.x + (target.vx || 0) * predictionFactor;
            const predictedY = target.y + (target.vy || 0) * predictionFactor;
            
            const predDx = predictedX - opponent.x;
            const predDy = predictedY - opponent.y;
            const predDistance = Math.sqrt(predDx * predDx + predDy * predDy);
            
            opponent.x += (predDx / predDistance) * speed;
            opponent.y += (predDy / predDistance) * speed;
        }
        
        // Keep within world bounds
        opponent.x = Math.max(0, Math.min(this.worldSize, opponent.x));
        opponent.y = Math.max(0, Math.min(this.worldSize, opponent.y));
    }

    wanderBehavior(opponent) {
        // If no current target or reached target, set new random target
        if (!opponent.wanderTarget || this.getDistance(opponent, opponent.wanderTarget) < 50) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 200;
            opponent.wanderTarget = {
                x: opponent.x + Math.cos(angle) * distance,
                y: opponent.y + Math.sin(angle) * distance
            };
        }
        
        // Move towards wander target
        this.moveTowards(opponent, opponent.wanderTarget, opponent.speed * 0.7);
    }

    getDistance(obj1, obj2) {
        const dx = obj2.x - obj1.x;
        const dy = obj2.y - obj1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    updateArrows() {
        let nearestSmaller = null;
        let nearestLarger = null;
        let minSmallerDist = Infinity;
        let minLargerDist = Infinity;

        // Check food and opponents for nearest smaller and larger objects
        [...this.food, ...this.opponents].forEach(obj => {
            const dx = obj.x - this.player.x;
            const dy = obj.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            if (obj.radius < this.player.radius) {
                if (distance < minSmallerDist) {
                    minSmallerDist = distance;
                    nearestSmaller = { distance, angle };
                }
            } else if (obj.radius > this.player.radius) {
                if (distance < minLargerDist) {
                    minLargerDist = distance;
                    nearestLarger = { distance, angle };
                }
            }
        });

        // Update green arrow (smaller opponent)
        if (nearestSmaller && nearestSmaller.distance < 1000) {
            this.arrows.green.visible = true;
            this.arrows.green.angle = nearestSmaller.angle;
        } else {
            this.arrows.green.visible = false;
        }

        // Update red arrow (larger opponent)
        if (nearestLarger && nearestLarger.distance < 1000) {
            this.arrows.red.visible = true;
            this.arrows.red.angle = nearestLarger.angle;
        } else {
            this.arrows.red.visible = false;
        }
    }

    drawArrows() {
        const arrowLength = gameConfig.ui.arrows.length;
        const arrowWidth = gameConfig.ui.arrows.width;
        const distanceFromCenter = this.player.radius + gameConfig.ui.arrows.distanceFromCenter;

        // Draw green arrow (smaller opponent)
        if (this.arrows.green.visible) {
            this.ctx.save();
            this.ctx.translate(this.player.x - this.camera.x, this.player.y - this.camera.y);
            this.ctx.rotate(this.arrows.green.angle);
            this.ctx.beginPath();
            this.ctx.moveTo(distanceFromCenter, 0);
            this.ctx.lineTo(distanceFromCenter + arrowLength, -arrowWidth);
            this.ctx.lineTo(distanceFromCenter + arrowLength, arrowWidth);
            this.ctx.closePath();
            this.ctx.fillStyle = gameConfig.ui.arrows.colors.smaller;
            this.ctx.fill();
            this.ctx.restore();
        }

        // Draw red arrow (larger opponent)
        if (this.arrows.red.visible) {
            this.ctx.save();
            this.ctx.translate(this.player.x - this.camera.x, this.player.y - this.camera.y);
            this.ctx.rotate(this.arrows.red.angle);
            this.ctx.beginPath();
            this.ctx.moveTo(distanceFromCenter, 0);
            this.ctx.lineTo(distanceFromCenter + arrowLength, -arrowWidth);
            this.ctx.lineTo(distanceFromCenter + arrowLength, arrowWidth);
            this.ctx.closePath();
            this.ctx.fillStyle = gameConfig.ui.arrows.colors.larger;
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    updateParticles() {
        const now = Date.now();
        this.particles = this.particles.filter(particle => {
            // Update particle life
            particle.life -= 16; // Assuming 60fps
            if (particle.life <= 0) return false;

            // Calculate progress (0 to 1)
            const progress = 1 - (particle.life / particle.maxLife);
            
            if (particle.isBeingEaten) {
                // Particles being eaten move towards the center
                const dx = particle.targetX - particle.x;
                const dy = particle.targetY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    particle.x += (dx / distance) * particle.speed * (1 + progress);
                    particle.y += (dy / distance) * particle.speed * (1 + progress);
                }
            } else {
                // Particles from eaten object move outward
                const dx = particle.targetX - particle.x;
                const dy = particle.targetY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    particle.x += (dx / distance) * particle.speed * (1 - progress * 0.5);
                    particle.y += (dy / distance) * particle.speed * (1 - progress * 0.5);
                }
            }

            // Update particle size and opacity
            particle.size *= 0.98;
            return true;
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            const progress = 1 - (particle.life / particle.maxLife);
            this.ctx.save();
            this.ctx.translate(particle.x - this.camera.x, particle.y - this.camera.y);
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color + Math.floor((1 - progress) * 255).toString(16).padStart(2, '0');
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }

    createAbsorptionParticles(x, y, radius, color, targetX, targetY) {
        const particles = [];
        const count = this.absorptionConfig.particleCount;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const distance = radius * (0.5 + Math.random() * 0.5);
            const startX = x + Math.cos(angle) * distance;
            const startY = y + Math.sin(angle) * distance;
            
            particles.push({
                x: startX,
                y: startY,
                targetX: targetX,
                targetY: targetY,
                size: this.absorptionConfig.particleSize * (0.5 + Math.random() * 0.5),
                color: color,
                speed: this.absorptionConfig.particleSpeed * (0.8 + Math.random() * 0.4),
                life: this.absorptionConfig.particleLife,
                maxLife: this.absorptionConfig.particleLife,
                angle: Math.atan2(targetY - startY, targetX - startX)
            });
        }
        
        return particles;
    }

    updateAbsorptionAnimation() {
        if (!this.absorptionState.active) return;

        const now = Date.now();
        const elapsed = now - this.absorptionState.startTime;
        
        if (elapsed > this.absorptionConfig.absorptionDuration) {
            this.absorptionState.active = false;
            this.absorptionState.particles = [];
            this.absorptionState.pulseScale = 1.0;
            return;
        }

        // Update pulse animation
        const pulseProgress = Math.sin(elapsed * this.absorptionConfig.pulseSpeed * Math.PI * 2);
        this.absorptionState.pulseScale = 1.0 + pulseProgress * (this.absorptionConfig.pulseScale - 1.0);

        // Update particles
        this.absorptionState.particles = this.absorptionState.particles.filter(particle => {
            particle.life -= 16; // Assuming 60fps
            if (particle.life <= 0) return false;

            // Move particle towards target
            const dx = particle.targetX - particle.x;
            const dy = particle.targetY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const speed = particle.speed * (1 + (this.absorptionConfig.particleLife - particle.life) / this.absorptionConfig.particleLife);
                particle.x += (dx / distance) * speed;
                particle.y += (dy / distance) * speed;
            }

            // Shrink particle
            particle.size *= 0.98;
            return true;
        });

        // If we have a target object, shrink it
        if (this.absorptionState.target) {
            this.absorptionState.target.radius *= this.absorptionConfig.shrinkSpeed;
            if (this.absorptionState.target.radius < 1) {
                this.absorptionState.target = null;
            }
        }
    }

    drawAbsorptionAnimation() {
        if (!this.absorptionState.active) return;

        // Draw particles
        this.absorptionState.particles.forEach(particle => {
            const progress = 1 - (particle.life / particle.maxLife);
            this.ctx.save();
            this.ctx.translate(particle.x - this.camera.x, particle.y - this.camera.y);
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color + Math.floor((1 - progress) * 255).toString(16).padStart(2, '0');
            this.ctx.fill();
            
            this.ctx.restore();
        });

        // Draw target object if it exists
        if (this.absorptionState.target) {
            this.ctx.save();
            this.ctx.translate(this.absorptionState.target.x - this.camera.x, this.absorptionState.target.y - this.camera.y);
            this.drawObject(
                this.ctx,
                0,
                0,
                this.absorptionState.target.radius,
                this.absorptionState.target.letter,
                this.absorptionState.target.color,
                true
            );
            this.ctx.restore();
        }

        // Draw player pulse effect
        if (this.absorptionState.pulseScale !== 1.0) {
            this.ctx.save();
            this.ctx.translate(this.player.x - this.camera.x, this.player.y - this.camera.y);
            this.ctx.scale(this.absorptionState.pulseScale, this.absorptionState.pulseScale);
            this.drawObject(
                this.ctx,
                0,
                0,
                this.player.radius,
                '',
                this.player.color
            );
            this.ctx.restore();
        }
    }

    startAbsorptionAnimation(target) {
        this.absorptionState.active = true;
        this.absorptionState.startTime = Date.now();
        this.absorptionState.target = { ...target }; // Create a copy of the target
        this.absorptionState.particles = this.createAbsorptionParticles(
            target.x,
            target.y,
            target.radius,
            target.color,
            this.player.x,
            this.player.y
        );
        this.absorptionState.pulseScale = 1.0;
    }

    checkCollisions() {
        // Check food collisions
        this.food = this.food.filter(f => {
            const dx = f.x - this.player.x;
            const dy = f.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.player.radius + f.radius) {
                console.log('\n=== Eating Food ===');
                console.log(`Food Radius: ${f.radius.toFixed(2)}`);
                console.log(`Current Player Radius: ${this.player.radius.toFixed(2)}`);
                
                // Player ate food
                this.score += gameConfig.score.foodPoints;
                document.getElementById('score').textContent = `Score: ${this.score}`;
                this.showEatText(f.letter);
                
                // Create particles for eaten food
                this.createParticles(f.x, f.y, f.radius, f.isHexagon ? gameConfig.food.colors.hexagon : gameConfig.food.colors.normal);
                
                // Grow player with a more reasonable growth rate
                const growthAmount = Math.min(0.5, f.radius * 0.1);
                console.log(`Growth Amount: ${growthAmount.toFixed(2)}`);
                
                const oldRadius = this.player.radius;
                const oldMass = this.player.mass;
                const oldSpeed = this.player.speed;
                
                // Update radius
                this.player.radius += growthAmount;
                
                // Calculate new mass based on relative size increase
                const sizeRatio = this.player.radius / oldRadius;
                const massIncrease = (sizeRatio - 1) * this.physicsConfig.massFactor;
                
                // Update mass with a cap on increase
                const maxMassIncrease = 1.2; // Maximum 20% mass increase per food
                this.player.mass = oldMass * (1 + Math.min(massIncrease, maxMassIncrease - 1));
                
                // Update speed based on new mass
                this.player.speed = this.calculateSpeed(this.player.mass);
                
                console.log('\n=== Growth Results ===');
                console.log(`Radius: ${oldRadius.toFixed(2)} -> ${this.player.radius.toFixed(2)}`);
                console.log(`Size Ratio: ${sizeRatio.toFixed(2)}`);
                console.log(`Mass: ${oldMass.toFixed(2)} -> ${this.player.mass.toFixed(2)}`);
                console.log(`Speed: ${oldSpeed.toFixed(2)} -> ${this.player.speed.toFixed(2)}`);
                
                this.logPlayerStats('After Eating Food');
                
                this.spawnFood();
                return false;
            }
            return true;
        });

        // Check opponent collisions
        this.opponents = this.opponents.filter(opp => {
            const dx = opp.x - this.player.x;
            const dy = opp.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.player.radius + opp.radius) {
                if (this.player.radius > opp.radius * 1.1) {
                    // Start absorption animation before processing the eat
                    this.startAbsorptionAnimation(opp);
                    
                    // Rest of the eating logic...
                    console.log('\n=== Eating Opponent ===');
                    console.log(`Opponent Radius: ${opp.radius.toFixed(2)}`);
                    console.log(`Current Player Radius: ${this.player.radius.toFixed(2)}`);
                    
                    // Player eats opponent
                    this.score += Math.floor(opp.mass * gameConfig.score.opponentPointsMultiplier);
                    document.getElementById('score').textContent = `Score: ${this.score}`;
                    this.showEatText(opp.letter);
                    
                    // Create particles for eaten opponent
                    this.createParticles(opp.x, opp.y, opp.radius, opp.color);
                    
                    // Calculate growth based on opponent size relative to player
                    const relativeSize = opp.radius / this.player.radius;
                    const maxGrowth = gameConfig.opponents.maxGrowth;
                    const growthAmount = Math.min(
                        this.player.radius * maxGrowth,
                        opp.radius * 0.5
                    );
                    
                    console.log(`Relative Size: ${relativeSize.toFixed(2)}`);
                    console.log(`Growth Amount: ${growthAmount.toFixed(2)}`);
                    
                    const oldRadius = this.player.radius;
                    const oldMass = this.player.mass;
                    const oldSpeed = this.player.speed;
                    
                    // Update radius with a cap
                    const newRadius = Math.min(
                        oldRadius + growthAmount,
                        oldRadius * (1 + maxGrowth)
                    );
                    
                    // Calculate new mass based on area (πr²) with a cap
                    const maxMassIncrease = 1.3; // Maximum 30% mass increase
                    const newMass = Math.min(
                        oldMass * maxMassIncrease,
                        Math.PI * newRadius * newRadius
                    );
                    
                    // Update player properties
                    this.player.radius = newRadius;
                    this.player.mass = newMass;
                    this.player.speed = this.calculateSpeed(newMass);
                    
                    console.log('\n=== Growth Results ===');
                    console.log(`Radius: ${oldRadius.toFixed(2)} -> ${this.player.radius.toFixed(2)}`);
                    console.log(`Mass: ${oldMass.toFixed(2)} -> ${this.player.mass.toFixed(2)}`);
                    console.log(`Speed: ${oldSpeed.toFixed(2)} -> ${this.player.speed.toFixed(2)}`);
                    
                    this.logPlayerStats('After Eating Opponent');
                    
                    this.generateOpponents();
                    return false;
                } else if (opp.radius > this.player.radius * 1.1) {
                    // Opponent eats player
                    this.createParticles(this.player.x, this.player.y, this.player.radius, this.player.color, true);
                    this.gameOver();
                    return true;
                }
            }
            return true;
        });

        // Check powerup collisions
        this.powerupItems = this.powerupItems.filter(p => {
            const dx = p.x - this.player.x;
            const dy = p.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.player.radius + p.radius) {
                this.activatePowerup(p.type);
                this.spawnPowerup();
                return false;
            }
            return true;
        });
    }

    activatePowerup(type) {
        const duration = gameConfig.powerups.duration;
        const endTime = Date.now() + duration;
        
        switch(type) {
            case 'speed':
                this.player.speed *= gameConfig.powerups.types.speed.multiplier;
                setTimeout(() => this.player.speed /= gameConfig.powerups.types.speed.multiplier, duration);
                break;
            case 'bulletproof':
                this.activeEffects.set('bulletproof', endTime);
                break;
            case 'growth':
                this.player.radius *= gameConfig.powerups.types.growth.multiplier;
                setTimeout(() => this.player.radius /= gameConfig.powerups.types.growth.multiplier, duration);
                break;
        }
        
        this.updatePowerupDisplay();
    }

    updatePowerupDisplay() {
        const active = Array.from(this.activeEffects.entries())
            .filter(([_, endTime]) => endTime > Date.now())
            .map(([type]) => {
                switch(type) {
                    case 'speed': return window.languageConfig.getText('powerups.speed');
                    case 'bulletproof': return window.languageConfig.getText('powerups.bulletproof');
                    case 'growth': return window.languageConfig.getText('powerups.growth');
                    default: return type;
                }
            });
        
        document.getElementById('powerups').textContent = 
            window.languageConfig.getText('powerups', { powerups: active.length ? active.join(', ') : 'None' });
    }

    showEatText(letter) {
        if (!this.isInitialized) return;

        // Create a new eat text object with animation properties from config
        const animConfig = gameConfig.ui.eatText.animation;
        this.eatText = {
            text: letter, // Display only the letter
            x: this.player.x,
            y: this.player.y - this.player.radius - gameConfig.ui.eatText.offset,
            alpha: 1,
            scale: 1,
            velocity: { ...animConfig.velocity },
            rotation: (Math.random() - 0.5) * animConfig.rotationRange,
            rotationSpeed: (Math.random() - 0.5) * animConfig.rotationSpeedRange,
            life: gameConfig.ui.eatText.duration * 3, // Triple the duration (300 frames)
            maxLife: gameConfig.ui.eatText.duration * 3, // Triple the duration (300 frames)
            font: 'bold 48px Arial', // Larger font for single letter
            color: 'rgba(255, 215, 0, 1)' // Gold color
        };
        
        // Play letter sound using audio manager
        this.audioManager.playLetter(letter);
    }

    drawObject(ctx, x, y, radius, letter, color, isOpponent = false) {
        // Draw border based on size comparison with player
        const borderWidth = 3;
        const isLarger = radius > this.player.radius;
        const isSmaller = radius < this.player.radius;
        
        // Draw main circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Draw border if needed
        if (isOpponent) {
            ctx.beginPath();
            ctx.arc(x, y, radius + borderWidth/2, 0, Math.PI * 2);
            ctx.strokeStyle = isLarger ? gameConfig.ui.arrows.colors.larger :
                             isSmaller ? gameConfig.ui.arrows.colors.smaller :
                             'transparent';
            ctx.lineWidth = borderWidth;
            ctx.stroke();
        }
        
        // Draw letter
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.max(20, radius / 2)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, x, y);
    }

    drawWorldBorder() {
        // Draw black background for the entire screen (out of bounds)
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate the visible world boundaries
        const worldLeft = -this.camera.x;
        const worldRight = -this.camera.x + this.worldSize;
        const worldTop = -this.camera.y;
        const worldBottom = -this.camera.y + this.worldSize;

        // Draw the game world area with white background
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(worldLeft, worldTop, this.worldSize, this.worldSize);

        // Draw the world border
        this.ctx.strokeStyle = gameConfig.ui.worldBorder.outerColor;
        this.ctx.lineWidth = gameConfig.ui.worldBorder.outerWidth;
        this.ctx.strokeRect(worldLeft, worldTop, this.worldSize, this.worldSize);

        // Draw a second, inner border for better visibility
        this.ctx.strokeStyle = gameConfig.ui.worldBorder.innerColor;
        this.ctx.lineWidth = gameConfig.ui.worldBorder.innerWidth;
        this.ctx.strokeRect(worldLeft + 5, worldTop + 5, this.worldSize - 10, this.worldSize - 10);

        // Draw "out of bounds" text in the black areas
        this.ctx.fillStyle = gameConfig.ui.worldBorder.outOfBoundsText.color;
        this.ctx.font = gameConfig.ui.worldBorder.outOfBoundsText.fontSize + ' Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const outOfBoundsText = window.languageConfig.getText('outOfBounds');

        // Left side
        if (worldLeft > 0) {
            this.ctx.fillText(outOfBoundsText, worldLeft / 2, this.canvas.height / 2);
        }
        // Right side
        if (worldRight < this.canvas.width) {
            this.ctx.fillText(outOfBoundsText, (this.canvas.width + worldRight) / 2, this.canvas.height / 2);
        }
        // Top side
        if (worldTop > 0) {
            this.ctx.fillText(outOfBoundsText, this.canvas.width / 2, worldTop / 2);
        }
        // Bottom side
        if (worldBottom < this.canvas.height) {
            this.ctx.fillText(outOfBoundsText, this.canvas.width / 2, (this.canvas.height + worldBottom) / 2);
        }
    }

    draw() {
        // Clear the entire canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw world border and background first
        this.drawWorldBorder();
        
        // Save the context state
        this.ctx.save();
        
        // Create a clipping path for the game world
        this.ctx.beginPath();
        this.ctx.rect(-this.camera.x, -this.camera.y, this.worldSize, this.worldSize);
        this.ctx.clip();
        
        // Draw grid with a lighter color
        this.drawGrid();
        
        // Draw food
        this.food.forEach(f => {
            this.ctx.save();
            this.ctx.translate(f.x - this.camera.x, f.y - this.camera.y);
            
            if (f.isHexagon) {
                // Draw hexagon with border
                const isLarger = f.radius > this.player.radius;
                const isSmaller = f.radius < this.player.radius;
                const borderWidth = 3;
                
                // Draw hexagon
                this.drawHexagon(0, 0, f.radius);
                
                // Draw border if needed
                if (isLarger || isSmaller) {
                    this.ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * Math.PI) / 3;
                        const px = (f.radius + borderWidth/2) * Math.cos(angle);
                        const py = (f.radius + borderWidth/2) * Math.sin(angle);
                        if (i === 0) this.ctx.moveTo(px, py);
                        else this.ctx.lineTo(px, py);
                    }
                    this.ctx.closePath();
                    this.ctx.strokeStyle = isLarger ? 'rgba(231, 76, 60, 0.8)' : 'rgba(46, 204, 113, 0.8)';
                    this.ctx.lineWidth = borderWidth;
                    this.ctx.stroke();
                }

                // Draw letter on hexagon
                this.ctx.fillStyle = '#fff';
                this.ctx.font = `${Math.max(20, f.radius / 2)}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(f.letter, 0, 0);
            } else {
                this.drawObject(this.ctx, 0, 0, f.radius, f.letter, '#e74c3c');
            }
            
            this.ctx.restore();
        });

        // Draw opponents
        this.opponents.forEach(opp => {
            this.ctx.save();
            this.ctx.translate(opp.x - this.camera.x, opp.y - this.camera.y);
            this.drawObject(this.ctx, 0, 0, opp.radius, opp.letter, opp.color, true);
            this.ctx.restore();
        });
        
        // Draw powerups
        this.powerupItems.forEach(p => {
            this.ctx.save();
            this.ctx.translate(p.x - this.camera.x, p.y - this.camera.y);
            this.drawObject(this.ctx, 0, 0, p.radius, '', p.color);
            this.ctx.restore();
        });
        
        // Draw player
        this.ctx.save();
        this.ctx.translate(this.player.x - this.camera.x, this.player.y - this.camera.y);
        this.drawObject(this.ctx, 0, 0, this.player.radius, '', this.player.color);
        this.ctx.restore();

        // Draw direction arrows
        this.drawArrows();

        // Draw particles
        this.drawParticles();

        // Draw absorption animation
        this.drawAbsorptionAnimation();

        // Draw eat text if it exists
        if (this.eatText) {
            const progress = this.eatText.life / this.eatText.maxLife;
            const animConfig = gameConfig.ui.eatText.animation;
            
            // Update position and properties
            this.eatText.y += this.eatText.velocity.y;
            this.eatText.alpha = progress;
            this.eatText.scale = 1 + (1 - progress) * animConfig.scaleFactor;
            this.eatText.rotation += this.eatText.rotationSpeed;
            
            // Draw the text with effects
            this.ctx.save();
            this.ctx.translate(this.eatText.x - this.camera.x, this.eatText.y - this.camera.y);
            this.ctx.rotate(this.eatText.rotation);
            this.ctx.scale(this.eatText.scale, this.eatText.scale);
            
            // Draw text shadow
            this.ctx.shadowColor = animConfig.shadow.color;
            this.ctx.shadowBlur = animConfig.shadow.blur;
            this.ctx.shadowOffsetX = animConfig.shadow.offsetX;
            this.ctx.shadowOffsetY = animConfig.shadow.offsetY;
            
            // Draw the text
            this.ctx.font = this.eatText.font;
            this.ctx.fillStyle = this.eatText.color.replace('1)', `${this.eatText.alpha})`);
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.eatText.text, 0, 0);
            
            this.ctx.restore();
            
            // Update life
            this.eatText.life--;
            if (this.eatText.life <= 0) {
                this.eatText = null;
            }
        }

        // Restore the context state
        this.ctx.restore();
    }

    drawGrid() {
        const gridSize = gameConfig.world.gridSize;
        const offsetX = -this.camera.x % gridSize;
        const offsetY = -this.camera.y % gridSize;
        
        this.ctx.strokeStyle = gameConfig.ui.grid.color;
        this.ctx.lineWidth = gameConfig.ui.grid.lineWidth;
        
        for (let x = offsetX; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = offsetY; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawHexagon(x, y, radius) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = x + radius * Math.cos(angle);
            const py = y + radius * Math.sin(angle);
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fill();
    }

    calculatePerimeterRadius() {
        return this.player.radius + this.movementConfig.perimeterOffset;
    }

    updatePlayerMovement() {
        // Check if we should use gyroscope control
        if (this.gyroscopeEnabled && this.lastGyroscopeUpdate > Date.now() - 1000) {
            // Use gyroscope data for movement
            const targetSpeed = this.player.speed;
            this.player.targetVelocity = {
                x: this.gyroscopeData.x * targetSpeed,
                y: this.gyroscopeData.y * targetSpeed
            };
        } else {
            // Original mouse-based movement code
            const dx = this.mousePosition.x - this.player.x;
            const dy = this.mousePosition.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const perimeterRadius = this.calculatePerimeterRadius();

            if (distance > perimeterRadius) {
                const directionX = dx / distance;
                const directionY = dy / distance;
                const distanceFromPerimeter = distance - perimeterRadius;
                const maxDistance = 100;
                const speedFactor = Math.min(distanceFromPerimeter / maxDistance, 1);
                const scaledSpeedFactor = Math.pow(speedFactor, 1.2);
                
                this.player.targetVelocity = {
                    x: directionX * this.player.speed * scaledSpeedFactor,
                    y: directionY * this.player.speed * scaledSpeedFactor
                };
                this.mousePosition.isInPerimeter = false;
            } else {
                this.player.targetVelocity = {
                    x: this.player.velocity.x * 0.98,
                    y: this.player.velocity.y * 0.98
                };
                this.mousePosition.isInPerimeter = true;
            }
        }

        // Common movement code for both control methods
        this.player.velocity.x += (this.player.targetVelocity.x - this.player.velocity.x) * this.physicsConfig.smoothFactor;
        this.player.velocity.y += (this.player.targetVelocity.y - this.player.velocity.y) * this.physicsConfig.smoothFactor;

        this.player.x += this.player.velocity.x;
        this.player.y += this.player.velocity.y;

        // Keep player within world bounds
        this.player.x = Math.max(0, Math.min(this.worldSize, this.player.x));
        this.player.y = Math.max(0, Math.min(this.worldSize, this.player.y));
    }

    updatePlayerGrowth() {
        if (this.growthConfig.currentSize < this.growthConfig.targetSize) {
            const oldRadius = this.player.radius;
            const oldMass = this.player.mass;
            const oldSpeed = this.player.speed;
            
            // Make growth more gradual
            const growthStep = this.growthConfig.growthSpeed * 0.1;
            this.growthConfig.currentSize = Math.min(
                this.growthConfig.currentSize + growthStep,
                this.growthConfig.targetSize
            );
            
            // Update player radius based on current size with a cap
            const maxRadius = this.player.baseRadius * this.growthConfig.maxGrowth;
            const baseRadius = Math.sqrt(this.player.mass);
            this.player.radius = Math.min(
                baseRadius * this.growthConfig.currentSize,
                maxRadius
            );
            
            // Update mass with a cap
            const maxMass = Math.PI * maxRadius * maxRadius;
            this.player.mass = Math.min(
                this.player.radius * this.player.radius,
                maxMass
            );
            
            // Update speed
            this.player.speed = this.calculateSpeed(this.player.mass);
            
            // Log significant changes
            if (Math.abs(oldSpeed - this.player.speed) > 1) {
                console.log('\n=== Growth Update ===');
                console.log(`Radius: ${oldRadius.toFixed(2)} -> ${this.player.radius.toFixed(2)}`);
                console.log(`Mass: ${oldMass.toFixed(2)} -> ${this.player.mass.toFixed(2)}`);
                console.log(`Speed: ${oldSpeed.toFixed(2)} -> ${this.player.speed.toFixed(2)}`);
            }
        }
    }

    gameLoop() {
        this.updateCamera();
        this.updatePlayerMovement();
        this.updateArrows();
        this.updateOpponentPositions();
        this.updateParticles();
        this.updateAbsorptionAnimation();
        this.updatePlayerGrowth();
        this.checkOpponentCollisions();
        this.checkCollisions();
        this.draw();
        this.updatePowerupDisplay();
        requestAnimationFrame(() => this.gameLoop());
    }

    gameOver() {
        // Reset player with initial values
        this.player.radius = this.player.baseRadius;
        this.player.mass = this.physicsConfig.baseMass;
        this.player.speed = this.physicsConfig.maxSpeed;
        this.player.velocity = { x: 0, y: 0 };
        this.player.targetVelocity = { x: 0, y: 0 };
        this.player.x = this.worldSize / 2;
        this.player.y = this.worldSize / 2;
        this.score = 0;
        document.getElementById('score').textContent = `Score: 0`;
        
        // Show game over message
        const gameOverText = document.createElement('div');
        gameOverText.textContent = window.languageConfig.getText('gameOver');
        gameOverText.style.position = 'fixed';
        gameOverText.style.top = '50%';
        gameOverText.style.left = '50%';
        gameOverText.style.transform = 'translate(-50%, -50%)';
        gameOverText.style.color = '#e74c3c';
        gameOverText.style.fontSize = '32px';
        gameOverText.style.fontWeight = 'bold';
        gameOverText.style.textShadow = '2px 2px 4px rgba(0,0,0,0.3)';
        gameOverText.style.cursor = 'pointer';
        gameOverText.style.zIndex = '1000';
        
        document.body.appendChild(gameOverText);
        
        // Remove message on click
        gameOverText.onclick = () => {
            gameOverText.remove();
        };
    }

    initializeGyroscope() {
        // Check if device has gyroscope
        if (window.DeviceOrientationEvent) {
            // Add gyroscope toggle button to UI
            const gyroButton = document.createElement('button');
            gyroButton.id = 'gyroToggle';
            gyroButton.textContent = '🎮 Gyro';
            gyroButton.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 10px 20px;
                background: #3498db;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                z-index: 1000;
                display: none; // Hidden by default, shown on mobile
            `;
            
            // Show button only on mobile devices
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                gyroButton.style.display = 'block';
            }

            gyroButton.onclick = () => this.toggleGyroscope();
            document.body.appendChild(gyroButton);

            // Add event listener for device orientation
            window.addEventListener('deviceorientation', (event) => {
                if (this.gyroscopeEnabled) {
                    // Update gyroscope data
                    this.gyroscopeData = {
                        x: event.gamma * this.gyroscopeSensitivity, // Left/right tilt
                        y: event.beta * this.gyroscopeSensitivity   // Forward/backward tilt
                    };
                    this.lastGyroscopeUpdate = Date.now();
                }
            });
        }
    }

    toggleGyroscope() {
        this.gyroscopeEnabled = !this.gyroscopeEnabled;
        const button = document.getElementById('gyroToggle');
        
        if (this.gyroscopeEnabled) {
            button.style.background = '#2ecc71';
            button.textContent = '🎮 Gyro ON';
            // Request permission for iOS devices
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            window.addEventListener('deviceorientation', this.handleOrientation);
                        } else {
                            this.gyroscopeEnabled = false;
                            button.style.background = '#3498db';
                            button.textContent = '🎮 Gyro';
                            alert('Gyroscope permission denied');
                        }
                    })
                    .catch(console.error);
            }
        } else {
            button.style.background = '#3498db';
            button.textContent = '🎮 Gyro';
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 