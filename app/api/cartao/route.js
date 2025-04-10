import { NextResponse } from "next/server";
import mercadopago from "mercadopago";
import { headers } from "next/headers";

const MERCADO_PAGO_TOKEN = process.env.MP_ACCESS_TOKEN;

if (!MERCADO_PAGO_TOKEN) {
  throw new Error("Token do Mercado Pago não configurado. Verifique suas variáveis de ambiente.");
}

mercadopago.configurations = {
  access_token: MERCADO_PAGO_TOKEN
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://www.tedie.com.br",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://www.tedie.com.br",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req) {
  try {
    const body = await req.json();

    // Validações básicas
    if (!body.amount || isNaN(body.amount) || body.amount <= 0) {
      return NextResponse.json({ error: "Valor da transação (amount) inválido" }, { status: 400, headers: corsHeaders });
    }
    if (!body.email || typeof body.email !== "string" || !body.email.includes("@")) {
      return NextResponse.json({ error: "E-mail do pagador inválido" }, { status: 400, headers: corsHeaders });
    }
    if (!body.card_number || !body.expiration_month || !body.expiration_year || !body.security_code || !body.cardholder_name) {
      return NextResponse.json({ error: "Dados do cartão incompletos" }, { status: 400, headers: corsHeaders });
    }

    // Gerar token do cartão
    const tokenResponse = await fetch("https://api.mercadopago.com/v1/card_tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MERCADO_PAGO_TOKEN}`
      },
      body: JSON.stringify({
        card_number: body.card_number,
        expiration_month: body.expiration_month,
        expiration_year: body.expiration_year,
        security_code: body.security_code,
        cardholder: {
          name: body.cardholder_name,
        }
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.id) {
      return NextResponse.json({ error: "Falha ao gerar token do cartão", details: tokenData }, { status: 400, headers: corsHeaders });
    }

    const cardToken = tokenData.id;

    if (!cardToken) {
      return NextResponse.json({ error: "Falha ao gerar token do cartão" }, { status: 400, headers: corsHeaders });
    }

    // Criar pagamento
    const paymentResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MERCADO_PAGO_TOKEN}`,
        "X-Idempotency-Key": `${Date.now()}`
      },
      body: JSON.stringify({
        transaction_amount: parseFloat(body.amount),
        token: cardToken,
        description: "Pagamento via Cartão",
        installments: body.installments || 1,
        issuer_id: body.issuer_id || null,
        payer: {
          email: body.email,
          identification: body.identification || {},
        },
      }),
    });

    if (!paymentResponse.ok) {
      console.error("Erro do Mercado Pago:", await paymentResponse.text());
      return NextResponse.json({ error: "Erro ao processar pagamento" }, { status: 400, headers: corsHeaders });
    }

    const paymentData = await paymentResponse.json();
    return NextResponse.json(paymentData, {
      status: 200,
      headers: corsHeaders,
    });    
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    return NextResponse.json({ error: "Erro inesperado ao processar pagamento" }, { status: 400, headers: corsHeaders });
  }
}
