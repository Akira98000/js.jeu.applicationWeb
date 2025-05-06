export default class MapModel {
    constructor() {
        this.countries = new Map(); // Carte des noms de pays -> données des pays avec les chemins
        this.adjacencyMap = new Map(); // Carte des noms de pays -> pays adjacents
        this.continentMap = new Map(); // Carte des noms de pays -> continent
        this.countriesList = []; // Liste des noms de pays uniques
        this.validPairs = []; // Liste des paires de pays valides pour le jeu
        this.svgLoaded = false;
        
        // Pour le mode de jeu "Nommez-les tous"
        this.regionCountries = new Map(); // Carte des noms de régions -> tableau de pays
        this.namedCountries = new Set(); // Ensemble des pays déjà nommés
        this.currentRegion = null; // Région actuellement sélectionnée
    }

    /**
     * Charge les données de la carte SVG et les données d'adjacence
     * @param {string} svgUrl - URL du fichier SVG
     * @returns {Promise} - Résout lorsque les données sont chargées et traitées
     */
    async loadMapData(svgUrl) {
        try {
            // Récupérer le fichier SVG
            const response = await fetch(svgUrl);
            if (!response.ok) {
                throw new Error(`SVG file fetch failed: ${response.status}`);
            }
            
            const svgText = await response.text();
            
            // Analyser le SVG
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            
            if (svgDoc.querySelector('parsererror')) {
                throw new Error("SVG parsing error");
            }
            
            // Extraire et traiter les chemins des pays (gestion de plusieurs chemins par pays)
            await this._processCountryPaths(svgDoc);
            
            // Charger les données d'adjacence depuis JSON
            await this._loadAdjacencyData();
            
            // Charger les paires de pays valides depuis JSON
            await this._loadCountryPairs();
            
            // Charger les pays par région pour le jeu "Nommez-les tous"
            await this._loadRegionCountries();
            
            this.svgLoaded = true;
            return true;
        } catch (error) {
            console.error("Error loading map data:", error);
            return false;
        }
    }
    
    /**
     * Traite tous les chemins des pays à partir du SVG, en gérant plusieurs chemins par pays
     * @param {Document} svgDoc - Le document SVG analysé
     * @private
     */
    async _processCountryPaths(svgDoc) {
        // Effacer les données existantes
        this.countries.clear();
        this.continentMap.clear();
        
        // Extraire les chemins des pays
        const paths = svgDoc.querySelectorAll('path');
        
        if (paths.length === 0) {
            throw new Error("No paths found in SVG");
        }
        
        // Traiter chaque chemin
        paths.forEach(path => {
            // Obtenir les informations du pays
            const id = path.id || '';
            const name = path.getAttribute('name') || id || 'Unknown';
            const fill = path.getAttribute('fill') || '#ececec';
            const pathData = path.getAttribute('d');
            // Obtenir le continent à partir du nom de la classe si disponible
            const continent = path.getAttribute('class') || 'Unknown';
            
            if (!pathData) return;
            
            // Vérifier si nous avons déjà des données pour ce pays
            if (this.countries.has(name)) {
                // Ajouter ce chemin au pays existant
                const country = this.countries.get(name);
                country.paths.push(pathData);
            } else {
                // Créer une nouvelle entrée de pays
                this.countries.set(name, {
                    id,
                    name,
                    fill,
                    paths: [pathData], // Tableau de chaînes de données de chemin
                    selected: false,
                    isStart: false,
                    isEnd: false,
                    continent
                });
                
                // Stocker les informations du continent
                this.continentMap.set(name, continent);
            }
        });
        
        // Créer une liste de noms de pays uniques
        this.countriesList = Array.from(this.countries.keys());
        
        console.log(`Processed ${this.countriesList.length} unique countries with ${paths.length} total paths`);
    }
    
    /**
     * Charge les données d'adjacence des pays depuis JSON
     * @private
     */
    async _loadAdjacencyData() {
        try {
            const response = await fetch('data/country_adjacency.json');
            if (!response.ok) {
                throw new Error(`Adjacency data fetch failed: ${response.status}`);
            }
            
            const adjacencyData = await response.json();
            
            // Effacer les données d'adjacence existantes
            this.adjacencyMap.clear();
            
            // Traiter les données d'adjacence
            if (adjacencyData && adjacencyData.adjacency) {
                Object.entries(adjacencyData.adjacency).forEach(([country, neighbors]) => {
                    // Créer un ensemble de pays adjacents
                    this.adjacencyMap.set(country, new Set(neighbors));
                });
                
                console.log(`Loaded adjacency data for ${this.adjacencyMap.size} countries`);
            }
        } catch (error) {
            console.error("Error loading adjacency data:", error);
            // Revenir à une approche simplifiée
            this._generateFallbackAdjacency();
        }
    }
    
    /**
     * Génère des données d'adjacence de secours si le chargement JSON échoue
     * @private
     */
    _generateFallbackAdjacency() {
        console.warn("Using fallback adjacency generation");
        
        this.countriesList.forEach(countryName => {
            if (!this.adjacencyMap.has(countryName)) {
                this.adjacencyMap.set(countryName, new Set());
            }
            
            // Solution de repli simple : les pays du même continent peuvent être adjacents
            const continent = this.continentMap.get(countryName);
            
            this.countriesList.forEach(otherName => {
                if (countryName === otherName) return;
                
                const otherContinent = this.continentMap.get(otherName);
                
                // Ajouter quelques adjacences pour les pays du même continent
                if (continent === otherContinent && continent !== 'Unknown') {
                    // Ajouter avec une certaine probabilité pour éviter trop de connexions
                    if (Math.random() < 0.2) {
                        this.adjacencyMap.get(countryName).add(otherName);
                    }
                }
            });
        });
    }
    
    /**
     * Charge les paires de pays valides depuis JSON
     * @private
     */
    async _loadCountryPairs() {
        try {
            const response = await fetch('data/country_pairs.json');
            if (!response.ok) {
                throw new Error(`Country pairs fetch failed: ${response.status}`);
            }
            
            const pairsData = await response.json();
            
            if (pairsData && pairsData.validPairs) {
                this.validPairs = pairsData.validPairs;
                console.log(`Loaded ${this.validPairs.length} valid country pairs`);
            }
        } catch (error) {
            console.error("Error loading country pairs data:", error);
            // Reviendra aux paires aléatoires dans getRandomCountryPair
        }
    }
    
    /**
     * Charge les données des régions de pays depuis JSON pour le jeu "Nommez-les tous"
     * @private
     */
    async _loadRegionCountries() {
        try {
            const response = await fetch('data/countries_by_region.json');
            if (!response.ok) {
                throw new Error(`Region data fetch failed: ${response.status}`);
            }
            
            const regionData = await response.json();
            
            // Traiter les données des régions
            if (regionData && regionData.regions) {
                // Effacer les données de région existantes
                this.regionCountries.clear();
                
                // Traiter chaque région
                Object.entries(regionData.regions).forEach(([region, countries]) => {
                    // Filtrer pour inclure uniquement les pays qui existent dans notre carte SVG
                    const validCountries = countries.filter(country => 
                        this.countries.has(country)
                    );
                    
                    this.regionCountries.set(region, validCountries);
                });
                
                // Ajouter "Monde" comme tous les pays de notre carte
                if (!this.regionCountries.has("World")) {
                    this.regionCountries.set("World", [...this.countriesList]);
                }
                
                console.log(`Loaded region data with ${this.regionCountries.size} regions`);
            }
        } catch (error) {
            console.error("Error loading region data:", error);
            // Créer des régions de secours basées sur les continents si nécessaire
            this._generateFallbackRegions();
        }
    }
    
    /**
     * Obtient une paire aléatoire de pays qui ont un chemin valide entre eux
     * Utilise des paires prédéfinies si disponibles, sinon génère une paire aléatoire
     * @returns {Object} - Objet avec les noms des pays de départ et d'arrivée
     */
    getRandomCountryPair() {
        if (!this.svgLoaded || this.countries.size === 0) {
            return null;
        }
        
        // Utiliser des paires prédéfinies si disponibles
        if (this.validPairs.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.validPairs.length);
            const pair = this.validPairs[randomIndex];
            
            // S'assurer que les deux pays existent dans nos données
            if (this.countries.has(pair.start) && this.countries.has(pair.end)) {
                return {
                    start: pair.start,
                    end: pair.end
                };
            }
        }
        
        // Revenir à la sélection aléatoire
        return this._generateRandomCountryPair();
    }
    
    /**
     * Génère une paire de pays aléatoire en tant que solution de repli
     * @returns {Object} - Objet avec les noms des pays de départ et d'arrivée
     * @private
     */
    _generateRandomCountryPair() {
        // Obtenir un pays de départ valide
        let startCountryName = null;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (!startCountryName && attempts < maxAttempts) {
            const randomIndex = Math.floor(Math.random() * this.countriesList.length);
            const candidateName = this.countriesList[randomIndex];
            
            if (this.adjacencyMap.has(candidateName) && 
                this.adjacencyMap.get(candidateName).size > 0) {
                startCountryName = candidateName;
            }
            
            attempts++;
        }
        
        if (!startCountryName) {
            console.error("Could not find a valid starting country with adjacencies");
            // Choisir simplement deux pays quelconques en dernier recours
            if (this.countriesList.length >= 2) {
                return {
                    start: this.countriesList[0],
                    end: this.countriesList[1]
                };
            }
            return null;
        }
        
        // Trouver un pays d'arrivée approprié
        let possibleEndCountries = [];
        
        // Filtrer les pays du même continent
        const startContinent = this.continentMap.get(startCountryName);
        
        this.countriesList.forEach(countryName => {
            if (countryName === startCountryName) {
                return; // Ignorer le pays de départ
            }
            
            const countryContinent = this.continentMap.get(countryName);
            
            // Inclure les pays du même continent ou les pays adjacents
            if ((countryContinent === startContinent && startContinent !== 'Unknown') ||
                this.isAdjacent(startCountryName, countryName)) {
                possibleEndCountries.push(countryName);
            }
        });
        
        // Si aucun pays d'arrivée n'est trouvé, en choisir un au hasard
        if (possibleEndCountries.length === 0) {
            const nonStartCountries = this.countriesList.filter(
                name => name !== startCountryName
            );
            
            if (nonStartCountries.length === 0) {
                return null;
            }
            
            const randomIndex = Math.floor(Math.random() * nonStartCountries.length);
            return {
                start: startCountryName,
                end: nonStartCountries[randomIndex]
            };
        }
        
        // Choisir un pays d'arrivée aléatoire
        const randomEndIndex = Math.floor(Math.random() * possibleEndCountries.length);
        const endCountryName = possibleEndCountries[randomEndIndex];
        
        return {
            start: startCountryName,
            end: endCountryName
        };
    }
    
    /**
     * Vérifie si deux pays sont adjacents en utilisant les données d'adjacence
     * @param {string} country1 - Nom du premier pays
     * @param {string} country2 - Nom du deuxième pays
     * @returns {boolean} - Vrai si les pays sont adjacents
     */
    isAdjacent(country1, country2) {
        if (!this.adjacencyMap.has(country1) || !this.adjacencyMap.has(country2)) {
            return false;
        }
        
        return this.adjacencyMap.get(country1).has(country2) || 
               this.adjacencyMap.get(country2).has(country1);
    }
    
    /**
     * Obtient un pays par son nom (insensible à la casse)
     * @param {string} name - Nom du pays à trouver
     * @returns {Object|null} - Objet pays ou null si non trouvé
     */
    getCountryByName(name) {
        if (!name) return null;
        
        const normalizedName = name.trim().toLowerCase();
        
        // Essayer d'abord la correspondance exacte
        for (const [countryName, countryData] of this.countries.entries()) {
            if (countryName.toLowerCase() === normalizedName) {
                console.log(`Found exact match for country: ${countryName}`);
                return countryData;
            }
        }
        
        // Cas spéciaux pour les noms de pays courants
        // Mappe les noms courants ou abréviations aux noms officiels
        const specialCases = {
            'usa': 'United States',
            'united states of america': 'United States',
            'uk': 'United Kingdom',
            'great britain': 'United Kingdom',
            'england': 'United Kingdom',
            'holland': 'Netherlands',
            'macedonia': 'North Macedonia',
            'czechia': 'Czech Republic',
            'russia': 'Russia',
            'america': 'United States',
            'uae': 'United Arab Emirates'
        };
        
        // Vérifier si nous avons une correspondance de cas spécial
        if (specialCases[normalizedName]) {
            const officialName = specialCases[normalizedName];
            const countryData = this.countries.get(officialName);
            if (countryData) {
                console.log(`Found special case match for country: ${normalizedName} -> ${officialName}`);
                return countryData;
            }
        }
        
        // Vérifier avec la capitalisation exacte de countries_by_region.json
        if (this.regionCountries.has('Europe')) {
            // Essayer de trouver le pays dans n'importe quelle région avec une correspondance plus souple
            for (const [region, countries] of this.regionCountries.entries()) {
                for (const countryName of countries) {
                    if (countryName.toLowerCase() === normalizedName) {
                        const countryData = this.countries.get(countryName);
                        if (countryData) {
                            console.log(`Found region-based match for country: ${normalizedName} -> ${countryName}`);
                            return countryData;
                        }
                    }
                }
            }
        }
        
        console.log(`No match found for country: ${normalizedName}`);
        return null;
    }
    
    /**
     * Définit l'état de surbrillance d'un pays
     * @param {string} countryName - Nom du pays à mettre en surbrillance
     * @param {boolean} selected - Indique s'il faut sélectionner ou désélectionner le pays
     */
    setCountryHighlight(countryName, selected = true) {
        const country = this.getCountryByName(countryName);
        if (country) {
            country.selected = selected;
        }
    }
    
    /**
     * Définit un pays comme point de départ ou d'arrivée
     * @param {string} countryName - Nom du pays
     * @param {string} type - 'start' ou 'end'
     */
    setCountryEndpoint(countryName, type) {
        const country = this.getCountryByName(countryName);
        if (country) {
            if (type === 'start') {
                country.isStart = true;
            } else if (type === 'end') {
                country.isEnd = true;
            }
        }
    }
    
    /**
     * Obtient toutes les données des pays pour le rendu
     * @returns {Array} - Tableau d'objets pays prêts pour le rendu
     */
    getAllCountriesForRendering() {
        // Créer un tableau plat d'objets pays avec les informations de rendu
        const renderData = [];
        
        this.countries.forEach(country => {
            renderData.push({
                name: country.name,
                paths: country.paths,  // Tous les chemins pour ce pays
                fill: country.fill,
                selected: country.selected,
                isStart: country.isStart,
                isEnd: country.isEnd
            });
        });
        
        return renderData;
    }
    
    /**
     * Réinitialise toutes les surbrillances et points de départ/arrivée des pays
     */
    resetCountryHighlights() {
        this.countries.forEach(country => {
            country.selected = false;
            country.isStart = false;
            country.isEnd = false;
        });
    }
    
    /**
     * Génère des régions de secours si le chargement JSON échoue
     * @private
     */
    _generateFallbackRegions() {
        console.warn("Using fallback region generation");
        
        // Créer des régions de base basées sur les continents à partir des données existantes
        const europeanCountries = [];
        const americanCountries = [];
        const asianCountries = [];
        const africanCountries = [];
        const otherCountries = [];
        
        this.countriesList.forEach(countryName => {
            const continent = this.continentMap.get(countryName) || '';
            const continentLower = continent.toLowerCase();
            
            if (continentLower.includes('europe')) {
                europeanCountries.push(countryName);
            } else if (continentLower.includes('america') || 
                    continentLower.includes('north') || 
                    continentLower.includes('south') || 
                    continentLower.includes('caribbean')) {
                americanCountries.push(countryName);
            } else if (continentLower.includes('asia') || 
                    continentLower.includes('middle east')) {
                asianCountries.push(countryName);
            } else if (continentLower.includes('africa')) {
                africanCountries.push(countryName);
            } else {
                otherCountries.push(countryName);
            }
        });
        
        // Configurer les régions
        this.regionCountries.set('Europe', europeanCountries);
        this.regionCountries.set('America', americanCountries);
        this.regionCountries.set('Asia', asianCountries);
        this.regionCountries.set('Africa', africanCountries);
        this.regionCountries.set('World', this.countriesList);
    }
    
    /**
     * Définit la région actuelle pour le jeu "Nommez-les tous"
     * @param {string} region - Nom de la région à définir
     * @returns {boolean} - Vrai si la région a été trouvée et définie
     */
    setRegion(region) {
        console.log(`Setting region to ${region}`);
        
        // Vérifier si la région existe directement dans notre carte regionCountries
        if (this.regionCountries.has(region)) {
            console.log(`Found region ${region} directly in regionCountries`);
            this.currentRegion = region;
            // Réinitialiser les pays nommés lors du changement de région
            this.namedCountries.clear();
            return true;
        }
        
        // Cas spécial pour les méta-régions
        if (region === 'World') {
            console.log('Setting special World region');
            this.currentRegion = 'World';
            this.namedCountries.clear();
            
            // Si nous n'avons pas déjà "Monde" comme région, s'assurer qu'elle est ajoutée
            if (!this.regionCountries.has('World')) {
                console.log('Adding World region with all countries');
                this.regionCountries.set('World', [...this.countriesList]);
            }
            
            return true;
        }
        
        console.log(`Failed to set region ${region}`);
        return false;
    }
    
    /**
     * Obtient toutes les régions disponibles pour le jeu
     * @returns {Array} - Tableau des noms de régions
     */
    getAvailableRegions() {
        // S'assurer que nous avons des régions chargées
        if (this.regionCountries.size === 0) {
            console.warn('No regions loaded, using fallback regions');
            // Régions de secours si les données n'ont pas été chargées correctement
            return ['Europe', 'America', 'Asia', 'Africa', 'World'];
        }
        
        const regions = Array.from(this.regionCountries.keys());
        console.log('Available regions from model:', regions);
        return regions;
    }
    
    /**
     * Obtient les pays de la région actuelle
     * @returns {Array} - Tableau des noms de pays dans la région actuelle
     */
    getCurrentRegionCountries() {
        if (!this.currentRegion || !this.regionCountries.has(this.currentRegion)) {
            return [];
        }
        return this.regionCountries.get(this.currentRegion);
    }
    
    /**
     * Vérifie si un pays est dans la région actuelle
     * @param {string} countryName - Nom du pays à vérifier
     * @returns {boolean} - Vrai si le pays est dans la région actuelle
     */
    isCountryInCurrentRegion(countryName) {
        if (!this.currentRegion) {
            console.warn('No current region set');
            return false;
        }
        
        // Normaliser le nom du pays saisi
        const normalizedInput = countryName.trim().toLowerCase();
        
        // Gestion spéciale pour la région "Monde" (contient tous les pays)
        if (this.currentRegion === 'World') {
            console.log(`World region selected, checking if ${countryName} exists in any region`);
            // Pour la région "Monde", vérifier si le pays existe dans n'importe quelle région
            for (const regions of this.regionCountries.values()) {
                for (const regionCountry of regions) {
                    if (regionCountry.toLowerCase() === normalizedInput) {
                        console.log(`Found match for ${countryName} in World region`);
                        return true;
                    }
                }
            }
            
            // Vérifier également s'il existe dans notre liste de pays
            for (const countryKey of this.countriesList) {
                if (countryKey.toLowerCase() === normalizedInput) {
                    console.log(`Found match for ${countryName} in World region (from countriesList)`);
                    return true;
                }
            }
            
            console.log(`No match for ${countryName} in World region`);
            return false;
        }
        
        // Gérer les méta-régions (comme "Monde" qui inclut plusieurs régions)
        let regionCountries = [];
        if (this.regionCountries.get(this.currentRegion)) {
            regionCountries = this.regionCountries.get(this.currentRegion);
        }
        
        console.log(`Checking if ${countryName} is in region ${this.currentRegion}`);
        
        // Vérification insensible à la casse
        for (const regionCountry of regionCountries) {
            if (regionCountry.toLowerCase() === normalizedInput) {
                console.log(`Found match for ${countryName} in region ${this.currentRegion}`);
                return true;
            }
        }
        
        // Aucune correspondance trouvée
        console.log(`No match for ${countryName} in region ${this.currentRegion}`);
        return false;
    }
    
    /**
     * Marque un pays comme nommé dans le jeu "Nommez-les tous"
     * @param {string} countryName - Nom du pays à marquer
     * @returns {boolean} - Vrai si le pays était valide et marqué
     */
    markCountryNamed(countryName) {
        console.log(`Attempting to mark ${countryName} as named`);
        
        // Vérifier d'abord si le pays est dans la région actuelle et n'a pas encore été nommé
        if (this.isCountryInCurrentRegion(countryName) && !this.namedCountries.has(countryName)) {
            // Trouver le nom exact du pays correspondant dans la liste (en conservant la casse)
            let exactCountryName = countryName;
            
            // Pour la région "Monde", rechercher dans toutes les régions la correspondance exacte
            if (this.currentRegion === 'World') {
                const normalizedInput = countryName.trim().toLowerCase();
                
                // Rechercher dans toutes les régions le nom du pays avec la casse exacte
                for (const regions of this.regionCountries.values()) {
                    for (const regionCountry of regions) {
                        if (regionCountry.toLowerCase() === normalizedInput) {
                            exactCountryName = regionCountry;
                            break;
                        }
                    }
                }
                
                // Rechercher également dans la liste des pays
                for (const country of this.countriesList) {
                    if (country.toLowerCase() === normalizedInput) {
                        exactCountryName = country;
                        break;
                    }
                }
            } else {
                // Pour les régions standard, rechercher uniquement dans cette région
                const normalizedInput = countryName.trim().toLowerCase();
                const regionCountries = this.regionCountries.get(this.currentRegion) || [];
                
                for (const regionCountry of regionCountries) {
                    if (regionCountry.toLowerCase() === normalizedInput) {
                        exactCountryName = regionCountry;
                        break;
                    }
                }
            }
            
            console.log(`Adding country ${exactCountryName} to named countries`);
            this.namedCountries.add(exactCountryName);
            
            // Mettre également le pays en surbrillance sur la carte
            this.setCountryHighlight(exactCountryName, true);
            return true;
        }
        
        console.log(`Failed to mark ${countryName} as named`);
        return false;
    }
    
    /**
     * Obtient tous les pays nommés pour la région actuelle
     * @returns {Array} - Tableau des noms de pays nommés
     */
    getNamedCountries() {
        return Array.from(this.namedCountries);
    }
    
    /**
     * Obtient le nombre de pays restants à nommer
     * @returns {Object} - Objet avec les comptes nommés, totaux et restants
     */
    getRemainingCountsForRegion() {
        if (!this.currentRegion) {
            return { named: 0, total: 0, remaining: 0 };
        }
        
        const regionCountries = this.regionCountries.get(this.currentRegion) || [];
        const namedCount = this.namedCountries.size;
        const totalCount = regionCountries.length;
        
        return {
            named: namedCount,
            total: totalCount,
            remaining: totalCount - namedCount
        };
    }
    
    /**
     * Vérifie si tous les pays de la région actuelle ont été nommés
     * @returns {boolean} - Vrai si tous les pays ont été nommés
     */
    areAllCountriesNamed() {
        if (!this.currentRegion) return false;
        
        const regionCountries = this.regionCountries.get(this.currentRegion) || [];
        return this.namedCountries.size === regionCountries.length;
    }
    
    /**
     * Réinitialise les pays nommés pour une nouvelle partie
     */
    resetNamedCountries() {
        this.namedCountries.clear();
    }
}