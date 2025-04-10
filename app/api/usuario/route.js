import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Funções auxiliares
async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

function validarCPF(cpf) {
  // Implementação básica - considere usar uma validação mais robusta
  if (!cpf) return false;
  const cleanedCPF = cpf.replace(/\D/g, '');
  return cleanedCPF.length === 11;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userIdParam = url.searchParams.get("id");
    
    if (!userIdParam) {
      return new Response(
        JSON.stringify({ message: "ID do usuário não fornecido" }), 
        { status: 400, headers }
      );
    }

    const userId = parseInt(userIdParam, 10);
    
    if (isNaN(userId)) {
      return new Response(
        JSON.stringify({ message: "ID do usuário inválido" }), 
        { status: 400, headers }
      );
    }

    const user = await prisma.usuarios.findUnique({
      where: { id: userId },
      include: {
        enderecos: true
      }
    });

    if (!user) {
      return new Response(
        JSON.stringify({ message: "Usuário não encontrado" }), 
        { status: 404, headers }
      );
    }

    // Format the response
    const responseData = {
      id: user.id,
      nome: user.nome,
      cpf: user.cpf,
      email: user.email,
      telefone: user.telefone,
      tipo_usuario: user.tipo_usuario,
      endereco: user.enderecos ? {
        cep: user.enderecos.CEP,
        logradouro: user.enderecos.Logradouro,
        numero: user.enderecos.Numero,
        complemento: user.enderecos.Complemento,
        bairro: user.enderecos.Bairro,
        cidade: user.enderecos.Cidade,
        estado: user.enderecos.Estado,
        pais: user.enderecos.Pais
      } : null
    };

    return new Response(
      JSON.stringify({ status: "success", user: responseData }), 
      { status: 200, headers }
    );
    
  } catch (error) {
    console.error("Error fetching user:", error);
    return new Response(
      JSON.stringify({ 
        message: "Erro ao buscar usuário",
        error: error.message 
      }), 
      { status: 500, headers }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();

    if (!body.id) {
      return new Response(
        JSON.stringify({ message: "ID do usuário é obrigatório" }), 
        { status: 400, headers }
      );
    }

    // Verifica se o usuário existe
    const user = await prisma.usuarios.findUnique({
      where: { id: body.id }
    });

    if (!user) {
      return new Response(
        JSON.stringify({ message: "Usuário não encontrado" }), 
        { status: 404, headers }
      );
    }

    // Objeto com dados para atualização
    const updateData = {
      nome: body.nome,
      telefone: body.telefone
    };

    // Lógica para alteração de senha
    if (body.senhaAtual || body.novaSenha) {
      if (!body.senhaAtual || !body.novaSenha) {
        return new Response(
          JSON.stringify({ 
            message: "Para alterar a senha, forneça tanto a senha atual quanto a nova senha"
          }), 
          { status: 400, headers }
        );
      }

      // Verifica se a senha atual está correta
      const senhaValida = await comparePassword(body.senhaAtual, user.senha);
      
      if (!senhaValida) {
        return new Response(
          JSON.stringify({ message: "Senha atual incorreta" }), 
          { status: 401, headers }
        );
      }

      // Valida força da nova senha (mínimo 8 caracteres)
      if (body.novaSenha.length < 8) {
        return new Response(
          JSON.stringify({ 
            message: "A nova senha deve ter pelo menos 8 caracteres"
          }), 
          { status: 400, headers }
        );
      }

      // Criptografa a nova senha
      updateData.senha = await hashPassword(body.novaSenha);
    }

    // Atualiza CPF se fornecido e válido
    if (body.cpf) {
      if (!validarCPF(body.cpf)) {
        return new Response(
          JSON.stringify({ message: "CPF inválido" }), 
          { status: 400, headers }
        );
      }
      updateData.cpf = body.cpf.replace(/\D/g, '');
    }

    // Atualiza o usuário no banco de dados
    const updatedUser = await prisma.usuarios.update({
      where: { id: body.id },
      data: updateData,
      include: {
        enderecos: true
      }
    });

    // Formata a resposta (removendo a senha)
    const { senha, ...userWithoutPassword } = updatedUser;

    const responseData = {
      ...userWithoutPassword,
      endereco: updatedUser.enderecos ? {
        cep: updatedUser.enderecos.CEP,
        logradouro: updatedUser.enderecos.Logradouro,
        numero: updatedUser.enderecos.Numero,
        complemento: updatedUser.enderecos.Complemento,
        bairro: updatedUser.enderecos.Bairro,
        cidade: updatedUser.enderecos.Cidade,
        estado: updatedUser.enderecos.Estado,
        pais: updatedUser.enderecos.Pais
      } : null
    };

    return new Response(
      JSON.stringify({ 
        status: "success", 
        message: "Usuário atualizado com sucesso",
        user: responseData 
      }), 
      { status: 200, headers }
    );

  } catch (error) {
    console.error("Erro detalhado:", error);
    return new Response(
      JSON.stringify({ 
        message: "Erro ao atualizar usuário",
        error: error.message,
        details: error.meta || null
      }), 
      { status: 500, headers }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}