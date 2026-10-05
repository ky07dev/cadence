/**
 * =========================================================================
 * ROTAS DO PAINEL DE ADMINISTRAÇÃO (/api/admin) — CADENCE
 * 
 * Endpoints protegidos:
 * - POST /api/admin/login
 * - POST /api/admin/logout
 * - GET  /api/admin/me
 * - GET  /api/admin/requests (lista com filtros, pesquisa e ordenação)
 * - GET  /api/admin/requests/:id (detalhe completo)
 * - POST /api/admin/requests/:id/retry (retentativa para failed/pending)
 * - POST /api/admin/requests/:id/resend-email (reenvio de email para propostas sent)
 * =========================================================================
 */

import { Router, Request, Response } from 'express';
import { getFirebaseAdminDb, FieldValue } from './firebaseAdmin';
import {
  checkAdminPassword,
  generateAdminSessionToken,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  requireAdminAuth,
  verifyAdminSessionToken,
} from './adminAuth';
import { enqueueProposalRequest } from './proposalPipeline';
import { getProposalByToken } from './proposalStore';
import { sendProposalEmail } from './emailService';

const router = Router();

// Rate limiting para proteção contra ataques de força bruta no login (máx. 5 tentativas a cada 5 min por IP)
interface LoginAttemptRecord {
  count: number;
  resetAt: number;
}
const loginAttemptsMap = new Map<string, LoginAttemptRecord>();

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxAttempts = 5;

  const record = loginAttemptsMap.get(ip);
  if (!record || now > record.resetAt) {
    loginAttemptsMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * Autenticação de Administrador
 * POST /api/admin/login
 */
router.post('/login', (req: Request, res: Response): void => {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

  if (!checkLoginRateLimit(clientIp)) {
    res.status(429).json({
      error: 'Demasiadas tentativas de início de sessão. Por favor aguarda 5 minutos.',
    });
    return;
  }

  const { password } = req.body || {};

  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Palavra-passe de administrador é obrigatória.' });
    return;
  }

  if (!checkAdminPassword(password)) {
    // Retorna 401 e não revela dados
    res.status(401).json({ error: 'Palavra-passe incorreta. Acesso não autorizado.' });
    return;
  }

  // Sucesso: limpa registo de tentativas para este IP
  loginAttemptsMap.delete(clientIp);

  const token = generateAdminSessionToken();
  setAdminSessionCookie(res, token);

  res.status(200).json({
    success: true,
    token,
    message: 'Sessão administrativa iniciada com sucesso.',
  });
});

/**
 * Encerramento de Sessão
 * POST /api/admin/logout
 */
router.post('/logout', (_req: Request, res: Response): void => {
  clearAdminSessionCookie(res);
  res.status(200).json({ success: true, message: 'Sessão terminada.' });
});

/**
 * Verificação do Estado da Sessão
 * GET /api/admin/me
 */
router.get('/me', (req: Request, res: Response): void => {
  let token = req.cookies?.['cadence_admin_session'];
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7).trim();
  }

  if (!verifyAdminSessionToken(token)) {
    res.status(401).json({ authenticated: false, error: 'Sessão inválida ou expirada.' });
    return;
  }

  res.status(200).json({ authenticated: true });
});

/**
 * Listagem de Pedidos com Filtros, Pesquisa e Ordenação
 * GET /api/admin/requests
 */
