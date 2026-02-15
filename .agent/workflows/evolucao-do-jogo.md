---
description: Workflow para criar novas funcionalidades, mecânicas ou evoluir o jogo Pac-Man
---

# Evolução do Jogo e Novas Funcionalidades

Este workflow deve ser seguido sempre que uma nova funcionalidade (ex: novos fantasmas, novos níveis, sons, menus, etc.) for solicitada.

## 1. Entendimento do Requisito
- Revise o `PRD.md` para verificar se a funcionalidade já está prevista ou se requer atualização.
- Consulte `TECH_SPECS.md` para garantir que a implementação siga os padrões de arquitetura (GameEngine, Renderer, etc.).
- Verifique `contexto-projeto.md` para garantir o uso correto de tecnologias (Vanilla JS, Node Nativo/Express).

## 2. Planejamento (Planning)
- Crie um arquivo de plano de implementação em `<appDataDir>/brain/<conversation-id>/implementation_plan.md`.
- Descreva as mudanças em cada componente afetado:
  - **Entity**: Se for um novo personagem ou item.
  - **GameEngine**: Se for uma nova regra de colisão ou estado de jogo.
  - **Renderer**: Se houver mudanças visuais no Canvas.
  - **Backend**: Se exigir novos endpoints de API ou mudanças no banco.
- Peça aprovação do usuário via `notify_user` antes de codificar.

## 3. Implementação (Execution)
- Siga rigorosamente o plano aprovado.
- Adicione comentários em Português do Brasil no código.
- Mantenha a separação de responsabilidades (não misture lógica de jogo com lógica de desenho).

## 4. Verificação e Testes (Verification)
- Inicie a aplicação localmente (`npm run dev`).
- Realize testes visuais exploratórios para garantir que a nova funcionalidade funciona como esperado.
- Verifique se não houve regressão em funcionalidades existentes.
- Crie um `walkthrough.md` com prints ou gravações (usando `generate_image` ou capturas de tela se possível) demonstrando o resultado.

## 5. Publicação e Documentação
- Execute o workflow `/git-push` para enviar as alterações.
- Atualize `TECH_SPECS.md` e `PRD.md` se a estrutura do projeto ou as regras de negócio mudarem significativamente.
- Execute `/publicar-netlify` se o deploy em produção for necessário.
