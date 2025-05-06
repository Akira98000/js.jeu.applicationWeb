/**
 * Classe de gestion du son commune pour les jeux
 * Offre une fonctionnalité complète pour Plant Game et
 * une version simplifiée pour GeoQuizz
 */
class Sound {
    /**
     * @param {Object} options - Options de configuration
     * @param {boolean} options.simplified - Mode simplifié pour GeoQuizz (un seul son)
     * @param {string} options.basePath - Chemin de base pour les fichiers audio
     * @param {Object} options.sounds - Dictionnaire des sons à précharger
     */
    constructor(options = {}) {
        this.sounds = {};
        this.backgroundMusic = null;
        this.isMuted = false;
        this.volume = 0.5;
        this.isBackgroundMusicPlaying = false;
        this.userInteracted = false;
        this.simplified = options.simplified || false;
        this.basePath = options.basePath || './src/audio/';
        
        // Structure des volumes pour chaque type de son
        this.volumeMultipliers = {
            'upgrade': 0.3,
            'plant': 1.5,
            'water': 1.8,
            'background': 0.3,
            'click': 1.0
        };
        
        // Préchargement des sons
        if (this.simplified) {
            // Mode simplifié pour GeoQuizz
            this.loadSound('click', this.basePath + 'click.mp3');
        } else {
            // Mode complet pour Plant Game
            this.preloadSounds(options.sounds);
        }
        
        // Si l'interface doit être créée immédiatement
        if (options.createInterface !== false) {
            this.createMuteButton(options.controlsContainer);
        }
        
        this.setupInteractionListener();
    }
    
    preloadSounds(customSounds = null) {
        // Sons d'interface par défaut
        const interfaceSounds = customSounds || {
            'click': 'click.mp3',
            'upgrade': 'upgrade.mp3',
            'error': 'error.mp3',
            'success': 'success.mp3',
            'levelUp': 'level_up.mp3',
            'gameOver': 'game_over.mp3',
            // Sons de jardinage
            'plant': 'plant.mp3',
            'water': 'water.mp3',
            'harvest': 'harvest.mp3',
            'plow': 'plow.mp3'
        };
        
        // Charger tous les sons
        Object.entries(interfaceSounds).forEach(([name, file]) => {
            const path = file.startsWith('./') ? file : this.basePath + file;
            this.loadSound(name, path, this.volumeMultipliers[name] || 1);
        });
        
        // Sons avec fallback
        if (!this.simplified) {
            this.tryLoadSoundWithFallback('plant', this.basePath + 'plant.mp3', this.basePath + 'water.mp3');
            this.tryLoadSoundWithFallback('harvest', this.basePath + 'harvest.mp3', this.basePath + 'plow.mp3');
        }
        
        // Musique d'ambiance (seulement pour le mode complet)
        if (!this.simplified) {
            this.backgroundMusic = new Audio(this.basePath + 'background_music.mp3');
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = this.getAdjustedVolume('background');
        }
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
            if (!this.simplified) {
                this.startBackgroundMusic();
            }
            
            interactionEvents.forEach(eventType => {
                document.removeEventListener(eventType, handleInteraction);
            });
        };
        
        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, handleInteraction);
        });
    }
    
    /**
     * Joue un son par son nom
     * @param {string} soundName - Nom du son à jouer
     */
    play(soundName) {
        if (this.isMuted || !this.sounds[soundName]) return;
        
        this.userInteracted = true;
        
        // Sons avec effet de superposition (uniquement en mode complet)
        if (!this.simplified && ['plant', 'water'].includes(soundName)) {
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
        if (this.simplified || this.isMuted || this.isBackgroundMusicPlaying || !this.userInteracted || !this.backgroundMusic) return;
        
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
        if (this.simplified) return;
        
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
        if (this.simplified || !this.isBackgroundMusicPlaying || !this.backgroundMusic) return;
        
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
        
        // Gérer la musique de fond (seulement en mode complet)
        if (!this.simplified && this.backgroundMusic) {
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
        
        // Mettre à jour le volume de la musique de fond (seulement en mode complet)
        if (!this.simplified && this.backgroundMusic) {
            this.backgroundMusic.volume = this.getAdjustedVolume('background');
        }
    }
    
    /**
     * Crée les contrôles de son dans l'interface
     * @param {string|Element} containerSelector - Sélecteur CSS ou élément DOM pour le conteneur des contrôles
     */
    createMuteButton(containerSelector = '.stats-container') {
        document.addEventListener('DOMContentLoaded', () => {
            let container = null;
            
            // Si containerSelector est un élément DOM
            if (containerSelector instanceof Element) {
                container = containerSelector;
            } else if (typeof containerSelector === 'string') {
                container = document.querySelector(containerSelector);
            }
            
            if (!container) {
                console.warn(`Conteneur des contrôles de son non trouvé: ${containerSelector}`);
                return;
            }
            
            // Pour le mode simplifié, création de boutons plus minimalistes
            const soundControls = document.createElement('div');
            soundControls.className = 'sound-controls';
            
            // Bouton muet
            const muteButton = document.createElement('button');
            muteButton.id = 'mute-button';
            muteButton.className = 'mute-button';
            muteButton.innerHTML = this.isMuted ? '🔇' : '🔊';
            muteButton.addEventListener('click', () => {
                this.toggleMute();
                if (!this.isMuted) {
                    this.play('click');
                }
            });
            
            // En mode simplifié, on ajoute juste le bouton muet
            if (this.simplified) {
                soundControls.appendChild(muteButton);
                container.appendChild(soundControls);
                return;
            }
            
            // Mode complet: curseur de volume
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
            container.appendChild(soundControls);
        });
    }
    
    /**
     * Configure les événements sonores sur des boutons
     * @param {string} selector - Sélecteur CSS pour les éléments à configurer
     */
    setupSoundEvents(selector = 'button') {
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll(selector).forEach(button => {
                if (button.id === 'mute-button' || button.dataset.noSound === 'true') return;
                
                button.addEventListener('click', () => {
                    // En mode simplifié, toujours jouer "click"
                    if (this.simplified) {
                        this.play('click');
                    } else {
                        // En mode complet, détecter le type de son par l'id du bouton
                        const soundType = button.id.includes('upgrade') ? 'upgrade' : 'click';
                        this.play(soundType);
                    }
                });
            });
        });
    }
}

// Exporte la classe pour l'utiliser dans différents jeux
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Sound };
} else {
    // Si utilisé directement dans le navigateur
    window.Sound = Sound;
} 