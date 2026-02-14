import { TILE, DIR, CANVAS_W, CANVAS_H } from './constants.js';

/**
 * Base class for all moving entities (Pac-Man, Ghosts).
 */
export class Entity {
  constructor(tileX, tileY) {
    this.x = tileX * TILE + TILE / 2;
    this.y = tileY * TILE + TILE / 2;
    this.dir = DIR.NONE;
    this.speed = 2;
  }

  /** Get current tile coordinates. */
  getTile() {
    return {
      x: Math.floor(this.x / TILE),
      y: Math.floor(this.y / TILE),
    };
  }

  /** Check if entity is at the center of a tile. */
  isAtTileCenter() {
    const cx = Math.floor(this.x / TILE) * TILE + TILE / 2;
    const cy = Math.floor(this.y / TILE) * TILE + TILE / 2;
    return Math.abs(this.x - cx) < 2 && Math.abs(this.y - cy) < 2;
  }

  /** Snap position to exact tile center. */
  snapToCenter() {
    this.x = Math.floor(this.x / TILE) * TILE + TILE / 2;
    this.y = Math.floor(this.y / TILE) * TILE + TILE / 2;
  }

  /** Wrap through tunnels at screen edges. */
  tunnelWrap() {
    if (this.x < -TILE / 2) this.x = CANVAS_W + TILE / 2;
    if (this.x > CANVAS_W + TILE / 2) this.x = -TILE / 2;
  }
}
