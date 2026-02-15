/**
 * Constantes globais do jogo Pac-Man.
 * Define tamanhos de tile, tipos de célula, direções, pontuações,
 * cores dos fantasmas e posições iniciais.
 */

// === Dimensões do Grid e Canvas ===
export const TILE = 24;              // Tamanho de cada tile em pixels
export const COLS = 21;              // Número de colunas do labirinto
export const ROWS = 21;              // Número de linhas do labirinto
export const CANVAS_W = COLS * TILE; // Largura total do Canvas em pixels
export const CANVAS_H = ROWS * TILE; // Altura total do Canvas em pixels

// === Tipos de Célula do Mapa ===
export const EMPTY = 0;      // Espaço vazio (já coletado ou caminho livre)
export const WALL = 1;       // Parede — intransponível
export const DOT = 2;        // Ponto coletável (10 pontos)
export const POWER = 3;      // Cereja de poder — ativa modo assustado nos fantasmas
export const GHOST_DOOR = 4; // Porta da casa dos fantasmas — só fantasmas passam

// === Direções de Movimento ===
// Cada direção é um vetor { x, y } usado para calcular o deslocamento
export const DIR = {
  NONE:  { x: 0,  y: 0  },  // Parado
  UP:    { x: 0,  y: -1 },  // Para cima
  DOWN:  { x: 0,  y: 1  },  // Para baixo
  LEFT:  { x: -1, y: 0  },  // Para a esquerda
  RIGHT: { x: 1,  y: 0  },  // Para a direita
};

// === Sistema de Pontuação ===
export const SCORE_CHERRY = 10;   // Pontos por coletar um dot
export const SCORE_POWER = 50;    // Pontos por coletar uma cereja de poder
export const SCORE_GHOST = 200;   // Pontos por comer um fantasma assustado
export const LEVEL_BONUS = 500;   // Bônus base por completar uma fase (multiplicado pela fase)

// === Configurações Visuais dos Fantasmas ===
export const GHOST_COLORS = ['#ff3030', '#ff4da6', '#00ffea', '#ff8c00']; // Vermelho, Rosa, Ciano, Laranja
export const GHOST_NAMES = ['Blinky', 'Pinky', 'Inky', 'Clyde'];        // Nomes clássicos do Pac-Man
export const FRIGHTENED_COLOR = '#2020ff'; // Cor azul quando assustados

// === Temporizadores ===
export const FRIGHTENED_DURATION = 7000;    // Duração do modo assustado em ms
export const SPEED_BOOST_DURATION = 5000;   // Duração do boost de velocidade do Pac-Man em ms
export const TOTAL_LEVELS = 6;              // Total de fases no jogo

// === Cogumelo Brilhante (Power-Up Especial) ===
export const MUSHROOM_DURATION = 12000;              // Duração do efeito do cogumelo em ms (maior que a cereja)
export const MUSHROOM_SPEED_MULTIPLIER = 1.7;        // Multiplicador de velocidade — só um pouco mais que a cereja (1.5x)
export const MUSHROOM_SPAWN_INTERVAL_MIN = 15000;    // Intervalo mínimo entre spawns do cogumelo em ms
export const MUSHROOM_SPAWN_INTERVAL_MAX = 30000;    // Intervalo máximo entre spawns do cogumelo em ms
export const MUSHROOM_LIFETIME = 8000;               // Tempo que o cogumelo fica visível no mapa em ms
export const SCORE_MUSHROOM = 100;                   // Pontos por comer o cogumelo

// === Posições Iniciais (Coordenadas de Tile) ===
export const PACMAN_START = { x: 10, y: 15 }; // Posição inicial do Pac-Man

// Posições iniciais dos 4 fantasmas dentro da casa
export const GHOST_HOME = [
  { x: 9, y: 9 },   // Blinky (vermelho)
  { x: 10, y: 9 },  // Pinky (rosa)
  { x: 11, y: 9 },  // Inky (ciano)
  { x: 10, y: 10 }, // Clyde (laranja)
];

export const GHOST_DOOR_COL = 10;  // Coluna da porta da casa dos fantasmas
export const GHOST_DOOR_ROW = 8;   // Linha da porta da casa dos fantasmas
export const GHOST_EXIT_ROW = 7;   // Linha onde o fantasma é considerado "fora de casa"
