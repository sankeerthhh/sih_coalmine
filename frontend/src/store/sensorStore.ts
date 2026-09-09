import { create } from 'zustand';
import { SensorNode, RiskSummary, Alert } from '../types';

interface SensorState {
  sensors: SensorNode[];
  selectedSensorId: string | null;
  selectedPanelId: string;
  riskSummary: RiskSummary | null;
  alerts: Alert[];
  lastUpdateTimestamp: Date;
  activeScenario: string;

  setSensors: (sensors: SensorNode[]) => void;
  setSelectedSensorId: (id: string | null) => void;
  setSelectedPanelId: (panel: string) => void;
  setRiskSummary: (risk: RiskSummary) => void;
  setAlerts: (alerts: Alert[]) => void;
  setActiveScenario: (scenario: string) => void;
  
  updateFromWebSocket: (telemetryData: any) => void;
}

export const useSensorStore = create<SensorState>((set, get) => ({
  sensors: [],
  selectedSensorId: 'N14',
  selectedPanelId: 'PANEL-B3',
  riskSummary: null,
  alerts: [],
  lastUpdateTimestamp: new Date(),
  activeScenario: 'NORMAL',

  setSensors: (sensors) => set({ sensors }),
  setSelectedSensorId: (id) => set({ selectedSensorId: id }),
  setSelectedPanelId: (panel) => set({ selectedPanelId: panel }),
  setRiskSummary: (riskSummary) => set({ riskSummary }),
  setAlerts: (alerts) => set({ alerts }),
  setActiveScenario: (activeScenario) => set({ activeScenario }),

  updateFromWebSocket: (payload) => {
    const { reading, risk, alert } = payload;
    const currentSensors = [...get().sensors];

    if (reading) {
      const idx = currentSensors.findIndex(s => s.id === reading.node_id);
      if (idx !== -1) {
        currentSensors[idx] = {
          ...currentSensors[idx],
          status: reading.status,
          battery_level: reading.battery_level,
          signal_strength_rssi: reading.signal_strength,
          last_seen_at: reading.timestamp,
          latest_reading: reading
        };
      }
    }

    set({
      sensors: currentSensors,
      lastUpdateTimestamp: new Date(),
      ...(risk ? {
        riskSummary: {
          current_risk_score: risk.risk_score,
          risk_classification: risk.risk_classification,
          primary_panel: risk.panel_id,
          affected_cluster: 'Cluster N12-N16',
          factors: risk.factors || {},
          trend_direction: risk.risk_score > 50 ? 'INCREASING' : 'STABLE',
          scientific_disclaimer: 'Prototype / Simulated Sensor Data. Decision support platform.'
        }
      } : {}),
      ...(alert ? {
        alerts: [
          alert,
          ...get().alerts.filter(a => a.id !== alert.id)
        ]
      } : {})
    });
  }
}));
