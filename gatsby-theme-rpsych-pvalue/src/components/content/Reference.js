import React from "react";
import CodeBlock from "gatsby-theme-rpsych/src/components/code/code-block";
import { version, lastUpdated } from "gatsby-theme-rpsych-pvalue/package.json"

export const CohendBibTex = () => {
  const date = new Date(lastUpdated);
  const year = date.getFullYear();
  return (
    <CodeBlock>
      <code className="BibTex">
        {`@software{magnussonPvalueSim,
    author = {Kristoffer Magnusson},
    title = {Understanding p-values Through Simulations},
    url = {https://rpsychologist.com/pvalue/},
    version = {${version}},
    date = {${year}},
  }`}
      </code>
    </CodeBlock>
  );
};

export const CohendApaReference = () => {
  const date = new Date(lastUpdated);
  const year = date.getFullYear();
  return (
    <p style={{ paddingLeft: "2em", textIndent: "-2em" }}>
      Magnusson, K. ({year}).{" "}
      <em>Understanding p-values Through Simulations</em>{" "}
      (Version {version}) [Web App]. R Psychologist.
      https://rpsychologist.com/pvalue/
    </p>
  );
};
