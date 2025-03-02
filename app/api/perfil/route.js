import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ message: "Token não fornecido" }), {
      status: 401,
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secreto");

    const user = await prisma.usuarios.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, nome: true, telefone: true }, // Retorne os dados necessários
    });

    if (!user) {
      return new Response(JSON.stringify({ message: "Usuário não encontrado" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ status: "success", user }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Token inválido" }), {
      status: 401,
    });
  }
}
