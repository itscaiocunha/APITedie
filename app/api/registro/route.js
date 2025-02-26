import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const headers = {
  "Access-Control-Allow-Origin": "*",  // Permite qualquer origem
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",  // Métodos permitidos
  "Access-Control-Allow-Headers": "Content-Type, Authorization",  // Cabeçalhos permitidos
};

// Registro de usuário
export async function POST(req) {
  try {
    // Pega os dados da requisição
    const body = await req.json();
    console.log("📩 Dados recebidos:", body);

    // Extrai os campos do body
    const { nome, cpf, email, senha, telefone } = body;

    // Verifica se todos os campos obrigatórios foram enviados
    if (!nome || !cpf || !email || !senha) {
      return new Response(
        JSON.stringify({ message: 'Nome, CPF, email e senha são obrigatórios' }),
        { status: 400 }
      );
    }

    // Verifica se o usuário já existe (CPF ou email)
    const existingUser = await prisma.usuarios.findFirst({
      where: { OR: [{ email }, { cpf }] },
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ message: 'Usuário já cadastrado com este email ou CPF' }),
        { status: 400 }
      );
    }

    // Criptografa a senha
    const hashedSenha = bcrypt.hashSync(senha, 10);

    // Cria o usuário no banco de dados
    const newUser = await prisma.usuarios.create({
      data: {
        nome,
        cpf,
        email,
        senha: hashedSenha,
        telefone: telefone || null,  // Define como null se não for enviado
        endereco: null,               // Mantém opcional
        tipo_usuario: "cliente",       // Valor padrão
        data_criacao: new Date()        // Define a data de criação
      }
    });

    // **Verifica se newUser foi criado corretamente**
    if (!newUser || !newUser.id) {
      throw new Error("Erro ao criar usuário no banco de dados");
    }

    // Gera um token JWT para autenticação
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      'secreto',
      { expiresIn: '1h' }
    );

    // Retorna sucesso
    return new Response(
      JSON.stringify({
        status: "success",
        message: "Usuário registrado com sucesso",
        data: { token }
      }, null, 2),  // Indenta o JSON para melhor leitura
      { status: 201 }
    );

  } catch (error) {
    // console.error("❌ Erro no servidor:", error);

    return new Response(
      JSON.stringify({
        message: 'Erro no servidor',
        error: error.message
      }),
      { status: 500 }
    );
  }
}
