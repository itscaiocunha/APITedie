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

    // Extrai os campos do body (agora usando data_nascimento)
    const { nome, cpf, email, senha, telefone, data_nascimento } = body;

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

    // Função para formatar a data de DD/MM/YYYY para Date
    const parseDate = (dateString) => {
      if (!dateString) return null;
      
      // Verifica se já está no formato ISO (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
      }
      
      // Converte de DD/MM/YYYY para Date
      const parts = dateString.split('/');
      if (parts.length !== 3) return null;
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Mês é 0-based
      const year = parseInt(parts[2], 10);
      
      const date = new Date(year, month, day);
      
      // Verifica se a data é válida
      if (isNaN(date.getTime())) return null;
      
      // Verifica se os componentes da data bateram com o input
      if (
        date.getDate() !== day ||
        date.getMonth() !== month ||
        date.getFullYear() !== year
      ) {
        return null;
      }
      
      return date;
    };

    // Processa a data de nascimento
    const parsedDate = parseDate(data_nascimento);
    
    if (data_nascimento && !parsedDate) {
      return new Response(
        JSON.stringify({ 
          message: 'Formato de data inválido. Use DD/MM/YYYY',
          received: data_nascimento
        }),
        {
          status: 400,
          headers
        }
      );
    }

    // Verifica se usuário já existe
    const existingUser = await prisma.usuarios.findFirst({
      where: {
        OR: [
          { email },
          ...(cpf ? [{ cpf }] : [])
        ]
      }
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ 
          message: cpf 
            ? 'Usuário já cadastrado com este email ou CPF' 
            : 'Usuário já cadastrado com este email'
        }),
        {
          status: 400,
          headers
        }
      );
    }

    // Hash da senha
    const hashedSenha = await bcrypt.hash(senha, 10);

    // Criação do usuário
    const newUser = await prisma.usuarios.create({
      data: {
        nome,
        cpf: cpf || null,
        email,
        senha: hashedSenha,
        telefone: telefone || null,
        data_nascimento: parsedDate,
        tipo_usuario: "cliente",
        data_criacao: new Date(),
      }
    });

    // Gera o token JWT
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        tipo_usuario: newUser.tipo_usuario
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    // Retorna a resposta
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
            tipo_usuario: newUser.tipo_usuario,
            data_nascimento: newUser.data_nascimento,
            telefone: newUser.telefone
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