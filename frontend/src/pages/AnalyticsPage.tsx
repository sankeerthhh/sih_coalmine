import React, { useEffect, useState } from 'react';
import { LineChart, Download, Filter, Calendar, Activity, BarChart2, ArrowLeft } from 'lucide-react';
import { SensorTrendChart } from '../components/charts/SensorTrendChart';
import { useSensorStore } from '../store/sensorStore';
import { api } from '../services/api';

interface AnalyticsPageProps {
  onNavigatePage?: (page: any) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onNavigatePage }) => {
  const { sensors, selectedSensorId, setSelectedSensorId } = useSensorStore();
  const [rangeStr, setRangeStr] = useState<string>('24h');
  const [trendData, setTrendData] = useState<any[]>([]);
  const [riskData, setRiskData] = useState<any[]>([]);
  const [activeMetric, setActiveMetric] = useState<'all' | 'tilt' | 'displacement' | 'vibration'>('all');
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    const targetNode = selectedSensorId || 'N14';
    api.getAnalytics(targetNode, rangeStr)
      .then((res) => {
        setTrendData(res.telemetry_trends || []);
        setRiskData(res.risk_trends || []);
      })
      .catch(console.error);
  }, [selectedSensorId, rangeStr]);

  const handleExportCSV = () => {
    if (!trendData || trendData.length === 0) {
      alert("No telemetry records available to export for this time range.");
      return;
    }
    const headers = ["Timestamp", "NodeID", "ResultantTilt_deg", "Displacement_mm", "Vibration_RMS", "CrackDetected", "AnomalyScore"];
    const rows = trendData.map(d => [
      d.timestamp,
      selectedSensorId || 'N14',
      d.resultant_tilt,
      d.displacement,
      d.vibration,
      d.crack_detected,
      d.anomaly_score
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `telemetry_${selectedSensorId || 'N14'}_${rangeStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Export Bar with Back Button */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
            <button
              onClick={() => onNavigatePage && onNavigatePage('dashboard')}
              className="hover:text-blue-600 font-medium cursor-pointer"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="font-semibold text-slate-900">Historical Analytics</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LineChart className="w-4 h-4 text-blue-600" />
            Geotechnical Time-Series Analytics & Parametric Trends
          </h2>
          <p className="text-xs text-slate-500">
            Multi-axis time-series visualization across surface subsidence indicators
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {onNavigatePage && (
            <button
              type="button"
              onClick={() => onNavigatePage('dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs transition cursor-pointer border border-slate-300 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          )}
          {/* Sensor Node Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded px-2.5 py-1">
            <span className="text-slate-500 font-medium">Sensor:</span>
            <select
              value={selectedSensorId || 'N14'}
              onChange={(e) => setSelectedSensorId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {sensors.map(s => (
                <option key={s.id} value={s.id}>
                  {s.id} ({s.panel_id})
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
            {[
              { id: '1h', label: '1 Hour' },
              { id: '24h', label: '24 Hours' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' }
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRangeStr(r.id)}
                className={`px-3 py-1 rounded text-[11px] font-semibold transition ${
                  rangeStr === r.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
            {[
              { id: 'all', label: 'Combined' },
              { id: 'tilt', label: 'Tilt Only' },
              { id: 'displacement', label: 'Displacement' },
              { id: 'vibration', label: 'Vibration' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMetric(m.id as any)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  activeMetric === m.id ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            {exportSuccess ? 'CSV Exported!' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Chart 1: Primary Geotechnical Deformation Trend */}
      <SensorTrendChart
        data={trendData}
        title={`Geotechnical Time Series: Node ${selectedSensorId || 'N14'} (${rangeStr.toUpperCase()})`}
        metric={activeMetric}
        height={320}
      />

      {/* Chart 2: AI Risk Score vs Time */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              AI Risk Index Progression (Panel B3 Depillaring Section)
            </h3>
            <p className="text-[11px] text-slate-500">
              Evaluated composite risk score combining spatial-temporal anomaly metrics
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700">
            Threshold: Warning &gt; 30, Critical &gt; 80
          </span>
        </div>

        <SensorTrendChart
          data={trendData}
          title="AI Anomaly Score Progression (%)"
          metric="custom"
          customMetricKey="anomaly_score"
          customMetricName="Anomaly Score (%)"
          customColor="#EA580C"
          height={220}
        />
      </div>
    </div>
  );
};
