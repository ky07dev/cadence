# Cadence — Motor de Agendamento Local-First & Pipeline de Propostas Comerciais

Bem-vindo ao repositório oficial da **Cadence**, a plataforma de agendamento flexível concebida com princípios *local-first*, soberania de tempo, ausência total de rastreamento de terceiros e um motor inteligente de propostas comerciais automatizadas.

---

## 🏗️ 1. Arquitetura do Sistema

```
[Cliente Web / Landing Page]
         │  POST /api/proposal-requests (< 250ms resposta imediata)
         ▼
[Express Server + Firebase Admin SDK]
         │
         ├─── Grava pedido em Firestore: collection("proposalRequests") [status: "pending"]
         │
         └─── Pipeline Assíncrono em Segundo Plano (server/proposalPipeline.ts):
                   │
                   ├── 1. Lock de Idempotência com Transação Firestore (status: "generating")
                   ├── 2. Gemini AI: Análise de requisitos & recomendação (Prompt 5)
                   ├── 3. Motor Determinístico: Cálculo matemático exato com IVA (Prompt 4)
                   ├── 4. Geração de Proposta: Token seguro de 64 car. e HTML (/proposta/:token)
                   ├── 5. Envio de Email: Resend / SMTP com template em pt-PT (Prompt 7)
                   └── 6. Conclusão: Gravação de sentAt, proposalUrl e status: "sent"
```

---

## 🔐 2. Variáveis de Ambiente (`.env`)

Copia `.env.example` para `.env` e configura as seguintes variáveis:

| Variável | Obrigatória | Descrição | Exemplo |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | Sim | Chave de API da Google GenAI para geração de recomendações | `AIzaSy...` |
| `PUBLIC_BASE_URL` | Sim | URL pública da aplicação (usada nos links das propostas) | `https://cadence.app` |
| `VITE_CAL_LINK` | Sim | Link de agendamento Cal.com para o botão "See a live demo" | `https://cal.com/esterpedrosa/livedemo` |
| `FIREBASE_PROJECT_ID` | Sim | ID do projeto Google Cloud / Firebase | `gen-lang-client-0750477457` |
| `FIRESTORE_DATABASE_ID` | Recomendado | ID da base de dados Firestore (se não for a default) | `ai-studio-cadenceownyourti-...` |
| `FIREBASE_SERVICE_ACCOUNT`| Sim | JSON completo da Service Account com permissões Firestore | `'{"type":"service_account",...}'` |
| `EMAIL_PROVIDER` | Opcional | Provedor de email ativo: `smtp` ou `resend` (padrão: detetado automaticamente) | `smtp` |
| `SMTP_HOST` | Opcional (SMTP) | Servidor SMTP para envio de emails (ex: Gmail) | `smtp.gmail.com` |
| `SMTP_PORT` | Opcional (SMTP) | Porta do servidor SMTP (465 com SSL ou 587 com STARTTLS) | `465` |
| `SMTP_SECURE` | Opcional (SMTP) | `true` para porta 465 (SSL) ou `false` para 587 | `true` |
| `SMTP_USER` | Opcional (SMTP) | O teu endereço de email para envio | `o.teu.email@gmail.com` |
| `SMTP_PASS` | Opcional (SMTP) | Senha de Aplicação de 16 caracteres gerada na Google | `abcd efgh ijkl mnop` |
| `RESEND_API_KEY` | Opcional (Resend) | Chave de API do serviço Resend | `re_QDhX...` |
| `EMAIL_FROM` | Sim | Nome e endereço do remetente exibido aos clientes | `Ester Pedrosa - Cadence <o.teu.email@gmail.com>` |
| `EMAIL_REPLY_TO` | Opcional | Email de resposta (respostas de clientes caem aqui) | `o.teu.email@gmail.com` |
| `ADMIN_PASSWORD` | Sim | Palavra-passe de acesso ao painel de administração (`/admin`) | `cadence2026!` |
| `SESSION_SECRET` | Sim | Chave secreta para assinar cookies e tokens de sessão HMAC-SHA256 | `chave-secreta-longa-e-segura` |

