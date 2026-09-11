import { create } from 'zustand';
import { SensorNode, RiskSummary, Alert, MineHierarchy, SpatialZone, DataSourceMode } from '../types';
import { MOCK_ALERTS, MOCK_MINES, MOCK_SPATIAL_ZONES } from '../services/mockData';
import { api } from '../services/api';

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

export interface BroadcastConfig {
  smsTargetName: string;
  smsTargetPhone: string;
  smsGatewayRoute: string;
  dgmsRecipientName: string;
  dgmsRecipientEmail: string;
  dgmsRegulationRef: string;
  sirenLocation: string;
  sirenRelayChannel: string;
}

export interface BroadcastLogItem {
  id: string;
  timestamp: string;
  panel_id: string;
  trigger_type: 'MANUAL_TEST' | 'AUTOMATED_CRITICAL';
  status: 'DELIVERED' | 'DISPATCHING' | 'FAILED' | 'SENT' | 'SIMULATED' | 'PARTIAL';
  sms_receipt: string;
  dgms_receipt: string;
  siren_status: string;
  recipients_count: number;
  message_preview: string;
  sms_status?: 'SENT' | 'SIMULATED' | 'FAILED';
  email_status?: 'SENT' | 'SIMULATED' | 'FAILED';
  sms_provider?: string;
  email_provider?: string;
  provider_notes?: string;
}

interface SensorState {
  sensors: SensorNode[];
  selectedSensorId: string | null;
  selectedMineId: string;
  selectedPanelId: string;
  mines: MineHierarchy[];
  spatialZones: SpatialZone[];
  riskSummary: RiskSummary | null;
  alerts: Alert[];
  supervisors: Supervisor[];
  broadcastConfig: BroadcastConfig;
  broadcastLogs: BroadcastLogItem[];
  lastUpdateTimestamp: Date;
  dataSourceMode: DataSourceMode;
  isHardwareConnected: boolean;
  lastHardwareTelemetryAt: string | null;
  activeScenario: string;
  thresholds: ThresholdConfig;
  offlineBufferCount: number;
  offlineSyncStatus: 'ONLINE' | 'OFFLINE' | 'SYNCING';
  lastSyncTime: string;

  setDataSourceMode: (mode: DataSourceMode, notifyBackend?: boolean) => Promise<void>;
  setHardwareStatus: (connected: boolean, lastAt?: string | null) => void;
  checkHardwareLiveness: () => void;
  setSensors: (sensors: SensorNode[]) => void;
  setSelectedSensorId: (id: string | null) => void;
  setSelectedMineId: (mineId: string) => void;
  setSelectedPanelId: (panel: string) => void;
  setMines: (mines: MineHierarchy[]) => void;
  setSpatialZones: (zones: SpatialZone[]) => void;
  setRiskSummary: (risk: RiskSummary) => void;
  setAlerts: (alerts: Alert[]) => void;
  setActiveScenario: (scenario: string) => void;
  addSensor: (sensor: SensorNode) => void;
  updateSensor: (id: string, updated: Partial<SensorNode>) => void;
  removeSensor: (id: string) => void;
  addSupervisor: (supervisor: Supervisor) => void;
  updateSupervisor: (id: string, updated: Partial<Supervisor>) => void;
  removeSupervisor: (id: string) => void;
  updateBroadcastConfig: (config: Partial<BroadcastConfig>) => void;
  recordBroadcastLog: (log: BroadcastLogItem) => void;
  updateThresholds: (thresholds: Partial<ThresholdConfig>) => void;
  acknowledgeAlertLocal: (id: string, operator?: string) => void;
  resolveAlertLocal: (id: string, operator?: string) => void;
  applyLocalScenario: (scenario: string) => void;
  bufferReadingOffline: (reading: any) => void;
  syncOfflineReadings: () => Promise<void>;

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
    name: 'R Sai Sankeerth Reddy',
    designation: 'Mine Safety Officer (SECL)',
    phone: '+91 94415 62832',
    shift: 'Morning (06:00 - 14:00)',
    assignedPanel: 'Panel B3 (Active Depillaring)'
  },
  {
    id: 'SUP-02',
    name: 'Dr. Veldandi Aishwarya',
    designation: 'Surface Geotechnical In-Charge',
    phone: '+91 73961 08692',
    shift: 'Evening (14:00 - 22:00)',
    assignedPanel: 'Panel B2 & B3'
  },
  {
    id: 'SUP-03',
    name: 'yeshwanth',
    designation: 'Shift Overman (Extraction)',
    phone: '+91 78158 07618',
    shift: 'Night (22:00 - 06:00)',
    assignedPanel: 'Panel B3 (Active Depillaring)'
  }
];

