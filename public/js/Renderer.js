import {
  TILE, COLS, ROWS, WALL, DOT, POWER, GHOST_DOOR, EMPTY,
  DIR, CANVAS_W, CANVAS_H, FRIGHTENED_COLOR,
} from './constants.js';

/**
 * Handles all canvas rendering — map, Pac-Man, ghosts, cherries, power pellets.
 */
export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    this.frameCount = 0;
  }

  /** Clear the canvas. */
  clear() {
    this.ctx.fillStyle = '#000010';
    this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    this.frameCount++;
  }

  /** Draw the level map — walls, cherries, power pellets, ghost door. */
  drawMap(map) {
    const ctx = this.ctx;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = map[r][c];
        const x = c * TILE;
        const y = r * TILE;

        if (cell === WALL) {
          this._drawWall(x, y, r, c, map);
        } else if (cell === DOT) {
          this._drawDot(x, y);
        } else if (cell === POWER) {
          this._drawCherry(x, y);
        } else if (cell === GHOST_DOOR) {
          ctx.fillStyle = '#ff88aa';
          ctx.fillRect(x, y + TILE / 2 - 2, TILE, 4);
        }
      }
    }
  }

  /** Draw a wall tile with neon border effect. */
  _drawWall(x, y, r, c, map) {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a4e';
    ctx.fillRect(x, y, TILE, TILE);

    ctx.strokeStyle = '#2244aa';
    ctx.lineWidth = 1.5;

    const top = r > 0 && map[r - 1][c] !== WALL;
    const bottom = r < ROWS - 1 && map[r + 1][c] !== WALL;
    const left = c > 0 && map[r][c - 1] !== WALL;
    const right = c < COLS - 1 && map[r][c + 1] !== WALL;

    if (top)    { ctx.beginPath(); ctx.moveTo(x, y + 0.5); ctx.lineTo(x + TILE, y + 0.5); ctx.stroke(); }
    if (bottom) { ctx.beginPath(); ctx.moveTo(x, y + TILE - 0.5); ctx.lineTo(x + TILE, y + TILE - 0.5); ctx.stroke(); }
    if (left)   { ctx.beginPath(); ctx.moveTo(x + 0.5, y); ctx.lineTo(x + 0.5, y + TILE); ctx.stroke(); }
    if (right)  { ctx.beginPath(); ctx.moveTo(x + TILE - 0.5, y); ctx.lineTo(x + TILE - 0.5, y + TILE); ctx.stroke(); }
  }

  /** Draw a small yellow dot collectible. */
  _drawDot(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = '#ffcc66';
    ctx.beginPath();
    ctx.arc(x + TILE / 2, y + TILE / 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Draw a cherry 🍒 (power pellet). */
  _drawCherry(x, y) {
    const ctx = this.ctx;
    const cx = x + TILE / 2;
    const cy = y + TILE / 2;

    // Cherry bodies (larger)
    ctx.fillStyle = '#ff2244';
    ctx.beginPath();
    ctx.arc(cx - 3, cy + 1, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 3, cy + 1, 6, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = '#ff8899';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 1, 2, 0, Math.PI * 2);
    ctx.fill();

    // Stems (thicker)
    ctx.strokeStyle = '#33aa33';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 1, cy - 4);
    ctx.quadraticCurveTo(cx, cy - 8, cx + 2, cy - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 1, cy - 4);
    ctx.quadraticCurveTo(cx + 2, cy - 8, cx + 4, cy - 6);
    ctx.stroke();
  }

  /** Draw Pac-Man with mouth animation. */
  drawPacMan(pacman) {
    const ctx = this.ctx;
    const angle = pacman.mouthOpen * 0.3;
    let rotation = 0;
    if (pacman.dir === DIR.RIGHT) rotation = 0;
    else if (pacman.dir === DIR.DOWN) rotation = Math.PI / 2;
    else if (pacman.dir === DIR.LEFT) rotation = Math.PI;
    else if (pacman.dir === DIR.UP) rotation = -Math.PI / 2;

    ctx.save();
    ctx.translate(pacman.x, pacman.y);
    ctx.rotate(rotation);
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffe600';
    ctx.beginPath();
    ctx.arc(0, 0, TILE / 2 - 2, angle, Math.PI * 2 - angle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Speed boost indicator
    if (pacman.speedBoostTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pacman.x, pacman.y, TILE / 2 + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Draw all ghosts. */
  drawGhosts(ghosts, pacman) {
    ghosts.forEach(ghost => {
      if (ghost.eaten) {
        this._drawGhostEyes(ghost.x, ghost.y, ghost.dir);
        return;
      }

      const color = ghost.frightened ? FRIGHTENED_COLOR : ghost.color;
      this._drawGhostBody(ghost, color, pacman);
    });
  }

  /** Draw a ghost body with wavy bottom. */
  _drawGhostBody(ghost, color, pacman) {
    const ctx = this.ctx;
    const r = TILE / 2 - 2;

    ctx.save();
    ctx.translate(ghost.x, ghost.y);
    ctx.shadowColor = color;
    ctx.shadowBlur = ghost.frightened ? 5 : 10;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -2, r, Math.PI, 0);
    ctx.lineTo(r, r - 2);

    const wave = Math.sin(this.frameCount * 0.2 + ghost.index) * 2;
    for (let wx = r; wx >= -r; wx -= r / 3) {
      const wy = r - 2 + (wx % (r / 1.5) === 0 ? wave : -wave);
      ctx.lineTo(wx, wy);
    }
    ctx.lineTo(-r, -2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Eyes
    if (ghost.frightened) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-4, -4, 3, 0, Math.PI * 2);
      ctx.arc(4, -4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(-5, 3);
      for (let sx = -5; sx <= 5; sx += 2.5) {
        ctx.lineTo(sx, sx % 5 === 0 ? 3 : 6);
      }
      ctx.stroke();
    } else {
      // Normal eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(-4, -4, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(4, -4, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Pupils look toward Pac-Man
      const dx = pacman.x - ghost.x;
      const dy = pacman.y - ghost.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const px = (dx / len) * 2;
      const py = (dy / len) * 2;
      ctx.fillStyle = '#1a1aff';
      ctx.beginPath();
      ctx.arc(-4 + px, -4 + py, 2, 0, Math.PI * 2);
      ctx.arc(4 + px, -4 + py, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /** Draw ghost eyes only (eaten state). */
  _drawGhostEyes(x, y, dir) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-4, -2, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(4, -2, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    const px = dir.x * 2;
    const py = dir.y * 2;
    ctx.fillStyle = '#1a1aff';
    ctx.beginPath();
    ctx.arc(-4 + px, -2 + py, 2, 0, Math.PI * 2);
    ctx.arc(4 + px, -2 + py, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
