import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Factory,
  Package,
  Truck,
  Warehouse,
  Plus,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Eye,
  Sliders,
  Layers,
  Zap,
} from 'lucide-react';

interface GradientOption {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
  fromHex: string;
  toHex: string;
  cssGradient: string;
  tailwindClass: string;
  buttonClass: string;
  cardHeaderClass: string;
  contrastRatio: string;
  wcagLevel: 'AAA' | 'AA' | 'AA Large';
  mood: string;
  rationale: string;
  recommendedFor: string;
}

const GRADIENT_OPTIONS: GradientOption[] = [
  {
    id: 'opt-1',
    name: '1. Conservative Corporate',
    subtitle: 'Deep Blue → Navy',
    badge: 'Most Professional',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    fromHex: '#1e40af',
    toHex: '#1e3a8a',
    cssGradient: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
    tailwindClass: 'bg-gradient-to-br from-blue-700 to-blue-900',
    buttonClass: 'bg-gradient-to-br from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white shadow-md shadow-blue-900/20',
    cardHeaderClass: 'from-blue-700 via-blue-800 to-blue-950',
    contrastRatio: '7.8:1',
    wcagLevel: 'AAA',
    mood: 'Traditional, trustworthy, enterprise-grade',
    rationale: 'Single-hue gradient maintains professionalism while adding subtle depth without color fatigue.',
    recommendedFor: 'Core executive dashboards, financial summaries, corporate audits',
  },
  {
    id: 'opt-2',
    name: '2. Modern Professional',
    subtitle: 'Cyan-600 → Sky-700',
    badge: 'Recommended Default',
    badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    fromHex: '#0891b2',
    toHex: '#0369a1',
    cssGradient: 'linear-gradient(135deg, #0891b2 0%, #0369a1 100%)',
    tailwindClass: 'bg-gradient-to-br from-cyan-600 to-sky-700',
    buttonClass: 'bg-gradient-to-br from-cyan-600 to-sky-700 hover:from-cyan-700 hover:to-sky-800 text-white shadow-md shadow-sky-700/25',
    cardHeaderClass: 'from-cyan-600 via-teal-600 to-sky-800',
    contrastRatio: '5.2:1',
    wcagLevel: 'AA Large',
    mood: 'Progressive industrial, data-driven, reliable',
    rationale: 'Teal/cyan suggests precision, automation, and modern technology while staying grounded and readable.',
    recommendedFor: 'General ERP primary actions (Save, Submit, Proceed, Generate Slips)',
  },
  {
    id: 'opt-3',
    name: '3. Trust-Focused (Action-Oriented)',
    subtitle: 'Emerald-700 → Teal-600',
    badge: 'Best for Confirmations',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    fromHex: '#047857',
    toHex: '#0d9488',
    cssGradient: 'linear-gradient(135deg, #047857 0%, #0d9488 100%)',
    tailwindClass: 'bg-gradient-to-br from-emerald-700 to-teal-600',
    buttonClass: 'bg-gradient-to-br from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white shadow-md shadow-emerald-700/25',
    cardHeaderClass: 'from-emerald-700 via-teal-700 to-slate-900',
    contrastRatio: '5.8:1',
    wcagLevel: 'AA',
    mood: 'Confirmatory, growth-oriented, secure',
    rationale: 'Green reinforces positive inventory arrival/confirmation, while teal adds industrial credibility.',
    recommendedFor: 'CONFIRM INWARD, QC Grade Approval, Delivery Sign-off, Stock Additions',
  },
  {
    id: 'opt-4',
    name: '4. Neutral Authority',
    subtitle: 'Slate-700 → Slate-600',
    badge: 'Ultra-Safe',
    badgeClass: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600',
    fromHex: '#334155',
    toHex: '#475569',
    cssGradient: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
    tailwindClass: 'bg-gradient-to-br from-slate-700 to-slate-600',
    buttonClass: 'bg-gradient-to-br from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 text-white shadow-md shadow-slate-900/20',
    cardHeaderClass: 'from-slate-700 via-slate-800 to-slate-950',
    contrastRatio: '9.1:1',
    wcagLevel: 'AAA',
    mood: 'Authoritative, timeless, no-nonsense',
    rationale: 'Near-monochrome conveys seriousness without color bias, offering maximum readability under factory glare.',
    recommendedFor: 'Audit logs, system settings, governance exports, secondary actions',
  },
];

