# mmlong2 Pipeline Explorer

Static interactive diagram for the mmlong2 workflow. It renders the pipeline as a clickable React Flow graph and opens rule-level technical panels with mmlong2 commands, config defaults, algorithm notes, equations, and citations.

The example-run selector contains curated mock traces for Nanopore default, PacBio fast, extended COMEBin, custom assembly/proc databases, and direct single-contig MAG recovery. These examples are illustrative only; they show how inputs propagate through mmlong2 branch logic without reading or executing real run outputs.

## Development

PowerShell on this machine blocks the `npm.ps1` shim, so use `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

## Verification

```powershell
npm.cmd run build
npm.cmd run test
npm.cmd run test:e2e
```

## GitHub Pages

The fork deploys this static app through `.github/workflows/deploy-interactive-diagram.yml`.
After GitHub Pages is enabled with the `GitHub Actions` source, pushes to `main` publish the
built diagram from `interactive-diagram/dist`.

The app is static and documentation-only. It does not execute mmlong2, inspect run outputs, or require a backend.
