import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ Definir cabeçalhos CORS
const headers = {
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ message: "Token não fornecido" }), {
      status: 401,
      headers,  // ✅ Inclui os cabeçalhos CORS para evitar bloqueios no navegador
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secreto");

    const user = await prisma.usuarios.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, nome: true, telefone: true },
    });

    if (!user) {
      return new Response(JSON.stringify({ message: "Usuário não encontrado" }), {
        status: 404,
        headers,
      });
    }

    return new Response(JSON.stringify({ status: "success", user }), {
      status: 200,
      headers,  // ✅ Inclui CORS na resposta do GET
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Token inválido" }), {
      status: 401,
      headers,  // ✅ Inclui CORS na resposta de erro
    });
  }
}

// ✅ Responde requisições OPTIONS corretamente
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers,
  });
}
