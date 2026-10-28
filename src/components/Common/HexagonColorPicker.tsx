import React, { useState } from 'react';
import {
  Palette,
  Check,
  Sparkles,
  RefreshCw,
  Eye,
  Sliders,
  School,
  GraduationCap
} from 'lucide-react';

interface HexagonColorPickerProps {
  primaryColor: string;
  secondaryColor?: string;
  onChangePrimary: (color: string) => void;
  onChangeSecondary?: (color: string) => void;
  institutionName?: string;
  institutionCode?: string;
}

// Curated 37-color educational & institutional honeycomb palette
export interface HexColorOption {
  hex: string;
  name: string;
  family: 'blue' | 'cyan' | 'green' | 'purple' | 'red' | 'warm' | 'neutral';
}

export const HONEYCOMB_COLORS: HexColorOption[][] = [
  // Row 1 (4 items)
  [
    { hex: '#0284C7', name: 'Azul Céu', family: 'blue' },
    { hex: '#002B5B', name: 'Azul Marinho AVA', family: 'blue' },
    { hex: '#1E3A8A', name: 'Azul Real', family: 'blue' },
    { hex: '#312E81', name: 'Índigo Profundo', family: 'blue' }
  ],
  // Row 2 (5 items)
  [
    { hex: '#06B6D4', name: 'Ciano Vibrante', family: 'cyan' },
    { hex: '#40E0D0', name: 'Turquesa AVA+', family: 'cyan' },
    { hex: '#0D9488', name: 'Verde Petróleo', family: 'cyan' },
    { hex: '#4F46E5', name: 'Índigo Acadêmico', family: 'purple' },
    { hex: '#6366F1', name: 'Índigo Claro', family: 'purple' }
  ],
  // Row 3 (6 items)
  [
    { hex: '#10B981', name: 'Esmeralda', family: 'green' },
    { hex: '#059669', name: 'Verde Floresta', family: 'green' },
    { hex: '#065F46', name: 'Verde Institucional', family: 'green' },
    { hex: '#7C3AED', name: 'Violeta Tecnológico', family: 'purple' },
    { hex: '#8B5CF6', name: 'Roxo Universitário', family: 'purple' },
    { hex: '#9333EA', name: 'Púrpura', family: 'purple' }
  ],
  // Row 4 (7 items) - Center Row
  [
    { hex: '#84CC16', name: 'Verde Lima', family: 'green' },
    { hex: '#15803D', name: 'Verde Botânico', family: 'green' },
    { hex: '#0F172A', name: 'Azul Noturno Slate', family: 'neutral' },
    { hex: '#1E293B', name: 'Titânio Escuro', family: 'neutral' },
    { hex: '#334155', name: 'Grafite Técnico', family: 'neutral' },
    { hex: '#BE185D', name: 'Magenta Clássico', family: 'red' },
    { hex: '#A855F7', name: 'Orquídea', family: 'purple' }
  ],
  // Row 5 (6 items)
  [
    { hex: '#EAB308', name: 'Amarelo Ouro', family: 'warm' },
    { hex: '#F59E0B', name: 'Âmbar Tradicional', family: 'warm' },
    { hex: '#D97706', name: 'Bronze Universitário', family: 'warm' },
    { hex: '#E11D48', name: 'Carmim Real', family: 'red' },
    { hex: '#BE123C', name: 'Bordô Acadêmico', family: 'red' },
    { hex: '#881337', name: 'Vinho Nobre', family: 'red' }
  ],
  // Row 6 (5 items)
  [
    { hex: '#F97316', name: 'Laranja Inovação', family: 'warm' },
    { hex: '#EA580C', name: 'Tangerina Forte', family: 'warm' },
    { hex: '#C2410C', name: 'Terracota', family: 'warm' },
    { hex: '#DC2626', name: 'Vermelho Rubro', family: 'red' },
    { hex: '#991B1B', name: 'Grená Institucional', family: 'red' }
  ],
  // Row 7 (4 items)
  [
    { hex: '#B45309', name: 'Ocre Antigo', family: 'warm' },
    { hex: '#78350F', name: 'Castanho Nobre', family: 'warm' },
    { hex: '#475569', name: 'Chumbo Frio', family: 'neutral' },
    { hex: '#020617', name: 'Preto Absoluto', family: 'neutral' }
  ]
];

