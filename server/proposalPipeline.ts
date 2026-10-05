/**
 * =========================================================================
 * PIPELINE ASSÍNCRONO DE PROCESSAMENTO DE PROPOSTAS — CADENCE
 * 
 * Orquestra o ciclo de vida completo de cada pedido de proposta:
 * 1. pending -> generating -> sent (ou failed com errorMessage)
 * 2. Passos: Conteúdo AI (P5) -> Cálculo (P4) -> HTML e Token (P6) -> Email (P7) -> Armazenamento
 * 3. Idempotência: Garante que nunca é enviado mais de um email por pedido (via transação / lock)
 * 4. Retentativas com Backoff exponencial (máx. 3 tentativas)
 * 5. Retoma de pedidos pendentes ou encravados (> 10 min) no arranque do servidor
 * 6. Logs claros e auditáveis por passo com o requestId correspondente
 * =========================================================================
 */

import { getFirebaseAdminDb, FieldValue } from './firebaseAdmin';
import { generateProposalContent } from './proposalService';
import { saveProposal, getPublicBaseUrl } from './proposalStore';
import { sendProposalEmail } from './emailService';

// Bloqueio local em memória para garantir exclusão mútua concorrente por processo
const localMemoryLocks = new Set<string>();

export interface ProposalRequestDoc {
  id?: string;
  name: string;
  email: string;
  needs: string;
  status: 'pending' | 'generating' | 'sent' | 'failed';
  attempts: number;
  createdAt: any;
  updatedAt: any;
  proposalUrl?: string | null;
  proposalToken?: string | null;
  sentAt?: any;
  emailMessageId?: string | null;
  errorMessage?: string | null;
}

/**
 * Enfileira o processamento de um pedido de proposta de forma assíncrona.
 * A resposta HTTP ao utilizador nunca espera por este processamento.
 */
export function enqueueProposalRequest(requestId: string): void {
  // Dispara em background via setImmediate para libertar o event-loop imediatamente
  setImmediate(() => {
    processProposalRequest(requestId).catch((err) => {
      console.error(`[Pipeline][Req: ${requestId}] Erro não capturado no processamento em segundo plano:`, err);
    });
  });
}

/**
 * Processador principal com controlo de transação, idempotência e tratamento de erros.
 */
