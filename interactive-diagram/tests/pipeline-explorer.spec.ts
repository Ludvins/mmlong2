import { expect, test } from "@playwright/test";

test("loads the graph and opens binning method panels", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "mmlong2 Pipeline Explorer" })).toBeVisible();
  await expect(page.locator(".node-title", { hasText: "SemiBin2" }).first()).toBeVisible();

  for (const label of [
    "SemiBin2",
    "SemiBin2 DBSCAN integration",
    "VAMB",
    "VAMB latent clustering",
    "COMEBin",
    "COMEBin Leiden clustering",
    "Binette ensemble refinement"
  ]) {
    await page.locator(".node-title", { hasText: label }).first().click();
    await expect(page.locator(".detail-head h2", { hasText: label })).toBeVisible();
    await expect(page.getByRole("button", { name: "Overview" })).toHaveClass(/active/);
    await expect(page.getByTestId("mdx-content")).toBeVisible();
  }

  await expect(page.locator(".katex").first()).toBeVisible();
});

test("embedding methods and their binning steps are separate clickable steps", async ({ page }) => {
  await page.goto("/");

  const selectNode = (id: string) =>
    page.evaluate((nodeId) => {
      const node = document.querySelector(`.react-flow__node[data-id="${nodeId}"]`);

      if (!node) {
        throw new Error(`${nodeId} node was not rendered`);
      }

      node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    }, id);

  await selectNode("semibin2");
  await expect(page.locator(".detail-head h2", { hasText: "SemiBin2 representation model" })).toBeVisible();
  await expect(page.getByText("shows how that embedding becomes concrete bins")).toBeVisible();

  await selectNode("semibin2_clustering");
  await expect(page.locator(".detail-head h2", { hasText: "SemiBin2 DBSCAN integration" })).toBeVisible();
  await expect(page.getByText("Ensemble of What?")).toBeVisible();
  await expect(page.getByText("one learned embedding, many DBSCAN runs")).toBeVisible();
  await expect(page.getByTestId("mdx-content")).toContainText(
    "Binette ensemble refinement"
  );

  await selectNode("vamb");
  await expect(page.locator(".detail-head h2", { hasText: "VAMB VAE embedding" })).toBeVisible();
  await expect(page.getByTestId("mdx-content")).toContainText("downstream VAMB latent clustering node");

  await selectNode("vamb_clustering");
  await expect(page.locator(".detail-head h2", { hasText: "VAMB latent clustering" })).toBeVisible();
  await expect(page.getByText("Latent-Space Binning")).toBeVisible();

  await selectNode("comebin");
  await expect(page.locator(".detail-head h2", { hasText: "COMEBin contrastive embedding" })).toBeVisible();
  await expect(page.getByTestId("mdx-content")).toContainText("downstream COMEBin Leiden clustering node");

  await selectNode("comebin_clustering");
  await expect(page.locator(".detail-head h2", { hasText: "COMEBin Leiden clustering" })).toBeVisible();
  await expect(page.getByText("From Embeddings to a Graph")).toBeVisible();
});

test("search and stage filtering keep the diagram usable", async ({ page }) => {
  await page.goto("/");

  await page.getByPlaceholder("Search rules, tools, parameters...").fill("GTDB");
  await expect(page.getByText("Genome, contig, and 16S taxonomy").first()).toBeVisible();

  await page.getByLabel("Filter by stage").selectOption("Binning");
  await expect(page.getByText("0 steps")).toBeVisible();

  await page.getByPlaceholder("Search rules, tools, parameters...").fill("");
  await expect(page.getByText(/steps$/)).toBeVisible();
  await expect(page.locator(".react-flow")).toBeVisible();
});

