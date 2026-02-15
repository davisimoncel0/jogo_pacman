import { TILE, ROWS, COLS, DOT, POWER, SCORE_GHOST, LEVEL_BONUS, TOTAL_LEVELS, FRIGHTENED_DURATION, SPEED_BOOST_DURATION, MUSHROOM_SPAWN_INTERVAL_MIN, MUSHROOM_SPAWN_INTERVAL_MAX, MUSHROOM_LIFETIME, MUSHROOM_DURATION, SCORE_MUSHROOM } from './constants.js';
import { LEVELS } from './levels.js';
import { PacMan } from './PacMan.js';
import { Ghost } from './Ghost.js';
import { Mushroom } from './Mushroom.js';
import { Renderer } from './Renderer.js';
import { InputHandler } from './InputHandler.js';
import { RankingService } from './RankingService.js';

/**
 * Motor principal do jogo Pac-Man.
 * Orquestra o loop de jogo, gerenciamento de estado, colisões,
 * transições de tela e controles mobile.
 */
export class GameEngine {

  /**
   * Inicializa o motor do jogo, configurando o renderizador,
   * os inputs, referências DOM e o estado inicial.
   */
  constructor() {
    // Renderizador — responsável por desenhar no Canvas
    this.renderer = new Renderer(document.getElementById('game-canvas'));

    // Gerenciador de input — teclado, botões touch e gestos
    this.input = new InputHandler();

    // === Referências aos elementos do DOM ===
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

    // === Estado do jogo ===
    this.playerName = '';           // Nome do jogador atual
    this.score = 0;                 // Pontuação acumulada
    this.lives = 3;                 // Vidas restantes
    this.level = 0;                 // Índice da fase atual (0 = Fase 1)
    this.map = [];                  // Mapa da fase atual (cópia profunda)
    this.dotsRemaining = 0;         // Quantidade de dots/cerejas restantes
    this.gameRunning = false;       // Se o jogo está ativo (loop rodando)
    this.gamePaused = false;        // Se o jogo está pausado temporariamente
    this.animFrame = null;          // ID do requestAnimationFrame atual
    this.lastTime = 0;              // Timestamp do último frame para cálculo de delta
    this.frightenedTimer = 0;       // Timer do modo assustado dos fantasmas (ms)
    this.activeScreen = null;       // Referência à tela ativa atual

    // === Entidades do jogo ===
    this.pacman = null;             // Instância do Pac-Man
    this.ghosts = [];               // Array de instâncias dos fantasmas
    this.mushroom = new Mushroom(); // Cogumelo brilhante (power-up especial)
    this.mushroomSpawnTimer = 0;    // Timer para próximo spawn do cogumelo (ms)

    // Vincula todos os eventos da interface
    this._bindEvents();
  }

