import {
  TILE, COLS, ROWS, WALL, DOT, POWER, GHOST_DOOR, EMPTY,
  DIR, CANVAS_W, CANVAS_H, FRIGHTENED_COLOR,
} from './constants.js';

/**
 * Renderizador do jogo — responsável por desenhar todos os elementos visuais
 * no Canvas HTML5: mapa (paredes, dots, cerejas), Pac-Man e fantasmas.
 */
export class Renderer {

  /**
   * Inicializa o renderizador com o Canvas do jogo.
   * Define as dimensões do Canvas e obtém o contexto 2D para desenho.
   * @param {HTMLCanvasElement} canvas - Elemento Canvas do HTML
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    this.frameCount = 0; // Contador de frames para animações
  }

  /**
   * Limpa todo o Canvas preenchendo com a cor de fundo escura.
   * Chamado no início de cada frame antes de redesenhar.
   */
  clear() {
    this.ctx.fillStyle = '#000010';
    this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    this.frameCount++;
  }

  /**
   * Desenha o mapa da fase atual no Canvas.
   * Percorre cada célula do grid e renderiza o elemento correspondente:
   * paredes, dots, cerejas ou porta dos fantasmas.
   * @param {number[][]} map - Matriz do mapa atual
   */
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
          // Porta da casa dos fantasmas — linha rosa horizontal
          ctx.fillStyle = '#ff88aa';
          ctx.fillRect(x, y + TILE / 2 - 2, TILE, 4);
        }
      }
    }
  }

  /**
   * Desenha um tile de parede com efeito de borda neon.
   * Verifica os vizinhos para saber quais bordas desenhar.
   * @param {number} x - Posição X em pixels
   * @param {number} y - Posição Y em pixels
   * @param {number} r - Linha no grid
   * @param {number} c - Coluna no grid
   * @param {number[][]} map - Mapa atual
   */
  _drawWall(x, y, r, c, map) {
    const ctx = this.ctx;
    // Preenche o tile com azul escuro
    ctx.fillStyle = '#1a1a4e';
    ctx.fillRect(x, y, TILE, TILE);

    // Bordas neon azul — só onde há vizinho não-parede
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

  /**
   * Desenha um dot (ponto coletável) amarelo.
   * Círculo pequeno no centro do tile.
   * @param {number} x - Posição X em pixels
   * @param {number} y - Posição Y em pixels
   */
  _drawDot(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = '#ffcc66';
    ctx.beginPath();
    ctx.arc(x + TILE / 2, y + TILE / 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Desenha a power pellet (cereja de poder) como um círculo branco/creme.
   * Visual estático (sem pulsação), com glow suave e reflexo interno.
   * @param {number} x - Posição X em pixels
   * @param {number} y - Posição Y em pixels
   */
  _drawCherry(x, y) {
    const ctx = this.ctx;
    const cx = x + TILE / 2;
    const cy = y + TILE / 2;
    const radius = TILE / 2 - 3;

    // Glow externo suave (sem pulsação)
    ctx.save();
    ctx.shadowColor = '#fffbe6';
    ctx.shadowBlur = 8;

    // Círculo branco/creme (sem animação)
    ctx.fillStyle = '#f5f0e0';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Reflexo de brilho interno
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
  /**
   * Desenha o cogumelo brilhante (power-up especial andante).
   * Inclui corpo com glow pulsante arco-íris e chapéu com manchas.
   * @param {import('./Mushroom.js').Mushroom} mushroom - Instância do cogumelo
   */
  drawMushroom(mushroom) {
    if (!mushroom.active) return;
    const ctx = this.ctx;
    const x = mushroom.x;
    const y = mushroom.y;
    const t = Date.now() / 200;

    // Cores que ciclam no arco-íris
    const hue = (t * 30) % 360;
    const pulse = 0.6 + 0.4 * Math.sin(t);

    ctx.save();

    // Glow externo arco-íris
    ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    ctx.shadowBlur = 15 * pulse;

    // Caule do cogumelo (retângulo branco-rosado)
    ctx.fillStyle = '#ffe8cc';
    ctx.fillRect(x - 3, y - 1, 6, 8);

    // Chapéu do cogumelo (semicírculo colorido)
    ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
    ctx.beginPath();
    ctx.arc(x, y - 2, TILE / 2 - 3, Math.PI, 0);
    ctx.fill();

    // Manchas brancas no chapéu
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(x - 3, y - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 3, y - 4, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Brilho/estrela cintilante
    if (Math.sin(t * 3) > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(x - 5, y - 7, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Desenha o Pac-Man com animação de boca abrindo/fechando.
   * A rotação é baseada na direção atual de movimento.
   * Inclui efeito de brilho neon amarelo, indicador de boost de velocidade
   * e efeito visual colorido quando sob efeito do cogumelo brilhante.
   * @param {import('./PacMan.js').PacMan} pacman - Instância do Pac-Man
   */
  drawPacMan(pacman) {
    const ctx = this.ctx;
    const angle = pacman.mouthOpen * 0.3; // Ângulo de abertura da boca
    let rotation = 0;

    // Rotaciona com base na direção do movimento
    if (pacman.dir === DIR.RIGHT) rotation = 0;
    else if (pacman.dir === DIR.DOWN) rotation = Math.PI / 2;
    else if (pacman.dir === DIR.LEFT) rotation = Math.PI;
    else if (pacman.dir === DIR.UP) rotation = -Math.PI / 2;

    // Determina a cor do Pac-Man (colorido quando cogumelo ativo)
    let bodyColor = '#ffe600';
    let glowColor = '#ffe600';
    if (pacman.mushroomPower) {
      const t = Date.now() / 100;
      const hue = (t * 50) % 360;
      bodyColor = `hsl(${hue}, 100%, 60%)`;
      glowColor = `hsl(${hue}, 100%, 70%)`;
    }

    ctx.save();
    ctx.translate(pacman.x, pacman.y);
    ctx.rotate(rotation);

    // Corpo com brilho neon
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = pacman.mushroomPower ? 20 : 12;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, TILE / 2 - 2, angle, Math.PI * 2 - angle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Indicador visual de boost de velocidade
    if (pacman.mushroomPower) {
      // Efeito arco-íris pulsante para o cogumelo (anel duplo)
      const t = Date.now() / 200;
      const hue = (t * 30) % 360;
      ctx.save();
      ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.6)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pacman.x, pacman.y, TILE / 2 + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `hsla(${(hue + 180) % 360}, 100%, 60%, 0.4)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pacman.x, pacman.y, TILE / 2 + 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (pacman.speedBoostTimer > 0) {
      // Anel ciano para boost da cereja
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pacman.x, pacman.y, TILE / 2 + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Desenha todos os fantasmas na tela.
   * Fantasmas comidos são renderizados apenas como olhos flutuantes.
   * @param {import('./Ghost.js').Ghost[]} ghosts - Array de fantasmas
   * @param {import('./PacMan.js').PacMan} pacman - Para que os olhos olhem pro Pac-Man
   */
  drawGhosts(ghosts, pacman) {
    ghosts.forEach(ghost => {
      if (ghost.eaten) {
        // Fantasma comido — só olhos voltando para casa
        this._drawGhostEyes(ghost.x, ghost.y, ghost.dir);
        return;
      }

      // Fantasma normal ou assustado
      const color = ghost.frightened ? FRIGHTENED_COLOR : ghost.color;
      this._drawGhostBody(ghost, color, pacman);
    });
  }

  /**
   * Desenha o corpo de um fantasma com base ondulada animada.
   * Inclui olhos com pupilas que seguem o Pac-Man.
   * No modo assustado, os olhos são brancos e a boca é zigzag.
   * @param {import('./Ghost.js').Ghost} ghost - Instância do fantasma
   * @param {string} color - Cor do corpo (#hex)
   * @param {import('./PacMan.js').PacMan} pacman - Referência ao Pac-Man
   */
  _drawGhostBody(ghost, color, pacman) {
    const ctx = this.ctx;
    const r = TILE / 2 - 2;

    ctx.save();
    ctx.translate(ghost.x, ghost.y);
    ctx.shadowColor = color;
    ctx.shadowBlur = ghost.frightened ? 5 : 10;

    // Corpo: semicírculo no topo + base ondulada
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -2, r, Math.PI, 0);
    ctx.lineTo(r, r - 2);

    // Animação das ondas na base (usando sen + frameCount)
    const wave = Math.sin(this.frameCount * 0.2 + ghost.index) * 2;
    for (let wx = r; wx >= -r; wx -= r / 3) {
      const wy = r - 2 + (wx % (r / 1.5) === 0 ? wave : -wave);
      ctx.lineTo(wx, wy);
    }
    ctx.lineTo(-r, -2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Olhos
    if (ghost.frightened) {
      // Modo assustado: olhos brancos simples + boca zigzag
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
      // Olhos normais com pupilas que rastreiam o Pac-Man
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(-4, -4, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(4, -4, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupilas — direcionadas para o Pac-Man
      const dx = pacman.x - ghost.x;
      const dy = pacman.y - ghost.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const px = (dx / len) * 2; // Deslocamento X proporcional
      const py = (dy / len) * 2; // Deslocamento Y proporcional
      ctx.fillStyle = '#1a1aff';
      ctx.beginPath();
      ctx.arc(-4 + px, -4 + py, 2, 0, Math.PI * 2);
      ctx.arc(4 + px, -4 + py, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Desenha apenas os olhos de um fantasma (estado "comido").
   * Quando o fantasma é comido, ele retorna para casa como olhos flutuantes.
   * @param {number} x - Posição X do fantasma
   * @param {number} y - Posição Y do fantasma
   * @param {{ x: number, y: number }} dir - Direção atual do fantasma
   */
  _drawGhostEyes(x, y, dir) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    // Escleras brancas
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-4, -2, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(4, -2, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupilas apontando na direção de movimento
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
