import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Download,
  X,
  ArrowRight,
  RefreshCw,
  Edit2,
  Trash2,
  Layers,
  Database,
  School,
  FileText,
  ClipboardPaste,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, AcademicStatus } from '../../types';
import { formatCPF } from '../../utils/formatters';

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedStudentRow {
  tempId: string;
  fullName: string;
  academicRegistration: string;
  cpf: string;
  birthDate: string;
  email: string;
  courseName: string;
  className: string;
  period: string;
  status: AcademicStatus;
  hasMissingInfo: boolean;
  missingFields: string[];
  isDuplicateRA?: boolean;
}

export const StudentImportModal: React.FC<StudentImportModalProps> = ({ isOpen, onClose }) => {
  const { courses, classes, addStudents, students, institution } = useApp();

  const [activeSource, setActiveSource] = useState<'excel' | 'drive' | 'paste'>('excel');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File Upload State
  const [fileName, setFileName] = useState<string>('');
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawWorkbook, setRawWorkbook] = useState<XLSX.WorkBook | null>(null);

  // Google Drive / Sheets Link State
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [pastedText, setPastedText] = useState('');

  // Default Fallbacks
  const [defaultCourseId, setDefaultCourseId] = useState(courses[0]?.id || '');
  const [defaultClassId, setDefaultClassId] = useState(classes[0]?.id || '');
  const [defaultPeriod, setDefaultPeriod] = useState('2026.1');
  const [defaultStatus, setDefaultStatus] = useState<AcademicStatus>('Ativo');

  // Parsed Data & Preview
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [importedCount, setImportedCount] = useState(0);

  // Column Mapping
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<{
    name: string;
    ra: string;
    cpf: string;
    email: string;
    birthDate: string;
    turma: string;
    course: string;
    status: string;
    period: string;
  }>({
    name: '',
    ra: '',
    cpf: '',
    email: '',
    birthDate: '',
    turma: '',
    course: '',
    status: '',
    period: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Auto-detect columns from header names
  const autoDetectMapping = (headers: string[]) => {
    const normalize = (str: string) =>
      str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const newMap = {
      name: '',
      ra: '',
      cpf: '',
      email: '',
      birthDate: '',
      turma: '',
      course: '',
      status: '',
      period: ''
    };

    headers.forEach(h => {
      const norm = normalize(h);
      if (!newMap.name && (norm.includes('nome') || norm.includes('aluno') || norm.includes('estudante') || norm === 'name')) {
        newMap.name = h;
      } else if (!newMap.ra && (norm.includes('ra') || norm.includes('matricula') || norm.includes('registro') || norm.includes('codigo') || norm.includes('id'))) {
        newMap.ra = h;
      } else if (!newMap.cpf && (norm.includes('cpf') || norm.includes('documento') || norm.includes('doc'))) {
        newMap.cpf = h;
      } else if (!newMap.email && (norm.includes('email') || norm.includes('e-mail') || norm.includes('correio'))) {
        newMap.email = h;
      } else if (!newMap.birthDate && (norm.includes('nasc') || norm.includes('aniversario') || norm.includes('birth'))) {
        newMap.birthDate = h;
      } else if (!newMap.turma && (norm.includes('turma') || norm.includes('classe') || norm.includes('class') || norm.includes('sala'))) {
        newMap.turma = h;
      } else if (!newMap.course && (norm.includes('curso') || norm.includes('course') || norm.includes('graduacao'))) {
        newMap.course = h;
      } else if (!newMap.status && (norm.includes('status') || norm.includes('situacao') || norm.includes('estado'))) {
        newMap.status = h;
      } else if (!newMap.period && (norm.includes('periodo') || norm.includes('semestre') || norm.includes('ano') || norm.includes('termo'))) {
        newMap.period = h;
      }
    });

    setMapping(newMap);
    return newMap;
  };

  // Process raw JSON rows from sheet
  const processRawData = (jsonData: any[], headers: string[], currentMap: typeof mapping) => {
    const existingRAs = new Set(students.map(s => s.academicRegistration.trim()));

    const rows: ParsedStudentRow[] = jsonData.map((row, index) => {
      const rawName = String(row[currentMap.name] || '').trim();
      const rawRA = String(row[currentMap.ra] || '').trim();
      const rawCpf = formatCPF(String(row[currentMap.cpf] || '').trim());
      const rawEmail = String(row[currentMap.email] || '').trim();
      const rawBirth = String(row[currentMap.birthDate] || '').trim();
      const rawTurma = String(row[currentMap.turma] || '').trim();
      const rawCourse = String(row[currentMap.course] || '').trim();
      const rawStatus = String(row[currentMap.status] || '').trim();
      const rawPeriod = String(row[currentMap.period] || '').trim();

      // Check missing fields
      const missing: string[] = [];
      if (!rawName) missing.push('Nome');
      if (!rawRA) missing.push('R.A. (Gerado provisório)');
      if (!rawCpf) missing.push('CPF');
      if (!rawEmail) missing.push('E-mail');
      if (!rawBirth) missing.push('Data de Nasc.');
      if (!rawTurma) missing.push('Turma');
      if (!rawCourse) missing.push('Curso');

      // Generate fallback RA if missing
      const effectiveRA = rawRA || `RA-PROV-${Date.now().toString().slice(-4)}${index + 1}`;

      // Status mapping
      let effectiveStatus: AcademicStatus = defaultStatus;
      const statusLower = rawStatus.toLowerCase();
      if (statusLower.includes('tranc') || statusLower === 'tr') effectiveStatus = 'Trancado';
      else if (statusLower.includes('reman') || statusLower === 're') effectiveStatus = 'Remanejado';
      else if (statusLower.includes('transf') || statusLower === 'tf' || statusLower === 'trf') effectiveStatus = 'Transferido';
      else if (statusLower.includes('ativ') || statusLower === 'a') effectiveStatus = 'Ativo';

      // Email fallback
      const generatedEmail = rawName
        ? `${rawName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '.')}@aluno.avamais.edu.br`
        : `aluno.pendente${index + 1}@aluno.avamais.edu.br`;

      const effectiveEmail = rawEmail || generatedEmail;

      const isDuplicate = existingRAs.has(effectiveRA);

      return {
        tempId: `row-${Date.now()}-${index}`,
        fullName: rawName || `Aluno Não Identificado #${index + 1}`,
        academicRegistration: effectiveRA,
        cpf: rawCpf || '000.000.000-00',
        birthDate: rawBirth || '2002-01-01',
        email: effectiveEmail,
        courseName: rawCourse || courses.find(c => c.id === defaultCourseId)?.name || 'Curso Padrão',
        className: rawTurma || classes.find(c => c.id === defaultClassId)?.name || 'Turma Padrão',
        period: rawPeriod || defaultPeriod,
        status: effectiveStatus,
        hasMissingInfo: missing.length > 0,
        missingFields: missing,
        isDuplicateRA: isDuplicate
      };
    }).filter(r => r.fullName.trim() !== '');

    setParsedRows(rows);
    setStep('preview');
  };

  // Handle Excel/CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        setRawWorkbook(workbook);
        setAvailableSheets(workbook.SheetNames);
        const firstSheetName = workbook.SheetNames[0];
        setSelectedSheet(firstSheetName);

        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (!jsonData || jsonData.length === 0) {
          throw new Error('A planilha selecionada está vazia.');
        }

        // Extract header
        const headerRow = (jsonData[0] || []).map(h => String(h || '').trim()).filter(Boolean);
        setColumns(headerRow);

        const objectData = XLSX.utils.sheet_to_json(worksheet);
        const detectedMap = autoDetectMapping(headerRow);
        processRawData(objectData, headerRow, detectedMap);
      } catch (err: any) {
        console.error('Erro ao ler planilha:', err);
        setErrorMessage(err.message || 'Falha ao processar arquivo. Verifique se o formato é válido (.xlsx, .xls, .csv).');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Erro ao ler o arquivo selecionado.');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  // Switch Sheet
  const handleSheetChange = (sheetName: string) => {
    if (!rawWorkbook) return;
    setSelectedSheet(sheetName);
    const worksheet = rawWorkbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    if (!jsonData || jsonData.length === 0) return;

    const headerRow = (jsonData[0] || []).map(h => String(h || '').trim()).filter(Boolean);
    setColumns(headerRow);

    const objectData = XLSX.utils.sheet_to_json(worksheet);
    const detectedMap = autoDetectMapping(headerRow);
    processRawData(objectData, headerRow, detectedMap);
  };

  // Handle Google Sheets / Drive Link
  const handleFetchGoogleSheets = async () => {
    if (!googleSheetsUrl.trim()) {
      setErrorMessage('Por favor, informe a URL da planilha do Google Sheets.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Extract Google Sheet ID: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
      const match = googleSheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match || !match[1]) {
        throw new Error('URL do Google Sheets inválida. Certifique-se de que o link contém "/spreadsheets/d/ID_DA_PLANILHA".');
      }

      const sheetId = match[1];
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      // Try fetching CSV from public export
      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error('Não foi possível acessar a planilha diretamente. Verifique se o compartilhamento está como "Qualquer pessoa com o link pode ler" ou use a aba "Copiar e Colar Tabela".');
      }

      const csvText = await response.text();
      const workbook = XLSX.read(csvText, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (!jsonData || jsonData.length === 0) {
        throw new Error('A planilha do Google Sheets está vazia.');
      }

      const headerRow = (jsonData[0] || []).map(h => String(h || '').trim()).filter(Boolean);
      setColumns(headerRow);

      const objectData = XLSX.utils.sheet_to_json(worksheet);
      const detectedMap = autoDetectMapping(headerRow);
      setFileName(`Google Sheets (${sheetId.slice(0, 8)}...)`);
      processRawData(objectData, headerRow, detectedMap);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        `${err.message || 'Erro ao carregar Google Sheets.'} Dica: Você também pode abrir sua planilha, selecionar tudo (Ctrl+A), copiar (Ctrl+C) e colar na aba "Copiar e Colar".`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Pasted Tab-Separated or CSV text
  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Cole os dados da sua tabela ou planilha na caixa de texto.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const workbook = XLSX.read(pastedText, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (!jsonData || jsonData.length === 0) {
        throw new Error('Nenhum dado tabular reconhecido no texto colado.');
      }

      const headerRow = (jsonData[0] || []).map(h => String(h || '').trim()).filter(Boolean);
      setColumns(headerRow);

      const objectData = XLSX.utils.sheet_to_json(worksheet);
      const detectedMap = autoDetectMapping(headerRow);
      setFileName('Dados Colados via Área de Transferência');
      processRawData(objectData, headerRow, detectedMap);
    } catch (err: any) {
      setErrorMessage('Falha ao processar texto colado. Verifique se os dados estão em formato de tabela ou CSV.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Update a field in the preview table
  const handleUpdateRowField = (index: number, field: keyof ParsedStudentRow, value: any) => {
    setParsedRows(prev => {
      const updated = [...prev];
      const finalVal = field === 'cpf' ? formatCPF(String(value || '')) : value;
      const target = { ...updated[index], [field]: finalVal };

      // Recheck missing info
      const missing: string[] = [];
      if (!target.fullName.trim()) missing.push('Nome');
      if (!target.academicRegistration.trim() || target.academicRegistration.startsWith('RA-PROV-')) missing.push('R.A. (Provisório)');
      if (!target.cpf.trim() || target.cpf === '000.000.000-00') missing.push('CPF');
      if (!target.email.trim()) missing.push('E-mail');

      target.hasMissingInfo = missing.length > 0;
      target.missingFields = missing;

      updated[index] = target;
      return updated;
    });
  };

  // Remove row from preview
  const handleRemoveRow = (index: number) => {
    setParsedRows(prev => prev.filter((_, i) => i !== index));
  };

  // Download Sample Template Spreadsheet
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nome Completo': 'Carlos Eduardo Silva',
        'RA / Matrícula': '2026100901',
        'CPF': '123.456.789-00',
        'E-mail': 'carlos.silva@aluno.avamais.edu.br',
        'Data de Nascimento': '2003-04-15',
        'Curso': courses[0]?.name || 'Análise e Desenvolvimento de Sistemas',
        'Turma': classes[0]?.name || 'Turma ADS-2026A',
        'Situação': 'Ativo',
        'Período': '2026.1'
      },
      {
        'Nome Completo': 'Mariana Souza Santos (Sem CPF e RA)',
        'RA / Matrícula': '',
        'CPF': '',
        'E-mail': '',
        'Data de Nascimento': '',
        'Curso': '',
        'Turma': '',
        'Situação': 'Ativo',
        'Período': '2026.1'
      },
      {
        'Nome Completo': 'Lucas Ribeiro Fernandes',
        'RA / Matrícula': '2026100903',
        'CPF': '321.654.987-11',
        'E-mail': 'lucas.fernandes@aluno.avamais.edu.br',
        'Data de Nascimento': '2002-11-20',
        'Curso': courses[0]?.name || 'Análise e Desenvolvimento de Sistemas',
        'Turma': classes[0]?.name || 'Turma ADS-2026A',
        'Situação': 'Ativo',
        'Período': '2026.1'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ModeloAlunos');
    XLSX.writeFile(workbook, 'modelo_importacao_alunos_ava.xlsx');
  };

  // Final Confirmation & Insertion
  const handleConfirmImport = () => {
    if (parsedRows.length === 0) {
      setErrorMessage('Nenhum aluno válido para importar.');
      return;
    }

    const defaultCourse = courses.find(c => c.id === defaultCourseId) || courses[0];
    const defaultClass = classes.find(c => c.id === defaultClassId) || classes[0];

    const studentsToInsert: Student[] = parsedRows.map((row, i) => {
      // Find course
      const matchedCourse = courses.find(c =>
        c.name.toLowerCase().trim() === row.courseName.toLowerCase().trim()
      ) || defaultCourse;

      // Find class
      const matchedClass = classes.find(c =>
        c.name.toLowerCase().trim() === row.className.toLowerCase().trim()
      ) || defaultClass;

      return {
        id: `st-import-${Date.now()}-${i}`,
        fullName: row.fullName.trim(),
        academicRegistration: row.academicRegistration.trim(),
        cpf: row.cpf.trim() || '000.000.000-00',
        birthDate: row.birthDate || '2002-01-01',
        email: row.email.trim(),
        courseId: matchedCourse?.id || '',
        courseName: matchedCourse?.name || row.courseName,
        classId: matchedClass?.id || '',
        className: matchedClass?.name || row.className,
        classIds: matchedClass?.id ? [matchedClass.id] : [],
        period: row.period || defaultPeriod,
        status: row.status,
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
      };
    });

    addStudents(studentsToInsert);
    setImportedCount(studentsToInsert.length);
    setStep('success');
  };

  const handleReset = () => {
    setParsedRows([]);
    setFileName('');
    setRawWorkbook(null);
    setAvailableSheets([]);
    setGoogleSheetsUrl('');
    setPastedText('');
    setErrorMessage(null);
    setStep('upload');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[92vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div
          className="p-5 sm:p-6 text-white flex items-center justify-between relative overflow-hidden"
          style={{ backgroundColor: institution.primaryColor || '#002B5B' }}
        >
          <div className="relative z-10 flex items-center gap-3">
            <div
              className="p-3 rounded-2xl border shadow-inner text-slate-900"
              style={{
                backgroundColor: institution.secondaryColor || '#40E0D0',
                borderColor: `${institution.secondaryColor || '#40E0D0'}80`
              }}
            >
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${institution.secondaryColor || '#40E0D0'}30`,
                    color: institution.secondaryColor || '#40E0D0'
                  }}
                >
                  Importador Inteligente
                </span>
                <span className="text-xs text-slate-300 font-semibold">
                  Excel • Google Drive • Planilhas
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                Cadastro de Alunos por Planilha / Google Drive
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Aviso de Processamento:</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-600 dark:text-rose-400 hover:underline text-[11px] font-bold"
              >
                Fechar
              </button>
            </div>
          )}

          {/* STEP 1: UPLOAD / SOURCE SELECTION */}
          {step === 'upload' && (
            <div className="space-y-6">
              
              {/* Notice Banner regarding incomplete info */}
              <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-sm text-cyan-950 dark:text-cyan-100">
                    Importação Flexível e Tolerante a Informações Incompletas
                  </p>
                  <p className="mt-1 text-cyan-800 dark:text-cyan-300 leading-relaxed">
                    Você pode subir listas que contenham apenas o nome ou informações parciais. O sistema gera identificadores provisórios e permite que você <strong>preencha ou edite os dados faltantes manualmente a qualquer momento</strong> no painel de estudantes!
                  </p>
                </div>
              </div>

              {/* Source Selection Tabs */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveSource('excel')}
                  className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeSource === 'excel'
                      ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Arquivo Excel / CSV (.xlsx, .csv)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSource('drive')}
                  className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeSource === 'drive'
                      ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Link do Google Sheets / Drive</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSource('paste')}
                  className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeSource === 'paste'
                      ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ClipboardPaste className="w-4 h-4" />
                  <span>Copiar e Colar Tabela</span>
                </button>
              </div>

              {/* TAB 1: EXCEL / CSV */}
              {activeSource === 'excel' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 rounded-3xl p-8 sm:p-12 text-center bg-slate-50/50 dark:bg-slate-800/30 hover:bg-cyan-50/30 dark:hover:bg-cyan-950/20 transition-all cursor-pointer group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv, .tsv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-16 h-16 rounded-2xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Clique para selecionar ou arraste o arquivo da planilha
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                      Formatos suportados: <strong>.XLSX, .XLS, .CSV</strong> (Excel, LibreOffice, exportações do Google Sheets).
                    </p>
                    <span className="inline-block mt-4 text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                      Selecionar Arquivo no Computador
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Precisa de um modelo pronto? Baixe a planilha de exemplo com as colunas recomendadas.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-cyan-500 transition-colors"
                    >
                      <Download className="w-4 h-4 text-cyan-500" />
                      <span>Baixar Planilha Modelo (.xlsx)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: GOOGLE DRIVE / SHEETS */}
              {activeSource === 'drive' && (
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                      <LinkIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Importar via Link do Google Sheets
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Cole o link da sua planilha do Google Drive para sincronizar e importar os alunos.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      URL da Planilha do Google Sheets:
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                        value={googleSheetsUrl}
                        onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                        className="flex-1 px-4 py-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        disabled={isProcessing || !googleSheetsUrl.trim()}
                        onClick={handleFetchGoogleSheets}
                        className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Carregando...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4" /> Carregar Planilha
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      💡 <strong>Dica de Acesso:</strong> No Google Sheets, certifique-se de que a opção de compartilhamento esteja como <em>"Qualquer pessoa com o link pode ler"</em>. Se sua instituição restringir o link, use a aba <strong>"Copiar e Colar Tabela"</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: PASTE TEXT */}
              {activeSource === 'paste' && (
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-2xl">
                      <ClipboardPaste className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Colar Tabela Diretamente (Ctrl+V)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Abra qualquer planilha (Excel, Google Sheets, LibreOffice), selecione as linhas, copie (Ctrl+C) e cole no campo abaixo.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Conteúdo Copiado da Planilha:
                    </label>
                    <textarea
                      rows={6}
                      placeholder={`Nome Completo\tRA\tCPF\tE-mail\tTurma\nCarlos Eduardo Silva\t2026100901\t123.456.789-00\tcarlos@email.com\tTurma ADS-2026A\nMariana Souza Santos\t\t\t\t`}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      className="w-full px-4 py-3 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isProcessing || !pastedText.trim()}
                      onClick={handleProcessPastedText}
                      className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Processando...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" /> Processar Dados Colados
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Default Fallbacks Section */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-cyan-500" />
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Valores Padrão (Atribuídos automaticamente quando o campo não constar na planilha):
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Curso Padrão:
                    </label>
                    <select
                      value={defaultCourseId}
                      onChange={(e) => setDefaultCourseId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Turma Padrão:
                    </label>
                    <select
                      value={defaultClassId}
                      onChange={(e) => setDefaultClassId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                    >
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name} ({cls.shift})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Período Letivo:
                    </label>
                    <input
                      type="text"
                      value={defaultPeriod}
                      onChange={(e) => setDefaultPeriod(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Situação Inicial:
                    </label>
                    <select
                      value={defaultStatus}
                      onChange={(e) => setDefaultStatus(e.target.value as AcademicStatus)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none font-bold"
                    >
                      <option value="Ativo">Ativo (Verde)</option>
                      <option value="Trancado">Trancado (Laranja)</option>
                      <option value="Remanejado">Remanejado (Roxo)</option>
                      <option value="Transferido">Transferido (Vermelho)</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: PREVIEW & IN-LINE EDITOR */}
          {step === 'preview' && (
            <div className="space-y-5">
              
              {/* Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-600 text-white rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Pré-visualização da Lista: {parsedRows.length} Alunos Identificados
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Origem: <strong>{fileName}</strong>
                      {availableSheets.length > 1 && ` • Aba: ${selectedSheet}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sheet Selector if multiple sheets */}
                  {availableSheets.length > 1 && (
                    <select
                      value={selectedSheet}
                      onChange={(e) => handleSheetChange(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs rounded-xl px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200 outline-none"
                    >
                      {availableSheets.map(s => (
                        <option key={s} value={s}>Aba: {s}</option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Trocar Arquivo
                  </button>
                </div>
              </div>

              {/* Status summary badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Cadastros Completos:</span>
                  </div>
                  <span className="text-sm font-black text-emerald-800 dark:text-emerald-200">
                    {parsedRows.filter(r => !r.hasMissingInfo).length}
                  </span>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Informações Pendentes:</span>
                  </div>
                  <span className="text-sm font-black text-amber-800 dark:text-amber-200">
                    {parsedRows.filter(r => r.hasMissingInfo).length}
                  </span>
                </div>

                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300 text-xs font-bold">
                    <School className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>Turma de Destino:</span>
                  </div>
                  <span className="text-xs font-black text-cyan-800 dark:text-cyan-200 truncate max-w-[140px]">
                    {classes.find(c => c.id === defaultClassId)?.name || 'Padrão'}
                  </span>
                </div>
              </div>

              {/* Editable Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold z-10">
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Status do Cadastro</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Nome Completo do Aluno</th>
                        <th className="py-2.5 px-3 min-w-[140px]">R.A. (Matrícula)</th>
                        <th className="py-2.5 px-3 min-w-[130px]">CPF</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Turma</th>
                        <th className="py-2.5 px-3 min-w-[120px]">Situação</th>
                        <th className="py-2.5 px-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                      {parsedRows.map((row, idx) => (
                        <tr
                          key={row.tempId}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            row.hasMissingInfo ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>

                          <td className="py-2.5 px-3">
                            {row.hasMissingInfo ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                                title={`Campos pendentes: ${row.missingFields.join(', ')}. Você pode importar mesmo assim e editar depois.`}
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Pendente ({row.missingFields.length})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Completo</span>
                              </span>
                            )}
                          </td>

                          {/* Editable Name */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={row.fullName}
                              onChange={(e) => handleUpdateRowField(idx, 'fullName', e.target.value)}
                              className="w-full bg-transparent hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded px-2 py-1 font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500"
                            />
                          </td>

                          {/* Editable RA */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={row.academicRegistration}
                              onChange={(e) => handleUpdateRowField(idx, 'academicRegistration', e.target.value)}
                              className={`w-full bg-transparent hover:bg-white dark:hover:bg-slate-800 border rounded px-2 py-1 font-mono text-[11px] font-bold outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500 ${
                                row.academicRegistration.startsWith('RA-PROV-')
                                  ? 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400'
                                  : 'border-transparent text-slate-800 dark:text-slate-200'
                              }`}
                            />
                          </td>

                          {/* Editable CPF */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={row.cpf}
                              onChange={(e) => handleUpdateRowField(idx, 'cpf', e.target.value)}
                              className="w-full bg-transparent hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-300 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500"
                            />
                          </td>

                          {/* Class Name */}
                          <td className="py-2.5 px-3">
                            <select
                              value={row.className}
                              onChange={(e) => handleUpdateRowField(idx, 'className', e.target.value)}
                              className="w-full bg-transparent hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-300 outline-none"
                            >
                              {classes.map(cls => (
                                <option key={cls.id} value={cls.name}>{cls.name}</option>
                              ))}
                            </select>
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3">
                            <select
                              value={row.status}
                              onChange={(e) => handleUpdateRowField(idx, 'status', e.target.value as AcademicStatus)}
                              className="w-full bg-transparent hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded px-2 py-1 font-bold text-slate-700 dark:text-slate-300 outline-none"
                            >
                              <option value="Ativo">Ativo (Verde)</option>
                              <option value="Trancado">Trancado (Laranja)</option>
                              <option value="Remanejado">Remanejado (Roxo)</option>
                              <option value="Transferido">Transferido (Vermelho)</option>
                            </select>
                          </td>

                          {/* Delete row */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Remover este aluno da lista de importação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  Alunos com dados pendentes serão salvos normalmente e poderão ter R.A., CPF, data de nascimento e fotos ajustados no painel a qualquer momento.
                </span>
                <span className="font-bold font-mono text-[11px] bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                  {parsedRows.length} registros
                </span>
              </div>

            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && (
            <div className="p-8 sm:p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {importedCount} Estudantes Importados com Sucesso!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                Os alunos foram cadastrados na instituição atual e vinculados às turmas selecionadas. Eles já estão visíveis na lista de estudantes, no AVA e nas listas de chamada.
              </p>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Concluir e Ver Lista de Estudantes
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Importar Outra Planilha
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {step === 'preview' && (
          <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              Voltar / Cancelar
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                {parsedRows.length} estudantes prontos para inserção
              </span>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: institution.secondaryColor || '#40E0D0',
                  color: institution.primaryColor || '#002B5B'
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar e Cadastrar {parsedRows.length} Alunos</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
