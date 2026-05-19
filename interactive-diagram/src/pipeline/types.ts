export type WorkflowName = "wrapper" | "lite" | "proc";

export type NodeKind = "input" | "decision" | "rule" | "algorithm" | "aggregate" | "output";

export type ParameterSource = "mmlong2" | "upstream";

export type PipelineParameter = {
  name: string;
  value: string;
  source: ParameterSource;
};

export type PipelineCitation = {
  label: string;
  url?: string;
  localPath?: string;
};

export type EdgeRelation =
  | "required"
  | "optional"
  | "switch"
  | "conditional"
  | "fanout"
  | "merge";

export type EdgeRoute = "top" | "bottom";

export type PipelineNode = {
  id: string;
  workflow: WorkflowName;
  stage: string;
  label: string;
  kind: NodeKind;
  rules: string[];
  command?: string;
  inputs: string[];
  outputs: string[];
  configKeys: string[];
  parameters: PipelineParameter[];
  detailsMdx: string;
  citations: PipelineCitation[];
};

export type PipelineEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  relation?: EdgeRelation;
  route?: EdgeRoute;
  lane?: number;
};

export type PipelineStage = {
  id: string;
  label: string;
};

export type ExampleRunStep = {
  nodeId: string;
  title: string;
  detail: string;
  artifacts: string[];
};

export type MockArtifactPreview = {
  label: string;
  type: string;
  path?: string;
  format: string;
  preview: string[];
};

export type NodeMockExample = {
  nodeId: string;
  inputs: MockArtifactPreview[];
  outputs: MockArtifactPreview[];
};

export type ExampleRun = {
  id: string;
  title: string;
  shortLabel: string;
  summary: string;
  mockCommand: string;
  config: Array<{ label: string; value: string }>;
  activeNodeIds: string[];
  activeEdgeIds: string[];
  skippedNodeIds: string[];
  focusNodeId: string;
  trace: ExampleRunStep[];
  coverage: string[];
};
