import React from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck, AlertTriangle, FileText, ArrowLeft } from 'lucide-react';
import { useSensorStore } from '../../store/sensorStore';

interface DgmsReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DgmsReportModal: React.FC<DgmsReportModalProps> = ({ isOpen, onClose }) => {
  const { activeScenario, sensors, riskSummary } = useSensorStore();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentScenario = activeScenario;
  const riskScore = riskSummary?.current_risk_score ?? 15;
  const riskClassification = riskSummary?.risk_classification ?? 'NORMAL';

  const handlePrint = () => {
    window.print();
  };

  const criticalNodes = sensors.filter((s) => s.status === 'CRITICAL');
  const warningNodes = sensors.filter((s) => s.status === 'WARNING');
  const maxDisplacement = Math.max(...sensors.map((s) => s.latest_reading?.displacement || 0));
  const maxTilt = Math.max(...sensors.map((s) => {
    const r = s.latest_reading;
    return r ? Math.sqrt(r.tilt_x**2 + r.tilt_y**2) : 0;
  }));

  const reportDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const reportTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-hidden print:p-0 print:bg-white"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-300 overflow-hidden print:border-none print:shadow-none print:max-h-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header Actions (hidden in print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 sticky top-0 z-30 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-sm">DGMS Statutory Subsidence Compliance Report (CMR 2017)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Back to dashboard / Close"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 transition cursor-pointer border border-slate-600 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Report Document */}
        <div className="p-8 space-y-6 text-slate-800 overflow-y-auto flex-1 print:p-6 print:space-y-4 print:overflow-visible font-sans text-xs">
          {/* Government / Mine Header */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
            <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">
              Government of India • Ministry of Coal
            </div>
            <h1 className="text-xl font-extrabold uppercase text-slate-900 tracking-tight">
              Directorate General of Mines Safety (DGMS)
            </h1>
            <h2 className="text-sm font-semibold text-slate-700">
              Daily Surface Subsidence & Strata Movement Inspection Audit Report
            </h2>
            <div className="text-[10px] text-slate-500">
              Generated in accordance with Coal Mines Regulations, 2017 (Regulation 111 & 112)
            </div>
          </div>

          {/* Audit Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
            <div>
              <span className="text-slate-500 block">Colliery Name:</span>
              <span className="font-bold text-slate-900">Korba Colliery (Block-A)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Operating Subsidiary:</span>
              <span className="font-bold text-slate-900">SECL (CIL)</span>
            </div>
            <div>
              <span className="text-slate-500 block">Audit Date & Time:</span>
              <span className="font-bold text-slate-900">{reportDate} {reportTime}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Statutory Audit ID:</span>
              <span className="font-mono font-bold text-blue-700">DGMS-SECL-2026-B3</span>
            </div>
          </div>

          {/* Executive Safety Assessment Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
              1. Executive Safety Assessment
            </h3>
            <div className="flex items-center gap-4 p-3 rounded-lg border bg-slate-50">
              <div className="text-2xl font-black">
                {currentScenario === 'NORMAL' && <span className="text-emerald-600">COMPLIANT (NORMAL)</span>}
                {currentScenario === 'EARLY_WARNING' && <span className="text-amber-600">ELEVATED WATCH (WARNING)</span>}
                {currentScenario === 'CRITICAL_SUBSIDENCE' && <span className="text-rose-600">CRITICAL HAZARD - RESTRICTED</span>}
              </div>
              <div className="text-slate-600 text-[11px] leading-relaxed">
                Overall AI Subsidence Risk Index: <span className="font-bold">{riskScore}/100</span> ({riskClassification}).
                Surface strain and tilt sensors across 24 LoRa nodes currently show
                {currentScenario === 'NORMAL' && ' permissible strata movement well within DGMS 3.0° and 50mm safe limits.'}
                {currentScenario === 'EARLY_WARNING' && ' early signs of strata deflection over Panel B3. Precautionary monitoring active.'}
                {currentScenario === 'CRITICAL_SUBSIDENCE' && ' severe localized ground tensile cracking and accelerated subsidence over Panel B3.'}
              </div>
            </div>
          </div>

          {/* Geotechnical Parameters Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
              2. Strata Deformation Telemetry Summary
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-[11px] text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-300 p-2">Parameter</th>
                  <th className="border border-slate-300 p-2">Measured Peak Value</th>
                  <th className="border border-slate-300 p-2">DGMS Permissible Limit</th>
                  <th className="border border-slate-300 p-2">Compliance Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 font-medium">Maximum Surface Tilt (Resultant)</td>
                  <td className="border border-slate-300 p-2 font-mono font-bold">{maxTilt.toFixed(2)}°</td>
                  <td className="border border-slate-300 p-2">3.00° (52.4 mm/m)</td>
                  <td className="border border-slate-300 p-2 font-semibold">
                    {maxTilt < 3.0 ? <span className="text-emerald-600">Within Limit</span> : <span className="text-rose-600">LIMIT EXCEEDED</span>}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-medium">Maximum Cumulative Displacement</td>
                  <td className="border border-slate-300 p-2 font-mono font-bold">{maxDisplacement.toFixed(1)} mm</td>
                  <td className="border border-slate-300 p-2">50.0 mm</td>
                  <td className="border border-slate-300 p-2 font-semibold">
                    {maxDisplacement < 50.0 ? <span className="text-emerald-600">Within Limit</span> : <span className="text-rose-600">LIMIT EXCEEDED</span>}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-medium">Surface Tension Crack Detection Circuit</td>
                  <td className="border border-slate-300 p-2 font-mono font-bold">
                    {currentScenario === 'CRITICAL_SUBSIDENCE' ? 'BROKEN (Crack Active)' : 'CONTINUOUS (Intact)'}
                  </td>
                  <td className="border border-slate-300 p-2">Zero Fracture Tolerance</td>
                  <td className="border border-slate-300 p-2 font-semibold">
                    {currentScenario === 'CRITICAL_SUBSIDENCE' ? <span className="text-rose-600">CRACK CONFIRMED</span> : <span className="text-emerald-600">Normal</span>}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-medium">LoRa Mesh Network Packet Delivery Ratio (PDR)</td>
                  <td className="border border-slate-300 p-2 font-mono font-bold">99.4%</td>
                  <td className="border border-slate-300 p-2">&gt; 95.0%</td>
                  <td className="border border-slate-300 p-2 font-semibold text-emerald-600">Optimal Link</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Under-Watch Panels */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
              3. Underground Extraction Panels Status
            </h3>
            <div className="grid grid-cols-3 gap-3 text-[11px]">
              <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                <div className="font-bold text-slate-900">Panel A1 & A2 (Goaf)</div>
                <div className="text-slate-500">Status: Inactive / Sealed</div>
                <div className="text-emerald-600 font-semibold mt-1">Movement: 0.1 mm/day (Stable)</div>
              </div>
              <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                <div className="font-bold text-slate-900">Panel B1 & B2 (Continuous Miner)</div>
                <div className="text-slate-500">Status: Active Extraction</div>
                <div className="text-emerald-600 font-semibold mt-1">Movement: 0.3 mm/day (Normal)</div>
              </div>
              <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                <div className="font-bold text-slate-900">Panel B3 (Depillaring Epicenter)</div>
                <div className="text-slate-500">Status: Active Depillaring</div>
                <div className={`font-semibold mt-1 ${currentScenario === 'CRITICAL_SUBSIDENCE' ? 'text-rose-600' : 'text-amber-600'}`}>
                  Movement: {currentScenario === 'CRITICAL_SUBSIDENCE' ? '14.8 mm/day (ACCELERATED)' : '1.2 mm/day (Monitored)'}
                </div>
              </div>
            </div>
          </div>

          {/* Officer Verification and Sign-Off Block */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-[11px]">
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                Certified that the wireless surface mesh telemetry and automated AI anomaly logs recorded herein accurately represent the geotechnical status of Korba Mine Block-A on {reportDate}.
              </p>
              <div className="space-y-1">
                <div className="border-b border-slate-400 w-48 pb-6"></div>
                <div className="font-bold text-slate-900">Er. Sai Sankeerth Reddy</div>
                <div className="text-slate-500">Mine Safety Officer / Colliery Surveyor (SECL)</div>
              </div>
            </div>
            <div className="space-y-4 text-right sm:text-right">
              <p className="text-slate-600 leading-relaxed">
                Counter-signed for statutory records and submission to DGMS Bilaspur Regional Circle.
              </p>
              <div className="space-y-1 inline-block text-left">
                <div className="border-b border-slate-400 w-48 pb-6"></div>
                <div className="font-bold text-slate-900">Colliery Agent / General Manager</div>
                <div className="text-slate-500">Korba Area, SECL / Ministry of Coal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions Bar (hidden in print) */}
        <div className="px-6 py-3 bg-slate-100 text-slate-700 flex items-center justify-between shrink-0 sticky bottom-0 z-30 border-t border-slate-200 print:hidden">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-200 border border-slate-300 transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">CMR 2017 Statutory Format • Press Esc to close</span>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
