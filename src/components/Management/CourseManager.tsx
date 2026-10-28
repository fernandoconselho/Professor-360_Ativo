import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Plus,
  Trash2,
  Search,
  Users,
  School,
  Calendar,
  BookOpen,
  Edit2,
  X,
  Save,
  Clock,
  Check,
  Copy,
  BookOpenCheck,
  Sparkles,
  Layers,
  GripVertical,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Move,
  CheckCircle2
} from 'lucide-react';
import { Course, ClassTurma, CurricularUnit } from '../../types';
import { MultiSelectDropdown, MultiSelectOption, SemesterCheckboxes, defaultSemesterApplicationOptions, getDefaultLessonsForStage } from '../Common/MultiSelectDropdown';

export const CourseManager: React.FC = () => {
  const {
    courses,
    addCourse,
    updateCourse,
    deleteCourse,
    reorderCourses,
    classes,
    addClass,
    updateClass,
    deleteClass,
    reorderClasses,
    curricularUnits,
    addCurricularUnit,
    updateCurricularUnit,
    deleteCurricularUnit,
    reorderCurricularUnits,
    students,
    users
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ucs' | 'cursos' | 'turmas'>('ucs');
  const [searchTerm, setSearchTerm] = useState('');

  const teachers = users.filter(u => u.role === 'professor');

  // ==========================================
  // TOP FORM STATE: Unidade Curricular (UC)
  // ==========================================
  const [ucCode, setUcCode] = useState('');
  const [ucName, setUcName] = useState('');
  const [ucTeacherId, setUcTeacherId] = useState(teachers[0]?.id || '');
  const [ucSelectedCourseIds, setUcSelectedCourseIds] = useState<string[]>(courses[0]?.id ? [courses[0].id] : []);
  const [ucAdditionalClassIds, setUcAdditionalClassIds] = useState<string[]>([]);
  const [ucSelectedSemesters, setUcSelectedSemesters] = useState<string[]>(['1º Semestre']);
  const [ucTrimester, setUcTrimester] = useState('Semestral');
  const [ucPeriodLessons, setUcPeriodLessons] = useState<Record<string, number>>({ '1º Semestre': 80 });
  const [ucWorkloadHours, setUcWorkloadHours] = useState(80);

  // Edit UC State
  const [editingUC, setEditingUC] = useState<CurricularUnit | null>(null);
  const [editUcCode, setEditUcCode] = useState('');
  const [editUcName, setEditUcName] = useState('');
  const [editUcTeacherId, setEditUcTeacherId] = useState('');
  const [editUcCourseIds, setEditUcCourseIds] = useState<string[]>([]);
  const [editUcAdditionalClassIds, setEditUcAdditionalClassIds] = useState<string[]>([]);
  const [editUcSelectedSemesters, setEditUcSelectedSemesters] = useState<string[]>([]);
  const [editUcTrimester, setEditUcTrimester] = useState('');
  const [editUcPeriodLessons, setEditUcPeriodLessons] = useState<Record<string, number>>({});
  const [editUcWorkloadHours, setEditUcWorkloadHours] = useState(80);

  // Handlers for dynamic stage lessons
  const handleUcSelectedSemestersChange = (newSelected: string[]) => {
    setUcSelectedSemesters(newSelected);
    const updated = { ...ucPeriodLessons };
    newSelected.forEach(s => {
      if (updated[s] === undefined || updated[s] <= 0) {
        updated[s] = getDefaultLessonsForStage(s);
      }
    });
    setUcPeriodLessons(updated);
    const validStages = newSelected.filter(s => !s.includes('Anual'));
    const sum = validStages.length > 0
      ? validStages.reduce((acc, s) => acc + (updated[s] ?? getDefaultLessonsForStage(s)), 0)
      : (newSelected.some(s => s.includes('Anual')) ? (updated['Anual (Ano Letivo Completo)'] ?? 120) : 80);
    setUcWorkloadHours(sum > 0 ? sum : 80);
  };

  const handleUcPeriodLessonChange = (stage: string, val: number) => {
    const updated = { ...ucPeriodLessons, [stage]: val };
    setUcPeriodLessons(updated);
    const validStages = ucSelectedSemesters.filter(s => !s.includes('Anual'));
    const sum = validStages.length > 0
      ? validStages.reduce((acc, s) => acc + (s === stage ? val : (updated[s] ?? getDefaultLessonsForStage(s))), 0)
      : (ucSelectedSemesters.some(s => s.includes('Anual')) ? (updated['Anual (Ano Letivo Completo)'] ?? 120) : 80);
    setUcWorkloadHours(sum > 0 ? sum : 80);
  };

  const handleUcTrimesterChange = (newTrimester: string) => {
    setUcTrimester(newTrimester);
    if (newTrimester === 'Trimestral') {
      handleUcSelectedSemestersChange(['1° Trimestre', '2° Trimestre', '3° Trimestre']);
    } else if (newTrimester === 'Semestral') {
      handleUcSelectedSemestersChange(['1º Semestre', '2º Semestre']);
    } else if (newTrimester === 'Anual') {
      handleUcSelectedSemestersChange(['Anual (Ano Letivo Completo)']);
    } else if (['1º Trimestre', '1° Trimestre'].includes(newTrimester)) {
      handleUcSelectedSemestersChange(['1° Trimestre']);
    } else if (['2º Trimestre', '2° Trimestre'].includes(newTrimester)) {
      handleUcSelectedSemestersChange(['2° Trimestre']);
    } else if (['3º Trimestre', '3° Trimestre'].includes(newTrimester)) {
      handleUcSelectedSemestersChange(['3° Trimestre']);
    }
  };

  const handleEditUcSelectedSemestersChange = (newSelected: string[]) => {
    setEditUcSelectedSemesters(newSelected);
    const updated = { ...editUcPeriodLessons };
    newSelected.forEach(s => {
      if (updated[s] === undefined || updated[s] <= 0) {
        updated[s] = getDefaultLessonsForStage(s);
      }
    });
    setEditUcPeriodLessons(updated);
    const validStages = newSelected.filter(s => !s.includes('Anual'));
    const sum = validStages.length > 0
      ? validStages.reduce((acc, s) => acc + (updated[s] ?? getDefaultLessonsForStage(s)), 0)
      : (newSelected.some(s => s.includes('Anual')) ? (updated['Anual (Ano Letivo Completo)'] ?? 120) : 80);
    setEditUcWorkloadHours(sum > 0 ? sum : 80);
  };

  const handleEditUcPeriodLessonChange = (stage: string, val: number) => {
    const updated = { ...editUcPeriodLessons, [stage]: val };
    setEditUcPeriodLessons(updated);
    const validStages = editUcSelectedSemesters.filter(s => !s.includes('Anual'));
    const sum = validStages.length > 0
      ? validStages.reduce((acc, s) => acc + (s === stage ? val : (updated[s] ?? getDefaultLessonsForStage(s))), 0)
      : (editUcSelectedSemesters.some(s => s.includes('Anual')) ? (updated['Anual (Ano Letivo Completo)'] ?? 120) : 80);
    setEditUcWorkloadHours(sum > 0 ? sum : 80);
  };

  const handleEditUcTrimesterChange = (newTrimester: string) => {
    setEditUcTrimester(newTrimester);
    if (newTrimester === 'Trimestral') {
      handleEditUcSelectedSemestersChange(['1° Trimestre', '2° Trimestre', '3° Trimestre']);
    } else if (newTrimester === 'Semestral') {
      handleEditUcSelectedSemestersChange(['1º Semestre', '2º Semestre']);
    } else if (newTrimester === 'Anual') {
      handleEditUcSelectedSemestersChange(['Anual (Ano Letivo Completo)']);
    } else if (['1º Trimestre', '1° Trimestre'].includes(newTrimester)) {
      handleEditUcSelectedSemestersChange(['1° Trimestre']);
    } else if (['2º Trimestre', '2° Trimestre'].includes(newTrimester)) {
      handleEditUcSelectedSemestersChange(['2° Trimestre']);
    } else if (['3º Trimestre', '3° Trimestre'].includes(newTrimester)) {
      handleEditUcSelectedSemestersChange(['3° Trimestre']);
    }
  };

  // ==========================================
  // FORM STATE: Curso
  // ==========================================
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [modality, setModality] = useState<'Presencial' | 'EAD' | 'Híbrido'>('Presencial');
  const [shift, setShift] = useState<'Matutino' | 'Vespertino' | 'Noturno' | 'Integral'>('Noturno');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['Noturno']);
  const [semesters, setSemesters] = useState(5);

  // Edit Course State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseName, setEditCourseName] = useState('');
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editCourseModality, setEditCourseModality] = useState<'Presencial' | 'EAD' | 'Híbrido'>('Presencial');
  const [editCourseShift, setEditCourseShift] = useState<'Matutino' | 'Vespertino' | 'Noturno' | 'Integral'>('Noturno');
  const [editCoursePeriods, setEditCoursePeriods] = useState<string[]>([]);
  const [editCourseSemesters, setEditCourseSemesters] = useState(5);

  // ==========================================
  // FORM STATE: Turma
  // ==========================================
  const [className, setClassName] = useState('');
  const [selectedCourseIdForClass, setSelectedCourseIdForClass] = useState(courses[0]?.id || '');
  const [classPeriod, setClassPeriod] = useState('2026.1');
  const [selectedClassPeriods, setSelectedClassPeriods] = useState<string[]>(() => {
    const firstCourse = courses[0];
    if (firstCourse && firstCourse.periods && firstCourse.periods.length > 0) {
      return [...firstCourse.periods];
    }
    return [firstCourse?.shift || 'Noturno'];
  });

  // Edit Class State
  const [editingClass, setEditingClass] = useState<ClassTurma | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassCourseId, setEditClassCourseId] = useState('');
  const [editClassPeriod, setEditClassPeriod] = useState('');
  const [editClassShift, setEditClassShift] = useState<'Matutino' | 'Vespertino' | 'Noturno' | 'Integral'>('Noturno');
  const [editClassPeriods, setEditClassPeriods] = useState<string[]>([]);

  // Drag and Drop & Reordering State
  const [draggedClassId, setDraggedClassId] = useState<string | null>(null);
  const [dragOverClassId, setDragOverClassId] = useState<string | null>(null);

  const [draggedUCId, setDraggedUCId] = useState<string | null>(null);
  const [dragOverUCId, setDragOverUCId] = useState<string | null>(null);

  const [draggedCourseId, setDraggedCourseId] = useState<string | null>(null);
  const [dragOverCourseId, setDragOverCourseId] = useState<string | null>(null);

  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);

  // --- TURMAS REORDER HANDLERS ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedClassId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverClassId !== id) {
      setDragOverClassId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedClassId || draggedClassId === targetId) {
      setDraggedClassId(null);
      setDragOverClassId(null);
      return;
    }

    const sourceIndex = classes.findIndex(c => c.id === draggedClassId);
    const targetIndex = classes.findIndex(c => c.id === targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const updatedClasses = [...classes];
      const [movedItem] = updatedClasses.splice(sourceIndex, 1);
      updatedClasses.splice(targetIndex, 0, movedItem);

      reorderClasses(updatedClasses);
      setReorderSuccessMsg(`Turma "${movedItem.name}" movida para a posição #${targetIndex + 1}.`);
      setTimeout(() => setReorderSuccessMsg(null), 3500);
    }

    setDraggedClassId(null);
    setDragOverClassId(null);
  };

  const handleDragEnd = () => {
    setDraggedClassId(null);
    setDragOverClassId(null);
  };

  const moveClassStep = (id: string, direction: 'up' | 'down') => {
    const currentIndex = classes.findIndex(c => c.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= classes.length) return;

    const updatedClasses = [...classes];
    const [movedItem] = updatedClasses.splice(currentIndex, 1);
    updatedClasses.splice(targetIndex, 0, movedItem);

    reorderClasses(updatedClasses);
    setReorderSuccessMsg(`Turma "${movedItem.name}" movida para a posição #${targetIndex + 1}.`);
    setTimeout(() => setReorderSuccessMsg(null), 3000);
  };

  const handleSortClasses = (criteria: 'name-asc' | 'name-desc' | 'period-asc' | 'shift') => {
    const sorted = [...classes].sort((a, b) => {
      if (criteria === 'name-asc') return a.name.localeCompare(b.name);
      if (criteria === 'name-desc') return b.name.localeCompare(a.name);
      if (criteria === 'period-asc') return a.period.localeCompare(b.period);
      if (criteria === 'shift') return (a.shift || '').localeCompare(b.shift || '');
      return 0;
    });
    reorderClasses(sorted);
    setReorderSuccessMsg('Sequência de turmas reorganizada com sucesso.');
    setTimeout(() => setReorderSuccessMsg(null), 3000);
  };

  // --- UCs / DISCIPLINAS REORDER HANDLERS ---
  const handleUCDragStart = (e: React.DragEvent, id: string) => {
    setDraggedUCId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleUCDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverUCId !== id) {
      setDragOverUCId(id);
    }
  };

  const handleUCDrop = (e: React.DragEvent, targetId: string) => {
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
      setReorderSuccessMsg(`Disciplina "${movedItem.name}" movida para a posição #${targetIndex + 1}.`);
      setTimeout(() => setReorderSuccessMsg(null), 3500);
    }

    setDraggedUCId(null);
    setDragOverUCId(null);
  };

  const handleUCDragEnd = () => {
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
    setReorderSuccessMsg('Sequência de disciplinas/UCs reorganizada com sucesso.');
    setTimeout(() => setReorderSuccessMsg(null), 3000);
  };

  // --- CURSOS REORDER HANDLERS ---
  const handleCourseDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCourseId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleCourseDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCourseId !== id) {
      setDragOverCourseId(id);
    }
  };

  const handleCourseDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedCourseId || draggedCourseId === targetId) {
      setDraggedCourseId(null);
      setDragOverCourseId(null);
      return;
    }

    const sourceIndex = courses.findIndex(c => c.id === draggedCourseId);
    const targetIndex = courses.findIndex(c => c.id === targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const updatedCourses = [...courses];
      const [movedItem] = updatedCourses.splice(sourceIndex, 1);
      updatedCourses.splice(targetIndex, 0, movedItem);

      reorderCourses(updatedCourses);
      setReorderSuccessMsg(`Curso "${movedItem.name}" movido para a posição #${targetIndex + 1}.`);
      setTimeout(() => setReorderSuccessMsg(null), 3500);
    }

    setDraggedCourseId(null);
    setDragOverCourseId(null);
  };

  const handleCourseDragEnd = () => {
    setDraggedCourseId(null);
    setDragOverCourseId(null);
  };

  const moveCourseStep = (id: string, direction: 'up' | 'down') => {
    const currentIndex = courses.findIndex(c => c.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= courses.length) return;

    const updatedCourses = [...courses];
    const [movedItem] = updatedCourses.splice(currentIndex, 1);
    updatedCourses.splice(targetIndex, 0, movedItem);

    reorderCourses(updatedCourses);
    setReorderSuccessMsg(`Curso "${movedItem.name}" movido para a posição #${targetIndex + 1}.`);
    setTimeout(() => setReorderSuccessMsg(null), 3000);
  };

  const handleSortCourses = (criteria: 'name-asc' | 'name-desc' | 'code-asc' | 'modality') => {
    const sorted = [...courses].sort((a, b) => {
      if (criteria === 'name-asc') return a.name.localeCompare(b.name);
      if (criteria === 'name-desc') return b.name.localeCompare(a.name);
      if (criteria === 'code-asc') return a.code.localeCompare(b.code);
      if (criteria === 'modality') return (a.modality || '').localeCompare(b.modality || '');
      return 0;
    });
    reorderCourses(sorted);
    setReorderSuccessMsg('Sequência de cursos reorganizada com sucesso.');
    setTimeout(() => setReorderSuccessMsg(null), 3000);
  };

  // Options for Multiselects
  const courseOptions: MultiSelectOption[] = courses.map(c => ({
    id: c.id,
    label: `${c.name} (${c.code})`,
    subLabel: `Turno: ${c.shift || 'Geral'} • Modalidade: ${c.modality || 'Presencial'}`,
    badge: c.code,
  }));

  const classOptions: MultiSelectOption[] = classes.map(cls => ({
    id: cls.id,
    label: cls.name,
    subLabel: `Curso: ${cls.courseName || 'Geral'} • Turno(s): ${(cls.periods && cls.periods.length > 0 ? cls.periods.join(', ') : cls.shift) || 'Geral'} • ${cls.period || ''}`,
    badge: cls.periods && cls.periods.length > 0 ? cls.periods.join('/') : cls.shift,
  }));

  // Toggle Periods for Course
  const togglePeriod = (p: string) => {
    setSelectedPeriods(prev =>
      prev.includes(p)
        ? (prev.length > 1 ? prev.filter(item => item !== p) : prev)
        : [...prev, p]
    );
  };

  const toggleEditPeriod = (p: string) => {
    setEditCoursePeriods(prev =>
      prev.includes(p)
        ? (prev.length > 1 ? prev.filter(item => item !== p) : prev)
        : [...prev, p]
    );
  };

  // Toggle Periods for Class
  const toggleClassPeriod = (p: string) => {
    setSelectedClassPeriods(prev =>
      prev.includes(p)
        ? (prev.length > 1 ? prev.filter(item => item !== p) : prev)
        : [...prev, p]
    );
  };

  const toggleEditClassPeriod = (p: string) => {
    setEditClassPeriods(prev =>
      prev.includes(p)
        ? (prev.length > 1 ? prev.filter(item => item !== p) : prev)
        : [...prev, p]
    );
  };

  const handleSelectCourseForClass = (courseId: string) => {
    setSelectedCourseIdForClass(courseId);
    const courseObj = courses.find(c => c.id === courseId);
    if (courseObj?.periods && courseObj.periods.length > 0) {
      setSelectedClassPeriods([...courseObj.periods]);
    } else if (courseObj?.shift) {
      setSelectedClassPeriods([courseObj.shift]);
    }
  };

  // ==========================================
  // HANDLERS: UC
  // ==========================================
  const handleAddUC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ucCode.trim() || !ucName.trim()) return;

    const teacherObj = users.find(u => u.id === ucTeacherId);
    const selectedCourses = courses.filter(c => ucSelectedCourseIds.includes(c.id));
    const primaryCourse = selectedCourses[0] || courses[0];
    const addCourseObjs = selectedCourses.filter(c => c.id !== primaryCourse?.id);
    const addClassObjs = classes.filter(cls => ucAdditionalClassIds.includes(cls.id));
    const firstClass = addClassObjs[0];

    const newUC: CurricularUnit = {
      id: `uc-${Date.now()}`,
      code: ucCode.trim().toUpperCase(),
      name: ucName.trim(),
      teacherId: teacherObj?.id || '',
      teacherName: teacherObj?.name || '',
      teacherRegistration: teacherObj?.registration || '',
      courseId: primaryCourse?.id || '',
      courseName: primaryCourse?.name || '',
      additionalCourseIds: addCourseObjs.map(c => c.id),
      additionalCourseNames: addCourseObjs.map(c => c.name),
      classId: firstClass?.id || '',
      className: firstClass?.name || (addClassObjs.length > 0 ? addClassObjs.map(c => c.name).join(', ') : 'Todas as Turmas'),
      additionalClassIds: ucAdditionalClassIds,
      additionalClassNames: addClassObjs.map(cls => cls.name),
      semester: ucSelectedSemesters.length > 0 ? ucSelectedSemesters.join(', ') : '1º Semestre',
      semesters: ucSelectedSemesters,
      trimester: ucTrimester,
      periodLessons: ucPeriodLessons,
      shift: primaryCourse?.shift || 'Noturno',
      workloadHours: Number(ucWorkloadHours)
    };

    addCurricularUnit(newUC);
    setUcCode('');
    setUcName('');
    setUcSelectedCourseIds(courses[0]?.id ? [courses[0].id] : []);
    setUcAdditionalClassIds([]);
    setUcSelectedSemesters(['1º Semestre']);
    setUcPeriodLessons({ '1º Semestre': 80 });
    setActiveTab('ucs');
  };

  const handleOpenUCEdit = (uc: CurricularUnit) => {
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
    setEditUcCode(uc.code);
    setEditUcName(uc.name);
    setEditUcTeacherId(uc.teacherId || users.find(u => u.curricularUnitIds?.includes(uc.id))?.id || '');
    setEditUcCourseIds(initialCourseIds.length > 0 ? initialCourseIds : (courses[0]?.id ? [courses[0].id] : []));
    setEditUcAdditionalClassIds(initialClassIds);
    setEditUcSelectedSemesters(initialSemesters);
    setEditUcPeriodLessons(initialLessons);
    setEditUcTrimester(uc.trimester || '');
    setEditUcWorkloadHours(uc.workloadHours);
  };

  const handleSaveUCEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUC || !editUcCode.trim() || !editUcName.trim()) return;

    const teacherObj = users.find(u => u.id === editUcTeacherId);
    const selectedCourses = courses.filter(c => editUcCourseIds.includes(c.id));
    const primaryCourse = selectedCourses[0] || courses[0];
    const addCourseObjs = selectedCourses.filter(c => c.id !== primaryCourse?.id);
    const addClassObjs = classes.filter(cls => editUcAdditionalClassIds.includes(cls.id));
    const firstClass = addClassObjs[0];

    const updatedUC: CurricularUnit = {
      ...editingUC,
      code: editUcCode.trim().toUpperCase(),
      name: editUcName.trim(),
      teacherId: teacherObj?.id || '',
      teacherName: teacherObj?.name || '',
      teacherRegistration: teacherObj?.registration || '',
      courseId: primaryCourse?.id || editingUC.courseId || '',
      courseName: primaryCourse?.name || editingUC.courseName || '',
      additionalCourseIds: addCourseObjs.map(c => c.id),
      additionalCourseNames: addCourseObjs.map(c => c.name),
      classId: firstClass?.id || editingUC.classId || '',
      className: firstClass?.name || editingUC.className || '',
      additionalClassIds: editUcAdditionalClassIds,
      additionalClassNames: addClassObjs.map(cls => cls.name),
      semester: editUcSelectedSemesters.length > 0 ? editUcSelectedSemesters.join(', ') : '1º Semestre',
      semesters: editUcSelectedSemesters,
      trimester: editUcTrimester,
      periodLessons: editUcPeriodLessons,
      shift: primaryCourse?.shift || editingUC.shift || 'Noturno',
      workloadHours: Number(editUcWorkloadHours)
    };

    updateCurricularUnit(updatedUC);
    setEditingUC(null);
  };

  // ==========================================
  // HANDLERS: Course
  // ==========================================
  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim() || !courseCode.trim()) return;

    const primaryShift = (selectedPeriods[0] as 'Matutino' | 'Vespertino' | 'Noturno' | 'Integral') || shift || 'Noturno';

    const newC: Course = {
      id: `c-${Date.now()}`,
      name: courseName.trim(),
      code: courseCode.trim().toUpperCase(),
      modality,
      shift: primaryShift,
      periods: selectedPeriods,
      semesters: Number(semesters)
    };

    addCourse(newC);
    setCourseName('');
    setCourseCode('');
    setSelectedPeriods(['Noturno']);
    setActiveTab('cursos');
  };

  const handleOpenCourseEdit = (c: Course) => {
    setEditingCourse(c);
    setEditCourseName(c.name);
    setEditCourseCode(c.code);
    setEditCourseModality(c.modality);
    setEditCourseShift(c.shift);
    setEditCoursePeriods(c.periods && c.periods.length > 0 ? c.periods : [c.shift || 'Noturno']);
    setEditCourseSemesters(c.semesters);
  };

  const handleSaveCourseEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editCourseName.trim() || !editCourseCode.trim()) return;

    const primaryShift = (editCoursePeriods[0] as 'Matutino' | 'Vespertino' | 'Noturno' | 'Integral') || editCourseShift || 'Noturno';

    const updatedC: Course = {
      ...editingCourse,
      name: editCourseName.trim(),
      code: editCourseCode.trim().toUpperCase(),
      modality: editCourseModality,
      shift: primaryShift,
      periods: editCoursePeriods,
      semesters: Number(editCourseSemesters)
    };

    updateCourse(updatedC);
    setEditingCourse(null);
  };

  const handleDuplicateCourse = (c: Course) => {
    let baseCode = `${c.code}-COP`;
    let counter = 1;
    while (courses.some(course => course.code === baseCode)) {
      counter++;
      baseCode = `${c.code}-COP${counter}`;
    }

    const duplicatedCourse: Course = {
      ...c,
      id: `c-${Date.now()}`,
      name: `${c.name} (Cópia)`,
      code: baseCode,
      periods: c.periods && c.periods.length > 0 ? [...c.periods] : [c.shift || 'Noturno']
    };

    addCourse(duplicatedCourse);
  };

  // ==========================================
  // HANDLERS: Class
  // ==========================================
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    const courseObj = courses.find(c => c.id === selectedCourseIdForClass);
    const primaryShift = (selectedClassPeriods[0] as 'Matutino' | 'Vespertino' | 'Noturno' | 'Integral') || courseObj?.shift || 'Noturno';

    const newCls: ClassTurma = {
      id: `turma-${Date.now()}`,
      name: className.trim(),
      courseId: selectedCourseIdForClass,
      courseName: courseObj?.name || '',
      period: classPeriod,
      shift: primaryShift,
      periods: selectedClassPeriods && selectedClassPeriods.length > 0 ? selectedClassPeriods : [primaryShift]
    };

    addClass(newCls);
    setClassName('');
    setActiveTab('turmas');
  };

  const handleOpenClassEdit = (cls: ClassTurma) => {
    setEditingClass(cls);
    setEditClassName(cls.name);
    setEditClassCourseId(cls.courseId);
    setEditClassPeriod(cls.period);
    setEditClassShift(cls.shift);
    setEditClassPeriods(cls.periods && cls.periods.length > 0 ? cls.periods : [cls.shift || 'Noturno']);
  };

  const handleSaveClassEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editClassName.trim()) return;

    const courseObj = courses.find(c => c.id === editClassCourseId);
    const primaryShift = (editClassPeriods[0] as 'Matutino' | 'Vespertino' | 'Noturno' | 'Integral') || editClassShift || 'Noturno';

    const updatedCls: ClassTurma = {
      ...editingClass,
      name: editClassName.trim(),
      courseId: editClassCourseId,
      courseName: courseObj?.name || '',
      period: editClassPeriod.trim(),
      shift: primaryShift,
      periods: editClassPeriods && editClassPeriods.length > 0 ? editClassPeriods : [primaryShift]
    };

    updateClass(updatedCls);
    setEditingClass(null);
  };

  const handleDuplicateClass = (cls: ClassTurma) => {
    const duplicatedClass: ClassTurma = {
      ...cls,
      id: `turma-${Date.now()}`,
      name: `${cls.name} (Cópia)`,
      periods: cls.periods && cls.periods.length > 0 ? [...cls.periods] : [cls.shift || 'Noturno']
    };

    addClass(duplicatedClass);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
          <BookOpenCheck className="w-4 h-4" /> GESTÃO ACADÊMICA INTEGRADA
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          UC´s, Cursos e Turmas
        </h1>
        <p className="text-xs text-slate-300">
          Cadastre e gerencie Unidades Curriculares (UCs/Disciplinas), Cursos e Turmas com vinculação completa de docentes e multicursos.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* PARTE SUPERIOR: FORMULÁRIO DE CADASTRO DE UNIDADES CURRICULARES (UC´S)   */}
      {/* ========================================================================= */}
      <form onSubmit={handleAddUC} className="bg-white dark:bg-slate-900 border-2 border-cyan-500/40 dark:border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-md space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 rounded-xl">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Cadastrar Nova Unidade Curricular (UC / Disciplina)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cadastre a disciplina vinculando múltiplos cursos e turmas letivas.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Código da UC:
            </label>
            <input
              type="text"
              placeholder="Ex: UC-0145"
              value={ucCode}
              onChange={(e) => setUcCode(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Nome da Disciplina / Unidade Curricular:
            </label>
            <input
              type="text"
              placeholder="Ex: Desenvolvimento Web Fullstack & APIs"
              value={ucName}
              onChange={(e) => setUcName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
        </div>

        {/* Section: Courses & Classes Multiselect (Expandido para permitir ver todos os cadastros) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <MultiSelectDropdown
              label="Cursos Associados (Multicursos):"
              icon={<GraduationCap className="w-4 h-4 text-purple-500" />}
              placeholder="Selecione os cursos vinculados..."
              description="Vincule um ou mais cursos cadastrados que compartilham esta disciplina:"
              options={courseOptions}
              selectedIds={ucSelectedCourseIds}
              onChange={setUcSelectedCourseIds}
              colorTheme="purple"
              emptyMessage="Nenhum curso cadastrado."
              idPrefix="top-uc-courses"
              inlineExpanded={true}
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <MultiSelectDropdown
              label="Turmas Associadas (Multiturmas):"
              icon={<School className="w-4 h-4 text-emerald-500" />}
              placeholder="Selecione as turmas vinculadas..."
              description="Vincule as turmas cadastradas que terão acesso a esta UC:"
              options={classOptions}
              selectedIds={ucAdditionalClassIds}
              onChange={setUcAdditionalClassIds}
              colorTheme="emerald"
              emptyMessage="Nenhuma turma cadastrada."
              idPrefix="top-uc-classes"
              inlineExpanded={true}
            />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
          <SemesterCheckboxes
            label="Semestre de Aplicação:"
            icon={<Calendar className="w-4 h-4 text-cyan-500" />}
            description="Marque os semestres ou trimestres em que a disciplina será aplicada:"
            selectedSemesters={ucSelectedSemesters}
            onChange={handleUcSelectedSemestersChange}
            idPrefix="top-uc-semesters"
          />
        </div>

        {/* Dynamic lesson boxes per selected stage */}
        {ucSelectedSemesters.filter(stage => !stage.includes('Anual')).length > 0 && (
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
                  {ucWorkloadHours} aulas
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ucSelectedSemesters.filter(stage => !stage.includes('Anual')).map((stage) => (
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
                      value={ucPeriodLessons[stage] ?? getDefaultLessonsForStage(stage)}
                      onChange={(e) => handleUcPeriodLessonChange(stage, Number(e.target.value))}
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
          className="w-full py-2.5 bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Cadastrar Unidade Curricular (UC)
        </button>
      </form>

      {/* ========================================================================= */}
      {/* SEÇÃO INFERIOR DE CADASTRO: CURSOS & TURMAS                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Form: Add Course */}
        <form onSubmit={handleAddCourse} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              Cadastrar Novo Curso
            </h2>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome do Curso:</label>
            <input
              type="text"
              placeholder="Ex: Análise e Desenvolvimento de Sistemas"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Código do Curso:</label>
              <input
                type="text"
                placeholder="Ex: ADS-101"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Semestres | Trimestres:</label>
              <input
                type="number"
                min="1"
                max="12"
                value={semesters}
                onChange={(e) => setSemesters(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Modalidade:</label>
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Presencial">Presencial</option>
              <option value="Híbrido">Híbrido</option>
              <option value="EAD">EAD</option>
            </select>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-500" /> Períodos / Turnos de Oferta:
              </label>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                Selecione um ou mais
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {['Matutino', 'Vespertino', 'Noturno', 'Integral'].map(p => {
                const isSelected = selectedPeriods.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePeriod(p)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-purple-500'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span>{p}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Cadastrar Curso
          </button>
        </form>

        {/* Form: Add Class */}
        <form onSubmit={handleAddClass} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <School className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              Cadastrar Nova Turma
            </h2>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Curso Vinculado:</label>
            <select
              value={selectedCourseIdForClass}
              onChange={(e) => handleSelectCourseForClass(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome da Turma:</label>
            <input
              type="text"
              placeholder="Ex: Turma ADS - 3º Semestre A"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Período Letivo:</label>
            <input
              type="text"
              placeholder="Ex: 2026.1"
              value={classPeriod}
              onChange={(e) => setClassPeriod(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-500" /> Períodos / Turnos de Oferta:
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Selecione um ou mais
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {['Matutino', 'Vespertino', 'Noturno', 'Integral'].map(p => {
                const isSelected = selectedClassPeriods.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleClassPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span>{p}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Cadastrar Turma
          </button>
        </form>

      </div>

      {/* ========================================================================= */}
      {/* LISTAGEM & GESTÃO COM ABAS: UCs, CURSOS E TURMAS                          */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tab 1: UCs */}
            <button
              type="button"
              onClick={() => setActiveTab('ucs')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'ucs'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <BookOpenCheck className="w-4 h-4" />
              <span>UC´s / Disciplinas</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'ucs' ? 'bg-cyan-800 text-cyan-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {curricularUnits.length}
              </span>
            </button>

            {/* Tab 2: Cursos */}
            <button
              type="button"
              onClick={() => setActiveTab('cursos')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'cursos'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Cursos</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'cursos' ? 'bg-purple-800 text-purple-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {courses.length}
              </span>
            </button>

            {/* Tab 3: Turmas */}
            <button
              type="button"
              onClick={() => setActiveTab('turmas')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'turmas'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <School className="w-4 h-4" />
              <span>Turmas</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'turmas' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {classes.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={
                activeTab === 'ucs'
                  ? "Buscar por UC, código, professor..."
                  : activeTab === 'cursos'
                  ? "Buscar por curso ou código..."
                  : "Buscar por turma ou período..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ABA 1: UCs / DISCIPLINAS COM REORDENAÇÃO ARRASTAR E SOLTAR (DRAG & DROP)  */}
        {/* ========================================================================= */}
        {activeTab === 'ucs' && (
          <div className="space-y-4">
            {/* Helper Info & Quick Reorder Controls */}
            <div className="bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/80 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 rounded-lg shrink-0">
                  <Move className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                    Organização e Sequência das Disciplinas / UCs
                    <span className="text-[10px] bg-cyan-200 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-200 px-1.5 py-0.5 rounded font-mono font-bold">
                      {curricularUnits.length} Disciplinas
                    </span>
                  </h4>
                  <p className="text-[11px] text-cyan-700 dark:text-cyan-400">
                    Clique, segure e arraste qualquer card para definir a ordem desejada. A nova sequência é salva em tempo real.
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
                  title="Ordenar por Código da Disciplina"
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

            {/* Reorder feedback message */}
            {reorderSuccessMsg && (
              <div className="p-2.5 bg-cyan-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in slide-in-from-top-1 duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{reorderSuccessMsg}</span>
              </div>
            )}

            {/* Curricular Units Cards Grid with Drag & Drop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {curricularUnits
                .filter(uc => {
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
                })
                .map(uc => {
                  const assignedTeacher = users.find(u => u.curricularUnitIds?.includes(uc.id) || u.id === uc.teacherId);
                  const tName = assignedTeacher?.name || uc.teacherName;
                  const tReg = assignedTeacher?.registration || uc.teacherRegistration;
                  const isDragging = draggedUCId === uc.id;
                  const isDragOver = dragOverUCId === uc.id && draggedUCId !== uc.id;
                  const originalIndex = curricularUnits.findIndex(u => u.id === uc.id);

                  return (
                    <div
                      key={uc.id}
                      draggable={true}
                      onDragStart={(e) => handleUCDragStart(e, uc.id)}
                      onDragOver={(e) => handleUCDragOver(e, uc.id)}
                      onDrop={(e) => handleUCDrop(e, uc.id)}
                      onDragEnd={handleUCDragEnd}
                      className={`relative p-4 bg-white dark:bg-slate-800/80 border rounded-2xl space-y-3 transition-all duration-150 select-none ${
                        isDragging
                          ? 'opacity-40 border-dashed border-cyan-500 scale-[0.98] shadow-inner bg-cyan-50/20'
                          : isDragOver
                          ? 'border-2 border-cyan-500 dark:border-cyan-400 ring-4 ring-cyan-500/20 bg-cyan-50/50 dark:bg-cyan-950/40 scale-[1.02] shadow-xl'
                          : 'border-slate-200 dark:border-slate-700/80 hover:border-cyan-400 dark:hover:border-cyan-600 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {/* Top Bar with Drag Handle & Actions */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-2">
                          {/* Drag Grip Handle */}
                          <div
                            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
                            title="Clique, segure e arraste para reposicionar esta disciplina"
                          >
                            <GripVertical className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            <span className="font-mono text-[11px] font-extrabold text-cyan-700 dark:text-cyan-400 bg-cyan-100/80 dark:bg-cyan-950 px-1.5 py-0.5 rounded">
                              #{originalIndex + 1}
                            </span>
                          </div>

                          <span className="font-extrabold text-xs text-cyan-700 dark:text-cyan-300 font-mono px-2 py-0.5 bg-cyan-50 dark:bg-cyan-950/60 rounded border border-cyan-200 dark:border-cyan-800">
                            {uc.code}
                          </span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded">
                            {uc.shift}
                          </span>
                        </div>

                        {/* Action buttons & Step Reorder */}
                        <div className="flex items-center gap-1">
                          {/* Quick Up / Down step buttons */}
                          <div className="flex items-center bg-slate-100 dark:bg-slate-700/80 rounded p-0.5 mr-1">
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
                            onClick={() => handleOpenUCEdit(uc)}
                            className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-lg transition-colors"
                            title="Editar UC"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCurricularUnit(uc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Excluir UC"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{uc.name}</h3>
                      </div>

                      {/* Teacher */}
                      <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                        <span>
                          Professor: {tName ? (
                            <><strong>{tName}</strong> {tReg ? `(${tReg})` : ''}</>
                          ) : (
                            <span className="text-slate-400 italic">Docente não atribuído</span>
                          )}
                        </span>
                      </div>

                      {/* Courses */}
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-700/60">
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

                      {/* Classes */}
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-700/60">
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

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                        <span>{uc.semester} {uc.trimester ? `• ${uc.trimester}` : ''}</span>
                        <span className="font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/40">
                          {uc.workloadHours}h
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: CURSOS CADASTRADOS COM REORDENAÇÃO ARRASTAR E SOLTAR (DRAG & DROP)  */}
        {/* ========================================================================= */}
        {activeTab === 'cursos' && (
          <div className="space-y-4">
            {/* Helper Info & Quick Reorder Controls */}
            <div className="bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-lg shrink-0">
                  <Move className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    Organização e Sequência dos Cursos
                    <span className="text-[10px] bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-1.5 py-0.5 rounded font-mono font-bold">
                      {courses.length} Cursos
                    </span>
                  </h4>
                  <p className="text-[11px] text-purple-700 dark:text-purple-400">
                    Clique, segure e arraste qualquer card para definir a ordem desejada. A nova sequência é salva em tempo real.
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
                  onClick={() => handleSortCourses('name-asc')}
                  className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 transition-colors"
                  title="Ordenar Alfabeticamente (A-Z)"
                >
                  Nome (A-Z)
                </button>
                <button
                  type="button"
                  onClick={() => handleSortCourses('code-asc')}
                  className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 transition-colors"
                  title="Ordenar por Código do Curso"
                >
                  Código
                </button>
                <button
                  type="button"
                  onClick={() => handleSortCourses('modality')}
                  className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 transition-colors"
                  title="Ordenar por Modalidade"
                >
                  Modalidade
                </button>
              </div>
            </div>

            {/* Reorder feedback message */}
            {reorderSuccessMsg && (
              <div className="p-2.5 bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in slide-in-from-top-1 duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{reorderSuccessMsg}</span>
              </div>
            )}

            {/* Courses Cards Grid with Drag & Drop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses
                .filter(c => 
                  c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  c.code.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(c => {
                  const courseClasses = classes.filter(cls => cls.courseId === c.id);
                  const enrolledCount = students.filter(s => s.courseId === c.id).length;
                  const isDragging = draggedCourseId === c.id;
                  const isDragOver = dragOverCourseId === c.id && draggedCourseId !== c.id;
                  const originalIndex = courses.findIndex(item => item.id === c.id);

                  return (
                    <div
                      key={c.id}
                      draggable={true}
                      onDragStart={(e) => handleCourseDragStart(e, c.id)}
                      onDragOver={(e) => handleCourseDragOver(e, c.id)}
                      onDrop={(e) => handleCourseDrop(e, c.id)}
                      onDragEnd={handleCourseDragEnd}
                      className={`relative p-4 bg-white dark:bg-slate-800/80 border rounded-2xl space-y-3 transition-all duration-150 select-none ${
                        isDragging
                          ? 'opacity-40 border-dashed border-purple-500 scale-[0.98] shadow-inner bg-purple-50/20'
                          : isDragOver
                          ? 'border-2 border-purple-500 dark:border-purple-400 ring-4 ring-purple-500/20 bg-purple-50/50 dark:bg-purple-950/40 scale-[1.02] shadow-xl'
                          : 'border-slate-200 dark:border-slate-700/80 hover:border-purple-400 dark:hover:border-purple-600 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {/* Top Bar with Drag Handle & Actions */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-2">
                          {/* Drag Grip Handle */}
                          <div
                            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
                            title="Clique, segure e arraste para reposicionar este curso"
                          >
                            <GripVertical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="font-mono text-[11px] font-extrabold text-purple-700 dark:text-purple-400 bg-purple-100/80 dark:bg-purple-950 px-1.5 py-0.5 rounded">
                              #{originalIndex + 1}
                            </span>
                          </div>

                          <span className="font-extrabold text-xs text-purple-700 dark:text-purple-300 font-mono px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 rounded border border-purple-200 dark:border-purple-800">
                            {c.code}
                          </span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-bold">
                            {c.modality}
                          </span>
                        </div>

                        {/* Action buttons & Step Reorder */}
                        <div className="flex items-center gap-1">
                          {/* Quick Up / Down step buttons */}
                          <div className="flex items-center bg-slate-100 dark:bg-slate-700/80 rounded p-0.5 mr-1">
                            <button
                              type="button"
                              onClick={() => moveCourseStep(c.id, 'up')}
                              disabled={originalIndex === 0}
                              className="p-1 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                              title="Mover curso uma posição para cima"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveCourseStep(c.id, 'down')}
                              disabled={originalIndex === courses.length - 1}
                              className="p-1 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                              title="Mover curso uma posição para baixo"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDuplicateCourse(c)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors flex items-center gap-1"
                            title="Duplicar / Copiar Curso"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCourseEdit(c)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
                            title="Editar Curso"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCourse(c.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Excluir Curso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Períodos/Turnos:</span>
                          {(c.periods && c.periods.length > 0 ? c.periods : [c.shift]).map(p => (
                            <span key={p} className="text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                              {p}
                            </span>
                          ))}
                          <span className="text-slate-400">•</span>
                          <span>{c.semesters} Semestres/Trimestres</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-purple-500" /> Total Alunos:
                        </span>
                        <span className="font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/40">
                          {enrolledCount} estudante(s)
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Turmas Vinculadas ({courseClasses.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {courseClasses.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">Nenhuma turma vinculada a este curso.</span>
                          ) : (
                            courseClasses.map(cls => (
                              <span key={cls.id} className="text-[10px] font-semibold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-300 dark:border-purple-800">
                                {cls.name} ({cls.period})
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: TURMAS CADASTRADAS COM REORDENAÇÃO ARRASTAR E SOLTAR (DRAG & DROP) */}
        {/* ========================================================================= */}
        {activeTab === 'turmas' && (
          <div className="space-y-4">
            {/* Helper Info & Quick Reorder Controls */}
            <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg shrink-0">
                  <Move className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    Organização e Sequência das Turmas
                    <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
                      {classes.length} Turmas
                    </span>
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Clique, segure e arraste qualquer card para definir a ordem desejada. A nova sequência é salva em tempo real.
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
                  onClick={() => handleSortClasses('name-asc')}
                  className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 transition-colors"
                  title="Ordenar Alfabeticamente (A-Z)"
                >
                  Nome (A-Z)
                </button>
                <button
                  type="button"
                  onClick={() => handleSortClasses('period-asc')}
                  className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 transition-colors"
                  title="Ordenar por Período Letivo"
                >
                  Período
                </button>
                <button
                  type="button"
                  onClick={() => handleSortClasses('shift')}
                  className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 transition-colors"
                  title="Ordenar por Turno"
                >
                  Turno
                </button>
              </div>
            </div>

            {/* Reorder feedback message */}
            {reorderSuccessMsg && (
              <div className="p-2.5 bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md animate-in fade-in slide-in-from-top-1 duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{reorderSuccessMsg}</span>
              </div>
            )}

            {/* Turmas Cards Grid with Drag & Drop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes
                .filter(cls => 
                  cls.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  cls.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  cls.period.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((cls, idx) => {
                  const classStudentsCount = students.filter(s => s.classId === cls.id || s.classIds?.includes(cls.id)).length;
                  const isDragging = draggedClassId === cls.id;
                  const isDragOver = dragOverClassId === cls.id && draggedClassId !== cls.id;
                  const originalIndex = classes.findIndex(c => c.id === cls.id);

                  return (
                    <div
                      key={cls.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, cls.id)}
                      onDragOver={(e) => handleDragOver(e, cls.id)}
                      onDrop={(e) => handleDrop(e, cls.id)}
                      onDragEnd={handleDragEnd}
                      className={`relative p-4 bg-white dark:bg-slate-800/80 border rounded-2xl space-y-3 transition-all duration-150 select-none ${
                        isDragging
                          ? 'opacity-40 border-dashed border-emerald-500 scale-[0.98] shadow-inner bg-emerald-50/20'
                          : isDragOver
                          ? 'border-2 border-emerald-500 dark:border-emerald-400 ring-4 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/40 scale-[1.02] shadow-xl'
                          : 'border-slate-200 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {/* Drag Handle Top Bar */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-2">
                          {/* Drag Grip Handle */}
                          <div
                            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
                            title="Clique, segure e arraste para reposicionar esta turma"
                          >
                            <GripVertical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-mono text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                              #{originalIndex + 1}
                            </span>
                          </div>

                          <span className="font-bold text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-emerald-500" />
                            Período {cls.period}
                          </span>
                        </div>

                        {/* Action buttons & Step Reorder */}
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          <div className="flex items-center gap-1 mr-1">
                            {(cls.periods && cls.periods.length > 0 ? cls.periods : [cls.shift]).map(p => (
                              <span key={p} className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800">
                                {p}
                              </span>
                            ))}
                          </div>

                          {/* Quick Up / Down step buttons */}
                          <div className="flex items-center bg-slate-100 dark:bg-slate-700/80 rounded p-0.5 mr-1">
                            <button
                              type="button"
                              onClick={() => moveClassStep(cls.id, 'up')}
                              disabled={originalIndex === 0}
                              className="p-1 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                              title="Mover turma uma posição para cima"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveClassStep(cls.id, 'down')}
                              disabled={originalIndex === classes.length - 1}
                              className="p-1 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                              title="Mover turma uma posição para baixo"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDuplicateClass(cls)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                            title="Duplicar / Copiar Turma"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenClassEdit(cls)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                            title="Editar Turma"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteClass(cls.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Excluir Turma"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Class Details */}
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                            <School className="w-4 h-4 text-emerald-500 shrink-0" />
                            {cls.name}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                          Curso: <strong>{cls.courseName}</strong>
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Turno(s) de Oferta:</span>
                          {(cls.periods && cls.periods.length > 0 ? cls.periods : [cls.shift]).map(p => (
                            <span key={p} className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-500" /> Alunos Matriculados:
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                          {classStudentsCount} estudante(s)
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAIS DE EDIÇÃO                                                          */}
      {/* ========================================================================= */}

      {/* Modal: Edit UC */}
      {editingUC && (
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

            <form onSubmit={handleSaveUCEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Código da UC:</label>
                  <input
                    type="text"
                    value={editUcCode}
                    onChange={(e) => setEditUcCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome da Disciplina / UC:</label>
                  <input
                    type="text"
                    value={editUcName}
                    onChange={(e) => setEditUcName(e.target.value)}
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
                  value={editUcTeacherId}
                  onChange={(e) => setEditUcTeacherId(e.target.value)}
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
                    description="Cursos cadastrados no sistema:"
                    options={courseOptions}
                    selectedIds={editUcCourseIds}
                    onChange={setEditUcCourseIds}
                    colorTheme="purple"
                    emptyMessage="Nenhum curso cadastrado."
                    idPrefix="edit-modal-uc-courses"
                    inlineExpanded={true}
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <MultiSelectDropdown
                    label="Turmas Associadas (Multiturmas):"
                    icon={<School className="w-4 h-4 text-emerald-500" />}
                    placeholder="Selecione as turmas vinculadas..."
                    description="Turmas cadastradas no sistema:"
                    options={classOptions}
                    selectedIds={editUcAdditionalClassIds}
                    onChange={setEditUcAdditionalClassIds}
                    colorTheme="emerald"
                    emptyMessage="Nenhuma turma cadastrada."
                    idPrefix="edit-modal-uc-classes"
                    inlineExpanded={true}
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <SemesterCheckboxes
                  label="Semestre de Aplicação:"
                  icon={<Calendar className="w-4 h-4 text-cyan-500" />}
                  description="Marque os semestres ou trimestres em que a disciplina será aplicada:"
                  selectedSemesters={editUcSelectedSemesters}
                  onChange={handleEditUcSelectedSemestersChange}
                  idPrefix="edit-modal-uc-semesters"
                />
              </div>

              {/* Dynamic lesson boxes per selected stage in Edit modal */}
              {editUcSelectedSemesters.filter(stage => !stage.includes('Anual')).length > 0 && (
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
                        {editUcWorkloadHours} aulas
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {editUcSelectedSemesters.filter(stage => !stage.includes('Anual')).map((stage) => (
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
                            value={editUcPeriodLessons[stage] ?? getDefaultLessonsForStage(stage)}
                            onChange={(e) => handleEditUcPeriodLessonChange(stage, Number(e.target.value))}
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

      {/* Modal: Edit Class */}
      {editingClass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Editar Turma Cadastrada
                  </h3>
                  <p className="text-xs text-slate-500">
                    Altere o nome, curso vinculado, período ou turno da turma.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClassEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome da Turma:
                </label>
                <input
                  type="text"
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Curso Vinculado:
                </label>
                <select
                  value={editClassCourseId}
                  onChange={(e) => setEditClassCourseId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Período Letivo:
                </label>
                <input
                  type="text"
                  value={editClassPeriod}
                  onChange={(e) => setEditClassPeriod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-500" /> Períodos / Turnos de Oferta:
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Selecione um ou mais
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {['Matutino', 'Vespertino', 'Noturno', 'Integral'].map(p => {
                    const isSelected = editClassPeriods.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => toggleEditClassPeriod(p)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span>{p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Course */}
      {editingCourse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Editar Curso Cadastrado
                  </h3>
                  <p className="text-xs text-slate-500">
                    Altere o nome, código, modalidade ou turnos do curso.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourseEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome do Curso:
                </label>
                <input
                  type="text"
                  value={editCourseName}
                  onChange={(e) => setEditCourseName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Código do Curso:
                  </label>
                  <input
                    type="text"
                    value={editCourseCode}
                    onChange={(e) => setEditCourseCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Semestres/Trimestres:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={editCourseSemesters}
                    onChange={(e) => setEditCourseSemesters(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Modalidade:
                </label>
                <select
                  value={editCourseModality}
                  onChange={(e) => setEditCourseModality(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Presencial">Presencial</option>
                  <option value="Híbrido">Híbrido</option>
                  <option value="EAD">EAD</option>
                </select>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-500" /> Períodos / Turnos de Oferta:
                  </label>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                    Selecione um ou mais
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {['Matutino', 'Vespertino', 'Noturno', 'Integral'].map(p => {
                    const isSelected = editCoursePeriods.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => toggleEditPeriod(p)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-purple-500'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span>{p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
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
