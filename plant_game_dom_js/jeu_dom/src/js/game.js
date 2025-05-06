const GAME_DURATION = 300; // 5 minutes en secondes

// Variables d'état du jeu
let isPaused = false;
let isGameOver = false;

const SEEDS = {
    'basic': {
        price: 0,
        reward: 5,
        growthTime: 2000,
        stages: ["🌱", "🌿", "🌿"],
        name: "Herbe basique"
    },
    'radish': {
        price: 8,
        reward: 15,
        growthTime: 2500,
        stages: ["🥬", "🌱", "🥬"],
        name: "Radis"
    },
    'carrot': {
        price: 15,
        reward: 25,
        growthTime: 3000,
        stages: ["🥕", "🌱", "🥕"],
        name: "Carotte"
    },
    'tomato': {
        price: 25,
        reward: 40,
        growthTime: 4000,
        stages: ["🍅", "🌱", "🍅"],
        name: "Tomate"
    },
    'potato': {
        price: 35,
        reward: 55,
        growthTime: 5000,
        stages: ["🥔", "🌱", "🥔"],
        name: "Pomme de terre"
    },
    'corn': {
        price: 45,
        reward: 70,
        growthTime: 6000,
        stages: ["🌽", "🌱", "🌽"],
        name: "Maïs"
    },
    'pumpkin': {
        price: 60,
        reward: 90,
        growthTime: 7000,
        stages: ["🎃", "🌱", "🎃"],
        name: "Citrouille"
    },
    'eggplant': {
        price: 75,
        reward: 110,
        growthTime: 8000,
        stages: ["🍆", "🌱", "🍆"],
        name: "Aubergine"
    }
};

const player = new Player();
const garden = new Garden();
const tools = new Tools();

// Fonction pour mettre à jour l'interface utilisateur
function updateUI() {
    try {
        // Mise à jour des statistiques du joueur
        const moneyElement = document.getElementById("money");
        if (moneyElement) {
            moneyElement.textContent = player.money;
            moneyElement.classList.add('updating');
            setTimeout(() => moneyElement.classList.remove('updating'), 300);
        }
        
        document.getElementById("seeds").textContent = player.seeds;
        
        // Mise à jour du niveau et de l'objectif
        const currentLevel = document.getElementById("current-level");
        const currentObjective = document.getElementById("current-objective");
        
        if (currentLevel && currentObjective) {
            currentLevel.textContent = gameStats.level;
            
            const objective = gameStats.getCurrentObjective();
            if (objective) {
                currentObjective.textContent = objective.message;
                
                // Progression de l'objectif
                const progress = gameStats.getObjectiveProgress();
                const oldProgress = currentObjective.getAttribute('data-progress') || '0%';
                const newProgress = `${progress}%`;
                
                currentObjective.setAttribute('data-progress', newProgress);
                updateObjectiveProgressBar(currentObjective, progress);
                
                // Animer uniquement si la progression a changé
                if (oldProgress !== newProgress) {
                    currentObjective.classList.add('updating');
                    setTimeout(() => currentObjective.classList.remove('updating'), 600);
                }
                
                // Couleur basée sur la progression
                currentObjective.style.color = progress < 30 ? '#e53935' : 
                                              progress < 70 ? '#fb8c00' : '#43a047';
            } else {
                currentObjective.textContent = "Tous les objectifs complétés !";
                currentObjective.style.color = '#8e24aa';
                updateObjectiveProgressBar(currentObjective, 100);
            }
        }
    
        // Mise à jour des prix d'améliorations des outils
        ['pitchfork', 'watering-can'].forEach(tool => {
            const upgradeButton = document.getElementById(`${tool}-upgrade`);
            if (upgradeButton) {
                if (tools.canUpgrade(tool)) {
                    const price = tools.tools[tool].getUpgradePrice();
                    upgradeButton.textContent = `⬆️ Améliorer (${price} 🪙)`;
                    
                    const canAfford = player.money >= price;
                    upgradeButton.disabled = !canAfford;
                    upgradeButton.classList.toggle('cannot-afford', !canAfford);
                } else {
                    upgradeButton.textContent = 'Niveau Max';
                    upgradeButton.disabled = true;
                    upgradeButton.classList.remove('cannot-afford');
                }
            }
        });
    
        // Mise à jour du bouton d'achat de champ
        const currentFields = document.querySelectorAll('.plot').length;
        const fieldsPurchased = currentFields - 9;
        
        const buyFieldButton = document.getElementById('buy-field');
        if (buyFieldButton) {
            if (fieldsPurchased >= 3) {
                buyFieldButton.textContent = "Maximum de champs atteint";
                buyFieldButton.disabled = true;
                buyFieldButton.classList.remove('cannot-afford');
            } else {
                const newFieldPrice = calculateNewFieldPrice();
                buyFieldButton.textContent = `🌱 Acheter un nouveau champ (${newFieldPrice} 🪙)`;
                
                const canAfford = player.money >= newFieldPrice;
                buyFieldButton.disabled = !canAfford;
                buyFieldButton.classList.toggle('cannot-afford', !canAfford);
            }
        }

        // Mise à jour de l'apparence des graines
        Object.entries(SEEDS).forEach(([seedType, seedData]) => {
            if (seedData.price > 0) {
                const seedElement = document.getElementById(`${seedType}-seed`);
                if (seedElement) {
                    seedElement.classList.toggle('cannot-afford', player.money < seedData.price);
                }
            }
        });
        
        // Vérification des outils payants
        const toolElements = {
            'fertilizer': tools.tools.fertilizer.useCost,
            'weed-cutter': tools.tools['weed-cutter'].useCost,
            'auto-water': tools.tools['auto-water'].useCost
        };
        
        Object.entries(toolElements).forEach(([toolId, cost]) => {
            const element = document.getElementById(toolId);
            if (element) {
                element.classList.toggle('cannot-afford', player.money < cost);
            }
        });
        
        // Mettre à jour l'indicateur de meilleure graine et compteurs d'outils
        updateBestSeedIndicator();
        updateToolCounts();
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'UI:", error);
    }
}

