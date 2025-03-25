import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(req) {
  try {
    // ID do usuário deve ser passado como parâmetro na URL (exemplo: /api/pedidos?id=1)
    const url = new URL(req.url);
    const userId = parseInt(url.searchParams.get("id"), 10);

    if (!userId) {
      return new Response(JSON.stringify({ message: "ID do usuário não fornecido" }), { status: 400, headers });
    }

    const pedidos = await prisma.pedidos.findMany({
      where: { usuario_id: userId },
    });

    if (!pedidos.length) {
      return new Response(JSON.stringify({ message: "Nenhum pedido encontrado" }), { status: 404, headers });
    }

    return new Response(JSON.stringify({ status: "success", pedidos }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Erro ao buscar pedidos" }), { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}