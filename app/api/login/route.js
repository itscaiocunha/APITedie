import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req) {
  // Configuração de CORS para permitir requisições do frontend
  const allowedOrigins = ['https://tedie.vercel.app', 'http://localhost:8080'];
  const origin = req.headers.get('origin');

  if (allowedOrigins.includes(origin)) {
    return new Response('OK', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    const body = await req.json();
    console.log("Dados recebidos:", body);

    const { email, senha } = body;
    if (!email || !senha) {
      return new Response(JSON.stringify({ message: 'Email e senha são obrigatórios' }), { status: 400 });
    }

    // Buscar o usuário no banco de dados
    const user = await prisma.TedieUser.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ message: 'Usuário não encontrado' }), { status: 200 });
    }

    const isValid = bcrypt.compareSync(senha, user.senha);
    if (!isValid) {
      return new Response(JSON.stringify({ message: 'Senha inválida' }), { status: 200 });
    }

    const token = jwt.sign({ email: user.email, id: user.id }, 'secreto', { expiresIn: '1h' });

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Login realizado com sucesso",
        data: {
          id: user.id,
          token
        }
      }),
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );

  } catch (error) {
    console.error("Erro no servidor:", error);
    return new Response(JSON.stringify({ message: 'Erro no servidor', error: error.message }), { status: 500 });
  }
}

// Responder requisições OPTIONS para o preflight do CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
