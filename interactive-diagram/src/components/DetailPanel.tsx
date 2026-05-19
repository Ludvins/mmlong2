import { MDXProvider } from "@mdx-js/react";
import { BookOpen, Code2, Database, FileText, ListTree, Network } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode
} from "react";

import { detailContent } from "../content/registry";
import { mockNodeExamples, type ExampleRun, type MockArtifactPreview, type PipelineNode } from "../pipeline";

type DetailPanelProps = {
  exampleRun?: ExampleRun;
  isResizing?: boolean;
  node?: PipelineNode;
  onResizeByKeyboard?: (delta: number) => void;
  onResizeReset?: () => void;
  onResizeStart?: (event: PointerEvent<HTMLButtonElement>) => void;
  panelWidth?: number;
};

type TabId = "overview" | "example" | "facts" | "io" | "command" | "parameters" | "sources";

const tabs: Array<{ id: TabId; label: string; icon: typeof BookOpen }> = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "example", label: "Example", icon: ListTree },
  { id: "facts", label: "Quick Facts", icon: FileText },
  { id: "io", label: "I/O", icon: Database },
  { id: "command", label: "mmlong2 Command", icon: Code2 },
  { id: "parameters", label: "Parameters", icon: FileText },
  { id: "sources", label: "Sources", icon: Network }
];

const mdxComponents = {
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="mdx-table-wrap">
      <table {...props} />
    </div>
  )
};

function SourceBadge({ source }: { source: "mmlong2" | "upstream" }) {
  return (
    <span className={`source-tag ${source === "upstream" ? "upstream" : ""}`}>
      {source === "mmlong2" ? "mmlong2-configured" : "upstream-default"}
    </span>
  );
}

function describeKind(node: PipelineNode) {
  const byKind: Record<PipelineNode["kind"], string> = {
    input:
      "This node is an external contract: the user or wrapper provides the path/value, then mmlong2 normalizes it into config entries that later Snakemake rules can consume.",
    decision:
      "This node is not a standalone tool call. It represents mmlong2 routing logic: helper functions or wrapper conditionals choose one branch, one artifact family, or one source directory for downstream rules.",
    rule:
      "This node corresponds to concrete mmlong2 execution logic, usually a Snakemake rule or a tightly coupled group of rules with a command template and declared artifacts.",
    algorithm:
      "This node wraps an upstream computational method. The Overview tab explains the model/math; the other tabs identify exactly how mmlong2 wires that method into the workflow.",
    aggregate:
      "This node collects, subsets, filters, or merges artifacts produced by earlier rules. It is important because it defines the handoff contract between stages.",
    output:
      "This node is a terminal or side-output artifact set. It documents what mmlong2 keeps for inspection or passes into final result tables."
  };

  return byKind[node.kind];
}

function describeWorkflow(node: PipelineNode) {
  const workflow = {
    wrapper: "Resolved by the root CLI wrapper before Snakemake execution starts.",
    lite: "Produced by the mmlong2-lite workflow, which covers assembly, filtering, coverage, binning, and core MAG evaluation.",
    proc: "Produced by the mmlong2-proc workflow, which turns accepted assemblies and bins into analysis tables."
  };

  return workflow[node.workflow];
}

function describeDownstream(node: PipelineNode) {
  if (node.outputs.length === 0) {
    return "This node does not declare a direct output artifact in the static diagram; inspect its Overview and sources for the surrounding control flow.";
  }

  if (node.kind === "decision") {
    return "Downstream rules consume only the selected route, even when several possible inputs are listed in the diagram.";
  }

  if (node.kind === "aggregate") {
    return "Downstream stages should be read as consuming the normalized aggregate, not every upstream intermediate independently.";
  }

  if (node.kind === "algorithm") {
    return "The next stage consumes the method output artifacts listed here, while the learned representation or clustering logic is explained in Overview.";
  }

  return "These outputs are the artifacts or config values that make the next visible graph connection meaningful.";
}

function explainConfigKeys(node: PipelineNode) {
  if (node.configKeys.length === 0) {
    return "No explicit config key is attached to this node in the curated v1 diagram.";
  }

  return `These keys are the local mmlong2 knobs that decide how ${node.label} is invoked, routed, or filtered. They are not a complete upstream tool manual; they are the values mmlong2 reads or writes around this step.`;
}

function describeCommand(node: PipelineNode) {
  if (!node.command) {
    return "This diagram node has no single shell command because it represents a conceptual input, output, or routing boundary.";
  }

  if (node.kind === "decision") {
    return "Read this as pseudocode for the branch selector. It explains which mmlong2 condition chooses the next artifact path rather than a command that is launched directly.";
  }

  if (node.command.includes("{")) {
    return "Curly-brace tokens are Snakemake placeholders or config-derived values. At runtime mmlong2 substitutes paths, thresholds, threads, and mode-specific options before the shell block is executed.";
  }

  return "This is the representative command or implementation pattern recorded for the node.";
}

