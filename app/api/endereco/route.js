import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 🛑 Trata requisições OPTIONS para CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// 🎯 POST para salvar um endereço
export async function POST(req) {
  try {
    const { Logradouro, Numero, Complemento, Bairro, Cidade, Estado, CEP, Pais } = await req.json();

    if (!Logradouro || !Numero || !Bairro || !Cidade || !Estado || !CEP) {
      return NextResponse.json(
        { error: "Todos os campos obrigatórios devem ser preenchidos." },
        { status: 400, headers: corsHeaders }
      );
    }

    const novoEndereco = await prisma.enderecos.create({
      data: {
        Logradouro,
        Numero,
        Complemento,
        Bairro,
        Cidade,
        Estado,
        CEP,
        Pais: Pais || "Brasil",
      },
    });

    return NextResponse.json(novoEndereco, { status: 201, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao salvar endereço: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 📍 GET para listar todos os endereços
export async function GET() {
  try {
    const enderecos = await prisma.enderecos.findMany();
    return NextResponse.json(enderecos, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar endereços: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
