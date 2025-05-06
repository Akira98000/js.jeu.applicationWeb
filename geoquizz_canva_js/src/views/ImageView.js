export default class ImageView {
    constructor(containerId) {
        // Récupérer l'élément conteneur
        this.container = document.getElementById(containerId);
        
        // Créer les éléments requis
        if (!this.container) {
            console.error(`Container with ID ${containerId} not found`);
            this._createContainer(containerId);
        }
        
        // Créer les éléments image
        this._createImageElements();
        
        // État du jeu
        this.isImageVisible = false;
    }
    
    /**
     * Crée le conteneur s'il n'existe pas
     * @param {string} containerId - ID du conteneur
     * @private
     */
    _createContainer(containerId) {
        // Créer le conteneur
        this.container = document.createElement('div');
        this.container.id = containerId;
        this.container.className = 'image-container';
        
        // Ajouter au conteneur de jeu
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(this.container);
        } else {
            document.body.appendChild(this.container);
        }
    }
    
    /**
     * Crée les éléments image à l'intérieur du conteneur
     * @private
     */
    _createImageElements() {
        // Vider le conteneur
        this.container.innerHTML = '';
        
        // Créer un wrapper pour le style
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        
        // Créer l'élément image
        this.imageElement = document.createElement('img');
        this.imageElement.className = 'place-image';
        this.imageElement.alt = 'Find this place';
        
        // Créer l'élément de légende
        this.captionElement = document.createElement('div');
        this.captionElement.className = 'image-caption';
        
        // Créer l'indicateur de manche
        this.roundElement = document.createElement('div');
        this.roundElement.className = 'round-indicator';
        
        // Ajouter les éléments
        wrapper.appendChild(this.imageElement);
        wrapper.appendChild(this.captionElement);
        wrapper.appendChild(this.roundElement);
        this.container.appendChild(wrapper);
    }
    
    /**
     * Affiche une image pour la manche actuelle
     * @param {Object} placeData - Données du lieu avec image et nom
     * @param {number} currentRound - Numéro de la manche actuelle
     * @param {number} totalRounds - Nombre total de manches
     */
    showImage(placeData, currentRound, totalRounds) {
        if (!placeData || !placeData.image) {
            console.error('Invalid place data provided');
            return;
        }
        
        // Définir la source de l'image
        this.imageElement.src = `assets/${placeData.image}`;
        
        // Définir la légende (ne révélera pas le nom du lieu)
        this.captionElement.textContent = 'Where is this place?';
        
        // Mettre à jour l'indicateur de manche
        this.roundElement.textContent = `Round ${currentRound} of ${totalRounds}`;
        
        // Rendre le conteneur visible
        this.container.style.display = 'block';
        this.isImageVisible = true;
        
        // Appliquer l'animation d'entrée
        this.container.classList.add('fade-in');
        setTimeout(() => {
            this.container.classList.remove('fade-in');
        }, 500);
    }
    
    /**
     * Affiche le résultat après une tentative
     * @param {Object} placeData - Données du lieu
     * @param {Object} guessResult - Résultat de la tentative du joueur avec score et distance
     */
    showResult(placeData, guessResult) {
        if (!placeData || !guessResult) {
            return;
        }
        
        // Mettre à jour la légende avec le nom du lieu et le résultat
        this.captionElement.innerHTML = `
            <h3>${placeData.name}</h3>
            <p>${placeData.description}</p>
            <div class="result-info">
                <div>Distance: ${Math.round(guessResult.distance)} km</div>
                <div>Score: ${guessResult.score} points</div>
            </div>
        `;
        
        // Appliquer l'animation de surbrillance
        this.container.classList.add('highlight');
        setTimeout(() => {
            this.container.classList.remove('highlight');
        }, 1000);
    }
    
    /**
     * Affiche les résultats finaux du jeu
     * @param {Object} gameState - État final du jeu avec scores et épingles
     */
    showFinalResults(gameState) {
        // Vider le conteneur
        this.container.innerHTML = '';
        
        // Créer le contenu des résultats
        const resultsElement = document.createElement('div');
        resultsElement.className = 'final-results';
        
        let roundResults = '';
        gameState.pins.forEach((pin, index) => {
            roundResults += `
                <div class="round-result">
                    <div class="round-title">Round ${index + 1}: ${pin.placeName}</div>
                    <div class="round-details">
                        <span>Distance: ${Math.round(pin.distance)} km</span>
                        <span>Score: ${pin.score} points</span>
                    </div>
                </div>
            `;
        });
        
        resultsElement.innerHTML = `
            <h2>Game Complete!</h2>
            <div class="total-score">Total Score: ${gameState.totalScore} points</div>
            <div class="rounds-summary">
                ${roundResults}
            </div>
            <div class="score-form">
                <input type="text" id="ignInput" placeholder="Enter your name to save score" maxlength="15" />
                <button id="saveScoreBtn" class="pixel-button small">Save Score</button>
            </div>
            <div id="saveConfirmation" class="save-confirmation hidden">Score saved!</div>
            <button id="newGameBtn" class="pixel-button">Play Again</button>
        `;
        
        // Ajouter au conteneur
        this.container.appendChild(resultsElement);
        
        // Stocker les données de score pour un accès facile
        this.currentScore = gameState.totalScore;
        
        const saveScore = () => {
            const ignInput = document.getElementById('ignInput');
            const ign = ignInput.value.trim();
            
            if (ign) {
                // Envoyer un événement pour sauvegarder le score avec l'IGN
                const event = new CustomEvent('saveScore', {
                    detail: {
                        ign: ign,
                        score: this.currentScore
                    }
                });
                document.dispatchEvent(event);
                
                // Afficher la confirmation
                ignInput.value = '';
                const saveButton = document.getElementById('saveScoreBtn');
                saveButton.textContent = 'Saved!';
                saveButton.disabled = true;
                
                // Afficher le message de confirmation
                const saveConfirmation = document.getElementById('saveConfirmation');
                if (saveConfirmation) {
                    saveConfirmation.classList.remove('hidden');
                }
                
                // Réinitialiser le bouton après un délai
                setTimeout(() => {
                    if (saveButton) {
                        saveButton.textContent = 'Save Score';
                        saveButton.disabled = false;
                    }
                    if (saveConfirmation) {
                        saveConfirmation.classList.add('hidden');
                    }
                }, 2000);
            } else {
                // Surligner le champ de saisie s'il est vide
                ignInput.classList.add('error-input');
                setTimeout(() => {
                    ignInput.classList.remove('error-input');
                }, 1000);
            }
        };
        
        // Ajouter un écouteur d'événements au bouton de sauvegarde du score
        document.getElementById('saveScoreBtn').addEventListener('click', saveScore);
        
        // Ajouter un écouteur d'événements pour la touche Entrée dans le champ de saisie
        document.getElementById('ignInput').addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                saveScore();
            }
        });
        
        // Ajouter un écouteur d'événements au bouton nouvelle partie
        document.getElementById('newGameBtn').addEventListener('click', () => {
            // Utiliser un événement personnalisé pour que le contrôleur le gère
            const event = new CustomEvent('resetGame');
            document.dispatchEvent(event);
        });
    }
    
    /**
     * Masque le conteneur d'image
     */
    hide() {
        // Animation de fondu sortant
        this.container.classList.add('fade-out');
        
        setTimeout(() => {
            this.container.style.display = 'none';
            this.container.classList.remove('fade-out');
            this.isImageVisible = false;
        }, 300);
    }
    
    /**
     * Affiche un message dans la zone d'image
     * @param {string} message - Message à afficher
     */
    showMessage(message) {
        // Créer/mettre à jour l'élément de message
        if (!this.messageElement) {
            this.messageElement = document.createElement('div');
            this.messageElement.className = 'image-message';
            this.container.appendChild(this.messageElement);
        }
        
        this.messageElement.textContent = message;
        this.messageElement.style.display = 'block';
        
        // Rendre le conteneur visible s'il ne l'est pas déjà
        this.container.style.display = 'block';
    }
}