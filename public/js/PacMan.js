import { Entity } from './Entity.js';
import {
  TILE, DIR, COLS, ROWS, WALL, DOT, POWER, EMPTY, GHOST_DOOR,
  PACMAN_START, SCORE_CHERRY, SCORE_POWER,
  MUSHROOM_SPEED_MULTIPLIER,
} from './constants.js';

/**
 * Classe do Pac-Man — o jogador controlável.
 * Herda de Entity e implementa movimentação com sistema de "pré-direção",
 * coleta de itens, animação de boca e boost de velocidade.
 */
export class PacMan extends Entity {

  /**
   * Cria o Pac-Man na posição inicial definida nas constantes.
   * @param {number} level - Fase atual (reservado para futuras mecânicas)
   */
  constructor(level) {
    super(PACMAN_START.x, PACMAN_START.y);
    this.nextDir = DIR.NONE;      // Próxima direção desejada (input do jogador)
    this.speed = 2.2;             // Velocidade constante do Pac-Man
    this.mouthOpen = 0;           // Estado da animação da boca (0 = fechada, 1 = aberta)
    this.mouthDir = 1;            // Sentido da animação (1 = abrindo, -1 = fechando)
    this.speedBoostTimer = 0;     // Tempo restante do boost de velocidade da cereja (ms)
    this.mushroomPowerTimer = 0;  // Tempo restante do efeito do cogumelo (ms)
    this.mushroomPower = false;   // Flag para efeito visual colorido do cogumelo
  }

  /**
   * Reseta o Pac-Man para a posição inicial da fase.
   * Chamado quando perde uma vida ou inicia nova fase.
   * @param {number} level - Fase atual
   */
  reset(level) {
    this.x = PACMAN_START.x * TILE + TILE / 2;
    this.y = PACMAN_START.y * TILE + TILE / 2;
    this.dir = DIR.NONE;
    this.nextDir = DIR.NONE;
    this.speed = 2.2;
    this.mouthOpen = 0;
    this.mouthDir = 1;
    this.mushroomPowerTimer = 0;
    this.mushroomPower = false;
  }

