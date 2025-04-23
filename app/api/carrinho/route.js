import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const usuario_id = searchParams.get("usuario_id");

  if (!usuario_id) {
    return new NextResponse(JSON.stringify({ 
      success: false,
      error: "ID do usuário é obrigatório." 
    }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {

    const dataMaisRecente = await prisma.carrinho.findFirst({
      where: { usuario_id: parseInt(usuario_id) },
      orderBy: { data_adicao: 'desc' },
      select: { data_adicao: true }
    });

    console.log("Data mais recente:", dataMaisRecente.data_adicao);

    if (!dataMaisRecente) {
      return new NextResponse(JSON.stringify({
        success: true,
        message: "Data não encontrada.",
        itens: [],
      }), { 
        status: 200,
        headers: corsHeaders
      });
    }

    // Truncar a data para o mesmo segundo
    const dataMaisRecenteSemMs = new Date(Math.floor(dataMaisRecente.data_adicao.getTime() / 1000) * 1000);

    console.log("Data mais recente sem ms:", dataMaisRecenteSemMs);

    // Definir intervalo de 1 segundo
    const inicioDoSegundo = new Date(dataMaisRecenteSemMs.getTime());
    const finalDoSegundo = new Date(dataMaisRecenteSemMs.getTime() + 999); // até .999 ms

    // Depois buscamos todos os itens com essa data
    const itensRecentes = await prisma.carrinho.findMany({
      where: { 
        usuario_id: parseInt(usuario_id),
        data_adicao: {
          gte: inicioDoSegundo,
          lte: finalDoSegundo
        }
      },
      select: {
        id: true,
        usuario_id: true,
        produto_id: true,
        nome: true, 
        quantidade: true,
        preco: true,
        imagem: true,
        data_adicao: true,
      },
      orderBy: {
        data_adicao: 'desc'
      }
    });

    if(!itensRecentes || itensRecentes.length === 0) {
      return new NextResponse(JSON.stringify({
        success: true,
        message: "Nenhum produto encontrado.",
        itens: [],
      }), { 
        status: 200,
        headers: corsHeaders
      });
    }

    return new NextResponse(JSON.stringify({
      success: true,
      itens: itensRecentes,
      data_adicao: dataMaisRecente.data_adicao
    }), { 
      status: 200,
      headers: corsHeaders
    });
    
  } catch (error) {
    return new NextResponse(JSON.stringify({ 
      success: false,
      error: "Erro ao consultar carrinho",
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { usuario_id, itens } = body;

    if (!usuario_id || !itens || !Array.isArray(itens)) {
      return new NextResponse(JSON.stringify({
        success: false,
        error: "Dados inválidos - usuário e itens são obrigatórios"
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const result = await prisma.$transaction(
      itens.map(item => 
        prisma.carrinho.create({
          data: {
            usuario_id,
            produto_id: item.produto_id,
            nome: item.nome,
            quantidade: item.quantidade,
            preco: item.preco,
            imagem: item.imagem,
          },
          select: {
            produto_id: true, //trocar aqui para produto_id depois
            nome: true,
            quantidade: true,
            preco: true,
            data_adicao: true
          }
        })
      )
    );

    return new NextResponse(JSON.stringify({
      success: true,
      itens: result,
      metadata: {
        primeiro_item_adicionado_em: result[0]?.data_adicao || null
      }
    }), { 
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    console.error("Erro:", error);
    return new NextResponse(JSON.stringify({ 
      success: false,
      error: "Erro ao adicionar itens",
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: corsHeaders,
  });
}