import { TILE, COLS, ROWS, WALL, GHOST_DOOR, DIR, EMPTY, DOT, POWER } from './constants.js';

/**
 * Classe do Cogumelo Brilhante — power-up especial que anda pelo mapa.
 * Aparece aleatoriamente em um tile vazio e se move autonomamente.
 * Ao ser coletado pelo Pac-Man, concede super velocidade e efeito visual colorido.
 */
export class Mushroom {

  /**
   * Cria uma instância do cogumelo (inativa por padrão).
   */
  constructor() {
    this.x = 0;              // Posição X em pixels
    this.y = 0;              // Posição Y em pixels
    this.dir = DIR.NONE;     // Direção atual de movimento
    this.speed = 2.0;        // Velocidade de movimento (fluida e visível)
    this.active = false;     // Se o cogumelo está visível e ativo no mapa
    this.lifetime = 0;       // Tempo restante de vida no mapa em ms
  }

  /**
   * Retorna as coordenadas do tile atual do cogumelo.
   * @returns {{ x: number, y: number }} Coordenadas do tile
   */
  getTile() {
    return {
      x: Math.floor(this.x / TILE),
      y: Math.floor(this.y / TILE),
    };
  }

  /**
   * Verifica se o cogumelo está próximo do centro de um tile.
   * @returns {boolean} true se está no centro (com tolerância de 2px)
   */
  isAtTileCenter() {
    const cx = Math.floor(this.x / TILE) * TILE + TILE / 2;
    const cy = Math.floor(this.y / TILE) * TILE + TILE / 2;
    return Math.abs(this.x - cx) < 2 && Math.abs(this.y - cy) < 2;
  }

  /**
   * Encaixa a posição exatamente no centro do tile atual.
   */
  snapToCenter() {
    this.x = Math.floor(this.x / TILE) * TILE + TILE / 2;
    this.y = Math.floor(this.y / TILE) * TILE + TILE / 2;
  }

  /**
   * Spawna o cogumelo em uma posição aleatória válida no mapa.
   * Escolhe um tile vazio (EMPTY ou DOT) que não seja parede nem porta.
   * @param {number[][]} map - Mapa da fase atual
   * @param {number} lifetime - Tempo de vida em ms
   */
  spawn(map, lifetime) {
    const validTiles = [];

    // Coleta todos os tiles válidos para spawn (internos ao mapa)
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        const cell = map[r][c];
        if (cell === EMPTY || cell === DOT) {
          validTiles.push({ x: c, y: r });
        }
      }
    }

    if (validTiles.length === 0) return;

    // Escolhe posição aleatória
    const tile = validTiles[Math.floor(Math.random() * validTiles.length)];
    this.x = tile.x * TILE + TILE / 2;
    this.y = tile.y * TILE + TILE / 2;
    this.active = true;
    this.lifetime = lifetime;

    // Escolhe direção inicial aleatória
    this._chooseRandomDirection(map);
  }

  /**
   * Desativa o cogumelo (ao ser coletado ou expirar).
   */
  deactivate() {
    this.active = false;
    this.dir = DIR.NONE;
  }

  /**
   * Verifica se um tile é transitável para o cogumelo.
   * Cogumelos podem andar por espaços vazios, dots e cerejas.
   * @param {number} tx - Coluna do tile
   * @param {number} ty - Linha do tile
   * @param {number[][]} map - Mapa atual
   * @returns {boolean} true se o tile é transitável
   */
  static isWalkable(tx, ty, map) {
    if (tx < 0 || tx >= COLS) return false;   // Sem túneis
    if (ty < 0 || ty >= ROWS) return false;   // Fora do mapa
    const cell = map[ty][tx];
    if (cell === WALL) return false;
    if (cell === GHOST_DOOR) return false;
    return true;
  }

  /**
   * Escolhe uma direção aleatória válida para o cogumelo.
   * @param {number[][]} map - Mapa atual
   */
  _chooseRandomDirection(map) {
    const tile = this.getTile();
    const dirs = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];

    // Filtra direções válidas (que não levam a uma parede)
    const validDirs = dirs.filter(d => {
      const nx = tile.x + d.x;
      const ny = tile.y + d.y;
      return Mushroom.isWalkable(nx, ny, map);
    });

    if (validDirs.length > 0) {
      this.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
    } else {
      this.dir = DIR.NONE;
    }
  }

  /**
   * Atualiza a posição e estado do cogumelo a cada frame.
   * O cogumelo se move pelo mapa autonomamente, mudando de direção
   * ao atingir o centro de cada tile.
   * @param {number} dt - Delta time em segundos
   * @param {number[][]} map - Mapa da fase atual
   */
  update(dt, map) {
    if (!this.active) return;

    // Reduz o tempo de vida
    this.lifetime -= dt * 1000;
    if (this.lifetime <= 0) {
      this.deactivate();
      return;
    }

    if (this.dir === DIR.NONE) {
      this._chooseRandomDirection(map);
      return;
    }

    const speed = this.speed * dt * 60;

    // Decisão de direção ao atingir o centro do tile
    if (this.isAtTileCenter()) {
      this.snapToCenter();
      const tile = this.getTile();

      // Verifica se pode continuar na direção atual
      const fx = tile.x + this.dir.x;
      const fy = tile.y + this.dir.y;

      if (!Mushroom.isWalkable(fx, fy, map)) {
        // Não pode continuar — escolhe nova direção aleatória
        this._chooseRandomDirection(map);
      } else if (Math.random() < 0.03) {
        // 3% de chance de mudar de direção (evita tremor, movimento mais fluido)
        this._chooseRandomDirection(map);
      }
    }

    // Aplica o movimento
    if (this.dir !== DIR.NONE) {
      this.x += this.dir.x * speed;
      this.y += this.dir.y * speed;
    }
  }
}