---

## 🔥 3. Configuração do Firebase & Firestore

### Zero Client Access
A aplicação segue uma arquitetura estrita onde o cliente web **nunca** comunica diretamente com o Firestore. Todos os acessos são mediados pelo backend Node.js através do `firebase-admin`.

As regras em `firestore.rules` mantêm o bloqueio total para o cliente web:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // Zero Client Access
    }
  }
}
```

### Como Obter a Chave da Conta de Serviço:
1. No [Firebase Console](https://console.firebase.google.com/), acede às **Definições do Projeto** (⚙️).
2. Na aba **Contas de Serviço** ("Service accounts"), escolhe **Node.js** e clica em **"Gerar nova chave privada"**.
3. Cola o JSON no teu `.env` na variável `FIREBASE_SERVICE_ACCOUNT`.

---

## 📧 4. Configuração de Envio de Email (Gmail Pessoal vs. Resend)

A Cadence suporta duas formas principais de envio de emails de propostas:

### 🌟 Opção 1: Gmail Pessoal via SMTP (Mais Fácil — Gratuito e Sem Domínio Próprio)
Se **não tens um domínio próprio**, podes usar o teu email pessoal do Gmail (`@gmail.com`) para enviar as propostas diretamente para qualquer cliente.

Como a Google exige proteção reforçada, cria-se uma **Senha de Aplicação** de 16 letras:
1. Certifica-te de que a **Verificação em dois passos** está ativa na tua Conta Google.
2. Acede a **[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)**.
3. Dá um nome à aplicação (ex.: `Cadence`) e clica em **Criar**.
4. A Google mostra uma senha de 16 letras (ex.: `smounttgvflmqobe`).
5. No teu `.env`, configura:
   ```env
   EMAIL_PROVIDER="smtp"
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="465"
   SMTP_SECURE="true"
   SMTP_USER="o.teu.email@gmail.com"
   SMTP_PASS="a-tua-senha-de-16-letras"
   EMAIL_FROM="O Teu Nome - Cadence <o.teu.email@gmail.com>"
   EMAIL_REPLY_TO="o.teu.email@gmail.com"
   ```
6. Pronto! As propostas são enviadas diretamente através do teu Gmail para qualquer destinatário no mundo.

---

### Opção 2: Resend (Para Quem Já Tem Domínio Próprio)
Se já possuis um domínio verificado (ex.: `cadence.app`):
1. Regista-te no [Resend](https://resend.com) e cria uma API Key.
2. Adiciona e valida o teu domínio em [resend.com/domains](https://resend.com/domains) configurando os registos DNS (DKIM, SPF e DMARC).
3. No teu `.env`:
   ```env
   EMAIL_PROVIDER="resend"
   RESEND_API_KEY="re_..."
   EMAIL_FROM="Cadence <propostas@oteudominio.com>"
   ```
*Nota sobre o modo de teste do Resend:* Se usares o remetente gratuito padrão `onboarding@resend.dev`, a API do Resend apenas permite enviar emails para o email do dono da conta. O sistema da Cadence deteta isto automaticamente e entrega o email na tua caixa pessoal para pré-visualização.

---

### Opção 3: Partilha Direta do Link (Sem Configurar Email)
Se não quiseres configurar nenhum serviço de email, a aplicação continua a funcionar a 100%:
- Cada proposta gera uma página web com link único seguro (`/proposta/:token`).
- No teu **Painel Admin (`/admin`)**, basta clicares para ver ou copiar o link público e enviá-lo pelo **WhatsApp**, **LinkedIn**, **Instagram** ou no teu cliente de email habitual.

---

## 🧪 5. Como Testar o Fluxo Completo

O projeto inclui um conjunto completo de comandos de teste automatizados em `package.json`:

### 1. Testes Unitários do Motor de Cálculo de Preços (Prompt 4)
Valida todos os 12 cenários de preços (Free, Pro, Team, escalões de assentos, descontos de volume, IVA 23% e rejeição de planos inválidos):
```bash
npm test
```

### 2. Teste da Geração de Conteúdo com IA Gemini (Prompt 5)
Testa a análise de necessidades, recomendação automática de plano e cálculo determinístico:
```bash
npm run test:proposal
```

### 3. Teste de Renderização HTML da Proposta (Prompt 6)
Gera uma proposta completa e valida o documento HTML autocontido e responsivo:
```bash
npm run test:html-proposal
```

### 4. Teste de Envio de Email Transacional (Prompt 7)
Dispara um email de teste real para validar a entrega na tua caixa de entrada:
```bash
npm run test:email -- o.teu.email@gmail.com
```

### 5. Teste End-to-End do Pipeline Assíncrono
Simula o formulário, gravação no Firestore, resposta imediata ao cliente, transição `pending` → `generating` → `sent`, geração de token e envio de email:
```bash
npm run test:pipeline
```

### 6. Testes do Painel de Administração (/admin)
Valida a autenticação, rejeição com 401 de acessos não autorizados, listagem, filtros, reenvio de emails e retentativas:
```bash
npm run test:admin
```

---

## 🛡️ 6. Segurança, Robustez e Conformidade com o RGPD

### Proteção contra Injeção de Prompt
- O conteúdo submetido pelo utilizador é delimitado pela tag `<customer_description_untrusted_data>` nas instruções ao Gemini.
- Todas as tags HTML/XML e caracteres de controlo são higienizados antes da interpolação, impedindo a fuga do delimitador.
- Instruções estritas de sistema orientam o modelo a tratar a descrição como dados passivos, proibindo a alteração de regras ou descontos arbitrários.

### Proteção Estrita contra Cross-Site Scripting (XSS)
- Todas as variáveis dinâmicas inseridas nos templates HTML da proposta e do email passam pela função `escapeHtml()`.
- Validação rigorosa dos esquemas de URL (`http://` ou `https://` exclusivamente) para botões de agendamento e propostas, impedindo vetores `javascript:`.

