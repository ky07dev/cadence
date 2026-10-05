import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { buildSystemPrompt, getKnowledgeBaseFallbackAnswer } from './server/knowledgeBase';
import { getFirebaseAdminDb, FieldValue } from './server/firebaseAdmin';
import { renderProposalHtml } from './server/proposalRenderer';
import { getProposalByToken, saveProposal, render404ProposalHtml, getPublicBaseUrl } from './server/proposalStore';
import { generateProposalContent } from './server/proposalService';
import { sendProposalEmail } from './server/emailService';
import { enqueueProposalRequest, resumeStaleRequests } from './server/proposalPipeline';
import cookieParser from 'cookie-parser';
import adminRoutes from './server/adminRoutes';

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());

// Rotas administrativas protegidas (/api/admin)
app.use('/api/admin', adminRoutes);

// In-memory rate limiting: Max 15 requests per minute per IP for Chatbot
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 15;

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

// In-memory rate limiting for Proposal Requests: Max 5 requests per hour per IP
interface ProposalRateLimitRecord {
  count: number;
  resetAt: number;
}
const proposalRateLimitMap = new Map<string, ProposalRateLimitRecord>();

function checkProposalRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hora
  const maxRequests = 5;

  const record = proposalRateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    proposalRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true };
}

// In-memory rate limiting para visualização de propostas públicas (máx. 60 visualizações/minuto por IP)
interface ViewRateLimitRecord {
  count: number;
  resetAt: number;
}
const viewRateLimitMap = new Map<string, ViewRateLimitRecord>();

function checkViewRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxViews = 60;
  const rec = viewRateLimitMap.get(ip);
  if (!rec || now > rec.resetAt) {
    viewRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (rec.count >= maxViews) return false;
  rec.count += 1;
  return true;
}

// In-memory question log to identify knowledge gaps (stores sanitized questions, NO personal data)
interface QuestionLog {
  timestamp: string;
  query: string;
  charCount: number;
}
const questionLogs: QuestionLog[] = [];

// Lazy Gemini SDK client initialization
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

/**
 * Sanitiza a mensagem do utilizador antes do envio à API.
 * Remove caracteres de controlo invisíveis e trunca o texto para evitar sobrecarga.
 */
function sanitizeInput(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .trim()
    .slice(0, 1000);
}

/**
 * Sanitiza campos de texto com limite dinâmico de caracteres
 */
function sanitizeText(text: unknown, maxLength: number): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .trim()
    .slice(0, maxLength);
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Endpoint para Pedidos de Proposta de Plano
 * POST /api/proposal-requests
 * Body: { name: string, email: string, needs: string, honeypot?: string }
 */
app.post('/api/proposal-requests', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    // 1. Verificação de Honeypot Anti-Spam (rejeita se preenchido)
    const honeypot = typeof req.body.honeypot === 'string' ? req.body.honeypot.trim() : '';
    if (honeypot.length > 0) {
      console.warn(`[Proposal Request] Spam bloqueado via honeypot do IP ${clientIp}`);
      res.status(400).json({ error: 'Pedido inválido detetado.' });
      return;
    }

    // 2. Limitação de taxa por endereço IP (Máximo 5 pedidos por hora)
    const rateCheck = checkProposalRateLimit(clientIp);
    if (!rateCheck.allowed) {
      if (rateCheck.retryAfterSeconds) {
        res.setHeader('Retry-After', rateCheck.retryAfterSeconds);
      }
      res.status(429).json({
        error: 'Limite de pedidos atingido para este endereço IP (máximo de 5 pedidos por hora). Por favor tenta mais tarde.',
      });
      return;
    }

    // 3. Validação e sanitização no servidor
    const rawName = req.body.name;
    const rawEmail = req.body.email;
    const rawNeeds = req.body.needs || req.body.description;

    const name = sanitizeText(rawName, 100);
    const email = sanitizeText(rawEmail, 150).toLowerCase();
    const needs = sanitizeText(rawNeeds, 2000);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

    if (!name || name.length < 2 || name.length > 100) {
      res.status(400).json({
        error: 'O nome deve ter entre 2 e 100 caracteres.',
        field: 'name',
      });
      return;
    }

    if (!email || !emailRegex.test(email)) {
      res.status(400).json({
        error: 'Por favor, introduz um endereço de email válido.',
        field: 'email',
      });
      return;
    }

    if (!needs || needs.length < 20 || needs.length > 2000) {
      res.status(400).json({
        error: 'A descrição das necessidades deve ter entre 20 e 2000 caracteres.',
        field: 'needs',
      });
      return;
    }

    // 3.1. Consentimento para tratamento de dados pessoais (RGPD)
    const rawConsent = req.body.consent;
    if (rawConsent === false) {
      res.status(400).json({
        error: 'É obrigatório consentir o tratamento dos teus dados para podermos emitir a proposta personalizada ao abrigo do RGPD.',
        field: 'consent',
      });
      return;
    }

    // 4. Gravação na coleção "proposalRequests" do Firestore com Firebase Admin SDK
    let docId: string;
    try {
      const db = getFirebaseAdminDb();
      const proposalDoc = {
        name,
        email,
        needs,
        status: 'pending',
        gdprConsent: true,
        gdprConsentTimestamp: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        proposalUrl: null,
        errorMessage: null,
        attempts: 0,
      };

      const docRef = await db.collection('proposalRequests').add(proposalDoc);
      docId = docRef.id;
      console.log(`[Proposal Requests] Nova proposta criada no Firestore com ID "${docId}" para "${email}".`);
    } catch (dbErr: any) {
      // Se as credenciais do Firebase Admin ainda estiverem pendentes de configuração conforme o README
      const isPermDenied = dbErr?.code === 7 || dbErr?.message?.includes('Missing or insufficient permissions');
      if (isPermDenied || !process.env.FIREBASE_SERVICE_ACCOUNT) {
        docId = 'prop_' + Math.random().toString(36).substring(2, 11);
        console.warn(
          `[Proposal Requests Note] Firebase Admin retornou permissões pendentes para escrita direta (FIREBASE_SERVICE_ACCOUNT ainda não configurada). Pedido registado com ID "${docId}". Consulta o README.md para configurar a chave privada da conta de serviço.`
        );
      } else {
        throw dbErr;
      }
    }

    res.status(201).json({
      id: docId,
      message: 'Pedido de proposta recebido com sucesso.',
    });

    // 5. Inicia o pipeline assíncrono em segundo plano (não bloqueia a resposta HTTP)
    enqueueProposalRequest(docId);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[Proposal Requests Error]', error?.message || error);
    res.status(500).json({
      error: 'Ocorreu um erro interno ao registar a proposta. Por favor tenta novamente.',
    });
  }
});

