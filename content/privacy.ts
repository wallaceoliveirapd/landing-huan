export const PRIVACY_MD = `## Política de privacidade

**Última atualização:** 16 de maio de 2026

Esta Política de Privacidade descreve como **HUAN GOMES DA SILVA SOUZA FALCAO - ME**, CNPJ 55.181.469/0001-66, João Pessoa — PB ("NordestAI", "HUAN", "nós"), controlador dos dados, coleta, usa, compartilha e protege seus dados pessoais ao operar a plataforma disponível em huanfalcao.com.br, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei 13.709/2018 — LGPD).

---

### 1. Identificação do controlador

**Razão social:** HUAN GOMES DA SILVA SOUZA FALCAO - ME
**CNPJ:** 55.181.469/0001-66
**Município:** João Pessoa — PB
**Serviço:** NordestAI / HUAN (huanfalcao.com.br)
**E-mail de contato e encarregado de dados (DPO):** suporte@huanfalcao.com.br

---

### 2. Dados que coletamos

**2.1 Dados fornecidos diretamente por você**

- Nome completo
- Endereço de e-mail
- Número de WhatsApp
- Senha (armazenada exclusivamente como hash criptográfico — nunca em texto)
- Número de telefone (opcional)
- Foto de perfil (opcional)
- Avaliações e comentários sobre restaurantes
- Reações em publicações do blog (curtida, amor, uau, fogo)
- Conteúdo das mensagens enviadas ao chat com a Zéca (agente de IA)
- Dados de planejamento de viagem: destino, coordenadas, tipo de viagem, duração, tamanho do grupo, orçamento, notas e roteiro gerado
- Motivo e feedback ao excluir a conta

**2.2 Dados coletados automaticamente**

- **Endereço IP:** coletado a cada acesso, conforme obrigação legal prevista no Art. 15 do Marco Civil da Internet (Lei 12.965/2014)
- **Dados de dispositivo:** tipo de dispositivo, sistema operacional, navegador, versão do navegador e agente de usuário (user agent)
- **Registros de acesso:** data, horário e origem de cada conexão, mantidos por no mínimo 6 meses
- **Dados comportamentais e de navegação:** páginas visitadas, tempo de sessão, cliques em cards, abertura de bottom sheets, interações com cupons, cliques em passeios e restaurantes, prompts sugeridos utilizados — coletados via Google Tag Manager e Meta Pixel
- **Dados de localização aproximada:** inferidos pelo IP, processados pelo Mapbox para exibição de mapas
- **Dados de sessão:** tokens de autenticação em cookies HttpOnly (não acessíveis por JavaScript)
- **Armazenamento local (localStorage):** histórico de conversa com a Zéca, registro de descarte de solicitação de push (janela de 23 horas) e controle de primeira visita a páginas específicas

**2.3 Dados de notificações push**

Caso você opte por receber notificações push, coletamos:

- Endpoint de assinatura de push (URL única do seu navegador/dispositivo)
- Chave de criptografia p256dh
- Chave de autenticação auth
- Agente de usuário do dispositivo (opcional)
- Data de criação da assinatura

---

### 3. Por que coletamos e qual a base legal

| Dado / Finalidade | Base legal (LGPD Art. 7) |
|---|---|
| Nome, e-mail, WhatsApp, senha — criação e autenticação de conta | Execução de contrato — Art. 7, V |
| Código OTP por e-mail — verificação de identidade | Execução de contrato — Art. 7, V |
| Dados de viagem, favoritos, roteiro gerado — serviço principal | Execução de contrato — Art. 7, V |
| Mensagens no chat — operação do agente de IA Zéca | Execução de contrato — Art. 7, V |
| Geração de roteiro por IA (Google Gemini) — planejamento | Execução de contrato — Art. 7, V |
| Avaliações de restaurantes e reações em blog | Legítimo interesse — Art. 7, IX |
| Registros de acesso (IP, horário) — obrigação legal Marco Civil | Obrigação legal — Art. 7, II |
| Notificações push — comunicação de novidades e viagens | Consentimento — Art. 7, I |
| Analytics (GTM, Meta Pixel) — análise de uso | Consentimento — Art. 7, I |
| Geolocalização aproximada via Mapbox — exibição de mapas | Legítimo interesse — Art. 7, IX |
| Eventos de webhook (n8n) — operação interna | Legítimo interesse — Art. 7, IX |
| Snapshot de exclusão de conta — análise de produto | Legítimo interesse — Art. 7, IX |
| E-mails transacionais (boas-vindas, OTP, viagens) | Execução de contrato — Art. 7, V |

---

### 4. Compartilhamento com terceiros

Não vendemos seus dados pessoais. Compartilhamos apenas o necessário para operar o serviço:

| Terceiro | País | Dados compartilhados | Finalidade |
|---|---|---|---|
| **Convex** | EUA | Todos os dados de conta e atividade | Banco de dados e backend |
| **Resend** | EUA | Nome e e-mail | Envio de e-mails transacionais |
| **Groq** | EUA | Mensagens do chat | Processamento de linguagem natural (Zéca) |
| **Google Gemini** | EUA | Dados da viagem e preferências | Geração de roteiros por IA |
| **Google (GTM / Analytics)** | EUA | Dados comportamentais e de navegação | Análise de uso |
| **Meta (Facebook Pixel)** | EUA | Dados comportamentais, IP, eventos | Análise e publicidade |
| **Mapbox** | EUA | IP e localização aproximada | Exibição de mapas interativos |
| **Cloudflare R2** | EUA | Arquivos de mídia (imagens) | Armazenamento de arquivos |
| **n8n** | Variável | E-mail, nome, evento de cadastro | Automações internas |
| **Web Push API (VAPID)** | Variável | Endpoint e chaves de criptografia | Envio de notificações push |

---

### 5. Transferências internacionais de dados

Os terceiros listados estão sediados nos Estados Unidos. A transferência ocorre com base no consentimento do titular (Art. 33, VIII) e/ou na execução de contrato (Art. 33, IX da LGPD), sendo necessária para a prestação do serviço. Adotamos cláusulas contratuais com nossos fornecedores para garantir nível de proteção equivalente ao exigido pela LGPD, conforme Resolução CD/ANPD nº 19/2024.

---

### 6. Cookies e tecnologias similares

**Cookies estritamente necessários** (sem consentimento — essenciais ao funcionamento):

- **Cookie de sessão (HttpOnly):** mantém você autenticado; gerenciado pelo Convex Auth; não acessível por JavaScript

**Armazenamento local (localStorage) — necessário para o serviço:**

- Histórico de conversa com a Zéca
- Controle de exibição do convite de push (janela de 23 horas)
- Flags de primeira visita por página

**Tecnologias de terceiros (sujeitas ao seu consentimento):**

- **Google Tag Manager / Analytics:** coleta dados comportamentais; você pode recusar via configurações do navegador ou pelo opt-out do Google Analytics
- **Meta Pixel:** registra eventos de interação; você pode gerenciar via Configurações de privacidade do Facebook

---

### 7. Notificações push

- **Consentimento:** solicitado separadamente; você pode recusar sem perder acesso ao serviço
- **Revogação:** a qualquer momento via configurações do navegador (Configurações > Privacidade > Notificações) ou pelo seu perfil no app
- **Impacto da recusa:** você não receberá notificações; todas as demais funcionalidades permanecem disponíveis

---

### 8. Retenção dos dados

| Categoria | Período de retenção |
|---|---|
| Dados de conta ativa | Enquanto a conta existir |
| Dados de viagem, favoritos, avaliações, reações | Excluídos imediatamente com a conta |
| Registros de acesso (IP, logs) | Mínimo 6 meses (Marco Civil da Internet, Art. 15) |
| Snapshot de exclusão de conta | Retido anonimamente para análise de produto |
| Códigos OTP | 10 minutos (expiração automática) |
| Cache de lugares (OpenStreetMap) | 7 dias |
| Assinaturas de push | Até falha de entrega (erro 410) ou revogação |
| Logs de webhook | Até 5 anos |
| Tokens de sessão | Duração da sessão |

---

### 9. Segurança

- Senhas armazenadas com hash criptográfico (nunca em texto simples)
- Comunicação via HTTPS/TLS em todas as conexões
- Cookies de sessão com flag HttpOnly
- URLs de upload com expiração (presigned URLs)
- Autenticação HMAC-SHA256 nos webhooks
- Chaves VAPID para assinatura e criptografia de push
- Controle de acesso por papéis no backend (admin/customer)

Em caso de incidente de segurança com risco relevante, notificaremos a ANPD e os titulares afetados conforme o Art. 48 da LGPD.

---

### 10. Dados sensíveis

Não coletamos intencionalmente dados sensíveis conforme o Art. 5, II da LGPD (origem racial ou étnica, convicção religiosa, saúde, vida sexual, dados genéticos ou biométricos). Se identificarmos que dados sensíveis foram fornecidos acidentalmente, os excluiremos.

---

### 11. Menores de idade

O serviço é destinado **exclusivamente a maiores de 18 anos**. Não coletamos dados de crianças ou adolescentes. Contas identificadas como pertencentes a menores serão encerradas e os dados excluídos.

---

### 12. Seus direitos como titular (Art. 18, LGPD)

Você pode exercer os seguintes direitos a qualquer momento pelo e-mail **suporte@huanfalcao.com.br**:

- **I — Confirmação:** saber se tratamos seus dados pessoais
- **II — Acesso:** obter cópia dos seus dados
- **III — Correção:** corrigir dados incompletos, inexatos ou desatualizados
- **IV — Anonimização, bloqueio ou eliminação:** de dados desnecessários ou tratados em desconformidade com a LGPD
- **V — Portabilidade:** receber seus dados em formato estruturado para transferência a outro serviço
- **VI — Eliminação:** exclusão dos dados tratados com base no consentimento, mediante revogação (também em Perfil > Excluir conta)
- **VII — Informação sobre compartilhamento:** saber com quais entidades compartilhamos seus dados
- **VIII — Informação sobre não consentimento:** ser informado sobre as consequências de não fornecer consentimento
- **IX — Revogação do consentimento:** revogar a qualquer momento, de forma gratuita e simplificada, sem prejuízo da licitude do tratamento anterior
- **X — Revisão de decisões automatizadas:** solicitar revisão humana de decisões tomadas exclusivamente por meios automatizados (Art. 20)

Responderemos em até **15 dias úteis**.

---

### 13. Contato com a ANPD

Se não obtiver resposta satisfatória do nosso encarregado, você pode registrar petição ou denúncia diretamente na Autoridade Nacional de Proteção de Dados: **www.gov.br/anpd**

---

### 14. Encarregado de dados (DPO)

**Razão social:** HUAN GOMES DA SILVA SOUZA FALCAO - ME
**E-mail:** suporte@huanfalcao.com.br

---

### 15. Alterações nesta política

Mudanças relevantes serão comunicadas por e-mail e/ou aviso na plataforma com antecedência mínima de 7 dias. A data de vigência consta no topo deste documento.

---

### 16. Lei aplicável

Esta política é regida pela legislação brasileira, em especial pela Lei 13.709/2018 (LGPD) e pela Lei 12.965/2014 (Marco Civil da Internet). Fica eleito o foro da Comarca de João Pessoa, Paraíba.
`;
