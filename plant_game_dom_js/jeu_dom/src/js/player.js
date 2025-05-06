class Player {
    constructor(initialMoney = 100) {
        this.money = initialMoney;
        this.seeds = 0;
        this.totalPlants = 0;
        this.totalEarnings = initialMoney;
        this.fertilizersUsed = 0;
        this.weedCutterUsed = 0;
        this.autoWaterUsed = 0;
        this.fertilizedPlantsBonusEarnings = 0;
        this.autoWateredPlants = 0;
        this.plantTypes = {};
    }

    canBuySeed(price) {
        return this.money >= price;
    }

    buySeed(price) {
        if (this.canBuySeed(price)) {
            this.money -= price;
            this.seeds++;
            updateUI();
            return true;
        }
        return false;
    }

    useSeed() {
        if (this.seeds > 0) {
            this.seeds--;
            return true;
        }
        return false;
    }

    earnMoney(amount) {
        this.money += amount;
        this.totalEarnings += amount;
        updateUI();
        return this.money;
    }
    
    useFertilizer() { this.fertilizersUsed++; }
    useWeedCutter() { this.weedCutterUsed++; }
    useAutoWater() { this.autoWaterUsed++; }
    trackFertilizerBonus(amount) { this.fertilizedPlantsBonusEarnings += amount; }
    trackAutoWateredPlant() { this.autoWateredPlants++; }

    trackPlantType(seedType) {
        if (!this.plantTypes[seedType]) this.plantTypes[seedType] = 0;
    }

    getStats() {
        return {
            money: this.money,
            seeds: this.seeds,
            totalPlants: this.totalPlants,
            totalEarnings: this.totalEarnings,
            fertilizersUsed: this.fertilizersUsed,
            weedCutterUsed: this.weedCutterUsed,
            autoWaterUsed: this.autoWaterUsed,
            fertilizedPlantsBonusEarnings: this.fertilizedPlantsBonusEarnings,
            autoWateredPlants: this.autoWateredPlants,
            plantTypes: this.plantTypes
        };
    }
}