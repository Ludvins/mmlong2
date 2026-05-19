import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent
} from "react";
import { ArrowRight, X } from "lucide-react";

import logoUrl from "../assets/mmlong2-logo.png";
import { exampleRuns, pipelineEdges, pipelineNodes } from "../pipeline";
import type { EdgeRelation } from "../pipeline";
import { DetailPanel } from "./DetailPanel";
import { ExampleRunPanel } from "./ExampleRunPanel";
import { filterPipeline } from "./graphUtils";
import { PipelineCanvas } from "./PipelineCanvas";
import { PipelineToolbar } from "./PipelineToolbar";

const legend = [
  ["input", "#5f7894"],
  ["decision", "#6d5cae"],
  ["rule", "#2e6f95"],
  ["algorithm", "#4c7f52"],
  ["aggregate", "#a36d1d"],
  ["output", "#b14c3f"]
];

const edgeLegend: Array<[EdgeRelation, string, string]> = [
  ["switch", "#b9822c", "switch"],
  ["conditional", "#6658a7", "if/else"],
  ["optional", "#6b7280", "optional"],
  ["fanout", "#2f8b70", "fan-out"],
  ["merge", "#2374a6", "merge"]
];

const edgeRelationLabels: Record<EdgeRelation, string> = {
  required: "required data",
  optional: "optional input",
  switch: "config switch",
  conditional: "if/else gate",
  fanout: "automatic fan-out",
  merge: "merge/aggregation"
};

const DETAIL_PANEL_DEFAULT_WIDTH = 480;
const DETAIL_PANEL_MIN_WIDTH = 390;
const DETAIL_PANEL_MAX_WIDTH = 860;
const DETAIL_PANEL_DESKTOP_BREAKPOINT = 960;

function clampDetailWidth(width: number, viewportWidth = window.innerWidth) {
  const viewportMax = Math.max(DETAIL_PANEL_MIN_WIDTH, viewportWidth - 560);
  return Math.min(Math.max(width, DETAIL_PANEL_MIN_WIDTH), DETAIL_PANEL_MAX_WIDTH, viewportMax);
}

