import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, changeUserPassword } from '../firebase';
import {
  User,
  UserRole,
  RoleLabels,
  defaultRoleLabels,
  defaultRoleOrder,
  Institution,
  Course,
  CurricularUnit,
  Student,
  ClassTurma,
  AVAActivity,
  StudentAVAGrades,
  DailyAttendanceRecord,
  AuditLog,
  DeletionReport,
  SystemNotification,
  ComputedAVAResult,
  GradeCalculationType
} from '../types';
import {
  initialUsers,
  initialInstitutions,
  initialInstitution,
  initialCourses,
  initialClasses,
  initialCurricularUnits,
  initialStudents,
  initialAVAActivities,
  initialStudentAVAGrades,
  initialAttendanceRecords,
  initialAuditLogs,
  initialNotifications
} from '../mockData';
import { computeStudentResult } from '../utils/avaCalculations';

interface AppContextType {
  // Authentication & Session
  firebaseUser: FirebaseUser | null;
  isAuthLoading: boolean;
  isDataLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;

  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;

  roleLabels: RoleLabels;
  updateRoleLabels: (labels: Partial<RoleLabels>) => void;
  resetRoleLabels: () => void;
  getRoleLabel: (role: UserRole) => string;

  roleOrder: UserRole[];
  updateRoleOrder: (order: UserRole[]) => void;
  resetRoleOrder: () => void;

  // Multi-Instituição (Até 3 cadastros)
  institutions: Institution[];
  selectedInstitutionId: string;
  setSelectedInstitutionId: (id: string) => void;
  institution: Institution;
  updateInstitution: (data: Partial<Institution>, targetId?: string) => void;
  addInstitution: (inst: Institution) => boolean;
  deleteInstitution: (id: string) => boolean;

  // Cursos (Escopados para a instituição ativa do docente)
  courses: Course[];
  allCourses: Course[];
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  reorderCourses: (reordered: Course[]) => void;

  // Unidades Curriculares (Escopadas)
  curricularUnits: CurricularUnit[];
  allCurricularUnits: CurricularUnit[];
  addCurricularUnit: (uc: CurricularUnit) => void;
  updateCurricularUnit: (uc: CurricularUnit) => void;
  deleteCurricularUnit: (id: string) => void;
  reorderCurricularUnits: (reordered: CurricularUnit[]) => void;

  selectedUCId: string;
  setSelectedUCId: (id: string) => void;
  selectedUC: CurricularUnit | undefined;
  updateGradeCalculationType: (ucId: string, type: GradeCalculationType) => void;

  // Turmas (Escopadas)
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  selectedClass: ClassTurma | undefined;
  classes: ClassTurma[];
  allClasses: ClassTurma[];
  addClass: (cls: ClassTurma) => void;
  updateClass: (cls: ClassTurma) => void;
  deleteClass: (id: string) => void;
  reorderClasses: (reordered: ClassTurma[]) => void;

  // Estudantes (Escopados)
  students: Student[];
  allStudents: Student[];
  addStudent: (student: Student) => void;
  addStudents: (students: Student[]) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;

  // Atividades AVA (Escopadas)
  avaActivities: AVAActivity[];
  allAvaActivities: AVAActivity[];
  addAVAActivity: (act: AVAActivity) => void;
  updateAVAActivity: (act: AVAActivity) => void;
  deleteAVAActivity: (id: string) => void;
  resetAVAActivitiesToDefault: () => void;

  // Notas e Recuperação (Escopadas)
  studentGrades: StudentAVAGrades[];
  updateStudentGrade: (studentId: string, ucId: string, period: 'p1' | 'p2', activityId: string, score: number) => void;
  updateRecoveryGrade: (studentId: string, ucId: string, score: number | undefined) => void;

  // Registro de Presença / Frequência (Escopados)
  attendanceRecords: DailyAttendanceRecord[];
  addAttendanceRecord: (record: DailyAttendanceRecord) => void;
  updateAttendanceRecord: (record: DailyAttendanceRecord) => void;
  deleteAttendanceRecord: (id: string) => void;

