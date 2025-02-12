export async function POST(request) {
    const start = Date.now(); // Marca o início da execução

    try {
        const agentId = 27177;
        const { message: userMessage } = await request.json();
        const message = `Listar o máximo possível de produtos que estão no treinamento de arquivos que se enquadram na seguinte mensagem: ${userMessage}`;

        // Criar o chat externo
        const externalResponse = await fetch('https://api.zaia.app/v1.1/api/external-generative-chat/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer 7ca346d9-0834-4559-b9ec-6eb8888320bd`
            },
            body: JSON.stringify({ agentId })
        });

        if (!externalResponse.ok) throw new Error(`Erro ao criar chat externo: ${externalResponse.statusText}`);

        const { id: chatId } = await externalResponse.json();
        if (!chatId) throw new Error("Resposta inválida ao criar chat externo.");

        // Enviar a mensagem
        const messageResponse = await fetch('https://api.zaia.app/v1.1/api/external-generative-message/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer 7ca346d9-0834-4559-b9ec-6eb8888320bd`
            },
            body: JSON.stringify({
                agentId,
                externalGenerativeChatId: chatId,
                prompt: message,
                streaming: false,
                asMarkdown: true
            })
        });

        if (!messageResponse.ok) throw new Error(`Erro ao enviar mensagem: ${messageResponse.statusText}`);

        const { text: produtos } = await messageResponse.json();
        if (!produtos) throw new Error("Resposta inválida da API externa.");

        // Extração dos IDs otimizada
        const ids = (produtos.match(/Id: (\d+)/g) || []).map(match => parseInt(match.split(": ")[1], 10));

        // Tempo de execução
        const executionTime = Date.now() - start;

        return new Response(JSON.stringify({ ids, executionTime }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        const executionTime = Date.now() - start;
        console.error(`Erro na função JulIA: ${error.message}`);

        return new Response(JSON.stringify({ error: error.message, executionTime }), { status: 500 });
    }
}
