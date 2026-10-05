import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateProposal,
  round2,
  PRICING_CONFIG,
  DEFAULT_VAT_RATE,
  PLANOS,
  EXTRAS,
  IVA,
  VALIDADE_PROPOSTA_DIAS,
  buildPricingKnowledge,
} from './pricing';
import { getKnowledgeBaseFallbackAnswer, buildSystemPrompt } from './knowledgeBase';

describe('Módulo de Preços & Base de Conhecimento (pricing.ts & knowledgeBase.ts)', () => {
  // -------------------------------------------------------------------------
  // CENÁRIO: Integridade Referencial de EXTRAS.disponivelEm vs. PLANOS
  // -------------------------------------------------------------------------
  test('Integridade Referencial: todos os IDs em EXTRAS.disponivelEm têm de existir em PLANOS', () => {
    const validPlanIds = Object.keys(PLANOS);

    for (const [extraKey, extra] of Object.entries(EXTRAS)) {
      assert.ok(
        Array.isArray(extra.disponivelEm),
        `EXTRAS.${extraKey}.disponivelEm deve ser um array de PlanIds`
      );
      assert.ok(
        extra.disponivelEm.length > 0,
        `EXTRAS.${extraKey}.disponivelEm não deve estar vazio`
      );

      for (const targetPlanId of extra.disponivelEm) {
        assert.ok(
          validPlanIds.includes(targetPlanId),
          `EXTRAS.${extraKey}.disponivelEm contém o ID "${targetPlanId}" que NÃO existe em PLANOS! Planos válidos: ${validPlanIds.join(', ')}`
        );
      }
    }
  });

  // -------------------------------------------------------------------------
  // CENÁRIO: Função buildPricingKnowledge() e injeção no System Prompt
  // -------------------------------------------------------------------------
  test('buildPricingKnowledge() gera documentação coerente e é injetada no System Prompt', () => {
    const pricingMarkdown = buildPricingKnowledge();

    assert.ok(pricingMarkdown.includes('Plano Free'), 'Deve conter Plano Free');
    assert.ok(pricingMarkdown.includes('Plano Pro'), 'Deve conter Plano Pro');
    assert.ok(pricingMarkdown.includes('Plano Team'), 'Deve conter Plano Team');
    assert.ok(pricingMarkdown.includes('8€/mês'), 'Deve conter preço Pro 8€/mês');
    assert.ok(pricingMarkdown.includes('6€/utilizador/mês'), 'Deve conter preço Team 6€/utilizador/mês');
    assert.ok(pricingMarkdown.includes('23%'), 'Deve conter taxa de IVA 23%');
    assert.ok(pricingMarkdown.includes('15 dias'), 'Deve conter validade da proposta de 15 dias');

    const systemPrompt = buildSystemPrompt();
    assert.ok(systemPrompt.includes(pricingMarkdown), 'System prompt deve conter o bloco gerado por buildPricingKnowledge()');
  });

  // -------------------------------------------------------------------------
  // CENÁRIO: Fallback determinístico de preços no Chatbot
  // -------------------------------------------------------------------------
  test('getKnowledgeBaseFallbackAnswer responde a perguntas simples de preços usando pricing.ts', () => {
    const freeAnswer = getKnowledgeBaseFallbackAnswer('Quanto custa o plano Free e o que inclui?');
    assert.ok(freeAnswer && freeAnswer.includes('0€') && freeAnswer.includes('gratuito'));

    const proAnswer = getKnowledgeBaseFallbackAnswer('Qual é o preço do plano pro anual?');
    assert.ok(proAnswer && proAnswer.includes('8€/mês') && proAnswer.includes('80€/ano'));

    const teamAnswer = getKnowledgeBaseFallbackAnswer('Quanto custa o plano team por utilizador?');
    assert.ok(teamAnswer && teamAnswer.includes('6€/utilizador/mês'));

    const extrasAnswer = getKnowledgeBaseFallbackAnswer('Que extras ou modulos opcionais existem?');
    assert.ok(extrasAnswer && extrasAnswer.includes('Onboarding'));
  });

  // -------------------------------------------------------------------------
  // CENÁRIO 1: Plano Free (Validação de custo zero e integridade de campos)
  // -------------------------------------------------------------------------
  test('Cenário 1: Plano Free resulta em 0.00€ com IVA zero e 1 utilizador', () => {
    const result = calculateProposal({
      planId: 'free',
      billingCycle: 'monthly',
    });

    assert.equal(result.valid, true);
    assert.equal(result.errors, undefined);
    assert.equal(result.subtotal, 0);
    assert.equal(result.totalDiscount, 0);
    assert.equal(result.subtotalAfterDiscount, 0);
    assert.equal(result.vatAmount, 0);
    assert.equal(result.total, 0);
    assert.equal(result.seats, 1);
    assert.equal(result.lineItems.length, 1);
    assert.equal(result.lineItems[0].unitPrice, 0);
    assert.equal(result.lineItems[0].total, 0);
    assert.equal(result.plan.id, 'free');
  });

  // -------------------------------------------------------------------------
  // CENÁRIO 2: Plano Pro (Mensal vs. Anual e cálculo de IVA a 23%)
  // -------------------------------------------------------------------------
  test('Cenário 2A: Plano Pro com faturação mensal (8€/mês + IVA 23%)', () => {
    const result = calculateProposal({
      planId: 'pro',
      billingCycle: 'monthly',
    });

    assert.equal(result.valid, true);
    assert.equal(result.subtotal, 8.0);
    assert.equal(result.totalDiscount, 0);
    assert.equal(result.subtotalAfterDiscount, 8.0);
    // 8.00 * 0.23 = 1.84€
    assert.equal(result.vatAmount, 1.84);
    // 8.00 + 1.84 = 9.84€
    assert.equal(result.total, 9.84);
    assert.equal(result.effectiveMonthlyCost, 8.0);
  });

  test('Cenário 2B: Plano Pro com faturação anual (80€/ano com poupança equivalente a 2 meses grátis)', () => {
    const result = calculateProposal({
      planId: 'pro',
      billingCycle: 'yearly',
    });

    assert.equal(result.valid, true);
    // Base de conhecimento: 80€/ano
    assert.equal(result.subtotal, 80.0);
    assert.equal(result.subtotalAfterDiscount, 80.0);
    // 80.00 * 0.23 = 18.40€
    assert.equal(result.vatAmount, 18.4);
    // 80.00 + 18.40 = 98.40€
    assert.equal(result.total, 98.4);
    // Custo mensal efetivo: 80 / 12 = 6.67€
    assert.equal(result.effectiveMonthlyCost, 6.67);
    // Poupança face ao plano mensal (8€ * 12 = 96€ vs 80€ = 16€ de poupança)
    assert.equal(result.savingsVsMonthlyAnnualized, 16.0);
  });

  // -------------------------------------------------------------------------
  // CENÁRIO 3: Plano Team no Limite Mínimo (Valor Limite de 3 utilizadores)
  // -------------------------------------------------------------------------
  test('Cenário 3: Plano Team com exatamente 3 utilizadores (limite mínimo) mensal e anual', () => {
    // 3A: Mensal (3 x 6€ = 18€)
    const monthlyResult = calculateProposal({
      planId: 'team',
      billingCycle: 'monthly',
      seats: 3,
    });

    assert.equal(monthlyResult.valid, true);
    assert.equal(monthlyResult.seats, 3);
    assert.equal(monthlyResult.subtotal, 18.0);
    // 18.00 * 0.23 = 4.14€
    assert.equal(monthlyResult.vatAmount, 4.14);
    // 18.00 + 4.14 = 22.14€
    assert.equal(monthlyResult.total, 22.14);

    // 3B: Anual (3 x 60€ = 180€)
    const yearlyResult = calculateProposal({
      planId: 'team',
      billingCycle: 'yearly',
      seats: 3,
    });

    assert.equal(yearlyResult.valid, true);
    assert.equal(yearlyResult.subtotal, 180.0);
    // 180.00 * 0.23 = 41.40€
    assert.equal(yearlyResult.vatAmount, 41.4);
    // 180.00 + 41.40 = 221.40€
    assert.equal(yearlyResult.total, 221.4);
    // Custo mensal efetivo: 180 / 12 = 15.00€
    assert.equal(yearlyResult.effectiveMonthlyCost, 15.0);
  });

  // -------------------------------------------------------------------------
  // CENÁRIO 4: Caso Complexo — Plano Team com Desconto de Volume e Múltiplos Extras
  // -------------------------------------------------------------------------
  test('Cenário 4: Plano Team com 12 utilizadores (10% desconto de volume) + Onboarding + Domínio Próprio', () => {
    const result = calculateProposal({
      planId: 'team',
      billingCycle: 'yearly',
      seats: 12,
      extras: [
        'onboarding_migration', // one-time: 99.00€
        { id: 'custom_domain_ssl', quantity: 1 }, // recurring yearly: 40.00€
      ],
    });

    assert.equal(result.valid, true);
    assert.equal(result.seats, 12);

    // Linha 1 (Plano Team): 12 x 60.00€ = 720.00€
    // Linha 2 (Onboarding): 99.00€
    // Linha 3 (Domínio): 40.00€
    // Subtotal bruto = 720.00 + 99.00 + 40.00 = 859.00€
    assert.equal(result.subtotal, 859.0);

    // Desconto de volume de 10% sobre os utilizadores: 10% de 720.00€ = 72.00€
    assert.equal(result.totalDiscount, 72.0);
    assert.equal(result.discounts.length, 1);
    assert.equal(result.discounts[0].code, 'VOLUME_DISCOUNT');
    assert.equal(result.discounts[0].amount, 72.0);

    // Subtotal após desconto: 859.00 - 72.00 = 787.00€
    assert.equal(result.subtotalAfterDiscount, 787.0);

    // IVA a 23%: 787.00 * 0.23 = 181.01€
    assert.equal(result.vatAmount, 181.01);

    // Total Final: 787.00 + 181.01 = 968.01€
    assert.equal(result.total, 968.01);
  });

  // -------------------------------------------------------------------------
  // CENÁRIO 5: Seleções Inválidas e Violações de Limites (Resiliência e Erros)
  // -------------------------------------------------------------------------
  test('Cenário 5A: Plano Team com menos de 3 utilizadores (ex: 2 utilizadores) devolve erro explícito', () => {
    const result = calculateProposal({
      planId: 'team',
      seats: 2,
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors);
    assert.ok(result.errors.some((err) => err.includes('mínimo 3 utilizadores')));
  });

  test('Cenário 5B: Plano inexistente é rejeitado', () => {
    const result = calculateProposal({
      planId: 'enterprise_custom' as any,
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors);
    assert.ok(result.errors[0].includes('inválido'));
  });

  test('Cenário 5C: Plano individual com múltiplos assentos é rejeitado com mensagem pedagógica', () => {
    const result = calculateProposal({
      planId: 'pro',
      seats: 4,
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors);
    assert.ok(result.errors.some((err) => err.includes('individual')));
  });

  test('Cenário 5D: Módulo extra desconhecido é sinalizado nos erros', () => {
    const result = calculateProposal({
      planId: 'pro',
      extras: ['modulo_inexistente_123'],
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors);
    assert.ok(result.errors.some((err) => err.includes('desconhecido')));
  });

  test('Cenário 5E: Quantidade negativa ou não inteira de assentos é rejeitada', () => {
    const result = calculateProposal({
      planId: 'team',
      seats: -2,
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors);
    assert.ok(result.errors.some((err) => err.includes('número inteiro positivo')));
  });

  // -------------------------------------------------------------------------
  // CENÁRIO 6: Isenção de IVA (Reverse Charge B2B a 0%)
  // -------------------------------------------------------------------------
  test('Cenário 6: Isenção de IVA (vatRate = 0) resulta em IVA 0.00€ e Total = Subtotal', () => {
    const result = calculateProposal({
      planId: 'pro',
      billingCycle: 'yearly',
      vatRate: 0,
    });

    assert.equal(result.valid, true);
    assert.equal(result.subtotal, 80.0);
    assert.equal(result.vatRate, 0);
    assert.equal(result.vatAmount, 0);
    assert.equal(result.total, 80.0);
  });

  // -------------------------------------------------------------------------
  // CENÁRIO 7: Teto Máximo de Desconto (Desconto nunca pode tornar o total negativo)
  // -------------------------------------------------------------------------
  test('Cenário 7: Desconto comercial que excede o subtotal é limitado a 100% sem saldo negativo', () => {
    const result = calculateProposal({
      planId: 'pro',
      billingCycle: 'monthly', // 8.00€
      customDiscountAmount: 50.0, // 50€ > 8€
    });

    assert.equal(result.valid, true);
    assert.equal(result.subtotal, 8.0);
    assert.equal(result.totalDiscount, 8.0); // Limitado a 8.00€
    assert.equal(result.subtotalAfterDiscount, 0);
    assert.equal(result.vatAmount, 0);
    assert.equal(result.total, 0);
  });
});
