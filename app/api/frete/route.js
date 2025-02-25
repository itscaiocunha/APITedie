import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Dados recebidos:", body);

    const { cep, peso } = body;
    if (!cep || !peso) {
      return new Response(
        JSON.stringify({ message: "CEP e peso são obrigatórios" }),
        { status: 400, headers }
      );
    }

    // Consulta ao serviço de CEP (Exemplo usando ViaCEP)
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const cepData = await response.json();

    if (cepData.erro) {
      return new Response(
        JSON.stringify({ message: "CEP inválido" }),
        { status: 400, headers }
      );
    }

    // Simulação de cálculo de frete
    const baseFrete = 10; // Valor base do frete
    const taxaPeso = 2; // Taxa por kg
    const valorFrete = baseFrete + peso * taxaPeso;

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Consulta realizada com sucesso",
        data: {
          cep: cepData.cep,
          logradouro: cepData.logradouro,
          bairro: cepData.bairro,
          cidade: cepData.localidade,
          estado: cepData.uf,
          frete: valorFrete.toFixed(2),
        },
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Erro no servidor:", error);
    return new Response(
      JSON.stringify({ message: "Erro no servidor", error: error.message }),
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}