### Limitação de Taxa (Rate Limiting)
- **Pedidos de Proposta (`POST /api/proposal-requests`):** Máximo de 5 pedidos por hora por IP.
- **Login de Administração (`POST /api/admin/login`):** Máximo de 5 tentativas a cada 5 minutos por IP (proteção anti brute-force).
- **Visualização de Propostas (`GET /proposta/:token`):** Máximo de 60 pedidos por minuto por IP (proteção anti-scraping).
- **Chatbot de Suporte (`POST /api/chat`):** Máximo de 15 pedidos por minuto por IP.

### Conformidade com o RGPD (Regulamento Geral sobre a Proteção de Dados)
- **Consentimento Explícito:** O formulário público inclui aviso de privacidade claro e caixa de seleção de consentimento antes da submissão.
- **Direito ao Esquecimento (Artigo 17.º do RGPD):** O painel de administração inclui a funcionalidade **"Eliminar Dados (RGPD)"** (`DELETE /api/admin/requests/:id`), que elimina permanentemente o registo do pedido e a proposta gerada associada tanto do Firestore como do repositório local.

---

## 🖥️ 7. Aceder ao Painel de Administração (`/admin`)

1. Acede a `/admin` no teu browser (ou clica no link *"Painel Admin"* no rodapé).
2. Introduz a palavra-passe definida em `ADMIN_PASSWORD` (padrão: `cadence2026!`).
3. No painel poderás:
   - Visualizar todos os pedidos com métricas em tempo real.
   - Filtrar por estado (*Enviadas*, *A Gerar*, *Pendentes*, *Falhadas*) ou pesquisar por cliente.
   - Abrir o link público de qualquer proposta gerada.
   - Consultar o detalhe integral das necessidades e mensagens de erro técnicas.
   - Reenviar emails aos clientes com um clique.
   - Retentar pedidos que tenham falhado.
   - Eliminar dados em conformidade com o RGPD.
