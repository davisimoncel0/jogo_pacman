/**
 * Game constants — tile sizes, directions, scores, colors.
 */

export const TILE = 24;
export const COLS = 21;
export const ROWS = 23;
export const CANVAS_W = COLS * TILE;
export const CANVAS_H = ROWS * TILE;

// Tile types
export const EMPTY = 0;
export const WALL = 1;
export const DOT = 2;       // Cherry collectable
export const POWER = 3;     // Power pellet
export const GHOST_DOOR = 4;

// Directions
export const DIR = {
  NONE:  { x: 0,  y: 0  },
  UP:    { x: 0,  y: -1 },
  DOWN:  { x: 0,  y: 1  },
  LEFT:  { x: -1, y: 0  },
  RIGHT: { x: 1,  y: 0  },
};

// Scoring
export const SCORE_CHERRY = 10;
export const SCORE_POWER = 50;
export const SCORE_GHOST = 200;
export const LEVEL_BONUS = 500;

// Ghost visual settings
export const GHOST_COLORS = ['#ff3030', '#ff4da6', '#00ffea', '#ff8c00'];
export const GHOST_NAMES = ['Blinky', 'Pinky', 'Inky', 'Clyde'];
export const FRIGHTENED_COLOR = '#2020ff';

// Timing
export const FRIGHTENED_DURATION = 7000;
export const SPEED_BOOST_DURATION = 5000;
export const TOTAL_LEVELS = 6;

// Positions (tile coords)
export const PACMAN_START = { x: 10, y: 15 };
export const GHOST_HOME = [
  { x: 9, y: 9 },
  { x: 10, y: 9 },
  { x: 11, y: 9 },
  { x: 10, y: 10 },
];
export const GHOST_DOOR_COL = 10;
export const GHOST_DOOR_ROW = 8;
export const GHOST_EXIT_ROW = 7;
