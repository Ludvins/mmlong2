import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  getSmoothStepPath,
  type EdgeProps
} from "@xyflow/react";

import type { EdgeRelation, EdgeRoute } from "../pipeline";

type RoutedEdgeData = {
  lane?: number;
  labelSlot?: number;
  relation?: EdgeRelation;
  route?: EdgeRoute;
  sourceLabel?: string;
  sourceStage?: string;
  targetLabel?: string;
  targetStage?: string;
};

const DEFAULT_TOP_LANE = -210;
const DEFAULT_BOTTOM_LANE = 860;
const ELBOW_OFFSET = 52;
const NODE_HANDLE_GAP = 32;
const BRANCH_LABEL_OFFSET = 38;

type LabelAnchor = "center" | "start" | "end";

function isTargetAnchoredRelation(relation?: EdgeRelation) {
  return (
    relation === "required" ||
    relation === "optional" ||
    relation === "fanout" ||
    relation === "switch" ||
    relation === "conditional"
  );
}

function isSourceAnchoredRelation(relation?: EdgeRelation) {
  return relation === "merge";
}

function labelYOffset(sourceY: number, targetY: number) {
  return sourceY <= targetY ? -BRANCH_LABEL_OFFSET : BRANCH_LABEL_OFFSET;
}

function compactEndpoint(label?: string, stage?: string) {
  const endpoint = label || stage;

  if (!endpoint) {
    return undefined;
  }

  if (endpoint.length <= 26) {
    return endpoint;
  }

  return `${endpoint.slice(0, 23)}...`;
}

function labelContext(edgeData: RoutedEdgeData, label?: string) {
  if (!label || label.includes("->")) {
    return undefined;
  }

  if (isTargetAnchoredRelation(edgeData.relation)) {
    const target = compactEndpoint(edgeData.targetLabel, edgeData.targetStage);
    return target ? `to ${target}` : undefined;
  }

  if (isSourceAnchoredRelation(edgeData.relation)) {
    const source = compactEndpoint(edgeData.sourceLabel, edgeData.sourceStage);
    return source ? `from ${source}` : undefined;
  }

  return undefined;
}

export function RoutedEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  interactionWidth,
  style,
  label,
  data
}: EdgeProps) {
  const edgeData = (data ?? {}) as RoutedEdgeData;
  const route = edgeData.route;
  const labelText = typeof label === "string" ? label : undefined;
  const context = labelContext(edgeData, labelText);
  let path: string;
  let labelX: number;
  let labelY: number;
  let labelAnchor: LabelAnchor = "center";

  if (route) {
    const laneY = edgeData.lane ?? (route === "top" ? DEFAULT_TOP_LANE : DEFAULT_BOTTOM_LANE);
    const sourceElbowX = sourceX + ELBOW_OFFSET;
    const targetElbowX = targetX - ELBOW_OFFSET;
    path = [
      `M ${sourceX},${sourceY}`,
      `L ${sourceElbowX},${sourceY}`,
      `L ${sourceElbowX},${laneY}`,
      `L ${targetElbowX},${laneY}`,
      `L ${targetElbowX},${targetY}`,
      `L ${targetX},${targetY}`
    ].join(" ");
    labelY = laneY + (route === "top" ? 22 : -22);

    if (isSourceAnchoredRelation(edgeData.relation)) {
      labelAnchor = "start";
      labelX = sourceElbowX + NODE_HANDLE_GAP;
    } else if (isTargetAnchoredRelation(edgeData.relation)) {
      labelAnchor = "end";
      labelX = targetElbowX - NODE_HANDLE_GAP;
    } else {
      labelX = (sourceElbowX + targetElbowX) / 2;
    }
  } else {
    const [smoothPath, smoothLabelX, smoothLabelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition: sourcePosition ?? Position.Right,
      targetX,
      targetY,
      targetPosition: targetPosition ?? Position.Left,
      borderRadius: 18,
      offset: 34
    });
    const horizontalEdge = Math.abs(sourceY - targetY) < 20;

    path = smoothPath;

    if (isSourceAnchoredRelation(edgeData.relation)) {
      labelAnchor = "start";
      labelX = sourceX + NODE_HANDLE_GAP;
      labelY = sourceY + labelYOffset(sourceY, targetY);
    } else if (isTargetAnchoredRelation(edgeData.relation)) {
      const labelSlot = edgeData.labelSlot ?? (sourceY <= targetY ? -1 : 1);

      labelAnchor = "end";
      labelX = targetX - NODE_HANDLE_GAP;
      labelY = targetY + labelSlot * BRANCH_LABEL_OFFSET;
    } else {
      const labelOffset = horizontalEdge ? -22 : sourceY < targetY ? -18 : 18;

      labelX = smoothLabelX;
      labelY = smoothLabelY + labelOffset;
    }
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={interactionWidth}
        style={style}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            data-edge-id={id}
            className={`routed-edge-label ${route ? `route-${route}` : "route-inline"} relation-${
              edgeData.relation ?? "required"
            }`}
            style={{
              transform: `translate(${
                labelAnchor === "start" ? "0" : labelAnchor === "end" ? "-100%" : "-50%"
              }, -50%) translate(${labelX}px, ${labelY}px)`
            }}
            title={context ? `${label} (${context})` : String(label)}
          >
            <span className="routed-edge-main">{label}</span>
            {context ? <span className="routed-edge-context">{context}</span> : null}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
