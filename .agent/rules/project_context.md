---
trigger: always_on
---

# Regras de Contexto do Projeto Pac-Man

## 1. Documentação Obrigatória

Antes de iniciar qualquer tarefa, análise ou resposta a dúvidas, o agente DEVE consultar os seguintes documentos:

### A. Entendimento do Produto (PRD)

- **Arquivo**: `/Users/davisimoncelo/Projetos/Pessoal/jogo_pacman/PRD.md`
- **Propósito**: Definir regras de negócio, mecânicas de jogo (fantesmas, cerejas, pontuação), estrutura de fases e fluxo do usuário.
- **Regra**: Nunca assuma funcionalidades. Sempre valide se o que está sendo implementado está de acordo com o PRD.

### B. Especificações Técnicas (Tech Specs)

- **Arquivo**: `/Users/davisimoncelo/Projetos/Pessoal/jogo_pacman/TECH_SPECS.md`
- **Propósito**: Definir arquitetura do código, estrutura de arquivos, banco de dados, API e padrões de projeto.
- **Regra**: Siga rigorosamente a estrutura definida. Não introduza frameworks ou bibliotecas novas sem consultar este documento primeiro.

## 2. Padrões de Desenvolvimento

- **Idioma**: Toda a comunicação, comentários e documentação deve ser em **Português do Brasil**.
- **Backend**: 
  - Node.js nativo (módulo `http`).
  - Banco de dados `better-sqlite3`.
  - Evite Express ou frameworks pesados.
- **Frontend**: 
  - Vanilla JS (ES Modules).
  - Canvas API para renderização.
  - Manter separação de responsabilidades (GameEngine, Renderer, Entities).

## 3. Fluxo de Trabalho Recomendado

1. **Entender**: Leia o `PRD.md` para compreender o objetivo da tarefa.
2. **Planejar**: Leia o `TECH_SPECS.md` para saber onde e como implementar.
3. **Executar**: Codifique seguindo os padrões do projeto.
4. **Validar**: Verifique se a implementação atende aos requisitos do PRD e especificações técnicas.

## 4. Localização de Arquivos Importantes

- **Servidor**: `server.js`
- **Banco de Dados**: `rankings.db`
- **Frontend**: `public/js/` (Lógica), `public/css/` (Estilo)

## 5. Atualização da documentacao

1. Toda a alteracao na estrutura do projeto (mudanças), as documentações devem ser atualizadas.
2. Antes de fazer qualquer publicação no GIT revalide todas as documetacoes e atualize se necessario.