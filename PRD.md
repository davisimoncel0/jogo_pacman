# Documento de Requisitos do Produto (PRD) - Jogo Pac-Man

## 1. Introdução

Este documento define os requisitos funcionais e técnicos para o desenvolvimento de um jogo web inspirado no clássico Pac-Man, com mecânicas personalizadas e um sistema de ranking persistente. O projeto foca em uma experiência de usuário rica visualmente e desafiadora, com 6 fases progressivas e integração backend para armazenamento de pontuações.

## 2. Objetivos do Produto

*   **Experiência Visual**: Oferecer um jogo com estética moderna e agradável, utilizando Canvas HTML5.
*   **Progressão**: Implementar um sistema de 6 fases com dificuldade crescente.
*   **Competitividade**: Ranking global persistente em MongoDB, com atualização automática de recordes por usuário único.
*   **Mecânicas Únicas**: Introduzir poderes específicos através de cerejas e passagens secretas estratégicas.

## 3. Mecânicas de Jogo (Gameplay)

### 3.1. Personagens e Controles

*   **Pac-Man (Jogador)**:
    *   Movimentação em grade (Grid/Graph System) nas 4 direções (Cima, Baixo, Esquerda, Direita).
    *   Controle via teclado (setas ou WASD).
    *   Objetivo: Comer todas as pastilhas (dots) do labirinto para avançar de fase.
    *   Vidas: O jogador inicia com 3 vidas. Perde uma vida ao colidir com um fantasma não-vulnerável.

*   **Fantasmas (Inimigos)**:
    *   **Quantidade**: 4 fantasmas com cores distintas (Vermelho, Rosa, Azul, Laranja).
    *   **Comportamento (IA)**: Devem perseguir o Pac-Man utilizando algoritmos de busca em caminho (pathfinding no grafo/grid). A agressividade ou velocidade pode aumentar conforme as fases.
    *   **Estados**:
        1.  **Caça (Chase)**: Perseguem o Pac-Man ativamente.
        2.  **Dispersão (Scatter)**: Movem-se para cantos específicos do mapa (opcional, para dar respiro ao jogador).
        3.  **Vulnerável (Frightened)**: Ficam azuis e movem-se aleatoriamente ou fogem do Pac-Man (ativado pela Cereja).
        4.  **Comidos (Eaten)**: Retornam à "casa" (centro) para renascer.

### 3.2. Itens e Power-ups

*   **Pastilhas (Dots)**: Itens comuns espalhados pelo mapa. Aumentam a pontuação (10 pontos). São os **únicos itens que contam para completar a fase**.
*   **Cereja (Power Pellet)**:
    *   **Diferencial**: Ao contrário do jogo clássico onde a cereja é apenas pontuação bônus, neste projeto **a Cereja concede superpoderes**.
    *   **Efeito**: Ao comer a cereja, os fantasmas tornam-se vulneráveis (azuis) por um período limitado. Pac-Man pode comê-los para ganhar pontos extras (200 pontos).
    *   **Velocidade**: Concede boost de velocidade 1.5x durante 5 segundos.
    *   **NÃO conta para completar a fase** — apenas concede poder.
    *   **Exclusividade**: Só pode ser consumida se **nenhum poder estiver ativo** (nem cereja, nem cogumelo).
*   **Cogumelo Brilhante (Power-Up Especial)**:
    *   Aparece periodicamente no mapa por tempo limitado.
    *   **Velocidade**: Concede boost de 1.7x (um pouco mais que a cereja).
    *   **Pontos Dobrados**: Enquanto ativo, todos os pontos (dots e fantasmas) são multiplicados por 2.
    *   **Duração**: 12 segundos (maior que a cereja).
    *   **Exclusividade**: Só pode ser consumido se **o poder da cereja NÃO estiver ativo**, e vice-versa.

### 3.3. Elementos do Mapa

