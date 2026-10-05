/**
 * =========================================================================
 * SCRIPT DE TESTE: GERAÇÃO DE PROPOSTAS COM GEMINI + CÁLCULO DETERMINÍSTICO
 * 
 * Executado via: npm run test:proposal
 * =========================================================================
 */

import dotenv from 'dotenv';
dotenv.config();

import { generateProposalContent, ProposalContentRequest } from './proposalService';

const SAMPLE_REQUESTS: Array<{ title: string; request: ProposalContentRequest }> = [
  {
    title: 'Cenário 1: Equipa de Consultores com Necessidade de Migração',
    request: {
      name: 'Dr. Afonso Martins',
      email: 'afonso.martins@consultoria-lex.pt',
      description:
        'Somos uma consultora com 6 consultores jurídicos. Atualmente usamos Google Calendar e Outlook misturados, e perdemos imenso tempo em reuniões consecutivas sem pausa e a encontrar horários vagos em comum. Queremos coordenar a disponibilidade de todos numa só visão e precisamos de apoio direto para configurar e migrar os calendários existentes.',
      billingCyclePreference: 'yearly',
    },
  },
  {
    title: 'Cenário 2: Profissional Independente / Freelancer com Branding Próprio',
    request: {
      name: 'Beatriz Lima',
      email: 'beatriz@studiodesign.pt',
      description:
        'Trabalho por conta própria como designer de produto e pretendo colocar um link direto de marcação no meu site e no rodapé dos meus emails para briefings com clientes. Preciso de sincronizar simultaneamente a minha conta Google pessoal e a conta Microsoft de trabalho, e quero personalizar a página de marcação com o logótipo e cores do meu estúdio.',
      billingCyclePreference: 'yearly',
    },
  },
  {
    title: 'Cenário 3: Pedido Vago / Ambíguo com Pouco Detalhe',
    request: {
      name: 'Tiago Santos',
      email: 'tiago@empresa-inovacao.pt',
      description:
        'Gostava de saber qual o melhor plano para a nossa empresa começar a usar marcações automáticas sem perder muito tempo.',
    },
  },
];

async function runProposalTests() {
  console.log('\n======================================================================');
  console.log(' CADENCE — TESTE DO SERVIÇO DE GERAÇÃO DE PROPOSTAS COM GEMINI AI');
  console.log('======================================================================\n');

  if (!process.env.GEMINI_API_KEY) {
    console.error('ERRO: A variável GEMINI_API_KEY não foi encontrada no ambiente.');
    console.error('Certifica-te de que o ficheiro .env contém a chave de API da Gemini.');
    process.exit(1);
  }

  let passedCount = 0;

  for (let i = 0; i < SAMPLE_REQUESTS.length; i++) {
    const { title, request } = SAMPLE_REQUESTS[i];
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`[TESTE ${i + 1}/${SAMPLE_REQUESTS.length}] ${title}`);
    console.log(`----------------------------------------------------------------------`);
    console.log(`Cliente: ${request.name} <${request.email}>`);
    console.log(`Descrição do cliente:\n"${request.description}"\n`);
    console.log('A contactar a Gemini API e a calcular proposta...');

    const startTime = Date.now();

    try {
      const result = await generateProposalContent(request);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`\n Sucesso em ${elapsed}s (tentativas necessárias: ${result.attemptsCount})`);
      console.log(`\n Resumo das Necessidades (pt-PT):`);
      console.log(`  ${result.summary}`);

      console.log(`\n Recomendação da Solução:`);
      console.log(`  - Plano Recomendado: "${result.recommendedPlanId.toUpperCase()}" (${result.calculation.plan.name})`);
      console.log(`  - Periodicidade: ${result.billingCycle === 'yearly' ? 'Anual' : 'Mensal'}`);
      console.log(`  - Utilizadores (Seats): ${result.seats}`);
      console.log(
        `  - Extras Sugeridos: ${
          result.suggestedExtras.length > 0 ? result.suggestedExtras.join(', ') : 'Nenhum extra adicional'
        }`
      );
      console.log(`  - Nível de Confiança: [${result.confidence.toUpperCase()}]`);

      console.log(`\n Justificação do Plano:`);
      console.log(`  ${result.planJustification}`);

      if (Object.keys(result.extrasJustifications).length > 0) {
        console.log(`\n Justificação dos Extras:`);
        for (const [extraId, just] of Object.entries(result.extrasJustifications)) {
          console.log(`  - ${extraId}: ${just}`);
        }
      }

      if (result.assumptions.length > 0) {
        console.log(`\n Pressupostos Assumidos (para casos vagos/incompletos):`);
        for (const assumption of result.assumptions) {
          console.log(`  * ${assumption}`);
        }
      }

      console.log(`\n Passos Seguintes Recomendados:`);
      for (const step of result.nextSteps) {
        console.log(`  -> ${step}`);
      }

      console.log(`\n CÁLCULO FINANCEIRO DETERMINÍSTICO (via calculateProposal):`);
      console.log(`  Linhas Discriminadas:`);
      for (const item of result.calculation.lineItems) {
        console.log(
          `    • ${item.name} (${item.quantity}x @ ${item.unitPrice.toFixed(2)}€ / ${item.period}): ${item.total.toFixed(2)}€`
        );
      }

      console.log(`  -------------------------------------------------------------`);
      console.log(`  Subtotal Bruto:          ${result.calculation.subtotal.toFixed(2)}€`);
      if (result.calculation.totalDiscount > 0) {
        console.log(
          `  Descontos Aplicados:    -${result.calculation.totalDiscount.toFixed(2)}€ (${result.calculation.discounts
            .map((d) => d.description)
            .join(', ')})`
        );
        console.log(`  Subtotal Tributável:     ${result.calculation.subtotalAfterDiscount.toFixed(2)}€`);
      }
      console.log(
        `  IVA (${(result.calculation.vatRate * 100).toFixed(0)}%):                  ${result.calculation.vatAmount.toFixed(2)}€`
      );
      console.log(`  TOTAL FINAL FATURÁVEL:   ${result.calculation.total.toFixed(2)}€`);
      console.log(
        `  Custo Efetivo / Mês:     ${result.calculation.effectiveMonthlyCost.toFixed(2)}€ / mês`
      );

      if (result.calculation.savingsVsMonthlyAnnualized) {
        console.log(
          `  Poupança Anual Efetiva:  ${result.calculation.savingsVsMonthlyAnnualized.toFixed(2)}€ vs. plano mensal`
        );
      }

      passedCount++;
    } catch (err: any) {
      console.error(`\n Falha ao gerar proposta para o teste ${i + 1}:`, err.message || err);
    }
  }

  console.log(`\n======================================================================`);
  console.log(` RESULTADO FINAL DOS TESTES: ${passedCount}/${SAMPLE_REQUESTS.length} propostas geradas com sucesso.`);
  console.log(`======================================================================\n`);

  if (passedCount < SAMPLE_REQUESTS.length) {
    process.exit(1);
  }
}

runProposalTests().catch((err) => {
  console.error('Erro inesperado no script de teste:', err);
  process.exit(1);
});
