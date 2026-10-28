import React, { useState } from 'react';
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
  BookOpen,
  Users,
  Calendar,
  Clock,
  FileText,
  X,
  Percent
} from 'lucide-react';
import { DailyAttendanceRecord } from '../../types';
import { getStatusBadgeStyle, getStatusAbbreviation } from '../../utils/avaCalculations';

export const AttendanceTracker: React.FC = () => {
  const {
    selectedUC,
    students,
    attendanceRecords,
    addAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    institution,
    computedResults
  } = useApp();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lessonCount, setLessonCount] = useState(4);
  const [contentTaught, setContentTaught] = useState('');
  const [studentPresences, setStudentPresences] = useState<Record<string, boolean>>(() => {
    const initialMap: Record<string, boolean> = {};
    students.forEach(s => {
      initialMap[s.id] = true; // default present
    });
    return initialMap;
  });

  const [activeTab, setActiveTab] = useState<'nova-chamada' | 'historico'>('nova-chamada');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<DailyAttendanceRecord | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editLessonCount, setEditLessonCount] = useState(4);
  const [editContentTaught, setEditContentTaught] = useState('');
  const [editStudentPresences, setEditStudentPresences] = useState<Record<string, boolean>>({});
  const [editStudentSearch, setEditStudentSearch] = useState('');

  if (!selectedUC) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <CalendarCheck2 className="w-12 h-12 mx-auto text-slate-400 mb-2" />
        <p className="text-base font-bold text-slate-700 dark:text-slate-300">Nenhuma Unidade Curricular selecionada.</p>
        <p className="text-xs text-slate-500 mt-1">Selecione uma disciplina no menu para realizar o registro de frequência.</p>
      </div>
    );
  }

  // Filter students for this UC's class or additional classes/courses
  const ucStudents = students.filter(s => {
    const studentClassIds = s.classIds && s.classIds.length > 0 ? s.classIds : [s.classId];
    const matchesClass = Boolean(selectedUC.classId && studentClassIds.includes(selectedUC.classId));
    const matchesCourse = Boolean(selectedUC.courseId && s.courseId === selectedUC.courseId);
    const matchesAdditionalClass = Boolean(selectedUC.additionalClassIds && selectedUC.additionalClassIds.some(cid => studentClassIds.includes(cid)));
    const matchesAdditionalCourse = Boolean(selectedUC.additionalCourseIds && selectedUC.additionalCourseIds.includes(s.courseId));
    return matchesClass || matchesCourse || matchesAdditionalClass || matchesAdditionalCourse;
  });

  const ucAttendanceHistory = attendanceRecords.filter(a => a.ucId === selectedUC.id);

  const toggleAllPresences = (isPresent: boolean) => {
    const updated: Record<string, boolean> = {};
    ucStudents.forEach(s => {
      updated[s.id] = isPresent;
    });
    setStudentPresences(updated);
  };

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentTaught.trim()) {
      alert('Por favor, informe o conteúdo ministrado na aula.');
      return;
    }

    const newRecord: DailyAttendanceRecord = {
      id: `att-${Date.now()}`,
      ucId: selectedUC.id,
      classId: selectedUC.classId,
      date,
      lessonCount: Number(lessonCount),
      contentTaught: contentTaught.trim(),
      presences: { ...studentPresences },
      createdAt: new Date().toISOString()
    };

    addAttendanceRecord(newRecord);
    setContentTaught('');
    setFeedbackMessage('✅ Registro de Presença salvo com sucesso!');
    setTimeout(() => setFeedbackMessage(null), 3500);
    setActiveTab('historico');
  };

  const handleOpenEdit = (record: DailyAttendanceRecord) => {
    setEditingRecord(record);
    setEditDate(record.date);
    setEditLessonCount(record.lessonCount || 4);
    setEditContentTaught(record.contentTaught);
    
    // Ensure all students in this UC are represented in the edit state
    const currentPresences: Record<string, boolean> = {};
    ucStudents.forEach(s => {
      currentPresences[s.id] = record.presences[s.id] ?? true;
    });
    // Also keep any students that were previously in the record even if removed from class
    Object.keys(record.presences || {}).forEach(sId => {
      if (currentPresences[sId] === undefined) {
        currentPresences[sId] = record.presences[sId];
      }
    });

    setEditStudentPresences(currentPresences);
    setEditStudentSearch('');
  };

  const toggleAllEditPresences = (isPresent: boolean) => {
    const updated: Record<string, boolean> = { ...editStudentPresences };
    ucStudents.forEach(s => {
      updated[s.id] = isPresent;
    });
    setEditStudentPresences(updated);
  };

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
      presences: { ...editStudentPresences }
    };

    updateAttendanceRecord(updatedRecord);
    setEditingRecord(null);
    setFeedbackMessage('✅ Registro de Presença atualizado com sucesso!');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const filteredHistory = ucAttendanceHistory.filter(h =>
    h.contentTaught.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.date.includes(searchTerm)
  );

  // Edit modal student filtering
  const filteredEditStudents = ucStudents.filter(s =>
    s.fullName.toLowerCase().includes(editStudentSearch.toLowerCase()) ||
    s.academicRegistration.toLowerCase().includes(editStudentSearch.toLowerCase())
  );

  const editTotalStudents = ucStudents.length;
  const editPresencesCount = ucStudents.filter(s => editStudentPresences[s.id] ?? true).length;
  const editAbsencesCount = editTotalStudents - editPresencesCount;
  const editAttendancePercent = editTotalStudents > 0 ? Math.round((editPresencesCount / editTotalStudents) * 100) : 100;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
              CONTROLE DE FREQUÊNCIA
            </span>
            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              {selectedUC.code}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Diário de Classe & Registro de Presença
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            <strong>UC:</strong> {selectedUC.name} | <strong>Turma:</strong> {selectedUC.className} | <strong>Total de aulas semestre:</strong> {selectedUC.workloadHours}h
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('nova-chamada')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'nova-chamada'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" /> Nova Chamada do Dia
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'historico'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" /> Histórico ({ucAttendanceHistory.length})
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="p-1 hover:bg-emerald-700 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      {activeTab === 'nova-chamada' ? (
        <form onSubmit={handleSaveAttendance} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-5 space-y-6">
          
          {/* Top Form Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-500" /> Data da Aula:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Qtd. de Aulas do Dia:
              </label>
              <select
                value={lessonCount}
                onChange={(e) => setLessonCount(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none"
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
                <FileText className="w-3.5 h-3.5 text-purple-500" /> Conteúdo Ministrado:
              </label>
              <input
                type="text"
                placeholder="Ex: Introdução a APIs, Testes Unitários e Prática..."
                value={contentTaught}
                onChange={(e) => setContentTaught(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Student Attendance List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                Chamada dos Estudantes ({ucStudents.length} Alunos)
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleAllPresences(true)}
                  className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Marcar Todos Presentes (✅)
                </button>
                <button
                  type="button"
                  onClick={() => toggleAllPresences(false)}
                  className="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Marcar Todos Ausentes (❌)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ucStudents.map(student => {
                const isPresent = studentPresences[student.id] ?? true;
                const studentRes = computedResults.find(r => r.studentId === student.id);

                return (
                  <div
                    key={student.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isPresent
                        ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/60'
                        : 'bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-slate-800 dark:text-slate-100">
                            {student.fullName}
                          </p>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${getStatusBadgeStyle(student.status)}`}>
                            {getStatusAbbreviation(student.status)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                          RA: {student.academicRegistration} • Frequência Atual: <strong>{studentRes?.attendancePercentage ?? 100}%</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStudentPresences(prev => ({ ...prev, [student.id]: true }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 ${
                          isPresent
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Presente
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudentPresences(prev => ({ ...prev, [student.id]: false }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 ${
                          !isPresent
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-100'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Ausente
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
            >
              <Check className="w-5 h-5" /> Salvar Chamada do Dia
            </button>
          </div>

        </form>
      ) : (
        /* Attendance History List */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-500" />
              Histórico de Aulas Registradas ({filteredHistory.length})
            </h3>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar por conteúdo ou data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredHistory.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                Nenhuma aula gravada no histórico desta disciplina.
              </p>
            ) : (
              filteredHistory.map(rec => {
                const totalStudentsInCall = Object.keys(rec.presences || {}).length;
                const presenceCount = Object.values(rec.presences || {}).filter(Boolean).length;
                const absenceCount = totalStudentsInCall - presenceCount;
                const rate = totalStudentsInCall > 0 ? Math.round((presenceCount / totalStudentsInCall) * 100) : 0;

                return (
                  <div
                    key={rec.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-300 dark:hover:border-cyan-700/60 transition-colors shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                          {new Date(rec.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800 flex items-center gap-1">
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
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 pt-0.5">
                        {rec.contentTaught}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Presentes: <strong className="text-emerald-600 dark:text-emerald-400">{presenceCount}</strong> • Faltas: <strong className="text-rose-600 dark:text-rose-400">{absenceCount}</strong> de {totalStudentsInCall} alunos
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(rec)}
                        className="px-3 py-1.5 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 rounded-lg transition-colors text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        title="Editar registro de presença, conteúdo e frequência dos alunos"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          deleteAttendanceRecord(rec.id);
                          setFeedbackMessage('✅ Registro de presença excluído com sucesso!');
                          setTimeout(() => setFeedbackMessage(null), 3000);
                        }}
                        className="px-2.5 py-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                        title="Excluir este registro de aula"
                      >
                        <Trash2 className="w-4 h-4" /> Excluir
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Edit Attendance Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-5 my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    Editar Registro de Presença
                    <span className="text-xs font-mono font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
                      {selectedUC.code}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Modifique a data, a quantidade de aulas, o conteúdo ministrado e a chamada individual dos alunos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form id="edit-attendance-form" onSubmit={handleSaveEdit} className="space-y-5 overflow-y-auto flex-1 pr-1">
              
              {/* Form Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-500" /> Data da Aula:
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> Qtd. de Aulas do Dia:
                  </label>
                  <select
                    value={editLessonCount}
                    onChange={(e) => setEditLessonCount(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none"
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
                    <FileText className="w-3.5 h-3.5 text-purple-500" /> Conteúdo Ministrado:
                  </label>
                  <input
                    type="text"
                    value={editContentTaught}
                    onChange={(e) => setEditContentTaught(e.target.value)}
                    placeholder="Ex: Introdução a APIs..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Attendance KPI Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Total de Alunos</span>
                  <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">{editTotalStudents}</span>
                </div>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Presentes</span>
                  <span className="text-base font-extrabold text-emerald-800 dark:text-emerald-200">{editPresencesCount}</span>
                </div>
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800/60 text-center">
                  <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block">Ausentes</span>
                  <span className="text-base font-extrabold text-rose-800 dark:text-rose-200">{editAbsencesCount}</span>
                </div>
                <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-800/60 text-center">
                  <span className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-400 block">Índice da Aula</span>
                  <span className="text-base font-extrabold text-cyan-800 dark:text-cyan-200">{editAttendancePercent}%</span>
                </div>
              </div>

              {/* Student Presence Editing Section */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-500" />
                    Lista de Chamada dos Alunos ({filteredEditStudents.length})
                  </h4>

                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    {/* Inner search */}
                    <div className="relative flex-1 sm:w-48">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Buscar aluno..."
                        value={editStudentSearch}
                        onChange={(e) => setEditStudentSearch(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleAllEditPresences(true)}
                      className="px-2 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Todos Presentes (✅)
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAllEditPresences(false)}
                      className="px-2 py-1 text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Todos Ausentes (❌)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {filteredEditStudents.map(student => {
                    const isPresent = editStudentPresences[student.id] ?? true;
                    const studentRes = computedResults.find(r => r.studentId === student.id);

                    return (
                      <div
                        key={student.id}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                          isPresent
                            ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/60'
                            : 'bg-rose-50/40 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700 shrink-0"
                          />
                          <div className="truncate">
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                              {student.fullName}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono truncate">
                              RA: {student.academicRegistration}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditStudentPresences(prev => ({ ...prev, [student.id]: true }))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-100'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Presente
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditStudentPresences(prev => ({ ...prev, [student.id]: false }))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              !isPresent
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-100'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Ausente
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </form>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="edit-attendance-form"
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Salvar Alterações
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Summary KPI Cards for Attendance Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">Frequência Regular</span>
            <p className="text-lg font-extrabold text-emerald-900 dark:text-emerald-100">≥ 75% Frequência</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Situação acadêmica regular dentro dos critérios institucionais.</p>
          </div>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">Em Risco</span>
            <p className="text-lg font-extrabold text-amber-900 dark:text-amber-100">70% a 74.9% Frequência</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">Aluno com faltas acumuladas próximo ao limite de reprovação.</p>
          </div>
        </div>

        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-rose-500 text-white rounded-xl shadow-md">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">Reprovado por Falta</span>
            <p className="text-lg font-extrabold text-rose-900 dark:text-rose-100">&lt; 75% Frequência</p>
            <p className="text-[11px] text-rose-700 dark:text-rose-400">Reprovação automática por excesso de faltas regulamentares.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
