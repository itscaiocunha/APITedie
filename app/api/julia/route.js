import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://tedie.vercel.app",  // Permite qualquer origem (ajuste conforme necessário)
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const API_URL = 'https://api.zaia.app/v1.1/api';
const API_TOKEN = process.env.ZAIA_API_TOKEN; // Recomendado armazenar o token em variáveis de ambiente
const AGENT_ID = 43186;

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders }); // Responde às requisições preflight
}

export async function POST(request) {
    const start = Date.now();
    try {
        const { message: userMessage } = await request.json();
        if (!userMessage) {
            return new Response(JSON.stringify({ error: "Mensagem do usuário é obrigatória." }), {
                status: 400,
                headers: corsHeaders
            });
        }

        const message = `Listar o máximo possível de produtos que estão no treinamento de arquivos que se enquadram na seguinte mensagem: ${userMessage}`;

        // Criar chat externo
        const externalResponse = await fetch(`${API_URL}/external-generative-chat/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_TOKEN}`
            },
            body: JSON.stringify({ agentId: AGENT_ID })
        });

        if (!externalResponse.ok) {
            throw new Error(`Erro ao criar chat externo: ${externalResponse.statusText}`);
        }

        const { id: chatId } = await externalResponse.json();
        if (!chatId) {
            throw new Error("Resposta inválida ao criar chat externo.");
        }

        // Enviar mensagem
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
            throw new Error(`Erro ao enviar mensagem: ${messageResponse.statusText}`);
        }

        const { text: produtos } = await messageResponse.json();
        if (!produtos) {
            throw new Error("Resposta inválida da API externa.");
        }

        // Extração de IDs usando regex
        const ids = [...produtos.matchAll(/Id:\s*(\d+)/g)].map(match => parseInt(match[1], 10));

        if (!ids.length) {
            return new Response(JSON.stringify({ message: "Nenhum ID de produto encontrado." }), { 
                status: 404, 
                headers: corsHeaders 
            });
        }

        // Consulta ao banco de dados
        const produtosBd = await prisma.produtos.findMany({
            where: { id: { in: ids } }
        });

        const executionTime = Date.now() - start;

        return new Response(JSON.stringify({ produtos: produtosBd, executionTime }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (error) {
        console.error(`Erro na função: ${error.message}`);
        return new Response(JSON.stringify({ error: error.message, executionTime: Date.now() - start }), {
            status: 500,
            headers: corsHeaders
        });
    }
}