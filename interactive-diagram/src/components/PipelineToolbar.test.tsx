import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PipelineToolbar } from "./PipelineToolbar";

describe("PipelineToolbar", () => {
  it("emits search, stage, and reset events", () => {
    const onQueryChange = vi.fn();
    const onStageChange = vi.fn();
    const onResetView = vi.fn();

    render(
      <PipelineToolbar
        query=""
        stage="All"
        resultCount={29}
        onQueryChange={onQueryChange}
        onStageChange={onStageChange}
        onResetView={onResetView}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Search rules/i), {
      target: { value: "SemiBin2" }
    });
    fireEvent.change(screen.getByLabelText("Filter by stage"), {
      target: { value: "Binning" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset graph view" }));

    expect(onQueryChange).toHaveBeenCalledWith("SemiBin2");
    expect(onStageChange).toHaveBeenCalledWith("Binning");
    expect(onResetView).toHaveBeenCalled();
    expect(screen.getByText("29 steps")).toBeInTheDocument();
  });
});
