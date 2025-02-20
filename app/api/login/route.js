import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Lista de origens permitidas
const allowedOrigins = ['https://tedie.vercel.app', 'http://localhost:8080'];

export async function POST(req) {
  try {
    const origin = req.headers.get('origin');
    if (!allowedOrigins.includes(origin)) {
      return new Response(JSON.stringify({ message: 'Origem não permitida' }), { status: 403 });
    }

    const body = await req.json();
    console.log("Dados recebidos:", body);

    const { email, senha } = body;
    if (!email || !senha) {
      return new Response(JSON.stringify({ message: 'Email e senha são obrigatórios' }), { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Buscar o usuário no banco de dados
    const user = await prisma.tedieUser.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ message: 'Usuário não encontrado' }), { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const isValid = bcrypt.compareSync(senha, user.senha);
    if (!isValid) {
      return new Response(JSON.stringify({ message: 'Senha inválida' }), { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const token = jwt.sign({ email: user.email, id: user.id }, 'secreto', { expiresIn: '1h' });

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Login realizado com sucesso",
        data: { id: user.id, token }
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
    return new Response(JSON.stringify({ message: 'Erro no servidor', error: error.message }), { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// Corrigindo a resposta OPTIONS para corresponder ao CORS da requisição POST
export async function OPTIONS(req) {
  const origin = req.headers.get('origin');
  if (!allowedOrigins.includes(origin)) {
    return new Response(JSON.stringify({ message: 'Origem não permitida' }), { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
