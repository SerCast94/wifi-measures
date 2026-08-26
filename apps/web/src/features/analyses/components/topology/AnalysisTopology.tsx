import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import {
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  Radio,
  Smartphone,
  Wifi,
} from "lucide-react";

import { Badge } from "@/core/atomic-components/badge";
import { Button } from "@/core/atomic-components/button";
import { Card, CardContent } from "@/core/atomic-components/card";
import type { AnalysisHost } from "../../types/analysis.types";

import "@xyflow/react/dist/style.css";

const MAX_CLIENTS_PER_SSID = 20;

const signalHex = (signal: number | null): string => {
  if (signal == null) return "#9ca3af";
  if (signal >= -60) return "#22c55e";
  if (signal >= -70) return "#eab308";
  return "#ef4444";
};

type SsidNodeType = Node<
  {
    label: string;
    security?: string | null;
    clientCount: number;
    expanded: boolean;
    onToggle: () => void;
  },
  "ssid"
>;
type ClientNodeType = Node<
  { label: string; protocol?: string | null; signal: number | null },
  "client"
>;
type ApNodeType = Node<
  {
    label: string;
    channel?: string | null;
    band?: string | null;
    signal: number | null;
    snr: number | null;
    ssidCount?: number;
    bssidCount?: number;
    clientCount?: number;
  },
  "ap"
>;

type FlowNode = SsidNodeType | ClientNodeType | ApNodeType;

