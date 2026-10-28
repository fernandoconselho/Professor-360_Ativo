import {
  Student,
  AVAActivity,
  StudentAVAGrades,
  DailyAttendanceRecord,
  ComputedAVAResult,
  GradeCalculationType
} from '../types';

export function getTrimesterFromDate(dateStr?: string): '1º Trimestre' | '2º Trimestre' | '3º Trimestre' {
  if (!dateStr) return '1º Trimestre';
  const parts = dateStr.split('-');
  const month = parseInt(parts[1], 10);
  if (isNaN(month) || month <= 4) return '1º Trimestre';
  if (month <= 8) return '2º Trimestre';
  return '3º Trimestre';
}

export function computeStudentResult(
  student: Student,
  ucId: string,
  activities: AVAActivity[] = [],
  gradesList: StudentAVAGrades[] = [],
  attendanceList: DailyAttendanceRecord[] = [],
  minPassingGrade: number = 6.0,
  minAttendancePercentage: number = 75,
  calculationType: GradeCalculationType = 'sum'
): ComputedAVAResult {
  if (!student) {
    return {
      studentId: '',
      studentName: 'Aluno Não Identificado',
      academicRegistration: '',
      status: 'Ativo',
      sintese1: 0,
      sintese2: 0,
      notaParcial: 0,
      recuperacao: undefined,
      notaFinal: 0,
      calculationType,
      totalClasses: 0,
      totalPresences: 0,
      totalAbsences: 0,
      attendancePercentage: 100,
      absencePercentage: 0,
      gradeStatus: 'REPROVADO',
      attendanceStatus: 'Frequência Regular',
      finalAcademicStatus: 'REPROVADO',
      trimesterStats: {
        '1º Trimestre': { totalClasses: 0, totalPresences: 0, totalAbsences: 0, attendancePercentage: 100, absencePercentage: 0, attendanceStatus: 'Frequência Regular' },
        '2º Trimestre': { totalClasses: 0, totalPresences: 0, totalAbsences: 0, attendancePercentage: 100, absencePercentage: 0, attendanceStatus: 'Frequência Regular' },
        '3º Trimestre': { totalClasses: 0, totalPresences: 0, totalAbsences: 0, attendancePercentage: 100, absencePercentage: 0, attendanceStatus: 'Frequência Regular' }
      }
    };
  }

  // Find grade record for this student and UC
  const studentGrades = gradesList.find(
    g => g.studentId === student.id && g.ucId === ucId
  );

  const p1Activities = (activities || []).filter(a => a && a.period === 'p1');
  const p2Activities = (activities || []).filter(a => a && a.period === 'p2');

  let p1Sum = 0;
  p1Activities.forEach(act => {
    const val = studentGrades?.p1Grades?.[act.id] ?? 0;
    p1Sum += Number(val) || 0;
  });

  let p2Sum = 0;
  p2Activities.forEach(act => {
    const val = studentGrades?.p2Grades?.[act.id] ?? 0;
    p2Sum += Number(val) || 0;
  });

  let sintese1 = 0;
  let sintese2 = 0;
  let notaParcial = 0;

  if (calculationType === 'average') {
    // Média: síntese é a média das atividades do período, e nota parcial é a média das sínteses
    sintese1 = p1Activities.length > 0 ? (p1Sum / p1Activities.length) : 0;
    sintese2 = p2Activities.length > 0 ? (p2Sum / p2Activities.length) : 0;

    const activePeriods = [
      p1Activities.length > 0 ? sintese1 : null,
      p2Activities.length > 0 ? sintese2 : null
    ].filter(s => s !== null) as number[];

    if (activePeriods.length > 0) {
      const sumActive = activePeriods.reduce((acc, curr) => acc + curr, 0);
      notaParcial = Number((sumActive / activePeriods.length).toFixed(2));
    } else {
      notaParcial = 0;
    }
  } else {
    // Somatória: soma das notas de cada atividade (Síntese 1 + Síntese 2)
    sintese1 = p1Sum;
    sintese2 = p2Sum;
    notaParcial = Number((sintese1 + sintese2).toFixed(2));
  }

  const recuperacao = studentGrades?.recoveryGrade;
  let notaFinal = notaParcial;
  if (recuperacao !== undefined && recuperacao !== null && !isNaN(Number(recuperacao))) {
    notaFinal = Math.max(notaParcial, Number(recuperacao));
  }
  notaFinal = Number(notaFinal.toFixed(2));

  // Attendance calculation (Global e por Trimestre)
  const ucAttendance = (attendanceList || []).filter(a => a && a.ucId === ucId);
  let totalClasses = 0;
  let totalPresences = 0;

  const trimesterStatsMap: Record<string, { totalClasses: number; totalPresences: number; totalAbsences: number; attendancePercentage: number; absencePercentage: number; attendanceStatus: 'Frequência Regular' | 'Em Risco' | 'Reprovado por Falta' }> = {
    '1º Trimestre': { totalClasses: 0, totalPresences: 0, totalAbsences: 0, attendancePercentage: 100, absencePercentage: 0, attendanceStatus: 'Frequência Regular' },
    '2º Trimestre': { totalClasses: 0, totalPresences: 0, totalAbsences: 0, attendancePercentage: 100, absencePercentage: 0, attendanceStatus: 'Frequência Regular' },
    '3º Trimestre': { totalClasses: 0, totalPresences: 0, totalAbsences: 0, attendancePercentage: 100, absencePercentage: 0, attendanceStatus: 'Frequência Regular' }
  };

  ucAttendance.forEach(record => {
    const lessons = Number(record.lessonCount) || 1;
    totalClasses += lessons;
    const isPresent = Boolean(student.id && record.presences?.[student.id]);
    if (isPresent) {
      totalPresences += lessons;
    }

    // Identificar trimestre do registro
    const tri = (record.trimester && trimesterStatsMap[record.trimester])
      ? record.trimester
      : getTrimesterFromDate(record.date);

    if (trimesterStatsMap[tri]) {
      trimesterStatsMap[tri].totalClasses += lessons;
      if (isPresent) {
        trimesterStatsMap[tri].totalPresences += lessons;
      }
    }
  });

  // Finalizar cálculos por trimestre
  Object.keys(trimesterStatsMap).forEach(key => {
    const st = trimesterStatsMap[key];
    st.totalAbsences = Math.max(0, st.totalClasses - st.totalPresences);
    st.attendancePercentage = st.totalClasses > 0
      ? Number(((st.totalPresences / st.totalClasses) * 100).toFixed(1))
      : 100;
    st.absencePercentage = Number((100 - st.attendancePercentage).toFixed(1));
    if (st.attendancePercentage < 70) {
      st.attendanceStatus = 'Reprovado por Falta';
    } else if (st.attendancePercentage < minAttendancePercentage) {
      st.attendanceStatus = 'Em Risco';
    } else {
      st.attendanceStatus = 'Frequência Regular';
    }
  });

  const totalAbsences = Math.max(0, totalClasses - totalPresences);
  const attendancePercentage = totalClasses > 0
    ? Number(((totalPresences / totalClasses) * 100).toFixed(1))
    : 100;
  const absencePercentage = Number((100 - attendancePercentage).toFixed(1));

  let gradeStatus: 'APROVADO' | 'REPROVADO' = notaFinal >= minPassingGrade ? 'APROVADO' : 'REPROVADO';
  let attendanceStatus: 'Frequência Regular' | 'Em Risco' | 'Reprovado por Falta' = 'Frequência Regular';

  if (attendancePercentage < 70) {
    attendanceStatus = 'Reprovado por Falta';
  } else if (attendancePercentage < minAttendancePercentage) {
    attendanceStatus = 'Em Risco';
  }

  let finalAcademicStatus: 'APROVADO' | 'REPROVADO' | 'REPROVADO POR FALTA' = 'APROVADO';
  if (attendancePercentage < minAttendancePercentage) {
    finalAcademicStatus = 'REPROVADO POR FALTA';
  } else if (notaFinal < minPassingGrade) {
    finalAcademicStatus = 'REPROVADO';
  }

  return {
    studentId: student.id || '',
    studentName: student.fullName || 'Aluno Sem Nome',
    academicRegistration: student.academicRegistration || 'S/RA',
    classId: student.classId,
    className: student.className,
    status: student.status || 'Ativo',
    sintese1: Number(sintese1.toFixed(2)),
    sintese2: Number(sintese2.toFixed(2)),
    notaParcial: isNaN(notaParcial) ? 0 : notaParcial,
    recuperacao,
    notaFinal: isNaN(notaFinal) ? 0 : notaFinal,
    calculationType,
    totalClasses,
    totalPresences,
    totalAbsences,
    attendancePercentage,
    absencePercentage,
    gradeStatus,
    attendanceStatus,
    finalAcademicStatus,
    trimesterStats: trimesterStatsMap
  };
}