/**
 * Endpoint para consulta do estado de um pedido de proposta
 * GET /api/proposal-requests/:id
 */
app.get('/api/proposal-requests/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const db = getFirebaseAdminDb();
    const docSnap = await db.collection('proposalRequests').doc(id).get();

    if (!docSnap.exists) {
      res.status(404).json({ error: 'Pedido de proposta não encontrado.' });
      return;
    }

    const data = docSnap.data();
    res.status(200).json({
      id: docSnap.id,
      name: data?.name,
      email: data?.email,
      status: data?.status,
      attempts: data?.attempts || 0,
      proposalUrl: data?.proposalUrl || null,
      proposalToken: data?.proposalToken || null,
      sentAt: data?.sentAt || null,
      emailMessageId: data?.emailMessageId || null,
      errorMessage: data?.errorMessage || null,
      createdAt: data?.createdAt || null,
      updatedAt: data?.updatedAt || null,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[GET /api/proposal-requests/:id Error]`, error?.message || error);
    res.status(500).json({ error: 'Erro ao consultar o estado do pedido.' });
  }
});

/**
 * Rota pública de visualização de propostas comerciais
 * GET /proposta/:token
 * - Cabeçalho noindex estrito (não indexável por motores de busca)
 * - Devolve 404 para tokens inválidos ou inexistentes
 * - Conteúdo HTML autocontido, responsivo e adaptado para impressão em PDF
 */
app.get('/proposta/:token', async (req: Request, res: Response): Promise<void> => {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  if (!checkViewRateLimit(clientIp)) {
    res.status(429).send(render404ProposalHtml('Demasiados pedidos a partir deste endereço IP. Por favor aguarda um momento.'));
    return;
  }

  const token = req.params.token;

  // 1. Cabeçalhos de privacidade (noindex, nofollow, noarchive) e não armazenamento em cache público
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

  // 2. Validação rigorosa do formato do token (mínimo 32 caracteres alfanuméricos)
  if (!token || !/^[a-zA-Z0-9_-]{32,128}$/.test(token)) {
    res.status(404).send(render404ProposalHtml('O identificador de proposta fornecido é inválido.'));
    return;
  }

  try {
    const proposal = await getProposalByToken(token);
    if (!proposal) {
      res.status(404).send(render404ProposalHtml('Esta proposta não foi encontrada ou já ultrapassou o seu prazo de validade.'));
      return;
    }

    const html = renderProposalHtml(proposal);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`[GET /proposta/:token Error]`, error?.message || error);
    res.status(500).send(render404ProposalHtml('Ocorreu um erro ao carregar a proposta solicitada.'));
  }
});

/**
 * Endpoint de geração e persistência de proposta completa
 * POST /api/proposals/generate
 * Gera a recomendação via generateProposalContent, calcula montantes e guarda com token seguro.
 */
app.post('/api/proposals/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, description, billingCyclePreference, vatRate, requestId } = req.body;

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      res.status(400).json({ error: 'A descrição das necessidades é obrigatória (mínimo 10 caracteres).' });
      return;
    }

    // 1. Gera o conteúdo da proposta com Gemini AI + cálculo determinístico
    const generated = await generateProposalContent({
      name,
      email,
      description: description.trim(),
      billingCyclePreference,
      vatRate,
    });

    // 2. Guarda a proposta com token criptográfico seguro
    const saved = await saveProposal({
      requestId,
      customerName: name || 'Estimado(a) Cliente',
      customerEmail: email || '',
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

    // 3. Envio de email automático se o serviço estiver configurado
    let emailStatus = null;
    if (email) {
      try {
        const emailResult = await sendProposalEmail({
          customerName: name || 'Estimado(a) Cliente',
          customerEmail: email,
          proposalUrl: saved.url,
          planName: saved.data.calculation.plan.name,
          totalFormatted: `${saved.data.calculation.total.toFixed(2)} €`,
          billingCycle: saved.data.billingCycle,
          seats: saved.data.seats,
          validityDays: saved.data.validityDays ?? 15,
        });
        emailStatus = { sent: true, messageId: emailResult.messageId, provider: emailResult.provider };
      } catch (emailErr: any) {
        console.warn(`[POST /api/proposals/generate Notice] Email não enviado para "${email}": ${emailErr?.message}`);
        emailStatus = { sent: false, error: emailErr?.message };
      }
    }

    res.status(201).json({
      token: saved.token,
      url: saved.url,
      proposal: saved.data,
      emailStatus,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[POST /api/proposals/generate Error]:', error?.message || error);
    res.status(500).json({ error: error.message || 'Erro ao gerar proposta.' });
  }
});

/**
 * Endpoint dedicado para envio manual/reenvio de proposta por email
 * POST /api/proposals/send-email
 */
app.post('/api/proposals/send-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, email: overrideEmail } = req.body;
    if (!token) {
      res.status(400).json({ error: 'O token da proposta é obrigatório.' });
      return;
    }

    const proposal = await getProposalByToken(token);
    if (!proposal) {
      res.status(404).json({ error: 'Proposta não encontrada ou expirada.' });
      return;
    }

    const targetEmail = overrideEmail || proposal.customerEmail;
    if (!targetEmail) {
      res.status(400).json({ error: 'Nenhum email de destinatário associado a esta proposta.' });
      return;
    }

    const result = await sendProposalEmail({
      customerName: proposal.customerName,
      customerEmail: targetEmail,
      proposalUrl: `${getPublicBaseUrl()}/proposta/${proposal.token}`,
      planName: proposal.calculation.plan.name,
      totalFormatted: `${proposal.calculation.total.toFixed(2)} €`,
      billingCycle: proposal.billingCycle,
      seats: proposal.seats,
      validityDays: proposal.validityDays ?? 15,
    });

    res.status(200).json({
      success: true,
      message: `Email enviado com sucesso para ${result.recipient}.`,
      result,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[POST /api/proposals/send-email Error]:', error?.message || error);
    res.status(500).json({ error: error.message || 'Falha no envio de email.' });
  }
});

/**
 * Endpoint para gravação direta de proposta calculada
 * POST /api/proposals/save
 */
app.post('/api/proposals/save', async (req: Request, res: Response): Promise<void> => {
  try {
    const saved = await saveProposal(req.body);
    res.status(201).json(saved);
  } catch (err: unknown) {
    const error = err as Error;
    res.status(500).json({ error: error.message || 'Erro ao guardar proposta' });
  }
});

// Endpoint para consulta das perguntas frequentes/logs anónimos (para auditoria interna)
app.get('/api/chat/logs', (_req: Request, res: Response) => {
  res.json({
    totalQuestions: questionLogs.length,
    recentQuestions: questionLogs.slice(-20),
  });
});

/**
 * Endpoint de Chatbot com IA (Gemini API)
 * POST /api/chat
 * Payload esperado:
 * {
 *   "message": "Como funcionam os buffers?",
 *   "history": [
 *     { "role": "user" | "model", "text": "..." }
 *   ]
 * }
 */
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    // 1. Rate Limiting Check
    if (!checkRateLimit(clientIp)) {
      res.status(429).json({
        error: 'Demasiados pedidos. Aguarda um momento antes de enviar outra mensagem para o assistente.',
      });
      return;
    }

    const { message, history } = req.body;

    // 2. Validação e sanitização
    const sanitizedMessage = sanitizeInput(message);
    if (!sanitizedMessage) {
      res.status(400).json({ error: 'A mensagem não pode estar vazia.' });
      return;
    }

    // 3. Registo anónimo da pergunta para análise de lacunas na base de conhecimento
    questionLogs.push({
      timestamp: new Date().toISOString(),
      query: sanitizedMessage,
      charCount: sanitizedMessage.length,
    });
    // Manter tamanho razoável dos logs em memória
    if (questionLogs.length > 500) {
      questionLogs.shift();
    }
    console.log(`[Chatbot Log] Nova questão: "${sanitizedMessage.slice(0, 80)}..."`);

    // 4. Verificação de Chave de API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[Chatbot API] A variável de ambiente GEMINI_API_KEY não foi configurada.');
      res.json({
        reply: 'A chave da API Gemini não está configurada no servidor. Podes configurá-la nas definições ou contactar a nossa equipa em support@cadence.app.',
      });
      return;
    }

    // 5. Preparar histórico de mensagens (últimas 6 mensagens para manter contexto)
    const validHistory: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-6);
      for (const item of recentHistory) {
        if (
          item &&
          (item.role === 'user' || item.role === 'model') &&
          typeof item.text === 'string'
        ) {
          const sanitizedText = sanitizeInput(item.text);
          if (sanitizedText) {
            validHistory.push({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: sanitizedText }],
            });
          }
        }
      }
    }

    // Montar os conteúdos para a chamada da Gemini API
    const contents = [
      ...validHistory,
      {
        role: 'user',
        parts: [{ text: sanitizedMessage }],
      },
    ];

    // 6. Chamada à Gemini API usando @google/genai com fallback e recuperação resiliente
    const ai = getGeminiClient();
    const systemPrompt = buildSystemPrompt();

    // Modelos candidatos oficiais com failover resiliente:
    // 1. gemini-flash-latest (canal padrão de alta disponibilidade)
    // 2. gemini-3.1-flash-lite (modelo ultrarrápido com quota e infraestrutura dedicada)
    // 3. gemini-3.8-flash (modelo complementar)
    const candidateModels = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let lastError: any = null;
    let replyText = '';

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.1,
            topP: 0.9,
          },
        });

        if (response.text?.trim()) {
          replyText = response.text.trim();
          break;
        }
      } catch (callError: any) {
        lastError = callError;
        const status = callError?.status || callError?.error?.code || callError?.code;
        const msg = callError?.message || JSON.stringify(callError);
        const isAuthError =
          status === 401 ||
          status === 403 ||
          msg.includes('UNAUTHENTICATED') ||
          msg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
          msg.includes('API_KEY_INVALID') ||
          msg.includes('API_KEY_SERVICE_BLOCKED');

        if (isAuthError) {
          // Erro de autenticação: aciona imediatamente a base de conhecimento local
          break;
        }

        console.warn(`[Gemini API Notice] Modelo ${modelName} indisponível (status ${status}): ${msg.slice(0, 100)}. A tentar modelo alternativo...`);
        // Se for erro de quota (429) ou sobrecarga temporária (503), pausa breve antes do próximo candidato
        if (status === 503 || status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
        continue;
      }
    }

    // Se nenhum modelo da API conseguiu responder devido a sobrecarga (503) ou quota de pedidos (429),
    // recorrer ao motor de resposta local baseado estritamente na Base de Conhecimento oficial.
    if (!replyText) {
      const fallbackAnswer = getKnowledgeBaseFallbackAnswer(sanitizedMessage);
      if (fallbackAnswer) {
        console.log(`[Chatbot Info] Resposta servida com sucesso via Base de Conhecimento para: "${sanitizedMessage.slice(0, 40)}"`);
        res.json({ reply: fallbackAnswer });
        return;
      }

      // Resposta de salvaguarda inteligente quando os modelos remotos estão sob pico temporário
      res.json({
        reply: 'Obrigado pela tua questão sobre a Cadence! Podes agendar compromissos sem rastreamento de terceiros, configurar buffers de foco automáticos e sincronizar com Google Calendar, Outlook e CalDAV. Para esclarecimentos diretos ou demonstrações, podes clicar em "See a live demo" no topo da página ou contactar-nos em support@cadence.app.',
      });
      return;
    }

    res.json({ reply: replyText });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[Chatbot Error]', error?.message || error);
    res.status(500).json({
      error: 'Não consegui processar isso agora, tenta novamente ou contacta support@cadence.app.',
    });
  }
});

// Setup Vite middleware in dev, or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cadence Server running on http://0.0.0.0:${PORT}`);
    // Retoma pedidos pendentes ou encravados (> 10 min) no arranque
    resumeStaleRequests().catch((err) => {
      console.warn('[Startup] Erro ao retomar pedidos:', err?.message || err);
    });
  });
}

startServer();
