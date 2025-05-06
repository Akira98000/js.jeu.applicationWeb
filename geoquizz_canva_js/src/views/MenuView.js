export default class MenuView {
    constructor() {
        // Éléments DOM
        this.menuContainer = document.getElementById('menuContainer');
        this.gameUIContainer = document.getElementById('gameUIContainer');
        this.playButton = document.getElementById('playButton');
        this.resetButton = document.getElementById('resetButton');
        this.startCountryEl = document.querySelector('#startCountry span');
        this.endCountryEl = document.querySelector('#endCountry span');
        this.countryInput = document.getElementById('countryInput');
        this.pathList = document.getElementById('pathList');
        
        // Gestion de l'état
        this.isMenuVisible = true;
        this.isGameUIVisible = false;
        this.currentGameMode = 'countryPath'; // Mode de jeu par défaut
        
        // Sélection de la région pour le mode "Nommez-les tous"
        this.regionSelectionContainer = null;
        this.selectedRegion = null;
        
        // Statistiques pour "Nommez-les tous"
        this.namedCountriesCount = 0;
        this.totalCountriesCount = 0;
        
        // Mode contraste élevé
        this.isHighContrast = false;
        
        // Éléments audio (pour implémentation ultérieure)
        this.clickSound = null;
        this.errorSound = null;
        this.successSound = null;
        
        // Créer les boutons de mode de jeu s'ils n'existent pas
        this._createNameThemAllButton();
        
        // Après avoir créé les boutons, initialiser les écouteurs d'événements
        this.nameThemAllButton = document.getElementById('nameThemAllButton');
        this.findPlaceButton = document.getElementById('findPlaceButton');
        
        // Initialiser les écouteurs d'événements pour les boutons du menu
        this._initEventListeners();
    }
    
    /**
     * Initialise les écouteurs d'événements pour les composants du menu
     * @private
     */
    _initEventListeners() {
        // Gestionnaire de clic du bouton de réinitialisation
        if (this.resetButton) {
            this.resetButton.addEventListener('click', () => {
                // Utiliser un événement personnalisé pour communiquer avec le contrôleur
                const event = new CustomEvent('resetGame');
                document.dispatchEvent(event);
            });
        }
        
        // Gestionnaire de clic du bouton "Nommez-les tous"
        if (this.nameThemAllButton) {
            console.log('Adding click listener to Name Them All button');
            this.nameThemAllButton.addEventListener('click', (event) => {
                event.preventDefault();
                console.log('Name Them All button clicked');
                
                // Jouer le son du clic si disponible
                if (this.clickSound) {
                    this.clickSound.currentTime = 0;
                    this.clickSound.play().catch(e => console.log('Error playing sound:', e));
                }
                
                // Définir le mode de jeu
                this.currentGameMode = 'nameThemAll';
                
                // Déclencher la sélection de la région
                console.log('Dispatching selectRegion event');
                const selectRegionEvent = new CustomEvent('selectRegion');
                document.dispatchEvent(selectRegionEvent);
            });
        } else {
            console.error('Name Them All button not found in DOM');
        }
        
        // Gestionnaire de clic du bouton "Trouver l'endroit"
        if (this.findPlaceButton) {
            console.log('Adding click listener to Find the Place button');
            this.findPlaceButton.addEventListener('click', (event) => {
                event.preventDefault();
                console.log('Find the Place button clicked');
                
                // Jouer le son du clic si disponible
                if (this.clickSound) {
                    this.clickSound.currentTime = 0;
                    this.clickSound.play().catch(e => console.log('Error playing sound:', e));
                }
                
                // Définir le mode de jeu
                this.currentGameMode = 'findPlace';
                
                // Déclencher l'événement de démarrage du jeu
                console.log('Dispatching startFindPlace event');
                const startFindPlaceEvent = new CustomEvent('startFindPlace');
                document.dispatchEvent(startFindPlaceEvent);
            });
        } else {
            console.error('Find the Place button not found in DOM');
        }
        
        // Gestionnaire de clic du bouton "Meilleurs scores"
        const highScoresButton = document.getElementById('highScoresButton');
        if (highScoresButton) {
            console.log('Adding click listener to High Scores button');
            highScoresButton.addEventListener('click', (event) => {
                event.preventDefault();
                console.log('High Scores button clicked');
                
                // Jouer le son du clic si disponible
                if (this.clickSound) {
                    this.clickSound.currentTime = 0;
                    this.clickSound.play().catch(e => console.log('Error playing sound:', e));
                }
                
                // Déclencher l'événement d'affichage des meilleurs scores
                console.log('Dispatching showHighScores event');
                const showHighScoresEvent = new CustomEvent('showHighScores');
                document.dispatchEvent(showHighScoresEvent);
            });
        }
    }
    
    /**
     * Crée les boutons de mode de jeu s'ils n'existent pas déjà
     * @private
     */
    _createNameThemAllButton() {
        // Ajouter le bouton "Nommez-les tous"
        if (!document.getElementById('nameThemAllButton')) {
            // Créer le bouton
            const button = document.createElement('button');
            button.id = 'nameThemAllButton';
            button.className = 'pixel-button';
            button.textContent = 'Name Them All';
            
            // Ajouter au conteneur du menu après le bouton de lecture
            if (this.playButton && this.menuContainer) {
                // Ajouter un espacement
                const spacer = document.createElement('div');
                spacer.style.height = '15px';
                this.menuContainer.insertBefore(spacer, this.playButton.nextSibling);
                
                // Ajouter le bouton après l'espacement
                this.menuContainer.insertBefore(button, spacer.nextSibling);
                
                console.log('Created "Name Them All" button');
            } else {
                console.error('Could not find play button or menu container to add "Name Them All" button');
            }
        } else {
            console.log('"Name Them All" button already exists');
        }
        
        // Ajouter le bouton "Trouver l'endroit"
        if (!document.getElementById('findPlaceButton')) {
            // Créer le bouton
            const button = document.createElement('button');
            button.id = 'findPlaceButton';
            button.className = 'pixel-button';
            button.textContent = 'Find the Place';
            
            // Ajouter au conteneur du menu après le bouton "Nommez-les tous"
            const nameThemAllButton = document.getElementById('nameThemAllButton');
            if (nameThemAllButton && this.menuContainer) {
                // Ajouter un espacement
                const spacer = document.createElement('div');
                spacer.style.height = '15px';
                this.menuContainer.insertBefore(spacer, nameThemAllButton.nextSibling);
                
                // Ajouter le bouton après l'espacement
                this.menuContainer.insertBefore(button, spacer.nextSibling);
                
                console.log('Created "Find the Place" button');
            } else {
                console.error('Could not find Name Them All button or menu container to add "Find the Place" button');
            }
        } else {
            console.log('"Find the Place" button already exists');
        }
        
        // Ajouter le bouton des meilleurs scores
        if (!document.getElementById('highScoresButton')) {
            // Créer le bouton
            const button = document.createElement('button');
            button.id = 'highScoresButton';
            button.className = 'pixel-button small';
            button.textContent = 'High Scores';
            
            // Ajouter au conteneur du menu après le bouton "Trouver l'endroit"
            const findPlaceButton = document.getElementById('findPlaceButton');
            if (findPlaceButton && this.menuContainer) {
                // Ajouter un espacement
                const spacer = document.createElement('div');
                spacer.style.height = '15px';
                this.menuContainer.insertBefore(spacer, findPlaceButton.nextSibling);
                
                // Ajouter le bouton après l'espacement
                this.menuContainer.insertBefore(button, spacer.nextSibling);
                
                console.log('Created "High Scores" button');
            } else {
                console.error('Could not find Find the Place button or menu container to add "High Scores" button');
            }
        } else {
            console.log('"High Scores" button already exists');
        }
    }
    
    /**
     * Affiche ou masque le menu principal
     * @param {boolean} show - Indique s'il faut afficher le menu
     */
    showMenu(show = true) {
        this.isMenuVisible = show;
        
        // Appliquer les transitions CSS pour une animation fluide
        if (show) {
            this.menuContainer.classList.remove('hidden');
            
            // Animation de fondu entrant
            setTimeout(() => {
                this.menuContainer.style.opacity = '1';
                this.menuContainer.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 10);
        } else {
            // Animation de fondu sortant
            this.menuContainer.style.opacity = '0';
            this.menuContainer.style.transform = 'translate(-50%, -50%) scale(0.9)';
            
            // Supprimer du DOM une fois l'animation terminée
            setTimeout(() => {
                this.menuContainer.classList.add('hidden');
            }, 300);
        }
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Affiche ou masque l'interface utilisateur du jeu
     * @param {boolean} show - Indique s'il faut afficher l'interface utilisateur du jeu
     */
    showGameUI(show = true) {
        this.isGameUIVisible = show;
        
        if (show) {
            this.gameUIContainer.classList.remove('hidden');
            
            // Animation de glissement vers le bas
            setTimeout(() => {
                this.gameUIContainer.style.opacity = '1';
                this.gameUIContainer.style.transform = 'translateY(0)';
            }, 10);
        } else {
            // Animation de glissement vers le haut
            this.gameUIContainer.style.opacity = '0';
            this.gameUIContainer.style.transform = 'translateY(-20px)';
            
            // Supprimer du DOM une fois l'animation terminée
            setTimeout(() => {
                this.gameUIContainer.classList.add('hidden');
            }, 300);
        }
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Met à jour la section des informations du jeu avec les pays de départ et d'arrivée
     * @param {string} startCountry - Nom du pays de départ
     * @param {string} endCountry - Nom du pays d'arrivée
     */
    updateGameInfo(startCountry, endCountry) {
        if (this.startCountryEl) {
            this.startCountryEl.textContent = startCountry;
        }
        
        if (this.endCountryEl) {
            this.endCountryEl.textContent = endCountry;
        }
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Ajoute un pays à la liste des chemins avec un style
     * @param {string} countryName - Nom du pays à ajouter
     * @param {string} status - Statut du pays ('correct', 'error')
     */
    addToPath(countryName, status = 'correct') {
        const itemEl = document.createElement('div');
        itemEl.className = `path-item ${status}`;
        itemEl.textContent = countryName;
        
        // Ajouter à la liste des chemins
        this.pathList.appendChild(itemEl);
        
        // Faire défiler vers le bas de la liste des chemins
        this.pathList.scrollTop = this.pathList.scrollHeight;
        
        // Ajouter une animation de secousse pour les erreurs
        if (status === 'error') {
            this._playErrorAnimation(itemEl);
            
            // Supprimer après un délai
            setTimeout(() => {
                itemEl.remove();
            }, 2000);
        }
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Efface la liste des chemins actuelle
     */
    clearPath() {
        if (this.pathList) {
            this.pathList.innerHTML = '';
        }
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Efface le champ de saisie et y met le focus
     */
    clearInput() {
        if (this.countryInput) {
            this.countryInput.value = '';
            this.countryInput.focus();
        }
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Joue une animation d'erreur sur un élément
     * @param {HTMLElement} element - Élément à animer
     * @private
     */
    _playErrorAnimation(element) {
        // L'animation de secousse est définie en CSS
        
        // Jouer le son d'erreur si disponible
        if (this.errorSound) {
            this.errorSound.currentTime = 0;
            this.errorSound.play().catch(e => console.log('Error playing sound:', e));
        }
    }
    
    /**
     * Affiche un message de victoire
     * @param {string} gameMode - Le mode de jeu 'countryPath' ou 'nameThemAll'
     * @param {Object} stats - Statistiques du jeu (optionnel)
     */
    showVictory(gameMode = 'countryPath', stats = null) {
        // Créer le message de victoire
        const victoryEl = document.createElement('div');
        victoryEl.className = 'victory-message';
        
        // Message différent en fonction du mode de jeu
        if (gameMode === 'nameThemAll') {
            victoryEl.innerHTML = `
                <h2>Victory!</h2>
                <p>You named all ${stats?.total || ''} countries in the ${this.selectedRegion || 'selected'} region!</p>
                <button id="playAgainBtn" class="pixel-button">Play Again</button>
            `;
        } else {
            victoryEl.innerHTML = `
                <h2>Victory!</h2>
                <p>You found a valid path between the countries!</p>
                <button id="playAgainBtn" class="pixel-button">Play Again</button>
            `;
        }
        
        // Ajouter au conteneur du jeu
        document.getElementById('gameContainer').appendChild(victoryEl);
        
        // Ajouter un écouteur d'événements au bouton "Rejouer"
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            // Supprimer le message de victoire
            victoryEl.remove();
            
            // Déclencher l'événement de réinitialisation
            const event = new CustomEvent('resetGame');
            document.dispatchEvent(event);
        });
        
        // Jouer le son de succès si disponible
        if (this.successSound) {
            this.successSound.currentTime = 0;
            this.successSound.play().catch(e => console.log('Error playing sound:', e));
        }
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Affiche l'interface de sélection de la région pour le jeu "Nommez-les tous"
     * @param {Array} regions - Régions disponibles à choisir
     * @param {Function} selectionHandler - Fonction pour gérer la sélection de la région
     */
    showRegionSelection(regions, selectionHandler) {
        // Supprimer toute sélection de région existante
        this.removeRegionSelection();
        
        // Créer le conteneur de sélection de la région
        this.regionSelectionContainer = document.createElement('div');
        this.regionSelectionContainer.className = 'region-selection';
        this.regionSelectionContainer.innerHTML = `
            <h2>Choose a Region</h2>
            <div class="region-buttons"></div>
        `;
        
        const buttonContainer = this.regionSelectionContainer.querySelector('.region-buttons');
        
        // Créer des boutons pour chaque région
        regions.forEach(region => {
            const button = document.createElement('button');
            button.className = 'pixel-button region-button';
            button.textContent = region;
            button.dataset.region = region;
            
            button.addEventListener('click', () => {
                this.selectedRegion = region;
                
                // Jouer le son du clic si disponible
                if (this.clickSound) {
                    this.clickSound.currentTime = 0;
                    this.clickSound.play().catch(e => console.log('Error playing sound:', e));
                }
                
                // Appeler le gestionnaire de sélection
                selectionHandler(region);
                
                // Supprimer l'interface utilisateur de sélection de la région
                this.removeRegionSelection();
            });
            
            buttonContainer.appendChild(button);
        });
        
        // Ajouter au conteneur du jeu
        document.getElementById('gameContainer').appendChild(this.regionSelectionContainer);
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Supprime l'interface de sélection de la région
     */
    removeRegionSelection() {
        if (this.regionSelectionContainer) {
            this.regionSelectionContainer.remove();
            this.regionSelectionContainer = null;
        }
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Configure le gestionnaire de clic du bouton de lecture
     * @param {Function} handler - Fonction de gestionnaire de clic
     */
    setPlayButtonHandler(handler) {
        if (this.playButton) {
            this.playButton.addEventListener('click', (event) => {
                event.preventDefault();
                
                // Jouer le son du clic si disponible
                if (this.clickSound) {
                    this.clickSound.currentTime = 0;
                    this.clickSound.play().catch(e => console.log('Error playing sound:', e));
                }
                
                handler();
            });
        }
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Configure le gestionnaire de saisie du pays
     * @param {Function} handler - Fonction de gestionnaire de saisie
     */
    setCountryInputHandler(handler) {
        if (this.countryInput) {
            this.countryInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    const countryName = this.countryInput.value.trim();
                    
                    if (countryName) {
                        handler(countryName, this.currentGameMode);
                    }
                }
            });
        }
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Met à jour l'interface utilisateur pour le mode de jeu "Nommez-les tous"
     * @param {string} region - Nom de la région sélectionnée
     * @param {number} named - Nombre de pays nommés
     * @param {number} total - Nombre total de pays dans la région
     */
    updateNameThemAllUI(region, named, total) {
        this.namedCountriesCount = named;
        this.totalCountriesCount = total;
        
        // Mettre à jour la section des informations du jeu
        if (this.startCountryEl) {
            this.startCountryEl.textContent = `Region: ${region}`;
        }
        
        if (this.endCountryEl) {
            this.endCountryEl.textContent = `Progress: ${named}/${total} countries`;
        }
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Affiche l'interface utilisateur de "Nommez-les tous"
     */
    showNameThemAllUI() {
        // Masquer la liste des chemins car nous n'en avons pas besoin pour ce mode
        if (this.pathList) {
            this.pathList.style.display = 'none';
        }
        
        // Afficher l'interface utilisateur du jeu
        this.showGameUI(true);
        
        // Définir le placeholder de la saisie
        if (this.countryInput) {
            this.countryInput.placeholder = 'Type a country name in this region';
        }
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Affiche l'interface utilisateur du jeu "Trouver l'endroit"
     * @param {number} currentRound - Numéro de la manche actuelle
     * @param {number} totalRounds - Nombre total de manches
     */
    showFindPlaceUI(currentRound, totalRounds) {
        // Masquer la liste des chemins car nous n'en avons pas besoin pour ce mode
        if (this.pathList) {
            this.pathList.style.display = 'none';
        }
        
        // Masquer le champ de saisie du pays s'il est visible
        if (this.countryInput) {
            this.countryInput.style.display = 'none';
        }
        
        // Mettre à jour la section des informations du jeu
        if (this.startCountryEl) {
            this.startCountryEl.textContent = `Round: ${currentRound}/${totalRounds}`;
        }
        
        if (this.endCountryEl) {
            this.endCountryEl.textContent = `Click on the map to place your pin`;
        }
        
        // Afficher l'interface utilisateur du jeu
        this.showGameUI(true);
        
        // Créer l'élément d'instruction
        const instruction = document.createElement('div');
        instruction.id = 'findPlaceInstruction';
        instruction.className = 'find-place-instruction';
        instruction.textContent = 'Where is this place? Click on the map to place your pin.';
        
        // Ajouter à l'interface utilisateur du jeu s'il n'est pas déjà là
        if (!document.getElementById('findPlaceInstruction') && this.gameUIContainer) {
            this.gameUIContainer.appendChild(instruction);
        }
        
        // Ajouter le bouton de basculement du mode épingle s'il n'est pas déjà là
        if (!document.getElementById('pinModeToggle') && this.gameUIContainer) {
            const pinModeBtn = document.createElement('button');
            pinModeBtn.id = 'pinModeToggle';
            pinModeBtn.className = 'pixel-button pin-mode-button';
            pinModeBtn.textContent = 'Toggle Pin Mode';
            
            // Ajouter un écouteur d'événements - envoyer uniquement l'événement, laisser le contrôleur gérer l'état
            pinModeBtn.addEventListener('click', () => {
                console.log('Pin mode button clicked');
                // Envoyer l'événement de basculement du mode épingle
                const togglePinModeEvent = new CustomEvent('togglePinMode');
                document.dispatchEvent(togglePinModeEvent);
                // Ne pas modifier l'état du bouton ici - GameController le fera
            });
            
            this.gameUIContainer.appendChild(pinModeBtn);
        }
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Met à jour l'interface utilisateur du jeu "Trouver l'endroit" après une tentative
     * @param {Object} guessResult - Résultat de la tentative du joueur
     */
    updateFindPlaceUI(guessResult) {
        if (!guessResult) return this;
        
        // Mettre à jour la section des informations du jeu avec le score
        if (this.endCountryEl) {
            this.endCountryEl.textContent = `Score: ${guessResult.score} (${Math.round(guessResult.distance)} km)`;
        }
        
        // Mettre à jour l'instruction
        const instruction = document.getElementById('findPlaceInstruction');
        if (instruction) {
            instruction.textContent = 'Click "Continue" to proceed to the next round.';
        }
        
        // Ajouter le bouton "Continuer" s'il n'est pas déjà là
        if (!document.getElementById('continueButton') && this.gameUIContainer) {
            const continueBtn = document.createElement('button');
            continueBtn.id = 'continueButton';
            continueBtn.className = 'pixel-button';
            continueBtn.textContent = 'Continue';
            
            // Ajouter un écouteur d'événements
            continueBtn.addEventListener('click', () => {
                // Supprimer le bouton
                continueBtn.remove();
                
                // Envoyer l'événement de continuation
                const continueEvent = new CustomEvent('continueFindPlace');
                document.dispatchEvent(continueEvent);
            });
            
            // Maintenir la position du bouton de mode épingle - ajouter le bouton "Continuer" avant lui
            const pinModeBtn = document.getElementById('pinModeToggle');
            if (pinModeBtn) {
                this.gameUIContainer.insertBefore(continueBtn, pinModeBtn);
            } else {
                this.gameUIContainer.appendChild(continueBtn);
            }
        }
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Bascule le mode contraste élevé pour l'accessibilité
     * @param {boolean} enable - Indique s'il faut activer le mode contraste élevé
     */
    toggleHighContrast(enable) {
        this.isHighContrast = enable === undefined ? !this.isHighContrast : enable;
        
        // Basculer la classe high-contrast sur le corps
        if (this.isHighContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Affiche les meilleurs scores
     * @param {Array} scores - Tableau d'objets de meilleurs scores
     */
    showHighScores(scores) {
        // Créer le conteneur des meilleurs scores
        const highScoresContainer = document.createElement('div');
        highScoresContainer.className = 'high-scores-container';
        
        let scoresHTML = '';
        
        if (scores && scores.length > 0) {
            scores.forEach((score, index) => {
                const date = new Date(score.date).toLocaleDateString();
                scoresHTML += `
                    <div class="high-score-item">
                        <div class="high-score-rank">${index + 1}</div>
                        <div class="high-score-ign">${score.ign}</div>
                        <div class="high-score-score">${score.score}</div>
                        <div class="high-score-date">${date}</div>
                    </div>
                `;
            });
        } else {
            scoresHTML = '<div class="no-scores">No scores yet. Play the game to set high scores!</div>';
        }
        
        highScoresContainer.innerHTML = `
            <h2>High Scores</h2>
            <div class="high-scores-list">
                ${scoresHTML}
            </div>
            <button id="closeHighScoresBtn" class="pixel-button">Close</button>
        `;
        
        // Ajouter au conteneur du jeu
        document.getElementById('gameContainer').appendChild(highScoresContainer);
        
        // Ajouter un écouteur d'événements au bouton de fermeture
        document.getElementById('closeHighScoresBtn').addEventListener('click', () => {
            highScoresContainer.remove();
        });
        
        return this; // Permettre le chaînage
    }
    
    /**
     * Initialise les effets sonores pour le jeu
     * Peut être implémenté ultérieurement comme objectif d'extension
     */
    initSounds() {
        // L'initialisation du son peut être implémentée à l'avenir
        return this; // Permettre le chaînage
    }
}