export function getCalculationTypeLabel(type: GradeCalculationType = 'sum'): string {
  return type === 'average'
    ? 'Média Aritmética (Média das Atividades)'
    : 'Somatória (Soma das Atividades)';
}

export function getCalculationTypeShortLabel(type: GradeCalculationType = 'sum'): string {
  return type === 'average' ? 'Média' : 'Somatória';
}

export function getCalculationTypeDescription(type: GradeCalculationType = 'sum'): string {
  return type === 'average'
    ? 'O professor faz a média dos valores obtidos em cada atividade dentro do período, construindo a síntese da nota final.'
    : 'O professor faz a soma das notas de cada atividade aplicada, em cada período (Síntese 1 + Síntese 2).';
}

export function getStatusBadgeStyle(status: string) {
  switch (status) {
    case 'Trancado':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'; // TR = Laranja
    case 'Remanejado':
      return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'; // RE = Roxo
    case 'Transferido':
      return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'; // TF = Vermelho
    case 'Ativo':
    default:
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'; // Ativo = Verde
  }
}

export function getStatusAbbreviation(status: string) {
  switch (status) {
    case 'Trancado': return 'TR';
    case 'Remanejado': return 'RE';
    case 'Transferido': return 'TF';
    case 'Ativo':
    default: return 'A';
  }
}
