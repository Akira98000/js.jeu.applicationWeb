class Tools {
    constructor() {
        this.tools = {
            'pitchfork': {
                level: 0,
                maxLevel: 3,
                basePrice: 75,
                multiplier: 1.0,
                getUpgradePrice: () => Math.round(this.tools.pitchfork.basePrice * Math.pow(1.8, this.tools.pitchfork.level))
            },
            'watering-can': {
                level: 0,
                maxLevel: 3,
                basePrice: 85,
                growthTime: 3000,
                getUpgradePrice: () => Math.round(this.tools['watering-can'].basePrice * Math.pow(1.8, this.tools['watering-can'].level))
            },
            'fertilizer': {
                level: 0,
                maxLevel: 3,
                basePrice: 100,
                useCost: 8,
                bonusMultiplier: 1.25,
                getUpgradePrice: () => Math.round(this.tools.fertilizer.basePrice * Math.pow(1.8, this.tools.fertilizer.level)),
                getBonusMultiplier: () => 1.25 + (this.tools.fertilizer.level * 0.25)
            },
            'weed-cutter': {
                level: 0,
                maxLevel: 3,
                basePrice: 150,
                useCost: 15,
                uses: 0,
                maxUses: 3,
                getUpgradePrice: () => Math.round(this.tools['weed-cutter'].basePrice * Math.pow(1.8, this.tools['weed-cutter'].level)),
                getMaxUses: () => 3 + this.tools['weed-cutter'].level
            },
            'auto-water': {
                level: 0,
                maxLevel: 3,
                basePrice: 120,
                useCost: 12,
                uses: 0,
                maxUses: 3,
                getUpgradePrice: () => Math.round(this.tools['auto-water'].basePrice * Math.pow(1.8, this.tools['auto-water'].level)),
                getMaxUses: () => 3 + this.tools['auto-water'].level
            }
        };
        
        // Initialiser l'interface au chargement
        window.addEventListener('DOMContentLoaded', () => this.initToolsUI());
    }

    initToolsUI() {
        // Initialiser toutes les barres de progression
        Object.keys(this.tools).forEach(tool => this.updateProgressBars(tool));
        
        // Initialiser les compteurs d'utilisation
        ['weed-cutter', 'auto-water'].forEach(tool => {
            this.tools[tool].uses = 0;
            this.tools[tool].maxUses = this.tools[tool].getMaxUses();
            this.updateToolDisplay(tool);
        });
    }

    getMultiplier(tool) {
        return tool === 'pitchfork' ? 1 + (this.tools.pitchfork.level * 0.1) : 1;
    }

    getGrowthTime() {
        return this.tools['watering-can'].growthTime * Math.pow(0.8, this.tools['watering-can'].level);
    }

    canUpgrade(tool) {
        return this.tools[tool].level < this.tools[tool].maxLevel;
    }

    upgrade(tool) {
        if (!this.canUpgrade(tool)) return false;
        
        this.tools[tool].level++;
        
        // Mettre à jour les affichages spécifiques
        const updateFuncs = {
            'watering-can': () => this.updateGrowthTimeDisplay(),
            'pitchfork': () => this.updateMultiplierDisplay(),
            'fertilizer': () => this.updateFertilizerDisplay(),
            'weed-cutter': () => {
                this.tools[tool].maxUses = this.tools[tool].getMaxUses();
                this.updateToolDisplay(tool);
            },
            'auto-water': () => {
                this.tools[tool].maxUses = this.tools[tool].getMaxUses();
                this.updateToolDisplay(tool);
            }
        };
        
        if (updateFuncs[tool]) updateFuncs[tool]();
        this.updateProgressBars(tool);
        return true;
    }

    updateProgressBars(tool) {
        const progressElement = document.getElementById(`${tool}-progress`);
        const levelElement = document.getElementById(`${tool}-level`);
        
        if (!progressElement || !levelElement) return;
        
        const level = this.tools[tool].level;
        const maxLevel = this.tools[tool].maxLevel;
        
        // Mettre à jour la barre de progression
        progressElement.style.width = `${(level / maxLevel) * 100}%`;
        levelElement.textContent = level;
        
        // Mettre à jour le bouton d'amélioration
        const upgradeButton = document.getElementById(`${tool}-upgrade`);
        if (upgradeButton) {
            if (level >= maxLevel) {
                upgradeButton.disabled = true;
                upgradeButton.textContent = "Maximum atteint";
            } else {
                upgradeButton.textContent = `⬆️ Améliorer (${this.tools[tool].getUpgradePrice()}🪙)`;
            }
        }
    }

    // Méthodes d'affichage des bonus
    updateGrowthTimeDisplay() {
        document.getElementById('watering-can-bonus').textContent = 
            (this.getGrowthTime() / 1000).toFixed(1) + 's';
    }

    updateMultiplierDisplay() {
        document.getElementById('pitchfork-bonus').textContent = 
            'x' + this.getMultiplier('pitchfork').toFixed(1);
    }
    
    updateFertilizerDisplay() {
        const element = document.getElementById('fertilizer-bonus');
        if (element) {
            element.textContent = 'x' + this.tools.fertilizer.getBonusMultiplier().toFixed(2);
        }
    }
    
    // Méthode unifiée pour mettre à jour les compteurs d'outils
    updateToolDisplay(tool) {
        const element = document.getElementById(`${tool}-count`);
        if (element) {
            element.textContent = `${this.tools[tool].uses}/${this.tools[tool].maxUses}`;
        }
    }
    
    // Méthodes pour réinitialiser les usages
    resetToolUses(tool) {
        this.tools[tool].uses = 0;
        this.updateToolDisplay(tool);
    }
    
    // Méthodes pour vérifier si un outil peut être utilisé
    canUseTool(tool) {
        return player.money >= this.tools[tool].useCost;
    }
    
    // Application de fertilisant
    useFertilizer(plot) {
        if (!this.canUseTool('fertilizer')) return false;
        
        // Déduire le coût et appliquer l'effet
        player.money -= this.tools.fertilizer.useCost;
        plot.setAttribute('data-fertilized', 'true');
        player.useFertilizer();
        
        // Effet visuel
        const fertilizerEffect = document.createElement('div');
        fertilizerEffect.className = 'fertilizer-effect';
        plot.appendChild(fertilizerEffect);
        setTimeout(() => plot.querySelector('.fertilizer-effect')?.remove(), 1500);
        
        // Mise à jour de l'interface
        document.getElementById("money").textContent = player.money;
        updateUI();
        
        return true;
    }
    
    // Utilisation du désherbeur
    useWeedCutter() {
        if (!this.canUseTool('weed-cutter')) return false;
        
        // Déduire le coût et enregistrer l'utilisation
        player.money -= this.tools['weed-cutter'].useCost;
        player.useWeedCutter();
        document.getElementById("money").textContent = player.money;
        
        // Traiter toutes les parcelles non labourées
        let plotsPlowed = 0;
        document.querySelectorAll('.plot').forEach(plot => {
            if (!plot.hasChildNodes() && !plot.getAttribute("data-plowed")) {
                plot.style.background = "#3e2723";
                plot.setAttribute("data-plowed", "true");
                
                // Effet visuel
                plot.classList.add('weed-cutter-effect');
                setTimeout(() => plot.classList.remove('weed-cutter-effect'), 800);
                
                plotsPlowed++;
            }
        });
        
        updateUI();
        return plotsPlowed > 0;
    }
    
    // Utilisation de l'arroseur automatique
    useAutoWater() {
        if (!this.canUseTool('auto-water')) return false;
        
        // Déduire le coût et enregistrer l'utilisation
        player.money -= this.tools['auto-water'].useCost;
        player.useAutoWater();
        document.getElementById("money").textContent = player.money;
        
        // Arroser les plantes qui en ont besoin
        let plantsWatered = 0;
        document.querySelectorAll('.plot[data-state="seeded"] .plant.needs-water').forEach(plant => {
            const plot = plant.closest('.plot');
            garden.growPlant(plot);
            plantsWatered++;
            
            // Statistiques et effet visuel
            player.trackAutoWateredPlant();
            plot.classList.add('auto-water-effect');
            setTimeout(() => plot.classList.remove('auto-water-effect'), 800);
        });
        
        updateUI();
        return plantsWatered > 0;
    }
}