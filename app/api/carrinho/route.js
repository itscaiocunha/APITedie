import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Ajuste conforme necessário
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const usuario_id = searchParams.get("usuario_id");

  if (!usuario_id) {
    return new Response(JSON.stringify({ error: "ID do usuário é obrigatório." }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    const itensCarrinho = await prisma.carrinho.findMany({
      where: { usuario_id: parseInt(usuario_id) },
      include: {
        usuarios: true, // Inclui informações do usuário
      },
    });

    return new Response(JSON.stringify({ carrinho: itensCarrinho }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("Dados recebidos:", body);

    const { usuario_id, itens } = body;

    if (!usuario_id || !itens || !Array.isArray(itens) || itens.length === 0) {
      return new Response(JSON.stringify({ error: "Usuário e itens são obrigatórios." }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const carrinhoItems = await Promise.all(itens.map(async ({ produto_id, quantidade }) => {
      if (!produto_id || !quantidade) {
        return new Response(JSON.stringify({ error: "Todos os campos são obrigatórios." }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      return prisma.carrinho.create({
        data: {
          usuario_id,
          produto_id,
          quantidade,
        },
      });
    }));

    return new Response(JSON.stringify({ message: "Itens adicionados ao carrinho.", carrinho: carrinhoItems }), {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}