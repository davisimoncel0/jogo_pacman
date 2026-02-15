---
description: Este workflow e um passo-a-passo para corrigir erros ou realizar melhorias neste projeto
---

# Correção e Melhoria

## Entendimento

1. Veja a rule contexto-projeto.md
2. Veja a rule linguagem.md para garantir que TODA a comunicação (respostas, commits, docs) seja em Português do Brasil.
3. Veja as especificacoes tecnicas no TECH_SPECS.md quando necessario
4. Veja as especificacoes do produto no PRD.md quando necessario

## Tarefas

> [!IMPORTANT]
> **SEMPRE** execute o projeto usando o comando definido no `package.json` (ex: `npm run dev`) antes de tentar abrir a aplicação no navegador. Não perca tempo tentando abrir arquivos estáticos diretamente se o projeto possuir um servidor.

1. Leias os arquivos js que fazem referencia ao erro informado
2. Faca a correcao do erro
3. Verifique se o erro foi mesmo corrigido subindo a aplicacao e executando testes visuais
4. Faca um fix no git para este erro corrigido (MENSAGEM DE COMMIT OBRIGATORIAMENTE EM PORTUGUÊS)
5. Faca um push da correcao do erro para o git
6. Atualização da documentacao
  - Toda a alteracao na estrutura do projeto (mudanças), as documentações devem ser atualizadas.
  - Antes de fazer qualquer publicação no GIT revalide todas as documetacoes e atualize se necessario.