import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  ChevronUp,
  ChevronDown,
  Globe,
  Moon,
  Mountain,
  Map as MapIcon,
  Locate,
  Maximize2,
  Minimize2,
  Crosshair
} from 'lucide-react';
import { SensorNode } from '../../types';
import { useSensorStore } from '../../store/sensorStore';
import { getCalculatedNodeStatus, isCriticalScenario, isWarningScenario } from '../../utils/statusUtils';

export type BaseMapType = 'satellite' | 'dark' | 'topo' | 'osm';

interface BaseMapConfig {
  id: BaseMapType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
}

const BASE_MAPS: Record<BaseMapType, BaseMapConfig> = {
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    icon: Globe,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19
  },
  dark: {
    id: 'dark',
    name: 'Tactical Dark',
    icon: Moon,
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c', 'd']
  },
  topo: {
    id: 'topo',
    name: 'Topographic',
    icon: Mountain,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, DeLorme, USGS',
    maxZoom: 18
  },
  osm: {
    id: 'osm',
    name: 'Street (OSM)',
    icon: MapIcon,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }
};

const KORBA_CENTER: [number, number] = [22.3615, 82.7535];
const MINE_BOUNDS: L.LatLngBoundsExpression = [
  [22.3500, 82.7380],
  [22.3700, 82.7640]
];

interface GisMapProps {
  sensors: SensorNode[];
  onSelectNode: (node: SensorNode) => void;
  selectedNodeId?: string | null;
  height?: string;
  showPanelOverlays?: boolean;
}

