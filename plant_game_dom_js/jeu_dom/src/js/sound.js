class Sound {
    constructor() {
        this.sounds = {};
        this.backgroundMusic = null;
        this.isMuted = false;
        this.volume = 0.5;
        this.isBackgroundMusicPlaying = false;
        this.userInteracted = false;
        
        // Structure des volumes pour chaque type de son
        this.volumeMultipliers = {
            'upgrade': 0.3,
            'plant': 1.5,
            'water': 1.8,
            'background': 0.3
        };
        
        this.preloadSounds();
        this.createMuteButton();
        this.setupInteractionListener();
    }
    
    preloadSounds() {
        // Sons d'interface
        const interfaceSounds = {
            'click': './src/audio/click.mp3',
            'upgrade': './src/audio/upgrade.mp3',
            'error': './src/audio/error.mp3',
            'success': './src/audio/success.mp3',
            'levelUp': './src/audio/level_up.mp3',
            'gameOver': './src/audio/game_over.mp3'
        };
        
        // Sons de jardinage
        const gardeningSounds = {
            'plant': './src/audio/plant.mp3',
            'water': './src/audio/water.mp3',
            'harvest': './src/audio/harvest.mp3',
            'plow': './src/audio/plow.mp3'
        };
        
        // Charger tous les sons
        Object.entries({...interfaceSounds, ...gardeningSounds}).forEach(([name, path]) => {
            this.loadSound(name, path, this.volumeMultipliers[name] || 1);
        });
        
        // Sons avec fallback
        this.tryLoadSoundWithFallback('plant', './src/audio/plant.mp3', './src/audio/water.mp3');
        this.tryLoadSoundWithFallback('harvest', './src/audio/harvest.mp3', './src/audio/plow.mp3');
        
        // Musique d'ambiance
        this.backgroundMusic = new Audio('./src/audio/background_music.mp3');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = this.getAdjustedVolume('background');
    }
    
    getAdjustedVolume(soundType) {
        const multiplier = this.volumeMultipliers[soundType] || 1;
        return Math.min(1, this.volume * multiplier);
    }
    
    tryLoadSoundWithFallback(name, primaryPath, fallbackPath) {
        const audio = new Audio();
        
        audio.addEventListener('error', () => {
            console.warn(`Impossible de charger le son: ${primaryPath}, utilisation du fallback: ${fallbackPath}`);
            audio.src = fallbackPath;
        });
        
        audio.src = primaryPath;
        audio.volume = this.getAdjustedVolume(name);
        this.sounds[name] = audio;
    }
    
    loadSound(name, path, volumeMultiplier = 1) {
        this.sounds[name] = new Audio(path);
        this.sounds[name].volume = this.getAdjustedVolume(name);
        
        this.sounds[name].addEventListener('error', () => {
            console.warn(`Impossible de charger le son: ${path}`);
        });
    }
    
    setupInteractionListener() {
        const interactionEvents = ['click', 'touchstart', 'keydown', 'mousedown'];
        
        const handleInteraction = () => {
            this.userInteracted = true;
            this.startBackgroundMusic();
            
            interactionEvents.forEach(eventType => {
                document.removeEventListener(eventType, handleInteraction);
            });
        };
        
        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, handleInteraction);
        });
    }
    
    play(soundName) {
        if (this.isMuted || !this.sounds[soundName]) return;
        
        this.userInteracted = true;
        
        // Sons avec effet de superposition
        if (['plant', 'water'].includes(soundName)) {
            this.playEnhanced(soundName);
            return;
        }
        
        try {
            if (this.sounds[soundName]?.cloneNode) {
                const soundClone = this.sounds[soundName].cloneNode();
                soundClone.volume = this.getAdjustedVolume(soundName);
                soundClone.play().catch(e => console.warn(`Erreur lors de la lecture du son ${soundName}:`, e));
            } else {
                console.warn(`Son ${soundName} non disponible ou mal initialisé`);
            }
        } catch (e) {
            console.warn(`Erreur lors de la lecture du son ${soundName}:`, e);
        }
    }
    
    playEnhanced(soundName) {
        if (!this.sounds[soundName]?.cloneNode) {
            console.warn(`Son ${soundName} non disponible pour la lecture améliorée`);
            return;
        }
        
        try {
            // Créer plusieurs instances du son pour un effet plus riche
            for (let i = 0; i < 3; i++) {
                const soundClone = this.sounds[soundName].cloneNode();
                const baseVolume = this.getAdjustedVolume(soundName);
                // Petite variation de volume pour un son plus naturel
                soundClone.volume = Math.min(1, baseVolume * (0.85 + (i * 0.15)));
                
                // Décalage léger entre chaque instance
                setTimeout(() => {
                    soundClone.play().catch(e => console.warn(`Erreur lors de la lecture du son ${soundName}:`, e));
                }, i * 10);
            }
        } catch (e) {
            console.warn(`Erreur lors de la lecture améliorée du son ${soundName}:`, e);
        }
    }
    
    startBackgroundMusic() {
        if (this.isMuted || this.isBackgroundMusicPlaying || !this.userInteracted) return;
        
        this.backgroundMusic.play()
            .then(() => {
                this.isBackgroundMusicPlaying = true;
            })
            .catch(e => {
                console.warn('Erreur lors de la lecture de la musique de fond:', e);
                
                if (e.name === 'NotAllowedError' && !document.getElementById('start-music-btn')) {
                    this.createStartMusicButton();
                }
            });
    }
    
    createStartMusicButton() {
        const musicButton = document.createElement('button');
        musicButton.id = 'start-music-btn';
        musicButton.className = 'start-music-button';
        musicButton.innerHTML = '🎵 Jouer la musique';
        musicButton.addEventListener('click', () => {
            this.backgroundMusic.play()
                .then(() => {
                    this.isBackgroundMusicPlaying = true;
                    musicButton.style.display = 'none';
                })
                .catch(e => console.warn('Échec du démarrage de la musique:', e));
        });
        
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            document.body.insertBefore(musicButton, gameContainer);
        } else {
            document.body.appendChild(musicButton);
        }
    }
    
    stopBackgroundMusic() {
        if (!this.isBackgroundMusicPlaying) return;
        
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
        this.isBackgroundMusicPlaying = false;
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        // Mettre à jour l'interface
        const muteButton = document.getElementById('mute-button');
        if (muteButton) {
            muteButton.innerHTML = this.isMuted ? '🔇' : '🔊';
        }
        
        // Appliquer le mute à tous les sons
        Object.values(this.sounds).forEach(sound => {
            sound.muted = this.isMuted;
        });
        
        // Gérer la musique de fond
        if (this.backgroundMusic) {
            this.backgroundMusic.muted = this.isMuted;
            
            if (!this.isMuted && this.userInteracted && !this.isBackgroundMusicPlaying) {
                this.startBackgroundMusic();
            }
        }
    }
    
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        
        // Mettre à jour le volume de tous les sons
        Object.entries(this.sounds).forEach(([name, sound]) => {
            sound.volume = this.getAdjustedVolume(name);
        });
        
        // Mettre à jour le volume de la musique de fond
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.getAdjustedVolume('background');
        }
    }
    
    createMuteButton() {
        document.addEventListener('DOMContentLoaded', () => {
            const statsContainer = document.querySelector('.stats-container');
            if (!statsContainer) return;
            
            const soundControls = document.createElement('div');
            soundControls.className = 'sound-controls';
            
            // Bouton muet
            const muteButton = document.createElement('button');
            muteButton.id = 'mute-button';
            muteButton.className = 'mute-button';
            muteButton.innerHTML = this.isMuted ? '🔇' : '🔊';
            muteButton.addEventListener('click', () => {
                this.toggleMute();
                this.play('click');
            });
            
            // Curseur de volume
            const volumeSlider = document.createElement('input');
            volumeSlider.type = 'range';
            volumeSlider.min = '0';
            volumeSlider.max = '1';
            volumeSlider.step = '0.1';
            volumeSlider.value = this.volume;
            volumeSlider.className = 'volume-slider';
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(parseFloat(e.target.value));
            });
            
            soundControls.appendChild(muteButton);
            soundControls.appendChild(volumeSlider);
            statsContainer.appendChild(soundControls);
        });
    }
}

// Créer une instance globale
const soundManager = new Sound();

// Configuration des événements sonores
function setupSoundEvents() {
    document.querySelectorAll('button').forEach(button => {
        if (button.id === 'mute-button') return;
        
        button.addEventListener('click', () => {
            const soundType = button.id.includes('upgrade') ? 'upgrade' : 'click';
            soundManager.play(soundType);
        });
    });
}

document.addEventListener('DOMContentLoaded', setupSoundEvents); 