function calculateNewFieldPrice() {
    const currentFields = document.querySelectorAll('.plot').length;
    
    // Pour le premier achat (9 plots de départ), prix fixe à 450
    if (currentFields <= 9) {
        return 450;
    }
    
    // Pour les achats suivants, augmentation progressive plus agressive
    // On soustrait 9 pour commencer à compter à partir du premier achat
    const fieldsPurchased = currentFields - 9;
    return 450 * (1 + fieldsPurchased * 0.8);
}

function buyNewField() {
    const currentFields = document.querySelectorAll('.plot').length;
    const fieldsPurchased = currentFields - 9; // Nombre de champs achetés au-delà des 9 de départ
    
    // Vérifier si le joueur a déjà acheté 3 champs supplémentaires
    if (fieldsPurchased >= 3) {
        showError("Vous avez atteint la limite maximum de 12 champs !");
        soundManager.play('error');
        return false;
    }
    
    const newFieldPrice = calculateNewFieldPrice();
    
    if (player.money >= newFieldPrice) {
        player.money -= newFieldPrice;
        
        // Mise à jour immédiate de l'affichage de l'argent
        document.getElementById("money").textContent = player.money;
        
        addNewField();
        soundManager.play('success');
        
        updateUI();
        
        // Désactiver le bouton d'achat si on atteint la limite de 3 champs supplémentaires
        if (fieldsPurchased + 1 >= 3) {
            const buyFieldButton = document.getElementById('buy-field');
            if (buyFieldButton) {
                buyFieldButton.disabled = true;
                buyFieldButton.textContent = "Maximum de champs atteint";
            }
        }
        
        return true;
    } else {
        showError(`Vous n'avez pas assez d'argent ! (Coût: ${newFieldPrice} 🪙)`);
        soundManager.play('error');
        return false;
    }
}

function addNewField() {
    const field = document.querySelector('.field');
    const newPlot = document.createElement('div');
    newPlot.className = 'plot';
    newPlot.setAttribute('ondrop', 'drop(event)');
    newPlot.setAttribute('ondragover', 'allowDrop(event)');
    field.appendChild(newPlot);

    // Ajuster la grille en fonction du nombre de parcelles
    const plotCount = field.children.length;
    const columns = Math.ceil(Math.sqrt(plotCount));
    field.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    // Animation pour le nouveau champ
    setTimeout(() => {
        newPlot.style.opacity = '0';
        newPlot.style.animation = 'fadeIn 0.5s ease-out forwards';
        newPlot.style.animationDelay = '0.1s';
    }, 10);
    
    // Ajuster les dimensions du conteneur selon le nombre de champs
    adjustFieldContainerDimensions(plotCount);
}

