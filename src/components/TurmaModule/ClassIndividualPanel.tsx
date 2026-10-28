import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AVASpreadsheet } from '../AVAModule/AVASpreadsheet';
import {
  Users,
  Table,
  CalendarCheck2,
  BookOpenCheck,
  GraduationCap,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ChevronDown,
  Layers,
  Sparkles,
  TrendingUp,
  Percent,
  Search,
  Mail,
  Award,
  Check,
  ChevronRight,
  School,
  BookOpen
} from 'lucide-react';
import { getStatusBadgeStyle, getStatusAbbreviation } from '../../utils/avaCalculations';

interface ClassIndividualPanelProps {
  initialTab?: 'ava-planilha' | 'alunos';
}

export const ClassIndividualPanel: React.FC<ClassIndividualPanelProps> = ({ initialTab = 'ava-planilha' }) => {
  const {
    classes,
    curricularUnits,
    selectedUC,
    selectedUCId,
    setSelectedUCId,
    selectedClass,
    selectedClassId,
    setSelectedClassId,
    students,
    computedResults,
    attendanceRecords,
    institution,
    currentUser
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'ava-planilha' | 'alunos'>(initialTab === 'alunos' ? 'alunos' : 'ava-planilha');
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (initialTab === 'alunos') {
      setActiveSubTab('alunos');
    } else {
      setActiveSubTab('ava-planilha');
    }
  }, [initialTab]);

  // Determine current active class strictly based on selectedClassId / selectedClass
  const currentClass = useMemo(() => {
    if (selectedClassId) {
      const found = classes.find(c => c.id === selectedClassId);
      if (found) return found;
    }
    if (selectedClass) return selectedClass;
    if (selectedUC?.classId) {
      const found = classes.find(c => c.id === selectedUC.classId);
      if (found) return found;
    }
    return classes[0] || null;
  }, [classes, selectedClassId, selectedClass, selectedUC]);

  // Synchronize selectedClassId if currentClass is resolved
  useEffect(() => {
    if (currentClass && (!selectedClassId || selectedClassId !== currentClass.id)) {
      setSelectedClassId(currentClass.id);
    }
  }, [currentClass?.id]);

  // List of UCs / Disciplines associated strictly with this selected class
  const classDisciplines = useMemo(() => {
    if (!currentClass) return [];
    return curricularUnits.filter(
      u => u.classId === currentClass.id ||
           u.additionalClassIds?.includes(currentClass.id) ||
           u.className === currentClass.name
    );
  }, [currentClass, curricularUnits]);

  // Automatically ensure selectedUCId belongs to the selected class
  useEffect(() => {
    if (currentClass) {
      if (classDisciplines.length > 0) {
        const isCurrentInClass = classDisciplines.some(u => u.id === selectedUCId);
        if (!isCurrentInClass) {
          setSelectedUCId(classDisciplines[0].id);
        }
      } else {
        setSelectedUCId('');
      }
    }
  }, [currentClass?.id, classDisciplines, selectedUCId, setSelectedUCId]);

  // Students strictly belonging to this active class
  const classStudents = useMemo(() => {
    if (!currentClass) return [];
    return students.filter(s => {
      const studentClassIds = s.classIds && s.classIds.length > 0 ? s.classIds : [s.classId];
      return studentClassIds.includes(currentClass.id) || s.className === currentClass.name;
    });
  }, [currentClass, students]);

  // Filtered students in the students subtab
  const filteredClassStudents = useMemo(() => {
    return classStudents.filter(s => {
      const q = studentSearch.toLowerCase();
      const studentName = s.fullName || '';
      return (
        studentName.toLowerCase().includes(q) ||
        s.academicRegistration.includes(q) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    });
  }, [classStudents, studentSearch]);

  // General academic statistics strictly for this selected class
  const classStats = useMemo(() => {
    if (!currentClass) {
      return { total: 0, approved: 0, inRisk: 0, avgGrade: '0.0' };
    }

    const classResults = computedResults.filter(r => {
      return classStudents.some(s => s.id === r.studentId);
    });

    const total = classStudents.length;
    const minPassing = institution.minPassingGrade || 6.0;
    const approved = classResults.filter(r => r.notaFinal >= minPassing).length;
    const inRisk = classResults.filter(r => r.notaFinal < minPassing).length;
    
    const avgGrade = classResults.length > 0
      ? (classResults.reduce((acc, curr) => acc + (curr.notaFinal || 0), 0) / classResults.length).toFixed(1)
      : '0.0';

    return {
      total,
      approved,
      inRisk,
      avgGrade
    };
  }, [currentClass, classStudents, computedResults, institution]);

  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [classDropdownFilter, setClassDropdownFilter] = useState('');
  const classDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target as Node)) {
        setIsClassDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    const cls = classes.find(c => c.id === classId);
    const matchingUC = curricularUnits.find(
      u => u.classId === classId ||
           (u.additionalClassIds && u.additionalClassIds.includes(classId)) ||
           (cls && u.className === cls.name)
    );
    if (matchingUC) {
      setSelectedUCId(matchingUC.id);
    } else {
      setSelectedUCId('');
    }
    setIsClassDropdownOpen(false);
    setClassDropdownFilter('');
  };

  // Filter classes in dropdown
  const filteredDropdownClasses = useMemo(() => {
    if (!classDropdownFilter.trim()) return classes;
    const q = classDropdownFilter.toLowerCase().trim();
    return classes.filter(cls => {
      const name = (cls.name || '').toLowerCase();
      const course = (cls.courseName || '').toLowerCase();
      const shift = (cls.shift || '').toLowerCase();
      const period = (cls.period || '').toLowerCase();
      return name.includes(q) || course.includes(q) || shift.includes(q) || period.includes(q);
    });
  }, [classes, classDropdownFilter]);

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* SELETOR DE TURMAS EM LISTA SUSPENSA (DROPDOWN ORGANIZADO)                 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#40E0D0]" />
              Selecione a Turma Cadastrada ({classes.length} cadastradas)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Escolha a turma na lista suspensa para carregar os alunos, notas do AVA e registro de frequência.
            </p>
          </div>

          {/* Dropdown Container */}
          <div className="relative w-full md:w-96" ref={classDropdownRef}>
            <button
              type="button"
              onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-[#002B5B]/30 hover:border-[#40E0D0] dark:border-slate-700 dark:hover:border-[#40E0D0] rounded-xl px-3.5 py-2.5 text-left transition-all shadow-xs group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#40E0D0]/50"
              aria-haspopup="listbox"
              aria-expanded={isClassDropdownOpen}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#002B5B] text-[#40E0D0] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {currentClass ? currentClass.name : (classes.length === 0 ? 'Nenhuma turma cadastrada' : 'Selecione uma turma...')}
                    </span>
                    {currentClass?.shift && (
                      <span className="text-[10px] bg-[#002B5B]/10 dark:bg-[#40E0D0]/15 text-[#002B5B] dark:text-[#40E0D0] px-1.5 py-0.2 rounded font-medium shrink-0">
                        {currentClass.shift}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                    {currentClass?.courseName ? (
                      <span className="truncate">{currentClass.courseName}</span>
                    ) : (
                      <span>{classes.length === 0 ? 'Sem turmas no sistema' : 'Turma cadastrada'}</span>
                    )}
                    {currentClass?.period && (
                      <>
                        <span>•</span>
                        <span>{currentClass.period}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {currentClass ? students.filter(s => s.classId === currentClass.id || s.className === currentClass.name).length : 0} alunos
                    </span>
                  </div>
                </div>
              </div>

              <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-[#40E0D0] transition-transform duration-200 shrink-0 ${isClassDropdownOpen ? 'rotate-180 text-[#40E0D0]' : ''}`} />
            </button>

            {/* Menu Suspenso (Lista de Turmas Cadastradas) */}
            {isClassDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Search Bar inside dropdown */}
                {classes.length > 5 && (
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={classDropdownFilter}
                        onChange={(e) => setClassDropdownFilter(e.target.value)}
                        placeholder="Buscar turma por nome, curso ou turno..."
                        className="w-full bg-white dark:bg-slate-800 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-[#40E0D0] text-slate-800 dark:text-slate-200 placeholder-slate-400"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {/* Dropdown Options List */}
                <div className="max-h-80 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-100/50 dark:divide-slate-800/50 scrollbar-thin">
                  {filteredDropdownClasses.length === 0 ? (
                    <div className="py-6 px-4 text-center">
                      <p className="text-xs text-slate-500 italic">
                        Nenhuma turma cadastrada encontrada.
                      </p>
                    </div>
                  ) : (
                    filteredDropdownClasses.map(cls => {
                      const isSelected = currentClass?.id === cls.id;
                      const stuCount = students.filter(s => s.classId === cls.id || s.className === cls.name).length;
                      const ucsCount = curricularUnits.filter(u => u.classId === cls.id || u.additionalClassIds?.includes(cls.id) || u.className === cls.name).length;

                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                            handleSelectClass(cls.id);
                            setIsClassDropdownOpen(false);
                            setClassDropdownFilter('');
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                            isSelected
                              ? 'bg-[#002B5B] text-white shadow-md'
                              : 'hover:bg-cyan-50/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#40E0D0] text-[#002B5B]'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-[#002B5B] group-hover:text-[#40E0D0]'
                            }`}>
                              <GraduationCap className="w-4 h-4" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                  {cls.name}
                                </span>
                                {cls.shift && (
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0 ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                                  }`}>
                                    {cls.shift}
                                  </span>
                                )}
                              </div>

                              <div className={`text-[10px] mt-0.5 truncate flex items-center gap-1.5 ${
                                isSelected ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {cls.courseName && (
                                  <span className="truncate max-w-[140px] sm:max-w-[180px]">{cls.courseName}</span>
                                )}
                                {cls.period && (
                                  <>
                                    <span>•</span>
                                    <span>{cls.period}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span className={`font-semibold ${isSelected ? 'text-[#40E0D0]' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {stuCount} {stuCount === 1 ? 'aluno' : 'alunos'}
                                </span>
                                {ucsCount > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{ucsCount} {ucsCount === 1 ? 'disciplina' : 'disciplinas'}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center">
                            {isSelected ? (
                              <span className="w-6 h-6 rounded-full bg-[#40E0D0] text-[#002B5B] flex items-center justify-center shadow-xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </span>
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#40E0D0] group-hover:translate-x-0.5 transition-all" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer with summary */}
                <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 px-3">
                  <span>Total: <strong>{classes.length} turmas cadastradas</strong></span>
                  {currentClass && (
                    <span className="text-[#002B5B] dark:text-[#40E0D0] font-semibold">
                      Ativa: {currentClass.name}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HEADER PRINCIPAL DO PAINEL INDIVIDUAL DA TURMA                            */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-[#002B5B] via-[#001D3D] to-[#0B132B] text-white rounded-2xl p-5 sm:p-6 border border-[#ffffff1a] shadow-2xl relative overflow-hidden">
        
        {/* Subtle Decorative Backdrop Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#40E0D0]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none">
          <GraduationCap className="w-64 h-64 text-[#40E0D0]" />
        </div>

        <div className="relative z-10 space-y-4">
          
          {/* Top Row: Badges & Turmas Quick Switcher */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-[#40E0D0]/20 text-[#40E0D0] border border-[#40E0D0]/40 text-xs px-3 py-1 rounded-full font-extrabold tracking-wide uppercase flex items-center gap-1.5 shadow-sm">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Painel Individual da Turma
                </span>
                
                {currentClass?.shift && (
                  <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Turno: {currentClass.shift}
                  </span>
                )}

                {currentClass?.period && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Período: {currentClass.period}
                  </span>
                )}

                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {classStudents.length} Alunos Matriculados
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <span>{currentClass ? currentClass.name : (classes.length === 0 ? 'Nenhuma Turma Cadastrada' : 'Turma Selecionada')}</span>
                {currentClass?.courseName && (
                  <span className="text-slate-300 text-sm sm:text-base font-normal">
                    — {currentClass.courseName}
                  </span>
                )}
              </h1>

              <div className="text-xs text-slate-300 mt-1.5 flex flex-wrap items-center gap-2">
                <span>
                  <strong>Unidade Escolar:</strong> {institution.name}
                </span>
                <span>•</span>
                <span>
                  <strong>Docente:</strong> {selectedUC?.teacherName || currentUser.name}
                </span>
                {selectedUC && (
                  <>
                    <span>•</span>
                    <span className="text-[#40E0D0] font-bold">
                      UC Ativa: {selectedUC.code} - {selectedUC.name} ({selectedUC.workloadHours}h)
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* UC / Disciplina Selector if more than 1 in this class */}
            {classDisciplines.length > 1 && (
              <div className="bg-[#00142A]/80 p-2.5 rounded-xl border border-[#ffffff15] shadow-inner shrink-0 sm:w-64">
                <label className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-[#40E0D0]" />
                  UC / Disciplina da Turma:
                </label>
                <div className="relative">
                  <select
                    value={selectedUCId}
                    onChange={(e) => setSelectedUCId(e.target.value)}
                    className="w-full bg-[#002B5B] text-white text-xs font-bold rounded-lg px-2.5 py-2 border border-[#40E0D0]/40 outline-none focus:ring-2 focus:ring-[#40E0D0] hover:border-[#40E0D0] transition-colors cursor-pointer appearance-none pr-7 truncate"
                  >
                    {classDisciplines.map(uc => (
                      <option key={uc.id} value={uc.id} className="bg-[#002B5B] text-white">
                        {uc.code} - {uc.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

          </div>

          {/* Bottom Row: Quick Stats Cards of the Class */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#ffffff15]">
            <div className="bg-[#001D3D]/90 border border-[#ffffff15] rounded-xl p-3 shadow-inner">
              <span className="text-[11px] text-slate-300 font-medium block">Total de Alunos</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-white">{classStats.total}</span>
                <span className="text-[11px] text-[#40E0D0] font-bold">matriculados</span>
              </div>
            </div>

            <div className="bg-[#001D3D]/90 border border-[#ffffff15] rounded-xl p-3 shadow-inner">
              <span className="text-[11px] text-slate-300 font-medium block">Média Geral AVA</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-[#FFD700]">{classStats.avgGrade}</span>
                <span className="text-[11px] text-slate-400">/ 10.0</span>
              </div>
            </div>

            <div className="bg-[#001D3D]/90 border border-[#ffffff15] rounded-xl p-3 shadow-inner">
              <span className="text-[11px] text-slate-300 font-medium block">Aprovados no AVA</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-emerald-400">{classStats.approved}</span>
                <span className="text-[11px] text-slate-400">alunos</span>
              </div>
            </div>

            <div className="bg-[#001D3D]/90 border border-[#ffffff15] rounded-xl p-3 shadow-inner">
              <span className="text-[11px] text-slate-300 font-medium block">Em Recuperação</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-amber-400">{classStats.inRisk}</span>
                <span className="text-[11px] text-slate-400">alunos</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {classes.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 text-center">
          <GraduationCap className="w-9 h-9 text-amber-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
            Nenhuma turma cadastrada no sistema
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 max-w-md mx-auto">
            Todas as turmas, alunos e cursos foram excluídos com sucesso. Para começar uma nova turma, cadastre o curso e a turma através da opção <strong>Cursos & Turmas</strong> na barra lateral.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARRA DE NAVEGAÇÃO DE ABAS DA TURMA (TABS)                                */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-md">
        <div className="flex items-center gap-2 overflow-x-auto">
          
          {/* Aba 1: Planilha AVA */}
          <button
            type="button"
            onClick={() => setActiveSubTab('ava-planilha')}
            className={`flex-1 min-w-[180px] px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              activeSubTab === 'ava-planilha'
                ? 'bg-[#002B5B] text-white shadow-lg shadow-[#002B5B]/20 ring-2 ring-[#40E0D0]/50'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Table className={`w-4 h-4 ${activeSubTab === 'ava-planilha' ? 'text-[#40E0D0]' : 'text-slate-400'}`} />
            <span>Planilha AVA (Notas)</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
              activeSubTab === 'ava-planilha' ? 'bg-[#40E0D0]/20 text-[#40E0D0]' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              Síntese 1 & 2
            </span>
          </button>

          {/* Aba 2: Alunos da Turma */}
          <button
            type="button"
            onClick={() => setActiveSubTab('alunos')}
            className={`flex-1 min-w-[180px] px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              activeSubTab === 'alunos'
                ? 'bg-[#002B5B] text-white shadow-lg shadow-[#002B5B]/20 ring-2 ring-[#40E0D0]/50'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className={`w-4 h-4 ${activeSubTab === 'alunos' ? 'text-[#40E0D0]' : 'text-slate-400'}`} />
            <span>Quadro de Estudantes</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
              activeSubTab === 'alunos' ? 'bg-[#40E0D0]/20 text-[#40E0D0]' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {classStudents.length} Alunos
            </span>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONTEÚDO DA ABA SELECIONADA                                               */}
      {/* ========================================================================= */}
      <div>
        {activeSubTab === 'ava-planilha' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <AVASpreadsheet />
          </div>
        )}

        {activeSubTab === 'alunos' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            
            {/* Search & Header Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#40E0D0]" />
                  Quadro de Estudantes da Turma: {currentClass ? currentClass.name : 'Nenhuma Turma Selecionada'} ({classStudents.length} matriculados)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentClass
                    ? `Visualização detalhada dos alunos matriculados na turma ${currentClass.name} (${currentClass.courseName || ''} • ${currentClass.shift || ''}).`
                    : 'Selecione uma turma no campo "Selecione a Turma Cadastrada" para carregar a listagem de estudantes.'}
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar aluno por nome, RA ou email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#40E0D0]"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">RA</th>
                      <th className="py-3 px-4">Nome do Aluno</th>
                      <th className="py-3 px-4 text-center">Turma</th>
                      <th className="py-3 px-4 text-center">Situação Matrícula</th>
                      <th className="py-3 px-4 text-center">Síntese 1</th>
                      <th className="py-3 px-4 text-center">Síntese 2</th>
                      <th className="py-3 px-4 text-center">Nota Final</th>
                      <th className="py-3 px-4 text-center">Resultado AVA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredClassStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="font-semibold text-slate-600 dark:text-slate-400">
                            {classStudents.length === 0
                              ? `Nenhum estudante matriculado na turma "${currentClass?.name || ''}".`
                              : 'Nenhum estudante encontrado com o filtro atual.'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {classStudents.length === 0
                              ? 'Para vincular alunos a esta turma, acesse o menu Estudantes.'
                              : 'Tente limpar a pesquisa para exibir todos os estudantes da turma.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredClassStudents.map((stu, idx) => {
                        const stuResult = computedResults.find(r => r.studentId === stu.id);
                        const isApproved = (stuResult?.notaFinal ?? 0) >= (institution.minPassingGrade || 6.0);
                        return (
                          <tr
                            key={stu.id}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                              idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/40'
                            }`}
                          >
                            <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                              {stu.academicRegistration}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-800 dark:text-slate-100">{stu.fullName}</p>
                              {stu.email && (
                                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  {stu.email}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex flex-col items-center">
                                <span className="bg-[#002B5B]/10 dark:bg-[#40E0D0]/15 text-[#002B5B] dark:text-[#40E0D0] px-2 py-0.5 rounded-md font-bold text-[10px]">
                                  {currentClass?.name || stu.className || '-'}
                                </span>
                                {currentClass?.shift && (
                                  <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                                    {currentClass.shift}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusBadgeStyle(stu.status)}`}>
                                {stu.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {stuResult ? stuResult.sintese1.toFixed(1) : '-'}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {stuResult ? stuResult.sintese2.toFixed(1) : '-'}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-base text-slate-900 dark:text-white">
                              {stuResult ? stuResult.notaFinal.toFixed(1) : '-'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {stuResult ? (
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${
                                  isApproved
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                }`}>
                                  {isApproved ? 'APROVADO' : 'REPROVADO'}
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