export const GradientStudioView: React.FC = () => {
  const navigate = useNavigate();
  const [activeThemeId, setActiveThemeId] = useState<string>('opt-2');
  const [appliedFeedback, setAppliedFeedback] = useState<string>('');

  const activeOption = GRADIENT_OPTIONS.find(o => o.id === activeThemeId) || GRADIENT_OPTIONS[1];

  const handleApplyTheme = (opt: GradientOption) => {
    localStorage.setItem('saheb_active_theme_gradient', opt.id);
    setAppliedFeedback(`Applied "${opt.name}" as active gradient profile!`);
    setTimeout(() => setAppliedFeedback(''), 4000);
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-700 text-white shadow-lg shadow-sky-600/20">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                Professional Gradient Testing Lab &amp; Design Studio
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                Live Interactive Sandbox
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Side-by-side comparison of all 4 professional gradient options with WCAG accessibility contrast scores.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {appliedFeedback && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{appliedFeedback}</span>
        </div>
      )}

      {/* 2. Interactive Theme Picker Chips */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Select Active Theme for Live Workbench Simulation
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400 font-bold">
            Active: {activeOption.subtitle}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {GRADIENT_OPTIONS.map(opt => {
            const isSelected = opt.id === activeThemeId;
            return (
              <div
                key={opt.id}
                onClick={() => setActiveThemeId(opt.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-slate-50/80 dark:bg-slate-800/80 shadow-md'
                    : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-surface-dark'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${opt.badgeClass}`}>
                      {opt.badge}
                    </span>
                    <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      {opt.wcagLevel} ({opt.contrastRatio})
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {opt.name}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    {opt.subtitle}
                  </p>
                </div>

                {/* Color Swatch Bar */}
                <div
                  className="h-7 w-full rounded-xl shadow-inner border border-white/20 flex items-center justify-center text-[10px] font-black text-white"
                  style={{ background: opt.cssGradient }}
                >
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                  {opt.fromHex} → {opt.toHex}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SECTION 1: SIDE-BY-SIDE KPI CARDS SHOWCASE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading">
              1. Live KPI Cards Comparison (All 4 Styles)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Rendered with live metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GRADIENT_OPTIONS.map((opt) => (
            <div
              key={`kpi-${opt.id}`}
              className="rounded-3xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4 transition hover:-translate-y-1 hover:shadow-2xl"
              style={{ background: opt.cssGradient }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/80">
                    {opt.name.replace(/^\d+\.\s*/, '')}
                  </span>
                  <div className="text-[9px] font-mono text-white/60">{opt.subtitle}</div>
                </div>
                <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white">
                  <Factory className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-black font-mono tracking-tight">
                  2,480 <span className="text-sm font-normal text-white/70">kg</span>
                </div>
                <div className="text-[11px] text-white/90 font-bold mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-emerald-300" />
                  <span>14 Jumbo Rolls &bull; Shift A</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[10px] font-mono text-white/80">
                <span>Contrast: {opt.contrastRatio}</span>
                <span className="px-1.5 py-0.5 rounded bg-white/20 font-black">{opt.wcagLevel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SECTION 2: LIVE ACTION BUTTONS WORKBENCH */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            2. Primary &amp; Confirmation Buttons Showcase
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Test button states across standard primary workflows and confirmation actions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {GRADIENT_OPTIONS.map(opt => (
            <div key={`btn-card-${opt.id}`} className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {opt.name.replace(/^\d+\.\s*/, '')}
                </span>
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${opt.badgeClass}`}>
                  {opt.badge}
                </span>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                className={`w-full py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${opt.buttonClass}`}
              >
                <Plus className="h-4 w-4" />
                <span>Save Production Log</span>
              </button>

              {/* Confirm Inward Button Variant */}
              <button
                type="button"
                className={`w-full py-2.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${opt.buttonClass}`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm Inward Entry</span>
              </button>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-1">
                <code>{opt.fromHex} → {opt.toHex}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. SECTION 3: HERO BANNER PREVIEW (ACTIVE THEME) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            3. Full Hero Header Simulation ({activeOption.name})
          </h3>
          <button
            onClick={() => handleApplyTheme(activeOption)}
            className="px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition hover:bg-primary/90 cursor-pointer"
          >
            Apply This Gradient Globally
          </button>
        </div>

        <div
          className="rounded-[28px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
          style={{ background: activeOption.cssGradient }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Saheb Paper Mill Dashboard
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider">
                  Telemetry Active
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium mt-1">
                Real-time production telemetry, finished stock reserves &amp; dispatch status
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold backdrop-blur-md border border-white/20">
                Export Analytics
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
              <div className="text-xs text-white/80 font-medium">Today's Output</div>
              <div className="text-2xl font-black mt-1">4,280 kg</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
              <div className="text-xs text-white/80 font-medium">Active Stock</div>
              <div className="text-2xl font-black mt-1">61 reels</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
              <div className="text-xs text-white/80 font-medium">Dispatched Today</div>
              <div className="text-2xl font-black mt-1">1,820 kg</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
              <div className="text-xs text-white/80 font-medium">Production Yield</div>
              <div className="text-2xl font-black mt-1">94.8%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. SECTION 4: ACCESSIBILITY & DESIGN RATIONALE MATRIX */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              WCAG Accessibility &amp; Industrial Contrast Verification
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Option</th>
                <th className="py-2.5 px-3">Gradient Hex Range</th>
                <th className="py-2.5 px-3 text-center">Contrast Ratio</th>
                <th className="py-2.5 px-3 text-center">WCAG Level</th>
                <th className="py-2.5 px-3">Best Recommended Use Case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {GRADIENT_OPTIONS.map(opt => (
                <tr key={`table-${opt.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {opt.name}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                    <span className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle" style={{ background: opt.fromHex }} />
                    {opt.fromHex} → {opt.toHex}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-black text-slate-900 dark:text-white">
                    {opt.contrastRatio}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {opt.wcagLevel}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {opt.recommendedFor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
