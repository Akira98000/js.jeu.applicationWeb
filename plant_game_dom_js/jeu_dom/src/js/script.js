// Fonction pour initialiser les animations de défilement
function initScrollAnimations() {
    const scrollContainers = document.querySelectorAll('.scroll-container');
    
    // Ajouter des indicateurs visuels de défilement à chaque conteneur
    scrollContainers.forEach(container => {
        const fragment = document.createDocumentFragment();
        const topIndicator = document.createElement('div');
        topIndicator.className = 'scroll-indicator-top';
        const bottomIndicator = document.createElement('div');
        bottomIndicator.className = 'scroll-indicator-bottom';
        
        fragment.appendChild(topIndicator);
        fragment.appendChild(bottomIndicator);
        container.appendChild(fragment);
        
        // Vérifier si le défilement est possible
        function checkScrollability() {
            const canScroll = container.scrollHeight > container.clientHeight;
            container.classList.toggle('can-scroll', canScroll);
            
            if (canScroll) {
                container.classList.toggle('can-scroll-up', container.scrollTop > 10);
                container.classList.toggle('can-scroll-down', 
                    container.scrollTop + container.clientHeight < container.scrollHeight - 10);
            } else {
                container.classList.remove('can-scroll-up', 'can-scroll-down');
            }
        }
        
        // Vérifier immédiatement et à chaque défilement
        checkScrollability();
        const debouncedCheck = debounceScroll(checkScrollability, 100);
        container.addEventListener('scroll', debouncedCheck);
        window.addEventListener('resize', debouncedCheck);
    });
    
    // Permettre le défilement avec les touches flèches lorsqu'un conteneur est en focus
    document.addEventListener('keydown', (e) => {
        const container = document.activeElement?.closest('.scroll-container');
        if (container) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                container.scrollBy({ 
                    top: e.key === 'ArrowDown' ? 50 : -50, 
                    behavior: 'smooth' 
                });
                e.preventDefault();
            }
        }
    });
}

// Fonction de debounce pour limiter le nombre d'appels
function debounceScroll(func, wait) {
    let timeout;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, arguments), wait);
    };
}

