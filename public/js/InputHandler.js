import { DIR } from './constants.js';

/**
 * Gerenciador de Inputs do jogo.
 * Responsável por capturar e direcionar as entradas do jogador ao Pac-Man.
 * Suporta três modos de controle:
 *  1. Teclado (setas e WASD) — para desktop
 *  2. Joystick virtual (botões touch) — para mobile
 *  3. Gestos de deslizar (swipe) — alternativa mobile sem botões
 */
export class InputHandler {

  /**
   * Inicializa o InputHandler, registrando listeners para
   * teclado, botões touch e gestos de swipe.
   */
  constructor() {
    /** @private Referência ao Pac-Man que está sendo controlado */
    this._pacman = null;

    /** @private Se o input está habilitado (desabilitado durante transições) */
    this._enabled = false;

    // Registra os três tipos de entrada
    document.addEventListener('keydown', (e) => this._onKeyDown(e));
    this._initTouch();
    this._initSwipe();
  }

  /**
   * Inicializa os controles por gesto de deslizar (swipe).
   * Captura o ponto de início e fim do toque para calcular
   * a direção do movimento com base no deslocamento.
   * 
   * Regras:
   *  - O deslocamento mínimo é de 30px (threshold) para evitar toques acidentais
   *  - Se o deslocamento horizontal for maior que o vertical, move para esquerda/direita
   *  - Caso contrário, move para cima/baixo
   */
  _initSwipe() {
    let startX = 0;
    let startY = 0;
    const threshold = 30; // Distância mínima em pixels para detectar um swipe

    // Captura a posição inicial do toque e previne scroll
    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    // Previne scroll durante o gesto e detecta a direção em tempo real
    document.addEventListener('touchmove', (e) => {
      if (!this._enabled || !this._pacman) return;
      
      // Previne o scroll da página durante o jogo
      e.preventDefault();
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const dx = currentX - startX; // Diferença no eixo X
      const dy = currentY - startY; // Diferença no eixo Y

      // Determina se o movimento foi mais horizontal ou vertical
      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > threshold) {
          // Swipe para direita (dx > 0) ou esquerda (dx < 0)
          this._pacman.nextDir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
          // Atualiza ponto de referência para permitir swipes consecutivos
          startX = currentX;
          startY = currentY;
        }
      } else {
        if (Math.abs(dy) > threshold) {
          // Swipe para baixo (dy > 0) ou cima (dy < 0)
          this._pacman.nextDir = dy > 0 ? DIR.DOWN : DIR.UP;
          // Atualiza ponto de referência para permitir swipes consecutivos
          startX = currentX;
          startY = currentY;
        }
      }
    }, { passive: false });
  }

  /**
   * Vincula este InputHandler a uma instância de Pac-Man.
   * Chamado a cada vez que o Pac-Man é recriado (nova fase, perda de vida).
   * @param {import('./PacMan.js').PacMan} pacman - Instância do Pac-Man
   */
  bind(pacman) {
    this._pacman = pacman;
  }

  /**
   * Habilita ou desabilita a captura de input.
   * Desabilitado durante transições de tela e animações.
   * @param {boolean} enabled - true para habilitar, false para desabilitar
   */
  setEnabled(enabled) {
    this._enabled = enabled;
  }

  /**
   * Inicializa os controles do joystick virtual (D-pad).
   * Mapeia cada botão touch (▲ ▼ ◀ ▶) para a direção correspondente.
   * Usa 'pointerdown' ao invés de 'click' para resposta mais rápida no mobile.
   */
  _initTouch() {
    // Mapeamento: ID do botão HTML → direção do jogo
    const directions = {
      'touch-up': DIR.UP,
      'touch-down': DIR.DOWN,
      'touch-left': DIR.LEFT,
      'touch-right': DIR.RIGHT
    };

    Object.entries(directions).forEach(([id, dir]) => {
      const btn = document.getElementById(id);
      if (btn) {
        // pointerdown dispara imediatamente ao tocar, sem esperar soltar
        btn.addEventListener('pointerdown', (e) => {
          if (!this._enabled || !this._pacman) return;
          this._pacman.nextDir = dir;
          e.preventDefault(); // Evita scroll ou zoom indesejado
        });
      }
    });
  }

  /**
   * Processa eventos de tecla pressionada (teclado físico).
   * Suporta setas direcionais e teclas WASD para controle.
   * @param {KeyboardEvent} e - Evento do teclado
   */
  _onKeyDown(e) {
    if (!this._enabled || !this._pacman) return;

    switch (e.key) {
      case 'ArrowUp':    case 'w': case 'W':
        this._pacman.nextDir = DIR.UP;
        e.preventDefault();
        break;
      case 'ArrowDown':  case 's': case 'S':
        this._pacman.nextDir = DIR.DOWN;
        e.preventDefault();
        break;
      case 'ArrowLeft':  case 'a': case 'A':
        this._pacman.nextDir = DIR.LEFT;
        e.preventDefault();
        break;
      case 'ArrowRight': case 'd': case 'D':
        this._pacman.nextDir = DIR.RIGHT;
        e.preventDefault();
        break;
    }
  }
}