test("example runs trace mock inputs through method branches", async ({ page }) => {
  await page.goto("/");
  const exampleSelect = page.locator("select[aria-label='Example run']");
  const viewport = page.viewportSize();
  const compactExamplePanel = Boolean(viewport && viewport.width <= 960);

  await expect(exampleSelect).toHaveValue("");
  if (!compactExamplePanel) {
    await expect(page.getByText("Mock propagation examples")).toBeVisible();
    await expect(page.getByText("Mock A: Nanopore default ensemble")).toHaveCount(0);
  }
  await expect(page.locator(".node-card.example-active")).toHaveCount(0);
  await expect(page.locator(".flow-edge.example-edge")).toHaveCount(0);

  await exampleSelect.selectOption("np-extended-myloasm-diffcov");
  await expect(exampleSelect).toHaveValue("np-extended-myloasm-diffcov");
  if (!compactExamplePanel) {
    await expect(page.getByText("Mock C: Extended myloasm plus differential coverage")).toBeVisible();
    await expect(page.getByText("COMEBin embedding and Leiden clustering")).toBeVisible();
  }
  await expect(page.locator(".react-flow__node[data-id='comebin_clustering'] .node-card")).toHaveClass(
    /example-active/
  );

  if (compactExamplePanel) {
    await page.evaluate(() => {
      const node = document.querySelector('.react-flow__node[data-id="comebin_clustering"]');

      if (!node) {
        throw new Error("comebin_clustering node was not rendered");
      }

      node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    });
  } else {
    await page.getByRole("button", { name: /COMEBin Leiden clustering feeds CheckM2 directly/ }).click();
  }
  await expect(page.locator(".detail-head h2", { hasText: "COMEBin Leiden clustering" })).toBeVisible();
  await page.getByRole("button", { name: "Example", exact: true }).click();
  await expect(page.getByText("round_2/comebin/comebin_res/comebin_res.tsv", { exact: true })).toBeVisible();

  await exampleSelect.selectOption("smag-direct-recovery");
  await expect(exampleSelect).toHaveValue("smag-direct-recovery");
  await expect(page.locator(".react-flow__edge[data-id='singletons-mag-aggregate']")).toHaveClass(
    /example-edge/
  );
});

test("example detail tab explains skipped and active branches", async ({ page }) => {
  await page.goto("/");
  const exampleSelect = page.locator("select[aria-label='Example run']");

  await exampleSelect.selectOption("pb-fast-semibin");
  await page.evaluate(() => {
    const skipped = document.querySelector('.react-flow__node[data-id="vamb"]');

    if (!skipped) {
      throw new Error("vamb node was not rendered");
    }

    skipped.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  });
  await page.getByRole("button", { name: "Example", exact: true }).click();
  await expect(page.getByText("Skipped by this run")).toBeVisible();

  await page.evaluate(() => {
    const active = document.querySelector('.react-flow__node[data-id="semibin2_clustering"]');

    if (!active) {
      throw new Error("semibin2_clustering node was not rendered");
    }

    active.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  });
  await page.getByRole("button", { name: "Example", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "DBSCAN integration is the only fast-mode bin proposal" })
  ).toBeVisible();
  await expect(page.getByText("Mock I/O previews")).toBeVisible();
  await expect(page.getByText("Mock outputs")).toBeVisible();
  await expect(page.getByText("tmp/binning/round_1/semibin/output_bins/SemiBin_1.fa")).toBeVisible();
});

test("clicking an edge highlights the connection endpoints", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Filter by stage").selectOption("Filtering");
  await expect(page.locator(".react-flow__edge[data-id='filter-length-tiara']")).toBeVisible();

  await page
    .locator(".react-flow__edge[data-id='filter-length-tiara'] .react-flow__edge-interaction")
    .click({ force: true });

  await expect(page.getByLabel("Selected connection")).toBeVisible();
  await expect(page.getByLabel("Selected connection")).toContainText("Length and header filtering");
  await expect(page.getByLabel("Selected connection")).toContainText("Tiara domain classification");
  await expect(page.locator(".react-flow__edge[data-id='filter-length-tiara']")).toHaveClass(
    /selected-edge/
  );
  await expect(page.locator(".node-card.edge-endpoint")).toHaveCount(2);
});

