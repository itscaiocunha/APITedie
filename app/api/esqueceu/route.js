import sgMail from '@sendgrid/mail';

// Configura a chave da API do SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(req) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'E-mail é obrigatório' }),
        { status: 400 }
      );
    }

    const resetLink = `https://tedie.vercel.app/newpass?email=${email}`;

    const msg = {
      to: email,
      from: 'caiocunha@w7agencia.com.br',
      subject: 'Redefinição de Senha',
      text: `Clique no link para redefinir sua senha: ${resetLink}`,
      html: `
        <div>
          <h1>Redefina sua senha</h1>
          <p>Clique <a href="${resetLink}">aqui</a> para redefinir sua senha.</p>
          <p>Se você não solicitou isso, ignore este e-mail.</p>
        </div>
      `,
    };

    await sgMail.send(msg);
    
    return new Response(
      JSON.stringify({ success: true, message: 'E-mail enviado com sucesso!' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao enviar e-mail:', {
      message: error.message,
      code: error.code,
      response: error.response?.body
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Falha ao enviar e-mail',
        details: error.response?.body || error.message 
      }),
      { status: 500 }
    );
  }
}