export const GisMap: React.FC<GisMapProps> = ({
  sensors,
  onSelectNode,
  selectedNodeId,
  height = '600px',
  showPanelOverlays = true
}) => {
  const { activeScenario, spatialZones, dataSourceMode } = useSensorStore();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const boundaryLayerRef = useRef<L.LayerGroup | null>(null);
  const panelsLayerRef = useRef<L.LayerGroup | null>(null);
  const basinLayerRef = useRef<L.LayerGroup | null>(null);
  const spatialZonesLayerRef = useRef<L.LayerGroup | null>(null);
  const meshLinksLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const dangerCircleRef = useRef<L.Circle | null>(null);

  // State: Base map choice with localStorage persistence (defaults to satellite for realism)
  const [baseMap, setBaseMap] = useState<BaseMapType>(() => {
    try {
      const saved = localStorage.getItem('mine_subsidence_gis_basemap') as BaseMapType;
      if (saved && BASE_MAPS[saved]) return saved;
    } catch {}
    return 'satellite';
  });

  // State: Layer visibility toggles
  const [showPanels, setShowPanels] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mine_subsidence_layer_panels');
      return saved !== null ? saved === 'true' : true;
    } catch {}
    return true;
  });

  const [showBasin, setShowBasin] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mine_subsidence_layer_basin');
      return saved !== null ? saved === 'true' : true;
    } catch {}
    return true;
  });

  const [showMeshLinks, setShowMeshLinks] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mine_subsidence_layer_mesh');
      return saved !== null ? saved === 'true' : true;
    } catch {}
    return true;
  });

  const [showMarkers, setShowMarkers] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mine_subsidence_layer_markers');
      return saved !== null ? saved === 'true' : true;
    } catch {}
    return true;
  });

  const [showZones, setShowZones] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mine_subsidence_layer_zones');
      return saved !== null ? saved === 'true' : true;
    } catch {}
    return true;
  });

  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: KORBA_CENTER,
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    // Custom bottom-right zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Attribution at bottom left
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

    // Instantiate Layer Groups
    const boundaryLayer = L.layerGroup().addTo(map);
    boundaryLayerRef.current = boundaryLayer;

    const panelsLayer = L.layerGroup().addTo(map);
    panelsLayerRef.current = panelsLayer;

    const basinLayer = L.layerGroup().addTo(map);
    basinLayerRef.current = basinLayer;

    const zonesLayer = L.layerGroup().addTo(map);
    spatialZonesLayerRef.current = zonesLayer;

    const meshLinksLayer = L.layerGroup().addTo(map);
    meshLinksLayerRef.current = meshLinksLayer;

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Draw Mine Outer Boundary (Dashed Blue-Cyan)
    const mineBoundary = [
      [22.3520, 82.7420],
      [22.3520, 82.7600],
      [22.3680, 82.7620],
      [22.3680, 82.7400],
      [22.3520, 82.7420]
    ] as L.LatLngExpression[];

    L.polygon(mineBoundary, {
      color: '#38BDF8',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#0284C7',
      fillOpacity: 0.04
    }).addTo(boundaryLayer).bindTooltip("<b>Korba Coalfield (Block-A Lease Boundary)</b>", { sticky: true });

    // Build Underground Panels Polygons
    const panels = [
      {
        name: "Panel A1 (Sealed Gaf)",
        coords: [[22.3540, 82.7430], [22.3540, 82.7490], [22.3590, 82.7490], [22.3590, 82.7430]],
        color: "#94A3B8"
      },
      {
        name: "Panel A2 (Post-Depillared)",
        coords: [[22.3540, 82.7500], [22.3540, 82.7560], [22.3590, 82.7560], [22.3590, 82.7500]],
        color: "#94A3B8"
      },
      {
        name: "Panel B1 (Continuous Miner)",
        coords: [[22.3600, 82.7430], [22.3600, 82.7490], [22.3650, 82.7490], [22.3650, 82.7430]],
        color: "#38BDF8"
      },
      {
        name: "Panel B2 (Development Gallery)",
        coords: [[22.3600, 82.7500], [22.3600, 82.7560], [22.3650, 82.7560], [22.3650, 82.7500]],
        color: "#38BDF8"
      },
      {
        name: "Panel B3 (Active Depillaring - Extraction)",
        coords: [[22.3610, 82.7530], [22.3610, 82.7600], [22.3670, 82.7600], [22.3670, 82.7530]],
        color: "#F59E0B"
      }
    ];

    panels.forEach(p => {
      L.polygon(p.coords as L.LatLngExpression[], {
        color: p.color,
        weight: 2,
        fillColor: p.color,
        fillOpacity: 0.16
      }).addTo(panelsLayer).bindTooltip(
        `<div style="font-size: 11px;"><b>${p.name}</b><br/><span style="color: #94A3B8;">Depth H: 185m | Seam: IV-Top</span></div>`,
        { sticky: true }
      );
    });

    // Build AI Predicted Subsidence Basin & Limit Line (Angle of Draw = 21°)
    const subsidenceBasinCoords = [
      [22.3598, 82.7512],
      [22.3598, 82.7618],
      [22.3682, 82.7618],
      [22.3682, 82.7512],
      [22.3598, 82.7512]
    ] as L.LatLngExpression[];

    L.polygon(subsidenceBasinCoords, {
      color: '#EF4444',
      weight: 2,
      dashArray: '5, 8',
      fillColor: '#EF4444',
      fillOpacity: 0.08
    }).addTo(basinLayer).bindTooltip(
      "<b>AI PREDICTED SUBSIDENCE BASIN</b><br/>Angle of Draw: 21° | Critical Strain Limit (CMPDI/DGMS)",
      { sticky: true }
    );

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const config = BASE_MAPS[baseMap];
    const newTileLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      attribution: config.attribution,
      subdomains: config.subdomains || 'abc'
    }).addTo(map);

    newTileLayer.bringToBack();
    currentTileLayerRef.current = newTileLayer;

    try {
      localStorage.setItem('mine_subsidence_gis_basemap', baseMap);
    } catch {}
  }, [baseMap]);

  // Handle Layer Visibility Toggles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Panels layer
    if (panelsLayerRef.current) {
      if (showPanels && showPanelOverlays) {
        if (!map.hasLayer(panelsLayerRef.current)) map.addLayer(panelsLayerRef.current);
      } else {
        if (map.hasLayer(panelsLayerRef.current)) map.removeLayer(panelsLayerRef.current);
      }
    }

    // Basin layer
    if (basinLayerRef.current) {
      if (showBasin && showPanelOverlays) {
        if (!map.hasLayer(basinLayerRef.current)) map.addLayer(basinLayerRef.current);
      } else {
        if (map.hasLayer(basinLayerRef.current)) map.removeLayer(basinLayerRef.current);
      }
    }

    // Mesh links layer
    if (meshLinksLayerRef.current) {
      if (showMeshLinks) {
        if (!map.hasLayer(meshLinksLayerRef.current)) map.addLayer(meshLinksLayerRef.current);
      } else {
        if (map.hasLayer(meshLinksLayerRef.current)) map.removeLayer(meshLinksLayerRef.current);
      }
    }

    // Sensor markers layer
    if (markersLayerRef.current) {
      if (showMarkers) {
        if (!map.hasLayer(markersLayerRef.current)) map.addLayer(markersLayerRef.current);
      } else {
        if (map.hasLayer(markersLayerRef.current)) map.removeLayer(markersLayerRef.current);
      }
    }

    // Spatial zones layer
    if (spatialZonesLayerRef.current) {
      if (showZones) {
        if (!map.hasLayer(spatialZonesLayerRef.current)) map.addLayer(spatialZonesLayerRef.current);
      } else {
        if (map.hasLayer(spatialZonesLayerRef.current)) map.removeLayer(spatialZonesLayerRef.current);
      }
    }
  }, [showPanels, showBasin, showMeshLinks, showMarkers, showZones, showPanelOverlays]);

  // Update AI spatial zones overlay
  useEffect(() => {
    if (!mapInstanceRef.current || !spatialZonesLayerRef.current) return;
    const layer = spatialZonesLayerRef.current;
    layer.clearLayers();

    spatialZones.forEach(zone => {
      const color =
        zone.risk_level === 'CRITICAL' ? '#DC2626' :
        zone.risk_level === 'HIGH' ? '#EA580C' :
        zone.risk_level === 'WARNING' ? '#D97706' : '#16A34A';

      const circle = L.circle([zone.centroid.latitude, zone.centroid.longitude], {
        radius: Math.min(zone.influence_radius_meters, 280),
        color: color,
        weight: 2,
        dashArray: zone.risk_level === 'CRITICAL' ? '4, 4' : undefined,
        fillColor: color,
        fillOpacity: zone.risk_level === 'CRITICAL' ? 0.24 : 0.10
      });

      circle.bindTooltip(`
        <div style="font-size: 11px; line-height: 1.4; padding: 2px;">
          <b style="color: ${color}; font-size: 12px;">${zone.zone_name}</b> (${zone.risk_level})<br/>
          <span>Avg Risk Score: <b>${zone.average_risk_score.toFixed(1)}/100</b></span><br/>
          <span>Affected Nodes: <b>${zone.affected_nodes_count}</b> (${zone.affected_node_ids.join(', ')})</span><br/>
          <span>ML Confidence: <b>${(zone.ml_probability * 100).toFixed(0)}%</b></span><br/>
          <span>Fingerprint: <b>${zone.fingerprint_state}</b></span><br/>
          <span>Action: ${zone.recommended_action}</span>
        </div>
      `, { sticky: true });

      layer.addLayer(circle);
    });
  }, [spatialZones]);

  // Update sensor markers and inter-node mesh strain links
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();
    const linksLayer = meshLinksLayerRef.current;
    if (linksLayer) linksLayer.clearLayers();

    const nodeMap = new Map(sensors.map(s => [s.id, s]));

    // Draw Inter-Node Mesh Strain Links (Relative Distance Delta ΔD)
    if (linksLayer) {
      sensors.forEach(node => {
        if (!node.mesh_parent_id) return;
        const parent = nodeMap.get(node.mesh_parent_id);
        if (!parent) return;

        const nodeDisp = node.latest_reading?.displacement || 0;
        const parentDisp = parent.latest_reading?.displacement || 0;
        const relDistanceDelta = Math.abs(nodeDisp - parentDisp);

        let linkColor = '#38BDF8'; // Bright Cyan-Blue for high visibility on satellite & dark
        let dashPattern = undefined;
        let linkWeight = 2;

        if (relDistanceDelta > 12.0) {
          linkColor = '#EF4444'; // Red critical tensile strain
          linkWeight = 3.5;
          dashPattern = '4, 4';
        } else if (relDistanceDelta > 4.0) {
          linkColor = '#F59E0B'; // Amber moderate stretch
          linkWeight = 2.5;
          dashPattern = '6, 4';
        }

        const polyline = L.polyline(
          [[node.latitude, node.longitude], [parent.latitude, parent.longitude]],
          {
            color: linkColor,
            weight: linkWeight,
            opacity: 0.85,
            dashArray: dashPattern
          }
        );

        polyline.bindTooltip(
          `<b>Mesh Strain Link: ${node.id} ↔ ${parent.id}</b><br/>Relative Distance Delta (ΔD): <b>${relDistanceDelta.toFixed(1)} mm</b>`,
          { sticky: true }
        );

        linksLayer.addLayer(polyline);
      });
    }

    let hasCritical = dataSourceMode === 'SIMULATION' ? isCriticalScenario(activeScenario) : false;
    let hasWarning = dataSourceMode === 'SIMULATION' ? isWarningScenario(activeScenario) : false;

    // Draw Sensor Markers
    sensors.forEach((node) => {
      const calculatedStatus = getCalculatedNodeStatus(node, activeScenario, dataSourceMode);
      let pinColor = '#22C55E'; // Normal Bright Green
      let ringColor = 'rgba(34, 197, 94, 0.5)';

      if (calculatedStatus === 'CRITICAL') {
        pinColor = '#EF4444'; // Vivid Red
        ringColor = 'rgba(239, 68, 68, 0.7)';
        hasCritical = true;
      } else if (calculatedStatus === 'WARNING') {
        pinColor = '#F59E0B'; // Amber
        ringColor = 'rgba(245, 158, 11, 0.6)';
        hasWarning = true;
      } else if (calculatedStatus === 'OFFLINE') {
        pinColor = '#64748B'; // Slate Grey
        ringColor = 'rgba(100, 116, 139, 0.4)';
      }

      const isSelected = selectedNodeId === node.id;
      const isGateway = node.is_gateway;

      // High-visibility Custom Marker Icon with White Halo
      const iconHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="
            width: ${isGateway ? '34px' : '26px'};
            height: ${isGateway ? '34px' : '26px'};
            background-color: ${pinColor};
            border: 2px solid #FFFFFF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 0 1.5px rgba(0,0,0,0.6), 0 3px 8px rgba(0,0,0,0.5);
            transition: transform 0.15s ease;
            ${isSelected ? 'transform: scale(1.35); outline: 3px solid #38BDF8; box-shadow: 0 0 12px #38BDF8;' : ''}
          ">
            <span style="color: #FFFFFF; font-size: ${isGateway ? '10px' : '9px'}; font-weight: 800; font-family: ui-sans-serif, system-ui, sans-serif; text-shadow: 0 1px 2px rgba(0,0,0,0.6);">
              ${isGateway ? 'GW' : node.id.replace('N', '')}
            </span>
          </div>
          ${(calculatedStatus === 'CRITICAL' || isGateway) ? `
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background: ${ringColor};
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              pointer-events: none;
            "></div>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-sensor-marker',
        iconSize: [isGateway ? 34 : 26, isGateway ? 34 : 26],
        iconAnchor: [isGateway ? 17 : 13, isGateway ? 17 : 13]
      });

      const marker = L.marker([node.latitude, node.longitude], { icon: customIcon });

      marker.on('click', () => {
        onSelectNode(node);
      });

      const reading = node.latest_reading;
      const resultantTilt = reading ? Math.sqrt(reading.tilt_x**2 + reading.tilt_y**2).toFixed(1) : '0.0';
      const tooltipContent = `
        <div style="font-size: 11px; padding: 3px; font-family: ui-sans-serif, system-ui, sans-serif; min-width: 130px;">
          <div style="font-weight: 800; font-size: 12px; margin-bottom: 2px;">${node.id} &bull; ${node.panel_id}</div>
          <div>Status: <b style="color: ${pinColor}">${calculatedStatus}</b></div>
          <div>Tilt: <b>${resultantTilt}&deg;</b> | Disp: <b>${reading?.displacement?.toFixed(1) ?? '0.0'} mm</b></div>
          <div>Battery: <b>${node.battery_level}%</b> | RSSI: <b>${node.signal_strength_rssi} dBm</b></div>
        </div>
      `;
      marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -14] });

      markersLayer.addLayer(marker);
    });

    // Subsidence Risk Zone Heat Circle over Panel B3 center
    if (dangerCircleRef.current) {
      dangerCircleRef.current.remove();
      dangerCircleRef.current = null;
    }

    if (hasCritical || hasWarning) {
      const circleColor = hasCritical ? '#EF4444' : '#F59E0B';
      const circle = L.circle([22.3645, 82.7570], {
        radius: hasCritical ? 240 : 160,
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: hasCritical ? 0.28 : 0.16,
        weight: 2,
        dashArray: '4, 4'
      }).addTo(mapInstanceRef.current);

      circle.bindTooltip(
        hasCritical
          ? "<b>CRITICAL SUBSIDENCE ZONE</b><br/>Panel B3 Active Extraction Section"
          : "<b>SUBSIDENCE ADVISORY ZONE</b><br/>Panel B3 Monitoring Cluster",
        { sticky: true }
      );
      dangerCircleRef.current = circle;
    }
  }, [sensors, selectedNodeId, onSelectNode, activeScenario, dataSourceMode]);

  // Recenter Map on Panel B3 Epicenter
  const handleRecenter = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(KORBA_CENTER, 15, { duration: 0.8 });
  }, []);

  // Fit Entire Mine Lease Boundary
  const handleFitBounds = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.fitBounds(MINE_BOUNDS, { padding: [30, 30] });
  }, []);

  // Toggle Fullscreen
  const handleToggleFullscreen = useCallback(() => {
    if (!mapWrapperRef.current) return;
    if (!document.fullscreenElement) {
      mapWrapperRef.current.requestFullscreen?.().then(() => {
        setIsFullscreen(true);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
      }).catch(console.error);
    } else {
      document.exitFullscreen?.().then(() => {
        setIsFullscreen(false);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
      }).catch(console.error);
    }
  }, []);

  // Sync fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const activeLayersCount = [showPanels, showBasin, showMeshLinks, showMarkers, showZones].filter(Boolean).length;

  return (
    <div
      ref={mapWrapperRef}
      className={`relative w-full rounded-lg overflow-hidden border border-slate-700/60 shadow-md bg-slate-950 isolate z-0 select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen border-none' : ''
      }`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* TOP-LEFT: High-Contrast Base Map Switcher */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700/80 shadow-xl">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 hidden sm:inline">
          Base:
        </span>
        {(Object.keys(BASE_MAPS) as BaseMapType[]).map((key) => {
          const cfg = BASE_MAPS[key];
          const Icon = cfg.icon;
          const isActive = baseMap === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setBaseMap(key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title={`Switch Base Map to ${cfg.name}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{cfg.name}</span>
            </button>
          );
        })}
      </div>

      {/* TOP-RIGHT: Layer Controls & Map Tools HUD */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {/* Layer Visibility Menu Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md border transition cursor-pointer shadow-lg ${
              isLayerMenuOpen
                ? 'bg-blue-600 text-white border-blue-400'
                : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800'
            }`}
            title="Toggle GIS Overlays & Visibility"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Layers</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-500/30 text-[10px] font-mono font-bold">
              {activeLayersCount}/5
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isLayerMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Layer Visibility Dropdown Modal */}
          {isLayerMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-slate-700 p-3 space-y-2 text-xs text-slate-200 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1 font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                <span>GIS Overlay Layers</span>
                <button
                  type="button"
                  onClick={() => {
                    const allOn = activeLayersCount < 5;
                    setShowPanels(allOn);
                    setShowBasin(allOn);
                    setShowMeshLinks(allOn);
                    setShowMarkers(allOn);
                    setShowZones(allOn);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  {activeLayersCount < 5 ? 'Enable All' : 'Disable All'}
                </button>
              </div>

              {/* Panel Toggle */}
              <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/60 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500/80 border border-amber-400" />
                  <span>Underground Panels (A1–B3)</span>
                </div>
                <input
                  type="checkbox"
                  checked={showPanels}
                  onChange={(e) => {
                    setShowPanels(e.target.checked);
                    localStorage.setItem('mine_subsidence_layer_panels', String(e.target.checked));
                  }}
                  className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </label>

              {/* Basin Toggle */}
              <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/60 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-0.5 border-t border-dashed border-red-500" />
                  <span>AI Subsidence Basin (21°)</span>
                </div>
                <input
                  type="checkbox"
                  checked={showBasin}
                  onChange={(e) => {
                    setShowBasin(e.target.checked);
                    localStorage.setItem('mine_subsidence_layer_basin', String(e.target.checked));
                  }}
                  className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </label>

              {/* Mesh Links Toggle */}
              <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/60 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-0.5 bg-sky-400" />
                  <span>Mesh Strain Links (ΔD)</span>
                </div>
                <input
                  type="checkbox"
                  checked={showMeshLinks}
                  onChange={(e) => {
                    setShowMeshLinks(e.target.checked);
                    localStorage.setItem('mine_subsidence_layer_mesh', String(e.target.checked));
                  }}
                  className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </label>

              {/* Spatial Zones Toggle */}
              <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/60 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full border border-amber-500 bg-amber-500/30" />
                  <span>AI Spatial Risk Zones</span>
                </div>
                <input
                  type="checkbox"
                  checked={showZones}
                  onChange={(e) => {
                    setShowZones(e.target.checked);
                    localStorage.setItem('mine_subsidence_layer_zones', String(e.target.checked));
                  }}
                  className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </label>

              {/* Markers Toggle */}
              <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/60 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                  <span>Sensor Nodes (24 LoRa)</span>
                </div>
                <input
                  type="checkbox"
                  checked={showMarkers}
                  onChange={(e) => {
                    setShowMarkers(e.target.checked);
                    localStorage.setItem('mine_subsidence_layer_markers', String(e.target.checked));
                  }}
                  className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>

        {/* Quick Tools HUD: Recenter & Fit & Fullscreen */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700/80 shadow-xl">
          <button
            type="button"
            onClick={handleRecenter}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition cursor-pointer"
            title="Recenter on Panel B3 Active Depillaring Epicenter"
          >
            <Locate className="w-4 h-4 text-amber-400" />
          </button>

          <button
            type="button"
            onClick={handleFitBounds}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition cursor-pointer"
            title="Fit Entire Korba Block-A Mining Boundary"
          >
            <Crosshair className="w-4 h-4 text-sky-400" />
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen GIS Map"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-slate-200" /> : <Maximize2 className="w-4 h-4 text-slate-200" />}
          </button>
        </div>
      </div>

      {/* BOTTOM-RIGHT: Collapsible GIS Legend */}
      <div className="absolute bottom-6 right-3 z-10 select-none">
        {isLegendExpanded ? (
          <div className="bg-slate-900/90 backdrop-blur-md p-3 rounded-lg shadow-2xl border border-slate-700/80 text-xs space-y-1.5 min-w-[210px] text-slate-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                GIS Strata Legend
              </span>
              <button
                type="button"
                onClick={() => setIsLegendExpanded(false)}
                title="Collapse Legend"
                className="text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer hover:bg-slate-800"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] border border-white inline-block" />
              <span>Normal Sensor (&lt;30)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] border border-white inline-block" />
              <span>Warning Sensor (31–60)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] border border-white inline-block" />
              <span>Critical Sensor (81–100)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#64748B] border border-white inline-block" />
              <span>Offline Node</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-white text-white flex items-center justify-center text-[8px] font-bold">
                GW
              </span>
              <span className="font-semibold text-sky-400">LoRa Gateway Hub</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-[11px]">
              <span className="w-4 h-0.5 bg-sky-400 inline-block" />
              <span>Mesh Strain Link (ΔD)</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-4 h-0.5 border-t border-dashed border-red-500 inline-block" />
              <span>AI Subsidence Basin (21°)</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full border border-amber-500 bg-amber-500/30 inline-block" />
              <span>Spatial Risk Clusters</span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsLegendExpanded(true)}
            className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-md shadow-xl border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer hover:bg-slate-800"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Legend</span>
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
};