router.get('/requests', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, sort = 'desc' } = req.query as {
      status?: string;
      search?: string;
      sort?: string;
    };

    const db = getFirebaseAdminDb();
    const snapshot = await db.collection('proposalRequests').get();

    let requests = snapshot.docs.map((doc) => {
      const data = doc.data();
      
      const toIsoString = (val: any): string | null => {
        if (!val) return null;
        if (typeof val.toDate === 'function') return val.toDate().toISOString();
        if (val instanceof Date) return val.toISOString();
        if (typeof val._seconds === 'number') return new Date(val._seconds * 1000).toISOString();
        if (typeof val === 'string') return val;
        return null;
      };

      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        needs: data.needs || '',
        descriptionSummary: data.needs ? (data.needs.length > 80 ? data.needs.substring(0, 80) + '...' : data.needs) : '',
        status: data.status || 'pending',
        attempts: data.attempts || 0,
        createdAt: toIsoString(data.createdAt),
        updatedAt: toIsoString(data.updatedAt),
        sentAt: toIsoString(data.sentAt),
        proposalUrl: data.proposalUrl || null,
        proposalToken: data.proposalToken || null,
        emailMessageId: data.emailMessageId || null,
        errorMessage: data.errorMessage || null,
        proposalTotal: null as string | null,
      };
    });

    // Enriquecimento assíncrono do total da proposta se houver proposalToken
    await Promise.all(
      requests.map(async (reqItem) => {
        if (reqItem.proposalToken) {
          try {
            const proposal = await getProposalByToken(reqItem.proposalToken);
            if (proposal?.calculation?.total !== undefined) {
              reqItem.proposalTotal = `${proposal.calculation.total.toFixed(2)} €`;
            }
          } catch {
            // Silencioso em caso de proposta remota não encontrada
          }
        }
      })
    );

    // 1. Filtragem por Estado
    if (status && status !== 'all') {
      requests = requests.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }

    // 2. Pesquisa por Nome ou Email
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      requests = requests.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.email.toLowerCase().includes(term) ||
          r.id.toLowerCase().includes(term)
      );
    }

    // 3. Ordenação por Data (newest first por padrão)
    requests.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sort === 'asc' ? timeA - timeB : timeB - timeA;
    });

    res.status(200).json({
      requests,
      totalCount: requests.length,
      metrics: {
        total: snapshot.size,
        sent: requests.filter((r) => r.status === 'sent').length,
        generating: requests.filter((r) => r.status === 'generating').length,
        pending: requests.filter((r) => r.status === 'pending').length,
        failed: requests.filter((r) => r.status === 'failed').length,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[GET /api/admin/requests Error]', error?.message || error);
    res.status(500).json({ error: 'Erro ao carregar lista de pedidos.' });
  }
});

/**
 * Detalhe de um Pedido
 * GET /api/admin/requests/:id
 */
