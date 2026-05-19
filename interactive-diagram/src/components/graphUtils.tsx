import type { Edge, Node } from "@xyflow/react";
import { MarkerType, Position } from "@xyflow/react";
import type { ReactNode } from "react";

import { pipelineEdges, pipelineNodes, stageOrder } from "../pipeline";
import type { EdgeRelation, PipelineEdge, PipelineNode } from "../pipeline";

const NODE_WIDTH = 230;
const COLUMN_GAP = 500;
const ROW_GAP = 210;

const fixedNodeLayout: Record<string, { column: number; row: number }> = {
  nanopore_reads: { column: 0, row: 0 },
  pacbio_reads: { column: 0, row: 1 },
  reads: { column: 1, row: 0.5 },
  diffcov: { column: 0, row: 2 },
  database_inputs: { column: 0, row: 3 },
  wrapper: { column: 1, row: 2 },
  assembly_metaflye: { column: 2, row: 0 },
  assembly_metamdbg: { column: 2, row: 1 },
  assembly_myloasm: { column: 2, row: 2 },
  assembly_custom: { column: 2, row: 3 },
  assembly_selected: { column: 3, row: 2 },
  polishing: { column: 4, row: 1 },
  curation: { column: 5, row: 1 },
  filter_length: { column: 6, row: 2 },
  domain_tiara: { column: 7, row: 1 },
  domain_whokaryote: { column: 7, row: 3 },
  filter_domain: { column: 8, row: 2 },
  eukaryote_contigs: { column: 9, row: 0 },
  singleton_circular: { column: 9, row: 1 },
  singleton_linear: { column: 9, row: 2 },
  singletons: { column: 10, row: 1 },
  coverage_prep: { column: 11, row: 3 },
  coverage_map: { column: 12, row: 3 },
  coverage_aggregate: { column: 13, row: 3 },
  binning_prep: { column: 14, row: 2 },
  metabat2: { column: 15, row: 0 },
  vamb: { column: 15, row: 1 },
  semibin2: { column: 15, row: 2 },
  comebin: { column: 15, row: 3 },
  vamb_clustering: { column: 16, row: 1 },
  comebin_clustering: { column: 16, row: 3 },
  semibin2_clustering: { column: 16, row: 2 },
  candidate_bins: { column: 17, row: 2 },
  binette: { column: 18, row: 1 },
  binmode_router: { column: 19, row: 2 },
  binning_qc: { column: 20, row: 2 },
  mag_aggregate: { column: 21, row: 1 },
  checkm_qc2: { column: 22, row: 1 },
  summary_lite: { column: 23, row: 2 },
  taxonomy: { column: 24, row: 0 },
  annotation: { column: 24, row: 1 },
  extraqc: { column: 24, row: 2 },
  stats: { column: 24, row: 3 },
  finalise_proc: { column: 25, row: 2 }
};

const relationStyles: Record<
  EdgeRelation,
  { active: string; muted: string; dash?: string; label: string }
> = {
  required: { active: "#006d77", muted: "#9fb0b8", label: "Required data" },
  optional: { active: "#6b7280", muted: "#b8c1c7", dash: "6 6", label: "Optional input" },
  switch: { active: "#b9822c", muted: "#cdb486", label: "Config switch" },
  conditional: { active: "#6658a7", muted: "#b6afd6", dash: "8 5", label: "If/else gate" },
  fanout: { active: "#2f8b70", muted: "#9bbfb3", label: "Automatic fan-out" },
  merge: { active: "#2374a6", muted: "#a1bdcf", label: "Merge/aggregation" }
};

const targetAnchoredRelations = new Set<EdgeRelation>([
  "required",
  "optional",
  "switch",
  "conditional",
  "fanout"
]);

