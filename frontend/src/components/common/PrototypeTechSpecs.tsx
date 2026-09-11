import React from 'react';
import { Cpu, Radio, Zap, Shield, DollarSign, Database, Brain, Globe } from 'lucide-react';

export const PrototypeTechSpecs: React.FC = () => {
  const specs = [
    {
      title: "Surface Sensor Node",
      hardware: "ESP32 (Dual Core) + MPU6050 6-DoF IMU",
      role: "Continuous high-precision surface tilt & vibration RMS sensing",
      cost: "~₹650 ($8 USD)",
      icon: <Cpu className="w-4 h-4 text-blue-500" />
    },
    {
      title: "Deformation & Crack Wire",
      hardware: "Linear Extensometer Potentiometer + Breakwire",
      role: "Relative ground stretch & sudden tensile crack detection",
      cost: "~₹350 ($4 USD)",
      icon: <Zap className="w-4 h-4 text-amber-500" />
    },
    {
      title: "Surface Mesh Radio",
      hardware: "Semtech SX1262 LoRa (865-867 MHz IN Band)",
      role: "Multi-hop localized DAG mesh with autonomous failover routing",
      cost: "~₹450 ($5.50 USD)",
      icon: <Radio className="w-4 h-4 text-emerald-500" />
    },
    {
      title: "Solar Power Harvesting",
      hardware: "3.7V 18650 Li-Ion (3400mAh) + 5V 2W Solar Panel",
      role: "Zero-maintenance autonomous surface deployment for 18+ months",
      cost: "~₹400 ($5 USD)",
      icon: <Zap className="w-4 h-4 text-yellow-500" />
    },
    {
      title: "Local Sensor Gateway",
      hardware: "ESP32 LoRa Gateway Hub / Raspberry Pi",
      role: "Aggregates localized surface mesh telemetry into FastAPI cloud bridge",
      cost: "~₹1,800 ($22 USD)",
      icon: <Shield className="w-4 h-4 text-purple-500" />
    },
    {
      title: "AI / ML & Decision Engine",
      hardware: "FastAPI + Scikit-Learn + Gemini AI + Leaflet GIS",
      role: "Supervised Random Forest, Isolation Forest, Risk Fusion & Explainability",
      cost: "Open-Source / Accessible",
      icon: <Brain className="w-4 h-4 text-indigo-500" />
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Low-Cost Student Prototype Bill of Materials (BOM)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrating economic feasibility, energy autonomy, and rapid deployment for underground coalfield monitoring
          </p>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
          Target Node Unit Cost: &lt; ₹1,850 ($22.50)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {specs.map((item, idx) => (
          <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white rounded border border-slate-200 shadow-2xs">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <span className="text-[10px] text-blue-600 font-semibold block">{item.hardware}</span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                {item.cost}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              {item.role}
            </p>
          </div>
        ))}
      </div>

      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md text-[11px] text-amber-900 flex items-start gap-2">
        <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Student Hackathon Prototype Disclaimer: </span>
          Designed using accessible, commercial-off-the-shelf (COTS) microelectronics for student prototyping under Smart India Hackathon guidelines. Operational underground mine deployment requires intrinsic safety (IS) flameproof certification and DGMS statutory clearance.
        </div>
      </div>
    </div>
  );
};
