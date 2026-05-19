import { describe, expect, it } from "vitest";

import { detailContentKeys } from "../content/registry";
import { exampleRuns, mockNodeExamples, pipelineEdges, pipelineNodes } from ".";

describe("pipeline graph integrity", () => {
  it("uses unique node IDs", () => {
    const ids = pipelineNodes.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only references existing nodes in edges", () => {
    const ids = new Set(pipelineNodes.map((node) => node.id));

    for (const edge of pipelineEdges) {
      expect(ids.has(edge.source), `${edge.id} has invalid source`).toBe(true);
      expect(ids.has(edge.target), `${edge.id} has invalid target`).toBe(true);
    }
  });

  it("has authored MDX content for every node", () => {
    const contentKeys = new Set(detailContentKeys);

    for (const node of pipelineNodes) {
      expect(contentKeys.has(node.detailsMdx), `${node.id} missing ${node.detailsMdx}`).toBe(true);
    }
  });

  it("cites local or upstream sources for implementation nodes", () => {
    for (const node of pipelineNodes.filter((candidate) => candidate.kind !== "input")) {
      expect(node.citations.length, `${node.id} has no citations`).toBeGreaterThan(0);
      expect(
        node.citations.some((citation) => citation.url || citation.localPath),
        `${node.id} has no source location`
      ).toBe(true);
    }
  });

  it("labels parameters as mmlong2-configured or upstream-default sources", () => {
    for (const node of pipelineNodes) {
      for (const parameter of node.parameters) {
        expect(["mmlong2", "upstream"]).toContain(parameter.source);
      }
    }
  });

  it("models method-choice branches and downstream merge points explicitly", () => {
    const ids = new Set(pipelineNodes.map((node) => node.id));
    const edgeIds = new Set(pipelineEdges.map((edge) => edge.id));

    for (const id of [
      "nanopore_reads",
      "pacbio_reads",
      "reads",
      "domain_tiara",
      "domain_whokaryote",
      "filter_domain",
      "singleton_circular",
      "singleton_linear",
      "vamb_clustering",
      "semibin2_clustering",
      "comebin_clustering",
      "binmode_router",
      "mag_aggregate"
    ]) {
      expect(ids.has(id), `${id} should be a first-class graph node`).toBe(true);
    }

    for (const id of [
      "nanopore-reads-switch",
      "pacbio-reads-switch",
      "tiara-domain-split",
      "whokaryote-domain-split",
      "singleton-circular-qc",
      "singleton-linear-qc",
      "vamb-clustering",
      "vamb-clustering-candidate-bins",
      "semibin2-clustering",
      "semibin2-clustering-candidate-bins",
      "comebin-clustering",
      "comebin-clustering-candidate-bins",
      "router-qc",
      "singletons-mag-aggregate"
    ]) {
      expect(edgeIds.has(id), `${id} should be represented as an edge`).toBe(true);
    }
  });

  it("annotates edge semantics for switches, optionals, fan-outs, and merges", () => {
    const edges = new Map(pipelineEdges.map((edge) => [edge.id, edge]));

    expect(edges.get("nanopore-reads-switch")?.relation).toBe("switch");
    expect(edges.get("pacbio-reads-switch")?.relation).toBe("switch");
    expect(edges.get("diffcov-coverage-prep")?.relation).toBe("optional");
    expect(edges.get("filter-length-taxonomy")?.relation).toBe("fanout");
    expect(edges.get("metaflye-selected")?.relation).toBe("merge");
    expect(edges.get("selected-polishing")?.relation).toBe("conditional");
  });

  it("defines valid example runs for every major method family", () => {
    const nodeIds = new Set(pipelineNodes.map((node) => node.id));
    const edgeIds = new Set(pipelineEdges.map((edge) => edge.id));
    const exampleIds = exampleRuns.map((example) => example.id);

    expect(new Set(exampleIds).size).toBe(exampleIds.length);

    for (const example of exampleRuns) {
      expect(example.trace.length, `${example.id} should explain propagation`).toBeGreaterThan(0);
      expect(nodeIds.has(example.focusNodeId), `${example.id} focus node is invalid`).toBe(true);

      for (const nodeId of [...example.activeNodeIds, ...example.skippedNodeIds]) {
        expect(nodeIds.has(nodeId), `${example.id} references invalid node ${nodeId}`).toBe(true);
      }

      for (const edgeId of example.activeEdgeIds) {
        expect(edgeIds.has(edgeId), `${example.id} references invalid edge ${edgeId}`).toBe(true);
      }

      for (const step of example.trace) {
        expect(nodeIds.has(step.nodeId), `${example.id} trace references invalid node`).toBe(true);
        expect(step.detail.length).toBeGreaterThan(40);
        expect(step.artifacts.length).toBeGreaterThan(0);
      }
    }

    const coveredNodeIds = new Set(exampleRuns.flatMap((example) => example.activeNodeIds));

    for (const id of [
      "nanopore_reads",
      "pacbio_reads",
      "diffcov",
      "database_inputs",
      "assembly_metaflye",
      "assembly_metamdbg",
      "assembly_myloasm",
      "assembly_custom",
      "polishing",
      "curation",
      "domain_tiara",
      "domain_whokaryote",
      "singletons",
      "metabat2",
      "vamb",
      "vamb_clustering",
      "semibin2",
      "semibin2_clustering",
      "comebin",
      "comebin_clustering",
      "binette",
      "binning_qc",
      "checkm_qc2",
      "taxonomy",
      "annotation",
      "extraqc",
      "stats"
    ]) {
      expect(coveredNodeIds.has(id), `${id} should appear in at least one example`).toBe(true);
    }
  });

  it("provides mock input and output previews for every pipeline node", () => {
    const nodeIds = pipelineNodes.map((node) => node.id);
    const mockIds = Object.keys(mockNodeExamples);

    expect(new Set(mockIds).size).toBe(mockIds.length);

    for (const id of nodeIds) {
      const example = mockNodeExamples[id];

      expect(example, `${id} should have mock I/O previews`).toBeDefined();
      expect(example.nodeId).toBe(id);
      expect(example.inputs.length, `${id} should have mock inputs`).toBeGreaterThan(0);
      expect(example.outputs.length, `${id} should have mock outputs`).toBeGreaterThan(0);

      for (const artifact of [...example.inputs, ...example.outputs]) {
        expect(artifact.label.length).toBeGreaterThan(0);
        expect(artifact.type.length).toBeGreaterThan(0);
        expect(artifact.format.length).toBeGreaterThan(8);
        expect(artifact.preview.length).toBeGreaterThan(0);
      }
    }
  });
});
