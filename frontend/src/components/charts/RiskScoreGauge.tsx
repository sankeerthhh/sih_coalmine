import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface RiskScoreGaugeProps {
  score: number;
  classification: 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL' | string;
  factors: Record<string, number>;
  explanation?: string;
}

export const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({
  score,
  classification,
  factors,
  explanation
}) => {
  let scoreColor = '#16A34A';
  if (score > 80) scoreColor = '#DC2626';
  else if (score > 60) scoreColor = '#EA580C';
  else if (score > 30) scoreColor = '#F59E0B';

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              AI Risk Assessment & Anomaly Score
            </h3>
            <p className="text-[11px] text-slate-500">
              Multi-parameter geotechnical stability index
            </p>
          </div>
          <StatusBadge status={classification} size="md" />
        </div>

        {/* Score Radial Metric */}
        <div className="flex items-center gap-6 my-4">
          <div className="relative flex items-center justify-center w-28 h-28 rounded-full border-4" style={{ borderColor: scoreColor }}>
            <div className="text-center">
              <span className="text-3xl font-extrabold text-slate-900 block leading-none">
                {Math.round(score)}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 mt-1 block">
                out of 100
              </span>
            </div>
          </div>

          <div className="flex-1 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">{classification} RISK</h4>
            <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
              {explanation || "Ground movements within baseline geotechnical equilibrium tolerance."}
            </p>
          </div>
        </div>

        {/* Contributing Factors Breakdown */}
        <div className="mt-5 space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Factor Attribution (% Contribution)
          </span>

          {Object.entries(factors).map(([factorName, pct]) => (
            <div key={factorName} className="text-xs">
              <div className="flex justify-between text-slate-700 font-medium mb-1 text-[11px]">
                <span>{factorName}</span>
                <span className="font-mono font-bold text-slate-900">{pct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-start gap-2 text-[10px] text-slate-400">
        <Info className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
        <span>
          AI-assisted anomaly detection for decision support. Does not claim 100% subsidence prediction.
        </span>
      </div>
    </div>
  );
};
