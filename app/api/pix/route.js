import { NextResponse } from "next/server";

const MERCADO_PAGO_TOKEN = process.env.MP_ACCESS_TOKEN;

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://www.tedie.com.br",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (!MERCADO_PAGO_TOKEN) {
      console.error("Erro: Token do Mercado Pago não configurado.");
      return new Response(JSON.stringify({ error: "Erro interno: Token não configurado" }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    if (!body.amount || isNaN(body.amount) || body.amount <= 0) {
      return new Response(JSON.stringify({ error: "Valor da transação (amount) inválido" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    if (!body.email || typeof body.email !== "string" || !body.email.includes("@")) {
      return new Response(JSON.stringify({ error: "E-mail do pagador inválido" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MERCADO_PAGO_TOKEN}`,
        "X-Idempotency-Key": `${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: parseFloat(body.amount),
        payment_method_id: "pix",
        payer: { email: body.email },
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("Erro do Mercado Pago:", text);
      return new Response(JSON.stringify({ error: "Erro ao processar pagamento com o Mercado Pago" }), {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      console.error("Erro ao converter resposta para JSON:", error);
      return new Response(JSON.stringify({ error: "Erro ao processar resposta do Mercado Pago" }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PIX:", error);
    return new Response(JSON.stringify({ error: "Erro inesperado ao processar pagamento" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const idPagamento = searchParams.get("id");

    if (!MERCADO_PAGO_TOKEN) {
      console.error("Erro: Token do Mercado Pago não configurado.");
      return new Response(JSON.stringify({ error: "Erro interno: Token não configurado" }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    if (!idPagamento || isNaN(idPagamento) || idPagamento < 0) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${idPagamento}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MERCADO_PAGO_TOKEN}`,
      },
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("Erro do Mercado Pago:", text);
      return new Response(JSON.stringify({ error: "Erro ao verificar pagamento com o Mercado Pago" }), {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      console.error("Erro ao converter resposta para JSON:", error);
      return new Response(JSON.stringify({ error: "Erro ao processar resposta do Mercado Pago" }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify({
      status_pagamento: data.status,
      status_detail: data.status_detail,
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Erro no status:", error);
    return new Response(JSON.stringify({ error: "Erro inesperado ao verificar status do pagamento." }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();

    if (!MERCADO_PAGO_TOKEN) {
      console.error("Erro: Token do Mercado Pago não configurado.");
      return new Response(JSON.stringify({ error: "Erro interno: Token não configurado" }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    if (!body.status) {
      return new Response(JSON.stringify({ error: "Status da transação inválido" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    if (!body.idPagamento || isNaN(body.idPagamento) || body.idPagamento < 0) {
      return new Response(JSON.stringify({ error: "ID da transação inválido" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${body.idPagamento}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MERCADO_PAGO_TOKEN}`,
        "X-Idempotency-Key": `${Date.now()}`,
      },
      body: JSON.stringify({ status: body.status }),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("Erro do Mercado Pago:", text);
      return new Response(JSON.stringify({ error: "Erro ao cancelar código PIX com o Mercado Pago" }), {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      console.error("Erro ao converter resposta para JSON:", error);
      return new Response(JSON.stringify({ error: "Erro ao processar resposta do Mercado Pago" }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify({ paymentStatus: data.status }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Erro ao cancelar PIX:", error);
    return new Response(JSON.stringify({ error: "Erro inesperado ao processar pagamento" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}