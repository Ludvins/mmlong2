import { RotateCcw, Search } from "lucide-react";

import { stages } from "../pipeline";

type PipelineToolbarProps = {
  query: string;
  stage: string;
  resultCount: number;
  onQueryChange: (value: string) => void;
  onStageChange: (value: string) => void;
  onResetView: () => void;
};

export function PipelineToolbar({
  query,
  stage,
  resultCount,
  onQueryChange,
  onStageChange,
  onResetView
}: PipelineToolbarProps) {
  return (
    <div className="toolbar" aria-label="Pipeline controls">
      <label aria-label="Search nodes">
        <Search aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search rules, tools, parameters..."
        />
      </label>

      <select
        aria-label="Filter by stage"
        value={stage}
        onChange={(event) => onStageChange(event.target.value)}
      >
        <option value="All">All stages</option>
        {stages.map((stageOption) => (
          <option key={stageOption.id} value={stageOption.id}>
            {stageOption.label}
          </option>
        ))}
      </select>

      <button
        className="icon-button"
        type="button"
        onClick={onResetView}
        title="Reset graph view"
        aria-label="Reset graph view"
      >
        <RotateCcw aria-hidden="true" />
      </button>

      <span className="toolbar-count">{resultCount} steps</span>
    </div>
  );
}
