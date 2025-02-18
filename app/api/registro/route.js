import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Registro de usuário
export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Dados recebidos para registro:", body);

    const { name, cpf, telefone, email, senha } = body;
    if (!name || !cpf || !telefone || !email || !senha) {
      return new Response(JSON.stringify({ message: 'Todos os campos são obrigatórios' }), { status: 400 });
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.TedieUser.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(JSON.stringify({ message: 'Usuário já cadastrado' }), { status: 400 });
    }

    // Criptografar a senha
    const hashedSenha = bcrypt.hashSync(senha, 10);

    // Criar novo usuário
    const newUser = await prisma.TedieUser.create({
      data: {
        name,
        cpf,
        telefone,
        email,
        senha: hashedSenha
      }
    });

    // Gerar token JWT
    const token = jwt.sign({ email: newUser.email, id: newUser.id }, 'secreto', { expiresIn: '1h' });

    return new Response(
  JSON.stringify(
    {
      status: "success",
      message: "Usuário registrado com sucesso",
      data: {
        token
      }
    },
    null,
    2 // Indenta o JSON para melhor leitura
  ),
  { status: 201 }
);
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Erro no servidor', error: error.message }), { status: 500 });
  }
}