// Fonction pour ajuster les dimensions du conteneur de champs
function adjustFieldContainerDimensions(plotCount) {
    const fieldContainer = document.querySelector('.field-container');
    const field = document.querySelector('.field');
    
    // Calculer les colonnes
    const columns = Math.ceil(Math.sqrt(plotCount));
    
    // Si nous avons plus de 9 champs (3x3 grid), ajuster la taille du conteneur
    if (plotCount > 9) {
        // Ajouter une classe pour des styles spécifiques
        field.classList.add('expanded');
        
        // Ajuster la largeur du champ selon le nombre de colonnes
        if (columns > 3) {
            field.style.maxWidth = `${520 + (columns - 3) * 50}px`;
            field.style.width = `${85 + (columns - 3) * 2}%`;
        }
        
        // Ajuster la hauteur minimale du conteneur selon le nombre de lignes
        const rows = Math.ceil(plotCount / columns);
        if (rows > 3) {
            const heightIncrease = (rows - 3) * 40; // 40px par ligne supplémentaire
            const currentMinHeight = parseInt(window.getComputedStyle(fieldContainer).minHeight);
            fieldContainer.style.minHeight = `${currentMinHeight + heightIncrease}px`;
            
            // S'assurer que le padding en bas est suffisant avec plus de champs
            field.style.paddingBottom = `${100 + (rows - 3) * 20}px`;
        }
        
        // Faire défiler vers le bas pour montrer les nouveaux champs
        setTimeout(() => {
            fieldContainer.scrollTop = fieldContainer.scrollHeight;
            
            // Vérifier si le conteneur a besoin de défilement
            checkContainerOverflow(fieldContainer);
        }, 100);
    }
}

// Fonction pour vérifier s'il y a débordement et ajouter une classe en conséquence
function checkContainerOverflow(container) {
    if (container.scrollHeight > container.clientHeight) {
        container.classList.add('has-overflow');
    } else {
        container.classList.remove('has-overflow');
    }
}

const timer = new GameTimer(
    GAME_DURATION,
    (timeString) => {
        const timerElement = document.getElementById('timer');
        timerElement.textContent = timeString;
        // Ajouter une animation quand il reste peu de temps
        if (timer.remaining <= 60) {
            timerElement.style.color = '#f44336';
            timerElement.style.animation = 'pulse-text 0.5s infinite alternate';
        }
    },
    showGameOver
);

function showGameOver() {
    isGameOver = true;
    const stats = player.getStats();
    const gameOverScreen = document.getElementById('gameOver');
    const finalStats = document.getElementById('finalStats');
    
    // Calculer l'efficacité du fertilisant
    const fertilizerEfficiency = stats.fertilizersUsed > 0 
        ? Math.round(stats.fertilizedPlantsBonusEarnings / stats.fertilizersUsed) 
        : 0;
    
    // Calculer l'efficacité de l'arroseur automatique
    const autoWaterEfficiency = stats.autoWaterUsed > 0
        ? Math.round(stats.autoWateredPlants / stats.autoWaterUsed)
        : 0;
    
    // Trouver la plante la plus cultivée
    let mostGrownPlant = { type: "aucune", count: 0 };
    for (const [type, count] of Object.entries(stats.plantTypes)) {
        if (count > mostGrownPlant.count) {
            mostGrownPlant = { type, count };
        }
    }
    
    // Traduire le type de plante
    const plantEmojis = {
        'basic': '🌱 Herbe basique',
        'radish': '🥬 Radis',
        'carrot': '🥕 Carotte',
        'tomato': '🍅 Tomate',
        'potato': '🥔 Pomme de terre',
        'corn': '🌽 Maïs',
        'pumpkin': '🎃 Citrouille',
        'eggplant': '🍆 Aubergine'
    };
    
    const mostGrownPlantName = plantEmojis[mostGrownPlant.type] || mostGrownPlant.type;
    
    finalStats.innerHTML = `
        <h3>Statistiques finales</h3>
        <p><span>💰 Or final</span> <span>${stats.money} 🪙</span></p>
        <p><span>🌱 Total de plantes cultivées</span> <span>${stats.totalPlants}</span></p>
        <p><span>💵 Gains totaux</span> <span>${stats.totalEarnings} 🪙</span></p>
        <p><span>📊 Niveau atteint</span> <span>${gameStats.level}</span></p>
        <p><span>🏆 Plante favorite</span> <span>${mostGrownPlantName} (${mostGrownPlant.count})</span></p>
        
        <h4>Statistiques des outils</h4>
        <p><span>🔪 Niveau fourche</span> <span>${tools.tools.pitchfork.level}</span></p>
        <p><span>💧 Niveau arrosoir</span> <span>${tools.tools['watering-can'].level}</span></p>
        <p><span>🌿 Fertilisants utilisés</span> <span>${stats.fertilizersUsed}</span></p>
        <p><span>💰 Bonus par fertilisants</span> <span>${stats.fertilizedPlantsBonusEarnings} 🪙</span></p>
        <p><span>⚡ Efficacité fertilisant</span> <span>${fertilizerEfficiency} 🪙/unité</span></p>
        <p><span>✂️ Utilisations désherbeur</span> <span>${stats.weedCutterUsed}</span></p>
        <p><span>🚿 Utilisations arroseur auto</span> <span>${stats.autoWaterUsed}</span></p>
        <p><span>🌱 Plantes arrosées auto</span> <span>${stats.autoWateredPlants}</span></p>
        <p><span>⚡ Efficacité arroseur</span> <span>${autoWaterEfficiency} plantes/usage</span></p>
    `;
    
    // Masquer et désactiver les éléments de l'interface
    document.querySelectorAll('.plant-info-panel, .seed-info-button, .level-complete, .daily-reset-notification, .help-button, #error-message').forEach(element => {
        if (element) element.style.display = 'none';
    });
    
    // Désactiver les interactions avec l'interface
    document.querySelectorAll('.side-panel, .field-container, .tools-container').forEach(panel => {
        panel.style.opacity = '0.5';
        panel.style.pointerEvents = 'none';
    });
    
    // Afficher l'écran de fin de partie
    gameOverScreen.style.display = 'block';
    
    // Placer l'overlay de fin de jeu au-dessus de tout
    document.querySelector('.game-over-overlay').style.zIndex = '10000';
    document.querySelector('.game-over-content').style.zIndex = '10001';
    
    // Sons de fin de partie
    soundManager.stopBackgroundMusic();
    soundManager.play('gameOver');
    
    // Sauvegarder le score dans le classement
    saveScoreToLeaderboard(stats.money);
}

