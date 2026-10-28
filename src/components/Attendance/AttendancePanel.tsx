import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Check,
  Search,
  Users,
  Calendar,
  Clock,
  FileText,
  X,
  GraduationCap,
  ChevronDown,
  Layers,
  BookOpenCheck,
  BarChart3,
  Percent,
  Download,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Filter
} from 'lucide-react';
import { DailyAttendanceRecord } from '../../types';
import { getStatusBadgeStyle, getStatusAbbreviation, getTrimesterFromDate } from '../../utils/avaCalculations';

interface AttendancePanelProps {
  setActiveTab?: (tab: string) => void;
}

export const AttendancePanel: React.FC<AttendancePanelProps> = ({ setActiveTab }) => {
  const {
    classes,
    selectedClassId,
    selectedClass,
    setSelectedClassId,
    curricularUnits,
    selectedUC,
    selectedUCId,
    setSelectedUCId,
    students,
    attendanceRecords,
    addAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    institution,
    computedResults
  } = useApp();

  // Active view inside the Attendance Panel:
  // 'nova-chamada' = registrar nova chamada
  // 'historico' = histórico de chamadas gravadas
  // 'quadro-geral' = visão consolidada da frequência de todos os alunos
  const [currentAttendanceTab, setCurrentAttendanceTab] = useState<'nova-chamada' | 'historico' | 'quadro-geral'>('nova-chamada');

  // Form states for Nova Chamada
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lessonCount, setLessonCount] = useState(4);
  const [contentTaught, setContentTaught] = useState('');
  const [callTrimester, setCallTrimester] = useState<'1º Trimestre' | '2º Trimestre' | '3º Trimestre'>(() =>
    getTrimesterFromDate(new Date().toISOString().slice(0, 10))
  );
  const [studentPresences, setStudentPresences] = useState<Record<string, boolean>>({});
  const [searchTermStudent, setSearchTermStudent] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date());
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Selected Trimester Filter across Historico and Quadro Geral
  const [attendanceTrimesterFilter, setAttendanceTrimesterFilter] = useState<'todos' | '1º Trimestre' | '2º Trimestre' | '3º Trimestre'>('todos');

  // Selected UC(s) via checkbox for Nova Chamada
  const [selectedCallUcIds, setSelectedCallUcIds] = useState<string[]>([]);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<DailyAttendanceRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<DailyAttendanceRecord | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editLessonCount, setEditLessonCount] = useState(4);
  const [editContentTaught, setEditContentTaught] = useState('');
  const [editTrimester, setEditTrimester] = useState<'1º Trimestre' | '2º Trimestre' | '3º Trimestre'>('1º Trimestre');
  const [editStudentPresences, setEditStudentPresences] = useState<Record<string, boolean>>({});
  const [editStudentSearch, setEditStudentSearch] = useState('');

  // Dropdown states for Class and UC selection
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [classDropdownFilter, setClassDropdownFilter] = useState('');
  const classDropdownRef = useRef<HTMLDivElement>(null);

  const [isUCDropdownOpen, setIsUCDropdownOpen] = useState(false);
  const ucDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
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

  // Determine current active class prioritizing selectedClassId / selectedClass
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
    if (selectedUC?.className) {
      const found = classes.find(c => c.name === selectedUC.className);
      if (found) return found;
    }
    return classes[0] || null;
  }, [classes, selectedClassId, selectedClass, selectedUC]);

  // List of UCs / Disciplines associated with this selected class
  const classDisciplines = useMemo(() => {
    if (!currentClass) return curricularUnits;
    const filtered = curricularUnits.filter(
      u => u.classId === currentClass.id || 
           u.additionalClassIds?.includes(currentClass.id) || 
           (u.className && currentClass.name && u.className === currentClass.name)
    );
    return filtered.length > 0 ? filtered : curricularUnits;
  }, [currentClass, curricularUnits]);

  // Synchronize selectedUC whenever currentClass changes
  useEffect(() => {
    if (currentClass && classDisciplines.length > 0) {
      const isCurrentValid = selectedUC && classDisciplines.some(u => u.id === selectedUC.id);
      if (!isCurrentValid) {
        setSelectedUCId(classDisciplines[0].id);
      }
    }
  }, [currentClass, classDisciplines, selectedUC, setSelectedUCId]);

  // Synchronize selectedCallUcIds with classDisciplines and selectedUCId
  useEffect(() => {
    if (classDisciplines.length > 0) {
      setSelectedCallUcIds(prev => {
        const valid = prev.filter(id => classDisciplines.some(u => u.id === id));
        if (valid.length > 0) return valid;
        if (selectedUCId && classDisciplines.some(u => u.id === selectedUCId)) {
          return [selectedUCId];
        }
        return [classDisciplines[0].id];
      });
    } else {
      setSelectedCallUcIds([]);
    }
  }, [classDisciplines, selectedUCId]);

  // Toggle single UC checkbox in Nova Chamada
  const handleToggleCallUc = (ucId: string) => {
    setSelectedCallUcIds(prev => {
      if (prev.includes(ucId)) {
        return prev.filter(id => id !== ucId);
      } else {
        setSelectedUCId(ucId);
        return [...prev, ucId];
      }
    });
  };

  // Select all or clear UCs in Nova Chamada
  const handleSelectAllCallUcs = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedCallUcIds(classDisciplines.map(u => u.id));
    } else {
      setSelectedCallUcIds([]);
    }
  };

  // Handle switching class: syncs global selectedClassId and adapts selectedUC
  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    const targetClass = classes.find(c => c.id === classId);
    
    // Find UCs associated with this target class
    const matchingUCs = curricularUnits.filter(
      u => u.classId === classId || 
           u.additionalClassIds?.includes(classId) || 
           (targetClass && u.className === targetClass.name)
    );
    if (matchingUCs.length > 0) {
      setSelectedUCId(matchingUCs[0].id);
    }
    setIsClassDropdownOpen(false);
  };

  // Filter classes for dropdown
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

  // Students belonging strictly to this selected Class, sorted alphabetically
  const ucStudents = useMemo(() => {
    if (!currentClass) return [];
    return students.filter(s => {
      const studentClassIds = Array.isArray(s.classIds) && s.classIds.length > 0 
        ? s.classIds 
        : (s.classId ? [s.classId] : []);
      const inCurrentClass = studentClassIds.includes(currentClass.id) || 
                             (s.className && currentClass.name && s.className === currentClass.name);
      return inCurrentClass;
    }).sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'pt-BR', { sensitivity: 'base' }));
  }, [currentClass, students]);

  // Initialize studentPresences when ucStudents changes
  useEffect(() => {
    setStudentPresences(prev => {
      const initialMap: Record<string, boolean> = { ...prev };
      ucStudents.forEach(s => {
        if (initialMap[s.id] === undefined) {
          initialMap[s.id] = true;
        }
      });
      return initialMap;
    });
  }, [ucStudents]);

  // Attendance history strictly for the selected Class (and selected UC if active)
  const ucAttendanceHistory = useMemo(() => {
    if (!currentClass) return [];
    return attendanceRecords.filter(a => {
      const matchesClass = a.classId === currentClass.id;
      const matchesUC = !selectedUC || a.ucId === selectedUC.id || a.ucId === 'geral';
      return matchesClass && matchesUC;
    });
  }, [attendanceRecords, currentClass, selectedUC]);

  // Attendance metrics and KPIs strictly for the selected Class
  const attendanceStats = useMemo(() => {
    const totalLessons = ucAttendanceHistory.reduce((acc, curr) => acc + (curr.lessonCount || 1), 0);
    const totalCalls = ucAttendanceHistory.length;
    const totalStudents = ucStudents.length;

    let sumPercentage = 0;
    let studentsRegular = 0;
    let studentsAtRisk = 0;
    let studentsFailedByAbsence = 0;

    const minReq = institution.minAttendancePercentage || 75;

    ucStudents.forEach(student => {
      let presencesHours = 0;
      let absencesHours = 0;

      ucAttendanceHistory.forEach(rec => {
        const isPres = rec.presences?.[student.id] ?? true;
        const hours = rec.lessonCount || 1;
        if (isPres) {
          presencesHours += hours;
        } else {
          absencesHours += hours;
        }
      });

      const totalHours = presencesHours + absencesHours;
      const pct = totalHours > 0 
        ? Math.round((presencesHours / totalHours) * 100) 
        : 100;

      sumPercentage += pct;

      if (pct >= minReq) {
        studentsRegular++;
      } else if (pct >= minReq - 5) {
        studentsAtRisk++;
      } else {
        studentsFailedByAbsence++;
      }
    });

    const avgAttendance = totalStudents > 0 
      ? (sumPercentage / totalStudents).toFixed(1) 
      : '100.0';

    return {
      totalLessons,
      totalCalls,
      totalStudents,
      avgAttendance,
      minReq,
      studentsRegular,
      studentsAtRisk,
      studentsFailedByAbsence
    };
  }, [ucAttendanceHistory, ucStudents, institution]);

  // Toggle all students present/absent
  const toggleAllPresences = (isPresent: boolean) => {
    const updated: Record<string, boolean> = {};
    ucStudents.forEach(s => {
      updated[s.id] = isPresent;
    });
    setStudentPresences(updated);
  };

  // Invert selection
  const invertAllPresences = () => {
    const updated: Record<string, boolean> = {};
    ucStudents.forEach(s => {
      updated[s.id] = !(studentPresences[s.id] ?? true);
    });
    setStudentPresences(updated);
  };

  // Save new attendance record strictly associated with the selected class and chosen UC(s)
  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass) {
      alert('Por favor, selecione uma turma cadastrada.');
      return;
    }

    if (classDisciplines.length > 0 && selectedCallUcIds.length === 0) {
      alert('Por favor, marque pelo menos uma UC / Disciplina no checkbox para registrar a chamada.');
      return;
    }

    if (!contentTaught.trim()) {
      alert('Por favor, informe o conteúdo programático ministrado na aula.');
      return;
    }

    const targetUcIds = selectedCallUcIds.length > 0 
      ? selectedCallUcIds 
      : (selectedUC ? [selectedUC.id] : [classDisciplines[0]?.id || 'geral']);

    const now = Date.now();
    targetUcIds.forEach((ucId, idx) => {
      const newRecord: DailyAttendanceRecord = {
        id: `att-${now}-${idx}-${ucId}`,
        ucId,
        classId: currentClass.id,
        date,
        lessonCount: Number(lessonCount),
        contentTaught: contentTaught.trim(),
        presences: { ...studentPresences },
        createdAt: new Date().toISOString(),
        trimester: callTrimester
      };
      addAttendanceRecord(newRecord);
    });

    const ucNames = targetUcIds
      .map(id => curricularUnits.find(u => u.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    setContentTaught('');
    setFeedbackMessage(
      `✅ Registro de Presença gravado com sucesso (${callTrimester}) para a turma ${currentClass.name}${ucNames ? ` na(s) disciplina(s): ${ucNames}` : ''}!`
    );
    setTimeout(() => setFeedbackMessage(null), 4000);
    setCurrentAttendanceTab('historico');
  };

  // Open edit modal
  const handleOpenEdit = (record: DailyAttendanceRecord) => {
    setEditingRecord(record);
    setEditDate(record.date);
    setEditLessonCount(record.lessonCount || 4);
    setEditContentTaught(record.contentTaught);
    setEditTrimester((record.trimester as any) || getTrimesterFromDate(record.date));

    const currentPresences: Record<string, boolean> = {};
    ucStudents.forEach(s => {
      currentPresences[s.id] = record.presences[s.id] ?? true;
    });
    Object.keys(record.presences || {}).forEach(sId => {
      if (currentPresences[sId] === undefined) {
        currentPresences[sId] = record.presences[sId];
      }
    });

    setEditStudentPresences(currentPresences);
    setEditStudentSearch('');
  };

  // Save edited attendance record
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    if (!editContentTaught.trim()) {
      alert('Por favor, informe o conteúdo ministrado na aula.');
      return;
    }

    const updatedRecord: DailyAttendanceRecord = {
      ...editingRecord,
      date: editDate,
      lessonCount: Number(editLessonCount),
      contentTaught: editContentTaught.trim(),
      presences: { ...editStudentPresences },
      trimester: editTrimester
    };

    updateAttendanceRecord(updatedRecord);
    setEditingRecord(null);
    setFeedbackMessage('✅ Registro de presença atualizado com sucesso!');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Filtered students for Nova Chamada
  const filteredStudentsForCall = useMemo(() => {
    if (!searchTermStudent.trim()) return ucStudents;
    const q = searchTermStudent.toLowerCase();
    return ucStudents.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.academicRegistration.includes(q)
    );
  }, [ucStudents, searchTermStudent]);

  // Filtered history records with Trimester, Date, and Search filters
  const filteredHistory = useMemo(() => {
    let list = ucAttendanceHistory;
    if (attendanceTrimesterFilter !== 'todos') {
      list = list.filter(h => (h.trimester || getTrimesterFromDate(h.date)) === attendanceTrimesterFilter);
    }
    if (historyDateFilter) {
      list = list.filter(h => h.date === historyDateFilter);
    }
    if (!historySearch.trim()) return list;
    const q = historySearch.toLowerCase();
    return list.filter(h =>
      h.contentTaught.toLowerCase().includes(q) ||
      h.date.includes(q) ||
      (h.trimester && h.trimester.toLowerCase().includes(q))
    );
  }, [ucAttendanceHistory, historySearch, attendanceTrimesterFilter, historyDateFilter]);

  // Map of dates to attendance records for the selected class/UC
  const datesWithClasses = useMemo(() => {
    const map = new Map<string, DailyAttendanceRecord[]>();
    ucAttendanceHistory.forEach(rec => {
      if (!rec.date) return;
      const existing = map.get(rec.date) || [];
      existing.push(rec);
      map.set(rec.date, existing);
    });
    return map;
  }, [ucAttendanceHistory]);

  const monthNamesPt = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Calendar matrix days calculation
  const calendarDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      records: DailyAttendanceRecord[];
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Padding from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const mStr = String(prevMonth + 1).padStart(2, '0');
      const dStr = String(dayNum).padStart(2, '0');
      const dateStr = `${prevYear}-${mStr}-${dStr}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        records: datesWithClasses.get(dateStr) || []
      });
    }

    // Days in current month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(dayNum).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        records: datesWithClasses.get(dateStr) || []
      });
    }

    // Padding for next month
    const remaining = (7 - (days.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const mStr = String(nextMonth + 1).padStart(2, '0');
      const dStr = String(dayNum).padStart(2, '0');
      const dateStr = `${nextYear}-${mStr}-${dStr}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        records: datesWithClasses.get(dateStr) || []
      });
    }

    return days;
  }, [calendarViewDate, datesWithClasses]);

  const handlePrevMonth = () => {
    setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleTodayMonth = () => {
    const today = new Date();
    setCalendarViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setHistoryDateFilter(today.toISOString().slice(0, 10));
  };

  const handleDateSelect = (dateStr: string) => {
    if (historyDateFilter === dateStr) {
      setHistoryDateFilter('');
    } else {
      setHistoryDateFilter(dateStr);
      const parsed = new Date(dateStr + 'T00:00:00');
      if (!isNaN(parsed.getTime())) {
        setCalendarViewDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
      }
    }
  };

  // Edit modal student filtering
  const filteredEditStudents = useMemo(() => {
    if (!editStudentSearch.trim()) return ucStudents;
    const q = editStudentSearch.toLowerCase();
    return ucStudents.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.academicRegistration.toLowerCase().includes(q)
    );
  }, [ucStudents, editStudentSearch]);

  const editTotalStudents = ucStudents.length;
  const editPresencesCount = ucStudents.filter(s => editStudentPresences[s.id] ?? true).length;
  const editAbsencesCount = editTotalStudents - editPresencesCount;
  const editAttendancePercent = editTotalStudents > 0 ? Math.round((editPresencesCount / editTotalStudents) * 100) : 100;

  // Empty state if no classes or UCs
  if (classes.length === 0 || curricularUnits.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-[#002B5B] text-white rounded-2xl p-6 shadow-xl border border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#40E0D0]/20 text-[#40E0D0] border border-[#40E0D0]/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                DIÁRIO DE CLASSE & FREQUÊNCIA
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">Painel de Registro de Presença</h1>
            <p className="text-xs text-slate-300 mt-1">
              Gestão de chamadas e controle de faltas dos estudantes.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-md">
          <CalendarCheck2 className="w-14 h-14 text-slate-400 mx-auto" />
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Nenhuma Turma ou Disciplina Disponível
            </h3>
            <p className="text-xs text-slate-500">
              Para realizar chamadas e controlar a presença, cadastre primeiro os cursos, turmas e unidades curriculares.
            </p>
          </div>
          {setActiveTab && (
            <button
              type="button"
              onClick={() => setActiveTab('cursos')}
              className="px-5 py-2.5 bg-[#002B5B] hover:bg-[#001D3D] text-[#40E0D0] text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
            >
              <BookOpenCheck className="w-4 h-4" /> Cadastrar Turmas & Cursos
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* BOX DUPLICADO: SELETOR DE TURMAS EM LISTA SUSPENSA (ORGANIZADO)           */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#40E0D0]" />
              Selecione a Turma Cadastrada ({classes.length} cadastradas)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Escolha a turma na lista suspensa para registrar presenças e acompanhar a frequência dos estudantes.
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
                      {currentClass ? students.filter(s => {
                        const sClassIds = Array.isArray(s.classIds) && s.classIds.length > 0 ? s.classIds : (s.classId ? [s.classId] : []);
                        return sClassIds.includes(currentClass.id) || (s.className && s.className === currentClass.name);
                      }).length : 0} alunos
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
                      const stuCount = students.filter(s => {
                        const sClassIds = Array.isArray(s.classIds) && s.classIds.length > 0 ? s.classIds : (s.classId ? [s.classId] : []);
                        return sClassIds.includes(cls.id) || (s.className && s.className === cls.name);
                      }).length;
                      const ucsCount = curricularUnits.filter(u => 
                        u.classId === cls.id || 
                        u.additionalClassIds?.includes(cls.id) || 
                        (u.className && cls.name && u.className === cls.name)
                      ).length;

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
      {/* CABEÇALHO DEDICADO DO PAINEL DE REGISTRO DE PRESENÇA                      */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-[#002B5B] via-[#001D3D] to-[#0B132B] text-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-white/10 relative overflow-hidden space-y-4">
        
        {/* Decorative Backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#40E0D0]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#40E0D0]/20 text-[#40E0D0] border border-[#40E0D0]/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CalendarCheck2 className="w-3.5 h-3.5" />
                Diário de Classe & Frequência
              </span>
              {currentClass && (
                <span className="bg-[#40E0D0] text-[#002B5B] text-xs px-2.5 py-0.5 rounded-full font-black flex items-center gap-1 shadow-sm">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Turma: {currentClass.name}
                </span>
              )}
              {currentClass?.shift && (
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  Turno: {currentClass.shift}
                </span>
              )}
              {selectedUC && (
                <span className="bg-white/10 text-[#40E0D0] text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {selectedUC.code}
                </span>
              )}
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {institution.name || 'Unidade Escolar'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Painel de Registro de Presença {currentClass ? `— Turma ${currentClass.name}` : ''}
            </h1>
            <p className="text-xs text-slate-300">
              Visualizando e lançando chamadas com informações exclusivas da turma selecionada: <strong className="text-[#40E0D0]">{currentClass?.name || 'Nenhuma'}</strong>.
            </p>
          </div>

          {/* ===================================================================== */}
          {/* SELEÇÃO DA UC / DISCIPLINA                                            */}
          {/* ===================================================================== */}
          <div className="bg-[#00142A]/80 p-2.5 rounded-xl border border-[#ffffff15] shadow-inner shrink-0 w-full sm:w-72">
            <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
              UC / Disciplina:
            </label>
            <div className="relative">
              <select
                value={selectedUCId}
                onChange={(e) => setSelectedUCId(e.target.value)}
                className="w-full bg-[#002B5B] text-white text-xs font-bold rounded-lg px-2.5 py-2 border border-[#40E0D0]/40 outline-none focus:ring-2 focus:ring-[#40E0D0] hover:border-[#40E0D0] transition-colors cursor-pointer appearance-none pr-7 truncate"
              >
                {classDisciplines.length === 0 ? (
                  <option value="" className="bg-[#002B5B] text-slate-300">
                    Sem disciplinas
                  </option>
                ) : (
                  classDisciplines.map(uc => (
                    <option key={uc.id} value={uc.id} className="bg-[#002B5B] text-white">
                      {uc.code} - {uc.name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#40E0D0] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* ======================================================================= */}
        {/* INFORMAÇÕES TRANSFERIDAS DO PAINEL INDIVIDUAL DA TURMA:                 */}
        {/* FREQUÊNCIA GERAL E AULAS REGISTRADAS                                    */}
        {/* ======================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#ffffff15] relative z-10">
          <div className="bg-[#001D3D]/90 border border-[#ffffff15] rounded-xl p-3 shadow-inner">
            <span className="text-[11px] text-slate-300 font-medium block">Frequência Geral</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-[#40E0D0]">{attendanceStats.avgAttendance}%</span>
              <span className="text-[11px] text-slate-400">mín. {attendanceStats.minReq}%</span>
            </div>
          </div>

          <div className="bg-[#001D3D]/90 border border-[#ffffff15] rounded-xl p-3 shadow-inner">
            <span className="text-[11px] text-slate-300 font-medium block">Aulas Registradas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-emerald-400">{attendanceStats.totalLessons}h</span>
              <span className="text-[11px] text-slate-400">({attendanceStats.totalCalls} chamadas)</span>
            </div>
          </div>

          <div className="bg-[#001D3D]/90 border border-[#ffffff15] rounded-xl p-3 shadow-inner">
            <span className="text-[11px] text-slate-300 font-medium block">Frequência Regular</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-white">{attendanceStats.studentsRegular}</span>
              <span className="text-[11px] text-[#40E0D0] font-bold">de {attendanceStats.totalStudents} alunos</span>
            </div>
          </div>

          <div className="bg-[#001D3D]/90 border border-[#ffffff15] rounded-xl p-3 shadow-inner">
            <span className="text-[11px] text-slate-300 font-medium block">Alunos em Alerta/Risco</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-amber-400">{attendanceStats.studentsAtRisk + attendanceStats.studentsFailedByAbsence}</span>
              <span className="text-[11px] text-rose-300 font-medium">({attendanceStats.studentsFailedByAbsence} reprov.)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Feedback Message Banner */}
      {feedbackMessage && (
        <div className="p-3.5 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="p-1 hover:bg-emerald-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CARDS DE INDICADORES EXCLUSIVOS DE PRESENÇA (KPIS DE FREQUÊNCIA)          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Aulas & Chamadas Registradas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Aulas Registradas
            </span>
            <Clock className="w-4 h-4 text-[#002B5B] dark:text-[#40E0D0]" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {attendanceStats.totalLessons}h
            </span>
            <span className="text-xs text-slate-500">
              ({attendanceStats.totalCalls} chamadas)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            Total de aulas semestre: {selectedUC?.workloadHours || 80}h
          </p>
        </div>

        {/* KPI 2: Frequência Média da Turma */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Frequência Geral
            </span>
            <Percent className="w-4 h-4 text-[#40E0D0]" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {attendanceStats.avgAttendance}%
            </span>
            <span className="text-xs text-slate-500">
              (mín. {attendanceStats.minReq}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                Number(attendanceStats.avgAttendance) >= attendanceStats.minReq ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Number(attendanceStats.avgAttendance))}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Estudantes Regulares */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Frequência Regular
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {attendanceStats.studentsRegular}
            </span>
            <span className="text-xs text-slate-500">
              de {attendanceStats.totalStudents} alunos
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
            Cumprindo frequência ≥ {attendanceStats.minReq}%
          </p>
        </div>

        {/* KPI 4: Em Alerta / Risco de Reprovação por Falta */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Atenção & Risco
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {attendanceStats.studentsAtRisk + attendanceStats.studentsFailedByAbsence}
            </span>
            <span className="text-xs text-slate-500">
              ({attendanceStats.studentsFailedByAbsence} reprovados por falta)
            </span>
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
            Faltas acumuladas próximas ao limite
          </p>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* NAVEGAÇÃO DE ABAS EXCLUSIVAS DO PAINEL DE PRESENÇA                        */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          
          <button
            type="button"
            onClick={() => setCurrentAttendanceTab('nova-chamada')}
            className={`flex-1 min-w-[180px] px-4 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              currentAttendanceTab === 'nova-chamada'
                ? 'bg-[#002B5B] text-white shadow-md shadow-[#002B5B]/20 ring-2 ring-[#40E0D0]/50'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className={`w-4 h-4 ${currentAttendanceTab === 'nova-chamada' ? 'text-[#40E0D0]' : 'text-slate-400'}`} />
            <span>Lançar Nova Chamada</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentAttendanceTab('historico')}
            className={`flex-1 min-w-[180px] px-4 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              currentAttendanceTab === 'historico'
                ? 'bg-[#002B5B] text-white shadow-md shadow-[#002B5B]/20 ring-2 ring-[#40E0D0]/50'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className={`w-4 h-4 ${currentAttendanceTab === 'historico' ? 'text-[#40E0D0]' : 'text-slate-400'}`} />
            <span>Histórico de Chamadas</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              currentAttendanceTab === 'historico' ? 'bg-[#40E0D0]/20 text-[#40E0D0]' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {ucAttendanceHistory.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentAttendanceTab('quadro-geral')}
            className={`flex-1 min-w-[200px] px-4 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              currentAttendanceTab === 'quadro-geral'
                ? 'bg-[#002B5B] text-white shadow-md shadow-[#002B5B]/20 ring-2 ring-[#40E0D0]/50'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className={`w-4 h-4 ${currentAttendanceTab === 'quadro-geral' ? 'text-[#40E0D0]' : 'text-slate-400'}`} />
            <span>Quadro Geral de Frequência</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              currentAttendanceTab === 'quadro-geral' ? 'bg-[#40E0D0]/20 text-[#40E0D0]' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {ucStudents.length} Alunos
            </span>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: LANÇAR NOVA CHAMADA DO DIA                                         */}
      {/* ========================================================================= */}
      {currentAttendanceTab === 'nova-chamada' && (
        <form onSubmit={handleSaveAttendance} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md p-5 sm:p-6 space-y-6 animate-in fade-in duration-150">
          
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-[#40E0D0]" />
              Formulário de Registro de Chamada — Turma {currentClass?.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Informe os dados da aula ministrada e marque a presença individual de cada estudante da turma.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* SELEÇÃO DE UC / DISCIPLINA EM CHECKBOX PARA O PROFESSOR                   */}
          {/* ========================================================================= */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border-2 border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpenCheck className="w-4 h-4 text-[#002B5B] dark:text-[#40E0D0]" />
                  Escolha a UC / Disciplina desta Chamada:
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Marque nos checkboxes abaixo para qual disciplina esta chamada está sendo feita nesta turma.
                </p>
              </div>

              {classDisciplines.length > 1 && (
                <div className="flex items-center gap-1.5 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleSelectAllCallUcs(true)}
                    className="text-[10px] font-bold px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    Marcar Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllCallUcs(false)}
                    className="text-[10px] font-bold px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    Desmarcar
                  </button>
                </div>
              )}
            </div>

            {/* Checkbox Options Grid */}
            {classDisciplines.length === 0 ? (
              <div className="p-4 text-center bg-white dark:bg-slate-900 border border-dashed border-amber-300 dark:border-amber-700 rounded-xl space-y-1">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  Nenhuma Unidade Curricular vinculada a esta turma ({currentClass?.name}).
                </p>
                <p className="text-[11px] text-slate-500">
                  A chamada será registrada como frequência geral da turma.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {classDisciplines.map(uc => {
                  const isChecked = selectedCallUcIds.includes(uc.id);
                  return (
                    <div
                      key={uc.id}
                      onClick={() => handleToggleCallUc(uc.id)}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'bg-cyan-50/80 dark:bg-cyan-950/30 border-[#40E0D0] text-slate-900 dark:text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {/* Checkbox Box */}
                      <div className="pt-0.5 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-[#002B5B] dark:bg-[#40E0D0] border-[#002B5B] dark:border-[#40E0D0] text-[#40E0D0] dark:text-[#002B5B] shadow-xs'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* UC Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            isChecked
                              ? 'bg-[#002B5B] text-[#40E0D0] border-[#002B5B]'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {uc.code}
                          </span>
                          {uc.workloadHours && (
                            <span className="text-[10px] text-slate-400">
                              {uc.workloadHours}h
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-bold mt-1 line-clamp-2 ${isChecked ? 'text-[#002B5B] dark:text-[#40E0D0]' : 'text-slate-800 dark:text-slate-200'}`}>
                          {uc.name}
                        </p>
                        {uc.teacherName && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            Docente: {uc.teacherName}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Validation / Helper note */}
            {classDisciplines.length > 0 && (
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className={selectedCallUcIds.length === 0 ? 'text-rose-500 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                  {selectedCallUcIds.length === 0
                    ? '⚠️ Atenção: Nenhuma UC selecionada. Marque pelo menos um checkbox acima.'
                    : `✓ ${selectedCallUcIds.length} disciplina(s) marcada(s) para esta chamada.`}
                </span>
                <span className="text-slate-400 text-[10px]">
                  Pode selecionar uma ou mais disciplinas caso a aula seja integrada
                </span>
              </div>
            )}
          </div>

          {/* Dados Gerais da Aula */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#002B5B] dark:text-[#40E0D0]" /> Data da Aula:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setCallTrimester(getTrimesterFromDate(e.target.value));
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#40E0D0] outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-500" /> Trimestre Letivo:
              </label>
              <div className="grid grid-cols-3 gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-1 rounded-lg">
                {(['1º Trimestre', '2º Trimestre', '3º Trimestre'] as const).map(tri => (
                  <button
                    key={tri}
                    type="button"
                    onClick={() => setCallTrimester(tri)}
                    className={`py-1.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                      callTrimester === tri
                        ? tri === '1º Trimestre'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : tri === '2º Trimestre'
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tri.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Qtd. Aulas / Horas:
              </label>
              <select
                value={lessonCount}
                onChange={(e) => setLessonCount(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#40E0D0] outline-none cursor-pointer"
              >
                <option value={1}>1 Aula / Hora</option>
                <option value={2}>2 Aulas / Horas</option>
                <option value={3}>3 Aulas / Horas</option>
                <option value={4}>4 Aulas / Horas</option>
                <option value={5}>5 Aulas / Horas</option>
                <option value={6}>6 Aulas / Horas</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-500" /> Conteúdo Ministrado:
              </label>
              <input
                type="text"
                placeholder="Ex: Teoria de algoritmos, exercícios práticos e revisão..."
                value={contentTaught}
                onChange={(e) => setContentTaught(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#40E0D0] outline-none"
                required
              />
            </div>
          </div>

          {/* Lista de Alunos para a Chamada */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  Lista de Chamada ({ucStudents.length} Estudantes)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Clique nos botões para alternar a frequência de cada aluno nesta aula.
                </p>
              </div>

              {/* Botões Rápidos de Ação Coletiva */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => toggleAllPresences(true)}
                  className="px-2.5 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Todos Presentes
                </button>
                <button
                  type="button"
                  onClick={() => toggleAllPresences(false)}
                  className="px-2.5 py-1.5 text-xs font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  Todos Ausentes
                </button>
                <button
                  type="button"
                  onClick={invertAllPresences}
                  className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title="Inverter seleção de presença"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Inverter
                </button>
              </div>
            </div>

            {/* Campo de Busca Rápida de Aluno */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Localizar estudante por nome ou RA..."
                value={searchTermStudent}
                onChange={(e) => setSearchTermStudent(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#40E0D0]"
              />
            </div>

            {/* Grid de Estudantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto pr-1">
              {filteredStudentsForCall.length === 0 ? (
                <div className="col-span-full py-8 px-4 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <Users className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
                    {searchTermStudent.trim() 
                      ? 'Nenhum estudante encontrado com o termo pesquisado.' 
                      : `Nenhum estudante matriculado na turma ${currentClass ? currentClass.name : ''}.`}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {searchTermStudent.trim() 
                      ? 'Tente buscar por outro nome ou registro acadêmico.' 
                      : 'Cadastre estudantes vinculados a esta turma para realizar a chamada.'}
                  </p>
                </div>
              ) : (
                filteredStudentsForCall.map(student => {
                  const isPresent = studentPresences[student.id] ?? true;
                  const studentRes = computedResults.find(r => r.studentId === student.id);
                  const currentPct = studentRes?.attendancePercentage ?? 100;

                  return (
                  <div
                    key={student.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isPresent
                        ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/60 shadow-xs'
                        : 'bg-rose-50/60 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/60 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {student.fullName}
                          </p>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border shrink-0 ${getStatusBadgeStyle(student.status)}`}>
                            {getStatusAbbreviation(student.status)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          RA: {student.academicRegistration} • Frequência: <strong className={currentPct >= (institution.minAttendancePercentage || 75) ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{currentPct}%</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setStudentPresences(prev => ({ ...prev, [student.id]: true }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          isPresent
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-100 hover:text-emerald-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Presente
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudentPresences(prev => ({ ...prev, [student.id]: false }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          !isPresent
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-100 hover:text-rose-800'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Ausente
                      </button>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          {/* Salvar Chamada */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Presentes selecionados: <strong>{ucStudents.filter(s => studentPresences[s.id] ?? true).length}</strong> de {ucStudents.length}
            </span>
            <button
              type="submit"
              className="px-6 py-3 bg-[#002B5B] hover:bg-[#001D3D] text-[#40E0D0] font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5 text-[#40E0D0]" /> Salvar Registro de Presença
            </button>
          </div>

        </form>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: HISTÓRICO DE CHAMADAS                                              */}
      {/* ========================================================================= */}
      {currentAttendanceTab === 'historico' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md p-5 sm:p-6 space-y-4 animate-in fade-in duration-150">
          {/* Top Bar: Title, Search, Date Picker, and Calendar Toggle Button */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#40E0D0]" />
                Histórico de Aulas e Chamadas ({filteredHistory.length})
              </h2>
              <p className="text-xs text-slate-500">
                Visualização detalhada de todas as aulas registradas na turma {currentClass?.name}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Text Search Input */}
              <div className="relative flex-1 sm:w-64 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por tema ou conteúdo..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#40E0D0]"
                />
                {historySearch && (
                  <button
                    type="button"
                    onClick={() => setHistorySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    title="Limpar texto de busca"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Direct Date Picker Input */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-[#40E0D0]">
                <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-[#40E0D0] shrink-0" />
                <input
                  type="date"
                  value={historyDateFilter}
                  onChange={(e) => handleDateSelect(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                  title="Selecionar data específica para procurar aula"
                />
                {historyDateFilter && (
                  <button
                    type="button"
                    onClick={() => setHistoryDateFilter('')}
                    className="p-0.5 text-slate-400 hover:text-rose-500 rounded transition-colors"
                    title="Limpar filtro de data"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Interactive Calendar Toggle Button */}
              <button
                type="button"
                onClick={() => setIsCalendarOpen(prev => !prev)}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                  isCalendarOpen || historyDateFilter
                    ? 'bg-[#002B5B] text-[#40E0D0] ring-2 ring-[#40E0D0]/60 shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
                title="Abrir ou fechar o calendário interativo de aulas"
              >
                <Calendar className="w-4 h-4 text-[#40E0D0]" />
                <span>{isCalendarOpen ? 'Ocultar Calendário' : 'Calendário de Aulas'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#40E0D0]/20 text-[#40E0D0] font-mono">
                  {datesWithClasses.size} dias
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCalendarOpen ? 'rotate-180 text-[#40E0D0]' : 'text-slate-400'}`} />
              </button>
            </div>
          </div>

          {/* BARRA DE FILTRO / ORGANIZAÇÃO POR TRIMESTRE */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-500" />
              Filtrar por Trimestre:
            </span>

            <button
              type="button"
              onClick={() => setAttendanceTrimesterFilter('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                attendanceTrimesterFilter === 'todos'
                  ? 'bg-[#002B5B] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Todos os Trimestres ({ucAttendanceHistory.length})
            </button>

            <button
              type="button"
              onClick={() => setAttendanceTrimesterFilter('1º Trimestre')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                attendanceTrimesterFilter === '1º Trimestre'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              1º Trimestre ({ucAttendanceHistory.filter(h => (h.trimester || getTrimesterFromDate(h.date)) === '1º Trimestre').length})
            </button>

            <button
              type="button"
              onClick={() => setAttendanceTrimesterFilter('2º Trimestre')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                attendanceTrimesterFilter === '2º Trimestre'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              2º Trimestre ({ucAttendanceHistory.filter(h => (h.trimester || getTrimesterFromDate(h.date)) === '2º Trimestre').length})
            </button>

            <button
              type="button"
              onClick={() => setAttendanceTrimesterFilter('3º Trimestre')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                attendanceTrimesterFilter === '3º Trimestre'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              3º Trimestre ({ucAttendanceHistory.filter(h => (h.trimester || getTrimesterFromDate(h.date)) === '3º Trimestre').length})
            </button>
          </div>

          {/* ========================================================================= */}
          {/* CALENDÁRIO INTERATIVO DE AULAS PELA DATA                                  */}
          {/* ========================================================================= */}
          {isCalendarOpen && (
            <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50 to-white dark:from-slate-850 dark:to-slate-900 border-2 border-[#40E0D0]/40 rounded-2xl shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Calendar Header: Month/Year navigation and quick action buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#002B5B] text-[#40E0D0] rounded-xl shadow-xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">
                      {monthNamesPt[calendarViewDate.getMonth()]} de {calendarViewDate.getFullYear()}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Clique em qualquer dia para filtrar e localizar as aulas daquela data.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Mês anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleTodayMonth}
                    className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#002B5B] dark:text-[#40E0D0] border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Ir para o dia de hoje"
                  >
                    Hoje
                  </button>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Próximo mês"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {historyDateFilter && (
                    <button
                      type="button"
                      onClick={() => setHistoryDateFilter('')}
                      className="px-2.5 py-1 text-xs font-bold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Ver todas as aulas de todas as datas"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Ver Todas as Datas
                    </button>
                  )}
                </div>
              </div>

              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span className="text-rose-500">Dom</span>
                <span>Seg</span>
                <span>Ter</span>
                <span>Qua</span>
                <span>Qui</span>
                <span>Sex</span>
                <span className="text-cyan-600 dark:text-cyan-400">Sáb</span>
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarDays.map((day, idx) => {
                  const hasClasses = day.records.length > 0;
                  const isSelected = historyDateFilter === day.dateStr;
                  const totalLessonsOnDay = day.records.reduce((acc, c) => acc + (c.lessonCount || 1), 0);

                  return (
                    <button
                      key={`${day.dateStr}-${idx}`}
                      type="button"
                      onClick={() => handleDateSelect(day.dateStr)}
                      className={`relative min-h-[58px] sm:min-h-[68px] p-1.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer group ${
                        isSelected
                          ? 'bg-[#002B5B] text-white border-[#40E0D0] shadow-md ring-2 ring-[#40E0D0] z-10'
                          : hasClasses
                          ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-800 hover:border-[#40E0D0] hover:bg-cyan-100/60 dark:hover:bg-cyan-900/40 text-slate-800 dark:text-slate-100'
                          : day.isCurrentMonth
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                          : 'bg-slate-50/50 dark:bg-slate-900/40 border-transparent text-slate-400 dark:text-slate-600 opacity-60'
                      }`}
                      title={
                        hasClasses
                          ? `${day.records.length} aula(s) registrada(s) no dia ${new Date(day.dateStr + 'T00:00:00').toLocaleDateString('pt-BR')}`
                          : `Nenhuma aula no dia ${new Date(day.dateStr + 'T00:00:00').toLocaleDateString('pt-BR')}`
                      }
                    >
                      {/* Day Number and Today indicator */}
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-bold font-mono ${
                          isSelected
                            ? 'text-[#40E0D0]'
                            : hasClasses
                            ? 'text-[#002B5B] dark:text-[#40E0D0] font-black'
                            : ''
                        }`}>
                          {day.dayNumber}
                        </span>

                        {day.isToday && (
                          <span className={`text-[9px] px-1 py-0.2 rounded font-extrabold uppercase ${
                            isSelected
                              ? 'bg-[#40E0D0] text-[#002B5B]'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                          }`}>
                            Hoje
                          </span>
                        )}
                      </div>

                      {/* Class Badge for Days with Attendance Records */}
                      {hasClasses ? (
                        <div className="mt-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 w-full truncate ${
                            isSelected
                              ? 'bg-[#40E0D0]/20 text-[#40E0D0] border border-[#40E0D0]/50'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span className="truncate">
                              {day.records.length} {day.records.length === 1 ? 'aula' : 'aulas'} ({totalLessonsOnDay}h)
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="h-4"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Calendar Footer / Legend */}
              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-500 gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-md bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-400"></span>
                    Dia com aula registrada
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-md bg-[#002B5B] border border-[#40E0D0]"></span>
                    Dia selecionado no filtro
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-md bg-amber-100 border border-amber-400"></span>
                    Dia de hoje
                  </span>
                </div>

                {historyDateFilter && (
                  <span className="font-bold text-[#002B5B] dark:text-[#40E0D0]">
                    ✓ Mostrando aulas de: {new Date(historyDateFilter + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Active Filter Indicators Banner */}
          {(historyDateFilter || historySearch) && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-cyan-50/80 dark:bg-cyan-950/40 border border-[#40E0D0]/40 rounded-xl text-xs animate-in fade-in">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  Filtros Ativos:
                </span>

                {historyDateFilter && (
                  <span className="bg-[#002B5B] text-[#40E0D0] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 shadow-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    Data: {new Date(historyDateFilter + 'T00:00:00').toLocaleDateString('pt-BR')}
                    <button
                      type="button"
                      onClick={() => setHistoryDateFilter('')}
                      className="hover:text-white p-0.5 cursor-pointer"
                      title="Remover filtro desta data"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {historySearch && (
                  <span className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5" />
                    "{historySearch}"
                    <button
                      type="button"
                      onClick={() => setHistorySearch('')}
                      className="hover:text-rose-500 p-0.5 cursor-pointer"
                      title="Remover termo de busca"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setHistoryDateFilter('');
                  setHistorySearch('');
                }}
                className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300 hover:underline cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}

          <div className="space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2">
                <CalendarCheck2 className="w-10 h-10 mx-auto text-slate-400" />
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  {historyDateFilter
                    ? `Nenhuma aula gravada no dia ${new Date(historyDateFilter + 'T00:00:00').toLocaleDateString('pt-BR')}.`
                    : `Nenhuma aula gravada no histórico para ${attendanceTrimesterFilter === 'todos' ? 'esta turma' : attendanceTrimesterFilter}.`}
                </p>
                {historyDateFilter ? (
                  <button
                    type="button"
                    onClick={() => setHistoryDateFilter('')}
                    className="px-3 py-1.5 text-xs font-bold bg-[#002B5B] text-[#40E0D0] rounded-lg shadow-xs hover:bg-[#001D3D] transition-colors cursor-pointer"
                  >
                    Ver todas as aulas da turma
                  </button>
                ) : (
                  <p>Clique na aba <strong>Lançar Nova Chamada</strong> para registrar uma nova aula.</p>
                )}
              </div>
            ) : (
              filteredHistory.map(rec => {
                const totalStudentsInCall = Object.keys(rec.presences || {}).length;
                const presenceCount = Object.values(rec.presences || {}).filter(Boolean).length;
                const absenceCount = totalStudentsInCall - presenceCount;
                const rate = totalStudentsInCall > 0 ? Math.round((presenceCount / totalStudentsInCall) * 100) : 0;
                const recTrimester = rec.trimester || getTrimesterFromDate(rec.date);

                return (
                  <div
                    key={rec.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#40E0D0] transition-colors shadow-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {curricularUnits.find(u => u.id === rec.ucId) && (
                          <span className="text-[11px] font-mono font-bold bg-[#002B5B] text-[#40E0D0] px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
                            <BookOpenCheck className="w-3 h-3" />
                            {curricularUnits.find(u => u.id === rec.ucId)?.code} - {curricularUnits.find(u => u.id === rec.ucId)?.name}
                          </span>
                        )}
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                          recTrimester === '1º Trimestre'
                            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                            : recTrimester === '2º Trimestre'
                            ? 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                        }`}>
                          {recTrimester}
                        </span>
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-[#40E0D0]" />
                          {new Date(rec.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs font-bold text-[#002B5B] dark:text-[#40E0D0] bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rec.lessonCount} Aulas / Horas
                        </span>
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded ${
                          rate >= 75
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {rate}% Presença
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 pt-0.5">
                        {rec.contentTaught}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Presentes: <strong className="text-emerald-600 dark:text-emerald-400">{presenceCount}</strong> • Faltas: <strong className="text-rose-600 dark:text-rose-400">{absenceCount}</strong> de {totalStudentsInCall} alunos
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(rec)}
                        className="px-3 py-1.5 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 rounded-lg transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="Editar registro de presença, conteúdo e chamada"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => setRecordToDelete(rec)}
                        className="px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-700 border border-rose-300 dark:border-rose-800 rounded-lg transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="Excluir este registro de aula"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: QUADRO GERAL DE FREQUÊNCIA DA TURMA (MAPA CONSOLIDADO / POR TRIMESTRE) */}
      {/* ========================================================================= */}
      {currentAttendanceTab === 'quadro-geral' && (() => {
        const isAllTrimesters = attendanceTrimesterFilter === 'todos';
        const activeHistory = isAllTrimesters
          ? ucAttendanceHistory
          : ucAttendanceHistory.filter(rec => (rec.trimester || getTrimesterFromDate(rec.date)) === attendanceTrimesterFilter);

        const activeLessonsCount = activeHistory.reduce((acc, r) => acc + (r.lessonCount || 1), 0);

        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md p-5 sm:p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#40E0D0]" />
                  Quadro Geral de Frequência {isAllTrimesters ? 'Consolidado' : `- ${attendanceTrimesterFilter}`}
                </h2>
                <p className="text-xs text-slate-500">
                  Acompanhamento de presenças acumuladas, total de faltas e taxa percentual por estudante na turma {currentClass ? currentClass.name : ''}.
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  Aulas Ministradas ({isAllTrimesters ? 'Ano / Semestre' : attendanceTrimesterFilter}): <strong>{activeLessonsCount}h</strong>
                </span>
                <span className="text-[11px] text-slate-400">
                  Critério de Aprovação: Mínimo <strong>{attendanceStats.minReq}%</strong> de presença
                </span>
              </div>
            </div>

            {/* Barra de Filtro / Organização por Trimestre */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mr-1">
                <Calendar className="w-3.5 h-3.5 text-[#40E0D0]" /> Organizar Frequência por Trimestre:
              </span>
              {(['todos', '1º Trimestre', '2º Trimestre', '3º Trimestre'] as const).map(tri => {
                const isActive = attendanceTrimesterFilter === tri;
                const triHistoryCount = tri === 'todos'
                  ? ucAttendanceHistory.length
                  : ucAttendanceHistory.filter(r => (r.trimester || getTrimesterFromDate(r.date)) === tri).length;

                return (
                  <button
                    key={tri}
                    type="button"
                    onClick={() => setAttendanceTrimesterFilter(tri)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#002B5B] text-white shadow-xs dark:bg-cyan-600 dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tri === 'todos' ? 'Todos os Trimestres (Consolidado)' : tri}
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white dark:bg-slate-900/30 dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {triHistoryCount} {triHistoryCount === 1 ? 'chamada' : 'chamadas'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#002B5B] text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Estudante</th>
                    <th className="py-3 px-3">RA</th>
                    <th className="py-3 px-3 text-center">Aulas Registradas</th>
                    <th className="py-3 px-3 text-center text-emerald-300">Presenças</th>
                    <th className="py-3 px-3 text-center text-rose-300">Faltas</th>
                    <th className="py-3 px-3 text-center">% Frequência</th>
                    {isAllTrimesters && (
                      <th className="py-3 px-3 text-center">Frequência por Trimestre</th>
                    )}
                    <th className="py-3 px-4 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ucStudents.length === 0 ? (
                    <tr>
                      <td colSpan={isAllTrimesters ? 8 : 7} className="py-8 text-center text-xs text-slate-400 italic">
                        Nenhum estudante matriculado na turma {currentClass ? currentClass.name : ''}.
                      </td>
                    </tr>
                  ) : (
                    ucStudents.map(student => {
                      let presencesHours = 0;
                      let absencesHours = 0;

                      activeHistory.forEach(rec => {
                        const isPres = rec.presences?.[student.id] ?? true;
                        const hours = rec.lessonCount || 1;
                        if (isPres) {
                          presencesHours += hours;
                        } else {
                          absencesHours += hours;
                        }
                      });

                      const totalHours = presencesHours + absencesHours;
                      const studentRes = computedResults.find(r => r.studentId === student.id);
                      const currentPct = totalHours > 0 
                        ? Math.round((presencesHours / totalHours) * 100) 
                        : (studentRes?.attendancePercentage ?? 100);
                      const minReq = attendanceStats.minReq;

                      const isRegular = currentPct >= minReq;
                      const isAtRisk = currentPct >= minReq - 5 && currentPct < minReq;
                      const isReprovado = currentPct < minReq;

                      return (
                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <img
                              src={student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100">{student.fullName}</p>
                              <p className="text-[10px] text-slate-400">{student.email || 'Sem e-mail cadastrado'}</p>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                            {student.academicRegistration}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                            {totalHours > 0 ? `${totalHours}h` : `${activeLessonsCount}h`}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                            {presencesHours}h
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-rose-600 dark:text-rose-400">
                            {absencesHours}h
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`font-black text-xs px-2 py-0.5 rounded ${
                              isRegular
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : isAtRisk
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {currentPct}%
                            </span>
                          </td>
                          {isAllTrimesters && (
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold">
                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700" title="1º Trimestre">
                                  1ºT: <strong className="text-cyan-700 dark:text-cyan-300">{studentRes?.trimesterStats?.['1º Trimestre']?.attendancePercentage ?? 100}%</strong>
                                </span>
                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700" title="2º Trimestre">
                                  2ºT: <strong className="text-cyan-700 dark:text-cyan-300">{studentRes?.trimesterStats?.['2º Trimestre']?.attendancePercentage ?? 100}%</strong>
                                </span>
                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700" title="3º Trimestre">
                                  3ºT: <strong className="text-cyan-700 dark:text-cyan-300">{studentRes?.trimesterStats?.['3º Trimestre']?.attendancePercentage ?? 100}%</strong>
                                </span>
                              </div>
                            </td>
                          )}
                          <td className="py-3 px-4 text-center">
                            {isRegular && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Frequência Regular
                              </span>
                            )}
                            {isAtRisk && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                                <AlertCircle className="w-3 h-3" /> Em Alerta / Risco
                              </span>
                            )}
                            {isReprovado && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                                <XCircle className="w-3 h-3" /> Reprovado por Faltas
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
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL DE EDIÇÃO DE CHAMADA                                                */}
      {/* ========================================================================= */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-5 my-8 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/50 text-[#002B5B] dark:text-[#40E0D0] rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Editar Registro de Presença
                    <span className="text-xs font-mono font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
                      {curricularUnits.find(u => u.id === editingRecord.ucId)?.code || selectedUC?.code || 'Geral'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Modifique a data, o trimestre, a quantidade de aulas, o conteúdo ministrado e a chamada individual dos alunos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="edit-attendance-form" onSubmit={handleSaveEdit} className="space-y-5 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#40E0D0]" /> Data da Aula:
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => {
                      setEditDate(e.target.value);
                      if (e.target.value) {
                        setEditTrimester(getTrimesterFromDate(e.target.value));
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#40E0D0] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Trimestre:
                  </label>
                  <select
                    value={editTrimester}
                    onChange={(e) => setEditTrimester(e.target.value as '1º Trimestre' | '2º Trimestre' | '3º Trimestre')}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#40E0D0] outline-none"
                  >
                    <option value="1º Trimestre">1º Trimestre</option>
                    <option value="2º Trimestre">2º Trimestre</option>
                    <option value="3º Trimestre">3º Trimestre</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> Qtd. de Aulas:
                  </label>
                  <select
                    value={editLessonCount}
                    onChange={(e) => setEditLessonCount(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#40E0D0] outline-none"
                  >
                    <option value={1}>1 Aula / Hora</option>
                    <option value={2}>2 Aulas / Horas</option>
                    <option value={3}>3 Aulas / Horas</option>
                    <option value={4}>4 Aulas / Horas</option>
                    <option value={6}>6 Aulas / Horas</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" /> Conteúdo Ministrado:
                  </label>
                  <input
                    type="text"
                    value={editContentTaught}
                    onChange={(e) => setEditContentTaught(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#40E0D0] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between p-3 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-800/60 text-xs">
                <span>Presentes: <strong className="text-emerald-600">{editPresencesCount}</strong> | Ausentes: <strong className="text-rose-600">{editAbsencesCount}</strong></span>
                <span className="font-bold text-[#002B5B] dark:text-[#40E0D0]">{editAttendancePercent}% de Presença</span>
              </div>

              {/* Edit student list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredEditStudents.map(student => {
                  const isPresent = editStudentPresences[student.id] ?? true;
                  return (
                    <div
                      key={student.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                        isPresent
                          ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20'
                          : 'bg-rose-50/60 border-rose-200 dark:bg-rose-950/20'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">{student.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">RA: {student.academicRegistration}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditStudentPresences(prev => ({ ...prev, [student.id]: true }))}
                          className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                            isPresent ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                          }`}
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditStudentPresences(prev => ({ ...prev, [student.id]: false }))}
                          className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                            !isPresent ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                          }`}
                        >
                          F
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </form>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setRecordToDelete(editingRecord)}
                className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-300 dark:border-rose-800 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Excluir este registro de chamada do histórico"
              >
                <Trash2 className="w-4 h-4" /> Excluir Chamada
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="edit-attendance-form"
                  className="px-5 py-2 bg-[#002B5B] hover:bg-[#001D3D] text-[#40E0D0] font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Salvar Alterações
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE CHAMADA DO HISTÓRICO                  */}
      {/* ========================================================================= */}
      {recordToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Excluir Registro de Chamada?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta ação removerá permanentemente esta aula do histórico.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Data da Aula:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {new Date(recordToDelete.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Carga Horária:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {recordToDelete.lessonCount} Aulas / Horas
                </span>
              </div>
              {curricularUnits.find(u => u.id === recordToDelete.ucId) && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Disciplina:</span>
                  <span className="font-bold text-[#002B5B] dark:text-[#40E0D0] truncate max-w-[220px]">
                    {curricularUnits.find(u => u.id === recordToDelete.ucId)?.code} - {curricularUnits.find(u => u.id === recordToDelete.ucId)?.name}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-500 font-medium block">Conteúdo:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 mt-0.5">
                  {recordToDelete.contentTaught}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/60 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                As presenças e faltas desta chamada serão removidas e a porcentagem de frequência dos estudantes da turma será recalculada automaticamente.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAttendanceRecord(recordToDelete.id);
                  if (editingRecord?.id === recordToDelete.id) {
                    setEditingRecord(null);
                  }
                  setRecordToDelete(null);
                  setFeedbackMessage('✅ Registro de presença excluído com sucesso do histórico!');
                  setTimeout(() => setFeedbackMessage(null), 3500);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Sim, Excluir Registro
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
