export default class CanvasView {
    constructor(canvasId, tooltipId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.tooltip = document.getElementById(tooltipId);
        this.tooltipText = document.getElementById('tooltipText');
        
        // État du rendu de la carte
        this.zoomLevel = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.baseScale = 1.0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Carte pré-rendue
        this.preRenderedMap = null;
        this.countryHitMap = new Map(); // Carte pour le test de positionnement (hit testing)
        
        // Couleurs - Style pixel art
        this.defaultFill = '#55d6c2'; // Couleur par défaut des pays
        this.highlightFill = '#ff6b6b'; // Couleur pour les pays en surbrillance
        this.startEndFill = '#55d688'; // Couleur pour les pays de départ/arrivée
        this.hoverFill = '#ffcc66'; // Couleur pour les pays survolés
        this.namedFill = '#ffcc00'; // Couleur jaune pour les pays nommés dans "Nommez-les tous"
        this.pinFill = '#ff3333'; // Couleur rouge pour les épingles dans "Find the places"
        this.actualPinFill = '#33cc33'; // Couleur verte pour les épingles de localisation réelles
        
        // Mode de jeu
        this.gameMode = 'countryPath'; // Mode de jeu par défaut
        
        // État du jeu "Find the places"
        this.isPlacingPin = false;
        this.isPinMode = false; // Indique si le mode épingle est actif (désactive la saisie)
        this.playerPin = null;
        this.actualPin = null;
        this.pinRadius = 8; // Taille des épingles
        
        // Initialiser les écouteurs d'événements
        this._initEventListeners();
        
        // Définir la taille initiale du canevas
        this._resizeCanvas();
    }
    
    /**
     * Initialise les écouteurs d'événements du canevas
     * @private
     */
    _initEventListeners() {
        // Gérer le redimensionnement de la fenêtre
        window.addEventListener('resize', () => this._resizeCanvas());
        
        // Gérer l'effet de survol/infobulle
        this.canvas.addEventListener('mousemove', (event) => this._handleCanvasMouseMove(event));
        
        // Gérer le zoom
        this.canvas.addEventListener('wheel', (event) => this._handleWheelZoom(event), { passive: false });
        
        // Gérer le panoramique
        this.canvas.addEventListener('mousedown', (event) => this._handleMouseDown(event));
        this.canvas.addEventListener('mouseup', (event) => {
            console.log("mouseup event", {
                gameMode: this.gameMode,
                isPlacingPin: this.isPlacingPin,
                isPinMode: this.isPinMode,
                isDragging: this.isDragging
            });
            
            // En mode épingle, nous gérons toujours le clic
            // En mode normal, gérer uniquement si pas en train de glisser
            if (this.gameMode === 'findPlace' && this.isPlacingPin) {
                if (this.isPinMode || !this.isDragging) {
                    console.log("Calling _handleMapClick from mouseup");
                    this._handleMapClick(event);
                } else {
                    console.log("Not calling _handleMapClick - dragging and not in pin mode");
                }
            } else {
                console.log("Not calling _handleMapClick - not in Find the Place mode or pin placement not enabled");
            }
            
            // Regular mouse up handling
            this._handleMouseUp();
        });
        this.canvas.addEventListener('mouseleave', () => this._handleMouseUp());
    }
    
    /**
     * Gère le clic sur la carte pour le placement des épingles
     * @param {MouseEvent} event - Événement de la souris
     * @private
     */
    _handleMapClick(event) {
        console.log("_handleMapClick called");
        console.log("isPlacingPin:", this.isPlacingPin);
        console.log("isDragging:", this.isDragging);
        console.log("isPinMode:", this.isPinMode);
        
        // En mode épingle, nous autorisons toujours le placement, sinon vérifiez si nous ne glissons pas
        if (!this.isPlacingPin || (!this.isPinMode && this.isDragging)) {
            console.log("Early return - pin placement not allowed");
            return;
        }
        
        // Obtenir la position de la souris en coordonnées du canevas
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        console.log("Canvas coordinates:", x, y);
        
        // Convertir en coordonnées de la carte
        const mapCoords = this._screenToMapCoords(x, y);
        console.log("Map coordinates:", mapCoords.x, mapCoords.y);
        
        // Définir l'épingle du joueur
        this.playerPin = {
            x: mapCoords.x,
            y: mapCoords.y
        };
        
        // Envoyer l'événement pinPlaced
        const pinEvent = new CustomEvent('pinPlaced', { 
            detail: { x: mapCoords.x, y: mapCoords.y }
        });
        console.log("Dispatching pinPlaced event with coordinates:", mapCoords.x, mapCoords.y);
        document.dispatchEvent(pinEvent);
        
        // Désactiver le placement d'épingles supplémentaires pour ce tour
        this.isPlacingPin = false;
        
        // Redessiner la carte avec l'épingle
        this.redraw();
    }
    
