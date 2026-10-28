import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Table,
  FileSpreadsheet,
  FileText,
  Download,
  Settings2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Info,
  HelpCircle,
  TrendingUp,
  Save,
  Layers,
  Calculator,
  PlusCircle,
  Check
} from 'lucide-react';
import { exportAVAPDF, exportToCSV, exportToExcel } from '../../utils/exportUtils';
import { getStatusBadgeStyle, getStatusAbbreviation, getCalculationTypeLabel, getCalculationTypeShortLabel } from '../../utils/avaCalculations';
import { AVAConfigModal } from './AVAConfigModal';
import { GradeCalculationType } from '../../types';

export const AVASpreadsheet: React.FC = () => {
  const {
    institution,
    selectedUC,
    selectedClass,
    selectedClassId,
    classes,
    students,
    avaActivities,
    studentGrades,
    updateStudentGrade,
    updateRecoveryGrade,
    updateGradeCalculationType,
    computedResults,
    currentUser
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // If no classes exist at all in system
  if (classes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
        <Table className="w-12 h-12 mx-auto text-slate-400 mb-2" />
        <p className="text-base font-bold text-slate-700 dark:text-slate-300">Nenhuma Turma Cadastrada</p>
        <p className="text-xs text-slate-500 mt-1">Cadastre cursos e turmas em "Cursos & Turmas" para acessar a Planilha AVA de Notas.</p>
      </div>
    );
  }

  // If no class is currently selected
  if (!selectedClass) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
        <Table className="w-12 h-12 mx-auto text-[#40E0D0] mb-2" />
        <p className="text-base font-bold text-slate-700 dark:text-slate-300">Nenhuma Turma Selecionada</p>
        <p className="text-xs text-slate-500 mt-1">Selecione uma turma no campo <strong>Selecione a Turma Cadastrada</strong> no topo do painel para carregar a planilha de notas desta turma.</p>
      </div>
    );
  }

  // If no UC is associated with the selected class
  if (!selectedUC) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
        <Table className="w-12 h-12 mx-auto text-amber-500 mb-2" />
        <p className="text-base font-bold text-slate-700 dark:text-slate-300">Nenhuma Unidade Curricular vinculada à turma {selectedClass.name}</p>
        <p className="text-xs text-slate-500 mt-1">Cadastre ou vincule uma disciplina para esta turma em <strong>Gestão de Disciplinas</strong> ou <strong>Cursos & Turmas</strong>.</p>
      </div>
    );
  }

  const currentCalcType: GradeCalculationType =
    selectedUC.gradeCalculationType || institution.defaultGradeCalculationType || 'sum';

  const p1Activities = avaActivities.filter(a => a && a.period === 'p1');
  const p2Activities = avaActivities.filter(a => a && a.period === 'p2');

  // Students strictly belonging to the currently selected class
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => {
      const studentClassIds = s.classIds && s.classIds.length > 0 ? s.classIds : [s.classId];
      return studentClassIds.includes(selectedClass.id) || s.className === selectedClass.name;
    });
  }, [selectedClass, students]);

  // Computed results strictly for students belonging to the selected class
  const classComputedResults = useMemo(() => {
    if (!selectedClass) return [];
    return computedResults.filter(res => {
      return classStudents.some(s => s.id === res.studentId);
    });
  }, [computedResults, classStudents, selectedClass]);

  // Filter computed results by search query and status filter
  const filteredResults = useMemo(() => {
    return classComputedResults.filter(res => {
      const matchesSearch =
        res.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.academicRegistration.includes(searchQuery);
      if (!matchesSearch) return false;

      if (statusFilter === 'aprovados') return res.notaFinal >= (institution.minPassingGrade || 6.0);
      if (statusFilter === 'reprovados') return res.notaFinal < (institution.minPassingGrade || 6.0);
      if (statusFilter !== 'todos') return res.status === statusFilter;
      return true;
    });
  }, [classComputedResults, searchQuery, statusFilter, institution.minPassingGrade]);

  // Calculate Class Averages strictly for the selected class
  const totalStudents = classStudents.length;
  const approvedCount = classComputedResults.filter(r => r.notaFinal >= (institution.minPassingGrade || 6.0)).length;
  const disapprovedCount = Math.max(0, totalStudents - approvedCount);
  const passRate = totalStudents > 0 ? Math.round((approvedCount / totalStudents) * 100) : 0;
  const classGradeAvg = classComputedResults.length > 0
    ? (classComputedResults.reduce((acc, curr) => acc + curr.notaFinal, 0) / classComputedResults.length).toFixed(1)
    : '0.0';

  const isReadOnly = currentUser.role === 'aluno';

  const handleScoreChange = (
    studentId: string,
    period: 'p1' | 'p2',
    actId: string,
    valStr: string,
    maxScore: number
  ) => {
    let num = parseFloat(valStr);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > maxScore) num = maxScore;
    updateStudentGrade(studentId, selectedUC.id, period, actId, num);
  };

  const handleRecoveryChange = (studentId: string, valStr: string) => {
    if (valStr.trim() === '') {
      updateRecoveryGrade(studentId, selectedUC.id, undefined);
      return;
    }
    let num = parseFloat(valStr);
    if (isNaN(num)) return;
    if (num < 0) num = 0;
    if (num > 10) num = 10;
    updateRecoveryGrade(studentId, selectedUC.id, num);
  };

  const handleExportPDF = () => {
    exportAVAPDF(institution, selectedUC, filteredResults);
  };

  const handleExportExcel = () => {
    const headers = [
      'RA',
      'Nome do Aluno',
      'Situação',
      currentCalcType === 'average' ? '1º Período (Média S1)' : '1º Período (Soma S1)',
      currentCalcType === 'average' ? '2º Período (Média S2)' : '2º Período (Soma S2)',
      'Nota Parcial',
      'Recuperação',
      'Nota Final',
      'Aulas Totais',
      'Faltas',
      'Frequência %',
      'Resultado'
    ];
    const rows = filteredResults.map(r => [
      r.academicRegistration,
      r.studentName,
      r.status,
      r.sintese1,
      r.sintese2,
      r.notaParcial,
      r.recuperacao ?? '-',
      r.notaFinal,
      r.totalClasses,
      r.totalAbsences,
      `${r.attendancePercentage}%`,
      r.finalAcademicStatus
    ]);
    exportToExcel(`Planilha_AVA_${selectedUC.code}_${selectedClass.name}`, 'Planilha AVA', headers, rows);
  };

  const handleExportCSV = () => {
    const headers = [
      'RA',
      'Nome do Aluno',
      'Situação',
      currentCalcType === 'average' ? '1º Período (Média S1)' : '1º Período (Soma S1)',
      currentCalcType === 'average' ? '2º Período (Média S2)' : '2º Período (Soma S2)',
      'Nota Parcial',
      'Recuperação',
      'Nota Final',
      'Aulas Totais',
      'Faltas',
      'Frequência %',
      'Resultado'
    ];
    const rows = filteredResults.map(r => [
      r.academicRegistration,
      r.studentName,
      r.status,
      r.sintese1,
      r.sintese2,
      r.notaParcial,
      r.recuperacao ?? '-',
      r.notaFinal,
      r.totalClasses,
      r.totalAbsences,
      `${r.attendancePercentage}%`,
      r.finalAcademicStatus
    ]);
    exportToCSV(`Planilha_AVA_${selectedUC.code}_${selectedClass.name}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & UC Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Table className="w-64 h-64 text-cyan-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="bg-[#40E0D0]/20 text-[#40E0D0] border border-[#40E0D0]/40 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                Turma: {selectedClass.name} {selectedClass.shift ? `(${selectedClass.shift})` : ''}
              </span>
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {selectedUC.code}
              </span>
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {selectedUC.semester}
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-0.5 rounded-full font-medium">
                Total de aulas semestre: {selectedUC.workloadHours}h
              </span>
              {/* Grading Method Badge in Header */}
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                currentCalcType === 'average'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {currentCalcType === 'average' ? <Calculator className="w-3 h-3" /> : <PlusCircle className="w-3 h-3" />}
                Cálculo: {currentCalcType === 'average' ? 'Média Aritmética' : 'Somatória'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold tracking-tight text-white truncate whitespace-nowrap">
              Avaliação e Verificação da Aprendizagem(AVA)
            </h1>
            <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-2">
              <span><strong>UC:</strong> {selectedUC.name}</span>
              <span>•</span>
              <span><strong>Docente:</strong> {selectedUC.teacherName}</span>
              <span>•</span>
              <span><strong>Turma:</strong> {selectedClass.name} {selectedClass.shift ? `(${selectedClass.shift})` : ''} ({classStudents.length} alunos)</span>
            </p>
          </div>

          {/* Action Toolbar with Grade Method Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!isReadOnly && (
              <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
                <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                  Formato:
                </span>
                <button
                  type="button"
                  onClick={() => updateGradeCalculationType(selectedUC.id, 'sum')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all flex items-center gap-1 ${
                    currentCalcType === 'sum'
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="Somatória: soma das notas das atividades de cada período"
                >
                  <PlusCircle className="w-3 h-3" />
                  Somatória
                </button>
                <button
                  type="button"
                  onClick={() => updateGradeCalculationType(selectedUC.id, 'average')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all flex items-center gap-1 ${
                    currentCalcType === 'average'
                      ? 'bg-cyan-500 text-slate-950 shadow-md ring-1 ring-cyan-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="Média: média aritmética dos valores das atividades em cada período"
                >
                  <Calculator className="w-3 h-3" />
                  Média
                </button>
              </div>
            )}

            {!isReadOnly && (
              <button
                onClick={() => setShowConfigModal(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/80 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
              >
                <Settings2 className="w-4 h-4 text-cyan-400" />
                Configurar AVA
              </button>
            )}

            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={handleExportPDF}
                className="p-1.5 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                title="Exportar Relatório PDF"
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" /> PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="p-1.5 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                title="Exportar Excel XLSX"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Excel
              </button>
              <button
                onClick={handleExportCSV}
                className="p-1.5 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                title="Exportar CSV"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" /> CSV
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Formula Explanation Banner */}
        <div className="mt-3 py-2 px-3 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-cyan-500/20 text-cyan-400 rounded">
              {currentCalcType === 'average' ? <Calculator className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
            </span>
            <span>
              <strong>Fórmula Ativa ({getCalculationTypeShortLabel(currentCalcType)}):</strong>{' '}
              {currentCalcType === 'average' ? (
                <span>
                  Síntese 1 = Média(P1) • Síntese 2 = Média(P2) • Parcial = (S1 + S2) / 2 • Final = Max(Parcial, Recuperação)
                </span>
              ) : (
                <span>
                  Síntese 1 = Soma(P1) • Síntese 2 = Soma(P2) • Parcial = S1 + S2 • Final = Max(Parcial, Recuperação)
                </span>
              )}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Média para Aprovação: <strong className="text-white">{institution.minPassingGrade.toFixed(1)}</strong>
          </span>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px]">Total Matriculados</span>
            <p className="text-lg font-bold text-white mt-0.5">{totalStudents} alunos</p>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px]">Taxa de Aprovação</span>
            <p className="text-lg font-bold text-cyan-400 mt-0.5">{passRate}%</p>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px]">Média Geral da Turma</span>
            <p className="text-lg font-bold text-amber-400 mt-0.5">{classGradeAvg} / 10</p>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px]">Em Exame / Recuperação</span>
            <p className="text-lg font-bold text-rose-400 mt-0.5">{disapprovedCount} alunos</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Table className="w-4 h-4 text-cyan-500" />
            Planilha de Avaliação e Verificação da Aprendizagem
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar aluno ou RA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="todos">Todos os Alunos ({classStudents.length})</option>
              <option value="aprovados">Apenas Aprovados</option>
              <option value="reprovados">Apenas Reprovados</option>
              <option value="Ativo">Situação: Ativo (Verde)</option>
              <option value="Trancado">Situação: Trancado (Laranja)</option>
              <option value="Remanejado">Situação: Remanejado (Roxo)</option>
              <option value="Transferido">Situação: Transferido (Vermelho)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Spreadsheet Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              {/* Group Header Row */}
              <tr className="bg-slate-900 text-slate-200 text-xs border-b border-slate-800 font-bold uppercase tracking-wider">
                <th
                  colSpan={3}
                  className="sticky left-0 z-30 py-3 px-3 border-r-2 border-slate-700 bg-slate-950 text-cyan-400 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Identificação do Estudante</span>
                    <span className="text-[10px] font-normal text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                      Painel Fixo
                    </span>
                  </div>
                </th>

                <th colSpan={p1Activities.length + 1} className="py-3 px-3 text-center border-r border-slate-800 bg-slate-900/90 text-amber-300">
                  AVA - 1º Período ({currentCalcType === 'average' ? 'Média' : 'Soma'})
                </th>
                <th colSpan={p2Activities.length + 1} className="py-3 px-3 text-center border-r border-slate-800 bg-slate-900/90 text-cyan-300">
                  AVA - 2º Período ({currentCalcType === 'average' ? 'Média' : 'Soma'})
                </th>
                <th colSpan={3} className="py-3 px-3 text-center border-r border-slate-800 bg-slate-950 text-purple-300">
                  Síntese & Recuperação
                </th>
                <th colSpan={2} className="py-3 px-3 text-center border-r border-slate-800 bg-slate-900 text-cyan-300">
                  Frequência & Assiduidade
                </th>
                <th className="py-3 px-3 text-center bg-slate-950 text-white">
                  Resultado
                </th>
              </tr>

              {/* Sub-Column Header Row */}
              <tr className="bg-slate-100 dark:bg-slate-800/90 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="sticky left-0 z-30 bg-slate-100 dark:bg-slate-800 py-2.5 px-3 w-[110px] min-w-[110px] max-w-[110px] border-r border-slate-200 dark:border-slate-700">
                  R.A.
                </th>
                <th className="sticky left-[110px] z-30 bg-slate-100 dark:bg-slate-800 py-2.5 px-3 w-[220px] min-w-[220px] max-w-[220px] border-r border-slate-200 dark:border-slate-700">
                  Nome do Aluno
                </th>
                <th className="sticky left-[330px] z-30 bg-slate-100 dark:bg-slate-800 py-2.5 px-2 text-center w-[70px] min-w-[70px] max-w-[70px] border-r-2 border-slate-300 dark:border-slate-600 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)]">
                  Sit.
                </th>

                {/* 1º Período Subheaders */}
                {p1Activities.map(act => (
                  <th key={act.id} className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-700 bg-amber-500/10 text-amber-900 dark:text-amber-300 min-w-[75px]" title={act.name}>
                    <div className="truncate max-w-[80px]">{act.name}</div>
                    <div className="text-[9px] font-normal text-amber-700 dark:text-amber-400">(Máx {act.maxScore})</div>
                  </th>
                ))}
                <th className="py-2.5 px-2 text-center font-extrabold bg-amber-500/20 text-amber-950 dark:text-amber-200 border-r border-slate-200 dark:border-slate-700 min-w-[75px]">
                  <div>Síntese 1</div>
                  <div className="text-[9px] font-normal opacity-80">
                    {currentCalcType === 'average' ? '(Média)' : '(Soma)'}
                  </div>
                </th>

                {/* 2º Período Subheaders */}
                {p2Activities.map(act => (
                  <th key={act.id} className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-700 bg-cyan-500/10 text-cyan-900 dark:text-cyan-300 min-w-[75px]" title={act.name}>
                    <div className="truncate max-w-[80px]">{act.name}</div>
                    <div className="text-[9px] font-normal text-cyan-700 dark:text-cyan-400">(Máx {act.maxScore})</div>
                  </th>
                ))}
                <th className="py-2.5 px-2 text-center font-extrabold bg-cyan-500/20 text-cyan-950 dark:text-cyan-200 border-r border-slate-200 dark:border-slate-700 min-w-[75px]">
                  <div>Síntese 2</div>
                  <div className="text-[9px] font-normal opacity-80">
                    {currentCalcType === 'average' ? '(Média)' : '(Soma)'}
                  </div>
                </th>

                {/* Synthesis & Recovery */}
                <th className="py-2.5 px-2 text-center font-bold bg-purple-500/10 text-purple-900 dark:text-purple-300 border-r border-slate-200 dark:border-slate-700 min-w-[75px]">
                  <div>Parcial</div>
                  <div className="text-[9px] font-normal opacity-80">
                    {currentCalcType === 'average' ? '(Média S1..2)' : '(S1+S2)'}
                  </div>
                </th>
                <th className="py-2.5 px-2 text-center font-bold bg-purple-500/20 text-purple-950 dark:text-purple-200 border-r border-slate-200 dark:border-slate-700 min-w-[80px]">
                  Recuperação
                </th>
                <th className="py-2.5 px-2 text-center font-extrabold bg-purple-600 text-white border-r border-slate-200 dark:border-slate-700 min-w-[75px]">
                  Nota Final
                </th>

                {/* Attendance Subheaders */}
                <th className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-700 min-w-[80px]">
                  Aulas / Faltas
                </th>
                <th className="py-2.5 px-2 text-center font-bold border-r border-slate-200 dark:border-slate-700 min-w-[80px]">
                  % Frequência
                </th>

                {/* Final Status */}
                <th className="py-2.5 px-3 text-center min-w-[120px]">Status Final</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={p1Activities.length + p2Activities.length + 9} className="p-8 text-center text-slate-500">
                    Nenhum aluno encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredResults.map((res, idx) => {
                  const studentGradeRecord = studentGrades.find(
                    g => g.studentId === res.studentId && g.ucId === selectedUC.id
                  );

                  const isEven = idx % 2 === 0;
                  const rowBg = isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-850';
                  const stickyCellBg = isEven
                    ? 'bg-white dark:bg-slate-900 group-hover:bg-cyan-50/80 dark:group-hover:bg-slate-800'
                    : 'bg-slate-50 dark:bg-slate-850 group-hover:bg-cyan-50/80 dark:group-hover:bg-slate-800';

                  return (
                    <tr
                      key={res.studentId}
                      className={`group hover:bg-cyan-50/50 dark:hover:bg-slate-800/60 transition-colors ${rowBg}`}
                    >
                      {/* RA (Sticky Column 1) */}
                      <td className={`sticky left-0 z-20 py-2 px-3 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 w-[110px] min-w-[110px] max-w-[110px] transition-colors ${stickyCellBg}`}>
                        {res.academicRegistration}
                      </td>

                      {/* Student Name (Sticky Column 2) */}
                      <td className={`sticky left-[110px] z-20 py-2 px-3 font-bold text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 w-[220px] min-w-[220px] max-w-[220px] transition-colors ${stickyCellBg}`}>
                        <div className="truncate" title={res.studentName}>
                          {res.studentName}
                        </div>
                      </td>

                      {/* Situation Tag (Sticky Column 3) */}
                      <td className={`sticky left-[330px] z-20 py-2 px-1 text-center border-r-2 border-slate-300 dark:border-slate-700 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)] w-[70px] min-w-[70px] max-w-[70px] transition-colors ${stickyCellBg}`}>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded border inline-block ${getStatusBadgeStyle(res.status)}`}
                          title={`Situação Acadêmica: ${res.status}`}
                        >
                          {getStatusAbbreviation(res.status)}
                        </span>
                      </td>

                      {/* AVA P1 Inputs */}
                      {p1Activities.map(act => {
                        const val = studentGradeRecord?.p1Grades?.[act.id] ?? '';
                        return (
                          <td key={act.id} className="p-1 text-center border-r border-slate-200 dark:border-slate-800">
                            {isReadOnly ? (
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {val !== '' ? val : '-'}
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max={act.maxScore}
                                value={val}
                                onChange={(e) => handleScoreChange(res.studentId, 'p1', act.id, e.target.value, act.maxScore)}
                                className="w-14 text-center py-1 bg-amber-50/50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold text-amber-900 dark:text-amber-200 focus:ring-2 focus:ring-amber-500 outline-none"
                              />
                            )}
                          </td>
                        );
                      })}

                      {/* Síntese 1 (Sum or Average) */}
                      <td className="py-2 px-2 text-center font-extrabold text-amber-900 dark:text-amber-300 bg-amber-500/10 border-r border-slate-200 dark:border-slate-800">
                        {res.sintese1.toFixed(1)}
                      </td>

                      {/* AVA P2 Inputs */}
                      {p2Activities.map(act => {
                        const val = studentGradeRecord?.p2Grades?.[act.id] ?? '';
                        return (
                          <td key={act.id} className="p-1 text-center border-r border-slate-200 dark:border-slate-800">
                            {isReadOnly ? (
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {val !== '' ? val : '-'}
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max={act.maxScore}
                                value={val}
                                onChange={(e) => handleScoreChange(res.studentId, 'p2', act.id, e.target.value, act.maxScore)}
                                className="w-14 text-center py-1 bg-cyan-50/50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold text-cyan-900 dark:text-cyan-200 focus:ring-2 focus:ring-cyan-500 outline-none"
                              />
                            )}
                          </td>
                        );
                      })}

                      {/* Síntese 2 (Sum or Average) */}
                      <td className="py-2 px-2 text-center font-extrabold text-cyan-900 dark:text-cyan-300 bg-cyan-500/10 border-r border-slate-200 dark:border-slate-800">
                        {res.sintese2.toFixed(1)}
                      </td>

                      {/* Nota Parcial */}
                      <td className="py-2 px-2 text-center font-bold text-slate-800 dark:text-slate-200 bg-purple-500/10 border-r border-slate-200 dark:border-slate-800">
                        {res.notaParcial.toFixed(1)}
                      </td>

                      {/* Recuperação Input */}
                      <td className="p-1 text-center border-r border-slate-200 dark:border-slate-800 bg-purple-500/15">
                        {isReadOnly ? (
                          <span className="font-semibold text-purple-900 dark:text-purple-300">
                            {res.recuperacao !== undefined ? res.recuperacao : '-'}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            placeholder="-"
                            value={res.recuperacao ?? ''}
                            onChange={(e) => handleRecoveryChange(res.studentId, e.target.value)}
                            className="w-14 text-center py-1 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded text-xs font-bold text-purple-900 dark:text-purple-200 focus:ring-2 focus:ring-purple-500 outline-none"
                          />
                        )}
                      </td>

                      {/* Nota Final */}
                      <td className={`py-2 px-2 text-center font-extrabold text-sm border-r border-slate-200 dark:border-slate-800 ${
                        res.notaFinal >= (institution.minPassingGrade || 6.0)
                          ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50/30'
                          : 'text-rose-600 dark:text-rose-400 bg-rose-50/30'
                      }`}>
                        {res.notaFinal.toFixed(1)}
                      </td>

                      {/* Aulas / Faltas */}
                      <td className="py-2 px-2 text-center font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                        {res.totalAbsences}f / {res.totalClasses}h
                      </td>

                      {/* % Frequência */}
                      <td className="py-2 px-2 text-center font-extrabold border-r border-slate-200 dark:border-slate-800">
                        <span className={res.attendancePercentage >= (institution.minAttendancePercentage || 75) ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {res.attendancePercentage}%
                        </span>
                      </td>

                      {/* Final Automatic Result Badge */}
                      <td className="py-2 px-3 text-center">
                        {res.finalAcademicStatus === 'APROVADO' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            APROVADO
                          </span>
                        ) : res.finalAcademicStatus === 'REPROVADO POR FALTA' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800">
                            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            REP. FREQ.
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800">
                            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            REPROVADO
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="font-bold text-slate-700 dark:text-slate-300">Situação Acadêmica:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 font-bold">A = Ativo (Verde)</span>
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 font-bold">TR = Trancado (Laranja)</span>
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950 dark:text-purple-300 font-bold">RE = Remanejado (Roxo)</span>
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 font-bold">TF = Transferido (Vermelho)</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5 text-cyan-500" />
              <span>
                Método de Cálculo: <strong className="text-slate-700 dark:text-slate-200">{currentCalcType === 'average' ? 'Média Aritmética' : 'Somatória das Atividades'}</strong>
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-cyan-500" />
              <span>Nota Final = Max(Parcial, Recuperação) | Mínimo: {institution.minPassingGrade.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Config Modal */}
      {showConfigModal && (
        <AVAConfigModal onClose={() => setShowConfigModal(false)} />
      )}
    </div>
  );
};
