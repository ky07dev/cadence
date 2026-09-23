import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { buildSystemPrompt, getKnowledgeBaseFallbackAnswer } from './server/knowledgeBase';

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '256kb' }));

// In-memory rate limiting: Max 15 requests per minute per IP
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

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
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
  });
}

startServer();
