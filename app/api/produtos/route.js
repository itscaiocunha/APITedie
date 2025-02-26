import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    return await getProductById(parseInt(id));
  }

  return await getAllProducts();
}

// Função para incluir cabeçalhos CORS nas respostas
function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Permite requisições de qualquer origem
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function getAllProducts() {
  try {
    const produtos = await prisma.produtos.findMany();
    return createResponse(produtos);
  } catch (error) {
    console.error('Erro ao buscar todos os produtos:', error);
    return createResponse({ message: 'Erro ao buscar produtos' }, 500);
  }
}

async function getProductById(id) {
  try {
    const produto = await prisma.produtos.findUnique({
      where: { id },
      include: { categorias: true },
    });

    if (!produto) {
      return createResponse({ message: 'Produto não encontrado' }, 404);
    }

    return createResponse(produto);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return createResponse({ message: 'Erro ao buscar produto' }, 500);
  }
}
