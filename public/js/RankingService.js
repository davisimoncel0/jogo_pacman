/**
 * Serviço de Ranking — responsável por salvar e carregar pontuações do servidor.
 * Comunica-se com a API REST (/api/rankings) que persiste os dados no MongoDB.
 * Em caso de falha na API, exibe mensagem de erro ao jogador.
 */
export class RankingService {

  /**
   * Salva a pontuação de um jogador no ranking global.
   * Envia uma requisição POST para a API com os dados da partida.
   * @param {string} name - Nome do jogador
   * @param {number} score - Pontuação final alcançada
   * @param {number} level - Última fase alcançada
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
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao salvar no banco de dados');
      }
    } catch (err) {
      console.error('Falha ao salvar ranking no MongoDB:', err);
      alert('Não foi possível salvar seu recorde no ranking global: ' + err.message);
    }
  }

  /**
   * Carrega os top rankings do servidor.
   * Faz uma requisição GET para a API e retorna um array ordenado.
   * Em caso de erro, retorna array vazio para não quebrar a interface.
   * @returns {Promise<Array<{ name: string, score: number, level: number, date: string }>>}
   */
  static async load() {
    try {
      const res = await fetch('/api/rankings');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.status || 'Erro ao carregar rankings');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Falha ao carregar ranking do MongoDB:', err);
      return [];
    }
  }

  /**
   * Renderiza a lista de rankings dentro de um container HTML.
   * Exibe medalhas (🥇🥈🥉) para os 3 primeiros e posição numérica para os demais.
   * Sanitiza os nomes para prevenir XSS (injeção de HTML).
   * @param {HTMLElement} container - Elemento DOM que receberá o HTML do ranking
   * @param {Array} rankings - Array de objetos com os dados do ranking
   */
  static renderInto(container, rankings) {
    if (!rankings || rankings.length === 0) {
      container.innerHTML = '<p class="ranking-empty">Nenhum recorde global registrado ainda.</p>';
      return;
    }

    container.innerHTML = rankings.map((r, i) => {
      // Classes CSS para destaque visual das 3 primeiras posições
      const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      // Ícone: medalha para top 3, número para os demais
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`;
      // Sanitização do nome contra XSS
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
