/**
 * =========================================================================
 * MÓDULO DE PREÇOS E BASE DE CONHECIMENTO DE PROPOSTAS — CADENCE
 * 
 * Fonte única de verdade para planos, extras, taxas e cálculo financeiro.
 * Utilizado de forma partilhada pelo chatbot de suporte, pelo gerador
 * de propostas com IA e pelos motores de fallback determinísticos.
 * =========================================================================
 */

// =========================================================================
// 1. CONSTANTES PRINCIPAIS: PLANOS, EXTRAS, IVA, VALIDADE_PROPOSTA_DIAS
// =========================================================================

export type PlanId = 'free' | 'pro' | 'team';
export type BillingCycle = 'monthly' | 'yearly';
export type ExtraBillingType = 'recurring' | 'one-time';

export interface PlanData {
  id: PlanId;
  nome: string;
  descricao: string;
  precoMensal: number;
  precoAnual: number;
  minUtilizadores: number;
  maxUtilizadores?: number;
  porUtilizador: boolean;
  funcionalidades: string[];
}

export interface ExtraData {
  id: string;
  nome: string;
  descricao: string;
  tipoCobranca: ExtraBillingType;
  precoMensal: number;
  precoAnual: number;
  precoUnico?: number;
  disponivelEm: PlanId[]; // IDs dos planos onde o extra pode ser contratado
}

/**
 * PLANOS OFICIAIS CADENCE
 * Fonte: Base de Conhecimento e PRD
 */
export const PLANOS: Record<PlanId, PlanData> = {
  free: {
    id: 'free',
    nome: 'Free',
    descricao: 'Ideal para profissionais independentes que pretendem testar ou ter agendamento flexível sem custos.',
    precoMensal: 0,
    precoAnual: 0,
    minUtilizadores: 1,
    maxUtilizadores: 1,
    porUtilizador: false,
    funcionalidades: [
      '1 link de marcação ativo',
      'Sincronização com 1 calendário',
      'Buffers e regras básicas de disponibilidade',
      'Histórico de marcações: 90 dias',
    ],
  },

  pro: {
    id: 'pro',
    nome: 'Pro',
    descricao: 'Para consultores e freelancers que necessitam de links ilimitados, múltiplos calendários e branding próprio.',
    precoMensal: 8.0, // 8€/mês na faturação mensal
    precoAnual: 80.0, // 80€/ano na faturação anual (equivalente a 2 meses grátis)
    minUtilizadores: 1,
    maxUtilizadores: 1,
    porUtilizador: false,
    funcionalidades: [
      'Links de marcação ilimitados',
      'Sincronização com calendários ilimitados',
      'Coordenação de disponibilidade em equipa (overlay de calendários)',
      'Página de marcação pública personalizável (branding próprio)',
      'Histórico de marcações: 1 ano',
      'Exportação de dados em formato aberto (CSV/ICS) a qualquer momento',
    ],
  },

  team: {
    id: 'team',
    nome: 'Team',
    descricao: 'Para equipas que necessitam de coordenação coletiva de agenda, gestão centralizada e relatórios.',
    precoMensal: 6.0, // 6€/utilizador/mês na faturação mensal (mín. 3 utilizadores)
    // TODO: Confirmar valor anual do plano Team (Assumido 60€/utilizador/ano com 2 meses grátis, padrão idêntico ao Pro)
    precoAnual: 60.0,
    minUtilizadores: 3,
    porUtilizador: true,
    funcionalidades: [
      'Tudo o que está incluído no Pro',
      'Gestão centralizada de membros da equipa',
      'Relatórios de utilização e ocupação de agenda',
      'Suporte prioritário (tempo de resposta até 4h úteis)',
    ],
  },
};

/**
 * EXTRAS OPCIONAIS CONFIGURÁVEIS
 */
