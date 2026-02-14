/**
 * Service for saving and loading rankings from the server API.
 * Includes fallback to localStorage if the API is unavailable (e.g., static hosting).
 */
export class RankingService {
  static LOCAL_STORAGE_KEY = 'pacman_rankings';

  /**
   * Save a player's score. Tries API first, falls back to localStorage.
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
      
      if (!response.ok) throw new Error('API Error');
    } catch (err) {
      console.warn('API unavailable, saving to localStorage:', err);
      this._saveLocal(data);
    }
  }

  /**
   * Load top rankings. Tries API first, falls back to localStorage.
   * @returns {Promise<Array<{ id: number, name: string, score: number, level: number, date: string }>>}
   */
  static async load() {
    try {
      const res = await fetch('/api/rankings');
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('API unavailable, loading from localStorage:', err);
      return this._loadLocal();
    }
  }

  /**
   * Render rankings into an HTML container element.
   * @param {HTMLElement} container
   * @param {Array} rankings
   */
  static renderInto(container, rankings) {
    if (!rankings || rankings.length === 0) {
      container.innerHTML = '<p class="ranking-empty">Nenhum score registrado ainda.</p>';
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

  /* Private LocalStorage Helpers */

  static _saveLocal(newEntry) {
    const current = this._loadLocal();
    current.push(newEntry);
    
    // Sort by score descending
    current.sort((a, b) => b.score - a.score);
    
    // Keep top 10
    const top10 = current.slice(0, 10);
    
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(top10));
  }

  static _loadLocal() {
    try {
      const raw = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('LocalStorage error:', e);
      return [];
    }
  }
}