export function nodeMatches(node: PipelineNode, query: string, stage: string) {
  const normalized = query.trim().toLowerCase();
  const stageMatches = stage === "All" || node.stage === stage;

  if (!stageMatches) {
    return false;
  }

  if (!normalized) {
    return true;
  }

  const haystack = [
    node.label,
    node.stage,
    node.workflow,
    node.kind,
    node.command ?? "",
    ...node.rules,
    ...node.inputs,
    ...node.outputs,
    ...node.configKeys,
    ...node.parameters.map((parameter) => `${parameter.name} ${parameter.value}`)
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

export function filterPipeline(query: string, stage: string) {
  const nodes = pipelineNodes.filter((node) => nodeMatches(node, query, stage));
  const visibleIds = new Set(nodes.map((node) => node.id));
  const edges = pipelineEdges.filter(
    (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)
  );

  return { nodes, edges };
}

function positionNodes(nodes: PipelineNode[]) {
  const counts = new Map<string, number>();

  const positions = nodes.map((node) => {
    const fixed = fixedNodeLayout[node.id];
    if (fixed) {
      return {
        x: fixed.column * COLUMN_GAP,
        y: fixed.row * ROW_GAP
      };
    }

    const stageIndex = stageOrder.get(node.stage) ?? 0;
    const row = counts.get(node.stage) ?? 0;
    counts.set(node.stage, row + 1);

    return {
      x: stageIndex * COLUMN_GAP,
      y: row * ROW_GAP
    };
  });

  if (nodes.length === pipelineNodes.length || positions.length === 0) {
    return positions;
  }

  const minX = Math.min(...positions.map((position) => position.x));
  const minY = Math.min(...positions.map((position) => position.y));

  return positions.map((position) => ({
    x: position.x - minX,
    y: position.y - minY
  }));
}

function getFocusedNodeIds(edges: PipelineEdge[], selectedId: string, selectedEdgeId?: string) {
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);

  if (selectedEdge) {
    const focused = new Set<string>();
    focused.add(selectedEdge.source);
    focused.add(selectedEdge.target);
    return focused;
  }

  const focused = new Set([selectedId]);

  edges.forEach((edge) => {
    if (edge.source === selectedId) {
      focused.add(edge.target);
    }

    if (edge.target === selectedId) {
      focused.add(edge.source);
    }
  });

  return focused;
}

function summarizeRules(node: PipelineNode) {
  if (node.rules.length === 0) {
    return node.kind === "input" ? "input contract" : node.workflow;
  }

  if (node.rules.length === 1) {
    return node.rules[0];
  }

  return `${node.rules.length} rules`;
}

export type FlowNodeData = {
  label: ReactNode;
};

export function toFlowNodes(
  nodes: PipelineNode[],
  selectedId: string,
  edges: PipelineEdge[],
  selectedEdgeId?: string,
  exampleNodeIds: Set<string> = new Set(),
  exampleSkippedNodeIds: Set<string> = new Set(),
  hasExampleRun = false
): Node<FlowNodeData>[] {
  const positions = positionNodes(nodes);
  const focusedNodeIds = getFocusedNodeIds(edges, selectedId, selectedEdgeId);
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);
  const selectedEdgeNodeIds = selectedEdge
    ? new Set([selectedEdge.source, selectedEdge.target])
    : new Set<string>();

  return nodes.map((node, index) => {
    const isSelectedNode = node.id === selectedId && !selectedEdge;
    const isExampleActive = exampleNodeIds.has(node.id);
    const isExampleSkipped = exampleSkippedNodeIds.has(node.id);
    const isExampleMuted = hasExampleRun && !isExampleActive;

    return {
      id: node.id,
      type: "default",
      position: positions[index],
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      width: NODE_WIDTH,
      className: `pipeline-rf-node ${node.kind} ${isSelectedNode ? "selected-rf-node" : ""}`,
      data: {
        label: (
          <div
            className={`node-card ${node.kind} ${isSelectedNode ? "selected" : ""} ${
              focusedNodeIds.has(node.id) ? "focused" : "dimmed"
            } ${selectedEdgeNodeIds.has(node.id) ? "edge-endpoint" : ""} ${
              isExampleActive ? "example-active" : ""
            } ${isExampleSkipped ? "example-skipped" : ""} ${
              isExampleMuted ? "example-muted" : ""
            }`}
          >
            <div className="node-topline">
              <span className="node-stage">{node.stage}</span>
              <span className="node-kind-pill">{node.kind}</span>
            </div>
            <div className="node-title">{node.label}</div>
            <div className="node-rule">{summarizeRules(node)}</div>
            <div className="node-meta">
              <span>{node.workflow}</span>
              <span>{node.configKeys.length} keys</span>
            </div>
          </div>
        )
      }
    };
  });
}