  // Auditoria e Relatórios
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string) => void;
  deleteAuditLog: (id: string) => void;
  deleteAuditLogs: (ids: string[]) => void;
  clearAuditLogs: () => void;

  deletionReports: DeletionReport[];
  addDeletionReport: (report: DeletionReport) => void;

  // Notificações
  notifications: SystemNotification[];
  markNotificationAsRead: (id: string) => void;
  addNotification: (title: string, message: string, type: 'danger' | 'warning' | 'info' | 'success', studentId?: string, ucId?: string) => void;

  computedResults: ComputedAVAResult[];

  isDarkMode: boolean;
  toggleDarkMode: () => void;

  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // User Profile
  const [currentUser, setCurrentUser] = useState<User>({
    id: '',
    name: 'Docente',
    email: '',
    cpf: '',
    registration: '',
    role: 'professor',
    authorized: false
  });

  // Admin users list (for admin dashboard / teacher management)
  const [users, setUsers] = useState<User[]>([]);

  // Roles configuration
  const [roleLabels, setRoleLabels] = useState<RoleLabels>(defaultRoleLabels);
  const [roleOrder, setRoleOrder] = useState<UserRole[]>(defaultRoleOrder);

  // Multi-Institution State (up to 3)
  const [institutions, setInstitutions] = useState<Institution[]>([initialInstitution]);
  const [selectedInstitutionId, setSelectedInstitutionIdState] = useState<string>(initialInstitution.id);

  // Scoped Data Stores for the Authenticated Teacher
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allClasses, setAllClasses] = useState<ClassTurma[]>([]);
  const [allCurricularUnits, setAllCurricularUnits] = useState<CurricularUnit[]>([]);
  const [selectedUCId, setSelectedUCId] = useState<string>('');
  const [selectedClassId, setSelectedClassIdState] = useState<string>('');
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allAvaActivities, setAllAvaActivities] = useState<AVAActivity[]>([]);
  const [allStudentGrades, setAllStudentGrades] = useState<StudentAVAGrades[]>([]);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<DailyAttendanceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [deletionReports, setDeletionReports] = useState<DeletionReport[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ava_dark_mode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ava_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const clearAuthError = () => setAuthError(null);

  // Effective Institution
  const effectiveInstitutionId = useMemo(() => {
    const found = institutions.find(i => i.id === selectedInstitutionId);
    if (found) return found.id;
    return institutions[0]?.id || 'inst-01';
  }, [institutions, selectedInstitutionId]);

  const activeInstitution = useMemo(() => {
    return institutions.find(i => i.id === effectiveInstitutionId) || institutions[0] || initialInstitution;
  }, [institutions, effectiveInstitutionId]);

  const defaultInstId = institutions[0]?.id || 'inst-01';

  // Scoped data views for current institution
  const courses = useMemo(() => {
    return allCourses.filter(c => (c.institutionId || defaultInstId) === effectiveInstitutionId);
  }, [allCourses, effectiveInstitutionId, defaultInstId]);

  const classes = useMemo(() => {
    return allClasses.filter(c => (c.institutionId || defaultInstId) === effectiveInstitutionId);
  }, [allClasses, effectiveInstitutionId, defaultInstId]);

  const curricularUnits = useMemo(() => {
    return allCurricularUnits.filter(u => (u.institutionId || defaultInstId) === effectiveInstitutionId);
  }, [allCurricularUnits, effectiveInstitutionId, defaultInstId]);

  const students = useMemo(() => {
    return allStudents
      .filter(s => (s.institutionId || defaultInstId) === effectiveInstitutionId)
      .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'pt-BR', { sensitivity: 'base' }));
  }, [allStudents, effectiveInstitutionId, defaultInstId]);

  const avaActivities = useMemo(() => {
    const scoped = allAvaActivities.filter(a => (a.institutionId || defaultInstId) === effectiveInstitutionId);
    if (scoped.length > 0) return scoped;
    return initialAVAActivities.map(a => ({ ...a, id: `${a.id}-${effectiveInstitutionId}`, institutionId: effectiveInstitutionId }));
  }, [allAvaActivities, effectiveInstitutionId, defaultInstId]);

  const studentGrades = useMemo(() => {
    return allStudentGrades.filter(g => (g.institutionId || defaultInstId) === effectiveInstitutionId);
  }, [allStudentGrades, effectiveInstitutionId, defaultInstId]);

  const attendanceRecords = useMemo(() => {
    return allAttendanceRecords.filter(r => (r.institutionId || defaultInstId) === effectiveInstitutionId);
  }, [allAttendanceRecords, effectiveInstitutionId, defaultInstId]);

  const selectedUC = useMemo(() => {
    const found = curricularUnits.find(u => u.id === selectedUCId);
    if (found) return found;
    return curricularUnits[0] || undefined;
  }, [curricularUnits, selectedUCId]);

  const selectedClass = useMemo(() => {
    if (selectedClassId) {
      const found = classes.find(c => c.id === selectedClassId);
      if (found) return found;
    }
    return classes[0] || undefined;
  }, [classes, selectedClassId]);

  const setSelectedClassId = (id: string) => {
    setSelectedClassIdState(id);
    if (id) {
      const cls = classes.find(c => c.id === id);
      const matchingUC = curricularUnits.find(u =>
        u.classId === id ||
        (u.additionalClassIds && u.additionalClassIds.includes(id)) ||
        (cls && u.className === cls.name)
      );
      if (matchingUC) {
        setSelectedUCId(matchingUC.id);
      }
    }
  };

  const setSelectedInstitutionId = (id: string) => {
    setSelectedInstitutionIdState(id);
    const ucsForNewInst = allCurricularUnits.filter(u => (u.institutionId || defaultInstId) === id);
    if (ucsForNewInst.length > 0) {
      setSelectedUCId(ucsForNewInst[0].id);
    } else {
      setSelectedUCId('');
    }
  };

  // Sync selectedClassId and selectedUCId
  useEffect(() => {
    if (classes.length > 0) {
      const match = classes.find(c => c.id === selectedClassId);
      if (!match) {
        setSelectedClassIdState(classes[0].id);
      }
    } else {
      setSelectedClassIdState('');
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (curricularUnits.length > 0) {
      const match = curricularUnits.find(u => u.id === selectedUCId);
      if (!match) {
        setSelectedUCId(curricularUnits[0].id);
      }
    } else {
      setSelectedUCId('');
    }
  }, [curricularUnits, selectedUCId]);

  // Compute student results for current UC
  const computedResults: ComputedAVAResult[] = useMemo(() => {
    if (!selectedUC) return [];

    const filteredStudents = students.filter(s => {
      const studentClassIds = s.classIds && s.classIds.length > 0 ? s.classIds : [s.classId];
      if (selectedClass) {
        const inClass = studentClassIds.includes(selectedClass.id) || (s.className && s.className === selectedClass.name);
        if (!inClass) return false;
      }
      const matchesClass = Boolean(selectedUC.classId && studentClassIds.includes(selectedUC.classId));
      const matchesCourse = Boolean(selectedUC.courseId && s.courseId === selectedUC.courseId);
      const matchesAdditionalClass = Boolean(selectedUC.additionalClassIds && selectedUC.additionalClassIds.some(cid => studentClassIds.includes(cid)));
      const matchesAdditionalCourse = Boolean(selectedUC.additionalCourseIds && selectedUC.additionalCourseIds.includes(s.courseId));
      return matchesClass || matchesCourse || matchesAdditionalClass || matchesAdditionalCourse || Boolean(selectedClass);
    });

    const calcType: GradeCalculationType = selectedUC.gradeCalculationType || activeInstitution.defaultGradeCalculationType || 'sum';

    return filteredStudents.map(student => {
      return computeStudentResult(
        student,
        selectedUC.id,
        avaActivities,
        studentGrades,
        attendanceRecords,
        activeInstitution.minPassingGrade,
        activeInstitution.minAttendancePercentage,
        calcType
      );
    });
  }, [selectedUC, selectedClass, students, avaActivities, studentGrades, attendanceRecords, activeInstitution]);

  // Load Teacher-Isolated Data from Firestore
  const loadTeacherData = async (userUid: string, userProfile: User) => {
    setIsDataLoading(true);
    try {
      // 1. Institutions
      const instRef = collection(db, 'users', userUid, 'institutions');
      const instSnap = await getDocs(instRef);
      if (instSnap.empty) {
        // First-time teacher initial setup: create default institution
        await setDoc(doc(db, 'users', userUid, 'institutions', initialInstitution.id), initialInstitution);
        setInstitutions([initialInstitution]);
        setSelectedInstitutionIdState(initialInstitution.id);
      } else {
        const loadedInsts = instSnap.docs.map(d => d.data() as Institution);
        setInstitutions(loadedInsts);
        setSelectedInstitutionIdState(loadedInsts[0]?.id || initialInstitution.id);
      }

      // 2. Courses
      const coursesRef = collection(db, 'users', userUid, 'courses');
      const coursesSnap = await getDocs(coursesRef);
      if (!coursesSnap.empty) {
        setAllCourses(coursesSnap.docs.map(d => d.data() as Course));
      } else {
        // Initialize with standard template courses for quick onboarding if desired
        const sampleCourse = initialCourses[0];
        await setDoc(doc(db, 'users', userUid, 'courses', sampleCourse.id), sampleCourse);
        setAllCourses([sampleCourse]);
      }

      // 3. Classes
      const classesRef = collection(db, 'users', userUid, 'classes');
      const classesSnap = await getDocs(classesRef);
      if (!classesSnap.empty) {
        setAllClasses(classesSnap.docs.map(d => d.data() as ClassTurma));
      } else {
        const sampleClass = initialClasses[0];
        await setDoc(doc(db, 'users', userUid, 'classes', sampleClass.id), sampleClass);
        setAllClasses([sampleClass]);
      }

      // 4. Curricular Units
      const ucsRef = collection(db, 'users', userUid, 'curricularUnits');
      const ucsSnap = await getDocs(ucsRef);
      if (!ucsSnap.empty) {
        setAllCurricularUnits(ucsSnap.docs.map(d => d.data() as CurricularUnit));
      } else {
        const sampleUC = {
          ...initialCurricularUnits[0],
          teacherId: userUid,
          teacherName: userProfile.name,
          teacherRegistration: userProfile.registration
        };
        await setDoc(doc(db, 'users', userUid, 'curricularUnits', sampleUC.id), sampleUC);
        setAllCurricularUnits([sampleUC]);
      }

      // 5. Students
      const studentsRef = collection(db, 'users', userUid, 'students');
      const studentsSnap = await getDocs(studentsRef);
      if (!studentsSnap.empty) {
        setAllStudents(studentsSnap.docs.map(d => d.data() as Student));
      } else {
        // Initialize with default demo student roster so professor can immediately test AVA
        const sampleStudents = initialStudents.slice(0, 5);
        for (const s of sampleStudents) {
          await setDoc(doc(db, 'users', userUid, 'students', s.id), s);
        }
        setAllStudents(sampleStudents);
      }

      // 6. Activities
      const activitiesRef = collection(db, 'users', userUid, 'activities');
      const actSnap = await getDocs(activitiesRef);
      if (!actSnap.empty) {
        setAllAvaActivities(actSnap.docs.map(d => d.data() as AVAActivity));
      } else {
        for (const a of initialAVAActivities) {
          await setDoc(doc(db, 'users', userUid, 'activities', a.id), a);
        }
        setAllAvaActivities(initialAVAActivities);
      }

      // 7. Grades
      const gradesRef = collection(db, 'users', userUid, 'grades');
      const gradesSnap = await getDocs(gradesRef);
      if (!gradesSnap.empty) {
        setAllStudentGrades(gradesSnap.docs.map(d => d.data() as StudentAVAGrades));
      } else {
        setAllStudentGrades([]);
      }

      // 8. Attendance Records
      const attRef = collection(db, 'users', userUid, 'attendance');
      const attSnap = await getDocs(attRef);
      if (!attSnap.empty) {
        setAllAttendanceRecords(attSnap.docs.map(d => d.data() as DailyAttendanceRecord));
      } else {
        setAllAttendanceRecords([]);
      }

      // 9. Audit Logs
      const logsRef = collection(db, 'users', userUid, 'auditLogs');
      const logsSnap = await getDocs(logsRef);
      if (!logsSnap.empty) {
        setAuditLogs(logsSnap.docs.map(d => d.data() as AuditLog));
      } else {
        setAuditLogs([]);
      }

      // 10. Notifications
      const notifRef = collection(db, 'users', userUid, 'notifications');
      const notifSnap = await getDocs(notifRef);
      if (!notifSnap.empty) {
        setNotifications(notifSnap.docs.map(d => d.data() as SystemNotification));
      } else {
        setNotifications(initialNotifications);
      }

      // If user is admin, also fetch system users list for the management dashboard
      if (userProfile.role === 'admin' || userProfile.email === 'fernandoconselho@gmail.com') {
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef).catch(() => null);
        if (usersSnap && !usersSnap.empty) {
          setUsers(usersSnap.docs.map(d => d.data() as User));
        } else {
          setUsers([userProfile]);
        }
      }
    } catch (err: unknown) {
      console.error('Error loading teacher isolated data from Firestore:', err);
    } finally {
      setIsDataLoading(false);
    }
  };

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(true);
      if (!user) {
        setFirebaseUser(null);
        setCurrentUser({
          id: '',
          name: '',
          email: '',
          cpf: '',
          registration: '',
          role: 'professor',
          authorized: false
        });
        // Clear in-memory sensitive data upon logout
        setAllStudents([]);
        setAllClasses([]);
        setAllCourses([]);
        setAllCurricularUnits([]);
        setAllStudentGrades([]);
        setAllAttendanceRecords([]);
        setAuditLogs([]);
        setNotifications([]);
        setIsAuthLoading(false);
        return;
      }

      setFirebaseUser(user);
      const userUid = user.uid;
      const userEmail = (user.email || '').toLowerCase();
      const isAdminEmail = userEmail === 'fernandoconselho@gmail.com' || userEmail === 'admin@avamais.edu.br';

      try {
        const userDocRef = doc(db, 'users', userUid);
        const userSnap = await getDoc(userDocRef);

        if (isAdminEmail) {
          // Provision or verify admin record
          let adminData: User;
          if (!userSnap.exists()) {
            adminData = {
              id: userUid,
              name: user.displayName || 'Administrador do Sistema',
              email: userEmail,
              cpf: '000.000.000-00',
              registration: 'ADM-001',
              role: 'admin',
              authorized: true,
              status: 'Ativo',
              department: 'Reitoria e Gestão',
              avatarUrl: user.photoURL || undefined
            };
            await setDoc(userDocRef, adminData);
            await setDoc(doc(db, 'admins', userUid), { email: userEmail, role: 'admin', createdAt: new Date().toISOString() });
          } else {
            adminData = userSnap.data() as User;
          }
          setCurrentUser(adminData);
          await loadTeacherData(userUid, adminData);
        } else if (userSnap.exists()) {
          const profile = userSnap.data() as User;
          if (profile.authorized !== true || profile.status === 'Inativo') {
            await fbSignOut(auth);
            setAuthError('Usuário não cadastrado ou sem acesso autorizado. Entre em contato com o administrador.');
            setIsAuthLoading(false);
            return;
          }
          setCurrentUser(profile);
          await loadTeacherData(userUid, profile);
        } else {
          // Check if user was registered by email before login
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', userEmail));
          const querySnap = await getDocs(q).catch(() => null);

          if (querySnap && !querySnap.empty) {
            const registeredDoc = querySnap.docs[0];
            const registeredData = registeredDoc.data() as User;
            if (registeredData.authorized === true && registeredData.status !== 'Inativo') {
              const updatedProfile = { ...registeredData, id: userUid };
              await setDoc(userDocRef, updatedProfile);
              setCurrentUser(updatedProfile);
              await loadTeacherData(userUid, updatedProfile);
            } else {
              await fbSignOut(auth);
              setAuthError('Usuário não cadastrado ou sem acesso autorizado. Entre em contato com o administrador.');
            }
          } else {
            await fbSignOut(auth);
            setAuthError('Usuário não cadastrado ou sem acesso autorizado. Entre em contato com o administrador.');
          }
        }
      } catch (err: unknown) {
        console.error('Failed to load user credentials:', err);
        await fbSignOut(auth).catch(() => {});
        setAuthError('Usuário não cadastrado ou sem acesso autorizado. Entre em contato com o administrador.');
      } finally {
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Authentication methods
  const loginWithEmail = async (emailInput: string, passInput: string) => {
    setAuthError(null);
    try {
      const trimmedEmail = emailInput.trim().toLowerCase();
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, passInput);
      const uid = cred.user.uid;
      const isAdminEmail = trimmedEmail === 'fernandoconselho@gmail.com' || trimmedEmail === 'admin@avamais.edu.br';

      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);

      if (isAdminEmail) {
        if (!userSnap.exists()) {
          const adminProf: User = {
            id: uid,
            name: cred.user.displayName || 'Administrador do Sistema',
            email: trimmedEmail,
            cpf: '000.000.000-00',
            registration: 'ADM-001',
            role: 'admin',
            authorized: true,
            status: 'Ativo',
            department: 'Reitoria e Gestão'
          };
          await setDoc(userDocRef, adminProf);
          await setDoc(doc(db, 'admins', uid), { email: trimmedEmail, role: 'admin', createdAt: new Date().toISOString() });
        }
        return { success: true };
      }

      if (!userSnap.exists()) {
        await fbSignOut(auth);
        const msg = 'Usuário não cadastrado ou sem acesso autorizado. Entre em contato com o administrador.';
        setAuthError(msg);
        return { success: false, message: msg };
      }

      const userData = userSnap.data() as User;
      if (userData.authorized !== true || userData.status === 'Inativo') {
        await fbSignOut(auth);
        const msg = 'Usuário não cadastrado ou sem acesso autorizado. Entre em contato com o administrador.';
        setAuthError(msg);
        return { success: false, message: msg };
      }

      return { success: true };
    } catch (err: unknown) {
      await fbSignOut(auth).catch(() => {});
      const msg = 'Usuário não cadastrado ou sem acesso autorizado. Entre em contato com o administrador.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const uid = cred.user.uid;
      const email = (cred.user.email || '').toLowerCase();
      const isAdminEmail = email === 'fernandoconselho@gmail.com' || email === 'admin@avamais.edu.br';

      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);

      if (isAdminEmail) {
        if (!userSnap.exists()) {
          const adminProf: User = {
            id: uid,
            name: cred.user.displayName || 'Administrador do Sistema',
            email,
            cpf: '000.000.000-00',
            registration: 'ADM-001',
            role: 'admin',
            authorized: true,
            status: 'Ativo',
            department: 'Reitoria e Gestão',
            avatarUrl: cred.user.photoURL || undefined
          };
          await setDoc(userDocRef, adminProf);
          await setDoc(doc(db, 'admins', uid), { email, role: 'admin', createdAt: new Date().toISOString() });
        }
        return { success: true };
      }

      if (!userSnap.exists()) {
        // Check if pre-registered by admin with this email
        const q = query(collection(db, 'users'), where('email', '==', email));
        const matchSnap = await getDocs(q).catch(() => null);
        if (matchSnap && !matchSnap.empty) {
          const matchData = matchSnap.docs[0].data() as User;
          if (matchData.authorized === true && matchData.status !== 'Inativo') {
            const linked = { ...matchData, id: uid, avatarUrl: cred.user.photoURL || matchData.avatarUrl };
            await setDoc(userDocRef, linked);
            return { success: true };
          }
        }
        await fbSignOut(auth);
        const msg = 'Usuário não cadastrado ou sem acesso autorizado. Entre em contato com o administrador.';
        setAuthError(msg);
        return { success: false, message: msg };
      }

      const userData = userSnap.data() as User;
      if (userData.authorized !== true || userData.status === 'Inativo') {
        await fbSignOut(auth);
        const msg = 'Usuário não cadastrado ou sem acesso autorizado. Entre em contato com o administrador.';
        setAuthError(msg);
        return { success: false, message: msg };
      }

      return { success: true };
    } catch {
      await fbSignOut(auth).catch(() => {});
      const msg = 'Usuário não cadastrado ou sem acesso autorizado. Entre em contato com o administrador.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Sign-out error:', e);
    } finally {
      setFirebaseUser(null);
      setCurrentUser({
        id: '',
        name: '',
        email: '',
        cpf: '',
        registration: '',
        role: 'professor',
        authorized: false
      });
      setAllStudents([]);
      setAllClasses([]);
      setAllCourses([]);
      setAllCurricularUnits([]);
      setAllStudentGrades([]);
      setAllAttendanceRecords([]);
      setAuditLogs([]);
      setNotifications([]);
      localStorage.clear();
    }
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    return changeUserPassword(currentPass, newPass);
  };

  // Helper for Firestore mutations
  const teacherUid = currentUser.id || firebaseUser?.uid || '';

  // Audit Log
  const addAuditLog = async (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id || 'anonymous',
      userName: currentUser.name || 'Docente',
      userRole: currentUser.role || 'professor',
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);

    if (teacherUid) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'auditLogs', newLog.id), newLog);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/auditLogs`);
      }
    }
  };

  const deleteAuditLog = async (id: string) => {
    setAuditLogs(prev => prev.filter(log => log.id !== id));
    if (teacherUid) {
      try {
        await deleteDoc(doc(db, 'users', teacherUid, 'auditLogs', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${teacherUid}/auditLogs`);
      }
    }
  };

  const deleteAuditLogs = async (ids: string[]) => {
    setAuditLogs(prev => prev.filter(log => !ids.includes(log.id)));
    if (teacherUid) {
      for (const id of ids) {
        try {
          await deleteDoc(doc(db, 'users', teacherUid, 'auditLogs', id));
        } catch {
          // continue
        }
      }
    }
  };

  const clearAuditLogs = async () => {
    setAuditLogs([]);
  };

  const addDeletionReport = async (report: DeletionReport) => {
    setDeletionReports(prev => [report, ...prev]);
    if (teacherUid) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'deletionReports', report.id), report);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/deletionReports`);
      }
    }
  };

  const addNotification = async (
    title: string,
    message: string,
    type: 'danger' | 'warning' | 'info' | 'success',
    studentId?: string,
    ucId?: string
  ) => {
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      type,
      read: false,
      studentId,
      ucId
    };
    setNotifications(prev => [newNotif, ...prev]);
    if (teacherUid) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'notifications', newNotif.id), newNotif);
      } catch {
        // ignore
      }
    }
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (teacherUid) {
      try {
        await updateDoc(doc(db, 'users', teacherUid, 'notifications', id), { read: true });
      } catch {
        // ignore
      }
    }
  };

  // Institution Management
  const addInstitution = (inst: Institution): boolean => {
    if (institutions.length >= 3) {
      alert('Limite máximo de 3 instituições cadastradas atingido.');
      return false;
    }
    const newInst: Institution = {
      ...inst,
      id: inst.id || `inst-${Date.now()}`
    };
    setInstitutions(prev => [...prev, newInst]);
    setSelectedInstitutionIdState(newInst.id);
    addAuditLog('Cadastro de Unidade Escolar', `Nova instituição "${newInst.name}" cadastrada com sucesso (${institutions.length + 1}/3).`);

    if (teacherUid) {
      setDoc(doc(db, 'users', teacherUid, 'institutions', newInst.id), newInst).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/institutions`);
      });
    }
    return true;
  };

  const updateInstitution = (data: Partial<Institution>, targetId?: string) => {
    const idToUpdate = targetId || effectiveInstitutionId;
    setInstitutions(prev => prev.map(inst => inst.id === idToUpdate ? { ...inst, ...data } : inst));
    addAuditLog('Atualização Institucional', `Dados cadastrais da instituição ID ${idToUpdate} atualizados.`);

    if (teacherUid) {
      const updated = institutions.find(i => i.id === idToUpdate);
      if (updated) {
        setDoc(doc(db, 'users', teacherUid, 'institutions', idToUpdate), { ...updated, ...data }).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/institutions`);
        });
      }
    }
  };

  const deleteInstitution = (id: string): boolean => {
    if (institutions.length <= 1) {
      alert('Não é possível excluir a única instituição cadastrada. Deve haver pelo menos 1 unidade escolar.');
      return false;
    }
    const target = institutions.find(i => i.id === id);
    const remaining = institutions.filter(i => i.id !== id);
    setInstitutions(remaining);
    if (effectiveInstitutionId === id) {
      setSelectedInstitutionIdState(remaining[0].id);
    }
    addAuditLog('Exclusão de Unidade Escolar', `Instituição "${target?.name || id}" foi removida do sistema.`);

    if (teacherUid) {
      deleteDoc(doc(db, 'users', teacherUid, 'institutions', id)).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `users/${teacherUid}/institutions`);
      });
    }
    return true;
  };

  // User CRUD
  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
    addAuditLog('Novo Usuário', `Usuário ${user.name} (${user.role}) cadastrado.`);
  };

  const updateUser = async (user: User) => {
    // Immutable email security rule: email cannot be altered by professor
    const targetUser: User = {
      ...user,
      email: currentUser.role === 'admin' ? user.email : currentUser.email
    };

    setUsers(prev => prev.map(u => u.id === targetUser.id ? targetUser : u));
    setAllCurricularUnits(prev => prev.map(uc => {
      if (uc.teacherId === targetUser.id) {
        return {
          ...uc,
          teacherName: targetUser.name,
          teacherRegistration: targetUser.registration || uc.teacherRegistration
        };
      }
      return uc;
    }));

    if (currentUser.id === targetUser.id) {
      setCurrentUser(targetUser);
    }

    if (targetUser.id) {
      try {
        await setDoc(doc(db, 'users', targetUser.id), targetUser, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${targetUser.id}`);
      }
    }

    addAuditLog('Editar Usuário', `Dados cadastrais de ${targetUser.name} atualizados com segurança.`);
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch {
      // ignore
    }
    addAuditLog('Excluir Usuário', `Usuário ID ${id} removido.`);
  };

  // Courses CRUD
  const addCourse = async (course: Course) => {
    const newCourse = { ...course, institutionId: course.institutionId || effectiveInstitutionId };
    setAllCourses(prev => [...prev, newCourse]);
    addAuditLog('Novo Curso', `Curso "${course.name}" adicionado na instituição.`);

    if (teacherUid) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'courses', newCourse.id), newCourse);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/courses`);
      }
    }
  };

  const updateCourse = async (course: Course) => {
    const updatedCourse = { ...course, institutionId: course.institutionId || effectiveInstitutionId };
    setAllCourses(prev => prev.map(c => c.id === course.id ? updatedCourse : c));
    setAllClasses(prev => prev.map(cls => cls.courseId === course.id ? { ...cls, courseName: course.name } : cls));
    setAllStudents(prev => prev.map(s => s.courseId === course.id ? { ...s, courseName: course.name } : s));
    setAllCurricularUnits(prev => prev.map(uc => uc.courseId === course.id ? { ...uc, courseName: course.name } : uc));
    addAuditLog('Editar Curso', `Curso "${course.name}" atualizado.`);

    if (teacherUid) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'courses', course.id), updatedCourse);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/courses`);
      }
    }
  };

  const deleteCourse = async (id: string) => {
    setAllCourses(prev => prev.filter(c => c.id !== id));
    addAuditLog('Excluir Curso', `Curso ID ${id} removido.`);

    if (teacherUid) {
      try {
        await deleteDoc(doc(db, 'users', teacherUid, 'courses', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${teacherUid}/courses`);
      }
    }
  };

  const reorderCourses = (reordered: Course[]) => {
    setAllCourses(prev => {
      const otherInstCourses = prev.filter(c => (c.institutionId || defaultInstId) !== effectiveInstitutionId);
      return [...reordered, ...otherInstCourses];
    });
    addAuditLog('Reordenar Cursos', 'Sequência de cursos reorganizada pelo usuário.');
  };

  // Classes CRUD
  const addClass = async (cls: ClassTurma) => {
    const newClass = { ...cls, institutionId: cls.institutionId || effectiveInstitutionId };
    setAllClasses(prev => [...prev, newClass]);
    addAuditLog('Nova Turma', `Turma "${cls.name}" cadastrada.`);

    if (teacherUid) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'classes', newClass.id), newClass);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/classes`);
      }
    }
  };

  const updateClass = async (cls: ClassTurma) => {
    const updatedClass = { ...cls, institutionId: cls.institutionId || effectiveInstitutionId };
    setAllClasses(prev => prev.map(c => c.id === cls.id ? updatedClass : c));
    setAllStudents(prev => prev.map(s => s.classId === cls.id ? { ...s, className: cls.name, courseId: cls.courseId, courseName: cls.courseName, period: cls.period } : s));
    setAllCurricularUnits(prev => prev.map(uc => uc.classId === cls.id ? { ...uc, className: cls.name, courseId: cls.courseId, courseName: cls.courseName, shift: cls.shift } : uc));
    addAuditLog('Editar Turma', `Turma "${cls.name}" atualizada.`);

    if (teacherUid) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'classes', cls.id), updatedClass);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/classes`);
      }
    }
  };

  const deleteClass = async (id: string) => {
    setAllClasses(prev => prev.filter(c => c.id !== id));
    addAuditLog('Excluir Turma', `Turma ID ${id} removida.`);

    if (teacherUid) {
      try {
        await deleteDoc(doc(db, 'users', teacherUid, 'classes', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${teacherUid}/classes`);
      }
    }
  };

  const reorderClasses = (reordered: ClassTurma[]) => {
    setAllClasses(prev => {
      const otherInstClasses = prev.filter(c => (c.institutionId || defaultInstId) !== effectiveInstitutionId);
      return [...reordered, ...otherInstClasses];
    });
    addAuditLog('Reordenar Turmas', 'Sequência de turmas reorganizada pelo usuário.');
  };

  // Curricular Units CRUD
  const addCurricularUnit = async (uc: CurricularUnit) => {
    const newUC = { ...uc, institutionId: uc.institutionId || effectiveInstitutionId };
    setAllCurricularUnits(prev => [...prev, newUC]);
    if (!selectedUCId) setSelectedUCId(newUC.id);
    addAuditLog('Nova Unidade Curricular', `UC ${uc.code} - ${uc.name} cadastrada.`);

    if (teacherUid) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'curricularUnits', newUC.id), newUC);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/curricularUnits`);
      }
    }
  };

  const updateCurricularUnit = async (uc: CurricularUnit) => {
    const updatedUC = { ...uc, institutionId: uc.institutionId || effectiveInstitutionId };
    setAllCurricularUnits(prev => prev.map(u => u.id === uc.id ? updatedUC : u));
    addAuditLog('Editar Unidade Curricular', `UC ${uc.code} atualizada.`);

    if (teacherUid) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'curricularUnits', uc.id), updatedUC);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/curricularUnits`);
      }
    }
  };

  const deleteCurricularUnit = async (id: string) => {
    setAllCurricularUnits(prev => prev.filter(u => u.id !== id));
    addAuditLog('Excluir Unidade Curricular', `UC ID ${id} removida.`);

    if (teacherUid) {
      try {
        await deleteDoc(doc(db, 'users', teacherUid, 'curricularUnits', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${teacherUid}/curricularUnits`);
      }
    }
  };

  const reorderCurricularUnits = (reordered: CurricularUnit[]) => {
    setAllCurricularUnits(prev => {
      const otherInstUCs = prev.filter(u => (u.institutionId || defaultInstId) !== effectiveInstitutionId);
      return [...reordered, ...otherInstUCs];
    });
    addAuditLog('Reordenar Unidades Curriculares', 'Sequência de disciplinas/UCs reorganizada.');
  };

  const updateGradeCalculationType = async (ucId: string, type: GradeCalculationType) => {
    setAllCurricularUnits(prev =>
      prev.map(uc => {
        if (uc.id === ucId) {
          return { ...uc, gradeCalculationType: type };
        }
        return uc;
      })
    );
    const targetUC = allCurricularUnits.find(u => u.id === ucId);
    if (targetUC && teacherUid) {
      try {
        await updateDoc(doc(db, 'users', teacherUid, 'curricularUnits', ucId), { gradeCalculationType: type });
      } catch {
        // ignore
      }
    }
    const typeLabel = type === 'average' ? 'Média Aritmética' : 'Somatória';
    addAuditLog('Formato de Cálculo da Nota', `Formato de cálculo da disciplina "${targetUC?.name || ucId}" alterado para ${typeLabel}.`);
  };

  // Students CRUD
  const addStudent = async (student: Student) => {
    const newStudent: Student = {
      ...student,
      institutionId: student.institutionId || effectiveInstitutionId,
      fullName: (student.fullName || '').trim(),
      academicRegistration: (student.academicRegistration || '').trim(),
      cpf: (student.cpf || '000.000.000-00').trim(),
      birthDate: student.birthDate || '2002-01-01',
      email: (student.email || '').trim(),
      courseId: student.courseId || '',
      courseName: student.courseName || '',
      classId: student.classId || '',
      className: student.className || '',
      classIds: Array.isArray(student.classIds) && student.classIds.length > 0
        ? student.classIds
        : (student.classId ? [student.classId] : []),
      period: student.period || '2026.1',
      status: student.status || 'Ativo',
      photoUrl: student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
    };
    setAllStudents(prev => [...prev, newStudent]);
    addAuditLog('Novo Aluno', `Aluno ${newStudent.fullName} (RA: ${newStudent.academicRegistration}) cadastrado.`);

    if (teacherUid) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'students', newStudent.id), newStudent);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/students`);
      }
    }
  };

  const addStudents = async (newStudentsList: Student[]) => {
    if (!newStudentsList || newStudentsList.length === 0) return;
    const scopedStudents = newStudentsList.map(s => ({
      ...s,
      institutionId: s.institutionId || effectiveInstitutionId,
      fullName: (s.fullName || '').trim(),
      academicRegistration: (s.academicRegistration || '').trim(),
      cpf: (s.cpf || '000.000.000-00').trim(),
      birthDate: s.birthDate || '2002-01-01',
      email: (s.email || '').trim(),
      courseId: s.courseId || '',
      courseName: s.courseName || '',
      classId: s.classId || '',
      className: s.className || '',
      classIds: Array.isArray(s.classIds) && s.classIds.length > 0
        ? s.classIds
        : (s.classId ? [s.classId] : []),
      period: s.period || '2026.1',
      status: s.status || 'Ativo',
      photoUrl: s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
    }));
    setAllStudents(prev => [...prev, ...scopedStudents]);
    addAuditLog('Importação de Estudantes', `Importados com sucesso ${newStudentsList.length} estudantes.`);

    if (teacherUid) {
      for (const s of scopedStudents) {
        try {
          await setDoc(doc(db, 'users', teacherUid, 'students', s.id), s);
        } catch {
          // continue
        }
      }
    }
  };

  const updateStudent = async (student: Student) => {
    const updatedStudent: Student = {
      ...student,
      institutionId: student.institutionId || effectiveInstitutionId,
      fullName: (student.fullName || '').trim(),
      academicRegistration: (student.academicRegistration || '').trim(),
      cpf: (student.cpf || '000.000.000-00').trim(),
      birthDate: student.birthDate || '2002-01-01',
      email: (student.email || '').trim(),
      courseId: student.courseId || '',
      courseName: student.courseName || '',
      classId: student.classId || '',
      className: student.className || '',
      classIds: Array.isArray(student.classIds) && student.classIds.length > 0
        ? student.classIds
        : (student.classId ? [student.classId] : []),
      period: student.period || '2026.1',
      status: student.status || 'Ativo',
      photoUrl: student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
    };
    setAllStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
    addAuditLog('Editar Aluno', `Dados do aluno ${student.fullName} atualizados.`);

    if (teacherUid) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'students', student.id), updatedStudent);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/students`);
      }
    }
  };

  const deleteStudent = async (id: string) => {
    setAllStudents(prev => prev.filter(s => s.id !== id));
    addAuditLog('Excluir Aluno', `Aluno ID ${id} removido.`);

    if (teacherUid) {
      try {
        await deleteDoc(doc(db, 'users', teacherUid, 'students', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${teacherUid}/students`);
      }
    }
  };

  // Activities CRUD
  const addAVAActivity = async (act: AVAActivity) => {
    const newAct: AVAActivity = {
      ...act,
      institutionId: act.institutionId || effectiveInstitutionId,
      name: act.name.trim(),
      weight: Number(act.weight) || 1.0,
      maxScore: Number(act.maxScore) || 3.0
    };

    setAllAvaActivities(prev => [...prev, newAct]);
    addAuditLog('Nova Atividade AVA', `Atividade "${newAct.name}" criada.`);

    if (teacherUid) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'activities', newAct.id), newAct);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/activities`);
      }
    }
  };

  const updateAVAActivity = async (act: AVAActivity) => {
    const updatedAct: AVAActivity = {
      ...act,
      institutionId: act.institutionId || effectiveInstitutionId,
      name: act.name.trim(),
      weight: Number(act.weight) || 1.0,
      maxScore: Number(act.maxScore) || 3.0
    };

    setAllAvaActivities(prev => prev.map(a => a.id === act.id ? updatedAct : a));
    addAuditLog('Editar Atividade AVA', `Atividade "${updatedAct.name}" atualizada.`);

    if (teacherUid) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'activities', act.id), updatedAct);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/activities`);
      }
    }
  };

  const deleteAVAActivity = async (id: string) => {
    setAllAvaActivities(prev => prev.filter(a => a.id !== id));
    addAuditLog('Excluir Atividade AVA', `Atividade ID ${id} removida.`);

    if (teacherUid) {
      try {
        await deleteDoc(doc(db, 'users', teacherUid, 'activities', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${teacherUid}/activities`);
      }
    }
  };

  const resetAVAActivitiesToDefault = async () => {
    const defaultScoped = initialAVAActivities.map(a => ({
      ...a,
      id: `${a.id}-${effectiveInstitutionId}-${Date.now()}`,
      institutionId: effectiveInstitutionId
    }));
    setAllAvaActivities(prev => {
      const otherInstActivities = prev.filter(a => (a.institutionId || defaultInstId) !== effectiveInstitutionId);
      return [...otherInstActivities, ...defaultScoped];
    });
    addAuditLog('Restaurar Atividades AVA', 'Atividades e critérios do AVA restaurados.');

    if (teacherUid) {
      for (const a of defaultScoped) {
        try {
          await setDoc(doc(db, 'users', teacherUid, 'activities', a.id), a);
        } catch {
          // continue
        }
      }
    }
  };

  // Grade Entry
  const updateStudentGrade = async (
    studentId: string,
    ucId: string,
    period: 'p1' | 'p2',
    activityId: string,
    score: number
  ) => {
    const gradeDocId = `${studentId}_${ucId}`;
    let recordToSave: StudentAVAGrades;

    setAllStudentGrades(prev => {
      const existingIndex = prev.findIndex(g => g.studentId === studentId && g.ucId === ucId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const record = { ...updated[existingIndex], institutionId: updated[existingIndex].institutionId || effectiveInstitutionId };
        if (period === 'p1') {
          record.p1Grades = { ...record.p1Grades, [activityId]: score };
        } else {
          record.p2Grades = { ...record.p2Grades, [activityId]: score };
        }
        updated[existingIndex] = record;
        recordToSave = record;
        return updated;
      } else {
        const newRecord: StudentAVAGrades = {
          studentId,
          ucId,
          institutionId: effectiveInstitutionId,
          p1Grades: period === 'p1' ? { [activityId]: score } : {},
          p2Grades: period === 'p2' ? { [activityId]: score } : {}
        };
        recordToSave = newRecord;
        return [...prev, newRecord];
      }
    });

    addAuditLog('Lançamento de Nota', `Nota ${score} lançada para atividade ${activityId}.`);

    if (teacherUid && recordToSave!) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'grades', gradeDocId), recordToSave);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/grades`);
      }
    }
  };

  const updateRecoveryGrade = async (studentId: string, ucId: string, score: number | undefined) => {
    const gradeDocId = `${studentId}_${ucId}`;
    let recordToSave: StudentAVAGrades;

    setAllStudentGrades(prev => {
      const existingIndex = prev.findIndex(g => g.studentId === studentId && g.ucId === ucId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          institutionId: updated[existingIndex].institutionId || effectiveInstitutionId,
          recoveryGrade: score
        };
        recordToSave = updated[existingIndex];
        return updated;
      } else {
        const newRec: StudentAVAGrades = {
          studentId,
          ucId,
          institutionId: effectiveInstitutionId,
          p1Grades: {},
          p2Grades: {},
          recoveryGrade: score
        };
        recordToSave = newRec;
        return [...prev, newRec];
      }
    });

    const studentName = students.find(s => s.id === studentId)?.fullName || 'Aluno';
    addAuditLog('Nota de Recuperação', `Nota de recuperação (${score ?? 'remover'}) gravada para ${studentName}.`);

    if (teacherUid && recordToSave!) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'grades', gradeDocId), recordToSave);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/grades`);
      }
    }
  };

  // Attendance CRUD
  const addAttendanceRecord = async (record: DailyAttendanceRecord) => {
    const newRecord = { ...record, institutionId: record.institutionId || effectiveInstitutionId };
    setAllAttendanceRecords(prev => [newRecord, ...prev]);
    addAuditLog('Registro de Presença', `Chamada realizada em ${record.date} (${record.lessonCount} aulas).`);

    if (teacherUid) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'attendance', newRecord.id), newRecord);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/attendance`);
      }
    }
  };

  const updateAttendanceRecord = async (record: DailyAttendanceRecord) => {
    const updatedRecord = { ...record, institutionId: record.institutionId || effectiveInstitutionId };
    setAllAttendanceRecords(prev => prev.map(a => a.id === record.id ? updatedRecord : a));
    addAuditLog('Editar Registro de Presença', `Chamada do dia ${record.date} foi modificada.`);

    if (teacherUid) {
      try {
        await setDoc(doc(db, 'users', teacherUid, 'attendance', record.id), updatedRecord);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${teacherUid}/attendance`);
      }
    }
  };

  const deleteAttendanceRecord = async (id: string) => {
    setAllAttendanceRecords(prev => prev.filter(a => a.id !== id));
    addAuditLog('Excluir Chamada', `Registro de presença ID ${id} removido.`);

    if (teacherUid) {
      try {
        await deleteDoc(doc(db, 'users', teacherUid, 'attendance', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${teacherUid}/attendance`);
      }
    }
  };

  // Roles labels
  const updateRoleLabels = (labels: Partial<RoleLabels>) => {
    setRoleLabels(prev => ({ ...prev, ...labels }));
    addAuditLog('Configuração de Perfis', 'Nomes personalizados dos perfis de acesso atualizados.');
  };

  const resetRoleLabels = () => {
    setRoleLabels(defaultRoleLabels);
    addAuditLog('Configuração de Perfis', 'Nomes dos perfis restaurados.');
  };

  const updateRoleOrder = (order: UserRole[]) => {
    setRoleOrder(order);
    addAuditLog('Configuração de Perfis', 'Ordenação dos perfis atualizada.');
  };

  const resetRoleOrder = () => {
    setRoleOrder(defaultRoleOrder);
    addAuditLog('Configuração de Perfis', 'Ordenação restaurada.');
  };

  const getRoleLabel = (role: UserRole): string => {
    return roleLabels[role] || role;
  };

  const resetDemoData = () => {
    // Reset local view only
    setInstitutions(initialInstitutions);
    setSelectedInstitutionIdState(initialInstitutions[0].id);
    setAllCourses(initialCourses);
    setAllClasses(initialClasses);
    setAllCurricularUnits(initialCurricularUnits);
    setAllStudents(initialStudents);
    setAllAvaActivities(initialAVAActivities);
    setAllStudentGrades(initialStudentAVAGrades);
    setAllAttendanceRecords(initialAttendanceRecords);
    setAuditLogs(initialAuditLogs);
    setNotifications(initialNotifications);
  };

  return (
    <AppContext.Provider
      value={{
        firebaseUser,
        isAuthLoading,
        isDataLoading,
        authError,
        clearAuthError,
        loginWithEmail,
        loginWithGoogle,
        logout,
        changePassword,
        currentUser,
        setCurrentUser,
        users,
        addUser,
        updateUser,
        deleteUser,
        roleLabels,
        updateRoleLabels,
        resetRoleLabels,
        getRoleLabel,
        roleOrder,
        updateRoleOrder,
        resetRoleOrder,
        institutions,
        selectedInstitutionId: effectiveInstitutionId,
        setSelectedInstitutionId,
        institution: activeInstitution,
        updateInstitution,
        addInstitution,
        deleteInstitution,
        courses,
        allCourses,
        addCourse,
        updateCourse,
        deleteCourse,
        reorderCourses,
        curricularUnits,
        allCurricularUnits,
        addCurricularUnit,
        updateCurricularUnit,
        deleteCurricularUnit,
        reorderCurricularUnits,
        selectedUCId,
        setSelectedUCId,
        selectedUC,
        updateGradeCalculationType,
        selectedClassId,
        setSelectedClassId,
        selectedClass,
        classes,
        allClasses,
        addClass,
        updateClass,
        deleteClass,
        reorderClasses,
        students,
        allStudents,
        addStudent,
        addStudents,
        updateStudent,
        deleteStudent,
        avaActivities,
        allAvaActivities,
        addAVAActivity,
        updateAVAActivity,
        deleteAVAActivity,
        resetAVAActivitiesToDefault,
        studentGrades,
        updateStudentGrade,
        updateRecoveryGrade,
        attendanceRecords,
        addAttendanceRecord,
        updateAttendanceRecord,
        deleteAttendanceRecord,
        auditLogs,
        addAuditLog,
        deleteAuditLog,
        deleteAuditLogs,
        clearAuditLogs,
        deletionReports,
        addDeletionReport,
        notifications,
        markNotificationAsRead,
        addNotification,
        computedResults,
        isDarkMode,
        toggleDarkMode,
        resetDemoData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
