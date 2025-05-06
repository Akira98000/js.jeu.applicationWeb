class GameStats {
    constructor() {
        this.level = 1;
        this.objectives = [
            {
                level: 1,
                plantsRequired: 5,
                reward: 50,
                message: "Cultiver 5 plantes pour obtenir 50🪙"
            },
            {
                level: 2,
                plantsRequired: 10,
                moneyRequired: 500,
                reward: 100,
                message: "Cultiver 10 plantes pour obtenir 100🪙"
            },
            {
                level: 3,
                plantsRequired: 15,
                moneyRequired: 750,
                reward: 150,
                message: "Cultiver 15 plantes pour obtenir 150🪙"
            },
            {
                level: 4,
                plantsRequired: 20,
                moneyRequired: 1000,
                reward: 200,
                message: "Cultiver 20 plantes pour obtenir 200🪙"
            },
            {
                level: 5,
                plantTypeRequired: "corn",
                plantsRequired: 3,
                moneyRequired: 1500,
                reward: 250,
                message: "Cultiver 3 maïs pour obtenir 250🪙"
            },
            {
                level: 6,
                plantTypeRequired: "tomato",
                plantsRequired: 5,
                toolLevelRequired: {name: "pitchfork", level: 1},
                reward: 300,
                message: "Cultiver 5 tomates pour obtenir 300🪙"
            },
            {
                level: 7,
                plantTypeRequired: "potato",
                plantsRequired: 6,
                toolLevelRequired: {name: "watering-can", level: 1},
                reward: 350,
                message: "Cultiver 6 p. de terre pour obtenir 350🪙"
            },
            {
                level: 8,
                plantsRequired: 30,
                moneyRequired: 2000,
                reward: 400,
                message: "Cultiver 30 plantes pour obtenir 400🪙"
            },
            {
                level: 9,
                plantTypeRequired: "pumpkin",
                plantsRequired: 4,
                toolLevelRequired: {name: "fertilizer", level: 1},
                reward: 500,
                message: "Cultiver 4 citrouilles pour obtenir 500🪙"
            },
            {
                level: 10,
                plantsRequired: 40,
                moneyRequired: 5000,
                reward: 750,
                message: "Cultiver 40 plantes pour obtenir 750🪙"
            }
        ];
        this.reset();
    }

    reset() {
        this.plantsGrown = 0;
        this.moneyEarned = 0;
        this.seedsBought = 0;
        this.plantTypeStats = {
            'basic': 0, 'radish': 0, 'carrot': 0, 'tomato': 0,
            'potato': 0, 'corn': 0, 'pumpkin': 0, 'eggplant': 0
        };
    }

    addPlantGrown(plantType) {
        this.plantsGrown++;
        if (plantType && this.plantTypeStats[plantType] !== undefined) {
            this.plantTypeStats[plantType]++;
        }
        this.checkObjectives();
    }

    addMoneyEarned(amount) {
        this.moneyEarned += amount;
        this.checkObjectives();
    }

    addSeedBought() {
        this.seedsBought++;
    }

    getCurrentObjective() {
        return this.objectives.find(obj => obj.level === this.level);
    }

    checkObjectives() {
        const currentObjective = this.getCurrentObjective();
        if (!currentObjective) return;

        let objectiveCompleted = true;

        // Vérifier les objectifs de nombre de plantes
        if (currentObjective.plantsRequired) {
            const plantCount = currentObjective.plantTypeRequired 
                ? this.plantTypeStats[currentObjective.plantTypeRequired] 
                : this.plantsGrown;
                
            if (plantCount < currentObjective.plantsRequired) {
                objectiveCompleted = false;
            }
        }

        // Vérifier les objectifs d'argent
        if (objectiveCompleted && currentObjective.moneyRequired && player.money < currentObjective.moneyRequired) {
            objectiveCompleted = false;
        }

        // Vérifier les objectifs de niveau d'outil
        if (objectiveCompleted && currentObjective.toolLevelRequired) {
            const { name, level } = currentObjective.toolLevelRequired;
            if (tools.tools[name].level < level) {
                objectiveCompleted = false;
            }
        }

        // Si tous les critères sont remplis, compléter le niveau
        if (objectiveCompleted) {
            this.completeLevel();
        }
    }

    completeLevel() {
        const currentObjective = this.getCurrentObjective();
        player.earnMoney(currentObjective.reward);
        this.level++;
        
        // Jouer le son de passage de niveau
        if (typeof soundManager !== 'undefined') {
            soundManager.play('levelUp');
        }
        
        // Préparer le contenu de la notification
        const nextObjective = this.getCurrentObjective();
        const nextObjectiveText = nextObjective 
            ? `<p>Prochain objectif : ${nextObjective.message}</p>` 
            : '<p>Félicitations ! Vous avez terminé tous les niveaux !</p>';
        
        // Créer et afficher la notification
        const notification = document.createElement('div');
        notification.className = 'level-complete';
        notification.innerHTML = `
            <h3>Niveau ${this.level - 1} Complété ! 🎉</h3>
            <p>Récompense : ${currentObjective.reward}🪙</p>
            ${nextObjectiveText}
        `;
        document.body.appendChild(notification);
        
        // Animer l'apparition et la disparition
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 5000);

        updateUI();
        
        // Animation de changement de niveau
        const currentLevelElement = document.getElementById('current-level');
        if (currentLevelElement) {
            currentLevelElement.classList.add('level-up');
            setTimeout(() => currentLevelElement.classList.remove('level-up'), 1000);
        }
    }

    getStats() {
        return {
            plantsGrown: this.plantsGrown,
            moneyEarned: this.moneyEarned,
            seedsBought: this.seedsBought,
            plantTypeStats: this.plantTypeStats,
            level: this.level,
            currentObjective: this.getCurrentObjective()
        };
    }

    getObjectiveProgress() {
        const currentObjective = this.getCurrentObjective();
        if (!currentObjective) return 100; // Si plus d'objectifs, considérer comme 100%

        let progress = {};

        // Calculer les différents critères de progression
        if (currentObjective.plantsRequired) {
            const plantCount = currentObjective.plantTypeRequired
                ? (this.plantTypeStats[currentObjective.plantTypeRequired] || 0)
                : this.plantsGrown;
            progress.plants = Math.min(100, Math.floor((plantCount / currentObjective.plantsRequired) * 100));
        }

        if (currentObjective.moneyRequired) {
            progress.money = Math.min(100, Math.floor((player.money / currentObjective.moneyRequired) * 100));
        }

        if (currentObjective.toolLevelRequired) {
            const { name, level } = currentObjective.toolLevelRequired;
            progress.tool = tools.tools[name].level >= level ? 100 : 0;
        }

        // Calculer la moyenne de progression
        const values = Object.values(progress);
        return values.length ? Math.floor(values.reduce((a, b) => a + b, 0) / values.length) : 100;
    }
}

// Créer une instance globale
const gameStats = new GameStats();