test("node selection pans focus without changing the current zoom", async ({ page }) => {
  await page.goto("/");

  const viewportScale = () =>
    page.locator(".react-flow__viewport").evaluate((element) => {
      const transform = element.getAttribute("style") ?? "";
      const match = transform.match(/scale\(([-\d.]+)\)/);
      return match ? Number(match[1]) : Number.NaN;
    });

  await page.locator(".react-flow__controls-zoomin").click();
  await page.locator(".react-flow__controls-zoomin").click();

  const zoomBefore = await viewportScale();
  await page.evaluate(() => {
    const node = document.querySelector('.react-flow__node[data-id="vamb"]');

    if (!node) {
      throw new Error("vamb node was not rendered");
    }

    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  });
  await expect(page.locator(".detail-head h2", { hasText: "VAMB" })).toBeVisible();
  const zoomAfter = await viewportScale();

  expect(Math.abs(zoomAfter - zoomBefore)).toBeLessThan(0.01);
});

test("detail panel can be resized wider on desktop", async ({ page }) => {
  await page.goto("/");

  const viewport = page.viewportSize();

  if (viewport && viewport.width <= 960) {
    await expect(page.getByLabel("Resize detail panel")).toBeHidden();
    return;
  }

  const detailPanel = page.locator(".detail-panel");
  const resizeHandle = page.getByLabel("Resize detail panel");
  const before = await detailPanel.boundingBox();
  const handleBox = await resizeHandle.boundingBox();

  expect(before).not.toBeNull();
  expect(handleBox).not.toBeNull();

  if (!before || !handleBox) {
    return;
  }

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x - 160, handleBox.y + handleBox.height / 2, { steps: 6 });
  await page.mouse.up();

  const after = await detailPanel.boundingBox();

  expect(after).not.toBeNull();
  expect(after!.width).toBeGreaterThan(before.width + 120);
});

test("legend uses separate rows and avoids zoom and minimap controls", async ({ page }) => {
  await page.goto("/");

  const viewport = page.viewportSize();
  const legend = page.locator(".legend");

  if (viewport && viewport.width <= 1100) {
    await expect(legend).toBeHidden();
    return;
  }

  await expect(legend).toBeVisible();
  await expect(page.locator(".legend-row")).toHaveCount(2);
  await expect(page.locator(".legend-row", { hasText: "Nodes" })).toBeVisible();
  await expect(page.locator(".legend-row", { hasText: "Connections" })).toBeVisible();

  const boxes = await page.evaluate(() => {
    const rectFor = (selector: string) => {
      const element = document.querySelector(selector);

      if (!element) {
        return undefined;
      }

      const rect = element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        top: rect.top
      };
    };

    const overlaps = (
      a: { bottom: number; left: number; right: number; top: number },
      b: { bottom: number; left: number; right: number; top: number }
    ) =>
      Math.min(a.right, b.right) > Math.max(a.left, b.left) &&
      Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);

    const legendRect = rectFor(".legend");
    const controlsRect = rectFor(".react-flow__controls");
    const minimapRect = rectFor(".react-flow__minimap");

    return {
      overlapsControls: Boolean(legendRect && controlsRect && overlaps(legendRect, controlsRect)),
      overlapsMinimap: Boolean(legendRect && minimapRect && overlaps(legendRect, minimapRect))
    };
  });

  expect(boxes.overlapsControls).toBe(false);
  expect(boxes.overlapsMinimap).toBe(false);
});

test("zoom controls sit in the bottom left corner", async ({ page }) => {
  await page.goto("/");

  const placement = await page.evaluate(() => {
    const controls = document.querySelector(".react-flow__controls")?.getBoundingClientRect();
    const pane = document.querySelector(".pipeline-flow")?.getBoundingClientRect();

    if (!controls || !pane) {
      return undefined;
    }

    return {
      bottomGap: pane.bottom - controls.bottom,
      leftGap: controls.left - pane.left
    };
  });

  expect(placement).toBeDefined();
  expect(placement?.leftGap).toBeLessThanOrEqual(24);
  expect(placement?.bottomGap).toBeLessThanOrEqual(24);
});

test("candidate bin fan-in labels name the producing methods", async ({ page }) => {
  await page.goto("/");

  await page.locator(".node-title", { hasText: "Candidate bin sets" }).first().click();

  for (const label of [
    "MetaBAT2 -> partitions",
    "VAMB -> latent bins",
    "SemiBin2 -> DBSCAN ensemble bins",
    "COMEBin -> Leiden bins"
  ]) {
    await expect(page.getByText(label)).toBeVisible();
  }
});

