import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { exampleRuns } from "../pipeline";
import { ExampleRunPanel } from "./ExampleRunPanel";

describe("ExampleRunPanel", () => {
  it("selects example runs and emits trace node selections", () => {
    const onExampleChange = vi.fn();
    const onSelectNode = vi.fn();
    const selectedExample = exampleRuns[0];

    render(
      <ExampleRunPanel
        examples={exampleRuns}
        selectedExample={selectedExample}
        onExampleChange={onExampleChange}
        onSelectNode={onSelectNode}
      />
    );

    fireEvent.change(screen.getByLabelText("Example run"), {
      target: { value: exampleRuns[1].id }
    });
    fireEvent.click(screen.getByRole("button", { name: new RegExp(selectedExample.trace[0].title) }));

    expect(onExampleChange).toHaveBeenCalledWith(exampleRuns[1].id);
    expect(onSelectNode).toHaveBeenCalledWith(selectedExample.trace[0].nodeId);
    expect(screen.getByText(selectedExample.mockCommand)).toBeInTheDocument();
  });
});
