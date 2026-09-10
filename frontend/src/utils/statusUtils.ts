import { SensorNode, SensorReading } from '../types';

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

export function getCalculatedNodeStatus(
  node: SensorNode,
  activeScenario?: string
): 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE' {
  // 1. Explicit offline state or dead battery
  if (activeScenario === 'SENSOR_FAILURE' && node.id === 'N14') return 'OFFLINE';
  if (node.status === 'OFFLINE' || node.battery_level <= 0) return 'OFFLINE';

  // 2. Demonstration scenarios active overrides
  if (isCriticalScenario(activeScenario)) {
    if (['N14', 'N15'].includes(node.id)) return 'CRITICAL';
    if (['N12', 'N13', 'N16'].includes(node.id)) return 'WARNING';
  }
  if (isWarningScenario(activeScenario)) {
    if (['N12', 'N13', 'N14', 'N15'].includes(node.id)) return 'WARNING';
  }

  // 3. Telemetry parameter threshold evaluation
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
