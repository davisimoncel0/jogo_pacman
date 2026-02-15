import { Entity } from './Entity.js';
import {
  TILE, DIR, COLS, ROWS, WALL, GHOST_DOOR,
  GHOST_HOME, GHOST_COLORS, GHOST_NAMES,
  GHOST_DOOR_COL, GHOST_EXIT_ROW, CANVAS_W,
} from './constants.js';

/**
 * Classe dos Fantasmas — inimigos controlados por IA.
 * Cada fantasma passa por 4 fases de comportamento:
 *  1. Esperando dentro da casa (animação de flutuação)
 *  2. Saindo pela porta (caminhando para cima)
 *  3. Retornando para casa (quando comido pelo Pac-Man)
 *  4. Perseguindo/fugindo no labirinto
 */
export class Ghost extends Entity {

  /**
   * Cria um fantasma com índice, cor e nome específicos.
   * @param {number} index - Índice do fantasma (0=Blinky, 1=Pinky, 2=Inky, 3=Clyde)
   * @param {number} level - Fase atual do jogo
   */
  constructor(index, level) {
    const home = GHOST_HOME[index];
    super(home.x, home.y);
    this.index = index;                      // Identificador numérico
    this.color = GHOST_COLORS[index];        // Cor do corpo
    this.name = GHOST_NAMES[index];          // Nome (Blinky, Pinky, etc.)
    this.dir = DIR.UP;                       // Direção inicial
    this.speed = 2.1;                        // Velocidade (ligeiramente menor que Pac-Man)
    this.frightened = false;                 // Se está no modo assustado (vulnerável)
    this.eaten = false;                      // Se foi comido e está retornando para casa
    this.exited = false;                     // Se já saiu da casa dos fantasmas
    this.exiting = false;                    // Se está no processo de sair da casa
    this.exitTimer = Ghost.EXIT_TIMERS[index]; // Tempo de espera antes de sair
  }

  /**
   * Tempos de saída escalonados por fantasma (em ms).
   * Blinky sai imediatamente, os outros esperam progressivamente mais.
   */
  static EXIT_TIMERS = [0, 4000, 8000, 12000];

  /**
   * Reseta o fantasma para a posição inicial dentro da casa.
   * @param {number} level - Fase atual
   */
  reset(level) {
    const home = GHOST_HOME[this.index];
    this.x = home.x * TILE + TILE / 2;
    this.y = home.y * TILE + TILE / 2;
    this.dir = DIR.UP;
    this.speed = 2.1;
    this.frightened = false;
    this.eaten = false;
    this.exited = false;
    this.exiting = false;
    this.exitTimer = Ghost.EXIT_TIMERS[this.index];
  }

  /**
   * Atualiza o movimento do fantasma para um frame.
   * Delega para o método da fase atual de comportamento.
   * @param {number} dt - Delta time em segundos
   * @param {{ x: number, y: number }} pacTile - Posição do Pac-Man em tiles
   * @param {number[][]} map - Mapa da fase atual
   */
  update(dt, pacTile, map) {
    // FASE 1: Esperando dentro da casa
    if (!this.exited && !this.exiting) {
      this._waitInHouse(dt);
      return;
    }

    // FASE 2: Caminhando para fora pela porta
    if (this.exiting) {
      this._walkOutDoor(dt, map, pacTile);
      return;
    }

    // FASE 3: Comido — retornando para casa como olhos
    if (this.eaten) {
      this._returnHome(dt);
      return;
    }

    // FASE 4: Movimento normal no labirinto
    this._moveInMaze(dt, pacTile, map);
  }

  /**
   * Fase 1: Animação de flutuação enquanto espera dentro da casa.
   * O fantasma balança verticalmente e conta o tempo para sair.
   * @param {number} dt - Delta time em segundos
   */
  _waitInHouse(dt) {
    this.exitTimer -= dt * 1000;
    const home = GHOST_HOME[this.index];

    // Animação de flutuação suave (seno baseado no tempo + offset por índice)
    this.y = home.y * TILE + TILE / 2 + Math.sin(performance.now() / 300 + this.index) * 3;
    this.x = home.x * TILE + TILE / 2;

    // Quando o timer acaba, posiciona na coluna da porta e inicia saída
    if (this.exitTimer <= 0) {
      this.exiting = true;
      this.x = GHOST_DOOR_COL * TILE + TILE / 2;
      this.dir = DIR.UP;
      this.y -= 1; // Empurrão inicial para garantir que o movimento comece
    }
  }

  /**
   * Fase 2: Caminha para cima através da porta dos fantasmas.
   * Uma vez que atinge a linha de saída, é marcado como "exited" e começa a perseguir.
   * @param {number} dt - Delta time em segundos
   * @param {number[][]} map - Mapa atual
   * @param {{ x: number, y: number }} pacTile - Posição do Pac-Man
   */
  _walkOutDoor(dt, map, pacTile) {
    const exitY = GHOST_EXIT_ROW * TILE + TILE / 2;
    this.dir = DIR.UP;
    this.y -= this.speed * 1.5 * dt * 60; // Velocidade 1.5x ao sair da casa
    this.x = GHOST_DOOR_COL * TILE + TILE / 2; // Mantém alinhado na coluna da porta

    if (this.y <= exitY) {
      this.y = exitY;
      this.exiting = false;
      this.exited = true;
      
      // Imediatamente escolhe uma direção e começa a perseguir
      this._moveInMaze(0, pacTile, map);
    }
  }

