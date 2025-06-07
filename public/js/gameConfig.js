// Game configuration object
const gameConfig = {
    // World settings
    world: {
        size: 10000,
        gridSize: 50
    },

    // Player settings
    player: {
        baseRadius: 25,
        baseMass: 100,
        baseSpeed: 7.5,
        color: '#3498db',
        density: 0.34
    },

    // Physics settings
    physics: {
        maxSpeed: 7.5,
        minSpeed: 1.25,
        massFactor: 0.15,
        smoothFactor: 0.1,
        maxAcceleration: 0.15,
        maxDeceleration: 0.1
    },

    // Food settings
    food: {
        radius: 15,
        initialCount: 100,
        spawnInterval: 1000, // ms
        colors: {
            normal: '#e74c3c',
            hexagon: '#e74c3c'
        }
    },

    // Powerup settings
    powerups: {
        radius: 10,
        initialCount: 5,
        spawnInterval: 5000, // ms
        duration: 10000, // ms
        types: {
            speed: {
                color: '#e74c3c',
                multiplier: 2.0
            },
            bulletproof: {
                color: '#2ecc71'
            },
            growth: {
                color: '#f1c40f',
                multiplier: 1.5
            }
        }
    },

    // Opponent settings
    opponents: {
        maxCount: 20,
        updateInterval: 100, // ms
        respawnInterval: 5000, // ms
        visionRange: 300,
        sizeRange: {
            min: 20,
            max: 40
        },
        iqRange: {
            min: 0.5,
            max: 2.0
        },
        decisionDelay: {
            min: 100,
            max: 500
        },
        escapeThreshold: 1.2,
        huntThreshold: 0.8,
        growthRate: 0.05,
        maxGrowth: 1.5,
        massTransfer: 0.3
    },

    // Growth settings
    growth: {
        baseGrowth: 0.02,
        opponentGrowth: 0.05,
        maxGrowth: 1.5,
        growthSpeed: 0.05,
        massTransfer: 0.3
    },

    // Particle settings
    particles: {
        maxCount: 20,
        baseSize: 3,
        baseSpeed: 2,
        lifetime: 1000, // ms
        color: '#ffffff'
    },

    // Absorption animation settings
    absorption: {
        particleCount: 20,
        particleSize: 3,
        particleSpeed: 2,
        particleLife: 1000, // ms
        particleColor: '#ffffff',
        duration: 500, // ms
        shrinkSpeed: 0.95,
        pulseScale: 1.1,
        pulseSpeed: 0.1
    },

    // Movement settings
    movement: {
        perimeterOffset: 10,
        maxDistance: 100,
        speedScaling: 1.2,
        deceleration: 0.98
    },

    // UI settings
    ui: {
        eatText: {
            fontSize: 28,
            duration: 100, // frames
            offset: 20,
            animation: {
                velocity: { y: -1 }, // Move upward
                rotationRange: 0.2, // Random rotation range
                rotationSpeedRange: 0.02, // Random rotation speed range
                scaleFactor: 0.5, // Scale up factor as it fades
                font: 'bold 28px Arial',
                color: 'rgba(255, 255, 255, 1)',
                shadow: {
                    color: 'rgba(0, 0, 0, 0.5)',
                    blur: 4,
                    offsetX: 2,
                    offsetY: 2
                }
            }
        },
        arrows: {
            length: 50,
            width: 20,
            distanceFromCenter: 30,
            colors: {
                smaller: 'rgba(46, 204, 113, 0.7)',
                larger: 'rgba(231, 76, 60, 0.7)'
            }
        },
        grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1
        },
        worldBorder: {
            outerColor: 'rgba(0, 0, 0, 0.5)',
            innerColor: 'rgba(0, 0, 0, 0.3)',
            outerWidth: 10,
            innerWidth: 5,
            outOfBoundsText: {
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '24px'
            }
        }
    },

    // Score settings
    score: {
        foodPoints: 10,
        opponentPointsMultiplier: 20
    }
};

// Export the configuration
window.gameConfig = gameConfig; 