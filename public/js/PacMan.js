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
    // Check if stopped
    if (this.dir === DIR.NONE && this.nextDir === DIR.NONE) {
      return { scoreDelta: 0, dotsEaten: 0, powerEaten: false };
    }

    // Speed with boost
    let currentSpeed = this.speed;
    if (this.speedBoostTimer > 0) currentSpeed *= 1.5;
    const speed = currentSpeed * dt * 60;

    // Calculate move distance based on current direction
    const moveX = this.dir.x * speed;
    const moveY = this.dir.y * speed;

    // Current position details
    const tile = this.getTile();
    const centerX = tile.x * TILE + TILE / 2;
    const centerY = tile.y * TILE + TILE / 2;

    // Check if we overshoot the center in this frame
    let passedCenter = false;
    
    // Only check overshoots if we are actually moving in a direction
    if (this.dir.x > 0 && this.x < centerX && (this.x + moveX) >= centerX) passedCenter = true;
    else if (this.dir.x < 0 && this.x > centerX && (this.x + moveX) <= centerX) passedCenter = true;
    else if (this.dir.y > 0 && this.y < centerY && (this.y + moveY) >= centerY) passedCenter = true;
    else if (this.dir.y < 0 && this.y > centerY && (this.y + moveY) <= centerY) passedCenter = true;

    // Also consider cases where we are practically AT the center (within minimal tolerance)
    if (!passedCenter && this.isAtTileCenter()) {
       // Only force center logic if we actually intend to change direction or might hit a wall
       // Otherwise, let him pass freely to avoid getting stuck
       const tile = this.getTile();
       const ftx = tile.x + this.dir.x;
       const fty = tile.y + this.dir.y;
       
       // If we have a nextDir pending, OR if the wall ahead is blocked, we MUST snap to center
       if (this.nextDir !== DIR.NONE || !PacMan.isWalkable(ftx, fty, map)) {
           passedCenter = true;
       }
    }

    if (passedCenter) {
      // Snap to center first to execute precise turn
      this.x = centerX;
      this.y = centerY;

      // Try to turn to nextDir
      const tile = this.getTile(); // Refresh tile just in case
      const inTunnel = tile.x < 0 || tile.x >= COLS;
      let turned = false;

      if (this.nextDir !== DIR.NONE && !inTunnel) {
        const ntx = tile.x + this.nextDir.x;
        const nty = tile.y + this.nextDir.y;
        if (PacMan.isWalkable(ntx, nty, map)) {
          this.dir = this.nextDir;
          this.nextDir = DIR.NONE; // Direction consumed
          turned = true;
        }
      }

      // If didn't turn, check if we can continue straight
      if (!turned) {
        const ftx = tile.x + this.dir.x;
        const fty = tile.y + this.dir.y;
        if (!PacMan.isWalkable(ftx, fty, map)) {
           // Hit a wall, stop dead
           this.dir = DIR.NONE;
        }
      }
      
      // If we are still moving (either turned or continued straight), apply the remaining movement
      // This is crucial to prevent "stuttering" or getting stuck at center
      if (this.dir !== DIR.NONE) {
          const remSpeed = speed; // Simplification: just apply full speed for this frame to avoid complexity
          this.x += this.dir.x * remSpeed;
          this.y += this.dir.y * remSpeed;
      }
    } else {
      // Not at center, just apply movement
      this.x += moveX;
      this.y += moveY;
    }
    
    this.tunnelWrap();

    // Mouth animation
    this.mouthOpen += this.mouthDir * 0.15;
    if (this.mouthOpen > 1) { this.mouthOpen = 1; this.mouthDir = -1; }
    if (this.mouthOpen < 0) { this.mouthOpen = 0; this.mouthDir = 1; }

    // Collect items logic
    let scoreDelta = 0;
    let dotsEaten = 0;
    let powerEaten = false;

    // Re-calculate tile after movement
    const newTile = this.getTile();
    if (newTile.x >= 0 && newTile.x < COLS && newTile.y >= 0 && newTile.y < ROWS) {
      const cell = map[newTile.y][newTile.x];
      if (cell === DOT) {
        map[newTile.y][newTile.x] = EMPTY;
        scoreDelta += SCORE_CHERRY;
        dotsEaten++;
      } else if (cell === POWER) {
        map[newTile.y][newTile.x] = EMPTY;
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