/**
 * =========================================================================
 * TESTE: GERADOR DE PROPOSTA HTML E ROTA /proposta/:token
 * 
 * Gera uma proposta a partir dos dados do Prompt 5:
 * (Equipa de 12 utilizadores com 10% desconto de volume + Onboarding + Domínio Próprio)
 * e testa o acesso à rota HTTP /proposta/:token.
 * =========================================================================
 */

import dotenv from 'dotenv';
dotenv.config();

import { calculateProposal } from './pricing';
import { saveProposal, getPublicBaseUrl } from './proposalStore';

async function testHtmlProposal() {
  console.log('\n======================================================================');
  console.log(' CADENCE — TESTE DO GERADOR DE PROPOSTA HTML E ROTA /proposta/:token');
  console.log('======================================================================\n');

  // 1. Dados do Prompt 5: Equipa de 12 utilizadores + Onboarding + Domínio
  const prompt5Calculation = calculateProposal({
    planId: 'team',
    billingCycle: 'yearly',
    seats: 12,
    extras: [
      'onboarding_migration',
      'custom_domain_ssl',
    ],
  });

  if (!prompt5Calculation.valid) {
    console.error('Falha no cálculo do Prompt 5:', prompt5Calculation.errors);
    process.exit(1);
  }

  console.log('1. Cálculo do Prompt 5 executado com sucesso:');
  console.log(`   - Plano: ${prompt5Calculation.plan.name} (${prompt5Calculation.seats} utilizadores, Anual)`);
  console.log(`   - Subtotal Bruto: ${prompt5Calculation.subtotal.toFixed(2)} €`);
  console.log(`   - Desconto Volume (10%): -${prompt5Calculation.totalDiscount.toFixed(2)} €`);
  console.log(`   - IVA (23%): ${prompt5Calculation.vatAmount.toFixed(2)} €`);
  console.log(`   - Total Final: ${prompt5Calculation.total.toFixed(2)} €\n`);

  // 2. Criação e persistência da proposta com token seguro (>= 32 car.)
  const customerName = 'Dra. Inês Miranda';
  const customerEmail = 'ines.miranda@miranda-consulting.pt';

  const proposalPayload = {
    requestId: 'req_prompt5_demo',
    customerName,
    customerEmail,
    createdAt: new Date().toISOString(),
    validityDays: 15,
    summary:
      'A Miranda Consulting pretende modernizar a coordenação de agenda dos seus 12 consultores seniores, unificando a disponibilidade entre Google Calendar e Microsoft 365, com garantia de intervalos de foco (buffers) e marcação em subdomínio corporativo próprio.',
    recommendedPlanId: 'team',
    billingCycle: 'yearly',
    seats: 12,
    planJustification:
      'O plano Team é a escolha perfeita para a dimensão da vossa equipa (12 consultores), oferecendo relatórios de ocupação de agenda, sobreposição coletiva de disponibilidade e gestão centralizada com desconto por volume de 10%.',
    suggestedExtras: ['onboarding_migration', 'custom_domain_ssl'],
    extrasJustifications: {
      onboarding_migration:
        'Sessão personalizada de 60 minutos com um especialista para migração guiada dos 12 calendários existentes sem perda de histórico.',
      custom_domain_ssl:
        'Ativação de link de marcação exclusivo em agenda.miranda-consulting.pt com certificado SSL gerido.',
    },
    assumptions: [
      'Assumimos que todos os 12 consultores utilizam calendários profissionais Google Workspace ou Microsoft 365.',
      'Assumimos periodicidade anual para beneficiar de 2 meses grátis adicionais.',
    ],
    nextSteps: [
      'Aceder à plataforma e validar a lista de membros a convidar',
      'Agendar a sessão guiada de onboarding e migração de calendários',
      'Configurar o apontamento DNS para o subdomínio personalizado',
      'Ativar as regras padrão de 15 minutos de buffer entre reuniões',
    ],
    confidence: 'high',
    calculation: prompt5Calculation,
  };

  // Grava via endpoint HTTP do servidor em execução
  const saveRes = await fetch('http://localhost:3000/api/proposals/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proposalPayload),
  });

  if (!saveRes.ok) {
    const errorText = await saveRes.text();
    throw new Error(`Falha ao gravar proposta na API do servidor: ${saveRes.status} ${errorText}`);
  }

  const saved = await saveRes.json();

  console.log('2. Proposta guardada com token criptográfico seguro:');
  console.log(`   - Token: ${saved.token} (comprimento: ${saved.token.length} car., mínimo exigido: 32)`);
  console.log(`   - URL Pública Gerada: ${saved.url}\n`);

  if (saved.token.length < 32) {
    console.error('ERRO: O token deve ter pelo menos 32 caracteres.');
    process.exit(1);
  }

  // 3. Teste HTTP à rota /proposta/:token local
  const testUrl = `http://localhost:3000/proposta/${saved.token}`;
  console.log(`3. A testar requisição HTTP para a rota: ${testUrl}`);

  try {
    const res = await fetch(testUrl);
    const robotsTag = res.headers.get('x-robots-tag');
    const contentType = res.headers.get('content-type');
    const html = await res.text();

    console.log(`   - Status HTTP: ${res.status} ${res.statusText}`);
    console.log(`   - Cabeçalho X-Robots-Tag: ${robotsTag}`);
    console.log(`   - Content-Type: ${contentType}`);

    if (res.status !== 200) {
      throw new Error(`Esperado status 200, recebido ${res.status}`);
    }

    if (!robotsTag || !robotsTag.includes('noindex')) {
      throw new Error('Cabeçalho X-Robots-Tag não inclui noindex');
    }

    // Validações do conteúdo HTML
    const checks = [
      { name: 'Logótipo / Nome Cadence', pass: html.includes('Cadence') },
      { name: 'Nome do Cliente', pass: html.includes(customerName) },
      { name: 'Email do Cliente', pass: html.includes(customerEmail) },
      { name: 'Validade (15 dias)', pass: html.includes('15 dias') },
      { name: 'Resumo das Necessidades', pass: html.includes('Miranda Consulting') },
      { name: 'Plano Recomendado e Justificação', pass: html.includes('Cadence Team') },
      { name: 'Tabela com Subtotal Bruto (859.00 €)', pass: html.includes('859.00') },
      { name: 'Desconto de Volume (72.00 €)', pass: html.includes('72.00') },
      { name: 'IVA (181.01 €)', pass: html.includes('181.01') },
      { name: 'Total Final (968.01 €)', pass: html.includes('968.01') },
      { name: 'Próximos Passos', pass: html.includes('onboarding e migração') },
      { name: 'Contacto / Agendamento', pass: html.includes('Agendar Reunião de Demonstração') },
      { name: 'Proteção Noindex nos Meta Tags', pass: html.includes('content="noindex, nofollow, noarchive"') },
      { name: 'CSS Inline para Impressão', pass: html.includes('@media print') },
    ];

    console.log('\n4. Verificação dos elementos do documento HTML:');
    let allPassed = true;
    for (const c of checks) {
      console.log(`   ${c.pass ? '✓' : '✗'} ${c.name}`);
      if (!c.pass) allPassed = false;
    }

    if (!allPassed) {
      throw new Error('Alguns elementos obrigatórios não foram encontrados no HTML gerado.');
    }

    // 4. Teste de Token Inválido (deve devolver 404 com noindex)
    console.log('\n5. A testar rota com token inválido (/proposta/token_invalido_inexistente_123456789012):');
    const invalidRes = await fetch('http://localhost:3000/proposta/token_invalido_inexistente_123456789012');
    const invalidRobots = invalidRes.headers.get('x-robots-tag');
    console.log(`   - Status HTTP para token inválido: ${invalidRes.status}`);
    console.log(`   - X-Robots-Tag: ${invalidRobots}`);

    if (invalidRes.status !== 404) {
      throw new Error(`Esperado status 404 para token inválido, recebido ${invalidRes.status}`);
    }

    console.log('\n======================================================================');
    console.log(' SUCESSO: Todos os testes de renderização e rota foram concluídos!');
    console.log(` LINK PARA VISUALIZAÇÃO NO BROWSER:`);
    console.log(` ${saved.url}`);
    console.log('======================================================================\n');
  } catch (err: any) {
    console.error('Falha no teste HTTP da proposta:', err?.message || err);
    process.exit(1);
  }
}

testHtmlProposal().catch((err) => {
  console.error('Erro inesperado no teste:', err);
  process.exit(1);
});