    /**
     * Redimensionne le canevas pour correspondre à la taille du conteneur avec prise en charge haute résolution (High-DPI)
     * @private
     */
    _resizeCanvas() {
        // Obtenir le ratio de pixels de l'appareil
        const dpr = window.devicePixelRatio || 1;
        
        // Obtenir le rectangle du conteneur
        const rect = this.canvas.parentElement.getBoundingClientRect();
        
        // Définir les dimensions CSS
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Définir les attributs du canevas pour correspondre à sa taille CSS × ratio de pixels de l'appareil
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Mettre à l'échelle le contexte pour conserver la même taille visuelle
        this.ctx.scale(dpr, dpr);
        
        // Stocker le DPI pour que d'autres fonctions puissent l'utiliser
        this.canvas.dataset.dpr = dpr;
        
        // Redessiner la carte
        this.redraw();
    }
    
    /**
     * Gère le mouvement de la souris sur le canevas
     * Affiche l'infobulle du nom du pays au survol
     * Gère le panoramique lors du glissement
     * @param {MouseEvent} event - Événement de la souris
     * @private
     */
    _handleCanvasMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        
        // Obtenir la position de la souris en coordonnées du canevas
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Gérer le panoramique (uniquement si pas en mode épingle)
        if (this.isDragging && !(this.isPinMode && this.gameMode === 'findPlace')) {
            const dx = event.clientX - this.lastMouseX;
            const dy = event.clientY - this.lastMouseY;
            this.offsetX += dx;
            this.offsetY += dy;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            this.redraw(); // Redessiner pendant le panoramique
        } else {
            // Mettre à jour l'infobulle uniquement si pas en panoramique
            this._updateTooltip(x, y, event.clientX, event.clientY);
        }
    }
    
    /**
     * Met à jour l'infobulle en fonction de la position de la souris
     * @param {number} canvasX - Position X dans le canevas
     * @param {number} canvasY - Position Y dans le canevas
     * @param {number} clientX - Position X en coordonnées client
     * @param {number} clientY - Position Y en coordonnées client
     * @private
     */
    _updateTooltip(canvasX, canvasY, clientX, clientY) {
        // Mettre à jour la position de l'infobulle
        this.tooltip.style.top = clientY - 40 + 'px';
        this.tooltip.style.left = clientX + 10 + 'px';
        
        // Convertir en coordonnées de la carte
        const mapCoords = this._screenToMapCoords(canvasX, canvasY);
        
        // Trouver sur quel pays la souris se trouve et son état de sélection
        const hoveredCountryInfo = this._getHoveredCountryInfo(mapCoords.x, mapCoords.y);
        
        // Mettre à jour l'affichage de l'infobulle
        if (hoveredCountryInfo) {
            this.tooltip.style.opacity = 1;
            
            // Si en mode jeu et que le pays n'est pas encore découvert, afficher "?" au lieu du nom
            if ((this.gameMode === 'nameThemAll' && !hoveredCountryInfo.selected) || 
                (this.gameMode === 'countryPath' && !hoveredCountryInfo.isEndpoint && !hoveredCountryInfo.selected)) {
                this.tooltipText.innerText = "?";
            } else {
                this.tooltipText.innerText = hoveredCountryInfo.name;
            }
        } else {
            this.tooltip.style.opacity = 0;
        }
    }
    
    /**
     * Convertit les coordonnées de l'écran en coordonnées de la carte
     * @param {number} screenX - Position X en coordonnées de l'écran
     * @param {number} screenY - Position Y en coordonnées de l'écran
     * @returns {Object} - Objet avec les coordonnées x et y de la carte
     * @private
     */
    _screenToMapCoords(screenX, screenY) {
        console.log("Converting screen coords to map coords:", { screenX, screenY });
        
        // Obtenir l'échelle et le décalage actuels
        const currentScale = this.baseScale * this.zoomLevel;
        
        // Transformation inverse : écran -> carte
        const mapX = (screenX - this.offsetX) / currentScale;
        const mapY = (screenY - this.offsetY) / currentScale;
        
        console.log("Map coordinates:", { mapX, mapY });
        return { x: mapX, y: mapY };
    }
    
    /**
     * Obtient le pays et son état à un point donné en utilisant la carte de positionnement (hit map)
     * @param {number} x - Coordonnée X sur la carte
     * @param {number} y - Coordonnée Y sur la carte
     * @returns {Object|null} - Informations sur le pays ou null si aucun n'est trouvé
     * @private
     */
    _getHoveredCountryInfo(x, y) {
        // Vérifier si nous avons une carte de positionnement
        if (!this.hitCanvas) {
            return null;
        }
        
        // Obtenir le contexte de test de positionnement
        const hitCtx = this.hitCanvas.getContext('2d');
        
        // Vérifier si le point est à l'intérieur d'un pays
        try {
            // Obtenir les données de pixel à la position de la souris
            const pixel = hitCtx.getImageData(x, y, 1, 1).data;
            // Convertir la couleur du pixel en ID
            const colorKey = `${pixel[0]},${pixel[1]},${pixel[2]}`;
            
            // Rechercher le nom du pays par clé de couleur
            const countryName = this.countryHitMap.get(colorKey);
            
            if (!countryName) return null;
            
            // Rechercher l'état du pays dans la carte des pays
            const countryIndex = this.countryStateMap.get(countryName);
            
            if (countryIndex !== undefined) {
                return {
                    name: countryName,
                    selected: this.countriesState[countryIndex].selected,
                    isEndpoint: this.countriesState[countryIndex].isStart || this.countriesState[countryIndex].isEnd
                };
            }
            
            // Si nous n'avons pas d'informations sur l'état, retourner simplement le nom
            return { name: countryName, selected: false, isEndpoint: false };
        } catch (e) {
            // Cela se produit si le point est en dehors du canevas
            return null;
        }
    }
    
    /**
     * Obtient uniquement le nom du pays à un point donné (pour la compatibilité descendante)
     * @param {number} x - Coordonnée X sur la carte
     * @param {number} y - Coordonnée Y sur la carte
     * @returns {string|null} - Nom du pays ou null si aucun n'est trouvé
     * @private
     */
    _getHoveredCountry(x, y) {
        const info = this._getHoveredCountryInfo(x, y);
        return info ? info.name : null;
    }
    
    /**
     * Gère les événements de la molette de la souris pour le zoom
     * @param {WheelEvent} event - Événement de la molette
     * @private
     */
    _handleWheelZoom(event) {
        event.preventDefault();
        
        const zoomIntensity = 0.04;
        const maxZoom = 10.0;
        const minZoom = 0.5;
        
        // Obtenir la position de la souris par rapport au canevas
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Normaliser le delta de la molette pour une meilleure compatibilité entre navigateurs
        // Appliquer un facteur pour rendre le zoom plus cohérent
        const normalizedDelta = -Math.sign(event.deltaY) * 0.5; // Lisser le zoom
        
        // Calculer le nouveau niveau de zoom avec un facteur plus lisse
        const newZoomLevel = Math.max(
            minZoom, 
            Math.min(
                maxZoom, 
                this.zoomLevel * (1 + normalizedDelta * zoomIntensity)
            )
        );
        
        // Calculer le point sur la carte sous la souris avant le zoom
        const mapCoords = this._screenToMapCoords(mouseX, mouseY);
        
        // Mettre à jour les décalages pour maintenir le point sous la souris immobile
        this.offsetX = mouseX - mapCoords.x * this.baseScale * newZoomLevel;
        this.offsetY = mouseY - mapCoords.y * this.baseScale * newZoomLevel;
        
        // Mettre à jour le niveau de zoom
        this.zoomLevel = newZoomLevel;
        
        // Redessiner la carte
        this.redraw();
    }
    
    /**
     * Gère l'événement de clic de souris pour le panoramique ou le placement d'épingle
     * @param {MouseEvent} event - Événement de la souris
     * @private
     */
    _handleMouseDown(event) {
        // Si en mode épingle, ne pas activer le glissement
        if (this.isPinMode && this.gameMode === 'findPlace') {
            // En mode épingle, le clic gérera le placement dans l'événement mouseup
            return;
        }
        
        // Comportement de glissement normal
        this.isDragging = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        this.canvas.style.cursor = 'grabbing';
    }
    
    /**
     * Gère l'événement de relâchement du bouton de la souris pour le panoramique
     * @private
     */
    _handleMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }
    
    /**
     * Rend la carte sur le canevas, en gérant les pays avec plusieurs chemins
     * @param {Array} countries - Tableau d'objets pays avec plusieurs chemins
     */
    renderMap(countries) {
        if (!countries || countries.length === 0) {
            return;
        }
        
        // Obtenir le ratio de pixels de l'appareil
        const dpr = parseFloat(this.canvas.dataset.dpr || 1);
        
        // Pré-rendre la carte pour de meilleures performances
        const mapCanvas = document.createElement('canvas');
        mapCanvas.width = 4000; // Haute résolution pour la qualité
        mapCanvas.height = 2000;
        const mapCtx = mapCanvas.getContext('2d');
        
        // Définir ces dimensions dans le dataset pour les calculs de coordonnées
        this.canvas.dataset.mapWidth = mapCanvas.width;
        this.canvas.dataset.mapHeight = mapCanvas.height;
        
        // Créer un canevas pour le test de positionnement
        this.hitCanvas = document.createElement('canvas');
        this.hitCanvas.width = mapCanvas.width;
        this.hitCanvas.height = mapCanvas.height;
        const hitCtx = this.hitCanvas.getContext('2d');
        
        // Effacer la carte de positionnement
        this.countryHitMap = new Map();
        this.countryStateMap = new Map();
        this.countriesState = countries;
        
        // Activer la mise à l'échelle d'image de haute qualité
        mapCtx.imageSmoothingEnabled = true;
        mapCtx.imageSmoothingQuality = 'high';
        
        // Dessiner chaque pays
        countries.forEach((country, index) => {
            try {
                // Créer une couleur unique pour le test de positionnement en fonction de l'index
                const r = (index & 0xFF);
                const g = ((index >> 8) & 0xFF);
                const b = ((index >> 16) & 0xFF);
                const colorKey = `${r},${g},${b}`;
                
                // Stocker le nom du pays par clé de couleur pour le test de positionnement
                this.countryHitMap.set(colorKey, country.name);
                
                // Stocker l'index pour la recherche d'état
                this.countryStateMap.set(country.name, index);
                
                // Choisir la couleur de remplissage en fonction de l'état du pays et du mode de jeu
                if (this.gameMode === 'nameThemAll') {
                    // Pour le mode de jeu "Nommez-les tous", les pays nommés sont jaunes
                    if (country.selected) {
                        mapCtx.fillStyle = this.namedFill; // Jaune pour les pays correctement nommés
                    } else {
                        mapCtx.fillStyle = country.fill || this.defaultFill;
                    }
                } else {
                    // Pour le mode de jeu "Chemin des pays"
                    if (country.isStart) {
                        mapCtx.fillStyle = this.startEndFill;
                    } else if (country.isEnd) {
                        mapCtx.fillStyle = '#55d6c2'; // Couleur différente pour le pays d'arrivée
                    } else if (country.selected) {
                        mapCtx.fillStyle = this.highlightFill;
                    } else {
                        mapCtx.fillStyle = country.fill || this.defaultFill;
                    }
                }
                
                // Définir le style de trait
                mapCtx.strokeStyle = '#000000';
                mapCtx.lineWidth = 1.5;
                
                // Définir la couleur de test de positionnement
                hitCtx.fillStyle = `rgb(${r},${g},${b})`;
                
                // Dessiner tous les chemins pour ce pays
                if (country.paths && Array.isArray(country.paths)) {
                    country.paths.forEach(pathData => {
                        const path = new Path2D(pathData);
                        
                        // Dessiner sur la carte visible
                        mapCtx.fill(path);
                        mapCtx.stroke(path);
                        
                        // Dessiner sur le canevas de test de positionnement (pas besoin de trait)
                        hitCtx.fill(path);
                    });
                } else if (country.path) {
                    // Compatibilité descendante pour un seul chemin
                    const path = new Path2D(country.path);
                    mapCtx.fill(path);
                    mapCtx.stroke(path);
                    hitCtx.fill(path);
                }
            } catch (e) {
                console.error("Error drawing country:", country.name, e);
            }
        });
        
        // Stocker la carte pré-rendue
        this.preRenderedMap = mapCanvas;
        
        // Calculer l'échelle initiale si ce n'est pas déjà fait
        if (this.baseScale === 1.0) {
            const canvasWidth = this.canvas.width / dpr;
            const canvasHeight = this.canvas.height / dpr;
            
            this.baseScale = Math.min(
                canvasWidth / mapCanvas.width,
                canvasHeight / mapCanvas.height
            ) * 0.9; // 90% de l'espace disponible
            
            // Centrer la carte initialement
            this.offsetX = (canvasWidth - mapCanvas.width * this.baseScale) / 2;
            this.offsetY = (canvasHeight - mapCanvas.height * this.baseScale) / 2;
        }
        
        // Redessiner la carte sur le canevas principal
        this.redraw();
    }
    
    /**
     * Redessine la carte pré-rendue sur le canevas principal
     */
    redraw() {
        if (!this.preRenderedMap) {
            return;
        }
        
        // Obtenir le ratio de pixels de l'appareil
        const dpr = parseFloat(this.canvas.dataset.dpr || 1);
        
        // Effacer le canevas
        this.ctx.resetTransform(); // Réinitialiser toutes les transformations précédentes
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.scale(dpr, dpr); // Réappliquer la mise à l'échelle DPR
        
        // Obtenir les dimensions du canevas en pixels CSS
        const canvasWidth = this.canvas.width / dpr;
        const canvasHeight = this.canvas.height / dpr;
        
        // Définir l'arrière-plan de style pixel-art
        this.ctx.fillStyle = '#4a3a7a'; // Arrière-plan violet foncé du CSS
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Appliquer les transformations de zoom et de panoramique
        this.ctx.translate(this.offsetX, this.offsetY);
        const currentScale = this.baseScale * this.zoomLevel;
        
        // Activer la mise à l'échelle d'image de haute qualité
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Dessiner le canevas de la carte pré-rendue, mis à l'échelle et positionné
        this.ctx.drawImage(
            this.preRenderedMap, 
            0, 0, 
            this.preRenderedMap.width * currentScale, 
            this.preRenderedMap.height * currentScale
        );
        
        // Dessiner les épingles pour le mode "Find the places"
        if (this.gameMode === 'findPlace') {
            this._drawPins(currentScale);
        }
        
        // Stocker la position et l'échelle de la carte pour la détection de positionnement et la conversion de coordonnées
        this.canvas.dataset.mapX = this.offsetX;
        this.canvas.dataset.mapY = this.offsetY;
        this.canvas.dataset.mapScale = currentScale;
        
        // Stocker les dimensions originales de la carte pour des calculs de coordonnées corrects
        // Celles-ci doivent rester constantes quel que soit le zoom
        if (this.preRenderedMap) {
            this.canvas.dataset.mapWidth = this.preRenderedMap.width;
            this.canvas.dataset.mapHeight = this.preRenderedMap.height;
        }
    }
    
    /**
     * Dessine les épingles sur la carte pour le jeu "Find the places"
     * @param {number} scale - Facteur d'échelle actuel de la carte
     * @private
     */
    _drawPins(scale) {
        // Dessiner l'épingle du joueur si elle existe
        if (this.playerPin) {
            // Dessiner l'épingle
            this.ctx.fillStyle = this.pinFill;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            
            // Mettre à l'échelle l'épingle avec le niveau de zoom
            const radius = this.pinRadius * (1 + (this.zoomLevel * 0.2));
            
            // Dessiner un cercle pour l'épingle avec une ombre portée
            this.ctx.beginPath();
            this.ctx.arc(
                this.playerPin.x * scale, 
                this.playerPin.y * scale, 
                radius,
                0, Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.stroke();
            
            // Dessiner un anneau pulsant autour de l'épingle du joueur
            const pulseSize = Math.sin(Date.now() * 0.005) * 2 + 5; // Effet de pulsation
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.arc(
                this.playerPin.x * scale, 
                this.playerPin.y * scale, 
                radius + pulseSize,
                0, Math.PI * 2
            );
            this.ctx.stroke();
        }
        
        // Dessiner l'épingle de localisation réelle si elle existe
        if (this.actualPin) {
            // Dessiner l'épingle
            this.ctx.fillStyle = this.actualPinFill;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            
            // Mettre à l'échelle l'épingle avec le niveau de zoom
            const radius = this.pinRadius * (1 + (this.zoomLevel * 0.2));
            
            // Dessiner un cercle pour l'épingle
            this.ctx.beginPath();
            this.ctx.arc(
                this.actualPin.x * scale, 
                this.actualPin.y * scale, 
                radius,
                0, Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.stroke();
            
            // Dessiner une ligne reliant l'épingle du joueur et l'épingle réelle si les deux existent
            if (this.playerPin) {
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1.5;
                this.ctx.setLineDash([5, 3]); // Ligne pointillée
                
                this.ctx.beginPath();
                this.ctx.moveTo(this.playerPin.x * scale, this.playerPin.y * scale);
                this.ctx.lineTo(this.actualPin.x * scale, this.actualPin.y * scale);
                this.ctx.stroke();
                
                this.ctx.setLineDash([]); // Réinitialiser le style de ligne
            }
        }
    }
    
    /**
     * Active le mode de placement des épingles
     */
    enablePinPlacement() {
        this.isPlacingPin = true;
        this.playerPin = null;
        this.actualPin = null;
        this.canvas.style.cursor = this.isPinMode ? 'crosshair' : 'grab';
    }
    
    /**
     * Définit l'emplacement réel de l'épingle (réponse correcte)
     * @param {number} x - Coordonnée X sur la carte
     * @param {number} y - Coordonnée Y sur la carte
     */
    setActualPin(x, y) {
        this.actualPin = { x, y };
        this.redraw();
    }
    
    /**
     * Réinitialise les épingles pour un nouveau tour
     */
    resetPins() {
        console.log("Resetting pins");
        this.playerPin = null;
        this.actualPin = null;
        
        // Ne pas réinitialiser isPlacingPin ici - il est contrôlé par enablePinPlacement
        
        // Mettre à jour le curseur en fonction du mode épingle
        this.canvas.style.cursor = this.isPinMode ? 'crosshair' : 'grab';
        this.redraw();
        
        console.log("After resetPins: isPlacingPin =", this.isPlacingPin);
    }
    
    /**
     * Active/désactive le mode épingle
     * @param {boolean} enable - Indique s'il faut activer le mode épingle
     * @returns {boolean} - Le nouvel état du mode épingle
     */
    togglePinMode(enable) {
        // Suivre l'état précédent pour le débogage
        const oldState = this.isPinMode;
        
        // Mettre à jour l'état du mode épingle
        this.isPinMode = enable !== undefined ? enable : !this.isPinMode;
        
        console.log(`Toggling pin mode: ${oldState} -> ${this.isPinMode}`);
        
        // Mettre à jour le curseur et la classe CSS
        if (this.isPinMode) {
            this.canvas.style.cursor = 'crosshair';
            this.canvas.classList.add('pin-mode');
        } else {
            this.canvas.style.cursor = this.isPlacingPin ? 'crosshair' : 'grab';
            this.canvas.classList.remove('pin-mode');
        }
        
        // Retourner le nouvel état
        return this.isPinMode;
    }
    
    /**
     * Obtient l'état actuel du mode épingle
     * @returns {boolean} - Indique si le mode épingle est actif
     */
    getPinMode() {
        return this.isPinMode;
    }
    
    /**
     * Fait clignoter un pays sur la carte pour un retour visuel
     * @param {string} countryName - Nom du pays à faire clignoter
     * @param {string} type - Type de clignotement ('start', 'end', 'correct', 'error')
     */
    flashCountry(countryName, type = 'correct') {
        // Ceci serait implémenté pour fonctionner avec le contrôleur
        // Pour une implémentation complète, nous devrions :
        // 1. Changer temporairement la couleur du pays
        // 2. Redessiner la carte
        // 3. Définir un délai pour revenir à la couleur d'origine
        // 4. Redessiner à nouveau
    }
    
    /**
     * Affiche l'indicateur de chargement
     * @param {boolean} show - Indique s'il faut afficher ou masquer l'indicateur de chargement
     */
    showLoading(show = true) {
        const loadingEl = document.getElementById('loadingMessage');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }
    }
}