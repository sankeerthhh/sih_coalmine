import { create } from 'zustand';
import { SensorNode, RiskSummary, Alert } from '../types';

export interface ThresholdConfig {
  warningThreshold: number;
  highThreshold: number;
  criticalThreshold: number;
  samplingInterval: number;
}

export interface Supervisor {
  id: string;
  name: string;
  designation: string;
  phone: string;
  shift: string;
  assignedPanel: string;
}

interface SensorState {
  sensors: SensorNode[];
  selectedSensorId: string | null;
  selectedPanelId: string;
  riskSummary: RiskSummary | null;
  alerts: Alert[];
  supervisors: Supervisor[];
  lastUpdateTimestamp: Date;
  activeScenario: string;
  thresholds: ThresholdConfig;

  setSensors: (sensors: SensorNode[]) => void;
  setSelectedSensorId: (id: string | null) => void;
  setSelectedPanelId: (panel: string) => void;
  setRiskSummary: (risk: RiskSummary) => void;
  setAlerts: (alerts: Alert[]) => void;
  setActiveScenario: (scenario: string) => void;
  addSensor: (sensor: SensorNode) => void;
  removeSensor: (id: string) => void;
  addSupervisor: (supervisor: Supervisor) => void;
  removeSupervisor: (id: string) => void;
  updateThresholds: (thresholds: Partial<ThresholdConfig>) => void;
  acknowledgeAlertLocal: (id: string, operator?: string) => void;
  resolveAlertLocal: (id: string, operator?: string) => void;
  applyLocalScenario: (scenario: string) => void;
  
  updateFromWebSocket: (telemetryData: any) => void;
}

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  warningThreshold: 30,
  highThreshold: 60,
  criticalThreshold: 80,
  samplingInterval: 6
};

const DEFAULT_SUPERVISORS: Supervisor[] = [
  {
    id: 'SUP-01',
    name: 'Er. R. K. Sharma',
    designation: 'Mine Safety Officer (SECL)',
    phone: '+91 98765 43210',
    shift: 'Morning (06:00 - 14:00)',
    assignedPanel: 'Panel B3 (Active Depillaring)'
  },
  {
    id: 'SUP-02',
    name: 'Er. Ananya Patel',
    designation: 'Surface Geotechnical In-Charge',
    phone: '+91 94255 12345',
    shift: 'Evening (14:00 - 22:00)',
    assignedPanel: 'Panel B2 & B3'
  },
  {
    id: 'SUP-03',
    name: 'Er. Vikramaditya Singh',
    designation: 'Shift Overman (Extraction)',
    phone: '+91 77592 88990',
    shift: 'Night (22:00 - 06:00)',
    assignedPanel: 'Panel B3 (Active Depillaring)'
  }
];

