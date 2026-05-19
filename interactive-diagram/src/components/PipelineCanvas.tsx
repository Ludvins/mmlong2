import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow
} from "@xyflow/react";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import type { ExampleRun, PipelineEdge, PipelineNode } from "../pipeline";
import { toFlowEdges, toFlowNodes } from "./graphUtils";
import { RoutedEdge } from "./RoutedEdge";

const edgeTypes = {
  routed: RoutedEdge
};

type PipelineCanvasProps = {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  selectedId: string;
  selectedEdgeId?: string;
  exampleRun?: ExampleRun;
  fitSignal: number;
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
  onClearEdge: () => void;
};

function FitOnSignal({ fitSignal }: { fitSignal: number }) {
  const { fitView } = useReactFlow();
  const lastFitSignal = useRef(fitSignal);

  useEffect(() => {
    if (lastFitSignal.current === fitSignal) {
      return;
    }

    lastFitSignal.current = fitSignal;

    window.requestAnimationFrame(() => {
      fitView({ padding: 0.18, duration: 280 });
    });
  }, [fitSignal, fitView]);

  return null;
}

function FocusSelectedNode({ selectedId, nodeIds }: { selectedId: string; nodeIds: string }) {
  const { getNode, getViewport, setViewport } = useReactFlow();
  const lastFocusedSelection = useRef<string | undefined>(undefined);

  useLayoutEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const mobileFocusGroups = [
      ["filter_length", "domain_tiara", "domain_whokaryote", "filter_domain", "eukaryote_contigs"],
      ["filter_domain", "singleton_circular", "singleton_linear", "singletons"],
      [
        "binning_prep",
        "metabat2",
        "vamb",
        "vamb_clustering",
        "semibin2",
        "semibin2_clustering",
        "comebin",
        "comebin_clustering",
        "candidate_bins",
        "binette",
        "binmode_router"
      ],
      [
        "semibin2_clustering",
        "vamb_clustering",
        "comebin_clustering",
        "candidate_bins",
        "binette",
        "binmode_router",
        "binning_qc",
        "mag_aggregate",
        "checkm_qc2"
      ],
      ["singletons", "binning_prep", "mag_aggregate", "checkm_qc2"]
    ];

    const focus = () => {
      if (cancelled) {
        return;
      }

      const node = getNode(selectedId);
      if (!node) {
        attempts += 1;
        if (attempts < 12) {
          window.requestAnimationFrame(focus);
        }
        return;
      }

      const width = node.measured?.width ?? node.width ?? 230;
      const height = node.measured?.height ?? node.height ?? 110;
      const isMobile = window.innerWidth < 700;
      const pane = document.querySelector(".pipeline-flow")?.getBoundingClientRect();

      if (!pane) {
        return;
      }

      const shouldPreserveZoom =
        lastFocusedSelection.current !== undefined && lastFocusedSelection.current !== selectedId;

      const focusViewport = (centerX: number, centerY: number, zoom: number) => {
        setViewport(
          {
            x: pane.width / 2 - centerX * zoom,
            y: pane.height / 2 - centerY * zoom,
            zoom
          },
          { duration: 0 }
        );
        lastFocusedSelection.current = selectedId;
      };

      const focusGroupIds = mobileFocusGroups.find((group) => group.includes(selectedId));

      if (focusGroupIds) {
        const focusNodes = focusGroupIds.flatMap((id) => {
          const focusNode = getNode(id);
          return focusNode ? [focusNode] : [];
        });

        if (focusNodes.length > 0) {
          const bounds = focusNodes.reduce(
            (acc, current) => {
              const currentWidth = current.measured?.width ?? current.width ?? 230;
              const currentHeight = current.measured?.height ?? current.height ?? 110;

              return {
                minX: Math.min(acc.minX, current.position.x),
                minY: Math.min(acc.minY, current.position.y),
                maxX: Math.max(acc.maxX, current.position.x + currentWidth),
                maxY: Math.max(acc.maxY, current.position.y + currentHeight)
              };
            },
            {
              minX: Number.POSITIVE_INFINITY,
              minY: Number.POSITIVE_INFINITY,
              maxX: Number.NEGATIVE_INFINITY,
              maxY: Number.NEGATIVE_INFINITY
            }
          );
          const boundsWidth = bounds.maxX - bounds.minX;
          const boundsHeight = bounds.maxY - bounds.minY;
          const maxZoom = isMobile ? 0.42 : 0.62;
          const minZoom = isMobile ? 0.22 : 0.32;
          const horizontalPadding = isMobile ? 34 : 82;
          const verticalPadding = isMobile ? 26 : 110;
          const fittedZoom = Math.min(
            maxZoom,
            Math.max(
              minZoom,
              Math.min(
                (pane.width - horizontalPadding) / boundsWidth,
                (pane.height - verticalPadding) / boundsHeight
              )
            )
          );
          const zoom = shouldPreserveZoom ? getViewport().zoom : fittedZoom;

          focusViewport((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2, zoom);
          return;
        }
      }

      const zoom = shouldPreserveZoom ? getViewport().zoom : isMobile ? 0.42 : 0.74;

      focusViewport(node.position.x + width / 2, node.position.y + height / 2, zoom);
    };

    window.requestAnimationFrame(focus);

    return () => {
      cancelled = true;
    };
  }, [getNode, getViewport, nodeIds, selectedId, setViewport]);

  return null;
}

