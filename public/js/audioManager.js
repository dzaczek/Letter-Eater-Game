class AudioManager {
    constructor() {
        this.audioDir = '/audio';  // Changed to relative path
        this.supportedLanguages = window.languageConfig.getSupportedLanguages();
        this.currentLanguage = window.languageConfig.currentLanguage;
        this.audioCache = new Map();
        this.isInitialized = false;
        this.downloadQueue = new Set();
        this.isDownloading = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        
        try {
            await this.createAudioDirectory();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize audio manager:', error);
            throw error;
        }
    }

    async createAudioDirectory() {
        const response = await fetch('/create-audio-dir', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to create audio directory');
        }
    }

    async setLanguage(langCode) {
        if (!this.supportedLanguages[langCode]) {
            throw new Error(`Unsupported language: ${langCode}`);
        }
        this.currentLanguage = langCode;
        window.languageConfig.setLanguage(langCode);
        
        // Clear existing cache for the new language
        for (const key of this.audioCache.keys()) {
            if (key.startsWith(`${this.currentLanguage}_`)) {
                this.audioCache.delete(key);
            }
        }
        
        await this.preloadAudioFiles();
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    async preloadAudioFiles() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const downloadPromises = letters.map(letter => this.getAudioFile(letter));
        
        try {
            await Promise.allSettled(downloadPromises);
        } catch (error) {
            console.error('Error preloading audio files:', error);
            // Continue even if some files fail to load
        }
    }

    async getAudioFile(letter) {
        const cacheKey = `${this.currentLanguage}_${letter}`;
        
        // Check cache first
        if (this.audioCache.has(cacheKey)) {
            return this.audioCache.get(cacheKey);
        }

        const fileName = `${this.currentLanguage}_${letter}.mp3`;
        const filePath = `${this.audioDir}/${fileName}`;

        try {
            // Check if file exists on server
            const exists = await this.checkFileExists(filePath);
            
            if (!exists) {
                // Add to download queue if not already downloading
                if (!this.downloadQueue.has(letter)) {
                    this.downloadQueue.add(letter);
                    if (!this.isDownloading) {
                        this.processDownloadQueue();
                    }
                }
                return null;
            }

            // Load and cache the audio
            const audio = new Audio(filePath);
            this.audioCache.set(cacheKey, audio);
            return audio;
        } catch (error) {
            console.error(`Failed to get audio file for ${letter}:`, error);
            return null;
        }
    }

    async processDownloadQueue() {
        if (this.downloadQueue.size === 0) {
            this.isDownloading = false;
            return;
        }

        this.isDownloading = true;
        const letter = Array.from(this.downloadQueue)[0];
        this.downloadQueue.delete(letter);

        try {
            await this.downloadAudioFile(letter);
        } catch (error) {
            console.error(`Failed to download audio for ${letter}:`, error);
        }

        // Process next item in queue
        this.processDownloadQueue();
    }

    async checkFileExists(filePath) {
        try {
            const response = await fetch(filePath, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    async downloadAudioFile(letter) {
        const url = `/tts-proxy?text=${encodeURIComponent(letter)}&lang=${this.currentLanguage}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to download audio file');
            
            const blob = await response.blob();
            const formData = new FormData();
            formData.append('audio', blob, `${this.currentLanguage}_${letter}.mp3`);
            
            const saveResponse = await fetch('/save-audio', {
                method: 'POST',
                body: formData
            });
            
            if (!saveResponse.ok) {
                throw new Error('Failed to save audio file');
            }

            // Load and cache the audio after successful download
            const audio = new Audio(`${this.audioDir}/${this.currentLanguage}_${letter}.mp3`);
            this.audioCache.set(`${this.currentLanguage}_${letter}`, audio);
        } catch (error) {
            console.error('Error downloading audio file:', error);
            throw error;
        }
    }

    async playLetter(letter) {
        try {
            // Get the word for the letter from the dictionary
            const word = window.letterWords[this.currentLanguage][letter];
            
            // Use the word instead of just the letter for TTS
            const url = `/tts-proxy?text=${encodeURIComponent(word)}&lang=${this.currentLanguage}`;
            
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to get audio file');
                
                const blob = await response.blob();
                const audioUrl = URL.createObjectURL(blob);
                const audio = new Audio(audioUrl);
                
                // Clean up the URL after playing
                audio.onended = () => URL.revokeObjectURL(audioUrl);
                
                await audio.play();
            } catch (error) {
                console.error(`Failed to play word for letter ${letter}:`, error);
            }
        } catch (error) {
            console.error(`Failed to play letter ${letter}:`, error);
        }
    }
}

// Export for use in other files
window.AudioManager = AudioManager; 