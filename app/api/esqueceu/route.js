import sgMail from "@sendgrid/mail";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "E-mail é obrigatório" }), {
        status: 400,
      });
    }

    // 🔒 Tenta encontrar o usuário — mas não retorna erro se não achar
    const user = await prisma.usuarios.findUnique({
      where: { email },
    });

    if (user) {
      const resetLink = `https://tedie.com.br/newpass?email=${email}`;

      const msg = {
        to: email,
        from: "caiocunha@w7agencia.com.br",
        subject: "Tedie - Redefinição de Senha",
        text: `Clique no link para redefinir sua senha: ${resetLink}`,
        html: `...seu HTML aqui...`, // usa o mesmo HTML que você já tem
      };

      await sgMail.send(msg);
    }

    // ✅ Sempre retorna sucesso, mesmo que o e-mail não exista
    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
      }),
      { status: 200 }
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
      { status: 500 }
    );
  }
}
