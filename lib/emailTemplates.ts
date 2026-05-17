/**
 * HTML email templates for transactional emails. Kept inline (no JSX,
 * no MJML) so they work in Node + email clients without build steps.
 *
 * Brand voice: Huan Falcão (criador da plataforma) escrevendo direto pra
 * pessoa. Tom pessoal, em primeira pessoa, com assinatura no final.
 * NordestAI aparece como "meu agente" / "meu assistente".
 *
 * Brand colors: bg #ffffff, accent #F9FD17 (yellow), ink #323439,
 * subtle gray #72777f.
 */

const BRAND = {
  primary: "#F9FD17",
  ink: "#323439",
  muted: "#72777f",
  light: "#f2f4f5",
  border: "#dde1e8",
};

/**
 * Base email shell, header with Huan's name/photo placeholder, body slot,
 * Huan's signature, footer (legal links).
 */
function baseLayout(opts: {
  title: string;
  preview: string;
  body: string;
  signOff?: string; // defaults to "Um abraço,"
  footerNote?: string;
}): string {
  const signOff = opts.signOff ?? "Um abraço,";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${opts.title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
<!-- preview text (hidden) -->
<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${opts.preview}</div>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;width:100%;">
        <!-- Header, Huan branding -->
        <tr>
          <td style="padding-bottom:24px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td>
                  <div style="display:inline-block;width:44px;height:44px;border-radius:999px;background:${BRAND.primary};vertical-align:middle;text-align:center;line-height:44px;">
                    <span style="color:${BRAND.ink};font-weight:600;font-size:18px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">H</span>
                  </div>
                </td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <span style="font-size:16px;font-weight:600;color:${BRAND.ink};">Huan Falcão</span>
                  <br>
                  <span style="font-size:12px;color:${BRAND.muted};">Viajando o Nordeste com você</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td>${opts.body}</td>
        </tr>

        <!-- Sign-off -->
        <tr>
          <td style="padding-top:28px;">
            <p style="font-size:15px;line-height:1.6;margin:0 0 4px;color:${BRAND.ink};">${signOff}</p>
            <p style="font-size:15px;line-height:1.6;margin:0;color:${BRAND.ink};font-weight:600;">Huan</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:40px;border-top:1px solid ${BRAND.border};margin-top:32px;">
            <p style="font-size:12px;color:${BRAND.muted};line-height:1.55;margin:24px 0 0;">
              ${opts.footerNote ?? "Você recebeu este email porque criou uma conta no huanfalcao.com.br."}<br>
              <a href="https://huanfalcao.com.br" style="color:${BRAND.muted};text-decoration:underline;">huanfalcao.com.br</a>
              ·
              <a href="https://instagram.com/huanfalcao" style="color:${BRAND.muted};text-decoration:underline;">@huanfalcao</a>
              ·
              <a href="mailto:oi@huanfalcao.com.br" style="color:${BRAND.muted};text-decoration:underline;">oi@huanfalcao.com.br</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * Welcome email, Huan dando as boas-vindas pessoalmente.
 */
export function welcomeEmail({ name }: { name?: string }) {
  const firstName = name?.split(" ")[0];
  const greeting = firstName ? `Oi ${firstName}!` : "Oi! Tudo bem?";
  return {
    subject: firstName
      ? `${firstName}, bem-vindo ao meu cantinho do Nordeste`
      : "Bem-vindo ao meu cantinho do Nordeste",
    html: baseLayout({
      title: "Bem-vindo",
      preview: "Que bom ter você por aqui. Bora planejar sua viagem?",
      body: `
        <p style="font-size:18px;font-weight:600;line-height:1.4;margin:0 0 12px;color:${BRAND.ink};">${greeting}</p>
        <p style="font-size:15px;line-height:1.65;margin:0 0 18px;color:${BRAND.ink};">
          Aqui é o Huan, criador da plataforma. Que bom que você criou sua conta, é o meu jeito de te ajudar a explorar o Nordeste do mesmo jeito que eu exploro: com calma, indo nos lugares certos e curtindo cada momento.
        </p>
        <p style="font-size:15px;line-height:1.65;margin:0 0 18px;color:${BRAND.ink};">
          Aqui você pode:
        </p>
        <ul style="font-size:15px;line-height:1.8;margin:0 0 28px;padding-left:20px;color:${BRAND.ink};">
          <li>Criar até <strong>3 roteiros</strong> personalizados (eu treinei um assistente, o Huan, pra montar com você)</li>
          <li>Salvar passeios, restaurantes e praias que eu testei</li>
          <li>Usar cupons que eu negociei com parceiros</li>
          <li>Conversar com o Huan sobre qualquer dúvida</li>
        </ul>
        <p style="margin:0 0 28px;">
          <a href="https://huanfalcao.com.br/minha-viagem/criar"
             style="display:inline-block;background:${BRAND.ink};color:#ffffff;text-decoration:none;font-weight:500;font-size:15px;padding:14px 28px;border-radius:999px;">
            Bora montar a primeira viagem
          </a>
        </p>
        <p style="font-size:14px;line-height:1.6;margin:0 0 0;color:${BRAND.muted};">
          Se quiser bater um papo direto comigo, é só responder este email, eu leio todos.
        </p>
      `,
    }),
  };
}

/**
 * OTP code for email verification during signup.
 */
export function otpEmail({ code, ttlMinutes = 10 }: { code: string; ttlMinutes?: number }) {
  return {
    subject: `${code} é seu código no huanfalcao.com.br`,
    html: baseLayout({
      title: "Seu código de verificação",
      preview: `${code} é o código pra confirmar seu email.`,
      signOff: "Até já,",
      body: `
        <p style="font-size:18px;font-weight:600;line-height:1.4;margin:0 0 12px;color:${BRAND.ink};">Confirma seu email aí</p>
        <p style="font-size:15px;line-height:1.65;margin:0 0 24px;color:${BRAND.ink};">
          É só usar o código abaixo pra concluir seu cadastro. Ele expira em <strong>${ttlMinutes} minutos</strong>.
        </p>
        <div style="background:${BRAND.light};border-radius:16px;padding:24px;text-align:center;margin:0 0 24px;">
          <span style="font-family:'SF Mono','Roboto Mono',Menlo,monospace;font-size:36px;font-weight:600;letter-spacing:8px;color:${BRAND.ink};">${code}</span>
        </div>
        <p style="font-size:13px;line-height:1.55;color:${BRAND.muted};margin:0 0 16px;">
          Se não foi você que pediu este código, pode ignorar, sua conta segue segura.
        </p>
      `,
      footerNote: "Você recebeu este email porque alguém tentou criar uma conta com seu email no huanfalcao.com.br.",
    }),
  };
}

/**
 * OTP code for password reset / change-password flow. Distinct copy so the
 * user knows it's about their password, not signup verification.
 */
export function passwordResetEmail({
  code,
  ttlMinutes = 10,
}: {
  code: string;
  ttlMinutes?: number;
}) {
  return {
    subject: `${code} é seu código pra trocar a senha`,
    html: baseLayout({
      title: "Trocar senha",
      preview: `${code} é o código pra confirmar a troca de senha.`,
      signOff: "Qualquer dúvida tô por aqui,",
      body: `
        <p style="font-size:18px;font-weight:600;line-height:1.4;margin:0 0 12px;color:${BRAND.ink};">Troca de senha</p>
        <p style="font-size:15px;line-height:1.65;margin:0 0 24px;color:${BRAND.ink};">
          Recebi um pedido pra trocar a senha da sua conta. Use o código abaixo pra confirmar. Ele expira em <strong>${ttlMinutes} minutos</strong>.
        </p>
        <div style="background:${BRAND.light};border-radius:16px;padding:24px;text-align:center;margin:0 0 24px;">
          <span style="font-family:'SF Mono','Roboto Mono',Menlo,monospace;font-size:36px;font-weight:600;letter-spacing:8px;color:${BRAND.ink};">${code}</span>
        </div>
        <p style="font-size:13px;line-height:1.55;color:${BRAND.muted};margin:0 0 16px;">
          Se você não pediu essa troca, ignora esse email, sua senha atual continua valendo.
        </p>
      `,
      footerNote: "Você recebeu este email porque alguém pediu pra trocar a senha de uma conta no huanfalcao.com.br associada a este email.",
    }),
  };
}

/**
 * Trip-created confirmation, Huan dizendo que o roteiro tá pronto.
 */
export function tripCreatedEmail({
  name,
  tripTitle,
  destination,
  tripUrl,
}: {
  name?: string;
  tripTitle: string;
  destination: string;
  tripUrl: string;
}) {
  const firstName = name?.split(" ")[0];
  const greeting = firstName ? `Ei ${firstName},` : "Ei,";
  return {
    subject: `Teu roteiro de ${destination} tá pronto`,
    html: baseLayout({
      title: "Seu roteiro está pronto",
      preview: `Montei teu roteiro de ${destination}. Vem ver!`,
      body: `
        <p style="font-size:18px;font-weight:600;line-height:1.4;margin:0 0 12px;color:${BRAND.ink};">${greeting}</p>
        <p style="font-size:15px;line-height:1.65;margin:0 0 22px;color:${BRAND.ink};">
          Acabei de montar pra você um roteiro em <strong>${destination}</strong>. O Huan pegou os lugares que eu testei e curei pessoalmente e juntou com pontos que existem na cidade pra montar dias proveitosos. Dá uma olhada e me conta se preciso ajustar:
        </p>
        <div style="background:${BRAND.light};border-radius:16px;padding:20px;margin:0 0 24px;">
          <p style="font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:${BRAND.muted};margin:0 0 4px;">Sua viagem</p>
          <p style="font-size:18px;font-weight:600;color:${BRAND.ink};margin:0;">${tripTitle}</p>
        </div>
        <p style="margin:0 0 28px;">
          <a href="${tripUrl}"
             style="display:inline-block;background:${BRAND.ink};color:#ffffff;text-decoration:none;font-weight:500;font-size:15px;padding:14px 28px;border-radius:999px;">
            Ver meu roteiro
          </a>
        </p>
        <p style="font-size:14px;line-height:1.6;margin:0;color:${BRAND.muted};">
          Se mudar de ideia sobre o destino, o estilo ou a duração, é só refazer pelo botão no detalhe, o Huan monta de novo.
        </p>
      `,
    }),
  };
}

/**
 * Generic broadcast email (admin tool, phase 5).
 */
export function broadcastEmail({
  headline,
  body,
  ctaLabel,
  ctaUrl,
}: {
  headline: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  return {
    subject: headline,
    html: baseLayout({
      title: headline,
      preview: headline,
      body: `
        <p style="font-size:18px;font-weight:600;line-height:1.4;margin:0 0 12px;color:${BRAND.ink};">${headline}</p>
        <div style="font-size:15px;line-height:1.7;color:${BRAND.ink};margin:0 0 24px;">${body}</div>
        ${
          ctaUrl && ctaLabel
            ? `<p style="margin:0 0 28px;">
                 <a href="${ctaUrl}" style="display:inline-block;background:${BRAND.ink};color:#ffffff;text-decoration:none;font-weight:500;font-size:15px;padding:14px 28px;border-radius:999px;">${ctaLabel}</a>
               </p>`
            : ""
        }
      `,
    }),
  };
}