function loadStoredSupervisors(): Supervisor[] {
  try {
    const raw = localStorage.getItem('mine_subsidence_supervisors');
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return DEFAULT_SUPERVISORS;
}

function loadStoredThresholds(): ThresholdConfig {
  try {
    const raw = localStorage.getItem('mine_subsidence_thresholds');
    if (raw) return { ...DEFAULT_THRESHOLDS, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return DEFAULT_THRESHOLDS;
}

export const useSensorStore = create<SensorState>((set, get) => ({
  sensors: [],
  selectedSensorId: null,
  selectedPanelId: 'PANEL-B3',
  riskSummary: null,
  alerts: [],
  supervisors: loadStoredSupervisors(),
  lastUpdateTimestamp: new Date(),
  activeScenario: 'NORMAL',
  thresholds: loadStoredThresholds(),

  setSensors: (sensors) => set({ sensors }),
  setSelectedSensorId: (id) => set({ selectedSensorId: id }),
  setSelectedPanelId: (panel) => set({ selectedPanelId: panel }),
  setRiskSummary: (riskSummary) => set({ riskSummary }),
  setAlerts: (alerts) => set({ alerts }),
  setActiveScenario: (activeScenario) => set({ activeScenario }),

  addSensor: (newSensor: SensorNode) => {
    const current = get().sensors;
    const exists = current.some(s => s.id === newSensor.id);
    const updated = exists 
      ? current.map(s => s.id === newSensor.id ? newSensor : s)
      : [...current, newSensor];
    set({ sensors: updated });
  },

  removeSensor: (id: string) => {
    set({ sensors: get().sensors.filter(s => s.id !== id) });
  },

  addSupervisor: (newSup: Supervisor) => {
    const current = get().supervisors;
    const exists = current.some(s => s.id === newSup.id);
    const updated = exists ? current.map(s => s.id === newSup.id ? newSup : s) : [...current, newSup];
    try {
      localStorage.setItem('mine_subsidence_supervisors', JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ supervisors: updated });
  },

  removeSupervisor: (id: string) => {
    const updated = get().supervisors.filter(s => s.id !== id);
    try {
      localStorage.setItem('mine_subsidence_supervisors', JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ supervisors: updated });
  },

  updateThresholds: (config: Partial<ThresholdConfig>) => {
    const updated = { ...get().thresholds, ...config };
    try {
      localStorage.setItem('mine_subsidence_thresholds', JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ thresholds: updated });
  },

  acknowledgeAlertLocal: (id: string, operator: string = 'Mine Safety Officer') => {
    set({
      alerts: get().alerts.map(a => 
        a.id === id ? { ...a, status: 'ACKNOWLEDGED', acknowledged_by: operator, acknowledged_at: new Date().toISOString() } : a
      )
    });
  },

  resolveAlertLocal: (id: string, operator: string = 'Mine Safety Officer') => {
    set({
      alerts: get().alerts.map(a => 
        a.id === id ? { ...a, status: 'RESOLVED', resolved_at: new Date().toISOString(), acknowledged_by: a.acknowledged_by || operator } : a
      )
    });
  },

  applyLocalScenario: (scenario: string) => {
    const currentSensors = [...get().sensors];
    const nowIso = new Date().toISOString();

    if (scenario === 'NORMAL' || scenario === 'RESET') {
      const resetSensors = currentSensors.map(s => ({
        ...s,
        status: (s.id === 'N01' ? 'ONLINE' : 'ONLINE') as any,
        battery_level: Math.max(75, s.battery_level),
        signal_strength_rssi: -65 - Math.floor(Math.random() * 10),
        latest_reading: s.latest_reading ? {
          ...s.latest_reading,
          tilt_x: 0.15,
          tilt_y: 0.20,
          displacement: 1.2,
          vibration: 0.08,
          crack_detected: false,
          anomaly_score: 12.0
        } : null
      }));

      set({
        sensors: resetSensors,
        activeScenario: scenario === 'RESET' ? 'NORMAL' : scenario,
        riskSummary: {
          current_risk_score: 14.5,
          risk_classification: 'NORMAL',
          primary_panel: 'PANEL-B3',
          affected_cluster: 'Panel B3 Baseline',
          factors: {
            "Displacement Velocity": 12.0,
            "Tilt Angle Increase": 10.0,
            "Spatial Correlation": 8.0,
            "Vibration RMS": 11.0
          },
          trend_direction: 'STABLE',
          scientific_disclaimer: 'Prototype / Simulated Sensor Data. Decision support platform.',
          explanation: 'All panels within permissible geotechnical tolerance limits. Normal operations.'
        },
        alerts: get().alerts.map(a => a.status === 'ACTIVE' ? { ...a, status: 'RESOLVED' as const } : a),
        lastUpdateTimestamp: new Date()
      });
      return;
    }

    if (scenario === 'EARLY_WARNING') {
      const updated = currentSensors.map(s => {
        if (['N12', 'N13', 'N14', 'N15'].includes(s.id)) {
          return {
            ...s,
            status: 'WARNING' as const,
            latest_reading: {
              ...(s.latest_reading || {
                id: Math.random(),
                node_id: s.id,
                timestamp: nowIso,
                battery_level: 85,
                signal_strength: -72,
                is_outlier: false
              }),
              tilt_x: 2.1,
              tilt_y: 2.8,
              displacement: 16.5,
              vibration: 0.45,
              crack_detected: false,
              anomaly_score: 54.0,
              timestamp: nowIso
            }
          };
        }
        return s;
      });

      const newAlert: Alert = {
        id: `ALT-${Date.now().toString().slice(-4)}`,
        panel_id: 'PANEL-B3',
        node_cluster: 'Cluster N12-N15',
        title: 'Developing Strata Tilt & Displacement in Panel B3',
        condition_detected: 'Tilt threshold exceeded (3.5° resultant) with 16.5mm surface displacement.',
        severity: 'WARNING',
        status: 'ACTIVE',
        ai_risk_score: 55,
        measured_tilt: 3.5,
        measured_displacement: 16.5,
        crack_detected: false,
        recommended_action: 'Increase telemetry sampling rate to 6s. Alert geotechnical safety inspector.',
        created_at: nowIso
      };

      set({
        sensors: updated,
        activeScenario: 'EARLY_WARNING',
        riskSummary: {
          current_risk_score: 55.0,
          risk_classification: 'WARNING',
          primary_panel: 'PANEL-B3',
          affected_cluster: 'Cluster N12-N15',
          factors: {
            "Displacement Velocity": 58.0,
            "Tilt Angle Increase": 48.0,
            "Spatial Correlation": 42.0,
            "Vibration RMS": 35.0
          },
          trend_direction: 'INCREASING',
          scientific_disclaimer: 'Prototype / Simulated Sensor Data. Decision support platform.',
          explanation: 'Developing tilt & displacement trend observed in Panel B3. Heightened monitoring active.'
        },
        alerts: [newAlert, ...get().alerts.filter(a => a.id !== newAlert.id)],
        lastUpdateTimestamp: new Date()
      });
      return;
    }

    if (scenario === 'SUBSIDENCE_CRITICAL') {
      const updated = currentSensors.map(s => {
        if (['N14', 'N15'].includes(s.id)) {
          return {
            ...s,
            status: 'CRITICAL' as const,
            latest_reading: {
              ...(s.latest_reading || {
                id: Math.random(),
                node_id: s.id,
                timestamp: nowIso,
                battery_level: 80,
                signal_strength: -75,
                is_outlier: true
              }),
              tilt_x: 5.8,
              tilt_y: 6.4,
              displacement: 44.2,
              vibration: 1.85,
              crack_detected: true,
              anomaly_score: 92.0,
              timestamp: nowIso
            }
          };
        }
        if (['N12', 'N13', 'N16'].includes(s.id)) {
          return {
            ...s,
            status: 'WARNING' as const,
            latest_reading: {
              ...(s.latest_reading || {
                id: Math.random(),
                node_id: s.id,
                timestamp: nowIso,
                battery_level: 82,
                signal_strength: -74,
                is_outlier: false
              }),
              tilt_x: 3.2,
              tilt_y: 3.5,
              displacement: 22.0,
              vibration: 0.95,
              crack_detected: false,
              anomaly_score: 72.0,
              timestamp: nowIso
            }
          };
        }
        return s;
      });

      const criticalAlert: Alert = {
        id: `ALT-CRIT-${Date.now().toString().slice(-4)}`,
        panel_id: 'PANEL-B3',
        node_cluster: 'Cluster N14-N15',
        title: 'CRITICAL: Acute Ground Subsidence & Crack Initiation Wire Severed',
        condition_detected: 'Rapid downward deformation (44.2mm) with physical tension wire breach.',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        ai_risk_score: 92,
        measured_tilt: 8.64,
        measured_displacement: 44.2,
        crack_detected: true,
        recommended_action: 'Immediate field evacuation of Panel B3 surface zone. Restrict heavy machinery access. Notify DGMS.',
        created_at: nowIso
      };

      set({
        sensors: updated,
        activeScenario: 'SUBSIDENCE_CRITICAL',
        riskSummary: {
          current_risk_score: 92.0,
          risk_classification: 'CRITICAL',
          primary_panel: 'PANEL-B3',
          affected_cluster: 'Cluster N14-N15',
          factors: {
            "Displacement Velocity": 94.0,
            "Tilt Angle Increase": 88.0,
            "Spatial Correlation": 84.0,
            "Vibration RMS": 78.0
          },
          trend_direction: 'INCREASING',
          scientific_disclaimer: 'Prototype / Simulated Sensor Data. Decision support platform.',
          explanation: 'Abnormal surface deformation and crack wire severance in Panel B3 depillaring cluster. Field inspection recommended.'
        },
        alerts: [criticalAlert, ...get().alerts.filter(a => a.id !== criticalAlert.id)],
        lastUpdateTimestamp: new Date()
      });
      return;
    }

    if (scenario === 'SENSOR_FAILURE') {
      const updated = currentSensors.map(s => {
        if (s.id === 'N14') {
          return {
            ...s,
            status: 'OFFLINE' as const,
            signal_strength_rssi: -115,
            battery_level: 0
          };
        }
        return s;
      });

      set({
        sensors: updated,
        activeScenario: 'SENSOR_FAILURE',
        lastUpdateTimestamp: new Date()
      });
      return;
    }

    if (scenario === 'NETWORK_FAILURE') {
      const updated = currentSensors.map(s => {
        if (['N12', 'N13'].includes(s.id)) {
          return {
            ...s,
            status: 'WARNING' as const,
            signal_strength_rssi: -98
          };
        }
        return s;
      });

      set({
        sensors: updated,
        activeScenario: 'NETWORK_FAILURE',
        lastUpdateTimestamp: new Date()
      });
      return;
    }

    set({ activeScenario: scenario });
  },

  updateFromWebSocket: (payload) => {
    if (!payload) return;

    // Direct sensors array update
    if (Array.isArray(payload)) {
      set({ sensors: payload, lastUpdateTimestamp: new Date() });
      return;
    }

    if (payload.sensors && Array.isArray(payload.sensors)) {
      set({ sensors: payload.sensors, lastUpdateTimestamp: new Date() });
      return;
    }

    const { reading, risk, alert } = payload;
    const currentSensors = [...get().sensors];

    if (reading) {
      const idx = currentSensors.findIndex(s => s.id === reading.node_id);
      if (idx !== -1) {
        currentSensors[idx] = {
          ...currentSensors[idx],
          status: reading.status || currentSensors[idx].status,
          battery_level: reading.battery_level ?? currentSensors[idx].battery_level,
          signal_strength_rssi: reading.signal_strength ?? currentSensors[idx].signal_strength_rssi,
          last_seen_at: reading.timestamp || new Date().toISOString(),
          latest_reading: reading
        };
      }
    }

    set({
      sensors: currentSensors,
      lastUpdateTimestamp: new Date(),
      ...(risk ? {
        riskSummary: {
          current_risk_score: risk.risk_score ?? risk.current_risk_score ?? 14.5,
          risk_classification: risk.risk_classification ?? 'NORMAL',
          primary_panel: risk.panel_id ?? 'PANEL-B3',
          affected_cluster: risk.affected_cluster || 'Cluster N12-N16',
          factors: risk.factors || {},
          trend_direction: (risk.risk_score ?? 0) > 50 ? 'INCREASING' : 'STABLE',
          scientific_disclaimer: 'Prototype / Simulated Sensor Data. Decision support platform.',
          explanation: risk.explanation
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