function PipelineCanvasInner({
  nodes,
  edges,
  selectedId,
  selectedEdgeId,
  exampleRun,
  fitSignal,
  onSelectNode,
  onSelectEdge,
  onClearEdge
}: PipelineCanvasProps) {
  const exampleNodeIds = useMemo(
    () => new Set(exampleRun?.activeNodeIds ?? []),
    [exampleRun]
  );
  const exampleSkippedNodeIds = useMemo(
    () => new Set(exampleRun?.skippedNodeIds ?? []),
    [exampleRun]
  );
  const exampleEdgeIds = useMemo(
    () => new Set(exampleRun?.activeEdgeIds ?? []),
    [exampleRun]
  );
  const flowNodes = useMemo(
    () =>
      toFlowNodes(
        nodes,
        selectedId,
        edges,
        selectedEdgeId,
        exampleNodeIds,
        exampleSkippedNodeIds,
        Boolean(exampleRun)
      ),
    [nodes, selectedId, edges, selectedEdgeId, exampleNodeIds, exampleSkippedNodeIds, exampleRun]
  );
  const flowEdges = useMemo(
    () => toFlowEdges(edges, selectedId, selectedEdgeId, exampleEdgeIds),
    [edges, selectedId, selectedEdgeId, exampleEdgeIds]
  );
  const nodeIds = useMemo(() => nodes.map((node) => node.id).join("|"), [nodes]);

  return (
    <ReactFlow
      key={nodeIds}
      className="pipeline-flow"
      nodes={flowNodes}
      edges={flowEdges}
      edgeTypes={edgeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      minZoom={0.18}
      maxZoom={1.8}
      onNodeClick={(_, node) => onSelectNode(node.id)}
      onEdgeClick={(event, edge) => {
        event.stopPropagation();
        onSelectEdge(edge.id);
      }}
      onPaneClick={onClearEdge}
    >
      <Background color="#c9d7de" gap={26} size={1.2} variant={BackgroundVariant.Dots} />
      <MiniMap
        pannable
        zoomable
        nodeColor={(node) => {
          if (node.className?.includes("algorithm")) return "#2f8b70";
          if (node.className?.includes("decision")) return "#6d5cae";
          if (node.className?.includes("aggregate")) return "#b9822c";
          if (node.className?.includes("output")) return "#b65a52";
          if (node.className?.includes("input")) return "#557c9e";
          return "#2374a6";
        }}
      />
      <Controls position="bottom-left" orientation="horizontal" showInteractive={false} />
      <FitOnSignal fitSignal={fitSignal} />
      <FocusSelectedNode selectedId={selectedId} nodeIds={nodeIds} />
    </ReactFlow>
  );
}

export function PipelineCanvas(props: PipelineCanvasProps) {
  return (
    <ReactFlowProvider>
      <PipelineCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