test("overview markdown tables render as scroll-contained tables", async ({ page }) => {
  await page.goto("/");

  await page.locator(".node-title", { hasText: "Candidate bin sets" }).first().click();

  await expect(page.locator(".mdx-table-wrap table").first()).toBeVisible();
  await expect(page.locator(".mdx-table-wrap th", { hasText: "representation step" })).toBeVisible();
  await expect(page.getByText("| source | representation step |")).toHaveCount(0);

  const candidateOverflow = await page.locator(".detail-body").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth
  }));
  expect(candidateOverflow.scrollWidth - candidateOverflow.clientWidth).toBeLessThanOrEqual(1);

  await page.locator(".node-title", { hasText: "Binning-mode source selector" }).first().click();
  await expect(page.locator(".mdx-table-wrap table").first()).toBeVisible();

  const routerOverflow = await page.locator(".detail-body").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth
  }));
  expect(routerOverflow.scrollWidth - routerOverflow.clientWidth).toBeLessThanOrEqual(1);
});

test("iterative binning prep explains round-specific candidate sources", async ({ page }) => {
  await page.goto("/");

  await page.evaluate(() => {
    const node = document.querySelector('.react-flow__node[data-id="binning_prep"]');

    if (!node) {
      throw new Error("binning_prep node was not rendered");
    }

    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  });
  await expect(page.locator(".detail-head h2", { hasText: "Iterative binning prep" })).toBeVisible();

  for (const text of [
    "Only contigs inside bins copied to",
    "Which Round Uses Which Candidate Source?",
    "round_2/comebin/comebin_res/comebin_res.tsv",
    "round_4/metabat2/bins_metabat2.MemberMatrix.txt",
    "Round Ladder"
  ]) {
    await expect(page.getByText(text)).toBeVisible();
  }
});

test("fan-out labels include endpoint context near branch targets", async ({ page }) => {
  await page.goto("/");

  await page.locator(".node-title", { hasText: "Bin abundance and statistics" }).first().click();

  for (const endpoint of [
    "to Genome, contig",
    "to MAG annotation",
    "to Chimerism",
    "to Read, contig"
  ]) {
    await expect(page.locator(".routed-edge-context", { hasText: endpoint })).toBeVisible();
  }
});

test("filtering fan-out labels identify singleton and side-output targets", async ({ page }) => {
  await page.goto("/");

  await page.evaluate(() => {
    const node = document.querySelector('.react-flow__node[data-id="filter_domain"]');

    if (!node) {
      throw new Error("filter_domain node was not rendered");
    }

    node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  });
  await expect(page.locator(".detail-head h2", { hasText: "Domain FASTA split" })).toBeVisible();

  for (const endpoint of [
    "to Eukaryotic",
    "to Circular singleton",
    "to Iterative binning prep"
  ]) {
    await expect(page.locator(".routed-edge-context", { hasText: endpoint })).toBeVisible();
  }
});

test("input-stage switches distinguish user choices from optional fan-in", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Filter by stage").selectOption("Inputs");

  await expect(page.locator(".node-title", { hasText: "Nanopore FASTQ option" })).toBeVisible();
  await expect(page.locator(".node-title", { hasText: "PacBio HiFi FASTQ option" })).toBeVisible();
  await expect(page.locator(".node-title", { hasText: "Primary read-mode switch" })).toBeVisible();
  await expect(page.getByText("if -np: NP")).toBeVisible();
  await expect(page.getByText("if -pb: PB")).toBeVisible();
});

