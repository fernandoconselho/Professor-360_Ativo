export type UserRole = 'admin' | 'professor' | 'coordenador' | 'orientador' | 'supervisor' | 'aluno';

export interface RoleLabels {
  admin: string;
  professor: string;
  coordenador: string;
  orientador: string;
  supervisor: string;
  aluno: string;
}

export const defaultRoleLabels: RoleLabels = {
  admin: 'Administrador Geral (Perfil 1)',
  professor: 'Professor (Perfil 2)',
  coordenador: 'Coordenador (Perfil 3)',
  orientador: 'Orientador Educacional',
  supervisor: 'Supervisor Educacional',
  aluno: 'Aluno / Estudante'
};

export const defaultRoleOrder: UserRole[] = [
  'professor',
  'coordenador',
  'orientador',
  'supervisor',
  'admin',
  'aluno'
];

export type AcademicStatus = 'Ativo' | 'Trancado' | 'Remanejado' | 'Transferido';

export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  registration: string; // Registro do docente / RA / SIAPE
  role: UserRole;
  password?: string;
  avatarUrl?: string;
  department?: string;
  phone?: string;
  title?: string; // ex: 'Dra.', 'Dr.', 'Me.', 'Ma.', 'Esp.', 'Prof.'
  titulation?: string; // ex: 'Doutorado', 'Mestrado', 'Especialização', 'Graduação', 'Pós-Doutorado'
  bio?: string; // Apresentação / Mini-Currículo
  lattesUrl?: string; // Link Lattes ou Perfil Acadêmico
  formation?: string; // Formação Principal / Área
  officeHours?: string; // Horário de Atendimento / Plantão
  courseIds?: string[];
  classIds?: string[];
  curricularUnitIds?: string[];
  authorized?: boolean;
  status?: string;
}

export type GradeCalculationType = 'sum' | 'average';

export interface Institution {
  id: string;
  name: string;
  code?: string;
  cnpj: string;
  address: string;
  zipCode?: string;
  city?: string;
  state?: string;
  phone: string;
  email: string;
  logoUrl?: string;
  director: string;
  coordinator?: string;
  minPassingGrade: number; // default 6.0
  minAttendancePercentage: number; // default 75
  primaryColor?: string; // Cor principal da instituição (Hex)
  secondaryColor?: string; // Cor secundária/destaque (Hex)
  defaultGradeCalculationType?: GradeCalculationType; // 'sum' (Somatória) ou 'average' (Média)
}

export interface Course {
  id: string;
  institutionId?: string;
  name: string;
  code: string;
  modality: 'Presencial' | 'EAD' | 'Híbrido';
  shift: 'Matutino' | 'Vespertino' | 'Noturno' | 'Integral';
  periods?: string[]; // Múltiplos períodos / turnos de oferta
  semesters: number;
}

export interface CurricularUnit {
  id: string;
  institutionId?: string;
  code: string; // Código da Unidade Curricular (UC)
  name: string;
  teacherId: string;
  teacherName: string;
  teacherRegistration: string;
  courseId: string;
  courseName: string;
  additionalCourseIds?: string[];
  additionalCourseNames?: string[];
  classId: string;
  className: string;
  additionalClassIds?: string[];
  additionalClassNames?: string[];
  semester: string; // e.g. "1º Semestre"
  semesters?: string[]; // Múltiplos semestres/trimestres de aplicação
  trimester?: string;
  periodLessons?: Record<string, number>; // Quantidade de aulas por etapa selecionada (ex: { '1° Trimestre': 40, '2° Trimestre': 40 })
  shift: 'Matutino' | 'Vespertino' | 'Noturno' | 'Integral';
  workloadHours: number; // e.g. 80 horas
  gradeCalculationType?: GradeCalculationType; // 'sum' (Somatória) ou 'average' (Média)
}

export interface Student {
  id: string;
  institutionId?: string;
  fullName: string;
  academicRegistration: string; // RA
  cpf: string;
  birthDate: string;
  email: string;
  courseId: string;
  courseName: string;
  classId: string;
  className: string;
  classIds?: string[]; // Múltiplas turmas associadas ao aluno
  period: string; // e.g. "2026/1"
  photoUrl?: string;
  status: AcademicStatus; // Ativo (Verde), Trancado (Laranja), Remanejado (Roxo), Transferido (Vermelho)
}

export interface ClassTurma {
  id: string;
  institutionId?: string;
  name: string; // e.g. "Turma ADS-2026A"
  courseId: string;
  courseName: string;
  period: string; // e.g. "2026.1"
  shift: 'Matutino' | 'Vespertino' | 'Noturno' | 'Integral';
  periods?: string[]; // Múltiplos períodos / turnos de oferta
}

export interface AVAActivity {
  id: string;
  institutionId?: string;
  period: 'p1' | 'p2'; // 1º Período (p1 - Síntese 1) ou 2º Período (p2 - Síntese 2)
  name: string; // e.g. "Atividade 1", "Trabalho Final", "Prova"
  weight: number; // e.g. 1.0
  maxScore: number; // e.g. 10.0 or 3.0
}

export interface StudentAVAGrades {
  studentId: string;
  ucId: string;
  institutionId?: string;
  p1Grades: Record<string, number>; // activityId -> score (1º Período / Síntese 1)
  p2Grades: Record<string, number>; // activityId -> score (2º Período / Síntese 2)
  recoveryGrade?: number; // Recuperação
}

export interface TrimesterAttendanceStats {
  totalClasses: number;
  totalPresences: number;
  totalAbsences: number;
  attendancePercentage: number;
  absencePercentage: number;
  attendanceStatus: 'Frequência Regular' | 'Em Risco' | 'Reprovado por Falta';
}

export interface ComputedAVAResult {
  studentId: string;
  studentName: string;
  academicRegistration: string;
  classId?: string;
  className?: string;
  status: AcademicStatus;
  sintese1: number; // Síntese 1
  sintese2: number; // Síntese 2
  notaParcial: number;
  recuperacao?: number;
  notaFinal: number;
  calculationType: GradeCalculationType;
  totalClasses: number;
  totalPresences: number;
  totalAbsences: number;
  attendancePercentage: number;
  absencePercentage: number;
  gradeStatus: 'APROVADO' | 'REPROVADO';
  attendanceStatus: 'Frequência Regular' | 'Em Risco' | 'Reprovado por Falta';
  finalAcademicStatus: 'APROVADO' | 'REPROVADO' | 'REPROVADO POR FALTA';
  trimesterStats?: Record<string, TrimesterAttendanceStats>;
}

export interface DailyAttendanceRecord {
  id: string;
  institutionId?: string;
  ucId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  lessonCount: number; // Qtd de aulas do dia (e.g., 2, 4)
  contentTaught: string;
  presences: Record<string, boolean>; // studentId -> true (Presente) / false (Ausente)
  createdAt: string;
  trimester?: '1º Trimestre' | '2º Trimestre' | '3º Trimestre' | string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
}

export interface DeletionReport {
  id: string;
  deletedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    registration: string;
    role: string;
  };
  targetType: 'all' | 'selected' | 'single';
  totalLogsDeleted: number;
  logsSnapshot: {
    timestamp: string;
    userName: string;
    userRole: string;
    action: string;
    details: string;
  }[];
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  read: boolean;
  studentId?: string;
  ucId?: string;
}
