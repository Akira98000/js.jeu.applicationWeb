class Garden {
    constructor() {
        this.plots = document.querySelectorAll('.plot');
        this.setupHarvestListeners();
    }

    plowPlot(plot) {
        if (!plot.hasChildNodes()) {
            plot.style.background = "#3e2723";
            plot.setAttribute("data-plowed", "true");
            return true;
        }
        return false;
    }

    plantSeed(plot, seedType) {
        if (plot.getAttribute("data-plowed") !== "true") {
            return false;
        }
        
        const plant = document.createElement("div");
        plant.className = "plant needs-water";
        plant.textContent = SEEDS[seedType].stages[0];
        plant.setAttribute("data-seed-type", seedType);
        
        const waterIcon = document.createElement("div");
        waterIcon.className = "water-indicator";
        waterIcon.textContent = "💧";
        
        plot.innerHTML = '';
        plot.appendChild(plant);
        plot.appendChild(waterIcon);
        plot.setAttribute("data-state", "seeded");
        
        plot.style.opacity = "0.8";
        
        plot.classList.add('planting-effect');
        setTimeout(() => {
            plot.classList.remove('planting-effect');
        }, 800);
        
        return true;
    }

    setupHarvestListeners() {
        document.querySelector('.field').addEventListener('click', (event) => {
            const plot = event.target.closest('.plot');
            if (plot && plot.getAttribute('data-state') === 'mature') {
                this.harvestPlant(plot);
            }
        });
    }

    growPlant(plot) {
        const plant = plot.querySelector('.plant');
        const seedType = plant.getAttribute('data-seed-type');
        const seedData = SEEDS[seedType];
        
        plot.querySelector('.water-indicator')?.remove();
        plant.classList.remove('needs-water');
        plot.style.opacity = "1";
        
        plot.setAttribute('data-state', 'growing');
        plant.classList.add('growing');
        
        plot.classList.add('watering-effect');
        setTimeout(() => {
            plot.classList.remove('watering-effect');
        }, 800);
        
        plot.querySelector('.growth-indicator')?.remove();
        
        plant.style.transition = "all 0.3s ease";
        
        this.addGrowthEffects(plot);
        
        let currentStage = 0;
        const totalStages = seedData.stages.length;
        const growthInterval = setInterval(() => {
            currentStage++;
            
            if (currentStage >= totalStages) {
                this.completePlantGrowth(plot, growthInterval);
            } else {
                plant.textContent = seedData.stages[currentStage];
                this.animateStageChange(plot, plant);
            }
        }, seedData.growthTime / seedData.stages.length);
    }
    
    addGrowthEffects(plot) {
        const glowEffect = document.createElement('div');
        glowEffect.className = 'plant-glow';
        plot.appendChild(glowEffect);
        
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'growth-particle';
            particle.style.animationDelay = `${i * 0.7}s`;
            particle.style.left = `${20 + i * 15}%`;
            plot.appendChild(particle);
        }
        
        const sunIndicator = document.createElement('div');
        sunIndicator.className = 'sun-indicator';
        sunIndicator.innerHTML = '☀️';
        plot.appendChild(sunIndicator);
    }
    
    animateStageChange(plot, plant) {
        plant.classList.add('stage-change');
        
        const stageFlash = document.createElement('div');
        stageFlash.className = 'stage-change-flash';
        plot.appendChild(stageFlash);
        
        setTimeout(() => {
            plant.classList.remove('stage-change');
            plot.querySelector('.stage-change-flash')?.remove();
        }, 600);
    }
    
    completePlantGrowth(plot, growthInterval) {
        clearInterval(growthInterval);
        const plant = plot.querySelector('.plant');
        
        plot.setAttribute('data-state', 'mature');
        plant.classList.remove('growing');
        plant.classList.add('mature-plant');
        plot.style.cursor = 'pointer';
        plant.style.animation = 'pulse 1s infinite';
        
        ['plant-glow', 'growth-particle', 'sun-indicator'].forEach(cls => {
            plot.querySelectorAll(`.${cls}`).forEach(el => el.remove());
        });
        
        const completeFlash = document.createElement('div');
        completeFlash.className = 'growth-complete-flash';
        plot.appendChild(completeFlash);
        setTimeout(() => plot.querySelector('.growth-complete-flash')?.remove(), 1000);
        
        const harvestIndicator = document.createElement('div');
        harvestIndicator.className = 'harvest-indicator';
        harvestIndicator.innerHTML = `
            <span class="harvest-icon">✂️</span>
            <span class="harvest-label">Récolter</span>
        `;
        plot.appendChild(harvestIndicator);
    }

    harvestPlant(plot) {
        if (plot.getAttribute('data-harvesting') === 'true') return;
        
        plot.setAttribute('data-harvesting', 'true');
        plot.setAttribute('data-state', 'harvesting');
        
        const plant = plot.querySelector('.plant');
        const seedType = plant.getAttribute('data-seed-type');
        
        let baseReward = Math.round(SEEDS[seedType].reward * tools.getMultiplier('pitchfork'));
        let finalReward = baseReward;
        
        if (plot.getAttribute('data-fertilized') === 'true') {
            const fertilizerBonus = tools.tools.fertilizer.getBonusMultiplier();
            finalReward = Math.round(baseReward * fertilizerBonus);
            
            player.trackFertilizerBonus(finalReward - baseReward);
            
            const bonusEffect = document.createElement('div');
            bonusEffect.className = 'fertilizer-harvest-effect';
            bonusEffect.textContent = `+${Math.round((fertilizerBonus - 1) * 100)}%`;
            plot.appendChild(bonusEffect);
            setTimeout(() => plot.querySelector('.fertilizer-harvest-effect')?.remove(), 1500);
        }
        
        player.seeds++;
        this.addHarvestText(plot, 1, finalReward);
        
        player.earnMoney(finalReward);
        soundManager.play('harvest');
        
        plot.classList.add('sound-effect');
        setTimeout(() => plot.classList.remove('sound-effect'), 800);
        
        setTimeout(() => {
            this.resetPlot(plot);
            updateUI();
            
            gameStats.addPlantGrown(seedType);
            
            if (player.plantTypes[seedType] !== undefined) {
                player.plantTypes[seedType]++;
                player.totalPlants++;
            }
        }, 1000);
    }
    
    addHarvestText(plot, seedsGained, reward) {
        const seedText = document.createElement('div');
        seedText.textContent = `+${seedsGained} 🌱`;
        seedText.className = 'harvest-text seeds-text';
        seedText.style.color = '#8bc34a';
        seedText.style.left = '25%';
        plot.appendChild(seedText);
        
        const harvestText = document.createElement('div');
        harvestText.textContent = `+${reward}🪙`;
        harvestText.className = 'harvest-text';
        plot.appendChild(harvestText);
    }

    resetPlot(plot) {
        ["data-plowed", "data-state", "data-harvesting", "data-fertilized"].forEach(attr => 
            plot.removeAttribute(attr)
        );
        plot.style.cursor = 'default';
        plot.style.background = "#8b4513";
        plot.style.opacity = "1";
        plot.innerHTML = '';
    }
}