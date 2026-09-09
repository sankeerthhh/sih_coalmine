import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface SensorTrendChartProps {
  data: any[];
  title?: string;
  metric?: 'tilt' | 'displacement' | 'vibration' | 'all';
  height?: number;
}

export const SensorTrendChart: React.FC<SensorTrendChartProps> = ({
  data,
  title = "Geotechnical Deformation Trends (Past 24h)",
  metric = 'all',
  height = 280
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-slate-200 text-center text-xs text-slate-400">
        No telemetry records available for graphing.
      </div>
    );
  }

  // Format timestamp for X-axis
  const formattedData = data.map(d => ({
    ...d,
    timeLabel: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tilt: d.resultant_tilt !== undefined ? d.resultant_tilt : Math.sqrt((d.tilt_x||0)**2 + (d.tilt_y||0)**2),
    displacement: d.displacement,
    vibration: d.vibration
  }));

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">
          {formattedData.length} data samples
        </span>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              tick={{ fontSize: 10, fill: '#64748B' }}
              stroke="#CBD5E1"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748B' }}
              stroke="#CBD5E1"
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderRadius: '6px',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '11px',
                padding: '8px 12px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

            {(metric === 'all' || metric === 'tilt') && (
              <Line
                type="monotone"
                dataKey="tilt"
                name="Tilt (°)"
                stroke="#2563EB"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}

            {(metric === 'all' || metric === 'displacement') && (
              <Line
                type="monotone"
                dataKey="displacement"
                name="Displacement (mm)"
                stroke="#DC2626"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}

            {(metric === 'all' || metric === 'vibration') && (
              <Line
                type="monotone"
                dataKey="vibration"
                name="Vibration (mm/s)"
                stroke="#F59E0B"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
