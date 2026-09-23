import React, { useEffect, useState } from 'react';
import { getCalApi } from '@calcom/embed-react';
import { Calendar, ExternalLink } from 'lucide-react';

/**
 * Propriedades customizáveis do botão LiveDemoButton
 */
export interface LiveDemoButtonProps {
  /**
   * Sobrescreve opcionalmente a rota (caso não seja passado, lê exclusivamente do ambiente).
   */
  calLink?: string;
  /**
   * Texto do botão (Padrão: "See a live demo" / "Ver demonstração ao vivo")
   */
  label?: string;
  /**
   * Classes adicionais de estilização Tailwind CSS
   */
  className?: string;
  /**
   * Variante visual do botão: 'primary' | 'secondary' | 'outline'
   */
  variant?: 'primary' | 'secondary' | 'outline';
  /**
   * Namespace isolado para a instância da API Cal.com
   */
  namespace?: string;
}

// Resolução segura da rota a partir de Secrets de ambiente (Next.js ou Vite)
const ENV_CAL_LINK: string =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CAL_LINK) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CAL_LINK) ||
  'esterpedrosa/livedemo'; // Fallback verificado e funcional da equipa

/**
 * Higieniza o identificador caso o utilizador tenha configurado uma URL completa como:
 * "https://cal.com/esterpedrosa/livedemo" -> converte para "esterpedrosa/livedemo"
 */
function sanitizeCalSlug(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.|app\.)?cal\.com\//i, '')
    .split('?')[0]
    .split('#')[0]
    .replace(/^\/+|\/+$/g, '');
}

export const LiveDemoButton: React.FC<LiveDemoButtonProps> = ({
  calLink = ENV_CAL_LINK,
  label = 'See a live demo',
  className = '',
  variant = 'secondary',
  namespace = 'live-demo-modal',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const normalizedCalLink = sanitizeCalSlug(calLink);

  // Inicializa a API oficial do Cal.com com lazy loading e configurações de UI
  useEffect(() => {
    let isMounted = true;

    (async function initCalModal() {
      try {
        const cal = await getCalApi({ namespace });
        if (!isMounted) return;

        // Customização da interface nativa do Cal.com Modal
        cal('ui', {
          theme: 'auto', // Harmoniza automaticamente com o modo claro ou escuro
          styles: {
            branding: {
              brandColor: '#18181b', // Neutro escuro profissional
            },
          },
          hideEventTypeDetails: true, // Oculta detalhes redundantes para máxima conversão
          layout: 'month_view',
        });

        setIsLoaded(true);
      } catch (err) {
        console.warn('[Cal.com Embed] Aviso na inicialização:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [namespace]);

  // Se não existir qualquer link configurado em variáveis de ambiente ou props, desativa de forma elegante
  const isConfigured = Boolean(normalizedCalLink && normalizedCalLink.trim());

  // Abertura programática segura do modal nativo do Cal.com
  const handleOpenModal = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isConfigured) return;

    try {
      const cal = await getCalApi({ namespace });
      cal('modal', {
        calLink: normalizedCalLink,
        config: {
          layout: 'month_view',
          theme: 'auto',
        },
      });
    } catch (err) {
      console.error('[Cal.com Modal] Erro ao abrir modal:', err);
    }
  };

  // Variantes de estilo com Tailwind CSS
  const baseClasses =
    'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer select-none active:scale-[0.98]';

  const variantClasses = {
    primary:
      'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white shadow-xs',
    secondary:
      'border border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xs text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800',
    outline:
      'border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900',
  }[variant];

  // Caso o secret não esteja definido, o botão desativa elegantemente
  if (!isConfigured) {
    return (
      <button
        type="button"
        disabled
        title="Configura a variável NEXT_PUBLIC_CAL_LINK ou VITE_CAL_LINK no ficheiro .env"
        className={`${baseClasses} opacity-50 cursor-not-allowed border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-400 ${className}`}
      >
        <Calendar className="w-4 h-4 opacity-50" />
        <span>{label} (Indisponível)</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      id="cal-live-demo-modal-btn"
      onClick={handleOpenModal}
      data-cal-namespace={namespace}
      data-cal-link={normalizedCalLink}
      data-cal-config='{"layout":"month_view"}'
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      <Calendar className="w-4 h-4 opacity-75" />
      <span>{label}</span>
      <ExternalLink className="w-3 h-3 opacity-50 ml-0.5" />
    </button>
  );
};
