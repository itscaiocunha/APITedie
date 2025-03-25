import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(req) {
  try {
    // ID do usuário deve ser passado como parâmetro na URL (exemplo: /api/user?id=1)
    const url = new URL(req.url);
    const userId = parseInt(url.searchParams.get("id"), 10);

    if (!userId) {
      return new Response(JSON.stringify({ message: "ID do usuário não fornecido" }), { status: 400, headers });
    }

    const user = await prisma.usuarios.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        cpf: true,
        email: true,
        telefone: true,
        endereco: true,
        tipo_usuario: true,
      },
    });

    if (!user) {
      return new Response(JSON.stringify({ message: "Usuário não encontrado" }), { status: 404, headers });
    }

    return new Response(JSON.stringify({ status: "success", user }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Erro ao buscar usuário" }), { status: 500, headers });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();

    if (!body.id) {
      return new Response(JSON.stringify({ message: "ID do usuário é obrigatório" }), { status: 400, headers });
    }

    const updatedUser = await prisma.usuarios.update({
      where: { id: body.id },
      data: {
        nome: body.nome,
        cpf: body.cpf,
        telefone: body.telefone,
        endereco: body.endereco,
      },
      select: {
        id: true,
        nome: true,
        cpf: true,
        email: true,
        telefone: true,
        endereco: true,
        tipo_usuario: true,
      },
    });

    return new Response(JSON.stringify({ status: "success", user: updatedUser }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Erro ao atualizar usuário" }), { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}
