import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

    // Debug: log the complete user data from Prisma
    console.log("Full user data from Prisma:", user);

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
      return new Response(JSON.stringify({ message: "ID do usuário é obrigatório" }), { status: 400, headers });
    }

    const updatedUser = await prisma.usuarios.update({
      where: { id: body.id },
      data: {
        nome: body.nome,
        cpf: body.cpf,
        telefone: body.telefone,
        enderecos: body.endereco ? {
          update: {
            cep: body.endereco.cep,
            logradouro: body.endereco.logradouro,
            numero: body.endereco.numero,
            complemento: body.endereco.complemento,
            bairro: body.endereco.bairro,
            cidade: body.endereco.cidade,
            estado: body.endereco.estado,
            pais: body.endereco.pais
          }
        } : undefined
      },
      include: {
        enderecos: true
      },
      select: {
        id: true,
        nome: true,
        cpf: true,
        email: true,
        telefone: true,
        tipo_usuario: true,
        enderecos: {
          select: {
            cep: true,
            logradouro: true,
            numero: true,
            complemento: true,
            bairro: true,
            cidade: true,
            estado: true,
            pais: true
          }
        }
      }
    });

    // Reformatando a resposta para juntar os dados do usuário e endereço
    const formattedUser = {
      ...updatedUser,
      ...updatedUser.enderecos
    };
    delete formattedUser.enderecos;

    return new Response(JSON.stringify({ status: "success", user: formattedUser }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Erro ao atualizar usuário" }), { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}