import PlaceFinderModel from '../models/PlaceFinderModel.js';
import ImageView from '../views/ImageView.js';

export default class GameController {
    /**
     * Crée un nouveau GameController
     * @param {MapModel} model - Le modèle de données de la carte
     * @param {CanvasView} canvasView - La vue du canevas pour le rendu de la carte
     * @param {MenuView} menuView - La vue du menu pour les interactions utilisateur
     */
    constructor(model, canvasView, menuView) {
        this.model = model;
        this.canvasView = canvasView;
        this.menuView = menuView;
        
        // État du jeu
        this.isGameActive = false;
        this.currentGameMode = 'countryPath'; // Mode de jeu par défaut
        
        // État du jeu Country Path
        this.startCountry = null;
        this.endCountry = null;
        this.currentPath = [];
        this.gameStats = {
            moves: 0,
            errors: 0,
            startTime: null,
            endTime: null
        };
        
        // État du jeu Name Them All
        this.selectedRegion = null;
        this.regionCountries = [];
        this.namedCountries = new Set();
        
        // État du jeu Find the Place
        this.placeFinderModel = new PlaceFinderModel();
        this.imageView = null; // Sera initialisé si nécessaire
        
        // Lier les gestionnaires d'événements
        this._bindEventListeners();
    }
    
    /**
     * Initialise le jeu
     * @param {string} svgUrl - URL du fichier de la carte SVG
     */
    async init(svgUrl) {
        // Afficher l'indicateur de chargement
        this.canvasView.showLoading(true);
        
        try {
            // Charger les données de la carte
            const success = await this.model.loadMapData(svgUrl);
            
            if (success) {
                // Rendre la carte
                this.canvasView.renderMap(this.model.getAllCountriesForRendering());
                
                // Masquer l'indicateur de chargement
                this.canvasView.showLoading(false);
                
                // Configurer les gestionnaires de la vue du menu
                this.menuView.setPlayButtonHandler(() => this.startGame());
                this.menuView.setCountryInputHandler((countryName) => this.handleCountryInput(countryName));
                
                console.log('Game initialized successfully');
            } else {
                console.error("Failed to load map data");
                this.canvasView.showLoading(false);
                // Afficher un message d'erreur
                alert('Failed to load map data. Please refresh the page to try again.');
            }
        } catch (error) {
            console.error("Error initializing game:", error);
            this.canvasView.showLoading(false);
            alert('An error occurred while initializing the game. Please refresh the page to try again.');
        }
    }
    
    /**
     * Lie les écouteurs d'événements pour le jeu
     * @private
     */
    _bindEventListeners() {
        // Écouter l'événement de réinitialisation du jeu
        document.addEventListener('resetGame', () => this.resetGame());
        
        // Écouter l'événement de sélection de région
        console.log('Binding selectRegion event listener');
        document.addEventListener('selectRegion', () => {
            console.log('selectRegion event received, showing region selection');
            this.showRegionSelection();
        });
        
        // Écouter les événements du jeu Find the Place
        document.addEventListener('startFindPlace', () => {
            console.log('startFindPlace event received, starting Find the Place game');
            this.startFindPlaceGame();
        });
        
        document.addEventListener('pinPlaced', (event) => {
            console.log('pinPlaced event received, handling pin placement');
            this._handlePinPlaced(event.detail.x, event.detail.y);
        });
        
        document.addEventListener('continueFindPlace', () => {
            console.log('continueFindPlace event received, continuing to next round');
            this._startNextFindPlaceRound();
        });
        
        // Écouter l'événement de basculement du mode épingle
        document.addEventListener('togglePinMode', () => {
            console.log('togglePinMode event received');
            if (this.currentGameMode === 'findPlace') {
                // Basculer le mode épingle dans la vue du canevas
                this.canvasView.togglePinMode();
                
                // Mettre à jour l'état du bouton pour correspondre
                this._updatePinModeButtonState();
            }
        });
        
        // Écouter l'événement de sauvegarde du score
        document.addEventListener('saveScore', (event) => {
            console.log('saveScore event received', event.detail);
            this._saveScore(event.detail.ign, event.detail.score);
        });
        
        // Écouter l'événement d'affichage des meilleurs scores
        document.addEventListener('showHighScores', () => {
            console.log('showHighScores event received');
            this._showHighScores();
        });
    }
    
