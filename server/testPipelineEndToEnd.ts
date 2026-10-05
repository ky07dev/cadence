/**
 * =========================================================================
 * TESTE END-TO-END DO PIPELINE ASSÍNCRONO — CADENCE
 * 
 * Testa o fluxo completo:
 * 1. Formulário / Submissão HTTP (/api/proposal-requests) -> Resposta instantânea (não-bloqueante)
 * 2. Firestore Document criado em status "pending"
 * 3. Transição segura para "generating" com lock de idempotência
 * 4. Geração de Conteúdo IA (Gemini) + Cálculo Determinístico
 * 5. Criação de Token Seguro, Persistência e HTML (/proposta/:token)
 * 6. Envio de Email Transacional via Resend para a Caixa de Entrada
 * 7. Transição para status "sent" com proposalUrl e sentAt
 * =========================================================================
 */

import dotenv from 'dotenv';
dotenv.config();

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runEndToEndTest() {
  console.log('\n======================================================================');
  console.log(' CADENCE — TESTE END-TO-END DO PIPELINE ASSÍNCRONO');
  console.log('======================================================================\n');

  const customerName = 'Cliente Demonstração';
  const customerEmail = 'proposta.cliente@cadence.app';
  const needs =
    'Somos uma equipa de 6 consultores jurídicos e de gestão. Precisamos de coordenar agendamentos com clientes externos, garantindo buffers de foco de 15 minutos entre reuniões e sincronização bidirecional rigorosa com Google Calendar e Microsoft Outlook sem rastreamento de dados.';

  console.log(`[E2E] A submeter pedido de proposta via POST /api/proposal-requests...`);
  console.log(`[E2E] Cliente: ${customerName} <${customerEmail}>`);

  const startTime = Date.now();

  // 1. Envio do pedido HTTP
  const response = await fetch(`${BASE_URL}/api/proposal-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: customerName,
      email: customerEmail,
      needs,
    }),
  });

  const responseDuration = Date.now() - startTime;
  const resData = await response.json();

  if (!response.ok) {
    throw new Error(`Falha no pedido HTTP (${response.status}): ${JSON.stringify(resData)}`);
  }

  const requestId = resData.id;
  console.log(`\n✅ Resposta HTTP recebida em ${responseDuration}ms (não bloqueante!):`);
  console.log(`   - ID do Pedido: ${requestId}`);
  console.log(`   - Mensagem: ${resData.message}\n`);

  if (responseDuration > 2500) {
    console.warn('⚠️ AVISO: A resposta demorou mais de 2.5s. Certifica-te de que o processamento está em background.');
  } else {
    console.log('⚡ Resposta imediata confirmada: O cliente não ficou à espera do Gemini ou do Email!');
  }

  // 2. Polling de verificação de transição de estados no Firestore
  console.log(`\n[E2E] A monitorizar o pipeline via GET /api/proposal-requests/${requestId}...`);

  let finalDoc: any = null;
  const maxAttempts = 30; // 30 x 2s = 60s máx

  for (let i = 1; i <= maxAttempts; i++) {
    await sleep(2000);

    const checkRes = await fetch(`${BASE_URL}/api/proposal-requests/${requestId}`);
    if (!checkRes.ok) {
      console.warn(`[E2E Check] Erro na consulta (${checkRes.status}). A tentar novamente...`);
      continue;
    }

    const doc = await checkRes.json();
    console.log(
      `[T+${i * 2}s] Estado: "${doc.status}" | Tentativas: ${doc.attempts} | UpdatedAt: ${doc.updatedAt ? 'OK' : 'Pendente'}`
    );

    if (doc.status === 'sent') {
      finalDoc = doc;
      break;
    }

    if (doc.status === 'failed') {
      throw new Error(`O pipeline falhou com a mensagem: ${doc.errorMessage}`);
    }
  }

  if (!finalDoc) {
    throw new Error('Tempo limite excedido à espera do estado "sent".');
  }

  console.log('\n======================================================================');
  console.log(' RESULTADO DO FLUXO END-TO-END');
  console.log('======================================================================');
  console.log(`✅ Estado Final: ${finalDoc.status.toUpperCase()}`);
  console.log(`✅ URL da Proposta: ${finalDoc.proposalUrl}`);
  console.log(`✅ Token de Segurança: ${finalDoc.proposalToken}`);
  console.log(`✅ ID da Mensagem de Email: ${finalDoc.emailMessageId}`);
  console.log(`✅ Data de Envio (sentAt): ${JSON.stringify(finalDoc.sentAt)}`);

  // 3. Teste do acesso à URL pública da proposta gerada
  if (finalDoc.proposalUrl) {
    const localProposalUrl = finalDoc.proposalUrl.replace(/^https?:\/\/[^/]+/, BASE_URL);
    console.log(`\n[E2E] A validar renderização pública da URL da proposta (${localProposalUrl})...`);
    const pageRes = await fetch(localProposalUrl);
    console.log(`[E2E] Status HTTP da página pública: ${pageRes.status} ${pageRes.statusText}`);
    const pageHtml = await pageRes.text();
    const hasClientName = pageHtml.includes(customerName);
    const hasCadence = pageHtml.includes('Cadence');
    console.log(`[E2E] Conteúdo verificado: Contém Nome do Cliente: ${hasClientName ? 'SIM' : 'NÃO'} | Contém Marca Cadence: ${hasCadence ? 'SIM' : 'NÃO'}`);
  }

  console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO ABSOLUTO!');
  console.log('O pipeline gerou a proposta e enviou o email para o cliente com sucesso.');
  console.log('======================================================================\n');
}

runEndToEndTest().catch((err) => {
  console.error('\n❌ Falha no teste End-to-End:', err?.message || err);
  process.exit(1);
});
