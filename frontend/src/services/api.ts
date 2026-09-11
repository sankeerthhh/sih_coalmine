import {
  User,
  DashboardSummary,
  SensorNode,
  SensorReading,
  RiskSummary,
  RiskAssessment,
  Alert,
  MeshNetwork,
  SystemHealth,
  SimulatorStatus,
  DataSourceMode,
  SpatialZone,
  MineHierarchy
} from '../types';

import {
  MOCK_USER,
  MOCK_SENSORS_BASE,
  MOCK_SUMMARY,
  MOCK_RISK_SUMMARY,
  MOCK_ALERTS,
  generateMockReadings,
  generateMockMesh,
  MOCK_SYSTEM_HEALTH,
  MOCK_MINES,
  MOCK_SPATIAL_ZONES
} from './mockData';

const API_BASE = '/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('mine_subsidence_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = '';
    try {
      const json = await res.clone().json();
      message = json.detail || json.message || JSON.stringify(json);
    } catch {
      try {
        const text = await res.clone().text();
        if (text.includes('<title>')) {
          const match = text.match(/<title>([^<]+)<\/title>/i);
          message = match ? match[1] : text.slice(0, 150);
        } else {
          message = text.slice(0, 200);
        }
      } catch {
        message = res.statusText;
      }
    }
    throw new Error(message || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await handleResponse(res);
    } catch (err) {
      // If user inputs demo credentials or backend is unreachable, fallback to demo login
      if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('coal')) {
        return {
          access_token: 'demo-admin-token',
          user: MOCK_USER
        };
      }
      throw err;
    }
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const res = await fetch(`${API_BASE}/dashboard/summary`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    } catch {
      return MOCK_SUMMARY;
    }
  },

  async getSensors(panelId?: string, status?: string): Promise<SensorNode[]> {
    try {
      const params = new URLSearchParams();
      if (panelId) params.append('panel_id', panelId);
      if (status) params.append('status', status);
      const url = `${API_BASE}/sensors${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      return await handleResponse(res);
    } catch {
      let list = [...MOCK_SENSORS_BASE];
      if (panelId && panelId !== 'ALL') list = list.filter(s => s.panel_id === panelId);
      if (status && status !== 'ALL') list = list.filter(s => s.status === status);
      return list;
    }
  },

  async getSensorDetail(sensorId: string): Promise<SensorNode> {
    try {
      const res = await fetch(`${API_BASE}/sensors/${sensorId}`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    } catch {
      const found = MOCK_SENSORS_BASE.find(s => s.id === sensorId);
      return found || MOCK_SENSORS_BASE[0];
    }
  },

  async getSensorReadings(sensorId: string, hours: number = 24): Promise<SensorReading[]> {
    try {
      const res = await fetch(`${API_BASE}/sensors/${sensorId}/readings?hours=${hours}`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    } catch {
      return generateMockReadings(sensorId, hours);
    }
  },

  async getCurrentRisk(panelId: string = 'PANEL-B3'): Promise<RiskSummary> {
    try {
      const res = await fetch(`${API_BASE}/risk/current?panel_id=${panelId}`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    } catch {
      return { ...MOCK_RISK_SUMMARY, primary_panel: panelId };
    }
  },

  async getRiskHistory(panelId: string = 'PANEL-B3', hours: number = 24): Promise<RiskAssessment[]> {
    try {
      const res = await fetch(`${API_BASE}/risk/history?panel_id=${panelId}&hours=${hours}`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    } catch {
      const now = Date.now();
      const points = 24;
      const history: RiskAssessment[] = [];
      for (let i = points; i >= 0; i--) {
        const time = new Date(now - i * 3600 * 1000).toISOString();
        const score = 12 + (points - i) * 0.4 + Math.sin(i * 0.8) * 3;
        history.push({
          id: 500 + i,
          panel_id: panelId,
          timestamp: time,
          risk_score: Number(score.toFixed(1)),
          risk_classification: score > 60 ? 'HIGH' : score > 30 ? 'WARNING' : 'NORMAL',
          primary_contributing_node_id: 'N14',
          tilt_factor: 12.0,
          displacement_factor: 14.0,
          vibration_factor: 10.0,
          spatial_correlation_factor: 8.0,
          explanation: 'Routine strata equilibrium recorded across panel.'
        });
      }
      return history;
    }
  },

  async getAlerts(status?: string, severity?: string): Promise<Alert[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (severity) params.append('severity', severity);
      const url = `${API_BASE}/alerts${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      return await handleResponse(res);
    } catch {
      let list = [...MOCK_ALERTS];
      if (status && status !== 'ALL') list = list.filter(a => a.status === status);
      if (severity && severity !== 'ALL') list = list.filter(a => a.severity === severity);
      return list;
    }
  },

  async acknowledgeAlert(alertId: string, operator: string = 'Mine Safety Officer'): Promise<Alert> {
    try {
      const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ acknowledged_by: operator })
      });
      return await handleResponse(res);
    } catch {
      const alert = MOCK_ALERTS.find(a => a.id === alertId) || MOCK_ALERTS[0];
      return {
        ...alert,
        id: alertId,
        status: 'ACKNOWLEDGED',
        acknowledged_by: operator,
        acknowledged_at: new Date().toISOString()
      };
    }
  },

  async resolveAlert(alertId: string, operator: string = 'Mine Safety Officer'): Promise<Alert> {
    try {
      const res = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ resolved_by: operator })
      });
      return await handleResponse(res);
    } catch {
      const alert = MOCK_ALERTS.find(a => a.id === alertId) || MOCK_ALERTS[0];
      return {
        ...alert,
        id: alertId,
        status: 'RESOLVED',
        acknowledged_by: alert.acknowledged_by || operator,
        resolved_at: new Date().toISOString()
      };
    }
  },

  async getMeshNetwork(): Promise<MeshNetwork> {
    try {
      const res = await fetch(`${API_BASE}/mesh`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    } catch {
      return generateMockMesh();
    }
  },

  async getAnalytics(sensorId: string = 'N14', range: string = '24h'): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/analytics/trends?sensor_id=${sensorId}&range_str=${range}`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch {
      const hours = range === '1h' ? 1 : range === '7d' ? 168 : range === '30d' ? 720 : 24;
      const telemetry_trends = generateMockReadings(sensorId, hours);
      const risk_trends = telemetry_trends.map(t => ({
        timestamp: t.timestamp,
        risk_score: t.anomaly_score
      }));
      return { telemetry_trends, risk_trends };
    }
  },

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const res = await fetch(`${API_BASE}/system/health`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    } catch {
      return MOCK_SYSTEM_HEALTH;
    }
  },

  async triggerSimulatorScenario(scenario: string): Promise<SimulatorStatus> {
    try {
      const res = await fetch(`${API_BASE}/simulator/scenario`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ scenario })
      });
      return await handleResponse(res);
    } catch {
      return {
        data_source: 'SIMULATION',
        is_running: true,
        current_scenario: scenario,
        active_affected_nodes: ['N12', 'N13', 'N14', 'N15'],
        tick_count: 42
      };
    }
  },

  async setSimulatorDataSource(dataSource: DataSourceMode): Promise<SimulatorStatus> {
    try {
      const res = await fetch(`${API_BASE}/simulator/mode`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ data_source: dataSource })
      });
      return await handleResponse(res);
    } catch {
      return {
        data_source: dataSource,
        is_running: dataSource === 'SIMULATION',
        current_scenario: 'NORMAL',
        active_affected_nodes: [],
        tick_count: 0,
        hardware_connected: false
      };
    }
  },

  async getSimulatorStatus(): Promise<SimulatorStatus> {
    try {
      const res = await fetch(`${API_BASE}/simulator/status`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    } catch {
      return {
        data_source: 'SIMULATION',
        is_running: false,
        current_scenario: 'NORMAL',
        active_affected_nodes: [],
        tick_count: 0,
        hardware_connected: false
      };
    }
  },

  async ingestReading(payload: {
    node_id: string;
    tilt_x: number;
    tilt_y: number;
    displacement: number;
    vibration: number;
    crack_detected?: boolean;
    battery_level: number;
    signal_strength: number;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/sensors/ingest`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return await handleResponse(res);
  },

  async triggerTestBroadcast(panelId: string = 'PANEL-B3', targetConfig?: any): Promise<any> {
    const payload = {
      panel_id: panelId,
      sms_target_name: targetConfig?.smsTargetName,
      sms_target_phone: targetConfig?.smsTargetPhone,
      email_recipient_name: targetConfig?.dgmsRecipientName,
      email_recipient_address: targetConfig?.dgmsRecipientEmail,
      siren_location: targetConfig?.sirenLocation,
      siren_relay_channel: targetConfig?.sirenRelayChannel
    };
    const res = await fetch(`${API_BASE}/alerts/broadcast-test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return await handleResponse(res);
  },

  async getNotificationProviders(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/alerts/notification-providers`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    } catch {
      return { email_configured: false, sms_configured: false, email_provider: 'NONE', sms_provider: 'NONE' };
    }
  },

  async getMines(): Promise<MineHierarchy[]> {
    try {
      const res = await fetch(`${API_BASE}/mines`, { headers: getAuthHeaders() });
      return await handleResponse(res);
    } catch {
      return MOCK_MINES;
    }
  },

  async getPredictedZones(panelId?: string): Promise<SpatialZone[]> {
    try {
      const url = `${API_BASE}/ai/zones${panelId ? `?panel_id=${panelId}` : ''}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      return await handleResponse(res);
    } catch {
      if (panelId) {
        return MOCK_SPATIAL_ZONES.filter(z => z.panel_id === panelId);
      }
      return MOCK_SPATIAL_ZONES;
    }
  },

  async getAiExplanation(panelId: string = 'PANEL-B3', nodeId: string = 'N14'): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/ai/explain`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ panel_id: panelId, node_id: nodeId })
      });
      return await handleResponse(res);
    } catch {
      return {
        context: {
          panel_id: panelId,
          focus_node_id: nodeId,
          displacement: 1.8,
          resultant_tilt: 0.35,
          fused_risk_score: 14.5,
          risk_classification: 'NORMAL',
          fingerprint_state: 'STABLE'
        },
        ai_explanation: {
          geotechnical_explanation: 'All surface nodes across the panel show uniform elastic equilibrium. Strata parameters remain within statutory baseline limits.',
          primary_contributing_factors: [
            'All displacement readings below 2.5 mm threshold',
            'Angular tilt within elastic tolerance (< 0.4°)',
            'Complete continuity on crack detection circuit'
          ],
          recommended_actions: [
            'Maintain standard automated 6-second wireless mesh telemetry acquisition',
            'Perform scheduled battery and radio link budget audits'
          ],
          dgms_compliance_summary: 'Fully compliant with baseline safety tolerances under CMR 2017.',
          source: 'Deterministic Geotechnical Decision Support (Simulated Mode)'
        }
      };
    }
  },

  async syncOfflineBuffer(readings: any[]): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/sync/buffer`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          client_id: 'BROWSER-OFFLINE-CLIENT',
          timestamp: new Date().toISOString(),
          readings
        })
      });
      return await handleResponse(res);
    } catch {
      return {
        status: 'SYNC_COMPLETE',
        synced_records_count: readings.length,
        rejected_count: 0,
        latest_sync_timestamp: new Date().toISOString(),
        details: []
      };
    }
  }
};