export const EXTRAS: Record<string, ExtraData> = {
  onboarding_migration: {
    id: 'onboarding_migration',
    nome: 'Onboarding Dedicado & Migração de Calendários',
    descricao: 'Sessão 1-para-1 de 60 minutos para configuração de equipa, políticas de buffers e importação de calendários legados.',
    tipoCobranca: 'one-time',
    precoMensal: 0,
    precoAnual: 0,
    // TODO: Confirmar preço do extra de Onboarding Dedicado (valor de exemplo: 99.00€ pagamento único)
    precoUnico: 99.0,
    disponivelEm: ['pro', 'team'],
  },

  custom_domain_ssl: {
    id: 'custom_domain_ssl',
    nome: 'Domínio Personalizado & SSL Dedicado',
    descricao: 'Utilização de domínio ou subdomínio próprio (ex: agenda.empresa.pt) com certificado SSL gerido.',
    tipoCobranca: 'recurring',
    // TODO: Confirmar preço do extra de Domínio Personalizado (valores de exemplo: 4.00€/mês ou 40.00€/ano)
    precoMensal: 4.0,
    precoAnual: 40.0,
    disponivelEm: ['pro', 'team'],
  },

  priority_sla_24_7: {
    id: 'priority_sla_24_7',
    nome: 'SLA de Suporte Crítico 24/7 & Gestor Dedicado',
    descricao: 'Tempo de resposta garantido em 1 hora para incidentes críticos e canal direto via Slack/Teams.',
    tipoCobranca: 'recurring',
    // TODO: Confirmar preço do extra de SLA Crítico 24/7 (valores de exemplo: 49.00€/mês ou 490.00€/ano)
    precoMensal: 49.0,
    precoAnual: 490.0,
    disponivelEm: ['team'],
  },
};

/**
 * Taxa de IVA padrão (Portugal Continental: 23% = 0.23)
 * TODO: Confirmar taxas especiais para Madeira (22%), Açores (16%) ou isenção B2B Intracomunitária (VIES reverse charge).
 */
export const IVA = 0.23;
export const DEFAULT_VAT_RATE = IVA;

/**
 * Validade padrão da proposta comercial emitida em dias
 * TODO: Confirmar prazo padrão de validade da proposta comercial (padrão: 15 dias).
 */
export const VALIDADE_PROPOSTA_DIAS = 15;

/**
 * Descontos por volume para equipas (escalões aplicáveis sobre o custo dos utilizadores no plano Team)
 * TODO: Confirmar escalões de desconto por volume com a equipa comercial.
 */
export const DESCONTOS_VOLUME_EQUIPA = [
  { minSeats: 25, discountPercentage: 15 }, // 15% para equipas com 25 ou mais pessoas
  { minSeats: 10, maxSeats: 24, discountPercentage: 10 }, // 10% para equipas com 10 a 24 pessoas
];

// =========================================================================
// 2. FUNÇÃO buildPricingKnowledge()
// =========================================================================

/**
 * Constrói a secção formatada em texto/Markdown sobre Planos e Preços
 * para injeção direta no System Prompt do Chatbot e no Gerador de Propostas.
 */
export function buildPricingKnowledge(): string {
  const planosText = Object.values(PLANOS)
    .map((p) => {
      let precoStr = '';
      if (p.precoMensal === 0 && p.precoAnual === 0) {
        precoStr = '0€ / sempre gratuito';
      } else if (p.porUtilizador) {
        precoStr = `${p.precoMensal}€/utilizador/mês ou ${p.precoAnual}€/utilizador/ano (mínimo ${p.minUtilizadores} utilizadores)`;
      } else {
        precoStr = `${p.precoMensal}€/mês (faturação mensal) ou ${p.precoAnual}€/ano (faturação anual, equivalente a 2 meses grátis)`;
      }

      const funcs = p.funcionalidades.map((f) => `  - ${f}`).join('\n');
      return `### Plano ${p.nome}\n- Custo: ${precoStr}\n${funcs}`;
    })
    .join('\n\n');

  const extrasText = Object.values(EXTRAS)
    .map((e) => {
      let precoStr = '';
      if (e.tipoCobranca === 'one-time') {
        precoStr = `${e.precoUnico}€ (pagamento único)`;
      } else {
        precoStr = `${e.precoMensal}€/mês ou ${e.precoAnual}€/ano`;
      }
      return `- **${e.nome}** (${precoStr}): ${e.descricao} [Disponível para: ${e.disponivelEm.join(', ')}]`;
    })
    .join('\n');

  return `## 2. PLANOS E PREÇOS

${planosText}

### Módulos Opcionais / Extras
${extrasText}

### Faturação, IVA e Validade
- IVA: Todas as faturas e propostas incluem IVA à taxa legal em vigor (${Math.round(IVA * 100)}%).
- Validade das propostas comerciais: ${VALIDADE_PROPOSTA_DIAS} dias a contar da data de emissão.
- Política de cancelamento: Cancelamento a qualquer momento sem taxas. Acesso mantido até ao fim do período pago. Reembolso até 14 dias após a compra.`;
}

// =========================================================================
// 3. COMPATIBILIDADE ESTRUTURAL COM O MOTOR DE CÁLCULO (PRICING_CONFIG)
// =========================================================================

export interface PlanConfig {
  id: PlanId;
  name: string;
  description: string;
  monthlyPricePerUnit: number;
  yearlyPricePerUnit: number;
  minSeats: number;
  maxSeats?: number;
  perSeat: boolean;
  includedFeatures: string[];
}

