//Salva Pedidos
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request) {
  const start = Date.now();

  try {
    const { itens, total, usuario_id, endereco_id, status } = await request.json();

    if (!usuario_id) {
      return new Response(JSON.stringify({ error: "ID do usuário é obrigatório" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!endereco_id) {
      return new Response(JSON.stringify({ error: "ID do endereço é obrigatório" }), {
        status: 400,
        headers: corsHeaders,
      });
    }    

    if (!status) {
      return new Response(JSON.stringify({ error: "Status do pedido é obrigatório" }), {
        status: 400,
        headers: corsHeaders,
      });
    }    

    if (!itens || itens.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum item no pedido" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const pedido = await prisma.pedidos.create({
      data: {
        usuario_id,
        total,
        endereco_id,
        status,
        data_pedido: new Date(),
        itens_pedido: {
          create: itens.map((item) => ({
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unit: item.preco,
          })),
        },
      },
      include: { itens_pedido: true },
    });

    const executionTime = Date.now() - start;
    return new Response(JSON.stringify({ pedidoId: pedido.id, message: "Pedido criado com sucesso", executionTime }), {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error(`Erro ao salvar pedido: ${error.message}`);
    return new Response(JSON.stringify({ error: "Erro ao processar o pedido", executionTime: Date.now() - start }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
