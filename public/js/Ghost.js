import { Entity } from './Entity.js';
import {
  TILE, DIR, COLS, ROWS, WALL, GHOST_DOOR,
  GHOST_HOME, GHOST_COLORS, GHOST_NAMES,
  GHOST_DOOR_COL, GHOST_EXIT_ROW, CANVAS_W,
} from './constants.js';

/**
 * Ghost enemy class — child-friendly AI.
 */
export class Ghost extends Entity {
  /**
   * @param {number} index - Ghost index (0-3)
   * @param {number} level - Current game level
   */
  constructor(index, level) {
    const home = GHOST_HOME[index];
    super(home.x, home.y);
    this.index = index;
    this.color = GHOST_COLORS[index];
    this.name = GHOST_NAMES[index];
    this.dir = DIR.UP;
    // Constant speed for ghosts
    this.speed = 2.1;
    this.frightened = false;
    this.eaten = false;
    this.exited = false;
    this.exiting = false;
    this.exitTimer = Ghost.EXIT_TIMERS[index];
  }

// Staggered exit timers per ghost (increased for better cadence)
  static EXIT_TIMERS = [0, 4000, 8000, 12000];

  /** Reset ghost to home position. */
  reset(level) {
    const home = GHOST_HOME[this.index];
    this.x = home.x * TILE + TILE / 2;
    this.y = home.y * TILE + TILE / 2;
    this.dir = DIR.UP;
    // Constant speed for ghosts, difficulty comes from map complexity
    this.speed = 2.1; 
    this.frightened = false;
    this.eaten = false;
    this.exited = false;
    this.exiting = false;
    this.exitTimer = Ghost.EXIT_TIMERS[this.index];
  }

  /**
   * Update ghost movement for one frame.
   * @param {number} dt - Delta time in seconds
   * @param {{ x: number, y: number }} pacTile - Pac-Man's tile position
   * @param {number[][]} map - Current level map
   */
  update(dt, pacTile, map) {
    // PHASE 1: Waiting inside the house
    if (!this.exited && !this.exiting) {
      this._waitInHouse(dt);
      return;
    }

    // PHASE 2: Walking out through the door
    if (this.exiting) {
      this._walkOutDoor(dt, map, pacTile);
      return;
    }

    // PHASE 3: Eaten — return home
    if (this.eaten) {
      this._returnHome(dt);
      return;
    }

    // PHASE 4: Normal movement in maze
    this._moveInMaze(dt, pacTile, map);
  }

  /** Phase 1: Bobbing animation while waiting. */
  _waitInHouse(dt) {
    this.exitTimer -= dt * 1000;
    const home = GHOST_HOME[this.index];
    this.y = home.y * TILE + TILE / 2 + Math.sin(performance.now() / 300 + this.index) * 3;
    this.x = home.x * TILE + TILE / 2;

    if (this.exitTimer <= 0) {
      this.exiting = true;
      this.x = GHOST_DOOR_COL * TILE + TILE / 2;
      this.dir = DIR.UP;
      // Force position update to ensure movement starts
      this.y -= 1; 
    }
  }

  /** Phase 2: Walk upwards through the ghost door. */
  _walkOutDoor(dt, map, pacTile) {
    const exitY = GHOST_EXIT_ROW * TILE + TILE / 2;
    this.dir = DIR.UP;
    this.y -= this.speed * 1.5 * dt * 60;
    this.x = GHOST_DOOR_COL * TILE + TILE / 2;

    if (this.y <= exitY) {
      this.y = exitY;
      this.exiting = false;
      this.exited = true;
      
      // Immediately start chasing Pac-Man
      this._moveInMaze(0, pacTile, map); 
    }
  }

  /** Phase 3: Return home after being eaten. */
  _returnHome(dt) {
    const home = GHOST_HOME[this.index];
    const hx = home.x * TILE + TILE / 2;
    const hy = home.y * TILE + TILE / 2;

    if (Math.abs(this.x - hx) < 4 && Math.abs(this.y - hy) < 4) {
      this.eaten = false;
      this.frightened = false;
      this.exited = false;
      this.exiting = false;
      this.exitTimer = 3000; // Delay before re-exiting
      this.x = hx;
      this.y = hy;
      this.dir = DIR.UP;
    } else {
      const dx = hx - this.x;
      const dy = hy - this.y;
      const returnSpeed = this.speed * 3 * dt * 60; // Faster return
      // Simple direct movement
      if (Math.abs(dx) > Math.abs(dy)) {
        this.x += Math.sign(dx) * returnSpeed;
      } else {
        this.y += Math.sign(dy) * returnSpeed;
        if (Math.abs(dx) > 1) this.x += Math.sign(dx) * returnSpeed * 0.5; // Diagonal help
      }
    }
  }

  /** Phase 4: Move through the maze chasing Pac-Man (Aggressive AI). */
  _moveInMaze(dt, pacTile, map) {
    const currentSpeed = (this.frightened ? this.speed * 0.6 : this.speed); // Slightly faster in frightened mode
    const speed = currentSpeed * (dt > 0 ? dt : 0.016) * 60; // Handle dt=0 case from _walkOutDoor

    if (this.isAtTileCenter()) {
      this.snapToCenter();
      const tile = this.getTile();

      let target;
      if (this.frightened) {
        // Run AWAY from Pac-Man
        // Target is the corner furthest from Pac-Man
        const corners = [
            { x: 1, y: 1 },
            { x: COLS - 2, y: 1 },
            { x: 1, y: ROWS - 2 },
            { x: COLS - 2, y: ROWS - 2 }
        ];
        let maxDist = -1;
        
        for (const corner of corners) {
            const d = (corner.x - pacTile.x) ** 2 + (corner.y - pacTile.y) ** 2;
            if (d > maxDist) {
                maxDist = d;
                target = corner;
            }
        }
      } else {
        // Chase logic - Aggressive direct chase for ALL ghosts to ensure they go after Pac-Man
        target = pacTile;
      }

      // Find best direction (no reversing allowed usually, but simplified here)
      const opposite = { x: -this.dir.x, y: -this.dir.y };
      const directions = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
      let bestDir = null;
      let bestDist = Infinity;

      for (const d of directions) {
        // Prevent immediate 180 turn unless stuck
        if (d.x === opposite.x && d.y === opposite.y) continue;
        
        const ntx = tile.x + d.x;
        const nty = tile.y + d.y;
        
        if (!Ghost.isWalkable(ntx, nty, map, this.exited)) continue;
        
        const dist = (ntx - target.x) ** 2 + (nty - target.y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          bestDir = d;
        }
      }

      // Fallback: if trapped (cul-de-sac), allow reverse
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

    if (dt > 0) {
        this.x += this.dir.x * speed;
        this.y += this.dir.y * speed;
        this.tunnelWrap();
    }
  }

  /** Check if a tile is walkable for a ghost. */
  static isWalkable(tx, ty, map, ghostExited) {
    if (tx < 0 || tx >= COLS) return true; // tunnel
    if (ty < 0 || ty >= ROWS) return false;
    const cell = map[ty][tx];
    if (cell === WALL) return false;
    if (cell === GHOST_DOOR) {
      if (ghostExited) return false; // exited ghosts can't re-enter
      return true;
    }
    return true;
  }
}
