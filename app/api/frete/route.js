import { NextResponse } from "next/server";

const MELHOR_ENVIO_URL = "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate";

// ⚠️ Use variáveis de ambiente para armazenar tokens
const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 🛑 Trata requisições OPTIONS para CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// 📨 POST para calcular frete
export async function POST(req) {
  try {
    const body = await req.json();

    const response = await fetch(MELHOR_ENVIO_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${MELHOR_ENVIO_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "Aplicação tedie-api",
      },
      body: JSON.stringify(body),
    });

    // Verifica se a resposta é válida antes de tentar converter para JSON
    if (!response.ok) {
      return NextResponse.json(
        { error: "Falha ao calcular frete", status: response.status },
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno ao calcular frete" },
      { status: 500, headers: corsHeaders }
    );
  }
}
