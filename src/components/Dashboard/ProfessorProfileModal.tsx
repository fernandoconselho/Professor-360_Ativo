import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User as UserIcon,
  Mail,
  Phone,
  CreditCard,
  Building2,
  GraduationCap,
  Award,
  BookOpen,
  Camera,
  Upload,
  Link as LinkIcon,
  Check,
  X,
  Sparkles,
  Save,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  School,
  AlertCircle,
  Lock,
  KeyRound
} from 'lucide-react';
import { User } from '../../types';

interface ProfessorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfessorProfileModal: React.FC<ProfessorProfileModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    currentUser,
    updateUser,
    addAuditLog,
    institution,
    institutions,
    selectedInstitutionId,
    setSelectedInstitutionId,
    changePassword
  } = useApp();

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    cpf: '',
    registration: '',
    phone: '',
    department: '',
    title: '',
    titulation: 'Doutorado',
    formation: '',
    bio: '',
    lattesUrl: '',
    officeHours: '',
    avatarUrl: ''
  });

  const [avatarMode, setAvatarMode] = useState<'url' | 'upload'>('upload');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'academico' | 'foto' | 'seguranca'>('dados');
  const [errorMessage, setErrorMessage] = useState('');

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync form with currentUser whenever modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        cpf: currentUser.cpf || '',
        registration: currentUser.registration || '',
        phone: currentUser.phone || '',
        department: currentUser.department || '',
        title: currentUser.title || 'Profª.',
        titulation: currentUser.titulation || 'Doutorado',
        formation: currentUser.formation || '',
        bio: currentUser.bio || '',
        lattesUrl: currentUser.lattesUrl || '',
        officeHours: currentUser.officeHours || '',
        avatarUrl: currentUser.avatarUrl || ''
      });
      setSavedSuccess(false);
      setErrorMessage('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setErrorMessage('A imagem selecionada excede o tamanho máximo de 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
        setErrorMessage('');
      };
      reader.readAsDataURL(file);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers.length ? `(${numbers}` : '';
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrorMessage('Por favor, informe o seu nome completo.');
      return;
    }
    if (!formData.email?.trim()) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      name: formData.name.trim(),
      email: formData.email.trim(),
      cpf: formData.cpf?.trim() || currentUser.cpf,
      registration: formData.registration?.trim() || currentUser.registration,
      phone: formData.phone?.trim() || '',
      department: formData.department?.trim() || '',
      title: formData.title?.trim() || '',
      titulation: formData.titulation || 'Doutorado',
      formation: formData.formation?.trim() || '',
      bio: formData.bio?.trim() || '',
      lattesUrl: formData.lattesUrl?.trim() || '',
      officeHours: formData.officeHours?.trim() || '',
      avatarUrl: formData.avatarUrl || currentUser.avatarUrl
    };

    updateUser(updatedUser);
    addAuditLog(
      'Atualização de Dados Pessoais',
      `O docente ${updatedUser.name} (${updatedUser.registration}) atualizou suas informações cadastrais e perfil pessoal.`
    );

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', text: 'Informe sua senha atual para confirmação.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', text: 'A nova senha deve possuir pelo menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', text: 'A confirmação de senha não coincide com a nova senha.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordFeedback({ type: 'success', text: 'Senha alterada com sucesso via Firebase Authentication!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        addAuditLog('Alteração de Senha', `O docente ${currentUser.name} atualizou sua senha de acesso com sucesso.`);
      } else {
        setPasswordFeedback({ type: 'error', text: res.message || 'Falha ao alterar senha.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar a troca de senha.';
      setPasswordFeedback({ type: 'error', text: msg });
    } finally {
      setPasswordLoading(false);
    }
  };

  const instPrimary = institution?.primaryColor || '#002B5B';
  const instSecondary = institution?.secondaryColor || '#40E0D0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 transition-all transform animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="p-5 sm:p-6 text-white relative overflow-hidden flex items-start justify-between"
          style={{ backgroundColor: instPrimary }}
        >
          {/* Background decoration */}
          <div
            className="absolute -right-16 -top-16 w-48 h-48 rounded-full blur-2xl opacity-25 pointer-events-none"
            style={{ backgroundColor: instSecondary }}
          />

          <div className="relative z-10 flex items-center gap-3.5">
            <div className="relative">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt={formData.name || 'Docente'}
                  className="w-14 h-14 rounded-2xl object-cover border-2 shadow-md"
                  style={{ borderColor: instSecondary }}
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black border-2 shadow-md"
                  style={{
                    backgroundColor: `${instSecondary}30`,
                    color: instSecondary,
                    borderColor: instSecondary
                  }}
                >
                  {(formData.name || currentUser.name || 'D').charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className="absolute -bottom-1 -right-1 p-1 rounded-full text-slate-900 shadow-sm"
                style={{ backgroundColor: instSecondary }}
                title="Perfil Verificado"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `${instSecondary}25`,
                    color: instSecondary
                  }}
                >
                  Perfil Docente • AVA+ Presença
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/80 font-mono">
                  {formData.registration || currentUser.registration || 'DOC-000'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                Meus Dados Pessoais & Perfil
              </h2>
              <p className="text-xs text-slate-200 mt-0.5">
                Edite suas informações cadastrais, contato e apresentação acadêmica.
              </p>

              {/* Informação referente à Unidade Escolar que está usando o painel */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs border"
                  style={{
                    backgroundColor: `${instSecondary}25`,
                    borderColor: `${instSecondary}40`,
                    color: '#FFFFFF'
                  }}
                >
                  <Building2 className="w-3.5 h-3.5" style={{ color: instSecondary }} />
                  <span>Unidade em Uso: <strong className="font-extrabold">{institution.name}</strong></span>
                  {institution.city && (
                    <span className="text-white/80 text-[11px] font-normal">• {institution.city}{institution.state ? `/${institution.state}` : ''}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors shrink-0 relative z-10 cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 sm:px-6 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('dados')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'dados'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-800/80 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Dados Pessoais & Contato</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('academico')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'academico'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-800/80 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Titulação & Atendimento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('foto')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'foto'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-800/80 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Foto de Perfil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seguranca')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'seguranca'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-800/80 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Segurança & Senha</span>
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 stroke-[3]" />
            <span>Dados pessoais atualizados com sucesso no sistema!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          
          {/* TAB 1: DADOS PESSOAIS & CONTATO */}
          {activeTab === 'dados' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Informações da Unidade Escolar que está usando o painel */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: instPrimary }}
                    >
                      <Building2 className="w-5 h-5" style={{ color: instSecondary }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
                          Unidade Escolar em Operação
                        </span>
                        {institution.code && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {institution.code}
                          </span>
                        )}
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Painel Ativo
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight mt-0.5">
                        {institution.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {institution.address} • {institution.city || 'Vitória'}/{institution.state || 'ES'} • CNPJ: {institution.cnpj || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  {institutions.length > 1 && (
                    <div className="shrink-0 flex items-center gap-1.5 text-xs bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Alternar Unidade:</span>
                      <select
                        value={selectedInstitutionId}
                        onChange={e => setSelectedInstitutionId(e.target.value)}
                        className="bg-transparent font-bold text-xs text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                        title="Selecione a unidade que deseja usar no painel"
                      >
                        {institutions.map(inst => (
                          <option key={inst.id} value={inst.id} className="text-slate-900 dark:text-slate-100 dark:bg-slate-800">
                            {inst.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                
                {/* Tratamento / Prefixo */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tratamento
                  </label>
                  <select
                    value={formData.title || ''}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="Profª. Dra.">Profª. Dra.</option>
                    <option value="Prof. Dr.">Prof. Dr.</option>
                    <option value="Profª. Ma.">Profª. Ma.</option>
                    <option value="Prof. Me.">Prof. Me.</option>
                    <option value="Profª. Esp.">Profª. Esp.</option>
                    <option value="Prof. Esp.">Prof. Esp.</option>
                    <option value="Profª.">Profª.</option>
                    <option value="Prof.">Prof.</option>
                  </select>
                </div>

                {/* Nome Completo */}
                <div className="sm:col-span-9">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo do Docente <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ex: Mariana Silva Oliveira"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full text-xs font-semibold pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* E-mail Institucional */}
                <div className="sm:col-span-6">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      E-mail Institucional / Contato <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Imutável (Admin)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      disabled={currentUser.role !== 'admin'}
                      readOnly={currentUser.role !== 'admin'}
                      placeholder="docente@escola.edu.br"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full text-xs font-semibold pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 ${
                        currentUser.role !== 'admin'
                          ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed select-none'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500'
                      } focus:outline-none`}
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Definido no cadastro inicial pelo administrador. Somente a administração pode alterar.
                  </p>
                </div>

                {/* Telefone / WhatsApp */}
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      className="w-full text-xs font-semibold pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* CPF */}
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    CPF (Documento Pessoal)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={formData.cpf || ''}
                      onChange={e => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                      className="w-full text-xs font-semibold pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Registro Funcional / Matrícula / SIAPE */}
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Registro Docente / Matrícula / SIAPE
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: DOC-2024-089 ou SIAPE 1829304"
                      value={formData.registration || ''}
                      onChange={e => setFormData({ ...formData, registration: e.target.value })}
                      className="w-full text-xs font-semibold pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono"
                    />
                    <Award className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Departamento / Área */}
                <div className="sm:col-span-12">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Departamento / Colegiado / Área de Lotação
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: Departamento de Ciência da Computação e Tecnologia da Informação"
                      value={formData.department || ''}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="w-full text-xs font-semibold pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: TITULAÇÃO & ATENDIMENTO ACADÊMICO */}
          {activeTab === 'academico' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                
                {/* Grau / Titulação Máxima */}
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Titulação Acadêmica Máxima
                  </label>
                  <select
                    value={formData.titulation || 'Doutorado'}
                    onChange={e => setFormData({ ...formData, titulation: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="Pós-Doutorado">Pós-Doutorado</option>
                    <option value="Doutorado">Doutorado (Dr. / Dra.)</option>
                    <option value="Mestrado">Mestrado (Me. / Ma.)</option>
                    <option value="Especialização / MBA">Especialização / MBA (Esp.)</option>
                    <option value="Graduação / Bacharelado">Graduação / Licenciatura</option>
                  </select>
                </div>

                {/* Formação de Origem / Curso */}
                <div className="sm:col-span-7">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Formação Principal & Instituição Formadora
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Doutora em Ciência da Computação (USP)"
                    value={formData.formation || ''}
                    onChange={e => setFormData({ ...formData, formation: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Link Currículo Lattes / Perfil */}
                <div className="sm:col-span-12">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Link do Currículo Lattes / Perfil Acadêmico
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="http://lattes.cnpq.br/1234567890123456"
                      value={formData.lattesUrl || ''}
                      onChange={e => setFormData({ ...formData, lattesUrl: e.target.value })}
                      className="w-full text-xs font-semibold pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Horário de Atendimento e Plantão de Dúvidas */}
                <div className="sm:col-span-12">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horários de Atendimento aos Estudantes / Plantão de Dúvidas
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: Segundas e Quartas das 17h00 às 18h30 (Sala 4 / Google Meet)"
                      value={formData.officeHours || ''}
                      onChange={e => setFormData({ ...formData, officeHours: e.target.value })}
                      className="w-full text-xs font-semibold pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Mini-Bio / Resumo Profissional */}
                <div className="sm:col-span-12">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Apresentação & Mini-Currículo Pedagógico
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Breve resumo sobre sua experiência docente, linhas de pesquisa e metodologia de ensino..."
                    value={formData.bio || ''}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: FOTO DE PERFIL / AVATAR */}
          {activeTab === 'foto' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                
                {/* Avatar Preview */}
                <div className="relative shrink-0">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="Prévia"
                      className="w-24 h-24 rounded-2xl object-cover border-4 shadow-lg"
                      style={{ borderColor: instSecondary }}
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black border-4 shadow-lg"
                      style={{
                        backgroundColor: `${instSecondary}25`,
                        color: instPrimary,
                        borderColor: instSecondary
                      }}
                    >
                      {(formData.name || 'D').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {formData.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarUrl: '' })}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-500 text-white shadow hover:bg-rose-600 transition-colors"
                      title="Remover foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Upload or URL selector */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAvatarMode('upload')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        avatarMode === 'upload'
                          ? 'bg-cyan-500 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload do Dispositivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAvatarMode('url')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        avatarMode === 'url'
                          ? 'bg-cyan-500 text-white shadow-sm'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Link / URL Externa</span>
                    </button>
                  </div>

                  {avatarMode === 'upload' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Escolha uma imagem (JPG, PNG, WebP até 3MB):
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 dark:file:bg-cyan-950 dark:file:text-cyan-300 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        URL Direta da Imagem:
                      </label>
                      <input
                        type="url"
                        placeholder="https://exemplo.com/minha-foto.jpg"
                        value={formData.avatarUrl || ''}
                        onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Sample presets */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Ou selecione uma foto ilustrativa:
                    </span>
                    <div className="flex items-center gap-2">
                      {[
                        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                        'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200'
                      ].map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFormData({ ...formData, avatarUrl: url })}
                          className="w-9 h-9 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-cyan-500 transition-all hover:scale-105"
                        >
                          <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: SEGURANÇA & ALTERAÇÃO DE SENHA */}
          {activeTab === 'seguranca' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Alterar Minha Senha de Acesso</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Utiliza autenticação criptografada Firebase Authentication com reautenticação imediata.
                    </p>
                  </div>
                </div>

                {passwordFeedback && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    passwordFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  }`}>
                    {passwordFeedback.type === 'success' ? (
                      <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    )}
                    <span>{passwordFeedback.text}</span>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nova Senha (Mín. 6 caracteres)
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Confirmar Nova Senha
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handlePasswordChange}
                      disabled={passwordLoading}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{passwordLoading ? 'Atualizando senha...' : 'Confirmar e Alterar Senha'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-cyan-500" />
              <span>Unidade Ativa: <strong>{institution?.name || 'AVA+'}</strong></span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2 text-xs font-extrabold text-[#002B5B] bg-[#40E0D0] hover:bg-[#38c9bb] rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                style={{
                  backgroundColor: instSecondary,
                  color: instPrimary
                }}
              >
                <Save className="w-4 h-4" />
                <span>Salvar Meus Dados</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
