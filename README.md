# ROBOT HQ

Escritório web para Safari/iPhone: https://zecasemedo-hash.github.io/robot-hq/

## Ativar a conversa com IA dentro do site

O chat está preparado no `index.html`, mas precisa de um Cloudflare Worker publicado e de Workers AI ligado. O código do Worker é `cloudflare-worker.js`.

1. Abre https://dash.cloudflare.com/ e entra na tua conta.
2. Vai a **Workers & Pages** e cria um Worker (ou abre o Worker que já usas para o ROBOT HQ).
3. Publica o conteúdo de `cloudflare-worker.js` no Worker.
4. Nas definições do Worker, adiciona **Bindings → Workers AI** com o nome de variável **AI**.
5. Nas variáveis/segredos do Worker, cria **ROBOT_ACCESS_TOKEN** com um token forte e privado. Não o publiques no GitHub nem o envies a ninguém.
6. Publica/guarda as alterações e copia o endereço `https://...workers.dev` do Worker.
7. Abre o site ROBOT HQ, desce até **Ligar à Binance Testnet**, introduz a URL do Worker e o mesmo `ROBOT_ACCESS_TOKEN`, toca em **Guardar configuração neste iPhone** e depois em **Testar servidor**.
8. Volta ao Chefe Supremo e envia uma mensagem. O chat usa a URL e o token já guardados no navegador.

## Segurança e limites

- O endpoint de chat só aceita pedidos autenticados com `ROBOT_ACCESS_TOKEN` e está limitado ao domínio publicado do ROBOT HQ no CORS.
- Nunca coloques chaves privadas da Binance no HTML ou no GitHub.
- O Worker existente usa **Binance Spot Testnet** para consulta, não coloca ordens nem levanta fundos.
- Workers AI tem limites, disponibilidade e condições de utilização da Cloudflare; confirma os limites atuais na tua conta. Não assumas que todo o uso é ilimitado ou gratuito.
- A alteração do código no GitHub não garante que o Worker esteja publicado ou que a IA esteja ativa. É necessário fazer os passos acima e testar.