// Fonction pour sauvegarder un score dans le classement
function saveScoreToLeaderboard(score) {
    // Récupérer le classement existant ou créer un tableau vide
    let leaderboard = JSON.parse(localStorage.getItem('gardenSimulatorLeaderboard')) || [];
    
    // Ajouter le nouveau score au classement
    leaderboard.push({
        score: score,
        date: new Date().toISOString(),
        playerName: localStorage.getItem('playerName') || 'Jardinier anonyme'
    });
    
    // Trier le classement et garder les 10 meilleurs scores
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    
    // Sauvegarder le classement et le dernier score
    localStorage.setItem('gardenSimulatorLeaderboard', JSON.stringify(leaderboard));
    localStorage.setItem('gardenSimulatorLastScore', score);
    
    // Mettre à jour l'affichage
    updateLeaderboardDisplay(leaderboard);
}

// Fonction pour récupérer le classement
function getLeaderboard() {
    return JSON.parse(localStorage.getItem('gardenSimulatorLeaderboard')) || [];
}

// Fonction pour afficher le classement sur l'écran de fin de jeu
function updateLeaderboardDisplay(leaderboard) {
    const finalStats = document.getElementById('finalStats');
    
    if (finalStats && leaderboard.length > 0) {
        const currentScore = player.money;
        const playerRank = leaderboard.findIndex(entry => entry.score === currentScore) + 1;
        
        let leaderboardHTML = `
            <h4>🏆 Classement</h4>
            <div class="leaderboard-container">
        `;
        
        if (playerRank > 0) {
            leaderboardHTML += `<p><span>Votre position</span> <span>${playerRank}/${leaderboard.length}</span></p>`;
        }
        
        // Afficher les 3 meilleurs scores
        leaderboard.slice(0, 3).forEach((entry, index) => {
            const isCurrent = entry.score === currentScore;
            leaderboardHTML += `
                <p class="${isCurrent ? 'current-score' : ''}">
                    <span>${index + 1}. ${entry.playerName}</span>
                    <span>${entry.score} 🪙</span>
                </p>
            `;
        });
        
        leaderboardHTML += `</div>`;
        finalStats.innerHTML += leaderboardHTML;
    }
}

// Fonction pour afficher le modal de classement complet
function showLeaderboard() {
    const leaderboardModal = document.getElementById('leaderboardModal');
    const leaderboardContent = document.getElementById('leaderboardContent');
    const leaderboard = getLeaderboard();
    
    if (leaderboard.length === 0) {
        leaderboardContent.innerHTML = '<p>Aucun score enregistré pour le moment.</p>';
    } else {
        let html = `
            <div class="leaderboard-container full-view">
                <p class="leaderboard-header">
                    <span>Rang</span>
                    <span>Joueur</span>
                    <span>Score</span>
                    <span>Date</span>
                </p>
        `;
        
        leaderboard.forEach((entry, index) => {
            const date = new Date(entry.date).toLocaleDateString();
            html += `
                <p class="leaderboard-row">
                    <span class="rank-badge rank-${index + 1}">${index + 1}</span>
                    <span>${entry.playerName}</span>
                    <span>${entry.score} 🪙</span>
                    <span>${date}</span>
                </p>
            `;
        });
        
        html += '</div>';
        leaderboardContent.innerHTML = html;
    }
    
    // Afficher le modal et mettre le jeu en pause
    leaderboardModal.classList.add('show');
    if (timer && timer.isRunning) isPaused = true;
}

