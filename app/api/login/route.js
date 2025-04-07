import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ Definir cabeçalhos CORS globais
const headers = {
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",  // Métodos permitidos
  "Access-Control-Allow-Headers": "Content-Type, Authorization",  // Cabeçalhos permitidos
};

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Dados recebidos:", body);

    const { email, senha } = body;
    if (!email || !senha) {
      return new Response(
        JSON.stringify({ message: "Email e senha são obrigatórios" }),
        { status: 400, headers }
      );
    }

    // Buscar usuário no banco de dados
    const user = await prisma.usuarios.findUnique({ where: { email } });
    if (!user) {
      return new Response(
        JSON.stringify({ message: "Usuário não encontrado" }),
        { status: 404, headers }
      );
    }

    const isValid = await bcrypt.compare(senha, user.senha);
    if (!isValid) {
      return new Response(
        JSON.stringify({ message: "Senha inválida" }),
        { status: 401, headers }
      );
    }

    const token = jwt.sign(
      { email: user.email, id: user.id },
      process.env.JWT_SECRET || "secreto",
      { expiresIn: "1h" }
    );

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Login realizado com sucesso",
        data: { id: user.id, token, name: user.nome }, // <-- Usando "nome" corretamente
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error("Erro no servidor:", error);
    return new Response(
      JSON.stringify({ message: "Erro no servidor", error: error.message }),
      { status: 500, headers }
    );
  }
}

// ✅ Responde requisições OPTIONS para CORS
export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}