const SsidNodeView = ({ data }: NodeProps<SsidNodeType>) => (
  <div className="px-3 py-2 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 min-w-[180px]">
    <Handle type="source" position={Position.Right} />
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        className="nodrag nopan flex h-4 w-4 shrink-0 items-center justify-center rounded border bg-white dark:bg-gray-800 hover:bg-accent cursor-pointer"
        onClick={data.onToggle}
        aria-label={data.expanded ? "Ocultar clientes" : "Ver clientes"}
      >
        {data.expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>
      <Wifi className="h-4 w-4 text-blue-500 shrink-0" />
      <span className="text-sm font-semibold truncate max-w-[130px]" title={data.label}>
        {data.label}
      </span>
    </div>
    <div className="flex items-center gap-1.5 mt-1">
      <Badge variant="secondary" className="text-[10px]">
        {data.clientCount} clientes
      </Badge>
      {data.security && (
        <Badge variant="outline" className="text-[10px]">
          {data.security}
        </Badge>
      )}
    </div>
  </div>
);

const ClientNodeView = ({ data }: NodeProps<ClientNodeType>) => (
  <div
    className="flex flex-col items-center gap-0.5 px-1 py-0.5 rounded-md border bg-card min-w-[86px]"
    style={{ borderColor: signalHex(data.signal) }}
    title={`${data.label}${data.protocol ? ` · ${data.protocol}` : ""}${
      data.signal != null ? ` · ${data.signal} dBm` : ""
    }`}
  >
    <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    <div className="flex items-center gap-1">
      <span
        className="inline-block h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: signalHex(data.signal) }}
      />
      <Smartphone className="h-3 w-3 text-gray-500 shrink-0" />
      <span className="text-[10px] font-medium truncate max-w-[58px] leading-tight">
        {data.label}
      </span>
    </div>
    {data.signal != null && (
      <span
        className="text-[9px] font-semibold leading-none"
        style={{ color: signalHex(data.signal) }}
      >
        {data.signal} dBm
      </span>
    )}
  </div>
);

const ApNodeView = ({ data }: NodeProps<ApNodeType>) => (
  <div className="px-3 py-2 rounded-lg border border-purple-300 bg-purple-50 dark:bg-purple-950 dark:border-purple-800 min-w-[190px]">
    <div className="flex items-center gap-2">
      <Radio className="h-4 w-4 text-purple-500 shrink-0" />
      <span className="text-sm font-semibold truncate max-w-[130px]" title={data.label}>
        {data.label}
      </span>
      <span
        className="ml-auto text-[10px] font-semibold shrink-0"
        style={{ color: signalHex(data.signal) }}
      >
        {data.signal != null ? `${data.signal} dBm` : "—"}
      </span>
    </div>
    <div className="flex flex-wrap items-center gap-1 mt-1.5">
      <Badge variant="outline" className="text-[10px]">
        Ch {data.channel ?? "—"} · {data.band ?? "—"}
      </Badge>
      <Badge variant="secondary" className="text-[10px]">
        {data.ssidCount ?? 0} SSID · {data.bssidCount ?? 0} BSSID ·{" "}
        {data.clientCount ?? 0} cli
      </Badge>
    </div>
  </div>
);

const nodeTypes = {
  ssid: SsidNodeView,
  client: ClientNodeView,
  ap: ApNodeView,
};

interface SimNode extends SimulationNodeDatum {
  id: string;
  kind: "ssid" | "client" | "ap";
  radius: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  distance: number;
}

interface TopologyGraphProps {
  analysisName: string;
  hosts: AnalysisHost[];
}

const TopologyGraph = ({ analysisName, hosts }: TopologyGraphProps) => {
  const [layoutSeed, setLayoutSeed] = useState(0);
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const dragStartRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const ssidEntries = useMemo(
    () =>
      hosts
        .filter((host) => host.hostType === "ssid")
        .map((ssidHost) => ({
          ssid: ssidHost,
          clients: hosts
            .filter(
              (host) =>
                host.hostType === "client" && host.ssid === ssidHost.name
            )
            .sort((a, b) => (b.signal ?? -999) - (a.signal ?? -999)),
        }))
        .sort((a, b) => b.clients.length - a.clients.length)
        .slice(0, 15),
    [hosts]
  );

  // Todo expandido por defecto
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(ssidEntries.map((entry) => `ssid-${entry.ssid.id}`))
  );

  const aps = useMemo(
    () =>
      hosts
        .filter((host) => host.hostType === "ap")
        .sort((a, b) => (b.signal ?? -999) - (a.signal ?? -999))
        .slice(0, 12),
    [hosts]
  );

  const toggleSsid = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(
    () =>
      setExpandedIds(new Set(ssidEntries.map((e) => `ssid-${e.ssid.id}`))),
    [ssidEntries]
  );
  const collapseAll = useCallback(() => setExpandedIds(new Set()), []);

  const { computedNodes, computedEdges } = useMemo(() => {
    const flowNodes: FlowNode[] = [];
    const flowEdges: Edge[] = [];
    const simNodes: SimNode[] = [];
    const simLinks: SimLink[] = [];

    for (const entry of ssidEntries) {
      const ssidNodeId = `ssid-${entry.ssid.id}`;
      simNodes.push({ id: ssidNodeId, kind: "ssid", radius: 58 });

      if (!expandedIds.has(ssidNodeId)) continue;

      const shown = Math.min(entry.clients.length, MAX_CLIENTS_PER_SSID);
      for (let i = 0; i < shown; i += 1) {
        const clientId = `client-${entry.clients[i].id}`;
        simNodes.push({ id: clientId, kind: "client", radius: 32 });
        simLinks.push({
          source: ssidNodeId,
          target: clientId,
          distance: 90,
        });
      }
    }

    for (const ap of aps) {
      simNodes.push({ id: `ap-${ap.id}`, kind: "ap", radius: 62 });
    }

    // Simulación force-directed: SSIDs a la derecha, APs a la izquierda
    const simulation = forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((node) => node.id)
          .distance((link) => link.distance)
          .strength(0.6)
      )
      .force(
        "charge",
        forceManyBody<SimNode>().strength((node) => {
          switch (node.kind) {
            case "ssid":
              return -700;
            case "ap":
              return -600;
            default:
              return -170;
          }
        })
      )
      .force(
        "collide",
        forceCollide<SimNode>().radius((node) => node.radius).iterations(3)
      )
      .force(
        "x",
        forceX<SimNode>((node) => {
          switch (node.kind) {
            case "ssid":
              return 340;
            case "ap":
              return -450;
            default:
              return 420;
          }
        }).strength(0.08)
      )
      .force("y", forceY<SimNode>(0).strength(0.05))
      .stop();

    for (let i = 0; i < 420; i += 1) {
      simulation.tick();
    }

    const positionById = new Map<string, { x: number; y: number }>();
    for (const simNode of simNodes) {
      positionById.set(simNode.id, { x: simNode.x ?? 0, y: simNode.y ?? 0 });
    }

    for (const entry of ssidEntries) {
      const ssidNodeId = `ssid-${entry.ssid.id}`;
      flowNodes.push({
        id: ssidNodeId,
        type: "ssid",
        position: positionById.get(ssidNodeId)!,
        data: {
          label: entry.ssid.name ?? "—",
          security: entry.ssid.securityType,
          clientCount: entry.clients.length,
          expanded: expandedIds.has(ssidNodeId),
          onToggle: () => toggleSsid(ssidNodeId),
        },
      });

      if (!expandedIds.has(ssidNodeId)) continue;

      const shown = Math.min(entry.clients.length, MAX_CLIENTS_PER_SSID);
      for (let i = 0; i < shown; i += 1) {
        const client = entry.clients[i];
        const clientId = `client-${client.id}`;
        flowNodes.push({
          id: clientId,
          type: "client",
          position: positionById.get(clientId)!,
          data: {
            label: client.name ?? client.mac ?? "Cliente",
            protocol: client.protocol,
            signal: client.signal,
          },
        });
        flowEdges.push({
          id: `e-${ssidNodeId}-${clientId}`,
          source: ssidNodeId,
          target: clientId,
          style: { stroke: signalHex(client.signal), strokeWidth: 1.5 },
        });
      }
    }

    for (const ap of aps) {
      const apId = `ap-${ap.id}`;
      flowNodes.push({
        id: apId,
        type: "ap",
        position: positionById.get(apId)!,
        data: {
          label: ap.name ?? ap.mac ?? "AP",
          channel: ap.channel,
          band: ap.band,
          signal: ap.signal,
          snr: ap.snr,
          ssidCount: ap.counts?.ssidCount,
          bssidCount: ap.counts?.bssidCount,
          clientCount: ap.counts?.clientCount,
        },
      });
    }

    return { computedNodes: flowNodes, computedEdges: flowEdges };
  }, [ssidEntries, aps, expandedIds, layoutSeed, toggleSsid]);

  // Aplicar el layout calculado y reencuadrar (sin perder arrastres entre renders)
  useEffect(() => {
    setNodes(computedNodes);
    const timer = setTimeout(() => {
      fitView({ padding: 0.1, duration: 400 });
    }, 60);
    return () => clearTimeout(timer);
  }, [computedNodes, setNodes, fitView]);

  // Al arrastrar un SSID, sus clientes se mueven con él
  const onNodeDragStart = useCallback(
    (_event: unknown, node: FlowNode) => {
      const positions = new Map<string, { x: number; y: number }>();
      positions.set(node.id, node.position);
      for (const edge of computedEdges) {
        if (edge.source !== node.id) continue;
        const child = nodes.find((n) => n.id === edge.target);
        if (child) positions.set(child.id, child.position);
      }
      dragStartRef.current = positions;
    },
    [computedEdges, nodes]
  );

  const onNodeDrag = useCallback(
    (_event: unknown, node: FlowNode) => {
      const start = dragStartRef.current.get(node.id);
      if (!start) return;
      const dx = node.position.x - start.x;
      const dy = node.position.y - start.y;
      if (dx === 0 && dy === 0) return;
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id === node.id) return n;
          const childStart = dragStartRef.current.get(n.id);
          if (!childStart) return n;
          return {
            ...n,
            position: { x: childStart.x + dx, y: childStart.y + dy },
          };
        })
      );
    },
    [setNodes]
  );

  if (hosts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sin dispositivos para construir la topología.
      </p>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="h-[640px] rounded-lg border overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={computedEdges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            minZoom={0.05}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Wifi className="h-3 w-3 text-blue-500" /> Redes SSID
            </span>
            <span className="flex items-center gap-1.5">
              <Radio className="h-3 w-3 text-purple-500" /> Puntos de acceso
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" /> ≥ -60 dBm
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" /> -60…-70 dBm
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> &lt; -70 dBm
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              <Maximize2 className="w-4 h-4 mr-1.5" />
              Expandir todo
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              <Minimize2 className="w-4 h-4 mr-1.5" />
              Contraer todo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLayoutSeed((seed) => seed + 1)}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Reorganizar
            </Button>
          </div>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {analysisName} · Arrastra cualquier nodo para reorganizarlo, usa la
          rueda para zoom y la flecha de cada red para ver u ocultar sus
          clientes.
        </p>
      </CardContent>
    </Card>
  );
};

interface AnalysisTopologyProps {
  analysisName: string;
  hosts: AnalysisHost[];
}

export const AnalysisTopology = (props: AnalysisTopologyProps) => (
  <ReactFlowProvider>
    <TopologyGraph {...props} />
  </ReactFlowProvider>
);
