export default class PlaceFinderModel {
    constructor() {
        this.places = [];
        this.currentPlace = null;
        this.currentRound = 0;
        this.totalRounds = 3;
        this.playerPins = []; // Stocker les coordonnées de la tentative du joueur
        this.scores = []; // Stocker les scores pour chaque manche
        this.maxDistance = 3000; // Distance maximale en km pour le score (ajuste la plage de score)
    }

    /**
     * Charger les données des lieux à partir du fichier JSON
     * @returns {Promise<boolean>} - Vrai si les données ont été chargées avec succès
     */
    async loadPlacesData() {
        try {
            const response = await fetch('data/places.json');
            if (!response.ok) {
                throw new Error(`Places data fetch failed: ${response.status}`);
            }
            
            const placesData = await response.json();
            
            if (placesData && placesData.places) {
                this.places = placesData.places;
                console.log(`Loaded ${this.places.length} places`);
                return true;
            } else {
                throw new Error('Invalid places data format');
            }
        } catch (error) {
            console.error("Error loading places data:", error);
            // Créer des lieux de secours si nécessaire
            this._createFallbackPlaces();
            return this.places.length > 0;
        }
    }

    /**
     * Créer des données de lieux de secours si le chargement échoue
     * @private
     */
    _createFallbackPlaces() {
        // Lieu par défaut codé en dur (Taj Mahal)
        this.places = [
            {
                name: "Taj Mahal",
                description: "Iconic marble mausoleum in Agra, India",
                image: "images/tajmahal.webp",
                coordinates: {
                    latitude: 27.1751,
                    longitude: 78.0421
                }
            }
        ];
        console.warn("Using fallback places data");
    }

    /**
     * Démarrer une nouvelle manche de jeu
     * @returns {Object|null} - Données du lieu actuel ou null si le jeu est terminé
     */
    startNewRound() {
        // Réinitialiser l'état de la manche actuelle
        this.currentPlace = null;
        
        // Vérifier si nous avons terminé toutes les manches
        if (this.currentRound >= this.totalRounds) {
            return null; // Jeu terminé
        }
        
        // Sélectionner un lieu aléatoire qui n'a pas encore été utilisé
        const availablePlaces = this.places.filter(place => 
            !this.playerPins.some(pin => pin.placeName === place.name)
        );
        
        if (availablePlaces.length === 0) {
            // Si nous avons utilisé tous les lieux, le jeu est terminé
            return null;
        }
        
        // Sélectionner un lieu aléatoire
        const randomIndex = Math.floor(Math.random() * availablePlaces.length);
        this.currentPlace = availablePlaces[randomIndex];
        
        // Incrémenter le compteur de manches
        this.currentRound++;
        
        return this.currentPlace;
    }

    /**
     * Enregistrer le placement de l'épingle du joueur pour la manche actuelle
     * @param {number} x - Coordonnée X de la tentative du joueur sur le canevas
     * @param {number} y - Coordonnée Y de la tentative du joueur sur le canevas
     * @returns {Object} - Informations sur le score et la distance
     */
    recordPlayerGuess(x, y) {
        if (!this.currentPlace) {
            return null;
        }
        
        // Obtenir les coordonnées réelles du lieu actuel
        const actualX = this.currentPlace.coordinates.x;
        const actualY = this.currentPlace.coordinates.y;
        
        // Calculer la distance entre la tentative du joueur et l'emplacement réel sur le canevas
        const distance = this._calculateCanvasDistance(
            x, y,
            actualX, 
            actualY
        );
        
        // Calculer le score (0-1000 en fonction de la distance)
        const score = this._calculateScore(distance);
        
        // Stocker l'épingle et le score
        const pin = {
            placeName: this.currentPlace.name,
            playerCoordinates: { x, y },
            actualCoordinates: { ...this.currentPlace.coordinates },
            distance,
            score,
            round: this.currentRound
        };
        
        this.playerPins.push(pin);
        this.scores.push(score);
        
        return pin;
    }

    /**
     * Calculer la distance entre deux points sur le canevas (en utilisant la distance euclidienne)
     * @param {number} x1 - Coordonnée x du premier point
     * @param {number} y1 - Coordonnée y du premier point
     * @param {number} x2 - Coordonnée x du deuxième point
     * @param {number} y2 - Coordonnée y du deuxième point
     * @returns {number} - Distance en pixels (mise à l'échelle pour approximer les km à des fins de jeu)
     * @private
     */
    _calculateCanvasDistance(x1, y1, x2, y2) {
        // Calculer la distance euclidienne
        const distanceInPixels = Math.sqrt(
            Math.pow(x2 - x1, 2) + 
            Math.pow(y2 - y1, 2)
        );
        
        // Mettre à l'échelle la distance pour approximer les kilomètres à des fins de score
        // Ce facteur d'échelle peut être ajusté pour rendre le jeu plus ou moins difficile
        const scalingFactor = 2.5; // Facteur de conversion pixels en km
        
        return distanceInPixels * scalingFactor;
    }

    /**
     * Calculer le score en fonction de la distance
     * @param {number} distance - Distance en pixels (mise à l'échelle en km)
     * @returns {number} - Score (0-1000)
     * @private
     */
    _calculateScore(distance) {
        // Fonction de score à décroissance exponentielle - les tentatives plus proches rapportent beaucoup plus de points
        // Score = 1000 * e^(-distance/maxDistance)
        const score = 1000 * Math.exp(-distance / this.maxDistance);
        
        // Arrondir à l'entier le plus proche
        return Math.round(score);
    }

    /**
     * Obtenir l'état actuel du jeu
     * @returns {Object} - Informations sur l'état du jeu
     */
    getGameState() {
        return {
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            scores: this.scores,
            totalScore: this.scores.reduce((sum, score) => sum + score, 0),
            pins: this.playerPins,
            complete: this.currentRound >= this.totalRounds
        };
    }

    /**
     * Réinitialiser le jeu
     */
    resetGame() {
        this.currentPlace = null;
        this.currentRound = 0;
        this.playerPins = [];
        this.scores = [];
    }
}