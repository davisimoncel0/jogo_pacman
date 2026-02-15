/**
 * Service for saving and loading rankings from the server API.
 * Includes fallback to localStorage if the API is unavailable (e.g., static hosting).
 */
export class RankingService {
  /**
   * Save a player's score to the API.
   * @param {string} name - Player name
   * @param {number} score - Final score
   * @param {number} level - Level reached
   */
  static async save(name, score, level) {
    const data = { name, score, level, date: new Date().toISOString() };

    try {
      const response = await fetch('/api/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao salvar no banco de dados');
      }
    } catch (err) {
      console.error('Falha ao salvar ranking no MongoDB:', err);
      alert('Não foi possível salvar seu recorde no ranking global: ' + err.message);
    }
  }

  /**
   * Load top rankings from the API.
   * @returns {Promise<Array<{ name: string, score: number, level: number, date: string }>>}
   */
  static async load() {
    try {
      const res = await fetch('/api/rankings');
      if (!res.ok) throw new Error('Erro ao carregar rankings');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Falha ao carregar ranking do MongoDB:', err);
      return [];
    }
  }

  /**
   * Render rankings into an HTML container element.
   * @param {HTMLElement} container
   * @param {Array} rankings
   */
  static renderInto(container, rankings) {
    if (!rankings || rankings.length === 0) {
      container.innerHTML = '<p class="ranking-empty">Nenhum recorde global registrado ainda.</p>';
      return;
    }

    container.innerHTML = rankings.map((r, i) => {
      const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`;
      const safeName = (r.name || 'Anônimo').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `
        <div class="ranking-entry">
          <span class="ranking-pos ${posClass}">${medal}</span>
          <span class="ranking-name">${safeName}</span>
          <span class="ranking-level">F${r.level}</span>
          <span class="ranking-score">${(r.score || 0).toLocaleString()}</span>
        </div>
      `;
    }).join('');
  }
}
