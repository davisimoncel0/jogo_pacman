# 🎮 PAC-MAN — Jogo com 6 Fases

Jogo de Pac-Man em JavaScript puro usando HTML Canvas, com 6 fases, sistema de pontuação, ranking e prêmios.

## 🏗️ Arquitetura

O projeto segue **Orientação a Objetos** com **Princípio de Responsabilidade Única**:

| Arquivo | Classe/Módulo | Responsabilidade |
|---------|---------------|------------------|
| `js/constants.js` | — | Constantes do jogo (tiles, direções, cores, scores) |
| `js/levels.js` | — | Mapas dos 6 níveis |
| `js/Entity.js` | `Entity` | Classe base para entidades móveis |
| `js/PacMan.js` | `PacMan` | Movimento, coleta de cerejas, boost de velocidade |
| `js/Ghost.js` | `Ghost` | IA dos fantasmas, saída pela porta, perseguição |
| `js/Renderer.js` | `Renderer` | Renderização no Canvas (mapa, cerejas, personagens) |
| `js/InputHandler.js` | `InputHandler` | Captura de teclado (setas + WASD) |
| `js/RankingService.js` | `RankingService` | API de ranking (salvar/carregar pontuações) |
| `js/GameEngine.js` | `GameEngine` | Loop principal, colisões, transições de tela |
| `js/main.js` | — | Ponto de entrada |
| `server.js` | — | Servidor Node.js (ZERO dependências) |

## 🚀 Como Executar

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado (v18+)

### Instalação e Execução

```bash
# Clone o projeto
git clone <url-do-repositorio>
cd jogo_pacman

# Instale (sem dependências externas — o projeto não precisa de npm install!)
# Apenas rode o servidor:
npm start
```

O jogo estará disponível em **http://localhost:3000**

### Comandos

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia o servidor em http://localhost:3000 |
| `npm run dev` | Mesmo que `npm start` |
| `npm run reset-db` | Reseta o ranking (apaga todas as pontuações) |
| `npm run kill-port` | Derruba o processo que está ocupando a porta 3000 (Mac/Linux) |

### ⚠️ Script Cross-Platform
O script `npm start` (e `npm run dev`) agora executa automaticamente um utilitário (`utils/kill-port.js`) que verifica e derruba qualquer processo ocupando a porta 3000 antes de subir o servidor.
Isso funciona tanto em **Windows** quanto em **Mac/Linux**.

Se precisar rodar manualmente:
```bash
npm run kill-port
```

## 🎯 Como Jogar

- **Setas** ou **WASD** para mover o Pac-Man
- Colete todas as **🍒 cerejas** para completar a fase
- Coma **pellets de poder** (⚡) para assustar os fantasmas e ganhar um boost de velocidade
- Fantasmas assustados podem ser **comidos** para pontos bônus
- Complete as **6 fases** para ganhar um título especial!

## 🧹 Resetar o Ranking

```bash
npm run reset-db
```

Ou manualmente, edite o arquivo `ranking.json`:
```bash
echo '[]' > ranking.json
```

## 📁 Estrutura de Arquivos

```
jogo_pacman/
├── index.html             # Página principal
├── server.js              # Servidor Node.js
├── package.json           # Configuração
├── ranking.json           # Ranking (JSON)
├── README.md              # Documentação
└── public/
    ├── css/               # Estilos (style.css)
    └── js/                # Módulos JS (main.js, GameEngine.js, etc.)
```