    /**
     * Démarre un nouveau jeu Country Path
     */
    startGame() {
        this.isGameActive = true;
        this.currentGameMode = 'countryPath';
        this.canvasView.gameMode = 'countryPath';
        
        // S'assurer que la liste des chemins est visible pour ce mode de jeu
        if (this.menuView.pathList) {
            this.menuView.pathList.style.display = '';
        }
        
        // Masquer le menu et afficher l'interface utilisateur du jeu
        this.menuView.showMenu(false).showGameUI(true);
        
        // Réinitialiser les surlignages des pays
        this.model.resetCountryHighlights();
        
        // Obtenir une paire de pays aléatoire à partir de nos paires valides prédéfinies
        const countryPair = this.model.getRandomCountryPair();
        if (!countryPair) {
            console.error("Could not generate a valid country pair");
            return;
        }
        
        // Définir les pays de départ et d'arrivée
        this.startCountry = countryPair.start;
        this.endCountry = countryPair.end;
        
        console.log(`Starting new Country Path game: ${this.startCountry} to ${this.endCountry}`);
        
        // Marquer les pays comme départ/arrivée
        this.model.setCountryEndpoint(this.startCountry, 'start');
        this.model.setCountryEndpoint(this.endCountry, 'end');
        
        // Mettre à jour l'interface utilisateur avec les noms des pays
        this.menuView.updateGameInfo(this.startCountry, this.endCountry);
        
        // Réinitialiser l'état du jeu
        this.currentPath = [this.startCountry];
        this.gameStats = {
            moves: 0,
            errors: 0,
            startTime: Date.now(),
            endTime: null
        };
        
        // Surligner le pays de départ sur la carte
        this.model.setCountryHighlight(this.startCountry, true);
        
        // Mettre à jour la vue de la carte
        this.canvasView.renderMap(this.model.getAllCountriesForRendering());
        
        // Ajouter le pays de départ à la liste des chemins
        this.menuView.clearPath().addToPath(this.startCountry, 'correct');
        
        // Définir le placeholder de l'entrée
        if (this.menuView.countryInput) {
            this.menuView.countryInput.placeholder = 'Type an adjacent country name';
        }
        
        // Mettre le focus sur l'entrée
        this.menuView.clearInput();
    }
    
    /**
     * Gère la saisie du pays par l'utilisateur
     * @param {string} countryName - Nom du pays saisi par l'utilisateur
     * @param {string} gameMode - Mode de jeu actuel
     */
    handleCountryInput(countryName, gameMode) {
        if (!this.isGameActive) return;
        
        // Effacer le champ de saisie pour la prochaine entrée
        this.menuView.clearInput();
        
        // Stocker l'entrée d'origine pour le débogage
        const originalInput = countryName;
        
        // Normaliser l'entrée et valider
        countryName = this._normalizeCountryName(countryName);
        console.log(`Input: "${originalInput}" normalized to "${countryName}"`);
        
        // Obtenir le mode de jeu actuel s'il n'est pas explicitement transmis
        gameMode = gameMode || this.currentGameMode;
        console.log(`Current game mode: ${gameMode}`);
        
        // Utiliser une gestion différente pour le mode Name Them All
        if (gameMode === 'nameThemAll') {
            this._handleNameThemAllInput(originalInput); // Transmettre l'entrée d'origine pour "Name Them All"
            return;
        }
        
        // Pour le mode Country Path, vérifier si le pays existe dans nos données
        const country = this.model.getCountryByName(countryName);
        if (!country) {
            this._handleInvalidInput(countryName, 'not-found');
            return;
        }
        
        // Gérer l'entrée Country Path
        this._handleCountryPathInput(countryName);
    }
    
    /**
     * Gère la saisie du pays pour le mode de jeu Country Path
     * @param {string} countryName - Nom du pays saisi par l'utilisateur
     * @private
     */
    _handleCountryPathInput(countryName) {
        // Vérifier si le pays est déjà dans le chemin
        if (this.currentPath.includes(countryName)) {
            this._handleInvalidInput(countryName, 'already-used');
            return;
        }
        
        // Obtenir le dernier pays du chemin actuel
        const lastCountry = this.currentPath[this.currentPath.length - 1];
        
        // Vérifier si le nouveau pays est adjacent au dernier en utilisant nos données JSON d'adjacence
        if (!this.model.isAdjacent(lastCountry, countryName)) {
            this._handleInvalidInput(countryName, 'not-adjacent');
            return;
        }
        
        // Déplacement valide - ajouter le pays au chemin
        this.currentPath.push(countryName);
        this.gameStats.moves++;
        
        // Ajouter à la liste des chemins de l'interface utilisateur
        this.menuView.addToPath(countryName, 'correct');
        
        // Surligner le pays sur la carte
        this.model.setCountryHighlight(countryName, true);
        this.canvasView.renderMap(this.model.getAllCountriesForRendering());
        
        // Vérifier si le joueur a atteint la destination
        if (countryName === this.endCountry) {
            this._handleVictory();
        }
    }
    
