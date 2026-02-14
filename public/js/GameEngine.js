import { TILE, ROWS, COLS, DOT, POWER, SCORE_GHOST, LEVEL_BONUS, TOTAL_LEVELS, FRIGHTENED_DURATION, SPEED_BOOST_DURATION } from './constants.js';
import { LEVELS } from './levels.js';
import { PacMan } from './PacMan.js';
import { Ghost } from './Ghost.js';
import { Renderer } from './Renderer.js';
import { InputHandler } from './InputHandler.js';
import { RankingService } from './RankingService.js';

/**
 * Main game engine — orchestrates game loop, state, collisions, and screen transitions.
 */
export class GameEngine {
  constructor() {
    // Renderer
    this.renderer = new Renderer(document.getElementById('game-canvas'));

    // Input
    this.input = new InputHandler();

    // DOM elements
    this.$startScreen   = document.getElementById('start-screen');
    this.$gameScreen     = document.getElementById('game-screen');
    this.$prizeScreen    = document.getElementById('prize-screen');
    this.$gameoverScreen = document.getElementById('gameover-screen');
    this.$rankingModal   = document.getElementById('ranking-modal');
    this.$playerName     = document.getElementById('player-name');
    this.$btnStart       = document.getElementById('btn-start');
    this.$hudScore       = document.getElementById('hud-score');
    this.$hudLevel       = document.getElementById('hud-level');
    this.$hudLives       = document.getElementById('hud-lives');
    this.$levelBanner    = document.getElementById('level-banner');
    this.$levelBannerText = document.getElementById('level-banner-text');
    this.$gameMessage    = document.getElementById('game-message');
    this.$finalScore     = document.getElementById('final-score-value');
    this.$prizeTitle     = document.getElementById('prize-title');
    this.$gameoverScore  = document.getElementById('gameover-score-value');
    this.$gameoverLevel  = document.getElementById('gameover-level-value');
    this.$rankingList    = document.getElementById('ranking-list');

    // State
    this.playerName = '';
    this.score = 0;
    this.lives = 3;
    this.level = 0;
    this.map = [];
    this.dotsRemaining = 0;
    this.gameRunning = false;
    this.gamePaused = false;
    this.animFrame = null;
    this.lastTime = 0;
    this.frightenedTimer = 0;

    // Entities
    this.pacman = null;
    this.ghosts = [];

    this._bindEvents();
  }

