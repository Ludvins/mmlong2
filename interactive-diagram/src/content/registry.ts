import type { ComponentType } from "react";

import Annotation from "./annotation.mdx";
import Assembly from "./assembly.mdx";
import Binette from "./binette.mdx";
import BinningPrep from "./binning-prep.mdx";
import BinningQc from "./binning-qc.mdx";
import CandidateBins from "./candidate-bins.mdx";
import COMEBin from "./comebin.mdx";
import COMEBinClustering from "./comebin-clustering.mdx";
import Coverage from "./coverage.mdx";
import Curation from "./curation.mdx";
import ExtraQc from "./extraqc.mdx";
import Filtering from "./filtering.mdx";
import Inputs from "./inputs.mdx";
import MetaBAT2 from "./metabat2.mdx";
import Outputs from "./outputs.mdx";
import Polishing from "./polishing.mdx";
import SemiBin2 from "./semibin2.mdx";
import SemiBin2Clustering from "./semibin2-clustering.mdx";
import Singletons from "./singletons.mdx";
import Stats from "./stats.mdx";
import Summary from "./summary.mdx";
import Taxonomy from "./taxonomy.mdx";
import VAMB from "./vamb.mdx";
import VAMBClustering from "./vamb-clustering.mdx";
import Wrapper from "./wrapper.mdx";

export const detailContent: Record<string, ComponentType> = {
  "annotation.mdx": Annotation,
  "assembly.mdx": Assembly,
  "binette.mdx": Binette,
  "binning-prep.mdx": BinningPrep,
  "binning-qc.mdx": BinningQc,
  "candidate-bins.mdx": CandidateBins,
  "comebin-clustering.mdx": COMEBinClustering,
  "comebin.mdx": COMEBin,
  "coverage.mdx": Coverage,
  "curation.mdx": Curation,
  "extraqc.mdx": ExtraQc,
  "filtering.mdx": Filtering,
  "inputs.mdx": Inputs,
  "metabat2.mdx": MetaBAT2,
  "outputs.mdx": Outputs,
  "polishing.mdx": Polishing,
  "semibin2-clustering.mdx": SemiBin2Clustering,
  "semibin2.mdx": SemiBin2,
  "singletons.mdx": Singletons,
  "stats.mdx": Stats,
  "summary.mdx": Summary,
  "taxonomy.mdx": Taxonomy,
  "vamb-clustering.mdx": VAMBClustering,
  "vamb.mdx": VAMB,
  "wrapper.mdx": Wrapper
};

export const detailContentKeys = Object.keys(detailContent);
