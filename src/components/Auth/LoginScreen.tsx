import React, { useState } from 'react';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Building2,
  ArrowRight,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sendPasswordReset } from '../../firebase';

export const LoginScreen: React.FC = () => {
  const { loginWithEmail, loginWithGoogle, authError, clearAuthError } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Password Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Por favor, informe seu e-mail institucional ou cadastrado.');
      return;
    }
    if (!password) {
      setLocalError('Por favor, digite sua senha de acesso.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithEmail(trimmedEmail, password);
      if (!res.success) {
        setLocalError(res.message || 'Usuário não cadastrado ou sem acesso autorizado. Entre em contato com o administrador.');
      }
    } catch (err: unknown) {
      setLocalError('Usuário não cadastrado ou sem acesso autorizado. Entre em contato com o administrador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearAuthError();
    setIsSubmitting(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setLocalError(res.message || 'Usuário não cadastrado ou sem acesso autorizado. Entre em contato com o administrador.');
      }
    } catch {
      setLocalError('Usuário não cadastrado ou sem acesso autorizado. Entre em contato com o administrador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetFeedback({ type: 'error', text: 'Informe o e-mail cadastrado para recuperação.' });
      return;
    }

    setResetSubmitting(true);
    setResetFeedback(null);
    try {
      const res = await sendPasswordReset(resetEmail.trim());
      setResetFeedback({
        type: 'success',
        text: res.message || 'Link para redefinição de senha enviado para seu e-mail.'
      });
    } catch {
      setResetFeedback({
        type: 'error',
        text: 'Não foi possível processar o envio. Verifique o e-mail informado.'
      });
    } finally {
      setResetSubmitting(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="min-h-screen bg-[#071328] bg-radial-[at_top_right] from-[#002B5B] via-[#071328] to-[#040914] text-slate-100 flex flex-col justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Background Ambience / Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#40E0D0]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#002B5B]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#002B5B] to-[#40E0D0] text-[#002B5B] shadow-2xl ring-4 ring-[#40E0D0]/30 mb-4 transform hover:scale-105 transition-transform">
            <GraduationCap className="w-9 h-9 text-[#002B5B]" />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>AVA+ Presença</span>
            <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#40E0D0]/20 text-[#40E0D0] border border-[#40E0D0]/40 tracking-wider">
              Docente 360
            </span>
          </h1>
          
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Portal exclusivo para professores autorizados. Controle acadêmico, avaliações no AVA e registro de presença com isolamento de dados.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-slate-900/90 backdrop-blur-xl py-8 px-5 sm:px-8 shadow-2xl rounded-3xl border border-slate-700/80 relative">
          
          {/* Status / Restrição notice */}
          <div className="mb-5 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#40E0D0] shrink-0" />
            <span className="text-[11px] leading-tight">
              <strong>Acesso Restrito:</strong> Cadastro gerenciado exclusivamente pela administração. Cada docente acessa apenas seus próprios dados.
            </span>
          </div>

          {/* Validation / Error Feedback Alert */}
          {displayedError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-700/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">
                {displayedError}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo de E-mail */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                <span>E-mail Institucional ou Pessoal Autorizado</span>
                <span className="text-[10px] text-slate-400">Imutável</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="professor@escola.edu.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-[#40E0D0] focus:border-[#40E0D0] focus:outline-none transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Campo de Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetFeedback(null);
                    setShowResetModal(true);
                  }}
                  className="text-xs font-bold text-[#40E0D0] hover:text-[#38c9bb] hover:underline focus:outline-none transition-colors cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:ring-2 focus:ring-[#40E0D0] focus:border-[#40E0D0] focus:outline-none transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="text-slate-400 hover:text-slate-200 absolute right-3.5 top-3 focus:outline-none"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão Entrar */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm text-[#002B5B] bg-[#40E0D0] hover:bg-[#38c9bb] focus:ring-4 focus:ring-[#40E0D0]/30 shadow-lg shadow-[#40E0D0]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#002B5B] border-t-transparent rounded-full animate-spin" />
                    <span>Autenticando com segurança...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 stroke-[2.5]" />
                    <span>Entrar no Sistema</span>
                  </>
                )}
              </button>
            </div>

            {/* Separador de autenticação */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-slate-900 px-2 text-slate-400 font-bold">
                  ou acesse com conta institucional
                </span>
              </div>
            </div>

            {/* Entrar com Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Entrar com Google Workspace / Gmail</span>
            </button>

          </form>

          {/* Footer Info / Políticas de Privacidade */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-1">
            <p className="text-[11px] text-slate-400">
              Não possui acesso autorizado? Solicite seu cadastro ao administrador da instituição.
            </p>
            <p className="text-[10px] text-slate-500">
              Conformidade LGPD • Dados isolados por UID • Comunicação criptografada
            </p>
          </div>

        </div>

      </div>

      {/* Modal: Esqueci minha senha */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#40E0D0]/20 text-[#40E0D0] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Recuperação de Senha</h3>
                <p className="text-xs text-slate-400">Fluxo seguro via Firebase Authentication</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Informe o e-mail previamente cadastrado pelo administrador. Se o e-mail estiver autorizado, você receberá um link seguro para definir sua nova senha.
            </p>

            {resetFeedback && (
              <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                resetFeedback.type === 'success'
                  ? 'bg-emerald-950/70 border border-emerald-700 text-emerald-300'
                  : 'bg-rose-950/70 border border-rose-700 text-rose-300'
              }`}>
                {resetFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{resetFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  E-mail Cadastrado
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="professor@escola.edu.br"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-[#40E0D0] focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-4 py-2 text-xs font-black text-[#002B5B] bg-[#40E0D0] hover:bg-[#38c9bb] rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {resetSubmitting ? 'Enviando...' : 'Enviar Link de Redefinição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
