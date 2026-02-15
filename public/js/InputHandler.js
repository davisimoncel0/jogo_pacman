import { DIR } from './constants.js';

/**
 * Handles keyboard input for controlling Pac-Man.
 */
export class InputHandler {
  /**
   * @param {import('./PacMan.js').PacMan} pacman - Reference to Pac-Man instance
   */
  constructor() {
    this._pacman = null;
    this._enabled = false;

    document.addEventListener('keydown', (e) => this._onKeyDown(e));
    this._initTouch();
  }

  /** Bind to a Pac-Man instance. */
  bind(pacman) {
    this._pacman = pacman;
  }

  /** Enable or disable input. */
  setEnabled(enabled) {
    this._enabled = enabled;
  }

  /** @private */
  _initTouch() {
    const directions = {
      'touch-up': DIR.UP,
      'touch-down': DIR.DOWN,
      'touch-left': DIR.LEFT,
      'touch-right': DIR.RIGHT
    };

    Object.entries(directions).forEach(([id, dir]) => {
      const btn = document.getElementById(id);
      if (btn) {
        // Usamos pointerdown para melhor resposta em mobile
        btn.addEventListener('pointerdown', (e) => {
          if (!this._enabled || !this._pacman) return;
          this._pacman.nextDir = dir;
          e.preventDefault();
        });
      }
    });
  }

  /** @private */
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
