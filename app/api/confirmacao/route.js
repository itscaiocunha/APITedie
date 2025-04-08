import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import bcrypt from 'bcrypt';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const prisma = new PrismaClient();

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function generateRandomPassword(length = 12) {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userEmail = url.searchParams.get("email");

    if (!userEmail) {
      return new Response(JSON.stringify({ message: "Email do usuário não fornecido" }), { 
        status: 400, 
        headers 
      });
    }

    let user = await prisma.usuarios.findUnique({
      where: { email: userEmail },
      select: { id: true, nome: true, email: true },
    });

    if (!user) {
      const randomPassword = generateRandomPassword();
      const hashedSenha = await bcrypt.hash(randomPassword, 10);
      const nome = userEmail.split('@')[0]
      const linklogin = "https://www.tedie.com.br/login"

      user = await prisma.usuarios.create({
        data: {
          email: userEmail,
          senha: hashedSenha,
          nome: nome,
        },
        select: { id: true, nome: true, email: true },
      });

      try {
        const msg = {
          to: userEmail,
          from: 'caiocunha@w7agencia.com.br',
          subject: 'Pré-Cadastro Tedie - Novo Usuário',
          text: `Olá ${nome},\n\nVocê foi pré-cadastrado na Tedie. Sua senha temporária é: ${randomPassword}\n\nAcesse: ${linklogin}`,
          html: `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complete seu cadastro na Tedie</title>
        </head>
        <body>
          <div>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f9f9; padding: 20px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" border="0"
                    style="background-color:#ffffff; padding: 40px; font-family: Arial, sans-serif; color: #333333; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <!-- Logo / Mascote -->
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <img src="https://tedie.vercel.app/logos/Urso_Tedie.png" alt="Tedie!" width="120"
                          style="display:block;" />
                      </td>
                    </tr>

                    <!-- Título -->
                    <tr>
                      <td align="center" style="font-size: 28px; font-weight: bold; padding-bottom: 20px; color: #2a2a2a;">
                        Um último passo para desbloquear todos os benefícios!
                      </td>
                    </tr>

                    <!-- Texto explicativo -->
                    <tr>
                      <td style="font-size: 16px; line-height: 24px; padding-bottom: 30px; text-align: center">
                        <strong>Olá ${nome},</strong><br><br>
                        Percebemos que você começou sua jornada conosco, <br> mas seu cadastro ainda não está completo!<br><br>

                        Ao finalizar agora, você ganha acesso exclusivo a:<br>
                        ✓ Histórico de todos seus pedidos<br>
                        ✓ Ofertas personalizadas<br>
                        ✓ E muito mais!<br><br>

                        <strong>Não deixe para depois - complete em menos de 1 minuto:</strong>
                      </td>
                    </tr>

                    <!-- Botão principal -->
                    <tr>
                      <td align="center" style="padding-bottom: 30px;">
                        <a href="${linklogin}"
                          style="background-color: #FDB612; color: #ffffff; text-decoration: none; padding: 15px 30px; font-size: 18px; border-radius: 4px; display: inline-block; font-weight: bold; box-shadow: 0 4px 8px rgba(253,182,18,0.3);">
                          COMPLETAR CADASTRO AGORA
                        </a>
                      </td>
                    </tr>

                    <tr>
                      <td align="center" style="padding-bottom: 30px;">
                        <p style="font-size: 18px; margin-bottom: 15px;">Sua senha temporária:</p>
                        <div style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; display: inline-block; margin-bottom: 15px;">
                          <strong style="font-size: 20px; letter-spacing: 1px;">${randomPassword}</strong>
                        </div>
                      </td>
                    </tr>

                    <!-- Urgência -->
                    <tr>
                      <td style="font-size: 14px; color: #888888; padding-bottom: 20px; text-align: center; font-style: italic;">
                        Este link expira em 48 horas - garanta seus benefícios hoje mesmo!
                      </td>
                    </tr>

                    <!-- Dúvidas -->
                    <tr>
                      <td style="font-size: 14px; color: #888888; padding-bottom: 30px; text-align: center; border-top: 1px solid #eeeeee; padding-top: 20px;">
                        Se precisar de ajuda, responda este e-mail ou fale com nosso time:<br>
                        <a href="mailto:suporte@tedie.com.br" style="color: #FDB612;">suporte@tedie.com.br</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>
        </body>
        </html>`
        };
        
        await sgMail.send(msg);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Usuário criado e e-mail enviado com sucesso!',
            user 
          }),
          { status: 200, headers }
        );
      } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        
        return new Response(
          JSON.stringify({ 
            success: true,
            warning: 'Usuário criado mas e-mail não enviado',
            user,
            error: error.message 
          }),
          { status: 200, headers }
        );
      }
    }

    return new Response(JSON.stringify({ status: "success", user }), { 
      status: 200, 
      headers 
    });
  } catch (error) {
    console.error("Erro ao processar usuário:", error);
    return new Response(JSON.stringify({ 
      message: "Erro ao processar usuário",
      error: error.message 
    }), { 
      status: 500, 
      headers 
    });
  }
}

export async function OPTIONS() {
  return new Response(null, { 
    status: 204, 
    headers 
  });
}