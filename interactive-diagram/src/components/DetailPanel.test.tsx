import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { pipelineNodes } from "../pipeline";
import { DetailPanel } from "./DetailPanel";

describe("DetailPanel", () => {
  it("renders selected node metadata and parameter sources", () => {
    const node = pipelineNodes.find((candidate) => candidate.id === "semibin2");
    expect(node).toBeDefined();

    render(<DetailPanel node={node} />);

    expect(screen.getByRole("heading", { name: "SemiBin2 representation model" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Parameters/i }));

    expect(screen.getByText("Parameter interpretation")).toBeInTheDocument();
    expect(screen.getByText(/configured or selected by mmlong2/i)).toBeInTheDocument();
    expect(screen.getByText("semibin_mod")).toBeInTheDocument();
    expect(screen.getAllByText("mmlong2-configured").length).toBeGreaterThan(0);
  });

  it("defaults to authored technical overview content with equations", async () => {
    const node = pipelineNodes.find((candidate) => candidate.id === "vamb");
    expect(node).toBeDefined();

    render(<DetailPanel node={node} />);

    expect(screen.getByRole("button", { name: /Overview/i })).toHaveClass("active");
    expect(screen.getByTestId("mdx-content")).toBeInTheDocument();
    expect(screen.getAllByText(/VAMB/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/variational autoencoder/i)).toBeInTheDocument();
    expect(document.querySelector(".katex")).toBeTruthy();
  });

  it("explains rule metadata in Quick Facts", () => {
    const node = pipelineNodes.find((candidate) => candidate.id === "filter_length");
    expect(node).toBeDefined();

    render(<DetailPanel node={node} />);

    fireEvent.click(screen.getByRole("button", { name: /Quick Facts/i }));

    expect(screen.getByText("How to read this node")).toBeInTheDocument();
    expect(screen.getByText(/concrete mmlong2 execution logic/i)).toBeInTheDocument();
    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.getAllByText("Filtering_length").length).toBeGreaterThan(0);
  });

  it("renders source links and local paths", () => {
    const node = pipelineNodes.find((candidate) => candidate.id === "binette");
    expect(node).toBeDefined();

    render(<DetailPanel node={node} />);

    fireEvent.click(screen.getByRole("button", { name: /Sources/i }));

    expect(screen.getByText("Evidence map")).toBeInTheDocument();
    expect(screen.getByText(/prioritize local Snakefile/i)).toBeInTheDocument();
    expect(screen.getByText("Binette docs")).toBeInTheDocument();
    expect(screen.getByText("../src/mmlong2-lite.smk")).toBeInTheDocument();
  });
});
