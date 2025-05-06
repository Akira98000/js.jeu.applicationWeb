/**
 * API de Classement pour Garden Simulator
 * Permet d'accéder aux scores stockés dans le localStorage depuis d'autres jeux ou sites
 */

const GardenSimulatorLeaderboard = {
    /**
     * Récupère tout le classement
     * @returns {Array} Tableau des scores triés (max 10)
     */
    getFullLeaderboard: function() {
        return JSON.parse(localStorage.getItem('gardenSimulatorLeaderboard')) || [];
    },
    
    /**
     * Récupère les N meilleurs scores
     * @param {Number} count Nombre de scores à récupérer
     * @returns {Array} Les N meilleurs scores
     */
    getTopScores: function(count = 3) {
        const leaderboard = this.getFullLeaderboard();
        return leaderboard.slice(0, Math.min(count, leaderboard.length));
    },
    
    /**
     * Récupère le meilleur score
     * @returns {Object|null} Le meilleur score ou null si aucun score n'existe
     */
    getBestScore: function() {
        const leaderboard = this.getFullLeaderboard();
        return leaderboard.length > 0 ? leaderboard[0] : null;
    },
    
    /**
     * Récupère le dernier score enregistré
     * @returns {Number|null} Le dernier score ou null si aucun score n'existe
     */
    getLastScore: function() {
        const score = localStorage.getItem('gardenSimulatorLastScore');
        return score ? parseInt(score) : null;
    },
    
    /**
     * Vérifie si le score donné est un nouveau record
     * @param {Number} score Score à vérifier
     * @returns {Boolean} Vrai si c'est un nouveau record
     */
    isNewHighScore: function(score) {
        const bestScore = this.getBestScore();
        return !bestScore || score > bestScore.score;
    },
    
    /**
     * Génère du HTML pour afficher le classement
     * @param {Number} count Nombre de scores à afficher
     * @returns {String} HTML formaté pour afficher le classement
     */
    getLeaderboardHTML: function(count = 3) {
        const topScores = this.getTopScores(count);
        
        if (topScores.length === 0) {
            return '<p>Aucun score enregistré</p>';
        }
        
        let html = '<div class="garden-sim-leaderboard">';
        html += '<h3>🏆 Meilleurs scores Garden Simulator</h3>';
        
        topScores.forEach((entry, index) => {
            const date = new Date(entry.date);
            const formattedDate = date.toLocaleDateString();
            html += `
                <div class="leaderboard-entry">
                    <span class="rank">${index + 1}</span>
                    <span class="player-name">${entry.playerName}</span>
                    <span class="score">${entry.score} 🪙</span>
                    <span class="date">${formattedDate}</span>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    },
    
    /**
     * Affiche le classement dans un élément HTML
     * @param {String} containerId ID de l'élément où afficher le classement
     * @param {Number} count Nombre de scores à afficher
     */
    displayLeaderboard: function(containerId, count = 3) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = this.getLeaderboardHTML(count);
        }
    },
    
    /**
     * Permet de définir le nom du joueur pour les futurs scores
     * @param {String} name Nom du joueur
     */
    setPlayerName: function(name) {
        localStorage.setItem('playerName', name);
    }
};

// Exposer l'API globalement
window.GardenSimulatorLeaderboard = GardenSimulatorLeaderboard; 