// Tutoriel Drag & Drop
function initTutorial() {
    // Styles pour le tutoriel et le bouton d'aide
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .help-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: #4CAF50;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            cursor: pointer;
            z-index: 900;
            transition: all 0.3s ease;
        }
        
        .help-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 12px rgba(0,0,0,0.25);
        }
        
        .tutorial-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10001;
        }
        
        .drag-tutorial, .name-modal-content {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 480px;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 6px 32px rgba(0, 0, 0, 0.25);
            z-index: 10002;
            overflow: hidden;
        }
        
        .tutorial-header, .name-modal-content h2 {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: #4CAF50;
            color: white;
        }
        
        .tutorial-header h3 {
            margin: 0;
            font-size: 1.3rem;
        }
        
        .close-tutorial {
            background: none;
            border: none;
            font-size: 1.8rem;
            color: white;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        }
        
        .tutorial-content, .name-modal-content {
            padding: 20px;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .tutorial-title {
            text-align: center;
            font-weight: bold;
            font-size: 1.2rem;
            margin: 0 0 15px 0;
            color: #333;
        }
        
        .tutorial-intro {
            text-align: center;
            margin-bottom: 15px;
            color: #555;
            font-size: 0.95rem;
            line-height: 1.4;
        }
        
        .tutorial-steps {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .tutorial-step {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            padding: 8px;
            margin: 0 5px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        
        .tutorial-step:hover {
            background: #f9f9f9;
        }
        
        .step-number {
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        
        .step-icon {
            font-size: 2rem;
            margin: 15px 0 10px;
        }
        
        .step-text {
            font-weight: bold;
            font-size: 0.95rem;
            margin-bottom: 5px;
            color: #333;
            text-align: center;
        }
        
        .step-detail {
            text-align: center;
            color: #666;
            font-size: 0.8rem;
            line-height: 1.2;
        }
        
        .tutorial-instruction {
            text-align: center;
            margin: 15px 0;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 8px;
            color: #333;
            font-weight: bold;
            border-left: 4px solid #4CAF50;
        }
        
        .tutorial-actions {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 15px;
        }
        
        .tutorial-examples {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .example {
            display: flex;
            align-items: center;
            background: #f5f5f5;
            padding: 6px 10px;
            border-radius: 20px;
            font-size: 0.9rem;
            border: 1px solid #e0e0e0;
        }
        
        .example-img {
            width: 24px;
            height: 24px;
            margin-right: 8px;
        }
        
        .example-seed {
            font-size: 1.3rem;
            margin-right: 8px;
        }
        
        .tutorial-got-it, #save-name-button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 25px;
            border-radius: 20px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .tutorial-got-it:hover, #save-name-button:hover {
            transform: translateY(-2px);
        }
        
        .drag-animation {
            position: relative;
            height: 90px;
            margin-top: 15px;
            overflow: hidden;
            border: 1px dashed #ccc;
            border-radius: 8px;
            background: #f9f9f9;
        }
        
        .drag-hand {
            position: absolute;
            font-size: 2rem;
            left: 20%;
            top: 30%;
        }
        
        .drag-item {
            position: absolute;
            font-size: 1.5rem;
            left: 22%;
            top: 25%;
        }
        
        .drag-target {
            position: absolute;
            font-size: 2rem;
            right: 25%;
            top: 30%;
        }
        
        .name-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10002;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .name-modal-content {
            text-align: center;
        }
        
        .name-modal-content h2 {
            margin: 0;
            display: block;
            text-align: center;
        }
        
        #player-name-input {
            display: block;
            width: 100%;
            padding: 12px;
            margin: 15px 0;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 1rem;
        }
    `;
    document.head.appendChild(styleEl);

    // Créer le bouton d'aide
    const helpButton = document.createElement('div');
    helpButton.className = 'help-button';
    helpButton.innerHTML = '❓';
    helpButton.title = 'Comment jouer';
    document.body.appendChild(helpButton);
    
    // Vérifier si l'utilisateur a déjà vu le tutoriel
    let tutorialSeen = false;
    try {
        tutorialSeen = localStorage.getItem('dragDropTutorialSeen') === 'true';
    } catch (e) {
        console.error('Erreur localStorage:', e);
    }
    
    // Fonction pour afficher le tutoriel
    function showTutorial() {
        // Créer l'overlay et le tutoriel
        const overlay = document.createElement('div');
        overlay.className = 'tutorial-overlay';
        
        const tutorial = document.createElement('div');
        tutorial.className = 'drag-tutorial';
        tutorial.innerHTML = `
            <div class="tutorial-header">
                <h3>Comment jouer à Garden Simulator</h3>
                <button class="close-tutorial">×</button>
            </div>
            <div class="tutorial-content">
                <div class="tutorial-intro">
                    Pour cultiver votre jardin, vous devez utiliser la technique du <strong>glisser-déposer</strong> (drag & drop). C'est simple et intuitif !
                </div>
                
                <div class="tutorial-instruction">
                    Pour jardiner, suivez toujours ces 3 étapes dans cet ordre :
                </div>
                
                <div class="tutorial-steps">
                    <div class="tutorial-step">
                        <div class="step-number">1</div>
                        <div class="step-icon">🔨</div>
                        <div class="step-text">Labourer</div>
                        <div class="step-detail">Glissez la fourche sur un champ vide</div>
                    </div>
                    <div class="tutorial-step">
                        <div class="step-number">2</div>
                        <div class="step-icon">🌱</div>
                        <div class="step-text">Planter</div>
                        <div class="step-detail">Glissez une graine sur le champ labouré</div>
                    </div>
                    <div class="tutorial-step">
                        <div class="step-number">3</div>
                        <div class="step-icon">💧</div>
                        <div class="step-text">Arroser</div>
                        <div class="step-detail">Glissez l'arrosoir sur la plante</div>
                    </div>
                </div>
                
                <div class="tutorial-title">Comment faire glisser ?</div>
                
                <div class="tutorial-steps">
                    <div class="tutorial-step">
                        <div class="step-number">A</div>
                        <div class="step-icon">👆</div>
                        <div class="step-text">Appuyez</div>
                        <div class="step-detail">Cliquez et maintenez le bouton enfoncé</div>
                    </div>
                    <div class="tutorial-step">
                        <div class="step-number">B</div>
                        <div class="step-icon">✋</div>
                        <div class="step-text">Déplacez</div>
                        <div class="step-detail">Faites glisser vers le champ cible</div>
                    </div>
                    <div class="tutorial-step">
                        <div class="step-number">C</div>
                        <div class="step-icon">👇</div>
                        <div class="step-text">Relâchez</div>
                        <div class="step-detail">Relâchez pour déposer l'objet</div>
                    </div>
                </div>
                
                <div class="tutorial-instruction">
                    Une fois la plante mature, cliquez simplement dessus pour la récolter !
                </div>
                
                <div class="tutorial-title">Outils spéciaux</div>
                
                <div class="tutorial-steps">
                    <div class="tutorial-step">
                        <div class="step-icon">
                            <img src="./src/assets/fertilizer.png" alt="Fertilisant" style="width: 40px; height: 40px;">
                        </div>
                        <div class="step-text">Fertilisant</div>
                        <div class="step-detail">Glissez-le sur une plante pour augmenter sa valeur à la récolte</div>
                    </div>
                    <div class="tutorial-step">
                        <div class="step-icon">
                            <img src="./src/assets/weed-cutter.png" alt="Désherbeur" style="width: 40px; height: 40px;">
                        </div>
                        <div class="step-text">Désherbeur</div>
                        <div class="step-detail">Cliquez dessus pour labourer toutes les parcelles vides en une fois</div>
                    </div>
                    <div class="tutorial-step">
                        <div class="step-icon">
                            <img src="./src/assets/auto-water.png" alt="Arroseur" style="width: 40px; height: 40px;">
                        </div>
                        <div class="step-text">Arroseur</div>
                        <div class="step-detail">Cliquez dessus pour arroser toutes les plantes qui ont besoin d'eau</div>
                    </div>
                </div>
                
                <div class="tutorial-actions">
                    <div class="tutorial-examples">
                        <div class="example">
                            <img src="./src/assets/pitchfork.png" alt="Fourche" class="example-img">
                            <span>→ Laboure la terre</span>
                        </div>
                        <div class="example">
                            <div class="seed example-seed">🌱</div>
                            <span>→ Plante une graine</span>
                        </div>
                        <div class="example">
                            <img src="./src/assets/watering-can.png" alt="Arrosoir" class="example-img">
                            <span>→ Arrose la plante</span>
                        </div>
                    </div>
                    
                    <div class="tutorial-examples">
                        <div class="example">
                            <img src="./src/assets/fertilizer.png" alt="Fertilisant" class="example-img">
                            <span>→ Augmente le rendement</span>
                        </div>
                        <div class="example">
                            <img src="./src/assets/weed-cutter.png" alt="Désherbeur" class="example-img">
                            <span>→ Laboure tout</span>
                        </div>
                        <div class="example">
                            <img src="./src/assets/auto-water.png" alt="Arroseur" class="example-img">
                            <span>→ Arrose tout</span>
                        </div>
                    </div>
                    
                    <div class="drag-animation">
                        <div class="drag-hand">✋</div>
                        <div class="drag-item">🌱</div>
                        <div class="drag-target">🟫</div>
                    </div>
                    
                    <button class="tutorial-got-it">J'ai compris, commencer à jouer !</button>
                </div>
            </div>
        `;
        
        // Ajouter à la page
        document.body.appendChild(overlay);
        document.body.appendChild(tutorial);
        
        // Fonction pour fermer le tutoriel
        function closeTutorial() {
            try {
                localStorage.setItem('dragDropTutorialSeen', 'true');
            } catch (e) {
                console.error('Erreur localStorage:', e);
            }
            
            overlay.remove();
            tutorial.remove();
            
            // Jouer un son si disponible
            if (typeof soundManager !== 'undefined') {
                soundManager.play('click');
            }
        }
        
        // Ajouter des écouteurs d'événements
        tutorial.querySelector('.close-tutorial').addEventListener('click', closeTutorial);
        tutorial.querySelector('.tutorial-got-it').addEventListener('click', closeTutorial);
        overlay.addEventListener('click', closeTutorial);
    }
    
    // Afficher le tutoriel immédiatement si c'est la première visite
    if (!tutorialSeen) {
        showTutorial();
    }
    
    // Ajouter un écouteur d'événement au bouton d'aide
    helpButton.addEventListener('click', () => {
        showTutorial();
        
        // Jouer un son si disponible
        if (typeof soundManager !== 'undefined') {
            soundManager.play('click');
        }
    });
}

// Demander le nom du joueur au démarrage
function askPlayerName() {
    // Ne pas demander si le nom existe déjà
    if (localStorage.getItem('playerName')) return;
    
    // Créer un modal pour demander le nom
    const modal = document.createElement('div');
    modal.className = 'name-modal';
    modal.innerHTML = `
        <div class="name-modal-content">
            <h2>🏆 Entrez votre nom</h2>
            <p>Votre nom sera utilisé pour le classement des scores.</p>
            <input type="text" id="player-name-input" placeholder="Votre nom..." maxlength="15">
            <button id="save-name-button">Commencer à jouer</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus sur l'input
    setTimeout(() => document.getElementById('player-name-input').focus(), 100);
    
    function savePlayerName() {
        const input = document.getElementById('player-name-input');
        let playerName = input.value.trim() || 'Jardinier anonyme';
        
        localStorage.setItem('playerName', playerName);
        modal.remove();
    }
    
    // Événements de soumission
    document.getElementById('save-name-button').addEventListener('click', savePlayerName);
    document.getElementById('player-name-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') savePlayerName();
    });
}

// Initialiser tout au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
    initTutorial();
    askPlayerName();
});