function parameterSummary(node: PipelineNode) {
  const localCount = node.parameters.filter((parameter) => parameter.source === "mmlong2").length;
  const upstreamCount = node.parameters.length - localCount;

  if (node.parameters.length === 0) {
    return "No explicit parameter rows are attached to this node yet.";
  }

  if (upstreamCount === 0) {
    return "Every parameter listed here is configured or selected by mmlong2. Upstream defaults are intentionally omitted unless a primary source is represented in this app.";
  }

  return `${localCount} parameter${localCount === 1 ? "" : "s"} are set by mmlong2 and ${upstreamCount} parameter${upstreamCount === 1 ? "" : "s"} are inherited from the cited upstream tool. Upstream defaults are shown only when the app has a source to point at.`;
}

function sourceSummary(node: PipelineNode) {
  const localCount = node.citations.filter((citation) => citation.localPath).length;
  const externalCount = node.citations.length - localCount;

  if (node.citations.length === 0) {
    return "No sources are attached to this node yet.";
  }

  return `${localCount} local mmlong2 source${localCount === 1 ? "" : "s"} and ${externalCount} upstream/reference source${externalCount === 1 ? "" : "s"} support this panel. Local paths explain workflow behavior; external links support method or UI-library claims.`;
}

function commandSegments(command?: string) {
  if (!command) {
    return [];
  }

  return command
    .split(/;\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function ListBlock({
  title,
  intro,
  items
}: {
  title: string;
  intro?: string;
  items: string[];
}) {
  return (
    <section className="info-block">
      <h3>{title}</h3>
      {intro ? <p>{intro}</p> : null}
      {items.length > 0 ? (
        <ul>
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>No entries for this node.</p>
      )}
    </section>
  );
}

function NarrativeBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="info-block narrative-block">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function ArtifactList({
  title,
  description,
  items
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <section className="info-block">
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="artifact-list">
        {items.length > 0 ? (
          items.map((item, index) => (
            <article className="artifact-card" key={`${title}-${item}-${index}`}>
              <span>{index + 1}</span>
              <code>{item}</code>
            </article>
          ))
        ) : (
          <p>No entries for this node.</p>
        )}
      </div>
    </section>
  );
}

function ParameterCards({ node }: { node: PipelineNode }) {
  if (node.parameters.length === 0) {
    return (
      <section className="info-block">
        <h3>Parameter table</h3>
        <p>No explicit parameter rows are attached to this node yet.</p>
      </section>
    );
  }

  return (
    <div className="parameter-card-list">
      {node.parameters.map((parameter, index) => (
        <article
          className={`parameter-card ${parameter.source === "upstream" ? "upstream" : "local"}`}
          key={`${parameter.name}-${parameter.value}-${index}`}
        >
          <div>
            <strong>{parameter.name}</strong>
            <SourceBadge source={parameter.source} />
          </div>
          <p>{parameter.value}</p>
        </article>
      ))}
    </div>
  );
}

function SourceCards({ node }: { node: PipelineNode }) {
  if (node.citations.length === 0) {
    return (
      <section className="info-block">
        <h3>Source list</h3>
        <p>No sources are attached to this node yet.</p>
      </section>
    );
  }

  return (
    <div className="source-card-list">
      {node.citations.map((citation, index) => (
        <article className="source-card" key={`${citation.label}-${index}`}>
          <div>
            <strong>{citation.label}</strong>
            <span>{citation.localPath ? "local mmlong2 source" : "external reference"}</span>
          </div>
          <p>
            {citation.localPath
              ? "Use this path to verify the rule, helper, or config value that mmlong2 controls locally."
              : "Use this source for upstream method behavior, package behavior, or implementation context outside the mmlong2 repo."}
          </p>
          {citation.url ? (
            <a href={citation.url} target="_blank" rel="noreferrer">
              {citation.url}
            </a>
          ) : (
            <code>{citation.localPath}</code>
          )}
        </article>
      ))}
    </div>
  );
}

function ExampleCards({ node, exampleRun }: { node: PipelineNode; exampleRun?: ExampleRun }) {
  const mockExample = mockNodeExamples[node.id];

  if (!exampleRun) {
    return (
      <div className="section-grid">
        <section className="info-block">
          <h3>No example trace selected</h3>
          <p>The diagram can overlay curated mock runs that show how inputs propagate through branch choices.</p>
        </section>
        <MockArtifactSections mockExample={mockExample} />
      </div>
    );
  }

  const step = exampleRun.trace.find((candidate) => candidate.nodeId === node.id);
  const isActive = exampleRun.activeNodeIds.includes(node.id);
  const isSkipped = exampleRun.skippedNodeIds.includes(node.id);

  return (
    <div className="section-grid">
      <NarrativeBlock title={exampleRun.title}>
        <p>{exampleRun.summary}</p>
        <pre className="code-block example-command">{exampleRun.mockCommand}</pre>
      </NarrativeBlock>

      {step ? (
        <section className="info-block example-step-card">
          <h3>{step.title}</h3>
          <p>{step.detail}</p>
          <div className="artifact-list">
            {step.artifacts.map((artifact, index) => (
              <article className="artifact-card" key={`${step.nodeId}-${artifact}`}>
                <span>{index + 1}</span>
                <code>{artifact}</code>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="info-block">
          <h3>{isActive ? "Active in this run" : isSkipped ? "Skipped by this run" : "Outside this run"}</h3>
          <p>
            {isActive
              ? "This node is on the highlighted path, but the authored trace focuses on a nearby branch point or method handoff."
              : isSkipped
                ? "This branch is intentionally skipped by the selected mock configuration."
                : "This branch is not part of the selected mock propagation path."}
          </p>
        </section>
      )}

      <section className="info-block">
        <h3>Configuration snapshot</h3>
        <div className="example-config-list">
          {exampleRun.config.map((item) => (
            <span key={`${exampleRun.id}-${item.label}`}>
              <strong>{item.label}</strong>
              {item.value}
            </span>
          ))}
        </div>
      </section>

      <MockArtifactSections mockExample={mockExample} />
    </div>
  );
}

function MockArtifactSections({ mockExample }: { mockExample?: { inputs: MockArtifactPreview[]; outputs: MockArtifactPreview[] } }) {
  if (!mockExample) {
    return (
      <section className="info-block">
        <h3>Mock I/O previews</h3>
        <p>No mock artifact preview has been authored for this node yet.</p>
      </section>
    );
  }

  return (
    <section className="info-block mock-io-block">
      <h3>Mock I/O previews</h3>
      <p>
        These crafted examples are not real mmlong2 results. They show the expected artifact
        shape, path style, and data format for this step.
      </p>
      <div className="mock-io-grid">
        <MockArtifactList title="Mock inputs" artifacts={mockExample.inputs} />
        <MockArtifactList title="Mock outputs" artifacts={mockExample.outputs} />
      </div>
    </section>
  );
}

function MockArtifactList({ title, artifacts }: { title: string; artifacts: MockArtifactPreview[] }) {
  return (
    <div className="mock-artifact-column">
      <h4>{title}</h4>
      {artifacts.map((artifact) => (
        <article className="mock-artifact-card" key={`${title}-${artifact.label}-${artifact.path ?? ""}`}>
          <div>
            <strong>{artifact.label}</strong>
            <span>{artifact.type}</span>
          </div>
          {artifact.path ? <code>{artifact.path}</code> : null}
          <p>{artifact.format}</p>
          <pre>{artifact.preview.join("\n")}</pre>
        </article>
      ))}
    </div>
  );
}

export function DetailPanel({
  exampleRun,
  isResizing = false,
  node,
  onResizeByKeyboard,
  onResizeReset,
  onResizeStart,
  panelWidth
}: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const Content = useMemo(() => (node ? detailContent[node.detailsMdx] : undefined), [node]);

  useEffect(() => {
    setActiveTab("overview");
  }, [node?.id]);

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!onResizeByKeyboard) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onResizeByKeyboard(36);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      onResizeByKeyboard(-36);
    }

    if (event.key === "Home" && onResizeReset) {
      event.preventDefault();
      onResizeReset();
    }
  };

  const resizeHandle = (
    <button
      aria-label="Resize detail panel"
      aria-orientation="vertical"
      aria-valuenow={panelWidth}
      className="detail-resize-handle"
      onDoubleClick={onResizeReset}
      onKeyDown={handleResizeKeyDown}
      onPointerDown={onResizeStart}
      role="separator"
      title="Drag to resize detail panel"
      type="button"
    />
  );

  if (!node) {
    return (
      <aside className={`detail-panel ${isResizing ? "is-resizing" : ""}`}>
        {resizeHandle}
        <div className="empty-panel">
          <div>
            <strong>Select a pipeline step</strong>
            <p>Click a node to inspect rule-level details, equations, and sources.</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`detail-panel ${isResizing ? "is-resizing" : ""}`}
      aria-label={`${node.label} detail panel`}
    >
      {resizeHandle}
      <header className="detail-head">
        <div className="detail-stage">{node.stage}</div>
        <h2>{node.label}</h2>
        <div className="chip-row">
          <span className="chip">{node.workflow}</span>
          <span className="chip">{node.kind}</span>
          {node.rules.map((rule) => (
            <span className="chip" key={rule}>
              {rule}
            </span>
          ))}
        </div>
        <div className="detail-summary" aria-label="Node quick facts">
          <span>
            <strong>{node.inputs.length}</strong> inputs
          </span>
          <span>
            <strong>{node.outputs.length}</strong> outputs
          </span>
          <span>
            <strong>{node.configKeys.length}</strong> config keys
          </span>
        </div>
      </header>

      <nav className="tabs" aria-label="Detail sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              className={`tab ${activeTab === tab.id ? "active" : ""}`}
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon aria-hidden="true" size={15} /> {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="detail-body">
        {activeTab === "overview" && (
          <article className="mdx-content" data-testid="mdx-content">
            {Content ? (
              <MDXProvider components={mdxComponents}>
                <Content />
              </MDXProvider>
            ) : (
              <p>No authored MDX content found for {node.detailsMdx}.</p>
            )}
          </article>
        )}

        {activeTab === "facts" && (
          <div className="section-grid">
            <NarrativeBlock title="How to read this node">
              <p>{describeKind(node)}</p>
              <p>{describeWorkflow(node)}</p>
              <p>{describeDownstream(node)}</p>
            </NarrativeBlock>
            <ListBlock
              title="Rules"
              intro={
                node.rules.length > 0
                  ? "These are the local rule or helper names represented by the node. Multiple entries mean the visible step is a workflow bundle, not a single shell call."
                  : "No Snakemake rule is attached because this node is a wrapper input or conceptual boundary."
              }
              items={node.rules.length ? node.rules : [node.id]}
            />
            <ListBlock
              title="Config keys"
              intro={explainConfigKeys(node)}
              items={node.configKeys}
            />
            <ListBlock
              title="What this step hands to the next stage"
              intro="This is the practical downstream contract: the artifact, selected path, or normalized value represented by the outgoing diagram edges."
              items={node.outputs.slice(0, 4)}
            />
          </div>
        )}

        {activeTab === "example" && <ExampleCards node={node} exampleRun={exampleRun} />}

        {activeTab === "io" && (
          <div className="section-grid">
            <NarrativeBlock title="I/O interpretation">
              <p>
                Inputs are the artifacts, config values, or upstream decisions that must exist before
                this node can be evaluated. Outputs are what later graph edges should be read as
                carrying forward.
              </p>
              <p>{describeDownstream(node)}</p>
            </NarrativeBlock>
            <ArtifactList
              title="Inputs"
              description="Read these as the concrete files, directories, flags, or selected values that arrive at this step."
              items={node.inputs}
            />
            <ArtifactList
              title="Outputs"
              description="Read these as the artifacts or state this step contributes to later mmlong2 rules."
              items={node.outputs}
            />
          </div>
        )}

        {activeTab === "command" && (
          <div className="section-grid">
            <NarrativeBlock title="How to read the command">
              <p>{describeCommand(node)}</p>
              <p>
                The rule chips above the title identify where this command sits in the local
                workflow. The config keys listed in Quick Facts are the values most likely to alter
                this command or choose whether this node runs.
              </p>
            </NarrativeBlock>
            <section className="info-block command-block">
              <h3>Command or implementation pattern</h3>
              <pre className="code-block">
                {node.command ?? "No direct command for this conceptual input/output node."}
              </pre>
            </section>
            <section className="info-block">
              <h3>Command pieces</h3>
              {commandSegments(node.command).length > 1 ? (
                <ol className="command-steps">
                  {commandSegments(node.command).map((segment, index) => (
                    <li key={`${segment}-${index}`}>
                      <code>{segment}</code>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>
                  This node is best understood as one command template or one routing expression
                  rather than a sequence of shell stages.
                </p>
              )}
            </section>
          </div>
        )}

        {activeTab === "parameters" && (
          <div className="section-grid">
            <NarrativeBlock title="Parameter interpretation">
              <p>{parameterSummary(node)}</p>
              <p>
                Treat <strong>mmlong2-configured</strong> entries as values this repository sets,
                derives, or exposes through config/CLI. Treat <strong>upstream-default</strong>{" "}
                entries as behavior delegated to the installed tool.
              </p>
            </NarrativeBlock>
            <ParameterCards node={node} />
          </div>
        )}

        {activeTab === "sources" && (
          <div className="section-grid">
            <NarrativeBlock title="Evidence map">
              <p>{sourceSummary(node)}</p>
              <p>
                For exact mmlong2 behavior, prioritize local Snakefile, wrapper, and config sources.
                For model equations or package behavior, use the upstream papers or tool docs.
              </p>
            </NarrativeBlock>
            <SourceCards node={node} />
          </div>
        )}
      </div>
    </aside>
  );
}