  /**
   * Move o Pac-Man e coleta itens no caminho.
   * 
   * Sistema de movimento:
   * 1. Calcula o deslocamento com base na direção e velocidade
   * 2. Quando passa pelo centro de um tile, tenta virar para nextDir
   * 3. Se nextDir não for possível, continua reto (ou para se tiver parede)
   * 4. Após mover, verifica se coletou dots ou cerejas de poder
   * 
   * @param {number} dt - Delta time em segundos
   * @param {number[][]} map - Mapa da fase atual
   * @returns {{ scoreDelta: number, dotsEaten: number, powerEaten: boolean }}
   */
  move(dt, map) {
    // Se está completamente parado, não faz nada
    if (this.dir === DIR.NONE && this.nextDir === DIR.NONE) {
      return { scoreDelta: 0, dotsEaten: 0, powerEaten: false };
    }

    // Calcula velocidade com boosts ativos
    let currentSpeed = this.speed;
    if (this.mushroomPowerTimer > 0) currentSpeed *= MUSHROOM_SPEED_MULTIPLIER; // Cogumelo: 2x
    else if (this.speedBoostTimer > 0) currentSpeed *= 1.5; // Cereja: 1.5x
    const speed = currentSpeed * dt * 60;

    // Deslocamento baseado na direção atual
    const moveX = this.dir.x * speed;
    const moveY = this.dir.y * speed;

    // Identifica o tile atual e seu centro em pixels
    const tile = this.getTile();
    const centerX = tile.x * TILE + TILE / 2;
    const centerY = tile.y * TILE + TILE / 2;

    // Verifica se o Pac-Man passou pelo centro do tile neste frame
    // Isso é crucial para determinar quando ele pode mudar de direção
    let passedCenter = false;
    
    if (this.dir.x > 0 && this.x < centerX && (this.x + moveX) >= centerX) passedCenter = true;
    else if (this.dir.x < 0 && this.x > centerX && (this.x + moveX) <= centerX) passedCenter = true;
    else if (this.dir.y > 0 && this.y < centerY && (this.y + moveY) >= centerY) passedCenter = true;
    else if (this.dir.y < 0 && this.y > centerY && (this.y + moveY) <= centerY) passedCenter = true;

    // Caso especial: já está no centro (tolerância de 2px)
    if (!passedCenter && this.isAtTileCenter()) {
       const tile = this.getTile();
       const ftx = tile.x + this.dir.x;
       const fty = tile.y + this.dir.y;
       
       // Força lógica de centro se tem mudança de direção pendente ou parede à frente
       if (this.nextDir !== DIR.NONE || !PacMan.isWalkable(ftx, fty, map)) {
           passedCenter = true;
       }
    }

    if (passedCenter) {
      // Encaixa no centro para executar curva precisa
      this.x = centerX;
      this.y = centerY;

      // Tenta virar para a direção desejada (nextDir)
      const tile = this.getTile();
      const inTunnel = tile.x < 0 || tile.x >= COLS;
      let turned = false;

      if (this.nextDir !== DIR.NONE && !inTunnel) {
        const ntx = tile.x + this.nextDir.x;
        const nty = tile.y + this.nextDir.y;
        if (PacMan.isWalkable(ntx, nty, map)) {
          this.dir = this.nextDir;
          this.nextDir = DIR.NONE; // Direção consumida
          turned = true;
        }
      }

      // Se não virou, verifica se pode continuar reto
      if (!turned) {
        const ftx = tile.x + this.dir.x;
        const fty = tile.y + this.dir.y;
        if (!PacMan.isWalkable(ftx, fty, map)) {
           // Parede à frente — para completamente
           this.dir = DIR.NONE;
        }
      }
      
      // Se ainda está se movendo, aplica velocidade do frame
      if (this.dir !== DIR.NONE) {
          this.x += this.dir.x * speed;
          this.y += this.dir.y * speed;
      }
    } else {
      // Não está no centro — aplica movimento normalmente
      this.x += moveX;
      this.y += moveY;
    }
    
    // Verifica teleporte pelos túneis laterais
    this.tunnelWrap();

    // Animação da boca (abre e fecha ciclicamente)
    this.mouthOpen += this.mouthDir * 0.15;
    if (this.mouthOpen > 1) { this.mouthOpen = 1; this.mouthDir = -1; }
    if (this.mouthOpen < 0) { this.mouthOpen = 0; this.mouthDir = 1; }

    // === Coleta de Itens ===
    let scoreDelta = 0;
    let dotsEaten = 0;
    let powerEaten = false;

    const newTile = this.getTile();
    if (newTile.x >= 0 && newTile.x < COLS && newTile.y >= 0 && newTile.y < ROWS) {
      const cell = map[newTile.y][newTile.x];
      if (cell === DOT) {
        map[newTile.y][newTile.x] = EMPTY;  // Remove o dot do mapa
        // Cogumelo ativo: pontos dobrados
        scoreDelta += this.mushroomPower ? SCORE_CHERRY * 2 : SCORE_CHERRY;
        dotsEaten++;
      } else if (cell === POWER) {
        // Só consome a power pellet se NÃO estiver sob efeito de nenhum poder
        // (nem cogumelo, nem outra cereja de poder)
        if (!this.mushroomPower && this.speedBoostTimer <= 0) {
          map[newTile.y][newTile.x] = EMPTY;  // Remove a cereja do mapa
          scoreDelta += SCORE_POWER;
          // Power pellet NÃO conta como dot para completar a fase
          powerEaten = true; // Sinaliza para ativar modo assustado
        }
      }
    }

    return { scoreDelta, dotsEaten, powerEaten };
  }

  /**
   * Atualiza o timer do boost de velocidade.
   * O boost é ativado ao comer uma cereja de poder e diminui com o tempo.
   * @param {number} dt - Delta time em segundos
   */
  updateBoost(dt) {
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= dt * 1000;
      if (this.speedBoostTimer <= 0) this.speedBoostTimer = 0;
    }
  }

  /**
   * Atualiza o timer do efeito do cogumelo brilhante.
   * Quando o timer expira, desativa o efeito visual e de velocidade.
   * @param {number} dt - Delta time em segundos
   */
  updateMushroomPower(dt) {
    if (this.mushroomPowerTimer > 0) {
      this.mushroomPowerTimer -= dt * 1000;
      if (this.mushroomPowerTimer <= 0) {
        this.mushroomPowerTimer = 0;
        this.mushroomPower = false;
      }
    }
  }

  /**
   * Verifica se um tile é transitável para o Pac-Man.
   * O Pac-Man pode andar em espaços vazios, dots, cerejas e túneis.
   * NÃO pode atravessar paredes nem a porta dos fantasmas.
   * @param {number} tx - Coluna do tile
   * @param {number} ty - Linha do tile
   * @param {number[][]} map - Mapa atual
   * @returns {boolean} true se o tile é transitável
   */
  static isWalkable(tx, ty, map) {
    if (tx < 0 || tx >= COLS) return true;   // Túnel (passagem lateral)
    if (ty < 0 || ty >= ROWS) return false;  // Fora do mapa
    const cell = map[ty][tx];
    if (cell === WALL) return false;
    if (cell === GHOST_DOOR) return false;   // Pac-Man não entra na casa dos fantasmas
    return true;
  }
}