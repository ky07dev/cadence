/**
 * =========================================================================
 * GERADOR DE DOCUMENTOS HTML DE PROPOSTA — CADENCE
 * 
 * Gera documentos HTML completos, autocontidos e responsivos (inline CSS),
 * otimizados para visualização no browser e impressão em PDF/papel.
 * Todas as variáveis dinâmicas são rigorosamente higienizadas contra XSS.
 * =========================================================================
 */

import { ProposalCalculationResult } from './pricing';

export interface ProposalDocumentData {
  token: string;
  requestId?: string;
  customerName: string;
  customerEmail: string;
  createdAt: string | Date;
  validityDays?: number; // padrão: 15 dias
  summary: string;
  recommendedPlanId: 'free' | 'pro' | 'team';
  billingCycle: 'monthly' | 'yearly';
  seats: number;
  planJustification: string;
  suggestedExtras?: string[];
  extrasJustifications?: Record<string, string>;
  assumptions?: string[];
  nextSteps: string[];
  confidence?: 'high' | 'medium' | 'low';
  calculation: ProposalCalculationResult;
  publicBaseUrl?: string;
  contactEmail?: string;
  bookingUrl?: string;
}

/**
 * Escapa caracteres HTML perigosos para proteção estrita contra Cross-Site Scripting (XSS).
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formata data no padrão português (pt-PT).
 */
