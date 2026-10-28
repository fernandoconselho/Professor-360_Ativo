import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Printer,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  CalendarCheck2,
  Calendar,
  Clock,
  Users,
  GraduationCap,
  ChevronDown,
  BookOpenCheck,
  BarChart3,
  Percent,
  Check,
  BookOpen,
  Filter,
  Sparkles,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import {
  exportBoletimPDF,
  exportDiarioClassePDF,
  exportListaPresencaPDF,
  exportRelatorioFaltasPDF,
  exportToCSV,
  exportToExcel
} from '../../utils/exportUtils';
import { computeStudentResult, getStatusBadgeStyle, getStatusAbbreviation } from '../../utils/avaCalculations';
import { ClassTurma, CurricularUnit } from '../../types';

export const ReportsModule: React.FC = () => {
  const {
    institution,
    classes,
    selectedClassId,
    selectedClass,
    setSelectedClassId,
    curricularUnits,
    selectedUCId,
    selectedUC,
    setSelectedUCId,
    students,
    attendanceRecords,
    avaActivities,
    studentGrades
  } = useApp();

  // Local selection of Turma and UC for the reports (initialized with global state or first available)
  const [reportClassId, setReportClassId] = useState<string>(() => {
    return selectedClassId || (classes[0]?.id ?? '');
  });

  const [reportUcId, setReportUcId] = useState<string>(() => {
    return selectedUCId || (curricularUnits[0]?.id ?? '');
  });

  // Current active class for report
  const activeClass: ClassTurma | undefined = useMemo(() => {
    if (reportClassId) {
      const found = classes.find(c => c.id === reportClassId);
      if (found) return found;
    }
    return selectedClass || classes[0];
  }, [classes, reportClassId, selectedClass]);

  // Curricular units associated with this class
  const classDisciplines = useMemo(() => {
    if (!activeClass) return curricularUnits;
    const filtered = curricularUnits.filter(
      u => u.classId === activeClass.id ||
           u.additionalClassIds?.includes(activeClass.id) ||
           (u.className && activeClass.name && u.className === activeClass.name)
    );
    return filtered.length > 0 ? filtered : curricularUnits;
  }, [activeClass, curricularUnits]);

  // Current active UC for report
  const activeUC: CurricularUnit | undefined = useMemo(() => {
    if (reportUcId) {
      const found = curricularUnits.find(u => u.id === reportUcId);
      if (found) return found;
    }
    return classDisciplines[0] || selectedUC || curricularUnits[0];
  }, [curricularUnits, reportUcId, classDisciplines, selectedUC]);

  // Synchronize when class selection changes
  useEffect(() => {
    if (activeClass && classDisciplines.length > 0) {
      const isCurrentInClass = classDisciplines.some(u => u.id === reportUcId);
      if (!isCurrentInClass) {
        setReportUcId(classDisciplines[0].id);
      }
    }
  }, [activeClass, classDisciplines, reportUcId]);

  // Report Section Tabs:
  // 1. 'diario': Diário de Classe (Aulas ministradas, conteúdos e chamada diária)
  // 2. 'presenca': Lista de Presença (Ficha de frequência / Folha de chamada)
  // 3. 'faltas': Relatório de Faltas (Controle de assiduidade e risco de infrequência)
  // 4. 'desempenho': Relatório de Desempenho e Boletim dos Alunos
  const [activeReportTab, setActiveReportTab] = useState<'diario' | 'presenca' | 'faltas' | 'desempenho'>('desempenho');

  // Layout Selector for Boletim:
  // - 'oficial': Padrão Oficial Institucional (P1, P2, Parcial, Exame, Final, Freq %, Assinaturas)
  // - 'sintetico': Sintético / Mural (RA, Nome, Média Final, Freq %, Situação Final)
  // - 'analitico': Analítico Pedagógico (Detalhamento P1, P2, Carga Horária, Faltas em horas, Parecer)
  const [boletimLayout, setBoletimLayout] = useState<'oficial' | 'sintetico' | 'analitico'>('oficial');

  // Presence sheet mode: 'computada' (apuração real) or 'manual' (folha em branco para assinatura física)
  const [presenceSheetMode, setPresenceSheetMode] = useState<'computada' | 'manual'>('computada');

  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Dropdown UI states
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const classDropdownRef = useRef<HTMLDivElement>(null);

  const [isUCDropdownOpen, setIsUCDropdownOpen] = useState(false);
  const ucDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target as Node)) {
        setIsClassDropdownOpen(false);
      }
      if (ucDropdownRef.current && !ucDropdownRef.current.contains(event.target as Node)) {
        setIsUCDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered dropdown classes
  const filteredDropdownClasses = useMemo(() => {
    if (!classFilter.trim()) return classes;
    const q = classFilter.toLowerCase().trim();
    return classes.filter(cls => {
      const name = (cls.name || '').toLowerCase();
      const course = (cls.courseName || '').toLowerCase();
      const shift = (cls.shift || '').toLowerCase();
      return name.includes(q) || course.includes(q) || shift.includes(q);
    });
  }, [classes, classFilter]);

  // Students belonging exclusively to the selected class, sorted A-Z
  const reportStudents = useMemo(() => {
    if (!activeClass) return students;
    return students.filter(s => {
      const sClassIds = Array.isArray(s.classIds) && s.classIds.length > 0 ? s.classIds : (s.classId ? [s.classId] : []);
      return sClassIds.includes(activeClass.id) || (s.className && s.className === activeClass.name);
    }).sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'pt-BR', { sensitivity: 'base' }));
  }, [activeClass, students]);

  // Attendance records strictly for this class and UC
  const reportAttendanceRecords = useMemo(() => {
    if (!activeClass) return attendanceRecords;
    return attendanceRecords.filter(a => {
      const matchesClass = a.classId === activeClass.id;
      const matchesUC = !activeUC || a.ucId === activeUC.id || a.ucId === 'geral';
      return matchesClass && matchesUC;
    });
  }, [activeClass, activeUC, attendanceRecords]);

  // Computed results for this class and UC
  const reportComputedResults = useMemo(() => {
    if (!activeUC) return [];
    const calcType = activeUC.gradeCalculationType || institution.defaultGradeCalculationType || 'sum';

    return reportStudents.map(student => {
      return computeStudentResult(
        student,
        activeUC.id,
        avaActivities,
        studentGrades,
        reportAttendanceRecords,
        institution.minPassingGrade || 6.0,
        institution.minAttendancePercentage || 75,
        calcType
      );
    });
  }, [reportStudents, activeUC, avaActivities, studentGrades, reportAttendanceRecords, institution]);

  // Search filtered results for tables
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return reportStudents;
    const q = searchTerm.toLowerCase();
    return reportStudents.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.academicRegistration.toLowerCase().includes(q)
    );
  }, [reportStudents, searchTerm]);

  const filteredComputedResults = useMemo(() => {
    if (!searchTerm.trim()) return reportComputedResults;
    const q = searchTerm.toLowerCase();
    return reportComputedResults.filter(r =>
      r.studentName.toLowerCase().includes(q) ||
      r.academicRegistration.toLowerCase().includes(q)
    );
  }, [reportComputedResults, searchTerm]);

  const filteredDiarioRecords = useMemo(() => {
    if (!searchTerm.trim()) return reportAttendanceRecords;
    const q = searchTerm.toLowerCase();
    return reportAttendanceRecords.filter(r =>
      r.contentTaught.toLowerCase().includes(q) ||
      r.date.includes(q)
    );
  }, [reportAttendanceRecords, searchTerm]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalLessons = reportAttendanceRecords.reduce((acc, curr) => acc + (curr.lessonCount || 1), 0);
    const totalStudents = reportStudents.length;
    const minReq = institution.minAttendancePercentage || 75;
    const minGrade = institution.minPassingGrade || 6.0;

    let totalAttendancePctSum = 0;
    let studentsRegular = 0;
    let studentsAtRisk = 0;
    let studentsFailedByAbsence = 0;

    let totalGradeSum = 0;
    let studentsApproved = 0;
    let studentsInRecovery = 0;
    let studentsFailedByGrade = 0;
    let highestGrade = 0;
    let lowestGrade = 10;

    reportComputedResults.forEach(r => {
      const pct = r.attendancePercentage ?? 100;
      totalAttendancePctSum += pct;

      if (pct >= minReq) studentsRegular++;
      else if (pct >= minReq - 5) studentsAtRisk++;
      else studentsFailedByAbsence++;

      const finalGrade = r.notaFinal || 0;
      totalGradeSum += finalGrade;
      if (finalGrade > highestGrade) highestGrade = finalGrade;
      if (finalGrade < lowestGrade) lowestGrade = finalGrade;

      if (finalGrade >= minGrade) {
        studentsApproved++;
      } else if (r.recuperacao !== undefined) {
        studentsInRecovery++;
      } else {
        studentsFailedByGrade++;
      }
    });

    const avgAttendance = totalStudents > 0 ? (totalAttendancePctSum / totalStudents).toFixed(1) : '100.0';
    const avgGrade = totalStudents > 0 ? (totalGradeSum / totalStudents).toFixed(1) : '0.0';
    const approvalRate = totalStudents > 0 ? Math.round((studentsApproved / totalStudents) * 100) : 100;

    return {
      totalLessons,
      totalStudents,
      avgAttendance,
      avgGrade,
      approvalRate,
      studentsRegular,
      studentsAtRisk,
      studentsFailedByAbsence,
      studentsApproved,
      studentsInRecovery,
      studentsFailedByGrade,
      highestGrade: totalStudents > 0 ? highestGrade.toFixed(1) : '0.0',
      lowestGrade: totalStudents > 0 ? lowestGrade.toFixed(1) : '0.0'
    };
  }, [reportAttendanceRecords, reportStudents, reportComputedResults, institution]);

  // Export handlers
  const handleExportPDF = () => {
    if (!activeUC) {
      alert('Selecione uma disciplina para exportar.');
      return;
    }

    if (activeReportTab === 'desempenho') {
      exportBoletimPDF(institution, activeClass, activeUC, reportComputedResults, boletimLayout);
      showFeedback(`✅ Boletim gerado com sucesso no layout ${boletimLayout.toUpperCase()}!`);
    } else if (activeReportTab === 'diario') {
      exportDiarioClassePDF(institution, activeClass, activeUC, reportAttendanceRecords, reportStudents);
      showFeedback('✅ Diário de Classe gerado em PDF com sucesso!');
    } else if (activeReportTab === 'presenca') {
      exportListaPresencaPDF(institution, activeClass, activeUC, reportStudents, reportAttendanceRecords, presenceSheetMode === 'manual');
      showFeedback('✅ Lista de Presença gerada em PDF com sucesso!');
    } else if (activeReportTab === 'faltas') {
      exportRelatorioFaltasPDF(institution, activeClass, activeUC, reportStudents, reportAttendanceRecords, institution.minAttendancePercentage || 75);
      showFeedback('✅ Relatório de Faltas e Infrequência gerado em PDF com sucesso!');
    }
  };

  const handleExportExcel = () => {
    if (!activeUC) return;
    const prefix = `Relatorio_${activeReportTab}_${activeClass?.name || 'Turma'}_${activeUC.code}`.replace(/\s+/g, '_');

    if (activeReportTab === 'desempenho') {
      const headers = ['R.A.', 'Nome Completo', 'Situação', 'Síntese 1', 'Síntese 2', 'Média Parcial', 'Recuperação', 'Nota Final', 'Frequência (%)', 'Resultado Final'];
      const rows = reportComputedResults.map(r => [
        r.academicRegistration,
        r.studentName,
        r.status,
        r.sintese1,
        r.sintese2,
        r.notaParcial,
        r.recuperacao ?? '-',
        r.notaFinal,
        `${r.attendancePercentage}%`,
        r.finalAcademicStatus
      ]);
      exportToExcel(prefix, 'Boletim Desempenho', headers, rows);
    } else if (activeReportTab === 'diario') {
      const headers = ['Aula Nº', 'Data', 'Horas / Aulas', 'Conteúdo Programático', 'Presentes', 'Ausentes', '% Presença'];
      const rows = reportAttendanceRecords.map((r, idx) => {
        const pres = Object.values(r.presences || {}).filter(Boolean).length;
        const total = Object.keys(r.presences || {}).length || reportStudents.length;
        return [
          idx + 1,
          r.date,
          r.lessonCount || 1,
          r.contentTaught,
          pres,
          total - pres,
          `${total > 0 ? Math.round((pres / total) * 100) : 100}%`
        ];
      });
      exportToExcel(prefix, 'Diário de Classe', headers, rows);
    } else if (activeReportTab === 'presenca') {
      const headers = ['Nº', 'R.A.', 'Nome Completo', 'Situação', 'Aulas Totais', 'Presenças (h)', 'Faltas (h)', '% Frequência', 'Situação'];
      const rows = reportStudents.map((s, idx) => {
        let pres = 0;
        let abs = 0;
        reportAttendanceRecords.forEach(rec => {
          const isPres = rec.presences?.[s.id] ?? true;
          const h = rec.lessonCount || 1;
          if (isPres) pres += h;
          else abs += h;
        });
        const totalH = pres + abs;
        const pct = totalH > 0 ? Math.round((pres / totalH) * 100) : 100;
        return [
          idx + 1,
          s.academicRegistration,
          s.fullName,
          s.status,
          summaryMetrics.totalLessons,
          pres,
          abs,
          `${pct}%`,
          pct >= (institution.minAttendancePercentage || 75) ? 'Regular' : 'Infrequente'
        ];
      });
      exportToExcel(prefix, 'Lista de Presença', headers, rows);
    } else if (activeReportTab === 'faltas') {
      const workload = activeUC.workloadHours || 80;
      const maxAbsences = Math.floor(workload * ((100 - (institution.minAttendancePercentage || 75)) / 100));
      const headers = ['R.A.', 'Nome Completo', 'Situação', 'Carga Horária (h)', 'Aulas Dadas (h)', 'Presenças (h)', 'Faltas (h)', 'Limite Máx. Faltas', 'Faltas Restantes', '% Frequência', 'Status Assiduidade'];
      const rows = reportStudents.map(s => {
        let pres = 0;
        let abs = 0;
        reportAttendanceRecords.forEach(rec => {
          const isPres = rec.presences?.[s.id] ?? true;
          const h = rec.lessonCount || 1;
          if (isPres) pres += h;
          else abs += h;
        });
        const totalH = pres + abs;
        const pct = totalH > 0 ? Math.round((pres / totalH) * 100) : 100;
        const remaining = Math.max(0, maxAbsences - abs);
        const status = abs > maxAbsences ? 'REPROVADO POR INFREQUÊNCIA' : remaining <= 4 ? 'EM RISCO' : 'REGULAR';
        return [
          s.academicRegistration,
          s.fullName,
          s.status,
          workload,
          summaryMetrics.totalLessons,
          pres,
          abs,
          maxAbsences,
          remaining,
          `${pct}%`,
          status
        ];
      });
      exportToExcel(prefix, 'Controle de Faltas', headers, rows);
    }
    showFeedback('✅ Planilha Excel (XLSX) gerada e baixada com sucesso!');
  };

  const handleExportCSV = () => {
    if (!activeUC) return;
    const prefix = `Relatorio_${activeReportTab}_${activeClass?.name || 'Turma'}_${activeUC.code}`.replace(/\s+/g, '_');

    if (activeReportTab === 'desempenho') {
      const headers = ['RA', 'Nome', 'Situação', 'S1', 'S2', 'Parcial', 'Recuperação', 'Nota Final', 'Frequência', 'Resultado'];
      const rows = reportComputedResults.map(r => [
        r.academicRegistration,
        r.studentName,
        r.status,
        r.sintese1,
        r.sintese2,
        r.notaParcial,
        r.recuperacao ?? '-',
        r.notaFinal,
        `${r.attendancePercentage}%`,
        r.finalAcademicStatus
      ]);
      exportToCSV(prefix, headers, rows);
    } else if (activeReportTab === 'diario') {
      const headers = ['Aula', 'Data', 'Horas', 'Conteúdo', 'Presentes', 'Ausentes', 'Frequência'];
      const rows = reportAttendanceRecords.map((r, idx) => {
        const pres = Object.values(r.presences || {}).filter(Boolean).length;
        const total = Object.keys(r.presences || {}).length || reportStudents.length;
        return [idx + 1, r.date, r.lessonCount || 1, r.contentTaught, pres, total - pres, `${total > 0 ? Math.round((pres / total) * 100) : 100}%`];
      });
      exportToCSV(prefix, headers, rows);
    } else {
      const headers = ['RA', 'Nome', 'Situação', 'Aulas', 'Presenças', 'Faltas', 'Frequência'];
      const rows = reportStudents.map(s => {
        let pres = 0;
        let abs = 0;
        reportAttendanceRecords.forEach(rec => {
          const isPres = rec.presences?.[s.id] ?? true;
          const h = rec.lessonCount || 1;
          if (isPres) pres += h;
          else abs += h;
        });
        const totalH = pres + abs;
        const pct = totalH > 0 ? Math.round((pres / totalH) * 100) : 100;
        return [s.academicRegistration, s.fullName, s.status, summaryMetrics.totalLessons, pres, abs, `${pct}%`];
      });
      exportToCSV(prefix, headers, rows);
    }
    showFeedback('✅ Arquivo CSV gerado e baixado com sucesso!');
  };

  const handlePrint = () => {
    window.print();
  };

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Empty state if no classes or no UCs
  if (classes.length === 0 || curricularUnits.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-[#002B5B] text-white rounded-2xl p-6 shadow-xl border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#40E0D0]/20 text-[#40E0D0] border border-[#40E0D0]/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              CENTRAL DE RELATÓRIOS & EXPORTAÇÃO
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">Exportação de Dados & Boletins</h1>
          <p className="text-xs text-slate-300 mt-1">
            Geração de boletins, diários de classe, listas de presença e relatórios de faltas e notas.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-4 shadow-md">
          <FileSpreadsheet className="w-14 h-14 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {classes.length === 0 ? 'Nenhuma Turma Cadastrada' : 'Nenhuma Disciplina Cadastrada'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Para gerar boletins e exportar dados acadêmicos, cadastre primeiro as turmas, estudantes e unidades curriculares.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:p-0 print:space-y-3">
      
      {/* ========================================================================= */}
      {/* CABEÇALHO PRINCIPAL DA CENTRAL DE EXPORTAÇÃO                              */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-[#002B5B] via-[#001D3D] to-[#0B132B] text-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-white/10 relative overflow-hidden space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#40E0D0]/20 text-[#40E0D0] border border-[#40E0D0]/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Central de Exportação de Dados
              </span>
              {activeClass && (
                <span className="bg-[#40E0D0] text-[#002B5B] text-xs px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Turma: {activeClass.name}
                </span>
              )}
              {activeUC && (
                <span className="bg-white/15 text-white text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {activeUC.code}
                </span>
              )}
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {institution.name || 'Unidade Escolar'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Exportação de Boletins & Relatórios Oficiais
            </h1>
            <p className="text-xs text-slate-300">
              Selecione a turma, a disciplina e o modelo de arquivo desejado para emitir Diários de Classe, Listas de Presença, Relatórios de Faltas e Boletins de Desempenho.
            </p>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102"
              title="Exportar relatório atual em PDF de alta qualidade"
            >
              <FileText className="w-4 h-4" /> Gerar PDF
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102"
              title="Exportar planilha Excel formatada (XLSX)"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel (XLSX)
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
              title="Exportar em formato CSV para integração"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="Imprimir relatório direto no navegador"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SELETORES REQUISITADOS: SELEÇÃO DE TURMA & UC/DISCIPLINA PELO PROFESSOR*/}
        {/* ===================================================================== */}
        <div className="pt-3 border-t border-[#ffffff15] grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
          
          {/* Seletor de Turma */}
          <div className="bg-[#00142A]/80 border border-[#ffffff15] rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-[#40E0D0] uppercase tracking-wider text-[11px]">
                <GraduationCap className="w-4 h-4" /> 1. Turma Selecionada:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {reportStudents.length} estudante(s)
              </span>
            </div>

            <div className="relative">
              <select
                value={activeClass?.id || ''}
                onChange={(e) => {
                  const newId = e.target.value;
                  setReportClassId(newId);
                  setSelectedClassId(newId);
                }}
                className="w-full bg-[#002B5B] text-white text-xs font-bold rounded-lg px-3 py-2.5 border border-[#40E0D0]/40 outline-none focus:ring-2 focus:ring-[#40E0D0] cursor-pointer appearance-none pr-8 truncate"
              >
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id} className="bg-[#002B5B] text-white">
                    {cls.name} {cls.courseName ? `• ${cls.courseName}` : ''} {cls.shift ? `(${cls.shift})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#40E0D0] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Seletor de UC / Disciplina */}
          <div className="bg-[#00142A]/80 border border-[#ffffff15] rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-[#40E0D0] uppercase tracking-wider text-[11px]">
                <BookOpenCheck className="w-4 h-4" /> 2. UC / Disciplina Selecionada:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {activeUC?.workloadHours || 80}h de carga
              </span>
            </div>

            <div className="relative">
              <select
                value={activeUC?.id || ''}
                onChange={(e) => {
                  const newId = e.target.value;
                  setReportUcId(newId);
                  setSelectedUCId(newId);
                }}
                className="w-full bg-[#002B5B] text-white text-xs font-bold rounded-lg px-3 py-2.5 border border-[#40E0D0]/40 outline-none focus:ring-2 focus:ring-[#40E0D0] cursor-pointer appearance-none pr-8 truncate"
              >
                {classDisciplines.length === 0 ? (
                  <option value="" className="bg-[#002B5B] text-slate-300">
                    Sem disciplinas vinculadas a esta turma
                  </option>
                ) : (
                  classDisciplines.map(uc => (
                    <option key={uc.id} value={uc.id} className="bg-[#002B5B] text-white">
                      {uc.code} - {uc.name} {uc.teacherName ? `(Prof. ${uc.teacherName})` : ''}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-[#40E0D0] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Resumo Rápido dos Dados Selecionados */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          <div className="bg-[#001D3D]/80 px-3 py-2 rounded-lg border border-white/10">
            <span className="text-[10px] text-slate-400 block">Estudantes na Turma</span>
            <span className="font-extrabold text-sm text-white">{summaryMetrics.totalStudents} alunos</span>
          </div>
          <div className="bg-[#001D3D]/80 px-3 py-2 rounded-lg border border-white/10">
            <span className="text-[10px] text-slate-400 block">Aulas Ministradas</span>
            <span className="font-extrabold text-sm text-emerald-400">{summaryMetrics.totalLessons}h registradas</span>
          </div>
          <div className="bg-[#001D3D]/80 px-3 py-2 rounded-lg border border-white/10">
            <span className="text-[10px] text-slate-400 block">Frequência Média</span>
            <span className="font-extrabold text-sm text-[#40E0D0]">{summaryMetrics.avgAttendance}%</span>
          </div>
          <div className="bg-[#001D3D]/80 px-3 py-2 rounded-lg border border-white/10">
            <span className="text-[10px] text-slate-400 block">Média de Notas da Turma</span>
            <span className="font-extrabold text-sm text-amber-400">{summaryMetrics.avgGrade}</span>
          </div>
        </div>

      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className="p-3.5 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4 ABAS REQUISITADAS: DIÁRIO, PRESENÇA, FALTAS E DESEMPENHO/BOLETIM        */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm print:hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          
          {/* Aba 1: Diário de Classe */}
          <button
            type="button"
            onClick={() => setActiveReportTab('diario')}
            className={`p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeReportTab === 'diario'
                ? 'bg-[#002B5B] text-white shadow-md ring-2 ring-[#40E0D0]/50'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarCheck2 className={`w-4 h-4 ${activeReportTab === 'diario' ? 'text-[#40E0D0]' : 'text-slate-400'}`} />
            <span>1. Diário de Classe</span>
          </button>

          {/* Aba 2: Lista de Presença */}
          <button
            type="button"
            onClick={() => setActiveReportTab('presenca')}
            className={`p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeReportTab === 'presenca'
                ? 'bg-[#002B5B] text-white shadow-md ring-2 ring-[#40E0D0]/50'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className={`w-4 h-4 ${activeReportTab === 'presenca' ? 'text-[#40E0D0]' : 'text-slate-400'}`} />
            <span>2. Lista de Presença</span>
          </button>

          {/* Aba 3: Relatório de Faltas */}
          <button
            type="button"
            onClick={() => setActiveReportTab('faltas')}
            className={`p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeReportTab === 'faltas'
                ? 'bg-[#002B5B] text-white shadow-md ring-2 ring-[#40E0D0]/50'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${activeReportTab === 'faltas' ? 'text-[#40E0D0]' : 'text-slate-400'}`} />
            <span>3. Relatório de Faltas</span>
          </button>

          {/* Aba 4: Relatório de Desempenho & Boletim */}
          <button
            type="button"
            onClick={() => setActiveReportTab('desempenho')}
            className={`p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeReportTab === 'desempenho'
                ? 'bg-[#002B5B] text-white shadow-md ring-2 ring-[#40E0D0]/50'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className={`w-4 h-4 ${activeReportTab === 'desempenho' ? 'text-[#40E0D0]' : 'text-slate-400'}`} />
            <span>4. Desempenho & Boletim</span>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SELETOR REQUISITADO: MODELOS DE LAYOUT DE ARQUIVO PARA O BOLETIM          */}
      {/* (Exibido especialmente quando a aba de Desempenho / Boletim está ativa)   */}
      {/* ========================================================================= */}
      {activeReportTab === 'desempenho' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in duration-150 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#40E0D0]" />
                Layout de Arquivo para Geração do Boletim:
              </span>
              <p className="text-[11px] text-slate-500">
                Selecione o modelo e a estrutura visual que será aplicada no arquivo PDF e na tabela do boletim.
              </p>
            </div>
            <span className="text-[11px] font-bold text-[#002B5B] dark:text-[#40E0D0] bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-200 dark:border-cyan-800 self-start sm:self-center">
              Layout Ativo: {boletimLayout.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Opção 1: Layout Padrão Oficial */}
            <div
              onClick={() => setBoletimLayout('oficial')}
              className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                boletimLayout === 'oficial'
                  ? 'border-[#40E0D0] bg-cyan-50/70 dark:bg-cyan-950/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#002B5B] dark:text-[#40E0D0]" />
                    Padrão Oficial Institucional
                  </span>
                  {boletimLayout === 'oficial' && (
                    <span className="w-5 h-5 rounded-full bg-[#002B5B] dark:bg-[#40E0D0] text-[#40E0D0] dark:text-[#002B5B] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Layout completo oficial: sínteses P1/P2, parciais, recuperação, nota final, frequência (%) e campos para assinaturas do docente e coordenação.
                </p>
              </div>
              <span className="text-[10px] font-mono font-semibold text-[#002B5B] dark:text-[#40E0D0] block">
                Formato Paisagem (Landscape) • Completo
              </span>
            </div>

            {/* Opção 2: Layout Sintético / Mural */}
            <div
              onClick={() => setBoletimLayout('sintetico')}
              className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                boletimLayout === 'sintetico'
                  ? 'border-[#40E0D0] bg-cyan-50/70 dark:bg-cyan-950/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Sintético / Mural Escolar
                  </span>
                  {boletimLayout === 'sintetico' && (
                    <span className="w-5 h-5 rounded-full bg-[#002B5B] dark:bg-[#40E0D0] text-[#40E0D0] dark:text-[#002B5B] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Layout direto e enxuto: R.A., Nome, Nota Final, Frequência (%) e Situação. Ideal para publicação em mural ou fechamento rápido.
                </p>
              </div>
              <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 block">
                Formato Retrato (Portrait) • Direto
              </span>
            </div>

            {/* Opção 3: Layout Analítico Pedagógico */}
            <div
              onClick={() => setBoletimLayout('analitico')}
              className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                boletimLayout === 'analitico'
                  ? 'border-[#40E0D0] bg-cyan-50/70 dark:bg-cyan-950/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Analítico & Pedagógico
                  </span>
                  {boletimLayout === 'analitico' && (
                    <span className="w-5 h-5 rounded-full bg-[#002B5B] dark:bg-[#40E0D0] text-[#40E0D0] dark:text-[#002B5B] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Layout detalhado: notas parciais, horas assistidas, faltas em horas, parecer pedagógico e distribuição estatística geral da turma.
                </p>
              </div>
              <span className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 block">
                Formato Paisagem • Com Parecer
              </span>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTEÚDO DAS 4 SEÇÕES DE RELATÓRIO                                        */}
      {/* ========================================================================= */}

      {/* ------------------------------------------------------------------------- */}
      {/* SEÇÃO 1: DIÁRIO DE CLASSE                                                 */}
      {/* ------------------------------------------------------------------------- */}
      {activeReportTab === 'diario' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck2 className="w-5 h-5 text-[#40E0D0]" />
                Diário de Classe Oficial — Aulas e Conteúdos Ministrados
              </h2>
              <p className="text-xs text-slate-500">
                Histórico sequencial das aulas dadas na turma {activeClass?.name} para {activeUC?.name}.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar conteúdo ou data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-[#40E0D0]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#002B5B] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center">Aula</th>
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3 text-center">Horas</th>
                  <th className="py-3 px-4">Conteúdo Programático Ministrado</th>
                  <th className="py-3 px-3 text-center text-emerald-300">Presentes</th>
                  <th className="py-3 px-3 text-center text-rose-300">Ausentes</th>
                  <th className="py-3 px-3 text-center">% Presença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDiarioRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400 italic">
                      Nenhuma aula registrada até o momento no diário desta disciplina para a turma {activeClass?.name}.
                    </td>
                  </tr>
                ) : (
                  filteredDiarioRecords.map((rec, idx) => {
                    const presCount = Object.values(rec.presences || {}).filter(Boolean).length;
                    const totalStudentsInCall = Object.keys(rec.presences || {}).length || reportStudents.length;
                    const absenceCount = totalStudentsInCall - presCount;
                    const rate = totalStudentsInCall > 0 ? Math.round((presCount / totalStudentsInCall) * 100) : 100;

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {new Date(rec.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {rec.lessonCount || 1}h
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-100">
                          {rec.contentTaught}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {presCount}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-rose-600 dark:text-rose-400">
                          {absenceCount}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            rate >= 75
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* SEÇÃO 2: LISTA DE PRESENÇA                                                */}
      {/* ------------------------------------------------------------------------- */}
      {activeReportTab === 'presenca' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#40E0D0]" />
                Lista de Presença e Folha de Chamada
              </h2>
              <p className="text-xs text-slate-500">
                Controle de assiduidade dos estudantes da turma {activeClass?.name} na disciplina {activeUC?.name}.
              </p>
            </div>

            {/* Mode Toggle: Computada vs Folha em Branco para Assinatura */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-center">
              <button
                type="button"
                onClick={() => setPresenceSheetMode('computada')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  presenceSheetMode === 'computada'
                    ? 'bg-[#002B5B] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Frequência Computada
              </button>
              <button
                type="button"
                onClick={() => setPresenceSheetMode('manual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  presenceSheetMode === 'manual'
                    ? 'bg-[#002B5B] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Folha em Branco (Sala)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#002B5B] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center">Nº</th>
                  <th className="py-3 px-3">R.A.</th>
                  <th className="py-3 px-4">Nome do Estudante</th>
                  <th className="py-3 px-3 text-center">Situação</th>
                  {presenceSheetMode === 'manual' ? (
                    <>
                      <th className="py-3 px-3 text-center border-l border-white/20">Data: ___/___</th>
                      <th className="py-3 px-3 text-center border-l border-white/20">Data: ___/___</th>
                      <th className="py-3 px-3 text-center border-l border-white/20">Data: ___/___</th>
                      <th className="py-3 px-3 text-center border-l border-white/20">Rubrica / Visto</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-3 text-center">Aulas</th>
                      <th className="py-3 px-3 text-center text-emerald-300">Presenças (h)</th>
                      <th className="py-3 px-3 text-center text-rose-300">Faltas (h)</th>
                      <th className="py-3 px-3 text-center">% Frequência</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={presenceSheetMode === 'manual' ? 8 : 9} className="py-8 text-center text-xs text-slate-400 italic">
                      Nenhum estudante matriculado na turma {activeClass?.name}.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, idx) => {
                    let pres = 0;
                    let abs = 0;
                    reportAttendanceRecords.forEach(rec => {
                      const isPres = rec.presences?.[s.id] ?? true;
                      const h = rec.lessonCount || 1;
                      if (isPres) pres += h;
                      else abs += h;
                    });
                    const totalH = pres + abs;
                    const pct = totalH > 0 ? Math.round((pres / totalH) * 100) : 100;
                    const isRegular = pct >= (institution.minAttendancePercentage || 75);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {s.academicRegistration}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                          {s.fullName}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold border ${getStatusBadgeStyle(s.status)}`}>
                            {getStatusAbbreviation(s.status)}
                          </span>
                        </td>
                        {presenceSheetMode === 'manual' ? (
                          <>
                            <td className="py-3 px-3 border-l border-slate-200 dark:border-slate-800 text-center text-slate-300">_________________</td>
                            <td className="py-3 px-3 border-l border-slate-200 dark:border-slate-800 text-center text-slate-300">_________________</td>
                            <td className="py-3 px-3 border-l border-slate-200 dark:border-slate-800 text-center text-slate-300">_________________</td>
                            <td className="py-3 px-3 border-l border-slate-200 dark:border-slate-800 text-center text-slate-300">_________________</td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                              {summaryMetrics.totalLessons}h
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                              {pres}h
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-rose-600 dark:text-rose-400">
                              {abs}h
                            </td>
                            <td className="py-3 px-3 text-center font-extrabold">
                              <span className={`px-2 py-0.5 rounded ${isRegular ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                                {pct}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isRegular ? (
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Regular</span>
                              ) : (
                                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">Alerta de Falta</span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* SEÇÃO 3: RELATÓRIO DE FALTAS                                              */}
      {/* ------------------------------------------------------------------------- */}
      {activeReportTab === 'faltas' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Relatório de Controle de Faltas & Prevenção de Infrequência
              </h2>
              <p className="text-xs text-slate-500">
                Acompanhamento de saldo de faltas permitidas (limite de 25% da carga horária) da turma {activeClass?.name}.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por estudante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* Cards Indicadores de Faltas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Frequência da Turma</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{summaryMetrics.avgAttendance}%</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Mínimo: {institution.minAttendancePercentage || 75}%</span>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/20">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold block">Frequência Regular</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{summaryMetrics.studentsRegular}</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-500 block mt-0.5">Alunos sem risco</span>
            </div>
            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold block">Alunos em Alerta</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">{summaryMetrics.studentsAtRisk}</span>
              <span className="text-[10px] text-amber-700 dark:text-amber-500 block mt-0.5">Próximos ao limite</span>
            </div>
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/60 dark:bg-rose-950/20">
              <span className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-bold block">Reprovados por Falta</span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400">{summaryMetrics.studentsFailedByAbsence}</span>
              <span className="text-[10px] text-rose-700 dark:text-rose-500 block mt-0.5">Excederam 25% faltas</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#002B5B] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">R.A.</th>
                  <th className="py-3 px-4">Nome do Estudante</th>
                  <th className="py-3 px-3 text-center">Carga Horária</th>
                  <th className="py-3 px-3 text-center">Aulas Dadas</th>
                  <th className="py-3 px-3 text-center text-emerald-300">Presenças (h)</th>
                  <th className="py-3 px-3 text-center text-rose-300">Faltas (h)</th>
                  <th className="py-3 px-3 text-center">Limite Máx.</th>
                  <th className="py-3 px-3 text-center">Faltas Restantes</th>
                  <th className="py-3 px-3 text-center">% Freq.</th>
                  <th className="py-3 px-4 text-center">Status de Assiduidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-xs text-slate-400 italic">
                      Nenhum estudante cadastrado nesta turma.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(s => {
                    const workload = activeUC?.workloadHours || 80;
                    const minPct = institution.minAttendancePercentage || 75;
                    const maxAbsences = Math.floor(workload * ((100 - minPct) / 100));

                    let pres = 0;
                    let abs = 0;
                    reportAttendanceRecords.forEach(rec => {
                      const isPres = rec.presences?.[s.id] ?? true;
                      const h = rec.lessonCount || 1;
                      if (isPres) pres += h;
                      else abs += h;
                    });
                    const totalH = pres + abs;
                    const pct = totalH > 0 ? Math.round((pres / totalH) * 100) : 100;
                    const remaining = Math.max(0, maxAbsences - abs);
                    const isReprovado = abs > maxAbsences || pct < minPct;
                    const isAlerta = !isReprovado && (remaining <= 4 || pct < minPct + 5);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                          {s.academicRegistration}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                          {s.fullName}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-600 dark:text-slate-400">
                          {workload}h
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                          {summaryMetrics.totalLessons}h
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {pres}h
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-rose-600 dark:text-rose-400">
                          {abs}h
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500">
                          {maxAbsences}h
                        </td>
                        <td className="py-3 px-3 text-center font-extrabold text-[#002B5B] dark:text-[#40E0D0]">
                          {remaining}h
                        </td>
                        <td className="py-3 px-3 text-center font-black">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            isReprovado
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : isAlerta
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isReprovado ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                              <XCircle className="w-3 h-3" /> Reprovado por Falta
                            </span>
                          ) : isAlerta ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                              <AlertCircle className="w-3 h-3" /> Alerta de Risco
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Regular
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
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* SEÇÃO 4: RELATÓRIO DE DESEMPENHO & BOLETIM DOS ALUNOS                     */}
      {/* ------------------------------------------------------------------------- */}
      {activeReportTab === 'desempenho' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#40E0D0]" />
                Relatório de Desempenho Acadêmico & Boletim Escolar
              </h2>
              <p className="text-xs text-slate-500">
                Visualização formatada de acordo com o <strong>Layout {boletimLayout.toUpperCase()}</strong> selecionado.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar estudante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* Cards Indicadores de Notas & Desempenho */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Média da Turma</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{summaryMetrics.avgGrade}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Mínimo: {(institution.minPassingGrade || 6).toFixed(1)}</span>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/20">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold block">Taxa Aprovação</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{summaryMetrics.approvalRate}%</span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-500 block mt-0.5">{summaryMetrics.studentsApproved} aprovados</span>
            </div>
            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20">
              <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold block">Recuperação</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">{summaryMetrics.studentsInRecovery}</span>
              <span className="text-[10px] text-amber-700 dark:text-amber-500 block mt-0.5">Com nota de exame</span>
            </div>
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/60 dark:bg-rose-950/20">
              <span className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-bold block">Reprovados</span>
              <span className="text-xl font-black text-rose-600 dark:text-rose-400">{summaryMetrics.studentsFailedByGrade + summaryMetrics.studentsFailedByAbsence}</span>
              <span className="text-[10px] text-rose-700 dark:text-rose-500 block mt-0.5">Nota ou falta</span>
            </div>
            <div className="p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-800/60 bg-cyan-50/60 dark:bg-cyan-950/20 col-span-2 lg:col-span-1">
              <span className="text-[10px] text-cyan-700 dark:text-cyan-400 uppercase font-bold block">Faixa de Notas</span>
              <span className="text-xl font-black text-[#002B5B] dark:text-[#40E0D0]">{summaryMetrics.lowestGrade} - {summaryMetrics.highestGrade}</span>
              <span className="text-[10px] text-cyan-700 dark:text-cyan-500 block mt-0.5">Mín. e Máx. registradas</span>
            </div>
          </div>

          {/* Tabela de Boletim correspondente ao Layout Selecionado */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              
              {/* HEADERS CONFORME O LAYOUT SELECIONADO */}
              <thead className="bg-[#002B5B] text-white uppercase text-[10px] tracking-wider">
                {boletimLayout === 'sintetico' ? (
                  <tr>
                    <th className="py-3 px-3 text-center">Nº</th>
                    <th className="py-3 px-3">R.A.</th>
                    <th className="py-3 px-4">Nome do Estudante</th>
                    <th className="py-3 px-3 text-center">Nota Final</th>
                    <th className="py-3 px-3 text-center">Frequência (%)</th>
                    <th className="py-3 px-4 text-center">Situação Final</th>
                  </tr>
                ) : boletimLayout === 'analitico' ? (
                  <tr>
                    <th className="py-3 px-3">R.A.</th>
                    <th className="py-3 px-4">Nome do Estudante</th>
                    <th className="py-3 px-3 text-center">Sit.</th>
                    <th className="py-3 px-2 text-center">P1</th>
                    <th className="py-3 px-2 text-center">P2</th>
                    <th className="py-3 px-2 text-center">Parcial</th>
                    <th className="py-3 px-2 text-center">Rec.</th>
                    <th className="py-3 px-3 text-center text-[#40E0D0]">Final</th>
                    <th className="py-3 px-2 text-center">Aulas</th>
                    <th className="py-3 px-2 text-center text-rose-300">Faltas (h)</th>
                    <th className="py-3 px-3 text-center">Freq. (%)</th>
                    <th className="py-3 px-4 text-center">Parecer Pedagógico</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="py-3 px-3">R.A.</th>
                    <th className="py-3 px-4">Nome Completo do Estudante</th>
                    <th className="py-3 px-3 text-center">Situação</th>
                    <th className="py-3 px-3 text-center">Síntese 1</th>
                    <th className="py-3 px-3 text-center">Síntese 2</th>
                    <th className="py-3 px-3 text-center">Média Parcial</th>
                    <th className="py-3 px-3 text-center">Recuperação</th>
                    <th className="py-3 px-3 text-center text-[#40E0D0]">Nota Final</th>
                    <th className="py-3 px-3 text-center">Freq. (%)</th>
                    <th className="py-3 px-4 text-center">Resultado Final</th>
                  </tr>
                )}
              </thead>

              {/* BODY CONFORME O LAYOUT SELECIONADO */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredComputedResults.length === 0 ? (
                  <tr>
                    <td colSpan={boletimLayout === 'sintetico' ? 6 : boletimLayout === 'analitico' ? 12 : 10} className="py-8 text-center text-xs text-slate-400 italic">
                      Nenhum resultado de notas gerado para esta turma.
                    </td>
                  </tr>
                ) : (
                  filteredComputedResults.map((r, idx) => {
                    const isApproved = (r.notaFinal || 0) >= (institution.minPassingGrade || 6);
                    const isFreqOk = (r.attendancePercentage ?? 100) >= (institution.minAttendancePercentage || 75);

                    if (boletimLayout === 'sintetico') {
                      return (
                        <tr key={r.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {r.academicRegistration}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                            {r.studentName}
                          </td>
                          <td className="py-3 px-3 text-center font-black text-sm text-[#002B5B] dark:text-[#40E0D0]">
                            {Number(r.notaFinal || 0).toFixed(1)}
                          </td>
                          <td className="py-3 px-3 text-center font-bold">
                            {r.attendancePercentage}%
                          </td>
                          <td className="py-3 px-4 text-center font-extrabold">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${isApproved && isFreqOk ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                              {r.finalAcademicStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    }

                    if (boletimLayout === 'analitico') {
                      let parecer = 'Aprovado por Média e Frequência';
                      if (!isFreqOk) parecer = 'Reprovado por Infrequência';
                      else if (!isApproved) parecer = 'Reprovado por Nota';

                      return (
                        <tr key={r.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                            {r.academicRegistration}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100 truncate max-w-[160px]">
                            {r.studentName}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold border ${getStatusBadgeStyle(r.status)}`}>
                              {getStatusAbbreviation(r.status)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center font-semibold">{r.sintese1.toFixed(1)}</td>
                          <td className="py-3 px-2 text-center font-semibold">{r.sintese2.toFixed(1)}</td>
                          <td className="py-3 px-2 text-center font-semibold text-slate-600 dark:text-slate-400">{r.notaParcial.toFixed(1)}</td>
                          <td className="py-3 px-2 text-center font-medium text-amber-600">{r.recuperacao !== undefined ? r.recuperacao.toFixed(1) : '-'}</td>
                          <td className="py-3 px-3 text-center font-black text-sm text-[#002B5B] dark:text-[#40E0D0]">{r.notaFinal.toFixed(1)}</td>
                          <td className="py-3 px-2 text-center text-slate-500">{summaryMetrics.totalLessons}h</td>
                          <td className="py-3 px-2 text-center font-bold text-rose-600 dark:text-rose-400">{r.totalAbsences || 0}h</td>
                          <td className="py-3 px-3 text-center font-bold">{r.attendancePercentage}%</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              isApproved && isFreqOk
                                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
                            }`}>
                              {parecer}
                            </span>
                          </td>
                        </tr>
                      );
                    }

                    // Oficial (Padrão)
                    return (
                      <tr key={r.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                          {r.academicRegistration}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                          {r.studentName}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold border ${getStatusBadgeStyle(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold">{r.sintese1.toFixed(1)}</td>
                        <td className="py-3 px-3 text-center font-bold">{r.sintese2.toFixed(1)}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-600 dark:text-slate-400">{r.notaParcial.toFixed(1)}</td>
                        <td className="py-3 px-3 text-center text-amber-600 font-semibold">{r.recuperacao !== undefined ? r.recuperacao.toFixed(1) : '-'}</td>
                        <td className="py-3 px-3 text-center font-black text-sm text-[#002B5B] dark:text-[#40E0D0]">{r.notaFinal.toFixed(1)}</td>
                        <td className="py-3 px-3 text-center font-bold">{r.attendancePercentage}%</td>
                        <td className="py-3 px-4 text-center font-extrabold">
                          <span className={`px-2.5 py-1 rounded text-xs inline-block ${
                            r.finalAcademicStatus === 'APROVADO'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {r.finalAcademicStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