// Fonction simplifiée pour masquer le modal de classement
function hideLeaderboard() {
    document.getElementById('leaderboardModal').classList.remove('show');
    if (isPaused && !isGameOver) isPaused = false;
}

// Fonctions de drag & drop avec retour visuel
function allowDrop(event) {
    event.preventDefault();
    const target = event.target.closest('.plot') || event.target;
    
    if (target.classList.contains('plot')) {
        target.setAttribute('data-can-drop', 'true');
    }
}

function drag(event) {
    const seedType = event.target.getAttribute('data-seed-type');
    event.dataTransfer.setData("text", event.target.id);
    if (seedType) {
        event.dataTransfer.setData("seed-type", seedType);
    }
    event.target.classList.add('dragging');
}

function drop(event) {
    event.preventDefault();
    const item = event.dataTransfer.getData("text");
    const seedType = event.dataTransfer.getData("seed-type");
    const target = event.target.closest('.plot') || event.target;
    
    // Retirer les effets visuels
    document.querySelectorAll('.plot').forEach(plot => {
        plot.style.boxShadow = '';
        plot.removeAttribute('data-can-drop');
    });
    
    const draggedElement = document.getElementById(item);
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }

    if (!target.classList.contains("plot")) return;

    // Traitement selon le type d'élément déposé
    if (seedType) { // Graine
        if (!target.getAttribute("data-plowed")) {
            showError("Vous devez d'abord labourer la terre !");
            soundManager.play('error');
            return;
        }
        
        if (target.getAttribute("data-state")) {
            showError("Ce champ est déjà occupé par une plante !");
            soundManager.play('error');
            return;
        }
        
        const seedPrice = SEEDS[seedType].price;
        if (player.money >= seedPrice) {
            player.money -= seedPrice;
            garden.plantSeed(target, seedType);
            soundManager.play('plant');
            player.trackPlantType(seedType);
            
            document.getElementById("money").textContent = player.money;
            updateUI();
        } else {
            showError("Vous n'avez pas assez d'argent pour acheter cette graine !");
            soundManager.play('error');
        }
    }
    else if (item === "pitchfork") {
        if (!target.hasChildNodes() && !target.getAttribute("data-plowed")) {
            if (garden.plowPlot(target)) {
                soundManager.play('plow');
            }
        }
    }
    else if (item === "watering-can") {
        if (target.getAttribute("data-state") === "seeded") {
            const plant = target.querySelector('.plant');
            if (plant && plant.classList.contains('needs-water')) {
                garden.growPlant(target);
                soundManager.play('water');
            } else {
                showError("Cette plante n'a pas besoin d'eau actuellement!");
                soundManager.play('error');
            }
        } else {
            showError("Vous devez arroser une plante fraîchement semée!");
            soundManager.play('error');
        }
    }
    else if (item === "fertilizer") {
        const isPlantPresent = target.getAttribute("data-state") === "seeded" || target.getAttribute("data-state") === "growing";
        const isNotFertilized = target.getAttribute("data-fertilized") !== "true";
        
        if (isPlantPresent) {
            if (isNotFertilized) {
                if (tools.canUseTool('fertilizer')) {
                    if (tools.useFertilizer(target)) {
                        soundManager.play('success');
                        updateUI();
                    }
                } else {
                    showError(`Pas assez d'argent ! Le fertilisant coûte ${tools.tools.fertilizer.useCost} 🪙`);
                    soundManager.play('error');
                }
            } else {
                showError("Cette parcelle est déjà fertilisée !");
                soundManager.play('error');
            }
        } else {
            showError("Vous devez d'abord planter une graine avant de fertiliser !");
            soundManager.play('error');
        }
    }
}

function upgradeTools(toolName) {
    const price = tools.tools[toolName].getUpgradePrice();
    
    if (player.money >= price && tools.canUpgrade(toolName)) {
        player.money -= price;
        
        // Mise à jour immédiate de l'affichage de l'argent
        document.getElementById("money").textContent = player.money;
        
        // Améliorer l'outil
        if (tools.upgrade(toolName)) {
        soundManager.play('upgrade');
            
            // Mise à jour de l'interface
        updateUI();
            
            // Si le panneau d'information est ouvert, le mettre à jour
            const infoPanel = document.getElementById('plant-info-panel');
            if (infoPanel.classList.contains('show')) {
                // Rechercher le type de graine actuellement affiché
                const seedType = document.querySelector('.plant-emoji').textContent;
                
                // Chercher quel type de graine correspond à cet emoji
                for (const type in SEEDS) {
                    if (SEEDS[type].stages[SEEDS[type].stages.length - 1] === seedType) {
                        showPlantInfo(type);
                        break;
                    }
                }
            }
            
            return true;
        }
    } else {
        // Montrer un message d'erreur si le joueur n'a pas assez d'argent
        if (player.money < price) {
            showError(`Vous n'avez pas assez d'argent ! (Coût: ${price} 🪙)`);
            soundManager.play('error');
        } else {
            showError(`${toolName} a déjà atteint son niveau maximum !`);
            soundManager.play('error');
        }
        return false;
    }
}

