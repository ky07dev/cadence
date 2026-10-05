import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Send, CheckCircle2, AlertCircle, FileText, Sparkles, Clock, ShieldCheck } from 'lucide-react';

interface ProposalFormData {
  name: string;
  email: string;
  needsDescription: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  needsDescription?: string;
}

export const PlanProposalSection: React.FC = () => {
  const [formData, setFormData] = useState<ProposalFormData>({
    name: '',
    email: '',
    needsDescription: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = 'O nome é obrigatório.';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'O nome deve ter pelo menos 2 caracteres.';
    } else if (trimmedName.length > 100) {
      newErrors.name = 'O nome não pode exceder 100 caracteres.';
    }

    const trimmedEmail = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      newErrors.email = 'O email é obrigatório.';
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = 'Introduz um endereço de email válido.';
    }

    const trimmedDesc = formData.needsDescription.trim();
    if (!trimmedDesc) {
      newErrors.needsDescription = 'A descrição das necessidades é obrigatória.';
    } else if (trimmedDesc.length < 10) {
      newErrors.needsDescription = 'Por favor descreve as tuas necessidades com pelo menos 10 caracteres.';
    } else if (trimmedDesc.length > 3000) {
      newErrors.needsDescription = 'A descrição não pode exceder 3000 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      needsDescription: formData.needsDescription.trim(),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    try {
      // Step 2 Target Flow: Store proposal request directly in Firestore with status "pending"
      let docId = '';
      try {
        const docRef = await addDoc(collection(db, 'proposal_requests'), payload);
        docId = docRef.id;
      } catch (firestoreError) {
        console.warn('[Firestore Direct Write Warning] A tentar endpoint de fallback no servidor...', firestoreError);
        // Fallback to server endpoint if direct client write is blocked or offline
        const response = await fetch('/api/proposals/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Falha ao registar o pedido no servidor.');
        }

        const resData = await response.json();
        docId = resData.id;
      }

      setSubmittedId(docId);
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', needsDescription: '' });
      setErrors({});
    } catch (err: unknown) {
      const error = err as Error;
      console.error('[Proposal Submit Error]', error);
      setApiError(
        error.message || 'Ocorreu um erro ao submeter o pedido. Por favor tenta novamente ou contacta support@cadence.app.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitSuccess(false);
    setSubmittedId(null);
    setApiError(null);
    setFormData({ name: '', email: '', needsDescription: '' });
    setErrors({});
  };

  return (
    <section
      id="pedir-proposta"
      className="py-20 md:py-28 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 transition-colors duration-300"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700/60">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Proposta Personalizada • Cadence</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 font-sans">
            Pedir Proposta de Plano
          </h2>

          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Conta-nos sobre o teu fluxo de trabalho, dimensão da equipa e desafios de agendamento. 
            Prepara uma proposta à medida para otimizar o teu tempo.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-stone-50/80 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-sm backdrop-blur-xs">
          {submitSuccess ? (
            <div className="text-center py-8 space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 font-sans">
                  Pedido Submetido com Sucesso!
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto text-sm sm:text-base">
                  O teu pedido foi registado na nossa base de dados com o estado{' '}
                  <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 font-semibold">
                    <Clock className="w-3 h-3" /> pending
                  </span>
                  .
                </p>
              </div>

              {submittedId && (
                <div className="p-3.5 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 max-w-sm mx-auto text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                  Identificador do registo: <span className="font-semibold text-neutral-900 dark:text-neutral-200">{submittedId}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  Submeter outro pedido
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {apiError && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{apiError}</p>
                </div>
              )}

              {/* Field 1: Name */}
              <div className="space-y-2">
                <label
                  htmlFor="proposal-name"
                  className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
                >
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <input
                  id="proposal-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Mariana Silva"
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 ${
                    errors.name
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-neutral-400/20'
                  }`}
                  disabled={isSubmitting}
                  required
                />
                {errors.name && (
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Field 2: Email */}
              <div className="space-y-2">
                <label
                  htmlFor="proposal-email"
                  className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
                >
                  Email profissional <span className="text-red-500">*</span>
                </label>
                <input
                  id="proposal-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ex: mariana@empresa.pt"
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 ${
                    errors.email
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-neutral-400/20'
                  }`}
                  disabled={isSubmitting}
                  required
                />
                {errors.email && (
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Field 3: Needs Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="proposal-needs"
                    className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
                  >
                    Descrição das necessidades <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-neutral-400">
                    {formData.needsDescription.length}/3000
                  </span>
                </div>
                <textarea
                  id="proposal-needs"
                  rows={4}
                  value={formData.needsDescription}
                  onChange={(e) => setFormData({ ...formData, needsDescription: e.target.value })}
                  placeholder="ex: Somos uma equipa de 5 consultores independentes. Precisamos de coordenar disponibilidade entre vários fusos horários, ter links de marcação personalizados e proteger tempos de foco diários sem reuniões."
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 resize-y ${
                    errors.needsDescription
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-neutral-400/20'
                  }`}
                  disabled={isSubmitting}
                  required
                />
                {errors.needsDescription && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {errors.needsDescription}
                  </p>
                )}
              </div>

              {/* Security and privacy reassurance */}
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Os teus dados são encriptados e nunca partilhados com terceiros.</span>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="submit-proposal-btn"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-white shadow-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white dark:border-neutral-950 border-t-transparent rounded-full animate-spin" />
                      <span>A guardar pedido...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Pedir Proposta de Plano</span>
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
