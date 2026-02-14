/**
 * Service for saving and loading rankings from the server API.
 */
export class RankingService {
  /**
   * Save a player's score to the server.
   * @param {string} name - Player name
   * @param {number} score - Final score
   * @param {number} level - Level reached
   */
  static async save(name, score, level) {
    try {
      await fetch('/api/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score, level }),
      });
    } catch (err) {
      console.error('Failed to save score:', err);
    }
  }

  /**
   * Load the top rankings from the server.
   * @returns {Promise<Array<{ id: number, name: string, score: number, level: number, date: string }>>}
   */
  static async load() {
    try {
      const res = await fetch('/api/rankings');
      return await res.json();
    } catch (err) {
      console.error('Failed to load rankings:', err);
      return [];
    }
  }

  /**
   * Render rankings into an HTML container element.
   * @param {HTMLElement} container
   * @param {Array} rankings
   */
  static renderInto(container, rankings) {
    if (rankings.length === 0) {
      container.innerHTML = '<p class="ranking-empty">Nenhum score registrado ainda.</p>';
      return;
    }

    container.innerHTML = rankings.map((r, i) => {
      const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`;
      const safeName = r.name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `
        <div class="ranking-entry">
          <span class="ranking-pos ${posClass}">${medal}</span>
          <span class="ranking-name">${safeName}</span>
          <span class="ranking-level">F${r.level}</span>
          <span class="ranking-score">${r.score.toLocaleString()}</span>
        </div>
      `;
    }).join('');
  }
}
