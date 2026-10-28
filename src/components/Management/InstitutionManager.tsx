import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Save,
  CheckCircle2,
  Shield,
  Sliders,
  Upload,
  Link as LinkIcon,
  X,
  Image as ImageIcon,
  Plus,
  Trash2,
  School,
  Check,
  ChevronDown,
  Info,
  BookOpen,
  Users,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  Palette
} from 'lucide-react';
import { Institution } from '../../types';
import { HexagonColorPicker } from '../Common/HexagonColorPicker';

export const InstitutionManager: React.FC = () => {
  const {
    institutions,
    selectedInstitutionId,
    setSelectedInstitutionId,
    institution,
    updateInstitution,
    addInstitution,
    deleteInstitution,
    allCourses,
    allClasses,
    allCurricularUnits,
    allStudents
  } = useApp();

  const [formData, setFormData] = useState<Institution>({ ...institution });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [logoMode, setLogoMode] = useState<'file' | 'url'>('file');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New institution state for modal
  const [newInstData, setNewInstData] = useState<Partial<Institution>>({
    name: '',
    code: '',
    cnpj: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    email: '',
    phone: '',
    director: '',
    minPassingGrade: 6.0,
    minAttendancePercentage: 75,
    logoUrl: '',
    primaryColor: '#002B5B',
    secondaryColor: '#40E0D0'
  });

  useEffect(() => {
    setFormData({ ...institution });
  }, [institution, selectedInstitutionId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isModal = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, SVG, GIF).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const url = event.target.result as string;
          if (isModal) {
            setNewInstData(prev => ({ ...prev, logoUrl: url }));
          } else {
            setFormData(prev => ({ ...prev, logoUrl: url }));
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateInstitution(formData, formData.id);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCreateNewInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstData.name?.trim()) {
      alert('Por favor, insira o nome da instituição.');
      return;
    }
    const newInst: Institution = {
      id: `inst-${Date.now()}`,
      name: newInstData.name.trim(),
      code: newInstData.code?.trim() || 'UNID',
      cnpj: newInstData.cnpj?.trim() || '00.000.000/0001-00',
      address: newInstData.address || '',
      city: newInstData.city || '',
      state: newInstData.state || '',
      zipCode: newInstData.zipCode || '',
      email: newInstData.email || '',
      phone: newInstData.phone || '',
      director: newInstData.director || '',
      minPassingGrade: Number(newInstData.minPassingGrade) || 6.0,
      minAttendancePercentage: Number(newInstData.minAttendancePercentage) || 75,
      logoUrl: newInstData.logoUrl || '',
      primaryColor: newInstData.primaryColor || '#002B5B',
      secondaryColor: newInstData.secondaryColor || '#40E0D0'
    };

    const success = addInstitution(newInst);
    if (success) {
      setShowAddModal(false);
      setNewInstData({
        name: '',
        code: '',
        cnpj: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        email: '',
        phone: '',
        director: '',
        minPassingGrade: 6.0,
        minAttendancePercentage: 75,
        logoUrl: '',
        primaryColor: '#002B5B',
        secondaryColor: '#40E0D0'
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const getStats = (instId: string) => {
    const cCount = allCourses.filter(c => (c.institutionId || institutions[0]?.id) === instId).length;
    const clCount = allClasses.filter(c => (c.institutionId || institutions[0]?.id) === instId).length;
    const ucCount = allCurricularUnits.filter(u => (u.institutionId || institutions[0]?.id) === instId).length;
    const sCount = allStudents.filter(s => (s.institutionId || institutions[0]?.id) === instId).length;
    return { cCount, clCount, ucCount, sCount };
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#002B5B] to-[#001D3D] text-white rounded-2xl p-6 border border-[#ffffff15] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#40E0D0]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 text-[#40E0D0] font-extrabold text-xs uppercase tracking-wider">
              <School className="w-4 h-4" /> Gestão Multi-Institucional do Professor
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Unidades Escolares Cadastradas
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Você pode cadastrar até <strong>3 instituições de ensino</strong>. Cada instituição mantém suas turmas, cursos, disciplinas e alunos <strong>100% isolados</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 text-center">
              <span className="text-[10px] uppercase font-bold text-[#40E0D0] block">Vagas de Cadastro</span>
              <span className="text-xl font-black text-white">{institutions.length} <span className="text-xs text-slate-300 font-normal">/ 3</span></span>
            </div>

            {institutions.length < 3 ? (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 bg-[#40E0D0] hover:bg-[#40E0D0]/90 text-[#002B5B] font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Cadastrar Nova Unidade ({institutions.length + 1}/3)
              </button>
            ) : (
              <div className="px-3.5 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Limite de 3 Atingido
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Institution Switcher & Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {institutions.map((inst, index) => {
          const isSelected = inst.id === selectedInstitutionId;
          const stats = getStats(inst.id);
          const instPrimary = inst.primaryColor || '#002B5B';
          const instSecondary = inst.secondaryColor || '#40E0D0';

          return (
            <div
              key={inst.id}
              onClick={() => setSelectedInstitutionId(inst.id)}
              className={`relative rounded-2xl p-5 transition-all cursor-pointer border flex flex-col justify-between overflow-hidden ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 ring-2 shadow-xl'
                  : 'bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
              }`}
              style={{
                borderColor: isSelected ? instSecondary : undefined,
                boxShadow: isSelected ? `0 10px 25px -5px ${instSecondary}25, 0 8px 10px -6px ${instSecondary}20` : undefined
              }}
            >
              {/* Color Stripe indicator on card top */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 transition-all"
                style={{
                  background: `linear-gradient(90deg, ${instPrimary} 0%, ${instSecondary} 100%)`
                }}
              />

              <div>
                {/* Card Top Row */}
                <div className="flex items-start justify-between gap-3 mb-3 pt-1">
                  <div className="flex items-center gap-3">
                    {inst.logoUrl ? (
                      <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                        <img src={inst.logoUrl} alt={inst.name} className="w-full h-full object-contain rounded-lg" />
                      </div>
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl font-black text-lg flex items-center justify-center shrink-0 border shadow-sm"
                        style={{
                          backgroundColor: `${instSecondary}20`,
                          color: instPrimary,
                          borderColor: `${instSecondary}40`
                        }}
                      >
                        {inst.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded"
                          style={{
                            backgroundColor: `${instSecondary}15`,
                            color: isSelected ? instSecondary : undefined
                          }}
                        >
                          Instituição {index + 1}
                        </span>
                        {/* Miniature color dots */}
                        <div className="flex items-center -space-x-1">
                          <span className="w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 shadow-xs" style={{ backgroundColor: instPrimary }} title={`Cor Principal: ${instPrimary}`} />
                          <span className="w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 shadow-xs" style={{ backgroundColor: instSecondary }} title={`Cor Secundária: ${instSecondary}`} />
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 mt-0.5">
                        {inst.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {inst.city ? `${inst.city}/${inst.state || ''}` : 'Campus Ativo'}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shrink-0 shadow-xs"
                      style={{
                        backgroundColor: `${instSecondary}20`,
                        color: instSecondary,
                        border: `1px solid ${instSecondary}50`
                      }}
                    >
                      <Check className="w-3 h-3 stroke-[3]" /> ATIVA
                    </span>
                  )}
                </div>

                {/* Isolated Stats preview */}
                <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-center my-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Cursos</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{stats.cCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Turmas</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{stats.clCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Alunos</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{stats.sCount}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-2">
                <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">
                  CNPJ: {inst.cnpj || '00.000.000/0001-00'}
                </span>

                {institutions.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(inst.id);
                    }}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Excluir esta instituição"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty slot placeholder if < 3 */}
        {institutions.length < 3 && (
          <div
            onClick={() => setShowAddModal(true)}
            className="rounded-2xl p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#40E0D0] dark:hover:border-[#40E0D0] bg-slate-50/50 dark:bg-slate-900/30 hover:bg-[#40E0D0]/5 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[190px]"
          >
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-[#40E0D0]/20 text-slate-400 group-hover:text-[#40E0D0] flex items-center justify-center mb-3 transition-colors">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 group-hover:text-[#002B5B] dark:group-hover:text-[#40E0D0]">
              Cadastrar {institutions.length + 1}ª Instituição
            </span>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              Clique para adicionar mais uma escola/faculdade independente
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Deletion */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Excluir Unidade Escolar?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tem certeza que deseja remover <strong>{institutions.find(i => i.id === deleteConfirmId)?.name}</strong>? Os dados vinculados a ela serão desvinculados.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteInstitution(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-lg transition-colors"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Edit Form for the Selected Institution */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#40E0D0]" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Editando: {formData.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Altere as informações da unidade escolar selecionada.
            </p>
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-gradient-to-r from-[#002B5B] to-[#001D3D] text-[#40E0D0] hover:text-white font-extrabold text-xs rounded-xl shadow-md border border-[#40E0D0]/30 hover:border-[#40E0D0] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Salvar Alterações desta Unidade
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Dados da unidade escolar atualizados e salvos com sucesso!
          </div>
        )}

        {/* Section 1: Basic Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#40E0D0]" /> Identificação & Registro
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nome da Instituição / Escola / Universidade:
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#40E0D0] outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Sigla ou Código:
              </label>
              <input
                type="text"
                value={formData.code || ''}
                placeholder="Ex: FATEC-SP, UNIP, IFSP"
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#40E0D0] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                CNPJ da Instituição:
              </label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#40E0D0] outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Diretor / Coordenador Geral:
              </label>
              <input
                type="text"
                value={formData.director || ''}
                onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#40E0D0] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                E-mail Institucional:
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#40E0D0] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Address */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <School className="w-4 h-4 text-[#40E0D0]" /> Localização & Endereço
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Logradouro Completo:
              </label>
              <input
                type="text"
                placeholder="Rua, Av., Número, Bairro"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#40E0D0] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Cidade:
              </label>
              <input
                type="text"
                placeholder="Ex: São Paulo"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#40E0D0] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Estado (UF):
              </label>
              <input
                type="text"
                placeholder="Ex: SP"
                maxLength={2}
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#40E0D0] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Logo Upload */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#40E0D0]" /> Logotipo desta Instituição:
            </label>

            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700/80 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setLogoMode('file')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                  logoMode === 'file'
                    ? 'bg-[#002B5B] text-[#40E0D0] shadow-sm'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <Upload className="w-3 h-3" /> Upload Local
              </button>
              <button
                type="button"
                onClick={() => setLogoMode('url')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                  logoMode === 'url'
                    ? 'bg-[#002B5B] text-[#40E0D0] shadow-sm'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <LinkIcon className="w-3 h-3" /> URL Web
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            {formData.logoUrl ? (
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-xl bg-white p-1 border border-slate-300 dark:border-slate-600 flex items-center justify-center shadow-md">
                  <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logoUrl: '' })}
                  className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-700 transition-colors"
                  title="Remover logo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-dashed border-slate-300 dark:border-slate-600 text-slate-400">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {logoMode === 'file' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:border-[#40E0D0] rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all">
                    <Upload className="w-4 h-4 text-[#40E0D0]" />
                    <span>Carregar Logo do Computador/Celular</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, false)} className="hidden" />
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    PNG, JPG, SVG, WEBP. Aparecerá no topo do AVA.
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="https://exemplo.com/logo-instituicao.png"
                  value={formData.logoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#40E0D0]"
                />
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Visual Identity & Hexagonal Color Picker */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#40E0D0]" /> Identidade Visual & Cores da Unidade Escolar
            </h3>
            <span className="text-[11px] text-slate-500">
              Personalize para diferenciar esta instituição no AVA
            </span>
          </div>

          <HexagonColorPicker
            primaryColor={formData.primaryColor || '#002B5B'}
            secondaryColor={formData.secondaryColor || '#40E0D0'}
            onChangePrimary={(color) => setFormData({ ...formData, primaryColor: color })}
            onChangeSecondary={(color) => setFormData({ ...formData, secondaryColor: color })}
            institutionName={formData.name || 'Nome da Instituição'}
            institutionCode={formData.code || 'AVA'}
          />
        </div>

        {/* Section 5: Academic Rules */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" /> Parâmetros de Avaliação e Frequência desta Instituição
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/30">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Média Mínima para Aprovação (Nota de Corte):
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.minPassingGrade}
                onChange={(e) => setFormData({ ...formData, minPassingGrade: Number(e.target.value) })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-black text-cyan-600 dark:text-cyan-400 focus:ring-2 focus:ring-[#40E0D0] outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Utilizada para calcular o status (Aprovado / Exame / Reprovado) nas turmas desta instituição.</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Frequência Mínima Exigida (%):
              </label>
              <input
                type="number"
                step="1"
                min="50"
                max="100"
                value={formData.minAttendancePercentage}
                onChange={(e) => setFormData({ ...formData, minAttendancePercentage: Number(e.target.value) })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm font-black text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Padrão regulamentar: 75%. Alertas automáticos serão disparados se o aluno ficar abaixo.</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 bg-[#002B5B] hover:bg-[#001D3D] text-[#40E0D0] hover:text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xl border border-[#40E0D0]/40 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" /> Salvar Configurações da Unidade Escolar
          </button>
        </div>
      </form>

      {/* Modal: Cadastrar Nova Instituição */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#40E0D0]/20 text-[#002B5B] dark:text-[#40E0D0] flex items-center justify-center font-bold">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Cadastrar Nova Unidade Escolar ({institutions.length + 1} de 3)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Adicione uma nova instituição de ensino para gerenciar turmas separadamente.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewInstitution} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nome da Escola ou Faculdade: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Instituto Federal de Tecnologia"
                    value={newInstData.name}
                    onChange={(e) => setNewInstData({ ...newInstData, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#40E0D0]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Sigla / Código:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: IFET, USP"
                    value={newInstData.code}
                    onChange={(e) => setNewInstData({ ...newInstData, code: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#40E0D0]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    CNPJ:
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={newInstData.cnpj}
                    onChange={(e) => setNewInstData({ ...newInstData, cnpj: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#40E0D0]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Cidade:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Campinas"
                    value={newInstData.city}
                    onChange={(e) => setNewInstData({ ...newInstData, city: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#40E0D0]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Estado (UF):
                  </label>
                  <input
                    type="text"
                    placeholder="SP"
                    maxLength={2}
                    value={newInstData.state}
                    onChange={(e) => setNewInstData({ ...newInstData, state: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#40E0D0]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Logotipo (URL da Imagem ou Arquivo):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://exemplo.com/logo.png"
                      value={newInstData.logoUrl}
                      onChange={(e) => setNewInstData({ ...newInstData, logoUrl: e.target.value })}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#40E0D0]"
                    />
                    <label className="cursor-pointer px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-[#40E0D0]/20 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" /> Arquivo
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, true)} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Média Mínima:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={newInstData.minPassingGrade}
                    onChange={(e) => setNewInstData({ ...newInstData, minPassingGrade: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#40E0D0]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Frequência Mínima (%):
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="50"
                    max="100"
                    value={newInstData.minAttendancePercentage}
                    onChange={(e) => setNewInstData({ ...newInstData, minAttendancePercentage: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#40E0D0]"
                  />
                </div>
              </div>

              {/* Hexagonal Color Picker inside Modal */}
              <div className="pt-2">
                <HexagonColorPicker
                  primaryColor={newInstData.primaryColor || '#002B5B'}
                  secondaryColor={newInstData.secondaryColor || '#40E0D0'}
                  onChangePrimary={(color) => setNewInstData({ ...newInstData, primaryColor: color })}
                  onChangeSecondary={(color) => setNewInstData({ ...newInstData, secondaryColor: color })}
                  institutionName={newInstData.name || 'Nova Instituição'}
                  institutionCode={newInstData.code || 'NOVA'}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#002B5B] hover:bg-[#001D3D] text-[#40E0D0] hover:text-white text-xs font-extrabold shadow-lg transition-all flex items-center gap-2 cursor-pointer border border-[#40E0D0]/40"
                >
                  <Plus className="w-4 h-4" /> Concluir Cadastro da Instituição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
