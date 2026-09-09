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
  SimulatorStatus
} from '../types';

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
    const errData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/dashboard/summary`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getSensors(panelId?: string, status?: string): Promise<SensorNode[]> {
    const params = new URLSearchParams();
    if (panelId) params.append('panel_id', panelId);
    if (status) params.append('status', status);
    const url = `${API_BASE}/sensors${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getSensorDetail(sensorId: string): Promise<SensorNode> {
    const res = await fetch(`${API_BASE}/sensors/${sensorId}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getSensorReadings(sensorId: string, hours: number = 24): Promise<SensorReading[]> {
    const res = await fetch(`${API_BASE}/sensors/${sensorId}/readings?hours=${hours}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getCurrentRisk(panelId: string = 'PANEL-B3'): Promise<RiskSummary> {
    const res = await fetch(`${API_BASE}/risk/current?panel_id=${panelId}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getRiskHistory(panelId: string = 'PANEL-B3', hours: number = 24): Promise<RiskAssessment[]> {
    const res = await fetch(`${API_BASE}/risk/history?panel_id=${panelId}&hours=${hours}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getAlerts(status?: string, severity?: string): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    const url = `${API_BASE}/alerts${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async acknowledgeAlert(alertId: string, operator: string = 'Mine Safety Officer'): Promise<Alert> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ acknowledged_by: operator })
    });
    return handleResponse(res);
  },

  async resolveAlert(alertId: string, operator: string = 'Mine Safety Officer'): Promise<Alert> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ resolved_by: operator })
    });
    return handleResponse(res);
  },

  async getMeshNetwork(): Promise<MeshNetwork> {
    const res = await fetch(`${API_BASE}/mesh`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getAnalytics(sensorId: string = 'N14', range: string = '24h'): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/trends?sensor_id=${sensorId}&range_str=${range}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getSystemHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/system/health`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async triggerSimulatorScenario(scenario: string): Promise<SimulatorStatus> {
    const res = await fetch(`${API_BASE}/simulator/scenario`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ scenario })
    });
    return handleResponse(res);
  },

  async getSimulatorStatus(): Promise<SimulatorStatus> {
    const res = await fetch(`${API_BASE}/simulator/status`, { headers: getAuthHeaders() });
    return handleResponse(res);
  }
};
