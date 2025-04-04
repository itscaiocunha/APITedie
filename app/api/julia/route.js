import { PrismaClient } from '@prisma/client';

// Inicialização do Prisma Client
const prisma = new PrismaClient();

// Configurações da aplicação
const CONFIG = {
  CORS: {
    ALLOWED_ORIGINS: ['*'],
    ALLOWED_METHODS: 'GET, POST, OPTIONS',
    ALLOWED_HEADERS: 'Content-Type, Authorization'
  },
  ZAIA: {
    BASE_URL: 'https://api.zaia.app/v1.1/api',
    AGENT_ID: 43186,
    TIMEOUTS: {
      CHAT: 8000,    // 8 segundos
      MESSAGE: 15000 // 15 segundos
    }
  },
  MAX_BODY_SIZE: 1024 * 10 // 10KB
};

// Helper para criar respostas HTTP
function createHttpResponse(status, data = {}, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': CONFIG.CORS.ALLOWED_ORIGINS.join(','),
      'Access-Control-Allow-Methods': CONFIG.CORS.ALLOWED_METHODS,
      'Access-Control-Allow-Headers': CONFIG.CORS.ALLOWED_HEADERS,
      ...headers
    }
  });
}

// Handler para requisições OPTIONS (CORS Preflight)
export async function OPTIONS() {
  return createHttpResponse(204, {}, {
    'Content-Length': '0'
  });
}

// Handler principal para requisições POST
export async function POST(request) {
  const startTime = Date.now();
  
  try {
    // Verificação inicial
    if (!process.env.ZAIA_API_TOKEN) {
      throw new Error('ZAIA_API_TOKEN não configurada no ambiente');
    }

    // Validação do tamanho do payload
    const contentLength = request.headers.get('content-length');
    if (contentLength > CONFIG.MAX_BODY_SIZE) {
      return createHttpResponse(413, {
        error: 'Payload muito grande',
        maxSize: `${CONFIG.MAX_BODY_SIZE} bytes`
      });
    }

    // Processamento do corpo da requisição
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return createHttpResponse(400, {
        error: 'Formato de requisição inválido',
        details: 'O corpo deve ser um JSON válido'
      });
    }

    const userMessage = requestBody?.message?.trim();
    if (!userMessage) {
      return createHttpResponse(400, {
        error: 'Parâmetro obrigatório faltando',
        details: 'O campo "message" é obrigatório'
      });
    }

    // Criação do prompt para a Zaia
    const prompt = `Liste produtos para: "${userMessage}". Formato: Id: [número] | Nome: [nome do produto]`;

    // Integração com a API Zaia
    const chatSession = await createZaiaChatSession();
    const zaiaResponse = await sendZaiaMessage(chatSession.id, prompt);
    
    // Processamento da resposta
    const parsedProducts = parseZaiaResponse(zaiaResponse.text);
    
    if (parsedProducts.length === 0) {
      return createHttpResponse(404, {
        error: 'Nenhum produto encontrado',
        originalResponse: zaiaResponse.text,
        suggestion: 'Reformule sua busca ou verifique os termos utilizados'
      });
    }

    // Consulta ao banco de dados
    const dbProducts = await fetchProductsFromDB(parsedProducts);
    const executionTime = Date.now() - startTime;

    // Resposta de sucesso
    return createHttpResponse(200, {
      success: true,
      data: {
        products: dbProducts,
        count: dbProducts.length
      },
      metrics: {
        executionTimeMs: executionTime,
        parsedProducts: parsedProducts.length,
        dbMatches: dbProducts.length
      }
    });

  } catch (error) {
    // Tratamento de erros
    console.error('API Error:', error.message);
    
    return createHttpResponse(500, {
      error: 'Erro interno no servidor',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack
      }),
      executionTimeMs: Date.now() - startTime
    });
  }
}

// Função para criar sessão de chat na Zaia
async function createZaiaChatSession() {
  const endpoint = `${CONFIG.ZAIA.BASE_URL}/external-generative-chat/create`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ZAIA_API_TOKEN}`
    },
    body: JSON.stringify({ agentId: CONFIG.ZAIA.AGENT_ID }),
    signal: AbortSignal.timeout(CONFIG.ZAIA.TIMEOUTS.CHAT)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao criar sessão: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data?.id) {
    throw new Error('Resposta inválida da API - ID de sessão não encontrado');
  }

  return data;
}

// Função para enviar mensagem à Zaia
async function sendZaiaMessage(chatId, prompt) {
  const endpoint = `${CONFIG.ZAIA.BASE_URL}/external-generative-message/create`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ZAIA_API_TOKEN}`
    },
    body: JSON.stringify({
      agentId: CONFIG.ZAIA.AGENT_ID,
      externalGenerativeChatId: chatId,
      prompt
    }),
    signal: AbortSignal.timeout(CONFIG.ZAIA.TIMEOUTS.MESSAGE)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao enviar mensagem: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data?.text) {
    throw new Error('Resposta inválida da API - Texto não encontrado');
  }

  return data;
}

// Função para extrair produtos da resposta da Zaia
function parseZaiaResponse(responseText) {
  // Padrões de reconhecimento
  const patterns = [
    // Formato 1: "Id: 123 | Nome: Produto X"
    {
      regex: /Id:\s*(\d+)\s*\|\s*Nome:\s*([^\n]+)/g,
      mapper: match => ({
        id: parseInt(match[1]),
        name: match[2].trim()
      })
    },
    // Formato 2: "1; Produto X"
    {
      regex: /^(\d+);\s*([^\n]+)/gm,
      mapper: match => ({
        name: match[2].trim()
      })
    },
    // Formato 3: "- Produto X"
    {
      regex: /^-\s*([^\n]+)/gm,
      mapper: match => ({
        name: match[1].trim()
      })
    }
  ];

  // Tenta cada padrão até encontrar correspondências
  for (const { regex, mapper } of patterns) {
    const matches = [...responseText.matchAll(regex)];
    if (matches.length > 0) {
      return matches.map(mapper);
    }
  }

  return [];
}

// Função para buscar produtos no banco de dados
async function fetchProductsFromDB(products) {
  // Prepara parâmetros de busca
  const productIds = products.filter(p => p.id).map(p => p.id);
  const productNames = products.map(p => p.name);

  // Consultas paralelas otimizadas
  const [resultsById, resultsByName] = await Promise.all([
    productIds.length > 0 
      ? prisma.produtos.findMany({ where: { id: { in: productIds } }})
      : Promise.resolve([]),
    
    searchProductsByName(productNames)
  ]);

  // Combina e remove duplicatas
  const combinedResults = [...resultsById, ...resultsByName];
  return removeDuplicateProducts(combinedResults);
}

// Função auxiliar para buscar produtos por nome (case-insensitive)
async function searchProductsByName(names) {
  // Solução compatível com a maioria dos bancos de dados
  // Alternativa 1: Usar consulta raw SQL para case-insensitive se necessário
  return prisma.produtos.findMany({
    where: {
      OR: names.map(name => ({
        nome: { contains: name }
      }))
    }
  });
}

// Função auxiliar para remover produtos duplicados
function removeDuplicateProducts(products) {
  const uniqueProducts = [];
  const ids = new Set();

  for (const product of products) {
    if (!ids.has(product.id)) {
      ids.add(product.id);
      uniqueProducts.push(product);
    }
  }

  return uniqueProducts;
}