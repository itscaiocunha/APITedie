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

// 🎟️ POST para validar cupom
export async function POST(req) {
  try {
    const { codigo } = await req.json();

    if (!codigo) {
      return NextResponse.json(
        { error: "Código do cupom é obrigatório" },
        { status: 400, headers: corsHeaders }
      );
    }

    const cupom = await prisma.cupons.findFirst({
      where: { codigo },
    });

    if (!cupom) {
      return NextResponse.json(
        { error: "Cupom inválido" },
        { status: 404, headers: corsHeaders }
      );
    }

    const agora = new Date();
    if (cupom.validade && cupom.validade < agora) {
      return NextResponse.json(
        { error: "Cupom expirado" },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { desconto: cupom.desconto },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno ao validar cupom" + error },
      { status: 500, headers: corsHeaders }
    );
  }
}