export interface ExtraConfig {
  id: string;
  name: string;
  description: string;
  billingType: ExtraBillingType;
  monthlyPrice: number;
  yearlyPrice: number;
  oneTimePrice?: number;
  disponivelEm?: PlanId[];
}

export interface VolumeDiscountTier {
  minSeats: number;
  maxSeats?: number;
  discountPercentage: number;
}

export interface PricingConfig {
  currency: 'EUR';
  currencySymbol: '€';
  defaultVatRate: number;
  plans: Record<PlanId, PlanConfig>;
  extras: Record<string, ExtraConfig>;
  teamVolumeDiscounts: VolumeDiscountTier[];
}

export const PRICING_CONFIG: PricingConfig = {
  currency: 'EUR',
  currencySymbol: '€',
  defaultVatRate: IVA,

  plans: {
    free: {
      id: PLANOS.free.id,
      name: PLANOS.free.nome,
      description: PLANOS.free.descricao,
      monthlyPricePerUnit: PLANOS.free.precoMensal,
      yearlyPricePerUnit: PLANOS.free.precoAnual,
      minSeats: PLANOS.free.minUtilizadores,
      maxSeats: PLANOS.free.maxUtilizadores,
      perSeat: PLANOS.free.porUtilizador,
      includedFeatures: PLANOS.free.funcionalidades,
    },
    pro: {
      id: PLANOS.pro.id,
      name: PLANOS.pro.nome,
      description: PLANOS.pro.descricao,
      monthlyPricePerUnit: PLANOS.pro.precoMensal,
      yearlyPricePerUnit: PLANOS.pro.precoAnual,
      minSeats: PLANOS.pro.minUtilizadores,
      maxSeats: PLANOS.pro.maxUtilizadores,
      perSeat: PLANOS.pro.porUtilizador,
      includedFeatures: PLANOS.pro.funcionalidades,
    },
    team: {
      id: PLANOS.team.id,
      name: PLANOS.team.nome,
      description: PLANOS.team.descricao,
      monthlyPricePerUnit: PLANOS.team.precoMensal,
      yearlyPricePerUnit: PLANOS.team.precoAnual,
      minSeats: PLANOS.team.minUtilizadores,
      perSeat: PLANOS.team.porUtilizador,
      includedFeatures: PLANOS.team.funcionalidades,
    },
  },

  extras: {
    onboarding_migration: {
      id: EXTRAS.onboarding_migration.id,
      name: EXTRAS.onboarding_migration.nome,
      description: EXTRAS.onboarding_migration.descricao,
      billingType: EXTRAS.onboarding_migration.tipoCobranca,
      monthlyPrice: EXTRAS.onboarding_migration.precoMensal,
      yearlyPrice: EXTRAS.onboarding_migration.precoAnual,
      oneTimePrice: EXTRAS.onboarding_migration.precoUnico,
      disponivelEm: EXTRAS.onboarding_migration.disponivelEm,
    },
    custom_domain_ssl: {
      id: EXTRAS.custom_domain_ssl.id,
      name: EXTRAS.custom_domain_ssl.nome,
      description: EXTRAS.custom_domain_ssl.descricao,
      billingType: EXTRAS.custom_domain_ssl.tipoCobranca,
      monthlyPrice: EXTRAS.custom_domain_ssl.precoMensal,
      yearlyPrice: EXTRAS.custom_domain_ssl.precoAnual,
      disponivelEm: EXTRAS.custom_domain_ssl.disponivelEm,
    },
    priority_sla_24_7: {
      id: EXTRAS.priority_sla_24_7.id,
      name: EXTRAS.priority_sla_24_7.nome,
      description: EXTRAS.priority_sla_24_7.descricao,
      billingType: EXTRAS.priority_sla_24_7.tipoCobranca,
      monthlyPrice: EXTRAS.priority_sla_24_7.precoMensal,
      yearlyPrice: EXTRAS.priority_sla_24_7.precoAnual,
      disponivelEm: EXTRAS.priority_sla_24_7.disponivelEm,
    },
  },

  teamVolumeDiscounts: DESCONTOS_VOLUME_EQUIPA,
};

// =========================================================================
// 4. INTERFACES DE CÁLCULO
// =========================================================================

export interface ExtraSelection {
  id: string;
  quantity?: number;
}

export interface ProposalSelection {
  planId: PlanId;
  billingCycle?: BillingCycle;
  seats?: number;
  extras?: Array<ExtraSelection | string>;
  customDiscountPercentage?: number;
  customDiscountAmount?: number;
  vatRate?: number;
  applyVolumeDiscount?: boolean;
}

