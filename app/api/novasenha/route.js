import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers
  });
}

export async function POST(req) {
  try {
    const { email, novaSenha } = await req.json();
    console.log("📩 Dados recebidos para redefinição:", { email });

    // Validação dos campos obrigatórios
    if (!email || !novaSenha) {
      return new Response(
        JSON.stringify({ message: 'Email e nova senha são obrigatórios' }),
        {
          status: 400,
          headers
        }
      );
    }

    // Verifica se usuário existe
    const usuario = await prisma.usuarios.findUnique({
      where: { email }
    });

    if (!usuario) {
      return new Response(
        JSON.stringify({ message: 'Usuário não encontrado' }),
        {
          status: 404,
          headers
        }
      );
    }

    // Hash da nova senha (usando o mesmo método do cadastro)
    const hashedSenha = bcrypt.hashSync(novaSenha, 10);

    // Atualiza a senha no banco de dados
    const usuarioAtualizado = await prisma.usuarios.update({
      where: { email },
      data: {
        senha: hashedSenha
      }
    });

    console.log("✅ Senha atualizada para usuário:", usuarioAtualizado.email);

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Senha redefinida com sucesso",
        data: {
          email: usuarioAtualizado.email,
          atualizado_em: new Date()
        }
      }),
      {
        status: 200,
        headers
      }
    );

  } catch (error) {
    console.error("❌ Erro na redefinição de senha:", error);

    return new Response(
      JSON.stringify({
        message: 'Erro no servidor',
        error: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}