*   **Labirinto (Maze)**: Layout baseado em grade/grafo onde os personagens se movem.
*   **Portas Secretas (Warp Tunnels)**:
    *   Localizadas nas extremidades do mapa.
    *   Ao entrar em uma porta, o Pac-Man aparece instantaneamente no lado oposto ou em outra localização específica do mapa, mudando sua direção/posicionamento no grafo.
    *   Estratégia: Utilizadas para escapar de encurraladas.

## 4. Estrutura de Níveis (Fases)

O jogo consiste em **6 Fases** distintas:

1.  **Fase 1**: Layout Clássico. Introdução às mecânicas.
2.  **Fase 2**: Arena Aberta. Mais espaço, mas menos cobertura.
3.  **Fase 3**: Corredores. Movimentação restrita, fácil de ser encurralado.
4.  **Fase 4**: Cruzamento. Muitas intersecções, exigindo decisões rápidas.
5.  **Fase 5**: Fortaleza. Layout defensivo, difícil acesso às pastilhas centrais.
6.  **Fase 6**: Desafio Final. O mapa mais complexo e labiríntico.

Ao completar a Fase 6, o jogador vence o jogo e registra sua pontuação "Zerou o jogo".

## 5. Requisitos Técnicos

### 5.1. Backend (Node.js)

*   **Servidor**: Implementação em Node.js puro (sem frameworks pesados como Express para manter leveza, conforme `server.js` atual).
*   **Banco de Dados**: MongoDB (Banco: `pacman`, Coleção: `ranking`).
*   **API Endpoints**:
    *   `GET /api/rankings`: Retorna o Top 10 pontuações (JSON).
    *   `POST /api/rankings`: Recebe `{ name, score, level }` para salvar nova pontuação. Validação de dados obrigatória.
*   **Arquivos Estáticos**: Servir `index.html`, CSS, JS e assets da pasta `public`.

### 5.2. Frontend (HTML/CSS/JS)

*   **Tecnologia**: Vanilla JavaScript (ES6+).
*   **Renderização**: HTML5 Canvas para performance (60 FPS).
*   **Estilo**: Design moderno, "neon" ou "arcade premium", com animações suaves. Evitar visual "básico".
*   **Áudio**: Efeitos sonoros para comer pastilhas, comer cereja, morte, e música de fundo (opcional, mas recomendado).

### 5.3. Estrutura de Dados (Banco de Dados)

Tabela `rankings` já definida no `server.js`:
```sql
CREATE TABLE IF NOT EXISTS rankings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  level INTEGER NOT NULL,
  date TEXT NOT NULL
);
```

## 6. Fluxo de Jogo (User Flow)

1.  **Tela Inicial**:
    *   Título do Jogo.
    *   Botão "Jogar".
    *   Tabela de "Melhores Pontuações" (Top 10 carregado da API).
2.  **Gameplay**:
    *   Contagem regressiva (3, 2, 1, GO!).
    *   Jogador controla Pac-Man.
    *   HUD (Heads-up Display): Mostra Score Atual, Vidas Restantes, Fase Atual.
3.  **Fim de Fase**:
    *   Pequena pausa/animação.
    *   Reinício na próxima fase com dificuldade elevada.
4.  **Game Over / Vitória**:
    *   Mensagem "Game Over" ou "Você Venceu!".
    *   Input para digitar o Nome do Jogador (3 letras ou nome completo).
    *   Botão "Salvar Pontuação" (Envia POST para API).
    *   Retorno à Tela Inicial com ranking atualizado.

## 7. Notas de Implementação

*   **Grafo de Navegação**: O mapa deve ser tratado logicamente como um grafo ou matriz de tiles para facilitar o algoritmo A* (A-Star) ou similar para os fantasmas.
*   **Colisão**: Detecção precisa de colisão entre Pac-Man e paredes/fantasmas/itens.
*   **Responsividade**: O Canvas deve se adaptar a diferentes tamanhos de tela, mantendo a proporção (aspect ratio).

---
*Este documento serve como guia central para o desenvolvimento e garante que todas as funcionalidades solicitadas sejam atendidas.*
