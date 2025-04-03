import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userEmail = url.searchParams.get("email"); // Removed parseInt

    if (!userEmail) {
      return new Response(JSON.stringify({ message: "Email do usuário não fornecido" }), { 
        status: 400, 
        headers 
      });
    }

    const user = await prisma.usuarios.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    if (!user) {
      return new Response(JSON.stringify({ message: "Usuário não encontrado" }), { 
        status: 404, 
        headers 
      });
    }

    return new Response(JSON.stringify({ status: "success", user }), { 
      status: 200, 
      headers 
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Erro ao buscar usuário" }), { 
      status: 500, 
      headers 
    });
  }
}

export async function OPTIONS() {
  return new Response(null, { 
    status: 204, 
    headers 
  });
}