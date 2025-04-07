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

    const resetLink = `https://tedie.com.br/newpass?email=${email}`;

    const msg = {
      to: email,
      from: 'caiocunha@w7agencia.com.br',
      subject: 'Redefinição de Senha',
      text: `Clique no link para redefinir sua senha: ${resetLink}`,
      html: `
        <div>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f9f9; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; padding: 40px; font-family: Arial, sans-serif; color: #333333;">
                  <!-- Logo / Mascote -->
                  <tr>
                    <td align="center" style="padding-bottom: 20px;">
                      <img src="https://tedie.vercel.app/logos/Urso_Tedie.png" alt="Tedie!" width="120" style="display:block;" />
                    </td>
                  </tr>

                  <!-- Título -->
                  <tr>
                    <td align="center" style="font-size: 24px; font-weight: bold; padding-bottom: 20px;">
                      Redefina sua senha
                    </td>
                  </tr>

                  <!-- Texto explicativo -->
                  <tr>
                    <td style="font-size: 16px; line-height: 24px; padding-bottom: 30px; text-align: center">
                      Recebemos uma solicitação para redefinir sua senha.<br>
                      Clique no botão abaixo para criar uma nova senha:
                    </td>
                  </tr>

                  <!-- Botão -->
                  <tr>
                    <td align="center" style="padding-bottom: 30px;">
                      <a href="${resetLink}" style="background-color: #FDB612; color: #ffffff; text-decoration: none; padding: 12px 20px; font-size: 16px; border-radius: 4px; display: inline-block;">
                        Redefinir Senha
                      </a>
                    </td>
                  </tr>

                  <!-- Aviso -->
                  <tr>
                    <td style="font-size: 14px; color: #888888; padding-bottom: 30px; text-align: center">
                      Se você não solicitou essa alteração, pode ignorar este e-mail.
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td align="center" style="padding-bottom: 20px;">
                      <img src="https://tedie.vercel.app/logo_tedie.svg" alt="Tedie!" width="120" style="display:block;" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
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