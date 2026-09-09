export type PageType = 
  | 'dashboard' 
  | 'gis-map' 
  | 'sensors' 
  | 'ai-risk' 
  | 'alerts' 
  | 'analytics' 
  | 'system-health' 
  | 'settings';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export interface SensorReading {
  id: number;
  node_id: string;
  timestamp: string;
  tilt_x: number;
  tilt_y: number;
  displacement: number;
  vibration: number;
  crack_detected: boolean;
  battery_level: number;
  signal_strength: number;
  anomaly_score: number;
  is_outlier: boolean;
  resultant_tilt?: number;
}

export interface SensorNode {
  id: string;
  panel_id: string;
  name: string;
  latitude: number;
  longitude: number;
  hardware_model: string;
  mesh_parent_id: string | null;
  is_gateway: boolean;
  status: 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'ERROR';
  battery_level: number;
  signal_strength_rssi: number;
  last_seen_at: string;
  latest_reading?: SensorReading | null;
}

export interface RiskFactors {
  [key: string]: number;
}

export interface RiskAssessment {
  id: number;
  panel_id: string;
  timestamp: string;
  risk_score: number;
  risk_classification: 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL';
  primary_contributing_node_id?: string;
  tilt_factor: number;
  displacement_factor: number;
  vibration_factor: number;
  spatial_correlation_factor: number;
  explanation: string;
}

export interface RiskSummary {
  current_risk_score: number;
  risk_classification: 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL';
  primary_panel: string;
  affected_cluster: string;
  factors: Record<string, number>;
  trend_direction: 'STABLE' | 'INCREASING' | 'DECREASING';
  scientific_disclaimer: string;
  explanation?: string;
  latest_assessment?: RiskAssessment | null;
}

export interface Alert {
  id: string;
  panel_id: string;
  node_cluster: string;
  title: string;
  condition_detected: string;
  severity: 'WARNING' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  ai_risk_score: number;
  measured_tilt: number;
  measured_displacement: number;
  crack_detected: boolean;
  recommended_action: string;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface MeshLink {
  id: number;
  source_node_id: string;
  target_node_id: string;
  link_quality_lqi: number;
  rssi: number;
  hop_count: number;
  status: 'ACTIVE' | 'DEGRADED' | 'BROKEN';
  updated_at: string;
}

export interface MeshNetwork {
  gateway_id: string;
  total_nodes: number;
  online_nodes: number;
  average_rssi: number;
  max_hops: number;
  network_health: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  nodes: any[];
  links: MeshLink[];
}

export interface DashboardSummary {
  mine_name: string;
  active_panel: string;
  system_status: string;
  active_sensor_nodes: number;
  offline_sensor_nodes: number;
  current_risk_level: 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL';
  current_risk_score: number;
  active_alerts_count: number;
  area_under_monitoring_sq_km: number;
  last_data_update: string;
  disclaimer: string;
}

export interface SystemHealth {
  gateway_status: string;
  database_status: string;
  ai_engine_status: string;
  mesh_network_status: string;
  mqtt_status: string;
  total_nodes: number;
  nodes_online: number;
  nodes_offline: number;
  nodes_low_battery: number;
  nodes_weak_signal: number;
  last_synchronization: string;
  uptime_seconds: number;
  cpu_usage_pct: number;
  memory_usage_mb: number;
}

export interface SimulatorStatus {
  is_running: boolean;
  current_scenario: string;
  active_affected_nodes: string[];
  tick_count: number;
}
