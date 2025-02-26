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

async function getAllProducts() {
  try {
    const produtos = await prisma.produtos.findMany();
    return new Response(JSON.stringify(produtos), { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar todos os produtos:', error);
    return new Response(JSON.stringify({ message: 'Erro ao buscar produtos' }), { status: 500 });
  }
}

async function getProductById(id) {
  try {
    const produto = await prisma.produtos.findUnique({
      where: { id },
      include: {
        categorias: true
      }
    });

    if (!produto) {
      return new Response(JSON.stringify({ message: 'Produto não encontrado' }), { status: 404 });
    }

    return new Response(JSON.stringify(produto), { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return new Response(JSON.stringify({ message: 'Erro ao buscar produto' }), { status: 500 });
  }
}
