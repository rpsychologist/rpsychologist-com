import React from "react";
import CodeBlock from "gatsby-theme-rpsych/src/components/code/code-block";
import { version, lastUpdated } from "gatsby-theme-rpsych-therapist-effects/package.json"

export const CohendBibTex = () => {
  const date = new Date(lastUpdated);
  const year = date.getFullYear();
  return (
    <CodeBlock>
      <code className="BibTex">
        {`
@article{magnussonCausalTherapistEffects,
  doi = {XXX},
  url = {XXX},
  year = 2023,
  month = {jun},
  publisher = {PsyArXiv},
  volume = {},
  number = {},
  pages = {},
  author = {Kristoffer Magnusson},
  title = {A Causal Inference Perspective on Therapist Effects},
  journal = {PsyArXiv}
}
      `}
      </code>
    </CodeBlock>
  );
};

export const CohendApaReference = () => {
  //const data = useSiteMetadata();
  const date = new Date(lastUpdated);
  const year = date.getFullYear();
  return (
    <p style={{ paddingLeft: "2em", textIndent: "-2em" }}>
      Magnusson, K. (2023).{" "}
      A Causal Inference Perspective on Therapist Effects. <em>PsyArXiv</em>. https://DOI
    </p>
  );
};
