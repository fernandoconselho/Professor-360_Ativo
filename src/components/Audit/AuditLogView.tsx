import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportDeletionReportPDF } from '../../utils/exportUtils';
import { DeletionReport, AuditLog } from '../../types';
import {
  History,
  Search,
  User,
  Trash2,
  Lock,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  X,
  Key,
  FileText,
  ShieldCheck,
  Download,
  Calendar,
  FileCheck
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const {
    auditLogs,
    currentUser,
    users,
    institution,
    deleteAuditLog,
    deleteAuditLogs,
    clearAuditLogs,
    addAuditLog,
    deletionReports,
    addDeletionReport
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  
  // Feedback alert state
  const [successMessage, setSuccessMessage] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'all' | 'selected' | string>(''); // 'all', 'selected', or log.id
  
  // Credentials Validation State
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const filteredLogs = auditLogs.filter(log =>
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Checkbox Selection
  const isAllFilteredSelected =
    filteredLogs.length > 0 && filteredLogs.every(log => selectedLogIds.includes(log.id));

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedLogIds(prev => prev.filter(id => !filteredLogs.some(log => log.id === id)));
    } else {
      const newIds = Array.from(new Set([...selectedLogIds, ...filteredLogs.map(log => log.id)]));
      setSelectedLogIds(newIds);
    }
  };

  const toggleSelectLog = (id: string) => {
    setSelectedLogIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Open Security Confirmation Modal
  const handleOpenAuthModal = (target: 'all' | 'selected' | string) => {
    setDeleteTarget(target);
    setLoginInput(currentUser.email);
    setPasswordInput('');
    setAuthError('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // Execute Deletion after Login and Password Validation
  const handleConfirmDeletion = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanLogin = loginInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanLogin) {
      setAuthError('Por favor, informe seu e-mail ou registro de login.');
      return;
    }

    if (!cleanPassword) {
      setAuthError('Por favor, informe sua senha de confirmação.');
      return;
    }

    // Validate credentials against users list and current user
    const foundUser = users.find(
      u => u.email.toLowerCase() === cleanLogin || u.registration.toLowerCase() === cleanLogin
    );

    if (!foundUser) {
      setAuthError('Usuário não encontrado. Digite o e-mail ou registro correto do usuário logado.');
      return;
    }

    // Check user password (default to '123456' for demo accounts if password field isn't set)
    const expectedPassword = foundUser.password || '123456';

    if (cleanPassword !== expectedPassword) {
      setAuthError('Senha incorreta! Não foi possível autenticar a exclusão de logs.');
      return;
    }

    // Capture logs snapshot before deletion
    let logsToDelete: AuditLog[] = [];
    if (deleteTarget === 'all') {
      logsToDelete = [...auditLogs];
    } else if (deleteTarget === 'selected') {
      logsToDelete = auditLogs.filter(log => selectedLogIds.includes(log.id));
    } else {
      logsToDelete = auditLogs.filter(log => log.id === deleteTarget);
    }

    // Create Immutable Deletion Report Document
    const newReport: DeletionReport = {
      id: `LAUDO-${Date.now().toString().slice(-6)}`,
      deletedAt: new Date().toISOString(),
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        registration: foundUser.registration,
        role: foundUser.role
      },
      targetType: deleteTarget === 'all' ? 'all' : deleteTarget === 'selected' ? 'selected' : 'single',
      totalLogsDeleted: logsToDelete.length,
      logsSnapshot: logsToDelete.map(l => ({
        timestamp: l.timestamp,
        userName: l.userName,
        userRole: l.userRole,
        action: l.action,
        details: l.details
      }))
    };

    // Save report to APP permanent storage
    addDeletionReport(newReport);

    // Generate and Download PDF Report
    exportDeletionReportPDF(institution, newReport);

    // Credentials Verified! Proceed with deletion based on target
    if (deleteTarget === 'all') {
      clearAuditLogs();
      addAuditLog(
        'Exclusão de Histórico de Logs',
        `Todo o histórico de auditoria foi limpo com validação de credenciais de ${foundUser.name}. Laudo inviolável ${newReport.id} gerado e salvo no APP.`
      );
      setSelectedLogIds([]);
      setSuccessMessage(`Todo o histórico de logs foi excluído com sucesso. O relatório em PDF inviolável (${newReport.id}) foi gerado e salvo no APP.`);
    } else if (deleteTarget === 'selected') {
      const count = selectedLogIds.length;
      deleteAuditLogs(selectedLogIds);
      addAuditLog(
        'Exclusão de Logs em Lote',
        `${count} registro(s) de auditoria excluídos por ${foundUser.name}. Laudo ${newReport.id} gerado.`
      );
      setSelectedLogIds([]);
      setSuccessMessage(`${count} registro(s) selecionado(s) foi(ram) excluído(s). Relatório em PDF (${newReport.id}) salvo no APP.`);
    } else {
      deleteAuditLog(deleteTarget);
      addAuditLog(
        'Exclusão de Log Individual',
        `Registro de auditoria excluído por ${foundUser.name}. Laudo ${newReport.id} gerado.`
      );
      setSelectedLogIds(prev => prev.filter(id => id !== deleteTarget));
      setSuccessMessage(`Registro de auditoria excluído com sucesso. Relatório em PDF (${newReport.id}) salvo no APP.`);
    }

    // Close Modal
    setIsModalOpen(false);
    setPasswordInput('');

    // Clear success banner after 6 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 6000);
  };

  const getTargetDescription = () => {
    if (deleteTarget === 'all') return 'TODO O HISTÓRICO de logs de auditoria';
    if (deleteTarget === 'selected') return `${selectedLogIds.length} registro(s) de auditoria selecionado(s)`;
    return '1 registro de auditoria individual';
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <History className="w-4 h-4" /> AUDITORIA DE ACESSOS E AÇÕES
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Registro de Logs do Sistema
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Rastreabilidade total das alterações de notas, chamadas, parâmetros institucionais e permissões de usuários.
          </p>
        </div>

        {/* Global Clear Button */}
        {auditLogs.length > 0 && (
          <button
            onClick={() => handleOpenAuthModal('all')}
            className="self-start md:self-center inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all border border-rose-500/50 hover:shadow-rose-900/30 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar Todo o Histórico</span>
          </button>
        )}
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fadeIn text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PERMANENT SAVED DELETION REPORTS (CANNOT BE REMOVED) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Relatórios Invioláveis de Exclusão (Salvos no APP)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Laudos permanentes das limpezas de histórico com dados do usuário responsável. Não podem ser excluídos.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-lg text-[11px] font-bold shrink-0 self-start sm:self-center border border-amber-200 dark:border-amber-800">
            <Lock className="w-3 h-3" />
            <span>Arquivo Inviolável ({deletionReports.length})</span>
          </span>
        </div>

        {deletionReports.length === 0 ? (
          <div className="p-6 text-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 space-y-1">
            <FileCheck className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-semibold">Nenhum laudo de exclusão registrado até o momento.</p>
            <p className="text-[11px]">Sempre que uma limpeza de dados for realizada, o laudo oficial em PDF ficará armazenado permanentemente aqui para consulta.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deletionReports.map(report => (
              <div
                key={report.id}
                onClick={() => exportDeletionReportPDF(institution, report)}
                className="group relative bg-slate-50 hover:bg-cyan-50/50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-cyan-400 dark:hover:border-cyan-500 rounded-xl p-3.5 transition-all cursor-pointer shadow-sm hover:shadow-md"
                title="Clique para visualizar e baixar o Laudo em PDF"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {report.id}
                      </span>
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 uppercase">
                        {report.targetType === 'all' ? 'Limpeza Total' : report.targetType === 'selected' ? 'Em Lote' : 'Individual'}
                      </span>
                    </div>
                  </div>

                  {/* Permanence Lock Indicator */}
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3 text-amber-500" />
                    <span>Inviolável</span>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <p className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-500" /> {report.user.name} ({report.user.role.toUpperCase()})
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    E-mail: <strong>{report.user.email}</strong> • RA/Reg: <strong>{report.user.registration || 'N/A'}</strong>
                  </p>
                  <div className="pt-1.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(report.deletedAt).toLocaleString('pt-BR')}
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {report.totalLogsDeleted} log(s) removido(s)
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] font-bold text-cyan-600 dark:text-cyan-400 group-hover:underline">
                  <span className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Consultar / Baixar Laudo PDF
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Apenas Consulta</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log List Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* Controls Bar: Search & Batch Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              Histórico de Atividades em Tempo Real ({filteredLogs.length})
            </h2>

            {/* Batch Delete Button */}
            {selectedLogIds.length > 0 && (
              <button
                onClick={() => handleOpenAuthModal('selected')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold shadow hover:bg-rose-700 transition-all animate-fadeIn"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Selecionados ({selectedLogIds.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por usuário, ação ou detalhe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Select All Bar if list is not empty */}
        {filteredLogs.length > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer font-semibold select-none text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isAllFilteredSelected}
                onChange={toggleSelectAll}
                className="hidden"
              />
              {isAllFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Selecionar Todos ({filteredLogs.length})</span>
            </label>

            <span className="text-[11px] text-slate-400">
              {selectedLogIds.length} marcado(s)
            </span>
          </div>
        )}

        {/* Log Entries */}
        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <History className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="font-semibold">Nenhum log de auditoria encontrado.</p>
              <p className="text-[11px] text-slate-400">As ações realizadas no sistema serão registradas automaticamente aqui.</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const isSelected = selectedLogIds.includes(log.id);

              return (
                <div
                  key={log.id}
                  className={`py-3 px-2 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelectLog(log.id)}
                      className="mt-0.5 text-slate-400 hover:text-cyan-600 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-cyan-500" /> {log.userName}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {log.userRole}
                        </span>
                        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                          • {log.action}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{log.details}</p>
                    </div>
                  </div>

                  {/* Right side: Timestamp & Single Delete Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenAuthModal(log.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                      title="Excluir este log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECURITY CONFIRMATION MODAL (LOGIN & PASSWORD REQUIRED) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-rose-900/90 dark:bg-rose-950 text-white p-5 flex items-center justify-between border-b border-rose-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-800/80 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-rose-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Confirmação de Segurança</h3>
                  <p className="text-[11px] text-rose-200">Autenticação obrigatória e emissão de laudo</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-rose-200 hover:text-white rounded-lg hover:bg-rose-800/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmDeletion} className="p-5 space-y-4">
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-3 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Atenção: Ação Registrada em Laudo Inviolável!</p>
                  <p className="mt-0.5 text-[11px] text-rose-700 dark:text-rose-400">
                    Você está prestes a excluir: <strong className="underline">{getTargetDescription()}</strong>. Um relatório em PDF com seus dados de usuário será gerado e armazenado de forma não removível no aplicativo.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                Para validar e autorizar a exclusão no sistema, informe seu <strong>Login</strong> e <strong>Senha</strong> de acesso:
              </p>

              {authError && (
                <div className="bg-rose-100 dark:bg-rose-900/50 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Login Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Login / E-mail de Acesso:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="E-mail ou Registro de Login"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Sua Senha de Confirmação:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Digite sua senha..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Testing Hint */}
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Senha padrão para contas de teste: <strong className="text-slate-900 dark:text-white font-mono">123456</strong></span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow transition-all flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Gerar Laudo e Excluir</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
