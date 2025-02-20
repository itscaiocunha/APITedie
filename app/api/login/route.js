import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Dados recebidos:", body);

    const { email, senha } = body;
    if (!email || !senha) {
      return new Response(JSON.stringify({ message: 'Email e senha são obrigatórios' }), { status: 400 });
    }

    // Buscar usuário no banco de dados
    const user = await prisma.TedieUser.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ message: 'Usuário não encontrado' }), { status: 404 });
    }

    const isValid = await bcrypt.compare(senha, user.senha);
    if (!isValid) {
      return new Response(JSON.stringify({ message: 'Senha inválida' }), { status: 401 });
    }

    const token = jwt.sign({ email: user.email, id: user.id }, process.env.JWT_SECRET || 'secreto', { expiresIn: '1h' });

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Login realizado com sucesso",
        data: { id: user.id, token }
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro no servidor:", error);
    return new Response(JSON.stringify({ message: 'Erro no servidor', error: error.message }), { status: 500 });
  }
}

// Remove completamente o preflight CORS
export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