export interface ProposalLineItem {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  quantity: number;
  period: 'monthly' | 'yearly' | 'one-time';
  total: number;
}

export interface DiscountDetail {
  code: string;
  description: string;
  percentage?: number;
  amount: number;
}

export interface ProposalCalculationResult {
  valid: boolean;
  errors?: string[];
  plan: PlanConfig;
  billingCycle: BillingCycle;
  seats: number;
  lineItems: ProposalLineItem[];
  subtotal: number;
  totalDiscount: number;
  discounts: DiscountDetail[];
  subtotalAfterDiscount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  currency: 'EUR';
  currencySymbol: '€';
  effectiveMonthlyCost: number;
  savingsVsMonthlyAnnualized?: number;
}

// =========================================================================
// 5. FUNÇÃO PURA DE CÁLCULO MATEMÁTICO
// =========================================================================

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function calculateProposal(selection: ProposalSelection): ProposalCalculationResult {
  const errors: string[] = [];

  // 1. Validação do Plano
  const planId = selection.planId;
  const plan = PRICING_CONFIG.plans[planId];
  if (!plan) {
    return {
      valid: false,
      errors: [`Plano "${planId}" inválido. Opções válidas: free, pro, team.`],
      plan: PRICING_CONFIG.plans.free,
      billingCycle: 'monthly',
      seats: 1,
      lineItems: [],
      subtotal: 0,
      totalDiscount: 0,
      discounts: [],
      subtotalAfterDiscount: 0,
      vatRate: IVA,
      vatAmount: 0,
      total: 0,
      currency: 'EUR',
      currencySymbol: '€',
      effectiveMonthlyCost: 0,
    };
  }

  // 2. Validação e Normalização do Ciclo de Faturação
  const billingCycle: BillingCycle = selection.billingCycle === 'yearly' ? 'yearly' : 'monthly';

  // 3. Validação e Normalização da Quantidade de Utilizadores / Assentos (Seats)
  let seats = typeof selection.seats === 'number' ? selection.seats : plan.minSeats;
  if (!Number.isInteger(seats) || seats <= 0) {
    errors.push('O número de utilizadores (seats) deve ser um número inteiro positivo.');
    seats = plan.minSeats;
  }

  if (planId === 'team' && seats < plan.minSeats) {
    errors.push(`O plano Team exige no mínimo ${plan.minSeats} utilizadores.`);
  }

  if ((planId === 'free' || planId === 'pro') && seats > 1) {
    errors.push(`O plano ${plan.name} é individual (máximo 1 utilizador). Para múltiplos utilizadores, escolhe o plano Team.`);
    seats = 1;
  }

  // 4. Validação de IVA
  let vatRate = typeof selection.vatRate === 'number' ? selection.vatRate : PRICING_CONFIG.defaultVatRate;
  if (vatRate < 0 || vatRate > 1) {
    errors.push('A taxa de IVA deve ser um valor decimal entre 0 e 1 (ex: 0.23 para 23%).');
    vatRate = PRICING_CONFIG.defaultVatRate;
  }

  // 5. Linhas de Itens (Line Items)
  const lineItems: ProposalLineItem[] = [];

  // 5.1 Item do Plano Base
  const baseUnitPrice = billingCycle === 'yearly' ? plan.yearlyPricePerUnit : plan.monthlyPricePerUnit;
  const baseQuantity = plan.perSeat ? seats : 1;
  const baseItemTotal = round2(baseUnitPrice * baseQuantity);

  lineItems.push({
    id: `plan_${plan.id}`,
    name: `Plano Cadence ${plan.name}`,
    description: plan.perSeat
      ? `${plan.description} (${seats} ${seats === 1 ? 'utilizador' : 'utilizadores'})`
      : plan.description,
    unitPrice: baseUnitPrice,
    quantity: baseQuantity,
    period: billingCycle,
    total: baseItemTotal,
  });

  // 5.2 Itens de Extras Opcionais
  const extrasList = selection.extras || [];
  for (const rawExtra of extrasList) {
    const extraId = typeof rawExtra === 'string' ? rawExtra : rawExtra.id;
    const rawQty = typeof rawExtra === 'object' && typeof rawExtra.quantity === 'number' ? rawExtra.quantity : 1;

    const extraConfig = PRICING_CONFIG.extras[extraId];
    if (!extraConfig) {
      errors.push(`Módulo extra "${extraId}" desconhecido.`);
      continue;
    }

    if (!Number.isInteger(rawQty) || rawQty <= 0) {
      errors.push(`Quantidade inválida (${rawQty}) para o extra "${extraConfig.name}". Deve ser um inteiro positivo.`);
      continue;
    }

    let unitPrice = 0;
    let period: 'monthly' | 'yearly' | 'one-time' = 'one-time';

    if (extraConfig.billingType === 'one-time') {
      unitPrice = extraConfig.oneTimePrice ?? 0;
      period = 'one-time';
    } else {
      period = billingCycle;
      unitPrice = billingCycle === 'yearly' ? extraConfig.yearlyPrice : extraConfig.monthlyPrice;
    }

    const itemTotal = round2(unitPrice * rawQty);

    lineItems.push({
      id: `extra_${extraConfig.id}`,
      name: extraConfig.name,
      description: extraConfig.description,
      unitPrice,
      quantity: rawQty,
      period,
      total: itemTotal,
    });
  }

  // 6. Subtotal
  const subtotal = round2(lineItems.reduce((acc, item) => acc + item.total, 0));

  // 7. Cálculo de Descontos
  const discounts: DiscountDetail[] = [];

  // 7.1 Desconto de Volume (aplicável ao plano Team)
  const applyVolumeDiscount = selection.applyVolumeDiscount !== false;
  if (planId === 'team' && applyVolumeDiscount) {
    for (const tier of PRICING_CONFIG.teamVolumeDiscounts) {
      if (seats >= tier.minSeats && (!tier.maxSeats || seats <= tier.maxSeats)) {
        const discountAmount = round2(baseItemTotal * (tier.discountPercentage / 100));
        discounts.push({
          code: 'VOLUME_DISCOUNT',
          description: `Desconto por volume (${tier.discountPercentage}% para ${seats} utilizadores)`,
          percentage: tier.discountPercentage,
          amount: discountAmount,
        });
        break;
      }
    }
  }

  // 7.2 Desconto Percentual Personalizado
  if (typeof selection.customDiscountPercentage === 'number' && selection.customDiscountPercentage > 0) {
    if (selection.customDiscountPercentage > 100) {
      errors.push('O desconto percentual personalizado não pode exceder 100%.');
    } else {
      const discountAmount = round2(subtotal * (selection.customDiscountPercentage / 100));
      discounts.push({
        code: 'CUSTOM_PERCENTAGE',
        description: `Desconto comercial especial (${selection.customDiscountPercentage}%)`,
        percentage: selection.customDiscountPercentage,
        amount: discountAmount,
      });
    }
  }

  // 7.3 Desconto Fixo Personalizado (em Euros)
  if (typeof selection.customDiscountAmount === 'number' && selection.customDiscountAmount > 0) {
    const discountAmount = round2(selection.customDiscountAmount);
    discounts.push({
      code: 'CUSTOM_FIXED',
      description: `Desconto comercial fixo (${discountAmount.toFixed(2)}€)`,
      amount: discountAmount,
    });
  }

  // Total de Desconto (não pode ultrapassar o subtotal)
  const rawTotalDiscount = discounts.reduce((acc, d) => acc + d.amount, 0);
  const totalDiscount = round2(Math.min(subtotal, rawTotalDiscount));

  // 8. Subtotal Após Desconto
  const subtotalAfterDiscount = round2(Math.max(0, subtotal - totalDiscount));

  // 9. Cálculo de IVA
  const vatAmount = round2(subtotalAfterDiscount * vatRate);

  // 10. Total Final
  const total = round2(subtotalAfterDiscount + vatAmount);

  // 11. Custo Mensal Efetivo (para comparação e transparência)
  let effectiveMonthlyCost: number;
  let savingsVsMonthlyAnnualized: number | undefined;

  if (billingCycle === 'yearly') {
    effectiveMonthlyCost = round2(subtotalAfterDiscount / 12);

    // Comparativo: quanto custaria se contratasse na modalidade mensal durante 1 ano
    const annualizedMonthlyBaseCost = round2(plan.monthlyPricePerUnit * baseQuantity * 12);
    if (annualizedMonthlyBaseCost > baseItemTotal) {
      savingsVsMonthlyAnnualized = round2(annualizedMonthlyBaseCost - baseItemTotal);
    }
  } else {
    effectiveMonthlyCost = subtotalAfterDiscount;
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    plan,
    billingCycle,
    seats,
    lineItems,
    subtotal,
    totalDiscount,
    discounts,
    subtotalAfterDiscount,
    vatRate,
    vatAmount,
    total,
    currency: PRICING_CONFIG.currency,
    currencySymbol: PRICING_CONFIG.currencySymbol,
    effectiveMonthlyCost,
    savingsVsMonthlyAnnualized,
  };
}
