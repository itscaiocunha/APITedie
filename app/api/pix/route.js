import { NextResponse } from "next/server";

const MERCADO_PAGO_TOKEN = process.env.MP_ACCESS_TOKEN;

export async function POST(req) {
  try {
    const body = await req.json();

    if (!MERCADO_PAGO_TOKEN) {
      console.error("Erro: Token do Mercado Pago não configurado.");
      return NextResponse.json(
        { error: "Erro interno: Token não configurado" },
        { status: 500 }
      );
    }

    if (!body.amount || isNaN(body.amount) || body.amount <= 0) {
      return NextResponse.json(
        { error: "Valor da transação (amount) inválido" },
        { status: 400 }
      );
    }

    if (
      !body.email ||
      typeof body.email !== "string" ||
      !body.email.includes("@")
    ) {
      return NextResponse.json(
        { error: "E-mail do pagador inválido" },
        { status: 400 }
      );
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

    if (!response.ok) {
      console.error("Erro do Mercado Pago:", await response.text());
      return NextResponse.json(
        { error: "Erro ao processar pagamento com o Mercado Pago" },
        { status: response.status }
      );
    }

    const text = await response.text(); // Obtém a resposta como texto
    console.log("Resposta do Mercado Pago:", text); // Debug

    let data;
    try {
      data = JSON.parse(text); // Tenta converter para JSON
    } catch (error) {
      console.error("Erro ao converter resposta para JSON:", error);
      return NextResponse.json(
        { error: "Erro ao processar resposta do Mercado Pago" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao gerar PIX:", error);
    return NextResponse.json(
      { error: "Erro inesperado ao processar pagamento" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  console.log("Verificando status do pagamento...");
  try {
    const { searchParams } = new URL(req.url);
    const idPagamento = searchParams.get("id");

    if (!MERCADO_PAGO_TOKEN) {
      console.error("Erro: Token do Mercado Pago não configurado.");
      return NextResponse.json(
        { error: "Erro interno: Token não configurado" },
        { status: 500 }
      );
    }

    if (!idPagamento || isNaN(idPagamento) || idPagamento < 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${idPagamento}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MERCADO_PAGO_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Erro do Mercado Pago:", await response.text());
      return NextResponse.json(
        { error: "Erro ao verificar pagamento com o Mercado Pago" },
        { status: response.status }
      );
    }

    const text = await response.text(); // Obtém a resposta como texto

    let data;
    try {
      data = JSON.parse(text); // Tenta converter para JSON
    } catch (error) {
      console.error("Erro ao converter resposta para JSON:", error);
      return NextResponse.json(
        { error: "Erro ao processar resposta do Mercado Pago" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status_pagamento: data.status,
      status_detail: data.status_detail,
    });
  } catch (error) {
    console.error("Erro no status:", error);
    return NextResponse.json(
      { error: "Erro inesperado ao verificar status do pagamento." },
      { status: 500 }
    );
  }
}