  /**
   * Vincula todos os event listeners da interface do usuário.
   * Inclui: botão jogar, ranking, salvar pontuação, configurações mobile.
   */
  _bindEvents() {
    // Habilita/desabilita o botão "JOGAR" conforme o nome é preenchido
    this.$playerName.addEventListener('input', () => {
      this.$btnStart.disabled = this.$playerName.value.trim().length === 0;
    });

    // Botão "JOGAR" — inicia o jogo com o nome informado
    this.$btnStart.addEventListener('click', () => {
      this.playerName = this.$playerName.value.trim();
      if (this.playerName) this.startGame();
    });

    // Permite iniciar o jogo com a tecla Enter no campo de nome
    this.$playerName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.$playerName.value.trim()) {
        this.playerName = this.$playerName.value.trim();
        this.startGame();
      }
    });

    // Abre o modal de ranking
    document.getElementById('btn-ranking').addEventListener('click', () => this.showRanking());

    // Fecha o modal de ranking
    document.getElementById('btn-close-ranking').addEventListener('click', () => {
      this.$rankingModal.classList.add('hidden');
    });

    // Botão "SALVAR" na tela de premiação (todas as fases completas)
    document.getElementById('btn-save-score').addEventListener('click', () => {
      this._saveAndDisable('btn-save-score');
    });

    // Botão "JOGAR NOVAMENTE" na tela de premiação
    document.getElementById('btn-play-again').addEventListener('click', () => {
      this._showScreen(this.$startScreen);
      // Foca o campo de nome para facilitar a digitação
      setTimeout(() => this.$playerName.focus(), 100);
    });

    // Botão "SALVAR" na tela de game over
    document.getElementById('btn-save-gameover').addEventListener('click', () => {
      this._saveAndDisable('btn-save-gameover');
    });

    // Botão "TENTAR NOVAMENTE" na tela de game over
    document.getElementById('btn-retry').addEventListener('click', () => {
      this._showScreen(this.$startScreen);
      // Foca o campo de nome para facilitar a digitação
      setTimeout(() => this.$playerName.focus(), 100);
    });

  }



  /**
   * Salva a pontuação no ranking e desabilita o botão para evitar cliques múltiplos.
   * @param {string} btnId - ID do botão de salvar (pode ser da tela prize ou gameover)
   */
  async _saveAndDisable(btnId) {
    const btn = document.getElementById(btnId);
    btn.disabled = true;
    btn.innerHTML = '<span>✅</span> SALVO!';
    await RankingService.save(this.playerName, this.score, this.level + 1);
    this.showRanking();
  }

  /**
   * Exibe uma tela específica e oculta todas as outras.
   * @param {HTMLElement} screen - Elemento DOM da tela a ser exibida
   */
  _showScreen(screen) {
    // Oculta todas as telas removendo a classe 'active'
    [this.$startScreen, this.$gameScreen, this.$prizeScreen, this.$gameoverScreen].forEach(s =>
      s.classList.remove('active')
    );
    // Ativa a tela desejada
    screen.classList.add('active');
  }

  /**
   * Inicia uma nova partida do zero.
   * Reseta pontuação, vidas e carrega a primeira fase.
   */
  startGame() {
    this.score = 0;
    this.lives = 3;
    this.level = 0;
    this._showScreen(this.$gameScreen);
    this.loadLevel(this.level);
  }

  /**
   * Carrega uma fase específica do jogo.
   * Copia o mapa, conta os dots restantes, posiciona as entidades
   * e exibe o banner de "FASE X" antes de iniciar o loop.
   * @param {number} lvl - Índice da fase (0 = Fase 1, 5 = Fase 6)
   */
  loadLevel(lvl) {
    this.gamePaused = true;
    this.gameRunning = false;

    // Reseta as vidas a cada nova fase
    this.lives = 3;

    // Cópia profunda do mapa para não alterar o original
    this.map = LEVELS[lvl].map(row => [...row]);

    // Conta apenas os DOTs para completar a fase (POWER não conta)
    this.dotsRemaining = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.map[r][c] === DOT) this.dotsRemaining++;
      }
    }

    // Reposiciona Pac-Man e fantasmas
    this._resetPositions();
    this._updateHUD();

    // Exibe o banner com o número da fase
    this.$levelBannerText.textContent = `FASE ${lvl + 1}`;
    this.$levelBanner.classList.remove('hidden');

    // Após 1.5s, esconde o banner e inicia o loop de jogo
    setTimeout(() => {
      this.$levelBanner.classList.add('hidden');
      this.gameRunning = true;
      this.gamePaused = false;
      this.frightenedTimer = 0;
      this.mushroom.deactivate();
      this.mushroomSpawnTimer = this._randomMushroomInterval();
      this.lastTime = performance.now();
      if (this.animFrame) cancelAnimationFrame(this.animFrame);
      this.animFrame = requestAnimationFrame((t) => this._gameLoop(t));
    }, 1500);
  }

  /**
   * Reseta as posições do Pac-Man e dos fantasmas para o início da fase.
   * Cria novas instâncias e vincula o input ao novo Pac-Man.
   */
  _resetPositions() {
    this.pacman = new PacMan(this.level);
    this.input.bind(this.pacman);
    this.input.setEnabled(true);
    // Cria 4 fantasmas (índices 0-3, cada um com cor e comportamento diferente)
    this.ghosts = [0, 1, 2, 3].map(i => new Ghost(i, this.level));
  }

  /**
   * Atualiza o HUD (Head-Up Display) com as informações atuais.
   * Mostra pontuação formatada, número da fase e corações de vida.
   */
  _updateHUD() {
    this.$hudScore.textContent = this.score.toLocaleString();
    this.$hudLevel.textContent = this.level + 1;
    this.$hudLives.textContent = '❤️'.repeat(Math.max(0, this.lives));
  }

  /**
   * Ativa o modo "assustado" (frightened) nos fantasmas.
   * Quando o Pac-Man come uma Power Pellet (cereja grande),
   * os fantasmas ficam vulneráveis e podem ser comidos.
   * Também ativa o boost de velocidade do Pac-Man.
   * NÃO ativa se o cogumelo já estiver ativo (exclusividade de poderes).
   */
  _activateFrightened() {
    // Exclusividade: se o cogumelo estiver ativo, não consome a power pellet
    if (this.pacman.mushroomPower) return;

    this.frightenedTimer = FRIGHTENED_DURATION;
    this.pacman.speedBoostTimer = SPEED_BOOST_DURATION;
    this.ghosts.forEach(g => {
      if (!g.eaten) {
        g.frightened = true;
        // Inverte a direção dos fantasmas que já saíram da casa
        if (g.exited) {
          g.dir = { x: -g.dir.x, y: -g.dir.y };
        }
      }
    });
  }

  /**
   * Ativa o efeito do cogumelo brilhante no Pac-Man.
   * Concede super velocidade (2x), efeito visual colorido
   * e ativa o modo assustado nos fantasmas (permite comê-los)
   * por uma duração maior que a cereja.
   */
  _activateMushroomPower() {
    this.pacman.mushroomPowerTimer = MUSHROOM_DURATION;
    this.pacman.mushroomPower = true;

    // Ativa modo assustado nos fantasmas (mesma lógica da cereja, mas com duração do cogumelo)
    this.frightenedTimer = MUSHROOM_DURATION;
    this.ghosts.forEach(g => {
      if (!g.eaten) {
        g.frightened = true;
        if (g.exited) {
          g.dir = { x: -g.dir.x, y: -g.dir.y };
        }
      }
    });
  }

  /**
   * Retorna um intervalo aleatório para o próximo spawn do cogumelo.
   * @returns {number} Intervalo em ms
   */
  _randomMushroomInterval() {
    return MUSHROOM_SPAWN_INTERVAL_MIN + Math.random() * (MUSHROOM_SPAWN_INTERVAL_MAX - MUSHROOM_SPAWN_INTERVAL_MIN);
  }

  /**
   * Verifica colisão entre o Pac-Man e o cogumelo ativo.
   * Se estão próximos o suficiente, ativa o efeito do cogumelo.
   */
  _checkMushroomCollision() {
    if (!this.mushroom.active) return;
    // Exclusividade: não pode pegar cogumelo se poder da cereja está ativo
    if (this.frightenedTimer > 0) return;

    const dx = this.pacman.x - this.mushroom.x;
    const dy = this.pacman.y - this.mushroom.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < TILE * 0.7) {
      this.mushroom.deactivate();
      this.score += SCORE_MUSHROOM;
      this._activateMushroomPower();
    }
  }

  /**
   * Verifica colisões entre o Pac-Man e cada fantasma.
   * Se o fantasma está assustado → Pac-Man o come e ganha pontos.
   * Se o fantasma está normal → Pac-Man perde uma vida.
   * Usa distância euclidiana com limiar de 0.7 tiles.
   */
  _checkCollisions() {
    this.ghosts.forEach(ghost => {
      if (!ghost.exited || ghost.eaten) return;
      const dx = this.pacman.x - ghost.x;
      const dy = this.pacman.y - ghost.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < TILE * 0.7) {
        if (ghost.frightened) {
          // Fantasma assustado é comido — volta para a casa como olhos
          ghost.eaten = true;
          // Cogumelo ativo: pontos dobrados ao comer fantasma
          this.score += this.pacman.mushroomPower ? SCORE_GHOST * 2 : SCORE_GHOST;
        } else {
          // Pac-Man perde uma vida
          this.lives--;
          this._updateHUD();
          if (this.lives <= 0) {
            this._gameOver();
          } else {
            // Pausa brevemente e reposiciona
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

  /**
   * Verifica se todos os dots/cerejas foram coletados na fase atual.
   * Se sim, avança para a próxima fase ou exibe a tela de premiação.
   * Adiciona bônus de pontuação proporcional à fase.
   */
  _checkLevelComplete() {
    if (this.dotsRemaining <= 0) {
      this.gameRunning = false;
      this.score += LEVEL_BONUS * (this.level + 1);
      this._updateHUD();

      if (this.level + 1 >= TOTAL_LEVELS) {
        // Todas as fases completas — mostra tela de premiação
        setTimeout(() => this._showPrizeScreen(), 1500);
      } else {
        // Avança para a próxima fase
        this.level++;
        this._showMessage(`FASE ${this.level} COMPLETA!\n+${LEVEL_BONUS * this.level} BÔNUS`, 2000);
        setTimeout(() => this.loadLevel(this.level), 2500);
      }
    }
  }

  /**
   * Finaliza o jogo (Game Over).
   * Para o loop, exibe a pontuação final e oferece opção de salvar.
   */
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

  /**
   * Exibe a tela de premiação quando o jogador completa todas as fases.
   * Atribui um título com base na pontuação total alcançada.
   */
  _showPrizeScreen() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.$finalScore.textContent = this.score.toLocaleString();

    // Define o título com base na pontuação
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

  /**
   * Exibe uma mensagem temporária no centro da tela do jogo.
   * Usada para "OOPS!", "FASE COMPLETA!", etc.
   * @param {string} text - Texto da mensagem
   * @param {number} duration - Duração em milissegundos
   */
  _showMessage(text, duration) {
    this.$gameMessage.textContent = text;
    this.$gameMessage.classList.remove('hidden');
    setTimeout(() => this.$gameMessage.classList.add('hidden'), duration);
  }

  /**
   * Abre o modal de ranking e carrega os dados do servidor.
   * Exibe um "Carregando..." enquanto busca os dados via API.
   */
  async showRanking() {
    this.$rankingModal.classList.remove('hidden');
    this.$rankingList.innerHTML = '<p class="loading">Carregando...</p>';
    const rankings = await RankingService.load();
    RankingService.renderInto(this.$rankingList, rankings);
  }

  /**
   * Loop principal do jogo — chamado a cada frame via requestAnimationFrame.
   * Calcula o delta time, atualiza todas as entidades, verifica colisões
   * e renderiza o frame atual no Canvas.
   * @param {number} timestamp - Timestamp fornecido pelo requestAnimationFrame
   */
  _gameLoop(timestamp) {
    if (!this.gameRunning) return;

    // Calcula delta time em segundos (limitado a 50ms para evitar saltos)
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    if (!this.gamePaused) {
      // Atualiza a posição e o estado do Pac-Man
      const result = this.pacman.move(dt, this.map);
      this.score += result.scoreDelta;
      this.dotsRemaining -= result.dotsEaten;
      if (result.powerEaten) this._activateFrightened();
      this.pacman.updateBoost(dt);
      this.pacman.updateMushroomPower(dt);

      // Atualiza a posição e o comportamento de cada fantasma
      const pacTile = this.pacman.getTile();
      this.ghosts.forEach(g => g.update(dt, pacTile, this.map));

      // Atualiza o cogumelo brilhante (spawn e movimento)
      this.mushroomSpawnTimer -= dt * 1000;
      if (this.mushroomSpawnTimer <= 0 && !this.mushroom.active) {
        this.mushroom.spawn(this.map, MUSHROOM_LIFETIME);
        this.mushroomSpawnTimer = this._randomMushroomInterval();
      }
      if (this.mushroom.active) {
        this.mushroom.update(dt, this.map);
      }

      // Verifica colisões e se a fase foi completada
      this._checkCollisions();
      this._checkMushroomCollision();
      this._checkLevelComplete();

      // Controla o timer do modo assustado
      if (this.frightenedTimer > 0) {
        this.frightenedTimer -= dt * 1000;
        if (this.frightenedTimer <= 0) {
          this.frightenedTimer = 0;
          this.ghosts.forEach(g => g.frightened = false);
        } else {
          // Reativa frightened em fantasmas que saíram da casa durante o timer ativo
          this.ghosts.forEach(g => {
            if (g.exited && !g.eaten && !g.frightened) {
              g.frightened = true;
            }
          });
        }
      }

      this._updateHUD();
    }

    // Renderiza o frame no Canvas
    this.renderer.clear();
    this.renderer.drawMap(this.map);
    if (this.mushroom.active) {
      this.renderer.drawMushroom(this.mushroom);
    }
    this.renderer.drawPacMan(this.pacman);
    this.renderer.drawGhosts(this.ghosts, this.pacman, this.frightenedTimer);

    // Agenda o próximo frame
    this.animFrame = requestAnimationFrame((t) => this._gameLoop(t));
  }
}