// Curated Institutional Palettes
export const INSTITUTIONAL_PALETTES = [
  {
    id: 'fed-public',
    name: 'Universidade Federal / Pública',
    primary: '#002B5B',
    secondary: '#F59E0B',
    description: 'Azul Marinho e Âmbar Dourado tradicional'
  },
  {
    id: 'tech-poly',
    name: 'Politécnico & Tecnologia',
    primary: '#0F172A',
    secondary: '#40E0D0',
    description: 'Azul Noturno Slate com Turquesa AVA+'
  },
  {
    id: 'health-bio',
    name: 'Saúde, Medicina & Biológicas',
    primary: '#065F46',
    secondary: '#10B981',
    description: 'Verde Floresta institucional com Esmeralda'
  },
  {
    id: 'law-humanities',
    name: 'Direito & Humanidades',
    primary: '#881337',
    secondary: '#D97706',
    description: 'Bordô Nobre com Ouro Bronze'
  },
  {
    id: 'arts-comm',
    name: 'Design, Comunicação & Artes',
    primary: '#4338CA',
    secondary: '#EC4899',
    description: 'Índigo Criativo com Rosa Coral'
  },
  {
    id: 'eng-innov',
    name: 'Engenharia & Inovação',
    primary: '#1E293B',
    secondary: '#F97316',
    description: 'Grafite Técnico com Laranja Energia'
  }
];

