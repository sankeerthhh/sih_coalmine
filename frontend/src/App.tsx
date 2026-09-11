import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from './store/authStore';
import { useSensorStore } from './store/sensorStore';
import { useWebSocket, WebSocketEvent } from './hooks/useWebSocket';
import { api } from './services/api';
import { PageType } from './types';

// Components
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DemoSimulatorBar } from './components/common/DemoSimulatorBar';
import { EmergencyAlertBanner } from './components/common/EmergencyAlertBanner';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { GisMapPage } from './pages/GisMapPage';
import { SensorNetworkPage } from './pages/SensorNetworkPage';
import { AiRiskPage } from './pages/AiRiskPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const {
    setSensors,
    setAlerts,
    setRiskSummary,
    updateFromWebSocket,
    setActiveScenario,
    setMines,
    setSpatialZones,
    setDataSourceMode,
    setHardwareStatus
  } = useSensorStore();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  // Load baseline data on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    api.getSensors().then(setSensors).catch(console.error);
    api.getAlerts().then(setAlerts).catch(console.error);
    api.getCurrentRisk('PANEL-B3').then(setRiskSummary).catch(console.error);
    api.getMines().then(setMines).catch(console.error);
    api.getPredictedZones().then(setSpatialZones).catch(console.error);
    api.getSimulatorStatus().then((status) => {
      setActiveScenario(status.current_scenario);
      if (status.data_source) {
        setDataSourceMode(status.data_source, false);
      }
      if (status.hardware_connected !== undefined) {
        setHardwareStatus(status.hardware_connected, status.last_hardware_telemetry_at);
      }
    }).catch(console.error);
  }, [isAuthenticated]);

  // Periodic liveness check: marks hardware disconnected if no packet received within 15s
  useEffect(() => {
    const timer = setInterval(() => {
      useSensorStore.getState().checkHardwareLiveness();
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Real-time WebSocket event handler
  const handleWebSocketEvent = useCallback((event: WebSocketEvent) => {
    if (event.type === 'SENSOR_TELEMETRY_UPDATE' && event.data) {
      updateFromWebSocket(event.data);
    } else if (event.type === 'SIMULATOR_SCENARIO_CHANGED' && event.data) {
      setActiveScenario(event.data.current_scenario);
    } else if (event.type === 'DATA_SOURCE_MODE_CHANGED' && event.data) {
      if (event.data.data_source) {
        setDataSourceMode(event.data.data_source, false);
      }
      if (event.data.hardware_connected !== undefined) {
        setHardwareStatus(event.data.hardware_connected, event.data.last_hardware_telemetry_at);
      }
    }
  }, [updateFromWebSocket, setActiveScenario, setDataSourceMode, setHardwareStatus]);

  const { isOffline, lastUpdate } = useWebSocket(handleWebSocketEvent);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar Navigation */}
      <Sidebar currentPage={currentPage} onSelectPage={setCurrentPage} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top SIH Demonstration Scenario Bar */}
        <DemoSimulatorBar />

        {/* Header with Mine Selector, Status, & Sync Counter */}
        <Header isOffline={isOffline} lastUpdate={lastUpdate} />

        {/* Global Real-Time Emergency Alert Notification Banner */}
        <EmergencyAlertBanner onNavigatePage={setCurrentPage} />

        {/* Dynamic Page Content View */}
        <main className="flex-1 p-6 overflow-y-auto">
          <ErrorBoundary fallbackTitle="Page View Error">
            {currentPage === 'dashboard' && <DashboardPage onNavigatePage={setCurrentPage} />}
            {currentPage === 'gis-map' && <GisMapPage onNavigatePage={setCurrentPage} />}
            {currentPage === 'sensors' && <SensorNetworkPage onNavigatePage={setCurrentPage} />}
            {currentPage === 'ai-risk' && <AiRiskPage onNavigatePage={setCurrentPage} />}
            {currentPage === 'alerts' && <AlertsPage onNavigatePage={setCurrentPage} />}
            {currentPage === 'analytics' && <AnalyticsPage onNavigatePage={setCurrentPage} />}
            {currentPage === 'system-health' && <SystemHealthPage onNavigatePage={setCurrentPage} />}
            {currentPage === 'settings' && <SettingsPage onNavigatePage={setCurrentPage} />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default App;