function showError(message) {
    const errorElement = document.getElementById("error-message");
    if (!errorElement) return;
    
    // Arrêter toute animation en cours et réinitialiser le style
    errorElement.classList.remove('show-error');
    
    // Rendre l'élément visible
    errorElement.style.display = "block";
    errorElement.textContent = message;
    
    // Force un reflow pour s'assurer que les changements précédents sont appliqués
    void errorElement.offsetWidth;
    
    // Déclencher l'animation immédiatement
    errorElement.classList.add('show-error');
    
    // Masquer le message après un délai
    setTimeout(() => {
        errorElement.classList.remove('show-error');
        setTimeout(() => {
            errorElement.style.display = "none";
        }, 300);
    }, 3000);
}

function buySeed(seedType) {
    const seedData = SEEDS[seedType];
    if (player.money >= seedData.price) {
        // Déduire le coût de la graine directement
        player.money -= seedData.price;
        
        // Logique pour planter la graine dans le champ
        const targetPlot = document.querySelector('.plot[data-can-drop="true"]');
        if (targetPlot) {
            garden.plantSeed(targetPlot, seedType);
            soundManager.play('plant');
            updateUI();
        } else {
            // Rembourser le joueur si aucun champ n'est sélectionné
            player.money += seedData.price;
            showError("Vous devez d'abord sélectionner un champ !");
        }
    } else {
        showError("Vous n'avez pas assez d'argent pour acheter cette graine !");
    }
}

// Fonction pour vérifier si le joueur peut acheter un nouveau champ
function checkFieldButtonAffordability() {
    const newFieldPrice = calculateNewFieldPrice();
    const buyFieldButton = document.getElementById('buy-field');
    if (buyFieldButton) {
        const canAfford = player.money >= newFieldPrice;
        buyFieldButton.disabled = !canAfford;
        buyFieldButton.classList.toggle('cannot-afford', !canAfford);
    }
}

// Fonction pour afficher les informations détaillées sur une plante
function showPlantInfo(seedType) {
    const seedData = SEEDS[seedType];
    const infoPanel = document.getElementById('plant-info-panel');
    
    // Créer ou récupérer l'overlay
    let overlay = document.querySelector('.plant-info-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'plant-info-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', closePlantInfo);
    }
    
    // Afficher l'overlay
    overlay.classList.add('active');
    
    // Calculer les valeurs actuelles avec les multiplicateurs des outils
    const pitchforkMultiplier = tools.getMultiplier('pitchfork');
    const actualReward = Math.round(seedData.reward * pitchforkMultiplier);
    const profit = actualReward - seedData.price;
    
    const baseGrowthTime = seedData.growthTime / 1000;
    const growthTimeFactor = Math.pow(0.8, tools.tools['watering-can'].level);
    const actualGrowthTime = (baseGrowthTime * growthTimeFactor).toFixed(1);
    
    // Mettre à jour les informations de base
    document.querySelector('.plant-emoji').textContent = seedData.stages[seedData.stages.length - 1];
    document.querySelector('.plant-name').textContent = seedData.name;
    document.getElementById('plant-price').textContent = seedData.price === 0 ? 'Gratuit' : `${seedData.price} 🪙`;
    document.getElementById('plant-reward').textContent = `${actualReward} 🪙`;
    document.getElementById('plant-time').textContent = `${actualGrowthTime}s`;
    
    // Mettre à jour le profit avec classe conditionnelle
    const profitElement = document.getElementById('plant-profit');
    profitElement.textContent = `${profit} 🪙`;
    profitElement.className = profit > 20 ? 'info-value highlight-profit' : 'info-value';
    
    // Générer les étapes de croissance
    const growthStagesContainer = document.querySelector('.growth-stages');
    growthStagesContainer.innerHTML = '';
    
    seedData.stages.forEach((stage, index) => {
        growthStagesContainer.innerHTML += `
            <div class="stage-item">
                <div class="stage-emoji">${stage}</div>
                <div class="stage-label">${index === 0 ? 'Début' : (index === seedData.stages.length - 1 ? 'Maturité' : `Étape ${index}`)}</div>
            </div>
        `;
    });
    
    // Mettre à jour les impacts des améliorations
    document.getElementById('current-reward').textContent = `${actualReward} 🪙`;
    document.getElementById('current-time').textContent = `${actualGrowthTime}s`;
    
    // Impact des améliorations futures
    if (tools.tools.pitchfork.level < tools.tools.pitchfork.maxLevel) {
        const nextLevelMultiplier = 1 + ((tools.tools.pitchfork.level + 1) * 0.1);
        const nextLevelReward = Math.round(seedData.reward * nextLevelMultiplier);
        document.getElementById('next-reward').textContent = `Niveau suivant: ${nextLevelReward} 🪙`;
    } else {
        document.getElementById('next-reward').textContent = "Niveau maximum atteint";
    }
    
    if (tools.tools['watering-can'].level < tools.tools['watering-can'].maxLevel) {
        const nextLevelFactor = Math.pow(0.8, tools.tools['watering-can'].level + 1);
        const nextLevelTime = (baseGrowthTime * nextLevelFactor).toFixed(1);
        document.getElementById('next-time').textContent = `Niveau suivant: ${nextLevelTime}s`;
    } else {
        document.getElementById('next-time').textContent = "Niveau maximum atteint";
    }
    
    // Mettre à jour les barres de progression
    document.querySelector('.impact-progress').style.width = `${(tools.tools.pitchfork.level / tools.tools.pitchfork.maxLevel * 100)}%`;
    document.querySelector('.watering-progress').style.width = `${(tools.tools['watering-can'].level / tools.tools['watering-can'].maxLevel * 100)}%`;
    
    // Afficher le panneau
    infoPanel.classList.add('show');
    
    // Jouer un son si disponible
    if (typeof soundManager !== 'undefined') {
        soundManager.play('click');
    }
}

