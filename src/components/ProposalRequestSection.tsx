import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, RefreshCw, Sparkles, FileText, Mail, User, ShieldCheck } from 'lucide-react';

interface ProposalFormData {
  name: string;
  email: string;
  description: string;
  consent: boolean;
  honeypot: string; // Anti-spam hidden field
}

interface FormErrors {
  name?: string;
  email?: string;
  description?: string;
  consent?: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export const ProposalRequestSection: React.FC = () => {
  const [formData, setFormData] = useState<ProposalFormData>({
    name: '',
    email: '',
    description: '',
    consent: true, // Pré-ativado com consentimento explícito visível
    honeypot: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [serverErrorMessage, setServerErrorMessage] = useState<string>('');

  const charCount = formData.description.length;
  const minChars = 20;
  const maxChars = 2000;

  // Validation function
  const validateField = (field: keyof ProposalFormData, value: string): string | undefined => {
    switch (field) {
      case 'name': {
        const trimmed = value.trim();
        if (!trimmed) {
          return 'O nome é obrigatório.';
        }
        if (trimmed.length < 2) {
          return 'O nome deve ter pelo menos 2 caracteres.';
        }
        if (trimmed.length > 100) {
          return 'O nome não pode exceder os 100 caracteres.';
        }
        return undefined;
      }

      case 'email': {
        const trimmed = value.trim();
        if (!trimmed) {
          return 'O email é obrigatório.';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
        if (!emailRegex.test(trimmed)) {
          return 'Por favor, introduz um endereço de email válido.';
        }
        return undefined;
      }

      case 'description': {
        const trimmed = value.trim();
        if (!trimmed) {
          return 'A descrição das tuas necessidades é obrigatória.';
        }
        if (trimmed.length < minChars) {
          return `A descrição deve ter pelo menos ${minChars} caracteres (faltam ${minChars - trimmed.length}).`;
        }
        if (trimmed.length > maxChars) {
          return `A descrição não pode ter mais de ${maxChars} caracteres.`;
        }
        return undefined;
      }

      default:
        return undefined;
    }
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    const nameErr = validateField('name', formData.name);
    const emailErr = validateField('email', formData.email);
    const descErr = validateField('description', formData.description);

    if (nameErr) newErrors.name = nameErr;
    if (emailErr) newErrors.email = emailErr;
    if (descErr) newErrors.description = descErr;
    if (!formData.consent) {
      newErrors.consent = 'É necessário consentir o tratamento de dados ao abrigo do RGPD para receberes a proposta.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Re-validate field if already touched
    if (touched[name]) {
      const error = validateField(name as keyof ProposalFormData, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof ProposalFormData, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const [requestId, setRequestId] = useState<string>('');

  /**
   * Submissão real ligada ao endpoint do servidor backend
   * POST /api/proposal-requests
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      description: true,
      consent: true,
    });

    // Check honeypot (anti-spam) localmente antes do envio
    if (formData.honeypot) {
      console.warn('[Anti-Spam] Bot detetado via campo honeypot oculto.');
      setStatus('submitting');
      await new Promise((r) => setTimeout(r, 600));
      setStatus('success');
      return;
    }

    if (!validateAll()) {
      return;
    }

    setStatus('submitting');
    setServerErrorMessage('');

    try {
      const res = await fetch('/api/proposal-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          needs: formData.description.trim(),
          consent: formData.consent,
          honeypot: formData.honeypot,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.field && (data.field === 'name' || data.field === 'email' || data.field === 'needs' || data.field === 'consent')) {
          const fieldKey = data.field === 'needs' ? 'description' : data.field;
          setErrors((prev) => ({ ...prev, [fieldKey]: data.error }));
        }
        throw new Error(data.error || 'Erro ao submeter o pedido de proposta.');
      }

      setRequestId(data.id || '');
      console.log('[Proposal Requests] Proposta registada com sucesso no Firestore. ID:', data.id);
      setStatus('success');
    } catch (err: unknown) {
      const error = err as Error;
      console.error('[Proposal Requests Error]', error);
      setServerErrorMessage(
        error.message || 'Ocorreu um erro ao processar o teu pedido. Por favor verifica os dados e tenta novamente.'
      );
      setStatus('error');
    }
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      email: '',
      description: '',
      consent: true,
      honeypot: '',
    });
    setErrors({});
    setTouched({});
    setStatus('idle');
    setServerErrorMessage('');
  };

  return (
    <section
      id="pedir-proposta"
      aria-labelledby="proposta-title"
      className="py-20 md:py-28 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-stone-50/60 dark:bg-neutral-950 transition-colors"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-neutral-200/70 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Planos Adaptados • Resposta Rápida</span>
          </div>

          <h2
            id="proposta-title"
            className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 font-sans"
          >
            Pedir proposta de plano personalizada
          </h2>

          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            Conta-nos sobre o teu fluxo de trabalho, dimensão da equipa ou necessidades específicas de agendamento.
            Preparamos uma proposta à medida do teu ritmo, sem compromisso.
          </p>
        </div>

        {/* Form Card Container */}
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-10 md:p-12 shadow-sm transition-all">
          {status === 'success' ? (
            /* SUCCESS STATE */
            <div
              role="status"
              aria-live="polite"
              className="py-8 px-4 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-900/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 tracking-tight">
                  Proposta pedida com sucesso!
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Obrigado pelo teu interesse, <span className="font-semibold text-neutral-900 dark:text-neutral-100">{formData.name}</span>.
                  A nossa equipa está a analisar as tuas necessidades e{' '}
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    receberás a proposta detalhada no teu email ({formData.email}) dentro de poucos minutos
                  </span>.
                </p>
                {requestId && (
                  <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 pt-1">
                    Referência do pedido: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{requestId}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  id="reset-proposal-form-btn"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-750 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Pedir outra proposta</span>
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE FORM / SUBMITTING / ERROR STATE */
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* General Error Banner */}
              {status === 'error' && (
                <div
                  role="alert"
                  className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 p-4 flex items-start gap-3.5 text-rose-800 dark:text-rose-200 animate-in fade-in duration-150"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div className="flex-1 text-xs sm:text-sm">
                    <p className="font-semibold">Não foi possível enviar o pedido</p>
                    <p className="mt-0.5 text-rose-700 dark:text-rose-300">
                      {serverErrorMessage || 'Ocorreu um erro ao processar o teu pedido. Por favor tenta novamente.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="shrink-0 text-xs font-semibold underline hover:no-underline text-rose-800 dark:text-rose-200 cursor-pointer"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* Honeypot field (hidden from real users, tricks automated bots) */}
              <div
                style={{ display: 'none', position: 'absolute', left: '-9999px' }}
                aria-hidden="true"
                tabIndex={-1}
              >
                <label htmlFor="company_website_hp">Não preencher se for humano</label>
                <input
                  type="text"
                  id="company_website_hp"
                  name="honeypot"
                  value={formData.honeypot}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Grid with Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                {/* 1. Name Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="proposal-name"
                      className="block text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200"
                    >
                      Nome completo <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-neutral-400">2–100 car.</span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="proposal-name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={100}
                      disabled={status === 'submitting'}
                      placeholder="Ex: Teresa Carvalho"
                      aria-required="true"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'proposal-name-error' : undefined}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-stone-50/60 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 transition-all focus:outline-hidden ${
                        errors.name
                          ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10'
                      }`}
                    />
                  </div>

                  {errors.name && (
                    <p
                      id="proposal-name-error"
                      role="alert"
                      className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 font-medium"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                </div>

                {/* 2. Email Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="proposal-email"
                      className="block text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200"
                    >
                      Endereço de email <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-neutral-400">Para envio</span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      id="proposal-email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={status === 'submitting'}
                      placeholder="teresa@empresa.pt"
                      aria-required="true"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'proposal-email-error' : undefined}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-stone-50/60 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 transition-all focus:outline-hidden ${
                        errors.email
                          ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10'
                      }`}
                    />
                  </div>

                  {errors.email && (
                    <p
                      id="proposal-email-error"
                      role="alert"
                      className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 font-medium"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 3. Description of Needs Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="proposal-description"
                    className="block text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200"
                  >
                    Descrição das necessidades <span className="text-rose-500">*</span>
                  </label>
                  <span
                    id="char-counter"
                    aria-live="polite"
                    className={`text-[11px] font-mono ${
                      charCount > maxChars
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : charCount < minChars && charCount > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-neutral-400 dark:text-neutral-500'
                    }`}
                  >
                    {charCount} / {maxChars} car. {charCount > 0 && charCount < minChars && `(mín. ${minChars})`}
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    id="proposal-description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={maxChars}
                    disabled={status === 'submitting'}
                    placeholder="Descreve como pretendes usar o Cadence (ex: quantos elementos na equipa, que ferramentas de calendário utilizam atualmente, se necessitam de branding próprio ou sincronização avançada)..."
                    aria-required="true"
                    aria-invalid={!!errors.description}
                    aria-describedby={`char-counter ${errors.description ? 'proposal-description-error' : ''}`}
                    className={`w-full p-3.5 text-xs sm:text-sm rounded-xl border bg-stone-50/60 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 transition-all focus:outline-hidden resize-y leading-relaxed ${
                      errors.description
                        ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10'
                    }`}
                  />
                </div>

                {errors.description && (
                  <p
                    id="proposal-description-error"
                    role="alert"
                    className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 font-medium"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.description}</span>
                  </p>
                )}
              </div>

              {/* RGPD Consent & Privacy Notice */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={formData.consent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((prev) => ({ ...prev, consent: checked }));
                      if (touched.consent) {
                        setErrors((prev) => ({
                          ...prev,
                          consent: checked
                            ? undefined
                            : 'É necessário consentir o tratamento de dados ao abrigo do RGPD.',
                        }));
                      }
                    }}
                    className="mt-1 w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:ring-white transition shrink-0"
                  />
                  <span className="text-xs text-stone-600 dark:text-neutral-400 leading-relaxed">
                    Autorizo o tratamento dos dados fornecidos (nome, email e necessidades) exclusivamente para a elaboração e envio desta proposta comercial personalizada, ao abrigo do <strong className="font-semibold text-stone-800 dark:text-neutral-200">Regulamento Geral sobre a Proteção de Dados (RGPD)</strong>. Podes solicitar a eliminação definitiva dos teus dados a qualquer momento.
                  </span>
                </label>
                {touched.consent && errors.consent && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.consent}</span>
                  </p>
                )}
              </div>

              {/* Trust Badge & Submit CTA Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-100 dark:border-neutral-800/80 mt-6">
                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Sem compromisso • Resposta por email sem spam</span>
                </div>

                <button
                  type="submit"
                  id="submit-proposal-btn"
                  disabled={status === 'submitting'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-all font-medium text-xs sm:text-sm shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'submitting' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>A preparar proposta...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Pedir proposta de plano</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
