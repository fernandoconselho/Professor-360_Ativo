import {
  Institution,
  Course,
  CurricularUnit,
  Student,
  ClassTurma,
  User,
  AVAActivity,
  StudentAVAGrades,
  DailyAttendanceRecord,
  AuditLog,
  SystemNotification
} from './types';

export const initialUsers: User[] = [
  {
    id: 'u-admin',
    name: 'Dr. Roberto Santos',
    email: 'admin@avamais.edu.br',
    cpf: '111.222.333-00',
    registration: 'ADM-001',
    role: 'admin',
    password: '123456',
    department: 'Reitoria e Tecnologia',
    phone: '(11) 98888-0001',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'u-prof1',
    name: 'Profª. Dra. Mariana Oliveira',
    email: 'mariana.oliveira@avamais.edu.br',
    cpf: '222.333.444-11',
    registration: 'DOC-2024-089',
    role: 'professor',
    title: 'Dra.',
    titulation: 'Doutorado',
    formation: 'Doutora em Engenharia de Software e Ciência da Computação (USP)',
    department: 'Corpo Docente Titular',
    phone: '(11) 97777-0002',
    bio: 'Docente titular com mais de 12 anos de experiência acadêmica em Engenharia de Software, Algoritmos Avançados, Gestão Educacional e Arquitetura de Sistemas.',
    lattesUrl: 'http://lattes.cnpq.br/1234567890123456',
    officeHours: 'Segundas e Quartas das 17h00 às 18h30 (Sala de Docentes 04 / Google Meet)',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    courseIds: [],
    classIds: [],
    curricularUnitIds: []
  },
  {
    id: 'u-prof2',
    name: 'Prof. Me. Carlos Eduardo Lima',
    email: 'carlos.lima@avamais.edu.br',
    cpf: '333.444.555-22',
    registration: 'DOC-2024-102',
    role: 'professor',
    department: 'Sistemas de Informação',
    phone: '(11) 96666-0003',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    courseIds: [],
    classIds: [],
    curricularUnitIds: []
  },
  {
    id: 'u-coord',
    name: 'Profa. Fernanda Albuquerque',
    email: 'coordenacao@avamais.edu.br',
    cpf: '444.555.666-33',
    registration: 'CRD-2023-010',
    role: 'coordenador',
    department: 'Coordenação Acadêmica Geral',
    phone: '(11) 95555-0004',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'u-orientador',
    name: 'Profª. Laura Vasconcelos',
    email: 'orientacao@avamais.edu.br',
    cpf: '666.777.888-55',
    registration: 'ORI-2024-001',
    role: 'orientador',
    department: 'Orientação Educacional e Pedagógica',
    phone: '(11) 93333-0006',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'u-supervisor',
    name: 'Prof. Marcos Vinícius Melo',
    email: 'supervisao@avamais.edu.br',
    cpf: '777.888.999-66',
    registration: 'SUP-2024-002',
    role: 'supervisor',
    department: 'Supervisão Educacional e Curricular',
    phone: '(11) 92222-0007',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
  }
];

export const initialInstitutions: Institution[] = [
  {
    id: 'inst-01',
    name: 'Faculdade de Tecnologia AVA+ Presença',
    code: 'FATEC-AVA',
    cnpj: '12.345.678/0001-90',
    address: 'Av. Paulista, 1500 - Bela Vista',
    zipCode: '01310-200',
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 3100-2000',
    email: 'contato@avamais.edu.br',
    logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=300',
    director: 'Prof. Dr. Alexandre Vance',
    coordinator: 'Profa. Fernanda Albuquerque',
    minPassingGrade: 6.0,
    minAttendancePercentage: 75,
    primaryColor: '#002B5B', // Azul Marinho
    secondaryColor: '#40E0D0' // Turquesa AVA+
  },
  {
    id: 'inst-02',
    name: 'Instituto Politécnico Central de Educação',
    code: 'IPCE',
    cnpj: '98.765.432/0001-10',
    address: 'Rua das Acácias, 800 - Jardim Botânico',
    zipCode: '13083-970',
    city: 'Campinas',
    state: 'SP',
    phone: '(19) 3521-4000',
    email: 'secretaria@politecnico-central.edu.br',
    logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=300',
    director: 'Prof. Dr. Roberto Guimarães',
    coordinator: 'Profª. Sandra Mendes',
    minPassingGrade: 7.0,
    minAttendancePercentage: 80,
    primaryColor: '#1E3A8A', // Azul Real
    secondaryColor: '#10B981' // Verde Esmeralda
  }
];

export const initialInstitution: Institution = initialInstitutions[0];

// Todas as turmas, alunos e cursos foram excluídos conforme solicitado
export const initialCourses: Course[] = [];

export const initialClasses: ClassTurma[] = [];

export const initialCurricularUnits: CurricularUnit[] = [];

export const initialStudents: Student[] = [];

export const initialAVAActivities: AVAActivity[] = [
  // Templates de Atividades Padrão para novas disciplinas (P1 - Síntese 1 e P2 - Síntese 2)
  { id: 'act-p1-1', institutionId: 'inst-01', period: 'p1', name: 'Atividade 1 - Questionário Individual', weight: 1.0, maxScore: 2.0 },
  { id: 'act-p1-2', institutionId: 'inst-01', period: 'p1', name: 'Atividade 2 - Prática em Laboratório', weight: 1.0, maxScore: 3.0 },
  { id: 'act-p1-3', institutionId: 'inst-01', period: 'p1', name: 'Prova P1 - Teórica e Prática', weight: 1.0, maxScore: 5.0 },
  { id: 'act-p2-1', institutionId: 'inst-01', period: 'p2', name: 'Trabalho de Campo / Seminário', weight: 1.0, maxScore: 3.0 },
  { id: 'act-p2-2', institutionId: 'inst-01', period: 'p2', name: 'Projeto Integrador de Software', weight: 1.0, maxScore: 3.0 },
  { id: 'act-p2-3', institutionId: 'inst-01', period: 'p2', name: 'Prova P2 - Avaliação Final', weight: 1.0, maxScore: 4.0 }
];

export const initialStudentAVAGrades: StudentAVAGrades[] = [];

export const initialAttendanceRecords: DailyAttendanceRecord[] = [];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-clean-all-data',
    timestamp: new Date().toISOString(),
    userId: 'u-admin',
    userName: 'Dr. Roberto Santos',
    userRole: 'admin',
    action: 'Limpeza de Dados Cadastrais',
    details: 'Exclusão completa de todas as turmas, alunos e cursos cadastrados no sistema.'
  }
];

export const initialNotifications: SystemNotification[] = [];