router.get('/requests/:id', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const db = getFirebaseAdminDb();
    const docSnap = await db.collection('proposalRequests').doc(id).get();

    if (!docSnap.exists) {
      res.status(404).json({ error: 'Pedido não encontrado.' });
      return;
    }

    const data = docSnap.data()!;
    let proposalData: any = null;

    if (data.proposalToken) {
      proposalData = await getProposalByToken(data.proposalToken);
    }

    res.status(200).json({
      id: docSnap.id,
      name: data.name,
      email: data.email,
      needs: data.needs,
      status: data.status,
      attempts: data.attempts || 0,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      sentAt: data.sentAt?.toDate?.() || data.sentAt,
      proposalUrl: data.proposalUrl || null,
      proposalToken: data.proposalToken || null,
      emailMessageId: data.emailMessageId || null,
      errorMessage: data.errorMessage || null,
      proposal: proposalData,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[GET /api/admin/requests/:id Error]`, error?.message || error);
    res.status(500).json({ error: 'Erro ao obter detalhes do pedido.' });
  }
});

/**
 * Ação: Retentar Pedido Falhado ou Bloqueado
 * POST /api/admin/requests/:id/retry
 */
router.post('/requests/:id/retry', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const db = getFirebaseAdminDb();
    const requestRef = db.collection('proposalRequests').doc(id);
    const snap = await requestRef.get();

    if (!snap.exists) {
      res.status(404).json({ error: 'Pedido não encontrado.' });
      return;
    }

    const data = snap.data()!;

    if (data.status === 'sent') {
      res.status(400).json({ error: 'Este pedido já foi enviado com sucesso. Para reexpedir, utiliza a opção "Reenviar Email".' });
      return;
    }

    // Reinicia contagem de tentativas e define como "pending"
    await requestRef.update({
      status: 'pending',
      attempts: 0,
      errorMessage: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[Admin Action] Pedido "${id}" reiniciado manualmente pelo administrador.`);

    // Enfileira processamento assíncrono em background
    enqueueProposalRequest(id);

    res.status(200).json({
      success: true,
      message: 'Pedido reiniciado com sucesso. A gerar proposta em segundo plano...',
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[POST /api/admin/requests/:id/retry Error]`, error?.message || error);
    res.status(500).json({ error: 'Erro ao reiniciar o pedido.' });
  }
});

/**
 * Ação: Reenviar Email de Proposta Já Gerada
 * POST /api/admin/requests/:id/resend-email
 */
router.post('/requests/:id/resend-email', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const db = getFirebaseAdminDb();
    const requestRef = db.collection('proposalRequests').doc(id);
    const snap = await requestRef.get();

    if (!snap.exists) {
      res.status(404).json({ error: 'Pedido não encontrado.' });
      return;
    }

    const data = snap.data()!;

    if (data.status !== 'sent' || !data.proposalToken) {
      res.status(400).json({
        error: 'Apenas propostas concluídas e com URL gerada podem ser reenviadas por email.',
      });
      return;
    }

    // Procura os dados da proposta existente para garantir exatidão
    const proposal = await getProposalByToken(data.proposalToken);
    if (!proposal) {
      res.status(404).json({ error: 'Dados da proposta não encontrados no repositório.' });
      return;
    }

    console.log(`[Admin Action] A reenviar email da proposta "${id}" para "${data.email}"...`);

    const emailResult = await sendProposalEmail({
      customerName: data.name,
      customerEmail: data.email,
      proposalUrl: data.proposalUrl,
      planName: proposal.calculation.plan.name,
      totalFormatted: `${proposal.calculation.total.toFixed(2)} €`,
      billingCycle: proposal.billingCycle,
      seats: proposal.seats,
      validityDays: proposal.validityDays || 15,
    });

    // Atualiza sentAt e emailMessageId
    await requestRef.update({
      sentAt: FieldValue.serverTimestamp(),
      emailMessageId: emailResult.messageId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[Admin Action] Email reenviado com sucesso para "${data.email}". Novo Message ID: ${emailResult.messageId}`);

    res.status(200).json({
      success: true,
      message: `Email reenviado com sucesso para ${data.email}!`,
      messageId: emailResult.messageId,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[POST /api/admin/requests/:id/resend-email Error]`, error?.message || error);
    res.status(500).json({ error: 'Erro ao reenviar o email da proposta: ' + error.message });
  }
});

/**
 * Ação: Eliminar Pedido e Proposta Associada ao abrigo do RGPD (Direito ao Esquecimento - Art. 17 RGPD)
 * DELETE /api/admin/requests/:id
 */
router.delete('/requests/:id', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const db = getFirebaseAdminDb();
    const requestRef = db.collection('proposalRequests').doc(id);
    const snap = await requestRef.get();

    if (!snap.exists) {
      res.status(404).json({ error: 'Pedido não encontrado.' });
      return;
    }

    const data = snap.data()!;

    // Se houver uma proposta criada associada, eliminar também da coleção "proposals"
    if (data.proposalToken) {
      try {
        const proposalQuery = await db.collection('proposals').where('token', '==', data.proposalToken).get();
        for (const pDoc of proposalQuery.docs) {
          await pDoc.ref.delete();
          console.log(`[GDPR Erasure] Proposta associada "${pDoc.id}" eliminada com sucesso.`);
        }
      } catch (err: any) {
        console.warn(`[GDPR Erasure Note] Erro ao eliminar proposta associada:`, err?.message || err);
      }
    }

    // Eliminar o registo do pedido
    await requestRef.delete();
    console.log(`[GDPR Erasure] Pedido "${id}" (${data.name} <${data.email}>) eliminado permanentemente ao abrigo do RGPD.`);

    res.status(200).json({
      success: true,
      message: 'Dados do pedido e proposta associada eliminados permanentemente ao abrigo do RGPD.',
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[DELETE /api/admin/requests/:id Error]`, error?.message || error);
    res.status(500).json({ error: 'Erro ao eliminar os dados do pedido.' });
  }
});

export default router;
