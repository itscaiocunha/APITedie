import { NextResponse } from 'next/server';
import mercadopago from 'mercadopago';

// Configuração do Mercado Pago
mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN || '');

// Função para lidar com requisições POST
export async function POST(request) {
  try {
    // Obtém o corpo da requisição
    const body = await request.json();
    const { transactionAmount, token, description, installments, paymentMethodId, email } = body;

    // Verificação dos dados recebidos
    if (!transactionAmount || !token || !description || !installments || !paymentMethodId || !email) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Estrutura dos dados do pagamento
    const payment_data = {
      transaction_amount: Number(transactionAmount),
      token,
      description,
      installments: Number(installments),
      payment_method_id: paymentMethodId,
      payer: {
        email,
      }
    };

    // Criação do pagamento no Mercado Pago
    const payment = await mercadopago.payment.create(payment_data);

    // Retorno do pagamento em caso de sucesso
    return NextResponse.json(payment.body);
  } catch (error) {
    // Tratamento de erros
    console.error('Erro ao criar pagamento:', error.response ? error.response.data : error);
    return NextResponse.json({ error: 'Erro ao processar pagamento' }, { status: 500 });
  }
}
