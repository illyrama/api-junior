# Teste Técnico — Consumo de API (Desenvolvedor Júnior)

## Objetivo

Consumir a API REST descrita abaixo, implementando um pequeno cliente em
Node.js que faz login, lista produtos, e cria pedidos.

**URL base da API:** https://testejuniorsupper.vercel.app/

Tempo sugerido: **1h30 a 2h**.

Sinta-se à vontade para escolher qualquer framework JavaScript para resolver este desafio. Como o nosso objetivo é entender o seu raciocínio e a sua escrita de código, pedimos que não utilize ferramentas de IA (ChatGPT, Copilot, Claude, etc.) para gerar a solução. O que importa é o resultado final construído por você e a sua capacidade de explicar o que o código faz na entrevista técnica.
    
** Leia a documentação abaixo com atenção antes de começar. Baseie-se exclusivamente nela para garantir o funcionamento correto da sua aplicação.

## Credenciais de teste

```
email: junior@teste.com
senha: teste123
```

## Autenticação

### `POST /api/auth/login`

Body:
```json
{ "email": "junior@teste.com", "password": "teste123" }
```

Resposta (200):
```json
{ "accessToken": "...", "expiresIn": 60 }
```

**O token expira em 60 segundos.** Se seu cliente demorar mais que isso ou
fizer várias operações em sequência, vai precisar fazer login de novo
(ou controlar a expiração e renovar antes de usar um token vencido).

Em caso de credenciais inválidas: `401`.

## Autenticando nas próximas chamadas

Todos os outros endpoints exigem dois cabeçalhos:

```
Authorization: Token <accessToken>
X-Client-Version: 1.0
```

**Atenção:** o esquema do header `Authorization` é `Token`, **não**
`Bearer`. Sem o header `X-Client-Version`, a API responde `400`.

## Limite de requisições

A API aceita no máximo **5 requisições a cada 10 segundos** por token. Ao
ultrapassar, responde `429` com um header `Retry-After` (em segundos)
indicando quanto tempo esperar antes de tentar de novo. Seu cliente deve
lidar com isso (esperar e tentar novamente), não apenas falhar.

## Endpoints

### `GET /api/products`

Lista produtos, paginado por **cursor** (não por número de página).

Query params opcionais:
- `cursor`: valor opaco retornado pela própria API (não tente calculá-lo)
- `category`: filtra por categoria (`eletronicos`, `livros`, `casa`, `esporte`)

Resposta (200):
```json
{
  "results": [ { "id": 1, "name": "Produto 1", "category": "eletronicos", "price": 19.9, "stock": 0 }, ... ],
  "nextCursor": "MTA"
}
```

Quando não há mais páginas, `nextCursor` vem `null`. Para buscar a
próxima página, chame `GET /api/products?cursor=<nextCursor>`.

### `GET /api/products/:id`

Retorna um produto específico, ou `404` se não existir.

### `POST /api/orders`

Cria um pedido.

Body:
```json
{ "productId": 2, "quantity": 1 }
```

**Atenção:** se não houver estoque suficiente, a API responde com status
`200` (OK) mas com `"success": false` no corpo:
```json
{ "success": false, "error": "insufficient_stock", "message": "..." }
```

Ou seja: **não confie apenas no status HTTP para saber se o pedido foi
criado** — sempre confira o campo `success` da resposta. Quando o pedido é
criado com sucesso, a API responde `201`:
```json
{ "success": true, "order": { "id": 1, "productId": 2, "quantity": 1, "total": 23.27 } }
```

Se faltar `productId` ou `quantity` no corpo, ou o produto não existir,
respectivamente: `400` / `404`.

## O que sua aplicação precisa fazer

Crie um script Node.js que:

1. Faz login e obtém um token.
2. Busca **todos** os produtos da categoria `eletronicos`, percorrendo
   todas as páginas (via `nextCursor`) até acabar.
3. Tenta criar um pedido de **1 unidade** de cada um desses produtos, na
   ordem, e ao final imprime um resumo: quantos pedidos tiveram sucesso e
   quantos falharam por falta de estoque (lembre-se do item acima sobre o
   campo `success`).
4. Lida corretamente com o limite de requisições (respeitando o
   `Retry-After` quando receber `429`) e com a expiração do token (renova
   o login se necessário).

## Critérios de avaliação

- **Correção**: uso do esquema de autenticação certo, do header exigido, e
  checagem correta de sucesso/falha nos pedidos (não só pelo status HTTP).
- **Paginação**: percorre corretamente via cursor, sem hardcodar número de
  páginas.
- **Resiliência**: trata `429` (rate limit) esperando e tentando de novo,
  e renova o token quando necessário.
- **Tratamento de erros**: não deixa a aplicação quebrar com exceção não
  tratada.
- **Organização do código**: funções pequenas, nomes claros.
- Também vamos conversar sobre as decisões do código na entrevista — então
  entenda o que você entregou, mesmo se usou IA para ajudar a escrever.

## Entrega

Suba seu código em um repositório Git (pode ser privado, nos convide)
