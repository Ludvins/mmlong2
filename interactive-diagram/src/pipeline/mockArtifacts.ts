import type { NodeMockExample } from "./types";

const fastq = (label: string, path: string, read = "mock_read_0001"): NodeMockExample["inputs"][number] => ({
  label,
  type: "FASTQ",
  path,
  format: "4-line read records with identifier, sequence, plus line, and Phred qualities",
  preview: [
    `@${read} runid=MOCK sample=mockA`,
    "ACGTTGCAACGTTGCAACGTTGCAACGT",
    "+",
    "IIIIIIIIIIIIIIIIIIIIIIIIIIIIII"
  ]
});

const fasta = (label: string, path: string, contig = "mockA_ctg_0001"): NodeMockExample["outputs"][number] => ({
  label,
  type: "FASTA",
  path,
  format: "header line followed by wrapped sequence",
  preview: [
    `>${contig} length=124803 circular=N cov=38.4`,
    "ATGCGTACCGTTAGCTAGCTACGATCGATCGATCGTACGATCGA"
  ]
});

const tsv = (
  label: string,
  path: string,
  preview: string[],
  format = "tab-separated table with a header row"
): NodeMockExample["outputs"][number] => ({
  label,
  type: "TSV",
  path,
  format,
  preview
});

const directory = (
  label: string,
  path: string,
  preview: string[],
  type = "directory"
): NodeMockExample["outputs"][number] => ({
  label,
  type,
  path,
  format: "folder containing tool-specific outputs",
  preview
});

