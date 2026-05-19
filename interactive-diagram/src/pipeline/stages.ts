import type { PipelineStage } from "./types";

export const stages: PipelineStage[] = [
  { id: "Inputs", label: "Inputs" },
  { id: "Wrapper", label: "Wrapper" },
  { id: "Assembly", label: "Assembly" },
  { id: "Polishing", label: "Polishing" },
  { id: "Curation", label: "Curation" },
  { id: "Filtering", label: "Filtering" },
  { id: "Singletons", label: "Singletons" },
  { id: "Coverage", label: "Coverage" },
  { id: "Embedding", label: "Embedding" },
  { id: "Binning", label: "Binning" },
  { id: "Binning Evaluation", label: "Binning Evaluation" },
  { id: "Summary", label: "Summary" },
  { id: "Taxonomy", label: "Taxonomy" },
  { id: "Annotation", label: "Annotation" },
  { id: "Extra QC", label: "Extra QC" },
  { id: "Stats", label: "Stats" },
  { id: "Final Outputs", label: "Final Outputs" }
];

export const stageOrder = new Map(stages.map((stage, index) => [stage.id, index]));
