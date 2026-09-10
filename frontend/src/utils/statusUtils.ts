import { SensorNode, SensorReading, Alert } from '../types';

/**
 * Standardized status evaluation across all views (GIS Map, Sensor Network, Dashboard, Drawer, Reports).
 * Prevents conflicting colors (e.g. Red in one view and Green in another for identical data).
 */

export function isCriticalScenario(scenario?: string): boolean {
  if (!scenario) return false;
  const s = scenario.toUpperCase();
  return s === 'SUBSIDENCE_CRITICAL' || s === 'CRITICAL_SUBSIDENCE' || s === 'CRITICAL';
}

export function isWarningScenario(scenario?: string): boolean {
  if (!scenario) return false;
  const s = scenario.toUpperCase();
  return s === 'EARLY_WARNING' || s === 'WARNING';
}

export function calculateResultantTilt(reading?: SensorReading | null): number {
  if (!reading) return 0.0;
  if (reading.resultant_tilt !== undefined) return reading.resultant_tilt;
  const tx = reading.tilt_x || 0;
  const ty = reading.tilt_y || 0;
  return Number(Math.sqrt(tx * tx + ty * ty).toFixed(2));
}

export function isNodeAffectedByAlert(node: SensorNode, alert: Alert): boolean {
  if (!alert || alert.status !== 'ACTIVE') return false;

  const nid = node.id.toUpperCase();
  const nodeNum = parseInt(nid.replace(/\D/g, ''), 10);
  const cluster = (alert.node_cluster || '').toUpperCase();
  const title = (alert.title || '').toUpperCase();
  const desc = (alert.condition_detected || '').toUpperCase();

  // 1. Direct word-boundary match: e.g. "N14", "Cluster N14-N15", "Node N14"
  const idRegex = new RegExp(`\\b${nid}\\b`, 'i');
  if (idRegex.test(cluster) || idRegex.test(title) || idRegex.test(desc)) {
    return true;
  }

  // 2. Numeric range match: e.g. "N12-N15", "N14-N15", "N04-N05"
  const rangeRegex = /N?(\d{1,2})\s*[-–—]\s*N?(\d{1,2})/g;
  let match;
  while ((match = rangeRegex.exec(cluster)) !== null) {
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    if (!isNaN(start) && !isNaN(end) && !isNaN(nodeNum)) {
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      if (nodeNum >= min && nodeNum <= max) {
        return true;
      }
    }
  }

  // 3. Panel-level matching if no specific node identifiers are mentioned
  const clusterHasSpecificNode = /N\d{1,2}/.test(cluster) || /N\d{1,2}/.test(title);
  if (!clusterHasSpecificNode && alert.panel_id && node.panel_id) {
    const pAlert = alert.panel_id.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const pNode = node.panel_id.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (pAlert === pNode) {
      return true;
    }
  }

  return false;
}

export function getActiveAlertForNode(node: SensorNode, alerts?: Alert[]): Alert | null {
  if (!alerts || alerts.length === 0) return null;
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  // Highest priority to critical alerts
  const crit = activeAlerts.find(a => a.severity === 'CRITICAL' && isNodeAffectedByAlert(node, a));
  if (crit) return crit;
  const warn = activeAlerts.find(a => (a.severity === 'WARNING' || a.severity === 'HIGH') && isNodeAffectedByAlert(node, a));
  return warn || null;
}

export function getCalculatedNodeStatus(
  node: SensorNode,
  activeScenario?: string,
  alerts?: Alert[]
): 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE' {
  // 1. Explicit offline state or dead battery
  if (activeScenario === 'SENSOR_FAILURE' && node.id === 'N14') return 'OFFLINE';
  if (node.status === 'OFFLINE' || node.battery_level <= 0) return 'OFFLINE';

  // 2. Active alerts synchronization (Highest priority operational signal)
  if (alerts && alerts.length > 0) {
    const activeAlert = getActiveAlertForNode(node, alerts);
    if (activeAlert) {
      if (activeAlert.severity === 'CRITICAL') return 'CRITICAL';
      if (activeAlert.severity === 'WARNING' || activeAlert.severity === 'HIGH') return 'WARNING';
    }
  }

  // 3. Demonstration scenarios active overrides
  if (isCriticalScenario(activeScenario)) {
    if (['N14', 'N15'].includes(node.id)) return 'CRITICAL';
    if (['N12', 'N13', 'N16'].includes(node.id)) return 'WARNING';
  }
  if (isWarningScenario(activeScenario)) {
    if (['N12', 'N13', 'N14', 'N15'].includes(node.id)) return 'WARNING';
  }

  // 4. Telemetry parameter threshold evaluation
  const r = node.latest_reading;
  if (r) {
    const tilt = calculateResultantTilt(r);
    const disp = r.displacement || 0;

    // Critical: physical wire severed, displacement >= 25mm, tilt >= 3.0deg, or anomaly >= 80
    if (r.crack_detected || disp >= 25.0 || tilt >= 3.0 || r.anomaly_score >= 80) {
      return 'CRITICAL';
    }
    // Warning: displacement >= 8.0mm, tilt >= 1.5deg, or anomaly >= 35
    if (disp >= 8.0 || tilt >= 1.5 || r.anomaly_score >= 35) {
      return 'WARNING';
    }
  }

  if (node.status === 'CRITICAL') return 'CRITICAL';
  if (node.status === 'WARNING') return 'WARNING';

  return 'ONLINE';
}

export function getRiskLevelFromScore(score: number): 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL' {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'WARNING';
  return 'NORMAL';
}

export function getRiskColorTheme(level: string) {
  switch (level.toUpperCase()) {
    case 'CRITICAL':
    case 'DANGER':
    case 'SEVERED':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-300',
        badgeBg: 'bg-red-600 text-white',
        hex: '#DC2626'
      };
    case 'HIGH':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-300',
        badgeBg: 'bg-orange-500 text-white',
        hex: '#EA580C'
      };
    case 'WARNING':
    case 'DEGRADED':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-300',
        badgeBg: 'bg-amber-500 text-slate-950',
        hex: '#F59E0B'
      };
    case 'OFFLINE':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-300',
        badgeBg: 'bg-slate-500 text-white',
        hex: '#64748B'
      };
    case 'NORMAL':
    case 'ONLINE':
    case 'RESOLVED':
    case 'HEALTHY':
    case 'INTACT':
    default:
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-300',
        badgeBg: 'bg-emerald-600 text-white',
        hex: '#16A34A'
      };
  }
}
