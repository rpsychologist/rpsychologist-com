import React from "react";
import CodeBlock from "gatsby-theme-rpsych/src/components/code/code-block";
import { version, lastUpdated } from "gatsby-theme-rpsych-likelihood/package.json"

export const LikelihoodBibTex = () => {
  const date = new Date(lastUpdated);
  const year = date.getFullYear();
  return (
    <CodeBlock>
      <code className="BibTex">
        {`@software{magnussonLikelihood,
    author = {Kristoffer Magnusson},
    title = {Understanding Maximum Likelihood: An Interactive Visualization},
    url = {https://rpsychologist.com/likelihood/},
    version = {${version}},
    date = {${year}},
  }`}
      </code>
    </CodeBlock>
  );
};

export const LikelihoodApaReference = () => {
  const date = new Date(lastUpdated);
  const year = date.getFullYear();
  return (
    <p style={{ paddingLeft: "2em", textIndent: "-2em" }}>
      Magnusson, K. ({year}).{" "}
      <em>Understanding Maximum Likelihood: An interactive visualization</em>{" "}
      (Version {version}) [Web App]. R Psychologist.
      https://rpsychologist.com/likelihood/
    </p>
  );
};
