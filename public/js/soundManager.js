class SoundManager {
    constructor() {
        this.audioContext = null;
        this.soundCache = new Map();
        this.isMuted = false;
        this.volume = 0.5;
        this.isInitialized = false;
        this.pendingSounds = [];
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Create AudioContext only after user interaction
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.audioContext.resume();
            this.isInitialized = true;
            console.log('AudioContext initialized successfully');
            
            // Play any pending sounds
            this.playPendingSounds();
        } catch (error) {
            console.error('Error initializing AudioContext:', error);
        }
    }

    async generateSound(letter, language) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            // Create oscillator for the sound
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Set up oscillator
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440 + (letter.charCodeAt(0) - 65) * 20, this.audioContext.currentTime);
            
            // Set up gain (volume) envelope
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
            
            // Create audio buffer
            const duration = 0.3; // 300ms
            const sampleRate = this.audioContext.sampleRate;
            const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
            const channelData = buffer.getChannelData(0);
            
            // Generate sound data
            for (let i = 0; i < channelData.length; i++) {
                const t = i / sampleRate;
                const frequency = 440 + (letter.charCodeAt(0) - 65) * 20;
                channelData[i] = Math.sin(2 * Math.PI * frequency * t) * 
                    Math.exp(-5 * t) * this.volume;
            }
            
            // Store in cache
            const cacheKey = this.getSoundCacheKey(letter, language);
            this.soundCache.set(cacheKey, buffer);
            
            return buffer;
        } catch (error) {
            console.error('Error generating sound:', error);
            return null;
        }
    }

    async playSound(letter, language) {
        if (this.isMuted) return;

        if (!this.isInitialized) {
            // Store the sound request for later
            this.pendingSounds.push({ letter, language });
            return;
        }

        try {
            const cacheKey = this.getSoundCacheKey(letter, language);
            let soundBuffer = this.soundCache.get(cacheKey);

            if (!soundBuffer) {
                soundBuffer = await this.generateSound(letter, language);
                if (!soundBuffer) return;
            }

            // Create and play the sound
            const source = this.audioContext.createBufferSource();
            source.buffer = soundBuffer;
            
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = this.volume;
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start(0);
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }

    async playPendingSounds() {
        if (!this.isInitialized) return;

        for (const sound of this.pendingSounds) {
            await this.playSound(sound.letter, sound.language);
        }
        this.pendingSounds = [];
    }

    async preloadSounds() {
        if (!this.isInitialized) {
            console.log('Waiting for user interaction to initialize audio...');
            return;
        }

        try {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
            const languages = ['en', 'pl', 'de'];
            
            for (const letter of letters) {
                for (const language of languages) {
                    await this.generateSound(letter, language);
                }
            }
            
            console.log('All sounds preloaded successfully');
        } catch (error) {
            console.error('Error preloading sounds:', error);
        }
    }

    getSoundCacheKey(letter, language) {
        return `${letter}-${language}`;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    // Clean up resources
    dispose() {
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.soundCache.clear();
        this.isInitialized = false;
        this.pendingSounds = [];
    }
} 