// Fonction pour fermer le panneau d'informations
function closePlantInfo() {
    const infoPanel = document.getElementById('plant-info-panel');
    infoPanel.classList.remove('show');
    
    // Masquer l'overlay
    const overlay = document.querySelector('.plant-info-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
    
    // Jouer un son si disponible
    if (typeof soundManager !== 'undefined') {
        soundManager.play('click');
    }
}

// Fonction pour utiliser le désherbeur (activé par clic)
function useWeedCutter() {
    if (!tools.canUseTool('weed-cutter')) {
        if (player.money < tools.tools['weed-cutter'].useCost) {
            showError("Pas assez d'or pour utiliser le désherbeur");
        }
        return;
    }
    
    if (tools.useWeedCutter()) {
        updateUI();
        updateToolCounts();
        soundManager.play('weedcutter');
    } 
}

// Fonction pour utiliser l'arroseur automatique (activé par clic)
function useAutoWater() {
    if (!tools.canUseTool('auto-water')) {
        if (player.money < tools.tools['auto-water'].useCost) {
            showError("Pas assez d'or pour utiliser l'arroseur");
        }
        return;
    }
    
    if (tools.useAutoWater()) {
        updateUI();
        updateToolCounts();
        soundManager.play('water');
    } else {
        showError("Aucune plante à arroser");
    }
}

// Initialisation du jeu
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    timer.start();
    
    // Mettre à jour l'affichage initial des bonus
    tools.updateMultiplierDisplay();
    tools.updateGrowthTimeDisplay();
    
    // Initialiser la grille des champs
    initializeFieldGrid();
    
    // Identifier et mettre en évidence la graine la plus rentable
    updateBestSeedIndicator();
    
    // Ajouter les écouteurs d'événements pour les boutons d'information
    document.querySelectorAll('.seed-info-button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation(); // Empêcher la propagation au parent
            showPlantInfo(event.target.getAttribute('data-seed-type'));
        });
    });
    
    // Ajouter l'écouteur pour fermer le panneau
    document.querySelector('.close-panel').addEventListener('click', closePlantInfo);
    
    // Fermer le panneau si on clique en dehors
    document.getElementById('plant-info-panel').addEventListener('click', (event) => {
        if (event.target === event.currentTarget) {
            closePlantInfo();
        }
    });
    
    // Ajouter l'écouteur pour le désherbeur
    const weedCutterTool = document.getElementById('weed-cutter');
    if (weedCutterTool) {
        weedCutterTool.addEventListener('click', useWeedCutter);
    }
    
    // Ajouter l'écouteur pour l'arroseur automatique
    const autoWaterTool = document.getElementById('auto-water');
    if (autoWaterTool) {
        autoWaterTool.addEventListener('click', useAutoWater);
    }
    
    // Initialiser l'affichage des compteurs d'outils
    updateToolCounts();
});