    /**
     * Gère la saisie du pays pour le mode de jeu Name Them All
     * @param {string} countryName - Nom du pays saisi par l'utilisateur
     * @private
     */
    _handleNameThemAllInput(countryName) {
        console.log(`Handling input for "Name Them All": "${countryName}"`);
        console.log(`Current region: ${this.selectedRegion}`);
        
        // Normaliser le nom du pays pour améliorer la correspondance
        const normalizedCountryName = this._normalizeCountryName(countryName);
        console.log(`Normalized country name: ${normalizedCountryName}`);
        
        console.log(`Countries in current region:`, this.model.getCurrentRegionCountries());
        
        // Vérifier si le pays est dans la région actuelle
        const isInRegion = this.model.isCountryInCurrentRegion(normalizedCountryName);
        console.log(`Is ${normalizedCountryName} in region? ${isInRegion}`);
        
        if (!isInRegion) {
            // Vérifier si le pays existe du tout
            const country = this.model.getCountryByName(normalizedCountryName);
            if (country) {
                console.log(`Country ${normalizedCountryName} exists but not in region ${this.selectedRegion}`);
            } else {
                console.log(`Country ${normalizedCountryName} does not exist in data`);
            }
            
            this._handleInvalidInput(normalizedCountryName, 'not-in-region');
            return;
        }
        
        // Vérifier si le pays a déjà été nommé
        if (this.namedCountries.has(normalizedCountryName)) {
            console.log(`Country ${normalizedCountryName} already named`);
            this._handleInvalidInput(normalizedCountryName, 'already-named');
            return;
        }
        
        // Pays valide - le marquer comme nommé
        console.log(`Marking ${normalizedCountryName} as named`);
        this.namedCountries.add(normalizedCountryName);
        this.model.markCountryNamed(normalizedCountryName);
        
        // Mettre à jour l'interface utilisateur avec la progression
        const counts = this.model.getRemainingCountsForRegion();
        this.menuView.updateNameThemAllUI(this.selectedRegion, counts.named, counts.total);
        
        // Mettre à jour la carte
        this.canvasView.renderMap(this.model.getAllCountriesForRendering());
        
        // Vérifier si tous les pays ont été nommés
        if (this.model.areAllCountriesNamed()) {
            this._handleNameThemAllVictory();
        }
    }
    
    /**
     * Gère la saisie invalide d'un pays
     * @param {string} countryName - Nom du pays saisi
     * @param {string} reason - Raison de la saisie invalide ('not-found', 'already-used', 'not-adjacent', etc.)
     * @private
     */
    _handleInvalidInput(countryName, reason) {
        this.gameStats.errors++;
        
        // Afficher l'erreur dans l'interface utilisateur
        let errorMessage = '';
        
        switch (reason) {
            case 'not-found':
                errorMessage = 'Country not found';
                break;
            case 'already-used':
                errorMessage = 'Already in path';
                break;
            case 'not-adjacent':
                errorMessage = 'Not adjacent';
                break;
            case 'not-in-region':
                errorMessage = 'Not in this region';
                break;
            case 'already-named':
                errorMessage = 'Already named';
                break;
            default:
                errorMessage = 'Invalid input';
        }
        
        // Affichage d'erreur différent pour différents modes de jeu
        if (this.currentGameMode === 'nameThemAll') {
            // Pour "Name Them All", afficher simplement une erreur flash dans le champ de saisie
            this.menuView.clearInput();
            
            // Afficher l'erreur pendant un bref instant comme placeholder
            this.menuView.countryInput.placeholder = `${errorMessage} - Try again`;
            setTimeout(() => {
                if (this.menuView.countryInput) {
                    this.menuView.countryInput.placeholder = 'Type a country name in this region';
                }
            }, 1500);
        } else {
            // Pour Country Path, ajouter à la liste des chemins
            this.menuView.addToPath(`${countryName} - ${errorMessage}`, 'error');
        }
    }
    
