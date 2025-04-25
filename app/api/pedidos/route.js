// Mostra os pedidos
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  
};

export async function GET(request) {
  try {
    // Validate request
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("id"));

    if (!userId || isNaN(userId)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "ID de usuário inválido ou não fornecido" 
        }),
        { status: 400, headers }
      );
    }

    // Fetch orders with related data
    const orders = await prisma.pedidos.findMany({
      where: { usuario_id: userId },
      include: {
        itens_pedido: {
          include: {
            produtos: {
              select: {
                id: true,
                nome: true,
                preco: true ,
                imagem: true
              }
            }
          }
        }
      },
      orderBy: {
        data_pedido: 'desc' 
      }
    });

    // Format response data
    const formattedOrders = orders.map(order => ({
      id: order.id,
      usuario_id: order.usuario_id,
      total: order.total,
      status: order.status,
      data_pedido: order.data_pedido,
      itens: order.itens_pedido.map(item => ({
        id: item.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unit: item.preco_unit,
        produto: {
          id: item.produtos.id,
          nome: item.produtos.nome,
          preco: item.produtos.preco,
          imagem: item.produtos.imagem
        }
      }))
    }));

    if (formattedOrders.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Nenhum pedido encontrado",
          data: []
        }),
        { status: 200, headers }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: formattedOrders 
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: "Erro no servidor",
        error: process.env.NODE_ENV === "development" ? error.message : null
      }),
      { status: 500, headers }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function OPTIONS() {
  return new Response(null, { 
    status: 204, 
    headers 
  });
}