import sgMail from "@sendgrid/mail";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const headers = {
  "Access-Control-Allow-Origin": "https://www.tedie.com.br",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

// Método OPTIONS para CORS pré-via
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers,
  });
}

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "E-mail é obrigatório" }),
        { status: 400, headers }
      );
    }

    const user = await prisma.usuarios.findUnique({
      where: { email },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1h

    // Remove tokens anteriores
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    // Salva novo token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    const resetLink = `https://www.tedie.com.br/nova-senha?token=${token}`;

    if (user) {
      const msg = {
        to: email,
        from: "caiocunha@w7agencia.com.br",
        subject: "Tedie - Redefinição de Senha",
        text: `Clique no link para redefinir sua senha: ${resetLink}`,
        html: `
          <div>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f9f9; padding: 20px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; padding: 40px; font-family: Arial, sans-serif; color: #333333;">
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <img src="https://tedie.vercel.app/logos/Urso_Tedie.png" alt="Tedie!" width="120" />
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="font-size: 24px; font-weight: bold; padding-bottom: 20px;">
                        Redefina sua senha
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size: 16px; line-height: 24px; padding-bottom: 30px; text-align: center">
                        Recebemos uma solicitação para redefinir sua senha.<br>
                        Clique no botão abaixo para criar uma nova senha:
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-bottom: 30px;">
                        <a href="${resetLink}" style="background-color: #FDB612; color: #ffffff; text-decoration: none; padding: 12px 20px; font-size: 16px; border-radius: 4px; display: inline-block;">
                          Redefinir Senha
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size: 14px; color: #888888; padding-bottom: 30px; text-align: center">
                        Se você não solicitou essa alteração, pode ignorar este e-mail.
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
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Erro ao enviar e-mail:", {
      message: error.message,
      code: error.code,
      response: error.response?.body,
    });

    return new Response(
      JSON.stringify({
        error: "Falha ao enviar e-mail",
        details: error.response?.body || error.message,
      }),
      { status: 500, headers }
    );
  } finally {
    await prisma.$disconnect();
  }
}