  /**
   * Fase 3: Retorna para casa após ser comido.
   * Move-se em linha reta em alta velocidade (3x) de volta à posição original.
   * Quando chega, reseta o estado e espera 3s antes de sair novamente.
   * @param {number} dt - Delta time em segundos
   */
  _returnHome(dt) {
    const home = GHOST_HOME[this.index];
    const hx = home.x * TILE + TILE / 2;
    const hy = home.y * TILE + TILE / 2;

    // Verifica se chegou em casa (tolerância de 4px)
    if (Math.abs(this.x - hx) < 4 && Math.abs(this.y - hy) < 4) {
      this.eaten = false;
      this.frightened = false;
      this.exited = false;
      this.exiting = false;
      this.exitTimer = 3000; // Espera 3s antes de sair novamente
      this.x = hx;
      this.y = hy;
      this.dir = DIR.UP;
    } else {
      // Movimento direto em alta velocidade
      const dx = hx - this.x;
      const dy = hy - this.y;
      const returnSpeed = this.speed * 3 * dt * 60;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.x += Math.sign(dx) * returnSpeed;
      } else {
        this.y += Math.sign(dy) * returnSpeed;
        // Ajuda diagonal para evitar ficar preso
        if (Math.abs(dx) > 1) this.x += Math.sign(dx) * returnSpeed * 0.5;
      }
    }
  }

  /**
   * Fase 4: Movimento inteligente pelo labirinto.
   * 
   * IA de perseguição:
   * - Normal: busca a direção que mais se aproxima do Pac-Man (distância euclidiana)
   * - Assustado: foge para o canto mais distante do Pac-Man
   * 
   * Regras:
   * - Não pode fazer inversão de 180° (exceto se encurralado)
   * - Velocidade reduzida em 40% quando assustado
   * 
   * @param {number} dt - Delta time em segundos
   * @param {{ x: number, y: number }} pacTile - Posição do Pac-Man em tiles
   * @param {number[][]} map - Mapa atual
   */
  _moveInMaze(dt, pacTile, map) {
    const currentSpeed = (this.frightened ? this.speed * 0.6 : this.speed);
    const speed = currentSpeed * (dt > 0 ? dt : 0.016) * 60; // dt=0 na primeira chamada

    // Decisão de direção acontece apenas no centro de cada tile
    if (this.isAtTileCenter()) {
      this.snapToCenter();
      const tile = this.getTile();

      let target;
      if (this.frightened) {
        // Fuga: busca o canto mais distante do Pac-Man
        const corners = [
          { x: 1, y: 1 },
          { x: COLS - 2, y: 1 },
          { x: 1, y: ROWS - 2 },
          { x: COLS - 2, y: ROWS - 2 }
        ];
        
        let maxDistSq = -1;
        target = corners[0];
        const pt = pacTile || { x: 10, y: 15 };

        for (const corner of corners) {
          const dSq = (corner.x - pt.x) ** 2 + (corner.y - pt.y) ** 2;
          if (dSq > maxDistSq) {
            maxDistSq = dSq;
            target = corner;
          }
        }
      } else {
        // Perseguição: alvo é a posição do Pac-Man
        target = pacTile || { x: 10, y: 15 };
      }

      // Avalia todas as 4 direções e escolhe a que mais aproxima do alvo
      const opposite = { x: -this.dir.x, y: -this.dir.y };
      const directions = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
      let bestDir = null;
      let bestDist = Infinity;

      for (const d of directions) {
        // Impede inversão de 180° (anti-oscilação)
        if (d.x === opposite.x && d.y === opposite.y) continue;
        
        const ntx = tile.x + d.x;
        const nty = tile.y + d.y;
        
        if (!Ghost.isWalkable(ntx, nty, map, this.exited)) continue;
        
        // Distância euclidiana ao quadrado (sem sqrt para performance)
        const dist = (ntx - target.x) ** 2 + (nty - target.y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          bestDir = d;
        }
      }

      // Fallback: se encurralado (beco sem saída), permite inversão
      if (!bestDir) {
        for (const d of directions) {
           if (Ghost.isWalkable(tile.x + d.x, tile.y + d.y, map, this.exited)) {
             bestDir = d;
             break;
           }
        }
      }

      if (bestDir) this.dir = bestDir;
    }

    // Aplica o movimento se dt > 0 (evita mover na primeira chamada)
    if (dt > 0) {
        this.x += this.dir.x * speed;
        this.y += this.dir.y * speed;
        this.tunnelWrap(); // Verifica teleporte pelos túneis
    }
  }

  /**
   * Verifica se um tile é transitável para fantasmas.
   * Fantasmas podem andar por espaços vazios, dots, cerejas e túneis.
   * A porta dos fantasmas é transitável apenas se o fantasma ainda não saiu.
   * @param {number} tx - Coluna do tile
   * @param {number} ty - Linha do tile
   * @param {number[][]} map - Mapa atual
   * @param {boolean} ghostExited - Se o fantasma já saiu da casa
   * @returns {boolean} true se o tile é transitável
   */
  static isWalkable(tx, ty, map, ghostExited) {
    if (tx < 0 || tx >= COLS) return true;    // Túnel lateral
    if (ty < 0 || ty >= ROWS) return false;   // Fora do mapa
    const cell = map[ty][tx];
    if (cell === WALL) return false;
    if (cell === GHOST_DOOR) {
      if (ghostExited) return false; // Fantasma que já saiu não pode voltar pela porta
      return true;
    }
    return true;
  }
}
