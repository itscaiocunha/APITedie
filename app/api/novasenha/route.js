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
    const { token, novaSenha } = await req.json();
    console.log("📩 Dados recebidos para redefinição:", { token });

    if (!token || !novaSenha) {
      return new Response(
        JSON.stringify({ message: 'Token e nova senha são obrigatórios' }),
        { status: 400, headers }
      );
    }

    // 🔍 Busca o token no banco
    const tokenData = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!tokenData) {
      return new Response(
        JSON.stringify({ message: 'Token inválido' }),
        { status: 400, headers }
      );
    }

    // ⏳ Verifica se o token expirou
    const now = new Date();
    if (tokenData.expiresAt < now) {
      // Exclui o token expirado
      await prisma.passwordResetToken.delete({ where: { token } });
      return new Response(
        JSON.stringify({ message: 'Token expirado' }),
        { status: 400, headers }
      );
    }

    // 🔒 Busca o usuário pelo e-mail do token
    const usuario = await prisma.usuarios.findUnique({
      where: { email: tokenData.email }
    });

    if (!usuario) {
      return new Response(
        JSON.stringify({ message: 'Usuário não encontrado' }),
        { status: 404, headers }
      );
    }

    // 🔐 Gera o hash da nova senha
    const hashedSenha = bcrypt.hashSync(novaSenha, 10);

    // 🛠 Atualiza a senha do usuário
    const usuarioAtualizado = await prisma.usuarios.update({
      where: { email: tokenData.email },
      data: {
        senha: hashedSenha
      }
    });

    // 🧹 Deleta o token após uso
    await prisma.passwordResetToken.delete({ where: { token } });

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
      { status: 200, headers }
    );

  } catch (error) {
    console.error("❌ Erro na redefinição de senha:", error);

    return new Response(
      JSON.stringify({
        message: 'Erro no servidor',
        error: error.message
      }),
      { status: 500, headers }
    );
  } finally {
    await prisma.$disconnect();
  }
}