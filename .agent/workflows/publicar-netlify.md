---
description: Workflow para realizar o deploy do projeto Pac-Man no Netlify
---

Este workflow automatiza o processo de deploy do projeto no Netlify, utilizando o nome definido no `package.json`.

**Atenção:** Este workflow realiza o deploy dos arquivos estáticos (HTML, CSS, JS do frontend). O backend atual (Node.js com SQLite e `server.js`) não funcionará nativamente na infraestrutura padrão do Netlify (que é voltada para sites estáticos e serverless functions), pois o arquivo de banco de dados SQLite não seria persistido e o servidor não ficaria rodando continuamente. O jogo funcionará visualmente, mas o salvamento de ranking (API) falhará a menos que seja migrado para Netlify Functions + Banco de Dados externo (ex: Supabase, Firebase) ou se o deploy for feito em uma plataforma que suporte Node.js persistente (como Railway ou Render).

1. **Git Push (Pré-requisito do Deploy)**
   - O código publicado no Netlify deve corresponder exatamente ao que está no repositório remoto.
   - Antes de prosseguir com qualquer outra etapa, execute o workflow `/git-push` (consulte `.agent/workflows/git-push.md` se necessário) para garantir que todas as alterações locais foram comitadas e enviadas.
   - Prossiga para o deploy apenas após a confirmação de sucesso do push.

2. **Ler Configurações do Projeto**
   - Ler o arquivo `package.json` para obter o nome do projeto (campo `name`).

3. **Verificar Projetos Existentes**
   - Utilizar a ferramenta `netlify-project-services-reader` com a operação `get-projects` para listar os sites existentes na conta Netlify vinculada.
   - Procurar na lista se já existe um site com o nome obtido (ex: `dvs-pacman`).

4. **Gerenciar Criação do Site**
   - **Se o site JÁ existir:**
     - Extrair o `siteId` (ou `id`) do projeto encontrado.
   - **Se o site NÃO existir:**
     - Utilizar a ferramenta `netlify-project-services-updater` com a operação `create-new-project`.
     - Passar o nome do projeto obtido do `package.json`.
     - Obter o `siteId` da resposta da criação.

5. **Executar o Deploy**
   - Utilizar a ferramenta `netlify-deploy-services-updater` com a operação `deploy-site`.
   - Preencher os parâmetros:
     - `siteId`: O ID obtido no passo anterior.
     - `deployDirectory`: O caminho absoluto para a raiz do projeto (onde está o `index.html` e a pasta `public`). **Nota:** Certifique-se de usar o caminho absoluto do workspace atual.

6. **Finalizar**
   - **CRÍTICO:** Ao final do processo, você DEVE fornecer explicitamente a URL pública do site (ex: `https://dvs-pacman.netlify.app`) para o usuário acessar.
   - Verifique se o deploy foi bem-sucedido.
