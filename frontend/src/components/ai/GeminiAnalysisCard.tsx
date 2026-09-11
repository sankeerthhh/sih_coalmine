import React, { useState } from 'react';
import { Sparkles, Brain, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { RiskSummary } from '../../types';

interface GeminiAnalysisCardProps {
  panelId: string;
  focusNodeId?: string;
  riskSummary?: RiskSummary | null;
  riskScore?: number;
  riskClassification?: string;
}

export const GeminiAnalysisCard: React.FC<GeminiAnalysisCardProps> = ({
  panelId,
  focusNodeId = 'N14',
  riskSummary,
  riskScore,
  riskClassification
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await api.getAiExplanation(panelId, focusNodeId);
      setAnalysis(res.ai_explanation);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate default on first render if not generated yet
  React.useEffect(() => {
    if (!analysis) {
      fetchAnalysis();
    }
  }, [panelId, focusNodeId]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-200">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Gemini AI Geotechnical Decision Advisory
              </h3>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                Explainable AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Synthesizes Random Forest predictions, Subsidence Fingerprint, and physical sensor telemetry
            </p>
          </div>
        </div>

        <button
          onClick={fetchAnalysis}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition cursor-pointer shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Consulting Gemini...' : 'Refresh AI Analysis'}</span>
        </button>
      </div>

      {/* Explanation Body */}
      {loading ? (
        <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
          <span>Synthesizing multi-model geotechnical telemetry through Gemini AI pipeline...</span>
        </div>
      ) : analysis ? (
        <div className="space-y-3.5 text-xs">
          {/* Main narrative */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 leading-relaxed text-[12px]">
            <p className="font-medium text-slate-900">
              {analysis.geotechnical_explanation}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Primary Factors */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Key Contributing Physical Factors:
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-600">
                {analysis.primary_contributing_factors?.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Actions */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Statutory Engineering & Field Guidance:
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-700 font-medium">
                {analysis.recommended_actions?.map((act: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Compliance & Source Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {analysis.dgms_compliance_summary || 'Compliant with DGMS Geotechnical Surveillance Norms'}
            </span>
            <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Source: {analysis.source || 'Gemini 2.5 Flash / Decision Pipeline'}
            </span>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-slate-400 text-xs">
          Click "Refresh AI Analysis" to generate an explainable geotechnical briefing.
        </div>
      )}

      {/* Safety Guardrail Note */}
      <div className="text-[10px] text-slate-400 bg-slate-50/70 p-2 rounded border border-slate-200">
        <strong>SIH Architecture Guardrail:</strong> Gemini AI functions solely as an explanation and advisory interface. Ground risk determinations originate strictly from verified sensor validation, Isolation Forest, Random Forest ML, and geotechnical physical thresholds.
      </div>
    </div>
  );
};
