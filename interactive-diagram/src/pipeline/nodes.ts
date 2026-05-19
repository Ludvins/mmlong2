import type { PipelineCitation, PipelineNode } from "./types";

const wrapperSource: PipelineCitation = {
  label: "mmlong2 wrapper",
  localPath: "../src/mmlong2"
};

const liteSource: PipelineCitation = {
  label: "mmlong2-lite Snakefile",
  localPath: "../src/mmlong2-lite.smk"
};

const procSource: PipelineCitation = {
  label: "mmlong2-proc Snakefile",
  localPath: "../src/mmlong2-proc.smk"
};

const liteConfig: PipelineCitation = {
  label: "mmlong2-lite config",
  localPath: "../src/mmlong2-lite-config.yaml"
};

const procConfig: PipelineCitation = {
  label: "mmlong2-proc config",
  localPath: "../src/mmlong2-proc-config.yaml"
};

const reactFlowCitation: PipelineCitation = {
  label: "React Flow docs",
  url: "https://reactflow.dev/learn/getting-started/installation-and-requirements"
};

const mdxCitation: PipelineCitation = {
  label: "MDX Rollup/Vite docs",
  url: "https://mdxjs.com/packages/rollup/"
};

const vambDocs: PipelineCitation = {
  label: "VAMB docs",
  url: "https://vamb.readthedocs.io/en/latest/"
};

const vambPaper: PipelineCitation = {
  label: "VAMB paper",
  url: "https://www.nature.com/articles/s41587-020-00777-4"
};

const semibinDocs: PipelineCitation = {
  label: "SemiBin2 docs",
  url: "https://semibin.readthedocs.io/en/v2.0.0/semibin2/"
};

const semibinPaper: PipelineCitation = {
  label: "SemiBin2 paper",
  url: "https://academic.oup.com/bioinformatics/article/39/Supplement_1/i21/7210480"
};

const comebinPaper: PipelineCitation = {
  label: "COMEBin paper",
  url: "https://www.nature.com/articles/s41467-023-44290-z"
};

const binetteDocs: PipelineCitation = {
  label: "Binette docs",
  url: "https://binette.readthedocs.io/en/main/usage.html"
};

const metabatPaper: PipelineCitation = {
  label: "MetaBAT2 paper",
  url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6662567/"
};

export const methodCitations = {
  reactFlowCitation,
  mdxCitation,
  vambDocs,
  vambPaper,
  semibinDocs,
  semibinPaper,
  comebinPaper,
  binetteDocs,
  metabatPaper
};

