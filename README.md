# ROBOT HQ

Interface web: https://zecasemedo-hash.github.io/robot-hq/?v=4

## Cloudflare Worker

O ficheiro `worker.js` implementa:
- `GET /` e `GET /health` para estado do serviço;
- `POST /api/chat` protegido por `X-Robot-Token`;
- `POST /api/public-chat` para atendimento público;
- `GET /api/account` para consultar saldos da Binance **Spot Testnet**, apenas leitura.

O Worker tenta usar a primeira IA configurada nesta ordem: OpenAI, Gemini, Anthropic Claude e Cloudflare Workers AI.

## Configuração no Cloudflare

Em **Workers & Pages → robot-hq-binance → Settings → Variables and Secrets**, guardar como secrets (nunca no HTML nem no GitHub):
- `ROBOT_ACCESS_TOKEN` — token privado forte, escolhido por ti;
- opcional: `OPENAI_API_KEY`;
- opcional: `GEMINI_API_KEY`;
- opcional: `ANTHROPIC_API_KEY`;
- para consultar Binance Spot Testnet: `BINANCE_API_KEY` e `BINANCE_API_SECRET` da **Testnet**, não as chaves da conta real.

Se houver várias chaves de IA, o Worker usa a primeira disponível pela ordem indicada acima. A rota pública `/api/public-chat` não exige token; configura limites de utilização no Cloudflare antes de divulgar o site publicamente.

## Publicar

A partir desta pasta, com Wrangler instalado e sessão Cloudflare autenticada:

```bash
npx wrangler deploy
```

Confirma primeiro que o nome do Worker no Cloudflare é `robot-hq-binance`. Depois testa:
- `https://robot-hq-binance.zeca-semedo.workers.dev/health`
- No site, secção “Ligações do sistema”: URL do Worker + `ROBOT_ACCESS_TOKEN`, guardar e testar IA.

**Segurança:** não adicionar chaves API ou tokens ao repositório. A rota Binance consulta apenas a Spot Testnet e não envia ordens de compra/venda.