export function toFlowEdges(
  edges: PipelineEdge[],
  selectedId: string,
  selectedEdgeId?: string,
  exampleEdgeIds: Set<string> = new Set()
): Edge[] {
  const nodesById = new Map(pipelineNodes.map((node) => [node.id, node]));
  const edgeViews = edges.map((edge) => {
    const relation = edge.relation ?? "required";
    const relationStyle = relationStyles[relation];
    const isSelected = edge.id === selectedEdgeId;
    const isFocusActive =
      !selectedEdgeId && (edge.source === selectedId || edge.target === selectedId);
    const isExampleActive = exampleEdgeIds.has(edge.id);
    const isActive = isSelected || isFocusActive || isExampleActive;
    const showSemanticLabel =
      relation === "switch" || relation === "optional" || relation === "conditional";
    const labelVisible = Boolean(edge.label && (isSelected || isFocusActive || showSemanticLabel));
    const edgeColor = isSelected
      ? "#c8553d"
      : isFocusActive
        ? relationStyle.active
        : isExampleActive
          ? "#0f766e"
          : relationStyle.muted;

    return {
      edge,
      edgeColor,
      isActive,
      isExampleActive,
      isFocusActive,
      isSelected,
      labelVisible,
      relation,
      relationStyle,
      showSemanticLabel
    };
  });
  const targetLabelCounters = new Map<string, { above: number; below: number }>();
  const labelSlots = new Map<string, number>();

  edgeViews.forEach(({ edge, labelVisible, relation }) => {
    if (!labelVisible || !targetAnchoredRelations.has(relation)) {
      return;
    }

    const sourceRow = fixedNodeLayout[edge.source]?.row ?? 0;
    const targetRow = fixedNodeLayout[edge.target]?.row ?? 0;
    const naturalSide = sourceRow <= targetRow ? "above" : "below";
    const counters = targetLabelCounters.get(edge.target) ?? { above: 0, below: 0 };
    counters[naturalSide] += 1;
    targetLabelCounters.set(edge.target, counters);
    labelSlots.set(edge.id, naturalSide === "above" ? -counters.above : counters.below);
  });

  return edgeViews.map(({ edge, edgeColor, isActive, isExampleActive, isFocusActive, isSelected, labelVisible, relation, relationStyle, showSemanticLabel }) => {
    const sourceNode = nodesById.get(edge.source);
    const targetNode = nodesById.get(edge.target);

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: labelVisible ? edge.label : undefined,
      type: "routed",
      selectable: true,
      interactionWidth: 24,
      data: {
        lane: edge.lane,
        labelSlot: labelSlots.get(edge.id),
        relation,
        route: edge.route,
        sourceLabel: sourceNode?.label,
        sourceStage: sourceNode?.stage,
        targetLabel: targetNode?.label,
        targetStage: targetNode?.stage
      },
      className: isSelected
        ? `flow-edge selected-edge ${isExampleActive ? "example-edge" : ""} relation-${relation}`
        : isFocusActive
          ? `flow-edge active-edge ${isExampleActive ? "example-edge" : ""} relation-${relation}`
          : isExampleActive
            ? `flow-edge example-edge relation-${relation}`
            : `flow-edge muted-edge relation-${relation}`,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: isSelected ? 22 : isActive ? 18 : 14,
        height: isSelected ? 22 : isActive ? 18 : 14,
        color: edgeColor
      },
      style: {
        stroke: edgeColor,
        strokeWidth: isSelected ? 4 : isFocusActive ? 3 : isExampleActive ? 2.4 : 1,
        opacity: isActive || showSemanticLabel ? 1 : 0.2,
        strokeDasharray: relationStyle.dash
      },
      labelStyle: {
        fill: isActive || showSemanticLabel ? relationStyle.active : "#123743",
        fontSize: 12,
        fontWeight: 800,
        paintOrder: "stroke",
        stroke: "#f8fbfc",
        strokeWidth: 3
      },
      labelBgPadding: [7, 5],
      labelBgBorderRadius: 6,
      labelBgStyle: {
        fill: "#f8fbfc",
        fillOpacity: 1,
        stroke: "rgba(84, 103, 114, 0.22)",
        strokeWidth: 1
      }
    };
  });
}