    /**
     * Affiche l'interface de sélection de région pour le jeu "Name Them All"
     */
    showRegionSelection() {
        console.log('showRegionSelection called');
        
        // Obtenir les régions disponibles à partir du modèle
        const regions = this.model.getAvailableRegions();
        console.log('Available regions:', regions);
        
        // Afficher l'interface de sélection de région
        this.menuView.showMenu(false).showRegionSelection(regions, (region) => {
            console.log('Region selected:', region);
            this.startNameThemAllGame(region);
        });
    }
    
    /**
     * Démarre un nouveau jeu "Name Them All" pour la région sélectionnée
     * @param {string} region - La région sélectionnée
     */
    startNameThemAllGame(region) {
        console.log(`Starting "Name Them All" game for region: ${region}`);
        
        // Définir l'état du jeu
        this.isGameActive = true;
        this.currentGameMode = 'nameThemAll';
        this.selectedRegion = region;
        
        // Définir la région dans le modèle
        const regionSet = this.model.setRegion(region);
        if (!regionSet) {
            console.error(`Failed to set region ${region} in model`);
            // Essayer quelques alternatives
            if (region === 'Europe' && this.model.regionCountries.has('Europe')) {
                console.log('Attempting to manually set region to Europe');
                this.model.currentRegion = 'Europe';
            }
        }
        
        // Double-vérifier que la région a été définie
        console.log(`Current region in model: ${this.model.currentRegion}`);
        
        // Vérifier les pays disponibles dans cette région
        const regionCountries = this.model.getCurrentRegionCountries();
        console.log(`Countries in ${region} (${regionCountries.length}):`, regionCountries);
        
        // Mettre à jour le mode de jeu de la vue du canevas
        this.canvasView.gameMode = 'nameThemAll';
        
        // Effacer les pays nommés
        this.namedCountries.clear();
        this.model.resetNamedCountries();
        
        // Réinitialiser les surlignages des pays
        this.model.resetCountryHighlights();
        
        // Afficher l'interface utilisateur du jeu
        this.menuView.showNameThemAllUI();
        
        // Obtenir les comptes des pays pour cette région
        const counts = this.model.getRemainingCountsForRegion();
        
        // Mettre à jour l'interface utilisateur avec la progression
        this.menuView.updateNameThemAllUI(region, counts.named, counts.total);
        
        // Mettre à jour la carte
        this.canvasView.renderMap(this.model.getAllCountriesForRendering());
        
        console.log(`"Name Them All" game ready for region: ${region} with ${counts.total} countries`);
    }
    
    /**
     * Gère la victoire pour le jeu "Name Them All"
     * @private
     */
    _handleNameThemAllVictory() {
        this.isGameActive = false;
        
        // Obtenir les statistiques finales
        const counts = this.model.getRemainingCountsForRegion();
        
        // Afficher le message de victoire
        this.menuView.showVictory('nameThemAll', {
            named: counts.named,
            total: counts.total
        });
        
        console.log(`"Name Them All" game completed for ${this.selectedRegion} region with ${counts.named}/${counts.total} countries named`);
    }
    
    /**
     * Gère la condition de victoire pour le jeu Country Path
     * @private
     */
    _handleVictory() {
        this.isGameActive = false;
        this.gameStats.endTime = Date.now();
        
        // Calculer le temps pris
        const timeTaken = (this.gameStats.endTime - this.gameStats.startTime) / 1000;
        
        // Enregistrer les statistiques du jeu
        console.log(`Country Path game completed in ${timeTaken} seconds with ${this.gameStats.moves} moves and ${this.gameStats.errors} errors`);
        
        // Afficher le message de victoire
        this.menuView.showVictory('countryPath');
    }
    
    /**
     * Démarre le jeu "Find the Place"
     */
    async startFindPlaceGame() {
        // Initialiser le jeu Find the Place
        this.isGameActive = true;
        this.currentGameMode = 'findPlace';
        this.canvasView.gameMode = 'findPlace';
        
        // Créer ImageView s'il n'existe pas
        if (!this.imageView) {
            this.imageView = new ImageView('imageContainer');
        }
        
        // Charger les données des lieux
        const dataLoaded = await this.placeFinderModel.loadPlacesData();
        if (!dataLoaded) {
            console.error("Could not load places data");
            alert('Error loading places data. Please try again.');
            return;
        }
        
        // Réinitialiser le modèle du jeu
        this.placeFinderModel.resetGame();
        
        // Masquer le menu et afficher l'interface utilisateur du jeu
        this.menuView.showMenu(false);
        
        // Démarrer la première manche
        this._startNextFindPlaceRound();
    }
    
