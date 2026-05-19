import { pipelineEdges } from "./edges";
import type { ExampleRun, ExampleRunStep } from "./types";

const edgeById = new Map(pipelineEdges.map((edge) => [edge.id, edge]));

function unique(values: string[]) {
  return [...new Set(values)];
}

function nodesFromEdges(edgeIds: string[]) {
  return edgeIds.flatMap((edgeId) => {
    const edge = edgeById.get(edgeId);

    return edge ? [edge.source, edge.target] : [];
  });
}

function makeRun({
  activeEdgeIds,
  additionalNodeIds = [],
  trace,
  ...run
}: Omit<ExampleRun, "activeNodeIds" | "activeEdgeIds" | "trace"> & {
  activeEdgeIds: string[];
  additionalNodeIds?: string[];
  trace: ExampleRunStep[];
}): ExampleRun {
  return {
    ...run,
    activeEdgeIds,
    activeNodeIds: unique([...nodesFromEdges(activeEdgeIds), ...trace.map((step) => step.nodeId), ...additionalNodeIds]),
    trace
  };
}

const sharedProcEdges = [
  "checkm-summary",
  "checkm-taxonomy",
  "checkm-annotation",
  "checkm-extraqc",
  "coverage-map-summary",
  "coverage-map-stats",
  "summary-taxonomy",
  "summary-annotation",
  "summary-extraqc",
  "summary-stats",
  "taxonomy-final",
  "annotation-final",
  "extraqc-final",
  "stats-final"
];

const sharedEvaluationEdges = [
  "router-qc",
  "qc-mag-aggregate",
  "mag-aggregate-final-checkm",
  ...sharedProcEdges
];

const sharedCoverageEdges = [
  "reads-coverage-prep",
  "coverage-prep-map",
  "coverage-map-aggregate",
  "coverage-aggregate-binning-prep",
  "coverage-map-semibin2"
];

const singletonEdges = [
  "filter-length-singleton-circular",
  "filter-length-singleton-linear",
  "filter-domain-singleton-circular",
  "singleton-circular-linear",
  "singleton-circular-qc",
  "singleton-linear-qc",
  "singletons-coverage-prep",
  "singletons-binning-prep",
  "singletons-mag-aggregate"
];