export async function processProposalRequest(requestId: string): Promise<boolean> {
  if (!requestId) return false;

  // 1. Verificação de lock em memória local
  if (localMemoryLocks.has(requestId)) {
    console.warn(`[Pipeline][Req: ${requestId}] Já existe um processamento ativo para este ID nesta instância. A ignorar chamada duplicada.`);
    return false;
  }

  const db = getFirebaseAdminDb();
  const requestRef = db.collection('proposalRequests').doc(requestId);

  try {
    // 2. Transação Firestore para Idempotência e Bloqueio Seguro:
    // Garante que a transição para "generating" é atómica e impede envio duplo de emails.
    const acquiredData = await db.runTransaction<ProposalRequestDoc | null>(async (transaction) => {
      const snap = await transaction.get(requestRef);
      if (!snap.exists) {
        console.warn(`[Pipeline][Req: ${requestId}] Documento não encontrado no Firestore.`);
        return null;
      }

      const doc = snap.data() as ProposalRequestDoc;

      // Se já foi enviada, nunca mais processa nem envia emails repetidos
      if (doc.status === 'sent') {
        console.log(`[Pipeline][Req: ${requestId}] Proposta já foi enviada anteriormente (status="sent"). Envio duplicado evitado.`);
        return null;
      }

      // Se está em "generating", verifica se o bloqueio expirou (mais de 10 minutos)
      if (doc.status === 'generating') {
        const updatedAtDate = doc.updatedAt?.toDate ? doc.updatedAt.toDate() : new Date(doc.updatedAt || 0);
        const elapsedMinutes = (Date.now() - updatedAtDate.getTime()) / (1000 * 60);

        if (elapsedMinutes < 10) {
          console.log(`[Pipeline][Req: ${requestId}] Pedido está em estado "generating" há apenas ${elapsedMinutes.toFixed(1)} min. A aguardar conclusão.`);
          return null;
        }
        console.warn(`[Pipeline][Req: ${requestId}] Bloqueio de geração expirado (> 10 min). A recuperar pedido encravado...`);
      }

      // Se excedeu as 3 tentativas, permanece failed
      const currentAttempts = doc.attempts || 0;
      if (currentAttempts >= 3 && doc.status === 'failed') {
        console.warn(`[Pipeline][Req: ${requestId}] Número máximo de tentativas atingido (${currentAttempts}/3). Permanece "failed".`);
        return null;
      }

      const nextAttempts = currentAttempts + 1;

      // Atualiza estado para "generating", incrementa tentativas e carimba updatedAt
      transaction.update(requestRef, {
        status: 'generating',
        attempts: nextAttempts,
        updatedAt: FieldValue.serverTimestamp(),
        errorMessage: null,
      });

      return {
        ...doc,
        id: requestId,
        attempts: nextAttempts,
        status: 'generating' as const,
      };
    });

    if (!acquiredData) {
      return false;
    }

    const requestData = acquiredData;
    localMemoryLocks.add(requestId);

    console.log(`\n======================================================================`);
    console.log(`[Pipeline][Req: ${requestId}] INÍCIO DO PROCESSAMENTO (Tentativa ${requestData.attempts}/3)`);
    console.log(`[Pipeline][Req: ${requestId}] Cliente: ${requestData.name} <${requestData.email}>`);
    console.log(`======================================================================`);

    // =========================================================================
    // PASSO 1: Geração de Conteúdo com IA Gemini (Prompt 5)
    // =========================================================================
    console.log(`[Pipeline][Req: ${requestId}] Passo 1/4: A gerar análise de requisitos e recomendação com Gemini AI...`);
    const generated = await generateProposalContent({
      name: requestData.name,
      email: requestData.email,
      description: requestData.needs,
      billingCyclePreference: 'yearly',
      vatRate: 0.23,
    });
    console.log(`[Pipeline][Req: ${requestId}] Recomendação gerada: Plano "${generated.recommendedPlanId.toUpperCase()}" para ${generated.seats} utilizador(es). Confiança: ${generated.confidence}%.`);

    // =========================================================================
    // PASSO 2: Cálculo Determinístico de Preços (Prompt 4)
    // =========================================================================
    console.log(`[Pipeline][Req: ${requestId}] Passo 2/4: Cálculo determinístico validado: Subtotal: ${generated.calculation.subtotal.toFixed(2)}€ | Total (c/ IVA): ${generated.calculation.total.toFixed(2)}€`);

    // =========================================================================
    // PASSO 3: Geração de HTML, Token de Segurança e Persistência (Prompt 6)
    // =========================================================================
    console.log(`[Pipeline][Req: ${requestId}] Passo 3/4: A gravar proposta comercial e a gerar URL segura...`);
    const saved = await saveProposal({
      requestId,
      customerName: requestData.name,
      customerEmail: requestData.email,
      createdAt: new Date(),
      validityDays: 15,
      summary: generated.summary,
      recommendedPlanId: generated.recommendedPlanId,
      billingCycle: generated.billingCycle,
      seats: generated.seats,
      planJustification: generated.planJustification,
      suggestedExtras: generated.suggestedExtras,
      extrasJustifications: generated.extrasJustifications,
      assumptions: generated.assumptions,
      nextSteps: generated.nextSteps,
      confidence: generated.confidence,
      calculation: generated.calculation,
    });
    console.log(`[Pipeline][Req: ${requestId}] Proposta guardada com sucesso! Token: ${saved.token.substring(0, 12)}... URL: ${saved.url}`);

    // =========================================================================
    // PASSO 4: Envio de Email Transacional para o Cliente (Prompt 7)
    // =========================================================================
    console.log(`[Pipeline][Req: ${requestId}] Passo 4/4: A disparar email transacional para "${requestData.email}"...`);
    const emailResult = await sendProposalEmail({
      customerName: requestData.name,
      customerEmail: requestData.email,
      proposalUrl: saved.url,
      planName: generated.calculation.plan.name,
      totalFormatted: `${generated.calculation.total.toFixed(2)} €`,
      billingCycle: generated.billingCycle,
      seats: generated.seats,
      validityDays: 15,
    });
    console.log(`[Pipeline][Req: ${requestId}] Email entregue ao provedor (${emailResult.provider.toUpperCase()}). Message ID: "${emailResult.messageId}".`);

    // =========================================================================
    // CONCLUSÃO: Transição para "sent" com metadados finais
    // =========================================================================
    await requestRef.update({
      status: 'sent',
      proposalUrl: saved.url,
      proposalToken: saved.token,
      sentAt: FieldValue.serverTimestamp(),
      emailMessageId: emailResult.messageId,
      updatedAt: FieldValue.serverTimestamp(),
      errorMessage: null,
    });

    console.log(`[Pipeline][Req: ${requestId}] ✅ SUCESSO: Pedido concluído com sucesso e marcado como "sent".`);
    console.log(`======================================================================\n`);
    return true;

  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error(`[Pipeline][Req: ${requestId}] ❌ ERRO no pipeline: ${errorMsg}`);

    // Gestão de Retentativa com Backoff Exponencial
    try {
      const snap = await requestRef.get();
      const currentAttempts = snap.exists ? (snap.data()?.attempts || 1) : 1;

      if (currentAttempts < 3) {
        // Backoff exponencial: Tentativa 1 = 3s, Tentativa 2 = 10s
        const backoffMs = currentAttempts === 1 ? 3000 : 10000;
        console.log(`[Pipeline][Req: ${requestId}] A agendar nova tentativa (${currentAttempts + 1}/3) dentro de ${backoffMs / 1000}s com backoff...`);

        await requestRef.update({
          status: 'pending',
          errorMessage: `Tentativa ${currentAttempts} falhou: ${errorMsg}`,
          updatedAt: FieldValue.serverTimestamp(),
        });

        setTimeout(() => {
          enqueueProposalRequest(requestId);
        }, backoffMs);
      } else {
        console.error(`[Pipeline][Req: ${requestId}] Esgotadas todas as 3 tentativas. A definir status="failed".`);
        await requestRef.update({
          status: 'failed',
          errorMessage: `Falha definitiva após 3 tentativas: ${errorMsg}`,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    } catch (updateErr: any) {
      console.error(`[Pipeline][Req: ${requestId}] Falha ao registar estado de erro no Firestore:`, updateErr?.message);
    }

    return false;
  } finally {
    localMemoryLocks.delete(requestId);
  }
}

/**
 * Retoma pedidos pendentes ou que ficaram em "generating" por mais de 10 minutos.
 * Invocado no arranque do servidor.
 */
export async function resumeStaleRequests(): Promise<void> {
  try {
    const db = getFirebaseAdminDb();
    console.log('[Pipeline Startup] A verificar pedidos pendentes ou encravados no Firestore...');

    // 1. Procurar pedidos "pending" que ainda não atingiram o limite de 3 tentativas
    const pendingSnap = await db
      .collection('proposalRequests')
      .where('status', '==', 'pending')
      .limit(20)
      .get();

    let resumedCount = 0;

    for (const doc of pendingSnap.docs) {
      const data = doc.data();
      if ((data.attempts || 0) < 3) {
        console.log(`[Pipeline Startup] A retomar pedido pendente: ${doc.id} (${data.name} <${data.email}>)`);
        enqueueProposalRequest(doc.id);
        resumedCount++;
      }
    }

    // 2. Procurar pedidos em "generating" encravados há mais de 10 minutos
    const generatingSnap = await db
      .collection('proposalRequests')
      .where('status', '==', 'generating')
      .limit(20)
      .get();

    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    for (const doc of generatingSnap.docs) {
      const data = doc.data();
      const updatedAtDate = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || 0);

      if (updatedAtDate.getTime() < tenMinutesAgo) {
        console.warn(`[Pipeline Startup] A recuperar pedido encravado em "generating" (> 10 min): ${doc.id}`);
        // Liberta para pending e enfileira
        await doc.ref.update({
          status: 'pending',
          errorMessage: 'Recuperado de bloqueio no arranque do servidor (> 10 min)',
          updatedAt: FieldValue.serverTimestamp(),
        });
        enqueueProposalRequest(doc.id);
        resumedCount++;
      }
    }

    if (resumedCount === 0) {
      console.log('[Pipeline Startup] Nenhum pedido pendente ou encravado detetado.');
    } else {
      console.log(`[Pipeline Startup] ${resumedCount} pedido(s) retomado(s) com sucesso.`);
    }
  } catch (err: any) {
    console.warn('[Pipeline Startup Note] Não foi possível verificar pedidos no Firestore no arranque:', err?.message || err);
  }
}
