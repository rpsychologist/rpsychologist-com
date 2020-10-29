import React from "react";
import CodeBlock from "gatsby-theme-rpsych/src/components/code/code-block";
import { version, lastUpdated } from "gatsby-theme-rpsych-correlation/package.json"

export const CorrelationBibTex = () => {
  const date = new Date(lastUpdated);
  const year = date.getFullYear();
  return (
    <CodeBlock>
      <code className="BibTex">
        {`@software{magnussonCorrelation,
    author = {Kristoffer Magnusson},
    title = {Interpreting Correlations: An Interactive Visualization},
    url = {https://rpsychologist.com/correlation/},
    version = {${version}},
    date = {${year}},
  }`}
      </code>
    </CodeBlock>
  );
};

export const CorrelationApaReference = () => {
  //const data = useSiteMetadata();
  const date = new Date(lastUpdated);
  const year = date.getFullYear();
  return (
    <p style={{ paddingLeft: "2em", textIndent: "-2em" }}>
      Magnusson, K. ({year}).{" "}
      <em>Interpreting Correlations: An interactive visualization</em>{" "}
      (Version {version}) [Web App]. R Psychologist.
      https://rpsychologist.com/correlation/
    </p>
  );
};