export const mockNodeExamples: Record<string, NodeMockExample> = {
  nanopore_reads: {
    nodeId: "nanopore_reads",
    inputs: [fastq("User Nanopore reads", "mock_inputs/mock_np.fastq.gz", "np_read_0001")],
    outputs: [
      tsv("Wrapper read-mode assignment", "config override", [
        "fastq=/abs/mock_inputs/mock_np.fastq.gz",
        "mode=Nanopore-simplex",
        "primary_read_type=NP"
      ], "key/value config override")
    ]
  },
  pacbio_reads: {
    nodeId: "pacbio_reads",
    inputs: [fastq("User PacBio HiFi reads", "mock_inputs/mock_hifi.fastq.gz", "hifi_read_0001")],
    outputs: [
      tsv("Wrapper read-mode assignment", "config override", [
        "fastq=/abs/mock_inputs/mock_hifi.fastq.gz",
        "mode=PacBio-HiFi",
        "medaka_status=FALSE"
      ], "key/value config override")
    ]
  },
  reads: {
    nodeId: "reads",
    inputs: [
      tsv("CLI branch choice", "argv", [
        "flag,value",
        "--nanopore_reads,mock_np.fastq.gz"
      ], "parsed command-line option")
    ],
    outputs: [
      tsv("Single active read contract", "config override", [
        "fastq=/abs/mock_inputs/mock_np.fastq.gz",
        "mode=Nanopore-simplex"
      ], "key/value config override")
    ]
  },
  diffcov: {
    nodeId: "diffcov",
    inputs: [
      tsv("Differential coverage CSV", "mock_inputs/diffcov.csv", [
        "PB,/abs/mock_inputs/mock_hifi.fastq.gz",
        "IL,/abs/mock_inputs/mock_short_R1.fastq.gz"
      ], "comma-separated rows: read_type,path")
    ],
    outputs: [
      tsv("Numbered read labels", "tmp/binning/mapping/reads.csv", [
        "type,path",
        "NP,/abs/mock_inputs/mock_np.fastq.gz",
        "PB,/abs/mock_inputs/mock_hifi.fastq.gz",
        "IL,/abs/mock_inputs/mock_short_R1.fastq.gz"
      ])
    ]
  },
  database_inputs: {
    nodeId: "database_inputs",
    inputs: [
      tsv("Database CLI paths", "config override", [
        "db_gtdb=/db/gtdbtk/release226",
        "db_bakta=/db/bakta",
        "db_rrna=/db/greengenes2.udb"
      ], "key/value config override")
    ],
    outputs: [
      tsv("Database provenance table", "results/databases.csv", [
        "database,path,status",
        "gtdb,/db/gtdbtk/release226,user-provided",
        "bakta,/db/bakta,user-provided"
      ], "CSV database provenance")
    ]
  },
  wrapper: {
    nodeId: "wrapper",
    inputs: [
      tsv("Parsed wrapper settings", "argv + config defaults", [
        "sample=mockA",
        "proc=32",
        "binmode=default",
        "assembler=metaflye"
      ], "merged command-line and YAML values")
    ],
    outputs: [
      tsv("Snakemake config injection", "snakemake --config ...", [
        "sample=mockA loc=/work/mmlong2_out fastq=/abs/mock_np.fastq.gz",
        "mode=Nanopore-simplex binmode=default apptainer_status=TRUE"
      ], "runtime config override string")
    ]
  },
  assembly_metaflye: {
    nodeId: "assembly_metaflye",
    inputs: [fastq("Primary Nanopore reads", "mock_inputs/mock_np.fastq.gz")],
    outputs: [
      fasta("metaFlye assembly", "tmp/assembly/assembly.fasta"),
      tsv("metaFlye assembly info", "tmp/assembly/assembly_info.tsv", [
        "seq_name\tlength\tcov.\tcirc.",
        "mockA_ctg_0001\t124803\t38\tN",
        "mockA_ctg_0002\t3015520\t44\tY"
      ])
    ]
  },
  assembly_metamdbg: {
    nodeId: "assembly_metamdbg",
    inputs: [fastq("Primary PacBio HiFi reads", "mock_inputs/mock_hifi.fastq.gz")],
    outputs: [
      fasta("metaMDBG contigs", "tmp/assembly/contigs.fasta", "mockB_ctg_0001"),
      tsv("synthetic assembly info", "tmp/assembly/assembly_info.tsv", [
        "seq_name\tlength\tcov.\tcirc.",
        "mockB_ctg_0001\t982114\t52\tN"
      ])
    ]
  },
  assembly_myloasm: {
    nodeId: "assembly_myloasm",
    inputs: [fastq("Primary Nanopore reads", "mock_inputs/mock_np.fastq.gz")],
    outputs: [
      fasta("myloasm assembly", "tmp/assembly/assembly.fa", "mockC_ctg_0001"),
      tsv("myloasm assembly info", "tmp/assembly/assembly_info.tsv", [
        "seq_name\tlength\tcov.\tcirc.",
        "mockC_ctg_0001\t220045\t27\tN"
      ])
    ]
  },
  assembly_custom: {
    nodeId: "assembly_custom",
    inputs: [fasta("User custom assembly", "mock_inputs/mock_assembly.fa", "user_ctg_01")],
    outputs: [
      fasta("Header-normalized custom assembly", "tmp/assembly/assembly_custom.fa", "mockD_user_ctg_01"),
      tsv("Custom assembly info", "tmp/assembly/assembly_info.tsv", [
        "seq_name\tlength\tcov.\tcirc.",
        "mockD_user_ctg_01\t1400021\tNA\tN"
      ])
    ]
  },
  assembly_selected: {
    nodeId: "assembly_selected",
    inputs: [fasta("One chosen assembly branch", "tmp/assembly/assembly.fasta")],
    outputs: [
      tsv("Selected assembly pointer", "internal selected path", [
        "assembly_fasta=tmp/assembly/assembly.fasta",
        "assembly_info=tmp/assembly/assembly_info.tsv",
        "source=metaflye"
      ], "routing state consumed by downstream rules")
    ]
  },
  polishing: {
    nodeId: "polishing",
    inputs: [
      fasta("Unpolished Nanopore contigs", "tmp/assembly/assembly.fasta"),
      fastq("Primary Nanopore reads", "mock_inputs/mock_np.fastq.gz")
    ],
    outputs: [fasta("Medaka polished assembly", "tmp/polishing/asm_pol.fasta", "mockA_ctg_0001_polished")]
  },
  curation: {
    nodeId: "curation",
    inputs: [
      fasta("Assembly for curation", "tmp/polishing/asm_pol.fasta"),
      tsv("assembly_info", "tmp/assembly/assembly_info.tsv", [
        "seq_name\tlength\tcov.\tcirc.",
        "mockA_ctg_0001\t124803\t38\tN"
      ])
    ],
    outputs: [
      fasta("Curated assembly", "tmp/curation/asm_curated.fasta", "mockA_ctg_0001_curated"),
      tsv("Curation decisions", "tmp/curation/curation.tsv", [
        "contig\tdecision\treason",
        "mockA_ctg_0001\tkeep\tcoverage_ok",
        "mockA_ctg_0007\tclip\tlow_coverage_tail"
      ])
    ]
  },
  filter_length: {
    nodeId: "filter_length",
    inputs: [fasta("Selected assembly", "tmp/curation/asm_curated.fasta")],
    outputs: [
      fasta("Length-filtered assembly", "tmp/filtering/asm_filt_len.fasta", "mockA_mockA_ctg_0001"),
      tsv("Filtered contig lengths", "tmp/filtering/lengths.tsv", [
        "contig\tlength\tkept",
        "mockA_ctg_0001\t124803\tTRUE",
        "mockA_ctg_0008\t2110\tFALSE"
      ])
    ]
  },
  domain_tiara: {
    nodeId: "domain_tiara",
    inputs: [fasta("Length-filtered assembly", "tmp/filtering/asm_filt_len.fasta")],
    outputs: [
      tsv("Tiara classification table", "tmp/filtering/tiara.tsv", [
        "contig\tclass\tprobability",
        "mockA_ctg_0001\tbacteria\t0.94",
        "mockA_ctg_0009\teukarya\t0.88"
      ]),
      tsv("Prokaryote header list", "tmp/filtering/contigs_filt_prok.txt", [
        "mockA_ctg_0001",
        "mockA_ctg_0002"
      ], "one contig ID per line")
    ]
  },
  domain_whokaryote: {
    nodeId: "domain_whokaryote",
    inputs: [fasta("Length-filtered assembly", "tmp/filtering/asm_filt_len.fasta")],
    outputs: [
      tsv("Whokaryote prokaryote headers", "tmp/filtering/whokaryote/prokaryote_contig_headers.txt", [
        "mockB_ctg_0001",
        "mockB_ctg_0004"
      ], "one contig ID per line"),
      tsv("Whokaryote eukaryote headers", "tmp/filtering/whokaryote/eukaryote_contig_headers.txt", [
        "mockB_ctg_0008"
      ], "one contig ID per line")
    ]
  },
  filter_domain: {
    nodeId: "filter_domain",
    inputs: [
      fasta("Length-filtered assembly", "tmp/filtering/asm_filt_len.fasta"),
      tsv("Selected prokaryote headers", "tmp/filtering/contigs_filt_prok.txt", ["mockA_ctg_0001"])
    ],
    outputs: [
      fasta("Prokaryotic assembly", "tmp/filtering/asm_filt_prok.fasta", "mockA_ctg_0001"),
      fasta("Eukaryotic or ambiguous side output", "tmp/filtering/asm_filt_euk.fasta", "mockA_ctg_0009")
    ]
  },
  eukaryote_contigs: {
    nodeId: "eukaryote_contigs",
    inputs: [fasta("Eukaryotic or ambiguous FASTA", "tmp/filtering/asm_filt_euk.fasta", "mockA_ctg_0009")],
    outputs: [
      directory("Inspectable side-output artifact", "tmp/filtering", [
        "asm_filt_euk.fasta",
        "contigs_filt_euk.txt"
      ], "side-output files")
    ]
  },
  singleton_circular: {
    nodeId: "singleton_circular",
    inputs: [
      fasta("Filtered assembly", "tmp/filtering/asm_filt_len.fasta"),
      tsv("assembly_info", "tmp/filtering/assembly_info.tsv", [
        "seq_name\tlength\tcov.\tcirc.",
        "mockE_ctg_circ\t3015520\t44\tY"
      ])
    ],
    outputs: [
      tsv("Circular candidate map", "tmp/binning/singl/contig_c.tsv", [
        "mockE_ctg_circ\tmockE.bin.c.1"
      ], "two columns: contig ID and candidate bin ID"),
      fasta("Circular singleton FASTA", "tmp/binning/singl/innit/mockE.bin.c.1.fa", "mockE_ctg_circ")
    ]
  },
  singleton_linear: {
    nodeId: "singleton_linear",
    inputs: [
      fasta("Filtered assembly", "tmp/filtering/asm_filt_len.fasta"),
      tsv("Circular candidate map", "tmp/binning/singl/contig_c.tsv", [""])
    ],
    outputs: [
      tsv("Linear or fallback candidate map", "tmp/binning/singl/contig_l.tsv", [
        "mockA_ctg_large\tmockA.bin.s.1"
      ], "two columns: contig ID and candidate bin ID"),
      fasta("Linear singleton FASTA", "tmp/binning/singl/innit/mockA.bin.s.1.fa", "mockA_ctg_large")
    ]
  },
  singletons: {
    nodeId: "singletons",
    inputs: [directory("Candidate singleton FASTAs", "tmp/binning/singl/innit", ["mockE.bin.c.1.fa"])],
    outputs: [
      tsv("Singleton CheckM2 report", "tmp/binning/singl/checkm2.tsv", [
        "Name\tCompleteness\tContamination",
        "mockE.bin.c.1\t94.1\t1.8"
      ]),
      tsv("Accepted singleton contigs", "tmp/binning/singl/binned.txt", [
        "mockE_ctg_circ"
      ], "one accepted contig ID per line")
    ]
  },
  coverage_prep: {
    nodeId: "coverage_prep",
    inputs: [
      fastq("Primary reads", "mock_inputs/mock_np.fastq.gz"),
      tsv("Optional differential coverage CSV", "mock_inputs/diffcov.csv", ["PB,/abs/mock_hifi.fastq.gz"])
    ],
    outputs: [
      tsv("Read manifest", "tmp/binning/mapping/reads.csv", [
        "type,path",
        "NP,/abs/mock_np.fastq.gz",
        "PB,/abs/mock_hifi.fastq.gz"
      ]),
      directory("Numbered read symlinks", "tmp/binning/mapping", ["1-NP.lnk -> /abs/mock_np.fastq.gz", "2-PB.lnk -> /abs/mock_hifi.fastq.gz"], "symlink set")
    ]
  },
  coverage_map: {
    nodeId: "coverage_map",
    inputs: [
      fasta("Mapping reference", "tmp/filtering/asm_filt_len.fasta"),
      fastq("Read symlink target", "tmp/binning/mapping/1-NP.lnk")
    ],
    outputs: [
      tsv("Contig depth table", "tmp/binning/mapping/1-NP.tsv", [
        "contigName\tcontigLen\ttotalAvgDepth\t1-NP.bam",
        "mockA_ctg_0001\t124803\t38.4\t38.4"
      ]),
      tsv("BAM placeholder", "tmp/binning/mapping/1-NP.bam", [
        "@SQ\tSN:mockA_ctg_0001\tLN:124803",
        "np_read_0001\t0\tmockA_ctg_0001\t101\t60\t30M"
      ], "binary BAM in real runs; SAM-like mock preview here")
    ]
  },
  coverage_aggregate: {
    nodeId: "coverage_aggregate",
    inputs: [tsv("Per-read depth tables", "tmp/binning/mapping/*_tr1.tsv", ["mockA_ctg_0001\t124803\t38.4"])],
    outputs: [
      tsv("Full coverage matrix", "tmp/binning/mapping/cov_all.tsv", [
        "contigName\tcontigLen\ttotalAvgDepth\t1-NP\t2-PB",
        "mockA_ctg_0001\t124803\t38.4\t38.4\t21.2"
      ]),
      tsv("Reduced VAMB coverage matrix", "tmp/binning/mapping/cov_all_sub.tsv", [
        "contigName\t1-NP\t2-PB",
        "mockA_ctg_0001\t38.4\t21.2"
      ])
    ]
  },
  binning_prep: {
    nodeId: "binning_prep",
    inputs: [
      fasta("Prokaryotic assembly", "tmp/filtering/asm_filt_prok.fasta"),
      tsv("Accepted singleton IDs", "tmp/binning/singl/binned.txt", ["mockE_ctg_circ"])
    ],
    outputs: [
      fasta("Round FASTA", "tmp/binning/round_1/contigs.fasta", "mockA_ctg_0001"),
      tsv("Round coverage matrix", "tmp/binning/round_1/cov.tsv", [
        "contigName\tcontigLen\ttotalAvgDepth\t1-NP",
        "mockA_ctg_0001\t124803\t38.4\t38.4"
      ])
    ]
  },
  metabat2: {
    nodeId: "metabat2",
    inputs: [
      fasta("Round contigs", "tmp/binning/round_1/contigs.fasta"),
      tsv("MetaBAT2 coverage matrix", "tmp/binning/round_1/cov.tsv", ["contigName\tcontigLen\ttotalAvgDepth\t1-NP"])
    ],
    outputs: [
      tsv("MetaBAT2 membership matrix", "tmp/binning/round_1/metabat2/bins_metabat2.MemberMatrix.txt", [
        "contigName\tbin.1\tbin.2",
        "mockA_ctg_0001\t1\t0",
        "mockA_ctg_0004\t0\t1"
      ]),
      fasta("MetaBAT2 bin FASTA", "tmp/binning/round_1/metabat2/bin.1.fa", "mockA_ctg_0001")
    ]
  },
  vamb: {
    nodeId: "vamb",
    inputs: [
      fasta("Round contigs", "tmp/binning/round_1/contigs.fasta"),
      tsv("Reduced abundance table", "tmp/binning/round_1/cov_sub.tsv", ["contigName\t1-NP\t2-PB"])
    ],
    outputs: [
      tsv("Latent representation mock", "tmp/binning/round_1/vamb/latent.tsv", [
        "contig\tz1\tz2\tz3",
        "mockA_ctg_0001\t-0.42\t1.18\t0.07",
        "mockA_ctg_0004\t-0.39\t1.09\t0.11"
      ], "conceptual preview; VAMB internal representation is upstream-managed")
    ]
  },
  vamb_clustering: {
    nodeId: "vamb_clustering",
    inputs: [tsv("VAMB latent vectors", "internal VAMB latent space", ["mockA_ctg_0001\t-0.42\t1.18\t0.07"])],
    outputs: [
      tsv("VAMB cluster table", "tmp/binning/round_1/vamb/vae_clusters_unsplit.tsv", [
        "cluster\tcontig",
        "vamb_1\tmockA_ctg_0001",
        "vamb_1\tmockA_ctg_0004"
      ]),
      fasta("VAMB bin FASTA", "tmp/binning/round_1/vamb/bins/vamb_1.fna", "mockA_ctg_0001")
    ]
  },
  semibin2: {
    nodeId: "semibin2",
    inputs: [
      fasta("Round contigs", "tmp/binning/round_1/contigs.fasta"),
      tsv("Mapped BAM set", "tmp/binning/mapping/*.bam", ["1-NP.bam", "2-PB.bam"], "BAM files; names shown as mock preview")
    ],
    outputs: [
      tsv("SemiBin2 embedding mock", "tmp/binning/round_1/semibin/embedding.tsv", [
        "contig\te1\te2\te3",
        "mockA_ctg_0001\t0.23\t-1.14\t0.88",
        "mockA_ctg_0004\t0.26\t-1.08\t0.81"
      ], "conceptual preview of learned representation")
    ]
  },
  semibin2_clustering: {
    nodeId: "semibin2_clustering",
    inputs: [tsv("SemiBin2 embeddings", "internal SemiBin2 representation", ["mockA_ctg_0001\t0.23\t-1.14\t0.88"])],
    outputs: [
      tsv("SemiBin2 bin info", "tmp/binning/round_1/semibin/bins_info.tsv", [
        "bin\tcontigs\tlength",
        "SemiBin_1\t2\t411203"
      ]),
      fasta("SemiBin2 output bin", "tmp/binning/round_1/semibin/output_bins/SemiBin_1.fa", "mockA_ctg_0001")
    ]
  },
  comebin: {
    nodeId: "comebin",
    inputs: [
      fasta("Round 2 contigs", "tmp/binning/round_2/contigs.fasta", "mockC_ctg_0201"),
      directory("Round 2 BAM subset", "tmp/binning/round_2/mapping", ["1-NP.bam", "2-PB.bam", "3-IL.bam"], "BAM directory")
    ],
    outputs: [
      tsv("COMEBin embedding mock", "tmp/binning/round_2/comebin/embeddings.tsv", [
        "contig\tview_mean_1\tview_mean_2",
        "mockC_ctg_0201\t0.51\t-0.33"
      ], "conceptual preview of multi-view embedding")
    ]
  },
  comebin_clustering: {
    nodeId: "comebin_clustering",
    inputs: [tsv("COMEBin embeddings", "internal COMEBin embedding graph", ["mockC_ctg_0201\t0.51\t-0.33"])],
    outputs: [
      tsv("COMEBin result table", "tmp/binning/round_2/comebin/comebin_res/comebin_res.tsv", [
        "contig\tbin",
        "mockC_ctg_0201\tcomebin_1",
        "mockC_ctg_0202\tcomebin_1"
      ]),
      fasta("COMEBin result bin", "tmp/binning/round_2/comebin/comebin_res/comebin_res_bins/comebin_1.fa", "mockC_ctg_0201")
    ]
  },
  candidate_bins: {
    nodeId: "candidate_bins",
    inputs: [
      directory("Tool-specific bin directories", "tmp/binning/round_1", ["metabat2/*.fa", "vamb/bins/*.fna", "semibin/output_bins/*.fa"])
    ],
    outputs: [
      tsv("Candidate source inventory", "curated diagram concept", [
        "source\tpath\tcandidate_count",
        "metabat2\tround_1/metabat2\t12",
        "vamb\tround_1/vamb/bins\t10",
        "semibin2\tround_1/semibin/output_bins\t9"
      ])
    ]
  },
  binette: {
    nodeId: "binette",
    inputs: [
      directory("Default candidate inputs", "round_1", ["vamb/bins", "metabat2", "semibin/output_bins"])
    ],
    outputs: [
      tsv("Binette quality report", "tmp/binning/round_1/binette/final_bins_quality_reports.tsv", [
        "bin\tcompleteness\tcontamination\tscore",
        "binette_1\t92.4\t1.9\t82.9"
      ]),
      fasta("Binette refined bin", "tmp/binning/round_1/binette/final_bins/binette_1.fa", "mockA_ctg_0001")
    ]
  },
  binmode_router: {
    nodeId: "binmode_router",
    inputs: [
      tsv("Candidate reports by mode", "helper return values", [
        "fast\tround_1/semibin/bins_info.tsv",
        "default\tround_1/binette/final_bins_quality_reports.tsv",
        "extended_round_2\tround_2/comebin/comebin_res/comebin_res.tsv"
      ])
    ],
    outputs: [
      tsv("Selected CheckM2 source", "internal routing state", [
        "round\treport\tdirectory",
        "1\tround_1/binette/final_bins_quality_reports.tsv\tround_1/binette/final_bins"
      ])
    ]
  },
  binning_qc: {
    nodeId: "binning_qc",
    inputs: [directory("Selected candidate FASTAs", "tmp/binning/round_1/binette/final_bins", ["binette_1.fa"])],
    outputs: [
      tsv("Round CheckM2 report", "tmp/binning/round_1/checkm2.tsv", [
        "Name\tCompleteness\tContamination",
        "mockA.bin.1.1\t92.4\t1.9"
      ]),
      tsv("Round kept bins", "tmp/binning/round_1/bins_keep.txt", ["mockA.bin.1.1"], "one accepted bin ID per line")
    ]
  },
  mag_aggregate: {
    nodeId: "mag_aggregate",
    inputs: [
      directory("Accepted round and singleton bins", "tmp/binning", ["singl/bins/*.fa", "round_1/bins/*.fa"])
    ],
    outputs: [
      directory("Initial final-bin pool", "tmp/binning/bins_innit", ["mockE.bin.c.1.fa", "mockA.bin.1.1.fa"]),
      tsv("Aggregated CheckM2 table", "tmp/binning/checkm2.tsv", [
        "Name\tCompleteness\tContamination",
        "mockE.bin.c.1\t94.1\t1.8",
        "mockA.bin.1.1\t92.4\t1.9"
      ])
    ]
  },
  checkm_qc2: {
    nodeId: "checkm_qc2",
    inputs: [directory("Initial final-bin pool", "tmp/binning/bins_innit", ["mockA.bin.1.1.fa"])],
    outputs: [
      tsv("CheckM lineage table", "tmp/binning/checkm1.tsv", [
        "Bin Id\tCompleteness\tContamination\tStrain heterogeneity",
        "mockA.bin.1.1\t91.0\t2.0\t0.0"
      ]),
      directory("Final accepted MAGs", "results/bins", ["mockA.bin.1.1.fa"])
    ]
  },
  summary_lite: {
    nodeId: "summary_lite",
    inputs: [
      directory("Final accepted MAGs", "results/bins", ["mockA.bin.1.1.fa"]),
      tsv("CheckM and coverage tables", "tmp/binning", ["checkm1.tsv", "checkm2.tsv", "bin_cov.tsv"])
    ],
    outputs: [
      tsv("Lite bins summary", "results/mockA_bins.tsv", [
        "bin\tcompleteness_checkm2\tcontamination_checkm2\tmean_coverage",
        "mockA.bin.1.1\t92.4\t1.9\t31.7"
      ]),
      tsv("Contig to bin map", "tmp/binning/contig_bin.tsv", [
        "mockA_ctg_0001\tmockA.bin.1.1"
      ], "two-column TSV without header")
    ]
  },
  taxonomy: {
    nodeId: "taxonomy",
    inputs: [
      directory("Final accepted MAGs", "results/bins", ["mockA.bin.1.1.fa"]),
      fasta("Final assembly", "results/mockA_assembly.fasta", "mockA_ctg_0001")
    ],
    outputs: [
      tsv("MAG taxonomy", "tmp/taxa/bins_taxonomy.tsv", [
        "bin\tgtdb_taxonomy",
        "mockA.bin.1.1\td__Bacteria;p__Bacillota;c__Clostridia"
      ]),
      fasta("Recovered 16S sequences", "results/mockA_16S.fa", "mockA_16S_0001")
    ]
  },
  annotation: {
    nodeId: "annotation",
    inputs: [directory("Final accepted MAGs", "results/bins", ["mockA.bin.1.1.fa"])],
    outputs: [
      tsv("Bin annotation summary", "tmp/annotation/bins_annotation.tsv", [
        "bin\tcds\trrna\ttrna",
        "mockA.bin.1.1\t2341\t3\t46"
      ]),
      directory("Bakta output folder", "results/bakta/mockA.bin.1.1", ["mockA.bin.1.1.tsv", "mockA.bin.1.1.gff3"])
    ]
  },
  extraqc: {
    nodeId: "extraqc",
    inputs: [
      directory("Final accepted MAGs", "results/bins", ["mockA.bin.1.1.fa"]),
      tsv("Primary mapping BAM", "tmp/binning/mapping/1-NP.bam", ["binary BAM; mock preview omitted"])
    ],
    outputs: [
      tsv("Extra QC bin table", "tmp/extra_qc/bins_extraqc.tsv", [
        "bin\tgunc_css\tvariants_per_kbp",
        "mockA.bin.1.1\t0.01\t0.42"
      ]),
      tsv("Extra QC contig table", "tmp/extra_qc/contigs_extraqc.tsv", [
        "contig\tbin\tvariant_count",
        "mockA_ctg_0001\tmockA.bin.1.1\t21"
      ])
    ]
  },
  stats: {
    nodeId: "stats",
    inputs: [
      fastq("Primary reads", "mock_inputs/mock_np.fastq.gz"),
      fasta("Final assembly", "results/mockA_assembly.fasta", "mockA_ctg_0001")
    ],
    outputs: [
      tsv("General stats", "tmp/stats/gen_stats.tsv", [
        "metric\tvalue",
        "read_count\t150000",
        "assembly_bp\t48122031"
      ]),
      tsv("Contig stats", "tmp/stats/contigs_stats.tsv", [
        "contig\tlength\tgc",
        "mockA_ctg_0001\t124803\t0.47"
      ])
    ]
  },
  finalise_proc: {
    nodeId: "finalise_proc",
    inputs: [
      tsv("Lite bins table", "results/mockA_bins.tsv", ["bin\tcompleteness_checkm2\tcontamination_checkm2"]),
      tsv("Proc annotation and taxonomy tables", "tmp", ["bins_taxonomy.tsv", "bins_annotation.tsv"])
    ],
    outputs: [
      tsv("Final bin dataframe", "results/mockA_bins.tsv", [
        "bin\tbin_status\tgtdb_taxonomy\tcds\tcompleteness_checkm2",
        "mockA.bin.1.1\tHQ\td__Bacteria;p__Bacillota\t2341\t92.4"
      ]),
      tsv("Final contig dataframe", "results/mockA_contigs.tsv", [
        "contig\tbin\tlength\tgc\ttaxonomy",
        "mockA_ctg_0001\tmockA.bin.1.1\t124803\t0.47\td__Bacteria"
      ]),
      tsv("Final general dataframe", "results/mockA_general.tsv", [
        "sample\tmode\tbinning_mode\tmmlong2_version",
        "mockA\tNanopore-simplex\tdefault\t1.2.1"
      ])
    ]
  }
};
