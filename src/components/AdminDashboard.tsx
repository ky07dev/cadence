import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Mail,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  X,
  LogOut,
  ArrowUpDown,
  FileText,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Calendar,
  User,
  Inbox,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

interface RequestItem {
  id: string;
  name: string;
  email: string;
  needs: string;
  descriptionSummary: string;
  status: 'pending' | 'generating' | 'sent' | 'failed';
  attempts: number;
  createdAt: string | null;
  updatedAt: string | null;
  sentAt: string | null;
  proposalUrl: string | null;
  proposalToken: string | null;
  emailMessageId: string | null;
  errorMessage: string | null;
  proposalTotal: string | null;
}

interface Metrics {
  total: number;
  sent: number;
  generating: number;
  pending: number;
  failed: number;
}

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    sent: 0,
    generating: 0,
    pending: 0,
    failed: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Modal de Detalhes
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper para obter token salvo (se houver)
  const getAuthHeader = (): HeadersInit => {
    const token = localStorage.getItem('cadence_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1. Verificar autenticação inicial
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me', {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 2. Carregar Pedidos
  const loadRequests = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      params.append('sort', sortOrder);

      const res = await fetch(`/api/admin/requests?${params.toString()}`, {
        headers: getAuthHeader(),
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      if (!res.ok) {
        throw new Error('Falha ao carregar pedidos.');
      }

      const data = await res.json();
      setRequests(data.requests || []);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err: any) {
      console.error('Erro ao carregar pedidos:', err);
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [statusFilter, searchTerm, sortOrder]);

  useEffect(() => {
    if (isAuthenticated) {
      loadRequests();
    }
  }, [isAuthenticated, loadRequests]);

  // 3. Auto-refresh a cada 10 segundos quando ativo
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;
    const interval = setInterval(() => {
      loadRequests(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh, loadRequests]);

  // 4. Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Acesso negado.');
      }

      if (data.token) {
        localStorage.setItem('cadence_admin_token', data.token);
      }

      setIsAuthenticated(true);
      setPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao iniciar sessão.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 5. Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {
      // Ignorar
    }
    localStorage.removeItem('cadence_admin_token');
    setIsAuthenticated(false);
    setRequests([]);
    setSelectedRequest(null);
  };

  // 6. Ação: Retentar Pedido (Retry)
  const handleRetry = async (requestId: string) => {
    setActionLoadingId(requestId);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/retry`, {
        method: 'POST',
        headers: getAuthHeader(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao reiniciar pedido.');

      setFeedbackMessage({ type: 'success', text: 'Pedido reiniciado com sucesso! A gerar em background...' });
      await loadRequests(true);

      // Atualiza modal se estiver aberto
      if (selectedRequest?.id === requestId) {
        setSelectedRequest((prev) => (prev ? { ...prev, status: 'generating', errorMessage: null } : null));
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao retentar pedido.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 7. Ação: Reenviar Email (Resend)
  const handleResendEmail = async (requestId: string) => {
    setActionLoadingId(requestId);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/resend-email`, {
        method: 'POST',
        headers: getAuthHeader(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao reenviar email.');

      setFeedbackMessage({ type: 'success', text: data.message || 'Email reenviado com sucesso!' });
      await loadRequests(true);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao reenviar email.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 8. Ação: Eliminar Pedido ao abrigo do RGPD (Direito ao Esquecimento)
  const handleDeleteRequest = async (requestId: string, customerName: string) => {
    const confirmed = window.confirm(
      `Eliminar permanentemente todos os dados de "${customerName}" (pedido e proposta associada) ao abrigo do RGPD?\n\nEsta ação é definitiva e irreversível.`
    );
    if (!confirmed) return;

    setActionLoadingId(requestId);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao eliminar registo.');

      setFeedbackMessage({ type: 'success', text: 'Dados eliminados com sucesso ao abrigo do RGPD.' });
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
      await loadRequests(true);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Erro ao eliminar dados.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('pt-PT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const renderStatusBadge = (status: RequestItem['status']) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Enviada
          </span>
        );
      case 'generating':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            A Gerar
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3.5 h-3.5" />
            Pendente
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-3.5 h-3.5" />
            Falhada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  // Ecrã de Carregamento Inicial
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-neutral-950">
        <Loader2 className="w-8 h-8 text-stone-600 dark:text-stone-400 animate-spin" />
      </div>
    );
  }

  // Ecrã de Login (quando não autenticado - sem revelar dados)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-neutral-950 p-4 font-sans">
        <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-stone-900 text-white dark:bg-white dark:text-neutral-900 mb-4 shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Painel de Controlo Cadence
            </h1>
            <p className="text-sm text-stone-500 dark:text-neutral-400 mt-1.5">
              Área restrita de gestão de propostas comerciais
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                Palavra-passe de Administrador
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Insere a tua palavra-passe..."
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition"
              />
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 rounded-xl font-semibold bg-stone-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-stone-200 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A validar credenciais...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Entrar no Painel
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100 dark:border-neutral-800 text-center">
            <a
              href="/"
              className="text-xs text-stone-500 hover:text-stone-900 dark:text-neutral-400 dark:hover:text-white transition"
            >
              ← Voltar ao site público da Cadence
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Painel Principal Autenticado
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-stone-200 dark:border-neutral-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-stone-900 text-white dark:bg-white dark:text-neutral-900 font-bold">
              CADENCE
            </span>
            <div className="h-4 w-px bg-stone-300 dark:bg-neutral-700" />
            <h1 className="text-base font-semibold tracking-tight">Gestão de Propostas Comerciais</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Atualização automática ativa (10s)' : 'Atualização automática pausada'}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition ${
                autoRefresh
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
              {autoRefresh ? 'Tempo Real' : 'Pausado'}
            </button>

            <button
              onClick={() => loadRequests()}
              disabled={isLoading}
              className="p-2 rounded-lg border border-stone-200 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800 transition text-stone-700 dark:text-neutral-300"
              title="Atualizar agora"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <div className="h-4 w-px bg-stone-300 dark:bg-neutral-700" />

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-stone-500 hover:text-stone-900 dark:text-neutral-400 dark:hover:text-white transition flex items-center gap-1"
            >
              Ver Site
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between transition ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm font-medium">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-xs opacity-70 hover:opacity-100 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-sm">
            <span className="text-xs font-semibold text-stone-500 dark:text-neutral-400 uppercase tracking-wider">
              Total Pedidos
            </span>
            <div className="text-2xl font-bold mt-1 text-neutral-900 dark:text-white">{metrics.total}</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-sm">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Enviadas
            </span>
            <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{metrics.sent}</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-sm">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              A Gerar
            </span>
            <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{metrics.generating}</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-sm">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Pendentes
            </span>
            <div className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{metrics.pending}</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-sm col-span-2 sm:col-span-1">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Falhadas
            </span>
            <div className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">{metrics.failed}</div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'sent', label: 'Enviadas' },
              { id: 'generating', label: 'A Gerar' },
              { id: 'pending', label: 'Pendentes' },
              { id: 'failed', label: 'Falhadas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                    : 'text-stone-600 dark:text-neutral-400 hover:bg-stone-100 dark:hover:bg-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input and Sort */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por nome, email ou ID..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-stone-200 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-white transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              title={`Ordenar: ${sortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigas primeiro'}`}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 transition shrink-0"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
              <span>{sortOrder === 'desc' ? 'Mais Recentes' : 'Mais Antigas'}</span>
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-neutral-800 bg-stone-50/75 dark:bg-neutral-900/75 text-[11px] font-semibold text-stone-500 dark:text-neutral-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Data Pedido</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Resumo das Necessidades</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Data Envio</th>
                  <th className="py-3.5 px-4 text-center">Proposta</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-neutral-800/80 text-xs">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-500 dark:text-neutral-400">
                      <Inbox className="w-8 h-8 mx-auto mb-2 text-stone-300 dark:text-neutral-600" />
                      Nenhum pedido de proposta encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  requests.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-stone-50/60 dark:hover:bg-neutral-800/40 transition group"
                    >
                      {/* Data */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-stone-500 dark:text-neutral-400 font-mono text-[11px]">
                        {formatDate(item.createdAt)}
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-neutral-900 dark:text-white">{item.name}</div>
                        <div className="text-stone-500 dark:text-neutral-400 text-[11px] font-mono">{item.email}</div>
                      </td>

                      {/* Resumo */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="line-clamp-2 text-stone-600 dark:text-neutral-300 text-xs leading-relaxed" title={item.needs}>
                          {item.needs}
                        </p>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(item.status)}
                        {item.attempts > 1 && (
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            Tentativa {item.attempts}/3
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium font-mono text-neutral-900 dark:text-white">
                        {item.proposalTotal || '—'}
                      </td>

                      {/* Data Envio */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-stone-500 dark:text-neutral-400 font-mono text-[11px]">
                        {formatDate(item.sentAt)}
                      </td>

                      {/* Link da Proposta */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        {item.proposalUrl ? (
                          <a
                            href={item.proposalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-800 dark:text-neutral-200 bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 transition"
                            title="Abrir proposta em nova aba"
                          >
                            <span>Abrir</span>
                            <ExternalLink className="w-3 h-3 text-stone-500" />
                          </a>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Ação Reenviar Email (apenas para status "sent") */}
                          {item.status === 'sent' && (
                            <button
                              onClick={() => handleResendEmail(item.id)}
                              disabled={actionLoadingId === item.id}
                              title="Reenviar email de proposta ao cliente"
                              className="p-1.5 rounded-lg border border-stone-200 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800 text-stone-700 dark:text-neutral-300 transition cursor-pointer disabled:opacity-50"
                            >
                              {actionLoadingId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Mail className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Ação Retentar (para status "failed") */}
                          {item.status === 'failed' && (
                            <button
                              onClick={() => handleRetry(item.id)}
                              disabled={actionLoadingId === item.id}
                              title="Reiniciar processamento e gerar proposta"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition shadow-sm cursor-pointer disabled:opacity-50"
                            >
                              {actionLoadingId === item.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3 h-3" />
                              )}
                              <span>Retentar</span>
                            </button>
                          )}

                          {/* Ver Detalhes */}
                          <button
                            onClick={() => setSelectedRequest(item)}
                            className="p-1.5 rounded-lg border border-stone-200 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800 text-stone-700 dark:text-neutral-300 transition cursor-pointer"
                            title="Ver detalhes completos"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Ação Eliminar RGPD */}
                          <button
                            onClick={() => handleDeleteRequest(item.id, item.name)}
                            disabled={actionLoadingId === item.id}
                            title="Eliminar permanentemente dados do pedido (RGPD - Esquecimento)"
                            className="p-1.5 rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-600 transition cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal / Drawer de Detalhe do Pedido */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    Detalhes do Pedido
                  </h2>
                  {renderStatusBadge(selectedRequest.status)}
                </div>
                <div className="text-xs text-stone-500 font-mono mt-1">
                  ID: {selectedRequest.id}
                </div>
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-neutral-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Se Falhou: Mensagem de Erro em Destaque */}
              {selectedRequest.status === 'failed' && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-rose-900 dark:text-rose-200 text-sm">
                        Processamento Falhado
                      </h4>
                      <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 font-mono break-all">
                        {selectedRequest.errorMessage || 'Erro desconhecido durante o pipeline assíncrono.'}
                      </p>
                      <div className="mt-3">
                        <button
                          onClick={() => handleRetry(selectedRequest.id)}
                          disabled={actionLoadingId === selectedRequest.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {actionLoadingId === selectedRequest.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          <span>Retentar Agora</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Informação do Cliente */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-stone-50 dark:bg-neutral-800/60 border border-stone-200/60 dark:border-neutral-700/60">
                <div>
                  <span className="text-xs font-medium text-stone-500 dark:text-neutral-400 block mb-1">
                    Nome do Requerente
                  </span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {selectedRequest.name}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-stone-500 dark:text-neutral-400 block mb-1">
                    Email de Contacto
                  </span>
                  <span className="font-mono text-xs font-medium text-neutral-900 dark:text-white break-all">
                    {selectedRequest.email}
                  </span>
                </div>
              </div>

              {/* Descrição Completa das Necessidades */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-neutral-400 block mb-2">
                  Descrição Completa das Necessidades
                </label>
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-neutral-800/40 border border-stone-200 dark:border-neutral-800 text-xs leading-relaxed text-stone-700 dark:text-neutral-200 whitespace-pre-wrap">
                  {selectedRequest.needs}
                </div>
              </div>

              {/* Detalhes de Envio e Proposta */}
              <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-neutral-800">
                <div className="flex justify-between items-center text-xs py-1">
                  <span className="text-stone-500 dark:text-neutral-400">Data de Submissão:</span>
                  <span className="font-mono font-medium">{formatDate(selectedRequest.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1">
                  <span className="text-stone-500 dark:text-neutral-400">Última Atualização:</span>
                  <span className="font-mono font-medium">{formatDate(selectedRequest.updatedAt)}</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1">
                  <span className="text-stone-500 dark:text-neutral-400">Data de Envio do Email:</span>
                  <span className="font-mono font-medium">{formatDate(selectedRequest.sentAt)}</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1">
                  <span className="text-stone-500 dark:text-neutral-400">Tentativas Registadas:</span>
                  <span className="font-semibold">{selectedRequest.attempts} / 3</span>
                </div>
                {selectedRequest.emailMessageId && (
                  <div className="flex justify-between items-center text-xs py-1">
                    <span className="text-stone-500 dark:text-neutral-400">ID da Mensagem Resend:</span>
                    <span className="font-mono text-[11px] text-stone-600 dark:text-neutral-300">
                      {selectedRequest.emailMessageId}
                    </span>
                  </div>
                )}
                {selectedRequest.proposalTotal && (
                  <div className="flex justify-between items-center text-xs py-1">
                    <span className="text-stone-500 dark:text-neutral-400">Valor Total da Proposta:</span>
                    <span className="font-bold text-sm font-mono text-emerald-600 dark:text-emerald-400">
                      {selectedRequest.proposalTotal}
                    </span>
                  </div>
                )}
              </div>

              {/* Link da Proposta */}
              {selectedRequest.proposalUrl && (
                <div className="pt-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-neutral-400 block mb-2">
                    URL Pública da Proposta
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={selectedRequest.proposalUrl}
                      className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-stone-100 dark:bg-neutral-800 border border-stone-200 dark:border-neutral-700 text-stone-700 dark:text-neutral-300 focus:outline-none"
                    />
                    <a
                      href={selectedRequest.proposalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition shrink-0 flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Abrir</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 dark:bg-neutral-800/40 border-t border-stone-200 dark:border-neutral-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                {selectedRequest.status === 'sent' && (
                  <button
                    onClick={() => handleResendEmail(selectedRequest.id)}
                    disabled={actionLoadingId === selectedRequest.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-neutral-700 hover:bg-stone-100 dark:hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
                  >
                    {actionLoadingId === selectedRequest.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 text-stone-500" />
                    )}
                    <span>Reenviar Email</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteRequest(selectedRequest.id, selectedRequest.name)}
                  disabled={actionLoadingId === selectedRequest.id}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Dados (RGPD)</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-neutral-400 hover:bg-stone-200 dark:hover:bg-neutral-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
