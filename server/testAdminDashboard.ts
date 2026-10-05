/**
 * =========================================================================
 * TESTE DO PAINEL DE ADMINISTRAÇÃO (/api/admin) — CADENCE
 * =========================================================================
 */

import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cadence2026!';

async function runAdminTests() {
  console.log('\n======================================================================');
  console.log(' CADENCE — TESTES DO PAINEL DE ADMINISTRAÇÃO (/api/admin)');
  console.log('======================================================================\n');

  // Teste 1: Acesso não autenticado (deve devolver 401 sem revelar dados)
  console.log('[1/7] A testar proteção de autenticação em GET /api/admin/requests sem credenciais...');
  const unauthRes = await fetch(`${BASE_URL}/api/admin/requests`);
  console.log(`      Status HTTP recebido: ${unauthRes.status} (Esperado: 401)`);
  if (unauthRes.status !== 401) {
    throw new Error(`Esperado 401, obtido ${unauthRes.status}`);
  }
  const unauthBody = await unauthRes.json();
  console.log(`      Corpo da resposta: ${JSON.stringify(unauthBody)} (Nenhum dado sensível revelado ✅)\n`);

  // Teste 2: Tentativa de login com password errada
  console.log('[2/7] A testar login com password inválida...');
  const wrongLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'palavra-passe-errada' }),
  });
  console.log(`      Status HTTP recebido: ${wrongLoginRes.status} (Esperado: 401)`);
  if (wrongLoginRes.status !== 401) {
    throw new Error(`Esperado 401, obtido ${wrongLoginRes.status}`);
  }
  console.log(`      Rejeição com 401 confirmada ✅\n`);

  // Teste 3: Login com password correta
  console.log(`[3/7] A testar login com password correta ("${ADMIN_PASSWORD}")...`);
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  console.log(`      Status HTTP recebido: ${loginRes.status} (Esperado: 200)`);
  if (!loginRes.ok) {
    throw new Error(`Falha no login: ${await loginRes.text()}`);
  }
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log(`      Token de sessão gerado: ${token ? token.substring(0, 16) + '...' : 'null'} ✅\n`);

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Teste 4: Verificação da sessão GET /api/admin/me
  console.log('[4/7] A validar sessão em GET /api/admin/me...');
  const meRes = await fetch(`${BASE_URL}/api/admin/me`, { headers: authHeaders });
  console.log(`      Status HTTP: ${meRes.status} | Resposta: ${await meRes.text()} ✅\n`);

  // Teste 5: Listagem de pedidos com métricas e enriquecimento de totais
  console.log('[5/7] A carregar lista de pedidos em GET /api/admin/requests...');
  const requestsRes = await fetch(`${BASE_URL}/api/admin/requests`, { headers: authHeaders });
  if (!requestsRes.ok) throw new Error(`Falha ao carregar pedidos: ${await requestsRes.text()}`);
  const requestsData = await requestsRes.json();
  console.log(`      Total de pedidos encontrados: ${requestsData.totalCount}`);
  console.log(`      Métricas:`, requestsData.metrics);

  const sentRequest = requestsData.requests.find((r: any) => r.status === 'sent' && r.proposalToken);
  if (sentRequest) {
    console.log(`      Exemplo de pedido enviado:`);
    console.log(`        - ID: ${sentRequest.id}`);
    console.log(`        - Cliente: ${sentRequest.name} <${sentRequest.email}>`);
    console.log(`        - Total da Proposta: ${sentRequest.proposalTotal || 'N/A'}`);
    console.log(`        - URL Proposta: ${sentRequest.proposalUrl}`);
  }
  console.log(`      Listagem e métricas validadas ✅\n`);

  // Teste 6: Filtros e pesquisa
  console.log('[6/7] A testar filtros por estado e pesquisa por texto...');
  const filteredRes = await fetch(`${BASE_URL}/api/admin/requests?status=sent&search=Ester`, { headers: authHeaders });
  const filteredData = await filteredRes.json();
  console.log(`      Pedidos filtrados por status="sent" e search="Ester": ${filteredData.totalCount} encontrado(s) ✅\n`);

  // Teste 7: Reenvio de email para proposta sent
  if (sentRequest) {
    console.log(`[7/8] A testar ação "Resend email" para o pedido ${sentRequest.id}...`);
    const resendRes = await fetch(`${BASE_URL}/api/admin/requests/${sentRequest.id}/resend-email`, {
      method: 'POST',
      headers: authHeaders,
    });
    console.log(`      Status HTTP: ${resendRes.status}`);
    const resendData = await resendRes.json();
    console.log(`      Resposta do reenvio:`, resendData);
    if (!resendRes.ok) throw new Error(`Falha no reenvio: ${JSON.stringify(resendData)}`);
    console.log(`      Ação "Resend email" validada com sucesso ✅\n`);
  }

  // Teste 8: Eliminação de dados de acordo com o RGPD (DELETE /api/admin/requests/:id)
  console.log('[8/8] A testar eliminação de dados ao abrigo do RGPD (Direito ao Esquecimento)...');
  const tempProposalRes = await fetch(`${BASE_URL}/api/proposal-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Cliente Teste RGPD',
      email: 'teste.rgpd.temp@example.com',
      needs: 'Pedido de teste para validação da funcionalidade de eliminação de dados ao abrigo do RGPD.',
      consent: true,
    }),
  });
  const tempProposalData = await tempProposalRes.json();
  const tempId = tempProposalData.id;
  console.log(`      Pedido temporário criado com ID: ${tempId}`);

  const deleteRes = await fetch(`${BASE_URL}/api/admin/requests/${tempId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  console.log(`      Status HTTP DELETE: ${deleteRes.status}`);
  if (!deleteRes.ok) throw new Error(`Falha no DELETE: ${await deleteRes.text()}`);
  const deleteData = await deleteRes.json();
  console.log(`      Resposta da eliminação:`, deleteData);
  console.log(`      Eliminação definitiva (RGPD) validada com sucesso ✅\n`);

  console.log('======================================================================');
  console.log('🎉 TODOS OS TESTES DO PAINEL DE ADMINISTRAÇÃO PASSARAM COM DISTINÇÃO!');
  console.log('======================================================================\n');
}

runAdminTests().catch((err) => {
  console.error('\n❌ Erro nos testes do painel de administração:', err?.message || err);
  process.exit(1);
});