export const exampleRuns: ExampleRun[] = [
  makeRun({
    id: "np-default-ensemble",
    title: "Mock A: Nanopore default ensemble",
    shortLabel: "NP default",
    summary:
      "Nanopore reads assemble with metaFlye, optionally polish with Medaka, split domains with Tiara, then recover bins through the default MetaBAT2 + VAMB + SemiBin2 -> Binette ensemble path.",
    mockCommand:
      "mmlong2 -np mock_np.fastq.gz -o mockA -p 32 -fly -med -bin default",
    config: [
      { label: "mode", value: "Nanopore-simplex" },
      { label: "assembler", value: "metaflye" },
      { label: "polishing", value: "Medaka TRUE" },
      { label: "domain split", value: "Tiara" },
      { label: "binmode", value: "default" }
    ],
    activeEdgeIds: [
      "nanopore-reads-switch",
      "reads-wrapper",
      "wrapper-metaflye",
      "metaflye-selected",
      "selected-polishing",
      "polishing-curation",
      "curation-filter-length",
      "filter-length-tiara",
      "tiara-domain-split",
      "filter-domain-eukaryote",
      "filter-domain-binning-prep",
      ...singletonEdges,
      ...sharedCoverageEdges,
      "binning-prep-metabat2",
      "binning-prep-vamb",
      "binning-prep-semibin2",
      "metabat2-candidate-bins",
      "vamb-clustering",
      "vamb-clustering-candidate-bins",
      "semibin2-clustering",
      "semibin2-clustering-candidate-bins",
      "candidate-bins-binette",
      "binette-router",
      ...sharedEvaluationEdges
    ],
    skippedNodeIds: ["pacbio_reads", "assembly_metamdbg", "assembly_myloasm", "assembly_custom", "domain_whokaryote", "comebin", "comebin_clustering"],
    focusNodeId: "binette",
    coverage: [
      "Nanopore input switch",
      "metaFlye",
      "Medaka",
      "Tiara",
      "MetaBAT2",
      "VAMB embedding and clustering",
      "SemiBin2 embedding and DBSCAN",
      "Binette refinement",
      "CheckM2 and CheckM evaluation"
    ],
    trace: [
      {
        nodeId: "nanopore_reads",
        title: "Primary input becomes NP mode",
        detail:
          "The wrapper records one primary FASTQ and sets mode to Nanopore-simplex. Coverage mapping later treats the primary read set as 1-NP.",
        artifacts: ["fastq = mock_np.fastq.gz", "mode = Nanopore-simplex", "mapping label = 1-NP"]
      },
      {
        nodeId: "assembly_metaflye",
        title: "metaFlye produces the initial assembly",
        detail:
          "The selected assembler branch writes the assembly FASTA and metaFlye-style assembly_info.tsv used by later singleton rules.",
        artifacts: ["tmp/assembly/assembly.fasta", "tmp/assembly/assembly_info.tsv"]
      },
      {
        nodeId: "polishing",
        title: "Medaka replaces the assembly path before curation",
        detail:
          "Because this mock run uses -med and Nanopore reads, the selected assembly is polished before curation and length filtering consume it.",
        artifacts: ["tmp/polishing/asm_pol.fasta"]
      },
      {
        nodeId: "domain_tiara",
        title: "Tiara chooses prokaryotic and side-output contigs",
        detail:
          "Tiara is the default classifier. Prokaryotic headers feed binning, while eukaryotic or ambiguous records remain inspectable as a side output.",
        artifacts: ["contigs_filt_prok.txt", "contigs_filt_euk.txt", "asm_filt_prok.fasta"]
      },
      {
        nodeId: "singletons",
        title: "Single-contig genome candidates bypass the binner ensemble",
        detail:
          "Circular and large linear candidates are CheckM2-screened first. Kept singleton MAGs flow directly to MAG aggregation while their contigs are excluded from iterative binning.",
        artifacts: ["tmp/binning/singl/bins/*.fa", "tmp/binning/singl/binned.txt"]
      },
      {
        nodeId: "coverage_aggregate",
        title: "Coverage tables become method-specific matrices",
        detail:
          "The primary BAM depth table is merged into cov_all.tsv for MetaBAT2 and summaries, and cov_all_sub.tsv for VAMB.",
        artifacts: ["tmp/binning/mapping/cov_all.tsv", "tmp/binning/mapping/cov_all_sub.tsv"]
      },
      {
        nodeId: "metabat2",
        title: "MetaBAT2 partitions by abundance and composition",
        detail:
          "In default mode, MetaBAT2 is one proposal generator. Its partitions are not final MAGs yet; they become one candidate bin set for Binette.",
        artifacts: ["round_1/metabat2/bins_metabat2.MemberMatrix.txt", "round_1/metabat2/*.fa"]
      },
      {
        nodeId: "vamb_clustering",
        title: "VAMB latent vectors become one candidate bin set",
        detail:
          "The VAE node learns z_i; this clustering node represents the upstream VAMB step that turns those latent vectors into bins.",
        artifacts: ["round_1/vamb/vae_clusters_unsplit.tsv", "round_1/vamb/bins"]
      },
      {
        nodeId: "semibin2_clustering",
        title: "SemiBin2 DBSCAN ensemble becomes another candidate bin set",
        detail:
          "SemiBin2 learns a representation, then internally runs multiple DBSCAN clusterings over that same embedding and marker context.",
        artifacts: ["round_1/semibin/bins_info.tsv", "round_1/semibin/output_bins"]
      },
      {
        nodeId: "binette",
        title: "Binette reconciles default candidate sets",
        detail:
          "Binette receives MetaBAT2, VAMB, and SemiBin2 candidates, scores refined outputs with completeness - contamination * 5, and emits the candidate set evaluated by CheckM2.",
        artifacts: ["round_1/binette/final_bins_quality_reports.tsv", "round_1/binette/final_bins"]
      },
      {
        nodeId: "checkm_qc2",
        title: "Final CheckM gate writes accepted MAGs",
        detail:
          "All kept round bins and singleton MAGs are aggregated, then CheckM applies the final completeness, contamination, and score threshold before results/bins is copied.",
        artifacts: ["tmp/binning/checkm1.tsv", "tmp/binning/bins_keep.txt", "results/bins/*.fa"]
      }
    ]
  }),
  makeRun({
    id: "pb-fast-semibin",
    title: "Mock B: PacBio fast SemiBin2",
    shortLabel: "PB fast",
    summary:
      "PacBio HiFi reads assemble with metaMDBG, skip Medaka automatically, split domains with Whokaryote, and use fast mode where SemiBin2 is the direct candidate source for CheckM2.",
    mockCommand:
      "mmlong2 -pb mock_hifi.fastq.gz -o mockB -p 24 -dbg -who -bin fast",
    config: [
      { label: "mode", value: "PacBio-HiFi" },
      { label: "assembler", value: "metamdbg" },
      { label: "polishing", value: "Medaka forced FALSE" },
      { label: "domain split", value: "Whokaryote" },
      { label: "binmode", value: "fast" }
    ],
    activeEdgeIds: [
      "pacbio-reads-switch",
      "reads-wrapper",
      "wrapper-metamdbg",
      "metamdbg-selected",
      "selected-curation",
      "curation-filter-length",
      "filter-length-whokaryote",
      "whokaryote-domain-split",
      "filter-domain-eukaryote",
      "filter-domain-binning-prep",
      ...singletonEdges,
      ...sharedCoverageEdges,
      "binning-prep-semibin2",
      "semibin2-clustering",
      "semibin2-clustering-candidate-bins",
      "candidate-bins-router",
      ...sharedEvaluationEdges
    ],
    skippedNodeIds: ["nanopore_reads", "polishing", "assembly_metaflye", "assembly_myloasm", "assembly_custom", "domain_tiara", "metabat2", "vamb", "vamb_clustering", "binette", "comebin", "comebin_clustering"],
    focusNodeId: "semibin2_clustering",
    coverage: [
      "PacBio input switch",
      "metaMDBG",
      "Whokaryote",
      "SemiBin2 embedding and DBSCAN",
      "fast binmode direct CheckM2 routing"
    ],
    trace: [
      {
        nodeId: "pacbio_reads",
        title: "Primary input becomes PB mode",
        detail:
          "The wrapper sets mode to PacBio-HiFi and forces Medaka off. Coverage mapping uses the PacBio minimap2 preset and PB identity threshold.",
        artifacts: ["fastq = mock_hifi.fastq.gz", "mode = PacBio-HiFi", "mapping label = 1-PB"]
      },
      {
        nodeId: "assembly_metamdbg",
        title: "metaMDBG is the selected assembler",
        detail:
          "The -dbg switch selects the metaMDBG branch, whose contigs are normalized into the same selected-assembly contract as the other assemblers.",
        artifacts: ["tmp/assembly/contigs.fasta", "tmp/assembly/assembly_info.tsv"]
      },
      {
        nodeId: "domain_whokaryote",
        title: "Whokaryote replaces the default Tiara branch",
        detail:
          "The -who flag sets tiara_status to FALSE, so Whokaryote header lists are the only domain-classification source consumed by Filtering_eukaryotes.",
        artifacts: ["whokaryote/prokaryote_contig_headers.txt", "whokaryote/eukaryote_contig_headers.txt"]
      },
      {
        nodeId: "coverage_map",
        title: "PacBio reads become one BAM/depth pair",
        detail:
          "Coverage_prep creates the 1-PB symlink, then Coverage_map writes one sorted BAM and one JGI depth table.",
        artifacts: ["tmp/binning/mapping/1-PB.bam", "tmp/binning/mapping/1-PB.tsv"]
      },
      {
        nodeId: "semibin2",
        title: "SemiBin2 learns the long-read representation",
        detail:
          "Fast mode still uses the representation step. mmlong2 passes long_read, self-supervised, CPU engine, prodigal ORFs, and the configured seed.",
        artifacts: ["round_1/contigs.fasta", "round_1/semibin"]
      },
      {
        nodeId: "semibin2_clustering",
        title: "DBSCAN integration is the only fast-mode bin proposal",
        detail:
          "The DBSCAN ensemble is SemiBin2-internal. In fast mode, these bins skip Binette and feed CheckM2 through the binning-mode router.",
        artifacts: ["round_1/semibin/bins_info.tsv", "round_1/semibin/output_bins"]
      },
      {
        nodeId: "binmode_router",
        title: "fast mode selects SemiBin2 directly",
        detail:
          "get_qc_in() and get_qc_dir() choose round_1/semibin outputs when binmode is fast.",
        artifacts: ["round_1/semibin/bins_info.tsv", "round_1/semibin/output_bins"]
      }
    ]
  }),
  makeRun({
    id: "np-extended-myloasm-diffcov",
    title: "Mock C: Extended myloasm plus differential coverage",
    shortLabel: "NP extended",
    summary:
      "Nanopore reads assemble with myloasm, append mock PB and Illumina differential-coverage read sets, and run extended binning so COMEBin and later-round direct candidate routing become visible.",
    mockCommand:
      "mmlong2 -np mock_np.fastq.gz -o mockC -myl -cov mock_diffcov.csv -bin extended -p 40",
    config: [
      { label: "mode", value: "Nanopore-simplex" },
      { label: "assembler", value: "myloasm" },
      { label: "coverage CSV", value: "PB + IL rows" },
      { label: "domain split", value: "Tiara" },
      { label: "binmode", value: "extended" }
    ],
    activeEdgeIds: [
      "nanopore-reads-switch",
      "diffcov-wrapper",
      "reads-wrapper",
      "wrapper-myloasm",
      "myloasm-selected",
      "selected-curation",
      "curation-filter-length",
      "filter-length-tiara",
      "tiara-domain-split",
      "filter-domain-eukaryote",
      "filter-domain-binning-prep",
      ...singletonEdges,
      ...sharedCoverageEdges,
      "diffcov-coverage-prep",
      "binning-prep-metabat2",
      "binning-prep-vamb",
      "binning-prep-semibin2",
      "binning-prep-comebin",
      "metabat2-candidate-bins",
      "vamb-clustering",
      "vamb-clustering-candidate-bins",
      "semibin2-clustering",
      "semibin2-clustering-candidate-bins",
      "comebin-clustering",
      "comebin-clustering-candidate-bins",
      "candidate-bins-binette",
      "candidate-bins-router",
      "binette-router",
      ...sharedEvaluationEdges
    ],
    skippedNodeIds: ["pacbio_reads", "assembly_metaflye", "assembly_metamdbg", "assembly_custom", "domain_whokaryote"],
    focusNodeId: "comebin_clustering",
    coverage: [
      "myloasm",
      "differential coverage CSV",
      "extended binning rounds",
      "COMEBin embedding and Leiden clustering",
      "VAMB/SemiBin2/MetaBAT2 round reuse",
      "Binette and direct candidate routing"
    ],
    trace: [
      {
        nodeId: "diffcov",
        title: "Differential coverage rows expand the mapping manifest",
        detail:
          "The mock CSV adds PB and IL read sets after the primary NP row. Coverage_prep numbers them, and Coverage_map uses type-specific minimap2 presets and identity cutoffs.",
        artifacts: ["reads.csv rows: 1-NP, 2-PB, 3-IL", "mapping/1-NP.bam", "mapping/2-PB.bam", "mapping/3-IL.bam"]
      },
      {
        nodeId: "assembly_myloasm",
        title: "myloasm is the assembler branch",
        detail:
          "The -myl switch selects myloasm with mmlong2-configured minimum coverage, minimum overlap, bloom filter size, and optional extra arguments.",
        artifacts: ["tmp/assembly/assembly.fa", "tmp/assembly/assembly_info.tsv"]
      },
      {
        nodeId: "binning_prep",
        title: "Extended mode creates a round ladder",
        detail:
          "Round 1 starts with prokaryotic contigs minus accepted singletons. Later rounds subtract previously accepted bins, rewrite FASTA/coverage subsets, and subset BAMs for COMEBin.",
        artifacts: ["round_1/contigs.fasta", "round_2/contigs.fasta", "round_3/contigs.fasta", "round_4/contigs.fasta"]
      },
      {
        nodeId: "candidate_bins",
        title: "Round-specific candidate sources diverge",
        detail:
          "Extended mode evaluates Binette-refined candidates in rounds 1 and 3, COMEBin candidates directly in round 2, and MetaBAT2 candidates directly in round 4.",
        artifacts: ["R1/R3 Binette", "R2 COMEBin", "R4 MetaBAT2"]
      },
      {
        nodeId: "comebin",
        title: "COMEBin learns contrastive contig embeddings in round 2",
        detail:
          "mmlong2 prepares round_2/mapping BAMs and passes a batch-size ceiling of min(number_of_contigs, 1024) to run_comebin.sh.",
        artifacts: ["round_2/mapping/*.bam", "round_2/comebin"]
      },
      {
        nodeId: "comebin_clustering",
        title: "COMEBin Leiden clustering feeds CheckM2 directly",
        detail:
          "The embedding step is followed by COMEBin's graph construction and Leiden sweep. In extended round 2, the router sends COMEBin bins directly to CheckM2.",
        artifacts: ["round_2/comebin/comebin_res/comebin_res.tsv", "round_2/comebin/comebin_res/comebin_res_bins"]
      },
      {
        nodeId: "binmode_router",
        title: "Extended mode switches candidate source by round",
        detail:
          "The same CheckM2 rule receives different upstream directories depending on round: Binette, COMEBin, Binette, then MetaBAT2.",
        artifacts: ["get_qc_in(round, extended)", "get_qc_dir(round, extended)"]
      }
    ]
  }),
  makeRun({
    id: "custom-proc-databases",
    title: "Mock D: Custom assembly with proc databases",
    shortLabel: "Custom proc",
    summary:
      "A user supplies a custom assembly and database paths, skips assembly curation, then carries the resulting bins through taxonomy, annotation, extra QC, stats, and final dataframes.",
    mockCommand:
      "mmlong2 -pb mock_hifi.fastq.gz -ca mock_assembly.fa -cai mock_assembly_info.tsv -o mockD -scr -bin default -gtdb /db/gtdb -bkt /db/bakta -rrna /db/gg2.udb",
    config: [
      { label: "mode", value: "PacBio-HiFi" },
      { label: "assembler", value: "custom" },
      { label: "curation", value: "skipped" },
      { label: "databases", value: "user paths" },
      { label: "binmode", value: "default" }
    ],
    activeEdgeIds: [
      "pacbio-reads-switch",
      "reads-wrapper",
      "db-wrapper",
      "wrapper-custom",
      "custom-selected",
      "selected-filter-length",
      "filter-length-tiara",
      "tiara-domain-split",
      "filter-domain-eukaryote",
      "filter-domain-binning-prep",
      ...singletonEdges,
      ...sharedCoverageEdges,
      "binning-prep-metabat2",
      "binning-prep-vamb",
      "binning-prep-semibin2",
      "metabat2-candidate-bins",
      "vamb-clustering",
      "vamb-clustering-candidate-bins",
      "semibin2-clustering",
      "semibin2-clustering-candidate-bins",
      "candidate-bins-binette",
      "binette-router",
      ...sharedEvaluationEdges
    ],
    skippedNodeIds: ["nanopore_reads", "assembly_metaflye", "assembly_metamdbg", "assembly_myloasm", "polishing", "curation", "domain_whokaryote", "comebin", "comebin_clustering"],
    focusNodeId: "finalise_proc",
    coverage: [
      "Custom assembly import",
      "curation skip branch",
      "database inputs",
      "taxonomy",
      "annotation",
      "extra QC",
      "stats",
      "final dataframes"
    ],
    trace: [
      {
        nodeId: "assembly_custom",
        title: "Custom assembly enters the selected-assembly contract",
        detail:
          "The custom FASTA is header-normalized and paired with a provided assembly_info.tsv, so downstream filtering and singleton logic still receive the expected files.",
        artifacts: ["tmp/assembly/assembly_custom.fa", "tmp/assembly/assembly_info.tsv"]
      },
      {
        nodeId: "filter_length",
        title: "Skipping curation routes directly to filtering",
        detail:
          "Because this mock run uses -scr, the selected assembly bypasses curation and becomes the direct input to Filtering_length.",
        artifacts: ["tmp/filtering/asm_filt_len.fasta"]
      },
      {
        nodeId: "database_inputs",
        title: "Proc database paths are explicit inputs",
        detail:
          "GTDB, Bakta, rRNA, Metabuli, and GUNC paths are wrapper-level contracts that support downstream proc rules without changing MAG production.",
        artifacts: ["db_gtdb=/db/gtdb", "db_bakta=/db/bakta", "db_rrna=/db/gg2.udb"]
      },
      {
        nodeId: "taxonomy",
        title: "Accepted MAGs and assembly contigs get taxonomy",
        detail:
          "The proc workflow classifies bins with GTDB-Tk, contigs with Metabuli, and 16S sequences through the configured rRNA database.",
        artifacts: ["tmp/taxa/bins_taxonomy.tsv", "tmp/taxa/contigs_taxonomy.tsv", "results/mockD_16S.fa"]
      },
      {
        nodeId: "annotation",
        title: "MAG FASTAs are annotated after final QC",
        detail:
          "Only accepted MAG FASTAs from results/bins are annotated, while rRNA/tRNA summaries are aggregated into bin-level annotation tables.",
        artifacts: ["tmp/annotation/bins_annotation.tsv", "results/bakta/"]
      },
      {
        nodeId: "extraqc",
        title: "Extra QC checks accepted bins for chimerism and variation",
        detail:
          "The accepted bin list drives variant extraction and GUNC contamination scoring, then the proc finalizer merges those results.",
        artifacts: ["tmp/extra_qc/bins_extraqc.tsv", "tmp/extra_qc/contigs_extraqc.tsv"]
      },
      {
        nodeId: "finalise_proc",
        title: "Final dataframes merge production and proc tables",
        detail:
          "The finalizer joins general stats, contig tables, bin recovery/QC/taxonomy/annotation, dependencies, and database provenance.",
        artifacts: ["results/mockD_general.tsv", "results/mockD_contigs.tsv", "results/mockD_bins.tsv"]
      }
    ]
  }),
  makeRun({
    id: "smag-direct-recovery",
    title: "Mock E: Circular single-contig MAG direct recovery",
    shortLabel: "SMAG direct",
    summary:
      "A crafted assembly contains one circular high-quality contig. mmlong2 evaluates it as a singleton first, sends the accepted SMAG directly to MAG aggregation, and removes that contig from later binning rounds.",
    mockCommand:
      "mmlong2 -np mock_circular_np.fastq.gz -o mockE -fly -bin default -mcl 3000 -mlb 250000",
    config: [
      { label: "mode", value: "Nanopore-simplex" },
      { label: "assembler", value: "metaflye" },
      { label: "singleton type", value: "circular contig" },
      { label: "minimum circular completeness", value: "80" },
      { label: "direct path", value: "singletons -> MAG aggregation" }
    ],
    activeEdgeIds: [
      "nanopore-reads-switch",
      "reads-wrapper",
      "wrapper-metaflye",
      "metaflye-selected",
      "selected-curation",
      "curation-filter-length",
      "filter-length-tiara",
      "tiara-domain-split",
      "filter-domain-binning-prep",
      ...singletonEdges,
      ...sharedCoverageEdges,
      "binning-prep-metabat2",
      "binning-prep-vamb",
      "binning-prep-semibin2",
      "metabat2-candidate-bins",
      "vamb-clustering",
      "vamb-clustering-candidate-bins",
      "semibin2-clustering",
      "semibin2-clustering-candidate-bins",
      "candidate-bins-binette",
      "binette-router",
      ...sharedEvaluationEdges
    ],
    skippedNodeIds: ["pacbio_reads", "assembly_metamdbg", "assembly_myloasm", "assembly_custom", "domain_whokaryote", "comebin", "comebin_clustering"],
    focusNodeId: "singletons",
    coverage: [
      "Circular singleton candidate",
      "CheckM2 singleton selection",
      "direct singleton-to-MAG aggregation",
      "contig exclusion before iterative binning"
    ],
    trace: [
      {
        nodeId: "singleton_circular",
        title: "Circular assembly_info row becomes a singleton candidate",
        detail:
          "The mock assembly_info.tsv contains one contig above min_mag_len with circular flag Y, so Singletons_circ extracts it as a candidate FASTA.",
        artifacts: ["tmp/binning/singl/contig_c.tsv", "tmp/binning/singl/innit/mockE.bin.c.1.fa"]
      },
      {
        nodeId: "singletons",
        title: "CheckM2 accepts the single-contig genome",
        detail:
          "The candidate passes the circular thresholds: completeness >= 80 and contamination <= 10. It is copied to singl/bins and recorded in binned.txt.",
        artifacts: ["tmp/binning/singl/checkm2.tsv", "tmp/binning/singl/bins/mockE.bin.c.1.fa", "tmp/binning/singl/binned.txt"]
      },
      {
        nodeId: "binning_prep",
        title: "The accepted singleton is removed from binner input",
        detail:
          "Binning_prep subtracts the accepted singleton contig ID before writing round_1/contigs.txt, so ensemble methods only see the remaining prokaryotic contigs.",
        artifacts: ["round_1/contigs_w_singl.txt", "round_1/contigs_wo_singl.txt", "round_1/contigs.fasta"]
      },
      {
        nodeId: "mag_aggregate",
        title: "Singleton MAGs aggregate beside round bins",
        detail:
          "The direct edge from Singleton CheckM2 selection to MAG candidate aggregation represents the accepted SMAG entering tmp/binning/bins_innit with round bins.",
        artifacts: ["tmp/binning/bins_innit/mockE.bin.c.1.fa", "tmp/binning/checkm2.tsv"]
      }
    ]
  })
];
