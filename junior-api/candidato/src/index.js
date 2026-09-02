/**
 * TESTE TÉCNICO - Consumo de API (nível júnior)
 *
 * Leia o enunciado completo em ../README.md (raiz do projeto) antes de
 * começar. Ele explica cada detalhe da API, incluindo pontos que fogem do
 * "padrão" mais comum.
 *
 * Preencha a BASE_URL abaixo com a URL que você recebeu.
 */

const BASE_URL = "https://testejuniorsupper.vercel.app/";

const EMAIL = "junior@teste.com";
const PASSWORD = "teste123";
const axios = require("axios");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureValidToken(tokenObj) {
  // novo se expirado !
  const now = Date.now();
  if (!tokenObj || !tokenObj.token || !tokenObj.expiresAt || now >= tokenObj.expiresAt - 5000) {
    const fresh = await login();
    if (tokenObj) {
      tokenObj.token = fresh.token;
      tokenObj.expiresAt = fresh.expiresAt;
      return tokenObj;
    }
    return fresh;
  }
  return tokenObj;
}

async function apiRequest(method, path, tokenObj, opts = {}) {
  const maxRetries = 5;
  let attempts = 0;
  let retriedAfterLogin = false;

  while (attempts < maxRetries)
    {
    attempts++;
    await ensureValidToken(tokenObj);

    const headers = Object.assign({}, opts.headers || {}, {
      Authorization: `Token ${tokenObj.token}`,
      "X-Client-Version": "1.0",
    });

    try {
      const url = path.startsWith("http") ? path : `${BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
      const response = await axios.request({
        url,
        method,
        headers,
        params: opts.params,
        data: opts.data,
        timeout: 10000,
      });
      return response;
    } catch (erro) {
      const res = erro.response;
      if (res && res.status === 429) {
        const ra = res.headers && (res.headers["retry-after"] || res.headers["Retry-After"]);
        const waitSec = Number(ra) || 1;
        await delay(waitSec * 1000);
        continue; // retry
      }

      if (res && res.status === 401 && !retriedAfterLogin) {
        // forçar o login de novo 
        retriedAfterLogin = true;
        const fresh = await login();
        tokenObj.token = fresh.token;
        tokenObj.expiresAt = fresh.expiresAt;
        continue;
      }

      throw erro;
    }
  }
}


/**
 * 1) Faz login e retorna { token, expiresAt } — guarde também quando o
 *    token expira, para saber quando renovar.
 */
async function login()
{

try
    {
    const url = `${BASE_URL}api/auth/login`;
    const res = await axios.post(url, { email: EMAIL, password: PASSWORD }, {
    headers: { "Content-Type": "application/json" },});

    if (res.status === 200 && res.data && res.data.accessToken)
    {
      const expiresIn = Number(res.data.expiresIn) || 0; 
      const expiresAt = Date.now() + expiresIn * 1000;
      return { token: res.data.accessToken, expiresAt };
    }

    throw new Error("Login falhou");
    }
  
  catch (erro)
  {
    if (erro.response && erro.response.status === 401)
    {
      throw new Error("Credenciais inválidas");
    }
    throw erro;
  }


}

/**
 * 2) Busca todas as páginas de produtos de uma categoria, seguindo o
 *    "nextCursor" retornado pela API até ele vir null, e retorna um array
 *    único com todos os produtos encontrados.
 */
async function fetchAllProductsByCategory(token, category) {
  const all = [];
  let cursor = null;

  while (true)
    {
    const params = { category };
    if (cursor) params.cursor = cursor;

    const res = await apiRequest("get", "/api/products", token, { params });
    const data = res.data;
    if (Array.isArray(data.results))
    {
      all.push(...data.results);
    }

    if (!data.nextCursor) break;
    cursor = data.nextCursor;
  }

  return all;
}

/**
 * 3) Cria um pedido de 1 unidade do produto informado.
 *    Retorne algo como { success: true/false, productId, message? }
 *    baseado na resposta real da API (lembre-se: sucesso/falha não é só
 *    o status HTTP).
 */
async function createOrder(token, productId) {
  try {
    const res = await apiRequest("post", "/api/orders", token, { data: { productId, quantity: 1 } });
    const data = res.data;

    if (res.status === 201 && data && data.success)
    {
      return { success: true, productId };
    }

    if (data && data.success === false)
    {
      const message = data.message || data.error || "falha";
      return { success: false, productId, message };
    }

    return { success: false, productId, message: "resposta inesperada" };
  } 
    catch (erro) 
    {
    if (erro.response && erro.response.data)
    {
      const d = erro.response.data;
      return { success: false, productId, message: d.message || JSON.stringify(d) };
    }
    throw erro;
    }
}

/**
 * Função principal: orquestra o fluxo completo.
 */
async function main() {
  const token = await login();
  console.log("Login OK.");

  const products = await fetchAllProductsByCategory(token, "eletronicos");
  console.log(`Produtos encontrados na categoria "eletronicos": ${products.length}`);

  let sucesso = 0;
  let semEstoque = 0;

  for (const product of products) {
    const result = await createOrder(token, product.id);
    if (result.success) {
      sucesso++;
    } else {
      semEstoque++;
    }
  }

  console.log(`Pedidos criados com sucesso: ${sucesso}`);
  console.log(`Pedidos sem estoque: ${semEstoque}`);
}


/**
 * Mensagem de erro
 */
main().catch((erro) => {
  console.error("Erro ao executar:", erro.message);
});

module.exports = { login, fetchAllProductsByCategory, createOrder };
/*tem erro em algum lugar, verificar o request e o delay*/