// Fonction pour initialiser la grille de champs
function initializeFieldGrid() {
    const field = document.querySelector('.field');
    const fieldContainer = document.querySelector('.field-container');
    const plotCount = field.children.length;
    const columns = Math.ceil(Math.sqrt(plotCount));
    
    // Configurer la grille initiale
    field.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    // Appliquer les animations de départ aux parcelles
    field.querySelectorAll('.plot').forEach((plot, index) => {
        plot.style.opacity = '0';
        plot.style.animation = 'fadeIn 0.5s ease-out forwards';
        plot.style.animationDelay = `${0.1 + (index * 0.05)}s`;
    });
    
    // Vérifier si le nombre de parcelles nécessite des ajustements
    if (plotCount > 9) {
        field.classList.add('expanded');
        adjustFieldContainerDimensions(plotCount);
    }
    
    // Vérifier s'il y a débordement du conteneur
    checkContainerOverflow(fieldContainer);
    
    // Ajouter un écouteur d'événement pour mettre à jour l'indicateur de défilement
    fieldContainer.addEventListener('scroll', () => {
        if (fieldContainer.scrollTop + fieldContainer.clientHeight >= fieldContainer.scrollHeight - 10) {
            fieldContainer.classList.remove('has-overflow');
        } else {
            fieldContainer.classList.add('has-overflow');
        }
    });
}

// Fonction pour calculer la rentabilité des graines et les trier
function getMostProfitableSeed() {
    const pitchforkMultiplier = tools.getMultiplier('pitchfork');
    const profitability = [];
    
    for (const type in SEEDS) {
        const seedData = SEEDS[type];
        const reward = Math.round(seedData.reward * pitchforkMultiplier);
        const profit = reward - seedData.price;
        const growthFactor = Math.pow(0.8, tools.tools['watering-can'].level);
        const growthTime = seedData.growthTime * growthFactor;
        const profitPerSecond = (profit / (growthTime / 1000)).toFixed(2);
        
        profitability.push({
            type,
            profit,
            profitPerSecond
        });
    }
    
    // Trier par profit par seconde
    profitability.sort((a, b) => b.profitPerSecond - a.profitPerSecond);
    return profitability[0];
}

// Mettre à jour l'indication du meilleur choix de graine
function updateBestSeedIndicator() {
    const bestSeed = getMostProfitableSeed();
    
    // Retirer toute mise en évidence précédente
    document.querySelectorAll('.seed-item').forEach(item => {
        item.classList.remove('best-seed');
    });
    
    // Ajouter la mise en évidence à la meilleure graine
    const seedElement = document.querySelector(`.seed[data-seed-type="${bestSeed.type}"]`);
    if (seedElement) {
        seedElement.closest('.seed-item').classList.add('best-seed');
    }
}

// Mettre à jour les compteurs et indicateurs des outils
function updateToolCounts() {
    // Mettre à jour l'affichage des compteurs pour le désherbeur et l'arroseur
    if (tools) {
        // Mettre à jour le désherbeur
        const weedCutterCount = document.getElementById('weed-cutter-count');
        if (weedCutterCount) {
            weedCutterCount.textContent = `∞`;
            
            // Mettre en évidence si le joueur ne peut plus utiliser l'outil
            const weedCutterTool = document.getElementById('weed-cutter');
            if (weedCutterTool) {
                weedCutterTool.classList.toggle('tool-unavailable', 
                    player.money < tools.tools['weed-cutter'].useCost);
            }
        }
        
        // Mettre à jour l'arroseur automatique
        const autoWaterCount = document.getElementById('auto-water-count');
        if (autoWaterCount) {
            autoWaterCount.textContent = `∞`;
            
            // Mettre en évidence si le joueur ne peut plus utiliser l'outil
            const autoWaterTool = document.getElementById('auto-water');
            if (autoWaterTool) {
                autoWaterTool.classList.toggle('tool-unavailable', 
                    player.money < tools.tools['auto-water'].useCost);
            }
        }
        
        // Mettre à jour l'apparence du fertilisant en fonction du prix
        const fertilizerTool = document.getElementById('fertilizer');
        if (fertilizerTool) {
            fertilizerTool.classList.toggle('tool-unavailable', player.money < tools.tools.fertilizer.useCost);
        }
    }
}

// Fonction pour mettre à jour la barre de progression visuelle
function updateObjectiveProgressBar(objectiveElement, progress) {
    // Accéder à l'élément parent qui contient la stat-item
    const statItem = objectiveElement.closest('.stat-item.objective');
    if (statItem) {
        // Utiliser une propriété CSS personnalisée pour la progression
        statItem.style.setProperty('--objective-progress', `${progress}%`);
        
        // Ajouter un indicateur visuel de complétion
        if (progress >= 100) {
            statItem.classList.add('objective-completed');
        } else {
            statItem.classList.remove('objective-completed');
        }
    }
}