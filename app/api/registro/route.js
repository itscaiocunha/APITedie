import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
    const body = await req.json();
    console.log("📩 Dados recebidos:", body);

    const { nome, cpf, email, senha, telefone } = body;

    // Validação dos campos obrigatórios
    if (!nome || !email || !senha) {
      return new Response(
        JSON.stringify({ message: 'Nome, email e senha são obrigatórios' }),
        {
          status: 400,
          headers
        }
      );
    }

    // Verifica se usuário já existe (por email ou cpf, se cpf foi fornecido)
    const whereClause = cpf ? { OR: [{ email }, { cpf }] } : { email };
    
    const existingUser = await prisma.usuarios.findFirst({
      where: whereClause
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ 
          message: cpf ? 'Usuário já cadastrado com este email ou CPF' : 'Usuário já cadastrado com este email'
        }),
        {
          status: 400,
          headers
        }
      );
    }

    // Hash da senha
    const hashedSenha = bcrypt.hashSync(senha, 10);

    // Criação do novo usuário
    const newUser = await prisma.usuarios.create({
      data: {
        nome,
        cpf: cpf || null, // CPF é opcional no schema
        email,
        senha: hashedSenha,
        telefone: telefone || null,
        tipo_usuario: "cliente", // Valor padrão definido no schema
        data_criacao: new Date(),
        // endereco_id não é fornecido no cadastro inicial
      }
    });

    if (!newUser || !newUser.id) {
      throw new Error("Erro ao criar usuário no banco de dados");
    }

    // Geração do token JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, tipo_usuario: newUser.tipo_usuario },
      'secreto', // Recomendo usar uma variável de ambiente para o secret
      { expiresIn: '1h' }
    );

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Usuário registrado com sucesso",
        data: { 
          token,
          user: {
            id: newUser.id,
            nome: newUser.nome,
            email: newUser.email,
            tipo_usuario: newUser.tipo_usuario
          }
        }
      }),
      {
        status: 201,
        headers
      }
    );

  } catch (error) {
    console.error("❌ Erro no servidor:", error);

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
  }
}