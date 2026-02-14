import { Entity } from './Entity.js';
import {
  TILE, DIR, COLS, ROWS, WALL, DOT, POWER, EMPTY, GHOST_DOOR,
  PACMAN_START, SCORE_CHERRY, SCORE_POWER,
} from './constants.js';

/**
 * Pac-Man player class.
 */
export class PacMan extends Entity {
  constructor(level) {
    super(PACMAN_START.x, PACMAN_START.y);
    this.nextDir = DIR.NONE;
    // Constant speed
    this.speed = 2.2;
    this.mouthOpen = 0;
    this.mouthDir = 1;
    this.speedBoostTimer = 0;
  }

  /** Reset to starting position. */
  reset(level) {
    this.x = PACMAN_START.x * TILE + TILE / 2;
    this.y = PACMAN_START.y * TILE + TILE / 2;
    this.dir = DIR.NONE;
    this.nextDir = DIR.NONE;
    // Constant speed for Pac-Man to match Ghosts
    this.speed = 2.2; 
    this.mouthOpen = 0;
    this.mouthDir = 1;
  }

  /**
   * Move Pac-Man and collect items.
   * @param {number} dt - Delta time in seconds
   * @param {number[][]} map - Current level map
   * @returns {{ scoreDelta: number, dotsEaten: number, powerEaten: boolean }}
   */
  move(dt, map) {
    if (this.dir === DIR.NONE && this.nextDir === DIR.NONE) {
      return { scoreDelta: 0, dotsEaten: 0, powerEaten: false };
    }

    // At tile center, try to change direction
    // At tile center, try to change direction
    if (this.isAtTileCenter()) {
      const tile = this.getTile();
      const inTunnel = tile.x < 0 || tile.x >= COLS;

      if (this.nextDir !== DIR.NONE && !inTunnel) {
        const ntx = tile.x + this.nextDir.x;
        const nty = tile.y + this.nextDir.y;
        if (PacMan.isWalkable(ntx, nty, map)) {
          this.snapToCenter();
          this.dir = this.nextDir;
        }
      }

      // Check if current direction is blocked
      const ftx = tile.x + this.dir.x;
      const fty = tile.y + this.dir.y;
      if (!PacMan.isWalkable(ftx, fty, map)) {
        this.snapToCenter();
        this.dir = DIR.NONE;
        return { scoreDelta: 0, dotsEaten: 0, powerEaten: false };
      }
    }

    if (this.dir === DIR.NONE) {
      return { scoreDelta: 0, dotsEaten: 0, powerEaten: false };
    }

    // Speed with boost
    let currentSpeed = this.speed;
    if (this.speedBoostTimer > 0) currentSpeed *= 1.5;
    const speed = currentSpeed * dt * 60;

    this.x += this.dir.x * speed;
    this.y += this.dir.y * speed;
    this.tunnelWrap();

    // Mouth animation
    this.mouthOpen += this.mouthDir * 0.15;
    if (this.mouthOpen > 1) { this.mouthOpen = 1; this.mouthDir = -1; }
    if (this.mouthOpen < 0) { this.mouthOpen = 0; this.mouthDir = 1; }

    // Collect items
    let scoreDelta = 0;
    let dotsEaten = 0;
    let powerEaten = false;

    const tile = this.getTile();
    if (tile.x >= 0 && tile.x < COLS && tile.y >= 0 && tile.y < ROWS) {
      const cell = map[tile.y][tile.x];
      if (cell === DOT) {
        map[tile.y][tile.x] = EMPTY;
        scoreDelta += SCORE_CHERRY;
        dotsEaten++;
      } else if (cell === POWER) {
        map[tile.y][tile.x] = EMPTY;
        scoreDelta += SCORE_POWER;
        dotsEaten++;
        powerEaten = true;
      }
    }

    return { scoreDelta, dotsEaten, powerEaten };
  }

  /** Update speed boost timer. */
  updateBoost(dt) {
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= dt * 1000;
      if (this.speedBoostTimer <= 0) this.speedBoostTimer = 0;
    }
  }

  /** Check if a tile is walkable for Pac-Man. */
  static isWalkable(tx, ty, map) {
    if (tx < 0 || tx >= COLS) return true; // tunnel
    if (ty < 0 || ty >= ROWS) return false;
    const cell = map[ty][tx];
    if (cell === WALL) return false;
    if (cell === GHOST_DOOR) return false; // Pac-Man can't pass ghost door
    return true;
  }
}
