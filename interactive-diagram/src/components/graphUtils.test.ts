import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";

import { pipelineEdges, pipelineNodes } from "../pipeline";
import { filterPipeline, toFlowEdges, toFlowNodes } from "./graphUtils";

describe("graph filtering", () => {
  it("filters by query across rules and parameters", () => {
    const result = filterPipeline("self-supervised", "All");
    expect(result.nodes.map((node) => node.id)).toContain("semibin2");
  });

  it("filters embedding-stage methods and keeps only valid visible edges", () => {
    const result = filterPipeline("", "Embedding");
    const ids = new Set(result.nodes.map((node) => node.id));

    expect(result.nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining(["vamb", "semibin2", "comebin"])
    );
    expect(result.nodes.every((node) => node.stage === "Embedding")).toBe(true);
    expect(result.edges.every((edge) => ids.has(edge.source) && ids.has(edge.target))).toBe(true);
  });

  it("marks clicked edges and their endpoints as the selected connection", () => {
    const selectedEdgeId = "filter-length-tiara";
    const flowEdges = toFlowEdges(pipelineEdges, "semibin2", selectedEdgeId);
    const flowNodes = toFlowNodes(pipelineNodes, "semibin2", pipelineEdges, selectedEdgeId);
    const selectedEdge = flowEdges.find((edge) => edge.id === selectedEdgeId);
    const mutedEdge = flowEdges.find((edge) => edge.id === "semibin2-clustering-candidate-bins");
    const sourceNodeLabel = flowNodes.find((node) => node.id === "filter_length")?.data
      .label as ReactElement<{ className: string }>;
    const targetNodeLabel = flowNodes.find((node) => node.id === "domain_tiara")?.data
      .label as ReactElement<{ className: string }>;

    expect(selectedEdge?.className).toContain("selected-edge");
    expect(selectedEdge?.label).toBe("default: tiara_status TRUE");
    expect(mutedEdge?.className).toContain("muted-edge");
    expect(selectedEdge?.className).toContain("relation-switch");
    expect(sourceNodeLabel.props.className).toContain("edge-endpoint");
    expect(targetNodeLabel.props.className).toContain("edge-endpoint");
  });
});