const DEFAULT_BROADCAST_CONFIG: BroadcastConfig = {
  smsTargetName: 'R Sai Sankeerth Reddy',
  smsTargetPhone: '+91 94415 62832',
  smsGatewayRoute: 'NIC / CDAC Kavach (Sender ID: MINESAFE)',
  dgmsRecipientName: 'Dr. Veldandi Aishwarya',
  dgmsRecipientEmail: 'veldandiaishwarya21@gmail.com',
  dgmsRegulationRef: 'CMR 2017 Reg 111 & 112 Statutory Notice',
  sirenLocation: 'Korba Block-A Central Control Room',
  sirenRelayChannel: 'Panel B3 Perimeter Siren (Modbus TCP CH-04)'
};

function loadStoredBroadcastConfig(): BroadcastConfig {
  try {
    const raw = localStorage.getItem('mine_subsidence_broadcast_cfg');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_BROADCAST_CONFIG, ...parsed };
    }
  } catch {
    // fallback
  }
  return DEFAULT_BROADCAST_CONFIG;
}

function loadStoredSupervisors(): Supervisor[] {
  try {
    const raw = localStorage.getItem('mine_subsidence_supervisors');
    if (raw) {
      const list: Supervisor[] = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
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

function loadStoredDataSource(): DataSourceMode {
  try {
    const raw = localStorage.getItem('mine_subsidence_data_source');
    if (raw === 'HARDWARE' || raw === 'SIMULATION') return raw;
  } catch {
    // fallback
  }
  return 'SIMULATION';
}

export const useSensorStore = create<SensorState>((set, get) => ({
  sensors: [],
  selectedSensorId: null,
  selectedMineId: 'MINE-SECL-KORBA',
  selectedPanelId: 'PANEL-B3',
  mines: [...MOCK_MINES],
  spatialZones: [...MOCK_SPATIAL_ZONES],
  riskSummary: null,
  alerts: [...MOCK_ALERTS],
  supervisors: loadStoredSupervisors(),
  broadcastConfig: loadStoredBroadcastConfig(),
  broadcastLogs: [],
  lastUpdateTimestamp: new Date(),
  dataSourceMode: loadStoredDataSource(),
  isHardwareConnected: false,
  lastHardwareTelemetryAt: null,
  activeScenario: 'NORMAL',
  thresholds: loadStoredThresholds(),
  offlineBufferCount: 0,
  offlineSyncStatus: 'ONLINE',
  lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),

  setSensors: (sensors) => set({ sensors }),
  setSelectedSensorId: (id) => set({ selectedSensorId: id }),
  setSelectedMineId: (mineId) => set({ selectedMineId: mineId }),
  setSelectedPanelId: (panel) => set({ selectedPanelId: panel }),
  setMines: (mines) => set({ mines }),
  setSpatialZones: (spatialZones) => set({ spatialZones }),
  setRiskSummary: (riskSummary) => set({ riskSummary }),
  setAlerts: (newAlerts) => {
    const current = get().alerts;
    const activeUnsaved = current.filter(
      curr => curr.status === 'ACTIVE' && !newAlerts.some(n => n.id === curr.id)
    );
    set({ alerts: [...activeUnsaved, ...newAlerts] });
  },
  setActiveScenario: (activeScenario) => set({ activeScenario }),

  setDataSourceMode: async (mode: DataSourceMode, notifyBackend: boolean = true) => {
    const prevMode = get().dataSourceMode;
    try {
      localStorage.setItem('mine_subsidence_data_source', mode);
    } catch {
      // ignore storage error
    }
    set({ dataSourceMode: mode });

    if (mode === 'HARDWARE') {
      const lastAt = get().lastHardwareTelemetryAt;
      const isFresh = lastAt ? (Date.now() - new Date(lastAt).getTime() < 15000) : false;
      if (!isFresh) {
        set({ isHardwareConnected: false, lastHardwareTelemetryAt: null });
      }
      try {
        const freshSensors = await api.getSensors();
        if (freshSensors && freshSensors.length > 0) {
          set({ sensors: freshSensors });
        }
      } catch (err) {
        console.warn('Deferred fetching fresh sensors on mode switch:', err);
      }
    }

    // Prevent redundant network roundtrip or infinite loops
    if (!notifyBackend || prevMode === mode) return;

    try {
      const res = await api.setSimulatorDataSource(mode);
      if (res?.hardware_connected !== undefined) {
        set({
          isHardwareConnected: res.hardware_connected,
          lastHardwareTelemetryAt: res.last_hardware_telemetry_at || null
        });
      }
    } catch (e) {
      console.warn('Backend data source update deferred:', e);
    }
  },

  setHardwareStatus: (connected: boolean, lastAt: string | null = null) => {
    set({ isHardwareConnected: connected, lastHardwareTelemetryAt: lastAt });
  },

  checkHardwareLiveness: () => {
    const { isHardwareConnected, lastHardwareTelemetryAt } = get();
    if (!lastHardwareTelemetryAt) {
      if (isHardwareConnected) {
        set({ isHardwareConnected: false });
      }
      return;
    }
    const ageMs = Date.now() - new Date(lastHardwareTelemetryAt).getTime();
    if (ageMs > 15000) {
      if (isHardwareConnected) {
        set({ isHardwareConnected: false, lastHardwareTelemetryAt: null });
      }
    }
  },

  bufferReadingOffline: (reading) => {
    try {
      const stored = localStorage.getItem('mine_subsidence_offline_buffer');
      const list = stored ? JSON.parse(stored) : [];
      list.push(reading);
      localStorage.setItem('mine_subsidence_offline_buffer', JSON.stringify(list));
      set({
        offlineBufferCount: list.length,
        offlineSyncStatus: 'OFFLINE'
      });
    } catch {
      // ignore storage error
    }
  },

  syncOfflineReadings: async () => {
    const count = get().offlineBufferCount;
    if (count === 0) return;
    set({ offlineSyncStatus: 'SYNCING' });
    try {
      const stored = localStorage.getItem('mine_subsidence_offline_buffer');
      const list = stored ? JSON.parse(stored) : [];
      if (list.length > 0) {
        await api.syncOfflineBuffer(list);
        localStorage.removeItem('mine_subsidence_offline_buffer');
      }
      set({
        offlineBufferCount: 0,
        offlineSyncStatus: 'ONLINE',
        lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    } catch (e) {
      set({ offlineSyncStatus: 'OFFLINE' });
    }
  },

  addSensor: (newSensor: SensorNode) => {
    const current = get().sensors;
    const exists = current.some(s => s.id === newSensor.id);
    const updated = exists
      ? current.map(s => s.id === newSensor.id ? newSensor : s)
      : [...current, newSensor];
    set({ sensors: updated });
  },

  updateSensor: (id: string, updated: Partial<SensorNode>) => {
    const current = get().sensors;
    const modified = current.map(s => s.id === id ? { ...s, ...updated } : s);
    set({ sensors: modified, lastUpdateTimestamp: new Date() });
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

  updateSupervisor: (id: string, updatedFields: Partial<Supervisor>) => {
    const updated = get().supervisors.map(s => s.id === id ? { ...s, ...updatedFields } : s);
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

  updateBroadcastConfig: (config: Partial<BroadcastConfig>) => {
    const updated = { ...get().broadcastConfig, ...config };
    try {
      localStorage.setItem('mine_subsidence_broadcast_cfg', JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ broadcastConfig: updated });
  },

  recordBroadcastLog: (log: BroadcastLogItem) => {
    set({ broadcastLogs: [log, ...get().broadcastLogs].slice(0, 30) });
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
    // In LIVE HARDWARE mode, scenarios must NEVER overwrite real telemetry!
    if (get().dataSourceMode === 'HARDWARE') {
      console.warn("Demonstration scenarios are disabled while LIVE HARDWARE mode is active.");
      return;
    }

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

    const dataSourceMode = get().dataSourceMode;
    const activeScenario = get().activeScenario;

    const applyScenarioOverrides = (list: SensorNode[]): SensorNode[] => {
      // In LIVE HARDWARE mode, never apply simulation scenario overrides!
      if (dataSourceMode === 'HARDWARE') return list;
      if (!activeScenario || activeScenario === 'NORMAL') return list;

      return list.map(s => {
        if (activeScenario === 'SUBSIDENCE_CRITICAL' || activeScenario === 'CRITICAL_SUBSIDENCE') {
          if (['N14', 'N15'].includes(s.id)) {
            return {
              ...s,
              status: 'CRITICAL' as const,
              latest_reading: {
                ...(s.latest_reading || {
                  id: Math.random(),
                  node_id: s.id,
                  timestamp: new Date().toISOString(),
                  battery_level: 80,
                  signal_strength: -75,
                  is_outlier: true
                }),
                tilt_x: s.id === 'N14' ? 5.8 : 6.2,
                tilt_y: s.id === 'N14' ? 6.4 : 5.8,
                displacement: s.id === 'N14' ? 44.2 : 38.5,
                vibration: 1.85,
                crack_detected: true,
                anomaly_score: 92.0,
                timestamp: s.latest_reading?.timestamp || new Date().toISOString()
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
                  timestamp: new Date().toISOString(),
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
                timestamp: s.latest_reading?.timestamp || new Date().toISOString()
              }
            };
          }
        }
        if (activeScenario === 'EARLY_WARNING') {
          if (['N12', 'N13', 'N14', 'N15'].includes(s.id)) {
            return {
              ...s,
              status: 'WARNING' as const,
              latest_reading: {
                ...(s.latest_reading || {
                  id: Math.random(),
                  node_id: s.id,
                  timestamp: new Date().toISOString(),
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
                timestamp: s.latest_reading?.timestamp || new Date().toISOString()
              }
            };
          }
        }
        if (activeScenario === 'SENSOR_FAILURE' && s.id === 'N14') {
          return {
            ...s,
            status: 'OFFLINE' as const,
            signal_strength_rssi: -115,
            battery_level: 0
          };
        }
        if (activeScenario === 'NETWORK_FAILURE' && ['N12', 'N13'].includes(s.id)) {
          return {
            ...s,
            status: 'WARNING' as const,
            signal_strength_rssi: -98
          };
        }
        return s;
      });
    };

    // Direct sensors array update
    if (Array.isArray(payload)) {
      set({ sensors: applyScenarioOverrides(payload), lastUpdateTimestamp: new Date() });
      return;
    }

    if (payload.sensors && Array.isArray(payload.sensors)) {
      set({ sensors: applyScenarioOverrides(payload.sensors), lastUpdateTimestamp: new Date() });
      return;
    }

    const { reading, risk, alert } = payload;
    let currentSensors = [...get().sensors];

    if (reading) {
      // Handle data source provenance
      if (reading.source === 'HARDWARE') {
        const packetTime = reading.timestamp ? new Date(reading.timestamp).getTime() : Date.now();
        const isRecent = Math.abs(Date.now() - packetTime) < 15000;
        if (isRecent) {
          set({
            isHardwareConnected: true,
            lastHardwareTelemetryAt: reading.timestamp || new Date().toISOString()
          });
        }
      } else if (dataSourceMode === 'HARDWARE') {
        // Discard background simulated ticks when user has switched to LIVE HARDWARE
        return;
      }

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

    currentSensors = applyScenarioOverrides(currentSensors);

    set({
      sensors: currentSensors,
      lastUpdateTimestamp: new Date(),
      ...(risk ? {
        riskSummary: {
          current_risk_score: risk.risk_score ?? risk.current_risk_score ?? 14.5,
          geotechnical_score: risk.geotechnical_score,
          ml_severity_score: risk.ml_severity_score,
          risk_classification: risk.risk_classification ?? 'NORMAL',
          primary_panel: risk.panel_id ?? 'PANEL-B3',
          affected_cluster: risk.affected_cluster || 'Cluster N12-N16',
          factors: risk.factors || {},
          trend_direction: (risk.risk_score ?? 0) > 50 ? 'INCREASING' : 'STABLE',
          scientific_disclaimer: 'Prototype / Simulated Sensor Data. Decision support platform.',
          explanation: risk.explanation,
          fusion_weights: risk.fusion_weights,
          ml_prediction: risk.ml_prediction,
          fingerprint: risk.fingerprint,
          early_warning: risk.early_warning
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
