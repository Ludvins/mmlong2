import { ListTree, X } from "lucide-react";

import type { ExampleRun } from "../pipeline";

type ExampleRunPanelProps = {
  examples: ExampleRun[];
  selectedExample?: ExampleRun;
  onExampleChange: (id: string | undefined) => void;
  onSelectNode: (id: string) => void;
};

export function ExampleRunPanel({
  examples,
  selectedExample,
  onExampleChange,
  onSelectNode
}: ExampleRunPanelProps) {
  return (
    <section className="example-run-panel" aria-label="Mock propagation trace">
      <div className="example-run-control">
        <label>
          <ListTree aria-hidden="true" />
          <select
            aria-label="Example run"
            value={selectedExample?.id ?? ""}
            onChange={(event) => onExampleChange(event.target.value || undefined)}
          >
            <option value="">No example trace</option>
            {examples.map((example) => (
              <option key={example.id} value={example.id}>
                {example.shortLabel}
              </option>
            ))}
          </select>
        </label>
        {selectedExample ? (
          <button
            className="icon-button example-clear"
            type="button"
            title="Clear example trace"
            aria-label="Clear example trace"
            onClick={() => onExampleChange(undefined)}
          >
            <X aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {selectedExample ? (
        <div className="example-run-body">
          <div className="example-run-main">
            <div>
              <span>Example</span>
              <h2>{selectedExample.title}</h2>
            </div>
            <p>{selectedExample.summary}</p>
            <code>{selectedExample.mockCommand}</code>
          </div>

          <div className="example-config" aria-label="Example configuration">
            {selectedExample.config.map((item) => (
              <span key={`${item.label}-${item.value}`}>
                <strong>{item.label}</strong>
                {item.value}
              </span>
            ))}
          </div>

          <div className="example-coverage" aria-label="Methods covered by this example">
            {selectedExample.coverage.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>

          <ol className="example-trace-list" aria-label="Example propagation steps">
            {selectedExample.trace.map((step, index) => (
              <li key={`${selectedExample.id}-${step.nodeId}`}>
                <button type="button" onClick={() => onSelectNode(step.nodeId)}>
                  <span>{index + 1}</span>
                  <strong>{step.title}</strong>
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="example-run-empty">
          <strong>Mock propagation examples</strong>
          <span>{examples.length} curated traces cover the method branches.</span>
        </div>
      )}
    </section>
  );
}
