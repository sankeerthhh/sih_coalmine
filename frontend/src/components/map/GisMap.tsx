import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { SensorNode } from '../../types';

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const meshLinksLayerRef = useRef<L.LayerGroup | null>(null);
  const dangerCircleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered over Korba Coalfield
    const map = L.map(mapContainerRef.current, {
      center: [22.3615, 82.7535],
      zoom: 15,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    // Mine Outer Boundary (Dashed Blue-Grey)
    const mineBoundary = [
      [22.3520, 82.7420],
      [22.3520, 82.7600],
      [22.3680, 82.7620],
      [22.3680, 82.7400],
      [22.3520, 82.7420]
    ] as L.LatLngExpression[];

    L.polygon(mineBoundary, {
      color: '#2563EB',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#3B82F6',
      fillOpacity: 0.03
    }).addTo(map).bindTooltip("Korba Mine Boundary (Block-A)", { sticky: true });

    // 5 Underground Mining Panels
    if (showPanelOverlays) {
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
          color: "#0EA5E9"
        },
        {
          name: "Panel B2 (Development Gallery)",
          coords: [[22.3600, 82.7500], [22.3600, 82.7560], [22.3650, 82.7560], [22.3650, 82.7500]],
          color: "#0EA5E9"
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
          weight: 1.5,
          fillColor: p.color,
          fillOpacity: 0.12
        }).addTo(map).bindTooltip(`<b>${p.name}</b>`, { sticky: true });
      });

      // AI Predicted Subsidence Basin & Limit Line (Angle of Draw = 21°, Depth H = 185m)
      const subsidenceBasinCoords = [
        [22.3598, 82.7512],
        [22.3598, 82.7618],
        [22.3682, 82.7618],
        [22.3682, 82.7512],
        [22.3598, 82.7512]
      ] as L.LatLngExpression[];

      L.polygon(subsidenceBasinCoords, {
        color: '#DC2626',
        weight: 1.5,
        dashArray: '5, 8',
        fillColor: '#EF4444',
        fillOpacity: 0.06
      }).addTo(map).bindTooltip(
        "<b>AI PREDICTED SUBSIDENCE BASIN</b><br/>Angle of Draw: 21° | Influence Limit Line (CMPDI/DGMS)",
        { sticky: true }
      );
    }

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    const linksLayer = L.layerGroup().addTo(map);
    meshLinksLayerRef.current = linksLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [showPanelOverlays]);

  // Update sensor markers and inter-node mesh strain links
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();
    const linksLayer = meshLinksLayerRef.current;
    if (linksLayer) linksLayer.clearLayers();

    // Map for node lookup
    const nodeMap = new Map(sensors.map(s => [s.id, s]));

    // Draw Inter-Node Mesh Strain Links (Relative Distance Delta)
    if (linksLayer) {
      sensors.forEach(node => {
        if (!node.mesh_parent_id) return;
        const parent = nodeMap.get(node.mesh_parent_id);
        if (!parent) return;

        const nodeDisp = node.latest_reading?.displacement || 0;
        const parentDisp = parent.latest_reading?.displacement || 0;
        const relDistanceDelta = Math.abs(nodeDisp - parentDisp);

        let linkColor = '#3B82F6'; // Normal blue
        let dashPattern = undefined;
        let linkWeight = 1.5;

        if (relDistanceDelta > 12.0) {
          linkColor = '#DC2626'; // Red critical tensile strain
          linkWeight = 3;
          dashPattern = '4, 4';
        } else if (relDistanceDelta > 4.0) {
          linkColor = '#F59E0B'; // Amber moderate stretch
          linkWeight = 2;
          dashPattern = '6, 4';
        }

        const polyline = L.polyline(
          [[node.latitude, node.longitude], [parent.latitude, parent.longitude]],
          {
            color: linkColor,
            weight: linkWeight,
            opacity: 0.75,
            dashArray: dashPattern
          }
        );

        polyline.bindTooltip(
          `<b>Mesh Strain Link: ${node.id} ↔ ${parent.id}</b><br/>Relative Distance Delta: <b>${relDistanceDelta.toFixed(1)} mm</b>`,
          { sticky: true }
        );

        linksLayer.addLayer(polyline);
      });
    }

    let hasCritical = false;
    let hasWarning = false;

    sensors.forEach((node) => {
      let pinColor = '#16A34A'; // Normal Green
      let ringColor = 'rgba(22, 163, 74, 0.4)';

      if (node.status === 'CRITICAL') {
        pinColor = '#DC2626'; // Red
        ringColor = 'rgba(220, 38, 38, 0.6)';
        hasCritical = true;
      } else if (node.status === 'WARNING') {
        pinColor = '#F59E0B'; // Amber
        ringColor = 'rgba(245, 158, 11, 0.6)';
        hasWarning = true;
      } else if (node.status === 'OFFLINE') {
        pinColor = '#64748B'; // Grey
        ringColor = 'rgba(100, 116, 139, 0.4)';
      }

      const isSelected = selectedNodeId === node.id;
      const isGateway = node.is_gateway;

      // Custom SVG Marker Icon
      const iconHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="
            width: ${isGateway ? '32px' : '24px'};
            height: ${isGateway ? '32px' : '24px'};
            background-color: ${pinColor};
            border: 2px solid #FFFFFF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            ${isSelected ? 'transform: scale(1.3); outline: 3px solid #2563EB;' : ''}
          ">
            <span style="color: #FFFFFF; font-size: ${isGateway ? '10px' : '9px'}; font-weight: 700; font-family: sans-serif;">
              ${isGateway ? 'GW' : node.id.replace('N', '')}
            </span>
          </div>
          ${(node.status === 'CRITICAL' || isGateway) ? `
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background: ${ringColor};
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-sensor-marker',
        iconSize: [isGateway ? 32 : 24, isGateway ? 32 : 24],
        iconAnchor: [isGateway ? 16 : 12, isGateway ? 16 : 12]
      });

      const marker = L.marker([node.latitude, node.longitude], { icon: customIcon });

      marker.on('click', () => {
        onSelectNode(node);
      });

      const reading = node.latest_reading;
      const tooltipContent = `
        <div style="font-size: 11px; padding: 2px;">
          <b>${node.id}</b> — ${node.panel_id}<br/>
          Status: <b>${node.status}</b><br/>
          Tilt: <b>${reading ? Math.sqrt(reading.tilt_x**2 + reading.tilt_y**2).toFixed(1) : 0}°</b> | Disp: <b>${reading?.displacement?.toFixed(1) ?? 0}mm</b>
        </div>
      `;
      marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -12] });

      markersLayer.addLayer(marker);
    });

    // Subsidence Risk Zone Heat Circle over Panel B3 center
    if (dangerCircleRef.current) {
      dangerCircleRef.current.remove();
      dangerCircleRef.current = null;
    }

    if (hasCritical || hasWarning) {
      const circleColor = hasCritical ? '#DC2626' : '#F59E0B';
      const circle = L.circle([22.3645, 82.7570], {
        radius: hasCritical ? 240 : 160,
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: hasCritical ? 0.25 : 0.15,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(mapInstanceRef.current);

      circle.bindTooltip(
        hasCritical 
          ? "CRITICAL SUBSIDENCE ZONE (Panel B3 Depillaring Section)" 
          : "SUBSIDENCE RISK ADVISORY ZONE (Panel B3)",
        { sticky: true }
      );
      dangerCircleRef.current = circle;
    }
  }, [sensors, selectedNodeId, onSelectNode]);

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-slate-200 shadow-xs bg-slate-100" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend (Top Right) */}
      <div className="absolute top-3 right-3 z-[450] bg-white/95 backdrop-blur-xs p-3 rounded-md shadow-md border border-slate-200 text-xs space-y-1.5 select-none">
        <span className="font-bold text-slate-800 uppercase tracking-wider block text-[10px] border-b border-slate-200 pb-1">
          Sensor & Risk Legend
        </span>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] inline-block" />
          <span className="text-slate-700">Normal (&lt;30)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block" />
          <span className="text-slate-700">Warning (31–60)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] inline-block" />
          <span className="text-slate-700">Critical (81–100)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#64748B] inline-block" />
          <span className="text-slate-700">Offline / No Signal</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <span className="w-3 h-3 rounded-full bg-slate-900 border border-white text-white flex items-center justify-center text-[8px] font-bold">
            GW
          </span>
          <span className="text-slate-700 font-semibold">LoRa Gateway Hub</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-[11px]">
          <span className="w-4 h-0.5 bg-blue-500 inline-block" />
          <span className="text-slate-700">Inter-Node Mesh Link (ΔD)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-4 h-0.5 border-t border-dashed border-red-500 inline-block" />
          <span className="text-slate-700">AI Subsidence Basin (21°)</span>
        </div>
      </div>
    </div>
  );
};
