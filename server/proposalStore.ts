/**
 * =========================================================================
 * ARMAZENAMENTO E GESTÃO DE PROPOSTAS COM TOKENS INADIVINHAS — CADENCE
 * 
 * Gere tokens criptograficamente seguros (mínimo 32 caracteres) e persiste
 * os dados das propostas tanto em memória para acesso imediato como no
 * Firestore (coleção "proposals"), associando-os aos pedidos de proposta.
 * =========================================================================
 */

import crypto from 'crypto';
import { ProposalDocumentData, renderProposalHtml } from './proposalRenderer';
import { getFirebaseAdminDb, FieldValue } from './firebaseAdmin';

// Armazenamento em memória (garante acesso imediato de alta velocidade)
const proposalMemoryStore = new Map<string, ProposalDocumentData>();

/**
 * Gera um token criptograficamente seguro e inadivinhável de 48 caracteres hexadecimais (24 bytes).
 */
export function generateProposalToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Obtém a URL base pública configurada no ambiente.
 */
export function getPublicBaseUrl(): string {
  return (
    process.env.PUBLIC_BASE_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'
  ).replace(/\/+$/, '');
}

/**
 * Guarda a proposta (em memória e no Firestore) associada a um token seguro.
 */
export async function saveProposal(
  data: Omit<ProposalDocumentData, 'token'> & { token?: string }
): Promise<{ token: string; url: string; data: ProposalDocumentData }> {
  const token = data.token || generateProposalToken();
  const baseUrl = getPublicBaseUrl();
  const proposalUrl = `${baseUrl}/proposta/${token}`;

  const fullProposalData: ProposalDocumentData = {
    ...data,
    token,
    publicBaseUrl: baseUrl,
  };

  // 1. Guarda em cache de memória
  proposalMemoryStore.set(token, fullProposalData);

  // 2. Persiste no Firestore
  try {
    const db = getFirebaseAdminDb();
    const proposalDoc = {
      token,
      requestId: fullProposalData.requestId || null,
      customerName: fullProposalData.customerName,
      customerEmail: fullProposalData.customerEmail,
      summary: fullProposalData.summary,
      recommendedPlanId: fullProposalData.recommendedPlanId,
      billingCycle: fullProposalData.billingCycle,
      seats: fullProposalData.seats,
      planJustification: fullProposalData.planJustification,
      suggestedExtras: fullProposalData.suggestedExtras || [],
      extrasJustifications: fullProposalData.extrasJustifications || {},
      assumptions: fullProposalData.assumptions || [],
      nextSteps: fullProposalData.nextSteps,
      confidence: fullProposalData.confidence || 'high',
      calculation: fullProposalData.calculation,
      proposalUrl,
      validityDays: fullProposalData.validityDays ?? 15,
    };

    const sanitizedDoc = JSON.parse(JSON.stringify(proposalDoc));
    sanitizedDoc.createdAt = FieldValue.serverTimestamp();

    await db.collection('proposals').doc(token).set(sanitizedDoc);

    // Se houver um requestId associado, atualiza o documento original em proposalRequests
    if (fullProposalData.requestId) {
      try {
        await db
          .collection('proposalRequests')
          .doc(fullProposalData.requestId)
          .update({
            proposalUrl,
            proposalToken: token,
            status: 'completed',
            updatedAt: FieldValue.serverTimestamp(),
          });
      } catch (reqUpdateErr) {
        console.warn(
          `[Proposal Store] Aviso: Não foi possível atualizar o estado de proposalRequests/${fullProposalData.requestId}:`,
          reqUpdateErr
        );
      }
    }
  } catch (dbErr: any) {
    console.warn(
      `[Proposal Store Info] Firestore indisponível para escrita permanente (armazenado em cache com token "${token}"). Motivo: ${dbErr?.message || dbErr}`
    );
  }

  return {
    token,
    url: proposalUrl,
    data: fullProposalData,
  };
}

/**
 * Procura uma proposta pelo seu token seguro (primeiro na cache de memória, depois no Firestore).
 */
export async function getProposalByToken(token: string): Promise<ProposalDocumentData | null> {
  if (!token || typeof token !== 'string') return null;

  // 1. Procura em memória
  if (proposalMemoryStore.has(token)) {
    return proposalMemoryStore.get(token)!;
  }

  // 2. Procura no Firestore
  try {
    const db = getFirebaseAdminDb();
    const docSnap = await db.collection('proposals').doc(token).get();

    if (docSnap.exists) {
      const data = docSnap.data() as any;
      const proposal: ProposalDocumentData = {
        token: data.token,
        requestId: data.requestId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        validityDays: data.validityDays ?? 15,
        summary: data.summary,
        recommendedPlanId: data.recommendedPlanId,
        billingCycle: data.billingCycle,
        seats: data.seats,
        planJustification: data.planJustification,
        suggestedExtras: data.suggestedExtras || [],
        extrasJustifications: data.extrasJustifications || {},
        assumptions: data.assumptions || [],
        nextSteps: data.nextSteps || [],
        confidence: data.confidence || 'high',
        calculation: data.calculation,
        publicBaseUrl: getPublicBaseUrl(),
      };

      // Guarda em memória para acessos subsequentes
      proposalMemoryStore.set(token, proposal);
      return proposal;
    }
  } catch (err: any) {
    console.warn(`[Proposal Store] Erro ao pesquisar no Firestore por token "${token}":`, err?.message || err);
  }

  return null;
}

/**
 * Gera página de erro 404 estilizada e de marca para propostas inexistentes.
 */
export function render404ProposalHtml(reason = 'Proposta não encontrada ou expirada.'): string {
  return `<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <title>Proposta Não Encontrada • Cadence</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f7f6f3;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #1c1917;
    }
    .box {
      max-width: 480px;
      padding: 40px;
      background: #ffffff;
      border: 1px solid #e7e5e4;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
      margin: 20px;
    }
    h1 { font-size: 20px; margin: 16px 0 8px 0; color: #1c1917; }
    p { font-size: 14px; color: #78716c; line-height: 1.5; margin: 0 0 24px 0; }
    .btn {
      display: inline-block;
      background: #1c1917;
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 10px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="box">
    <div style="font-size: 40px; margin-bottom: 8px;">⏳</div>
    <h1>Proposta Não Encontrada</h1>
    <p>${reason}</p>
    <a href="/" class="btn">Voltar à Página Principal</a>
  </div>
</body>
</html>`;
}
