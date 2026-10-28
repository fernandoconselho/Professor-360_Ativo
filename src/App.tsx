import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/Auth/LoginScreen';
import { AdminDashboard } from './components/Dashboard/AdminDashboard';
import { ProfessorDashboard } from './components/Dashboard/ProfessorDashboard';
import { CoordinatorDashboard } from './components/Dashboard/CoordinatorDashboard';
import { AVASpreadsheet } from './components/AVAModule/AVASpreadsheet';
import { AttendancePanel } from './components/Attendance/AttendancePanel';
import { ClassIndividualPanel } from './components/TurmaModule/ClassIndividualPanel';
import { StudentBoletim } from './components/StudentPortal/StudentBoletim';
import { StudentManager } from './components/Management/StudentManager';
import { InstitutionManager } from './components/Management/InstitutionManager';
import { CourseManager } from './components/Management/CourseManager';
import { DisciplineManager } from './components/Management/DisciplineManager';
import { TeacherManager } from './components/Management/TeacherManager';
import { ReportsModule } from './components/Reports/ReportsModule';
import { AuditLogView } from './components/Audit/AuditLogView';
import { Menu, X, GraduationCap, ShieldAlert } from 'lucide-react';

function MainContent() {
  const { firebaseUser, currentUser, isAuthLoading, isDataLoading } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Loading Screen while verifying authentication with Firebase
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#071328] text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#002B5B] to-[#40E0D0] text-[#002B5B] flex items-center justify-center shadow-2xl ring-4 ring-[#40E0D0]/30 animate-bounce mb-4">
          <GraduationCap className="w-9 h-9 text-[#002B5B]" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#40E0D0] animate-ping" />
          <h2 className="text-lg font-black text-white">AVA+ Presença</h2>
        </div>
        <p className="text-xs text-slate-400">Verificando autenticação e isolamento de dados...</p>
      </div>
    );
  }

  // Not authenticated: render the secure Login Screen
  if (!firebaseUser || !currentUser.id) {
    return <LoginScreen />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ProfessorDashboard setActiveTab={setActiveTab} />;

      case 'painel-turma':
      case 'ava-planilha':
        return <ClassIndividualPanel initialTab="ava-planilha" />;

      case 'frequencia':
        return <AttendancePanel setActiveTab={setActiveTab} />;

      case 'cursos':
      case 'ucs':
        return <CourseManager />;

      case 'alunos':
        return <StudentManager />;

      case 'instituicao':
        return <InstitutionManager />;

      case 'relatorios':
        return <ReportsModule />;

      case 'auditoria':
        return <AuditLogView />;

      case 'professores':
        if (currentUser.role === 'admin' || currentUser.email === 'fernandoconselho@gmail.com') {
          return <TeacherManager />;
        }
        return (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Acesso Restrito à Administração</h3>
            <p className="text-xs text-slate-500 mt-1">O gerenciamento de professores e autorizações é exclusivo do perfil Administrador.</p>
          </div>
        );

      default:
        return <ProfessorDashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] dark:bg-[#0B132B] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-[#40E0D0] selection:text-[#002B5B]">
      
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Body Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative">
        
        {/* Mobile Sidebar Overlay Toggle Button */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="p-3 bg-[#002B5B] text-[#40E0D0] rounded-full shadow-2xl flex items-center justify-center ring-4 ring-[#40E0D0]/20 cursor-pointer"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        {/* Mobile Overlay Backstop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Dynamic Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {renderTabContent()}
        </main>

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>© 2026 AVA+ Presença - Sistema Integrado de Gestão Acadêmica, Avaliações e Frequência.</p>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
