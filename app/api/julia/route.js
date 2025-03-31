import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://tedie.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const API_URL = 'https://api.zaia.app/v1.1/api';
const API_TOKEN = process.env.ZAIA_API_TOKEN;
const AGENT_ID = 43186;

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request) {
    const start = Date.now();
    try {
        // Validação inicial (mantida igual)
        if (!API_TOKEN) {
            throw new Error("ZAIA_API_TOKEN environment variable is not set");
        }

        const { message: userMessage } = await request.json();
        if (!userMessage) {
            return new Response(JSON.stringify({ error: "Mensagem do usuário é obrigatória." }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Crie um prompt mais simples, sem formatação complexa
        const prompt = `Liste todos os produtos que correspondem a: "${userMessage}". 
        Forneça no formato: Id: [número] | Nome: [nome do produto]`;

        // 1. Criar sessão de chat (mantido igual)
        const chatResponse = await fetch(`${API_URL}/external-generative-chat/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_TOKEN}`
            },
            body: JSON.stringify({ agentId: AGENT_ID }),
            signal: AbortSignal.timeout(8000)
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            throw new Error(`Falha ao criar chat: ${chatResponse.status} - ${errorText}`);
        }

        const { id: chatId } = await chatResponse.json();
        if (!chatId) {
            throw new Error("ID do chat não recebido na resposta");
        }

        // 2. Enviar mensagem - CORREÇÃO PRINCIPAL AQUI
        const messageResponse = await fetch(`${API_URL}/external-generative-message/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_TOKEN}`
            },
            body: JSON.stringify({
                agentId: AGENT_ID,
                externalGenerativeChatId: chatId,
                prompt: prompt,
                // Remova 'streaming' e 'asMarkdown' se não forem necessários
                // Ou verifique na documentação os valores aceitos
            }),
            signal: AbortSignal.timeout(15000)
        });

        if (!messageResponse.ok) {
            const errorText = await messageResponse.text();
            throw new Error(`Falha ao enviar mensagem: ${messageResponse.status} - ${errorText}`);
        }

        const { text: apiResponse } = await messageResponse.json();
        if (!apiResponse) {
            throw new Error("Resposta vazia da API");
        }

        // 3. Parse response - try multiple formats
        let productsToSearch = [];
        
        // Format 1: "Id: 123 | Nome: Product Name"
        const idNameFormat = [...apiResponse.matchAll(/Id:\s*(\d+)\s*\|\s*Nome:\s*([^\n]+)/g)];
        if (idNameFormat.length > 0) {
            productsToSearch = idNameFormat.map(match => ({
                id: parseInt(match[1]),
                name: match[2].trim()
            }));
        } 
        // Format 2: "1; Product Name"
        else {
            const numberedListFormat = [...apiResponse.matchAll(/^(\d+);\s*([^\n]+)/gm)];
            if (numberedListFormat.length > 0) {
                productsToSearch = numberedListFormat.map(match => ({
                    potentialId: parseInt(match[1]),
                    name: match[2].trim()
                }));
            }
        }

        if (productsToSearch.length === 0) {
            return new Response(JSON.stringify({ 
                message: "Não foi possível identificar produtos na resposta",
                originalResponse: apiResponse,
                suggestion: "O formato da resposta pode ter mudado. Verifique o prompt e a lógica de análise."
            }), { 
                status: 404, 
                headers: corsHeaders 
            });
        }

        // 4. Search in database - try both ID and name
        let foundProducts = [];
        
        // First try by ID if available
        const idsToSearch = productsToSearch.filter(p => p.id).map(p => p.id);
        if (idsToSearch.length > 0) {
            foundProducts = await prisma.produtos.findMany({
                where: { id: { in: idsToSearch } }
            });
        }

        // If no products found by ID, try by name
        if (foundProducts.length === 0) {
            const namesToSearch = productsToSearch.map(p => p.name);
            foundProducts = await prisma.produtos.findMany({
                where: {
                    OR: namesToSearch.map(name => ({
                        nome: { contains: name, mode: 'insensitive' }
                    }))
                }
            });
        }

        const executionTime = Date.now() - start;

        return new Response(JSON.stringify({ 
            products: foundProducts,
            executionTime,
            originalResponse: apiResponse,
            parsingDetails: {
                formatsAttempted: ["Id: | Nome:", "Numbered list"],
                productsIdentified: productsToSearch.length,
                productsFound: foundProducts.length
            }
        }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (error) {
        console.error(`Erro na função: ${error.message}`);
        return new Response(JSON.stringify({ 
            error: error.message, 
            executionTime: Date.now() - start,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}