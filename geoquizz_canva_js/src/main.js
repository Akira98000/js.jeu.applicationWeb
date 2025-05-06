import MapModel from './models/MapModel.js';
import CanvasView from './views/CanvasView.js';
import MenuView from './views/MenuView.js';
import GameController from './controllers/GameController.js';

/**
 * Initialise l'application lorsque le DOM est complètement chargé
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('GeoQuizz application starting...');
    
    // Initialiser le Modèle
    const mapModel = new MapModel();
    
    // Initialiser les Vues
    const canvasView = new CanvasView('mapCanvas', 'tooltip');
    const menuView = new MenuView();
    
    // Initialiser le Contrôleur
    const gameController = new GameController(mapModel, canvasView, menuView);
    
    // Initialiser le jeu avec le chemin de la carte SVG
    gameController.init('assets/world.svg').catch(error => {
        console.error('Error initializing game:', error);
    });
    
    // Activer le basculement d'accessibilité (fonctionnalité optionnelle)
    // Ajouter un écouteur d'événements à un bouton de basculement du contraste (si ajouté au HTML)
    const contrastToggle = document.getElementById('contrastToggle');
    if (contrastToggle) {
        contrastToggle.addEventListener('click', () => {
            menuView.toggleHighContrast();
            canvasView.redraw(); // Redessiner la carte avec les nouvelles couleurs
        });
    }
    
    // Ajouter des raccourcis clavier pour l'accessibilité
    document.addEventListener('keydown', (event) => {
        // Alt+H pour basculer le contraste élevé
        if (event.altKey && event.key === 'h') {
            menuView.toggleHighContrast();
            canvasView.redraw();
        }
    });
    
    console.log('GeoQuizz application initialized');
});