  /** Bind all UI event listeners. */
  _bindEvents() {
    this.$playerName.addEventListener('input', () => {
      this.$btnStart.disabled = this.$playerName.value.trim().length === 0;
    });

    this.$btnStart.addEventListener('click', () => {
      this.playerName = this.$playerName.value.trim();
      if (this.playerName) this.startGame();
    });

    this.$playerName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.$playerName.value.trim()) {
        this.playerName = this.$playerName.value.trim();
        this.startGame();
      }
    });

    document.getElementById('btn-ranking').addEventListener('click', () => this.showRanking());
    document.getElementById('btn-close-ranking').addEventListener('click', () => {
      this.$rankingModal.classList.add('hidden');
    });

    document.getElementById('btn-save-score').addEventListener('click', () => {
      this._saveAndDisable('btn-save-score');
    });
    document.getElementById('btn-play-again').addEventListener('click', () => {
      this._showScreen(this.$startScreen);
    });
    document.getElementById('btn-save-gameover').addEventListener('click', () => {
      this._saveAndDisable('btn-save-gameover');
    });
    document.getElementById('btn-retry').addEventListener('click', () => {
      this._showScreen(this.$startScreen);
    });
  }

  /** Save score and disable the save button. */
  async _saveAndDisable(btnId) {
    const btn = document.getElementById(btnId);
    btn.disabled = true;
    btn.innerHTML = '<span>✅</span> SALVO!';
    await RankingService.save(this.playerName, this.score, this.level + 1);
    this.showRanking();
  }

  /** Show a screen and hide the others. */
  _showScreen(screen) {
    [this.$startScreen, this.$gameScreen, this.$prizeScreen, this.$gameoverScreen].forEach(s =>
      s.classList.remove('active')
    );
    screen.classList.add('active');
  }

  /** Start a new game. */
  startGame() {
    this.score = 0;
    this.lives = 3;
    this.level = 0;
    this._showScreen(this.$gameScreen);
    this.loadLevel(this.level);
  }

  /** Load a level. */
  loadLevel(lvl) {
    this.gamePaused = true;
    this.gameRunning = false;

    // Deep copy map
    this.map = LEVELS[lvl].map(row => [...row]);
    this.dotsRemaining = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.map[r][c] === DOT || this.map[r][c] === POWER) this.dotsRemaining++;
      }
    }

    this._resetPositions();
    this._updateHUD();

    // Show level banner
    this.$levelBannerText.textContent = `FASE ${lvl + 1}`;
    this.$levelBanner.classList.remove('hidden');

    setTimeout(() => {
      this.$levelBanner.classList.add('hidden');
      this.gameRunning = true;
      this.gamePaused = false;
      this.frightenedTimer = 0;
      this.lastTime = performance.now();
      if (this.animFrame) cancelAnimationFrame(this.animFrame);
      this.animFrame = requestAnimationFrame((t) => this._gameLoop(t));
    }, 1500);
  }

  /** Reset Pac-Man and ghosts to starting positions. */
  _resetPositions() {
    this.pacman = new PacMan(this.level);
    this.input.bind(this.pacman);
    this.input.setEnabled(true);
    this.ghosts = [0, 1, 2, 3].map(i => new Ghost(i, this.level));
  }

  /** Update HUD display. */
  _updateHUD() {
    this.$hudScore.textContent = this.score.toLocaleString();
    this.$hudLevel.textContent = this.level + 1;
    this.$hudLives.textContent = '❤️'.repeat(Math.max(0, this.lives));
  }

  /** Activate frightened mode and Pac-Man speed boost. */
  _activateFrightened() {
    this.frightenedTimer = FRIGHTENED_DURATION;
    this.pacman.speedBoostTimer = SPEED_BOOST_DURATION;
    this.ghosts.forEach(g => {
      if (!g.eaten) {
        g.frightened = true;
        // Only reverse direction if outside, otherwise they might get stuck in the house logic
        if (g.exited) {
          g.dir = { x: -g.dir.x, y: -g.dir.y };
        }
      }
    });
  }

  /** Check for collisions between Pac-Man and ghosts. */
  _checkCollisions() {
    this.ghosts.forEach(ghost => {
      if (!ghost.exited || ghost.eaten) return;
      const dx = this.pacman.x - ghost.x;
      const dy = this.pacman.y - ghost.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < TILE * 0.7) {
        if (ghost.frightened) {
          ghost.eaten = true;
          ghost.frightened = false;
          this.score += SCORE_GHOST;
        } else {
          this.lives--;
          this._updateHUD();
          if (this.lives <= 0) {
            this._gameOver();
          } else {
            this.gamePaused = true;
            this._showMessage('OOPS!', 1000);
            setTimeout(() => {
              this._resetPositions();
              this.gamePaused = false;
            }, 1200);
          }
        }
      }
    });
  }

  /** Check if all dots/cherries have been collected. */
  _checkLevelComplete() {
    if (this.dotsRemaining <= 0) {
      this.gameRunning = false;
      this.score += LEVEL_BONUS * (this.level + 1);
      this._updateHUD();

      if (this.level + 1 >= TOTAL_LEVELS) {
        setTimeout(() => this._showPrizeScreen(), 1500);
      } else {
        this.level++;
        this._showMessage(`FASE ${this.level} COMPLETA!\n+${LEVEL_BONUS * this.level} BÔNUS`, 2000);
        setTimeout(() => this.loadLevel(this.level), 2500);
      }
    }
  }

  /** Game over. */
  _gameOver() {
    this.gameRunning = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.$gameoverScore.textContent = this.score.toLocaleString();
    this.$gameoverLevel.textContent = this.level + 1;
    const btn = document.getElementById('btn-save-gameover');
    btn.disabled = false;
    btn.innerHTML = '<span>💾</span> SALVAR NO RANKING';
    setTimeout(() => this._showScreen(this.$gameoverScreen), 1000);
  }

  /** Show prize screen (all levels complete). */
  _showPrizeScreen() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.$finalScore.textContent = this.score.toLocaleString();

    let title = '🏅 GUERREIRO DO PAC-MAN';
    if (this.score >= 15000) title = '👑 LENDA DO PAC-MAN';
    else if (this.score >= 10000) title = '⭐ GRANDE CAMPEÃO';
    else if (this.score >= 5000) title = '🎖️ MESTRE DO PAC-MAN';

    this.$prizeTitle.textContent = title;
    const btn = document.getElementById('btn-save-score');
    btn.disabled = false;
    btn.innerHTML = '<span>💾</span> SALVAR NO RANKING';
    this._showScreen(this.$prizeScreen);
  }

  /** Show a temporary message banner. */
  _showMessage(text, duration) {
    this.$gameMessage.textContent = text;
    this.$gameMessage.classList.remove('hidden');
    setTimeout(() => this.$gameMessage.classList.add('hidden'), duration);
  }

  /** Show ranking modal. */
  async showRanking() {
    this.$rankingModal.classList.remove('hidden');
    this.$rankingList.innerHTML = '<p class="loading">Carregando...</p>';
    const rankings = await RankingService.load();
    RankingService.renderInto(this.$rankingList, rankings);
  }

  /** Main game loop. */
  _gameLoop(timestamp) {
    if (!this.gameRunning) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    if (!this.gamePaused) {
      // Update Pac-Man
      const result = this.pacman.move(dt, this.map);
      this.score += result.scoreDelta;
      this.dotsRemaining -= result.dotsEaten;
      if (result.powerEaten) this._activateFrightened();
      this.pacman.updateBoost(dt);

      // Update ghosts
      const pacTile = this.pacman.getTile();
      this.ghosts.forEach(g => g.update(dt, pacTile, this.map));

      // Check collisions and level complete
      this._checkCollisions();
      this._checkLevelComplete();

      // Frightened timer
      if (this.frightenedTimer > 0) {
        this.frightenedTimer -= dt * 1000;
        if (this.frightenedTimer <= 0) {
          this.frightenedTimer = 0;
          this.ghosts.forEach(g => g.frightened = false);
        }
      }

      this._updateHUD();
    }

    // Render
    this.renderer.clear();
    this.renderer.drawMap(this.map);
    this.renderer.drawPacMan(this.pacman);
    this.renderer.drawGhosts(this.ghosts, this.pacman);

    this.animFrame = requestAnimationFrame((t) => this._gameLoop(t));
  }
}
