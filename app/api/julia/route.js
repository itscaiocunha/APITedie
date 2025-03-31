import { PrismaClient } from '@prisma/client';
import { LRUCache } from 'lru-cache';

// Configuração do Prisma
const baseDbUrl = process.env.DATABASE_URL;
const dbUrl = process.env.NODE_ENV === 'production'
  ? `${baseDbUrl}${baseDbUrl.includes('?') ? '&' : '?'}connection_limit=5&pool_timeout=10`
  : baseDbUrl;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

// Configuração do cache
const cache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 5, // 5 minutos
});

// Configuração CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://tedie.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Configurações da API externa
const API_URL = 'https://api.zaia.app/v1.1/api';
const API_TOKEN = process.env.ZAIA_API_TOKEN;
const AGENT_ID = 43186;

// Gerenciamento da conexão Prisma
let prismaInitialized = false;

async function ensurePrisma() {
  if (!prismaInitialized) {
    await prisma.$connect();
    prismaInitialized = true;
  }
}

export async function OPTIONS() {
  return new Response(null, { 
    status: 204, 
    headers: corsHeaders 
  });
}

export async function POST(request) {
  const start = Date.now();
  try {
    // Ler o corpo da requisição apenas uma vez
    const requestBody = await request.text();
    let userMessage;
    
    try {
      const parsedBody = JSON.parse(requestBody);
      userMessage = parsedBody.message;
    } catch (parseError) {
      console.error('Erro ao parsear JSON:', parseError);
      return new Response(JSON.stringify({ error: "Formato JSON inválido" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "Mensagem do usuário é obrigatória." }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const cacheKey = JSON.stringify(userMessage);
    const cached = cache.get(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: corsHeaders
      });
    }

    const message = `Listar o máximo possível de produtos que estão no treinamento de arquivos que se enquadram na seguinte mensagem: ${userMessage}`;

    const [externalResponse, _] = await Promise.all([
      fetch(`${API_URL}/external-generative-chat/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify({ agentId: AGENT_ID })
      }),
      ensurePrisma()
    ]);

    if (!externalResponse.ok) {
      throw new Error(`Erro ao criar chat externo: ${await externalResponse.text()}`);
    }

    const { id: chatId } = await externalResponse.json();
    if (!chatId) {
      throw new Error("Resposta inválida ao criar chat externo.");
    }

    const messageResponse = await fetch(`${API_URL}/external-generative-message/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({
        agentId: AGENT_ID,
        externalGenerativeChatId: chatId,
        prompt: message,
        streaming: false,
        asMarkdown: true
      })
    });

    if (!messageResponse.ok) {
      throw new Error(`Erro ao enviar mensagem: ${await messageResponse.text()}`);
    }

    const { text: produtos } = await messageResponse.json();
    if (!produtos) {
      throw new Error("Resposta inválida da API externa.");
    }

    // Extração de IDs
    const ids = [];
    const lines = produtos.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(\d+);/);
      if (match) {
        const id = parseInt(match[1], 10);
        if (!isNaN(id)) ids.push(id);
      }
    }

    if (!ids.length) {
      return new Response(JSON.stringify({ 
        message: "Nenhum ID de produto encontrado.",
        originalResponse: produtos
      }), { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    const produtosBd = await prisma.produtos.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        nome: true,
        // outros campos necessários
      }
    });

    const executionTime = Date.now() - start;
    const apiResponse = {
      produtos: produtosBd, 
      executionTime,
      originalIds: ids
    };
    
    cache.set(cacheKey, apiResponse);

    return new Response(JSON.stringify(apiResponse), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error(`Erro na função: ${error.message}`);
    return new Response(JSON.stringify({ 
      error: error.message.includes("Body is unusable") 
        ? "Erro ao processar a requisição" 
        : error.message,
      executionTime: Date.now() - start 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}