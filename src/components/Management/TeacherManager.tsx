import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Link as LinkIcon,
  X,
  User as UserIcon,
  Search,
  Save,
  BookOpen,
  School,
  Check,
  GraduationCap,
  Settings2,
  Sparkles,
  Building2,
  ShieldCheck,
  KeyRound,
  Mail,
  AlertCircle,
  RefreshCw,
  Lock
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { MultiSelectDropdown, MultiSelectOption } from '../Common/MultiSelectDropdown';
import { RoleConfigModal } from './RoleConfigModal';
import { formatCPF } from '../../utils/formatters';
import { adminCreateProfessorAccount, sendPasswordReset } from '../../firebase';

export const TeacherManager: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, courses, classes, curricularUnits, updateCurricularUnit, getRoleLabel, roleOrder, institution } = useApp();

  // Role Configuration Modal state
  const [showRoleConfigModal, setShowRoleConfigModal] = useState(false);

  // Provisioning state
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisioningFeedback, setProvisioningFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Add User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [registration, setRegistration] = useState('');
  const [role, setRole] = useState<UserRole>('professor');
  const [department, setDepartment] = useState('Ciência da Computação');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarMode, setAvatarMode] = useState<'file' | 'url'>('file');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedUCIds, setSelectedUCIds] = useState<string[]>([]);

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editRegistration, setEditRegistration] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('professor');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editAvatarMode, setEditAvatarMode] = useState<'file' | 'url'>('file');
  const [editCourseIds, setEditCourseIds] = useState<string[]>([]);
  const [editClassIds, setEditClassIds] = useState<string[]>([]);
  const [editUCIds, setEditUCIds] = useState<string[]>([]);

  const toggleCourse = (id: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const toggleClass = (id: string) => {
    setSelectedClassIds(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const toggleUC = (id: string) => {
    setSelectedUCIds(prev =>
      prev.includes(id) ? prev.filter(ucId => ucId !== id) : [...prev, id]
    );
  };

  const toggleEditCourse = (id: string) => {
    setEditCourseIds(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const toggleEditClass = (id: string) => {
    setEditClassIds(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const toggleEditUC = (id: string) => {
    setEditUCIds(prev =>
      prev.includes(id) ? prev.filter(ucId => ucId !== id) : [...prev, id]
    );
  };

  // Options for multi-select dropdowns from Courses and Classes (Gestão de Cursos e Turmas)
  const courseOptions: MultiSelectOption[] = courses.map(c => ({
    id: c.id,
    label: `${c.name} (${c.code})`,
    subLabel: `Turno: ${c.shift || 'Geral'} • Modalidade: ${c.modality || 'Presencial'}`,
    badge: c.code,
  }));

  const classOptions: MultiSelectOption[] = classes.map(cls => ({
    id: cls.id,
    label: cls.name,
    subLabel: `Curso: ${cls.courseName || 'Geral'} • Turno: ${cls.shift || 'Geral'} • ${cls.period || ''}`,
    badge: cls.shift,
  }));

  const ucOptions: MultiSelectOption[] = curricularUnits.map(uc => ({
    id: uc.id,
    label: uc.name,
    subLabel: `Turma: ${uc.className || 'Todas'} • Código: ${uc.code}`,
    badge: uc.code,
  }));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, GIF).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          if (isEdit) {
            setEditAvatarUrl(event.target.result as string);
          } else {
            setAvatarUrl(event.target.result as string);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsProvisioning(true);
    setProvisioningFeedback(null);

    try {
      const res = await adminCreateProfessorAccount({
        name: name.trim(),
        email: email.trim(),
        role,
        registration: registration.trim() || `DOC-${Date.now().toString().slice(-4)}`,
        department: department.trim(),
        cpf: cpf.trim() || '000.000.000-00',
        phone: phone.trim()
      });

      if (res.success) {
        setProvisioningFeedback({
          type: 'success',
          text: res.message
        });

        const newUser: User = {
          id: res.uid || `u-${Date.now()}`,
          name: name.trim(),
          email: email.trim(),
          cpf: cpf.trim() || '000.000.000-00',
          registration: registration.trim() || `DOC-${Date.now().toString().slice(-4)}`,
          role,
          department: department.trim(),
          phone: phone.trim(),
          avatarUrl: avatarUrl.trim() || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
          courseIds: selectedCourseIds,
          classIds: selectedClassIds,
          curricularUnitIds: selectedUCIds,
          authorized: true,
          status: 'Ativo'
        };

        addUser(newUser);

        // Sync selected UCs to point teacherId to this new user
        selectedUCIds.forEach(ucId => {
          const targetUC = curricularUnits.find(uc => uc.id === ucId);
          if (targetUC) {
            updateCurricularUnit({
              ...targetUC,
              teacherId: newUser.id,
              teacherName: newUser.name,
              teacherRegistration: newUser.registration
            });
          }
        });

        setName('');
        setEmail('');
        setCpf('');
        setRegistration('');
        setPhone('');
        setAvatarUrl('');
        setSelectedCourseIds([]);
        setSelectedClassIds([]);
        setSelectedUCIds([]);
      } else {
        setProvisioningFeedback({
          type: 'error',
          text: res.message
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar docente no Firebase.';
      setProvisioningFeedback({ type: 'error', text: msg });
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditCpf(formatCPF(user.cpf || ''));
    setEditRegistration(user.registration || '');
    setEditRole(user.role);
    setEditDepartment(user.department || '');
    setEditPhone(user.phone || '');
    setEditAvatarUrl(user.avatarUrl || '');
    setEditAvatarMode('file');
    setEditCourseIds(user.courseIds || []);
    setEditClassIds(user.classIds || []);

    const initialUCIds = user.curricularUnitIds && user.curricularUnitIds.length > 0
      ? user.curricularUnitIds
      : curricularUnits.filter(uc => uc.teacherId === user.id).map(uc => uc.id);
    setEditUCIds(initialUCIds);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editName.trim() || !editEmail.trim()) return;

    const updatedUser: User = {
      ...editingUser,
      name: editName.trim(),
      email: editEmail.trim(),
      cpf: editCpf.trim() || '000.000.000-00',
      registration: editRegistration.trim() || editingUser.registration,
      role: editRole,
      department: editDepartment.trim(),
      phone: editPhone.trim(),
      avatarUrl: editAvatarUrl.trim() || editingUser.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      courseIds: editCourseIds,
      classIds: editClassIds,
      curricularUnitIds: editUCIds
    };

    updateUser(updatedUser);

    // Sync selected UCs
    editUCIds.forEach(ucId => {
      const targetUC = curricularUnits.find(uc => uc.id === ucId);
      if (targetUC) {
        updateCurricularUnit({
          ...targetUC,
          teacherId: updatedUser.id,
          teacherName: updatedUser.name,
          teacherRegistration: updatedUser.registration
        });
      }
    });

    setEditingUser(null);
  };

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.registration && u.registration.toLowerCase().includes(term)) ||
      (u.department && u.department.toLowerCase().includes(term)) ||
      u.role.toLowerCase().includes(term)
    );
  });

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'coordenador':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'orientador':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'supervisor':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'professor':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      case 'aluno':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <UserCheck className="w-4 h-4" /> GESTÃO DE CORPO DOCENTE E USUÁRIOS
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Docentes e Administradores
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Cadastre e gerencie professores, coordenadores, orientadores, supervisores e administradores com vinculação direta a cursos e turmas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRoleConfigModal(true)}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 self-start md:self-auto hover:border-cyan-400"
        >
          <Settings2 className="w-4 h-4 text-cyan-400" />
          <span>Organizar & Renomear Perfis</span>
        </button>
      </div>

      {/* Form Add */}
      <form onSubmit={handleAdd} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Security / Admin Authorization Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/80 to-slate-900 border border-cyan-800/60 text-slate-200 text-xs flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-white text-xs sm:text-sm">
                Cadastro Administrativo de Docentes • Firebase Authentication
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Não há auto-registro público. O administrador cadastra o docente com e-mail imutável e o sistema emite um link seguro para o professor definir sua própria senha.
              </p>
            </div>
          </div>
        </div>

        {/* Provisioning Feedback */}
        {provisioningFeedback && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in ${
            provisioningFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}>
            {provisioningFeedback.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            )}
            <span className="font-semibold">{provisioningFeedback.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-500" /> Cadastrar e Autorizar Docente (Firebase Auth)
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
              <Building2 className="w-2.5 h-2.5 text-blue-500" />
              Unidade em Uso: {institution.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowRoleConfigModal(true)}
            className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" /> Organizar / Renomear Perfis
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome Completo:</label>
            <input
              type="text"
              placeholder="Ex: Prof. Dr. Fernando Souza"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">E-mail Institucional:</label>
            <input
              type="email"
              placeholder="exemplo@avamais.edu.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Registro Docente / Matrícula:</label>
            <input
              type="text"
              placeholder="Ex: DOC-2026-110"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Perfil de Acesso:</label>
              <button
                type="button"
                onClick={() => setShowRoleConfigModal(true)}
                title="Renomear perfis de acesso"
                className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-0.5 font-bold"
              >
                <Settings2 className="w-2.5 h-2.5" /> Editar
              </button>
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {roleOrder.map((r) => (
                <option key={r} value={r}>
                  {getRoleLabel(r)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">CPF:</label>
            <input
              type="text"
              placeholder="000.000.000-00"
              maxLength={14}
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Departamento:</label>
            <input
              type="text"
              placeholder="Ex: Ciência da Computação"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Telefone / WhatsApp:</label>
            <input
              type="text"
              placeholder="(11) 98765-4321"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Cursos, Turmas e Unidades Curriculares Associadas */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" /> Vinculação de Segmentos, Cursos e Turmas:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCourseIds(courses.map(c => c.id));
                  setSelectedClassIds(classes.map(cls => cls.id));
                  setSelectedUCIds(curricularUnits.map(uc => uc.id));
                }}
                className="text-xs bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 border border-cyan-200 dark:border-cyan-800 px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 shadow-sm"
              >
                <Check className="w-3 h-3" /> Vincular a Todos os Segmentos e Turmas
              </button>
              {(selectedCourseIds.length > 0 || selectedClassIds.length > 0 || selectedUCIds.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCourseIds([]);
                    setSelectedClassIds([]);
                    setSelectedUCIds([]);
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors"
                >
                  Limpar todos
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Cursos */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <MultiSelectDropdown
                label="Cursos Associados:"
                icon={<BookOpen className="w-4 h-4 text-cyan-500" />}
                placeholder="Selecione os cursos vinculados..."
                description="Cursos cadastrados em Gestão de Cursos e Turmas:"
                options={courseOptions}
                selectedIds={selectedCourseIds}
                onChange={setSelectedCourseIds}
                colorTheme="cyan"
                emptyMessage="Nenhum curso cadastrado no momento."
                idPrefix="add-user-courses"
              />
            </div>

            {/* Turmas */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <MultiSelectDropdown
                label="Turmas Associadas:"
                icon={<School className="w-4 h-4 text-emerald-500" />}
                placeholder="Selecione as turmas vinculadas..."
                description="Turmas cadastradas em Gestão de Cursos e Turmas:"
                options={classOptions}
                selectedIds={selectedClassIds}
                onChange={setSelectedClassIds}
                colorTheme="emerald"
                emptyMessage="Nenhuma turma cadastrada no momento."
                idPrefix="add-user-classes"
              />
            </div>

            {/* Unidades Curriculares (UCs / Disciplinas) */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <MultiSelectDropdown
                label="Unidades Curriculares (UCs):"
                icon={<GraduationCap className="w-4 h-4 text-purple-500" />}
                placeholder="Selecione as UCs vinculadas..."
                description="UCs cadastradas em Gestão de Disciplinas:"
                options={ucOptions}
                selectedIds={selectedUCIds}
                onChange={setSelectedUCIds}
                colorTheme="purple"
                emptyMessage="Nenhuma UC cadastrada no momento."
                idPrefix="add-user-ucs"
              />
            </div>
          </div>
        </div>

        {/* Photo Upload or URL Section */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-cyan-500" /> Foto do Usuário / Docente:
            </label>

            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700/80 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setAvatarMode('file')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                  avatarMode === 'file'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Upload className="w-3 h-3" /> Upload de Arquivo
              </button>
              <button
                type="button"
                onClick={() => setAvatarMode('url')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                  avatarMode === 'url'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LinkIcon className="w-3 h-3" /> URL da Imagem
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            {/* Preview Thumbnail */}
            {avatarUrl ? (
              <div className="relative shrink-0">
                <img
                  src={avatarUrl}
                  alt="Pré-visualização"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-cyan-500 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-700 transition-colors"
                  title="Remover foto"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-dashed border-slate-300 dark:border-slate-600 text-slate-400">
                <UserIcon className="w-6 h-6" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {avatarMode === 'file' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:border-cyan-500 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all">
                    <Upload className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Escolher foto do docente no dispositivo...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Formatos aceitos: JPG, PNG, WEBP, GIF
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="https://exemplo.com/foto-do-docente.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isProvisioning}
          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isProvisioning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Provisionando conta segura no Firebase Auth...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Cadastrar e Emitir Acesso Seguro ao Docente</span>
            </>
          )}
        </button>
      </form>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
            Usuários e Professores Cadastrados ({filteredUsers.length})
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredUsers.map(u => {
            const userCourses = courses.filter(c => u.courseIds?.includes(c.id));
            const userClasses = classes.filter(cls => u.classIds?.includes(cls.id));
            const userUCs = curricularUnits.filter(uc => u.curricularUnitIds?.includes(uc.id) || uc.teacherId === u.id);

            return (
              <div key={u.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={u.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'}
                    alt={u.name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-cyan-500/30 shrink-0"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{u.name}</p>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${getRoleBadgeColor(u.role)}`}>
                        {getRoleLabel(u.role)}
                      </span>
                      {u.authorized === false || u.status === 'Inativo' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Acesso Revogado
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" /> Acesso Autorizado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 flex-wrap">
                      <span>{u.email}</span>
                      <span>•</span>
                      <span>Matrícula: <strong>{u.registration}</strong></span>
                      {u.department && (
                        <>
                          <span>•</span>
                          <span>Dpto: {u.department}</span>
                        </>
                      )}
                    </p>

                    {/* Associated Courses, Classes & UCs badges */}
                    {(userCourses.length > 0 || userClasses.length > 0 || userUCs.length > 0) && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {userCourses.map(c => (
                          <span key={c.id} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                            <BookOpen className="w-3 h-3 text-cyan-500" />
                            {c.name}
                          </span>
                        ))}
                        {userClasses.map(cls => (
                          <span key={cls.id} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <School className="w-3 h-3 text-emerald-500" />
                            {cls.name}
                          </span>
                        ))}
                        {userUCs.map(uc => (
                          <span key={uc.id} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <GraduationCap className="w-3 h-3 text-purple-500" />
                            {uc.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await sendPasswordReset(u.email);
                      alert(res.message);
                    }}
                    className="px-2.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors flex items-center gap-1 border border-amber-300 dark:border-amber-800 cursor-pointer"
                    title="Enviar link de redefinição/definição de senha para o e-mail"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Link Senha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const isCurrentlyAuth = u.authorized !== false && u.status !== 'Inativo';
                      updateUser({
                        ...u,
                        authorized: !isCurrentlyAuth,
                        status: !isCurrentlyAuth ? 'Ativo' : 'Inativo'
                      });
                    }}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 border cursor-pointer ${
                      u.authorized === false || u.status === 'Inativo'
                        ? 'text-emerald-600 dark:text-emerald-400 border-emerald-300 hover:bg-emerald-50'
                        : 'text-slate-600 dark:text-slate-400 border-slate-300 hover:bg-slate-100'
                    }`}
                    title={u.authorized === false || u.status === 'Inativo' ? 'Autorizar Acesso' : 'Revogar Acesso'}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{u.authorized === false || u.status === 'Inativo' ? 'Autorizar' : 'Revogar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(u)}
                    className="px-2.5 py-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-lg transition-colors flex items-center gap-1 border border-cyan-200 dark:border-cyan-800/60 cursor-pointer"
                    title="Editar dados do usuário"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteUser(u.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Excluir Usuário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredUsers.length === 0 && (
            <p className="text-xs text-center text-slate-400 py-6">
              Nenhum usuário encontrado para o termo pesquisado.
            </p>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Editar Usuário / Docente
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                      <Building2 className="w-2.5 h-2.5 text-blue-500" />
                      Unidade em Uso: {institution.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Altere os dados pessoais, perfil de acesso, cursos e turmas vinculadas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome Completo:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">E-mail Institucional:</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Registro Docente / Matrícula:</label>
                  <input
                    type="text"
                    value={editRegistration}
                    onChange={(e) => setEditRegistration(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Perfil de Acesso:</label>
                    <button
                      type="button"
                      onClick={() => setShowRoleConfigModal(true)}
                      title="Renomear perfis de acesso"
                      className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-0.5 font-bold"
                    >
                      <Settings2 className="w-2.5 h-2.5" /> Editar
                    </button>
                  </div>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {roleOrder.map((r) => (
                      <option key={r} value={r}>
                        {getRoleLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">CPF:</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={editCpf}
                    onChange={(e) => setEditCpf(formatCPF(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Departamento:</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Edit Cursos, Turmas e Unidades Curriculares */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-500" /> Vinculação de Segmentos, Cursos e Turmas:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditCourseIds(courses.map(c => c.id));
                        setEditClassIds(classes.map(cls => cls.id));
                        setEditUCIds(curricularUnits.map(uc => uc.id));
                      }}
                      className="text-xs bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 border border-cyan-200 dark:border-cyan-800 px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3 h-3" /> Vincular a Todos os Segmentos e Turmas
                    </button>
                    {(editCourseIds.length > 0 || editClassIds.length > 0 || editUCIds.length > 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditCourseIds([]);
                          setEditClassIds([]);
                          setEditUCIds([]);
                        }}
                        className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors"
                      >
                        Limpar todos
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Edit Cursos */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <MultiSelectDropdown
                      label="Cursos Associados:"
                      icon={<BookOpen className="w-4 h-4 text-cyan-500" />}
                      placeholder="Selecione os cursos vinculados..."
                      description="Cursos cadastrados em Gestão de Cursos e Turmas:"
                      options={courseOptions}
                      selectedIds={editCourseIds}
                      onChange={setEditCourseIds}
                      colorTheme="cyan"
                      emptyMessage="Nenhum curso cadastrado no momento."
                      idPrefix="edit-user-courses"
                    />
                  </div>

                  {/* Edit Turmas */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <MultiSelectDropdown
                      label="Turmas Associadas:"
                      icon={<School className="w-4 h-4 text-emerald-500" />}
                      placeholder="Selecione as turmas vinculadas..."
                      description="Turmas cadastradas em Gestão de Cursos e Turmas:"
                      options={classOptions}
                      selectedIds={editClassIds}
                      onChange={setEditClassIds}
                      colorTheme="emerald"
                      emptyMessage="Nenhuma turma cadastrada no momento."
                      idPrefix="edit-user-classes"
                    />
                  </div>

                  {/* Edit Unidades Curriculares (UCs / Disciplinas) */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <MultiSelectDropdown
                      label="Unidades Curriculares (UCs):"
                      icon={<GraduationCap className="w-4 h-4 text-purple-500" />}
                      placeholder="Selecione as UCs vinculadas..."
                      description="UCs cadastradas em Gestão de Disciplinas:"
                      options={ucOptions}
                      selectedIds={editUCIds}
                      onChange={setEditUCIds}
                      colorTheme="purple"
                      emptyMessage="Nenhuma UC cadastrada no momento."
                      idPrefix="edit-user-ucs"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Upload or URL Section */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-cyan-500" /> Alterar Foto do Usuário / Docente:
                  </label>

                  <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700/80 p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setEditAvatarMode('file')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                        editAvatarMode === 'file'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Upload className="w-3 h-3" /> Upload de Arquivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditAvatarMode('url')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                        editAvatarMode === 'url'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" /> URL da Imagem
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  {/* Preview Thumbnail */}
                  {editAvatarUrl ? (
                    <div className="relative shrink-0">
                      <img
                        src={editAvatarUrl}
                        alt="Pré-visualização"
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-cyan-500 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setEditAvatarUrl('')}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-700 transition-colors"
                        title="Remover foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-dashed border-slate-300 dark:border-slate-600 text-slate-400">
                      <UserIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {editAvatarMode === 'file' ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:border-cyan-500 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all">
                          <Upload className="w-3.5 h-3.5 text-cyan-500" />
                          <span>Carregar nova foto do dispositivo...</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, true)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="https://exemplo.com/foto-do-docente.jpg"
                        value={editAvatarUrl}
                        onChange={(e) => setEditAvatarUrl(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Renaming / Configuration Modal */}
      <RoleConfigModal
        isOpen={showRoleConfigModal}
        onClose={() => setShowRoleConfigModal(false)}
      />

    </div>
  );
};
