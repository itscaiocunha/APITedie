import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


//Login
export async function POST(req) {
  try {
    const body = await req.json(); // Pegando os dados corretamente
    console.log("Dados recebidos:", body);

    const { email, senha } = body;
    if (!email || !senha) {
      return new Response(JSON.stringify({ message: 'Email e senha são obrigatórios' }), { status: 400 });
    }

    // Alterado para TedieUser
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
      JSON.stringify(
        {
          status: "success",
          message: "Login realizado com sucesso",
          data: {
            id: user.id,
            token
          }
        },
        null,
        2
      ),
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro no servidor:", error);
    return new Response(JSON.stringify({ message: 'Erro no servidor', error: error.message }), { status: 500 });
  }
}


//Registro
