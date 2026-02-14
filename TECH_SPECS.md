# Especificações Técnicas (TECH_SPECS.md) - Jogo Pac-Man

## 1. Visão Geral
Este projeto é uma implementação do clássico jogo Pac-Man utilizando tecnologias web modernas (HTML5 Canvas, CSS3, JavaScript ES6+) no frontend e um backend leve em Node.js (sem frameworks web externos) para persistência de dados.

## 2. Stack Tecnológico

### Backend
*   **Runtime**: Node.js
*   **Framework Web**: Nenhum (Módulo nativo `http`).
*   **Banco de Dados**: SQLite (`better-sqlite3`) para persistência primária, com fallback para LocalStorage no frontend.
*   **Gerenciamento de Pacotes**: npm (`package.json`).

### Frontend
*   **Framework**: Vanilla JavaScript (ES6+ Modules).
*   **Renderização**: HTML5 Canvas API.
*   **Estilização**: CSS3 Puro (Animações, Flexbox/Grid).
*   **Build System**: Nenhum (arquivos servidos estaticamente).

## 3. Arquitetura do Sistema

### 3.1. Estrutura de Arquivos
```
/
├── server.js           # Ponto de entrada do backend (HTTP Server + API)
├── rankings.db         # Banco de dados SQLite (persistência de pontuações)
├── package.json        # Dependências e scripts
├── PRD.md              # Documento de Requisitos do Produto
├── TECH_SPECS.md       # Este documento
├── public/
│   ├── index.html      # Página única da aplicação (SPA)
│   ├── css/
│   │   └── style.css   # Estilos globais
│   └── js/             # Módulos do Frontend
│       ├── main.js         # Inicialização do jogo
│       ├── GameEngine.js   # Loop principal e gerenciamento de estados
│       ├── Renderer.js     # Lógica de desenho no Canvas
│       ├── InputHandler.js # Captura de teclado
│       ├── PacMan.js       # Lógica do jogador
│       ├── Ghost.js        # IA e comportamento dos fantasmas
│       ├── Entity.js       # Classe base para entidades móveis
│       ├── levels.js       # Configuração dos labirintos (matrizes/grafos)
│       └── RankingService.js # Comunicação com a API de rankings (com fallback para LocalStorage)
```

### 3.2. Backend (`server.js`)
*   **Responsabilidade**: Servir arquivos estáticos da pasta `public` e fornecer uma API REST simples para manipulação do ranking.
*   **Endpoints API**:
    *   `GET /api/rankings`: Retorna as top 10 pontuações em formato JSON.
    *   `POST /api/rankings`: Recebe `{ name, score, level }` e salva no banco de dados. Valida dados de entrada.
*   **Banco de Dados**:
    *   Persistência Híbrida: API SQLite (Primário) + LocalStorage (Secundário/Fallback).
    *   Arquivo: `rankings.db`
    *   Tabela principal: `rankings`
    *   Schema:
        ```sql
        CREATE TABLE IF NOT EXISTS rankings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          score INTEGER NOT NULL,
          level INTEGER NOT NULL,
          date TEXT NOT NULL
        );
        ```

### 3.3. Frontend (`public/js/`)
A arquitetura do frontend segue um padrão modular orientado a objetos, onde `GameEngine` orquestra o ciclo de vida do jogo.

*   **Game Loop**: Implementado em `GameEngine.js` usando `requestAnimationFrame` para manter 60 FPS.
*   **Sistema de Coordenadas**: O jogo opera em um "Grid" lógico (definido em `levels.js`), mas renderiza em coordenadas de pixel no Canvas.
*   **IA dos Fantasmas**:
    *   Cada fantasma (`Ghost.js`) possui estados (Chase, Scatter, Frightened, Eaten).
    *   Algoritmos de pathfinding (como A* ou perseguição direta ao alvo) são usados para determinar o movimento no grid.
*   **Rendering**: `Renderer.js` abstrai as chamadas ao Canvas Context, desenhando o labirinto, entidades e HUD.

## 4. Fluxo de Dados

1.  **Inicialização**:
    *   `main.js` instancia `GameEngine`.
    *   `GameEngine` carrega o nível 1 de `levels.js`.
    *   `RankingService` busca o top 10 via `GET /api/rankings` para exibir na tela inicial.

2.  **Gameplay**:
    *   Input do usuário -> `InputHandler` -> Atualiza direção do `PacMan`.
    *   Game Loop -> Atualiza posições -> Verifica colisões -> Renderiza quadro.
    *   Colisão com Pastilha -> Aumenta Score.
    *   Colisão com Cereja -> Ativa modo "Vulnerável" nos fantasmas.

3.  **Finalização de Fase/Jogo**:
    *   Verifica condição de vitória (todas as pastilhas comidas).
    *   Se Game Over ou Zeramento -> `GameEngine` solicita nome ao usuário via UI.
    *   `RankingService` envia `POST /api/rankings` com os dados.

## 5. Padrões de Código e Regras
*   **Nomenclatura**: CamelCase para variáveis/funções, PascalCase para Classes.
*   **Módulos**: Uso estrito de ES Modules (`import`/`export`).
*   **Imutabilidade**: Preferir `const` sobre `let`. Evitar `var`.
*   **Performance**: Minimizar alocações de memória dentro do loop principal (`update`/`draw`).
*   **Comentários**: Documentar funções complexas (especialmente algoritmos de IA e colisão).

## 6. Comandos Úteis
*   `npm start`: Inicia o servidor na porta 3000.
*   `npm run dev`: Alias para start (pode ser configurado para nodemon futuramente).
*   `npm run reset-db`: Reseta o banco de dados (deleta `rankings.db`).
*   `npm run kill-port`: Derruba processo na porta 3000 (útil para erro EADDRINUSE).
