import { GameEngine } from './GameEngine.js';

/**
 * Ponto de entrada da aplicação Pac-Man.
 * Aguarda o DOM estar completamente carregado e inicializa o motor do jogo.
 * Expõe a instância do jogo no objeto global `window` para facilitar debug.
 */
document.addEventListener('DOMContentLoaded', () => {
  const game = new GameEngine();
  // Expõe a instância global para debug no console do navegador
  window.__pacmanGame = game;
});
