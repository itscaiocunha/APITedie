import { prisma } from '@/lib/prisma'; // Importe sua instância do Prisma
import bcrypt from 'bcryptjs'; // Para hash da senha

export async function POST(req) {
  try {
    const { email, novaSenha } = await req.json();
    
    // Validações básicas
    if (!email || !novaSenha) {
      return new Response(
        JSON.stringify({ error: 'E-mail e nova senha são obrigatórios' }),
        { status: 400 }
      );
    }

    if (novaSenha.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }),
        { status: 400 }
      );
    }

    // Verifica se o usuário existe
    const usuario = await prisma.usuarios.findUnique({
      where: { email }
    });

    if (!usuario) {
      return new Response(
        JSON.stringify({ error: 'E-mail não encontrado' }),
        { status: 404 }
      );
    }

    // Cria o hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(novaSenha, salt);

    // Atualiza a senha no banco de dados usando Prisma
    const usuarioAtualizado = await prisma.usuarios.update({
      where: { email },
      data: { 
        senha: senhaHash,
        // Você pode adicionar data_atualizacao se quiser registrar quando a senha foi alterada
        // data_atualizacao: new Date()
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Senha atualizada com sucesso!',
        data: {
          id: usuarioAtualizado.id,
          email: usuarioAtualizado.email,
          nome: usuarioAtualizado.nome
          // Não retornar dados sensíveis
        }
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    
    // Tratamento específico para erros do Prisma
    if (error.code === 'P2025') {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Erro interno ao redefinir senha',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }),
      { status: 500 }
    );
  }
}