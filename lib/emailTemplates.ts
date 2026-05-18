/**
 * HTML email templates. Table-based layout for maximum email client compat.
 * All colors forced via inline styles + bgcolor attributes to resist dark mode.
 * Structure matches Figma: yellow header + white body + #f2f4f5 footer.
 */

const SITE_URL = "https://huanfalcao.com.br";
const IMG_AVATAR = `${SITE_URL}/images/email/avatar-email.png`;
const IMG_BG_HEADER = `${SITE_URL}/images/email/background-header.png`;

// No CSS vars — email clients don't support custom properties
const C = {
  brand: "#F9FD17",
  ink: "#323439",
  muted: "#565a60",
  light: "#f2f4f5",
  border: "#dde1e8",
  white: "#ffffff",
};

// Escape & in href attributes (Outlook Word renderer treats bare & as entity)
function hrefAttr(url: string): string {
  return url.replace(/&/g, "&amp;");
}

function firstNameOf(name?: string): string {
  return name?.split(" ")[0] ?? "";
}

// ── Content block helpers ───────────────────────────────────────────────────

function titleHtml(text: string): string {
  return `<p style="font-size:24px;font-weight:600;line-height:1.2;color:${C.ink};margin:0 0 20px;">${text}</p>`;
}

function paraHtml(text: string, extraStyle = ""): string {
  return `<p style="font-size:16px;line-height:1.5;color:${C.ink};margin:0 0 20px;${extraStyle}">${text}</p>`;
}

function btnHtml(label: string, url: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 20px;">
  <tr>
    <td>
      <a href="${hrefAttr(url)}" style="display:block;background-color:${C.ink};color:${C.white};text-decoration:none;font-size:16px;font-weight:600;padding:16px 24px;border-radius:99px;text-align:center;line-height:1.2;">${label}</a>
    </td>
  </tr>
</table>`;
}

function codeBoxHtml(code: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 20px;">
  <tr>
    <td bgcolor="${C.light}" align="center" style="background-color:${C.light};border-radius:24px;padding:32px;">
      <span style="font-family:'Courier New',Courier,monospace;font-size:40px;font-weight:600;letter-spacing:20px;color:${C.ink};">${code}</span>
    </td>
  </tr>
</table>`;
}

function dividerHtml(marginBottom = "16px"): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 ${marginBottom};">
  <tr><td style="border-top:1px solid ${C.border};height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
</table>`;
}

function benefitHtml(emoji: string, title: string, desc: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px;">
  <tr>
    <td style="padding-right:12px;vertical-align:top;width:50px;">
      <table cellspacing="0" cellpadding="0" border="0">
        <tr><td bgcolor="${C.light}" align="center" style="background-color:${C.light};border-radius:50%;width:50px;height:50px;font-size:20px;text-align:center;line-height:50px;">${emoji}</td></tr>
      </table>
    </td>
    <td style="vertical-align:top;">
      <p style="font-size:16px;font-weight:600;color:${C.ink};margin:0 0 4px;">${title}</p>
      <p style="font-size:16px;color:${C.ink};margin:0;">${desc}</p>
    </td>
  </tr>
</table>`;
}