    /**
     * Démarre la prochaine manche du jeu Find the Place
     * @private
     */
    _startNextFindPlaceRound() {
        console.log("Starting next Find the Place round");
        
        // Obtenir le prochain lieu
        const currentPlace = this.placeFinderModel.startNewRound();
        
        // Vérifier si le jeu est terminé
        if (!currentPlace) {
            console.log("Game is complete - no more places available");
            this._handleFindPlaceGameComplete();
            return;
        }
        
        console.log("Current place:", currentPlace.name);
        
        // Afficher l'image du lieu
        const gameState = this.placeFinderModel.getGameState();
        this.imageView.showImage(currentPlace, gameState.currentRound, gameState.totalRounds);
        
        // Mettre à jour l'interface utilisateur
        this.menuView.showFindPlaceUI(gameState.currentRound, gameState.totalRounds);
        
        // Activer le placement de l'épingle sur la carte
        console.log("Enabling pin placement");
        this.canvasView.enablePinPlacement();
        console.log("Pin placement enabled:", this.canvasView.isPlacingPin);
        
        // Réinitialiser les épingles existantes
        this.canvasView.resetPins();
        
        // Mettre à jour l'état du bouton de mode épingle pour correspondre à l'état de la vue du canevas
        this._updatePinModeButtonState();
    }
    
    /**
     * Met à jour l'état du bouton de mode épingle pour refléter l'état de la vue du canevas
     * @private 
     */
    _updatePinModeButtonState() {
        const pinModeBtn = document.getElementById('pinModeToggle');
        if (pinModeBtn) {
            console.log("Updating pin mode button state:", this.canvasView.isPinMode);
            if (this.canvasView.isPinMode) {
                pinModeBtn.classList.add('active');
                pinModeBtn.textContent = 'Pin Mode Active';
            } else {
                pinModeBtn.classList.remove('active');
                pinModeBtn.textContent = 'Toggle Pin Mode';
            }
        }
    }
    
    /**
     * Gère le placement de l'épingle pour le jeu Find the Place
     * @param {number} x - Coordonnée X sur la carte
     * @param {number} y - Coordonnée Y sur la carte
     * @private
     */
    _handlePinPlaced(x, y) {
        console.log("_handlePinPlaced called with coordinates:", x, y);
        
        // Obtenir les dimensions réelles de la carte pré-rendue
        const mapCanvas = this.canvasView.hitCanvas || this.canvasView.preRenderedMap;
        const mapWidth = parseFloat(this.canvasView.canvas.dataset.mapWidth || (mapCanvas ? mapCanvas.width : 4000));
        const mapHeight = parseFloat(this.canvasView.canvas.dataset.mapHeight || (mapCanvas ? mapCanvas.height : 2000));
        
        // Enregistrer les coordonnées détaillées pour le débogage et faciliter le copier-coller
        console.log(`
=========== MAP POSITION DEBUG ===========
CLICK COORDINATES:
  Canvas X,Y: ${x}, ${y}
  
SUGGESTED JSON FORMAT:
{
  "x": ${Math.round(x)},
  "y": ${Math.round(y)}
}
=========================================
        `);
        
        // Enregistrer la tentative et obtenir les résultats en utilisant les coordonnées directes du canevas
        const result = this.placeFinderModel.recordPlayerGuess(x, y);
        
        if (!result) {
            console.error("Failed to record guess");
            return;
        }
        
        console.log("Guess recorded:", result);
        
        // Obtenir les données du lieu actuel
        const currentPlace = this.placeFinderModel.currentPlace;
        console.log("Actual place coordinates:", currentPlace.coordinates);
        
        // Utiliser les coordonnées réelles directement à partir des données du lieu
        const actualPoint = {
            x: currentPlace.coordinates.x,
            y: currentPlace.coordinates.y
        };
        
        console.log("Actual location point on canvas:", actualPoint.x, actualPoint.y);
        
        // Définir l'épingle réelle sur la carte
        this.canvasView.setActualPin(actualPoint.x, actualPoint.y);
        
        // Mettre à jour la vue de l'image avec les résultats
        this.imageView.showResult(currentPlace, result);
        
        // Mettre à jour la vue du menu avec le score
        this.menuView.updateFindPlaceUI(result);
    }
    
    /**
     * Gère la fin du jeu Find the Place
     * @private
     */
    _handleFindPlaceGameComplete() {
        // Obtenir l'état final du jeu
        const gameState = this.placeFinderModel.getGameState();
        
        // Afficher les résultats finaux
        this.imageView.showFinalResults(gameState);
        
        // Terminer le jeu
        this.isGameActive = false;
    }
    
