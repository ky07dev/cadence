/**
 * =========================================================================
 * SCRIPT DE TESTE DE ENVIO DE EMAIL TRANSACIONAL — CADENCE
 * 
 * Executa o envio de um email de teste com o link da proposta.
 * Uso:
 *   npm run test:email -- someone@example.com
 * =========================================================================
 */

import dotenv from 'dotenv';
dotenv.config();

import { sendProposalEmail, ProposalEmailPayload } from './emailService';

async function main() {
  console.log('\n======================================================================');
  console.log(' CADENCE — TESTE DE ENVIO DE EMAIL TRANSACIONAL DE PROPOSTA');
  console.log('======================================================================\n');

  // 1. Extração do email de destino (argumento CLI ou fallback)
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  const cliEmail = args[0]?.trim();
  const targetEmail = cliEmail || 'cliente@exemplo.pt';

  console.log(`Destinatário selecionado: "${targetEmail}"`);

  // 2. Verificação de credenciais ativas
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  console.log('Provedor de Email Detetado:');
  console.log(`  • Resend API: ${hasResend ? 'Configurado (RESEND_API_KEY)' : 'Não configurado'}`);
  console.log(`  • SMTP Nodemailer: ${hasSmtp ? 'Configurado (SMTP_HOST)' : 'Não configurado'}`);
  console.log(`  • Remetente (FROM): ${process.env.EMAIL_FROM || 'Cadence <onboarding@resend.dev>'}\n`);

  // 3. Montagem dos dados de teste
  const samplePayload: ProposalEmailPayload = {
    customerName: 'Ester Pedrosa',
    customerEmail: targetEmail,
    proposalUrl:
      'https://ais-dev-in74og26niqc4vhdp563pi-904383926429.europe-west2.run.app/proposta/67361d38316fc105b20f1397dd7857f5e547f0c296ff2c3d',
    planName: 'Team',
    totalFormatted: '968.01 €',
    billingCycle: 'yearly',
    seats: 12,
    validityDays: 15,
  };

  try {
    console.log(`A disparar email para ${targetEmail}...`);
    const result = await sendProposalEmail(samplePayload);

    console.log('\n✅ SUCESSO: Email transacional aceite pelo provedor!');
    console.log(`   - Provedor: ${result.provider.toUpperCase()}`);
    console.log(`   - Destinatário: ${result.recipient}`);
    console.log(`   - ID da Mensagem: ${result.messageId}\n`);
  } catch (err: any) {
    console.error('\n❌ ERRO NO DISPARO DO EMAIL:', err?.message || err);
    console.log('\nPara enviar emails reais com entrega na Caixa de Entrada (Inbox), adiciona as credenciais no .env:');
    console.log('   Opção A (Resend): RESEND_API_KEY="re_..."');
    console.log('   Opção B (SMTP):   SMTP_HOST="smtp.gmail.com" SMTP_USER="..." SMTP_PASS="..."');
  }

  // 4. Checklist de Verificação de Entrega (Gmail & Outlook)
  printDeliveryChecklist();
}

function printDeliveryChecklist() {
  console.log('======================================================================');
  console.log(' CHECKLIST DE ENTREGA NA CAIXA DE ENTRADA (GMAIL & OUTLOOK)');
  console.log('======================================================================');
  console.log(`
1. VERIFICAÇÃO NO GMAIL (Web & Mobile):
   [ ] Abre o email recebido em https://mail.google.com.
   [ ] Verifica se caiu na "Caixa de Entrada" (Principal) e não no "Spam" ou "Promoções".
   [ ] Clica nos 3 pontos verticais (canto superior direito) > "Mostrar original".
   [ ] Confirma as 3 marcas de aprovação do Google:
       • SPF:   PASS com o IP do remetente
       • DKIM:  PASS com o domínio de envio
       • DMARC: PASS (p=reject ou p=none)
   [ ] Testa o botão "Aceder à Proposta Comercial" e o link direto visível.

2. VERIFICAÇÃO NO OUTLOOK / HOTMAIL / OFFICE 365:
   [ ] Abre a mensagem em https://outlook.live.com ou aplicação desktop.
   [ ] Verifica se o email chegou à pasta "Recetáculo de correio" / "Destaque" (Inbox).
   [ ] Se surgir aviso de remetente desconhecido, clica em "Ver detalhes do cabeçalho da mensagem":
       • Confirma: Authentication-Results: spf=pass; dkim=pass; dmarc=pass;
   [ ] Certifica-te de que as cores, botões e imagens SVG são renderizados sem quebras.

3. REQUISITOS CRÍTICOS DE DNS PARA EVITAR A PASTA DE SPAM:
   [ ] SPF:   Registo TXT no teu domínio apontando para o serviço de envio.
              Exemplo: "v=spf1 include:resend.com ~all"
   [ ] DKIM:  Registos CNAME/TXT fornecidos pelo provedor para assinar criptograficamente cada email.
   [ ] DMARC: Registo TXT no subdomínio _dmarc.oteudominio.com:
              Exemplo: "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@oteudominio.com"
   [ ] Alinhamento de Domínio (From Header):
       O cabeçalho "From" (ex: propostas@cadence.app) deve pertencer exatamente ao domínio configurado.
======================================================================\n`);
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