export const HexagonColorPicker: React.FC<HexagonColorPickerProps> = ({
  primaryColor = '#002B5B',
  secondaryColor = '#40E0D0',
  onChangePrimary,
  onChangeSecondary,
  institutionName = 'Minha Instituição de Ensino',
  institutionCode = 'AVA'
}) => {
  const [activeTarget, setActiveTarget] = useState<'primary' | 'secondary'>('primary');
  const [hoveredColor, setHoveredColor] = useState<HexColorOption | null>(null);

  const currentColor = activeTarget === 'primary' ? primaryColor : (secondaryColor || '#40E0D0');

  const handleSelectColor = (hex: string) => {
    if (activeTarget === 'primary') {
      onChangePrimary(hex);
    } else if (onChangeSecondary) {
      onChangeSecondary(hex);
    }
  };

  const handleApplyPalette = (palette: typeof INSTITUTIONAL_PALETTES[0]) => {
    onChangePrimary(palette.primary);
    if (onChangeSecondary) {
      onChangeSecondary(palette.secondary);
    }
  };

  // Helper to determine if hex is light or dark for text contrast
  const isLightColor = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return false;
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.65;
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 space-y-5">
      
      {/* Header with selector for Primary vs Secondary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#002B5B] text-[#40E0D0] dark:bg-slate-700">
              <Palette className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              Hexagonal de Cores Institucionais
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Selecione a identidade visual que será aplicada no portal desta escola/faculdade.
          </p>
        </div>

        {/* Target Switcher: Primary vs Accent */}
        <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-900/80 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTarget('primary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTarget === 'primary'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-300 dark:ring-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm"
              style={{ backgroundColor: primaryColor }}
            />
            <span>Cor Principal</span>
          </button>

          {onChangeSecondary && (
            <button
              type="button"
              onClick={() => setActiveTarget('secondary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTarget === 'secondary'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-300 dark:ring-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: secondaryColor || '#40E0D0' }}
              />
              <span>Destaque / Acentos</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left / Center: Geometric Honeycomb Hexagon Grid */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-3 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner overflow-hidden">
          
          <div className="text-center mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Colmeia Hexagonal ({activeTarget === 'primary' ? 'Definindo Cor Principal' : 'Definindo Cor de Destaque'})
            </span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span
                className="w-3.5 h-3.5 rounded-full inline-block shadow-sm ring-2 ring-slate-200 dark:ring-slate-700"
                style={{ backgroundColor: currentColor }}
              />
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {hoveredColor ? `${hoveredColor.name} (${hoveredColor.hex})` : currentColor.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Hexagonal Honeycomb Render */}
          <div className="flex flex-col items-center justify-center space-y-[-10px] sm:space-y-[-12px] py-2 select-none overflow-x-auto max-w-full">
            {HONEYCOMB_COLORS.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="flex items-center justify-center space-x-1 sm:space-x-1.5">
                {row.map((color) => {
                  const isSelected = currentColor.toLowerCase() === color.hex.toLowerCase();
                  const isLight = isLightColor(color.hex);

                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => handleSelectColor(color.hex)}
                      onMouseEnter={() => setHoveredColor(color)}
                      onMouseLeave={() => setHoveredColor(null)}
                      title={`${color.name} (${color.hex})`}
                      className="group relative cursor-pointer focus:outline-none transition-transform duration-150 hover:scale-125 hover:z-20 active:scale-95"
                      style={{
                        width: '38px',
                        height: '43px',
                      }}
                    >
                      {/* Pure CSS / SVG Hexagon */}
                      <svg
                        viewBox="0 0 100 115.47"
                        className="w-full h-full drop-shadow-sm transition-all"
                        style={{
                          filter: isSelected ? 'drop-shadow(0 0 6px rgba(0,0,0,0.4))' : undefined
                        }}
                      >
                        <polygon
                          points="50 0, 100 28.87, 100 86.6, 50 115.47, 0 86.6, 0 28.87"
                          fill={color.hex}
                          stroke={isSelected ? '#ffffff' : 'rgba(0,0,0,0.15)'}
                          strokeWidth={isSelected ? '6' : '1.5'}
                          className="transition-colors"
                        />
                      </svg>

                      {/* Selected Indicator Checkmark */}
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Check
                            className={`w-3.5 h-3.5 stroke-[3.5] ${isLight ? 'text-slate-900' : 'text-white'}`}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Custom Hex Code & Native Color Picker Bar */}
          <div className="w-full mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Código Hex Personalizado:
              </label>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-mono text-xs mr-0.5">#</span>
                <input
                  type="text"
                  maxLength={6}
                  value={currentColor.replace('#', '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                      handleSelectColor(`#${val}`);
                    }
                  }}
                  className="w-16 bg-transparent font-mono font-bold text-xs uppercase text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>
            </div>

            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors">
              <input
                type="color"
                value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#002B5B'}
                onChange={(e) => handleSelectColor(e.target.value)}
                className="w-4 h-4 rounded border-0 p-0 cursor-pointer bg-transparent"
              />
              <span>Mais Cores...</span>
            </label>
          </div>
        </div>

        {/* Right: Presets & Real-time Live Preview */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Real-time Institution UI Preview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Pré-visualização da Identidade
              </span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-mono font-semibold">
                Tempo Real
              </span>
            </div>

            {/* Mock Header Preview */}
            <div
              className="rounded-xl p-3.5 text-white shadow-md transition-all duration-300 space-y-2 relative overflow-hidden"
              style={{
                backgroundColor: primaryColor,
                borderLeft: `4px solid ${secondaryColor || '#40E0D0'}`
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm"
                    style={{
                      backgroundColor: secondaryColor || '#40E0D0',
                      color: primaryColor
                    }}
                  >
                    <School className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">
                      AVA+ Presença • {institutionCode || 'INST'}
                    </span>
                    <h4 className="text-xs font-black truncate max-w-[170px] leading-tight">
                      {institutionName || 'Nome da Escola'}
                    </h4>
                  </div>
                </div>

                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm"
                  style={{
                    backgroundColor: `${secondaryColor || '#40E0D0'}25`,
                    color: secondaryColor || '#40E0D0',
                    border: `1px solid ${secondaryColor || '#40E0D0'}50`
                  }}
                >
                  Unidade Ativa
                </span>
              </div>

              {/* Sample Buttons & Badges */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold shadow transition-transform"
                  style={{
                    backgroundColor: secondaryColor || '#40E0D0',
                    color: isLightColor(secondaryColor || '#40E0D0') ? '#002B5B' : '#ffffff'
                  }}
                >
                  Chamada & Notas
                </button>
                <div
                  className="px-2 py-1 rounded-lg text-[10px] font-bold border"
                  style={{
                    borderColor: 'rgba(255,255,255,0.25)',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }}
                >
                  Turmas: 12
                </div>
              </div>
            </div>

            {/* Quick Summary of Current Palette */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-md shrink-0 shadow-sm border border-black/10"
                  style={{ backgroundColor: primaryColor }}
                />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block">Principal</span>
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {primaryColor}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-md shrink-0 shadow-sm border border-black/10"
                  style={{ backgroundColor: secondaryColor || '#40E0D0' }}
                />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block">Destaque</span>
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {secondaryColor || '#40E0D0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Preset Palettes for Quick Selection */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Paletas Institucionais Prontas
              </span>
              <span className="text-[10px] text-slate-400">1 clique</span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {INSTITUTIONAL_PALETTES.map((pal) => {
                const isSelected =
                  primaryColor.toLowerCase() === pal.primary.toLowerCase() &&
                  (secondaryColor || '').toLowerCase() === pal.secondary.toLowerCase();

                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => handleApplyPalette(pal)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-500 ring-1 ring-slate-400'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center -space-x-1.5 shrink-0">
                        <div
                          className="w-4 h-4 rounded-full border border-white dark:border-slate-800 shadow-sm"
                          style={{ backgroundColor: pal.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-white dark:border-slate-800 shadow-sm"
                          style={{ backgroundColor: pal.secondary }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {pal.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {pal.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