function infoBoxHtml(label: string, value: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 20px;">
  <tr>
    <td bgcolor="${C.light}" style="background-color:${C.light};border-radius:16px;padding:20px;">
      <p style="font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:${C.muted};margin:0 0 4px;">${label}</p>
      <p style="font-size:18px;font-weight:600;color:${C.ink};margin:0;">${value}</p>
    </td>
  </tr>
</table>`;
}

// ── Base layout ─────────────────────────────────────────────────────────────

function baseLayout(opts: {
  title: string;
  preview: string;
  name?: string;
  body: string;
  signOff?: string;
  footerNote?: string;
}): string {
  const signOff = opts.signOff ?? "Abraço,";
  const footerNote = opts.footerNote ?? "Você recebeu este email porque criou uma conta no huanfalcao.com.br.";
  const f = firstNameOf(opts.name);
  const greeting = f ? `Oi, ${f}` : "Oi";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${opts.title}</title>
<style>
  :root { color-scheme: light; }
  @media (prefers-color-scheme: dark) {
    .ew  { background-color: ${C.white} !important; }
    .eb  { background-color: ${C.white} !important; color: ${C.ink} !important; }
    .ef  { background-color: ${C.light} !important; }
    .et  { color: ${C.ink} !important; }
    .em  { color: ${C.muted} !important; }
  }
</style>
</head>
<body class="ew" style="margin:0;padding:0;background-color:${C.white};color-scheme:light;-webkit-text-size-adjust:100%;">
<div style="display:none;font-size:1px;color:${C.white};line-height:1px;max-height:0;overflow:hidden;">${opts.preview}</div>

<table role="presentation" class="ew" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="${C.white}" style="background-color:${C.white};">
  <tr>
    <td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;">

        <!-- ── Header: yellow bg + avatar + greeting ── -->
        <tr>
          <td bgcolor="${C.brand}" style="background-color:${C.brand};background-image:url(${IMG_BG_HEADER});background-size:cover;background-position:center top;padding:32px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding-right:16px;vertical-align:middle;">
                  <img src="${IMG_AVATAR}" alt="Huan" width="90" height="90" style="display:block;width:90px;height:90px;border-radius:50%;object-fit:cover;">
                </td>
                <td style="vertical-align:middle;">
                  <p class="et" style="font-size:32px;font-weight:700;color:${C.ink} !important;margin:0 0 11px;line-height:1.1;"><font color="${C.ink}">${greeting}</font></p>
                  <p class="et" style="font-size:18px;font-weight:400;color:${C.ink} !important;margin:0;line-height:1.2;"><font color="${C.ink}">Sou o Huan, tudo bem?</font></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Body: white ── -->
        <tr>
          <td class="eb" bgcolor="${C.white}" style="background-color:${C.white};padding:32px;color:${C.ink};">
            ${opts.body}
          </td>
        </tr>

        <!-- ── Sign-off ── -->
        <tr>
          <td class="eb" bgcolor="${C.white}" style="background-color:${C.white};padding:0 32px 32px;">
            <p class="et" style="font-size:16px;color:${C.ink};margin:0 0 4px;">${signOff}</p>
            <p class="et" style="font-size:16px;font-weight:700;color:${C.ink};margin:0;">Huan</p>
          </td>
        </tr>

        <!-- ── Footer: neutral-100 ── -->
        <tr>
          <td class="ef" bgcolor="${C.light}" style="background-color:${C.light};padding:32px;">
            <p class="em" style="font-size:12px;color:${C.muted};margin:0 0 16px;line-height:1.5;">${footerNote}</p>
            ${dividerHtml("16px")}
            <p class="em" style="font-size:12px;font-weight:700;color:${C.muted};margin:0 0 8px;">Precisa de ajuda?</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="padding-bottom:8px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="padding-right:8px;vertical-align:middle;">
                        <table cellspacing="0" cellpadding="0" border="0">
                          <tr><td bgcolor="${C.border}" align="center" style="background-color:${C.border};border-radius:50%;width:20px;height:20px;font-size:10px;text-align:center;line-height:20px;">📞</td></tr>
                        </table>
                      </td>
                      <td style="font-size:14px;font-weight:600;color:${C.ink} !important;vertical-align:middle;">(83) 99122-5756</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="padding-right:8px;vertical-align:middle;">
                        <table cellspacing="0" cellpadding="0" border="0">
                          <tr><td bgcolor="${C.border}" align="center" style="background-color:${C.border};border-radius:50%;width:20px;height:20px;font-size:10px;text-align:center;line-height:20px;">✉️</td></tr>
                        </table>
                      </td>
                      <td style="font-size:14px;font-weight:600;color:${C.ink} !important;vertical-align:middle;">suporte@huanfalcao.com.br</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ── Individual email templates ──────────────────────────────────────────────

export function welcomeEmail({ name }: { name?: string }) {
  const f = firstNameOf(name);
  return {
    subject: f
      ? `${f}, bem-vindo ao meu cantinho do Nordeste`
      : "Bem-vindo ao meu cantinho do Nordeste",
    html: baseLayout({
      title: "Bem-vindo",
      preview: "Que bom ter você por aqui. Bora planejar sua viagem?",
      name,
      body: `
        ${titleHtml("Que bom ter você aqui!")}
        ${paraHtml("Aqui é o Huan, criador da plataforma. Que bom que você criou sua conta — é o meu jeito de te ajudar a explorar o Nordeste do mesmo jeito que eu exploro: com calma, indo nos lugares certos e curtindo cada momento.")}
        ${benefitHtml("🗺️", "Roteiros personalizados", "Crie até 3 roteiros completos. O Huan monta com você.")}
        ${dividerHtml()}
        ${benefitHtml("🏖️", "Lugares testados por mim", "Passeios, restaurantes e praias que eu curei pessoalmente.")}
        ${dividerHtml()}
        ${benefitHtml("🎫", "Cupons exclusivos", "Descontos que eu negociei com parceiros da região.")}
        ${dividerHtml("20px")}
        ${btnHtml("Bora montar a primeira viagem", `${SITE_URL}/minha-viagem/criar`)}
        ${paraHtml("Se quiser bater um papo direto comigo, é só responder este email — eu leio todos.", `color:${C.muted};font-size:14px;`)}
      `,
    }),
  };
}

export function otpEmail({ code, ttlMinutes = 10 }: { code: string; ttlMinutes?: number }) {
  return {
    subject: `${code} é seu código no huanfalcao.com.br`,
    html: baseLayout({
      title: "Seu código de verificação",
      preview: `${code} é o código pra confirmar seu email.`,
      signOff: "Até já,",
      footerNote: "Você recebeu este email porque alguém tentou criar uma conta com seu email no huanfalcao.com.br.",
      body: `
        ${titleHtml("Confirma seu email")}
        ${paraHtml(`É só usar o código abaixo pra concluir seu cadastro. Ele expira em <strong>${ttlMinutes} minutos</strong>.`)}
        ${codeBoxHtml(code)}
        ${paraHtml("Se não foi você que pediu este código, pode ignorar — sua conta segue segura.", `color:${C.muted};font-size:13px;`)}
      `,
    }),
  };
}

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
      footerNote: "Você recebeu este email porque alguém pediu pra trocar a senha de uma conta no huanfalcao.com.br associada a este email.",
      body: `
        ${titleHtml("Troca de senha")}
        ${paraHtml(`Recebi um pedido pra trocar a senha da sua conta. Use o código abaixo pra confirmar. Ele expira em <strong>${ttlMinutes} minutos</strong>.`)}
        ${codeBoxHtml(code)}
        ${paraHtml("Se você não pediu essa troca, ignora esse email — sua senha atual continua valendo.", `color:${C.muted};font-size:13px;`)}
      `,
    }),
  };
}

export function passwordResetRequestedEmail({
  name,
  resetUrl,
}: {
  name?: string;
  resetUrl: string;
}) {
  return {
    subject: "Link pra redefinir sua senha",
    html: baseLayout({
      title: "Redefinir senha",
      preview: "Clique pra escolher uma senha nova.",
      name,
      signOff: "Qualquer dúvida tô por aqui,",
      footerNote: "Você recebeu este email porque alguém pediu pra redefinir a senha da sua conta no huanfalcao.com.br.",
      body: `
        ${titleHtml("Redefinir senha")}
        ${paraHtml("Recebi um pedido pra redefinir a senha da sua conta. Clique no botão abaixo — vou te mandar um código por email pra confirmar a troca.")}
        ${btnHtml("Redefinir senha", resetUrl)}
        ${paraHtml("Se você não pediu essa redefinição, pode ignorar este email — sua senha atual continua valendo.", `color:${C.muted};font-size:13px;`)}
      `,
    }),
  };
}

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
  return {
    subject: `Teu roteiro de ${destination} tá pronto`,
    html: baseLayout({
      title: "Seu roteiro está pronto",
      preview: `Montei teu roteiro de ${destination}. Vem ver!`,
      name,
      body: `
        ${titleHtml(`Teu roteiro de ${destination} tá pronto`)}
        ${paraHtml("Acabei de montar pra você um roteiro completo. O Huan pegou os lugares que eu testei e curei pessoalmente e montou dias bem aproveitados. Dá uma olhada e me conta se preciso ajustar:")}
        ${infoBoxHtml("Sua viagem", tripTitle)}
        ${btnHtml("Ver meu roteiro", tripUrl)}
        ${paraHtml("Se mudar de ideia sobre o destino, o estilo ou a duração, é só refazer pelo botão no detalhe — o Huan monta de novo.", `color:${C.muted};font-size:14px;`)}
      `,
    }),
  };
}

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
        ${titleHtml(headline)}
        <div style="font-size:16px;line-height:1.6;color:${C.ink};margin:0 0 20px;">${body}</div>
        ${ctaUrl && ctaLabel ? btnHtml(ctaLabel, ctaUrl) : ""}
      `,
    }),
  };
}