test("edge routing avoids crossing unrelated node cards", async ({ page }) => {
  await page.goto("/");

  const overlaps = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll(".react-flow__node")].map((element) => ({
      id: element.getAttribute("data-id"),
      rect: element.getBoundingClientRect()
    }));
    const edgeElements = [...document.querySelectorAll(".react-flow__edge")];
    const results: Array<{ id: string; hits: string[] }> = [];

    for (const edgeElement of edgeElements) {
      const id = edgeElement.getAttribute("data-id");
      const path = edgeElement.querySelector<SVGPathElement>(".react-flow__edge-path");

      if (!id || !path) {
        continue;
      }

      const totalLength = path.getTotalLength();
      const screenTransform = path.getScreenCTM();
      const hits = new Set<string>();

      if (!screenTransform) {
        continue;
      }

      for (let step = 0; step <= 100; step += 1) {
        const point = path.getPointAtLength((totalLength * step) / 100);
        const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(screenTransform);

        for (const node of nodes) {
          if (!node.id) {
            continue;
          }

          const source = edgeElement.getAttribute("data-source");
          const target = edgeElement.getAttribute("data-target");

          if (node.id === source || node.id === target) {
            continue;
          }

          const rect = node.rect;

          if (
            screenPoint.x > rect.left + 8 &&
            screenPoint.x < rect.right - 8 &&
            screenPoint.y > rect.top + 8 &&
            screenPoint.y < rect.bottom - 8
          ) {
            hits.add(node.id);
          }
        }
      }

      if (hits.size > 0) {
        results.push({ id, hits: [...hits] });
      }
    }

    return results;
  });

  expect(overlaps).toEqual([]);
});

test("edge labels avoid visible node cards and sibling labels", async ({ page }) => {
  await page.goto("/");

  const collectCollisions = (scenario: string) =>
    page.evaluate((scenarioName) => {
    type RectInfo = {
      bottom: number;
      height: number;
      left: number;
      right: number;
      top: number;
      width: number;
    };

    type NamedRect = {
      id: string;
      rect: RectInfo;
      text: string;
    };

    const toRect = (rect: DOMRect): RectInfo => ({
      bottom: rect.bottom,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      width: rect.width
    });

    const overlapArea = (a: RectInfo, b: RectInfo) => {
      const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

      return width > 0 && height > 0 ? width * height : 0;
    };

    const readableText = (element: Element) =>
      (element.textContent ?? "").replace(/\s+/g, " ").trim();

    const labels: NamedRect[] = [...document.querySelectorAll<HTMLElement>(".routed-edge-label")]
      .map((element, index) => ({
        id: element.dataset.edgeId ?? `edge-label-${index}`,
        rect: toRect(element.getBoundingClientRect()),
        text: readableText(element)
      }))
      .filter((label) => label.rect.width > 1 && label.rect.height > 1);

    const nodes: NamedRect[] = [...document.querySelectorAll<HTMLElement>(".react-flow__node")]
      .map((element) => ({
        id: element.dataset.id ?? "unknown-node",
        rect: toRect(element.getBoundingClientRect()),
        text: readableText(element)
      }))
      .filter((node) => node.rect.width > 1 && node.rect.height > 1);

    const nodeHits = labels.flatMap((label) =>
      nodes
        .filter((node) => overlapArea(label.rect, node.rect) > 12)
        .map((node) => `${label.id} overlaps node ${node.id}`)
    );

    const labelHits: string[] = [];

    labels.forEach((label, index) => {
      labels.slice(index + 1).forEach((other) => {
        if (overlapArea(label.rect, other.rect) > 12) {
          labelHits.push(`${label.id} overlaps label ${other.id}`);
        }
      });
    });

      return [...nodeHits, ...labelHits].map((hit) => `${scenarioName}: ${hit}`);
    }, scenario);

  const selectNode = (id: string) =>
    page.evaluate((nodeId) => {
      const node = document.querySelector(`.react-flow__node[data-id="${nodeId}"]`);

      if (!node) {
        throw new Error(`${nodeId} node was not rendered`);
      }

      node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    }, id);

  const collisions = [
    ...(await collectCollisions("default semibin focus"))
  ];

  for (const [id, scenario] of [
    ["filter_domain", "filtering fan-out focus"],
    ["candidate_bins", "candidate bin fan-in focus"],
    ["summary_lite", "summary fan-out focus"],
    ["reads", "input switch focus"]
  ]) {
    await selectNode(id);
    collisions.push(...(await collectCollisions(scenario)));
  }

  expect(collisions).toEqual([]);
});
