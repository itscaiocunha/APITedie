import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const productId = Number(id);
      if (isNaN(productId)) {
        return createResponse({ message: 'ID inválido' }, 400);
      }
      return await fetchProductById(productId);
    }

    return await fetchAllProducts();
  } catch (error) {
    console.error('Erro na requisição:', error);
    return createResponse({ message: 'Erro interno no servidor' }, 500);
  }
}

async function fetchAllProducts() {
  try {
    const products = await prisma.produtos.findMany();
    return createResponse(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return createResponse({ message: 'Erro ao buscar produtos' }, 500);
  }
}

async function fetchProductById(id) {
  try {
    const product = await prisma.produtos.findUnique({
      where: { id },
    });

    if (!product) {
      return createResponse({ message: 'Produto não encontrado' }, 404);
    }

    return createResponse(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return createResponse({ message: 'Erro ao buscar produto' }, 500);
  }
}

function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
