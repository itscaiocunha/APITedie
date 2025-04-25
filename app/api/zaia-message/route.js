import { NextResponse } from "next/server";

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

    const {
      nomeProduto,
      quantidadeProduto,
      valorTotalPedido,
      enderecoPedido,
      emailPedido,
      phoneNumber,
    } = body;

    if (!nomeProduto || !quantidadeProduto || !valorTotalPedido || !enderecoPedido || !emailPedido) {
      return new Response(JSON.stringify({ error: "Dados incompletos para envio ao webhook" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const response = await fetch("https://api.z-whitelabel.com/v1/webhook/agent-incoming-webhook-event/create?agentIncomingWebhookId=3317&key=916bf89b-9592-4776-97a9-c234334f89d7", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nomeProduto,
        quantidadeProduto,
        valorTotalPedido,
        enderecoPedido,
        emailPedido,
        phoneNumber,
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("Erro no webhook da Zaia:", text);
      return new Response(JSON.stringify({ error: "Erro ao enviar dados para Zaia" }), {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(text, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Erro no proxy Zaia:", error);
    return new Response(JSON.stringify({ error: "Erro interno ao processar proxy" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}