import { TILE, DIR, CANVAS_W, CANVAS_H } from './constants.js';

/**
 * Classe base para todas as entidades móveis do jogo (Pac-Man e Fantasmas).
 * Define propriedades comuns como posição, direção e velocidade,
 * além de métodos utilitários para navegação no grid.
 */
export class Entity {

  /**
   * Cria uma nova entidade na posição de tile especificada.
   * A posição é convertida de coordenadas de tile para pixels (centro do tile).
   * @param {number} tileX - Coluna do tile inicial
   * @param {number} tileY - Linha do tile inicial
   */
  constructor(tileX, tileY) {
    this.x = tileX * TILE + TILE / 2;  // Posição X em pixels (centro do tile)
    this.y = tileY * TILE + TILE / 2;  // Posição Y em pixels (centro do tile)
    this.dir = DIR.NONE;                // Direção atual de movimento
    this.speed = 2;                     // Velocidade base de deslocamento
  }

  /**
   * Retorna as coordenadas do tile atual da entidade.
   * Converte a posição em pixels para coordenadas de grid (coluna, linha).
   * @returns {{ x: number, y: number }} Coordenadas do tile
   */
  getTile() {
    return {
      x: Math.floor(this.x / TILE),
      y: Math.floor(this.y / TILE),
    };
  }

  /**
   * Verifica se a entidade está próxima do centro de um tile.
   * Usa uma tolerância de 2px para evitar problemas de precisão de ponto flutuante.
   * Essencial para decidir quando a entidade pode mudar de direção.
   * @returns {boolean} true se está no centro (com tolerância de 2px)
   */
  isAtTileCenter() {
    const cx = Math.floor(this.x / TILE) * TILE + TILE / 2;
    const cy = Math.floor(this.y / TILE) * TILE + TILE / 2;
    return Math.abs(this.x - cx) < 2 && Math.abs(this.y - cy) < 2;
  }

  /**
   * Encaixa a posição exatamente no centro do tile atual.
   * Usado antes de executar mudanças de direção para evitar desalinhamento.
   */
  snapToCenter() {
    this.x = Math.floor(this.x / TILE) * TILE + TILE / 2;
    this.y = Math.floor(this.y / TILE) * TILE + TILE / 2;
  }

  /**
   * Teleporta a entidade através dos túneis nas bordas do mapa.
   * Quando a entidade sai por um lado da tela, reaparece no outro.
   * Simula as passagens secretas do Pac-Man original.
   */
  tunnelWrap() {
    if (this.x < -TILE / 2) this.x = CANVAS_W + TILE / 2;
    if (this.x > CANVAS_W + TILE / 2) this.x = -TILE / 2;
  }
}