export function tripWeekBeforeEmail({
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
  return {
    subject: `Falta 1 semana pra sua viagem a ${destination}`,
    html: baseLayout({
      title: "Falta 1 semana",
      preview: `Sua viagem a ${destination} é semana que vem. Bora se organizar?`,
      name,
      body: `
        ${titleHtml(`Falta 1 semana pra ${destination}!`)}
        ${paraHtml(`Sua viagem <strong>${tripTitle}</strong> pra <strong>${destination}</strong> está chegando! Faltam só 7 dias pra você embarcar. Bora começar a organizar?`)}
        ${paraHtml("Dá uma olhada no roteiro, ajusta o que quiser, e me chama no chat se quiser dicas extras sobre o destino.")}
        ${btnHtml("Ver minha viagem", tripUrl)}
        ${paraHtml("Quer falar comigo? Abre o app e clica no botão amarelo do Huan, eu respondo na hora.", `color:${C.muted};font-size:14px;`)}
      `,
    }),
  };
}

export function tripWeatherUpdateEmail({
  name,
  tripTitle,
  destination,
  tripUrl,
  tempMax,
  tempMin,
}: {
  name?: string;
  tripTitle: string;
  destination: string;
  tripUrl: string;
  tempMax: number | null;
  tempMin: number | null;
}) {
  const tempLine =
    tempMax !== null && tempMin !== null
      ? `A previsão indica entre <strong>${tempMin}°</strong> e <strong>${tempMax}°</strong> nos dias da viagem.`
      : "Já dá pra ver a previsão real direto no app.";
  return {
    subject: `Previsão pra ${destination} já chegou`,
    html: baseLayout({
      title: "Previsão atualizada",
      preview: `Agora temos a previsão real pra sua viagem a ${destination}.`,
      name,
      body: `
        ${titleHtml(`Previsão de ${destination} atualizada`)}
        ${paraHtml(`Sua viagem <strong>${tripTitle}</strong> pra <strong>${destination}</strong> entrou na janela de previsão real (até 16 dias). Antes a gente mostrava a média histórica — agora é tempo real.`)}
        ${paraHtml(tempLine)}
        ${btnHtml("Ver previsão atualizada", tripUrl)}
        ${paraHtml("Quer ajustar o roteiro com base no clima? Me chama no chat, eu te ajudo.", `color:${C.muted};font-size:14px;`)}
      `,
    }),
  };
}

export function tripChecklistEmail({
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
  const f = firstNameOf(name);
  return {
    subject: `Checklist pra sua viagem amanhã, ${destination}`,
    html: baseLayout({
      title: "Checklist da viagem",
      preview: `Amanhã é dia! Checklist rápido pra sua viagem a ${destination}.`,
      name,
      body: `
        ${titleHtml(f ? `Amanhã é dia, ${f}!` : "Amanhã é dia!")}
        ${paraHtml(`Sua viagem <strong>${tripTitle}</strong> pra <strong>${destination}</strong> começa amanhã. Separei um checklist rápido pra você não esquecer nada:`)}
        ${benefitHtml("🪪", "Documento com foto", "RG ou CNH — não esqueça!")}
        ${dividerHtml()}
        ${benefitHtml("💳", "Dinheiro + cartão", "Cartão de crédito e um troco em espécie.")}
        ${dividerHtml()}
        ${benefitHtml("🔋", "Carregador e cabo", "Celular com bateria é essencial.")}
        ${dividerHtml()}
        ${benefitHtml("☀️", "Protetor solar + repelente", "Especialmente pra praia e trilhas.")}
        ${dividerHtml("20px")}
        ${btnHtml("Ver detalhes da viagem", tripUrl)}
        ${paraHtml("Dúvida de última hora? Me chama no chat do app, eu respondo na hora.", `color:${C.muted};font-size:14px;`)}
      `,
    }),
  };
}