export function PipelineExplorer() {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("All");
  const [selectedId, setSelectedId] = useState("binette");
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>();
  const [selectedExampleId, setSelectedExampleId] = useState<string>("np-default-ensemble");
  const [fitSignal, setFitSignal] = useState(0);
  const [detailPanelWidth, setDetailPanelWidth] = useState(DETAIL_PANEL_DEFAULT_WIDTH);
  const [isResizingDetail, setIsResizingDetail] = useState(false);
  const resizeStart = useRef<
    { pointerX: number; startWidth: number; viewportWidth: number } | undefined
  >(undefined);

  const graph = useMemo(() => filterPipeline(query, stage), [query, stage]);
  const selectedNode = pipelineNodes.find((node) => node.id === selectedId);
  const selectedEdge = graph.edges.find((edge) => edge.id === selectedEdgeId);
  const selectedEdgeSource = graph.nodes.find((node) => node.id === selectedEdge?.source);
  const selectedEdgeTarget = graph.nodes.find((node) => node.id === selectedEdge?.target);
  const selectedExample = exampleRuns.find((example) => example.id === selectedExampleId);
  const appShellStyle = {
    "--detail-panel-width": `${detailPanelWidth}px`
  } as CSSProperties;

  const resizeDetailByKeyboard = useCallback((delta: number) => {
    setDetailPanelWidth((width) => clampDetailWidth(width + delta));
  }, []);

  const resetDetailWidth = useCallback(() => {
    setDetailPanelWidth(clampDetailWidth(DETAIL_PANEL_DEFAULT_WIDTH));
  }, []);

  const selectNode = useCallback((id: string) => {
    setSelectedId(id);
    setSelectedEdgeId(undefined);
  }, []);

  const selectExample = useCallback((id: string | undefined) => {
    setSelectedExampleId(id ?? "");
    setSelectedEdgeId(undefined);

    if (!id) {
      return;
    }

    const example = exampleRuns.find((candidate) => candidate.id === id);

    if (!example) {
      return;
    }

    setQuery("");
    setStage("All");
    setSelectedId(example.focusNodeId);
  }, []);

  const startDetailResize = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (window.innerWidth <= DETAIL_PANEL_DESKTOP_BREAKPOINT) {
        return;
      }

      event.preventDefault();
      resizeStart.current = {
        pointerX: event.clientX,
        startWidth: detailPanelWidth,
        viewportWidth: window.innerWidth
      };
      setIsResizingDetail(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [detailPanelWidth]
  );

  useEffect(() => {
    if (graph.nodes.length > 0 && !graph.nodes.some((node) => node.id === selectedId)) {
      setSelectedId(graph.nodes[0].id);
    }
  }, [graph.nodes, selectedId]);

  useEffect(() => {
    if (selectedEdgeId && !graph.edges.some((edge) => edge.id === selectedEdgeId)) {
      setSelectedEdgeId(undefined);
    }
  }, [graph.edges, selectedEdgeId]);

  useEffect(() => {
    const handleResize = () => {
      setDetailPanelWidth((width) => clampDetailWidth(width));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isResizingDetail) {
      return;
    }

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (!resizeStart.current) {
        return;
      }

      const delta = resizeStart.current.pointerX - event.clientX;
      setDetailPanelWidth(
        clampDetailWidth(
          resizeStart.current.startWidth + delta,
          resizeStart.current.viewportWidth
        )
      );
    };

    const stopResize = () => {
      resizeStart.current = undefined;
      setIsResizingDetail(false);
    };

    document.body.classList.add("detail-panel-resize-active");
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);

    return () => {
      document.body.classList.remove("detail-panel-resize-active");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };
  }, [isResizingDetail]);

  return (
    <main
      className={`app-shell ${isResizingDetail ? "is-resizing-detail" : ""}`}
      style={appShellStyle}
    >
      <section className="diagram-region" aria-label="mmlong2 pipeline diagram">
        <header className="app-header">
          <div className="brand">
            <img src={logoUrl} alt="" />
            <div>
              <h1>mmlong2 Pipeline Explorer</h1>
              <p>Rule-level workflow map with method equations, losses, and binning decisions.</p>
            </div>
          </div>
          <div className="brand-stats" aria-label="Explorer summary">
            <span>{pipelineNodes.length} nodes</span>
            <span>{pipelineEdges.length} links</span>
            <span>mmlong2 v1.2.1</span>
          </div>
        </header>

        <PipelineToolbar
          query={query}
          stage={stage}
          resultCount={graph.nodes.length}
          onQueryChange={setQuery}
          onStageChange={setStage}
          onResetView={() => setFitSignal((value) => value + 1)}
        />

        <ExampleRunPanel
          examples={exampleRuns}
          selectedExample={selectedExample}
          onExampleChange={selectExample}
          onSelectNode={selectNode}
        />

        <div className="canvas-wrap">
          <PipelineCanvas
            nodes={graph.nodes}
            edges={graph.edges}
            selectedId={selectedId}
            selectedEdgeId={selectedEdgeId}
            exampleRun={selectedExample}
            fitSignal={fitSignal}
            onSelectNode={selectNode}
            onSelectEdge={setSelectedEdgeId}
            onClearEdge={() => setSelectedEdgeId(undefined)}
          />
          {selectedEdge && selectedEdgeSource && selectedEdgeTarget ? (
            <aside className="edge-inspector" aria-label="Selected connection">
              <div>
                <span>Selected link</span>
                <strong>
                  {selectedEdgeSource.label} <ArrowRight aria-hidden="true" /> {selectedEdgeTarget.label}
                </strong>
                <small>
                  {edgeRelationLabels[selectedEdge.relation ?? "required"]}
                  {selectedEdge.label ? `: ${selectedEdge.label}` : ""}
                </small>
              </div>
              <button
                className="icon-button edge-close"
                type="button"
                onClick={() => setSelectedEdgeId(undefined)}
                title="Clear selected link"
                aria-label="Clear selected link"
              >
                <X aria-hidden="true" />
              </button>
            </aside>
          ) : null}
          <div className="legend" aria-label="Diagram legend">
            <div className="legend-row" aria-label="Node kinds">
              <span className="legend-row-title">Nodes</span>
              {legend.map(([label, color]) => (
                <span className="legend-item" key={label}>
                  <span className="legend-dot" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>
            <div className="legend-row" aria-label="Connection types">
              <span className="legend-row-title">Connections</span>
              {edgeLegend.map(([relation, color, label]) => (
                <span className="legend-item edge-legend-item" key={relation}>
                  <span
                    className={`legend-line relation-${relation}`}
                    style={{ backgroundColor: color, color }}
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <DetailPanel
        exampleRun={selectedExample}
        isResizing={isResizingDetail}
        node={selectedNode}
        onResizeByKeyboard={resizeDetailByKeyboard}
        onResizeReset={resetDetailWidth}
        onResizeStart={startDetailResize}
        panelWidth={detailPanelWidth}
      />
    </main>
  );
}
