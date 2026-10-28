import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpenCheck,
  Plus,
  Trash2,
  Edit2,
  Search,
  Users,
  GraduationCap,
  X,
  Save,
  Check,
  School,
  BookOpen,
  Lock,
  Eye,
  ArrowRight,
  GripVertical,
  Move,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  CheckCircle2,
  Calendar,
  Clock
} from 'lucide-react';
import { CurricularUnit } from '../../types';
import { MultiSelectDropdown, MultiSelectOption, SemesterCheckboxes, defaultSemesterApplicationOptions, getDefaultLessonsForStage } from '../Common/MultiSelectDropdown';

interface DisciplineManagerProps {
  setActiveTab?: (tab: string) => void;
}

export const DisciplineManager: React.FC<DisciplineManagerProps> = ({ setActiveTab }) => {
  const {
    currentUser,
    curricularUnits,
    addCurricularUnit,
    updateCurricularUnit,
    deleteCurricularUnit,
    reorderCurricularUnits,
    courses,
    classes,
    users,
    selectedUC,
    setSelectedUCId
  } = useApp();

  const isProfessor = currentUser.role === 'professor';
  const teachers = users.filter(u => u.role === 'professor');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Drag & Drop & Reorder State
  const [draggedUCId, setDraggedUCId] = useState<string | null>(null);
  const [dragOverUCId, setDragOverUCId] = useState<string | null>(null);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedUCId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverUCId !== id) {
      setDragOverUCId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedUCId || draggedUCId === targetId) {
      setDraggedUCId(null);
      setDragOverUCId(null);
      return;
    }

    const sourceIndex = curricularUnits.findIndex(u => u.id === draggedUCId);
    const targetIndex = curricularUnits.findIndex(u => u.id === targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const updatedUCs = [...curricularUnits];
      const [movedItem] = updatedUCs.splice(sourceIndex, 1);
      updatedUCs.splice(targetIndex, 0, movedItem);

      reorderCurricularUnits(updatedUCs);
      setReorderSuccessMsg(`Disciplina "${movedItem.name}" reposicionada para a posição #${targetIndex + 1}.`);
      setTimeout(() => setReorderSuccessMsg(null), 3500);
    }

    setDraggedUCId(null);
    setDragOverUCId(null);
  };

  const handleDragEnd = () => {
    setDraggedUCId(null);
    setDragOverUCId(null);
  };

  const moveUCStep = (id: string, direction: 'up' | 'down') => {
    const currentIndex = curricularUnits.findIndex(u => u.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= curricularUnits.length) return;

    const updatedUCs = [...curricularUnits];
    const [movedItem] = updatedUCs.splice(currentIndex, 1);
    updatedUCs.splice(targetIndex, 0, movedItem);

    reorderCurricularUnits(updatedUCs);
    setReorderSuccessMsg(`Disciplina "${movedItem.name}" movida para a posição #${targetIndex + 1}.`);
    setTimeout(() => setReorderSuccessMsg(null), 3000);
  };

  const handleSortUCs = (criteria: 'name-asc' | 'name-desc' | 'code-asc' | 'workload') => {
    const sorted = [...curricularUnits].sort((a, b) => {
      if (criteria === 'name-asc') return a.name.localeCompare(b.name);
      if (criteria === 'name-desc') return b.name.localeCompare(a.name);
      if (criteria === 'code-asc') return a.code.localeCompare(b.code);
      if (criteria === 'workload') return (b.workloadHours || 0) - (a.workloadHours || 0);
      return 0;
    });
    reorderCurricularUnits(sorted);
    setReorderSuccessMsg('Sequência de disciplinas reorganizada com sucesso.');
    setTimeout(() => setReorderSuccessMsg(null), 3000);
  };

  // Form State: Add UC
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState(
    currentUser.role === 'professor' ? currentUser.id : (teachers[0]?.id || '')
  );
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(courses[0]?.id ? [courses[0].id] : []);
  const [additionalClassIds, setAdditionalClassIds] = useState<string[]>([]);
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>(['1º Semestre']);
  const [trimester, setTrimester] = useState('Semestral');
  const [periodLessons, setPeriodLessons] = useState<Record<string, number>>({ '1º Semestre': 80 });
  const [workloadHours, setWorkloadHours] = useState(80);

  // Edit UC State
  const [editingUC, setEditingUC] = useState<CurricularUnit | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editCourseIds, setEditCourseIds] = useState<string[]>([]);
  const [editAdditionalClassIds, setEditAdditionalClassIds] = useState<string[]>([]);
  const [editSelectedSemesters, setEditSelectedSemesters] = useState<string[]>([]);
  const [editTrimester, setEditTrimester] = useState('');
  const [editPeriodLessons, setEditPeriodLessons] = useState<Record<string, number>>({});
  const [editWorkloadHours, setEditWorkloadHours] = useState(80);

  // Handlers for dynamic stage lessons
  const handleSelectedSemestersChange = (newSelected: string[]) => {
    setSelectedSemesters(newSelected);
    const updated = { ...periodLessons };
    newSelected.forEach(s => {
      if (updated[s] === undefined || updated[s] <= 0) {
        updated[s] = getDefaultLessonsForStage(s);
      }
    });
    setPeriodLessons(updated);
    const validStages = newSelected.filter(s => !s.includes('Anual'));
    const sum = validStages.length > 0
      ? validStages.reduce((acc, s) => acc + (updated[s] ?? getDefaultLessonsForStage(s)), 0)
      : (newSelected.some(s => s.includes('Anual')) ? (updated['Anual (Ano Letivo Completo)'] ?? 120) : 80);
    setWorkloadHours(sum > 0 ? sum : 80);
  };

  const handlePeriodLessonChange = (stage: string, val: number) => {
    const updated = { ...periodLessons, [stage]: val };
    setPeriodLessons(updated);
    const validStages = selectedSemesters.filter(s => !s.includes('Anual'));
    const sum = validStages.length > 0
      ? validStages.reduce((acc, s) => acc + (s === stage ? val : (updated[s] ?? getDefaultLessonsForStage(s))), 0)
      : (selectedSemesters.some(s => s.includes('Anual')) ? (updated['Anual (Ano Letivo Completo)'] ?? 120) : 80);
    setWorkloadHours(sum > 0 ? sum : 80);
  };

  const handleTrimesterChange = (newTrimester: string) => {
    setTrimester(newTrimester);
    if (newTrimester === 'Trimestral') {
      handleSelectedSemestersChange(['1° Trimestre', '2° Trimestre', '3° Trimestre']);
    } else if (newTrimester === 'Semestral') {
      handleSelectedSemestersChange(['1º Semestre', '2º Semestre']);
    } else if (newTrimester === 'Anual') {
      handleSelectedSemestersChange(['Anual (Ano Letivo Completo)']);
    } else if (['1º Trimestre', '1° Trimestre'].includes(newTrimester)) {
      handleSelectedSemestersChange(['1° Trimestre']);
    } else if (['2º Trimestre', '2° Trimestre'].includes(newTrimester)) {
      handleSelectedSemestersChange(['2° Trimestre']);
    } else if (['3º Trimestre', '3° Trimestre'].includes(newTrimester)) {
      handleSelectedSemestersChange(['3° Trimestre']);
    }
  };

  const handleEditSelectedSemestersChange = (newSelected: string[]) => {
    setEditSelectedSemesters(newSelected);
    const updated = { ...editPeriodLessons };
    newSelected.forEach(s => {
      if (updated[s] === undefined || updated[s] <= 0) {
        updated[s] = getDefaultLessonsForStage(s);
      }
    });
    setEditPeriodLessons(updated);
    const validStages = newSelected.filter(s => !s.includes('Anual'));
    const sum = validStages.length > 0
      ? validStages.reduce((acc, s) => acc + (updated[s] ?? getDefaultLessonsForStage(s)), 0)
      : (newSelected.some(s => s.includes('Anual')) ? (updated['Anual (Ano Letivo Completo)'] ?? 120) : 80);
    setEditWorkloadHours(sum > 0 ? sum : 80);
  };

  const handleEditPeriodLessonChange = (stage: string, val: number) => {
    const updated = { ...editPeriodLessons, [stage]: val };
    setEditPeriodLessons(updated);
    const validStages = editSelectedSemesters.filter(s => !s.includes('Anual'));
    const sum = validStages.length > 0
      ? validStages.reduce((acc, s) => acc + (s === stage ? val : (updated[s] ?? getDefaultLessonsForStage(s))), 0)
      : (editSelectedSemesters.some(s => s.includes('Anual')) ? (updated['Anual (Ano Letivo Completo)'] ?? 120) : 80);
    setEditWorkloadHours(sum > 0 ? sum : 80);
  };

  const handleEditTrimesterChange = (newTrimester: string) => {
    setEditTrimester(newTrimester);
    if (newTrimester === 'Trimestral') {
      handleEditSelectedSemestersChange(['1° Trimestre', '2° Trimestre', '3° Trimestre']);
    } else if (newTrimester === 'Semestral') {
      handleEditSelectedSemestersChange(['1º Semestre', '2º Semestre']);
    } else if (newTrimester === 'Anual') {
      handleEditSelectedSemestersChange(['Anual (Ano Letivo Completo)']);
    } else if (['1º Trimestre', '1° Trimestre'].includes(newTrimester)) {
      handleEditSelectedSemestersChange(['1° Trimestre']);
    } else if (['2º Trimestre', '2° Trimestre'].includes(newTrimester)) {
      handleEditSelectedSemestersChange(['2° Trimestre']);
    } else if (['3º Trimestre', '3° Trimestre'].includes(newTrimester)) {
      handleEditSelectedSemestersChange(['3° Trimestre']);
    }
  };

  // Options for courses & classes
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

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProfessor) return; // Prevent creating if professor
    if (!code.trim() || !name.trim()) return;

    const teacherObj = users.find(u => u.id === teacherId);
    const selectedCourses = courses.filter(c => selectedCourseIds.includes(c.id));
    const primaryCourse = selectedCourses[0] || courses[0];
    const addCourseObjs = selectedCourses.filter(c => c.id !== primaryCourse?.id);
    const addClassObjs = classes.filter(cls => additionalClassIds.includes(cls.id));
    const firstClass = addClassObjs[0];

    const newUCId = `uc-${Date.now()}`;
    const semesterStr = selectedSemesters.length > 0 ? selectedSemesters.join(', ') : '1º Semestre';
    const newUC: CurricularUnit = {
      id: newUCId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      teacherId: teacherObj?.id || '',
      teacherName: teacherObj?.name || '',
      teacherRegistration: teacherObj?.registration || '',
      courseId: primaryCourse?.id || '',
      courseName: primaryCourse?.name || '',
      additionalCourseIds: addCourseObjs.map(c => c.id),
      additionalCourseNames: addCourseObjs.map(c => c.name),
      classId: firstClass?.id || '',
      className: firstClass?.name || (addClassObjs.length > 0 ? addClassObjs.map(c => c.name).join(', ') : 'Todas as Turmas'),
      additionalClassIds,
      additionalClassNames: addClassObjs.map(cls => cls.name),
      semester: semesterStr,
      semesters: selectedSemesters,
      trimester,
      periodLessons,
      shift: primaryCourse?.shift || 'Noturno',
      workloadHours: Number(workloadHours)
    };

    addCurricularUnit(newUC);
    setCode('');
    setName('');
    setSelectedCourseIds(courses[0]?.id ? [courses[0].id] : []);
    setAdditionalClassIds([]);
    setSelectedSemesters(['1º Semestre']);
    setPeriodLessons({ '1º Semestre': 80 });
  };

  // Open Edit Modal
  const handleOpenEdit = (uc: CurricularUnit) => {
    if (isProfessor) return; // Read-only for professors
    const initialClassIds = Array.from(new Set([
      ...(uc.additionalClassIds || []),
      ...(uc.classId ? [uc.classId] : [])
    ])).filter(Boolean);

    const initialCourseIds = Array.from(new Set([
      ...(uc.additionalCourseIds || []),
      ...(uc.courseId ? [uc.courseId] : [])
    ])).filter(Boolean);

    const initialSemesters = uc.semesters && uc.semesters.length > 0
      ? uc.semesters
      : uc.semester ? uc.semester.split(',').map(s => s.trim()).filter(Boolean) : ['1º Semestre'];

    const initialLessons: Record<string, number> = uc.periodLessons ? { ...uc.periodLessons } : {};
    initialSemesters.forEach(s => {
      if (initialLessons[s] === undefined || initialLessons[s] <= 0) {
        initialLessons[s] = Math.round((uc.workloadHours || 80) / Math.max(1, initialSemesters.length));
      }
    });

    setEditingUC(uc);
    setEditCode(uc.code);
    setEditName(uc.name);
    setEditTeacherId(uc.teacherId || users.find(u => u.curricularUnitIds?.includes(uc.id))?.id || '');
    setEditCourseIds(initialCourseIds.length > 0 ? initialCourseIds : (courses[0]?.id ? [courses[0].id] : []));
    setEditAdditionalClassIds(initialClassIds);
    setEditSelectedSemesters(initialSemesters);
    setEditPeriodLessons(initialLessons);
    setEditTrimester(uc.trimester || '');
    setEditWorkloadHours(uc.workloadHours);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProfessor || !editingUC || !editCode.trim() || !editName.trim()) return;

    const teacherObj = users.find(u => u.id === editTeacherId);
    const selectedCourses = courses.filter(c => editCourseIds.includes(c.id));
    const primaryCourse = selectedCourses[0] || courses[0];
    const addCourseObjs = selectedCourses.filter(c => c.id !== primaryCourse?.id);
    const addClassObjs = classes.filter(cls => editAdditionalClassIds.includes(cls.id));
    const firstClass = addClassObjs[0];

    const semesterStr = editSelectedSemesters.length > 0 ? editSelectedSemesters.join(', ') : '1º Semestre';
    const updatedUC: CurricularUnit = {
      ...editingUC,
      code: editCode.trim().toUpperCase(),
      name: editName.trim(),
      teacherId: teacherObj?.id || '',
      teacherName: teacherObj?.name || '',
      teacherRegistration: teacherObj?.registration || '',
      courseId: primaryCourse?.id || editingUC.courseId || '',
      courseName: primaryCourse?.name || editingUC.courseName || '',
      additionalCourseIds: addCourseObjs.map(c => c.id),
      additionalCourseNames: addCourseObjs.map(c => c.name),
      classId: firstClass?.id || editingUC.classId || '',
      className: firstClass?.name || editingUC.className || '',
      additionalClassIds: editAdditionalClassIds,
      additionalClassNames: addClassObjs.map(cls => cls.name),
      semester: semesterStr,
      semesters: editSelectedSemesters,
      trimester: editTrimester,
      periodLessons: editPeriodLessons,
      shift: primaryCourse?.shift || editingUC.shift || 'Noturno',
      workloadHours: Number(editWorkloadHours)
    };

    updateCurricularUnit(updatedUC);
    setEditingUC(null);
  };

  // If professor, only show assigned UCs / classes
  const baseUCs = isProfessor
    ? curricularUnits.filter(
        uc =>
          uc.teacherId === currentUser.id ||
          currentUser.curricularUnitIds?.includes(uc.id) ||
          (currentUser.classIds && (currentUser.classIds.includes(uc.classId) || uc.additionalClassIds?.some(cid => currentUser.classIds?.includes(cid)))) ||
          (uc.teacherName && currentUser.name && uc.teacherName.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0]))
      )
    : curricularUnits;

  const filteredUCs = baseUCs.filter(uc => {
    const term = searchTerm.toLowerCase();
    return (
      uc.name.toLowerCase().includes(term) ||
      uc.code.toLowerCase().includes(term) ||
      uc.teacherName.toLowerCase().includes(term) ||
      uc.courseName.toLowerCase().includes(term) ||
      uc.className.toLowerCase().includes(term) ||
      (uc.additionalCourseNames && uc.additionalCourseNames.some(n => n.toLowerCase().includes(term))) ||
      (uc.additionalClassNames && uc.additionalClassNames.some(n => n.toLowerCase().includes(term)))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-3">
        {isProfessor ? (
          <div>
            <div className="flex items-center gap-2 mb-1 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <School className="w-4 h-4" /> TURMAS CADASTRADAS (PORTAL DO DOCENTE)
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Turmas Cadastradas
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Consulte as turmas e unidades curriculares em que você está vinculado como docente responsável.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-1 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <BookOpenCheck className="w-4 h-4" /> UNIDADES CURRICULARES (UCs / DISCIPLINAS)
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Cadastro & Gestão de Disciplinas AVA
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Cadastre novas UCs associando múltiplos cursos e turmas adicionais para oferta compartilhada.
            </p>
          </div>
        )}

        {isProfessor && (
          <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Modo de Visualização:</strong> As turmas e disciplinas são atribuídas pela Coordenação Pedagógica e não podem ser alteradas pelo docente.
              </span>
            </div>
            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold px-2.5 py-1 rounded-lg text-xs shrink-0 flex items-center gap-1.5 self-start sm:self-auto">
              <Eye className="w-3.5 h-3.5" /> {baseUCs.length} {baseUCs.length === 1 ? 'Turma Cadastrada' : 'Turmas Cadastradas'}
            </span>
          </div>
        )}
      </div>

      {/* Form: Add UC (Only for Admin / Coordinator - Hidden for Professor) */}
      {!isProfessor && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-500" /> Cadastrar Nova Unidade Curricular
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Código da UC:</label>
              <input
                type="text"
                placeholder="Ex: UC-0145"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome da Disciplina / UC:</label>
              <input
                type="text"
                placeholder="Ex: Desenvolvimento Web Fullstack & APIs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
          </div>

          {/* Section: Courses & Classes (Expandido para permitir ver todos os cadastros) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <MultiSelectDropdown
                label="Cursos Associados (Multicursos):"
                icon={<GraduationCap className="w-4 h-4 text-purple-500" />}
                placeholder="Selecione os cursos vinculados..."
                description="Cursos cadastrados em Gestão de Cursos e Turmas:"
                options={courseOptions}
                selectedIds={selectedCourseIds}
                onChange={setSelectedCourseIds}
                colorTheme="purple"
                emptyMessage="Nenhum curso cadastrado."
                idPrefix="add-uc-courses"
                inlineExpanded={true}
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <MultiSelectDropdown
                label="Turmas Associadas (Multiturmas):"
                icon={<School className="w-4 h-4 text-emerald-500" />}
                placeholder="Selecione as turmas vinculadas..."
                description="Turmas cadastradas em Gestão de Cursos e Turmas:"
                options={classOptions}
                selectedIds={additionalClassIds}
                onChange={setAdditionalClassIds}
                colorTheme="emerald"
                emptyMessage="Nenhuma turma cadastrada."
                idPrefix="add-uc-classes"
                inlineExpanded={true}
              />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <SemesterCheckboxes
              label="Semestre de Aplicação:"
              icon={<Calendar className="w-4 h-4 text-cyan-500" />}
              description="Marque os semestres ou trimestres em que a disciplina será aplicada:"
              selectedSemesters={selectedSemesters}
              onChange={handleSelectedSemestersChange}
              idPrefix="add-uc-semesters"
            />
          </div>

          {/* Dynamic lesson boxes per selected stage */}
          {selectedSemesters.filter(stage => !stage.includes('Anual')).length > 0 && (
            <div className="bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-cyan-200/60 dark:border-cyan-900/60 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                  <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Quantidade de aulas por etapa selecionada:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Total acumulado:
                  </span>
                  <span className="text-xs font-extrabold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/70 px-2.5 py-0.5 rounded-lg border border-cyan-300 dark:border-cyan-700">
                    {workloadHours} aulas
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {selectedSemesters.filter(stage => !stage.includes('Anual')).map((stage) => (
                  <div
                    key={stage}
                    className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1.5"
                  >
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block truncate" title={stage}>
                      Qtd. de aulas ({stage}):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={periodLessons[stage] ?? getDefaultLessonsForStage(stage)}
                        onChange={(e) => handlePeriodLessonChange(stage, Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-14 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Ex: 40"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                        aulas
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Defina a quantidade de aulas ministradas em cada etapa (máximo de 3 caixas para trimestres, 2 para semestres e 1 para anual). A carga horária total é somada automaticamente.
              </p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Cadastrar Unidade Curricular
          </button>
        </form>
      )}

      {/* List of UCs / Turmas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            {isProfessor ? (
              <>
                <School className="w-4 h-4 text-cyan-500" />
                Turmas Cadastradas ({filteredUCs.length})
              </>
            ) : (
              <>
                <BookOpenCheck className="w-4 h-4 text-cyan-500" />
                Disciplinas Cadastradas no Sistema ({filteredUCs.length})
              </>
            )}
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={isProfessor ? "Buscar turma, disciplina, código..." : "Buscar por disciplina, código, professor, turma..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Drag & Drop Instructions & Quick Sort Bar */}
        <div className="bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/80 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 rounded-lg shrink-0">
              <Move className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                Organização e Sequência das Disciplinas
                <span className="text-[10px] bg-cyan-200 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-200 px-1.5 py-0.5 rounded font-mono font-bold">
                  {curricularUnits.length} Total
                </span>
              </h4>
              <p className="text-[11px] text-cyan-700 dark:text-cyan-400">
                Clique, segure e arraste os cards para reorganizar a ordem de exibição em todo o sistema.
              </p>
            </div>
          </div>

          {/* Quick Sort Options */}
          <div className="flex items-center gap-1.5 flex-wrap self-end md:self-auto">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <ArrowUpDown className="w-3 h-3" /> Ordenar:
            </span>
            <button
              type="button"
              onClick={() => handleSortUCs('name-asc')}
              className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 transition-colors"
              title="Ordenar Alfabeticamente (A-Z)"
            >
              Nome (A-Z)
            </button>
            <button
              type="button"
              onClick={() => handleSortUCs('code-asc')}
              className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 transition-colors"
              title="Ordenar por Código"
            >
              Código
            </button>
            <button
              type="button"
              onClick={() => handleSortUCs('workload')}
              className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 transition-colors"
              title="Ordenar por Total de Aulas no Semestre"
            >
              Total de Aulas Semestre
            </button>
          </div>
        </div>

        {/* Feedback message */}
        {reorderSuccessMsg && (
          <div className="p-2.5 bg-cyan-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{reorderSuccessMsg}</span>
          </div>
        )}

        {filteredUCs.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
            <School className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Nenhuma turma encontrada.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {isProfessor
                ? 'Você ainda não possui turmas atribuídas no sistema acadêmico. Caso necessite de enturmação, contate a coordenação do seu curso.'
                : 'Nenhuma disciplina corresponde aos critérios de busca informados.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUCs.map(uc => {
              const isSelected = selectedUC?.id === uc.id;
              const isDragging = draggedUCId === uc.id;
              const isDragOver = dragOverUCId === uc.id && draggedUCId !== uc.id;
              const originalIndex = curricularUnits.findIndex(u => u.id === uc.id);

              return (
                <div
                  key={uc.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, uc.id)}
                  onDragOver={(e) => handleDragOver(e, uc.id)}
                  onDrop={(e) => handleDrop(e, uc.id)}
                  onDragEnd={handleDragEnd}
                  className={`p-4 rounded-xl border transition-all space-y-3 select-none ${
                    isDragging
                      ? 'opacity-40 border-dashed border-cyan-500 scale-[0.98] shadow-inner bg-cyan-50/20'
                      : isDragOver
                      ? 'border-2 border-cyan-500 dark:border-cyan-400 ring-4 ring-cyan-500/20 bg-cyan-50/50 dark:bg-cyan-950/40 scale-[1.02] shadow-xl'
                      : isProfessor && isSelected
                      ? 'bg-cyan-50/60 dark:bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-cyan-300 dark:hover:border-cyan-700'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-700/40">
                    <div className="flex items-center gap-2">
                      {/* Drag Handle */}
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
                        title="Clique, segure e arraste para reposicionar esta disciplina"
                      >
                        <GripVertical className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span className="font-mono text-[11px] font-extrabold text-cyan-700 dark:text-cyan-400 bg-cyan-100/80 dark:bg-cyan-950 px-1.5 py-0.5 rounded">
                          #{originalIndex + 1}
                        </span>
                      </div>

                      <span className="font-extrabold text-xs text-cyan-600 dark:text-cyan-400 font-mono px-2 py-0.5 bg-cyan-50 dark:bg-cyan-950/60 rounded border border-cyan-200 dark:border-cyan-800">
                        {uc.code}
                      </span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded">
                        {uc.shift}
                      </span>
                    </div>

                    {/* Actions: Admin/Coordinator gets Edit/Delete, Professor gets Selection only */}
                    {isProfessor ? (
                      <button
                        type="button"
                        onClick={() => setSelectedUCId(uc.id)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-cyan-600 text-white shadow-sm ring-2 ring-cyan-500/30'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-cyan-500'
                        }`}
                        title={isSelected ? 'Turma ativa no momento' : 'Selecionar como turma ativa'}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Turma Ativa</span>
                          </>
                        ) : (
                          <span>Selecionar Turma</span>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        {/* Up/Down buttons */}
                        <div className="flex items-center bg-slate-200 dark:bg-slate-700/80 rounded p-0.5 mr-1">
                          <button
                            type="button"
                            onClick={() => moveUCStep(uc.id, 'up')}
                            disabled={originalIndex === 0}
                            className="p-1 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                            title="Mover disciplina uma posição para cima"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveUCStep(uc.id, 'down')}
                            disabled={originalIndex === curricularUnits.length - 1}
                            className="p-1 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                            title="Mover disciplina uma posição para baixo"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(uc)}
                          className="p-1 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded transition-colors"
                          title="Editar UC"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCurricularUnit(uc.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                          title="Excluir UC"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{uc.name}</h3>
                    {isProfessor && (
                      <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold mt-0.5">
                        Turma de Oferta: {uc.className}
                      </p>
                    )}
                  </div>

                  {/* Teacher section (visible for admin/coord) */}
                  {!isProfessor && (() => {
                    const assignedTeacher = users.find(u => u.curricularUnitIds?.includes(uc.id) || u.id === uc.teacherId);
                    const tName = assignedTeacher?.name || uc.teacherName;
                    const tReg = assignedTeacher?.registration || uc.teacherRegistration;
                    return (
                      <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                        <span>
                          Professor: {tName ? (
                            <><strong>{tName}</strong> {tReg ? `(${tReg})` : ''}</>
                          ) : (
                            <span className="text-slate-400 italic">Atribuído via Gestão de Docentes</span>
                          )}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Courses section */}
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span>Curso Principal: <strong>{uc.courseName}</strong></span>
                    </div>
                    {uc.additionalCourseNames && uc.additionalCourseNames.length > 0 && (
                      <div className="pl-5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-purple-600 dark:text-purple-400">Cursos Adicionais:</span>
                        {uc.additionalCourseNames.map((cName, idx) => (
                          <span key={idx} className="bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 px-1.5 py-0.2 rounded text-[10px] font-medium border border-purple-200 dark:border-purple-800">
                            {cName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Classes section */}
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <School className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Turma Principal: <strong>{uc.className}</strong></span>
                    </div>
                    {uc.additionalClassNames && uc.additionalClassNames.length > 0 && (
                      <div className="pl-5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Turmas Adicionais:</span>
                        {uc.additionalClassNames.map((clsName, idx) => (
                          <span key={idx} className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded text-[10px] font-medium border border-emerald-200 dark:border-emerald-800">
                            {clsName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer info & quick jump for professor */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      {uc.semester} {uc.trimester ? `• ${uc.trimester}` : ''} • {uc.workloadHours}h
                    </span>
                    {isProfessor && setActiveTab && (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUCId(uc.id);
                            setActiveTab('ava-planilha');
                          }}
                          className="text-cyan-600 dark:text-cyan-400 hover:underline font-bold flex items-center gap-1"
                        >
                          Planilha AVA <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Edit UC (Only for Admin / Coordinator) */}
      {!isProfessor && editingUC && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 rounded-xl">
                  <BookOpenCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Editar Unidade Curricular
                  </h3>
                  <p className="text-xs text-slate-500">
                    Altere o código, cursos associados, turmas adicionais ou total de aulas semestre.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUC(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Código da UC:</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome da Disciplina / UC:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-cyan-500" /> Associar Professor à Disciplina:
                </label>
                <select
                  value={editTeacherId}
                  onChange={(e) => setEditTeacherId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">-- Selecione o Professor Cadastrado --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.registration}) - {t.department || 'Docente'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Edit Section: Courses & Classes (Expandido para permitir ver todos os cadastros) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <MultiSelectDropdown
                    label="Cursos Associados (Multicursos):"
                    icon={<GraduationCap className="w-4 h-4 text-purple-500" />}
                    placeholder="Selecione os cursos vinculados..."
                    description="Cursos cadastrados em Gestão de Cursos e Turmas:"
                    options={courseOptions}
                    selectedIds={editCourseIds}
                    onChange={setEditCourseIds}
                    colorTheme="purple"
                    emptyMessage="Nenhum curso cadastrado."
                    idPrefix="edit-uc-courses"
                    inlineExpanded={true}
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <MultiSelectDropdown
                    label="Turmas Associadas (Multiturmas):"
                    icon={<School className="w-4 h-4 text-emerald-500" />}
                    placeholder="Selecione as turmas vinculadas..."
                    description="Turmas cadastradas em Gestão de Cursos e Turmas:"
                    options={classOptions}
                    selectedIds={editAdditionalClassIds}
                    onChange={setEditAdditionalClassIds}
                    colorTheme="emerald"
                    emptyMessage="Nenhuma turma cadastrada."
                    idPrefix="edit-uc-classes"
                    inlineExpanded={true}
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <SemesterCheckboxes
                  label="Semestre de Aplicação:"
                  icon={<Calendar className="w-4 h-4 text-cyan-500" />}
                  description="Marque os semestres ou trimestres em que a disciplina será aplicada:"
                  selectedSemesters={editSelectedSemesters}
                  onChange={handleEditSelectedSemestersChange}
                  idPrefix="edit-uc-semesters"
                />
              </div>

              {/* Dynamic lesson boxes per selected stage in Edit modal */}
              {editSelectedSemesters.filter(stage => !stage.includes('Anual')).length > 0 && (
                <div className="bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-cyan-200/60 dark:border-cyan-900/60 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                      <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span>Quantidade de aulas por etapa selecionada:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Total acumulado:
                      </span>
                      <span className="text-xs font-extrabold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/70 px-2.5 py-0.5 rounded-lg border border-cyan-300 dark:border-cyan-700">
                        {editWorkloadHours} aulas
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {editSelectedSemesters.filter(stage => !stage.includes('Anual')).map((stage) => (
                      <div
                        key={stage}
                        className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1.5"
                      >
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block truncate" title={stage}>
                          Qtd. de aulas ({stage}):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={editPeriodLessons[stage] ?? getDefaultLessonsForStage(stage)}
                            onChange={(e) => handleEditPeriodLessonChange(stage, Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-14 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Ex: 40"
                            required
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                            aulas
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Defina a quantidade de aulas ministradas em cada etapa (máximo de 3 caixas para trimestres, 2 para semestres e 1 para anual). A carga horária total é somada automaticamente.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUC(null)}
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

    </div>
  );
};