export const pipelineNodes: PipelineNode[] = [
  {
    id: "nanopore_reads",
    workflow: "wrapper",
    stage: "Inputs",
    label: "Nanopore FASTQ option",
    kind: "input",
    rules: [],
    command: "mmlong2 --nanopore_reads reads.fastq[.gz]",
    inputs: ["User-provided Nanopore long-read FASTQ"],
    outputs: ["fastq path", "mode = Nanopore-simplex", "primary read type = NP"],
    configKeys: ["fastq", "mode"],
    parameters: [
      { name: "CLI flag", value: "--nanopore_reads / -np", source: "mmlong2" },
      { name: "primary type", value: "NP", source: "mmlong2" }
    ],
    detailsMdx: "inputs.mdx",
    citations: [wrapperSource, liteConfig]
  },
  {
    id: "pacbio_reads",
    workflow: "wrapper",
    stage: "Inputs",
    label: "PacBio HiFi FASTQ option",
    kind: "input",
    rules: [],
    command: "mmlong2 --pacbio_reads reads.fastq[.gz]",
    inputs: ["User-provided PacBio HiFi FASTQ"],
    outputs: ["fastq path", "mode = PacBio-HiFi", "primary read type = PB"],
    configKeys: ["fastq", "mode"],
    parameters: [
      { name: "CLI flag", value: "--pacbio_reads / -pb", source: "mmlong2" },
      { name: "primary type", value: "PB", source: "mmlong2" },
      { name: "Medaka", value: "forced off for PacBio-HiFi", source: "mmlong2" }
    ],
    detailsMdx: "inputs.mdx",
    citations: [wrapperSource, liteConfig]
  },
  {
    id: "reads",
    workflow: "wrapper",
    stage: "Inputs",
    label: "Primary read-mode switch",
    kind: "decision",
    rules: [],
    command: "case \"$flag\" in --nanopore_reads) mode=Nanopore-simplex ;; --pacbio_reads) mode=PacBio-HiFi ;; esac",
    inputs: ["Nanopore FASTQ via --nanopore_reads", "PacBio HiFi FASTQ via --pacbio_reads"],
    outputs: ["One active absolute FASTQ path", "Read mode: Nanopore-simplex or PacBio-HiFi"],
    configKeys: ["fastq", "mode"],
    parameters: [
      { name: "required primary input", value: "fastq must not be none", source: "mmlong2" },
      { name: "mode", value: "Nanopore-simplex or PacBio-HiFi", source: "mmlong2" },
      { name: "parser behavior", value: "stores one fastq/mode assignment for the run", source: "mmlong2" }
    ],
    detailsMdx: "inputs.mdx",
    citations: [wrapperSource, liteConfig]
  },
  {
    id: "diffcov",
    workflow: "wrapper",
    stage: "Inputs",
    label: "Differential coverage reads",
    kind: "input",
    rules: [],
    inputs: ["Optional CSV rows: PB|NP|IL,/path/to/reads.fastq"],
    outputs: ["read index labels such as 1-NP, 2-PB, 3-IL", "extra Singularity bind paths"],
    configKeys: ["reads_diffcov", "minimap_np", "minimap_pb", "minimap_il"],
    parameters: [
      { name: "reads_diffcov", value: "none by default", source: "mmlong2" },
      { name: "supported types", value: "NP, PB, IL", source: "mmlong2" }
    ],
    detailsMdx: "inputs.mdx",
    citations: [wrapperSource, liteSource, liteConfig]
  },
  {
    id: "database_inputs",
    workflow: "wrapper",
    stage: "Inputs",
    label: "Analysis databases",
    kind: "input",
    rules: [],
    command: "mmlong2 --install_databases",
    inputs: ["GTDB", "Bakta", "Greengenes2 16S rRNA", "Metabuli", "GUNC"],
    outputs: ["Configured database paths in mmlong2-proc-config.yaml", "results/databases.csv"],
    configKeys: ["db_gtdb", "db_bakta", "db_rrna", "db_metabuli", "db_gunc"],
    parameters: [
      { name: "db_barrnap", value: "arc", source: "mmlong2" },
      { name: "db_trnascan", value: "A", source: "mmlong2" }
    ],
    detailsMdx: "inputs.mdx",
    citations: [wrapperSource, procConfig]
  },
  {
    id: "wrapper",
    workflow: "wrapper",
    stage: "Wrapper",
    label: "CLI wrapper and runtime setup",
    kind: "rule",
    rules: ["src/mmlong2"],
    command:
      "snakemake --software-deployment-method conda $apptainer --cores $proc --resources usage=100 --rerun-incomplete --nolock -s $snakefile --configfile $config --config ...",
    inputs: ["CLI flags", "default YAML configs", "host paths", "optional database installation request"],
    outputs: ["Snakemake config overrides", "temporary/cache variables", "Singularity bind list"],
    configKeys: ["sample", "loc", "fastq", "proc", "mode", "assembler", "binmode"],
    parameters: [
      { name: "apptainer_status", value: "TRUE by default; disabled by --conda_envs_only", source: "mmlong2" },
      { name: "TMPDIR", value: "--temporary_dir or inherited $TMPDIR", source: "mmlong2" }
    ],
    detailsMdx: "wrapper.mdx",
    citations: [wrapperSource, liteConfig, procConfig]
  },
  {
    id: "assembly_metaflye",
    workflow: "lite",
    stage: "Assembly",
    label: "metaFlye assembly",
    kind: "rule",
    rules: ["Assembly_metaFlye"],
    command:
      "flye --meta --nano-hq {input} --threads {threads} --out-dir tmp/assembly --min-overlap {flye_ovlp} --asm-coverage {flye_cov}",
    inputs: ["Primary long-read FASTQ"],
    outputs: ["tmp/assembly/assembly.fasta", "tmp/assembly/assembly_info.tsv"],
    configKeys: ["assembler", "flye_cov", "flye_ovlp", "mode"],
    parameters: [
      { name: "assembler", value: "metaflye default", source: "mmlong2" },
      { name: "flye_cov", value: "3", source: "mmlong2" },
      { name: "flye_ovlp", value: "0 means auto/default handling", source: "mmlong2" }
    ],
    detailsMdx: "assembly.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "assembly_metamdbg",
    workflow: "lite",
    stage: "Assembly",
    label: "metaMDBG assembly",
    kind: "rule",
    rules: ["Assembly_metaMDBG"],
    command: "metaMDBG asm {input} tmp/assembly --threads {threads}",
    inputs: ["Primary long-read FASTQ"],
    outputs: ["tmp/assembly/contigs.fasta", "tmp/assembly/assembly_info.tsv"],
    configKeys: ["assembler", "mode"],
    parameters: [
      { name: "assembler", value: "metamdbg when --use_metamdbg is set", source: "mmlong2" }
    ],
    detailsMdx: "assembly.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "assembly_myloasm",
    workflow: "lite",
    stage: "Assembly",
    label: "myloasm assembly",
    kind: "rule",
    rules: ["Assembly_myloasm"],
    command:
      "myloasm assemble --reads {input} --output-dir tmp/assembly --threads {threads} --min-coverage {myloasm_cov} --min-overlap {myloasm_ovlp} {myloasm_extra}",
    inputs: ["Primary long-read FASTQ"],
    outputs: ["tmp/assembly/assembly.fa", "tmp/assembly/assembly_info.tsv"],
    configKeys: ["assembler", "myloasm_cov", "myloasm_ovlp", "myloasm_extra"],
    parameters: [
      { name: "myloasm_cov", value: "1", source: "mmlong2" },
      { name: "myloasm_ovlp", value: "500", source: "mmlong2" },
      { name: "myloasm_extra", value: "FALSE by default; comma-expanded from --extra_myloasm", source: "mmlong2" }
    ],
    detailsMdx: "assembly.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "assembly_custom",
    workflow: "lite",
    stage: "Assembly",
    label: "Custom assembly import",
    kind: "rule",
    rules: ["Assembly_custom"],
    command: "seqkit replace -p '\\s.+' {custom_assembly} > tmp/assembly/assembly_custom.fa",
    inputs: ["User-provided assembly FASTA", "Optional metaFlye-style assembly info"],
    outputs: ["tmp/assembly/assembly_custom.fa", "tmp/assembly/assembly_info.tsv"],
    configKeys: ["custom_assembly", "assembly_info"],
    parameters: [
      { name: "custom_assembly", value: "FALSE until --custom_assembly is supplied", source: "mmlong2" },
      { name: "assembly_info", value: "FALSE unless --custom_assembly_info is supplied", source: "mmlong2" }
    ],
    detailsMdx: "assembly.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "assembly_selected",
    workflow: "lite",
    stage: "Assembly",
    label: "Selected assembly artifact",
    kind: "decision",
    rules: ["get_assembler", "get_assembly", "get_asm_info"],
    command:
      "config['assembler'], custom_assembly, medaka_status, and curation_status determine which FASTA and assembly_info.tsv path downstream rules consume",
    inputs: [
      "metaFlye assembly",
      "metaMDBG assembly",
      "myloasm assembly",
      "custom assembly import"
    ],
    outputs: ["Selected assembly FASTA path", "Selected assembly_info.tsv path"],
    configKeys: ["assembler", "custom_assembly", "assembly_info", "medaka_status", "curation_status"],
    parameters: [
      { name: "default assembler", value: "metaflye", source: "mmlong2" },
      { name: "custom path", value: "active when --custom_assembly is supplied", source: "mmlong2" },
      { name: "Medaka path", value: "active only when medaka_status is TRUE", source: "mmlong2" }
    ],
    detailsMdx: "assembly.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "polishing",
    workflow: "lite",
    stage: "Polishing",
    label: "Optional Medaka polishing",
    kind: "rule",
    rules: ["Polishing_prep", "Polishing_consensus", "Polishing_stitch"],
    command:
      "medaka_consensus -i {fastq} -d lin_contigs_id_{split}.fasta -o tmp/polishing/{split} -m {medak_mod_pol} -t {threads}",
    inputs: ["Nanopore assembly", "Primary Nanopore FASTQ"],
    outputs: ["tmp/polishing/asm_pol.fasta"],
    configKeys: ["medaka_status", "medaka_split", "medaka_batch", "medak_mod_pol"],
    parameters: [
      { name: "medaka_status", value: "FALSE by default; TRUE with --use_medaka or --medaka_model", source: "mmlong2" },
      { name: "medak_mod_pol", value: "r1041_e82_400bps_sup_v5.0.0", source: "mmlong2" },
      { name: "PacBio behavior", value: "forced FALSE for PacBio-HiFi in wrapper", source: "mmlong2" }
    ],
    detailsMdx: "polishing.mdx",
    citations: [wrapperSource, liteSource, liteConfig]
  },
  {
    id: "curation",
    workflow: "lite",
    stage: "Curation",
    label: "Assembly curation",
    kind: "rule",
    rules: ["Curation_map", "Curation_screening", "Curation_aggregate", "Curation_selection"],
    command:
      "minimap2 ... | samtools sort ...; bam_error_detector ...; seqkit grep/subseq to write tmp/curation/asm_curated.fasta",
    inputs: ["Selected assembly", "Primary FASTQ", "assembly_info.tsv"],
    outputs: ["tmp/curation/asm_curated.fasta", "tmp/curation/assembly_info.tsv"],
    configKeys: ["curation_status", "min_dist", "min_len_zerocov", "clip_ratio", "min_cov_clip", "min_cov_clip_all"],
    parameters: [
      { name: "curation_status", value: "TRUE by default; FALSE with --skip_assembly_curation", source: "mmlong2" },
      { name: "clip_ratio", value: "0.9", source: "mmlong2" },
      { name: "min_dist", value: "500", source: "mmlong2" }
    ],
    detailsMdx: "curation.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "filter_length",
    workflow: "lite",
    stage: "Filtering",
    label: "Length and header filtering",
    kind: "rule",
    rules: ["Filtering_length"],
    command: "seqkit seq -m {min_contig_len} {assembly} | seqkit replace -p '\\\\s.+' | seqkit replace -p ^ -r {sample}_ > asm_filt_len.fasta",
    inputs: ["Curated, polished, or raw assembly"],
    outputs: ["tmp/filtering/asm_filt_len.fasta"],
    configKeys: ["min_contig_len", "min_contig_cov"],
    parameters: [
      { name: "min_contig_len", value: "3000", source: "mmlong2" },
      { name: "min_contig_cov", value: "0", source: "mmlong2" }
    ],
    detailsMdx: "filtering.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "filter_domain",
    workflow: "lite",
    stage: "Filtering",
    label: "Domain FASTA split",
    kind: "rule",
    rules: ["Filtering_eukaryotes"],
    command:
      "seqkit grep -f selected_prok_headers asm_filt_len.fasta > asm_filt_prok.fasta; seqkit grep -f selected_euk_headers asm_filt_len.fasta > asm_filt_euk.fasta",
    inputs: ["tmp/filtering/asm_filt_len.fasta", "Tiara or Whokaryote prok/euk header lists"],
    outputs: ["tmp/filtering/asm_filt_prok.fasta", "tmp/filtering/asm_filt_euk.fasta"],
    configKeys: ["tiara_status", "min_contig_len"],
    parameters: [
      { name: "tiara_status", value: "TRUE by default; FALSE with --use_whokaryote", source: "mmlong2" },
      { name: "unknown labels", value: "retained in both Tiara prok/euk header lists", source: "mmlong2" }
    ],
    detailsMdx: "filtering.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "domain_tiara",
    workflow: "lite",
    stage: "Filtering",
    label: "Tiara domain classification",
    kind: "rule",
    rules: ["Filtering_tiara"],
    command:
      "tiara -i tmp/filtering/asm_filt_len.fasta -t {threads} -m {min_contig_len} -o tmp/filtering/tiara.tsv",
    inputs: ["tmp/filtering/asm_filt_len.fasta"],
    outputs: ["tmp/filtering/contigs_filt_prok.txt", "tmp/filtering/contigs_filt_euk.txt"],
    configKeys: ["tiara_status", "min_contig_len"],
    parameters: [
      { name: "tiara_status", value: "TRUE by default", source: "mmlong2" },
      { name: "prok list", value: "prokarya, bacteria, archaea, unknown", source: "mmlong2" },
      { name: "euk list", value: "eukarya, organelle, unknown", source: "mmlong2" }
    ],
    detailsMdx: "filtering.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "domain_whokaryote",
    workflow: "lite",
    stage: "Filtering",
    label: "Whokaryote domain classification",
    kind: "rule",
    rules: ["Filtering_whokaryote"],
    command:
      "whokaryote.py --contigs tmp/filtering/asm_filt_len.fasta --threads {threads} --minsize {min_contig_len} --outdir tmp/filtering/whokaryote",
    inputs: ["tmp/filtering/asm_filt_len.fasta"],
    outputs: [
      "tmp/filtering/whokaryote/prokaryote_contig_headers.txt",
      "tmp/filtering/whokaryote/eukaryote_contig_headers.txt"
    ],
    configKeys: ["tiara_status", "min_contig_len"],
    parameters: [
      { name: "activation", value: "used when --use_whokaryote sets tiara_status FALSE", source: "mmlong2" },
      { name: "minsize", value: "min_contig_len, default 3000", source: "mmlong2" }
    ],
    detailsMdx: "filtering.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "eukaryote_contigs",
    workflow: "lite",
    stage: "Filtering",
    label: "Eukaryotic/ambiguous contigs",
    kind: "output",
    rules: ["Filtering_eukaryotes"],
    inputs: ["tmp/filtering/asm_filt_euk.fasta"],
    outputs: ["Eukaryote/unknown FASTA retained under tmp/filtering"],
    configKeys: ["tiara_status"],
    parameters: [
      { name: "unknown handling", value: "included in eukaryote list for Tiara path", source: "mmlong2" },
      { name: "production MAG path", value: "uses asm_filt_prok.fasta, not asm_filt_euk.fasta", source: "mmlong2" }
    ],
    detailsMdx: "filtering.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "singleton_circular",
    workflow: "lite",
    stage: "Singletons",
    label: "Circular singleton candidates",
    kind: "rule",
    rules: ["Singletons_circ"],
    command:
      "awk keeps assembly_info rows where length >= min_mag_len and circular flag == Y; samtools faidx extracts each candidate FASTA",
    inputs: [
      "tmp/filtering/asm_filt_len.fasta",
      "tmp/filtering/assembly_info.tsv",
      "tmp/filtering/asm_filt_prok.fasta"
    ],
    outputs: ["tmp/binning/singl/contig_c.tsv", "tmp/binning/singl/innit/{sample}.bin.c.*.fa"],
    configKeys: ["min_mag_len"],
    parameters: [
      { name: "minimum circular singleton length", value: "min_mag_len = 250000", source: "mmlong2" },
      { name: "circular flag", value: "assembly_info column 4 must be Y", source: "mmlong2" }
    ],
    detailsMdx: "singletons.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "singleton_linear",
    workflow: "lite",
    stage: "Singletons",
    label: "Linear/fallback singleton candidates",
    kind: "rule",
    rules: ["Singletons_lin"],
    command:
      "awk keeps non-circular assembly_info rows where length >= min_smag_len; if no circular or linear candidate exists, the largest contig is kept as a fallback candidate",
    inputs: [
      "tmp/filtering/asm_filt_len.fasta",
      "tmp/filtering/assembly_info.tsv",
      "tmp/binning/singl/contig_c.tsv"
    ],
    outputs: ["tmp/binning/singl/contig_l.tsv", "tmp/binning/singl/innit/{sample}.bin.s.*.fa"],
    configKeys: ["min_smag_len"],
    parameters: [
      { name: "minimum linear singleton length", value: "min_smag_len = 1000000", source: "mmlong2" },
      { name: "fallback", value: "largest contig is retained only when no candidate was found", source: "mmlong2" }
    ],
    detailsMdx: "singletons.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "singletons",
    workflow: "lite",
    stage: "Singletons",
    label: "Singleton CheckM2 selection",
    kind: "aggregate",
    rules: ["Singletons_qc"],
    command:
      "checkm2 predict scores candidate singleton FASTAs; awk keeps circular candidates by circular thresholds and linear candidates by linear thresholds",
    inputs: ["tmp/binning/singl/contig_l.tsv", "tmp/binning/singl/innit/*.fa"],
    outputs: [
      "tmp/binning/singl/bins/*.fa",
      "tmp/binning/singl/checkm2.tsv",
      "tmp/binning/singl/bins_keep.txt",
      "tmp/binning/singl/binned.txt"
    ],
    configKeys: ["circ_prob", "min_smag_len", "min_compl_circ", "min_compl_lin", "min_cont_singl"],
    parameters: [
      { name: "min_smag_len", value: "1000000", source: "mmlong2" },
      { name: "min_compl_circ", value: "80", source: "mmlong2" },
      { name: "min_compl_lin", value: "90", source: "mmlong2" },
      { name: "min_cont_singl", value: "10", source: "mmlong2" }
    ],
    detailsMdx: "singletons.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "coverage_prep",
    workflow: "lite",
    stage: "Coverage",
    label: "Coverage read manifest",
    kind: "rule",
    rules: ["Coverage_prep"],
    command:
      "printf '{read_type},{fastq}\\n' > reads.csv; append differential-coverage CSV; create numbered symlinks in tmp/binning/mapping",
    inputs: ["Primary FASTQ", "Optional differential coverage CSV"],
    outputs: ["tmp/binning/mapping/reads.csv", "tmp/binning/mapping/{n}-{type}.lnk"],
    configKeys: ["reads_diffcov", "mode"],
    parameters: [
      { name: "primary read type", value: "NP for Nanopore-simplex, PB for PacBio-HiFi", source: "mmlong2" }
    ],
    detailsMdx: "coverage.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "coverage_map",
    workflow: "lite",
    stage: "Coverage",
    label: "Read mapping and depth",
    kind: "rule",
    rules: ["Coverage_map"],
    command:
      "minimap2 -I {minimap_ram}G -K {minimap_ref}G -ax {mode_preset} asm_filt_len.fasta reads | samtools sort --write-index ...; jgi_summarize_bam_contig_depths --percentIdentity {identity}",
    inputs: ["Read symlink", "tmp/filtering/asm_filt_len.fasta"],
    outputs: ["tmp/binning/mapping/{reads}.bam", "tmp/binning/mapping/{reads}.tsv"],
    configKeys: ["minimap_np", "minimap_pb", "minimap_il", "np_map_ident", "pb_map_ident", "il_map_ident"],
    parameters: [
      { name: "minimap_np", value: "lr:hq", source: "mmlong2" },
      { name: "minimap_pb", value: "map-hifi", source: "mmlong2" },
      { name: "minimap_il", value: "sr", source: "mmlong2" },
      { name: "identity thresholds", value: "NP 95, PB 97, IL 97", source: "mmlong2" }
    ],
    detailsMdx: "coverage.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "coverage_aggregate",
    workflow: "lite",
    stage: "Coverage",
    label: "Coverage matrices",
    kind: "aggregate",
    rules: ["Coverage_aggregate"],
    command: "paste -d '\\t' $(ls -v *_tr1.tsv) > cov_all.tsv; paste -d '\\t' $(ls -v *_tr2.tsv) > cov_all_sub.tsv",
    inputs: ["Per-read contig depth TSV files"],
    outputs: ["tmp/binning/mapping/cov_all.tsv", "tmp/binning/mapping/cov_all_sub.tsv"],
    configKeys: ["cov_method"],
    parameters: [
      { name: "cov_all.tsv", value: "full contig length/coverage columns for MetaBAT2 and summaries", source: "mmlong2" },
      { name: "cov_all_sub.tsv", value: "reduced coverage matrix for VAMB", source: "mmlong2" }
    ],
    detailsMdx: "coverage.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "binning_prep",
    workflow: "lite",
    stage: "Binning",
    label: "Iterative binning prep",
    kind: "aggregate",
    rules: ["Binning_prep_innit", "Binning_prep_main", "Comebin_prep_innit", "Comebin_prep_main"],
    command:
      "seqkit grep remaining contigs; subset cov.tsv/cov_sub.tsv; for COMEBin, subset BAM records for each round",
    inputs: ["Filtered prokaryotic contigs", "coverage matrices", "previous-round binned contig IDs"],
    outputs: ["round_{n}/contigs.fasta", "round_{n}/cov.tsv", "round_{n}/cov_sub.tsv", "round_{n}/mapping/*.bam"],
    configKeys: ["binmode", "reads_diffcov"],
    parameters: [
      { name: "rounds", value: "fast/default: round 1; extended: rounds 1-4", source: "mmlong2" },
      { name: "binmode", value: "default", source: "mmlong2" }
    ],
    detailsMdx: "binning-prep.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "metabat2",
    workflow: "lite",
    stage: "Binning",
    label: "MetaBAT2",
    kind: "algorithm",
    rules: ["Binning_metabat2"],
    command:
      "metabat2 -i round_{n}/contigs.fasta -a round_{n}/cov.tsv -o round_{n}/metabat2/bins_metabat2 -t {threads} -m {min_contig_len} -s {min_mag_len} --saveCls --seed {seed}",
    inputs: ["round_{n}/contigs.fasta", "round_{n}/cov.tsv"],
    outputs: ["round_{n}/metabat2/bins_metabat2.MemberMatrix.txt", "round_{n}/metabat2/*.fa"],
    configKeys: ["seed", "min_contig_len", "min_mag_len"],
    parameters: [
      { name: "seed", value: "15690701", source: "mmlong2" },
      { name: "minimum contig length (-m)", value: "3000", source: "mmlong2" },
      { name: "minimum bin size (-s)", value: "250000", source: "mmlong2" }
    ],
    detailsMdx: "metabat2.mdx",
    citations: [liteSource, liteConfig, metabatPaper]
  },
  {
    id: "vamb",
    workflow: "lite",
    stage: "Embedding",
    label: "VAMB VAE embedding",
    kind: "algorithm",
    rules: ["Binning_vamb"],
    command:
      "vamb bin default --fasta round_{n}/contigs.fasta --outdir round_{n}/vamb -m {min_contig_len} --minfasta {min_mag_len} -p {threads} --abundance_tsv round_{n}/cov_sub.tsv -o '' --seed {seed}",
    inputs: ["round_{n}/contigs.fasta", "round_{n}/cov_sub.tsv"],
    outputs: [
      "learned VAE latent representation",
      "latent representation consumed by VAMB clustering"
    ],
    configKeys: ["seed", "min_contig_len", "min_mag_len"],
    parameters: [
      { name: "seed", value: "15690701", source: "mmlong2" },
      { name: "minimum contig length (-m)", value: "3000", source: "mmlong2" },
      { name: "minimum FASTA/bin size (--minfasta)", value: "250000", source: "mmlong2" },
      { name: "VAE architecture/loss weights", value: "upstream default for installed VAMB", source: "upstream" }
    ],
    detailsMdx: "vamb.mdx",
    citations: [liteSource, liteConfig, vambDocs, vambPaper]
  },
  {
    id: "vamb_clustering",
    workflow: "lite",
    stage: "Binning",
    label: "VAMB latent clustering",
    kind: "algorithm",
    rules: ["Binning_vamb"],
    command:
      "Upstream inside vamb bin default: VAE latent representation -> VAMB clustering -> vae_clusters_unsplit.tsv and bins/",
    inputs: [
      "learned VAMB latent representation",
      "round_{n}/contigs.fasta",
      "round_{n}/cov_sub.tsv"
    ],
    outputs: ["round_{n}/vamb/vae_clusters_unsplit.tsv", "round_{n}/vamb/bins"],
    configKeys: ["seed", "min_contig_len", "min_mag_len"],
    parameters: [
      { name: "minimum contig length", value: "3000 bp via -m", source: "mmlong2" },
      { name: "minimum FASTA/bin size", value: "250000 bp via --minfasta", source: "mmlong2" },
      { name: "latent clustering parameters", value: "upstream VAMB defaults", source: "upstream" }
    ],
    detailsMdx: "vamb-clustering.mdx",
    citations: [liteSource, liteConfig, vambDocs, vambPaper]
  },
  {
    id: "semibin2",
    workflow: "lite",
    stage: "Embedding",
    label: "SemiBin2 representation model",
    kind: "algorithm",
    rules: ["Binning_semibin2"],
    command:
      "SemiBin2 single_easy_bin -i round_{n}/contigs.fasta -b {bam_inputs} -o round_{n}/semibin -p {threads} -m {min_contig_len} --minfasta-kbs {min_mag_len/1000} --self-supervised --sequencing-type long_read --engine cpu --orf-finder {semibin_prot} --compression none --random-seed {seed}",
    inputs: ["round_{n}/contigs.fasta", "BAM files or coverage files from mapping"],
    outputs: [
      "learned self-supervised contig representation",
      "embedding consumed by SemiBin2 long-read DBSCAN integration"
    ],
    configKeys: ["semibin_mod", "semibin_prot", "seed", "min_contig_len", "min_mag_len"],
    parameters: [
      { name: "semibin_mod", value: "global", source: "mmlong2" },
      { name: "semibin_prot", value: "prodigal", source: "mmlong2" },
      { name: "self-supervised", value: "enabled", source: "mmlong2" },
      { name: "sequencing type", value: "long_read", source: "mmlong2" },
      { name: "engine", value: "cpu", source: "mmlong2" },
      { name: "compression", value: "none", source: "mmlong2" },
      { name: "seed", value: "15690701", source: "mmlong2" }
    ],
    detailsMdx: "semibin2.mdx",
    citations: [liteSource, liteConfig, semibinDocs, semibinPaper]
  },
  {
    id: "semibin2_clustering",
    workflow: "lite",
    stage: "Binning",
    label: "SemiBin2 DBSCAN integration",
    kind: "algorithm",
    rules: ["Binning_semibin2"],
    command:
      "Upstream inside SemiBin2 single_easy_bin: learned embeddings -> DBSCAN epsilon ensemble -> single-copy-marker integration -> round_{n}/semibin/output_bins",
    inputs: [
      "learned SemiBin2 contig embeddings",
      "round_{n}/contigs.fasta",
      "107 single-copy marker gene calls"
    ],
    outputs: ["round_{n}/semibin/bins_info.tsv", "round_{n}/semibin/output_bins"],
    configKeys: ["semibin_mod", "semibin_prot", "min_mag_len"],
    parameters: [
      { name: "epsilon ensemble", value: "DBSCAN over multiple epsilon values", source: "upstream" },
      { name: "marker integration", value: "107 single-copy marker genes", source: "upstream" },
      { name: "minimum FASTA/bin size", value: "250000 bp via --minfasta-kbs 250", source: "mmlong2" }
    ],
    detailsMdx: "semibin2-clustering.mdx",
    citations: [liteSource, liteConfig, semibinDocs, semibinPaper]
  },
  {
    id: "comebin",
    workflow: "lite",
    stage: "Embedding",
    label: "COMEBin contrastive embedding",
    kind: "algorithm",
    rules: ["Binning_comebin"],
    command:
      "run_comebin.sh -a round_{n}/contigs.fasta -o round_{n}/comebin -t {threads} -p round_{n}/mapping -b min(number_of_contigs, 1024)",
    inputs: ["round_{n}/contigs.fasta", "round_{n}/mapping/*.bam"],
    outputs: [
      "multi-view contig embeddings",
      "embeddings consumed by COMEBin Leiden clustering"
    ],
    configKeys: ["min_contig_len"],
    parameters: [
      { name: "batch size", value: "number of contigs if <1024, otherwise 1024", source: "mmlong2" },
      { name: "COMEBin network/loss", value: "upstream defaults in run_comebin.sh", source: "upstream" }
    ],
    detailsMdx: "comebin.mdx",
    citations: [liteSource, liteConfig, comebinPaper]
  },
  {
    id: "comebin_clustering",
    workflow: "lite",
    stage: "Binning",
    label: "COMEBin Leiden clustering",
    kind: "algorithm",
    rules: ["Binning_comebin"],
    command:
      "Upstream inside run_comebin.sh: multi-view embeddings -> nearest-neighbor similarity graph -> Leiden clustering sweep -> comebin_res_bins",
    inputs: ["multi-view COMEBin contig embeddings", "round_{n}/contigs.fasta", "round_{n}/mapping/*.bam"],
    outputs: [
      "round_{n}/comebin/comebin_res/comebin_res.tsv",
      "round_{n}/comebin/comebin_res/comebin_res_bins"
    ],
    configKeys: ["min_contig_len"],
    parameters: [
      { name: "batch size", value: "number of contigs if <1024, otherwise 1024", source: "mmlong2" },
      { name: "similarity graph and Leiden sweep", value: "upstream COMEBin behavior", source: "upstream" }
    ],
    detailsMdx: "comebin-clustering.mdx",
    citations: [liteSource, liteConfig, comebinPaper]
  },
  {
    id: "candidate_bins",
    workflow: "lite",
    stage: "Binning",
    label: "Candidate bin sets",
    kind: "aggregate",
    rules: ["Binning_metabat2", "Binning_vamb", "Binning_semibin2", "Binning_comebin"],
    command:
      "Tool-specific clustering converts contig features or learned embeddings into FASTA bin directories and membership tables for the current round.",
    inputs: [
      "MetaBAT2 abundance/TNF partitions",
      "VAMB latent clusters",
      "SemiBin2 DBSCAN/marker-integrated bins",
      "COMEBin Leiden clusters"
    ],
    outputs: [
      "round_{n}/metabat2/*.fa",
      "round_{n}/vamb/bins",
      "round_{n}/semibin/output_bins",
      "round_{n}/comebin/comebin_res/comebin_res_bins"
    ],
    configKeys: ["binmode", "min_contig_len", "min_mag_len"],
    parameters: [
      { name: "fast mode", value: "SemiBin2 candidate bins go directly to CheckM2", source: "mmlong2" },
      { name: "default mode", value: "MetaBAT2, VAMB, and SemiBin2 candidates feed Binette", source: "mmlong2" },
      { name: "extended mode", value: "COMEBin and later-round MetaBAT2 can be evaluated directly", source: "mmlong2" }
    ],
    detailsMdx: "candidate-bins.mdx",
    citations: [liteSource, liteConfig, vambDocs, vambPaper, semibinDocs, semibinPaper, comebinPaper, metabatPaper]
  },
  {
    id: "binette",
    workflow: "lite",
    stage: "Binning",
    label: "Binette ensemble refinement",
    kind: "algorithm",
    rules: ["Binning_binette"],
    command:
      "binette -d round_{n}/vamb/bins round_{n}/metabat2 round_{n}/semibin/output_bins -c round_{n}/contigs.fasta -o round_{n}/binette -w {binette_weight} -m {min_compl} -t {threads}",
    inputs: ["VAMB bins", "MetaBAT2 bins", "SemiBin2 bins", "round_{n}/contigs.fasta"],
    outputs: ["round_{n}/binette/final_bins_quality_reports.tsv", "round_{n}/binette/final_bins"],
    configKeys: ["binette_weight", "min_compl_1", "min_compl_2"],
    parameters: [
      { name: "binette_weight", value: "5", source: "mmlong2" },
      { name: "round 1 extended min completeness", value: "90", source: "mmlong2" },
      { name: "other-round min completeness", value: "50", source: "mmlong2" }
    ],
    detailsMdx: "binette.mdx",
    citations: [liteSource, liteConfig, binetteDocs]
  },
  {
    id: "binmode_router",
    workflow: "lite",
    stage: "Binning",
    label: "Binning-mode source selector",
    kind: "decision",
    rules: ["get_rounds", "get_qc_in", "get_qc_dir"],
    command:
      "Python helper functions choose which candidate source is evaluated by CheckM2 for each binmode and round",
    inputs: [
      "SemiBin2 candidates",
      "COMEBin candidates",
      "MetaBAT2 candidates",
      "Binette refined candidates"
    ],
    outputs: ["Selected candidate report", "Selected candidate FASTA directory"],
    configKeys: ["binmode"],
    parameters: [
      { name: "fast", value: "round 1 uses SemiBin2 directly", source: "mmlong2" },
      { name: "default", value: "round 1 uses Binette", source: "mmlong2" },
      { name: "extended round 2", value: "uses COMEBin directly", source: "mmlong2" },
      { name: "extended round 4", value: "uses MetaBAT2 directly", source: "mmlong2" }
    ],
    detailsMdx: "binning-qc.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "binning_qc",
    workflow: "lite",
    stage: "Binning Evaluation",
    label: "CheckM2 round evaluation",
    kind: "aggregate",
    rules: ["Binning_qc"],
    command:
      "checkm2 predict -x .fa -i bins_innit -o checkm2 -t {threads}; keep bins with completeness >= threshold and contamination <= threshold",
    inputs: ["Selected binner output for each round"],
    outputs: ["round_{n}/checkm2.tsv", "round_{n}/bins_keep.txt", "round_{n}/bins/*.fa"],
    configKeys: ["min_compl_1", "min_compl_2", "min_cont_1", "min_cont_2"],
    parameters: [
      { name: "min_compl_1", value: "90", source: "mmlong2" },
      { name: "min_compl_2", value: "50", source: "mmlong2" },
      { name: "min_cont_1", value: "5", source: "mmlong2" },
      { name: "min_cont_2", value: "10", source: "mmlong2" }
    ],
    detailsMdx: "binning-qc.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "mag_aggregate",
    workflow: "lite",
    stage: "Binning Evaluation",
    label: "MAG candidate aggregation",
    kind: "aggregate",
    rules: ["Binning_aggregate"],
    command:
      "rsync tmp/binning/*/bins/*.fa tmp/binning/bins_innit/; concatenate kept CheckM2 rows from singl and all active rounds into tmp/binning/checkm2.tsv",
    inputs: ["tmp/binning/singl/bins/*.fa", "round_{n}/bins/*.fa", "singl and round bins_keep.txt files"],
    outputs: ["tmp/binning/bins_innit/*.fa", "tmp/binning/checkm2.tsv"],
    configKeys: ["binmode"],
    parameters: [
      { name: "singleton source", value: "tmp/binning/singl/bins/*.fa", source: "mmlong2" },
      { name: "round sources", value: "tmp/binning/round_{n}/bins/*.fa", source: "mmlong2" },
      { name: "active rounds", value: "get_rounds(binmode)", source: "mmlong2" }
    ],
    detailsMdx: "binning-qc.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "checkm_qc2",
    workflow: "lite",
    stage: "Binning Evaluation",
    label: "CheckM final evaluation",
    kind: "aggregate",
    rules: ["Binning_qc2"],
    command:
      "checkm lineage_wf ...; keep bins when completeness >= {min_compl_checkm1}, contamination <= {min_cont_checkm1}, and completeness - contamination * 5 > {min_score_checkm1}",
    inputs: ["tmp/binning/checkm2.tsv", "tmp/binning/bins_innit/*.fa"],
    outputs: ["tmp/binning/checkm1.tsv", "tmp/binning/bins_keep.txt", "results/bins/*.fa"],
    configKeys: ["min_compl_checkm1", "min_cont_checkm1", "min_score_checkm1"],
    parameters: [
      { name: "min_compl_checkm1", value: "50", source: "mmlong2" },
      { name: "min_cont_checkm1", value: "10", source: "mmlong2" },
      { name: "min_score_checkm1", value: "30", source: "mmlong2" },
      { name: "score formula", value: "completeness - contamination * 5", source: "mmlong2" }
    ],
    detailsMdx: "binning-qc.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "summary_lite",
    workflow: "lite",
    stage: "Summary",
    label: "Bin abundance and statistics",
    kind: "aggregate",
    rules: ["Summary_coverage", "Summary_stats", "Summary_usage", "Finalise"],
    command:
      "coverm genome ... -m {cov_method}; quast.py results/bins/*.fa ...; R merges CheckM, CheckM2, QUAST, coverage, abundance",
    inputs: ["results/bins/*.fa", "BAM files", "CheckM/CheckM2 outputs"],
    outputs: ["results/{sample}_bins.tsv", "results/dependencies.csv", "results/{sample}_usage.tsv"],
    configKeys: ["cov_method", "sample", "mode", "binmode", "version"],
    parameters: [
      { name: "cov_method", value: "mean", source: "mmlong2" },
      { name: "wf_v", value: "1.2.1", source: "mmlong2" }
    ],
    detailsMdx: "summary.mdx",
    citations: [liteSource, liteConfig]
  },
  {
    id: "taxonomy",
    workflow: "proc",
    stage: "Taxonomy",
    label: "Genome, contig, and 16S taxonomy",
    kind: "aggregate",
    rules: ["Taxonomy_bins", "Taxonomy_contigs", "Taxonomy_rrna", "Taxonomy_aggregate"],
    command:
      "gtdbtk classify_wf ...; metabuli classify assembly.fasta ...; barrnap + usearch_global against rRNA database; R aggregates taxonomic tables",
    inputs: ["results/bins/*.fa", "results/{sample}_assembly.fasta", "contig-bin map", "taxonomy databases"],
    outputs: ["tmp/taxa/bins_taxonomy.tsv", "tmp/taxa/contigs_taxonomy.tsv", "results/{sample}_16S.fa"],
    configKeys: ["db_gtdb", "db_metabuli", "db_rrna", "min_len_ssu", "min_id_ssu", "ssu"],
    parameters: [
      { name: "min_len_ssu", value: "500", source: "mmlong2" },
      { name: "min_id_ssu", value: "0.75", source: "mmlong2" },
      { name: "ssu", value: "16S", source: "mmlong2" }
    ],
    detailsMdx: "taxonomy.mdx",
    citations: [procSource, procConfig]
  },
  {
    id: "annotation",
    workflow: "proc",
    stage: "Annotation",
    label: "MAG annotation",
    kind: "aggregate",
    rules: ["Annotation_rrna", "Annotation_trna", "Annotation_trna_sum", "Annotation_bins", "Annotation_bins_sum", "Annotation_aggregate"],
    command:
      "barrnap ...; tRNAscan-SE ...; bakta --db {db_bakta} --meta --force ...; aggregate rRNA, tRNA, and Bakta summaries",
    inputs: ["results/bins/*.fa", "Bakta database"],
    outputs: ["tmp/annotation/bins_annotation.tsv", "results/bakta/"],
    configKeys: ["db_bakta", "db_barrnap", "db_trnascan", "bakta_extra"],
    parameters: [
      { name: "db_barrnap", value: "arc", source: "mmlong2" },
      { name: "db_trnascan", value: "A", source: "mmlong2" },
      { name: "bakta_extra", value: "FALSE by default", source: "mmlong2" }
    ],
    detailsMdx: "annotation.mdx",
    citations: [procSource, procConfig]
  },
  {
    id: "extraqc",
    workflow: "proc",
    stage: "Extra QC",
    label: "Chimerism and microdiversity QC",
    kind: "aggregate",
    rules: ["ExtraQC_variants_prep", "ExtraQC_variants_call", "ExtraQC_variants_sum", "ExtraQC_contamination", "ExtraQC_aggregate"],
    command:
      "samtools extracts mapped reads; longshot calls variants; gunc run scores bins; R merges variant and GUNC summaries",
    inputs: ["results/bins/*.fa", "primary-read BAM", "GUNC database"],
    outputs: ["tmp/extra_qc/bins_extraqc.tsv", "tmp/extra_qc/contigs_extraqc.tsv"],
    configKeys: ["db_gunc", "min_cov", "min_mapq", "min_frac", "min_count"],
    parameters: [
      { name: "min_cov", value: "6", source: "mmlong2" },
      { name: "min_mapq", value: "18", source: "mmlong2" },
      { name: "min_frac", value: "0.1", source: "mmlong2" },
      { name: "min_count", value: "3", source: "mmlong2" }
    ],
    detailsMdx: "extraqc.mdx",
    citations: [procSource, procConfig]
  },
  {
    id: "stats",
    workflow: "proc",
    stage: "Stats",
    label: "Read, contig, and mapping stats",
    kind: "aggregate",
    rules: ["Stats_seq", "Stats_map", "Stats_aggregate", "Summary_usage"],
    command:
      "nanoq reads/assembly; seqkit GC; cramino mapping stats; R aggregates sample-level and contig-level tables",
    inputs: ["Primary FASTQ", "results/{sample}_assembly.fasta", "primary-read BAM"],
    outputs: ["tmp/stats/gen_stats.tsv", "tmp/stats/contigs_stats.tsv", "tmp/logs/summary_mmlong2-proc.tsv"],
    configKeys: ["mode", "proc", "split_max"],
    parameters: [
      { name: "split_max", value: "30", source: "mmlong2" }
    ],
    detailsMdx: "stats.mdx",
    citations: [procSource, procConfig]
  },
  {
    id: "finalise_proc",
    workflow: "proc",
    stage: "Final Outputs",
    label: "Final result dataframes",
    kind: "output",
    rules: ["Finalise"],
    command:
      "R merges general stats, contig taxonomy/stats/QC, bin recovery/QC/taxonomy/annotation, dependencies, and databases",
    inputs: ["Lite bins table", "stats", "taxonomy", "annotation", "extra QC", "usage summaries"],
    outputs: ["results/{sample}_general.tsv", "results/{sample}_contigs.tsv", "results/{sample}_bins.tsv", "results/dependencies.csv", "results/databases.csv"],
    configKeys: ["version", "sample", "mode"],
    parameters: [
      { name: "bin_status", value: "HQ/MQ/LQ/Contaminated from MIMAG-style thresholds", source: "mmlong2" },
      { name: "wf_v", value: "1.2.1", source: "mmlong2" }
    ],
    detailsMdx: "outputs.mdx",
    citations: [procSource, procConfig]
  }
];