function formatDatePt(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return 'Data a confirmar';
  return new Intl.DateTimeFormat('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Gera o documento HTML completo e autocontido da proposta.
 */
export function renderProposalHtml(data: ProposalDocumentData): string {
  const validityDays = data.validityDays ?? 15;
  const createdDate = typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt;
  const expirationDate = new Date(createdDate.getTime() + validityDays * 24 * 60 * 60 * 1000);

  const formattedIssueDate = formatDatePt(createdDate);
  const formattedExpiryDate = formatDatePt(expirationDate);

  const safeCustomerName = escapeHtml(data.customerName || 'Estimado(a) Cliente');
  const safeCustomerEmail = escapeHtml(data.customerEmail || '');
  const safeToken = escapeHtml(data.token);
  const safeRequestId = escapeHtml(data.requestId || safeToken.slice(0, 10));
  const safeSummary = escapeHtml(data.summary);
  const safePlanJustification = escapeHtml(data.planJustification);
  const safePlanName = escapeHtml(data.calculation.plan.name);
  const safeContactEmail = escapeHtml(data.contactEmail || 'suporte@cadence.app');
  const rawBookingUrl = (data.bookingUrl || 'https://cal.com/esterpedrosa/livedemo').trim();
  const safeBookingUrl = (rawBookingUrl.startsWith('http://') || rawBookingUrl.startsWith('https://')) ? escapeHtml(rawBookingUrl) : '#';

  const cycleLabel = data.billingCycle === 'yearly' ? 'Faturação Anual (2 Meses Grátis)' : 'Faturação Mensal';

  // Linhas da tabela de investimento
  const itemsHtml = data.calculation.lineItems
    .map((item) => {
      const safeItemName = escapeHtml(item.name);
      const safeItemDesc = escapeHtml(item.description);
      const unitFormatted = item.unitPrice.toFixed(2);
      const totalFormatted = item.total.toFixed(2);
      const periodLabel = item.period === 'yearly' ? '/ ano' : item.period === 'monthly' ? '/ mês' : 'único';

      return `
        <tr>
          <td style="padding: 14px 16px; border-bottom: 1px solid #f0f0f0; text-align: left; vertical-align: top;">
            <strong style="color: #171717; font-size: 14px; display: block;">${safeItemName}</strong>
            <span style="color: #666666; font-size: 12px; line-height: 1.4; display: block; margin-top: 3px;">${safeItemDesc}</span>
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #f0f0f0; text-align: center; vertical-align: top; color: #333333; font-size: 14px;">
            ${item.quantity}
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top; color: #555555; font-size: 14px; white-space: nowrap;">
            ${unitFormatted} € <span style="font-size: 11px; color: #888;">${periodLabel}</span>
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: top; font-weight: 600; color: #171717; font-size: 14px; white-space: nowrap;">
            ${totalFormatted} €
          </td>
        </tr>
      `;
    })
    .join('');

  // Extras e justificações
  let extrasHtml = '';
  if (data.suggestedExtras && data.suggestedExtras.length > 0) {
    const listHtml = data.suggestedExtras
      .map((extraId) => {
        const justification = data.extrasJustifications?.[extraId] || 'Módulo complementar recomendado para otimizar o fluxo de agendamento.';
        return `
          <div style="padding: 12px 16px; background-color: #fafaf9; border-radius: 8px; border: 1px solid #e7e5e4; margin-bottom: 8px;">
            <strong style="color: #1c1917; font-size: 13px; display: block;">${escapeHtml(extraId.replace(/_/g, ' ').toUpperCase())}</strong>
            <p style="margin: 4px 0 0 0; color: #57534e; font-size: 13px; line-height: 1.45;">${escapeHtml(justification)}</p>
          </div>
        `;
      })
      .join('');

    extrasHtml = `
      <div style="margin-top: 24px;">
        <h4 style="font-size: 14px; font-weight: 600; color: #171717; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">Módulos Opcionais Recomendados</h4>
        ${listHtml}
      </div>
    `;
  }

  // Pressupostos assumidos
  let assumptionsHtml = '';
  if (data.assumptions && data.assumptions.length > 0) {
    const assumptionsList = data.assumptions
      .map((a) => `<li style="margin-bottom: 6px; color: #44403c; font-size: 13px;">${escapeHtml(a)}</li>`)
      .join('');
    assumptionsHtml = `
      <div style="margin-top: 20px; padding: 14px 18px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px;">
        <strong style="font-size: 13px; color: #92400e; display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
          <span>ℹ️ Pressupostos Considerados</span>
        </strong>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.5;">
          ${assumptionsList}
        </ul>
      </div>
    `;
  }

  // Próximos passos
  const nextStepsHtml = data.nextSteps
    .map((step, idx) => {
      return `
        <li style="margin-bottom: 10px; color: #292524; font-size: 14px; line-height: 1.5;">
          <span style="display: inline-block; width: 22px; height: 22px; background: #1c1917; color: #fff; border-radius: 50%; text-align: center; line-height: 22px; font-size: 12px; font-weight: 600; margin-right: 8px;">${idx + 1}</span>
          ${escapeHtml(step)}
        </li>
      `;
    })
    .join('');

  // Funcionalidades incluídas do plano
  const planFeaturesHtml = data.calculation.plan.includedFeatures
    .map((f) => `<li style="margin-bottom: 6px; color: #44403c; font-size: 13px;">✓ ${escapeHtml(f)}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <title>Proposta Cadence • ${safeCustomerName}</title>
  <style>
    /* Reset & Base */
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #f7f6f3;
      color: #1c1917;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
    }
    .wrapper {
      max-width: 820px;
      margin: 36px auto;
      padding: 0 16px;
    }
    .card {
      background: #ffffff;
      border-radius: 18px;
      border: 1px solid #e7e5e4;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
      padding: 44px 48px;
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #78716c;
      margin: 32px 0 14px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #f5f5f4;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 20px;
      background-color: #f5f5f4;
      color: #292524;
    }
    .badge-success {
      background-color: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .btn-primary {
      background-color: #1c1917;
      color: #ffffff !important;
    }
    .btn-primary:hover {
      background-color: #292524;
    }
    .btn-secondary {
      background-color: #f5f5f4;
      color: #1c1917 !important;
      border: 1px solid #e7e5e4;
    }
    .btn-secondary:hover {
      background-color: #e7e5e4;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    th {
      background-color: #fbfbfa;
      color: #78716c;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 12px 16px;
      border-bottom: 1px solid #e7e5e4;
    }

    /* Print Optimization */
    @media print {
      html, body {
        background: #ffffff !important;
        font-size: 11pt;
      }
      .wrapper {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .card {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      @page {
        margin: 1.6cm;
      }
      tr {
        page-break-inside: avoid;
      }
    }

    @media (max-width: 640px) {
      .card {
        padding: 24px 20px;
      }
      .header-grid {
        flex-direction: column !important;
        gap: 16px !important;
      }
      .header-right {
        text-align: left !important;
      }
    }
  </style>
</head>
<body>

  <div class="wrapper">
    <!-- Barra de Ações Superior (apenas visível no ecrã) -->
    <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 0 4px;">
      <div style="font-size: 13px; color: #78716c;">
        <span>Documento oficial de proposta • Cadence</span>
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="window.print()" class="btn btn-secondary" style="font-size: 13px; padding: 8px 16px;">
          🖨️ Imprimir / Guardar PDF
        </button>
      </div>
    </div>

    <!-- Documento Principal -->
    <div class="card">
      
      <!-- Cabeçalho Oficial -->
      <div class="header-grid" style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #f5f5f4;">
        <div>
          <!-- Logótipo e Identidade Cadence -->
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1c1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style="font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: #1c1917;">Cadence</span>
          </div>
          <p style="margin: 0; font-size: 13px; color: #78716c;">Own your time, protect your focus.</p>
        </div>

        <div class="header-right" style="text-align: right;">
          <span class="badge" style="background-color: #f5f5f4; font-family: monospace; font-size: 12px; margin-bottom: 6px; display: inline-block;">
            REF: ${safeRequestId}
          </span>
          <div style="font-size: 13px; color: #57534e; margin-top: 4px;">
            <div><strong>Emissão:</strong> ${formattedIssueDate}</div>
            <div style="color: #b45309; font-weight: 500;"><strong>Validade:</strong> ${formattedExpiryDate} (${validityDays} dias)</div>
          </div>
        </div>
      </div>

      <!-- Destinatário / Cliente -->
      <div style="margin-top: 24px; padding: 18px 20px; background-color: #fafaf9; border-radius: 12px; border: 1px solid #f5f5f4; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div>
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a8a29e; letter-spacing: 0.5px;">Proposta personalizada para</span>
          <div style="font-size: 17px; font-weight: 600; color: #1c1917; margin-top: 2px;">${safeCustomerName}</div>
          <div style="font-size: 13px; color: #78716c;">${safeCustomerEmail}</div>
        </div>
        <div style="text-align: right;">
          <span class="badge badge-success">Plano Selecionado: Cadence ${safePlanName}</span>
          <div style="font-size: 12px; color: #78716c; margin-top: 4px;">${cycleLabel}</div>
        </div>
      </div>

      <!-- Secção 1: Resumo das Necessidades Identificadas -->
      <div class="section-title">1. Diagnóstico e Enquadramento</div>
      <p style="color: #44403c; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
        ${safeSummary}
      </p>

      <!-- Secção 2: Solução Recomendada e Justificação -->
      <div class="section-title">2. Solução e Justificação de Plano</div>
      <div style="background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 12px; padding: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 18px; color: #1c1917; font-weight: 700;">
            Cadence ${safePlanName}
          </h3>
          <span style="font-size: 13px; font-weight: 600; color: #57534e;">
            ${data.seats} ${data.seats === 1 ? 'utilizador' : 'utilizadores'} • ${data.billingCycle === 'yearly' ? 'Anual' : 'Mensal'}
          </span>
        </div>

        <p style="color: #44403c; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
          ${safePlanJustification}
        </p>

        <div style="padding-top: 14px; border-top: 1px solid #f5f5f4;">
          <strong style="font-size: 12px; text-transform: uppercase; color: #78716c; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">
            Funcionalidades Chave Incluídas:
          </strong>
          <ul style="margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 4px;">
            ${planFeaturesHtml}
          </ul>
        </div>

        ${extrasHtml}
        ${assumptionsHtml}
      </div>

      <!-- Secção 3: Tabela de Investimento Financeiro -->
      <div class="section-title">3. Tabela de Investimento</div>
      <div style="border: 1px solid #e7e5e4; border-radius: 12px; overflow: hidden;">
        <table>
          <thead>
            <tr>
              <th style="width: 50%;">Item / Descrição</th>
              <th style="width: 15%; text-align: center;">Qtd</th>
              <th style="width: 17%; text-align: right;">Preço Unit.</th>
              <th style="width: 18%; text-align: right;">Total Líquido</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totais e Discriminação -->
        <div style="background-color: #fafaf9; padding: 18px 24px; border-top: 1px solid #e7e5e4;">
          <div style="display: flex; flex-direction: column; gap: 8px; max-width: 320px; margin-left: auto;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #57534e;">
              <span>Subtotal:</span>
              <span style="font-weight: 500;">${data.calculation.subtotal.toFixed(2)} €</span>
            </div>

            ${
              data.calculation.totalDiscount > 0
                ? `
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #047857; font-weight: 600;">
                <span>Descontos de Volume:</span>
                <span>-${data.calculation.totalDiscount.toFixed(2)} €</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #57534e;">
                <span>Subtotal Tributável:</span>
                <span style="font-weight: 500;">${data.calculation.subtotalAfterDiscount.toFixed(2)} €</span>
              </div>
            `
                : ''
            }

            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #57534e;">
              <span>IVA (${(data.calculation.vatRate * 100).toFixed(0)}%):</span>
              <span style="font-weight: 500;">${data.calculation.vatAmount.toFixed(2)} €</span>
            </div>

            <div style="height: 1px; background-color: #e7e5e4; margin: 4px 0;"></div>

            <div style="display: flex; justify-content: space-between; font-size: 17px; font-weight: 700; color: #1c1917;">
              <span>Total Final:</span>
              <span>${data.calculation.total.toFixed(2)} €</span>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #78716c; margin-top: 2px;">
              <span>Equivalente mensal:</span>
              <span><strong>${data.calculation.effectiveMonthlyCost.toFixed(2)} €</strong> / mês</span>
            </div>

            ${
              data.calculation.savingsVsMonthlyAnnualized
                ? `
              <div style="margin-top: 6px; padding: 6px 10px; background-color: #ecfdf5; border-radius: 6px; font-size: 11px; color: #047857; text-align: center; font-weight: 600;">
                Poupança anual de ${data.calculation.savingsVsMonthlyAnnualized.toFixed(2)} € face ao plano mensal
              </div>
            `
                : ''
            }
          </div>
        </div>
      </div>

      <!-- Secção 4: Próximos Passos -->
      <div class="section-title">4. Próximos Passos de Ativação</div>
      <ol style="margin: 0; padding: 0; list-style: none;">
        ${nextStepsHtml}
      </ol>

      <!-- Secção 5: Contacto e Botão de Ação -->
      <div class="no-print" style="margin-top: 36px; padding: 24px; background-color: #f5f5f4; border-radius: 14px; text-align: center;">
        <h4 style="margin: 0 0 6px 0; font-size: 16px; color: #1c1917;">Pronto para transformar o agendamento da tua equipa?</h4>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #78716c;">
          Esta proposta é garantida durante ${validityDays} dias. Tens dúvidas técnicas ou pretendes agendar uma demonstração guiada?
        </p>
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
          <a href="${safeBookingUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
            Agendar Reunião de Demonstração
          </a>
          <a href="mailto:${safeContactEmail}?subject=Aceitação%20de%20Proposta%20${safeRequestId}" class="btn btn-secondary">
            Responder por Email
          </a>
        </div>
      </div>

      <!-- Rodapé Formal do Documento -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f5f5f4; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 11px; color: #a8a29e;">
        <div>Cadence Scheduling Systems • Faturação com IVA em conformidade legal</div>
        <div>Validade até ${formattedExpiryDate}</div>
      </div>

    </div>
  </div>

</body>
</html>`;
}
