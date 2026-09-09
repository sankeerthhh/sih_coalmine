import React, { useState } from 'react';
import { Network, Wifi, Radio, Server, ShieldCheck, AlertTriangle } from 'lucide-react';
import { MeshNetwork, MeshLink } from '../../types';

interface MeshVisualizerProps {
  meshData: MeshNetwork | null;
  onSelectNode?: (nodeId: string) => void;
}

export const MeshVisualizer: React.FC<MeshVisualizerProps> = ({ meshData, onSelectNode }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  if (!meshData || !meshData.nodes || meshData.nodes.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-center text-slate-400 border border-slate-200">
        Loading Wireless Surface Mesh Topology...
      </div>
    );
  }

  // Position nodes radially or hierarchically around Gateway (N01)
  // Let's create an intuitive layout for the SVG
  const width = 860;
  const height = 480;
  const cx = width / 2;
  const cy = height / 2;

  // Group nodes by hop level
  const gatewayNode = meshData.nodes.find(n => n.is_gateway) || meshData.nodes[0];
  const otherNodes = meshData.nodes.filter(n => n.id !== gatewayNode.id);

  // Compute layout coordinates
  const nodeCoords: Record<string, { x: number; y: number }> = {};
  nodeCoords[gatewayNode.id] = { x: cx, y: cy };

  // Arrange other nodes in two concentric rings
  otherNodes.forEach((node, idx) => {
    const isHop1 = node.parent_id === gatewayNode.id;
    const radius = isHop1 ? 140 : 210;
    const angle = (idx / otherNodes.length) * 2 * Math.PI - Math.PI / 2;
    nodeCoords[node.id] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  });

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Top Banner highlighting the unique SIH Innovation */}
      <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Core Technical Innovation
            </span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
            Wireless Surface Mesh Network (LoRa Multi-Hop DAG)
          </h2>
          <p className="text-xs text-slate-400">
            Resilient, self-healing telemetry backbone connecting 24 surface sensor nodes across 5 underground panels.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mesh Health</span>
            <span className={`font-bold ${
              meshData.network_health === 'HEALTHY' ? 'text-emerald-400' :
              meshData.network_health === 'DEGRADED' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {meshData.network_health}
            </span>
          </div>

          <div className="bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Nodes</span>
            <span className="font-bold text-slate-200">
              {meshData.online_nodes} / {meshData.total_nodes}
            </span>
          </div>

          <div className="bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Avg LoRa RSSI</span>
            <span className="font-bold text-slate-200">{meshData.average_rssi} dBm</span>
          </div>
        </div>
      </div>

      {/* SVG Topology Visualizer */}
      <div className="p-4 bg-slate-50 flex items-center justify-center overflow-x-auto relative">
        <svg width={width} height={height} className="select-none">
          <defs>
            {/* Arrowhead marker */}
            <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8" />
            </marker>
            <marker id="arrow-broken" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#DC2626" />
            </marker>
          </defs>

          {/* Links between nodes */}
          {meshData.links.map((link) => {
            const src = nodeCoords[link.source_node_id];
            const dst = nodeCoords[link.target_node_id];
            if (!src || !dst) return null;

            const isBroken = link.status === 'BROKEN';
            const isDegraded = link.status === 'DEGRADED';
            const strokeColor = isBroken ? '#DC2626' : (isDegraded ? '#F59E0B' : '#94A3B8');
            const strokeWidth = isBroken ? 2 : 1.5;

            return (
              <g key={link.id}>
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={dst.x}
                  y2={dst.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isBroken ? "5,5" : undefined}
                  markerEnd={isBroken ? "url(#arrow-broken)" : "url(#arrow)"}
                  opacity={0.8}
                />
              </g>
            );
          })}

          {/* Node Circles */}
          {meshData.nodes.map((node) => {
            const coord = nodeCoords[node.id];
            if (!coord) return null;

            const isGw = node.is_gateway;
            const isOffline = node.status === 'OFFLINE';
            const isCritical = node.status === 'CRITICAL';
            const isWarning = node.status === 'WARNING';

            let fillColor = '#16A34A'; // Normal Green
            if (isGw) fillColor = '#0F172A';
            else if (isOffline) fillColor = '#64748B';
            else if (isCritical) fillColor = '#DC2626';
            else if (isWarning) fillColor = '#F59E0B';

            const radius = isGw ? 24 : 15;

            return (
              <g
                key={node.id}
                transform={`translate(${coord.x}, ${coord.y})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onSelectNode && onSelectNode(node.id)}
              >
                {/* Ping animation for critical nodes or gateway */}
                {(isCritical || isGw) && (
                  <circle
                    r={radius + 8}
                    fill="none"
                    stroke={isCritical ? '#DC2626' : '#3B82F6'}
                    strokeWidth="2"
                    opacity="0.6"
                    className="animate-ping origin-center"
                  />
                )}

                <circle
                  r={radius}
                  fill={fillColor}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.2))"
                />

                <text
                  textAnchor="middle"
                  dy=".3em"
                  fill="#FFFFFF"
                  fontSize={isGw ? "11" : "9"}
                  fontWeight="bold"
                  fontFamily="Inter, sans-serif"
                >
                  {isGw ? 'GW' : node.id}
                </text>

                {/* Tooltip on hover */}
                {hoveredNode === node.id && (
                  <g transform="translate(0, -32)">
                    <rect
                      x="-65"
                      y="-25"
                      width="130"
                      height="30"
                      rx="4"
                      fill="#0F172A"
                      opacity="0.95"
                    />
                    <text
                      x="0"
                      y="-12"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {node.name}
                    </text>
                    <text
                      x="0"
                      y="-2"
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="9"
                    >
                      {node.panel_id} &bull; {node.battery_level}% Bat
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Info Legend */}
      <div className="p-3 bg-white border-t border-slate-200 text-xs flex flex-wrap items-center justify-between text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-900 border border-white inline-block" />
            <span className="font-semibold">Substation Gateway (N01)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] inline-block" />
            <span>Active Mesh Repeater/Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block" />
            <span>Warning Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] inline-block" />
            <span>Subsidence Active Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#64748B] inline-block" />
            <span>Offline Node</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Dynamic multi-hop rerouting enabled (Failover timeout: 4s)
        </span>
      </div>
    </div>
  );
};
