import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Search,
  Upload,
  Link as LinkIcon,
  X,
  User,
  Save,
  School,
  Check,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileCheck,
  Mail,
  ArrowDownAZ
} from 'lucide-react';
import { Student, AcademicStatus } from '../../types';
import { getStatusBadgeStyle } from '../../utils/avaCalculations';
import { formatCPF } from '../../utils/formatters';
import { StudentImportModal } from './StudentImportModal';

export const StudentManager: React.FC = () => {
  const { currentUser, students, addStudent, updateStudent, deleteStudent, courses, classes, institution } = useApp();
  const isProfessor = currentUser.role === 'professor';

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);

  // Add Form State
  const [fullName, setFullName] = useState('');
  const [academicRegistration, setAcademicRegistration] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('2002-01-01');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(classes[0]?.id ? [classes[0].id] : []);
  const [period, setPeriod] = useState('2026.1');
  const [status, setStatus] = useState<AcademicStatus>('Ativo');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoMode, setPhotoMode] = useState<'file' | 'url'>('file');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Edit Student State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editAcademicRegistration, setEditAcademicRegistration] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('2002-01-01');
  const [editEmail, setEditEmail] = useState('');
  const [editCourseId, setEditCourseId] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [editClassIds, setEditClassIds] = useState<string[]>([]);
  const [editPeriod, setEditPeriod] = useState('2026.1');
  const [editStatus, setEditStatus] = useState<AcademicStatus>('Ativo');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editPhotoMode, setEditPhotoMode] = useState<'file' | 'url'>('file');

  // Check if a student has incomplete / pending information
  const isStudentPendingInfo = (s: Student) => {
    if (!s) return true;
    const ra = s.academicRegistration || '';
    const cpfVal = s.cpf || '';
    const emailVal = s.email || '';
    return (
      !ra ||
      ra.startsWith('RA-PROV-') ||
      !cpfVal ||
      cpfVal === '000.000.000-00' ||
      !s.birthDate ||
      !emailVal ||
      emailVal.includes('pendente')
    );
  };

  // Export current students to Excel
  const handleExportStudents = () => {
    const dataToExport = students.map((s, idx) => ({
      '#': idx + 1,
      'Nome Completo': s?.fullName || '',
      'RA / Matrícula': s?.academicRegistration || '',
      'CPF': s?.cpf || '',
      'E-mail': s?.email || '',
      'Data de Nascimento': s?.birthDate || '',
      'Curso': s?.courseName || '',
      'Turma': s?.className || '',
      'Período': s?.period || '',
      'Situação': s?.status || 'Ativo',
      'Status Cadastro': isStudentPendingInfo(s) ? 'Informações Pendentes' : 'Completo'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudantes');
    XLSX.writeFile(workbook, `estudantes_${institution.name.replace(/\s+/g, '_')}.xlsx`);
  };

  const toggleClassId = (cId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(cId)
        ? (prev.length > 1 ? prev.filter(id => id !== cId) : prev)
        : [...prev, cId]
    );
  };

  const toggleEditClassId = (cId: string) => {
    setEditClassIds(prev =>
      prev.includes(cId)
        ? (prev.length > 1 ? prev.filter(id => id !== cId) : prev)
        : [...prev, cId]
    );
  };

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
            setEditPhotoUrl(event.target.result as string);
          } else {
            setPhotoUrl(event.target.result as string);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !academicRegistration.trim()) return;

    const courseObj = courses.find(c => c.id === courseId) || courses[0];
    const primaryClassId = selectedClassIds[0] || classId || classes[0]?.id || '';
    const selectedClasses = classes.filter(c => selectedClassIds.includes(c.id));
    const combinedClassNames = selectedClasses.length > 0
      ? selectedClasses.map(c => c.name).join(', ')
      : (classes.find(c => c.id === primaryClassId)?.name || 'Sem Turma');

    const studentEmail = email.trim() || `${fullName.trim().toLowerCase().replace(/\s+/g, '.')}@aluno.avamais.edu.br`;

    const newStudent: Student = {
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fullName: fullName.trim(),
      academicRegistration: academicRegistration.trim(),
      cpf: cpf.trim() || '000.000.000-00',
      birthDate: birthDate || '2002-01-01',
      email: studentEmail,
      courseId: courseObj?.id || courseId || '',
      courseName: courseObj?.name || 'Curso Regular',
      classId: primaryClassId,
      className: combinedClassNames,
      classIds: selectedClassIds.length > 0 ? selectedClassIds : (primaryClassId ? [primaryClassId] : []),
      period: period || '2026.1',
      status: status || 'Ativo',
      photoUrl: photoUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
    };

    addStudent(newStudent);
    setFullName('');
    setAcademicRegistration('');
    setCpf('');
    setEmail('');
    setPhotoUrl('');
  };

  const handleOpenEdit = (student: Student) => {
    if (!student) return;
    setEditingStudent(student);
    setEditFullName(student.fullName || '');
    setEditAcademicRegistration(student.academicRegistration || '');
    setEditCpf(formatCPF(student.cpf || ''));
    setEditBirthDate(student.birthDate || '2002-01-01');
    setEditEmail(student.email || '');
    setEditCourseId(student.courseId || courses[0]?.id || '');
    setEditClassId(student.classId || classes[0]?.id || '');

    const initialClassIds = Array.isArray(student.classIds) && student.classIds.length > 0
      ? student.classIds
      : (student.classId ? [student.classId] : []);
    setEditClassIds(initialClassIds);

    setEditPeriod(student.period || '2026.1');
    setEditStatus(student.status || 'Ativo');
    setEditPhotoUrl(student.photoUrl || '');
    setEditPhotoMode('file');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editFullName.trim() || !editAcademicRegistration.trim()) return;

    const courseObj = courses.find(c => c.id === editCourseId) || courses[0];
    const primaryEditClassId = editClassIds[0] || editClassId || classes[0]?.id || '';
    const selectedEditClasses = classes.filter(c => editClassIds.includes(c.id));
    const combinedEditClassNames = selectedEditClasses.length > 0
      ? selectedEditClasses.map(c => c.name).join(', ')
      : (classes.find(c => c.id === primaryEditClassId)?.name || editingStudent.className || 'Sem Turma');

    const updatedStudent: Student = {
      ...editingStudent,
      fullName: editFullName.trim(),
      academicRegistration: editAcademicRegistration.trim(),
      cpf: editCpf.trim() || '000.000.000-00',
      birthDate: editBirthDate || '2002-01-01',
      email: editEmail.trim() || `${editFullName.trim().toLowerCase().replace(/\s+/g, '.')}@aluno.avamais.edu.br`,
      courseId: courseObj?.id || editCourseId || '',
      courseName: courseObj?.name || editingStudent.courseName || '',
      classId: primaryEditClassId,
      className: combinedEditClassNames,
      classIds: editClassIds.length > 0 ? editClassIds : (primaryEditClassId ? [primaryEditClassId] : []),
      period: editPeriod || '2026.1',
      status: editStatus || 'Ativo',
      photoUrl: editPhotoUrl.trim() || editingStudent.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
    };

    updateStudent(updatedStudent);
    setEditingStudent(null);
  };

  const pendingCount = students.filter(isStudentPendingInfo).length;

  // Always maintain students in alphabetical order (A-Z)
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) =>
      (a.fullName || '').localeCompare(b.fullName || '', 'pt-BR', { sensitivity: 'base' })
    );
  }, [students]);

  const filteredStudents = useMemo(() => {
    return sortedStudents.filter(s => {
      if (!s) return false;
      const name = (s.fullName || '').toLowerCase();
      const ra = (s.academicRegistration || '').toLowerCase();
      const sCpf = (s.cpf || '').toLowerCase();
      const sEmail = (s.email || '').toLowerCase();
      const sClass = (s.className || '').toLowerCase();
      const sCourse = (s.courseName || '').toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        name.includes(term) ||
        ra.includes(term) ||
        sCpf.includes(term) ||
        sEmail.includes(term) ||
        sClass.includes(term) ||
        sCourse.includes(term);

      if (!matchesSearch) return false;

      if (statusFilter === 'incompletos') {
        return isStudentPendingInfo(s);
      }
      if (statusFilter === 'completos') {
        return !isStudentPendingInfo(s);
      }
      if (statusFilter !== 'todos' && s.status !== statusFilter) return false;

      return true;
    });
  }, [sortedStudents, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" /> CADASTRO E SITUAÇÃO DOS ALUNOS
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Gestão Acadêmica de Estudantes
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Cadastre manualmente ou importe turmas inteiras via planilhas do Excel ou Google Drive.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importar Planilha (Excel / Google Drive)</span>
          </button>

          <button
            type="button"
            onClick={handleExportStudents}
            disabled={students.length === 0}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            title="Exportar estudantes para planilha Excel"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Alert Banner for Incomplete Records */}
      {pendingCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-amber-900 dark:text-amber-200 text-sm">
                {pendingCount} Aluno(s) com Cadastro Parcial / Informações Pendentes
              </p>
              <p className="text-amber-700 dark:text-amber-300/90 text-xs mt-0.5">
                Alunos importados de listas sem R.A. oficial, CPF ou data de nascimento completa. Você pode preencher os dados restantes manualmente quando desejar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'incompletos' ? 'todos' : 'incompletos')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-sm self-start sm:self-auto"
          >
            <FileCheck className="w-4 h-4" />
            <span>{statusFilter === 'incompletos' ? 'Ver Todos os Alunos' : 'Filtrar Alunos Pendentes'}</span>
          </button>
        </div>
      )}

      {/* Form Add Student */}
      <form onSubmit={handleAdd} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-500" /> Cadastrar Novo Estudante
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome Completo do Aluno:</label>
              <input
                type="text"
                placeholder="Ex: João Pedro da Silva"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Registro Acadêmico (R.A.):</label>
              <input
                type="text"
                placeholder="Ex: 2026100582"
                value={academicRegistration}
                onChange={(e) => setAcademicRegistration(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-cyan-500" />
                <span>E-mail do Aluno:</span>
              </label>
              <input
                type="email"
                placeholder="Ex: aluno@avamais.edu.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Data de Nascimento:</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Curso:</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
              >
                {courses.length === 0 ? (
                  <option value="">Nenhum curso cadastrado</option>
                ) : (
                  courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <School className="w-4 h-4 text-cyan-500" /> Turmas Vinculadas ao Aluno:
              </label>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                Selecione uma ou mais turmas
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-44 overflow-y-auto pr-1">
              {classes.length === 0 ? (
                <p className="text-xs text-slate-500 italic col-span-2 py-3 text-center">
                  Nenhuma turma cadastrada. Cadastre turmas no menu Cursos & Turmas antes de vincular alunos.
                </p>
              ) : (
                classes.map(cls => {
                  const isSelected = selectedClassIds.includes(cls.id);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => toggleClassId(cls.id)}
                      className={`px-3 py-2 text-xs font-bold rounded-lg border text-left transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-cyan-500'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-extrabold truncate">{cls.name}</p>
                        <p className={`text-[10px] font-normal truncate ${isSelected ? 'text-cyan-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {cls.courseName} • Período {cls.period} ({cls.shift})
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Período Letivo:</label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Situação Acadêmica:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AcademicStatus)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="Ativo">Ativo (Verde)</option>
                <option value="Trancado">Trancado (Laranja)</option>
                <option value="Remanejado">Remanejado (Roxo)</option>
                <option value="Transferido">Transferido (Vermelho)</option>
              </select>
            </div>
          </div>

          {/* Photo Upload or URL Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-cyan-500" /> Foto do Estudante:
              </label>

              <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700/80 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setPhotoMode('file')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                    photoMode === 'file'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Upload className="w-3 h-3" /> Upload de Arquivo
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoMode('url')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                    photoMode === 'url'
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
              {photoUrl ? (
                <div className="relative shrink-0">
                  <img
                    src={photoUrl}
                    alt="Pré-visualização"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-cyan-500 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-700 transition-colors"
                    title="Remover foto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-dashed border-slate-300 dark:border-slate-600 text-slate-400">
                  <User className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                {photoMode === 'file' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:border-cyan-500 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all">
                      <Upload className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Escolher foto no dispositivo...</span>
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
                    placeholder="https://exemplo.com/foto-do-aluno.jpg"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Cadastrar Estudante
          </button>
        </form>

      {/* Student List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              Estudantes Cadastrados ({filteredStudents.length})
            </h2>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 flex items-center gap-1">
              <ArrowDownAZ className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Ordem Alfabética (A-Z)</span>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome, RA ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 outline-none shrink-0 font-medium"
            >
              <option value="todos">Todos os Alunos ({students.length})</option>
              {pendingCount > 0 && (
                <option value="incompletos" className="text-amber-600 font-bold">
                  ⚠️ Dados Pendentes ({pendingCount})
                </option>
              )}
              <option value="completos">✅ Cadastros Completos ({students.length - pendingCount})</option>
              <option disabled className="text-slate-400">── Por Situação ──</option>
              <option value="Ativo">Ativo (Verde)</option>
              <option value="Trancado">Trancado (Laranja)</option>
              <option value="Remanejado">Remanejado (Roxo)</option>
              <option value="Transferido">Transferido (Vermelho)</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {filteredStudents.map(s => {
            const hasPending = isStudentPendingInfo(s);
            return (
              <div key={s.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                    alt={s.fullName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{s.fullName}</p>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${getStatusBadgeStyle(s.status)}`}>
                        {s.status}
                      </span>
                      {hasPending && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded border bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Pendente</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono truncate">
                      RA: <span className={(s.academicRegistration || '').startsWith('RA-PROV-') ? 'text-amber-600 font-bold' : ''}>{s.academicRegistration}</span> • Curso: {s.courseName || 'Geral'} • CPF: <span className={s.cpf === '000.000.000-00' ? 'text-amber-600' : ''}>{s.cpf || 'Não informado'}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <School className="w-3.5 h-3.5 text-cyan-500" /> Turmas:
                      </span>
                      {(s.classIds && s.classIds.length > 0 
                        ? classes.filter(cls => s.classIds?.includes(cls.id)) 
                        : [classes.find(cls => cls.id === s.classId)].filter(Boolean)
                      ).map(cls => cls && (
                        <span key={cls.id} className="text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/60">
                          {cls.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(s)}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 border ${
                      hasPending
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                        : 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60'
                    }`}
                    title={hasPending ? 'Completar Cadastro' : 'Editar Estudante'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{hasPending ? 'Completar' : 'Editar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteStudent(s.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Excluir Aluno"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredStudents.length === 0 && (
            <p className="text-xs text-center text-slate-400 py-6">
              Nenhum estudante encontrado com os filtros aplicados.
            </p>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Editar Cadastro do Estudante
                  </h3>
                  <p className="text-xs text-slate-500">
                    Altere os dados pessoais, acadêmicos, turma, situação e foto do aluno.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome Completo do Aluno:</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Registro Acadêmico (R.A.):</label>
                  <input
                    type="text"
                    value={editAcademicRegistration}
                    onChange={(e) => setEditAcademicRegistration(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Data de Nascimento:</label>
                  <input
                    type="date"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">E-mail Institucional:</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Curso:</label>
                <select
                  value={editCourseId}
                  onChange={(e) => setEditCourseId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
                >
                  {courses.length === 0 ? (
                    <option value="">Nenhum curso cadastrado</option>
                  ) : (
                    courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <School className="w-4 h-4 text-cyan-500" /> Turmas Vinculadas ao Aluno:
                  </label>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                    Selecione uma ou mais turmas
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-44 overflow-y-auto pr-1">
                  {classes.length === 0 ? (
                    <p className="text-xs text-slate-500 italic col-span-2 py-3 text-center">
                      Nenhuma turma cadastrada no sistema.
                    </p>
                  ) : (
                    classes.map(cls => {
                      const isSelected = editClassIds.includes(cls.id);
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => toggleEditClassId(cls.id)}
                          className={`px-3 py-2 text-xs font-bold rounded-lg border text-left transition-all flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-cyan-500'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-extrabold truncate">{cls.name}</p>
                            <p className={`text-[10px] font-normal truncate ${isSelected ? 'text-cyan-100' : 'text-slate-500 dark:text-slate-400'}`}>
                              {cls.courseName} • Período {cls.period} ({cls.shift})
                            </p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Período Letivo:</label>
                  <input
                    type="text"
                    value={editPeriod}
                    onChange={(e) => setEditPeriod(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Situação Acadêmica:</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as AcademicStatus)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="Ativo">Ativo (Verde)</option>
                    <option value="Trancado">Trancado (Laranja)</option>
                    <option value="Remanejado">Remanejado (Roxo)</option>
                    <option value="Transferido">Transferido (Vermelho)</option>
                  </select>
                </div>
              </div>

              {/* Edit Photo Upload or URL Section */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-cyan-500" /> Alterar Foto do Estudante:
                  </label>

                  <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700/80 p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setEditPhotoMode('file')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                        editPhotoMode === 'file'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Upload className="w-3 h-3" /> Upload de Arquivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPhotoMode('url')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                        editPhotoMode === 'url'
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
                  {editPhotoUrl ? (
                    <div className="relative shrink-0">
                      <img
                        src={editPhotoUrl}
                        alt="Pré-visualização"
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-cyan-500 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setEditPhotoUrl('')}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-700 transition-colors"
                        title="Remover foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-dashed border-slate-300 dark:border-slate-600 text-slate-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {editPhotoMode === 'file' ? (
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
                        placeholder="https://exemplo.com/foto-do-aluno.jpg"
                        value={editPhotoUrl}
                        onChange={(e) => setEditPhotoUrl(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
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

      {/* Student Import Modal (Excel / Google Drive / Paste) */}
      <StudentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

    </div>
  );
};
