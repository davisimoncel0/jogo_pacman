import { GameEngine } from './GameEngine.js';

/**
 * Application entry point.
 * Initializes the game engine when the DOM is ready.
 */
document.addEventListener('DOMContentLoaded', () => {
  const game = new GameEngine();
  // Expose for debugging if needed
  window.__pacmanGame = game;
});