    /**
     * Réinitialise le jeu actuel
     */
    resetGame() {
        // Réinitialiser l'état commun du jeu
        this.isGameActive = false;
        
        // Réinitialiser en fonction du mode de jeu
        if (this.currentGameMode === 'nameThemAll') {
            // Réinitialiser l'état du jeu Name Them All
            this.selectedRegion = null;
            this.namedCountries.clear();
            this.model.resetNamedCountries();
            
            // Réinitialiser l'affichage de la liste des chemins (restaurer si masqué)
            if (this.menuView.pathList) {
                this.menuView.pathList.style.display = '';
            }
        } else if (this.currentGameMode === 'findPlace') {
            // Réinitialiser l'état du jeu Find the Place
            this.placeFinderModel.resetGame();
            
            // Masquer la vue de l'image
            if (this.imageView) {
                this.imageView.hide();
            }
            
            // Réinitialiser les épingles et le mode épingle
            this.canvasView.togglePinMode(false);
            this.canvasView.resetPins();
            
            // Supprimer tous les éléments d'interface utilisateur spécifiques à Find the Place
            const instruction = document.getElementById('findPlaceInstruction');
            if (instruction) {
                instruction.remove();
            }
            
            const continueButton = document.getElementById('continueButton');
            if (continueButton) {
                continueButton.remove();
            }
            
            const pinModeToggle = document.getElementById('pinModeToggle');
            if (pinModeToggle) {
                pinModeToggle.remove();
            }
            
            // Afficher à nouveau la saisie du pays si elle était masquée
            if (this.menuView.countryInput) {
                this.menuView.countryInput.style.display = '';
            }
        } else {
            // Réinitialiser l'état du jeu Country Path
            this.startCountry = null;
            this.endCountry = null;
            this.currentPath = [];
            
            // Réinitialiser l'interface utilisateur spécifique à Country Path
            this.menuView.clearPath();
        }
        
        // Réinitialiser au mode de jeu par défaut
        this.currentGameMode = 'countryPath';
        this.canvasView.gameMode = 'countryPath';
        
        // Réinitialiser l'interface utilisateur
        this.menuView.showGameUI(false).showMenu(true);
        
        // Réinitialiser les surlignages des pays sur la carte
        this.model.resetCountryHighlights();
        
        // Mettre à jour la vue de la carte
        this.canvasView.renderMap(this.model.getAllCountriesForRendering());
    }
    
    /**
     * Enregistre le score du joueur avec son IGN dans localStorage
     * @param {string} ign - Nom en jeu du joueur
     * @param {number} score - Score du joueur
     * @private
     */
    _saveScore(ign, score) {
        if (!ign || !score) {
            console.error('Invalid score data', { ign, score });
            return;
        }
        
        try {
            // Obtenir les scores existants de localStorage ou initialiser un tableau vide
            let highScores = JSON.parse(localStorage.getItem('findPlaceHighScores') || '[]');
            
            // Ajouter le nouveau score
            highScores.push({
                ign: ign,
                score: score,
                date: new Date().toISOString()
            });
            
            // Trier par score (le plus élevé en premier)
            highScores.sort((a, b) => b.score - a.score);
            
            // Limiter aux 10 meilleurs scores
            highScores = highScores.slice(0, 10);
            
            // Enregistrer à nouveau dans localStorage
            localStorage.setItem('findPlaceHighScores', JSON.stringify(highScores));
            
            console.log('Score saved successfully', { ign, score });
        } catch (error) {
            console.error('Error saving score', error);
        }
    }
    
    /**
     * Affiche la modale des meilleurs scores
     * @private
     */
    _showHighScores() {
        try {
            // Obtenir les meilleurs scores de localStorage
            const highScores = JSON.parse(localStorage.getItem('findPlaceHighScores') || '[]');
            console.log('Retrieved high scores', highScores);
            
            // Afficher les meilleurs scores dans la vue du menu
            this.menuView.showHighScores(highScores);
        } catch (error) {
            console.error('Error showing high scores', error);
            this.menuView.showHighScores([]);
        }
    }
    
    /**
     * Normalise le nom du pays pour une comparaison insensible à la casse
     * @param {string} name - Nom du pays à normaliser
     * @returns {string} - Nom du pays normalisé
     * @private
     */
    _normalizeCountryName(name) {
        if (!name) return '';
        
        // Normalisation de base - supprimer les espaces et mettre en majuscule la première lettre de chaque mot
        const trimmed = name.trim();
        return trimmed
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
}