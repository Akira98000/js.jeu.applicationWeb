/**
 * Classe de minuterie utilisable par plusieurs jeux
 * Permet de gérer un compte à rebours ou un chronomètre
 */
class GameTimer {
    /**
     * @param {number} duration - Durée en secondes
     * @param {Function} onTick - Fonction appelée à chaque seconde avec le temps formaté
     * @param {Function} onComplete - Fonction appelée à la fin du timer
     * @param {boolean} countUp - Si true, compte vers le haut (chronomètre), sinon compte à rebours
     */
    constructor(duration, onTick, onComplete, countUp = false) {
        this.duration = duration;
        this.remaining = countUp ? 0 : duration;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.isRunning = false;
        this.countUp = countUp;
        this.startTime = null;
    }

    /**
     * Démarre le timer
     */
    start() {
        this.isRunning = true;
        this.startTime = Date.now();
        
        this.interval = setInterval(() => {
            if (this.countUp) {
                this.remaining++;
                this.onTick(this.formatTime(this.remaining));
                
                if (this.remaining >= this.duration) {
                    this.stop();
                    this.onComplete();
                }
            } else {
                this.remaining--;
                this.onTick(this.formatTime(this.remaining));
                
                if (this.remaining <= 0) {
                    this.stop();
                    this.onComplete();
                }
            }
        }, 1000);
    }

    /**
     * Arrête le timer
     */
    stop() {
        this.isRunning = false;
        clearInterval(this.interval);
    }

    /**
     * Reprend le timer après un arrêt
     */
    resume() {
        if (!this.isRunning) {
            this.start();
        }
    }

    /**
     * Réinitialise le timer
     */
    reset() {
        this.stop();
        this.remaining = this.countUp ? 0 : this.duration;
        this.onTick(this.formatTime(this.remaining));
    }

    /**
     * Formate le temps en minutes:secondes
     * @param {number} seconds - Temps en secondes
     * @returns {string} Temps formaté (mm:ss)
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Obtient le temps écoulé depuis le début en format lisible
     * @returns {string} Temps formaté
     */
    getElapsedTimeFormatted() {
        if (!this.startTime) return "0:00";
        
        const elapsedSeconds = this.countUp 
            ? this.remaining 
            : this.duration - this.remaining;
            
        return this.formatTime(elapsedSeconds);
    }
}

// Exporte la classe pour l'utiliser dans différents jeux
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameTimer };
} else {
    // Si utilisé directement dans le navigateur
    window.GameTimer = GameTimer;
} 