import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lista de origens permitidas
const allowedOrigins = ['https://tedie.vercel.app', 'http://localhost:8080'];

export async function POST(req) {
  try {
    const origin = req.headers.get('origin');

    // Se a origem não estiver permitida, retorna erro de CORS
    if (!allowedOrigins.includes(origin)) {
      return new Response(JSON.stringify({ message: "CORS bloqueado" }), {
        status: 403,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const body = await req.json();
    console.log("Dados recebidos:", body);

    const { email, senha } = body;
    if (!email || !senha) {
      return new Response(JSON.stringify({ message: 'Email e senha são obrigatórios' }), {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': origin }
      });
    }

    // Buscar usuário no banco de dados
    const user = await prisma.TedieUser.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ message: 'Usuário não encontrado' }), {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': origin }
      });
    }

    const isValid = await bcrypt.compare(senha, user.senha);
    if (!isValid) {
      return new Response(JSON.stringify({ message: 'Senha inválida' }), {
        status: 401,
        headers: { 'Access-Control-Allow-Origin': origin }
      });
    }

    const token = jwt.sign({ email: user.email, id: user.id }, process.env.JWT_SECRET || 'secreto', {
      expiresIn: '1h'
    });

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
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// Middleware para requisições OPTIONS (CORS preflight)
export async function OPTIONS(req) {
  const origin = req.headers.get('origin');
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
