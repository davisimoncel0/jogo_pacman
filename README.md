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
- Uma instância do [MongoDB](https://www.mongodb.com/cloud/atlas) (Atlas ou Local)

### Instalação e Execução

1. **Instale as dependências**:
   ```bash
   npm install
   ```

2. **Configure o Ambiente**:
   - Copie o arquivo `.env.example` para `.env`:
     ```bash
     cp .env.example .env
     ```
   - Abra o arquivo `.env` e insira sua `MONGODB_URI`.

3. **Inicie o servidor**:
   ```bash
   npm run dev
   ```

O jogo estará disponível em **http://localhost:3000**

### Comandos

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia o servidor de produção |
| `npm run dev` | Inicia o servidor com hot-reload local |
| `npm run net:dev` | Inicia o ambiente simulado da Netlify (para testar Functions localmente) |
| `npm run reset-db` | Instruções sobre como resetar o ranking no MongoDB |
| `npm run kill-port` | Derruba o processo que está ocupando a porta 3000 |

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

Como o banco agora é MongoDB, para resetar o ranking você deve:
1. Acessar seu cluster MongoDB.
2. Limpar a collection `ranking` dentro do database `pacman`.

## 📁 Estrutura de Arquivos

```
jogo_pacman/
├── index.html             # Página principal
├── server.js              # Servidor Node.js + API MongoDB
├── package.json           # Configuração e Dependências
├── .env                   # Variáveis de ambiente (Local)
├── .env.example           # Template de variáveis
├── netlify.toml           # Configuração de Deploy Netlify
├── README.md              # Documentação
├── netlify/
│   └── functions/         # Serverless Functions (API Produção)
└── public/
    ├── css/               # Estilos
    └── js/                # Módulos JS (Lógica do Jogo)
```
