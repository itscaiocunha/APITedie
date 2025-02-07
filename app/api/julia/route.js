import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const agentId = 27177;
        const key = "1ec9cae2-f268-4e33-9853-b19be5f68ffd";
        const dados = await request.json();
        const message = `Listar o máximo possível de produtos que estão no treinamento de arquivos que se enquadram na seguinte mensagem: ${dados.message}`;
        
        console.log("Mensagem enviada:", message);

        const externalResponse = await fetch('https://api.zaia.app/v1.1/api/external-generative-chat/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer 7ca346d9-0834-4559-b9ec-6eb8888320bd`
            },
            body: JSON.stringify({ agentId })
        });

        if (!externalResponse.ok) {
            throw new Error(`Erro ao criar chat externo: ${externalResponse.statusText}`);
        }

        const externalData = await externalResponse.json();

        const messageResponse = await fetch('https://api.zaia.app/v1.1/api/external-generative-message/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer 7ca346d9-0834-4559-b9ec-6eb8888320bd`
            },
            body: JSON.stringify({
                agentId: agentId,
                externalGenerativeChatId: externalData.id,
                prompt: message,
                streaming: false,
                asMarkdown: true
            })
        });

        if (!messageResponse.ok) {
            throw new Error(`Erro ao enviar mensagem para API externa: ${messageResponse.statusText}`);
        }

        const responseData = await messageResponse.json();
        const produtos = responseData.text || "";
        console.log("Resposta da API externa:", produtos);

        // Extração dos IDs
        const idPattern = /Id: (\d+)/g;
        let match;
        const ids = [];

        while ((match = idPattern.exec(produtos)) !== null) {
            ids.push(parseInt(match[1], 10));
        }

        if (ids.length === 0) {
            return new Response(JSON.stringify({ message: "Nenhum produto encontrado." }), { status: 404 });
        }

        const produtosBd = await prisma.tedie_Produtos.findMany({ where: { ProdutoID: { in: ids } } });

        return new Response(JSON.stringify(produtosBd), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });

    } catch (error) {
        console.error("Erro no processamento:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
